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
    guest: "Trang khách", staff: "Màn hình nhân viên", err: "Không lưu được, thử lại", photoBusy: "Đang xử lý ảnh…", photoOk: "Đã đổi ảnh", logout: "Thoát", empty: "Không tìm thấy món", count: "món" },
  en: { title: "Menu manager", pinHint: "Enter the manager PIN (6 digits)", pinBad: "Wrong PIN, try again", needLive: "The menu manager needs an internet connection.",
    search: "Find a dish", all: "All", edited: "Edited", hidden: "Hidden", out: "Sold out", inStock: "Available", price: "Price", from: "from",
    show: "Show on the menu", showHint: "Turn off to hide the dish from guests", changePhoto: "Change photo", origPhoto: "Use original photo", name: "Name", desc: "Short description", story: "Story of the dish",
    keep: "Empty: keep the original", save: "Save", saving: "Saving…", saved: "Saved. Guests see it right away.", reset: "Restore original", resetAsk: "Tap again to restore",
    pins: "PINs", staffPin: "Staff screen PIN (4–6 digits)", adminPin: "Manager PIN (6 digits)", pinSave: "Change PINs", pinSaved: "PINs changed", pinWrong: "Invalid PIN",
    guest: "Guest page", staff: "Staff screen", err: "Could not save, try again", photoBusy: "Processing photo…", photoOk: "Photo changed", logout: "Log out", empty: "No dishes found", count: "dishes" }
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
    ["vi", "en"].map(function (l) { return h("button", { "aria-pressed": String(lang === l), onclick: function () { lang = l; C.save("cm-staff-lang", l); S.staffLang = l; onchange(); } }, l === "vi" ? "Việt" : "Eng"); }));
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
    ["food", "drinks", "bar"].map(function (g) { var gr = M.groups.find(function (x) { return x.id === g; }); return h("button", { "aria-pressed": String(st.group === g), onclick: function () { st.group = g; open(); } }, gr.n[lang] || gr.n.en); }));
  var search = h("input", { type: "search", value: st.q, placeholder: a("search"), "aria-label": a("search"), oninput: function (e) { st.q = e.target.value; drawList(); } });
  var filters = h("div", { class: "ad-filters" }, ["all", "edited", "hidden", "out"].map(function (f) {
    return h("button", { class: "pill press", "aria-pressed": String(st.filter === f), onclick: function () { st.filter = f; open(); } }, a(f));
  }));
  listEl = h("div", { class: "ad-list" });
  root = h("div", { class: "admin" },
    h("header", { class: "s-head" },
      h("div", { class: "s-id" }, h("img", { src: "img/logo.png", alt: "Casa Mika" }), h("h1", null, a("title"))),
      h("div", { class: "s-tools" }, langToggle(open),
        h("button", { class: "press", onclick: pinsSheet }, ic("pen", 20), a("pins")),
        h("a", { href: "#bar" }, a("staff")), h("a", { href: "#table-1" }, a("guest")),
        h("button", { class: "press", onclick: function () { C.save("cm-admin-pin", ""); open(); } }, a("logout")))),
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
      var el = h("input", { class: "ad-in num", inputmode: "numeric", placeholder: String(baseVal), oninput: function (ev) { var n = parseInt(ev.target.value.replace(/\D/g, ""), 10); set(isNaN(n) ? null : n); } });
      el.value = val ? String(val) : "";
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
        C.LANGS.map(function (l) { return h("button", { "aria-pressed": String(tab === l), onclick: function () { tab = l; api.rebuild(); } }, C.LANG_LABEL[l]); })),
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

window.CM_ADMIN = { open: open, refresh: function () { if (C.openSheet && C.openSheet.kind === "admin") return; if (listEl && document.body.contains(listEl)) drawList(); } };
})();
