// AI Chat Assistant — powered by 硅基流动 (SiliconFlow)
(function () {
    const SF_BASE = 'https://api.siliconflow.cn/v1';
    const SF_MODEL = 'Pro/deepseek-ai/DeepSeek-V3.2';
    const FOLLOW_UP_MARKER = '\n\n<<<FOLLOW_UP_PROMPTS>>>\n';
    const DEFAULT_PROMPTS = [
        '请先用第一人称简单介绍一下你自己和目前的研究方向。',
        '你最有代表性的论文有哪些？分别解决了什么问题？',
        '如果我想进一步交流或合作，应该如何联系你？'
    ];

    const state = {
        open: false,
        messages: [],   // conversation history (excluding system prompt)
        siteData: null,
        msgCounter: 0,
        promptVersion: 0
    };

    function getApiKey() { return state.siteData?.ai?.apiKey || ''; }

    /* ── Init ────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async function () {
        try {
            const res = await fetch('data.json?t=' + Date.now());
            if (res.ok) state.siteData = await res.json();
        } catch (_) {}

        hydrateChatUi();

        document.getElementById('aiChatBtn').addEventListener('click', togglePanel);
        document.getElementById('aiCloseBtn').addEventListener('click', togglePanel);
        document.getElementById('aiOverlay').addEventListener('click', togglePanel);
        document.getElementById('aiClearBtn').addEventListener('click', clearChat);
        document.getElementById('aiSendBtn').addEventListener('click', sendMessage);
        document.getElementById('aiPromptList').addEventListener('click', handlePromptPresetClick);

        const input = document.getElementById('aiChatInput');
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', autoResize);
    });

    /* ── Panel / Settings toggle ─────────────────────── */

    function togglePanel() {
        state.open = !state.open;
        document.getElementById('aiChatPanel').classList.toggle('open', state.open);
        document.getElementById('aiOverlay').classList.toggle('active', state.open);
        document.getElementById('aiChatBtnWrap').classList.toggle('panel-open', state.open);
        if (state.open) document.getElementById('aiChatInput').focus();
    }

    function clearChat() {
        state.messages = [];
        hydrateChatUi();
    }
    /* ── Title helpers ────────────────────────────── */

    function setTitleTyping() {
        const title = document.querySelector('.ai-chat-title');
        const el = document.getElementById('aiChatTitleText');
        if (title) title.classList.add('is-typing');
        if (el) el.textContent = '对方正在输入…';
    }

    function setTitleNormal() {
        const name = state.siteData?.profile?.name || '贺海旭';
        const title = document.querySelector('.ai-chat-title');
        const el = document.getElementById('aiChatTitleText');
        if (title) title.classList.remove('is-typing');
        if (el) el.textContent = `与${name}的聊天`;
    }
    /* ── System prompt ───────────────────────────────── */

    function buildSystemPrompt() {
        const data = state.siteData;
        const name = data?.profile?.name || '贺海旭';
        const nameEn = data?.profile?.nameEn || 'Haixu He';
        let basePrompt = '';

        if (!data) {
            basePrompt = `你现在扮演 ${name}（${nameEn}）本人，请用中文回答用户的问题。`;
            return `${basePrompt}\n\n${buildFollowUpPromptProtocol()}`;
        }

        if (data.ai?.systemPrompt) {
            basePrompt = data.ai.systemPrompt;
            return `${basePrompt}\n\n${buildFollowUpPromptProtocol()}`;
        }

        basePrompt = `你现在扮演 ${name}（${nameEn}）本人。以下是你的完整个人信息（JSON格式），请严格基于这些信息，以第一人称"我"与用户交流，语气自然、专业、高冷，你仅需要回答用户的问题即可，避免过多废话。

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

角色要求：
- 始终以"我"自称，你就是 ${name} 本人
- 用第一人称介绍自己的研究、论文、经历等
- 保持谦逊、友好、学术、严谨的风格，使用中文
- 严格基于上述数据回答，不可以编造任何信息
- 若被问到数据中没有的内容，可以说"这方面我暂时不便透露"或"你可以通过邮件联系我了解更多"`;

        return `${basePrompt}\n\n${buildFollowUpPromptProtocol()}`;
    }

    function buildFollowUpPromptProtocol() {
        return `每次回答都必须遵循以下输出协议：
- 先正常回答用户问题，回答部分保持自然，不要提及任何格式协议
- 在回答正文末尾，紧跟着单独输出以下标记：${FOLLOW_UP_MARKER.trim()}
- 在该标记下一行只输出一个 JSON 数组，固定包含 3 条中文提问，例如 ["问题1","问题2","问题3"]
- 这 3 条提问必须围绕我的个人成果展开，重点关注研究方向、代表论文、专利、方法创新、应用价值、开源代码或合作交流
- 不要编造数据中没有的信息，不要离题，不要夸张，不要太离谱
- 每条问题控制在 12 到 28 个字之间，适合网页用户直接点击继续提问
- 标记和 JSON 数组后的内容不要再补充任何解释；该部分只给前端程序读取，不展示给用户`;
    }

    /* ── Send message ────────────────────────────────── */

    async function sendMessage(prefilledText) {
        const input = document.getElementById('aiChatInput');
        const text = typeof prefilledText === 'string'
            ? prefilledText.trim()
            : input.value.trim();
        if (!text) return;

        if (!getApiKey()) {
            appendAiMsg('AI 助手暂时无法使用，请联系站点管理员。', 'error');
            return;
        }

        const promptVersion = hidePromptList();
        input.value = '';
        autoResize();
        appendUserMsg(text);
        state.messages.push({ role: 'user', content: text });

        const thinkId = appendAiMsg(
            '<span class="ai-thinking"><span></span><span></span><span></span></span>', ''
        );
        document.getElementById('aiSendBtn').disabled = true;
        setTitleTyping();

        const payload = {
            model: SF_MODEL,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...state.messages
            ],
            enable_thinking: false,
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
            const bubble = document.querySelector(`#${replyId} .ai-bubble`);
            const msgBox = document.getElementById('aiChatMessages');
            let fullText = '';
            const fallbackPrompts = buildAchievementFallbackPrompts(text);

            const reader = res.body.getReader();
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
                        const delta = parsed.choices?.[0]?.delta?.content || '';
                        fullText += delta;
                        const assistantPayload = extractAssistantPayload(fullText);
                        bubble.innerHTML = formatMd(assistantPayload.answerText || '');
                        msgBox.scrollTop = msgBox.scrollHeight;
                    } catch (_) {}
                }
            }

            const finalPayload = extractAssistantPayload(fullText);
            const assistantText = finalPayload.answerText.trim();
            bubble.innerHTML = formatMd(assistantText);
            state.messages.push({ role: 'assistant', content: assistantText });
            restorePromptList(promptVersion, finalPayload.prompts.length ? finalPayload.prompts : fallbackPrompts);
        } catch (e) {
            removeMsg(thinkId);
            appendAiMsg(`请求失败：${escHtml(e.message)}`, 'error');
            state.messages.pop();
            restorePromptList(promptVersion, buildAchievementFallbackPrompts(text));
        } finally {
            document.getElementById('aiSendBtn').disabled = false;
            setTitleNormal();
        }
    }

    /* ── DOM helpers ─────────────────────────────────── */

    function hydrateChatUi() {
        const container = document.getElementById('aiChatMessages');
        const promptList = document.getElementById('aiPromptList');
        if (promptList && promptList.parentNode === container) {
            container.removeChild(promptList);
        }
        container.innerHTML = welcomeHtml();
        if (promptList) container.appendChild(promptList);
        state.promptVersion += 1;
        renderPromptList(getQuickPrompts());
    }

    function getQuickPrompts() {
        const configured = Array.isArray(state.siteData?.ai?.quickPrompts)
            ? state.siteData.ai.quickPrompts
            : [];

        return DEFAULT_PROMPTS.map((fallback, index) => {
            const prompt = typeof configured[index] === 'string' ? configured[index].trim() : '';
            return prompt || fallback;
        });
    }

    function renderQuickPrompts() {
        renderPromptList(getQuickPrompts());
    }

    function renderPromptList(prompts) {
        const list = document.getElementById('aiPromptList');
        if (!list) return;

        list.innerHTML = '';
        list.classList.remove('is-hidden');

        prompts.forEach(prompt => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ai-prompt-chip';
            button.dataset.prompt = prompt;
            button.title = '点击直接发送';
            button.textContent = prompt;
            list.appendChild(button);
        });
    }

    function hidePromptList() {
        const list = document.getElementById('aiPromptList');
        state.promptVersion += 1;
        if (list) {
            list.classList.add('is-hidden');
            list.innerHTML = '';
        }
        return state.promptVersion;
    }

    function restorePromptList(promptVersion, prompts) {
        if (promptVersion !== state.promptVersion) return;
        renderPromptList(prompts);
    }

    function handlePromptPresetClick(event) {
        const button = event.target.closest('.ai-prompt-chip');
        if (!button) return;

        sendMessage(button.dataset.prompt || '');
    }

    function extractAssistantPayload(rawText) {
        const content = String(rawText || '');
        const markerIndex = content.indexOf(FOLLOW_UP_MARKER);
        if (markerIndex >= 0) {
            return {
                answerText: content.slice(0, markerIndex).trimEnd(),
                prompts: normalizePromptSuggestions(content.slice(markerIndex + FOLLOW_UP_MARKER.length), [])
            };
        }

        return {
            answerText: stripPendingMarkerSuffix(content),
            prompts: []
        };
    }

    function stripPendingMarkerSuffix(text) {
        const pendingLength = getPendingMarkerLength(text);
        return pendingLength > 0 ? text.slice(0, -pendingLength) : text;
    }

    function getPendingMarkerLength(text) {
        const maxLength = Math.min(text.length, FOLLOW_UP_MARKER.length - 1);
        for (let length = maxLength; length > 0; length -= 1) {
            if (text.endsWith(FOLLOW_UP_MARKER.slice(0, length))) {
                return length;
            }
        }
        return 0;
    }

    function buildAchievementFallbackPrompts(userText) {
        const publications = Array.isArray(state.siteData?.publications) ? state.siteData.publications : [];
        const patents = Array.isArray(state.siteData?.patents) ? state.siteData.patents : [];
        const promptPool = [];
        const lowerUserText = String(userText || '').toLowerCase();
        const hasCodePublication = publications.some(pub => pub.code);
        const hasPatents = patents.some(patent => patent.status === 'granted');
        const hasRsePaper = publications.some(pub => /Remote Sensing of Environment/i.test(pub.journal || ''));

        if (hasRsePaper) {
            promptPool.push('你在 Remote Sensing of Environment 的工作亮点是什么？');
        }
        if (hasPatents) {
            promptPool.push('两项土地覆盖变化监测专利分别解决了什么问题？');
        }
        if (hasCodePublication) {
            promptPool.push('你开源的几个方法分别适合什么应用场景？');
        }
        promptPool.push('你在土地覆盖变化监测方面最核心的成果是什么？');
        promptPool.push('哪篇论文最能代表你当前的研究主线？');
        promptPool.push('你的方法相比传统变化检测方法优势在哪里？');

        if (lowerUserText.includes('论文')) {
            promptPool.unshift('你被引较高的那篇论文为什么影响更大？');
        }
        if (lowerUserText.includes('专利')) {
            promptPool.unshift('这些专利和你的论文方法之间是什么关系？');
        }

        return dedupePrompts(promptPool).slice(0, 3);
    }

    function normalizePromptSuggestions(raw, fallbackPrompts) {
        const cleaned = String(raw || '')
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/```$/, '')
            .trim();

        let parsed = [];
        try {
            parsed = JSON.parse(cleaned);
        } catch (_) {
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                } catch (_) {}
            }
        }

        const prompts = Array.isArray(parsed)
            ? parsed.map(sanitizePromptText).filter(Boolean)
            : [];

        const merged = dedupePrompts(prompts.concat(fallbackPrompts || []));
        return merged.slice(0, 3);
    }

    function sanitizePromptText(text) {
        const normalized = String(text || '')
            .replace(/^[\s\d.、-]+/, '')
            .replace(/[\r\n]+/g, ' ')
            .trim();

        if (!normalized) return '';

        const withoutEnding = normalized.replace(/[。！!]+$/g, '').trim();
        const finalText = /[？?]$/.test(withoutEnding) ? withoutEnding : `${withoutEnding}？`;
        if (finalText.length < 6 || finalText.length > 40) return '';
        return finalText;
    }

    function dedupePrompts(prompts) {
        const seen = new Set();
        const result = [];

        prompts.forEach(prompt => {
            const key = String(prompt || '').trim();
            if (!key || seen.has(key)) return;
            seen.add(key);
            result.push(key);
        });

        return result;
    }

    function welcomeHtml() {
        const name = state.siteData?.profile?.name || '我';
        return `<div class="ai-chat-msg ai-msg">
            <div class="ai-avatar"><img src="img/avatar/hhx.png" alt="${escHtml(name)}" onerror="this.parentElement.innerHTML='<i class=&quot;fas fa-robot&quot;></i>'"></div>
            <div class="ai-bubble">你好！我是 ${escHtml(name)}，很高兴认识你！你可以问我关于我的研究方向、发表论文、教育背景等任何问题。</div>
        </div>`;
    }

    function appendUserMsg(text) {
        const id = 'aim' + (++state.msgCounter);
        const container = document.getElementById('aiChatMessages');
        const el = document.createElement('div');
        el.id = id;
        el.className = 'ai-chat-msg user-msg';
        el.innerHTML = `<div class="ai-bubble">${escHtml(text).replace(/\n/g, '<br>')}</div>`;
        const promptList = document.getElementById('aiPromptList');
        container.insertBefore(el, promptList || null);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    function appendAiMsg(html, extraClass) {
        const id = 'aim' + (++state.msgCounter);
        const container = document.getElementById('aiChatMessages');
        const el = document.createElement('div');
        el.id = id;
        el.className = 'ai-chat-msg ai-msg' + (extraClass ? ' ' + extraClass : '');
        const name = state.siteData?.profile?.name || '';
        el.innerHTML =
            `<div class="ai-avatar"><img src="img/avatar/hhx.png" alt="${escHtml(name)}" onerror="this.parentElement.innerHTML='<i class=&quot;fas fa-robot&quot;></i>'"></div>` +
            `<div class="ai-bubble">${html}</div>`;
        const promptList = document.getElementById('aiPromptList');
        container.insertBefore(el, promptList || null);
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
        const parts = raw.split(/(```[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (idx % 2 === 1) {
                const code = part
                    .replace(/^```\w*\n?/, '')
                    .replace(/\n?```$/, '');
                return `<pre><code>${escHtml(code)}</code></pre>`;
            }

            let t = escHtml(part);

            t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
            t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
            t = t.replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>');
            t = t.replace(/^[-*] (.+)$/gm, '&bull;&nbsp;$1');
            t = t.replace(/^(\d+)\. (.+)$/gm, '$1.&nbsp;$2');
            t = t.replace(/\n/g, '<br>');

            return t;
        }).join('');
    }

    /* ── Toast ───────────────────────────────────────── */

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'ai-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 2200);
    }
})();
