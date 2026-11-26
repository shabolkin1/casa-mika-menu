/* Casa Mika: manager screen (#admin). Prices, availability, names and texts in 4 languages, photos.
   Loaded on demand by app.js; uses its helpers through window.CM. Staff languages: Vietnamese and English. */
(function () {
"use strict";
var C = window.CM, h = C.h, ic = C.ic, S = C.S, Store = C.Store;
var L = {
  vi: { title: "Quản lý thực đơn", pinHint: "Nhập mã PIN quản lý (6 số)", pinBad: "Sai mã PIN, thử lại", needLive: "Cần kết nối mạng để quản lý thực đơn.",
    search: "Tìm món", all: "Tất cả", edited: "Đã chỉnh", hidden: "Đang ẩn", out: "Hết món", inStock: "Còn món", price: "Giá", from: "từ",
    show: "Hiện trong thực đơn", showHint: "Tắt để ẩn món khỏi trang khách", changePhoto: "Đổi ảnh", origPhoto: "Dùng ảnh gốc", name: "Tên món", desc: "Mô tả ngắn", story: "Câu chuyện về món",
    keep: "Để trống: giữ bản gốc", save: "Lưu", saving: "Đang lưu…", saved: "Đã lưu. Khách thấy ngay.", reset: "Khôi phục bản gốc", resetAsk: "Bấm lần nữa để khôi phục",
    pins: "Mã PIN", staffPin: "PIN màn hình nhân viên (4–6 số)", adminPin: "PIN quản lý (6 số)", pinSave: "Đổi mã PIN", pinSaved: "Đã đổi mã PIN", pinWrong: "PIN không hợp lệ",
    guest: "Trang khách", staff: "Màn hình nhân viên",
    pay: "Thanh toán QR & Google", payHint: "Khách chọn thanh toán, thấy mã VietQR với số tiền đã điền sẵn.", bank: "Ngân hàng", pick: "Chọn ngân hàng", acct: "Số tài khoản", acctName: "Tên chủ tài khoản (không dấu)",
    review: "Link đánh giá Google", reviewHint: "Google Maps → quán → Đánh giá → Chia sẻ. Khách hài lòng sẽ được mời để lại đánh giá.", preview: "Mã thử với 10.000 ₫", payOff: "Để trống ngân hàng để tắt QR",
    tg: "Thông báo Telegram", tgOn: "Đã kết nối. Bot sẽ báo khi đơn chờ quá 5 phút và khi khách chấm 1–3 sao.", tgOff: "Chưa kết nối",
    tg1: "Mở Telegram, tìm @BotFather, gửi /newbot và đặt tên bot.", tg2: "Dán mã bot (token) mà BotFather gửi:", tg3: "Mở bot vừa tạo và bấm Start.", tg4: "Kết nối",
    tgBusy: "Đang kết nối…", tgNoMsg: "Chưa thấy tin nhắn. Mở bot, bấm Start rồi thử lại.", tgBadTok: "Mã bot không đúng", tgDone: "Đã kết nối. Kiểm tra tin nhắn thử trong Telegram.", tgTest: "Casa Mika: thông báo đã được bật.", tgCut: "Ngắt kết nối",
    fb: "Đánh giá của khách", fbNone: "Chưa có đánh giá", fbAvg: "Trung bình", fbTable: "Bàn", err: "Không lưu được, thử lại", photoBusy: "Đang xử lý ảnh…", photoOk: "Đã đổi ảnh", logout: "Thoát", more: "Thêm", empty: "Không tìm thấy món", count: "món" },
  en: { title: "Menu manager", pinHint: "Enter the manager PIN (6 digits)", pinBad: "Wrong PIN, try again", needLive: "The menu manager needs an internet connection.",
    search: "Find a dish", all: "All", edited: "Edited", hidden: "Hidden", out: "Sold out", inStock: "Available", price: "Price", from: "from",
    show: "Show on the menu", showHint: "Turn off to hide the dish from guests", changePhoto: "Change photo", origPhoto: "Use original photo", name: "Name", desc: "Short description", story: "Story of the dish",
    keep: "Empty: keep the original", save: "Save", saving: "Saving…", saved: "Saved. Guests see it right away.", reset: "Restore original", resetAsk: "Tap again to restore",
    pins: "PINs", staffPin: "Staff screen PIN (4–6 digits)", adminPin: "Manager PIN (6 digits)", pinSave: "Change PINs", pinSaved: "PINs changed", pinWrong: "Invalid PIN",
    guest: "Guest page", staff: "Staff screen",
    pay: "QR payment & Google", payHint: "Guests choose to pay and see a VietQR code with the amount filled in.", bank: "Bank", pick: "Choose a bank", acct: "Account number", acctName: "Account holder (no accents)",
    review: "Google review link", reviewHint: "Google Maps → the café → Reviews → Share. Happy guests are invited to leave a review.", preview: "Test code for 10,000 ₫", payOff: "Leave the bank empty to turn QR off",
    tg: "Telegram alerts", tgOn: "Connected. The bot writes when an order waits over 5 minutes and when a guest gives 1–3 stars.", tgOff: "Not connected",
    tg1: "Open Telegram, find @BotFather, send /newbot and name the bot.", tg2: "Paste the bot token that BotFather sends:", tg3: "Open your new bot and press Start.", tg4: "Connect",
    tgBusy: "Connecting…", tgNoMsg: "No message yet. Open the bot, press Start, then try again.", tgBadTok: "Wrong bot token", tgDone: "Connected. Check the test message in Telegram.", tgTest: "Casa Mika: alerts are on.", tgCut: "Disconnect",
    fb: "Guest ratings", fbNone: "No ratings yet", fbAvg: "Average", fbTable: "Table", err: "Could not save, try again", photoBusy: "Processing photo…", photoOk: "Photo changed", logout: "Log out", more: "More", empty: "No dishes found", count: "dishes" }
};
var lang = C.load("cm-staff-lang", "vi") === "en" ? "en" : "vi";
function a(k) { return L[lang][k] || L.en[k] || k; }
var st = { group: "food", q: "", filter: "all", ok: false };
var root = null, listEl = null;

function dishName(it) { return lang === "vi" ? it.n.vi : (it.n.en || it.n.vi); }
function priceText(it) { return (it.v ? a("from") + " " : "") + C.money(it.p, "vi"); }
function edited(id) { return !!(C.EDITS[id] && Object.keys(C.EDITS[id]).length) || !!C.PHOTO_IDS[id]; }
function langToggle(onchange) {
  return h("div", { class: "lang", role: "group", style: "grid-auto-columns:48px" }, h("span", { class: "knob", style: "width:48px;transform:translateX(" + (lang === "en" ? 100 : 0) + "%)" }),
    ["vi", "en"].map(function (l, i) { return h("button", { "aria-pressed": String(lang === l), onclick: function (e) { if (lang === l) return; C.slideKnob(e.currentTarget.parentElement, i, function () { lang = l; C.save("cm-staff-lang", l); S.staffLang = l; onchange(); }); } }, l === "vi" ? "Việt" : "Eng"); }));
}

/* ---------- PIN ---------- */
function pinScreen() {
  var val = "", err = "";
  var box = h("div", { class: "pin" });
  function draw() {
    if (!Store.live()) { C.fill(box, h("img", { src: "img/logo.png", alt: "Casa Mika", class: "pin-logo" }), h("h1", null, a("title")), h("p", null, a("needLive"))); return; }
    C.fill(box,
      h("img", { src: "img/logo.png", alt: "Casa Mika", class: "pin-logo" }),
      h("h1", null, a("title")),
      h("p", null, err || a("pinHint")),
      h("div", { class: "pin-dots" + (err ? " shake" : "") }, [0, 1, 2, 3, 4, 5].map(function (i) { return h("span", { class: i < val.length ? "on" : "" }); })),
      h("div", { class: "pin-pad" }, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(function (k) {
        if (!k) return h("span");
        return h("button", { class: "press", "aria-label": k === "del" ? "Delete" : k, onclick: function () {
          if (k === "del") val = val.slice(0, -1); else if (val.length < 6) val += k;
          err = ""; draw();
          if (val.length === 6) Store.adminCheck(val).then(function (ok) {
            if (ok) { C.save("cm-admin-pin", val); st.ok = true; open(); } else { err = a("pinBad"); val = ""; draw(); }
          }, function () { err = a("err"); val = ""; draw(); });
        } }, k === "del" ? ic("x", 22) : k);
      })),
      langToggle(draw));
  }
  draw();
  return box;
}

/* ---------- list ---------- */
function open() {
  document.documentElement.lang = lang;
  var app = document.getElementById("app");
  if (!Store.live() || !C.load("cm-admin-pin", "")) { app.replaceChildren(pinScreen()); return; }
  var M = C.M;
  var seg = h("div", { class: "seg", role: "group" }, h("span", { class: "knob", style: "transform:translateX(" + (["food", "drinks", "bar"].indexOf(st.group) * 100) + "%)" }),
    ["food", "drinks", "bar"].map(function (g, i) { var gr = M.groups.find(function (x) { return x.id === g; }); return h("button", { "aria-pressed": String(st.group === g), onclick: function (e) { if (st.group === g) return; st.group = g; C.slideKnob(e.currentTarget.parentElement, i); listEl.classList.add("swap"); setTimeout(function () { drawList(); listEl.classList.remove("swap"); window.scrollTo(0, 0); }, 200); } }, gr.n[lang] || gr.n.en); }));
  var search = h("input", { type: "search", value: st.q, placeholder: a("search"), "aria-label": a("search"), oninput: function (e) { st.q = e.target.value; drawList(); } });
  var filters = h("div", { class: "ad-filters" }, ["all", "edited", "hidden", "out"].map(function (f) {
    return h("button", { class: "pill press", "aria-pressed": String(st.filter === f), onclick: function (e) { st.filter = f; e.currentTarget.parentElement.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === e.currentTarget)); }); drawList(); } }, a(f));
  }));
  listEl = h("div", { class: "ad-list" });
  root = h("div", { class: "admin" },
    h("header", { class: "s-head" },
      h("div", { class: "s-id" }, h("img", { src: "img/logo.png", alt: "Casa Mika" }), h("h1", null, a("title"))),
      h("div", { class: "s-tools" }, langToggle(open),
        h("button", { class: "press", onclick: pinsSheet }, ic("pen", 20), a("pins")),
        h("button", { class: "press", "aria-label": a("more"), onclick: moreSheet }, ic("dots", 22)))),
    h("div", { class: "ad-bar" }, h("div", { class: "bar-row", style: "padding:0" }, seg), search, filters),
    listEl);
  app.replaceChildren(root);
  drawList();
}
function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
function drawList() {
  if (!listEl) return;
  var M = C.M, q = norm(st.q.trim());
  var items = M.items.filter(function (it) {
    if (!q && C.SEC[it.sec].group !== st.group) return false;
    if (q && C.LANGS.every(function (l) { return norm(it.n[l]).indexOf(q) < 0; })) return false;
    if (st.filter === "edited") return edited(it.id);
    if (st.filter === "hidden") return !!it.hide;
    if (st.filter === "out") return !!S.stop[it.id];
    return true;
  });
  var bySec = {};
  items.forEach(function (it) { (bySec[it.sec] = bySec[it.sec] || []).push(it); });
  var kids = [];
  M.sections.forEach(function (s) {
    var list = bySec[s.id]; if (!list) return;
    kids.push(h("h2", { class: "h-title" }, (s.n[lang] || s.n.en) + " · " + list.length));
    kids.push(h("div", { class: "group" }, list.map(row)));
  });
  C.fill(listEl, kids.length ? kids : h("p", { class: "s-empty" }, a("empty")));
}
function row(it) {
  var out = !!S.stop[it.id];
  var tags = [];
  if (it.hide) tags.push(a("hidden"));
  if (edited(it.id)) tags.push(a("edited"));
  return h("div", { class: "row ad-row" + (it.img ? " ph" : "") + (it.hide ? " out" : "") },
    it.img ? h("img", { class: "th" + (it.ct ? " ct" : ""), src: C.pic(it.img), alt: "", style: "background-color:" + C.bgOf(it.img) }) : null,
    h("button", { class: "tx", onclick: function () { editSheet(it.id); } },
      h("div", { class: "nm" }, dishName(it)),
      h("div", { class: "vi" }, lang === "vi" ? (it.n.en || "") : it.n.vi),
      h("div", { class: "pr num" }, priceText(it), tags.length ? h("span", { class: "ad-tag" }, " · " + tags.join(" · ")) : null)),
    h("button", { class: "switch", role: "switch", "aria-checked": String(!out), "aria-label": a("inStock"), title: a("inStock"), onclick: function () {
      var ids = Object.assign({}, S.stop); if (ids[it.id]) delete ids[it.id]; else ids[it.id] = true; S.stop = ids; drawList();
      Store.adminSetStop(ids).catch(fail);
    } }, h("i")));
}
function fail(e) {
  if (e && /pin/i.test(e.message || "")) { C.save("cm-admin-pin", ""); open(); return; }
  C.toast(a("err"), "x");
}

