/* 课程知识图谱 —— Canvas 图谱可视化：知识链布局、因果链路边、资源挂接、专业学习路径 */
(function () {
  const GraphPage = {};
  window.GraphPage = GraphPage;

  const STAGE_COLOR = {
    overview: '#94a3b8', signal: '#5a3ce6', data: '#059669', info: '#f59e0b', decision: '#dc2626'
  };

  function demoTitle(id) { const d = Lab.byId(id); return d ? d.title : id; }
  function codingTitle(id) { const t = (window.CODING || []).find(t => t.id === id); return t ? t.title : id; }

  GraphPage.render = function () {
    const G = window.GRAPH;
    const el = document.getElementById('app');
    el.innerHTML = `
      <section class="hero">
        <h1>课程知识图谱 · 让知识点挂在图上</h1>
        <p>学前没有系统认识、知识点碎片化记忆，是本课程的一大痛点。本图谱按"信号—数据—信息—决策"知识链
        组织全课程 6 个模块 15 次理论课，箭头标明概念间的逻辑关系与因果链条；点击任意课次节点，
        即可查看该课次的知识点与配套的概念演示、上机实验。还可按专业学习路径分强相关、中相关、弱相关
        三级高亮，实现模块化、有侧重的自主学习。</p>
        <div class="stat-row">
          <div class="stat"><b>15</b><span>个课次节点</span></div>
          <div class="stat"><b>45</b><span>个知识点圆点</span></div>
          <div class="stat"><b>6</b><span>条专业学习路径</span></div>
          <div class="stat"><b>30+</b><span>个挂接资源</span></div>
        </div>
      </section>
      <div class="graph-box">
        <div class="graph-toolbar" id="gtoolbar"></div>
        <div class="stage graph-stage" id="gstage"></div>
        <div class="graph-detail" id="gdetail">
          <p class="muted">点击图谱中的课次节点，查看知识点与配套资源；点击上方按钮切换专业学习路径（强相关高亮、中相关半亮、弱相关变暗）。</p>
        </div>
      </div>
      <div class="graph-box kp-box">
        <h2 class="kp-title">知识点串联图谱<small>6 个模块各成一环 · 45 个知识点圆形节点相连 · 环间箭头与跨章弧线标明关联 · 随专业路径同步分级高亮</small></h2>
        <div class="kp-scroll"><div class="stage kp-stage" id="kpstage"></div></div>
        <div class="graph-detail" id="kdetail">
          <p class="muted">每个模块（章）一个圆环，环内圆点为该章知识点，环间箭头为章节推进关系，跨环弧线为跨章依赖；点击知识点圆点，查看释义、所属课次与配套资源。</p>
        </div>
      </div>
      <div class="teach-box">
        <div class="col old"><h4>没有图谱的学习</h4>
          <p>知识点零散记背，能背名词却说不清概念间的逻辑关系；考完就忘，后续高阶专业课时前置知识模糊，需要重复讲授。</p></div>
        <div class="col now"><h4>有图谱的学习</h4>
          <p>开学第一课先看全课程地图，每次课在图谱中定位当前知识点、看清来龙去脉；课后沿图谱挂接的资源自主探究，知识框架在头脑中自然生长。</p></div>
      </div>`;

    /* ---------- 布局计算 ---------- */
    const stage = el.querySelector('#gstage');
    const { canvas, ctx, W, H } = Lab.ui.canvas(stage, 600);
    const cols = G.stages.length;
    const padX = 14, headH = 46;
    const colW = (W - padX * 2) / cols;
    const nodeH = 62;

    const colNodes = {};
    G.stages.forEach(s => { colNodes[s.key] = G.nodes.filter(n => n.stage === s.key); });

    const pos = {};  // id -> {x, y, w, h, node}
    G.stages.forEach((s, ci) => {
      const list = colNodes[s.key];
      const gap = (H - headH - list.length * nodeH) / (list.length + 1);
      list.forEach((n, i) => {
        pos[n.id] = {
          x: padX + ci * colW + 6,
          y: headH + gap + i * (nodeH + gap),
          w: colW - 12, h: nodeH, node: n
        };
      });
    });

    let selected = null;
    let majorKey = 'all';
    const relLevel = id => {
      const mj = G.majors.find(m => m.key === majorKey);
      if (!mj || !mj.rel) return 3;
      return mj.rel[id] || 1;
    };
    const NODE_ALPHA = { 3: 1, 2: 0.55, 1: 0.16 };
    const EDGE_ALPHA = { 3: 0.75, 2: 0.38, 1: 0.07 };

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 列标题
      G.stages.forEach((s, ci) => {
        const cx = padX + ci * colW + colW / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = STAGE_COLOR[s.key];
        ctx.font = '700 15px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(s.name, cx, 20);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(s.desc, cx, 37);
        if (ci < cols - 1) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px sans-serif';
          ctx.fillText('→', padX + (ci + 1) * colW, 22);
        }
      });
      // 边
      G.edges.forEach(([a, b]) => {
        const pa = pos[a], pb = pos[b];
        const lv = Math.min(relLevel(a), relLevel(b));
        const col = STAGE_COLOR[pa.node.stage];
        ctx.globalAlpha = EDGE_ALPHA[lv];
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6;
        const sameCol = pa.node.stage === pb.node.stage;
        ctx.beginPath();
        if (sameCol) {
          const x = pa.x + pa.w / 2;
          const y1 = Math.min(pa.y, pb.y) + nodeH, y2 = Math.max(pa.y, pb.y);
          ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 4, y2 - 7); ctx.lineTo(x + 4, y2 - 7); ctx.closePath(); ctx.fill();
        } else {
          const x1 = pa.x + pa.w, y1 = pa.y + pa.h / 2;
          const x2 = pb.x, y2 = pb.y + pb.h / 2;
          const mx = (x1 + x2) / 2;
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 7, y2 - 4); ctx.lineTo(x2 - 7, y2 + 4); ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // 节点
      Object.values(pos).forEach(p => {
        const n = p.node;
        const col = STAGE_COLOR[n.stage];
        ctx.globalAlpha = NODE_ALPHA[relLevel(n.id)];
        roundRect(p.x, p.y, p.w, p.h, 10);
        ctx.fillStyle = selected === n.id ? 'rgba(90,60,230,.16)' : '#f1f5f9';
        ctx.fill();
        ctx.lineWidth = selected === n.id ? 2.4 : 1.4;
        ctx.strokeStyle = col; ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '10.5px sans-serif';
        ctx.fillText(n.session, p.x + p.w / 2, p.y + 18);
        ctx.fillStyle = '#1e293b';
        ctx.font = '700 13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(n.title, p.x + p.w / 2, p.y + 40);
        ctx.globalAlpha = 1;
      });
    }

    /* ---------- 交互 ---------- */
    canvas.addEventListener('click', ev => {
      const r = canvas.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      const hit = Object.values(pos).find(p =>
        x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
      if (hit) {
        selected = hit.node.id;
        draw();
        drawKp();
        showDetail(hit.node);
      }
    });
    canvas.addEventListener('mousemove', ev => {
      const r = canvas.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      canvas.style.cursor = Object.values(pos).some(p =>
        x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) ? 'pointer' : 'default';
    });

    function linkChip(href, label, cls) {
      return `<a class="res-chip ${cls}" href="${href}">${label}</a>`;
    }

    function showDetail(n) {
      const s = G.stages.find(s => s.key === n.stage);
      const d = el.querySelector('#gdetail');
      d.innerHTML = `
        <div class="gd-head">
          <h3>${n.session} · ${n.title}</h3>
          <span class="tag" style="color:${STAGE_COLOR[n.stage]};border-color:${STAGE_COLOR[n.stage]}55">${s.name}环节</span>
        </div>
        <div class="gd-kp">${n.kp.map(k => `<span class="tag">${k}</span>`).join('')}</div>
        <div class="gd-res">
          ${n.demos.length ? `<div class="gd-row"><b>概念演示</b>${n.demos.map(id => linkChip('#/demo/' + id, demoTitle(id), 'd')).join('')}</div>` : ''}
          ${n.coding.length ? `<div class="gd-row"><b>上机实验</b>${n.coding.map(id => linkChip('#/coding/' + id, codingTitle(id), 'c')).join('')}</div>` : ''}
        </div>`;
    }

    /* ---------- 专业路径切换 ---------- */
    const tb = el.querySelector('#gtoolbar');
    const lab = document.createElement('span');
    lab.className = 'ctl-label';
    lab.textContent = '专业路径';
    lab.style.width = 'auto';
    tb.appendChild(lab);
    G.majors.forEach(mj => {
      const b = document.createElement('button');
      b.textContent = mj.name;
      if (mj.key === 'all') b.classList.add('on');
      b.addEventListener('click', () => {
        majorKey = mj.key;
        tb.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        draw();
        drawKp();
        const d = el.querySelector('#gdetail');
        d.innerHTML = `<p class="muted">${mj.desc}</p>`;
      });
      tb.appendChild(b);
    });
    const leg = document.createElement('span');
    leg.className = 'lvl-legend';
    leg.innerHTML = '<span class="lvl-legend-t">相关度</span>' +
      [['强相关', 1], ['中相关', 0.55], ['弱相关', 0.16]]
        .map(([t, o]) => `<span class="lvl-item"><i style="opacity:${o}"></i>${t}</span>`).join('');
    tb.appendChild(leg);

    /* ---------- 知识点串联图谱（每章一个圆环，环间关联） ---------- */
    const kStage = el.querySelector('#kpstage');
    const { canvas: kc, ctx: kx, W: KW, H: KH } = Lab.ui.canvas(kStage, 760);
    const KP = G.kpoints, KL = G.klinks;
    const nodeById = {};
    G.nodes.forEach(n => { nodeById[n.id] = n; });
    const MOD_INFO = [null,
      { name: '模块1', sub: '绪论', count: '1次课', col: STAGE_COLOR.overview },
      { name: '模块2', sub: '电磁辐射', count: '3次课', col: STAGE_COLOR.signal },
      { name: '模块3', sub: '遥感平台', count: '2次课', col: STAGE_COLOR.data },
      { name: '模块4', sub: '传感器', count: '4次课', col: STAGE_COLOR.data },
      { name: '模块5', sub: '处理与分析', count: '4次课', col: STAGE_COLOR.info },
      { name: '模块6', sub: '应用前沿', count: '1次课', col: STAGE_COLOR.decision }
    ];
    const kcx = KW / 2, kcy = KH / 2;
    const RX = Math.min((KW - 300) / 2, 430), RY = 200;
    const KR = KW < 1000 ? 19 : 23;

    /* 6 个模块圆环：绕中心六边形排布，每章一个圆 */
    const modGroups = [];
    KP.forEach(k => { (modGroups[k.mod] = modGroups[k.mod] || []).push(k); });
    const HEX_A = [-90, -30, 30, 90, 150, 210];  // 自顶部起顺时针
    const modC = {};
    for (let m = 1; m <= 6; m++) {
      const a = HEX_A[m - 1] * Math.PI / 180;
      const n = modGroups[m].length;
      modC[m] = {
        x: kcx + RX * Math.cos(a),
        y: kcy + RY * Math.sin(a),
        r: Math.max(56, Math.ceil(n * 54 / (2 * Math.PI)))
      };
    }
    /* 知识点在各自模块圆环上等角分布（自顶部起顺时针，同课次相邻） */
    const kpos = {};
    for (let m = 1; m <= 6; m++) {
      const c = modC[m], list = modGroups[m], n = list.length;
      list.forEach((k, i) => {
        const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
        kpos[k.id] = { x: c.x + c.r * Math.cos(a), y: c.y + c.r * Math.sin(a), kp: k };
      });
    }

    let selectedKp = null;

    function wrapName(name) {
      if (name.includes(' ')) return name.split(' ');
      if (name.length <= 4) return [name];
      const m = name.match(/^([A-Za-z-]+)(.+)$/);
      if (m) return [m[1], m[2]];
      return [name.slice(0, 4), name.slice(4, 8)];
    }

    /* 模块环之间的关联箭头（向外微弯，带箭头） */
    function ringArrow(c1, c2) {
      const dx = c2.x - c1.x, dy = c2.y - c1.y, dd = Math.hypot(dx, dy) || 1;
      const ux = dx / dd, uy = dy / dd;
      const x1 = c1.x + ux * (c1.r + KR + 5), y1 = c1.y + uy * (c1.r + KR + 5);
      const x2 = c2.x - ux * (c2.r + KR + 13), y2 = c2.y - uy * (c2.r + KR + 13);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const ox = mx - kcx, oy = my - kcy, od = Math.hypot(ox, oy) || 1;
      const cxp = mx + ox / od * 26, cyp = my + oy / od * 26;
      kx.globalAlpha = 0.75;
      kx.strokeStyle = '#64748b'; kx.fillStyle = '#64748b'; kx.lineWidth = 2.4;
      kx.beginPath(); kx.moveTo(x1, y1); kx.quadraticCurveTo(cxp, cyp, x2, y2); kx.stroke();
      const t = Math.atan2(y2 - cyp, x2 - cxp);
      kx.beginPath(); kx.moveTo(x2, y2);
      kx.lineTo(x2 - 11 * Math.cos(t - 0.42), y2 - 11 * Math.sin(t - 0.42));
      kx.lineTo(x2 - 11 * Math.cos(t + 0.42), y2 - 11 * Math.sin(t + 0.42));
      kx.closePath(); kx.fill();
      kx.globalAlpha = 1;
    }

    function drawKp() {
      kx.clearRect(0, 0, KW, KH);
      /* 模块圆环与中心标签 */
      for (let m = 1; m <= 6; m++) {
        const c = modC[m];
        kx.globalAlpha = 0.32;
        kx.strokeStyle = MOD_INFO[m].col; kx.lineWidth = 3;
        kx.beginPath(); kx.arc(c.x, c.y, c.r, 0, 2 * Math.PI); kx.stroke();
        kx.globalAlpha = 1;
        kx.textAlign = 'center';
        kx.fillStyle = MOD_INFO[m].col;
        kx.font = '700 13px "PingFang SC", "Microsoft YaHei", sans-serif';
        kx.fillText(MOD_INFO[m].name, c.x, c.y - 13);
        kx.fillStyle = '#475569'; kx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
        kx.fillText(MOD_INFO[m].sub, c.x, c.y + 3);
        kx.fillStyle = '#64748b'; kx.font = '10px sans-serif';
        kx.fillText(MOD_INFO[m].count, c.x, c.y + 18);
      }
      /* 模块环关联箭头：1→2→3→4→5→6 */
      for (let m = 1; m <= 5; m++) ringArrow(modC[m], modC[m + 1]);
      const lvOf = k => relLevel(k.node);
      const dim = k => (selected && k.node !== selected) ? 0.45 : 1;
      /* 跨章知识点连线（弧线偏向圆心） */
      KL.forEach(([a, b]) => {
        const pa = kpos[a], pb = kpos[b];
        const lv = Math.min(lvOf(pa.kp), lvOf(pb.kp));
        kx.globalAlpha = EDGE_ALPHA[lv] * 0.85 * dim(pa.kp) * dim(pb.kp);
        kx.strokeStyle = STAGE_COLOR[nodeById[pa.kp.node].stage];
        kx.lineWidth = 1.5;
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        kx.beginPath(); kx.moveTo(pa.x, pa.y);
        kx.quadraticCurveTo(mx + (kcx - mx) * 0.45, my + (kcy - my) * 0.45, pb.x, pb.y);
        kx.stroke();
        kx.globalAlpha = 1;
      });
      /* 课次内链条（同课次相邻知识点直连） */
      for (let i = 0; i < KP.length - 1; i++) {
        const a = KP[i], b = KP[i + 1];
        if (a.node !== b.node) continue;
        const pa = kpos[a.id], pb = kpos[b.id];
        const lv = Math.min(lvOf(a), lvOf(b));
        kx.globalAlpha = EDGE_ALPHA[lv] * dim(a) * dim(b);
        kx.strokeStyle = STAGE_COLOR[nodeById[a.node].stage];
        kx.lineWidth = 1.8;
        kx.beginPath(); kx.moveTo(pa.x, pa.y); kx.lineTo(pb.x, pb.y); kx.stroke();
        kx.globalAlpha = 1;
      }
      /* 知识点圆节点 */
      KP.forEach(k => {
        const p = kpos[k.id];
        const col = STAGE_COLOR[nodeById[k.node].stage];
        kx.globalAlpha = NODE_ALPHA[lvOf(k)] * dim(k);
        kx.beginPath(); kx.arc(p.x, p.y, KR, 0, 2 * Math.PI);
        kx.fillStyle = selectedKp === k.id ? 'rgba(90,60,230,.22)' : '#f1f5f9';
        kx.fill();
        kx.lineWidth = selectedKp === k.id ? 2.6 : 1.5;
        kx.strokeStyle = selectedKp === k.id ? '#5a3ce6' : col;
        kx.stroke();
        const lines = wrapName(k.name);
        const fs = (KW < 1000 ? 9 : 10) - (lines.some(l => l.length >= 5) ? 1 : 0);
        kx.fillStyle = '#1e293b';
        kx.font = fs + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
        kx.textAlign = 'center'; kx.textBaseline = 'middle';
        if (lines.length === 1) kx.fillText(lines[0], p.x, p.y);
        else { kx.fillText(lines[0], p.x, p.y - 6); kx.fillText(lines[1], p.x, p.y + 6); }
        kx.textBaseline = 'alphabetic';
        kx.globalAlpha = 1;
        if (selected && k.node === selected) {
          kx.beginPath(); kx.arc(p.x, p.y, KR + 4, 0, 2 * Math.PI);
          kx.strokeStyle = 'rgba(90,60,230,.55)'; kx.lineWidth = 1.6; kx.stroke();
        }
      });
    }

    function kpAt(x, y) {
      return KP.find(k => {
        const p = kpos[k.id];
        return Math.hypot(x - p.x, y - p.y) <= KR + 3;
      });
    }
    kc.addEventListener('click', ev => {
      const r = kc.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (KW / r.width);
      const y = (ev.clientY - r.top) * (KH / r.height);
      const k = kpAt(x, y);
      if (k) { selectedKp = k.id; drawKp(); showKpDetail(k); }
    });
    kc.addEventListener('mousemove', ev => {
      const r = kc.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (KW / r.width);
      const y = (ev.clientY - r.top) * (KH / r.height);
      kc.style.cursor = kpAt(x, y) ? 'pointer' : 'default';
    });

    function showKpDetail(k) {
      const n = nodeById[k.node];
      const s = G.stages.find(s => s.key === n.stage);
      el.querySelector('#kdetail').innerHTML = `
        <div class="gd-head">
          <h3>${k.name.replace(' ', '')}</h3>
          <span class="tag" style="color:${STAGE_COLOR[n.stage]};border-color:${STAGE_COLOR[n.stage]}55">${s.name}环节</span>
          <span class="tag">${n.session} · ${n.title}</span>
        </div>
        <p class="muted" style="margin:6px 0 0">${k.hint}</p>
        <div class="gd-res">
          ${n.demos.length ? `<div class="gd-row"><b>概念演示</b>${n.demos.map(id => linkChip('#/demo/' + id, demoTitle(id), 'd')).join('')}</div>` : ''}
          ${n.coding.length ? `<div class="gd-row"><b>上机实验</b>${n.coding.map(id => linkChip('#/coding/' + id, codingTitle(id), 'c')).join('')}</div>` : ''}
        </div>`;
    }

    draw();
    drawKp();
  };
})();

