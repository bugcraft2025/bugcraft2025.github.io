// bombGameUI.js - UI management for bomb game windows

import { gameState, colorSchemes } from './bombGame.js';

let statusWindow = null;
let redWindow = null;
let blueWindow = null;

// Getters for window references
export function getStatusWindow() { return statusWindow; }
export function getRedWindow() { return redWindow; }
export function getBlueWindow() { return blueWindow; }

/**
 * Opens the game windows
 * Uses current window as status window (the escaped dialogue box)
 * Spawns red/blue windows from the main window (window.opener) to avoid popup blocking
 */
export function openGameWindows() {
    const sw = screen.width;
    const sh = screen.height;

    // Use the current window as the status window (the escaped dialogue box in top-right)
    statusWindow = window;

    // Spawn red and blue windows from the main window (opener) to avoid popup blocking
    const mainWindow = window.opener || window;

    // Red window - spawn from main window
    redWindow = mainWindow.open('', 'bombGameRed', `width=${sw*0.25},height=${sh*0.25},left=100,top=100`);

    // Blue window - spawn from main window
    blueWindow = mainWindow.open('', 'bombGameBlue', `width=${sw*0.25},height=${sh*0.25},left=${sw/2},top=100`);

    return true;
}

/**
 * Transforms the current dialogue box into the bomb game status window
 */
function transformDialogueToStatusWindow() {
    if (!statusWindow) {
        console.error('Status window not set');
        return;
    }

    // Get references to existing dialogue elements
    const dialogueBox = statusWindow.document.getElementById('dialogue-box');
    const dialogueContent = statusWindow.document.querySelector('.dialogue-content');
    const dialogueText = statusWindow.document.getElementById('dialogue-text');
    const choiceContainer = statusWindow.document.getElementById('choice-container');
    const navigation = statusWindow.document.getElementById('navigation');
    const clockContainer = statusWindow.document.getElementById('clock-container');

    if (!dialogueBox) {
        console.error('Dialogue box not found in status window');
        return;
    }

    // Clear existing content but keep the structure
    if (dialogueText) dialogueText.innerHTML = '';
    if (choiceContainer) choiceContainer.innerHTML = '';
    if (navigation) navigation.style.display = 'none';
    if (clockContainer) clockContainer.innerHTML = '';

    // Transform dialogue text element into bomb game status
    if (dialogueText) {
        dialogueText.innerHTML = `
            <h2 id="levelText" style="margin: 0 0 10px 0; color: #ffff00; transition: color 1s ease; font-size: 18px; text-align: center;">LEVEL 1</h2>
            <div class="timer" id="timer" style="font-size: 32px; font-weight: bold; color: #00ff00; margin: 15px 0; text-align: center;">30</div>
            <div id="dialogue" style="margin-top: 15px; padding: 10px; background: rgba(51, 51, 51, 0.8); border-left: 3px solid #ffff00; transition: border-color 1s ease, background-color 0.5s ease; font-size: 13px; line-height: 1.4;">Find and defuse the bombs!</div>
        `;
    }

    // Add skip and win buttons to choice container
    if (choiceContainer) {
        choiceContainer.innerHTML = `
            <button class="choice-button" onclick="window.skipBombTimer()" style="background: rgba(255, 102, 0, 0.9); color: #fff; margin-top: 10px; padding: 12px 24px; border: 2px solid #ff6600;">SKIP TIMER</button>
            <button class="choice-button" onclick="window.winBombLevel()" style="background: rgba(0, 204, 0, 0.9); color: #fff; margin-top: 10px; padding: 12px 24px; border: 2px solid #00cc00;">WIN LEVEL</button>
        `;
        choiceContainer.style.display = 'flex';
    }

    // Add timer animation styles if not already present
    const styleId = 'bomb-game-styles';
    if (!statusWindow.document.getElementById(styleId)) {
        const style = statusWindow.document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #dialogue-text .timer.warning { color: #ff9900 !important; }
            #dialogue-text .timer.danger { color: #ff0000 !important; animation: blink 0.5s infinite; }
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        statusWindow.document.head.appendChild(style);
    }
}

/**
 * Initializes the content of all game windows
 */
