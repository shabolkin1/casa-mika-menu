(function () {
"use strict";
var T = window.CM_T, SVC = window.CM_SVC, CHIPS = window.CM_CHIPS, STF = window.CM_STAFF, BILL = window.CM_BILL;
var LANGS = ["vi", "en", "ru", "ko"];
var LANG_LABEL = { vi: "Việt", en: "Eng", ru: "Рус", ko: "한국어" };
var LOC = { ru: "ru-RU", en: "en-US", vi: "vi-VN", ko: "ko-KR" };
var GROUP_ORDER = ["food", "drinks", "bar"];

/* ---------- tiny helpers ---------- */
function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function h(tag, props) {
  var el = document.createElement(tag), k, v, i, c;
  props = props || {};
  for (k in props) {
    v = props[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "icon") el.innerHTML = ICONS[v] || ""; /* static strings below only */
    else if (k === "style") el.style.cssText = v;
    else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (i = 2; i < arguments.length; i++) add(el, arguments[i]);
  return el;
}
function add(el, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
  el.append(c.nodeType ? c : document.createTextNode(String(c)));
}
var THUMB = {}, FULL = {};
function pic(n, big) { if (n && n.slice(0, 2) === "x:") { var id = n.slice(2); return (big && FULL[id]) || THUMB[id] || ""; } return "img/" + n + ".webp"; }
function bgOf(n) { return (M && M.colors && M.colors[n]) || "#1f1a16"; }
function fill(el) { el.replaceChildren(); for (var i = 1; i < arguments.length; i++) add(el, arguments[i]); }
function ic(name, size) { var s = h("span", { "aria-hidden": "true", style: "display:inline-grid;place-items:center" }); s.innerHTML = (ICONS[name] || "").replace(/width="24" height="24"/, 'width="' + (size || 24) + '" height="' + (size || 24) + '"'); return s; }
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms || 10); } catch (e) {} }
function reduced() { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

var SV = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
var ICONS = {
  bell: '<svg ' + SV + '><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  spark: '<svg ' + SV + '><path d="M4 20l9-9"/><path d="M14 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/><path d="M19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6z"/></svg>',
  napkin: '<svg ' + SV + '><path d="M4 7l8-3 8 3-8 3z"/><path d="M4 7v9l8 4 8-4V7"/><path d="M12 10v10"/></svg>',
  fork: '<svg ' + SV + '><path d="M7 3v7a2 2 0 0 0 4 0V3"/><path d="M9 12v9"/><path d="M17 3c-1.7 1.5-2.5 4-2.5 7H17v11"/></svg>',
  drop: '<svg ' + SV + '><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  ice: '<svg ' + SV + '><rect x="4" y="4" width="9" height="9" rx="2"/><rect x="11" y="11" width="9" height="9" rx="2"/></svg>',
  chili: '<svg ' + SV + '><path d="M12 7c-4 0-7 5-8 12 6-1 11-4 12-9"/><path d="M12 7c2 0 4 1.5 4 3"/><path d="M14 7c0-2 1-3 3-4"/></svg>',
  plug: '<svg ' + SV + '><path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/></svg>',
  wind: '<svg ' + SV + '><path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 15h15a3 3 0 1 1-3 3"/><path d="M3 12h7"/></svg>',
  book: '<svg ' + SV + '><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/></svg>',
  bill: '<svg ' + SV + '><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  pen: '<svg ' + SV + '><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  search: '<svg ' + SV + '><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  arrow: '<svg ' + SV + '><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  x: '<svg ' + SV + '><path d="M6 6l12 12M18 6L6 18"/></svg>',
  star: '<svg ' + SV + '><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
  wifi: '<svg ' + SV + '><path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5.5 12a10 10 0 0 1 13 0"/><path d="M9 15.5a5 5 0 0 1 6 0"/><path d="M12 19h.01"/></svg>',
  copy: '<svg ' + SV + '><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  minus: '<svg ' + SV + '><path d="M5 12h14"/></svg>',
  plus: '<svg ' + SV + ' stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg ' + SV + ' stroke-width="2.2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  clock: '<svg ' + SV + '><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  sound: '<svg ' + SV + '><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>',
  ban: '<svg ' + SV + '><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>',
  leaf: '<svg ' + SV + '><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/></svg>',
  wine: '<svg ' + SV + '><path d="M8 3h8l-.5 6a3.5 3.5 0 0 1-7 0z"/><path d="M12 13v7M8.5 21h7"/></svg>',
  cup: '<svg ' + SV + '><path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M9 3v3M13 3v3"/></svg>',
  bowl: '<svg ' + SV + '><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 20h8"/><path d="M9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3"/></svg>',
  beer: '<svg ' + SV + '><path d="M6 7h10v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><path d="M6 7a3 3 0 0 1 5-2 3 3 0 0 1 5 2"/></svg>',
  trash: '<svg ' + SV + '><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  dots: '<svg ' + SV + ' stroke-width="2.4"><path d="M6 12h.01M12 12h.01M18 12h.01"/></svg>',
  door: '<svg ' + SV + '><path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>'
};

/* ---------- state ---------- */
var navLang = (navigator.language || "en").slice(0, 2).toLowerCase();
var S = {
  view: "guest",
  lang: load("cm-lang", LANGS.indexOf(navLang) >= 0 ? navLang : "en"),
  table: load("cm-table", 7),
  group: "food",
  cart: load("cm-cart", []),
  chips: {}, note: "",
  orders: [], reqs: [], stop: {},
  mineO: load("cm-mine-o", []), mineR: load("cm-mine-r", []),
  store: "loading", slow: false, offline: navigator.onLine === false, rtDown: false,
  outbox: load("cm-outbox", []), cfg: {}, served: load("cm-served", {}), rated: load("cm-rated", {}), paid: load("cm-paid", []),
  staffLang: (function () { var l = load("cm-staff-lang", "vi"); return l === "en" ? "en" : "vi"; })(), sound: false
};
if (LANGS.indexOf(S.lang) < 0) S.lang = "en";
var M = null, BY = {}, SEC = {}, SPICY_SEC = {};
function t(k) { return (T[S.lang] && T[S.lang][k]) || T.en[k] || k; }
function st(k) { return (STF[S.staffLang] && STF[S.staffLang][k]) || STF.vi[k] || k; }
function nm(o, l) { return (o && o.n && (o.n[l || S.lang] || o.n.en)) || ""; }
function money(n, l) { try { return Number(n).toLocaleString(LOC[l || S.lang] || "en-US") + " ₫"; } catch (e) { return n + " ₫"; } }
function priceLabel(it) { return it.v ? t("from") + " " + money(it.p) : money(it.p); }

/* ---------- store: Claude db when available, this device otherwise ---------- */
var Store = (function () {
  var db = null, cbs = [], local = null, bc = null, sb = null;
  var CFG = window.CM_CONFIG || {};
  function emit() { cbs.forEach(function (f) { f(); }); }
  function cleanOrder(d, id) {
    d = d || {};
    var items = (Array.isArray(d.items) ? d.items : []).slice(0, 40).map(function (x) {
      x = x || {}; return { id: String(x.id || ""), v: x.v == null ? null : Math.max(0, parseInt(x.v, 10) || 0), sp: !!x.sp, q: Math.max(1, Math.min(50, parseInt(x.q, 10) || 1)) };
    }).filter(function (x) { return BY[x.id]; });
    return { id: id, table: Math.max(1, Math.min(99, parseInt(d.table, 10) || 1)), items: items,
      chips: (Array.isArray(d.chips) ? d.chips : []).filter(function (c) { return CHIPS[c]; }),
      note: typeof d.note === "string" ? d.note.slice(0, 300) : "",
      status: ["new", "accepted", "served"].indexOf(d.status) >= 0 ? d.status : "new",
      createdAt: Number(d.createdAt) || 0, code: parseInt(d.code, 10) || 0, lang: LANGS.indexOf(d.lang) >= 0 ? d.lang : "en" };
  }
  function cleanReq(d, id) {
    d = d || {};
    var kinds = SVC.map(function (s) { return s.k; }).concat(["bill", "other"]);
    return { id: id, table: Math.max(1, Math.min(99, parseInt(d.table, 10) || 1)), kind: kinds.indexOf(d.kind) >= 0 ? d.kind : "waiter",
      extra: typeof d.extra === "string" ? d.extra.slice(0, 200) : "", status: d.status === "done" ? "done" : "new",
      createdAt: Number(d.createdAt) || 0, lang: LANGS.indexOf(d.lang) >= 0 ? d.lang : "en" };
  }
  function sortDesc(a, b) { return b.createdAt - a.createdAt; }
  function applyLocal() {
    S.orders = Object.keys(local.orders).map(function (k) { return cleanOrder(local.orders[k], k); }).sort(sortDesc);
    S.reqs = Object.keys(local.reqs).map(function (k) { return cleanReq(local.reqs[k], k); }).sort(sortDesc);
    S.stop = local.stop || {};
    emit();
  }
  function persist() { save("cm-local", local); try { bc && bc.postMessage("x"); } catch (e) {} applyLocal(); }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function startLocal() {
    S.store = "local";
    local = load("cm-local", null) || { orders: {}, reqs: {}, stop: {} };
    try { bc = new BroadcastChannel("casa-mika"); bc.onmessage = function () { local = load("cm-local", local); applyLocal(); }; } catch (e) {}
    window.addEventListener("storage", function (e) { if (e.key === "cm-local") { local = load("cm-local", local); applyLocal(); } });
    applyLocal();
  }
  function startDb(x) {
    db = x; S.store = "db";
    var timer = setTimeout(function () { S.slow = true; emit(); }, 10000);
    function ok(snap) { if (!snap.metadata.fromCache) { clearTimeout(timer); S.slow = false; } }
    function bad() { if (!db) return; clearTimeout(timer); S.slow = true; emit(); }
    db.collection("orders").orderBy("createdAt", "desc").limit(80).onSnapshot(function (snap) {
      if (!db) return; ok(snap); S.orders = snap.docs.map(function (d) { return cleanOrder(d.data(), d.id); }); emit();
    }, bad);
    db.collection("requests").orderBy("createdAt", "desc").limit(80).onSnapshot(function (snap) {
      if (!db) return; ok(snap); S.reqs = snap.docs.map(function (d) { return cleanReq(d.data(), d.id); }); emit();
    }, bad);
    db.doc("state/stoplist").onSnapshot(function (d) {
      if (!db) return; var ids = d.exists ? (d.data() || {}).ids : null; S.stop = ids && typeof ids === "object" ? ids : {}; emit();
    }, function () {});
  }
  function fallback(retry) {
    return function (e) {
      if (!db || (e && e.code && ["invalid_argument", "not_granted", "capability_disabled", "revoked"].indexOf(e.code) < 0)) throw e;
      db = null; startLocal(); return retry();
    };
  }
  /* ---- live server (Supabase) ---- */
  function rowOrder(r) { return cleanOrder({ table: r.table_no, items: r.items, chips: r.chips, note: r.note, status: r.status, createdAt: Date.parse(r.created_at), code: r.code, lang: r.lang }, r.id); }
  function rowReq(r) { return cleanReq({ table: r.table_no, kind: r.kind, extra: r.extra, status: r.status, createdAt: Date.parse(r.created_at), lang: r.lang }, r.id); }
  var pulling = false, again = false;
  function pull() {
    if (!sb) return;
    if (pulling) { again = true; return; }
    pulling = true;
    Promise.all([
      sb.from("orders").select("*").order("created_at", { ascending: false }).limit(120),
      sb.from("requests").select("*").order("created_at", { ascending: false }).limit(120),
      sb.from("stoplist").select("ids").eq("id", 1).maybeSingle()
    ]).then(function (r) {
      if (r[0].error || r[1].error) throw r[0].error || r[1].error;
      S.orders = r[0].data.map(rowOrder); S.reqs = r[1].data.map(rowReq);
      S.stop = (r[2].data && r[2].data.ids && typeof r[2].data.ids === "object") ? r[2].data.ids : {};
      S.slow = false; emit();
    }).catch(function () { S.slow = true; emit(); }).then(function () { pulling = false; if (again) { again = false; pull(); } });
  }
  /* manager edits: small json per item + photo thumbnails; full photos on demand */
  var editsAt = "";
  function pullEdits() {
    if (!sb) return Promise.resolve();
    return Promise.all([sb.from("menu_overrides").select("id,data,updated_at"), sb.from("menu_photos").select("id,thumb,updated_at")]).then(function (r) {
      if (r[0].error || r[1].error) return;
      var stamp = r[0].data.map(function (x) { return x.id + x.updated_at; }).join() + "|" + r[1].data.map(function (x) { return x.id + x.updated_at; }).join();
      if (stamp === editsAt) return; editsAt = stamp;
      Object.keys(EDITS).forEach(function (k) { delete EDITS[k]; }); Object.keys(PHOTO_IDS).forEach(function (k) { delete PHOTO_IDS[k]; });
      r[0].data.forEach(function (x) { if (BY[x.id] && x.data && typeof x.data === "object") EDITS[x.id] = x.data; });
      r[1].data.forEach(function (x) { if (BY[x.id] && /^data:image\/(webp|jpeg);base64,/.test(x.thumb)) { PHOTO_IDS[x.id] = x.updated_at; if (THUMB[x.id] !== x.thumb) delete FULL[x.id]; THUMB[x.id] = x.thumb; } });
      editsChanged();
    }, function () {});
  }
  function startSb() {
    S.store = "live";
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: false } });
    sb.channel("cm").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, pull)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, pull)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_overrides" }, pullEdits)
      .on("postgres_changes", { event: "*", schema: "public", table: "stoplist" }, pull)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, pullCfg)
      .subscribe(function (status) {
        var down = status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED";
        if (down !== S.rtDown) { S.rtDown = down; if (!down) pull(); emit(); }
      });
    S.cfg = load("cm-cfg", {}); pullCfg();
    pullEdits(); setInterval(function () { if (!document.hidden) pullEdits(); }, 120000);
    pull();
    setInterval(function () { if (!document.hidden) pull(); }, 15000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("online", function () { pull(); pullCfg(); });
  }
  function netErr(e) { e = e || {}; if (!e.code || /fetch|network|load failed|timeout/i.test(e.message || "")) e.net = true; return e; }
  function pullCfg() {
    if (!sb) return Promise.resolve();
    return sb.from("app_settings").select("data").eq("id", 1).maybeSingle().then(function (r) {
      if (!r.error && r.data && r.data.data && typeof r.data.data === "object") { S.cfg = r.data.data; save("cm-cfg", S.cfg); emit(); }
    }, function () {});
  }
  function pin() { return load("cm-pin", ""); }
  function rpc(name, args) {
    return sb.rpc(name, Object.assign({ pin: pin() }, args)).then(function (r) { if (r.error) throw r.error; pull(); return r.data; });
  }
  function apin() { return load("cm-admin-pin", ""); }
  function arpc(name, args) { return sb.rpc(name, Object.assign({ pin: apin() }, args)).then(function (r) { if (r.error) throw r.error; return r.data; }); }
  return {
    on: function (f) { cbs.push(f); },
    live: function () { return !!sb; },
    pullEdits: pullEdits,
    photo: function (id) {
      if (!sb) return Promise.resolve();
      return sb.from("menu_photos").select("full_img").eq("id", id).maybeSingle().then(function (r) { if (r.data && r.data.full_img) FULL[id] = r.data.full_img; });
    },
    adminCheck: function (p) { return sb.rpc("admin_check", { pin: p }).then(function (r) { if (r.error) throw r.error; return r.data === true; }); },
    adminSetItem: function (id, data) { return arpc("admin_set_item", { item_id: id, new_data: data }).then(function () { return pullEdits(); }); },
    adminSetPhoto: function (id, thumb, full) { return arpc("admin_set_photo", { item_id: id, thumb: thumb, full_img: full }).then(function () { if (full) FULL[id] = full; else delete FULL[id]; }); },
    adminSetPins: function (staffPin, adminPin) { return arpc("admin_set_pins", { new_staff: staffPin || null, new_admin: adminPin || null }); },
    adminSetStop: function (ids) { return arpc("staff_set_stop", { new_ids: ids }).then(function () { pull(); }); },
    pullCfg: pullCfg,
    addFeedback: function (f) {
      if (!sb) return Promise.resolve();
      return sb.from("feedback").insert({ table_no: f.table, order_id: f.order || null, rating: f.rating, comment: (f.comment || "").slice(0, 400), lang: f.lang })
        .then(function (r) { if (r.error) throw netErr(r.error); }, function (e) { throw netErr(e); });
    },
    adminSetSettings: function (d) { return arpc("admin_set_settings", { new_data: d }).then(function () { S.cfg = d; save("cm-cfg", d); return pullCfg(); }); },
    adminFeedback: function () { return arpc("admin_feedback", {}); },
    adminSetTelegram: function (tok, chat) { return arpc("admin_set_telegram", { new_token: tok || "", new_chat: chat || "" }); },
    adminTelegramOn: function () { return arpc("admin_telegram_on", {}); },
    checkPin: function (p) { return sb.rpc("staff_check", { pin: p }).then(function (r) { if (r.error) throw r.error; return r.data === true; }); },
    boot: function () {
      if (CFG.supabaseUrl && CFG.supabaseKey && window.supabase) { startSb(); return; }
      var done = false;
      function finish(x) { if (done) return; done = true; if (x) startDb(x); else startLocal(); }
      setTimeout(function () { finish(null); }, 4500);
      function tryUse() {
        window.claude.use("db").then(function (x) {
          if (!x) { finish(null); return; }
          window.claude.use("user").then(function (u) {
            if (!u || !u.can) { finish(x); return; }
            Promise.resolve(u.can("data.write")).then(function (ok) { finish(ok === false ? null : x); }, function () { finish(x); });
          }, function () { finish(x); });
        }, function () { finish(null); });
      }
      if (window.claude && window.claude.use) tryUse();
      else { var n = 0, iv = setInterval(function () { n++; if (window.claude && window.claude.use) { clearInterval(iv); tryUse(); } else if (n > 12) { clearInterval(iv); finish(null); } }, 250); }
    },
    addOrder: function (o) {
      var self = this;
      if (sb) return sb.from("orders").insert({ table_no: o.table, items: o.items, chips: o.chips, note: o.note, code: o.code, lang: o.lang, client_key: o.key || null }).select("id").single()
        .then(function (r) {
          if (r.error && r.error.code === "23505" && o.key) return sb.from("orders").select("id").eq("client_key", o.key).single().then(function (x) { if (x.error) throw netErr(x.error); pull(); return x.data.id; });
          if (r.error) throw netErr(r.error); pull(); return r.data.id;
        }, function (e) { throw netErr(e); });
      if (db) { var r = db.collection("orders").doc(); return r.set(o).then(function () { return r.id; }, fallback(function () { return self.addOrder(o); })); }
      var id = rid(); local.orders[id] = o; persist(); return Promise.resolve(id);
    },
    setOrder: function (id, patch) {
      if (sb) return rpc("staff_set_order", { order_id: id, new_status: patch.status });
      if (db) return db.doc("orders/" + id).update(patch);
      if (local.orders[id]) { Object.assign(local.orders[id], patch); persist(); } return Promise.resolve();
    },
    clearDone: function () { return sb ? rpc("staff_clear_done", {}) : null; },
    delOrder: function (id) { if (db) return db.doc("orders/" + id).delete(); delete local.orders[id]; persist(); return Promise.resolve(); },
    addReq: function (r) {
      var self = this;
      if (sb) return sb.from("requests").insert({ table_no: r.table, kind: r.kind, extra: r.extra, lang: r.lang }).select("id").single()
        .then(function (x) { if (x.error) throw x.error; pull(); return x.data.id; });
      if (db) { var x = db.collection("requests").doc(); return x.set(r).then(function () { return x.id; }, fallback(function () { return self.addReq(r); })); }
      var id = rid(); local.reqs[id] = r; persist(); return Promise.resolve(id);
    },
    setReq: function (id, patch) {
      if (sb) return rpc("staff_set_request", { request_id: id, new_status: patch.status });
      if (db) return db.doc("requests/" + id).update(patch);
      if (local.reqs[id]) { Object.assign(local.reqs[id], patch); persist(); } return Promise.resolve();
    },
    delReq: function (id) { if (db) return db.doc("requests/" + id).delete(); delete local.reqs[id]; persist(); return Promise.resolve(); },
    setStop: function (ids) { if (sb) return rpc("staff_set_stop", { new_ids: ids }); if (db) return db.doc("state/stoplist").set({ ids: ids }); local.stop = ids; persist(); return Promise.resolve(); }
  };
})();


