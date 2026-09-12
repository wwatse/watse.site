// Current time display
function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (!timeElement) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;
}

// Update "last updated" to show days ago
function updateLastUpdated() {
    const updatedElement = document.querySelector('.footer-updated span');
    if (!updatedElement) return;

    const lastUpdatedDate = new Date('2026-07-07');
    const today = new Date('2026-07-07'); // Fixed date for consistency
    const daysAgo = Math.floor((today - lastUpdatedDate) / (1000 * 60 * 60 * 24));

    if (daysAgo === 0) {
        updatedElement.textContent = 'today';
    } else if (daysAgo === 1) {
        updatedElement.textContent = '1 day ago';
    } else {
        updatedElement.textContent = `${daysAgo} days ago`;
    }
}

// Rotate status messages
function rotateStatusMessages() {
    const statusItems = document.querySelectorAll('.status-item');
    if (statusItems.length === 0) return;

    const messages = [
        { label: 'working on:', value: 'personal projects and exploring design systems' },
        { label: 'learning:', value: 'advanced design patterns and web standards' },
        { label: 'thinking about:', value: 'minimalism and intentional design' },
        { label: 'currently:', value: 'focused and inspired' },
        { label: 'building:', value: 'thoughtfully typeset digital experiences' }
    ];

    // Shuffle array
    const shuffled = [...messages].sort(() => Math.random() - 0.5);

    // Update visible status items
    statusItems.forEach((item, index) => {
        if (index < shuffled.length) {
            const label = item.querySelector('.status-label');
            const value = item.querySelector('.status-value');
            label.textContent = shuffled[index].label;
            value.textContent = shuffled[index].value;
        }
    });
}

// Fade in sections on page load
function fadeInSections() {
    const sections = document.querySelectorAll('section, .column, .post-row, .list-item');
    sections.forEach((el, index) => {
        el.style.animation = `fadeIn 0.3s ease-out ${index * 0.05}s forwards`;
        el.style.opacity = '0';
    });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only trigger on key press, not while typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // G for Games (projects page is the closest existing section)
        if (e.key === 'g' || e.key === 'G') {
            window.location.href = 'projects.html';
        }
        // W for Writing
        if (e.key === 'w' || e.key === 'W') {
            window.location.href = 'writing.html';
        }
        // P for Projects
        if (e.key === 'p' || e.key === 'P') {
            window.location.href = 'projects.html';
        }
        // H for Home
        if (e.key === 'h' || e.key === 'H') {
            window.location.href = 'index.html';
        }
        // A for About
        if (e.key === 'a' || e.key === 'A') {
            window.location.href = 'about.html';
        }
        // C for Contact
        if (e.key === 'c' || e.key === 'C') {
            window.location.href = 'contact.html';
        }
        // U for Uses
        if (e.key === 'u' || e.key === 'U') {
            window.location.href = 'uses.html';
        }
        // N for Now
        if (e.key === 'n' || e.key === 'N') {
            window.location.href = 'now.html';
        }
        // O for Colophon
        if (e.key === 'o' || e.key === 'O') {
            window.location.href = 'colophon.html';
        }
        // K for Command palette (or other navigation)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showCommandPalette();
        }
    });
}

// Simple command palette
function showCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (!palette) createCommandPalette();

    const palette2 = document.getElementById('command-palette');
    palette2.classList.toggle('visible');

    if (palette2.classList.contains('visible')) {
        const input = palette2.querySelector('input');
        if (input) input.focus();
    }
}

