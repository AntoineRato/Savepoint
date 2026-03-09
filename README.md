# Savepoint

Track your game library with Steam sync and RAWG integration.

## Features

- Search and add games via [RAWG](https://rawg.io) (auto-fills title, genre, cover, rating, Steam App ID)
- Track status: Backlog, Playing, Completed, Dropped
- Log hours played, rating, dates, and notes
- Sync playtime automatically from your Steam library
- Duplicate prevention

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (local, via better-sqlite3)
- **APIs:** RAWG, Steam Web API

## Getting Started

### Prerequisites

- Node.js 18+
- A free [RAWG API key](https://rawg.io/apidocs)
- A [Steam API key](https://steamcommunity.com/dev/apikey) *(optional, for Steam sync)*

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/savepoint.git
   cd savepoint
   ```

2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Start the backend:
   ```bash
   cd server && npm run dev
   ```

4. Start the frontend (in a new terminal):
   ```bash
   cd client && npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Configuration

Go to **Settings** and enter:
- Your **RAWG API key** (required for game search)
- Your **Steam ID** or vanity URL (optional)
- Your **Steam API key** (optional)

API keys are stored locally in your SQLite database and never sent anywhere except the respective APIs.

## License

MIT © [Antoine Rato](https://github.com/your-username)
