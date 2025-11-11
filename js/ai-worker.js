// ai-worker.js
importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js');

const MAX_TIME_MS = 20000;
const TIME_LIMIT = MAX_TIME_MS * 0.60; // 60% av maks tid
const EARLY_STOP_SCORE = 120; // Stopp tidlig hvis vi har stor fordel
const INFINITY = 9999999;
const MATE_SCORE = 1000000;

// Brikkeverdier og tabeller forblir de samme...
const PIECE_VALUES = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

const MIDDLEGAME_TABLES = {
    p: [
        [  0,   0,   0,   0,   0,   0,   0,   0],
        [ 50,  50,  50,  50,  50,  50,  50,  50],
        [ 10,  10,  20,  30,  30,  20,  10,  10],
        [  5,   5,  10,  27,  27,  10,   5,   5],
        [  0,   0,   0,  25,  25,   0,   0,   0],
        [  5,  -5, -10,   0,   0, -10,  -5,   5],
        [  5,  10,  10, -25, -25,  10,  10,   5],
        [  0,   0,   0,   0,   0,   0,   0,   0]
    ],
    n: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20,   0,   5,   5,   0, -20, -40],
        [-30,   5,  10,  15,  15,  10,   5, -30],
        [-30,   0,  15,  20,  20,  15,   0, -30],
        [-30,   5,  15,  20,  20,  15,   5, -30],
        [-30,   0,  10,  15,  15,  10,   0, -30],
        [-40, -20,   0,   0,   0,   0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10,   5,   0,   0,   0,   0,   5, -10],
        [-10,  10,  10,  10,  10,  10,  10, -10],
        [-10,   0,  10,  10,  10,  10,   0, -10],
        [-10,   5,   5,  10,  10,   5,   5, -10],
        [-10,   0,   5,  10,  10,   5,   0, -10],
        [-10,   0,   0,   0,   0,   0,   0, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
        [  0,   0,   0,   5,   5,   0,   0,   0],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [ -5,   0,   0,   0,   0,   0,   0,  -5],
        [  5,  10,  10,  10,  10,  10,  10,   5],
        [  0,   0,   0,   0,   0,   0,   0,   0]
    ],
    q: [
        [-20, -10, -10,  -5,  -5, -10, -10, -20],
        [-10,   0,   5,   0,   0,   0,   0, -10],
        [-10,   5,   5,   5,   5,   5,   0, -10],
        [  0,   0,   5,   5,   5,   5,   0,  -5],
        [ -5,   0,   5,   5,   5,   5,   0,  -5],
        [-10,   0,   5,   5,   5,   5,   0, -10],
        [-10,   0,   0,   0,   0,   0,   0, -10],
        [-20, -10, -10,  -5,  -5, -10, -10, -20]
    ],
    k: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [ 20,  20,   0,   0,   0,   0,  20,  20],
        [ 20,  30,  10,   0,   0,  10,  30,  20]
    ]
};

const ENDGAME_TABLES = {
    p: [
        [  0,   0,   0,   0,   0,   0,   0,   0],
        [ 80,  80,  80,  80,  80,  80,  80,  80],
        [ 50,  50,  50,  50,  50,  50,  50,  50],
        [ 30,  30,  30,  30,  30,  30,  30,  30],
        [ 20,  20,  20,  20,  20,  20,  20,  20],
        [ 10,  10,  10,  10,  10,  10,  10,  10],
        [ 10,  10,  10,  10,  10,  10,  10,  10],
        [  0,   0,   0,   0,   0,   0,   0,   0]
    ],
    k: [
        [-50, -40, -30, -20, -20, -30, -40, -50],
        [-30, -20, -10,   0,   0, -10, -20, -30],
        [-30, -10,  20,  30,  30,  20, -10, -30],
        [-30, -10,  30,  40,  40,  30, -10, -30],
        [-30, -10,  30,  40,  40,  30, -10, -30],
        [-30, -10,  20,  30,  30,  20, -10, -30],
        [-30, -30,   0,   0,   0,   0, -30, -30],
        [-50, -30, -30, -30, -30, -30, -30, -50]
    ]
};

