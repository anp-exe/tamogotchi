import { describe, expect, it } from "vitest";
import { USERNAME_MAX, chatMemories, cleanUsername } from "./player";

describe("cleanUsername", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(cleanUsername("  anna   p  ")).toBe("anna p");
    expect(cleanUsername("x".repeat(40))).toHaveLength(USERNAME_MAX);
  });
});

describe("chatMemories", () => {
  it("tells the pet the player's name first", () => {
    expect(chatMemories("Anna", ["I like cats"])).toEqual(["My name is Anna.", "I like cats"]);
  });

  it("leaves the facts alone when there is no username", () => {
    expect(chatMemories("", ["I like cats"])).toEqual(["I like cats"]);
  });
});
