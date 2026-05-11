import { readFileSync } from "fs";
import path from "path";
import { MainContent } from "@/components/MainContent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsButton } from "@/components/SettingsButton";
import { TrainLogo } from "@/components/TrainLogo";

interface Station {
    id: string;
    name: string;
}

function loadStations(): Station[] {
    try {
        const filePath = path.join(process.cwd(), "src/data/stations.json");
        const raw = readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as Station[];
    } catch {
        return [];
    }
}

const Home = () => {
    const stations = loadStations();

    return (
        <div className="min-h-screen bg-havvind-100 dark:bg-havvind-950 transition-colors">
            <header className="border-b border-havvind-200 bg-havvind-50 dark:bg-havvind-900 dark:border-havvind-700 shadow-sm">
                <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <span className="inline-flex transition-transform duration-200 hover:scale-110 cursor-pointer">
                            <TrainLogo />
                        </span>
                        <div>
                            <h1 className="text-xl font-bold text-havvind-950 dark:text-havvind-25">
                                Forsinkede tog
                            </h1>
                            <p className="mt-0.5 text-sm text-havvind-500 dark:text-havvind-400">
                                Historiske togforsinkelser fra Entur BigQuery ({stations.length}{" "}
                                stasjoner tilgjengelig)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SettingsButton />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                {stations.length === 0 ? (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
                        Ingen stasjoner funnet. Kjør{" "}
                        <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 font-mono">
                            npx tsx scripts/fetch-stations.ts
                        </code>{" "}
                        for å hente stasjonsdata.
                    </div>
                ) : (
                    <MainContent stations={stations} />
                )}
            </main>
        </div>
    );
};

export default Home;
