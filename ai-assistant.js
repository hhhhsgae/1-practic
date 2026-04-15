// ai-assistant.js — AI Career Agent (Gemini API)

const GEMINI_API_KEY = 'AIzaSyBzuov-U403Z3VpwZiYxVHjl6aHx3Q_Ipc';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.lang = window.currentLang || localStorage.getItem('aiCareerLang') || 'kk';
        if (window.currentLang !== this.lang) {
            window.currentLang = this.lang;
        }

        this.i18n = {
            kk: {
                btnLabel:    '<i class="fas fa-robot"></i> AI Көмекші',
                headerTitle: '<i class="fas fa-microchip"></i> AI Career Көмекші',
                greeting:    'Сәлем! Мен AI Career Agent көмекшісімін (Gemini). Бағдарламалау, ЖИ-құралдары немесе мамандық туралы кез келген сұрақ қойыңыз! 🚀',
                placeholder: 'Сұрағыңызды жазыңыз...',
                errorMsg:    'Кешіріңіз, қазір жауап бере алмаймын. Қате: ',
                systemPrompt:'Сен AI Career Agent ассистентісің. Бағдарламалау, мамандық таңдау, ЖИ-құралдары туралы кеңес бересің. Қазақ тілінде, қысқа және пайдалы жауап бер.',
                clearBtn:    '<i class="fas fa-trash-alt"></i> Тарихты тазалау',
            },
            ru: {
                btnLabel:    '<i class="fas fa-robot"></i> AI Помощник',
                headerTitle: '<i class="fas fa-microchip"></i> AI Career Помощник',
                greeting:    'Привет! Я помощник AI Career Agent (Gemini). Задайте любой вопрос о программировании, ИИ-инструментах или выборе профессии! 🚀',
                placeholder: 'Напишите ваш вопрос...',
                errorMsg:    'Извините, сейчас не могу ответить. Ошибка: ',
                systemPrompt:'Ты ассистент AI Career Agent. Даёшь советы по программированию, выбору профессии и ИИ-инструментам. Отвечай на русском языке, кратко и по делу.',
                clearBtn:    '<i class="fas fa-trash-alt"></i> Очистить историю',
            }
        };

        this.loadHistory();
        this.createChatButton();

        window.addEventListener('languageChanged', (e) => {
            this.updateLanguage(e.detail.lang);
        });
    }

    t(key) {
        return (this.i18n[this.lang] && this.i18n[this.lang][key]) ? this.i18n[this.lang][key] : key;
    }

    updateLanguage(newLang) {
        if (this.lang === newLang) return;
        this.lang = newLang;
        localStorage.setItem('aiCareerLang', this.lang);

        const btn = document.querySelector('.ai-assistant-button');
        if (btn) btn.innerHTML = this.t('btnLabel');

        const headerSpan = document.querySelector('.ai-chat-header span');
        if (headerSpan) headerSpan.innerHTML = this.t('headerTitle');

        const clearBtn = document.getElementById('aiClearBtn');
        if (clearBtn) clearBtn.innerHTML = this.t('clearBtn');

        const input = document.getElementById('aiUserInput');
        if (input) input.placeholder = this.t('placeholder');

        this.clearHistory();
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('aiCareerChatHistory');
            if (saved) this.conversationHistory = JSON.parse(saved);
        } catch(e) {
            this.conversationHistory = [];
        }
    }

    saveHistory() {
        try {
            const trimmed = this.conversationHistory.slice(-50);
            localStorage.setItem('aiCareerChatHistory', JSON.stringify(trimmed));
        } catch(e) {
            console.warn('Could not save history:', e);
        }
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

    createChatButton() {
        const oldBtn = document.querySelector('.ai-assistant-button');
        const oldWin = document.getElementById('aiChatWindow');
        if (oldBtn) oldBtn.remove();
        if (oldWin) oldWin.remove();

        const chatButton = document.createElement('div');
        chatButton.className   = 'ai-assistant-button';
        chatButton.innerHTML   = this.t('btnLabel');
        chatButton.onclick     = () => this.toggleChat();

        const chatWindow = document.createElement('div');
        chatWindow.className   = 'ai-assistant-window';
        chatWindow.id          = 'aiChatWindow';
        chatWindow.innerHTML = `
            <div class="ai-chat-header">
                <span>${this.t('headerTitle')}</span>
                <button id="aiCloseBtn" class="ai-close-btn">×</button>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            <div class="ai-clear-row">
                <button id="aiClearBtn" class="ai-clear-btn">${this.t('clearBtn')}</button>
            </div>
            <div class="ai-chat-input">
                <input type="text" id="aiUserInput" placeholder="${this.t('placeholder')}">
                <button id="aiSendBtn" class="ai-send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;

        this.addStyles();
        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);

        document.getElementById('aiCloseBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });
        document.getElementById('aiClearBtn').addEventListener('click', () => this.clearHistory());
        document.getElementById('aiSendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('aiUserInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
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
            this.conversationHistory.forEach(msg => this.addMessageToDOM(msg.text, msg.role));
        }
    }

    addStyles() {
        const existing = document.getElementById('aiAssistantStyles');
        if (existing) existing.remove();

        const styles = document.createElement('style');
        styles.id = 'aiAssistantStyles';
        styles.textContent = `
            .ai-assistant-button {
                position: fixed; bottom: 30px; right: 30px;
                background: #a9203e; color: white !important;
                padding: 15px 25px; border-radius: 50px;
                cursor: pointer; font-weight: 600;
                box-shadow: 0 5px 20px rgba(169,32,62,0.4);
                z-index: 9999; transition: all 0.3s ease;
                display: flex; align-items: center; gap: 10px;
                font-size: 16px; font-family: 'Inter', sans-serif;
                user-select: none;
            }
            .ai-assistant-button:hover { transform: scale(1.05); background: #8f1b34; }

            .ai-assistant-window {
                position: fixed; bottom: 100px; right: 30px;
                width: 360px; height: 520px;
                background: #ffffff; border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.25);
                z-index: 10000; display: none;
                flex-direction: column; overflow: hidden;
                border: 1px solid #eaeaea;
                font-family: 'Inter', sans-serif;
            }
            .ai-assistant-window.open { display: flex; }

            .ai-chat-header {
                background: #a9203e; color: white;
                padding: 18px 20px; display: flex;
                align-items: center; justify-content: space-between;
                font-weight: 600; font-size: 15px;
                flex-shrink: 0;
            }
            .ai-close-btn {
                background: rgba(255,255,255,0.2); border: none;
                color: white; width: 28px; height: 28px;
                border-radius: 50%; cursor: pointer;
                font-size: 16px; display: flex;
                align-items: center; justify-content: center;
                transition: background 0.2s;
            }
            .ai-close-btn:hover { background: rgba(255,255,255,0.35); }

            .ai-chat-messages {
                flex: 1; overflow-y: auto;
                padding: 16px; display: flex;
                flex-direction: column; gap: 12px;
            }
            .ai-message { display: flex; align-items: flex-start; gap: 10px; }
            .ai-message.user { flex-direction: row-reverse; }
            .ai-avatar {
                width: 32px; height: 32px; border-radius: 50%;
                background: #f0f0f0; display: flex;
                align-items: center; justify-content: center;
                font-size: 16px; flex-shrink: 0;
            }
            .ai-message.bot .ai-avatar { background: #a9203e; color: white; }
            .ai-message-content {
                background: white; border: 1px solid #e5e5e5;
                border-radius: 16px; padding: 10px 14px;
                font-size: 14px; line-height: 1.5;
                max-width: 78%; color: #222;
            }
            .ai-message.user .ai-message-content {
                background: #a9203e; color: white;
                border-color: #a9203e;
                border-radius: 16px 4px 16px 16px;
            }
            .ai-message.bot .ai-message-content { border-radius: 4px 16px 16px 16px; }

            .ai-clear-row {
                padding: 6px 16px; border-top: 1px solid #f0f0f0;
                display: flex; justify-content: flex-end; flex-shrink: 0;
            }
            .ai-clear-btn {
                background: none; border: none; color: #aaa;
                font-size: 12px; cursor: pointer; padding: 4px 8px;
                font-family: 'Inter', sans-serif; transition: color 0.2s;
            }
            .ai-clear-btn:hover { color: #a9203e; }

            .ai-chat-input {
                padding: 12px 16px; border-top: 1px solid #f0f0f0;
                display: flex; gap: 10px; align-items: center; flex-shrink: 0;
            }
            .ai-chat-input input {
                flex: 1; border: 1.5px solid #eaeaea;
                border-radius: 20px; padding: 10px 16px;
                font-size: 14px; font-family: 'Inter', sans-serif;
                outline: none; transition: border-color 0.2s;
                background: #fcfcfc;
            }
            .ai-chat-input input:focus { border-color: #a9203e; }

            .ai-send-btn {
                background: #a9203e; color: white;
                border: none; width: 40px; height: 40px;
                border-radius: 50%; cursor: pointer;
                font-size: 18px; display: flex;
                align-items: center; justify-content: center;
                transition: all 0.2s; flex-shrink: 0;
            }
            .ai-send-btn:hover { background: #8f1b34; transform: scale(1.05); }

            .typing-indicator {
                display: flex; gap: 5px;
                padding: 10px 14px; background: white;
                border-radius: 16px; border: 1px solid #e5e5e5;
                width: fit-content; align-items: center;
            }
            .typing-indicator span {
                width: 7px; height: 7px; background: #a9203e;
                border-radius: 50%; animation: aiTyping 1s infinite ease-in-out;
            }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes aiTyping {
                0%,60%,100% { transform:translateY(0); opacity:0.5; }
                30% { transform:translateY(-8px); opacity:1; }
            }

            @media (max-width: 480px) {
                .ai-assistant-window { right: 10px; left: 10px; width: auto; bottom: 90px; }
                .ai-assistant-button { right: 16px; bottom: 20px; padding: 12px 20px; font-size: 14px; }
            }
        `;
        document.head.appendChild(styles);
    }

    toggleChat() { this.isOpen ? this.closeChat() : this.openChat(); }

    openChat() {
        const win = document.getElementById('aiChatWindow');
        if (win) { win.classList.add('open'); this.isOpen = true; }
        const input = document.getElementById('aiUserInput');
        if (input) setTimeout(() => input.focus(), 100);
    }

    closeChat() {
        const win = document.getElementById('aiChatWindow');
        if (win) { win.classList.remove('open'); this.isOpen = false; }
    }

    async sendMessage() {
        const input = document.getElementById('aiUserInput');
        const message = input.value.trim();
        if (!message) return;

        this.addMessageToDOM(message, 'user');
        this.conversationHistory.push({ role: 'user', text: message });
        input.value = '';
        this.showTypingIndicator();

        try {
            const response = await this.getGeminiResponse(message);
            this.removeTypingIndicator();
            this.addMessageToDOM(response, 'bot');
            this.conversationHistory.push({ role: 'bot', text: response });
            this.saveHistory();
        } catch(error) {
            this.removeTypingIndicator();
            this.addMessageToDOM(this.t('errorMsg') + error.message, 'bot');
        }
    }

    addMessage(text, sender) { this.addMessageToDOM(text, sender); }

    addMessageToDOM(text, sender) {
        const container = document.getElementById('aiChatMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `ai-message ${sender}`;
        const icon = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        div.innerHTML = `
            <div class="ai-avatar">${icon}</div>
            <div class="ai-message-content">${text}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator() {
        const container = document.getElementById('aiChatMessages');
        if (!container) return;
        const indicator = document.createElement('div');
        indicator.className = 'ai-message bot';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `<div class="ai-avatar"><i class="fas fa-robot"></i></div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    }

    removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    // ===== GEMINI API =====
    async getGeminiResponse(message) {
        // Соңғы 10 хабарды тарих ретінде жіберу
        const historyContents = this.conversationHistory
            .filter(m => m.role === 'user' || m.role === 'bot')
            .slice(-10)
            .map(m => ({
                role: m.role === 'bot' ? 'model' : 'user',
                parts: [{ text: m.text }]
            }));

        const body = {
            system_instruction: {
                parts: [{ text: this.t('systemPrompt') }]
            },
            contents: [
                ...historyContents,
                { role: 'user', parts: [{ text: message }] }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        };

        const resp = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
        throw new Error('Жауап алынбады');
    }
}

// ===== Тіл утилиталары =====
window.applyPageTranslations = function(translations) {
    const lang = window.currentLang || localStorage.getItem('aiCareerLang') || 'kk';
    if (!translations || !translations[lang]) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key] !== undefined) {
            el.innerHTML = translations[lang][key];
        }
    });
};

window.changeLanguage = function(lang) {
    if (window.currentLang === lang) return;
    window.currentLang = lang;
    localStorage.setItem('aiCareerLang', lang);
    const btn = document.getElementById('globalLangBtn');
    if (btn) btn.textContent = lang === 'kk' ? 'RU' : 'ҚЗ';
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    location.reload();
};

window.toggleLangNoReload = function() {
    const newLang = (window.currentLang === 'kk') ? 'ru' : 'kk';
    window.currentLang = newLang;
    localStorage.setItem('aiCareerLang', newLang);
    const btn = document.getElementById('globalLangBtn');
    if (btn) btn.textContent = newLang === 'kk' ? 'RU' : 'ҚЗ';
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
};

window.initGlobalLang = function() {
    const savedLang = localStorage.getItem('aiCareerLang') || 'kk';
    window.currentLang = savedLang;
    const btn = document.getElementById('globalLangBtn');
    if (btn) {
        btn.textContent = savedLang === 'kk' ? 'RU' : 'ҚЗ';
        btn.onclick = () => window.changeLanguage(savedLang === 'kk' ? 'ru' : 'kk');
    }
};

window.addEventListener('load', () => {
    window.currentLang = localStorage.getItem('aiCareerLang') || 'kk';
    const btn = document.getElementById('globalLangBtn');
    if (btn && !btn.onclick) {
        window.initGlobalLang();
    }
    window.assistant = new AIAssistant();
});
