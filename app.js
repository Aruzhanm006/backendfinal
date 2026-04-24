/* Funding Aggregator — full frontend */

const LANG_KEY = "fa.lang";

const state = {
  user: null,
  favIds: new Set(),
  meta: { countries: [], fields: [], types: [] },
  metaLoaded: false,
};

/* ─── i18n ──────────────────────────────────────────────────────── */
const i18n = {
  ru: {
    nav: { grants:"Гранты", scholarships:"Стипендии", competitions:"Конкурсы", categories:"Категории", about:"О платформе", contact:"Контакты" },
    header: { login:"Войти", search:"Поиск", logout:"Выйти" },
    home: {
      title:"Найдите гранты, стипендии и возможности финансирования по всему миру",
      subtitle:"Одна платформа для студентов, исследователей и стартапов — ищите, фильтруйте и сохраняйте возможности.",
      searchPlaceholder:"Например: AI, biology, climate, Kazakhstan…",
      filters:{ country:"Страна", field:"Область", deadline:"Дедлайн", type:"Тип финансирования" },
      cta:"Смотреть возможности", featured:"Рекомендуемые", latest:"Новые возможности", categories:"Категории финансирования",
    },
    list: { toolbarTitle:"Возможности", sort:"Сортировка", sortNewest:"Сначала новые", sortDeadline:"Ближайший дедлайн", sortAmount:"Больше сумма", empty:"Ничего не найдено. Попробуйте изменить фильтры.", viewDetails:"Подробнее", save:"Сохранить ♡", saved:"Сохранено ♥", apply:"Подать заявку", loading:"Загрузка…", total:"Найдено:" },
    details: { eligibility:"Требования", description:"Описание", official:"Официальный сайт", deadline:"Дедлайн", amount:"Сумма / Приз", organization:"Организация", country:"Страна", back:"← Назад", field:"Область", type:"Тип", degree:"Уровень" },
    categories: { title:"Категории", subtitle:"Быстрый доступ к типам финансирования." },
    about: {
      title:"О платформе", missionTitle:"Наша миссия",
      mission:"Helping students, researchers and startups find grants, scholarships and competitions — quickly and easily.",
      mission_ru:"Помогаем студентам, исследователям и стартапам находить гранты, стипендии и конкурсы — удобно и быстро.",
      statLabel1:"Возможностей", statLabel2:"Стран", statLabel3:"Пользователей", statLabel4:"Партнёров",
      stat1:"500+", stat2:"60+", stat3:"10 000+", stat4:"30+",
      howTitle:"Как это работает",
      step1Title:"Поиск", step1Desc:"Введите тему или страну в строку поиска",
      step2Title:"Фильтры", step2Desc:"Уточните по уровню образования, дедлайну или типу финансирования",
      step3Title:"Сохранение", step3Desc:"Добавьте понравившееся в избранное и возвращайтесь в любой момент",
    },
    contact: {
      title:"Связаться с нами", subtitle:"Есть вопросы или хотите партнёрство? Напишите нам.",
      form:{ name:"Имя", email:"Email", message:"Сообщение", send:"Отправить" },
      emailLabel:"Почта", social:"Соцсети", sent:"Сообщение отправлено!",
    },
    faq: {
      title:"Частые вопросы", subtitle:"Ответы на самые популярные вопросы о платформе.",
      q1:"Платформа бесплатная?", a1:"Да, Funding Aggregator полностью бесплатен для пользователей.",
      q2:"Как часто обновляются данные?", a2:"Данные обновляются регулярно. Вы можете фильтровать возможности по дедлайну.",
      q3:"Как сохранить возможность?", a3:"Нажмите кнопку «Сохранить» на карточке. Для этого нужна регистрация.",
      q4:"Можно ли подать заявку прямо с сайта?", a4:"Кнопка «Подать заявку» откроет официальный сайт программы.",
      q5:"Как стать партнёром?", a5:"Напишите нам на hello@funding-aggregator.demo или через форму обратной связи.",
    },
    auth: {
      loginTitle:"Вход", registerTitle:"Регистрация",
      subtitle:"Зарегистрируйтесь, чтобы сохранять избранное.",
      name:"Имя", email:"Email", password:"Пароль",
      login:"Войти", register:"Регистрация",
      haveAccount:"Уже есть аккаунт? Войти", noAccount:"Нет аккаунта? Регистрация",
      favoritesTitle:"Избранное", emptyFav:"Пока пусто. Сохраняйте возможности, чтобы вернуться к ним.",
      showPassword:"Показать пароль", strength:"Надёжность",
      weak:"Слабый", fair:"Средний", strong:"Сильный",
      rememberMe:"Запомнить меня",
      profileTitle:"Личный кабинет", member:"Участник с",
      errWeak:"Пароль слишком простой (123456 и т.д.)",
    },
    search: { title:"Поиск возможностей", button:"Искать" },
    footer: {
      desc:"Помогаем студентам, исследователям и стартапам находить гранты, стипендии и возможности финансирования.",
      quickLinks:"Быстрые ссылки", support:"Поддержка", rights:"Все права защищены.",
      links:{ grants:"Гранты", scholarships:"Стипендии", competitions:"Конкурсы", categories:"Категории", about:"О платформе", contact:"Контакты", faq:"Частые вопросы", privacy:"Конфиденциальность" },
      social:"Мы в соцсетях",
    },
    toasts:{ saved:"Добавлено в избранное ♥", removed:"Удалено из избранного", sent:"Сообщение отправлено (демо)", login:"Добро пожаловать!", logout:"Вы вышли из аккаунта" },
    labels:{ deadline:"Дедлайн", amount:"Сумма", country:"Страна", type:"Тип", field:"Область", degree:"Уровень", organizer:"Организатор", prize:"Приз" },
    privacy:{ title:"Политика конфиденциальности", text:"Мы не передаём ваши данные третьим лицам. Email используется только для авторизации. Пароли хранятся в зашифрованном виде (bcrypt). Вы можете удалить аккаунт в любой момент." },
    notifications:{
      title:"Настройки уведомлений",
      subtitle:"Выберите за сколько дней до дедлайна получать напоминания.",
      emailLabel:"Email-уведомления",
      daysLabel:"За сколько дней предупреждать",
      save:"Сохранить настройки",
      test:"Отправить тестовое письмо",
      saved:"Настройки сохранены!",
      testSent:"Тестовое письмо отправлено! Проверьте почту.",
      testSentEthereal:"Тестовое письмо отправлено! Откройте ссылку для просмотра:",
      preview:"Посмотреть письмо →",
      days:"дней",
      emailNote:"Если SMTP не настроен — используется Ethereal (тестовые письма). Смотрите консоль сервера для ссылки.",
    },
    deadlineOpts:{ all:"Любой срок", "30":"До 30 дней", "60":"До 60 дней", "90":"До 90 дней" },
    sortOpts:{ newest:"Сначала новые", deadline:"Ближайший дедлайн", amount:"Больше сумма" },
    degreeOpts:{ all:"Любой уровень", Bachelor:"Бакалавр", Master:"Магистратура", PhD:"PhD / Аспирантура" },
    kindLabels:{ grant:"Грант", scholarship:"Стипендия", competition:"Конкурс" },
  },
  kz: {
    nav:{ grants:"Гранттар", scholarships:"Стипендиялар", competitions:"Байқаулар", categories:"Санаттар", about:"Платформа туралы", contact:"Байланыс" },
    header:{ login:"Кіру", search:"Іздеу", logout:"Шығу" },
    home:{
      title:"Бүкіл әлем бойынша гранттар, стипендиялар мен қаржыландыру мүмкіндіктерін табыңыз",
      subtitle:"Студенттер, зерттеушілер мен стартаптар үшін бір платформа.",
      searchPlaceholder:"Мысалы: AI, биология, климат, Қазақстан…",
      filters:{ country:"Ел", field:"Сала", deadline:"Мерзім", type:"Қаржыландыру түрі" },
      cta:"Мүмкіндіктерді қарау", featured:"Ұсынылатын", latest:"Жаңа мүмкіндіктер", categories:"Қаржыландыру санаттары",
    },
    list:{ toolbarTitle:"Мүмкіндіктер", sort:"Сұрыптау", sortNewest:"Алдымен жаңалар", sortDeadline:"Жақын мерзім", sortAmount:"Үлкен сома", empty:"Ештеңе табылмады. Сүзгілерді өзгертіп көріңіз.", viewDetails:"Толығырақ", save:"Сақтау ♡", saved:"Сақталды ♥", apply:"Өтінім беру", loading:"Жүктелуде…", total:"Табылды:" },
    details:{ eligibility:"Талаптар", description:"Сипаттама", official:"Ресми сайт", deadline:"Мерзім", amount:"Сома / Жүлде", organization:"Ұйым", country:"Ел", back:"← Артқа", field:"Сала", type:"Түр", degree:"Деңгей" },
    categories:{ title:"Санаттар", subtitle:"Қаржыландыру түрлеріне жылдам кіру." },
    about:{
      title:"Платформа туралы", missionTitle:"Біздің миссия",
      mission:"Студенттерге, зерттеушілер мен стартаптарға гранттар, стипендиялар мен байқауларды табуға ыңғайлы және жылдам көмек көрсету.",
      mission_ru:"Студенттерге, зерттеушілер мен стартаптарға гранттар мен стипендияларды табуға ыңғайлы көмек.",
      statLabel1:"Мүмкіндіктер", statLabel2:"Елдер", statLabel3:"Пайдаланушылар", statLabel4:"Серіктестер",
      stat1:"500+", stat2:"60+", stat3:"10 000+", stat4:"30+",
      howTitle:"Бұл қалай жұмыс істейді",
      step1Title:"Іздеу", step1Desc:"Тақырыпты немесе елді іздеу жолына енгізіңіз",
      step2Title:"Сүзгілер", step2Desc:"Білім деңгейі, мерзім немесе қаржыландыру түрі бойынша нақтылаңыз",
      step3Title:"Сақтау", step3Desc:"Ұнаған мүмкіндіктерді таңдауларға қосыңыз",
    },
    contact:{
      title:"Бізбен байланыс", subtitle:"Сұрақтарыңыз бар ма? Бізге жазыңыз.",
      form:{ name:"Аты", email:"Email", message:"Хабарлама", send:"Жіберу" },
      emailLabel:"Пошта", social:"Әлеуметтік желілер", sent:"Хабарлама жіберілді!",
    },
    faq:{
      title:"Жиі қойылатын сұрақтар", subtitle:"Платформа туралы ең танымал сұрақтарға жауаптар.",
      q1:"Платформа тегін бе?", a1:"Иә, Funding Aggregator пайдаланушылар үшін толықтай тегін.",
      q2:"Деректер қаншалықты жиі жаңартылады?", a2:"Деректер үнемі жаңартылып отырады. Мерзім бойынша сүзгілей аласыз.",
      q3:"Мүмкіндікті қалай сақтауға болады?", a3:"Картадағы «Сақтау» батырмасын басыңыз. Бұл үшін тіркелу қажет.",
      q4:"Өтінімді тікелей сайттан беруге бола ма?", a4:"«Өтінім беру» батырмасы бағдарламаның ресми сайтын ашады.",
      q5:"Серіктес болу туралы?", a5:"hello@funding-aggregator.demo поштасына немесе кері байланыс формасы арқылы жазыңыз.",
    },
    auth:{
      loginTitle:"Кіру", registerTitle:"Тіркелу",
      subtitle:"Таңдауларды сақтау үшін тіркеліңіз.",
      name:"Аты", email:"Email", password:"Құпиясөз",
      login:"Кіру", register:"Тіркелу",
      haveAccount:"Аккаунтыңыз бар ма? Кіру", noAccount:"Аккаунт жоқ па? Тіркелу",
      favoritesTitle:"Таңдаулылар", emptyFav:"Әзір бос. Мүмкіндіктерді сақтаңыз.",
      showPassword:"Құпиясөзді көрсету", strength:"Сенімділік",
      weak:"Әлсіз", fair:"Орташа", strong:"Күшті",
      rememberMe:"Мені есте сақтау",
      profileTitle:"Жеке кабинет", member:"Мүше болғалы",
      errWeak:"Құпиясөз тым қарапайым (123456 т.б.)",
    },
    search:{ title:"Мүмкіндіктерді іздеу", button:"Іздеу" },
    footer:{
      desc:"Студенттерге, зерттеушілер мен стартаптарға гранттар мен стипендияларды табуға көмектесеміз.",
      quickLinks:"Жылдам сілтемелер", support:"Қолдау", rights:"Барлық құқықтар қорғалған.",
      links:{ grants:"Гранттар", scholarships:"Стипендиялар", competitions:"Байқаулар", categories:"Санаттар", about:"Платформа туралы", contact:"Байланыс", faq:"Жиі сұрақтар", privacy:"Құпиялылық" },
      social:"Бізді бақылаңыз",
    },
    toasts:{ saved:"Таңдаулыларға қосылды ♥", removed:"Таңдаулылардан алынды", sent:"Хабарлама жіберілді (демо)", login:"Қош келдіңіз!", logout:"Шығыңыз" },
    labels:{ deadline:"Мерзім", amount:"Сома", country:"Ел", type:"Түр", field:"Сала", degree:"Деңгей", organizer:"Ұйымдастырушы", prize:"Жүлде" },
    privacy:{ title:"Құпиялылық саясаты", text:"Деректеріңізді үшінші тараптарға бермейміз. Email тек авторизация үшін пайдаланылады. Құпиясөздер шифрланған түрде сақталады (bcrypt)." },
    notifications:{
      title:"Хабарлама параметрлері",
      subtitle:"Мерзімге дейін қанша күн бұрын ескерту алатыныңызды таңдаңыз.",
      emailLabel:"Email хабарламалары",
      daysLabel:"Қанша күн бұрын ескерту",
      save:"Параметрлерді сақтау",
      test:"Сынақ хат жіберу",
      saved:"Параметрлер сақталды!",
      testSent:"Сынақ хат жіберілді! Поштаны тексеріңіз.",
      testSentEthereal:"Сынақ хат жіберілді! Сілтемені ашыңыз:",
      preview:"Хатты қарау →",
      days:"күн",
      emailNote:"SMTP баптанбаса — Ethereal (сынақ хаттар) пайдаланылады. Сервер консолінен сілтемені қараңыз.",
    },
    deadlineOpts:{ all:"Кез келген мерзім", "30":"30 күнге дейін", "60":"60 күнге дейін", "90":"90 күнге дейін" },
    sortOpts:{ newest:"Алдымен жаңалар", deadline:"Жақын мерзім", amount:"Үлкен сома" },
    degreeOpts:{ all:"Кез келген деңгей", Bachelor:"Бакалавр", Master:"Магистратура", PhD:"PhD / Аспирантура" },
    kindLabels:{ grant:"Грант", scholarship:"Стипендия", competition:"Байқау" },
  },
};

