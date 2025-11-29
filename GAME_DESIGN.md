# HackFrameOS - Complete Game Design Document

## Part 1: SafeMode (Tutorial/Intro) - COMPLETE

**Status**: Already implemented and working. This is the onboarding/tutorial phase.

**Purpose**: Teach players the core mechanics through OS rehabilitation.

**Flow**: GRUB → Boot Sequence → SafeMode Terminal → Desktop

**What it teaches**:

- Terminal commands (`help`, `status`, `load`, `fragment`)
- System module dependencies
- Mission-based progression
- Basic networking (`wifi scan`, `wifi crack`, `wifi connect`)
- Filesystem exploration (`fs ls`, `fs cat`)

**Transition**: When `startx` is executed after completing all critical tasks, the game transitions to the Desktop environment.

---

## Part 2: Main Game - Desktop Environment

### Core Gameplay Loop

```
1. Discover Nodes (via wifi scan / network discovery)
2. Select Target Node (from node browser)
3. Scan & Analyze (ports, firewall, security)
4. Crack & Infiltrate (use tools, bypass defenses)
5. Extract Data (files, credentials, intel)
6. Complete Mission Objectives
7. Progress to Next Mission/Node
```

### Narrative Framework

**Setting**: You are a freelance operator using HackFrameOS. After rehabilitating your system in SafeMode, you're ready for operations.

**Mission Structure**:

- **Tutorial Mission** (SafeMode completion): "System Rehabilitation"
- **Mission 1**: "First Contact" - Crack a simple node, extract a file
- **Mission 2**: "Network Expansion" - Discover and crack multiple nodes
- **Mission 3**: "Deep Infiltration" - Multi-step operation with firewall bypass
- **Mission 4+**: Progressive difficulty with new mechanics

**Story Elements**:

- Mission briefs appear in `/var/log/missions.log`
- Each node has a backstory (corporate server, personal device, etc.)
- Files contain narrative fragments
- Completion unlocks new mission types

---

## Part 3: Core Systems Design

### 3.1 Node System

**Node Types**:

```
- Router/Gateway (low security, entry point)
- Personal Device (medium security, personal data)
- Corporate Server (high security, valuable data)
- Research Lab (very high security, unique tools)
- Government (extreme security, story-critical)
```

**Node Properties**:

```typescript
interface Node {
  id: string;
  name: string;
  ip: string;
  securityLevel: 1-10;
  ports: Port[];
  firewall: Firewall;
  filesystem: FileSystem;
  discovered: boolean;
  cracked: boolean;
  connected: boolean;
  signalStrength: number;
  encryption: EncryptionType;
  os: NodeOS;
  lastSeen: timestamp;
}
```

**Discovery Mechanics**:

- `wifi scan` reveals nearby access points (nodes)
- `netdiscover` finds nodes on connected network
- Nodes appear in Node Browser panel
- Signal strength affects discovery chance
- Some nodes require specific tools to discover

### 3.2 Port & Firewall System

**Ports**:

```typescript
interface Port {
	number: number;
	protocol: "tcp" | "udp";
	status: "open" | "closed" | "filtered";
	service: string; // 'ssh', 'http', 'ftp', etc.
	version: string;
	requiresTool: string | null; // tool needed to exploit
}
```

**Port Scanning**:

- `scan [node-id]` - Basic port scan (shows open ports)
- `scan -a [node-id]` - Aggressive scan (more info, slower, may alert)
- `scan -s [node-id]` - Stealth scan (slower, less detectable)
- Scanning takes time (progress bar in terminal)
- Some ports only visible after cracking

**Firewall System**:

```typescript
interface Firewall {
	active: boolean;
	rules: FirewallRule[];
	bypassProgress: number; // 0-100
	bypassMethod: "none" | "port" | "tool" | "exploit";
}
```

**Firewall Bypass**:

