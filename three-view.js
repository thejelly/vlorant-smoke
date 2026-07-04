// 3D 地图视图:用 three.js 把官方小地图做成立体沙盘,
// 每个下烟点位渲染为从地面升起的体积烟雾柱(进攻橙 / 防守蓝)。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SIDE_COLORS = { attack: 0xff6b4a, defense: 0x4a9fff };
const SMOKE_H = 15; // 烟柱高度(世界单位)
const STATIC_T = 0.28; // 减少动态效果时的固定动画相位

// 是否降低动态效果(尊重系统「减少动态效果」偏好)
const mqReduce = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : null;
let reduced = mqReduce ? mqReduce.matches : false;

let container, statusEl, renderer, scene, camera, controls, clock, raycaster, pointer, ro;
let inited = false, failed = false, running = false, rafId = null;

let mapKey = null, side = "attack", activeId = null;   // 已渲染状态
let builtKey = null;                                     // 已完成底图构建的地图
let dMap = null, dSide = "attack", dActive = null;      // 期望状态
let mapGroup = null, smokeGroup = null;
let spotObjs = [], pickMeshes = [];
let planeW = 100, planeH = 100, loadToken = 0;
let cachedRect = null, downX = 0, downY = 0;

let puffTexture = null;
const labelCache = new Map();
const texLoader = new THREE.TextureLoader();

const DATA = () => window.SMOKE_DATA || {};
const aspect = () => (container.clientWidth || 4) / (container.clientHeight || 3);

/* ---------- 状态提示(载入 / 错误 / 不支持) ---------- */
function ensureStatusEl() {
  if (statusEl) return statusEl;
  statusEl = document.createElement("div");
  statusEl.className = "map3d-status";
  statusEl.setAttribute("role", "status");
  container.appendChild(statusEl);
  return statusEl;
}
function setStatus(msg) {
  ensureStatusEl();
  if (msg) { statusEl.textContent = msg; statusEl.hidden = false; container.setAttribute("aria-busy", "true"); }
  else { statusEl.hidden = true; container.removeAttribute("aria-busy"); }
}

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

/* ---------- 初始化(含 WebGL 失败兜底) ---------- */
function init() {
  container = container || document.getElementById("map-3d");
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    failed = true;
    setStatus("当前浏览器 / 设备不支持 WebGL,无法显示 3D 视图,请使用 2D 平面视图。");
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 600, container.clientHeight || 450, false);
  const cv = renderer.domElement;
  cv.tabIndex = 0;
  cv.setAttribute("role", "img");
  cv.setAttribute("aria-label", "3D 立体地图,可拖动旋转、滚轮缩放");
  container.appendChild(cv);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, aspect(), 0.1, 3000);
  resetCamera();

  controls = new OrbitControls(camera, cv);
  controls.target.set(0, 0, 0);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.4;
  controls.minDistance = 45;
  controls.maxDistance = 320;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.5;
  controls.listenToKeyEvents(cv); // 方向键平移
  controls.addEventListener("start", () => { controls.autoRotate = false; });
  controls.addEventListener("change", needRender);

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(50, 140, 70);
  scene.add(dir);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  puffTexture = makePuffTexture();

  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("click", onClick);
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerenter", () => { cachedRect = cv.getBoundingClientRect(); });
  cv.addEventListener("pointerleave", () => { cv.style.cursor = "grab"; });
  cv.style.cursor = "grab";

  ro = new ResizeObserver(resize);
  ro.observe(container);

  if (mqReduce && mqReduce.addEventListener) {
    mqReduce.addEventListener("change", onReduceChange);
  }
  inited = true;
  return true;
}

function onReduceChange(e) {
  reduced = e.matches;
  if (!inited) return;
  controls.enableDamping = !reduced;
  controls.autoRotate = false;
  if (reduced) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    renderFrame(false);
  } else if (running && !rafId) {
    loop();
  }
}

function resetCamera() {
  camera.position.set(0, 96, 108);
  camera.lookAt(0, 0, 0);
}

/* ---------- 释放资源 ---------- */
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
  builtKey = null;
}

function disposeSmoke() {
  if (!smokeGroup) return;
  scene.remove(smokeGroup);
  smokeGroup.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    // 逐个 sprite/mesh 的材质需释放;共享的 puffTexture / label 纹理不在此释放
    if (o.material) o.material.dispose();
  });
  smokeGroup = null;
  spotObjs = [];
  pickMeshes = [];
}

