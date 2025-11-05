importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js');

onmessage = (e) => {
    const { fen, depth = 2 } = e.data;
    const game = new Chess(fen);
    const best = searchBestMove(game, depth);
    postMessage({ move: best });
};

function searchBestMove(game, depth) {
    const moves = orderMoves(game.moves({ verbose: true }));
    let bestMove = moves[0] || null;
    let best = -Infinity;

    for (const m of moves) {
        game.move(m);
        const score = -negamax(game, depth - 1, -Infinity, Infinity);
        game.undo();
        if (score > best) { best = score; bestMove = m; }
    }
    return bestMove;
}

function negamax(game, depth, alpha, beta) {
    if (depth === 0 || game.game_over()) return evaluate(game);

    let best = -Infinity;
    const moves = orderMoves(game.moves({ verbose: true }));

    for (const m of moves) {
        game.move(m);
        const score = -negamax(game, depth - 1, -beta, -alpha);
        game.undo();

        if (score > best) best = score;
        if (score > alpha) alpha = score;
        if (alpha >= beta) break; // cutoff
    }
    return best;
}

function orderMoves(moves) {
    const PV = { p:100, n:300, b:320, r:500, q:900 };
    return moves
        .map(m => {
            let s = 0;
            if (m.captured) s += (PV[m.captured] || 0) * 10 - (PV[m.piece] || 0);
            if (m.promotion) s += 800;
            // enkel sentrum-bonus
            if (['d4','e4','d5','e5'].includes(m.to)) s += 20;
            return { m, s };
        })
        .sort((a,b) => b.s - a.s)
        .map(x => x.m);
}

function evaluate(game) {
    const PV = { p:100, n:320, b:330, r:500, q:900, k:0 };

    if (game.in_checkmate()) return -100000;
    if (game.in_draw() || game.insufficient_material()) return 0;

    const fen = game.fen().split(' ')[0];
    let white = 0, black = 0;
    for (const c of fen) {
        if (PV[c]) black += PV[c];
        if (PV[c.toLowerCase()]) white += PV[c.toLowerCase()];
    }

    let score = (black - white);    // positivt = bra for svart (CPU)
    if (game.in_check()) score += (game.turn() === 'b' ? 50 : -50);
    return score;
}
