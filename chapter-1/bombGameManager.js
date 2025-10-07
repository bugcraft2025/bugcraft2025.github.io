// bombGameManager.js - Game flow control and manager

import {
    gameState,
    colorSchemes,
    getBombCountForLevel,
    getDarknessPhaseForLevel,
    generateBombsForLevel,
    getTimeLimitForLevel
} from './bombGame.js';

import {
    getStatusWindow,
    getRedWindow,
    getBlueWindow,
    openGameWindows,
    initializeWindowContent,
    updateWindowColors,
    updateDialogueText,
    createEdgeArrow,
    closeGameWindows,
    fadeWindowsToPitchBlack
} from './bombGameUI.js';

import { destroyBothWindows } from './windowGrabber.js';

let onGameCompleteCallback = null;

/**
 * Dialogue text for different game states
 */
const dialogueTexts = {
    level1: "Cover the bombs with the respective colored window before the time runs out.",
    level2: "Good. Continue the training. Keep moving.",
    level3: "Getting the hang of it?",
    level4: "Last one before things change...",
    level5: "<i>It's getting darker...</i> Can you feel it?",
    level6: "The shadows are spreading. Focus.",
    level7: "More threats in the dimness.",
    level8: "Harder to see now, isn't it?",
    level9: "<b>The darkness closes in.</b> Three more to go.",
    level10: "Almost there. Don't lose focus in the dark.",
    level11: "One more after this. The void watches.",
    level12: "<b>FINAL LEVEL.</b> In the dark... we are truly alone.",
    complete: "🎉 You survived the darkness. All threats neutralized.",
    failed: "💥 TIME'S UP! The darkness claimed you."
};

/**
 * Starts the bomb game
 */
export function startBombGame(onComplete) {
    onGameCompleteCallback = onComplete;

    openGameWindows();

    setTimeout(() => {
        initializeWindowContent();
        startLevel(1);
    }, 500);
}

/**
 * Starts a specific level
 */
function startLevel(level) {
    gameState.level = level;
    gameState.bombs = [];
    gameState.gameActive = true;

    // Update darkness phase
    const newDarknessPhase = getDarknessPhaseForLevel(level);
    const wasPhaseChange = newDarknessPhase !== gameState.darknessPhase;
    gameState.darknessPhase = newDarknessPhase;

    // Update window colors if phase changed
    if (wasPhaseChange) {
        updateWindowColors(gameState.darknessPhase);
    }

    // Set time limit based on level
    gameState.timeLimit = getTimeLimitForLevel(level);
    gameState.timeRemaining = gameState.timeLimit;

    // Get appropriate dialogue for this level
    const dialogueKey = `level${level}`;
    const dialogueText = dialogueTexts[dialogueKey] || `Level ${level}. Defuse all bombs!`;

    // Update status window
    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        statusWin.document.getElementById('levelText').textContent = `LEVEL ${level}`;
        updateDialogueText(dialogueText);
        statusWin.document.getElementById('timer').textContent = gameState.timeRemaining;
        statusWin.document.getElementById('timer').className = 'timer';
    }

    // Generate bombs for this level
    gameState.bombs = generateBombsForLevel(level);

    // Start timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.timerInterval = setInterval(updateTimer, 1000);

    // Start game loop
    updateGame();
}

/**
 * Updates the game timer
 */
function updateTimer() {
    if (!gameState.gameActive) return;

    gameState.timeRemaining--;

    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const timerEl = statusWin.document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = gameState.timeRemaining;

            if (gameState.timeRemaining <= 5) {
                timerEl.className = 'timer danger';
            } else if (gameState.timeRemaining <= 10) {
                timerEl.className = 'timer warning';
            }
        }
    }

    if (gameState.timeRemaining <= 0) {
        checkFinalState();
    }
}

/**
 * Main game loop - updates bomb positions and window states
 */
