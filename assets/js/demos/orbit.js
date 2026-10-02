/* 遥感卫星轨道：LEO/MEO/GEO、倾角、星下点轨迹（参考 Esri Satellite Explorer） */
Lab.register({
  id: 'orbit', group: 'platform', session: '模块3·课2 遥感卫星轨道', icon: '轨', title: '遥感卫星轨道',
  concept: '轨道高度决定周期与覆盖，轨道倾角决定能到达的纬度范围',
  military: '对地观测卫星多用太阳同步轨道：每天同一地方时过境，光照条件一致利于比对',
  brief: '拖动轨道高度与倾角，看卫星周期、星下点轨迹如何变化；试试太阳同步与地球静止预设。',
  summary: '人造卫星主要运行在三个轨道域：低轨LEO（数百km，对地观测主力，周期约90分钟）、中轨MEO（约2万km，导航卫星）、地球静止轨道GEO（35786km，定点赤道上空凝视）。轨道倾角决定覆盖纬度：倾角98.5°的太阳同步轨道可覆盖全球并保证每天同一地方时过境——成像卫星因此能获取几乎整个陆地的高分辨率数据。',
  teach: {
    old: '传统课堂：背"太阳同步轨道倾角98.5°"，学员不理解为什么是这个数、星下点轨迹为什么是正弦形。',
    now: '线上实验室：拖高度看周期按开普勒定律变化，拖倾角看星下点轨迹张合——SSO/GEO预设一键对比。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 620 : 420);
    const state = { alt: 705, inc: 98.5, t: 0, trail: [] };

    Lab.ui.title(panel, '轨道参数');
    Lab.ui.slider(panel, '轨道高度', 300, 35786, 705, 1, v => { state.alt = v; state.trail = []; }, ' km');
    Lab.ui.slider(panel, '轨道倾角', 0, 98.5, 98.5, 0.5, v => { state.inc = v; state.trail = []; }, '°');
    Lab.ui.button(panel, '太阳同步 705km/98.5°', () => setO(705, 98.5), { group: 'pre', active: true });
    Lab.ui.button(panel, '极轨 850km/90°', () => setO(850, 90), { group: 'pre' });
    Lab.ui.button(panel, '导航MEO 20200km/55°', () => setO(20200, 55), { group: 'pre' });
    Lab.ui.button(panel, '地球静止 35786km/0°', () => setO(35786, 0), { group: 'pre' });
    const readout = Lab.ui.readout(panel);
    function setO(a, i) {
      const ss = panel.querySelectorAll('input[type=range]');
      ss[0].value = a; ss[0].dispatchEvent(new Event('input'));
      ss[1].value = i; ss[1].dispatchEvent(new Event('input'));
    }

    const RE = 6371; // km
    function periodMin() { return 2 * Math.PI * Math.sqrt(Math.pow(RE + state.alt, 3) / 398600.4418) / 60; }

    // 布局
    const ex = narrow ? W / 2 : Math.floor(W * 0.30), ey = narrow ? 180 : 210; // 地球中心
    const eR = narrow ? 70 : 85; // 地球半径px
    const mapX = narrow ? 16 : Math.floor(W * 0.55), mapY = narrow ? 400 : 60;
    const mapW = narrow ? W - 32 : W - mapX - 16, mapH = narrow ? 170 : 300;

    function draw() {
      state.t++;
      ctx.clearRect(0, 0, W, H);
      const T = periodMin();
      const regime = state.alt < 2000 ? '低轨 LEO' : state.alt < 30000 ? '中轨 MEO' : '地球静止/高轨 GEO';

      // ===== 左侧：地球+轨道 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`轨道示意（${regime}）`, narrow ? 16 : ex - eR - 60, 30);
      // 轨道半径（对数压缩显示）
      const disp = eR + 18 + Math.log10(state.alt / 280) / Math.log10(35786 / 280) * (narrow ? 60 : 90);
      // 地球
      const g = ctx.createRadialGradient(ex - 20, ey - 20, 10, ex, ey, eR);
      g.addColorStop(0, '#0284c7'); g.addColorStop(0.6, '#0ea5e9'); g.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, eR, 0, 7); ctx.fill();
      // 昼夜分界
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.arc(ex, ey, eR, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(ex - eR - 26, ey, 8, 0, 7); ctx.fill();
      ctx.font = '10px sans-serif'; ctx.fillText('太阳', ex - eR - 36, ey + 22);

      // 轨道椭圆（倾角→视觉压扁+旋转）
      const tilt = state.inc * Math.PI / 180;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, disp, disp * Math.abs(Math.cos(tilt)) * 0.9 + disp * 0.1, 0, 0, 7);
      ctx.stroke(); ctx.lineWidth = 1;
      // 卫星位置（角速度∝1/T）
      const u = state.t * (90 / T) * 0.02;
      const sx2 = Math.cos(u) * disp;
      const sy2 = Math.sin(u) * (disp * Math.abs(Math.cos(tilt)) * 0.9 + disp * 0.1);
      ctx.fillStyle = '#db2777';
      ctx.beginPath(); ctx.arc(sx2, sy2, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.font = '10px sans-serif';
      ctx.fillText('卫星', sx2 + 9, sy2 + 4);
      ctx.restore();

      // 参数读出
      ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
      const infoX = narrow ? 16 : 16, infoY = narrow ? 330 : H - 70;
      ctx.fillText(`高度 ${state.alt} km ｜ 周期 ${T.toFixed(1)} 分钟 ｜ 每天约 ${(1440 / T).toFixed(1)} 圈`, infoX, infoY);
      ctx.fillText(`倾角 ${state.inc}° ｜ 覆盖纬度 ±${state.inc > 90 ? '90' : state.inc.toFixed(0)}°`, infoX, infoY + 20);

      // ===== 右侧：星下点轨迹 =====
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('星下点轨迹（3圈）', mapX, mapY - 10);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(mapX, mapY, mapW, mapH);
      // 经纬网格
      ctx.strokeStyle = 'rgba(203,213,225,.85)';
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(mapX + i * mapW / 6, mapY); ctx.lineTo(mapX + i * mapW / 6, mapY + mapH); ctx.stroke(); }
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(mapX, mapY + i * mapH / 4); ctx.lineTo(mapX + mapW, mapY + i * mapH / 4); ctx.stroke(); }
      // 赤道
      ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(mapX, mapY + mapH / 2); ctx.lineTo(mapX + mapW, mapY + mapH / 2); ctx.stroke();
      ctx.setLineDash([]);

      // 轨迹：lat = asin(sin i · sin u)；地球自转使星下点每圈西移 lonPerOrb 度
      const uNow = state.t * (90 / T) * 0.02;
      const lonPerOrb = 360 * T / 1440;
      const trackPt = uu => {
        const lat = Math.asin(Math.sin(tilt) * Math.sin(uu)) * 180 / Math.PI;
        const lonDeg = uu * 180 / Math.PI - (uu / (2 * Math.PI)) * lonPerOrb;
        const lon = ((lonDeg % 360) + 540) % 360 - 180;
        return [mapX + (lon + 180) / 360 * mapW, mapY + (90 - lat) / 180 * mapH];
      };
      // 成像幅宽覆盖带（先画宽线垫底）
      for (const [color, lw] of [['rgba(90,60,230,.30)', 9], ['#db2777', 1.5]]) {
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath();
        for (let k = -240; k <= 0; k += 2) {
          const [x, y] = trackPt(uNow + k * 0.02);
          k === -240 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // 当前星下点
      const [nx, ny] = trackPt(uNow);
      ctx.fillStyle = '#db2777';
      ctx.beginPath(); ctx.arc(nx, ny, 4, 0, 7); ctx.fill();

      readout.textContent =
        state.alt > 30000 ? '地球静止轨道：周期=23h56m=地球自转，定点赤道上空"凝视"，适合持续监视同一区域，但只能看到中低纬度。' :
        state.inc > 97 ? '太阳同步轨道：轨道面进动与地球公转同步，每天同一地方时过境——光照一致，利于多时相图像比对，是对地观测卫星的标配。' :
        state.inc > 80 ? '极轨：飞越两极，地球自转使每圈覆盖不同经度，数天即可覆盖全球。' :
        '中轨典型是导航卫星（GPS/北斗），对地观测很少用。';
    }
    return draw;
  }
});
