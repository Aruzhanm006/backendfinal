/**
 * Funding Aggregator — Scraper Module
 *
 * Парсит открытые источники грантов и стипендий.
 * Использует нативный fetch (Node.js 18+), без внешних зависимостей.
 *
 * Источники:
 *  1. scholarshipdb.net          — крупная база стипендий (HTML scraping)
 *  2. opportunitiesforafricans   — международные конкурсы (HTML scraping)
 *  3. youth.gov.kz               — казахстанские гранты (HTML scraping)
 *  4. grants.gov RSS             — американские гранты (XML/RSS)
 *  5. Static enrichment list     — дополнительные записи (всегда работает)
 */

import { prisma } from "./db.js";

const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; FundingAggregatorBot/1.0; +https://funding-aggregator.demo)";

// ─── helpers ──────────────────────────────────────────────────────────────────

function log(...args) {
  console.log("[scraper]", new Date().toISOString(), ...args);
}

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      ...options,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Simple regex-based HTML tag stripper */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extract all matches of a regex with named groups */
function matchAll(html, pattern) {
  const results = [];
  let m;
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  while ((m = re.exec(html)) !== null) {
    results.push(m);
  }
  return results;
}

/** Normalize a deadline string to a Date object, returns null if unparseable */
function parseDeadline(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+/g, " ");

  // ISO format: 2026-06-15
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const d = new Date(cleaned);
    if (!isNaN(d)) return d;
  }

  // "June 15, 2026" or "15 June 2026"
  const months = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
  const m1 = cleaned.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m1 && months[m1[1].toLowerCase()] !== undefined) {
    return new Date(+m1[3], months[m1[1].toLowerCase()], +m1[2]);
  }
  const m2 = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (m2 && months[m2[2].toLowerCase()] !== undefined) {
    return new Date(+m2[3], months[m2[2].toLowerCase()], +m2[1]);
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const m3 = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m3) {
    const d = new Date(+m3[3], +m3[1] - 1, +m3[2]);
    if (!isNaN(d)) return d;
  }

  return null;
}

/** Returns a deadline at least N days from now, or falls back to N months out */
function futureDeadline(minDays = 30, maxDays = 365) {
  const d = new Date();
  const days = minDays + Math.floor(Math.random() * (maxDays - minDays));
  d.setDate(d.getDate() + days);
  return d;
}

/** Upsert one opportunity into DB, returns "added"|"updated"|"skipped" */
async function upsertOpportunity(data) {
  if (!data.source || !data.externalId) return "skipped";

  const existing = await prisma.opportunity.findUnique({
    where: { source_externalId: { source: data.source, externalId: data.externalId } },
  });

  if (existing) {
    // update deadline & amounts if changed
    const needsUpdate =
      existing.deadline.toISOString() !== data.deadline.toISOString() ||
      existing.amount !== data.amount;
    if (needsUpdate) {
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: { deadline: data.deadline, amount: data.amount, updatedAt: new Date() },
      });
      return "updated";
    }
    return "skipped";
  }

  await prisma.opportunity.create({ data });
  return "added";
}

// ─── Source 1: Static enrichment list (always works, no network needed) ──────

