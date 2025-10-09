// dialogueAudio.js - Audio management for dialogue system

let ambienceAudio = null;
let textSound = null;
let textSoundPool = []; // Pool of audio instances for rapid playback
const POOL_SIZE = 5; // Number of text sound instances
let ambienceStartPending = false; // Track if ambience needs to start on user interaction

/**
 * Initializes the text sound pool for rapid character typing sounds
 */
function initializeTextSoundPool() {
    for (let i = 0; i < POOL_SIZE; i++) {
        const sound = new Audio('./media/text-sound.mp3');
        sound.volume = 0.15; // Subtle volume
        sound.preload = 'auto';
        textSoundPool.push(sound);
    }
}

/**
 * Plays the text sound effect (used for each character typed)
 * Uses a pool system to allow rapid overlapping sounds
 */
export function playTextSound() {
    try {
        // If ambience is pending, try to start it now (user interaction detected)
        if (ambienceStartPending && ambienceAudio) {
            ambienceAudio.play().then(() => {
                ambienceStartPending = false;
            }).catch(e => {
                // Still blocked, will retry on next interaction
            });
        }

        // Find the first sound that's not currently playing
        let sound = textSoundPool.find(s => s.paused || s.ended);

        // If all sounds are playing, use the first one anyway (restart it)
        if (!sound) {
            sound = textSoundPool[0];
        }

        sound.currentTime = 0;
        sound.play().catch(e => {
            // Silently catch autoplay errors - expected on first interaction
        });
    } catch (e) {
        console.warn('Failed to play text sound:', e);
    }
}

/**
 * Starts playing the ambient audio for dialogue scenes
 */
export function startDialogueAmbience() {
    try {
        if (!ambienceAudio) {
            ambienceAudio = new Audio('./media/normalambience.mp3');
            ambienceAudio.loop = true;
            ambienceAudio.volume = 0.3; // Subtle background ambience
        }

        ambienceAudio.play().then(() => {
            // Audio started successfully
            ambienceStartPending = false;
        }).catch(e => {
            // Autoplay blocked - mark as pending to start on user interaction
            ambienceStartPending = true;
            console.warn('Ambience autoplay blocked (will start on user interaction):', e);
        });
    } catch (e) {
        console.error('Failed to start dialogue ambience:', e);
    }
}

/**
 * Stops the dialogue ambient audio
 */
export function stopDialogueAmbience() {
    if (ambienceAudio) {
        ambienceAudio.pause();
        ambienceAudio.currentTime = 0;
    }
}

/**
 * Initializes the dialogue audio system
 * Should be called when the dialogue system starts
 */
export function initializeDialogueAudio() {
    initializeTextSoundPool();
    startDialogueAmbience();
}

/**
 * Cleans up dialogue audio resources
 */
export function cleanupDialogueAudio() {
    stopDialogueAmbience();
    if (ambienceAudio) {
        ambienceAudio = null;
    }
    textSoundPool = [];
}

/**
 * Ensures ambience audio is playing (call on user interaction)
 * Useful for ensuring audio starts after browser autoplay restrictions
 */
export function ensureAmbienceIsPlaying() {
    if (ambienceStartPending && ambienceAudio) {
        ambienceAudio.play().then(() => {
            ambienceStartPending = false;
        }).catch(e => {
            // Still blocked, will retry later
        });
    }
}
