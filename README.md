# FIFA 2026 World Cup Tournament Manager

A full-stack 2026 FIFA World Cup tournament manager with live scores, group standings, top scorers, and knockout bracket visualization.

## Features

- **Live Scores** — Real-time match results from football-data.org, cached server-side (55s TTL)
- **Group Standings** — Auto-computed from live match data with qualifying spot highlights
- **Top Scorers** — Live goal scorer data from worldcup26.ir, with auto-name expansion from seeded player names
- **Knockout Bracket** — Interactive bracket editor with drag-and-drop team assignment
- **Match Simulation** — Rating-based simulation for testing tournament scenarios
- **Statistics Dashboard** — Golden Boot race, team offensive output, control metrics
- **PDF Export** — Download bracket as PDF

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Express.js, TypeORM |
| Database | SQLite (dev) / PostgreSQL (production) |
| Live Scores | football-data.org API |
| Goal Scorers | worldcup26.ir API |
| Deploy | Azure Container Apps (backend), Vercel (frontend) |

## Project Structure

```
├── app/                    # Next.js frontend
│   ├── app/(dashboard)/    # Routes (group-stage, knockout, schedule, statistics)
│   ├── components/         # React components
│   └── lib/api.ts          # API client
├── server/                 # Express backend
│   ├── src/entities/       # TypeORM entities (Match, Team, Player)
│   ├── src/routes/         # API routes (matches, groups, stats, tournament)
│   ├── src/lib/            # Live stats, knockout logic
│   └── src/seed.ts         # Database seeder
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
# Install dependencies
cd server && npm install
cd ../app && npm install

# Set up environment variables
cp server/.env.example server/.env
```

Required environment variables (`server/.env`):

```
PORT=4000
FOOTBALL_DATA_API_TOKEN=your_token
FOOTBALL_DATA_COMPETITION_CODE=WC
API_FOOTBALL_KEY=your_key  # Optional, for assist leaders
```

### Run

```bash
# Seed database and start backend
cd server && npm run seed && npm start

# Start frontend (separate terminal)
cd app && npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /matches` | All matches |
| `GET /matches/live` | Live match results (55s cache) |
| `GET /groups` | Groups with teams |
| `GET /groups/:id/standings` | Group standings |
| `GET /stats/top-scorers` | Top scorers (worldcup26.ir → DB) |
| `GET /stats/standings` | Live group standings |
| `GET /tournament/bracket` | Knockout bracket |
| `PUT /matches/:id` | Update match score |
| `POST /matches/:id/simulate` | Simulate match |

## Live Data Sources

1. **football-data.org** — Match scores, status, venues. Cached for 55s to respect rate limits.
2. **worldcup26.ir** — Free API for goal scorers with player names and minutes. No API key required.
3. **API-Football** — Paid fallback for top scorers and assist leaders (optional).

## Deployment

- **Backend**: Docker → Azure Container Registry → Azure Container Apps
- **Frontend**: Git push → Vercel (auto-deploy from `main` branch)
- **Database**: PostgreSQL (production), SQLite (development)

## License

MIT
