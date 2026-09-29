const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const scoreboardElement = document.getElementById('scoreboard');
const gif1Element = document.getElementById('gif1');
const gif2Element = document.getElementById('gif2');

// Canvas settings
canvas.width = 400;
canvas.height = 600;

// Game settings
const GRAVITY = 0.4;
const JUMP_STRENGTH = -7;
const TERMINAL_VELOCITY = 8;
const PIPE_WIDTH = 55;
const PIPE_GAP = 150;
const PIPE_SPEED = 1.5;
const BIRD_WIDTH = 45;
const BIRD_HEIGHT = 32;

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

// Load image for Jarritos
const jarritosImg = new Image();
jarritosImg.src = '/images/flappy/Jarritos-PNG-Pic-for-flappy.png';
let jarritosLoaded = false;
jarritosImg.onload = () => {
    jarritosLoaded = true;
};

const birdImages = [
    '/images/flappy/Slitengum.png',
    '/images/flappy/Flyt-smid.png',
    '/images/flappy/Full-anders.png'
];
let currentBirdImg = null;
let currentBirdLoaded = false;

function loadRandomBirdImage() {
    const randomIndex = Math.floor(Math.random() * birdImages.length);
    const img = new Image();
    currentBirdLoaded = false;
    img.src = birdImages[randomIndex];
    img.onload = () => {
        currentBirdImg = toScaledCanvas(img, BIRD_WIDTH, BIRD_HEIGHT);
        currentBirdLoaded = true;
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

const GROUND_HEIGHT = 50;
let groundImg = null;
let groundImgLoaded = false;
{
    const img = new Image();
    img.src = '/images/flappy/Sidelengs-anders.jpg';
    img.onload = () => {
        groundImg = toScaledCanvas(img, canvas.width, GROUND_HEIGHT);
        groundImgLoaded = true;
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

let currentBrainrotGif = new Image();
let currentBrainrotGif2 = new Image();
let GifLoaded = false;
let GifLoaded2 = false;
let showBrainrotGif = false;
let brainrotGifTimer = 0;
let gifPositions = [];

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
        y: Math.random() * (canvas.height - gifSize - 50)
    };
    
    // Generate second position that doesn't overlap with first
    let pos2;
    let attempts = 0;
    do {
        pos2 = {
            x: Math.random() * (canvas.width - gifSize),
            y: Math.random() * (canvas.height - gifSize - 50)
        };
        
        const dx = (pos2.x + gifSize/2) - (pos1.x + gifSize/2);
        const dy = (pos2.y + gifSize/2) - (pos1.y + gifSize/2);
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
    
    console.log('Showing GIFs:', brainrotGifs[randomIndex1], brainrotGifs[randomIndex2]);
}



// Game state
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let frames = 0;

// Load initial random bird
loadRandomBirdImage();
loadRandomBackgroundImage();
loadRandomBgMusic();
// Bird
const bird = {
    x: 80,
    y: canvas.height / 2,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    velocity: 0,
    
    draw() {
        // Tilt up on flap, tilt down as it falls - like the real Flappy Bird
        const angle = Math.max(-25, Math.min(90, this.velocity * 4));
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(angle * Math.PI / 180);

        if (currentBirdLoaded) {
            ctx.drawImage(currentBirdImg, -this.width / 2, -this.height / 2, this.width, this.height);
        }
        else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            // Eye
            ctx.fillStyle = '#000';
            ctx.fillRect(-this.width / 2 + 20, -this.height / 2 + 5, 5, 5);

            // Beak
            ctx.fillStyle = '#FF6347';
            ctx.beginPath();
            ctx.moveTo(this.width / 2, -this.height / 2 + 10);
            ctx.lineTo(this.width / 2 + 10, -this.height / 2 + 12);
            ctx.lineTo(this.width / 2, -this.height / 2 + 14);
            ctx.fill();
        }

        ctx.restore();
    },

    update() {
        this.velocity += GRAVITY;
        this.velocity = Math.min(this.velocity, TERMINAL_VELOCITY);
        this.y += this.velocity;

        // Ground collision
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocity = 0;
            if (gameState === 'playing') {
                endGame();
            }
        }

        // Ceiling collision
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    
    jump() {
        this.velocity = JUMP_STRENGTH;
    },
    
    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

// Pipes
let pipes = [];

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - 100;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + PIPE_GAP,
        scored: false
    });
}

