/* 摄影型传感器：中心投影、像框幅成像与投影差 */
Lab.register({
  id: 'camera', group: 'sensor', session: '模块4·课2 摄影型传感器', icon: '摄', title: '摄影成像与投影差',
  concept: '框幅相机一次曝光拍一整张中心投影像片；高目标在像片上向外"倒"（投影差）',
  military: '投影差既是畸变也是财富：立体像对测高正是利用它反演目标高度',
  brief: '按快门拍一张中心投影像片，调楼房高度和航高，看楼在像片上"向外倒"多少。',
  summary: '摄影型传感器（框幅相机）快门一次曝光，整幅像片同时成像，几何关系是中心投影：所有光线穿过镜头中心。高出地面的目标，其顶部在像片上相对底部沿径向向外位移，即投影差 δ = r·h/H（r为像点距像主点距离，h为目标高，H为航高）。投影差造成高层目标"倾倒"，但立体像对正是利用它测量目标高度。',
  teach: {
    old: '传统课堂：投影差公式 δ=r·h/H 写在黑板上，学员不理解楼为什么会"倒"、往哪边倒。',
    now: '线上实验室：亲手按快门，楼在像片上实时"倒掉"；拖航高看投影差缩小——公式每一项都有画面。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 600 : 420);
    const state = { h: 80, Hkm: 5000, flash: 0 };

    Lab.ui.title(panel, '摄影参数');
    Lab.ui.slider(panel, '楼房高度 h', 0, 150, 80, 5, v => state.h = v, ' m');
    Lab.ui.slider(panel, '航高 H', 1000, 10000, 5000, 100, v => state.Hkm = v, ' m');
    Lab.ui.button(panel, '📷 按快门', () => { state.flash = 18; });
    const readout = Lab.ui.readout(panel);

    // 布局
    const geoX = 20, geoY = 50, geoW = narrow ? W - 40 : Math.floor(W * 0.44), geoH = narrow ? 240 : 300;
    const imgX = narrow ? 20 : geoX + geoW + 40, imgY = narrow ? 340 : 50;
    const imgS = narrow ? Math.min(W - 40, 240) : Math.min(W - imgX - 20, 300);

    // 地面场景（正射参考，用于像片绘制）
    const SW = 128;
    const scene = document.createElement('canvas');
    scene.width = SW; scene.height = SW;
    {
      const c = scene.getContext('2d');
      c.fillStyle = '#3f6212'; c.fillRect(0, 0, SW, SW);
      c.fillStyle = '#8a6742';
      for (let i = 0; i < 6; i++) c.fillRect(8 + (i % 3) * 40, 8 + Math.floor(i / 3) * 40, 30, 30);
      c.fillStyle = '#6b7280'; c.fillRect(84, 84, 36, 36); // 楼
      c.fillStyle = '#6b7280'; c.fillRect(0, 60, SW, 6); // 路
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const { h, Hkm } = state;
      const scale = geoH * 0.55 / (Hkm / 20); // 几何比例
      const groundY = geoY + geoH - 40;
      const camX = geoX + geoW / 2, camY = groundY - Math.min(geoH * 0.62, Hkm * scale / 100);

      // ===== 左侧几何 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('中心投影几何', geoX, geoY - 12);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(geoX, groundY, geoW, 40);
      ctx.fillStyle = '#16a34a'; ctx.fillRect(geoX, groundY, geoW, 4);
      // 楼房（偏离中心）
      const bldH = h * scale / 100 * 2.2, bldX = geoX + geoW * 0.68, bldW = 26;
      ctx.fillStyle = '#6b7280'; ctx.fillRect(bldX, groundY - bldH, bldW, bldH);
      ctx.fillStyle = '#db2777'; ctx.fillRect(bldX, groundY - bldH, bldW, 4);
      // 相机
      ctx.fillStyle = '#5a3ce6'; ctx.fillRect(camX - 10, camY - 7, 20, 14);
      ctx.beginPath(); ctx.moveTo(camX - 5, camY + 7); ctx.lineTo(camX + 5, camY + 7); ctx.lineTo(camX, camY + 14); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.font = '11px sans-serif';
      ctx.fillText(`相机 H=${(Hkm / 1000).toFixed(1)}km`, camX + 16, camY);
      // 投影光线：楼底、楼顶
      ctx.strokeStyle = '#16a34a'; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(camX, camY); ctx.lineTo(bldX + bldW / 2, groundY); ctx.stroke();
      ctx.strokeStyle = '#db2777';
      ctx.beginPath(); ctx.moveTo(camX, camY); ctx.lineTo(bldX + bldW / 2, groundY - bldH); ctx.stroke();
      ctx.setLineDash([]);
      // 像平面
      const filmY = camY + 46;
      ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(camX - 70, filmY); ctx.lineTo(camX + 70, filmY); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#7c3aed'; ctx.font = '10px sans-serif'; ctx.fillText('像平面', camX + 74, filmY + 4);
      // 楼底/楼顶在像平面上的投影点
      function projPt(gx, gy) {
        const t = (filmY - camY) / (gy - camY);
        return camX + (gx - camX) * t;
      }
      const pBot = projPt(bldX + bldW / 2, groundY);
      const pTop = projPt(bldX + bldW / 2, groundY - bldH);
      ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(pBot, filmY, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#db2777'; ctx.beginPath(); ctx.arc(pTop, filmY, 4, 0, 7); ctx.fill();
      // 投影差标注
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pTop, filmY + 10); ctx.lineTo(pBot, filmY + 10); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#f59e0b'; ctx.font = '11px sans-serif';
      ctx.fillText('投影差δ', (pTop + pBot) / 2 - 18, filmY + 24);
      // 闪光
      if (state.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${state.flash / 18 * 0.5})`;
        ctx.fillRect(0, 0, W, H);
        state.flash--;
      }

      // ===== 右侧像片 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('拍下的像片（中心投影）', imgX, imgY - 12);
      // 逐列绘制：楼顶按中心投影外移
      const delta = state.h / Hkm; // 投影差比例
      ctx.save();
      ctx.beginPath(); ctx.rect(imgX, imgY, imgS, imgS); ctx.clip();
      ctx.drawImage(scene, imgX, imgY, imgS, imgS);
      // 楼顶面：向外偏移绘制（近似投影差效果）
      const cx = imgX + imgS * (84 + 18) / SW, cy = imgY + imgS * (84 + 18) / SW;
      const bx0 = imgX + imgS * 84 / SW, by0 = imgY + imgS * 84 / SW, bs = imgS * 36 / SW;
      const dirX = (cx - (imgX + imgS / 2)) / (imgS / 2), dirY = (cy - (imgY + imgS / 2)) / (imgS / 2);
      const off = delta * imgS * 0.9;
      // 侧面（投影差拉出的楼体侧面）
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.moveTo(bx0, by0);
      ctx.lineTo(bx0 + bs, by0);
      ctx.lineTo(bx0 + bs + dirX * off, by0 + dirY * off);
      ctx.lineTo(bx0 + dirX * off, by0 + dirY * off);
      ctx.closePath(); ctx.fill();
      // 顶面外移
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(bx0 + dirX * off, by0 + dirY * off, bs, bs);
      ctx.restore();
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(imgX, imgY, imgS, imgS);
      // 像主点
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(imgX + imgS / 2 - 8, imgY + imgS / 2); ctx.lineTo(imgX + imgS / 2 + 8, imgY + imgS / 2);
      ctx.moveTo(imgX + imgS / 2, imgY + imgS / 2 - 8); ctx.lineTo(imgX + imgS / 2, imgY + imgS / 2 + 8); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = '10px sans-serif';
      ctx.fillText('像主点', imgX + imgS / 2 + 10, imgY + imgS / 2 - 6);
      // 投影差箭头
      if (off > 2) {
        ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx0 + bs / 2, by0 + bs / 2); ctx.lineTo(bx0 + bs / 2 + dirX * off, by0 + bs / 2 + dirY * off); ctx.stroke();
        ctx.lineWidth = 1;
      }

      const deltaM = (state.h / Hkm * (imgS * 0.4)).toFixed(1);
      readout.textContent =
        `δ = r·h/H：楼高${state.h}m、航高${(Hkm / 1000).toFixed(1)}km → 楼顶在像片上向外偏移。` +
        (state.h / Hkm > 0.02 ? ' 投影差明显——高楼/山峰"向外倒"，像片边缘更严重。' :
         state.h / Hkm > 0.008 ? ' 投影差中等。' : ' 投影差很小，接近正射。') +
        ' 两站立体观测正是利用这个位移反演目标高度。';
    }
    draw();
    return draw;
  }
});
