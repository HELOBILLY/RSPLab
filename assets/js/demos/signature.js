/* 地物波谱"身份证"：点击场景中的地物，看它的波谱指纹 */
Lab.register({
  id: 'signature', group: 'phys', session: '模块2·课3 地物电磁波反射特性', icon: '谱', title: '地物波谱"身份证"',
  concept: '不同地物在不同波段的反射率各不相同，构成独一无二的"波谱指纹"',
  military: '伪装目标识别、战场环境感知都建立在波谱差异之上',
  brief: '点击场景中的地物，查看它的波谱"身份证"；打开"对比模式"可同时叠加多条曲线。',
  summary: '植被在红光波段被叶绿素强烈吸收、在近红外因细胞结构强烈反射，形成标志性的"红边"陡升；水体在近红外几乎全吸收；土壤波谱平缓上升。这些独特的波谱形状就是地物的"身份证"，是遥感自动分类的物理基础。',
  teach: {
    old: '传统课堂：PPT上并排展示4条波谱曲线，学员觉得"都差不多"，记不住谁是谁。',
    now: '线上实验室：点场景里的树、水、房子，曲线"长"出来；再开对比模式找不同——像查身份证一样认地物。'
  },
  render(stage, panel) {
    const { ctx, W, H } = Lab.ui.canvas(stage, 400);
    const sceneH = 150;
    const plotY = sceneH + 20, plotH = H - plotY - 30;
    const L0 = 0.4, L1 = 2.5;

    const spectra = {
      veg: { name: '植被', color: '#16a34a', pts: [[0.4,.06],[0.5,.08],[0.55,.12],[0.6,.06],[0.68,.05],[0.75,.45],[0.85,.48],[1.0,.45],[1.2,.40],[1.4,.15],[1.6,.38],[1.9,.10],[2.1,.30],[2.5,.22]] },
      water: { name: '水体', color: '#0284c7', pts: [[0.4,.08],[0.5,.10],[0.55,.07],[0.65,.04],[0.8,.02],[1.0,.01],[1.3,.005],[1.6,.003],[2.0,.002],[2.5,.001]] },
      soil: { name: '土壤', color: '#d4a373', pts: [[0.4,.10],[0.55,.16],[0.7,.22],[0.9,.28],[1.2,.32],[1.5,.34],[1.8,.33],[2.2,.35],[2.5,.36]] },
      roof: { name: '建筑物', color: '#db2777', pts: [[0.4,.18],[0.55,.22],[0.7,.25],[0.9,.27],[1.2,.28],[1.5,.26],[1.8,.25],[2.2,.24],[2.5,.23]] },
      road: { name: '沥青道路', color: '#7c3aed', pts: [[0.4,.12],[0.55,.14],[0.7,.16],[0.9,.17],[1.2,.18],[1.5,.18],[1.8,.17],[2.2,.17],[2.5,.16]] }
    };
    const state = { selected: ['veg'], compare: false, anim: 0 };
    let hitZones = [];

    Lab.ui.title(panel, '操作');
    Lab.ui.checkbox(panel, '对比模式（叠加多条曲线）', false, v => { state.compare = v; if (!v) state.selected = state.selected.slice(-1); });
    Lab.ui.button(panel, '清除全部', () => { state.selected = []; });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '点击左侧场景中的树冠、水面、屋顶、道路、裸土，查看它的波谱曲线。';

    function interp(pts, lam) {
      for (let i = 0; i < pts.length - 1; i++) {
        if (lam >= pts[i][0] && lam <= pts[i + 1][0]) {
          const f = (lam - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
          return pts[i][1] + f * (pts[i + 1][1] - pts[i][1]);
        }
      }
      return pts[pts.length - 1][1];
    }

    function drawScene() {
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, W, sceneH);
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(W - 44, 28, 13, 0, 7); ctx.fill();
      hitZones = [];
      // 水体
      ctx.fillStyle = '#1e5a8a'; ctx.fillRect(0, 95, W * 0.17, 55);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(0, 95, W * 0.17, 4);
      hitZones.push({ id: 'water', x: 0, y: 95, w: W * 0.17, h: 55 });
      // 植被
      const vegX0 = W * 0.20, vegX1 = W * 0.50;
      for (let i = 0; i < 4; i++) {
        const x = vegX0 + 22 + i * ((vegX1 - vegX0 - 44) / 3);
        ctx.fillStyle = '#3f6212'; ctx.beginPath(); ctx.arc(x, 88, 20, 0, 7); ctx.fill();
        ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(x - 4, 82, 11, 0, 7); ctx.fill();
        ctx.fillStyle = '#713f12'; ctx.fillRect(x - 3, 98, 6, 20);
      }
      hitZones.push({ id: 'veg', x: vegX0, y: 60, w: vegX1 - vegX0, h: 60 });
      // 裸土
      ctx.fillStyle = '#8a6742'; ctx.fillRect(W * 0.17, 120, W * 0.36, 30);
      hitZones.push({ id: 'soil', x: W * 0.17, y: 118, w: W * 0.36, h: 34 });
      // 建筑
      const bX = W * 0.56, bW = W * 0.14;
      ctx.fillStyle = '#4b5563'; ctx.fillRect(bX, 55, bW, 95);
      ctx.fillStyle = '#db2777'; ctx.fillRect(bX, 55, bW, 9);
      ctx.fillStyle = '#6b7280';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        ctx.fillRect(bX + 8 + c * ((bW - 24) / 2.4), 74 + r * 24, bW / 5, 14);
      hitZones.push({ id: 'roof', x: bX, y: 55, w: bW, h: 95 });
      // 道路
      ctx.fillStyle = '#374151'; ctx.fillRect(W * 0.72, 120, W * 0.28, 30);
      ctx.strokeStyle = '#d97706'; ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.moveTo(W * 0.72, 135); ctx.lineTo(W, 135); ctx.stroke(); ctx.setLineDash([]);
      hitZones.push({ id: 'road', x: W * 0.72, y: 118, w: W * 0.28, h: 34 });

      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 150, W, sceneH - 150);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText('水体', W * 0.06, 140);
      ctx.fillText('植被', (vegX0 + vegX1) / 2 - 12, 52);
      ctx.fillText('裸土', W * 0.33, 115);
      ctx.fillText('建筑物', bX + bW / 2 - 18, 48);
      ctx.fillText('道路', W * 0.84, 113);
      for (const id of state.selected) {
        const z = hitZones.find(z => z.id === id);
        if (z) { ctx.strokeStyle = spectra[id].color; ctx.lineWidth = 2; ctx.strokeRect(z.x, z.y, z.w, z.h); ctx.lineWidth = 1; }
      }
    }

    function drawPlot() {
      const px = 55, pw = W - 80;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, plotY, W, plotH + 30);
      const bands = [['蓝', .45, .52, 'rgba(37,99,235,.10)'], ['绿', .52, .60, 'rgba(22,163,74,.10)'], ['红', .63, .69, 'rgba(220,38,38,.10)'], ['近红外', .75, 1.3, 'rgba(124,58,237,.10)'], ['短波红外', 1.55, 2.4, 'rgba(217,119,6,.07)']];
      for (const [n, a, b, c] of bands) {
        const x1 = px + (a - L0) / (L1 - L0) * pw, x2 = px + (b - L0) / (L1 - L0) * pw;
        ctx.fillStyle = c; ctx.fillRect(x1, plotY, x2 - x1, plotH);
        ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText(n, (x1 + x2) / 2 - 10, plotY + 12);
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(px, plotY, pw, plotH);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      for (let lam = 0.5; lam <= 2.5; lam += 0.5) {
        const x = px + (lam - L0) / (L1 - L0) * pw;
        ctx.fillText(lam.toFixed(1), x - 8, plotY + plotH + 16);
      }
      ctx.fillText('波长 λ (μm)', W / 2 - 30, plotY + plotH + 28);
      ctx.save(); ctx.translate(14, plotY + plotH / 2 + 30); ctx.rotate(-Math.PI / 2);
      ctx.fillText('反射率 ρ', 0, 0); ctx.restore();
      for (let r = 0; r <= 0.5; r += 0.1) {
        const y = plotY + plotH - r / 0.55 * plotH;
        ctx.fillText(r.toFixed(1), px - 26, y + 4);
      }

      state.anim = Math.min(1, state.anim + 0.04);
      for (const id of state.selected) {
        const sp = spectra[id];
        ctx.strokeStyle = sp.color; ctx.lineWidth = 2.5; ctx.beginPath();
        const n = 120, nAnim = Math.floor(n * state.anim);
        for (let i = 0; i <= nAnim; i++) {
          const lam = L0 + (L1 - L0) * i / n;
          const r = interp(sp.pts, lam);
          const x = px + (lam - L0) / (L1 - L0) * pw;
          const y = plotY + plotH - r / 0.55 * plotH;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.lineWidth = 1;
        if (id === 'veg' && state.anim > 0.5) {
          const x1 = px + (0.68 - L0) / (L1 - L0) * pw, x2 = px + (0.75 - L0) / (L1 - L0) * pw;
          ctx.strokeStyle = '#dc2626'; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(x1, plotY + plotH); ctx.lineTo(x1, plotY + plotH * .4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2, plotY + plotH); ctx.lineTo(x2, plotY + plotH * .15); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#dc2626'; ctx.fillText('红边', (x1 + x2) / 2 - 10, plotY + plotH * .35);
        }
      }
      let ly = plotY + 26;
      for (const id of state.selected) {
        ctx.fillStyle = spectra[id].color; ctx.fillRect(W - 120, ly - 8, 14, 4);
        ctx.fillStyle = '#1e293b'; ctx.fillText(spectra[id].name, W - 100, ly - 2);
        ly += 18;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawScene();
      drawPlot();
    }

    ctx.canvas.addEventListener('click', e => {
      const rect = ctx.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      const z = hitZones.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);
      if (z) {
        state.anim = 0;
        if (state.compare) {
          if (state.selected.includes(z.id)) state.selected = state.selected.filter(s => s !== z.id);
          else state.selected.push(z.id);
        } else state.selected = [z.id];
        const names = state.selected.map(s => spectra[s].name).join(' vs ');
        readout.textContent = state.selected.length
          ? `当前查看：${names}。${z.id === 'veg' ? '注意植被在0.7μm附近的"红边"陡升——这是叶绿素的光学签名！' : z.id === 'water' ? '水体在近红外几乎全吸收，所以影像上呈黑色。' : '试试开启对比模式，叠加多条曲线找差异。'}`
          : '点击场景中的地物查看波谱曲线。';
      }
    });

    return draw;
  }
});
