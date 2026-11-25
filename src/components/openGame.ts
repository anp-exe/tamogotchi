export const GAME_HASH = "#/play";
const GAME_TAB = "tama-game";

/**
 * The game lives in its own tab, like a handheld you pick up. A named target means
 * pressing Play again brings back the same tab instead of opening another one.
 */
export function openGame(): void {
  const url = `${window.location.pathname}${window.location.search}${GAME_HASH}`;
  const tab = window.open(url, GAME_TAB);
  if (tab) tab.focus();
  else window.location.hash = GAME_HASH; // pop-up blocked: play here instead
}
