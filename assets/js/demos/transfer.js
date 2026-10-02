/* 辐射传输过程：太阳→大气→地表→传感器，拖动大气参数看能量变化 */
Lab.register({
  id: 'transfer', group: 'phys', session: '模块2·课1 电磁波与传输特性', icon: '传', title: '辐射传输过程',
  concept: '太阳辐射穿过大气到达地表，反射后再穿大气进入传感器——每一步都有衰减',
  military: '卫星侦察到的信号是"层层打折"后的结果，定量反演必须做大气校正',
  brief: '拖动大气参数（气溶胶、太阳高度角、地表反射率），实时观察传感器接收到的能量如何变化。',
  summary: '太阳辐射从太空出发，穿过大气时被吸收和散射，到达地表后按地物反射率反射，再次穿过大气才进入传感器。传感器接收的能量 = 太阳常数 × 大气下行透过率 × 地表反射率 × 大气上行透过率。这就是为什么遥感定量应用必须做大气校正。',
  teach: {
    old: '传统课堂：黑板上写一串公式 E = E₀·τ·ρ·τ，学员背下公式却不知道每个字母"长什么样"。',
    now: '线上实验室：拖一拖气溶胶滑块，看光子被散射得四散飞溅、能量条一格格缩短——公式里的每个因子都变成了看得见的画面。'
  },
  render(stage, panel) {
    const { ctx, W, H } = Lab.ui.canvas(stage, 400);
    const state = { aod: 0.3, zenith: 35, albedo: 0.3, t: 0 };
    let photons = [];

    Lab.ui.title(panel, '大气参数（拖一拖，看能量变化）');
    Lab.ui.slider(panel, '气溶胶光学厚度 AOD', 0, 1, 0.3, 0.05, v => state.aod = v, '（雾霾程度）');
    Lab.ui.slider(panel, '太阳天顶角', 15, 75, 35, 1, v => state.zenith = v, '°');
    Lab.ui.slider(panel, '地表反射率 ρ', 0.05, 0.9, 0.3, 0.05, v => state.albedo = v, '');
    const readout = Lab.ui.readout(panel);

    // 几何
    const groundY = H - 60, topY = 30;
    const sunX = 90, satX = W - 90;
    const groundPt = { x: W / 2, y: groundY };

    function transmittance() {
      const cz = Math.cos(state.zenith * Math.PI / 180);
      const tauDown = Math.exp(-state.aod / cz);
      const tauUp = Math.exp(-state.aod); // 垂直上行
      return { cz, tauDown, tauUp, E: 1361 * cz * tauDown * state.albedo * tauUp };
    }

    function spawnPhotons() {
      const { tauDown } = transmittance();
      if (Math.random() < 0.5) {
        const survive = Math.random() < tauDown;
        photons.push({
          x: sunX + 20, y: topY + 10, vx: 2.2, vy: 1.9,
          phase: 'down', survive, life: 1
        });
      }
      photons = photons.filter(p => p.life > 0);
    }

    function step() {
      state.t++;
      spawnPhotons();
      for (const p of photons) {
        if (p.phase === 'down') {
          const dx = groundPt.x - p.x, dy = groundPt.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 8) {
            if (p.survive && Math.random() < state.albedo) {
              p.phase = 'up';
            } else { p.life = 0; }
          } else {
            p.x += dx / d * 2.6; p.y += dy / d * 2.6;
            if (!p.survive && Math.random() < 0.06) { p.vx = (Math.random() - .5) * 3; p.vy = (Math.random() - .5) * 3; p.scattered = true; }
            if (p.scattered) { p.x += p.vx; p.y += p.vy; p.life -= 0.03; }
          }
        } else {
          const dx = satX - p.x, dy = (topY + 10) - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 10) { p.life = 0; }
          else { p.x += dx / d * 2.8; p.y += dy / d * 2.8; if (Math.random() < state.aod * 0.04) p.life = 0; }
        }
      }
    }

    function draw() {
      step();
      const { cz, tauDown, tauUp, E } = transmittance();
      ctx.clearRect(0, 0, W, H);

      // 大气层
      const atmos = ctx.createLinearGradient(0, topY, 0, groundY);
      atmos.addColorStop(0, `rgba(56,130,246,${0.04 + state.aod * 0.12})`);
      atmos.addColorStop(1, `rgba(56,130,246,${0.10 + state.aod * 0.22})`);
      ctx.fillStyle = atmos; ctx.fillRect(0, topY, W, groundY - topY);
      ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
      ctx.fillText(`大气层（AOD=${state.aod.toFixed(2)}，雾霾${state.aod > 0.6 ? '重' : state.aod > 0.3 ? '中等' : '轻'}）`, 12, topY + 16);

      // 地面
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = `rgba(22,163,74,${state.albedo})`;
      ctx.fillRect(0, groundY, W, 6);
      ctx.fillStyle = '#64748b'; ctx.fillText(`地表（反射率 ρ=${state.albedo.toFixed(2)}）`, 12, groundY + 22);

      // 太阳
      const sunY = topY + 10;
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(sunX, sunY, 16, 0, 7); ctx.fill();
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(sunX, sunY, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.font = '12px sans-serif'; ctx.fillText('太阳', sunX - 12, sunY + 32);

      // 卫星
      ctx.fillStyle = '#5a3ce6'; ctx.fillRect(satX - 12, sunY - 6, 24, 12);
      ctx.fillStyle = '#64748b'; ctx.fillRect(satX - 26, sunY - 3, 10, 6); ctx.fillRect(satX + 16, sunY - 3, 10, 6);
      ctx.fillStyle = '#1e293b'; ctx.fillText('卫星传感器', satX - 30, sunY + 32);

      // 光路
      ctx.strokeStyle = 'rgba(245,158,11,.5)'; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(sunX + 14, sunY + 8); ctx.lineTo(groundPt.x, groundPt.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(90,60,230,.5)';
      ctx.beginPath(); ctx.moveTo(groundPt.x, groundPt.y); ctx.lineTo(satX - 10, sunY + 8); ctx.stroke();
      ctx.setLineDash([]);

      // 天顶角标注
      ctx.strokeStyle = '#64748b'; ctx.beginPath();
      ctx.moveTo(groundPt.x, groundPt.y - 70); ctx.lineTo(groundPt.x, groundPt.y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.fillText(`θz=${state.zenith}°`, groundPt.x + 6, groundPt.y - 60);

      // 光子
      for (const p of photons) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.phase === 'down' ? '#d97706' : '#0891b2';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 能量瀑布条
      const stages = [
        ['太阳入射 E₀·cosθz', 1361 * cz, '#f59e0b'],
        ['穿大气下行 ×τ下', 1361 * cz * tauDown, '#ea580c'],
        ['地表反射 ×ρ', 1361 * cz * tauDown * state.albedo, '#16a34a'],
        ['穿大气上行 ×τ上', E, '#5a3ce6']
      ];
      const bx = W - 240, bw = 150;
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillRect(bx - 10, 42, 240, 4 * 46 + 6);
      ctx.font = '11px sans-serif';
      stages.forEach((s, i) => {
        const y = 60 + i * 46;
        const frac = s[1] / 1361;
        ctx.fillStyle = '#64748b'; ctx.fillText(s[0], bx, y - 4);
        ctx.fillStyle = '#e2e8f0'; ctx.fillRect(bx, y, bw, 14);
        ctx.fillStyle = s[2]; ctx.fillRect(bx, y, bw * Math.min(1, frac), 14);
        ctx.fillStyle = '#1e293b'; ctx.fillText(s[1].toFixed(0) + ' W/m²', bx + bw + 6, y + 11);
      });

      readout.textContent =
        `传感器接收能量 E = E₀·cosθz·τ下·ρ·τ上 = ${E.toFixed(1)} W/m² ｜ 大气总透过 ${(tauDown * tauUp * 100).toFixed(0)}% ｜ ` +
        (state.aod > 0.6 ? '雾霾天信号衰减严重，图像发灰！' : state.aod > 0.3 ? '中等大气条件，需要大气校正。' : '晴朗天气，信号保真度高。');
    }
    return draw;
  }
});
