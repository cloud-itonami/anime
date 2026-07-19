/**
 * anime kotoba — season, episode, schedule, review (tiers 2-4).
 *
 *   createSeason     — register season under title (rkey=season-{seasonId})
 *   createEpisode    — register episode under season (rkey=episode-{episodeId})
 *   listEpisodes     — episodes for season
 *   createSchedule   — register broadcast schedule (rkey=schedule-{scheduleId})
 *   listSchedules    — schedules with optional filters
 *   submitReview     — viewer review (rkey=review-{reviewId})
 *
 * Idempotency: rkey = {tier}-{id-slug}.
 */

import type { Etzhayyim } from "@etzhayyim/sdk";
import {
  seasonDid,
  seasonRkey,
  episodeDid,
  episodeRkey,
  scheduleDid,
  scheduleRkey,
  reviewDid,
  reviewRkey,
  type CreateSeasonInput,
  type CreateSeasonOutput,
  type CreateEpisodeInput,
  type CreateEpisodeOutput,
  type ListEpisodesInput,
  type ListEpisodesOutput,
  type CreateScheduleInput,
  type CreateScheduleOutput,
  type ListSchedulesInput,
  type ListSchedulesOutput,
  type SubmitReviewInput,
  type SubmitReviewOutput,
  type SeasonRecord,
  type EpisodeRecord,
  type ScheduleRecord,
  type ReviewRecord,
} from "./types.js";

const SEASON_COLLECTION = "com.etzhayyim.anime.season";
const EPISODE_COLLECTION = "com.etzhayyim.anime.episode";
const SCHEDULE_COLLECTION = "com.etzhayyim.anime.schedule";
const REVIEW_COLLECTION = "com.etzhayyim.anime.review";

function isSeasonId(id: string): boolean {
  return /^[a-z0-9-]{1,32}$/i.test(id);
}

function isEpisodeId(id: string): boolean {
  return /^[a-z0-9-]{1,32}$/i.test(id);
}

function isScheduleId(id: string): boolean {
  return /^[a-z0-9-]{1,32}$/i.test(id);
}

function isReviewId(id: string): boolean {
  return /^[a-z0-9-]{1,32}$/i.test(id);
}

export async function createSeason(
  e: Etzhayyim,
  input: CreateSeasonInput
): Promise<CreateSeasonOutput> {
  if (!input.seasonId || !isSeasonId(input.seasonId)) {
    return { status: "rejected", error: "invalidSeasonId" };
  }
  if (!input.titleId) {
    return { status: "rejected", error: "missingTitleId" };
  }
  const rkey = seasonRkey(input.seasonId);
  const existing = await e
    .read<SeasonRecord>({ collection: SEASON_COLLECTION, rkey })
    .catch(() => ({ records: [] }));
  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      seasonUri: existing.records[0].uri,
      seasonId: input.seasonId,
    };
  }
  const did = seasonDid(input.seasonId);
  const now = new Date().toISOString();
  const record: SeasonRecord = {
    did,
    seasonId: input.seasonId,
    titleId: input.titleId,
    seasonNum: input.seasonNum,
    year: input.year,
    cour: input.cour,
    episodeCount: input.episodeCount,
    createdAt: now,
  };
  const receipt = await e.write({
    collection: SEASON_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });
  return {
    status: "registered",
    seasonUri: receipt.uri,
    seasonId: input.seasonId,
  };
}

export async function createEpisode(
  e: Etzhayyim,
  input: CreateEpisodeInput
): Promise<CreateEpisodeOutput> {
  if (!input.seasonId) {
    return { status: "rejected", error: "missingSeasonId" };
  }
  if (!input.episodeId || !isEpisodeId(input.episodeId)) {
    return { status: "rejected", error: "invalidEpisodeId" };
  }
  if (!input.title) {
    return { status: "rejected", error: "missingTitle" };
  }
  const rkey = episodeRkey(input.episodeId);
  const existing = await e
    .read<EpisodeRecord>({ collection: EPISODE_COLLECTION, rkey })
    .catch(() => ({ records: [] }));
  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      episodeUri: existing.records[0].uri,
      episodeId: input.episodeId,
    };
  }
  const did = episodeDid(input.episodeId);
  const now = new Date().toISOString();
  const record: EpisodeRecord = {
    did,
    episodeId: input.episodeId,
    seasonId: input.seasonId,
    episodeNum: input.episodeNum,
    title: input.title,
    airDate: input.airDate,
    durationSec: input.durationSec,
    createdAt: now,
  };
  const receipt = await e.write({
    collection: EPISODE_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });
  return {
    status: "registered",
    episodeUri: receipt.uri,
    episodeId: input.episodeId,
  };
}

