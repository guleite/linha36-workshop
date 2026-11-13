(function () {
  "use strict";
  var cfg = window.L36 || {};
  var STORE = "l36_workshop_lead";

  /* ---------- Origem do lead (UTMs) ---------- */
  var params = new URLSearchParams(location.search);
  var utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].forEach(function (k) {
    if (params.get(k)) utm[k] = params.get(k);
  });
  var startedAt = Date.now();

  /* ---------- Formulário em 2 etapas ---------- */
  var form = document.getElementById("leadForm");
  var steps = form.querySelectorAll(".fstep");
  var bars = document.querySelectorAll("[data-bar]");
  var errorBox = document.getElementById("formError");
  var submitBtn = document.getElementById("submitBtn");

  var phone = document.getElementById("whatsapp");
  phone.addEventListener("input", function () {
    var d = phone.value.replace(/\D/g, "").slice(0, 11);
    var out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
    phone.value = out;
  });

  function validField(el) {
    var v = (el.value || "").trim();
    if (el.type === "checkbox") return el.checked;
    if (!el.required) return true;
    if (!v) return false;
    if (el.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (el.id === "whatsapp") return v.replace(/\D/g, "").length >= 10;
    if (el.id === "nome") return v.length >= 3;
    return true;
  }

  function checkStep(stepEl) {
    var ok = true, first = null;
    stepEl.querySelectorAll("input[required]:not([type=checkbox]), select[required]").forEach(function (el) {
      var good = validField(el);
      var f = el.closest(".field");
      if (f) f.classList.toggle("invalid", !good);
      if (!good) { ok = false; if (!first) first = el; }
    });
    if (first) first.focus();
    return ok;
  }

  form.querySelectorAll("input, select").forEach(function (el) {
    el.addEventListener("input", function () {
      var f = el.closest(".field");
      if (f && f.classList.contains("invalid") && validField(el)) f.classList.remove("invalid");
    });
  });

  function go(n) {
    steps.forEach(function (s) { s.hidden = s.dataset.step !== String(n); });
    bars.forEach(function (b) { b.classList.toggle("on", Number(b.dataset.bar) <= n); });
    var first = form.querySelector('.fstep[data-step="' + n + '"] input, .fstep[data-step="' + n + '"] select');
    if (first) first.focus({ preventScroll: true });
  }

  form.querySelector("[data-next]").addEventListener("click", function () {
    if (checkStep(steps[0])) go(2);
  });
  form.querySelector("[data-prev]").addEventListener("click", function () { go(1); });
  // Enter na etapa 1 avança em vez de enviar
  steps[0].addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); if (checkStep(steps[0])) go(2); }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.classList.remove("show");
    if (!checkStep(steps[0])) { go(1); return; }
    var consent = document.getElementById("consent");
    if (!checkStep(steps[1])) return;
    if (!consent.checked) {
      errorBox.textContent = "Para liberar o acesso, marque o aceite de recebimento do workshop.";
      errorBox.classList.add("show");
      consent.focus();
      return;
    }
    if (form.website.value) return; // robô

    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = String(v).trim(); });
    data.consent = true;
    var lead = Object.assign(data, utm, {
      origem: "Workshop - " + (cfg.WORKSHOP || "Linha 36"),
      pagina: location.href.split("?")[0],
      elapsed_ms: Date.now() - startedAt,
      enviado_em: new Date().toISOString(),
    });

    submitBtn.disabled = true;
    submitBtn.textContent = "Liberando seu acesso…";

    try { localStorage.setItem(STORE, JSON.stringify({ nome: lead.nome, associacao: lead.associacao, email: lead.email, whatsapp: lead.whatsapp, desafio: lead.desafio, associados: lead.associados })); } catch (err) {}

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "lead_workshop", segmento: lead.segmento, associados: lead.associados, cargo: lead.cargo });
    if (typeof window.fbq === "function") window.fbq("track", "Lead");

    var next = "workshop.html?n=" + encodeURIComponent(lead.nome.split(" ")[0]);
    var done = function () { location.href = next; };

    if (!cfg.LEAD_ENDPOINT) { setTimeout(done, 400); return; }
    var timer = setTimeout(done, 6000); // não prende a pessoa se o servidor demorar
    fetch(cfg.LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      keepalive: true,
    }).catch(function () {}).then(function () { clearTimeout(timer); done(); });
  });

  /* ---------- Calculadora ---------- */
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  var $ = function (id) { return document.getElementById(id); };
  var num = new Intl.NumberFormat("pt-BR");
  var inputs = ["cMembers", "cFee", "cChurn"].map($);
  function fill(el) {
    var p = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty("--p", p + "%");
  }
  function calc() {
    var members = +inputs[0].value, fee = +inputs[1].value, churn = +inputs[2].value;
    $("oMembers").textContent = num.format(members);
    $("oFee").textContent = brl.format(fee);
    $("oChurn").textContent = churn + "%";
    // associados × mensalidade × 12 × % que não renova
    $("rYear").textContent = brl.format(members * fee * 12 * (churn / 100));
    inputs.forEach(fill);
  }
  inputs.forEach(function (el) { el.addEventListener("input", calc); });
  calc();

  /* ---------- Animação de entrada ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });
})();
