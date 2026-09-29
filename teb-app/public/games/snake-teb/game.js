const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const gif1Element = document.getElementById('gif1');
const gif2Element = document.getElementById('gif2');

// Canvas settings
const CELL_SIZE = 20;
const GRID_SIZE = 20;
canvas.width = CELL_SIZE * GRID_SIZE;
canvas.height = CELL_SIZE * GRID_SIZE;

// Game settings
// Move timing is in real milliseconds (not frame counts) so the snake glides
// at the same speed regardless of the display's refresh rate.
const MS_PER_FRAME = 1000 / 60;
const START_MOVE_INTERVAL_MS = 14 * MS_PER_FRAME;
const MIN_MOVE_INTERVAL_MS = 8 * MS_PER_FRAME;

function computeMoveIntervalMs(currentScore) {
    return Math.max(MIN_MOVE_INTERVAL_MS, START_MOVE_INTERVAL_MS - Math.floor(currentScore / 5) * MS_PER_FRAME);
}

//Background music
const bgMusicTracks = [
    '/audio/bgmusic/Alan Walker - Faded.mp3',
    '/audio/bgmusic/246 - Ed Sheeran - Shape of You.mp3',
    '/audio/bgmusic/Enrique Iglesias - Tonight.mp3',
    '/audio/bgmusic/Flo Rida - Whistle.mp3',
    '/audio/bgmusic/Rihanna - Diamonds.mp3',
    '/audio/bgmusic/Zara Larsson - Lush Life.mp3'
];

let bgMusic = new Audio();
bgMusic.loop = true;
bgMusic.volume = 0.25;
let musicStarted = false;

function loadRandomBgMusic() {
    const randomIndex = Math.floor(Math.random() * bgMusicTracks.length);
    bgMusic.src = bgMusicTracks[randomIndex];
    bgMusic.load();
}

// Draw an image into an offscreen canvas sized to its on-screen target once,
// so the (potentially multi-megapixel) source is only resampled a single
// time instead of on every animation frame.
function toScaledCanvas(img, width, height) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = width;
    scaledCanvas.height = height;
    scaledCanvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return scaledCanvas;
}

// Load image for Jarritos (food)
let jarritosImg = null;
let jarritosLoaded = false;
{
    const img = new Image();
    img.src = '/images/flappy/Jarritos-PNG-Pic-for-flappy.png';
    img.onload = () => {
        jarritosImg = toScaledCanvas(img, CELL_SIZE, CELL_SIZE);
        jarritosLoaded = true;
    };
}

const headImages = [
    '/images/flappy/Slitengum.png',
    '/images/flappy/Flyt-smid.png',
    '/images/flappy/Full-anders.png'
];
let currentHeadImg = null;
let currentHeadLoaded = false;

function loadRandomHeadImage() {
    const randomIndex = Math.floor(Math.random() * headImages.length);
    const img = new Image();
    currentHeadLoaded = false;
    img.src = headImages[randomIndex];
    img.onload = () => {
        currentHeadImg = toScaledCanvas(img, CELL_SIZE, CELL_SIZE);
        currentHeadLoaded = true;
    };
}

