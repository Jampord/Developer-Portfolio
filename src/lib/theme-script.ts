import { sunTimes } from "./sky-clock";

/** localStorage key for the sky mode: "clock" (default) or "theme" */
export const SKY_MODE_KEY = "sky-mode";

/**
 * Runs before first paint: in clock mode, set the theme from the Pampanga clock so the page never
 * flashes the other one. next-themes reads the same "theme" key when it starts, so it agrees.
 * It runs in <head>, before next-themes' script, which then reads the theme this one stored.
 */
export const themeScript = `(function(){try{
var m=localStorage.getItem(${JSON.stringify(SKY_MODE_KEY)});if(m==="theme")return;
var now=Date.now();var s=(${sunTimes.toString()})(now);
var t=now<s.sunrise||now>=s.sunset?"dark":"light";
localStorage.setItem("theme",t);
var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;
}catch(e){}})();`;
