// dialogueManager.js
import dialogueFlow from './dialogue_flow.js';
import { dialogueTextElement, showChoices, updateNextButton, clearChoices, dialogueBox, triggerDialogueBreak } from './ui.js';
import { typeWriter, showFullText, isCurrentlyTyping } from './textDisplay.js';
import { showAndAnimateClock, hideClock, isClockVisible } from './clock.js';
import { startBombGame } from './bombGameManager.js';
import { startParanormalGame } from './paranormalGameManager.js';
import { initializeDialogueAudio, stopDialogueAmbience, startDialogueAmbience } from './dialogueAudio.js';

let currentCheckpointKey = 'start';
let currentCheckpoint = null;
let currentTextIndex = 0;
let filmOverlay = null; // Add reference at module level
let snakeOverlay = null; // Snake overlay reference
let eyeEffectActive = false; // Eye effect state
let yellowScreenOverlay = null; // Yellow screen overlay reference
let yellowScreenActivationFrame = null; // Pending animation frame for yellow screen activation
let bombGameActive = false; // Track if bomb game is running
let paranormalGameActive = false; // Track if paranormal game is running

// --- Film Effect Helpers ---
function showFilmEffect() {
    if (filmOverlay) filmOverlay.classList.add('active');
}

function hideFilmEffect() {
    if (filmOverlay) filmOverlay.classList.remove('active');
}

function isFilmEffectVisible() {
    return filmOverlay && filmOverlay.classList.contains('active');
}
// --- End Film Effect Helpers ---

// --- Snake Effect Helpers ---
function spawnSnake() {
    if (snakeOverlay) snakeOverlay.classList.add('active');
}

function hideSnake() {
    if (snakeOverlay) snakeOverlay.classList.remove('active');
}
// --- End Snake Effect Helpers ---

// --- Eye Effect Helpers ---
function showEyeEffect() {
    eyeEffectActive = true;
    dialogueBox.classList.add('eye-effect');
}

function hideEyeEffect() {
    eyeEffectActive = false;
    dialogueBox.classList.remove('eye-effect');
}
// --- End Eye Effect Helpers ---

// --- Yellow Screen Helpers ---
function showYellowScreen() {
    if (!yellowScreenOverlay) {
        yellowScreenOverlay = document.createElement('div');
        yellowScreenOverlay.className = 'yellow-screen-overlay';
        document.body.appendChild(yellowScreenOverlay);
    }
    if (yellowScreenActivationFrame !== null) {
        cancelAnimationFrame(yellowScreenActivationFrame);
        yellowScreenActivationFrame = null;
    }

    yellowScreenOverlay.classList.remove('active');
    void yellowScreenOverlay.offsetWidth; // Force reflow so the transition restarts

    yellowScreenActivationFrame = requestAnimationFrame(() => {
        yellowScreenActivationFrame = null;
        yellowScreenOverlay?.classList.add('active');
    });
}

function hideYellowScreen() {
    if (yellowScreenActivationFrame !== null) {
        cancelAnimationFrame(yellowScreenActivationFrame);
        yellowScreenActivationFrame = null;
    }
    if (yellowScreenOverlay) {
        yellowScreenOverlay.classList.remove('active');
    }
}
// --- End Yellow Screen Helpers ---

// --- Bomb Game Helpers ---
function startBombGameSequence() {
    bombGameActive = true;

    // Stop dialogue ambience during game
    stopDialogueAmbience();

    // Callback when game completes
    const onGameComplete = (result) => {
        bombGameActive = false;

        // Restore the dialogue box UI to its original state
        restoreDialogueBoxUI();

        // Resume dialogue ambience
        startDialogueAmbience();

        // Proceed to appropriate checkpoint based on result
        if (result === 'success') {
            proceedToCheckpoint('bomb_game_success');
        } else {
            proceedToCheckpoint('bomb_game_failure');
        }
    };

    // Start the bomb game
    startBombGame(onGameComplete);
}

/**
 * Restores the dialogue box UI after the bomb game
 */
