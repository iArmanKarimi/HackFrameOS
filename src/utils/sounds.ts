// Sound effects using Web Audio API for better volume control
// This provides much better volume control than zzfx

let audioContext: AudioContext | null = null;
let audioInitialized = false;

// Initialize audio context on first user interaction
const initAudio = async (): Promise<void> => {
	if (audioInitialized && audioContext) {
		return;
	}

	try {
		audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		if (audioContext.state === "suspended") {
			await audioContext.resume();
		}
		audioInitialized = true;
	} catch (error) {
		// Audio context initialization failed - silent failure
	}
};

// Export function to initialize audio on first user interaction
export const initAudioOnInteraction = async (): Promise<void> => {
	if (!audioInitialized) {
		await initAudio();
	}
};

// Check if audio is ready
const canPlaySound = (): boolean => {
	return audioInitialized && audioContext !== null && audioContext.state === "running";
};

// Generate a simple beep sound
const playBeep = (
	frequency: number,
	duration: number,
	volume: number = 0.5,
	type: OscillatorType = "sine"
): void => {
	if (!canPlaySound() || !audioContext) return;

	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);

	oscillator.frequency.value = frequency;
	oscillator.type = type;

	// Set volume (0.0 to 1.0, but we'll use higher values for louder sounds)
	gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

	oscillator.start(audioContext.currentTime);
	oscillator.stop(audioContext.currentTime + duration);
};

// Generate a click/tap sound
const playClick = (volume: number = 0.3): void => {
	if (!canPlaySound() || !audioContext) return;

	const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.01, audioContext.sampleRate);
	const data = buffer.getChannelData(0);

	// Generate a short click sound
	for (let i = 0; i < buffer.length; i++) {
		data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioContext.sampleRate * 0.001));
	}

	const source = audioContext.createBufferSource();
	const gainNode = audioContext.createGain();

	source.buffer = buffer;
	gainNode.gain.value = volume;

	source.connect(gainNode);
	gainNode.connect(audioContext.destination);

	source.start();
};

// Sound effect presets for HackFrameOS - standardized volumes
export const sounds = {
	// Keypress sound (terminal typing)
	keypress: () => {
		playClick(0.3); // 30% volume
	},

	// Error sound (command not found, etc.)
	error: () => {
		playBeep(200, 0.15, 0.4, "sawtooth"); // Lower volume
		setTimeout(() => {
			playBeep(150, 0.1, 0.4, "sawtooth");
		}, 50);
	},

	// Success sound (module loaded, command succeeded)
	success: () => {
		playBeep(600, 0.1, 0.4, "sine");
		setTimeout(() => {
			playBeep(800, 0.1, 0.4, "sine");
		}, 80);
	},

	// Boot chime (when boot sequence completes)
	bootChime: () => {
		playBeep(523, 0.2, 0.4, "sine"); // C note
		setTimeout(() => {
			playBeep(659, 0.2, 0.4, "sine"); // E note
		}, 150);
	},

	// Subtle beep for boot log lines
	bootLine: () => {
		playBeep(100, 0.02, 0.2, "sine");
	},
};

// Throttle function to prevent too many sounds
let lastKeypressTime = 0;
const KEYPRESS_THROTTLE_MS = 50;

export const playKeypress = () => {
	const now = Date.now();
	if (now - lastKeypressTime > KEYPRESS_THROTTLE_MS) {
		sounds.keypress();
		lastKeypressTime = now;
	}
};
