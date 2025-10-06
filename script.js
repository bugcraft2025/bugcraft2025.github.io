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
            console.log('%cInhale... Exhale... You got this.', 'color: #5e412f; font-style: italic;');
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
            return calmLog(air === undefined ? secretBreath : air);
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
})();
