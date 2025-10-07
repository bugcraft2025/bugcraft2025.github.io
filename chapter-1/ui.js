// ui.js

// Get references to UI elements needed by multiple modules
export const dialogueTextElement = document.getElementById('dialogue-text');
export const nextButton = document.getElementById('next-button');
export const choiceContainer = document.getElementById('choice-container');
export const clockContainer = document.getElementById('clock-container');
export const dialogueBox = document.getElementById('dialogue-box'); // Export the main box

/**
 * Clears the choice buttons from the container.
 */
export function clearChoices() {
    choiceContainer.innerHTML = '';
    // Set a minimum height to prevent layout jumps when choices disappear
    choiceContainer.style.minHeight = '50px';
}

/**
 * Displays choice buttons based on the provided choices array, parsing HTML tags in text.
 * @param {Array<object>} choices - Array of choice objects { text: string, nextCheckpoint: string }
 * @param {function} onChoiceSelected - Callback function when a choice is clicked, passes the nextCheckpoint key.
 */
export function showChoices(choices, onChoiceSelected) {
    clearChoices();
    choiceContainer.style.minHeight = ''; // Remove min height when choices are present
    nextButton.style.display = 'none'; // Hide next button when choices are shown

    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        // Use innerHTML to render potential <b> and <i> tags
        button.innerHTML = choice.text;
        button.classList.add('choice-button');
        // Staggered animation for appearing choices
        button.style.animationDelay = `${index * 0.15}s`;
        button.addEventListener('click', () => {
            // Prevent default button behavior if any (though unlikely needed here)
            // event.preventDefault();
            onChoiceSelected(choice.nextCheckpoint);
        });
        choiceContainer.appendChild(button);
    });
}

/**
 * Updates the visibility and state of the Next button.
 * @param {boolean} show - Whether to show the button.
 * @param {boolean} [disabled=false] - Whether the button should be disabled.
 */
export function updateNextButton(show, disabled = false) {
    nextButton.style.display = show ? 'block' : 'none';
    if (disabled) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.classList.remove('disabled');
    }
}


/**
 * Triggers the escape animation for the dialogue box and launches the popup window.
 * @param {object} breakData - Configuration object coming from the dialogue flow.
 */
export function triggerDialogueBreak(breakData = {}) {
    if (!dialogueBox) {
        console.error('Dialogue box element not found for escape sequence.');
        return;
    }

    const rect = dialogueBox.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const popupConfig = breakData.popupConfig || {};
    const permissionPrompt = popupConfig.permissionPrompt || 'The dialogue wants to escape into a new window. Allow pop-ups for this?';
    const blockedMessage = popupConfig.blockedMessage || 'Popup blocked - allow pop-ups to watch the dialogue escape for real.';
    const holeLabel = popupConfig.holeLabel || '-- The dialogue slipped away --';
    const windowTitle = popupConfig.windowTitle || document.title || 'Dialogue';
    const startCheckpoint = popupConfig.startCheckpoint || breakData.nextCheckpointAfterAction || 'start';

    // Prepare a floating clone to animate away from the page
    const floatingBox = dialogueBox.cloneNode(true);
    floatingBox.removeAttribute('id');
    floatingBox.classList.remove('dialogue-hole');
    floatingBox.querySelectorAll('.dialogue-hole-mask').forEach(mask => mask.remove());
    floatingBox.querySelectorAll('[id]').forEach(node => {
        const originalId = node.id;
        node.classList.add(`floating-id-${originalId}`);
        node.removeAttribute('id');
    });
    floatingBox.classList.add('dialogue-box-floating');
    floatingBox.style.top = `${rect.top + scrollY}px`;
    floatingBox.style.left = `${rect.left + scrollX}px`;
    floatingBox.style.width = `${rect.width}px`;
    floatingBox.style.height = `${rect.height}px`;
    floatingBox.style.boxSizing = 'border-box';
    floatingBox.setAttribute('aria-hidden', 'true');

    document.body.appendChild(floatingBox);

    // Show a hole where the dialogue box lived without destroying its structure
    let holeMask = dialogueBox.querySelector('.dialogue-hole-mask');
    if (!holeMask) {
        holeMask = document.createElement('div');
        holeMask.className = 'dialogue-hole-mask';
        dialogueBox.appendChild(holeMask);
    }
    holeMask.textContent = holeLabel;
    dialogueBox.classList.add('dialogue-hole');

    let escapedWindow = null;

    // Try to open popup directly - browser will request permanent permission if blocked
    try {
        escapedWindow = window.open('', 'dialogueEscape', 'width=540,height=420');
        if (!escapedWindow || escapedWindow.closed || typeof escapedWindow.closed === 'undefined') {
            console.warn('Popup was blocked by browser.');
            escapedWindow = null;
        }
    } catch (error) {
        console.warn('Unable to open popup:', error);
        escapedWindow = null;
    }

    // Start the escape animation on the next frame for smoothness
    requestAnimationFrame(() => {
        floatingBox.classList.add('escape');
    });

    const floatingCleanupDelay = 1600;
    setTimeout(() => {
        floatingBox.remove();
    }, floatingCleanupDelay);

    if (escapedWindow) {
        try {
            initializeEscapedWindow(escapedWindow, {
                windowTitle,
                startCheckpoint
            });
        } catch (error) {
            console.error('Failed to initialise escaped dialogue window:', error);
        }
    } else {
        console.info('Popup was blocked - showing hint to allow popups.');
        showPopupBlockedHint(blockedMessage);
    }
}

