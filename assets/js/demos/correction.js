/* 遥感图像校正：几何校正 —— 拖动地面控制点GCP，把畸变图像"拉回"正射 */
Lab.register({
  id: 'correction', group: 'proc', session: '模块5·课1 遥感图像校正', icon: '校', title: '几何校正（GCP）',
  concept: '选取地面控制点，建立畸变图像与标准地理坐标的映射，把图像"拉伸"回正确位置',
  military: '无控定位精度有限，侦察图像精校正依赖控制点或高精度星历',
  brief: '畸变图像上的道路网格歪了。拖动四个角点（GCP）对齐网格角，右侧实时显示校正结果。',
  summary: '传感器姿态、地形起伏、地球曲率都会使原始图像产生几何畸变。几何校正的做法：在畸变图像和参考底图（或实地测量）上选取同名点作为地面控制点（GCP），建立多项式映射，再重采样生成校正后图像。GCP越多、分布越均匀，校正精度越高（RMS误差越小）。',
  teach: {
    old: '传统课堂：讲多项式校正公式与重采样，学员不知道"控制点选不好会怎样"。',
    now: '线上实验室：亲手拖GCP——拖到位，图像瞬间变正；拖歪一个角，图像跟着扭曲。RMS误差实时反馈，"控制点要均匀分布"不用背也懂了。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 620 : 420);
    const N = 96;

    // 标准场景：网格+道路+建筑
    const S = document.createElement('canvas'); S.width = N; S.height = N;
    {
      const c = S.getContext('2d');
      c.fillStyle = '#3f6212'; c.fillRect(0, 0, N, N);
      c.strokeStyle = '#94a3b8'; c.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        c.beginPath(); c.moveTo(i * N / 6, 0); c.lineTo(i * N / 6, N); c.stroke();
        c.beginPath(); c.moveTo(0, i * N / 6); c.lineTo(N, i * N / 6); c.stroke();
      }
      c.fillStyle = '#6b7280';
      c.fillRect(N * 0.55, N * 0.2, N * 0.28, N * 0.2);
      c.fillStyle = '#1e5a8a'; c.fillRect(0, N * 0.7, N * 0.4, N * 0.18);
      c.fillStyle = '#f59e0b';
      [[0, 0], [N - 3, 0], [N - 3, N - 3], [0, N - 3]].forEach(([x, y]) => c.fillRect(x, y, 3, 3));
    }

    // 畸变：仿射（旋转+错切+缩放）A·p + t
    const ang = 0.16, kx = 0.86, ky = 1.08, sh = 0.22;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const A = [[kx * ca, -ky * sa + sh], [kx * sa, ky * ca]];
    const cx = N / 2, cy = N / 2;
    const fwd = (x, y) => {
      const dx = x - cx, dy = y - cy;
      return [cx + A[0][0] * dx + A[0][1] * dy, cy + A[1][0] * dx + A[1][1] * dy];
    };
    // 逆矩阵
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const Ai = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
    const inv = (x, y) => {
      const dx = x - cx, dy = y - cy;
      return [cx + Ai[0][0] * dx + Ai[0][1] * dy, cy + Ai[1][0] * dx + Ai[1][1] * dy];
    };
    // 畸变图像 D(p) = S(inv(p))
    const D = document.createElement('canvas'); D.width = N; D.height = N;
    const dctx = D.getContext('2d');
    {
      const sctx = S.getContext('2d');
      const sd = sctx.getImageData(0, 0, N, N);
      const dd = dctx.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const [u, v] = inv(x, y);
        const uu = Math.max(0, Math.min(N - 1, Math.round(u))), vv = Math.max(0, Math.min(N - 1, Math.round(v)));
        const si = (vv * N + uu) * 4, di = (y * N + x) * 4;
        dd.data[di] = sd.data[si]; dd.data[di + 1] = sd.data[si + 1];
        dd.data[di + 2] = sd.data[si + 2]; dd.data[di + 3] = 255;
      }
      dctx.putImageData(dd, 0, 0);
    }
    // 畸变图像中网格角点的真实位置（用户的目标）
    const truth = [fwd(2, 2), fwd(N - 3, 2), fwd(N - 3, N - 3), fwd(2, N - 3)];
    // 用户GCP（初始有偏差）
    const quad = truth.map(([x, y], i) => [x + [14, -12, 10, -16][i], y + [-10, 12, -14, 8][i]]);
    let drag = -1;

    Lab.ui.title(panel, '操作');
    Lab.ui.button(panel, '重置GCP', () => {
      truth.forEach(([x, y], i) => { quad[i] = [x + [14, -12, 10, -16][i], y + [-10, 12, -14, 8][i]]; });
      draw();
    });
    Lab.ui.button(panel, '自动校正（GCP归位）', () => {
      truth.forEach(([x, y], i) => quad[i] = [x, y]);
      draw();
    });
    const readout = Lab.ui.readout(panel);
    readout.textContent = '拖动左侧畸变图像上的4个彩色角点，对齐道路网格的角（黄色标记处）。';

    // 布局
    const lX = 16, lY = 50, lS = narrow ? Math.min(W - 32, 300) : Math.min(W * 0.44, 320);
    const rX = narrow ? 16 : lX + lS + 36, rY = narrow ? lY + lS + 60 : 50;
    const rS = lS;
    const sc = lS / N;

    // 校正输出：output(u,v) = D(bilinear(u,v,quad))
    const out = document.createElement('canvas'); out.width = N; out.height = N;
    const octx = out.getContext('2d');
    const dImg = dctx.getImageData(0, 0, N, N);
    function bilinear(u, v) {
      const [a, b, c, d] = quad;
      return [
        a[0] * (1 - u) * (1 - v) + b[0] * u * (1 - v) + c[0] * u * v + d[0] * (1 - u) * v,
        a[1] * (1 - u) * (1 - v) + b[1] * u * (1 - v) + c[1] * u * v + d[1] * (1 - u) * v
      ];
    }
    function rectify() {
      const od = octx.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const [px, py] = bilinear(x / (N - 1), y / (N - 1));
        const ddi = (y * N + x) * 4;
        if (px < 0 || py < 0 || px >= N || py >= N) { od.data[ddi + 3] = 255; continue; }
        const si = (Math.floor(py) * N + Math.floor(px)) * 4;
        od.data[ddi] = dImg.data[si]; od.data[ddi + 1] = dImg.data[si + 1];
        od.data[ddi + 2] = dImg.data[si + 2]; od.data[ddi + 3] = 255;
      }
      octx.putImageData(od, 0, 0);
    }

    function rms() {
      let s = 0;
      for (let i = 0; i < 4; i++) s += Math.hypot(quad[i][0] - truth[i][0], quad[i][1] - truth[i][1]);
      return s / 4 / sc; // 换算为屏幕像素
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      rectify();
      ctx.imageSmoothingEnabled = false;

      // 左：畸变图像 + GCP
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('畸变图像（拖动角点 = 选GCP）', lX, lY - 12);
      ctx.drawImage(D, lX, lY, lS, lS);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(lX, lY, lS, lS);
      // 目标位置（黄色×）
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
      for (const [tx, ty] of truth) {
        const x = lX + tx * sc, y = lY + ty * sc;
        ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6);
        ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
      }
      ctx.lineWidth = 1;
      // 用户四边形
      ctx.strokeStyle = '#5a3ce6'; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      quad.forEach(([qx, qy], i) => {
        const x = lX + qx * sc, y = lY + qy * sc;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      // 角点手柄
      const cols = ['#db2777', '#16a34a', '#0284c7', '#d97706'];
      quad.forEach(([qx, qy], i) => {
        ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.arc(lX + qx * sc, lY + qy * sc, 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#0b1020'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), lX + qx * sc, lY + qy * sc + 3.5);
        ctx.textAlign = 'left';
      });

      // 右：校正结果
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('校正后图像（实时重采样）', rX, rY - 12);
      ctx.drawImage(out, rX, rY, rS, rS);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(rX, rY, rS, rS);

      const e = rms();
      const ey = narrow ? rY + rS + 30 : lY + lS + 40;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`RMS误差：${e.toFixed(1)} 像素`, lX, ey);
      ctx.fillStyle = e < 2 ? '#16a34a' : e < 6 ? '#f59e0b' : '#dc2626';
      ctx.fillText(e < 2 ? '校正精度优秀！网格已恢复横平竖直。' : e < 6 ? '接近了——继续微调角点对齐黄色×标记。' : '还有明显畸变——把角点拖到黄色×标记上。', lX + 180, ey);

      readout.textContent = e < 2
        ? '校正完成！GCP对准后，多项式映射+重采样把图像拉回正射。试试拖歪一个点看误差变化。'
        : '拖动左侧4个彩色角点（GCP），对齐黄色×标记（控制点真值），右侧实时显示校正结果。';
    }

    // 指针交互
    const cvs = ctx.canvas;
    function ptOf(e) {
      const r = cvs.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    }
    cvs.addEventListener('pointerdown', e => {
      const [x, y] = ptOf(e);
      drag = quad.findIndex(([qx, qy]) => Math.hypot(x - (lX + qx * sc), y - (lY + qy * sc)) < 14);
      if (drag >= 0) cvs.setPointerCapture(e.pointerId);
    });
    cvs.addEventListener('pointermove', e => {
      if (drag < 0) return;
      const [x, y] = ptOf(e);
      quad[drag] = [(x - lX) / sc, (y - lY) / sc];
      draw();
    });
    cvs.addEventListener('pointerup', () => drag = -1);

    draw();
  }
});
