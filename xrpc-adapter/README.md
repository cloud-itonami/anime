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

> ⚠ **This does not currently work.** `npm install` here fails with
> `EUNSUPPORTEDPROTOCOL — Unsupported URL Type "workspace:"`, because
> `package.json` depends on `"@etzhayyim/anime-kotoba": "workspace:*"` but this
> repository has no workspace root (the extraction from `etzhayyim/root` left it
> behind). The failure is structural — it is not a disk or network problem.
>
> Cause, the three ways to fix it, and which one was verified to work are in
> [`../docs/operator-quickstart.md`](../docs/operator-quickstart.md) (blocker B1).
> Nothing below has been run since the extraction.

```bash
cd xrpc-adapter      # path is repo-relative now, not 60-apps/etzhayyim-project-anime/...
npm install          # ← fails today, see above
```

## Development

```bash
npm run dev
# Worker would listen on http://localhost:8787
```

## Deploy

```bash
wrangler deploy
# Would deploy to anime.etzhayyim.com/xrpc/*
```

The route in `wrangler.jsonc` is configuration, **not evidence of a live deployment** —
this Worker has no deployment record.

See ADR-2605210000 (upstream design ADR, not carried into this repository) for design
context.