function getLang() { return localStorage.getItem(LANG_KEY) || "ru"; }
function setLang(l) { localStorage.setItem(LANG_KEY, l); document.documentElement.lang = l; applyI18n(); renderRoute(); }
function t(key) {
  const keys = key.split(".");
  let obj = i18n[getLang()];
  for (const k of keys) { if (obj == null) return key; obj = obj[k]; }
  return obj ?? key;
}
function pickLang(o, ruKey, kzKey) { return getLang() === "kz" ? (o[kzKey] || o[ruKey]) : (o[ruKey] || o[kzKey]); }

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(getLang() === "kz" ? "kk-KZ" : "ru-RU", { day:"numeric", month:"long", year:"numeric" }); }
  catch { return String(d).slice(0, 10); }
}
function fmtMoney(n) {
  if (n == null || n === 0) return "—";
  if (n >= 1000) return "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return "$" + n;
}
function daysLeft(d) {
  if (!d) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const dl = new Date(d); dl.setHours(0,0,0,0);
  return Math.ceil((dl - now) / 86400000);
}
function daysTag(d) {
  const days = daysLeft(d);
  if (days == null) return "";
  if (days < 0) return `<span class="badge badge--expired">Истёк</span>`;
  if (days <= 14) return `<span class="badge badge--urgent">${days}д.</span>`;
  if (days <= 30) return `<span class="badge badge--soon">${days}д.</span>`;
  return "";
}

