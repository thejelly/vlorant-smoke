// 无畏契约烟雾点位指南 - 交互逻辑
(function () {
  "use strict";

  const mapKeys = Object.keys(SMOKE_DATA);
  const state = {
    map: mapKeys[0],
    side: "attack", // attack | defense
    activeSpot: null,
  };

  const els = {
    mapTabs: document.getElementById("map-tabs"),
    sideBtns: document.querySelectorAll(".side-btn"),
    mapTitle: document.getElementById("map-title"),
    sideBadge: document.getElementById("side-badge"),
    diagram: document.getElementById("map-diagram"),
    list: document.getElementById("spot-list"),
    count: document.getElementById("spot-count"),
  };

  // 构建地图标签
  function buildMapTabs() {
    els.mapTabs.innerHTML = "";
    mapKeys.forEach((key) => {
      const map = SMOKE_DATA[key];
      const btn = document.createElement("button");
      btn.className = "map-tab" + (key === state.map ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.dataset.map = key;
      btn.innerHTML = `${map.name}<small>${map.nameZh}</small>`;
      btn.addEventListener("click", () => {
        state.map = key;
        state.activeSpot = null;
        render();
      });
      els.mapTabs.appendChild(btn);
    });
  }

  function currentSpots() {
    return SMOKE_DATA[state.map][state.side] || [];
  }

  function setActiveSpot(id) {
    state.activeSpot = state.activeSpot === id ? null : id;
    updateActiveHighlight();
  }

  function updateActiveHighlight() {
    document.querySelectorAll(".marker").forEach((m) => {
      m.classList.toggle("is-active", m.dataset.id === state.activeSpot);
    });
    document.querySelectorAll(".spot-item").forEach((s) => {
      s.classList.toggle("is-active", s.dataset.id === state.activeSpot);
    });
    if (state.activeSpot) {
      const item = document.querySelector(
        `.spot-item[data-id="${state.activeSpot}"]`
      );
      if (item) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // 转义,避免文字破坏 HTML 属性/内容
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }

  function renderDiagram(spots) {
    const map = SMOKE_DATA[state.map];
    // 容器按小地图宽高比,保证图片铺满且标记百分比坐标对齐
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
      li.innerHTML = `
        <div class="spot-item-head">
          <span class="spot-num ${state.side}">${i + 1}</span>
          <span class="spot-name">${spot.name}</span>
          <span class="spot-area">${spot.area}</span>
        </div>
        <div class="spot-purpose">${spot.purpose}</div>
      `;
      li.addEventListener("click", () => setActiveSpot(spot.id));
      els.list.appendChild(li);
    });
  }

  function render() {
    const map = SMOKE_DATA[state.map];
    const spots = currentSpots();

    // 更新地图标签高亮
    document.querySelectorAll(".map-tab").forEach((t) => {
      t.classList.toggle("is-active", t.dataset.map === state.map);
    });

    // 更新阵营按钮
    els.sideBtns.forEach((b) => {
      const active = b.dataset.side === state.side;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    // 标题与徽章
    els.mapTitle.textContent = `${map.name} · ${map.nameZh}`;
    els.sideBadge.textContent = state.side === "attack" ? "进攻方" : "防守方";
    els.sideBadge.className = "side-badge " + state.side;

    renderDiagram(spots);
    renderList(spots);
    updateActiveHighlight();
  }

  // 阵营切换
  els.sideBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.side = btn.dataset.side;
      state.activeSpot = null;
      render();
    });
  });

  // 初始化
  buildMapTabs();
  render();
})();
