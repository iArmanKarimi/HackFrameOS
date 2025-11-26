import { describe, it, expect } from "vitest";
import { loadModule } from "./kernel";
import { wifiHelp, wifiScan, wifiCrack, wifiConnect, netCheck, ping } from "./net";
 
describe("net simulation", () => {
	it("describes wifi help as simulated", () => {
		const help = wifiHelp();
		expect(help).toContain("Simulated wireless interface");
	});
 
	it("requires net-module before scanning", () => {
		const out = wifiScan();
		expect(out).toContain("net-module offline");
	});
 
	it("allows cracking and connecting to HF_LAB_NET after net-module is online", () => {
		loadModule("net-module");
 
		const scan = wifiScan();
		expect(scan).toContain("HF_LAB_NET");
 
		const crack = wifiCrack("ap-01");
		expect(crack).toContain("marked as cracked");
 
		const connect = wifiConnect("ap-01");
		expect(connect).toContain("SIMULATED-ONLINE");
 
		const status = netCheck();
		expect(status).toContain("External connectivity: SIMULATED-ONLINE");
	});
 
	it("pings core and net targets with clear messaging", () => {
		const corePing = ping("core");
		expect(corePing).toContain("Core services reachable");
 
		loadModule("net-module");
		const netPing = ping("net");
		expect(netPing).toContain("net-module responding on loopback route");
	});
});
 
 