/* ─── API ──────────────────────────────────────────────────────── */
async function apiFetch(url, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const res = await fetch(url, { credentials: "include", ...opts, headers });
  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch {}
    const err = new Error(payload?.error || "Request failed " + res.status);
    err.status = res.status; err.payload = payload;
    throw err;
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

function humanError(err) {
  const code = err?.payload?.error;
  const map = {
    invalid_input: getLang()==="kz" ? "Деректер дұрыс емес." : "Некорректные данные.",
    email_taken: getLang()==="kz" ? "Бұл email бұрын тіркелген." : "Этот email уже занят.",
    invalid_credentials: getLang()==="kz" ? "Email немесе құпиясөз қате." : "Неверный email или пароль.",
    unauthorized: getLang()==="kz" ? "Алдымен кіріңіз." : "Сначала войдите.",
    forbidden: getLang()==="kz" ? "Рұқсат жоқ." : "Нет доступа.",
    not_found: getLang()==="kz" ? "Табылмады." : "Не найдено.",
  };
  if (code && map[code]) return map[code];
  if (err?.status === 0) return getLang()==="kz" ? "Серверге қосылу жоқ." : "Нет соединения с сервером.";
  return getLang()==="kz" ? "Қате болды." : "Ошибка. Попробуйте ещё раз.";
}

async function refreshMe() {
  try { const d = await apiFetch("/api/auth/me"); state.user = d.user; }
  catch { state.user = null; }
}
async function refreshFavIds() {
  state.favIds = new Set();
  if (!state.user) return;
  try { const d = await apiFetch("/api/favorites"); state.favIds = new Set((d.items??[]).map(x=>x.id)); }
  catch {}
}
async function ensureMetaLoaded() {
  if (state.metaLoaded) return;
  const d = await apiFetch("/api/opportunities?limit=200&sort=newest");
  const items = d.items ?? [];
  state.meta.countries = [...new Set(items.map(o=>o.country))].sort();
  state.meta.fields = [...new Set(items.map(o=>o.field).filter(Boolean))].sort();
  state.meta.types = [...new Set(items.map(o=>o.type).filter(Boolean))].sort();
  state.metaLoaded = true;
}
function isAuthed() { return Boolean(state.user); }

function toast(msg) {
  const el = document.querySelector(".toast");
  if (!el) return;
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2500);
}

/* ─── RENDER HELPERS ───────────────────────────────────────────── */
function mount(html) {
  const app = document.getElementById("app");
  if (app) { app.innerHTML = html; setActiveNav(); }
}

function kindBadge(kind) {
  const map = { grant:"badge--grant", scholarship:"badge--scholarship", competition:"badge--competition" };
  const label = t("kindLabels." + kind) || kind;
  return `<span class="badge ${map[kind]||""}">${escapeHtml(label)}</span>`;
}

function opCard(o) {
  const title = pickLang(o, "titleRu", "titleKz");
  const saved = state.favIds.has(o.id);
  return `
    <article class="card op-card">
      <div class="op-card__top">
        <div class="op-card__badges">${kindBadge(o.kind)}${daysTag(o.deadline)}</div>
        <button class="fav-btn${saved?" fav-btn--saved":""}" type="button" data-fav="${escapeHtml(o.id)}" aria-label="Save">
          ${saved?"♥":"♡"}
        </button>
      </div>
      <h3 class="op-card__title">${escapeHtml(title)}</h3>
      <div class="op-card__meta">
        <span class="pill">🌍 ${escapeHtml(o.country)}</span>
        <span class="pill">📅 ${escapeHtml(fmtDate(o.deadline))}</span>
        ${o.amount>0?`<span class="pill">💰 ${escapeHtml(fmtMoney(o.amount))}</span>`:""}
        ${o.field?`<span class="pill">🔬 ${escapeHtml(o.field)}</span>`:""}
      </div>
      <div class="op-card__footer">
        <span class="op-card__org">${escapeHtml(o.organization)}</span>
        <a class="btn btn--primary btn--sm" href="#/details/${encodeURIComponent(o.id)}">${escapeHtml(t("list.viewDetails"))}</a>
      </div>
    </article>`;
}

function selectHtml(name, label, values, special) {
  const opts = values.map(v => {
    if (v === "all") return `<option value="all">${escapeHtml(special?t("deadlineOpts.all"):"Все")}</option>`;
    if (special) return `<option value="${escapeHtml(v)}">${escapeHtml(t("deadlineOpts."+v)||v)}</option>`;
    return `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`;
  }).join("");
  return `<select class="select" data-filter="${escapeHtml(name)}" aria-label="${escapeHtml(label)}">${opts}</select>`;
}

function buildFilters(countries, fields, types, kind, curFilters) {
  const degrees = ["Bachelor","Master","PhD"];
  const degOpts = Object.entries(t("degreeOpts")).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  return `
    <div class="filter-bar">
      <input class="input" type="search" value="${escapeHtml(curFilters.q||"")}" placeholder="${escapeHtml(t("home.searchPlaceholder"))}" data-q />
      <select class="select" data-f-country>
        <option value="all">🌍 ${escapeHtml(t("home.filters.country"))}</option>
        ${countries.map(c=>`<option value="${escapeHtml(c)}"${curFilters.country===c?" selected":""}>${escapeHtml(c)}</option>`).join("")}
      </select>
      <select class="select" data-f-field>
        <option value="all">🔬 ${escapeHtml(t("home.filters.field"))}</option>
        ${fields.map(f=>`<option value="${escapeHtml(f)}"${curFilters.field===f?" selected":""}>${escapeHtml(f)}</option>`).join("")}
      </select>
      <select class="select" data-f-deadline>
        <option value="all">📅 ${escapeHtml(t("home.filters.deadline"))}</option>
        <option value="30"${curFilters.deadline==="30"?" selected":""}>${escapeHtml(t("deadlineOpts.30"))}</option>
        <option value="60"${curFilters.deadline==="60"?" selected":""}>${escapeHtml(t("deadlineOpts.60"))}</option>
        <option value="90"${curFilters.deadline==="90"?" selected":""}>${escapeHtml(t("deadlineOpts.90"))}</option>
      </select>
      <select class="select" data-f-type>
        <option value="all">📋 ${escapeHtml(t("home.filters.type"))}</option>
        ${types.map(tp=>`<option value="${escapeHtml(tp)}"${curFilters.type===tp?" selected":""}>${escapeHtml(tp)}</option>`).join("")}
      </select>
      ${kind==="scholarship"?`<select class="select" data-f-degree>${degOpts}</select>`:""}
      <div class="sort-bar">
        <span class="sort-label">${escapeHtml(t("list.sort"))}</span>
        <select class="select" data-sort>
          ${Object.entries(t("sortOpts")).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}
        </select>
      </div>
    </div>`;
}

