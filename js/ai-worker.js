// Enkel, aggressiv og stabil AI (student-kommentarer)

// chess.js i worker
importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js');

onmessage = (e) => {
  const { fen, depth = 2 } = e.data;
  const game = new Chess(fen);
  const best = searchBestMove(game, depth);
  postMessage({ move: best });
};

// Sortér trekk: fangst > sjakk > sentrum > promo
function orderMoves(game, moves) {
  const V = { p:100, n:320, b:330, r:500, q:900 };
  return moves
    .map(m => {
      let s = 0;
      if (m.captured) s += (V[m.captured] || 0) * 10 - (V[m.piece] || 0); // MVV-LVA-ish
      if (m.promotion) s += 900;
      game.move(m);
      if (game.in_check()) s += 60;
      if (['d4','e4','d5','e5'].includes(m.to)) s += 10;
      game.undo();
      return { m, s };
    })
    .sort((a,b) => b.s - a.s)
    .map(x => x.m);
}

// Finn beste trekk med negamax + alpha/beta
function searchBestMove(game, depth) {
  const moves = orderMoves(game, game.moves({ verbose: true }));
  let bestMove = moves[0] || null;
  let best = -Infinity;

  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, 0);
    game.undo();
    if (score > best) { best = score; bestMove = m; }
  }
  return bestMove;
}

// Negamax. På bunnen kjører vi quiescence for å slippe “panikk”.
function negamax(game, depth, alpha, beta, ply) {
  if (depth === 0 || game.game_over()) {
    return quiescence(game, alpha, beta, ply);
  }

  // Straff rep (unngå evig sjakk/frem-og-tilbake)
  if (game.in_threefold_repetition()) return -20;

  let best = -Infinity;
  const moves = orderMoves(game, game.moves({ verbose: true }));

  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1);
    game.undo();

    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

// Quiescence: utvid bare fangster for å evaluere “rolig” stilling
function quiescence(game, alpha, beta, ply) {
  const standPat = evaluate(game) + jitter(ply);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const caps = game.moves({ verbose: true }).filter(m => !!m.captured);
  const ordered = orderMoves(game, caps);

  for (const m of ordered) {
    game.move(m);
    const score = -quiescence(game, -beta, -alpha, ply + 1);
    game.undo();

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Liten variasjon så AI ikke spiller identisk hver gang
function jitter(ply) {
  return (Math.random() - 0.5) * (ply ? 1 : 2);
}

// Rask evaluering: materiell + mobilitet + sjakksjekk + litt rep-straff
function evaluate(game) {
  const V = { p:100, n:320, b:330, r:500, q:900, k:0 };

  if (game.in_checkmate()) return -100000;
  if (game.in_draw() || game.insufficient_material()) return 0;
  if (game.in_threefold_repetition()) return -20;

  // materiell (svart – hvit) fordi AI spiller svart i dette oppsettet
  const fen = game.fen().split(' ')[0];
  let w = 0, b = 0;
  for (const c of fen) {
    if (c >= 'A' && c <= 'Z') w += V[c.toLowerCase()] || 0;
    if (c >= 'a' && c <= 'z') b += V[c] || 0;
  }
  let eval_ = b - w;

  // mobilitet (side i trekket får litt bonus)
  const moves = game.moves().length;
  eval_ += (game.turn() === 'b' ? 1 : -1) * Math.min(30, moves) * 0.6;

  // sjakk straff/bonus (den i sjakk får minus)
  if (game.in_check()) eval_ += (game.turn() === 'b' ? -40 : 40);

  return eval_;
}
