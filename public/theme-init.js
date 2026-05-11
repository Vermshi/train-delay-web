try {
    const t = localStorage.getItem("theme");
    if (t !== "light") document.documentElement.classList.add("dark");
} catch {}
try {
    const p = localStorage.getItem("theme-palette");
    if (p && p !== "havvind") document.documentElement.setAttribute("data-theme", p);
} catch {}