export async function listEpisodes(
  e: Etzhayyim,
  input: ListEpisodesInput
): Promise<ListEpisodesOutput> {
  if (!input.seasonId) {
    return { episodes: [], offset: 0, limit: 0 };
  }
  const limit = Math.min(input.limit ?? 50, 100);
  const resp = await e.read<EpisodeRecord>({
    collection: EPISODE_COLLECTION,
    limit: 1000,
  });
  const episodes: EpisodeRecord[] = resp.records
    .filter((r) => r.value?.seasonId === input.seasonId)
    .map((r) => r.value)
    .slice(input.offset ?? 0, (input.offset ?? 0) + limit);
  return {
    episodes,
    offset: input.offset ?? 0,
    limit,
    total: resp.records.filter((r) => r.value?.seasonId === input.seasonId)
      .length,
  };
}

export async function createSchedule(
  e: Etzhayyim,
  input: CreateScheduleInput
): Promise<CreateScheduleOutput> {
  if (!input.scheduleId || !isScheduleId(input.scheduleId)) {
    return { status: "rejected", error: "invalidScheduleId" };
  }
  if (!input.titleId || !input.channel || !input.startDate) {
    return { status: "rejected", error: "missingRequiredFields" };
  }
  const rkey = scheduleRkey(input.scheduleId);
  const existing = await e
    .read<ScheduleRecord>({ collection: SCHEDULE_COLLECTION, rkey })
    .catch(() => ({ records: [] }));
  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      scheduleUri: existing.records[0].uri,
      scheduleId: input.scheduleId,
    };
  }
  const did = scheduleDid(input.scheduleId);
  const now = new Date().toISOString();
  const record: ScheduleRecord = {
    did,
    scheduleId: input.scheduleId,
    titleId: input.titleId,
    seasonId: input.seasonId,
    channel: input.channel,
    dayOfWeek: input.dayOfWeek,
    timeSlot: input.timeSlot,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now,
  };
  const receipt = await e.write({
    collection: SCHEDULE_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });
  return {
    status: "registered",
    scheduleUri: receipt.uri,
    scheduleId: input.scheduleId,
  };
}

export async function listSchedules(
  e: Etzhayyim,
  input: ListSchedulesInput = {}
): Promise<ListSchedulesOutput> {
  const limit = Math.min(input.limit ?? 50, 100);
  const resp = await e.read<ScheduleRecord>({
    collection: SCHEDULE_COLLECTION,
    limit: 1000,
  });
  const schedules: ScheduleRecord[] = resp.records
    .filter((r) => {
      const v = r.value;
      if (input.titleId && v?.titleId !== input.titleId) return false;
      if (input.dayOfWeek && v?.dayOfWeek !== input.dayOfWeek) return false;
      return true;
    })
    .map((r) => r.value)
    .slice(input.offset ?? 0, (input.offset ?? 0) + limit);
  return {
    schedules,
    offset: input.offset ?? 0,
    limit,
    total: resp.records.filter((r) => {
      const v = r.value;
      if (input.titleId && v?.titleId !== input.titleId) return false;
      if (input.dayOfWeek && v?.dayOfWeek !== input.dayOfWeek) return false;
      return true;
    }).length,
  };
}

export async function submitReview(
  e: Etzhayyim,
  input: SubmitReviewInput
): Promise<SubmitReviewOutput> {
  if (!input.reviewId || !isReviewId(input.reviewId)) {
    return { status: "rejected", error: "invalidReviewId" };
  }
  if (!input.titleId || !input.reviewerDid || !input.body) {
    return { status: "rejected", error: "missingRequiredFields" };
  }
  if (input.rating < 0 || input.rating > 1000) {
    return { status: "rejected", error: "invalidRating" };
  }
  const rkey = reviewRkey(input.reviewId);
  const existing = await e
    .read<ReviewRecord>({ collection: REVIEW_COLLECTION, rkey })
    .catch(() => ({ records: [] }));
  if (existing.records[0]?.value) {
    return {
      status: "alreadyExists",
      reviewUri: existing.records[0].uri,
      reviewId: input.reviewId,
    };
  }
  const did = reviewDid(input.reviewId);
  const now = new Date().toISOString();
  const record: ReviewRecord = {
    did,
    reviewId: input.reviewId,
    titleId: input.titleId,
    seq: input.seq,
    reviewerDid: input.reviewerDid,
    ratingPermille: input.rating,
    body: input.body,
    submittedAt: now,
    createdAt: now,
  };
  const receipt = await e.write({
    collection: REVIEW_COLLECTION,
    record: record as unknown as Record<string, unknown>,
    rkey,
  });
  return {
    status: "registered",
    reviewUri: receipt.uri,
    reviewId: input.reviewId,
  };
}
