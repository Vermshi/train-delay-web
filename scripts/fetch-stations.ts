/**
 * One-time script to fetch all Norwegian rail stations from Entur NSR GraphQL API.
 * Run with: npx tsx scripts/fetch-stations.ts
 * Output: src/data/stations.json
 */

import fs from "fs";
import path from "path";

const NSR_API = "https://api.entur.io/stop-places/v1/graphql";

const QUERY = `
{
  stopPlace(stopPlaceType: railStation, size: 1000) {
    id
    name {
      value
    }
  }
}
`;

interface StopPlace {
    id: string;
    name: { value: string };
}

interface Station {
    id: string;
    name: string;
}

async function fetchStations(): Promise<Station[]> {
    const response = await fetch(NSR_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ET-Client-Name": "entur-delays-web-fetch-stations",
        },
        body: JSON.stringify({ query: QUERY }),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();

    if (json.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const stopPlaces: StopPlace[] = json.data.stopPlace;

    return stopPlaces
        .map((sp) => ({ id: sp.id, name: sp.name.value }))
        .sort((a, b) => a.name.localeCompare(b.name, "nb"));
}

async function main() {
    console.log("Fetching rail stations from Entur NSR API...");

    const stations = await fetchStations();

    const outPath = path.join(process.cwd(), "src/data/stations.json");
    fs.writeFileSync(outPath, JSON.stringify(stations, null, 2), "utf-8");

    console.log(`Done! Wrote ${stations.length} stations to ${outPath}`);
    console.log(
        "Sample:",
        stations.slice(0, 5).map((s) => s.name)
    );
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
