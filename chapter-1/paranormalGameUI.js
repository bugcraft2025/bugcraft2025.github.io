// paranormalGameUI.js - UI management for paranormal game windows

import { gameState } from './paranormalGame.js';
import { createRiftElement, injectRiftStyles } from './riftVisual.js';

let statusWindow = null;
let finderWindow = null;
let flashlightWindow = null;
let curtainWindow = null;

// Track curtain state
let curtainClosed = false;
let curtainStage = 1; // 1 = open, 4 = closed

// Track flashlight state
let flashlightOn = false;

// Track destroyed windows
let destroyedWindows = new Set();

// Getters for window references
export function getStatusWindow() { return statusWindow; }
export function getFinderWindow() { return finderWindow && !destroyedWindows.has('finder') ? finderWindow : null; }
export function getFlashlightWindow() { return flashlightWindow && !destroyedWindows.has('flashlight') ? flashlightWindow : null; }
export function getCurtainWindow() { return curtainWindow && !destroyedWindows.has('curtain') ? curtainWindow : null; }

export function isCurtainClosed() { return curtainClosed; }
export function isFlashlightOn() { return flashlightOn; }

/**
 * Opens the 3 component windows
 * Uses main window (window.opener) to spawn all windows to avoid popup blocking
 */
export function openGameWindows() {
    const sw = screen.width;
    const sh = screen.height;

    // Use the current window as the status window (the escaped dialogue box)
    statusWindow = window;

    // IMPORTANT: Get the main window reference
    // The escaped dialogue box has window.opener pointing to the main page
    // We spawn all component windows from the main window to avoid popup blocking
    const mainWindow = window.opener;

    if (!mainWindow) {
        console.error('No main window found - cannot spawn component windows');
        updateGameMessage('<span style="color: #ff0000;">ERROR: Main window not found. Refresh and try again.</span>');
        return false;
    }

    // Store reference to status window in main window
    const statusWindowRef = window;

    // Store spawn function in main window so it can be called
    mainWindow.spawnParanormalWindows = function() {
        // Supernatural Finder - left side
        const finder = mainWindow.open('', 'paranormalFinder', `width=400,height=400,left=100,top=200`);

        // Flashlight - center
        const flashlight = mainWindow.open('', 'paranormalFlashlight', `width=400,height=400,left=${sw/2-200},top=200`);

        // Curtain - right side
        const curtain = mainWindow.open('', 'paranormalCurtain', `width=400,height=400,left=${sw-500},top=200`);

        // Send window references back to status window using direct reference
        if (statusWindowRef && statusWindowRef.receiveParanormalWindows) {
            statusWindowRef.receiveParanormalWindows(finder, flashlight, curtain);
        }
    };

    // Set up forwarding functions in main window for component windows to call
    mainWindow.paranormalScanAction = function() {
        if (statusWindowRef && statusWindowRef.paranormalScanAction) {
            statusWindowRef.paranormalScanAction();
        }
    };
    mainWindow.paranormalFlashlightDown = function() {
        if (statusWindowRef && statusWindowRef.paranormalFlashlightDown) {
            statusWindowRef.paranormalFlashlightDown();
        }
    };
    mainWindow.paranormalFlashlightUp = function() {
        if (statusWindowRef && statusWindowRef.paranormalFlashlightUp) {
            statusWindowRef.paranormalFlashlightUp();
        }
    };
    mainWindow.paranormalCurtainDown = function() {
        if (statusWindowRef && statusWindowRef.paranormalCurtainDown) {
            statusWindowRef.paranormalCurtainDown();
        }
    };
    mainWindow.paranormalCurtainUp = function() {
        if (statusWindowRef && statusWindowRef.paranormalCurtainUp) {
            statusWindowRef.paranormalCurtainUp();
        }
    };
    // Set up receiver for window references
    window.receiveParanormalWindows = function(finder, flashlight, curtain) {
        finderWindow = finder;
        flashlightWindow = flashlight;
        curtainWindow = curtain;
    };

    // Call spawn from main window
    mainWindow.spawnParanormalWindows();

    return true;
}

