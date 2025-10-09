// paranormalGame.js - Core paranormal game logic

export let gameState = {
    playerHP: 3,
    maxHP: 3,
    enemies: [], // Array of active enemies {type: 'eye'|'rift', x, y, stage, identified, lastUpdate}
    scannerDisabled: false,
    scannerDisabledUntil: 0,
    windowRespawnCooldowns: {}, // {windowName: respawnAvailableTime}
    gameActive: false,
    gameStartTime: 0,
    nextHandGrabTime: 0,
    tutorialMode: true,
    tutorialRiftDefeated: false,
    tutorialEyeSpawned: false,
    postTutorialStartTime: 0, // When main game starts after tutorial
    gracePeriodActive: false, // Whether grace period is active
    gracePeriodUntil: 0, // When grace period ends
    timeBeforeGracePeriod: 0, // Store elapsed time when grace period started
    spawnSchedule: [
        { time: 5000, spawns: ['rift'] },
        { time: 20000, spawns: ['rift'] },
        { time: 30000, spawns: ['rift'] },
        { time: 40000, spawns: ['eye'] },
        { time: 50000, spawns: ['rift'] },
        { time: 65000, spawns: ['eye', 'rift'] },
        { time: 80000, spawns: ['eye', 'rift'] },
        { time: 92000, spawns: ['rift', 'rift'] },
        { time: 110000, spawns: ['eye', 'eye'] },
        { time: 112000, spawns: ['rift', 'rift'] },
    ],
    spawnedScheduleIndexes: [] // Track which scheduled spawns have already occurred
};

/**
 * Enemy configuration
 */
export const enemyConfig = {
    eye: {
        maxStage: 5,
        progressInterval: 8000, // 8 seconds per stage (40s total to fully open)
        sprites: ['eye1.png', 'eye2.png', 'eye3.png', 'eye4.png', 'eye5.png']
    },
    rift: {
        maxStage: 5,
        progressInterval: 7000, // 7 seconds per stage (35s total to fully grow)
        // No sprites - rendered with CSS/JS
    }
};

/**
 * Creates a new enemy at a random screen position
 */
export function spawnEnemy(type, sw, sh) {
    const enemy = {
        id: Math.random(),
        type: type,
        x: Math.random() * (sw - 400) + 200,
        y: Math.random() * (sh - 400) + 200,
        stage: 1,
        identified: false,
        lastUpdate: Date.now(),
        riftFlashCount: 0 // For rift enemy - tracks flashlight flashes
    };

    gameState.enemies.push(enemy);
    return enemy;
}

/**
 * Updates enemy progression
 */
export function updateEnemyStages() {
    const now = Date.now();

    gameState.enemies.forEach(enemy => {
        const config = enemyConfig[enemy.type];
        if (!config) return;

        // Check if enough time has passed to progress to next stage
        if (now - enemy.lastUpdate >= config.progressInterval && enemy.stage < config.maxStage) {
            enemy.stage++;
            enemy.lastUpdate = now;
        }
    });
}

/**
 * Marks an enemy as identified
 */
export function identifyEnemy(enemyId) {
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (enemy) {
        enemy.identified = true;
        return true;
    }
    return false;
}

/**
 * Increments flash count for identified rifts in the flashlight view
 * Returns array of rift IDs that were flashed
 */
export function flashRiftsInView(flashlightBounds) {
    const flashedRifts = [];

    gameState.enemies.forEach(enemy => {
        if (enemy.type !== 'rift' || !enemy.identified) return;

        const inView = enemy.x >= flashlightBounds.left && enemy.x <= flashlightBounds.right &&
                      enemy.y >= flashlightBounds.top && enemy.y <= flashlightBounds.bottom;

        if (inView) {
            enemy.riftFlashCount = (enemy.riftFlashCount || 0) + 1;
            flashedRifts.push({
                id: enemy.id,
                count: enemy.riftFlashCount
            });
        }
    });

    return flashedRifts;
}

/**
 * Removes an enemy from the game
 */
