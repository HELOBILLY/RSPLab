/* SAR成像：侧视几何 —— 透视收缩、叠掩、阴影三大畸变 + 斑点噪声 */
Lab.register({
  id: 'sar', group: 'sensor', session: '模块4·课4 雷达图像传感器', icon: 'S', title: 'SAR侧视成像',
  concept: 'SAR按斜距成像：朝向传感器的山坡被压缩（透视收缩），高目标顶底倒置（叠掩），遮挡区无回波（阴影）',
  military: 'SAR全天时全天候成像，是战场侦察监视的"暗夜之眼"；读懂畸变才能正确判读地形与目标',
  brief: '调入射角、楼高、山坡坡度，看同一地形在SAR图像上如何被压缩、倒置、遮挡。',
  summary: 'SAR斜距成像：图像位置由回波到达时间（斜距）决定，而非地面水平位置。朝向传感器的山坡，坡面各点斜距接近，被"压"进很少的像元——透视收缩（看起来又短又亮）；当坡面比入射角还陡（或竖直楼房），顶部回波先于底部到达——叠掩（顶底倒置）；目标后方信号被完全遮挡——阴影。相干成像还带来斑点噪声。',
  teach: {
    old: '传统课堂："透视收缩、叠掩、阴影"三个名词配三张结果图，学员分不清谁是谁、更不知成因。',
    now: '线上实验室：地形剖面上的每一点按斜距"投射"到图像，拖入射角看山坡从压缩变倒置——三种畸变的统一成因（斜距排序）一眼看穿。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 660 : 420);
    const state = { inc: 35, bldH: 60, slope: 30, speckle: true, t: 0 };

    Lab.ui.title(panel, 'SAR参数');
    Lab.ui.slider(panel, '入射角 θ', 20, 60, 35, 1, v => state.inc = v, '°');
    Lab.ui.slider(panel, '山坡坡度 α', 15, 50, 30, 1, v => state.slope = v, '°');
    Lab.ui.slider(panel, '楼房高度', 10, 100, 60, 5, v => state.bldH = v, ' m');
    Lab.ui.checkbox(panel, '斑点噪声（相干斑）', true, v => state.speckle = v);
    const readout = Lab.ui.readout(panel);

    // ===== 物理模型：地面剖面 → 斜距映射 → 图像亮度 =====
    // 场景水平范围 [0,1] 代表 400m；传感器高度 Hs
    const Hs = 0.75;
    function profile(x) { // 地面高度 z(x)
      let z = 0;
      // 山坡：中心0.32的三角峰
      const xc = 0.32, hw = 0.14;
      const hh = hw * Math.tan(state.slope * Math.PI / 180);
      if (Math.abs(x - xc) < hw) z = hh * (1 - Math.abs(x - xc) / hw);
      // 楼房：0.66..0.72 的矩形
      const hb = state.bldH / 400;
      if (x >= 0.66 && x <= 0.72) z = Math.max(z, hb);
      return z;
    }
    function computeImage() {
      const inc = state.inc * Math.PI / 180;
      const xs = 0.5 - Hs * Math.tan(inc); // 传感器水平位置（使场景中心入射角=θ）
      const NG = 800; // 地面采样数
      const NW2 = 110; // 图像列数
      const cols = new Float32Array(NW2); // 图像亮度（取最大=叠掩能量叠加）
      const vis = new Float32Array(NW2);
      let rMin = 1e9, rMax = -1e9;
      const pts = [];
      for (let i = 0; i <= NG; i++) {
        const x = i / NG;
        const z = profile(x);
        const r = Math.hypot(x - xs, Hs - z); // 斜距
        pts.push([x, z, r]);
        if (r < rMin) rMin = r; if (r > rMax) rMax = r;
      }
      let maxGraz = -1e9; // 遮挡判断：此前地形对传感器的最大仰角
      for (let i = 0; i <= NG; i++) {
        const [x, z, r] = pts[i];
        const graz = (z - Hs) / (x - xs); // 该点回望传感器的"仰角正切"（负值）
        const visible = x <= xs || graz >= maxGraz - 1e-6;
        if (graz > maxGraz) maxGraz = graz;
        // 局部坡度与局部入射角
        const dz = i > 0 ? (z - pts[i - 1][1]) * NG : 0;
        const slopeA = Math.atan(dz);
        const lookA = Math.atan2(x - xs, Hs - z); // 视线偏离天底方向
        const localInc = lookA + slopeA; // 局部入射角（面向传感器→小）
        let b = Math.max(0.04, Math.cos(localInc)); // 朗伯亮度
        // 压缩增益：斜距对地面距离的导数越小，能量越集中
        const j = Math.round((r - rMin) / (rMax - rMin) * (NW2 - 1));
        if (visible) {
          if (b > cols[j]) cols[j] = b;
          vis[j] = 1;
        }
      }
      return { cols, vis, xs, rMin, rMax, pts };
    }

    // 布局
    let geoX, geoY, geoW, geoH, imgX, imgY, imgW, imgH;
    if (narrow) {
      geoX = 16; geoY = 56; geoW = W - 32; geoH = 250;
      imgX = 16; imgY = 390; imgW = W - 32; imgH = 210;
    } else {
      geoX = 24; geoY = 60; geoW = 340; geoH = 290;
      imgX = 400; imgY = 60; imgW = Math.min(310, W - 440); imgH = 290;
    }

    const off = document.createElement('canvas');
    off.width = 110; off.height = 90;
    const octx = off.getContext('2d');

    function draw() {
      state.t++;
      ctx.clearRect(0, 0, W, H);
      const { cols, vis, xs, pts } = computeImage();
      const inc = state.inc * Math.PI / 180;

      // ===== 左侧：侧视几何剖面 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('侧视几何（距离向剖面）', geoX, geoY - 10);
      const gy = x => geoX + x * geoW;
      const gz = z => geoY + geoH - 46 - z * geoH * 1.15;
      // 地形剖面
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.moveTo(gy(0), gz(0));
      for (let i = 0; i <= 200; i++) ctx.lineTo(gy(i / 200), gz(profile(i / 200)));
      ctx.lineTo(gy(1), gz(0)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#16a34a'; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200; i ? ctx.lineTo(gy(x), gz(profile(x))) : ctx.moveTo(gy(x), gz(profile(x))); }
      ctx.stroke();
      // 传感器
      const sx = gy(Math.max(-0.05, xs)), sy2 = gz(Hs);
      ctx.fillStyle = '#5a3ce6'; ctx.fillRect(sx - 11, sy2 - 5, 22, 10);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText('SAR卫星', Math.max(geoX, sx - 18), sy2 - 12);
      // 代表性视线：山坡前坡、楼底、楼顶、阴影边界
      const rays = [[0.32 - 0.14, '#65a30d', '前坡'], [0.66, '#16a34a', '楼底'], [0.66, '#f59e0b', '楼顶']];
      ctx.setLineDash([5, 4]);
      for (const [x, c] of rays) {
        ctx.strokeStyle = c;
        ctx.beginPath(); ctx.moveTo(sx, sy2); ctx.lineTo(gy(x), gz(profile(x))); ctx.stroke();
      }
      ctx.setLineDash([]);
      // 脉冲动画
      const pulseT = (state.t % 80) / 80;
      for (const [x, c] of rays) {
        const px = sx + (gy(x) - sx) * pulseT, py = sy2 + (gz(profile(x)) - sy2) * pulseT;
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill();
      }
      // 区域标注
      ctx.font = '11px sans-serif';
      const alpha = state.slope, theta = state.inc;
      ctx.fillStyle = '#65a30d';
      ctx.fillText(theta > alpha ? '透视收缩区' : '叠掩区（坡顶先回波）', gy(0.10), gz(profile(0.18)) - 14);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('叠掩', gy(0.63), gz(profile(0.66)) - 12);
      ctx.fillStyle = '#dc2626'; ctx.fillText('阴影', gy(0.76), gz(0) + 18);

      // ===== 右侧：SAR图像 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('SAR图像（距离向×方位向）', imgX, imgY - 10);
      const im = octx.createImageData(110, 90);
      const d = im.data;
      for (let y = 0; y < 90; y++) {
        for (let x = 0; x < 110; x++) {
          let v = cols[x] * 255;
          if (!vis[x]) v = 5; // 阴影
          v += 18 + Math.random() * 20; // 地物基底
          if (state.speckle) v *= 0.55 + Math.random() * 0.9;
          v = Math.max(0, Math.min(255, v));
          const k = (y * 110 + x) * 4;
          d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
        }
      }
      octx.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, imgX, imgY, imgW, imgH);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(imgX, imgY, imgW, imgH);
      // 图像标注
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#65a30d'; ctx.fillText('← 山坡（压缩变亮）', imgX + 6, imgY + 16);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('楼（叠掩亮带）→', imgX + imgW * 0.52, imgY + 16);
      ctx.fillStyle = '#dc2626'; ctx.fillText('阴影（无回波）→', imgX + imgW * 0.62, imgY + imgH - 10);
      ctx.fillStyle = '#64748b';
      ctx.fillText('← 近距（传感器侧）', imgX + 4, imgY + imgH + 16);
      ctx.fillText('远距 →', imgX + imgW - 44, imgY + imgH + 16);

      // 底部结论条
      const cy = narrow ? H - 40 : H - 46;
      ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath(); ctx.roundRect(geoX, cy, narrow ? W - 32 : W - 48, 34, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#475569'; ctx.font = '12px sans-serif';
      const msg = theta > alpha
        ? `θ=${state.inc}° > α=${state.slope}°：前坡被压缩（透视收缩），楼房叠掩。坡度再调陡试试？`
        : `θ=${state.inc}° ≤ α=${state.slope}°：坡面比入射角还陡——坡顶回波先于坡底，山坡也发生叠掩（顶底倒置）！`;
      ctx.fillText(msg, geoX + 14, cy + 22);

      readout.textContent =
        `三种畸变同因——斜距排序：透视收缩（前坡压缩变亮）、叠掩（楼/陡坡顶底倒置）、阴影（遮挡无回波）。` +
        (state.speckle ? ' 图像颗粒感=相干斑点噪声。' : ' 已关闭斑点，显示理想图像。');
    }
    return draw;
  }
});