- **Port-based**: Open specific ports to bypass
- **Tool-based**: Use `FirewallBypass.exe` tool
- **Exploit-based**: Use discovered vulnerabilities
- **Time-based**: Some firewalls have patterns
- Progress shown in Target Node Window

### 3.3 Tool System

**Tool Categories**:

1. **Discovery Tools**:
   - `PortScanner.exe` - Scan ports
   - `NetDiscover.exe` - Find nodes
   - `SignalAnalyzer.exe` - Analyze signal strength

2. **Cracking Tools**:
   - `PasswordCracker.exe` - Crack passwords
   - `WifiCracker.exe` - Crack WiFi (already in SafeMode)
   - `EncryptionBreaker.exe` - Break encryption

3. **Infiltration Tools**:
   - `SSHClient.exe` - Connect via SSH
   - `FTPClient.exe` - Connect via FTP
   - `SQLInjection.exe` - SQL injection attacks
   - `XSSExploit.exe` - Cross-site scripting

4. **Defense Tools**:
   - `FirewallBypass.exe` - Bypass firewalls
   - `ProxyChain.exe` - Route through proxies
   - `StealthMode.exe` - Reduce detection

5. **Data Tools**:
   - `FileDownloader.exe` - Download files
   - `LogAnalyzer.exe` - Analyze logs
   - `DataExtractor.exe` - Extract structured data

**Tool Execution**:

- Tools stored in `/usr/bin/` (local) or discovered on nodes
- Execute via terminal: `tool.exe [args]`
- Tools consume RAM and CPU (shown in RAM visualization)
- Some tools require specific ports/services
- Tools have cooldowns/usage limits
- Visual effects in RAM panel during execution

**Tool Progression**:

- Start with basic tools
- Discover advanced tools on nodes
- Some tools require specific missions to unlock
- Tools can be upgraded (faster, more effective)

### 3.4 Filesystem System (Remote Nodes)

**Node Filesystem Structure**:

```
/node-[id]/
  /home/
    /user/
      documents/
      downloads/
      .ssh/
        id_rsa (private key - valuable!)
  /var/
    /log/
      access.log
      error.log
    /www/ (if web server)
      index.html
      config.php
  /etc/
    passwd (credentials)
    hosts
    config/
  /root/ (if cracked)
    secret.txt
    mission-data/
```

**File Types**:

- **Text Files**: `.txt`, `.log`, `.conf` - Readable directly
- **Code Files**: `.py`, `.js`, `.php` - May contain exploits
- **Data Files**: `.db`, `.json`, `.xml` - Structured data
- **Binary Files**: `.exe`, `.bin` - Tools or encrypted data
- **Credentials**: `.key`, `.pem`, `passwd` - Authentication data

**File Operations**:

- `cat [path]` - Read file contents
- `ls [path]` - List directory
- `download [path]` - Download to local filesystem
- `search [pattern]` - Search for files matching pattern
- `decrypt [file]` - Decrypt encrypted files (requires key/tool)

**File Discovery**:

- Files visible in Target Node Window filesystem tree
- Some files hidden (require `ls -a` or specific tools)
- Mission objectives often point to specific files
- Files may contain clues for other nodes

### 3.5 Mission System

**Mission Types**:

1. **Data Extraction**:
   - "Extract file X from node Y"
   - "Download all files from /var/www/"
   - "Find and extract credentials"

2. **Network Mapping**:
   - "Discover all nodes on network Z"
   - "Map the network topology"
   - "Find the gateway node"

3. **Infiltration**:
   - "Crack node X and maintain access"
   - "Bypass firewall on node Y"
   - "Extract data without detection"

4. **Tool Discovery**:
   - "Find and download ToolX.exe"
   - "Extract encryption keys"
   - "Acquire root access"

5. **Story Missions**:
   - Multi-step operations
   - Unlock new areas/networks
   - Reveal narrative elements

**Mission Structure**:

