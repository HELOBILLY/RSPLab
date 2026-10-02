/* 传感器成像方式：摆扫式 vs 推扫式 */
Lab.register({
  id: 'scanner', group: 'sensor', session: '模块4·课3 扫描型传感器', icon: '扫', title: '传感器成像方式',
  concept: '摆扫式用扫描镜左右摆动逐行成像，推扫式用线阵CCD像"推扫帚"一样连续成像',
  military: '理解成像方式才能理解图像几何畸变的来源，影响目标定位精度',
  brief: '切换摆扫式/推扫式两种模式，观察卫星如何一行一行把地面"扫"成图像。',
  summary: '摆扫式（如Landsat MSS/TM）靠扫描镜左右摆动，逐点逐行获取地面信息；推扫式（如SPOT、高分系列）用一排CCD线阵，随卫星前进连续推扫成像。摆扫式边缘有几何畸变，推扫式无运动部件、驻留时间长、辐射质量好。',
  teach: {
    old: '传统课堂：两张静态示意图，学员分不清"摆"和"推"的区别，考试靠死记。',
    now: '线上实验室：动画直观展示两种扫描过程，扫出来的图像一条条"长"在右侧，差异一目了然。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 700;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 640 : 400);
    const state = { mode: 'whisk', speed: 1, playing: true, progress: 0, scanX: 0 };

    Lab.ui.title(panel, '控制');
    Lab.ui.button(panel, '摆扫式（扫描镜）', () => { state.mode = 'whisk'; reset(); }, { active: true, group: 'mode' });
    Lab.ui.button(panel, '推扫式（线阵CCD）', () => { state.mode = 'push'; reset(); }, { group: 'mode' });
    Lab.ui.button(panel, '暂停', function () { state.playing = !state.playing; this.textContent = state.playing ? '暂停' : '继续'; });
    Lab.ui.button(panel, '重置', reset);
    Lab.ui.slider(panel, '速度', 1, 5, 1, 1, v => state.speed = v, '×');
    const readout = Lab.ui.readout(panel);

    // 布局
    let gX, gY, gW, gH, iX, iY, iW, iH, trackY;
    if (narrow) {
      gX = 16; gY = 100; gW = W - 32; gH = 180;
      iX = 16; iY = 350; iW = W - 32; iH = 180;
      trackY = 46;
    } else {
      gX = 40; gY = 150; gW = 280; gH = 220;
      iX = 380; iY = 150; iW = Math.min(280, W - 420); iH = 220;
      trackY = 60;
    }

    function groundColor(u, v) {
      if (v < 0.25) return ['#1e5a8a', '#2a6ea5'][Math.floor(u * 8) % 2];
      if (v < 0.45) return ['#3f6212', '#16a34a', '#365314'][Math.floor(u * 10 + v * 7) % 3];
      if (v < 0.6) return ['#8a6742', '#a07a4f'][Math.floor(u * 6) % 2];
      if (v < 0.8 && u > 0.3 && u < 0.7) return '#4b5563';
      return ['#374151', '#8a6742'][Math.floor(u * 5 + v * 3) % 2];
    }
    const gCanvas = document.createElement('canvas');
    gCanvas.width = gW; gCanvas.height = gH;
    const gctx = gCanvas.getContext('2d');
    for (let y = 0; y < gH; y += 4) for (let x = 0; x < gW; x += 4) {
      gctx.fillStyle = groundColor(x / gW, y / gH);
      gctx.fillRect(x, y, 4, 4);
    }

    function reset() {
      state.progress = 0; state.scanX = 0;
      readout.textContent = state.mode === 'whisk'
        ? '摆扫式：扫描镜左右摆动，一次扫一条横线（像用扇子左右扇）。'
        : '推扫式：线阵CCD垂直于飞行方向排列，随卫星前进而"推"出图像。';
    }
    reset();

    function draw() {
      if (state.playing) {
        state.progress += 0.0022 * state.speed;
        if (state.progress > 1) state.progress = 1;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('地面（卫星过境区域）', gX, gY - 10);
      ctx.fillText('传感器获取的图像', iX, iY - 10);

      ctx.drawImage(gCanvas, gX, gY);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(gX, gY, gW, gH);

      // 卫星轨道
      const satX = 40 + state.progress * (W - 120);
      ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(30, trackY); ctx.lineTo(W - 40, trackY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#5a3ce6'; ctx.fillRect(satX - 10, trackY - 8, 20, 12);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.fillText('卫星', satX - 10, trackY - 14);

      // 已获取图像
      ctx.fillStyle = '#ffffff'; ctx.fillRect(iX, iY, iW, iH);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(iX, iY, iW, iH);
      const rows = Math.floor(state.progress * iH);
      for (let r = 0; r < rows; r += 2) {
        ctx.drawImage(gCanvas, 0, r * gH / iH, gW, 2 * gH / iH, iX, iY + r, iW, 2);
      }

      const lineY = gY + state.progress * gH;
      if (state.mode === 'whisk') {
        state.scanX += state.playing ? 0.06 * state.speed : 0;
        const sw = (Math.sin(state.scanX) * 0.5 + 0.5);
        const ifovX = gX + sw * gW;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(satX, trackY + 4); ctx.lineTo(ifovX, lineY); ctx.stroke();
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ifovX, lineY, 5, 0, 7); ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(245,158,11,.5)';
        ctx.beginPath(); ctx.moveTo(gX, lineY); ctx.lineTo(gX + gW, lineY); ctx.stroke();
        ctx.fillStyle = '#f59e0b'; ctx.font = '11px sans-serif';
        ctx.fillText('扫描镜左右摆动 →', gX + gW / 2 - 60, gY + gH + 18);
      } else {
        ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(satX, trackY + 4); ctx.lineTo(gX + gW / 2, lineY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gX, lineY); ctx.lineTo(gX + gW, lineY); ctx.stroke();
        ctx.fillStyle = '#5a3ce6';
        for (let i = 0; i < 12; i++) ctx.fillRect(gX + i * (gW / 12) + 2, lineY - 4, gW / 12 - 4, 3);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#5a3ce6'; ctx.font = '11px sans-serif';
        ctx.fillText('线阵CCD整条同时曝光，随飞行向前"推"', gX + gW / 2 - 110, gY + gH + 18);
      }

      // 进度条
      const pbY = narrow ? H - 24 : H - 30;
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(gX, pbY, W - 120, 8);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(gX, pbY, (W - 120) * state.progress, 8);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(`成像进度 ${(state.progress * 100).toFixed(0)}%`, W - 70, pbY + 8);

      if (state.progress >= 1 && state.playing) {
        readout.textContent = state.mode === 'whisk'
          ? '摆扫完成！注意：扫描镜在边缘视角大，会产生全景畸变。试试推扫式。'
          : '推扫完成！无运动部件、每行曝光时间长，辐射分辨率更好。对比摆扫式看看？';
      }
    }
    return draw;
  }
});