export function removeEnemy(enemyId) {
    const index = gameState.enemies.findIndex(e => e.id === enemyId);
    if (index !== -1) {
        gameState.enemies.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Disables scanner for specified duration
 */
export function disableScanner(durationMs) {
    gameState.scannerDisabled = true;
    gameState.scannerDisabledUntil = Date.now() + durationMs;
}

/**
 * Checks if scanner is still disabled
 */
export function updateScannerStatus() {
    if (gameState.scannerDisabled && Date.now() >= gameState.scannerDisabledUntil) {
        gameState.scannerDisabled = false;
    }
}

/**
 * Deals damage to player and triggers grace period
 */
export function damagePlayer(amount) {
    gameState.playerHP = Math.max(0, gameState.playerHP - amount);

    // Activate grace period when player takes damage
    if (gameState.playerHP > 0) {
        startGracePeriod();
    }

    return gameState.playerHP;
}

/**
 * Starts the grace period
 */
export function startGracePeriod() {
    gameState.gracePeriodActive = true;
    gameState.gracePeriodUntil = Date.now() + 5000; // 5 seconds

    // Store current elapsed time for timer pause
    if (gameState.postTutorialStartTime > 0) {
        gameState.timeBeforeGracePeriod = Date.now() - gameState.postTutorialStartTime;
    }
}

/**
 * Updates grace period status and resumes timer if ended
 */
export function updateGracePeriod() {
    if (gameState.gracePeriodActive && Date.now() >= gameState.gracePeriodUntil) {
        gameState.gracePeriodActive = false;

        // Resume timer by adjusting postTutorialStartTime
        if (gameState.postTutorialStartTime > 0 && gameState.timeBeforeGracePeriod > 0) {
            gameState.postTutorialStartTime = Date.now() - gameState.timeBeforeGracePeriod;
        }
    }
}

/**
 * Checks if player is dead
 */
export function isPlayerDead() {
    return gameState.playerHP <= 0;
}

/**
 * Resets an enemy to stage 1
 */
export function resetEnemy(enemyId) {
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (enemy) {
        enemy.stage = 1;
        enemy.lastUpdate = Date.now();
        enemy.identified = false;
        if (enemy.type === 'rift') {
            enemy.riftFlashCount = 0;
        }
    }
}

/**
 * Schedules next hand grab attack
 */
export function scheduleNextHandGrab() {
    const minDelay = 20000; // 20 seconds
    const maxDelay = 40000; // 40 seconds
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    gameState.nextHandGrabTime = Date.now() + delay;
}

/**
 * Checks if it's time for a hand grab attack
 */
export function shouldTriggerHandGrab() {
    if (Date.now() >= gameState.nextHandGrabTime && gameState.nextHandGrabTime > 0) {
        return true;
    }
    return false;
}

/**
 * Adds window to respawn cooldown
 */
export function setWindowRespawnCooldown(windowName, cooldownMs) {
    gameState.windowRespawnCooldowns[windowName] = Date.now() + cooldownMs;
}

/**
 * Checks if window can be respawned
 */
export function canRespawnWindow(windowName) {
    const cooldownEnd = gameState.windowRespawnCooldowns[windowName];
    if (!cooldownEnd) return true;
    return Date.now() >= cooldownEnd;
}

/**
 * Gets remaining cooldown for window respawn in seconds
 */
export function getRespawnCooldownRemaining(windowName) {
    const cooldownEnd = gameState.windowRespawnCooldowns[windowName];
    if (!cooldownEnd || Date.now() >= cooldownEnd) return 0;
    return Math.ceil((cooldownEnd - Date.now()) / 1000);
}

/**
 * Initializes game state
 */
export function initializeGame() {
    gameState.playerHP = gameState.maxHP;
    gameState.enemies = [];
    gameState.scannerDisabled = false;
    gameState.scannerDisabledUntil = 0;
    gameState.windowRespawnCooldowns = {};
    gameState.gameActive = true;
    gameState.gameStartTime = Date.now();
    gameState.nextHandGrabTime = 0;
    gameState.tutorialMode = true;
    gameState.tutorialRiftDefeated = false;
    gameState.tutorialEyeSpawned = false;
    gameState.postTutorialStartTime = 0;
    gameState.gracePeriodActive = false;
    gameState.gracePeriodUntil = 0;
    gameState.timeBeforeGracePeriod = 0;
    gameState.spawnedScheduleIndexes = [];
    scheduleNextHandGrab();
}
