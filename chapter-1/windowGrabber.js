// windowGrabber.js - Hand grab and window destruction effects

/**
 * Injects the hand-grab horror sequence into a target window
 * @param {Window} targetWindow - The popup window to attack
 * @param {number} delay - Delay before starting animation (ms)
 * @returns {Promise} Resolves when window is closed
 */
export function grabAndDestroyWindow(targetWindow, delay = 1000) {
    return new Promise((resolve) => {
        if (!targetWindow || targetWindow.closed) {
            resolve();
            return;
        }

        setTimeout(() => {
            // Determine which side the window is on and grab from opposite side (longest travel)
            // If window is on left side, grab from right; if on right side, grab from left
            const screenMiddle = screen.width / 2;
            const windowX = targetWindow.screenX;
            const fromLeft = windowX >= screenMiddle;

            injectGrabSequence(targetWindow, fromLeft, resolve);
        }, delay);
    });
}

/**
 * Injects the complete grab sequence into the target window
 * @param {Window} win - Target window
 * @param {boolean} fromLeft - If true, hand comes from left; if false, from right
 * @param {function} onComplete - Callback when complete
 */
function injectGrabSequence(win, fromLeft, onComplete) {
    if (!win || win.closed) {
        onComplete();
        return;
    }

    // Inject styles and HTML elements
    const style = win.document.createElement('style');
    style.textContent = `
        .horror-hand {
            position: fixed;
            width: 500px;
            height: auto;
            pointer-events: none;
            z-index: 999995;
            transform-origin: center;
            opacity: 0;
            transition: left 1.2s ease-out, right 1.2s ease-out, opacity 0.3s;
        }

        .glass-shard {
            position: fixed;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(200, 200, 200, 0.8);
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999998;
        }

        .crack-canvas {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 999997;
            width: 100%;
            height: 100%;
        }
    `;
    win.document.head.appendChild(style);

    // Create hand element
    const hand = win.document.createElement('img');
    hand.className = 'horror-hand';
    // Use chapter-1/images path since hand sprites are in a different location
    hand.src = '../chapter-1/images/hand1.png';
    hand.onerror = function() {
        // Fallback: try alternate paths
        this.src = './chapter-1/images/hand1.png';
        this.onerror = function() {
            console.warn('Hand sprite not found, using placeholder');
            // Create a simple CSS-based hand as fallback
            this.style.width = '200px';
            this.style.height = '200px';
            this.style.background = 'radial-gradient(circle, #8B4513 60%, transparent 60%)';
            this.style.borderRadius = '50%';
        };
    };

    win.document.body.appendChild(hand);

    // Position hand based on direction
    hand.style.top = '50%';

    if (fromLeft) {
        // Hand comes from left (not mirrored)
        hand.style.left = '-550px';
        hand.style.transform = 'translateY(-50%)';
    } else {
        // Hand comes from right (mirrored)
        hand.style.right = '-550px';
        hand.style.transform = 'translateY(-50%) scaleX(-1)';
    }

    // Start animation sequence
    setTimeout(() => {
        // Phase 1: Hand enters
        hand.style.opacity = '1';

        if (fromLeft) {
            hand.style.left = '-50px';
        } else {
            hand.style.right = '-50px';
        }

        setTimeout(() => {
            // Phase 2: Hand closes/grabs
            hand.src = '../chapter-1/images/hand2.png';
            hand.onerror = function() {
                this.src = './chapter-1/images/hand2.png';
            };

            // Create broken glass effect
            const impactX = fromLeft
                ? win.innerWidth / 2 - win.innerWidth / 6  // Left side impact
                : win.innerWidth / 2 + win.innerWidth / 6; // Right side impact
            const impactY = win.innerHeight / 2;
            createBrokenGlassEffect(win, impactX, impactY);

            // Flash effect
            win.document.body.style.transition = 'filter 0.1s';
            win.document.body.style.filter = 'brightness(1.5) contrast(0.8)';
            setTimeout(() => {
                win.document.body.style.filter = 'none';
            }, 100);

            setTimeout(() => {
                // Phase 3: Drag window away
                dragWindowAway(win, fromLeft, onComplete);
            }, 700);
        }, 1200);
    }, 100);
}

/**
 * Creates broken glass crack and shard effects
 */
function createBrokenGlassEffect(win, centerX, centerY) {
    // Create canvas for cracks
    const canvas = win.document.createElement('canvas');
    canvas.className = 'crack-canvas';
    canvas.width = win.innerWidth;
    canvas.height = win.innerHeight;
    win.document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Draw impact point gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(220, 220, 220, 0.5)');
    gradient.addColorStop(1, 'rgba(180, 180, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fill();

    // Draw main cracks
    const mainCracks = 10;
    for (let i = 0; i < mainCracks; i++) {
        const angle = (360 / mainCracks) * i + (Math.random() - 0.5) * 30;
        const length = 150 + Math.random() * 200;
        drawCrack(ctx, centerX, centerY, angle, length, 5 + Math.random() * 3);

        // Add branch cracks
        const branches = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branches; b++) {
            const branchStart = 0.3 + Math.random() * 0.5;
            const branchX = centerX + Math.cos(angle * Math.PI / 180) * length * branchStart;
            const branchY = centerY + Math.sin(angle * Math.PI / 180) * length * branchStart;
            const branchAngle = angle + (Math.random() > 0.5 ? 40 : -40) + (Math.random() - 0.5) * 25;
            const branchLength = length * (0.4 + Math.random() * 0.4);
            drawCrack(ctx, branchX, branchY, branchAngle, branchLength, 2 + Math.random() * 2);
        }
    }

    // Create flying glass shards
    const shardCount = 35;
    for (let i = 0; i < shardCount; i++) {
        setTimeout(() => {
            createShard(win, centerX, centerY);
        }, i * 15);
    }
}

