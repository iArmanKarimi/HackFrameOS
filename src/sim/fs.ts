// Scalable filesystem simulation for HackFrameOS using browserfs with IndexedDB persistence.
// This replaces the simple in-memory implementation with a robust, persistent filesystem.

import { format } from "date-fns";

// BrowserFS will be loaded dynamically to handle ES module compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BrowserFS: any = null;
let browserFSLoadAttempted = false;

// Global filesystem instance - using any for now as browserfs types are complex
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fsInstance: any = null;
let isInitialized = false;
let initializationFailed = false; // Track if initialization failed permanently

// Default filesystem structure
const DEFAULT_FS_STRUCTURE = {
	"/README": `HackFrameOS Safe-Mode Simulator

SYSTEM STATUS: DEGRADED
Last known good state: 2024-01-15 03:42:18 UTC
Recovery protocol: ACTIVE

This environment is a degraded OS image running in SAFE MODE.
Nothing here touches your real filesystem or network interfaces.
Use the terminal to explore, restore subsystems, and inspect logs.

WARNING: System integrity compromised. Operator intervention required.
All network activity is simulated and remains sandboxed.
`,
	"/boot/trace.log":
		"Boot trace captured from degraded HackFrameOS image.\nRefer to /var/log/boot.log for full kernel stream.\nMultiple boot fragments detected with incomplete traces.\n",
	"/etc/hackframe.conf": `# HackFrameOS configuration (simulated)
image.state=DEGRADED
safe_mode=true
allowed_modules=auth-module,net-module,entropy-core,locale-config,time-sync,package-core,core-utils,gfx-module
wireless.interface=wlan0
wireless.mode=managed
kernel.version=0.1.3-alpha
build.date=2024-01-15
`,
	"/var/log/boot.log":
		"Boot log stream is mirrored from the BIOS boot sequence.\nUse the BootScreen view to replay the cinematic log.\nMultiple warnings detected during initialization.\n",
	"/var/log/hackframe.log": `[LOG] HackFrameOS safe-mode terminal initialized
[LOG] Use 'mission' to view rehabilitation objectives
[LOG] Network activity is simulated and remains sandboxed
[LOG] System recovery in progress...
`,
	"/var/log/net.log": `[NET] Network log initialized (simulated only)
[NET] Wireless interface: wlan0 (offline)
`,
	"/etc/motd": `HackFrameOS v0.1.3-alpha (build 2024.01.15)
System is running in SAFE MODE - degraded state detected.
Type 'mission' to view recovery objectives.
`,
};

/**
 * Initialize the filesystem with IndexedDB backend for persistence.
 * Creates default structure if filesystem is empty (first run).
 */
async function loadBrowserFS(): Promise<void> {
	if (browserFSLoadAttempted) {
		return;
	}
	browserFSLoadAttempted = true;

	try {
		// BrowserFS exports methods directly on the module
		const browserFSModule = await import("browserfs");

		// BrowserFS methods (configure, BFSRequire, etc.) are exported directly on the module
		// Check if configure method exists
		if (typeof browserFSModule.configure === "function") {
			BrowserFS = browserFSModule;
			console.log("BrowserFS loaded successfully");
		} else {
			// Try default export as fallback
			BrowserFS = browserFSModule.default || browserFSModule;

			if (BrowserFS && typeof BrowserFS.configure === "function") {
				console.log("BrowserFS loaded successfully (via default export)");
			} else {
				console.warn("BrowserFS module loaded but configure method not found", {
					hasConfigure: typeof browserFSModule.configure,
					hasDefault: !!browserFSModule.default,
					moduleKeys: Object.keys(browserFSModule),
				});
				BrowserFS = null;
				initializationFailed = true;
			}
		}
	} catch (error) {
		console.error("Failed to load BrowserFS:", error);
		BrowserFS = null;
		initializationFailed = true;
	}
}

