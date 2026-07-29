import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { getCache } from "@vercel/functions";
import { readFileSync } from "fs";

export const runtime = "nodejs";
export const maxDuration = 10;

function getBigQueryClient(customCredentials?: Record<string, unknown>): BigQuery {
    if (customCredentials) {
        const projectId = customCredentials.project_id as string;
        if (!projectId) {
            throw new Error("project_id not found in custom credentials");
        }
        return new BigQuery({ projectId, credentials: customCredentials, location: "EU" });
    }

    const value = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!value) {
        throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env var");
    }

    // Accept either an inline JSON string or a path to a JSON file
    const raw = value.trimStart().startsWith("{") ? value : readFileSync(value.trim(), "utf-8");

    const credentials = JSON.parse(raw);

    const projectId = credentials.project_id as string;
    if (!projectId) {
        throw new Error("project_id not found in service account credentials");
    }

    return new BigQuery({
        projectId,
        credentials,
        location: "EU",
    });
}

const QUERY = `
WITH base AS (
  SELECT
    datedServiceJourneyId,
    lineRef,
    stopPointName,
    sequenceNr,
    aimedDepartureTime,
    departureTime,
    aimedArrivalTime,
    arrivalTime
  FROM \`ent-data-sharing-ext-prd.realtime_siri_et.realtime_siri_et_last_recorded\`
  WHERE recordedAtTime >= TIMESTAMP(@start_date)
    AND recordedAtTime < TIMESTAMP_ADD(TIMESTAMP(@end_date), INTERVAL 1 DAY)
    AND stopPointName IN (@station_a, @station_b)
    AND LOWER(vehicleMode) IN ("rail", "train")
    AND IFNULL(journeyCancellation, FALSE) = FALSE
    AND IFNULL(stopCancellation, FALSE) = FALSE
    AND IFNULL(extraCall, FALSE) = FALSE
    AND IFNULL(extraJourney, FALSE) = FALSE
),

paired AS (
  SELECT
    datedServiceJourneyId,
    ANY_VALUE(lineRef) AS tog,

    MAX(IF(stopPointName = @station_a, sequenceNr, NULL)) AS seq_a,
    MAX(IF(stopPointName = @station_b, sequenceNr, NULL)) AS seq_b,

    -- Station A times
    MAX(IF(stopPointName = @station_a,
           COALESCE(aimedDepartureTime, aimedArrivalTime),
           NULL)) AS planned_a,
    MAX(IF(stopPointName = @station_a,
           COALESCE(departureTime, arrivalTime),
           NULL)) AS actual_a,

    -- Station B times
    MAX(IF(stopPointName = @station_b,
           COALESCE(aimedArrivalTime, aimedDepartureTime),
           NULL)) AS planned_b,
    MAX(IF(stopPointName = @station_b,
           COALESCE(arrivalTime, departureTime),
           NULL)) AS actual_b
  FROM base
  GROUP BY datedServiceJourneyId
)

SELECT
  tog,

  CASE
    WHEN seq_a < seq_b THEN CONCAT(@station_a, " → ", @station_b)
    WHEN seq_a > seq_b THEN CONCAT(@station_b, " → ", @station_a)
    ELSE "Ukjent"
  END AS retning,

  CASE WHEN seq_a < seq_b THEN @station_a ELSE @station_b END AS origin,
  CASE WHEN seq_a < seq_b THEN @station_b ELSE @station_a END AS destination,

  FORMAT_TIMESTAMP(
    '%Y-%m-%d %H:%M:%S',
    CASE WHEN seq_a < seq_b THEN planned_a ELSE planned_b END,
    'Europe/Oslo'
  ) AS planned_dep_origin,

  FORMAT_TIMESTAMP(
    '%Y-%m-%d %H:%M:%S',
    CASE WHEN seq_a < seq_b THEN actual_a ELSE actual_b END,
    'Europe/Oslo'
  ) AS actual_dep_origin,

  FORMAT_TIMESTAMP(
    '%Y-%m-%d %H:%M:%S',
    CASE WHEN seq_a < seq_b THEN planned_b ELSE planned_a END,
    'Europe/Oslo'
  ) AS planned_arr_destination,

  FORMAT_TIMESTAMP(
    '%Y-%m-%d %H:%M:%S',
    CASE WHEN seq_a < seq_b THEN actual_b ELSE actual_a END,
    'Europe/Oslo'
  ) AS actual_arr_destination,

  TIMESTAMP_DIFF(
    CASE WHEN seq_a < seq_b THEN actual_b ELSE actual_a END,
    CASE WHEN seq_a < seq_b THEN planned_b ELSE planned_a END,
    MINUTE
  ) AS forsinkelse_minutter,

  datedServiceJourneyId

FROM paired
WHERE seq_a IS NOT NULL
  AND seq_b IS NOT NULL
  AND TIMESTAMP_DIFF(
        CASE WHEN seq_a < seq_b THEN actual_b ELSE actual_a END,
        CASE WHEN seq_a < seq_b THEN planned_b ELSE planned_a END,
        MINUTE
      ) >= @min_delay

ORDER BY
  CASE WHEN seq_a < seq_b THEN actual_b ELSE actual_a END ASC
LIMIT 1500
`;

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory store: resets on cold starts, which is fine for a low-traffic app.
// Limits each IP to 5 BigQuery queries per hour.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): {
    allowed: boolean;
    retryAfterSecs: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return { allowed: true, retryAfterSecs: 0 };
    }

    if (entry.count >= RATE_LIMIT) {
        return {
            allowed: false,
            retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    entry.count++;
    return { allowed: true, retryAfterSecs: 0 };
}

// ── Query result cache ────────────────────────────────────────────────────────
// Uses the Vercel Runtime Cache (per-region, survives cold starts, free on all
// plans). All cache operations are best-effort: a cache failure must never fail
// the request — we fall back to the in-memory Map, or just hit BigQuery again.

// In-memory fallback — survives HMR reloads via globalThis
const _g = globalThis as typeof globalThis & { queryCache?: Map<string, unknown[]> };
if (!_g.queryCache) _g.queryCache = new Map();
const memCache = _g.queryCache;
const MEM_CACHE_MAX = 200;

// TTL: 24 h for recent ranges (data may still arrive), 7 days for older data
const RECENT_DAYS = 7;
const TTL_RECENT = 60 * 60 * 24; // 1 day in seconds
const TTL_OLD = 60 * 60 * 24 * 7; // 7 days in seconds

function getCacheKey(
    stationA: string,
    stationB: string,
    startDate: string,
    endDate: string,
    minDelay: number
): string {
    // Normalise station order so A↔B and B↔A share the same cache entry
    const [s1, s2] = [stationA, stationB].sort();
    return `tdc:${s1}|${s2}|${startDate}|${endDate}|${minDelay}`;
}

function getTtl(endDate: string): number {
    const daysSinceEnd = (Date.now() - new Date(endDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceEnd < RECENT_DAYS ? TTL_RECENT : TTL_OLD;
}

async function cacheGet(key: string): Promise<unknown[] | null> {
    try {
        const val = (await getCache().get(key)) as unknown[] | undefined;
        if (val) return val;
    } catch {
        // Runtime cache unavailable (e.g. local dev) — fall through to memory
    }
    return memCache.get(key) ?? null;
}

async function cacheSet(key: string, rows: unknown[], ttlSecs: number): Promise<void> {
    try {
        await getCache().set(key, rows, { ttl: ttlSecs, name: "train-delay-search" });
    } catch {
        // Best-effort only — never fail the request over a cache write
    }
    if (memCache.size >= MEM_CACHE_MAX) {
        memCache.delete(memCache.keys().next().value!);
    }
    memCache.set(key, rows);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";

    const { allowed, retryAfterSecs } =
        process.env.NODE_ENV === "development"
            ? { allowed: true, retryAfterSecs: 0 }
            : checkRateLimit(ip);
    if (!allowed) {
        return NextResponse.json(
            {
                error: `For mange forespørsler. Prøv igjen om ${Math.ceil(retryAfterSecs / 60)} minutt(er).`,
            },
            { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Runtime type guards — never trust `as` casts for external input
    const raw = body as Record<string, unknown>;
    const stationA = typeof raw.stationA === "string" ? raw.stationA : undefined;
    const stationB = typeof raw.stationB === "string" ? raw.stationB : undefined;
    const startDate = typeof raw.startDate === "string" ? raw.startDate : undefined;
    const endDate = typeof raw.endDate === "string" ? raw.endDate : undefined;
    const minDelay = typeof raw.minDelay === "number" ? raw.minDelay : undefined;
    const customCredentials =
        raw.customCredentials !== null &&
        typeof raw.customCredentials === "object" &&
        !Array.isArray(raw.customCredentials)
            ? (raw.customCredentials as Record<string, unknown>)
            : undefined;

    // Validation
    if (!stationA || !stationB) {
        return NextResponse.json({ error: "Both stations are required" }, { status: 400 });
    }
    if (stationA.length > 200 || stationB.length > 200) {
        return NextResponse.json({ error: "Station name too long" }, { status: 400 });
    }
    if (stationA === stationB) {
        return NextResponse.json({ error: "Stations must be different" }, { status: 400 });
    }
    if (!startDate || !endDate) {
        return NextResponse.json({ error: "Date range is required" }, { status: 400 });
    }
    if (!ISO_DATE_RE.test(startDate) || !ISO_DATE_RE.test(endDate)) {
        return NextResponse.json(
            { error: "Invalid date format — expected YYYY-MM-DD" },
            { status: 400 }
        );
    }
    if (new Date(startDate) > new Date(endDate)) {
        return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }
    const delay = typeof minDelay === "number" ? minDelay : 30;
    if (delay < 1 || delay > 300) {
        return NextResponse.json({ error: "minDelay must be between 1 and 300" }, { status: 400 });
    }

    const cacheKey = getCacheKey(stationA, stationB, startDate, endDate, delay);
    const cached = await cacheGet(cacheKey);
    if (cached) {
        return NextResponse.json({ results: cached, count: cached.length, cached: true });
    }

    try {
        const bq = getBigQueryClient(customCredentials);

        const [rows] = await bq.query({
            query: QUERY,
            params: {
                station_a: stationA,
                station_b: stationB,
                start_date: startDate,
                end_date: endDate,
                min_delay: delay,
            },
            location: "EU",
        });

        await cacheSet(cacheKey, rows, getTtl(endDate));

        return NextResponse.json({ results: rows, count: rows.length });
    } catch (err) {
        console.error("BigQuery error:", err);
        return NextResponse.json(
            { error: "Det oppstod en feil ved kjøring av spørringen. Prøv igjen." },
            { status: 500 }
        );
    }
}
