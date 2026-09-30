// Board setup
const SIZE = 4;
const board = document.getElementById('board');
const gridCellsEl = document.getElementById('gridCells');
const tileContainerEl = document.getElementById('tileContainer');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const finalScoreEl = document.getElementById('finalScore');
const gameOverEl = document.getElementById('gameOver');
const winOverlayEl = document.getElementById('winOverlay');
const startScreenEl = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const restartFromWinBtn = document.getElementById('restartFromWinBtn');
const continueBtn = document.getElementById('continueBtn');

// Tile faces: one crew member per tier, so each merge up to the 2048 win
// tile reveals a new face instead of repeating. Tiers beyond that (if the
// player keeps going after winning) cycle back through the same set with
// an added glow (see cycleForValue).
const TILE_IMAGES = [
    '/images/Gummert.jpg',
    '/images/Gøran.jpg',
    '/images/Garbae.jpg',
    '/images/Smid.jpg',
    '/images/Pete.jpg',
    '/images/Bingo.jpg',
    '/images/Remi.jpg',
    '/images/Slangen.jpg',
    '/images/Adam.jpg',
    '/images/contact/hacker.png',
    '/images/contact/dreivind.jpg',
];

function imageForValue(value) {
    const tier = Math.log2(value) - 1;
    return TILE_IMAGES[tier % TILE_IMAGES.length];
}

function cycleForValue(value) {
    const tier = Math.log2(value) - 1;
    return Math.floor(tier / TILE_IMAGES.length);
}

// Layout: cells/tiles are positioned with plain percentages so the board
// stays perfectly aligned at any size without measuring pixels in JS.
const GAP_PCT = 2.5;
const CELL_PCT = (100 - GAP_PCT * (SIZE + 1)) / SIZE;

function rectFor(row, col) {
    return {
        left: GAP_PCT + col * (CELL_PCT + GAP_PCT),
        top: GAP_PCT + row * (CELL_PCT + GAP_PCT),
        size: CELL_PCT,
    };
}

function buildGridCells() {
    gridCellsEl.innerHTML = '';
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const rect = rectFor(row, col);
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.left = rect.left + '%';
            cell.style.top = rect.top + '%';
            cell.style.width = rect.size + '%';
            cell.style.height = rect.size + '%';
            gridCellsEl.appendChild(cell);
        }
    }
}

const VECTORS = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

// Game state
let cells = createEmptyGrid();
let tileEls = new Map(); // tile id -> DOM element
let nextId = 1;
let score = 0;
let best = 0;
let gameState = 'start'; // 'start' | 'playing' | 'won' | 'gameOver'
let hasWon = false;

const BEST_SCORE_KEY = 'teb-2048-best';

function loadBest() {
    try {
        return parseInt(localStorage.getItem(BEST_SCORE_KEY), 10) || 0;
    } catch (e) {
        return 0;
    }
}

function saveBest() {
    try {
        localStorage.setItem(BEST_SCORE_KEY, String(best));
    } catch (e) {
        // localStorage unavailable (e.g. private mode) - ignore, just don't persist.
    }
}

function createEmptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function withinBounds(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function getEmptyCells() {
    const empties = [];
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (!cells[row][col]) empties.push({ row, col });
        }
    }
    return empties;
}

function addRandomTile() {
    const empties = getEmptyCells();
    if (empties.length === 0) return null;
    const spot = empties[Math.floor(Math.random() * empties.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const tile = { id: nextId++, value, mergedThisMove: false };
    cells[spot.row][spot.col] = tile;
    return { tile, row: spot.row, col: spot.col };
}

// DOM helpers
function positionTileElement(el, row, col) {
    const rect = rectFor(row, col);
    el.style.left = rect.left + '%';
    el.style.top = rect.top + '%';
    el.style.width = rect.size + '%';
    el.style.height = rect.size + '%';
}

function styleTileElement(el, tile) {
    el.style.backgroundImage = `url('${imageForValue(tile.value)}')`;
    const cycle = cycleForValue(tile.value);
    el.classList.remove('tile-cycle-1', 'tile-cycle-2');
    if (cycle === 1) el.classList.add('tile-cycle-1');
    else if (cycle >= 2) el.classList.add('tile-cycle-2');

    let badge = el.querySelector('.tile-value');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'tile-value';
        el.appendChild(badge);
    }
    badge.textContent = tile.value;
}

function createTileElement(tile, row, col, spawnAnim) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.id = tile.id;
    positionTileElement(el, row, col);
    styleTileElement(el, tile);
    if (spawnAnim) el.classList.add('tile-spawn');
    tileContainerEl.appendChild(el);
    tileEls.set(tile.id, el);

    if (spawnAnim) {
        // Add the element in its "collapsed" state first, then release it on
        // the next frame so the browser actually animates the transition
        // instead of jumping straight to the end state.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.remove('tile-spawn'));
        });
    }
    return el;
}

function clearBoardDom() {
    tileContainerEl.innerHTML = '';
    tileEls.clear();
}

