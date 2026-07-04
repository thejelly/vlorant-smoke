// 3D 地图视图:用 three.js 把官方小地图做成立体沙盘,
// 每个下烟点位渲染为从地面升起的体积烟雾柱(进攻橙 / 防守蓝)。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SIDE_COLORS = { attack: 0xff6b4a, defense: 0x4a9fff };
const SMOKE_H = 15; // 烟柱高度(世界单位)

let container, renderer, scene, camera, controls, clock, raycaster, pointer, ro;
let inited = false, running = false, rafId = null;

let mapKey = null, side = "attack", activeId = null;         // 当前已渲染状态
let dMap = null, dSide = "attack", dActive = null;           // 期望状态
let mapGroup = null, smokeGroup = null;
let spotObjs = [], pickMeshes = [];
let planeW = 100, planeH = 100, loadToken = 0;

let puffTexture = null;
const labelCache = new Map();
const texLoader = new THREE.TextureLoader();

const DATA = () => (window.SMOKE_DATA || {});

/* ---------- 程序化贴图 ---------- */
function makePuffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.45, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeLabelTexture(num, css) {
  const key = num + "|" + css;
  if (labelCache.has(key)) return labelCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, Math.PI * 2);
  ctx.fillStyle = css;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  labelCache.set(key, t);
  return t;
}

/* ---------- 初始化 ---------- */
function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 600, container.clientHeight || 450, false);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, aspect(), 0.1, 3000);
  resetCamera();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.4;
  controls.minDistance = 45;
  controls.maxDistance = 320;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(50, 140, 70);
  scene.add(dir);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  puffTexture = makePuffTexture();

  renderer.domElement.addEventListener("click", onClick);
  renderer.domElement.addEventListener("pointermove", onMove);
  ro = new ResizeObserver(resize);
  ro.observe(container);
  inited = true;
}

const aspect = () => (container.clientWidth || 4) / (container.clientHeight || 3);
function resetCamera() {
  camera.position.set(0, 96, 108);
  camera.lookAt(0, 0, 0);
}

/* ---------- 地图与烟雾构建 ---------- */
function disposeObj(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m.map && m !== null && m.map !== puffTexture && !labelCache.has(m.__lk)) {
          // 仅释放地图底图纹理;puff/label 为共享纹理,保留
        }
        m.dispose();
      });
    }
  });
}

function disposeMap() {
  if (!mapGroup) return;
  scene.remove(mapGroup);
  mapGroup.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (o.material.map && o.userData.ownTexture) o.material.map.dispose();
      o.material.dispose();
    }
  });
  mapGroup = null;
}

function disposeSmoke() {
  if (!smokeGroup) return;
  scene.remove(smokeGroup);
  smokeGroup.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose(); // 共享的 puffTexture/label 纹理不在此释放
  });
  smokeGroup = null;
  spotObjs = [];
  pickMeshes = [];
}

function loadMap(key) {
  const map = DATA()[key];
  if (!map) return;
  const token = ++loadToken;
  texLoader.load(map.img, (tex) => {
    if (token !== loadToken) { tex.dispose(); return; }
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposeSmoke();
    disposeMap();
    buildMap(map, tex);
    buildSmoke();
  });
}

function buildMap(map, tex) {
  const ar = map.imgW / map.imgH;
  if (ar >= 1) { planeW = 100; planeH = 100 / ar; }
  else { planeH = 100; planeW = 100 * ar; }

  mapGroup = new THREE.Group();

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  plane.userData.ownTexture = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.06;
  mapGroup.add(plane);

  const pedH = 6;
  const ped = new THREE.Mesh(
    new THREE.BoxGeometry(planeW * 1.06, pedH, planeH * 1.06),
    new THREE.MeshStandardMaterial({ color: 0x121821, roughness: 0.85, metalness: 0.12 })
  );
  ped.position.y = -pedH / 2;
  mapGroup.add(ped);

  scene.add(mapGroup);
}