/* ---------- manager edits on top of menu.json ---------- */
var BASE = {}, EDITS = {}, PHOTO_IDS = {};
function applyEdits() {
  M.items.forEach(function (it) {
    var b = BASE[it.id], e = EDITS[it.id] || {};
    ["p", "n", "d", "s", "img", "lo", "ct", "v", "hide"].forEach(function (k) { if (k in b) it[k] = JSON.parse(JSON.stringify(b[k])); else delete it[k]; });
    if (typeof e.p === "number" && e.p > 0) it.p = e.p;
    if (Array.isArray(e.vp) && it.v) it.v.forEach(function (v, i) { if (typeof e.vp[i] === "number" && e.vp[i] > 0) v.p = e.vp[i]; });
    if (it.v) it.p = Math.min.apply(null, it.v.map(function (v) { return v.p; }));
    ["n", "d", "s"].forEach(function (k) { if (e[k] && typeof e[k] === "object") { it[k] = it[k] || {}; LANGS.forEach(function (l) { var x = e[k][l]; if (typeof x === "string" && x.trim()) it[k][l] = x.trim().slice(0, k === "s" ? 900 : 160); }); } });
    if (e.hide === true) it.hide = true;
    if (PHOTO_IDS[it.id]) { it.img = "x:" + it.id; delete it.lo; delete it.ct; }
  });
}
function editsChanged() {
  applyEdits();
  if (S.view === "guest" && menuEl && !openSheet) { var y = window.scrollY; buildMenu(); window.scrollTo(0, y); renderDock(); }
  if (S.view === "admin" && window.CM_ADMIN) window.CM_ADMIN.refresh();
}
function loadAdmin() {
  if (window.CM_ADMIN) { window.CM_ADMIN.open(); return; }
  var s = document.createElement("script"); s.src = "admin.js?v=" + (window.CM_VER || 1); s.onload = function () { window.CM_ADMIN.open(); }; document.body.append(s);
}
window.CM = { slideKnob: slideKnob, reduced: reduced, h: h, add: add, ic: ic, fill: fill, sheet: sheet, closeSheet: closeSheet, toast: toast, buzz: buzz, load: load, save: save, pic: pic, bgOf: bgOf, money: money,
  get M() { return M; }, BY: BY, SEC: SEC, S: S, BASE: BASE, EDITS: EDITS, THUMB: THUMB, FULL: FULL, PHOTO_IDS: PHOTO_IDS, LANGS: LANGS, LANG_LABEL: LANG_LABEL,
  Store: Store, applyEdits: applyEdits, editsChanged: editsChanged, render: function () { render(); }, nm: nm, get openSheet() { return openSheet; } };

/* ---------- routing ---------- */
function route() {
  var m = /^#table-(\d{1,2})$/.exec(location.hash);
  if (location.hash === "#admin") { S.view = "admin"; document.body.setAttribute("data-view", "admin"); closeSheet(true); clearInterval(staffTimer); glow("order", "off"); window.onscroll = null; loadAdmin(); return; }
  if (location.hash === "#bar") S.view = "staff";
  else { S.view = "guest"; if (m) { var n = +m[1]; if (n >= 1 && n <= 99) { S.table = n; save("cm-table", n); } } }
  document.body.setAttribute("data-view", S.view);
  render();
}

/* ---------- toast ---------- */
var toastEl = null, toastTimer = 0;
function toast(msg, icon) {
  if (!toastEl) { toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" }); document.body.append(toastEl); }
  toastEl.replaceChildren(ic(icon || "check", 20), h("span", null, msg));
  toastEl.classList.toggle("top", !!openSheet || !!searchEl);
  requestAnimationFrame(function () { toastEl.classList.add("in"); });
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("in"); }, 2600);
}

