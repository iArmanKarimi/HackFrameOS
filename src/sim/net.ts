// Simulated networking and Wi‑Fi layer for HackFrameOS.
// All behavior here is purely in-memory and has no real network effects.

import { getModuleStates, type ModuleId } from "./kernel";
import { appendLog } from "./fs";

// TTY-authentic formatting: only green for OK
const OK = (text: string) => `\x1b[32m${text}\x1b[0m`; // Green for OK (authentic Linux TTY)

type WifiId = "ap-01" | "ap-02" | "ap-ghost";

interface WifiAp {
	id: WifiId;
	ssid: string;
	signal: number; // 0-100
	locked: boolean;
	cracked: boolean;
}

let wifiAps: WifiAp[] = [
	{ id: "ap-01", ssid: "HF_LAB_NET_5G", signal: 78, locked: true, cracked: false },
	{ id: "ap-02", ssid: "Café-Guest-2.4", signal: 42, locked: true, cracked: false },
	{ id: "ap-ghost", ssid: "GHOSTLINK_encrypted", signal: 15, locked: true, cracked: false },
];

let connectedApId: WifiId | null = null;
let hasExternalConnectivity = false;

function isModuleOnline(id: ModuleId): boolean {
	const states = getModuleStates();
	return states[id] === "OK";
}

export function wifiHelp(): string {
	return `[WIFI] Simulated wireless interface
	wifi scan            List nearby access points
	wifi crack [id]      Attempt to gain access (simulation only)
	wifi connect [id]    Attach to a cracked AP
	netcheck             Verify external connectivity state
Note: Requires net-module to be online.`;
}

function ensureNetOnline(): string | null {
	if (!isModuleOnline("net-module")) {
		return `[ERROR] net-module offline. Use 'load net-module' before accessing Wi-Fi tools.`;
	}
	return null;
}

export function wifiScan(): string {
	const netError = ensureNetOnline();
	if (netError) return netError;

	const getSignalQuality = (signal: number): string => {
		if (signal >= 70) return `${signal}% (strong)`;
		if (signal >= 40) return `${signal}% (moderate)`;
		return `${signal}% (weak, unstable)`;
	};

	const lines = wifiAps
		.map((ap) => {
			const status = ap.cracked ? OK("cracked=yes") : "cracked=no";
			const lockStatus = ap.locked ? "locked=yes" : OK("locked=no");
			return `  └─ [${ap.id}] ${ap.ssid}  signal=${getSignalQuality(ap.signal)}  ${lockStatus}  ${status}`;
		})
		.join("\n");

	appendLog("/var/log/net.log", "[WIFI] Scan requested via safe-mode terminal");

	return `[WIFI] Nearby access points (simulated):
${lines}
Use 'wifi crack [id]' to attempt access.`;
}

export function wifiCrack(id: string): string {
	const netError = ensureNetOnline();
	if (netError) return netError;

	const ap = wifiAps.find((a) => a.id === id);
	if (!ap)
		return `[ERROR] Access point '${id}' not found. Use 'wifi scan' first.`;
	if (ap.cracked) return `[WIFI] AP ${id} already cracked.`;

	// Simple deterministic "success" logic: only HF_LAB_NET is actually crackable.
	if (ap.id === "ap-01") {
		ap.cracked = true;
		ap.locked = false;
		appendLog(
			"/var/log/net.log",
			`[WIFI] Simulated crack succeeded for ${ap.ssid} (${ap.id})`
		);
		return `[WIFI] Running simulated attack against ${ap.ssid}...
[WIFI] Scanning for vulnerabilities...
[WIFI] Exploiting WPS pin...
[WIFI] Brute-forcing key space...
${OK("[OK]")} Key material reconstructed (simulation only).
${OK("[OK]")} Access point ${id} marked as cracked. Use 'wifi connect ${id}'.`;
	}

	appendLog(
		"/var/log/net.log",
		`[WIFI] Simulated crack failed for ${ap.ssid} (${ap.id})`
	);
	return `[WIFI] Attempted attack on ${ap.ssid}...
[ERROR] Simulation: this AP resists current toolset. Try a different target.`;
}

export function wifiConnect(id: string): string {
	const netError = ensureNetOnline();
	if (netError) return netError;

	const ap = wifiAps.find((a) => a.id === id);
	if (!ap) return `[ERROR] Access point '${id}' not found.`;
	if (!ap.cracked) {
		return `[ERROR] Cannot connect to ${id}: access point not cracked in simulation.
Use 'wifi crack ${id}' first.`;
	}

	connectedApId = ap.id;
	hasExternalConnectivity = true;
	appendLog(
		"/var/log/net.log",
		`[WIFI] Interface bound to ${ap.ssid} (${ap.id}); external connectivity is SIMULATED-ONLINE`
	);

	return `[WIFI] Interface bound to ${ap.ssid} (${ap.id}).
[NET] External connectivity: ${OK("SIMULATED-ONLINE")}.
Use 'netcheck' to verify status.`;
}

export function netCheck(): string {
	if (!isModuleOnline("net-module")) {
		return `[NETCHECK] net-module: OFFLINE
[RESULT] External connectivity unavailable.`;
	}

	if (!connectedApId || !hasExternalConnectivity) {
		return `[NETCHECK] net-module: ${OK("ONLINE")}
[NETCHECK] Wi-Fi binding: NONE
[RESULT] No route to external network in simulation.`;
	}

	const ap = wifiAps.find((a) => a.id === connectedApId);
	const name = ap ? ap.ssid : connectedApId;
	return `[NETCHECK] net-module: ${OK("ONLINE")}
[NETCHECK] Wi-Fi binding: ${name}
[RESULT] External connectivity: ${OK("SIMULATED-ONLINE")}.`;
}

export function ping(targetRaw: string | undefined): string {
	const target = (targetRaw || "").trim();
	if (!target) {
		return `[PING] usage: ping [core|net|external]`;
	}

	if (target === "core" || target === "sim://core") {
		return `[PING] PING core (sim://core) 64 bytes from core: icmp_seq=0 time=0.042ms
${OK("[OK]")} Core services reachable inside simulation.`;
	}

	if (target === "net") {
		if (!isModuleOnline("net-module")) {
			return `[PING] PING net
[ERROR] net-module is offline. Use 'load net-module' first.`;
		}
		return `[PING] PING net 64 bytes from net: icmp_seq=0 time=0.028ms
${OK("[OK]")} net-module responding on loopback route.`;
	}

	if (target === "external") {
		if (!isModuleOnline("net-module") || !hasExternalConnectivity) {
			return `[PING] PING external
[ERROR] No simulated external route. Ensure 'net-module' is online and Wi-Fi is connected.`;
		}
		return `[PING] PING external 64 bytes from external: icmp_seq=0 time=12.345ms
${OK("[OK]")} Simulated external host reachable via current Wi-Fi binding.`;
	}

	return `[PING] Unknown target '${target}'.
Valid targets: core, net, external.`;
}


