/** The player's username: what the pet calls you. Stored apart from the pet, so a new egg keeps it. */

const KEY = "tama_username";
export const USERNAME_MAX = 16;

export function cleanUsername(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, USERNAME_MAX);
}

export function loadUsername(): string {
  try {
    return cleanUsername(localStorage.getItem(KEY) ?? "");
  } catch {
    return "";
  }
}

export function saveUsername(name: string): void {
  try {
    localStorage.setItem(KEY, cleanUsername(name));
  } catch {
    // Storage blocked: the name still works for this visit.
  }
}

/** Told to the pet with every chat message, alongside the facts the player chose to share. */
export function chatMemories(username: string, savedFacts: string[]): string[] {
  return username ? [`My name is ${username}.`, ...savedFacts] : savedFacts;
}