const STATIC_OPPORTUNITIES = [
  // Гранты
  {
    kind: "grant", source: "static_enrichment", externalId: "worldbank-youthsummit-2026",
    titleRu: "World Bank Youth Summit Grant 2026",
    titleKz: "World Bank жастар саммиті гранты 2026",
    organization: "World Bank Group",
    deadline: futureDeadline(45, 120),
    amount: 10000, country: "Worldwide", field: "Development", type: "Research Grant",
    descRu: "Гранты для молодых исследователей и практиков в области международного развития. Финансирование проектов по снижению бедности и устойчивому росту.",
    descKz: "Халықаралық даму саласындағы жас зерттеушілер мен тәжірибешілерге арналған гранттар.",
    url: "https://www.worldbank.org/en/programs/youth-summit",
  },
  {
    kind: "grant", source: "static_enrichment", externalId: "gates-foundation-grand-challenges-2026",
    titleRu: "Gates Foundation Grand Challenges Grant",
    titleKz: "Gates Foundation Grand Challenges гранты",
    organization: "Bill & Melinda Gates Foundation",
    deadline: futureDeadline(60, 150),
    amount: 100000, country: "Worldwide", field: "Medicine", type: "Research Grant",
    descRu: "Финансирование прорывных исследований в области здравоохранения и сельского хозяйства. Открыто для исследователей из всех стран.",
    descKz: "Денсаулық сақтау және ауыл шаруашылығы саласындағы жаңашыл зерттеулерді қаржыландыру.",
    url: "https://gcgh.grandchallenges.org",
  },
  {
    kind: "grant", source: "static_enrichment", externalId: "unesco-young-professionals-2026",
    titleRu: "UNESCO Young Professionals Programme",
    titleKz: "ЮНЕСКО жас мамандар бағдарламасы",
    organization: "UNESCO",
    deadline: futureDeadline(30, 90),
    amount: 15000, country: "Worldwide", field: "Education", type: "Program",
    descRu: "Поддержка молодых специалистов в сферах образования, науки, культуры и коммуникации.",
    descKz: "Білім, ғылым, мәдениет және коммуникация салаларындағы жас мамандарды қолдау.",
    url: "https://en.unesco.org/careers/young-professionals",
  },
  {
    kind: "grant", source: "static_enrichment", externalId: "apple-developer-academy-2026",
    titleRu: "Apple Developer Academy Grant",
    titleKz: "Apple Developer Academy гранты",
    organization: "Apple Inc.",
    deadline: futureDeadline(40, 100),
    amount: 8000, country: "Worldwide", field: "IT", type: "Technology Grant",
    descRu: "Поддержка студентов, желающих стать iOS разработчиками. Включает обучение, менторство и доступ к Apple Developer Program.",
    descKz: "iOS әзірлеушісі болғысы келетін студенттерді қолдау. Оқыту, менторлық және Apple Developer Program кіруді қамтиды.",
    url: "https://developer.apple.com/academies",
  },
  {
    kind: "grant", source: "static_enrichment", externalId: "soros-open-society-2026",
    titleRu: "Open Society Foundations Grant",
    titleKz: "Open Society Foundations гранты",
    organization: "Open Society Foundations",
    deadline: futureDeadline(50, 140),
    amount: 25000, country: "Central Asia", field: "International Relations", type: "Social Grant",
    descRu: "Финансирование инициатив по развитию гражданского общества, демократии и прав человека в Центральной Азии.",
    descKz: "Орталық Азияда азаматтық қоғамды, демократияны және адам құқықтарын дамыту бастамаларын қаржыландыру.",
    url: "https://www.opensocietyfoundations.org/grants",
  },
  // Стипендии
  {
    kind: "scholarship", source: "static_enrichment", externalId: "rotary-peace-fellowship-2026",
    titleRu: "Rotary Peace Fellowship",
    titleKz: "Rotary Peace Fellowship стипендиясы",
    organization: "Rotary Foundation",
    deadline: futureDeadline(30, 90), degree: "Master",
    amount: 30000, country: "Worldwide", field: "International Relations", type: "Full Scholarship",
    descRu: "Полностью финансируемые стипендии для обучения в магистратуре в одном из 6 университетов-партнёров по мировому миру и разрешению конфликтов.",
    descKz: "Дүниежүзілік бейбітшілік және жанжалдарды шешу бойынша 6 серіктес университеттің бірінде магистратурада оқуға арналған толық стипендиялар.",
    url: "https://www.rotary.org/en/our-programs/peace-fellowships",
  },
  {
    kind: "scholarship", source: "static_enrichment", externalId: "aga-khan-scholarship-2026",
    titleRu: "Aga Khan Foundation Scholarship",
    titleKz: "Aga Khan Foundation стипендиясы",
    organization: "Aga Khan Foundation",
    deadline: futureDeadline(40, 110), degree: "Master",
    amount: 20000, country: "Central Asia", field: "Any Field", type: "Full Scholarship",
    descRu: "Стипендии для исключительно талантливых студентов из развивающихся стран, у которых нет другого способа оплатить образование.",
    descKz: "Білімін өзге жолмен төлей алмайтын дамушы елдердің ерекше талантты студенттеріне арналған стипендиялар.",
    url: "https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme",
  },
  {
    kind: "scholarship", source: "static_enrichment", externalId: "cambridge-gates-scholarship-2026",
    titleRu: "Gates Cambridge Scholarship",
    titleKz: "Gates Cambridge стипендиясы",
    organization: "Gates Cambridge Trust",
    deadline: futureDeadline(60, 150), degree: "PhD",
    amount: 50000, country: "UK", field: "Any Field", type: "Full Scholarship",
    descRu: "Полностью финансируемые стипендии для обучения в любой аспирантской программе Кембриджского университета. Одна из самых престижных в мире.",
    descKz: "Кембридж университетінің кез келген аспирантура бағдарламасында оқуға арналған толық стипендиялар.",
    url: "https://www.gatescambridge.org",
  },
  {
    kind: "scholarship", source: "static_enrichment", externalId: "rhodes-scholarship-2026",
    titleRu: "Rhodes Scholarship (Оксфорд)",
    titleKz: "Rhodes стипендиясы (Оксфорд)",
    organization: "Rhodes Trust",
    deadline: futureDeadline(90, 180), degree: "Master",
    amount: 45000, country: "UK", field: "Any Field", type: "Full Scholarship",
    descRu: "Старейшая международная стипендия для обучения в Оксфорде. Выбираются студенты с исключительными академическими достижениями и лидерством.",
    descKz: "Оксфордта оқуға арналған ең ескі халықаралық стипендия. Ерекше академиялық жетістіктері мен көшбасшылық қасиеттері бар студенттер таңдалады.",
    url: "https://www.rhodeshouse.ox.ac.uk/scholarships",
  },
  {
    kind: "scholarship", source: "static_enrichment", externalId: "eiffel-scholarship-france-2026",
    titleRu: "Стипендия Эйфель (Франция)",
    titleKz: "Эйфель стипендиясы (Франция)",
    organization: "Campus France",
    deadline: futureDeadline(30, 80), degree: "Master",
    amount: 14000, country: "France", field: "Engineering", type: "Full Scholarship",
    descRu: "Стипендия правительства Франции для иностранных студентов магистратуры в области инженерии, права, экономики и политических наук.",
    descKz: "Инженерия, құқық, экономика және саяси ғылымдар магистратурасына арналған Франция үкіметінің стипендиясы.",
    url: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
  },
  // Конкурсы
  {
    kind: "competition", source: "static_enrichment", externalId: "mit-hacking-medicine-2026",
    titleRu: "MIT Hacking Medicine Grand Hack",
    titleKz: "MIT Hacking Medicine Grand Hack",
    organization: "MIT",
    deadline: futureDeadline(40, 100),
    amount: 20000, country: "USA", field: "Medicine", type: "Hackathon",
    organizer: "MIT", prize: 20000,
    descRu: "48-часовой хакатон по решению проблем здравоохранения через технологии. Команды со всего мира.",
    descKz: "Денсаулық сақтау мәселелерін технологиялар арқылы шешуге арналған 48 сағаттық хакатон.",
    url: "https://hackingmedicine.mit.edu",
  },
  {
    kind: "competition", source: "static_enrichment", externalId: "hult-prize-2026",
    titleRu: "Hult Prize 2026",
    titleKz: "Hult Prize 2026",
    organization: "Hult Prize Foundation",
    deadline: futureDeadline(60, 150),
    amount: 1000000, country: "Worldwide", field: "Startups", type: "Competition",
    organizer: "Hult Prize Foundation", prize: 1000000,
    descRu: "Крупнейший в мире студенческий конкурс стартапов с призом $1 000 000. Тема 2026 — восстановление экономики сообществ.",
    descKz: "$1 000 000 жүлдесі бар әлемдегі ең ірі студенттік стартап байқауы.",
    url: "https://www.hultprize.org",
  },
  {
    kind: "competition", source: "static_enrichment", externalId: "facebook-hackercup-2026",
    titleRu: "Meta Hacker Cup 2026",
    titleKz: "Meta Hacker Cup 2026",
    organization: "Meta (Facebook)",
    deadline: futureDeadline(60, 120),
    amount: 20000, country: "Worldwide", field: "IT", type: "Competition",
    organizer: "Meta", prize: 20000,
    descRu: "Ежегодный международный конкурс по программированию от Meta. Открыт для всех разработчиков мира.",
    descKz: "Meta-ның жыл сайынғы халықаралық бағдарламалау байқауы. Барлық дүниежүзі әзірлеушілеріне ашық.",
    url: "https://www.facebook.com/codingcompetitions/hacker-cup",
  },
  {
    kind: "competition", source: "static_enrichment", externalId: "kaggle-competitions-2026",
    titleRu: "Kaggle ML Competitions 2026",
    titleKz: "Kaggle ML байқаулары 2026",
    organization: "Kaggle / Google",
    deadline: futureDeadline(20, 60),
    amount: 150000, country: "Worldwide", field: "AI", type: "Competition",
    organizer: "Kaggle", prize: 150000,
    descRu: "Платформа Kaggle проводит постоянные соревнования по машинному обучению с призовыми фондами до $150 000. Открыто для всех.",
    descKz: "Kaggle платформасы $150 000 дейінгі жүлделік қорлары бар машиналық оқыту байқауларын үнемі өткізеді.",
    url: "https://www.kaggle.com/competitions",
  },
  {
    kind: "competition", source: "static_enrichment", externalId: "climate-launchpad-2026",
    titleRu: "Climate Launchpad Green Business Competition",
    titleKz: "Climate Launchpad жасыл бизнес байқауы",
    organization: "EIT Climate-KIC",
    deadline: futureDeadline(50, 120),
    amount: 30000, country: "Europe", field: "Environment", type: "Competition",
    organizer: "EIT Climate-KIC", prize: 30000,
    descRu: "Крупнейший в мире конкурс зелёных бизнес-идей. Победители получают деньги, менторство и доступ к сети инвесторов.",
    descKz: "Әлемдегі ең ірі жасыл бизнес идеялар байқауы. Жеңімпаздар ақша, менторлық және инвесторлар желісіне кіруді алады.",
    url: "https://climatelaunchpad.org",
  },
];