function updateGame() {
    if (!gameState.gameActive) return;

    const redWin = getRedWindow();
    const blueWin = getBlueWindow();

    if (!redWin || !blueWin) {
        console.error('Game windows not available');
        return;
    }

    const maxSize = screen.width * gameState.maxWindowSize;

    const redValid = redWin.outerWidth <= maxSize && redWin.outerHeight <= maxSize;
    const blueValid = blueWin.outerWidth <= maxSize && blueWin.outerHeight <= maxSize;

    // Show/hide size warnings
    if (redWin && redWin.document) {
        const redWarning = redWin.document.getElementById('warning');
        if (redWarning) redWarning.style.display = redValid ? 'none' : 'block';
    }

    if (blueWin && blueWin.document) {
        const blueWarning = blueWin.document.getElementById('warning');
        if (blueWarning) blueWarning.style.display = blueValid ? 'none' : 'block';
    }

    // Get window positions on screen
    const redBounds = {
        left: redWin.screenX,
        top: redWin.screenY,
        right: redWin.screenX + redWin.outerWidth,
        bottom: redWin.screenY + redWin.outerHeight,
        width: redWin.outerWidth,
        height: redWin.outerHeight
    };

    const blueBounds = {
        left: blueWin.screenX,
        top: blueWin.screenY,
        right: blueWin.screenX + blueWin.outerWidth,
        bottom: blueWin.screenY + blueWin.outerHeight,
        width: blueWin.outerWidth,
        height: blueWin.outerHeight
    };

    // Clear windows
    if (redWin && redWin.document) {
        redWin.document.getElementById('gameArea').innerHTML = '';
        redWin.document.getElementById('edgeArrows').innerHTML = '';
    }
    if (blueWin && blueWin.document) {
        blueWin.document.getElementById('gameArea').innerHTML = '';
        blueWin.document.getElementById('edgeArrows').innerHTML = '';
    }

    // Get current color scheme
    const currentColors = colorSchemes[gameState.darknessPhase];

    // Render bombs and edge arrows
    gameState.bombs.forEach(bomb => {
        if (bomb.color === 'blue') {
            // Blue bombs visible through RED window
            const inView = bomb.x >= redBounds.left && bomb.x <= redBounds.right &&
                           bomb.y >= redBounds.top && bomb.y <= redBounds.bottom;

            if (redValid && inView) {
                const bombEl = redWin.document.createElement('div');
                bombEl.className = 'bomb';
                bombEl.style.left = (bomb.x - redBounds.left) + 'px';
                bombEl.style.top = (bomb.y - redBounds.top) + 'px';
                bombEl.style.background = currentColors.blueBomb;
                bombEl.style.borderColor = currentColors.blueBombBorder;
                bombEl.style.boxShadow = `0 0 20px ${currentColors.blueBombShadow}`;
                bombEl.dataset.id = bomb.id;
                redWin.document.getElementById('gameArea').appendChild(bombEl);
            } else if (redValid) {
                // Show edge arrow pointing to bomb
                createEdgeArrow(redWin, bomb, redBounds, 'blue');
            }
        } else {
            // Red bombs visible through BLUE window
            const inView = bomb.x >= blueBounds.left && bomb.x <= blueBounds.right &&
                           bomb.y >= blueBounds.top && bomb.y <= blueBounds.bottom;

            if (blueValid && inView) {
                const bombEl = blueWin.document.createElement('div');
                bombEl.className = 'bomb';
                bombEl.style.left = (bomb.x - blueBounds.left) + 'px';
                bombEl.style.top = (bomb.y - blueBounds.top) + 'px';
                bombEl.style.background = currentColors.redBomb;
                bombEl.style.borderColor = currentColors.redBombBorder;
                bombEl.style.boxShadow = `0 0 20px ${currentColors.redBombShadow}`;
                bombEl.dataset.id = bomb.id;
                blueWin.document.getElementById('gameArea').appendChild(bombEl);
            } else if (blueValid) {
                // Show edge arrow pointing to bomb
                createEdgeArrow(blueWin, bomb, blueBounds, 'red');
            }
        }
    });

    // Check for covered bombs (for visual feedback only)
    if (redValid && blueValid) {
        gameState.bombs.forEach(bomb => {
            // Red bombs are defused by RED window, blue bombs by BLUE window
            const bounds = bomb.color === 'red' ? redBounds : blueBounds;

            if (bomb.x >= bounds.left && bomb.x <= bounds.right &&
                bomb.y >= bounds.top && bomb.y <= bounds.bottom) {
                bomb.covered = true;
            } else {
                bomb.covered = false;
            }
        });
    }

    if (gameState.gameActive) {
        setTimeout(updateGame, 100);
    }
}