function drawPipes() {
    ctx.fillStyle = '#5CB85C';
    
    pipes.forEach(pipe => {
        if (jarritosLoaded) {
            // Top pipe - stretch single bottle upside down
            ctx.save();
            ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.topHeight / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(jarritosImg, -PIPE_WIDTH / 2, -pipe.topHeight / 2, PIPE_WIDTH, pipe.topHeight);
            ctx.restore();

            // Bottom pipe - stretch single bottle
            const bottomHeight = canvas.height - pipe.bottomY - 50;
            ctx.drawImage(jarritosImg, pipe.x, pipe.bottomY, PIPE_WIDTH, bottomHeight);
        } else {
            // Fallback rectangles if image not loaded
            ctx.fillStyle = '#5CB85C';
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY - 50);
            // Pipe borders
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 3;
            ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY - 50);
        }
        
        
    });
}

function updatePipes() {
    pipes.forEach((pipe) => {
        pipe.x -= PIPE_SPEED;

        // Improve pipe collision border for better gameplay
        const bottleNeckWidth = PIPE_WIDTH * 0.5;
        const bottleBodyWidth = PIPE_WIDTH * 1;
        const pipeCenter = pipe.x + PIPE_WIDTH / 2;

        if (bird.x < pipe.x + PIPE_WIDTH && bird.x + bird.width > pipe.x) {
            // Top pipe collision - check different heights for bottle shape
            if (bird.y < pipe.topHeight) {
                // Near the cap (narrow part)
                const neckHeight = pipe.topHeight * 0.45;
                if (pipe.topHeight - bird.y < neckHeight) {
                    const leftEdge = pipeCenter - bottleNeckWidth / 2;
                    const rightEdge = pipeCenter + bottleNeckWidth / 2;
                    if (bird.x + bird.width > leftEdge && bird.x < rightEdge) {
                        endGame();
                    }
                }
                // Bottle body (wider part)
                else {
                    const leftEdge = pipeCenter - bottleBodyWidth / 2;
                    const rightEdge = pipeCenter + bottleBodyWidth / 2;
                    if (bird.x + bird.width > leftEdge && bird.x < rightEdge) {
                        endGame();
                    }
                }
            }

            // Bottom pipe collision
            if (bird.y + bird.height > pipe.bottomY) {
                const distanceFromBottom = (bird.y + bird.height) - pipe.bottomY;
                const bottomPipeHeight = canvas.height - pipe.bottomY - 50;

                // Near the base (narrow part)
                const neckHeight = bottomPipeHeight * 0.45;
                if (distanceFromBottom < neckHeight) {
                    const leftEdge = pipeCenter - bottleNeckWidth / 2;
                    const rightEdge = pipeCenter + bottleNeckWidth / 2;
                    if (bird.x + bird.width > leftEdge && bird.x < rightEdge) {
                        endGame();
                    }
                }
                // Bottle body (wider part)
                else {
                    const leftEdge = pipeCenter - bottleBodyWidth / 2;
                    const rightEdge = pipeCenter + bottleBodyWidth / 2;
                    if (bird.x + bird.width > leftEdge && bird.x < rightEdge) {
                        endGame();
                    }
                }
            }
        }

        // Score
        if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;

            // Add six-seven sound efffect
            if (score === 6) {
                scoreElement.textContent = '6!';
                scoreElement.style.fontSize = '64px';
            } else if (score === 7) {
                scoreElement.textContent = '7!';
                scoreElement.style.fontSize = '100px';
                playMilestoneSound(sixSevenSound);

                // Load and show brainrot gif briefly
                loadRandomBrainrotGif();
                showBrainrotGif = true;
                brainrotGifTimer = 150; // 2.5 seconds at 60fps

            } else if (score === 21) {
                scoreElement.textContent = 'TWENNYONE!';
                scoreElement.style.fontSize = '64px';
                playMilestoneSound(twentyOneSound);
            } else if (score === 67) {
                scoreElement.textContent = 'SIX-SEVEN!';
                scoreElement.style.fontSize = '150px';
                playMilestoneSound(sixSevenSound);

                // Load and show brainrot gif briefly
                loadRandomBrainrotGif();
                showBrainrotGif = true;
                brainrotGifTimer = 150; // 2.5 seconds at 60fps
            } else {
                scoreElement.style.fontSize = '48px';
            }
        }
        
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH >= 0);

    // Add new pipes
    if (frames % 130 === 0) {
        createPipe();
    }
}

function drawGround() {
    if (groundImgLoaded) {
        ctx.drawImage(groundImg, 0, canvas.height - 50, canvas.width, 50);
    } else {
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.fillRect(i, canvas.height - 50, 2, 50);
        }
    }
}