function restoreDialogueBoxUI() {
    // Get references to dialogue elements
    const dialogueText = document.getElementById('dialogue-text');
    const choiceContainer = document.getElementById('choice-container');
    const navigation = document.getElementById('navigation');
    const clockContainer = document.getElementById('clock-container');
    
    // Clear the bomb game content
    if (dialogueText) {
        dialogueText.innerHTML = '';
        dialogueText.className = ''; // Remove any bomb game specific classes
    }
    
    if (choiceContainer) {
        choiceContainer.innerHTML = '';
        choiceContainer.style.display = '';
        choiceContainer.style.minHeight = '';
    }
    
    if (navigation) {
        navigation.style.display = '';
    }
    
    if (clockContainer) {
        clockContainer.innerHTML = '';
    }
    
    // Remove any bomb game specific styles
    const bombGameStyles = document.getElementById('bomb-game-styles');
    if (bombGameStyles) {
        bombGameStyles.remove();
    }
}
// --- End Bomb Game Helpers ---

// --- Paranormal Game Helpers ---
function startParanormalGameSequence() {
    paranormalGameActive = true;

    // Stop dialogue ambience during game
    stopDialogueAmbience();

    // Callback when game completes
    const onGameComplete = (result) => {
        paranormalGameActive = false;

        // Restore the dialogue box UI to its original state
        restoreDialogueBoxUI();

        // Resume dialogue ambience
        startDialogueAmbience();

        // Proceed to appropriate checkpoint based on result
        if (result === 'success') {
            proceedToCheckpoint('paranormal_game_success');
        } else {
            proceedToCheckpoint('paranormal_game_failure');
        }
    };

    // Start the paranormal game
    startParanormalGame(onGameComplete);
}
// --- End Paranormal Game Helpers ---


// Initialize film overlay reference
function initializeFilmOverlay() {
    filmOverlay = document.querySelector('.film-overlay');
    if (!filmOverlay) {
        console.error('Film overlay element not found');
    }
    snakeOverlay = document.querySelector('.snake-overlay');
    if (!snakeOverlay) {
        console.error('Snake overlay element not found');
    }
}

/**
 * Determines the state of the UI (buttons, choices) after text display finishes.
 */
function handleDialogueEnd() {
    const isTextArray = Array.isArray(currentCheckpoint.text);
    // Check if it's the last piece of text in an array, or if it's just a single string
    const isLastTextSegment = !isTextArray || currentTextIndex >= currentCheckpoint.text.length - 1;

    // If this was the last text segment for this checkpoint...
    if (isLastTextSegment) {
        if (currentCheckpoint.choices && currentCheckpoint.choices.length > 0) {
            // If there are choices, show them (this hides the next button)
            showChoices(currentCheckpoint.choices, (nextKey) => {
                // Callback for when a choice is selected
                // No need to hide effects here, proceedToCheckpoint -> showDialogue handles it
                proceedToCheckpoint(nextKey);
            });
        } else if (shouldAdvanceAutomatically()) {
            // If no choices, but there's a next step (standard or after action)
            // The next button should already be enabled by typeWriter/showFullText.
            // It will handle the advance on the *next* click.
             updateNextButton(true, false); // Ensure it's visible and enabled
        } else {
            // If no choices and no next step, hide the next button (end of branch)
            updateNextButton(false);
        }
    } else {
        // If there's more text in the array, ensure Next button is shown and enabled
        updateNextButton(true, false);
    }

    // --- Removed film effect logic based on checkpoint key ---
}

/**
 * Checks if the current checkpoint leads to another one automatically (via nextCheckpoint or nextCheckpointAfterAction).
 * @returns {boolean}
 */
function shouldAdvanceAutomatically() {
     return Boolean(currentCheckpoint.nextCheckpoint || currentCheckpoint.nextCheckpointAfterAction);
}


/**
 * Displays the dialogue for a given checkpoint key.
 * @param {string} checkpointKey - The key in dialogueFlow to display.
 */