class TranspositionTable {
    constructor() {
        this.table = new Map();
        this.maxSize = 1000000;
    }

    clear() {
        this.table.clear();
    }

    get(key) {
        return this.table.get(key);
    }

    set(key, entry) {
        if (this.table.size >= this.maxSize) {
            this.clear();
        }
        this.table.set(key, entry);
    }
}

const tt = new TranspositionTable();
let searchStartTime = 0;
let nodesSearched = 0;
let timeLimitReached = false;

function checkTime() {
    if (Date.now() - searchStartTime > TIME_LIMIT) {
        timeLimitReached = true;
        return true;
    }
    return false;
}

function getGamePhase(game) {
    const board = game.board();
    let phase = 0;
    let totalMaterial = 0;
    
    for (let row of board) {
        for (let piece of row) {
            if (piece) {
                const value = PIECE_VALUES[piece.type];
                totalMaterial += value;
                if (piece.type !== 'p' && piece.type !== 'k') {
                    phase += value;
                }
            }
        }
    }
    
    const maxPhase = 2 * (PIECE_VALUES.n + PIECE_VALUES.b + PIECE_VALUES.r + PIECE_VALUES.q);
    return Math.min(1, phase / maxPhase);
}

function evaluate(game) {
    if (game.in_checkmate()) {
        return game.turn() === 'b' ? -MATE_SCORE : MATE_SCORE;
    }
    if (game.in_draw() || game.in_threefold_repetition() || game.insufficient_material()) {
        return 0;
    }

    const board = game.board();
    let score = 0;
    const phase = getGamePhase(game);
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            
            const value = PIECE_VALUES[piece.type];
            const isBlack = piece.color === 'b';
            
            score += isBlack ? value : -value;
            
            if (piece.type === 'k' && phase < 0.5) {
                const tableValue = ENDGAME_TABLES.k[isBlack ? r : 7 - r][c];
                score += isBlack ? tableValue : -tableValue;
            } else {
                const tableValue = MIDDLEGAME_TABLES[piece.type][isBlack ? r : 7 - r][c];
                score += isBlack ? tableValue : -tableValue;
            }
        }
    }
    
    const mobility = game.moves().length;
    score += (game.turn() === 'b' ? mobility : -mobility) * 2;
    
    return score;
}

class MoveOrderer {
    constructor() {
        this.killerMoves = Array(100).fill().map(() => Array(2).fill(null));
        this.historyTable = Array(2).fill().map(() => Array(7).fill().map(() => Array(64).fill(0)));
    }
    
    getHistoryValue(color, piece, to) {
        const pieceIndex = this.pieceToIndex(piece);
        return this.historyTable[color === 'b' ? 0 : 1][pieceIndex][to];
    }
    
    updateHistory(color, piece, to, depth) {
        const pieceIndex = this.pieceToIndex(piece);
        this.historyTable[color === 'b' ? 0 : 1][pieceIndex][to] += depth * depth;
    }
    
    pieceToIndex(piece) {
        const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
        return pieces.indexOf(piece);
    }
    
    orderMoves(game, moves, ply, ttMove) {
        const scores = new Array(moves.length);
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            let score = 0;
            
            if (ttMove && move.from === ttMove.from && move.to === ttMove.to && 
                move.promotion === ttMove.promotion) {
                score = 1000000;
            }
            else if (move.captured) {
                score = 10000 + PIECE_VALUES[move.captured] * 10 - PIECE_VALUES[game.get(move.from).type];
            }
            else if (this.killerMoves[ply][0] && this.moveEquals(move, this.killerMoves[ply][0])) {
                score = 9000;
            }
            else if (this.killerMoves[ply][1] && this.moveEquals(move, this.killerMoves[ply][1])) {
                score = 8000;
            }
            else {
                const piece = game.get(move.from).type;
                score = this.getHistoryValue(game.turn(), piece, this.squareToIndex(move.to));
            }
            
            if (move.promotion) {
                score += PIECE_VALUES[move.promotion];
            }
            
            scores[i] = score;
        }
        
