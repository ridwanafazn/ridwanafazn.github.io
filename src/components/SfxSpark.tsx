import { useEffect, useRef } from 'preact/hooks';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  width: number;
  color: string;
}

const COLORS = ['#c8ff3d', '#d9480f', '#f3f5f1'];
const MAX_SPARKS = 120;

/**
 * ClickSpark ala React Bits, diadaptasi ke canvas 2D + Preact.
 * Menempel ke tombol SFX yang sudah dirender Astro — tidak mengganti markup
 * tombol, jadi listener audio yang lama tetap jalan.
 */
export default function SfxSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = document.querySelector<HTMLButtonElement>('.hero-sfx');
    if (!canvas || !button) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let sparks: Spark[] = [];

    const resize = () => {
      // 1.5 cukup tajam untuk percikan; canvas full-viewport di DPR 2 boros memori.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      sparks = sparks.filter((spark) => spark.life > 0);
      for (const spark of sparks) {
        spark.life -= 1;
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.12;
        spark.vx *= 0.985;
        spark.vy *= 0.985;

        ctx.globalAlpha = Math.max(0, spark.life / spark.maxLife);
        ctx.strokeStyle = spark.color;
        ctx.lineWidth = spark.width;
        ctx.beginPath();
        ctx.moveTo(spark.x, spark.y);
        ctx.lineTo(spark.x - spark.vx * 2.4, spark.y - spark.vy * 2.4);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame = sparks.length > 0 ? requestAnimationFrame(tick) : 0;
    };

    const burst = () => {
      const rect = button.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const count = 14;

      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 1.8 + Math.random() * 3.2;
        const maxLife = 26 + Math.random() * 18;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          life: maxLife,
          maxLife,
          width: 1 + Math.random() * 1.6,
          color: COLORS[i % COLORS.length],
        });
      }

      if (sparks.length > MAX_SPARKS) sparks = sparks.slice(-MAX_SPARKS);
      if (!frame) frame = requestAnimationFrame(tick);
    };

    resize();
    button.addEventListener('click', burst);
    window.addEventListener('resize', resize);

    return () => {
      button.removeEventListener('click', burst);
      window.removeEventListener('resize', resize);
      if (frame) cancelAnimationFrame(frame);
      sparks = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 z-30"
    />
  );
}