// Core move logic, modeled on the traversal approach from the original
// 2048 (gabrielecirulli/2048): sweep from the edge tiles are sliding toward
// so multi-tile chains resolve correctly in a single pass.
function findFarthestPosition(row, col, vector) {
    let prevRow = row;
    let prevCol = col;
    let curRow = row + vector.dr;
    let curCol = col + vector.dc;
    while (withinBounds(curRow, curCol) && !cells[curRow][curCol]) {
        prevRow = curRow;
        prevCol = curCol;
        curRow += vector.dr;
        curCol += vector.dc;
    }
    return { farthest: { row: prevRow, col: prevCol }, next: { row: curRow, col: curCol } };
}

function buildTraversalOrder(vector) {
    const rows = vector.dr === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const cols = vector.dc === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    return { rows, cols };
}

function performMove(direction) {
    if (gameState !== 'playing') return;
    const vector = VECTORS[direction];
    const { rows, cols } = buildTraversalOrder(vector);

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (cells[row][col]) cells[row][col].mergedThisMove = false;
        }
    }

    const moves = [];
    const merges = [];
    let moved = false;
    let scoreGain = 0;

    rows.forEach((row) => {
        cols.forEach((col) => {
            const tile = cells[row][col];
            if (!tile) return;

            const { farthest, next } = findFarthestPosition(row, col, vector);
            const nextTile = withinBounds(next.row, next.col) ? cells[next.row][next.col] : null;

            if (nextTile && nextTile.value === tile.value && !nextTile.mergedThisMove) {
                cells[row][col] = null;
                nextTile.value *= 2;
                nextTile.mergedThisMove = true;
                scoreGain += nextTile.value;
                moves.push({ id: tile.id, toRow: next.row, toCol: next.col, removed: true });
                merges.push({ survivorId: nextTile.id, newValue: nextTile.value });
                moved = true;
            } else if (farthest.row !== row || farthest.col !== col) {
                cells[row][col] = null;
                cells[farthest.row][farthest.col] = tile;
                moves.push({ id: tile.id, toRow: farthest.row, toCol: farthest.col, removed: false });
                moved = true;
            }
        });
    });

    if (!moved) return;

    moves.forEach((m) => {
        const el = tileEls.get(m.id);
        if (!el) return;
        positionTileElement(el, m.toRow, m.toCol);
        if (m.removed) {
            setTimeout(() => {
                el.remove();
                tileEls.delete(m.id);
            }, 130);
        }
    });

    merges.forEach((mg) => {
        const el = tileEls.get(mg.survivorId);
        if (!el) return;
        setTimeout(() => {
            styleTileElement(el, { value: mg.newValue });
            el.classList.remove('tile-pop');
            void el.offsetWidth; // restart the pop animation
            el.classList.add('tile-pop');
        }, 120);
    });

    score += scoreGain;
    scoreEl.textContent = score;
    if (score > best) {
        best = score;
        bestScoreEl.textContent = best;
        saveBest();
    }

    setTimeout(() => {
        const spawned = addRandomTile();
        if (spawned) createTileElement(spawned.tile, spawned.row, spawned.col, true);
        checkEndConditions();
    }, 130);
}

function hasMovesAvailable() {
    if (getEmptyCells().length > 0) return true;
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const value = cells[row][col].value;
            const right = cellValueAt(row, col + 1);
            const down = cellValueAt(row + 1, col);
            if (value === right || value === down) return true;
        }
    }
    return false;
}

function cellValueAt(row, col) {
    return withinBounds(row, col) && cells[row][col] ? cells[row][col].value : null;
}

function checkEndConditions() {
    if (!hasWon) {
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                if (cells[row][col] && cells[row][col].value >= 2048) {
                    hasWon = true;
                    gameState = 'won';
                    winOverlayEl.classList.remove('hidden');
                    return;
                }
            }
        }
    }

    if (!hasMovesAvailable()) {
        gameState = 'gameOver';
        finalScoreEl.textContent = score;
        gameOverEl.classList.remove('hidden');
        Scoreboard.runEnded(score);
    }
}

function startGame() {
    // Restarting in the middle of a game still counts the points earned so far
    if ((gameState === 'playing' || gameState === 'won') && score > 0) {
        Scoreboard.runEnded(score, { silent: true });
    }
    Scoreboard.runStarted();

    cells = createEmptyGrid();
    clearBoardDom();
    nextId = 1;
    score = 0;
    hasWon = false;
    scoreEl.textContent = '0';

    startScreenEl.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    winOverlayEl.classList.add('hidden');
    gameState = 'playing';

    const first = addRandomTile();
    if (first) createTileElement(first.tile, first.row, first.col, true);
    const second = addRandomTile();
    if (second) createTileElement(second.tile, second.row, second.col, true);
}

// Controls
const KEY_DIRECTIONS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
        startGame();
        return;
    }

    const direction = KEY_DIRECTIONS[e.code];
    if (!direction) return;
    e.preventDefault();

    if (gameState === 'start') {
        startGame();
        return;
    }
    performMove(direction);
});

// Touch swipe support
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 24;

board.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
}, { passive: true });

board.addEventListener('touchend', (e) => {
    if (gameState === 'start') {
        startGame();
        return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

    const direction = absX > absY ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    performMove(direction);
}, { passive: true });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartFromWinBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', () => {
    winOverlayEl.classList.add('hidden');
    gameState = 'playing';
});

// Init
buildGridCells();
best = loadBest();
bestScoreEl.textContent = best;
