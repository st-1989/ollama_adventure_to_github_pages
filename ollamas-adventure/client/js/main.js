document.addEventListener('DOMContentLoaded', () => {
            // --- Game Setup ---
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');

            // UI Elements
            const uiContainer = document.getElementById('ui-container');
            const scoreDisplay = document.getElementById('score-display');
            const highscoreDisplay = document.getElementById('highscore-display');
            const scoreEl = document.getElementById('score');
            const highscoreEl = document.getElementById('highscore');
            const startMenu = document.getElementById('start-menu');
            const gameOverMenu = document.getElementById('game-over-menu');
            const finalScoreEl = document.getElementById('final-score');
            const startButton = document.getElementById('start-button');
            const retryButton = document.getElementById('retry-button');

            // Parallax Backgrounds
            const bgFar = document.getElementById('bg-far');
            const bgMid = document.getElementById('bg-mid');
            const bgNear = document.getElementById('bg-near');

            let width, height;
            let gameSpeed = 5;
            let score = 0;
            let highScore = localStorage.getItem('ollamaHighScore') || 0;
            let isPlaying = false;
            let lastTime = 0;
            let scoreMilestone = 100;

            // --- Sound Synthesis with Tone.js ---
            const synth = new Tone.Synth().toDestination();
            const collisionSynth = new Tone.NoiseSynth({
                noise: { type: 'pink' },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
            }).toDestination();

            function playJumpSound() {
                Tone.start();
                synth.triggerAttackRelease("G5", "8n");
            }
            function playGameOverSound() {
                Tone.start();
                collisionSynth.triggerAttackRelease("0.5n");
                setTimeout(() => synth.triggerAttackRelease("G3", "8n"), 50);
                setTimeout(() => synth.triggerAttackRelease("C3", "8n"), 200);
            }
            function playScoreSound() {
                Tone.start();
                synth.triggerAttackRelease("C6", "16n");
            }

            // --- Character (Ollama) ---
            const ollama = {
                x: 100,
                y: 0, // Set dynamically
                width: 80,
                height: 100,
                velocityY: 0,
                gravity: 0.8,
                jumpPower: -18,
                isJumping: false,
                runFrame: 0,
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);

                    // Body
                    ctx.fillStyle = '#FFF8E1'; // Creamy white
                    ctx.beginPath();
                    ctx.ellipse(this.width / 2, this.height - 40, 35, 40, 0, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = '#795548'; // Brown outline
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Head
                    ctx.fillStyle = '#FFF8E1';
                    ctx.beginPath();
                    ctx.ellipse(this.width / 2 + 25, this.height - 75, 25, 30, 0.5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();

                    // Ears
                    ctx.fillStyle = '#FFE0B2'; // Lighter cream
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 + 10, this.height - 100);
                    ctx.lineTo(this.width / 2 + 5, this.height - 120);
                    ctx.lineTo(this.width / 2 + 25, this.height - 105);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Eyes and Mouth
                    ctx.fillStyle = '#3E2723'; // Dark brown
                    ctx.beginPath();
                    ctx.arc(this.width / 2 + 40, this.height - 80, 3, 0, 2 * Math.PI); // Eye
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 + 45, this.height - 70);
                    ctx.arc(this.width / 2 + 40, this.height - 70, 5, 0, Math.PI); // Smile
                    ctx.stroke();

                    // Wool on head
                    ctx.fillStyle = '#FFFDE7';
                    ctx.beginPath();
                    ctx.arc(this.width / 2 + 20, this.height - 100, 10, 0, 2 * Math.PI);
                    ctx.arc(this.width / 2 + 30, this.height - 105, 10, 0, 2 * Math.PI);
                    ctx.arc(this.width / 2 + 40, this.height - 100, 10, 0, 2 * Math.PI);
                    ctx.fill();

                    // Legs - simple animation
                    this.runFrame += 0.2;
                    const legOffset1 = Math.sin(this.runFrame) * 10;
                    const legOffset2 = Math.sin(this.runFrame + Math.PI) * 10;

                    ctx.lineWidth = 8;
                    ctx.strokeStyle = '#795548';

                    // Back legs
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 - 15, this.height - 20);
                    ctx.lineTo(this.width / 2 - 20, this.height + legOffset1);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 - 25, this.height - 20);
                    ctx.lineTo(this.width / 2 - 30, this.height + legOffset2);
                    ctx.stroke();

                    // Front legs
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 + 15, this.height - 20);
                    ctx.lineTo(this.width / 2 + 10, this.height + legOffset2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(this.width / 2 + 25, this.height - 20);
                    ctx.lineTo(this.width / 2 + 20, this.height + legOffset1);
                    ctx.stroke();


                    ctx.restore();
                },
                jump() {
                    if (!this.isJumping) {
                        this.velocityY = this.jumpPower;
                        this.isJumping = true;
                        playJumpSound();
                    }
                },
                update(groundY) {
                    this.y += this.velocityY;
                    this.velocityY += this.gravity;

                    if (this.y > groundY - this.height) {
                        this.y = groundY - this.height;
                        this.velocityY = 0;
                        this.isJumping = false;
                    }
                }
            };

            // --- Obstacles ---
            let obstacles = [];
            let obstacleTimer = 0;
            let nextObstacleInterval = 2000;

            class Obstacle {
                constructor() {
                    this.width = 50 + Math.random() * 20;
                    this.height = 60 + Math.random() * 40;
                    this.x = width;
                    this.y = height - this.height - 20; // 20 is ground height
                }

                draw() {
                    ctx.fillStyle = '#2E7D32'; // Dark Green
                    ctx.strokeStyle = '#1B5E20'; // Even darker outline
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.rect(this.x, this.y, this.width, this.height);
                    ctx.fill();
                    ctx.stroke();

                    // Spikes
                    ctx.fillStyle = '#C8E6C9'; // Light green
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Arms
                    const armHeight = this.height * 0.6;
                    const armWidth = this.width * 0.4;
                    ctx.beginPath();
                    ctx.rect(this.x - armWidth, this.y + this.height * 0.2, armWidth, armHeight);
                    ctx.rect(this.x + this.width, this.y + this.height * 0.4, armWidth, armHeight * 0.8);
                    ctx.fill();
                    ctx.stroke();
                }

                update() {
                    this.x -= gameSpeed;
                }
            }

            function handleObstacles(deltaTime) {
                obstacleTimer += deltaTime;
                if (obstacleTimer > nextObstacleInterval) {
                    obstacles.push(new Obstacle());
                    obstacleTimer = 0;
                    // Make next obstacle appear faster or slower randomly, but also faster as game speeds up
                    nextObstacleInterval = Math.random() * 1000 + (2500 / (gameSpeed / 5));
                }

                obstacles.forEach(obstacle => {
                    obstacle.update();
                    obstacle.draw();
                });

                obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);
            }

            // --- Game Logic ---
            function checkCollisions() {
                for (let obstacle of obstacles) {
                    // Simple AABB collision detection
                    if (ollama.x < obstacle.x + obstacle.width &&
                        ollama.x + ollama.width - 20 > obstacle.x && // a bit of leeway
                        ollama.y < obstacle.y + obstacle.height &&
                        ollama.y + ollama.height > obstacle.y) {
                        gameOver();
                    }
                }
            }

            function updateParallax() {
                bgFar.style.backgroundPositionX = `-${(score * 0.1) % 2000}px`;
                bgMid.style.backgroundPositionX = `-${(score * 0.5) % 2000}px`;
                bgNear.style.backgroundPositionX = `-${(score * 1.5) % 2000}px`;
            }

            function gameLoop(timestamp) {
                if (!isPlaying) return;

                const deltaTime = timestamp - lastTime;
                lastTime = timestamp;

                ctx.clearRect(0, 0, width, height);

                // Game elements
                const groundY = height - 20;

                // Draw Ground
                ctx.fillStyle = '#795548';
                ctx.fillRect(0, groundY, width, 20);

                ollama.update(groundY);
                ollama.draw();

                handleObstacles(deltaTime);
                checkCollisions();

                // Update score and speed
                score += Math.floor(gameSpeed * 0.1);
                scoreEl.textContent = score;
                gameSpeed += 0.003; // Slowly increase speed

                if (score > scoreMilestone) {
                    playScoreSound();
                    scoreMilestone += 100;
                }

                updateParallax();

                requestAnimationFrame(gameLoop);
            }

            function startGame() {
                isPlaying = true;
                score = 0;
                gameSpeed = 5;
                obstacles = [];
                obstacleTimer = 0;
                scoreMilestone = 100;

                ollama.y = height - 20 - ollama.height;
                ollama.velocityY = 0;

                startMenu.classList.add('hidden');
                gameOverMenu.classList.add('hidden');
                scoreDisplay.classList.remove('hidden');
                highscoreDisplay.classList.remove('hidden');

                highscoreEl.textContent = highScore;

                lastTime = performance.now();
                requestAnimationFrame(gameLoop);
            }

            function gameOver() {
                isPlaying = false;
                playGameOverSound();

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('ollamaHighScore', highScore);
                    highscoreEl.textContent = highScore;
                }

                finalScoreEl.textContent = score;
                scoreDisplay.classList.add('hidden');
                highscoreDisplay.classList.add('hidden');
                gameOverMenu.classList.remove('hidden');
                gameOverMenu.classList.add('flex');
            }

            // --- Event Listeners and Initialization ---
            function handleInput() {
                if (isPlaying) {
                    ollama.jump();
                }
            }

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    handleInput();
                }
            });

            // For mobile touch
            window.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleInput();
            });

            startButton.addEventListener('click', startGame);
            retryButton.addEventListener('click', startGame);

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
                ollama.y = height - 20 - ollama.height;
            }

            // Generate prettier backgrounds
            function generateBackgrounds() {
                // Far background (Clouds)
                const cloudSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='600' viewBox='0 0 2000 600'>
                    <defs><filter id='f1' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur in='SourceGraphic' stdDeviation='15' /></filter></defs>
                    <rect width='100%' height='100%' fill='#aaddff'/>
                    <circle cx='200' cy='250' r='80' fill='white' filter='url(#f1)'/>
                    <circle cx='550' cy='200' r='120' fill='white' filter='url(#f1)'/>
                    <circle cx='900' cy='300' r='100' fill='white' filter='url(#f1)'/>
                    <circle cx='1300' cy='150' r='90' fill='white' filter='url(#f1)'/>
                    <circle cx='1700' cy='280' r='110' fill='white' filter='url(#f1)'/>
                </svg>`;
                bgFar.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(cloudSVG)}")`;
                bgFar.style.backgroundSize = `auto 100%`;

                // Mid background (Mountains)
                const mountainSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='600' viewBox='0 0 2000 600'>
                    <path d='M0 600 L0 400 L200 200 L400 450 L600 250 L850 500 L1100 300 L1400 550 L1600 350 L1800 500 L2000 400 L2000 600 Z' fill='#6ab4e9'/>
                    <path d='M-100 600 L-100 450 L100 250 L300 500 L550 300 L750 550 L1000 350 L1300 600 L1500 400 L1700 550 L1900 450 L2100 600 Z' fill='#8bc3f0' opacity='0.7'/>
                </svg>`;
                bgMid.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(mountainSVG)}")`;
                bgMid.style.backgroundSize = `auto 100%`;

                // Near background (Hills/Trees)
                const nearSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='200' viewBox='0 0 2000 200'>
                    <path d='M0 200 Q 250 50 500 200 T 1000 200 T 1500 200 T 2000 200' fill='#4CAF50'/>
                    <path d='M0 200 Q 200 100 400 200 T 800 200 T 1200 200 T 1600 200 T 2000 200' fill='#5cb85c' opacity='0.8'/>
                </svg>`;
                bgNear.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(nearSVG)}")`;
                bgNear.style.backgroundSize = `auto 100%`;
            }

            window.addEventListener('resize', resize);

            // Initial setup
            generateBackgrounds();
            resize();
            highscoreEl.textContent = highScore;
        });