document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to navigation items on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    initHeroScrollGlitch();
    initScrollTextGlitch();
});

// Settings Modal
function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target === modal) {
        closeSettingsModal();
    }
}

// Copy citation to clipboard
function copyCitation(event) {
    const citationText = document.getElementById('citation-text').innerText;
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;

    // Try modern clipboard API first, with fallback
    const copyToClipboard = (text) => {
        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback method
            return new Promise((resolve, reject) => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error('Copy command failed'));
                    }
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            });
        }
    };

    copyToClipboard(citationText)
        .then(() => {
            // Show success feedback
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.backgroundColor = 'rgba(100, 255, 100, 0.3)';

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy citation:', err);
            button.innerHTML = '<i class="fas fa-times"></i> Failed';
            button.style.backgroundColor = 'rgba(255, 100, 100, 0.3)';

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.backgroundColor = '';
            }, 2000);
        });
}

function initHeroScrollGlitch() {
    const scrollSection = document.getElementById('hero-scroll');
    const stage = document.querySelector('[data-glitch-stage]');
    const bugSwarm = document.querySelector('[data-bug-swarm]');
    const crashModal = stage ? stage.querySelector('[data-crash-modal]') : null;

    if (!scrollSection || !stage || !bugSwarm) {
        return;
    }

    const bugCount = window.matchMedia('(max-width: 768px)').matches ? 4 : 7;
    const bugSprites = [];
    let crashVisible = false;

    const freezeStart = 0.4;
    const crashStart = 0.7;
    const completeStart = 0.995;

    for (let i = 0; i < bugCount; i++) {
        const bug = document.createElement('img');
        bug.src = 'figures/minecraft-bug.png';
        bug.alt = '';
        bug.className = 'glitch-bug';

        const x = 12 + Math.random() * 76;
        const y = 18 + Math.random() * 60;
        const revealStart = 0.08 + Math.random() * 0.45;
        const drift = 6 + Math.random() * 14;
        const spin = (Math.random() * 40 - 20);

        bug.style.setProperty('--bug-x', `${x}%`);
        bug.style.setProperty('--bug-y', `${y}%`);
        bug.dataset.revealStart = revealStart.toFixed(3);
        bug.dataset.drift = drift.toFixed(2);
        bug.dataset.spin = spin.toFixed(2);
        bug.dataset.phase = (Math.random() * Math.PI * 2).toFixed(3);

        bugSwarm.appendChild(bug);
        bugSprites.push(bug);
    }

    const clamp01 = value => Math.max(0, Math.min(1, value));
    let ticking = false;

    const updateGlitch = () => {
        ticking = false;

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        const sectionHeight = Math.max(scrollSection.offsetHeight, 1);
        const sectionTop = scrollSection.offsetTop;
        const start = sectionTop - viewportHeight * 0.6;
        const end = sectionTop + sectionHeight - viewportHeight * 0.3;
        const rawProgress = (scrollTop - start) / Math.max(end - start, 1);
        const progress = clamp01(rawProgress);

        stage.style.setProperty('--glitch-progress', progress.toFixed(3));

        const freezeProgress = progress >= freezeStart ? clamp01((progress - freezeStart) / Math.max(1 - freezeStart, 0.0001)) : 0;
        const crashProgress = progress >= crashStart ? clamp01((progress - crashStart) / Math.max(1 - crashStart, 0.0001)) : 0;

        const overlayStrength = clamp01(((progress - 0.05) * 1.5) + freezeProgress * 0.5);
        stage.style.setProperty('--glitch-overlay', overlayStrength.toFixed(3));

        const fadeStart = 0.94;
        const fadeRamp = progress <= fadeStart ? 0 : clamp01((progress - fadeStart) / Math.max(1 - fadeStart, 0.0001));
        const fade = Math.min(fadeRamp * 0.35, 0.35);
        stage.style.setProperty('--glitch-fade', fade.toFixed(3));

        const activeShiftFactor = progress >= freezeStart ? Math.max(0, 1 - freezeProgress * 0.85) : 1;
        let shiftIntensity = progress > 0.04 ? (progress - 0.04) * 16 * activeShiftFactor : 0;
        if (progress >= crashStart) {
            shiftIntensity *= 0.1;
        }

        const shiftX = shiftIntensity ? Math.sin(progress * Math.PI * 4) * shiftIntensity : 0;
        const shiftY = shiftIntensity ? Math.cos(progress * Math.PI * 3) * (shiftIntensity * 0.6) : 0;
        stage.style.setProperty('--glitch-shift-x', `${shiftX.toFixed(2)}px`);
        stage.style.setProperty('--glitch-shift-y', `${shiftY.toFixed(2)}px`);

        stage.classList.toggle('is-glitching', progress > 0.02);
        stage.classList.toggle('glitch-breakdown', progress > 0.24);
        stage.classList.toggle('glitch-fading', progress > fadeStart);
        stage.classList.toggle('glitch-freeze', progress >= freezeStart);
        stage.classList.toggle('glitch-crash', progress >= crashStart && progress < completeStart);
        stage.classList.toggle('glitch-complete', progress >= completeStart);

        if (progress >= completeStart) {
            stage.style.setProperty('--glitch-overlay', '0');
            stage.style.setProperty('--glitch-fade', '1');
        }

        if (crashModal) {
            const targetState = progress >= crashStart && progress < completeStart;
            if (crashVisible !== targetState) {
                crashModal.setAttribute('aria-hidden', targetState ? 'false' : 'true');
                crashVisible = targetState;
            }
        }

        const oscillation = progress * Math.PI * 6;

        bugSprites.forEach((bug, index) => {
            const revealStart = parseFloat(bug.dataset.revealStart);
            const drift = parseFloat(bug.dataset.drift);
            const spin = parseFloat(bug.dataset.spin);
            const phase = parseFloat(bug.dataset.phase);

            const local = clamp01((progress - revealStart) / 0.4);
            const eased = local * local * (3 - 2 * local); // Smoothstep for softer entry

            const activityDamp = progress >= freezeStart ? Math.max(0, 1 - freezeProgress * 0.85) : 1;
            const crashDamp = progress >= crashStart ? Math.max(0, 1 - crashProgress * 0.95) : 1;
            const motionDamp = activityDamp * crashDamp;

            const translateX = Math.sin(oscillation + phase + index * 0.35) * drift * eased * motionDamp;
            const translateY = Math.cos(oscillation * 0.8 + phase) * (drift * 0.6) * eased * motionDamp;
            const rotation = spin * eased * motionDamp;
            const baseScale = 0.45 + eased * 0.75;
            const scale = baseScale + (0.1 * motionDamp);

            bug.style.opacity = eased.toFixed(3);
            bug.style.transform = `translate(-50%, -50%) translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(2)})`;
        });
    };

    const requestTick = () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateGlitch);
        }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    updateGlitch();
}

