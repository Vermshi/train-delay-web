"use client";

import { useEffect, useState } from "react";
import SettingsDialog from "./SettingsDialog";

interface SettingsButtonProps {
    onCredentialChange?: () => void;
}

export default function SettingsButton({ onCredentialChange }: SettingsButtonProps) {
    const [hasCustom, setHasCustom] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        setHasCustom(!!localStorage.getItem("customServiceAccount"));

        function onStorageChange(e: StorageEvent) {
            if (e.key === "customServiceAccount") {
                setHasCustom(!!localStorage.getItem("customServiceAccount"));
            }
        }
        window.addEventListener("storage", onStorageChange);
        return () => window.removeEventListener("storage", onStorageChange);
    }, []);

    function handleCredentialChange() {
        setHasCustom(!!localStorage.getItem("customServiceAccount"));
        onCredentialChange?.();
    }

    return (
        <>
            <button
                onClick={() => setDialogOpen(true)}
                aria-label="Innstillinger"
                className={`relative rounded-lg p-2 transition-colors ${
                    hasCustom
                        ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                }`}
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                {hasCustom && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800" />
                )}
            </button>

            {dialogOpen && (
                <SettingsDialog
                    onClose={() => setDialogOpen(false)}
                    onCredentialChange={handleCredentialChange}
                />
            )}
        </>
    );
}
