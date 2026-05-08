import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { readFileSync } from "fs";

export const runtime = "nodejs";
export const maxDuration = 10;

const REQUIRED_FIELDS = ["type", "project_id", "private_key", "client_email"];

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ valid: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { credentials } = body as { credentials?: Record<string, unknown> };

    if (!credentials || typeof credentials !== "object") {
        return NextResponse.json(
            { valid: false, error: "Missing credentials object" },
            { status: 400 }
        );
    }

    for (const field of REQUIRED_FIELDS) {
        if (typeof credentials[field] !== "string" || !credentials[field]) {
            return NextResponse.json(
                { valid: false, error: `Missing or invalid field: ${field}` },
                { status: 400 }
            );
        }
    }

    const projectId = credentials.project_id as string;

    try {
        const bq = new BigQuery({
            projectId,
            credentials,
            location: "EU",
        });

        await bq.query({
            query: "SELECT 1 FROM `ent-data-sharing-ext-prd.realtime_siri_et.realtime_siri_et_last_recorded` LIMIT 1",
            location: "EU",
        });

        return NextResponse.json({ valid: true });
    } catch (err) {
        console.error("Credential validation error:", err);
        return NextResponse.json({
            valid: false,
            error: "Klarte ikke å validere legitimasjonen. Kontroller at tjenestekontoen har korrekte tillatelser.",
        });
    }
}