        for (let i = 0; i < moves.length - 1; i++) {
            for (let j = i + 1; j < moves.length; j++) {
                if (scores[j] > scores[i]) {
                    [moves[i], moves[j]] = [moves[j], moves[i]];
                    [scores[i], scores[j]] = [scores[j], scores[i]];
                }
            }
        }
        
        return moves;
    }
    
    addKillerMove(move, ply) {
        if (!this.moveEquals(move, this.killerMoves[ply][0])) {
            this.killerMoves[ply][1] = this.killerMoves[ply][0];
            this.killerMoves[ply][0] = move;
        }
    }
    
    moveEquals(a, b) {
        return a && b && a.from === b.from && a.to === b.to && a.promotion === b.promotion;
    }
    
    squareToIndex(square) {
        const file = square.charCodeAt(0) - 97;
        const rank = 8 - parseInt(square[1]);
        return rank * 8 + file;
    }
}

const moveOrderer = new MoveOrderer();

function quiescence(game, alpha, beta, color) {
    nodesSearched++;
    
    if ((nodesSearched & 511) === 0 && checkTime()) {
        return alpha;
    }
    
    let standPat = evaluate(game) * (color === 'b' ? 1 : -1);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    
    const captures = game.moves({ verbose: true }).filter(move => move.captured);
    const orderedCaptures = moveOrderer.orderMoves(game, captures, 0, null);
    
    for (let move of orderedCaptures) {
        if (timeLimitReached) return alpha;
        
        game.move(move);
        const score = -quiescence(game, -beta, -alpha, color === 'b' ? 'w' : 'b');
        game.undo();
        
        if (timeLimitReached) return alpha;
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    
    return alpha;
}

function pvSearch(game, depth, alpha, beta, color, ply) {
    nodesSearched++;
    
    if ((nodesSearched & 511) === 0 && checkTime()) {
        return null;
    }
    
    const inCheck = game.in_check();
    const isPV = beta - alpha > 1;
    
    if (inCheck) depth++;
    
    if (depth <= 0) {
        return quiescence(game, alpha, beta, color);
    }
    
    const ttKey = game.fen();
    const ttEntry = tt.get(ttKey);
    let ttMove = null;
    
    if (ttEntry && ttEntry.depth >= depth) {
        if (ttEntry.flag === 'EXACT') {
            return ttEntry.score;
        } else if (ttEntry.flag === 'LOWER' && ttEntry.score > alpha) {
            alpha = ttEntry.score;
        } else if (ttEntry.flag === 'UPPER' && ttEntry.score < beta) {
            beta = ttEntry.score;
        }
        
        if (alpha >= beta) return ttEntry.score;
        ttMove = ttEntry.move;
    }
    
    if (!isPV && !inCheck && depth >= 3) {
        game.move({ from: 'a1', to: 'a1' });
        const nullScore = -pvSearch(game, depth - 3, -beta, -beta + 1, color === 'b' ? 'w' : 'b', ply + 1);
        game.undo();
        
        if (nullScore === null) return null;
        if (nullScore >= beta) return beta;
    }
    
    let moves = game.moves({ verbose: true });
    if (moves.length === 0) {
        if (game.in_checkmate()) return -MATE_SCORE + ply;
        return 0;
    }
    
    moves = moveOrderer.orderMoves(game, moves, ply, ttMove);
    
    let bestScore = -INFINITY;
    let bestMove = moves[0];
    let alphaOrig = alpha;
    
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        
        if (timeLimitReached) break;
        
        game.move(move);
        let score;
        
        if (i === 0) {
            score = -pvSearch(game, depth - 1, -beta, -alpha, color === 'b' ? 'w' : 'b', ply + 1);
        } else {
            let reduction = 0;
            if (depth >= 3 && i >= 4 && !move.captured && !move.promotion && !game.in_check()) {
                reduction = 1;
            }
            
            score = -pvSearch(game, depth - 1 - reduction, -alpha - 1, -alpha, color === 'b' ? 'w' : 'b', ply + 1);
            
            if (score > alpha && reduction > 0) {
                score = -pvSearch(game, depth - 1, -alpha - 1, -alpha, color === 'b' ? 'w' : 'b', ply + 1);
            }
            
            if (score > alpha && score < beta) {
                score = -pvSearch(game, depth - 1, -beta, -alpha, color === 'b' ? 'w' : 'b', ply + 1);
            }
        }
        
        game.undo();
        
        if (score === null) return null;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
            
            if (score > alpha) {
                alpha = score;
                
                if (score >= beta) {
                    if (!move.captured) {
                        moveOrderer.addKillerMove(move, ply);
                    }
                    moveOrderer.updateHistory(color, game.get(move.from).type, 
                        moveOrderer.squareToIndex(move.to), depth);
                    break;
                }
            }
        }
    }
    
    if (timeLimitReached) return bestScore;
    
    let flag = 'EXACT';
    if (bestScore <= alphaOrig) {
        flag = 'UPPER';
    } else if (bestScore >= beta) {
        flag = 'LOWER';
    }
    
    tt.set(ttKey, {
        score: bestScore,
        depth: depth,
        flag: flag,
        move: bestMove
    });
    
    return bestScore;
}

