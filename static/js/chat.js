(function () {
  const API_URL = 'https://andreagemelli-chat.vercel.app/api/chat';
  let history = [];

  function renderText(text) {
    const div = document.createElement('div');
    // Split on markdown links [label](url) and render the rest as plain text
    const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    parts.forEach(function (part) {
      const m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (m) {
        const a = document.createElement('a');
        a.href = m[2];
        a.textContent = m[1];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        div.appendChild(a);
      } else if (part) {
        div.appendChild(document.createTextNode(part));
      }
    });
    return div;
  }

  async function ask(text, onReply, onError, onDone) {
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
    } finally {
      if (onDone) onDone();
    }
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
        <div id="ck-input-row">
          <input id="ck-input" type="text" placeholder="Ask me about my research, projects, or background…" maxlength="500" autocomplete="off" />
          <button id="ck-send" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div id="ck-messages" role="log" aria-live="polite"></div>
        <div id="ck-footer">
          <span id="ck-hint"><kbd>Esc</kbd> to close</span>
          <span id="ck-disclaimer">AI assistant — not the real Andrea. <a href="https://www.linkedin.com/in/andrea-gemelli/" target="_blank" rel="noopener">LinkedIn</a> for real talks.</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#ck-input');
    const send  = overlay.querySelector('#ck-send');
    const msgs  = overlay.querySelector('#ck-messages');

    function open(prefill) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (prefill) input.value = prefill;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

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
      const div = document.createElement('div');
      div.className = 'ck-msg ck-msg--' + role;
      div.appendChild(renderText(text));
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
      return div;
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
      const thinking = addMsg('assistant', '…');
      ask(
        text,
        function (reply) { setMsg(thinking, reply); },
        function (err)   { setMsg(thinking, err, 'ck-msg--error'); },
        function ()      { input.disabled = false; send.disabled = false; input.focus(); }
      );
    }

    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });

    return open;
  }

  // ── Homepage inline input (launcher only — opens overlay) ───────────────

  function buildInline(openOverlay, getOverlayInput) {
    const profile = document.querySelector('.profile_inner');
    if (!profile) return;

    const wrap = document.createElement('div');
    wrap.id = 'inline-chat';
    wrap.innerHTML = `
      <div id="inline-input-row">
        <input id="inline-input" type="text" placeholder="Ask me anything…" maxlength="500" autocomplete="off" />
        <button id="inline-send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>`;
    profile.appendChild(wrap);

    const input = wrap.querySelector('#inline-input');
    const send  = wrap.querySelector('#inline-send');

    function launch() {
      const text = input.value.trim();
      input.value = '';
      openOverlay(text);
    }

    input.addEventListener('focus', function () { openOverlay(''); });
    send.addEventListener('click', launch);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); launch(); }
    });
  }

  // ── Triggers: desktop ⌘K hint + mobile pill ──────────────────────────────

  function buildTriggers(openOverlay) {
    // Desktop: subtle ⌘K badge (hidden on mobile via CSS)
    const hint = document.createElement('button');
    hint.id = 'desktop-ask';
    hint.setAttribute('aria-label', 'Chat with Andrea (⌘K)');
    hint.innerHTML = '<kbd>⌘K</kbd><span>Ask Andrea</span>';
    hint.addEventListener('click', openOverlay);
    document.body.appendChild(hint);

    // Mobile: text pill (hidden on desktop via CSS)
    const pill = document.createElement('button');
    pill.id = 'mobile-ask';
    pill.innerHTML = 'Ask Andrea <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    pill.setAttribute('aria-label', 'Chat with Andrea');
    pill.addEventListener('click', openOverlay);
    document.body.appendChild(pill);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    const openOverlay = buildOverlay();
    const onHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    if (onHome) buildInline(openOverlay);
    buildTriggers(openOverlay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
