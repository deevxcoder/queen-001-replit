import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, varchar, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Roles
export enum UserRole {
  ADMIN = "admin",
  SUBADMIN = "subadmin",
  PLAYER = "player"
}

// User Status
export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked"
}

// Game Types
export enum GameType {
  JODI = "jodi",
  HURF = "hurf",
  CROSS = "cross",
  ODD_EVEN = "odd_even"
}

// Market Status
export enum MarketStatus {
  UPCOMING = "upcoming",
  OPEN = "open",
  CLOSED = "closed"
}

// Result Status
export enum ResultStatus {
  PENDING = "pending",
  DECLARED = "declared"
}

// Transaction Types
export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  WINNING = "winning",
  ADJUSTMENT = "adjustment"
}

// Transaction Status
export enum TransactionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

// Bet Status
export enum BetStatus {
  PENDING = "pending",
  WON = "won",
  LOST = "lost"
}

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "subadmin", "player"] }).notNull().default("player"),
  status: text("status", { enum: ["active", "blocked"] }).notNull().default("active"),
  walletBalance: doublePrecision("wallet_balance").notNull().default(0),
  subadminId: integer("subadmin_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Markets Table
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["upcoming", "open", "closed"] }).notNull().default("upcoming"),
  openingTime: timestamp("opening_time").notNull(),
  closingTime: timestamp("closing_time").notNull(),
  resultStatus: text("result_status", { enum: ["pending", "declared"] }).notNull().default("pending"),
  resultValue: text("result_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Market Game Types Table
export const marketGameTypes = pgTable("market_game_types", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => markets.id),
  gameType: text("game_type", { enum: ["jodi", "hurf", "cross", "odd_even"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  odds: doublePrecision("odds").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Option Games Table
export const optionGames = pgTable("option_games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  teamA: text("team_a").notNull(),
  teamB: text("team_b").notNull(),
  status: text("status", { enum: ["upcoming", "open", "closed"] }).notNull().default("upcoming"),
  openingTime: timestamp("opening_time").notNull(),
  closingTime: timestamp("closing_time").notNull(),
  resultStatus: text("result_status", { enum: ["pending", "declared"] }).notNull().default("pending"),
  winningTeam: text("winning_team"),
  odds: doublePrecision("odds").notNull().default(1.9),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Market Bets Table
export const marketBets = pgTable("market_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  marketId: integer("market_id").notNull().references(() => markets.id),
  gameType: text("game_type", { enum: ["jodi", "hurf", "cross", "odd_even"] }).notNull(),
  selection: text("selection").notNull(),
  amount: doublePrecision("amount").notNull(),
  potentialWinning: doublePrecision("potential_winning").notNull(),
  status: text("status", { enum: ["pending", "won", "lost"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Option Bets Table
export const optionBets = pgTable("option_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  optionGameId: integer("option_game_id").notNull().references(() => optionGames.id),
  selection: text("selection").notNull(), // "A" or "B"
  amount: doublePrecision("amount").notNull(),
  potentialWinning: doublePrecision("potential_winning").notNull(),
  status: text("status", { enum: ["pending", "won", "lost"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Transactions Table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["deposit", "withdrawal", "bet", "winning", "adjustment"] }).notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reference: text("reference"),
  remarks: text("remarks"),
  approvedById: integer("approved_by_id").references(() => users.id),
  isSubadminTransaction: boolean("is_subadmin_transaction").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Zod Schemas for Insert Operations
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketSchema = createInsertSchema(markets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketGameTypeSchema = createInsertSchema(marketGameTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOptionGameSchema = createInsertSchema(optionGames).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketBetSchema = createInsertSchema(marketBets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOptionBetSchema = createInsertSchema(optionBets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });

// Authentication Schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  marketBets: many(marketBets),
  optionBets: many(optionBets),
  transactions: many(transactions),
  players: many(users, { relationName: "subadminToPlayers" }),
  subadmin: one(users, {
    fields: [users.subadminId],
    references: [users.id],
    relationName: "subadminToPlayers"
  })
}));

export const marketsRelations = relations(markets, ({ many }) => ({
  gameTypes: many(marketGameTypes),
  bets: many(marketBets)
}));

export const marketGameTypesRelations = relations(marketGameTypes, ({ one }) => ({
  market: one(markets, {
    fields: [marketGameTypes.marketId],
    references: [markets.id]
  })
}));

export const optionGamesRelations = relations(optionGames, ({ many }) => ({
  bets: many(optionBets)
}));

export const marketBetsRelations = relations(marketBets, ({ one }) => ({
  user: one(users, {
    fields: [marketBets.userId],
    references: [users.id]
  }),
  market: one(markets, {
    fields: [marketBets.marketId],
    references: [markets.id]
  })
}));

export const optionBetsRelations = relations(optionBets, ({ one }) => ({
  user: one(users, {
    fields: [optionBets.userId],
    references: [users.id]
  }),
  optionGame: one(optionGames, {
    fields: [optionBets.optionGameId],
    references: [optionGames.id]
  })
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  approvedBy: one(users, {
    fields: [transactions.approvedById],
    references: [users.id]
  })
}));

// Type Definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Market = typeof markets.$inferSelect;
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type MarketGameType = typeof marketGameTypes.$inferSelect;
export type InsertMarketGameType = z.infer<typeof insertMarketGameTypeSchema>;
export type OptionGame = typeof optionGames.$inferSelect;
export type InsertOptionGame = z.infer<typeof insertOptionGameSchema>;
export type MarketBet = typeof marketBets.$inferSelect;
export type InsertMarketBet = z.infer<typeof insertMarketBetSchema>;
export type OptionBet = typeof optionBets.$inferSelect;
export type InsertOptionBet = z.infer<typeof insertOptionBetSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Login = z.infer<typeof loginSchema>;
