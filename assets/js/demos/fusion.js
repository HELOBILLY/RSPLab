/* 图像融合：全色高分辨率 + 多光谱彩色 = 高清彩色影像 */
Lab.register({
  id: 'fusion', group: 'proc', session: '模块5·课3 遥感图像融合', icon: '融', title: '图像融合（PAN + MS）',
  concept: '全色影像空间清晰但无色，多光谱有色彩但模糊，融合后既清晰又多彩',
  military: '高分侦察影像产品几乎都是融合产品：既要看得清，又要辨得出色',
  brief: '调节融合权重，看"黑白高清线稿"与"彩色模糊填色"如何合成为高清彩色影像。',
  summary: '全色波段（PAN）波谱范围宽、能量足，空间分辨率高但是灰度；多光谱（MS）有红绿蓝等波段、有色彩，但分辨率低。图像融合（如IHS变换、Brovey变换）把PAN的细节注入MS，得到高分辨率彩色影像。就像"黑白线稿 + 水彩填色"。',
  teach: {
    old: '传统课堂：展示融合前后两张图，学员知道"变清晰了"，但不理解信息是怎么"搬"过去的。',
    now: '线上实验室：权重滑块从0拖到1，细节一点点"渗"进彩色图——融合的本质（细节注入）直观可见。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 560 : 400);
    const SIZE = 96;
    const state = { w: 0.5 };

    // 程序生成场景真值（彩色 + 高频细节）
    const truth = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let r = 70, g = 120, b = 55;
        if (Math.abs(y - (x * 0.6 + 15)) < 4) { r = 120; g = 115; b = 110; }
        if (x > 55 && x < 80 && y > 45 && y < 70) { r = 175; g = 60; b = 50; }
        if (x > 15 && x < 35 && y > 55 && y < 78) { r = 60; g = 90; b = 170; }
        if (x < 30 && y < 28) { r = 45; g = 85; b = 140; }
        const detail = (Math.sin(x * 1.3) * Math.cos(y * 1.1) + Math.sin(x * 0.4 + y * 0.7)) * 14 + (Math.random() - .5) * 10;
        truth.push([r + detail, g + detail, b + detail, detail]);
      }
    }
    const pan = truth.map(([r, g, b]) => 0.3 * r + 0.5 * g + 0.2 * b);
    const ms = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cx = Math.min(SIZE - 1, Math.floor(x / 3) * 3 + 1);
        const cy = Math.min(SIZE - 1, Math.floor(y / 3) * 3 + 1);
        const i = cy * SIZE + cx;
        ms.push([truth[i][0] - truth[i][3], truth[i][1] - truth[i][3], truth[i][2] - truth[i][3]]);
      }
    }

    function toCanvas(pixelFn) {
      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      const cc = c.getContext('2d');
      const id = cc.createImageData(SIZE, SIZE);
      for (let i = 0; i < SIZE * SIZE; i++) {
        const [r, g, b] = pixelFn(i);
        id.data[i * 4] = r; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255;
      }
      cc.putImageData(id, 0, 0);
      return c;
    }
    const panC = toCanvas(i => { const v = pan[i]; return [v, v, v]; });
    const msC = toCanvas(i => ms[i]);
    // 融合结果随权重变化，用离屏画布更新
    const fusC = document.createElement('canvas');
    fusC.width = SIZE; fusC.height = SIZE;
    const fusCtx = fusC.getContext('2d');
    const fusId = fusCtx.createImageData(SIZE, SIZE);
    function updateFusion() {
      const w = state.w;
      for (let i = 0; i < SIZE * SIZE; i++) {
        const [mr, mg, mb] = ms[i];
        const detail = pan[i] - (0.3 * mr + 0.5 * mg + 0.2 * mb);
        fusId.data[i * 4] = mr + detail * w * 1.6;
        fusId.data[i * 4 + 1] = mg + detail * w * 1.6;
        fusId.data[i * 4 + 2] = mb + detail * w * 1.6;
        fusId.data[i * 4 + 3] = 255;
      }
      fusCtx.putImageData(fusId, 0, 0);
    }
    updateFusion();

    Lab.ui.title(panel, '融合实验');
    Lab.ui.slider(panel, '融合权重（全色细节注入量）', 0, 1, 0.5, 0.01, v => { state.w = v; updateFusion(); draw(); }, '');
    Lab.ui.button(panel, '纯多光谱（模糊彩色）', () => setW(0));
    Lab.ui.button(panel, '最佳融合', () => setW(0.65));
    Lab.ui.button(panel, '纯全色（清晰灰度）', () => setW(1));
    const readout = Lab.ui.readout(panel);
    function setW(v) {
      const s = panel.querySelector('input[type=range]');
      s.value = v; s.dispatchEvent(new Event('input'));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const w = state.w;
      let s, y0, gap;
      if (narrow) { s = (W - 96) / (3 * SIZE); gap = 16; y0 = 44; }
      else { s = 1.9; gap = 24; y0 = 46; }
      const iw = SIZE * s;
      const x1 = narrow ? 16 : 24, x2 = x1 + iw + gap, x3 = x2 + iw + gap;

      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('全色PAN：清晰·灰度', x1, y0 - 8);
      ctx.fillText('多光谱MS：模糊·彩色', x2, y0 - 8);
      ctx.fillText(`融合结果（权重 ${w.toFixed(2)}）`, x3, y0 - 8);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(panC, x1, y0, iw, iw);
      ctx.drawImage(msC, x2, y0, iw, iw);
      ctx.drawImage(fusC, x3, y0, iw, iw);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(x1, y0, iw, iw); ctx.strokeRect(x2, y0, iw, iw); ctx.strokeRect(x3, y0, iw, iw);
      ctx.fillStyle = '#f59e0b'; ctx.font = `bold ${narrow ? 18 : 26}px sans-serif`;
      ctx.fillText('+', x1 + iw + 3, y0 + iw / 2);
      ctx.fillText('=', x2 + iw + 3, y0 + iw / 2);

      // 寓意
      const my = y0 + iw + (narrow ? 24 : 30);
      ctx.fillStyle = '#64748b'; ctx.font = `${narrow ? 12 : 13}px sans-serif`;
      ctx.fillText('寓意：全色 = 精细的黑白线稿（轮廓细节）', narrow ? 16 : 60, my);
      ctx.fillText('　　　多光谱 = 水彩颜料（颜色信息）', narrow ? 16 : 60, my + 22);
      ctx.fillText('　　　融合 = 在线稿上填水彩 → 既清晰又多彩', narrow ? 16 : 60, my + 44);

      // 局部放大（屋顶边缘）
      const zx = narrow ? 16 : Math.min(480, W - 130), zy = my + (narrow ? 62 : 60), zs = narrow ? (W - 32) / 16 / 2 : 5;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('局部放大（屋顶边缘）', zx, zy - 8);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const i = (50 + y) * SIZE + (58 + x);
          const [mr, mg, mb] = ms[i];
          const detail = pan[i] - (0.3 * mr + 0.5 * mg + 0.2 * mb);
          ctx.fillStyle = `rgb(${mr + detail * w * 1.6 | 0},${mg + detail * w * 1.6 | 0},${mb + detail * w * 1.6 | 0})`;
          ctx.fillRect(zx + x * zs, zy + y * zs, zs + 0.5, zs + 0.5);
        }
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(zx, zy, 16 * zs, 16 * zs);

      readout.textContent =
        w < 0.15 ? '当前≈纯多光谱：有颜色但边缘模糊。向右拖权重滑块注入全色细节！' :
        w > 0.9 ? '当前≈纯全色：细节丰富但失去颜色。融合的意义就是两者兼得。' :
        `权重${w.toFixed(2)}：全色的空间细节正按比例"渗"入彩色影像。拖到0.65左右效果最佳。`;
    }
    draw();
  }
});
