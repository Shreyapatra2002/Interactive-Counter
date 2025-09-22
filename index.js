// DOM Elements
const decreaseBtn = document.getElementById("decreaseBtn");
const resetBtn = document.getElementById("resetBtn");
const increaseBtn = document.getElementById("increaseBtn");
const counterProgram = document.getElementById("counterProgram");
const decreaseStepBtn = document.getElementById("decreaseStep");
const increaseStepBtn = document.getElementById("increaseStep");
const stepValue = document.getElementById("stepValue");
const historyList = document.getElementById("historyList");
const vibrationToggle = document.getElementById("vibrationToggle");
const presetButtons = document.querySelectorAll('.preset-btn');
const background = document.getElementById("background");

// Variables
let count = 0;
let step = 1;
let vibrationEnabled = true;
let history = [];
let backgroundShapes = [];
let touchStartY = 0;
let isScrolling = false;

// Initialize
updateCounterDisplay();
updateStepDisplay();
loadFromLocalStorage();
createBackgroundShapes();
animateBackground();

// Event Listeners
decreaseBtn.addEventListener("click", () => changeCount(-step));
increaseBtn.addEventListener("click", () => changeCount(step));
resetBtn.addEventListener("click", resetCount);
decreaseStepBtn.addEventListener("click", decreaseStep);
increaseStepBtn.addEventListener("click", increaseStep);
vibrationToggle.addEventListener("change", toggleVibration);

// Keyboard support
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") changeCount(-step);
    if (e.key === "ArrowUp") changeCount(step);
    if (e.key === "r" || e.key === "0") resetCount();
    if (e.key === "Escape") resetCount();
});

// Preset buttons
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const value = parseInt(button.dataset.value);
        changeCount(value);
    });
});

// Mouse move effect for background
document.addEventListener('mousemove', (e) => {
    moveBackgroundOnMouseMove(e);
});

// Touch move effect for background
document.addEventListener('touchmove', (e) => {
    moveBackgroundOnTouchMove(e);
});

// Improved touch swipe support for mobile
document.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
    isScrolling = false;
});

document.addEventListener('touchmove', e => {
    isScrolling = true;
});

document.addEventListener('touchend', e => {
    if (!isScrolling) {
        const touchEndY = e.changedTouches[0].screenY;
        const diffY = touchEndY - touchStartY;
        
        if (Math.abs(diffY) > 50) {
            if (diffY > 0) {
                changeCount(-step);
            } else {
                changeCount(step);
            }
            e.preventDefault();
        }
    }
});

// Functions
function changeCount(value) {
    count += value;
    addToHistory(value);
    updateCounterDisplay();
    animateCounter(value);
    saveToLocalStorage();
    animateBackgroundOnChange(value);
    
    if (vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate(50);
    }
}

function resetCount() {
    if (count === 0) return;
    
    addToHistory("RESET");
    count = 0;
    updateCounterDisplay();
    animateReset();
    saveToLocalStorage();
    animateBackgroundOnReset();
    
    if (vibrationEnabled && "vibrate" in navigator) {
        navigator.vibrate(100);
    }
}

function updateCounterDisplay() {
    counterProgram.textContent = count;
    
    if (count > 0) {
        counterProgram.className = "counter-positive";
    } else if (count < 0) {
        counterProgram.className = "counter-negative";
    } else {
        counterProgram.className = "counter-zero";
    }
}

function animateCounter(value) {
    gsap.fromTo(counterProgram, 
        { scale: 1.2, rotation: value > 0 ? -10 : 10 },
        { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.7)" }
    );
    
    const button = value > 0 ? increaseBtn : decreaseBtn;
    gsap.fromTo(button,
        { scale: 0.95 },
        { scale: 1, duration: 0.2 }
    );
    
    if (Math.abs(value) > 1) {
        const floatingText = document.createElement("div");
        floatingText.textContent = (value > 0 ? "+" : "") + value;
        floatingText.style.position = "absolute";
        floatingText.style.color = value > 0 ? "#4CAF50" : "#F44336";
        floatingText.style.fontSize = "2rem";
        floatingText.style.fontWeight = "bold";
        floatingText.style.pointerEvents = "none";
        floatingText.style.left = `${counterProgram.offsetLeft + counterProgram.offsetWidth/2}px`;
        floatingText.style.top = `${counterProgram.offsetTop + counterProgram.offsetHeight/2}px`;
        document.body.appendChild(floatingText);
        
        gsap.to(floatingText, {
            y: -50,
            opacity: 0,
            duration: 1,
            onComplete: () => document.body.removeChild(floatingText)
        });
    }
    
    if (count !== 0 && count % 10 === 0) {
        createConfetti();
    }
}