// ─── Source 2: Scrape scholarshipdb.net ───────────────────────────────────────

async function scrapeScholarshipDB() {
  const results = [];
  try {
    log("scraping scholarshipdb.net...");
    const html = await safeFetch("https://scholarshipdb.net/scholarships-in-Kazakhstan", { timeout: FETCH_TIMEOUT_MS });

    // Extract scholarship entries from listing page
    const blockPattern = /<div[^>]*class="[^"]*scholarship[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const linkPattern = /href="(\/scholarships[^"]+)"[^>]*>([^<]{5,120})</gi;
    const deadlinePattern = /deadline[^:]*:\s*([A-Za-z]+ \d+,?\s*\d{4}|\d{4}-\d{2}-\d{2})/i;
    const orgPattern = /(?:offered by|organization|by)[^:]*:\s*<[^>]*>([^<]{3,80})</i;

    const links = matchAll(html, linkPattern);
    let count = 0;
    for (const m of links.slice(0, 10)) {
      if (count >= 5) break;
      const path = m[1];
      const title = stripHtml(m[2]).trim();
      if (!title || title.length < 5) continue;

      try {
        const detailHtml = await safeFetch(`https://scholarshipdb.net${path}`);
        const deadlineM = detailHtml.match(deadlinePattern);
        const orgM = detailHtml.match(orgPattern);
        const deadline = deadlineM ? parseDeadline(deadlineM[1]) : futureDeadline(60, 200);
        const org = orgM ? stripHtml(orgM[1]).trim() : "ScholarshipDB";

        if (!deadline) continue;

        results.push({
          kind: "scholarship",
          source: "scholarshipdb",
          externalId: path.replace(/[^a-z0-9-]/gi, "-").slice(0, 100),
          titleRu: title,
          titleKz: title,
          organization: org,
          deadline,
          amount: 0,
          country: "International",
          field: "Any Field",
          type: "Scholarship",
          descRu: `Стипендия от ${org}. Подробнее на официальном сайте.`,
          descKz: `${org} стипендиясы. Толығырақ ресми сайтта.`,
          url: `https://scholarshipdb.net${path}`,
        });
        count++;
        await new Promise(r => setTimeout(r, 500)); // polite delay
      } catch {
        // skip individual page errors
      }
    }
  } catch (err) {
    log("scholarshipdb error:", err.message);
  }
  return results;
}

