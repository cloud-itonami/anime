/**
 * anime kotoba — record types.
 *
 * Per ADR-2605203000 Option B (PDS XRPC). anime = anime title + season + episode + schedule + review registry.
 *
 * Identity hierarchy (per anime design):
 *   did:web:anime.etzhayyim.com                       — controller
 *   did:web:anime.etzhayyim.com:title:{titleId-slug}  — Title
 *   did:web:anime.etzhayyim.com:season:{seasonId}     — Season
 *   did:web:anime.etzhayyim.com:episode:{episodeId}   — Episode
 *   did:web:anime.etzhayyim.com:schedule:{scheduleId} — Schedule
 *   did:web:anime.etzhayyim.com:review:{titleId}-{seq} — Review
 */

export const ANIME_DID_PREFIX = "did:web:anime.etzhayyim.com:" as const;

export type TitleStatus = "planning" | "airing" | "finished" | "cancelled";
export type SourceType = "original" | "manga" | "light_novel" | "visual_novel" | "game";

// ─── Title tier ─────────────────────────────────────────────────────

export interface TitleRecord {
  did: string;
  titleId: string;
  title: string;
  titleJa?: string;
  genre?: string;
  tags?: string[];
  synopsis?: string;
  studio?: string;
  sourceType?: SourceType;
  status: TitleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TitleView extends TitleRecord {
  titleUri: string;
}

export interface CreateTitleInput {
  titleId: string;
  title: string;
  titleJa?: string;
  genre?: string;
  tags?: string[];
  synopsis?: string;
  studio?: string;
  sourceType?: SourceType;
}

export interface CreateTitleOutput {
  status: "registered" | "alreadyExists" | "rejected";
  titleUri?: string;
  did?: string;
  titleId?: string;
  error?: string;
}

export interface GetTitleInput {
  titleId?: string;
}

export interface GetTitleOutput {
  title?: TitleView;
  seasons?: SeasonRecord[];
  error?: string;
}

export interface ListTitlesInput {
  genre?: string;
  status?: TitleStatus;
  limit?: number;
  offset?: number;
}

export interface ListTitlesOutput {
  titles: TitleView[];
  offset: number;
  limit: number;
  total?: number;
}

export interface SearchTitlesInput {
  q: string;
  genre?: string;
  limit?: number;
  offset?: number;
}

export interface SearchTitlesOutput {
  titles: TitleView[];
  total: number;
  offset: number;
  limit: number;
}

function titleSlug(titleId: string): string {
  return titleId.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function titleDid(titleId: string): string {
  return `${ANIME_DID_PREFIX}title:${titleSlug(titleId)}`;
}

export function titleRkey(titleId: string): string {
  return `title-${titleSlug(titleId)}`;
}

// ─── Season tier ────────────────────────────────────────────────────

export interface SeasonRecord {
  did: string;
  seasonId: string;
  titleId: string;
  seasonNum: number;
  year: number;
  cour?: string;
  episodeCount: number;
  createdAt: string;
}

export interface CreateSeasonInput {
  seasonId: string;
  titleId: string;
  seasonNum: number;
  year: number;
  cour?: string;
  episodeCount: number;
}

export interface CreateSeasonOutput {
  status: "registered" | "alreadyExists" | "rejected";
  seasonUri?: string;
  seasonId?: string;
  error?: string;
}

function seasonSlug(seasonId: string): string {
  return seasonId.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function seasonDid(seasonId: string): string {
  return `${ANIME_DID_PREFIX}season:${seasonSlug(seasonId)}`;
}

export function seasonRkey(seasonId: string): string {
  return `season-${seasonSlug(seasonId)}`;
}

// ─── Episode tier ───────────────────────────────────────────────────

export interface EpisodeRecord {
  did: string;
  episodeId: string;
  seasonId: string;
  episodeNum: number;
  title: string;
  airDate?: string;
  durationSec: number;
  createdAt: string;
}

export interface CreateEpisodeInput {
  episodeId: string;
  seasonId: string;
  episodeNum: number;
  title: string;
  airDate?: string;
  durationSec: number;
}

export interface CreateEpisodeOutput {
  status: "registered" | "alreadyExists" | "rejected";
  episodeUri?: string;
  episodeId?: string;
  error?: string;
}

export interface ListEpisodesInput {
  seasonId: string;
  limit?: number;
  offset?: number;
}

export interface ListEpisodesOutput {
  episodes: EpisodeRecord[];
  offset: number;
  limit: number;
  total?: number;
}

function episodeSlug(episodeId: string): string {
  return episodeId.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function episodeDid(episodeId: string): string {
  return `${ANIME_DID_PREFIX}episode:${episodeSlug(episodeId)}`;
}

export function episodeRkey(episodeId: string): string {
  return `episode-${episodeSlug(episodeId)}`;
}

// ─── Schedule tier ──────────────────────────────────────────────────

export interface ScheduleRecord {
  did: string;
  scheduleId: string;
  titleId: string;
  seasonId?: string;
  channel: string;
  dayOfWeek?: string;
  timeSlot?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface CreateScheduleInput {
  scheduleId: string;
  titleId: string;
  seasonId?: string;
  channel: string;
  dayOfWeek?: string;
  timeSlot?: string;
  startDate: string;
  endDate?: string;
}

export interface CreateScheduleOutput {
  status: "registered" | "alreadyExists" | "rejected";
  scheduleUri?: string;
  scheduleId?: string;
  error?: string;
}

export interface ListSchedulesInput {
  titleId?: string;
  dayOfWeek?: string;
  limit?: number;
  offset?: number;
}

export interface ListSchedulesOutput {
  schedules: ScheduleRecord[];
  offset: number;
  limit: number;
  total?: number;
}

function scheduleSlug(scheduleId: string): string {
  return scheduleId.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function scheduleDid(scheduleId: string): string {
  return `${ANIME_DID_PREFIX}schedule:${scheduleSlug(scheduleId)}`;
}

export function scheduleRkey(scheduleId: string): string {
  return `schedule-${scheduleSlug(scheduleId)}`;
}

// ─── Review tier ────────────────────────────────────────────────────

export interface ReviewRecord {
  did: string;
  reviewId: string;
  titleId: string;
  seq: number;
  reviewerDid: string;
  ratingPermille: number;
  body: string;
  submittedAt: string;
  createdAt: string;
}

export interface SubmitReviewInput {
  reviewId: string;
  titleId: string;
  seq: number;
  reviewerDid: string;
  rating: number;
  body: string;
}

export interface SubmitReviewOutput {
  status: "registered" | "alreadyExists" | "rejected";
  reviewUri?: string;
  reviewId?: string;
  error?: string;
}

function reviewSlug(reviewId: string): string {
  return reviewId.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function reviewDid(reviewId: string): string {
  return `${ANIME_DID_PREFIX}review:${reviewSlug(reviewId)}`;
}

export function reviewRkey(reviewId: string): string {
  return `review-${reviewSlug(reviewId)}`;
}