/* ---------- sheets ---------- */
var openSheet = null;
function sheet(build, opts) {
  closeSheet(true);
  opts = opts || {};
  var scrim = h("div", { class: "scrim", onclick: function () { closeSheet(); } });
  var body = h("div", { class: "body" });
  var grab = h("div", { class: "grab", "aria-hidden": "true" }, h("i"));
  var el = h("section", { class: "sheet" + (opts.cls ? " " + opts.cls : ""), role: "dialog", "aria-modal": "true", "aria-label": opts.label || "" },
    grab, h("button", { class: "close press", "aria-label": S.view === "guest" ? t("cancel") : (S.staffLang === "en" ? "Close" : "Đóng"), onclick: function () { closeSheet(); } }, ic("x", 20)), body);
  document.body.append(scrim, el);
  document.body.style.overflow = "hidden";
  var api = { el: el, body: body, kind: opts.kind, rebuild: function () { var y = body.scrollTop; var f = document.activeElement && document.activeElement.id; body.replaceChildren(); build(body, api); body.scrollTop = y; if (f) { var n = document.getElementById(f); if (n) { n.focus(); try { var L = n.value.length; n.setSelectionRange(L, L); } catch (e) {} } } } };
  openSheet = api;
  if (toastEl && toastEl.classList.contains("in")) toastEl.classList.add("top");
  build(body, api);
  requestAnimationFrame(function () { requestAnimationFrame(function () { scrim.classList.add("in"); el.classList.add("in"); }); });
  /* drag down to close */
  var y0 = null, dy = 0;
  function down(e) { if (window.matchMedia && matchMedia("(min-width:760px)").matches) return; if (!grab.contains(e.target) && !(e.target.closest(".dish-ph") && body.scrollTop <= 0)) return; y0 = e.clientY; dy = 0; el.classList.add("drag"); }
  function move(e) { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = "translate(-50%," + dy + "px)"; }
  function up() { if (y0 == null) return; y0 = null; el.classList.remove("drag"); el.style.transform = ""; if (dy > 110) closeSheet(); }
  el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  api.cleanup = function () { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  setTimeout(function () { var f = el.querySelector(".body button, .body textarea"); if (f && opts.focus) f.focus(); }, 400);
  return api;
}
function closeSheet(now) {
  if (!openSheet) return;
  var s = openSheet; openSheet = null; s.cleanup && s.cleanup();
  var scrim = s.el.previousSibling;
  document.body.style.overflow = "";
  if (now) { s.el.remove(); scrim && scrim.remove(); return; }
  s.el.classList.remove("in"); scrim && scrim.classList.remove("in");
  setTimeout(function () { s.el.remove(); scrim && scrim.remove(); }, 500);
}
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (searchEl) closeSearch(); else closeSheet(); } });

/* ---------- cart ---------- */
function cartKey(id, v, sp) { return id + "|" + (v == null ? "" : v) + "|" + (sp ? 1 : 0); }
function itemPrice(it, v) { return it.v && v != null && it.v[v] ? it.v[v].p : it.p; }
function cartCount() { return S.cart.reduce(function (s, l) { return s + (S.stop[l.id] ? 0 : l.q); }, 0); }
function cartSum() { return S.cart.reduce(function (s, l) { var it = BY[l.id]; return s + (it && !S.stop[l.id] ? itemPrice(it, l.v) * l.q : 0); }, 0); }
function qtyOf(id) { return S.cart.reduce(function (s, l) { return s + (l.id === id ? l.q : 0); }, 0); }
function addToCart(id, v, sp, q) {
  var k = cartKey(id, v, sp), line = S.cart.find(function (l) { return l.k === k; });
  if (line) line.q = Math.min(20, line.q + q); else S.cart.push({ k: k, id: id, v: v, sp: sp, q: q });
  save("cm-cart", S.cart); buzz(12); refreshCounts();
}
function setLineQty(k, q) {
  S.cart = S.cart.map(function (l) { return l.k === k ? Object.assign({}, l, { q: q }) : l; }).filter(function (l) { return l.q > 0; });
  save("cm-cart", S.cart); refreshCounts();
}

/* ---------- selling: what goes with what ---------- */
var DRINKS_VN = ["tra-dao", "cf-muoi", "saigon", "dragon"];
var PAIR_SEC = {
  viet: DRINKS_VN, noodles: ["tra-dao", "tra-sen", "cam", "larue"], rice: DRINKS_VN, claypot: ["tra-sen", "tra-dao", "saigon"], soup: ["tra-sen", "cam", "saigon"],
  starters: ["saigon", "tra-dao", "sunset-crush", "torre-oria-sauvignon-blanc-gl"], veg: ["tra-sen", "cam"],
  seafood: ["torre-oria-sauvignon-blanc-gl", "tavernello-sangiovese-rosato-gl", "huda", "green-soul"],
  western: ["terre-forti-sangiovese-rubicone-gl", "saigon", "cam"], pasta: ["terre-forti-sangiovese-rubicone-gl", "accomplice-chardonnay-gl", "cam"],
  breakfast: ["cf-sua-sg", "cappuccino", "cam", "pink-latte"], salad: ["cam", "tra-dao", "torre-oria-sauvignon-blanc-gl"], light: ["cappuccino", "cf-dua", "pink-latte"],
  coffee: ["avocado-toast", "waffle", "croissant"], tea: ["waffle", "avocado-toast", "goi-cuon"], juice: ["avocado-toast", "goi-cuon", "waffle"],
  smoothie: ["avocado-toast", "waffle"], mocktail: ["met", "cha-gio", "bach-tuoc-lon"], soft: ["met", "cha-gio"],
  signature: ["met", "cha-gio", "hau"], classic: ["met", "cha-gio", "bach-tuoc-lon"], beer: ["bach-tuoc-lon", "hau", "cha-gio"],
  "by-glass": ["met", "hau", "goi-cuon"], red: ["bo-luc-lac", "mix-grill", "met"], white: ["tom-hum", "hau", "goi-cuon"],
  "rose-sparkling": ["met", "tom-su", "goi-cuon"], spirits: ["met", "bach-tuoc-lon", "cha-gio"]
};
var PAIR_ITEM = { "bo-luc-lac": ["chiara-terra-merlot-gl", "saigon", "rau-muong"], "bo-tieu-xanh": ["chiara-terra-merlot-gl", "saigon", "rau-muong"],
  "mix-grill": ["chiara-terra-merlot-gl", "saigon", "rau-muong"], "tom-hum": ["accomplice-chardonnay-gl", "torre-oria-sauvignon-blanc-gl", "rau-muong"],
  "bun-bo-hue": ["tra-dao", "saigon", "cam"], "met": ["saigon", "tra-dao", "sunset-crush"] };
function groupIcon(it) { var g = SEC[it.sec].group; return g === "bar" ? (it.sec === "beer" ? "beer" : "wine") : g === "drinks" ? "cup" : "bowl"; }
function available(id) { return BY[id] && !S.stop[id] && !BY[id].hide; }
function pairsFor(it) {
  var list = (PAIR_ITEM[it.id] || PAIR_SEC[it.sec] || []).filter(function (id) { return id !== it.id && available(id) && BY[id].img && !qtyOf(id); });
  return list.slice(0, 3).map(function (id) { return BY[id]; });
}
function upsellFor() {
  var inCart = S.cart.map(function (l) { return BY[l.id]; }).filter(Boolean);
  var hasDrink = inCart.some(function (it) { return SEC[it.sec].group !== "food"; });
  var hasFood = inCart.some(function (it) { return SEC[it.sec].group === "food"; });
  var pool = !hasDrink ? ["tra-dao", "cf-muoi", "cam", "saigon", "dragon"] : !hasFood ? ["met", "cha-gio", "avocado-toast", "goi-cuon", "waffle"] : ["waffle-fruit", "cf-dua", "st-bo-dua", "tra-sen"];
  return pool.filter(function (id) { return available(id) && BY[id].img && !qtyOf(id); }).slice(0, 3).map(function (id) { return BY[id]; });
}
function quickDefault(it) { return !SPICY_SEC[it.sec]; } /* variants add as the first option: glass, shot, smallest size */
function miniCards(list, api) {
  return h("div", { class: "minis" }, list.map(function (it) {
    var added = api.added && api.added[it.id];
    return h("div", { class: "mini-c" },
      it.img ? h("img", { class: it.ct ? "ct" : null, src: pic(it.img), alt: "", loading: "lazy", decoding: "async", style: "background-color:" + bgOf(it.img), onload: function (e) { e.target.classList.add("ld"); } }) : h("span", { class: "mini-ph", "aria-hidden": "true" }, ic(groupIcon(it), 34)),
      h("span", { class: "mini-n" }, nm(it)),
      h("span", { class: "mini-p num" }, priceLabel(it)),
      h("button", { class: "mini-a press" + (added ? " ok" : ""), "aria-label": t("add") + ": " + nm(it), onclick: function () {
        if (!quickDefault(it)) { closeSheet(); setTimeout(function () { openDish(it.id); }, 300); return; }
        addToCart(it.id, it.v ? 0 : null, false, 1); api.added = api.added || {}; api.added[it.id] = true; toast(nm(it) + " · " + t("added")); api.rebuild();
      } }, ic(added ? "check" : "plus", 18)));
  }));
}


/* segmented controls: the knob glides (with a little liquid stretch) before anything re-renders */
function slideKnob(group, idx, cb) {
  var k = group && group.querySelector(".knob"), bs = group ? [].slice.call(group.querySelectorAll(":scope > button")) : [];
  bs.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === idx)); });
  if (k) { k.classList.remove("moving"); void k.offsetWidth; k.classList.add("moving"); k.style.transform = "translateX(" + (idx * 100) + "%)"; setTimeout(function () { k.classList.remove("moving"); }, 420); }
  buzz(6);
  if (cb) setTimeout(cb, reduced() ? 0 : 300);
}
function segBtn(group, idx) { return function (e) { slideKnob(e.currentTarget.parentElement, idx); }; }

/* ---------- guest ---------- */
var dockHad = false, guestRoot = null, menuEl = null, chipsEl = null, dockEl = null, spy = null, splashDone = false;
function lineOpt(it, l) {
  var p = [];
  if (it.v && l.v != null && it.v[l.v]) p.push(nm(it.v[l.v]));
  if (SPICY_SEC[it.sec]) p.push(l.sp ? t("spicy") : "");
  return p.filter(Boolean).join(" · ");
}

