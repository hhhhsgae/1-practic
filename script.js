// ============================================================
// SCRIPT.JS — DEV×AI
// Функциялар: тема ауысу, карточка анимациясы, санауыш
// ============================================================

/**
 * Тема ауыстыру (қараңғы/ашық)
 * CSS --variables арқылы body.light классын toggle жасайды
 */
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  const saved = localStorage.getItem('devai_theme');

  if (saved === 'light') {
    document.body.classList.add('light');
    icon.textContent = '◑';
  }

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    icon.textContent = isLight ? '◑' : '◐';
    localStorage.setItem('devai_theme', isLight ? 'light' : 'dark');
  });
}

/**
 * Карточкаларды scroll кезінде көрсету анимациясы
 * IntersectionObserver API қолданады
 * @param {string} selector — анимацияланатын элементтер селекторы
 */
function initCardAnimations(selector = '.card') {
  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));
}

/**
 * API сұраныс санауышын арттыру
 * Header және footer-дегі счетчиктерді синхронды жаңартады
 */
window.incrementRequestCounter = function() {
  const count = parseInt(localStorage.getItem('devai_req_count') || '0') + 1;
  localStorage.setItem('devai_req_count', count);
  updateCounterUI(count);
};

/**
 * Санауыш UI-ін жаңарту
 * @param {number} count — ағымдағы сан
 */
function updateCounterUI(count) {
  const headerEl = document.getElementById('requestCount');
  const footerEl = document.getElementById('footerCount');
  const formatted = String(count).padStart(3, '0');
  if (headerEl) headerEl.textContent = formatted;
  if (footerEl) footerEl.textContent = count;
}

/**
 * Пиксель курсорды тінтуір қозғалысына байлау
 */
function initPixelCursor() {
  const cursor = document.getElementById('pixelCursor');
  if (!cursor) return;
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
}

/**
 * Smooth scroll — навигация сілтемелері үшін
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Бастапқы санауыш мәнін localStorage-дан жүктеу
 */
function loadCounter() {
  const saved = parseInt(localStorage.getItem('devai_req_count') || '0');
  updateCounterUI(saved);
}

// ─── Іске қосу ───
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCardAnimations('.card');
  initPixelCursor();
  initSmoothScroll();
  loadCounter();
});
