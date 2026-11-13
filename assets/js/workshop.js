(function () {
  "use strict";
  var cfg = window.L36 || {};
  var lead = {};
  try { lead = JSON.parse(localStorage.getItem("l36_workshop_lead") || "{}") || {}; } catch (e) {}

  /* ---------- Saudação ---------- */
  var first = new URLSearchParams(location.search).get("n") || (lead.nome || "").split(" ")[0];
  if (first) {
    first = first.replace(/[<>]/g, "").slice(0, 30);
    document.getElementById("hello").textContent = "Inscrição confirmada, " + first + "!";
  }

  /* ---------- Vídeo (YouTube) ---------- */
  var player = document.getElementById("player");
  var poster = document.getElementById("poster");
  var chapterBtns = document.querySelectorAll("#chapters button");

  function mark(t) {
    chapterBtns.forEach(function (b) { b.classList.toggle("on", Number(b.dataset.t) === t); });
  }
  function load(start) {
    start = start || 0;
    mark(start);
    if (!cfg.YOUTUBE_ID) {
      player.innerHTML = '<div class="player-msg"><p><strong style="color:#fff">O vídeo entra aqui.</strong><br>Defina o YOUTUBE_ID em assets/js/config.js.</p></div>';
      return;
    }
    var src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(cfg.YOUTUBE_ID) +
      "?autoplay=1&rel=0&modestbranding=1&playsinline=1&start=" + start;
    player.innerHTML = '<iframe src="' + src + '" title="' + (cfg.WORKSHOP || "Workshop") +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    push("workshop_play", { start: start });
  }
  poster.addEventListener("click", function () { load(0); });
  chapterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      load(Number(b.dataset.t));
      if (window.innerWidth < 1020) player.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  /* ---------- Reunião de diagnóstico ---------- */
  var msg = "Olá, Guilherme! Assisti ao workshop \"" + (cfg.WORKSHOP || "Rotinas de IA para renovação e recuperação de associados") +
    "\" e quero agendar a reunião de diagnóstico." +
    (lead.nome ? "\n\nNome: " + lead.nome : "") +
    (lead.associacao ? "\nAssociação: " + lead.associacao : "") +
    (lead.associados ? "\nAssociados: " + lead.associados : "") +
    (lead.desafio ? "\nMaior desafio: " + lead.desafio : "");
  var diagUrl = cfg.AGENDA_URL || ("https://wa.me/" + (cfg.WHATSAPP || "5561996490474") + "?text=" + encodeURIComponent(msg));
  var diagLinks = [document.getElementById("ctaDiag")].concat([].slice.call(document.querySelectorAll("[data-diag]")));
  diagLinks.forEach(function (a) {
    a.href = diagUrl;
    a.addEventListener("click", function () { push("diagnostico_click", {}); });
  });
  if (cfg.AGENDA_URL) {
    var cta = document.getElementById("ctaDiag");
    cta.innerHTML = '<svg><use href="#i-cal"/></svg>Escolher horário para o diagnóstico';
  }

  /* ---------- Downloads ---------- */
  document.querySelectorAll("[data-dl]").forEach(function (a) {
    a.addEventListener("click", function () { push("material_download", { material: a.dataset.dl }); });
  });

  function push(event, extra) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, extra));
  }

  /* ---------- CTA fixo no celular (aparece depois do vídeo) ---------- */
  var sticky = document.getElementById("stickyCta");
  var diagSec = document.getElementById("diagnostico");
  function onScroll() {
    var past = window.scrollY > player.getBoundingClientRect().bottom + window.scrollY - 80;
    var r = diagSec.getBoundingClientRect();
    var inDiag = r.top < window.innerHeight && r.bottom > 0;
    sticky.classList.toggle("show", past && !inDiag);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Animação de entrada ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });
})();
