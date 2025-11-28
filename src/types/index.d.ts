/**
 * Type definitions for BrowserFS
 * Provides type safety for BrowserFS operations
 */

export interface BrowserFSModule {
	configure: (
		config: BrowserFSConfig,
		callback: (err: Error | null) => void
	) => void;
	BFSRequire: (module: string) => BrowserFSFileSystem;
}

export interface BrowserFSConfig {
	fs: string;
	options: {
		storeName: string;
		store: IDBFactory;
	};
}

export interface BrowserFSFileSystem {
	mkdir: (
		path: string,
		options: { recursive?: boolean },
		callback: (err: Error | null) => void
	) => void;
	readdir: (
		path: string,
		callback: (err: Error | null, files?: string[]) => void
	) => void;
	access: (path: string, callback: (err: Error | null) => void) => void;
	writeFile: (
		path: string,
		content: string,
		encoding: string,
		callback: (err: Error | null) => void
	) => void;
	readFileSync: (path: string, encoding: string) => string;
	writeFileSync: (path: string, content: string, encoding: string) => void;
	statSync: (path: string) => BrowserFSStats;
	readdirSync: (path: string) => string[];
}

export interface BrowserFSStats {
	isFile: () => boolean;
	isDirectory: () => boolean;
}

export interface AsyncFileSystem {
	mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
	readdir: (path: string) => Promise<string[]>;
	access: (path: string) => Promise<void>;
	writeFile: (path: string, content: string, encoding: string) => Promise<void>;
}

export interface FileSystemError extends Error {
	code?: string;
}

/**
 * Component prop interfaces
 */

export interface SafeModeTerminalProps {
	onComplete?: () => void;
}

export interface BootScreenProps {
	onComplete: () => void;
}

export type MenuItemValue = "normal" | "safemode" | "memtest" | "restart";

export interface MenuItem {
	label: string;
	detail?: string;
	value: MenuItemValue;
}

export interface GrubScreenProps {
	onSelectBoot: (value: MenuItemValue) => void;
	canBootNormal: boolean;
}

export interface MemtestScreenProps {
	onExit: () => void;
}

export interface LogEntry {
	id: string;
	line: string;
}

/**
 * Worker message types
 */

export type WorkerMessageType = "progress" | "log" | "complete";

export interface WorkerProgressPayload {
	percent: number;
	step: string;
}

export interface WorkerLogPayload {
	line: string;
}

export interface WorkerMessage<T = WorkerProgressPayload | WorkerLogPayload> {
	type: WorkerMessageType;
	payload: T;
}