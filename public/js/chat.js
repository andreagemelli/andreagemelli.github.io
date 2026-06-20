(function () {
  const API_URL = 'https://andreagemelli-chat.vercel.app/api/chat';
  let history = [];

  function renderText(text) {
    const div = document.createElement('div');

    function appendInline(parent, str) {
      // Split on **bold** and [link](url)
      const parts = str.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
      parts.forEach(function (part) {
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (link) {
          const a = document.createElement('a');
          a.href = link[2];
          a.textContent = link[1];
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          parent.appendChild(a);
        } else if (bold) {
          const b = document.createElement('strong');
          b.textContent = bold[1];
          parent.appendChild(b);
        } else if (part) {
          parent.appendChild(document.createTextNode(part));
        }
      });
    }

    const lines = text.split('\n');
    let ul = null;
    lines.forEach(function (line) {
      const listMatch = line.match(/^[-*]\s+(.+)/);
      if (listMatch) {
        if (!ul) { ul = document.createElement('ul'); div.appendChild(ul); }
        const li = document.createElement('li');
        appendInline(li, listMatch[1]);
        ul.appendChild(li);
      } else {
        ul = null;
        if (line.trim() === '') {
          div.appendChild(document.createElement('br'));
        } else {
          const p = document.createElement('p');
          appendInline(p, line);
          div.appendChild(p);
        }
      }
    });

    return div;
  }

  async function ask(text, onReply, onError) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || 'Something went wrong.');
      } else {
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: data.reply });
        if (history.length > 12) history = history.slice(-12);
        onReply(data.reply);
      }
    } catch {
      onError('Network error. Please try again.');
    }
  }

  function typewrite(bubble, text, onDone) {
    const words = text.split(' ');
    let i = 0;
    bubble.classList.add('ck-msg--streaming');
    bubble.textContent = '';

    function next() {
      if (i >= words.length) {
        bubble.classList.remove('ck-msg--streaming');
        bubble.innerHTML = '';
        bubble.appendChild(renderText(text));
        if (onDone) onDone();
        return;
      }
      bubble.textContent += (i === 0 ? '' : ' ') + words[i];
      i++;
      setTimeout(next, 28);
    }
    next();
  }

  // ── ⌘K Overlay (all pages) ───────────────────────────────────────────────

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ck-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Chat with Andrea');
    overlay.innerHTML = `
      <div id="ck-panel">
        <div id="ck-top-bar"><button id="ck-close" aria-label="Close">&times;</button></div>
        <div id="ck-messages" role="log" aria-live="polite">
          <div id="ck-welcome">
            <div id="ck-welcome-avatar">🤖</div>
            <div>
              <div class="ck-msg-name">AIndrea</div>
              <div class="ck-msg ck-msg--assistant">Hi! Nice to meet you 🤗</div>
            </div>
          </div>
        </div>
        <div id="ck-bottom">
          <div id="ck-input-row">
            <input id="ck-input" type="text" placeholder="Ask Andrea…" maxlength="500" autocomplete="off" />
            <button id="ck-send" aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div id="ck-disclaimer">Not the real Andrea — <a href="https://www.linkedin.com/in/andrea-gemelli/" target="_blank" rel="noopener">LinkedIn</a> for real conversations.</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#ck-input');
    const send  = overlay.querySelector('#ck-send');
    const msgs  = overlay.querySelector('#ck-messages');

    function open(prefill) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (typeof prefill === 'string' && prefill) input.value = prefill;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    overlay.querySelector('#ck-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        overlay.classList.contains('open') ? close() : open('');
      }
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    function addMsg(role, text) {
      msgs.classList.add('has-messages');
      const bubble = document.createElement('div');
      bubble.className = 'ck-msg ck-msg--' + role;
      bubble.appendChild(renderText(text));

      if (role === 'assistant') {
        const row = document.createElement('div');
        row.className = 'ck-msg-row';
        const avatar = document.createElement('div');
        avatar.className = 'ck-msg-avatar';
        avatar.textContent = '🤖';
        const inner = document.createElement('div');
        inner.className = 'ck-msg-wrap ck-msg-wrap--assistant';
        const name = document.createElement('div');
        name.className = 'ck-msg-name';
        name.textContent = 'AIndrea';
        inner.appendChild(name);
        inner.appendChild(bubble);
        row.appendChild(avatar);
        row.appendChild(inner);
        msgs.appendChild(row);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'ck-msg-wrap ck-msg-wrap--user';
        wrap.appendChild(bubble);
        msgs.appendChild(wrap);
      }

      msgs.scrollTop = msgs.scrollHeight;
      return bubble;
    }

    function setMsg(div, text, extraClass) {
      div.innerHTML = '';
      if (extraClass) div.classList.add(extraClass);
      div.appendChild(renderText(text));
      msgs.scrollTop = msgs.scrollHeight;
    }

    function submit() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.disabled = true;
      send.disabled = true;
      addMsg('user', text);
      const bubble = addMsg('assistant', '…');
      ask(
        text,
        function (reply) {
          typewrite(bubble, reply, function () {
            msgs.scrollTop = msgs.scrollHeight;
            input.disabled = false;
            send.disabled = false;
            input.focus();
          });
        },
        function (err) {
          bubble.classList.remove('ck-msg--streaming');
          bubble.classList.add('ck-msg--error');
          bubble.textContent = err;
          input.disabled = false;
          send.disabled = false;
          input.focus();
        }
      );
    }

    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    return open;
  }

  // ── Homepage inline input (launcher only — opens overlay) ───────────────

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    var openOverlay = buildOverlay();
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    var btn = document.createElement('button');
    btn.id = 'chat-float-btn';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Ask Andrea <kbd>⌘K</kbd>';
    btn.addEventListener('click', function () { openOverlay(''); });

    if (isHome) {
      var socialIcons = document.querySelector('.social-icons');
      if (socialIcons) {
        socialIcons.parentNode.insertBefore(btn, socialIcons.nextSibling);
      } else {
        (document.querySelector('.profile_inner') || document.body).appendChild(btn);
      }
    } else {
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
