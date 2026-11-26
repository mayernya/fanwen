/* 全站公共部分：顶栏、页脚、插画、工具函数 */
(function () {
  const T = window.TANK;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = document.body.dataset.page;

  const PAGES = [
    ["index.html", "首页", "home"],
    ["diary.html", "日记", "diary"],
    ["game.html", "小游戏", "game"],
    ["zone.html", "聊天区", "zone"],
    ["stats.html", "统计", "stats"],
    ["manual.html", "说明书", "manual"]
  ];

  const LOGO = `<img src="img/logo.webp" alt="">`;
  if (!document.querySelector('link[rel="icon"]')) {
    const ic = document.createElement("link");
    ic.rel = "icon"; ic.type = "image/webp"; ic.href = "img/logo.webp";
    document.head.append(ic);
  }

  const POLAROID = `<svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="pWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3d86"/><stop offset="1" stop-color="#1a2862"/></linearGradient>
    <linearGradient id="pWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d78e0"/><stop offset="1" stop-color="#1f4196"/></linearGradient></defs>
    <rect width="300" height="190" fill="url(#pWall)"/>
    <rect x="22" y="16" width="62" height="50" rx="4" fill="#0e1a4a" stroke="#f8f1e0" stroke-width="2" opacity=".85"/>
    <path d="M53 16v50M22 41h62" stroke="#f8f1e0" stroke-width="1.5" opacity=".6"/>
    <circle cx="70" cy="29" r="7" fill="#f6d57a"/><circle cx="73" cy="27" r="6" fill="#0e1a4a"/>
    <rect x="0" y="152" width="300" height="38" fill="#121d50"/><rect x="0" y="150" width="300" height="5" fill="#f8f1e0" opacity=".25"/>
    <rect x="150" y="48" width="132" height="104" rx="8" fill="url(#pWater)" stroke="#f8f1e0" stroke-width="3"/>
    <path d="M153 140 Q190 130 220 138 T279 136 V149 H153Z" fill="#f6d57a" opacity=".55"/>
    <path d="M170 140 C163 125 177 115 170 100" stroke="#9fd9c5" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M265 140 C272 122 258 112 266 96" stroke="#9fd9c5" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="155" y="52" width="10" height="94" rx="4" fill="#fff" opacity=".18"/>
    <g class="fishA"><ellipse cx="222" cy="98" rx="24" ry="16" fill="#a9bdf6"/><path d="M244 98l18-13v26z" fill="#93abf2"/><circle cx="211" cy="94" r="5" fill="#fff"/><circle cx="209.5" cy="94" r="2.8" fill="#0b1846"/><ellipse cx="206" cy="104" rx="4" ry="2" fill="#f4a9bb" opacity=".8"/></g>
    <g fill="none" stroke="#f8f1e0" stroke-width="1.5" opacity=".75"><circle cx="200" cy="80" r="3.5"/><circle cx="195" cy="66" r="2.5"/><circle cx="240" cy="70" r="3"/></g>
    <path d="M40 150 C20 140 18 110 30 104" stroke="#f0a050" stroke-width="9" fill="none" stroke-linecap="round"/>
    <ellipse cx="82" cy="128" rx="44" ry="30" fill="#f0a050"/>
    <path d="M60 112 q6 10 0 22 M76 104 q6 12 0 26" stroke="#c8742c" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="118" cy="148" rx="13" ry="7" fill="#f8d0a0"/>
    <path d="M100 74 L102 44 L122 62 Z M138 62 L152 44 L152 76 Z" fill="#f0a050"/>
    <path d="M104 66 L105 52 L114 62 Z M143 64 L149 54 L149 70 Z" fill="#f4a9bb"/>
    <ellipse cx="126" cy="86" rx="30" ry="26" fill="#f0a050"/>
    <path d="M120 62 l2 8 M128 61 v8 M136 63 l-2 8" stroke="#c8742c" stroke-width="3" stroke-linecap="round"/>
    <g class="eyes"><ellipse cx="119" cy="86" rx="4.2" ry="5.5" fill="#4a2e12"/><ellipse cx="139" cy="86" rx="4.2" ry="5.5" fill="#4a2e12"/><circle cx="120.5" cy="84" r="1.4" fill="#fff"/><circle cx="140.5" cy="84" r="1.4" fill="#fff"/></g>
    <path d="M128 94h5l-2.5 3z" fill="#f4a9bb"/>
    <path d="M130 97 q-3 4 -6 2 M131 97 q3 4 6 2" stroke="#4a2e12" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M98 92 l-14 -3 M98 97 l-14 1" stroke="#f8f1e0" stroke-width="1" opacity=".8"/>
    <path d="M108 128 Q128 124 147 117" stroke="#f0a050" stroke-width="12" fill="none" stroke-linecap="round"/>
    <ellipse class="paw" cx="152" cy="116" rx="9" ry="11" fill="#f8d0a0" stroke="#f0a050" stroke-width="3"/>
  </svg>`;

  const PEEK = `<img class="peek" src="img/peek-cat.png" alt="" aria-hidden="true">`;

  /* ---------- 顶栏 ---------- */
  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `<div class="bar">
    <a class="logo" href="index.html"><span class="logo-av">${LOGO}</span><span>${esc(T.site.title)}</span></a>
    <nav>${PAGES.map(([h, l, k]) => `<a href="${h}"${k === page ? ' class="on" aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
  </div>`;
  document.body.prepend(header);

  /* ---------- 页脚 ---------- */
  const lastMsg = T.messages[T.messages.length - 1];
  const footer = document.createElement("footer");
  footer.innerHTML = `<div class="floor" aria-hidden="true">
      <svg class="dunes" viewBox="0 0 1200 76" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#c8a6ff" stop-opacity="0"/>
            <stop offset="35%" stop-color="#c8a6ff" stop-opacity=".42"/>
            <stop offset="65%" stop-color="#89c2ff" stop-opacity=".42"/>
            <stop offset="100%" stop-color="#89c2ff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0 44 Q240 16 520 38 T1200 28 V76 H0Z" fill="rgba(13, 21, 56, .68)"/>
        <path d="M0 44 Q240 16 520 38 T1200 28" fill="none" stroke="url(#waveLine)" stroke-width="1.5"/>
        <path d="M0 58 Q300 38 660 54 T1200 48 V76 H0Z" fill="#050918"/>
      </svg>
    </div>
    <div class="foot">
      <div class="foot-star" aria-hidden="true">· ✦ ·</div>
      <div class="foot-title">${esc(T.site.title)}</div>
      <p>${esc(T.site.footer)}</p>
      ${lastMsg ? `<p class="updated">更新于 ${esc(lastMsg.date)} ${esc(lastMsg.time)}</p>` : ""}
    </div>`;
  document.body.append(footer);

  /* ---------- 插画插槽 ---------- */
  document.querySelectorAll("[data-polaroid]").forEach((el) => {
    el.classList.add("polaroid");
    el.innerHTML = `<div class="photo">${T.site.banner ? `<img src="${esc(T.site.banner)}" alt="">` : POLAROID}</div><figcaption>${esc(T.site.polaroidCaption)}</figcaption>`;
  });
  document.querySelectorAll("[data-peek]").forEach((el) => (el.outerHTML = PEEK));
  document.querySelectorAll("[data-demo-note]").forEach((el) => {
    const text = el.dataset.demoNote || T.site.demoNotice;
    if (!text) return el.remove();
    el.classList.add("demo-note");
    el.textContent = `📝 ${text}`;
  });
  const demoBadge = () => (T.site.demoBadge ? `<span class="demo-badge">📝 ${esc(T.site.demoBadge)}</span>` : "");

  /* ---------- 工具函数 ---------- */
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  const parseDate = (d) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); };
  const dayLabel = (d) => { const dt = parseDate(d); return `${dt.getMonth() + 1}月${dt.getDate()}日 · 星期${week[dt.getDay()]}`; };
  const shortDate = (d) => { const dt = parseDate(d); return `${dt.getMonth() + 1}月${dt.getDate()}日`; };

  const avatar = (c, cls = "av") =>
    c.avatar
      ? `<img class="${cls}" src="${esc(c.avatar)}" alt="${esc(c.name)}">`
      : `<span class="${cls}" style="--bc:${c.bubble};--tc:${c.text}">${esc(c.letter)}</span>`;

  const bubbles = (n) => {
    let h = "";
    for (let i = 0; i < n; i++) {
      const s = 8 + Math.random() * 18;
      h += `<i class="bub" style="left:${5 + Math.random() * 90}%;width:${s}px;height:${s}px;animation-duration:${18 + Math.random() * 14}s;animation-delay:${-Math.random() * 25}s"></i>`;
    }
    return h;
  };

  const renderChat = (msgs, { days = true } = {}) => {
    let h = "", lastDate = null, prevFrom = null;
    msgs.forEach((m) => {
      const c = T.characters[m.from];
      if (!c) return;
      const newDay = m.date !== lastDate;
      if (days && newDay) { h += `<div class="day"><span>${dayLabel(m.date)}</span></div>`; }
      const isCont = !newDay && prevFrom === m.from;
      lastDate = m.date;
      prevFrom = m.from;
      const imgHtml = m.img ? `<img class="msg-img${m.sticker ? " sticker" : ""}" src="${esc(m.img)}" alt="${esc(m.alt || "")}" loading="lazy">` : "";
      const txtHtml = m.text ? `<div class="msg-txt">${esc(m.text)}</div>` : "";
      const cls = m.img && !m.text ? "b img-only" : "b";
      const whoHtml = isCont ? "" : `<div class="who"><b>${esc(c.name)}</b> · ${esc(m.time)}</div>`;
      h += `<div class="msg${c.side === "right" ? " right" : ""}${isCont ? " cont" : ""}" style="--bc:${c.bubble};--tc:${c.text}">
        ${avatar(c)}
        <div class="col">${whoHtml}<div class="${cls}">${imgHtml}${txtHtml}</div></div>
      </div>`;
    });
    return h;
  };

  const castCards = () => {
    const counts = {};
    T.messages.forEach((m) => (counts[m.from] = (counts[m.from] || 0) + 1));
    return Object.entries(T.characters).map(([k, c]) => `
      <article class="card rv" style="--bc:${c.bubble}">
        ${avatar(c, "av big")}
        <div>
          <h3>${esc(c.name)} <small>${esc(c.handle)}</small></h3>
          <p>${esc(c.bio)}</p>
          <span class="count">一共说了 ${counts[k] || 0} 句话</span>
        </div>
      </article>`).join("");
  };

  let revealBound = false;
  const sweepReveal = () => {
    const vh = window.innerHeight || 900;
    document.querySelectorAll(".rv:not(.in), .msg:not(.in), .day:not(.in)").forEach((el) => {
      if (el.getBoundingClientRect().top <= vh + 180) el.classList.add("in");
    });
  };

  const reveal = () => {
    const els = document.querySelectorAll(".rv:not(.in), .msg:not(.in), .day:not(.in)");
    const vh = window.innerHeight || 900;
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
          { threshold: 0, rootMargin: "120px 0px 140px 0px" }
        )
      : null;
    els.forEach((el) => {
      if (!io || el.getBoundingClientRect().top <= vh + 180) el.classList.add("in");
      else io.observe(el);
    });
    if (!revealBound) {
      revealBound = true;
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; sweepReveal(); });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("hashchange", () => setTimeout(sweepReveal, 80));
    }
  };

  window.UI = { esc, avatar, bubbles, renderChat, castCards, reveal, dayLabel, shortDate, parseDate, demoBadge };
})();
