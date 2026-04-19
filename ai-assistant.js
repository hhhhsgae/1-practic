// ============================================================
// AI Assistant Widget — Groq API (тегін, CORS жоқ)
// Тіркелу: https://console.groq.com → API Keys → Create API Key
// ============================================================

const GROQ_API_KEY = 'GROQ_KEY_PLACEHOLDER'; // ← console.groq.com
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // тегін, жылдам

// ─── Балама: Anthropic Claude (console.anthropic.com → $5 тегін) ───
// const CLAUDE_API_KEY = 'sk-ant-...';
// const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// const CLAUDE_MODEL   = 'claude-haiku-3-5-20241022';

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.lang = localStorage.getItem('aiCareerLang') || 'kk';

        this.i18n = {
            kk: {
                btnLabel:    'AI Көмекші',
                headerTitle: 'AI Career Көмекші',
                greeting:    'Сәлем! Мен AI көмекшісімін. Бағдарламалау, ЖИ-құралдары немесе мамандық туралы кез келген сұрақ қойыңыз! 🚀',
                placeholder: 'Сұрағыңызды жазыңыз...',
                errorMsg:    'Қате орын алды: ',
                systemPrompt:'Сен пайдалы AI көмекшісің. Бағдарламалау, мамандық таңдау, ЖИ-құралдары туралы кеңес бер. Қазақ тілінде, қысқа және нақты жауап бер.',
                clearBtn:    'Тарихты тазалау',
                thinking:    'Жауап жазылуда...',
            },
            ru: {
                btnLabel:    'AI Помощник',
                headerTitle: 'AI Career Помощник',
                greeting:    'Привет! Я AI-помощник. Задайте любой вопрос о программировании, ИИ-инструментах или выборе профессии! 🚀',
                placeholder: 'Напишите ваш вопрос...',
                errorMsg:    'Произошла ошибка: ',
                systemPrompt:'Ты полезный AI-ассистент. Даёшь советы по программированию, выбору профессии и ИИ-инструментам. Отвечай на русском языке, кратко и по делу.',
                clearBtn:    'Очистить историю',
                thinking:    'Печатаю ответ...',
            }
        };

        this.loadHistory();
        this.createWidget();

        window.addEventListener('languageChanged', (e) => this.updateLanguage(e.detail.lang));
    }

    t(key) {
        return (this.i18n[this.lang]?.[key]) || key;
    }

    updateLanguage(newLang) {
        if (this.lang === newLang) return;
        this.lang = newLang;
        localStorage.setItem('aiCareerLang', this.lang);
        this.clearHistory();

        const btn = document.querySelector('.ai-assistant-button span');
        if (btn) btn.textContent = this.t('btnLabel');
        const hdr = document.querySelector('.ai-chat-header span');
        if (hdr) hdr.textContent = this.t('headerTitle');
        const inp = document.getElementById('aiUserInput');
        if (inp) inp.placeholder = this.t('placeholder');
        const clr = document.getElementById('aiClearBtn');
        if (clr) clr.textContent = this.t('clearBtn');
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('aiCareerChatHistory');
            if (saved) this.conversationHistory = JSON.parse(saved);
        } catch { this.conversationHistory = []; }
    }

    saveHistory() {
        try {
            localStorage.setItem('aiCareerChatHistory', JSON.stringify(this.conversationHistory.slice(-40)));
        } catch(e) { console.warn('History save error:', e); }
    }

    clearHistory() {
        this.conversationHistory = [];
        localStorage.removeItem('aiCareerChatHistory');
        const container = document.getElementById('aiChatMessages');
        if (container) {
            container.innerHTML = '';
            this.addMessage(this.t('greeting'), 'bot');
        }
    }

    addStyles() {
        const existing = document.getElementById('aiAssistantStyles');
        if (existing) existing.remove();

        const style = document.createElement('style');
        style.id = 'aiAssistantStyles';
        style.textContent = `
            .ai-assistant-button {
                position: fixed; bottom: 28px; right: 28px;
                background: #a9203e; color: #fff;
                padding: 13px 24px; border-radius: 50px;
                cursor: pointer; font-weight: 600; font-size: 15px;
                box-shadow: 0 6px 22px rgba(169,32,62,0.40);
                z-index: 9999; transition: transform .2s, background .2s;
                display: flex; align-items: center; gap: 9px;
                font-family: 'Syne', 'Inter', sans-serif;
                user-select: none; border: none;
            }
            .ai-assistant-button:hover { transform: scale(1.05); background: #8f1b34; }
            .ai-assistant-button svg { width:18px; height:18px; flex-shrink:0; }

            .ai-assistant-window {
                position: fixed; bottom: 95px; right: 28px;
                width: 360px; height: 520px;
                background: #fff; border-radius: 20px;
                box-shadow: 0 12px 48px rgba(0,0,0,0.18);
                z-index: 10000; display: none; flex-direction: column;
                overflow: hidden; border: 1px solid #ececec;
                font-family: 'Space Mono', 'Inter', monospace;
                animation: aiSlideIn .25s ease;
            }
            .ai-assistant-window.open { display: flex; }
            @keyframes aiSlideIn {
                from { opacity:0; transform:translateY(12px); }
                to   { opacity:1; transform:translateY(0); }
            }

            .ai-chat-header {
                background: #a9203e; color: #fff;
                padding: 16px 18px; display: flex;
                align-items: center; justify-content: space-between;
                font-weight: 700; font-size: 14px; flex-shrink: 0;
                font-family: 'Syne', sans-serif;
            }
            .ai-header-left { display:flex; align-items:center; gap:9px; }
            .ai-status-dot {
                width:8px; height:8px; border-radius:50%;
                background:#4ade80; animation: aiBlink 2s infinite;
            }
            @keyframes aiBlink {
                0%,100%{opacity:1} 50%{opacity:.4}
            }
            .ai-close-btn {
                background: rgba(255,255,255,.18); border: none;
                color: #fff; width: 28px; height: 28px; border-radius: 50%;
                cursor: pointer; font-size: 17px;
                display: flex; align-items: center; justify-content: center;
                transition: background .2s; padding: 0; line-height: 1;
            }
            .ai-close-btn:hover { background: rgba(255,255,255,.32); }

            .ai-chat-messages {
                flex: 1; overflow-y: auto;
                padding: 14px; display: flex;
                flex-direction: column; gap: 10px;
            }
            .ai-chat-messages::-webkit-scrollbar { width:4px; }
            .ai-chat-messages::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }

            .ai-message { display:flex; align-items:flex-start; gap:8px; }
            .ai-message.user { flex-direction:row-reverse; }
            .ai-avatar {
                width:30px; height:30px; border-radius:50%;
                background:#f0f0f0; display:flex;
                align-items:center; justify-content:center;
                font-size:13px; flex-shrink:0;
            }
            .ai-message.bot .ai-avatar { background:#a9203e; color:#fff; }
            .ai-message-content {
                background:#f4f4f4; border-radius:14px;
                padding:9px 13px; font-size:13px; line-height:1.55;
                max-width:80%; color:#111; word-break:break-word;
            }
            .ai-message.user .ai-message-content {
                background:#a9203e; color:#fff;
                border-radius:14px 4px 14px 14px;
            }
            .ai-message.bot .ai-message-content { border-radius:4px 14px 14px 14px; }

            .ai-clear-row {
                padding: 5px 14px; border-top: 1px solid #f0f0f0;
                display: flex; justify-content: flex-end; flex-shrink: 0;
            }
            .ai-clear-btn {
                background:none; border:none; color:#bbb;
                font-size:11px; cursor:pointer; padding:4px 6px;
                transition:color .2s; font-family:inherit;
            }
            .ai-clear-btn:hover { color:#a9203e; }

            .ai-chat-input {
                padding: 11px 14px; border-top: 1px solid #f0f0f0;
                display: flex; gap: 9px; align-items: center; flex-shrink: 0;
            }
            .ai-chat-input input {
                flex:1; border:1.5px solid #e5e5e5; border-radius:20px;
                padding:9px 15px; font-size:13px; outline:none;
                transition:border-color .2s; background:#fafafa;
                font-family:inherit; color:#111;
            }
            .ai-chat-input input:focus { border-color:#a9203e; }
            .ai-send-btn {
                background:#a9203e; color:#fff; border:none;
                width:38px; height:38px; border-radius:50%;
                cursor:pointer; display:flex; align-items:center;
                justify-content:center; transition:all .2s; flex-shrink:0;
            }
            .ai-send-btn:hover { background:#8f1b34; transform:scale(1.06); }
            .ai-send-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
            .ai-send-btn svg { width:16px; height:16px; }

            .ai-typing {
                display:flex; gap:5px; padding:10px 13px;
                background:#f4f4f4; border-radius:4px 14px 14px 14px;
                width:fit-content; align-items:center;
            }
            .ai-typing span {
                width:6px; height:6px; background:#a9203e;
                border-radius:50%; animation:aiDot 1.2s infinite ease-in-out;
            }
            .ai-typing span:nth-child(2) { animation-delay:.2s; }
            .ai-typing span:nth-child(3) { animation-delay:.4s; }
            @keyframes aiDot {
                0%,60%,100%{transform:translateY(0);opacity:.5}
                30%{transform:translateY(-7px);opacity:1}
            }

            .ai-error-note {
                font-size:11px; color:#999; padding:5px 14px 8px;
                text-align:center; line-height:1.4;
            }
            .ai-error-note a { color:#a9203e; }

            @media (max-width:480px) {
                .ai-assistant-window { right:10px; left:10px; width:auto; bottom:85px; }
                .ai-assistant-button { right:14px; bottom:18px; padding:11px 18px; font-size:13px; }
            }
        `;
        document.head.appendChild(style);
    }

    createWidget() {
        document.querySelector('.ai-assistant-button')?.remove();
        document.getElementById('aiChatWindow')?.remove();

        this.addStyles();

        const btn = document.createElement('button');
        btn.className = 'ai-assistant-button';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a9 9 0 1 0 9 9" stroke-linecap="round"/>
                <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
                <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
                <path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" stroke-linecap="round"/>
                <path d="M18 2v4m2-2h-4" stroke-linecap="round"/>
            </svg>
            <span>${this.t('btnLabel')}</span>
        `;
        btn.onclick = () => this.toggleChat();

        const win = document.createElement('div');
        win.className = 'ai-assistant-window';
        win.id = 'aiChatWindow';
        win.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-header-left">
                    <div class="ai-status-dot"></div>
                    <span>${this.t('headerTitle')}</span>
                </div>
                <button id="aiCloseBtn" class="ai-close-btn">×</button>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            <div class="ai-clear-row">
                <button id="aiClearBtn" class="ai-clear-btn">${this.t('clearBtn')}</button>
            </div>
            <div class="ai-chat-input">
                <input type="text" id="aiUserInput" placeholder="${this.t('placeholder')}">
                <button id="aiSendBtn" class="ai-send-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(win);

        document.getElementById('aiCloseBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });
        document.getElementById('aiClearBtn').addEventListener('click', () => this.clearHistory());
        document.getElementById('aiSendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('aiUserInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) this.sendMessage();
        });

        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('aiChatMessages');
        if (!container) return;
        container.innerHTML = '';
        if (this.conversationHistory.length === 0) {
            this.addMessage(this.t('greeting'), 'bot');
        } else {
            this.conversationHistory.forEach(m => this.appendToDOM(m.text, m.role));
        }
    }

    addMessage(text, role) { this.appendToDOM(text, role); }

    appendToDOM(text, role) {
        const container = document.getElementById('aiChatMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `ai-message ${role}`;
        const icon = role === 'bot' ? '🤖' : '👤';
        div.innerHTML = `
            <div class="ai-avatar">${icon}</div>
            <div class="ai-message-content">${text}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    showTyping() {
        const container = document.getElementById('aiChatMessages');
        if (!container) return null;
        const div = document.createElement('div');
        div.className = 'ai-message bot';
        div.id = 'aiTyping';
        div.innerHTML = `<div class="ai-avatar">🤖</div><div class="ai-typing"><span></span><span></span><span></span></div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    removeTyping() {
        document.getElementById('aiTyping')?.remove();
    }

    toggleChat() { this.isOpen ? this.closeChat() : this.openChat(); }

    openChat() {
        document.getElementById('aiChatWindow')?.classList.add('open');
        this.isOpen = true;
        setTimeout(() => document.getElementById('aiUserInput')?.focus(), 120);
    }

    closeChat() {
        document.getElementById('aiChatWindow')?.classList.remove('open');
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('aiUserInput');
        const sendBtn = document.getElementById('aiSendBtn');
        const message = input.value.trim();
        if (!message) return;

        this.appendToDOM(message, 'user');
        this.conversationHistory.push({ role: 'user', text: message });
        input.value = '';
        sendBtn.disabled = true;
        this.showTyping();

        try {
            const reply = await this.callGroq(message);
            this.removeTyping();
            this.appendToDOM(reply, 'bot');
            this.conversationHistory.push({ role: 'bot', text: reply });
            this.saveHistory();
        } catch (err) {
            this.removeTyping();
            this.appendToDOM(this.t('errorMsg') + err.message, 'bot');
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    }

    async callGroq(userMessage) {
        const messages = [
            { role: 'system', content: this.t('systemPrompt') },
            ...this.conversationHistory
                .slice(-10)
                .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: userMessage }
        ];

        const resp = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('Жауап алынбады');
        return text;
    }
}

// ─── Тіл утилиталары ───
window.changeLanguage = function(lang) {
    if (window.currentLang === lang) return;
    window.currentLang = lang;
    localStorage.setItem('aiCareerLang', lang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
};

// ─── Іске қосу ───
window.addEventListener('load', () => {
    window.currentLang = localStorage.getItem('aiCareerLang') || 'kk';
    window.assistant = new AIAssistant();
});
