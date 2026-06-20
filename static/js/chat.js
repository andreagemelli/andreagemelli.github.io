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

  async function ask(text, onChunk, onError, onDone) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error || 'Something went wrong.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') {
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: full });
            if (history.length > 12) history = history.slice(-12);
            continue;
          }
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) { onError(parsed.error); return; }
            if (parsed.text) { full += parsed.text; onChunk(full); }
          } catch {}
        }
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
      const bubble = addMsg('assistant', '');
      bubble.classList.add('ck-msg--streaming');
      ask(
        text,
        function (full) { setMsg(bubble, full); },
        function (err)  { setMsg(bubble, err, 'ck-msg--error'); },
        function ()     { bubble.classList.remove('ck-msg--streaming'); input.disabled = false; send.disabled = false; input.focus(); }
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
