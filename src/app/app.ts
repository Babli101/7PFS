import { Component, ElementRef, ViewChild, Inject, PLATFORM_ID, NgZone, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements AfterViewInit {
  opened = false;
  playing = false;
  muted = false;
  duration = '0:00';
  currentTime = '0:00';
  progress = 0;

  audioSrc = '/Entombed.mp3'; // ✅ audio file in public/

  @ViewChild('audioRef', { static: false }) audioRef!: ElementRef<HTMLAudioElement>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private zone: NgZone) { }

  async openContent() {
    this.opened = true; // hide splash and show content

    if (isPlatformBrowser(this.platformId)) {
      // 🌨️ Initialize snow after content is visible
      this.zone.runOutsideAngular(() => this.initSnow());

      const audio = this.audioRef.nativeElement;

      audio.addEventListener('loadedmetadata', () => {
        this.duration = this.formatTime(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        this.zone.run(() => {
          this.currentTime = this.formatTime(audio.currentTime);
          this.progress = (audio.currentTime / audio.duration) * 100 || 0;
        });
      });

      try {
        await audio.play();
        this.playing = true;
      } catch (err) {
        console.warn('⚠️ Autoplay blocked:', err);
      }
    }
  }

  togglePlayPause() {
    const audio = this.audioRef.nativeElement;
    if (this.playing) {
      audio.pause();
    } else {
      audio.play().catch(err => console.warn('Playback blocked:', err));
    }
    this.playing = !this.playing;
  }

  toggleMute() {
    const audio = this.audioRef.nativeElement;
    audio.muted = !audio.muted;
    this.muted = audio.muted;
  }

  stopAudio() {
    const audio = this.audioRef.nativeElement;
    audio.pause();
    audio.currentTime = 0;
    this.playing = false;
  }

  seekPercent(percent: number) {
    const audio = this.audioRef.nativeElement;
    if (audio.duration) {
      audio.currentTime = (percent / 100) * audio.duration;
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // 🌨️ Snow effect
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSnow();
    }
  }

  initSnow() {
    const canvas = document.getElementById('snow-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const snowflakes: { x: number; y: number; r: number; d: number }[] = [];
    const maxFlakes = 100;

    for (let i = 0; i < maxFlakes; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 4 + 1,
        d: Math.random() * maxFlakes,
      });
    }

    function drawFlakes() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      snowflakes.forEach(f => {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      });
      ctx.fill();
      moveFlakes();
    }

    let angle = 0;

    function moveFlakes() {
      angle += 0.01;
      snowflakes.forEach(f => {
        f.y += Math.cos(angle + f.d) + 1 + f.r / 2;
        f.x += Math.sin(angle) * 2;

        if (f.y > canvas.height) {
          f.y = 0;
          f.x = Math.random() * canvas.width;
        }
      });
    }

    function animate() {
      drawFlakes();
      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
}