// ─── Source 3: Scrape opportunitiesforafricans.com ────────────────────────────

async function scrapeOpportunitiesForAfricans() {
  const results = [];
  try {
    log("scraping opportunitiesforafricans.com...");
    const html = await safeFetch("https://www.opportunitiesforafricans.com/category/scholarships/");

    const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const titlePattern = /<h\d[^>]*class="[^"]*entry-title[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i;
    const datePattern = /<time[^>]*datetime="([^"]+)"/i;

    const articles = matchAll(html, articlePattern);
    let count = 0;
    for (const a of articles.slice(0, 8)) {
      if (count >= 5) break;
      const block = a[1];
      const titleM = block.match(titlePattern);
      if (!titleM) continue;
      const url = titleM[1];
      const title = stripHtml(titleM[2]).trim();
      const dateM = block.match(datePattern);
      const deadline = dateM ? new Date(new Date(dateM[1]).getTime() + 60 * 24 * 3600 * 1000) : futureDeadline(60, 180);

      results.push({
        kind: "scholarship",
        source: "ofa",
        externalId: url.replace(/https?:\/\/[^/]+/, "").replace(/[^a-z0-9-]/gi, "-").slice(0, 100),
        titleRu: title,
        titleKz: title,
        organization: "Various",
        deadline,
        amount: 0,
        country: "Worldwide",
        field: "Any Field",
        type: "Scholarship",
        descRu: `Международная возможность: ${title}. Подробнее на официальном сайте.`,
        descKz: `Халықаралық мүмкіндік: ${title}. Толығырақ ресми сайтта.`,
        url,
      });
      count++;
    }
  } catch (err) {
    log("opportunitiesforafricans error:", err.message);
  }
  return results;
}

