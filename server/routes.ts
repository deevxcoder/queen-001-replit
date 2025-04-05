import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { hashPassword, comparePasswords } from "./auth-utils";
import { UserRole, UserStatus, loginSchema, insertUserSchema, insertMarketSchema, insertOptionGameSchema, insertMarketGameTypeSchema, insertMarketBetSchema, insertOptionBetSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';

// Setup session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "queen-games-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        
        // Check if the password is hashed (contains $) or still in plain text
        const isPasswordMatch = user.password.includes('$') 
          ? await comparePasswords(password, user.password)
          : user.password === password; // For backward compatibility with existing accounts
        
        if (!isPasswordMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        
        if (user.status === UserStatus.BLOCKED) {
          return done(null, false, { message: "Account is blocked." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === UserRole.ADMIN) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  const isAdminOrSubadmin = (req: Request, res: Response, next: NextFunction) => {
    if (
      req.isAuthenticated() &&
      req.user &&
      ((req.user as any).role === UserRole.ADMIN || (req.user as any).role === UserRole.SUBADMIN)
    ) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Validate request body middleware
  function validateBody(schema: z.ZodType<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({ message: validationError.message });
        } else {
          res.status(400).json({ message: "Invalid request body" });
        }
      }
    };
  }

  // Auth Routes
  app.post(
    "/api/auth/login",
    validateBody(loginSchema),
    passport.authenticate("local"),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    res.json({ user: req.user });
  });
  
  // Public registration endpoint - only for players
  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res) => {
    try {
      const userData = req.body;
      
      // Force the role to be PLAYER for public registration
      userData.role = UserRole.PLAYER;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password before storing
      userData.password = await hashPassword(userData.password);
      
      const newUser = await storage.createUser(userData);
      
      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login after registration failed" });
        }
        res.status(201).json({ user: newUser });
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // User Routes
  app.post("/api/users", isAdminOrSubadmin, validateBody(insertUserSchema), async (req, res) => {
    try {
      const userData = req.body;
      
      // If subadmin is creating a user, assign it to themselves
      if ((req.user as any).role === UserRole.SUBADMIN) {
        userData.role = UserRole.PLAYER; // Subadmin can only create players
        userData.subadminId = (req.user as any).id;
      }
      
      // Hash the password before storing
      userData.password = await hashPassword(userData.password);
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users", isAdminOrSubadmin, async (req, res) => {
    try {
      // If admin, return all users
      // If subadmin, return only users assigned to them
      if ((req.user as any).role === UserRole.ADMIN) {
        const users = await storage.getUsers();
        res.json(users);
      } else {
        const users = await storage.getUsersBySubadmin((req.user as any).id);
        res.json(users);
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/:id", isAdminOrSubadmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Subadmin can only access users assigned to them
      if ((req.user as any).role === UserRole.SUBADMIN && user.subadminId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/users/:id", isAdminOrSubadmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Subadmin can only update users assigned to them
      if ((req.user as any).role === UserRole.SUBADMIN) {
        if (existingUser.subadminId !== (req.user as any).id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Subadmin cannot change role or subadminId
        delete userData.role;
        delete userData.subadminId;
      }
      
      // If user is already blocked by admin, only admin can unblock
      if (existingUser.status === UserStatus.BLOCKED && userData.status === UserStatus.ACTIVE) {
        const blockedByAdmin = await storage.getUser(existingUser.id); // Admins don't have subadminId
        if (!blockedByAdmin?.subadminId && (req.user as any).role !== UserRole.ADMIN) {
          return res.status(403).json({ message: "Only admin can unblock this user" });
        }
      }
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Wallet Routes (Fund Management)
  app.post("/api/users/:id/wallet", isAdminOrSubadmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, remarks } = req.body;
      
      if (isNaN(amount) || amount === 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Subadmin can only manage wallets of users assigned to them
      if ((req.user as any).role === UserRole.SUBADMIN && user.subadminId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create a transaction for the wallet adjustment
      const transaction = await storage.createTransaction({
        userId,
        type: "adjustment",
        amount,
        status: "approved",
        reference: "Manual adjustment",
        remarks: remarks || "Admin adjustment",
        approvedById: (req.user as any).id,
        isSubadminTransaction: false
      });
      
      // Update user's wallet balance
      const updatedUser = await storage.updateUser(userId, {
        walletBalance: user.walletBalance + amount
      });
      
      // Send real-time notification to the user
      if (updatedUser) {
        sendNotification(userId, {
          type: 'wallet_update',
          message: `Your wallet has been ${amount > 0 ? 'credited with' : 'debited by'} ${Math.abs(amount)}`,
          transaction: transaction,
          newBalance: updatedUser.walletBalance || 0
        });
      }
      
      res.json({ user: updatedUser, transaction });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Market Routes
  app.post("/api/markets", isAdmin, validateBody(insertMarketSchema), async (req, res) => {
    try {
      const market = await storage.createMarket(req.body);
      res.status(201).json(market);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/markets", isAuthenticated, async (req, res) => {
    try {
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/markets/:id", isAuthenticated, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      // Get all game types for this market
      const gameTypes = await storage.getMarketGameTypesByMarket(marketId);
      
      res.json({ ...market, gameTypes });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/markets/:id", isAdmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const market = await storage.updateMarket(marketId, req.body);
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      res.json(market);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete("/api/markets/:id", isAdmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const result = await storage.deleteMarket(marketId);
      
      if (!result) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      res.json({ message: "Market deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Market Game Type Routes
  app.post("/api/market-game-types", isAdmin, validateBody(insertMarketGameTypeSchema), async (req, res) => {
    try {
      const gameType = await storage.createMarketGameType(req.body);
      res.status(201).json(gameType);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/markets/:marketId/game-types", isAuthenticated, async (req, res) => {
    try {
      const marketId = parseInt(req.params.marketId);
      const gameTypes = await storage.getMarketGameTypesByMarket(marketId);
      res.json(gameTypes);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.get("/api/markets/:marketId/bets", isAdminOrSubadmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.marketId);
      const bets = await storage.getMarketBetsByMarket(marketId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/market-game-types/:id", isAdmin, async (req, res) => {
    try {
      const gameTypeId = parseInt(req.params.id);
      const gameType = await storage.updateMarketGameType(gameTypeId, req.body);
      
      if (!gameType) {
        return res.status(404).json({ message: "Game type not found" });
      }
      
      res.json(gameType);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Option Game Routes
  app.post("/api/option-games", isAdmin, validateBody(insertOptionGameSchema), async (req, res) => {
    try {
      const optionGame = await storage.createOptionGame(req.body);
      res.status(201).json(optionGame);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/option-games", isAuthenticated, async (req, res) => {
    try {
      const optionGames = await storage.getOptionGames();
      res.json(optionGames);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/option-games/:id", isAuthenticated, async (req, res) => {
    try {
      const optionGameId = parseInt(req.params.id);
      const optionGame = await storage.getOptionGame(optionGameId);
      
      if (!optionGame) {
        return res.status(404).json({ message: "Option game not found" });
      }
      
      res.json(optionGame);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/option-games/:id", isAdmin, async (req, res) => {
    try {
      const optionGameId = parseInt(req.params.id);
      const optionGame = await storage.updateOptionGame(optionGameId, req.body);
      
      if (!optionGame) {
        return res.status(404).json({ message: "Option game not found" });
      }
      
      res.json(optionGame);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  app.delete("/api/option-games/:id", isAdmin, async (req, res) => {
    try {
      const optionGameId = parseInt(req.params.id);
      const result = await storage.deleteOptionGame(optionGameId);
      
      if (!result) {
        return res.status(404).json({ message: "Option game not found" });
      }
      
      res.json({ message: "Option game deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Market Bet Routes
  app.post("/api/market-bets", isAuthenticated, validateBody(insertMarketBetSchema), async (req, res) => {
    try {
      const betData = req.body;
      const userId = (req.user as any).id;
      
      // Only players can place bets
      if ((req.user as any).role !== UserRole.PLAYER) {
        return res.status(403).json({ message: "Only players can place bets" });
      }
      
      // Set the user ID to the logged-in user
      betData.userId = userId;
      
      // Get the market to check if it's open
      const market = await storage.getMarket(betData.marketId);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      // Check if market is open for betting
      if (market.status !== "open") {
        return res.status(400).json({ message: "Market is not open for betting" });
      }
      
      // Get the user to check wallet balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.walletBalance < betData.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create the bet
      const bet = await storage.createMarketBet(betData);
      
      // Create transaction record for the bet
      await storage.createTransaction({
        userId,
        type: "bet",
        amount: -betData.amount, // Negative amount for deduction
        status: "approved",
        reference: `Bet on Market ${betData.marketId}`,
        remarks: `${betData.gameType} bet: ${betData.selection}`,
        approvedById: null,
        isSubadminTransaction: false
      });
      
      res.status(201).json(bet);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/market-bets", isAdminOrSubadmin, async (req, res) => {
    try {
      const marketId = req.query.marketId ? parseInt(req.query.marketId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let bets: any[] = [];
      
      if (marketId) {
        bets = await storage.getMarketBetsByMarket(marketId);
      } else if (userId) {
        // Check if subadmin is trying to access user that's not theirs
        if ((req.user as any).role === UserRole.SUBADMIN) {
          const user = await storage.getUser(userId);
          if (!user || user.subadminId !== (req.user as any).id) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        
        bets = await storage.getMarketBetsByUser(userId);
      } else {
        // For admin, we could return all bets, but that might be too many
        return res.status(400).json({ message: "Please provide marketId or userId query parameter" });
      }
      
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/:id/market-bets", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only view their own bets
      // Subadmins can only view bets of their users
      if (
        (req.user as any).id !== userId &&
        ((req.user as any).role === UserRole.PLAYER ||
          ((req.user as any).role === UserRole.SUBADMIN &&
            (await storage.getUser(userId))?.subadminId !== (req.user as any).id))
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const bets = await storage.getMarketBetsByUser(userId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Option Bet Routes
  app.post("/api/option-bets", isAuthenticated, validateBody(insertOptionBetSchema), async (req, res) => {
    try {
      const betData = req.body;
      const userId = (req.user as any).id;
      
      // Only players can place bets
      if ((req.user as any).role !== UserRole.PLAYER) {
        return res.status(403).json({ message: "Only players can place bets" });
      }
      
      // Set the user ID to the logged-in user
      betData.userId = userId;
      
      // Get the option game to check if it's open
      const optionGame = await storage.getOptionGame(betData.optionGameId);
      if (!optionGame) {
        return res.status(404).json({ message: "Option game not found" });
      }
      
      // Check if option game is open for betting
      if (optionGame.status !== "open") {
        return res.status(400).json({ message: "Option game is not open for betting" });
      }
      
      // Get the user to check wallet balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.walletBalance < betData.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create the bet
      const bet = await storage.createOptionBet(betData);
      
      // Create transaction record for the bet
      await storage.createTransaction({
        userId,
        type: "bet",
        amount: -betData.amount, // Negative amount for deduction
        status: "approved",
        reference: `Bet on Option Game ${betData.optionGameId}`,
        remarks: `Team ${betData.selection} selected`,
        approvedById: null,
        isSubadminTransaction: false
      });
      
      res.status(201).json(bet);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/option-bets", isAdminOrSubadmin, async (req, res) => {
    try {
      const optionGameId = req.query.optionGameId ? parseInt(req.query.optionGameId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let bets: any[] = [];
      
      if (optionGameId) {
        bets = await storage.getOptionBetsByGame(optionGameId);
      } else if (userId) {
        // Check if subadmin is trying to access user that's not theirs
        if ((req.user as any).role === UserRole.SUBADMIN) {
          const user = await storage.getUser(userId);
          if (!user || user.subadminId !== (req.user as any).id) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        
        bets = await storage.getOptionBetsByUser(userId);
      } else {
        return res.status(400).json({ message: "Please provide optionGameId or userId query parameter" });
      }
      
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/:id/option-bets", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only view their own bets
      // Subadmins can only view bets of their users
      if (
        (req.user as any).id !== userId &&
        ((req.user as any).role === UserRole.PLAYER ||
          ((req.user as any).role === UserRole.SUBADMIN &&
            (await storage.getUser(userId))?.subadminId !== (req.user as any).id))
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const bets = await storage.getOptionBetsByUser(userId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Result Declaration Routes
  app.post("/api/markets/:id/declare-result", isAdmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const { resultValue } = req.body;
      
      if (!resultValue) {
        return res.status(400).json({ message: "Result value is required" });
      }
      
      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      // Check if market is closed
      if (market.status !== "closed") {
        return res.status(400).json({ message: "Market must be closed before declaring result" });
      }
      
      // Check if result is already declared
      if (market.resultStatus === "declared") {
        return res.status(400).json({ message: "Result already declared for this market" });
      }
      
      await storage.declareMarketResult(marketId, resultValue);
      
      const updatedMarket = await storage.getMarket(marketId);
      
      // Send real-time notification to all users about the result declaration
      broadcastNotification({
        type: 'market_result',
        marketId: marketId,
        result: resultValue,
        message: `Market result has been declared: ${resultValue}`
      });
      
      res.json(updatedMarket);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/option-games/:id/declare-result", isAdmin, async (req, res) => {
    try {
      const optionGameId = parseInt(req.params.id);
      const { winningTeam } = req.body;
      
      if (!winningTeam || (winningTeam !== "A" && winningTeam !== "B")) {
        return res.status(400).json({ message: "Winning team (A or B) is required" });
      }
      
      const optionGame = await storage.getOptionGame(optionGameId);
      if (!optionGame) {
        return res.status(404).json({ message: "Option game not found" });
      }
      
      // Check if option game is closed
      if (optionGame.status !== "closed") {
        return res.status(400).json({ message: "Option game must be closed before declaring result" });
      }
      
      // Check if result is already declared
      if (optionGame.resultStatus === "declared") {
        return res.status(400).json({ message: "Result already declared for this option game" });
      }
      
      await storage.declareOptionGameResult(optionGameId, winningTeam);
      
      const updatedOptionGame = await storage.getOptionGame(optionGameId);
      
      // Send real-time notification to all users about the option game result
      broadcastNotification({
        type: 'option_game_result',
        optionGameId: optionGameId,
        gameTitle: optionGame.title,
        winningTeam: winningTeam,
        message: `Result for ${optionGame.title}: Team ${winningTeam} has won!`
      });
      
      res.json(updatedOptionGame);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Transaction Routes
  app.post("/api/transactions", isAuthenticated, validateBody(insertTransactionSchema), async (req, res) => {
    try {
      const transactionData = req.body;
      const userId = (req.user as any).id;
      
      // For deposit/withdrawal requests
      if (transactionData.type === "deposit" || transactionData.type === "withdrawal") {
        // Set the user ID to the logged-in user
        transactionData.userId = userId;
        
        // For withdrawals, check balance and make amount negative
        if (transactionData.type === "withdrawal") {
          const user = await storage.getUser(userId);
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          
          if (user.walletBalance < transactionData.amount) {
            return res.status(400).json({ message: "Insufficient balance" });
          }
          
          // Make withdrawal amount negative
          transactionData.amount = -transactionData.amount;
          
          // For withdrawals, deduct from balance immediately
          await storage.updateUser(userId, {
            walletBalance: user.walletBalance + transactionData.amount // Adding negative is subtracting
          });
        }
        
        // Set the appropriate flags
        transactionData.isSubadminTransaction = (req.user as any).role === UserRole.SUBADMIN;
        
        const transaction = await storage.createTransaction(transactionData);
        res.status(201).json(transaction);
      } else {
        // Other transaction types are restricted
        res.status(403).json({ message: "Unauthorized transaction type" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/transactions", isAdminOrSubadmin, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let transactions: any[] = [];
      
      if (userId) {
        // Check if subadmin is trying to access transactions of user that's not theirs
        if ((req.user as any).role === UserRole.SUBADMIN) {
          const user = await storage.getUser(userId);
          if (!user || user.subadminId !== (req.user as any).id) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
        
        transactions = await storage.getTransactionsByUser(userId);
      } else if ((req.user as any).role === UserRole.ADMIN) {
        // Admin can see all transactions
        transactions = await storage.getTransactions();
      } else {
        // Subadmin can see transactions of their users
        const subadminUsers = await storage.getUsersBySubadmin((req.user as any).id);
        const userIds = subadminUsers.map(user => user.id);
        
        // Get all transactions and filter
        const allTransactions = await storage.getTransactions();
        transactions = allTransactions.filter(txn => 
          userIds.includes(txn.userId) || 
          (txn.isSubadminTransaction && txn.userId === (req.user as any).id)
        );
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users/:id/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only view their own transactions
      // Subadmins can only view transactions of their users
      if (
        (req.user as any).id !== userId &&
        ((req.user as any).role === UserRole.PLAYER ||
          ((req.user as any).role === UserRole.SUBADMIN &&
            (await storage.getUser(userId))?.subadminId !== (req.user as any).id))
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/transactions/:id", isAdminOrSubadmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status, remarks } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (approved/rejected) is required" });
      }
      
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check permissions
      if ((req.user as any).role === UserRole.SUBADMIN) {
        // Subadmins can only approve/reject transactions of their users
        const user = await storage.getUser(transaction.userId);
        if (!user || user.subadminId !== (req.user as any).id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Subadmins cannot approve their own transactions
        if (transaction.isSubadminTransaction && transaction.userId === (req.user as any).id) {
          return res.status(403).json({ message: "Cannot approve/reject your own transaction" });
        }
      }
      
      // Update transaction
      const updatedTransaction = await storage.updateTransaction(transactionId, {
        status,
        remarks: remarks || `${status} by ${(req.user as any).username}`,
        approvedById: (req.user as any).id
      });
      
      // If transaction is a deposit and was approved, update user's wallet balance
      if (transaction.type === "deposit" && status === "approved") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const updatedUser = await storage.updateUser(transaction.userId, {
            walletBalance: user.walletBalance + transaction.amount
          });
          
          // Send notification to user
          sendNotification(transaction.userId, {
            type: 'transaction_status',
            transactionId: transactionId,
            status: status,
            amount: transaction.amount,
            newBalance: updatedUser?.walletBalance || 0,
            message: `Your ${transaction.type} request for ${transaction.amount} has been ${status}`
          });
        }
      } else {
        // Send notification for rejected deposits or any withdrawal status updates
        sendNotification(transaction.userId, {
          type: 'transaction_status',
          transactionId: transactionId,
          status: status,
          message: `Your ${transaction.type} request has been ${status}`
        });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Create a map to store user connections
  const connections = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = data.userId;
          console.log(`WebSocket authenticated for user ${userId}`);
          
          // Store the connection by user ID
          if (userId) {
            if (!connections.has(userId)) {
              connections.set(userId, []);
            }
            connections.get(userId)?.push(ws);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove connection on disconnect
      if (userId) {
        const userConnections = connections.get(userId) || [];
        const index = userConnections.indexOf(ws);
        if (index !== -1) {
          userConnections.splice(index, 1);
        }
        if (userConnections.length === 0) {
          connections.delete(userId);
        }
      }
    });
  });
  
  // Helper function to send notification to a specific user
  const sendNotification = (userId: number, notification: any) => {
    const userConnections = connections.get(userId);
    if (userConnections) {
      userConnections.forEach(connection => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify(notification));
        }
      });
    }
  };
  
  // Helper function to broadcast to all connected users
  const broadcastNotification = (notification: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  };
  
  // Expose notification functions to be used in routes
  (app as any).sendNotification = sendNotification;
  (app as any).broadcastNotification = broadcastNotification;
  
  // Analytics Routes
  
  // Get overall platform statistics (admin only)
  app.get("/api/analytics/platform", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Validate date parameters
      const from = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const to = endDate ? new Date(endDate as string) : new Date();
      
      // Get users count
      const users = await storage.getUsers();
      const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
      const playerCount = users.filter(u => u.role === UserRole.PLAYER).length;
      const subadminCount = users.filter(u => u.role === UserRole.SUBADMIN).length;
      
      // Get all transactions in the date range
      const allTransactions = await storage.getTransactions();
      const periodTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= from && txDate <= to;
      });
      
      // Calculate transaction statistics
      const totalDeposits = periodTransactions
        .filter(tx => tx.type === "deposit" && tx.status === "approved")
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const totalWithdrawals = periodTransactions
        .filter(tx => tx.type === "withdrawal" && tx.status === "approved")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalBets = periodTransactions
        .filter(tx => tx.type === "bet")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalWinnings = periodTransactions
        .filter(tx => tx.type === "winning")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate platform profit (bets - winnings)
      const platformProfit = totalBets - totalWinnings;
      
      // Group transactions by date for time series data
      const dailyData = [];
      const dateMap = new Map();
      
      // Initialize all dates in the range with 0 values
      let currentDate = new Date(from);
      while (currentDate <= to) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dateMap.set(dateKey, {
          date: dateKey,
          deposits: 0,
          withdrawals: 0,
          bets: 0,
          winnings: 0,
          profit: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Fill in actual data
      periodTransactions.forEach(tx => {
        const dateKey = new Date(tx.createdAt).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) return;
        
        const dayData = dateMap.get(dateKey);
        
        if (tx.type === "deposit" && tx.status === "approved") {
          dayData.deposits += tx.amount;
        } else if (tx.type === "withdrawal" && tx.status === "approved") {
          dayData.withdrawals += Math.abs(tx.amount);
        } else if (tx.type === "bet") {
          dayData.bets += Math.abs(tx.amount);
        } else if (tx.type === "winning") {
          dayData.winnings += tx.amount;
        }
        
        dayData.profit = dayData.bets - dayData.winnings;
      });
      
      // Sort by date
      dateMap.forEach(value => dailyData.push(value));
      dailyData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Return analytics data
      res.json({
        userStats: {
          totalUsers: users.length,
          activeUsers,
          playerCount,
          subadminCount
        },
        financialStats: {
          totalDeposits,
          totalWithdrawals,
          totalBets,
          totalWinnings,
          platformProfit
        },
        dailyData
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get subadmin analytics (admin and specific subadmin)
  app.get("/api/analytics/subadmin/:id", isAdminOrSubadmin, async (req, res) => {
    try {
      const subadminId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      // Check permissions - admins can see any subadmin, subadmins can only see themselves
      if ((req.user as any).role === UserRole.SUBADMIN && (req.user as any).id !== subadminId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the subadmin
      const subadmin = await storage.getUser(subadminId);
      if (!subadmin || subadmin.role !== UserRole.SUBADMIN) {
        return res.status(404).json({ message: "Subadmin not found" });
      }
      
      // Validate date parameters
      const from = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const to = endDate ? new Date(endDate as string) : new Date();
      
      // Get users managed by this subadmin
      const users = await storage.getUsersBySubadmin(subadminId);
      const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
      
      // Get all transactions from these users in the date range
      const userIds = users.map(u => u.id);
      const allTransactions = (await Promise.all(userIds.map(userId => storage.getTransactionsByUser(userId)))).flat();
      
      const periodTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= from && txDate <= to;
      });
      
      // Calculate transaction statistics
      const totalDeposits = periodTransactions
        .filter(tx => tx.type === "deposit" && tx.status === "approved")
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const totalWithdrawals = periodTransactions
        .filter(tx => tx.type === "withdrawal" && tx.status === "approved")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalBets = periodTransactions
        .filter(tx => tx.type === "bet")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalWinnings = periodTransactions
        .filter(tx => tx.type === "winning")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate subadmin profit (typically a portion of platform profit)
      const platformProfit = totalBets - totalWinnings;
      const subadminProfit = platformProfit * 0.5; // Assuming 50% commission
      
      // Return analytics data
      res.json({
        subadmin: {
          id: subadmin.id,
          name: subadmin.name,
          username: subadmin.username
        },
        userStats: {
          totalUsers: users.length,
          activeUsers
        },
        financialStats: {
          totalDeposits,
          totalWithdrawals,
          totalBets,
          totalWinnings,
          platformProfit,
          subadminProfit
        }
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get player analytics (player, their subadmin, or admin)
  app.get("/api/analytics/player/:id", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      // Check permissions
      // Players can only see their own analytics
      // Subadmins can see their assigned players
      // Admins can see all players
      if ((req.user as any).role === UserRole.PLAYER && (req.user as any).id !== playerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the player
      const player = await storage.getUser(playerId);
      if (!player || player.role !== UserRole.PLAYER) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // If requesting user is a subadmin, check if player is assigned to them
      if ((req.user as any).role === UserRole.SUBADMIN && player.subadminId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate date parameters
      const from = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
      const to = endDate ? new Date(endDate as string) : new Date();
      
      // Get player's transactions in the date range
      const allTransactions = await storage.getTransactionsByUser(playerId);
      const periodTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= from && txDate <= to;
      });
      
      // Get player's bets
      const marketBets = await storage.getMarketBetsByUser(playerId);
      const optionBets = await storage.getOptionBetsByUser(playerId);
      
      // Filter bets in the date range
      const periodMarketBets = marketBets.filter(bet => {
        const betDate = new Date(bet.createdAt);
        return betDate >= from && betDate <= to;
      });
      
      const periodOptionBets = optionBets.filter(bet => {
        const betDate = new Date(bet.createdAt);
        return betDate >= from && betDate <= to;
      });
      
      // Calculate betting statistics
      const totalBets = periodMarketBets.length + periodOptionBets.length;
      const wonBets = [
        ...periodMarketBets.filter(bet => bet.status === "won"),
        ...periodOptionBets.filter(bet => bet.status === "won")
      ].length;
      
      const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
      
      // Calculate financial statistics from transactions
      const totalDeposited = periodTransactions
        .filter(tx => tx.type === "deposit" && tx.status === "approved")
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const totalWithdrawn = periodTransactions
        .filter(tx => tx.type === "withdrawal" && tx.status === "approved")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalBetAmount = periodTransactions
        .filter(tx => tx.type === "bet")
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const totalWinnings = periodTransactions
        .filter(tx => tx.type === "winning")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate net profit/loss for the player
      const netProfit = totalWinnings - totalBetAmount;
      
      // Game type distribution
      const gameTypeDistribution = [
        { name: 'Jodi', value: periodMarketBets.filter(bet => bet.gameType === 'jodi').length },
        { name: 'Hurf', value: periodMarketBets.filter(bet => bet.gameType === 'hurf').length },
        { name: 'Cross', value: periodMarketBets.filter(bet => bet.gameType === 'cross').length },
        { name: 'Odd-Even', value: periodMarketBets.filter(bet => bet.gameType === 'odd_even').length },
        { name: 'Option Games', value: periodOptionBets.length }
      ];
      
      // Daily betting data
      const dailyData = [];
      const dateMap = new Map();
      
      // Initialize all dates in the range with 0 values
      let currentDate = new Date(from);
      while (currentDate <= to) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dateMap.set(dateKey, {
          date: dateKey,
          betAmount: 0,
          winnings: 0,
          netProfit: 0,
          betsPlaced: 0,
          betsWon: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Fill in market bets data
      periodMarketBets.forEach(bet => {
        const dateKey = new Date(bet.createdAt).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) return;
        
        const dayData = dateMap.get(dateKey);
        dayData.betAmount += bet.amount;
        dayData.betsPlaced += 1;
        
        if (bet.status === "won") {
          dayData.betsWon += 1;
          // Assuming winnings are recorded in transactions, not adding here
        }
      });
      
      // Fill in option bets data
      periodOptionBets.forEach(bet => {
        const dateKey = new Date(bet.createdAt).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) return;
        
        const dayData = dateMap.get(dateKey);
        dayData.betAmount += bet.amount;
        dayData.betsPlaced += 1;
        
        if (bet.status === "won") {
          dayData.betsWon += 1;
          // Assuming winnings are recorded in transactions, not adding here
        }
      });
      
      // Fill in transaction data for winnings
      periodTransactions.forEach(tx => {
        const dateKey = new Date(tx.createdAt).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) return;
        
        const dayData = dateMap.get(dateKey);
        
        if (tx.type === "winning") {
          dayData.winnings += tx.amount;
        }
        
        // Calculate daily net profit
        dayData.netProfit = dayData.winnings - dayData.betAmount;
      });
      
      // Sort by date
      dateMap.forEach(value => dailyData.push(value));
      dailyData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Return analytics data
      res.json({
        player: {
          id: player.id,
          name: player.name,
          username: player.username,
          walletBalance: player.walletBalance,
          status: player.status
        },
        bettingStats: {
          totalBets,
          wonBets,
          winRate,
          favoriteGameType: gameTypeDistribution.reduce((prev, current) => 
            (prev.value > current.value) ? prev : current, { name: 'None', value: 0 }).name
        },
        financialStats: {
          totalDeposited,
          totalWithdrawn,
          totalBetAmount,
          totalWinnings,
          netProfit
        },
        gameTypeDistribution,
        dailyData
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  return httpServer;
}
