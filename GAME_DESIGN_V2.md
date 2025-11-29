# HackFrameOS - Refined Game Design Document v2

> **Design Philosophy**: "Cover vast concepts with high abstraction is better than covering very limited concepts in low-level detail."

> **Core Principle**: Players should feel SMART and POWERFUL as they progress. The OS should feel REAL but not overwhelming. Discovery-based learning with no hand-holding, but players should not get lost.

---

## Part 1: SafeMode (Complete) - System Setup Phase

**Status**: ✅ Already implemented

**Purpose**: Repair and setup the HackFrameOS system. This is NOT a tutorial - it is the first phase of the game.

**What happens here**:

- Load system modules (auth-module, net-module, etc.)
- Resolve boot fragments
- System becomes operational
- Transition to Desktop with `startx`

**Key Learning**: Players learn the OS structure, module dependencies, and basic commands through doing, not tutorials.

---

## Part 2: Desktop Environment - The Real Game Begins

### First Mission: "Get Connected"

**Objective**: Hack a WiFi network to get internet connectivity.

**Why this mission**:

- Sets up the core gameplay loop
- Teaches network discovery and cracking
- Establishes the "underground rogue hacker" vibe
- Simple but meaningful - player feels accomplished

**Mission Flow**:

1. Player boots into Desktop (after SafeMode)
2. System has no internet connection
3. Player discovers they need to hack WiFi to get online
4. `wifi scan` reveals nearby access points
5. Player cracks and connects to a network
6. Internet connectivity established
7. Mission complete - player can now discover nodes

**Tools Available**: NONE initially. Only basic Linux commands:

- `ls`, `cd`, `uptime`, `uname`, `reboot`, `hostname`, `whoami`
- `date`, `cal`, `free`, `df`, `lscpu`, `top`, `ps`
- `wifi scan`, `wifi crack [id]`, `wifi connect [id]` (from SafeMode)

---

## Part 3: Core Systems (Refined)

### 3.1 Command System Architecture

**Basic Linux Commands** (`src/os/bin/`):

```typescript
// System info
uptime, uname, hostname, whoami, date, cal

// Filesystem
ls, cd, pwd, cat, less, head, tail

// System resources
free, df, lscpu, top, ps, kill

// Network (from SafeMode, extended)
wifi scan, wifi crack, wifi connect
ping, netcheck
```

**Command Philosophy**:

- Commands work like real Linux (authentic outputs)
- Errors are simpler than real Linux (abstraction)
- Commands are discoverable (help, man pages)
- No fake "gamey" messages

### 3.2 Node System (Simplified but Real)

**Node Structure**:

```typescript
interface Node {
	id: string; // "node-01", "gateway-01"
	name: string; // "Corporate-Server-01"
	ip: string; // "192.168.1.100"
	securityLevel: 1-10; // Difficulty
	type: 'router' | 'server' | 'device' | 'gateway';

	// Network
	ports: Port[];
	firewall: Firewall;

	// Access
	discovered: boolean;
	cracked: boolean;
	connected: boolean; // Player has shell access

	// Filesystem (abstracted)
	filesystem: {
		logs: string[]; // Single /logs folder (abstracted)
		data: string[]; // Mission-relevant files
		keys: string[]; // Encryption keys
	};

	// Security
	encryption: EncryptionState;
	hasDetection: boolean; // Can detect intrusions
	os: 'linux' | 'windows';
}
```

**Node Discovery**:

- `wifi scan` - Shows nearby WiFi networks (these become nodes)
- `netdiscover` - Finds nodes on connected network (manual discovery)
- Nodes appear in Node Browser panel
- Each node is like a "planet to explore" - unique characteristics, files, vulnerabilities

**Network Topology** (Simple → Complex):

- **Phase 1**: Direct nodes (no topology)
- **Phase 2**: Gateway → Subnet structure
- **Phase 3**: Multiple subnets, routing

**Discovery Flow**:

1. Hack WiFi → Get internet
2. `netdiscover` → Find nodes on network
3. Select node → See details
4. Crack node → Get access
5. Explore filesystem → Find keys/data
6. Use node as "Bot" → Run tools remotely

### 3.3 Port System (Real but Simplified)

**Port Structure**:

```typescript
interface Port {
	number: number; // Real port numbers (22, 80, 443, etc.)
	protocol: "tcp" | "udp";
	status: "open" | "closed" | "filtered";
	service: string; // 'ssh', 'http', 'ftp', 'mysql'
	version: string; // Simplified but real (e.g., "OpenSSH 7.4")
	banner: string; // Real but simplified service banner
}
```

