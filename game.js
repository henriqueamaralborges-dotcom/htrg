/**
 * Echo of Silence - Core Game Engine
 * A narrative experience about hearing loss and resilience.
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('game-container');
        this.screens = {
            intro: document.getElementById('intro-screen'),
            cutscene: document.getElementById('cutscene-screen'),
            ui: document.getElementById('ui-overlay')
        };
        this.subtitleBox = document.querySelector('.subtitle-box');
        
        this.state = 'INTRO'; // State: INTRO, ACCIDENT, AWAKENING, PLAYING
        this.assets = {};
        this.particles = [];
        this.echo = { x: 0, y: 0, opacity: 0, scale: 1.2 };
        this.lyra = { x: 0, y: 0, opacity: 0 };
        this.camera = { x: 0, y: 0 };
        
        this.init();
    }

    async init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Load Assets
        this.loadAssets().then(() => {
            document.getElementById('start-btn').addEventListener('click', () => {
                this.screens.intro.classList.remove('active');
                this.startAccident();
            });
        });

        // Mouse Tracking
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.animate();
    }

    async loadAssets() {
        const toLoad = {
            forest: 'assets/forest_bg.png',
            lyra: 'assets/lyra.png',
            echo: 'assets/echo.png'
        };

        for (const [key, src] of Object.entries(toLoad)) {
            const img = new Image();
            img.src = src;
            await new Promise(r => img.onload = r);
            this.assets[key] = img;
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setState(newState) {
        this.state = newState;
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        
        if (newState === 'INTRO') this.screens.intro.classList.add('active');
        if (newState === 'ACCIDENT') this.screens.cutscene.classList.add('active');
        if (newState === 'AWAKENING') {
            this.screens.cutscene.classList.add('active');
        }
        if (newState === 'PLAYING') {
             this.screens.ui.classList.add('active');
             this.screens.cutscene.classList.add('active'); // Keep subtitle for hints
        }
    }

    async startAccident() {
        this.setState('ACCIDENT');
        
        const sequence = [
            "Lyra está no palco. O som é ensurdecedor.",
            "As luzes brilham. A música é sua vida...",
            "A voz dela alcança as notas mais altas...",
            "*ESTALO ELÉTRICO*",
            "Um zumbido agudo...",
            "E então... o silêncio.",
            "Escuridão absoluta."
        ];

        for (let i = 0; i < sequence.length; i++) {
            this.subtitleBox.innerText = sequence[i];
            if (sequence[i].includes("ESTALO")) {
                this.triggerVibration();
            }
            await this.wait(2500);
        }
        this.startAwakening();
    }

    async startAwakening() {
        this.setState('AWAKENING');
        this.lyra.x = this.canvas.width / 2;
        this.lyra.y = this.canvas.height + 200;
        this.lyra.opacity = 1;
        
        const sequence = [
            "Você acorda... mas algo está diferente.",
            "Vê os pássaros, mas não ouve o canto.",
            "Vê o vento, mas o mundo é mudo.",
            "Você está perdida no seu próprio silêncio."
        ];

        for (const text of sequence) {
            this.subtitleBox.innerText = text;
            await this.wait(3500);
        }

        // Echo Appears
        this.echo.x = this.canvas.width / 2;
        this.echo.y = this.canvas.height / 2;
        this.echo.opacity = 0;
        
        this.subtitleBox.innerText = "Uma presença se aproxima...";
        await this.wait(2000);
        
        while(this.echo.opacity < 1) {
            this.echo.opacity += 0.02;
            await this.wait(20);
        }

        this.subtitleBox.innerText = "Siga o Eco. Ele é seus novos ouvidos.";
        this.setState('PLAYING');
    }

    triggerVibration() {
        document.body.classList.add('vibration-shake');
        setTimeout(() => document.body.classList.remove('vibration-shake'), 1500);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    update() {
        if (this.state === 'PLAYING') {
            // Lyra follows mouse with delay
            this.lyra.x += (this.mouse.x - this.lyra.x) * 0.05;
            this.lyra.y += (this.mouse.y - this.lyra.y) * 0.05;

            // Echo leads Lyra
            const targetX = this.lyra.x + 100;
            const targetY = this.lyra.y - 150;
            this.echo.x += (targetX - this.echo.x) * 0.02;
            this.echo.y += (targetY - this.echo.y) * 0.02;

            // Camera Parallax
            this.camera.x = (this.lyra.x - this.canvas.width/2) * 0.2;
            this.camera.y = (this.lyra.y - this.canvas.height/2) * 0.2;

            // Distance Check (Survival)
            const dist = Math.hypot(this.lyra.x - this.echo.x, this.lyra.y - this.echo.y);
            const blurVal = Math.max(0, (dist - 300) / 10);
            this.canvas.style.filter = `blur(${blurVal}px) grayscale(${Math.min(1, blurVal/20)})`;
            
            // Particles
            if (Math.random() < 0.15) {
                this.particles.push(new WaveParticle(this.echo.x, this.echo.y));
            }
        } else if (this.state === 'AWAKENING') {
            // Lyra rising
            this.lyra.y -= (this.lyra.y - (this.canvas.height * 0.7)) * 0.02;
        }

        this.particles.forEach((p, index) => {
            p.update();
            if (p.life <= 0) this.particles.splice(index, 1);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Background
        if (this.assets.forest) {
            const scale = Math.max(this.canvas.width / this.assets.forest.width, this.canvas.height / this.assets.forest.height) * 1.5;
            this.ctx.drawImage(this.assets.forest, -200, -200, this.assets.forest.width * scale, this.assets.forest.height * scale);
        }

        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));

        // Draw Lyra
        if (this.lyra.opacity > 0 && this.assets.lyra) {
            this.ctx.save();
            this.ctx.globalAlpha = this.lyra.opacity;
            const lh = this.canvas.height * 0.6;
            const lw = this.assets.lyra.width * (lh / this.assets.lyra.height);
            this.ctx.drawImage(this.assets.lyra, this.lyra.x - lw/2, this.lyra.y - lh/2, lw, lh);
            this.ctx.restore();
        }

        // Draw Echo
        if (this.echo.opacity > 0 && this.assets.echo) {
            this.ctx.save();
            this.ctx.globalAlpha = this.echo.opacity * (0.6 + Math.sin(Date.now() / 300) * 0.2);
            const eh = this.canvas.height * 0.7;
            const ew = this.assets.echo.width * (eh / this.assets.echo.height);
            this.ctx.drawImage(this.assets.echo, this.echo.x - ew/2, this.echo.y - eh/2, ew, eh);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

class WaveParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.life = 1;
        this.speed = 4;
    }

    update() {
        this.radius += this.speed;
        this.life -= 0.01;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(76, 178, 255, ${this.life * 0.8})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

window.game = new Game();
