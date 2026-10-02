/* 演示2：黑体辐射 —— 普朗克曲线随温度变化，维恩位移定律 */
Lab.register({
  id: 'blackbody', session: '模块2·课2 地物电磁波发射特性',
  group: 'phys',
  icon: '辐',
  title: '黑体辐射',
  concept: '普朗克定律 · 维恩位移定律',
  military: '热红外夜视侦察',
  brief: '拖动温度滑块，看黑体辐射曲线如何变化：温度越高，辐射越强、峰值波长越短。',
  summary: '任何温度高于绝对零度的物体都向外辐射电磁波。普朗克定律给出黑体辐射的光谱分布：温度升高，总辐射能量急剧增大（斯特藩—玻尔兹曼定律），峰值波长向短波移动（维恩位移定律 λmax=2898/T μm）。太阳（约5778K）峰值在可见光，地球（约300K）峰值在热红外9.7μm——这决定了白天用反射波段、夜间用热红外波段的遥感分工。',
  teach: {
    old: '在黑板上写出普朗克公式，学员抄写推导过程，"峰值波长随温度左移"只是一句需要背诵的结论。',
    now: '拖动温度滑块，曲线实时变形：亲手把太阳"调"到300K，看峰值如何滑进热红外——维恩位移定律一眼可见。'
  },
  render(stage, panel) {
    const { ctx, W, H } = Lab.ui.canvas(stage, 400);
    let T = 5778, eps = 1.0;

    const C2 = 1.4388e4; // hc/k，单位 μm·K
    function planck(lam, t) { // 相对光谱辐射亮度
      return 1 / (Math.pow(lam, 5) * (Math.exp(C2 / (lam * t)) - 1));
    }
    const L0 = 0.1, L1 = 30; // μm
    const PADL = 56, PADR = 20, PADT = 46, PADB = 46;
    const X = l => PADL + (Math.log10(l) - Math.log10(L0)) / (Math.log10(L1) - Math.log10(L0)) * (W - PADL - PADR);
    let YMAX = 1;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

      // 参考曲线：太阳与地球
      const refs = [[5778, '#f59e0b', '太阳 5778K'], [300, '#2563eb', '地球 300K']];
      const plotH = H - PADT - PADB, plotW = W - PADL - PADR;

      // 可见光与热红外窗口背景
      shadeBand(0.38, 0.76, 'rgba(90,60,230,.10)', '可见光');
      shadeBand(8, 14, 'rgba(220,38,38,.10)', '热红外窗口');

      // 坐标轴
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PADL, PADT); ctx.lineTo(PADL, H - PADB); ctx.lineTo(W - PADR, H - PADB); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      for (const v of [0.1, 0.3, 0.5, 1, 2, 5, 10, 20, 30]) {
        const x = X(v);
        ctx.beginPath(); ctx.moveTo(x, H - PADB); ctx.lineTo(x, H - PADB + 5); ctx.stroke();
        ctx.fillText(String(v), x, H - PADB + 18);
      }
      ctx.fillText('波长 λ（μm，对数坐标）', (PADL + W - PADR) / 2, H - 8);
      ctx.save(); ctx.translate(16, (PADT + H - PADB) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('光谱辐射亮度（相对值）', 0, 0); ctx.restore(); ctx.textAlign = 'left';

      const drawCurve = (t, color, width, alpha, e = 1) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
        ctx.beginPath();
        const maxv = planck(2898 / t, t);
        for (let px = 0; px <= plotW; px += 2) {
          const lam = Math.pow(10, Math.log10(L0) + px / plotW * (Math.log10(L1) - Math.log10(L0)));
          const v = e * planck(lam, t) / maxv; // 归一化到同温黑体峰值，再乘发射率
          const y = PADT + plotH * (1 - v * 0.92);
          px === 0 ? ctx.moveTo(PADL + px, y) : ctx.lineTo(PADL + px, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      };

      drawCurve(5778, '#f59e0b', 1.2, 0.45);
      drawCurve(300, '#2563eb', 1.2, 0.45);
      drawCurve(T, '#5a3ce6', 2.6, 1, eps);
      if (eps < 1) drawCurve(T, '#64748b', 1.2, 0.6); // 同温黑体参考线

      // 峰值标记（维恩位移）
      const lmax = 2898 / T;
      if (lmax >= L0 && lmax <= L1) {
        const x = X(lmax);
        ctx.strokeStyle = '#5a3ce6'; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(x, PADT); ctx.lineTo(x, H - PADB); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#5a3ce6'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`峰值 λmax = ${lmax < 1 ? lmax.toFixed(2) : lmax.toFixed(1)} μm`, x, PADT - 8);
        ctx.textAlign = 'left';
      }

      // 图例
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#f59e0b'; ctx.fillText('— 太阳 5778K（峰值0.5μm，可见光）', PADL + 10, PADT + 16);
      ctx.fillStyle = '#2563eb'; ctx.fillText('— 地球 300K（峰值9.7μm，热红外）', PADL + 10, PADT + 34);
      ctx.fillStyle = '#5a3ce6'; ctx.fillText(`— 当前 T = ${T}K，ε = ${eps.toFixed(2)}`, PADL + 10, PADT + 52);
      if (eps < 1) { ctx.fillStyle = '#64748b'; ctx.fillText(`— 同温黑体（ε=1）参考`, PADL + 10, PADT + 70); }

      function shadeBand(a, b, color, label) {
        const x0 = X(a), x1 = X(b);
        ctx.fillStyle = color;
        ctx.fillRect(x0, PADT, x1 - x0, plotH);
        ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, (x0 + x1) / 2, PADT + 12);
        ctx.textAlign = 'left';
      }
    }

    Lab.ui.title(panel, '黑体温度 T');
    Lab.ui.slider(panel, {
      label: '温度', min: 300, max: 6000, step: 10, value: T, unit: ' K',
      oninput: v => { T = v; draw(); }
    });
    Lab.ui.title(panel, '地物发射率 ε（比辐射率）');
    Lab.ui.slider(panel, {
      label: '发射率', min: 0.05, max: 1, step: 0.01, value: 1,
      oninput: v => { eps = v; draw(); updateOut(); }
    });
    Lab.ui.button(panel, '黑体 1.00', () => setE(1));
    Lab.ui.button(panel, '水体 0.99', () => setE(0.99));
    Lab.ui.button(panel, '植被 0.98', () => setE(0.98));
    Lab.ui.button(panel, '干沙 0.90', () => setE(0.90));
    Lab.ui.button(panel, '铝板 0.05', () => setE(0.05));
    Lab.ui.title(panel, '温度预设');
    Lab.ui.button(panel, '太阳 5778K', () => setT(5778));
    Lab.ui.button(panel, '篝火 1000K', () => setT(1000));
    Lab.ui.button(panel, '地球 300K', () => setT(300));
    const out = Lab.ui.readout(panel, '');
    const setE = v => {
      eps = v;
      const s = panel.querySelectorAll('input[type=range]')[1];
      s.value = v; s.dispatchEvent(new Event('input'));
    };
    const setT = v => {
      T = v;
      const s = panel.querySelector('input[type=range]');
      s.value = v; s.dispatchEvent(new Event('input'));
    };
    function updateOut() {
      const lmax = 2898 / T;
      let band = lmax < 0.38 ? '紫外' : lmax < 0.76 ? '可见光' : lmax < 3 ? '近/短波红外' : lmax < 14 ? '热红外' : '远红外';
      out.innerHTML = `峰值波长 <b>${lmax < 1 ? lmax.toFixed(2) : lmax.toFixed(1)} μm</b>（${band}）· 辐射出射度为同温黑体的 <b>${(eps * 100).toFixed(0)}%</b><br>` +
        (eps < 0.9 ? '→ 发射率低的地物，热红外里"看起来比实际冷"——反演温度必须知道 ε！' :
         T > 3000 ? '→ 像太阳这样的高温体，是反射遥感的"照明光源"' :
         T > 700 ? '→ 高温目标在中短波红外有明显辐射特征' :
         '→ 地物自身辐射落在热红外波段，夜间也能被探测');
    }
    panel.querySelector('input[type=range]').addEventListener('input', updateOut);
    updateOut();
    draw();
  }
});
