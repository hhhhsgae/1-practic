// ============================================================
// GEMINI API (CORS PROXY арқылы)
// ============================================================

const API_KEY = "AIzaSyAURaVDG3-8uHGXKZCbuvZUG8srKVdoE2s"; // Осы жерге нақты кілтіңізді қойыңыз
const MODEL = "gemini-1.5-flash"; // немесе gemini-2.0-flash, gemini-pro

let requestCount = 0;
let chatHistory = [];

const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const requestCountEl = document.getElementById("requestCount");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

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

async function sendToGemini(userText) {
  chatHistory.push({ role: "user", content: userText });

  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);
  sendBtn.disabled = true;
  incrementCounter();

  try {
    const contents = chatHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // CORS прокси сервері (тегін, бірақ бір рет рұқсат керек)
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(proxyUrl + targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
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
    console.error("Gemini қатесі:", err);
    let errMsg = "⚠️ Қате: " + err.message;

    if (err.message.includes("Failed to fetch") || err.message.includes("CORS")) {
      errMsg = "⚠️ CORS прокси қажет. Мына сілтемені бір рет ашыңыз: https://cors-anywhere.herokuapp.com/ → 'Request temporary access' басыңыз.";
    } else if (err.message.includes("API key")) {
      errMsg = "⚠️ API кілті дұрыс емес. Тексеріңіз.";
    } else if (err.message.includes("model")) {
      errMsg = `⚠️ "${MODEL}" моделі жұмыс істемейді. gemini-1.5-flash қолданып көріңіз.`;
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
  sendToGemini(text);
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

chatHistory.push({ role: "assistant", content: "Сәлем! Мен Gemini AI-мін. Сұрақ қойыңыз! 🚀" });

// Тақырып ауыстыру және анимациялар (өзгеріссіз)
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
