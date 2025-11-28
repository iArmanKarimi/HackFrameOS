/**
 * help command - Display available commands
 */

/**
 * Handle help command
 * @param args - Command arguments (unused)
 * @returns Help text with available commands
 */
export function handleHelp(args: string[]): string {
	return `Available commands:
	ls [path]          List directory contents
	cat [path]         Display file contents
	wifi scan          List nearby access points
	wifi crack [id]    Attempt to gain access to AP
	wifi connect [id]  Connect to a cracked AP
	ping [target]      Test connectivity (core|net|external)
	netcheck           Verify network status
	clear              Clear the terminal screen
	help               Show this help message`;
}
