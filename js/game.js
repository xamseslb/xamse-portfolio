// Global variabler
let game = new Chess();
let board = null;
let aiWorker = null;

let whiteTime = 180;
let blackTime = 180;
let timerInterval = null;
let currentTimer = 'white';
let isAiThinking = false;

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Brett konfigurasjon
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

// Initialiserer spillet
function initGame() {
    game = new Chess();
    board = Chessboard('gameBoard', config);

    whiteTime = 180;
    blackTime = 180;
    currentTimer = 'white';
    isAiThinking = false;

    if (timerInterval) clearInterval(timerInterval);
    if (aiWorker) aiWorker.terminate();

    // Opprett AI worker
    aiWorker = new Worker('../js/ai-worker.js');

    aiWorker.onmessage = function(e) {
        const move = e.data.move;
        handleAiMove(move);
    };

    aiWorker.onerror = function(err) {
        console.error('AI Worker error:', err);
        isAiThinking = false;
        updateTurnIndicator('Your Turn');
    };

    startTimer();
    updateTimerDisplay();
    updateStatus();
    updateMaterialScore();
}

// Timer
function startTimer() {
    timerInterval = setInterval(() => {
        if (game.game_over()) {
            clearInterval(timerInterval);
            return;
        }

        if (currentTimer === 'white') {
            whiteTime--;
            if (whiteTime <= 0) {
                whiteTime = 0;
                clearInterval(timerInterval);
                showGameOverModal('Tid ute!', 'Black (CPU) vinner på tid!');
                return;
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                clearInterval(timerInterval);
                showGameOverModal('Tid ute!', 'White (You) vinner på tid!');
                return;
            }
        }

        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const whiteEl = document.getElementById('whiteTimer');
    const blackEl = document.getElementById('blackTimer');

    whiteEl.textContent = formatTime(whiteTime);
    blackEl.textContent = formatTime(blackTime);

    whiteEl.classList.remove('warning', 'critical');
    blackEl.classList.remove('warning', 'critical');

    if (whiteTime <= 30) whiteEl.classList.add('critical');
    else if (whiteTime <= 60) whiteEl.classList.add('warning');

    if (blackTime <= 30) blackEl.classList.add('critical');
    else if (blackTime <= 60) blackEl.classList.add('warning');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Sjekker om du kan flytte en brikke
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (game.turn() === 'b') return false;
    if (piece.startsWith('b')) return false;
    return true;
}

// Når du slipper en brikke
function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    currentTimer = 'black';
    updateStatus();
    updateMaterialScore();

    if (game.game_over()) {
        clearInterval(timerInterval);
        setTimeout(handleGameOver, 500);
        return;
    }

    setTimeout(makeAiMove, 300);
}

function onSnapEnd() {
    board.position(game.fen());
}

// AI gjør trekk
function makeAiMove() {
    if (game.game_over() || isAiThinking) return;

    isAiThinking = true;
    updateTurnIndicator('CPU Thinking...');

    aiWorker.postMessage({
        fen: game.fen(),
        depth: 3
    });
}

function handleAiMove(move) {
    isAiThinking = false;

    if (!move) {
        console.error('Ingen AI-trekk mottatt');
        updateTurnIndicator('Your Turn');
        return;
    }

    game.move(move);
    board.position(game.fen());
    currentTimer = 'white';

    updateStatus();
    updateMaterialScore();

    if (game.game_over()) {
        clearInterval(timerInterval);
        setTimeout(handleGameOver, 500);
    }
}

// Oppdaterer status
function updateStatus() {
    let status = '';
    let turnText = '';

    if (game.in_checkmate()) {
        status = 'Checkmate!';
        turnText = game.turn() === 'w' ? 'Black Wins!' : 'You Win!';
    } else if (game.in_draw()) {
        status = 'Draw';
        turnText = 'Game Over';
    } else if (game.in_stalemate()) {
        status = 'Stalemate';
        turnText = 'Draw!';
    } else if (game.in_threefold_repetition()) {
        status = 'Draw by repetition';
        turnText = 'Game Over';
    } else if (game.insufficient_material()) {
        status = 'Draw - insufficient material';
        turnText = 'Game Over';
    } else {
        if (game.in_check()) {
            status = 'Check!';
        }
        turnText = game.turn() === 'w' ? 'Your Turn' : 'CPU Thinking...';
    }

    document.getElementById('gameStatus').textContent = status;
    updateTurnIndicator(turnText);
}

function updateTurnIndicator(text) {
    document.getElementById('turnIndicator').textContent = text;
}

// Oppdaterer score
function updateMaterialScore() {
    const fen = game.fen().split(' ')[0];
    let whiteScore = 0;
    let blackScore = 0;

    for (let char of fen) {
        if (char >= 'A' && char <= 'Z') {
            const piece = char.toLowerCase();
            if (pieceValues[piece]) whiteScore += pieceValues[piece];
        }
        if (char >= 'a' && char <= 'z') {
            if (pieceValues[char]) blackScore += pieceValues[char];
        }
    }

    const diff = whiteScore - blackScore;
    const scoreEl = document.getElementById('scoreDisplay');

    let whiteDisplay = '0';
    let blackDisplay = '0';

    if (diff > 0) {
        whiteDisplay = `+${diff}`;
        scoreEl.style.color = '#4ade80';
    } else if (diff < 0) {
        blackDisplay = `+${Math.abs(diff)}`;
        scoreEl.style.color = '#f87171';
    } else {
        scoreEl.style.color = '#fff';
    }

    scoreEl.textContent = `${whiteDisplay} - ${blackDisplay}`;
}

// Game over håndtering
function handleGameOver() {
    let title = '';
    let message = '';

    if (game.in_checkmate()) {
        if (game.turn() === 'w') {
            title = 'Checkmate!';
            message = 'Black (CPU) vinner!';
        } else {
            title = 'Victory!';
            message = 'Du vant over CPU!';
        }
    } else if (game.in_stalemate()) {
        title = 'Stalemate';
        message = 'Spillet er uavgjort.';
    } else if (game.in_threefold_repetition()) {
        title = 'Draw';
        message = 'Uavgjort ved repetisjon.';
    } else if (game.insufficient_material()) {
        title = 'Draw';
        message = 'Uavgjort - ikke nok materiale.';
    } else if (game.in_draw()) {
        title = 'Draw';
        message = 'Spillet er uavgjort.';
    }

    showGameOverModal(title, message);
}

function showGameOverModal(title, message) {
    const modal = document.getElementById('gameModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active');
}

// Restart knapp
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameModal').classList.remove('active');
    initGame();
});

// Start spillet
initGame();
