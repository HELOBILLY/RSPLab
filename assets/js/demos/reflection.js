/* 地物反射特性：镜面反射 / 漫反射 / 方向反射（BRDF） */
Lab.register({
  id: 'reflection', group: 'phys', session: '模块2·课3 地物电磁波反射特性', icon: '反', title: '镜面反射与漫反射',
  concept: '表面光滑→镜面反射，表面粗糙→漫反射（朗伯体），真实地物介于其间（方向反射）',
  military: '同一目标在不同观测角度亮度不同——多角度成像可揭露伪装',
  brief: '拖动表面粗糙度，看反射光从"一束镜面光"变成"半球漫反射"；再拖观测角，体验方向反射。',
  summary: '镜面反射：入射角等于反射角，能量集中在一个方向（平静水面、玻璃）；漫反射：能量均匀射向半球各方向，从哪个角度看都一样亮（朗伯体，如粗糙土地）；真实地物多为方向反射（BRDF描述）：某个方向偏亮。这解释了为什么同一地物在不同观测几何下亮度不同。',
  teach: {
    old: '传统课堂：画两个箭头对比镜面/漫反射，学员知道定义，但不理解"为什么卫星换个角度拍，同一块地亮度变了"。',
    now: '线上实验室：拖粗糙度看反射光分布实时变形，再拖观测角"绕着目标看"——BRDF从抽象符号变成手中可玩的曲面。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 560 : 400);
    const state = { rough: 0.5, view: 45, t: 0 };

    Lab.ui.title(panel, '表面与观测参数');
    Lab.ui.slider(panel, '表面粗糙度', 0, 1, 0.5, 0.01, v => state.rough = v, '');
    Lab.ui.slider(panel, '观测角（传感器位置）', 10, 80, 45, 1, v => state.view = v, '°');
    Lab.ui.button(panel, '镜面（平静水面）', () => setR(0.02));
    Lab.ui.button(panel, '朗伯体（粗糙土地）', () => setR(1));
    const readout = Lab.ui.readout(panel);
    function setR(v) {
      const s = panel.querySelector('input[type=range]');
      s.value = v; s.dispatchEvent(new Event('input'));
    }

    // 几何：左侧场景，右侧极坐标分布
    const incAngle = 45; // 入射角（从法线计）
    const sceneW = narrow ? W - 32 : Math.floor(W * 0.52);
    const sx = 16, sy = 50;
    const surfY = sy + 190, surfX0 = sx + 20, surfX1 = sx + sceneW - 40;
    const hitX = (surfX0 + surfX1) / 2;

    // 反射分布：rough=0 → 集中在镜面方向；rough=1 → 余弦半球
    function reflDist(aDeg) { // aDeg: 出射角（-90..90，从法线计，与入射异侧为正）
      const a = aDeg * Math.PI / 180;
      const spec = Math.exp(-Math.pow((aDeg - incAngle) / 8, 2)); // 镜面峰
      const diff = Math.cos(a); // 朗伯余弦
      return Math.max(0, (1 - state.rough) * spec + state.rough * 0.55 * diff);
    }

    function draw() {
      state.t++;
      ctx.clearRect(0, 0, W, H);

      // ===== 左侧场景 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('光线与表面相互作用', sx, sy - 12);
      // 表面（粗糙度→锯齿）
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = surfX0; x <= surfX1; x += 6) {
        const jag = (Math.sin(x * 1.7) + Math.sin(x * 3.1)) * state.rough * 4;
        x === surfX0 ? ctx.moveTo(x, surfY + jag) : ctx.lineTo(x, surfY + jag);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(surfX0, surfY + 8, surfX1 - surfX0, 26);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(state.rough < 0.3 ? '光滑表面' : state.rough < 0.7 ? '中等粗糙' : '粗糙表面', surfX0, surfY + 26);

      // 法线
      ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hitX, surfY); ctx.lineTo(hitX, surfY - 150); ctx.stroke();
      ctx.setLineDash([]);

      // 入射光（左上方45°）
      const ia = incAngle * Math.PI / 180;
      const srcX = hitX - Math.sin(ia) * 130, srcY = surfY - Math.cos(ia) * 130;
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(srcX, srcY); ctx.lineTo(hitX, surfY); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(srcX, srcY, 10, 0, 7); ctx.fill();
      ctx.font = '11px sans-serif'; ctx.fillText('入射光', srcX - 14, srcY - 16);
      ctx.fillText(`${incAngle}°`, hitX - 42, surfY - 34);

      // 反射光线族（按分布强度画透明度）
      for (let a = -80; a <= 80; a += 8) {
        const I = reflDist(a);
        if (I < 0.03) continue;
        const ar = a * Math.PI / 180;
        const ex = hitX + Math.sin(ar) * 110, ey = surfY - Math.cos(ar) * 110;
        ctx.strokeStyle = `rgba(90,60,230,${Math.min(1, I)})`;
        ctx.lineWidth = 1 + I * 2;
        ctx.beginPath(); ctx.moveTo(hitX, surfY); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.lineWidth = 1;

      // 传感器（观测角）
      const va = state.view * Math.PI / 180;
      const vx = hitX + Math.sin(va) * 120, vy = surfY - Math.cos(va) * 120;
      const vI = reflDist(state.view);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(vx - 9, vy - 5, 18, 10);
      ctx.font = '11px sans-serif';
      ctx.fillText(`传感器 ${state.view}°`, vx - 26, vy - 12);
      // 传感器接收强度光圈
      ctx.strokeStyle = `rgba(22,163,74,${Math.min(1, vI)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(vx, vy, 10 + vI * 14, 0, 7); ctx.stroke();
      ctx.lineWidth = 1;

      // ===== 右侧极坐标分布图 =====
      const px = narrow ? W / 2 : sx + sceneW + 60;
      const py = narrow ? 420 : sy + 130;
      const pr = narrow ? 90 : 100;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('反射强度方向分布（BRDF形状）', narrow ? 16 : px - pr - 20, narrow ? py - pr - 26 : sy - 12);
      // 半球网格
      ctx.strokeStyle = '#cbd5e1';
      for (const rr of [0.33, 0.66, 1]) {
        ctx.beginPath(); ctx.arc(px, py, pr * rr, Math.PI, 0); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(px - pr, py); ctx.lineTo(px + pr, py); ctx.stroke();
      // 分布曲线
      ctx.fillStyle = 'rgba(90,60,230,.25)'; ctx.strokeStyle = '#5a3ce6';
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let a = -90; a <= 90; a += 3) {
        const I = reflDist(a);
        const ar = a * Math.PI / 180;
        const rr = Math.min(1, I) * pr;
        ctx.lineTo(px + Math.sin(ar) * rr, py - Math.cos(ar) * rr);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 观测角标记
      const mr = Math.min(1, vI) * pr;
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(px + Math.sin(va) * mr, py - Math.cos(va) * mr, 5, 0, 7); ctx.fill();
      ctx.font = '11px sans-serif';
      ctx.fillText('绿点=传感器方向', px + 30, py + 18);
      // 镜面方向标记
      ctx.fillStyle = '#f59e0b';
      const sa = incAngle * Math.PI / 180;
      ctx.fillText('镜面方向', px + Math.sin(sa) * pr * 0.7 - 20, py - Math.cos(sa) * pr * 0.7 - 10);

      readout.textContent =
        state.rough < 0.2 ? `接近镜面反射：能量集中在${incAngle}°镜面方向。把观测角拖到45°附近，传感器会"看到"强闪光！` :
        state.rough > 0.8 ? '接近朗伯体：各方向亮度均匀，传感器在哪个角度读数都差不多。' :
        `方向反射（真实地物）：传感器当前方向强度 ${(vI * 100).toFixed(0)}%。拖观测角，读数随之变化——这就是BRDF。`;
    }
    return draw;
  }
});
