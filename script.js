// ============================================================
// OpenRouter API (GPT-4o-mini) – бесплатно, работает из браузера
// ============================================================

const OPENROUTER_KEY = "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";  // Вставьте сюда ваш ключ

// ============================================================
// КҮЙЛЕР (STATE)
// ============================================================
let requestCount = 0;
let chatHistory = [];

// ============================================================
// DOM ЭЛЕМЕНТТЕРІ
// ============================================================
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const requestCountEl = document.getElementById("requestCount");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

// ============================================================
// ФУНКЦИЯЛАР
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

// ============================================================
// OPENROUTER API (ЖҰМЫС ІСТЕЙДІ 100%)
// ============================================================
async function sendToOpenRouter(userText) {
  chatHistory.push({ role: "user", content: userText });

  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);
  sendBtn.disabled = true;
  incrementCounter();

  try {
    const messages = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.choices?.[0]?.message?.content || "Жауап алынбады.";

    chatHistory.push({ role: "assistant", content: assistantText });
    updateMessage(typingEl, assistantText);

  } catch (err) {
    console.error("OpenRouter қатесі:", err);
    let errMsg = "⚠️ Қате: " + err.message;

    if (OPENROUTER_KEY === "ВАШ_КЛЮЧ_OPENROUTER") {
      errMsg = "⚠️ OpenRouter кілті орнатылмаған. https://openrouter.ai/keys сайтынан алыңыз.";
    } else if (err.message.includes("401")) {
      errMsg = "⚠️ Кілт жарамсыз. Кілтті тексеріңіз.";
    } else if (err.message.includes("fetch") || err.message.includes("network")) {
      errMsg = "⚠️ Интернет байланысын тексеріңіз.";
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
  sendToOpenRouter(text);
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

chatHistory.push({ role: "assistant", content: "Сәлем! Мен OpenRouter AI-мін. Сұрақ қойыңыз! 🚀" });

// ============================================================
// ТАҚЫРЫП АУЫСТЫРУ
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
// КАРТОЧКАЛАР АНИМАЦИЯСЫ
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
