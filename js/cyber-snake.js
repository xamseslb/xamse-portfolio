const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Størrelse på rutenettet
const gridSize = 20;
const tileCount = 30;
canvas.width = gridSize * tileCount;
canvas.height = gridSize * tileCount;

// Starter slangen i midten
let snake = [
    { x: 15, y: 15 },
    { x: 14, y: 15 },
    { x: 13, y: 15 }
];

// Startposisjon for maten
let food = { x: 10, y: 10 };

// Retning slangen beveger seg (dx, dy)
let dx = 1;
let dy = 0;

// Score og hastighet
let score = 0;
let baseSpeed = 120;
let currentSpeed = baseSpeed;

let gameRunning = true;
let lastRenderTime = 0;

// Definerer retninger
const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

let pendingDirection = null;

// Starter spillet på nytt
function init() {
    snake = [
        { x: 15, y: 15 },
        { x: 14, y: 15 },
        { x: 13, y: 15 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    currentSpeed = baseSpeed;
    gameRunning = true;
    pendingDirection = null;

    generateFood();
    updateScore();
    hideGameOver();

    lastRenderTime = 0;
    requestAnimationFrame(gameLoop);
}

// GAME LOOP ✅
function gameLoop(currentTime) {
    if (!gameRunning) return;

    requestAnimationFrame(gameLoop);

    const timeSinceLastRender = currentTime - lastRenderTime;
    if (timeSinceLastRender < currentSpeed) return;
    lastRenderTime = currentTime;

    update();
    draw();
}

// Oppdaterer spill-logikken
function update() {
    if (pendingDirection) {
        if (!(dx === -pendingDirection.x && dy === -pendingDirection.y)) {
            dx = pendingDirection.x;
            dy = pendingDirection.y;
        }
        pendingDirection = null;
    }

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        generateFood();
        currentSpeed = Math.max(40, baseSpeed - score * 3);
    } else {
        snake.pop();
    }
}

// Tegner alt på skjermen
function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.15)';
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;

        const gradient = ctx.createRadialGradient(
            x + gridSize / 2, y + gridSize / 2, 2,
            x + gridSize / 2, y + gridSize / 2, gridSize
        );

        if (index === 0) {
            gradient.addColorStop(0, '#00d4ff');
            gradient.addColorStop(1, '#0066ff');
        } else {
            gradient.addColorStop(0, '#0099ff');
            gradient.addColorStop(1, '#0044aa');
        }

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d4ff';

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    const x = food.x * gridSize + gridSize / 2;
    const y = food.y * gridSize + gridSize / 2;

    const gradient = ctx.createRadialGradient(x, y, 2, x, y, gridSize / 2);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(1, 'rgba(255, 0, 153, 0)');

    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00ff';

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function generateFood() {
    let newFood, valid = false;
    while (!valid) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        valid = !snake.some(s => s.x === newFood.x && s.y === newFood.y);
    }
    food = newFood;
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverModal').classList.add('show');
}

function hideGameOver() {
    document.getElementById('gameOverModal').classList.remove('show');
}

function changeDirection(newDirection) {
    if (pendingDirection) return;
    if (newDirection.x === -dx && newDirection.y === -dy) return;
    pendingDirection = newDirection;
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            changeDirection(DIRECTION.UP); break;
        case 'ArrowDown':
        case 's':
            changeDirection(DIRECTION.DOWN); break;
        case 'ArrowLeft':
        case 'a':
            changeDirection(DIRECTION.LEFT); break;
        case 'ArrowRight':
        case 'd':
            changeDirection(DIRECTION.RIGHT); break;

    }
});

document.getElementById('restartBtn').addEventListener('click', init);

// Start spill
init();
