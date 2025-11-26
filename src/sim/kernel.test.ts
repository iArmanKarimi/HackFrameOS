import { describe, it, expect } from "vitest";
import {
  showStatus,
  loadModule,
  listFragments,
  resolveFragment,
  nextHint,
} from "./kernel";

describe("kernel simulation", () => {
  it("starts with modules missing in status output", () => {
    const status = showStatus();
    expect(status).toContain("auth-module      [MISSING]");
  });

  it("loads a module and reflects it in status", () => {
    const out = loadModule("auth-module");
    expect(out).toContain("Subsystem /auth/null initialized");

    const status = showStatus();
    expect(status).toContain("auth-module      [OK]");
  });

  it("lists fragments and allows resolving when module is loaded", () => {
    const before = listFragments();
    expect(before).toContain("[UNRESOLVED]");

    // entropy-core fragment should resolve after loading the module
    loadModule("entropy-core");
    const result = resolveFragment("0001A3F5");
    expect(result).toContain("[OK] Fragment 0001A3F5 resolved");

    const after = listFragments();
    expect(after).toContain("0001A3F5");
  });

  it("provides contextual hints as modules come online", () => {
    const firstHint = nextHint();
    // auth-module was not loaded yet, so the first hint should talk about network stack
    expect(firstHint).toContain("Network stack is dormant.");

    loadModule("auth-module");
    const secondHint = nextHint();
    expect(secondHint).toContain("Network stack is dormant");
  });
});

