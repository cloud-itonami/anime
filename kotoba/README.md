# anime kotoba

Phase E Option B reference implementation of anime (anime title + season + episode + schedule + review registry) on the etzhayyim substrate.

Per [ADR-2605203000](../../../90-docs/adr/2605203000-kotoba-write-target-options.md), anime migrates from vendor's `createKyselyDb` pattern (RW direct write) to **Option B** — PDS XRPC writes via `@etzhayyim/sdk e.write()`.

Coverage: **10 of 10 (100%)** anime canonical XRPC commands ported.

| Tier | Commands | Slice |
|---|---|---|
| Title | createTitle, getTitle, listTitles, searchTitles | 1 |
| Season + Episode + Schedule | createSeason, createEpisode, listEpisodes, createSchedule, listSchedules | 2 |
| Review | submitReview | 3 |

All 10 canonical anime lexicons now have kotoba reference impl. Wire-up to a Worker / LangServer pod XRPC handler is the next operator task per ADR-2605203000.

## Authority-chain DIDs (per anime design)

```
did:web:anime.etzhayyim.com                       — controller
did:web:anime.etzhayyim.com:title:{titleId-slug}  — Title
did:web:anime.etzhayyim.com:season:{seasonId}     — Season
did:web:anime.etzhayyim.com:episode:{episodeId}   — Episode
did:web:anime.etzhayyim.com:schedule:{scheduleId} — Schedule
did:web:anime.etzhayyim.com:review:{reviewId}     — Review
```

## Storage

Anime metadata is stored on PDS. No IPFS pointers. Phase 3 mst-projector may add aggregate views for cross-season browsing.

## Pattern translation (Option B)

| Vendor (`anime.etzhayyim.com`) | etzhayyim (this PR) |
|---|---|
| `const db = createKyselyDb();` | `import type { Etzhayyim } from "@etzhayyim/sdk"` |
| `db.insertInto("vertex_anime_title").values({...}).execute()` | `e.write({ collection: "com.etzhayyim.anime.title", record, rkey })` |
| `db.selectFrom("vertex_anime_title").where("title_id","=",id).execute()` | `e.read({ collection, rkey: \`title-${titleSlug(id)}\` })` |

## Usage

```ts
import { Etzhayyim } from "@etzhayyim/sdk";
import { createTitle, getTitle, listTitles, submitReview } from "@etzhayyim/anime-kotoba";

const e = new Etzhayyim({
  did: "did:web:anime.etzhayyim.com",
  pdsUrl: "https://pds.etzhayyim.com",
  l2RpcUrl: "https://mainnet.base.org",
});

// Submit title
const titleResp = await createTitle(e, {
  titleId: "bonsai-cultivar-2026",
  title: "Bonsai Cultivar Chronicles",
  titleJa: "盆栽品種年代記",
  genre: "drama",
  synopsis: "A story of botanical mastery...",
  studio: "Etzhayyim Studios",
  sourceType: "original",
});
// → { status: "registered", titleUri: "at://...", did: "did:web:anime.etzhayyim.com:title:..." }

// Get title with seasons
const getResp = await getTitle(e, { titleId: "bonsai-cultivar-2026" });
// → { title: {...}, seasons: [...] }

// Submit review
const reviewResp = await submitReview(e, {
  reviewId: "bonsai-2026-s1e1-reviewer1",
  titleId: "bonsai-cultivar-2026",
  seq: 1,
  reviewerDid: "did:plc:abc...",
  rating: 850,
  body: "Exceptional storytelling and animation.",
});
// → { status: "registered", reviewUri: "at://...", reviewId: "..." }
```

## Why Option B for anime

Per ADR-2605203000 Phase E decision matrix:
- **Catalog**: structured metadata (title / season / episode / schedule / review) — open standards
- **Write cadence**: low-to-medium — editorial schedule registration + viewer reviews
- **Query pattern**: by title / season / schedule (Phase 3 indexed views via mst-projector)

Option A (vendor RW mirror) rejected — ADR-2605172000 mandates kotoba.
Option C (IPFS-only) N/A — no blob storage needed for metadata.

## What this package IS / ISN'T

**IS**:
- Reference impl of 10 anime commands on Option B (PDS XRPC).
- Documentation of the createKyselyDb → e.write() translation.

**ISN'T**:
- A deployed Worker (scaffold-only).
- Full integration with broadcast systems or episode tracking — metadata only.

## Related

- [ADR-2605203000](../../../90-docs/adr/2605203000-kotoba-write-target-options.md) — Phase E write-target options
- [kiyo kotoba](../../etzhayyim-project-kiyo/kotoba/) — sibling Option B reference (12/12 ✓)
- [sbom kotoba](../../etzhayyim-project-sbom/kotoba/) — Option B reference (17/N)
- [hanrei kotoba](../../etzhayyim-project-hanrei/kotoba/) — Option B reference (31/31 ✓)
