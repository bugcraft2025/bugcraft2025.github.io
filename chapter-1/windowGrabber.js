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

        // Play screamthingy at low volume
        const screamAudio = new Audio('./media/screamthingy.ogg');
        screamAudio.volume = 0.2;
        screamAudio.play().catch(e => console.warn('Scream audio blocked:', e));

        setTimeout(() => {
            // Determine which side the window is on and grab from opposite side
            const screenMiddle = screen.width / 2;
            const windowX = targetWindow.screenX;
            const fromLeft = windowX >= screenMiddle;

            // Wrap resolve to stop scream audio when sequence completes
            const wrappedResolve = () => {
                screamAudio.pause();
                screamAudio.currentTime = 0;
                resolve();
            };

            injectGrabSequence(targetWindow, fromLeft, wrappedResolve);
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
            width: 895px;
            height: 664px;
            pointer-events: none;
            z-index: 999995;
            transform-origin: center center;
            opacity: 1;
            transition: none;
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
    hand.src = '../chapter-1/images/hand1.png';
    hand.onerror = function() {
        this.src = './chapter-1/images/hand1.png';
    };

    win.document.body.appendChild(hand);

    // Calculate center position
    const windowCenterX = win.innerWidth / 2;
    const windowCenterY = win.innerHeight / 2;
    const handCenterX = 447.5; // Center of 895px hand
    const handCenterY = 332; // Center of 664px hand

    // Phase 1: Show fingertips (15% = ~134px) peeking in, centered vertically
    const fingertipOffset = 895 * 0.15; // Show 15% of hand width

    if (fromLeft) {
        // Hand comes from left - show right edge (fingers)
        hand.style.left = (-895 + fingertipOffset) + 'px';
        hand.style.top = (windowCenterY - handCenterY) + 'px';
        hand.style.transform = 'none';
    } else {
        // Hand comes from right - show left edge (fingers when mirrored)
        hand.style.right = (-895 + fingertipOffset) + 'px';
        hand.style.top = (windowCenterY - handCenterY) + 'px';
        hand.style.transform = 'scaleX(-1)';
    }

    // Hold fingertips for 1 second
    setTimeout(() => {
        // Phase 2: RAPIDLY snap hand to center (violent entrance)
        hand.style.transition = 'left 0.25s ease-out, right 0.25s ease-out';

        if (fromLeft) {
            hand.style.left = (windowCenterX - handCenterX) + 'px';
        } else {
            hand.style.right = (windowCenterX - handCenterX) + 'px';
        }

        setTimeout(() => {
            // Phase 3: Immediately grab and crack (violent)
            // Switch to closed hand (hand2: 715x504, centered at 357.5, 252)
            hand.src = '../chapter-1/images/hand2.png';
            hand.onerror = function() {
                this.src = './chapter-1/images/hand2.png';
            };

            // Update size for hand2 but keep centered
            hand.style.width = '715px';
            hand.style.height = '504px';
            const hand2CenterX = 357.5;
            const hand2CenterY = 252;

            if (fromLeft) {
                hand.style.left = (windowCenterX - hand2CenterX) + 'px';
                hand.style.top = (windowCenterY - hand2CenterY) + 'px';
            } else {
                hand.style.right = (windowCenterX - hand2CenterX) + 'px';
                hand.style.top = (windowCenterY - hand2CenterY) + 'px';
            }

            // Glass break sound
            const glassbreakAudio = new Audio('./media/glassbreak.wav');
            glassbreakAudio.volume = 0.7;
            glassbreakAudio.play().catch(e => console.warn('Glassbreak audio blocked:', e));

            // Crack centered on window
            createBrokenGlassEffect(win, windowCenterX, windowCenterY);

            // Flash effect
            win.document.body.style.transition = 'filter 0.05s';
            win.document.body.style.filter = 'brightness(1.5) contrast(0.8)';
            setTimeout(() => {
                win.document.body.style.filter = 'none';
            }, 50);

            setTimeout(() => {
                // Phase 4: Play swoop and drag away violently
                const swoopExitAudio = new Audio('./media/swoop.mp3');
                swoopExitAudio.volume = 0.6;
                swoopExitAudio.play().catch(e => console.warn('Swoop exit audio blocked:', e));

                dragWindowAway(win, fromLeft, onComplete);
            }, 150);
        }, 250);
    }, 1000);
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

    const duration = 1000; // 1 second drag
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
        // More violent easing - accelerate quickly
        const eased = progress * progress * (3 - 2 * progress);

        const currentX = startX + (targetX - startX) * eased;
        const wobbleY = Math.sin(progress * Math.PI * 5) * 30; // More wobble

        try {
            win.resizeTo(startWidth, startHeight);
            win.moveTo(Math.round(currentX), Math.round(startY + wobbleY));

            // Check if window is stuck at boundary
            const actualX = win.screenX;
            const movedDistance = Math.abs(actualX - lastX);

            if (movedDistance < stuckThreshold && elapsed > 50) {
                // Window is stuck at boundary
                if (stuckTime === null) {
                    stuckTime = Date.now();
                } else if (Date.now() - stuckTime >= 50) {
                    // Been stuck for 50ms (reduced from 200ms), close the window
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
                } else if (Date.now() - stuckTime >= 50) {
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
