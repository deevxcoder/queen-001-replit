import {
  users, markets, marketGameTypes, optionGames, marketBets, optionBets, transactions,
  User, InsertUser, Market, InsertMarket, MarketGameType, InsertMarketGameType,
  OptionGame, InsertOptionGame, MarketBet, InsertMarketBet, OptionBet, InsertOptionBet,
  Transaction, InsertTransaction, UserRole, UserStatus, BetStatus, TransactionStatus, MarketStatus
} from "@shared/schema";

// Storage interface for all data operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersBySubadmin(subadminId: number): Promise<User[]>;
  
  // Market operations
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarket(id: number, market: Partial<Market>): Promise<Market | undefined>;
  getMarket(id: number): Promise<Market | undefined>;
  getMarkets(): Promise<Market[]>;
  deleteMarket(id: number): Promise<boolean>;
  
  // Market Game Type operations
  createMarketGameType(gameType: InsertMarketGameType): Promise<MarketGameType>;
  updateMarketGameType(id: number, gameType: Partial<MarketGameType>): Promise<MarketGameType | undefined>;
  getMarketGameType(id: number): Promise<MarketGameType | undefined>;
  getMarketGameTypesByMarket(marketId: number): Promise<MarketGameType[]>;
  
  // Option Game operations
  createOptionGame(optionGame: InsertOptionGame): Promise<OptionGame>;
  updateOptionGame(id: number, optionGame: Partial<OptionGame>): Promise<OptionGame | undefined>;
  getOptionGame(id: number): Promise<OptionGame | undefined>;
  getOptionGames(): Promise<OptionGame[]>;
  deleteOptionGame(id: number): Promise<boolean>;
  
  // Market Bet operations
  createMarketBet(bet: InsertMarketBet): Promise<MarketBet>;
  updateMarketBet(id: number, bet: Partial<MarketBet>): Promise<MarketBet | undefined>;
  getMarketBet(id: number): Promise<MarketBet | undefined>;
  getMarketBetsByMarket(marketId: number): Promise<MarketBet[]>;
  getMarketBetsByUser(userId: number): Promise<MarketBet[]>;
  
  // Option Bet operations
  createOptionBet(bet: InsertOptionBet): Promise<OptionBet>;
  updateOptionBet(id: number, bet: Partial<OptionBet>): Promise<OptionBet | undefined>;
  getOptionBet(id: number): Promise<OptionBet | undefined>;
  getOptionBetsByGame(optionGameId: number): Promise<OptionBet[]>;
  getOptionBetsByUser(userId: number): Promise<OptionBet[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  getTransactions(): Promise<Transaction[]>;
  
  // Special operations
  declareMarketResult(marketId: number, result: string): Promise<void>;
  declareOptionGameResult(optionGameId: number, winningTeam: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private markets: Map<number, Market>;
  private marketGameTypes: Map<number, MarketGameType>;
  private optionGames: Map<number, OptionGame>;
  private marketBets: Map<number, MarketBet>;
  private optionBets: Map<number, OptionBet>;
  private transactions: Map<number, Transaction>;
  
  private currentUserId: number;
  private currentMarketId: number;
  private currentMarketGameTypeId: number;
  private currentOptionGameId: number;
  private currentMarketBetId: number;
  private currentOptionBetId: number;
  private currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.markets = new Map();
    this.marketGameTypes = new Map();
    this.optionGames = new Map();
    this.marketBets = new Map();
    this.optionBets = new Map();
    this.transactions = new Map();
    
    this.currentUserId = 1;
    this.currentMarketId = 1;
    this.currentMarketGameTypeId = 1;
    this.currentOptionGameId = 1;
    this.currentMarketBetId = 1;
    this.currentOptionBetId = 1;
    this.currentTransactionId = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Admin User",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      walletBalance: 100000,
      subadminId: null
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = {
      ...existingUser,
      ...user,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersBySubadmin(subadminId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.subadminId === subadminId
    );
  }
  
  // Market operations
  async createMarket(market: InsertMarket): Promise<Market> {
    const id = this.currentMarketId++;
    const now = new Date();
    const newMarket: Market = {
      ...market,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.markets.set(id, newMarket);
    return newMarket;
  }
  
  async updateMarket(id: number, market: Partial<Market>): Promise<Market | undefined> {
    const existingMarket = this.markets.get(id);
    if (!existingMarket) return undefined;
    
    const updatedMarket = {
      ...existingMarket,
      ...market,
      updatedAt: new Date()
    };
    
    this.markets.set(id, updatedMarket);
    return updatedMarket;
  }
  
  async getMarket(id: number): Promise<Market | undefined> {
    return this.markets.get(id);
  }
  
  async getMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values());
  }
  
  async deleteMarket(id: number): Promise<boolean> {
    return this.markets.delete(id);
  }
  
  // Market Game Type operations
  async createMarketGameType(gameType: InsertMarketGameType): Promise<MarketGameType> {
    const id = this.currentMarketGameTypeId++;
    const now = new Date();
    const newGameType: MarketGameType = {
      ...gameType,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.marketGameTypes.set(id, newGameType);
    return newGameType;
  }
  
  async updateMarketGameType(id: number, gameType: Partial<MarketGameType>): Promise<MarketGameType | undefined> {
    const existingGameType = this.marketGameTypes.get(id);
    if (!existingGameType) return undefined;
    
    const updatedGameType = {
      ...existingGameType,
      ...gameType,
      updatedAt: new Date()
    };
    
    this.marketGameTypes.set(id, updatedGameType);
    return updatedGameType;
  }
  
  async getMarketGameType(id: number): Promise<MarketGameType | undefined> {
    return this.marketGameTypes.get(id);
  }
  
  async getMarketGameTypesByMarket(marketId: number): Promise<MarketGameType[]> {
    return Array.from(this.marketGameTypes.values()).filter(
      (gameType) => gameType.marketId === marketId
    );
  }
  
  // Option Game operations
  async createOptionGame(optionGame: InsertOptionGame): Promise<OptionGame> {
    const id = this.currentOptionGameId++;
    const now = new Date();
    const newOptionGame: OptionGame = {
      ...optionGame,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.optionGames.set(id, newOptionGame);
    return newOptionGame;
  }
  
  async updateOptionGame(id: number, optionGame: Partial<OptionGame>): Promise<OptionGame | undefined> {
    const existingOptionGame = this.optionGames.get(id);
    if (!existingOptionGame) return undefined;
    
    const updatedOptionGame = {
      ...existingOptionGame,
      ...optionGame,
      updatedAt: new Date()
    };
    
    this.optionGames.set(id, updatedOptionGame);
    return updatedOptionGame;
  }
  
  async getOptionGame(id: number): Promise<OptionGame | undefined> {
    return this.optionGames.get(id);
  }
  
  async getOptionGames(): Promise<OptionGame[]> {
    return Array.from(this.optionGames.values());
  }
  
  async deleteOptionGame(id: number): Promise<boolean> {
    return this.optionGames.delete(id);
  }
  
  // Market Bet operations
  async createMarketBet(bet: InsertMarketBet): Promise<MarketBet> {
    const id = this.currentMarketBetId++;
    const now = new Date();
    const newBet: MarketBet = {
      ...bet,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.marketBets.set(id, newBet);
    
    // Deduct bet amount from user's wallet
    const user = this.users.get(bet.userId);
    if (user) {
      user.walletBalance -= bet.amount;
      this.users.set(user.id, user);
    }
    
    return newBet;
  }
  
  async updateMarketBet(id: number, bet: Partial<MarketBet>): Promise<MarketBet | undefined> {
    const existingBet = this.marketBets.get(id);
    if (!existingBet) return undefined;
    
    const updatedBet = {
      ...existingBet,
      ...bet,
      updatedAt: new Date()
    };
    
    this.marketBets.set(id, updatedBet);
    return updatedBet;
  }
  
  async getMarketBet(id: number): Promise<MarketBet | undefined> {
    return this.marketBets.get(id);
  }
  
  async getMarketBetsByMarket(marketId: number): Promise<MarketBet[]> {
    return Array.from(this.marketBets.values()).filter(
      (bet) => bet.marketId === marketId
    );
  }
  
  async getMarketBetsByUser(userId: number): Promise<MarketBet[]> {
    return Array.from(this.marketBets.values()).filter(
      (bet) => bet.userId === userId
    );
  }
  
  // Option Bet operations
  async createOptionBet(bet: InsertOptionBet): Promise<OptionBet> {
    const id = this.currentOptionBetId++;
    const now = new Date();
    const newBet: OptionBet = {
      ...bet,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.optionBets.set(id, newBet);
    
    // Deduct bet amount from user's wallet
    const user = this.users.get(bet.userId);
    if (user) {
      user.walletBalance -= bet.amount;
      this.users.set(user.id, user);
    }
    
    return newBet;
  }
  
  async updateOptionBet(id: number, bet: Partial<OptionBet>): Promise<OptionBet | undefined> {
    const existingBet = this.optionBets.get(id);
    if (!existingBet) return undefined;
    
    const updatedBet = {
      ...existingBet,
      ...bet,
      updatedAt: new Date()
    };
    
    this.optionBets.set(id, updatedBet);
    return updatedBet;
  }
  
  async getOptionBet(id: number): Promise<OptionBet | undefined> {
    return this.optionBets.get(id);
  }
  
  async getOptionBetsByGame(optionGameId: number): Promise<OptionBet[]> {
    return Array.from(this.optionBets.values()).filter(
      (bet) => bet.optionGameId === optionGameId
    );
  }
  
  async getOptionBetsByUser(userId: number): Promise<OptionBet[]> {
    return Array.from(this.optionBets.values()).filter(
      (bet) => bet.userId === userId
    );
  }
  
  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactions.get(id);
    if (!existingTransaction) return undefined;
    
    const updatedTransaction = {
      ...existingTransaction,
      ...transaction,
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    
    // If transaction is approved, update user's wallet balance
    if (transaction.status === TransactionStatus.APPROVED && existingTransaction.status !== TransactionStatus.APPROVED) {
      const user = this.users.get(existingTransaction.userId);
      if (user) {
        // For deposits, add to wallet; for withdrawals, deduct (amount is already negative)
        user.walletBalance += existingTransaction.amount;
        this.users.set(user.id, user);
      }
    }
    
    // If transaction is rejected and is a withdrawal, refund the amount
    if (transaction.status === TransactionStatus.REJECTED && 
        existingTransaction.status !== TransactionStatus.REJECTED && 
        existingTransaction.amount < 0) {
      const user = this.users.get(existingTransaction.userId);
      if (user) {
        user.walletBalance -= existingTransaction.amount; // Double negative makes it positive
        this.users.set(user.id, user);
      }
    }
    
    return updatedTransaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }
  
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
  
  // Special operations
  async declareMarketResult(marketId: number, result: string): Promise<void> {
    // Update market with result
    const market = this.markets.get(marketId);
    if (!market) return;
    
    market.resultValue = result;
    market.resultStatus = "declared";
    market.status = "closed";
    market.updatedAt = new Date();
    this.markets.set(marketId, market);
    
    // Process all bets for this market
    const bets = await this.getMarketBetsByMarket(marketId);
    
    for (const bet of bets) {
      let isWinner = false;
      
      // Different logic based on game type
      switch (bet.gameType) {
        case "jodi":
          // Jodi: Exact match of two digits
          isWinner = bet.selection === result;
          break;
          
        case "hurf":
          // Hurf: Position-based digits
          const position = bet.selection.startsWith("Left:") ? "left" : "right";
          const digit = bet.selection.split(":")[1].trim();
          
          if (position === "left" && result.charAt(0) === digit) {
            isWinner = true;
          } else if (position === "right" && result.charAt(1) === digit) {
            isWinner = true;
          } else if (position === "both" && result.charAt(0) === digit.charAt(0) && result.charAt(1) === digit.charAt(1)) {
            isWinner = true;
          }
          break;
          
        case "cross":
          // Cross: Digit permutations
          const selectedDigits = bet.selection.split(",");
          const permutations: string[] = [];
          
          // Generate all possible permutations
          for (let i = 0; i < selectedDigits.length; i++) {
            for (let j = 0; j < selectedDigits.length; j++) {
              if (i !== j) {
                permutations.push(selectedDigits[i] + selectedDigits[j]);
              }
            }
          }
          
          isWinner = permutations.includes(result);
          break;
          
        case "odd_even":
          // Odd-Even: Number property
          const resultNum = parseInt(result);
          const isOdd = resultNum % 2 !== 0;
          
          if ((isOdd && bet.selection === "Odd") || (!isOdd && bet.selection === "Even")) {
            isWinner = true;
          }
          break;
      }
      
      // Update bet status
      bet.status = isWinner ? BetStatus.WON : BetStatus.LOST;
      bet.updatedAt = new Date();
      this.marketBets.set(bet.id, bet);
      
      // If winner, credit winnings
      if (isWinner) {
        const user = this.users.get(bet.userId);
        if (user) {
          user.walletBalance += bet.potentialWinning;
          this.users.set(user.id, user);
          
          // Create transaction record for winnings
          this.createTransaction({
            userId: user.id,
            type: "winning",
            amount: bet.potentialWinning,
            status: TransactionStatus.APPROVED,
            reference: `Win on Market ${marketId} - ${bet.gameType}`,
            remarks: `Won bet #${bet.id}`,
            approvedById: null,
            isSubadminTransaction: false
          });
        }
      }
    }
  }
  
  async declareOptionGameResult(optionGameId: number, winningTeam: string): Promise<void> {
    // Update option game with result
    const optionGame = this.optionGames.get(optionGameId);
    if (!optionGame) return;
    
    optionGame.winningTeam = winningTeam;
    optionGame.resultStatus = "declared";
    optionGame.status = "closed";
    optionGame.updatedAt = new Date();
    this.optionGames.set(optionGameId, optionGame);
    
    // Process all bets for this option game
    const bets = await this.getOptionBetsByGame(optionGameId);
    
    for (const bet of bets) {
      // Check if bet matches winning team
      const isWinner = (bet.selection === "A" && winningTeam === "A") || 
                      (bet.selection === "B" && winningTeam === "B");
      
      // Update bet status
      bet.status = isWinner ? BetStatus.WON : BetStatus.LOST;
      bet.updatedAt = new Date();
      this.optionBets.set(bet.id, bet);
      
      // If winner, credit winnings
      if (isWinner) {
        const user = this.users.get(bet.userId);
        if (user) {
          user.walletBalance += bet.potentialWinning;
          this.users.set(user.id, user);
          
          // Create transaction record for winnings
          this.createTransaction({
            userId: user.id,
            type: "winning",
            amount: bet.potentialWinning,
            status: TransactionStatus.APPROVED,
            reference: `Win on Option Game ${optionGameId}`,
            remarks: `Won bet #${bet.id}`,
            approvedById: null,
            isSubadminTransaction: false
          });
        }
      }
    }
  }
}

export const storage = new MemStorage();