/* ─── PAGES ─────────────────────────────────────────────────────── */
const categories = [
  { icon:"🎓", key:"Стипендии", href:"#/scholarships", color:"#6366f1" },
  { icon:"💡", key:"Гранты", href:"#/grants", color:"#0ea5e9" },
  { icon:"🏆", key:"Конкурсы", href:"#/competitions", color:"#f59e0b" },
  { icon:"🤖", key:"AI / IT", href:"#/grants?field=AI", color:"#8b5cf6" },
  { icon:"🌱", key:"Экология", href:"#/grants?field=Environment", color:"#10b981" },
  { icon:"🏥", key:"Медицина", href:"#/grants?field=Medicine", color:"#ef4444" },
  { icon:"🚀", key:"Стартапы", href:"#/competitions?field=Startups", color:"#f97316" },
  { icon:"🔬", key:"Наука", href:"#/competitions?field=Science", color:"#14b8a6" },
  { icon:"💼", key:"Бизнес", href:"#/grants?field=Business", color:"#84cc16" },
];

function renderHome() {
  const inner = (featured, latest) => {
    mount(`
      <section class="hero">
        <div class="hero__content">
          <div class="hero__badge">🌟 Funding Aggregator</div>
          <h1 class="hero__title">${escapeHtml(t("home.title"))}</h1>
          <p class="hero__sub">${escapeHtml(t("home.subtitle"))}</p>
          <div class="hero__search">
            <input class="input hero__input" type="search" data-home-q placeholder="${escapeHtml(t("home.searchPlaceholder"))}" />
            <button class="btn btn--primary" type="button" data-home-search>${escapeHtml(t("search.button"))}</button>
          </div>
          <div class="hero__filters">
            ${selectHtml("country", t("home.filters.country"), ["all",...state.meta.countries])}
            ${selectHtml("field", t("home.filters.field"), ["all",...state.meta.fields])}
            ${selectHtml("deadline", t("home.filters.deadline"), ["all","30","60","90"], true)}
            ${selectHtml("type", t("home.filters.type"), ["all",...state.meta.types])}
          </div>
          <button class="btn btn--outline" type="button" data-home-cta>${escapeHtml(t("home.cta"))} →</button>
        </div>
        <div class="hero__stats">
          <div class="stat-card"><div class="stat-card__num">500+</div><div class="stat-card__label">${getLang()==="kz"?"Мүмкіндіктер":"Возможностей"}</div></div>
          <div class="stat-card"><div class="stat-card__num">60+</div><div class="stat-card__label">${getLang()==="kz"?"Елдер":"Стран"}</div></div>
          <div class="stat-card"><div class="stat-card__num">10k+</div><div class="stat-card__label">${getLang()==="kz"?"Пайдаланушылар":"Пользователей"}</div></div>
        </div>
      </section>

      <section class="section">
        <div class="section__head"><h2 class="section__title">${escapeHtml(t("home.categories"))}</h2><a class="link" href="#/categories">${getLang()==="kz"?"Барлығы →":"Все →"}</a></div>
        <div class="categories-grid">
          ${categories.map(c=>`
            <a class="cat-card" href="${escapeHtml(c.href)}" style="--cat-color:${c.color}">
              <div class="cat-card__icon">${c.icon}</div>
              <div class="cat-card__label">${escapeHtml(c.key)}</div>
            </a>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section__head"><h2 class="section__title">${escapeHtml(t("home.featured"))}</h2><a class="link" href="#/grants">${escapeHtml(t("nav.grants"))} →</a></div>
        ${featured.length ? `<div class="grid grid--3">${featured.map(opCard).join("")}</div>` : `<div class="skeleton-grid">${[1,2,3].map(()=>`<div class="skeleton-card"></div>`).join("")}</div>`}
      </section>

      <section class="section">
        <div class="section__head"><h2 class="section__title">${escapeHtml(t("home.latest"))}</h2><a class="link" href="#/competitions">${escapeHtml(t("nav.competitions"))} →</a></div>
        ${latest.length ? `<div class="grid grid--2">${latest.map(opCard).join("")}</div>` : `<div class="skeleton-grid skeleton-grid--2">${[1,2,3,4].map(()=>`<div class="skeleton-card"></div>`).join("")}</div>`}
      </section>
    `);

    const qEl = document.querySelector("[data-home-q]");
    document.querySelector("[data-home-search]")?.addEventListener("click", goSearch);
    document.querySelector("[data-home-cta]")?.addEventListener("click", goSearch);
    qEl?.addEventListener("keydown", e => { if (e.key==="Enter") goSearch(); });

    function goSearch() {
      const params = new URLSearchParams();
      params.set("q", qEl?.value ?? "");
      ["country","field","deadline","type"].forEach(k => {
        const el = document.querySelector(`[data-filter="${k}"]`);
        if (el) params.set(k, el.value);
      });
      location.hash = "#/grants?" + params.toString();
    }
    wireCommonActions();
  };

  inner([], []);
  (async () => {
    await ensureMetaLoaded();
    const [feat, lat] = await Promise.all([
      apiFetch("/api/opportunities?sort=newest&limit=3").then(d=>d.items??[]),
      apiFetch("/api/opportunities?sort=newest&limit=4").then(d=>d.items??[]),
    ]);
    inner(feat, lat);
  })().catch(() => inner([], []));
}

function renderList(kind, opts = {}) {
  const q = opts.q ?? "";
  const filters = opts.filters ?? {};
  const sort = opts.sort ?? "newest";
  const title = kind==="grant"?t("nav.grants"):kind==="scholarship"?t("nav.scholarships"):kind==="competition"?t("nav.competitions"):t("list.toolbarTitle");

  const inner = (list, countries, fields, types) => {
    mount(`
      <section class="section">
        <div class="section__head">
          <div><h2 class="section__title">${escapeHtml(title)}</h2>${list!==null?`<p class="section__sub">${escapeHtml(t("list.total"))} ${list.length}</p>`:""}</div>
        </div>
        <div class="card card--padded filter-panel">
          ${buildFilters(countries, fields, types, kind, {q, ...filters})}
        </div>
        <div class="list-results" style="margin-top:14px">
          ${list===null
            ? `<div class="skeleton-grid skeleton-grid--2">${[1,2,3,4].map(()=>`<div class="skeleton-card"></div>`).join("")}</div>`
            : list.length
              ? `<div class="grid grid--2">${list.map(opCard).join("")}</div>`
              : `<div class="empty-state"><div class="empty-state__icon">🔍</div><div>${escapeHtml(t("list.empty"))}</div></div>`}
        </div>
      </section>`);

    const qEl = document.querySelector("[data-q]");
    const sortEl = document.querySelector("[data-sort]");
    const cEl = document.querySelector("[data-f-country]");
    const fEl = document.querySelector("[data-f-field]");
    const dEl = document.querySelector("[data-f-deadline]");
    const tEl = document.querySelector("[data-f-type]");
    const degEl = document.querySelector("[data-f-degree]");
    if (sortEl) sortEl.value = sort;

    const sync = () => {
      const p = new URLSearchParams();
      p.set("q", qEl?.value ?? "");
      p.set("country", cEl?.value ?? "all");
      p.set("field", fEl?.value ?? "all");
      p.set("deadline", dEl?.value ?? "all");
      p.set("type", tEl?.value ?? "all");
      if (kind==="scholarship") p.set("degree", degEl?.value ?? "all");
      p.set("sort", sortEl?.value ?? "newest");
      const base = kind==="grant"?"#/grants":kind==="scholarship"?"#/scholarships":kind==="competition"?"#/competitions":"#/grants";
      location.hash = base + "?" + p.toString();
    };

    [qEl, sortEl, cEl, fEl, dEl, tEl, degEl].filter(Boolean).forEach(el => el.addEventListener("change", sync));
    qEl?.addEventListener("keydown", e => { if (e.key==="Enter") sync(); });
    wireCommonActions();
  };

  inner(null, state.meta.countries, state.meta.fields, state.meta.types);

  (async () => {
    await ensureMetaLoaded();
    const p = new URLSearchParams();
    p.set("kind", kind);
    if (q) p.set("q", q);
    if (filters.country && filters.country!=="all") p.set("country", filters.country);
    if (filters.field && filters.field!=="all") p.set("field", filters.field);
    if (filters.type && filters.type!=="all") p.set("type", filters.type);
    if (kind==="scholarship" && filters.degree && filters.degree!=="all") p.set("degree", filters.degree);
    if (filters.deadline && filters.deadline!=="all") p.set("deadlineDays", filters.deadline);
    p.set("sort", sort); p.set("limit", "100");
    const data = await apiFetch("/api/opportunities?" + p.toString());
    inner(data.items ?? [], state.meta.countries, state.meta.fields, state.meta.types);
  })().catch(() => inner([], state.meta.countries, state.meta.fields, state.meta.types));
}

function renderDetails(id) {
  mount(`<section class="section"><div class="card card--padded"><div class="skeleton" style="height:200px"></div></div></section>`);
  (async () => {
    const data = await apiFetch(`/api/opportunities/${encodeURIComponent(id)}`);
    const o = data.item;
    if (!o) throw new Error("Not found");
    const title = pickLang(o, "titleRu", "titleKz");
    const desc = pickLang(o, "descRu", "descKz");
    const saved = state.favIds.has(o.id);
    mount(`
      <section class="section">
        <div class="details-header card card--padded">
          <div class="toolbar">
            <a class="btn btn--ghost btn--sm" href="javascript:history.back()">${escapeHtml(t("details.back"))}</a>
            <div style="display:flex;gap:10px;align-items:center">
              <button class="fav-btn${saved?" fav-btn--saved":""} fav-btn--lg" type="button" data-fav="${escapeHtml(o.id)}">${saved?"♥ "+escapeHtml(t("list.saved")):"♡ "+escapeHtml(t("list.save"))}</button>
              <a class="btn btn--primary" href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(t("list.apply"))} →</a>
            </div>
          </div>
        </div>

        <div class="details-body">
          <div class="card card--padded details-main">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${kindBadge(o.kind)}${daysTag(o.deadline)}</div>
            <h1 class="details-title">${escapeHtml(title)}</h1>
            <p class="muted">${escapeHtml(o.organization)}${o.field?" • "+escapeHtml(o.field):""}${o.type?" • "+escapeHtml(o.type):""}</p>
            <div style="height:1px;background:var(--border);margin:16px 0"></div>
            <h3 class="section-label">${escapeHtml(t("details.description"))}</h3>
            <p>${escapeHtml(desc)}</p>
            <h3 class="section-label">${escapeHtml(t("details.eligibility"))}</h3>
            <ul class="req-list">
              <li>${escapeHtml(t("details.organization"))}: <b>${escapeHtml(o.organization)}</b></li>
              <li>${escapeHtml(t("details.country"))}: <b>${escapeHtml(o.country)}</b></li>
              ${o.degree?`<li>${escapeHtml(t("details.degree"))}: <b>${escapeHtml(o.degree)}</b></li>`:""}
              ${o.field?`<li>${escapeHtml(t("details.field"))}: <b>${escapeHtml(o.field)}</b></li>`:""}
            </ul>
            <div style="margin-top:20px">
              <a class="btn btn--primary" href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer noopener">🔗 ${escapeHtml(t("details.official"))} →</a>
            </div>
          </div>

          <aside class="details-sidebar">
            <div class="card card--padded">
              <div class="kv">
                <div class="kv__row"><span>${escapeHtml(t("details.deadline"))}</span><b>${escapeHtml(fmtDate(o.deadline))}</b></div>
                <div class="kv__row"><span>${escapeHtml(t("details.amount"))}</span><b>${o.amount>0?escapeHtml(fmtMoney(o.amount)):"—"}</b></div>
                <div class="kv__row"><span>${escapeHtml(t("details.organization"))}</span><b>${escapeHtml(o.organization)}</b></div>
                <div class="kv__row"><span>${escapeHtml(t("details.country"))}</span><b>${escapeHtml(o.country)}</b></div>
                ${o.field?`<div class="kv__row"><span>${escapeHtml(t("details.field"))}</span><b>${escapeHtml(o.field)}</b></div>`:""}
                ${o.degree?`<div class="kv__row"><span>${escapeHtml(t("details.degree"))}</span><b>${escapeHtml(o.degree)}</b></div>`:""}
              </div>
            </div>
          </aside>
        </div>
      </section>`);
    wireCommonActions();
  })().catch(() => mount(`<div class="empty-state"><div class="empty-state__icon">⚠️</div><div>${escapeHtml(t("list.empty"))}</div></div>`));
}

function renderCategories() {
  mount(`
    <section class="section">
      <div class="section__head"><div><h2 class="section__title">${escapeHtml(t("categories.title"))}</h2><p class="section__sub">${escapeHtml(t("categories.subtitle"))}</p></div></div>
      <div class="categories-grid-lg">
        ${categories.map(c=>`
          <a class="cat-card cat-card--lg" href="${escapeHtml(c.href)}" style="--cat-color:${c.color}">
            <div class="cat-card__icon cat-card__icon--lg">${c.icon}</div>
            <div class="cat-card__label">${escapeHtml(c.key)}</div>
            <div class="cat-card__arrow">→</div>
          </a>`).join("")}
      </div>
    </section>`);
}

function renderAbout() {
  const l = t.bind(null);
  mount(`
    <section class="section about-page">
      <div class="about-hero card card--padded">
        <div class="about-hero__badge">ℹ️ ${escapeHtml(t("about.title"))}</div>
        <h2 class="about-hero__title">${escapeHtml(t("about.missionTitle"))}</h2>
        <p>${escapeHtml(t("about.mission_ru"))}</p>
      </div>

      <div class="stats-row">
        ${[["stat1","statLabel1"],["stat2","statLabel2"],["stat3","statLabel3"],["stat4","statLabel4"]].map(([sv,sl])=>`
          <div class="card card--padded stat-big">
            <div class="stat-big__num">${escapeHtml(t("about."+sv))}</div>
            <div class="stat-big__label">${escapeHtml(t("about."+sl))}</div>
          </div>`).join("")}
      </div>

      <div class="card card--padded how-section">
        <h3>${escapeHtml(t("about.howTitle"))}</h3>
        <div class="how-steps">
          ${[1,2,3].map(i=>`
            <div class="how-step">
              <div class="how-step__num">${i}</div>
              <div>
                <div class="how-step__title">${escapeHtml(t("about.step"+i+"Title"))}</div>
                <div class="how-step__desc">${escapeHtml(t("about.step"+i+"Desc"))}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </section>`);
}

function renderContact() {
  mount(`
    <section class="section">
      <div class="section__head"><div><h2 class="section__title">${escapeHtml(t("contact.title"))}</h2><p class="section__sub">${escapeHtml(t("contact.subtitle"))}</p></div></div>
      <div class="contact-layout">
        <div class="card card--padded">
          <form class="form" data-contact-form>
            <div class="form__row"><label>${escapeHtml(t("contact.form.name"))}</label><input class="input" type="text" required /></div>
            <div class="form__row"><label>${escapeHtml(t("contact.form.email"))}</label><input class="input" type="email" required /></div>
            <div class="form__row"><label>${escapeHtml(t("contact.form.message"))}</label><textarea class="input textarea" required></textarea></div>
            <button class="btn btn--primary" type="submit">${escapeHtml(t("contact.form.send"))}</button>
          </form>
        </div>
        <aside class="card card--padded">
          <div class="kv">
            <div class="kv__row"><span>${escapeHtml(t("contact.emailLabel"))}</span><b>hello@funding-aggregator.demo</b></div>
            <div class="kv__row"><span>Telegram</span><b>@fundingaggregator</b></div>
          </div>
          <div style="margin-top:16px">
            <div class="muted" style="font-weight:700;margin-bottom:8px">${escapeHtml(t("footer.social"))}</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a class="btn btn--ghost btn--sm" href="#">LinkedIn</a>
              <a class="btn btn--ghost btn--sm" href="#">Telegram</a>
              <a class="btn btn--ghost btn--sm" href="#">Instagram</a>
              <a class="btn btn--ghost btn--sm" href="#">X / Twitter</a>
            </div>
          </div>
        </aside>
      </div>
    </section>`);
  document.querySelector("[data-contact-form]")?.addEventListener("submit", e => {
    e.preventDefault(); toast(t("contact.sent")); e.target.reset();
  });
}

function renderFaq() {
  const items = [1,2,3,4,5];
  mount(`
    <section class="section">
      <div class="section__head"><div><h2 class="section__title">${escapeHtml(t("faq.title"))}</h2><p class="section__sub">${escapeHtml(t("faq.subtitle"))}</p></div></div>
      <div class="faq-list">
        ${items.map(i=>`
          <div class="faq-item card card--padded" data-faq="${i}">
            <div class="faq-q" data-faq-toggle="${i}">
              <span>${escapeHtml(t("faq.q"+i))}</span>
              <span class="faq-arrow">▾</span>
            </div>
            <div class="faq-a" id="faq-a-${i}" hidden>${escapeHtml(t("faq.a"+i))}</div>
          </div>`).join("")}
      </div>
    </section>`);
  document.querySelectorAll("[data-faq-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = btn.getAttribute("data-faq-toggle");
      const ans = document.getElementById("faq-a-"+n);
      if (ans) ans.hidden = !ans.hidden;
      btn.querySelector(".faq-arrow").textContent = ans?.hidden ? "▾" : "▴";
    });
  });
}