/* 增强版知识图谱：在不改变既有脚本加载顺序的前提下覆盖 GraphPage.render。
 * 原实现保留为兼容回退；增强版继续使用相同的 GRAPH、Lab 和页面样式约定。 */
(function () {
  const EnhancedGraphPage = {};
  window.GraphPage = EnhancedGraphPage;

  const STAGE_COLOR = {
    overview: '#94a3b8', signal: '#5a3ce6', data: '#059669', info: '#f59e0b', decision: '#dc2626'
  };
  const RELATION_STYLE = {
    prerequisite: { color: '#475569', dash: [], name: '前序依赖' },
    parallel: { color: '#0f766e', dash: [7, 5], name: '并行支撑' },
    comparison: { color: '#7c3aed', dash: [], name: '对比关系', both: true },
    iterative: { color: '#d97706', dash: [], name: '循环迭代', curve: true },
    feedback: { color: '#dc2626', dash: [9, 4, 2, 4], name: '跨阶段反馈', curve: true }
  };
  const LEARNING_STATUS = {
    unstarted: { name: '未学习', fill: '#f1f5f9', color: '#64748b' },
    learning: { name: '学习中', fill: '#dbeafe', color: '#2563eb' },
    mastered: { name: '已掌握', fill: '#dcfce7', color: '#059669' },
    review: { name: '需要复习', fill: '#ffedd5', color: '#d97706' }
  };
  const STORAGE_KEY = 'rs-pocket-lab.graph.learning.v1';

  function demoTitle(id) {
    const d = Lab.byId(id);
    return d ? d.title : id;
  }

  function codingTitle(id) {
    const t = (window.CODING || []).find(item => item.id === id);
    return t ? t.title : id;
  }

  function ensureStyles() {
    if (document.getElementById('graph-enhanced-style')) return;
    const style = document.createElement('style');
    style.id = 'graph-enhanced-style';
    style.textContent = [
      '.graph-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}',
      '.graph-scroll .graph-stage{min-width:860px;}',
      '.kp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}',
      '.kp-scroll .kp-stage{min-width:1180px;position:relative;overflow:hidden;}',
      '.kp-stage canvas{touch-action:none;cursor:grab;}',
      '.kp-stage canvas.dragging{cursor:grabbing;}',
      '.graph-major-summary{margin:-2px 0 12px;padding:10px 12px;border-left:3px solid var(--accent);background:var(--bg-soft);color:var(--muted);font-size:13px;}',
      '.graph-major-summary b{color:var(--text);}.graph-major-summary .focus-list{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;}',
      '.graph-control-block{border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:12px;background:var(--bg-soft);}',
      '.graph-control-row{display:flex;align-items:flex-start;gap:10px;margin:7px 0;}',
      '.graph-control-label{width:68px;flex:none;padding-top:6px;color:var(--muted);font-size:12.5px;font-weight:700;}',
      '.graph-control-buttons{display:flex;gap:7px;flex-wrap:wrap;min-width:0;}',
      '.graph-control-buttons button{padding:5px 11px;}',
      '.view-trail{margin:8px 0 10px 78px;color:var(--muted);font-size:12.5px;line-height:1.8;}',
      '.view-trail .trail-step{display:inline-block;padding:1px 7px;border:1px solid rgba(90,60,230,.28);border-radius:999px;background:#fff;color:var(--accent-deep);}',
      '.view-trail .trail-arrow{margin:0 5px;color:#94a3b8;}',
      '.relation-legend{display:flex;gap:12px;flex-wrap:wrap;margin:9px 0 2px 78px;color:var(--muted);font-size:12px;}',
      '.relation-legend span{display:inline-flex;align-items:center;gap:6px;}',
      '.node-legend{display:flex;gap:13px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:12px;}',
      '.node-legend-item{display:inline-flex;align-items:center;gap:6px;}',
      '.node-dot{display:inline-block;border-radius:50%;background:#6d4aff;border:2px solid #fff;box-shadow:0 0 0 1px #6d4aff;}',
      '.node-dot.core{width:22px;height:22px}.node-dot.general{width:16px;height:16px}.node-dot.extension{width:11px;height:11px}',
      '.ring-sample{width:28px;height:18px;border:3px solid #1677c8;border-radius:50%;display:inline-block;background:transparent;}',
      '.marker-sample{width:15px;height:15px;border-radius:50%;display:inline-block;background:#fff;border:3px solid #059669;}',
      '.cross-sample{width:9px;height:9px;display:inline-block;background:#7c3aed;transform:rotate(45deg);}',
      '.resource-sample{width:9px;height:9px;display:inline-block;background:#fff;border:2px solid #334155;border-radius:2px;}',
      '.relation-line{position:relative;width:28px;height:8px;display:inline-block;color:#475569;}',
      '.relation-line:before{content:"";position:absolute;left:0;right:5px;top:3px;border-top:2px solid currentColor;}',
      '.relation-line:after{content:"";position:absolute;right:0;top:0;border-left:6px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;}',
      '.relation-line.parallel{color:#0f766e}.relation-line.parallel:before{border-top-style:dashed;}',
      '.relation-line.comparison{color:#7c3aed}.relation-line.comparison:before{border-top:3px double currentColor}.relation-line.comparison:after{content:"↔";border:0;top:-7px;right:-1px;font-size:16px;}',
      '.relation-line.iterative{color:#d97706}.relation-line.iterative:before{content:"↻";border:0;top:-10px;left:6px;font-size:18px;}',
      '.relation-line.iterative:after{display:none;}',
      '.relation-line.feedback{color:#dc2626}.relation-line.feedback:before{border:0;height:2px;top:3px;background:repeating-linear-gradient(90deg,currentColor 0 8px,transparent 8px 12px,currentColor 12px 14px,transparent 14px 18px);}',
      '.learning-panel{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);}',
      '.learning-progress-text{font-size:12.5px;color:var(--muted);min-width:150px;}',
      '.learning-progress-track{height:8px;flex:1;min-width:140px;max-width:300px;border-radius:999px;background:#e2e8f0;overflow:hidden;}',
      '.learning-progress-track i{display:block;height:100%;background:#059669;border-radius:999px;}',
      '.status-legend{display:flex;gap:9px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);}',
      '.status-legend span{display:inline-flex;align-items:center;gap:4px}.status-legend i{width:10px;height:10px;border-radius:50%;border:1px solid rgba(15,23,42,.15);}',
      '.kp-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 18px;margin-top:10px;}',
      '.kp-detail-item{font-size:13.5px;color:var(--muted);}.kp-detail-item b{display:block;color:var(--text);font-size:12px;margin-bottom:2px;}',
      '.kp-status-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:12px 0 5px;padding-top:10px;border-top:1px solid var(--line);}',
      '.kp-status-row>span{font-size:12.5px;font-weight:700;color:var(--muted);margin-right:2px;}',
      '.status-btn{padding:4px 9px;font-size:12px}.status-btn.on{box-shadow:0 0 0 1px currentColor;}',
      '.detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;}',
      '.related-kp{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--text);padding:3px 10px;font-size:12.5px;cursor:pointer;}',
      '.related-kp:hover{border-color:var(--accent);color:var(--accent);}',
      '.viewport-toolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;}',
      '.viewport-toolbar output{min-width:48px;color:var(--muted);font-size:12px;text-align:center;}',
      '.kp-tooltip{position:fixed;z-index:200;display:none;pointer-events:none;max-width:260px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.97);box-shadow:0 8px 24px rgba(15,23,42,.12);font-size:12px;color:var(--muted);}',
      '.kp-tooltip b{display:block;color:var(--text);font-size:13px;margin-bottom:2px;}',
      '@media(max-width:700px){',
      '.graph-control-row{display:block}.graph-control-label{display:block;width:auto;padding:0;margin-bottom:6px}.view-trail,.relation-legend{margin-left:0}.kp-detail-grid{grid-template-columns:1fr}.lvl-legend{width:100%;margin-left:0}.kp-title small{display:block;margin:5px 0 0}.graph-major-summary{font-size:12.5px}.node-legend{gap:9px}.kp-scroll .kp-stage{min-width:1080px}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  EnhancedGraphPage.render = function () {
    const G = window.GRAPH;
    const el = document.getElementById('app');
    ensureStyles();

    el.innerHTML = [
      '<section class="hero">',
      '<h1>课程知识图谱 · 让知识点挂在图上</h1>',
      '<p>按“信号—数据—信息—决策”主线组织全课程 6 个模块 15 次理论课；课次、知识点、五类关系、专业路径与实验资源彼此联动，帮助学习者看清知识的来龙去脉并记录学习进度。</p>',
      '<div class="stat-row">',
      '<div class="stat"><b>' + G.nodes.length + '</b><span>个课次节点</span></div>',
      '<div class="stat"><b>' + G.kpoints.length + '</b><span>个知识点圆点</span></div>',
      '<div class="stat"><b>5</b><span>类知识关系</span></div>',
      '<div class="stat"><b>6</b><span>条专业学习路径</span></div>',
      '</div></section>',
      '<div class="graph-box">',
      '<div class="graph-toolbar" id="gtoolbar"></div>',
      '<div class="graph-major-summary" id="major-summary"></div>',
      '<div class="graph-scroll"><div class="stage graph-stage" id="gstage"></div></div>',
      '<div class="graph-detail" id="gdetail"><p class="muted">点击课次节点查看知识点与资源；专业路径会同步调整上下两层图谱的相关度和重点知识。</p></div>',
      '</div>',
      '<div class="graph-box kp-box">',
      '<h2 class="kp-title">知识点串联图谱<small>点击节点查看关联知识与学习状态</small></h2>',
      '<div class="graph-control-block">',
      '<div class="graph-control-row"><span class="graph-control-label">图谱视图</span><div class="graph-control-buttons" id="view-toolbar"></div></div>',
      '<div class="view-trail" id="view-trail"></div>',
      '<div class="graph-control-row"><span class="graph-control-label">节点图例</span><div class="node-legend" id="node-legend"></div></div>',
      '<div class="graph-control-row"><span class="graph-control-label">关系筛选</span><div class="graph-control-buttons" id="relation-toolbar"></div></div>',
      '<div class="relation-legend" id="relation-legend"></div>',
      '<div class="graph-control-row"><span class="graph-control-label">画布操作</span><div class="viewport-toolbar" id="viewport-toolbar"><button type="button" data-zoom="out">缩小</button><button type="button" data-zoom="in">放大</button><button type="button" data-zoom="reset">重置视图</button><output id="zoom-value">100%</output></div></div>',
      '<div class="learning-panel" id="learning-progress"></div>',
      '</div>',
      '<div class="kp-scroll"><div class="stage kp-stage" id="kpstage"></div></div><div class="kp-tooltip" id="kp-tooltip"></div>',
      '<div class="graph-detail" id="kdetail"><p class="muted">点击知识点后，高亮当前节点与关联节点，并查看定义、前置知识、能力、场景和实验资源。</p></div>',
      '</div>',
      '<div class="teach-box">',
      '<div class="col old"><h4>没有图谱的学习</h4><p>知识点零散记背，能背名词却说不清概念之间的逻辑关系；后续任务需要反复补学前置知识。</p></div>',
      '<div class="col now"><h4>有图谱的学习</h4><p>沿课程主线定位知识，在五类关系中理解依赖、支撑、对比、迭代和反馈，再通过实验资源验证概念。</p></div>',
      '</div>'
    ].join('');

    const nodeById = {};
    const kpById = {};
    G.nodes.forEach(n => { nodeById[n.id] = n; });
    G.kpoints.forEach(k => { kpById[k.id] = k; });

    let selectedCourse = null;
    let selectedKp = null;
    let majorKey = 'all';
    let relationFilter = 'all';
    let viewKey = 'panorama';
    const learning = loadLearning();

    function loadLearning() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const clean = {};
        Object.keys(raw).forEach(id => {
          if (kpById[id] && LEARNING_STATUS[raw[id]]) clean[id] = raw[id];
        });
        return clean;
      } catch (err) {
        return {};
      }
    }

    function saveLearning() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(learning));
      } catch (err) {
        /* file:// 或隐私模式可能禁用存储；界面仍在当前会话内工作。 */
      }
    }

    function statusOf(id) {
      return learning[id] || 'unstarted';
    }

    function currentMajor() {
      return G.majors.find(m => m.key === majorKey) || G.majors[0];
    }

    function relLevel(id) {
      const mj = currentMajor();
      if (!mj || !mj.rel) return 3;
      return mj.rel[id] || 1;
    }

    function majorFocusSet() {
      const item = (G.majorHighlights || {})[majorKey];
      return new Set(item ? item.focus : []);
    }

    function activeView() {
      return (G.views || []).find(v => v.key === viewKey) ||
        { key: 'panorama', name: '知识全景', desc: '', steps: [] };
    }

    function viewFocusSet() {
      const ids = [];
      activeView().steps.forEach(step => step.ids.forEach(id => ids.push(id)));
      return new Set(ids);
    }

    function viewStepMap() {
      const map = {};
      activeView().steps.forEach((step, index) => {
        step.ids.forEach(id => { map[id] = index + 1; });
      });
      return map;
    }

    function visibleLinks() {
      return G.klinks.filter(link => relationFilter === 'all' || link.type === relationFilter);
    }

    function linkedSet(id) {
      const set = new Set([id]);
      visibleLinks().forEach(link => {
        if (link.source === id) set.add(link.target);
        if (link.target === id) set.add(link.source);
      });
      return set;
    }

    function linkChip(href, label, cls) {
      return '<a class="res-chip ' + cls + '" href="' + href + '">' + label + '</a>';
    }

    function resourceHtml(n) {
      const rows = [];
      if (n.demos.length) {
        rows.push('<div class="gd-row"><b>概念演示</b>' +
          n.demos.map(id => linkChip('#/demo/' + id, demoTitle(id), 'd')).join('') + '</div>');
      }
      if (n.coding.length) {
        rows.push('<div class="gd-row"><b>上机实验</b>' +
          n.coding.map(id => linkChip('#/coding/' + id, codingTitle(id), 'c')).join('') + '</div>');
      }
      if (!rows.length) {
        rows.push('<div class="gd-row"><b>实验资源</b><span class="muted">本知识点暂无独立实验，可沿所属课次继续学习。</span></div>');
      }
      return rows.join('');
    }

    function drawArrowHead(context, x, y, angle, color, size) {
      context.save();
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - size * Math.cos(angle - 0.43), y - size * Math.sin(angle - 0.43));
      context.lineTo(x - size * Math.cos(angle + 0.43), y - size * Math.sin(angle + 0.43));
      context.closePath();
      context.fill();
      context.restore();
    }

    /* ---------- 课次主线图 ---------- */
    const courseStage = el.querySelector('#gstage');
    const courseCanvasKit = Lab.ui.canvas(courseStage, 600);
    const canvas = courseCanvasKit.canvas;
    const ctx = courseCanvasKit.ctx;
    const W = courseCanvasKit.W;
    const H = courseCanvasKit.H;
    const cols = G.stages.length;
    const padX = 14;
    const headH = 46;
    const colW = (W - padX * 2) / cols;
    const nodeH = 62;
    const NODE_ALPHA = { 3: 1, 2: 0.55, 1: 0.16 };
    const EDGE_ALPHA = { 3: 0.75, 2: 0.38, 1: 0.07 };
    const colNodes = {};
    const coursePos = {};

    G.stages.forEach(s => { colNodes[s.key] = G.nodes.filter(n => n.stage === s.key); });
    G.stages.forEach((s, ci) => {
      const list = colNodes[s.key];
      const gap = (H - headH - list.length * nodeH) / (list.length + 1);
      list.forEach((n, i) => {
        coursePos[n.id] = {
          x: padX + ci * colW + 6,
          y: headH + gap + i * (nodeH + gap),
          w: colW - 12,
          h: nodeH,
          node: n
        };
      });
    });

    function roundRect(context, x, y, w, h, r) {
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    }

    function drawCourse() {
      ctx.clearRect(0, 0, W, H);
      G.stages.forEach((s, ci) => {
        const cx = padX + ci * colW + colW / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = STAGE_COLOR[s.key];
        ctx.font = '700 15px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(s.name, cx, 20);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(s.desc, cx, 37);
        if (ci < cols - 1) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px sans-serif';
          ctx.fillText('→', padX + (ci + 1) * colW, 22);
        }
      });

      G.edges.forEach(pair => {
        const pa = coursePos[pair[0]];
        const pb = coursePos[pair[1]];
        const lv = Math.min(relLevel(pair[0]), relLevel(pair[1]));
        const col = STAGE_COLOR[pa.node.stage];
        ctx.globalAlpha = EDGE_ALPHA[lv];
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = 1.6;
        const sameCol = pa.node.stage === pb.node.stage;
        ctx.beginPath();
        if (sameCol) {
          const x = pa.x + pa.w / 2;
          const y1 = Math.min(pa.y, pb.y) + nodeH;
          const y2 = Math.max(pa.y, pb.y);
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();
          drawArrowHead(ctx, x, y2, Math.PI / 2, col, 7);
        } else {
          const x1 = pa.x + pa.w;
          const y1 = pa.y + pa.h / 2;
          const x2 = pb.x;
          const y2 = pb.y + pb.h / 2;
          const mx = (x1 + x2) / 2;
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
          ctx.stroke();
          drawArrowHead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - mx), col, 7);
        }
        ctx.globalAlpha = 1;
      });

      Object.values(coursePos).forEach(p => {
        const n = p.node;
        const col = STAGE_COLOR[n.stage];
        ctx.globalAlpha = NODE_ALPHA[relLevel(n.id)];
        roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fillStyle = selectedCourse === n.id ? 'rgba(90,60,230,.16)' : '#f1f5f9';
        ctx.fill();
        ctx.lineWidth = selectedCourse === n.id ? 2.4 : 1.4;
        ctx.strokeStyle = col;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '10.5px sans-serif';
        ctx.fillText(n.session, p.x + p.w / 2, p.y + 18);
        ctx.fillStyle = '#1e293b';
        ctx.font = '700 13px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(n.title, p.x + p.w / 2, p.y + 40);
        ctx.globalAlpha = 1;
      });
    }

    function courseAt(x, y) {
      return Object.values(coursePos).find(p =>
        x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    }

    canvas.addEventListener('click', ev => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (W / r.width);
      const y = (ev.clientY - r.top) * (H / r.height);
      const hit = courseAt(x, y);
      if (!hit) return;
      selectedCourse = hit.node.id;
      selectedKp = null;
      drawCourse();
      drawKp();
      showCourseDetail(hit.node);
    });

    canvas.addEventListener('mousemove', ev => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (W / r.width);
      const y = (ev.clientY - r.top) * (H / r.height);
      canvas.style.cursor = courseAt(x, y) ? 'pointer' : 'default';
    });

    function showCourseDetail(n) {
      const s = G.stages.find(item => item.key === n.stage);
      el.querySelector('#gdetail').innerHTML = [
        '<div class="gd-head"><h3>' + n.session + ' · ' + n.title + '</h3>',
        '<span class="tag" style="color:' + STAGE_COLOR[n.stage] + ';border-color:' + STAGE_COLOR[n.stage] + '55">' + s.name + '环节</span></div>',
        '<div class="gd-kp">' + n.kp.map(k => '<span class="tag">' + k + '</span>').join('') + '</div>',
        '<div class="gd-res">' + resourceHtml(n) + '</div>'
      ].join('');
    }

    /* ---------- 专业路径 ---------- */
    const majorToolbar = el.querySelector('#gtoolbar');
    const majorLabel = document.createElement('span');
    majorLabel.className = 'ctl-label';
    majorLabel.textContent = '专业路径';
    majorLabel.style.width = 'auto';
    majorToolbar.appendChild(majorLabel);

    G.majors.forEach(mj => {
      const button = document.createElement('button');
      button.textContent = mj.name;
      button.dataset.major = mj.key;
      if (mj.key === majorKey) button.classList.add('on');
      button.addEventListener('click', () => {
        majorKey = mj.key;
        majorToolbar.querySelectorAll('[data-major]').forEach(item => item.classList.remove('on'));
        button.classList.add('on');
        renderMajorSummary();
        drawCourse();
        drawKp();
        el.querySelector('#gdetail').innerHTML = '<p class="muted">' + mj.desc + '</p>';
      });
      majorToolbar.appendChild(button);
    });

    const levelLegend = document.createElement('span');
    levelLegend.className = 'lvl-legend';
    levelLegend.innerHTML = '<span class="lvl-legend-t">培养层级</span>' +
      [['必学·强相关', 1], ['推荐·中相关', 0.55], ['拓展·弱相关', 0.16]]
        .map(item => '<span class="lvl-item"><i style="opacity:' + item[1] + '"></i>' + item[0] + '</span>').join('');
    majorToolbar.appendChild(levelLegend);

    function renderMajorSummary() {
      const mj = currentMajor();
      const extra = (G.majorHighlights || {})[majorKey] || { summary: mj.desc, focus: [] };
      const names = extra.focus.map(id => kpById[id] ? kpById[id].name.replace(' ', '') : id);
      const tierCount = { 3: 0, 2: 0, 1: 0 };
      G.kpoints.forEach(k => { tierCount[relLevel(k.node)] += 1; });
      el.querySelector('#major-summary').innerHTML =
        '<b>' + mj.name + '：</b>' + extra.summary +
        '<div class="focus-list"><b>培养层级</b>' +
        '<span class="tag">必学 ' + tierCount[3] + '</span>' +
        '<span class="tag">推荐 ' + tierCount[2] + '</span>' +
        '<span class="tag">拓展 ' + tierCount[1] + '</span></div>' +
        (names.length ? '<div class="focus-list"><b>重点知识点</b>' +
          names.map(name => '<span class="tag">' + name + '</span>').join('') + '</div>' : '');
    }

    /* ---------- 知识点模块圆环 ---------- */
    const kStage = el.querySelector('#kpstage');
    const knowledgeCanvasKit = Lab.ui.canvas(kStage, 920);
    const kc = knowledgeCanvasKit.canvas;
    const kx = knowledgeCanvasKit.ctx;
    const KW = knowledgeCanvasKit.W;
    const KH = knowledgeCanvasKit.H;
    const KP = G.kpoints;
    const MOD_INFO = [null].concat((G.modules || []).map(item => ({
      name: item.name, sub: item.sub, count: item.count, col: item.color
    })));
    const LEVEL_INFO = {};
    (G.knowledgeLevels || []).forEach(item => { LEVEL_INFO[item.key] = item; });
    const LEVEL_BY_KP = {};
    Object.keys(G.kpointLevels || {}).forEach(level => {
      G.kpointLevels[level].forEach(id => { LEVEL_BY_KP[id] = level; });
    });
    const levelOf = id => LEVEL_BY_KP[id] || 'general';
    const radiusOf = id => (LEVEL_INFO[levelOf(id)] || { radius: 15 }).radius;
    const kcx = KW / 2;
    const kcy = KH / 2;
    const modGroups = [];
    const modC = {};
    const kpos = {};
    const GRID_POS = {
      1: { x: 0.16, y: 0.25, r: 112 },
      2: { x: 0.50, y: 0.25, r: 175 },
      3: { x: 0.84, y: 0.25, r: 125 },
      4: { x: 0.84, y: 0.73, r: 170 },
      5: { x: 0.50, y: 0.73, r: 205 },
      6: { x: 0.16, y: 0.73, r: 115 }
    };

    KP.forEach(k => { (modGroups[k.mod] = modGroups[k.mod] || []).push(k); });
    for (let m = 1; m <= 6; m++) {
      const grid = GRID_POS[m];
      modC[m] = {
        x: KW * grid.x,
        y: KH * grid.y,
        r: grid.r
      };
    }

    /* 核心、一般、拓展知识点分布在圆环内部的三条固定轨道上。 */
    for (let m = 1; m <= 6; m++) {
      const center = modC[m];
      const tiers = { core: [], general: [], extension: [] };
      modGroups[m].forEach(k => tiers[levelOf(k.id)].push(k));
      [
        { key: 'core', orbit: center.r * 0.32, phase: -Math.PI / 2 },
        { key: 'general', orbit: center.r * 0.61, phase: -Math.PI / 2 + 0.32 },
        { key: 'extension', orbit: center.r * 0.80, phase: -Math.PI / 2 + 0.66 }
      ].forEach(tier => {
        const list = tiers[tier.key];
        list.forEach((k, i) => {
          const angle = list.length === 1 ? tier.phase :
            tier.phase + (i / list.length) * 2 * Math.PI;
          const orbit = tier.key === 'core' && list.length === 1 ? 0 : tier.orbit;
          kpos[k.id] = {
            x: center.x + orbit * Math.cos(angle),
            y: center.y + orbit * Math.sin(angle),
            angle,
            orbit,
            kp: k
          };
        });
      });
    }

    function wrapName(name) {
      if (name.includes(' ')) return name.split(' ');
      if (name.length <= 4) return [name];
      const latin = name.match(/^([A-Za-z-]+)(.+)$/);
      if (latin) return [latin[1], latin[2]];
      return [name.slice(0, 4), name.slice(4, 8)];
    }

    const viewport = { scale: 1, x: 0, y: 0 };
    const tooltip = el.querySelector('#kp-tooltip');
    const crossChapter = new Set();
    G.klinks.forEach(link => {
      const source = kpById[link.source];
      const target = kpById[link.target];
      if (source && target && source.mod !== target.mod) {
        crossChapter.add(source.id);
        crossChapter.add(target.id);
      }
    });

    function updateZoomLabel() {
      const output = el.querySelector('#zoom-value');
      if (output) output.value = Math.round(viewport.scale * 100) + '%';
    }

    function resetViewport() {
      viewport.scale = 1;
      viewport.x = 0;
      viewport.y = 0;
      updateZoomLabel();
    }

    function zoomAt(factor, sx, sy) {
      const next = Math.max(0.65, Math.min(2.2, viewport.scale * factor));
      const worldX = (sx - viewport.x) / viewport.scale;
      const worldY = (sy - viewport.y) / viewport.scale;
      viewport.x = sx - worldX * next;
      viewport.y = sy - worldY * next;
      viewport.scale = next;
      updateZoomLabel();
      drawKp();
    }

    function screenPoint(ev) {
      const rect = kc.getBoundingClientRect();
      return {
        x: (ev.clientX - rect.left) * (KW / rect.width),
        y: (ev.clientY - rect.top) * (KH / rect.height)
      };
    }

    function worldPoint(ev) {
      const point = screenPoint(ev);
      return {
        x: (point.x - viewport.x) / viewport.scale,
        y: (point.y - viewport.y) / viewport.scale
      };
    }

    function ringArrow(c1, c2) {
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance;
      const uy = dy / distance;
      const x1 = c1.x + ux * (c1.r + 28);
      const y1 = c1.y + uy * (c1.r + 28);
      const x2 = c2.x - ux * (c2.r + 34);
      const y2 = c2.y - uy * (c2.r + 34);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const ox = mx - kcx;
      const oy = my - kcy;
      const od = Math.hypot(ox, oy) || 1;
      const controlX = mx + ox / od * 26;
      const controlY = my + oy / od * 26;
      kx.save();
      kx.globalAlpha = 0.55;
      kx.strokeStyle = '#94a3b8';
      kx.lineWidth = 2;
      kx.beginPath();
      kx.moveTo(x1, y1);
      kx.quadraticCurveTo(controlX, controlY, x2, y2);
      kx.stroke();
      drawArrowHead(kx, x2, y2, Math.atan2(y2 - controlY, x2 - controlX), '#94a3b8', 9);
      kx.restore();
    }

    function relationAlpha(link, focusSet) {
      const a = kpById[link.source];
      const b = kpById[link.target];
      let alpha = EDGE_ALPHA[Math.min(relLevel(a.node), relLevel(b.node))] * 0.95;
      if (viewKey !== 'panorama') alpha *= (focusSet.has(a.id) && focusSet.has(b.id)) ? 1.3 : 0.09;
      if (selectedKp) {
        return (link.source === selectedKp || link.target === selectedKp) ? 0.95 : 0.025;
      }
      else if (selectedCourse) {
        const matchA = a.node === selectedCourse;
        const matchB = b.node === selectedCourse;
        alpha *= (matchA && matchB) ? 1.2 : (matchA || matchB ? 0.6 : 0.2);
      }
      return Math.min(1, Math.max(0.015, alpha));
    }

    function trimPoint(from, to, amount) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      return { x: from.x + dx / distance * amount, y: from.y + dy / distance * amount };
    }

    function drawSelfLoop(p, style, alpha) {
      const nodeRadius = radiusOf(p.kp.id);
      const radius = Math.max(12, nodeRadius * 0.9);
      const cx = p.x + nodeRadius * 0.82;
      const cy = p.y - nodeRadius * 0.82;
      const start = Math.PI * 0.78;
      const end = Math.PI * 2.35;
      kx.save();
      kx.globalAlpha = alpha;
      kx.strokeStyle = style.color;
      kx.fillStyle = style.color;
      kx.lineWidth = 2.1;
      kx.setLineDash(style.dash);
      kx.beginPath();
      kx.arc(cx, cy, radius, start, end);
      kx.stroke();
      const x = cx + radius * Math.cos(end);
      const y = cy + radius * Math.sin(end);
      drawArrowHead(kx, x, y, end + Math.PI / 2, style.color, 8);
      kx.restore();
    }

    function drawKnowledgeLink(link, alpha) {
      const pa = kpos[link.source];
      const pb = kpos[link.target];
      if (!pa || !pb) return;
      const style = RELATION_STYLE[link.type] || RELATION_STYLE.prerequisite;
      if (link.source === link.target) {
        drawSelfLoop(pa, style, alpha);
        return;
      }

      const start = trimPoint(pa, pb, radiusOf(pa.kp.id) + 3);
      const end = trimPoint(pb, pa, radiusOf(pb.kp.id) + 8);
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy) || 1;
      const nx = -dy / distance;
      const ny = dx / distance;
      let bend = 0;
      if (link.type === 'iterative') bend = 52;
      else if (link.type === 'feedback') bend = -64;
      else if (pa.kp.mod !== pb.kp.mod) {
        const outsideX = mx - kcx;
        const outsideY = my - kcy;
        bend = Math.min(110, 52 + distance * 0.12);
        if (nx * outsideX + ny * outsideY < 0) bend *= -1;
      } else {
        bend = 14;
      }
      const controlX = mx + nx * bend;
      const controlY = my + ny * bend;

      kx.save();
      kx.globalAlpha = alpha;
      kx.strokeStyle = style.color;
      kx.fillStyle = style.color;
      kx.lineWidth = link.type === 'comparison' ? 2.2 : 1.8;
      kx.setLineDash(style.dash);
      kx.beginPath();
      kx.moveTo(start.x, start.y);
      kx.quadraticCurveTo(controlX, controlY, end.x, end.y);
      kx.stroke();
      drawArrowHead(kx, end.x, end.y, Math.atan2(end.y - controlY, end.x - controlX), style.color, 8);
      if (style.both) {
        drawArrowHead(kx, start.x, start.y, Math.atan2(start.y - controlY, start.x - controlX), style.color, 8);
      }
      kx.restore();
    }

    function nodeAlpha(k, selectedSet, focusSet) {
      let alpha = NODE_ALPHA[relLevel(k.node)];
      if (viewKey !== 'panorama') alpha *= focusSet.has(k.id) ? 1 : 0.13;
      if (selectedKp) {
        if (k.id === selectedKp) return 1;
        if (selectedSet.has(k.id)) return Math.max(0.78, alpha);
        return 0.08;
      }
      else if (selectedCourse) alpha *= k.node === selectedCourse ? 1 : 0.32;
      return Math.min(1, Math.max(0.04, alpha));
    }

    function drawNodeLabel(k, p, radius, alpha) {
      const center = modC[k.mod];
      const lines = wrapName(k.name);
      const level = levelOf(k.id);
      const fontSize = level === 'core' ? 10.5 : (level === 'general' ? 9.5 : 9);
      const lineHeight = 11;
      const labelHeight = lines.length * lineHeight + 4;
      kx.save();
      kx.globalAlpha = alpha;
      kx.font = (level === 'core' ? '700 ' : '500 ') + fontSize +
        'px "PingFang SC", "Microsoft YaHei", sans-serif';
      const width = Math.max.apply(null, lines.map(line => kx.measureText(line).width)) + 8;
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const distance = Math.hypot(dx, dy);
      let labelX;
      let labelY;
      if (distance < 2) {
        labelX = p.x;
        labelY = p.y + radius + 8;
      } else {
        const ux = dx / distance;
        const uy = dy / distance;
        const direction = level === 'extension' ? -1 : 1;
        const offset = radius + (level === 'core' ? 12 : 10);
        labelX = p.x + ux * offset * direction;
        labelY = p.y + uy * offset * direction - labelHeight / 2;
      }
      labelX = Math.max(center.x - center.r + width / 2 + 7,
        Math.min(center.x + center.r - width / 2 - 7, labelX));
      labelY = Math.max(center.y - center.r + 7,
        Math.min(center.y + center.r - labelHeight - 7, labelY));
      kx.fillStyle = '#1e293b';
      kx.textAlign = 'center';
      kx.textBaseline = 'top';
      lines.forEach((line, index) => kx.fillText(line, labelX, labelY + index * lineHeight));
      kx.restore();
    }

    function drawKp() {
      kx.clearRect(0, 0, KW, KH);
      const focusSet = viewFocusSet();
      const stepMap = viewStepMap();
      const selectedSet = selectedKp ? linkedSet(selectedKp) : new Set();
      const professionFocus = majorFocusSet();

      kx.save();
      kx.translate(viewport.x, viewport.y);
      kx.scale(viewport.scale, viewport.scale);

      /* 彩色圆环只表示章节范围，不填充背景。 */
      for (let m = 1; m <= 6; m++) {
        const center = modC[m];
        kx.save();
        kx.globalAlpha = 0.72;
        kx.strokeStyle = MOD_INFO[m].col;
        kx.lineWidth = 3.2;
        kx.beginPath();
        kx.arc(center.x, center.y, center.r, 0, 2 * Math.PI);
        kx.stroke();
        kx.restore();
        kx.textAlign = 'center';
        kx.fillStyle = MOD_INFO[m].col;
        kx.font = '700 14px "PingFang SC", "Microsoft YaHei", sans-serif';
        kx.fillText(MOD_INFO[m].name + ' · ' + MOD_INFO[m].sub, center.x, center.y - center.r - 17);
        kx.fillStyle = '#64748b';
        kx.font = '10.5px sans-serif';
        kx.fillText(MOD_INFO[m].count, center.x, center.y - center.r - 3);
      }
      for (let m = 1; m <= 5; m++) ringArrow(modC[m], modC[m + 1]);

      visibleLinks().forEach(link => {
        drawKnowledgeLink(link, relationAlpha(link, focusSet));
      });

      KP.forEach(k => {
        const p = kpos[k.id];
        const course = nodeById[k.node];
        const moduleColor = MOD_INFO[k.mod].col;
        const status = LEARNING_STATUS[statusOf(k.id)];
        const alpha = nodeAlpha(k, selectedSet, focusSet);
        const baseRadius = radiusOf(k.id);
        const radius = selectedKp === k.id ? baseRadius * 1.35 : baseRadius;
        const isAssociated = selectedKp && selectedSet.has(k.id) && selectedKp !== k.id;

        kx.save();
        kx.globalAlpha = alpha;
        if (selectedKp === k.id) {
          kx.shadowColor = 'rgba(90,60,230,.32)';
          kx.shadowBlur = 13;
        }
        kx.beginPath();
        kx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        kx.fillStyle = moduleColor;
        kx.fill();
        kx.shadowBlur = 0;
        kx.lineWidth = 2.8;
        kx.strokeStyle = status.color;
        kx.stroke();

        if (selectedKp === k.id || isAssociated) {
          kx.beginPath();
          kx.arc(p.x, p.y, radius + 5, 0, 2 * Math.PI);
          kx.lineWidth = selectedKp === k.id ? 3 : 2;
          kx.strokeStyle = selectedKp === k.id ? '#5a3ce6' : '#0f766e';
          kx.stroke();
        }
        kx.restore();

        /* 菱形表示跨章节关联。 */
        if (crossChapter.has(k.id)) {
          const size = Math.max(4, baseRadius * 0.28);
          kx.save();
          kx.globalAlpha = alpha;
          kx.translate(p.x + radius * 0.72, p.y - radius * 0.72);
          kx.rotate(Math.PI / 4);
          kx.fillStyle = '#7c3aed';
          kx.fillRect(-size / 2, -size / 2, size, size);
          kx.restore();
        }

        /* 小方块表示所属课次挂接了概念演示或编程实验。 */
        if (course.demos.length || course.coding.length) {
          const size = Math.max(5, baseRadius * 0.34);
          kx.save();
          kx.globalAlpha = alpha;
          kx.fillStyle = '#fff';
          kx.strokeStyle = '#334155';
          kx.lineWidth = 1.2;
          kx.fillRect(p.x + radius * 0.5, p.y + radius * 0.48, size, size);
          kx.strokeRect(p.x + radius * 0.5, p.y + radius * 0.48, size, size);
          kx.restore();
        }

        if (professionFocus.has(k.id)) {
          kx.save();
          kx.globalAlpha = Math.max(0.28, alpha);
          kx.strokeStyle = '#5a3ce6';
          kx.lineWidth = 1.3;
          kx.setLineDash([3, 3]);
          kx.beginPath();
          kx.arc(p.x, p.y, radius + 9, 0, 2 * Math.PI);
          kx.stroke();
          kx.restore();
        }

        if (stepMap[k.id]) {
          kx.save();
          kx.globalAlpha = Math.max(0.55, alpha);
          kx.fillStyle = '#5a3ce6';
          kx.beginPath();
          kx.arc(p.x - radius * 0.72, p.y - radius * 0.72, 8, 0, 2 * Math.PI);
          kx.fill();
          kx.fillStyle = '#fff';
          kx.font = '700 9px sans-serif';
          kx.textAlign = 'center';
          kx.textBaseline = 'middle';
          kx.fillText(String(stepMap[k.id]), p.x - radius * 0.72, p.y - radius * 0.72);
          kx.restore();
        }

        drawNodeLabel(k, p, radius, alpha);
      });
      kx.restore();
    }

    function kpAt(x, y) {
      return KP.find(k => {
        const p = kpos[k.id];
        const radius = radiusOf(k.id) * (selectedKp === k.id ? 1.35 : 1);
        return Math.hypot(x - p.x, y - p.y) <= radius + 7;
      });
    }

    let dragging = false;
    let dragMoved = false;
    let lastDragPoint = null;

    kc.addEventListener('pointerdown', ev => {
      dragging = true;
      dragMoved = false;
      lastDragPoint = screenPoint(ev);
      kc.classList.add('dragging');
      kc.setPointerCapture(ev.pointerId);
      tooltip.style.display = 'none';
    });

    kc.addEventListener('pointermove', ev => {
      if (dragging) {
        const point = screenPoint(ev);
        const dx = point.x - lastDragPoint.x;
        const dy = point.y - lastDragPoint.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
        viewport.x += dx;
        viewport.y += dy;
        lastDragPoint = point;
        drawKp();
        return;
      }
      const point = worldPoint(ev);
      const k = kpAt(point.x, point.y);
      kc.style.cursor = k ? 'pointer' : 'grab';
      if (!k) {
        tooltip.style.display = 'none';
        return;
      }
      const level = LEVEL_INFO[levelOf(k.id)] || { name: '一般知识点' };
      tooltip.innerHTML = '<b>' + k.name.replace(' ', '') + '</b>' +
        MOD_INFO[k.mod].name + ' · ' + level.name + ' · ' + LEARNING_STATUS[statusOf(k.id)].name;
      tooltip.style.display = 'block';
      tooltip.style.left = Math.min(window.innerWidth - 280, ev.clientX + 14) + 'px';
      tooltip.style.top = Math.min(window.innerHeight - 70, ev.clientY + 14) + 'px';
    });

    kc.addEventListener('pointerup', ev => {
      if (!dragging) return;
      dragging = false;
      kc.classList.remove('dragging');
      if (kc.hasPointerCapture(ev.pointerId)) kc.releasePointerCapture(ev.pointerId);
      if (dragMoved) return;
      const point = worldPoint(ev);
      const k = kpAt(point.x, point.y);
      if (!k) return;
      selectedKp = k.id;
      selectedCourse = k.node;
      drawCourse();
      drawKp();
      showKpDetail(k);
    });

    kc.addEventListener('pointercancel', ev => {
      dragging = false;
      kc.classList.remove('dragging');
      if (kc.hasPointerCapture(ev.pointerId)) kc.releasePointerCapture(ev.pointerId);
    });

    kc.addEventListener('pointerleave', () => {
      if (!dragging) tooltip.style.display = 'none';
    });

    kc.addEventListener('wheel', ev => {
      ev.preventDefault();
      const point = screenPoint(ev);
      zoomAt(ev.deltaY < 0 ? 1.12 : 0.89, point.x, point.y);
      tooltip.style.display = 'none';
    }, { passive: false });

    function prerequisiteNames(k) {
      const names = G.klinks
        .filter(link => link.type === 'prerequisite' && link.target === k.id && link.source !== k.id)
        .map(link => kpById[link.source])
        .filter(Boolean)
        .map(item => item.name.replace(' ', ''));
      return names.length ? names.join('、') : '课程入口或无显式前置知识';
    }

    function relationSummary(k) {
      return G.klinks
        .filter(link => link.source === k.id || link.target === k.id)
        .map(link => {
          const otherId = link.source === k.id ? link.target : link.source;
          const other = kpById[otherId];
          if (!other || otherId === k.id) return null;
          return {
            id: otherId,
            name: other.name.replace(' ', ''),
            type: (RELATION_STYLE[link.type] || {}).name || link.label
          };
        })
        .filter(Boolean)
        .filter((item, index, list) =>
          list.findIndex(candidate => candidate.id === item.id && candidate.type === item.type) === index);
    }

    function showKpDetail(k) {
      const n = nodeById[k.node];
      const s = G.stages.find(item => item.key === n.stage);
      const profile = (G.nodeProfiles || {})[n.id] || {
        ability: '支撑所属课次的核心能力。',
        application: '用于所属模块的典型遥感任务。'
      };
      const relations = relationSummary(k);
      const currentStatus = statusOf(k.id);
      const detail = el.querySelector('#kdetail');
      detail.innerHTML = [
        '<div class="gd-head"><h3>' + k.name.replace(' ', '') + '</h3>',
        '<span class="tag" style="color:' + MOD_INFO[k.mod].col + ';border-color:' + MOD_INFO[k.mod].col + '66">' +
        MOD_INFO[k.mod].name + ' · ' + MOD_INFO[k.mod].sub + '</span>',
        '<span class="tag" style="color:' + STAGE_COLOR[n.stage] + ';border-color:' + STAGE_COLOR[n.stage] + '55">' + s.name + '环节</span>',
        '<span class="tag">' + n.session + ' · ' + n.title + '</span>',
        '<span class="tag" style="color:' + LEARNING_STATUS[currentStatus].color + ';border-color:' + LEARNING_STATUS[currentStatus].color + '66">' + LEARNING_STATUS[currentStatus].name + '</span>',
        '<div class="detail-actions"><button type="button" id="back-panorama">返回全景</button></div></div>',
        '<div class="kp-detail-grid">',
        '<div class="kp-detail-item"><b>知识定义</b>' + k.hint + '</div>',
        '<div class="kp-detail-item"><b>前置知识</b>' + prerequisiteNames(k) + '</div>',
        '<div class="kp-detail-item"><b>支撑能力</b>' + profile.ability + '</div>',
        '<div class="kp-detail-item"><b>应用场景</b>' + profile.application + '</div>',
        '</div>',
        '<div class="kp-status-row"><span>学习状态</span>' +
          Object.keys(LEARNING_STATUS).map(key =>
            '<button type="button" class="status-btn ' + (key === currentStatus ? 'on' : '') +
            '" data-status="' + key + '" style="color:' + LEARNING_STATUS[key].color +
            ';border-color:' + LEARNING_STATUS[key].color + '66">' +
            LEARNING_STATUS[key].name + '</button>').join('') +
        '</div>',
        relations.length ? '<div class="gd-row"><b>关联知识</b>' + relations.map(item =>
          '<button type="button" class="related-kp" data-kp="' + item.id +
          '" title="' + item.type + '">' + item.name + ' · ' + item.type + '</button>').join('') +
          '</div>' : '',
        '<div class="gd-res">' + resourceHtml(n) + '</div>'
      ].join('');

      detail.querySelectorAll('[data-status]').forEach(button => {
        button.addEventListener('click', () => {
          learning[k.id] = button.dataset.status;
          saveLearning();
          updateProgress();
          drawKp();
          showKpDetail(k);
        });
      });
      detail.querySelectorAll('[data-kp]').forEach(button => {
        button.addEventListener('click', () => {
          const next = kpById[button.dataset.kp];
          if (!next) return;
          selectedKp = next.id;
          selectedCourse = next.node;
          drawCourse();
          drawKp();
          showKpDetail(next);
        });
      });
      detail.querySelector('#back-panorama').addEventListener('click', returnPanorama);
    }

    function returnPanorama() {
      selectedKp = null;
      selectedCourse = null;
      relationFilter = 'all';
      viewKey = 'panorama';
      resetViewport();
      syncControlButtons();
      renderViewTrail();
      drawCourse();
      drawKp();
      el.querySelector('#kdetail').innerHTML =
        '<p class="muted">已返回知识全景。点击任一知识点查看定义、关联知识、实验资源和学习状态。</p>';
    }

    /* ---------- 视图、关系筛选与图例 ---------- */
    const viewToolbar = el.querySelector('#view-toolbar');
    (G.views || []).forEach(view => {
      const button = document.createElement('button');
      button.textContent = view.name;
      button.dataset.view = view.key;
      if (view.key === viewKey) button.classList.add('on');
      button.addEventListener('click', () => {
        viewKey = view.key;
        selectedKp = null;
        selectedCourse = null;
        syncControlButtons();
        renderViewTrail();
        drawCourse();
        drawKp();
        el.querySelector('#kdetail').innerHTML =
          '<p class="muted"><b>' + view.name + '：</b>' + view.desc + '</p>';
      });
      viewToolbar.appendChild(button);
    });

    const relationToolbar = el.querySelector('#relation-toolbar');
    [{ key: 'all', name: '全部' }].concat(G.relationTypes || []).forEach(type => {
      const button = document.createElement('button');
      button.textContent = type.name;
      button.dataset.relation = type.key;
      if (type.key === relationFilter) button.classList.add('on');
      button.addEventListener('click', () => {
        relationFilter = type.key;
        syncControlButtons();
        drawKp();
        if (selectedKp) showKpDetail(kpById[selectedKp]);
      });
      relationToolbar.appendChild(button);
    });

    function syncControlButtons() {
      viewToolbar.querySelectorAll('[data-view]').forEach(button => {
        button.classList.toggle('on', button.dataset.view === viewKey);
      });
      relationToolbar.querySelectorAll('[data-relation]').forEach(button => {
        button.classList.toggle('on', button.dataset.relation === relationFilter);
      });
    }

    function renderViewTrail() {
      const view = activeView();
      const target = el.querySelector('#view-trail');
      if (!view.steps.length) {
        target.innerHTML = '<span>' + view.desc + '</span>';
        return;
      }
      target.innerHTML = '<span>' + view.desc + '</span><br>' +
        view.steps.map(step => '<span class="trail-step">' + step.label + '</span>')
          .join('<span class="trail-arrow">→</span>');
    }

    el.querySelector('#relation-legend').innerHTML = (G.relationTypes || []).map(type =>
      '<span title="' + type.desc + '"><i class="relation-line ' + type.key + '"></i>' +
      type.name + '</span>'
    ).join('');

    el.querySelector('#node-legend').innerHTML = (G.knowledgeLevels || []).map(level =>
      '<span class="node-legend-item" title="' + level.desc + '"><i class="node-dot ' +
      level.key + '"></i>' + level.name + '</span>'
    ).join('') +
      '<span class="node-legend-item"><i class="ring-sample"></i>彩色节点/圆环＝所属章节</span>' +
      '<span class="node-legend-item"><i class="marker-sample"></i>学习状态外圈</span>' +
      '<span class="node-legend-item"><i class="cross-sample"></i>跨章节关联</span>' +
      '<span class="node-legend-item"><i class="resource-sample"></i>实验资源</span>';

    el.querySelector('#viewport-toolbar').addEventListener('click', ev => {
      const action = ev.target && ev.target.dataset ? ev.target.dataset.zoom : null;
      if (!action) return;
      if (action === 'in') zoomAt(1.18, KW / 2, KH / 2);
      else if (action === 'out') zoomAt(0.84, KW / 2, KH / 2);
      else {
        resetViewport();
        drawKp();
      }
    });

    function updateProgress() {
      const counts = { unstarted: 0, learning: 0, mastered: 0, review: 0 };
      KP.forEach(k => { counts[statusOf(k.id)] += 1; });
      const percent = Math.round(counts.mastered / KP.length * 100);
      el.querySelector('#learning-progress').innerHTML = [
        '<div class="learning-progress-text"><b>已掌握 ' + counts.mastered + ' / ' + KP.length +
        '</b><br>学习中 ' + counts.learning + ' · 需要复习 ' + counts.review +
        ' · 总体完成度 ' + percent + '%</div>',
        '<div class="learning-progress-track" aria-label="总体学习进度 ' + percent +
        '%"><i style="width:' + percent + '%"></i></div>',
        '<div class="status-legend">' + Object.keys(LEARNING_STATUS).map(key =>
          '<span><i style="background:#fff;border:2px solid ' + LEARNING_STATUS[key].color + '"></i>' +
          LEARNING_STATUS[key].name + ' ' + counts[key] + '</span>'
        ).join('') + '</div>'
      ].join('');
    }

    renderMajorSummary();
    renderViewTrail();
    updateProgress();
    updateZoomLabel();
    drawCourse();
    drawKp();
  };
})();
