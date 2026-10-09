/* 遥感概念线上实验室 —— 核心框架：注册表、路由、大厅、演示页脚手架、控件工厂 */
(function () {
  const Lab = {
    demos: [],
    register(d) { Lab.demos.push(d); },
    byId(id) { return Lab.demos.find(d => d.id === id); },
    start() {
      window.addEventListener('hashchange', render);
      window.addEventListener('resize', debounce(() => {
        if (currentDemo) renderDemo(currentDemo.id);
      }, 250));
      render();
    }
  };
  window.Lab = Lab;

  let currentDemo = null;
  let rafId = 0;
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
  const app = () => document.getElementById('app');

  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  /* ---------------- 控件工厂（供各演示使用） ---------------- */
  Lab.ui = {
    canvas(stage, height) {
      const c = document.createElement('canvas');
      c.style.height = height + 'px';
      stage.appendChild(c);
      const dpr = window.devicePixelRatio || 1;
      const w = stage.clientWidth - 24;
      c.width = Math.max(320, w) * dpr;
      c.height = height * dpr;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { canvas: c, ctx, W: Math.max(320, w), H: height };
    },
    /* 支持两种调用：
       * slider(panel, {label, min, max, step, value, unit, fmt, oninput})
       * slider(panel, label, min, max, value, step, oninput, unit) */
    slider(panel, opt, ...rest) {
      if (typeof opt === 'string') {
        const [min, max, value, step, oninput, unit] = rest;
        opt = { label: opt, min, max, value, step, oninput, unit };
      }
      const row = document.createElement('div');
      row.className = 'ctl-row';
      const lab = document.createElement('span');
      lab.className = 'ctl-label'; lab.textContent = opt.label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = opt.min; input.max = opt.max;
      input.step = opt.step || 1; input.value = opt.value;
      const val = document.createElement('span');
      val.className = 'ctl-val';
      const fmt = opt.fmt || (v => v + (opt.unit || ''));
      val.textContent = fmt(parseFloat(input.value));
      input.addEventListener('input', () => {
        val.textContent = fmt(parseFloat(input.value));
        opt.oninput(parseFloat(input.value));
      });
      row.append(lab, input, val);
      panel.appendChild(row);
      return input;
    },
    /* cls 可为字符串类名，或 {active, group}：同组按钮互斥高亮 */
    button(panel, label, onclick, cls) {
      let row = panel.querySelector('.btn-row');
      if (!row) { row = document.createElement('div'); row.className = 'btn-row'; panel.appendChild(row); }
      const b = document.createElement('button');
      b.textContent = label;
      const opts = (cls && typeof cls === 'object') ? cls : null;
      if (typeof cls === 'string') b.className = cls;
      if (opts) {
        if (opts.group) b.dataset.group = opts.group;
        if (opts.active) b.classList.add('on');
      }
      b.addEventListener('click', () => {
        if (opts && opts.group) {
          panel.querySelectorAll(`button[data-group="${opts.group}"]`)
            .forEach(x => x.classList.remove('on'));
          b.classList.add('on');
        }
        if (onclick) onclick.call(b, b);
      });
      row.appendChild(b);
      return b;
    },
    checkbox(panel, label, checked, onchange) {
      const row = document.createElement('label');
      row.className = 'check-row';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.checked = checked;
      input.addEventListener('change', () => onchange(input.checked));
      row.append(input, document.createTextNode(label));
      panel.appendChild(row);
      return input;
    },
    readout(panel, html) {
      const d = document.createElement('div');
      d.className = 'readout';
      d.innerHTML = html || '';
      panel.appendChild(d);
      return d;
    },
    title(panel, text) {
      const h = document.createElement('h4');
      h.textContent = text;
      panel.appendChild(h);
      return h;
    }
  };

  /* ---------------- 页面渲染 ---------------- */
  function render() {
    stopLoop();
    const hash = location.hash || '#/';
    const m = hash.match(/^#\/demo\/([\w-]+)/);
    const c = hash.match(/^#\/coding\/([\w-]+)/);
    const s = hash.match(/^#\/scenario\/([\w-]+)/);
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });
    if (hash.startsWith('#/forum')) {
      location.hash = '#/';
      return;
    } else if (m && Lab.byId(m[1])) {
      document.querySelector('[data-nav="concept"]').classList.add('active');
      renderDemo(m[1]);
    } else if (c && window.CODING && CODING.find(t => t.id === c[1])) {
      document.querySelector('[data-nav="coding"]').classList.add('active');
      renderCodingTutorial(c[1]);
    } else if (hash.startsWith('#/coding')) {
      document.querySelector('[data-nav="coding"]').classList.add('active');
      renderCodingLobby();
    } else if (s && window.SCENARIOS && SCENARIOS.find(item => item.id === s[1])) {
      document.querySelector('[data-nav="scenario"]').classList.add('active');
      currentDemo = null;
      ScenarioPage.render(s[1]);
    } else if (hash.startsWith('#/scenario')) {
      document.querySelector('[data-nav="scenario"]').classList.add('active');
      currentDemo = null;
      ScenarioPage.render();
    } else if (hash.startsWith('#/graph')) {
      document.querySelector('[data-nav="graph"]').classList.add('active');
      currentDemo = null;
      GraphPage.render();
    } else if (hash.startsWith('#/about')) {
      document.querySelector('[data-nav="about"]').classList.add('active');
      renderAbout();
    } else if (hash.startsWith('#/concept')) {
      document.querySelector('[data-nav="concept"]').classList.add('active');
      renderLobby();
    } else {
      document.querySelector('[data-nav="home"]').classList.add('active');
      renderCover();
    }
    const activeNav = document.querySelector('[data-nav].active');
    if (activeNav) activeNav.setAttribute('aria-current', 'page');
    window.scrollTo(0, 0);
  }

  function renderCover() {
    currentDemo = null;
    const labs = [
      {
        href: '#/concept', key: 'concept', number: '01',
        name: '概念口袋实验室', english: 'Concept Pocket Lab',
        description: '把电磁波谱、卫星轨道、成像与图像处理等抽象概念，变成可拖动、可测量、可探究的实验。',
        action: '进入概念实验室'
      },
      {
        href: '#/coding', key: 'coding', number: '02',
        name: '编程口袋实验室', english: 'Coding Pocket Lab',
        description: '从波段运算到图像融合与目标检测，通过处理步骤、参考代码和学习资源，练习把原理转化为算法。',
        action: '进入编程实验室'
      },
      {
        href: '#/scenario', key: 'scenario', number: '03',
        name: '情景口袋实验室', english: 'Scenario Pocket Lab',
        description: '从光谱对比、目标标注到洪涝变化与多源融合，使用内置教学样例调参、分析并导出成果。',
        action: '进入情景实验室'
      },
      {
        href: '#/graph', key: 'graph', number: '04',
        name: '课程知识图谱', english: 'Course Knowledge Graph',
        description: '沿“信号—数据—信息—决策”主线组织课程知识，并根据不同专业突出学习重点、串联课次与实验资源。',
        action: '进入知识图谱'
      }
    ];
    app().innerHTML = `
      <div class="cover-page">
        <section class="cover-hero" aria-labelledby="cover-title">
          <p class="cover-kicker">《遥感技术基础》课程配套学习平台</p>
          <h1 id="cover-title">遥感口袋实验室</h1>
          <p class="cover-english" lang="en">Remote Sensing Pocket Lab</p>
          <p class="cover-description">以课程知识为主线，连接概念交互、编程实践、情景任务与专业化图谱导学，让抽象的遥感原理可以观察、操作、计算和应用。</p>
          <div class="cover-lab-grid">${labs.map(lab => `
            <a class="cover-lab ${lab.key}" href="${lab.href}">
              <span class="cover-lab-number" aria-hidden="true">${lab.number}</span>
              <h3>${lab.name}</h3>
              <p class="cover-lab-english" lang="en">${lab.english}</p>
              <p class="cover-lab-description">${lab.description}</p>
              <span class="cover-lab-action">${lab.action} <i aria-hidden="true">→</i></span>
            </a>`).join('')}
          </div>
        </section>
      </div>`;
  }

  const GROUPS = [
    { key: 'intro', name: '模块1 绪论', sub: '1次课 · 遥感过程全貌' },
    { key: 'phys', name: '模块2 电磁波辐射特性及传输', sub: '3次课 · 传输特性 / 发射特性 / 反射特性' },
    { key: 'platform', name: '模块3 遥感平台', sub: '2次课 · 遥感平台 / 遥感卫星轨道' },
    { key: 'sensor', name: '模块4 成像传感器及图像特性', sub: '4次课 · 光学基础 / 摄影型 / 扫描型 / 雷达' },
    { key: 'proc', name: '模块5 遥感图像处理与分析', sub: '4次课 · 校正 / 判读 / 融合 / 分类' },
    { key: 'app', name: '模块6 遥感应用', sub: '变化检测与行业应用' },
  ];

  function renderLobby() {
    currentDemo = null;
    const el = app();
    const total = Lab.demos.length;
    el.innerHTML = `
      <section class="hero">
        <p class="lab-name-en" lang="en">Concept Pocket Lab</p>
        <h1>概念口袋实验室 · 让每一个抽象概念都可交互</h1>
        <p>这里是《遥感技术基础》课程的"概念口袋实验室"：覆盖全课程 6 个模块 15 次理论课，把电磁波、辐射传输、
        卫星轨道、SAR 成像、计算机分类等"看不见、摸不着"的概念，变成可拖动、可测量、可探究的交互实验。
        先看清知识全貌请进 <a href="#/graph">课程知识图谱</a>，动手写代码请进 <a href="#/coding">编程口袋实验室</a>。</p>
        <div class="stat-row">
          <div class="stat"><b>${total}</b><span>个交互演示</span></div>
          <div class="stat"><b>6</b><span>模块全覆盖</span></div>
          <div class="stat"><b>15</b><span>次理论课</span></div>
          <div class="stat"><b>0</b><span>编程基础即可使用</span></div>
        </div>
      </section>`;
    for (const g of GROUPS) {
      const list = Lab.demos.filter(d => d.group === g.key);
      if (!list.length) continue;
      const h = document.createElement('h2');
      h.className = 'group-title';
      h.innerHTML = `${g.name} <small>${g.sub}</small>`;
      el.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'cards';
      for (const d of list) {
        const a = document.createElement('a');
        a.className = 'card';
        a.href = '#/demo/' + d.id;
        a.innerHTML = `
          <span class="icon">${d.icon || '演'}</span>
          <h3>${d.title}</h3>
          <p>${d.brief}</p>
          <span class="tags">
            ${d.session ? `<span class="tag ses">${d.session}</span>` : ''}
            <span class="tag">${d.concept}</span>
            ${d.military ? `<span class="tag mil">场景应用：${d.military}</span>` : ''}
          </span>`;
        grid.appendChild(a);
      }
      el.appendChild(grid);
    }
  }

  function renderDemo(id) {
    const d = Lab.byId(id);
    if (!d) { location.hash = '#/concept'; return; }
    currentDemo = d;
    const el = app();
    el.innerHTML = `
      <div class="demo-head">
        <a class="back" href="#/concept">← 返回演示大厅</a>
        <h1>${d.title}</h1>
        <div class="tags">
          ${d.session ? `<span class="tag ses">${d.session}</span>` : ''}
          <span class="tag">${d.concept}</span>
          ${d.military ? `<span class="tag mil">场景应用：${d.military}</span>` : ''}
        </div>
      </div>
      <div class="concept-box"><b>概念卡片｜</b>${d.summary}</div>
      <div class="lab-grid">
        <div class="stage" id="stage"></div>
        <div class="panel" id="panel"><h4>控制面板</h4></div>
      </div>
      <div class="teach-box">
        <div class="col old"><h4>传统课堂怎么讲</h4><p>${d.teach.old}</p></div>
        <div class="col now"><h4>线上实验室怎么学</h4><p>${d.teach.now}</p></div>
      </div>`;
    const stage = el.querySelector('#stage');
    const panel = el.querySelector('#panel');
    stopLoop();
    const tick = d.render(stage, panel);
    if (typeof tick === 'function') {
      const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
      loop();
    }
  }

  /* ---------------- 编程口袋实验室 ---------------- */
  const CGROUPS = [
    { key: 'base', name: '遥感图像处理基础实验', sub: '灰度值处理 / NDVI / 融合 / 平滑 / 锐化 / K-means聚类 · 完整可运行代码' },
    { key: 'dl', name: '深度学习实验', sub: '场景分类 / 语义分割 / 目标检测 / 变化检测 / 跟踪 / 规划 / 跨视角匹配' },
    { key: 'llm', name: '大模型相关任务', sub: '多模态大模型 / 自然语言生成代码 / 辅助判读报告' },
  ];

  /* 课内8学时实战任务链 → 本实验室对应教程（三级实践体系的课外深化环节） */
  const TASK_CHAIN = [
    { n: '任务一', title: '侦察影像认识与波段运算', scene: '上级通报：某地域疑似出现新的阵地设施，先读懂手头的侦察影像', ids: [['gray', '灰度值处理'], ['ndvi-calc', 'NDVI计算']] },
    { n: '任务二', title: '侦察影像增强', scene: '影像受光照与云雾影响，把目标细节凸显出来', ids: [['smooth', '平滑滤波'], ['sharpen', '锐化']] },
    { n: '任务三', title: '阵地目标分类', scene: '在整幅影像中区分阵地设施、道路、植被与背景', ids: [['scene-cls', '场景分类'], ['seg', '语义分割']] },
    { n: '任务四', title: '战场变化检测', scene: '对比前后两时相影像，锁定新增设施与态势变化', ids: [['cd', '变化检测']] },
  ];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCodingLobby() {
    currentDemo = null;
    const el = app();
    const total = (window.CODING || []).length;
    el.innerHTML = `
      <section class="hero">
        <p class="lab-name-en" lang="en">Coding Pocket Lab</p>
        <h1>编程口袋实验室 · 把概念变成代码</h1>
        <p>这里把概念实验室里的原理变成可上机的实验：每个实验标明所需输入数据、处理步骤，
        基础实验附完整可运行代码（复制即可跑），深度学习与大模型实验给出关键代码骨架与精选 GitHub 参考仓库。
        回到 <a href="#/concept">概念口袋实验室</a> 继续玩交互演示。</p>
        <div class="stat-row">
          <div class="stat"><b>${total}</b><span>个上机实验</span></div>
          <div class="stat"><b>6</b><span>个基础实验含完整代码</span></div>
          <div class="stat"><b>7</b><span>个深度学习任务</span></div>
          <div class="stat"><b>3</b><span>个大模型任务</span></div>
        </div>
      </section>`;
    const chain = TASK_CHAIN.map((s, i) => {
      const links = s.ids.map(([id, label]) =>
        `<a class="tc-link" href="#/coding/${id}">${label}</a>`).join('');
      return `${i ? '<span class="tc-arrow">→</span>' : ''}
        <div class="tc-step">
          <div class="tc-head"><b>${s.n}</b>${s.title}</div>
          <p>${s.scene}</p>
          <div class="tc-links">${links}</div>
        </div>`;
    }).join('');
    el.insertAdjacentHTML('beforeend', `
      <section class="taskchain">
        <h2>实战任务链 · 带着任务用技能</h2>
        <p class="tc-sub">课内 8 学时实践按"场景导入—技能训练—场景回扣"组织为四个递进任务；课外在本实验室对应教程中深化，
        综合演练课上集成运用——三级实践，阶梯生成。</p>
        <div class="tc-steps">${chain}</div>
      </section>`);
    for (const g of CGROUPS) {
      const list = (window.CODING || []).filter(t => t.group === g.key);
      if (!list.length) continue;
      const h = document.createElement('h2');
      h.className = 'group-title';
      h.innerHTML = `${g.name} <small>${g.sub}</small>`;
      el.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'cards';
      for (const t of list) {
        const a = document.createElement('a');
        a.className = 'card';
        a.href = '#/coding/' + t.id;
        a.innerHTML = `
          <span class="icon">${t.icon}</span>
          <h3>${t.title}</h3>
          <p>${t.goal}</p>
          <span class="tags">
            <span class="tag lv">${t.level}</span>
            <span class="tag">${t.time}</span>
          </span>`;
        grid.appendChild(a);
      }
      el.appendChild(grid);
    }
  }

  function renderCodingTutorial(id) {
    const t = CODING.find(t => t.id === id);
    const el = app();
    el.innerHTML = `
      <div class="demo-head">
        <a class="back" href="#/coding">← 返回编程实验室</a>
        <h1>${t.title}</h1>
        <div class="tags">
          <span class="tag lv">${t.level}</span>
          <span class="tag">${t.time}</span>
        </div>
      </div>
      <div class="tut">
        <div class="tut-sec"><h3>实验目标</h3><p>${t.goal}</p></div>
        <div class="tut-sec"><h3>所需输入数据</h3><p>${t.data}</p></div>
        <div class="tut-sec"><h3>环境依赖</h3><pre><code>${escapeHtml(t.env)}</code></pre></div>
        <div class="tut-sec"><h3>处理步骤</h3><ol class="steps">${t.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
        ${t.code ? `<div class="tut-sec"><h3>参考代码</h3><pre class="code"><code>${escapeHtml(t.code)}</code></pre></div>` : ''}
        <div class="tut-sec"><h3>参考资源</h3>
          <div class="refs">${t.refs.map(([n, u, d]) =>
            `<a class="ref" href="${u}" target="_blank" rel="noopener"><b>${n}</b><span>${d}</span></a>`).join('')}
          </div>
        </div>
        <div class="tut-sec think"><h3>实验思考</h3><p>${t.think}</p></div>
      </div>`;
  }

  function renderAbout() {
    currentDemo = null;
    app().innerHTML = `
      <div class="about">
        <h1>关于本实验室</h1>
        <p>本站点是《遥感技术基础》课程"AI线上实验室"的配套资源，分三个部分：<b>课程知识图谱</b>按"信号—数据—信息—决策"
        知识链组织6个模块15次理论课，上层课次图谱标明概念间的逻辑关系与因果链条，支持按专业学习路径
        分强相关、中相关、弱相关三级高亮显示（覆盖测绘工程、遥感科学与技术、导航工程、地理空间信息工程、XX环境工程、
        地理科学6个专业）；下层知识点串联图谱把蕴藏在课次内的45个知识点以圆形节点相连成链，点击任一知识点
        即可查看释义、所属课次与配套资源；<b>概念口袋实验室</b>覆盖全课程6个模块15次理论课，每次课至少配套一个可交互演示；
        <b>编程口袋实验室</b>把概念变成上机实验，覆盖遥感图像处理基础、深度学习七大任务与大模型应用，
        每个实验标明输入数据与处理步骤，基础实验附完整可运行代码，首页实战任务链把四个递进任务与对应教程串成一线。</p>
        <section class="impact-evidence" aria-labelledby="impact-title">
          <div class="impact-heading">
            <div>
              <span class="impact-eyebrow">教学成效证据</span>
              <h2 id="impact-title">从交互次数到多维验证</h2>
              <p>课程组面向四届授课学员与课程主讲教师开展调研，结合课堂观察和作业成果分析，形成可追踪、可复核的教学成效证据链。</p>
            </div>
            <div class="impact-lead"><strong>23.6</strong><span>人均完成交互实验</span><small>四届课程调研数据</small></div>
          </div>
          <div class="impact-kpis">
            <div class="impact-kpi accent"><strong>23.6</strong><span>人均完成交互实验</span><small>核心成效指标</small></div>
            <div class="impact-kpi"><strong>286</strong><span>授课学员</span><small>四届覆盖样本</small></div>
            <div class="impact-kpi"><strong>4</strong><span>覆盖届次</span><small>连续跟踪</small></div>
            <div class="impact-kpi"><strong>3</strong><span>课程主讲教师</span><small>教师视角交叉验证</small></div>
          </div>
          <div class="impact-grid">
            <section class="impact-panel">
              <div class="impact-panel-head"><h3>典型交互行为链</h3><span>点击查看</span></div>
              <p class="impact-panel-intro">交互实验把抽象概念拆成连续动作：定位知识、改变参数、观察结果，再回到资源与任务。</p>
              <div class="interaction-steps" id="interaction-steps">
                <button type="button" class="interaction-step" data-step="0"><b>01</b><span>点击知识节点</span></button>
                <button type="button" class="interaction-step" data-step="1"><b>02</b><span>拖动参数</span></button>
                <button type="button" class="interaction-step" data-step="2"><b>03</b><span>观察即时变化</span></button>
                <button type="button" class="interaction-step" data-step="3"><b>04</b><span>关联实验资源</span></button>
              </div>
              <div class="interaction-readout" id="interaction-readout" aria-live="polite"><b>等待操作</b><span>点击上方任一环节，查看它如何把概念变成可观察证据。</span></div>
              <div class="interaction-progress"><div><i id="interaction-progress-bar"></i></div><span id="interaction-progress-text">已查看 0 / 4 个环节</span></div>
              <small class="impact-method-note">交互行为链是平台操作机制示意，不等同于 23.6 次的统计口径。</small>
            </section>
            <section class="impact-panel">
              <div class="impact-panel-head"><h3>多维度交叉验证</h3><span>3 类证据来源</span></div>
              <p class="impact-panel-intro">同一教学成效由不同材料相互印证，点击证据来源查看对应观察对象与分析材料。</p>
              <div class="validation-tabs" id="validation-tabs">
                <button type="button" class="validation-tab on" data-evidence="survey">学员调研</button>
                <button type="button" class="validation-tab" data-evidence="observe">课堂观察</button>
                <button type="button" class="validation-tab" data-evidence="work">作业成果</button>
              </div>
              <div class="validation-detail" id="validation-detail" aria-live="polite"></div>
              <div class="validation-flow"><span>对象</span><b>→</b><span>证据</span><b>→</b><span>交叉验证</span></div>
            </section>
          </div>
          <p class="impact-footnote"><b>调研范围：</b>四届 286 名授课学员、3 名课程主讲教师；围绕专业、课程与学情等要素，辅以课堂观察、作业成果分析开展多维度交叉验证。</p>
        </section>
        <h2>使用建议</h2>
        <p>课前：浏览对应演示，建立直观印象；课中：配合教师演示，预测参数变化的结果；课后：用"考一考"
        等功能自我检验。所有计算均在浏览器本地完成，无需安装任何软件。</p>
        <h2>技术说明</h2>
        <p>纯静态站点（HTML + CSS + 原生 JavaScript + Canvas 2D），无第三方依赖，可直接部署到
        GitHub Pages 或任意静态托管；也可用 <code>python3 -m http.server</code> 在本地打开。</p>
      </div>`;
    const interactionCopy = [
      ['点击知识节点', '从知识图谱中定位概念，先建立“它处在课程哪里”的整体认识。'],
      ['拖动参数', '改变温度、波段、角度或权重等参数，让抽象机理进入可操作状态。'],
      ['观察即时变化', '通过曲线、影像、读数或动画反馈，形成对因果关系的直观判断。'],
      ['关联实验资源', '沿当前知识点跳转概念演示、编程教程或实战任务，完成迁移应用。']
    ];
    const evidenceCopy = {
      survey: ['学员调研', '对象：四届 286 名授课学员。', '材料：围绕专业、课程与学情等要素采集使用反馈与学习体验。'],
      observe: ['课堂观察', '对象：课程实施过程。', '材料：记录知识图谱定位、参数操作、课堂讨论和演示反馈等现场行为。'],
      work: ['作业成果', '对象：课程作业与实践产出。', '材料：分析概念是否转化为波段运算、图像处理、分类和变化检测等步骤。']
    };
    const interactionButtons = document.querySelectorAll('#interaction-steps [data-step]');
    const interactionReadout = document.getElementById('interaction-readout');
    const interactionBar = document.getElementById('interaction-progress-bar');
    const interactionText = document.getElementById('interaction-progress-text');
    const visitedSteps = new Set();
    interactionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.step);
        visitedSteps.add(index);
        interactionButtons.forEach(item => item.classList.toggle('on', item === button));
        interactionReadout.innerHTML = '<b>' + interactionCopy[index][0] + '</b><span>' + interactionCopy[index][1] + '</span>';
        interactionBar.style.width = (visitedSteps.size / interactionCopy.length * 100) + '%';
        interactionText.textContent = '已查看 ' + visitedSteps.size + ' / ' + interactionCopy.length + ' 个环节';
      });
    });
    const validationTabs = document.querySelectorAll('#validation-tabs [data-evidence]');
    const validationDetail = document.getElementById('validation-detail');
    function renderEvidence(key) {
      const item = evidenceCopy[key];
      validationDetail.innerHTML = '<strong>' + item[0] + '</strong><span>' + item[1] + '</span><span>' + item[2] + '</span>';
      validationTabs.forEach(tab => tab.classList.toggle('on', tab.dataset.evidence === key));
    }
    validationTabs.forEach(tab => tab.addEventListener('click', () => renderEvidence(tab.dataset.evidence)));
    renderEvidence('survey');
  }
})();
