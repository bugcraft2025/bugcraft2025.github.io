// clock.js
import { clockContainer } from './ui.js';

let hourHandElement = null;
let minuteHandElement = null;

/**
 * Creates the SVG elements for the clock and appends them to the container.
 */
function createClockSVG() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // --- Constants ---
    const cx = 50; // Center X
    const cy = 50; // Center Y
    const hourHandLength = 20; // Original length: 50(y1) - 30(y2)
    const minuteHandLength = 30; // Original length: 50(y1) - 20(y2)

    // --- Calculate angles for 18:22 ---
    // Clock angles are calculated clockwise from the 12 o'clock position (0 degrees).
    // 18:22 is 6:22 PM.
    const hours = 22;
    const minutes = 22;

    // Minute hand angle: (minutes / 60) * 360 degrees
    const minuteAngleDeg = (minutes / 60) * 360; // 22 * 6 = 132 degrees

    // Hour hand angle: ((hours % 12) / 12) * 360 + (minutes / 60) * 30 degrees
    const hourAngleDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * (360 / 12);
    // Simplified: (6 / 12) * 360 + (22 / 60) * 30 = 180 + 11 = 191 degrees

    // Convert degrees to radians for Math functions
    // Formula uses standard math angles (0 deg = positive X axis, CCW)
    // Conversion: angleRad = (clockAngleDeg - 90) * Math.PI / 180
    // OR use simpler formula for SVG coordinates directly from clock angle:
    // x = cx + length * sin(clockAngleRad)
    // y = cy - length * cos(clockAngleRad)  (minus because Y increases downwards)
    const minuteAngleRad = minuteAngleDeg * Math.PI / 180;
    const hourAngleRad = hourAngleDeg * Math.PI / 180;

    // Calculate end points (x2, y2)
    const hourX2 = cx + hourHandLength * Math.sin(hourAngleRad);
    const hourY2 = cy - hourHandLength * Math.cos(hourAngleRad);

    const minuteX2 = cx + minuteHandLength * Math.sin(minuteAngleRad);
    const minuteY2 = cy - minuteHandLength * Math.cos(minuteAngleRad);
    // --- End Calculations ---


    // Clock Face
    const face = document.createElementNS(svgNS, "circle");
    face.setAttribute("cx", cx.toString());
    face.setAttribute("cy", cy.toString());
    face.setAttribute("r", "45");
    face.classList.add("clock-face");
    svg.appendChild(face);

    // Center Dot
    const centerDot = document.createElementNS(svgNS, "circle");
    centerDot.setAttribute("cx", cx.toString());
    centerDot.setAttribute("cy", cy.toString());
    centerDot.setAttribute("r", "2");
    centerDot.classList.add("clock-center-dot");
    svg.appendChild(centerDot);

    // Numbers
    for (let i = 1; i <= 12; i++) {
        // Angle for number placement (0 at 3 o'clock, standard math angle)
        const angle = (i - 3) * (Math.PI / 6);
        const numX = cx + Math.cos(angle) * 38; // Radius 38 for numbers
        const numY = cy + Math.sin(angle) * 38;
        const num = document.createElementNS(svgNS, "text");
        num.setAttribute("x", numX.toString());
        num.setAttribute("y", numY.toString());
        num.classList.add("clock-number");
        num.textContent = i;
        svg.appendChild(num);
    }

    // Hour Hand (set to 18:22)
    const hourHand = document.createElementNS(svgNS, "line");
    hourHand.setAttribute("x1", cx.toString());
    hourHand.setAttribute("y1", cy.toString());
    hourHand.setAttribute("x2", hourX2.toFixed(3)); // Use calculated X2
    hourHand.setAttribute("y2", hourY2.toFixed(3)); // Use calculated Y2
    hourHand.classList.add("clock-hour-hand");
    hourHand.id = "hour-hand";
    // Note: CSS transform: rotate is no longer needed for initial position
    // but might still be used by animations. Adjust CSS if necessary.
    svg.appendChild(hourHand);

    // Minute Hand (set to 18:22)
    const minuteHand = document.createElementNS(svgNS, "line");
    minuteHand.setAttribute("x1", cx.toString());
    minuteHand.setAttribute("y1", cy.toString());
    minuteHand.setAttribute("x2", minuteX2.toFixed(3)); // Use calculated X2
    minuteHand.setAttribute("y2", minuteY2.toFixed(3)); // Use calculated Y2
    minuteHand.classList.add("clock-minute-hand");
    minuteHand.id = "minute-hand";
    // Note: CSS transform: rotate is no longer needed for initial position
    svg.appendChild(minuteHand);

    clockContainer.innerHTML = ''; // Clear previous clock if any
    clockContainer.appendChild(svg);

    // Store references for animation control
    hourHandElement = hourHand;
    minuteHandElement = minuteHand;
}
/**
 * Shows the clock container, creates the SVG if needed, and starts animations.
 */
export function showAndAnimateClock() {
    // Only create SVG if not already visible or needs recreation
    if (!clockContainer.classList.contains('visible') || !hourHandElement || !minuteHandElement) {
        createClockSVG();
    }
    clockContainer.classList.add('visible');

    // Use setTimeout to ensure the elements are rendered and class is applied before adding animation classes
    setTimeout(() => {
        // Check again if the clock is still supposed to be visible when the timeout triggers
        if (clockContainer.classList.contains('visible') && hourHandElement && minuteHandElement) {
            if (!hourHandElement.classList.contains('animate-hour')) {
                hourHandElement.classList.add('animate-hour');
            }
            if (!minuteHandElement.classList.contains('animate-minute')) {
                minuteHandElement.classList.add('animate-minute');
            }
        }
    }, 50); // Small delay
}

/**
 * Hides the clock container and removes animation classes.
 */
export function hideClock() {
    if (clockContainer.classList.contains('visible')) {
        clockContainer.classList.remove('visible');
        // Remove animation classes to reset state for next time
        if (hourHandElement) hourHandElement.classList.remove('animate-hour');
        if (minuteHandElement) minuteHandElement.classList.remove('animate-minute');
        // Optionally clear the SVG to save memory if clock isn't shown often
        // clockContainer.innerHTML = '';
        // hourHandElement = null;
        // minuteHandElement = null;
    }
}

/**
 * Checks if the clock is currently visible.
 * @returns {boolean}
 */
export function isClockVisible() {
    return clockContainer.classList.contains('visible');
}