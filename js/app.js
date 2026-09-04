(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn, false);
  }

  var state = {
    filter: "all",
    radarIds: ["fable", "gemini", "kimi", "qwen", "glm", "hy4"],
    barKey: "tb21",
    specId: "fable",
    sortKey: "name",
    sortDir: 1,
  };

  var radarChart = null;
  var barChart = null;
  var resizeTimer = null;

  function fmt(n, digits) {
    if (digits == null) digits = 1;
    if (n === null || n === undefined || n === "") return "—";
    if (typeof n !== "number") return String(n);
    return Math.round(n) === n ? String(n) : n.toFixed(digits);
  }

  function priceLabel(model) {
    if (model.priceIn == null || model.priceOut == null) return "Unpublished";
    if (model.priceIn === 0 && model.priceOut === 0) return "Local / $0 API";
    return "$" + fmt(model.priceIn, 2) + " / $" + fmt(model.priceOut, 2);
  }

  function contextLabel(model) {
    if (model.context === "1,048,576" || model.context === "1,000,000") return "1M";
    if (model.context === "131,072") return "131K";
    if (model.context === "400,000") return "400K";
    return model.context;
  }

  function paramsLabel(model) {
    if (String(model.paramsActive).indexOf("dense") !== -1 || model.paramsActive === "Undisclosed") {
      return model.paramsTotal;
    }
    return model.paramsTotal + " / " + model.paramsActive + " act.";
  }

  function bestOf(key) {
    var vals = [];
    for (var i = 0; i < MODELS.length; i++) {
      var v = MODELS[i].scores[key];
      if (typeof v === "number") vals.push(v);
    }
    if (!vals.length) return null;
    return Math.max.apply(null, vals);
  }

  function benchByKey(key) {
    for (var i = 0; i < BENCHMARKS.length; i++) {
      if (BENCHMARKS[i].key === key) return BENCHMARKS[i];
    }
    return { label: key, unit: "" };
  }

  function closeMenu() {
    var links = qs("#nav-links");
    var btn = qs("#menu-btn");
    var scrim = qs("#nav-scrim");
    if (links) links.className = links.className.replace(/\bopen\b/g, "").replace(/\s+/g, " ").trim();
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
    }
    if (scrim) {
      scrim.className = "nav-scrim";
      scrim.hidden = true;
    }
    document.body.style.overflow = "";
  }

  function openMenu() {
    var links = qs("#nav-links");
    var btn = qs("#menu-btn");
    var scrim = qs("#nav-scrim");
    if (links) links.className = (links.className + " open").replace(/\s+/g, " ").trim();
    if (btn) {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
    }
    if (scrim) {
      scrim.hidden = false;
      scrim.className = "nav-scrim visible";
    }
    document.body.style.overflow = "hidden";
  }

  function renderMethod() {
    var host = qs("#method-grid");
    if (!host) return;
    host.innerHTML = METHOD_STEPS.map(function (s) {
      return (
        '<article class="method-card"><h3>' +
        s.title +
        "</h3><p>" +
        s.body +
        "</p></article>"
      );
    }).join("");
  }

  function renderBenchGuide() {
    var host = qs("#bench-grid");
    if (!host) return;
    host.innerHTML = BENCHMARKS.map(function (b) {
      return (
        '<article class="bench-card" id="bench-' +
        b.key +
        '">' +
        '<div class="group">' +
        b.group +
        " · " +
        b.unit +
        "</div>" +
        "<h3>" +
        b.label +
        "</h3>" +
        "<p><strong>What it tests.</strong> " +
        b.measures +
        ". " +
        b.description +
        "</p>" +
        '<div class="bench-meta"><span>How to read it</span>' +
        b.interpret +
        "</div>" +
        '<div class="bench-meta"><span>Watch-out</span>' +
        b.caveat +
        "</div>" +
        '<div class="bench-meta"><span>Leader in this set</span>' +
        b.leader +
        "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderFindings() {
    var host = qs("#findings-grid");
    if (!host) return;
    host.innerHTML = FINDINGS.map(function (f) {
      return '<article class="finding"><h3>' + f.title + "</h3><p>" + f.body + "</p></article>";
    }).join("");
  }

  function renderCards() {
    var host = qs("#model-grid");
    if (!host) return;
    var filtered = MODELS.filter(function (m) {
      if (state.filter === "all") return true;
      if (state.filter === "open") return m.openness === "Open";
      if (state.filter === "closed") return m.openness.indexOf("Closed") === 0;
      if (state.filter === "restricted") {
        return m.access.toLowerCase().indexOf("only") !== -1 || m.openness.indexOf("restricted") !== -1;
      }
      if (state.filter === "local") return m.id === "muse" || m.id === "glm";
      return true;
    });

    host.innerHTML = filtered
      .map(function (m) {
        return (
          '<button class="card" data-id="' +
          m.id +
          '" type="button">' +
          '<div class="card-top"><div>' +
          '<div class="tag">' +
          m.tag +
          "</div><h3>" +
          m.name +
          '</h3><div class="vendor">' +
          m.vendor +
          " · " +
          m.released +
          "</div></div>" +
          '<span class="dot" style="background:' +
          m.color +
          '"></span></div>' +
          '<div class="meta">' +
          "<div><small>Parameters</small><b>" +
          paramsLabel(m) +
          "</b></div>" +
          "<div><small>Context</small><b>" +
          contextLabel(m) +
          "</b></div>" +
          "<div><small>Access</small><b>" +
          m.openness +
          "</b></div>" +
          "<div><small>API / 1M</small><b>" +
          priceLabel(m) +
          "</b></div></div></button>"
        );
      })
      .join("");

    qsa(".card", host).forEach(function (el) {
      on(el, "click", function () {
        openModal(el.getAttribute("data-id"));
      });
    });
  }

  function openModal(id) {
    var m = null;
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) m = MODELS[i];
    if (!m) return;
    var modal = qs("#modal");
    var body = qs("#modal-body");
    body.innerHTML =
      "<header><div><div class=\"spec-kicker\">" +
      m.vendor +
      " · " +
      m.released +
      "</div><h3 style=\"font-family:var(--serif);font-weight:400;font-size:clamp(22px,5vw,32px);margin:8px 0 0\">" +
      m.name +
      '</h3></div><button class="close" type="button" aria-label="Close">&times;</button></header>' +
      '<p style="color:var(--muted);margin:12px 0 18px">' +
      m.architecture +
      ". " +
      m.host +
      ".</p>" +
      '<div class="spec-grid">' +
      '<div class="spec-item"><small>API ID</small><b class="num">' +
      m.apiId +
      "</b></div>" +
      '<div class="spec-item"><small>Licence</small><b>' +
      m.license +
      "</b></div>" +
      '<div class="spec-item"><small>Modalities</small><b>' +
      m.modalities +
      "</b></div>" +
      '<div class="spec-item"><small>Reasoning</small><b>' +
      m.reasoning +
      "</b></div>" +
      '<div class="spec-item"><small>Max output</small><b>' +
      m.maxOut +
      "</b></div>" +
      '<div class="spec-item"><small>Hardware</small><b>' +
      m.hardware +
      "</b></div></div>" +
      '<div class="spec-cols"><div><h4>Best suited</h4><ul>' +
      m.bestFor.map(function (x) { return "<li>" + x + "</li>"; }).join("") +
      "</ul></div><div><h4>Not the first pick for</h4><ul>" +
      m.notFor.map(function (x) { return "<li>" + x + "</li>"; }).join("") +
      "</ul></div></div>";
    modal.className = "modal open";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = qs(".close", modal);
    on(closeBtn, "click", closeModal);
  }

  function closeModal() {
    var modal = qs("#modal");
    if (!modal) return;
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    if (qs("#nav-links") && qs("#nav-links").className.indexOf("open") === -1) {
      document.body.style.overflow = "";
    }
  }

  function renderToggles() {
    var host = qs("#radar-toggles");
    if (!host) return;
    host.innerHTML = MODELS.map(function (m) {
      var checked = state.radarIds.indexOf(m.id) !== -1 ? " checked" : "";
      return (
        '<label class="toggle"><input type="checkbox" value="' +
        m.id +
        '"' +
        checked +
        '><span class="swatch" style="background:' +
        m.color +
        '"></span><span>' +
        m.short +
        "</span></label>"
      );
    }).join("");
    qsa("input", host).forEach(function (input) {
      on(input, "change", function () {
        state.radarIds = qsa("input", host)
          .filter(function (i) {
            return i.checked;
          })
          .map(function (i) {
            return i.value;
          });
        drawRadar();
      });
    });
  }

  function cssVar(name) {
    var v = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    return v ? v.replace(/^\s+|\s+$/g, "") : "";
  }

  function chartPalette() {
    return {
      text: cssVar("--chart-text") || "#1c1812",
      muted: cssVar("--chart-muted") || "#4f4a42",
      grid: cssVar("--chart-grid") || "rgba(32,26,16,0.14)",
      panel: cssVar("--panel") || "#ffffff",
      ink: cssVar("--ink") || "#1c1812",
    };
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, persist) {
    if (theme !== "light" && theme !== "dark") theme = "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    if (persist) {
      try {
        localStorage.setItem("mb-theme", theme);
      } catch (e) {}
    }
    var meta = qs("#meta-theme-color");
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4efe6" : "#07080b");
    var lightBtn = qs("#theme-light");
    var darkBtn = qs("#theme-dark");
    if (lightBtn) lightBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    if (darkBtn) darkBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    if (radarChart || barChart) {
      drawRadar();
      drawBars();
    }
  }

  function initTheme() {
    applyTheme(currentTheme(), false);
    qsa("[data-theme-set]").forEach(function (btn) {
      on(btn, "click", function () {
        applyTheme(btn.getAttribute("data-theme-set"), true);
      });
    });
  }

  function radarValue(model, key) {
    var v = model.scores[key];
    if (typeof v !== "number") return null;
    return v;
  }

  function hasChart() {
    return typeof window.Chart === "function";
  }

  function showChartFallback() {
    var r = qs("#radar-fallback");
    var b = qs("#bar-fallback");
    if (r) r.hidden = false;
    if (b) b.hidden = false;
    var rc = qs("#radar-chart");
    var bc = qs("#bar-chart");
    if (rc) rc.style.display = "none";
    if (bc) bc.style.display = "none";
  }

  function drawRadar() {
    var ctx = qs("#radar-chart");
    if (!ctx || !hasChart()) {
      showChartFallback();
      return;
    }
    var axes = [
      { key: "tb21", label: "TB 2.1" },
      { key: "swePro", label: "SWE-Pro" },
      { key: "deepswe", label: "DeepSWE" },
      { key: "gpqa", label: "GPQA" },
      { key: "hle", label: "HLE" },
      { key: "osworld", label: "OSWorld" },
    ];
    var datasets = [];
    for (var i = 0; i < state.radarIds.length; i++) {
      var m = null;
      for (var j = 0; j < MODELS.length; j++) if (MODELS[j].id === state.radarIds[i]) m = MODELS[j];
      if (!m) continue;
      datasets.push({
        label: m.short,
        data: axes.map(function (a) {
          return radarValue(m, a.key);
        }),
        borderColor: m.color,
        backgroundColor: m.color + "22",
        pointBackgroundColor: m.color,
        borderWidth: 2,
        spanGaps: true,
      });
    }
    if (radarChart) radarChart.destroy();
    var pal = chartPalette();
    radarChart = new window.Chart(ctx, {
      type: "radar",
      data: {
        labels: axes.map(function (a) {
          return a.label;
        }),
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: pal.text, boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: pal.panel,
            titleColor: pal.text,
            bodyColor: pal.text,
            borderColor: pal.grid,
            borderWidth: 1,
            callbacks: {
              label: function (c) {
                var v = c.raw;
                return v == null ? c.dataset.label + ": n/a" : c.dataset.label + ": " + fmt(v);
              },
            },
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            angleLines: { color: pal.grid },
            grid: { color: pal.grid },
            pointLabels: { color: pal.text, font: { size: 11 } },
            ticks: { display: false, backdropColor: "transparent" },
          },
        },
      },
    });
  }

  function drawBars() {
    var key = state.barKey;
    var ctx = qs("#bar-chart");
    if (!ctx || !hasChart()) {
      showChartFallback();
      return;
    }
    var rows = MODELS.filter(function (m) {
      return typeof m.scores[key] === "number";
    });
    if (barChart) barChart.destroy();
    var pal = chartPalette();
    var meta = benchByKey(key);
    barChart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: rows.map(function (m) {
          return m.short;
        }),
        datasets: [
          {
            label: meta.label,
            data: rows.map(function (m) {
              return m.scores[key];
            }),
            backgroundColor: rows.map(function (m) {
              return m.color;
            }),
            borderWidth: 0,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: meta.label + (meta.unit ? " (" + meta.unit + ")" : ""),
            color: pal.text,
            font: { size: 13, weight: "500" },
            align: "start",
          },
          tooltip: {
            backgroundColor: pal.panel,
            titleColor: pal.text,
            bodyColor: pal.text,
            borderColor: pal.grid,
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: pal.grid },
            ticks: { color: pal.muted },
          },
          y: {
            grid: { display: false },
            ticks: { color: pal.text },
          },
        },
      },
    });
  }

  window.__drawCharts = function () {
    drawRadar();
    drawBars();
  };

  function ensureCharts() {
    if (hasChart()) {
      drawRadar();
      drawBars();
      return;
    }
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload = function () {
      drawRadar();
      drawBars();
    };
    s.onerror = showChartFallback;
    document.body.appendChild(s);
    setTimeout(function () {
      if (!hasChart()) showChartFallback();
    }, 4000);
  }

  function tableRows() {
    var rows = MODELS.slice();
    rows.sort(function (a, b) {
      var av = a.scores[state.sortKey] !== undefined ? a.scores[state.sortKey] : a[state.sortKey];
      var bv = b.scores[state.sortKey] !== undefined ? b.scores[state.sortKey] : b[state.sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return av.localeCompare(bv) * state.sortDir;
      return (av - bv) * state.sortDir;
    });
    return rows;
  }

  var TABLE_KEYS = ["tb21", "swePro", "deepswe", "gpqa", "hle", "osworld"];

  function renderTable() {
    var host = qs("#bench-table");
    if (!host) return;
    var bests = {};
    for (var i = 0; i < TABLE_KEYS.length; i++) bests[TABLE_KEYS[i]] = bestOf(TABLE_KEYS[i]);

    var head =
      "<tr><th data-sort=\"name\" scope=\"col\">Model</th><th data-sort=\"vendor\" scope=\"col\">Lab</th>" +
      '<th data-sort="paramsTotal" scope="col">Params</th><th data-sort="contextK" scope="col">Context</th>' +
      '<th data-sort="priceIn" scope="col">In / Out $</th>';
    for (i = 0; i < TABLE_KEYS.length; i++) {
      head +=
        '<th data-sort="' +
        TABLE_KEYS[i] +
        '" scope="col">' +
        benchByKey(TABLE_KEYS[i]).label +
        "</th>";
    }
    head += '<th data-sort="openness" scope="col">Weights</th></tr>';

    var body = tableRows()
      .map(function (m) {
        var cells = TABLE_KEYS.map(function (k) {
          var v = m.scores[k];
          if (typeof v !== "number") return '<td class="na">—</td>';
          var cls = v === bests[k] ? "num best" : "num";
          return '<td class="' + cls + '">' + fmt(v) + "</td>";
        }).join("");
        return (
          "<tr><td><span class=\"name-cell\"><span class=\"dot\" style=\"background:" +
          m.color +
          '"></span>' +
          m.name +
          "</span></td><td>" +
          m.vendor +
          '</td><td class="num">' +
          m.paramsTotal +
          '</td><td class="num">' +
          (m.contextK == null ? "—" : fmt(m.contextK) + "K") +
          '</td><td class="num">' +
          (m.priceIn == null || m.priceOut == null
            ? "—"
            : m.priceIn === 0
              ? "local"
              : fmt(m.priceIn, 2) + " / " + fmt(m.priceOut, 2)) +
          "</td>" +
          cells +
          "<td>" +
          m.openness +
          "</td></tr>"
        );
      })
      .join("");

    host.innerHTML = "<thead>" + head + "</thead><tbody>" + body + "</tbody>";
    qsa("th", host).forEach(function (th) {
      on(th, "click", function () {
        sortTable(th.getAttribute("data-sort"));
      });
    });
  }

  function sortTable(key) {
    if (state.sortKey === key) state.sortDir *= -1;
    else {
      state.sortKey = key;
      state.sortDir =
        key === "name" || key === "vendor" || key === "openness" || key === "paramsTotal" ? 1 : -1;
    }
    renderTable();
    renderScoreCards();
  }

  function renderScoreCards() {
    var host = qs("#score-cards");
    if (!host) return;
    var keys = TABLE_KEYS;
    host.innerHTML = tableRows()
      .map(function (m) {
        var rows = keys
          .map(function (k) {
            var v = m.scores[k];
            return (
              '<div class="score-row"><span>' +
              benchByKey(k).label +
              "</span><b class=\"num " +
              (typeof v === "number" && v === bestOf(k) ? "best" : "") +
              '">' +
              (typeof v === "number" ? fmt(v) : "—") +
              "</b></div>"
            );
          })
          .join("");
        return (
          '<article class="score-card"><header><strong>' +
          m.name +
          "</strong><span class=\"vendor\">" +
          m.vendor +
          "</span></header>" +
          '<div class="score-row"><span>Params / context</span><b>' +
          m.paramsTotal +
          " · " +
          contextLabel(m) +
          "</b></div>" +
          '<div class="score-row"><span>Price in/out</span><b>' +
          priceLabel(m) +
          "</b></div>" +
          rows +
          "</article>"
        );
      })
      .join("");
  }

  function renderUseCases() {
    var host = qs("#usecase-grid");
    if (!host) return;
    host.innerHTML = USE_CASES.map(function (u) {
      var pick, alt, i;
      for (i = 0; i < MODELS.length; i++) {
        if (MODELS[i].id === u.pick) pick = MODELS[i];
        if (MODELS[i].id === u.alt) alt = MODELS[i];
      }
      return (
        '<article class="usecase"><h3>' +
        u.title +
        '</h3><div class="picks"><span class="pill" style="border-color:' +
        pick.color +
        '">Best: ' +
        pick.short +
        '</span><span class="pill alt">Alt: ' +
        alt.short +
        "</span></div><p>" +
        u.why +
        "</p></article>"
      );
    }).join("");
  }

  function renderSpecNav() {
    var host = qs("#spec-nav");
    if (!host) return;
    host.innerHTML = MODELS.map(function (m) {
      return (
        '<button type="button" data-id="' +
        m.id +
        '" class="' +
        (m.id === state.specId ? "on" : "") +
        '" role="tab" aria-selected="' +
        (m.id === state.specId ? "true" : "false") +
        '">' +
        m.short +
        "</button>"
      );
    }).join("");
    qsa("button", host).forEach(function (btn) {
      on(btn, "click", function () {
        state.specId = btn.getAttribute("data-id");
        renderSpecNav();
        renderSpec();
      });
    });
  }

  function renderSpec() {
    var m = null;
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === state.specId) m = MODELS[i];
    var host = qs("#spec-body");
    if (!m || !host) return;
    host.innerHTML =
      '<div class="spec-kicker">' +
      m.tag +
      " · " +
      m.released +
      "</div><h3>" +
      m.name +
      '</h3><p style="color:var(--muted);max-width:70ch">' +
      m.architectureNotes.join(" ") +
      '</p><div class="spec-grid">' +
      '<div class="spec-item"><small>Developer</small><b>' +
      m.vendor +
      "</b></div>" +
      '<div class="spec-item"><small>Architecture</small><b>' +
      m.architecture +
      "</b></div>" +
      '<div class="spec-item"><small>Total / active params</small><b>' +
      m.paramsTotal +
      " / " +
      m.paramsActive +
      "</b></div>" +
      '<div class="spec-item"><small>Layers / experts</small><b>' +
      m.layers +
      " · " +
      m.experts +
      "</b></div>" +
      '<div class="spec-item"><small>Context / max out</small><b>' +
      m.context +
      " / " +
      m.maxOut +
      "</b></div>" +
      '<div class="spec-item"><small>Modalities</small><b>' +
      m.modalities +
      "</b></div>" +
      '<div class="spec-item"><small>Reasoning</small><b>' +
      m.reasoning +
      "</b></div>" +
      '<div class="spec-item"><small>Knowledge cutoff</small><b>' +
      m.knowledge +
      "</b></div>" +
      '<div class="spec-item"><small>Licence</small><b>' +
      m.license +
      "</b></div>" +
      '<div class="spec-item"><small>API ID</small><b class="num">' +
      m.apiId +
      "</b></div>" +
      '<div class="spec-item"><small>Pricing / 1M tok</small><b>' +
      priceLabel(m) +
      (m.priceCache != null ? " · cache $" + fmt(m.priceCache, 2) : "") +
      "</b></div>" +
      '<div class="spec-item"><small>Serving note</small><b>' +
      m.speedNote +
      "</b></div></div>" +
      '<p style="color:var(--muted);font-size:14px"><b>Where to run it.</b> ' +
      m.host +
      "<br><b>Hardware floor.</b> " +
      m.hardware +
      '</p><div class="spec-cols"><div><h4>Strengths</h4><ul>' +
      m.strengths.map(function (x) { return "<li>" + x + "</li>"; }).join("") +
      "</ul></div><div><h4>Limits</h4><ul>" +
      m.limits.map(function (x) { return "<li>" + x + "</li>"; }).join("") +
      "</ul></div></div>";
  }

  function renderPricing() {
    var host = qs("#price-list");
    if (!host) return;
    var maxOut = 0.01;
    for (var i = 0; i < MODELS.length; i++) {
      if (MODELS[i].priceOut > maxOut) maxOut = MODELS[i].priceOut;
    }
    host.innerHTML = MODELS.map(function (m) {
      var hasPrice = m.priceIn != null && m.priceOut != null;
      var inW = !hasPrice ? 0 : m.priceIn === 0 ? 2 : (m.priceIn / 12.5) * 100;
      var outW = !hasPrice ? 0 : m.priceOut === 0 ? 2 : (m.priceOut / maxOut) * 100;
      return (
        '<article class="price-card"><header><strong>' +
        m.name +
        '</strong><span class="num">' +
        priceLabel(m) +
        '</span></header><div class="bars" style="margin-top:12px">' +
        '<div class="bar-row"><span><span>Input</span><span>' +
        (hasPrice ? "$" + fmt(m.priceIn, 2) : "—") +
        '</span></span><div class="track"><div class="fill" style="width:' +
        inW +
        "%;background:" +
        m.color +
        '"></div></div></div>' +
        '<div class="bar-row"><span><span>Output</span><span>' +
        (hasPrice ? "$" + fmt(m.priceOut, 2) : "—") +
        '</span></span><div class="track"><div class="fill" style="width:' +
        outW +
        "%;background:" +
        m.color +
        '"></div></div></div></div></article>'
      );
    }).join("");
  }

  function renderSources() {
    var host = qs("#sources");
    if (!host) return;
    host.innerHTML = SOURCES.map(function (s) {
      return '<a href="' + s.href + '" target="_blank" rel="noopener noreferrer">' + s.label + "</a>";
    }).join("");
  }

  function initFilters() {
    qsa(".chip").forEach(function (chip) {
      on(chip, "click", function () {
        qsa(".chip").forEach(function (c) {
          c.className = c.className.replace(/\bon\b/g, "").replace(/\s+/g, " ").trim();
        });
        chip.className = (chip.className + " on").replace(/\s+/g, " ").trim();
        state.filter = chip.getAttribute("data-filter");
        renderCards();
      });
    });
  }

  function initBarSelect() {
    var select = qs("#bar-select");
    if (!select) return;
    select.innerHTML = BENCHMARKS.filter(function (b) {
      return MODELS.some(function (m) {
        return typeof m.scores[b.key] === "number";
      });
    })
      .map(function (b) {
        return '<option value="' + b.key + '">' + b.label + "</option>";
      })
      .join("");
    select.value = "tb21";
    on(select, "change", function () {
      state.barKey = select.value;
      drawBars();
    });
  }

  function initNav() {
    var btn = qs("#menu-btn");
    var links = qs("#nav-links");
    var scrim = qs("#nav-scrim");
    on(btn, "click", function () {
      if (links && links.className.indexOf("open") !== -1) closeMenu();
      else openMenu();
    });
    qsa("#nav-links a").forEach(function (a) {
      on(a, "click", closeMenu);
    });
    on(scrim, "click", closeMenu);
    on(qs("#modal"), "click", function (e) {
      if (e.target && e.target.id === "modal") closeModal();
    });
    on(document, "keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        closeModal();
        closeMenu();
      }
    });
    on(window, "resize", function () {
      if (window.innerWidth > 1024) closeMenu();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (radarChart) radarChart.resize();
        if (barChart) barChart.resize();
      }, 150);
    });
    on(window, "orientationchange", function () {
      setTimeout(function () {
        if (radarChart) radarChart.resize();
        if (barChart) barChart.resize();
      }, 250);
    });
  }

  function init() {
    if (typeof MODELS === "undefined") return;
    var year = qs("#year");
    if (year) year.textContent = "2026";
    renderMethod();
    renderCards();
    renderBenchGuide();
    renderToggles();
    initBarSelect();
    renderTable();
    renderScoreCards();
    renderFindings();
    renderUseCases();
    renderSpecNav();
    renderSpec();
    renderPricing();
    renderSources();
    initFilters();
    initNav();
    initTheme();
    ensureCharts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})();
