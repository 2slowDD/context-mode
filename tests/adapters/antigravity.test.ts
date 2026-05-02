import "../setup-home";
import { describe, it, expect, beforeEach } from "vitest";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { AntigravityAdapter } from "../../src/adapters/antigravity/index.js";

describe("AntigravityAdapter", () => {
  let adapter: AntigravityAdapter;

  beforeEach(() => {
    adapter = new AntigravityAdapter();
  });

  // ── Identity ───────────────────────────────────────────

  describe("identity", () => {
    it("name is Antigravity", () => {
      expect(adapter.name).toBe("Antigravity");
    });

    it("paradigm is mcp-only", () => {
      expect(adapter.paradigm).toBe("mcp-only");
    });
  });

  // ── Capabilities ──────────────────────────────────────

  describe("capabilities", () => {
    it("all capabilities are false", () => {
      expect(adapter.capabilities.preToolUse).toBe(false);
      expect(adapter.capabilities.postToolUse).toBe(false);
      expect(adapter.capabilities.preCompact).toBe(false);
      expect(adapter.capabilities.sessionStart).toBe(false);
      expect(adapter.capabilities.canModifyArgs).toBe(false);
      expect(adapter.capabilities.canModifyOutput).toBe(false);
      expect(adapter.capabilities.canInjectSessionContext).toBe(false);
    });
  });

  // ── Parse methods ──────────────────────────────────────
  // Antigravity is mcp-only — parsers should never be invoked in
  // normal operation because capability flags are all false. They
  // exist as safe defaults so a misconfigured caller cannot leak
  // undefined projectDir downstream.

  describe("parse methods", () => {
    it("parsePreToolUseInput resolves projectDir from input.cwd", () => {
      const event = adapter.parsePreToolUseInput({ cwd: "/wire/proj" });
      expect(event.projectDir).toBe("/wire/proj");
    });

    it("parsePreToolUseInput falls back to ANTIGRAVITY_PROJECT_DIR", () => {
      const saved = process.env.ANTIGRAVITY_PROJECT_DIR;
      process.env.ANTIGRAVITY_PROJECT_DIR = "/env/proj";
      try {
        const event = adapter.parsePreToolUseInput({});
        expect(event.projectDir).toBe("/env/proj");
      } finally {
        if (saved === undefined) delete process.env.ANTIGRAVITY_PROJECT_DIR;
        else process.env.ANTIGRAVITY_PROJECT_DIR = saved;
      }
    });

    it("parsePreToolUseInput falls back to process.cwd() when env+input missing", () => {
      const saved = process.env.ANTIGRAVITY_PROJECT_DIR;
      delete process.env.ANTIGRAVITY_PROJECT_DIR;
      try {
        const event = adapter.parsePreToolUseInput({});
        expect(event.projectDir).toBe(process.cwd());
      } finally {
        if (saved !== undefined) process.env.ANTIGRAVITY_PROJECT_DIR = saved;
      }
    });

    it("post / preCompact / sessionStart parsers also fall back to process.cwd()", () => {
      const saved = process.env.ANTIGRAVITY_PROJECT_DIR;
      delete process.env.ANTIGRAVITY_PROJECT_DIR;
      try {
        expect(adapter.parsePostToolUseInput({}).projectDir).toBe(process.cwd());
        expect(adapter.parsePreCompactInput({}).projectDir).toBe(process.cwd());
        expect(adapter.parseSessionStartInput({}).projectDir).toBe(process.cwd());
      } finally {
        if (saved !== undefined) process.env.ANTIGRAVITY_PROJECT_DIR = saved;
      }
    });
  });

  // ── Format methods (all return undefined) ─────────────

  describe("format methods", () => {
    it("formatPreToolUseResponse returns undefined", () => {
      const result = adapter.formatPreToolUseResponse({
        decision: "deny",
        reason: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatPostToolUseResponse returns undefined", () => {
      const result = adapter.formatPostToolUseResponse({
        additionalContext: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatPreCompactResponse returns undefined", () => {
      const result = adapter.formatPreCompactResponse({
        context: "test",
      });
      expect(result).toBeUndefined();
    });

    it("formatSessionStartResponse returns undefined", () => {
      const result = adapter.formatSessionStartResponse({
        context: "test",
      });
      expect(result).toBeUndefined();
    });
  });

  // ── Hook config (all empty) ───────────────────────────

  describe("hook config", () => {
    it("generateHookConfig returns empty object", () => {
      const config = adapter.generateHookConfig("/some/plugin/root");
      expect(config).toEqual({});
    });

    it("configureAllHooks returns empty array", () => {
      const changes = adapter.configureAllHooks("/some/plugin/root");
      expect(changes).toEqual([]);
    });

    it("setHookPermissions returns empty array", () => {
      const set = adapter.setHookPermissions("/some/plugin/root");
      expect(set).toEqual([]);
    });
  });

  // ── Config paths ──────────────────────────────────────

  describe("config paths", () => {
    it("settings path is ~/.gemini/antigravity/mcp_config.json", () => {
      expect(adapter.getSettingsPath()).toBe(
        resolve(homedir(), ".gemini", "antigravity", "mcp_config.json"),
      );
    });

    it("session dir is under ~/.gemini/context-mode/sessions/", () => {
      const sessionDir = adapter.getSessionDir();
      expect(sessionDir).toBe(
        join(homedir(), ".gemini", "context-mode", "sessions"),
      );
    });

    it("session DB path contains project hash", () => {
      const dbPath = adapter.getSessionDBPath("/test/project");
      expect(dbPath).toMatch(/[a-f0-9]{16}\.db$/);
      expect(dbPath).toContain(".gemini");
    });

    it("session events path contains project hash with -events.md suffix", () => {
      const eventsPath = adapter.getSessionEventsPath("/test/project");
      expect(eventsPath).toMatch(/[a-f0-9]{16}-events\.md$/);
      expect(eventsPath).toContain(".gemini");
    });
  });

});
