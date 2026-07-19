/**
 * anime kotoba — title registry (tier 1).
 *
 *   createTitle      — register new anime title (rkey=title-{titleId})
 *   getTitle         — rkey-direct read + seasons
 *   listTitles       — cursor + genre/status filter
 *   searchTitles     — post-fetch keyword search
 *
 * Idempotency: title rkey = title-{titleId-slug}.
 */

import type { Etzhayyim } from "@etzhayyim/sdk";
import {
  titleDid,
  titleRkey,
  type CreateTitleInput,
  type CreateTitleOutput,
  type GetTitleInput,
  type GetTitleOutput,
  type ListTitlesInput,
  type ListTitlesOutput,
  type SearchTitlesInput,
  type SearchTitlesOutput,
  type TitleRecord,
  type TitleView,
} from "./types.js";

const TITLE_COLLECTION = "com.etzhayyim.anime.title";
const SEASON_COLLECTION = "com.etzhayyim.anime.season";

function isTitleId(id: string): boolean {
  return /^[a-z0-9-]{1,32}$/i.test(id);
}

export async function createTitle(
  e: Etzhayyim,
  input: CreateTitleInput
): Promise<CreateTitleOutput> {
  if (!input.titleId || !isTitleId(input.titleId)) {
    return { status: "rejected", error: "invalidTitleId" };
  }
  if (!input.title) {
    return { status: "rejected", error: "missingTitle" };
  }
  const rkey = titleRkey(input.titleId);
  const existing = await e
    .read<TitleRecord>({ collection: TITLE_COLLECTION, rkey })
    .catch(() => ({ records: [] }));
  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      titleUri: existing.records[0].uri,
      did: existing.records[0].value.did,
      titleId: input.titleId,
    };
  }
  const did = titleDid(input.titleId);
  const now = new Date().toISOString();
  const record: TitleRecord = {
    did,
    titleId: input.titleId,
    title: input.title,
    titleJa: input.titleJa,
    genre: input.genre,
    tags: input.tags,
    synopsis: input.synopsis,
    studio: input.studio,
    sourceType: input.sourceType,
    status: "planning",
    createdAt: now,
    updatedAt: now,
  };
  const receipt = await e.write({
    collection: TITLE_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });
  return {
    status: "registered",
    titleUri: receipt.uri,
    did,
    titleId: input.titleId,
  };
}

export async function getTitle(
  e: Etzhayyim,
  input: GetTitleInput
): Promise<GetTitleOutput> {
  if (!input.titleId) return { error: "missingTitleId" };
  const resp = await e
    .read<TitleRecord>({
      collection: TITLE_COLLECTION,
      rkey: titleRkey(input.titleId),
    })
    .catch(() => ({ records: [] }));
  const r = resp.records[0];
  if (!r) return { error: "notFound" };
  const title: TitleView = { ...r.value, titleUri: r.uri };

  const seasonResp = await e.read<any>({
    collection: SEASON_COLLECTION,
  }).catch(() => ({ records: [] }));
  const seasons = seasonResp.records
    .filter((s: any) => s.value?.titleId === input.titleId)
    .map((s: any) => s.value);

  return { title, seasons };
}

export async function listTitles(
  e: Etzhayyim,
  input: ListTitlesInput = {}
): Promise<ListTitlesOutput> {
  const limit = Math.min(input.limit ?? 50, 100);
  const resp = await e.read<TitleRecord>({
    collection: TITLE_COLLECTION,
    limit,
  });
  const items: TitleView[] = resp.records
    .filter((r) => {
      const v = r.value;
      if (input.genre && v.genre !== input.genre) return false;
      if (input.status && v.status !== input.status) return false;
      return true;
    })
    .map((r) => ({ ...r.value, titleUri: r.uri }));
  return {
    titles: items,
    offset: input.offset ?? 0,
    limit,
    total: items.length,
  };
}

export async function searchTitles(
  e: Etzhayyim,
  input: SearchTitlesInput
): Promise<SearchTitlesOutput> {
  if (!input.q) {
    return { titles: [], total: 0, offset: 0, limit: 0 };
  }
  const limit = Math.min(input.limit ?? 50, 100);
  const q = input.q.toLowerCase();
  const resp = await e.read<TitleRecord>({
    collection: TITLE_COLLECTION,
    limit: 1000,
  });
  const items: TitleView[] = resp.records
    .filter((r) => {
      const v = r.value;
      if (input.genre && v.genre !== input.genre) return false;
      const titleMatch = v.title.toLowerCase().includes(q);
      const synopsisMatch = v.synopsis?.toLowerCase().includes(q);
      const tagsMatch = v.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!titleMatch && !synopsisMatch && !tagsMatch) return false;
      return true;
    })
    .map((r) => ({ ...r.value, titleUri: r.uri }))
    .slice(input.offset ?? 0, (input.offset ?? 0) + limit);
  return {
    titles: items,
    total: resp.records.length,
    offset: input.offset ?? 0,
    limit,
  };
}
