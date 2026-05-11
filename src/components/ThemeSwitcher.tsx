"use client";

import { useEffect, useState } from "react";

const THEMES = [
    { id: "havvind", label: "Havvind",  swatch: "#587a8c" },
    { id: "navy",    label: "Nattblå",  swatch: "#3d5270" },
    { id: "forest",  label: "Mosemark", swatch: "#2f5240" },
    { id: "terra",   label: "Leirstein",swatch: "#6b4038" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export const ThemeSwitcher = () => {
    const [active, setActive] = useState<ThemeId>("havvind");

    useEffect(() => {
        const saved = localStorage.getItem("theme-palette") as ThemeId | null;
        if (saved && THEMES.some((t) => t.id === saved)) {
            apply(saved);
            setActive(saved);
        }
    }, []);

    function apply(id: ThemeId) {
        if (id === "havvind") {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", id);
        }
        localStorage.setItem("theme-palette", id);
        setActive(id);
    }

    return (
        <div className="flex items-center gap-1.5">
            {THEMES.map((t) => (
                <button
                    key={t.id}
                    onClick={() => apply(t.id)}
                    aria-label={t.label}
                    title={t.label}
                    className="w-5 h-5 rounded-full transition-all hover:scale-125 focus:outline-none"
                    style={{
                        background: t.swatch,
                        boxShadow: active === t.id ? `0 0 0 2px white, 0 0 0 3.5px ${t.swatch}` : "none",
                    }}
                />
            ))}
        </div>
    );
};
