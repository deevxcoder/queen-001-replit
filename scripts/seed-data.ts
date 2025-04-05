import { db } from "../server/db";
import { markets, optionGames, users, GameType, MarketStatus, ResultStatus, UserRole } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Seeding database with sample data...");
  
  // Check if admin user exists
  const adminUser = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  
  if (adminUser.length === 0) {
    console.log("Creating admin user...");
    await db.insert(users).values({
      username: "admin",
      password: await hashPassword("admin123"),
      role: UserRole.ADMIN,
      status: "active",
      name: "Admin User",
      walletBalance: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  // Create sample market games
  console.log("Creating sample market games...");
  
  const bannerImages = [
    "https://img.freepik.com/free-vector/gradient-cricket-tournament-poster_23-2149167961.jpg",
    "https://img.freepik.com/free-vector/gradient-cricket-championship-poster_23-2149171850.jpg",
    "https://img.freepik.com/free-vector/abstract-soccer-football-stadium-background_1017-17377.jpg",
    "https://img.freepik.com/free-vector/cricket-tournament-poster-design-with-stadium-background_1302-12230.jpg",
    "https://img.freepik.com/premium-vector/super-league-cricket-tournament-horizontal-banner-template_528352-376.jpg"
  ];
  
  const marketTitles = [
    "Mumbai Main Bazar",
    "Delhi King Bazar",
    "Kalyan Express",
    "Rajdhani Night",
    "Golden Matka"
  ];
  
  // Create 5 markets
  for (let i = 0; i < 5; i++) {
    // Set opening time to current time and closing to 3 hours later
    const openingTime = new Date();
    const closingTime = new Date();
    closingTime.setHours(closingTime.getHours() + 3);
    
    const status = i < 3 ? MarketStatus.OPEN : (i === 3 ? MarketStatus.UPCOMING : MarketStatus.CLOSED);
    const resultStatus = i === 4 ? ResultStatus.DECLARED : ResultStatus.PENDING;
    
    await db.insert(markets).values({
      name: marketTitles[i],
      resultValue: Math.floor(Math.random() * 100).toString().padStart(2, '0'),
      bannerImage: bannerImages[i],
      openingTime,
      closingTime,
      status,
      resultStatus,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  // Create sample option games
  console.log("Creating sample option games...");
  
  const teamMatchups = [
    { teamA: "India", teamB: "Australia" },
    { teamA: "Chennai Super Kings", teamB: "Mumbai Indians" },
    { teamA: "Royal Challengers", teamB: "Rajasthan Royals" },
    { teamA: "New Zealand", teamB: "England" },
    { teamA: "Pakistan", teamB: "Bangladesh" }
  ];
  
  const optionGameTitles = [
    "2023 World Cup Final",
    "IPL Season Opener",
    "T20 Championship Match",
    "Test Series Decider",
    "Asia Cup Semifinal"
  ];
  
  // Create 5 option games
  for (let i = 0; i < 5; i++) {
    // Set opening time to current time and closing to 5 hours later
    const openingTime = new Date();
    const closingTime = new Date();
    closingTime.setHours(closingTime.getHours() + 5);
    
    const status = i < 3 ? MarketStatus.OPEN : (i === 3 ? MarketStatus.UPCOMING : MarketStatus.CLOSED);
    const resultStatus = i === 4 ? ResultStatus.DECLARED : ResultStatus.PENDING;
    
    await db.insert(optionGames).values({
      title: optionGameTitles[i],
      teamA: teamMatchups[i].teamA,
      teamB: teamMatchups[i].teamB,
      bannerImage: bannerImages[i],
      odds: 1.9 + (i * 0.1),
      openingTime,
      closingTime,
      status,
      resultStatus,
      winningTeam: i === 4 ? "A" : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log("Sample data seeding completed successfully!");
}

main()
  .catch(e => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });