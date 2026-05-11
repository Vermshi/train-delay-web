"use client";

import { useEffect, useState } from "react";
import { SearchForm } from "./SearchForm";
import { ResultsTable } from "./ResultsTable";

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

interface MainContentProps {
    stations: Station[];
}

export const MainContent = ({ stations }: MainContentProps) => {
    const [results, setResults] = useState<DelayRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [resultsKey, setResultsKey] = useState(0);
    const [customCredentials, setCustomCredentials] = useState<Record<string, unknown> | null>(
        null
    );
    const [ticketNumber, setTicketNumber] = useState("");

    useEffect(() => {
        readCredentialsFromStorage();
        setTicketNumber(localStorage.getItem("ticketNumber") ?? "");

        function onStorageChange(e: StorageEvent) {
            if (e.key === "customServiceAccount") {
                readCredentialsFromStorage();
            }
        }
        window.addEventListener("storage", onStorageChange);
        return () => window.removeEventListener("storage", onStorageChange);
    }, []);

    function readCredentialsFromStorage() {
        const raw = localStorage.getItem("customServiceAccount");
        if (raw) {
            try {
                setCustomCredentials(JSON.parse(raw) as Record<string, unknown>);
            } catch {
                setCustomCredentials(null);
            }
        } else {
            setCustomCredentials(null);
        }
    }

    function handleTicketNumberChange(value: string) {
        setTicketNumber(value);
        if (value) {
            localStorage.setItem("ticketNumber", value);
        } else {
            localStorage.removeItem("ticketNumber");
        }
    }

    function handleResetCredentials() {
        localStorage.removeItem("customServiceAccount");
        readCredentialsFromStorage();
        window.dispatchEvent(new StorageEvent("storage", { key: "customServiceAccount" }));
    }

    async function handleSearch(params: SearchParams) {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const body: Record<string, unknown> = { ...params };
            if (customCredentials) {
                body.customCredentials = customCredentials;
            }

            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Ukjent feil fra serveren");
                setResults([]);
                setResultsKey((k) => k + 1);
                return;
            }

            setResults(data.results ?? []);
            setResultsKey((k) => k + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Klarte ikke å koble til serveren");
            setResults([]);
            setResultsKey((k) => k + 1);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {customCredentials && (
                <div className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <span>Du bruker din egen tjenestekonto.</span>
                    <button
                        onClick={handleResetCredentials}
                        className="ml-4 font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors whitespace-nowrap"
                    >
                        Tilbakestill til standard →
                    </button>
                </div>
            )}

            <div className="rounded-xl border border-havvind-200 dark:border-havvind-700 bg-havvind-50 dark:bg-havvind-900 p-6 shadow-sm">
                <SearchForm
                    stations={stations}
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    ticketNumber={ticketNumber}
                    onTicketNumberChange={handleTicketNumberChange}
                />
            </div>

            <div className="rounded-xl border border-havvind-200 dark:border-havvind-700 bg-havvind-50 dark:bg-havvind-900 p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-havvind-800 dark:text-havvind-100">
                    Resultater
                </h2>
                <div key={resultsKey}>
                    <ResultsTable
                        results={results}
                        isLoading={isLoading}
                        hasSearched={hasSearched}
                        error={error}
                        ticketNumber={ticketNumber}
                        stations={stations}
                    />
                </div>
            </div>
        </div>
    );
};
