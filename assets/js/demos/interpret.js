/* 遥感图像判读：七大判读标志实战（机场影像） */
Lab.register({
  id: 'interpret', group: 'proc', session: '模块5·课2 遥感图像判读', icon: '判', title: '图像判读标志',
  concept: '色调、形状、大小、阴影、纹理、位置、布局——判读员识别目标的七把钥匙',
  military: '机场/港口/阵地判读是军事情报分析的基本功',
  brief: '一幅"机场"影像。逐个打开判读标志开关看标注，再点击目标考考自己认出了没有。',
  summary: '直接判读标志：色调（灰度深浅）、形状（轮廓）、大小（尺寸）、阴影（侧面信息）、纹理（细腻/粗糙）；间接判读标志：位置（与环境的关系）、布局（目标间的组合关系）。例如：跑道=长条形+特定色调+与滑行道机库的布局关系。综合多标志才能可靠识别。',
  teach: {
    old: '传统课堂：七个标志念一遍，学员面对真实影像还是不知从何看起。',
    now: '线上实验室：每个标志一键高亮对应线索，再点目标听"判读员思路"——把专家经验显性化。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 560 : 420);
    const state = { keys: new Set(), sel: null };

    // 生成机场影像 200×150
    const SW = 200, SH = 150;
    const img = document.createElement('canvas'); img.width = SW; img.height = SH;
    {
      const c = img.getContext('2d');
      c.fillStyle = '#4d7c0f'; c.fillRect(0, 0, SW, SH); // 草地
      // 纹理噪点
      for (let i = 0; i < 900; i++) {
        c.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
        c.fillRect(Math.random() * SW, Math.random() * SH, 1.5, 1.5);
      }
      // 树林（粗糙纹理）
      c.fillStyle = '#365314';
      for (let i = 0; i < 260; i++) {
        const x = 130 + Math.random() * 60, y = 8 + Math.random() * 40;
        c.fillRect(x, y, 2.5, 2.5);
      }
      // 水体
      c.fillStyle = '#e2e8f0';
      c.beginPath(); c.ellipse(30, 120, 26, 16, 0, 0, 7); c.fill();
      // 主跑道
      c.fillStyle = '#6b7280'; c.fillRect(20, 60, 150, 14);
      c.fillStyle = '#64748b';
      for (let x = 26; x < 165; x += 14) c.fillRect(x, 66, 7, 2); // 中线标线
      // 滑行道
      c.fillStyle = '#64748b'; c.fillRect(40, 74, 8, 30);
      // 停机坪
      c.fillStyle = '#64748b'; c.fillRect(48, 96, 60, 26);
      // 机库×3（带阴影）
      for (let i = 0; i < 3; i++) {
        const hx = 52 + i * 20, hy = 100;
        c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(hx + 3, hy + 4, 12, 9); // 阴影
        c.fillStyle = '#94a3b8'; c.fillRect(hx, hy, 12, 9);
        c.fillStyle = '#6b7280'; c.fillRect(hx, hy, 12, 3);
      }
      // 飞机×2
      c.fillStyle = '#94a3b8';
      c.fillRect(70, 82, 10, 2.5); c.fillRect(74, 79.5, 2.5, 7);
      c.fillRect(92, 82, 10, 2.5); c.fillRect(96, 79.5, 2.5, 7);
      // 道路
      c.fillStyle = '#6b7280'; c.fillRect(0, 30, 120, 5);
    }

    const targets = [
      { id: 'runway', n: '跑道', x: 20, y: 60, w: 150, h: 14, keys: ['形状', '色调', '大小', '布局'], tip: '长条矩形+均匀浅色调+特定宽度（约45m级）+与滑行道相连——形状与布局是主标志。' },
      { id: 'hangar', n: '机库', x: 50, y: 98, w: 56, h: 16, keys: ['阴影', '形状', '布局'], tip: '规则矩形+一侧有阴影（说明有高度）+沿停机坪排列——阴影给出高度信息。' },
      { id: 'plane', n: '飞机', x: 68, y: 78, w: 38, h: 12, keys: ['形状', '大小', '位置'], tip: '小十字形+尺寸与机型吻合+停在停机坪上——位置（与跑道/机库的关系）是关键。' },
      { id: 'trees', n: '树林', x: 128, y: 6, w: 66, h: 44, keys: ['纹理', '色调'], tip: '深绿色调+粗糙"颗粒"纹理——与光滑的草地、水面形成对比。' },
      { id: 'pond', n: '水体', x: 4, y: 104, w: 52, h: 32, keys: ['色调', '形状'], tip: '深色调+自然曲线边界——水体在近红外几乎全吸收，色调最暗。' },
      { id: 'road', n: '道路', x: 0, y: 28, w: 120, h: 9, keys: ['形状', '色调'], tip: '细长线状+中等色调——比跑道窄得多，"大小"标志区分二者。' },
    ];
    const keyDesc = {
      '色调': '灰度/颜色的深浅：水体最暗，水泥浅亮',
      '形状': '轮廓几何：跑道长条、机库矩形、飞机十字',
      '大小': '实物尺寸：跑道宽几十米，道路只有几米',
      '阴影': '侧面信息：有阴影=有高度（机库、塔台）',
      '纹理': '细腻程度：树林粗糙、水面光滑',
      '位置': '环境关系：飞机在停机坪、船在码头',
      '布局': '组合关系：跑道+滑行道+机库=机场',
    };

    Lab.ui.title(panel, '判读标志开关');
    Object.keys(keyDesc).forEach(k =>
      Lab.ui.button(panel, k, () => { state.keys.has(k) ? state.keys.delete(k) : state.keys.add(k); draw(); }));
    const readout = Lab.ui.readout(panel);
    readout.textContent = '打开判读标志开关查看标注；点击影像中的目标，听"判读员思路"。';

    const iX = 16, iY = 56, iW = narrow ? W - 32 : Math.min(W - 32, 560), iH = iW * SH / SW;
    const sc = iW / SW;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('某机场遥感影像（示意）—— 点击目标试试判读', iX, iY - 14);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, iX, iY, iW, iH);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(iX, iY, iW, iH);

      // 标注层
      ctx.font = 'bold 11px sans-serif';
      if (state.keys.has('形状')) {
        ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 2;
        ctx.strokeRect(iX + 20 * sc, iY + 60 * sc, 150 * sc, 14 * sc);
        ctx.strokeRect(iX + 50 * sc, iY + 98 * sc, 56 * sc, 16 * sc);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#5a3ce6'; ctx.fillText('长条=跑道', iX + 90 * sc, iY + 56 * sc);
      }
      if (state.keys.has('阴影')) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) ctx.strokeRect(iX + (55 + i * 20) * sc, iY + 104 * sc, 12 * sc, 9 * sc);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#f59e0b'; ctx.fillText('阴影→有高度', iX + 120 * sc, iY + 112 * sc);
      }
      if (state.keys.has('纹理')) {
        ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 2;
        ctx.strokeRect(iX + 128 * sc, iY + 6 * sc, 66 * sc, 44 * sc);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#65a30d'; ctx.fillText('粗糙纹理=树林', iX + 132 * sc, iY + 4 * sc + 8);
      }
      if (state.keys.has('色调')) {
        ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(iX + 30 * sc, iY + 120 * sc, 26 * sc, 16 * sc, 0, 0, 7); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#0284c7'; ctx.fillText('最暗=水体', iX + 12 * sc, iY + 142 * sc);
      }
      if (state.keys.has('大小')) {
        ctx.fillStyle = '#db2777';
        ctx.fillText('← 宽≈45m', iX + 172 * sc, iY + 70 * sc);
        ctx.fillText('窄≈6m →', iX + 96 * sc, iY + 26 * sc);
      }
      if (state.keys.has('位置')) {
        ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 2;
        ctx.strokeRect(iX + 68 * sc, iY + 78 * sc, 38 * sc, 12 * sc);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#c026d3'; ctx.fillText('在停机坪上=飞机', iX + 60 * sc, iY + 94 * sc);
      }
      if (state.keys.has('布局')) {
        ctx.strokeStyle = '#ea580c'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
        ctx.strokeRect(iX + 16 * sc, iY + 56 * sc, 158 * sc, 70 * sc);
        ctx.setLineDash([]); ctx.lineWidth = 1;
        ctx.fillStyle = '#ea580c';
        ctx.fillText('跑道+滑行道+停机坪+机库 → 机场！', iX + 20 * sc, iY + 134 * sc);
      }

      // 选中目标
      if (state.sel) {
        const t = targets.find(t => t.id === state.sel);
        ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2.5;
        ctx.strokeRect(iX + t.x * sc, iY + t.y * sc, t.w * sc, t.h * sc);
        ctx.lineWidth = 1;
        // 说明卡
        const cy = iY + iH + 16;
        ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#db2777';
        ctx.beginPath(); ctx.roundRect(iX, cy, iW, narrow ? 96 : 84, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#db2777'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`${t.n} ｜ 用到的判读标志：${t.keys.join('、')}`, iX + 14, cy + 24);
        ctx.fillStyle = '#475569'; ctx.font = '12.5px sans-serif';
        let line = '', yy = cy + 46;
        for (const ch of t.tip) {
          if (ctx.measureText(line + ch).width > iW - 40) { ctx.fillText(line, iX + 14, yy); line = ch; yy += 18; }
          else line += ch;
        }
        ctx.fillText(line, iX + 14, yy);
      } else if (state.keys.size) {
        const cy = iY + iH + 16;
        ctx.fillStyle = '#64748b'; ctx.font = '12.5px sans-serif';
        [...state.keys].forEach((k, i) => ctx.fillText(`· ${k}：${keyDesc[k]}`, iX + 6, cy + 18 + i * 18));
      }
    }

    ctx.canvas.addEventListener('click', e => {
      const r = ctx.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
      const t = targets.find(t =>
        x >= iX + t.x * sc && x <= iX + (t.x + t.w) * sc &&
        y >= iY + t.y * sc && y <= iY + (t.y + t.h) * sc);
      state.sel = t ? t.id : null;
      if (t) readout.textContent = `${t.n}：${t.tip}`;
      draw();
    });

    draw();
  }
});
