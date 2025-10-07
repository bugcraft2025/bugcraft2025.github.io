// bombGame.js - Core bomb game logic

export let gameState = {
    level: 1,
    bombs: [],
    maxWindowSize: 0.3,
    timeLimit: 30,
    timeRemaining: 30,
    timerInterval: null,
    gameActive: false,
    maxLevels: 12,
    darknessPhase: 0 // 0 = normal (1-4), 1 = first darkening (5-8), 2 = second darkening (9-12)
};

// Color schemes for different darkness phases
export const colorSchemes = {
    0: { // Original colors (levels 1-4)
        redBg: 'rgba(255, 50, 50, 0.3)',
        blueBg: 'rgba(50, 50, 255, 0.3)',
        blueBomb: '#0088ff',
        blueBombBorder: '#0066cc',
        blueBombShadow: '#0088ff',
        redBomb: '#ff4444',
        redBombBorder: '#cc0000',
        redBombShadow: '#ff4444',
        yellow: '#ffff00',
        bodyBg: '#222'
    },
    1: { // First darkening (levels 5-8)
        redBg: 'rgba(191, 38, 38, 0.3)',
        blueBg: 'rgba(38, 38, 191, 0.3)',
        blueBomb: '#0066bb',
        blueBombBorder: '#004488',
        blueBombShadow: '#0066bb',
        redBomb: '#bb3333',
        redBombBorder: '#991111',
        redBombShadow: '#bb3333',
        yellow: '#bbbb00',
        bodyBg: '#1a1a1a'
    },
    2: { // Second darkening (levels 9-12)
        redBg: 'rgba(128, 25, 25, 0.3)',
        blueBg: 'rgba(25, 25, 128, 0.3)',
        blueBomb: '#004488',
        blueBombBorder: '#002244',
        blueBombShadow: '#004488',
        redBomb: '#882222',
        redBombBorder: '#660000',
        redBombShadow: '#882222',
        yellow: '#888800',
        bodyBg: '#111111'
    }
};

/**
 * Gets the number of bombs for a given level
 */
export function getBombCountForLevel(level) {
    if (level >= 1 && level <= 3) return 1;
    if (level >= 4 && level <= 6) return 2;
    if (level >= 7 && level <= 9) return 3;
    if (level >= 10 && level <= 11) return 4;
    if (level === 12) return 5;
    return 1; // default
}

/**
 * Gets the darkness phase for a given level
 */
export function getDarknessPhaseForLevel(level) {
    if (level >= 1 && level <= 4) return 0;
    if (level >= 5 && level <= 8) return 1;
    if (level >= 9 && level <= 12) return 2;
    return 0;
}

/**
 * Generates a single bomb at random screen coordinates
 */
export function generateBomb(color, sw, sh) {
    return {
        id: Math.random(),
        color: color,
        x: Math.random() * (sw - 200) + 100,
        y: Math.random() * (sh - 200) + 100,
        covered: false
    };
}

/**
 * Generates a bomb near a center point within a radius
 */
export function generateBombNear(center, radius, color) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.75;
    return {
        id: Math.random(),
        color: color,
        x: center.x + Math.cos(angle) * distance,
        y: center.y + Math.sin(angle) * distance,
        covered: false
    };
}

/**
 * Generates bombs for the current level
 */
export function generateBombsForLevel(level) {
    const sw = screen.width;
    const sh = screen.height;
    const maxWindowSize = sw * gameState.maxWindowSize;
    const clusterRadius = maxWindowSize * 0.6;
    const bombCount = getBombCountForLevel(level);

    const bombs = [];

    if (bombCount === 1) {
        // Single bomb, random color
        const color = Math.random() > 0.5 ? 'red' : 'blue';
        bombs.push(generateBomb(color, sw, sh));
    } else if (bombCount === 2) {
        // 1 red, 1 blue
        const redCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        const blueCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        bombs.push(generateBombNear(redCenter, 0, 'red'));
        bombs.push(generateBombNear(blueCenter, 0, 'blue'));
    } else if (bombCount === 3) {
        // 2 of one color, 1 of another
        const useMoreRed = Math.random() > 0.5;
        const redCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        const blueCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };

        if (useMoreRed) {
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(blueCenter, 0, 'blue'));
        } else {
            bombs.push(generateBombNear(redCenter, 0, 'red'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
        }
    } else if (bombCount === 4) {
        // 2 red, 2 blue
        const redCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        const blueCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
        bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
        bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
        bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
    } else if (bombCount === 5) {
        // 3 of one color, 2 of another
        const useMoreRed = Math.random() > 0.5;
        const redCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };
        const blueCenter = { x: Math.random() * (sw - 400) + 200, y: Math.random() * (sh - 400) + 200 };

        if (useMoreRed) {
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
        } else {
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(redCenter, clusterRadius, 'red'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
            bombs.push(generateBombNear(blueCenter, clusterRadius, 'blue'));
        }
    }

    return bombs;
}

/**
 * Time limits for each level (in seconds)
 * You can customize the timer for each level by changing these values
 */
const levelTimeLimits = [
    30, // Level 1
    25, // Level 2
    20, // Level 3
    25, // Level 4
    20, // Level 5
    15, // Level 6
    25, // Level 7
    22, // Level 8
    20, // Level 9
    25, // Level 10
    20, // Level 11
    25  // Level 12
];

/**
 * Gets the time limit for a given level
 */
export function getTimeLimitForLevel(level) {
    if (level >= 1 && level <= levelTimeLimits.length) {
        return levelTimeLimits[level - 1];
    }
    return 30; // default
}