function animateReset() {
    gsap.fromTo(counterProgram,
        { scale: 0.5, rotation: 360 },
        { scale: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
    );
    
    gsap.fromTo(resetBtn,
        { scale: 0.9, backgroundColor: "#fff" },
        { scale: 1, backgroundColor: "inherit", duration: 0.3 }
    );
}

function decreaseStep() {
    if (step > 1) {
        step--;
        updateStepDisplay();
        animateStepChange();
        saveToLocalStorage();
    }
}

function increaseStep() {
    if (step < 10) {
        step++;
        updateStepDisplay();
        animateStepChange();
        saveToLocalStorage();
    }
}

function updateStepDisplay() {
    stepValue.textContent = step;
}

function animateStepChange() {
    gsap.fromTo(stepValue,
        { scale: 1.5 },
        { scale: 1, duration: 0.3, ease: "back.out(2)" }
    );
}

function toggleVibration() {
    vibrationEnabled = vibrationToggle.checked;
    saveToLocalStorage();
}

function addToHistory(action) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    let actionText;
    
    if (action === "RESET") {
        actionText = "Reset counter to 0";
    } else {
        actionText = `${action > 0 ? "Added" : "Subtracted"} ${Math.abs(action)}`;
    }
    
    history.unshift({
        time: timeString,
        action: actionText,
        value: count
    });
    
    if (history.length > 10) {
        history.pop();
    }
    
    updateHistoryDisplay();
    saveToLocalStorage();
}

function updateHistoryDisplay() {
    historyList.innerHTML = "";
    
    history.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${item.action}</span>
            <span class="history-time">${item.time}</span>
        `;
        historyList.appendChild(li);
    });
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        document.body.appendChild(confetti);
        
        gsap.to(confetti, {
            y: window.innerHeight + 10,
            x: "+=random(-100,100)",
            rotation: "random(0,360)",
            opacity: 0,
            duration: "random(1,3)",
            ease: "power1.out",
            onComplete: () => document.body.removeChild(confetti)
        });
    }
}

function createBackgroundShapes() {
    const shapes = ['circle', 'triangle', 'square'];
    const colors = ['#ff9a9e', '#fad0c4', '#a1c4fd', '#c2e9fb', '#ffecd2', '#fcb69f'];
    
    const isMobile = window.innerWidth <= 600;
    const shapeCount = isMobile ? 8 : 15;
    
    for (let i = 0; i < shapeCount; i++) {
        const shape = document.createElement('div');
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        
        shape.classList.add('shape');
        shape.classList.add(shapeType);
        
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        shape.style.left = `${left}%`;
        shape.style.top = `${top}%`;
        
        const size = isMobile ? (20 + Math.random() * 40) : (30 + Math.random() * 70);
        if (shapeType === 'circle') {
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
        } else if (shapeType === 'square') {
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
        } else if (shapeType === 'triangle') {
            shape.style.borderLeftWidth = `${size/2}px`;
            shape.style.borderRightWidth = `${size/2}px`;
            shape.style.borderBottomWidth = `${size * 0.866}px`;
            shape.style.borderBottomColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        if (shapeType !== 'triangle') {
            const color1 = colors[Math.floor(Math.random() * colors.length)];
            const color2 = colors[Math.floor(Math.random() * colors.length)];
            shape.style.background = `linear-gradient(45deg, ${color1}, ${color2})`;
        }
        
        shape.style.opacity = 0.2 + Math.random() * 0.3;
        
        background.appendChild(shape);
        backgroundShapes.push(shape);
    }
}

function animateBackground() {
    backgroundShapes.forEach((shape, index) => {
        const duration = 15 + Math.random() * 15;
        const delay = Math.random() * 5;
        
        gsap.to(shape, {
            y: "+=random(-50,50)",
            x: "+=random(-50,50)",
            rotation: "+=random(-180,180)",
            duration: duration,
            delay: delay,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });
    });
}

function animateBackgroundOnChange(value) {
    backgroundShapes.forEach((shape, index) => {
        const direction = value > 0 ? 1 : -1;
        
        gsap.to(shape, {
            y: `+=${20 * direction}`,
            x: `+=${10 * direction}`,
            rotation: `+=${45 * direction}`,
            duration: 0.5,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    });
}

function animateBackgroundOnReset() {
    backgroundShapes.forEach((shape, index) => {
        gsap.to(shape, {
            rotation: "+=360",
            duration: 1.5,
            ease: "elastic.out(1, 0.3)"
        });
    });
}

function moveBackgroundOnMouseMove(e) {
    const moveX = (e.clientX - window.innerWidth / 2) / 30;
    const moveY = (e.clientY - window.innerHeight / 2) / 30;
    
    backgroundShapes.forEach((shape, index) => {
        gsap.to(shape, {
            x: `+=${moveX}`,
            y: `+=${moveY}`,
            duration: 2,
            ease: "power2.out"
        });
    });
}

function moveBackgroundOnTouchMove(e) {
    const touch = e.touches[0];
    const moveX = (touch.clientX - window.innerWidth / 2) / 30;
    const moveY = (touch.clientY - window.innerHeight / 2) / 30;
    
    backgroundShapes.forEach((shape, index) => {
        gsap.to(shape, {
            x: `+=${moveX}`,
            y: `+=${moveY}`,
            duration: 2,
            ease: "power2.out"
        });
    });
}

function saveToLocalStorage() {
    const data = {
        count,
        step,
        vibrationEnabled,
        history
    };
    localStorage.setItem('counterApp', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('counterApp'));
    if (data) {
        count = data.count || 0;
        step = data.step || 1;
        vibrationEnabled = data.vibrationEnabled !== undefined ? data.vibrationEnabled : true;
        history = data.history || [];
        
        updateCounterDisplay();
        updateStepDisplay();
        updateHistoryDisplay();
        vibrationToggle.checked = vibrationEnabled;
    }
}