/**
 * Checks if all bombs are covered at the end of countdown
 */
function checkFinalState() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);

    const redWin = getRedWindow();
    const blueWin = getBlueWindow();

    if (!redWin || !blueWin) {
        gameFailed();
        return;
    }

    const maxSize = screen.width * gameState.maxWindowSize;
    const redValid = redWin.outerWidth <= maxSize && redWin.outerHeight <= maxSize;
    const blueValid = blueWin.outerWidth <= maxSize && blueWin.outerHeight <= maxSize;

    if (!redValid || !blueValid) {
        gameFailed();
        return;
    }

    const redBounds = {
        left: redWin.screenX,
        top: redWin.screenY,
        right: redWin.screenX + redWin.outerWidth,
        bottom: redWin.screenY + redWin.outerHeight
    };

    const blueBounds = {
        left: blueWin.screenX,
        top: blueWin.screenY,
        right: blueWin.screenX + blueWin.outerWidth,
        bottom: blueWin.screenY + blueWin.outerHeight
    };

    let allCovered = true;

    gameState.bombs.forEach(bomb => {
        // Red bombs must be covered by RED window, blue bombs by BLUE window
        const bounds = bomb.color === 'red' ? redBounds : blueBounds;

        if (!(bomb.x >= bounds.left && bomb.x <= bounds.right &&
              bomb.y >= bounds.top && bomb.y <= bounds.bottom)) {
            allCovered = false;
        }
    });

    if (allCovered) {
        levelComplete();
    } else {
        gameFailed();
    }
}

/**
 * Handles level completion
 */
function levelComplete() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);

    if (gameState.level >= gameState.maxLevels) {
        // Level 12 complete - trigger horror sequence
        startPostLevel12Horror();
    } else {
        // Proceed to next level
        updateDialogueText("Level cleared! Preparing next mission...");
        setTimeout(() => startLevel(gameState.level + 1), 2000);
    }
}

/**
 * Horror sequence after level 12 completion
 */
async function startPostLevel12Horror() {
    const redWin = getRedWindow();
    const blueWin = getBlueWindow();

    // Step 1: Show completion message briefly
    updateDialogueText(dialogueTexts.complete);
    await sleep(2000);

    // Step 2: Fade windows to pitch black
    updateDialogueText("Wait... something's wrong...");
    await sleep(1500);

    fadeWindowsToPitchBlack();
    await sleep(1000);

    // Step 3: Darkness dialogue
    updateDialogueText("It's so dark... I can't see anything.");
    await sleep(2500);

    // Step 4: Alone dialogue with censored "they"
    updateDialogueText("When I am alone... In the dark... <censor>They</censor> appear.");
    await sleep(3000);

    // Step 5: Horror intensifies
    updateDialogueText("No... no no no... <censor>They're</censor> coming closer...");
    await sleep(2000);

    // Step 6: Windows get grabbed and destroyed one by one
    updateDialogueText("...");

    // Destroy both windows (blue first, then red)
    await destroyBothWindows(blueWin, redWin);

    // Step 7: Final message and callback
    await sleep(1000);
    updateDialogueText("They're gone. The windows... <censor>he</censor> took them.");

    setTimeout(() => {
        if (onGameCompleteCallback) {
            onGameCompleteCallback('success');
        }
    }, 3000);
}

/**
 * Utility sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handles game failure
 */
function gameFailed() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);

    updateDialogueText(dialogueTexts.failed);

    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const timerEl = statusWin.document.getElementById('timer');
        if (timerEl) timerEl.textContent = "FAILED";
    }

    setTimeout(() => {
        closeGameWindows();
        if (onGameCompleteCallback) {
            onGameCompleteCallback('failure');
        }
    }, 3000);
}

/**
 * Skip timer function (called from status window button)
 */
window.skipBombTimer = function() {
    if (!gameState.gameActive) return;
    gameState.timeRemaining = 0;

    const statusWin = getStatusWindow();
    if (statusWin && statusWin.document) {
        const timerEl = statusWin.document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = gameState.timeRemaining;
            timerEl.className = 'timer danger';
        }
    }

    checkFinalState();
};

/**
 * Win level function (called from status window button) - for debugging
 */
window.winBombLevel = function() {
    if (!gameState.gameActive) return;
    levelComplete();
};