function renderGuest() {
  document.documentElement.lang = S.lang;
  var root = h("div", { class: "guest" });
  var ph = h("div", { class: "ph" }, h("img", { src: "img/hero-s.webp", srcset: "img/hero-s.webp 900w, img/hero.webp 1584w", sizes: "(min-width:700px) 560px, 100vw", alt: "", fetchpriority: "high" }));
  var langBar = h("div", { class: "lang", role: "group", "aria-label": "Language" }, h("span", { class: "knob", style: "transform:translateX(" + (LANGS.indexOf(S.lang) * 100) + "%)" }),
    LANGS.map(function (l, i) { return h("button", { "aria-pressed": String(S.lang === l), lang: l, onclick: function (e) { if (l === S.lang) return; slideKnob(e.currentTarget.parentElement, i); setLang(l); } }, LANG_LABEL[l]); }));
  root.append(h("header", { class: "hero" }, ph,
    h("div", { class: "hero-in" }, langBar),
    h("div", { class: "hero-tx" },
      h("h1", { class: "tableword" }, t("table") + " ", h("b", { class: "num" }, S.table)),
      h("p", { class: "lead" }, t("tagline")))));

  var seg = h("div", { class: "seg", role: "group", "aria-label": "Menu" }, h("span", { class: "knob", style: "transform:translateX(" + (GROUP_ORDER.indexOf(S.group) * 100) + "%)" }),
    GROUP_ORDER.map(function (g) { var gr = M.groups.find(function (x) { return x.id === g; }); return h("button", { "aria-pressed": String(S.group === g), onclick: function () { setGroup(g); } }, nm(gr)); }));
  chipsEl = h("nav", { class: "chips", "aria-label": "Sections" });
  root.append(h("div", { class: "bar" }, h("div", { class: "bar-row" }, seg, h("button", { class: "icon-btn press", "aria-label": t("search"), onclick: openSearch }, ic("search", 22))), chipsEl));
  menuEl = h("main", { class: "menu" });
  root.append(menuEl);

  storeNoteEl = h("p", { class: "store-note" });
  root.append(h("footer", { class: "foot" }, h("span", null, t("address")), storeNoteEl));
  guestRoot = root;
  buildMenu();
  dockEl = h("div", { class: "dock" });
  document.getElementById("app").replaceChildren(root, h("div", { class: "edge", "aria-hidden": "true" }), dockEl);
  renderStoreNote();
  renderDock();
  parallax(ph);
}
var storeNoteEl = null;
function renderStoreNote() { if (storeNoteEl) storeNoteEl.textContent = S.store === "local" ? t("demo") : S.slow ? t("slow") : ""; }
function parallax(ph) {
  window.onscroll = null;
  if (reduced()) return;
  var ticking = false;
  window.onscroll = function () {
    if (ticking || S.view !== "guest") return; ticking = true;
    requestAnimationFrame(function () { var y = window.scrollY; if (y < 400) { ph.style.transform = "translateY(" + (y * 0.35) + "px)"; ph.style.opacity = String(Math.max(0, 1 - y / 220)); } ticking = false; });
  };
}
function setLang(l) {
  S.lang = l; save("cm-lang", l); document.documentElement.lang = l;
  /* update the words in place: the header photo, the knob and the scroll position stay put */
  var tw = guestRoot.querySelector(".tableword"); if (tw) fill(tw, t("table") + " ", h("b", { class: "num" }, S.table));
  var ld = guestRoot.querySelector(".hero .lead"); if (ld) ld.textContent = t("tagline");
  guestRoot.querySelectorAll(".seg > button").forEach(function (b, i) { var gr = M.groups.find(function (x) { return x.id === GROUP_ORDER[i]; }); b.textContent = nm(gr); });
  var sb = guestRoot.querySelector(".bar .icon-btn"); if (sb) sb.setAttribute("aria-label", t("search"));
  var ft = guestRoot.querySelector(".foot > span"); if (ft) ft.textContent = t("address");
  menuEl.classList.add("swap");
  setTimeout(function () { var y = window.scrollY; buildMenu(); renderDock(); renderStoreNote(); menuEl.classList.remove("swap"); window.scrollTo(0, y); barH(); }, 200);
}
function setGroup(g) {
  if (g === S.group) return;
  S.group = g;
  slideKnob(guestRoot.querySelector(".seg"), GROUP_ORDER.indexOf(g));
  menuEl.classList.add("swap");
  setTimeout(function () {
    buildMenu(); menuEl.classList.remove("swap");
    var bar = guestRoot.querySelector(".bar");
    if (window.scrollY > bar.offsetTop) window.scrollTo({ top: bar.offsetTop + 1, behavior: "auto" });
  }, 220);
}
function buildMenu() {
  var secs = M.sections.filter(function (s) { return s.group === S.group; });
  chipsEl.replaceChildren.apply(chipsEl, secs.map(function (s, i) {
    return h("button", { class: i === 0 ? "on" : "", "data-sec": s.id, onclick: function () { var el = document.getElementById("s-" + s.id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - barH() - 6, behavior: reduced() ? "auto" : "smooth" }); } }, nm(s));
  }));
  var kids = [];
  var rep = repeatCard(); if (rep) kids.push(rep);
  var now = nowPicks();
  if (now.list.length) {
    kids.push(h("h2", { class: "h-title first" }, t(now.title)));
    kids.push(h("div", { class: "hits" }, now.list.map(function (it) {
      var out = !!S.stop[it.id];
      return h("button", { class: "hit press" + (out ? " out" : ""), onclick: function () { if (!out) openDish(it.id); } },
        h("img", { class: it.ct ? "ct" : null, src: pic(it.img), alt: "", loading: "lazy", decoding: "async", style: "background-color:" + bgOf(it.img), onload: function (e) { e.target.classList.add("ld"); } }),
        h("span", { class: "nm" }, nm(it)),
        h("span", { class: "pr num" }, out ? t("out") : priceLabel(it)));
    })));
  }
  secs.forEach(function (s) {
    var items = M.items.filter(function (it) { return it.sec === s.id && !it.hide; });
    kids.push(h("section", { class: "sec", id: "s-" + s.id, "data-sec": s.id },
      h("h2", { class: "h-title" }, nm(s)),
      s.note ? h("p", { class: "h-note" }, nm({ n: s.note })) : null,
      h("div", { class: "group" }, items.map(rowFor))));
  });
  menuEl.replaceChildren.apply(menuEl, kids);
  watchSpy();
}
function rowFor(it) {
  var out = !!S.stop[it.id], q = qtyOf(it.id);
  var marks = [];
  if (it.tags.indexOf("veg") >= 0) marks.push(h("span", { class: "mk veg", title: "Vegetarian", "aria-label": "Vegetarian" }, ic("leaf", 15)));
  if (it.tags.indexOf("spicy") >= 0) marks.push(h("span", { class: "mk hot", title: t("spicy"), "aria-label": t("spicy") }, ic("chili", 15)));
  var btn = out ? h("span", { class: "soldout" }, t("out")) : ctlFor(it);
  return h("div", { class: "row" + (it.img ? " ph" : "") + (out ? " out" : ""), role: "button", tabindex: "0", "data-row": it.id,
      onclick: function () { if (!out) openDish(it.id); }, onkeydown: function (e) { if ((e.key === "Enter" || e.key === " ") && !out) { e.preventDefault(); openDish(it.id); } } },
    it.img ? h("img", { class: "th" + (it.ct ? " ct" : ""), src: pic(it.img), alt: "", loading: "lazy", decoding: "async", style: "background-color:" + bgOf(it.img), onload: function (e) { e.target.classList.add("ld"); } }) : null,
    h("div", { class: "tx" },
      h("div", { class: "nm" }, nm(it), marks),
      S.lang !== "vi" && it.n.vi !== nm(it) ? h("div", { class: "vi", lang: "vi" }, it.n.vi) : null,
      h("div", { class: "pr num" }, priceLabel(it))),
    btn);
}
/* what fits the time of day: morning coffee and breakfast, lunch, evening drinks */
var DAYPART = {
  morning: ["breakfast", "light", "coffee", "tea", "juice", "smoothie"],
  day: ["viet", "noodles", "rice", "soup", "salad", "claypot", "juice", "smoothie", "coffee", "tea", "mocktail"],
  evening: ["signature", "classic", "by-glass", "red", "white", "beer", "starters", "seafood", "viet", "western", "mocktail"]
};
function daypart() { var hr = new Date().getHours(); return hr >= 5 && hr < 11 ? "morning" : hr >= 11 && hr < 17 ? "day" : "evening"; }
function nowPicks() {
  var dp = daypart(), pref = DAYPART[dp];
  var list = M.items.filter(function (it) { return it.img && !it.hide && SEC[it.sec].group === S.group; });
  function rank(it) { var i = pref.indexOf(it.sec); return (i < 0 ? 50 : i) - (it.tags.indexOf("hit") >= 0 ? 0.5 : 0) + (S.stop[it.id] ? 100 : 0); }
  list.sort(function (a, b) { return rank(a) - rank(b); });
  return { title: "now_" + dp, list: list.slice(0, 10) };
}
/* repeat: regulars at a coworking order the same thing again */
function lastOrder() {
  var L = load("cm-last", null);
  if (!L || !Array.isArray(L.items) || Date.now() - L.at > 30 * 86400000) return null;
  var items = L.items.filter(function (x) { return available(x.id); });
  return items.length ? { items: items, at: L.at } : null;
}
function repeatPlan() {
  var L = lastOrder(); if (!L || S.cart.length) return null;
  var age = Date.now() - L.at;
  if (age < 45 * 60000) return null;
  var drinks = L.items.filter(function (x) { return SEC[BY[x.id].sec].group !== "food"; });
  if (age < 6 * 3600000 && drinks.length) return { title: t("again"), items: drinks };
  return { title: t("repeat"), items: L.items };
}
function repeatCard(inSheet) {
  var P = repeatPlan(); if (!P) return null;
  var names = P.items.map(function (x) { return (x.q > 1 ? x.q + "× " : "") + nm(BY[x.id]); }).join(", ");
  var sum = P.items.reduce(function (s, x) { return s + itemPrice(BY[x.id], x.v) * x.q; }, 0);
  var first = P.items.map(function (x) { return BY[x.id]; }).find(function (it) { return it.img; });
  return h("div", { class: "again" + (inSheet ? " in-sheet" : "") },
    first ? h("img", { class: first.ct ? "ct" : null, src: pic(first.img), alt: "", style: "background-color:" + bgOf(first.img) }) : h("span", { class: "again-ic" }, ic("cup", 22)),
    h("div", { class: "tx" }, h("b", null, P.title), h("span", null, names)),
    h("button", { class: "again-go press", onclick: function () {
      P.items.forEach(function (x) { addToCart(x.id, x.v, x.sp, x.q); });
      toast(t("added")); if (openSheet) closeSheet(); buildMenu();
    } }, h("span", null, t("repeatBtn")), h("small", { class: "num" }, money(sum))));
}
function barH() { var b = guestRoot && guestRoot.querySelector(".bar"); var v = b ? b.offsetHeight : 120; document.documentElement.style.setProperty("--barH", (v + 6) + "px"); return v; }
function watchSpy() {
  if (spy) spy.disconnect();
  if (!("IntersectionObserver" in window)) return;
  spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var id = e.target.getAttribute("data-sec");
      chipsEl.querySelectorAll("button").forEach(function (b) {
        var on = b.getAttribute("data-sec") === id; b.classList.toggle("on", on);
        if (on) chipsEl.scrollTo({ left: b.offsetLeft - 16, behavior: reduced() ? "auto" : "smooth" });
      });
    });
  }, { rootMargin: "-" + (barH() + 10) + "px 0px -60% 0px" });
  menuEl.querySelectorAll(".sec").forEach(function (s) { spy.observe(s); });
}
function refreshCounts() {
  if (S.view !== "guest" || !menuEl) return;
  menuEl.querySelectorAll("[data-add]").forEach(function (b) {
    var id = b.getAttribute("data-add"), q = qtyOf(id), old = +b.getAttribute("data-q");
    if (q === old || !BY[id]) return;
    var nb = ctlFor(BY[id]); b.replaceWith(nb);
    if (q && old) { var qn = nb.querySelector(".q"); if (qn) { qn.classList.remove("bump"); void qn.offsetWidth; qn.classList.add("bump"); } }
    else if (q) { nb.classList.add("pop"); }
  });
  renderDock();
}
/* add, or once added: a − n + stepper right in the row, so a mistake is undone where it was made */
function ctlFor(it) {
  var q = qtyOf(it.id);
  if (!q) return h("button", { class: "add press", "data-add": it.id, "data-q": "0", "aria-label": t("add") + ": " + nm(it), onclick: function (e) { e.stopPropagation(); quickAdd(it, e.currentTarget); } }, ic("plus", 22));
  return h("div", { class: "stp", "data-add": it.id, "data-q": String(q), role: "group", "aria-label": nm(it), onclick: function (e) { e.stopPropagation(); } },
    h("button", { class: "press", "aria-label": "− " + nm(it), onclick: function (e) { e.stopPropagation(); minusOne(it.id); } }, ic(q === 1 ? "trash" : "minus", 17)),
    h("span", { class: "q num", "aria-live": "polite" }, q),
    h("button", { class: "press", "aria-label": t("add") + ": " + nm(it), onclick: function (e) { e.stopPropagation(); quickAdd(it, e.currentTarget); } }, ic("plus", 17)));
}
function minusOne(id) {
  var ls = S.cart.filter(function (l) { return l.id === id; }); if (!ls.length) return;
  var l = ls[ls.length - 1]; buzz(8); setLineQty(l.k, l.q - 1);
}
function quickAdd(it, btn) {
  if (it.v || SPICY_SEC[it.sec]) { openDish(it.id); return; }
  var row = btn.closest(".row"), img = row && row.querySelector(".th");
  addToCart(it.id, null, false, 1);
  fly(img || btn, img ? img.src : null);
}
function fly(fromEl, src) {
  if (reduced() || !fromEl) return;
  requestAnimationFrame(function () {
    var target = dockEl && (dockEl.querySelector(".cart") || dockEl.querySelector(".bell")); if (!target) return;
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var el = src ? h("img", { class: "fly", src: src, alt: "" }) : h("div", { class: "fly", style: "background:var(--gold)" });
    var size = Math.min(a.width, a.height, 120);
    el.style.cssText += ";left:" + (a.left + a.width / 2 - size / 2) + "px;top:" + (a.top + a.height / 2 - size / 2) + "px;width:" + size + "px;height:" + size + "px";
    document.body.append(el);
    requestAnimationFrame(function () {
      var dx = b.left + 30 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + (24 / size) + ")"; el.style.opacity = ".2"; el.style.borderRadius = "50%";
    });
    setTimeout(function () { el.remove(); var n = target.querySelector(".n"); if (n) { n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump"); } }, 780);
  });
}
function activeOrders() {
  return S.orders.filter(function (o) { return S.mineO.indexOf(o.id) >= 0 && (o.status !== "served" || Date.now() - o.createdAt < 20 * 60000); });
}
function pendingReq(k) { return S.reqs.find(function (r) { return S.mineR.indexOf(r.id) >= 0 && r.kind === k && r.status === "new"; }); }
function renderDock() {
  if (!dockEl) return;
  var n = cartCount(), act = activeOrders(), live = S.reqs.some(function (r) { return S.mineR.indexOf(r.id) >= 0 && r.status === "new"; });
  var queued = S.outbox.filter(function (b) { return !b.failed; }).length, failed = S.outbox.some(function (b) { return b.failed; });
  var solo = !n && !act.length && !queued && !failed;
  var kids = [h("button", { class: "bell press" + (live ? " live" : "") + (solo ? " wide" : ""), "aria-label": t("callStaff"), onclick: openService },
    ic("bell", 24), solo ? h("span", { class: "t" }, t("callStaff")) : null, h("span", { class: "dot" }))];
  if (n) {
    kids.push(h("button", { class: "cart press" + (dockHad ? "" : " enter"), onclick: openCart }, h("span", { class: "n num" }, n), h("span", { class: "t" }, t("cart")), h("span", { class: "num" }, money(cartSum()))));
  } else if (queued || failed) {
    kids.push(h("button", { class: "track press" + (failed ? " bad" : " wait"), onclick: openStatus },
      h("span", { class: "t" }, failed ? t("failedOrd") : t("st_queued")), h("span", { class: "mini" }, h("i", { style: "width:" + (failed ? 100 : 10) + "%" }))));
  } else if (act.length) {
    var o = act[0], w = { new: 22, accepted: 60, served: 100 }[o.status];
    kids.push(h("button", { class: "track press", onclick: openStatus },
      h("span", { class: "t" }, t("st_" + o.status)), h("span", { class: "mini" }, h("i", { style: "width:" + w + "%" }))));
  }
  dockHad = !!n;
  document.body.classList.toggle("has-cart", !!n);
  dockEl.replaceChildren.apply(dockEl, kids);
}

/* dish sheet */
function openDish(id) {
  var it = BY[id]; if (!it || S.stop[id]) return;
  var st8 = { v: it.v ? 0 : null, sp: false, q: 1 };
  var canSpicy = !!SPICY_SEC[it.sec];
  sheet(function (body, api) {
    var total = itemPrice(it, st8.v) * st8.q;
    if (it.img && it.img.slice(0, 2) === "x:" && !FULL[it.id] && !api.fetching) { api.fetching = true; Store.photo(it.id).then(function () { if (openSheet === api) { var im = api.el.querySelector(".dish-ph img"); if (im) im.src = pic(it.img, true); } }); }
    fill(body, 
      it.img ? (it.lo ? h("div", { class: "dish-ph lo" + (it.ct ? " ct" : "") }, it.ct ? null : h("img", { class: "bk", src: pic(it.img), alt: "" }), h("img", { class: "fg", src: pic(it.img), alt: nm(it) }))
        : h("div", { class: "dish-ph" }, h("img", { src: pic(it.img, true), alt: nm(it), loading: "lazy", decoding: "async", style: "background:" + bgOf(it.img), onload: function (e) { e.target.classList.add("ld"); } }))) : h("div", { style: "height:30px" }),
      h("div", { class: "dish-meta" },
        h("h2", null, nm(it)),
        S.lang !== "vi" && it.n.vi !== nm(it) ? h("span", { class: "vi", lang: "vi" }, it.n.vi) : null,
        it.d ? h("p", { class: "dd" }, nm({ n: it.d })) : null,
        it.s ? h("p", { class: "story" + (api.full ? " full" : "") }, nm({ n: it.s })) : null,
        it.s && !api.full ? h("button", { class: "more", onclick: function () { api.full = true; api.rebuild(); } }, t("more")) : null),
      it.v ? h("div", null, h("div", { class: "lab" }, t("choose")),
        h("div", { class: "opts" }, it.v.map(function (v, i) {
          return h("button", { class: "opt press", "aria-pressed": String(st8.v === i), onclick: function () { st8.v = i; buzz(6); api.rebuild(); } }, h("b", null, nm(v)), h("span", { class: "num" }, money(v.p)));
        }))) : null,
      canSpicy ? h("div", { class: "switch-row" },
        h("div", null, h("div", { style: "font-weight:700" }, t("spicy")), h("div", { style: "font-size:14px;color:var(--faint)" }, t("spicyHint"))),
        h("button", { class: "switch", role: "switch", "aria-checked": String(st8.sp), "aria-label": t("spicy"), onclick: function () { st8.sp = !st8.sp; buzz(6); api.rebuild(); } }, h("i"))) : null,
      (function () { var p = pairsFor(it); return p.length ? h("div", null, h("div", { class: "lab" }, t("pairTitle")), miniCards(p, api)) : null; })(),
      h("div", { class: "buy" },
        h("div", { class: "stepper" },
          h("button", { "aria-label": "−", disabled: st8.q <= 1, onclick: function () { st8.q = Math.max(1, st8.q - 1); api.rebuild(); } }, "−"),
          h("span", { class: "num" }, st8.q),
          h("button", { "aria-label": "+", onclick: function () { st8.q = Math.min(20, st8.q + 1); api.rebuild(); } }, "+")),
        h("button", { class: "go press", onclick: function () {
          var img = api.el.querySelector(".dish-ph img.fg") || api.el.querySelector(".dish-ph img");
          addToCart(it.id, st8.v, st8.sp, st8.q); closeSheet();
          setTimeout(function () { fly(img || api.el, img ? img.src : null); }, 60);
        } }, h("span", { class: "lbl" }, t("add")), h("span", { class: "num" }, money(total)))));
    body.querySelectorAll(".dish-ph img").forEach(function (keep) { if (api.seen) keep.style.animation = "none"; }); api.seen = true;
    var sto = body.querySelector(".story:not(.full)"), mb = body.querySelector(".more"); if (sto && mb) requestAnimationFrame(function () { if (sto.scrollHeight <= sto.clientHeight + 2) mb.remove(); });
    var go = body.querySelector(".buy .go"); if (go) requestAnimationFrame(function () { go.classList.remove("tight"); if (go.scrollWidth > go.clientWidth + 1) go.classList.add("tight"); });
  }, { label: nm(it), kind: "dish", cls: it.img ? "photo" : "" });
}

/* cart sheet */
function openCart() {
  sheet(function (body, api) {
    var lines = S.cart.filter(function (l) { return BY[l.id] && !S.stop[l.id]; });
    if (!lines.length) { closeSheet(); return; }
    var sending = api.sending;
    fill(body, 
      h("div", { class: "s-title" }, h("h2", null, t("yourOrder")), h("p", null, t("table") + " " + S.table)),
      h("div", null, lines.map(function (l) {
        var it = BY[l.id];
        return h("div", { class: "line" + (it.img ? "" : " np") },
          it.img ? h("img", { class: it.ct ? "ct" : null, src: pic(it.img), alt: "", loading: "lazy", decoding: "async", style: "background-color:" + bgOf(it.img), onload: function (e) { e.target.classList.add("ld"); } }) : null,
          h("div", { style: "min-width:0" }, h("div", { class: "nm" }, nm(it)), lineOpt(it, l) ? h("div", { class: "o" }, lineOpt(it, l)) : null, h("div", { class: "pr num" }, money(itemPrice(it, l.v) * l.q))),
          h("div", { class: "stepper" },
            h("button", { "aria-label": "−", onclick: function () { setLineQty(l.k, l.q - 1); api.rebuild(); } }, "−"),
            h("span", { class: "num" }, l.q),
            h("button", { "aria-label": "+", onclick: function () { setLineQty(l.k, Math.min(20, l.q + 1)); api.rebuild(); } }, "+")));
      })),
      (function () { var u = upsellFor(); return u.length ? h("div", null, h("div", { class: "lab" }, t("upsell")), miniCards(u, api)) : null; })(),
      h("div", null, h("div", { class: "lab" }, t("wishes")),
        h("div", { class: "pills scroll" }, Object.keys(CHIPS).map(function (c) {
          return h("button", { class: "pill press", "aria-pressed": String(!!S.chips[c]), onclick: function () { S.chips[c] = !S.chips[c]; buzz(6); api.rebuild(); } }, CHIPS[c][S.lang]);
        }).concat(api.noteOpen || S.note ? [] : [h("button", { class: "pill press add-note", onclick: function () { api.noteOpen = true; api.rebuild(); var n = body.querySelector("#cm-note"); if (n) n.focus(); } }, ic("pen", 16), t("addNote"))]))),
      api.noteOpen || S.note ? (function () { var ta = h("textarea", { id: "cm-note", maxlength: "300", "aria-label": t("note"), placeholder: t("notePh"), oninput: function (e) { S.note = e.target.value; } }); ta.value = S.note; return ta; })() : null,
      api.err ? h("p", { class: "err", role: "alert" }, api.err) : null,
      h("div", { class: "buy" }, h("div", { class: "buy-col" },
        h("button", { class: "go press", disabled: sending || S.store === "loading", "data-wait": S.store === "loading" ? "1" : null, onclick: function () { sendOrder(api); } },
          h("span", null, sending ? t("sending") : t("send")), h("span", { class: "num" }, money(cartSum()))),
        h("p", { class: "pay-note" }, t("payNote")))));
  }, { label: t("yourOrder"), kind: "cart" });
}
/* every order gets a key and waits in an outbox until the server has it: weak Wi-Fi or a double tap never loses or doubles an order */
function newKey() { try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12); }
function saveOutbox() { save("cm-outbox", S.outbox); }
var flying = {};
function deliver(box) {
  if (flying[box.key]) return flying[box.key];
  var p = Promise.resolve(Store.addOrder(box.o)).then(function (id) {
    S.outbox = S.outbox.filter(function (b) { return b.key !== box.key; }); saveOutbox();
    S.mineO = [id].concat(S.mineO.filter(function (x) { return x !== id; })).slice(0, 20); save("cm-mine-o", S.mineO);
    return id;
  });
  flying[box.key] = p;
  p.then(function () { delete flying[box.key]; }, function () { delete flying[box.key]; });
  return p;
}
function flushOutbox() {
  if (!S.outbox.length) return;
  var changed = false;
  S.outbox.forEach(function (b) { if (!b.failed && Date.now() - b.at > 45 * 60000) { b.failed = true; changed = true; } });
  if (changed) { saveOutbox(); renderDock(); }
  S.outbox.filter(function (b) { return !b.failed; }).forEach(function (b) {
    deliver(b).then(function () { toast(t("sentToast")); buzz([12, 60, 12]); glow("order", "burst"); renderDock(); if (openSheet && openSheet.kind === "status") openSheet.rebuild(); },
      function (e) { if (e && !e.net) { b.failed = true; saveOutbox(); renderDock(); } });
  });
}
setInterval(function () { if (S.outbox.length && !document.hidden && S.view === "guest") flushOutbox(); }, 8000);
window.addEventListener("online", function () { S.offline = false; renderNet(); flushOutbox(); });
window.addEventListener("offline", function () { S.offline = true; renderNet(); });
document.addEventListener("visibilitychange", function () { if (!document.hidden && S.view === "guest") flushOutbox(); });
function sendOrder(api) {
  if (api.sending) return;
  var items = S.cart.filter(function (l) { return BY[l.id] && !S.stop[l.id]; }).map(function (l) { return { id: l.id, v: l.v, sp: !!l.sp, q: l.q }; });
  if (!items.length) return;
  api.sending = true; api.err = ""; api.rebuild();
  var box = { key: newKey(), at: Date.now(), o: { table: S.table, items: items, chips: Object.keys(S.chips).filter(function (c) { return S.chips[c]; }),
    note: S.note.trim().slice(0, 300), status: "new", createdAt: Date.now(), code: 100 + Math.floor(Math.random() * 900), lang: S.lang } };
  box.o.key = box.key;
  S.outbox.push(box); saveOutbox();
  function clearCart() {
    save("cm-last", { items: items, at: Date.now() });
    S.cart = []; S.chips = {}; S.note = ""; save("cm-cart", S.cart);
    closeSheet(); refreshCounts(); buildMenu();
  }
  deliver(box).then(function () {
    clearCart(); buzz([12, 60, 12]); toast(t("sentToast")); glow("order", "burst");
    setTimeout(openStatus, 550);
  }, function (e) {
    if (e && e.net) { clearCart(); buzz([20, 60, 20]); toast(t("queuedToast"), "wifi"); renderDock(); return; }
    S.outbox = S.outbox.filter(function (b) { return b.key !== box.key; }); saveOutbox();
    api.sending = false; api.err = t("errSend"); api.rebuild();
  });
}

/* service sheet */
function sendReq(kind, extra, el) {
  if (pendingReq(kind) && kind !== "other" && !/^qrpaid/.test(extra || "")) { toast(t("rq_new"), "clock"); return; }
  if (el) ripple(el);
  buzz(14);
  return Store.addReq({ table: S.table, kind: kind, extra: (extra || "").slice(0, 200), status: "new", createdAt: Date.now(), lang: S.lang })
    .then(function (id) { S.mineR = [id].concat(S.mineR).slice(0, 30); save("cm-mine-r", S.mineR); toast(t("rqToast")); renderDock(); if (openSheet && openSheet.kind === "service") openSheet.rebuild(); },
      function () { toast(t("errSend"), "x"); });
}
function ripple(el) {
  var r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
  var x = h("span", { class: "ripple", style: "width:" + s + "px;height:" + s + "px;left:" + (r.width / 2 - s / 2) + "px;top:" + (r.height / 2 - s / 2) + "px" });
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.overflow = "hidden"; el.append(x); setTimeout(function () { x.remove(); }, 750);
}
function openService() {
  sheet(function (body, api) {
    function tile(k, icon, label, onclick, open) {
      var p = pendingReq(k);
      return h("button", { class: "press" + (p ? " sent" : "") + (open ? " open" : ""), onclick: onclick },
        h("span", { class: "ic" }, ic(p ? "check" : icon, 20)),
        h("span", { class: "tl" }, h("b", null, label), p ? h("small", null, t("rq_new")) : null));
    }
    fill(body,
      h("div", { class: "s-title" }, h("h2", null, t("service")), h("p", null, t("table") + " " + S.table + " · " + t("serviceSub"))),
      h("div", { class: "svc" }, SVC.map(function (s) {
        return tile(s.k, s.ic, nm(s), function (e) { sendReq(s.k, "", e.currentTarget); });
      }).concat([
        tile("bill", "bill", t("bill"), function () { api.bill = !api.bill; api.otherOpen = false; api.rebuild(); }, api.bill),
        tile("other", "pen", t("other"), function () { api.otherOpen = !api.otherOpen; api.bill = false; api.rebuild(); var n = body.querySelector("#cm-other"); if (n) n.focus(); }, api.otherOpen)
      ])),
      api.bill ? billPanel(api) : null,
      api.otherOpen ? h("div", { class: "svc-more other-row" },
        (function () { var ta = h("textarea", { id: "cm-other", maxlength: "200", rows: "1", "aria-label": t("other"), placeholder: t("otherPh"), oninput: function (e) { api.otherTx = e.target.value; } }); ta.value = api.otherTx || ""; return ta; })(),
        h("button", { class: "go press", onclick: function () {
          var ta = body.querySelector("#cm-other"), v = ta.value.trim(); if (!v) { ta.focus(); return; } api.otherTx = ""; api.otherOpen = false; sendReq("other", v);
        } }, t("sendReq"))) : null);
  }, { label: t("service"), kind: "service" });
}
/* bill: what this phone ordered, and the café's bank QR with the amount filled in */
function billEx(x) { var m = /^([a-z]+)(?::(\d+))?$/.exec(x || ""); return m ? { k: m[1], sum: m[2] ? +m[2] : 0 } : { k: x, sum: 0 }; }
function billOrders() {
  return S.orders.filter(function (o) { return S.mineO.indexOf(o.id) >= 0 && S.paid.indexOf(o.id) < 0 && Date.now() - o.createdAt < 5 * 3600000; });
}
function orderSum(o) { return o.items.reduce(function (s, x) { var it = BY[x.id]; return s + (it ? itemPrice(it, x.v) * x.q : 0); }, 0); }
function qrReady() { var c = S.cfg || {}; return /^\d{6}$/.test(c.bank || "") && /^[0-9A-Za-z]{4,30}$/.test(c.acct || ""); }
function billPanel(api) {
  var list = billOrders(), sum = list.reduce(function (s, o) { return s + orderSum(o); }, 0), c = S.cfg || {};
  var head = h("div", { class: "bill-sum" },
    h("div", null, h("div", { class: "lab", style: "margin:0" }, t("billMine")),
      list.length ? h("div", { class: "bill-ords" }, list.map(function (o) { return h("span", { class: "num" }, "#" + o.code + "  " + money(orderSum(o))); })) : h("div", { class: "bill-ords" }, t("billEmpty"))),
    sum ? h("div", { class: "bill-tot" }, h("small", null, t("billTotal")), h("b", { class: "num" }, money(sum))) : null);
  if (api.qr && qrReady()) {
    var info = "Ban " + S.table;
    var src = "https://img.vietqr.io/image/" + c.bank + "-" + c.acct + "-compact2.png?amount=" + sum + "&addInfo=" + encodeURIComponent(info) + (c.name ? "&accountName=" + encodeURIComponent(c.name) : "");
    return h("div", { class: "svc-more bill" }, head,
      h("div", { class: "qr-box" },
        h("img", { class: "qr", src: src, alt: "VietQR", width: "260", height: "300", onerror: function (e) { e.target.remove(); } }),
        h("p", { class: "qr-hint" }, t("qrScan"))),
      h("div", { class: "qr-acc" },
        h("div", null, h("small", null, t("qrTo")), h("b", null, (c.name || "") + (c.bankName ? " · " + c.bankName : "")), h("span", { class: "num" }, c.acct)),
        h("button", { class: "ghost press", onclick: function (e) {
          var b = e.currentTarget; try { navigator.clipboard.writeText(c.acct).then(function () { b.lastChild.textContent = t("copied"); buzz(8); }); } catch (x) {}
        } }, ic("copy", 18), h("span", null, t("copy")))),
      h("button", { class: "go press", disabled: !sum, onclick: function (e) {
        var ids = list.map(function (o) { return o.id; });
        Promise.resolve(sendReq("bill", "qrpaid" + (sum ? ":" + sum : ""), e.currentTarget)).then(function () {
          S.paid = S.paid.concat(ids).slice(-40); save("cm-paid", S.paid); api.qr = false; api.bill = false; toast(t("qrPaidToast")); if (openSheet) openSheet.rebuild();
        });
      } }, h("span", null, t("qrPaid"))));
  }
  return h("div", { class: "svc-more bill" }, head, h("div", { class: "lab" }, t("billHow")), h("div", { class: "billrow" },
    (qrReady() ? [h("button", { class: "pill press qr-pill", onclick: function () { api.qr = true; buzz(6); api.rebuild(); } }, ic("bill", 16), t("qrAsk"))] : []).concat(
    ["cash", "card", "transfer"].filter(function (m) { return !(m === "transfer" && qrReady()); }).map(function (m) {
      return h("button", { class: "pill press", onclick: function (e) { api.bill = false; sendReq("bill", m + (sum ? ":" + sum : ""), e.currentTarget); } }, t(m));
    }))));
}

/* rating after the food arrives: low marks go to the manager, good ones are invited to Google */
function rateBox(o, onDone) {
  var rs = rateBox.st[o.id] = rateBox.st[o.id] || { n: 0, step: "ask", tx: "" };
  var box = h("div", { class: "rate" });
  function finish() { S.rated[o.id] = Date.now(); save("cm-rated", S.rated); renderRate(); }
  function send() {
    rs.step = "sent"; draw();
    Store.addFeedback({ table: S.table, order: o.id, rating: rs.n, comment: rs.tx, lang: S.lang }).then(function () {}, function () {});
    S.rated[o.id] = Date.now(); save("cm-rated", S.rated);
    if (!(rs.n >= 4 && S.cfg && S.cfg.review)) setTimeout(function () { renderRate(); if (onDone) onDone(); }, 2600);
  }
  function draw() {
    if (rs.step === "sent") {
      fill(box, h("b", null, rs.n >= 4 ? t("rateThanks") : t("rateBadThanks")),
        rs.n >= 4 && S.cfg && /^https:\/\//.test(S.cfg.review || "") ? h("a", { class: "go press g-review", href: S.cfg.review, target: "_blank", rel: "noopener", onclick: function () { setTimeout(function () { renderRate(); if (onDone) onDone(); }, 400); } },
          h("span", null, t("rateGoogle")), h("small", null, t("rateGoogleSub"))) : null);
      return;
    }
    fill(box,
      h("div", { class: "rate-hd" }, h("b", null, t("rateQ")), onDone ? h("button", { class: "x press", "aria-label": t("later"), onclick: function () { finish(); onDone(); } }, ic("x", 18)) : null),
      rs.step === "ask" ? h("p", null, t("rateSub")) : null,
      h("div", { class: "stars", role: "radiogroup", "aria-label": t("rateQ") }, [1, 2, 3, 4, 5].map(function (n) {
        return h("button", { class: "press" + (n <= rs.n ? " on" : ""), role: "radio", "aria-checked": String(n === rs.n), "aria-label": n + "/5", onclick: function () {
          rs.n = n; buzz(8);
          if (n >= 4) send(); else { rs.step = "why"; draw(); var ta = box.querySelector("textarea"); if (ta) ta.focus(); }
        } }, ic("star", 30));
      })),
      rs.step === "why" ? h("div", { class: "rate-why" }, h("b", null, t("rateBadQ")),
        (function () { var ta = h("textarea", { maxlength: "400", rows: "2", placeholder: t("ratePh"), oninput: function (e) { rs.tx = e.target.value; } }); ta.value = rs.tx; return ta; })(),
        h("button", { class: "go press", onclick: send }, h("span", null, t("rateSend")))) : null);
  }
  draw();
  return box;
}
rateBox.st = {};
var rateEl = null;
function rateShowing(o) { var r = rateBox.st[o.id]; return !S.rated[o.id] || (r && r.step === "sent" && Date.now() - S.rated[o.id] < 45000); }
function rateDue() {
  if (S.view !== "guest" || openSheet || cartCount()) return null;
  return S.orders.find(function (o) {
    var at = S.served[o.id];
    return S.mineO.indexOf(o.id) >= 0 && o.status === "served" && at && rateShowing(o) && Date.now() - at > 8 * 60000 && Date.now() - at < 4 * 3600000;
  }) || null;
}
function renderRate() {
  var o = rateDue();
  if (!o) { if (rateEl) { var el = rateEl; rateEl = null; el.classList.remove("in"); setTimeout(function () { el.remove(); }, 400); } return; }
  if (rateEl && rateEl.getAttribute("data-o") === o.id) return;
  if (rateEl) rateEl.remove();
  rateEl = h("div", { class: "rate-pop", "data-o": o.id }, rateBox(o, function () { renderRate(); }));
  document.body.append(rateEl);
  requestAnimationFrame(function () { rateEl && rateEl.classList.add("in"); });
}
setInterval(function () { if (!document.hidden) renderRate(); }, 30000);

/* connection line for guests */
var netEl = null;
function renderNet() {
  var off = S.view === "guest" && S.offline;
  if (!off) { if (netEl) { netEl.remove(); netEl = null; } return; }
  if (!netEl) { netEl = h("div", { class: "netbar", role: "status" }, ic("wifi", 16), h("span", null, t("offline"))); document.body.append(netEl); }
}

function openBill() { openService(); if (openSheet) { openSheet.bill = true; openSheet.rebuild(); } }

/* status sheet */
function openStatus() {
  sheet(function (body) {
    var mine = S.orders.filter(function (o) { return S.mineO.indexOf(o.id) >= 0; }).slice(0, 6);
    var reqs = S.reqs.filter(function (r) { return S.mineR.indexOf(r.id) >= 0; }).slice(0, 8);
    fill(body,
      h("div", { class: "s-title" }, h("h2", null, t("myTable") + " · " + S.table)),
      repeatCard(true),
      S.outbox.map(function (b) {
        return h("article", { class: "ord" + (b.failed ? " bad" : " wait") },
          h("div", { class: "hd" }, h("b", null, t("order") + " " + b.o.code), h("span", null, ago(b.at))),
          h("div", { style: "font-weight:700;font-size:17px" }, b.failed ? t("failedOrd") : t("stLong_queued")),
          h("div", { class: "prog" }, h("i", { style: "width:" + (b.failed ? 100 : 10) + "%" })),
          h("ul", null, b.o.items.map(function (x) { var it = BY[x.id]; return it ? h("li", null, x.q + " × " + nm(it)) : null; })),
          b.failed ? h("div", { class: "ord-acts" },
            h("button", { class: "ghost press", onclick: function () { b.failed = false; b.at = Date.now(); saveOutbox(); flushOutbox(); openSheet && openSheet.rebuild(); renderDock(); } }, t("retry")),
            h("button", { class: "ghost press", onclick: function () { S.outbox = S.outbox.filter(function (x) { return x !== b; }); saveOutbox(); renderDock(); closeSheet(); setTimeout(openService, 220); } }, ic("bell", 18), t("callStaff"))) : null);
      }),
      mine.length ? mine.map(function (o) {
        var idx = ["new", "accepted", "served"].indexOf(o.status);
        return h("article", { class: "ord" },
          h("div", { class: "hd" }, h("b", null, t("order") + " " + o.code), h("span", null, ago(o.createdAt))),
          h("div", { style: "font-weight:700;font-size:17px" }, t("stLong_" + o.status)),
          h("div", { class: "prog" }, h("i", { style: "width:" + [22, 60, 100][idx] + "%" })),
          h("div", { class: "steps" }, ["new", "accepted", "served"].map(function (k, i) { return h("span", { class: i <= idx ? "on" : "" }, t("st_" + k)); })),
          h("ul", null, o.items.map(function (x) { var it = BY[x.id]; var opt = lineOpt(it, x); return h("li", null, x.q + " × " + nm(it) + (opt ? " · " + opt : "")); })),
          o.status === "served" && rateShowing(o) ? rateBox(o) : null);
      }) : S.outbox.length ? null : h("p", { class: "empty" }, t("none")),
      reqs.length ? h("div", null, h("div", { class: "lab" }, t("requests")),
        h("div", { style: "display:flex;flex-direction:column;gap:8px" }, reqs.map(function (r) {
          var s = SVC.find(function (x) { return x.k === r.kind; });
          var bx = billEx(r.extra), label = r.kind === "bill" ? t("bill") + (BILL[bx.k] ? " · " + BILL[bx.k][S.lang] : "") + (bx.sum ? " · " + money(bx.sum) : "") : r.kind === "other" ? r.extra : nm(s);
          return h("div", { class: "req" + (r.status === "done" ? " done" : "") }, h("span", { class: "ic" }, ic(r.status === "done" ? "check" : (s ? s.ic : r.kind === "bill" ? "bill" : "pen"), 20)),
            h("div", null, h("b", null, label), h("span", null, t("rq_" + r.status) + " · " + ago(r.createdAt))));
        }))) : null);
  }, { label: t("myTable"), kind: "status" });
}
function ago(ts) { var m = Math.floor((Date.now() - ts) / 60000); return m < 1 ? t("now") : m + " " + t("ago"); }

/* search */
var searchEl = null;
function openSearch() {
  var res = h("div", { class: "res" });
  var input = h("input", { type: "search", placeholder: t("searchPh"), "aria-label": t("search"), oninput: function () { draw(); } });
  searchEl = h("div", { class: "search", role: "dialog", "aria-label": t("search") },
    h("div", { class: "sb" }, input, h("button", { class: "icon-btn press", "aria-label": t("cancel"), onclick: closeSearch }, ic("x", 22))), res);
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
  function draw() {
    var q = norm(input.value.trim());
    if (!q) { res.replaceChildren(); return; }
    function score(it) {
      var best = 99;
      LANGS.forEach(function (l) { var n = norm(it.n[l]); if (n.indexOf(q) === 0) best = Math.min(best, 0); else if (n.indexOf(" " + q) >= 0) best = Math.min(best, 1); else if (n.indexOf(q) >= 0) best = Math.min(best, 2); });
      if (best === 99 && it.d && norm(it.d[S.lang]).indexOf(q) >= 0) best = 3;
      return best;
    }
    var found = M.items.filter(function (it) { return !it.hide; }).map(function (it) { return { it: it, s: score(it) }; }).filter(function (x) { return x.s < 99; })
      .sort(function (a, b) { return a.s - b.s; }).slice(0, 40).map(function (x) { return x.it; });
    res.replaceChildren.apply(res, found.length ? found.map(function (it) {
      var r = rowFor(it);
      r.onclick = function () { closeSearch(); if (!S.stop[it.id]) setTimeout(function () { openDish(it.id); }, 200); };
      var b = r.querySelector("[data-add]"); if (b) b.onclick = function (e) { e.stopPropagation(); closeSearch(); setTimeout(function () { openDish(it.id); }, 200); };
      return r;
    }) : [h("div", { class: "empty-s" }, h("p", null, t("nothing")), h("p", { class: "sub" }, t("nothingHint")),
        h("button", { class: "ghost press", onclick: function () { closeSearch(); setTimeout(openService, 220); } }, ic("bell", 18), t("callStaff")))]);
  }
  document.body.append(searchEl); document.body.style.overflow = "hidden";
  requestAnimationFrame(function () { searchEl.classList.add("in"); input.focus(); });
}
function closeSearch() { if (!searchEl) return; var s = searchEl; searchEl = null; s.classList.remove("in"); document.body.style.overflow = ""; setTimeout(function () { s.remove(); }, 350); }

/* ---------- staff ---------- */
var audio = null, seenIds = null, staffTimer = 0, wake = null;
function chime(kind) {
  if (!S.sound || !audio) return;
  try {
    var notes = kind === "req" ? [988, 784, 988] : [784, 1175];
    notes.forEach(function (f, i) {
      var o = audio.createOscillator(), g = audio.createGain(), at = audio.currentTime + i * 0.18;
      o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      o.start(at); o.stop(at + 0.3);
    });
  } catch (e) {}
}
function staffName(it) { return S.staffLang === "vi" ? it.n.vi : (it.n[S.staffLang] || it.n.en); }
function mins(ts) { return Math.max(0, Math.floor((Date.now() - ts) / 60000)); }
function staffErr(e) { if (e && /pin/i.test(e.message || "")) { save("cm-pin", ""); S.pinOk = false; renderStaff(); } else toast(st("netErr"), "x"); }
function pinScreen() {
  var val = "", err = "";
  var root = h("div", { class: "pin" });
  function draw() {
    root.replaceChildren(
      h("img", { src: "img/logo.png", alt: "Casa Mika", class: "pin-logo" }),
      h("h1", null, st("title")),
      h("p", null, err || st("pinHint")),
      h("div", { class: "pin-dots" + (err ? " shake" : ""), "aria-label": st("pinHint") }, [0, 1, 2, 3].map(function (i) { return h("span", { class: i < val.length ? "on" : "" }); })),
      h("div", { class: "pin-pad" }, ["1","2","3","4","5","6","7","8","9","","0","del"].map(function (k) {
        if (!k) return h("span");
        return h("button", { class: "press", "aria-label": k === "del" ? "Delete" : k, onclick: function () {
          if (k === "del") val = val.slice(0, -1); else if (val.length < 6) val += k;
          err = ""; draw();
          if (val.length >= 4) Store.checkPin(val).then(function (ok) {
            if (ok) { save("cm-pin", val); S.pinOk = true; renderStaff(); }
            else if (val.length >= 6) { err = st("pinBad"); val = ""; draw(); }
          }, function () { err = st("netErr"); draw(); });
        } }, k === "del" ? ic("x", 22) : k);
      })),
      h("div", { class: "lang", role: "group", style: "margin-top:8px" }, h("span", { class: "knob", style: "transform:translateX(" + (S.staffLang === "en" ? 100 : 0) + "%)" }),
        ["vi", "en"].map(function (l, i) { return h("button", { "aria-pressed": String(S.staffLang === l), onclick: function (e) { if (S.staffLang === l) return; slideKnob(e.currentTarget.parentElement, i, function () { S.staffLang = l; save("cm-staff-lang", l); draw(); }); } }, l === "vi" ? "Việt" : "Eng"); })));
  }
  draw();
  return root;
}
function renderStaff() {
  if (Store.live() && !S.pinOk) {
    var p = load("cm-pin", "");
    if (!p) { document.getElementById("app").replaceChildren(pinScreen()); return; }
    S.pinOk = true;
  }
  document.documentElement.lang = S.staffLang;
  var reqs = S.reqs.filter(function (r) { return r.status === "new"; }).slice().reverse();
  var lanes = { new: [], accepted: [], served: [] };
  S.orders.forEach(function (o) { lanes[o.status].push(o); });
  lanes.new.reverse(); lanes.accepted.reverse(); lanes.served = lanes.served.slice(0, 12);
  var now = new Date();
  var langs = ["vi", "en"];
  var head = h("header", { class: "s-head" },
    h("div", { class: "s-id" }, h("img", { src: "img/logo.png", alt: "Casa Mika" }), h("h1", null, st("title")), h("span", { class: "clock num" }, String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"))),
    h("div", { class: "s-tools" },
      h("div", { class: "lang", role: "group", "aria-label": "Language" }, h("span", { class: "knob", style: "transform:translateX(" + (langs.indexOf(S.staffLang) * 100) + "%)" }),
        langs.map(function (l, i) { return h("button", { "aria-pressed": String(S.staffLang === l), onclick: function (e) { if (S.staffLang === l) return; slideKnob(e.currentTarget.parentElement, i, function () { S.staffLang = l; save("cm-staff-lang", l); renderStaff(); }); } }, l === "vi" ? "Việt" : "Eng"); })),
      h("button", { class: "press", "aria-pressed": String(S.sound), onclick: toggleSound }, ic("sound", 20), S.sound ? st("soundOn") : st("sound")),
      h("button", { class: "press", onclick: openStop }, ic("ban", 20), st("stop") + (Object.keys(S.stop).length ? " · " + Object.keys(S.stop).length : "")),
      h("button", { class: "press", onclick: clearDone }, ic("trash", 20), st("clear")),
      h("a", { href: "#table-" + S.table }, st("guest"))));
  var notice = S.store === "local" ? h("p", { class: "demo", style: "margin:0" }, T[S.staffLang === "vi" ? "vi" : S.staffLang].demo)
    : (S.offline || S.rtDown || S.slow) ? h("p", { class: "netdown", role: "alert" }, ic("wifi", 22), st("offline")) : null;
  keepAwake();
  function lane(k, title, list, card) {
    return h("section", { class: "lane", "data-k": k }, h("h2", null, h("span", null, title), h("b", { class: "num" }, list.length)),
      list.length ? list.map(card) : h("p", { class: "s-empty" }, st("none")));
  }
  var board = h("div", { class: "lanes" },
    lane("req", st("req"), reqs, reqCard), lane("new", st("new"), lanes.new, orderCard), lane("accepted", st("accepted"), lanes.accepted, orderCard), lane("served", st("served"), lanes.served, orderCard));
  document.getElementById("app").replaceChildren(h("div", { class: "staff" }, head, notice, board));
  staffGlow(null);
}
/* the bar tablet must never fall asleep */
var wakeAsk = 0;
function keepAwake() {
  if (!navigator.wakeLock || document.hidden || (wake && !wake.released) || Date.now() - wakeAsk < 10000) return;
  wakeAsk = Date.now();
  try { navigator.wakeLock.request("screen").then(function (w) { wake = w; }, function () {}); } catch (e) {}
}
document.addEventListener("visibilitychange", function () { if (!document.hidden && S.view === "staff") { wakeAsk = 0; keepAwake(); } });
window.addEventListener("offline", function () { if (S.view === "staff") renderStaff(); });
window.addEventListener("online", function () { if (S.view === "staff") renderStaff(); });
function timeTag(ts, warnAt, lateAt) {
  var m = mins(ts);
  return h("span", { class: "tm num" + (m >= lateAt ? " late" : m >= warnAt ? " warn" : "") }, m + " " + st("min"));
}
function reqCard(r) {
  var s = SVC.find(function (x) { return x.k === r.kind; });
  var bx = billEx(r.extra), label = r.kind === "bill" ? st("bill") + (BILL[bx.k] ? " · " + BILL[bx.k][S.staffLang === "vi" ? "vi" : S.staffLang] : "") + (bx.sum ? " · " + money(bx.sum, "vi") : "")
    : r.kind === "other" ? r.extra : (s.n[S.staffLang] || s.n.vi);
  return h("article", { class: "tk" },
    h("div", { class: "hd" }, h("span", { class: "tb" }, st("table") + " " + r.table), timeTag(r.createdAt, 2, 4)),
    h("div", { class: "rq" }, h("span", { class: "ic" }, ic(s ? s.ic : r.kind === "bill" ? "bill" : "pen", 26)), h("b", null, label)),
    h("button", { class: "act ok press", onclick: function () { Promise.resolve(Store.setReq(r.id, { status: "done" })).catch(staffErr); } }, ic("check", 20), st("done")));
}
function orderCard(o) {
  var total = o.items.reduce(function (s, x) { return s + itemPrice(BY[x.id], x.v) * x.q; }, 0);
  var next = o.status === "new" ? "accepted" : o.status === "accepted" ? "served" : null;
  return h("article", { class: "tk" },
    h("div", { class: "hd" }, h("span", { class: "tb" }, st("table") + " " + o.table), o.status === "served" ? h("span", { class: "tm num" }, mins(o.createdAt) + " " + st("min")) : timeTag(o.createdAt, o.status === "new" ? 2 : 10, o.status === "new" ? 4 : 15)),
    h("ul", null, o.items.map(function (x) {
      var it = BY[x.id], parts = [];
      if (it.v && x.v != null && it.v[x.v]) parts.push(S.staffLang === "vi" ? it.v[x.v].n.vi : (it.v[x.v].n[S.staffLang] || it.v[x.v].n.en));
      if (SPICY_SEC[it.sec]) parts.push(x.sp ? st("spicy") : st("nospicy"));
      return h("li", null, x.q + " × " + staffName(it), parts.length ? h("small", null, parts.join(" · ")) : null);
    })),
    o.chips.length ? h("div", { class: "asks" }, o.chips.map(function (c) { return CHIPS[c][S.staffLang === "vi" ? "vi" : S.staffLang]; }).join(" · ")) : null,
    o.note ? h("div", { class: "note" }, h("small", null, st("guestNote") + " (" + o.lang.toUpperCase() + ")"), o.note) : null,
    h("div", { style: "display:flex;justify-content:space-between;color:var(--faint);font-size:13px;font-weight:600" }, h("span", null, "#" + o.code), h("span", { class: "num" }, money(total, "vi"))),
    next ? h("button", { class: "act press", onclick: function () { Promise.resolve(Store.setOrder(o.id, { status: next })).catch(staffErr); } }, next === "accepted" ? st("accept") : st("serve")) : null);
}
function toggleSound() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {}
  S.sound = !S.sound;
  if (S.sound) { chime("order"); try { navigator.wakeLock && navigator.wakeLock.request("screen").then(function (w) { wake = w; }, function () {}); } catch (e) {} }
  renderStaff();
}
function clearDone() {
  if (Store.live()) { Store.clearDone().catch(staffErr); return; }
  S.orders.filter(function (o) { return o.status === "served"; }).forEach(function (o) { Store.delOrder(o.id).catch(function () {}); });
  S.reqs.filter(function (r) { return r.status === "done"; }).forEach(function (r) { Store.delReq(r.id).catch(function () {}); });
}
function openStop() {
  sheet(function (body, api) {
    var q = api.q || "";
    function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
    var list = M.items.filter(function (it) { return SEC[it.sec].group !== "bar" || it.sec === "signature" || it.sec === "classic" || it.sec === "beer"; })
      .filter(function (it) { return !q || norm(it.n.vi + " " + it.n[S.staffLang]).indexOf(norm(q)) >= 0; });
    var input = h("input", { type: "search", value: q, placeholder: st("search"), "aria-label": st("search"), style: "width:100%;height:48px;border-radius:14px;border:1.5px solid var(--line);background:rgba(251,246,238,.05);padding:0 14px",
      oninput: function (e) { api.q = e.target.value; var pos = e.target.selectionStart; api.rebuild(); var n = body.querySelector("input"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } });
    fill(body, h("div", { style: "padding:8px 52px 0 0" }, h("h2", null, st("stop")), h("p", { style: "margin:6px 0 0;color:var(--soft)" }, st("stopHint"))), input,
      h("div", { class: "stop-grid" }, list.map(function (it) {
        return h("button", { class: "press", "aria-pressed": String(!!S.stop[it.id]), onclick: function () {
          var ids = Object.assign({}, S.stop); if (ids[it.id]) delete ids[it.id]; else ids[it.id] = true; S.stop = ids; Store.setStop(ids).catch(staffErr); api.rebuild(); } }, staffName(it));
      })));
  }, { label: st("stop"), kind: "stop" });
}


/* ---------- screen-edge glow ---------- */
var glowEl = null, glowTimer = 0, glowBusy = false;
function glow(kind, mode) {
  if (!glowEl) { glowEl = h("div", { class: "glow", "aria-hidden": "true" }, h("b", null, h("i")), h("i")); document.body.append(glowEl); }
  clearTimeout(glowTimer); glowBusy = false;
  if (mode === "off") { glowEl.className = "glow"; return; }
  if (mode === "breathe" && glowEl.classList.contains("breathe") && glowEl.classList.contains("k-" + kind)) return;
  glowEl.className = "glow k-" + kind;
  void glowEl.offsetWidth;
  glowEl.classList.add(mode === "breathe" ? "breathe" : "burst");
  if (mode === "burst") { glowBusy = true; glowTimer = setTimeout(function () { glowBusy = false; glowEl.className = "glow"; if (S.view === "staff") staffGlow(null); }, 2450); }
}
function staffGlow(fresh) {
  var reqs = S.reqs.some(function (r) { return r.status === "new"; });
  var ords = S.orders.some(function (o) { return o.status === "new"; });
  if (Store.live() && !S.pinOk) { glow("order", "off"); return; }
  if (fresh) { glow(fresh, "burst"); return; }
  if (glowBusy) return;
  if (!reqs && !ords) glow("order", "off"); else glow(reqs ? "req" : "order", "breathe");
}

/* ---------- render + data changes ---------- */
var lastStop = "";
function render() {
  closeSheet(true);
  if (S.view === "staff") { window.onscroll = null; renderStaff(); clearInterval(staffTimer); staffTimer = setInterval(function () { if (S.view === "staff" && !openSheet) renderStaff(); }, 20000); }
  else { clearInterval(staffTimer); glow("order", "off"); renderGuest(); }
  renderNet();
}
Store.on(function () {
  if (S.view === "admin") { if (window.CM_ADMIN) window.CM_ADMIN.refresh(); return; }
  /* chimes for the bar */
  var ids = {}; S.orders.forEach(function (o) { ids["o" + o.id] = o.status; }); S.reqs.forEach(function (r) { ids["r" + r.id] = r.status; });
  if (seenIds && S.view === "staff") {
    var newReq = S.reqs.some(function (r) { return r.status === "new" && !seenIds["r" + r.id]; });
    var newOrd = S.orders.some(function (o) { return o.status === "new" && !seenIds["o" + o.id]; });
    if (newReq) chime("req"); else if (newOrd) chime("order");
    staffGlow(newReq ? "req" : newOrd ? "order" : null);
  } else if (S.view === "staff") staffGlow(null);
  /* guest: tell when the bar moves my order or finishes my request */
  if (seenIds && S.view === "guest") {
    var srv = false;
    S.orders.forEach(function (o) { if (S.mineO.indexOf(o.id) >= 0 && o.status === "served" && !S.served[o.id]) { S.served[o.id] = Date.now(); srv = true; } });
    if (srv) { var keep = {}; Object.keys(S.served).filter(function (k) { return Date.now() - S.served[k] < 86400000; }).forEach(function (k) { keep[k] = S.served[k]; }); S.served = keep; save("cm-served", keep); }
    S.orders.forEach(function (o) { if (S.mineO.indexOf(o.id) >= 0 && seenIds["o" + o.id] && seenIds["o" + o.id] !== o.status) { toast(t("stLong_" + o.status), o.status === "served" ? "check" : "clock"); buzz([20, 80, 20]); glow(o.status === "served" ? "ok" : "order", "burst"); } });
    S.reqs.forEach(function (r) { if (S.mineR.indexOf(r.id) >= 0 && seenIds["r" + r.id] === "new" && r.status === "done") toast(t("rq_done")); });
  }
  seenIds = ids;
  if (S.view === "staff") { if (!openSheet || openSheet.kind !== "stop") renderStaff(); return; }
  var stopKey = JSON.stringify(S.stop);
  if (stopKey !== lastStop && menuEl) { lastStop = stopKey; if (!openSheet) { var y = window.scrollY; buildMenu(); window.scrollTo(0, y); } }
  renderDock();
  if (openSheet && (openSheet.kind === "status" || openSheet.kind === "service") && !(document.activeElement && document.activeElement.tagName === "TEXTAREA")) openSheet.rebuild();
  renderStoreNote(); renderRate(); renderNet();
  var go = document.querySelector(".sheet .go[data-wait]"); if (go && S.store !== "loading") { go.disabled = false; go.removeAttribute("data-wait"); }
});

/* ---------- boot ---------- */
var T0 = performance.now();
function boot() {
  fetch("menu.json?v=" + (window.CM_VER || 1)).then(function (r) { return r.json(); }).then(function (data) {
    M = data;
    M.sections.forEach(function (s) { SEC[s.id] = s; if (s.note && /spicy/i.test(s.note.en)) SPICY_SEC[s.id] = true; });
    M.items.forEach(function (it) { BY[it.id] = it; it.tags = it.tags || []; BASE[it.id] = JSON.parse(JSON.stringify(it)); });
    S.cart = (S.cart || []).filter(function (l) { return l && BY[l.id]; });
    window.addEventListener("hashchange", route);
    route();
    Store.boot();
    setTimeout(flushOutbox, 1200);
    var sp = document.getElementById("splash");
    if (sp) { var wait = Math.max(0, (S.view === "guest" ? 1700 : 1200) - (performance.now() - T0)); setTimeout(function () { sp.classList.add("gone"); splashDone = true; setTimeout(function () { sp.remove(); }, 900); }, wait); }
  }, function () {
    document.getElementById("app").textContent = "Menu failed to load. Reload the page.";
  });
}
boot();
})();
