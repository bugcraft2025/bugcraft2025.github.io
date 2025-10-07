// riftVisual.js - Creates dynamic CSS/JS rift visuals

/**
 * Creates a rift visual element with the specified stage
 * @param {number} stage - Rift stage (1-5)
 * @returns {HTMLElement} - The rift container element
 */
export function createRiftElement(stage) {
    const container = document.createElement('div');
    container.className = 'rift-container';

    // Size grows with stage
    const baseSize = 40 + (stage * 15); // 55px at stage 1, 115px at stage 5
    container.style.width = baseSize + 'px';
    container.style.height = baseSize + 'px';

    // Create multiple layers for depth
    const layers = 3 + stage; // 4 layers at stage 1, 8 layers at stage 5

    for (let i = 0; i < layers; i++) {
        const layer = document.createElement('div');
        layer.className = 'rift-layer';

        const layerSize = baseSize * (1 - (i * 0.15));
        const rotationSpeed = 3 + (i * 2); // Different rotation speeds
        const direction = i % 2 === 0 ? 1 : -1; // Alternate directions
        const opacity = 0.6 - (i * 0.08);

        // Color shifts based on stage - darker and more chaotic
        const hue = 270 - (stage * 5); // Purple to darker purple
        const saturation = 70 + (stage * 5); // More saturated as it grows

        layer.style.width = layerSize + 'px';
        layer.style.height = layerSize + 'px';
        layer.style.background = `radial-gradient(circle,
            hsla(${hue}, ${saturation}%, 20%, ${opacity}) 0%,
            hsla(${hue - 20}, ${saturation}%, 10%, ${opacity * 0.8}) 40%,
            hsla(${hue - 40}, ${saturation}%, 5%, 0) 70%)`;
        layer.style.animation = `riftSpin${direction > 0 ? 'CW' : 'CCW'} ${rotationSpeed}s linear infinite`;
        layer.style.animationDelay = `-${i * 0.3}s`;

        container.appendChild(layer);
    }

    // Add distortion effect in center
    const core = document.createElement('div');
    core.className = 'rift-core';
    const coreSize = baseSize * 0.25;
    core.style.width = coreSize + 'px';
    core.style.height = coreSize + 'px';
    core.style.background = `radial-gradient(circle,
        hsla(280, 100%, 50%, ${0.3 + stage * 0.1}) 0%,
        hsla(270, 100%, 30%, ${0.2 + stage * 0.08}) 50%,
        transparent 100%)`;
    core.style.animation = `riftPulse ${1.5 - stage * 0.1}s ease-in-out infinite`;

    container.appendChild(core);

    // Add particle effects for higher stages
    if (stage >= 3) {
        const particleCount = (stage - 2) * 4;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'rift-particle';

            const angle = (360 / particleCount) * i;
            const distance = baseSize * 0.4;

            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}px)`;
            particle.style.animation = `riftParticle ${2 + Math.random()}s ease-in-out infinite`;
            particle.style.animationDelay = `-${Math.random() * 2}s`;

            container.appendChild(particle);
        }
    }

    // Add chaos tendrils for stage 5
    if (stage === 5) {
        for (let i = 0; i < 6; i++) {
            const tendril = document.createElement('div');
            tendril.className = 'rift-tendril';

            const angle = (360 / 6) * i;
            tendril.style.transform = `rotate(${angle}deg)`;
            tendril.style.animationDelay = `-${i * 0.2}s`;

            container.appendChild(tendril);
        }
    }

    return container;
}

/**
 * Creates a rift explosion animation element
 * @returns {HTMLElement} - The explosion container element
 */
export function createRiftExplosion() {
    const container = document.createElement('div');
    container.className = 'rift-explosion';

    // Create expanding rings
    for (let i = 0; i < 4; i++) {
        const ring = document.createElement('div');
        ring.className = 'explosion-ring';
        ring.style.animationDelay = `${i * 0.1}s`;
        container.appendChild(ring);
    }

    // Create particles
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        const angle = (360 / 12) * i;
        particle.style.setProperty('--angle', `${angle}deg`);
        particle.style.animationDelay = `${Math.random() * 0.2}s`;
        container.appendChild(particle);
    }

    // Create flash
    const flash = document.createElement('div');
    flash.className = 'explosion-flash';
    container.appendChild(flash);

    return container;
}

/**
 * Injects rift animation styles into the document
 * @param {Document} doc - The document to inject styles into
 */
export function injectRiftStyles(doc) {
    const styleId = 'rift-visual-styles';

    // Don't inject twice
    if (doc.getElementById(styleId)) return;

    const style = doc.createElement('style');
    style.id = styleId;
    style.textContent = `
        .rift-container {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: all;
            filter: blur(0.5px);
        }

        .rift-layer {
            position: absolute;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            mix-blend-mode: screen;
        }

        .rift-core {
            position: absolute;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            mix-blend-mode: screen;
            filter: blur(2px);
        }

        .rift-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(200, 100, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(200, 100, 255, 0.6);
        }

        .rift-tendril {
            position: absolute;
            width: 2px;
            height: 60px;
            background: linear-gradient(to bottom,
                rgba(150, 50, 200, 0.8) 0%,
                rgba(100, 20, 150, 0.4) 50%,
                transparent 100%);
            top: 50%;
            left: 50%;
            transform-origin: top center;
            animation: riftTendril 1.5s ease-in-out infinite;
            filter: blur(1px);
        }

        @keyframes riftSpinCW {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes riftSpinCCW {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        @keyframes riftPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
        }

        @keyframes riftParticle {
            0%, 100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateY(0px) scale(0); }
            50% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateY(-40px) scale(1); }
        }

        @keyframes riftTendril {
            0%, 100% { transform: rotate(0deg) scaleY(1); }
            33% { transform: rotate(-15deg) scaleY(1.2); }
            66% { transform: rotate(15deg) scaleY(0.9); }
        }

        .rift-explosion {
            position: absolute;
            width: 120px;
            height: 120px;
            pointer-events: none;
        }

        .explosion-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 100, 255, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: explosionRing 0.6s ease-out forwards;
        }

        .explosion-particle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background: rgba(255, 150, 255, 0.9);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(255, 100, 255, 0.8);
            animation: explosionParticle 0.8s ease-out forwards;
        }

        .explosion-flash {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 100, 255, 0.6) 30%, transparent 70%);
            transform: translate(-50%, -50%);
            animation: explosionFlash 0.4s ease-out forwards;
            border-radius: 50%;
        }

        @keyframes explosionRing {
            0% {
                width: 20px;
                height: 20px;
                opacity: 1;
            }
            100% {
                width: 120px;
                height: 120px;
                opacity: 0;
            }
        }

        @keyframes explosionParticle {
            0% {
                transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateY(0px);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateY(-60px);
                opacity: 0;
            }
        }

        @keyframes explosionFlash {
            0% {
                transform: translate(-50%, -50%) scale(0.3);
                opacity: 1;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.6;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.5);
                opacity: 0;
            }
        }
    `;

    doc.head.appendChild(style);
}
