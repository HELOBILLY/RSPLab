/* 遥感前沿论坛 —— 论坛大厅、辩题详情与人机热身模拟器 */
(function () {
  const Forum = {};
  window.ForumPage = Forum;

  const app = () => document.getElementById('app');
  const byId = id => (window.FORUM || []).find(t => t.id === id);
  const VMAP = { strong: ['有力回应', 'v-strong'], mid: ['尚可成立', 'v-mid'], weak: ['偏弱', 'v-weak'] };

  /* ---------------- 论坛大厅 ---------------- */
  Forum.renderLobby = function () {
    const el = app();
    const total = (window.FORUM || []).length;
    el.innerHTML = `
      <section class="hero">
        <h1>遥感前沿论坛 · 让每一次学习都伴随思考</h1>
        <p>这里把课堂打造成前沿论坛：每单元设置 1 次论坛，围绕前沿性与思辨性主题分组辩论。
        辩论前先用"人机热身"与 AI 过招——AI 扮演对方逐条质疑，你在回应中完善论据；
        再进入组间辩论，人人交锋；最后教师点评升华，把散落的思考凝练为方法。
        全部辩题均为公开领域议题，点开卡片即可开始热身。</p>
        <div class="stat-row">
          <div class="stat"><b>${total}</b><span>个思辨辩题</span></div>
          <div class="stat"><b>3</b><span>轮人机热身</span></div>
          <div class="stat"><b>1</b><span>次论坛 / 每单元</span></div>
          <div class="stat"><b>6</b><span>章全覆盖</span></div>
        </div>
      </section>
      <h2 class="group-title">论坛三步法 <small>人机热身 → 人人交锋 → 教师升华</small></h2>
      <div class="flow-steps">
        <div class="flow-step"><span class="step-no">1</span><h3>人机热身</h3>
          <p>辩论前先与 AI 大模型过招：AI 扮演对方提出质疑，你在回应中完善论据，同时树立不盲从 AI 的批判意识。</p></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><span class="step-no">2</span><h3>人人交锋</h3>
          <p>带着热身中打磨的论据进入组间辩论，在真实交锋中学会倾听、回应与说服。</p></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><span class="step-no">3</span><h3>教师升华</h3>
          <p>教师点评辩论中的典型观点，把散落的思考凝练为方法，把前沿的争论引向价值塑造。</p></div>
      </div>
      <h2 class="group-title">辩题库 <small>每单元 1 题 · 点击卡片查看双方论点并进入人机热身</small></h2>`;
    const grid = document.createElement('div');
    grid.className = 'cards';
    for (const t of window.FORUM || []) {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = '#/forum/' + t.id;
      a.innerHTML = `
        <span class="icon">${t.icon}</span>
        <h3>${t.title}</h3>
        <p>${t.background.slice(0, 52)}……</p>
        <span class="tags">
          <span class="tag ses">${t.chapter}</span>
          <span class="tag lv">${t.dimension}</span>
        </span>`;
      grid.appendChild(a);
    }
    el.appendChild(grid);
  };

  /* ---------------- 辩题详情 + 人机热身 ---------------- */
  Forum.renderTopic = function (id) {
    const t = byId(id);
    if (!t) { location.hash = '#/forum'; return; }
    const el = app();
    const youSide = t.you === 'a' ? t.a : t.b;
    const aiSide = t.you === 'a' ? t.b : t.a;
    el.innerHTML = `
      <div class="demo-head">
        <a class="back" href="#/forum">← 返回辩题库</a>
        <h1>${t.title}</h1>
        <div class="tags">
          <span class="tag ses">${t.chapter}</span>
          <span class="tag lv">${t.dimension}</span>
        </div>
      </div>
      <div class="concept-box"><b>背景情境｜</b>${t.background}</div>
      <div class="sides">
        <div class="side-col">
          <h4>立场一 · ${t.a.name}${t.you === 'a' ? '<span class="you-badge">热身中你持此方</span>' : ''}</h4>
          <ol>${t.a.points.map(p => `<li>${p}</li>`).join('')}</ol>
        </div>
        <div class="side-col alt">
          <h4>立场二 · ${t.b.name}${t.you === 'b' ? '<span class="you-badge">热身中你持此方</span>' : ''}</h4>
          <ol>${t.b.points.map(p => `<li>${p}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="know-row">关联知识点：${t.knowledge.map(k => `<span class="tag">${k}</span>`).join('')}</div>

      <div class="debate-box">
        <h3>人机热身 · 与 AI 过招</h3>
        <p class="db-tip">本场热身中，你持 <b>${youSide.name}</b>，AI 扮演 <b>${aiSide.name}</b>。
        AI 将抛出 ${t.rounds.length} 轮质询，每轮从 3 张论点卡中选择你的回应；选完后可展开查看其他回应的交锋结果。</p>
        <div class="chat" id="chat"></div>
        <div class="db-actions" id="dbActions"><button class="primary" id="startBtn">开始热身</button></div>
      </div>

      <div class="tut-sec think">
        <h3>教师升华示例</h3><p>${t.insight}</p>
      </div>`;

    const chat = el.querySelector('#chat');
    const actions = el.querySelector('#dbActions');
    let round = 0;

    function addMsg(cls, html) {
      const d = document.createElement('div');
      d.className = 'msg ' + cls;
      d.innerHTML = html;
      chat.appendChild(d);
      return d;
    }

    function startRound() {
      const r = t.rounds[round];
      addMsg('ai', `<b>AI 质询 · 第 ${round + 1} 轮</b><p>${r.q}</p>`);
      const cards = document.createElement('div');
      cards.className = 'arg-cards';
      r.cards.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'arg-card';
        b.innerHTML = `<span class="ac-no">${'ABC'[i]}</span><span>${c.t}</span>`;
        b.addEventListener('click', () => pick(i, cards));
        cards.appendChild(b);
      });
      chat.appendChild(cards);
      actions.innerHTML = '';
      cards.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function pick(i, cardsEl) {
      const r = t.rounds[round];
      const c = r.cards[i];
      const [vlabel, vcls] = VMAP[c.v];
      cardsEl.querySelectorAll('.arg-card').forEach((b, j) => {
        b.disabled = true;
        b.classList.add(j === i ? 'picked' : 'dim');
      });
      addMsg('you', `<b>你的回应</b><p>${c.t}</p>`);
      addMsg('ai', `<b>AI 反驳</b>${c.r ? `<p>${c.r}</p>` : '<p>（这一轮 AI 没有有效反驳——你的论点接住了质询。）</p>'}
        <div class="verdict ${vcls}">点评：${vlabel}｜${c.c}</div>`);
      const rest = r.cards.filter((_, j) => j !== i);
      const others = document.createElement('details');
      others.className = 'others';
      others.innerHTML = `<summary>查看另外 ${rest.length} 张论点卡的交锋结果</summary>` +
        rest.map(x => {
          const [vl, vc] = VMAP[x.v];
          return `<div class="other-card"><p><b>${x.t}</b></p>` +
            (x.r ? `<p class="o-r">AI 反驳：${x.r}</p>` : '') +
            `<p class="o-c"><span class="verdict ${vc}">${vl}</span>${x.c}</p></div>`;
        }).join('');
      chat.appendChild(others);

      round++;
      actions.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'primary';
      if (round < t.rounds.length) {
        btn.textContent = `进入第 ${round + 1} 轮质询`;
        btn.addEventListener('click', startRound);
      } else {
        btn.textContent = '查看热身小结';
        btn.addEventListener('click', finish);
      }
      actions.appendChild(btn);
    }

    function finish() {
      addMsg('ai', `<b>热身小结</b><p>${t.summary}</p>`);
      const pb = document.createElement('div');
      pb.className = 'prompt-box';
      pb.innerHTML = `
        <h4>用真实 AI 继续过招</h4>
        <p>把下面这段提示词复制到任意 AI 大模型对话中，即可围绕本辩题继续人机辩论（真实课堂中，学员用学校许可的 AI 工具完成这一环节）：</p>
        <pre><code>${t.prompt}</code></pre>
        <button class="primary" id="copyBtn">复制提示词</button><span class="copy-ok" id="copyOk"></span>`;
      chat.appendChild(pb);
      pb.querySelector('#copyBtn').addEventListener('click', () => {
        const done = () => { pb.querySelector('#copyOk').textContent = '已复制到剪贴板'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t.prompt).then(done).catch(() => { fallbackCopy(); done(); });
        } else { fallbackCopy(); done(); }
        function fallbackCopy() {
          const ta = document.createElement('textarea');
          ta.value = t.prompt; document.body.appendChild(ta);
          ta.select(); document.execCommand('copy'); ta.remove();
        }
      });
      actions.innerHTML = '';
      const again = document.createElement('button');
      again.textContent = '重新热身';
      again.addEventListener('click', () => Forum.renderTopic(id));
      actions.appendChild(again);
      pb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    el.querySelector('#startBtn').addEventListener('click', startRound);
  };
})();
