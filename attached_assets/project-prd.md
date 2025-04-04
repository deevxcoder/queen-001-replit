# QueenGames Betting Platform: Product Requirements Document

## 1. Overview
QueenGames is an Indian betting game platform with two distinct betting systems: Market Games (number-based) and Option Games (team/choice-based). The system allows administrators to manage both betting systems, while players can place bets on either Markets or Option Games. The platform includes comprehensive user management with multiple roles and transaction handling capabilities.

## 2. Tech Stack
- **Frontend:** Next.js with Tailwind CSS and Shadcn UI
- **Backend:** Supabase
- **Theme:** Dark theme with amber accent highlights

## 3. User Roles & Authentication

### 3.1. Role Hierarchy
- **Admin:** Top-level system administrator
- **Subadmin:** Middle-level administrator with limited access
- **Player:** End user who plays the games

### 3.2. Authentication & Authorization
- Multi-user role-based authentication system
- Role-specific access controls and permissions
- Secure login and session management

### 3.3. User Management Rules

#### 3.3.1. Admin:
- Can create, manage, block, and unblock both subadmins and users
- If admin blocks a user/subadmin, no one can unblock them
- All direct sign-ups are assigned under admin by default
- Can view and manage all users in the system
- Can add/deduct funds from any user's wallet
- Can create and manage both Market Games and Option Games

#### 3.3.2. Subadmin:
- Can create and manage users assigned to them
- Can block users under them (but cannot unblock admin-blocked users)
- Can only view and manage users created by or assigned to them
- Cannot access users created by other subadmins or admin
- Can add/deduct funds from their users
- Cannot directly deposit/withdraw their own funds (must request from admin)

#### 3.3.3. User/Player:
- Can play both Market Games and Option Games
- Can request deposits and withdrawals
- Must be assigned to either admin or a subadmin

## 4. Game Systems

### 4.1. Market Games (Number Games)
- Admin creates markets (e.g., Mumbai Matka, Kalyan Matka)
- Admin selects which game types are available in each market
- Admin controls opening/closing times for markets
- Admin declares results manually for each market
- Players select from available game types (Jodi, Hurf, Cross, Odd-Even)

### 4.2. Option Games
- Completely separate from Market Games
- Admin creates Option Games with two choices (Team A vs Team B)
- No game type selection needed
- Admin controls opening/closing times for Option Games
- Admin declares the winning team (A or B)
- Players bet directly on Team A or Team B

## 5. Market Game Types & Logic

### 5.1. Jodi
- **Description:** Players bet on a two-digit number from 00 to 99
- **Gameplay:**
  - User selects any number between 00 and 99
  - Admin declares a two-digit result for the market
  - User wins if their selected number exactly matches the result
- **Winning Odds:** x90 (configurable by admin)

### 5.2. Odd-Even
- **Description:** Players bet on whether the result will be an odd or even number
- **Gameplay:**
  - User selects either "Odd" or "Even"
  - Admin declares a result number for the market
  - User wins if their selection (odd/even) matches the result's property
- **Winning Odds:** x1.8 (configurable by admin)

### 5.3. Hurf
- **Description:** Players bet on specific digits (left or right) of a two-digit number
- **Gameplay:**
  - User selects a digit (0-9) for either the left position or right position
  - Admin declares a two-digit result (e.g., 57)
  - User wins if their selected digit matches the corresponding position in the result
  - If user selects digits for both positions and both match, they win the higher "Double Match" payout
- **Winning Odds:**
  - Single digit match: x9 (configurable by admin)
  - Double digit match: x80 (configurable by admin)

### 5.4. Cross
- **Description:** Players bet on individual digits that can form permutations
- **Gameplay:**
  - User selects multiple individual digits (e.g., 1,3,7)
  - System generates all possible two-digit permutations (e.g., 13,31,17,71,37,73)
  - Admin declares a two-digit result
  - User wins if any of the permutations match the result
- **Winning Odds:** Varies based on the number of digits selected (configurable by admin)
  - For 2 digits selected (2 permutations): x45
  - For 3 digits selected (6 permutations): x15
  - For 4 digits selected (12 permutations): x7.5

## 6. Option Games Logic

### 6.1. Team Selection
- **Description:** Players bet on Team A or Team B in a toss/match scenario
- **Gameplay:**
  - Admin creates an Option Game with two teams/choices
  - User selects either Team A or Team B
  - Admin declares the winning team
  - User wins if their selected team matches the result
- **Winning Odds:** x1.9 (configurable by admin)

## 7. Gameplay Flows

### 7.1. Market Games Flow
1. Admin creates markets and selects available game types
2. Admin sets opening/closing times for markets
3. Players select a market (e.g., Mumbai Matka)
4. Players see available games for that market (e.g., Jodi and Cross)
5. Players place bets on their chosen game type
6. Admin closes market and declares results manually
7. System determines winners based on bet matching results
8. Winnings are automatically credited to user wallets