/* ---------- photo: phone camera or gallery -> two webp sizes ---------- */
function shrink(img, max, q) {
  var r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  var c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  var u = c.toDataURL("image/webp", q);
  if (u.indexOf("data:image/webp") !== 0) u = c.toDataURL("image/jpeg", q);
  return u;
}
function readPhoto(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      try {
        var full = shrink(img, 1280, 0.82), q = 0.82;
        while (full.length > 480000 && q > 0.4) { q -= 0.1; full = shrink(img, 1100, q); }
        var thumb = shrink(img, 360, 0.8);
        URL.revokeObjectURL(url); res({ thumb: thumb, full: full });
      } catch (e) { rej(e); }
    };
    img.onerror = rej; img.src = url;
  });
}

/* ---------- edit one dish ---------- */
function editSheet(id) {
  var it = C.BY[id], base = C.BASE[id];
  var e = JSON.parse(JSON.stringify(C.EDITS[id] || {}));
  var tab = lang;
  C.sheet(function (body, api) {
    function field(k, multi) {
      var cur = (e[k] && e[k][tab]) || "", ph = (base[k] && base[k][tab]) || "";
      var el = h(multi ? "textarea" : "input", { class: "ad-in", id: "ad-" + k, placeholder: ph || a("keep"), maxlength: multi ? "900" : "160", oninput: function (ev) { e[k] = e[k] || {}; e[k][tab] = ev.target.value; } });
      el.value = cur; if (multi) el.rows = 4;
      return h("label", { class: "ad-f" }, h("span", null, a(k === "n" ? "name" : k === "d" ? "desc" : "story")), el);
    }
    function priceField(label, val, baseVal, set) {
      var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
      var el = h("input", { class: "ad-in num", inputmode: "numeric", placeholder: fmt(baseVal), oninput: function (ev) { var n = parseInt(ev.target.value.replace(/\D/g, ""), 10); set(isNaN(n) ? null : n); },
        onblur: function (ev) { var n = parseInt(ev.target.value.replace(/\D/g, ""), 10); ev.target.value = isNaN(n) ? "" : fmt(n); } });
      el.value = val ? fmt(val) : "";
      return h("label", { class: "ad-f" }, h("span", null, label + " · " + C.money(baseVal, "vi")), el);
    }
    var hidden = e.hide === true;
    C.fill(body,
      h("div", { class: "s-title" }, h("h2", null, dishName(it)), h("p", null, lang === "vi" ? it.n.en : it.n.vi)),
      h("div", { class: "ad-photo" },
        it.img ? h("img", { class: it.ct ? "ct" : null, src: C.pic(it.img), alt: "" }) : h("span", { class: "mini-ph" }, ic("cup", 30)),
        h("div", { class: "ad-photo-b" },
          h("label", { class: "pill press ad-file" }, ic("plus", 16), a("changePhoto"),
            h("input", { type: "file", accept: "image/*", onchange: function (ev) {
              var f = ev.target.files && ev.target.files[0]; if (!f) return;
              C.toast(a("photoBusy"), "clock");
              readPhoto(f).then(function (p) { return Store.adminSetPhoto(id, p.thumb, p.full).then(function () { return Store.adminSetItem(id, Object.assign({}, C.EDITS[id] || {}, { ph: Date.now() })); }); })
                .then(function () { C.toast(a("photoOk")); api.rebuild(); }, fail);
            } })),
          C.PHOTO_IDS[id] ? h("button", { class: "pill press", onclick: function () {
            Store.adminSetPhoto(id, null, null).then(function () { var d = Object.assign({}, C.EDITS[id] || {}); delete d.ph; return Store.adminSetItem(id, d); }).then(function () { api.rebuild(); }, fail);
          } }, a("origPhoto")) : null)),
      h("div", { class: "switch-row" },
        h("div", null, h("div", { style: "font-weight:700" }, a("show")), h("div", { style: "font-size:14px;color:var(--faint)" }, a("showHint"))),
        h("button", { class: "switch", role: "switch", "aria-checked": String(!hidden), "aria-label": a("show"), onclick: function () { if (e.hide) delete e.hide; else e.hide = true; api.rebuild(); } }, h("i"))),
      it.v ? h("div", { class: "ad-grid" }, base.v.map(function (v, i) {
        return priceField(v.n[lang] || v.n.en, e.vp && e.vp[i], v.p, function (n) { e.vp = e.vp || []; e.vp[i] = n; });
      })) : priceField(a("price"), e.p, base.p, function (n) { if (n) e.p = n; else delete e.p; }),
      h("div", { class: "lang ad-tabs", role: "group", style: "grid-auto-columns:minmax(0,1fr)" }, h("span", { class: "knob", style: "width:calc((100% - 6px)/4);transform:translateX(" + (C.LANGS.indexOf(tab) * 100) + "%)" }),
        C.LANGS.map(function (l, i) { return h("button", { "aria-pressed": String(tab === l), onclick: function (e) { if (tab === l) return; C.slideKnob(e.currentTarget.parentElement, i, function () { tab = l; api.rebuild(); }); } }, C.LANG_LABEL[l]); })),
      field("n"), field("d"), field("s", true),
      h("div", { class: "buy" }, h("div", { class: "buy-col" },
        h("button", { class: "go press", disabled: api.busy, onclick: function () {
          var out = clean(e, base);
          api.busy = true; api.rebuild();
          Store.adminSetItem(id, out).then(function () { api.busy = false; C.toast(a("saved")); C.closeSheet(); drawList(); }, function (err) { api.busy = false; api.rebuild(); fail(err); });
        } }, h("span", null, api.busy ? a("saving") : a("save"))),
        edited(id) ? h("button", { class: "ad-reset", onclick: function () {
          if (!api.ask) { api.ask = true; api.rebuild(); return; }
          Store.adminSetPhoto(id, null, null).then(function () { return Store.adminSetItem(id, {}); }).then(function () { C.toast(a("saved")); C.closeSheet(); drawList(); }, fail);
        } }, api.ask ? a("resetAsk") : a("reset")) : null)));
  }, { label: dishName(it), kind: "admin" });
}
function clean(e, base) {
  var out = {};
  if (typeof e.p === "number" && e.p > 0 && e.p !== base.p) out.p = Math.min(e.p, 1e9);
  if (Array.isArray(e.vp) && base.v) { var vp = base.v.map(function (v, i) { var n = e.vp[i]; return typeof n === "number" && n > 0 && n !== v.p ? Math.min(n, 1e9) : null; }); if (vp.some(function (x) { return x; })) out.vp = vp; }
  if (e.hide === true) out.hide = true;
  ["n", "d", "s"].forEach(function (k) {
    if (!e[k]) return; var o = {};
    C.LANGS.forEach(function (l) { var v = (e[k][l] || "").trim(); if (v && v !== ((base[k] && base[k][l]) || "")) o[l] = v.slice(0, k === "s" ? 900 : 160); });
    if (Object.keys(o).length) out[k] = o;
  });
  if (e.ph && C.PHOTO_IDS) out.ph = e.ph;
  return out;
}