export async function initFilesystem(): Promise<void> {
	// Load BrowserFS if not already loaded
	await loadBrowserFS();

	// If BrowserFS is not available, skip initialization gracefully
	if (!BrowserFS || !BrowserFS.configure) {
		console.warn("BrowserFS not available - skipping filesystem initialization");
		isInitialized = true; // Mark as initialized to prevent repeated attempts
		initializationFailed = true;
		return;
	}

	if (isInitialized && fsInstance) {
		return;
	}

	// Double-check that configure exists before using it
	if (!BrowserFS || typeof BrowserFS.configure !== "function") {
		console.warn("BrowserFS.configure is not available - skipping filesystem initialization");
		isInitialized = true;
		initializationFailed = true;
		return;
	}

	return new Promise((resolve, reject) => {
		try {
			if (!BrowserFS || !BrowserFS.configure) {
				reject(new Error("BrowserFS.configure is not available"));
				return;
			}

			BrowserFS.configure(
				{
					fs: "IndexedDB",
					options: {
						storeName: "HackFrameOS",
						store: window.indexedDB,
					},
				},
				(err: Error | null) => {
					if (err) {
						console.warn("Failed to configure BrowserFS:", err);
						reject(err);
						return;
					}

					try {
						if (!BrowserFS || !BrowserFS.BFSRequire) {
							reject(new Error("BrowserFS.BFSRequire is not available"));
							return;
						}

						fsInstance = BrowserFS.BFSRequire("fs");
						isInitialized = true;

						// Initialize default structure if filesystem is empty
						initializeDefaultStructure()
							.then(() => resolve())
							.catch(reject);
					} catch (error) {
						console.warn("Failed to get filesystem instance:", error);
						reject(error);
					}
				}
			);
		} catch (error) {
			console.warn("Failed to initialize BrowserFS:", error);
			reject(error);
		}
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

	// Helper for async operations
	const mkdirAsync = (path: string, options?: any): Promise<void> => {
		return new Promise((resolve, reject) => {
			fs.mkdir(path, options, (err: Error | null) => {
				if (err && (err as any).code !== "EEXIST") {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	};

	const readdirAsync = (path: string): Promise<string[]> => {
		return new Promise((resolve, reject) => {
			fs.readdir(path, (err: Error | null, files?: string[]) => {
				if (err) {
					reject(err);
				} else {
					resolve(files || []);
				}
			});
		});
	};

	const accessAsync = (path: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			fs.access(path, (err: Error | null) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	};

	const writeFileAsync = (path: string, content: string, encoding: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			fs.writeFile(path, content, encoding, (err: Error | null) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	};

	// Ensure root directory exists
	try {
		await mkdirAsync("/", { recursive: true });
	} catch (err) {
		// Root might already exist, ignore
	}

	// Check if root directory exists and has content
	try {
		const rootContents = await readdirAsync("/");
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
				await mkdirAsync(dirPath, { recursive: true });
			}

			// Check if file exists
			try {
				await accessAsync(path);
				// File exists, skip initialization
			} catch {
				// File doesn't exist, create it
				await writeFileAsync(path, content, "utf8");
			}
		} catch (err) {
			// Only log if it's not an "already exists" error
			const error = err as any;
			if (error.code !== "EEXIST" && error.code !== "ENOTSUP") {
				console.warn(`Failed to initialize ${path}:`, err);
			}
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
		// Return null instead of throwing to allow graceful degradation
		return null;
	}
	return fsInstance;
}

/**
 * Get the filesystem instance (synchronous, assumes initialization).
 * Use ensureInitialized() for async initialization.
 * Returns null if filesystem is not available (graceful degradation).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFS(): any | null {
	if (!fsInstance) {
		// Return null instead of throwing to allow graceful degradation
		return null;
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
	if (!fs) {
		return "ls: filesystem not available (BrowserFS initialization failed)";
	}
	const targetPath = pathArg && pathArg.trim().length > 0 ? pathArg.trim() : "/";

	try {
		const stats = fs.statSync(targetPath);

		if (stats.isFile()) {
			return `ls ${targetPath}
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
			return `ls ${targetPath}
${listing}`;
		}

		return `ls: cannot access '${targetPath}': Invalid file type`;
	} catch (err) {
		return `ls: cannot access '${targetPath}': No such file or directory`;
	}
}

/**
 * Display file contents (synchronous for terminal compatibility).
 * Note: This assumes filesystem is already initialized.
 */
export function fsCat(pathArg?: string): string {
	if (!pathArg || !pathArg.trim()) {
		return "cat: missing operand\nUsage: fs cat /path/to/file";
	}

	const fs = getFS();
	if (!fs) {
		return "cat: filesystem not available (BrowserFS initialization failed)";
	}
	const path = pathArg.trim();

	try {
		const stats = fs.statSync(path);

		if (stats.isDirectory()) {
			return `cat: ${path}: Is a directory`;
		}

		if (stats.isFile()) {
			return fs.readFileSync(path, "utf8");
		}

		return `cat: ${path}: Invalid file type`;
	} catch (err) {
		return `cat: ${path}: No such file`;
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
		if (!fs) {
			// Filesystem not available, skip silently
			return;
		}

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
