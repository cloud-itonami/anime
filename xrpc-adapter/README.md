# anime XRPC Adapter

CF Worker that exposes the 10 kotoba commands as XRPC endpoints.

## Endpoints

**POST** methods:
- `createTitle` — register anime title
- `createSeason` — register season under title
- `createEpisode` — register episode under season
- `createSchedule` — register broadcast schedule
- `submitReview` — submit viewer review

**GET** methods:
- `getTitle?titleId=...` — fetch title with seasons
- `listTitles?limit=...&offset=...` — paginated titles
- `searchTitles?query=...` — keyword search
- `listEpisodes?seasonId=...` — episodes for season
- `listSchedules?titleId=...` — schedules with filters

## Setup

```bash
cd 60-apps/etzhayyim-project-anime/xrpc-adapter
npm install
```

## Development

```bash
npm run dev
# Worker listens on http://localhost:8787
```

## Deploy

```bash
wrangler deploy
# Deploys to anime.etzhayyim.com/xrpc/*
```

See ADR-2605210000 for design context.