function moreSheet() {
  C.sheet(function (body) {
    C.fill(body, h("div", { class: "s-title" }, h("h2", null, a("title"))),
      h("div", { class: "ad-menu" },
        h("button", { onclick: function () { C.closeSheet(true); setTimeout(feedbackSheet, 200); } }, ic("star", 22), a("fb")),
        h("button", { onclick: function () { C.closeSheet(true); setTimeout(paySheet, 200); } }, ic("bill", 22), a("pay")),
        h("button", { onclick: function () { C.closeSheet(true); setTimeout(tgSheet, 200); } }, ic("bell", 22), a("tg")),
        h("a", { href: "#bar", onclick: function () { C.closeSheet(true); } }, ic("bell", 22), a("staff")),
        h("a", { href: "#table-1", onclick: function () { C.closeSheet(true); } }, ic("cup", 22), a("guest")),
        h("button", { class: "danger", onclick: function () { C.closeSheet(true); C.save("cm-admin-pin", ""); open(); } }, ic("door", 22), a("logout"))));
  }, { label: a("title"), kind: "admin" });
}

/* ---------- PINs ---------- */
function pinsSheet() {
  var v = { s: "", a: "" };
  C.sheet(function (body, api) {
    C.fill(body,
      h("div", { class: "s-title" }, h("h2", null, a("pins"))),
      h("label", { class: "ad-f" }, h("span", null, a("staffPin")), (function () { var x = h("input", { class: "ad-in num", inputmode: "numeric", maxlength: "6", autocomplete: "off", oninput: function (e) { v.s = e.target.value.replace(/\D/g, ""); } }); x.value = v.s; return x; })()),
      h("label", { class: "ad-f" }, h("span", null, a("adminPin")), (function () { var x = h("input", { class: "ad-in num", inputmode: "numeric", maxlength: "6", autocomplete: "off", oninput: function (e) { v.a = e.target.value.replace(/\D/g, ""); } }); x.value = v.a; return x; })()),
      h("div", { class: "buy" }, h("button", { class: "go press", onclick: function () {
        if ((v.s && !/^\d{4,6}$/.test(v.s)) || (v.a && !/^\d{6}$/.test(v.a)) || (!v.s && !v.a)) { C.toast(a("pinWrong"), "x"); return; }
        Store.adminSetPins(v.s, v.a).then(function () { if (v.a) C.save("cm-admin-pin", v.a); C.toast(a("pinSaved")); C.closeSheet(); }, fail);
      } }, h("span", null, a("pinSave")))));
  }, { label: a("pins"), kind: "admin" });
}