function renderPrivacy() {
  mount(`<section class="section"><div class="card card--padded"><h2>${escapeHtml(t("privacy.title"))}</h2><p>${escapeHtml(t("privacy.text"))}</p></div></section>`);
}

/* ── Password strength ──────────────────────────────────────────── */
const WEAK_PASSWORDS = new Set(["123456","12345678","password","qwerty","111111","000000","123456789","abc123","1234","1234567","654321","superman","123123"]);
function passwordStrength(pw) {
  if (!pw || pw.length < 6) return 0;
  if (WEAK_PASSWORDS.has(pw.toLowerCase())) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}
function strengthLabel(s) { return [t("auth.weak"), t("auth.fair"), t("auth.fair"), t("auth.strong")][s] || ""; }
function strengthClass(s) { return ["weak","fair","fair","strong"][s] || "weak"; }

function renderLogin() {
  if (isAuthed()) {
    mount(`
      <section class="section">
        <div class="profile-layout">
          <div class="card card--padded profile-card">
            <div class="profile-avatar">${escapeHtml((state.user.name||"?")[0].toUpperCase())}</div>
            <h2 class="profile-name">${escapeHtml(state.user.name)}</h2>
            <div class="muted">${escapeHtml(state.user.email)}</div>
            <div class="muted" style="font-size:12px;margin-top:4px">${escapeHtml(t("auth.member"))} ${escapeHtml(fmtDate(state.user.createdAt))}</div>
            <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
              <a class="btn btn--primary" href="#/favorites">${escapeHtml(t("auth.favoritesTitle"))} →</a>
              <a class="btn btn--ghost" href="#/notifications">🔔 ${escapeHtml(t("notifications.title"))}</a>
              <button class="btn btn--ghost" type="button" data-logout>${escapeHtml(t("header.logout"))}</button>
            </div>
          </div>
        </div>
      </section>`);
    document.querySelector("[data-logout]")?.addEventListener("click", async () => {
      try { await apiFetch("/api/auth/logout", { method:"POST" }); } finally {
        await refreshMe(); await refreshFavIds(); toast(t("toasts.logout")); applyI18n(); location.hash = "#/";
      }
    });
    return;
  }

  mount(`
    <section class="section">
      <div class="auth-layout">
        <div class="card card--padded auth-card">
          <div class="auth-tabs">
            <button class="auth-tab auth-tab--active" type="button" data-auth-mode="login">${escapeHtml(t("auth.login"))}</button>
            <button class="auth-tab" type="button" data-auth-mode="register">${escapeHtml(t("auth.register"))}</button>
          </div>
          <p class="muted auth-sub">${escapeHtml(t("auth.subtitle"))}</p>

          <form class="form" data-auth-form>
            <input type="hidden" value="login" data-auth-mode-value />
            <div class="form__row" data-name-row hidden>
              <label>${escapeHtml(t("auth.name"))}</label>
              <input class="input" type="text" data-name autocomplete="name" />
            </div>
            <div class="form__row">
              <label>${escapeHtml(t("auth.email"))}</label>
              <input class="input" type="email" required data-email autocomplete="email" />
            </div>
            <div class="form__row">
              <label>${escapeHtml(t("auth.password"))}</label>
              <div class="pw-wrap">
                <input class="input" type="password" required minlength="6" data-password autocomplete="current-password" />
                <button class="pw-toggle" type="button" data-pw-toggle aria-label="${escapeHtml(t("auth.showPassword"))}">👁</button>
              </div>
              <div class="strength-bar" data-strength-bar hidden>
                <div class="strength-track"><div class="strength-fill" data-strength-fill></div></div>
                <span class="strength-label" data-strength-label></span>
              </div>
            </div>
            <div class="form__row" data-register-only hidden>
              <label class="checkbox-label">
                <input type="checkbox" /> ${escapeHtml(t("auth.rememberMe"))}
              </label>
            </div>
            <div class="form__error" data-auth-error hidden></div>
            <button class="btn btn--primary btn--block" type="submit" data-auth-submit>${escapeHtml(t("auth.login"))}</button>
          </form>
          <div style="margin-top:12px;text-align:center">
            <a class="link" href="#" data-switch-mode>${escapeHtml(t("auth.noAccount"))}</a>
          </div>
        </div>
      </div>
    </section>`);

  const modeVal = document.querySelector("[data-auth-mode-value]");
  const nameRow = document.querySelector("[data-name-row]");
  const submitBtn = document.querySelector("[data-auth-submit]");
  const pwInput = document.querySelector("[data-password]");
  const strengthBar = document.querySelector("[data-strength-bar]");
  const strengthFill = document.querySelector("[data-strength-fill]");
  const strengthLbl = document.querySelector("[data-strength-label]");
  const errEl = document.querySelector("[data-auth-error]");
  const switchLink = document.querySelector("[data-switch-mode]");
  const regOnly = document.querySelector("[data-register-only]");

  const setMode = mode => {
    modeVal.value = mode;
    const isReg = mode === "register";
    nameRow.hidden = !isReg;
    nameRow.querySelector("input").required = isReg;
    regOnly.hidden = !isReg;
    submitBtn.textContent = isReg ? t("auth.register") : t("auth.login");
    document.querySelectorAll("[data-auth-mode]").forEach(b => {
      b.classList.toggle("auth-tab--active", b.getAttribute("data-auth-mode") === mode);
    });
    switchLink.textContent = isReg ? t("auth.haveAccount") : t("auth.noAccount");
    strengthBar.hidden = !isReg;
    errEl.hidden = true;
  };
  setMode("login");

  document.querySelectorAll("[data-auth-mode]").forEach(b => b.addEventListener("click", () => setMode(b.getAttribute("data-auth-mode"))));
  switchLink.addEventListener("click", e => { e.preventDefault(); setMode(modeVal.value==="login"?"register":"login"); });

  document.querySelector("[data-pw-toggle]")?.addEventListener("click", () => {
    const type = pwInput.type === "password" ? "text" : "password";
    pwInput.type = type;
  });

  pwInput?.addEventListener("input", () => {
    if (modeVal.value !== "register") return;
    const pw = pwInput.value;
    const s = passwordStrength(pw);
    strengthBar.hidden = !pw;
    if (pw) {
      strengthFill.className = "strength-fill strength-fill--" + strengthClass(s);
      strengthFill.style.width = ["0%","33%","66%","100%"][s];
      strengthLbl.textContent = strengthLabel(s);
    }
  });

  document.querySelector("[data-auth-form]")?.addEventListener("submit", async e => {
    e.preventDefault();
    errEl.hidden = true;
    const mode = modeVal.value;
    const name = document.querySelector("[data-name]")?.value ?? "";
    const email = document.querySelector("[data-email]")?.value ?? "";
    const password = pwInput?.value ?? "";

    if (mode==="register") {
      if (WEAK_PASSWORDS.has(password.toLowerCase())) {
        errEl.hidden = false; errEl.textContent = t("auth.errWeak"); return;
      }
    }

    submitBtn.disabled = true; submitBtn.textContent = "…";
    try {
      if (mode === "register") {
        await apiFetch("/api/auth/register", { method:"POST", body: JSON.stringify({ name, email, password }) });
      } else {
        await apiFetch("/api/auth/login", { method:"POST", body: JSON.stringify({ email, password }) });
      }
      await refreshMe(); await refreshFavIds();
      toast(t("toasts.login")); applyI18n(); location.hash = "#/favorites";
    } catch (err) {
      errEl.hidden = false; errEl.textContent = humanError(err);
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = mode==="register"?t("auth.register"):t("auth.login");
    }
  });
}

