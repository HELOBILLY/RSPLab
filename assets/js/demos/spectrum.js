/* 演示1：电磁波谱浏览器 —— 对数坐标、悬停提示、Landsat 8 波段叠加 */
Lab.register({
  id: 'spectrum',
  group: 'phys', session: '模块2·课1 电磁波与传输特性',
  icon: '谱',
  title: '电磁波谱',
  concept: '电磁波谱与遥感波段',
  military: '侦察波段选择',
  brief: '从伽马射线到无线电波：遥感只使用其中几个"窗口"。拖动查看各波段的名称、波长与典型应用。',
  summary: '电磁波按波长（或频率）排列形成电磁波谱。遥感利用可见光、红外、微波等波段探测地物：可见光—近红外记录地物反射，热红外记录地物自身辐射，微波（如SAR）主动发射、全天时全天候工作。波段的划分是传感器波段设计的依据。',
  teach: {
    old: '在黑板上画出光谱带，学员背诵"可见光0.38—0.76μm"等数字，各波段能做什么全靠想象。',
    now: '在对数坐标谱带上自由探索：悬停查看每个波段的波长范围与遥感用途，叠加 Landsat 8 真实波段，理解"传感器波段为什么长在这些位置"。'
  },
  render(stage, panel) {
    const { ctx, W, H } = Lab.ui.canvas(stage, 380);
    const LMIN = -6, LMAX = 8; // log10(波长/μm)
    const PADL = 30, PADR = 30, BANDY = 90, BANDH = 90, AXISY = 210;

    const bands = [
      { n: '伽马射线', a: 1e-6, b: 1e-5, c: '#8b5cf6', d: '波长极短、能量极高，不用于对地遥感。' },
      { n: 'X射线', a: 1e-5, b: 1e-2, c: '#7c3aed', d: '主要用于医学与天文，大气层强烈吸收。' },
      { n: '紫外线 UV', a: 1e-2, b: 0.38, c: '#7c3aed', d: '0.3μm以下被臭氧吸收；近紫外可用于碳酸盐岩识别、海面油膜监测。' },
      { n: '可见光 VIS', a: 0.38, b: 0.76, c: 'rainbow', d: '0.38—0.76μm，人眼可见。高分全色/多光谱影像的主要波段，军事目视判读的基础。' },
      { n: '近红外 NIR', a: 0.76, b: 1.3, c: '#dc2626', d: '植被强反射（红边效应），是植被识别、伪装揭露的关键波段。' },
      { n: '短波红外 SWIR', a: 1.3, b: 3.0, c: '#ea580c', d: '对水分敏感，可穿透薄雾，用于地质填图、伪装识别与火点探测。' },
      { n: '中红外 MIR', a: 3.0, b: 8.0, c: '#d97706', d: '反射与热辐射混合区，可用于夜间高温目标（发动机、火点）探测。' },
      { n: '热红外 TIR', a: 8.0, b: 14.0, c: '#dc2626', d: '8—14μm大气窗口，记录地物自身热辐射，昼夜皆可成像，用于热异常与隐蔽工事探测。' },
      { n: '远红外 FIR', a: 14.0, b: 1e3, c: '#dc2626', d: '大气强烈吸收，对地遥感很少使用。' },
      { n: '微波 Microwave', a: 1e3, b: 1e6, c: '#059669', d: 'SAR工作波段（Ka/X/C/S/L等）：主动成像、穿透云雾，全天时全天候侦察的主力。' },
      { n: '无线电波 Radio', a: 1e6, b: 1e8, c: '#2563eb', d: '通信与广播；超长波可用于对潜通信。' },
    ];
    const landsat = [
      ['B1', 0.435, 0.451], ['B2', 0.452, 0.512], ['B3', 0.533, 0.590],
      ['B4', 0.636, 0.673], ['B5', 0.851, 0.879], ['B6', 1.566, 1.651],
      ['B7', 2.107, 2.294], ['B8', 0.503, 0.676], ['B9', 1.363, 1.384],
      ['B10', 10.60, 11.19], ['B11', 11.50, 12.51],
    ];

    let hover = null, selected = null, showLandsat = true;

    const X = l => PADL + (Math.log10(l) - LMIN) / (LMAX - LMIN) * (W - PADL - PADR);

    function rainbow(y0, y1, x0, x1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      ['#7c3aed', '#2563eb', '#059669', '#eab308', '#f97316', '#dc2626']
        .forEach((c, i, arr) => g.addColorStop(i / (arr.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 15px sans-serif';
      ctx.fillText('电磁波谱（波长，对数坐标）', PADL, 34);
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#64748b';
      ctx.fillText('移动鼠标查看波段 · 点击波段查看详情', PADL, 54);

      for (const b of bands) {
        const x0 = X(b.a), x1 = X(b.b);
        ctx.globalAlpha = (hover === b || selected === b) ? 1 : 0.75;
        if (b.c === 'rainbow') rainbow(BANDY, BANDY + BANDH, x0, x1);
        else { ctx.fillStyle = b.c; ctx.fillRect(x0, BANDY, x1 - x0, BANDH); }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = (selected === b) ? '#5a3ce6' : '#cbd5e1';
        ctx.lineWidth = (selected === b) ? 2.5 : 1;
        ctx.strokeRect(x0, BANDY, x1 - x0, BANDH);
        const label = b.n.split(' ')[0];
        if (x1 - x0 > 34) {
          ctx.fillStyle = b.c === 'rainbow' ? '#fff' : '#1e293b';
          ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(label, (x0 + x1) / 2, BANDY + BANDH / 2 + 4);
          ctx.textAlign = 'left';
        }
      }

      // 坐标轴与刻度
      ctx.strokeStyle = '#cbd5e1'; ctx.beginPath();
      ctx.moveTo(PADL, AXISY); ctx.lineTo(W - PADR, AXISY); ctx.stroke();
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
      const ticks = [[1e-6, '1pm'], [1e-4, '100pm'], [1e-2, '10nm'], [1, '1μm'], [1e2, '100μm'], [1e4, '1cm'], [1e6, '1m'], [1e8, '100m']];
      for (const [v, t] of ticks) {
        const x = X(v);
        ctx.beginPath(); ctx.moveTo(x, AXISY); ctx.lineTo(x, AXISY + 6); ctx.stroke();
        ctx.fillText(t, x, AXISY + 20);
      }
      ctx.textAlign = 'left';

      // Landsat 8 波段
      if (showLandsat) {
        ctx.font = '10px sans-serif';
        for (const [n, a, b] of landsat) {
          const x0 = X(a), x1 = X(b), xm = (x0 + x1) / 2;
          ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x0, AXISY + 34); ctx.lineTo(x1, AXISY + 34); ctx.stroke();
          ctx.fillStyle = '#5a3ce6'; ctx.textAlign = 'center';
          ctx.fillText(n, xm, AXISY + 48);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
        ctx.fillText('▲ Landsat 8 卫星波段（B1—B11）', PADL, AXISY + 48);
      }

      // 详情卡
      const d = selected || hover;
      if (d) {
        const y0 = AXISY + 66;
        ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#5a3ce6';
        roundRect(PADL, y0, W - PADL - PADR, 66, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5a3ce6'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${d.n}　${fmtRange(d.a, d.b)}`, PADL + 14, y0 + 24);
        ctx.fillStyle = '#475569'; ctx.font = '12.5px sans-serif';
        wrapText(d.d, PADL + 14, y0 + 44, W - PADL - PADR - 28, 18);
      } else {
        ctx.fillStyle = '#475569'; ctx.font = '12.5px sans-serif';
        ctx.fillText('提示：可见光只是谱带中极窄的一段——遥感的"眼睛"远比人眼宽广。', PADL, AXISY + 84);
      }
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function wrapText(text, x, y, maxW, lh) {
      let line = '', yy = y;
      for (const ch of text) {
        if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
        else line += ch;
      }
      ctx.fillText(line, x, yy);
    }
    function fmtRange(a, b) {
      const f = v => v >= 1e6 ? (v / 1e6) + 'm' : v >= 1e3 ? (v / 1e3) + 'cm' : v + 'μm';
      return `波长 ${f(a)} — ${f(b)}`;
    }

    const cvs = ctx.canvas;
    cvs.addEventListener('mousemove', e => {
      const r = cvs.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      hover = null;
      if (my >= BANDY && my <= BANDY + BANDH) {
        for (const b of bands) if (mx >= X(b.a) && mx <= X(b.b)) { hover = b; break; }
      }
      cvs.style.cursor = hover ? 'pointer' : 'default';
      draw();
    });
    cvs.addEventListener('click', () => { if (hover) { selected = selected === hover ? null : hover; draw(); } });
    cvs.addEventListener('mouseleave', () => { hover = null; draw(); });

    Lab.ui.title(panel, '操作');
    Lab.ui.checkbox(panel, '叠加 Landsat 8 卫星波段', true, v => { showLandsat = v; draw(); });
    Lab.ui.readout(panel, '可见光仅占谱带极窄一段；<br><b>热红外</b>记录地物自身辐射（夜间可用），<br><b>微波</b>主动成像、穿透云雾（全天时全天候）。');

    draw();
  }
});