/* ---------- bank QR + Google review ---------- */
var BANKS = [["Vietcombank", "970436"], ["VietinBank", "970415"], ["BIDV", "970418"], ["Agribank", "970405"], ["Techcombank", "970407"], ["MB Bank", "970422"], ["ACB", "970416"],
  ["VPBank", "970432"], ["TPBank", "970423"], ["Sacombank", "970403"], ["VIB", "970441"], ["HDBank", "970437"], ["SHB", "970443"], ["OCB", "970448"], ["MSB", "970426"],
  ["SeABank", "970440"], ["Eximbank", "970431"], ["LPBank", "970449"], ["Nam A Bank", "970428"], ["Bac A Bank", "970409"], ["KienlongBank", "970452"], ["ABBANK", "970425"],
  ["PVcomBank", "970412"], ["VietBank", "970433"], ["BVBank", "970454"], ["Cake", "546034"], ["Timo", "963388"]];
function noAccent(x) { return String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").slice(0, 50); }
function paySheet() {
  var c = Object.assign({ bank: "", acct: "", name: "", review: "" }, S.cfg || {});
  C.sheet(function (body, api) {
    var ok = /^\d{6}$/.test(c.bank) && /^[0-9A-Za-z]{4,30}$/.test(c.acct);
    var sel = h("select", { class: "ad-in", onchange: function (e) { c.bank = e.target.value; var b = BANKS.find(function (x) { return x[1] === c.bank; }); c.bankName = b ? b[0] : ""; api.rebuild(); } },
      [h("option", { value: "" }, a("pick"))].concat(BANKS.map(function (b) { var o = h("option", { value: b[1] }, b[0]); if (b[1] === c.bank) o.selected = true; return o; })));
    function inp(k, extra) {
      var el = h("input", Object.assign({ class: "ad-in", autocomplete: "off", oninput: function (e) { c[k] = k === "acct" ? e.target.value.replace(/\s/g, "") : e.target.value; if (k === "acct") { clearTimeout(api.tm); api.tm = setTimeout(api.rebuild, 600); } },
        onblur: function (e) { if (k === "name") { c.name = noAccent(c.name); e.target.value = c.name; } } }, extra || {}));
      el.value = c[k] || ""; return el;
    }
    C.fill(body,
      h("div", { class: "s-title" }, h("h2", null, a("pay")), h("p", null, a("payHint"))),
      h("label", { class: "ad-f" }, h("span", null, a("bank")), sel),
      h("label", { class: "ad-f" }, h("span", null, a("acct")), inp("acct", { inputmode: "numeric" })),
      h("label", { class: "ad-f" }, h("span", null, a("acctName")), inp("name", { autocapitalize: "characters" })),
      ok ? h("div", { class: "ad-qr" }, h("img", { src: "https://img.vietqr.io/image/" + c.bank + "-" + c.acct + "-compact2.png?amount=10000&addInfo=Test" + (c.name ? "&accountName=" + encodeURIComponent(noAccent(c.name)) : ""), alt: "VietQR", width: "200" }), h("small", null, a("preview"))) : h("p", { class: "ad-note" }, a("payOff")),
      h("label", { class: "ad-f" }, h("span", null, a("review")), inp("review", { type: "url", inputmode: "url", placeholder: "https://g.page/r/…" })),
      h("p", { class: "ad-note" }, a("reviewHint")),
      h("div", { class: "buy" }, h("button", { class: "go press", disabled: api.busy, onclick: function () {
        var d = {};
        if (/^\d{6}$/.test(c.bank) && /^[0-9A-Za-z]{4,30}$/.test(c.acct)) { d.bank = c.bank; d.acct = c.acct; d.name = noAccent(c.name); d.bankName = c.bankName || ((BANKS.find(function (x) { return x[1] === c.bank; }) || [""])[0]); }
        var r = (c.review || "").trim(); if (/^https:\/\/\S{8,300}$/.test(r)) d.review = r;
        api.busy = true; api.rebuild();
        Store.adminSetSettings(d).then(function () { C.toast(a("saved")); C.closeSheet(); }, function (e) { api.busy = false; api.rebuild(); fail(e); });
      } }, h("span", null, api.busy ? a("saving") : a("save")))));
  }, { label: a("pay"), kind: "admin" });
}

/* ---------- Telegram: the owner makes a bot, presses Start, we find the chat and keep the token on the server ---------- */
function tgSheet() {
  var v = { tok: "", on: null, busy: false, msg: "" };
  Store.adminTelegramOn().then(function (x) { v.on = !!x; if (C.openSheet && C.openSheet.kind === "admin") C.openSheet.rebuild(); }, function () {});
  C.sheet(function (body, api) {
    function connect() {
      var tok = v.tok.trim();
      if (!/^\d{5,12}:[A-Za-z0-9_-]{30,50}$/.test(tok)) { v.msg = a("tgBadTok"); api.rebuild(); return; }
      v.busy = true; v.msg = ""; api.rebuild();
      fetch("https://api.telegram.org/bot" + tok + "/getUpdates").then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error("tok");
        var u = (j.result || []).slice().reverse().find(function (x) { return x.message && x.message.chat; });
        if (!u) throw new Error("nomsg");
        var chat = String(u.message.chat.id);
        return Store.adminSetTelegram(tok, chat).then(function () {
          return fetch("https://api.telegram.org/bot" + tok + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: a("tgTest") }) });
        });
      }).then(function () { v.busy = false; v.on = true; v.tok = ""; C.toast(a("tgDone")); api.rebuild(); }, function (e) {
        v.busy = false; v.msg = e && e.message === "nomsg" ? a("tgNoMsg") : e && e.message === "tok" ? a("tgBadTok") : a("err"); api.rebuild();
      });
    }
    var tokIn = h("input", { class: "ad-in", autocomplete: "off", spellcheck: "false", placeholder: "123456789:AA…", oninput: function (e) { v.tok = e.target.value; } }); tokIn.value = v.tok;
    C.fill(body,
      h("div", { class: "s-title" }, h("h2", null, a("tg")), h("p", null, v.on === null ? "…" : v.on ? a("tgOn") : a("tgOff"))),
      v.on ? h("button", { class: "ad-reset", onclick: function () { Store.adminSetTelegram("", "").then(function () { v.on = false; api.rebuild(); }, fail); } }, a("tgCut"))
        : h("ol", { class: "ad-steps" }, h("li", null, a("tg1")), h("li", null, a("tg2"), tokIn), h("li", null, a("tg3"))),
      v.msg ? h("p", { class: "err", role: "alert" }, v.msg) : null,
      v.on ? null : h("div", { class: "buy" }, h("button", { class: "go press", disabled: v.busy, onclick: connect }, h("span", null, v.busy ? a("tgBusy") : a("tg4")))));
  }, { label: a("tg"), kind: "admin" });
}

