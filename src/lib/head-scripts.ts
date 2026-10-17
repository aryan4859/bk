// Inline scripts that run from the server HTML before first paint. They live in a plain module, not next to the
// client components that use them: a "use client" file's exports reach the server only as client references,
// so a string exported from one would be rendered as a stub function instead of the code.

export const THEME_KEY = "theme";

/** A saved light/dark choice is applied before paint, so it never flashes the other theme. */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * The logo intro plays once per visit: the first full page load in a tab (with motion allowed), not on refreshes
 * or later loads, which sessionStorage remembers until the tab closes. Without this the preloader stays
 * display:none, so no-script and reduced-motion visitors never see it; if storage is blocked it is skipped too.
 */
export const preloadScript = `try{if(!sessionStorage.getItem("intro-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){sessionStorage.setItem("intro-seen","1");document.documentElement.dataset.preload="run"}}catch(e){}`;
