// VALORANT 烟雾点位数据
// side: "attack" 进攻方 | "defense" 防守方
// img / imgW / imgH: 该地图官方小地图(minimap)图片与其像素尺寸(用于容器宽高比)
// 点位 x / y 为百分比(0-100),相对小地图图片左上角定位标记
// 地图图片来源:Riot Games 官方素材(经 InFinity54/VALORANT_DDragon 镜像),仅供学习参考

const SMOKE_DATA = {
  ascent: {
    name: "Ascent", nameZh: "亚海悬城", color: "#4a90d9",
    img: "assets/maps/ascent.png", imgW: 1974, imgH: 1854,
    attack: [
      { id: "asc-a-1", name: "A 主入口烟", area: "A 点", purpose: "封住 A 点主道防守视野,便于队伍从大道推进。", x: 32, y: 22 },
      { id: "asc-a-2", name: "生成器烟", area: "A 点", purpose: "遮挡生成器(Generator)方向的架枪点,保护上包路线。", x: 22, y: 12 },
      { id: "asc-a-3", name: "CT 通道烟", area: "A 点", purpose: "切断防守方从 CT 楼梯支援 A 点的视野。", x: 34, y: 6 },
      { id: "asc-b-1", name: "B 点市场烟", area: "B 点", purpose: "封锁市场(Market)出口,掩护中路转 B 的进攻。", x: 40, y: 62 },
      { id: "asc-b-2", name: "B 主烟", area: "B 点", purpose: "遮挡 B 主进攻大道,限制防守方交叉火力。", x: 32, y: 82 },
      { id: "asc-mid", name: "中路 Catwalk 烟", area: "中路", purpose: "控制中路 Catwalk,建立中路优势并施压两点。", x: 46, y: 46 },
    ],
    defense: [
      { id: "asc-d-a1", name: "A 点回防烟", area: "A 点", purpose: "延缓进攻方从 A 主快攻,争取回防时间。", x: 28, y: 14 },
      { id: "asc-d-a2", name: "A 逼包烟", area: "A 点", purpose: "残局逼包时封视野,阻断进攻方拆包架枪。", x: 31, y: 10 },
      { id: "asc-d-mid", name: "中路封锁烟", area: "中路", purpose: "封住中路口,限制进攻方前压争夺中路。", x: 46, y: 40 },
      { id: "asc-d-b1", name: "B 点默认烟", area: "B 点", purpose: "封 B 主视野,让防守方安全架点。", x: 25, y: 84 },
    ],
  },

  bind: {
    name: "Bind", nameZh: "隐世修所", color: "#c9772e",
    img: "assets/maps/bind.png", imgW: 1907, imgH: 1999,
    attack: [
      { id: "bind-a-1", name: "A 短烟", area: "A 点", purpose: "封住 A 短(A Short)防守视野,便于从传送门快攻。", x: 66, y: 45 },
      { id: "bind-a-2", name: "A 大厅烟", area: "A 点", purpose: "遮挡 A 大厅(Lamps/大门)方向的架枪。", x: 72, y: 30 },
      { id: "bind-b-1", name: "B 长烟", area: "B 点", purpose: "封 B 长(B Long)防守交叉,掩护进 B。", x: 20, y: 42 },
      { id: "bind-b-2", name: "B 后场烟", area: "B 点", purpose: "封锁 CT 与 Hookah 支援视野,保护上包。", x: 18, y: 26 },
      { id: "bind-hookah", name: "水烟房烟", area: "B 点", purpose: "封住水烟房(Hookah)窗口,减少交叉火力。", x: 44, y: 40 },
    ],
    defense: [
      { id: "bind-d-a", name: "A 点架烟", area: "A 点", purpose: "封 A 短进攻口,拖延快攻并保护默认架点。", x: 70, y: 34 },
      { id: "bind-d-b", name: "B 长回防烟", area: "B 点", purpose: "封 B 长进攻视野,争取回防与拉枪时间。", x: 24, y: 34 },
      { id: "bind-d-hookah", name: "水烟房逼包烟", area: "B 点", purpose: "残局封水烟房视野,阻断拆包。", x: 42, y: 40 },
    ],
  },

  haven: {
    name: "Haven", nameZh: "森寒渡口", color: "#3f9e6b",
    img: "assets/maps/haven.png", imgW: 1987, imgH: 1791,
    attack: [
      { id: "hav-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 长与 CT 视野,掩护进攻方进 A。", x: 36, y: 10 },
      { id: "hav-a-2", name: "A 大门烟", area: "A 点", purpose: "遮挡 A 大门(A Sewers)方向支援。", x: 44, y: 14 },
      { id: "hav-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 窗与中路支援,便于中路进 B。", x: 37, y: 46 },
      { id: "hav-c-1", name: "C 长烟", area: "C 点", purpose: "封 C 长(C Long)防守视野。", x: 30, y: 74 },
      { id: "hav-c-2", name: "C 大门烟", area: "C 点", purpose: "遮挡 C 大门(C Cubby)方向架枪。", x: 33, y: 84 },
    ],
    defense: [
      { id: "hav-d-a", name: "A 长封锁烟", area: "A 点", purpose: "封 A 长快攻,延缓进攻节奏。", x: 40, y: 6 },
      { id: "hav-d-mid", name: "中路封烟", area: "中路", purpose: "封中路争夺,限制进攻方旋转。", x: 48, y: 46 },
      { id: "hav-d-c", name: "C 长回防烟", area: "C 点", purpose: "封 C 长进攻口,争取支援时间。", x: 32, y: 80 },
    ],
  },

  split: {
    name: "Split", nameZh: "裂变峡谷", color: "#8b5fbf",
    img: "assets/maps/split.png", imgW: 1862, imgH: 1975,
    attack: [
      { id: "spl-a-1", name: "A 天堂烟", area: "A 点", purpose: "封 A 天堂(A Heaven)高点视野,保护上包。", x: 34, y: 5 },
      { id: "spl-a-2", name: "A 主烟", area: "A 点", purpose: "遮挡 A 主(A Main)防守架枪。", x: 28, y: 16 },
      { id: "spl-b-1", name: "B 天堂烟", area: "B 点", purpose: "封 B 天堂(B Heaven)高点交叉火力。", x: 30, y: 82 },
      { id: "spl-b-2", name: "B 后场烟", area: "B 点", purpose: "封 CT 支援视野,掩护进 B。", x: 36, y: 88 },
      { id: "spl-mid", name: "中路烟", area: "中路", purpose: "控制中路 Mail/Vent,建立中路推进。", x: 48, y: 45 },
    ],
    defense: [
      { id: "spl-d-a", name: "A 主封锁烟", area: "A 点", purpose: "封 A 主快攻,争取回防时间。", x: 30, y: 12 },
      { id: "spl-d-mid", name: "中路封烟", area: "中路", purpose: "封中路推进,守住旋转优势。", x: 48, y: 38 },
      { id: "spl-d-b", name: "B 点逼包烟", area: "B 点", purpose: "残局封 B 视野阻断拆包。", x: 33, y: 86 },
    ],
  },

  icebox: {
    name: "Icebox", nameZh: "森罗监狱", color: "#5fb8d9",
    img: "assets/maps/icebox.png", imgW: 1959, imgH: 1768,
    attack: [
      { id: "ice-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 点 Pipes/Screen 视野,掩护上包。", x: 58, y: 18 },
      { id: "ice-a-2", name: "A Belt 烟", area: "A 点", purpose: "遮挡 A Belt 方向架枪与支援。", x: 66, y: 14 },
      { id: "ice-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 绿房(Green)与 Yellow 视野。", x: 70, y: 80 },
      { id: "ice-b-2", name: "B Snowman 烟", area: "B 点", purpose: "遮挡 B 雪人(Snowman)方向交叉火力。", x: 76, y: 84 },
      { id: "ice-mid", name: "中路烟", area: "中路", purpose: "控制中路 Mid,便于旋转施压。", x: 50, y: 48 },
    ],
    defense: [
      { id: "ice-d-a", name: "A 点封锁烟", area: "A 点", purpose: "封 A 进攻主口,拖延快攻。", x: 60, y: 20 },
      { id: "ice-d-b", name: "B 回防烟", area: "B 点", purpose: "封 B 进攻视野,争取回防。", x: 72, y: 82 },
      { id: "ice-d-mid", name: "中路封烟", area: "中路", purpose: "封中路争夺,守旋转。", x: 50, y: 42 },
    ],
  },

  breeze: {
    name: "Breeze", nameZh: "微风岛屿", color: "#d9a441",
    img: "assets/maps/breeze.png", imgW: 996, imgH: 978,
    attack: [
      { id: "brz-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅与 CT 视野,掩护开阔的 A 进攻。", x: 85, y: 46 },
      { id: "brz-a-2", name: "A 洞穴烟", area: "A 点", purpose: "遮挡 A 洞穴(A Cave)方向支援。", x: 78, y: 54 },
      { id: "brz-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 大道与 Elbow 视野。", x: 16, y: 32 },
      { id: "brz-mid", name: "中路烟", area: "中路", purpose: "控制中路巨门,建立中路优势。", x: 48, y: 50 },
    ],
    defense: [
      { id: "brz-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,延缓推进。", x: 86, y: 46 },
      { id: "brz-d-b", name: "B 回防烟", area: "B 点", purpose: "封 B 进攻视野,争取支援。", x: 16, y: 32 },
    ],
  },

  fracture: {
    name: "Fracture", nameZh: "裂痕", color: "#c96a6a",
    img: "assets/maps/fracture.png", imgW: 1924, imgH: 1836,
    attack: [
      { id: "frc-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅(A Hall)与 Drop 视野。", x: 14, y: 48 },
      { id: "frc-a-2", name: "A 拱门烟", area: "A 点", purpose: "遮挡 A 拱门(Arcade)方向架枪。", x: 20, y: 40 },
      { id: "frc-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 大厅与 Arcade 视野。", x: 86, y: 48 },
      { id: "frc-b-2", name: "B 塔烟", area: "B 点", purpose: "遮挡 B 塔(B Tower)高点视野。", x: 80, y: 42 },
    ],
    defense: [
      { id: "frc-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,拖延快攻。", x: 10, y: 50 },
      { id: "frc-d-b", name: "B 封锁烟", area: "B 点", purpose: "封 B 进攻主口,守旋转。", x: 90, y: 50 },
    ],
  },

  pearl: {
    name: "Pearl", nameZh: "深海明珠", color: "#4bbfa3",
    img: "assets/maps/pearl.png", imgW: 1024, imgH: 986,
    attack: [
      { id: "prl-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅与 A Link 视野,掩护进 A。", x: 84, y: 32 },
      { id: "prl-a-2", name: "A Dugout 烟", area: "A 点", purpose: "遮挡 A Dugout 方向架枪。", x: 76, y: 40 },
      { id: "prl-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 大道与 B Link 视野。", x: 18, y: 38 },
      { id: "prl-mid", name: "中路烟", area: "中路", purpose: "控制中路,便于两点施压与旋转。", x: 50, y: 42 },
    ],
    defense: [
      { id: "prl-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,延缓推进。", x: 85, y: 32 },
      { id: "prl-d-mid", name: "中路封烟", area: "中路", purpose: "封中路争夺,守旋转优势。", x: 50, y: 36 },
      { id: "prl-d-b", name: "B 回防烟", area: "B 点", purpose: "封 B 进攻视野,争取回防。", x: 18, y: 38 },
    ],
  },

  lotus: {
    name: "Lotus", nameZh: "莲华古城", color: "#b06fc9",
    img: "assets/maps/lotus.png", imgW: 934, imgH: 834,
    attack: [
      { id: "lts-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅与 A Link 视野。", x: 86, y: 22 },
      { id: "lts-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 主与旋转门视野。", x: 46, y: 38 },
      { id: "lts-c-1", name: "C 点烟", area: "C 点", purpose: "封 C 大道(C Mound)与 CT 视野。", x: 10, y: 40 },
      { id: "lts-c-2", name: "C 门烟", area: "C 点", purpose: "遮挡 C 旋转门方向支援。", x: 18, y: 44 },
    ],
    defense: [
      { id: "lts-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,拖延快攻。", x: 87, y: 22 },
      { id: "lts-d-b", name: "B 封烟", area: "B 点", purpose: "封 B 争夺,守中路旋转。", x: 46, y: 36 },
      { id: "lts-d-c", name: "C 回防烟", area: "C 点", purpose: "封 C 进攻视野,争取回防。", x: 10, y: 40 },
    ],
  },

  sunset: {
    name: "Sunset", nameZh: "日落之城", color: "#e08a4b",
    img: "assets/maps/sunset.png", imgW: 1971, imgH: 2048,
    attack: [
      { id: "sun-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅与 A Alley 视野。", x: 82, y: 42 },
      { id: "sun-a-2", name: "A Elbow 烟", area: "A 点", purpose: "遮挡 A Elbow 方向架枪。", x: 74, y: 36 },
      { id: "sun-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 主与 Market 视野。", x: 14, y: 44 },
      { id: "sun-mid", name: "中路烟", area: "中路", purpose: "控制中路 Mid Courtyard,便于旋转。", x: 50, y: 44 },
    ],
    defense: [
      { id: "sun-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,延缓推进。", x: 83, y: 42 },
      { id: "sun-d-mid", name: "中路封烟", area: "中路", purpose: "封中路争夺,守旋转。", x: 50, y: 38 },
      { id: "sun-d-b", name: "B 回防烟", area: "B 点", purpose: "封 B 进攻视野,争取回防。", x: 14, y: 44 },
    ],
  },

  abyss: {
    name: "Abyss", nameZh: "深渊之城", color: "#6a7ec9",
    img: "assets/maps/abyss.png", imgW: 1002, imgH: 1024,
    attack: [
      { id: "aby-a-1", name: "A 点烟", area: "A 点", purpose: "封 A 大厅与 A Link 视野。", x: 40, y: 12 },
      { id: "aby-b-1", name: "B 点烟", area: "B 点", purpose: "封 B 主与 B Tower 视野。", x: 38, y: 90 },
      { id: "aby-mid", name: "中路烟", area: "中路", purpose: "控制中路,便于两点施压。", x: 50, y: 48 },
    ],
    defense: [
      { id: "aby-d-a", name: "A 封锁烟", area: "A 点", purpose: "封 A 进攻主口,拖延快攻。", x: 40, y: 12 },
      { id: "aby-d-b", name: "B 回防烟", area: "B 点", purpose: "封 B 进攻视野,争取回防。", x: 38, y: 90 },
    ],
  },
};

// 供 ES 模块(3D 视图)读取
if (typeof window !== "undefined") window.SMOKE_DATA = SMOKE_DATA;