function initScrollTextGlitch() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reduceMotion.matches) {
        return;
    }

    const selectors = [
        '.announcement-bar p',
        '#minecraft-hero .minecraft-paper-title p',
        '#minecraft-hero .minecraft-subtitle p',
        '#minecraft-hero .minecraft-footer p'
    ];

    const textElements = Array.from(document.querySelectorAll(selectors.join(',')))
        .filter(element => element && element.textContent.trim().length > 0);

    if (!textElements.length) {
        return;
    }

    const allowed = new Set(textElements);
    document.querySelectorAll('.scroll-glitch').forEach(element => {
        if (!allowed.has(element)) {
            element.classList.remove('scroll-glitch', 'is-glitching');
            element.removeAttribute('data-glitch-content');
        }
    });

    const timers = new WeakMap();

    const normaliseText = (text) => text.replace(/\s+/g, ' ').trim();

    textElements.forEach(element => {
        element.classList.add('scroll-glitch');

        if (!element.dataset.glitchContent) {
            element.dataset.glitchContent = normaliseText(element.textContent);
        }
    });

    const triggerGlitch = (element) => {
        const cached = timers.get(element);
        if (cached) {
            clearTimeout(cached);
        }

        element.dataset.glitchContent = normaliseText(element.textContent) || element.dataset.glitchContent || '';
        element.classList.add('is-glitching');

        const timeout = window.setTimeout(() => {
            element.classList.remove('is-glitching');
            timers.delete(element);
        }, 900);

        timers.set(element, timeout);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                triggerGlitch(entry.target);
            }
        });
    }, {
        threshold: 0.35,
        rootMargin: '0px 0px -10% 0px'
    });

    textElements.forEach(element => observer.observe(element));

    reduceMotion.addEventListener('change', (event) => {
        if (event.matches) {
            textElements.forEach(element => {
                const timer = timers.get(element);
                if (timer) {
                    clearTimeout(timer);
                }
                element.classList.remove('is-glitching');
                element.classList.remove('scroll-glitch');
            });
            observer.disconnect();
        }
    });
}

