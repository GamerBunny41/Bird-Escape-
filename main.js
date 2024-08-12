const player = document.getElementById('player');
const clickSound = document.getElementById('clickSound');
const gameOverSound = document.getElementById('gameOverSound');
const finalScoreDisplay = document.getElementById('finalScore');
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const coinDisplay = document.getElementById('coinDisplay');
const pauseOverlay = document.getElementById('pause-overlay');
const resumeButton = document.getElementById('resume-btn');
const restartButton = document.getElementById('restart-btn');
const menuButton = document.getElementById('menu-btn');
const soundButton = document.getElementById('sound-btn');
const helpButton = document.getElementById('help-btn');
const exitButton = document.getElementById('exit-btn');
const introSound = document.getElementById('introSound');
const jumpSound = document.getElementById('jump-sound');
const coinSound = document.getElementById('coin-collect');
const GOC = document.querySelector('.GameOverContainer');
const reStart = document.querySelector('#GOrestart');
const gomenuLink = document.querySelector('#GOmenu');
const pauseButton = document.getElementById('pause');
const menuClick = document.getElementById('Menu_Click');
const bgMusic = document.getElementById('bgMusic');
const muteButton = document.getElementById('muteButton');

let positionY = 250; // Start position Y in the middle of the container
let positionX = 150; // Start position X in the middle of the container
let moveInterval;
let gravity = 0.5;
let velocityY = 0;
let jumpForce = -5;
let direction = null;
let boxes = [];
let coins = [];
let gameOver = false;
let score = 0;
let coinScore = 0;
let isPaused = false;
let level = 1;
let boxSpeed = 1;
let boxSpawnInterval = 2000;
let boxSpawnIntervalId;

player.style.top = positionY + 'px';
player.style.left = positionX + 'px';

function playClickSound() {
    clickSound.play();
}

function playGameOverSound() {
    gameOverSound.play();
}

function playMenuClick() {
    menuClick.play();
}

function toggleMute() {
    bgMusic.paused ? bgMusic.play() : bgMusic.pause();
    muteButton.classList.toggle('fa-volume-mute');
    muteButton.classList.toggle('fa-volume-up');
}

function startMove(dir) {
    if (isPaused) return;

    direction = dir;
    moveInterval = setInterval(() => {
        if (gameOver || isPaused) return;

        const step = 7;
        const containerSizeX = 340;
        const containerSizeY = 535;
        const playerSize = 50;
        const padding = 4;

        if (direction === 'up') {
            positionY = Math.max(padding, positionY - step);
        } else if (direction === 'down') {
            positionY = Math.min(containerSizeY - playerSize - padding, positionY + step);
        } else if (direction === 'left') {
            positionX = Math.max(padding, positionX - step);
            player.style.transform = 'scaleX(-1)';
        } else if (direction === 'right') {
            positionX = Math.min(containerSizeX - playerSize - padding, positionX + step);
            player.style.transform = 'scaleX(1)';
        }

        player.style.top = positionY + 'px';
        player.style.left = positionX + 'px';
        checkCollision();
        checkCoinCollision();
    }, 100);
}

function stopMove() {
    clearInterval(moveInterval);
    direction = null;
}

function startJump() {
    if (gameOver || isPaused) return;
    velocityY = jumpForce;
    jumpSound.play();
    jumpSound.currentTime = 0;

    player.classList.add('jump');
    player.style.transform = 'rotate(-10deg) scaleX(1)';
}

player.addEventListener('animationend', () => {
    player.classList.remove('jump');
});

function gameLoop() {
    if (gameOver || isPaused) return;

    velocityY += gravity;
    positionY += velocityY;

    const containerSizeY = 535;
    const playerSize = 50;
    if (positionY < 4) {
        positionY = 4;
        velocityY = 0;
    } else if (positionY > containerSizeY - playerSize - 4) {
        positionY = containerSizeY - playerSize - 4;
        velocityY = 0;
    }

    if (velocityY > 0) {
        player.style.transform = 'rotate(0deg) scaleX(1)';
    }

    player.style.top = positionY + 'px';
    checkCollision();
    checkCoinCollision();
}

function createBox() {
    if (isPaused) return;

    const textures = ['url("assets/textures/stone.png")', 'url("assets/textures/stone1.png")', 'url("assets/textures/stone2.png")', 'url("assets/textures/stone3.png")'];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];

    const box = document.createElement('div');
    box.className = 'box';
    box.style.top = '0px';
    box.style.left = Math.random() * (340 - 40) + 'px';
    box.style.backgroundImage = randomTexture;
    document.querySelector('.game-container').appendChild(box);
    boxes.push(box);
}

function moveBoxes() {
    if (gameOver || isPaused) return;

    boxes.forEach(box => {
        const currentTop = parseFloat(box.style.top);
        const newTop = currentTop + boxSpeed;
        if (newTop > 535) {
            box.remove();
            boxes = boxes.filter(b => b !== box);
            score += 10;
            updateScore();
            updateLevel();
        } else {
            box.style.top = newTop + 'px';
        }
    });
}

function checkCollision() {
    const playerRect = player.getBoundingClientRect();
    boxes.forEach(box => {
        const boxRect = box.getBoundingClientRect();
        if (playerRect.left < boxRect.right &&
            playerRect.right > boxRect.left &&
            playerRect.top < boxRect.bottom &&
            playerRect.bottom > boxRect.top) {
           endGame();
        }
    });
}