### 7.2. Option Games Flow
1. Admin creates Option Games with Team A and Team B choices
2. Admin sets opening/closing times for Option Games
3. Players select an Option Game
4. Players place bets on either Team A or Team B
5. Admin closes Option Game and declares winning team
6. System determines winners based on selected team
7. Winnings are automatically credited to user wallets

## 8. Financial Management

### 8.1. Wallet System
- Every user and subadmin has a wallet
- Balance tracking for all accounts
- Complete transaction history
- Same wallet is used for both Market Games and Option Games

### 8.2. Transaction Types
- **Deposits:** Add funds to wallet
- **Withdrawals:** Remove funds from wallet
- **Bets:** Deduct funds for placing bets
- **Winnings:** Add funds for winning bets
- **Admin Adjustments:** Direct additions/deductions by admin

### 8.3. Transaction Flow

#### 8.3.1. User Transactions:
- **Deposits:**
  - User requests deposit with payment proof/UTR number
  - Subadmin approves/rejects with remarks
  - Funds added to wallet only after approval
- **Withdrawals:**
  - User creates withdrawal request
  - Amount deducted from wallet immediately
  - Subadmin approves/rejects with remarks
  - If rejected, amount is refunded to wallet

#### 8.3.2. Subadmin Transactions:
- **Deposits:**
  - Subadmin creates deposit request
  - Admin approves/rejects with remarks
  - Funds added to wallet after approval
- **Withdrawals:**
  - Subadmin creates withdrawal request
  - Amount deducted immediately
  - Admin approves/rejects with remarks
  - If rejected, amount is refunded

### 8.4. Betting Process
1. User selects either a Market or an Option Game
2. For Market Games: User chooses a game type (Jodi, Hurf, Cross, or Odd-Even)
3. For Option Games: User selects Team A or Team B
4. User enters bet amount
5. System validates bet against user's wallet balance
6. Bet is recorded and amount deducted from wallet
7. When admin declares results, system automatically:
   - Matches results against all bets
   - Calculates winnings based on game odds
   - Credits winning amounts to user wallets
   - Updates bet status (won/lost)

## 9. Database Structure

### 9.1. Core Tables
- **Users:**
  - User information
  - Role (admin, subadmin, user)
  - subadmin_id (for users assigned to subadmins)
  - status (active, blocked)
  - Wallet balance
- **Markets:**
  - Market details
  - Status (open, closed)
  - Opening/closing times
  - Results
- **GameTypes:**
  - Game type definitions
  - Rules and payout ratios
  - Winning odds configuration
- **MarketGames:**
  - Linking markets to game types
  - Which games are available in which markets
- **OptionGames:**
  - Team A name
  - Team B name
  - Status (open, closed)
  - Opening/closing times
  - Winning team
  - Odds
  - Result status
- **Bets:**
  - User bets
  - Reference to either Market Game or Option Game
  - Selected numbers or team
  - Bet amount and potential winnings
  - Status (pending, won, lost)
- **Transactions:**
  - All financial transactions
  - Transaction type
  - Status and approval information
  - References to users and admins
  - is_subadmin_transaction flag

## 10. User Interfaces

### 10.1. Admin Interfaces
- Dashboard with system overview
- User/Subadmin management
- Market Games management section
  - Create/edit markets
  - Select game types for markets
  - Set opening/closing times
  - Declare results
- Option Games management section (separate from Markets)
  - Create/edit Option Games
  - Set Team A and Team B names
  - Set opening/closing times
  - Declare winning team
- Transaction approval system
- Financial reporting

### 10.2. Subadmin Interfaces
- User management dashboard
- Transaction approval for assigned users
- Wallet and financial management
- Personal transaction requests

### 10.3. Player Interfaces
- Game selection with separate sections for:
  - Market Games
  - Option Games
- Market Games betting forms:
  - Jodi: Number selection grid (00-99)
  - Odd-Even: Simple toggle switch
  - Hurf: Left/right digit selection
  - Cross: Multiple digit selection with permutation preview
- Option Games betting form:
  - Team A/B selection buttons
- Wallet and transaction history
- Deposit/withdrawal request forms
- Results and winning history

## 11. Security Considerations
- Role-based access control (RBAC)
- Secure authentication
- Transaction validation
- Data integrity and audit trails
- Protection against common web vulnerabilities

## 12. UI Theme
- Dark theme throughout the application
- Amber accent color for highlights and interactive elements
- High contrast for important elements
- Consistent visual identity across all sections

## 13. Future Enhancements (Optional)
- Automated result declaration
- Additional game types
- Enhanced analytics and reporting
- Mobile application
- Loyalty/reward system for frequent players
- Real-time notifications for results and winnings