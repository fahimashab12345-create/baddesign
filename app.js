/* ============================================================
   app.js — BAD DESIGN storefront.

   Catalogue data, cart, filtering, search, menus, countdown,
   size guide, toasts, cursor. No dependencies, no build step.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     1 · CATALOGUE
     ============================================================ */

  var FREE_SHIP = 250;

  var PRODUCTS = [
    {
      id: "bd-001", name: "Gravity Oversized Hoodie", cat: "tops", flat: "hoodie",
      price: 340, badge: "New", colorways: 3,
      color: "Bone / Onyx / Ash",
      fabric: "480 GSM loopback cotton, garment-dyed and enzyme-washed",
      origin: "Woven and knitted in Porto, Portugal",
      blurb: "Drop-shoulder box cut with a double-layer hood that holds its shape after the first wash.",
      specs: [["Weight", "480 GSM"], ["Cut", "Oversized / drop shoulder"], ["Hood", "Double-layer, tonal"], ["Care", "Cold wash, hang dry"]]
    },
    {
      id: "bd-002", name: "Monolith Cargo Trouser", cat: "bottoms", flat: "cargo",
      price: 290, badge: "Core", colorways: 2,
      color: "Onyx / Slate",
      fabric: "Bonded technical nylon, DWR finish, 40D ripstop",
      origin: "Woven in Taipei, constructed in Portugal",
      blurb: "Wide articulated leg, eight pockets, and a hem drawcord that cinches the silhouette at the ankle.",
      specs: [["Fabric", "40D bonded nylon"], ["Pockets", "8, two bellowed thigh"], ["Hem", "Elastic + drawcord"], ["Care", "Cold wash, do not iron"]]
    },
    {
      id: "bd-003", name: "Obsidian Track Jacket", cat: "outerwear", flat: "track",
      price: 420, badge: "Limited", colorways: 2,
      color: "Onyx / Chalk",
      fabric: "Bonded polyester shell, matte face, taped seams",
      origin: "Assembled in Portugal",
      blurb: "Fully bonded so no stitch breaks the face. Storm-tight placket, ribbed collar engineered to stand.",
      specs: [["Shell", "100% bonded polyester"], ["Seams", "Fully taped"], ["Zip", "YKK AquaGuard"], ["Care", "Cold wash, hang dry"]]
    },
    {
      id: "bd-004", name: "Null Boxy Tee", cat: "tops", flat: "tee",
      price: 120, badge: "Core", colorways: 4,
      color: "Onyx / Bone / Chalk / Slate",
      fabric: "260 GSM heavyweight jersey, long-staple cotton",
      origin: "Knitted in Portugal",
      blurb: "The weight is the point. Stands on its own, softens with every wash, ribbed collar that will not roll.",
      specs: [["Weight", "260 GSM"], ["Fit", "Boxy, wide body"], ["Collar", "2×2 ribbed, taped"], ["Care", "Cold wash, inside out"]]
    },
    {
      id: "bd-005", name: "Abyss Knit Crew", cat: "tops", flat: "knit",
      price: 380, badge: "New", colorways: 2,
      color: "Onyx / Bone",
      fabric: "Extra-fine merino 60% / recycled nylon 40%, 12gg",
      origin: "Spun and knitted in Italy",
      blurb: "Twelve-gauge knit in a merino-nylon blend that keeps its structure while staying genuinely wearable.",
      specs: [["Gauge", "12gg"], ["Blend", "60% merino / 40% nylon"], ["Fit", "Relaxed, dropped shoulder"], ["Care", "Hand wash cold, dry flat"]]
    },
    {
      id: "bd-006", name: "Terminus Low", cat: "footwear", flat: "shoe",
      price: 520, badge: "Limited", colorways: 3,
      color: "Onyx / Bone / Slate",
      fabric: "Full-grain leather upper, engineered mesh cage, EVA midsole",
      origin: "Made in Italy",
      blurb: "Panelled cage over a leather chassis. Cupsole, not a wedge — the profile holds through the season.",
      specs: [["Upper", "Full-grain leather + mesh"], ["Midsole", "Compression-moulded EVA"], ["Outsole", "Vibram® rubber"], ["Made in", "Italy"]]
    }
  ];

  var SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

  var CAT_LABEL = {
    all: "Everything", tops: "Tops", bottoms: "Bottoms",
    outerwear: "Outerwear", footwear: "Footwear"
  };

  /* ============================================================
     2 · STATE + PERSISTENCE
     ============================================================ */

  var store = {
    get: function (k, fb) {
      try { var v = localStorage.getItem("bd_" + k); return v ? JSON.parse(v) : fb; }
      catch (e) { return fb; }
    },
    set: function (k, v) {
      try { localStorage.setItem("bd_" + k, JSON.stringify(v)); } catch (e) { /* private mode */ }
    }
  };

  var state = {
    cart: store.get("cart", []),
    filter: "all",
    sort: "featured",
    query: ""
  };

  function money(n) { return "$" + n.toLocaleString("en-US"); }
  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }

  function cartCount() {
    return state.cart.reduce(function (n, i) { return n + i.qty; }, 0);
  }
  function cartSubtotal() {
    return state.cart.reduce(function (n, i) {
      var p = byId(i.id); return p ? n + p.price * i.qty : n;
    }, 0);
  }
  function saveCart() {
    store.set("cart", state.cart);
    renderCartCount();
  }

  /* ============================================================
     3 · CART OPS
     ============================================================ */

  function addToCart(id, size) {
    var line = state.cart.filter(function (i) { return i.id === id && i.size === size; })[0];
    if (line) { line.qty += 1; } else { state.cart.push({ id: id, size: size, qty: 1 }); }
    saveCart();
    renderCart();
    var p = byId(id);
    toast("Added to bag", p.name + " · " + size);
    openDrawer("cart");
  }

  function setQty(idx, delta) {
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty < 1) state.cart.splice(idx, 1);
    saveCart();
    renderCart();
  }

  function removeLine(idx) {
    state.cart.splice(idx, 1);
    saveCart();
    renderCart();
  }

  /* ============================================================
     4 · PRODUCT GRID
     ============================================================ */

  /* ignoreFilter is used by search: typing a query should search the whole
     catalogue, not just whatever category happens to be selected. */
  function visibleProducts(ignoreFilter) {
    var list = PRODUCTS.slice();

    if (!ignoreFilter && state.filter !== "all") {
      list = list.filter(function (p) { return p.cat === state.filter; });
    }

    if (state.query) {
      var q = state.query.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + " " + p.fabric + " " + p.color + " " + p.cat).toLowerCase().indexOf(q) > -1;
      });
    }

    if (state.sort === "price-asc")  list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === "name")       list.sort(function (a, b) { return a.name.localeCompare(b.name); });

    return list;
  }

  function flatSVG(type) { return (window.BD_FLATS && BD_FLATS[type]) || ""; }

  function productCard(p, i) {
    var el = document.createElement("article");
    el.className = "card reveal";
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    el.setAttribute("data-cat", p.cat);

    el.innerHTML =
      '<a class="card-media" href="#product" aria-label="' + p.name + '">' +
        '<div class="media-a">' + flatSVG(p.flat) + '</div>' +
        '<div class="media-b">' + (window.BD_FLATS ? BD_FLATS.macro : "") + '</div>' +
        (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
        '<span class="peek">View piece</span>' +
      '</a>' +
      '<div class="card-body">' +
        '<div class="card-head">' +
          '<h3>' + p.name + '</h3>' +
          '<p class="price">' + money(p.price) + '</p>' +
        '</div>' +
        '<p class="card-blurb">' + p.blurb + '</p>' +
        '<dl class="card-spec">' +
          p.specs.slice(0, 2).map(function (s) {
            return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>';
          }).join("") +
        '</dl>' +
        '<div class="card-foot">' +
          '<span class="swatches">' +
            new Array(p.colorways + 1).join('<i></i>') +
          '</span>' +
          '<button class="add" data-add="' + p.id + '">Quick add</button>' +
        '</div>' +
      '</div>';

    return el;
  }

  function renderGrid() {
    var grid = document.getElementById("grid");
    if (!grid) return;

    var list = visibleProducts();
    grid.innerHTML = "";
    list.forEach(function (p, i) { grid.appendChild(productCard(p, i)); });

    var empty = document.getElementById("empty");
    if (empty) empty.hidden = list.length > 0;

    var count = document.getElementById("resultCount");
    if (count) count.textContent = list.length + (list.length === 1 ? " piece" : " pieces");
  }

  /* ============================================================
     5 · CART DRAWER
     ============================================================ */

  function renderCartCount() {
    var n = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.classList.toggle("is-live", n > 0);
    });
  }

  function renderCart() {
    var body = document.getElementById("cartBody");
    if (!body) return;

    if (!state.cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<p class="mono">BAG EMPTY</p>' +
          '<p>Nothing in the bag yet.</p>' +
          '<button class="btn" data-close="cart">Continue shopping</button>' +
        '</div>';
      document.getElementById("cartFoot").hidden = true;
      return;
    }

    var sub = cartSubtotal();
    var remaining = Math.max(0, FREE_SHIP - sub);
    var pct = Math.min(100, (sub / FREE_SHIP) * 100);

    body.innerHTML =
      '<div class="ship-bar">' +
        '<p class="mono">' +
          (remaining > 0
            ? money(remaining) + " away from free shipping"
            : "Free shipping unlocked") +
        '</p>' +
        '<div class="ship-track"><span style="width:' + pct + '%"></span></div>' +
      '</div>' +
      state.cart.map(function (i, idx) {
        var p = byId(i.id); if (!p) return "";
        return '<div class="line">' +
          '<div class="line-media">' + flatSVG(p.flat) + '</div>' +
          '<div class="line-info">' +
            '<p class="line-name">' + p.name + '</p>' +
            '<p class="mono muted">' + i.size + ' · ' + p.color.split(" / ")[0] + '</p>' +
            '<div class="qty">' +
              '<button data-dec="' + idx + '" aria-label="Decrease">−</button>' +
              '<span>' + i.qty + '</span>' +
              '<button data-inc="' + idx + '" aria-label="Increase">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="line-end">' +
            '<p class="line-price">' + money(p.price * i.qty) + '</p>' +
            '<button class="line-rm" data-rm="' + idx + '">Remove</button>' +
          '</div>' +
        '</div>';
      }).join("");

    var foot = document.getElementById("cartFoot");
    foot.hidden = false;
    foot.innerHTML =
      '<div class="totals">' +
        '<span>Subtotal</span><strong>' + money(sub) + '</strong>' +
      '</div>' +
      '<p class="mono muted">Taxes and duties calculated at checkout.</p>' +
      '<button class="btn btn-solid btn-block">Checkout</button>' +
      '<p class="demo-note">Concept storefront — demo only. No orders are taken.</p>';
  }

  /* ============================================================
     6 · SIZE SHEET
     ============================================================ */

  var pendingProduct = null;

  function openSizeSheet(id) {
    pendingProduct = id;
    var p = byId(id);
    document.getElementById("sizeTitle").textContent = p.name;
    document.getElementById("sizeFlat").innerHTML = flatSVG(p.flat);
    document.getElementById("sizeBody").innerHTML = SIZES.map(function (s) {
      return '<button class="size-btn" data-size="' + s + '">' + s + '</button>';
    }).join("");
    openDrawer("size");
  }

  /* ============================================================
     7 · OVERLAYS (drawer / modal / sheet)
     ============================================================ */

  var lastFocus = null;

  function openDrawer(which) {
    closeDrawers();
    lastFocus = document.activeElement;
    var d = document.getElementById(which);
    if (!d) return;
    d.hidden = false;
    requestAnimationFrame(function () { d.classList.add("is-open"); });
    document.body.classList.add("no-scroll");
    document.getElementById("scrim").classList.add("is-on");
  }

  function closeDrawers() {
    document.querySelectorAll(".drawer, .sheet").forEach(function (d) {
      d.classList.remove("is-open");
      var el = d;
      setTimeout(function () { el.hidden = true; }, 320);
    });
    document.body.classList.remove("no-scroll");
    document.getElementById("scrim").classList.remove("is-on");
  }

  /* ============================================================
     8 · TOASTS
     ============================================================ */

  function toast(label, detail) {
    var host = document.getElementById("toasts");
    if (!host) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<p class="mono">' + label + '</p>' + (detail ? '<p class="muted">' + detail + '</p>' : "");
    host.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("in"); });
    setTimeout(function () {
      t.classList.remove("in");
      setTimeout(function () { t.remove(); }, 400);
    }, 2600);
  }

  /* ============================================================
     9 · SEARCH
     ============================================================ */

  function renderSearch() {
    var host = document.getElementById("searchResults");
    if (!host) return;

    var list = visibleProducts(true);
    host.innerHTML = list.length
      ? list.map(function (p) {
          return '<button class="s-result" data-goto="' + p.id + '">' +
            '<span class="s-thumb">' + flatSVG(p.flat) + '</span>' +
            '<span class="s-name">' + p.name + '</span>' +
            '<span class="s-price">' + money(p.price) + '</span>' +
          '</button>';
        }).join("")
      : '<p class="mono muted">NO MATCHES</p>';

    document.getElementById("searchCount").textContent =
      list.length + (list.length === 1 ? " result" : " results");
  }

  /* ============================================================
     10 · COUNTDOWN
     ============================================================ */

  function initCountdown() {
    var host = document.getElementById("countdown");
    if (!host) return;

    // Rolling drop: set 7 days out on first visit, then reused.
    var target = store.get("drop", null);
    if (!target) {
      target = Date.now() + 7 * 864e5;
      store.set("drop", target);
    }

    function tick() {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 864e5);
      var h = Math.floor(diff / 36e5) % 24;
      var m = Math.floor(diff / 6e4) % 60;
      var s = Math.floor(diff / 1e3) % 60;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      host.innerHTML =
        '<div><b>' + d + '</b><span>Days</span></div>' +
        '<div><b>' + pad(h) + '</b><span>Hours</span></div>' +
        '<div><b>' + pad(m) + '</b><span>Min</span></div>' +
        '<div><b>' + pad(s) + '</b><span>Sec</span></div>';
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     11 · HEADER, MENU, CURSOR, REVEALS
     ============================================================ */

  function initHeader() {
    var bar = document.getElementById("header");
    var last = 0;
    var onScroll = function () {
      var y = window.scrollY;
      bar.classList.toggle("is-stuck", y > 40);
      bar.classList.toggle("is-hidden", y > 400 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initMega() {
    var trigger = document.querySelector("[data-mega]");
    if (!trigger) return;
    var wrap = trigger.closest(".has-mega");
    var panel = wrap.querySelector(".mega");

    function open() { panel.classList.add("is-open"); }
    function close() { panel.classList.remove("is-open"); }

    trigger.addEventListener("pointerenter", open);
    wrap.addEventListener("pointerenter", open);
    wrap.addEventListener("pointerleave", close);
    trigger.addEventListener("focus", open);
    panel.addEventListener("focusin", open);
    panel.addEventListener("focusout", function (e) {
      if (!wrap.contains(e.relatedTarget)) close();
    });
  }

  function initCursor() {
    if (!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches)) return;
    var cur = document.getElementById("cursor");
    if (!cur) return;

    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, live = false;

    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!live) { live = true; requestAnimationFrame(follow); }
      cur.classList.add("on");
    }, { passive: true });

    document.addEventListener("pointerleave", function () { cur.classList.remove("on"); });

    document.addEventListener("pointerover", function (e) {
      var hot = e.target.closest && e.target.closest("a, button, .card, .tile, .size-btn, [role='button']");
      cur.classList.toggle("hot", !!hot);
    });

    function follow() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      if (Math.abs(x - cx) > 0.4 || Math.abs(y - cy) > 0.4) requestAnimationFrame(follow);
      else live = false;
    }
  }

  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ============================================================
     12 · EVENTS
     ============================================================ */

  function initEvents() {

    // Product grid: quick add
    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) { openSizeSheet(add.getAttribute("data-add")); return; }

      var size = e.target.closest("[data-size]");
      if (size && pendingProduct) {
        // Close the sheet FIRST, then add — otherwise closeDrawers()
        // would shut the cart drawer that addToCart() just opened.
        var pid = pendingProduct;
        var sz = size.getAttribute("data-size");
        pendingProduct = null;
        closeDrawers();
        addToCart(pid, sz);
        return;
      }

      var inc = e.target.closest("[data-inc]");
      if (inc) { setQty(+inc.getAttribute("data-inc"), 1); return; }

      var dec = e.target.closest("[data-dec]");
      if (dec) { setQty(+dec.getAttribute("data-dec"), -1); return; }

      var rm = e.target.closest("[data-rm]");
      if (rm) { removeLine(+rm.getAttribute("data-rm")); return; }

      var open = e.target.closest("[data-open]");
      if (open) { openDrawer(open.getAttribute("data-open")); return; }

      var close = e.target.closest("[data-close]");
      if (close) { closeDrawers(); return; }

      var goto = e.target.closest("[data-goto]");
      if (goto) {
        closeDrawers();
        document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
        return;
      }

      if (e.target.id === "scrim") { closeDrawers(); return; }

      if (!e.target.closest(".drawer, .sheet, #scrim, .mega")) {
        var mega = document.querySelector(".mega.is-open");
        if (mega) mega.classList.remove("is-open");
      }
    });

    // Filters
    document.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-filter]");
      if (!chip) return;
      state.filter = chip.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (c) {
        c.classList.toggle("is-on", c === chip);
      });
      renderGrid();
      renderSearch();
    });

    // Sort
    var sort = document.getElementById("sort");
    if (sort) {
      sort.addEventListener("change", function () { state.sort = sort.value; renderGrid(); });
    }

    // Search
    var input = document.getElementById("searchInput");
    if (input) {
      input.addEventListener("input", function () {
        state.query = input.value.trim();
        renderSearch();
        renderGrid();
      });
    }

    // Escape closes whatever is open
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeDrawers();
        var mega = document.querySelector(".mega.is-open");
        if (mega) mega.classList.remove("is-open");
      }
    });

    // Newsletter — demo only, so it just confirms locally
    var news = document.getElementById("newsletter");
    if (news) {
      news.addEventListener("submit", function (e) {
        e.preventDefault();
        toast("Subscribed", "Drop alerts are on for this demo.");
        news.reset();
      });
    }
  }

  /* ============================================================
     13 · BOOT
     ============================================================ */

  function boot() {
    document.getElementById("year").textContent = new Date().getFullYear();

    // Render the macro textures into editorial tiles
    document.querySelectorAll("[data-macro]").forEach(function (el, i) {
      var v = window.BD_FLATS ? BD_FLATS.macro : "";
      var clone = v.replace(/id="bd-/g, 'id="bd' + i + '-');
      el.innerHTML = clone;
    });

    renderGrid();
    renderCart();
    renderCartCount();
    renderSearch();
    initCountdown();
    initHeader();
    initMega();
    initCursor();
    initReveals();
    initEvents();

    // Filter chips are built from the catalogue so they never drift
    var chips = document.getElementById("filters");
    if (chips) {
      chips.innerHTML = Object.keys(CAT_LABEL).map(function (k) {
        return '<button class="chip' + (k === "all" ? " is-on" : "") + '" data-filter="' + k + '">' +
               CAT_LABEL[k] + '</button>';
      }).join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