function createCoin() {
    if (gameOver || isPaused) return;

    let coinX, coinY;
    let overlap = true;
    const coinSize = 30; // Adjust this if the coin size changes

    while (overlap) {
        coinX = Math.random() * (340 - coinSize);
        coinY = 0; // Coins always spawn at the top
        
        overlap = boxes.some(box => {
            const boxRect = box.getBoundingClientRect();
            const coinRect = {
                left: coinX,
                right: coinX + coinSize,
                top: coinY,
                bottom: coinY + coinSize
            };
            return !(coinRect.right < boxRect.left ||
                     coinRect.left > boxRect.right ||
                     coinRect.bottom < boxRect.top ||
                     coinRect.top > boxRect.bottom);
        });
    }

    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.top = coinY + 'px';
    coin.style.left = coinX + 'px';
    document.querySelector('.game-container').appendChild(coin);
    coins.push(coin);
}

function moveCoins() {
    if (gameOver || isPaused) return;

    coins.forEach(coin => {
        const currentTop = parseFloat(coin.style.top);
        const newTop = currentTop + boxSpeed;
        if (newTop > 535) {
            coin.remove();
            coins = coins.filter(c => c !== coin);
        } else {
            coin.style.top = newTop + 'px';
        }
    });
}

function checkCoinCollision() {
    const playerRect = player.getBoundingClientRect();
    coins.forEach(coin => {
        const coinRect = coin.getBoundingClientRect();
        if (playerRect.left < coinRect.right &&
            playerRect.right > coinRect.left &&
            playerRect.top < coinRect.bottom &&
            playerRect.bottom > coinRect.top) {
            coinScore++;
            updateCoinScore();
            coinSound.currentTime = 0;
            coinSound.play();
            coin.remove();
            coins = coins.filter(c => c !== coin);
        }
    });
}

function updateCoinScore() {
    coinDisplay.textContent = `Coins: ${coinScore}`;
}

function endGame() {
    gameOver = true;
    playGameOverSound();
    finalScoreDisplay.textContent = `Your Score: ${score}`;
    document.getElementById('finalCoins').textContent = `Coins Collected: ${coinScore}`;
    GOC.style.display = 'block';

    gomenuLink.addEventListener('click', function () {
        window.location.href = 'index.html';
    });

    reStart.addEventListener('click', function () {
        window.location.href = 'game.html';
    });
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.style.display = 'flex';
        pauseButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        pauseOverlay.style.display = 'none';
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateLevel() {
    const nextLevelScore = level * 100;
    if (score >= nextLevelScore && level < 141) {
        level++;
        levelDisplay.textContent = `Level: ${level}`;
        boxSpeed += 0.2;
        boxSpawnInterval = Math.max(500, boxSpawnInterval - 5000);
        clearInterval(boxSpawnIntervalId);
        boxSpawnIntervalId = setInterval(createBox, boxSpawnInterval);
    }
}

function startGame() {
    playMenuClick();
    setTimeout(() => {
        window.location.href = 'game.html';
    }, 200); // Delay of 200ms to allow sound to play
}

function openSettings() {
    playMenuClick();
    setTimeout(() => {
        // Placeholder for settings functionality
    }, 200);
}

function showAbout() {
    playMenuClick();
    setTimeout(() => {
        window.location.href = 'about.html';
    }, 200);
}

function shareGame() {
    playMenuClick();
    setTimeout(() => {
        alert("Oops! You can't share this game.");
    }, 200);
}

function exitGame() {
    playMenuClick();
    setTimeout(() => {
        alert("Baka! Exit Browser / Exit From This Page.");
    }, 200);
}

function showHowToPlay() {
    playMenuClick();
    setTimeout(() => {
        window.location.href = 'htp.html';
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    introSound.play().catch(error => {
        console.log('Audio playback was prevented: ', error);
    });

    document.querySelectorAll('button').forEach(button => {
        if (!['left', 'right', 'up'].includes(button.id)) {
            button.addEventListener('click', playClickSound);
        }
    });

    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', playMenuClick);
    });
    
    pauseButton.addEventListener('click', togglePause);
    resumeButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', () => window.location.href = 'game.html');
    menuButton.addEventListener('click', () => window.location.href = 'index.html');
    soundButton.addEventListener('click', toggleMute);
    helpButton.addEventListener('click', () => window.location.href = 'htp.html');
    exitButton.addEventListener('click', () => window.location.href = 'exit.html');
});

setInterval(gameLoop, 20);
setInterval(moveBoxes, 20);
setInterval(createBox, boxSpawnInterval);
setInterval(moveCoins, 20);
setInterval(createCoin, boxSpawnInterval);

levelDisplay.textContent = `Level: ${level}`;

const quotes = [
  "Avoid the boxes to stay alive!",
  "Collect coins to increase your score!",
  "Use arrow keys to navigate the player.",
  "Jump to avoid falling obstacles.",
  "The game gets harder with each level!",
  "Try to beat your high score!"
];

const quoteScreen = document.getElementById('quoteScreen');
const quoteText = document.getElementById('quoteText');

function showQuoteScreen() {
  let quoteIndex = 0;
  
  function updateQuote() {
    if (quoteIndex < quotes.length) {
      quoteText.textContent = quotes[quoteIndex];
      quoteIndex++;
    } else {
      quoteIndex = 0;
    }
  }
  
  updateQuote(); // Show the first quote
  quoteScreen.style.display = 'flex';
  
  const quoteInterval = setInterval(() => {
    updateQuote();
  }, 2000); // Update quote every 2 seconds
  
  setTimeout(() => {
    clearInterval(quoteInterval);
    quoteScreen.style.display = 'none';
    startGame(); // Start the game after 10 seconds
  }, 10000); // Show the screen for 10 seconds
}

function startGame() {
  playMenuClick();
  setTimeout(() => {
    window.location.href = 'game.html';
  }, 200); // Delay of 200ms to allow sound to play
}


