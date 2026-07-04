// 无畏契约烟雾点位指南 - 交互逻辑(2D 平面 / 3D 立体)
(function () {
  "use strict";

  const mapKeys = Object.keys(SMOKE_DATA);
  const state = {
    map: mapKeys[0],
    side: "attack", // attack | defense
    activeSpot: null,
    view: "2d", // 2d | 3d
  };

  const els = {
    mapTabs: document.getElementById("map-tabs"),
    sideBtns: document.querySelectorAll(".side-btn"),
    viewBtns: document.querySelectorAll(".view-btn"),
    mapTitle: document.getElementById("map-title"),
    sideBadge: document.getElementById("side-badge"),
    diagram: document.getElementById("map-diagram"),
    panel3d: document.getElementById("map-3d"),
    hint2d: document.getElementById("hint-2d"),
    hint3d: document.getElementById("hint-3d"),
    list: document.getElementById("spot-list"),
    count: document.getElementById("spot-count"),
    resetBtn: document.getElementById("reset-3d"),
    srStatus: document.getElementById("sr-status"),
  };

  // WebGL 支持检测(不支持则禁用 3D 视图,避免空白面板)
  function webglSupported() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }
  const canUse3D = webglSupported();

  // 转义,避免文字破坏 HTML 属性/内容
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }

  function currentSpots() {
    return SMOKE_DATA[state.map][state.side] || [];
  }

  /* ---------- 地图标签 ---------- */
  function buildMapTabs() {
    els.mapTabs.innerHTML = "";
    mapKeys.forEach((key) => {
      const map = SMOKE_DATA[key];
      const btn = document.createElement("button");
      btn.className = "map-tab" + (key === state.map ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", key === state.map ? "true" : "false");
      btn.dataset.map = key;
      btn.innerHTML = `${esc(map.name)}<small>${esc(map.nameZh)}</small>`;
      btn.addEventListener("click", () => {
        if (state.map === key) return;
        state.map = key;
        state.activeSpot = null;
        render();
      });
      els.mapTabs.appendChild(btn);
    });
  }

  /* ---------- 选中联动 ---------- */
  function setActiveSpot(id) {
    state.activeSpot = state.activeSpot === id ? null : id;
    updateActiveHighlight();
    if (state.view === "3d" && window.Viewer3D) window.Viewer3D.update(getState());
  }

  function updateActiveHighlight() {
    document.querySelectorAll(".marker").forEach((m) => {
      m.classList.toggle("is-active", m.dataset.id === state.activeSpot);
    });
    document.querySelectorAll(".spot-item").forEach((s) => {
      const on = s.dataset.id === state.activeSpot;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (state.activeSpot) {
      const item = document.querySelector(`.spot-item[data-id="${state.activeSpot}"]`);
      if (item) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const spot = currentSpots().find((s) => s.id === state.activeSpot);
      if (spot && els.srStatus) els.srStatus.textContent = `已选中:${spot.name}(${spot.area})`;
    } else if (els.srStatus) {
      els.srStatus.textContent = "";
    }
  }

  /* ---------- 2D 图 ---------- */
  function renderDiagram(spots) {
    const map = SMOKE_DATA[state.map];
    if (map.imgW && map.imgH) {
      els.diagram.style.aspectRatio = map.imgW + " / " + map.imgH;
    }
    let html = `<img class="map-img" src="${esc(map.img)}" alt="${esc(map.name)} 小地图" draggable="false">`;
    spots.forEach((spot, i) => {
      html += `<button class="marker ${state.side}" data-id="${esc(spot.id)}" style="left:${spot.x}%;top:${spot.y}%" title="${esc(spot.name)}">${i + 1}</button>`;
    });
    els.diagram.innerHTML = html;
    els.diagram.querySelectorAll(".marker").forEach((m) => {
      m.addEventListener("click", () => setActiveSpot(m.dataset.id));
    });
  }

  /* ---------- 列表 ---------- */
  function renderList(spots) {
    els.list.innerHTML = "";
    els.count.textContent = spots.length;
    if (spots.length === 0) {
      const li = document.createElement("li");
      li.className = "spot-purpose";
      li.textContent = "该地图此阵营暂无点位数据。";
      els.list.appendChild(li);
      return;
    }
    spots.forEach((spot, i) => {
      const li = document.createElement("li");
      li.className = "spot-item";
      li.dataset.id = spot.id;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-pressed", "false");
      li.setAttribute("aria-label", `${spot.name},${spot.area}`);
      li.innerHTML = `
        <div class="spot-item-head">
          <span class="spot-num ${state.side}">${i + 1}</span>
          <span class="spot-name">${esc(spot.name)}</span>
          <span class="spot-area">${esc(spot.area)}</span>
        </div>
        <div class="spot-purpose">${esc(spot.purpose)}</div>
      `;
      li.addEventListener("click", () => setActiveSpot(spot.id));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveSpot(spot.id);
        }
      });
      els.list.appendChild(li);
    });
  }

  /* ---------- 视图切换 ---------- */
  function applyView() {
    // 若切到 3D 但初始化失败(无 WebGL),回退到 2D
    if (state.view === "3d" && window.Viewer3D) {
      const ok = window.Viewer3D.show();
      if (ok) {
        window.Viewer3D.update(getState());
      } else {
        state.view = "2d";
        if (els.srStatus) els.srStatus.textContent = "当前浏览器不支持 3D 视图,已切回 2D 平面视图。";
      }
    } else if (state.view === "3d" && !window.Viewer3D) {
      state.view = "2d"; // 3D 模块尚未就绪
    }

    const is3d = state.view === "3d";
    els.diagram.hidden = is3d;
    els.panel3d.hidden = !is3d;
    if (els.hint2d) els.hint2d.hidden = is3d;
    if (els.hint3d) els.hint3d.hidden = !is3d;
    els.viewBtns.forEach((b) => {
      const active = b.dataset.view === state.view;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (!is3d && window.Viewer3D) window.Viewer3D.hide();
  }

  function switchView(v) {
    if (state.view === v) return;
    if (v === "3d" && !canUse3D) return;
    state.view = v;
    applyView();
  }

  /* ---------- 主渲染 ---------- */
  function render() {
    const map = SMOKE_DATA[state.map];
    const spots = currentSpots();

    document.querySelectorAll(".map-tab").forEach((t) => {
      const on = t.dataset.map === state.map;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    els.sideBtns.forEach((b) => {
      const active = b.dataset.side === state.side;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    els.mapTitle.textContent = `${map.name} · ${map.nameZh}`;
    els.sideBadge.textContent = state.side === "attack" ? "进攻方" : "防守方";
    els.sideBadge.className = "side-badge " + state.side;

    renderDiagram(spots); // 始终构建 2D(隐藏时也保留 DOM,便于切回)
    renderList(spots);
    updateActiveHighlight();

    if (state.view === "3d" && window.Viewer3D) window.Viewer3D.update(getState());
  }

  /* ---------- 对外状态(供 3D 模块读取/回调) ---------- */
  function getState() {
    return { map: state.map, side: state.side, activeSpot: state.activeSpot, view: state.view };
  }
  window.SmokeApp = { getState, setActiveSpot };

  /* ---------- 事件绑定 ---------- */
  els.sideBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.side === btn.dataset.side) return;
      state.side = btn.dataset.side;
      state.activeSpot = null;
      render();
    });
  });
  els.viewBtns.forEach((btn) => {
    if (btn.dataset.view === "3d" && !canUse3D) {
      btn.disabled = true;
      btn.title = "当前浏览器 / 设备不支持 3D";
    }
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      switchView(btn.dataset.view);
    });
  });
  if (els.resetBtn) {
    els.resetBtn.addEventListener("click", () => {
      if (window.Viewer3D) window.Viewer3D.resetView();
    });
  }

  // 初始化
  buildMapTabs();
  render();
  applyView();
})();
