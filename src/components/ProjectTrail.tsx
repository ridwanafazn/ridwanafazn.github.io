import { useEffect, useRef } from 'preact/hooks';

/**
 * ImageTrail ala React Bits, di-port ke RAF (tanpa GSAP).
 * - Hanya jalan di desktop hover (client:media) dan tanpa reduced motion.
 * - Membaca URL dari `[data-preview]` yang sudah dirender Astro.
 * - Overlay `pointer-events: none`, jadi tidak mengganggu klik baris.
 */
const TRAIL_COUNT = 3;
const LERP = 0.24;
// Transparent 1×1 GIF: SSR tidak mengirim <img> tanpa src (broken-image box).
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function ProjectTrail() {
  const rootRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reduce.matches || !finePointer.matches) return;

    const images = imageRefs.current.filter((img): img is HTMLImageElement => Boolean(img));
    if (images.length === 0) return;

    const points = Array.from({ length: images.length }, () => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0 };
    let visible = false;
    let frame = 0;
    let lastUrl = '';

    const render = () => {
      let leadX = target.x;
      let leadY = target.y;

      points.forEach((point, index) => {
        point.x += (leadX - point.x) * LERP;
        point.y += (leadY - point.y) * LERP;
        leadX = point.x;
        leadY = point.y;

        const img = images[index];
        if (img) {
          img.style.transform = `translate3d(${point.x + index * 14}px, ${point.y + index * 9}px, 0) translate(-50%, -50%) rotate(${index * 2.2}deg) scale(${1 - index * 0.05})`;
        }
      });

      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const show = (event: PointerEvent, url: string) => {
      if (url !== lastUrl) {
        images.forEach((img) => {
          img.src = url;
        });
        lastUrl = url;
      }

      target.x = event.clientX;
      target.y = event.clientY;
      points.forEach((point) => {
        point.x = event.clientX;
        point.y = event.clientY;
      });

      visible = true;
      root.style.opacity = '1';
      start();
    };

    const track = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };

    const hide = () => {
      visible = false;
      root.style.opacity = '0';
      stop();
    };

    const bindings: Array<{
      row: HTMLAnchorElement;
      enter: (event: PointerEvent) => void;
      move: (event: PointerEvent) => void;
      leave: () => void;
    }> = [];

    document.querySelectorAll<HTMLAnchorElement>('[data-preview]').forEach((row) => {
      const url = row.dataset.preview ?? '';
      if (!url) return;

      const enter = (event: PointerEvent) => show(event, url);
      const move = (event: PointerEvent) => track(event);
      const leave = () => hide();

      row.addEventListener('pointerenter', enter);
      row.addEventListener('pointermove', move);
      row.addEventListener('pointerleave', leave);
      bindings.push({ row, enter, move, leave });
    });

    const onScroll = () => {
      if (visible) hide();
    };
    const onBlur = () => hide();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onBlur);

    return () => {
      stop();
      bindings.forEach(({ row, enter, move, leave }) => {
        row.removeEventListener('pointerenter', enter);
        row.removeEventListener('pointermove', move);
        row.removeEventListener('pointerleave', leave);
      });
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      class="pointer-events-none fixed left-0 top-0 z-40 opacity-0 transition-opacity duration-150"
    >
      {Array.from({ length: TRAIL_COUNT }, (_, index) => (
        <img
          key={index}
          ref={(el) => {
            imageRefs.current[index] = el;
          }}
          src={TRANSPARENT_PIXEL}
          alt=""
          decoding="async"
          draggable={false}
          class="absolute left-0 top-0 aspect-[16/10] max-w-none border border-outline-strong bg-surface object-cover shadow-[0_18px_40px_-24px_rgb(17_17_16/0.55)]"
          style={{ width: `${190 - index * 20}px`, opacity: 1 - index * 0.18 }}
        />
      ))}
    </div>
  );
}