**Port Scanning**:

- `scan [node-id]` - Basic scan (shows open ports)
- Real port numbers and services
- Real but simplified banners
- Example output:

```
[SCAN] Scanning node-01 (192.168.1.100)...
[22/tcp] OPEN - SSH (OpenSSH 7.4)
[80/tcp] OPEN - HTTP (Apache 2.4)
[443/tcp] FILTERED - HTTPS
[3306/tcp] CLOSED - MySQL
```

**Port Usage**:

- Open ports = entry points
- Services determine what tools work
- SSH port (22) = shell access
- HTTP port (80) = web server (potential exploits)

### 3.4 Firewall System

**Firewall Structure**:

```typescript
interface Firewall {
	active: boolean;
	bypassProgress: number; // 0-100
	bypassMethod: "none" | "port" | "tool" | "exploit";
	rules: string[]; // Abstracted rules
}
```

**Bypass Methods**:

- **Port-based**: Open specific ports to bypass
- **Tool-based**: Use `FirewallBypass.exe` (when available)
- **Exploit-based**: Use discovered vulnerabilities
- **NO timer-based** - That's "cringe"

**Visual Feedback**:

- Progress bar in Node Detail View
- Terminal output shows bypass progress
- Realistic but simplified

### 3.5 Encryption System (Two-Step: Find Key → Decrypt)

**Encryption Flow**:

1. Player finds encrypted file
2. Player must find encryption key (on same node or different node)
3. Player uses key to decrypt file
4. File reveals data/credentials

**Why Two-Step**:

- More realistic than "crack password" (one step)
- Not too complex (just find key → decrypt)
- Teaches real encryption concepts
- Feels rewarding when you decrypt

**Key Locations**:

- Keys stored in `/keys/` folder (abstracted)
- Or in configuration files
- Or on different nodes (multi-step operation)

**Decryption Command**:

- `decrypt [file] [key]` - Decrypt file with key
- Or `decrypt [file]` - Auto-find key if available

### 3.6 Filesystem System (Highly Abstracted)

**File Structure** (Abstracted):

```
/node-[id]/
  /logs/          # All logs here (abstracted from /var/log, /etc/log, etc.)
  /data/          # Mission files, documents
  /keys/          # Encryption keys
  /config/        # Configuration files
  /root/          # Root directory (if cracked)
```

**Why Abstracted**:

