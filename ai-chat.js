// AI Chat Assistant — powered by 硅基流动 (SiliconFlow)
(function () {
    const SF_BASE = 'https://api.siliconflow.cn/v1';
    const SF_MODEL = 'Pro/deepseek-ai/DeepSeek-V3.2';
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
        if (state.open) document.getElementById('aiChatInput').focus();
    }

    function clearChat() {
        state.messages = [];
        hydrateChatUi();
    }

    /* ── System prompt ───────────────────────────────── */

    function buildSystemPrompt() {
        const data = state.siteData;
        const name = data?.profile?.name || '贺海旭';
        const nameEn = data?.profile?.nameEn || 'Haixu He';

        if (!data) {
            return `你现在扮演 ${name}（${nameEn}）本人，请用中文回答用户的问题。`;
        }

        if (data.ai?.systemPrompt) return data.ai.systemPrompt;

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
                        bubble.innerHTML = formatMd(fullText);
                        msgBox.scrollTop = msgBox.scrollHeight;
                    } catch (_) {}
                }
            }

            state.messages.push({ role: 'assistant', content: fullText });
            refreshSuggestedPrompts(text, fullText, promptVersion);
        } catch (e) {
            removeMsg(thinkId);
            appendAiMsg(`请求失败：${escHtml(e.message)}`, 'error');
            state.messages.pop();
            restorePromptList(promptVersion, buildAchievementFallbackPrompts(text));
        } finally {
            document.getElementById('aiSendBtn').disabled = false;
        }
    }

    /* ── DOM helpers ─────────────────────────────────── */

    function hydrateChatUi() {
        document.getElementById('aiChatMessages').innerHTML = welcomeHtml();
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

    async function refreshSuggestedPrompts(userText, assistantText, promptVersion) {
        try {
            const prompts = await requestSuggestedPrompts(userText, assistantText);
            restorePromptList(promptVersion, prompts);
        } catch (_) {
            restorePromptList(promptVersion, buildAchievementFallbackPrompts(userText));
        }
    }

    async function requestSuggestedPrompts(userText, assistantText) {
        if (!getApiKey()) return buildAchievementFallbackPrompts(userText);

        const summary = buildPromptContextSummary();
        const payload = {
            model: SF_MODEL,
            messages: [
                {
                    role: 'system',
                    content: '你是学术主页的对话引导助手。你的任务是为访客生成 3 条下一步可点击提问，帮助访客继续了解主页主人的个人成果。'
                },
                {
                    role: 'user',
                    content: `请基于以下资料，生成 3 条中文 follow-up 提问，供网页上的快捷按钮使用。\n\n要求：\n- 必须围绕主页主人的个人成果展开，重点关注研究方向、代表论文、专利、方法创新、应用价值、开源代码或合作交流\n- 不要提问资料中没有明确提到的奖项、头衔、单位经历或私人信息\n- 问句要自然、具体、不过分夸张，不要太离谱\n- 每条尽量控制在 12 到 28 个字之间\n- 三条问题不要重复，且都要适合用户直接点击提问\n- 只输出 JSON 数组，例如 ["问题1","问题2","问题3"]，不要输出 Markdown，不要解释\n\n主页资料摘要：\n${summary}\n\n最近用户问题：${userText}\n最近助手回答：${assistantText.slice(0, 700)}`
                }
            ],
            enable_thinking: false,
            max_tokens: 256,
            temperature: 0.5
        };

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

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        return normalizePromptSuggestions(content, buildAchievementFallbackPrompts(userText));
    }

    function buildPromptContextSummary() {
        const profile = state.siteData?.profile || {};
        const publications = Array.isArray(state.siteData?.publications) ? state.siteData.publications : [];
        const patents = Array.isArray(state.siteData?.patents) ? state.siteData.patents : [];

        const keyPublications = [...publications]
            .sort((a, b) => {
                const citationGap = Number(b.citations || 0) - Number(a.citations || 0);
                if (citationGap !== 0) return citationGap;
                return Number(b.year || 0) - Number(a.year || 0);
            })
            .slice(0, 3)
            .map(pub => `${pub.year}｜${pub.title}｜${pub.journal}｜被引${pub.citations || 0}次${pub.code ? '｜含代码' : ''}`);

        const grantedPatents = patents
            .filter(patent => patent.status === 'granted')
            .slice(0, 2)
            .map(patent => `${patent.year}｜${patent.title}｜${patent.patentNumber}`);

        return [
            `姓名：${profile.name || '贺海旭'}（${profile.nameEn || 'Haixu He'}）`,
            `身份：${profile.title || ''}`,
            `研究方向：${(profile.researchInterests || []).join('、')}`,
            `代表论文：${keyPublications.join('；')}`,
            `已授权专利：${grantedPatents.join('；') || '暂无'}`
        ].join('\n');
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
        container.appendChild(el);
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