const backgroundImages = [
    '/images/background/IMG_2715.JPG',
    '/images/background/IMG_2716.JPG',
    '/images/background/IMG_2717.JPG',
    '/images/background/IMG_2718.JPG',
    '/images/background/IMG_2719.JPG',
    '/images/background/IMG_2720.JPG',
    '/images/background/IMG_2723.JPG',
    '/images/background/IMG_2724.JPG',
    '/images/background/IMG_2725.JPG',
    '/images/background/IMG_2726.JPG',
    '/images/background/IMG_2727.JPG',
    '/images/background/IMG_2728.JPG',
    '/images/background/IMG_2729.JPG',
    '/images/background/IMG_2730.JPG',
    '/images/background/IMG_2731.JPG',
    '/images/background/IMG_2732.JPG',
    '/images/background/IMG_2742.png',
    '/images/background/IMG_2743.JPG',
    '/images/background/IMG_2744.JPG',
    '/images/background/IMG_2745.JPG',
    '/images/background/IMG_2746.JPG',
    '/images/background/IMG_2747.JPG',
    '/images/background/IMG_2748.JPG',
    '/images/background/IMG_2749.JPG',
    '/images/background/IMG_2750.JPG',
    '/images/background/IMG_2751.JPG',
    '/images/background/IMG_2753.JPG',
    '/images/background/IMG_2754.JPG',
    '/images/background/IMG_2755.JPG',
    '/images/background/IMG_2756.JPG',
    '/images/background/IMG_2757.JPG',
    '/images/background/IMG_2758.JPG',
    '/images/background/IMG_2759.JPG',
    '/images/background/IMG_2761.JPG',
    '/images/background/IMG_2762.png',
    '/images/background/IMG_2763.JPG',
    '/images/background/IMG_2764.JPG',
    '/images/background/IMG_2765.JPG',
    '/images/background/IMG_2767.JPG',
    '/images/background/IMG_2768.JPG',
];

let currentBgImage = null;
let backgroundImgLoaded = false;

function loadRandomBackgroundImage() {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const img = new Image();
    backgroundImgLoaded = false;
    img.src = backgroundImages[randomIndex];
    img.onload = () => {
        // These source photos are several megapixels; resample once here
        // instead of rescaling them on every single animation frame.
        currentBgImage = toScaledCanvas(img, canvas.width, canvas.height);
        backgroundImgLoaded = true;
    };
}

const crashSounds = [
    new Audio('/audio/gamesounds/ferdigno.mp3'),
    new Audio('/audio/gamesounds/herreguda.mp3'),
    new Audio('/audio/gamesounds/sugersjela.mp3')
];
crashSounds.forEach(sound => { sound.volume = 0.7; });

function playRandomCrashSound() {
    const randomIndex = Math.floor(Math.random() * crashSounds.length);
    const sound = crashSounds[randomIndex];
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Audio play error:', e));
}

const sixSevenSound = new Audio('/audio/gamesounds/six-seven.mp3');
sixSevenSound.volume = 0.8;
const twentyOneSound = new Audio('/audio/gamesounds/21.wav');
twentyOneSound.volume = 0.8;

function playMilestoneSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Audio play error:', e));
}

// Brainrot GIFS
const brainrotGifs = [
    '/gifs/67.gif',
    '/gifs/Adrian.gif',
    '/gifs/CharlieTroll.gif',
    '/gifs/FullMoon.gif',
    '/gifs/GlowingEyesDemon.gif',
    '/gifs/Goofball.gif',
    '/gifs/Kendrick.gif',
    '/gifs/Tuff.gif'
];

let showBrainrotGif = false;
let brainrotGifTimer = 0;