function renderFavorites() {
  mount(`<section class="section"><div class="section__head"><h2 class="section__title">${escapeHtml(t("auth.favoritesTitle"))}</h2></div><div class="card card--padded muted">${escapeHtml(t("list.loading"))}</div></section>`);
  (async () => {
    if (!isAuthed()) {
      mount(`<section class="section"><div class="card card--padded"><h2>${escapeHtml(t("auth.favoritesTitle"))}</h2><p class="muted">${escapeHtml(t("auth.subtitle"))}</p><div style="margin-top:14px"><a class="btn btn--primary" href="#/login">${escapeHtml(t("auth.login"))}</a></div></div></section>`);
      return;
    }
    const data = await apiFetch("/api/favorites");
    const list = data.items ?? [];
    state.favIds = new Set(list.map(x=>x.id));
    mount(`
      <section class="section">
        <div class="section__head"><div><h2 class="section__title">${escapeHtml(t("auth.favoritesTitle"))}</h2><p class="section__sub">${escapeHtml(t("list.total"))} ${list.length}</p></div></div>
        ${list.length ? `<div class="grid grid--2">${list.map(opCard).join("")}</div>` : `<div class="empty-state"><div class="empty-state__icon">💾</div><div>${escapeHtml(t("auth.emptyFav"))}</div></div>`}
      </section>`);
    wireCommonActions();
  })().catch(() => mount(`<div class="empty-state"><div class="empty-state__icon">⚠️</div></div>`));
}

