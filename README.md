# anime — アニメ作品レジストリ（title / season / episode / schedule / review）

アニメの**作品メタデータ**を etzhayyim substrate 上に登録・照会するレジストリの
リファレンス実装。作品（title）→ シーズン（season）→ 話数（episode）に加えて、
放送予定（schedule）と視聴者レビュー（review）を扱う。

**これは「アニメを配信する」ものではない。**動画・画像は一切扱わず、PDS に載る
構造化メタデータだけを所有する（[Storage](#storage) 節）。

## 現在地 — scaffold であって稼働中サービスではない

| | 状態 |
|---|---|
| kotoba 参照実装（10 コマンド） | **在る**。`kotoba/src/`。テスト 13 ケースが Mock に対して通る（2026-08-11 実測） |
| XRPC アダプタ（CF Worker） | **在るがデプロイされていない**。`xrpc-adapter/` は現状 `npm install` が通らない（[quickstart](docs/operator-quickstart.md) の B1） |
| BPMN プロセス定義 | **在る**。`bpmn/ingest-anime.bpmn` |
| 本番稼働 | **無い**。`anime.etzhayyim.com/xrpc/*` は wrangler 設定上のルートであって、稼働の証拠ではない |

**依存 SDK の GitHub 上の所在が変わっている**（`etzhayyim/com-etzhayyim-sdk` →
`kotoba-lang/sdk`）。現状は GitHub のリダイレクトで解決できているが、その橋 1 本に
依存している。詳細と実測は [quickstart](docs/operator-quickstart.md) の B2。

まず動かすなら **[docs/operator-quickstart.md](docs/operator-quickstart.md)** を読む。
依存ゼロで踏める smoke test から始まり、テスト 13 ケースまでは実測で通る。

## 構成

```
kotoba/          10 コマンドの参照実装（TypeScript, PDS XRPC 経由の書き込み）
  src/types.ts     record 型 + DID/rkey の導出（依存ゼロ・単体で実行可能）
  src/titles.ts    title tier: createTitle / getTitle / listTitles / searchTitles
  src/episodes.ts  season / episode / schedule / review tier（残り 6 コマンド）
  test/            vitest。MockEtzhayyim に対して 13 ケース
xrpc-adapter/    上記 10 コマンドを XRPC エンドポイントとして公開する CF Worker
bpmn/            ingest プロセス定義（Camunda 拡張つき BPMN 2.0）
README.edn       リポジトリメタデータ（正本は EDN）
migration.edn    抽出元の記録（下記 Provenance）
```

## 10 コマンド

`kotoba/src/` が export する関数と、`xrpc-adapter` が張る NSID は 1 対 1 に対応する
（NSID は `com.etzhayyim.anime.<command>`）。

| Tier | コマンド | 種別 |
|---|---|---|
| Title | `createTitle` `getTitle` `listTitles` `searchTitles` | POST / GET / GET / GET |
| Season | `createSeason` | POST |
| Episode | `createEpisode` `listEpisodes` | POST / GET |
| Schedule | `createSchedule` `listSchedules` | POST / GET |
| Review | `submitReview` | POST |

書き込み系は **rkey による冪等性**を持つ。同じ id で二度呼ぶと二重登録ではなく
`{status: "alreadyExists"}` が返る（rkey は `{tier}-{id-slug}`）。

## 識別子（DID）

```
did:web:anime.etzhayyim.com                        — controller
did:web:anime.etzhayyim.com:title:{titleId-slug}   — Title
did:web:anime.etzhayyim.com:season:{seasonId}      — Season
did:web:anime.etzhayyim.com:episode:{episodeId}    — Episode
did:web:anime.etzhayyim.com:schedule:{scheduleId}  — Schedule
did:web:anime.etzhayyim.com:review:{reviewId}      — Review
```

slug 化は `[^a-z0-9]` を `-` に潰す**非可逆**変換なので、DID から元の id は
復元できない。`titleId` の検証（`createTitle`）は大文字小文字を区別しないため、
`Naruto` と `naruto` は同じ rkey に落ちる。

## Storage

メタデータは PDS 上のレコードとして持ち、**IPFS ポインタも blob も持たない**。
横断ビュー（シーズンをまたぐ一覧など）は Phase 3 の mst-projector 側の仕事で、
このリポジトリの守備範囲ではない。

## 名前と org について（読み替えが要る）

このリポジトリは **`cloud-itonami/anime`** に在るが、中身の識別子は etzhayyim の
ままになっている。混乱を避けるため明記する:

| 場所 | 値 |
|---|---|
| リポジトリのパス | `orgs/cloud-itonami/anime` |
| `README.edn` の `:name` | `com-etzhayyim-app-anime` |
| DID / コレクション NSID | `did:web:anime.etzhayyim.com` / `com.etzhayyim.anime.*` |
| npm パッケージ名 | `@etzhayyim/anime-kotoba` |

**DID と NSID は改名しない。**これらは発行済み識別子であって discovery のための
別名ではない（ドメイン移転で改名しないのと同じ理由）。読むときは「パスは
cloud-itonami、識別子は etzhayyim」と読み替える。

## Provenance

`etzhayyim/root` の `60-apps/etzhayyim-project-anime` から抽出した（15 ファイル /
42,799 バイト、抽出元 revision は `migration.edn` に記録）。

抽出の結果、**サブディレクトリの README にモノレポ前提の相対リンクが残っていた**
（`../../../90-docs/adr/…`、`../../etzhayyim-project-kiyo/…` など）。2026-08-11 に
リンク切れとして直したが、参照先の ADR 本文はこのリポジトリには無い ——
`kotoba-lang` / `etzhayyim` 側の設計 ADR（2605203000: 書き込み先の選択、
2605210000: XRPC アダプタ）を指しており、ここでは番号だけを引く。

## 設計上の位置づけ（Option B）

ベンダ実装の `createKyselyDb`（RDB への直接書き込み）ではなく、
**PDS XRPC 経由の書き込み**（`e.write()`）を採る。対応関係:

| ベンダ実装 | ここでの実装 |
|---|---|
| `createKyselyDb()` | `import type { Etzhayyim } from "@etzhayyim/sdk"` |
| `db.insertInto("vertex_anime_title").values({…})` | `e.write({ collection: "com.etzhayyim.anime.title", record, rkey })` |
| `db.selectFrom(…).where("title_id","=",id)` | `e.read({ collection, rkey: titleRkey(id) })` |

blob ストレージが要らないため IPFS-only 案は採らない。詳細は `kotoba/README.md`。
