const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const scoreWrapper = document.getElementById('score-wrapper');
const highScoreDisplay = document.getElementById('high-score');
const centerBtn = document.getElementById('center-btn');

let drawing = false;
let points = [];
let centerX, centerY;
let targetRadius = 0;
let highestScore = parseFloat(localStorage.getItem('perfectCircleHighScore')) || 0.0;

// Initialize High Score Display
highScoreDisplay.innerText = highestScore.toFixed(1);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

window.addEventListener('resize', resize);
resize();

// Start Game Mode
centerBtn.addEventListener('click', () => {
    centerBtn.style.display = 'none';
    canvas.style.display = 'block';
    scoreWrapper.style.visibility = 'visible';
    resetGameSpace();
});

function resetGameSpace() {
    points = [];
    drawing = false;
    scoreDisplay.innerText = "0.0";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenterTarget();
}

function drawCenterTarget() {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
}

// Mouse & Touch Interaction Bindings
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', processDrawing);
window.addEventListener('mouseup', finishDrawing);

canvas.addEventListener('touchstart', (e) => { startDrawing(e.touches[0]); e.preventDefault(); });
canvas.addEventListener('touchmove', (e) => { processDrawing(e.touches[0]); e.preventDefault(); });
window.addEventListener('touchend', finishDrawing);

function startDrawing(e) {
    if (points.length > 0) return; 
    drawing = true;
    points = [];
    const x = e.clientX;
    const y = e.clientY;
    targetRadius = Math.hypot(x - centerX, y - centerY); // Set initial radius expectation
    points.push({ x, y, score: 100 });
}

function processDrawing(e) {
    if (!drawing) return;

    const x = e.clientX;
    const y = e.clientY;
    
    // Prevent drawing tracking if they just stall in one place
    const lastPoint = points[points.length - 1];
    if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 2) return;

    // Calculate accuracy of current node point
    const currentRadius = Math.hypot(x - centerX, y - centerY);
    const deviation = Math.abs(currentRadius - targetRadius);
    
    // Closer to 100 means lower variance
    const pointScore = Math.max(0, 100 - (deviation * 1.5));
    points.push({ x, y, score: pointScore });

    // Live scoring aggregate
    const totalScore = points.reduce((sum, p) => sum + p.score, 0);
    const liveAverage = totalScore / points.length;
    scoreDisplay.innerText = liveAverage.toFixed(1);

    renderCanvasPath();
}

function renderCanvasPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCenterTarget();

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i-1].x, points[i-1].y);
        ctx.lineTo(points[i].x, points[i].y);

        // Dynamic coloration system based on performance (Red -> Yellow -> Green/Blue)
        const segmentScore = points[i].score;
        if (segmentScore > 85) {
            ctx.strokeStyle = '#00e676'; // Crisp Green
        } else if (segmentScore > 65) {
            ctx.strokeStyle = '#ffeb3b'; // Warning Yellow
        } else {
            ctx.strokeStyle = '#ff1744'; // Error Red
        }
        ctx.stroke();
    }
}

function finishDrawing() {
    if (!drawing) return;
    drawing = false;

    if (points.length > 30) {
        const totalScore = points.reduce((sum, p) => sum + p.score, 0);
        const finalScore = totalScore / points.length;

        // Check if a new High Score record was made
        if (finalScore > highestScore) {
            highestScore = finalScore;
            localStorage.setItem('perfectCircleHighScore', highestScore);
            highScoreDisplay.innerText = highestScore.toFixed(1);
        }

        // Return button back to interface to allow simple cycle looping
        setTimeout(() => {
            centerBtn.innerText = "RETRY";
            centerBtn.style.display = 'block';
        }, 800);
    } else {
        resetGameSpace();
    }
}