function showDialogue(checkpointKey) {
    // --- Check for Break Action FIRST ---
    // If the previous checkpoint triggered a break, we might not want to proceed normally.
    // For now, we'll allow dialogue to proceed *before* the break visual.
    // If the current checkpoint IS the break action:
    if (dialogueFlow[checkpointKey]?.specialAction === 'breakDialogueBox') {
        triggerDialogueBreak(dialogueFlow[checkpointKey]); // Call the function to start the visual break
        // Decide what happens next. Should it stop here? Hide buttons?
        updateNextButton(false); // Hide next button
        clearChoices(); // Clear choices

        return;
    }
    // --- End Break Action Check ---


    currentCheckpoint = dialogueFlow[checkpointKey];
    if (!currentCheckpoint) {
        console.error("Invalid checkpoint key:", checkpointKey);
        dialogueTextElement.textContent = "Error: Dialogue path broken.";
        updateNextButton(false);
        clearChoices();
        hideClock(); // Ensure effects are hidden on error
        hideFilmEffect();
        hideSnake();
        hideEyeEffect();
        hideYellowScreen();
        return;
    }

    currentCheckpointKey = checkpointKey; // Update the current key state
    currentTextIndex = 0;

    // --- Centralized Effect Handling ---
    // Hide effects by default, then enable the specific one if needed.
    hideClock();
    hideFilmEffect();
    hideSnake();
    hideEyeEffect();
    hideYellowScreen();

    if (currentCheckpoint.specialAction === 'showFilmEffect') {
        showFilmEffect(); // Activate film effect immediately for this checkpoint
    }
    if (currentCheckpoint.specialAction === 'yellowScreen') {
        showYellowScreen(); // Activate yellow screen immediately for this checkpoint
    }
    // Note: Clock, snake, and eye effects are shown later, after the first text segment types out or is skipped.
    // Break action is handled *before* setting text.
    // --- End Centralized Effect Handling ---

    // --- Text Handling (Check if currentCheckpoint exists and has text) ---
    if (!currentCheckpoint || currentCheckpoint.text === undefined || currentCheckpoint.text === null) {
        // If it's the break checkpoint, it might not have text, which is fine.
        // If it's another checkpoint and text is missing, log error.
        if (currentCheckpoint?.specialAction !== 'breakDialogueBox') {
            console.error("Text is undefined or null for checkpoint:", checkpointKey);
            dialogueTextElement.textContent = "Error: Dialogue content missing.";
        } else if (!dialogueTextElement.textContent) {
             // If it *was* the break action, but there was no prior text, clear the box
             dialogueTextElement.textContent = "";
        }
        updateNextButton(false);
        clearChoices();
        hideClock();
        hideFilmEffect();
        hideSnake();
        hideEyeEffect();
        hideYellowScreen();
        return; // Stop further processing if text is invalid or break occurred
    }
    // --- End Text Handling ---

    const textToShow = Array.isArray(currentCheckpoint.text)
        ? currentCheckpoint.text[currentTextIndex]
        : currentCheckpoint.text;

    if (textToShow === undefined || textToShow === null) {
        console.error("Text is undefined for checkpoint:", checkpointKey, "at index:", currentTextIndex);
        dialogueTextElement.textContent = "Error: Dialogue content missing.";
        updateNextButton(false);
        clearChoices();
        hideClock(); // Ensure effects are hidden on error
        hideFilmEffect();
        hideSnake();
        hideEyeEffect();
        hideYellowScreen();
        return;
    }

    // Start typing the text
    typeWriter(textToShow, () => {
        // Callback when typing finishes for the first time for this text segment
        handleDialogueEnd(); // Update UI based on dialogue state first

        // Check for Special Action AFTER text finishes typing/displaying
        // Only show effects on the first text segment of the relevant checkpoint
        if (currentTextIndex === 0) {
            if (currentCheckpoint.specialAction === 'showClock') {
                showAndAnimateClock();
            } else if (currentCheckpoint.specialAction === 'spawnSnake') {
                spawnSnake();
            } else if (currentCheckpoint.specialAction === 'eyeEffect') {
                showEyeEffect();
            } else if (currentCheckpoint.specialAction === 'startBombGame') {
                startBombGameSequence();
            } else if (currentCheckpoint.specialAction === 'startParanormalGame') {
                startParanormalGameSequence();
            }
        }
        // Film effect and yellow screen are handled when the checkpoint loads in showDialogue
    });
}

