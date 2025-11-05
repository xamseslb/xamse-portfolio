let game = new Chess();
let board = null;

let whiteTime = 300;
let blackTime = 300;
let timerInterval = null;
let currentTimer = 'white';

let aiWorker = null;
let currentDepth = 2;      // juster om du vil
let isAiThinking = false;

const pieceValues = { p:1, n:3, b:3, r:5, q:9, k:0 };

const boardConfig = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

function initGame() {
    // init state
    game = new Chess();
    board = Chessboard('gameBoard', boardConfig);

    whiteTime = 300;
    blackTime = 300;
    currentTimer = 'white';
    isAiThinking = false;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;

    if (aiWorker) aiWorker.terminate();
    // VIKTIG: relativ sti fra /pages -> ../js/ai-worker.js
    aiWorker = new Worker('../js/ai-worker.js');

    aiWorker.onmessage = (e) => {
        const { move } = e.data;
        isAiThinking = false;
        if (!move) { updateTurnIndicator('Your Turn'); return; }
        game.move(move);
        board.position(game.fen());
        currentTimer = 'white';
        updateStatus();
        updateMaterialScore();
    };

    aiWorker.onerror = (err) => {
        console.error('AI worker error:', err);
        isAiThinking = false;
        updateTurnIndicator('Your Turn');
    };

    startTimer();
    updateTimerDisplay();
    updateStatus();
    updateMaterialScore();
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (game.game_over()) { clearInterval(timerInterval); return; }
        if (currentTimer === 'white') {
            whiteTime = Math.max(0, whiteTime - 1);
            if (whiteTime === 0) showGameOverModal('Time Out!', 'Black (CPU) wins on time!');
        } else {
            blackTime = Math.max(0, blackTime - 1);
            if (blackTime === 0) showGameOverModal('Time Out!', 'White (You) win on time!');
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('whiteTimer').textContent = formatTime(whiteTime);
    document.getElementById('blackTimer').textContent = formatTime(blackTime);
}

const formatTime = s => `${Math.floor(s/60)}:${('0'+(s%60)).slice(-2)}`;

function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (game.turn() === 'b') return false;      // du er alltid hvit
    if (piece.startsWith('b')) return false;    // kan ikke flytte svarte brikker
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (!move) return 'snapback';

    currentTimer = 'black';
    updateStatus();
    updateMaterialScore();

    setTimeout(makeComputerMove, 200);
}

function onSnapEnd() {
    board.position(game.fen());
}

function makeComputerMove() {
    if (game.game_over()) return;
    if (isAiThinking) return;

    isAiThinking = true;
    updateTurnIndicator('CPU Thinking...');
    aiWorker.postMessage({ fen: game.fen(), depth: currentDepth });
}

function updateStatus() {
    const statusEl = document.getElementById('gameStatus');

    if (game.in_checkmate()) {
        clearInterval(timerInterval);
        if (game.turn() === 'w') showGameOverModal('Checkmate!', 'Black (CPU) wins!');
        else showGameOverModal('Victory!', 'You defeated the CPU!');
        return;
    }
    if (game.in_draw() || game.in_stalemate() || game.insufficient_material()) {
        clearInterval(timerInterval);
        showGameOverModal('Draw', 'The game is a draw.');
        return;
    }

    statusEl.textContent = game.in_check() ? 'Check!' : '';
    updateTurnIndicator(game.turn() === 'w' ? 'Your Turn' : 'CPU Thinking...');
}

function updateTurnIndicator(text) {
    document.getElementById('turnIndicator').textContent = text;
}

function updateMaterialScore() {
    const fen = game.fen().split(' ')[0];
    let white=0, black=0;
    for (const c of fen) {
        if (pieceValues[c]) black += pieceValues[c];
        if (pieceValues[c.toLowerCase()]) white += pieceValues[c.toLowerCase()];
    }
    const diff = white - black;
    const el = document.getElementById('materialScore');
    el.textContent = `Score: ${diff >= 0 ? '+'+diff : diff}`;
}

function showGameOverModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('gameModal').classList.add('active');
}

document.getElementById('restartBtn').onclick = () => {
    document.getElementById('gameModal').classList.remove('active');
    initGame();
};

initGame();