// Create command palette
function createCommandPalette() {
    const palette = document.createElement('div');
    palette.id = 'command-palette';
    palette.innerHTML = `
        <div class="command-palette-content">
            <div class="command-palette-header">
                <input type="text" placeholder="type to navigate... (type ? for help)" class="command-input" autofocus>
            </div>
            <div class="command-palette-list">
                <div class="command-item" data-link="index.html">← home</div>
                <div class="command-item" data-link="about.html">about</div>
                <div class="command-item" data-link="projects.html">projects</div>
                <div class="command-item" data-link="writing.html">writing</div>
                <div class="command-item" data-link="contact.html">contact</div>
                <div class="command-item" data-link="uses.html">uses</div>
                <div class="command-item" data-link="now.html">now</div>
                <div class="command-item" data-link="colophon.html">colophon</div>
            </div>
        </div>
    `;
    document.body.appendChild(palette);

    const input = palette.querySelector('.command-input');
    const items = palette.querySelectorAll('.command-item');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            palette.classList.remove('visible');
        }
        if (e.key === 'Enter') {
            const selected = palette.querySelector('.command-item.selected');
            if (selected) {
                window.location.href = selected.dataset.link;
            }
        }
    });

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        items.forEach(item => {
            if (query === '?') {
                item.style.display = 'block';
            } else if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    items.forEach(item => {
        item.addEventListener('click', () => {
            window.location.href = item.dataset.link;
        });
    });
}

// Smooth page transitions
function setupPageTransitions() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        if (link.target === '_blank') return;
        if ((link.getAttribute('href') || '').startsWith('#')) return;
        if (!link.href.startsWith(window.location.origin)) return;

        e.preventDefault();
        document.body.style.animation = 'fadeOut 0.15s ease-out forwards';
        setTimeout(() => {
            window.location.href = link.href;
        }, 150);
    });

    // Fade in on page load
    window.addEventListener('pageshow', () => {
        document.body.style.animation = 'fadeIn 0.15s ease-out forwards';
    });
}

// Interactive Companion
function setupCompanion() {
    const companion = document.createElement('div');
    companion.id = 'pixel-companion';
    document.body.appendChild(companion);

    const states = {
        idle: 0,
        blink: -32,
        lookLeft: -64,
        lookRight: -96,
        walk1: -128,
        walk2: -160,
        wave1: -192,
        wave2: -224,
        sit: -256
    };

    let currentState = 'idle';
    let positionX = Math.min(window.innerWidth - 60, 600); // Start towards the right
    let direction = -1; // -1 for left, 1 for right
    let isHovered = false;
    let activityTimer = null;

    function setFrame(frameName) {
        companion.style.backgroundPosition = `${states[frameName]}px 0px`;
    }

    // Default positioning logic
    companion.style.bottom = '0px'; // Sit right on the bottom edge
    companion.style.left = `${positionX}px`;

    function updateTransform() {
        companion.style.transform = `scaleX(${direction === 1 ? -1 : 1})`;
        companion.style.left = `${positionX}px`;
    }

    let isWalking = false;
    let walkInterval = null;

    function startWalking() {
        if (isHovered || isWalking) return;
        isWalking = true;
        direction = Math.random() > 0.5 ? 1 : -1;
        updateTransform();

        let step = 0;
        const walkTarget = positionX + (direction * (100 + Math.random() * 200));

        walkInterval = setInterval(() => {
            if (isHovered) {
                stopWalking();
                return;
            }

            positionX += direction * 8; // Move 8 pixels per frame
            step++;
            setFrame(step % 2 === 0 ? 'walk1' : 'walk2');
            updateTransform();

            // Boundaries
            if (positionX < 10) { positionX = 10; stopWalking(); }
            if (positionX > window.innerWidth - 42) { positionX = window.innerWidth - 42; stopWalking(); }

            if ((direction === 1 && positionX >= walkTarget) || (direction === -1 && positionX <= walkTarget)) {
                stopWalking();
            }
        }, 150);
    }

    function stopWalking() {
        isWalking = false;
        clearInterval(walkInterval);
        setFrame('idle');
        resetActivityTimer();
    }

    function triggerAction() {
        if (isHovered || isWalking) return;
        const rand = Math.random();
        if (rand < 0.4) {
            // Look around
            setFrame('lookLeft');
            setTimeout(() => {
                if (isHovered || isWalking) return;
                setFrame('lookRight');
                setTimeout(() => {
                    if (isHovered || isWalking) return;
                    setFrame('idle');
                }, 800);
            }, 800);
        } else if (rand < 0.7) {
            // Blink
            setFrame('blink');
            setTimeout(() => {
                if (isHovered || isWalking) return;
                setFrame('idle');
            }, 200);
        } else if (rand < 0.9) {
            // Walk
            startWalking();
        } else {
            // Sit
            setFrame('sit');
            setTimeout(() => {
                if (isHovered || isWalking) return;
                setFrame('idle');
            }, 2000);
        }
    }

    function resetActivityTimer() {
        clearInterval(activityTimer);
        activityTimer = setInterval(triggerAction, 3000 + Math.random() * 4000);
    }

    // Hover interaction
    let waveInterval;
    companion.addEventListener('mouseenter', () => {
        isHovered = true;
        clearInterval(walkInterval);
        clearInterval(activityTimer);
        isWalking = false;

        // Wave animation
        let waveStep = 0;
        waveInterval = setInterval(() => {
            setFrame(waveStep % 2 === 0 ? 'wave1' : 'wave2');
            waveStep++;
        }, 200);
    });

    companion.addEventListener('mouseleave', () => {
        isHovered = false;
        clearInterval(waveInterval);
        setFrame('idle');
        resetActivityTimer();
    });

    resetActivityTimer();
    updateTransform();
}

