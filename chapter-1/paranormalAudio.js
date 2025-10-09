// paranormalAudio.js - Audio management for paranormal game

let horrorAmbienceAudio = null;
let rope1Audio = null;
let rope2Audio = null;
let glassBreakAudio = null;
let disgustingPitchAudio = null;
let lightOpenAudio = null;
let lightCloseAudio = null;
let curtainOpenAudio = null;
let curtainCloseAudio = null;
let radarBeepAudio = null;

/**
 * Initializes the paranormal game audio
 */
export function initializeParanormalAudio() {
    // Create horror ambience
    if (!horrorAmbienceAudio) {
        horrorAmbienceAudio = new Audio('./media/horrorambience.mp3');
        horrorAmbienceAudio.loop = true;
        horrorAmbienceAudio.volume = 0.4;
    }

    // Create rope sound effects (pre-load)
    rope1Audio = new Audio('./media/rope1.wav');
    rope1Audio.volume = 0.6;
    rope1Audio.preload = 'auto';

    rope2Audio = new Audio('./media/rope2.wav');
    rope2Audio.volume = 0.7;
    rope2Audio.preload = 'auto';

    glassBreakAudio = new Audio('./media/glassbreak.wav');
    glassBreakAudio.volume = 0.5;
    glassBreakAudio.preload = 'auto';

    disgustingPitchAudio = new Audio('./media/disgusting_pitch.wav');
    disgustingPitchAudio.volume = 0.8;
    disgustingPitchAudio.preload = 'auto';

    lightOpenAudio = new Audio('./media/lightopen.wav');
    lightOpenAudio.volume = 0.6;
    lightOpenAudio.preload = 'auto';

    lightCloseAudio = new Audio('./media/lightclose.wav');
    lightCloseAudio.volume = 0.6;
    lightCloseAudio.preload = 'auto';

    curtainOpenAudio = new Audio('./media/curtainopen.wav');
    curtainOpenAudio.volume = 0.7;
    curtainOpenAudio.preload = 'auto';

    curtainCloseAudio = new Audio('./media/curtainclose.wav');
    curtainCloseAudio.volume = 0.7;
    curtainCloseAudio.preload = 'auto';

    radarBeepAudio = new Audio('./media/radarbeep.wav');
    radarBeepAudio.volume = 0.5;
    radarBeepAudio.preload = 'auto';
}

/**
 * Starts playing the horror ambience
 */
export function startHorrorAmbience() {
    try {
        if (horrorAmbienceAudio) {
            horrorAmbienceAudio.currentTime = 0;
            horrorAmbienceAudio.play().catch(e => {
                console.warn('Horror ambience autoplay blocked (will start on user interaction):', e);
            });
        }
    } catch (e) {
        console.error('Failed to start horror ambience:', e);
    }
}

/**
 * Stops the horror ambience
 */
export function stopHorrorAmbience() {
    if (horrorAmbienceAudio) {
        horrorAmbienceAudio.pause();
        horrorAmbienceAudio.currentTime = 0;
    }
}

/**
 * Plays rope1 sound (when an eye stitch is removed)
 */
export function playRope1Sound() {
    try {
        if (rope1Audio) {
            rope1Audio.currentTime = 0;
            rope1Audio.play().catch(e => {
                console.warn('Rope1 sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play rope1 sound:', e);
    }
}

/**
 * Plays rope2 sound (when the last eye stitch is removed)
 */
export function playRope2Sound() {
    try {
        if (rope2Audio) {
            rope2Audio.currentTime = 0;
            rope2Audio.play().catch(e => {
                console.warn('Rope2 sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play rope2 sound:', e);
    }
}

/**
 * Plays glass break sound
 */
export function playGlassBreakSound() {
    try {
        if (glassBreakAudio) {
            glassBreakAudio.currentTime = 0;
            glassBreakAudio.play().catch(e => {
                console.warn('Glass break sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play glass break sound:', e);
    }
}

/**
 * Plays disgusting pitch sound (for failed eye defense)
 */
export function playDisgustingPitchSound() {
    try {
        if (disgustingPitchAudio) {
            disgustingPitchAudio.currentTime = 0;
            disgustingPitchAudio.play().catch(e => {
                console.warn('Disgusting pitch sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play disgusting pitch sound:', e);
    }
}

/**
 * Plays light open sound (flashlight turned on)
 */
export function playLightOpenSound() {
    try {
        if (lightOpenAudio) {
            lightOpenAudio.currentTime = 0;
            lightOpenAudio.play().catch(e => {
                console.warn('Light open sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play light open sound:', e);
    }
}

/**
 * Plays light close sound (flashlight turned off)
 */
export function playLightCloseSound() {
    try {
        if (lightCloseAudio) {
            lightCloseAudio.currentTime = 0;
            lightCloseAudio.play().catch(e => {
                console.warn('Light close sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play light close sound:', e);
    }
}

/**
 * Plays curtain open sound (curtain opening)
 */
export function playCurtainOpenSound() {
    try {
        if (curtainOpenAudio) {
            curtainOpenAudio.currentTime = 0;
            curtainOpenAudio.play().catch(e => {
                console.warn('Curtain open sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play curtain open sound:', e);
    }
}

/**
 * Plays curtain close sound (curtain closing)
 */
export function playCurtainCloseSound() {
    try {
        if (curtainCloseAudio) {
            curtainCloseAudio.currentTime = 0;
            curtainCloseAudio.play().catch(e => {
                console.warn('Curtain close sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play curtain close sound:', e);
    }
}

/**
 * Plays radar beep sound (scanner scan action)
 */
export function playRadarBeepSound() {
    try {
        if (radarBeepAudio) {
            radarBeepAudio.currentTime = 0;
            radarBeepAudio.play().catch(e => {
                console.warn('Radar beep sound blocked:', e);
            });
        }
    } catch (e) {
        console.error('Failed to play radar beep sound:', e);
    }
}

/**
 * Cleans up paranormal audio resources
 */
export function cleanupParanormalAudio() {
    stopHorrorAmbience();

    if (horrorAmbienceAudio) {
        horrorAmbienceAudio = null;
    }
    if (rope1Audio) {
        rope1Audio = null;
    }
    if (rope2Audio) {
        rope2Audio = null;
    }
    if (glassBreakAudio) {
        glassBreakAudio = null;
    }
    if (disgustingPitchAudio) {
        disgustingPitchAudio = null;
    }
    if (lightOpenAudio) {
        lightOpenAudio = null;
    }
    if (lightCloseAudio) {
        lightCloseAudio = null;
    }
    if (curtainOpenAudio) {
        curtainOpenAudio = null;
    }
    if (curtainCloseAudio) {
        curtainCloseAudio = null;
    }
    if (radarBeepAudio) {
        radarBeepAudio = null;
    }
}
