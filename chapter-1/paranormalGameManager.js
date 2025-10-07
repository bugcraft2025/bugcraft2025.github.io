// paranormalGameManager.js - Game flow control for paranormal game

import {
    gameState,
    enemyConfig,
    spawnEnemy,
    updateEnemyStages,
    identifyEnemy,
    flashRiftsInView,
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

import { createRiftElement, createRiftExplosion } from './riftVisual.js';

import {
    getStatusWindow,
    getFinderWindow,
    getFlashlightWindow,
    getCurtainWindow,
    isCurtainClosed,
    isFlashlightOn,
    getCurtainBoundsAndState,
    openGameWindows,
    initializeWindowContent,
    updateHPDisplay,
    updateScannerDisplay,
    updateTimerDisplay,
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
    triggerCurtainSuccessGlow,
    triggerRainbowFlash
} from './paranormalGameUI.js';

import { grabAndDestroyWindow } from './windowGrabber.js';

let onGameCompleteCallback = null;
let gameLoopInterval = null;
let curtainHoldInterval = null;
let handGrabWarning = null; // { windowName, startTime, warningDuration }
let previousFlashlightState = false; // Track previous flashlight state to detect off transitions

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

        // Tutorial: Spawn only rift first
        setTimeout(() => {
            const sw = screen.width;
            const sh = screen.height;

            spawnEnemy('rift', sw, sh);

            // Tutorial messages
            updateGameMessage('<span style="color: #00ffff; font-weight: bold;">TUTORIAL: A rift has appeared!</span>');
            setTimeout(() => updateGameMessage('<span style="color: #00ffff;">Step 1: Use the Supernatural Finder (🔍) to scan for the threat.</span>'), 1000);
            setTimeout(() => updateGameMessage('<span style="color: #00ffff;">Step 2: Once identified, use the Flashlight (🔦) to see it.</span>'), 2000);
            setTimeout(() => updateGameMessage('<span style="color: #00ffff;">Step 3: Flash the rift 5 times to close it before it reaches full size!</span>'), 3000);

            // Start game loop
            startGameLoop();
        }, 3000);
    }, 500);
}

/**
 * Updates enemy stages with curtain acceleration for eyes
 */