// Easter Eggs
function setupEasterEggs() {
    // 1. Konami Code
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    // 2. Typing "hello"
    const helloCode = ['h', 'e', 'l', 'l', 'o'];
    let helloIndex = 0;

    document.addEventListener('keydown', (e) => {
        // Konami code check
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                konamiIndex = 0;
                triggerKonami();
            }
        } else {
            konamiIndex = 0;
            if (e.key === konamiCode[0]) konamiIndex = 1;
        }

        // Hello check
        if (e.key.toLowerCase() === helloCode[helloIndex]) {
            helloIndex++;
            if (helloIndex === helloCode.length) {
                helloIndex = 0;
                triggerHello();
            }
        } else {
            helloIndex = 0;
            if (e.key.toLowerCase() === helloCode[0]) helloIndex = 1;
        }

        // 5. Hidden Keyboard Shortcut: Ctrl + Shift + E
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            triggerShortcutEgg();
        }
    });

    function triggerKonami() {
        document.body.style.transition = 'filter 1s ease';
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        showToast("konami code activated! 🎮");
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 5000);
    }

    function triggerHello() {
        const companion = document.getElementById('pixel-companion');
        if (companion) {
            companion.style.transition = 'transform 0.3s ease';
            companion.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                companion.style.transform = 'translateY(0)';
            }, 300);
        }
        showToast("hello human! 👾");
    }

    function triggerShortcutEgg() {
        showToast("you found the secret shortcut! 🤫");
    }

    // 3. Clicking the logo multiple times
    const logo = document.querySelector('.name');
    if (logo) {
        let clickCount = 0;
        let clickTimer;
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 5) {
                clickCount = 0;
                showToast("“Design is intelligence made visible.” — Alina Wheeler");
            } else {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            }
        });
    }

    // 4. Hovering over pixel art
    const pixelAccents = document.querySelectorAll('.pixel-accent');
    pixelAccents.forEach(accent => {
        accent.style.pointerEvents = 'auto';

        // Save original transform to re-apply it along with the hover effect
        const style = window.getComputedStyle(accent);
        // The transform from CSS class might be 'rotate(15deg)' etc.
        // It's safer to just let CSS handle transitions, but we'll manually apply a scale.
        // To not overwrite CSS transforms easily, we will add a wrapper or just use CSS classes.
        // A simpler way: just let it bounce.

        accent.addEventListener('mouseenter', () => {
            accent.style.transition = 'margin-top 0.2s ease-out';
            accent.style.marginTop = '-5px';
        });
        accent.addEventListener('mouseleave', () => {
            accent.style.marginTop = '0px';
        });
    });

    // Simple toast notification system
    function showToast(message) {
        let toast = document.getElementById('easter-egg-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'easter-egg-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'black';
            toast.style.color = 'white';
            toast.style.padding = '10px 20px';
            toast.style.fontFamily = "'Courier Prime', monospace";
            toast.style.fontSize = '14px';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '9999';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.pointerEvents = 'none';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        if (toast.hideTimeout) clearTimeout(toast.hideTimeout);

        toast.hideTimeout = setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    updateLastUpdated();
    rotateStatusMessages();
    fadeInSections();
    setupKeyboardShortcuts();
    setupPageTransitions();
    setupCompanion();
    setupEasterEggs();

    // Update time every minute
    setInterval(updateTime, 60000);
});