// Quiet console easter egg for curious explorers.
(() => {
    const secretBreath = Object.freeze({
        inhale: () => 'deeply',
        exhale: () => 'slowly',
        mantra: 'Sometimes all you need is to pause before the next fix.'
    });

    const calmLog = (air) => {
        if (air === secretBreath) {
            console.log('%cThe end is a beginning I said. All the tragedy I saw, that I tried to forget; of which the way remains a mystery. No way to refer anyone, I am stuck in the incomplete summaries of life - to lead a unplanned life.', 'color: #5e412f; font-style: italic;');

            // Activate the horror password system
            if (window.activateHorrorSequence) {
                window.activateHorrorSequence();
            }

            return { clarity: 'restored', focus: 'steady' };
        }

        console.warn('That does not feel like the right breath.');
        return undefined;
    };

    Object.defineProperty(window, 'breath', {
        value: secretBreath,
        writable: false,
        configurable: false,
        enumerable: false
    });

    Object.defineProperty(window, 'take', {
        value: function take(air) {
            if (air === undefined) {
                return undefined;
            }
            return calmLog(air);
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
})();

// Horror password sequence easter egg
(() => {
    const correctSequence = ['results', 'video', 'methodology', 'contact', 'abstract'];
    let currentProgress = [];
    let isUnlocked = false;
    let isActivated = false;

    const headerMap = {
        'results': 'Results',
        'video': 'Watch Our Video',
        'methodology': 'Methodology',
        'contact': 'Contact',
        'abstract': 'Abstract'
    };

    const glitchScreen = () => {
        document.body.style.animation = 'glitch-shake 0.3s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 300);
    };

    const createBloodDrip = () => {
        const drip = document.createElement('div');
        drip.style.cssText = `
            position: fixed;
            top: 0;
            left: ${Math.random() * 100}%;
            width: 2px;
            height: 0;
            background: linear-gradient(to bottom, rgba(139, 0, 0, 0.8), rgba(139, 0, 0, 0));
            pointer-events: none;
            z-index: 9999;
            animation: blood-drip 2s ease-out forwards;
        `;
        document.body.appendChild(drip);
        setTimeout(() => drip.remove(), 2000);
    };

    const wrongSequenceEffect = () => {
        glitchScreen();

        for (let i = 0; i < 5; i++) {
            setTimeout(() => createBloodDrip(), i * 100);
        }

        // Flash effect without using filters
        if (darknessOverlay) {
            darknessOverlay.style.background = 'red';
            darknessOverlay.style.opacity = '0.5';
            setTimeout(() => {
                darknessOverlay.style.background = 'black';
                darknessOverlay.style.opacity = '0';
            }, 500);
        }

        currentProgress = [];
    };

    let darknessOverlay = null;

    const createOrUpdateDarknessOverlay = (progressCount) => {
        if (!darknessOverlay) {
            darknessOverlay = document.createElement('div');
            darknessOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                pointer-events: none;
                z-index: 50000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(darknessOverlay);
        }

        // Calculate opacity based on progress (0 = no darkness, 1 = full black)
        const opacity = progressCount * 0.15; // 15% darker each click, max 75%
        darknessOverlay.style.opacity = opacity;
    };

    const correctClickEffect = (header, progressCount) => {
        header.style.color = '#8b0000';
        header.style.textShadow = '0 0 10px rgba(139, 0, 0, 0.8)';

        createBloodDrip();

        // Progressive darkening using overlay instead of filter
        createOrUpdateDarknessOverlay(progressCount);

        // Shake all sections
        const shakeIntensity = Math.min(progressCount, 5); // Cap at 5
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            // Disable any existing animations to prevent pop-up effect
            section.style.animation = 'none';
            // Force reflow
            void section.offsetWidth;
            // Apply shake animation
            section.style.animation = `section-shake-${shakeIntensity} 0.6s ease-in-out`;

            setTimeout(() => {
                section.style.animation = 'none';
            }, 600);
        });
    };

    const createFinalModal = () => {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99999 !important;
            cursor: pointer;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(20, 20, 20, 0.98);
            border: 3px solid #8b0000;
            padding: 40px;
            z-index: 100000 !important;
            font-family: 'Courier New', monospace;
            color: #ff4444;
            text-align: center;
            box-shadow: 0 0 50px rgba(139, 0, 0, 0.8);
            max-width: 500px;
            cursor: pointer;
        `;

        modal.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #8b0000;">WHY DON'T YOU CLOSE THE WINDOW NOW?</h2>
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                You've seen what you wanted to see.<br>
                There's nothing left here for you.<br><br>
                <span style="color: #666;">Just close it...</span>
            </p>
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        // Store backdrop reference
        modal._backdrop = backdrop;

        return modal;
    };

    const tvShutdown = () => {
        // Clear all HTML content
        document.body.innerHTML = '';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.background = 'black';

        // Re-add the animations since we cleared everything
        const style = document.createElement('style');
        style.textContent = `
            @keyframes tv-shutdown {
                0% {
                    opacity: 1;
                    transform: scaleY(1) scaleX(1);
                }
                50% {
                    opacity: 1;
                    transform: scaleY(0.01) scaleX(1);
                }
                100% {
                    opacity: 1;
                    transform: scaleY(0) scaleX(0);
                }
            }

            @keyframes fade-in {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Create TV shutdown overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 99999;
            pointer-events: none;
            animation: tv-shutdown 1.5s ease-out forwards;
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            // Show placeholder text after TV shuts down
            const textContainer = document.createElement('div');
            textContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #666;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                text-align: center;
                z-index: 100000;
                opacity: 0;
                animation: fade-in 3s ease-in forwards;
                line-height: 1.8;
            `;
            textContainer.innerHTML = `
                <p>You should have closed it when you had the chance.</p>
                <p style="margin-top: 30px; font-size: 14px; color: #555;">
                    Some doors, once opened, cannot be closed again.
                </p>
            `;
            document.body.appendChild(textContainer);

            // After showing text, transition to chapter-1 content
            setTimeout(() => {
                loadChapter1();
            }, 3000);
        }, 1500);
    };

    const loadChapter1 = () => {
        window.location.href = 'chapter-1/index.html';
    };

    const unlockHorror = () => {
        isUnlocked = true;

        // Pulse animation effect using sections instead of body
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.animation = 'horror-pulse 3s ease-in-out';
        });

        for (let i = 0; i < 20; i++) {
            setTimeout(() => createBloodDrip(), i * 80);
        }

        setTimeout(() => {
            sections.forEach(section => {
                section.style.animation = '';
            });

            // Increase darkness overlay
            if (darknessOverlay) {
                darknessOverlay.style.opacity = '0.5';
            }

            console.log('%c🩸 THE SEQUENCE IS COMPLETE 🩸', 'color: #8b0000; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px black;');
            console.log('%cYou have awakened something that should have remained hidden...', 'color: #5e412f; font-style: italic; font-size: 14px;');

            // Show final modal
            const finalModal = createFinalModal();

            // Make the final modal and backdrop clickable to dismiss it
            const dismissModal = () => {
                if (finalModal._backdrop && finalModal._backdrop.parentNode) {
                    finalModal._backdrop.remove();
                }
                if (finalModal.parentNode) {
                    finalModal.remove();
                }
            };

            finalModal.addEventListener('click', dismissModal);
            if (finalModal._backdrop) {
                finalModal._backdrop.addEventListener('click', dismissModal);
            }

            // Auto-dismiss the final modal after 5 seconds
            setTimeout(() => {
                dismissModal();
            }, 5000);

            // Make crash modal's "Close the program" button clickable
            const crashModal = document.querySelector('[data-crash-modal]');
            if (crashModal) {
                const closeButton = crashModal.querySelector('.crash-dialog__button:not(.crash-dialog__button--primary)');
                if (closeButton) {
                    closeButton.style.cursor = 'pointer';
                    closeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        tvShutdown();
                    });
                }
            }
        }, 2000);
    };

    const initPasswordHeaders = () => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitch-shake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-5px, -5px); }
                20% { transform: translate(5px, 5px); }
                30% { transform: translate(-5px, 5px); }
                40% { transform: translate(5px, -5px); }
                50% { transform: translate(-5px, -5px); }
                60% { transform: translate(5px, 5px); }
                70% { transform: translate(-5px, 5px); }
                80% { transform: translate(5px, -5px); }
                90% { transform: translate(-5px, -5px); }
            }

            @keyframes section-shake-1 {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(-2px, -2px); }
                50% { transform: translate(2px, 2px); }
                75% { transform: translate(-2px, 2px); }
            }

            @keyframes section-shake-2 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(-3px, -3px) rotate(-0.5deg); }
                50% { transform: translate(3px, 3px) rotate(0.5deg); }
                75% { transform: translate(-3px, 3px) rotate(-0.5deg); }
            }

            @keyframes section-shake-3 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-4px, -4px) rotate(-0.8deg); }
                40% { transform: translate(4px, 4px) rotate(0.8deg); }
                60% { transform: translate(-4px, 4px) rotate(-0.8deg); }
                80% { transform: translate(4px, -4px) rotate(0.8deg); }
            }

            @keyframes section-shake-4 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-5px, -5px) rotate(-1deg); }
                40% { transform: translate(5px, 5px) rotate(1deg); }
                60% { transform: translate(-5px, 5px) rotate(-1deg); }
                80% { transform: translate(5px, -5px) rotate(1deg); }
            }

            @keyframes section-shake-5 {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                15% { transform: translate(-6px, -6px) rotate(-1.5deg); }
                30% { transform: translate(6px, 6px) rotate(1.5deg); }
                45% { transform: translate(-6px, 6px) rotate(-1.5deg); }
                60% { transform: translate(6px, -6px) rotate(1.5deg); }
                75% { transform: translate(-6px, -6px) rotate(-1.5deg); }
            }

            @keyframes blood-drip {
                0% { height: 0; }
                100% { height: 100vh; opacity: 0; }
            }

            @keyframes horror-pulse {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(0.3) saturate(3) hue-rotate(30deg); }
            }

            @keyframes tv-shutdown {
                0% {
                    opacity: 1;
                    transform: scaleY(1) scaleX(1);
                }
                50% {
                    opacity: 1;
                    transform: scaleY(0.01) scaleX(1);
                }
                100% {
                    opacity: 1;
                    transform: scaleY(0) scaleX(0);
                }
            }

            @keyframes fade-in {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }

            .password-header {
                cursor: pointer;
                transition: all 0.3s ease;
                user-select: none;
            }

            .password-header:hover {
                text-shadow: 0 0 5px rgba(139, 0, 0, 0.3);
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);

        Object.entries(headerMap).forEach(([id, text]) => {
            const headers = Array.from(document.querySelectorAll('h2, h3'));
            // Match text content ignoring icons and extra whitespace
            const header = headers.find(h => h.textContent.replace(/\s+/g, ' ').trim().includes(text));

            if (header) {
                header.classList.add('password-header');
                header.dataset.passwordId = id;

                header.addEventListener('click', (e) => {
                    e.preventDefault();

                    if (!isActivated || isUnlocked) return;

                    const nextExpected = correctSequence[currentProgress.length];

                    if (id === nextExpected) {
                        currentProgress.push(id);
                        correctClickEffect(header, currentProgress.length);

                        if (currentProgress.length === correctSequence.length) {
                            unlockHorror();
                        }
                    } else {
                        wrongSequenceEffect();
                    }
                });
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordHeaders);
    } else {
        initPasswordHeaders();
    }

    // Expose activation function
    window.activateHorrorSequence = () => {
        isActivated = true;
        console.log('%cThe headers are watching...', 'color: #8b0000; font-style: italic;');
    };
})();
