// textDisplay.js
import { dialogueTextElement, nextButton, clearChoices, updateNextButton } from './ui.js';
import { playTextSound } from './dialogueAudio.js';

let typeInterval;
let isTyping = false;
const TYPING_SPEED = 8; // ms per character - adjust as needed

/**
 * Displays text character by character with a typewriter effect, parsing <b>, <i>, and <censor> tags.
 * @param {string} text - The text to display, potentially containing <b>, <i>, and <censor> tags.
 * @param {function} onFinished - Callback function executed when typing is complete.
 */
export function typeWriter(text, onFinished) {
    clearTimeout(typeInterval); // Clear any existing typing interval
    dialogueTextElement.innerHTML = ''; // Clear previous text using innerHTML
    updateNextButton(true, true); // Show Next button, disabled during typing
    clearChoices(); // Ensure choices are hidden when new text starts typing
    isTyping = true;
    let charIndex = 0;
    let currentHTML = ''; // Build the HTML string progressively

    function typeChar() {
        if (charIndex < text.length) {
            const currentChar = text[charIndex];

            // Check for the start of a tag
            if (currentChar === '<' && (text.substring(charIndex + 1, charIndex + 3) === 'b>' || text.substring(charIndex + 1, charIndex + 3) === 'i>' || text.substring(charIndex + 1, charIndex + 4) === '/b>' || text.substring(charIndex + 1, charIndex + 4) === '/i>' || text.substring(charIndex + 1, charIndex + 8) === 'censor>' || text.substring(charIndex + 1, charIndex + 9) === '/censor>')) {
                // Find the closing >
                const endTagIndex = text.indexOf('>', charIndex);
                if (endTagIndex !== -1) {
                    // Append the whole tag at once
                    const tag = text.substring(charIndex, endTagIndex + 1);
                    currentHTML += tag;
                    dialogueTextElement.innerHTML = currentHTML; // Update display
                    charIndex = endTagIndex + 1; // Move index past the tag

                    // Check if we just closed a censor tag
                    if (tag === '</censor>') {
                        // Apply censor effect immediately to the just-closed censor element
                        applyCensorEffectImmediate();
                    }
                } else {
                    // Malformed tag or something else, treat as plain text (or handle error)
                    currentHTML += currentChar;
                    dialogueTextElement.innerHTML = currentHTML;
                    charIndex++;
                }
            } else {
                // Regular character, append it
                currentHTML += currentChar;
                dialogueTextElement.innerHTML = currentHTML; // Update display
                charIndex++;

                // Play text sound for visible characters (not spaces)
                if (currentChar !== ' ' && currentChar !== '\n') {
                    playTextSound();
                }
            }

            // Schedule next character
            typeInterval = setTimeout(typeChar, TYPING_SPEED);

        } else {
            // Typing finished
            isTyping = false;
            updateNextButton(true, false); // Enable Next button when typing finishes

            // Apply censor effect to any remaining <censor> tags (fallback)
            applyCensorEffect();

            if (onFinished) {
                onFinished(); // Execute the callback
            }
        }
    }

    typeChar(); // Start the typing process
}

/**
 * Immediately displays the full text, parsing <b>, <i>, and <censor> tags, and calls the finished callback.
 * @param {string} text - The text to display, potentially containing <b>, <i>, and <censor> tags.
 * @param {function} onFinished - Callback function executed immediately after showing text.
 */
export function showFullText(text, onFinished) {
    clearTimeout(typeInterval); // Stop typing if in progress
    dialogueTextElement.innerHTML = text; // Display full text using innerHTML
    isTyping = false;
    updateNextButton(true, false); // Ensure Next button is shown and enabled

    // Apply censor effect to any <censor> tags
    applyCensorEffect();

    if (onFinished) {
        onFinished(); // Execute the callback
    }
}

/**
 * Applies censor effect immediately to the most recently closed censor tag.
 */
function applyCensorEffectImmediate() {
    const censorElements = dialogueTextElement.querySelectorAll('censor:not(.censor-text)');

    // Get the last uncensored element (the one we just closed)
    if (censorElements.length > 0) {
        const lastElement = censorElements[censorElements.length - 1];
        lastElement.classList.add('censor-text');

        // Add scribble effect after 200ms
        setTimeout(() => {
            lastElement.classList.add('censored');
        }, 200);
    }
}

/**
 * Applies censor effect to all <censor> elements by adding scribble overlay after a delay.
 */
function applyCensorEffect() {
    const censorElements = dialogueTextElement.querySelectorAll('censor:not(.censored)');

    censorElements.forEach((element) => {
        // Add the censor class to style it if not already present
        if (!element.classList.contains('censor-text')) {
            element.classList.add('censor-text');
        }

        // Add scribble effect after a short delay (200ms)
        setTimeout(() => {
            element.classList.add('censored');
        }, 200);
    });
}

/**
 * Returns whether the typewriter is currently active.
 * @returns {boolean}
 */
export function isCurrentlyTyping() {
    return isTyping;
}