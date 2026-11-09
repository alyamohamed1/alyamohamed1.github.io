/* Projects: cartridge rack + insert-into-reader animation. Content comes from Alya's project decks. */
(() => {
  const PROJECTS = [
    {
      id: "gatekeep", code: "CRT-01", title: "GATEKEEP", accent: "#3da9ff",
      img: "assets/img/carts/gatekeep.jpg", course: "COSC 415 · Cloud Computing",
      sub: "cloud vehicle access control", cap: "AZURE",
      tagline: "Cloud-based vehicle access control system",
      team: "Alya Mohamed, Hana Wahban, Hamza Alkhaldi",
      problem: "Gates that rely on manual vehicle checks cause delays, congestion and mistakes, and that approach does not scale to a large campus.",
      solution: "Automated licence plate verification on Microsoft Azure. A photo of the car is uploaded, a serverless function reads the plate with OCR, checks it against the database and returns allow or deny. A web dashboard shows the results.",
      pipeline: ["Image captured", "Upload to Blob", "Function triggered", "OCR reads plate", "SQL check", "Allow / Deny"],
      stack: ["Azure Functions", "Azure Blob Storage", "Azure AI Vision (OCR)", "Azure SQL Database", "Azure App Service", "Microsoft Entra ID", "Network security groups", "Database encryption"],
      stats: [["10", "test uploads"], ["0", "failed executions"], ["67.5 ms", "avg response"], ["~$25.50", "est. per month"]],
      extra: { img: "assets/img/carts/gatekeep-gate.png", caption: "the access-gate scenario GateKeep automates" },
      challenges: ["Cold starts of about 30 seconds on the first request", "Tested with a limited set of images", "No real camera hardware connected yet", "No load testing for peak traffic"],
      next: ["Premium plan to cut cold-start latency", "Load testing with simulated real traffic", "Real camera integration", "Custom OCR models for better accuracy", "Real-time analytics on the dashboard"],
    },
    {
      id: "unipool", code: "CRT-02", title: "UNIPOOL", accent: "#7f9cff",
      img: "assets/img/carts/unipool.jpg", course: "SWEN 360 · Software Design & Engineering",
      sub: "campus carpooling app", cap: "MOBILE",
      tagline: "University-based carpooling application",
      team: "Alya Altawash, Hana Wahban, Hussain Humood, Ali Adel Mohamed",
      role: ["Frontend Lead: Figma designs, the UI system, React Native / Next.js screens", "Scrum Master for Sprint 3", "Testing and documentation"],
      problem: "Students need a cheaper, safer and more sustainable way to get to campus, and a simple way to offer or find a ride.",
      solution: "A campus ride-sharing app where drivers post rides and riders search and book seats. Riders can chat with drivers, see driver details, rate or report them and view their ride history. Drivers accept or decline requests, get notifications and see seat counts update in real time.",
      pipeline: ["Presentation", "Service", "Domain", "Data", "Firebase"],
      pipeLabel: "layered architecture + client–Firebase server",
      stack: ["React Native", "Expo", "Next.js", "TypeScript", "Firebase Auth", "Cloud Firestore", "Cloud Functions", "Figma"],
      stats: [["4", "person team"], ["3", "sprints"], ["2", "design patterns"], ["live", "seat sync"]],
      notes: ["Repository pattern (RideRepository, BookingRepository) keeps Firestore calls out of the UI", "Observer pattern via Firestore live listeners for real-time seat availability", "Firestore security rules enforce privacy and workflow restrictions", "Agile: standups every Sunday and Thursday, Kanban board, rotating Scrum Master"],
      challenges: ["Keeping the UI consistent across every screen", "Accurate real-time seat availability", "Managing complex rider and driver flows", "Integrating a fully custom map component"],
      next: ["Integrate frontend and backend earlier", "More accurate task estimation", "Clearer acceptance criteria"],
      link: { href: "https://github.com/alyamohamed1/UniPoolMobile", label: "source on GitHub" },
    },
    {
      id: "heston", code: "CRT-03", title: "HESTON", accent: "#9b6bff",
      img: "assets/img/carts/heston.jpg", course: "COSC 312 · Design and Usage of Databases",
      sub: "garage management database", cap: "MYSQL",
      tagline: "Heston Auto-Services garage management database",
      team: "Alya Mohamed, Wajd Alballal, Shadow Alghamdi",
      problem: "The garage ran on manual records and spreadsheets, which led to lost data, duplicate records and slow tracking of jobs.",
      solution: "A centralised MySQL database for customers, vehicles, repair jobs, mechanics, parts, appointments and payments, with the JOB table at the centre connecting everything.",
      stack: ["MySQL", "ER modelling", "3NF normalisation", "Views", "Triggers", "Constraints (PK, FK, NOT NULL, UNIQUE, CHECK)"],
      stats: [["11 + 3", "tables"], ["3NF", "normalised"], ["20", "test cases"], ["3", "triggers"]],
      notes: ["Trigger: job status updates to Completed automatically", "Trigger: blocks using a part when stock is too low", "Trigger: inventory updates automatically", "Views for mechanic assignments, payments and vehicle history"],
      query: "SELECT c.Customer_ID, c.First_Name,\n       v.Vehicle_ID, v.Model,\n       j.Job_ID, j.Status, j.Job_Cost\nFROM CUSTOMER c\nJOIN VEHICLE v ON c.Customer_ID = v.Customer_ID\nJOIN JOB j     ON v.Vehicle_ID = j.Vehicle_ID;",
      next: ["User roles and security features", "Reports and dashboards", "Support for multiple branches", "Backup and recovery"],
    },
  ];
  const SOON = {
    code: "CRT-04", title: "CAPSTONE", sub: "biofeedback horror stealth game", cap: "IN DEV", img: "assets/img/carts/capstone.jpg",
    name: "Biofeedback Adaptive Horror Stealth Game",
    desc: "A PC horror-stealth game that reads your heart rate through a wearable sensor and adapts the enemies, difficulty and scares to how stressed you really are.",
    tech: ["Unreal Engine", "ESP32 wearable", "MAX30102 heart-rate sensor", "adaptive AI"],
    team: "Alya Altawash, Wajd Alballal, Shadow Alghamdi",
    release: "April 2027",
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function cartHTML(p, blank) {
    return `<span class="c-body">
      <span class="c-grip"></span>
      <span class="c-side">ALYA.SYS // ${p.code}</span>
      <span class="c-label">${blank ? `<span class="c-noise"></span><span class="c-nodata">NO DATA</span>` : `<img src="${p.img}" alt="" loading="lazy" draggable="false">`}<span class="c-scan"></span>${blank ? "" : `<span class="c-chip">${esc(p.cap)}</span>`}</span>
      <span class="c-title">${blank ? "LOCKED" : esc(p.title)}</span>
      <span class="c-sub">${blank ? esc(p.state) : esc(p.sub)}</span>
      <span class="c-foot"><i class="c-led"></i><span>85MB</span><span>${p.code}</span></span>
      <span class="c-pins"></span>
    </span>`;
  }

  // rack
  const rack = $("#rack");
  PROJECTS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "cart"; b.type = "button"; b.dataset.id = p.id; b.style.setProperty("--c", p.accent);
    b.setAttribute("aria-label", `Insert ${p.title} cartridge: ${p.tagline}`);
    b.innerHTML = cartHTML(p);
    b.addEventListener("click", () => insert(p, b));
    rack.append(b);
  });
  const blanks = $("#blanks");
  if (blanks) {
    const d = document.createElement("div");
    d.className = "soon";
    d.innerHTML = `<div class="cart blank soon-cart" style="--c:#ffb13b" role="img" aria-label="${SOON.code}: ${esc(SOON.name)}, coming soon">${cartHTML(SOON)}<span class="soon-stamp" aria-hidden="true">COMING SOON</span></div>
      <div class="panel soon-info">
        <p class="soon-badge"><i></i>coming soon · in active development</p>
        <h3>${esc(SOON.name)}</h3>
        <p>${esc(SOON.desc)}</p>
        <div class="rp-tags">${SOON.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <dl class="kv">
          <dt>type</dt><dd>senior capstone project</dd>
          <dt>team</dt><dd>${esc(SOON.team)}</dd>
          <dt>release</dt><dd class="soon-date">${esc(SOON.release)}</dd>
        </dl>
      </div>`;
    blanks.append(d);
  }

  // reader
  const ov = $("#readerOv"), deck = $("#deck"), deckCart = $("#deckCart"), clone = $("#rdClone"), reader = $("#reader");
  const boot = $("#rdBoot"), cover = $("#rdCover"), rp = $("#rp"), eject = $("#ejectBtn");
  let current = null, srcBtn = null, busy = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, reduce ? 0 : ms));
  const driveState = (s, p) => dispatchEvent(new CustomEvent("reader:state", { detail: { state: s, code: p && p.code, accent: p && p.accent } }));

  const SLIDE = "translateX(-31em)";            // waiting position, left of the slot
  const slideFrames = [{ transform: SLIDE }, { transform: "translateX(.5em)", offset: 0.88 }, { transform: "translateX(0)" }];

  function panelHTML(p) {
    const list = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    return `<div class="rp-bar"><span>[${p.code}] ${p.id}.md</span><button class="x" type="button" data-eject aria-label="Eject cartridge and close">[ eject ]</button></div>
    <div class="rp-body">
      <p class="rp-course">${esc(p.course)}</p>
      <h2 id="rpTitle">${esc(p.title)}</h2>
      <p class="rp-tag">${esc(p.tagline)}</p>
      <div class="rp-stats">${p.stats.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>
      <section><h3>&gt; problem</h3><p>${esc(p.problem)}</p></section>
      <section><h3>&gt; solution</h3><p>${esc(p.solution)}</p>
        ${p.pipeline ? `<ol class="rp-pipe" aria-label="${esc(p.pipeLabel || "workflow")}">${p.pipeline.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${p.pipeLabel ? `<p class="rp-cap">${esc(p.pipeLabel)}</p>` : ""}` : ""}
        ${p.extra ? `<figure class="rp-fig"><img src="${p.extra.img}" alt="Illustration of ${esc(p.extra.caption)}" loading="lazy"><figcaption>${esc(p.extra.caption)}</figcaption></figure>` : ""}
      </section>
      ${p.role ? `<section><h3>&gt; my_role</h3>${list(p.role)}</section>` : ""}
      ${p.notes ? `<section><h3>&gt; how_it_works</h3>${list(p.notes)}</section>` : ""}
      ${p.query ? `<section><h3>&gt; demo_query.sql</h3><pre class="rp-code"><code>${esc(p.query)}</code></pre></section>` : ""}
      <section><h3>&gt; stack</h3><div class="rp-tags">${p.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></section>
      ${p.challenges ? `<section><h3>&gt; challenges</h3>${list(p.challenges)}</section>` : ""}
      <section><h3>&gt; ${p.id === "unipool" ? "what_id_improve" : "next"}</h3>${list(p.next)}</section>
      <section><h3>&gt; team</h3><p class="rp-team">${esc(p.team)}</p></section>
      <div class="row">${p.link ? `<a class="btn" href="${p.link.href}" target="_blank" rel="noopener">[ ${esc(p.link.label)} ]</a>` : ""}<button class="btn alt" type="button" data-eject>[ eject cartridge ]</button></div>
    </div>`;
  }

  function typeBoot(lines, done) {
    boot.innerHTML = ""; let li = 0;
    const next = () => {
      if (li >= lines.length) return done && done();
      const d = document.createElement("div"); boot.append(d);
      const t = lines[li++]; let i = 0;
      const tick = () => { d.textContent = t.slice(0, ++i); if (i < t.length && !reduce) setTimeout(tick, 14); else setTimeout(next, reduce ? 0 : 120); };
      tick();
    };
    next();
  }

  function insert(p, btn) {
    if (busy || current) return;
    busy = true; current = p; srcBtn = btn;
    ov.style.setProperty("--c", p.accent);
    deckCart.innerHTML = cartHTML(p); clone.innerHTML = `<div class="cart">${cartHTML(p)}</div>`;
    deckCart.style.setProperty("--c", p.accent); clone.firstChild.style.setProperty("--c", p.accent);
    rp.innerHTML = panelHTML(p);
    cover.innerHTML = `<img src="${p.img}" alt=""><span>${esc(p.title)}</span>`;
    boot.innerHTML = ""; reader.classList.remove("on", "done", "reading");
    ov.hidden = false; ov.classList.remove("split", "out");
    document.body.classList.add("ro-open");
    requestAnimationFrame(() => ov.classList.add("in"));
    driveState("seek", p);

    // fly the cartridge from the rack to the slot
    deckCart.style.transform = "none";
    const from = btn.getBoundingClientRect(), to = deckCart.getBoundingClientRect();
    deckCart.style.transform = SLIDE; clone.style.transform = SLIDE;
    btn.classList.add("gone");
    const dx = from.left - to.left, dy = from.top - to.top, sc = from.width / to.width;
    const fly = reduce ? null : deckCart.animate([
      { transform: `translate(${dx}px,${dy}px) scale(${sc})`, transformOrigin: "0 0" },
      { transform: `${SLIDE} translateY(-1.2em) rotate(-4deg)`, transformOrigin: "0 0", offset: 0.75 },
      { transform: SLIDE, transformOrigin: "0 0" },
    ], { duration: 650, easing: "cubic-bezier(.3,.7,.2,1)" });

    const slide = () => {
      if (reduce) { deckCart.style.transform = clone.style.transform = "translateX(0)"; return seated(); }
      const opt = { duration: 720, easing: "cubic-bezier(.65,.02,.3,1)", fill: "forwards" };
      deckCart.animate(slideFrames, opt);
      const a = clone.animate(slideFrames, opt);
      a.onfinish = () => { deckCart.style.transform = clone.style.transform = "translateX(0)"; seated(); };
    };
    if (fly) fly.onfinish = () => later(slide, 120); else slide();
  }

  function seated() {
    reader.classList.add("clunk", "on", "reading");
    later(() => reader.classList.remove("clunk"), 260);
    driveState("read", current);
    typeBoot([`> detect ${current.code} ... ok`, `> read ${current.cap.toLowerCase()} sectors`, `> mount /${current.id}`, `> ${current.title}.md ready`], () => {
      reader.classList.remove("reading"); reader.classList.add("done");
      later(() => {
        ov.classList.add("split");
        driveState("idle", current);
        later(() => { busy = false; rp.focus({ preventScroll: true }); rp.scrollTop = 0; }, 450);
      }, 380);
    });
  }

  function ejectNow() {
    if (!current || busy) return;
    busy = true; timers.forEach(clearTimeout); timers = [];
    ov.classList.remove("split");
    reader.classList.remove("done", "reading");
    driveState("seek", current);
    const back = () => {
      reader.classList.remove("on");
      const to = srcBtn.getBoundingClientRect();
      const finish = () => {
        srcBtn.classList.remove("gone"); srcBtn.focus({ preventScroll: true });
        ov.classList.remove("in"); ov.classList.add("out");
        later(() => { ov.hidden = true; ov.classList.remove("out"); document.body.classList.remove("ro-open"); current = null; busy = false; driveState("idle"); }, 260);
      };
      if (reduce) return finish();
      // measure the cartridge at the slot mouth (layout box, no animation), then fly back home
      deckCart.getAnimations().forEach((a) => a.cancel());
      deckCart.style.transform = "none";
      const base = deckCart.getBoundingClientRect();
      deckCart.style.transform = SLIDE;
      const fx = to.left - base.left, fy = to.top - base.top, fs = to.width / base.width;
      deckCart.animate([{ transform: SLIDE, transformOrigin: "0 0" }, { transform: `translate(${fx}px,${fy}px) scale(${fs})`, transformOrigin: "0 0" }],
        { duration: 520, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = finish;
    };
    later(() => {
      if (reduce) return back();
      const opt = { duration: 520, easing: "cubic-bezier(.5,0,.6,1)", fill: "forwards" };
      const out = [{ transform: "translateX(0)" }, { transform: SLIDE }];
      deckCart.animate(out, opt); clone.animate(out, opt).onfinish = () => { clone.style.transform = SLIDE; back(); };
    }, 380);
  }

  eject.addEventListener("click", ejectNow);
  rp.addEventListener("click", (e) => { if (e.target.closest("[data-eject]")) ejectNow(); });
  ov.addEventListener("click", (e) => { if (e.target === ov || e.target.classList.contains("ro-stage")) ejectNow(); });
  addEventListener("keydown", (e) => {
    if (ov.hidden) return;
    if (e.key === "Escape") ejectNow();
    if (e.key === "Tab") { // keep focus inside the reader
      const f = [...ov.querySelectorAll("button, a[href], [tabindex='-1']")].filter((x) => x.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // deep link from Home: projects.html#gatekeep inserts that cartridge
  const want = decodeURIComponent(location.hash.slice(1));
  const wantBtn = want && rack.querySelector(`[data-id="${CSS.escape(want)}"]`);
  if (wantBtn) setTimeout(() => {
    wantBtn.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => insert(PROJECTS.find((p) => p.id === want), wantBtn), reduce ? 0 : 700);
  }, 300);
})();
