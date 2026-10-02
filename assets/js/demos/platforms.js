/* 遥感平台：地面/无人机/航空/航天 —— 高度与覆盖的权衡 */
Lab.register({
  id: 'platforms', group: 'platform', session: '模块3·课1 遥感平台', icon: '台', title: '遥感平台与高度',
  concept: '平台越高覆盖越广，但空间分辨率越低——高度与细节不可兼得',
  military: '战场侦察多层协同：卫星普查、无人机详查、地面传感器精查',
  brief: '从地面测量拖到卫星高度，看视场覆盖如何变大、地面细节如何变少。',
  summary: '遥感平台按高度分：地面平台（三角架、测量车，0—百米级）、航空平台（无人机、飞机，百米—十几千米）、航天平台（卫星、空间站，数百千米以上）。同样视场角下，高度越高，地面覆盖宽度越大，但能分辨的目标尺寸也越大（细节越少）。侦察监视讲究"多层协同"：卫星普查发现疑点，无人机详查确认。',
  teach: {
    old: '传统课堂：念一遍平台分类表，学员对"700km高的卫星到底能看多大范围"没有量级概念。',
    now: '线上实验室：一个滑块从地面拉到太空，视场锥实时张开、右侧影像同步缩放——高度/覆盖/分辨率的权衡亲手可感。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 520 : 400);
    const state = { h: 0.5 }; // km

    Lab.ui.title(panel, '平台高度（对数刻度）');
    Lab.ui.slider(panel, '高度', -2, 2.85, 0, 0.01, v => { state.h = Math.pow(10, v); }, '');
    Lab.ui.button(panel, '地面 0.05km', () => setH(0.05));
    Lab.ui.button(panel, '无人机 0.5km', () => setH(0.5));
    Lab.ui.button(panel, '航空 10km', () => setH(10));
    Lab.ui.button(panel, '卫星 700km', () => setH(700));
    const readout = Lab.ui.readout(panel);
    function setH(v) {
      const s = panel.querySelector('input[type=range]');
      s.value = Math.log10(v); s.dispatchEvent(new Event('input'));
    }

    // 生成一次地面场景（城市/田野/河流）
    const SW = 512, SH = 320;
    const scene = document.createElement('canvas');
    scene.width = SW; scene.height = SH;
    {
      const c = scene.getContext('2d');
      c.fillStyle = '#3f6212'; c.fillRect(0, 0, SW, SH); // 植被基底
      c.fillStyle = '#1e5a8a'; c.beginPath(); // 河流
      c.moveTo(0, 200);
      for (let x = 0; x <= SW; x += 16) c.lineTo(x, 200 + Math.sin(x * 0.02) * 40);
      c.lineTo(SW, 280); c.lineTo(0, 300); c.fill();
      c.fillStyle = '#6b7280'; // 城市街区
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 6; gx++)
        c.fillRect(280 + gx * 38, 30 + gy * 40, 26, 26);
      c.fillStyle = '#6b7280'; // 道路网
      for (let gx = 0; gx < 7; gx++) c.fillRect(272 + gx * 38, 20, 4, 180);
      for (let gy = 0; gy < 5; gy++) c.fillRect(272, 22 + gy * 40, 240, 4);
      c.fillStyle = '#8a6742'; // 农田
      for (let i = 0; i < 8; i++) c.fillRect(20 + (i % 4) * 60, 30 + Math.floor(i / 4) * 60, 48, 48);
    }

    const FOV = 25 * Math.PI / 180; // 传感器视场角

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const h = state.h;
      const footprint = 2 * h * Math.tan(FOV / 2); // km
      const gsd = h * 1000 * 0.0001; // 简化GSD（m），IFOV≈0.1mrad

      // 左侧剖面
      const sx = 16, sw = narrow ? W - 32 : Math.floor(W * 0.46);
      const groundY = 300, topY = 40;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('平台—视场—地面覆盖', sx, 26);
      // 高度分层背景
      const layers = [[0.1, '地面/低空', 'rgba(22,163,74,.06)'], [2, '无人机', 'rgba(2,132,199,.06)'], [30, '航空', 'rgba(124,58,237,.06)'], [1000, '航天', 'rgba(245,158,11,.06)']];
      const yOf = hh => groundY - (Math.log10(Math.max(0.01, hh)) + 2) / 5 * (groundY - topY);
      let prevY = groundY;
      ctx.font = '10px sans-serif';
      for (const [lh, ln, lc] of layers) {
        const y = yOf(lh);
        ctx.fillStyle = lc; ctx.fillRect(sx, y, sw, prevY - y);
        ctx.fillStyle = '#64748b'; ctx.fillText(ln, sx + 4, y + 14);
        prevY = y;
      }
      // 地面
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(sx, groundY, sw, 40);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(sx, groundY, sw, 4);

      // 平台图标
      const py = yOf(h);
      const px = sx + sw / 2;
      ctx.fillStyle = '#5a3ce6';
      if (h < 0.3) { ctx.fillRect(px - 2, py - 12, 4, 12); ctx.beginPath(); ctx.moveTo(px, py - 16); ctx.lineTo(px - 8, py - 2); ctx.lineTo(px + 8, py - 2); ctx.fill(); }
      else if (h < 3) { ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill(); ctx.fillRect(px - 14, py - 1, 28, 2); }
      else if (h < 100) { ctx.beginPath(); ctx.moveTo(px - 14, py); ctx.lineTo(px + 14, py); ctx.lineTo(px + 4, py + 6); ctx.lineTo(px - 4, py + 6); ctx.fill(); }
      else { ctx.fillRect(px - 10, py - 5, 20, 10); ctx.fillStyle = '#64748b'; ctx.fillRect(px - 22, py - 2, 10, 4); ctx.fillRect(px + 12, py - 2, 10, 4); }
      ctx.fillStyle = '#1e293b'; ctx.font = '11px sans-serif';
      ctx.fillText(h < 1 ? `${(h * 1000).toFixed(0)} m` : `${h.toFixed(h < 10 ? 1 : 0)} km`, px + 16, py + 4);

      // 视场锥
      const halfW = Math.tan(FOV / 2) * (groundY - py);
      ctx.fillStyle = 'rgba(90,60,230,.15)';
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - halfW, groundY); ctx.lineTo(px + halfW, groundY); ctx.fill();
      ctx.strokeStyle = '#5a3ce6'; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - halfW, groundY); ctx.moveTo(px, py); ctx.lineTo(px + halfW, groundY); ctx.stroke();
      ctx.setLineDash([]);
      // 覆盖宽度标注
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - halfW, groundY + 14); ctx.lineTo(px + halfW, groundY + 14); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#f59e0b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`覆盖宽度 ≈ ${footprint < 1 ? (footprint * 1000).toFixed(0) + ' m' : footprint.toFixed(1) + ' km'}`, px, groundY + 28);
      ctx.textAlign = 'left';

      // 右侧：对应影像（覆盖越大越模糊）
      const ix = narrow ? 16 : sx + sw + 30;
      const iy = narrow ? 360 : 60;
      const iw = narrow ? W - 32 : W - ix - 16;
      const ih = narrow ? 140 : 220;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('该平台获得的影像', ix, iy - 10);
      // 从场景中心裁剪 footprint 比例
      const frac = Math.min(1, footprint / 60); // 场景代表60km宽
      const cW = SW * Math.max(0.02, frac), cH = SH * Math.max(0.02, frac);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scene, (SW - cW) / 2, (SH - cH) / 2, cW, cH, ix, iy, iw, ih);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(footprint < 0.5 ? '范围小，细节丰富（能看清车辆）' :
                   footprint < 10 ? '中等范围，能分辨建筑与道路' :
                   footprint < 100 ? '大范围，只能分辨街区与河流' : '超大范围，只能看清城市轮廓', ix, iy + ih + 16);

      readout.textContent =
        `高度 ${h < 1 ? (h * 1000).toFixed(0) + ' m' : h.toFixed(h < 10 ? 1 : 0) + ' km'}｜覆盖 ${footprint < 1 ? (footprint * 1000).toFixed(0) + ' m' : footprint.toFixed(1) + ' km'}｜可分辨目标 ≈ ${gsd < 1 ? (gsd * 100).toFixed(0) + ' cm' : gsd < 1000 ? gsd.toFixed(0) + ' m' : (gsd / 1000).toFixed(1) + ' km'}级。` +
        (h < 0.3 ? ' 地面测量：精度最高，但一次只能看一小块。' :
         h < 3 ? ' 无人机：灵活详查，战场侦察主力。' :
         h < 100 ? ' 航空摄影：覆盖与细节兼顾。' :
         ' 卫星：一眼扫过数十公里，适合大范围普查。');
    }
    draw();
    return draw;
  }
});
