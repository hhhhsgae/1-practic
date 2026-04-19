# DEV×AI — Әзірлеушіге арналған ЖИ-құралдары

Практикалық жұмыс №1 | ЖИ веб-әзірлеуде

## Жоба туралы

Бұл жоба бағдарламашыларға арналған ЖИ-құралдарының каталогы. Сайтта:
- 3 негізгі ЖИ платформасының карточкалары (GitHub Copilot, Claude, ChatGPT)
- 4 API сервисінің толық салыстырмасы (Groq, Anthropic, OpenAI, Gemini)
- API кілт алу нұсқаулықтары
- CORS мәселесі туралы түсіндірме
- GitHub Secrets арқылы кілтті жасыру жолы
- Тікелей жұмыс жасайтын AI чат (Groq API)

## Қалай іске қосу керек

```bash
# 1. Репозиторийді клондау
git clone https://github.com/username/repo-name.git

# 2. Папкаға кіру
cd repo-name

# 3. Браузерде ашу (Live Server немесе тікелей)
open index.html
```

### API кілт қосу (GitHub Pages үшін)

1. GitHub → Settings → Secrets and variables → Actions
2. **New repository secret** → Name: `GROQ_API_KEY`, Value: `gsk_...`
3. `ai-assistant.js` ішінде: `const GROQ_API_KEY = 'GROQ_KEY_PLACEHOLDER';`
4. `.github/workflows/deploy.yml` файлы автоматты inject жасайды

## Файл структурасы

```
/
├── index.html          — Беттің HTML структурасы
├── style.css           — Pixel art стильдер (қызғылт + күлгін)
├── script.js           — Тема, анимация, санауыш
├── ai-assistant.js     — Groq API виджеті
├── .github/
│   └── workflows/
│       └── deploy.yml  — GitHub Actions deploy
└── README.md
```

## Пайдаланылған құралдар

| Құрал | Мақсаты |
|-------|---------|
| Groq API (Llama 3.3 70b) | AI чат бэкенді |
| GitHub Actions | Автоматты deploy + secret inject |
| GitHub Pages | Статикалық хостинг |
| CSS Custom Properties | Тема жүйесі |
| Intersection Observer API | Карточка анимациясы |
| Press Start 2P (Google Fonts) | Pixel art шрифт |

## Мен не үйрендім

- **Fetch API** және async/await арқылы сыртқы API-ға сұраныс жіберу
- **CORS** мәселесі деген не және оны қалай шешу керек
- **GitHub Secrets** арқылы API кілттерді жасыру
- **CSS Custom Properties** (айнымалылар) арқылы тема жүйесі жасау
- **Intersection Observer** арқылы scroll анимациясын іске қосу
- **localStorage** арқылы пайдаланушы деректерін сақтау
- ЖИ-ды саналы пайдалану — нақты сұрақ қою, кодты өзің түсіну

## API салыстырмасы (тегін tier)

| API | Тегін лимит | CORS | Ұсынылады |
|-----|------------|------|-----------|
| Groq | 1000 сұраныс/күн | ✓ | ★★★★★ |
| Gemini | 60 сұраныс/мин | ✗ | ★★★☆☆ |
| Anthropic | $5 кредит | ✗ | ★★★★☆ |
| OpenAI | Жоқ | ✗ | ★★★☆☆ |