/* ─── ROUTING ───────────────────────────────────────────────────── */
function parseQuery(qs) {
  const p = new URLSearchParams(qs || "");
  return {
    q: p.get("q") ?? "",
    filters:{ country:p.get("country")??"all", field:p.get("field")??"all", deadline:p.get("deadline")??"all", type:p.get("type")??"all", degree:p.get("degree")??"all" },
    sort: p.get("sort") ?? "newest",
  };
}

function renderRoute() {
  const hash = location.hash || "#/";
  const [path, query] = hash.slice(2).split("?");
  const parts = (path||"").split("/").filter(Boolean);
  const page = parts[0] || "";
  document.querySelector(".nav")?.classList.remove("is-open");

  if (page===""||page==="home") renderHome();
  else if (page==="grants") { const {q,filters,sort}=parseQuery(query); renderList("grant",{q,filters,sort}); }
  else if (page==="scholarships") { const {q,filters,sort}=parseQuery(query); renderList("scholarship",{q,filters,sort}); }
  else if (page==="competitions") { const {q,filters,sort}=parseQuery(query); renderList("competition",{q,filters,sort}); }
  else if (page==="details") renderDetails(parts[1]?decodeURIComponent(parts[1]):"");
  else if (page==="categories") renderCategories();
  else if (page==="about") renderAbout();
  else if (page==="contact") renderContact();
  else if (page==="faq") renderFaq();
  else if (page==="privacy") renderPrivacy();
  else if (page==="notifications") renderNotifications();
  else if (page==="login") renderLogin();
  else if (page==="favorites") renderFavorites();
  else renderHome();

  wireCommonActions();
}

function wireCommonActions() {
  document.querySelectorAll("[data-fav]").forEach(btn => {
    if (btn._favWired) return; btn._favWired = true;
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-fav");
      if (!id) return;
      if (!isAuthed()) { location.hash = "#/login"; return; }
      try {
        const data = await apiFetch(`/api/favorites/${encodeURIComponent(id)}/toggle`, { method:"POST" });
        if (data.saved) state.favIds.add(id); else state.favIds.delete(id);
        toast(data.saved ? t("toasts.saved") : t("toasts.removed"));
        renderRoute();
      } catch (err) { toast(humanError(err)); }
    });
  });
}

/* ─── I18N / HEADER ─────────────────────────────────────────────── */
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
  const navMap = [
    ["#/grants","nav.grants"],["#/scholarships","nav.scholarships"],["#/competitions","nav.competitions"],
    ["#/categories","nav.categories"],["#/about","nav.about"],["#/contact","nav.contact"],
  ];
  document.querySelectorAll("[data-nav]").forEach(a => {
    const found = navMap.find(([h])=>h===a.getAttribute("href"));
    if (found) a.textContent = t(found[1]);
  });
  const al = document.querySelector("[data-auth-link]");
  if (al) al.textContent = isAuthed() ? t("header.logout") : t("header.login");
  const os = document.querySelector("[data-open-search]");
  if (os) os.textContent = t("header.search");
  document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("is-active", b.getAttribute("data-lang")===getLang()));
  const si = document.querySelector("[data-search-input]");
  if (si) si.setAttribute("placeholder", t("home.searchPlaceholder"));
  const sb = document.querySelector("[data-search-submit]");
  if (sb) sb.textContent = t("search.button");
}

function setActiveNav() {
  const route = location.hash || "#/";
  document.querySelectorAll(".nav__link").forEach(a => a.classList.toggle("is-active", route.startsWith(a.getAttribute("href"))));
}