/* ---------- 加载地图 ---------- */
function loadMap(key) {
  const map = DATA()[key];
  if (!map) return;
  const token = ++loadToken;
  setStatus("载入地图中…");
  texLoader.load(
    map.img,
    (tex) => {
      if (token !== loadToken) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      disposeSmoke();
      disposeMap();
      buildMap(map, tex);
      buildSmoke();
      setStatus(null);
      needRender();
    },
    undefined,
    () => {
      if (token !== loadToken) return;
      setStatus("地图图片加载失败,请检查网络或刷新页面。");
    }
  );
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
  builtKey = mapKey;
}

function buildSmoke() {
  disposeSmoke();
  const map = DATA()[mapKey];
  // 底图尚未就绪(如切换中)则跳过,待 loadMap 回调统一构建,避免用旧尺寸放置
  if (!map || builtKey !== mapKey) return;
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

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(4.4, 32),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.14;
    g.add(disc);

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

    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(i + 1, css), transparent: true, depthWrite: false, depthTest: false }));
    label.position.y = SMOKE_H + 4;
    label.scale.set(7, 7, 1);
    label.renderOrder = 20;
    g.add(label);

    const pick = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, SMOKE_H + 8, 12, 1, true),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = (SMOKE_H + 8) / 2;
    pick.userData.spotId = spot.id;
    pick.visible = true; // 需可被射线拾取;opacity 0 故不可见
    g.add(pick);
    pickMeshes.push(pick);

    smokeGroup.add(g);
    spotObjs.push({ id: spot.id, disc, puffs, label });
  });

  applySmoke(reduced ? STATIC_T : 0); // 立即摆放一帧,避免初始堆叠在原点
}

/* ---------- 交互 ---------- */
function getRect() {
  if (!cachedRect) cachedRect = renderer.domElement.getBoundingClientRect();
  return cachedRect;
}
function setPointer(e, fresh) {
  const r = fresh ? renderer.domElement.getBoundingClientRect() : getRect();
  if (fresh) cachedRect = r;
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}
function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickMeshes, false);
  return hits.length ? hits[0].object.userData.spotId : null;
}
function onDown(e) { downX = e.clientX; downY = e.clientY; }
function onClick(e) {
  // 拖动结束不算点击
  if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return;
  setPointer(e, true);
  const id = pick();
  if (id && window.SmokeApp) window.SmokeApp.setActiveSpot(id);
}
function onMove(e) {
  setPointer(e, false);
  renderer.domElement.style.cursor = pick() ? "pointer" : "grab";
}

/* ---------- 渲染 ---------- */
function applySmoke(t) {
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
    const pulse = reduced ? 0 : Math.sin(t * 2) * (on ? 0.12 : 0.04);
    o.disc.material.opacity = 0.3 + on * 0.4 + pulse;
    const ls = 7 * (1 + on * 0.4);
    o.label.scale.set(ls, ls, 1);
  }
}

function renderFrame(animated) {
  const t = animated && clock ? clock.getElapsedTime() : STATIC_T;
  applySmoke(t);
  renderer.render(scene, camera);
}

function loop() {
  rafId = requestAnimationFrame(loop);
  controls.update();
  renderFrame(true);
}

// 减少动态效果时,按需渲染一帧(非连续)
function needRender() {
  if (reduced && running && inited && !failed) renderFrame(false);
}

function resize() {
  if (!inited || failed) return;
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  cachedRect = null;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  needRender();
}

/* ---------- 对外 API ---------- */
function sync() {
  if (!inited || !running || failed) return;
  if (dMap !== mapKey) {
    mapKey = dMap; side = dSide; activeId = dActive;
    loadMap(mapKey);
  } else if (dSide !== side) {
    side = dSide; activeId = dActive;
    buildSmoke();
    needRender();
  } else {
    activeId = dActive;
    needRender();
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
    if (failed) { setStatus("当前浏览器 / 设备不支持 WebGL,无法显示 3D 视图,请使用 2D 平面视图。"); return false; }
    if (!inited) { if (!init()) return false; }
    running = true;
    resize();
    sync(); // 不强制重载:地图未变则复用已有场景
    if (reduced) renderFrame(false);
    else if (!rafId) loop();
    return true;
  },
  hide() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (container) container.hidden = true;
  },
  resetView() {
    if (!inited || failed) return;
    resetCamera();
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;
    controls.update();
    needRender();
  },
  resize,
  supported: () => !failed,
};

container = document.getElementById("map-3d");
window.Viewer3D = Viewer3D;

// 若模块加载完成时用户已切到 3D,则自动启动
if (window.SmokeApp && window.SmokeApp.getState().view === "3d") {
  if (Viewer3D.show()) Viewer3D.update(window.SmokeApp.getState());
}
