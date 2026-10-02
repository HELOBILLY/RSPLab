/* 绪论：遥感过程全貌 —— 从太阳辐射到应用服务的完整链条 */
Lab.register({
  id: 'process', group: 'intro', session: '模块1 绪论', icon: '程', title: '遥感过程全貌',
  concept: '遥感是一个系统工程：辐射源→大气传输→地物作用→传感器→数据处理→应用',
  military: '理解全链条才能找准侦察装备的薄弱环节与对抗切入点',
  brief: '能量脉冲沿"太阳→大气→地表→卫星→处理→应用"流动，点击每个环节看它做什么。',
  summary: '遥感过程包含六个环节：①辐射源（太阳或传感器主动发射）提供电磁波能量；②大气传输（吸收、散射造成衰减）；③地物作用（反射、吸收、发射，携带地物信息）；④传感器接收（把辐射转成数字信号）；⑤数据下传与处理（校正、增强、反演）；⑥应用服务（军事侦察、资源调查、灾害监测）。每个环节都会影响最终图像质量。',
  teach: {
    old: '传统课堂：一张静态流程图挂在PPT上，学员扫一眼就过去，六个环节的关系记不住。',
    now: '线上实验室：能量脉冲沿链条流动，点击每个环节展开讲解——整门课的知识地图一次建立。'
  },
  render(stage, panel) {
    const narrow = stage.clientWidth < 720;
    const { ctx, W, H } = Lab.ui.canvas(stage, narrow ? 480 : 380);
    const state = { t: 0, sel: 0 };

    const nodes = [
      { n: '辐射源', icon: '☀', c: '#f59e0b', d: '太阳是被动遥感的主要辐射源（可见光—红外）；雷达则主动发射微波，昼夜皆可工作。' },
      { n: '大气传输', icon: '云', c: '#0284c7', d: '大气吸收与散射使信号衰减：只有"大气窗口"波段的能量能有效穿过。雾霾天图像发灰就是这一步在作怪。' },
      { n: '地物作用', icon: '林', c: '#16a34a', d: '地物对电磁波反射、吸收、透射、发射。不同地物"指纹"不同——这是遥感识别地物的物理基础。' },
      { n: '传感器', icon: '星', c: '#5a3ce6', d: '传感器把接收到的辐射转换为电信号并数字化：摄影型、扫描型、雷达型，各有不同的图像特性。' },
      { n: '数据处理', icon: '算', c: '#7c3aed', d: '卫星数据下传后做辐射校正、几何校正、增强、融合与分类，把"原始信号"变成"可用信息"。' },
      { n: '应用服务', icon: '用', c: '#db2777', d: '军事侦察监视、战场环境保障、资源调查、灾害监测……遥感的价值最终在应用中兑现。' },
    ];

    // 布局：宽屏一行6个，窄屏两行3个
    const cols = narrow ? 3 : 6, rows = narrow ? 2 : 1;
    const cellW = W / cols, nodeY = r => 90 + r * (narrow ? 130 : 0);
    const pos = nodes.map((_, i) => ({
      x: cellW * (i % cols) + cellW / 2,
      y: nodeY(Math.floor(i / cols))
    }));

    Lab.ui.title(panel, '点击环节查看讲解');
    nodes.forEach((nd, i) => Lab.ui.button(panel, `${i + 1}.${nd.n}`, () => { state.sel = i; },
      { group: 'nd', active: i === 0 }));
    const readout = Lab.ui.readout(panel);
    readout.textContent = nodes[0].d;

    ctx.canvas.addEventListener('click', e => {
      const r = ctx.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
      const hit = pos.findIndex(p => Math.hypot(x - p.x, y - p.y) < 34);
      if (hit >= 0) {
        state.sel = hit;
        readout.textContent = nodes[hit].d;
        panel.querySelectorAll('button[data-group="nd"]').forEach((b, i) => b.classList.toggle('on', i === hit));
      }
    });

    function draw() {
      state.t++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('遥感过程：一次成像的完整旅程', 16, 26);

      // 连线
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
      ctx.beginPath();
      pos.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke(); ctx.lineWidth = 1;

      // 流动脉冲
      const speed = 0.004;
      for (let k = 0; k < 3; k++) {
        const f = ((state.t * speed) + k / 3) % 1;
        const segF = f * (pos.length - 1);
        const si = Math.min(pos.length - 2, Math.floor(segF));
        const sf = segF - si;
        const x = pos[si].x + (pos[si + 1].x - pos[si].x) * sf;
        const y = pos[si].y + (pos[si + 1].y - pos[si].y) * sf;
        const c = nodes[si].c;
        ctx.fillStyle = c; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 节点
      pos.forEach((p, i) => {
        const nd = nodes[i];
        const on = state.sel === i;
        ctx.fillStyle = on ? nd.c : '#f1f5f9';
        ctx.strokeStyle = nd.c; ctx.lineWidth = on ? 3 : 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 28, 0, 7); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = on ? '#0b1020' : nd.c;
        ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(nd.icon, p.x, p.y + 5);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = on ? nd.c : '#64748b';
        ctx.fillText(`${i + 1}. ${nd.n}`, p.x, p.y + 48);
        ctx.textAlign = 'left';
      });

      // 选中环节说明卡
      const nd = nodes[state.sel];
      const cy = narrow ? H - 120 : H - 110;
      ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = nd.c;
      ctx.beginPath(); ctx.roundRect(16, cy, W - 32, 92, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = nd.c; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`环节 ${state.sel + 1}｜${nd.n}`, 32, cy + 26);
      ctx.fillStyle = '#475569'; ctx.font = '12.5px sans-serif';
      // 手动换行
      let line = '', yy = cy + 48;
      for (const ch of nd.d) {
        if (ctx.measureText(line + ch).width > W - 80) { ctx.fillText(line, 32, yy); line = ch; yy += 18; }
        else line += ch;
      }
      ctx.fillText(line, 32, yy);
    }
    return draw;
  }
});
