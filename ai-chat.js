// AI Chat Assistant — powered by 硅基流动 (SiliconFlow)
(function () {
    const SF_BASE = 'https://api.siliconflow.cn/v1';

    const SF_MODEL = 'Pro/deepseek-ai/DeepSeek-V3.2';

    const state = {
        open: false,
        messages: [],   // conversation history (excluding system prompt)
        siteData: null,
        msgCounter: 0
    };

    function getApiKey() { return state.siteData?.ai?.apiKey || ''; }

    /* ── Init ────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async function () {
        // Pre-load data.json so it's ready to inject into every request
        try {
            const res = await fetch('data.json?t=' + Date.now());
            if (res.ok) state.siteData = await res.json();
        } catch (_) {}

        // Event bindings
        document.getElementById('aiChatBtn').addEventListener('click', togglePanel);
        document.getElementById('aiCloseBtn').addEventListener('click', togglePanel);
        document.getElementById('aiClearBtn').addEventListener('click', clearChat);
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
        if (state.open) document.getElementById('aiChatInput').focus();
    }

    function clearChat() {
        state.messages = [];
        document.getElementById('aiChatMessages').innerHTML = welcomeHtml();
    }

    /* ── System prompt ───────────────────────────────── */

    function buildSystemPrompt() {
        const data = state.siteData;
        if (!data) return `你现在扮演的是${name}（${nameEn}）本人，请用中文回答用户的问题。`;        // 使用管理员在 admin 中配置的自定义提示词（若有）
        if (data.ai?.systemPrompt) return data.ai.systemPrompt;        const name = data.profile?.name || '贺海旭';
        const nameEn = data.profile?.nameEn || 'Haixu He';
        return `你现在扮演 ${name}（${nameEn}）本人。以下是你的完整个人信息（JSON格式），请严格基于这些信息，以第一人称"我"与用户交流，语气自然、亲切、专业。

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

角色要求：
- 始终以"我"自称，你就是 ${name} 本人
- 用第一人称介绍自己的研究、论文、经历等
- 保持谦逊、友好、学术严谨的风格，使用中文
- 严格基于上述数据回答，不编造任何信息
- 若被问到数据中没有的内容，可以说"这方面我暂时不便透露"或"你可以通过邮件联系我了解更多"
- 对于论文，可主动提供标题、期刊、DOI、代码链接等详细信息`;
    }

    /* ── Send message ────────────────────────────────── */

    async function sendMessage() {
        const input  = document.getElementById('aiChatInput');
        const text   = input.value.trim();
        if (!text) return;

        if (!getApiKey()) {
            appendAiMsg('AI 助手暂时无法使用，请联系站点管理员。', 'error');
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
            model: SF_MODEL,
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
        const name = state.siteData?.profile?.name || '我';
        return `<div class="ai-chat-msg ai-msg">
            <div class="ai-avatar"><i class="fas fa-robot"></i></div>
            <div class="ai-bubble">你好！我是 ${escHtml(name)}，很高兴认识你！你可以问我关于我的研究方向、发表论文、教育背景等任何问题。</div>
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
