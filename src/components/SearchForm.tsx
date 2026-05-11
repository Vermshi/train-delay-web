"use client";

import { useState, useRef, useEffect, useId } from "react";

interface Station {
    id: string;
    name: string;
}

interface SearchParams {
    stationA: string;
    stationB: string;
    startDate: string;
    endDate: string;
    minDelay: number;
}

interface SearchFormProps {
    stations: Station[];
    onSearch: (params: SearchParams) => void;
    isLoading: boolean;
}

type DatePreset = "30" | "90" | "180" | "custom";

const MAX_DAYS = 365;
const MAX_RESULTS = 50;

function fmt(d: Date) {
    return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return fmt(d);
}

function getDateRange(preset: DatePreset): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    const days = preset === "30" ? 30 : preset === "90" ? 90 : 180;
    start.setDate(end.getDate() - days);
    return { start: fmt(start), end: fmt(end) };
}

const inputCls =
    "w-full rounded-md border border-havvind-300 bg-havvind-25 px-3 py-2.5 text-sm text-havvind-950 shadow-sm placeholder-havvind-500 focus:border-havvind-600 focus:outline-none focus:ring-1 focus:ring-havvind-600 dark:border-havvind-600 dark:bg-havvind-800 dark:text-havvind-100 dark:placeholder-havvind-300 dark:focus:border-havvind-400 dark:focus:ring-havvind-400 transition-all";

// ── Combobox ──────────────────────────────────────────────────────────────────

interface ComboboxProps {
    stations: Station[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    isLoading?: boolean;
}

function StationCombobox({
    stations,
    value,
    onChange,
    label,
    placeholder = "Søk etter stasjon...",
    isLoading = false,
}: ComboboxProps) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const inputId = useId();

    // Keep input text in sync if parent clears value externally
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown when search starts
    useEffect(() => {
        if (isLoading) setOpen(false);
    }, [isLoading]);

    const filtered =
        query.trim().length === 0
            ? stations.slice(0, MAX_RESULTS)
            : stations
                  .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
                  .slice(0, MAX_RESULTS);

    function selectStation(name: string) {
        onChange(name);
        setQuery(name);
        setOpen(false);
        setActiveIndex(-1);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        setOpen(true);
        setActiveIndex(-1);
        // If user clears the input, clear the selection
        if (e.target.value === "") onChange("");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open) {
            if (e.key === "ArrowDown") setOpen(true);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && filtered[activeIndex]) {
                selectStation(filtered[activeIndex].name);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
        }
    }

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const item = listRef.current.children[activeIndex] as HTMLElement;
            item?.scrollIntoView({ block: "nearest" });
        }
    }, [activeIndex]);

    // Close on outside click
    useEffect(() => {
        function handlePointerDown(e: PointerEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const isSelected = value !== "" && value === query;
    const listboxId = inputId + "-listbox";

    return (
        <div ref={containerRef} className="relative">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-havvind-700 dark:text-havvind-200 mb-1"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    onPointerDown={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                    className={inputCls + (isSelected ? " pr-8" : "")}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-controls={listboxId}
                />
                {isSelected && (
                    <button
                        key={value}
                        type="button"
                        aria-label="Fjern valgt stasjon"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            onChange("");
                            setQuery("");
                            setOpen(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-havvind-400 hover:text-havvind-700 hover:bg-havvind-100 dark:text-havvind-500 dark:hover:text-havvind-200 dark:hover:bg-havvind-600 transition-all cursor-pointer"
                        style={{ animation: "pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
                    >
                        <svg
                            width="10"
                            height="10"
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
                )}
            </div>

            {open && filtered.length > 0 && (
                <ul
                    id={listboxId}
                    ref={listRef}
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-havvind-200 bg-havvind-50 py-1 text-sm shadow-lg dark:border-havvind-600 dark:bg-havvind-800"
                    style={{
                        animation: "dropdown-in 0.15s ease-out both",
                        transformOrigin: "top",
                    }}
                >
                    {filtered.map((s, i) => (
                        <li
                            key={s.id}
                            role="option"
                            aria-selected={s.name === value}
                            onPointerDown={(e) => {
                                e.preventDefault(); // prevent input blur before click registers
                                selectStation(s.name);
                            }}
                            className={`cursor-pointer px-3 py-2 transition-colors ${
                                i === activeIndex
                                    ? "bg-havvind-800 text-white"
                                    : s.name === value
                                      ? "bg-havvind-100 text-havvind-700 dark:bg-havvind-900/40 dark:text-havvind-300"
                                      : "text-havvind-800 hover:bg-havvind-100 dark:text-havvind-200 dark:hover:bg-havvind-700"
                            }`}
                        >
                            {s.name}
                        </li>
                    ))}
                </ul>
            )}

            {open && query.trim().length > 0 && filtered.length === 0 && (
                <div
                    className="absolute z-50 mt-1 w-full rounded-md border border-havvind-200 bg-havvind-50 px-3 py-2 text-sm text-havvind-500 shadow-lg dark:border-havvind-600 dark:bg-havvind-800 dark:text-havvind-400"
                    style={{ animation: "dropdown-in 0.15s ease-out both", transformOrigin: "top" }}
                >
                    Ingen stasjoner funnet
                </div>
            )}
        </div>
    );
}

// ── SearchForm ────────────────────────────────────────────────────────────────

export const SearchForm = ({ stations, onSearch, isLoading }: SearchFormProps) => {
    const defaultRange = getDateRange("30");

    const [stationA, setStationA] = useState("Drammen stasjon");
    const [stationB, setStationB] = useState("Oslo S");
    const [preset, setPreset] = useState<DatePreset>("30");
    const [startDate, setStartDate] = useState(defaultRange.start);
    const [endDate, setEndDate] = useState(defaultRange.end);
    const [minDelay, setMinDelay] = useState(30);

    function handlePresetChange(p: DatePreset) {
        setPreset(p);
        if (p !== "custom") {
            const range = getDateRange(p);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    }

    const daysDiff = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    );

    const maxEndDate = addDays(startDate, MAX_DAYS);
    const minStartDate = addDays(endDate, -MAX_DAYS);

    function handleStartDateChange(value: string) {
        setStartDate(value);
        if (endDate > addDays(value, MAX_DAYS)) {
            setEndDate(addDays(value, MAX_DAYS));
        }
    }

    function handleEndDateChange(value: string) {
        setEndDate(value);
        if (startDate < addDays(value, -MAX_DAYS)) {
            setStartDate(addDays(value, -MAX_DAYS));
        }
    }

    const isValid =
        stationA.length > 0 &&
        stationB.length > 0 &&
        stationA !== stationB &&
        startDate <= endDate &&
        daysDiff <= MAX_DAYS;

    const isDirty =
        stationA !== "Drammen stasjon" ||
        stationB !== "Oslo S" ||
        preset !== "30" ||
        minDelay !== 30;

    function handleReset() {
        const range = getDateRange("30");
        setStationA("Drammen stasjon");
        setStationB("Oslo S");
        setPreset("30");
        setStartDate(range.start);
        setEndDate(range.end);
        setMinDelay(30);
    }

    function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!isValid) return;
        onSearch({ stationA, stationB, startDate, endDate, minDelay });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stations */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StationCombobox
                    stations={stations}
                    value={stationA}
                    onChange={setStationA}
                    label="Fra stasjon"
                    isLoading={isLoading}
                />
                <StationCombobox
                    stations={stations}
                    value={stationB}
                    onChange={setStationB}
                    label="Til stasjon"
                    isLoading={isLoading}
                />
            </div>

            {stationA && stationB && stationA === stationB && (
                <p
                    className="text-sm text-red-600 dark:text-red-400"
                    style={{ animation: "shake 0.35s ease-in-out" }}
                >
                    Fra og til stasjon må være forskjellige.
                </p>
            )}

            {/* Date presets */}
            <div>
                <label className="block text-sm font-medium text-havvind-700 dark:text-havvind-200 mb-2">
                    Periode
                </label>
                <div className="flex flex-wrap gap-2">
                    {(["30", "90", "180", "custom"] as DatePreset[]).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => handlePresetChange(p)}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-90 active:translate-y-0 ${
                                preset === p
                                    ? "bg-havvind-900 text-white dark:bg-havvind-800 scale-[1.03] shadow-sm shadow-havvind-200 dark:shadow-havvind-900"
                                    : "bg-havvind-100 text-havvind-700 hover:bg-havvind-200 dark:bg-havvind-800 dark:text-havvind-200 dark:hover:bg-havvind-700"
                            }`}
                        >
                            {p === "30"
                                ? "Siste 30 dager"
                                : p === "90"
                                  ? "Siste 90 dager"
                                  : p === "180"
                                    ? "Siste 180 dager"
                                    : "Egendefinert"}
                        </button>
                    ))}
                </div>

                {preset === "custom" && (
                    <div
                        className="mt-3 grid grid-cols-2 gap-4"
                        style={{ animation: "slide-down 0.2s ease-out both" }}
                    >
                        <div>
                            <label className="block text-xs text-havvind-500 dark:text-havvind-400 mb-1">
                                Fra dato
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                max={maxEndDate}
                                min={minStartDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-havvind-500 dark:text-havvind-400 mb-1">
                                Til dato
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                max={maxEndDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                )}

                {daysDiff > MAX_DAYS && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Perioden kan ikke overstige 1 år ({MAX_DAYS} dager).
                    </p>
                )}
                {daysDiff > 30 && daysDiff <= MAX_DAYS && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                        Merk: perioder over 30 dager kan ta for lang tid og gi timeout. Anbefaler
                        maks 30 dager.
                    </p>
                )}
            </div>

            {/* Delay slider */}
            <div>
                <label className="block text-sm font-medium text-havvind-700 dark:text-havvind-200 mb-1">
                    Minimum forsinkelse:{" "}
                    <span
                        key={minDelay}
                        className="font-semibold text-havvind-800 dark:text-havvind-400 inline-block"
                        style={{
                            animation: "value-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                        }}
                    >
                        {minDelay} min
                    </span>
                </label>
                <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="w-full accent-havvind-800 dark:accent-havvind-400 transition-all cursor-pointer"
                />
                <div className="flex justify-between text-xs text-havvind-400 dark:text-havvind-500 mt-1">
                    <span>5 min</span>
                    <span>120 min</span>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="flex-1 rounded-lg bg-havvind-900 px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-havvind-950 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-havvind-600 focus:ring-offset-2 dark:bg-havvind-800 dark:hover:bg-havvind-700 dark:focus:ring-offset-havvind-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    style={
                        isValid && !isLoading
                            ? { animation: "glow-pulse 2.5s ease-in-out infinite" }
                            : undefined
                    }
                >
                    {isLoading ? "Søker..." : "Søk etter forsinkede tog"}
                </button>
                {isDirty && !isLoading && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-havvind-300 bg-havvind-50 px-4 py-3.5 text-base font-semibold text-havvind-600 shadow-sm hover:bg-havvind-100 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-havvind-400 focus:ring-offset-2 dark:border-havvind-600 dark:bg-havvind-800 dark:text-havvind-300 dark:hover:bg-havvind-700 dark:focus:ring-offset-havvind-900 transition-all"
                        style={{ animation: "pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
                    >
                        Nullstill
                    </button>
                )}
            </div>
        </form>
    );
}