function drawBackground() {
    if (backgroundImgLoaded) {
        ctx.drawImage(currentBgImage, 0, 0, canvas.width, canvas.height);
    }
    else {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4ec0ca');
        gradient.addColorStop(1, '#87ceeb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Tell the surrounding page (tebonsma.no/flappy) about runs so it can record scores
function notifyPage(message) {
    if (window.parent !== window) {
        window.parent.postMessage(message, window.location.origin);
    }
}

function textElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

// Fills the game-over screen with the page's answer to a finished run. Names come from
// members' profiles, so everything is inserted as text, never as HTML.
function renderScoreboard(message) {
    scoreboardElement.replaceChildren();
    scoreboardElement.classList.remove('hidden');

    if (message.state === 'saving') {
        scoreboardElement.append(textElement('p', 'Lagrer resultatet…', 'note'));
    } else if (message.state === 'error') {
        scoreboardElement.append(textElement('p', message.error, 'note'));
    } else if (message.state === 'login') {
        const loginButton = textElement('button', 'Logg inn', 'login');
        loginButton.addEventListener('click', () => notifyPage({ type: 'flappy:login' }));
        scoreboardElement.append(textElement('p', 'Logg inn for å komme på topplisten.', 'note'), loginButton);
    } else if (message.state === 'board') {
        const { top, you } = message.board;
        if (message.newBest) scoreboardElement.append(textElement('p', 'Ny rekord!', 'record'));
        scoreboardElement.append(textElement('h3', 'Toppliste'));
        if (top.length === 0) {
            scoreboardElement.append(textElement('p', 'Ingen resultater ennå.', 'note'));
        }
        const list = document.createElement('ol');
        top.forEach((entry, i) => {
            const row = document.createElement('li');
            if (entry.isYou) row.className = 'you';
            const who = document.createElement('span');
            who.className = 'who';
            who.append(
                textElement('span', entry.name, 'name'),
                textElement('span', new Date(entry.date).toLocaleDateString('nb-NO'), 'date'),
            );
            row.append(textElement('span', String(i + 1), 'rank'), who, textElement('span', String(entry.score), 'points'));
            list.append(row);
        });
        scoreboardElement.append(list);
        if (you && !top.some(entry => entry.isYou)) {
            scoreboardElement.append(textElement('p', `Din rekord: ${you.score} (nr. ${you.rank})`, 'note'));
        }
    }
}

window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data && event.data.type === 'flappy:scoreboard') renderScoreboard(event.data);
});

function startGame() {
    notifyPage({ type: 'flappy:start' });
    scoreboardElement.classList.add('hidden');
    scoreboardElement.replaceChildren();
    gameState = 'playing';
    score = 0;
    frames = 0;
    pipes = [];
    bird.reset();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreElement.textContent = '0';
    scoreElement.style.fontSize = '48px';
    showBrainrotGif = false;
    brainrotGifTimer = 0;
    gif1Element.classList.add('hidden');
    gif2Element.classList.add('hidden');
    loadRandomBirdImage();
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

    notifyPage({ type: 'flappy:gameover', score });
}

// The game advances in fixed steps of 1/60 s regardless of the screen's refresh rate,
// so it plays at the same speed everywhere and scores on the scoreboard are comparable
const STEP_MS = 1000 / 60;
const MAX_CATCH_UP_MS = 250;
let lastFrameTime = null;
let pendingMs = 0;

function update() {
    frames++;
    bird.update();
    updatePipes();

    // Handle brainrot gif display
    if (showBrainrotGif && brainrotGifTimer > 0) {
        brainrotGifTimer--;
        if (brainrotGifTimer <= 0) {
            showBrainrotGif = false;
            gif1Element.classList.add('hidden');
            gif2Element.classList.add('hidden');
        }
    }
}

function gameLoop(now) {
    if (lastFrameTime === null) lastFrameTime = now;
    // After a stall (e.g. a background tab), resume instead of fast-forwarding
    pendingMs += Math.min(now - lastFrameTime, MAX_CATCH_UP_MS);
    lastFrameTime = now;

    while (pendingMs >= STEP_MS) {
        if (gameState === 'playing') update();
        pendingMs -= STEP_MS;
    }

    drawBackground();
    drawGround();
    drawPipes();
    bird.draw();

    requestAnimationFrame(gameLoop);
}

// Controls
function handleInput() {
    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'playing') {
        bird.jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
    }
});

canvas.addEventListener('click', handleInput);
restartBtn.addEventListener('click', startGame);

// Start game loop
requestAnimationFrame(gameLoop);