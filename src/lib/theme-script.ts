import { sunTimes } from "./sky-clock";

/** localStorage key for the sky mode: "clock" (default) or "theme" */
export const SKY_MODE_KEY = "sky-mode";

/** localStorage key for the hero's live sky: "on", or "off" (the default, so turning it on is a surprise) */
export const HERO_SKY_KEY = "hero-sky";

/** Set on <html> while the hero's sky is off, so CSS can hide its placeholder before any script loads */
export const HERO_SKY_OFF_ATTR = "data-hero-sky-off";

/** Set on <html> for a moment after a visitor turns the sky on, to play its reveal */
export const HERO_SKY_REVEAL_ATTR = "data-hero-sky-reveal";

/**
 * Runs before first paint: in clock mode, set the theme from the Pampanga clock so the page never
 * flashes the other one. next-themes reads the same "theme" key when it starts, so it agrees.
 * It runs in <head>, before next-themes' script, which then reads the theme this one stored.
 * It also marks the page unless a visitor has turned the hero's sky on, so it never flashes in.
 */
const markSkyOff = `document.documentElement.setAttribute(${JSON.stringify(HERO_SKY_OFF_ATTR)},"")`;

export const themeScript = `(function(){
try{if(localStorage.getItem(${JSON.stringify(HERO_SKY_KEY)})!=="on")${markSkyOff};}catch(e){${markSkyOff};}
try{
var m=localStorage.getItem(${JSON.stringify(SKY_MODE_KEY)});if(m==="theme")return;
var now=Date.now();var s=(${sunTimes.toString()})(now);
var t=now<s.sunrise||now>=s.sunset?"dark":"light";
localStorage.setItem("theme",t);
var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;
}catch(e){}})();`;
