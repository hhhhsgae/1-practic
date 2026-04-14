/**
 * script.js — Практикалық жұмыс №1
 * Барлық интерактивтілік: ЖИ-чат, тақырып ауысу, анимациялар, санауыш
 *
 * ⚠️ API_KEY өрісіне өзіңіздің Google Gemini API кілтіңізді енгізіңіз.
 *    https://aistudio.google.com/app/apikey → Create API Key
 */

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

/** @type {string} Google Gemini API кілті — осы жерге енгізіңіз */
const API_KEY = "AIzaSyAURaVDG3-8uHGXKZCbuvZUG8srKVdoE2s";

/** @type {string} Қолданылатын Gemini моделі */
const MODEL = "gemini-2.0-flash"; // немесе gemini-1.5-pro

/** @type {number} Максималды токен саны */
const MAX_TOKENS = 1024;

// ============================================================
// КҮЙЛЕР (STATE)
// ============================================================

/** @type {number} Жіберілген сұраныстар санауышы */
let requestCount = 0;

/** @type {Array<{role: string, content: string}>} Чат тарихы */
let chatHistory = [];

// ============================================================
// DOM ЭЛЕМЕНТТЕРІ
// ============================================================

const chatMessages  = document.getElementById("chatMessages");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const requestCountEl= document.getElementById("requestCount");
const themeToggle   = document.getElementById("themeToggle");
const themeIcon     = themeToggle.querySelector(".theme-icon");

// ============================================================
// 1. ЖИ-ЧАТ ФУНКЦИЯЛАРЫ
// ============================================================

/**
 * Чат терезесіне жаңа хабарлама қосады.
 * @param {string} role       - "user" немесе "assistant"
 * @param {string} text       - Хабарлама мәтіні
 * @param {boolean} isTyping  - Жүктелу индикаторы ма?
 * @returns {HTMLElement}     - Жасалған хабарлама элементі
 */
function appendMessage(role, text, isTyping = false) {
  const msgDiv    = document.createElement("div");
  msgDiv.className = `chat-msg ${role}${isTyping ? " typing" : ""}`;

  const bubble    = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

/**
 * Хабарлама мәтінін жаңартады (typing индикаторын ауыстыру үшін).
 * @param {HTMLElement} msgEl - appendMessage қайтарған элемент
 * @param {string} newText    - Жаңа мәтін
 */
function updateMessage(msgEl, newText) {
  const bubble = msgEl.querySelector(".msg-bubble");
  if (bubble) bubble.textContent = newText;
  msgEl.classList.remove("typing");
}

/**
 * Сұраныстар санауышын арттырады және UI-ді жаңартады.
 */
function incrementCounter() {
  requestCount++;
  requestCountEl.textContent = requestCount;
}

/**
 * Чат тарихын Gemini API форматына түрлендіреді
 * @returns {Array} Gemini contents массиві
 */
function formatChatHistoryForGemini() {
  // Gemini үшін тарихты рөл бойынша түрлендіру
  const contents = [];
  
  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    });
  }
  
  return contents;
}

/**
 * Gemini API-ге сұраныс жібереді және жауапты чатта көрсетеді.
 * @param {string} userText - Пайдаланушы енгізген мәтін
 */
async function sendToGeminiAPI(userText) {
  // Пайдаланушы хабарламасын тарихқа қосу
  chatHistory.push({ role: "user", content: userText });

  // Typing индикаторын көрсету
  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);

  sendBtn.disabled = true;
  incrementCounter();

  try {
    const contents = formatChatHistoryForGemini();
    
    const requestBody = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.7,
        topP: 0.95
      },
      systemInstruction: {
        parts: [{ text: "Сен ЖИ-бағдарламалау бойынша көмекшісің. Қысқа, анық жауаптар бер. Қазақ немесе орыс тілінде сұрақ берілсе, сол тілде жауап бер." }]
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let errorMessage = `HTTP ${response.status}`;
      if (errData.error?.message) {
        errorMessage = errData.error.message;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Жауап алынбады.";

    // Жауапты тарихқа қосу
    chatHistory.push({ role: "assistant", content: assistantText });

    // Typing индикаторын жауаппен ауыстыру
    updateMessage(typingEl, assistantText);

  } catch (err) {
    console.error("Gemini API қатесі:", err);

    let errMsg = "⚠️ Қате: " + err.message;

    if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      errMsg = "⚠️ Gemini API кілті орнатылмаған. script.js файлындағы API_KEY өрісіне кілтіңізді енгізіңіз. Кілтті https://aistudio.google.com/app/apikey сайтынан алыңыз.";
    } else if (err.message.includes("API key") || err.message.includes("403")) {
      errMsg = "⚠️ API кілті дұрыс емес. Тексеріп қайталаңыз.";
    } else if (err.message.includes("CORS") || err.message.includes("Failed to fetch")) {
      errMsg = "⚠️ CORS қатесі. Кодты Node.js/сервер арқылы іске қосыңыз немесе прокси пайдаланыңыз.";
    } else if (err.message.includes("model") || err.message.includes("404")) {
      errMsg = `⚠️ "${MODEL}" моделі табылмады. gemini-2.0-flash немесе gemini-1.5-pro қолданыңыз.`;
    }

    updateMessage(typingEl, errMsg);
    // Сәтсіз сұранысты тарихтан алып тастау
    chatHistory.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

/**
 * "Жіберу" батырмасы немесе Enter басылғанда шақырылады.
 * Енгізу өрісін тексеріп, API функциясын шақырады.
 */
function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";

  sendToGeminiAPI(text);
}

// Батырма оқиғасы
sendBtn.addEventListener("click", handleSend);

// Enter пернесін өңдеу
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Бастапқы тарихқа қош келу хабарламасын қосу
chatHistory.push({ role: "assistant", content: "Сәлем! Мен Gemini AI-мін. Бағдарламалау немесе ЖИ туралы кез келген сұрақ қойыңыз! 👋" });

// ============================================================
// 2. ТАҚЫРЫП АУЫСТЫРУ (DARK / LIGHT MODE)
// ============================================================

/**
 * Жарық / қараңғы тақырыпты ауыстырады.
 * CSS айнымалыларды body класы арқылы басқарады.
 * Таңдауды localStorage-ке сақтайды.
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  themeIcon.textContent = isDark ? "☽" : "☀";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeToggle.addEventListener("click", toggleTheme);

/**
 * Бет жүктелгенде сақталған тақырыпты қолданады.
 */
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☽";
  }
}

initTheme();

// ============================================================
// 3. КАРТОЧКАЛАР АНИМАЦИЯСЫ — IntersectionObserver
// ============================================================

/**
 * Карточкаларды айналдыру кезінде анимациямен пайда болдырады.
 * CSS-тегі opacity: 0 → 1 және translateY жылжуын іске қосады.
 */
function initCardAnimations() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px"
    }
  );

  cards.forEach(function (card) {
    observer.observe(card);
  });
}

initCardAnimations();
