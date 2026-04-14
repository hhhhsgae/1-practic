// API_KEY-ті осы жерге енгізіңіз
const API_KEY = "AIzaSyAURaVDG3-8uHGXKZCbuvZUG8srKVdoE2s";
const MODEL = "gemini-pro";
const MAX_TOKENS = 1024;

async function sendToGeminiAPI(userText) {
  chatHistory.push({ role: "user", content: userText });

  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);
  sendBtn.disabled = true;
  incrementCounter();

  try {
    const contents = chatHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // CORS прокси серверін пайдалану
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    const response = await fetch(proxyUrl + targetUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": window.location.origin
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
        systemInstruction: { parts: [{ text: "Сен көмекшісің. Қазақ немесе орыс тілінде жауап бер." }] }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Жауап алынбады.";

    chatHistory.push({ role: "assistant", content: assistantText });
    updateMessage(typingEl, assistantText);

  } catch (err) {
    let errMsg = "⚠️ Қате: " + err.message;
    
    if (err.message.includes("Failed to fetch")) {
      errMsg = "⚠️ CORS проблемасы. Алдымен мына сілтемені ашыңыз: https://cors-anywhere.herokuapp.com/ , содан кейін 'Request temporary access' батырмасын басыңыз.";
    } else if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      errMsg = "⚠️ API кілті орнатылмаған.";
    }
    
    updateMessage(typingEl, errMsg);
    chatHistory.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ============================================================
// КҮЙЛЕР (STATE)
// ============================================================

let requestCount = 0;
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

function appendMessage(role, text, isTyping = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${role}${isTyping ? " typing" : ""}`;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;
  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

function updateMessage(msgEl, newText) {
  const bubble = msgEl.querySelector(".msg-bubble");
  if (bubble) bubble.textContent = newText;
  msgEl.classList.remove("typing");
}

function incrementCounter() {
  requestCount++;
  requestCountEl.textContent = requestCount;
}

/**
 * Gemini API-ге сұраныс жібереді
 */
async function sendToGeminiAPI(userText) {
  // Пайдаланушы хабарламасын тарихқа қосу
  chatHistory.push({ role: "user", content: userText });

  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);
  sendBtn.disabled = true;
  incrementCounter();

  try {
    // Gemini форматына түрлендіру
    const contents = chatHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.7 },
        systemInstruction: { parts: [{ text: "Сен көмекшісің. Қазақ немесе орыс тілінде жауап бер." }] }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Жауап алынбады.";

    chatHistory.push({ role: "assistant", content: assistantText });
    updateMessage(typingEl, assistantText);

  } catch (err) {
    console.error("Gemini API қатесі:", err);

    let errMsg = "⚠️ Қате: " + err.message;

    if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      errMsg = "⚠️ Gemini API кілті орнатылмаған. https://aistudio.google.com/app/apikey сайтынан кілт алып, API_KEY-ге енгізіңіз.";
    } else if (err.message.includes("API key") || err.message.includes("403")) {
      errMsg = "⚠️ API кілті дұрыс емес. Жаңа кілт жасап көріңіз.";
    } else if (err.message.includes("CORS") || err.message.includes("fetch")) {
      errMsg = "⚠️ CORS қатесі. Кодты сервер арқылы іске қосыңыз: python -m http.server 8000";
    } else if (err.message.includes("model") || err.message.includes("404")) {
      errMsg = `⚠️ "${MODEL}" моделі жұмыс істемейді. gemini-2.0-flash қолданып көріңіз.`;
    }

    updateMessage(typingEl, errMsg);
    chatHistory.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";
  sendToGeminiAPI(text);
}

// Event listeners
sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Бастапқы хабарлама
chatHistory.push({ role: "assistant", content: "Сәлем! Мен Gemini AI-мін. Сұрақ қойыңыз! 👋" });

// ============================================================
// 2. ТАҚЫРЫП АУЫСТЫРУ
// ============================================================

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  themeIcon.textContent = isDark ? "☽" : "☀";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeToggle.addEventListener("click", toggleTheme);

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☽";
  }
}
initTheme();

// ============================================================
// 3. КАРТОЧКАЛАР АНИМАЦИЯСЫ
// ============================================================

function initCardAnimations() {
  const cards = document.querySelectorAll(".card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  cards.forEach((card) => observer.observe(card));
}
initCardAnimations();
