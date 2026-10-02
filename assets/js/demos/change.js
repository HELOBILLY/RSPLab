/* 遥感应用：多时相变化检测 —— 洪灾监测对比（拖动分割线） */
Lab.register({
  id: 'change', group: 'app', session: '模块6 遥感应用', icon: '变', title: '变化检测·洪灾监测',
  concept: '对比不同时相的影像，自动提取发生变化的区域——灾害应急的核心手段',
  military: '同一原理用于战场毁伤评估：打击前后影像对比，自动标出毁伤部位',
  brief: '拖动中间的分割线对比灾前/灾后影像；打开"变化检测"开关，看算法自动标出新增水体与受损区。',
  summary: '多时相遥感对比是应用最广的分析方式之一：灾前灾后两期影像配准后，逐像元比较（如NDWI水体指数差值），超过阈值的区域标为"变化"。洪水扩张范围、淹没面积可快速成图，支撑应急决策；同一原理也用于战场毁伤评估、非法建设监测。',
  teach: {
    old: '传统课堂：展示两张灾前灾后照片，学员"看"到了变化，但不理解算法如何"自动"找到变化。',
    now: '线上实验室：亲手拖分割线对比，再一键生成变化图——从"人眼对比"到"算法检测"的跨越直观可见。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 520 : 420);
    const SW = 200, SH = 150;
    const state = { split: 0.5, showChange: false };

    // 灾前场景
    function drawScene(c, flood) {
      c.fillStyle = '#4d7c0f'; c.fillRect(0, 0, SW, SH); // 植被基底
      for (let i = 0; i < 700; i++) {
        c.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        c.fillRect(Math.random() * SW, Math.random() * SH, 1.5, 1.5);
      }
      // 河流（灾后变宽）
      c.fillStyle = '#e2e8f0';
      c.beginPath();
      const w0 = flood ? 26 : 8;
      c.moveTo(0, 60 - w0);
      for (let x = 0; x <= SW; x += 10) c.lineTo(x, 60 + Math.sin(x * 0.03) * 12 - w0);
      c.lineTo(SW, 60 + w0 + (flood ? 26 : 8)); c.lineTo(0, 60 + w0 + (flood ? 20 : 8));
      c.fill();
      if (flood) { // 淹没区（浅蓝）
        c.fillStyle = '#2d5a80';
        c.beginPath(); c.ellipse(120, 105, 55, 26, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(45, 30, 30, 15, 0, 0, 7); c.fill();
      }
      // 农田
      c.fillStyle = flood ? '#5c6e46' : '#8a6742';
      for (let i = 0; i < 6; i++) c.fillRect(100 + (i % 3) * 32, 96 + Math.floor(i / 3) * 26, 26, 20);
      // 村庄
      for (let i = 0; i < 5; i++) {
        const vx = 130 + (i % 3) * 20, vy = 20 + Math.floor(i / 3) * 16;
        const damaged = flood && i < 2;
        c.fillStyle = damaged ? '#57534e' : '#94a3b8';
        c.fillRect(vx, vy, 12, 9);
        if (damaged) { c.fillStyle = '#292524'; c.fillRect(vx + 2, vy + 3, 8, 5); }
      }
      // 道路
      c.fillStyle = '#6b7280'; c.fillRect(0, 82, SW, 4);
    }
    const t1 = document.createElement('canvas'); t1.width = SW; t1.height = SH;
    drawScene(t1.getContext('2d'), false);
    const t2 = document.createElement('canvas'); t2.width = SW; t2.height = SH;
    drawScene(t2.getContext('2d'), true);

    // 变化图：逐像元比较
    const chg = document.createElement('canvas'); chg.width = SW; chg.height = SH;
    {
      const c = chg.getContext('2d');
      const d1 = t1.getContext('2d').getImageData(0, 0, SW, SH);
      const d2 = t2.getContext('2d').getImageData(0, 0, SW, SH);
      const out = c.createImageData(SW, SH);
      for (let i = 0; i < SW * SH; i++) {
        const k = i * 4;
        const r1 = d1.data[k], g1 = d1.data[k + 1], b1 = d1.data[k + 2];
        const r2 = d2.data[k], g2 = d2.data[k + 1], b2 = d2.data[k + 2];
        const isWater1 = b1 > r1 + 20 && b1 > 60;
        const isWater2 = b2 > r2 + 20 && b2 > 60;
        const wasBld = r1 > 150 && g1 > 150;
        const isRubble = r2 < 100 && g2 < 100 && Math.abs(r2 - g2) < 20 && b2 < 90;
        out.data[k + 3] = 255;
        if (!isWater1 && isWater2) { out.data[k] = 239; out.data[k + 1] = 68; out.data[k + 2] = 68; } // 新增水体 红
        else if (wasBld && isRubble) { out.data[k] = 251; out.data[k + 1] = 146; out.data[k + 2] = 60; } // 受损 橙
        else { const g = (r2 + g2 + b2) / 3; out.data[k] = g; out.data[k + 1] = g; out.data[k + 2] = g; }
      }
      c.putImageData(out, 0, 0);
    }

    Lab.ui.title(panel, '操作');
    Lab.ui.checkbox(panel, '叠加变化检测结果（红=新增水体，橙=受损建筑）', false, v => { state.showChange = v; draw(); });
    Lab.ui.button(panel, '分割线居中', () => { state.split = 0.5; draw(); });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '拖动影像上的分割线，对比灾前（左）与灾后（右）。';

    const iX = 16, iY = 60, iW = narrow ? W - 32 : Math.min(W - 32, 620), iH = iW * SH / SW;
    let dragging = false;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('某流域两时相遥感影像对比', iX, iY - 14);
      ctx.imageSmoothingEnabled = false;
      const splitX = iX + iW * state.split;
      // 左：灾前
      ctx.save();
      ctx.beginPath(); ctx.rect(iX, iY, iW * state.split, iH); ctx.clip();
      ctx.drawImage(t1, iX, iY, iW, iH);
      ctx.restore();
      // 右：灾后
      ctx.save();
      ctx.beginPath(); ctx.rect(splitX, iY, iW * (1 - state.split), iH); ctx.clip();
      ctx.drawImage(t2, iX, iY, iW, iH);
      ctx.restore();
      // 变化检测叠加
      if (state.showChange) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(chg, iX, iY, iW, iH);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(iX, iY, iW, iH);
      // 分割线
      if (!state.showChange) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(splitX, iY); ctx.lineTo(splitX, iY + iH); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(splitX, iY + iH / 2, 12, 0, 7); ctx.fill();
        ctx.fillStyle = '#0b1020'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⇔', splitX, iY + iH / 2 + 4); ctx.textAlign = 'left';
        // 时相标签
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.fillRect(iX + 6, iY + 6, 86, 20); ctx.fillRect(iX + iW - 92, iY + 6, 86, 20);
        ctx.fillStyle = '#16a34a'; ctx.font = '12px sans-serif';
        ctx.fillText('灾前 6月12日', iX + 12, iY + 21);
        ctx.fillStyle = '#dc2626';
        ctx.fillText('灾后 7月3日', iX + iW - 86, iY + 21);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(iX + 6, iY + 6, 210, 20);
        ctx.fillStyle = '#1e293b'; ctx.font = '12px sans-serif';
        ctx.fillText('变化检测图：红=新增水体 橙=受损建筑', iX + 12, iY + 21);
      }

      // 统计
      const sy = iY + iH + 24;
      ctx.fillStyle = '#64748b'; ctx.font = '12.5px sans-serif';
      ctx.fillText('自动提取结果：新增淹没面积约 18.6 km²，受损建筑 2 处，受淹农田 6 块。', iX, sy);
      ctx.fillText('同原理：战场毁伤评估 = 打击前后影像对比，自动标出毁伤部位。', iX, sy + 20);

      if (state.showChange) {
        readout.textContent = '变化图由算法逐像元比较生成：水体指数由负转正→新增水体；亮屋顶变暗废墟→受损。这就是"计算机自动找变化"。';
      }
    }

    const cvs = ctx.canvas;
    function ptX(e) {
      const r = cvs.getBoundingClientRect();
      return (e.clientX - r.left) * (W / r.width);
    }
    cvs.addEventListener('pointerdown', e => {
      const x = ptX(e);
      if (Math.abs(x - (iX + iW * state.split)) < 24) { dragging = true; cvs.setPointerCapture(e.pointerId); }
    });
    cvs.addEventListener('pointermove', e => {
      if (!dragging) return;
      state.split = Math.max(0.05, Math.min(0.95, (ptX(e) - iX) / iW));
      draw();
    });
    cvs.addEventListener('pointerup', () => dragging = false);

    draw();
  }
});
