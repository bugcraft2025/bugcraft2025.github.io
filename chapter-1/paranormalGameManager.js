// paranormalGameManager.js - Game flow control for paranormal game

import {
    gameState,
    enemyConfig,
    spawnEnemy,
    updateEnemyStages,
    identifyEnemy,
    flashlightClickOnRift,
    removeEnemy,
    disableScanner,
    updateScannerStatus,
    damagePlayer,
    isPlayerDead,
    resetEnemy,
    scheduleNextHandGrab,
    shouldTriggerHandGrab,
    setWindowRespawnCooldown,
    canRespawnWindow,
    getRespawnCooldownRemaining,
    initializeGame
} from './paranormalGame.js';

import { createRiftElement } from './riftVisual.js';

import {
    getStatusWindow,
    getFinderWindow,
    getFlashlightWindow,
    getCurtainWindow,
    isCurtainClosed,
    isFlashlightOn,
    openGameWindows,
    initializeWindowContent,
    updateHPDisplay,
    updateScannerDisplay,
    updateGameMessage,
    updateCurtainState,
    setCurtainClosed,
    setCurtainOpen,
    setFlashlightState,
    markWindowDestroyed,
    respawnWindow,
    updateRespawnButtons,
    addRedGlowToWindow,
    removeRedGlowFromWindow,
    closeGameWindows,
    triggerRainbowFlash
} from './paranormalGameUI.js';

import { grabAndDestroyWindow } from './windowGrabber.js';

let onGameCompleteCallback = null;
let gameLoopInterval = null;
let curtainHoldInterval = null;
let handGrabWarning = null; // { windowName, startTime, warningDuration }

/**
 * Starts the paranormal game
 */
export function startParanormalGame(onComplete) {
    onGameCompleteCallback = onComplete;

    initializeGame();
    openGameWindows();

    setTimeout(() => {
        initializeWindowContent();
        updateHPDisplay(gameState.playerHP, gameState.maxHP);
        updateScannerDisplay(false);

        // Spawn initial enemies after 5 seconds
        setTimeout(() => {
            const sw = screen.width;
            const sh = screen.height;

            spawnEnemy('eye', sw, sh);
            spawnEnemy('rift', sw, sh);

            updateGameMessage('Threats detected! Use the Finder to scan for them.');

            // Start game loop
            startGameLoop();
        }, 5000);
    }, 500);
}

/**
 * Main game loop
 */
function startGameLoop() {
    gameLoopInterval = setInterval(() => {
        if (!gameState.gameActive) {
            stopGameLoop();
            return;
        }

        // Update enemy stages
        updateEnemyStages();

        // Update scanner status
        updateScannerStatus();
        updateScannerDisplay(gameState.scannerDisabled);

        // Check for fully opened eye
        checkEyeDefense();

        // Check for fully grown rift
        checkRiftDefense();

        // Update enemy visuals
        updateEnemyVisuals();

        // Check for hand grab attack
        checkHandGrabAttack();

        // Update respawn cooldowns
        updateRespawnCooldownDisplays();

        // Check win condition (survive for 2 minutes)
        if (Date.now() - gameState.gameStartTime >= 120000) {
            gameWon();
        }

        // Check lose condition
        if (isPlayerDead()) {
            gameLost();
        }
    }, 100);
}

/**
 * Stops the game loop
 */
function stopGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
}

/**
 * Checks eye defense when eye reaches stage 5
 */
function checkEyeDefense() {
    const eyeEnemies = gameState.enemies.filter(e => e.type === 'eye' && e.stage === 5);

    eyeEnemies.forEach(eye => {
        const curtainWin = getCurtainWindow();
        if (!curtainWin || curtainWin.closed) {
            // Can't defend without curtain window
            eyeAttackFailed(eye);
            return;
        }

        const curtainBounds = {
            left: curtainWin.screenX,
            top: curtainWin.screenY,
            right: curtainWin.screenX + curtainWin.outerWidth,
            bottom: curtainWin.screenY + curtainWin.outerHeight
        };

        const eyeCovered = eye.x >= curtainBounds.left && eye.x <= curtainBounds.right &&
                          eye.y >= curtainBounds.top && eye.y <= curtainBounds.bottom;

        if (eyeCovered && isCurtainClosed()) {
            // Successfully defended!
            updateGameMessage('Eye neutralized! Well done.');
            resetEnemy(eye.id);
        } else if (!eye.attackedPlayer) {
            // Eye attack!
            eye.attackedPlayer = true;
            eyeAttackFailed(eye);
        }
    });
}

