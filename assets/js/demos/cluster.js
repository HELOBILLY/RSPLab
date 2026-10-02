/* 遥感图像计算机分类：非监督分类（K-means 自动聚类） */
Lab.register({
  id: 'cluster', group: 'proc', session: '模块5·课4 遥感图像计算机分类', icon: '聚', title: '非监督分类',
  concept: '无需训练样本：计算机按特征相似性自动聚类（K-means），人事后再给每个簇"起名字"',
  military: '未知地域侦察缺乏先验样本时，非监督分类是先期快速成图的唯一选择',
  brief: '不采任何样本，直接运行K-means：看簇中心在特征空间迭代移动、影像同步着色，直到收敛。',
  summary: '非监督分类不需要任何先验样本：K-means算法先把所有像元随机分成K类，然后反复迭代——"按最近簇中心重新分组 → 重算簇中心"，直到收敛。但计算机只知道"这些像元长得像"，不知道它们是什么地物：聚类结果必须经人工判读赋予类别含义。簇的编号是随机的，K值和初始中心都会影响结果。',
  teach: {
    old: '传统课堂：黑板上推K-means迭代公式，学员分不清"聚类"与"分类"的区别，以为算出来就是地物类别。',
    now: '线上实验室：亲眼看簇中心一步步移动收敛、影像同步着色；再打开"对照真值"——"簇≠地物类别、结果要人工起名"不用讲就懂了。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 600 : 420);
    const MW = 44, MH = 32;

    // 与监督分类同款场景：水/植被/建筑 + 噪声
    const truth = new Uint8Array(MW * MH);
    const red = new Float32Array(MW * MH), nir = new Float32Array(MW * MH);
    const clsDef = [
      { rm: 0.10, rs: 0.03, nm: 0.04, ns: 0.02 },
      { rm: 0.06, rs: 0.02, nm: 0.48, ns: 0.06 },
      { rm: 0.22, rs: 0.04, nm: 0.26, ns: 0.05 },
    ];
    const truthName = ['水体', '植被', '建筑'];
    const truthColor = ['#0284c7', '#16a34a', '#db2777'];
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = y * MW + x;
      let t;
      if (x < 12 + Math.sin(y * 0.4) * 3) t = 0;
      else if (x > 30 + Math.sin(y * 0.3) * 2) t = 2;
      else t = 1;
      if (Math.random() < 0.06) t = Math.floor(Math.random() * 3);
      truth[i] = t;
      const d = clsDef[t];
      red[i] = Math.max(0.01, d.rm + gauss() * d.rs);
      nir[i] = Math.max(0.01, d.nm + gauss() * d.ns);
    }

    const palette = ['#d97706', '#0284c7', '#7c3aed', '#16a34a', '#db2777'];
    const state = {
      K: 3, centers: [], assign: null, iter: 0, running: false, showTruth: false, converged: false, t: 0
    };

    Lab.ui.title(panel, '参数与操作');
    Lab.ui.slider(panel, '聚类数 K', 2, 5, 3, 1, v => { state.K = v; reset(); }, '');
    Lab.ui.button(panel, '运行 K-means', () => { if (!state.running) initCenters(); state.running = true; }, 'primary');
    Lab.ui.button(panel, '重新随机初始化', () => { reset(); initCenters(); state.running = true; });
    Lab.ui.checkbox(panel, '对照真实地物着色', false, v => { state.showTruth = v; draw(); });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '直接点"运行 K-means"——不需要任何样本，看计算机如何把像元自动分成K类。';

    const mapX = narrow ? 16 : W - 300, mapY = 56;
    const cell = narrow ? (W - 32) / MW : 280 / MW;
    const mapW = cell * MW, mapH = cell * MH;
    const fsX = 20, fsY = 56, fsW = narrow ? W - 40 : mapX - 60, fsH = narrow ? 220 : 300;
    const RX = v => fsX + v / 0.4 * fsW, RY = v => fsY + fsH - v / 0.7 * fsH;

    function reset() {
      state.centers = []; state.assign = null; state.iter = 0;
      state.running = false; state.converged = false;
      draw();
    }
    function initCenters() {
      state.centers = [];
      const used = new Set();
      while (state.centers.length < state.K) {
        const i = Math.floor(Math.random() * MW * MH);
        if (used.has(i)) continue;
        used.add(i);
        state.centers.push([red[i], nir[i]]);
      }
      state.iter = 0; state.converged = false;
    }
    function iterate() {
      const N = MW * MH;
      const assign = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        let best = 0, bd = 1e9;
        for (let c = 0; c < state.K; c++) {
          const d = Math.hypot(red[i] - state.centers[c][0], nir[i] - state.centers[c][1]);
          if (d < bd) { bd = d; best = c; }
        }
        assign[i] = best;
      }
      // 重算中心
      let moved = 0;
      for (let c = 0; c < state.K; c++) {
        let sr = 0, sn = 0, n = 0;
        for (let i = 0; i < N; i++) if (assign[i] === c) { sr += red[i]; sn += nir[i]; n++; }
        if (n) {
          const nr = sr / n, nn = sn / n;
          moved = Math.max(moved, Math.hypot(nr - state.centers[c][0], nn - state.centers[c][1]));
          state.centers[c] = [nr, nn];
        }
      }
      state.assign = assign;
      state.iter++;
      if (moved < 0.002 || state.iter > 30) {
        state.running = false; state.converged = true;
        readout.textContent = `收敛！共迭代 ${state.iter} 次。注意：簇的编号是随机的，计算机并不知道每个簇是什么地物——` +
          `打开"对照真实地物着色"，看看每个簇大致对应什么，这就是事后人工判读"起名字"。`;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // ===== 特征空间 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('特征空间（红光 × 近红外）', fsX, fsY - 14);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(fsX, fsY, fsW, fsH);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(fsX, fsY, fsW, fsH);
      ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
      ctx.fillText('红光反射率 →', fsX + fsW / 2 - 30, fsY + fsH + 16);
      ctx.save(); ctx.translate(fsX - 10, fsY + fsH / 2 + 30); ctx.rotate(-Math.PI / 2);
      ctx.fillText('近红外 →', 0, 0); ctx.restore();
      // 像元散点（按簇着色，未聚类则灰色）
      for (let i = 0; i < MW * MH; i += 2) {
        ctx.fillStyle = state.assign ? palette[state.assign[i]] + '99' : 'rgba(100,116,139,.35)';
        ctx.fillRect(RX(red[i]) - 1.5, RY(nir[i]) - 1.5, 3, 3);
      }
      // 簇中心
      state.centers.forEach(([r, n], c) => {
        ctx.fillStyle = palette[c];
        ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(RX(r), RY(n), 8, 0, 7); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#0b1020'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(c + 1), RX(r), RY(n) + 3.5); ctx.textAlign = 'left';
      });
      // 迭代状态
      ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
      ctx.fillText(state.iter ? `迭代次数：${state.iter}${state.converged ? '（已收敛）' : state.running ? '…' : ''}` : '尚未聚类', fsX + 6, fsY + 18);

      // ===== 影像 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(state.showTruth ? '真实地物（对照）' : state.assign ? '聚类结果' : '假彩色影像', mapX, mapY - 14);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const i = y * MW + x;
        if (state.showTruth) ctx.fillStyle = truthColor[truth[i]];
        else if (state.assign) ctx.fillStyle = palette[state.assign[i]];
        else ctx.fillStyle = `rgb(${nir[i] * 255 | 0},${red[i] * 200 | 0},${red[i] * 160 | 0})`;
        ctx.fillRect(mapX + x * cell, mapY + y * cell, cell + 0.5, cell + 0.5);
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(mapX, mapY, mapW, mapH);
      // 图例
      let ly = mapY + mapH + 20;
      if (state.showTruth) {
        truthName.forEach((n, c) => {
          ctx.fillStyle = truthColor[c]; ctx.fillRect(mapX + c * 90, ly - 9, 10, 10);
          ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
          ctx.fillText(n, mapX + c * 90 + 14, ly);
        });
      } else if (state.assign) {
        for (let c = 0; c < state.K; c++) {
          ctx.fillStyle = palette[c]; ctx.fillRect(mapX + c * 64, ly - 9, 10, 10);
          ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
          ctx.fillText(`簇${c + 1}`, mapX + c * 64 + 14, ly);
        }
      }
    }

    function loop() {
      state.t++;
      if (state.running && state.t % 12 === 0) iterate();
      draw();
    }
    return loop;
  }
});