/**
 * Draws a single crack on the canvas
 */
function drawCrack(ctx, startX, startY, angle, length, width) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const segments = 6;
    let currentX = startX;
    let currentY = startY;
    let currentAngle = angle;

    for (let i = 0; i < segments; i++) {
        const segmentLength = length / segments;
        currentAngle += (Math.random() - 0.5) * 18;
        currentX += Math.cos(currentAngle * Math.PI / 180) * segmentLength;
        currentY += Math.sin(currentAngle * Math.PI / 180) * segmentLength;
        ctx.lineTo(currentX, currentY);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
}

/**
 * Creates a single flying glass shard
 */
function createShard(win, centerX, centerY) {
    const shard = win.document.createElement('div');
    shard.className = 'glass-shard';

    const size = 10 + Math.random() * 25;
    const angle = Math.random() * 360;
    const distance = 30 + Math.random() * 100;
    const startX = centerX + Math.cos(angle * Math.PI / 180) * distance;
    const startY = centerY + Math.sin(angle * Math.PI / 180) * distance;

    shard.style.width = size + 'px';
    shard.style.height = size + 'px';
    shard.style.left = startX + 'px';
    shard.style.top = startY + 'px';
    shard.style.clipPath = 'polygon(50% 0%, 100% 70%, 75% 100%, 25% 100%, 0% 70%)';

    win.document.body.appendChild(shard);

    // Animate shard flying away
    const throwAngle = angle + (Math.random() - 0.5) * 45;
    const throwDist = 150 + Math.random() * 400;
    const tx = Math.cos(throwAngle * Math.PI / 180) * throwDist;
    const ty = Math.sin(throwAngle * Math.PI / 180) * throwDist + Math.random() * 200;

    requestAnimationFrame(() => {
        shard.style.transition = 'all 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        shard.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 720 - 360}deg) scale(0.2)`;
        shard.style.opacity = '0';
    });
}

/**
 * Drags the window off-screen and closes it
 * @param {Window} win - Window to drag away
 * @param {boolean} fromLeft - Direction to drag (true = drag left, false = drag right)
 * @param {function} onComplete - Callback when complete
 */
function dragWindowAway(win, fromLeft, onComplete) {
    const startX = win.screenX;
    const startY = win.screenY;

    // Calculate target based on direction - use very far distances to ensure we hit boundaries
    const targetX = fromLeft ? -5000 : screen.width + 5000;

    const duration = 1500;
    const startTime = Date.now();
    const startWidth = win.outerWidth;
    const startHeight = win.outerHeight;

    let windowClosed = false;
    let stuckTime = null;
    let lastX = startX;
    const stuckThreshold = 3; // pixels - if window moves less than this, it's stuck

    function animate() {
        if (windowClosed) return;

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentX = startX + (targetX - startX) * eased;
        const wobbleY = Math.sin(progress * Math.PI * 3) * 20;

        try {
            win.resizeTo(startWidth, startHeight);
            win.moveTo(Math.round(currentX), Math.round(startY + wobbleY));

            // Check if window is stuck at boundary
            const actualX = win.screenX;
            const movedDistance = Math.abs(actualX - lastX);

            if (movedDistance < stuckThreshold && elapsed > 100) {
                // Window is stuck at boundary
                if (stuckTime === null) {
                    stuckTime = Date.now();
                } else if (Date.now() - stuckTime >= 200) {
                    // Been stuck for 200ms, close the window
                    windowClosed = true;
                    try {
                        win.close();
                    } catch (e) {
                        // Ignore close errors
                    }
                    onComplete();
                    return;
                }
            } else {
                // Window is still moving, reset stuck timer
                stuckTime = null;
            }

            lastX = actualX;

        } catch (e) {
            // Browser restrictions - start stuck timer
            if (!windowClosed) {
                if (stuckTime === null) {
                    stuckTime = Date.now();
                } else if (Date.now() - stuckTime >= 200) {
                    windowClosed = true;
                    try { win.close(); } catch (e) {}
                    onComplete();
                    return;
                }
            }
        }

        if (progress < 1 && !windowClosed) {
            requestAnimationFrame(animate);
        } else if (progress >= 1 && !windowClosed) {
            // Animation finished but window not closed yet, close it
            windowClosed = true;
            try { win.close(); } catch (e) {}
            onComplete();
        }
    }

    animate();
}

/**
 * Orchestrates the sequential destruction of both game windows
 * @param {Window} blueWindow - The blue game window
 * @param {Window} redWindow - The red game window
 * @returns {Promise} Resolves when both windows are destroyed
 */
export async function destroyBothWindows(blueWindow, redWindow) {
    // Destroy blue window first
    await grabAndDestroyWindow(blueWindow, 1000);

    // Then destroy red window
    await grabAndDestroyWindow(redWindow, 500);
}