/**
 * Handles eye attack failure
 */
function eyeAttackFailed(eye) {
    // Epileptic rainbow flash
    triggerRainbowFlash();

    // Disable scanner
    disableScanner(15000);

    // Damage player
    const newHP = damagePlayer(1);
    updateHPDisplay(newHP, gameState.maxHP);

    updateGameMessage('<span style="color: #ff0000;">THE EYE SAW YOU! Scanner disabled!</span>');

    // Reset eye
    setTimeout(() => {
        resetEnemy(eye.id);
        eye.attackedPlayer = false;
    }, 2000);
}

/**
 * Checks rift defense when rift reaches stage 5
 */
function checkRiftDefense() {
    const riftEnemies = gameState.enemies.filter(e => e.type === 'rift' && e.stage === 5);

    riftEnemies.forEach(rift => {
        if (rift.riftClickCount >= 10) {
            // Rift destroyed successfully
            removeEnemy(rift.id);
            updateGameMessage('Rift closed! Threat eliminated.');

            // Spawn a new rift after delay
            setTimeout(() => {
                const sw = screen.width;
                const sh = screen.height;
                spawnEnemy('rift', sw, sh);
            }, 10000);
        } else if (!rift.attackedPlayer) {
            // Rift attack!
            rift.attackedPlayer = true;
            riftAttackFailed(rift);
        }
    });
}

/**
 * Handles rift attack failure
 */
async function riftAttackFailed(rift) {
    updateGameMessage('<span style="color: #ff0000;">THE RIFT CONSUMED YOUR TOOLS!</span>');

    // Damage player
    const newHP = damagePlayer(1);
    updateHPDisplay(newHP, gameState.maxHP);

    // Grab and destroy 2 random windows
    const windows = [
        { name: 'finder', ref: getFinderWindow() },
        { name: 'flashlight', ref: getFlashlightWindow() },
        { name: 'curtain', ref: getCurtainWindow() }
    ].filter(w => w.ref && !w.ref.closed);

    // Shuffle and pick 2
    const shuffled = windows.sort(() => Math.random() - 0.5);
    const toDestroy = shuffled.slice(0, Math.min(2, shuffled.length));

    for (const window of toDestroy) {
        await grabAndDestroyWindow(window.ref, 500);
        markWindowDestroyed(window.name);
        setWindowRespawnCooldown(window.name, 30000); // 30 second cooldown
    }

    // Remove rift and spawn new one
    removeEnemy(rift.id);
    setTimeout(() => {
        const sw = screen.width;
        const sh = screen.height;
        spawnEnemy('rift', sw, sh);
    }, 5000);
}

/**
 * Updates enemy visuals in finder and flashlight windows
 */
function updateEnemyVisuals() {
    const finderWin = getFinderWindow();
    const flashWin = getFlashlightWindow();

    // Update finder window (shows arrows to enemies)
    if (finderWin && !finderWin.closed) {
        const arrowContainer = finderWin.document.getElementById('edge-arrows');
        if (arrowContainer) {
            arrowContainer.innerHTML = '';

            const finderBounds = {
                left: finderWin.screenX,
                top: finderWin.screenY,
                right: finderWin.screenX + finderWin.outerWidth,
                bottom: finderWin.screenY + finderWin.outerHeight,
                width: finderWin.outerWidth,
                height: finderWin.outerHeight
            };

            gameState.enemies.forEach(enemy => {
                const inView = enemy.x >= finderBounds.left && enemy.x <= finderBounds.right &&
                              enemy.y >= finderBounds.top && enemy.y <= finderBounds.bottom;

                if (!inView) {
                    createEdgeArrow(finderWin, enemy, finderBounds);
                }
            });
        }
    }

    // Update flashlight window (shows identified enemies when light is on)
    if (flashWin && !flashWin.closed && isFlashlightOn()) {
        const enemyContainer = flashWin.document.getElementById('enemy-container');
        if (enemyContainer) {
            enemyContainer.innerHTML = '';

            const flashBounds = {
                left: flashWin.screenX,
                top: flashWin.screenY,
                right: flashWin.screenX + flashWin.outerWidth,
                bottom: flashWin.screenY + flashWin.outerHeight
            };

            gameState.enemies.forEach(enemy => {
                if (!enemy.identified) return;

                const inView = enemy.x >= flashBounds.left && enemy.x <= flashBounds.right &&
                              enemy.y >= flashBounds.top && enemy.y <= flashBounds.bottom;

                if (inView) {
                    let sprite;

                    if (enemy.type === 'eye') {
                        // Use image sprite for eye
                        sprite = flashWin.document.createElement('img');
                        sprite.src = `./images/${enemyConfig[enemy.type].sprites[enemy.stage - 1]}`;
                    } else if (enemy.type === 'rift') {
                        // Use CSS/JS visual for rift
                        sprite = createRiftElement(enemy.stage);
                    }

                    sprite.className = 'enemy-sprite visible';
                    sprite.style.left = (enemy.x - flashBounds.left - 40) + 'px'; // Center the element
                    sprite.style.top = (enemy.y - flashBounds.top - 40) + 'px';
                    sprite.dataset.id = enemy.id;
                    sprite.onclick = () => {
                        if (enemy.type === 'rift') {
                            window.paranormalFlashlightClickEnemy(enemy.id);
                        }
                    };
                    enemyContainer.appendChild(sprite);
                }
            });
        }
    }
}