/**
 * Transforms the dialogue box into the paranormal game status window
 */
function transformDialogueToStatusWindow() {
    if (!statusWindow) {
        console.error('Status window not set');
        return;
    }

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

    // Transform dialogue text element into paranormal game status
    if (dialogueText) {
        dialogueText.innerHTML = `
            <h2 style="margin: 0 0 15px 0; color: #ff0000; font-size: 20px; text-align: center;">PARANORMAL CONTAINMENT</h2>
            <div id="hp-display" style="font-size: 24px; font-weight: bold; color: #00ff00; margin: 15px 0; text-align: center;">
                HP: <span id="hp-value">3</span> / 3
            </div>
            <div id="scanner-status" style="margin: 10px 0; padding: 8px; background: rgba(0, 255, 0, 0.2); border: 2px solid #00ff00; text-align: center; font-size: 14px; transition: all 0.3s;">
                SCANNER: ONLINE
            </div>
            <div id="game-message" style="margin-top: 15px; padding: 10px; background: rgba(51, 51, 51, 0.8); border-left: 3px solid #ff0000; font-size: 13px; line-height: 1.4;">
                Use the Supernatural Finder to scan for threats...
            </div>
        `;
    }

    // Add respawn buttons to choice container
    if (choiceContainer) {
        choiceContainer.innerHTML = `
            <button id="respawn-finder" class="choice-button" onclick="window.respawnFinderWindow()" style="background: rgba(100, 100, 255, 0.5); color: #fff; margin-top: 8px; padding: 10px 20px; border: 2px solid #6666ff; font-size: 12px; display: none;">
                RESPAWN FINDER (<span class="cooldown-timer">0</span>s)
            </button>
            <button id="respawn-flashlight" class="choice-button" onclick="window.respawnFlashlightWindow()" style="background: rgba(255, 255, 100, 0.5); color: #000; margin-top: 8px; padding: 10px 20px; border: 2px solid #ffff66; font-size: 12px; display: none;">
                RESPAWN FLASHLIGHT (<span class="cooldown-timer">0</span>s)
            </button>
            <button id="respawn-curtain" class="choice-button" onclick="window.respawnCurtainWindow()" style="background: rgba(150, 75, 0, 0.5); color: #fff; margin-top: 8px; padding: 10px 20px; border: 2px solid #996633; font-size: 12px; display: none;">
                RESPAWN CURTAIN (<span class="cooldown-timer">0</span>s)
            </button>
        `;
        choiceContainer.style.display = 'flex';
    }

    // Add styles
    const styleId = 'paranormal-game-styles';
    if (!statusWindow.document.getElementById(styleId)) {
        const style = statusWindow.document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #hp-display.low { color: #ff9900 !important; }
            #hp-display.critical { color: #ff0000 !important; animation: blink 0.5s infinite; }
            #scanner-status.disabled {
                background: rgba(255, 0, 0, 0.2) !important;
                border-color: #ff0000 !important;
            }
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        statusWindow.document.head.appendChild(style);
    }
}

/**
 * Initializes content for all windows
 */
export function initializeWindowContent() {
    transformDialogueToStatusWindow();
    initializeFinderWindow();
    initializeFlashlightWindow();
    initializeCurtainWindow();
}

/**
 * Initialize Supernatural Finder window
 */
