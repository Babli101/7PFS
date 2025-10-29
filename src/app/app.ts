import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  HostListener,
  Inject,
  PLATFORM_ID,
  NgZone
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, AfterViewInit {
  opened = false;
  duration = '0:00';
  currentTime = '0:00';
  playing = false;
  muted = false;

  // ✅ add this line
  currentBg = '/bg1.jpg';

  audioSrc = '/spring-lofi.mp3';

  @ViewChild('audioRef', { static: false }) audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('cardRef', { static: false }) cardRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bgGradientRef', { static: false }) bgGradientRef!: ElementRef<HTMLDivElement>; // ✅ Added for gradient follow

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private zone: NgZone) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const audio = this.audioRef.nativeElement;
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
      this.zone.run(() => (this.duration = this.formatTime(audio.duration)));
    });

    audio.addEventListener('timeupdate', () => {
      this.zone.run(() => (this.currentTime = this.formatTime(audio.currentTime)));
    });

    audio.addEventListener('play', () => this.zone.run(() => (this.playing = true)));
    audio.addEventListener('pause', () => this.zone.run(() => (this.playing = false)));

    // Start snow animation
    this.initSnowCanvas();

    // ==============================
    // 1️⃣ BG GRADIENT FOLLOW MOUSE
    // ==============================
    const cursor = this.bgGradientRef?.nativeElement;
    if (cursor) {
      let mouseX = 0;
      let mouseY = 0;
      let cursorX = 0;
      let cursorY = 0;
      const speed = 0.08; // adjust for smoothness

      const animate = () => {
        const distX = mouseX - cursorX;
        const distY = mouseY - cursorY;

        cursorX += distX * speed;
        cursorY += distY * speed;

        // Use transform instead of left/top
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

        requestAnimationFrame(animate);
      };

      animate();

      // Get stage container to calculate relative mouse position
      const stage = document.querySelector('.stage') as HTMLElement;

      document.addEventListener('mousemove', (event: MouseEvent) => {
        if (!stage) return;
        const rect = stage.getBoundingClientRect();

        // Mouse coordinates relative to stage center
        mouseX = event.clientX - rect.left - rect.width / 2;
        mouseY = event.clientY - rect.top - rect.height / 2;
      });
    }

    // ==============================
    // 2️⃣ PURE TS 3D CARD TILT (already included)
    // ==============================
    const card = this.cardRef?.nativeElement;
    if (card) {
      card.addEventListener('mousemove', (e: MouseEvent) => this.onCardMouseMove(e));
      card.addEventListener('mouseleave', () => this.onCardMouseLeave());
    }
  }

  // ---------- SPLASH / OPEN ----------
  async open() {
    if (!this.opened) {
      this.opened = true;
      this.currentBg = '/bg2.jpg'; // ✅ make sure bg2.jpg is in public/ folder (src/assets or public)
      const audio = this.audioRef.nativeElement;

      try {
        await audio.play();
        this.playing = true;
      } catch (err) {
        console.warn('⚠️ Autoplay blocked:', err);
      }
    }
  }

  close() {
    this.opened = false;
    this.currentBg = ''; // ✅ hide background again (pure black)
    this.stopAudio();
  }

  // ---------- AUDIO CONTROLS ----------
  togglePlayPause() {
    const audio = this.audioRef.nativeElement;
    if (this.playing) audio.pause();
    else audio.play().catch((err) => console.warn('⚠️ Playback blocked:', err));
  }

  toggleMute() {
    const audio = this.audioRef.nativeElement;
    audio.muted = !audio.muted;
    this.muted = audio.muted;
  }

  playAudio() {
    const audio = this.audioRef.nativeElement;
    audio.play().then(() => (this.playing = true)).catch(() =>
      console.warn('⚠️ Autoplay blocked — user must interact first.')
    );
  }

  stopAudio() {
    const audio = this.audioRef.nativeElement;
    audio.pause();
    audio.currentTime = 0;
    this.playing = false;
  }

  seekPercent(percent: number) {
    const audio = this.audioRef.nativeElement;
    if (audio.duration) audio.currentTime = (percent / 100) * audio.duration;
  }

  get progress(): number {
    const audio = this.audioRef?.nativeElement;
    return audio && audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.close();
  }

  // ---------- 3D CARD TILT ----------
  onCardMouseMove(event: MouseEvent) {
    const card = this.cardRef?.nativeElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * -5;
    const rotateY = ((x - midX) / midX) * 5;
    const translateX = ((x - midX) / midX) * 6;
    const translateY = ((y - midY) / midY) * 6;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${translateX}px, ${translateY}px)`;
  }

  onCardMouseLeave() {
    const card = this.cardRef?.nativeElement;
    if (!card) return;
    card.style.transform = 'rotateX(0deg) rotateY(0deg) translate(0px, 0px)';
  }

  // ---------- SNOW ANIMATION ----------
  initSnowCanvas() {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = document.getElementById('snow-c') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const maxParticles = Math.floor(W / 25);
    const particles = Array.from({ length: maxParticles }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 3 + 1,
      d: Math.random() * maxParticles
    }));

    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      for (const p of particles) {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
      update();
      requestAnimationFrame(draw);
    };

    const update = () => {
      angle += 0.01;
      for (const p of particles) {
        p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
        p.x += Math.sin(angle) * 2;
        if (p.y > H) {
          p.y = -10;
          p.x = Math.random() * W;
        }
      }
    };

    draw();

    window.addEventListener('resize', () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    });
  }
}