/**
 * Creates edge arrow pointing to enemy in finder window
 */
function createEdgeArrow(win, enemy, bounds) {
    const arrowEl = win.document.createElement('div');
    arrowEl.className = 'edge-arrow';

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const dx = enemy.x - centerX;
    const dy = enemy.y - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
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

    win.document.getElementById('edge-arrows').appendChild(arrowEl);
}

/**
 * Checks and triggers hand grab attacks
 */
function checkHandGrabAttack() {
    // If warning is active, check if time expired
    if (handGrabWarning) {
        const elapsed = Date.now() - handGrabWarning.startTime;

        if (elapsed >= handGrabWarning.warningDuration) {
            // Warning expired, check if player moved window
            const wasMoved = checkIfWindowWasMoved(handGrabWarning.windowName, handGrabWarning.originalY);

            if (!wasMoved) {
                // Player failed to move, destroy window
                destroyWindowFromHandGrab(handGrabWarning.windowName);
            } else {
                // Player succeeded
                removeRedGlowFromWindow(handGrabWarning.windowName);
            }

            handGrabWarning = null;
            scheduleNextHandGrab();
        }

        return;
    }

    // Check if it's time for new hand grab
    if (shouldTriggerHandGrab()) {
        startHandGrabWarning();
    }
}

/**
 * Starts a hand grab warning on a random window
 */
function startHandGrabWarning() {
    const windows = [
        { name: 'finder', ref: getFinderWindow() },
        { name: 'flashlight', ref: getFlashlightWindow() },
        { name: 'curtain', ref: getCurtainWindow() }
    ].filter(w => w.ref && !w.ref.closed);

    if (windows.length === 0) return;

    const target = windows[Math.floor(Math.random() * windows.length)];

    handGrabWarning = {
        windowName: target.name,
        startTime: Date.now(),
        warningDuration: 5000, // 5 seconds to react
        originalY: target.ref.screenY
    };

    addRedGlowToWindow(target.name);
    updateGameMessage(`<span style="color: #ff9900;">WARNING: Something is approaching your ${target.name}! Move it!</span>`);
}

/**
 * Checks if window was moved on Y axis
 */
function checkIfWindowWasMoved(windowName, originalY) {
    const win = windowName === 'finder' ? getFinderWindow() :
                windowName === 'flashlight' ? getFlashlightWindow() :
                getCurtainWindow();

    if (!win || win.closed) return false;

    const currentY = win.screenY;
    const moved = Math.abs(currentY - originalY) >= 100;

    return moved;
}

/**
 * Destroys window from failed hand grab defense
 */
async function destroyWindowFromHandGrab(windowName) {
    const win = windowName === 'finder' ? getFinderWindow() :
                windowName === 'flashlight' ? getFlashlightWindow() :
                getCurtainWindow();

    if (!win || win.closed) return;

    removeRedGlowFromWindow(windowName);
    updateGameMessage(`<span style="color: #ff0000;">The ${windowName} was taken!</span>`);

    await grabAndDestroyWindow(win, 100);
    markWindowDestroyed(windowName);
    setWindowRespawnCooldown(windowName, 30000);
}

