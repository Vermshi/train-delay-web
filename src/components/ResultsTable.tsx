"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DelayRow {
    tog: string;
    retning: string;
    origin: string;
    destination: string;
    planned_dep_origin: string;
    actual_dep_origin: string;
    planned_arr_destination: string;
    actual_arr_destination: string;
    forsinkelse_minutter: number;
    datedServiceJourneyId: string;
}

interface ResultsTableProps {
    results: DelayRow[];
    isLoading: boolean;
    hasSearched: boolean;
    error: string | null;
}

// "VYG:Line:R13" → "R13"
function parseLine(tog: string): string {
    const parts = tog.split(":");
    return parts[parts.length - 1] || tog;
}

// "2026-01-20 06:58:00" → "2026-01-20"
function parseDate(dt: string): string {
    return dt.slice(0, 10);
}

// "2026-01-20 06:58:00" → "06:58"
function parseTime(dt: string): string {
    return dt?.slice(11, 16);
}

// "2026-01-20" → "20. januar 2026"
function formatDateHeading(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("nb-NO", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function TrainLoader() {
    // Smoke rises from locomotive chimney (left/front) and drifts right (backward)
    const smokeConfig = [
        { cx: 55, cy: 12, r: 5, delay: "0s" },
        { cx: 54, cy: 12, r: 7, delay: "0.2s" },
        { cx: 56, cy: 12, r: 6, delay: "0.4s" },
        { cx: 53, cy: 12, r: 9, delay: "0.6s" },
        { cx: 57, cy: 12, r: 8, delay: "0.8s" },
    ];

    // Speed lines trail to the RIGHT — train moves left
    const speedLines = [
        { x: 270, y: 55, w: 44, h: 2, delay: "0s" },
        { x: 272, y: 65, w: 38, h: 1.5, delay: "0.16s" },
        { x: 268, y: 75, w: 42, h: 1.5, delay: "0.08s" },
        { x: 275, y: 84, w: 30, h: 1, delay: "0.24s" },
    ];

    const steamJets = [
        { cx: 50, delay: "0s" },
        { cx: 90, delay: "0.22s" },
        { cx: 155, delay: "0.11s" },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-16 gap-5">
            <svg
                viewBox="0 0 320 120"
                width={320}
                height={120}
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ overflow: "visible", transform: "scaleX(-1)" }}
            >
                {/* Scrolling track sleepers */}
                <g style={{ animation: "track-scroll 0.45s linear infinite" }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <rect
                            key={i}
                            x={i * 40 - 20}
                            y={103}
                            width={16}
                            height={6}
                            rx={1}
                            fill="#94a3b8"
                        />
                    ))}
                </g>

                {/* Rails */}
                <rect x={0} y={100} width={320} height={3} rx={1} fill="#64748b" />
                <rect x={0} y={107} width={320} height={3} rx={1} fill="#64748b" />

                {/* Speed lines — outside bob group so they stay level */}
                {speedLines.map(({ x, y, w, h, delay }, i) => (
                    <rect
                        key={`sl-${i}`}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={h / 2}
                        fill="#a5b4fc"
                        style={{
                            animation: `speed-line-flash 0.5s ease-in-out ${delay} infinite`,
                        }}
                    />
                ))}

                {/* Train — bobs vertically */}
                <g style={{ animation: "train-bob 0.5s ease-in-out infinite" }}>
                    {/* Smoke puffs from chimney */}
                    {smokeConfig.map(({ cx, cy, r, delay }, i) => (
                        <circle
                            key={`sm-${i}`}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="#94a3b8"
                            style={{
                                opacity: 0,
                                animation: `smoke-float 1s ease-out ${delay} infinite`,
                            }}
                        />
                    ))}

                    {/* Undercarriage — spans full train length */}
                    <rect x={24} y={83} width={238} height={8} rx={3} fill="#3730a3" />

                    {/* ── LOCOMOTIVE (left / front) ── */}

                    {/* Boiler body — taller than passenger car */}
                    <rect x={30} y={38} width={95} height={47} rx={5} fill="#4338ca" />
                    {/* Boiler accent stripe */}
                    <rect x={30} y={79} width={95} height={4} fill="#3730a3" />

                    {/* Steam dome on boiler */}
                    <ellipse cx={80} cy={38} rx={14} ry={7} fill="#3730a3" />

                    {/* Chimney pipe — front portion of boiler */}
                    <rect x={50} y={18} width={10} height={22} rx={2} fill="#1e1b4b" />
                    {/* Chimney flared top */}
                    <rect x={47} y={14} width={16} height={6} rx={2} fill="#1e1b4b" />

                    {/* Cab — rear of locomotive */}
                    <rect x={105} y={42} width={28} height={43} rx={3} fill="#4f46e5" />
                    {/* Cab accent stripe */}
                    <rect x={105} y={79} width={28} height={4} fill="#3730a3" />
                    {/* Cab windows */}
                    <rect
                        x={108}
                        y={50}
                        width={11}
                        height={11}
                        rx={2}
                        fill="white"
                        opacity={0.92}
                    />
                    <rect
                        x={122}
                        y={50}
                        width={11}
                        height={11}
                        rx={2}
                        fill="white"
                        opacity={0.92}
                    />
                    {/* Window reflections */}
                    <rect x={108} y={50} width={4} height={3} rx={1} fill="white" opacity={0.5} />
                    <rect x={122} y={50} width={4} height={3} rx={1} fill="white" opacity={0.5} />

                    {/* Nose plate — left edge */}
                    <rect x={24} y={40} width={9} height={45} rx={3} fill="#3730a3" />

                    {/* Headlight glow */}
                    <circle
                        cx={28}
                        cy={63}
                        r={11}
                        fill="#fef3c7"
                        opacity={0.18}
                        style={{ animation: "headlight-flicker 2.5s ease-in-out infinite" }}
                    />
                    {/* Headlight */}
                    <circle
                        cx={28}
                        cy={63}
                        r={5}
                        fill="#fef3c7"
                        opacity={0.95}
                        style={{ animation: "headlight-flicker 2.5s ease-in-out infinite" }}
                    />

                    {/* Front coupler */}
                    <rect x={12} y={76} width={13} height={6} rx={2} fill="#6366f1" />

                    {/* ── PASSENGER CAR (right / rear) ── */}

                    <rect x={140} y={50} width={118} height={35} rx={5} fill="#4f46e5" />
                    {/* Passenger car accent stripe */}
                    <rect x={140} y={79} width={118} height={4} fill="#4338ca" />
                    {/* Passenger windows */}
                    {[150, 172, 194, 216].map((x) => (
                        <g key={x}>
                            <rect
                                x={x}
                                y={58}
                                width={15}
                                height={11}
                                rx={2}
                                fill="white"
                                opacity={0.75}
                            />
                            <rect
                                x={x}
                                y={58}
                                width={5}
                                height={3}
                                rx={1}
                                fill="white"
                                opacity={0.4}
                            />
                        </g>
                    ))}
                    {/* Rear coupler */}
                    <rect x={257} y={76} width={13} height={6} rx={2} fill="#6366f1" />

                    {/* ── WHEELS ── */}
                    {[50, 90, 155, 200, 240].map((cx) => (
                        <g
                            key={cx}
                            style={{
                                transformBox: "fill-box",
                                transformOrigin: "center",
                                animation: "wheel-spin 0.6s linear infinite",
                            }}
                        >
                            <circle cx={cx} cy={97} r={10} fill="#1e293b" />
                            <circle cx={cx} cy={97} r={6.5} fill="#334155" />
                            <line
                                x1={cx - 6}
                                y1={97}
                                x2={cx + 6}
                                y2={97}
                                stroke="#818cf8"
                                strokeWidth={1.5}
                            />
                            <line
                                x1={cx}
                                y1={91}
                                x2={cx}
                                y2={103}
                                stroke="#818cf8"
                                strokeWidth={1.5}
                            />
                            <line
                                x1={cx - 4}
                                y1={93}
                                x2={cx + 4}
                                y2={101}
                                stroke="#818cf8"
                                strokeWidth={1}
                            />
                            <line
                                x1={cx + 4}
                                y1={93}
                                x2={cx - 4}
                                y2={101}
                                stroke="#818cf8"
                                strokeWidth={1}
                            />
                            <circle cx={cx} cy={97} r={2.5} fill="#c7d2fe" />
                        </g>
                    ))}

                    {/* Steam jets from undercarriage */}
                    {steamJets.map(({ cx, delay }, i) => (
                        <ellipse
                            key={`stm-${i}`}
                            cx={cx}
                            cy={93}
                            rx={5}
                            ry={3}
                            fill="#e2e8f0"
                            style={{
                                opacity: 0,
                                animation: `steam-jet 0.7s ease-out ${delay} infinite`,
                            }}
                        />
                    ))}
                </g>
            </svg>

            <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Spør BigQuery...
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Dette kan ta opptil 30 sekunder
                </p>
            </div>
        </div>
    );
}

