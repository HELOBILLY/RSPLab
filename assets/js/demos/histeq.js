/* 直方图均衡化：看灰度分布如何被"拉平"，图像如何变清晰 */
Lab.register({
  id: 'histeq', group: 'proc', session: '模块5 · 图像增强', icon: '衡', title: '直方图均衡化',
  concept: '把拥挤的灰度直方图重新映射到整个灰度范围，提升图像对比度',
  military: '侦察图像常因光照、大气发灰，增强处理是图像判读的第一步',
  brief: '原始影像灰蒙蒙的？点击"直方图均衡化"，看灰度重新分配后图像和直方图的变化。',
  summary: '很多遥感影像的灰度值挤在一个狭窄区间，看起来灰蒙蒙的。直方图均衡化利用累积分布函数（CDF）做灰度映射，把像素重新"摊开"到0-255整个范围，暗处细节和亮处层次同时显现。对比"线性拉伸"，可以看到两种增强方法的差异。',
  teach: {
    old: '传统课堂：推导CDF映射公式，学员会算题，但没直观感受过"直方图被拉平"是什么意思。',
    now: '线上实验室：一键切换原图/拉伸/均衡化，直方图形状实时变化，公式变成了看得见的"摊平"动作。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 640 : 400);
    const SIZE = 128;
    const state = { mode: 'orig' };

    // 程序生成一幅"低对比度航空影像"：跑道+建筑+田野
    const img = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let v = 100;
        v += Math.sin(x * 0.15) * 8 + Math.cos(y * 0.1) * 8;
        const d = Math.abs(y - (x * 0.5 + 30));
        if (d < 5) v += 45;
        if (x > 70 && x < 100 && y > 60 && y < 95) v -= 35;
        if (x > 20 && x < 40 && y > 80 && y < 100) v -= 30;
        v += (Math.random() - 0.5) * 14;
        img[y * SIZE + x] = v;
      }
    }

    function histogram(data) {
      const h = new Array(256).fill(0);
      for (const v of data) h[Math.max(0, Math.min(255, Math.round(v)))]++;
      return h;
    }
    function cdf(h) {
      const c = new Array(256); let s = 0;
      for (let i = 0; i < 256; i++) { s += h[i]; c[i] = s; }
      return c;
    }

    const hist0 = histogram(img);
    const cdf0 = cdf(hist0);
    const total = SIZE * SIZE;
    const cdfMin = cdf0.find(v => v > 0);
    const eqLUT = cdf0.map(c => Math.round((c - cdfMin) / (total - cdfMin) * 255));
    let mn = 255, mx = 0;
    for (const v of img) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const stLUT = Array.from({ length: 256 }, (_, i) => Math.round((i - mn) / (mx - mn) * 255));

    // 三种模式预渲染到离屏画布
    function renderImg(lut) {
      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      const cc = c.getContext('2d');
      const id = cc.createImageData(SIZE, SIZE);
      for (let i = 0; i < img.length; i++) {
        const v0 = Math.max(0, Math.min(255, Math.round(img[i])));
        const v = lut ? lut[v0] : v0;
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
        id.data[i * 4 + 3] = 255;
      }
      cc.putImageData(id, 0, 0);
      return c;
    }
    const canvases = { orig: renderImg(null), stretch: renderImg(stLUT), eq: renderImg(eqLUT) };
    const hists = {
      orig: hist0,
      stretch: histogram(applyLUT(stLUT)),
      eq: histogram(applyLUT(eqLUT))
    };
    function applyLUT(lut) {
      const out = new Uint8ClampedArray(img.length);
      for (let i = 0; i < img.length; i++)
        out[i] = lut[Math.max(0, Math.min(255, Math.round(img[i])))];
      return out;
    }

    Lab.ui.title(panel, '图像增强');
    Lab.ui.button(panel, '原始图像', () => { state.mode = 'orig'; draw(); }, { active: true, group: 'enh' });
    Lab.ui.button(panel, '线性拉伸', () => { state.mode = 'stretch'; draw(); }, { group: 'enh' });
    Lab.ui.button(panel, '直方图均衡化', () => { state.mode = 'eq'; draw(); }, { group: 'enh' });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '原始影像灰度集中在窄区间，看起来灰蒙蒙。试试"线性拉伸"和"直方图均衡化"。';

    function drawHist(hist, x, y, w, h, label, color, showCDF) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(x, y, w, h);
      const max = Math.max(...hist);
      const bw = w / 256;
      ctx.fillStyle = color;
      for (let i = 0; i < 256; i++) {
        const bh = hist[i] / max * (h - 20);
        ctx.fillRect(x + i * bw, y + h - bh, Math.max(1, bw), bh);
      }
      if (showCDF) {
        const c = cdf(hist);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 256; i++) {
          const px = x + i * bw, py = y + h - c[i] / total * (h - 20);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = '#f59e0b'; ctx.font = '11px sans-serif';
        ctx.fillText('累积分布CDF（均衡化的映射依据）', x + w - 200, y + 16);
      }
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(label, x + 6, y + 14);
      ctx.fillText('0', x + 2, y + h + 13); ctx.fillText('255', x + w - 20, y + h + 13);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let imgX, imgY, imgS, hX, hY, hW, hH, h2Y, tipX, tipY;
      if (narrow) {
        imgX = 16; imgY = 36; imgS = 170;
        hX = 16; hY = 250; hW = W - 32; hH = 140; h2Y = 440;
        tipX = 200; tipY = 60;
      } else {
        imgX = 30; imgY = 40; imgS = 200;
        hX = 280; hY = 40; hW = W - 310; hH = 150; h2Y = 230;
        tipX = 30; tipY = imgY + 200 + 26;
      }

      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      const label = state.mode === 'orig' ? '原始图像（低对比度）' : state.mode === 'stretch' ? '线性拉伸后' : '直方图均衡化后';
      ctx.fillText(label, imgX, imgY - 10);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvases[state.mode], imgX, imgY, imgS, imgS);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(imgX, imgY, imgS, imgS);

      drawHist(hists.orig, hX, hY, hW, hH, '原始直方图：灰度挤在一起 → 图像发灰', '#64748b', true);
      drawHist(hists[state.mode], hX, h2Y, hW, hH,
        state.mode === 'eq' ? '均衡化后直方图：被"摊平"到整个范围 → 对比度最大' :
        state.mode === 'stretch' ? '拉伸后直方图：形状不变，只是"撑宽"' :
        '当前直方图（与原始相同）',
        state.mode === 'orig' ? '#64748b' : '#5a3ce6', false);

      ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
      const tips = {
        orig: ['灰蒙蒙的原因：像素灰度只分布在很窄的区间。', '点击右侧按钮，对比两种增强方法。'],
        stretch: ['线性拉伸：把最暗映射到0、最亮映射到255，', '直方图形状不变，只是整体"撑宽"。简单但有限。'],
        eq: ['直方图均衡化：按CDF重新分配灰度，', '让各灰度级的像素数量趋于均匀，细节最丰富。', '注意看跑道纹理和建筑边缘变得更清晰了！']
      };
      tips[state.mode].forEach((t, i) => ctx.fillText(t, tipX, tipY + i * 18));

      if (state.mode === 'eq') {
        readout.textContent = '均衡化后：直方图被"摊平"，暗部、亮部细节同时显现。这就是CDF映射的直观含义！';
      } else if (state.mode === 'stretch') {
        readout.textContent = '线性拉伸：对比度有改善，但直方图形状没变。再试试均衡化，对比效果。';
      } else {
        readout.textContent = '原始影像灰度集中在窄区间，看起来灰蒙蒙。试试"线性拉伸"和"直方图均衡化"。';
      }
    }
    draw();
  }
});
