/**
 * anime XRPC adapter — CF Worker (generated).
 * Per ADR-2605210000 first execution-layer demonstration.
 */

import type { Etzhayyim } from "@etzhayyim/sdk";
import { createAuthedEtzhayyim, extractBearerToken } from "@etzhayyim/sdk-auth";
import * as animeRwFree from "@etzhayyim/anime-kotoba";

interface Env {
  ACTOR_DID: string;
  PDS_URL: string;
  L2_RPC_URL: string;
  PDS_ACCESS_JWT?: string;
  PDS_REFRESH_JWT?: string;
}

type Handler = (e: Etzhayyim, input: unknown) => Promise<unknown>;

const NSID_BASE = "com.etzhayyim.anime";

interface RouteConfig {
  method: "POST" | "GET";
  handler: Handler;
}

const routes: Record<string, RouteConfig> = {
  [`${NSID_BASE}.createTitle`]: { method: "POST", handler: (e, input) => animeRwFree.createTitle(e, input as any) },
  [`${NSID_BASE}.createSeason`]: { method: "POST", handler: (e, input) => animeRwFree.createSeason(e, input as any) },
  [`${NSID_BASE}.createEpisode`]: { method: "POST", handler: (e, input) => animeRwFree.createEpisode(e, input as any) },
  [`${NSID_BASE}.createSchedule`]: { method: "POST", handler: (e, input) => animeRwFree.createSchedule(e, input as any) },
  [`${NSID_BASE}.submitReview`]: { method: "POST", handler: (e, input) => animeRwFree.submitReview(e, input as any) },
  [`${NSID_BASE}.getTitle`]: { method: "GET", handler: (e, input) => animeRwFree.getTitle(e, input as any) },
  [`${NSID_BASE}.listTitles`]: { method: "GET", handler: (e, input) => animeRwFree.listTitles(e, input as any) },
  [`${NSID_BASE}.searchTitles`]: { method: "GET", handler: (e, input) => animeRwFree.searchTitles(e, input as any) },
  [`${NSID_BASE}.listEpisodes`]: { method: "GET", handler: (e, input) => animeRwFree.listEpisodes(e, input as any) },
  [`${NSID_BASE}.listSchedules`]: { method: "GET", handler: (e, input) => animeRwFree.listSchedules(e, input as any) },
};

function mapStatus(status?: string): number {
  if (status === "rejected" || status === "invalidInput") return 400;
  if (status === "notFound") return 404;
  if (status === "alreadyExists" || status === "alreadyProcessed") return 200;
  return 200;
}

function jsonResponse(body: unknown, status: number = 200, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/xrpc/")) return jsonResponse({ error: "NotFound" }, 404);

    const nsid = url.pathname.slice("/xrpc/".length);
    const route = routes[nsid];
    if (!route) return jsonResponse({ error: "MethodNotFound", nsid }, 404);
    if (req.method !== route.method) return jsonResponse({ error: "MethodNotAllowed" }, 405);

    const bearerToken = extractBearerToken(req);
    const e = createAuthedEtzhayyim({ env, bearerToken });

    let input: unknown;
    try {
      input = route.method === "POST" ? await req.json().catch(() => ({})) : Object.fromEntries(url.searchParams.entries());
      const typed = input as Record<string, unknown>;
      ["limit", "offset", "seasonNumber", "episodeNumber", "durationMinutes", "ratingPermille"].forEach(k => {
        if (typed[k]) typed[k] = Number(typed[k]);
      });
    } catch (err) {
      return jsonResponse({ error: "InvalidInput", message: `Failed to parse ${route.method === "POST" ? "JSON" : "query params"}` }, 400);
    }

    try {
      const result = await route.handler(e, input);
      return jsonResponse(result, mapStatus((result as any)?.status));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse({ error: "InternalError", message, nsid }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