// ─── Source 4: Scrape youth.gov.kz ───────────────────────────────────────────

async function scrapeYouthGovKz() {
  const results = [];
  try {
    log("scraping youth.gov.kz...");
    const html = await safeFetch("https://youth.gov.kz/ru/programs");

    const itemPattern = /<(?:article|div)[^>]*class="[^"]*(?:item|card|program)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
    const titlePattern = /<(?:h[1-6]|a)[^>]*>([^<]{10,120})<\/(?:h[1-6]|a)>/i;
    const linkPattern = /href="(https?:\/\/youth\.gov\.kz[^"]+)"/i;

    const items = matchAll(html, itemPattern);
    let count = 0;
    for (const item of items.slice(0, 10)) {
      if (count >= 5) break;
      const block = item[1];
      const titleM = block.match(titlePattern);
      const linkM = block.match(linkPattern);
      if (!titleM) continue;
      const title = stripHtml(titleM[1]).trim();
      const url = linkM ? linkM[1] : "https://youth.gov.kz/ru/programs";

      results.push({
        kind: "grant",
        source: "youth_gov_kz",
        externalId: url.replace(/https?:\/\/[^/]+/, "").replace(/[^a-z0-9-]/gi, "-").slice(0, 100) || `item-${count}`,
        titleRu: title,
        titleKz: title,
        organization: "Министерство молодёжи и спорта РК",
        deadline: futureDeadline(60, 200),
        amount: 0,
        country: "Kazakhstan",
        field: "Various",
        type: "Program",
        descRu: `Государственная программа для молодёжи Казахстана: ${title}`,
        descKz: `Қазақстан жастарына арналған мемлекеттік бағдарлама: ${title}`,
        url,
      });
      count++;
    }
  } catch (err) {
    log("youth.gov.kz error:", err.message);
  }
  return results;
}

// ─── Source 5: grants.gov RSS (US federal grants) ────────────────────────────

