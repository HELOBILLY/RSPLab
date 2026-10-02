/* 遥感图像计算机分类：监督分类（采样→训练→最小距离分类→精度评价） */
Lab.register({
  id: 'classify', group: 'proc', session: '模块5·课4 遥感图像计算机分类', icon: '类', title: '监督分类',
  concept: '在特征空间为每类地物采集训练样本，计算机按"距离最近"把每个像元归类',
  military: '自动目标识别的基础：伪装网与真植被在特征空间的位置不同',
  brief: '点选样本看散点在特征空间聚成云团，再点"开始分类"——整幅图按"离谁最近"自动着色。',
  summary: '监督分类四步：①选类别（如水体/植被/建筑）；②采样本——在影像上圈出已知类别的像元，它们在特征空间（如红光—近红外）中聚成云团；③训练——计算每类的特征中心；④分类——把每个像元判给距离最近的类。样本选得好不好，直接决定分类精度。',
  teach: {
    old: '传统课堂：讲最小距离/最大似然公式，学员不知道"样本没选好"会在图上造成什么后果。',
    now: '线上实验室：亲手采样、亲手分类——样本集中在角落，分类图就出错；精度百分比即时反馈，"样本代表性"一次就懂。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 600 : 420);
    const MW = 44, MH = 32; // 影像像元数

    // 真值图与特征生成
    const truth = new Uint8Array(MW * MH); // 0水 1植被 2建筑
    const red = new Float32Array(MW * MH), nir = new Float32Array(MW * MH);
    const clsDef = [
      { n: '水体', c: '#0284c7', rm: 0.10, rs: 0.03, nm: 0.04, ns: 0.02 },
      { n: '植被', c: '#16a34a', rm: 0.06, rs: 0.02, nm: 0.48, ns: 0.06 },
      { n: '建筑', c: '#db2777', rm: 0.22, rs: 0.04, nm: 0.26, ns: 0.05 },
    ];
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = y * MW + x;
      let t;
      if (x < 12 + Math.sin(y * 0.4) * 3) t = 0;
      else if (x > 30 + Math.sin(y * 0.3) * 2) t = 2;
      else t = 1;
      if (Math.random() < 0.06) t = Math.floor(Math.random() * 3); // 边界混合
      truth[i] = t;
      const d = clsDef[t];
      red[i] = Math.max(0.01, d.rm + gauss() * d.rs);
      nir[i] = Math.max(0.01, d.nm + gauss() * d.ns);
    }

    const state = { cls: 1, samples: [[], [], []], result: null, acc: null };

    Lab.ui.title(panel, '第1步：选类别 → 在右侧影像上点选样本');
    clsDef.forEach((cd, i) =>
      Lab.ui.button(panel, `${cd.n}样本`, () => { state.cls = i; }, { group: 'cls', active: i === 1 }));
    Lab.ui.title(panel, '第2步：训练并分类');
    Lab.ui.button(panel, '开始分类（最小距离法）', classify, 'primary');
    Lab.ui.button(panel, '清空重来', () => { state.samples = [[], [], []]; state.result = null; state.acc = null; draw(); });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '每类至少采 5 个样本再分类。试试只在一小块区域采样，看精度如何下降。';

    // 布局
    const mapX = narrow ? 16 : W - 300, mapY = 56, cell = narrow ? (W - 32) / MW : 280 / MW * 1;
    const mapW = cell * MW, mapH = cell * MH;
    const fsX = 20, fsY = 56, fsW = narrow ? W - 40 : mapX - 60, fsH = narrow ? 220 : 300;
    const RX = v => fsX + v / 0.4 * fsW, RY = v => fsY + fsH - v / 0.7 * fsH;

    function means() {
      return state.samples.map(ss => {
        if (!ss.length) return null;
        let r = 0, n = 0;
        for (const i of ss) { r += red[i]; n += nir[i]; }
        return [r / ss.length, n / ss.length];
      });
    }

    function classify() {
      const ms = means();
      if (ms.some(m => !m)) { readout.textContent = '三类都要先采样才能分类！'; return; }
      state.result = new Uint8Array(MW * MH);
      let ok = 0;
      for (let i = 0; i < MW * MH; i++) {
        let best = 0, bd = 1e9;
        for (let c = 0; c < 3; c++) {
          const d = Math.hypot(red[i] - ms[c][0], nir[i] - ms[c][1]);
          if (d < bd) { bd = d; best = c; }
        }
        state.result[i] = best;
        if (best === truth[i]) ok++;
      }
      state.acc = ok / (MW * MH) * 100;
      readout.textContent = `分类完成！总体精度 ${state.acc.toFixed(1)}%。` +
        (state.acc > 92 ? ' 样本代表性好，类间边界清晰。' :
         state.acc > 80 ? ' 还不错——误差多在类别交界处（混合像元）。' :
         ' 精度偏低：检查样本是否太少或太集中，重新采样再试。');
      draw();
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
      // 全部像元淡点
      ctx.fillStyle = 'rgba(100,116,139,.25)';
      for (let i = 0; i < MW * MH; i += 3) ctx.fillRect(RX(red[i]) - 1, RY(nir[i]) - 1, 2, 2);
      // 决策边界（垂直平分线）
      const ms = means();
      if (state.result && ms.every(Boolean)) {
        ctx.strokeStyle = 'rgba(245,158,11,.5)'; ctx.setLineDash([4, 3]);
        for (const [a, b] of [[0, 1], [1, 2], [0, 2]]) {
          const [ax, ay] = ms[a], [bx, by] = ms[b];
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
          const px = -dy / L, py = dx / L;
          ctx.beginPath();
          ctx.moveTo(RX(mx - px * 0.5), RY(my - py * 0.5));
          ctx.lineTo(RX(mx + px * 0.5), RY(my + py * 0.5));
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      // 样本点
      state.samples.forEach((ss, c) => {
        ctx.strokeStyle = clsDef[c].c; ctx.lineWidth = 1.5;
        for (const i of ss) {
          const x = RX(red[i]), y = RY(nir[i]);
          ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3);
          ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
        }
        ctx.lineWidth = 1;
      });
      // 类中心
      ms.forEach((m, c) => {
        if (!m) return;
        ctx.fillStyle = clsDef[c].c;
        ctx.beginPath(); ctx.arc(RX(m[0]), RY(m[1]), 6, 0, 7); ctx.fill();
        ctx.fillStyle = '#0b1020'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(clsDef[c].n[0], RX(m[0]), RY(m[1]) + 3); ctx.textAlign = 'left';
      });

      // ===== 影像/分类图 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(state.result ? `分类结果（精度 ${state.acc.toFixed(1)}%）` : '假彩色影像（点击采样）', mapX, mapY - 14);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const i = y * MW + x;
        if (state.result) {
          ctx.fillStyle = clsDef[state.result[i]].c;
        } else {
          // 假彩色：R=nir G=red B=red*0.8
          ctx.fillStyle = `rgb(${nir[i] * 255 | 0},${red[i] * 200 | 0},${red[i] * 160 | 0})`;
        }
        ctx.fillRect(mapX + x * cell, mapY + y * cell, cell + 0.5, cell + 0.5);
      }
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(mapX, mapY, mapW, mapH);
      // 样本标记
      state.samples.forEach((ss, c) => {
        ctx.strokeStyle = clsDef[c].c; ctx.lineWidth = 1.5;
        for (const i of ss) {
          const x = mapX + (i % MW) * cell, y = mapY + Math.floor(i / MW) * cell;
          ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
        }
        ctx.lineWidth = 1;
      });
      // 图例
      let ly = mapY + mapH + 20;
      clsDef.forEach((cd, c) => {
        ctx.fillStyle = cd.c; ctx.fillRect(mapX + c * 90, ly - 9, 10, 10);
        ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
        ctx.fillText(`${cd.n}(${state.samples[c].length})`, mapX + c * 90 + 14, ly);
      });
    }

    ctx.canvas.addEventListener('click', e => {
      const r = ctx.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
      if (x >= mapX && x < mapX + mapW && y >= mapY && y < mapY + mapH) {
        const px = Math.floor((x - mapX) / cell), py = Math.floor((y - mapY) / cell);
        // 点选采 3×3 邻域
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = px + dx, yy = py + dy;
          if (xx >= 0 && xx < MW && yy >= 0 && yy < MH) {
            const i = yy * MW + xx;
            if (!state.samples[state.cls].includes(i)) state.samples[state.cls].push(i);
          }
        }
        state.result = null; state.acc = null;
        readout.textContent = `已为"${clsDef[state.cls].n}"采样 ${state.samples[state.cls].length} 个像元。` +
          (state.samples.every(s => s.length >= 5) ? ' 三类样本都够了，点击"开始分类"！' : '');
        draw();
      }
    });

    draw();
  }
});