/* ---------- ratings from guests ---------- */
function feedbackSheet() {
  var v = { list: null };
  Store.adminFeedback().then(function (x) { v.list = x || []; if (C.openSheet && C.openSheet.kind === "admin") C.openSheet.rebuild(); }, function (e) { v.list = []; fail(e); });
  C.sheet(function (body) {
    var list = v.list || [], avg = list.length ? list.reduce(function (s, f) { return s + f.rating; }, 0) / list.length : 0;
    function when(t) { var d = new Date(t); return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
    C.fill(body,
      h("div", { class: "s-title" }, h("h2", null, a("fb")), list.length ? h("p", null, a("fbAvg") + " " + avg.toFixed(1) + " / 5 · " + list.length) : null),
      v.list === null ? h("p", { class: "ad-note" }, "…") : !list.length ? h("p", { class: "ad-note" }, a("fbNone")) :
        h("div", { class: "fb-list" }, list.map(function (f) {
          return h("div", { class: "fb" + (f.rating <= 3 ? " low" : "") },
            h("div", { class: "fb-hd" }, h("span", { class: "fb-st", "aria-label": f.rating + "/5" }, [1, 2, 3, 4, 5].map(function (n) { var x = ic("star", 14); if (n <= f.rating) x.className = "on"; return x; })),
              h("span", null, a("fbTable") + " " + f.table_no + " · " + when(f.created_at) + " · " + String(f.lang).toUpperCase())),
            f.comment ? h("p", null, f.comment) : null);
        })));
  }, { label: a("fb"), kind: "admin" });
}

window.CM_ADMIN = { open: open, refresh: function () { if (C.openSheet && C.openSheet.kind === "admin") return; if (listEl && document.body.contains(listEl)) drawList(); } };
})();
