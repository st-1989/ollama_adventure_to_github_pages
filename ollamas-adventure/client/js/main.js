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
    const stageDisplay = document.getElementById('stage-display');
    const stageNameEl = document.getElementById('stage-name');
    const stageBanner = document.getElementById('stage-banner');
    const powerupDisplay = document.getElementById('powerup-display');
    const shieldStatusEl = document.getElementById('shield-status');
    const achievementContainer = document.getElementById('achievement-container');
    const achievementList = document.getElementById('achievement-list');
    const startMenu = document.getElementById('start-menu');
    const gameOverMenu = document.getElementById('game-over-menu');
    const finalScoreEl = document.getElementById('final-score');
    const startButton = document.getElementById('start-button');
    const retryButton = document.getElementById('retry-button');
    const shareMessage = document.getElementById('share-message');
    const copyShareButton = document.getElementById('copy-share-button');
    const nativeShareButton = document.getElementById('native-share-button');
    const shareStatus = document.getElementById('share-status');

    // Parallax Backgrounds
    const bgFar = document.getElementById('bg-far');
    const bgMid = document.getElementById('bg-mid');
    const bgNear = document.getElementById('bg-near');

    // --- Game Constants ---
    const GROUND_HEIGHT = 20;
    const SHIELD_DURATION = 5500;
    const STAGE_BANNER_DURATION = 3200;
    const SHIELD_COLORS = {
        inactive: '#f8fafc',
        active: '#bef264',
        warning: '#fb923c',
        broken: '#f87171'
    };

    const STAGES = [
        {
            id: 0,
            name: 'Pasture Plains',
            threshold: 0,
            baseSpeed: 5,
            maxSpeed: 6.2,
            speedRamp: 0.0025,
            spawnInterval: [1300, 1800],
            obstacleTypes: ['cactus'],
            berryChance: 0,
            parallax: { far: 0.08, mid: 0.45, near: 1.25 },
            filters: {
                far: 'saturate(1)',
                mid: 'saturate(1)',
                near: 'saturate(1.05)'
            },
            sky: '#87CEEB'
        },
        {
            id: 1,
            name: 'Sunset Sands',
            threshold: 400,
            baseSpeed: 6.2,
            maxSpeed: 7.4,
            speedRamp: 0.003,
            spawnInterval: [1000, 1500],
            obstacleTypes: ['cactus', 'rollingLog', 'tideFish'],
            berryChance: 0.25,
            parallax: { far: 0.1, mid: 0.55, near: 1.45 },
            filters: {
                far: 'hue-rotate(-10deg) saturate(1.1)',
                mid: 'hue-rotate(-8deg) saturate(1.15)',
                near: 'hue-rotate(-6deg) saturate(1.2)'
            },
            sky: '#ffb86c'
        },
        {
            id: 2,
            name: 'Starfall Ridge',
            threshold: 950,
            baseSpeed: 7.6,
            maxSpeed: 8.8,
            speedRamp: 0.0032,
            spawnInterval: [820, 1200],
            obstacleTypes: ['cactus', 'rollingLog', 'skyBird', 'tideFish'],
            berryChance: 0.35,
            parallax: { far: 0.12, mid: 0.65, near: 1.65 },
            filters: {
                far: 'hue-rotate(15deg) saturate(1.1)',
                mid: 'hue-rotate(18deg) saturate(1.2) brightness(1.05)',
                near: 'hue-rotate(20deg) saturate(1.25)'
            },
            sky: '#7aa2ff'
        },
        {
            id: 3,
            name: 'Aurora Summit',
            threshold: 1600,
            baseSpeed: 8.8,
            maxSpeed: 10.2,
            speedRamp: 0.0035,
            spawnInterval: [680, 1000],
            obstacleTypes: ['rollingLog', 'skyBird', 'doubleCactus', 'tideFish', 'ceilingSpike'],
            berryChance: 0.45,
            parallax: { far: 0.14, mid: 0.75, near: 1.8 },
            filters: {
                far: 'hue-rotate(70deg) saturate(1.35)',
                mid: 'hue-rotate(80deg) saturate(1.4)',
                near: 'hue-rotate(90deg) saturate(1.5)'
            },
            sky: '#4b5fff'
        }
    ];

    // --- Sound Synthesis with Tone.js ---
    const synth = new Tone.Synth().toDestination();
    const collisionSynth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
    }).toDestination();

    function playJumpSound() {
        Tone.start();
        synth.triggerAttackRelease('G5', '8n');
    }

    function playGameOverSound() {
        Tone.start();
        collisionSynth.triggerAttackRelease('0.5n');
        setTimeout(() => synth.triggerAttackRelease('G3', '8n'), 50);
        setTimeout(() => synth.triggerAttackRelease('C3', '8n'), 200);
    }

    function playScoreSound() {
        Tone.start();
        synth.triggerAttackRelease('C6', '16n');
    }

    function playShieldSound() {
        Tone.start();
        synth.triggerAttackRelease('E6', '16n');
        setTimeout(() => synth.triggerAttackRelease('G6', '32n'), 90);
    }

    function playShieldBreakSound() {
        Tone.start();
        collisionSynth.triggerAttackRelease('16n');
        setTimeout(() => synth.triggerAttackRelease('D4', '16n'), 40);
    }

    // --- Game State ---
    let width;
    let height;
    let gameSpeed = STAGES[0].baseSpeed;
    let speedRamp = STAGES[0].speedRamp;
    let speedCap = STAGES[0].maxSpeed;
    let score = 0;
    let highScore = Number(localStorage.getItem('ollamaHighScore')) || 0;
    let isPlaying = false;
    let lastTime = 0;
    let scoreMilestone = 100;
    let currentStageIndex = 0;
    let lastStageReachedIndex = 0;
    let scoreAccumulator = 0;

    let obstacles = [];
    let collectibles = [];
    let obstacleTimer = 0;
    let nextObstacleInterval = 2000;
    let collectibleTimer = 0;
    let collectibleSpawnDelay = Infinity;
    let shieldTimer = 0;
    let shieldBurst = null;
    let stageBannerTimer = 0;

    const achievementsEarned = new Map();

    // --- Obstacle Catalog ---
    const obstacleCatalog = {
        cactus: {
            init(obstacle) {
                obstacle.width = 50 + Math.random() * 25;
                obstacle.height = 70 + Math.random() * 50;
                obstacle.x = width;
                obstacle.y = height - obstacle.height - GROUND_HEIGHT;
            },
            update(obstacle) {
                obstacle.x -= gameSpeed;
            },
            draw(obstacle) {
                ctx.save();
                ctx.fillStyle = '#2E7D32';
                ctx.strokeStyle = '#1B5E20';
                ctx.lineWidth = 3;

                drawRoundedRect(
                    ctx,
                    obstacle.x,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height,
                    18
                );
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#C8E6C9';
                for (let i = 0; i < 6; i += 1) {
                    const radius = 3 + Math.random() * 2;
                    const cx = obstacle.x + Math.random() * obstacle.width;
                    const cy = obstacle.y + Math.random() * obstacle.height;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        },
        doubleCactus: {
            init(obstacle) {
                obstacle.width = 120;
                obstacle.height = 95 + Math.random() * 30;
                obstacle.x = width;
                obstacle.y = height - obstacle.height - GROUND_HEIGHT;
                obstacle.segmentOffset = 40;
            },
            update(obstacle) {
                obstacle.x -= gameSpeed * 1.05;
            },
            draw(obstacle) {
                ctx.save();
                ctx.fillStyle = '#257A3E';
                ctx.strokeStyle = '#14532d';
                ctx.lineWidth = 4;

                const segmentWidth = obstacle.width / 2 - obstacle.segmentOffset / 2;

                drawRoundedRect(
                    ctx,
                    obstacle.x,
                    obstacle.y + 10,
                    segmentWidth,
                    obstacle.height - 10,
                    18
                );
                ctx.fill();
                ctx.stroke();

                drawRoundedRect(
                    ctx,
                    obstacle.x + segmentWidth + obstacle.segmentOffset,
                    obstacle.y,
                    segmentWidth,
                    obstacle.height,
                    18
                );
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        },
        rollingLog: {
            init(obstacle) {
                obstacle.width = 90;
                obstacle.height = 32;
                obstacle.x = width;
                obstacle.y = height - obstacle.height - GROUND_HEIGHT + 6;
                obstacle.rotation = Math.random() * Math.PI;
            },
            update(obstacle) {
                obstacle.x -= gameSpeed * 1.1;
                obstacle.rotation += 0.06;
            },
            draw(obstacle) {
                ctx.save();
                ctx.translate(
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2
                );
                ctx.rotate(obstacle.rotation);
                ctx.fillStyle = '#8D5524';
                ctx.strokeStyle = '#5C3317';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.rect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = '#A47148';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, obstacle.height / 2 - 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        },
        skyBird: {
            init(obstacle) {
                obstacle.width = 80;
                obstacle.height = 45;
                obstacle.x = width;
                obstacle.baseY = height - GROUND_HEIGHT - (180 + Math.random() * 120);
                obstacle.y = obstacle.baseY;
                obstacle.phase = Math.random() * Math.PI * 2;
                obstacle.amplitude = 22 + Math.random() * 15;
            },
            update(obstacle) {
                obstacle.x -= gameSpeed * 1.25;
                obstacle.phase += 0.08;
                obstacle.y = obstacle.baseY + Math.sin(obstacle.phase) * obstacle.amplitude;
            },
            draw(obstacle) {
                ctx.save();
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.ellipse(0, 0, obstacle.width / 2, obstacle.height / 2.8, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(-obstacle.width / 2, 0);
                ctx.quadraticCurveTo(
                    -obstacle.width / 1.5,
                    -obstacle.height / 1.2,
                    0,
                    -obstacle.height / 2
                );
                ctx.quadraticCurveTo(
                    obstacle.width / 1.4,
                    -obstacle.height / 1.3,
                    obstacle.width / 2,
                    0
                );
                ctx.quadraticCurveTo(
                    obstacle.width / 1.4,
                    obstacle.height / 1.3,
                    0,
                    obstacle.height / 2
                );
                ctx.quadraticCurveTo(
                    -obstacle.width / 1.4,
                    obstacle.height / 1.3,
                    -obstacle.width / 2,
                    0
                );
                ctx.fillStyle = '#475569';
                ctx.fill();
                ctx.restore();
            }
        },
        tideFish: {
            init(obstacle) {
                obstacle.width = 74;
                obstacle.height = 38;
                obstacle.x = width + 20;
                obstacle.baseY = height - GROUND_HEIGHT - (140 + Math.random() * 110);
                obstacle.y = obstacle.baseY;
                obstacle.phase = Math.random() * Math.PI * 2;
                obstacle.amplitude = 42 + Math.random() * 26;
                obstacle.speedMultiplier = 0.9 + Math.random() * 0.3;
            },
            update(obstacle) {
                obstacle.x -= gameSpeed * (1.05 + 0.02 * obstacle.speedMultiplier);
                obstacle.phase += 0.095 * obstacle.speedMultiplier;
                obstacle.y = obstacle.baseY + Math.sin(obstacle.phase) * obstacle.amplitude;
            },
            draw(obstacle) {
                ctx.save();
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

                ctx.fillStyle = '#0ea5e9';
                ctx.beginPath();
                ctx.ellipse(0, 0, obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#22d3ee';
                ctx.beginPath();
                ctx.moveTo(-obstacle.width / 2, 0);
                ctx.quadraticCurveTo(
                    -obstacle.width * 0.8,
                    -obstacle.height * 0.85,
                    -obstacle.width * 0.35,
                    -obstacle.height * 0.25
                );
                ctx.quadraticCurveTo(
                    -obstacle.width * 0.1,
                    0,
                    -obstacle.width * 0.35,
                    obstacle.height * 0.25
                );
                ctx.quadraticCurveTo(
                    -obstacle.width * 0.8,
                    obstacle.height * 0.85,
                    -obstacle.width / 2,
                    0
                );
                ctx.fill();

                ctx.fillStyle = '#cffafe';
                ctx.beginPath();
                ctx.arc(obstacle.width * 0.3, -obstacle.height * 0.08, obstacle.height * 0.12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(obstacle.width * 0.3, -obstacle.height * 0.08, obstacle.height * 0.07, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        },
        ceilingSpike: {
            init(obstacle) {
                obstacle.width = 70 + Math.random() * 60;
                const gapFromGround = 200 + Math.random() * 90;
                obstacle.height = Math.max(160, height - (GROUND_HEIGHT + gapFromGround));
                obstacle.x = width + 40;
                obstacle.y = 0;
                obstacle.facetCount = 3 + Math.floor(Math.random() * 3);
            },
            update(obstacle) {
                obstacle.x -= gameSpeed * 1.08;
            },
            draw(obstacle) {
                ctx.save();
                ctx.translate(obstacle.x, obstacle.y);

                const facetWidth = obstacle.width / obstacle.facetCount;

                for (let i = 0; i < obstacle.facetCount; i += 1) {
                    const startX = i * facetWidth;
                    const tipOffset = (Math.random() * 0.3 + 0.7) * obstacle.height;
                    ctx.beginPath();
                    ctx.moveTo(startX, 0);
                    ctx.lineTo(startX + facetWidth / 2, tipOffset);
                    ctx.lineTo(startX + facetWidth, 0);
                    ctx.closePath();
                    ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#0ea5e9';
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
                    ctx.stroke();
                }

                ctx.restore();
            }
        }
    };

    class Obstacle {
        constructor(type) {
            this.type = type;
            this.consumed = false;
            obstacleCatalog[type].init(this);
        }

        update() {
            obstacleCatalog[this.type].update(this);
        }

        draw() {
            obstacleCatalog[this.type].draw(this);
        }
    }

    class Collectible {
        constructor(type) {
            this.type = type;
            this.radius = 22;
            this.x = width + 60;
            this.y = height - GROUND_HEIGHT - (180 + Math.random() * 120);
            this.wave = Math.random() * Math.PI * 2;
            this.collected = false;
        }

        update() {
            this.x -= gameSpeed * 0.9;
            this.wave += 0.06;
            this.y += Math.sin(this.wave) * 1.8;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.sin(this.wave) * 0.08);

            const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius);
            gradient.addColorStop(0, 'rgba(255, 252, 220, 0.95)');
            gradient.addColorStop(1, 'rgba(252, 211, 77, 0.55)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            const spikes = 5;
            const innerRadius = this.radius * 0.4;
            for (let i = 0; i < spikes * 2; i += 1) {
                const angle = (i * Math.PI) / spikes;
                const r = i % 2 === 0 ? this.radius * 0.85 : innerRadius;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
            ctx.fill();
            ctx.restore();
        }
    }

    // --- Character (Ollama) ---
    const ollama = {
        x: 100,
        y: 0,
        width: 80,
        height: 100,
        velocityY: 0,
        gravity: 0.8,
        jumpPower: -18,
        isJumping: false,
        runFrame: 0,
        hasShield: false,
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);

            if (this.hasShield) {
                ctx.save();
                ctx.translate(this.width / 2, this.height / 2);
                const pulse = 28 + Math.sin(performance.now() / 140) * 6;
                const shieldGlow = ctx.createRadialGradient(0, 10, this.width / 2, 0, 10, this.width / 2 + pulse);
                shieldGlow.addColorStop(0, 'rgba(255, 253, 231, 0.45)');
                shieldGlow.addColorStop(1, 'rgba(253, 224, 71, 0.05)');
                ctx.fillStyle = shieldGlow;
                ctx.beginPath();
                ctx.arc(0, 10, this.width / 2 + pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Body
            ctx.fillStyle = '#FFF8E1';
            ctx.beginPath();
            ctx.ellipse(this.width / 2, this.height - 40, 35, 40, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Head
            ctx.fillStyle = '#FFF8E1';
            ctx.beginPath();
            ctx.ellipse(this.width / 2 + 25, this.height - 75, 25, 30, 0.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Ears
            ctx.fillStyle = '#FFE0B2';
            ctx.beginPath();
            ctx.moveTo(this.width / 2 + 10, this.height - 100);
            ctx.lineTo(this.width / 2 + 5, this.height - 120);
            ctx.lineTo(this.width / 2 + 25, this.height - 105);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Eyes and Mouth
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(this.width / 2 + 40, this.height - 80, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.width / 2 + 45, this.height - 70);
            ctx.arc(this.width / 2 + 40, this.height - 70, 5, 0, Math.PI);
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

    // --- Helper Functions ---
    function awardAchievement(key, text) {
        if (!achievementsEarned.has(key)) {
            achievementsEarned.set(key, text);
        }
    }

    function setShieldStatus(text, toneKey) {
        shieldStatusEl.textContent = text;
        shieldStatusEl.style.color = SHIELD_COLORS[toneKey] || SHIELD_COLORS.inactive;
        powerupDisplay.classList.remove('hidden');
    }

    function activateShield() {
        ollama.hasShield = true;
        shieldTimer = SHIELD_DURATION;
        setShieldStatus('Shield Active', 'active');
        playShieldSound();
        awardAchievement('shield-catch', 'Grabbed a Starlight Shield');
    }

    function consumeShield(obstacle) {
        if (!ollama.hasShield) {
            return;
        }
        ollama.hasShield = false;
        shieldTimer = 0;
        obstacle.consumed = true;
        ollama.velocityY = Math.min(ollama.velocityY, -12);
        setShieldStatus('Shield Broken!', 'broken');
        triggerShieldBurst(ollama.x + ollama.width / 2, ollama.y + ollama.height / 2);
        playShieldBreakSound();
        awardAchievement('shield-save', 'Shield saved your run!');
        setTimeout(() => {
            if (!isPlaying) {
                return;
            }
            setShieldStatus('Inactive Shield', 'inactive');
        }, 650);
    }

    function scheduleNextObstacle(forceReset) {
        const stage = STAGES[currentStageIndex];
        const [min, max] = stage.spawnInterval;
        nextObstacleInterval = min + Math.random() * (max - min);
        if (forceReset) {
            obstacleTimer = 0;
        }
    }

    function scheduleNextCollectible() {
        const stage = STAGES[currentStageIndex];
        if (stage.berryChance <= 0) {
            collectibleSpawnDelay = Infinity;
            collectibleTimer = 0;
            return;
        }
        const baseDelay = 9000 - stage.berryChance * 2200;
        collectibleSpawnDelay = Math.max(6000, baseDelay + Math.random() * 3500);
        collectibleTimer = 0;
    }

    function spawnObstacle() {
        const stage = STAGES[currentStageIndex];
        const pool = stage.obstacleTypes;
        const type = pool[Math.floor(Math.random() * pool.length)];
        obstacles.push(new Obstacle(type));
    }

    function handleObstacles(deltaTime) {
        obstacleTimer += deltaTime;
        if (obstacleTimer > nextObstacleInterval) {
            spawnObstacle();
            obstacleTimer = 0;
            scheduleNextObstacle(false);
        }

        obstacles.forEach((obstacle) => {
            obstacle.update();
            obstacle.draw();
        });

        obstacles = obstacles.filter(
            (obstacle) => !obstacle.consumed && obstacle.x > -obstacle.width - 40
        );
    }

    function circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        return dx * dx + dy * dy < circle.radius * circle.radius;
    }

    function drawRoundedRect(context, x, y, rectWidth, rectHeight, radius) {
        const r = Math.min(radius, rectWidth / 2, rectHeight / 2);
        context.beginPath();
        context.moveTo(x + r, y);
        context.lineTo(x + rectWidth - r, y);
        context.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + r);
        context.lineTo(x + rectWidth, y + rectHeight - r);
        context.quadraticCurveTo(
            x + rectWidth,
            y + rectHeight,
            x + rectWidth - r,
            y + rectHeight
        );
        context.lineTo(x + r, y + rectHeight);
        context.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - r);
        context.lineTo(x, y + r);
        context.quadraticCurveTo(x, y, x + r, y);
        context.closePath();
    }

    function handleCollectibles(deltaTime) {
        const stage = STAGES[currentStageIndex];
        collectibleTimer += deltaTime;

        if (collectibleTimer > collectibleSpawnDelay && stage.berryChance > 0) {
            if (Math.random() < stage.berryChance) {
                collectibles.push(new Collectible('shield'));
            }
            scheduleNextCollectible();
        }

        collectibles.forEach((collectible) => {
            collectible.update();
            collectible.draw();

            const rect = {
                x: ollama.x,
                y: ollama.y,
                width: ollama.width,
                height: ollama.height
            };

            if (!collectible.collected && circleRectCollision(collectible, rect)) {
                collectible.collected = true;
                score += 50;
                scoreEl.textContent = score;
                while (score > scoreMilestone) {
                    scoreMilestone += 120;
                }
                activateShield();
                playScoreSound();
            }
        });

        collectibles = collectibles.filter(
            (collectible) => !collectible.collected && collectible.x + collectible.radius > -40
        );
    }

    function evaluateStageProgression() {
        const nextStage = STAGES[currentStageIndex + 1];
        if (nextStage && score >= nextStage.threshold) {
            setStage(currentStageIndex + 1);
        }
    }

    function setStage(stageIndex, options = {}) {
        const { initial = false } = options;
        currentStageIndex = stageIndex;
        lastStageReachedIndex = Math.max(lastStageReachedIndex, currentStageIndex);

        const stage = STAGES[currentStageIndex];
        gameSpeed = Math.max(gameSpeed, stage.baseSpeed);
        speedRamp = stage.speedRamp;
        speedCap = stage.maxSpeed;

        stageDisplay.classList.remove('hidden');
        stageNameEl.textContent = stage.name;
        applyStageVisuals(stage);

        scheduleNextObstacle(true);
        scheduleNextCollectible();

        if (!initial) {
            showStageBanner(stage);
            awardAchievement(`stage-${stage.id}`, `Reached ${stage.name}`);
        }
    }

    function applyStageVisuals(stage) {
        document.body.style.backgroundColor = stage.sky;
        bgFar.style.filter = stage.filters.far;
        bgMid.style.filter = stage.filters.mid;
        bgNear.style.filter = stage.filters.near;
        uiContainer.style.setProperty('--stage-color', stage.sky);
    }

    function showStageBanner(stage) {
        stageBanner.textContent = `${stage.name}`;
        stageBanner.style.opacity = '1';
        stageBanner.classList.remove('hidden');
        stageBannerTimer = STAGE_BANNER_DURATION;
    }

    function updateStageBanner(deltaTime) {
        if (stageBannerTimer <= 0) {
            return;
        }
        stageBannerTimer -= deltaTime;
        if (stageBannerTimer <= 0) {
            stageBanner.classList.add('hidden');
            stageBanner.style.opacity = '0';
            return;
        }
        if (stageBannerTimer < 800) {
            const fade = stageBannerTimer / 800;
            stageBanner.style.opacity = String(Math.max(0, Math.min(1, fade)));
        }
    }

    function updateShield(deltaTime) {
        if (!ollama.hasShield) {
            return;
        }
        shieldTimer -= deltaTime;
        if (shieldTimer <= 0) {
            ollama.hasShield = false;
            setShieldStatus('Shield Expired', 'warning');
            setTimeout(() => {
                if (isPlaying) {
                    setShieldStatus('Inactive Shield', 'inactive');
                }
            }, 600);
            return;
        }
        const secondsLeft = Math.ceil(shieldTimer / 1000);
        setShieldStatus(`Shield Active (${secondsLeft}s)`, 'active');
    }

    function triggerShieldBurst(x, y) {
        shieldBurst = {
            x,
            y,
            timer: 420
        };
    }

    function updateShieldBurst(deltaTime) {
        if (!shieldBurst) {
            return;
        }
        shieldBurst.timer -= deltaTime;
        if (shieldBurst.timer <= 0) {
            shieldBurst = null;
            return;
        }
        const progress = shieldBurst.timer / 420;
        ctx.save();
        ctx.globalAlpha = Math.max(0, progress);
        ctx.lineWidth = 6 * progress;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
        ctx.beginPath();
        ctx.arc(shieldBurst.x, shieldBurst.y, 90 - progress * 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function updateParallax() {
        const stage = STAGES[currentStageIndex];
        const parallax = stage.parallax;
        bgFar.style.backgroundPositionX = `-${(score * parallax.far) % 2000}px`;
        bgMid.style.backgroundPositionX = `-${(score * parallax.mid) % 2000}px`;
        bgNear.style.backgroundPositionX = `-${(score * parallax.near) % 2000}px`;
    }

    function checkCollisions() {
        for (const obstacle of obstacles) {
            if (
                ollama.x < obstacle.x + obstacle.width &&
                ollama.x + ollama.width - 20 > obstacle.x &&
                ollama.y < obstacle.y + obstacle.height &&
                ollama.y + ollama.height > obstacle.y
            ) {
                if (ollama.hasShield) {
                    consumeShield(obstacle);
                    continue;
                }
                gameOver();
                break;
            }
        }
    }

    function updateSpeed() {
        if (gameSpeed < speedCap) {
            gameSpeed = Math.min(speedCap, gameSpeed + speedRamp);
        } else {
            gameSpeed += 0.0015;
        }
    }

    function gameLoop(timestamp) {
        if (!isPlaying) {
            return;
        }

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        ctx.clearRect(0, 0, width, height);

        const groundY = height - GROUND_HEIGHT;
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, groundY, width, GROUND_HEIGHT);

        updateSpeed();
        updateShield(deltaTime);

        handleObstacles(deltaTime);
        handleCollectibles(deltaTime);

        ollama.update(groundY);
        ollama.draw();

        updateShieldBurst(deltaTime);

        checkCollisions();

        scoreAccumulator += gameSpeed * (deltaTime / 1000) * 3.5;
        const scoreIncrement = Math.floor(scoreAccumulator);
        if (scoreIncrement > 0) {
            score += scoreIncrement;
            scoreAccumulator -= scoreIncrement;
            scoreEl.textContent = score;

            if (score > scoreMilestone) {
                playScoreSound();
                scoreMilestone += 120;
            }
        }

        evaluateStageProgression();
        updateParallax();
        updateStageBanner(deltaTime);

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        isPlaying = true;
        score = 0;
        gameSpeed = STAGES[0].baseSpeed;
        speedRamp = STAGES[0].speedRamp;
        speedCap = STAGES[0].maxSpeed;
        obstacles = [];
        collectibles = [];
        obstacleTimer = 0;
        collectibleTimer = 0;
        shieldTimer = 0;
        shieldBurst = null;
        stageBannerTimer = 0;
        scoreMilestone = 100;
        currentStageIndex = 0;
        lastStageReachedIndex = 0;
        achievementsEarned.clear();
        setShieldStatus('Inactive Shield', 'inactive');

        shareStatus.classList.add('hidden');
        shareStatus.textContent = '';
        shareStatus.classList.remove('text-red-300');
        shareStatus.classList.add('text-green-300');
        copyShareButton.disabled = false;
        copyShareButton.textContent = 'Copy text';
        if (nativeShareButton) {
            nativeShareButton.disabled = false;
            nativeShareButton.textContent = 'Share';
        }

        ollama.y = height - GROUND_HEIGHT - ollama.height;
        ollama.velocityY = 0;
        ollama.hasShield = false;
        scoreAccumulator = 0;

        startMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        gameOverMenu.classList.remove('flex');
        scoreDisplay.classList.remove('hidden');
        highscoreDisplay.classList.remove('hidden');
        powerupDisplay.classList.remove('hidden');
        stageBanner.classList.add('hidden');
        achievementContainer.classList.add('hidden');
        achievementList.innerHTML = '';

        highscoreEl.textContent = highScore;
        scoreEl.textContent = score;
        setStage(0, { initial: true });

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        if (!isPlaying) {
            return;
        }
        isPlaying = false;
        playGameOverSound();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('ollamaHighScore', highScore);
            highscoreEl.textContent = highScore;
            awardAchievement('highscore', 'Set a personal best!');
        }

        if (score >= 750) {
            awardAchievement('score-750', 'Crossed 750 points');
        }
        if (score >= 1500) {
            awardAchievement('score-1500', 'Scored over 1500!');
        }

        finalScoreEl.textContent = score;
        scoreDisplay.classList.add('hidden');
        highscoreDisplay.classList.add('hidden');
        stageDisplay.classList.add('hidden');
        powerupDisplay.classList.add('hidden');
        stageBanner.classList.add('hidden');

        gameOverMenu.classList.remove('hidden');
        gameOverMenu.classList.add('flex');

        renderAchievements();
        populateShareMessage();
    }

    function renderAchievements() {
        achievementList.innerHTML = '';
        if (achievementsEarned.size === 0) {
            achievementContainer.classList.add('hidden');
            return;
        }
        achievementContainer.classList.remove('hidden');
        achievementsEarned.forEach((label) => {
            const item = document.createElement('li');
            item.className = 'achievement-badge';
            item.textContent = label;
            achievementList.appendChild(item);
        });
    }

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

    window.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput();
    });

    startButton.addEventListener('click', startGame);
    retryButton.addEventListener('click', startGame);

    copyShareButton.addEventListener('click', async () => {
        const text = shareMessage.value;
        if (!text) {
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                shareMessage.select();
                document.execCommand('copy');
            }
            shareStatus.textContent = 'Copied! Share it anywhere.';
            shareStatus.classList.remove('hidden');
            shareStatus.classList.remove('text-red-300');
            shareStatus.classList.add('text-green-300');
        } catch (error) {
            shareStatus.textContent = 'Could not copy. Try selecting the text manually.';
            shareStatus.classList.remove('hidden');
            shareStatus.classList.add('text-red-300');
            shareStatus.classList.remove('text-green-300');
        }
    });

    if (nativeShareButton) {
        if (!navigator.share) {
            nativeShareButton.classList.add('hidden');
        } else {
            nativeShareButton.addEventListener('click', async () => {
                if (!navigator.share) {
                    return;
                }
                try {
                    await navigator.share({
                        title: "Ollama's Adventure",
                        text: shareMessage.value,
                        url: window.location.href
                    });
                } catch (error) {
                    // User cancelled or share failed; no status change needed
                }
            });
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        ollama.y = height - GROUND_HEIGHT - ollama.height;
    }

    function generateBackgrounds() {
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
        bgFar.style.backgroundSize = 'auto 100%';

        const mountainSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='600' viewBox='0 0 2000 600'>
            <path d='M0 600 L0 400 L200 200 L400 450 L600 250 L850 500 L1100 300 L1400 550 L1600 350 L1800 500 L2000 400 L2000 600 Z' fill='#6ab4e9'/>
            <path d='M-100 600 L-100 450 L100 250 L300 500 L550 300 L750 550 L1000 350 L1300 600 L1500 400 L1700 550 L1900 450 L2100 600 Z' fill='#8bc3f0' opacity='0.7'/>
        </svg>`;
        bgMid.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(mountainSVG)}")`;
        bgMid.style.backgroundSize = 'auto 100%';

        const nearSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='200' viewBox='0 0 2000 200'>
            <path d='M0 200 Q 250 50 500 200 T 1000 200 T 1500 200 T 2000 200' fill='#4CAF50'/>
            <path d='M0 200 Q 200 100 400 200 T 800 200 T 1200 200 T 1600 200 T 2000 200' fill='#5cb85c' opacity='0.8'/>
        </svg>`;
        bgNear.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(nearSVG)}")`;
        bgNear.style.backgroundSize = 'auto 100%';
    }

    function populateShareMessage() {
        if (!shareMessage) {
            return;
        }
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const stage = STAGES[lastStageReachedIndex] || STAGES[0];
        const message = `I just scored ${score} in Ollama's Adventure, made it to ${stage.name}, and dodged ${obstacles.length} wild traps! Think you can beat me? Play now: ${baseUrl}`;
        shareMessage.value = message;
    }

    window.addEventListener('resize', resize);

    // Initial setup
    generateBackgrounds();
    resize();
    highscoreEl.textContent = highScore;
    setShieldStatus('Inactive Shield', 'inactive');
});
