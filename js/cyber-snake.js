// Henter canvas-elementet fra HTML og får 2D-tegnekonteksten
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Størrelse på rutenettet
const gridSize = 20; // Hvor store rutene er
const tileCount = 30; // Hvor mange ruter i bredden/høyden
canvas.width = gridSize * tileCount; // Setter bredden på canvas
canvas.height = gridSize * tileCount; // Setter høyden

// Starter slangen midt på brettet
let snake = [
    { x: 15, y: 15 },
    { x: 14, y: 15 },
    { x: 13, y: 15 }
];

// Startposisjon for maten
let food = { x: 10, y: 10 };

// Retningen slangen beveger seg (x og y endringer)
let dx = 1; // beveger seg mot høyre
let dy = 0; // ingen vertikal bevegelse

// Variabler for poeng og hastighet
let score = 0;
let baseSpeed = 120; // startfart (lavere = raskere)
let currentSpeed = baseSpeed; // oppdatert fart som endres underveis

let gameRunning = true; // om spillet kjører eller ikke
let lastRenderTime = 0; // for å kontrollere oppdateringsfrekvensen

// Definerer retninger som objekter for enkel bruk
const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

let pendingDirection = null; // ny retning som venter på å brukes

// Variabler for lyd
let audioContext;
let eatSound, gameOverSound, startSound, levelUpSound;
let soundsLoaded = false;

// Partikkel-system (for effekter når man spiser)
let particles = [];

// Mat-animasjon (for pulsering og farge)
let foodPulse = 0;
let foodHue = 0;

// Slange-glød-effekt
let snakeTrails = [];

// Bakgrunns-animasjon
let backgroundPulse = 0;

// Funksjon for å laste inn lydene
function loadSounds() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Lager enkel "spiselyd"
        eatSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        };

        // Game over lyd
        gameOverSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        };

        // Start lyd når spillet begynner
        startSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        };

        // Level up lyd
        levelUpSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        };

        soundsLoaded = true; // alt gikk bra
    } catch (e) {
        console.log("Lyd ikke støttet i denne nettleseren");
        soundsLoaded = false;
    }
}

// Lager partikler når slangen spiser mat
function createParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * gridSize + gridSize / 2,
            y: y * gridSize + gridSize / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: `hsl(${Math.random() * 60 + 300}, 100%, 60%)` // lilla/rosa farger
        });
    }
}

// Oppdaterer alle partikler (flytter og reduserer liv)
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02; // mister liv over tid
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Tegner partiklene på skjermen
function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1; // nullstiller gjennomsiktighet
}

// Starter spillet på nytt
function init() {
    // Reset slangen
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
    particles = [];
    foodPulse = 0;
    foodHue = 0;
    backgroundPulse = 0;

    generateFood(); // lager ny mat
    updateScore();  // viser poeng
    hideGameOver(); // skjuler game over tekst

    // Spiller lyd for start
    if (soundsLoaded) startSound();

    lastRenderTime = 0;
    requestAnimationFrame(gameLoop); // starter loopen
}

// Hovedløkken i spillet
function gameLoop(currentTime) {
    if (!gameRunning) return; // hvis game over, stopp

    requestAnimationFrame(gameLoop); // loop videre

    const timeSinceLastRender = currentTime - lastRenderTime;
    if (timeSinceLastRender < currentSpeed) return; // venter basert på hastighet
    lastRenderTime = currentTime;

    update(); // oppdaterer logikk
    draw();   // tegner alt på nytt
}