function updateEnemyStagesWithCurtainAcceleration() {
    const now = Date.now();
    const curtainInfo = getCurtainBoundsAndState();

    gameState.enemies.forEach(enemy => {
        const config = enemyConfig[enemy.type];
        if (!config) return;

        let progressInterval = config.progressInterval;

        // Check if this is an eye under a closed curtain
        if (enemy.type === 'eye' && curtainInfo && curtainInfo.isClosed) {
            const eyeCovered = enemy.x >= curtainInfo.bounds.left &&
                             enemy.x <= curtainInfo.bounds.right &&
                             enemy.y >= curtainInfo.bounds.top &&
                             enemy.y <= curtainInfo.bounds.bottom;

            if (eyeCovered) {
                // 4x faster progression under closed curtain
                progressInterval = config.progressInterval / 4;
            }
        }

        // Check if enough time has passed to progress to next stage
        if (now - enemy.lastUpdate >= progressInterval && enemy.stage < config.maxStage) {
            enemy.stage++;
            enemy.lastUpdate = now;
        }
    });
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

        // Check and spawn enemies according to schedule
        checkScheduledSpawns();

        // Update enemy stages (with curtain acceleration)
        updateEnemyStagesWithCurtainAcceleration();

        // Update scanner status
        updateScannerStatus();
        updateScannerDisplay(gameState.scannerDisabled);

        // Check for fully opened eye
        checkEyeDefense();

        // Check for fully grown rift
        checkRiftDefense();

        // Update enemy visuals
        updateEnemyVisuals();

        // Check for flashlight turning off (flash complete)
        checkFlashlightFlash();

        // Check for hand grab attack
        checkHandGrabAttack();

        // Check for manual window closures
        checkManualWindowClosures();

        // Update respawn cooldowns
        updateRespawnCooldownDisplays();

        // Update timer display
        if (!gameState.tutorialMode && gameState.postTutorialStartTime > 0) {
            const timeRemaining = 150000 - (Date.now() - gameState.postTutorialStartTime);
            updateTimerDisplay(Math.max(0, timeRemaining));
        } else {
            updateTimerDisplay(-1); // Show --:--
        }

        // Check win condition (survive for 2.5 minutes) - only after tutorial
        if (!gameState.tutorialMode && gameState.postTutorialStartTime > 0) {
            if (Date.now() - gameState.postTutorialStartTime >= 150000) {
                gameWon();
            }
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
 * Checks and spawns enemies according to the schedule (only after tutorial)
 */
function checkScheduledSpawns() {
    // Only spawn from schedule after tutorial is complete
    if (gameState.tutorialMode || gameState.postTutorialStartTime === 0) return;

    const elapsed = Date.now() - gameState.postTutorialStartTime;
    const sw = screen.width;
    const sh = screen.height;

    gameState.spawnSchedule.forEach((schedule, index) => {
        if (elapsed >= schedule.time && !gameState.spawnedScheduleIndexes.includes(index)) {
            // Time to spawn!
            gameState.spawnedScheduleIndexes.push(index);

            schedule.spawns.forEach(enemyType => {
                spawnEnemy(enemyType, sw, sh);
            });

            // Log spawn message
            const spawnText = schedule.spawns.join(' and ');
            updateGameMessage(`<span style="color: #ff9900;">New threat detected: ${spawnText}</span>`);
        }
    });
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
            triggerCurtainSuccessGlow();
            updateGameMessage('Eye neutralized! Well done.');

            // Remove the eye
            removeEnemy(eye.id);

            // Tutorial mode: First eye defeated - start normal gameplay with schedule
            if (gameState.tutorialMode && gameState.tutorialEyeSpawned) {
                gameState.tutorialMode = false;
                gameState.postTutorialStartTime = Date.now(); // Start the 2.5-minute timer

                updateGameMessage('<span style="color: #00ff00; font-weight: bold;">Tutorial complete! Survive for 2.5 minutes!</span>');
            }
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
 * Checks rift defense - can be destroyed at any stage with 5 flashes
 */
function checkRiftDefense() {
    const riftEnemies = gameState.enemies.filter(e => e.type === 'rift');

    riftEnemies.forEach(rift => {
        if (rift.riftFlashCount >= 5) {
            // Rift destroyed successfully at any stage
            triggerRiftExplosion(rift.id);

            // Remove from game state
            removeEnemy(rift.id);
            updateGameMessage('Rift closed! Threat eliminated.');

            // Tutorial mode: First rift defeated
            if (gameState.tutorialMode && !gameState.tutorialRiftDefeated) {
                gameState.tutorialRiftDefeated = true;

                updateGameMessage('<span style="color: #00ff00; font-weight: bold;">TUTORIAL: Well done! You closed the rift!</span>');

                // Spawn eye after 3 seconds
                setTimeout(() => {
                    const sw = screen.width;
                    const sh = screen.height;
                    spawnEnemy('eye', sw, sh);
                    gameState.tutorialEyeSpawned = true;

                    updateGameMessage('<span style="color: #ffff00; font-weight: bold;">TUTORIAL: A new threat - an Eye has appeared!</span>');
                    setTimeout(() => updateGameMessage('<span style="color: #ffff00;">Step 1: Use the Finder to locate and identify the Eye.</span>'), 1000);
                    setTimeout(() => updateGameMessage('<span style="color: #ffff00;">Step 2: When the Eye fully opens, position the Curtain (🪟) over it.</span>'), 2000);
                    setTimeout(() => updateGameMessage('<span style="color: #ffff00;">Step 3: Hold the CLOSE button to cover the Eye before it attacks!</span>'), 3000);
                    setTimeout(() => updateGameMessage('<span style="color: #00ffff;">TIP: Eyes progress 4x faster when under a closed curtain!</span>'), 4000);
                }, 3000);
            }
        } else if (rift.stage === 5 && !rift.attackedPlayer) {
            // Rift reached full size without being destroyed - attack!
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
        // Cooldown will start when player clicks respawn button
    }

    // Remove rift (no automatic respawn - handled by schedule)
    removeEnemy(rift.id);
}

/**
 * Checks for flashlight state transition (ON to OFF) and flashes rifts
 */
function checkFlashlightFlash() {
    const currentFlashlightState = isFlashlightOn();

    // Detect transition from ON to OFF (flash complete)
    if (previousFlashlightState && !currentFlashlightState) {
        const flashWin = getFlashlightWindow();
        if (flashWin && !flashWin.closed) {
            const flashBounds = {
                left: flashWin.screenX,
                top: flashWin.screenY,
                right: flashWin.screenX + flashWin.outerWidth,
                bottom: flashWin.screenY + flashWin.outerHeight
            };

            const flashedRifts = flashRiftsInView(flashBounds);

            // Show feedback for flashed rifts
            flashedRifts.forEach(rift => {
                if (rift.count >= 5) {
                    // Rift will be destroyed in checkRiftDefense
                    updateGameMessage(`<span style="color: #00ff00;">Rift destroyed with ${rift.count} flashes!</span>`);
                } else {
                    updateGameMessage(`Flashing rift... ${rift.count}/5 flashes`);
                }
            });
        }
    }

    previousFlashlightState = currentFlashlightState;
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
    if (flashWin && !flashWin.closed) {
        const enemyContainer = flashWin.document.getElementById('enemy-container');
        if (enemyContainer) {
            if (isFlashlightOn()) {
                // Flashlight is on - show enemies
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

                        sprite.className = 'enemy-sprite visible identified';
                        sprite.style.left = (enemy.x - flashBounds.left - 40) + 'px'; // Center the element
                        sprite.style.top = (enemy.y - flashBounds.top - 40) + 'px';
                        sprite.dataset.id = enemy.id;
                        enemyContainer.appendChild(sprite);
                    }
                });
            } else {
                // Flashlight is off - clear all sprites (return to pitch black)
                enemyContainer.innerHTML = '';
            }
        }
    }
}

/**
 * Creates edge arrow pointing to enemy in finder window
 * Uses omnidirectional sonar-style display on radar perimeter
 */
function createEdgeArrow(win, enemy, bounds) {
    const arrowEl = win.document.createElement('div');
    arrowEl.className = 'edge-arrow';

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    // Calculate angle from center to enemy
    const dx = enemy.x - centerX;
    const dy = enemy.y - centerY;
    const angle = Math.atan2(dy, dx);

    // Radar circle radius (125px from center, matching the 250px diameter radar)
    const radarRadius = 125;

    // Position arrow on the radar circle perimeter
    const arrowX = radarRadius * Math.cos(angle);
    const arrowY = radarRadius * Math.sin(angle);

    // Convert angle to degrees and rotate arrow to point toward enemy direction
    const angleDeg = (angle * 180 / Math.PI) + 90; // +90 to align with CSS arrow shape

    // Position relative to radar center (which is at 50% 50% of window)
    arrowEl.style.left = `calc(50% + ${arrowX}px)`;
    arrowEl.style.top = `calc(50% + ${arrowY}px)`;
    arrowEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;

    win.document.getElementById('edge-arrows').appendChild(arrowEl);
}

/**
 * Triggers rift explosion animation and removes sprite immediately
 */
function triggerRiftExplosion(riftId) {
    const flashWin = getFlashlightWindow();
    if (!flashWin || flashWin.closed) return;

    const enemyContainer = flashWin.document.getElementById('enemy-container');
    if (!enemyContainer) return;

    // Find the rift sprite
    const riftSprite = enemyContainer.querySelector(`[data-id="${riftId}"]`);
    if (!riftSprite) return;

    // Get position of the rift sprite
    const riftX = riftSprite.style.left;
    const riftY = riftSprite.style.top;

    // Remove the rift sprite immediately
    riftSprite.remove();

    // Create explosion at the same position
    const explosion = createRiftExplosion();
    explosion.style.left = riftX;
    explosion.style.top = riftY;
    enemyContainer.appendChild(explosion);

    // Remove explosion after animation completes (800ms)
    setTimeout(() => {
        explosion.remove();
    }, 800);
}

/**
 * Checks and triggers hand grab attacks
 */
function checkHandGrabAttack() {
    // Don't do hand grabs during tutorial
    if (gameState.tutorialMode) return;

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
    // Cooldown will start when player clicks respawn button
}

/**
 * Checks if player manually closed any windows and marks them as destroyed
 */
function checkManualWindowClosures() {
    const windows = [
        { name: 'finder', ref: getFinderWindow() },
        { name: 'flashlight', ref: getFlashlightWindow() },
        { name: 'curtain', ref: getCurtainWindow() }
    ];

    windows.forEach(window => {
        // If window reference exists but is closed, mark it as destroyed
        if (window.ref && window.ref.closed) {
            markWindowDestroyed(window.name);
        }
    });
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
        setWindowRespawnCooldown('finder', 30000); // 30 second cooldown starts NOW
        updateGameMessage('Finder respawned.');
    }
};

window.respawnFlashlightWindow = function() {
    if (canRespawnWindow('flashlight')) {
        respawnWindow('flashlight');
        setWindowRespawnCooldown('flashlight', 30000); // 30 second cooldown starts NOW
        updateGameMessage('Flashlight respawned.');
    }
};

window.respawnCurtainWindow = function() {
    if (canRespawnWindow('curtain')) {
        respawnWindow('curtain');
        setWindowRespawnCooldown('curtain', 30000); // 30 second cooldown starts NOW
        updateGameMessage('Curtain respawned.');
    }
};
