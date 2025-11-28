/**
 * wifi command - Network tools for scanning, cracking, and connecting to access points
 */

import { wifiHelp, wifiScan, wifiCrack, wifiConnect } from "../net";

/**
 * Handle wifi command with subcommands (scan, crack, connect)
 * @param args - Command arguments (subcommand and optional AP ID)
 * @returns WiFi operation result message
 */
export function handleWifi(args: string[]): string {
	if (args.length === 0) {
		return wifiHelp();
	}
	const subcommand = args[0];
	if (subcommand === "scan") {
		return wifiScan();
	}
	if (subcommand === "crack") {
		if (args.length < 2) {
			return wifiHelp();
		}
		return wifiCrack(args[1]);
	}
	if (subcommand === "connect") {
		if (args.length < 2) {
			return wifiHelp();
		}
		return wifiConnect(args[1]);
	}
	return wifiHelp();
}
