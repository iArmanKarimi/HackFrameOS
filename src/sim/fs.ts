// In-memory, read-only filesystem simulation for HackFrameOS.

type FsNodeType = "file" | "dir";

interface FsNodeBase {
  type: FsNodeType;
}

export interface FsFile extends FsNodeBase {
  type: "file";
  content: string;
}

export interface FsDir extends FsNodeBase {
  type: "dir";
  children: Record<string, FsNode>;
}

export type FsNode = FsFile | FsDir;

const FS_ROOT: FsDir = {
  type: "dir",
  children: {
    boot: {
      type: "dir",
      children: {
        "trace.log": {
          type: "file",
          content:
            "Boot trace captured from degraded HackFrameOS image.\nRefer to /var/log/boot.log for full kernel stream.\n",
        },
      },
    },
    etc: {
      type: "dir",
      children: {
        "hackframe.conf": {
          type: "file",
          content: `# HackFrameOS configuration (simulated)
image.state=DEGRADED
safe_mode=true
allowed_modules=auth-module,net-module,entropy-core,locale-config,time-sync,package-core,core-utils,gfx-module
wireless.interface=wlan0
wireless.mode=managed
`,
        },
      },
    },
    var: {
      type: "dir",
      children: {
        log: {
          type: "dir",
          children: {
            "boot.log": {
              type: "file",
              content:
                "Boot log stream is mirrored from the BIOS boot sequence.\nUse the BootScreen view to replay the cinematic log.\n",
            },
            "hackframe.log": {
              type: "file",
              content: `[LOG] HackFrameOS safe-mode terminal initialized
[LOG] Use 'mission' to view rehabilitation objectives
[LOG] Network activity is simulated and remains sandboxed
`,
            },
            "net.log": {
              type: "file",
              content: `[NET] Network log initialized (simulated only)
`,
            },
          },
        },
      },
    },
    README: {
      type: "file",
      content: `HackFrameOS Safe-Mode Simulator

This environment is a degraded OS image running in SAFE MODE.
Nothing here touches your real filesystem or network interfaces.
Use the terminal to explore, restore subsystems, and inspect logs.
`,
    },
  },
};

export function fsHelp(): string {
  return `[FS] Simulated filesystem tools
  fs ls [path]      List directory entries (default: /)
  fs cat [path]     Show contents of a file
Example paths:
  /README
  /etc/hackframe.conf
  /var/log/hackframe.log
  /var/log/net.log
Note: Filesystem is read-only and exists only inside this simulation.`;
}

function resolvePath(path: string): FsNode | null {
  const trimmed = path.trim() || "/";
  if (!trimmed.startsWith("/")) {
    return null;
  }
  if (trimmed === "/") return FS_ROOT;
  const segments = trimmed.split("/").filter(Boolean);
  let node: FsNode = FS_ROOT;
  for (const segment of segments) {
    if (node.type !== "dir") return null;
    const next = node.children[segment];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function fsLs(pathArg?: string): string {
  const targetPath = pathArg && pathArg.trim().length > 0 ? pathArg : "/";
  const node = resolvePath(targetPath);
  if (!node) {
    return `[FS] ls: cannot access '${targetPath}': No such file or directory`;
  }
  if (node.type === "file") {
    return `[FS] ls ${targetPath}
  ${targetPath}`;
  }
  const entries = Object.keys(node.children).sort();
  const listing =
    entries.length === 0
      ? "  <empty>"
      : entries
        .map((name) => {
          const child = node.children[name];
          const suffix = child.type === "dir" ? "/" : "";
          return `  ${name}${suffix}`;
        })
        .join("\n");
  return `[FS] ls ${targetPath}
${listing}`;
}

export function fsCat(pathArg?: string): string {
  if (!pathArg || !pathArg.trim()) {
    return "[FS] cat: missing operand\nUsage: fs cat /path/to/file";
  }
  const node = resolvePath(pathArg);
  if (!node) {
    return `[FS] cat: ${pathArg}: No such file`;
  }
  if (node.type === "dir") {
    return `[FS] cat: ${pathArg}: Is a directory`;
  }
  return node.content;
}

// --- Internal mutation helpers (for other sim modules) ---

/**
 * Append a log line (with newline) to a simulated file if it exists and is a file.
 * Silent no-op when the path is invalid, to avoid noisy errors during sim.
 */
export function appendLog(path: string, line: string): void {
  const node = resolvePath(path);
  if (!node || node.type !== "file") {
    return;
  }
  node.content += `${line}\n`;
}


