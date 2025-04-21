"use strict";

function animateScales() {
    const duration = 12000; // milliseconds

    const beam = document.querySelector("#beam");
    const lpan = document.querySelector("#lpan");
    const rpan = document.querySelector("#rpan");
    const lcoins = document.querySelector("#lcoins");
    const rcoins = document.querySelector("#rcoins");
    const coinSvg = `
        <rect x="0" y="0" width="60" height="10" fill="var(--color-coin-base)"/>
        <rect x="0" y="0" width="7.5" height="10" fill="var(--color-coin-dark)"/>
        <rect x="7.5" y="0" width="7.5" height="10" fill="var(--color-coin-glint)"/>
        <rect x="35" y="0" width="17.5" height="10" fill="var(--color-coin-dark)"/>
        <rect x="0" y="8.5" width="60" height="1.5" fill="var(--color-coin-bottom)"/>
        <rect x="7.5" y="8.5" width="7.5" height="1.5" fill="var(--color-coin-bottom-glint)"/>
    `;

    const easeInQuadratic = (start, end, progress) => {
        const diff = end - start;
        return start + diff * progress ** 2;
    }
    const addFewCoins = (progress) => {
        const coinsIndex = Math.min(Math.floor(progress * 10), 4);
        if (lcoins.children[coinsIndex]) return;
        const coinRelX = 10 * (Math.random() - 1);
        const coinRelY = -10 * coinsIndex;
        lcoins.insertAdjacentHTML("beforeend", `<g transform="translate(${coinRelX}, ${coinRelY})">${coinSvg}</g>`);
    }

    const easeInCubicBounce = (start, end, progress) => {
        const startBounce = 0.75; // value of progress to switch from easeInCubic to bounce
        const bounceHeight = 0.2;
        const bounceMiddle = (1 + startBounce) / 2;
        const diff = end - start;
        const easeInCubic = (x) => start + diff * (x / startBounce) ** 3;
        const bounce = (x) => start + (1 - bounceHeight) * diff + bounceHeight * diff * ((x - bounceMiddle)/(1 - bounceMiddle)) ** 2;
        return start > end ? Math.max(easeInCubic(progress), bounce(progress)) : Math.min(easeInCubic(progress), bounce(progress));
    }
    const addManyCoins = (progress) => {
        const coinsIndex = Math.min(Math.floor(progress * 30), 20);
        if (rcoins.children[coinsIndex]) return;
        const coinRelX = -55 + 55 * (coinsIndex % 3) + 10 * (Math.random() - 1);
        const coinRelY = -10 * Math.floor(coinsIndex / 3);
        rcoins.insertAdjacentHTML("beforeend", `<g transform="translate(${coinRelX}, ${coinRelY})">${coinSvg}</g>`);
    }

    const easeOutQuadratic = (start, end, progress) => {
        const diff = end - start;
        return start + 2 * diff * progress * (1 - progress / 2);
    }
    const removeCoins = (progress) => {
        lcoins.innerHTML = "";
        rcoins.innerHTML = "";
    }

    // visualisations of transition functions: https://www.desmos.com/calculator/q9l5mrxtrt
    const steps = [
        { angle: 0,           progress: 0,    transition: easeInQuadratic,   coinFunction: addFewCoins  },
        { angle: -Math.PI/15, progress: 0.2  },
        { angle: -Math.PI/15, progress: 0.4,  transition: easeInCubicBounce, coinFunction: addManyCoins },
        { angle: Math.PI/8,   progress: 0.55 },
        { angle: Math.PI/8,   progress: 0.75, transition: easeOutQuadratic,  coinFunction: removeCoins  },
        { angle: 0,           progress: 0.85 },
        { angle: 0,           progress: 1    }
    ];

    function animate(timestamp) {
        if (!animate.start) {
            animate.start = timestamp;
            removeCoins(); // in case the animation was paused
        }
        const elapsed = (timestamp - animate.start) % duration;
        const totalProgress = elapsed / duration;
        const currentIndex = steps.findIndex(step => totalProgress < step.progress) - 1;
        const currentStep = steps[currentIndex];
        const nextStep = steps[currentIndex + 1];
        const stepProgress = (totalProgress - currentStep.progress) / (nextStep.progress - currentStep.progress);

        // calculate beam angle using the transition function
        const currentAngle = currentStep.transition?.(currentStep.angle, nextStep.angle, stepProgress) ?? currentStep.angle;
        const beamRadius = 190;
        beam.style.transformOrigin = "280px 85px";
        beam.style.transform = `rotate(${currentAngle}rad)`;
        lpan.style.transform = `translate(
            ${beamRadius - beamRadius * Math.cos(-currentAngle)}px,
            ${beamRadius * Math.sin(-currentAngle)}px)
        `;
        rpan.style.transform = `translate(
            ${-beamRadius + beamRadius * Math.cos(currentAngle)}px,
            ${beamRadius * Math.sin(currentAngle)}px)
        `;

        // add or remove coins from the scale using the coin function
        currentStep.coinFunction?.(stepProgress);
        window.animation = requestAnimationFrame(animate);
    }
    window.animation = requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
    // start scales animation only when visible in viewport
    const scaleObserver = new IntersectionObserver((entries) => {
        cancelAnimationFrame(window.animation);
        if (entries[0].isIntersecting) {   
            animateScales();
        }
    });
    scaleObserver.observe(document.querySelector("#scales"));

    document.addEventListener("visibilitychange", () => {
        // a tab switch will prevent requestAnimationFrame from running which can cause coins to float
        // this restarts the animation on a tab switch
        cancelAnimationFrame(window.animation);
        if (!document.hidden) animateScales();
    });
});

