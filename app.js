/* Rudranil Dhol, client site.
   Security notes:
   - No innerHTML anywhere: every piece of text is added with textContent, so nothing typed by a visitor can run as code.
   - This file is loaded from the same origin, so the Content-Security-Policy in vercel.json can forbid inline scripts.
   - Nothing is sent to or stored on a server. The form only builds a WhatsApp link in the visitor's own browser. */
(function () {
  "use strict";

  /* ====== YOUR CONTACT DETAILS (public by nature, visitors need them) ====== */
  var CONFIG = {
    whatsapp: "916382631521",          // country code + number, digits only
    email: "rudranildhol@gmail.com",
    displayName: "Rudranil"
  };
  /* ========================================================================= */

  var WA_OK = /^\d{10,15}$/.test(CONFIG.whatsapp);
  var EMAIL_OK = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(CONFIG.email);

  /* ---------- tiny safe helpers ---------- */
  function clean(value, max) {
    // strip control characters, collapse whitespace, cap the length
    return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    if (props.cls) el.className = props.cls;
    if (props.text != null) el.textContent = props.text;
    if (props.css) Object.keys(props.css).forEach(function (k) { el.style.setProperty(k, props.css[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgNode(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  /* ---------- WhatsApp and email links ---------- */
  function waLink(msg) {
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(clean(msg, 700));
  }

  document.querySelectorAll("[data-wa]").forEach(function (el) {
    if (!WA_OK) { console.error("Set a valid WhatsApp number in app.js (digits only, with country code)."); return; }
    el.href = waLink(el.getAttribute("data-msg") || "Hi " + CONFIG.displayName + ", I'd like to talk about a website.");
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });

  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (!EMAIL_OK) return;
    el.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent("Website enquiry");
    el.textContent = CONFIG.email;
  });

  /* ---------- Quote form (builds a WhatsApp message, stores nothing) ---------- */
  var form = document.getElementById("quote-form");
  if (form) {
    var msgEl = document.getElementById("form-msg");
    var submitBtn = form.querySelector("button[type=submit]");
    var ALLOWED_TYPES = ["Cafe or restaurant", "Salon or spa", "Gym or fitness studio", "Clinic or doctor", "Coaching or tuition centre", "Shop or boutique", "Something else"];
    var ALLOWED_NEEDS = ["A new website", "A redesign of my current website", "Not sure yet, I need advice"];

    function say(text, isError) {
      msgEl.textContent = text;
      msgEl.classList.toggle("error", !!isError);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("f-name");
      var name = clean(nameEl.value, 60);
      var biz = clean(document.getElementById("f-biz").value, 80);
      var type = document.getElementById("f-type").value;
      var need = document.getElementById("f-need").value;
      var extra = clean(document.getElementById("f-extra").value, 300);

      if (!name) { say("Please enter your name so I know who I'm talking to.", true); nameEl.focus(); return; }
      if (ALLOWED_TYPES.indexOf(type) === -1 || ALLOWED_NEEDS.indexOf(need) === -1) { say("Please choose from the lists provided.", true); return; }
      if (!document.getElementById("f-consent").checked) { say("Please tick the box to confirm you've read the privacy notice.", true); document.getElementById("f-consent").focus(); return; }
      if (!WA_OK) { say("WhatsApp isn't set up yet. Please email me instead.", true); return; }

      var text = "Hi " + CONFIG.displayName + ", I'm " + name + (biz ? " from " + biz : "") +
        " (" + type.toLowerCase() + "). I need " + need.toLowerCase() + "." + (extra ? " " + extra : "");

      var a = document.createElement("a");
      a.href = waLink(text);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();

      say("Opening WhatsApp. If nothing opens, use the WhatsApp link next to the form.", false);
      submitBtn.disabled = true;                       // stops accidental repeat sends
      setTimeout(function () { submitBtn.disabled = false; }, 4000);
    });
  }

  /* ---------- Interactive phone demo (built with DOM calls, not innerHTML) ---------- */
  var ART = {
    Cafe: function (c, k) { return [
      ["path", { d: "M16 42h54v22a24 24 0 0 1-24 24H40a24 24 0 0 1-24-24z", fill: c }],
      ["path", { d: "M70 48h6a11 11 0 0 1 0 22h-8", fill: "none", stroke: c, "stroke-width": 6, "stroke-linecap": "round" }],
      ["path", { d: "M30 32c0-7 7-7 7-14M44 32c0-7 7-7 7-14M58 32c0-7 7-7 7-14", fill: "none", stroke: k, "stroke-width": 4, "stroke-linecap": "round", opacity: ".85" }],
      ["rect", { x: 10, y: 90, width: 66, height: 5, rx: 2.5, fill: k, opacity: ".35" }]
    ]; },
    Salon: function (c, k) { return [
      ["circle", { cx: 30, cy: 76, r: 13, fill: "none", stroke: c, "stroke-width": 6 }],
      ["circle", { cx: 70, cy: 76, r: 13, fill: "none", stroke: c, "stroke-width": 6 }],
      ["path", { d: "M39 66L68 12M61 66L32 12", stroke: c, "stroke-width": 6, "stroke-linecap": "round" }],
      ["circle", { cx: 50, cy: 46, r: 4, fill: k }]
    ]; },
    Gym: function (c) { return [
      ["rect", { x: 4, y: 38, width: 10, height: 24, rx: 3, fill: c }],
      ["rect", { x: 14, y: 28, width: 14, height: 44, rx: 4, fill: c }],
      ["rect", { x: 28, y: 46, width: 44, height: 8, fill: c }],
      ["rect", { x: 72, y: 28, width: 14, height: 44, rx: 4, fill: c }],
      ["rect", { x: 86, y: 38, width: 10, height: 24, rx: 3, fill: c }]
    ]; },
    Clinic: function (c, k) { return [
      ["path", { d: "M50 22C42 16 26 14 22 30C19 42 28 52 30 66C31 78 34 88 40 88C46 88 46 70 50 70C54 70 54 88 60 88C66 88 69 78 70 66C72 52 81 42 78 30C74 14 58 16 50 22Z", fill: c }],
      ["path", { d: "M72 10v14M65 17h14", stroke: k, "stroke-width": 4, "stroke-linecap": "round" }]
    ]; }
  };

  function art(id, c, k) {
    var svg = svgNode("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", focusable: "false" });
    ART[id](c, k).forEach(function (p) { svg.appendChild(svgNode(p[0], p[1])); });
    return svg;
  }

  // Sample content only. The "reviews" chip is deliberately generic so it can't be mistaken for a real rating.
  var DEMOS = [
    { id: "Cafe", name: "Filter Kaapi House", small: "Open daily, 7am to 10pm", headline: "Fresh filter coffee, made daily.", cta: "Order now",
      main: "#1F5C45", mainInk: "#ffffff", accent: "#FFC857", accentInk: "#1c1c1c", price: "#1F5C45",
      items: [["Filter coffee", "Strong and frothy", "₹40", "#E8D2B0"], ["Masala dosa", "With 2 chutneys", "₹90", "#F2C46B"], ["Cold brew", "Slow steeped 12 hrs", "₹120", "#B9D8C8"]] },
    { id: "Salon", name: "Glow Studio", small: "Walk-ins and appointments", headline: "Look good. Feel even better.", cta: "Book a slot",
      main: "#6B2D5C", mainInk: "#ffffff", accent: "#F4B6D8", accentInk: "#3a1030", price: "#6B2D5C",
      items: [["Haircut", "Wash and style", "₹300", "#F4B6D8"], ["Facial", "Deep cleanse", "₹800", "#E8C7F0"], ["Bridal makeup", "Trial included", "₹6,000", "#F7D9B8"]] },
    { id: "Gym", name: "IronWorks Fitness", small: "Strength and cardio", headline: "Your first week is on us.", cta: "Join today",
      main: "#17171C", mainInk: "#ffffff", accent: "#FF5A1F", accentInk: "#17171C", price: "#C73E00",
      items: [["Monthly pass", "All equipment", "₹1,200", "#FFC9B0"], ["Quarterly pass", "Save ₹600", "₹3,000", "#FFB38F"], ["Personal trainer", "1 to 1 sessions", "₹4,000", "#D8D8E0"]] },
    { id: "Clinic", name: "CarePoint Dental", small: "Family dental clinic", headline: "Gentle care for the whole family.", cta: "Book a visit",
      main: "#0E5E78", mainInk: "#ffffff", accent: "#BDEBF5", accentInk: "#06303d", price: "#0E5E78",
      items: [["Check-up", "Includes X-ray", "₹300", "#BDEBF5"], ["Cleaning", "Scaling and polish", "₹800", "#CDE8D8"], ["Teeth whitening", "One visit", "₹4,500", "#E0E6F8"]] }
  ];

  var tabsEl = document.getElementById("tabs");
  var screenEl = document.getElementById("screen");
  var progressEl = document.getElementById("progress");
  var toggleEl = document.getElementById("toggle");
  if (!tabsEl || !screenEl) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = 0, timer = null, playing = !reduceMotion;

  function renderDemo(index, animate) {
    current = index;
    var d = DEMOS[index];

    var rows = d.items.map(function (it) {
      return h("li", null,
        h("span", { cls: "ph-sw", css: { background: it[3] } }),
        h("span", null, h("b", { text: it[0] }), h("em", { text: it[1] })),
        h("span", { cls: "pr", css: { color: d.price }, text: it[2] }));
    });

    var nodes = [
      h("div", { cls: "ph-status" }, h("span", { text: "9:41" }), h("span", { text: "5G" })),
      h("div", { cls: "ph-top" }, h("span", { text: d.name }),
        h("span", { cls: "ph-menu" }, h("i"), h("i"), h("i"))),
      h("div", { cls: "ph-hero", css: { background: d.main, color: d.mainInk } },
        h("small", { text: d.small }),
        h("div", { cls: "ph-title", text: d.headline }),
        h("span", { cls: "ph-cta", css: { background: d.accent, color: d.accentInk }, text: d.cta }),
        h("div", { cls: "ph-art" }, art(d.id, d.accent, d.mainInk))),
      h("div", { cls: "ph-meta" },
        h("span", { text: "★ Your Google reviews" }),
        h("span", null, h("i", { cls: "dot" }), document.createTextNode("Open now"))),
      h("ul", { cls: "ph-list" }, rows[0], rows[1], rows[2]),
      h("div", { cls: "ph-bar" },
        h("span", { text: "Call" }),
        h("span", { css: { background: d.main, color: d.mainInk }, text: "WhatsApp" }),
        h("span", { text: "Map" }))
    ];
    screenEl.replaceChildren.apply(screenEl, nodes);
    screenEl.setAttribute("aria-label", "Sample website for a " + d.id.toLowerCase());

    if (animate && !reduceMotion) {
      screenEl.classList.remove("swap");
      void screenEl.offsetWidth;
      screenEl.classList.add("swap");
    }
    Array.prototype.forEach.call(tabsEl.children, function (btn, i) {
      btn.setAttribute("aria-pressed", i === index ? "true" : "false");
    });
    restartProgress();
  }

  function restartProgress() {
    if (!progressEl) return;
    progressEl.classList.remove("run");
    void progressEl.offsetWidth;
    if (playing) progressEl.classList.add("run");
  }

  function setPlaying(on) {
    playing = on;
    clearInterval(timer);
    if (on) timer = setInterval(function () { renderDemo((current + 1) % DEMOS.length, true); }, 5000);
    if (progressEl) progressEl.classList.toggle("off", !on);
    if (toggleEl) {
      toggleEl.textContent = on ? "Pause" : "Play";
      toggleEl.setAttribute("aria-pressed", on ? "false" : "true");
    }
    restartProgress();
  }

  DEMOS.forEach(function (d, i) {
    var b = h("button", { cls: "tab" }, art(d.id, "currentColor", "currentColor"), h("span", { text: d.id }));
    b.type = "button";
    b.addEventListener("click", function () { setPlaying(false); renderDemo(i, true); });
    tabsEl.appendChild(b);
  });

  if (toggleEl) {
    toggleEl.hidden = reduceMotion;                    // nothing moves for people who asked for less motion
    toggleEl.addEventListener("click", function () { setPlaying(!playing); });
  }

  renderDemo(0, false);
  setPlaying(playing);
})();
