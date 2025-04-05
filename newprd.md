# QueenGames Betting Platform: Product Requirements Document (PRD)

## Executive Summary

QueenGames is a comprehensive online betting platform providing Indian number-based betting games (Market Games) and team/choice-based betting options (Option Games). The platform features a three-tier user system with different access levels and capabilities, real-time updates via WebSockets, and a complete transaction management system. This document outlines the current implementation status, pending tasks, and future enhancement opportunities.

## System Architecture

The application is built using a modern full-stack TypeScript architecture:

- **Frontend**: React with Tailwind CSS and ShadCN UI components
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSockets for notifications and live updates
- **State Management**: React Query for data fetching and caching
- **Authentication**: Session-based with role-specific redirects

## Core Features Implemented

### 1. Role-Based User System

Three distinct user roles with hierarchical permissions:

- **Admin**
  - Full system control
  - Can create/manage markets and games
  - Can manage all users
  - Can process all financial transactions
  - Access to comprehensive analytics

- **Subadmin**
  - Can manage assigned players
  - Limited market/game management
  - Can process financial transactions for assigned players
  - Access to player-specific analytics

- **Player**
  - Can place bets on Market and Option Games
  - Can request deposits and withdrawals
  - Access to personal betting history and transaction records
  - Limited analytics focused on personal performance

### 2. Market Games (Number-Based Betting)

- Implemented four different bet types:
  - **Jodi**: Betting on specific two-digit combinations
  - **Hurf**: Betting on specific positions in a number
  - **Cross**: Betting on numbers that may appear in multiple positions
  - **Odd-Even**: Betting on whether the result will be odd or even

- Features:
  - Markets with configurable open/close times
  - Custom banner image support
  - Multiple game types per market
  - Result declaration system with automated payout

### 3. Option Games (Team-Based Betting)

- Simple two-team (A vs B) betting mechanism
- Configurable odds for each team
- Custom banner image support
- Result declaration with automated winner payouts

### 4. Transaction System

- Comprehensive wallet management for all users
- Multiple transaction types:
  - Deposits (request & approval flow)
  - Withdrawals (request & approval flow)
  - Bet placements (automatic)
  - Winnings (automatic)
  - Balance adjustments (admin-initiated)

- Transaction approval workflow:
  - Player can request deposits/withdrawals
  - Admin/Subadmin can approve/reject requests
  - Admins can directly adjust user balances

### 5. Real-Time Notifications

- WebSocket-based live updates for:
  - Game results
  - Transaction status changes
  - Wallet balance updates
  - System announcements
  - New game notifications

- Custom notification UI with visual differentiation by type

### 6. Analytics and Reporting

- Role-specific dashboards with:
  - Daily/weekly/monthly activity charts
  - Game performance metrics
  - Financial summaries
  - User activity tracking
  - Winning/losing patterns

### 7. Security and Authentication

- Secure login/registration system
- Session-based authentication
- Role-based access control
- Input validation and sanitation
- Protected routes with automatic redirection

## Pending Tasks

### 1. Game Management Improvements

- **Market Games**:
  - Implement game type-specific betting forms
  - Add number selection interface for players
  - Create result declaration UI for admins
  - Build betting history by market

- **Option Games**:
  - Enhance odds calculation system
  - Add multi-team support (beyond just A vs B)
  - Implement betting limits based on user class

### 2. User Management Enhancements

- Implement user profile editing
- Add user status toggle (active/blocked)
- Create user creation form for admins/subadmins
- Build comprehensive user search and filtering

### 3. Financial System Completion

- Implement deposit request form for players
- Create withdrawal request form with validation
- Build transaction approval interface for admins
- Add transaction export functionality (CSV/PDF)
- Implement financial reports by date range

### 4. UI/UX Improvements

- Mobile responsiveness optimization
- Dark/light theme toggle
- Accessibility improvements
- Loading indicators and skeleton screens
- Form validation improvement and error handling

### 5. Backend Optimizations

- Implement caching for frequently accessed data
- Batch processing for notifications
- API rate limiting for security
- Logging and monitoring improvements
- Database indexing optimizations

## Future Enhancements

### 1. Advanced Betting Features

- **Parlay/Accumulator Bets**: Allow players to combine multiple bets for higher payouts
- **Handicap Betting**: Implement point spread betting for option games
- **Live Betting**: Enable betting during ongoing events with dynamic odds
- **Scheduled Games**: Automatic opening/closing of markets based on schedule
- **Favorites System**: Allow players to save favorite games and markets

### 2. Social and Engagement Features

- **Leaderboards**: Show top winners by game and time period
- **Achievements**: Gamification elements for player retention
- **Referral System**: Reward players for bringing new users
- **Chat System**: Allow players to communicate in game lobbies
- **Notifications**: Push notifications for mobile users

### 3. Financial Enhancements

- **Multiple Payment Methods**: UPI, bank transfer, and cryptocurrency support
- **Loyalty Program**: Points-based system for regular players
- **Automated Payouts**: Scheduled processing of withdrawal requests
- **Bonus System**: Deposit bonuses and promotional credits
- **Subscription Model**: VIP membership with special benefits

### 4. Administrative Tools

- **Risk Management**: Automated flagging of suspicious betting patterns
- **User Segmentation**: Group users for targeted promotions
- **Advanced Analytics**: Predictive modeling for game popularity
- **Automated Reporting**: Scheduled email reports for admins
- **Audit Logs**: Comprehensive tracking of admin actions

### 5. Technical Improvements

- **Mobile App**: Native applications for iOS and Android
- **CDN Integration**: For faster content delivery
- **Microservices Architecture**: For better scalability
- **Multi-language Support**: Localization for different Indian languages
- **Advanced Security**: Two-factor authentication and other security measures

## Technical Debt & Known Issues

1. TypeScript type issues in certain components need fixing
2. Form validation needs improvement in betting forms
3. WebSocket reconnection handling needs enhancement
4. Some date handling issues in the market time displays
5. Mobile responsiveness issues in dashboard components
6. Error handling standardization across application

## Development Timeline

### Phase 1 (Completed)
- Core authentication system
- Basic role-based functionality
- Initial market and option game implementation
- Transaction system foundation
- WebSocket notification system setup

### Phase 2 (Current)
- Enhanced betting interfaces
- Comprehensive transaction workflows
- User management improvements
- Analytics dashboard enhancements
- Bug fixes and performance optimizations

### Phase 3 (Upcoming)
- Advanced betting features
- Mobile responsiveness optimization
- Financial system enhancements
- Report generation functionality
- Comprehensive testing and security audit

### Phase 4 (Future)
- Social and engagement features
- Advanced administrative tools
- Additional payment methods
- Performance scaling optimizations
- Mobile application development

## Conclusion

QueenGames Betting Platform has established a solid foundation with core betting functionality, role-based access control, and real-time updates. The focus for the next development phase should be on enhancing the betting interfaces, completing the transaction workflows, and improving overall user experience. This PRD will serve as a living document to guide ongoing development efforts.
