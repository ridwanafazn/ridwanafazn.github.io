// Engine globe 3D (three.js). Di-load HANYA di >=1024px, setelah idle.
// Dipisah dari komponen supaya three.js tidak ikut di bundle awal.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const GLOBE_RADIUS = 5;
const FOV = 45;
const INDONESIA_ROTATION = Math.PI * 0.8;

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function buildParticleEarth(img: HTMLImageElement, density: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const positions: number[] = [];
  for (let y = 0; y < canvas.height; y += density) {
    for (let x = 0; x < canvas.width; x += density) {
      // Peta: air putih, daratan hitam
      if (data[(y * canvas.width + x) * 4] < 128) {
        const lat = 90 - (y / canvas.height) * 180;
        const lon = (x / canvas.width) * 360 - 180;
        const p = latLonToVector3(lat, lon, GLOBE_RADIUS);
        positions.push(p.x, p.y, p.z);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const dctx = dot.getContext('2d')!;
  dctx.beginPath();
  dctx.arc(16, 16, 14, 0, Math.PI * 2);
  dctx.fillStyle = '#ffffff';
  dctx.fill();

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    map: new THREE.CanvasTexture(dot),
    transparent: true,
    alphaTest: 0.1,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 1;
  return points;
}

function buildAtmosphere() {
  const group = new THREE.Group();

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.05, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0x2a62b3) } },
      vertexShader: `
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float intensity;
        void main() {
          gl_FragColor = vec4(color * 1.5, intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  group.add(atmosphere);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 0.98, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x020408, transparent: true, opacity: 0.95 }),
  );
  group.add(core);
  return group;
}

type GlobeInstance = { canvas: HTMLCanvasElement; relayout: () => void; destroy: () => void };
let active: GlobeInstance | null = null;

export function initHeroGlobe() {
  const wrap = document.getElementById('hero-globe-wrap');
  const canvas = document.getElementById('hero-globe-canvas') as HTMLCanvasElement | null;
  if (!wrap || !canvas) return;

  // Sudah jalan di canvas yang sama (resize / navigasi balik): cukup re-layout.
  if (active && active.canvas === canvas) {
    active.relayout();
    return;
  }
  active?.destroy();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const earthGroup = new THREE.Group();
  earthGroup.rotation.y = INDONESIA_ROTATION;
  earthGroup.add(buildAtmosphere());
  scene.add(earthGroup);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enableZoom = false; // jangan bajak scroll halaman
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.75;

  function layout() {
    const w = wrap!.clientWidth;
    const h = wrap!.clientHeight;
    if (!w || !h) return;

    // Lebih jauh dari sebelumnya, tetap keluar layar di kanan/atas/bawah.
    // Tepi kiri & bawah dilunakkan oleh mask di HeroGlobe.astro.
    const D = h * 1.1;
    const cx = D / 2 + w * 0.16;
    const cy = h / 2;

    const visibleHeight = (2 * GLOBE_RADIUS * h) / D;
    const dist = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));

    camera.aspect = w / h;
    camera.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
    camera.position.set(0, dist * 0.12, dist);
    camera.position.setLength(dist);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  layout();

  const resizeObserver = new ResizeObserver(() => layout());
  resizeObserver.observe(wrap);

  let isVisible = true;
  const visibilityObserver = new IntersectionObserver(
    (entries) => (isVisible = entries[0].isIntersecting),
    { threshold: 0 },
  );
  visibilityObserver.observe(wrap);

  const base = import.meta.env.BASE_URL;
  const img = new Image();
  img.onload = () => {
    earthGroup.rotation.y = INDONESIA_ROTATION;
    earthGroup.add(buildParticleEarth(img, 2));
    wrap.setAttribute('data-ready', '');
  };
  img.onerror = () => wrap.setAttribute('data-ready', '');
  img.src = `${base.endsWith('/') ? base : base + '/'}textures/earth-water.png`;

  let animId = 0;
  let lastFrame = performance.now();
  // Searah jarum jam (dilihat dari depan). `prefers-reduced-motion` tidak
  // mematikan rotasi, hanya diperlambat ~3x.
  const ROTATION_SPEED = reducedMotion ? 0.012 : 0.035;

  function destroy() {
    cancelAnimationFrame(animId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    controls.dispose();
    renderer.dispose();
    if (active?.canvas === canvas) active = null;
  }

  active = { canvas, relayout: layout, destroy };

  function animate(now: number) {
    // DOM dibuang (ClientRouter pindah halaman) → hentikan dan lepas WebGL.
    if (!wrap!.isConnected) {
      destroy();
      return;
    }

    animId = requestAnimationFrame(animate);
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    if (!isVisible) return;
    earthGroup.rotation.y -= delta * ROTATION_SPEED;
    controls.update();
    renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(animate);
}