- Real Linux has `/var/log`, `/etc/log`, `/usr/log`, etc. - too complex
- Single `/logs/` folder is enough
- Still feels real (it's a folder structure)
- Players understand it immediately

**File Operations**:

- `ls [path]` - List directory
- `cat [file]` - Read file
- `rm [file]` - Delete file (for log cleaning)
- `download [file]` - Download to local filesystem

**Log Cleaning** (Stealth Mechanic):

- `rm /logs/*` - Clean all logs (when connected to node)
- Required for stealth missions
- If logs not cleaned and node has detection → Player goes to SafeMode
- Makes player feel vulnerable (not invincible)

### 3.7 Tool System (Progressive Discovery)

**Tool Progression**:

- **Start**: No tools, only basic Linux commands
- **Discover**: Tools found on nodes or unlocked via missions
- **Acquire**: Download tools to local `/usr/bin/`
- **Use**: Execute tools via terminal

**Tool Categories**:

1. **Discovery Tools**:
   - `PortScanner.exe` - Scan ports (replaces `scan` command)
   - `NetDiscover.exe` - Find nodes
   - `SignalAnalyzer.exe` - Analyze signal strength

2. **Cracking Tools**:
   - `PasswordCracker.exe` - Crack passwords
   - `EncryptionBreaker.exe` - Break encryption (alternative to find key)

3. **Infiltration Tools**:
   - `SSHClient.exe` - Connect via SSH
   - `SQLInjection.exe` - SQL injection attacks
   - `XSSExploit.exe` - Cross-site scripting

4. **Defense Tools**:
   - `FirewallBypass.exe` - Bypass firewalls
   - `StealthMode.exe` - Reduce detection

5. **Data Tools**:
   - `FileDownloader.exe` - Download files
   - `LogAnalyzer.exe` - Analyze logs

**Tool Execution**:

- `tool.exe [args]` - Execute tool
- Tools consume RAM (shown in RAM visualization)
- Tools have realistic execution times
- Visual effects in RAM panel during execution

### 3.8 Bot System (Remote Shell Execution)

**Concept**: Player can get shell access on nodes and run tools remotely.

**Why Bots**:

- Leverage node's resources (CPU, RAM, bandwidth)
- Run tools on remote systems
- Distribute workload
- Feels powerful and smart

**Bot Mechanics**:

1. Crack node → Get shell access
2. `connect [node-id]` - Connect to node's shell
3. Run commands/tools on remote node
4. Node becomes "Bot" - can run programs
5. Player's local system + Bots = distributed system

**Bot Commands**:

- `connect [node-id]` - Connect to node shell
- `disconnect` - Disconnect from current node
- `bot list` - List all active bots
- Commands run on bot's system (not local)

**Resource Management**:

- Bot's RAM/CPU used for remote operations
- Player's local RAM/CPU for local operations
- Bandwidth affects data transfer speeds

### 3.9 Resource Management (RAM, CPU, Bandwidth)

**RAM System**:

- Each program/tool consumes RAM
- Shown in RAM visualization (grid-based)
- Too many tools = system slowdown
- `free` command shows RAM usage
- `kill [pid]` frees RAM

**CPU System**:

- Constant (not variable)
- Used for tool execution timing
- Bots use their own CPU

**Bandwidth System**:

- Affects download/upload speeds
- `download [file]` - Speed depends on bandwidth
- Network congestion affects speeds
- Realistic but simplified

**Why Resources Matter**:

- Prevents spam (can't run 10 tools at once)
- Makes player think strategically
- Feels real (resources are limited)
- Not too harsh (won't frustrate players)

### 3.10 Detection & Consequences

**Detection System**:

- Some nodes have detection listeners
- Failed attempts leave traces in logs
- Logs not cleaned → Detection triggered
- Detection → Player goes to SafeMode (system damaged)

**Why This Matters**:

- Player not invincible (feels vulnerable)
- Stealth matters (log cleaning required)
- Consequences feel real
- Rare but impactful

**What Triggers Detection**:

- Too many failed crack attempts (future feature)
- Logs not cleaned after intrusion
- Specific detection-triggering actions

**Consequence**:

- System modules damaged
- Player returns to SafeMode
- Must repair system again
- Teaches importance of stealth

---

## Part 4: Desktop UI Design (Refined)

### 4.1 Visual Style

**ASCII Art**:

- Polished, high-quality ASCII art
- Terminal-style graphics
- Retro-futuristic aesthetic
- Used for: node icons, tool icons, banners, status indicators

**Animations**:

- Authentic, retro vibe
- Subtle but noticeable
- Smooth transitions
- Used for: RAM visualization, tool execution, data flows

**2D Models**:

- Everything can be modeled: nodes, tools, data flows
- Simple but effective
- Consistent art style

**Color Scheme**:

- Primary: Green on black (terminal classic)
- Accent colors for status (red=error, yellow=warning, cyan=info)
- Themes can be added later

### 4.2 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  System Info Panel (Top, 20% height)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ RAM Viz      │ │ Network      │ │ Mission     │      │
│  │ (Grid)       │ │ Status       │ │ Progress    │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Target Node Window (Left, 60% width)                   │
│  ┌──────────────────────────────────────────────┐       │
│  │ [Node Browser] or [Node Details]             │       │
│  │ - Ports (real numbers, simplified banners)  │       │
│  │ - Firewall (progress bar)                    │       │
│  │ - Filesystem (/logs, /data, /keys)          │       │
│  │ - Bot status (if connected)                  │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  Terminal (Right, 40% width)                             │
│  ┌──────────────────────────────────────────────┐       │
│  │ > wifi scan                                   │       │
│  │ > netdiscover                                 │       │
│  │ > scan node-01                                │       │
│  │ > connect node-01                             │       │
│  │ > ls /logs                                    │       │
│  │ > rm /logs/*                                  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 4.3 RAM Visualization

**Implementation**:

- CSS Grid (Phase 1) → Canvas (Phase 2) → WebGL (Phase 3)
- Color-coded blocks: Kernel (red), Processes (blue), Free (gray), Cached (yellow)
- Real-time updates
- Visual effects during tool execution
- Shows RAM usage percentage

**Visual Effects** (when tools execute):

- Polygon-based program blocks
- Noise-based distortions
- Particle flows
- Color shifts and glows
- Procedural animations

---

## Part 5: Progression & Difficulty

### 5.1 Learning Curve

**Phase 1: Setup (SafeMode + First Mission)**

- Learn basic commands
- Hack WiFi to get internet
- Simple, achievable goals
- Player feels: "I can do this!"

**Phase 2: Discovery**

- Discover first nodes
- Learn port scanning
- Understand node structure
- Player feels: "I'm exploring!"

**Phase 3: Infiltration**

- Crack first node
- Explore filesystem
- Find keys, decrypt files
- Player feels: "I'm hacking!"

**Phase 4: Mastery**

- Use bots for remote operations
- Multi-node operations
- Advanced tools
- Player feels: "I'm powerful!"

### 5.2 Difficulty Scaling

**Early Game**:

- Simple nodes (security 1-3)
- Basic tools available
- Clear objectives
- No time pressure

**Mid Game**:

- Medium nodes (security 4-6)
- Tools to discover
- Multi-step operations
- Log cleaning required

**Late Game**:

- High security nodes (7-9)
- Complex tool combinations
- Network topology
- Stealth critical

**End Game**:

- Extreme security (10)
- All mechanics mastered
- Complex networks
- Player feels like a pro

### 5.3 What Makes Players Feel Smart

1. **Discovery**: "I found this myself!"
2. **Understanding**: "I know why this works!"
3. **Optimization**: "I can do this faster/better!"
4. **Mastery**: "I can skip steps because I know the system!"

**Examples**:

- Player discovers they can use `scan` instead of `PortScanner.exe` (if they know)
- Player finds encryption key without hints
- Player uses bot to run tools remotely (feels powerful)
- Player cleans logs before detection (feels smart)

---

## Part 6: Implementation Roadmap

### Phase 1: Core Desktop + First Mission (MVP)

**Desktop Layout**:

- [ ] 3-panel layout (System Info, Node Window, Terminal)
- [ ] Basic styling (green on black)
- [ ] RAM visualization (CSS Grid)

**Basic Commands**:

- [ ] Implement: `ls`, `cd`, `uptime`, `uname`, `hostname`, `whoami`, `date`, `cal`
- [ ] Implement: `free`, `df`, `lscpu`, `top`, `ps`, `kill`
- [ ] Extend: `wifi scan`, `wifi crack`, `wifi connect` (from SafeMode)

**First Mission**:

- [ ] Mission: "Get Connected" (hack WiFi for internet)
- [ ] Mission tracking system
- [ ] Mission completion → unlocks node discovery

**Node System** (Basic):

- [ ] Node data structure
- [ ] Node browser (list view)
- [ ] Node detail view (basic info)
- [ ] Node discovery via `netdiscover`

**Filesystem** (Abstracted):

- [ ] Remote node filesystem structure (`/logs`, `/data`, `/keys`)
- [ ] `ls`, `cat`, `rm` commands for nodes
- [ ] Log cleaning mechanic

**Where to Start**:

1. **Desktop Layout** (`src/components/desktop/DesktopShell.tsx`)
   - Create 3-panel layout
   - Add System Info Panel (RAM viz placeholder)
   - Add Node Window (placeholder)
   - Add Terminal (extend SafeMode terminal)

2. **Command System** (`src/os/bin/`)
   - Create `ls.ts`, `cd.ts`, `uptime.ts`, etc.
   - Extend command router in Desktop terminal
   - Make commands work on local + remote filesystems

3. **Node System** (`src/os/nodes.ts`)
   - Define node data structure
   - Create node discovery logic
   - Implement `netdiscover` command

4. **First Mission** (`src/os/missions.ts`)
   - Define mission structure
   - Create "Get Connected" mission
   - Mission tracking and completion

### Phase 2: Port Scanning & Node Cracking

- [ ] Port system (real ports, simplified banners)
- [ ] `scan [node-id]` command
- [ ] Node cracking mechanics
- [ ] Node detail view (ports, firewall, filesystem)

### Phase 3: Encryption & Tools

- [ ] Encryption system (find key → decrypt)
- [ ] Tool discovery system
- [ ] Tool execution framework
- [ ] RAM visualization effects

### Phase 4: Bots & Advanced Features

- [ ] Bot system (remote shell)
- [ ] Network topology (gateway → subnets)
- [ ] Advanced tools
- [ ] Multi-node operations

### Phase 5: Polish & Effects

- [ ] ASCII art assets
- [ ] Animations
- [ ] Shader effects (WebGL)
- [ ] Sound design
- [ ] UI polish

---

## Part 7: Technical Architecture

### 7.1 State Management

**Centralized State** (`src/os/game.ts`):

```typescript
interface GameState {
	// Nodes
	nodes: Node[];
	selectedNodeId: string | null;
	connectedNodeId: string | null; // Current bot connection

	// Missions
	missions: Mission[];
	activeMissionId: string | null;

	// Tools
	tools: Tool[];
	discoveredTools: string[];

	// Resources
	ramUsage: RAMUsage;
	bandwidth: number;

	// Filesystem
	localFilesystem: FileSystem;
	connections: Connection[];
}
```

**State Persistence**:

- Save to IndexedDB
- Auto-save after major actions
- Manual save via `save` command

### 7.2 Command System Extension

**New Command Handlers** (`src/os/bin/`):

- `ls.ts`, `cd.ts`, `cat.ts` - Filesystem commands
- `uptime.ts`, `uname.ts`, `hostname.ts` - System info
- `free.ts`, `df.ts`, `top.ts`, `ps.ts` - Resource management
- `netdiscover.ts` - Node discovery
- `scan.ts` - Port scanning
- `connect.ts` - Bot connection
- `decrypt.ts` - Encryption

**Command Router** (`src/components/desktop/DesktopTerminal.tsx`):

- Extends SafeMode command router
- Routes to appropriate handlers
- Handles local vs remote commands

### 7.3 File Structure

```
src/
  os/
    bin/              # Command implementations
      ls.ts
      cd.ts
      uptime.ts
      netdiscover.ts
      scan.ts
      connect.ts
      decrypt.ts
    nodes.ts          # Node system
    missions.ts       # Mission system
    tools.ts          # Tool system
    encryption.ts     # Encryption system
    game.ts           # Centralized game state
  components/
    desktop/
      DesktopShell.tsx
      SystemInfoPanel.tsx
      NodeWindow.tsx
      DesktopTerminal.tsx
      RAMVisualization.tsx
```

---

## Part 8: Design Principles Summary

### Core Principles

1. **Abstraction over Detail**: Cover many concepts at high abstraction rather than few in detail
2. **Real but Simple**: Authentic concepts, simplified implementation
3. **Discovery-based**: No hand-holding, but don't let players get lost
4. **Feel Smart**: Players discover, understand, optimize, master
5. **Feel Vulnerable**: Not invincible (log cleaning, detection)
6. **Feel Powerful**: Bots, tools, mastery over time
7. **Authentic Vibe**: Underground rogue hacker, retro-futuristic

### What Makes It Real

- Real port numbers and services
- Real but simplified command outputs
- Real encryption concepts (find key → decrypt)
- Real network topology (gateway → subnets)
- Real resource management (RAM, CPU, bandwidth)
- Real consequences (detection → SafeMode)

### What Makes It Accessible

- Abstracted file structures (single `/logs` folder)
- Simplified error messages
- Clear command structure
- Progressive complexity
- No overwhelming details
- Learn by doing

---

## Part 9: First Implementation Steps

### Step 1: Desktop Layout

**File**: `src/components/desktop/DesktopShell.tsx`

- Create 3-panel layout
- Add placeholders for System Info, Node Window, Terminal
- Style with green on black theme

### Step 2: Basic Commands

**Files**: `src/os/bin/ls.ts`, `cd.ts`, `uptime.ts`, etc.

- Implement basic Linux commands
- Make them work on local filesystem
- Integrate with command router

### Step 3: Node System (Basic)

**File**: `src/os/nodes.ts`

- Define node data structure
- Create initial nodes (WiFi networks from SafeMode)
- Implement `netdiscover` command

### Step 4: First Mission

**File**: `src/os/missions.ts`

- Define mission structure
- Create "Get Connected" mission
- Mission tracking UI

### Step 5: Node Browser

**File**: `src/components/desktop/NodeWindow.tsx`

- Node list view
- Node detail view (basic)
- Node selection

### Step 6: Terminal Integration

**File**: `src/components/desktop/DesktopTerminal.tsx`

- Extend SafeMode terminal
- Add new commands
- Command history and autocomplete

---

## Summary

This refined design focuses on:

1. **Real but Abstracted**: Authentic concepts, simplified implementation
2. **Discovery-based Learning**: No tutorials, learn by doing
3. **Progressive Complexity**: Start simple, add layers gradually
4. **Feel Smart & Powerful**: Discovery, understanding, optimization, mastery
5. **Feel Vulnerable**: Consequences matter (log cleaning, detection)
6. **Authentic Vibe**: Underground rogue hacker, retro-futuristic
7. **One Optimal Path**: Clear objectives, but advanced players can skip steps

**First Mission**: "Get Connected" - Hack WiFi to get internet. Simple, meaningful, teaches core mechanics.

**Start Implementation**: Desktop layout → Basic commands → Node system → First mission.

The design balances realism with accessibility, making players feel smart and powerful while keeping the experience authentic and engaging.
