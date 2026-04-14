// ============================================================
// GitHub Models API — KEY IS HIDDEN (GITHUB_TOKEN_PLACEHOLDER)
// ============================================================

// Бұл плейсхолдер. GitHub Actions автоматты түрде нақты кілтпен ауыстырады
const GITHUB_TOKEN = "GITHUB_TOKEN_PLACEHOLDER";

const MODEL = "openai/gpt-4o-mini";
const MAX_TOKENS = 1024;

// ============================================================
// STATE
// ============================================================
let requestCount = 0;
let chatHistory = [];

// ============================================================
// DOM
// ============================================================
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const requestCountEl = document.getElementById("requestCount");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

// ============================================================
// UI FUNCTIONS
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
// GITHUB MODELS API (KEY HIDDEN)
// ============================================================
async function sendToGitHubModels(userText) {
  chatHistory.push({ role: "user", content: userText });

  const typingEl = appendMessage("assistant", "Жауап жазылуда...", true);
  sendBtn.disabled = true;
  incrementCounter();

  try {
    const messages = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: MAX_TOKENS,
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
    console.error("GitHub API error:", err);
    let errMsg = "⚠️ Қате: " + err.message;

    if (err.message.includes("401")) {
      errMsg = "⚠️ GitHub токені жарамсыз немесе рұқсат жоқ. 'models:read' рұқсатын тексеріңіз.";
    } else if (err.message.includes("CORS") || err.message.includes("fetch")) {
      errMsg = "⚠️ CORS қатесі. https://cors-anywhere.herokuapp.com/ сайтын бір рет ашып, 'Request temporary access' басыңыз.";
    } else if (err.message.includes("model")) {
      errMsg = `⚠️ Модель табылмады: ${MODEL}`;
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
  sendToGitHubModels(text);
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

chatHistory.push({ role: "assistant", content: "Сәлем! Мен GitHub Models AI-мін. Сұрақ қойыңыз! 🚀" });

// ============================================================
// THEME
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
// CARD ANIMATIONS
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