function LineBadge({ tog }: { tog: string }) {
    const line = parseLine(tog);
    return (
        <span className="inline-flex items-center rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold font-mono text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300">
            {line}
        </span>
    );
}

function DelayBadge({ minutes }: { minutes: number }) {
    const cls =
        minutes >= 60
            ? "bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
            : minutes >= 30
              ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
              : "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
            style={{
                animation: "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
        >
            +{minutes} min
        </span>
    );
}

// Shows "06:58 → 07:14" — planned muted, actual bold
function TimeCell({ planned, actual }: { planned: string; actual: string }) {
    const pt = parseTime(planned);
    const at = parseTime(actual);
    return (
        <span className="inline-flex items-center gap-1 font-mono text-xs">
            <span className="text-slate-400 dark:text-slate-500">{pt}</span>
            <span className="text-slate-400 dark:text-slate-500">→</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{at}</span>
        </span>
    );
}

// "2026-01-20 06:58:00" → 6
function parseHour(dt: string): number {
    return parseInt(dt.slice(11, 13), 10);
}

function buildPerDayData(results: DelayRow[]) {
    const counts: Record<string, number> = {};
    for (const row of results) {
        const date = parseDate(row.planned_dep_origin);
        counts[date] = (counts[date] ?? 0) + 1;
    }
    return Object.keys(counts)
        .sort()
        .map((date) => ({ label: date.slice(5), count: counts[date] })); // "MM-DD"
}

function buildPerHourData(results: DelayRow[]) {
    const counts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) counts[h] = 0;
    for (const row of results) counts[parseHour(row.planned_dep_origin)]++;
    return Array.from({ length: 24 }, (_, h) => ({
        label: `${h}`,
        count: counts[h],
    }));
}

function ChartIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="1" y="7" width="2.5" height="5" rx="0.5" fill="currentColor" />
            <rect x="5" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" />
            <rect x="9" y="1" width="2.5" height="11" rx="0.5" fill="currentColor" />
        </svg>
    );
}

function ChartDialog({
    title,
    data,
    xLabel,
    onClose,
}: {
    title: string;
    data: { label: string; count: number }[];
    xLabel: string;
    onClose: () => void;
}) {
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                style={{ animation: "section-enter 0.2s ease-out both" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            className="dark:[&>line]:stroke-slate-700"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                                value: xLabel,
                                position: "insideBottom",
                                offset: -2,
                                fontSize: 11,
                                fill: "#94a3b8",
                            }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "var(--tooltip-bg, #1e293b)",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 12,
                                color: "#f1f5f9",
                            }}
                            cursor={{ fill: "rgba(99,102,241,0.08)" }}
                            formatter={(v: number | undefined) => [v ?? 0, "Forsinkelser"]}
                            labelFormatter={(l) => `${xLabel === "Time" ? `Kl. ${l}` : l}`}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>,
        document.body
    );
}

export default function ResultsTable({
    results,
    isLoading,
    hasSearched,
    error,
}: ResultsTableProps) {
    const [dialog, setDialog] = useState<"day" | "hour" | null>(null);

    if (isLoading) {
        return <TrainLoader />;
    }

    if (error) {
        return (
            <div
                className="rounded-md bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-700"
                style={{
                    animation: "shake 0.35s ease-in-out, section-enter 0.3s ease-out both",
                }}
            >
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Feil</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!hasSearched) {
        return (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Velg stasjoner og trykk Søk for å se resultater.
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div
                className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                style={{ animation: "section-enter 0.4s ease-out both" }}
            >
                Ingen forsinkede tog funnet for det valgte søket.
            </div>
        );
    }

    // Group by the date of planned departure
    const grouped = results.reduce<Record<string, DelayRow[]>>((acc, row) => {
        const date = parseDate(row.planned_dep_origin);
        (acc[date] ??= []).push(row);
        return acc;
    }, {});
    const dates = Object.keys(grouped).sort();

    // Pre-compute animation indices before render to avoid side-effectful mutation
    // during the render pass (which breaks in React StrictMode).
    const rowAnimationIndex = new Map(
        dates.flatMap((date) => grouped[date]).map((row, i) => [row.datedServiceJourneyId, i])
    );

    return (
        <div className="space-y-3" style={{ animation: "section-enter 0.4s ease-out both" }}>
            <div className="flex items-center justify-between">
                <p
                    className="text-sm text-slate-600 dark:text-slate-300"
                    style={{
                        animation: "pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                    }}
                >
                    Viser <span className="font-semibold">{results.length}</span> forsinkede tog
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDialog("day")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all"
                        style={{
                            animation: "pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both",
                        }}
                    >
                        <ChartIcon />
                        Graf per dag
                    </button>
                    <button
                        onClick={() => setDialog("hour")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all"
                        style={{
                            animation: "pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
                        }}
                    >
                        <ChartIcon />
                        Graf per time
                    </button>
                </div>
                {results.length >= 1500 && (
                    <span
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                        style={{
                            animation: "pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
                        }}
                    >
                        Maks 1500 resultater — prøv kortere periode
                    </span>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            {["Linje", "Retning", "Avgang", "Ankomst", "Forsinkelse"].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {dates.map((date) => (
                            <React.Fragment key={date}>
                                {/* Date group header */}
                                <tr className="bg-slate-100 dark:bg-slate-700/60">
                                    <td
                                        colSpan={5}
                                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                                    >
                                        {formatDateHeading(date)}
                                    </td>
                                </tr>

                                {/* Rows for this date */}
                                {grouped[date].map((row) => (
                                    <tr
                                        key={row.datedServiceJourneyId}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        style={{
                                            animation: "row-slide-in 0.3s ease-out both",
                                            animationDelay: `${Math.min((rowAnimationIndex.get(row.datedServiceJourneyId) ?? 0) * 0.03, 0.5)}s`,
                                        }}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <LineBadge tog={row.tog} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                            {row.retning}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <TimeCell
                                                planned={row.planned_dep_origin}
                                                actual={row.actual_dep_origin}
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <TimeCell
                                                planned={row.planned_arr_destination}
                                                actual={row.actual_arr_destination}
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <DelayBadge minutes={row.forsinkelse_minutter} />
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {dialog === "day" && (
                <ChartDialog
                    title="Forsinkelser per dag"
                    data={buildPerDayData(results)}
                    xLabel="Dato"
                    onClose={() => setDialog(null)}
                />
            )}
            {dialog === "hour" && (
                <ChartDialog
                    title="Forsinkelser per time på døgnet"
                    data={buildPerHourData(results)}
                    xLabel="Time"
                    onClose={() => setDialog(null)}
                />
            )}
        </div>
    );
}