```typescript
interface Mission {
	id: string;
	title: string;
	description: string;
	objectives: Objective[];
	rewards: Reward[];
	difficulty: number;
	requiredNodes: string[];
	timeLimit?: number; // optional
	storyRelevant: boolean;
}
```

**Mission Progression**:

- Missions appear in `/var/log/missions.log`
- `mission list` - Show available missions
- `mission [id]` - Show mission details
- `mission accept [id]` - Start mission
- Objectives tracked in System Info Panel
- Completion unlocks next missions

### 3.6 RAM & Resource System

**RAM Visualization** (Hacknet-style):

- Grid-based memory blocks in System Info Panel
- Color-coded: Kernel (red), Processes (blue), Free (gray), Cached (yellow)
- Real-time updates as tools execute
- Visual effects during tool execution

**Resource Management**:

- Each tool consumes RAM
- Active connections use memory
- Too many tools = system slowdown
- `kill [process]` to free memory
- RAM affects tool execution speed

**Process System**:

- `ps` - List running processes
- System daemons always running
- Tools spawn processes
- `kill [pid]` - Terminate process
- Some processes critical (can't kill)

---

## Part 4: Desktop UI Design

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  System Info Panel (Top, 20% height)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ RAM Viz      │ │ Network      │ │ Mission     │      │
│  │              │ │ Status       │ │ Progress    │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Target Node Window (Left, 60% width)                   │
│  ┌──────────────────────────────────────────────┐       │
│  │ Node Browser / Node Details                  │       │
│  │                                               │       │
│  │ [Node List] or [Selected Node View]         │       │
│  │ - Ports                                       │       │
│  │ - Firewall                                    │       │
│  │ - Filesystem                                  │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  Terminal (Right, 40% width)                             │
│  ┌──────────────────────────────────────────────┐       │
│  │ > wifi scan                                   │       │
│  │ > scan node-01                                │       │
│  │ > tool.exe crack node-01                      │       │
│  │                                               │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 System Info Panel Components

**RAM Visualization**:

- Grid of memory blocks (CSS Grid or Canvas)
- Animated during tool execution
- Shows memory usage percentage
- Tooltip on hover shows process details
- Shader effects overlay during intensive operations

**Network Status**:

- Current connection status
- Connected nodes count
- Active connections list
- Bandwidth usage (visual)

**Mission Progress**:

- Current mission objectives
- Progress bars for each objective
- Completed missions list
- Next mission preview

**System Health**:

- Module status (from SafeMode)
- CPU usage
- Active processes count
- System alerts/warnings

### 4.3 Target Node Window

**Node Browser View** (when no target selected):

```
┌─────────────────────────────────────┐
│ Discovered Nodes                   │
├─────────────────────────────────────┤
│ [node-01] Corporate-Server-01       │
│   IP: 192.168.1.100                 │
│   Signal: 85% | Security: High     │
│   Status: [LOCKED] [ ]             │
│                                     │
│ [node-02] Personal-Laptop-User      │
│   IP: 192.168.1.105                 │
│   Signal: 42% | Security: Medium   │
│   Status: [CRACKED] [✓]            │
│                                     │
│ [node-03] Router-Gateway            │
│   IP: 192.168.1.1                  │
│   Signal: 98% | Security: Low      │
│   Status: [CONNECTED] [→]          │
└─────────────────────────────────────┘
```

**Node Detail View** (when target selected):

```
┌─────────────────────────────────────┐
│ Node: Corporate-Server-01           │
│ IP: 192.168.1.100                   │
│ Status: [LOCKED]                    │
├─────────────────────────────────────┤
│ Ports:                              │
│   [22] SSH    [OPEN]                │
│   [80] HTTP   [OPEN]                │
│   [443] HTTPS [FILTERED]            │
│   [3306] MySQL [CLOSED]             │
├─────────────────────────────────────┤
│ Firewall:                           │
│   Status: ACTIVE                    │
│   Bypass: [████░░░░] 40%            │
│   Method: Port-based                │
├─────────────────────────────────────┤
│ Filesystem: (locked until cracked)  │
│   /home/                            │
│   /var/www/                         │
│   /etc/                             │
└─────────────────────────────────────┘
```

### 4.4 Terminal Integration

**Desktop Terminal**:

- Compact version of SafeMode terminal
- All commands available
- Auto-complete still works
- History preserved
- Output scrolls independently
- Can be minimized/maximized

**Command Extensions**:

- `node list` - List discovered nodes
- `node select [id]` - Set target node
- `scan [node-id]` - Scan node ports
- `crack [node-id]` - Attempt to crack node
- `connect [node-id]` - Connect to cracked node
- `tool [tool-name] [args]` - Execute tool
- `download [remote-path]` - Download file from node
- `mission [command]` - Mission management

---

## Part 5: Progression & Balance

### 5.1 Difficulty Curve

**Early Game** (Missions 1-3):

- Simple nodes (1-3 security)
- Basic tools available
- Clear objectives
- Tutorial hints available

**Mid Game** (Missions 4-7):

- Medium nodes (4-6 security)
- New tools to discover
- Multi-step operations
- Firewall bypass required

**Late Game** (Missions 8+):

- High security nodes (7-9 security)
- Complex tool combinations
- Time-sensitive operations
- Story-critical missions

**End Game**:

- Extreme security (10)
- All tools available
- Complex network topologies
- Final story missions

### 5.2 Tool Balance

**Tool Effectiveness**:

- Basic tools: 60-70% success on low security
- Advanced tools: 80-90% success on medium security
- Expert tools: 70-80% success on high security (still challenging)

**Tool Requirements**:

- Some tools require specific ports open
- Some tools require other tools as prerequisites
- Some tools consume more RAM/CPU
- Cooldowns prevent spam

### 5.3 Node Generation

**Procedural Elements**:

- Node security levels based on mission difficulty
- Port configurations vary
- Firewall rules randomized (within constraints)
- Filesystem contents mission-relevant but varied

**Deterministic Elements**:

- Mission-critical nodes always have required files
- Story nodes have fixed configurations
- Tutorial nodes are hand-crafted

---

## Part 6: Technical Architecture

### 6.1 State Management

**Centralized State** (`src/os/game.ts`):

```typescript
interface GameState {
	nodes: Node[];
	selectedNodeId: string | null;
	missions: Mission[];
	activeMissionId: string | null;
	tools: Tool[];
	discoveredTools: string[];
	localFilesystem: FileSystem;
	connections: Connection[];
	ramUsage: RAMUsage;
}
```

**State Persistence**:

- Save game state to IndexedDB
- Auto-save after major actions
- Manual save via `save` command
- Load game on startup

### 6.2 Command System Extension

**New Command Handlers** (`src/os/game/bin/`):

- `node.ts` - Node management commands
- `scan.ts` - Port scanning
- `crack.ts` - Node cracking
- `tool.ts` - Tool execution
- `mission.ts` - Mission management
- `download.ts` - File operations

**Command Router** (`src/components/desktop/DesktopTerminal.tsx`):

- Routes commands to appropriate handlers
- Maintains command history
- Auto-complete for new commands

### 6.3 Visual Effects System

**RAM Visualization**:

- Start with CSS Grid (simple)
- Upgrade to Canvas/WebGL for effects
- Use Three.js for shader effects
- Particle systems for tool execution

**Shader Effects** (when tools execute):

- Polygon-based program blocks
- Noise-based distortions
- Particle flows
- Color shifts and glows
- Procedural animations

**Implementation Phases**:

1. Phase 1: CSS Grid RAM visualization
2. Phase 2: Canvas-based effects
3. Phase 3: WebGL shaders (Three.js)

---

## Part 7: Design Decisions & Solutions

### Dilemma 1: Terminal vs GUI

**Solution**: Hybrid approach

- Terminal for all actions (authentic, powerful)
- GUI for visualization (RAM, nodes, progress)
- Best of both worlds

### Dilemma 2: Realism vs Fun

**Solution**: Simulated but authentic

- All operations simulated (no real hacking)
- Realistic commands and outputs
- Gameplay-focused balance (not 100% realistic)

### Dilemma 3: Linear vs Open World

**Solution**: Mission-based with exploration

- Missions provide structure
- Nodes can be explored freely
- Optional side objectives
- Story missions are linear, exploration is open

### Dilemma 4: Difficulty vs Accessibility

**Solution**: Progressive difficulty with hints

- SafeMode teaches basics
- Early missions are tutorial-like
- Hints available but not required
- Optional difficulty settings

### Dilemma 5: Visual Complexity vs Performance

**Solution**: Phased implementation

- Start simple (CSS)
- Add effects incrementally
- Performance monitoring
- Options to disable effects

### Dilemma 6: Tool Variety vs Balance

**Solution**: Categorized tools with clear purposes

- Each tool has specific use case
- Tools complement each other
- Some tools are upgrades of others
- Mission design guides tool usage

---

## Part 8: Implementation Roadmap

### Phase 1: Core Desktop (MVP)

- [ ] Desktop layout (3-panel)
- [ ] Node browser (basic list)
- [ ] Node detail view (ports, firewall, filesystem)
- [ ] Terminal integration
- [ ] Basic node discovery
- [ ] Port scanning
- [ ] Node cracking (simplified)

### Phase 2: Tool System

- [ ] Tool execution framework
- [ ] Basic tools (PortScanner, PasswordCracker)
- [ ] Tool effects on nodes
- [ ] RAM visualization (CSS Grid)
- [ ] Tool discovery mechanics

### Phase 3: Mission System

- [ ] Mission data structure
- [ ] Mission tracking
- [ ] Objective completion
- [ ] Mission rewards
- [ ] Mission progression

### Phase 4: Advanced Features

- [ ] Firewall bypass mechanics
- [ ] Advanced tools
- [ ] File operations on nodes
- [ ] Network topology
- [ ] Multi-node operations

### Phase 5: Polish & Effects

- [ ] RAM visualization effects (Canvas/WebGL)
- [ ] Shader effects for tools
- [ ] Sound design
- [ ] UI polish
- [ ] Performance optimization

---

## Part 9: Narrative Integration

### Story Delivery Methods

1. **Mission Briefs**: `/var/log/missions.log`
2. **Node Files**: Files on nodes contain story fragments
3. **System Logs**: `/var/log/hackframe.log` updates with story events
4. **Terminal Messages**: Special messages after key actions
5. **Desktop Notifications**: Pop-up messages for story events

### Story Themes

- **Corporate Espionage**: Infiltrate companies, extract data
- **Personal Stakes**: Some nodes belong to individuals
- **Mystery**: Uncover a larger conspiracy
- **Ethics**: Player choices affect narrative (optional)

---

## Part 10: Extensibility

### Modding Support (Future)

- JSON-based node definitions
- JSON-based mission definitions
- Custom tool definitions
- Scenario/map editor

### Content Expansion

- New mission packs
- New node types
- New tools
- New story arcs

---

## Summary

This design document separates SafeMode (tutorial/intro) from the main game (desktop hacking simulator). The main game builds on SafeMode concepts while introducing new mechanics like node discovery, port scanning, tool execution, and mission-based progression.

**Key Principles**:

1. **SafeMode is complete** - It's a tutorial that teaches core concepts
2. **Main game is separate** - Desktop environment with new mechanics
3. **Progressive complexity** - Start simple, add complexity gradually
4. **Authentic but simulated** - Realistic commands, simulated operations
5. **Hybrid UI** - Terminal for actions, GUI for visualization
6. **Mission-driven** - Structure with exploration freedom
7. **Extensible** - Easy to add new nodes, tools, missions

The design balances authenticity with gameplay, provides clear progression, maintains extensibility, and addresses common design dilemmas with practical solutions.
