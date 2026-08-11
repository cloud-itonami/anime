# operator quickstart

このリポジトリを初めて触る人が、**何が動いて何が動かないか**を確かめるための手順。
ここに書いてある手順は全部、実際に踏んで出力を確認したものだけ。踏めなかったものは
「踏めなかった」と書いてある（→ [踏めていない手順](#踏めていない手順正直な申告)）。

最終実測日: **2026-08-11** / macOS arm64 / Node v26.3.0 / vitest 4.1.10

| | 実測に使った版・値 |
|---|---|
| Node | v26.3.0（§2 の依存ゼロ smoke test に **22 以上**が要る — TypeScript の型剥がしを使う） |
| ディスク空き | `kotoba` の依存で **311 MB**、`xrpc-adapter` で **422 MB**。§3 まで行くなら **1 GB** 見ておく |
| ネットワーク | GitHub（SDK を git 依存で取る）と npm レジストリ |

## 1. 取得

```bash
git clone git@github.com:cloud-itonami/anime.git
cd anime
```

## 2. 依存ゼロの smoke test

**`npm install` を一切せずに**、識別子まわり（DID / rkey の導出）が動くことを
確認できる。`kotoba/src/types.ts` は外部 import を持たないので、Node の TypeScript
型剥がしだけで直接実行できる。

```bash
cd kotoba
node -e '
import("./src/types.ts").then(m => {
  console.log("titleDid:   ", m.titleDid("bonsai-cultivar-2026"));
  console.log("titleRkey:  ", m.titleRkey("Bonsai_Cultivar 2026"));
  console.log("seasonDid:  ", m.seasonDid("jjk-s1"));
  console.log("episodeRkey:", m.episodeRkey("MHA-1-1"));
  console.log("reviewDid:  ", m.reviewDid("review-1"));
});'
```

出力（2026-08-11 実測、そのまま）:

```
titleDid:    did:web:anime.etzhayyim.com:title:bonsai-cultivar-2026
titleRkey:   title-bonsai-cultivar-2026
seasonDid:   did:web:anime.etzhayyim.com:season:jjk-s1
episodeRkey: episode-mha-1-1
reviewDid:   did:web:anime.etzhayyim.com:review:review-1
```

読み取れること: slug 化は大文字を小文字に落とし、`_` と空白と `-` を区別せず
すべて `-` に潰す。つまり **DID から元の id は復元できない**し、`Naruto` と
`naruto` は同じ rkey を指す。

**`src/titles.ts` と `src/episodes.ts` は同じやり方では動かない。**この 2 つは
`./types.js` という指定で import しており（tsc の NodeNext 流儀）、ディスク上の
実体は `types.ts` である。Node の型剥がしは `.js` → `.ts` の読み替えをしないので

```
Cannot find module .../src/types.js imported from .../src/titles.ts
```

で落ちる。壊れているのではなく、**vitest / tsc のような TypeScript 対応リゾルバが
要る**ということ（→ §3）。

## 3. テストスイート（実測で通る）

```bash
cd kotoba
npm install     # 311 MB / 実測 約 1 分
npm test        # vitest run
```

2026-08-11 実測:

```
 RUN  v4.1.10

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  404ms
```

13 ケースは `@etzhayyim/sdk-mock` の `MockEtzhayyim` に対して走るので、**PDS への
ネットワークアクセスは発生しない**。固定している不変条件:

- `createTitle` が titleId 空を `{status:"rejected", error:"invalidTitleId"}` で弾く
- 同じ titleId の二度目が `alreadyExists` になり DID が一致する（rkey 冪等性）
- `listTitles` の genre 絞り込みと `searchTitles` のキーワード一致
- `createEpisode` が seasonId 無しを `missingSeasonId` で弾く
- `submitReview` の rating が 0–1000 の外なら `invalidRating`

> `npm install` は SDK の推移的依存（`@atproto/api` / `zod` / `ox` / `libsignal`）を
> git 経由で取るので重い。**途中で `ENOSPC` に当たったら**、展開途中のごみが
> `~/.npm/_cacache/tmp/` に数百 MB 単位で残る。`du -sh ~/.npm/_cacache/tmp` で確認して
> `rm -rf ~/.npm/_cacache/tmp/git-clone*` で戻すこと（2026-08-11 に実際に踏んだ）。

## 4. XRPC アダプタ

**現状ここは動かせない。**`xrpc-adapter/` は単体で `npm install` が通らない（→ B1）。
ルーティング表そのものは `xrpc-adapter/src/index.ts` を読めば確認できる（10 コマンドが
`com.etzhayyim.anime.<command>` に 1 対 1 で対応、POST 5 / GET 5）。

---

## 既知のブロッカー

### B1. xrpc-adapter は単体で `npm install` できない

```bash
cd xrpc-adapter && npm install
```

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

`package.json` が `"@etzhayyim/anime-kotoba": "workspace:*"` を要求しているが、
**このリポジトリにはワークスペースの根が無い**（ルートに `package.json` も
`pnpm-workspace.yaml` も無い）。モノレポ `etzhayyim/root` から抽出したときに、
ワークスペースの根だけが付いてこなかった。

**ディスクの空きとは無関係に構造的に失敗する** —— 空き 5.8 GiB でも同じエラーで
落ちることを確認済み（`--dry-run` でも同じ）。

解消するなら、どれか 1 つ:

1. ルートに workspaces 宣言つきの `package.json` を足す（抽出前の形に戻す）
2. 当該行を `"file:../kotoba"` に変える
3. `kotoba` を publish して版で参照する

**2 は実際に通ることを確認した**（2026-08-11、`file:../kotoba` に書き換えると
`npm install` が完走し `node_modules/@etzhayyim/anime-kotoba` が生える。確認後は
`workspace:*` に戻してある）。ただし**どれを採るかはまだ決めていない** ——
リポジトリの依存関係の形を決める判断で、quickstart の範囲を超える。選ぶときは
ADR を起こすこと。

### B2. SDK 依存は GitHub のリダイレクトに依存している

`kotoba/package.json` と `xrpc-adapter/package.json` は SDK を**旧 org の URL**で
参照している。実測（2026-08-11）:

| package.json の参照先 | 現在の実体 |
|---|---|
| `etzhayyim/com-etzhayyim-sdk` | `kotoba-lang/sdk` |
| `etzhayyim/com-etzhayyim-sdk-mock` | `kotoba-lang/sdk-mock` |
| `etzhayyim/com-etzhayyim-sdk-auth` | `kotoba-lang/sdk-auth` |

**今は解決する**（§3 が実際に通っているのがその証拠）。旧 URL への `git ls-remote` は
GitHub のリダイレクトで通り、固定 commit も両方まだ到達可能:

```bash
git ls-remote https://github.com/etzhayyim/com-etzhayyim-sdk.git HEAD
gh api repos/kotoba-lang/sdk/commits/12314a0cc5ac2feb49dd9789d5c002398acb6988 --jq .sha
gh api repos/kotoba-lang/sdk-mock/commits/c857ff9be5310bf433bfe1e8d3c0f677e213d667 --jq .sha
```

つまり**今日は壊れていないが、GitHub のリダイレクトが唯一の橋になっている。**
旧 org 側で同名リポジトリが作り直されればリダイレクトは消える。参照先を
`kotoba-lang/*` に書き換えるのが素直だが、pin の変更を伴うので B1 と一緒に
決めるのがよい。

---

## 踏めていない手順（正直な申告）

2026-08-11 の実測で**確認できなかった**もの。動く保証は無い:

| 手順 | 状態 | 理由 |
|---|---|---|
| `cd xrpc-adapter && npm install`（現状のまま） | **失敗を確認** | B1。構造的に必ず失敗する |
| `wrangler dev` | **未確認** | B1 の先。到達できていない |
| `wrangler deploy` | **未確認** | 同上。デプロイ実績も無い |
| 実 PDS（`pds.etzhayyim.com`）への読み書き | **未確認** | テストは Mock に対してのみ。実 PDS には一度も触れていない |

確認できたのは §2（依存ゼロ smoke test）・§3（13 ケース通過）・B1 / B2 の実測まで。
