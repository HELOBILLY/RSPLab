/* 遥感光学基础：焦距、视场角、瞬时视场IFOV与地面分辨率 */
Lab.register({
  id: 'optics', group: 'sensor', session: '模块4·课1 遥感光学基础', icon: '镜', title: '焦距·视场·分辨率',
  concept: '焦距越长视场越窄、看得越细：IFOV = 像元尺寸 / 焦距，GSD = 高度 × IFOV',
  military: '侦察相机用长焦换取地面分辨率——0.5m分辨率意味着能分清车型',
  brief: '拖动焦距滑块，看光路、视场角和地面分辨率如何联动变化。',
  summary: '薄透镜成像：1/f = 1/u + 1/v。对遥感而言物距u≈航高H，像距v≈焦距f。瞬时视场IFOV = d/f（d为探测器像元尺寸），是单个像元张开的角；地面采样间隔GSD = H×IFOV。焦距f越大，IFOV越小，GSD越小（看得越细），但视场角越小（看得越窄）——分辨率与覆盖面的权衡在镜头设计时就注定了。',
  teach: {
    old: '传统课堂：光学公式推导一节课，学员会算GSD，但"长焦为什么看得细"缺乏直观。',
    now: '线上实验室：拖焦距，光路实时重画，地面覆盖框与"能看清的目标"同步变化——公式各因子一目了然。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 520 : 400);
    const state = { f: 100, Hkm: 500 }; // f: mm, H: km
    const d = 0.01; // 像元尺寸 mm（10μm）

    Lab.ui.title(panel, '镜头参数');
    Lab.ui.slider(panel, '焦距 f', 30, 500, 100, 5, v => state.f = v, ' mm');
    Lab.ui.slider(panel, '轨道高度 H', 200, 800, 500, 10, v => state.Hkm = v, ' km');
    Lab.ui.button(panel, '广角 30mm', () => setF(30));
    Lab.ui.button(panel, '标准 100mm', () => setF(100));
    Lab.ui.button(panel, '长焦 500mm', () => setF(500));
    const readout = Lab.ui.readout(panel);
    function setF(v) {
      const s = panel.querySelector('input[type=range]');
      s.value = v; s.dispatchEvent(new Event('input'));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const { f, Hkm } = state;
      const ifov = d / f; // rad
      const gsd = Hkm * 1000 * ifov; // m
      const fov = 2 * Math.atan(12 / f); // 探测器半宽12mm
      const swath = 2 * Hkm * 1000 * Math.tan(fov / 2); // m

      // ===== 光路图 =====
      const lx = 30, ly = 60, lw = narrow ? W - 60 : W - 80;
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('薄透镜成像光路', lx, ly - 16);
      const lensX = lx + lw * 0.62, axisY = ly + 110;
      const objX = lx + 30, imgX = lensX + lw * 0.28;
      // 主轴
      ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(lx, axisY); ctx.lineTo(lx + lw, axisY); ctx.stroke();
      ctx.setLineDash([]);
      // 透镜
      ctx.strokeStyle = '#5a3ce6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lensX, axisY - 70); ctx.lineTo(lensX, axisY + 70); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#5a3ce6'; ctx.font = '11px sans-serif';
      ctx.fillText(`透镜 f=${f}mm`, lensX - 30, axisY + 88);
      // 物体（箭头）
      const objH = 60;
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(objX, axisY); ctx.lineTo(objX, axisY - objH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(objX, axisY - objH); ctx.lineTo(objX - 6, axisY - objH + 10); ctx.moveTo(objX, axisY - objH); ctx.lineTo(objX + 6, axisY - objH + 10); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#f59e0b'; ctx.fillText('地面目标', objX - 24, axisY + 20);
      // 像（倒立，大小∝f）
      const imgH = objH * (f / 300) * (500 / Hkm);
      const ih = Math.max(6, Math.min(60, imgH));
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(imgX, axisY); ctx.lineTo(imgX, axisY + ih); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(imgX, axisY + ih); ctx.lineTo(imgX - 5, axisY + ih - 9); ctx.moveTo(imgX, axisY + ih); ctx.lineTo(imgX + 5, axisY + ih - 9); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#16a34a'; ctx.fillText('像（探测器面）', imgX - 34, axisY + ih + 20);
      // 光线1：过光心
      ctx.strokeStyle = 'rgba(30,41,59,.85)';
      ctx.beginPath(); ctx.moveTo(objX, axisY - objH); ctx.lineTo(imgX, axisY + ih); ctx.stroke();
      // 光线2：平行主轴→过焦点
      ctx.strokeStyle = 'rgba(124,58,237,.8)';
      ctx.beginPath(); ctx.moveTo(objX, axisY - objH); ctx.lineTo(lensX, axisY - objH); ctx.lineTo(imgX, axisY + ih); ctx.stroke();

      // ===== 参数联动条 =====
      const by = narrow ? 260 : 250;
      const bx = 30, bw = W - 60;
      const bars = [
        ['瞬时视场 IFOV', ifov * 1000, 0.2, 'mrad', '#5a3ce6'],
        ['地面分辨率 GSD', gsd, 10, 'm', '#16a34a'],
        ['幅宽（覆盖）', swath / 1000, 200, 'km', '#f59e0b'],
      ];
      ctx.font = '12px sans-serif';
      bars.forEach(([n, v, vmax, unit, c], i) => {
        const y = by + i * 44;
        ctx.fillStyle = '#64748b'; ctx.fillText(n, bx, y - 6);
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(bx + 150, y - 16, bw - 260, 14);
        ctx.fillStyle = c; ctx.fillRect(bx + 150, y - 16, Math.min(1, v / vmax) * (bw - 260), 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(v >= 100 ? v.toFixed(0) + ' ' + unit : v.toFixed(v < 1 ? 2 : 1) + ' ' + unit, bx + bw - 100, y - 4);
      });

      // 直观标尺
      const ky = by + 3 * 44 + 16;
      ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif';
      ctx.fillText(`GSD ${gsd.toFixed(2)} m 意味着：`, bx, ky);
      ctx.fillStyle = '#1e293b';
      ctx.fillText(gsd < 0.5 ? '能分清车辆型号、伪装网下的装备轮廓' :
                   gsd < 2 ? '能分辨车辆、小型建筑' :
                   gsd < 10 ? '能分辨大型建筑、跑道' :
                   gsd < 100 ? '只能分辨街区、河流走向' : '只能看城市轮廓级别目标', bx, ky + 22);

      readout.textContent =
        `f=${f}mm、H=${Hkm}km：IFOV=${(ifov * 1000).toFixed(3)}mrad，GSD=${gsd.toFixed(2)}m，幅宽=${(swath / 1000).toFixed(1)}km。` +
        (f <= 50 ? ' 广角镜头：看得宽但看不清——适合普查。' :
         f >= 300 ? ' 长焦镜头：看得细但看得窄——适合详查。' :
         ' 标准镜头：覆盖与细节的折中。');
    }
    draw();
    return draw;
  }
});
