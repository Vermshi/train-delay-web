"use client";

import { useEffect, useState } from "react";

interface SettingsDialogProps {
    onClose: () => void;
    onCredentialChange: () => void;
}

type Status = "idle" | "checking" | "valid" | "invalid";

export const SettingsDialog = ({ onClose, onCredentialChange }: SettingsDialogProps) => {
    const [json, setJson] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("customServiceAccount");
        if (saved) {
            setJson(saved);
        }
    }, []);

    async function handleValidate() {
        setStatus("checking");
        setErrorMsg("");

        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch {
            setStatus("invalid");
            setErrorMsg("Ugyldig JSON — sjekk formateringen.");
            return;
        }

        try {
            const res = await fetch("/api/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credentials: parsed }),
            });
            const data = await res.json();
            if (data.valid) {
                setStatus("valid");
            } else {
                setStatus("invalid");
                setErrorMsg(data.error ?? "Ugyldig tjenestekonto");
            }
        } catch {
            setStatus("invalid");
            setErrorMsg("Klarte ikke å kontakte serveren");
        }
    }

    function handleSave() {
        localStorage.setItem("customServiceAccount", json);
        window.dispatchEvent(new StorageEvent("storage", { key: "customServiceAccount" }));
        onCredentialChange();
        onClose();
    }

    function handleReset() {
        localStorage.removeItem("customServiceAccount");
        window.dispatchEvent(new StorageEvent("storage", { key: "customServiceAccount" }));
        onCredentialChange();
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg rounded-xl border border-havvind-200 dark:border-havvind-700 bg-havvind-50 dark:bg-havvind-900 shadow-xl p-6 overflow-y-auto max-h-[90vh]">
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Lukk"
                    className="absolute right-4 top-4 rounded-lg p-1 text-havvind-400 hover:text-havvind-600 dark:hover:text-havvind-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <h2 className="text-lg font-semibold text-havvind-950 dark:text-havvind-25 mb-1">
                    Innstillinger
                </h2>
                <p className="text-sm text-havvind-500 dark:text-havvind-400 mb-3">
                    Lim inn din egen Google Service Account JSON for å bruke din egen
                    BigQuery-kvote.
                </p>

                {/* Collapsible help */}
                <div className="mb-4 rounded-lg border border-havvind-200 dark:border-havvind-700">
                    <button
                        onClick={() => setHelpOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-havvind-600 dark:text-havvind-300 hover:bg-havvind-100 dark:hover:bg-havvind-700/50 rounded-lg transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <svg
                                className="h-4 w-4 text-havvind-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Hvordan opprette en tjenestekonto
                        </span>
                        <svg
                            className={`h-4 w-4 text-havvind-400 transition-transform duration-200 ${helpOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {helpOpen && (
                        <div className="border-t border-havvind-200 dark:border-havvind-700 px-4 py-4 text-sm text-havvind-600 dark:text-havvind-300 space-y-4">
                            <div>
                                <p className="font-semibold text-havvind-700 dark:text-havvind-200 mb-1">
                                    Steg 1 — Opprett et Google Cloud-prosjekt
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-havvind-500 dark:text-havvind-400">
                                    <li>
                                        Gå til{" "}
                                        <a
                                            href="https://console.cloud.google.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-xs bg-havvind-100 dark:bg-havvind-700 px-1 rounded text-havvind-800 dark:text-havvind-400 hover:underline"
                                        >
                                            console.cloud.google.com
                                        </a>
                                    </li>
                                    <li>
                                        Klikk prosjektvelgeren øverst →{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            New Project
                                        </strong>
                                    </li>
                                    <li>
                                        Gi det et navn (f.eks.{" "}
                                        <span className="font-mono text-xs bg-havvind-100 dark:bg-havvind-700 px-1 rounded">
                                            tog-forsinkelser
                                        </span>
                                        ) og klikk{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            Create
                                        </strong>
                                    </li>
                                    <li>Sørg for at det nye prosjektet er valgt i velgeren</li>
                                </ol>
                            </div>

                            <div>
                                <p className="font-semibold text-havvind-700 dark:text-havvind-200 mb-1">
                                    Steg 2 — Opprett en tjenestekonto
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-havvind-500 dark:text-havvind-400">
                                    <li>
                                        Gå til{" "}
                                        <a
                                            href="https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-havvind-800 dark:text-havvind-400 hover:underline"
                                        >
                                            IAM &amp; Admin → Service Accounts
                                        </a>
                                    </li>
                                    <li>
                                        Klikk{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            + Create Service Account
                                        </strong>
                                    </li>
                                    <li>
                                        Gi den et navn (f.eks.{" "}
                                        <span className="font-mono text-xs bg-havvind-100 dark:bg-havvind-700 px-1 rounded">
                                            entur-reader
                                        </span>
                                        ) og klikk{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            Create and Continue
                                        </strong>
                                    </li>
                                </ol>
                            </div>

                            <div>
                                <p className="font-semibold text-havvind-700 dark:text-havvind-200 mb-1">
                                    Steg 3 — Gi nødvendige tillatelser
                                </p>
                                <p className="text-havvind-500 dark:text-havvind-400 mb-1">
                                    Under{" "}
                                    <strong className="text-havvind-600 dark:text-havvind-300">
                                        Grant this service account access to project
                                    </strong>
                                    , legg til disse to rollene (eller gå til{" "}
                                    <a
                                        href="https://console.cloud.google.com/iam-admin/iam"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-havvind-800 dark:text-havvind-400 hover:underline"
                                    >
                                        IAM
                                    </a>{" "}
                                    og rediger kontoen i etterkant):
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-havvind-500 dark:text-havvind-400">
                                    <li>
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            BigQuery Job User
                                        </strong>{" "}
                                        — lar kontoen kjøre spørringer (det som faktureres til ditt
                                        prosjekt)
                                    </li>
                                    <li>
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            BigQuery Data Viewer
                                        </strong>{" "}
                                        — lar kontoen lese den returnerte dataen
                                    </li>
                                </ul>
                                <p className="mt-1 text-havvind-500 dark:text-havvind-400">
                                    Klikk{" "}
                                    <strong className="text-havvind-600 dark:text-havvind-300">
                                        Continue
                                    </strong>
                                    , deretter{" "}
                                    <strong className="text-havvind-600 dark:text-havvind-300">
                                        Done
                                    </strong>
                                    .
                                </p>
                            </div>

                            <div>
                                <p className="font-semibold text-havvind-700 dark:text-havvind-200 mb-1">
                                    Steg 4 — Last ned JSON-nøkkelen
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-havvind-500 dark:text-havvind-400">
                                    <li>Klikk på tjenestekontoen du nettopp opprettet</li>
                                    <li>
                                        Gå til fanen{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            Keys
                                        </strong>
                                    </li>
                                    <li>
                                        Klikk{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            Add Key → Create new key
                                        </strong>
                                        , velg{" "}
                                        <strong className="text-havvind-600 dark:text-havvind-300">
                                            JSON
                                        </strong>
                                    </li>
                                    <li>
                                        En{" "}
                                        <span className="font-mono text-xs bg-havvind-100 dark:bg-havvind-700 px-1 rounded">
                                            .json
                                        </span>
                                        -fil lastes ned — lim inn innholdet fra denne here
                                    </li>
                                </ol>
                            </div>

                            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                                <strong>Kostnad:</strong> BigQuery sin gratiskvote inkluderer 1 TB
                                med spørringer per måned (data som prosesseres, ikke returneres).
                                Hvert søk i denne appen bruker typisk 1–100 GB, noe som gir 10-1000
                                søk gratis.
                            </div>
                        </div>
                    )}
                </div>

                <textarea
                    value={json}
                    onChange={(e) => {
                        setJson(e.target.value);
                        setStatus("idle");
                    }}
                    placeholder='{ "type": "service_account", "project_id": "...", ... }'
                    rows={10}
                    spellCheck={false}
                    className="w-full rounded-lg border border-havvind-200 dark:border-havvind-600 bg-havvind-25 dark:bg-havvind-950 p-3 font-mono text-xs text-havvind-800 dark:text-havvind-200 focus:outline-none focus:ring-2 focus:ring-havvind-600 resize-none"
                />

                {/* Status feedback */}
                {status === "valid" && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                        <svg
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Legitimasjonen er gyldig og har tilgang til Entur-datasettet.
                    </p>
                )}
                {status === "invalid" && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <svg
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        {errorMsg}
                    </p>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={handleValidate}
                        disabled={!json.trim() || status === "checking"}
                        className="rounded-lg bg-havvind-900 px-4 py-2 text-sm font-medium text-white hover:bg-havvind-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === "checking" ? "Validerer…" : "Valider legitimasjon"}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={status !== "valid"}
                        className="rounded-lg bg-havvind-900 px-4 py-2 text-sm font-medium text-white hover:bg-havvind-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Lagre og bruk
                    </button>
                </div>

                <hr className="my-4 border-havvind-200 dark:border-havvind-700" />

                <div className="flex items-center justify-between">
                    <span className="text-sm text-havvind-500 dark:text-havvind-400"></span>
                    <button
                        onClick={handleReset}
                        className="rounded-lg border border-havvind-200 dark:border-havvind-600 px-3 py-1.5 text-sm text-havvind-600 dark:text-havvind-300 hover:bg-havvind-100 dark:hover:bg-havvind-700 transition-colors"
                    >
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
};