/**
 * Advances the dialogue state, either to the next text segment or the next checkpoint.
 */
export function handleNextClick() {
    const isTextArray = Array.isArray(currentCheckpoint.text);
    const isLastTextSegment = !isTextArray || currentTextIndex >= currentCheckpoint.text.length - 1;

    if (isCurrentlyTyping()) {
        // --- Skip typing animation ---
        const currentText = isTextArray
            ? currentCheckpoint.text[currentTextIndex]
            : currentCheckpoint.text;

        showFullText(currentText, () => {
            handleDialogueEnd(); // Update UI state

            // If we skipped typing on the first segment, show special effects now
            if (currentTextIndex === 0) {
                if (currentCheckpoint.specialAction === 'showClock' && !isClockVisible()) {
                    showAndAnimateClock();
                } else if (currentCheckpoint.specialAction === 'spawnSnake' && !snakeOverlay?.classList.contains('active')) {
                    spawnSnake();
                } else if (currentCheckpoint.specialAction === 'eyeEffect' && !eyeEffectActive) {
                    showEyeEffect();
                } else if (currentCheckpoint.specialAction === 'startBombGame' && !bombGameActive) {
                    startBombGameSequence();
                } else if (currentCheckpoint.specialAction === 'startParanormalGame' && !paranormalGameActive) {
                    startParanormalGameSequence();
                }
            }
            // Film effect and yellow screen are handled by showDialogue
        });
    } else {
        // --- Advance logic (not skipping typing) ---
        if (isTextArray && !isLastTextSegment) {
            // --- Advance to next text within the same checkpoint ---
            currentTextIndex++;
            const nextTextToShow = currentCheckpoint.text[currentTextIndex];
            // Start typing the next segment. `typeWriter` will call `handleDialogueEnd` on completion.
            typeWriter(nextTextToShow, handleDialogueEnd);
        } else {
             // --- Advance to the NEXT checkpoint ---
             // This happens if it's the last text segment (or single text) AND there are no choices displayed.
             let nextKey = null;

             // Determine the next key based on actions or standard flow
             // Special action (like clock) might have a specific next step
             if (currentCheckpoint.specialAction && currentCheckpoint.nextCheckpointAfterAction) {
                 nextKey = currentCheckpoint.nextCheckpointAfterAction;
             } else if (currentCheckpoint.nextCheckpoint) { // Standard next step
                 nextKey = currentCheckpoint.nextCheckpoint;
             }

             if (nextKey) {
                  // Proceed to the next checkpoint found
                  // No need to hide effects here, proceedToCheckpoint -> showDialogue handles it
                  proceedToCheckpoint(nextKey);
             } else {
                 // No next key and no choices were shown, likely end of a branch.
                 // handleDialogueEnd should have already hidden the button.
             }
        }
    }
}

/**
 * Central function to move to a new checkpoint.
 * @param {string} nextCheckpointKey
 */
function proceedToCheckpoint(nextCheckpointKey) {
    // Reset text index for the new checkpoint
    currentTextIndex = 0;
    // Call showDialogue to display the new checkpoint, which handles effects
    showDialogue(nextCheckpointKey);
}

// --- Removed hideClockIfNeeded function ---


/**
 * Initializes the dialogue system starting from the 'start' checkpoint.
 */
export function initializeDialogue(startKey = 'start') {
    initializeFilmOverlay(); // Initialize film overlay reference
    initializeDialogueAudio(); // Initialize dialogue audio (ambience + text sounds)
    showDialogue(startKey);
}