export function initializeWindowContent() {
    if (!redWindow || !blueWindow) {
        console.error('Game windows not opened yet');
        return;
    }

    // Transform the current dialogue window into status window
    transformDialogueToStatusWindow();

    // Initialize Red Window
    redWindow.document.write(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: rgba(255, 50, 50, 0.3);
                    overflow: hidden;
                    position: relative;
                    height: 100vh;
                    width: 100vw;
                    transition: background-color 1s ease;
                }
                .bomb {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    background: #0088ff;
                    border-radius: 50%;
                    border: 3px solid #0066cc;
                    animation: pulse 1s infinite;
                    box-shadow: 0 0 20px #0088ff;
                    transition: background 1s ease, border-color 1s ease, box-shadow 1s ease;
                }
                .edge-arrow {
                    position: fixed;
                    width: 30px;
                    height: 30px;
                    z-index: 100;
                }
                .edge-arrow.top { border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 25px solid #0088ff; }
                .edge-arrow.bottom { border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid #0088ff; }
                .edge-arrow.left { border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-right: 25px solid #0088ff; }
                .edge-arrow.right { border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 25px solid #0088ff; }
                .warning {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ff0000;
                    color: #fff;
                    padding: 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    display: none;
                    z-index: 1000;
                    border: 3px solid #fff;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
            </style>
        </head>
        <body>
            <div id="warning" class="warning">⚠️ WINDOW TOO LARGE ⚠️</div>
            <div id="edgeArrows"></div>
            <div id="gameArea"></div>
        </body>
        </html>
    `);

    // Initialize Blue Window
    blueWindow.document.write(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: rgba(50, 50, 255, 0.3);
                    overflow: hidden;
                    position: relative;
                    height: 100vh;
                    width: 100vw;
                    transition: background-color 1s ease;
                }
                .bomb {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    background: #ff4444;
                    border-radius: 50%;
                    border: 3px solid #cc0000;
                    animation: pulse 1s infinite;
                    box-shadow: 0 0 20px #ff4444;
                    transition: background 1s ease, border-color 1s ease, box-shadow 1s ease;
                }
                .edge-arrow {
                    position: fixed;
                    width: 30px;
                    height: 30px;
                    z-index: 100;
                }
                .edge-arrow.top { border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 25px solid #ff4444; }
                .edge-arrow.bottom { border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid #ff4444; }
                .edge-arrow.left { border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-right: 25px solid #ff4444; }
                .edge-arrow.right { border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 25px solid #ff4444; }
                .warning {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ff0000;
                    color: #fff;
                    padding: 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    display: none;
                    z-index: 1000;
                    border: 3px solid #fff;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
            </style>
        </head>
        <body>
            <div id="warning" class="warning">⚠️ WINDOW TOO LARGE ⚠️</div>
            <div id="edgeArrows"></div>
            <div id="gameArea"></div>
        </body>
        </html>
    `);
}

/**
 * Updates the colors of all windows based on darkness phase
 */
export function updateWindowColors(darknessPhase) {
    const colors = colorSchemes[darknessPhase];

    const statusWin = getStatusWindow();
    const redWin = getRedWindow();
    const blueWin = getBlueWindow();

    if (statusWin && statusWin.document) {
        // Update dialogue box background and text colors
        const dialogueBox = statusWin.document.getElementById('dialogue-box');
        const levelText = statusWin.document.getElementById('levelText');
        const dialogue = statusWin.document.getElementById('dialogue');

        if (dialogueBox) {
            dialogueBox.style.backgroundColor = colors.bodyBg;
            dialogueBox.style.transition = 'background-color 1s ease';
        }
        if (levelText) levelText.style.color = colors.yellow;
        if (dialogue) dialogue.style.borderLeftColor = colors.yellow;
    }

    if (redWin && redWin.document && redWin.document.body) {
        redWin.document.body.style.backgroundColor = colors.redBg;
    }

    if (blueWin && blueWin.document && blueWin.document.body) {
        blueWin.document.body.style.backgroundColor = colors.blueBg;
    }
}

/**
 * Updates dialogue text in status window
 */
export function updateDialogueText(text) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const dialogue = statusWin.document.getElementById('dialogue');
        if (dialogue) {
            dialogue.innerHTML = text;

            // Apply censor effect to any <censor> tags in the dialogue
            setTimeout(() => {
                applyCensorEffectInDialogue(dialogue);
            }, 100);
        }
    }
}

/**
 * Applies censor effect to censor tags in the bomb game dialogue
 */
function applyCensorEffectInDialogue(dialogueElement) {
    const censorElements = dialogueElement.querySelectorAll('censor:not(.censored)');

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
 * Creates an edge arrow pointing to an off-screen bomb
 */
export function createEdgeArrow(win, bomb, bounds, color) {
    const arrowEl = win.document.createElement('div');
    arrowEl.className = 'edge-arrow';

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const dx = bomb.x - centerX;
    const dy = bomb.y - centerY;

    // Determine which edge and position
    if (Math.abs(dx) > Math.abs(dy)) {
        // Left or right edge
        if (dx < 0) {
            arrowEl.classList.add('left');
            arrowEl.style.left = '10px';
            arrowEl.style.top = '50%';
            arrowEl.style.transform = 'translateY(-50%)';
        } else {
            arrowEl.classList.add('right');
            arrowEl.style.right = '10px';
            arrowEl.style.top = '50%';
            arrowEl.style.transform = 'translateY(-50%)';
        }
    } else {
        // Top or bottom edge
        if (dy < 0) {
            arrowEl.classList.add('top');
            arrowEl.style.top = '10px';
            arrowEl.style.left = '50%';
            arrowEl.style.transform = 'translateX(-50%)';
        } else {
            arrowEl.classList.add('bottom');
            arrowEl.style.bottom = '10px';
            arrowEl.style.left = '50%';
            arrowEl.style.transform = 'translateX(-50%)';
        }
    }

    // Update arrow color based on current darkness
    const currentColors = colorSchemes[gameState.darknessPhase];
    const arrowColor = color === 'blue' ? currentColors.blueBomb : currentColors.redBomb;

    // Apply color to the arrow borders
    if (arrowEl.classList.contains('top')) {
        arrowEl.style.borderBottomColor = arrowColor;
    } else if (arrowEl.classList.contains('bottom')) {
        arrowEl.style.borderTopColor = arrowColor;
    } else if (arrowEl.classList.contains('left')) {
        arrowEl.style.borderRightColor = arrowColor;
    } else if (arrowEl.classList.contains('right')) {
        arrowEl.style.borderLeftColor = arrowColor;
    }

    win.document.getElementById('edgeArrows').appendChild(arrowEl);
}

/**
 * Closes game windows (only red and blue, not the status window which is the dialogue)
 */
export function closeGameWindows() {
    // Don't close statusWindow - it's the dialogue box that should remain
    if (redWindow) redWindow.close();
    if (blueWindow) blueWindow.close();
}

/**
 * Fades both red and blue windows to pitch black
 */
export function fadeWindowsToPitchBlack() {
    const redWin = getRedWindow();
    const blueWin = getBlueWindow();

    if (redWin && redWin.document && redWin.document.body) {
        // Clear all content
        const gameArea = redWin.document.getElementById('gameArea');
        const edgeArrows = redWin.document.getElementById('edgeArrows');
        const warning = redWin.document.getElementById('warning');

        if (gameArea) gameArea.innerHTML = '';
        if (edgeArrows) edgeArrows.innerHTML = '';
        if (warning) warning.style.display = 'none';

        // Fade to pitch black
        redWin.document.body.style.transition = 'background-color 2s ease';
        redWin.document.body.style.backgroundColor = '#000000';
    }

    if (blueWin && blueWin.document && blueWin.document.body) {
        // Clear all content
        const gameArea = blueWin.document.getElementById('gameArea');
        const edgeArrows = blueWin.document.getElementById('edgeArrows');
        const warning = blueWin.document.getElementById('warning');

        if (gameArea) gameArea.innerHTML = '';
        if (edgeArrows) edgeArrows.innerHTML = '';
        if (warning) warning.style.display = 'none';

        // Fade to pitch black
        blueWin.document.body.style.transition = 'background-color 2s ease';
        blueWin.document.body.style.backgroundColor = '#000000';
    }
}