/**
 * Updates respawn button cooldown displays
 */
function updateRespawnCooldownDisplays() {
    const cooldowns = {
        finder: getRespawnCooldownRemaining('finder'),
        flashlight: getRespawnCooldownRemaining('flashlight'),
        curtain: getRespawnCooldownRemaining('curtain')
    };

    updateRespawnButtons(cooldowns);
}

/**
 * Handles game won
 */
function gameWon() {
    gameState.gameActive = false;
    stopGameLoop();

    updateGameMessage('<span style="color: #00ff00; font-size: 18px; font-weight: bold;">MISSION COMPLETE! You survived the paranormal threats!</span>');

    setTimeout(() => {
        closeGameWindows();
        if (onGameCompleteCallback) {
            onGameCompleteCallback('success');
        }
    }, 3000);
}

/**
 * Handles game lost
 */
function gameLost() {
    gameState.gameActive = false;
    stopGameLoop();

    updateGameMessage('<span style="color: #ff0000; font-size: 18px; font-weight: bold;">CONTAINMENT BREACH! You have been consumed by the darkness...</span>');

    setTimeout(() => {
        closeGameWindows();
        if (onGameCompleteCallback) {
            onGameCompleteCallback('failure');
        }
    }, 3000);
}

// ========== GLOBAL WINDOW CALLBACKS ==========
// These are called from the component windows

window.paranormalScanAction = function() {
    if (gameState.scannerDisabled) return;

    const finderWin = getFinderWindow();
    if (!finderWin || finderWin.closed) return;

    const finderBounds = {
        left: finderWin.screenX,
        top: finderWin.screenY,
        right: finderWin.screenX + finderWin.outerWidth,
        bottom: finderWin.screenY + finderWin.outerHeight
    };

    let identified = false;

    gameState.enemies.forEach(enemy => {
        if (enemy.identified) return;

        const enemyInFinder = enemy.x >= finderBounds.left && enemy.x <= finderBounds.right &&
                             enemy.y >= finderBounds.top && enemy.y <= finderBounds.bottom;

        if (enemyInFinder) {
            identifyEnemy(enemy.id);
            identified = true;
        }
    });

    if (identified) {
        updateGameMessage('<span style="color: #00ff00;">Threat identified! Use the flashlight to see it.</span>');
    } else {
        updateGameMessage('Scan complete. No threats in range.');
    }
};

window.paranormalFlashlightDown = function() {
    setFlashlightState(true);
};

window.paranormalFlashlightUp = function() {
    setFlashlightState(false);
};

window.paranormalFlashlightClickEnemy = function(enemyId) {
    const result = flashlightClickOnRift(enemyId);

    if (result === 'destroyed') {
        updateGameMessage('<span style="color: #00ff00;">Rift destroyed!</span>');
    } else if (result === 'hit') {
        const enemy = gameState.enemies.find(e => e.id === enemyId);
        if (enemy) {
            updateGameMessage(`Attacking rift... ${enemy.riftClickCount}/10 hits`);
        }
    }
};

window.paranormalCurtainDown = function() {
    if (curtainHoldInterval) return; // Already holding

    curtainHoldInterval = setInterval(() => {
        updateCurtainState(true); // Closing
    }, 200);
};

window.paranormalCurtainUp = function() {
    if (curtainHoldInterval) {
        clearInterval(curtainHoldInterval);
        curtainHoldInterval = null;
    }

    // Start opening
    const openInterval = setInterval(() => {
        updateCurtainState(false); // Opening
    }, 200);

    // Stop opening after curtain fully opens
    setTimeout(() => {
        clearInterval(openInterval);
    }, 800);
};

window.respawnFinderWindow = function() {
    if (canRespawnWindow('finder')) {
        respawnWindow('finder');
        updateGameMessage('Finder respawned.');
    }
};

window.respawnFlashlightWindow = function() {
    if (canRespawnWindow('flashlight')) {
        respawnWindow('flashlight');
        updateGameMessage('Flashlight respawned.');
    }
};

window.respawnCurtainWindow = function() {
    if (canRespawnWindow('curtain')) {
        respawnWindow('curtain');
        updateGameMessage('Curtain respawned.');
    }
};
