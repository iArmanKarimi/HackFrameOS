import { describe, it, expect } from "vitest";
import { runCommand } from "./SafeModeCore";

describe("SafeModeCore runCommand router", () => {
	it("shows help text", () => {
		const out = runCommand("help");
		expect(out).toContain("Available commands:");
	});

	it("routes load and status correctly", () => {
		const loadOut = runCommand("load auth-module");
		expect(loadOut).toContain("Subsystem /auth/null initialized");

		const status = runCommand("status");
		expect(status).toContain("auth-module      [OK]");
	});

	it("handles unknown commands with a bash-style error", () => {
		const out = runCommand("this-command-does-not-exist");
		expect(out).toContain("bash: command not found");
	});
});
