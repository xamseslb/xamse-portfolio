// -----------------------------------------------------
// Enkel AI forklaring:
// - Søker fremover i trekk
// - AlphaBeta gjør det raskere
// - Quiescence gjør at AI ikke panikker i taktiske stillinger
// - Litt varians så AI ikke gjør samme trekk hver gang
// -----------------------------------------------------

importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js');

onmessage = (e) => {
    const { fen, depth = 2 } = e.data;
    const game = new Chess(fen);
    const best = searchBestMove(game, depth);
    postMessage({ move: best });
};

function orderMoves(game, moves) {
    const V = { p:100, n:320, b:330, r:500, q:900 };
    return moves
        .map(m => {
            let s = 0;
            if (m.captured) s += (V[m.captured] || 0) * 10 - (V[m.piece] || 0);
            if (m.promotion) s += 1000;
            game.move(m);
            if (game.in_check()) s += 60;
            if (['d4','e4','d5','e5'].includes(m.to)) s += 10;
            game.undo();
            return { m, s };
        })
        .sort((a,b) => b.s - a.s)
        .map(x => x.m);
}

function searchBestMove(game, depth) {
    const moves = orderMoves(game, game.moves({ verbose: true }));
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
    if (depth === 0 || game.game_over()) return quiescence(game, alpha, beta, 0);
    if (game.in_threefold_repetition()) return -20;

    let best = -Infinity;
    const moves = orderMoves(game, game.moves({ verbose: true }));

    for (const m of moves) {
        game.move(m);
        const score = -negamax(game, depth - 1, -beta, -alpha);
        game.undo();

        if (score > best) best = score;
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
    }
    return best;
}

function quiescence(game, alpha, beta, ply) {
    const standPat = evaluate(game) + ((Math.random() - 0.5) * (ply ? 1 : 2));
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const captures = game.moves({ verbose: true }).filter(m => m.captured);
    const ordered = orderMoves(game, captures);

    for (const m of ordered) {
        game.move(m);
        const score = -quiescence(game, -beta, -alpha, ply+1);
        game.undo();
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

function evaluate(game) {
    const V = { p:100, n:320, b:330, r:500, q:900, k:0 };

    if (game.in_checkmate()) return -100000;
    if (game.in_draw() || game.insufficient_material()) return 0;

    let white = 0, black = 0;
    const fen = game.fen().split(' ')[0];

    for (const c of fen) {
        if (V[c]) black += V[c];
        if (V[c.toLowerCase()]) white += V[c.toLowerCase()];
    }

    let eval_ = black - white;
    const mobility = game.moves().length;

    eval_ += (game.turn() === 'b' ? mobility : -mobility) * 0.5;
    if (game.in_check()) eval_ += (game.turn() === 'b' ? -40 : 40);

    return eval_;
}