function initializeFinderWindow() {
    if (!finderWindow || finderWindow.closed) return;

    finderWindow.document.write(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
                    overflow: hidden;
                    position: relative;
                    height: 100vh;
                    width: 100vw;
                    font-family: 'Courier New', monospace;
                }
                #radar-screen {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 250px;
                    height: 250px;
                    border: 3px solid #00ff00;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 255, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 70%);
                    box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
                }
                #scan-button {
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 15px 40px;
                    background: rgba(0, 255, 0, 0.3);
                    border: 2px solid #00ff00;
                    color: #00ff00;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Courier New', monospace;
                }
                #scan-button:hover {
                    background: rgba(0, 255, 0, 0.5);
                    box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
                }
                #scan-button:active {
                    transform: translateX(-50%) scale(0.95);
                }
                #scan-button.disabled {
                    background: rgba(255, 0, 0, 0.3);
                    border-color: #ff0000;
                    color: #ff0000;
                    cursor: not-allowed;
                }
                .edge-arrow {
                    position: absolute;
                    width: 0;
                    height: 0;
                    z-index: 100;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-bottom: 15px solid #00ff00;
                }
                .red-glow {
                    animation: red-glow-anim 1s infinite;
                }
                @keyframes red-glow-anim {
                    0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
                    50% { box-shadow: 0 0 60px rgba(255, 0, 0, 1); }
                }
            </style>
        </head>
        <body>
            <div id="radar-screen"></div>
            <div id="edge-arrows"></div>
            <button id="scan-button" onclick="if(window.opener) window.opener.paranormalScanAction()">SCAN</button>
        </body>
        </html>
    `);
}

/**
 * Initialize Flashlight window
 */
function initializeFlashlightWindow() {
    if (!flashlightWindow || flashlightWindow.closed) return;

    flashlightWindow.document.write(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                    overflow: hidden;
                    position: relative;
                    height: 100vh;
                    width: 100vw;
                    transition: background 0.3s;
                }
                body.light-on {
                    background: radial-gradient(circle, rgba(255, 255, 200, 0.9) 0%, rgba(255, 255, 150, 0.3) 50%, rgba(0, 0, 0, 0.1) 100%);
                }
                #enemy-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .enemy-sprite {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .enemy-sprite.visible {
                    opacity: 1;
                }
                .enemy-sprite.identified {
                    animation: identified-glow 1.5s ease-in-out infinite;
                }
                @keyframes identified-glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.8)) drop-shadow(0 0 20px rgba(0, 255, 0, 0.6));
                    }
                    50% {
                        filter: drop-shadow(0 0 20px rgba(0, 255, 0, 1)) drop-shadow(0 0 30px rgba(0, 255, 0, 0.8));
                    }
                }
                .red-glow {
                    animation: red-glow-anim 1s infinite;
                }
                @keyframes red-glow-anim {
                    0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
                    50% { box-shadow: 0 0 60px rgba(255, 0, 0, 1); }
                }
                #light-button {
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 15px 40px;
                    background: rgba(255, 255, 0, 0.3);
                    border: 2px solid #ffff00;
                    color: #ffff00;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Courier New', monospace;
                }
                #light-button:hover {
                    background: rgba(255, 255, 0, 0.5);
                    box-shadow: 0 0 20px rgba(255, 255, 0, 0.8);
                }
                #light-button:active {
                    transform: translateX(-50%) scale(0.95);
                }
            </style>
        </head>
        <body>
            <div id="enemy-container"></div>
            <button id="light-button" onmousedown="if(window.opener) window.opener.paranormalFlashlightDown()" onmouseup="if(window.opener) window.opener.paranormalFlashlightUp()">LIGHT</button>
        </body>
        </html>
    `);

    // Inject rift visual styles
    setTimeout(() => {
        if (flashlightWindow && !flashlightWindow.closed) {
            injectRiftStyles(flashlightWindow.document);
        }
    }, 100);
}

/**
 * Initialize Curtain window
 */
