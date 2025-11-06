importScripts("https://cdn.jsdelivr.net/npm/chess.js");

onmessage = (e) => {
    const { fen, depth = 2 } = e.data; // depth 2 = rask og smart
    const game = new Chess(fen);
    const move = findBestMove(game, depth);
    postMessage({ move });
};

// Brikkeverdier (viktigst)
const V = { p:100, n:320, b:330, r:500, q:900, k:20000 };

// Evaluerer stilling
function evaluate(game) {
    if (game.in_checkmate()) return -999999;
    if (game.in_draw()) return 0;

    let score = 0;
    const board = game.board();

    // Teller materiell + litt posisjonelt
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            score += (piece.color === "b" ? 1 : -1) * V[piece.type];
        }
    }

    // Bonus for mobilitet
    score += (game.moves().length * (game.turn() === "b" ? 1 : -1)) * 2;

    // Bonus for sjakk
    if (game.in_check()) score += (game.turn() === "b" ? -40 : 40);

    return score;
}

// Negamax + alpha-beta (rask søking)
function search(game, depth, alpha, beta) {
    if (depth === 0 || game.game_over()) return evaluate(game);

    let best = -Infinity;
    const moves = orderMoves(game);

    for (const move of moves) {
        game.move(move);
        const score = -search(game, depth - 1, -beta, -alpha);
        game.undo();

        if (score > best) best = score;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
    }
    return best;
}

// Finner beste trekk
function findBestMove(game, depth) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of orderMoves(game)) {
        game.move(move);
        const score = -search(game, depth - 1, -Infinity, Infinity);
        game.undo();

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

// Sorterer trekk: fangst og sjakk først
function orderMoves(game) {
    return game.moves({ verbose: true }).sort((a, b) => {
        let sA = 0, sB = 0;
        if (a.captured) sA += V[a.captured] * 10;
        if (b.captured) sB += V[b.captured] * 10;
        return sB - sA;
    });
}
