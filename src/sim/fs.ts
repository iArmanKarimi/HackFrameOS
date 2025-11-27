// Scalable filesystem simulation for HackFrameOS using browserfs with IndexedDB persistence.
// This replaces the simple in-memory implementation with a robust, persistent filesystem.

import { format } from "date-fns";
import BrowserFS from "browserfs";

// Global filesystem instance - using any for now as browserfs types are complex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fsInstance: any = null;
let isInitialized = false;

// Default filesystem structure
const DEFAULT_FS_STRUCTURE = {
	"/README": `HackFrameOS Safe-Mode Simulator
 
This environment is a degraded OS image running in SAFE MODE.
Nothing here touches your real filesystem or network interfaces.
Use the terminal to explore, restore subsystems, and inspect logs.
`,
	"/boot/trace.log":
		"Boot trace captured from degraded HackFrameOS image.\nRefer to /var/log/boot.log for full kernel stream.\n",
	"/etc/hackframe.conf": `# HackFrameOS configuration (simulated)
image.state=DEGRADED
safe_mode=true
allowed_modules=auth-module,net-module,entropy-core,locale-config,time-sync,package-core,core-utils,gfx-module
wireless.interface=wlan0
wireless.mode=managed
`,
	"/var/log/boot.log":
		"Boot log stream is mirrored from the BIOS boot sequence.\nUse the BootScreen view to replay the cinematic log.\n",
	"/var/log/hackframe.log": `[LOG] HackFrameOS safe-mode terminal initialized
[LOG] Use 'mission' to view rehabilitation objectives
[LOG] Network activity is simulated and remains sandboxed
`,
	"/var/log/net.log": `[NET] Network log initialized (simulated only)
`,
};

/**
 * Initialize the filesystem with IndexedDB backend for persistence.
 * Creates default structure if filesystem is empty (first run).
 */
export async function initFilesystem(): Promise<void> {
	if (isInitialized && fsInstance) {
		return;
	}

	return new Promise((resolve, reject) => {
		BrowserFS.configure(
			{
				fs: "IndexedDB",
				options: {
					storeName: "HackFrameOS",
					store: window.indexedDB,
				},
			},
			(err) => {
				if (err) {
					reject(err);
					return;
				}

				fsInstance = BrowserFS.BFSRequire("fs");
				isInitialized = true;

				// Initialize default structure if filesystem is empty
				initializeDefaultStructure()
					.then(() => resolve())
					.catch(reject);
			}
		);
	});
}

/**
 * Initialize default filesystem structure if it doesn't exist.
 */
async function initializeDefaultStructure(): Promise<void> {
	if (!fsInstance) {
		throw new Error("Filesystem not initialized");
	}

	const fs = fsInstance;

	// Check if root directory exists and has content
	try {
		const rootContents = fs.readdirSync("/");
		// If root is not empty, assume filesystem is already initialized
		if (rootContents.length > 0) {
			return;
		}
	} catch (err) {
		// Root doesn't exist or is empty, proceed with initialization
	}

	// Create directory structure and files
	for (const [path, content] of Object.entries(DEFAULT_FS_STRUCTURE)) {
		try {
			// Ensure parent directories exist
			const dirPath = path.substring(0, path.lastIndexOf("/"));
			if (dirPath && dirPath !== "/") {
				fs.mkdirSync(dirPath, { recursive: true });
			}

			// Check if file exists
			try {
				fs.accessSync(path);
				// File exists, skip initialization
			} catch {
				// File doesn't exist, create it
				fs.writeFileSync(path, content, "utf8");
			}
		} catch (err) {
			console.warn(`Failed to initialize ${path}:`, err);
		}
	}
}

/**
 * Ensure filesystem is initialized before use.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureInitialized(): Promise<any> {
	if (!isInitialized || !fsInstance) {
		await initFilesystem();
	}
	if (!fsInstance) {
		throw new Error("Filesystem initialization failed");
	}
	return fsInstance;
}

/**
 * Get the filesystem instance (synchronous, assumes initialization).
 * Use ensureInitialized() for async initialization.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFS(): any {
	if (!fsInstance) {
		throw new Error("Filesystem not initialized. Call initFilesystem() first.");
	}
	return fsInstance;
}

export function fsHelp(): string {
	return `[FS] Simulated filesystem tools
	fs ls [path]      List directory entries (default: /)
	fs cat [path]     Show contents of a file
Example paths:
	/README
	/etc/hackframe.conf
	/var/log/hackframe.log
	/var/log/net.log
Note: Filesystem is persisted to IndexedDB and survives page reloads.`;
}

/**
 * List directory contents (synchronous for terminal compatibility).
 * Note: This assumes filesystem is already initialized.
 */
export function fsLs(pathArg?: string): string {
	const fs = getFS();
	const targetPath = pathArg && pathArg.trim().length > 0 ? pathArg.trim() : "/";

	try {
		const stats = fs.statSync(targetPath);

		if (stats.isFile()) {
			return `[FS] ls ${targetPath}
	${targetPath}`;
		}

		if (stats.isDirectory()) {
			const entries = fs.readdirSync(targetPath).sort();
			const listing =
				entries.length === 0
					? "  <empty>"
					: entries
						.map((name: string) => {
							const fullPath = targetPath === "/" ? `/${name}` : `${targetPath}/${name}`;
							try {
								const entryStats = fs.statSync(fullPath);
								const suffix = entryStats.isDirectory() ? "/" : "";
								return `  ${name}${suffix}`;
							} catch {
								return `  ${name}`;
							}
						})
						.join("\n");
			return `[FS] ls ${targetPath}
${listing}`;
		}

		return `[FS] ls: cannot access '${targetPath}': Invalid file type`;
	} catch (err) {
		return `[FS] ls: cannot access '${targetPath}': No such file or directory`;
	}
}

/**
 * Display file contents (synchronous for terminal compatibility).
 * Note: This assumes filesystem is already initialized.
 */
export function fsCat(pathArg?: string): string {
	if (!pathArg || !pathArg.trim()) {
		return "[FS] cat: missing operand\nUsage: fs cat /path/to/file";
	}

	const fs = getFS();
	const path = pathArg.trim();

	try {
		const stats = fs.statSync(path);

		if (stats.isDirectory()) {
			return `[FS] cat: ${path}: Is a directory`;
		}

		if (stats.isFile()) {
			return fs.readFileSync(path, "utf8");
		}

		return `[FS] cat: ${path}: Invalid file type`;
	} catch (err) {
		return `[FS] cat: ${path}: No such file`;
	}
}

// --- Internal mutation helpers (for other sim modules) ---

/**
 * Append a log line (with newline) to a simulated file if it exists and is a file.
 * Silent no-op when the path is invalid, to avoid noisy errors during sim.
 * Automatically adds timestamp using date-fns.
 * 
 * Note: This is async but can be called without awaiting for fire-and-forget logging.
 */
export async function appendLog(path: string, line: string): Promise<void> {
	try {
		const fs = await ensureInitialized();

		// Check if file exists and is a file
		try {
			const stats = fs.statSync(path);
			if (!stats.isFile()) {
				return; // Not a file, skip
			}
		} catch {
			return; // File doesn't exist, skip
		}

		// Append with timestamp
		const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
		const logLine = `[${timestamp}] ${line}\n`;

		// Read current content, append, write back
		const currentContent = fs.readFileSync(path, "utf8");
		fs.writeFileSync(path, currentContent + logLine, "utf8");
	} catch (err) {
		// Silent failure for logging operations
		console.warn(`Failed to append log to ${path}:`, err);
	}
}

// initFilesystem is already exported above
