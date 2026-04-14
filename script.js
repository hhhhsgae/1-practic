// API_KEY-ті осы жерге енгізіңіз
const API_KEY = "AIzaSyAURaVDG3-8uHGXKZCbuvZUG8srKVdoE2s";
const MODEL = "gemini-2.0-flash";
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
