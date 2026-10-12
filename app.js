/* ============================================================
   app.js — BAD DESIGN storefront.

   Catalogue, cart, filtering, search, product view, checkout,
   menus, countdown, toasts. No dependencies, no build step.

   Images live in img/. Anything without a photograph falls back
   to the SVG technical flat in garments.js.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     1 · CATALOGUE
     ============================================================ */

  var FREE_SHIP = 250;
  var TAX_RATE = 0.20;

  var CATS = {
    bags: "Bags", tops: "Tops", bottoms: "Bottoms",
    outerwear: "Outerwear", footwear: "Footwear"
  };

  var CAT_LABEL = {
    all: "Everything", bags: "Bags", tops: "Tops", bottoms: "Bottoms",
    outerwear: "Outerwear", footwear: "Footwear"
  };

  /* ============================================================
     INFO SHEETS
     Copy for every footer and menu topic. Written to be true of
     this thing rather than merely plausible: it is a demo, it
     sells nothing, and it stores nothing. Inventing a plausible
     returns policy for a fictional company is the same error as
     inventing a stockist list.
     ============================================================ */

  var INFO = {
    shipping: {
      title: "Shipping",
      body: [
        "Nothing here ships. This is a concept storefront built to show a design, not to take orders.",
        "There is no basket server, no payment processor and no fulfilment step anywhere behind the checkout. Entering a card number completes a scripted flow entirely in your browser and sends nothing anywhere.",
        "The checkout exists so the interaction could be judged as an interaction — validation, review, confirmation — not so a garment could be bought."
      ]
    },
    returns: {
      title: "Returns",
      body: [
        "There is nothing to return. No order is ever placed and no payment is ever taken.",
        "If this were a real label the policy would be the boring one: thirty days unworn and unwashed, return postage covered, refund issued to the original method within five working days of the parcel being scanned."
      ]
    },
    care: {
      title: "Care",
      body: [
        "Every product carries a care line written for the piece it belongs to — cold wash, no tumble, brush the mesh, shoe trees for the boots.",
        "Those instructions describe real garments made of real cloth. They are written as a specification for a product that does not exist yet."
      ]
    },
    about: {
      title: "About",
      body: [
        "BAD DESIGN is an invented label. The name, the pieces, the prices, the drop numbers and the editorial are all constructed for this storefront.",
        "The aim was a single idea carried consistently: clothing that reads as oversized and deliberate rather than as a size you have grown into. Everything on the page is in service of that — the extended shoulder, the nipped waist, the column leg, the absence of a visible brand mark anywhere.",
        "No photographs of the label exist, because the label does not."
      ]
    },
    sustainability: {
      title: "Sustainability",
      body: [
        "No claim can honestly be made here, so none is made.",
        "Sustainability is measured against a real supply chain, and this has none: no mill, no factory, no garment was cut, and no material was consumed to produce this page.",
        "The one measurable thing that can be said: the page ships no third-party JavaScript beyond one version of three.js, which is loaded only when the turntable is actually wanted."
      ]
    },
    careers: {
      title: "Careers",
      body: [
        "There are no roles and no company. Nobody is hiring, because there is no employer.",
        "Written here so the label does not exist in a state of permanent, unexplained vacancy."
      ]
    },
    press: {
      title: "Press",
      body: [
        "No coverage exists. There has been no launch, no runway, no review and no mention.",
        "Images on this site are editorial photography from Unsplash contributors, used under the Unsplash License and captioned as such. They are not photographs of the label's clothing, and the site never claims they are."
      ]
    },
    privacy: {
      title: "Privacy",
      body: [
        "Nothing is collected. There is no analytics, no tracking pixel, no advertising network, no cookie set by this site and no server to receive one.",
        "The bag, the checkout and the newsletter field all read and write in the page's own memory. Close the tab and they are gone. No network request carries anything you typed.",
        "If you do enter a card number — you should not need to, and it is not stored or transmitted — it exists only in JavaScript variables in that tab."
      ]
    },
    terms: {
      title: "Terms",
      body: [
        "This is a design demonstration. It is not a business, it sells nothing, and no contract of any kind arises from using it.",
        "Product names, prices, materials, origins, care instructions and stockist cities are invented for the purpose of the design and describe nothing real. Where the site names a place of make or a textile specification, that is narrative writing, not a factual claim.",
        "No warranty, no service level and no liability of any kind is offered or implied."
      ]
    },
    cookies: {
      title: "Cookies",
      body: [
        "None are set. Not one, not for preferences, not for the bag, not for anything.",
        "Your bag and your checkout progress live in the page's memory and are gone when you close the tab. Reopening the page starts from an empty bag."
      ]
    }
  };

  function openInfo(topic) {
    var entry = INFO[topic];
    if (!entry) return;
    document.getElementById("infoTitle").textContent = entry.title;
    document.getElementById("infoBody").innerHTML =
      entry.body.map(function (p) { return "<p>" + p + "</p>"; }).join("");
    openDrawer("info");
  }

  var CLOTH_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  var ONE_SIZE    = ["One size"];

  var PRODUCTS = [
    /* ---------------- BAGS ---------------- */
    {
      id: "bd-101", name: "Vespers Quilted Flap", cat: "bags", price: 2850,
      img: "bag-01", alt: "Black quilted leather flap bag with a chain shoulder strap",
      badge: "Icon", colorways: 2, color: "Noir / Bone",
      sizes: ONE_SIZE,
      fabric: "Quilted lambskin, hand-finished diamond stitch, palladium hardware",
      origin: "Made in Florence",
      blurb: "The one that started the label. Diamond-quilted lambskin over a rigid frame, closed with a single flat turn-lock and carried on an interlaced chain that runs leather through every link.",
      specs: [["Body", "Quilted lambskin"], ["Hardware", "Palladium, brushed"], ["Strap", "Interlaced chain, 60cm"], ["Lining", "Suede, zipped pocket"]],
      care: "Keep in the dust bag. Do not fill. Lambskin marks — that is the material, not a fault."
    },
    {
      id: "bd-102", name: "Cinder Structured Top-Handle", cat: "bags", price: 1980,
      img: "bag-04", alt: "Structured black leather handbag with a top handle",
      badge: null, colorways: 2, color: "Noir / Oxblood",
      sizes: ONE_SIZE,
      fabric: "Box calf leather, hand-painted edges, brass hardware",
      origin: "Made in Florence",
      blurb: "Built on a wooden form so the corners stay sharp for a decade, not a season. The handle is rolled and stitched by hand; it will not sag.",
      specs: [["Body", "Box calf"], ["Frame", "Reinforced wood"], ["Handle", "Rolled, hand-stitched"], ["Hardware", "Brushed brass"]],
      care: "Wipe with a dry cloth. Store stuffed. Re-condition the leather twice a year."
    },
    {
      id: "bd-103", name: "Reliquary Chain Pouch", cat: "bags", price: 1420,
      img: "bag-03", alt: "Small black leather pouch on a fine chain",
      badge: null, colorways: 3, color: "Noir / Bone / Oxblood",
      sizes: ONE_SIZE,
      fabric: "Smooth calfskin, fine curb chain, micro-suede lining",
      origin: "Made in Milan",
      blurb: "Small enough to disappear into a coat pocket, large enough for a phone and a card. The chain runs entirely in metal — no leather, no weight.",
      specs: [["Body", "Smooth calfskin"], ["Chain", "Fine curb, all metal"], ["Capacity", "Phone, card, keys"], ["Closure", "Push-tab, concealed"]],
      care: "Chain will patina. That is intended."
    },
    {
      id: "bd-104", name: "Ossuary Crossbody Sling", cat: "bags", price: 1180,
      img: "bag-05", alt: "Black leather crossbody bag worn on the shoulder",
      badge: null, colorways: 2, color: "Noir / Slate",
      sizes: ONE_SIZE,
      fabric: "Grained leather, adjustable webbing strap, gunmetal zip",
      origin: "Made in Portugal",
      blurb: "The everyday one. Sits flat against the ribs so it reads as part of the silhouette rather than an accessory hanging off it.",
      specs: [["Body", "Grained leather"], ["Strap", "Adjustable webbing"], ["Zip", "Gunmetal, YKK"], ["Fit", "Crossbody, rib height"]],
      care: "Wipe clean. Webbing will not stretch."
    },
    {
      id: "bd-105", name: "Marrow Belt Bag", cat: "bags", price: 890,
      img: "bag-02", alt: "Black leather belt bag resting on dark fabric",
      badge: "New", colorways: 2, color: "Noir / Bone",
      sizes: ONE_SIZE,
      fabric: "Nappa leather, magnetic flap, cotton webbing belt",
      origin: "Made in Portugal",
      blurb: "Worn at the hip or the sternum, depending on how the season has gone. Magnetic flap, no zip to fight with one-handed.",
      specs: [["Body", "Nappa leather"], ["Flap", "Magnetic, silent"], ["Belt", "Cotton webbing, adjustable"], ["Capacity", "Phone, cards, keys"]],
      care: "Nappa creases. Soften with hand heat, not an iron."
    },

    /* ---------------- TOPS ---------------- */
    {
      id: "bd-201", name: "Gravity Oversized Hoodie", cat: "tops", price: 340,
      img: "hoodie", alt: "Figure in a dark hooded top photographed at night",
      badge: "New", colorways: 3, color: "Onyx / Bone / Ash",
      sizes: CLOTH_SIZES,
      fabric: "480 GSM loopback cotton, garment-dyed and enzyme-washed",
      origin: "Woven and knitted in Porto",
      blurb: "Drop-shoulder box cut with a double-layer hood that holds its shape after the first wash. Heavier than it has any right to be.",
      specs: [["Weight", "480 GSM"], ["Cut", "Oversized, drop shoulder"], ["Hood", "Double-layer, tonal"], ["Fit", "Size down for a regular fit"]],
      care: "Cold wash inside out. Hang dry. Never tumble — the loopback will not forgive it."
    },
    {
      id: "bd-202", name: "Null Boxy Tee", cat: "tops", price: 120,
      img: "tee", alt: "Figure in a plain black boxy t-shirt",
      badge: "Core", colorways: 4, color: "Onyx / Bone / Chalk / Slate",
      sizes: CLOTH_SIZES,
      fabric: "260 GSM heavyweight jersey, long-staple cotton",
      origin: "Knitted in Portugal",
      blurb: "The weight is the point. It stands on its own, softens with every wash, and the ribbed collar will not roll.",
      specs: [["Weight", "260 GSM"], ["Fit", "Boxy, wide body"], ["Collar", "2×2 ribbed, taped"], ["Shoulder", "Dropped, extended"]],
      care: "Cold wash, inside out, with like colours."
    },
    {
      id: "bd-203", name: "Abyss Knit Crew", cat: "tops", price: 380,
      img: "knit", alt: "Figure in a dark knitted crewneck photographed at dusk",
      badge: null, colorways: 2, color: "Onyx / Bone",
      sizes: CLOTH_SIZES,
      fabric: "Extra-fine merino 60% / recycled nylon 40%, 12 gauge",
      origin: "Spun and knitted in Italy",
      blurb: "Twelve-gauge knit in a merino-nylon blend that keeps its structure while staying genuinely wearable through a European winter.",
      specs: [["Gauge", "12gg"], ["Blend", "60% merino / 40% nylon"], ["Fit", "Relaxed, dropped shoulder"], ["Neck", "Ribbed, crew"]],
      care: "Hand wash cold. Dry flat. Do not hang."
    },
    {
      id: "bd-204", name: "Bloodline Rib Tank", cat: "tops", price: 95,
      img: "tank", alt: "Figure in a black tank top and leather trousers",
      badge: "New", colorways: 2, color: "Onyx / Oxblood",
      sizes: CLOTH_SIZES,
      fabric: "220 GSM compact rib, cotton-modal, high elastane content",
      origin: "Knitted in Portugal",
      blurb: "Compact rib that holds against the body without gripping. Long enough to stay tucked under everything we make.",
      specs: [["Weight", "220 GSM"], ["Rib", "2×1 compact"], ["Length", "Extended, hip-length"], ["Neck", "Bound, scoop"]],
      care: "Cold wash. It will survive being worn to destruction."
    },
    {
      id: "bd-205", name: "Nocturne Sheer Long-Sleeve", cat: "tops", price: 180,
      img: "sheer", alt: "Figure in a sheer black mesh top",
      badge: null, colorways: 1, color: "Onyx",
      sizes: CLOTH_SIZES,
      fabric: "95% viscose modal, 5% elastane, single jersey",
      origin: "Knitted in Italy",
      blurb: "Worn alone or as the first layer under everything. Sheer enough to be a decision, opaque enough to wear in daylight.",
      specs: [["Fabric", "Modal, single jersey"], ["Sheer", "Yes, by design"], ["Fit", "Slim through the body"], ["Sleeve", "Extended, thumb-split"]],
      care: "Hand wash cold. Do not wring."
    },

    /* ---------------- BOTTOMS ---------------- */
    {
      id: "bd-301", name: "Monolith Cargo Trouser", cat: "bottoms", price: 290,
      img: "cargo", alt: "Figure in wide dark cargo trousers photographed in an archway",
      badge: "Core", colorways: 2, color: "Onyx / Slate",
      sizes: CLOTH_SIZES,
      fabric: "Bonded technical nylon, DWR finish, 40D ripstop",
      origin: "Woven in Taipei, constructed in Portugal",
      blurb: "Wide articulated leg, eight pockets, and a hem drawcord that cinches the silhouette at the ankle. The break stacks properly over a boot.",
      specs: [["Fabric", "40D bonded nylon"], ["Pockets", "8, two bellowed thigh"], ["Hem", "Elastic plus drawcord"], ["Finish", "DWR, water-repellent"]],
      care: "Cold wash. Do not iron the bonded panels."
    },
    {
      id: "bd-302", name: "Vigil Wide Wool Trouser", cat: "bottoms", price: 460,
      img: "trouser", alt: "Figure in a black top and wide trousers, seated on a studio chair",
      badge: null, colorways: 2, color: "Onyx / Charcoal",
      sizes: CLOTH_SIZES,
      fabric: "Super 120s virgin wool, 340 GSM, unfinished",
      origin: "Woven in Biella, made in Portugal",
      blurb: "A full wide leg cut from a single length so the fall is unbroken. Unfinished hem — take it to your own tailor or wear it raw.",
      specs: [["Cloth", "Super 120s wool, 340 GSM"], ["Cut", "Full wide leg"], ["Rise", "Mid-high"], ["Hem", "Unfinished, 42cm"]],
      care: "Dry clean only. Press on the reverse with a cloth."
    },
    {
      id: "bd-303", name: "Mass Heavyweight Short", cat: "bottoms", price: 110,
      img: "short", alt: "Figure in a black sleeveless top and shorts",
      badge: null, colorways: 3, color: "Onyx / Bone / Slate",
      sizes: CLOTH_SIZES,
      fabric: "420 GSM loopback cotton, double-stitched inseam",
      origin: "Knitted in Portugal",
      blurb: "Cut from the same roll as the Gravity hoodie, so the two wash the same. Falls just above the knee.",
      specs: [["Weight", "420 GSM"], ["Cut", "Straight, mid-thigh"], ["Inseam", "Double-stitched"], ["Pockets", "Side seam, 2"]],
      care: "Cold wash inside out."
    },

    /* ---------------- OUTERWEAR ---------------- */
    {
      id: "bd-401", name: "Obsidian Track Jacket", cat: "outerwear", price: 420,
      img: "jacket", alt: "Figure in all-black tailoring, shot against a pale wall",
      badge: "Limited", colorways: 2, color: "Onyx / Chalk",
      sizes: CLOTH_SIZES,
      fabric: "Bonded polyester shell, matte face, fully taped seams",
      origin: "Assembled in Portugal",
      blurb: "Fully bonded so no stitch breaks the face. Storm-tight placket, ribbed collar engineered to stand on its own.",
      specs: [["Shell", "100% bonded polyester"], ["Seams", "Fully taped"], ["Zip", "YKK AquaGuard"], ["Cuff", "Ribbed, elastane"]],
      care: "Cold wash, hang dry. Do not iron the face."
    },
    {
      id: "bd-402", name: "Penance Belted Coat", cat: "outerwear", price: 1290,
      img: "coat", alt: "Figure in a long black coat against a dark ground",
      badge: "New", colorways: 2, color: "Onyx / Oxblood",
      sizes: CLOTH_SIZES,
      fabric: "Double-faced wool-cashmere, bonded seams, horn hardware",
      origin: "Made in Italy",
      blurb: "Double-faced cloth means no lining and no visible stitch line — the coat is two fabrics bonded face to face. The belt is cut from the same panel.",
      specs: [["Cloth", "Wool-cashmere, double-faced"], ["Construction", "Bonded, unlined"], ["Hardware", "Horn"], ["Length", "Below the knee"]],
      care: "Dry clean only. Brush after wear."
    },

    /* ---------------- FOOTWEAR ---------------- */
    {
      id: "bd-501", name: "Terminus Low", cat: "footwear", price: 520,
      img: "shoe", alt: "Dark low-top sneaker against a shadowed ground",
      badge: "Limited", colorways: 3, color: "Onyx / Bone / Slate",
      sizes: ["39", "40", "41", "42", "43", "44", "45"],
      fabric: "Full-grain leather upper, engineered mesh cage, EVA midsole",
      origin: "Made in Italy",
      blurb: "A panelled cage over a leather chassis on a cupsole — not a wedge. The profile holds through the whole season instead of collapsing in week six.",
      specs: [["Upper", "Full-grain leather plus mesh"], ["Midsole", "Compression-moulded EVA"], ["Outsole", "Moulded rubber, 6mm lug"], ["Last", "Terminus, wide toe box"]],
      care: "Brush the mesh. Use shoe trees. Never a washing machine."
    }
  ];

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

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function byId(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0];
  }
  function cartCount() {
    return state.cart.reduce(function (n, i) { return n + i.qty; }, 0);
  }
  function cartSubtotal() {
    return state.cart.reduce(function (n, i) {
      var p = byId(i.id); return p ? n + p.price * i.qty : n;
    }, 0);
  }
  function saveCart() { store.set("cart", state.cart); renderCartCount(); }

  function productImage(p, cls) {
    var base = "img/product/" + p.img + ".jpg";
    return '<img class="' + (cls || "") + '" src="' + base + '" alt="' + p.alt + '" ' +
           'loading="lazy" decoding="async" ' +
           'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">' +
           '<span class="img-fallback" style="display:none">' + flatSVG(p.flat || "tee") + '</span>';
  }

  function flatSVG(type) { return (window.BD_FLATS && BD_FLATS[type]) || ""; }

  /* ============================================================
     3 · CART OPS
     ============================================================ */

  function addToCart(id, size, qty) {
    qty = qty || 1;
    var line = state.cart.filter(function (i) { return i.id === id && i.size === size; })[0];
    if (line) { line.qty += qty; } else { state.cart.push({ id: id, size: size, qty: qty }); }
    saveCart();
    renderCart();
    var p = byId(id);
    toast("Added to bag", p.name + " · " + size);
  }

  function setQty(idx, delta) {
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty < 1) state.cart.splice(idx, 1);
    saveCart();
    renderCart();
    if (checkoutOpen) renderCheckout();
  }

  function removeLine(idx) {
    state.cart.splice(idx, 1);
    saveCart();
    renderCart();
    if (checkoutOpen) renderCheckout();
  }

  /* ============================================================
     4 · GRID
     ============================================================ */

  function visibleProducts(ignoreFilter) {
    var list = PRODUCTS.slice();
    if (!ignoreFilter && state.filter !== "all") {
      list = list.filter(function (p) { return p.cat === state.filter; });
    }
    if (state.query) {
      var q = state.query.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + " " + p.fabric + " " + p.color + " " + p.cat + " " + p.blurb).toLowerCase().indexOf(q) > -1;
      });
    }
    if (state.sort === "price-asc")  list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === "name")       list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return list;
  }

  function productCard(p, i) {
    var el = document.createElement("article");
    el.className = "card reveal";
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    el.setAttribute("data-cat", p.cat);
    el.innerHTML =
      '<div class="card-media" data-open-product="' + p.id + '">' +
        productImage(p, "card-img") +
        (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
        '<span class="peek">View piece</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-head">' +
          '<h3>' + p.name + '</h3>' +
          '<p class="price">' + money(p.price) + '</p>' +
        '</div>' +
        '<p class="card-blurb">' + p.blurb.slice(0, 96) + '…</p>' +
        '<p class="card-cat mono">' + (CATS[p.cat] || p.cat) + '</p>' +
        '<div class="card-foot">' +
          '<span class="swatches">' + new Array(p.colorways + 1).join('<i></i>') + '</span>' +
          '<button class="add" data-add="' + p.id + '">Add</button>' +
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
          '<button class="btn" data-close>Continue shopping</button>' +
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
          (remaining > 0 ? money(remaining) + " away from complimentary shipping"
                         : "Complimentary shipping unlocked") +
        '</p>' +
        '<div class="ship-track"><span style="width:' + pct + '%"></span></div>' +
      '</div>' +
      state.cart.map(function (i, idx) {
        var p = byId(i.id); if (!p) return "";
        return '<div class="line">' +
          '<div class="line-media">' + productImage(p, "line-img") + '</div>' +
          '<div class="line-info">' +
            '<p class="line-name">' + p.name + '</p>' +
            '<p class="mono muted">' + i.size + ' · ' + p.color.split(" / ")[0] + '</p>' +
            '<div class="qty">' +
              '<button data-dec="' + idx + '" aria-label="Decrease quantity">−</button>' +
              '<span>' + i.qty + '</span>' +
              '<button data-inc="' + idx + '" aria-label="Increase quantity">+</button>' +
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
      '<div class="totals"><span>Subtotal</span><strong>' + money(sub) + '</strong></div>' +
      '<p class="mono muted">Taxes and duties calculated at checkout.</p>' +
      '<button class="btn btn-solid btn-block" data-open-checkout>Checkout</button>' +
      '<p class="demo-note">Concept storefront — demo only. No orders are taken and no payment is processed.</p>';
  }

  /* ============================================================
     6 · PRODUCT VIEW
     ============================================================ */

  var pendingProduct = null;

  function openProduct(id) {
    var p = byId(id);
    if (!p) return;

    document.getElementById("pvName").textContent = p.name;
    document.getElementById("pvPrice").textContent = money(p.price);
    document.getElementById("pvMedia").innerHTML = productImage(p, "pv-img");
    document.getElementById("pvBadge").textContent = p.badge || "";
    document.getElementById("pvBadge").hidden = !p.badge;
    document.getElementById("pvBlurb").textContent = p.blurb;
    document.getElementById("pvFabric").textContent = p.fabric;
    document.getElementById("pvOrigin").textContent = p.origin;
    document.getElementById("pvCare").textContent = p.care;
    document.getElementById("pvColor").textContent = p.color;
    document.getElementById("pvSpecs").innerHTML = p.specs.map(function (s) {
      return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>';
    }).join("");
    document.getElementById("pvSizes").innerHTML = p.sizes.map(function (s) {
      return '<button class="size-btn" data-pv-size="' + s + '">' + s + '</button>';
    }).join("");
    document.getElementById("pvCat").textContent = CATS[p.cat] || p.cat;

    pendingProduct = id;
    openDrawer("product");
    location.hash = "product/" + id;
  }

  /* ============================================================
     7 · SIZE SHEET
     ============================================================ */

  function openSizeSheet(id) {
    pendingProduct = id;
    var p = byId(id);
    document.getElementById("sizeTitle").textContent = p.name;
    document.getElementById("sizeFlat").innerHTML = productImage(p, "size-img");
    document.getElementById("sizeBody").innerHTML = p.sizes.map(function (s) {
      return '<button class="size-btn" data-size="' + s + '">' + s + '</button>';
    }).join("");
    openDrawer("size");
  }

  /* ============================================================
     8 · OVERLAYS
     ============================================================ */

  /* Each overlay carries a pending "now hide me" timer so a close can
     animate out. The bug this replaces: openDrawer called closeDrawers,
     which armed that timer on every overlay including the one about to be
     opened. 340ms later the timer fired and hid the drawer that had just
     opened, so every overlay in the site shut itself shortly after it
     appeared. Tracking the timer per element lets an open cancel its own
     pending hide, and lets a close cancel a stale one. */
  var hideTimers = new WeakMap();

  function scheduleHide(el) {
    clearTimeout(hideTimers.get(el));
    hideTimers.set(el, setTimeout(function () {
      el.hidden = true;
      hideTimers.delete(el);
    }, 340));
  }

  function cancelHide(el) {
    clearTimeout(hideTimers.get(el));
    hideTimers.delete(el);
  }

  function openDrawer(which) {
    var d = document.getElementById(which);
    if (!d) return;
    closeDrawers(true, d);
    cancelHide(d);
    d.hidden = false;
    requestAnimationFrame(function () { d.classList.add("is-open"); });
    document.body.classList.add("no-scroll");
    document.getElementById("scrim").classList.add("is-on");
  }

  function closeDrawers(keepHash, except) {
    document.querySelectorAll(".drawer, .sheet").forEach(function (d) {
      d.classList.remove("is-open");
      if (except && d === except) return;
      scheduleHide(d);
    });
    document.body.classList.remove("no-scroll");
    var sc = document.getElementById("scrim");
    if (sc) sc.classList.remove("is-on");
    if (!keepHash && location.hash.indexOf("product/") === 0) {
      history.replaceState(null, "", location.pathname);
    }
  }

  /* ============================================================
     9 · TOASTS
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
    }, 2800);
  }

  /* ============================================================
     10 · SEARCH
     ============================================================ */

  function renderSearch() {
    var host = document.getElementById("searchResults");
    if (!host) return;
    var list = visibleProducts(true);
    host.innerHTML = list.length
      ? list.slice(0, 10).map(function (p) {
          return '<button class="s-result" data-open-product="' + p.id + '">' +
            '<span class="s-thumb">' + productImage(p, "s-img") + '</span>' +
            '<span class="s-name">' + p.name + '</span>' +
            '<span class="s-price">' + money(p.price) + '</span>' +
          '</button>';
        }).join("")
      : '<p class="mono muted">NO MATCHES</p>';
    document.getElementById("searchCount").textContent =
      list.length + (list.length === 1 ? " result" : " results");
  }

  /* ============================================================
     11 · COUNTDOWN
     ============================================================ */

  function initCountdown() {
    var host = document.getElementById("countdown");
    if (!host) return;
    var target = store.get("drop", null);
    if (!target) { target = Date.now() + 7 * 864e5; store.set("drop", target); }
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
     12 · CHECKOUT
     ============================================================ */

  var checkoutOpen = false;
  var co = {
    step: 1,
    ship: { name: "", email: "", phone: "", addr: "", city: "", zip: "", country: "" },
    shipMethod: "standard",
    pay: { name: "", card: "", exp: "", cvc: "" }
  };

  var SHIP_METHODS = {
    standard: { name: "Standard", note: "4–6 working days, tracked", price: 0 },
    express:  { name: "Express",  note: "2 working days, tracked",    price: 35 },
    courier:  { name: "Overnight",note: "Next working day, signed",   price: 90 }
  };

  var COUNTRY_L = {
    "United Kingdom": "GB", "United States": "US", "Germany": "DE",
    "France": "FR", "Netherlands": "NL", "Italy": "IT", "Japan": "JP",
    "Canada": "CA", "Australia": "AU", "Sweden": "SE", "United Arab Emirates": "AE"
  };

  function shipCost() {
    var sub = cartSubtotal();
    var base = sub >= FREE_SHIP ? 0 : 20;
    // Guarded: shipCost runs during render, so a co.shipMethod that is not
    // a key of SHIP_METHODS throws inside a draw rather than being ignored.
    var m = SHIP_METHODS[co.shipMethod] || SHIP_METHODS.standard;
    return base + m.price;
  }

  function orderTotals() {
    var sub = cartSubtotal();
    var ship = shipCost();
    var tax = sub * TAX_RATE;
    return { sub: sub, ship: ship, tax: tax, total: sub + ship + tax };
  }

  function renderCheckout() {
    var body = document.getElementById("coBody");
    if (!body) return;
    var t = orderTotals();

    var steps = ["Bag", "Shipping", "Payment", "Review"];
    document.getElementById("coSteps").innerHTML = steps.map(function (s, i) {
      var n = i + 1;
      var cls = "co-step" + (n === co.step ? " is-on" : "") + (n < co.step ? " is-done" : "");
      return '<li class="' + cls + '"><span class="mono">' + (n < co.step ? "✓" : n) + '</span>' + s + '</li>';
    }).join("");

    var html = "";

    if (co.step === 1) {
      html = state.cart.length ? state.cart.map(function (i, idx) {
        var p = byId(i.id); if (!p) return "";
        return '<div class="line co-line">' +
          '<div class="line-media">' + productImage(p, "line-img") + '</div>' +
          '<div class="line-info"><p class="line-name">' + p.name + '</p>' +
          '<p class="mono muted">' + i.size + '</p></div>' +
          '<div class="qty"><button data-dec="' + idx + '" aria-label="Decrease">−</button>' +
          '<span>' + i.qty + '</span>' +
          '<button data-inc="' + idx + '" aria-label="Increase">+</button></div>' +
          '<p class="line-price">' + money(p.price * i.qty) + '</p>' +
        '</div>';
      }).join("") : '<p class="mono muted">Your bag is empty.</p>';

    } else if (co.step === 2) {
      html =
        '<div class="co-fields">' +
          field("Email", "ship.email", co.ship.email, "email") +
          field("Full name", "ship.name", co.ship.name, "text") +
          field("Phone", "ship.phone", co.ship.phone, "tel") +
          field("Address", "ship.addr", co.ship.addr, "text") +
          '<div class="co-row">' + field("City", "ship.city", co.ship.city, "text") +
          field("Postcode", "ship.zip", co.ship.zip, "text") + '</div>' +
          '<label class="co-field"><span class="mono">Country</span>' +
            '<select data-co="ship.country">' + Object.keys(COUNTRY_L).map(function (c) {
              return '<option' + (co.ship.country === c ? " selected" : "") + '>' + c + '</option>';
            }).join("") + '</select></label>' +
        '</div>' +
        '<p class="mono kicker" style="margin-top:2rem">Delivery</p>' +
        '<div class="co-methods">' + Object.keys(SHIP_METHODS).map(function (k) {
          var m = SHIP_METHODS[k];
          return '<label class="co-method' + (co.shipMethod === k ? " is-on" : "") + '">' +
            '<input type="radio" name="shipm" value="' + k + '"' + (co.shipMethod === k ? " checked" : "") + ' />' +
            '<span><strong>' + m.name + '</strong><em>' + m.note + '</em></span>' +
            '<b>' + (m.price ? money(m.price) : "Free") + '</b>' +
          '</label>';
        }).join("") + '</div>';

    } else if (co.step === 3) {
      html =
        '<p class="co-warn mono">Demo checkout — do not enter real card details. Nothing is transmitted or stored.</p>' +
        '<div class="co-fields">' +
          field("Name on card", "pay.name", co.pay.name, "text") +
          field("Card number", "pay.card", co.pay.card, "text", "4242 4242 4242 4242") +
          '<div class="co-row">' + field("Expiry", "pay.exp", co.pay.exp, "text", "MM / YY") +
          field("CVC", "pay.cvc", co.pay.cvc, "text", "123") + '</div>' +
        '</div>';

    } else if (co.step === 4) {
      html =
        '<div class="co-review">' +
          '<div class="co-block"><p class="mono">Ship to</p>' +
            '<p>' + (co.ship.name || "—") + '<br />' + (co.ship.addr || "—") + '<br />' +
            (co.ship.city || "—") + " " + (co.ship.zip || "") + "<br />" +
            (co.ship.country || "—") + "</p>" +
            '<button class="link-btn mono" data-co-goto="2">Edit</button></div>' +
          '<div class="co-block"><p class="mono">Delivery</p>' +
            (function () {
              var m = SHIP_METHODS[co.shipMethod] || SHIP_METHODS.standard;
              return '<p>' + m.name + ' — ' + m.note + '</p>';
            })() +
            '<button class="link-btn mono" data-co-goto="2">Edit</button></div>' +
          '<div class="co-block"><p class="mono">Payment</p>' +
            '<p>' + (co.pay.name || "—") + '<br />Card ending ' +
            (co.pay.card ? co.pay.card.replace(/\s/g, "").slice(-4) : "••••") + '</p>' +
            '<button class="link-btn mono" data-co-goto="3">Edit</button></div>' +
        '</div>';
    }

    body.innerHTML = html;

    document.getElementById("coSummary").innerHTML = summaryMarkup(t);
    document.getElementById("coBack").hidden = co.step === 1;
    document.getElementById("coNext").textContent = co.step === 4 ? "Place order" : "Continue";
  }

  function field(label, key, val, type, ph) {
    return '<label class="co-field"><span class="mono">' + label + '</span>' +
      '<input type="' + (type || "text") + '" data-co="' + key + '" value="' +
      String(val || "").replace(/"/g, "&quot;") + '" placeholder="' + (ph || "") + '" /></label>';
  }

  function summaryMarkup(t) {
    return state.cart.map(function (i) {
      var p = byId(i.id); if (!p) return "";
      return '<div class="co-sum-line"><span>' + p.name + ' · ' + i.size + ' ×' + i.qty + '</span>' +
             '<b>' + money(p.price * i.qty) + '</b></div>';
    }).join("") +
    '<div class="co-sum-line"><span>Subtotal</span><b>' + money(t.sub) + '</b></div>' +
    '<div class="co-sum-line"><span>Shipping</span><b>' + (t.ship ? money(t.ship) : "Free") + '</b></div>' +
    '<div class="co-sum-line"><span>Tax (20%)</span><b>' + money(t.tax) + '</b></div>' +
    '<div class="co-sum-line co-sum-total"><span>Total</span><b>' + money(t.total) + '</b></div>';
  }

  function coValidate() {
    if (co.step === 2) {
      var need = ["email", "name", "phone", "addr", "city", "zip", "country"];
      for (var i = 0; i < need.length; i++) {
        var k = need[i];
        if (!String(co.ship[k] || "").trim()) {
          toast("Missing detail", "Fill every shipping field to continue.");
          return false;
        }
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(co.ship.email)) {
        toast("Check the email", "That does not look like an email address.");
        return false;
      }
    }
    if (co.step === 3) {
      var need2 = ["name", "card", "exp", "cvc"];
      for (var j = 0; j < need2.length; j++) {
        if (!String(co.pay[need2[j]] || "").trim()) {
          toast("Missing detail", "Fill every payment field to continue.");
          return false;
        }
      }
      if (co.pay.card.replace(/\s/g, "").length < 12) {
        toast("Check the card", "Card number looks too short.");
        return false;
      }
    }
    return true;
  }

  function openCheckout() {
    if (!state.cart.length) { toast("Bag empty", "Add something before checking out."); return; }
    checkoutOpen = true;
    co.step = 1;
    renderCheckout();
    openDrawer("checkout");
    location.hash = "checkout";
  }

  function placeOrder() {
    var t = orderTotals();
    var ref = "BD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    document.getElementById("coBody").innerHTML =
      '<div class="co-done">' +
        '<p class="mono kicker">Order ' + ref + '</p>' +
        '<h3 class="h-sec">Received.</h3>' +
        '<p class="lead">Nothing was charged and no order exists — this is a concept storefront. ' +
        'Had it been real, ' + (co.ship.name || "you") + ' would get a confirmation at ' +
        (co.ship.email || "your address") + ' within a minute.</p>' +
        '<p class="mono muted" style="margin-top:2rem">Total would have been ' + money(t.total) + '</p>' +
        '<button class="btn btn-solid" data-co-close style="margin-top:2rem">Back to the shop</button>' +
      '</div>';
    document.getElementById("coSummary").innerHTML = "";
    document.getElementById("coBack").hidden = true;
    document.getElementById("coNext").hidden = true;
    state.cart = [];
    saveCart();
    renderCart();
  }

  /* ============================================================
     13 · HEADER, MENU, CURSOR, REVEALS
     ============================================================ */

  function initHeader() {
    var bar = document.getElementById("header");
    var last = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      bar.classList.toggle("is-stuck", y > 40);
      bar.classList.toggle("is-hidden", y > 400 && y > last);
      last = y;
    }, { passive: true });
  }

  function initMega() {
    var trigger = document.querySelector("[data-mega]");
    if (!trigger) return;
    var wrap = trigger.closest(".has-mega");
    var panel = wrap.querySelector(".mega");
    var open = function () { panel.classList.add("is-open"); };
    var close = function () { panel.classList.remove("is-open"); };
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
      var hot = e.target.closest && e.target.closest("a, button, .card, .tile, .size-btn, .card-media");
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

  function routeFromHash() {
    var h = location.hash.replace("#", "");
    if (h.indexOf("product/") === 0) openProduct(h.split("/")[1]);
    else if (h === "checkout") openCheckout();
  }

  /* ============================================================
     14 · EVENTS
     ============================================================ */

  function initEvents() {

    document.addEventListener("click", function (e) {

      var prod = e.target.closest("[data-open-product]");
      if (prod) { openProduct(prod.getAttribute("data-open-product")); return; }

      var add = e.target.closest("[data-add]");
      if (add) { openSizeSheet(add.getAttribute("data-add")); return; }

      var size = e.target.closest("[data-size]");
      if (size && pendingProduct) {
        var pid = pendingProduct, sz = size.getAttribute("data-size");
        pendingProduct = null;
        closeDrawers(true);
        addToCart(pid, sz, 1);
        openDrawer("cart");
        return;
      }

      var pvSize = e.target.closest("[data-pv-size]");
      if (pvSize && pendingProduct) {
        document.querySelectorAll("[data-pv-size]").forEach(function (b) {
          b.classList.toggle("is-on", b === pvSize);
        });
        addToCart(pendingProduct, pvSize.getAttribute("data-pv-size"), pvQty());
        closeDrawers(true);
        openDrawer("cart");
        return;
      }

      var pvAdd = e.target.closest("[data-pv-add]");
      if (pvAdd && pendingProduct) {
        var chosen = document.querySelector("[data-pv-size].is-on");
        if (!chosen) { toast("Pick a size", "Select a size before adding to the bag."); return; }
        addToCart(pendingProduct, chosen.getAttribute("data-pv-size"), pvQty());
        closeDrawers(true);
        openDrawer("cart");
        return;
      }

      var inc = e.target.closest("[data-inc]");
      if (inc) { setQty(+inc.getAttribute("data-inc"), 1); return; }
      var dec = e.target.closest("[data-dec]");
      if (dec) { setQty(+dec.getAttribute("data-dec"), -1); return; }
      var rm = e.target.closest("[data-rm]");
      if (rm) { removeLine(+rm.getAttribute("data-rm")); return; }

      var coOpen = e.target.closest("[data-open-checkout]");
      if (coOpen) { closeDrawers(true); openCheckout(); return; }

      var open = e.target.closest("[data-open]");
      if (open) { openDrawer(open.getAttribute("data-open")); return; }

      /* Footer and menu topics. These used to be <a href="#footer">, which
         put ten labels on screen that went nowhere. One sheet now serves
         every topic and actually says something. */
      var info = e.target.closest("[data-info]");
      if (info) { openInfo(info.getAttribute("data-info")); return; }

      var close = e.target.closest("[data-close]");
      if (close) { checkoutOpen = false; closeDrawers(); return; }

      if (e.target.closest("[data-co-close]")) {
        checkoutOpen = false;
        closeDrawers();
        document.getElementById("coNext").hidden = false;
        return;
      }

      var coGoto = e.target.closest("[data-co-goto]");
      if (coGoto) { co.step = +coGoto.getAttribute("data-co-goto"); renderCheckout(); return; }

      if (e.target.id === "scrim") { checkoutOpen = false; closeDrawers(); return; }

      if (!e.target.closest(".drawer, .sheet, #scrim, .mega")) {
        var mega = document.querySelector(".mega.is-open");
        if (mega) mega.classList.remove("is-open");
      }
    });

    // Product view quantity
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-pv-qty]")) {
        var el = document.getElementById("pvQty");
        var n = Math.max(1, Math.min(9, (pvQty() || 1) + (e.target.closest("[data-pv-qty]").getAttribute("data-pv-qty") === "+" ? 1 : -1)));
        el.textContent = n;
      }
    });

    // Checkout field binding. The data-co key is the full path
    // ("ship.email" / "pay.card") so the object is unambiguous.
    document.addEventListener("input", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-co");
      if (!k) return;
      var grp = k.indexOf("pay.") === 0 ? co.pay : co.ship;
      grp[k.split(".")[1]] = e.target.value;
    });

    document.addEventListener("change", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-co");
      if (k && k.indexOf("ship.") === 0) { co.ship[k.split(".")[1]] = e.target.value; return; }
      if (k && k.indexOf("pay.") === 0) { co.pay[k.split(".")[1]] = e.target.value; return; }
      if (e.target.name === "shipm") {
        co.shipMethod = e.target.value;
        renderCheckout();
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target.id === "coNext") {
        if (co.step === 4) { placeOrder(); return; }
        if (!coValidate()) return;
        co.step++;
        renderCheckout();
        return;
      }
      if (e.target.id === "coBack") { co.step = Math.max(1, co.step - 1); renderCheckout(); }
    });

    // Filters
    document.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-filter]");
      if (!chip) return;
      state.filter = chip.getAttribute("data-filter");
      document.querySelectorAll("#filters [data-filter]").forEach(function (c) {
        c.classList.toggle("is-on", c === chip);
      });
      renderGrid();
      renderSearch();
    });

    var sort = document.getElementById("sort");
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; renderGrid(); });

    var input = document.getElementById("searchInput");
    if (input) input.addEventListener("input", function () {
      state.query = input.value.trim();
      renderSearch();
      renderGrid();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        checkoutOpen = false;
        closeDrawers();
        var mega = document.querySelector(".mega.is-open");
        if (mega) mega.classList.remove("is-open");
      }
    });

    var news = document.getElementById("newsletter");
    if (news) news.addEventListener("submit", function (e) {
      e.preventDefault();
      toast("Subscribed", "Drop alerts are on for this demo.");
      news.reset();
    });

    window.addEventListener("hashchange", routeFromHash);
  }

  function pvQty() {
    var el = document.getElementById("pvQty");
    return el ? parseInt(el.textContent, 10) || 1 : 1;
  }

  /* ============================================================
     15 · BOOT
     ============================================================ */

  function boot() {
    document.getElementById("year").textContent = new Date().getFullYear();

    document.querySelectorAll("[data-macro]").forEach(function (el, i) {
      var v = window.BD_FLATS ? BD_FLATS.macro : "";
      el.innerHTML = v.replace(/id="bd-/g, 'id="bd' + i + '-');
    });

    var chips = document.getElementById("filters");
    if (chips) {
      chips.innerHTML = Object.keys(CAT_LABEL).map(function (k) {
        return '<button class="chip' + (k === "all" ? " is-on" : "") + '" data-filter="' + k + '">' +
               CAT_LABEL[k] + '</button>';
      }).join("");
    }

    // Mega menu category links
    var megaCats = document.getElementById("megaCats");
    if (megaCats) {
      megaCats.innerHTML = Object.keys(CATS).map(function (k) {
        return '<a href="#shop" data-filter="' + k + '">' + CATS[k] + '</a>';
      }).join("");
    }

    renderGrid();
    renderCart();
    renderCartCount();
    renderSearch();
    renderCheckout();
    initCountdown();
    initHeader();
    initMega();
    initCursor();
    initReveals();
    initEvents();
    routeFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
