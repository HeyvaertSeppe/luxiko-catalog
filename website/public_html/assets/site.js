/* LUXIKO — main website. Plain JavaScript, no libraries. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero entrance
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      doc.classList.add("is-loaded");
    });
  });

  // Header: solid background once you scroll past the top
  var hdr = document.querySelector("[data-hdr]");
  function onScroll() {
    if (hdr) hdr.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var burger = document.querySelector("[data-burger]");
  var mnav = document.querySelector("[data-mnav]");
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    mnav.hidden = !open;
    hdr.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) setMenu(false);
    });
  }

  // Remember the language someone picks (the home page uses it to skip auto-detection)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-lang]");
    if (!a) return;
    try {
      localStorage.setItem("lx_lang", a.getAttribute("data-lang"));
    } catch (err) {}
  });

  // Count-up numbers
  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (!end || reduce) return;
    var start = null;
    var dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }

  // Reveal on scroll
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          var n = entry.target.querySelector("[data-count]");
          if (n) countUp(n);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    items.forEach(function (el) {
      io.observe(el);
    });

    // Highlight the menu item of the section on screen
    var links = document.querySelectorAll("[data-nav]");
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["about", "range", "series", "catalog", "shop", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  } else {
    items.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  // Small parallax on the hero photo
  var heroImg = document.querySelector(".hero-bg");
  if (heroImg && !reduce) {
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = Math.min(window.scrollY, window.innerHeight);
          heroImg.style.transform = "translate3d(0," + y * 0.3 + "px,0)";
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  // Contact form → catalog server (Resend)
  var form = document.querySelector("[data-form]");
  if (form) {
    var errorBox = form.querySelector("[data-error-box]");
    var submit = form.querySelector("[data-submit]");
    var submitHtml = submit.innerHTML;
    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.hidden = true;
      var bad = null;
      form.querySelectorAll("input[required], textarea[required]").forEach(function (f) {
        var ok = f.checkValidity();
        f.classList.toggle("is-bad", !ok);
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        bad.focus();
        showError(bad.validationMessage);
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = String(v);
      });
      data.lang = form.getAttribute("data-lang");
      data.page = location.href.slice(0, 200);
      submit.disabled = true;
      submit.textContent = form.getAttribute("data-sending");
      fetch(form.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (json) {
              if (!res.ok) throw new Error(json.error || "");
            });
        })
        .then(function () {
          form.querySelector(".form-fields").hidden = true;
          form.querySelector("[data-done]").hidden = false;
        })
        .catch(function (err) {
          showError((err && err.message) || form.getAttribute("data-error"));
        })
        .then(function () {
          submit.disabled = false;
          submit.innerHTML = submitHtml;
        });
    });
  }
})();