function initHeader() {
  document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", ()=>setLang(b.getAttribute("data-lang"))));
  document.querySelector("[data-auth-link]")?.addEventListener("click", e => { e.preventDefault(); location.hash="#/login"; });
  document.querySelector("[data-nav-toggle]")?.addEventListener("click", () => document.querySelector(".nav")?.classList.toggle("is-open"));

  const modal = document.querySelector("[data-modal]");
  const openBtn = document.querySelector("[data-open-search]");
  const searchInput = document.querySelector("[data-search-input]");
  const submitBtn = document.querySelector("[data-search-submit]");
  const filtersWrap = document.querySelector("[data-search-filters]");
  const resultsWrap = document.querySelector("[data-search-results]");

  const openModal = () => { if (!modal) return; modal.hidden = false; renderSearch(); setTimeout(()=>searchInput?.focus(),50); };
  const closeModal = () => { if (!modal) return; modal.hidden = true; };

  openBtn?.addEventListener("click", openModal);
  document.querySelectorAll("[data-close-modal]").forEach(x=>x.addEventListener("click",closeModal));
  window.addEventListener("keydown", e => { if (e.key==="Escape") closeModal(); });

  function renderSearch() {
    if (!filtersWrap || !resultsWrap) return;
    const countries = state.meta.countries;
    const fields = state.meta.fields;
    const types = state.meta.types;
    filtersWrap.innerHTML = `
      <div class="filters" style="margin-top:12px">
        ${selectHtml("country", t("home.filters.country"), ["all",...countries])}
        ${selectHtml("field", t("home.filters.field"), ["all",...fields])}
        ${selectHtml("deadline", t("home.filters.deadline"), ["all","30","60","90"], true)}
        ${selectHtml("type", t("home.filters.type"), ["all",...types])}
      </div>`;

    const readFilters = () => ({
      country: filtersWrap.querySelector("[data-filter='country']")?.value ?? "all",
      field: filtersWrap.querySelector("[data-filter='field']")?.value ?? "all",
      deadline: filtersWrap.querySelector("[data-filter='deadline']")?.value ?? "all",
      type: filtersWrap.querySelector("[data-filter='type']")?.value ?? "all",
    });

    const run = async () => {
      const q = searchInput?.value ?? "";
      const f = readFilters();
      const p = new URLSearchParams(); if (q) p.set("q", q);
      if (f.country!=="all") p.set("country", f.country);
      if (f.field!=="all") p.set("field", f.field);
      if (f.type!=="all") p.set("type", f.type);
      if (f.deadline!=="all") p.set("deadlineDays", f.deadline);
      p.set("limit","8");
      const data = await apiFetch("/api/opportunities?"+p.toString()).catch(()=>({items:[]}));
      const list = data.items ?? [];
      resultsWrap.innerHTML = list.length ? list.map(opCard).join("") : `<div class="empty-state"><div>${escapeHtml(t("list.empty"))}</div></div>`;
      wireCommonActions();
    };

    submitBtn?.addEventListener("click", run);
    searchInput?.addEventListener("keydown", e => { if (e.key==="Enter") run(); });
    filtersWrap.querySelectorAll("select").forEach(s=>s.addEventListener("change", run));
    run();
  }
}

/* ─── BOOTSTRAP ─────────────────────────────────────────────────── */

function renderNotifications() {
  if (!isAuthed()) {
    mount(`<section class="section"><div class="card card--padded"><h2>${escapeHtml(t("notifications.title"))}</h2><p class="muted">${escapeHtml(t("auth.subtitle"))}</p><div style="margin-top:14px"><a class="btn btn--primary" href="#/login">${escapeHtml(t("auth.login"))}</a></div></div></section>`);
    return;
  }

  mount(`
    <section class="section">
      <div class="section__head"><div><h2 class="section__title">${escapeHtml(t("notifications.title"))}</h2><p class="section__sub">${escapeHtml(t("notifications.subtitle"))}</p></div></div>
      <div class="auth-layout">
        <div class="card card--padded">
          <div class="form" id="notif-form">
            <div class="form__row">
              <label class="checkbox-label">
                <input type="checkbox" id="notif-email" checked />
                ${escapeHtml(t("notifications.emailLabel"))}
              </label>
            </div>
            <div class="form__row">
              <label>${escapeHtml(t("notifications.daysLabel"))}</label>
              <div style="display:flex;align-items:center;gap:12px">
                <input type="range" id="notif-days" min="1" max="30" value="14" style="flex:1" />
                <span id="notif-days-val" style="font-size:14px;font-weight:700;min-width:60px">14 ${escapeHtml(t("notifications.days"))}</span>
              </div>
            </div>
            <div class="form__error" id="notif-error" hidden></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn--primary" type="button" id="notif-save">${escapeHtml(t("notifications.save"))}</button>
              <button class="btn btn--ghost" type="button" id="notif-test">${escapeHtml(t("notifications.test"))}</button>
            </div>
            <p class="muted" style="font-size:12px;margin-top:8px">${escapeHtml(t("notifications.emailNote"))}</p>
          </div>
          <div id="notif-preview" style="display:none;margin-top:12px;padding:10px;background:var(--muted-bg);border-radius:var(--r2)"></div>
        </div>
      </div>
    </section>`);

  // Load current settings
  apiFetch("/api/notifications/settings").then(d => {
    const s = d.settings;
    const emailEl = document.getElementById("notif-email");
    const daysEl = document.getElementById("notif-days");
    const daysVal = document.getElementById("notif-days-val");
    if (emailEl) emailEl.checked = s.email !== false;
    if (daysEl) { daysEl.value = s.daysBeforeDeadline || 14; daysVal.textContent = (s.daysBeforeDeadline || 14) + " " + t("notifications.days"); }
  }).catch(() => {});

  document.getElementById("notif-days")?.addEventListener("input", e => {
    document.getElementById("notif-days-val").textContent = e.target.value + " " + t("notifications.days");
  });

  document.getElementById("notif-save")?.addEventListener("click", async () => {
    const btn = document.getElementById("notif-save");
    btn.disabled = true; btn.textContent = "…";
    try {
      await apiFetch("/api/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({
          email: document.getElementById("notif-email")?.checked ?? true,
          daysBeforeDeadline: parseInt(document.getElementById("notif-days")?.value || "14"),
        }),
      });
      toast(t("notifications.saved"));
    } catch (err) {
      const errEl = document.getElementById("notif-error");
      if (errEl) { errEl.hidden = false; errEl.textContent = humanError(err); }
    } finally {
      btn.disabled = false; btn.textContent = t("notifications.save");
    }
  });

  document.getElementById("notif-test")?.addEventListener("click", async () => {
    const btn = document.getElementById("notif-test");
    btn.disabled = true; btn.textContent = "…";
    try {
      const result = await apiFetch("/api/notifications/test", { method: "POST" });
      if (result.previewUrl) {
        const box = document.getElementById("notif-preview");
        box.style.display = "block";
        box.innerHTML = `<span style="font-size:13px">${escapeHtml(t("notifications.testSentEthereal"))} </span><a class="link" href="${escapeHtml(result.previewUrl)}" target="_blank">${escapeHtml(t("notifications.preview"))}</a>`;
      } else {
        toast(t("notifications.testSent"));
      }
    } catch (err) {
      const errEl = document.getElementById("notif-error");
      if (errEl) { errEl.hidden = false; errEl.textContent = humanError(err); }
    } finally {
      btn.disabled = false; btn.textContent = t("notifications.test");
    }
  });
}

async function bootstrap() {
  document.documentElement.lang = getLang();
  applyI18n();
  initHeader();
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = String(new Date().getFullYear()));
  await refreshMe();
  await refreshFavIds();
  await ensureMetaLoaded().catch(()=>{});
  applyI18n();
  renderRoute();
  window.addEventListener("hashchange", renderRoute);
}

bootstrap();
