// bombGameAudio.js - Audio management for bomb game

let softsongAudio = null;
let fireburnAudio = null;
let softsongAudioContext = null;
let fireburnAudioContext = null;
let softsongSource = null;
let fireburnSource = null;
let softsongDistortionNode = null;
let fireburnGainNode = null;

/**
 * Initializes and starts playing the softsong music
 */
export function startSoftsong() {
    try {
        // Create audio element
        softsongAudio = new Audio('./media/softsong.mp3');
        softsongAudio.loop = true;
        softsongAudio.volume = 0.5;

        // Create Web Audio API context for distortion effects
        softsongAudioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create source from audio element
        softsongSource = softsongAudioContext.createMediaElementSource(softsongAudio);

        // Create distortion node (waveshaper)
        softsongDistortionNode = softsongAudioContext.createWaveShaper();
        softsongDistortionNode.curve = makeDistortionCurve(0); // Start with no distortion
        softsongDistortionNode.oversample = '4x';

        // Connect: source -> distortion -> destination
        softsongSource.connect(softsongDistortionNode);
        softsongDistortionNode.connect(softsongAudioContext.destination);

        // Play
        softsongAudio.play().catch(e => console.warn('Softsong autoplay blocked:', e));
    } catch (e) {
        console.error('Failed to start softsong:', e);
    }
}

/**
 * Starts playing fireburn ambient sound
 */
export function startFireburn() {
    try {
        // Create audio element
        fireburnAudio = new Audio('./media/fireburn.ogg');
        fireburnAudio.loop = true;

        // Create Web Audio API context for volume control
        if (!fireburnAudioContext) {
            fireburnAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create source from audio element
        fireburnSource = fireburnAudioContext.createMediaElementSource(fireburnAudio);

        // Create gain node for volume control
        fireburnGainNode = fireburnAudioContext.createGain();
        fireburnGainNode.gain.value = 0.05; // Start at low volume

        // Connect: source -> gain -> destination
        fireburnSource.connect(fireburnGainNode);
        fireburnGainNode.connect(fireburnAudioContext.destination);

        // Play
        fireburnAudio.play().catch(e => console.warn('Fireburn autoplay blocked:', e));
    } catch (e) {
        console.error('Failed to start fireburn:', e);
    }
}

/**
 * Applies very slight distortion to softsong (for level 5-8)
 * Gradually transitions over 2 seconds for smooth audio change
 */
export function applySlightDistortion() {
    if (softsongDistortionNode) {
        // Gradually interpolate distortion curve for smooth transition
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(1), 0);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(2), 400);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(3), 800);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(4), 1200);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(5), 1600);
    }
}

/**
 * Applies more distortion to softsong (for level 9-12)
 * Gradually transitions over 2 seconds for smooth audio change
 */
export function applyMediumDistortion() {
    if (softsongDistortionNode) {
        // Gradually interpolate distortion curve for smooth transition
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(6), 0);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(8), 400);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(10), 800);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(11), 1200);
        setTimeout(() => softsongDistortionNode.curve = makeDistortionCurve(12), 1600);
    }
}

/**
 * Increases fireburn volume slightly with smooth ramp over 2 seconds
 */
export function increaseFireburnVolume() {
    if (fireburnGainNode && fireburnAudioContext) {
        // Smooth volume ramp over 2 seconds
        const currentTime = fireburnAudioContext.currentTime;
        fireburnGainNode.gain.setValueAtTime(fireburnGainNode.gain.value, currentTime);
        fireburnGainNode.gain.linearRampToValueAtTime(0.10, currentTime + 2.0);
    }
}

/**
 * Stops softsong music
 */
export function stopSoftsong() {
    if (softsongAudio) {
        softsongAudio.pause();
        softsongAudio.currentTime = 0;
    }
}

/**
 * Stops fireburn ambient sound
 */
export function stopFireburn() {
    if (fireburnAudio) {
        fireburnAudio.pause();
        fireburnAudio.currentTime = 0;
    }
}

/**
 * Stops all bomb game audio
 */
export function stopAllBombGameAudio() {
    stopSoftsong();
    stopFireburn();

    // Clean up audio contexts
    if (softsongAudioContext) {
        softsongAudioContext.close().catch(() => {});
        softsongAudioContext = null;
    }
    if (fireburnAudioContext) {
        fireburnAudioContext.close().catch(() => {});
        fireburnAudioContext = null;
    }
}

/**
 * Creates a distortion curve for the WaveShaper
 * @param {number} amount - Distortion amount (0-100)
 */
function makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        // Very subtle distortion formula
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
}
