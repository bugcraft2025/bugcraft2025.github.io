// main.js
import { nextButton } from './ui.js';
import { initializeDialogue, handleNextClick } from './dialogueManager.js';
import { ensureAmbienceIsPlaying } from './dialogueAudio.js';

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const startKey = window.__DIALOGUE_START_KEY || params.get('start') || 'start';

    // Initialize the dialogue system
    initializeDialogue(startKey);

    // Set up the main interaction listener for the 'Next' button
    nextButton.addEventListener('click', () => {
        // Ensure ambience starts on first user interaction
        ensureAmbienceIsPlaying();

        // Delegate the click handling to the dialogue manager
        handleNextClick();
    });

    console.log("Dialogue system initialized.");
});