// Oppdaterer spill-logikken
function update() {
    // Animerer mat (puls og farge)
    foodPulse = (foodPulse + 0.05) % (Math.PI * 2);
    foodHue = (foodHue + 0.5) % 360;

    // Reduserer bakgrunnspuls litt over tid
    if (backgroundPulse > 0) backgroundPulse -= 0.1;

    // Oppdaterer partikler
    updateParticles();

    // Legger til lysende haleeffekt
    snakeTrails.push({...snake[0], life: 1.0});
    if (snakeTrails.length > 10) snakeTrails.shift();
    snakeTrails.forEach(trail => trail.life -= 0.1);
    snakeTrails = snakeTrails.filter(trail => trail.life > 0);

    // Endrer retning hvis ny trykket
    if (pendingDirection) {
        if (!(dx === -pendingDirection.x && dy === -pendingDirection.y)) {
            dx = pendingDirection.x;
            dy = pendingDirection.y;
        }
        pendingDirection = null;
    }

    // Nytt hode basert på retning
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Sjekker om man traff veggen
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Sjekker om man traff seg selv
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Legger til nytt hode
    snake.unshift(head);

    // Hvis slangen spiser mat
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        if (soundsLoaded) eatSound(); // spiller lyd
        createParticles(food.x, food.y); // partikler ved mat

        // Level up hver 10. poeng
        if (score % 10 === 0 && soundsLoaded) {
            levelUpSound();
            backgroundPulse = 1.0;
        }

        generateFood();
        currentSpeed = Math.max(40, baseSpeed - score * 3); // raskere
    } else {
        snake.pop(); // hvis ikke spiser, fjern halen
    }
}

// Tegner alt
function draw() {
    // Lager bakgrunn med gradient og puls
    const pulse = Math.sin(backgroundPulse * Math.PI) * 0.3;
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, `hsl(270, 100%, ${5 + pulse}%)`);
    bgGradient.addColorStop(0.5, `hsl(280, 100%, ${8 + pulse}%)`);
    bgGradient.addColorStop(1, `hsl(260, 100%, ${5 + pulse}%)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawSnakeTrails();
    drawFood();
    drawSnake();
    drawParticles();
}

// Tegner rutenett
function drawGrid() {
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.1)';
    ctx.lineWidth = 0.5;
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
    ctx.lineWidth = 1;
}

// Tegner glødende hale etter slangen
function drawSnakeTrails() {
    snakeTrails.forEach(trail => {
        const x = trail.x * gridSize;
        const y = trail.y * gridSize;
        ctx.globalAlpha = trail.life * 0.3;
        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d4ff';
        ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Tegner selve slangen
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const gradient = ctx.createRadialGradient(
            x + gridSize / 2, y + gridSize / 2, 2,
            x + gridSize / 2, y + gridSize / 2, gridSize
        );

        // Lysere hodefarge
        if (index === 0) {
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(1, '#0066ff');
        } else {
            gradient.addColorStop(0, '#0099ff');
            gradient.addColorStop(1, '#0044aa');
        }

        ctx.shadowBlur = index === 0 ? 25 : 15;
        ctx.shadowColor = index === 0 ? '#00ffff' : '#0099ff';

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;
    });
}

// Tegner maten med pulserende effekt
function drawFood() {
    const x = food.x * gridSize + gridSize / 2;
    const y = food.y * gridSize + gridSize / 2;
    const pulseSize = (Math.sin(foodPulse) * 0.2 + 0.8) * (gridSize / 2 - 2);
    const foodColor = `hsl(${foodHue}, 100%, 60%)`;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, pulseSize);
    gradient.addColorStop(0, foodColor);
    gradient.addColorStop(1, 'rgba(255, 0, 153, 0)');
    ctx.shadowBlur = 25;
    ctx.shadowColor = foodColor;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Lager ny mat på et tomt sted
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
    foodPulse = 0;
}

// Oppdaterer poengvisning
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Viser game over og spiller lyd
function gameOver() {
    gameRunning = false;
    if (soundsLoaded) gameOverSound();
    setTimeout(() => {
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOverModal').classList.add('show');
    }, 200);
}

// Skjuler game over vindu
function hideGameOver() {
    document.getElementById('gameOverModal').classList.remove('show');
}

// Endrer retning basert på tastetrykk
function changeDirection(newDirection) {
    if (pendingDirection) return;
    if (newDirection.x === -dx && newDirection.y === -dy) return;
    pendingDirection = newDirection;
}

// Lytter etter tastetrykk
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

// Restart-knapp
document.getElementById('restartBtn').addEventListener('click', init);

// Laster alt når siden åpnes
window.addEventListener('load', () => {
    loadSounds();
    init();
});
