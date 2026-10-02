/* NDVI波段运算：红波段与近红外的"魔法公式" */
Lab.register({
  id: 'ndvi', group: 'proc', session: '模块5 · 波段运算', icon: 'N', title: 'NDVI植被指数',
  concept: 'NDVI = (NIR − Red) / (NIR + Red)，利用植被红边特性定量表达长势',
  military: '植被覆盖分析可用于伪装网识别、通行性评估与战场环境研判',
  brief: '拖动"植被长势"滑块，看红光、近红外反射率如何变化，NDVI如何计算出来。',
  summary: '健康植被在红光波段被叶绿素强烈吸收（反射率低），在近红外因叶片细胞结构强烈反射（反射率高）。NDVI把这两个波段的差异压缩到 −1~+1：茂密植被接近+0.8，裸土接近0，水体为负。这是遥感"波段运算"最经典的应用。',
  teach: {
    old: '传统课堂：给出NDVI公式和几个数值，学员代入计算，但不理解为什么这个公式能"抓住"植被。',
    now: '线上实验室：拖长势滑块，看红/近红外反射率此消彼长、NDVI仪表盘实时转动——公式的物理意义自己"长"出来。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 600 : 400);
    const state = { health: 0.6 };

    Lab.ui.title(panel, '波段运算实验');
    Lab.ui.slider(panel, '植被长势（稀疏 → 茂密）', 0, 1, 0.6, 0.01, v => { state.health = v; draw(); }, '');
    const readout = Lab.ui.readout(panel);

    function values() {
      const h = state.health;
      const red = 0.25 - 0.21 * h;
      const nir = 0.25 + 0.30 * h;
      return { red, nir, ndvi: (nir - red) / (nir + red) };
    }

    function draw() {
      const { red, nir, ndvi } = values();
      ctx.clearRect(0, 0, W, H);

      // 景观示意
      const lx = narrow ? 16 : 30, ly = narrow ? 40 : 50;
      const lw = narrow ? W - 32 : 260, lh = narrow ? 130 : 180;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('地表景观', lx, ly - 12);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(lx, ly, lw, lh);
      const g = state.health;
      const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
      const gc = mix([138, 103, 66], [34, 139, 60], g);
      ctx.fillStyle = `rgb(${gc[0]},${gc[1]},${gc[2]})`;
      ctx.fillRect(lx, ly + lh * 0.55, lw, lh * 0.45);
      const nTrees = Math.round(g * 24);
      for (let i = 0; i < nTrees; i++) {
        const tx = lx + 15 + (i % 8) * ((lw - 30) / 8) + (i * 37 % 11);
        const ty = ly + lh * 0.55 + 16 + Math.floor(i / 8) * (lh * 0.14);
        ctx.fillStyle = `rgba(22,163,74,${0.5 + g * 0.5})`;
        ctx.beginPath(); ctx.arc(tx, ty, 5 + g * 6, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(lx, ly, lw, lh);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(g < 0.25 ? '稀疏裸土' : g < 0.6 ? '中等覆盖' : '茂密植被', lx + 8, ly + lh - 10);

      // 两个波段的图像
      const bx = narrow ? 16 : 330, by = narrow ? ly + lh + 40 : ly;
      const bw = narrow ? (W - 62) / 2 : 110, bh = narrow ? 80 : 85;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('红波段图像', bx, by - 12);
      ctx.fillText('近红外图像', bx + bw + 30, by - 12);
      const rv = Math.round(red * 400);
      ctx.fillStyle = `rgb(${rv},${rv * 0.4 | 0},${rv * 0.4 | 0})`;
      ctx.fillRect(bx, by, bw, bh);
      const nv = Math.round(nir * 400);
      ctx.fillStyle = `rgb(${nv * 0.5 | 0},${nv},${nv * 0.5 | 0})`;
      ctx.fillRect(bx + bw + 30, by, bw, bh);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(bx, by, bw, bh); ctx.strokeRect(bx + bw + 30, by, bw, bh);
      ctx.fillStyle = '#1e293b'; ctx.font = '11px sans-serif';
      ctx.fillText(`反射率 ${(red * 100).toFixed(1)}%（植被暗）`, bx + 8, by + bh + 16);
      ctx.fillText(`反射率 ${(nir * 100).toFixed(1)}%（植被亮）`, bx + bw + 38, by + bh + 16);

      // 公式代入
      const fx = narrow ? 16 : 330, fy = by + bh + (narrow ? 56 : 60);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 15px sans-serif';
      ctx.fillText('NDVI =', fx, fy);
      ctx.fillStyle = '#16a34a'; ctx.fillText('NIR − Red', fx + 62, fy);
      ctx.strokeStyle = '#64748b'; ctx.beginPath(); ctx.moveTo(fx + 62, fy + 5); ctx.lineTo(fx + 148, fy + 5); ctx.stroke();
      ctx.fillStyle = '#16a34a'; ctx.fillText('NIR + Red', fx + 62, fy + 24);
      ctx.fillStyle = '#1e293b'; ctx.fillText('=', fx + 160, fy + 12);
      ctx.fillStyle = '#5a3ce6'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${nir.toFixed(2)} − ${red.toFixed(2)}`, fx + 185, fy);
      ctx.strokeStyle = '#64748b'; ctx.beginPath(); ctx.moveTo(fx + 185, fy + 5); ctx.lineTo(fx + 285, fy + 5); ctx.stroke();
      ctx.fillText(`${nir.toFixed(2)} + ${red.toFixed(2)}`, fx + 185, fy + 24);
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`= ${ndvi.toFixed(3)}`, fx + (narrow ? 300 : 300), fy + 14);

      // NDVI仪表盘
      const dx = narrow ? 30 : 120, dw = W - (narrow ? 60 : 240);
      const dy = narrow ? H - 70 : 330;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('NDVI 值域（−1 ~ +1）', dx, dy - 14);
      const grad = ctx.createLinearGradient(dx, 0, dx + dw, 0);
      grad.addColorStop(0, '#0284c7'); grad.addColorStop(0.45, '#d4a373');
      grad.addColorStop(0.65, '#65a30d'); grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad; ctx.fillRect(dx, dy, dw, 22);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(dx, dy, dw, 22);
      ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
      [['−1 水体', 0], ['0 裸土', 0.5], ['+0.4 中等植被', 0.7], ['+0.8 茂密', 0.9]].forEach(([t, f]) => {
        ctx.fillText(t, dx + f * dw - 12, dy + 36);
      });
      const px = dx + (ndvi + 1) / 2 * dw;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(px, dy - 4); ctx.lineTo(px - 7, dy - 18); ctx.lineTo(px + 7, dy - 18); ctx.fill();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(ndvi.toFixed(2), px - 16, dy - 24);

      readout.textContent =
        ndvi > 0.6 ? `NDVI=${ndvi.toFixed(2)}：茂密植被！红光被叶绿素大量吸收、近红外强烈反射，差异巨大。` :
        ndvi > 0.3 ? `NDVI=${ndvi.toFixed(2)}：中等覆盖。拖滑块观察红/近红外此消彼长。` :
        `NDVI=${ndvi.toFixed(2)}：接近裸土。红与近红外反射率接近，差异小。`;
    }
    draw();
  }
});