function findBestMove(game) {
    searchStartTime = Date.now();
    nodesSearched = 0;
    timeLimitReached = false;
    tt.clear();
    
    let bestMove = null;
    let bestScore = -INFINITY;
    
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    if (moves.length === 1) return moves[0];
    
    // Start med en rask overfladisk søk for å finne et godt utgangstrekk
    bestMove = moves[0];
    bestScore = -INFINITY;
    
    for (let move of moves) {
        if (checkTime()) break;
        
        game.move(move);
        const score = -evaluate(game) * (game.turn() === 'b' ? 1 : -1);
        game.undo();
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    // Iterative deepening med tidlig avslutning
    for (let depth = 1; depth <= 50; depth++) {
        if (checkTime()) break;
        
        // Sjekk om vi allerede har en klar fordel og kan stoppe tidligere
        if (Math.abs(bestScore) > EARLY_STOP_SCORE && depth >= 4) {
            const timeUsed = Date.now() - searchStartTime;
            if (timeUsed > 2000) { // Minst 2 sekunder søk selv med klar fordel
                break;
            }
        }
        
        let currentBestMove = bestMove;
        let currentBestScore = -INFINITY;
        let alpha = -INFINITY;
        let beta = INFINITY;
        let improvementFound = false;
        
        for (let move of moves) {
            if (checkTime()) break;
            
            game.move(move);
            const score = -pvSearch(game, depth - 1, -beta, -alpha, 'w', 1);
            game.undo();
            
            if (score === null) break;
            
            if (score > currentBestScore) {
                currentBestScore = score;
                currentBestMove = move;
                if (score > alpha) alpha = score;
                improvementFound = true;
            }
        }
        
        if (improvementFound && !timeLimitReached) {
            bestScore = currentBestScore;
            bestMove = currentBestMove;
        }
        
        // Stopp umiddelbart hvis tiden er nesten brukt opp
        if (Date.now() - searchStartTime > MAX_TIME_MS * 0.85) {
            break;
        }
        
        // Stopp hvis vi fant matt eller stor fordel
        if (bestScore > MATE_SCORE - 1000 || bestScore < -MATE_SCORE + 1000) {
            break;
        }
    }
    
    // Fallback: returner alltid et trekk, selv om søket ble avbrutt
    if (!bestMove) {
        bestMove = moves[Math.floor(Math.random() * moves.length)];
    }
    
    return bestMove;
}

onmessage = (e) => {
    const game = new Chess(e.data.fen);
    
    if (game.turn() !== 'b') {
        postMessage({ move: null });
        return;
    }
    
    if (game.game_over()) {
        postMessage({ move: null });
        return;
    }
    
    const bestMove = findBestMove(game);
    postMessage({ move: bestMove });
};