function initializeEscapedWindow(escapedWindow, config = {}) {
    const windowTitle = config.windowTitle || document.title || 'Dialogue';
    const startCheckpoint = config.startCheckpoint || 'start';
    const baseHref = new URL('./', document.baseURI).href;
    const popupMarkup = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(windowTitle)}</title>
    <base href="${escapeHtml(baseHref)}">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="filmEffect.css">
    <script>
        window.__DIALOGUE_START_KEY = ${JSON.stringify(startCheckpoint)};
    </script>
</head>
<body>
    <div id="dialogue-box">
        <div id="clock-container"></div>

        <div class="film-overlay">
            <div class="film-grain"></div>
            <div class="film-scratches"></div>
            <div class="flicker"></div>
            <div class="vignette"></div>
        </div>

        <div class="snake-overlay">
            <div class="snake-scales"></div>
        </div>

        <div class="dialogue-content">
            <p id="dialogue-text"></p>
        </div>
        <div id="choice-container"></div>
        <div id="navigation">
            <button id="next-button">&rarr;</button>
        </div>
    </div>

    <script type="module" src="script.js"></script>
    <script>
        (function() {
            const glideMoves = [
                { delay: 360, type: 'moveBy', args: [90, -120] },
                { delay: 1100, type: 'moveBy', args: [120, 60] },
                { delay: 2000, type: 'moveToCorner' }
            ];

            function tryMoveBy(dx, dy) {
                if (typeof window.moveBy === 'function') {
                    try { window.moveBy(dx, dy); } catch (err) { console.warn('moveBy blocked:', err); }
                }
            }

            function tryMoveTo(x, y) {
                if (typeof window.moveTo === 'function') {
                    try { window.moveTo(x, y); } catch (err) { console.warn('moveTo blocked:', err); }
                }
            }

            function moveToCorner() {
                const screenObj = window.screen || {};
                const availWidth = screenObj.availWidth || window.outerWidth || 480;
                const availHeight = screenObj.availHeight || window.outerHeight || 360;
                const availLeft = screenObj.availLeft || screenObj.left || 0;
                const availTop = screenObj.availTop || screenObj.top || 0;
                const width = window.outerWidth || window.innerWidth;
                const height = window.outerHeight || window.innerHeight;
                const targetX = Math.max(availLeft, availLeft + availWidth - width);
                const targetY = Math.max(availTop, availTop);
                tryMoveTo(targetX, targetY);
            }

            window.addEventListener('load', () => {
                glideMoves.forEach(move => {
                    setTimeout(() => {
                        if (move.type === 'moveBy') {
                            tryMoveBy(...move.args);
                        } else if (move.type === 'moveToCorner') {
                            moveToCorner();
                        }
                    }, move.delay);
                });
            });
        })();
    </script>
</body>
</html>`;

    escapedWindow.document.open();
    escapedWindow.document.write(popupMarkup);
    escapedWindow.document.close();
    try {
        escapedWindow.focus();
    } catch (error) {
        console.warn('Unable to focus escaped window:', error);
    }
}

function showPopupBlockedHint(message) {
    const blocker = document.createElement('div');
    blocker.className = 'popup-blocked-hint';
    blocker.textContent = message;
    document.body.appendChild(blocker);

    setTimeout(() => {
        blocker.classList.add('visible');
    }, 20);

    setTimeout(() => {
        blocker.classList.remove('visible');
        setTimeout(() => blocker.remove(), 400);
    }, 3200);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Creates a white screen transition and navigates to the specified URL.
 * @param {string} targetUrl - The URL to navigate to after the transition.
 */
