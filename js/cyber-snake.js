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
let inputQueue = [];