function buildSmoke() {
  disposeSmoke();
  const map = DATA()[mapKey];
  if (!map) return;
  const spots = map[side] || [];
  const colorHex = SIDE_COLORS[side];
  const css = "#" + colorHex.toString(16).padStart(6, "0");

  smokeGroup = new THREE.Group();
  scene.add(smokeGroup);

  spots.forEach((spot, i) => {
    const wx = (spot.x / 100 - 0.5) * planeW;
    const wz = (spot.y / 100 - 0.5) * planeH;
    const g = new THREE.Group();
    g.position.set(wx, 0, wz);

    // 地面辉光圆盘
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(4.4, 32),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.14;
    g.add(disc);

    // 体积烟雾粒子
    const puffs = [];
    for (let k = 0; k < 16; k++) {
      const m = new THREE.SpriteMaterial({ map: puffTexture, color: colorHex, transparent: true, opacity: 0.28, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.userData = {
        radius: 1 + Math.random() * 2.4,
        ang: Math.random() * Math.PI * 2,
        swirl: (Math.random() * 2 - 1) * 0.9,
        phase: Math.random(),
        speed: 0.11 + Math.random() * 0.12,
        sBase: 5 + Math.random() * 4,
        maxOp: 0.2 + Math.random() * 0.14,
      };
      puffs.push(s);
      g.add(s);
    }

    // 编号标签
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(i + 1, css), transparent: true, depthWrite: false, depthTest: false }));
    label.position.y = SMOKE_H + 4;
    label.scale.set(7, 7, 1);
    label.renderOrder = 20;
    g.add(label);

    // 不可见拾取体(便于点击整根烟柱)
    const pick = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, SMOKE_H + 8, 12, 1, true),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = (SMOKE_H + 8) / 2;
    pick.userData.spotId = spot.id;
    g.add(pick);
    pickMeshes.push(pick);

    smokeGroup.add(g);
    spotObjs.push({ id: spot.id, disc, puffs, label });
  });
}

/* ---------- 交互 ---------- */
function setPointer(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}
function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickMeshes, false);
  return hits.length ? hits[0].object.userData.spotId : null;
}
function onClick(e) {
  setPointer(e);
  const id = pick();
  if (id && window.SmokeApp) window.SmokeApp.setActiveSpot(id);
}
function onMove(e) {
  setPointer(e);
  renderer.domElement.style.cursor = pick() ? "pointer" : "grab";
}

/* ---------- 渲染循环 ---------- */
function loop() {
  rafId = requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  controls.update();
  for (const o of spotObjs) {
    const on = o.id === activeId ? 1 : 0;
    for (const s of o.puffs) {
      const p = s.userData;
      const prog = (t * p.speed + p.phase) % 1;
      const spread = 1 + prog * 1.6;
      const ang = p.ang + prog * p.swirl;
      s.position.set(Math.cos(ang) * p.radius * spread, prog * SMOKE_H + 2, Math.sin(ang) * p.radius * spread);
      const sc = p.sBase * (0.5 + prog * 0.9);
      s.scale.set(sc, sc, 1);
      s.material.opacity = Math.sin(prog * Math.PI) * (p.maxOp + on * 0.18);
    }
    o.disc.material.opacity = 0.3 + on * 0.4 + Math.sin(t * 2) * (on ? 0.12 : 0.04);
    const ls = 7 * (1 + on * 0.4);
    o.label.scale.set(ls, ls, 1);
  }
  renderer.render(scene, camera);
}

function resize() {
  if (!inited) return;
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* ---------- 对外 API ---------- */
function sync() {
  if (!inited || !running) return;
  if (dMap !== mapKey) {
    mapKey = dMap;
    side = dSide;
    activeId = dActive;
    loadMap(mapKey);
  } else if (dSide !== side) {
    side = dSide;
    activeId = dActive;
    buildSmoke();
  } else {
    activeId = dActive;
  }
}

const Viewer3D = {
  update(state) {
    dMap = state.map; dSide = state.side; dActive = state.activeSpot;
    sync();
  },
  show() {
    container = container || document.getElementById("map-3d");
    container.hidden = false;
    if (!inited) init();
    running = true;
    resize();
    mapKey = null; // 强制重建当前地图
    sync();
    if (!rafId) loop();
  },
  hide() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (container) container.hidden = true;
  },
  resetView() {
    if (!inited) return;
    resetCamera();
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;
    controls.update();
  },
  resize,
};

container = document.getElementById("map-3d");
window.Viewer3D = Viewer3D;

// 若模块加载完成时用户已切到 3D,则自动启动
if (window.SmokeApp && window.SmokeApp.getState().view === "3d") {
  Viewer3D.show();
  Viewer3D.update(window.SmokeApp.getState());
}
