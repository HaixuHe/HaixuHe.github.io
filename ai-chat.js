// AI Chat Assistant — powered by 硅基流动 (SiliconFlow)
(function () {
    const SF_BASE = 'https://api.siliconflow.cn/v1';

    const state = {
        open: false,
        settingsOpen: false,
        messages: [],   // conversation history (excluding system prompt)
        siteData: null,
        msgCounter: 0
    };

    function getApiKey() { return localStorage.getItem('sf_api_key') || ''; }
    function getModel()  { return localStorage.getItem('sf_model')   || 'deepseek-ai/DeepSeek-V3'; }

    /* ── Init ────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async function () {
        // Pre-load data.json so it's ready to inject into every request
        try {
            const res = await fetch('data.json?t=' + Date.now());
            if (res.ok) state.siteData = await res.json();
        } catch (_) {}

        // Restore saved settings into the form
        document.getElementById('sfApiKey').value = getApiKey();
        const sel = document.getElementById('sfModel');
        if (getModel()) sel.value = getModel();

        // Event bindings
        document.getElementById('aiChatBtn').addEventListener('click', togglePanel);
        document.getElementById('aiCloseBtn').addEventListener('click', togglePanel);
        document.getElementById('aiSettingsBtn').addEventListener('click', toggleSettings);
        document.getElementById('aiClearBtn').addEventListener('click', clearChat);
        document.getElementById('aiSaveSettings').addEventListener('click', saveSettings);
        document.getElementById('aiSendBtn').addEventListener('click', sendMessage);

        const input = document.getElementById('aiChatInput');
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
        input.addEventListener('input', autoResize);
    });

    /* ── Panel / Settings toggle ─────────────────────── */

    function togglePanel() {
        state.open = !state.open;
        document.getElementById('aiChatPanel').classList.toggle('open', state.open);
        if (!state.open && state.settingsOpen) {
            state.settingsOpen = false;
            document.getElementById('aiSettingsArea').classList.remove('open');
        }
        if (state.open) document.getElementById('aiChatInput').focus();
    }

    function toggleSettings() {
        state.settingsOpen = !state.settingsOpen;
        document.getElementById('aiSettingsArea').classList.toggle('open', state.settingsOpen);
    }

    function saveSettings() {
        localStorage.setItem('sf_api_key', document.getElementById('sfApiKey').value.trim());
        localStorage.setItem('sf_model',   document.getElementById('sfModel').value);
        state.settingsOpen = false;
        document.getElementById('aiSettingsArea').classList.remove('open');
        showToast('设置已保存');
    }

    function clearChat() {
        state.messages = [];
        document.getElementById('aiChatMessages').innerHTML = welcomeHtml();
    }

    /* ── System prompt ───────────────────────────────── */

    function buildSystemPrompt() {
        const data = state.siteData;
        if (!data) return '你是一个AI学术助手，请用中文回答用户的问题。';
        const name = data.profile?.name || '贺海旭';
        return `你是"${name}"个人学术主页的AI助手。以下是该主页的完整数据（JSON格式），请严格基于这些信息回答用户问题，保持专业、简洁、友好，使用中文。

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

回答时请注意：
- 直接引用数据中的事实，不要编造
- 若问题超出数据范围，请如实告知
- 对于论文，可提供标题、期刊、DOI、代码链接等详细信息`;
    }

    /* ── Send message ────────────────────────────────── */

    async function sendMessage() {
        const input  = document.getElementById('aiChatInput');
        const text   = input.value.trim();
        if (!text) return;

        if (!getApiKey()) {
            appendAiMsg('请先点击右上角 <i class="fas fa-key"></i> 图标，填写硅基流动 API Key。', 'error');
            if (!state.settingsOpen) toggleSettings();
            return;
        }

        input.value = '';
        input.style.height = 'auto';
        appendUserMsg(text);
        state.messages.push({ role: 'user', content: text });

        // Thinking indicator
        const thinkId = appendAiMsg(
            '<span class="ai-thinking"><span></span><span></span><span></span></span>', ''
        );
        document.getElementById('aiSendBtn').disabled = true;

        const payload = {
            model: getModel(),
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...state.messages
            ],
            stream: true,
            max_tokens: 2048,
            temperature: 0.7
        };

        try {
            const res = await fetch(`${SF_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getApiKey()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }

            removeMsg(thinkId);
            const replyId = appendAiMsg('', '');
            const bubble  = document.querySelector(`#${replyId} .ai-bubble`);
            const msgBox  = document.getElementById('aiChatMessages');
            let fullText  = '';

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split('\n')) {
                    if (!line.startsWith('data: ')) continue;
                    const raw = line.slice(6).trim();
                    if (raw === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(raw);
                        const delta  = parsed.choices?.[0]?.delta?.content || '';
                        fullText += delta;
                        bubble.innerHTML = formatMd(fullText);
                        msgBox.scrollTop = msgBox.scrollHeight;
                    } catch (_) {}
                }
            }

            state.messages.push({ role: 'assistant', content: fullText });

        } catch (e) {
            removeMsg(thinkId);
            appendAiMsg(`请求失败：${escHtml(e.message)}`, 'error');
            state.messages.pop();
        } finally {
            document.getElementById('aiSendBtn').disabled = false;
        }
    }

    /* ── DOM helpers ─────────────────────────────────── */

    function welcomeHtml() {
        const name = state.siteData?.profile?.name || '该研究者';
        return `<div class="ai-chat-msg ai-msg">
            <div class="ai-avatar"><i class="fas fa-robot"></i></div>
            <div class="ai-bubble">你好！我是 ${escHtml(name)} 主页的 AI 助手，可以回答关于论文、研究方向、教育背景等问题。试着问我：「有哪些论文？」</div>
        </div>`;
    }

    function appendUserMsg(text) {
        const id = 'aim' + (++state.msgCounter);
        const container = document.getElementById('aiChatMessages');
        const el = document.createElement('div');
        el.id        = id;
        el.className = 'ai-chat-msg user-msg';
        el.innerHTML = `<div class="ai-bubble">${escHtml(text).replace(/\n/g, '<br>')}</div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function appendAiMsg(html, extraClass) {
        const id = 'aim' + (++state.msgCounter);
        const container = document.getElementById('aiChatMessages');
        const el = document.createElement('div');
        el.id        = id;
        el.className = 'ai-chat-msg ai-msg' + (extraClass ? ' ' + extraClass : '');
        el.innerHTML =
            `<div class="ai-avatar"><i class="fas fa-robot"></i></div>` +
            `<div class="ai-bubble">${html}</div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function removeMsg(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function autoResize() {
        const el = document.getElementById('aiChatInput');
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }

    /* ── Markdown renderer ───────────────────────────── */

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatMd(raw) {
        // 1. Split on fenced code blocks (protect them first)
        const parts = raw.split(/(```[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (idx % 2 === 1) {
                // Code block
                const code = part
                    .replace(/^```\w*\n?/, '')
                    .replace(/\n?```$/, '');
                return `<pre><code>${escHtml(code)}</code></pre>`;
            }

            // Regular text — escape HTML first, then apply inline markdown
            let t = escHtml(part);

            // Inline code
            t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
            // Bold
            t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic
            t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Headers → bold
            t = t.replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>');
            // Unordered list items
            t = t.replace(/^[-*] (.+)$/gm, '&bull;&nbsp;$1');
            // Ordered list items
            t = t.replace(/^(\d+)\. (.+)$/gm, '$1.&nbsp;$2');
            // Line breaks
            t = t.replace(/\n/g, '<br>');

            return t;
        }).join('');
    }

    /* ── Toast ───────────────────────────────────────── */

    function showToast(msg) {
        const t = document.createElement('div');
        t.className   = 'ai-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 2200);
    }
})();