function initializeCurtainWindow() {
    if (!curtainWindow || curtainWindow.closed) return;

    curtainWindow.document.write(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                    overflow: hidden;
                    position: relative;
                    height: 100vh;
                    width: 100vw;
                    cursor: pointer;
                }
                #curtain-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .red-glow {
                    animation: red-glow-anim 1s infinite;
                }
                @keyframes red-glow-anim {
                    0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
                    50% { box-shadow: 0 0 60px rgba(255, 0, 0, 1); }
                }
                #close-button {
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 15px 40px;
                    background: rgba(150, 75, 0, 0.7);
                    border: 2px solid #996633;
                    color: #ffcc99;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Courier New', monospace;
                    z-index: 10;
                }
                #close-button:hover {
                    background: rgba(150, 75, 0, 0.9);
                    box-shadow: 0 0 20px rgba(150, 75, 0, 0.8);
                }
                #close-button:active {
                    transform: translateX(-50%) scale(0.95);
                }
            </style>
        </head>
        <body>
            <img id="curtain-image" src="./images/curtain1.png" />
            <button id="close-button" onmousedown="if(window.opener) window.opener.paranormalCurtainDown()" onmouseup="if(window.opener) window.opener.paranormalCurtainUp()">CLOSE</button>
        </body>
        </html>
    `);
}

/**
 * Updates HP display in status window
 */
export function updateHPDisplay(hp, maxHP) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const hpValue = statusWin.document.getElementById('hp-value');
        const hpDisplay = statusWin.document.getElementById('hp-display');

        if (hpValue) hpValue.textContent = hp;

        if (hpDisplay) {
            hpDisplay.className = '';
            if (hp === 1) {
                hpDisplay.classList.add('critical');
            } else if (hp === 2) {
                hpDisplay.classList.add('low');
            }
        }
    }
}

/**
 * Updates scanner status display
 */
export function updateScannerDisplay(disabled) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const scannerStatus = statusWin.document.getElementById('scanner-status');
        const scanButton = getFinderWindow()?.document.getElementById('scan-button');

        if (scannerStatus) {
            if (disabled) {
                scannerStatus.textContent = 'SCANNER: DISABLED';
                scannerStatus.classList.add('disabled');
            } else {
                scannerStatus.textContent = 'SCANNER: ONLINE';
                scannerStatus.classList.remove('disabled');
            }
        }

        if (scanButton) {
            if (disabled) {
                scanButton.classList.add('disabled');
                scanButton.disabled = true;
            } else {
                scanButton.classList.remove('disabled');
                scanButton.disabled = false;
            }
        }
    }
}

/**
 * Updates game message in status window
 */
export function updateGameMessage(message) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const messageEl = statusWin.document.getElementById('game-message');
        if (messageEl) {
            messageEl.innerHTML = message;
        }
    }
}

/**
 * Updates curtain visual state
 */
export function updateCurtainState(isClosing) {
    const curtainWin = getCurtainWindow();
    if (!curtainWin || curtainWin.closed) return;

    const curtainImg = curtainWin.document.getElementById('curtain-image');
    if (!curtainImg) return;

    if (isClosing) {
        curtainStage = Math.min(4, curtainStage + 1);
        curtainClosed = curtainStage === 4;
    } else {
        curtainStage = Math.max(1, curtainStage - 1);
        curtainClosed = curtainStage === 4;
    }

    curtainImg.src = `./images/curtain${curtainStage}.png`;
}

/**
 * Sets curtain to fully closed
 */
export function setCurtainClosed() {
    curtainClosed = true;
    curtainStage = 4;
    const curtainWin = getCurtainWindow();
    if (curtainWin && !curtainWin.closed) {
        const curtainImg = curtainWin.document.getElementById('curtain-image');
        if (curtainImg) curtainImg.src = `./images/curtain4.png`;
    }
}

/**
 * Sets curtain to fully open
 */
export function setCurtainOpen() {
    curtainClosed = false;
    curtainStage = 1;
    const curtainWin = getCurtainWindow();
    if (curtainWin && !curtainWin.closed) {
        const curtainImg = curtainWin.document.getElementById('curtain-image');
        if (curtainImg) curtainImg.src = `./images/curtain1.png`;
    }
}

/**
 * Updates flashlight state
 */
export function setFlashlightState(isOn) {
    flashlightOn = isOn;
    const flashWin = getFlashlightWindow();
    if (flashWin && !flashWin.closed) {
        if (isOn) {
            flashWin.document.body.classList.add('light-on');
        } else {
            flashWin.document.body.classList.remove('light-on');
        }
    }
}

/**
 * Marks a window as destroyed
 */
export function markWindowDestroyed(windowName) {
    destroyedWindows.add(windowName);
    showRespawnButton(windowName);
}

/**
 * Respawns a destroyed window
 */
export function respawnWindow(windowName) {
    destroyedWindows.delete(windowName);
    hideRespawnButton(windowName);

    const sw = screen.width;
    const mainWindow = window.opener;

    if (!mainWindow) {
        console.error('Cannot respawn - main window not found');
        return;
    }

    // Respawn the appropriate window from main window
    if (windowName === 'finder' && (!finderWindow || finderWindow.closed)) {
        finderWindow = mainWindow.open('', 'paranormalFinder', `width=400,height=400,left=100,top=200`);
        setTimeout(() => initializeFinderWindow(), 100);
    } else if (windowName === 'flashlight' && (!flashlightWindow || flashlightWindow.closed)) {
        flashlightWindow = mainWindow.open('', 'paranormalFlashlight', `width=400,height=400,left=${sw/2-200},top=200`);
        setTimeout(() => initializeFlashlightWindow(), 100);
    } else if (windowName === 'curtain' && (!curtainWindow || curtainWindow.closed)) {
        curtainWindow = mainWindow.open('', 'paranormalCurtain', `width=400,height=400,left=${sw-500},top=200`);
        setTimeout(() => initializeCurtainWindow(), 100);
    }
}

/**
 * Shows respawn button for a window
 */
function showRespawnButton(windowName) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const button = statusWin.document.getElementById(`respawn-${windowName}`);
        if (button) button.style.display = 'block';
    }
}

/**
 * Hides respawn button for a window
 */
function hideRespawnButton(windowName) {
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const button = statusWin.document.getElementById(`respawn-${windowName}`);
        if (button) button.style.display = 'none';
    }
}

/**
 * Updates respawn button cooldowns
 */
export function updateRespawnButtons(cooldowns) {
    const statusWin = getStatusWindow();
    if (!statusWin || !statusWin.document) return;

    ['finder', 'flashlight', 'curtain'].forEach(windowName => {
        const button = statusWin.document.getElementById(`respawn-${windowName}`);
        if (button && button.style.display !== 'none') {
            const timerSpan = button.querySelector('.cooldown-timer');
            const remaining = cooldowns[windowName] || 0;

            if (timerSpan) timerSpan.textContent = remaining;
            button.disabled = remaining > 0;

            if (remaining > 0) {
                button.style.opacity = '0.5';
            } else {
                button.style.opacity = '1';
            }
        }
    });
}

/**
 * Adds red glow effect to a window (warning for hand grab)
 */
export function addRedGlowToWindow(windowName) {
    const win = windowName === 'finder' ? getFinderWindow() :
                windowName === 'flashlight' ? getFlashlightWindow() :
                getCurtainWindow();

    if (win && !win.closed && win.document && win.document.body) {
        win.document.body.classList.add('red-glow');
    }
}

/**
 * Removes red glow effect from a window
 */
export function removeRedGlowFromWindow(windowName) {
    const win = windowName === 'finder' ? getFinderWindow() :
                windowName === 'flashlight' ? getFlashlightWindow() :
                getCurtainWindow();

    if (win && !win.closed && win.document && win.document.body) {
        win.document.body.classList.remove('red-glow');
    }
}

/**
 * Closes all game windows
 */
export function closeGameWindows() {
    if (finderWindow && !finderWindow.closed) finderWindow.close();
    if (flashlightWindow && !flashlightWindow.closed) flashlightWindow.close();
    if (curtainWindow && !curtainWindow.closed) curtainWindow.close();
}

/**
 * Triggers epileptic rainbow effect on all windows
 */
export function triggerRainbowFlash() {
    const windows = [getFinderWindow(), getFlashlightWindow(), getCurtainWindow()];

    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'];
    let flashCount = 0;
    const maxFlashes = 20;

    const flashInterval = setInterval(() => {
        const color = colors[flashCount % colors.length];

        windows.forEach(win => {
            if (win && !win.closed && win.document && win.document.body) {
                win.document.body.style.background = color;
            }
        });

        flashCount++;
        if (flashCount >= maxFlashes) {
            clearInterval(flashInterval);
            // Reset backgrounds
            windows.forEach((win, idx) => {
                if (win && !win.closed && win.document && win.document.body) {
                    if (idx === 0) win.document.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)';
                    else if (idx === 1) win.document.body.style.background = '#000000';
                    else if (idx === 2) win.document.body.style.background = '#000000';
                }
            });
        }
    }, 100);
}