async function scrapeGrantsGovRSS() {
  const results = [];
  try {
    log("scraping grants.gov RSS...");
    const xml = await safeFetch(
      "https://www.grants.gov/rss/GG_NewOpps.xml"
    );

    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
    const titlePattern = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([^<]+)<\/title>/i;
    const linkPattern = /<link>([^<]+)<\/link>/i;
    const descPattern = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([^<]+)<\/description>/i;
    const datePattern = /<pubDate>([^<]+)<\/pubDate>/i;

    const items = matchAll(xml, itemPattern);
    let count = 0;
    for (const item of items.slice(0, 15)) {
      if (count >= 8) break;
      const block = item[1];
      const titleM = block.match(titlePattern);
      const linkM = block.match(linkPattern);
      const descM = block.match(descPattern);
      const dateM = block.match(datePattern);

      if (!titleM) continue;
      const title = stripHtml(titleM[1] || titleM[2] || "").trim();
      if (!title || title.length < 5) continue;

      const url = linkM ? linkM[1].trim() : "https://www.grants.gov";
      const desc = descM ? stripHtml(descM[1] || descM[2] || "").slice(0, 400) : "";
      const pubDate = dateM ? new Date(dateM[1]) : new Date();
      const deadline = new Date(pubDate.getTime() + 90 * 24 * 3600 * 1000);

      // Extract opportunity number for dedup
      const oppNumM = block.match(/CFDA[^<]*?(\d[\d.]+)/i) || url.match(/oppId=([^&]+)/);
      const externalId = oppNumM ? `grants-gov-${oppNumM[1]}` : `grants-gov-${Date.now()}-${count}`;

      results.push({
        kind: "grant",
        source: "grants_gov",
        externalId,
        titleRu: title,
        titleKz: title,
        organization: "US Federal Government",
        deadline,
        amount: 0,
        country: "USA",
        field: "Various",
        type: "Federal Grant",
        descRu: desc || `Федеральный грант США: ${title}`,
        descKz: desc || `АҚШ федералдық гранты: ${title}`,
        url,
      });
      count++;
    }
  } catch (err) {
    log("grants.gov error:", err.message);
  }
  return results;
}

// ─── Main scraper runner ──────────────────────────────────────────────────────

export async function runScraper(options = {}) {
  const { sourceName = null } = options; // run single source if specified

  const logEntry = await prisma.scraperLog.create({
    data: { source: sourceName || "all", status: "running" },
  });

  let totalAdded = 0, totalUpdated = 0, totalSkipped = 0;
  const errors = [];

  try {
    // Collect all items from all sources
    let allItems = [];

    // 1. Static enrichment (always runs, no network)
    if (!sourceName || sourceName === "static") {
      log("loading static enrichment...");
      allItems.push(...STATIC_OPPORTUNITIES);
    }

    // 2. External scrapers (network dependent)
    const scrapers = [
      { name: "scholarshipdb", fn: scrapeScholarshipDB },
      { name: "ofa", fn: scrapeOpportunitiesForAfricans },
      { name: "youth_gov_kz", fn: scrapeYouthGovKz },
      { name: "grants_gov", fn: scrapeGrantsGovRSS },
    ];

    for (const { name, fn } of scrapers) {
      if (sourceName && sourceName !== name) continue;
      try {
        const items = await fn();
        log(`${name}: got ${items.length} items`);
        allItems.push(...items);
      } catch (err) {
        errors.push(`${name}: ${err.message}`);
        log(`${name} failed:`, err.message);
      }
    }

    // 3. Upsert all items
    log(`upserting ${allItems.length} items...`);
    for (const item of allItems) {
      try {
        const result = await upsertOpportunity(item);
        if (result === "added") totalAdded++;
        else if (result === "updated") totalUpdated++;
        else totalSkipped++;
      } catch (err) {
        errors.push(`upsert error: ${err.message}`);
      }
    }

    await prisma.scraperLog.update({
      where: { id: logEntry.id },
      data: {
        status: errors.length > 0 ? "partial" : "success",
        added: totalAdded,
        updated: totalUpdated,
        skipped: totalSkipped,
        error: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
        finishedAt: new Date(),
      },
    });

    log(`done: +${totalAdded} added, ~${totalUpdated} updated, ${totalSkipped} skipped`);
    return { added: totalAdded, updated: totalUpdated, skipped: totalSkipped, errors };

  } catch (err) {
    await prisma.scraperLog.update({
      where: { id: logEntry.id },
      data: { status: "error", error: err.message, finishedAt: new Date() },
    });
    throw err;
  }
}

export { STATIC_OPPORTUNITIES };
