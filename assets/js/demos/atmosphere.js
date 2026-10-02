/* 演示3：大气窗口 —— 大气透过率曲线，可开关各吸收气体与散射 */
Lab.register({
  id: 'atmosphere',
  group: 'phys', session: '模块2·课1 电磁波与传输特性',
  icon: '窗',
  title: '大气窗口',
  concept: '大气吸收与大气窗口',
  military: '侦察卫星波段选址',
  brief: '大气对电磁波"处处设卡"，只有几个"窗口"透过率高。勾选不同气体，看它们各自"封锁"了哪些波段。',
  summary: '电磁波穿过大气时会被水汽、二氧化碳、臭氧等选择性吸收，并被分子与气溶胶散射。透过率较高的波段称为"大气窗口"：可见光—近红外（0.4—1.3μm）、短波红外（1.5—1.8、2.0—2.5μm）、热红外（8—14μm）与微波。传感器的波段必须"开"在窗口里——这是侦察卫星波段选址的物理约束。',
  teach: {
    old: 'PPT上放一张固定的大气透过率曲线图，学员背诵几个窗口的范围，不理解窗口"为什么是这些位置"。',
    now: '逐一勾选水汽、二氧化碳、臭氧和气溶胶，看它们各自在曲线上"咬"出哪些缺口——窗口是吸收之后"剩下"的，因果一目了然。'
  },
  render(stage, panel) {
    const { ctx, W, H } = Lab.ui.canvas(stage, 400);
    const L0 = 0.3, L1 = 15;
    const PADL = 52, PADR = 20, PADT = 46, PADB = 44;
    const plotW = W - PADL - PADR, plotH = H - PADT - PADB;
    const X = l => PADL + (l - L0) / (L1 - L0) * plotW;
    const Y = t => PADT + (1 - t) * plotH;

    // 吸收带：[中心μm, 深度, 宽度, 气体]
    const dips = [
      [0.32, 0.95, 0.06, 'o3'], [0.60, 0.22, 0.025, 'o3'],
      [0.69, 0.12, 0.015, 'o2'], [0.76, 0.30, 0.02, 'o2'],
      [0.82, 0.18, 0.03, 'h2o'], [0.94, 0.45, 0.05, 'h2o'],
      [1.14, 0.42, 0.05, 'h2o'], [1.38, 0.88, 0.09, 'h2o'],
      [1.88, 0.82, 0.09, 'h2o'], [2.70, 0.92, 0.13, 'h2o'],
      [2.75, 0.6, 0.1, 'co2'], [4.30, 0.97, 0.16, 'co2'],
      [5.6, 0.55, 0.6, 'h2o'], [6.4, 0.75, 0.9, 'h2o'],
      [9.6, 0.55, 0.45, 'o3'], [14.2, 0.85, 1.0, 'co2'],
    ];
    const gasOn = { h2o: true, co2: true, o3: true, o2: true, aer: true };

    function tau(lam) {
      let t = 1;
      for (const [c, dep, w, g] of dips) {
        if (!gasOn[g]) continue;
        t -= dep * Math.exp(-((lam - c) ** 2) / (2 * w * w));
      }
      if (gasOn.aer) { // 瑞利散射 ∝ λ^-4
        const s = Math.min(0.9, 0.32 * Math.pow(0.5 / lam, 4));
        t *= (1 - s);
      }
      return Math.max(0, Math.min(1, t));
    }

    const windows = [
      [0.4, 0.76, '可见光'], [0.76, 1.3, '近红外'], [1.5, 1.75, 'SWIR-1'],
      [2.0, 2.4, 'SWIR-2'], [3.4, 4.1, '中红外'], [8, 14, '热红外'],
    ];

    let hoverLam = null;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 15px sans-serif';
      ctx.fillText('大气透过率曲线（0.3—15 μm）', PADL, 30);

      // 窗口背景
      for (const [a, b, n] of windows) {
        ctx.fillStyle = 'rgba(5,150,105,.08)';
        ctx.fillRect(X(a), PADT, X(b) - X(a), plotH);
        ctx.fillStyle = '#059669'; ctx.font = '10.5px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(n, (X(a) + X(b)) / 2, PADT + 13);
        ctx.textAlign = 'left';
      }

      // 坐标轴
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(PADL, PADT); ctx.lineTo(PADL, H - PADB); ctx.lineTo(W - PADR, H - PADB); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      for (const v of [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 14]) {
        ctx.fillText(String(v), X(v), H - PADB + 18);
      }
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        ctx.textAlign = 'right'; ctx.fillText(t.toFixed(2), PADL - 8, Y(t) + 4); ctx.textAlign = 'center';
        ctx.strokeStyle = '#f1f5f9';
        ctx.beginPath(); ctx.moveTo(PADL, Y(t)); ctx.lineTo(W - PADR, Y(t)); ctx.stroke();
      }
      ctx.fillText('波长 λ（μm）', (PADL + W - PADR) / 2, H - 6);
      ctx.save(); ctx.translate(14, (PADT + H - PADB) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('透过率 τ', 0, 0); ctx.restore(); ctx.textAlign = 'left';

      // 曲线
      ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 2.4; ctx.beginPath();
      for (let px = 0; px <= plotW; px++) {
        const lam = L0 + px / plotW * (L1 - L0);
        const y = Y(tau(lam));
        px === 0 ? ctx.moveTo(PADL + px, y) : ctx.lineTo(PADL + px, y);
      }
      ctx.stroke();

      // 悬停读数
      if (hoverLam !== null) {
        const t = tau(hoverLam), x = X(hoverLam), y = Y(t);
        ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x, PADT); ctx.lineTo(x, H - PADB); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`λ=${hoverLam.toFixed(2)}μm  τ=${(t * 100).toFixed(0)}%`, Math.min(x + 10, W - 150), Math.max(y - 10, 20));
      }
    }

    const cvs = ctx.canvas;
    cvs.addEventListener('mousemove', e => {
      const r = cvs.getBoundingClientRect();
      const mx = e.clientX - r.left;
      if (mx >= PADL && mx <= W - PADR) hoverLam = L0 + (mx - PADL) / plotW * (L1 - L0);
      else hoverLam = null;
      draw();
    });
    cvs.addEventListener('mouseleave', () => { hoverLam = null; draw(); });

    Lab.ui.title(panel, '大气成分（点击开关）');
    Lab.ui.checkbox(panel, '水汽 H₂O（近红外/热红外主要吸收者）', true, v => { gasOn.h2o = v; draw(); });
    Lab.ui.checkbox(panel, '二氧化碳 CO₂', true, v => { gasOn.co2 = v; draw(); });
    Lab.ui.checkbox(panel, '臭氧 O₃（紫外与9.6μm）', true, v => { gasOn.o3 = v; draw(); });
    Lab.ui.checkbox(panel, '氧气 O₂', true, v => { gasOn.o2 = v; draw(); });
    Lab.ui.checkbox(panel, '气溶胶散射（短波"发灰"）', true, v => { gasOn.aer = v; draw(); });
    Lab.ui.readout(panel, '把全部成分关掉试试：没有大气时 τ≈100%。<br><b>窗口 = 吸收之后"剩下"的波段</b>，传感器波段必须开在窗口里。');

    draw();
  }
});