function loadRandomBrainrotGif() {
    // Select two different random GIFs
    const randomIndex1 = Math.floor(Math.random() * brainrotGifs.length);
    let randomIndex2 = Math.floor(Math.random() * brainrotGifs.length);
    while (randomIndex2 === randomIndex1 && brainrotGifs.length > 1) {
        randomIndex2 = Math.floor(Math.random() * brainrotGifs.length);
    }

    const gifSize = 80;
    const minDistance = 120;

    // Generate first position
    const pos1 = {
        x: Math.random() * (canvas.width - gifSize),
        y: Math.random() * (canvas.height - gifSize)
    };

    // Generate second position that doesn't overlap with first
    let pos2;
    let attempts = 0;
    do {
        pos2 = {
            x: Math.random() * (canvas.width - gifSize),
            y: Math.random() * (canvas.height - gifSize)
        };

        const dx = (pos2.x + gifSize / 2) - (pos1.x + gifSize / 2);
        const dy = (pos2.y + gifSize / 2) - (pos1.y + gifSize / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        attempts++;
        if (distance >= minDistance || attempts > 50) break;
    } while (true);

    // Set GIF sources and positions using HTML elements
    gif1Element.src = brainrotGifs[randomIndex1];
    gif1Element.style.left = pos1.x + 'px';
    gif1Element.style.top = pos1.y + 'px';
    gif1Element.classList.remove('hidden');

    gif2Element.src = brainrotGifs[randomIndex2];
    gif2Element.style.left = pos2.x + 'px';
    gif2Element.style.top = pos2.y + 'px';
    gif2Element.classList.remove('hidden');
}

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let moveIntervalMs = START_MOVE_INTERVAL_MS;
let timeSinceLastMove = 0;
let lastFrameTime = null;

// Food that grows more numerous as the score climbs - quickly at first,
// then tapering off (sqrt curve: big early jumps, smaller later ones).
const MAX_FOOD_COUNT = 8;
function getTargetFoodCount(currentScore) {
    return Math.min(MAX_FOOD_COUNT, 2 + Math.floor(Math.sqrt(currentScore)));
}

// Snake
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let foods = [];

// Render-time positions for smooth (interpolated) movement between grid steps
let renderFrom = [];
let renderTo = [];

// Load initial random assets
loadRandomHeadImage();
loadRandomBackgroundImage();
loadRandomBgMusic();

function resetSnake() {
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    renderFrom = snake.map(segment => ({ ...segment }));
    renderTo = snake.map(segment => ({ ...segment }));
}

function isFoodCell(x, y) {
    return foods.some(f => f.x === x && f.y === y);
}

function placeFood() {
    let candidate;
    do {
        candidate = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (
        snake.some(segment => segment.x === candidate.x && segment.y === candidate.y) ||
        isFoodCell(candidate.x, candidate.y)
    );
    foods.push(candidate);
}

function ensureFoodCount() {
    const target = getTargetFoodCount(score);
    while (foods.length < target) {
        placeFood();
    }
}

function drawBackground() {
    if (backgroundImgLoaded) {
        ctx.drawImage(currentBgImage, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawFood() {
    foods.forEach(food => {
        if (jarritosLoaded) {
            ctx.drawImage(jarritosImg, food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
            ctx.fillStyle = '#FF6347';
            ctx.beginPath();
            ctx.arc(
                food.x * CELL_SIZE + CELL_SIZE / 2,
                food.y * CELL_SIZE + CELL_SIZE / 2,
                CELL_SIZE / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function drawSnake(t) {
    snake.forEach((segment, index) => {
        const from = renderFrom[index] || segment;
        const to = renderTo[index] || segment;
        const px = lerp(from.x, to.x, t) * CELL_SIZE;
        const py = lerp(from.y, to.y, t) * CELL_SIZE;

        if (index === 0) {
            // Head
            if (currentHeadLoaded) {
                ctx.drawImage(currentHeadImg, px, py, CELL_SIZE, CELL_SIZE);
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        } else {
            // Body - Jarritos-green segments
            ctx.fillStyle = '#5CB85C';
            ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
    });
}

function updateSnake() {
    direction = nextDirection;

    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return;
    }

    // Self collision
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    const prevSnake = snake.map(segment => ({ ...segment }));
    const eatenIndex = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
    const grew = eatenIndex !== -1;

    snake.unshift(newHead);
    if (!grew) {
        snake.pop();
    }

    // Build render interpolation targets for the new snake layout
    if (grew) {
        renderFrom = [prevSnake[0], ...prevSnake];
        renderTo = [newHead, ...prevSnake];
    } else {
        renderFrom = prevSnake;
        renderTo = snake.map(segment => ({ ...segment }));
    }

    if (grew) {
        foods.splice(eatenIndex, 1);
        score++;
        scoreElement.textContent = score;
        moveIntervalMs = computeMoveIntervalMs(score);

        if (score === 6) {
            scoreElement.textContent = '6!';
            scoreElement.style.fontSize = '64px';
        } else if (score === 7) {
            scoreElement.textContent = '7!';
            scoreElement.style.fontSize = '100px';
            playMilestoneSound(sixSevenSound);
            loadRandomBrainrotGif();
            showBrainrotGif = true;
            brainrotGifTimer = 150;
        } else if (score === 21) {
            scoreElement.textContent = 'TWENNYONE!';
            scoreElement.style.fontSize = '64px';
            playMilestoneSound(twentyOneSound);
        } else if (score === 67) {
            scoreElement.textContent = 'SIX-SEVEN!';
            scoreElement.style.fontSize = '150px';
            playMilestoneSound(sixSevenSound);
            loadRandomBrainrotGif();
            showBrainrotGif = true;
            brainrotGifTimer = 150;
        } else {
            scoreElement.style.fontSize = '48px';
        }

        ensureFoodCount();
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    moveIntervalMs = START_MOVE_INTERVAL_MS;
    timeSinceLastMove = 0;
    lastFrameTime = null;
    resetSnake();
    foods = [];
    ensureFoodCount();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreElement.textContent = '0';
    scoreElement.style.fontSize = '48px';
    showBrainrotGif = false;
    brainrotGifTimer = 0;
    gif1Element.classList.add('hidden');
    gif2Element.classList.add('hidden');
    loadRandomHeadImage();
    loadRandomBackgroundImage();

    // Start background music if not already started
    if (!musicStarted) {
        bgMusic.play().catch(e => console.log('Audio play error:', e));
        musicStarted = true;
    }
}

function endGame() {
    gameState = 'gameOver';
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');

    // Play random crash sound
    playRandomCrashSound();
}

function gameLoop(timestamp) {
    drawBackground();

    let t = 1;
    if (gameState === 'playing') {
        if (lastFrameTime === null) {
            lastFrameTime = timestamp;
        }
        const delta = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        timeSinceLastMove += delta;

        // Catch up on any moves owed (handles slow frames/tab throttling)
        // without ever skipping the render, so motion stays gapless.
        while (timeSinceLastMove >= moveIntervalMs) {
            updateSnake();
            timeSinceLastMove -= moveIntervalMs;
        }

        // Linear, not eased: the snake is mid-glide every single tick, so a
        // constant velocity is what reads as smooth. Easing decelerates to a
        // stop at every grid line, which looks like stutter/lag instead.
        t = Math.min(1, timeSinceLastMove / moveIntervalMs);

        // Handle brainrot gif display
        if (showBrainrotGif && brainrotGifTimer > 0) {
            brainrotGifTimer--;
            if (brainrotGifTimer <= 0) {
                showBrainrotGif = false;
                gif1Element.classList.add('hidden');
                gif2Element.classList.add('hidden');
            }
        }
    } else {
        lastFrameTime = timestamp;
    }

    if (gameState !== 'start') {
        drawFood();
        drawSnake(t);
    }

    requestAnimationFrame(gameLoop);
}

// Controls
const directionKeys = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyW: { x: 0, y: -1 },
    KeyS: { x: 0, y: 1 },
    KeyA: { x: -1, y: 0 },
    KeyD: { x: 1, y: 0 }
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'gameOver') {
            startGame();
        }
        return;
    }

    const newDir = directionKeys[e.code];
    if (!newDir) return;
    e.preventDefault();

    if (gameState === 'start') {
        startGame();
    }

    if (gameState === 'playing') {
        // Prevent reversing directly into the snake's own neck
        const isOpposite = newDir.x === -direction.x && newDir.y === -direction.y;
        if (!isOpposite) {
            nextDirection = newDir;
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameState === 'start') {
        startGame();
    }
});
restartBtn.addEventListener('click', startGame);

// Start game loop
requestAnimationFrame(gameLoop);
