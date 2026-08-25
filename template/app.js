/* ---------- shared copy helper ---------- */
function copyText(text, btn, label) {
  const done = () => {
    btn.textContent = "הועתק ✓";
    btn.classList.add("done");
    setTimeout(() => { btn.textContent = label; btn.classList.remove("done"); }, 1600);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done);
  } else {
    /* file:// pages have no clipboard API - fall back to a hidden textarea */
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); }
    catch (err) { alert("ההעתקה נכשלה. סמנו את הטקסט והעתיקו ידנית."); }
    document.body.removeChild(ta);
  }
}

/* ---------- tabs ---------- */
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("view-" + t.dataset.view).classList.add("active");
    window.scrollTo(0, 0);
  };
});

/* ---------- prompts ---------- */
const CATS = [...new Set(PROMPTS.map(p => p.cat))];
let activeCat = "הכול";
let query = "";

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const filtersEl = document.getElementById("filters");
const searchEl = document.getElementById("search");

["הכול", ...CATS].forEach(c => {
  const b = document.createElement("button");
  b.className = "chip" + (c === "הכול" ? " active" : "");
  b.textContent = c === "הכול" ? `הכול (${PROMPTS.length})` : `${c} (${PROMPTS.filter(p => p.cat === c).length})`;
  b.dataset.cat = c;
  b.onclick = () => {
    activeCat = c;
    [...filtersEl.children].forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    renderPrompts();
  };
  filtersEl.appendChild(b);
});

function renderPrompts() {
  const q = query.trim().toLowerCase();
  const items = PROMPTS.filter(p => {
    if (!(activeCat === "הכול" || p.cat === activeCat)) return false;
    if (!q) return true;
    return (p.name + " " + p.purpose + " " + p.text).toLowerCase().includes(q);
  });

  listEl.innerHTML = "";
  emptyEl.style.display = items.length ? "none" : "block";

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML =
      '<div class="card-head-text"><div class="card-title"></div><div class="card-purpose"></div></div>' +
      '<span class="card-cat"></span><span class="toggle">▼</span>';
    head.querySelector(".card-title").textContent = p.name;
    head.querySelector(".card-purpose").textContent = p.purpose;
    head.querySelector(".card-cat").textContent = p.cat;
    head.onclick = () => card.classList.toggle("open");

    const body = document.createElement("div");
    body.className = "card-body";
    const pre = document.createElement("pre");
    pre.className = "prompt";
    pre.textContent = p.text;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "העתקה";
    btn.onclick = e => { e.stopPropagation(); copyText(p.text, btn, "העתקה"); };
    body.appendChild(pre);
    body.appendChild(btn);

    card.appendChild(head);
    card.appendChild(body);
    listEl.appendChild(card);
  });
}

searchEl.addEventListener("input", e => { query = e.target.value; renderPrompts(); });
renderPrompts();

/* ---------- guides ---------- */
const gIndexEl = document.getElementById("g-index");
const gArticleEl = document.getElementById("g-article");
/* the 53-rules block lives in a text/plain island so its backticks and fences survive verbatim */
const STARTER_RULES = (document.getElementById("starter-rules-src") || {}).textContent || "";

function renderGuideIndex() {
  gArticleEl.style.display = "none";
  gIndexEl.style.display = "block";
  gIndexEl.innerHTML = '<div class="g-grid"></div>';
  const grid = gIndexEl.querySelector(".g-grid");
  GUIDES.forEach(g => {
    const c = document.createElement("div");
    c.className = "g-card";
    c.innerHTML = '<div class="g-num"></div><div class="g-title"></div><div class="g-ex"></div><div class="g-go">קריאה ←</div>';
    c.querySelector(".g-num").textContent = "מדריך " + g.n;
    c.querySelector(".g-title").textContent = g.title;
    c.querySelector(".g-ex").textContent = g.excerpt;
    c.onclick = () => openGuide(g.n);
    grid.appendChild(c);
  });
}

function openGuide(n) {
  const g = GUIDES.find(x => x.n === n);
  if (!g) return;
  gIndexEl.style.display = "none";
  gArticleEl.style.display = "block";
  gArticleEl.innerHTML =
    '<button class="g-back">← חזרה לרשימת המדריכים</button>' +
    '<article class="guide"><h1></h1><div class="g-rule"></div><div class="g-body"></div></article>';
  gArticleEl.querySelector("h1").textContent = g.title;
  gArticleEl.querySelector(".g-body").innerHTML = g.html;
  gArticleEl.querySelector(".g-back").onclick = () => { renderGuideIndex(); window.scrollTo(0, 0); };

  const rulesPre = gArticleEl.querySelector("#g8-code");
  if (rulesPre) rulesPre.textContent = STARTER_RULES;

  gArticleEl.querySelectorAll(".g-copy").forEach(btn => {
    btn.onclick = () => {
      const src = gArticleEl.querySelector("#" + btn.dataset.copy);
      if (src) copyText(src.textContent, btn, "העתקה");
    };
  });

  gArticleEl.querySelectorAll("[data-goto]").forEach(a => {
    a.onclick = e => { e.preventDefault(); openGuide(parseInt(a.dataset.goto, 10)); window.scrollTo(0, 0); };
  });

  window.scrollTo(0, 0);
}

renderGuideIndex();