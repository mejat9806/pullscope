"use strict";
(() => {
  // src/app/core.ts
  var tauri = window.__TAURI__ && window.__TAURI__.core;
  var $ = (s2, r2 = document) => r2.querySelector(s2);
  var qa = (s2, r2 = document) => [...r2.querySelectorAll(s2)];
  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var esc = (s2) => String(s2 ?? "").replace(/[&<>"']/g, (c2) => ESC[c2]);
  var icon = (name, size = 16, cls = "") => {
    const k2 = name + (size === 24 ? "-24" : "");
    return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[k2] || ""}</svg>`;
  };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function whenParts(iso, lead = "on ") {
    const d2 = new Date(iso), now = /* @__PURE__ */ new Date(), diff = (+now - +d2) / 1e3;
    const abs = `${MONTHS[d2.getUTCMonth()]} ${d2.getUTCDate()}${d2.getUTCFullYear() !== now.getUTCFullYear() ? ", " + d2.getUTCFullYear() : ""}`;
    const title = d2.toUTCString();
    let t2;
    if (diff < 30 * 86400 && diff >= 0) {
      const n2 = (v2, u3) => `${v2} ${u3}${v2 === 1 ? "" : "s"} ago`;
      t2 = diff < 60 ? "now" : diff < 3600 ? n2(Math.floor(diff / 60), "minute") : diff < 86400 ? n2(Math.floor(diff / 3600), "hour") : n2(Math.floor(diff / 86400), "day");
      return { title, text: t2 };
    }
    return { title, text: `${lead}${abs}` };
  }
  function when(iso, lead = "on ") {
    const w2 = whenParts(iso, lead);
    return `<span title="${w2.title}">${w2.text}</span>`;
  }
  var ASSOC = { CONTRIBUTOR: "Contributor", MEMBER: "Member", OWNER: "Owner", COLLABORATOR: "Collaborator", FIRST_TIME_CONTRIBUTOR: "First-time contributor", FIRST_TIMER: "First-timer", MANNEQUIN: "Mannequin" };
  var REACTS = [["+1", "\u{1F44D}"], ["-1", "\u{1F44E}"], ["laugh", "\u{1F604}"], ["hooray", "\u{1F389}"], ["confused", "\u{1F615}"], ["heart", "\u2764\uFE0F"], ["rocket", "\u{1F680}"], ["eyes", "\u{1F440}"]];
  var load = (k2, d2) => {
    try {
      return JSON.parse(localStorage.getItem(k2) ?? "null") ?? d2;
    } catch {
      return d2;
    }
  };
  var S = { profile: (() => {
    try {
      return JSON.parse(localStorage.getItem("profile") || "null");
    } catch {
      return null;
    }
  })(), bundle: null, tab: "conversation", mode: localStorage.getItem("mode") || "auto", error: "", loading: false, showAllReviewers: true, recent: [], hist: [], hi: -1, hasToken: false, sideTab: "repos", repos: null, reposErr: "", repoFilter: "", repo: null, prs: null, prState: "open", split: localStorage.getItem("split") === "1", sel: null, cdiff: {}, rdiff: {}, fr: null, lw: +(localStorage.getItem("lw") || 46), notes: load("notes", []), bell: false, fold: load("fold", {}), hide: load("hide", {}), draft: {}, sbw: +(localStorage.getItem("sbw") || 260), pf: "", psort: localStorage.getItem("psort") || "updated", pgroup: localStorage.getItem("pgroup") || "none", who: [], unres: false, range: "all", rFrom: "", rTo: "", sort: localStorage.getItem("csort") === "desc" ? "desc" : "asc", unIdx: 0, nav: false, busy: "", actErr: null, tabs: [], alive: /* @__PURE__ */ new Map(), tabMenu: false, closed: [], pushes: {} };
  S.recent = (() => {
    try {
      return JSON.parse(localStorage.getItem("recent") ?? "null") || [];
    } catch {
      return [];
    }
  })();
  var isDark = () => S.mode === "dark" || S.mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches;
  if (!/Mac/i.test(navigator.platform)) document.documentElement.classList.add("not-mac");
  var flags = { lastUnread: -1, polling: false };
  function syncUnread() {
    const n2 = S.notes.filter((x2) => !x2.read).length;
    if (tauri && n2 !== flags.lastUnread) {
      flags.lastUnread = n2;
      tauri.invoke("set_unread", { count: n2 }).catch(() => {
      });
    }
  }
  S.offline = typeof navigator !== "undefined" && navigator.onLine === false;
  var isOff = () => !!(S.offline || S.bundle && S.bundle._cached);
  function applyMode() {
    const d2 = document.documentElement, dark = isDark();
    d2.setAttribute("data-color-mode", dark ? "dark" : "light");
    d2.setAttribute("data-light-theme", "light");
    d2.setAttribute("data-dark-theme", "dark");
    d2.setAttribute("data-t", dark ? "dark" : "light");
  }
  var KEY_RECENT = "recent";

  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var a;
  var s;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n2, l2) {
    for (var u3 in l2) n2[u3] = l2[u3];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l2, u3, t2) {
    var i2, r2, o2, e2 = {};
    for (o2 in u3) "key" == o2 ? i2 = u3[o2] : "ref" == o2 ? r2 = u3[o2] : e2[o2] = u3[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
    return x(l2, e2, i2, r2, null);
  }
  function x(n2, t2, i2, r2, o2) {
    var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u : o2, __i: -1, __u: 0 };
    return null == o2 && null != l.vnode && l.vnode(e2), e2;
  }
  function S2(n2) {
    return n2.children;
  }
  function C(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function $2(n2, l2) {
    if (null == l2) return n2.__ ? $2(n2.__, n2.__i + 1) : null;
    for (var u3; l2 < n2.__k.length; l2++) if (null != (u3 = n2.__k[l2]) && null != u3.__e) return u3.__e;
    return "function" == typeof n2.type ? $2(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u3 = n2.__v, t2 = u3.__e, i2 = [], r2 = [], o2 = m({}, u3);
      o2.__v = u3.__v + 1, l.vnode && l.vnode(o2), q(n2.__P, o2, u3, n2.__n, n2.__P.namespaceURI, 32 & u3.__u ? [t2] : null, i2, null == t2 ? $2(u3) : t2, !!(32 & u3.__u), r2), o2.__v = u3.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u3.__e = u3.__ = null, o2.__e != t2 && P(o2);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
      if (null != l2 && null != l2.__e) return n2.__e = n2.__c.base = l2.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l2 = 1; i.length; ) i.length > l2 && i.sort(e), n2 = i.shift(), l2 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l2, u3, t2, i2, r2, o2, e2, f3, c2, a2) {
    var s2, h2, p2, v2, y2, _2, g2 = t2 && t2.__k || w, m2 = l2.length;
    for (f3 = T(u3, l2, g2, f3, m2), s2 = 0; s2 < m2; s2++) null != (p2 = u3.__k[s2]) && (h2 = -1 != p2.__i && g2[p2.__i] || d, p2.__i = s2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f3, c2, a2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), null == y2 && null != v2 && (y2 = v2), 4 & p2.__u ? (f3 = j(p2, f3, n2), h2.__e && (h2.__e = null)) : "function" == typeof p2.type && void 0 !== _2 ? f3 = _2 : v2 && (f3 = v2.nextSibling), p2.__u &= -7);
    return u3.__e = y2, f3;
  }
  function T(n2, l2, u3, t2, i2) {
    var r2, o2, e2, f3, c2, a2 = u3.length, s2 = a2, h2 = 0;
    for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S2, { children: o2 }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f3 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = O(o2, u3, f3, s2)) && (s2--, (e2 = u3[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > a2 ? h2-- : i2 < a2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f3 && (c2 == f3 - 1 ? h2-- : c2 == f3 + 1 ? h2++ : (c2 > f3 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
    if (s2) for (r2 = 0; r2 < a2; r2++) null != (e2 = u3[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = $2(e2)), K(e2, e2));
    return t2;
  }
  function j(n2, l2, u3) {
    var t2, i2;
    if ("function" == typeof n2.type) {
      for (t2 = n2.__k, i2 = 0; t2 && i2 < t2.length; i2++) t2[i2] && (t2[i2].__ = n2, l2 = j(t2[i2], l2, u3));
      return l2;
    }
    n2.__e != l2 && (l2 && n2.type && !l2.parentNode && (l2 = $2(n2)), l2 = u3.insertBefore(n2.__e, l2 || null));
    do {
      l2 = l2 && l2.nextSibling;
    } while (null != l2 && 8 == l2.nodeType);
    return l2;
  }
  function O(n2, l2, u3, t2) {
    var i2, r2, o2, e2 = n2.key, f3 = n2.type, c2 = l2[u3], a2 = null != c2 && 0 == (2 & c2.__u);
    if (null === c2 && null == e2 || a2 && e2 == c2.key && f3 == c2.type) return u3;
    if (t2 > (a2 ? 1 : 0)) {
      for (i2 = u3 - 1, r2 = u3 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f3 == c2.type) return o2;
    }
    return -1;
  }
  function z(n2, l2, u3) {
    "-" == l2[0] ? n2.setProperty(l2, null == u3 ? "" : u3) : n2[l2] = null == u3 ? "" : "number" != typeof u3 || _.test(l2) ? u3 : u3 + "px";
  }
  function N(n2, l2, u3, t2, i2) {
    var r2, o2;
    n: if ("style" == l2) if ("string" == typeof u3) n2.style.cssText = u3;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u3 && l2 in u3 || z(n2.style, l2, "");
      if (u3) for (l2 in u3) t2 && u3[l2] == t2[l2] || z(n2.style, l2, u3[l2]);
    }
    else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(s, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u3, u3 ? t2 ? u3[a] = t2[a] : (u3[a] = h, n2.addEventListener(l2, r2 ? v : p, r2)) : n2.removeEventListener(l2, r2 ? v : p, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
        n2[l2] = null == u3 ? "" : u3;
        break n;
      } catch (n3) {
      }
      "function" == typeof u3 || (null == u3 || false === u3 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u3 ? "" : u3));
    }
  }
  function V(n2) {
    return function(u3) {
      if (this.l) {
        var t2 = this.l[u3.type + n2];
        if (null == u3[c]) u3[c] = h++;
        else if (u3[c] < t2[a]) return;
        return t2(l.event ? l.event(u3) : u3);
      }
    };
  }
  function q(n2, u3, t2, i2, r2, o2, e2, f3, c2, a2) {
    var s2, h2, p2, v2, y2, d2, _2, k2, x2, M, I3, P2, A2, H2, T2, j2, F = u3.type;
    if (void 0 !== u3.constructor) return null;
    128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f3 = u3.__e = t2.__e]), (s2 = l.__b) && s2(u3);
    n: if ("function" == typeof F) {
      h2 = e2.length;
      try {
        if (x2 = u3.props, M = F.prototype && F.prototype.render, I3 = (s2 = F.contextType) && i2[s2.__c], P2 = s2 ? I3 ? I3.props.value : s2.__ : i2, t2.__c ? k2 = (p2 = u3.__c = t2.__c).__ = p2.__E : (M ? u3.__c = p2 = new F(x2, P2) : (u3.__c = p2 = new C(x2, P2), p2.constructor = F, p2.render = Q), I3 && I3.sub(p2), p2.state || (p2.state = {}), p2.__n = i2, v2 = p2.__d = true, p2.__h = [], p2._sb = []), M && null == p2.__s && (p2.__s = p2.state), M && null != F.getDerivedStateFromProps && (p2.__s == p2.state && (p2.__s = m({}, p2.__s)), m(p2.__s, F.getDerivedStateFromProps(x2, p2.__s))), y2 = p2.props, d2 = p2.state, p2.__v = u3, v2) M && null == F.getDerivedStateFromProps && null != p2.componentWillMount && p2.componentWillMount(), M && null != p2.componentDidMount && p2.__h.push(p2.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x2 !== y2 && null != p2.componentWillReceiveProps && p2.componentWillReceiveProps(x2, P2), u3.__v == t2.__v || !p2.__e && null != p2.shouldComponentUpdate && false === p2.shouldComponentUpdate(x2, p2.__s, P2)) {
            u3.__v != t2.__v && (p2.props = x2, p2.state = p2.__s, p2.__d = false), u3.__e = t2.__e, u3.__k = t2.__k, u3.__k.some(function(n3) {
              n3 && (n3.__ = u3);
            }), w.push.apply(p2.__h, p2._sb), p2._sb = [], p2.__h.length && e2.push(p2), f3 = $2(t2);
            break n;
          }
          null != p2.componentWillUpdate && p2.componentWillUpdate(x2, p2.__s, P2), M && null != p2.componentDidUpdate && p2.__h.push(function() {
            p2.componentDidUpdate(y2, d2, _2);
          });
        }
        if (p2.context = P2, p2.props = x2, p2.__P = n2, p2.__e = false, A2 = l.__r, H2 = 0, M) p2.state = p2.__s, p2.__d = false, A2 && A2(u3), s2 = p2.render(p2.props, p2.state, p2.context), w.push.apply(p2.__h, p2._sb), p2._sb = [];
        else do {
          p2.__d = false, A2 && A2(u3), s2 = p2.render(p2.props, p2.state, p2.context), p2.state = p2.__s;
        } while (p2.__d && ++H2 < 25);
        p2.state = p2.__s, null != p2.getChildContext && (i2 = m(m({}, i2), p2.getChildContext())), M && !v2 && null != p2.getSnapshotBeforeUpdate && (_2 = p2.getSnapshotBeforeUpdate(y2, d2)), T2 = null != s2 && s2.type === S2 && null == s2.key ? E(s2.props.children) : s2, f3 = L(n2, g(T2) ? T2 : [T2], u3, t2, i2, r2, o2, e2, f3, c2, a2), p2.base = u3.__e, u3.__u &= -161, p2.__h.length && e2.push(p2), k2 && (p2.__E = p2.__ = null);
      } catch (n3) {
        if (e2.length = h2, u3.__v = null, c2 || null != o2) {
          if (n3.then) {
            for (u3.__u |= c2 ? 160 : 128; f3 && 8 == f3.nodeType && f3.nextSibling; ) f3 = f3.nextSibling;
            null != o2 && (o2[o2.indexOf(f3)] = null), u3.__e = f3;
          } else if (null != o2) for (j2 = o2.length; j2--; ) b(o2[j2]);
        } else u3.__e = t2.__e;
        null == u3.__k && (u3.__k = t2.__k || []), n3.then || B(u3), l.__e(n3, u3, t2);
      }
    } else null == o2 && u3.__v == t2.__v ? (u3.__k = t2.__k, u3.__e = t2.__e) : f3 = u3.__e = G(t2.__e, u3, t2, i2, r2, o2, e2, c2, a2);
    return (s2 = l.diffed) && s2(u3), 128 & u3.__u ? void 0 : f3;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u3, t2) {
    for (var i2 = 0; i2 < t2.length; i2++) J(t2[i2], t2[++i2], t2[++i2]);
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
  }
  function G(u3, t2, i2, r2, o2, e2, f3, c2, a2) {
    var s2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d, k2 = t2.props, x2 = t2.type;
    if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s2 = 0; s2 < e2.length; s2++) if ((y2 = e2[s2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : 3 == y2.nodeType)) {
        u3 = y2, e2[s2] = null;
        break;
      }
    }
    if (null == u3) {
      if (null == x2) return document.createTextNode(k2);
      u3 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
    }
    if (null == x2) m2 === k2 || c2 && u3.data == k2 || (u3.data = k2);
    else {
      if (e2 = "textarea" == x2 && null != k2.defaultValue ? null : e2 && n.call(u3.childNodes), !c2 && null != e2) for (m2 = {}, s2 = 0; s2 < u3.attributes.length; s2++) m2[(y2 = u3.attributes[s2]).name] = y2.value;
      for (s2 in m2) y2 = m2[s2], "dangerouslySetInnerHTML" == s2 ? p2 = y2 : "children" == s2 || s2 in k2 || "value" == s2 && "defaultValue" in k2 || "checked" == s2 && "defaultChecked" in k2 || N(u3, s2, null, y2, o2);
      for (s2 in k2) y2 = k2[s2], "children" == s2 ? v2 = y2 : "dangerouslySetInnerHTML" == s2 ? h2 = y2 : "value" == s2 ? w2 = y2 : "checked" == s2 ? _2 = y2 : c2 && "function" != typeof y2 || m2[s2] === y2 || N(u3, s2, y2, m2[s2], o2);
      if (h2) c2 || p2 && (h2.__html == p2.__html || h2.__html == u3.innerHTML) || (u3.innerHTML = h2.__html), t2.__k = [];
      else if (p2 && (u3.innerHTML = ""), L("template" == t2.type ? u3.content : u3, g(v2) ? v2 : [v2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f3, e2 ? e2[0] : i2.__k && $2(i2, 0), c2, a2), null != e2) for (s2 = e2.length; s2--; ) b(e2[s2]);
      c2 && "textarea" != x2 || (s2 = "value", "progress" == x2 && null == w2 ? u3.removeAttribute("value") : null != w2 && (w2 !== u3[s2] || "progress" == x2 && !w2 || "option" == x2 && w2 != m2[s2]) && N(u3, s2, w2, m2[s2], o2), s2 = "checked", null != _2 && _2 != u3[s2] && N(u3, s2, _2, m2[s2], o2));
    }
    return u3;
  }
  function J(n2, u3, t2) {
    try {
      if ("function" == typeof n2) {
        var i2 = "function" == typeof n2.__u;
        i2 && n2.__u(), i2 && null == u3 || (n2.__u = n2(u3));
      } else n2.current = u3;
    } catch (n3) {
      l.__e(n3, t2);
    }
  }
  function K(n2, u3, t2) {
    var i2, r2;
    if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u3)), null != (i2 = n2.__c)) {
      if (i2.componentWillUnmount) try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u3);
      }
      i2.base = i2.__P = i2.__n = null;
    }
    if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && K(i2[r2], u3, t2 || "function" != typeof n2.type);
    t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l2, u3) {
    return this.constructor(n2, u3);
  }
  function R(u3, t2, i2) {
    var r2, o2, e2, f3;
    t2 == document && (t2 = document.documentElement), l.__ && l.__(u3, t2), o2 = (r2 = "function" == typeof i2) ? null : i2 && i2.__k || t2.__k, e2 = [], f3 = [], q(t2, u3 = (!r2 && i2 || t2).__k = k(S2, null, [u3]), o2 || d, d, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f3), D(e2, u3, f3), u3.props.children = null;
  }
  n = w.slice, l = { __e: function(n2, l2, u3, t2) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n2 = l3;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, C.prototype.setState = function(n2, l2) {
    var u3;
    u3 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u3), this.props)), n2 && m(u3, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S2, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
    return n2.__v.__b - l2.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f2 = 0;
  function u2(e2, t2, n2, o2, i2, u3) {
    t2 || (t2 = {});
    var a2, c2, p2 = t2;
    if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
    var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
    if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
    return l.vnode && l.vnode(l2), l2;
  }

  // src/components/ui.tsx
  var I2 = (name, size, cls) => /* @__PURE__ */ u2(Icon, { n: name, s: size, c: cls });
  var Av = (u3, s2 = 40) => /* @__PURE__ */ u2(Avatar, { u: u3, s: s2 });
  var When = (t2, lead) => /* @__PURE__ */ u2(WhenText, { t: t2, lead });
  var SP = " ";
  var Icon = ({ n: n2, s: s2 = 16, c: c2 = "" }) => /* @__PURE__ */ u2("svg", { class: `octicon ${c2}`, viewBox: `0 0 ${s2} ${s2}`, width: s2, height: s2, "aria-hidden": "true", dangerouslySetInnerHTML: { __html: (window.OCTICONS || {})[n2 + (s2 === 24 ? "-24" : "")] || "" } });
  var Avatar = ({ u: u3, s: s2 = 40 }) => /* @__PURE__ */ u2("img", { class: "av", src: `${u3?.avatar_url || ""}${u3?.avatar_url ? (u3.avatar_url.includes("?") ? "&" : "?") + "s=" + s2 * 2 : ""}`, width: s2, height: s2, alt: `@${u3?.login || "ghost"}`, style: "border-radius:50%;display:block" });
  var WhenText = ({ t: t2, lead }) => {
    const w2 = whenParts(t2, lead);
    return /* @__PURE__ */ u2("span", { title: w2.title, children: w2.text });
  };

  // src/components/Actions.tsx
  var ErrLine = ({ m: m2 }) => m2 ? /* @__PURE__ */ u2("div", { class: "act-err", children: m2 }) : null;
  var DraftBox = ({ k: k2, ph, rows }) => /* @__PURE__ */ u2("div", { class: "tt", "data-draft": k2, "data-ph": `${ph} \u2014 type / for blocks`, style: `--rows:${rows}` });
  function Composer(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: `composer dock${p2.open ? "" : " collapsed"}`, id: "composer", children: [
      /* @__PURE__ */ u2("div", { class: "composer-h", id: "cbar", role: "button", tabindex: 0, title: "Write a comment (C)", onClick: on3?.toggle, onKeyDown: on3?.key, children: [
        I2("comment"),
        /* @__PURE__ */ u2("b", { children: "Add a comment" }),
        /* @__PURE__ */ u2("span", { class: "cbar-ph", children: p2.draft ? `Draft: ${p2.draft}` : "Write a comment\u2026" }),
        /* @__PURE__ */ u2("kbd", { children: "C" }),
        /* @__PURE__ */ u2("span", { class: "cbar-x", children: I2("chevron-down") })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: "composer-body", children: [
        /* @__PURE__ */ u2(DraftBox, { k: "comment", ph: "Write a comment\u2026 (Markdown supported)", rows: 4 }),
        /* @__PURE__ */ u2(ErrLine, { m: p2.err }),
        "\n  ",
        /* @__PURE__ */ u2("div", { class: "composer-f", children: [
          /* @__PURE__ */ u2("span", { class: "hint", children: "\u2318\u21B5 to send \xB7 Esc to collapse" }),
          /* @__PURE__ */ u2("span", { style: "flex:1" }),
          "\n  ",
          p2.merged ? "" : /* @__PURE__ */ u2("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: p2.closed ? "Reopen pull request" : "Close pull request" }),
          "\n  ",
          /* @__PURE__ */ u2("button", { class: "btn primary", id: "docomment", disabled: p2.busy, onClick: on3?.send, children: p2.busy ? "Sending\u2026" : "Comment" })
        ] })
      ] })
    ] });
  }
  var METHODS = [["merge", "Create a merge commit"], ["squash", "Squash and merge"], ["rebase", "Rebase and merge"]];
  function MergeAct(p2) {
    const { on: on3 } = p2;
    if (p2.draft) return /* @__PURE__ */ u2("div", { class: "merge-act", children: [
      /* @__PURE__ */ u2("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: "Close pull request" }),
      /* @__PURE__ */ u2(ErrLine, { m: p2.err })
    ] });
    return /* @__PURE__ */ u2("div", { class: "merge-act", children: [
      /* @__PURE__ */ u2("select", { class: "sel", id: "mmethod", children: METHODS.map(([v2, t2]) => /* @__PURE__ */ u2("option", { value: v2, selected: p2.method === v2, children: t2 })) }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "domerge", disabled: p2.busy, onClick: on3?.merge, children: p2.busy ? "Merging\u2026" : "Merge pull request" }),
      "\n  ",
      p2.auto ? /* @__PURE__ */ u2("button", { class: "btn", id: "noauto", title: `Auto-merge is on (${p2.auto.method})`, onClick: on3?.noauto, children: p2.auto.busy ? "Turning off\u2026" : "Disable auto-merge" }) : p2.canAuto ? /* @__PURE__ */ u2("button", { class: "btn", id: "doauto", title: "Merge automatically once required checks and reviews pass", onClick: on3?.auto, children: p2.autoBusy ? "Enabling\u2026" : "Enable auto-merge" }) : "",
      "\n  ",
      /* @__PURE__ */ u2("button", { class: "btn ghost", id: "todraft", title: "Mark as draft again", onClick: on3?.draft, children: "Convert to draft" }),
      /* @__PURE__ */ u2(ErrLine, { m: p2.err }),
      /* @__PURE__ */ u2(ErrLine, { m: p2.errAuto })
    ] });
  }

  // src/components/html.tsx
  var OPEN = "\uE000";
  var CLOSE = "\uE001";
  var chunks = [];
  var Raw = (s2) => {
    chunks.push(s2);
    return `${OPEN}${chunks.length - 1}${CLOSE}`;
  };

  // src/components/Comments.tsx
  var NL = "\n  ";
  function Who({ p: p2, st }) {
    const plural2 = p2.commits === 1 ? "" : "s";
    return st === "merged" ? /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("a", { class: "author", style: "text-decoration:underline;text-underline-offset:2px", href: p2.merged_by.html_url, children: p2.merged_by.login }),
      " merged ",
      p2.commits,
      " commit",
      plural2,
      " into"
    ] }) : /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("a", { class: "author", href: p2.user.html_url, children: p2.user.login }),
      " wants to merge ",
      p2.commits,
      " commit",
      plural2,
      " into"
    ] });
  }
  function PrHeader({ b: b2, st, ic, label, tab, split, hideSide: hideSide2, splitOk, commentsTotal, sq, on: on3 }) {
    const p2 = b2.pull, n2 = p2.number;
    const at = st === "merged" ? p2.merged_at : st === "closed" ? p2.closed_at : p2.created_at;
    const tabs = [["conversation", "comment-discussion", "Conversation", commentsTotal + 0], ["timeline", "clock", "Timeline", b2.timeline.length], ["commits", "git-commit", "Commits", p2.commits], ["checks", "checklist", "Checks", (b2.checks || []).length], ["files", "file-diff", "Files changed", p2.changed_files]];
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("div", { class: "pr-title-area", children: [
        /* @__PURE__ */ u2("h1", { class: "pr-title", children: [
          /* @__PURE__ */ u2("span", { children: p2.title }),
          /* @__PURE__ */ u2("span", { class: "num", children: [
            "#",
            n2
          ] }),
          p2.state === "open" && !p2.merged ? /* @__PURE__ */ u2("button", { class: "copy-btn", id: "editpr", onClick: on3?.edit, title: "Edit title and description", children: I2("pencil") }) : ""
        ] }),
        NL,
        /* @__PURE__ */ u2("div", { class: "pr-meta", children: [
          /* @__PURE__ */ u2("span", { class: `state-pill state-${st}`, children: [
            I2(ic),
            SP,
            label
          ] }),
          /* @__PURE__ */ u2("span", { children: /* @__PURE__ */ u2(Who, { p: p2, st }) }),
          SP,
          /* @__PURE__ */ u2("span", { class: "branch", title: `${p2.base.repo.full_name}:${p2.base.ref}`, children: p2.base.label }),
          SP,
          /* @__PURE__ */ u2("span", { children: "from" }),
          SP,
          /* @__PURE__ */ u2("span", { class: "branch", children: p2.head.label }),
          /* @__PURE__ */ u2("button", { class: "copy-btn", id: "copybranch", onClick: on3?.copy, "aria-label": "Copy head branch name to clipboard", children: I2("copy") }),
          /* @__PURE__ */ u2("span", { children: When(at) })
        ] })
      ] }),
      NL,
      /* @__PURE__ */ u2("div", { class: "pr-tabs", children: [
        /* @__PURE__ */ u2("span", { class: "mini", title: p2.title, children: [
          /* @__PURE__ */ u2("b", { children: [
            "#",
            n2
          ] }),
          SP,
          p2.title
        ] }),
        /* @__PURE__ */ u2("nav", { children: tabs.map(([k2, i2, t2, c2]) => /* @__PURE__ */ u2("a", { "data-tab": k2, class: tab === k2 ? "sel" : "", onClick: () => on3?.tab(k2), children: [
          I2(i2),
          t2,
          /* @__PURE__ */ u2("span", { class: "counter", children: c2 })
        ] })) }),
        NL,
        /* @__PURE__ */ u2("div", { class: "tools", children: [
          /* @__PURE__ */ u2("button", { class: "split-btn", id: "review", onClick: on3?.review, title: "Submit a review", children: [
            I2("eye"),
            /* @__PURE__ */ u2("span", { children: "Review" })
          ] }),
          /* @__PURE__ */ u2("button", { class: `split-btn ${hideSide2 || split ? "" : "on"}`, id: "sidetoggle", onClick: on3?.side, title: "Show or hide the details panel", disabled: tab !== "conversation" || split, style: tab !== "conversation" ? "visibility:hidden" : "", children: [
            I2("sidebar-expand"),
            /* @__PURE__ */ u2("span", { children: "Details" })
          ] }),
          /* @__PURE__ */ u2("button", { class: `split-btn ${splitOk && split ? "on" : ""}`, id: "split", onClick: on3?.split, title: splitOk ? "Split view: commits beside conversation" : "Split view is available on the Conversation and Commits tabs", disabled: !splitOk, children: [
            I2("columns"),
            /* @__PURE__ */ u2("span", { children: "Split view" })
          ] }),
          /* @__PURE__ */ u2("div", { class: "diffstat", children: [
            /* @__PURE__ */ u2("span", { class: "add", children: [
              "+",
              p2.additions
            ] }),
            /* @__PURE__ */ u2("span", { class: "del", children: [
              "-",
              p2.deletions
            ] }),
            /* @__PURE__ */ u2("span", { class: "sq", children: sq.map((c2) => /* @__PURE__ */ u2("i", { class: c2 })) })
          ] })
        ] })
      ] })
    ] });
  }
  function FoldBtn({ k: k2, title, def, folded: folded2, onFold }) {
    return /* @__PURE__ */ u2("button", { class: "fold-btn", "data-fold": k2, "data-def": def ? 1 : 0, title, onClick: onFold && ((e2) => onFold(e2, k2, def)), children: I2(folded2 ? "chevron-right" : "chevron-down") });
  }
  function ReactionsBar({ r: r2, kind, id, defs, on: on3 }) {
    const live = !!(kind && id);
    const items = defs.filter(({ k: k2 }) => (r2?.[k2] ?? 0) > 0).map(({ k: k2, e: e2 }) => live ? /* @__PURE__ */ u2("span", { class: "reaction rc-btn", "data-rck": kind, "data-rcid": id, "data-rcc": k2, title: "Click to add or remove your reaction", onClick: on3 && ((ev) => on3.toggle(ev, kind, id, k2)), onMouseEnter: on3 && (() => on3.hover(kind, id)), children: [
      /* @__PURE__ */ u2("span", { class: "e", children: e2 }),
      /* @__PURE__ */ u2("span", { children: r2?.[k2] })
    ] }) : /* @__PURE__ */ u2("span", { class: "reaction", children: [
      /* @__PURE__ */ u2("span", { class: "e", children: e2 }),
      /* @__PURE__ */ u2("span", { children: r2?.[k2] })
    ] }));
    const add = live ? /* @__PURE__ */ u2("span", { class: "react-wrap", children: /* @__PURE__ */ u2("button", { class: "react-add", "data-rk": kind, "data-rid": id, title: "Add reaction", onClick: on3 && ((ev) => on3.add(ev, ev.currentTarget)), onMouseEnter: on3 && (() => on3.hover(kind, id)), children: I2("smiley") }) }) : null;
    return items.length || add ? /* @__PURE__ */ u2("div", { class: "reactions", children: [
      items,
      add
    ] }) : null;
  }
  function CommentBox({ c: c2, assoc, bodyHtml, folded: folded2, reactions, flush, on: on3 }) {
    const u3 = c2.user || c2.actor, k2 = "c:" + c2.id;
    return /* @__PURE__ */ u2("div", { class: `tl-comment${folded2 ? " folded" : ""}`, id: `c-${c2.id ?? ""}`, style: flush ? "margin-bottom:0" : void 0, children: [
      /* @__PURE__ */ u2("div", { class: "avatar-col", children: /* @__PURE__ */ u2("a", { href: u3?.html_url, children: Av(u3, 40) }) }),
      NL,
      /* @__PURE__ */ u2("div", { class: "cbox", children: [
        /* @__PURE__ */ u2("div", { class: "chead", children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2(FoldBtn, { k: k2, title: "Hide this comment", def: false, folded: folded2, onFold: on3?.fold }),
            SP,
            /* @__PURE__ */ u2("a", { class: "author u", href: u3?.html_url, children: /* @__PURE__ */ u2("span", { class: "author", style: "font-weight:600;color:var(--fgColor-default)", children: u3?.login || "ghost" }) }),
            " commented",
            SP,
            /* @__PURE__ */ u2("a", { class: "ts", href: c2.html_url || "#", children: When(c2.created_at || c2.submitted_at) })
          ] }),
          NL,
          /* @__PURE__ */ u2("div", { class: "rt", children: [
            assoc ? /* @__PURE__ */ u2("span", { class: "assoc", children: assoc }) : "",
            /* @__PURE__ */ u2("button", { class: "cm-btn", "data-cm": c2.id, title: "Comment actions", onClick: on3 && ((e2) => on3.menu(e2, e2.currentTarget)), children: "\u22EF" })
          ] })
        ] }),
        NL,
        /* @__PURE__ */ u2("div", { class: "cbody", children: bodyHtml ? /* @__PURE__ */ u2("div", { class: "markdown-body", dangerouslySetInnerHTML: { __html: bodyHtml } }) : /* @__PURE__ */ u2("span", { class: "empty", children: "No description provided." }) }),
        /* @__PURE__ */ u2(ReactionsBar, { ...reactions, on: on3?.react })
      ] })
    ] });
  }
  function DiffHunkTable({ rows }) {
    return /* @__PURE__ */ u2("table", { class: "diff", children: [
      /* @__PURE__ */ u2("colgroup", { children: [
        /* @__PURE__ */ u2("col", { style: "width:50px" }),
        /* @__PURE__ */ u2("col", { style: "width:50px" }),
        /* @__PURE__ */ u2("col", {})
      ] }),
      rows.map((r2) => {
        if (r2.kind === "hunk") return /* @__PURE__ */ u2("tr", { class: "hunk", children: [
          /* @__PURE__ */ u2("td", { class: "num", children: "\u2026" }),
          /* @__PURE__ */ u2("td", { class: "num", children: "\u2026" }),
          /* @__PURE__ */ u2("td", { class: "code", children: r2.text })
        ] });
        if (r2.kind === "add") return /* @__PURE__ */ u2("tr", { class: "add", children: [
          /* @__PURE__ */ u2("td", { class: "num" }),
          /* @__PURE__ */ u2("td", { class: "num", children: r2.n }),
          /* @__PURE__ */ u2("td", { class: "code", "data-marker": "+", children: r2.text })
        ] });
        if (r2.kind === "del") return /* @__PURE__ */ u2("tr", { class: "del", children: [
          /* @__PURE__ */ u2("td", { class: "num", children: r2.o }),
          /* @__PURE__ */ u2("td", { class: "num" }),
          /* @__PURE__ */ u2("td", { class: "code", "data-marker": "-", children: r2.text })
        ] });
        if (r2.kind === "meta") return /* @__PURE__ */ u2("tr", { children: [
          /* @__PURE__ */ u2("td", { class: "num" }),
          /* @__PURE__ */ u2("td", { class: "num" }),
          /* @__PURE__ */ u2("td", { class: "code", style: "color:var(--fgColor-muted)", children: r2.text })
        ] });
        return /* @__PURE__ */ u2("tr", { children: [
          /* @__PURE__ */ u2("td", { class: "num", children: r2.o }),
          /* @__PURE__ */ u2("td", { class: "num", children: r2.n }),
          /* @__PURE__ */ u2("td", { class: "code", "data-marker": " ", children: r2.text })
        ] });
      })
    ] });
  }

  // src/components/Merge.tsx
  function MergedBox({ head: head2 }) {
    return /* @__PURE__ */ u2("div", { class: "TL", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-break", style: "margin-left:0" }),
      /* @__PURE__ */ u2("div", { class: "merge-box", children: [
        /* @__PURE__ */ u2("div", { class: "badge", children: /* @__PURE__ */ u2("span", { class: "state-merged", style: "background:var(--bgColor-done-emphasis)", children: I2("git-merge") }) }),
        /* @__PURE__ */ u2("div", { class: "merge-card merged-card", children: /* @__PURE__ */ u2("div", { class: "row", children: /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("h3", { children: "Pull request successfully merged and closed" }),
          /* @__PURE__ */ u2("p", { style: "font-size:14px;margin-top:4px", children: [
            "You're all set \u2014 the ",
            /* @__PURE__ */ u2("span", { class: "branch", children: head2 }),
            " branch can be safely deleted."
          ] })
        ] }) }) })
      ] })
    ] });
  }
  function ClosedBox({ head: head2 }) {
    return /* @__PURE__ */ u2("div", { class: "merge-box", children: [
      /* @__PURE__ */ u2("div", { class: "badge", children: /* @__PURE__ */ u2("span", { class: "state-closed", style: "background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))", children: I2("git-pull-request-closed") }) }),
      /* @__PURE__ */ u2("div", { class: "merge-card", children: /* @__PURE__ */ u2("div", { class: "row", children: /* @__PURE__ */ u2("div", { children: [
        /* @__PURE__ */ u2("h3", { children: "Closed with unmerged commits" }),
        /* @__PURE__ */ u2("p", { style: "font-size:14px;margin-top:4px", children: [
          "This pull request is closed, but the ",
          /* @__PURE__ */ u2("span", { class: "branch", children: head2 }),
          " branch has unmerged commits."
        ] })
      ] }) }) })
    ] });
  }
  var plural = (n2) => n2 === 1 ? "" : "s";
  function Sec({ k: k2, h: h2, rerunable, open: open2, children, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "mb-sec", children: [
      /* @__PURE__ */ u2("button", { class: `mb-h ${h2[0]}`, "data-mb": k2, onClick: on3 && ((e2) => on3.toggle(e2, k2)), children: [
        /* @__PURE__ */ u2("span", { class: "mb-ic", children: I2(h2[1], 22) }),
        /* @__PURE__ */ u2("span", { class: "mb-t", children: [
          /* @__PURE__ */ u2("b", { children: h2[2] }),
          /* @__PURE__ */ u2("i", { children: h2[3] || "" })
        ] }),
        k2 === "ck" && rerunable ? /* @__PURE__ */ u2("span", { class: "btn small", id: "rerunck", role: "button", onClick: on3?.rerun, children: "Re-run failed" }) : "",
        I2(open2 ? "chevron-up" : "chevron-down", 16)
      ] }),
      open2 && children ? /* @__PURE__ */ u2("div", { class: "mb-body", children }) : ""
    ] });
  }
  function CkGroupView({ g: g2, on: on3 }) {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("button", { class: "mb-grp", "data-mb": `g${g2.k}`, onClick: on3 && ((e2) => on3.toggle(e2, `g${g2.k}`)), children: [
        g2.title,
        SP,
        I2(g2.open ? "chevron-up" : "chevron-down", 12)
      ] }),
      g2.open ? g2.items.map((c2) => /* @__PURE__ */ u2("a", { class: `mb-ck ${c2.st}`, href: c2.url || void 0, children: [
        I2(c2.icon, 14),
        /* @__PURE__ */ u2("b", { children: c2.name }),
        c2.req ? /* @__PURE__ */ u2("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
        /* @__PURE__ */ u2("i", { children: c2.desc })
      ] })) : ""
    ] });
  }
  function MergeBox(p2) {
    const { rv, ck, on: on3 } = p2;
    const rvBody = /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("div", { class: "mb-line", children: [
        I2("check", 14),
        SP,
        rv.ap,
        " approval",
        plural(rv.ap)
      ] }),
      rv.cr ? /* @__PURE__ */ u2("div", { class: "mb-line bad", children: [
        I2("x-circle-fill", 14),
        SP,
        rv.cr,
        " requested changes"
      ] }) : "",
      /* @__PURE__ */ u2("div", { class: "mb-line", children: [
        I2("person", 14),
        SP,
        rv.pend,
        " pending review",
        plural(rv.pend),
        rv.pend ? `: ${rv.pendNames}` : ""
      ] })
    ] });
    return /* @__PURE__ */ u2("div", { class: "merge-box", children: [
      /* @__PURE__ */ u2("div", { class: "badge", children: /* @__PURE__ */ u2("span", { style: "background:var(--bgColor-success-emphasis)", children: I2("git-pull-request") }) }),
      /* @__PURE__ */ u2("div", { class: "merge-card mb-card", children: [
        p2.draft ? /* @__PURE__ */ u2(S2, { children: [
          /* @__PURE__ */ u2("div", { class: "mb-sec", children: /* @__PURE__ */ u2("div", { class: "mb-h", children: [
            /* @__PURE__ */ u2("span", { class: "mb-ic", children: I2("git-pull-request-draft", 22) }),
            /* @__PURE__ */ u2("span", { class: "mb-t", children: [
              /* @__PURE__ */ u2("b", { children: "This pull request is still a work in progress" }),
              /* @__PURE__ */ u2("i", { children: "Draft pull requests cannot be merged." })
            ] }),
            /* @__PURE__ */ u2("button", { class: "btn primary", id: "doready", onClick: on3?.ready, children: p2.busyReady ? "Updating\u2026" : "Ready for review" })
          ] }) }),
          /* @__PURE__ */ u2(ErrLine, { m: p2.errReady })
        ] }) : "",
        /* @__PURE__ */ u2(Sec, { k: "rv", h: rv.h, open: rv.open, on: on3, children: rvBody }),
        ck ? /* @__PURE__ */ u2(Sec, { k: "ck", h: ck.h, rerunable: ck.rerunable, open: ck.open, on: on3, children: ck.groups.map((g2) => /* @__PURE__ */ u2(CkGroupView, { g: g2, on: on3 })) }) : "",
        p2.behind ? /* @__PURE__ */ u2("div", { class: "mb-sec mb-warn", children: /* @__PURE__ */ u2("div", { class: "mb-h", children: [
          /* @__PURE__ */ u2("span", { class: "mb-ic", children: I2("alert", 22) }),
          /* @__PURE__ */ u2("span", { class: "mb-t", children: [
            /* @__PURE__ */ u2("b", { children: "This branch is out-of-date with the base branch" }),
            /* @__PURE__ */ u2("i", { children: [
              "Merge the latest changes from ",
              p2.baseRef,
              " into this branch."
            ] })
          ] }),
          /* @__PURE__ */ u2("button", { class: "btn", id: "updbranch", onClick: on3?.update, children: p2.busyUpdate ? "Updating\u2026" : "Update branch" })
        ] }) }) : "",
        /* @__PURE__ */ u2("div", { class: "mb-sec", children: /* @__PURE__ */ u2("div", { class: `mb-h ${p2.clean ? "ok" : "bad"}`, children: [
          /* @__PURE__ */ u2("span", { class: "mb-ic", children: I2(p2.clean ? "check-circle-fill" : "alert", 22) }),
          /* @__PURE__ */ u2("span", { class: "mb-t", children: [
            /* @__PURE__ */ u2("b", { children: p2.clean ? "This branch has no conflicts with the base branch" : "This branch has conflicts that must be resolved" }),
            /* @__PURE__ */ u2("i", { children: p2.clean ? "Merging can be performed automatically." : "Use the web editor or the command line to resolve conflicts." })
          ] })
        ] }) }),
        /* @__PURE__ */ u2(ErrLine, { m: p2.errUpdate })
      ] })
    ] });
  }
  function ReviewerRow({ r: r2, on: on3 }) {
    const ic = r2.st === "req" && r2.prev ? /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("span", { title: "Asked to review again", style: "margin-right:6px", children: I2("sync") }),
      I2(r2.prev === "approved" ? "check" : r2.prev === "changes_requested" ? "file-diff" : "comment")
    ] }) : I2(r2.st === "approved" ? "check" : r2.st === "changes_requested" ? "file-diff" : r2.st === "req" ? "dot-fill" : "comment");
    return /* @__PURE__ */ u2("div", { class: "reviewer", children: [
      /* @__PURE__ */ u2("a", { href: r2.u.html_url, children: Av(r2.u, 20) }),
      /* @__PURE__ */ u2("a", { class: "nm", href: r2.u.html_url, children: r2.u.login }),
      /* @__PURE__ */ u2("span", { class: `st ${r2.st === "approved" ? "ok" : r2.st === "changes_requested" ? "bad" : ""}`, children: ic }),
      r2.canRe ? /* @__PURE__ */ u2("button", { class: "rerequest", "data-rerequest": r2.u.login, title: `Ask ${r2.u.login} to review again`, onClick: (e2) => on3.rerequest(e2, r2.u.login ?? ""), children: I2("sync") }) : ""
    ] });
  }
  function PrSide(p2) {
    const { on: on3 } = p2, rv = p2.reviewers, more = rv.length - 3;
    const rvSection = rv.length ? /* @__PURE__ */ u2(S2, { children: [
      rv.slice(0, 3).map((r2) => /* @__PURE__ */ u2(ReviewerRow, { r: r2, on: on3 })),
      more > 0 ? /* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2("button", { class: "sb-toggle", id: "rvtoggle", onClick: on3.rvtoggle, children: [
          /* @__PURE__ */ u2("span", { children: [
            "+",
            more,
            " more reviewer",
            plural(more)
          ] }),
          I2(p2.showAll ? "chevron-up" : "chevron-down")
        ] }),
        p2.showAll ? rv.slice(3).map((r2) => /* @__PURE__ */ u2(ReviewerRow, { r: r2, on: on3 })) : ""
      ] }) : ""
    ] }) : /* @__PURE__ */ u2("div", { class: "sb-none", children: "No reviews" });
    const fb = (k2, n2) => /* @__PURE__ */ u2(SideFold, { k: "sb:" + n2, folded: p2.folded[k2], onFold: on3.fold });
    const head2 = (k2, t2) => /* @__PURE__ */ u2("div", { class: "sb-head", children: [
      fb(k2, t2 === "people" ? "people" : t2),
      /* @__PURE__ */ u2("span", { children: t2 }),
      I2("gear", 16, "gear")
    ] });
    const box = (k2) => `sb-item${p2.folded[k2] ? " folded" : ""}`;
    return /* @__PURE__ */ u2("div", { class: "pr-side-inner", children: [
      /* @__PURE__ */ u2("div", { class: box("reviewers"), children: [
        /* @__PURE__ */ u2("div", { class: "sb-head", children: [
          fb("reviewers", "Reviewers"),
          /* @__PURE__ */ u2("span", { children: "Reviewers" })
        ] }),
        rvSection
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: box("assignees"), children: [
        head2("assignees", "Assignees"),
        p2.assignees.length ? p2.assignees.map((u3) => /* @__PURE__ */ u2("div", { class: "reviewer", children: [
          /* @__PURE__ */ u2("a", { href: u3.html_url, children: Av(u3, 20) }),
          /* @__PURE__ */ u2("a", { class: "nm", href: u3.html_url, children: u3.login })
        ] })) : /* @__PURE__ */ u2("span", { class: "sb-none", children: "No one\u2014" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: box("labels"), children: [
        head2("labels", "Labels"),
        p2.labels.length ? p2.labels.map((l2) => /* @__PURE__ */ u2("span", { class: "pill-label", style: `background:#${l2.color}33;color:#${l2.color};border-color:#${l2.color}`, children: l2.name })) : /* @__PURE__ */ u2("span", { class: "sb-none", children: "None yet" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: box("milestone"), children: [
        head2("milestone", "Milestone"),
        p2.milestone ? /* @__PURE__ */ u2("a", { class: "sb-link", href: p2.milestone.html_url, children: p2.milestone.title }) : /* @__PURE__ */ u2("span", { class: "sb-none", children: "No milestone" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: box("people"), children: [
        /* @__PURE__ */ u2("div", { class: "sb-head", children: [
          fb("people", "people"),
          /* @__PURE__ */ u2("span", { children: [
            p2.peopleCount,
            " participant",
            plural(p2.peopleCount)
          ] })
        ] }),
        /* @__PURE__ */ u2("div", { class: "participants", children: p2.people.map((u3) => /* @__PURE__ */ u2("a", { href: u3.html_url, title: u3.login, children: Av(u3, 32) })) })
      ] })
    ] });
  }
  function SideFold({ k: k2, folded: folded2, onFold }) {
    return /* @__PURE__ */ u2("button", { class: "fold-btn", "data-fold": k2, "data-def": "0", title: "Hide section", onClick: (e2) => {
      e2.stopPropagation();
      onFold(k2, false);
    }, children: I2(folded2 ? "chevron-right" : "chevron-down") });
  }
  function CommitsDialog(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", onMouseDown: on3 && ((e2) => {
      if (e2.target.id === "dlgbg") on3.close();
    }), children: /* @__PURE__ */ u2("div", { class: "dlg cp-dlg", children: [
      /* @__PURE__ */ u2("div", { class: "cp-h", children: [
        /* @__PURE__ */ u2("h2", { children: "Select commits to view" }),
        /* @__PURE__ */ u2("button", { class: "icon-btn", id: "cpx", title: "Close", onClick: on3?.close, children: I2("x") })
      ] }),
      /* @__PURE__ */ u2("button", { class: `cp-opt${p2.allOn ? " on" : ""}`, id: "cpall", onClick: on3?.all, children: [
        /* @__PURE__ */ u2("b", { children: "All commits" }),
        /* @__PURE__ */ u2("i", { children: [
          p2.count,
          " commit",
          plural(p2.count)
        ] })
      ] }),
      p2.since ? /* @__PURE__ */ u2("button", { class: `cp-opt${p2.since.on ? " on" : ""}`, id: "cpsince", disabled: !p2.since.n, onClick: on3?.since, children: [
        /* @__PURE__ */ u2("b", { children: "Changes since your last review" }),
        /* @__PURE__ */ u2("i", { children: p2.since.n ? `${p2.since.n} commit${plural(p2.since.n)}` : "No new commits" })
      ] }) : "",
      /* @__PURE__ */ u2("div", { class: "cp-sub", children: "Select a commit, or click a second one to view the range between them" }),
      /* @__PURE__ */ u2("input", { class: "input cp-q", id: "cpq", placeholder: "Filter commits\u2026", value: p2.filter, onInput: on3?.filter }),
      /* @__PURE__ */ u2("div", { class: "cp-list", id: "cplist", "data-q": p2.filter.toLowerCase(), children: p2.rows.map((r2) => /* @__PURE__ */ u2("label", { class: `cp-row${r2.on ? " on" : ""}`, "data-cp": r2.i, hidden: r2.hidden, onClick: on3 && ((e2) => on3.pick(e2, r2.i)), children: [
        /* @__PURE__ */ u2("input", { type: "checkbox", checked: r2.on, tabindex: -1 }),
        /* @__PURE__ */ u2("span", { class: "cp-t", children: [
          /* @__PURE__ */ u2("b", { children: r2.title }),
          /* @__PURE__ */ u2("i", { children: [
            r2.by,
            " committed ",
            r2.when
          ] })
        ] }),
        /* @__PURE__ */ u2("code", { children: r2.sha })
      ] })).reverse() }),
      /* @__PURE__ */ u2("div", { class: "btns", children: [
        /* @__PURE__ */ u2("span", { class: "cp-sel", children: p2.selLabel }),
        /* @__PURE__ */ u2("span", { class: "sp" }),
        /* @__PURE__ */ u2("button", { class: "btn", id: "cpcancel", onClick: on3?.close, children: "Cancel" }),
        /* @__PURE__ */ u2("button", { class: "btn primary", id: "cpsave", disabled: !p2.hasPick, onClick: on3?.save, children: "Save" })
      ] })
    ] }) });
  }
  function FcBar(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: "fc-bar", children: [
      /* @__PURE__ */ u2("button", { class: "btn small", id: "fcbtn", title: "Choose which commits to view", onClick: on3?.commits, children: [
        I2("git-commit"),
        SP,
        p2.label,
        p2.count !== null ? /* @__PURE__ */ u2(S2, { children: [
          SP,
          /* @__PURE__ */ u2("span", { class: "counter", children: p2.count })
        ] }) : "",
        p2.code ? /* @__PURE__ */ u2(S2, { children: [
          SP,
          /* @__PURE__ */ u2("code", { children: p2.code })
        ] }) : "",
        SP,
        "\u25BE"
      ] }),
      p2.nav ? /* @__PURE__ */ u2("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u2("button", { "data-fstep": "-1", disabled: p2.nav.prevOff, onClick: on3 && (() => on3.step(-1)), children: "\u2039 Prev" }),
        /* @__PURE__ */ u2("button", { "data-fstep": "1", disabled: p2.nav.nextOff, onClick: on3 && (() => on3.step(1)), children: "Next \u203A" })
      ] }) : "",
      p2.hasRange ? /* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2("span", { class: "fc-t", children: p2.title }),
        /* @__PURE__ */ u2("button", { class: "link-btn", id: "fcall", onClick: on3?.all, children: "Show all commits" })
      ] }) : ""
    ] });
  }
  var SORTS = [["path", "GitHub order"], ["pathz", "Path Z\u2013A"], ["most", "Most changed"], ["least", "Least changed"], ["comments", "Most comments"], ["status", "By status"]];
  function FilesBar(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: "files-bar", children: [
      /* @__PURE__ */ u2("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u2("button", { class: p2.mode === "unified" ? "on" : "", "data-dmode": "unified", onClick: on3 && (() => on3.mode("unified")), children: "Unified" }),
        /* @__PURE__ */ u2("button", { class: p2.mode === "split" ? "on" : "", "data-dmode": "split", onClick: on3 && (() => on3.mode("split")), children: "Split" })
      ] }),
      /* @__PURE__ */ u2("select", { class: "input fsort", id: "fsort", title: "Sort files", onChange: on3?.sort, children: SORTS.map(([v2, t2]) => /* @__PURE__ */ u2("option", { value: v2, selected: p2.sort === v2, children: t2 })) }),
      p2.pending ? /* @__PURE__ */ u2("button", { class: "btn small primary", id: "finishrev", onClick: on3?.finish, children: [
        "Finish review \xB7 ",
        p2.pending,
        " comment",
        plural(p2.pending)
      ] }) : "",
      /* @__PURE__ */ u2("button", { class: "link-btn", "data-foldall": p2.allFolded ? "open" : "close", "data-files": p2.names.join("\n"), onClick: on3 && (() => on3.foldAll(p2.allFolded, p2.names)), children: p2.allFolded ? "Expand all files" : "Collapse all files" })
    ] });
  }
  function FileBox(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: `file${p2.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u2("div", { class: "file-head", "data-fold": `f:${p2.name}`, onClick: on3 && ((e2) => on3.fold(e2, `f:${p2.name}`, false)), children: [
        /* @__PURE__ */ u2("span", { class: "tgl", children: I2(p2.closed ? "chevron-right" : "chevron-down") }),
        /* @__PURE__ */ u2("span", { class: "stat", children: [
          /* @__PURE__ */ u2("span", { class: "a", children: [
            "+",
            p2.add
          ] }),
          SP,
          /* @__PURE__ */ u2("span", { class: "d", children: [
            "\u2212",
            p2.del
          ] })
        ] }),
        /* @__PURE__ */ u2("span", { class: "sq", children: p2.sq.map((c2) => /* @__PURE__ */ u2("i", { class: c2 })) }),
        /* @__PURE__ */ u2("span", { class: "path", children: p2.name })
      ] }),
      p2.children
    ] });
  }
  function CommitsList({ rows }) {
    return /* @__PURE__ */ u2("div", { style: "border:1px solid var(--borderColor-default);border-radius:6px", children: rows.length ? rows.map((r2) => /* @__PURE__ */ u2("div", { style: "padding:16px;border-bottom:1px solid var(--borderColor-muted)", children: r2 })) : /* @__PURE__ */ u2("div", { class: "diff-empty", children: "No commits listed." }) });
  }
  function CmItem({ c: c2, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: `cm ${c2.on ? "on" : ""}`, "data-sha": c2.sha, onClick: on3 && (() => on3.pick(c2.sha)), children: [
      /* @__PURE__ */ u2("span", { class: "cm-av", children: c2.author ? Av(c2.author, 24) : /* @__PURE__ */ u2("i", { children: c2.initial }) }),
      /* @__PURE__ */ u2("span", { class: "cm-t", children: [
        /* @__PURE__ */ u2("b", { children: c2.title }),
        /* @__PURE__ */ u2("i", { children: c2.sub })
      ] }),
      c2.n ? /* @__PURE__ */ u2("span", { class: "cm-n", children: [
        I2("comment"),
        c2.n
      ] }) : "",
      /* @__PURE__ */ u2("code", { children: c2.sha.slice(0, 7) })
    ] });
  }
  function Rail({ k: k2, label, ic, on: on3 }) {
    return /* @__PURE__ */ u2("button", { class: "pane-rail", "data-show": k2, title: `Show ${label}`, onClick: on3 && (() => on3.hide(k2, false)), children: [
      I2(ic),
      /* @__PURE__ */ u2("span", { children: label })
    ] });
  }
  function SplitView(p2) {
    const { on: on3 } = p2;
    const left = p2.hl ? /* @__PURE__ */ u2(Rail, { k: "l", label: "Commits", ic: "git-commit", on: on3 }) : /* @__PURE__ */ u2("section", { class: "pane pane-l", children: [
      /* @__PURE__ */ u2("div", { class: `fold-sec${p2.foldList ? " folded" : ""}`, children: [
        /* @__PURE__ */ u2("div", { class: "pane-h", children: [
          I2("git-commit"),
          /* @__PURE__ */ u2("span", { children: "Commits" }),
          /* @__PURE__ */ u2("span", { class: "counter", children: p2.count }),
          /* @__PURE__ */ u2("span", { class: "sp" }),
          /* @__PURE__ */ u2("button", { class: "fold-btn flip-btn", "data-flip": "", title: "Swap sides (F)", onClick: on3?.flip, children: "\u21C4" }),
          /* @__PURE__ */ u2(FoldBtn, { k: "cm-list", title: "Collapse commit list", def: false, folded: p2.foldList, onFold: on3?.fold }),
          /* @__PURE__ */ u2("button", { class: "fold-btn", "data-hide": "l", title: "Hide this panel", onClick: on3 && (() => on3.hide("l", true)), children: I2("x") })
        ] }),
        /* @__PURE__ */ u2("div", { class: "cm-list", children: [
          /* @__PURE__ */ u2("div", { class: `cm all ${p2.allOn ? "on" : ""}`, "data-sha": "", onClick: on3 && (() => on3.pick("")), children: [
            /* @__PURE__ */ u2("span", { class: "cm-av", children: /* @__PURE__ */ u2("i", { children: I2("diff") }) }),
            /* @__PURE__ */ u2("span", { class: "cm-t", children: [
              /* @__PURE__ */ u2("b", { children: "All changes" }),
              /* @__PURE__ */ u2("i", { children: p2.allSub })
            ] })
          ] }),
          p2.rows.map((c2) => /* @__PURE__ */ u2(CmItem, { c: c2, on: on3 }))
        ] })
      ] }),
      /* @__PURE__ */ u2("div", { class: `fold-sec${p2.foldDiff ? " folded" : ""}`, children: [
        /* @__PURE__ */ u2("div", { class: "pane-h sub", children: [
          I2("file-diff"),
          /* @__PURE__ */ u2("span", { children: p2.subTitle }),
          /* @__PURE__ */ u2("span", { class: "sp" }),
          /* @__PURE__ */ u2(FoldBtn, { k: "cm-diff", title: "Collapse changes", def: false, folded: p2.foldDiff, onFold: on3?.fold })
        ] }),
        /* @__PURE__ */ u2("div", { class: "pane-body", children: p2.diff })
      ] })
    ] });
    const right = p2.hr ? /* @__PURE__ */ u2(Rail, { k: "r", label: "Conversation", ic: "comment-discussion", on: on3 }) : /* @__PURE__ */ u2("section", { class: "pane pane-r", children: [
      /* @__PURE__ */ u2("div", { class: "pane-h", children: [
        I2("comment-discussion"),
        /* @__PURE__ */ u2("span", { children: "Conversation" }),
        /* @__PURE__ */ u2("span", { class: "sp" }),
        /* @__PURE__ */ u2("button", { class: "fold-btn flip-btn", "data-flip": "", title: "Swap sides (F)", onClick: on3?.flip, children: "\u21C4" }),
        /* @__PURE__ */ u2("button", { class: "fold-btn", "data-hide": "r", title: "Hide this panel", onClick: on3 && (() => on3.hide("r", true)), children: I2("x") })
      ] }),
      /* @__PURE__ */ u2("div", { class: "pane-body", children: p2.right })
    ] });
    return /* @__PURE__ */ u2("div", { class: `split ${p2.hl ? "hl" : ""} ${p2.hr ? "hr" : ""} ${p2.flip ? "flip" : ""}`, style: `--lw:${p2.lw}%`, children: [
      left,
      p2.hl || p2.hr ? "" : /* @__PURE__ */ u2("div", { class: "gutter", id: "gutter", title: "Drag to resize", onMouseDown: on3?.gutter }),
      right
    ] });
  }

  // src/components/Dialogs.tsx
  var Err = ({ m: m2 }) => /* @__PURE__ */ u2("div", { id: "reverr", children: m2 ? /* @__PURE__ */ u2("div", { class: "act-err", children: m2 }) : "" });
  var REVS = [["COMMENT", "Comment", "Submit general feedback without explicit approval."], ["APPROVE", "Approve", "Submit feedback and approve merging these changes."], ["REQUEST_CHANGES", "Request changes", "Submit feedback that must be addressed before merging."]];
  var ReviewDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u2("h2", { children: "Finish your review" }),
    /* @__PURE__ */ u2(DraftBox, { k: "review", ph: p2.ph, rows: 5 }),
    /* @__PURE__ */ u2("div", { class: "radios", children: REVS.map(([v2, t2, d2]) => /* @__PURE__ */ u2("label", { children: [
      /* @__PURE__ */ u2("input", { type: "radio", name: "rev", value: v2, checked: p2.ev === v2, onChange: () => p2.onEv(v2) }),
      " ",
      /* @__PURE__ */ u2("b", { children: t2 }),
      " ",
      /* @__PURE__ */ u2("span", { children: d2 })
    ] })) }),
    /* @__PURE__ */ u2(Err, { m: p2.err }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "revcancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "revsubmit", onClick: p2.ok, children: "Submit review" })
    ] })
  ] }) });
  var EditPrDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u2("h2", { children: "Edit pull request" }),
    /* @__PURE__ */ u2("label", { class: "np-l", children: "Title" }),
    /* @__PURE__ */ u2("input", { class: "input", id: "eptitle", value: p2.title, onInput: (e2) => p2.onTitle(e2.target.value), style: "width:100%;box-sizing:border-box;height:34px" }),
    /* @__PURE__ */ u2("label", { class: "np-l", children: "Description" }),
    /* @__PURE__ */ u2(DraftBox, { k: "prbody", ph: "Describe your changes", rows: 8 }),
    /* @__PURE__ */ u2(Err, { m: p2.err }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "epcancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "epsave", onClick: p2.ok, children: "Save" })
    ] })
  ] }) });
  var ConfirmDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg", children: [
    /* @__PURE__ */ u2("h2", { children: p2.title }),
    /* @__PURE__ */ u2("p", { children: p2.text }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "cfcancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: `btn ${p2.danger ? "danger" : "primary"}`, id: "cfok", onClick: p2.ok, children: p2.label })
    ] })
  ] }) });
  var EditCommentDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u2("h2", { children: "Edit comment" }),
    /* @__PURE__ */ u2(DraftBox, { k: "editc", ph: "Edit your comment", rows: 6 }),
    /* @__PURE__ */ u2(Err, { m: p2.err }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "eccancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "ecsave", onClick: p2.ok, children: "Save" })
    ] })
  ] }) });
  var DeleteCommentDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg", children: [
    /* @__PURE__ */ u2("h2", { children: "Delete this comment?" }),
    /* @__PURE__ */ u2("p", { style: "color:var(--fgColor-muted)", children: "This can't be undone." }),
    /* @__PURE__ */ u2(Err, { m: p2.err }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "dccancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn danger", id: "dcdo", onClick: p2.ok, children: "Delete" })
    ] })
  ] }) });
  var HideCommentDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg", children: [
    /* @__PURE__ */ u2("h2", { children: "Hide this comment" }),
    /* @__PURE__ */ u2("label", { class: "np-l", children: "Reason" }),
    /* @__PURE__ */ u2("select", { class: "sel", id: "hcreason", style: "width:100%;height:34px", children: p2.reasons.map(([v2, l2]) => /* @__PURE__ */ u2("option", { value: v2, selected: v2 === "OUTDATED", children: l2 })) }),
    /* @__PURE__ */ u2(Err, { m: p2.err }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "hccancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "hcdo", onClick: p2.ok, children: "Hide comment" })
    ] })
  ] }) });
  var TokenDialog = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u2("div", { class: "dlg", children: [
    /* @__PURE__ */ u2("h2", { children: "GitHub classic token" }),
    /* @__PURE__ */ u2("p", { children: [
      "Use a ",
      /* @__PURE__ */ u2("b", { children: "classic" }),
      " personal access token with the ",
      /* @__PURE__ */ u2("code", { children: "repo" }),
      " scope. It lists all your repositories (including organization ones) and raises the rate limit to 5,000 requests per hour. Organization with SSO: after creating it, click ",
      /* @__PURE__ */ u2("b", { children: "Configure SSO \u2192 Authorize" }),
      ". Stored in your OS keychain. Leave empty and save to remove it."
    ] }),
    /* @__PURE__ */ u2("div", { class: "oauth-row", children: [
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "oauthgo", onClick: p2.go, children: "Sign in with GitHub" }),
      /* @__PURE__ */ u2("span", { children: "or paste a token below" })
    ] }),
    /* @__PURE__ */ u2("div", { id: "oauthbox", children: p2.code ? /* @__PURE__ */ u2("div", { class: "oauth-code", children: [
      /* @__PURE__ */ u2("span", { children: "Enter this code on GitHub" }),
      /* @__PURE__ */ u2("b", { children: p2.code }),
      /* @__PURE__ */ u2("small", { children: "Waiting for approval\u2026" })
    ] }) : p2.err ? /* @__PURE__ */ u2("div", { class: "err", style: "margin:8px 0", children: p2.err }) : "" }),
    /* @__PURE__ */ u2("p", { children: /* @__PURE__ */ u2("a", { href: "https://github.com/settings/tokens/new?scopes=repo&description=Pullscope", children: "Create a classic token (repo scope preselected) \u2197" }) }),
    /* @__PURE__ */ u2("input", { class: "input", id: "tokeninput", type: "password", placeholder: "ghp_\u2026", style: "width:100%;box-sizing:border-box" }),
    /* @__PURE__ */ u2("div", { class: "btns", children: [
      /* @__PURE__ */ u2("button", { class: "btn", id: "tokcancel", onClick: p2.close, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "toksave", onClick: p2.save, children: "Save" })
    ] })
  ] }) });
  var CmPop = ({ x: x2, y: y2, hr, edit, hide: hide2, del, pick }) => /* @__PURE__ */ u2("div", { class: "react-pop cm-pop", style: `left:${x2}px;top:${y2}px`, children: [
    /* @__PURE__ */ u2("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" }),
    /* @__PURE__ */ u2("button", { "data-h": "md", onClick: () => pick("md"), children: "Copy Markdown" }),
    /* @__PURE__ */ u2("button", { "data-h": "quote", onClick: () => pick("quote"), children: "Quote reply" }),
    /* @__PURE__ */ u2("button", { "data-h": "issue", onClick: () => pick("issue"), children: "Reference in new issue" }),
    hr ? /* @__PURE__ */ u2("hr", {}) : "",
    edit ? /* @__PURE__ */ u2("button", { "data-h": "edit", onClick: () => pick("edit"), children: "Edit" }) : "",
    hide2 ? /* @__PURE__ */ u2("button", { "data-h": "hide", onClick: () => pick("hide"), children: "Hide" }) : "",
    del ? /* @__PURE__ */ u2("button", { "data-h": "del", class: "danger", onClick: () => pick("del"), children: "Delete" }) : ""
  ] });
  var ReactPop = ({ x: x2, y: y2, reacts, pick }) => /* @__PURE__ */ u2("div", { class: "react-pop", style: `left:${x2}px;top:${y2}px`, children: reacts.map(([k2, em]) => /* @__PURE__ */ u2("button", { "data-c": k2, onClick: () => pick(k2), children: em })) });
  var CtxPop = ({ x: x2, y: y2, pick }) => /* @__PURE__ */ u2("div", { class: "react-pop cm-pop", style: `left:${x2}px;top:${y2}px`, children: [
    /* @__PURE__ */ u2("button", { "data-h": "new", onClick: () => pick("new"), children: "Open in new tab" }),
    /* @__PURE__ */ u2("button", { "data-h": "here", onClick: () => pick("here"), children: "Open" }),
    /* @__PURE__ */ u2("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" })
  ] });
  var focusEl = (el) => {
    el?.focus();
  };
  var Palette = (p2) => /* @__PURE__ */ u2("div", { class: "dlg-bg palette", onMouseDown: (e2) => {
    if (e2.target === e2.currentTarget) p2.close();
  }, children: /* @__PURE__ */ u2("div", { class: "dlg pal", children: [
    /* @__PURE__ */ u2("input", { class: "pal-in", placeholder: "Jump to a pull request \u2014 owner/repo#123, a URL, or search recent\u2026", value: p2.q, ref: focusEl, onInput: (e2) => p2.onQ(e2.target.value), onKeyDown: p2.onKey }),
    /* @__PURE__ */ u2("div", { class: "pal-list", onMouseDown: (e2) => {
      const r2 = e2.target.closest(".pal-row");
      if (r2) p2.pick(+r2.dataset.i);
    }, children: p2.rows.length ? p2.rows.map((r2, i2) => /* @__PURE__ */ u2("div", { class: `pal-row${i2 === p2.sel ? " on" : ""}`, "data-i": i2, children: [
      /* @__PURE__ */ u2("b", { children: r2.label }),
      /* @__PURE__ */ u2("i", { children: r2.sub })
    ] })) : /* @__PURE__ */ u2("div", { class: "pal-none", children: "No matches" }) })
  ] }) });
  var HELP = [["Jump to any pull request", "\u2318 K"], ["Next / previous comment", "j / k"], ["Next / previous unresolved thread", "] / ["], ["Reply to the selected comment", "r"], ["Write a comment (docked at the bottom)", "c"], ["New pull request", "n"], ["New tab / close tab / reopen closed", "\u2318T \xB7 \u2318W \xB7 \u2318\u21E7T"], ["Go to tab 1\u20139 / next tab", "\u23181\u20139 \xB7 \u2303Tab"], ["Open a PR in a new tab", "\u2318-click"], ["Turn Split view on / off", "s"], ["Swap the two sides of Split view", "f"], ["Diff: unified \u21C4 side-by-side", "d"], ["Show this help", "?"], ["Close dialogs and menus", "Esc"]];
  var HelpDialog = ({ close }) => /* @__PURE__ */ u2("div", { class: "dlg-bg palette", onMouseDown: close, children: /* @__PURE__ */ u2("div", { class: "dlg pal", children: [
    /* @__PURE__ */ u2("h2", { children: "Keyboard shortcuts" }),
    HELP.map(([a2, b2]) => /* @__PURE__ */ u2("div", { class: "kb-r", children: [
      /* @__PURE__ */ u2("span", { children: a2 }),
      /* @__PURE__ */ u2("kbd", { children: b2 })
    ] }))
  ] }) });

  // src/components/Timeline.tsx
  function CommitRow({ first, sha, author, url, verification, trailing }) {
    const unv = verification && !verification.verified;
    return /* @__PURE__ */ u2("div", { class: "commit-row", children: [
      author ? /* @__PURE__ */ u2("span", { class: "TLI-avatar", style: "margin-right:8px", children: Av(author, 20) }) : "",
      /* @__PURE__ */ u2("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u2("a", { href: url || "#", children: first }) }),
      trailing ? Raw(trailing) : "",
      /* @__PURE__ */ u2("span", { class: "cm-ic", children: I2("comment") }),
      /* @__PURE__ */ u2("span", { style: "flex:1" }),
      verification ? /* @__PURE__ */ u2("span", { class: `label-pill ${unv ? "warn" : "ok"}`, children: unv ? "Unverified" : "Verified" }) : "",
      /* @__PURE__ */ u2("a", { class: "sha", href: url || "#", children: String(sha).slice(0, 7) })
    ] });
  }
  function RangeBar({ range, from, to, desc, on: on3 }) {
    const opts = [["all", "Any time"], ["1h", "Last hour"], ["24h", "Last 24 hours"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["custom", "Custom range\u2026"]];
    return /* @__PURE__ */ u2("div", { class: "date-bar", children: [
      /* @__PURE__ */ u2("span", { class: "who-l", children: [
        I2("clock"),
        "When"
      ] }),
      /* @__PURE__ */ u2("select", { class: "sel", id: "crange", title: "Only show activity from this period", onChange: on3?.range, children: opts.map(([v2, l2]) => /* @__PURE__ */ u2("option", { value: v2, selected: range === v2, children: l2 })) }),
      range === "custom" ? /* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2("input", { type: "date", class: "input", id: "cfrom", value: from, title: "From", onChange: on3?.from }),
        /* @__PURE__ */ u2("span", { class: "who-l", children: "to" }),
        /* @__PURE__ */ u2("input", { type: "date", class: "input", id: "cto", value: to, title: "To", onChange: on3?.to })
      ] }) : "",
      /* @__PURE__ */ u2("span", { class: "sp" }),
      /* @__PURE__ */ u2("button", { class: "who-chip", id: "csort", title: "Flip the order of the timeline", onClick: on3?.sort, children: [
        I2(desc ? "chevron-down" : "chevron-up"),
        /* @__PURE__ */ u2("span", { children: desc ? "Newest first" : "Oldest first" })
      ] })
    ] });
  }
  function WhoBar({ everyone, people, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "who-bar", children: [
      /* @__PURE__ */ u2("span", { class: "who-l", children: [
        I2("person"),
        "Show"
      ] }),
      /* @__PURE__ */ u2("button", { class: `who-chip ${everyone ? "on" : ""}`, "data-whoclear": "1", onClick: on3?.whoClear, children: "Everyone" }),
      people.map(({ u: u3, n: n2, on: sel }) => /* @__PURE__ */ u2("button", { class: `who-chip ${sel ? "on" : ""}`, "data-who": u3.login, onClick: on3 && (() => on3.who(u3.login)), title: `${n2} comment${n2 === 1 ? "" : "s"}`, children: [
        Av(u3, 18),
        /* @__PURE__ */ u2("span", { children: u3.login }),
        /* @__PURE__ */ u2("i", { children: n2 })
      ] }))
    ] });
  }
  function Bars({ who, range, on: on3 }) {
    return /* @__PURE__ */ u2(S2, { children: [
      who && /* @__PURE__ */ u2(WhoBar, { ...who, on: on3 }),
      /* @__PURE__ */ u2(RangeBar, { ...range, on: on3 })
    ] });
  }
  function FoldBar({ onClick }) {
    return /* @__PURE__ */ u2("div", { class: "fold-bar", children: /* @__PURE__ */ u2("button", { class: "btn small", id: "foldallconv", title: "Collapse or expand every comment, review and thread", onClick, children: [
      I2("chevron-down"),
      SP,
      /* @__PURE__ */ u2("span", { children: "Collapse all conversations" })
    ] }) });
  }
  var Time = ({ at }) => /* @__PURE__ */ u2("a", { class: "time", children: whenParts(at).text });
  var actor = (u3) => u3 ? /* @__PURE__ */ u2("a", { class: "actor", href: u3.html_url, children: u3.login }) : /* @__PURE__ */ u2("span", { class: "actor", children: "ghost" });
  function CommitRun({ n: n2, first, last, onTab }) {
    return /* @__PURE__ */ u2("div", { class: "TLI", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge", children: I2("git-commit") }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: /* @__PURE__ */ u2("div", { class: "row", children: /* @__PURE__ */ u2("a", { "data-tab": "commits", class: "run", onClick: onTab && (() => onTab("commits")), children: [
        /* @__PURE__ */ u2("b", { children: [
          n2,
          " commits"
        ] }),
        SP,
        /* @__PURE__ */ u2("span", { class: "mono", children: [
          first,
          " \u2026 ",
          last
        ] }),
        " \xB7 view in Commits"
      ] }) }) })
    ] });
  }
  function Committed({ row: row2 }) {
    return /* @__PURE__ */ u2("div", { class: "TLI", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge", children: I2("git-commit") }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: row2 })
    ] });
  }
  var Linked = ({ msg, url }) => {
    const m2 = msg.match(/^([\s\S]*?)#(\d+)([\s\S]*)$/);
    return m2 ? /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("a", { href: url, children: m2[1] }),
      /* @__PURE__ */ u2("a", { href: "#", style: "color:var(--fgColor-accent)", children: [
        "#",
        m2[2]
      ] }),
      /* @__PURE__ */ u2("a", { href: "#", children: m2[3] })
    ] }) : /* @__PURE__ */ u2("a", { href: url, children: msg });
  };
  function Referenced({ actor: a2, at, commit: ci, msg }) {
    return /* @__PURE__ */ u2("div", { class: "TLI", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge", children: I2("cross-reference") }),
      /* @__PURE__ */ u2("div", { class: "TLI-body stack", children: [
        /* @__PURE__ */ u2("div", { class: "row", style: "min-height:32px", children: [
          actor(a2),
          SP,
          /* @__PURE__ */ u2("span", { children: "added a commit that referenced this pull request" }),
          SP,
          /* @__PURE__ */ u2(Time, { at })
        ] }),
        ci ? /* @__PURE__ */ u2("div", { class: "line2", children: /* @__PURE__ */ u2("div", { class: "commit-row", children: [
          /* @__PURE__ */ u2("span", { class: "TLI-avatar", style: "margin:0 8px 0 0", children: Av(ci.author || a2, 20) }),
          /* @__PURE__ */ u2("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u2(Linked, { msg, url: ci.html_url }) }),
          /* @__PURE__ */ u2("span", { class: "mono", style: "background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px", children: "\u2026" }),
          /* @__PURE__ */ u2("span", { class: "cm-ic", children: I2("comment") }),
          /* @__PURE__ */ u2("span", { style: "flex:1" }),
          /* @__PURE__ */ u2("a", { class: "sha", href: ci.html_url, children: ci.sha.slice(0, 7) })
        ] }) }) : ""
      ] })
    ] });
  }
  function MergedRow({ actor: a2, commit, base, at }) {
    return /* @__PURE__ */ u2("div", { class: "TLI mergedrow", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge done", children: I2("git-merge") }),
      /* @__PURE__ */ u2("div", { class: "TLI-avatar", children: Av(a2, 20) }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: /* @__PURE__ */ u2("div", { class: "row", children: [
        actor(a2),
        SP,
        /* @__PURE__ */ u2("span", { children: [
          "merged commit ",
          /* @__PURE__ */ u2("b", { class: "mono", style: "color:var(--fgColor-default);font-size:12px", children: commit }),
          " into ",
          /* @__PURE__ */ u2("span", { class: "branch", children: base })
        ] }),
        SP,
        /* @__PURE__ */ u2(Time, { at })
      ] }) })
    ] });
  }
  function CrossRef(p2) {
    return /* @__PURE__ */ u2("div", { class: "TLI", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge", children: I2("cross-reference") }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u2("div", { class: "row", children: [
          actor(p2.actor),
          SP,
          /* @__PURE__ */ u2("span", { children: [
            "mentioned this ",
            p2.isPr ? "pull request" : "issue"
          ] }),
          SP,
          /* @__PURE__ */ u2(Time, { at: p2.at })
        ] }),
        "\n        ",
        /* @__PURE__ */ u2("div", { class: "ref-card", children: [
          /* @__PURE__ */ u2("span", { style: `color:var(--fgColor-${p2.open ? "success" : "done"});margin-top:2px`, children: I2(p2.icon) }),
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("a", { class: "t", href: p2.url, style: "color:var(--fgColor-default)", children: p2.title }),
            /* @__PURE__ */ u2("span", { class: "r", children: [
              p2.repo,
              "#",
              p2.number
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  function LabelRow({ actor: a2, verb, color, name, at }) {
    return /* @__PURE__ */ u2("div", { class: "TLI condensed", children: [
      /* @__PURE__ */ u2("div", { class: "TLI-badge", children: I2("tag") }),
      /* @__PURE__ */ u2("div", { class: "TLI-avatar", children: Av(a2, 20) }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: [
        actor(a2),
        SP,
        /* @__PURE__ */ u2("span", { children: verb }),
        SP,
        /* @__PURE__ */ u2("span", { class: "pill-label", style: `background:#${color};color:#fff;margin:0`, children: name }),
        SP,
        /* @__PURE__ */ u2("span", { children: "label" }),
        SP,
        /* @__PURE__ */ u2(Time, { at })
      ] })
    ] });
  }
  function Simple({ actor: a2, ic, text, kind, at }) {
    return /* @__PURE__ */ u2("div", { class: "TLI", children: [
      /* @__PURE__ */ u2("div", { class: `TLI-badge ${kind}`, children: I2(ic) }),
      /* @__PURE__ */ u2("div", { class: "TLI-avatar", children: Av(a2, 20) }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: /* @__PURE__ */ u2("div", { class: "row", children: [
        actor(a2),
        SP,
        /* @__PURE__ */ u2("span", { children: text }),
        SP,
        /* @__PURE__ */ u2(Time, { at })
      ] }) })
    ] });
  }
  function Checks({ head: head2, summary, headIcon, rows }) {
    return /* @__PURE__ */ u2("div", { class: "checks", children: [
      /* @__PURE__ */ u2("div", { class: `ck-head ${head2[0]}`, children: [
        I2(headIcon, 20),
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("b", { children: head2[1] }),
          /* @__PURE__ */ u2("span", { children: summary })
        ] })
      ] }),
      rows.map((c2) => /* @__PURE__ */ u2("a", { class: `ck-row ${c2.st}`, href: c2.url ? c2.url : void 0, children: [
        /* @__PURE__ */ u2("span", { class: "ck-i", children: I2(c2.icon) }),
        /* @__PURE__ */ u2("span", { class: "ck-n", children: [
          /* @__PURE__ */ u2("b", { children: c2.name }),
          c2.req ? /* @__PURE__ */ u2("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
          /* @__PURE__ */ u2("i", { children: c2.desc })
        ] }),
        /* @__PURE__ */ u2("span", { class: "ck-s", children: c2.status }),
        /* @__PURE__ */ u2("span", { class: "ck-d", children: c2.dur })
      ] }))
    ] });
  }
  function Attention({ items, unres, showUnres, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "attn", children: [
      items.map((it) => /* @__PURE__ */ u2("button", { class: `att-i ${it.k}`, id: it.id, title: it.title, "data-tab": it.dataTab, onClick: on3 && (it.id === "nextun" ? on3.next : it.dataTab ? () => on3.tab(it.dataTab) : void 0), children: [
        I2(it.ic),
        /* @__PURE__ */ u2("span", { children: it.text })
      ] })),
      showUnres ? /* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2("span", { class: "sp" }),
        /* @__PURE__ */ u2("button", { class: `att-tog ${unres ? "on" : ""}`, id: "unres", title: "Hide everything except review threads that are still open", onClick: on3?.unres, children: [
          I2("comment"),
          "Unresolved only"
        ] })
      ] }) : ""
    ] });
  }

  // src/app/tabs.ts
  var KEY_TABS = "tabs";
  {
    const t2 = load(KEY_TABS, {});
    S.tabs = Array.isArray(t2.list) ? t2.list : [];
    S.closed = [];
    S.tabMenu = false;
  }
  var curRef = () => S.view === "pr" && S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
  var saveTabs = () => {
    try {
      localStorage.setItem(KEY_TABS, JSON.stringify({ list: S.tabs.map(({ ref, title, state, icon: icon2, tab, dot, scroll }) => ({ ref, title, state, icon: icon2, tab, dot, scroll })) }));
    } catch {
    }
  };
  var tabIdx = () => S.tabs.findIndex((t2) => t2.ref === curRef());
  function tabSnap() {
    const t2 = S.tabs[tabIdx()];
    if (t2) {
      t2.tab = S.tab;
      t2.scroll = $(".main")?.scrollTop || 0;
    }
  }
  function tabPut(ref, p2, opts = {}) {
    const [state, ic] = stateOf(p2), item = { ref, title: p2.title, state, icon: ic, tab: S.tab, dot: false };
    const have = S.tabs.findIndex((t2) => t2.ref === ref);
    if (have >= 0) Object.assign(S.tabs[have], item, { tab: S.tabs[have].tab });
    else if (opts.at !== void 0 && opts.at >= 0 && !opts.newTab) S.tabs[opts.at] = item;
    else S.tabs.splice(opts.at !== void 0 && opts.at >= 0 ? opts.at + 1 : S.tabs.length, 0, item);
    S.tabs = S.tabs.slice(-15);
    saveTabs();
  }
  function openTab(ref, { newTab = false } = {}) {
    if (!newTab && ref !== curRef() && fastTab(ref)) return;
    stashCurrent();
    tabSnap();
    S.fadeMain = true;
    S.tabMenu = false;
    return openPr(ref, { newTab, restore: newTab ? "" : S.tabs.find((t2) => t2.ref === ref)?.tab });
  }
  function closeTab(i2) {
    const t2 = S.tabs[i2];
    if (!t2) return;
    S.alive.get(t2.ref)?.eds.forEach((e2) => e2.destroy());
    S.alive.delete(t2.ref);
    const was = t2.ref === curRef();
    S.closed = [{ ref: t2.ref, tab: t2.tab }, ...S.closed.filter((c2) => c2.ref !== t2.ref)].slice(0, 10);
    S.tabs.splice(i2, 1);
    saveTabs();
    if (!was) return render();
    const n2 = S.tabs[Math.min(i2, S.tabs.length - 1)];
    S.fadeMain = true;
    if (n2) openPr(n2.ref, { restore: n2.tab, nav: true });
    else {
      S.view = "home";
      S.bundle = null;
      render();
    }
  }
  function reopenTab() {
    const c2 = S.closed.shift();
    if (c2) {
      tabSnap();
      openPr(c2.ref, { newTab: true, restore: c2.tab });
    }
  }
  function stepTab(d2) {
    if (S.tabs.length < 2) return;
    const i2 = tabIdx(), n2 = S.tabs[(i2 + d2 + S.tabs.length) % S.tabs.length];
    openTab(n2.ref);
  }

  // src/app/data.ts
  var snap = (p2) => ({ commits: p2.commits, comments: p2.comments, rc: p2.review_comments, state: p2.merged ? "merged" : p2.state });
  var seen = load("seen", {});
  function noteAdd(ref, title, text, target = "") {
    {
      const t2 = S.tabs.find((x2) => x2.ref === ref);
      if (t2 && ref !== curRef()) {
        t2.dot = true;
        saveTabs();
      }
    }
    S.notes = [{ id: Date.now() + Math.random(), ref, title, text, target, at: (/* @__PURE__ */ new Date()).toISOString(), read: false }, ...S.notes].slice(0, 200);
    localStorage.setItem("notes", JSON.stringify(S.notes));
    if (tauri) tauri.invoke("notify", { title: `${ref} \xB7 ${title}`.slice(0, 80), body: text, prRef: ref, target }).catch(() => {
    });
  }
  function noteDiff(ref, title, was, now, fresh = []) {
    const out = [], d2 = (a2, b2) => b2 - a2;
    if (d2(was.commits, now.commits) > 0) out.push(`${d2(was.commits, now.commits)} new commit${d2(was.commits, now.commits) > 1 ? "s" : ""}`);
    if (d2(was.comments, now.comments) > 0) out.push(`${d2(was.comments, now.comments)} new comment${d2(was.comments, now.comments) > 1 ? "s" : ""}`);
    if (d2(was.rc, now.rc) > 0) out.push(`${d2(was.rc, now.rc)} new review comment${d2(was.rc, now.rc) > 1 ? "s" : ""}`);
    if (was.state !== now.state) out.push(`now ${now.state}`);
    const last = fresh.filter((f3) => !was.at || f3.created_at > was.at).sort((x2, y2) => x2.created_at < y2.created_at ? -1 : 1).pop();
    if (last) out.push(`\u201C${last.body.replace(/\s+/g, " ").slice(0, 60)}\u201D \u2014 ${last.user}`);
    if (out.length) noteAdd(ref, title, out.join(", "), last ? String(last.id) : "");
  }
  function remember(ref, p2) {
    seen[ref] = { ...snap(p2), at: p2.updated_at || (/* @__PURE__ */ new Date()).toISOString() };
    localStorage.setItem("seen", JSON.stringify(seen));
  }
  var qc = {
    m: /* @__PURE__ */ new Map(),
    inflight: /* @__PURE__ */ new Map(),
    STALE: 3e4,
    peek(k2) {
      return this.m.get(k2);
    },
    fresh(k2, ms = 3e4) {
      const e2 = this.m.get(k2);
      return !!e2 && Date.now() - e2.at < ms;
    },
    set(k2, data) {
      this.m.set(k2, { data, at: Date.now() });
    },
    invalidate(k2) {
      const e2 = this.m.get(k2);
      if (e2) e2.at = 0;
    },
    fetch(k2, fn) {
      if (this.inflight.has(k2)) return this.inflight.get(k2);
      const p2 = fn().then((d2) => {
        this.set(k2, d2);
        return d2;
      }).finally(() => this.inflight.delete(k2));
      this.inflight.set(k2, p2);
      return p2;
    }
  };
  var loadPr = (input) => tauri ? tauri.invoke("fetch_pr", { url: input }) : fetch(new URL(input, location.href)).then((r2) => r2.json());
  function prefetch(ref) {
    if (tauri && !qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref))?.catch(() => {
    });
  }
  async function pollNotes() {
    if (!tauri || flags.polling) return;
    flags.polling = true;
    const before = S.notes.length;
    const cur = S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : null;
    if (S.hasToken && Date.now() - (S.watchAt || 0) > 24e4) {
      S.watchAt = Date.now();
      try {
        const d2 = await tauri.invoke("inbox", { force: false });
        S.watch = [...d2.mine || [], ...d2.requested || []].map((i2) => `${i2.repo}#${i2.number}`);
      } catch {
      }
    }
    const refs = S.hasToken ? [.../* @__PURE__ */ new Set([...cur ? [cur] : [], ...S.tabs.map((t2) => t2.ref), ...S.recent.slice(0, 8).map((r2) => r2.ref), ...S.watch || []])].slice(0, 40) : cur ? [cur] : [];
    for (const ref of refs) {
      const m2 = ref.match(/^(.+)#(\d+)$/);
      if (!m2) continue;
      try {
        const p2 = await tauri.invoke("check_pr", { repo: m2[1], number: +m2[2], since: seen[ref]?.at || null });
        const now = snap(p2);
        const n0 = S.notes.length;
        if (seen[ref]) noteDiff(ref, p2.title, seen[ref], now, p2.fresh);
        if (S.notes.length !== n0) prefetch(ref);
        remember(ref, p2);
        const bp = S.bundle?.pull;
        if (cur && ref.toLowerCase() === cur.toLowerCase() && S.view === "pr" && bp && !S.loading && !S.refreshing && (p2.updated_at && p2.updated_at > (bp.updated_at || "") || (p2.comments ?? bp.comments) !== bp.comments || (p2.review_comments ?? bp.review_comments) !== bp.review_comments) && !document.activeElement?.closest?.(".tt")) {
          qc.invalidate(cur);
          await tauri.invoke("invalidate_pr", { url: cur }).catch(() => {
          });
          openPr(cur, { nav: true, keepTab: true });
        }
      } catch {
      }
    }
    await pollBranches(refs, cur);
    flags.polling = false;
    if (S.notes.length !== before && !document.activeElement?.closest?.(".tt")) render();
  }
  S.pushes = {};
  var pushDis = load("pushdismiss", {});
  var ago = (t2) => {
    const m2 = Math.max(1, Math.round((Date.now() - +new Date(t2)) / 6e4));
    return m2 < 60 ? `${m2} minute${m2 === 1 ? "" : "s"} ago` : `${Math.round(m2 / 60)} hour${m2 >= 90 ? "s" : ""} ago`;
  };
  var pushList = (repo) => Object.entries(S.pushes).filter(([r2]) => !repo || r2 === repo).flatMap(([, l2]) => l2).filter((p2) => !pushDis[`${p2.repo}@${p2.branch}@${p2.at}`] && Date.now() - +new Date(p2.at) < 6 * 36e5);
  function pushBannerItems(repo) {
    return pushList(repo).slice(0, 3).map((p2) => ({ repo: p2.repo, branch: p2.branch, ago: ago(p2.at), key: `${p2.repo}@${p2.branch}@${p2.at}`, showRepo: !repo }));
  }
  async function refreshPushes(repo) {
    if (!tauri || !S.hasToken || !repo) return;
    try {
      const l2 = await tauri.invoke("recent_pushes", { repo }), was = JSON.stringify(S.pushes[repo] || []);
      S.pushes[repo] = l2;
      if (JSON.stringify(l2) !== was && (S.view === "repo" || !S.bundle && S.view !== "newpr" && S.view !== "inbox" && S.view !== "notes") && !document.activeElement?.closest?.(".tt")) rerender();
    } catch {
    }
  }
  var branchSeen = load("branches", {});
  async function pollBranches(refs, cur) {
    if (!S.hasToken) return;
    const repos = [...new Set([...refs, cur].filter(Boolean).map((r2) => r2.replace(/#\d+$/, "")))].slice(0, 6);
    for (const repo of repos) {
      try {
        const b2 = await tauri.invoke("list_branches", { repo }), names = b2.branches || [];
        if (branchSeen[repo]) names.filter((n2) => !branchSeen[repo].includes(n2) && n2 !== b2.default).forEach((n2) => noteAdd(`${repo}@${n2}`, repo, `New branch pushed: ${n2} \u2014 click to open a pull request`, ""));
        refreshPushes(repo);
        branchSeen[repo] = names;
        localStorage.setItem("branches", JSON.stringify(branchSeen));
      } catch {
      }
    }
  }

  // src/app/comments.ts
  function stateOf(p2) {
    if (p2.merged) return ["merged", "git-merge", "Merged"];
    if (p2.state === "closed") return ["closed", "git-pull-request-closed", "Closed"];
    if (p2.draft) return ["draft", "git-pull-request-draft", "Draft"];
    return ["open", "git-pull-request", "Open"];
  }
  function prHeaderProps(b2) {
    const p2 = b2.pull, [st, ic, label] = stateOf(p2);
    const commentsTotal = p2.comments + p2.review_comments + b2.timeline.filter((e2) => e2.event === "reviewed").length;
    const sq = (() => {
      const t2 = p2.additions + p2.deletions || 1;
      const small = t2 <= 5;
      const a2 = small ? p2.additions : Math.round(p2.additions / t2 * 5);
      const d2 = small ? p2.deletions : 5 - a2;
      const arr = [];
      for (let i2 = 0; i2 < 5; i2++) arr.push(i2 < a2 ? "a" : i2 < a2 + d2 ? "d" : "");
      return arr;
    })();
    const splitOk = S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline";
    return { b: b2, st, ic, label, tab: S.tab, split: S.split, hideSide: !!S.hide.side, splitOk, commentsTotal, sq };
  }
  var isFolded = (k2, def = false) => k2 in S.fold ? S.fold[k2] : def;
  var folded = (k2, def = false) => isFolded(k2, def) ? " folded" : "";
  var reactionProps = (r2, kind, id) => ({ r: r2 || {}, kind, id, defs: REACTS.map(([k2, e2]) => ({ k: k2, e: e2 })) });
  var liveTasks = (h2) => S.hasToken ? h2.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m2) => m2.replace(/\sdisabled(="[^"]*")?/g, "")) : h2;
  function toggleTask(body, n2) {
    let i2 = -1, fence = false;
    return body.split("\n").map((l2) => {
      if (/^\s*(```|~~~)/.test(l2)) {
        fence = !fence;
        return l2;
      }
      if (fence) return l2;
      return l2.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/, (m2, a2, x2, z2) => ++i2 === n2 ? a2 + (x2 === " " ? "x" : " ") + z2 : m2);
    }).join("\n");
  }
  document.addEventListener("click", async (e2) => {
    const cb = e2.target.closest("input.task-list-item-checkbox");
    if (!cb || cb.disabled || !S.bundle) return;
    const box = cb.closest(".tl-comment"), md = cb.closest(".markdown-body");
    if (!box || !md) return;
    const id = box.id.replace(/^c-/, ""), b2 = S.bundle;
    const c2 = String(b2.pull.id) === id ? b2.pull : b2.timeline.find((x2) => String(x2.id) === id);
    if (!c2) return;
    const n2 = [...md.querySelectorAll("input.task-list-item-checkbox")].indexOf(cb), body = toggleTask(c2.body || "", n2);
    if (body === (c2.body || "")) {
      e2.preventDefault();
      return;
    }
    const on3 = cb.checked;
    const r2 = c2 === b2.pull ? await act("edit", { body, extra: {} }, "task", true) : await act("edit_comment", { id: c2.id, kind: "issue_comment", body }, "task", true);
    if (r2 === void 0) {
      cb.checked = !on3;
      alert(`Couldn't update the checkbox: ${S.actErr?.m || "unknown error"}`);
      return;
    }
    c2.body = body;
    let i2 = -1;
    c2.body_html = (c2.body_html || "").replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m2) => ++i2 === n2 ? on3 ? /\schecked/.test(m2) ? m2 : m2.replace(/<input/, "<input checked") : m2.replace(/\schecked(="[^"]*")?/, "") : m2);
    const key = `${prRef().repo}#${prRef().number}`;
    qc.set(key, b2);
    qc.m.get(key).at = Date.now() - 2e4;
    tauri?.invoke("invalidate_pr", { url: key }).catch(() => {
    });
  });
  function commentBoxProps(c2, { isPr = false, flush = false } = {}) {
    return { c: c2, assoc: ASSOC[c2.author_association ?? ""], bodyHtml: c2.body_html && c2.body_html.trim() ? liveTasks(c2.body_html) : "", folded: isFolded("c:" + c2.id), reactions: reactionProps(c2.reactions, isPr ? "pr" : "issue_comment", c2.id), flush };
  }
  function hunkRows(hunk) {
    const rows = [];
    let o2 = 0, n2 = 0;
    for (const line of hunk.split("\n")) {
      if (line.startsWith("@@")) {
        const m2 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m2) {
          o2 = +m2[1];
          n2 = +m2[2];
        }
        rows.push({ kind: "hunk", text: line });
        continue;
      }
      const t2 = line[0], txt = line.slice(1);
      if (t2 === "+") rows.push({ kind: "add", n: n2++, text: txt });
      else if (t2 === "-") rows.push({ kind: "del", o: o2++, text: txt });
      else if (t2 === "\\") rows.push({ kind: "meta", text: line });
      else rows.push({ kind: "ctx", o: o2++, n: n2++, text: txt });
    }
    return rows;
  }

  // src/components/Diff.tsx
  function Sug({ s: s2, on: on3 }) {
    return s2.kind === "note" ? /* @__PURE__ */ u2("div", { class: "sug-row", children: /* @__PURE__ */ u2("span", { class: "sug-note", children: s2.text }) }) : /* @__PURE__ */ u2("div", { class: "sug-row", children: [
      /* @__PURE__ */ u2("button", { class: "btn small primary", "data-sug": s2.id, disabled: s2.disabled, onClick: on3 && ((e2) => on3.sug(e2, String(s2.id))), children: "Apply suggestion" }),
      /* @__PURE__ */ u2("span", { class: "sug-note", children: [
        "Commits to ",
        /* @__PURE__ */ u2("code", { children: s2.ref }),
        s2.mine ? "" : " (fork \u2014 needs push access)"
      ] })
    ] });
  }
  function Tc(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: "tc", id: p2.anchorId ? `c-${p2.id}` : void 0, children: [
      /* @__PURE__ */ u2("a", { href: p2.user?.html_url || "#", children: Av(p2.user, 24) }),
      /* @__PURE__ */ u2("div", { style: "flex:1;min-width:0", children: [
        /* @__PURE__ */ u2("div", { children: [
          /* @__PURE__ */ u2("span", { class: "who", children: p2.login }),
          SP,
          /* @__PURE__ */ u2("span", { children: When(p2.at) }),
          p2.withMenu ? /* @__PURE__ */ u2("button", { class: "cm-btn", "data-cm": p2.id, "data-root": p2.root, title: "Comment actions", onClick: on3 && ((e2) => on3.menu(e2, e2.currentTarget)), children: "\u22EF" }) : ""
        ] }),
        /* @__PURE__ */ u2("div", { class: "markdown-body", style: "margin-top:8px", dangerouslySetInnerHTML: { __html: p2.bodyHtml } }),
        p2.sug ? /* @__PURE__ */ u2(Sug, { s: p2.sug, on: on3 }) : "",
        /* @__PURE__ */ u2(ReactionsBar, { ...p2.reactions, on: on3?.react })
      ] })
    ] });
  }
  function ThreadRow(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("tr", { class: "lc-row th-row", children: /* @__PURE__ */ u2("td", { colspan: p2.cols, children: /* @__PURE__ */ u2("div", { class: `thread inl${p2.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u2("div", { class: "thread-head", children: [
        /* @__PURE__ */ u2(FoldBtn, { k: p2.k, title: "Hide this thread", def: p2.def, folded: p2.folded, onFold: on3?.fold }),
        /* @__PURE__ */ u2("span", { class: "th-t", children: [
          "Comment on line ",
          /* @__PURE__ */ u2("b", { children: [
            p2.side,
            p2.line
          ] })
        ] }),
        p2.outdated ? /* @__PURE__ */ u2("span", { class: "res out", children: "Outdated" }) : "",
        p2.resolved ? /* @__PURE__ */ u2("span", { class: "res", children: "Resolved" }) : ""
      ] }),
      p2.cards.map((c2) => /* @__PURE__ */ u2(Tc, { ...c2, on: on3 })),
      p2.reply ? /* @__PURE__ */ u2(ReplyBox, { ...p2.reply, on: on3 }) : "",
      p2.act ? /* @__PURE__ */ u2("div", { class: "th-foot", children: /* @__PURE__ */ u2("button", { class: "thread-act", "data-thread": p2.act.tid, "data-res": p2.act.res ? "unresolve" : "resolve", onClick: on3 && ((e2) => on3.thread(e2, p2.act.tid, p2.act.res ? "unresolve" : "resolve")), children: p2.act.res ? "Unresolve conversation" : "Resolve conversation" }) }) : ""
    ] }) }) });
  }
  function ReplyBox({ rid, ph, err, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "reply", children: [
      /* @__PURE__ */ u2(DraftBox, { k: `reply-${rid}`, ph, rows: 2 }),
      /* @__PURE__ */ u2(ErrLine, { m: err }),
      /* @__PURE__ */ u2("button", { class: "btn small", "data-sendreply": rid, onClick: on3 && (() => on3.reply(String(rid))), children: "Reply" })
    ] });
  }
  var LcCards = ({ cards, on: on3 }) => /* @__PURE__ */ u2(S2, { children: cards.map((c2) => /* @__PURE__ */ u2("div", { class: "lc-card", children: [
    /* @__PURE__ */ u2("span", { class: "lc-tag", children: "Pending" }),
    /* @__PURE__ */ u2("div", { class: "lc-body", dangerouslySetInnerHTML: { __html: c2.body } }),
    /* @__PURE__ */ u2("button", { class: "lc-x", "data-lcdel": c2.id, title: "Delete draft comment", onClick: on3 && (() => on3.del(String(c2.id))), children: I2("x") })
  ] })) });
  var LcEdit = ({ code, on: on3 }) => /* @__PURE__ */ u2("div", { class: "lc-edit", children: [
    /* @__PURE__ */ u2(DraftBox, { k: "lc", ph: "Leave a comment on this line", rows: 3 }),
    /* @__PURE__ */ u2("div", { class: "lc-btns", children: [
      code !== null ? /* @__PURE__ */ u2("button", { class: "btn small", id: "lcsuggest", "data-code": code, title: "Insert a suggested change for this line", onClick: on3?.suggest, children: "\xB1 Suggest change" }) : "",
      /* @__PURE__ */ u2("span", { class: "sp" }),
      /* @__PURE__ */ u2("button", { class: "btn small", id: "lccancel", onClick: on3?.cancel, children: "Cancel" }),
      /* @__PURE__ */ u2("button", { class: "btn small primary", id: "lcadd", onClick: on3?.add, children: "Add to review" })
    ] })
  ] });
  var Actor = ({ u: u3 }) => u3 ? /* @__PURE__ */ u2("a", { class: "actor", href: u3.html_url, children: u3.login }) : /* @__PURE__ */ u2("span", { class: "actor", children: "ghost" });
  function ReviewBlock(p2) {
    const { on: on3 } = p2;
    return /* @__PURE__ */ u2("div", { class: `TLI rev${p2.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u2("div", { class: `TLI-badge ${p2.kind}`, children: I2(p2.ic) }),
      /* @__PURE__ */ u2("div", { class: "TLI-avatar", children: Av(p2.user, 20) }),
      /* @__PURE__ */ u2("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u2("div", { class: "row", children: [
          /* @__PURE__ */ u2(FoldBtn, { k: p2.k, title: "Collapse / expand this review", def: p2.allRes, folded: p2.folded, onFold: on3?.fold }),
          /* @__PURE__ */ u2(Actor, { u: p2.user }),
          " ",
          /* @__PURE__ */ u2("span", { children: p2.verb }),
          " ",
          /* @__PURE__ */ u2("a", { class: "time", href: p2.url, children: p2.at }),
          p2.sum ? /* @__PURE__ */ u2("span", { class: `rev-sum${p2.sum.ok ? " ok" : ""}`, children: p2.sum.allRes ? /* @__PURE__ */ u2(S2, { children: [
            I2("check"),
            " All resolved"
          ] }) : p2.sum.text }) : ""
        ] }),
        "\n  ",
        p2.bodyHtml ? /* @__PURE__ */ u2("div", { class: "cbox nocaret", style: "margin-top:8px;color:var(--fgColor-default)", children: /* @__PURE__ */ u2("div", { class: "cbody", children: /* @__PURE__ */ u2("div", { class: "markdown-body", dangerouslySetInnerHTML: { __html: p2.bodyHtml } }) }) }) : "",
        p2.threads.length ? /* @__PURE__ */ u2("div", { children: p2.threads.map((t2) => /* @__PURE__ */ u2("div", { class: `thread${t2.folded ? " folded" : ""}`, children: [
          /* @__PURE__ */ u2("div", { class: "thread-head", children: [
            /* @__PURE__ */ u2(FoldBtn, { k: t2.k, title: "Hide this thread", def: t2.def, folded: t2.folded, onFold: on3?.fold }),
            t2.path,
            t2.resolved ? /* @__PURE__ */ u2("span", { class: "res", children: "Resolved" }) : "",
            t2.tid ? /* @__PURE__ */ u2("button", { class: "thread-act", "data-thread": t2.tid, "data-res": t2.resolved ? "unresolve" : "resolve", onClick: on3 && ((e2) => on3.thread(e2, t2.tid, t2.resolved ? "unresolve" : "resolve")), children: t2.resolved ? "Unresolve" : "Resolve conversation" }) : ""
          ] }),
          /* @__PURE__ */ u2("div", { class: "diffhunk", children: /* @__PURE__ */ u2(DiffHunkTable, { rows: t2.hunk }) }),
          t2.cards.map((c2) => /* @__PURE__ */ u2(Tc, { ...c2, on: on3 })),
          /* @__PURE__ */ u2(ReplyBox, { ...t2.reply, on: on3 })
        ] })) }) : ""
      ] })
    ] });
  }

  // src/app/diff.tsx
  S.diffMode = localStorage.getItem("diffmode") || "unified";
  S.pending = load("pending", {});
  var pendKey = () => S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
  var pendList = () => S.pending[pendKey()] || [];
  var savePending = () => localStorage.setItem("pending", JSON.stringify(S.pending));
  function parsePatch(patch) {
    const rows = [];
    let o2 = 0, n2 = 0;
    for (const line of patch.split("\n")) {
      if (line.startsWith("@@")) {
        const m2 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m2) {
          o2 = +m2[1];
          n2 = +m2[2];
        }
        rows.push({ t: "hunk", text: line });
        continue;
      }
      const c2 = line[0], txt = line.slice(1);
      if (c2 === "+") rows.push({ t: "add", n: n2++, text: txt });
      else if (c2 === "-") rows.push({ t: "del", o: o2++, text: txt });
      else if (c2 === "\\") rows.push({ t: "note", text: line });
      else rows.push({ t: "ctx", o: o2++, n: n2++, text: txt });
    }
    return rows;
  }
  var codeHtml = (text, path) => (window.hlLine && window.hlLine(text, path)) ?? esc(text);
  var lineKey = (path, line, side) => `${path}${side}${line}`;
  var lcBody = (md) => String(md).split(/```/).map((p2, i2) => i2 % 2 ? (() => {
    const m2 = p2.match(/^(\w*)\n?([\s\S]*)$/);
    return `<pre class="lc-code${m2[1] === "suggestion" ? " sug" : ""}">${m2[1] === "suggestion" ? "<b>Suggested change</b>\n" : ""}${esc(m2[2].replace(/\n$/, ""))}</pre>`;
  })() : esc(p2).replace(/\n/g, "<br>")).join("");
  function threadsFor(path) {
    return (S.bundle?.review_comments || []).filter((c2) => c2.path === path);
  }
  function lineThreads(path, line, side, cols, on3) {
    const all = threadsFor(path);
    if (!all.length) return [];
    const roots = all.filter((c2) => !c2.in_reply_to_id && (c2.line ?? c2.original_line) === line && (c2.side || "RIGHT") === side);
    if (!roots.length) return [];
    const res = new Set(S.bundle.resolved_ids || []);
    const b2 = S.bundle, card = (c2, rootId) => ({ user: c2.user, login: c2.user?.login || "ghost", at: c2.created_at, id: c2.id, root: rootId, withMenu: !!S.hasToken, bodyHtml: c2.body_html || esc(c2.body || ""), reactions: reactionProps(c2.reactions, "review_comment", c2.id), sug: null, anchorId: false });
    return roots.map((r2) => {
      const isRes = res.has(r2.id), tid = (b2.thread_ids || {})[r2.id], list = [r2, ...all.filter((c2) => c2.in_reply_to_id === r2.id)];
      const p2 = { cols, k: "t:" + r2.id, def: isRes, folded: isFolded("t:" + r2.id, isRes), side: side === "LEFT" ? "L" : "R", line, outdated: r2.line == null, resolved: isRes, cards: list.map((c2) => card(c2, r2.id)), reply: S.hasToken ? { rid: r2.id, ph: "Write a reply", err: errMsg("reply-" + r2.id) } : null, act: tid && S.hasToken ? { tid, res: isRes } : null };
      return /* @__PURE__ */ u2(ThreadRow, { ...p2, on: on3.conv });
    });
  }
  function lineExtras(path, line, side, cols, canComment, on3, text) {
    const k2 = lineKey(path, line, side), th = lineThreads(path, line, side, cols, on3), mine = pendList().filter((c2) => c2.path === path && c2.line === line && c2.side === side);
    const open2 = canComment && S.lcOpen === k2;
    if (!mine.length && !open2) return th;
    return [...th, /* @__PURE__ */ u2("tr", { class: "lc-row", children: /* @__PURE__ */ u2("td", { colspan: cols, children: /* @__PURE__ */ u2("div", { class: "lc", children: [
      mine.length ? /* @__PURE__ */ u2(LcCards, { cards: mine.map((c2) => ({ id: c2.id, body: lcBody(c2.body) })), on: on3.lc }) : "",
      open2 ? /* @__PURE__ */ u2(LcEdit, { code: side === "RIGHT" && text !== void 0 ? text : null, on: on3.lc }) : ""
    ] }) }) })];
  }
  var diffCache = /* @__PURE__ */ new Map();
  function diffTable(patch, path, canComment, on3) {
    const open2 = S.lcOpen && String(S.lcOpen).includes(path);
    if (open2) return diffTableBuild(patch, path, canComment, on3);
    const key = `${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((c2) => c2.path === path))}|${threadsFor(path).map((c2) => c2.id + ":" + (c2.updated_at || "") + JSON.stringify(c2.reactions || {}) + ((S.bundle.resolved_ids || []).includes(c2.id) ? "r" : "") + (isFolded("t:" + c2.id, (S.bundle.resolved_ids || []).includes(c2.id)) ? "f" : "")).join(",")}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith("reply-") ? S.actErr.k + S.actErr.m : ""}`, hit = diffCache.get(key);
    if (hit && hit.patch === patch) return hit.node;
    const node = diffTableBuild(patch, path, canComment, on3);
    diffCache.set(key, { patch, node });
    if (diffCache.size > 400) diffCache.delete(diffCache.keys().next().value);
    return node;
  }
  var Code = ({ text, path, cls = "", marker }) => /* @__PURE__ */ u2("td", { class: `code${cls}`, "data-marker": marker, dangerouslySetInnerHTML: { __html: codeHtml(text, path) } });
  function diffTableBuild(patch, path, canComment, on3) {
    const rows = parsePatch(patch), plus = (line, side) => canComment ? /* @__PURE__ */ u2("button", { class: "lc-plus", "data-lc": lineKey(path, line, side), title: "Add a comment on this line", onClick: on3.plus, children: "+" }) : null;
    const out = [];
    if (S.diffMode === "split") {
      let i2 = 0;
      while (i2 < rows.length) {
        const r2 = rows[i2];
        if (r2.t === "hunk") {
          out.push(/* @__PURE__ */ u2("tr", { class: "hunk", children: [
            /* @__PURE__ */ u2("td", { class: "num" }),
            /* @__PURE__ */ u2("td", { class: "code", colspan: 3, children: r2.text })
          ] }));
          i2++;
          continue;
        }
        if (r2.t === "note") {
          i2++;
          continue;
        }
        if (r2.t === "ctx") {
          out.push(/* @__PURE__ */ u2("tr", { children: [
            /* @__PURE__ */ u2("td", { class: "num", children: r2.o }),
            /* @__PURE__ */ u2(Code, { text: r2.text, path, marker: " " }),
            /* @__PURE__ */ u2("td", { class: "num", children: [
              r2.n,
              plus(r2.n, "RIGHT")
            ] }),
            /* @__PURE__ */ u2(Code, { text: r2.text, path, marker: " " })
          ] }), ...lineExtras(path, r2.n, "RIGHT", 4, canComment, on3, r2.text));
          i2++;
          continue;
        }
        const dels = [], adds = [];
        while (rows[i2] && rows[i2].t === "del") dels.push(rows[i2++]);
        while (rows[i2] && rows[i2].t === "add") adds.push(rows[i2++]);
        for (let k2 = 0; k2 < Math.max(dels.length, adds.length); k2++) {
          const d2 = dels[k2], a2 = adds[k2];
          out.push(/* @__PURE__ */ u2("tr", { children: [
            /* @__PURE__ */ u2("td", { class: `num${d2 ? " del" : " empty"}`, children: d2 ? /* @__PURE__ */ u2(S2, { children: [
              d2.o,
              plus(d2.o, "LEFT")
            ] }) : "" }),
            d2 ? /* @__PURE__ */ u2(Code, { text: d2.text, path, cls: " del", marker: "-" }) : /* @__PURE__ */ u2("td", { class: "code empty" }),
            /* @__PURE__ */ u2("td", { class: `num${a2 ? " add" : " empty"}`, children: a2 ? /* @__PURE__ */ u2(S2, { children: [
              a2.n,
              plus(a2.n, "RIGHT")
            ] }) : "" }),
            a2 ? /* @__PURE__ */ u2(Code, { text: a2.text, path, cls: " add", marker: "+" }) : /* @__PURE__ */ u2("td", { class: "code empty" })
          ] }), ...d2 ? lineExtras(path, d2.o, "LEFT", 4, canComment, on3) : [], ...a2 ? lineExtras(path, a2.n, "RIGHT", 4, canComment, on3, a2.text) : []);
        }
      }
      return /* @__PURE__ */ u2("table", { class: "diff sbs", children: [
        /* @__PURE__ */ u2("colgroup", { children: [
          /* @__PURE__ */ u2("col", { style: "width:64px" }),
          /* @__PURE__ */ u2("col", {}),
          /* @__PURE__ */ u2("col", { style: "width:64px" }),
          /* @__PURE__ */ u2("col", {})
        ] }),
        /* @__PURE__ */ u2("tbody", { children: out })
      ] });
    }
    for (const r2 of rows) {
      if (r2.t === "hunk") out.push(/* @__PURE__ */ u2("tr", { class: "hunk", children: [
        /* @__PURE__ */ u2("td", { class: "num", children: "\u2026" }),
        /* @__PURE__ */ u2("td", { class: "num", children: "\u2026" }),
        /* @__PURE__ */ u2("td", { class: "code", children: r2.text })
      ] }));
      else if (r2.t === "note") out.push(/* @__PURE__ */ u2("tr", { children: [
        /* @__PURE__ */ u2("td", { class: "num" }),
        /* @__PURE__ */ u2("td", { class: "num" }),
        /* @__PURE__ */ u2("td", { class: "code", style: "color:var(--fgColor-muted)", children: r2.text })
      ] }));
      else if (r2.t === "add") out.push(/* @__PURE__ */ u2("tr", { class: "add", children: [
        /* @__PURE__ */ u2("td", { class: "num" }),
        /* @__PURE__ */ u2("td", { class: "num", children: [
          r2.n,
          plus(r2.n, "RIGHT")
        ] }),
        /* @__PURE__ */ u2(Code, { text: r2.text, path, marker: "+" })
      ] }), ...lineExtras(path, r2.n, "RIGHT", 3, canComment, on3, r2.text));
      else if (r2.t === "del") out.push(/* @__PURE__ */ u2("tr", { class: "del", children: [
        /* @__PURE__ */ u2("td", { class: "num", children: [
          r2.o,
          plus(r2.o, "LEFT")
        ] }),
        /* @__PURE__ */ u2("td", { class: "num" }),
        /* @__PURE__ */ u2(Code, { text: r2.text, path, marker: "-" })
      ] }), ...lineExtras(path, r2.o, "LEFT", 3, canComment, on3));
      else out.push(/* @__PURE__ */ u2("tr", { children: [
        /* @__PURE__ */ u2("td", { class: "num", children: r2.o }),
        /* @__PURE__ */ u2("td", { class: "num", children: [
          r2.n,
          plus(r2.n, "RIGHT")
        ] }),
        /* @__PURE__ */ u2(Code, { text: r2.text, path, marker: " " })
      ] }), ...lineExtras(path, r2.n, "RIGHT", 3, canComment, on3, r2.text));
    }
    return /* @__PURE__ */ u2("table", { class: "diff", children: [
      /* @__PURE__ */ u2("colgroup", { children: [
        /* @__PURE__ */ u2("col", { style: "width:64px" }),
        /* @__PURE__ */ u2("col", { style: "width:64px" }),
        /* @__PURE__ */ u2("col", {})
      ] }),
      /* @__PURE__ */ u2("tbody", { children: out })
    ] });
  }
  var sugOf = (c2) => {
    const m2 = (c2.body || "").match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/);
    return m2 ? m2[1] : null;
  };
  function suggestProps(c2, b2, list) {
    const t2 = sugOf(c2);
    if (t2 !== null && S.applied?.has(String(c2.id))) return { kind: "note", text: "Applying suggestion\u2026" };
    if (t2 === null || !b0open() || list.some((x2) => (b2.resolved_ids || []).includes(x2.id))) return null;
    const p2 = b2.pull, mine = p2.head.repo && !p2.head.repo.fork || p2.head.repo && p2.head.repo.full_name === p2.base.repo.full_name;
    if (!c2.line) return { kind: "note", text: "Outdated suggestion \u2014 the lines have changed." };
    return { kind: "btn", id: c2.id, disabled: !p2.head.repo, ref: p2.head.ref, mine: !!mine };
  }
  function reviewBlockProps(e2, b2) {
    const resolved = new Set(b2.resolved_ids || []), isRes = (list) => list.some((c2) => resolved.has(c2.id));
    const stateMap = { approved: ["check", "success", "approved these changes"], changes_requested: ["file-diff", "danger", "requested changes"], commented: ["eye", "", "reviewed"], dismissed: ["x", "", "dismissed a review"] };
    const [ic, kind, verb] = stateMap[e2.state.toLowerCase()] || ["eye", "", "reviewed"];
    const mine = b2.review_comments.filter((c2) => c2.pull_request_review_id === e2.id), mineIds = new Set(mine.map((c2) => c2.id));
    const cs = [...mine, ...b2.review_comments.filter((c2) => c2.pull_request_review_id !== e2.id && mineIds.has(c2.in_reply_to_id))].filter((c2) => !S.who.length || S.who.includes(e2.user?.login) || S.who.includes(c2.user?.login));
    const hasBody = e2.body_html && e2.body_html.trim();
    const byPath = {};
    cs.forEach((c2) => (byPath[`${c2.path}\0${c2.original_position ?? c2.position}`] ||= []).push(c2));
    const all = Object.values(byPath).map((l2) => l2.sort((x2, y2) => (x2.in_reply_to_id ? 1 : 0) - (y2.in_reply_to_id ? 1 : 0) || x2.id - y2.id)), allRes = all.length > 0 && all.every(isRes), nres = all.filter(isRes).length, rk = "r:" + e2.id;
    const lists = S.unres ? all.filter((l2) => !isRes(l2)) : all;
    if (S.unres && !lists.length) return null;
    const threads = lists.map((list) => ({
      folded: isFolded("t:" + list[0].id, isRes(list)),
      k: "t:" + list[0].id,
      def: isRes(list),
      path: list[0].path,
      resolved: isRes(list),
      tid: (b2.thread_ids || {})[list[0].id] ? b2.thread_ids[list[0].id] : null,
      hunk: hunkRows(list[0].diff_hunk || ""),
      cards: list.map((c2) => ({ user: c2.user, login: c2.user.login, at: c2.created_at, id: c2.id, root: list[0].id, withMenu: true, bodyHtml: c2.body_html || "", reactions: reactionProps(c2.reactions, "review_comment", c2.id), sug: suggestProps(c2, b2, list), anchorId: true })),
      reply: { rid: list[0].id, ph: "Reply\u2026", err: errMsg("reply-" + list[0].id) }
    }));
    const sum = all.length ? { ok: allRes, allRes, text: `${all.length} thread${all.length === 1 ? "" : "s"}${nres ? ` \xB7 ${nres} resolved` : ""}` } : null;
    return { folded: isFolded(rk, allRes), k: rk, kind, ic, user: e2.user, verb, url: e2.html_url ?? "", at: whenParts(e2.submitted_at).text, sum, bodyHtml: hasBody ? e2.body_html : "", threads, allRes };
  }

  // src/app/fold.ts
  function foldToggle(e2, k2, def) {
    e2.stopPropagation();
    if (e2.target.closest("a")) return;
    const el = e2.currentTarget, now = !isFolded(k2, def);
    S.fold[k2] = now;
    localStorage.setItem("fold", JSON.stringify(S.fold));
    rerender();
    if (now) return;
    const box = el.closest(".fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane"), main = $(".main");
    if (!box || !main || !main.contains(box)) return;
    const r2 = box.getBoundingClientRect(), m2 = main.getBoundingClientRect();
    if (r2.bottom > m2.bottom - 8 || r2.top < m2.top) box.scrollIntoView({ block: r2.height > m2.height * 0.85 ? "start" : "center", behavior: "smooth" });
  }

  // src/app/timeline.tsx
  function rangeBounds() {
    const H2 = 36e5, now = Date.now(), r2 = S.range;
    if (r2 === "1h") return [now - H2, Infinity];
    if (r2 === "24h") return [now - 24 * H2, Infinity];
    if (r2 === "7d") return [now - 7 * 24 * H2, Infinity];
    if (r2 === "30d") return [now - 30 * 24 * H2, Infinity];
    if (r2 === "custom") {
      const lo = S.rFrom ? (/* @__PURE__ */ new Date(S.rFrom + "T00:00:00")).getTime() : -Infinity, hi = S.rTo ? (/* @__PURE__ */ new Date(S.rTo + "T23:59:59.999")).getTime() : Infinity;
      return [lo, hi];
    }
    return [-Infinity, Infinity];
  }
  function timelineModel(b2) {
    const p2 = b2.pull, out = [];
    const evUser = (e2) => {
      const u3 = e2.user || e2.actor || e2.author;
      return u3?.login || u3?.name || "";
    };
    const people = /* @__PURE__ */ new Map(), bump = (u3) => {
      if (!u3?.login) return;
      const r2 = people.get(u3.login) || { u: u3, n: 0 };
      r2.n++;
      people.set(u3.login, r2);
    };
    bump(p2.user);
    b2.timeline.forEach((e2) => {
      if (e2.event === "commented" || e2.event === "reviewed") bump(e2.user);
    });
    b2.review_comments.forEach((c2) => bump(c2.user));
    S.who = S.who.filter((w2) => people.has(w2));
    const who = S.who, on3 = who.length > 0;
    const byUser = on3 ? b2.timeline.filter((e2) => who.includes(evUser(e2)) || e2.event === "reviewed" && b2.review_comments.some((c2) => c2.pull_request_review_id === e2.id && who.includes(c2.user?.login))) : b2.timeline;
    const byKind = S.unres ? byUser.filter((e2) => e2.event === "reviewed") : byUser;
    const evTime = (e2) => e2.created_at || e2.submitted_at || e2.committer?.date || e2.author?.date || "";
    const [rLo, rHi] = rangeBounds(), rangeOn = S.range !== "all";
    const inRange = (t2) => {
      const x2 = t2 ? Date.parse(t2) : NaN;
      return isNaN(x2) || x2 >= rLo && x2 <= rHi;
    };
    const keep4 = !rangeOn ? byKind : byKind.filter((e2) => inRange(evTime(e2)) || e2.event === "reviewed" && b2.review_comments.some((c2) => c2.pull_request_review_id === e2.id && inRange(c2.created_at)) || e2.event === "reviewed" && b2.review_comments.some((c2) => inRange(c2.created_at) && b2.review_comments.some((r2) => r2.id === c2.in_reply_to_id && r2.pull_request_review_id === e2.id)));
    if (!S.unres && (!on3 || who.includes(p2.user.login))) out.push({ t: "comment", p: commentBoxProps({ ...p2, created_at: p2.created_at, html_url: p2.html_url, reactions: p2.reactions }, { isPr: true, flush: true }) });
    const evs = [];
    for (let i2 = 0; i2 < keep4.length; ) {
      let j2 = i2;
      while (j2 < keep4.length && keep4[j2].event === "committed") j2++;
      if (j2 - i2 >= 6) {
        evs.push({ event: "commit-run", n: j2 - i2, first: keep4[i2], last: keep4[j2 - 1] });
        i2 = j2;
      } else {
        evs.push(keep4[i2]);
        i2++;
      }
    }
    if (S.sort === "desc") evs.reverse();
    const info = b2.commit_info || {};
    const simpleRow = (e2, ic, text, kind = "") => out.push({ t: "simple", p: { actor: e2.actor, ic, text, kind, at: e2.created_at } });
    for (const e2 of evs) {
      switch (e2.event) {
        case "commented":
          out.push({ t: "comment", p: commentBoxProps(e2) });
          break;
        case "commit-run":
          out.push({ t: "run", n: e2.n, first: e2.first.sha.slice(0, 7), last: e2.last.sha.slice(0, 7) });
          break;
        case "reviewed": {
          const rp = reviewBlockProps(e2, b2);
          if (rp) out.push({ t: "review", p: rp });
          break;
        }
        case "committed":
          out.push({ t: "committed", row: { first: String(e2.message || "").split("\n")[0], sha: e2.sha, author: info[e2.sha]?.author || (e2.author?.avatar_url ? e2.author : null), url: e2.html_url, verification: e2.verification, trailing: "" } });
          break;
        case "referenced": {
          const ci = info[e2.commit_id];
          const ml = ci ? ci.message.split("\n")[0] : "";
          out.push({ t: "referenced", p: { actor: e2.actor, at: e2.created_at, commit: ci ? { author: ci.author, html_url: ci.html_url, sha: ci.sha } : null, msg: ml } });
          break;
        }
        case "merged":
          out.push({ t: "merged", actor: e2.actor, commit: (e2.commit_id || "").slice(0, 7), base: p2.base.label ?? "", at: e2.created_at }, { t: "brk" });
          break;
        case "closed":
          if (!p2.merged) simpleRow(e2, "git-pull-request-closed", "closed this", "danger");
          break;
        case "reopened":
          simpleRow(e2, "git-pull-request", "reopened this", "success");
          break;
        case "cross-referenced": {
          const i2 = e2.source?.issue;
          if (!i2) break;
          const isPr = !!i2.pull_request;
          out.push({ t: "cross", p: { actor: e2.actor, at: e2.created_at, isPr, open: i2.state === "open", icon: isPr ? i2.state === "open" ? "git-pull-request" : "git-merge" : "issue-opened", url: i2.html_url, title: i2.title.split("\n")[0].slice(0, 120), repo: i2.repository?.full_name || "", number: i2.number } });
          break;
        }
        case "labeled":
        case "unlabeled":
          out.push({ t: "label", actor: e2.actor, verb: e2.event === "labeled" ? "added" : "removed", color: e2.label?.color ?? "", name: e2.label?.name ?? "", at: e2.created_at });
          break;
        case "assigned":
        case "unassigned":
          simpleRow(e2, "person", `${e2.event} ${e2.assignee ? e2.assignee.login : ""}`);
          break;
        case "review_requested":
          simpleRow(e2, "eye", `requested a review from ${e2.requested_reviewer?.login || e2.requested_team?.name || ""}`);
          break;
        case "renamed":
          simpleRow(e2, "pencil", /* @__PURE__ */ u2(S2, { children: [
            "changed the title ",
            /* @__PURE__ */ u2("s", { children: e2.rename?.from }),
            " ",
            e2.rename?.to
          ] }));
          break;
        case "head_ref_force_pushed":
          simpleRow(e2, "repo-push", "force-pushed the head branch");
          break;
        case "head_ref_deleted":
          simpleRow(e2, "git-branch", "deleted the head branch");
          break;
        case "ready_for_review":
          simpleRow(e2, "eye", "marked this pull request as ready for review");
          break;
        case "convert_to_draft":
          simpleRow(e2, "git-pull-request-draft", "marked this pull request as draft");
          break;
        case "milestoned":
          simpleRow(e2, "milestone", `added this to the ${e2.milestone?.title ?? ""} milestone`);
          break;
        case "locked":
          simpleRow(e2, "lock", "locked this conversation");
          break;
        default:
          break;
      }
    }
    return {
      who: people.size > 1 ? { everyone: !on3, people: [...people.values()].sort((x2, y2) => y2.n - x2.n).map(({ u: u3, n: n2 }) => ({ u: u3, n: n2, on: who.includes(u3.login) })) } : null,
      range: { range: S.range, from: S.rFrom, to: S.rTo, desc: S.sort === "desc" },
      rows: out,
      empty: !evs.length && (on3 || rangeOn) ? rangeOn ? "No activity in this period." : "Nothing from the selected accounts." : "",
      merge: on3 ? null : mergeModel(b2),
      act: mergeActProps(b2),
      composer: composerProps(b2)
    };
  }
  var checkState = (c2) => c2.status !== "completed" ? "pending" : c2.conclusion === "success" ? "pass" : ["skipped", "neutral"].includes(c2.conclusion) ? "skip" : "fail";
  var CK = { pass: ["check-circle-fill", "Passed"], fail: ["x-circle-fill", "Failed"], pending: ["dot-fill", "In progress"], skip: ["circle-slash", "Skipped"] };
  function checksView(b2) {
    const list = (b2.checks || []).map((c2) => ({ ...c2, st: checkState(c2) }));
    if (!list.length) return /* @__PURE__ */ u2("div", { class: "diff-empty", children: "No checks reported for the latest commit." });
    const n2 = (s2) => list.filter((c2) => c2.st === s2).length;
    const rank = { fail: 0, pending: 1, pass: 2, skip: 3 };
    list.sort((x2, y2) => rank[x2.st] - rank[y2.st] || String(x2.name).localeCompare(String(y2.name)));
    const head2 = n2("fail") ? ["fail", `${n2("fail")} failing`] : n2("pending") ? ["pending", `${n2("pending")} in progress`] : ["pass", "All checks passed"];
    const dur = (c2) => {
      const s2 = Date.parse(c2.started_at), e2 = Date.parse(c2.completed_at);
      if (!s2 || !e2 || e2 < s2) return "";
      const t2 = Math.round((e2 - s2) / 1e3);
      return t2 >= 60 ? `${Math.floor(t2 / 60)}m ${t2 % 60}s` : `${t2}s`;
    };
    const rows = list.map((c2) => ({ name: c2.name, st: c2.st, url: c2.url, desc: c2.description || (c2.app ? c2.app : ""), req: (S.bundle?.required_checks || []).includes(c2.name), status: c2.st === "fail" && c2.conclusion && c2.conclusion !== "failure" ? c2.conclusion.replace(/_/g, " ") : CK[c2.st][1], dur: dur(c2), icon: CK[c2.st][0] }));
    return /* @__PURE__ */ u2(Checks, { head: [head2[0], head2[1]], headIcon: CK[head2[0]][0], summary: [n2("fail") && `${n2("fail")} failing`, n2("pending") && `${n2("pending")} in progress`, n2("pass") && `${n2("pass")} passed`, n2("skip") && `${n2("skip")} skipped`].filter(Boolean).join(" \xB7 "), rows });
  }
  function unresolvedRoots(b2) {
    const res = new Set(b2.resolved_ids || []);
    return b2.review_comments.filter((c2) => !c2.in_reply_to_id && !res.has(c2.id));
  }
  function attentionProps(b2) {
    const p2 = b2.pull, rc = b2.review_comments, roots = rc.filter((c2) => !c2.in_reply_to_id), open2 = unresolvedRoots(b2);
    const known = S.hasToken || (b2.resolved_ids || []).length > 0;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user).forEach((e2) => {
      const st = e2.state.toLowerCase();
      if (st === "commented" && latest.has(e2.user.login)) return;
      latest.set(e2.user.login, st);
    });
    const cr = [...latest.values()].filter((s2) => s2 === "changes_requested").length, ap = [...latest.values()].filter((s2) => s2 === "approved").length;
    const ck = (b2.checks || []).map(checkState), fail = ck.filter((s2) => s2 === "fail").length, pend = ck.filter((s2) => s2 === "pending").length, pass = ck.filter((s2) => s2 === "pass").length;
    const it = [];
    const add = (k2, ic, text, attr = {}) => it.push({ k: k2, ic, text, ...attr });
    if (roots.length) {
      if (!known) add("", "comment", `${roots.length} review thread${roots.length === 1 ? "" : "s"}`);
      else if (open2.length) add("bad", "comment", `${open2.length} unresolved thread${open2.length === 1 ? "" : "s"}`, { id: "nextun", title: "Jump to the next unresolved thread" });
      else add("ok", "check-circle-fill", "All threads resolved");
    }
    add(cr ? "bad" : ap ? "ok" : "", cr ? "file-diff" : ap ? "check" : "eye", cr ? `${cr} requesting changes` : ap ? `${ap} approved` : "No approvals yet");
    if (ck.length) add(fail ? "bad" : pend ? "warn" : "ok", fail ? "x-circle-fill" : pend ? "dot-fill" : "check-circle-fill", fail ? `${fail} check${fail === 1 ? "" : "s"} failing` : pend ? `${pend} check${pend === 1 ? "" : "s"} running` : `${pass} check${pass === 1 ? "" : "s"} passed`, { dataTab: "checks", title: "Open checks" });
    if (p2.merged) add("done", "git-merge", "Merged");
    else if (p2.state === "closed") add("bad", "git-pull-request-closed", "Closed");
    else if (p2.mergeable === false || p2.mergeable_state === "dirty") add("bad", "alert", "Has conflicts");
    else if (p2.mergeable_state === "clean") add("ok", "git-merge", "Ready to merge");
    else if (p2.draft) add("", "git-pull-request-draft", "Draft");
    return { items: it, unres: S.unres, showUnres: roots.length > 0 };
  }
  function jumpUnresolved() {
    const b2 = S.bundle, list = unresolvedRoots(b2);
    if (!list.length) return;
    const c2 = list[S.unIdx % list.length];
    S.unIdx++;
    const first = b2.review_comments.find((x2) => x2.pull_request_review_id === c2.pull_request_review_id && x2.path === c2.path && (x2.original_position ?? x2.position) === (c2.original_position ?? c2.position)) || c2;
    S.fold["r:" + c2.pull_request_review_id] = false;
    S.fold["t:" + first.id] = false;
    S.fold["c:" + c2.id] = false;
    localStorage.setItem("fold", JSON.stringify(S.fold));
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    const el = document.getElementById("c-" + c2.id);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
  }
  function Row({ r: r2, on: on3 }) {
    switch (r2.t) {
      case "referenced":
        return /* @__PURE__ */ u2(Referenced, { ...r2.p });
      case "comment":
        return /* @__PURE__ */ u2(CommentBox, { ...r2.p, on: on3?.conv });
      case "review":
        return /* @__PURE__ */ u2(ReviewBlock, { ...r2.p, on: on3?.conv });
      case "run":
        return /* @__PURE__ */ u2(CommitRun, { n: r2.n, first: r2.first, last: r2.last, onTab: on3?.tab });
      case "committed":
        return /* @__PURE__ */ u2(Committed, { row: /* @__PURE__ */ u2(CommitRow, { ...r2.row }) });
      case "merged":
        return /* @__PURE__ */ u2(MergedRow, { actor: r2.actor, commit: r2.commit, base: r2.base, at: r2.at });
      case "brk":
        return /* @__PURE__ */ u2("div", { class: "TLI-break" });
      case "cross":
        return /* @__PURE__ */ u2(CrossRef, { ...r2.p });
      case "label":
        return /* @__PURE__ */ u2(LabelRow, { actor: r2.actor, verb: r2.verb, color: r2.color, name: r2.name, at: r2.at });
      case "simple":
        return /* @__PURE__ */ u2(Simple, { ...r2.p });
    }
  }
  function Timeline({ m: m2, on: on3 }) {
    const box = m2.merge && (m2.merge.kind === "merged" ? /* @__PURE__ */ u2(MergedBox, { head: m2.merge.head }) : m2.merge.kind === "closed" ? /* @__PURE__ */ u2(ClosedBox, { head: m2.merge.head }) : /* @__PURE__ */ u2(MergeBox, { ...m2.merge.p, on: on3?.merge }));
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Bars, { who: m2.who, range: m2.range, on: on3?.bars }),
      /* @__PURE__ */ u2(FoldBar, { onClick: on3?.foldAll }),
      /* @__PURE__ */ u2("div", { class: "TL", children: [
        m2.rows.map((r2) => /* @__PURE__ */ u2(Row, { r: r2, on: on3 })),
        m2.empty ? /* @__PURE__ */ u2("div", { class: "diff-empty", children: m2.empty }) : ""
      ] }),
      box,
      m2.act ? /* @__PURE__ */ u2(MergeAct, { ...m2.act, on: on3?.act }) : "",
      /* @__PURE__ */ u2(Composer, { ...m2.composer, on: on3?.composer })
    ] });
  }

  // src/app/handlers.ts
  var convOn = {
    fold: (e2, k2, def) => foldToggle(e2, k2, def),
    menu: (e2, b2) => cmMenu(e2, b2),
    react: { toggle: (e2, kind, id, c2) => reactToggle(e2, kind, id, c2), add: (e2, b2) => reactAdd(e2, b2), hover: (kind, id) => {
      getMine(kind, id);
    } },
    thread: (e2, node, how) => {
      threadAct(e2, node, how);
    },
    sug: (e2, id) => applySuggestion(e2, id),
    reply: (id) => {
      sendReply(id);
    }
  };
  var diffOn = { conv: convOn, plus: (e2) => lcOpen(e2), lc: { del: (id) => lcDel(id), cancel: () => lcCancel(), suggest: (e2) => lcSuggest(e2), add: () => lcAdd() } };
  var keep = (fn) => {
    S.keepScroll = true;
    fn();
    render();
    S.keepScroll = false;
  };
  function openTab2(k2) {
    S.tab = k2;
    render();
    document.querySelector(".main").scrollTop = 0;
  }
  var filesOn = {
    commits: () => openCommits(),
    all: () => setFr(null),
    step: (n2) => {
      const cs = commitList(S.bundle), i2 = (S.fr?.a ?? 0) + n2;
      if (cs[i2]) setFr({ a: i2, b: i2 });
    },
    mode: (m2) => setDiffMode(m2),
    sort: (e2) => {
      S.fileSort = e2.target.value;
      rerender();
    },
    finish: () => reviewDialog(),
    foldAll: (allFolded, names) => {
      names.forEach((n2) => {
        S.fold["f:" + n2] = !allFolded;
      });
      localStorage.setItem("fold", JSON.stringify(S.fold));
      rerender();
    },
    fold: (e2, k2, def) => foldToggle(e2, k2, def)
  };
  var attOn = { next: () => jumpUnresolved(), unres: () => keep(() => {
    S.unres = !S.unres;
  }), tab: openTab2 };
  var tlOn = {
    conv: convOn,
    bars: {
      who: (w2) => keep(() => {
        S.who = S.who.includes(w2) ? S.who.filter((x2) => x2 !== w2) : [...S.who, w2];
      }),
      whoClear: () => keep(() => {
        S.who = [];
      }),
      range: (e2) => keep(() => {
        S.range = e2.target.value;
        if (S.range === "custom" && !S.rFrom && !S.rTo) {
          const d2 = (t2) => new Date(t2 - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
          S.rTo = d2(Date.now());
          S.rFrom = d2(Date.now() - 7 * 864e5);
        }
      }),
      from: (e2) => keep(() => {
        S.rFrom = e2.target.value;
      }),
      to: (e2) => keep(() => {
        S.rTo = e2.target.value;
      }),
      sort: () => keep(() => {
        S.sort = S.sort === "desc" ? "asc" : "desc";
        localStorage.setItem("csort", S.sort);
      })
    },
    foldAll: () => foldAllConv(),
    tab: openTab2,
    merge: { toggle: (e2, k2) => toggleMb(e2, k2), rerun: (e2) => {
      rerunChecks(e2);
    }, update: () => {
      updateBranch();
    }, ready: () => {
      markReady();
    } },
    act: { close: () => toggleClosed(), merge: () => doMerge(), noauto: () => {
      disableAuto();
    }, auto: () => {
      enableAuto();
    }, draft: () => toDraft() },
    composer: { toggle: () => toggleComposer(), key: (e2) => cbarKey(e2), send: () => {
      sendComment();
    }, close: () => toggleClosed() }
  };

  // src/app/mergebox.tsx
  function mergeModel(b2) {
    const p2 = b2.pull;
    const head2 = p2.head.label.split(":")[1];
    if (p2.merged) return { kind: "merged", head: head2 };
    if (p2.state === "closed") return { kind: "closed", head: head2 };
    const clean = p2.mergeable_state === "clean" || p2.mergeable !== false;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user).forEach((e2) => {
      const st = e2.state.toLowerCase();
      if (st === "commented" && latest.has(e2.user.login)) return;
      latest.set(e2.user.login, st);
    });
    const ap = [...latest.values()].filter((x2) => x2 === "approved").length, cr = [...latest.values()].filter((x2) => x2 === "changes_requested").length, pendRev = (p2.requested_reviewers || []).length;
    const rvHead = cr ? ["bad", "x-circle-fill", "Changes requested", `${cr} reviewer${cr === 1 ? "" : "s"} requested changes`] : ap ? ["ok", "check-circle-fill", "Changes approved", `${ap} approving review${ap === 1 ? "" : "s"}`] : ["", "eye", "Review not yet submitted", pendRev ? `${pendRev} pending review${pendRev === 1 ? "" : "s"}` : "No reviews yet"];
    const list = (b2.checks || []).map((c2) => ({ ...c2, st: checkState(c2) })), cnt = (k2) => list.filter((c2) => c2.st === k2).length;
    const ckHead = cnt("fail") ? ["bad", "x-circle-fill", `${cnt("fail")} check${cnt("fail") === 1 ? "" : "s"} failing`] : cnt("pending") ? ["", "dot-fill", `${cnt("pending")} check${cnt("pending") === 1 ? "" : "s"} in progress`] : ["ok", "check-circle-fill", "All checks have passed"];
    const ckSub = [cnt("skip") && `${cnt("skip")} neutral`, cnt("pass") && `${cnt("pass")} successful`, cnt("fail") && `${cnt("fail")} failing`, cnt("pending") && `${cnt("pending")} pending`].filter(Boolean).join(", ");
    const grp = (k2, title) => {
      const g2 = list.filter((c2) => c2.st === k2);
      if (!g2.length) return [];
      const open2 = S.mbOpen?.has("g" + k2) ?? k2 !== "pass";
      return [{ k: k2, title, open: open2, items: g2.map((c2) => ({ st: c2.st, url: c2.url, icon: CK[c2.st][0], name: c2.name, req: (S.bundle?.required_checks || []).includes(c2.name), desc: c2.description || c2.app || "" })) }];
    };
    return { kind: "open", p: {
      draft: !!p2.draft,
      busyReady: S.busy === "ready",
      errReady: errMsg("ready"),
      rv: { h: rvHead, open: !!S.mbOpen?.has("rv"), ap, cr, pend: pendRev, pendNames: (p2.requested_reviewers || []).map((u3) => u3.login).join(", ") },
      ck: list.length ? { h: ckHead.concat(ckSub), open: !!S.mbOpen?.has("ck"), rerunable: list.some((c2) => c2.st === "fail" && /\/actions\/runs\//.test(c2.url || "")), groups: [...grp("fail", "Failing checks"), ...grp("pending", "In progress"), ...grp("skip", "Neutral checks"), ...grp("pass", "Successful checks")] } : null,
      behind: p2.mergeable_state === "behind",
      busyUpdate: S.busy === "update_branch",
      baseRef: p2.base.ref,
      errUpdate: errMsg("update_branch"),
      clean
    } };
  }
  function sidebarProps(b2) {
    const p2 = b2.pull;
    const reviewers = /* @__PURE__ */ new Map();
    p2.requested_reviewers.forEach((u3) => reviewers.set(u3.login, { u: u3, st: "req" }));
    b2.timeline.filter((e2) => e2.event === "reviewed").forEach((e2) => {
      const st = e2.state.toLowerCase();
      const cur = reviewers.get(e2.user.login);
      if (cur?.st === "req") {
        if (!cur.prev || st === "approved" || st === "changes_requested") cur.prev = st;
      } else if (!cur || st === "approved" || st === "changes_requested") reviewers.set(e2.user.login, { u: e2.user, st });
    });
    const canRe = !p2.merged && p2.state === "open";
    const rv = [...reviewers.values()].map((r2) => ({ ...r2, canRe: canRe && r2.st !== "req" && r2.u.login !== p2.user.login }));
    const people = /* @__PURE__ */ new Map();
    [p2.user, ...b2.timeline.map((e2) => e2.user || e2.actor || e2.author)].forEach((u3) => u3 && u3.login && !people.has(u3.login) && people.set(u3.login, u3));
    return {
      reviewers: rv,
      showAll: !!S.showAllReviewers,
      assignees: p2.assignees,
      labels: p2.labels,
      milestone: p2.milestone ?? null,
      people: [...people.values()].slice(0, 30),
      peopleCount: people.size,
      folded: { reviewers: isFolded("sb:Reviewers"), assignees: isFolded("sb:Assignees"), labels: isFolded("sb:Labels"), milestone: isFolded("sb:Milestone"), people: isFolded("sb:people") }
    };
  }
  var frKey = (cs, r2) => r2.a === r2.b ? cs[r2.a].sha : `${cs[r2.a].parent}..${cs[r2.b].sha}`;
  function frDiff(b2) {
    const cs = commitList(b2), r2 = S.fr;
    if (!r2 || !cs[r2.a] || !cs[r2.b]) return b2.files;
    return r2.a === r2.b ? S.cdiff[cs[r2.a].sha] : S.rdiff[frKey(cs, r2)];
  }
  async function loadFr() {
    const b2 = S.bundle, r2 = S.fr;
    if (!b2 || !r2) return;
    const cs = commitList(b2), single = r2.a === r2.b, k2 = frKey(cs, r2), store = single ? S.cdiff : S.rdiff, repo = b2.pull.base.repo.full_name;
    if (store[k2] !== void 0 && store[k2] !== "loading") return;
    store[k2] = "loading";
    render();
    try {
      if (!tauri) throw new Error("Per-commit diffs are available in the desktop app.");
      if (!single && !cs[r2.a].parent) throw new Error("This range has no parent commit to compare against.");
      store[k2] = (single ? await tauri.invoke("fetch_commit", { repo, sha: k2 }) : await tauri.invoke("fetch_range", { repo, base: cs[r2.a].parent, head: cs[r2.b].sha })).files || [];
    } catch (e2) {
      store[k2] = String(e2).replace(/^Error: /, "");
    }
    render();
  }
  function setFr(r2) {
    S.fr = r2;
    S.dlg = null;
    render();
    loadFr();
  }
  function sinceReview(b2) {
    const cs = commitList(b2), mine = b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user?.login === S.me && e2.commit_id);
    if (!S.me || !mine.length) return null;
    const at = cs.findIndex((c2) => c2.sha === mine[mine.length - 1].commit_id);
    return at < 0 ? null : { at, n: cs.length - 1 - at };
  }
  function commitsDialogProps() {
    const b2 = S.bundle, cs = commitList(b2), pick = S.cpick || S.fr, sr = sinceReview(b2), q3 = (S.cfilter || "").toLowerCase();
    const on3 = (i2) => !!pick && i2 >= pick.a && i2 <= pick.b;
    return {
      rows: cs.map((c2, i2) => {
        const title = String(c2.message).split("\n")[0], by = c2.name || c2.author?.login || "", w2 = when(c2.date).replace(/<\/?span[^>]*>/g, ""), sha = c2.sha.slice(0, 7);
        return { i: i2, on: on3(i2), title, by, when: w2, sha, hidden: !!q3 && !(title + by + " committed " + w2 + sha).toLowerCase().includes(q3) };
      }),
      count: cs.length,
      allOn: !S.fr,
      since: sr ? { on: !!S.fr && S.fr.a === sr.at + 1 && S.fr.b === cs.length - 1, n: sr.n } : null,
      filter: S.cfilter || "",
      selLabel: pick ? pick.a === pick.b ? "1 commit selected" : `${pick.b - pick.a + 1} commits selected` : "Nothing selected",
      hasPick: !!pick
    };
  }
  function openCommits() {
    S.cpick = S.fr ? { ...S.fr } : null;
    S.cfilter = "";
    S.dlg = { k: "commits" };
    render();
  }
  function filesView(b2) {
    const cs = commitList(b2), r2 = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = !!r2 && r2.a === r2.b;
    const sh = (i2) => cs[i2].sha.slice(0, 7);
    const bar = /* @__PURE__ */ u2(FcBar, { label: !r2 ? "All commits" : single ? "Commit" : `${r2.b - r2.a + 1} commits`, count: !r2 ? cs.length : null, code: !r2 ? null : single ? sh(r2.a) : `${sh(r2.a)}\u2026${sh(r2.b)}`, nav: single ? { prevOff: r2.a <= 0, nextOff: r2.a >= cs.length - 1 } : null, title: r2 && single ? String(cs[r2.a].message).split("\n")[0] : "", hasRange: !!r2, on: filesOn });
    if (!r2) return /* @__PURE__ */ u2(S2, { children: [
      bar,
      filesList(b2.files, true)
    ] });
    const d2 = frDiff(b2);
    return /* @__PURE__ */ u2(S2, { children: [
      bar,
      d2 === void 0 || d2 === "loading" ? /* @__PURE__ */ u2("div", { class: "diff-empty", children: "Loading\u2026" }) : typeof d2 === "string" ? /* @__PURE__ */ u2("div", { class: "diff-empty err", children: d2 }) : filesList(d2)
    ] });
  }
  var b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === "open";
  function filesList(files, canComment = false) {
    if (!files.length) return /* @__PURE__ */ u2("div", { class: "diff-empty", children: "No files changed." });
    const pid = S.bundle?.pull?.id;
    const hasC = (f3) => (S.bundle?.review_comments || []).some((c2) => c2.path === f3.filename) || pendList().some((p2) => p2.path === f3.filename);
    if (S.autoFoldFor !== pid) {
      S.autoFoldFor = pid;
      let budget = 1200;
      for (const f3 of files) {
        const n2 = f3.additions + f3.deletions, key = "f:" + f3.filename;
        if (key in S.fold || hasC(f3)) continue;
        if (n2 > 400 || n2 > budget) S.fold[key] = true;
        else budget -= n2;
      }
    }
    const shown2 = (f3) => !S.fold["f:" + f3.filename];
    const srt = S.fileSort || "path", cnt = (f3) => (S.bundle?.review_comments || []).filter((c2) => c2.path === f3.filename && !c2.in_reply_to_id).length;
    const so = { path: null, pathz: (x2, y2) => y2.filename.localeCompare(x2.filename), most: (x2, y2) => y2.additions + y2.deletions - (x2.additions + x2.deletions), least: (x2, y2) => x2.additions + x2.deletions - (y2.additions + y2.deletions), comments: (x2, y2) => cnt(y2) - cnt(x2), status: (x2, y2) => String(x2.status).localeCompare(String(y2.status)) || x2.filename.localeCompare(y2.filename) };
    const srtFn = so[srt];
    if (srtFn) files = [...files].sort(srtFn);
    const all = files.every((f3) => S.fold["f:" + f3.filename]);
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(FilesBar, { mode: S.diffMode ?? "", sort: srt, pending: pendList().length, allFolded: all, names: files.map((f3) => f3.filename), on: filesOn }),
      files.map((f3) => {
        const t2 = f3.additions + f3.deletions || 1, a2 = Math.round(f3.additions / t2 * 5), d2 = Math.min(5 - a2, Math.round(f3.deletions / t2 * 5));
        const sq = Array.from({ length: 5 }, (_2, i2) => i2 < a2 ? "a" : i2 < a2 + d2 ? "d" : "");
        return /* @__PURE__ */ u2(FileBox, { name: f3.filename, folded: isFolded("f:" + f3.filename), closed: !!S.fold["f:" + f3.filename], add: f3.additions, del: f3.deletions, sq, on: filesOn, children: !shown2(f3) ? "" : f3.patch ? diffTable(f3.patch, f3.filename, canComment && b0open(), diffOn) : /* @__PURE__ */ u2("div", { class: "diff-empty", children: "Binary file or diff too large to display." }) });
      })
    ] });
  }
  function commitsView(b2) {
    const c2 = b2.timeline.filter((e2) => e2.event === "committed");
    return /* @__PURE__ */ u2(CommitsList, { rows: c2.map((e2) => /* @__PURE__ */ u2(CommitRow, { first: String(e2.message || "").split("\n")[0], sha: e2.sha, author: e2.author?.avatar_url ? e2.author : null, url: e2.html_url, verification: e2.verification, trailing: "" })) });
  }
  function commitList(b2) {
    if (b2.commits && b2.commits.length) return b2.commits.map((c2) => ({ sha: c2.sha, message: c2.commit.message, author: c2.author, name: c2.commit.author?.name, date: c2.commit.author?.date, url: c2.html_url, parent: c2.parents?.[0]?.sha }));
    return b2.timeline.filter((e2) => e2.event === "committed").map((e2) => ({ sha: e2.sha, message: e2.message, author: e2.author?.avatar_url ? e2.author : null, name: e2.author?.name, date: e2.author?.date, url: e2.html_url }));
  }
  S.flip = localStorage.getItem("flip") === "1";
  function flipSides() {
    S.flip = !S.flip;
    localStorage.setItem("flip", S.flip ? "1" : "0");
    rerender();
  }
  var hideSide = (k2, v2) => {
    S.hide[k2] = v2;
    localStorage.setItem("hide", JSON.stringify(S.hide));
    rerender();
  };
  function gutterDrag(e2) {
    e2.preventDefault();
    const sp = $(".split"), r2 = sp.getBoundingClientRect();
    const mv = (ev) => {
      S.lw = Math.max(25, Math.min(75, (S.flip ? r2.right - ev.clientX : ev.clientX - r2.left) / r2.width * 100));
      sp.style.setProperty("--lw", S.lw + "%");
    };
    const up = () => {
      removeEventListener("mousemove", mv);
      removeEventListener("mouseup", up);
      document.body.classList.remove("dragging");
      localStorage.setItem("lw", String(Math.round(S.lw)));
    };
    document.body.classList.add("dragging");
    addEventListener("mousemove", mv);
    addEventListener("mouseup", up);
  }
  var splitOn = { hide: hideSide, flip: flipSides, pick: (sha) => {
    selectCommit(sha);
  }, gutter: gutterDrag, fold: (e2, k2, def) => convOn.fold(e2, k2, def) };
  function splitView(b2) {
    const cs = commitList(b2), sha = S.sel;
    const cnt = (c2) => b2.review_comments.filter((r2) => r2.original_commit_id === c2 || r2.commit_id === c2).length;
    let diff;
    if (!sha) diff = filesList(b2.files, true);
    else {
      const d2 = S.cdiff[sha];
      diff = d2 === void 0 || d2 === "loading" ? /* @__PURE__ */ u2("div", { class: "diff-empty", children: "Loading commit\u2026" }) : typeof d2 === "string" ? /* @__PURE__ */ u2("div", { class: "diff-empty err", children: d2 }) : filesList(d2);
    }
    return /* @__PURE__ */ u2(
      SplitView,
      {
        hl: !!S.hide.l,
        hr: !!S.hide.r,
        flip: !!S.flip,
        lw: S.lw,
        allOn: !sha,
        allSub: `${b2.pull.changed_files} files \xB7 +${b2.pull.additions} \u2212${b2.pull.deletions}`,
        rows: cs.map((c2) => ({ sha: c2.sha, on: sha === c2.sha, author: c2.author, initial: (c2.name || "?")[0], title: String(c2.message).split("\n")[0], sub: `${c2.name || c2.author?.login || ""} \xB7 ${when(c2.date).replace(/<\/?span[^>]*>/g, "")}`, n: cnt(c2.sha) })),
        count: cs.length,
        subTitle: sha ? "Commit " + sha.slice(0, 7) : "All changes",
        foldList: isFolded("cm-list"),
        foldDiff: isFolded("cm-diff"),
        diff,
        right: /* @__PURE__ */ u2(S2, { children: [
          /* @__PURE__ */ u2(Attention, { ...attentionProps(b2), on: attOn }),
          /* @__PURE__ */ u2(Timeline, { m: timelineModel(b2), on: tlOn })
        ] }),
        on: splitOn
      }
    );
  }
  async function selectCommit(sha) {
    S.sel = sha || null;
    render();
    if (!sha || S.cdiff[sha] !== void 0) return;
    S.cdiff[sha] = "loading";
    try {
      if (!tauri) throw new Error("Per-commit diffs are available in the desktop app.");
      S.cdiff[sha] = (await tauri.invoke("fetch_commit", { repo: S.bundle.pull.base.repo.full_name, sha })).files || [];
    } catch (e2) {
      S.cdiff[sha] = String(e2).replace(/^Error: /, "");
    }
    if (S.sel === sha) render();
  }

  // src/app/token.ts
  function tokenDialog() {
    S.oauth = {};
    S.oauthLive = false;
    S.dlg = { k: "token" };
    render();
  }
  async function tokenSave() {
    const v2 = document.getElementById("tokeninput").value;
    try {
      await tauri?.invoke("set_token", { token: v2 });
      S.hasToken = !!v2.trim();
      S.authChecked = true;
      if (S.hasToken) {
        S.gateErr = "";
        loadRepos();
      } else {
        S.repos = null;
      }
    } catch (e2) {
      alert(e2);
    }
    S.oauthLive = false;
    S.dlg = null;
    render();
  }
  async function oauthGo() {
    const show = (o2) => {
      S.oauth = o2;
      if (S.dlg) paintDlg();
    };
    S.oauthLive = true;
    const me = S.oauthRun = (S.oauthRun || 0) + 1;
    try {
      const d2 = await tauri.invoke("device_start");
      show({ code: d2.user_code });
      tauri.invoke("open_external", { url: d2.verification_uri }).catch(() => {
      });
      let wait = (d2.interval || 5) * 1e3;
      const until = Date.now() + (d2.expires_in || 900) * 1e3;
      while (S.oauthLive && S.oauthRun === me && Date.now() < until) {
        await new Promise((r2) => setTimeout(r2, wait));
        if (!S.oauthLive || S.oauthRun !== me) return;
        const st = await tauri.invoke("device_poll", { deviceCode: d2.device_code });
        if (st === "slow_down") wait += 5e3;
        if (st === "ok") {
          S.oauthLive = false;
          S.hasToken = true;
          S.gateErr = "";
          S.dlg = null;
          loadRepos();
          return;
        }
      }
      throw "The code expired. Start again.";
    } catch (e2) {
      S.oauthLive = false;
      show({ err: String(e2) });
    }
  }

  // src/app/dialogs.tsx
  var paintDlg = () => {
    const h2 = $("#dlg");
    if (h2) R(/* @__PURE__ */ u2(Dialogs, {}), h2);
  };
  var cpOn = {
    close: () => closeDlg(),
    all: () => setFr(null),
    since: () => {
      const sr = sinceReview(S.bundle);
      if (sr?.n) setFr({ a: sr.at + 1, b: commitList(S.bundle).length - 1 });
    },
    save: () => {
      if (S.cpick) setFr({ ...S.cpick });
    },
    filter: (e2) => {
      S.cfilter = e2.target.value;
      paintDlg();
    },
    pick: (e2, i2) => {
      e2.preventDefault();
      const p2 = S.cpick;
      S.cpick = !p2 || p2.a !== p2.b ? { a: i2, b: i2 } : { a: Math.min(p2.a, i2), b: Math.max(p2.b, i2) };
      paintDlg();
    }
  };
  function Dialogs() {
    const d2 = S.dlg;
    if (!d2) return null;
    const close = () => closeDlg(), ok = () => {
      d2.k !== "commits" && d2.k !== "token" && d2.ok();
    };
    switch (d2.k) {
      case "commits":
        return /* @__PURE__ */ u2(CommitsDialog, { ...commitsDialogProps(), on: cpOn });
      case "token":
        return /* @__PURE__ */ u2(TokenDialog, { code: S.oauth?.code || "", err: S.oauth?.err || "", go: oauthGo, close, save: tokenSave });
      case "review": {
        const n2 = pendList().length;
        return /* @__PURE__ */ u2(ReviewDialog, { ph: n2 ? `Leave a review comment (${n2} line comment${n2 === 1 ? "" : "s"} will be included)` : "Leave a review comment (required unless approving)", ev: d2.ev, onEv: (v2) => {
          d2.ev = v2;
          paintDlg();
        }, err: errMsg("review"), close, ok });
      }
      case "editpr":
        return /* @__PURE__ */ u2(EditPrDialog, { title: d2.title, onTitle: (v2) => {
          d2.title = v2;
        }, err: errMsg("editpr"), close, ok });
      case "confirm":
        return /* @__PURE__ */ u2(ConfirmDialog, { title: d2.title, text: d2.text, label: d2.label, danger: d2.danger, close, ok });
      case "editc":
        return /* @__PURE__ */ u2(EditCommentDialog, { err: errMsg("editc"), close, ok });
      case "delc":
        return /* @__PURE__ */ u2(DeleteCommentDialog, { err: errMsg("delc"), close, ok });
      case "hidec":
        return /* @__PURE__ */ u2(HideCommentDialog, { reasons: d2.reasons, err: errMsg("hidec"), close, ok });
    }
  }
  function Pops() {
    const p2 = S.pop;
    if (!p2) return null;
    if (p2.k === "cm") return /* @__PURE__ */ u2(CmPop, { ...p2 });
    if (p2.k === "ctx") return /* @__PURE__ */ u2(CtxPop, { ...p2 });
    return /* @__PURE__ */ u2(ReactPop, { x: p2.x, y: p2.y, reacts: REACTS, pick: p2.pick });
  }
  var popHost = null;
  var paintPop = () => {
    if (!popHost) {
      popHost = document.createElement("div");
      popHost.id = "pop";
      popHost.style.display = "contents";
      document.body.appendChild(popHost);
    }
    R(/* @__PURE__ */ u2(Pops, {}), popHost);
  };
  function openPop(p2) {
    S.pop = p2;
    paintPop();
  }
  function closePop() {
    if (!S.pop) return;
    S.pop = null;
    paintPop();
  }
  document.addEventListener("click", closePop);

  // src/app/bind.ts
  S.alive = /* @__PURE__ */ new Map();
  var aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join("|");
  function stashCurrent() {
    S.openSeq = (S.openSeq || 0) + 1;
    const ref = S.view === "pr" && S.bundle ? curRef() : "", m2 = $(".main"), sh = shownPage();
    if (!ref || !m2 || !sh || sh.ref !== ref || !S.tabs.some((t2) => t2.ref === ref)) return;
    S.alive.set(ref, { vnode: sh.vnode, eds: S.eds || [], bundle: S.bundle, tab: S.tab, key: aliveKey(), scroll: m2.scrollTop });
    S.eds = [];
    while (S.alive.size > 6) {
      const old = S.alive.keys().next().value;
      S.alive.get(old)?.eds.forEach((e2) => e2.destroy());
      S.alive.delete(old);
    }
  }
  function fastTab(ref) {
    S.openSeq = (S.openSeq || 0) + 1;
    const a2 = S.alive.get(ref);
    if (!a2) return false;
    const mem = qc.peek(ref);
    if (!mem || mem.data !== a2.bundle || a2.key !== aliveKey()) {
      a2.eds.forEach((e2) => e2.destroy());
      S.alive.delete(ref);
      return false;
    }
    tabSnap();
    stashCurrent();
    S.alive.delete(ref);
    const p2 = a2.bundle.pull;
    S.view = "pr";
    S.bundle = a2.bundle;
    S.tab = a2.tab;
    S.sel = null;
    S.fr = null;
    S.error = "";
    S.loading = false;
    S.refreshing = false;
    S.tabPending = "";
    S.tabMenu = false;
    localStorage.setItem("last", ref);
    const ti = S.tabs.find((t2) => t2.ref === ref);
    if (ti) {
      ti.dot = false;
      saveTabs();
    }
    if (S.repo !== p2.base.repo.full_name) {
      S.repo = p2.base.repo.full_name;
      S.sideTab = "prs";
      setTimeout(loadPrs, 0);
    }
    if (S.draftRef !== ref) {
      saveDrafts();
      S.draftRef = ref;
      S.draft = { ...drafts[ref] || {} };
    }
    S.stash = a2;
    S.eds = a2.eds;
    render();
    $(".main").scrollTop = a2.scroll;
    if (!qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref)).then((d2) => {
      if (JSON.stringify(d2) === JSON.stringify(a2.bundle)) {
        qc.m.set(ref, { data: a2.bundle, at: Date.now() });
        return;
      }
      if (curRef() === ref) openPr(ref, { keepTab: true, nav: true });
    }).catch(() => {
    });
    return true;
  }
  function openClick(el, e2) {
    if (e2.target.closest("[data-rm], .np-act, .np-dot")) return;
    S.nav = false;
    S.focus = el.dataset.target || "";
    const nn = el.dataset.note && S.notes.find((x2) => String(x2.id) === el.dataset.note);
    if (nn) {
      nn.read = true;
      saveNotes();
    }
    if (e2.metaKey || e2.ctrlKey) {
      e2.preventDefault();
      openFromList(el.dataset.open, true);
    } else openFromList(el.dataset.open, false);
  }
  function openAux(el, e2) {
    if (e2.button === 1) {
      e2.preventDefault();
      openFromList(el.dataset.open, true);
    }
  }
  function openCtx(el, e2) {
    e2.preventDefault();
    e2.stopPropagation();
    const ref = el.dataset.open;
    openPop({ k: "ctx", x: Math.min(e2.clientX, innerWidth - 180), y: Math.min(e2.clientY, innerHeight - 120), pick: (h2) => {
      closePop();
      if (h2 === "new") openFromList(ref, true);
      else if (h2 === "here") openFromList(ref, false);
      else {
        const m2 = ref.match(/^(.+)#(\d+)$/);
        navigator.clipboard?.writeText(m2 ? `https://github.com/${m2[1]}/pull/${m2[2]}` : ref).catch(() => {
        });
      }
    } });
  }
  function rmRecent(e2, ref) {
    e2.stopPropagation();
    S.recent = S.recent.filter((r2) => r2.ref !== ref);
    localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  }
  function syncFoldAll() {
    const els = [...qa(".TL [data-fold]")], l2 = document.querySelector("#foldallconv span");
    if (l2 && els.length) l2.textContent = els.every((x2) => isFolded(x2.dataset.fold, x2.dataset.def === "1")) ? "Expand all conversations" : "Collapse all conversations";
  }
  function foldAllConv() {
    const els = [...qa(".TL [data-fold]")];
    if (!els.length) return;
    const now = els.some((x2) => !isFolded(x2.dataset.fold, x2.dataset.def === "1"));
    els.forEach((x2) => {
      S.fold[x2.dataset.fold] = now;
    });
    try {
      localStorage.setItem("fold", JSON.stringify(S.fold));
    } catch {
    }
    rerender();
  }
  document.addEventListener("mousedown", (e2) => {
    if (!e2.target.closest?.("#sbgrip")) return;
    e2.preventDefault();
    const sh = $(".shell"), x0 = e2.clientX, w0 = S.sbw;
    const mv = (ev) => {
      S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0));
      sh.style.setProperty("--sbw", S.sbw + "px");
    };
    const up = () => {
      removeEventListener("mousemove", mv);
      removeEventListener("mouseup", up);
      document.body.classList.remove("dragging");
      localStorage.setItem("sbw", String(Math.round(S.sbw)));
    };
    document.body.classList.add("dragging");
    addEventListener("mousemove", mv);
    addEventListener("mouseup", up);
  });
  document.addEventListener("dblclick", (e2) => {
    if (e2.target.closest?.("#sbgrip")) {
      S.sbw = 260;
      localStorage.setItem("sbw", "260");
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }
  });
  document.addEventListener("click", (e2) => {
    if (e2.target.closest?.("#scrim")) {
      S.nav = false;
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }
  });
  var scrollRaf = 0;
  document.addEventListener("scroll", (e2) => {
    const mn = e2.target;
    if (!mn.classList?.contains("main") || S.view !== "pr" || S.restoring || scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const t2 = S.tabs[tabIdx()];
      if (t2) {
        t2.scroll = mn.scrollTop;
        t2.tab = S.tab;
      }
    });
  }, { capture: true, passive: true });

  // src/components/NotePanel.tsx
  var NotePanel = ({ open: open2, rows, on: on3 }) => /* @__PURE__ */ u2("div", { class: `note-panel${open2 ? " open" : ""}`, children: [
    /* @__PURE__ */ u2("div", { class: "note-h", children: [
      /* @__PURE__ */ u2("b", { children: "Notifications" }),
      /* @__PURE__ */ u2("span", { children: [
        /* @__PURE__ */ u2("button", { id: "noteall", onClick: on3.all, children: "View all" }),
        " ",
        /* @__PURE__ */ u2("button", { id: "notecheck", onClick: on3.check, children: "Check now" }),
        " ",
        /* @__PURE__ */ u2("button", { id: "noteclear", onClick: on3.clear, children: "Clear all" })
      ] })
    ] }),
    rows.length ? rows.map((n2) => /* @__PURE__ */ u2("a", { class: `note ${n2.read ? "" : "new"}`, "data-open": n2.ref, "data-target": n2.target, onClick: on3.open, onAuxClick: on3.aux, onContextMenu: on3.ctx, children: [
      /* @__PURE__ */ u2("b", { children: n2.title }),
      /* @__PURE__ */ u2("span", { children: n2.text }),
      /* @__PURE__ */ u2("i", { children: [
        n2.ref,
        " \xB7 ",
        n2.when
      ] })
    ] })) : /* @__PURE__ */ u2("div", { class: "note-empty", children: "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." })
  ] });

  // src/components/TabStrip.tsx
  function TabStrip({ tabs, cur, recents, menu, closedFirst, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "ptabs", children: [
      tabs.map((t2, i2) => /* @__PURE__ */ u2("div", { class: `ptab ${t2.ref === cur ? "on" : ""}`, "data-tab": i2, onClick: (e2) => {
        if (e2.target.closest(".pt-x")) return;
        on3.open(i2);
      }, onAuxClick: (e2) => on3.aux(e2, i2), onMouseDown: (e2) => on3.down(e2, i2), title: t2.ref + " \xB7 " + t2.title, children: [
        /* @__PURE__ */ u2("span", { class: `rc-i ${t2.state}`, children: /* @__PURE__ */ u2(Icon, { n: t2.icon }) }),
        /* @__PURE__ */ u2("span", { class: "pt-t", children: [
          /* @__PURE__ */ u2("i", { children: t2.ref.split("/").pop() }),
          " ",
          t2.title
        ] }),
        t2.dot && /* @__PURE__ */ u2("span", { class: "pt-dot" }),
        /* @__PURE__ */ u2("button", { class: "pt-x", "data-tabx": i2, onClick: (e2) => on3.close(e2, i2), "aria-label": "Close tab", children: /* @__PURE__ */ u2(Icon, { n: "x" }) })
      ] })),
      /* @__PURE__ */ u2("button", { class: "pt-add", id: "tabadd", onClick: on3.add, title: "New tab (\u2318T)", "aria-label": "New tab", children: [
        /* @__PURE__ */ u2(Icon, { n: "plus" }),
        tabs.length < 2 && /* @__PURE__ */ u2("span", { children: "New tab" })
      ] }),
      menu && /* @__PURE__ */ u2("div", { class: "pt-menu", ref: on3.menu, children: [
        /* @__PURE__ */ u2("a", { "data-tabhome": "", onClick: on3.home, children: [
          /* @__PURE__ */ u2(Icon, { n: "home" }),
          " Home"
        ] }),
        recents.length > 0 && /* @__PURE__ */ u2("h6", { children: "Recent" }),
        recents.map((r2) => /* @__PURE__ */ u2("a", { "data-tabnew": r2.ref, onClick: () => on3.fresh(r2.ref), children: [
          /* @__PURE__ */ u2("span", { class: `rc-i ${r2.state}`, children: /* @__PURE__ */ u2(Icon, { n: r2.icon }) }),
          /* @__PURE__ */ u2("span", { class: "pt-mt", children: [
            /* @__PURE__ */ u2("i", { children: r2.ref }),
            " ",
            r2.title
          ] })
        ] })),
        closedFirst !== null && /* @__PURE__ */ u2(S2, { children: [
          /* @__PURE__ */ u2("h6", { children: "Closed" }),
          /* @__PURE__ */ u2("a", { "data-tabreopen": "", onClick: on3.reopen, children: [
            /* @__PURE__ */ u2(Icon, { n: "clock" }),
            " Reopen ",
            closedFirst,
            " ",
            /* @__PURE__ */ u2("kbd", { children: "\u2318\u21E7T" })
          ] })
        ] })
      ] })
    ] });
  }

  // src/components/Toolbar.tsx
  var NL2 = "\n  ";
  function Toolbar(p2) {
    const label = p2.profile ? p2.profile.name || p2.profile.login : "";
    return /* @__PURE__ */ u2("header", { class: "toolbar", "data-tauri-drag-region": "", children: [
      NL2,
      /* @__PURE__ */ u2("button", { class: "tb-btn nav-btn", id: "navbtn", onClick: p2.on.nav, title: "Show or hide the sidebar", children: /* @__PURE__ */ u2(Icon, { n: "three-bars" }) }),
      /* @__PURE__ */ u2("div", { class: "tb-group", children: [
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "back", onClick: p2.on.back, disabled: !p2.canBack, title: "Back (\u2318[)", children: /* @__PURE__ */ u2(Icon, { n: "chevron-left" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "fwd", onClick: p2.on.fwd, disabled: !p2.canFwd, title: "Forward (\u2318])", children: /* @__PURE__ */ u2(Icon, { n: "chevron-right" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "reload", onClick: p2.on.reload, disabled: !p2.hasBundle, title: "Reload (\u2318R)", children: /* @__PURE__ */ u2(Icon, { n: "sync" }) })
      ] }),
      NL2,
      /* @__PURE__ */ u2("form", { id: "addr", class: "addr", onSubmit: p2.on.addr, children: [
        /* @__PURE__ */ u2(Icon, { n: "search" }),
        /* @__PURE__ */ u2("input", { id: "addrinput", value: p2.prRef, placeholder: "Open a pull request: owner/repo#123 or URL  (\u2318L)", spellcheck: false, autocomplete: "off" })
      ] }),
      p2.update && /* @__PURE__ */ u2("button", { class: "upd", id: "upd", onClick: p2.on.upd, title: "Download and install the new version, then restart", children: [
        /* @__PURE__ */ u2(Icon, { n: "sync" }),
        " ",
        p2.update.busy ? "Updating\u2026" : "Update to v" + p2.update.version
      ] }),
      NL2,
      /* @__PURE__ */ u2("div", { class: "tb-group", children: [
        /* @__PURE__ */ u2("button", { class: `tb-btn off-ind ${p2.offline ? "on" : ""}`, id: "retry", onClick: p2.on.retry, "data-tip": "Offline \u2014 can't reach GitHub. Showing the saved copy. Click to retry.", "aria-label": "Offline, click to retry", tabindex: p2.offline ? 0 : -1, children: /* @__PURE__ */ u2(Icon, { n: "alert" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "external", onClick: p2.on.external, disabled: !p2.hasBundle, title: "Open on github.com", children: /* @__PURE__ */ u2(Icon, { n: "link-external" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "newprbtn", onClick: p2.on.newPr, title: "New pull request", children: /* @__PURE__ */ u2(Icon, { n: "plus" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn", id: "inboxbtn", onClick: p2.on.inbox, title: "Inbox: PRs that need you", children: /* @__PURE__ */ u2(Icon, { n: "checklist" }) }),
        /* @__PURE__ */ u2("button", { class: "tb-btn bell", id: "bell", onClick: p2.on.bell, title: "Notifications", children: [
          /* @__PURE__ */ u2(Icon, { n: "bell" }),
          p2.unread > 0 && /* @__PURE__ */ u2("i", { class: "dot", children: p2.unread })
        ] }),
        /* @__PURE__ */ u2("button", { class: `theme-sw${p2.dark ? " dark" : ""}`, id: "mode", onClick: p2.on.mode, role: "switch", "aria-checked": p2.dark, title: `Switch to ${p2.dark ? "light" : "dark"} mode`, children: [
          /* @__PURE__ */ u2("i", { class: "st" }),
          /* @__PURE__ */ u2("i", { class: "st s2" }),
          /* @__PURE__ */ u2("i", { class: "st s3" }),
          /* @__PURE__ */ u2("i", { class: "cl" }),
          /* @__PURE__ */ u2("i", { class: "cl c2" }),
          /* @__PURE__ */ u2("span", { class: "knob", children: [
            /* @__PURE__ */ u2("b", { class: "cr" }),
            /* @__PURE__ */ u2("b", { class: "cr c2" }),
            /* @__PURE__ */ u2("b", { class: "cr c3" })
          ] })
        ] }),
        p2.hasToken && p2.profile ? /* @__PURE__ */ u2("button", { class: "prof-btn", id: "profbtn", onClick: p2.on.prof, title: `${label} \u2014 account menu`, children: [
          /* @__PURE__ */ u2("img", { src: p2.avatar, alt: "" }),
          /* @__PURE__ */ u2("span", { children: label }),
          /* @__PURE__ */ u2(Icon, { n: "chevron-down", s: 12 })
        ] }) : /* @__PURE__ */ u2("button", { class: "tb-btn", id: "signin", onClick: p2.on.signin, title: "Access token", children: /* @__PURE__ */ u2(Icon, { n: "key" }) })
      ] })
    ] });
  }

  // src/app/render.ts
  var go = (n2) => {
    const t2 = S.hi + n2;
    if (t2 < 0 || t2 >= S.hist.length) return;
    S.hi = t2;
    S.hist[t2].startsWith("repo:") ? openRepo(S.hist[t2].slice(5), { nav: true }) : openPr(S.hist[t2], { nav: true });
  };

  // src/app/top.tsx
  var keep2 = (fn) => {
    S.keepScroll = true;
    fn();
    render();
    S.keepScroll = false;
  };
  var mode = (e2) => {
    const btn = e2.currentTarget, r2 = btn.getBoundingClientRect(), x2 = r2.left + r2.width / 2, y2 = r2.top + r2.height / 2;
    S.mode = isDark() ? "light" : "dark";
    localStorage.setItem("mode", S.mode);
    const swap = () => {
      applyMode();
      btn.classList.toggle("dark", isDark());
      btn.setAttribute("aria-checked", String(isDark()));
      btn.title = `Switch to ${isDark() ? "light" : "dark"} mode`;
    };
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
    if (!document.startViewTransition) {
      swap();
      return;
    }
    const end = Math.hypot(Math.max(x2, innerWidth - x2), Math.max(y2, innerHeight - y2));
    document.documentElement.classList.add("vt");
    document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x2}px ${y2}px)`, `circle(${end}px at ${x2}px ${y2}px)`] }, { duration: 750, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }).finished.finally(() => document.documentElement.classList.remove("vt")));
  };
  var prof = (e2) => {
    e2.stopPropagation();
    const had = $(".prof-pop");
    $(".react-pop")?.remove();
    if (had) return;
    const pr = S.profile, pop = document.createElement("div");
    pop.className = "react-pop cm-pop prof-pop";
    pop.innerHTML = `<div class="pp-h"><img src="${esc(avUrl(pr.avatar_url, 80))}" alt=""><div><b>${esc(pr.name || pr.login)}</b><i>@${esc(pr.login)}</i></div></div><button data-h="profile">${icon("link-external")} Your GitHub profile</button><button data-h="token">${icon("key")} Access token\u2026</button><button data-h="out" class="danger">Sign out</button>`;
    const r2 = e2.currentTarget.getBoundingClientRect();
    pop.style.right = Math.max(8, innerWidth - r2.right) + "px";
    pop.style.top = r2.bottom + 6 + "px";
    pop.onclick = async (ev) => {
      const h2 = ev.target.closest("[data-h]")?.dataset.h;
      if (!h2) return;
      pop.remove();
      if (h2 === "profile") openExternal(pr.html_url);
      else if (h2 === "token") tokenDialog();
      else {
        try {
          await tauri?.invoke("set_token", { token: "" });
        } catch {
        }
        S.hasToken = false;
        S.profile = null;
        S.me = "";
        S.repos = null;
        try {
          localStorage.removeItem("profile");
        } catch {
        }
        render();
      }
    };
    document.body.appendChild(pop);
    setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }));
  };
  var tb = {
    nav: (e2) => {
      e2.stopPropagation();
      if (matchMedia("(min-width: 901px)").matches) {
        S.hide.nav = !S.hide.nav;
        try {
          localStorage.setItem("hide", JSON.stringify(S.hide));
        } catch {
        }
        $(".shell")?.classList.toggle("nav-hidden", S.hide.nav);
        return;
      }
      keep2(() => {
        S.nav = !S.nav;
      });
    },
    back: () => go(-1),
    fwd: () => go(1),
    reload,
    external: () => openExternal(S.bundle.pull.html_url),
    mode,
    addr: (e2) => {
      e2.preventDefault();
      openPr($("#addrinput").value);
      $("#addrinput").blur();
    },
    upd: async () => {
      const u3 = S.update;
      if (!u3 || u3.busy) return;
      u3.busy = true;
      render();
      try {
        await u3.obj.downloadAndInstall();
        await window.__TAURI__.process.relaunch();
      } catch (e2) {
        u3.busy = false;
        S.actErr = { k: "update", m: "Update failed: " + String(e2) };
        render();
      }
    },
    retry: (ev) => {
      setBusy(ev.currentTarget, true);
      S.offline = navigator.onLine === false;
      reload();
    },
    newPr: () => openNewPr(),
    inbox: openInbox,
    bell: (e2) => {
      e2.stopPropagation();
      setBell(!S.bell);
    },
    signin: tokenDialog,
    prof
  };
  var tabDown = (e2, from) => {
    const el = e2.currentTarget;
    if (e2.button !== 0 || e2.target.closest(".pt-x")) return;
    const x0 = e2.clientX;
    let moved = false, to = from;
    const strip = el.parentElement, tabs = [...strip.querySelectorAll(".ptab")];
    const mv = (ev) => {
      if (!moved && Math.abs(ev.clientX - x0) < 6) return;
      if (!moved) {
        moved = true;
        el.classList.add("drag");
        document.body.classList.add("dragging");
      }
      el.style.transform = `translateX(${ev.clientX - x0}px)`;
      to = tabs.reduce((best, t2, i2) => {
        const r2 = t2.getBoundingClientRect();
        return ev.clientX > r2.left + r2.width / 2 ? i2 : best;
      }, 0);
      tabs.forEach((t2, i2) => {
        if (t2 !== el) t2.style.transform = from < to && i2 > from && i2 <= to ? `translateX(-${el.offsetWidth}px)` : from > to && i2 < from && i2 >= to ? `translateX(${el.offsetWidth}px)` : "";
      });
    };
    const up = () => {
      removeEventListener("mousemove", mv);
      removeEventListener("mouseup", up);
      document.body.classList.remove("dragging");
      if (!moved) return;
      el.addEventListener("click", (c2) => c2.stopImmediatePropagation(), { capture: true, once: true });
      if (to !== from) {
        const [t2] = S.tabs.splice(from, 1);
        S.tabs.splice(to, 0, t2);
        saveTabs();
      }
      render();
    };
    addEventListener("mousemove", mv);
    addEventListener("mouseup", up);
  };
  var ts = {
    open: (i2) => {
      const t2 = S.tabs[i2];
      if (t2.ref !== curRef()) {
        if (fastTab(t2.ref)) return;
        stashCurrent();
        tabSnap();
        S.fadeMain = true;
        S.tabMenu = false;
        openPr(t2.ref, { nav: true, restore: t2.tab });
      }
    },
    aux: (e2, i2) => {
      if (e2.button === 1) {
        e2.preventDefault();
        closeTab(i2);
      }
    },
    down: tabDown,
    close: (e2, i2) => {
      e2.stopPropagation();
      closeTab(i2);
    },
    add: (e2) => {
      e2.stopPropagation();
      S.tabMenu = !S.tabMenu;
      rerender();
    },
    fresh: (ref) => openFromList(ref, true),
    home: () => {
      S.tabMenu = false;
      S.view = "home";
      render();
    },
    reopen: () => {
      S.tabMenu = false;
      reopenTab();
    },
    menu: (m2) => {
      const a2 = $("#tabadd");
      if (m2 && a2) {
        const r2 = a2.getBoundingClientRect();
        m2.style.top = r2.bottom + 4 + "px";
        m2.style.left = Math.min(r2.left, innerWidth - 350) + "px";
        m2.style.marginTop = "0";
      }
    }
  };
  function Top() {
    const b2 = S.bundle, pr = S.profile, open2 = new Set(S.tabs.map((t2) => t2.ref));
    return /* @__PURE__ */ u2(S2, { children: [
      S.refreshing && /* @__PURE__ */ u2("div", { class: "refreshing-bar" }),
      /* @__PURE__ */ u2(
        Toolbar,
        {
          prRef: b2 ? `${b2.pull.base.repo.full_name}#${b2.pull.number}` : "",
          hasBundle: !!b2,
          canBack: !(S.hist.length < 2 || S.hi < 1),
          canFwd: !(S.hi >= S.hist.length - 1),
          update: S.update ? { busy: S.update.busy, version: S.update.version } : null,
          offline: isOff(),
          unread: S.notes.filter((n2) => !n2.read).length,
          dark: isDark(),
          profile: pr,
          hasToken: S.hasToken,
          avatar: S.hasToken && pr ? avUrl(pr.avatar_url, 56) : "",
          on: tb
        }
      ),
      /* @__PURE__ */ u2(TabStrip, { tabs: S.tabs, cur: S.tabPending || curRef(), recents: S.recent.filter((r2) => !open2.has(r2.ref)).slice(0, 8), menu: S.tabMenu, closedFirst: S.closed.length ? S.closed[0].ref : null, on: ts })
    ] });
  }
  var paintTop = (host) => R(/* @__PURE__ */ u2(Top, {}), host);
  var clearTop = (host) => R(null, host);

  // src/app/notes.tsx
  function paintNotes() {
    const h2 = $("#notehost");
    if (!h2) return;
    R(/* @__PURE__ */ u2(NotePanel, { open: S.bell, rows: S.notes.map((n2) => ({ id: n2.id, ref: n2.ref, target: n2.target || "", read: !!n2.read, title: n2.title, text: n2.text, when: whenParts(n2.at).text })), on: noteOn }), h2);
  }
  function setBell(open2) {
    S.bell = open2;
    if (!open2 && S.notes.some((n2) => !n2.read)) {
      S.notes.forEach((n2) => {
        n2.read = true;
      });
      saveNotes();
      const top = $("#top");
      if (top) paintTop(top);
    }
    paintNotes();
  }
  var keepRender = () => {
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var row = (e2) => e2.currentTarget;
  function noteAll() {
    S.bell = false;
    S.view = "notes";
    S.nav = false;
    render();
  }
  function noteClear() {
    S.notes = [];
    localStorage.setItem("notes", "[]");
    keepRender();
  }
  function noteOpen(e2) {
    openClick(row(e2), e2);
    S.bell = false;
    S.notes.forEach((n2) => {
      n2.read = true;
    });
    saveNotes();
  }
  var noteOn = { all: noteAll, check: () => {
    pollNotes();
  }, clear: noteClear, open: noteOpen, aux: (e2) => openAux(row(e2), e2), ctx: (e2) => openCtx(row(e2), e2) };
  document.addEventListener("mousedown", (e2) => {
    if (!S.bell || e2.target.closest(".note-panel, #bell")) return;
    setBell(false);
  });
  document.addEventListener("keydown", (e2) => {
    if (e2.key === "Escape" && S.bell) setBell(false);
  });

  // src/components/Sidebar.tsx
  var cap = (s2) => s2[0].toUpperCase() + s2.slice(1);
  function SideTabs({ active, hasRepo, on: on3 }) {
    const cls = (t2) => active === t2 ? "on" : "";
    return /* @__PURE__ */ u2("div", { class: "sb-tabs", children: [
      /* @__PURE__ */ u2("button", { "data-side": "repos", class: cls("repos"), onClick: () => on3.side("repos"), children: "Repos" }),
      hasRepo && /* @__PURE__ */ u2("button", { "data-side": "prs", class: cls("prs"), onClick: () => on3.side("prs"), children: "PRs" }),
      /* @__PURE__ */ u2("button", { "data-side": "recent", class: cls("recent"), onClick: () => on3.side("recent"), children: "Recent" })
    ] });
  }
  function RcItem({ r: r2, on: on3 }) {
    return /* @__PURE__ */ u2("a", { class: `rc ${r2.on ? "on" : ""}`, "data-open": r2.ref, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
      /* @__PURE__ */ u2("span", { class: `rc-i ${r2.st}`, children: /* @__PURE__ */ u2(Icon, { n: r2.icon }) }),
      /* @__PURE__ */ u2("span", { class: "rc-t", children: [
        /* @__PURE__ */ u2("b", { children: r2.title }),
        /* @__PURE__ */ u2("i", { children: r2.sub })
      ] })
    ] });
  }
  function RecentList({ recent, curRef: curRef2, on: on3 }) {
    if (!recent.length) return /* @__PURE__ */ u2("div", { class: "sb-empty", children: "Pull requests you open appear here." });
    return /* @__PURE__ */ u2(S2, { children: recent.map((r2) => /* @__PURE__ */ u2("a", { class: `rc ${r2.ref === curRef2 ? "on" : ""}`, "data-open": r2.ref, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
      /* @__PURE__ */ u2("span", { class: `rc-i ${r2.state}`, children: /* @__PURE__ */ u2(Icon, { n: r2.icon }) }),
      /* @__PURE__ */ u2("span", { class: "rc-t", children: [
        /* @__PURE__ */ u2("b", { children: r2.title }),
        /* @__PURE__ */ u2("i", { children: r2.ref })
      ] }),
      /* @__PURE__ */ u2("button", { class: "rc-x", "data-rm": r2.ref, onClick: (e2) => on3.rm(e2, r2.ref), title: "Remove", children: /* @__PURE__ */ u2(Icon, { n: "x" }) })
    ] })) });
  }
  function RepoList({ repos, repo, filter, on: on3 }) {
    const f3 = filter.toLowerCase(), shown2 = repos.filter((r2) => r2.full_name.toLowerCase().includes(f3));
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("input", { class: "input sb-filter", id: "repofilter", placeholder: "Find a repository\u2026", value: filter, onInput: on3.repoFilter }),
      shown2.length ? shown2.map((r2) => /* @__PURE__ */ u2("a", { class: `rc ${repo === r2.full_name ? "on" : ""}`, "data-repo": r2.full_name, onClick: () => on3.repo(r2.full_name), children: [
        /* @__PURE__ */ u2("span", { class: `rc-i ${r2.private ? "closed" : ""}`, style: "color:var(--fgColor-muted)", children: /* @__PURE__ */ u2(Icon, { n: r2.private ? "lock" : "repo" }) }),
        /* @__PURE__ */ u2("span", { class: "rc-t", children: [
          /* @__PURE__ */ u2("b", { children: r2.full_name.split("/")[1] }),
          /* @__PURE__ */ u2("i", { children: r2.full_name.split("/")[0] })
        ] })
      ] })) : /* @__PURE__ */ u2("div", { class: "sb-empty", children: "No matches." })
    ] });
  }
  function Sel({ id, opts, v: v2, onChange }) {
    return /* @__PURE__ */ u2("select", { class: "input sb-sel", id, onChange, children: opts.map(([k2, t2]) => /* @__PURE__ */ u2("option", { value: k2, selected: k2 === v2, children: t2 })) });
  }
  function SideHead({ p: p2, on: on3 }) {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("div", { class: "sb-repo", children: [
        /* @__PURE__ */ u2("button", { class: "fold-btn", "data-side": "repos", title: "All repositories", onClick: () => on3.side("repos"), children: /* @__PURE__ */ u2(Icon, { n: "chevron-left" }) }),
        /* @__PURE__ */ u2("b", { title: p2.repo, children: p2.repo })
      ] }),
      /* @__PURE__ */ u2("div", { class: "seg sb-seg", children: ["open", "closed", "all"].map((s2) => /* @__PURE__ */ u2("button", { "data-sps": s2, class: p2.state === s2 ? "on" : "", onClick: () => on3.sps(s2), children: cap(s2) })) }),
      /* @__PURE__ */ u2("input", { class: "input sb-filter", id: "prfilter", placeholder: "Filter by title, #, author, label\u2026", value: p2.filter, onInput: on3.pf }),
      /* @__PURE__ */ u2("div", { class: "sb-ctl", children: [
        /* @__PURE__ */ u2("label", { children: [
          "Sort",
          /* @__PURE__ */ u2(Sel, { id: "prsort", opts: p2.sorts, v: p2.sort, onChange: on3.psort })
        ] }),
        /* @__PURE__ */ u2("label", { children: [
          "Group",
          /* @__PURE__ */ u2(Sel, { id: "prgroup", opts: p2.groups, v: p2.group, onChange: on3.pgroup })
        ] })
      ] })
    ] });
  }
  function PrGroups({ groups, on: on3 }) {
    return /* @__PURE__ */ u2(S2, { children: groups.map((g2) => /* @__PURE__ */ u2("div", { class: `pg${g2.folded}`, children: [
      /* @__PURE__ */ u2("div", { class: "pg-h", "data-fold": g2.key, onClick: (e2) => on3.fold(e2, g2.key), children: [
        /* @__PURE__ */ u2(Icon, { n: g2.closed ? "chevron-right" : "chevron-down" }),
        /* @__PURE__ */ u2("span", { children: g2.name }),
        /* @__PURE__ */ u2("i", { children: g2.rows.length })
      ] }),
      /* @__PURE__ */ u2("div", { class: "pg-b", children: g2.rows.map((r2) => /* @__PURE__ */ u2(RcItem, { r: r2, on: on3 })) })
    ] })) });
  }
  function Sidebar({ sideTab, hasRepo, hasToken, on: on3, children }) {
    return /* @__PURE__ */ u2("aside", { class: "sidebar", children: [
      /* @__PURE__ */ u2(SideTabs, { active: sideTab, hasRepo, on: on3 }),
      /* @__PURE__ */ u2("div", { class: "sb-list", children }),
      /* @__PURE__ */ u2("div", { class: "sb-foot", children: hasToken ? "Signed in with token" : "Anonymous \xB7 60 requests/hour" })
    ] });
  }

  // src/components/Home.tsx
  var cap2 = (s2) => s2[0].toUpperCase() + s2.slice(1);
  function Banners({ items, on: on3 }) {
    return /* @__PURE__ */ u2(S2, { children: items.map((p2) => /* @__PURE__ */ u2("div", { class: "push-banner", children: [
      I2("git-branch"),
      /* @__PURE__ */ u2("span", { children: [
        /* @__PURE__ */ u2("b", { children: p2.branch }),
        " had recent pushes ",
        p2.ago,
        p2.showRepo ? /* @__PURE__ */ u2(S2, { children: [
          " ",
          /* @__PURE__ */ u2("i", { children: [
            "\xB7 ",
            p2.repo
          ] })
        ] }) : ""
      ] }),
      /* @__PURE__ */ u2("span", { class: "sp" }),
      /* @__PURE__ */ u2("button", { class: "btn small primary", "data-compare": `${p2.repo}@${p2.branch}`, onClick: () => on3.compare(p2.repo, p2.branch), children: "Compare & pull request" }),
      /* @__PURE__ */ u2("button", { class: "push-x", "data-pdismiss": p2.key, onClick: () => on3.dismiss(p2.key), title: "Dismiss", children: I2("x") })
    ] })) });
  }
  function Card({ r: r2, on: on3 }) {
    return /* @__PURE__ */ u2("a", { class: "hm-card", "data-repo": r2.full, onClick: () => on3.repo(r2.full), children: [
      /* @__PURE__ */ u2("span", { class: "rc-i", style: "color:var(--fgColor-muted)", children: I2(r2.priv ? "lock" : "repo") }),
      /* @__PURE__ */ u2("span", { class: "hm-t", children: [
        /* @__PURE__ */ u2("b", { children: r2.name }),
        /* @__PURE__ */ u2("i", { children: [
          r2.owner,
          r2.archived ? " \xB7 archived" : "",
          r2.issues ? ` \xB7 ${r2.issues} open` : ""
        ] }),
        r2.desc ? /* @__PURE__ */ u2("em", { children: r2.desc }) : ""
      ] })
    ] });
  }
  function Opt({ v: v2, cur, t: t2 }) {
    return /* @__PURE__ */ u2("option", { value: v2, selected: cur === v2, children: t2 });
  }
  function Body({ b: b2, on: on3 }) {
    if (b2.kind === "addtoken") return /* @__PURE__ */ u2("div", { class: "diff-empty", children: [
      "Add an access token to list all your repositories and their pull requests.",
      /* @__PURE__ */ u2("br", {}),
      /* @__PURE__ */ u2("br", {}),
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "addtoken", onClick: on3.addToken, children: "Add token" })
    ] });
    if (b2.kind === "error") return /* @__PURE__ */ u2("div", { class: "diff-empty err", children: b2.text });
    if (b2.kind === "spinner") return /* @__PURE__ */ u2("div", { class: "spinner", style: "margin:48px auto", children: "Loading repositories\u2026" });
    if (b2.kind === "recent") {
      return /* @__PURE__ */ u2(S2, { children: [
        b2.hasAny ? /* @__PURE__ */ u2("div", { class: "hm-fbar", children: [
          /* @__PURE__ */ u2("input", { class: "input hm-filter", id: "hmrfilter", placeholder: "Filter by title or repo\u2026", value: b2.filter, onInput: on3.recentFilter }),
          /* @__PURE__ */ u2("div", { class: "seg-ctl", children: ["all", "open", "merged", "closed"].map((x2) => /* @__PURE__ */ u2("button", { class: b2.state === x2 ? "on" : "", "data-rstate": x2, onClick: () => on3.rstate(x2), children: cap2(x2) })) })
        ] }) : "",
        b2.cards.length ? /* @__PURE__ */ u2("div", { class: "hm-grid", children: b2.cards.map((r2) => /* @__PURE__ */ u2("a", { class: "hm-card", "data-open": r2.ref, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
          /* @__PURE__ */ u2("span", { class: `rc-i ${r2.state}`, children: I2(r2.icon) }),
          /* @__PURE__ */ u2("span", { class: "hm-t", children: [
            /* @__PURE__ */ u2("b", { children: r2.title }),
            /* @__PURE__ */ u2("i", { children: r2.ref })
          ] }),
          /* @__PURE__ */ u2("button", { class: "rc-x", "data-rm": r2.ref, onClick: (e2) => on3.rm(e2, r2.ref), title: "Remove", children: I2("x") })
        ] })) }) : /* @__PURE__ */ u2("div", { class: "diff-empty", children: b2.emptyText })
      ] });
    }
    const grid = b2.none ? /* @__PURE__ */ u2("div", { class: "diff-empty", children: "No matching repositories." }) : b2.groups ? /* @__PURE__ */ u2(S2, { children: b2.groups.map((g2) => /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("h3", { class: "hm-grp", children: [
        g2.owner,
        /* @__PURE__ */ u2("span", { children: g2.cards.length })
      ] }),
      /* @__PURE__ */ u2("div", { class: "hm-grid", children: g2.cards.map((r2) => /* @__PURE__ */ u2(Card, { r: r2, on: on3 })) })
    ] })) }) : /* @__PURE__ */ u2("div", { class: "hm-grid", children: b2.cards.map((r2) => /* @__PURE__ */ u2(Card, { r: r2, on: on3 })) });
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("div", { class: "hm-fbar", children: [
        /* @__PURE__ */ u2("input", { class: "input hm-filter", id: "hmfilter", placeholder: "Find a repository\u2026", value: b2.filter, onInput: on3.repoFilter }),
        /* @__PURE__ */ u2("div", { class: "seg-ctl", children: ["all", "public", "private"].map((x2) => /* @__PURE__ */ u2("button", { class: b2.vis === x2 ? "on" : "", "data-hvis": x2, onClick: () => on3.vis(x2), children: cap2(x2) })) }),
        /* @__PURE__ */ u2("select", { class: "input", id: "hmsort", title: "Sort", onChange: on3.sort, children: [
          /* @__PURE__ */ u2(Opt, { v: "pushed", cur: b2.sort, t: "Recently pushed" }),
          /* @__PURE__ */ u2(Opt, { v: "oldest", cur: b2.sort, t: "Least recently pushed" }),
          /* @__PURE__ */ u2(Opt, { v: "name", cur: b2.sort, t: "Name A\u2013Z" }),
          /* @__PURE__ */ u2(Opt, { v: "namez", cur: b2.sort, t: "Name Z\u2013A" }),
          /* @__PURE__ */ u2(Opt, { v: "owner", cur: b2.sort, t: "Owner A\u2013Z" }),
          /* @__PURE__ */ u2(Opt, { v: "ownerz", cur: b2.sort, t: "Owner Z\u2013A" }),
          /* @__PURE__ */ u2(Opt, { v: "issues", cur: b2.sort, t: "Most open issues" })
        ] }),
        /* @__PURE__ */ u2("select", { class: "input", id: "hmgroup", title: "Group", onChange: on3.group, children: [
          /* @__PURE__ */ u2(Opt, { v: "none", cur: b2.group, t: "No grouping" }),
          /* @__PURE__ */ u2(Opt, { v: "owner", cur: b2.group, t: "Group by owner" })
        ] })
      ] }),
      grid
    ] });
  }
  function Home({ p: p2, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "notes-page hm-page", children: [
      /* @__PURE__ */ u2("div", { class: "np-head", children: /* @__PURE__ */ u2("h1", { children: [
        I2("home"),
        SP,
        p2.owner || "Home"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u2("p", { class: "hm-hint", children: [
        "Open a pull request: type ",
        /* @__PURE__ */ u2("code", { children: "owner/repo#123" }),
        " or paste a URL in the bar above."
      ] }),
      p2.banners.length ? /* @__PURE__ */ u2("div", { class: "push-wrap", children: /* @__PURE__ */ u2(Banners, { items: p2.banners, on: on3 }) }) : "",
      p2.err ? /* @__PURE__ */ u2("div", { class: "err", children: p2.err }) : "",
      /* @__PURE__ */ u2("div", { class: "np-tabs", children: [
        /* @__PURE__ */ u2("button", { class: p2.tab === "repos" ? "sel" : "", "data-htab": "repos", onClick: () => on3.tab("repos"), children: [
          I2("repo"),
          " Repositories",
          p2.repoCount !== null ? /* @__PURE__ */ u2("span", { children: p2.repoCount }) : ""
        ] }),
        /* @__PURE__ */ u2("button", { class: p2.tab === "recent" ? "sel" : "", "data-htab": "recent", onClick: () => on3.tab("recent"), children: [
          I2("clock"),
          " Recent",
          /* @__PURE__ */ u2("span", { children: p2.recentCount })
        ] })
      ] }),
      /* @__PURE__ */ u2(Body, { b: p2.body, on: on3 })
    ] });
  }

  // src/components/PrList.tsx
  var cap3 = (s2) => s2[0].toUpperCase() + s2.slice(1);
  function Opts({ arr, v: v2, all }) {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("option", { value: "", children: all }),
      arr.map((x2) => /* @__PURE__ */ u2("option", { value: x2, selected: x2 === v2, children: x2 }))
    ] });
  }
  function FilterBar({ p: p2, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "prl-filters", children: [
      /* @__PURE__ */ u2("span", { class: "pf-search", children: [
        I2("search"),
        /* @__PURE__ */ u2("input", { class: "input", id: "mainfilter", placeholder: "Filter by title, #, author, branch, label\u2026", value: p2.filter, spellcheck: false, onInput: on3.filter })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("select", { class: "input", id: "pfauthor", onChange: on3.author, children: /* @__PURE__ */ u2(Opts, { arr: p2.authors, v: p2.author, all: "Author: all" }) }),
      "\n  ",
      /* @__PURE__ */ u2("select", { class: "input", id: "pflabel", onChange: on3.label, children: /* @__PURE__ */ u2(Opts, { arr: p2.labels, v: p2.label, all: "Label: all" }) }),
      "\n  ",
      /* @__PURE__ */ u2("select", { class: "input", id: "pfstatus", onChange: on3.status, children: [
        /* @__PURE__ */ u2("option", { value: "", children: "Status: any" }),
        p2.statuses.map(([k2, t2]) => /* @__PURE__ */ u2("option", { value: k2, selected: k2 === p2.status, children: t2 }))
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("select", { class: "input", id: "pfsort", onChange: on3.sort, children: p2.sorts.map(([k2, t2]) => /* @__PURE__ */ u2("option", { value: k2, selected: k2 === p2.sort, children: [
        "Sort: ",
        t2
      ] })) }),
      "\n  ",
      /* @__PURE__ */ u2("span", { class: "pf-count", children: [
        p2.n,
        " of ",
        p2.total
      ] }),
      p2.active ? /* @__PURE__ */ u2("button", { class: "btn", id: "pfclear", onClick: on3.clear, children: "Clear" }) : ""
    ] });
  }
  function PrListPage({ p: p2, on: on3 }) {
    const body = p2.err ? /* @__PURE__ */ u2("div", { class: "err", style: "padding:16px", children: p2.err }) : p2.loading ? /* @__PURE__ */ u2("div", { class: "spinner", style: "margin:48px auto", children: "Loading pull requests\u2026" }) : p2.rows && p2.rows.length ? /* @__PURE__ */ u2(S2, { children: p2.rows.map((r2) => /* @__PURE__ */ u2("a", { class: "prl-row", "data-open": r2.ref, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
      /* @__PURE__ */ u2("span", { class: `rc-i ${r2.st}`, children: I2(r2.icon) }),
      /* @__PURE__ */ u2("span", { class: "prl-main", children: [
        /* @__PURE__ */ u2("b", { children: r2.title }),
        r2.labels.map((l2) => /* @__PURE__ */ u2("span", { class: "pill-label", style: `background:#${l2.color}33;color:#${l2.color};border-color:#${l2.color};margin:0 0 0 4px`, children: l2.name })),
        /* @__PURE__ */ u2("i", { children: r2.meta })
      ] }),
      /* @__PURE__ */ u2("img", { src: `${r2.avatar}&s=40`, width: 20, height: 20, style: "border-radius:50%" })
    ] })) }) : /* @__PURE__ */ u2("div", { class: "diff-empty", children: p2.empty });
    return /* @__PURE__ */ u2("div", { class: "pr-page", children: [
      /* @__PURE__ */ u2("div", { class: "repoline", style: "padding-bottom:16px" }),
      /* @__PURE__ */ u2(Banners, { items: p2.banners, on: on3 }),
      /* @__PURE__ */ u2("div", { class: "prl", children: [
        /* @__PURE__ */ u2("div", { class: "prl-head", children: [
          /* @__PURE__ */ u2("div", { children: [
            /* @__PURE__ */ u2("span", { class: "repo-ic", children: I2("repo", 16) }),
            SP,
            /* @__PURE__ */ u2("b", { children: p2.repo })
          ] }),
          /* @__PURE__ */ u2("div", { class: "seg", children: ["open", "closed", "all"].map((s2) => /* @__PURE__ */ u2("button", { "data-ps": s2, class: p2.state === s2 ? "on" : "", onClick: () => on3.ps(s2), children: cap3(s2) })) })
        ] }),
        p2.filterBar ? /* @__PURE__ */ u2(FilterBar, { p: p2.filterBar, on: on3 }) : null,
        body
      ] })
    ] });
  }
  function Crumbs({ repo, trail, extra, extraNode, on: on3 }) {
    const homeCur = !repo && !trail.length;
    const parts = [homeCur ? /* @__PURE__ */ u2("span", { class: "crumb cur home", children: [
      I2("home", 14),
      /* @__PURE__ */ u2("span", { children: "Home" })
    ] }) : /* @__PURE__ */ u2("a", { class: "crumb", "data-home": "1", onClick: on3 && on3.home, title: "Home", children: [
      I2("home", 14),
      /* @__PURE__ */ u2("span", { children: "Home" })
    ] })];
    if (repo) {
      const [owner, name] = repo.split("/");
      parts.push(/* @__PURE__ */ u2("span", { class: "crumb-grp", children: [
        /* @__PURE__ */ u2("a", { class: "crumb", "data-owner": owner, onClick: on3 && (() => on3.owner(owner)), title: `Repositories of ${owner}`, children: owner }),
        /* @__PURE__ */ u2("span", { class: "crumb-slash", children: "/" }),
        /* @__PURE__ */ u2("a", { class: "crumb strong", "data-repo": repo, onClick: on3 && (() => on3.repo(repo)), title: `All pull requests in ${repo}`, children: name })
      ] }));
    }
    trail.forEach((t2, i2) => parts.push(i2 === trail.length - 1 ? /* @__PURE__ */ u2("span", { class: "crumb cur", children: t2.t }) : /* @__PURE__ */ u2("a", { class: "crumb", "data-repo": t2.repo || void 0, onClick: on3 && t2.repo ? (() => on3.repo(t2.repo)) : void 0, children: t2.t })));
    return /* @__PURE__ */ u2("nav", { class: "repoline crumbs", "aria-label": "Breadcrumb", children: [
      parts.map((x2, i2) => /* @__PURE__ */ u2(S2, { children: [
        i2 ? /* @__PURE__ */ u2("span", { class: "crumb-sep", children: I2("chevron-right", 12) }) : "",
        x2
      ] })),
      extra ? Raw(extra) : null,
      extraNode
    ] });
  }

  // src/app/prlist.ts
  var PSORT = { updated: "Recently updated", created: "Newest", oldest: "Oldest", number: "Number", title: "Title A\u2013Z", author: "Author" };
  var PGROUP = { none: "No grouping", status: "Status", author: "Author", label: "Label", base: "Base branch" };
  var prStatus = (p2) => p2.merged_at ? "merged" : p2.state === "closed" ? "closed" : p2.draft ? "draft" : "open";
  var PICON = { open: "git-pull-request", draft: "git-pull-request-draft", merged: "git-merge", closed: "git-pull-request-closed" };
  function prFiltered() {
    const f3 = S.pf.toLowerCase();
    const list = (S.prs || []).filter((p2) => (!f3 || `#${p2.number} ${p2.title} ${p2.user.login} ${p2.head?.ref || ""} ${(p2.labels || []).map((l2) => l2.name).join(" ")}`.toLowerCase().includes(f3)) && (!S.pAuthor || p2.user.login === S.pAuthor) && (!S.pLabel || (p2.labels || []).some((l2) => l2.name === S.pLabel)) && (!S.pStatus || prStatus(p2) === S.pStatus));
    const cmps = { updated: (a2, b2) => b2.updated_at.localeCompare(a2.updated_at), created: (a2, b2) => b2.created_at.localeCompare(a2.created_at), oldest: (a2, b2) => a2.created_at.localeCompare(b2.created_at), number: (a2, b2) => b2.number - a2.number, title: (a2, b2) => a2.title.localeCompare(b2.title), author: (a2, b2) => a2.user.login.localeCompare(b2.user.login) || b2.number - a2.number };
    return list.sort(cmps[S.psort]);
  }
  function prFilterBar() {
    if (!S.prs) return null;
    const authors = [...new Set(S.prs.map((p2) => p2.user.login))].sort((a2, b2) => a2.localeCompare(b2));
    const labels = [...new Set(S.prs.flatMap((p2) => (p2.labels || []).map((l2) => l2.name)))].sort((a2, b2) => a2.localeCompare(b2));
    return {
      filter: S.pf,
      authors,
      labels,
      author: S.pAuthor,
      label: S.pLabel,
      status: S.pStatus ?? "",
      statuses: Object.entries({ open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }),
      sort: S.psort,
      sorts: Object.entries(PSORT),
      n: prFiltered().length,
      total: S.prs.length,
      active: !!(S.pf || S.pAuthor || S.pLabel || S.pStatus)
    };
  }
  function prListProps() {
    const rows = S.error || !S.prs ? null : prFiltered().map((p2) => {
      const st = p2.merged_at ? ["merged", "git-merge"] : p2.state === "closed" ? ["closed", "git-pull-request-closed"] : p2.draft ? ["draft", "git-pull-request-draft"] : ["open", "git-pull-request"];
      return { ref: `${S.repo}#${p2.number}`, st: st[0], icon: st[1], title: p2.title, labels: p2.labels || [], meta: `#${p2.number} ${p2.merged_at ? "merged" : p2.state === "closed" ? "closed" : "opened"} ${when(p2.merged_at || p2.closed_at || p2.created_at).replace(/<\/?span[^>]*>/g, "")} by ${p2.user.login}`, avatar: p2.user.avatar_url ?? "" };
    });
    return { repo: S.repo, state: S.prState, banners: pushBannerItems(S.repo), filterBar: prFilterBar(), rows, err: S.error ? String(S.error) : "", loading: !S.error && !S.prs, empty: S.prs?.length ? "No pull requests match the filters." : "No pull requests." };
  }

  // src/app/side.tsx
  var typed = (e2, key, id) => {
    const t2 = e2.target;
    S[key] = t2.value;
    const p2 = t2.selectionStart;
    render();
    const n2 = $("#" + id);
    n2.focus();
    n2.setSelectionRange(p2, p2);
  };
  var on = {
    side: (tab) => {
      S.sideTab = tab;
      render();
    },
    sps: (state) => {
      S.prState = state;
      loadPrs();
    },
    pf: (e2) => typed(e2, "pf", "prfilter"),
    psort: (e2) => {
      S.psort = e2.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    },
    pgroup: (e2) => {
      S.pgroup = e2.target.value;
      localStorage.setItem("pgroup", S.pgroup);
      render();
    },
    repoFilter: (e2) => typed(e2, "repoFilter", "repofilter"),
    repo: (name) => openRepo(name),
    addToken: tokenDialog,
    open: openClick,
    aux: openAux,
    ctx: openCtx,
    rm: rmRecent,
    // Folding only flips state: the sidebar repaints itself and any copy of the block in the page is updated in place.
    fold: (e2, k2) => {
      e2.stopPropagation();
      const now = !isFolded(k2), els = qa("[data-fold]").filter((x2) => x2.dataset.fold === k2 && !x2.closest("#side"));
      S.fold[k2] = now;
      localStorage.setItem("fold", JSON.stringify(S.fold));
      els.forEach((x2) => {
        const box = x2.closest(".fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane");
        if (box) box.classList.toggle("folded", now);
        const svg = $("svg", x2);
        if (svg) svg.outerHTML = icon(now ? "chevron-right" : "chevron-down");
      });
      repaintSide();
    }
  };
  function PrRows() {
    const cur = S.bundle && S.view === "pr" ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
    const f3 = S.pf.toLowerCase();
    const head2 = { repo: S.repo, state: S.prState, filter: S.pf, sort: S.psort, group: S.pgroup, sorts: Object.entries(PSORT), groups: Object.entries(PGROUP) };
    const header = /* @__PURE__ */ u2(SideHead, { p: head2, on });
    if (!S.prs) return /* @__PURE__ */ u2(S2, { children: [
      header,
      /* @__PURE__ */ u2("div", { class: "sb-empty", children: "Loading pull requests\u2026" })
    ] });
    const list = S.prs.filter((p2) => !f3 || `#${p2.number} ${p2.title} ${p2.user.login} ${p2.head?.ref || ""} ${(p2.labels || []).map((l2) => l2.name).join(" ")}`.toLowerCase().includes(f3));
    const sorts = { updated: (a2, b2) => b2.updated_at.localeCompare(a2.updated_at), created: (a2, b2) => b2.created_at.localeCompare(a2.created_at), oldest: (a2, b2) => a2.created_at.localeCompare(b2.created_at), number: (a2, b2) => b2.number - a2.number, title: (a2, b2) => a2.title.localeCompare(b2.title), author: (a2, b2) => a2.user.login.localeCompare(b2.user.login) || b2.number - a2.number };
    list.sort(sorts[S.psort]);
    const row2 = (p2) => {
      const st = prStatus(p2), ref = `${S.repo}#${p2.number}`;
      return { ref, on: ref === cur, st, icon: PICON[st], title: p2.title, sub: `#${p2.number} \xB7 ${p2.user.login} \xB7 ${when(p2.updated_at).replace(/<\/?span[^>]*>/g, "")}` };
    };
    if (!list.length) return /* @__PURE__ */ u2(S2, { children: [
      header,
      /* @__PURE__ */ u2("div", { class: "sb-empty", children: S.pf ? "No matches." : "No pull requests." })
    ] });
    if (S.pgroup === "none") return /* @__PURE__ */ u2(S2, { children: [
      header,
      /* @__PURE__ */ u2("div", { class: "sb-count", children: [
        list.length,
        " pull request",
        list.length === 1 ? "" : "s"
      ] }),
      list.map((p2) => /* @__PURE__ */ u2(RcItem, { r: row2(p2), on }))
    ] });
    const groups = /* @__PURE__ */ new Map(), put = (k2, p2) => (groups.get(k2) || groups.set(k2, []).get(k2)).push(p2);
    list.forEach((p2) => {
      if (S.pgroup === "status") put({ open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }[prStatus(p2)], p2);
      else if (S.pgroup === "author") put(p2.user.login, p2);
      else if (S.pgroup === "base") put(p2.base?.ref || "\u2014", p2);
      else if ((p2.labels || []).length) p2.labels.forEach((l2) => put(l2.name, p2));
      else put("No label", p2);
    });
    const order = S.pgroup === "status" ? ["Open", "Draft", "Merged", "Closed"] : [...groups.keys()].sort((a2, b2) => +(a2 === "No label") - +(b2 === "No label") || a2.localeCompare(b2));
    return /* @__PURE__ */ u2(S2, { children: [
      header,
      /* @__PURE__ */ u2(PrGroups, { on, groups: order.filter((k2) => groups.has(k2)).map((k2) => {
        const key = "pg:" + S.pgroup + ":" + k2;
        return { key, folded: folded(key), closed: isFolded(key), name: k2, rows: groups.get(k2).map(row2) };
      }) })
    ] });
  }
  function List() {
    if (S.sideTab === "prs" && S.repo) return /* @__PURE__ */ u2(PrRows, {});
    if (S.sideTab === "recent") return /* @__PURE__ */ u2(RecentList, { recent: S.recent, curRef: S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "", on });
    if (!S.hasToken) return /* @__PURE__ */ u2("div", { class: "sb-empty", children: [
      "Add an access token to list all your repositories and their pull requests.",
      /* @__PURE__ */ u2("br", {}),
      /* @__PURE__ */ u2("br", {}),
      /* @__PURE__ */ u2("button", { class: "sb-btn", id: "addtoken", onClick: on.addToken, children: "Add token" })
    ] });
    if (S.reposErr) return /* @__PURE__ */ u2("div", { class: "sb-empty err", children: S.reposErr });
    if (!S.repos) return /* @__PURE__ */ u2("div", { class: "sb-empty", children: "Loading repositories\u2026" });
    return /* @__PURE__ */ u2(RepoList, { repos: S.repos, repo: S.repo, filter: S.repoFilter, on });
  }
  function Side() {
    return /* @__PURE__ */ u2(Sidebar, { sideTab: S.sideTab, hasRepo: !!S.repo, hasToken: S.hasToken, on, children: /* @__PURE__ */ u2(List, {}) });
  }
  var paintSide = (host) => R(/* @__PURE__ */ u2(Side, {}), host);
  var repaintSide = () => {
    const h2 = $("#side");
    if (h2) paintSide(h2);
  };

  // src/app/bindwrite.ts
  function homeProps() {
    const tab = S.homeTab || "repos", owner = S.homeOwner || "";
    let body;
    if (tab === "recent") {
      const q3 = (S.recentFilter || "").toLowerCase(), st = S.recentState || "all";
      const list = S.recent.filter((r2) => (st === "all" || r2.state === st) && (!q3 || (r2.title + " " + r2.ref).toLowerCase().includes(q3)));
      body = { kind: "recent", filter: S.recentFilter || "", state: st, hasAny: S.recent.length > 0, cards: list.map((r2) => ({ ref: r2.ref, state: r2.state, icon: r2.icon, title: r2.title })), emptyText: S.recent.length ? "No matching pull requests." : "Pull requests you open appear here." };
    } else if (!S.hasToken) body = { kind: "addtoken" };
    else if (S.reposErr) body = { kind: "error", text: String(S.reposErr) };
    else if (!S.repos) body = { kind: "spinner" };
    else {
      const f3 = (S.repoFilter || "").toLowerCase();
      const vis = S.hmVis || "all", srt = S.hmSort || "pushed", grp = S.hmGroup || "none";
      let list = S.repos.filter((r2) => (!owner || r2.full_name.startsWith(owner + "/")) && r2.full_name.toLowerCase().includes(f3) && (vis === "all" || vis === "private" === !!r2.private));
      const nm = (r2) => r2.full_name.split("/")[1], pushed = (r2) => Date.parse(r2.pushed_at || "0") || 0;
      const sorters = { name: (a2, b2) => nm(a2).localeCompare(nm(b2)), namez: (a2, b2) => nm(b2).localeCompare(nm(a2)), issues: (a2, b2) => (b2.open_issues_count || 0) - (a2.open_issues_count || 0) || nm(a2).localeCompare(nm(b2)), oldest: (a2, b2) => pushed(a2) - pushed(b2), owner: (a2, b2) => a2.full_name.localeCompare(b2.full_name), ownerz: (a2, b2) => b2.full_name.split("/")[0].localeCompare(a2.full_name.split("/")[0]) || nm(a2).localeCompare(nm(b2)) };
      const sorter = sorters[srt];
      if (sorter) list = [...list].sort(sorter);
      const card = (r2) => ({ full: r2.full_name, name: r2.full_name.split("/")[1], owner: r2.full_name.split("/")[0], priv: !!r2.private, archived: !!r2.archived, issues: r2.open_issues_count || 0, desc: r2.description || "" });
      let groups = null;
      if (grp === "owner") {
        const by = /* @__PURE__ */ new Map();
        list.forEach((r2) => {
          const o2 = r2.full_name.split("/")[0];
          if (!by.has(o2)) by.set(o2, []);
          by.get(o2).push(r2);
        });
        groups = [...by].map(([o2, rs]) => ({ owner: o2, cards: rs.map(card) }));
      }
      body = { kind: "repos", filter: S.repoFilter || "", vis, sort: srt, group: grp, groups: list.length ? groups : null, cards: list.map(card), none: !list.length };
    }
    return { owner, tab, repoCount: S.repos ? S.repos.filter((r2) => !owner || r2.full_name.startsWith(owner + "/")).length : null, recentCount: S.recent.length, banners: pushBannerItems(), err: S.error ? String(S.error) : "", body };
  }

  // src/app/home.tsx
  var crumbs = {
    home: () => {
      S.view = "home";
      S.homeOwner = "";
      S.nav = false;
      render();
    },
    owner: (o2) => {
      S.view = "home";
      S.homeOwner = o2;
      S.homeTab = "repos";
      S.nav = false;
      render();
      if (S.hasToken && !S.repos) loadRepos();
    },
    repo: (r2) => openRepo(r2)
  };
  var on2 = {
    tab: (t2) => {
      S.homeTab = t2;
      render();
    },
    vis: (v2) => {
      S.hmVis = v2;
      render();
    },
    sort: (e2) => {
      S.hmSort = e2.target.value;
      render();
    },
    group: (e2) => {
      S.hmGroup = e2.target.value;
      render();
    },
    repoFilter: (e2) => {
      S.repoFilter = e2.target.value;
      render();
    },
    recentFilter: (e2) => {
      S.recentFilter = e2.target.value;
      render();
    },
    rstate: (s2) => {
      S.recentState = s2;
      render();
    },
    repo: (full) => openRepo(full),
    open: openClick,
    aux: openAux,
    ctx: openCtx,
    rm: rmRecent,
    addToken: tokenDialog,
    compare: (repo, br) => openNewPr(repo, br),
    dismiss: (key) => {
      pushDis[key] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    }
  };
  function HomeView() {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: "", trail: S.homeOwner ? [{ t: S.homeOwner }] : [], extra: "", on: crumbs }),
      /* @__PURE__ */ u2(Home, { p: homeProps(), on: on2 })
    ] });
  }

  // src/components/Pages.tsx
  function NotesPage({ f: f3, rows, unread, total, on: on3 }) {
    const tabs = [["all", "All", total], ["unread", "Unread", unread], ["read", "Read", total - unread]];
    return /* @__PURE__ */ u2("div", { class: "notes-page", children: [
      /* @__PURE__ */ u2("div", { class: "np-head", children: [
        /* @__PURE__ */ u2("h1", { children: [
          I2("bell"),
          SP,
          "Notifications"
        ] }),
        /* @__PURE__ */ u2("div", { class: "np-tools", children: [
          /* @__PURE__ */ u2("button", { class: "btn small", id: "npcheck", onClick: on3.check, children: "Check now" }),
          /* @__PURE__ */ u2("button", { class: "btn small", id: "npreadall", onClick: on3.readAll, disabled: !unread, children: "Mark all as read" }),
          /* @__PURE__ */ u2("button", { class: "btn small ghost", id: "npclear", onClick: on3.clear, disabled: !total, children: "Clear all" })
        ] })
      ] }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: "np-tabs", children: tabs.map(([k2, l2, c2]) => /* @__PURE__ */ u2("button", { class: f3 === k2 ? "sel" : "", "data-nf": k2, onClick: () => on3.filter(k2), children: [
        l2,
        /* @__PURE__ */ u2("span", { children: c2 })
      ] })) }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: "np-list", children: rows.length ? rows.map((n2) => /* @__PURE__ */ u2("div", { class: `np-row ${n2.read ? "" : "new"}`, children: [
        /* @__PURE__ */ u2("button", { class: "np-dot", "data-nread": n2.id, onClick: (e2) => on3.read(e2, n2.id), title: n2.read ? "Mark as unread" : "Mark as read" }),
        "\n    ",
        /* @__PURE__ */ u2("a", { class: "np-main", "data-open": n2.ref, "data-target": n2.target, "data-note": n2.id, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
          /* @__PURE__ */ u2("b", { children: n2.title }),
          /* @__PURE__ */ u2("span", { children: n2.text }),
          /* @__PURE__ */ u2("i", { children: [
            n2.ref,
            " \xB7 ",
            n2.when
          ] })
        ] }),
        "\n    ",
        /* @__PURE__ */ u2("button", { class: "np-act", "data-nread": n2.id, onClick: (e2) => on3.read(e2, n2.id), children: n2.read ? "Mark unread" : "Mark read" }),
        /* @__PURE__ */ u2("button", { class: "np-act del", "data-ndel": n2.id, onClick: (e2) => on3.del(e2, n2.id), title: "Delete", children: I2("x") })
      ] })) : /* @__PURE__ */ u2("div", { class: "note-empty np-empty", children: f3 === "unread" ? "You are all caught up." : f3 === "read" ? "Nothing read yet." : "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." }) })
    ] });
  }
  function NpMeta({ p: p2, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "np-box np-metas", id: "npmeta", children: [
      p2.rows.map((r2) => /* @__PURE__ */ u2("div", { class: "np-meta", children: [
        /* @__PURE__ */ u2("label", { class: "np-l", children: r2.name }),
        /* @__PURE__ */ u2("div", { class: "np-chips", children: [
          r2.chips.map((x2) => /* @__PURE__ */ u2("span", { class: "np-chip", "data-npdel": r2.k, "data-v": x2, onClick: () => on3.del(r2.k, x2), title: "Remove", children: [
            x2,
            " \xD7"
          ] })),
          r2.free.length ? /* @__PURE__ */ u2("select", { class: "sel np-add", "data-npadd": r2.k, value: "", onChange: (e2) => on3.add(r2.k, e2), children: [
            /* @__PURE__ */ u2("option", { value: "", children: `Add ${r2.name.toLowerCase()}\u2026` }),
            r2.free.map((x2) => /* @__PURE__ */ u2("option", { children: x2 }))
          ] }) : ""
        ] })
      ] })),
      "\n    ",
      /* @__PURE__ */ u2("div", { class: "np-meta", children: [
        /* @__PURE__ */ u2("label", { class: "np-l", children: "Milestone" }),
        /* @__PURE__ */ u2("select", { class: "sel", id: "npmile", onChange: on3.mile, children: [
          /* @__PURE__ */ u2("option", { value: "", children: "None" }),
          p2.milestones.map((x2) => /* @__PURE__ */ u2("option", { value: x2.number, selected: x2.on, children: x2.title }))
        ] })
      ] }),
      "\n    ",
      /* @__PURE__ */ u2("div", { class: "np-meta", children: [
        /* @__PURE__ */ u2("label", { class: "np-l", children: [
          "Linked issues ",
          /* @__PURE__ */ u2("i", { children: "closed when this merges" })
        ] }),
        /* @__PURE__ */ u2("input", { class: "input", id: "npissues", placeholder: "e.g. 12, 15", value: p2.issues, onInput: on3.issues })
      ] })
    ] });
  }
  function NewPr({ p: p2, on: on3 }) {
    const c2 = p2.cmp;
    const cmp = c2.kind === "loading" ? /* @__PURE__ */ u2("span", { class: "np-note", children: "Comparing\u2026" }) : c2.kind === "none" ? "" : c2.kind === "err" ? /* @__PURE__ */ u2("span", { class: "np-note err", children: c2.text }) : c2.kind === "ok" ? /* @__PURE__ */ u2("span", { class: "np-note ok", children: [
      I2("git-commit"),
      SP,
      c2.ahead,
      " commit",
      c2.ahead === 1 ? "" : "s",
      " \xB7 ",
      c2.files,
      " file",
      c2.files === 1 ? "" : "s",
      " changed",
      c2.behind ? ` \xB7 ${c2.behind} behind ${p2.base}` : ""
    ] }) : /* @__PURE__ */ u2("span", { class: "np-note err", children: "These branches are identical \u2014 there is nothing to compare." });
    const t2 = p2.tpls;
    return /* @__PURE__ */ u2("div", { class: "notes-page np-new", children: [
      /* @__PURE__ */ u2("div", { class: "np-head", children: /* @__PURE__ */ u2("h1", { children: [
        I2("git-pull-request"),
        SP,
        "New pull request"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u2("div", { class: "np-card", children: [
        /* @__PURE__ */ u2("div", { class: "np-main-col", children: [
          "\n    ",
          /* @__PURE__ */ u2("div", { class: "np-box", children: [
            /* @__PURE__ */ u2("label", { class: "np-l", children: "Repository" }),
            p2.hasRepos ? /* @__PURE__ */ u2("button", { type: "button", class: "sel bp-btn", id: "nprepo", onClick: on3.repo, children: [
              /* @__PURE__ */ u2("span", { children: p2.repo || "Choose a repository" }),
              I2("chevron-down", 14)
            ] }) : /* @__PURE__ */ u2("input", { class: "input", id: "nprepoin", placeholder: "owner/repo", value: p2.repo, onChange: on3.repoIn }),
            "\n    ",
            /* @__PURE__ */ u2("div", { class: "np-branches", children: [
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("label", { class: "np-l", children: [
                  "Base ",
                  /* @__PURE__ */ u2("i", { children: "merge into" })
                ] }),
                /* @__PURE__ */ u2("button", { type: "button", class: "sel bp-btn", id: "npbase", "data-bp": "base", onClick: on3.base, disabled: !p2.hasBranches, children: [
                  /* @__PURE__ */ u2("span", { children: p2.hasBranches ? p2.base || "Choose a branch" : "Loading\u2026" }),
                  I2("chevron-down", 14)
                ] })
              ] }),
              "\n      ",
              /* @__PURE__ */ u2("button", { class: "tb-btn", id: "npswap", onClick: on3.swap, title: "Swap base and head", children: "\u21C4" }),
              "\n      ",
              /* @__PURE__ */ u2("div", { children: [
                /* @__PURE__ */ u2("label", { class: "np-l", children: [
                  "Head ",
                  /* @__PURE__ */ u2("i", { children: "changes from" })
                ] }),
                /* @__PURE__ */ u2("button", { type: "button", class: "sel bp-btn", id: "nphead", "data-bp": "head", onClick: on3.head, disabled: !p2.hasBranches, children: [
                  /* @__PURE__ */ u2("span", { children: p2.hasBranches ? p2.head || "Choose a branch" : "Loading\u2026" }),
                  I2("chevron-down", 14)
                ] })
              ] })
            ] }),
            "\n    ",
            /* @__PURE__ */ u2("div", { class: "np-cmp", children: p2.same ? /* @__PURE__ */ u2("span", { class: "np-note err", children: "Base and head are the same branch." }) : cmp })
          ] }),
          "\n    ",
          /* @__PURE__ */ u2("div", { class: "np-box", children: [
            /* @__PURE__ */ u2("label", { class: "np-l", children: "Title" }),
            /* @__PURE__ */ u2("input", { class: "input", id: "nptitle", placeholder: "Title", value: p2.title, onInput: on3.title })
          ] }),
          "\n    ",
          /* @__PURE__ */ u2("div", { class: "np-box", children: [
            /* @__PURE__ */ u2("label", { class: "np-l", children: "Description" }),
            t2 && t2.length > 1 ? /* @__PURE__ */ u2("select", { class: "sel np-tpl", id: "nptpl", onChange: on3.tpl, children: [
              /* @__PURE__ */ u2("option", { value: "", children: "No template" }),
              t2.map((x2, i2) => /* @__PURE__ */ u2("option", { value: i2, selected: x2.body === p2.tplText, children: [
                "Template: ",
                x2.name
              ] }))
            ] }) : "",
            /* @__PURE__ */ u2("div", { class: "tt", "data-draft": "newpr", "data-ph": "Describe your changes \u2014 type / for blocks", style: "--rows:8" })
          ] }),
          "\n    ",
          /* @__PURE__ */ u2("div", { class: "np-box", children: [
            /* @__PURE__ */ u2("label", { class: "np-check", children: [
              /* @__PURE__ */ u2("input", { type: "checkbox", id: "npdraft", checked: p2.isDraft, onChange: on3.draft }),
              " Create as draft ",
              /* @__PURE__ */ u2("span", { children: "(not ready for review yet)" })
            ] }),
            "\n    ",
            p2.err ? /* @__PURE__ */ u2("div", { class: "act-err", children: p2.err }) : "",
            "\n    ",
            /* @__PURE__ */ u2("div", { class: "np-btns", children: [
              /* @__PURE__ */ u2("button", { class: "btn", id: "npcancel", onClick: on3.cancel, children: "Cancel" }),
              /* @__PURE__ */ u2("button", { class: "btn primary", id: "npcreate", onClick: on3.create, disabled: !p2.ready, children: p2.isDraft ? "Create draft pull request" : "Create pull request" })
            ] })
          ] }),
          "\n  "
        ] }),
        /* @__PURE__ */ u2("div", { class: "np-side-col", children: p2.meta ? /* @__PURE__ */ u2(NpMeta, { p: p2.meta, on: on3 }) : "" })
      ] })
    ] }, p2.seq);
  }
  function InboxPage({ p: { loading, err, secs }, on: on3 }) {
    const body = err ? /* @__PURE__ */ u2("div", { class: "diff-empty err", children: err }) : !secs ? /* @__PURE__ */ u2("div", { class: "skel", children: [
      /* @__PURE__ */ u2("div", { class: "sk sk-line" }),
      /* @__PURE__ */ u2("div", { class: "sk sk-line w80" }),
      /* @__PURE__ */ u2("div", { class: "sk sk-line w60" })
    ] }) : secs.map((s2) => /* @__PURE__ */ u2("section", { class: "ib-sec", children: [
      /* @__PURE__ */ u2("h2", { children: [
        s2.title,
        /* @__PURE__ */ u2("span", { children: s2.rows.length })
      ] }),
      /* @__PURE__ */ u2("p", { children: s2.sub }),
      s2.rows.length ? s2.rows.map((r2) => /* @__PURE__ */ u2("a", { class: "ib-row", "data-open": r2.ref, onClick: (e2) => on3.open(e2.currentTarget, e2), onAuxClick: (e2) => on3.aux(e2.currentTarget, e2), onContextMenu: (e2) => on3.ctx(e2.currentTarget, e2), children: [
        /* @__PURE__ */ u2("img", { src: r2.avatar, alt: "" }),
        /* @__PURE__ */ u2("span", { class: "ib-t", children: [
          /* @__PURE__ */ u2("b", { children: r2.title }),
          /* @__PURE__ */ u2("i", { children: r2.sub })
        ] }),
        r2.fresh ? /* @__PURE__ */ u2("span", { class: "ib-new", children: "New activity" }) : "",
        r2.comments ? /* @__PURE__ */ u2("span", { class: "ib-c", children: [
          I2("comment"),
          SP,
          r2.comments
        ] }) : ""
      ] })) : /* @__PURE__ */ u2("div", { class: "ib-none", children: "Nothing here. Nice." })
    ] }));
    return /* @__PURE__ */ u2("div", { class: "notes-page", children: [
      /* @__PURE__ */ u2("div", { class: "np-head", children: [
        /* @__PURE__ */ u2("h1", { children: [
          I2("checklist"),
          SP,
          "Inbox"
        ] }),
        /* @__PURE__ */ u2("div", { class: "np-tools", children: /* @__PURE__ */ u2("button", { class: "btn small", id: "ibrefresh", onClick: on3.refresh, disabled: loading, children: loading ? "Loading\u2026" : "Refresh" }) })
      ] }),
      body
    ] });
  }
  var Skeleton = () => /* @__PURE__ */ u2("div", { class: "skel", "aria-busy": "true", children: [
    /* @__PURE__ */ u2("div", { class: "sk sk-crumb" }),
    /* @__PURE__ */ u2("div", { class: "sk sk-title" }),
    /* @__PURE__ */ u2("div", { class: "sk sk-pill" }),
    /* @__PURE__ */ u2("div", { class: "sk sk-line w60" }),
    /* @__PURE__ */ u2("div", { class: "sk-tabs", children: [
      /* @__PURE__ */ u2("i", { class: "sk" }),
      /* @__PURE__ */ u2("i", { class: "sk" }),
      /* @__PURE__ */ u2("i", { class: "sk" })
    ] }),
    [0, 1, 2].map((i2) => /* @__PURE__ */ u2("div", { class: "sk-row", style: `--i:${i2}`, children: [
      /* @__PURE__ */ u2("div", { class: "sk sk-av" }),
      /* @__PURE__ */ u2("div", { class: "sk-card", children: [
        /* @__PURE__ */ u2("div", { class: "sk sk-line w40" }),
        /* @__PURE__ */ u2("div", { class: "sk sk-line" }),
        /* @__PURE__ */ u2("div", { class: "sk sk-line w80" }),
        /* @__PURE__ */ u2("div", { class: "sk sk-line w60" })
      ] })
    ] }))
  ] });
  function PrLayout({ header, body, side, on: on3 }) {
    return /* @__PURE__ */ u2("div", { class: "pr-page", children: [
      header,
      /* @__PURE__ */ u2("div", { class: "pr-layout", children: [
        /* @__PURE__ */ u2("main", { class: "pr-main", children: body }),
        side.kind === "rail" ? /* @__PURE__ */ u2("button", { class: "pane-rail side-rail", "data-show": "side", onClick: on3.show, title: "Show details", children: [
          I2("columns"),
          /* @__PURE__ */ u2("span", { children: "Details" })
        ] }) : side.kind === "aside" ? /* @__PURE__ */ u2("aside", { class: "pr-side", children: [
          /* @__PURE__ */ u2("div", { class: "side-top", children: [
            /* @__PURE__ */ u2("span", { children: "Details" }),
            /* @__PURE__ */ u2("button", { class: "fold-btn", "data-hide": "side", onClick: side.on.hide, title: "Hide this panel", children: I2("x") })
          ] }),
          side.inner
        ] }) : ""
      ] })
    ] });
  }
  var SplitLayout = ({ header, split }) => /* @__PURE__ */ u2("div", { class: "pr-page is-split", children: [
    header,
    split
  ] });
  var Gate = ({ err, go: go3, tok }) => /* @__PURE__ */ u2("div", { class: "gate", children: /* @__PURE__ */ u2("div", { class: "gate-card", children: [
    /* @__PURE__ */ u2("img", { src: "logo.png", alt: "", width: 72, height: 72 }),
    /* @__PURE__ */ u2("h1", { children: "Sign in to Pullscope" }),
    "\n  ",
    /* @__PURE__ */ u2("p", { class: "gate-err", children: [
      I2("alert"),
      SP,
      "No GitHub sign-in or token was found."
    ] }),
    "\n  ",
    /* @__PURE__ */ u2("p", { children: "Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing." }),
    "\n  ",
    err ? /* @__PURE__ */ u2("p", { class: "gate-err", children: err }) : "",
    "\n  ",
    /* @__PURE__ */ u2("div", { class: "btns", style: "justify-content:center", children: [
      /* @__PURE__ */ u2("button", { class: "btn primary", id: "gatego", onClick: go3, children: "Sign in with GitHub" }),
      /* @__PURE__ */ u2("button", { class: "btn", id: "gatetok", onClick: tok, children: "Use a token instead" })
    ] }),
    "\n  ",
    /* @__PURE__ */ u2("small", { children: [
      "Tip: running ",
      /* @__PURE__ */ u2("code", { children: "gh auth login" }),
      " in a terminal also works."
    ] })
  ] }) });

  // src/app/fun.ts
  var enterTimer;
  function enterAnim() {
    qa(".tl-comment, .TLI, .thread, .sb-item, .merge-card, .composer, .pr-title-area").forEach((el, i2) => {
      el.style.setProperty("--i", String(Math.min(i2, 14)));
      el.classList.add("enter-in");
    });
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => qa(".enter-in").forEach((el) => el.classList.remove("enter-in")), 1800);
  }
  document.addEventListener("pointerdown", (e2) => {
    const b2 = e2.target.closest(".btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add");
    if (!b2 || b2.disabled) return;
    const r2 = b2.getBoundingClientRect(), d2 = Math.max(r2.width, r2.height) * 2, rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.cssText = `width:${d2}px;height:${d2}px;left:${e2.clientX - r2.left - d2 / 2}px;top:${e2.clientY - r2.top - d2 / 2}px`;
    if (getComputedStyle(b2).position === "static") b2.style.position = "relative";
    b2.style.overflow = "hidden";
    b2.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
    if (b2.matches(".reaction, .react-add")) burst(e2.clientX, e2.clientY, b2.textContent.trim().slice(0, 2) || "\u2728", 6);
  });
  function burst(x2, y2, ch, n2) {
    for (let i2 = 0; i2 < n2; i2++) {
      const p2 = document.createElement("span");
      p2.className = "burst";
      p2.textContent = ch;
      const a2 = Math.PI * 2 * i2 / n2 + Math.random() * 0.6, v2 = 40 + Math.random() * 50;
      p2.style.cssText = `left:${x2}px;top:${y2}px;--dx:${Math.cos(a2) * v2}px;--dy:${Math.sin(a2) * v2 - 30}px`;
      document.body.appendChild(p2);
      setTimeout(() => p2.remove(), 900);
    }
  }
  function confetti() {
    const c2 = document.createElement("canvas");
    c2.className = "confetti";
    c2.width = innerWidth;
    c2.height = innerHeight;
    document.body.appendChild(c2);
    const g2 = c2.getContext("2d"), cols = ["#0969da", "#1f883d", "#8250df", "#f2cc60", "#cf222e", "#ff8fb1"];
    const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[Math.random() * cols.length | 0] }));
    let t2 = 0;
    (function f3() {
      g2.clearRect(0, 0, c2.width, c2.height);
      t2++;
      ps.forEach((p2) => {
        p2.vy += 0.35;
        p2.vx *= 0.99;
        p2.x += p2.vx;
        p2.y += p2.vy;
        p2.a += p2.va;
        g2.save();
        g2.translate(p2.x, p2.y);
        g2.rotate(p2.a);
        g2.fillStyle = p2.c;
        g2.globalAlpha = Math.max(0, 1 - t2 / 130);
        g2.fillRect(-p2.r, -p2.r / 2, p2.r * 2, p2.r);
        g2.restore();
      });
      if (t2 < 130) requestAnimationFrame(f3);
      else c2.remove();
    })();
  }

  // src/app/views.tsx
  var open = { open: openClick, aux: openAux, ctx: openCtx };
  var typedPf = (e2) => {
    S.pf = e2.target.value;
    render();
  };
  var prl = {
    ...open,
    ps: (s2) => {
      S.prState = s2;
      openRepo(S.repo, { nav: true });
    },
    compare: (repo, br) => openNewPr(repo, br),
    dismiss: (key) => {
      pushDis[key] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    },
    filter: typedPf,
    author: (e2) => {
      S.pAuthor = e2.target.value;
      render();
    },
    label: (e2) => {
      S.pLabel = e2.target.value;
      render();
    },
    status: (e2) => {
      S.pStatus = e2.target.value;
      render();
    },
    sort: (e2) => {
      S.psort = e2.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    },
    clear: () => {
      S.pf = S.pAuthor = S.pLabel = S.pStatus = "";
      render();
    }
  };
  function RepoView() {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: S.repo, trail: [{ t: "Pull requests" }], extra: "", on: crumbs }),
      /* @__PURE__ */ u2(PrListPage, { p: prListProps(), on: prl })
    ] });
  }
  var keep3 = (fn) => {
    S.keepScroll = true;
    fn();
    render();
    S.keepScroll = false;
  };
  var notes = {
    ...open,
    check: () => pollNotes(),
    readAll: () => keep3(() => {
      S.notes.forEach((n2) => n2.read = true);
      saveNotes();
    }),
    clear: () => keep3(() => {
      S.notes = [];
      saveNotes();
    }),
    filter: (f3) => keep3(() => {
      S.nf = f3;
    }),
    read: (e2, id) => {
      e2.stopPropagation();
      const n2 = S.notes.find((x2) => String(x2.id) === String(id));
      if (n2) keep3(() => {
        n2.read = !n2.read;
        saveNotes();
      });
    },
    del: (e2, id) => {
      e2.stopPropagation();
      keep3(() => {
        S.notes = S.notes.filter((x2) => String(x2.id) !== String(id));
        saveNotes();
      });
    }
  };
  function NotesView() {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: "", trail: [{ t: "Notifications" }], extra: "", on: crumbs }),
      /* @__PURE__ */ u2(NotesPage, { ...notesProps(), on: notes })
    ] });
  }
  var inbox = { ...open, refresh: () => loadInbox(true) };
  function InboxView() {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: "", trail: [{ t: "Inbox" }], extra: "", on: crumbs }),
      /* @__PURE__ */ u2(InboxPage, { p: inboxProps(), on: inbox })
    ] });
  }
  var np = () => S.np;
  var npSet = (f3) => {
    f3();
    np().key = `${np().repo}|${np().base}|${np().head}`;
  };
  var val = (e2) => e2.target.value;
  var newpr = {
    cancel: () => {
      S.view = S.bundle ? "pr" : "home";
      delete S.draft.newpr;
      render();
    },
    repo: (e2) => bpOpen(e2.currentTarget, "repo", (v2) => {
      npSet(() => {
        np().repo = v2;
        np().base = "";
        np().head = "";
        np().cmp = null;
        np().titleTouched = false;
        np().title = "";
      });
      render();
      npLoadBranches(np().repo);
    }, true),
    repoIn: (e2) => {
      npSet(() => {
        np().repo = val(e2).trim();
        np().base = "";
        np().head = "";
      });
      npLoadBranches(np().repo);
    },
    base: (e2) => bpOpen(e2.currentTarget, "base", (v2) => {
      npSet(() => {
        np().base = v2;
      });
      npCompare();
    }),
    head: (e2) => bpOpen(e2.currentTarget, "head", (v2) => {
      npSet(() => {
        np().head = v2;
        np().titleTouched = false;
      });
      npCompare();
    }),
    swap: () => {
      npSet(() => {
        [np().base, np().head] = [np().head, np().base];
      });
      npCompare();
    },
    tpl: (e2) => {
      const n2 = np(), sel = e2.target, t2 = n2.tpl[`${n2.repo}|${n2.base}`] || [], cur = (S.draft.newpr || "").trim(), next = sel.value === "" ? "" : t2[+sel.value].body;
      if (cur && cur !== n2.tplText.trim() && !confirm("Replace what you have written with this template?")) {
        sel.value = String(t2.findIndex((x2) => x2.body === n2.tplText));
        if (sel.value === "-1") sel.value = "";
        return;
      }
      S.draft.newpr = n2.tplText = next;
      saveDrafts();
      bumpNp();
      rerender();
    },
    title: (e2) => {
      np().title = val(e2);
      np().titleTouched = true;
      render();
    },
    draft: (e2) => {
      np().draft = e2.target.checked;
      render();
    },
    add: (k2, e2) => {
      if (val(e2)) {
        np()[k2].push(val(e2));
        render();
      }
    },
    del: (k2, v2) => {
      np()[k2] = np()[k2].filter((x2) => x2 !== v2);
      render();
    },
    mile: (e2) => {
      np().milestone = val(e2);
    },
    issues: (e2) => {
      np().issues = val(e2);
    },
    create: async (e2) => {
      const n2 = np(), btn = e2.currentTarget;
      setBusy(btn, true);
      n2.err = "";
      try {
        const nums = [...new Set(n2.issues.match(/\d+/g) || [])];
        const body = ((S.draft.newpr || "").trim() + (nums.length ? `

${nums.map((x2) => `Closes #${x2}`).join("\n")}` : "")).trim();
        const extra = { reviewers: n2.reviewers, assignees: n2.assignees, labels: n2.labels, milestone: n2.milestone ? Number(n2.milestone) : null };
        const r2 = await tauri.invoke("create_pr", { repo: n2.repo, base: n2.base, head: n2.head, title: n2.title, body, draft: n2.draft, extra });
        const warn = r2.warnings?.length ? `Created, but ${r2.warnings.join(" \xB7 ")}` : "";
        delete S.draft.newpr;
        saveDrafts();
        S.np = null;
        confetti();
        await openPr(`${n2.repo}#${r2.number}`, { nav: true });
        if (warn) {
          S.actErr = { k: "comment", m: warn };
          rerender();
        }
      } catch (err) {
        setBusy(btn, false);
        n2.err = String(err).replace(/^Error: /, "");
        rerender();
      }
    }
  };
  function NewPrView() {
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: np().repo, trail: [{ t: "New pull request" }], extra: "", on: crumbs }),
      /* @__PURE__ */ u2(NewPr, { p: newPrProps(), on: newpr })
    ] });
  }

  // src/app/pr.tsx
  var hide = (k2, v2) => keep(() => {
    S.hide[k2] = v2;
    localStorage.setItem("hide", JSON.stringify(S.hide));
  });
  var head = {
    tab: openTab2,
    edit: editPrDialog,
    copy: () => {
      navigator.clipboard?.writeText(S.bundle.pull.head.ref);
    },
    review: reviewDialog,
    side: () => keep(() => {
      S.hide.side = !S.hide.side;
      localStorage.setItem("hide", JSON.stringify(S.hide));
    }),
    split: () => keep(() => {
      S.split = !S.split;
      localStorage.setItem("split", S.split ? "1" : "0");
    })
  };
  var sideOn = {
    fold: (k2, def) => {
      S.fold[k2] = !isFolded(k2, def);
      localStorage.setItem("fold", JSON.stringify(S.fold));
      rerender();
    },
    rvtoggle: () => {
      S.showAllReviewers = !S.showAllReviewers;
      rerender();
    },
    rerequest: rerequestReview
  };
  function Header() {
    const p2 = S.bundle.pull, r2 = p2.base.repo;
    const extra = /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2("a", { class: "crumb gh", href: r2.html_url, "data-ext": "", title: "Open on GitHub", children: I2("link-external", 12) }),
      S.refreshing ? /* @__PURE__ */ u2("span", { class: "stale", children: "Refreshing\u2026" }) : ""
    ] });
    return /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Crumbs, { repo: r2.full_name, trail: [{ t: "Pull requests", repo: r2.full_name }, { t: `#${p2.number}` }], extra: "", extraNode: extra, on: crumbs }),
      /* @__PURE__ */ u2(PrHeader, { ...prHeaderProps(S.bundle), on: head })
    ] });
  }
  function PrView() {
    const b2 = S.bundle;
    if (S.split && S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline") return /* @__PURE__ */ u2(SplitLayout, { header: /* @__PURE__ */ u2(Header, {}), split: splitView(b2) });
    const body = S.tab === "files" ? filesView(b2) : S.tab === "commits" ? commitsView(b2) : S.tab === "checks" ? checksView(b2) : null;
    const side = S.tab !== "conversation" ? { kind: "none" } : S.hide.side ? { kind: "rail" } : { kind: "aside", inner: /* @__PURE__ */ u2(PrSide, { ...sidebarProps(b2), on: sideOn }), on: { hide: () => hide("side", true) } };
    return /* @__PURE__ */ u2(PrLayout, { header: /* @__PURE__ */ u2(Header, {}), body: S.tab === "timeline" ? /* @__PURE__ */ u2("div", { class: "rail", children: /* @__PURE__ */ u2(Timeline, { m: timelineModel(b2), on: tlOn }) }) : S.tab === "conversation" ? /* @__PURE__ */ u2(S2, { children: [
      /* @__PURE__ */ u2(Attention, { ...attentionProps(b2), on: attOn }),
      /* @__PURE__ */ u2(Timeline, { m: timelineModel(b2), on: tlOn })
    ] }) : body, side, on: { show: () => hide("side", false) } });
  }

  // src/components/Shell.tsx
  var Shell = (p2) => /* @__PURE__ */ u2(S2, { children: [
    /* @__PURE__ */ u2("div", { class: `shell ${p2.nav ? "nav-open" : ""} ${p2.navHidden ? "nav-hidden" : ""}`, style: `--sbw:${p2.sbw}px`, children: [
      /* @__PURE__ */ u2("div", { id: "side", style: "display:contents" }),
      /* @__PURE__ */ u2("div", { class: "sb-grip", id: "sbgrip", title: "Drag to resize \xB7 double-click to reset" }),
      /* @__PURE__ */ u2("div", { class: "scrim", id: "scrim" }),
      [p2.active, ...p2.kept].map((k2, i2) => i2 === 0 ? /* @__PURE__ */ u2("div", { class: `main${p2.fade ? " tab-in" : ""}`, children: /* @__PURE__ */ u2("div", { id: "page", style: "display:contents", onClick: p2.onPage, children: k2.children }) }, k2.key) : /* @__PURE__ */ u2("div", { class: "main-off", style: "display:none", children: /* @__PURE__ */ u2("div", { style: "display:contents", children: k2.children }) }, k2.key))
    ] }),
    /* @__PURE__ */ u2("div", { id: "dlg", style: "display:contents" }),
    /* @__PURE__ */ u2("div", { id: "notehost", style: "display:contents" })
  ] });

  // src/app/pages.tsx
  var saveNotes = () => localStorage.setItem("notes", JSON.stringify(S.notes));
  function notesProps() {
    const f3 = S.nf || "all", unread = S.notes.filter((n2) => !n2.read).length;
    const rows = S.notes.filter((n2) => f3 === "all" || (f3 === "unread" ? !n2.read : n2.read)).map((n2) => ({ id: n2.id, read: !!n2.read, ref: n2.ref, target: n2.target || "", title: n2.title, text: n2.text, when: when(n2.at).replace(/<\/?span[^>]*>/g, "") }));
    return { f: f3, rows, unread, total: S.notes.length };
  }
  async function loadInbox(force = false) {
    S.inbox = S.inbox || { data: null, err: "", loading: true };
    S.inbox.loading = true;
    S.inbox.err = "";
    render();
    try {
      S.inbox.data = tauri ? await tauri.invoke("inbox", { force }) : { requested: [], mine: [], ready: [] };
    } catch (e2) {
      S.inbox.err = String(e2).replace(/^Error: /, "");
    }
    S.inbox.loading = false;
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  }
  var npHuman = (s2) => s2.replace(/^[a-z]+\//i, "").replace(/[-_]+/g, " ").replace(/^./, (c2) => c2.toUpperCase());
  var npSeq = 0;
  var bumpNp = () => {
    npSeq++;
  };
  function newPrProps() {
    const n2 = S.np, repos = (S.repos || []).filter((r2) => !r2.archived), br = n2.branches[n2.repo];
    const same = !!(n2.base && n2.base === n2.head);
    const c2 = n2.cmp;
    const cmp = c2 === "loading" ? { kind: "loading", text: "", ahead: 0, files: 0, behind: 0 } : !c2 ? { kind: "none", text: "", ahead: 0, files: 0, behind: 0 } : typeof c2 === "string" ? { kind: "err", text: c2, ahead: 0, files: 0, behind: 0 } : c2.ahead_by ? { kind: "ok", text: "", ahead: c2.ahead_by, files: c2.files, behind: c2.behind_by } : { kind: "same", text: "", ahead: 0, files: 0, behind: 0 };
    const ready = !!(n2.title.trim() && n2.repo && n2.base && n2.head && !same && n2.cmp && typeof n2.cmp === "object" && n2.cmp.ahead_by > 0);
    return { hasRepos: repos.length > 0, repo: n2.repo, base: n2.base, head: n2.head, hasBranches: !!br, same, cmp, title: n2.title, tpls: n2.tpl[`${n2.repo}|${n2.base}`] ?? null, tplText: n2.tplText, seq: npSeq, isDraft: !!n2.draft, err: n2.err || "", ready, meta: npMetaProps(n2) };
  }
  function npMetaProps(n2) {
    const m2 = n2.meta?.[n2.repo];
    if (!m2) return null;
    const ppl = m2.people.map((x2) => x2.login), me = S.me || "";
    const row2 = (k2, name, list) => ({ k: k2, name, chips: n2[k2].slice(), free: list.filter((x2) => !n2[k2].includes(x2)) });
    return { rows: [row2("reviewers", "Reviewers", ppl.filter((x2) => x2 !== me)), row2("assignees", "Assignees", ppl), row2("labels", "Labels", m2.labels.map((x2) => x2.name))], milestones: m2.milestones.map((x2) => ({ number: x2.number, title: x2.title, on: String(n2.milestone) === String(x2.number) })), issues: n2.issues };
  }
  async function npLoadMeta(repo) {
    const n2 = S.np;
    if (!repo || !tauri || n2.meta[repo]) return;
    try {
      n2.meta[repo] = await tauri.invoke("repo_meta", { repo });
    } catch {
      n2.meta[repo] = { people: [], labels: [], milestones: [] };
    }
    if (S.np === n2) rerender();
  }
  async function npLoadBranches(repo) {
    const n2 = S.np;
    npLoadMeta(repo);
    if (!repo || n2.branches[repo]) return npPickDefaults();
    if (!tauri) {
      n2.err = "Creating pull requests needs the desktop app.";
      return render();
    }
    try {
      n2.branches[repo] = await tauri.invoke("list_branches", { repo });
      n2.err = "";
    } catch (e2) {
      n2.err = String(e2).replace(/^Error: /, "");
      n2.branches[repo] = { default: "", branches: [] };
    }
    npPickDefaults();
  }
  function npPickDefaults() {
    const n2 = S.np, b2 = n2.branches[n2.repo];
    if (!b2) return render();
    if (!b2.branches.includes(n2.base)) n2.base = b2.default || b2.branches[0] || "";
    if (!b2.branches.includes(n2.head) || n2.head === n2.base) n2.head = b2.branches.find((x2) => x2 !== n2.base) || "";
    npCompare();
  }
  async function npLoadTemplates() {
    const n2 = S.np;
    if (!n2.repo || !n2.base || !tauri) return;
    const k2 = `${n2.repo}|${n2.base}`;
    if (n2.tpl[k2] !== void 0) return n2.tpl[k2] ? npApplyTemplate() : void 0;
    n2.tpl[k2] = null;
    try {
      n2.tpl[k2] = await tauri.invoke("pr_templates", { repo: n2.repo, base: n2.base });
    } catch {
      n2.tpl[k2] = [];
    }
    if (S.np === n2 && `${n2.repo}|${n2.base}` === k2) npApplyTemplate();
  }
  function npApplyTemplate() {
    const n2 = S.np, list = n2.tpl[`${n2.repo}|${n2.base}`], cur = (S.draft.newpr || "").trim();
    if (list?.length && (!cur || cur === n2.tplText.trim())) {
      S.draft.newpr = n2.tplText = list[0].body;
      saveDrafts();
    }
    rerender();
  }
  async function npCompare() {
    const n2 = S.np;
    n2.cmp = null;
    npLoadTemplates();
    if (!n2.repo || !n2.base || !n2.head || n2.base === n2.head) return rerender();
    const key = `${n2.repo}|${n2.base}|${n2.head}`;
    n2.key = key;
    n2.cmp = "loading";
    rerender();
    try {
      const r2 = await tauri.invoke("compare_branches", { repo: n2.repo, base: n2.base, head: n2.head });
      if (S.np.key !== key) return;
      n2.cmp = r2;
      if (!n2.titleTouched) n2.title = r2.commits.length === 1 ? r2.commits[0] : npHuman(n2.head);
    } catch (e2) {
      if (S.np.key !== key) return;
      n2.cmp = String(e2).replace(/^Error: /, "");
    }
    rerender();
  }
  function openNewPr(repo, head2) {
    const cur = typeof repo === "string" && repo || S.bundle?.pull.base.repo.full_name || S.repo || "";
    bumpNp();
    S.view = "newpr";
    S.nav = false;
    S.np = { repo: cur, base: "", head: typeof head2 === "string" && head2 || "", branches: {}, meta: {}, reviewers: [], assignees: [], labels: [], milestone: "", issues: "", cmp: null, title: "", titleTouched: false, draft: false, err: "", key: "", tpl: {}, tplText: "" };
    delete S.draft.newpr;
    render();
    if (tauri && !S.repos) loadRepos().then(() => {
      if (!S.np.repo && S.repos?.[0]) S.np.repo = S.repos[0].full_name;
      npLoadBranches(S.np.repo);
    });
    else npLoadBranches(cur);
  }
  function openInbox() {
    S.view = "inbox";
    S.nav = false;
    render();
    if (!S.inbox?.data || !qc.fresh("inbox", 45e3)) {
      qc.set("inbox", 1);
      loadInbox();
    }
  }
  function inboxProps() {
    const I3 = S.inbox || { loading: true }, d2 = I3.data;
    const row2 = (p2) => {
      const ref = `${p2.repo}#${p2.number}`, was = seen[ref]?.at;
      return { ref, avatar: p2.avatar, title: p2.title, sub: `${ref} \xB7 ${p2.user} \xB7 ${when(p2.updated_at).replace(/<\/?span[^>]*>/g, "")}${p2.draft ? " \xB7 Draft" : ""}`, fresh: !!(was && p2.updated_at > was), comments: p2.comments || 0 };
    };
    const sec = (title, sub, list) => ({ title, sub, rows: list.map(row2) });
    return { loading: !!I3.loading, err: I3.err || "", secs: d2 ? [sec("Review requested", "Waiting on you", d2.requested), sec("Ready to merge", "Your approved pull requests", d2.ready), sec("Your pull requests", "Open PRs you opened", d2.mine)] : null };
  }
  var needSignIn = () => tauri && S.authChecked && !S.hasToken || new URLSearchParams(location.search).get("gate") === "1";
  function hosts() {
    const app = $("#app");
    if (!app.querySelector(":scope > #top")) {
      app.innerHTML = "";
      R(/* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2("div", { id: "top", style: "display:contents" }),
        /* @__PURE__ */ u2("div", { id: "rest", style: "display:contents" })
      ] }), app);
    }
    return { top: $("#top"), rest: $("#rest") };
  }
  var liveView = () => {
    if (S.loading) return /* @__PURE__ */ u2(Skeleton, {});
    if (S.view === "inbox") return /* @__PURE__ */ u2(InboxView, {});
    if (S.view === "notes") return /* @__PURE__ */ u2(NotesView, {});
    if (S.view === "repo") return /* @__PURE__ */ u2(RepoView, {});
    if (S.view === "newpr") return S.np ? /* @__PURE__ */ u2(NewPrView, {}) : null;
    if (S.view === "pr" && S.bundle) return /* @__PURE__ */ u2(PrView, {});
    return (S.view === "home" || !S.bundle) && S.view !== "newpr" ? /* @__PURE__ */ u2(HomeView, {}) : null;
  };
  var followLink = (e2) => {
    if (S.view !== "pr") return;
    const a2 = e2.target.closest("a[href]");
    if (!a2) return;
    e2.preventDefault();
    const h2 = a2.getAttribute("href");
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h2)) openPr(h2);
    else if (/^https?:\/\//.test(h2)) openExternal(h2);
  };
  var shown = null;
  var shownPage = () => shown;
  var paneKey = "";
  function render() {
    applyMode();
    const { top, rest } = hosts();
    if (needSignIn()) {
      (S.eds || []).forEach((e2) => e2.destroy());
      S.eds = [];
      paneKey = "";
      shown = null;
      clearTop(top);
      R(/* @__PURE__ */ u2(S2, { children: [
        /* @__PURE__ */ u2(Gate, { err: S.gateErr ? String(S.gateErr) : "", go: () => {
          tokenDialog();
          setTimeout(() => $("#oauthgo")?.click(), 50);
        }, tok: tokenDialog }),
        /* @__PURE__ */ u2("div", { id: "dlg", style: "display:contents" })
      ] }), rest);
      paintDlg();
      return;
    }
    paintTop(top);
    const stash = S.stash, live = stash ? stash.vnode : liveView(), ref = curRef();
    const key = S.loading ? "loading" : S.view === "pr" && S.bundle ? "pr:" + ref : S.view || "home";
    if (key !== paneKey && !stash) {
      (S.eds || []).forEach((e2) => e2.destroy());
      S.eds = [];
    }
    paneKey = key;
    if (S.view === "pr" && S.bundle && !S.loading && live) shown = { ref, vnode: live };
    const kept = [...S.alive].filter(([r2]) => "pr:" + r2 !== key).map(([r2, a2]) => ({ key: "pr:" + r2, children: a2.vnode }));
    R(/* @__PURE__ */ u2(Shell, { nav: !!S.nav, navHidden: !!S.hide.nav, sbw: S.sbw, fade: !!S.fadeMain, active: { key, children: live }, onPage: followLink, kept }), rest);
    paintSide($("#side"));
    paintDlg();
    paintNotes();
    S.stash = null;
    mountEditors();
    syncFoldAll();
    (S.ios || []).forEach((o2) => o2.disconnect());
    S.ios = [];
    bindSticky();
    if (S.fadeMain) S.fadeMain = false;
    syncUnread();
    if (S.flashId && Date.now() < S.flashUntil) document.getElementById("c-" + S.flashId)?.classList.add("flash");
    else S.flashId = "";
    document.title = S.bundle ? `${S.bundle.pull.title} \xB7 ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "GitHub PR View";
  }

  // src/app/addressbar.ts
  var AC = { rows: [], sel: -1, nav: false, prs: {} };
  function acRows(q3) {
    const t2 = q3.trim(), lq = t2.toLowerCase(), rows = [], seen2 = /* @__PURE__ */ new Set();
    const add = (r2) => {
      if (!seen2.has(r2.ref || r2.fill)) {
        seen2.add(r2.ref || r2.fill);
        rows.push(r2);
      }
    };
    if (/^https?:\/\//i.test(t2)) return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(t2) ? [{ ref: t2, label: "Open " + t2.replace(/^https?:\/\/github\.com\//, ""), sub: "Go to this pull request", ic: "git-pull-request" }] : [];
    const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);
    const known = [...S.tabs.map((x2) => ({ ref: x2.ref, title: x2.title, state: x2.state, ic: x2.icon })), ...S.recent.map((x2) => ({ ref: x2.ref, title: x2.title, state: x2.state, ic: x2.icon }))];
    if (pr) {
      const repo = pr[1], num = pr[2];
      if (num) add({ ref: `${t2.split("#")[0]}#${num}`, label: `Open ${t2.split("#")[0]}#${num}`, sub: "Go to this pull request", ic: "git-pull-request" });
      const fromApi = (AC.prs[repo] || []).map((x2) => ({ ref: `${x2.base?.repo?.full_name || repo}#${x2.number}`, title: x2.title, state: x2.merged_at ? "merged" : x2.state, ic: "git-pull-request" }));
      [...known.filter((x2) => x2.ref.toLowerCase().startsWith(repo + "#")), ...fromApi].filter((x2) => x2.ref.toLowerCase().split("#")[1].startsWith(num)).slice(0, 8).forEach((x2) => add({ ref: x2.ref, label: x2.title || x2.ref, sub: x2.ref, ic: x2.ic || "git-pull-request", state: x2.state }));
      return rows.slice(0, 9);
    }
    known.filter((x2) => !lq || `${x2.ref} ${x2.title}`.toLowerCase().includes(lq)).slice(0, lq ? 6 : 8).forEach((x2) => add({ ref: x2.ref, label: x2.title || x2.ref, sub: x2.ref, ic: x2.ic || "git-pull-request", state: x2.state }));
    if (lq && S.repos) S.repos.filter((r2) => r2.full_name.toLowerCase().includes(lq)).sort((a2, b2) => (b2.full_name.toLowerCase().startsWith(lq) ? 1 : 0) - (a2.full_name.toLowerCase().startsWith(lq) ? 1 : 0)).slice(0, 6).forEach((r2) => add({ fill: r2.full_name + "#", label: r2.full_name, sub: "Repository: pick a pull request", ic: r2.private ? "lock" : "repo" }));
    return rows.slice(0, 12);
  }
  function acClose() {
    document.getElementById("acpop")?.remove();
    AC.rows = [];
    AC.sel = -1;
  }
  function acDraw() {
    const inp = $("#addrinput");
    if (!inp || document.activeElement !== inp) return acClose();
    const q3 = inp.value;
    AC.rows = acRows(q3);
    const m2 = q3.trim().toLowerCase().match(/^([^#\s]+\/[^#\s]+)#\d*$/);
    if (m2 && AC.prs[m2[1]] === void 0 && tauri) {
      AC.prs[m2[1]] = null;
      tauri.invoke("list_prs", { repo: m2[1], state: "all" }).then((r2) => {
        AC.prs[m2[1]] = r2;
        acDraw();
      }).catch(() => {
        AC.prs[m2[1]] = [];
      });
    }
    if (!AC.rows.length) return acClose();
    AC.sel = Math.min(AC.sel, AC.rows.length - 1);
    let pop = document.getElementById("acpop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "acpop";
      pop.className = "acpop";
      document.body.appendChild(pop);
      pop.addEventListener("mousedown", (e2) => {
        e2.preventDefault();
        const r2 = e2.target.closest(".ac-row");
        if (r2) acPick(AC.rows[+r2.dataset.i]);
      });
    }
    const b2 = inp.closest(".addr").getBoundingClientRect();
    pop.style.left = b2.left + "px";
    pop.style.top = b2.bottom + 6 + "px";
    pop.style.width = b2.width + "px";
    pop.innerHTML = AC.rows.map((r2, i2) => `<div class="ac-row${i2 === AC.sel ? " on" : ""}" data-i="${i2}"><span class="ac-i ${r2.state || ""}">${icon(r2.ic)}</span><span class="ac-t"><b>${esc(r2.label)}</b><i>${esc(r2.sub)}</i></span></div>`).join("");
    $(".on", pop)?.scrollIntoView({ block: "nearest" });
  }
  function acPick(r2) {
    const inp = $("#addrinput");
    if (!r2 || !inp) return;
    if (r2.fill) {
      inp.value = r2.fill;
      inp.focus();
      AC.sel = -1;
      acDraw();
      return;
    }
    acClose();
    inp.blur();
    openPr(r2.ref);
  }
  document.addEventListener("focusin", (e2) => {
    if (e2.target.id === "addrinput") {
      AC.sel = -1;
      setTimeout(acDraw, 0);
    }
  });
  document.addEventListener("input", (e2) => {
    if (e2.target.id === "addrinput") {
      AC.sel = -1;
      acDraw();
    }
  });
  document.addEventListener("focusout", (e2) => {
    if (e2.target.id === "addrinput") setTimeout(acClose, 120);
  });
  document.addEventListener("keydown", (e2) => {
    if (e2.target.id !== "addrinput" || !document.getElementById("acpop")) return;
    if (e2.key === "ArrowDown" || e2.key === "ArrowUp") {
      e2.preventDefault();
      const n2 = AC.rows.length;
      AC.sel = e2.key === "ArrowDown" ? (AC.sel + 1) % n2 : (AC.sel - 1 + n2) % n2;
      acDraw();
    } else if (e2.key === "Tab" && AC.rows.length) {
      e2.preventDefault();
      const r2 = AC.rows[Math.max(0, AC.sel)];
      if (r2.fill) acPick(r2);
      else {
        e2.target.value = r2.ref;
        AC.sel = -1;
        acDraw();
      }
    } else if (e2.key === "Enter" && AC.sel >= 0) {
      e2.preventDefault();
      acPick(AC.rows[AC.sel]);
    } else if (e2.key === "Escape") {
      acClose();
    }
  }, true);
  {
    const win = () => window.__TAURI__?.window?.getCurrentWindow?.();
    const free = (e2) => e2.button === 0 && e2.target.closest(".toolbar") && !e2.target.closest("button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop");
    document.addEventListener("mousedown", (e2) => {
      if (!free(e2)) return;
      e2.preventDefault();
      if (e2.detail === 2) win()?.toggleMaximize?.();
      else win()?.startDragging?.();
    });
  }
  function bpClose() {
    document.getElementById("bppop")?.remove();
  }
  function bpAge(t2) {
    if (!t2) return "";
    const m2 = Math.max(1, Math.round((Date.now() - +new Date(t2)) / 6e4));
    return m2 < 60 ? `${m2}m` : m2 < 1440 ? `${Math.round(m2 / 60)}h` : m2 < 43200 ? `${Math.round(m2 / 1440)}d` : `${Math.round(m2 / 43200)}mo`;
  }
  function bpGroups(br, q3, me) {
    const det = new Map((br.details || []).map((d2) => [d2.name, d2])), rank = new Map(br.branches.map((b2, i2) => [b2, i2]));
    const all = br.branches.map((name) => ({ name, at: det.get(name)?.at || "", by: det.get(name)?.by || "" })).sort((a2, b2) => b2.at > a2.at ? 1 : b2.at < a2.at ? -1 : rank.get(a2.name) - rank.get(b2.name));
    if (q3) {
      const t2 = q3.toLowerCase();
      return [["", all.filter((x2) => x2.name.toLowerCase().includes(t2))]];
    }
    const out = [], used = /* @__PURE__ */ new Set(), take = (f3) => all.filter((x2) => !used.has(x2.name) && f3(x2) && used.add(x2.name));
    const def = take((x2) => x2.name === br.default);
    if (def.length) out.push(["Default", def]);
    const mine = me ? take((x2) => x2.by && x2.by.toLowerCase() === me.toLowerCase()) : [];
    if (mine.length) out.push(["Your branches", mine]);
    const rest = take(() => true), pre = /* @__PURE__ */ new Map();
    rest.forEach((x2) => {
      const k2 = x2.name.includes("/") ? x2.name.split("/")[0] + "/" : "";
      (pre.get(k2) || pre.set(k2, []).get(k2)).push(x2);
    });
    const single = [];
    [...pre.entries()].sort((a2, b2) => b2[1].length - a2[1].length || a2[0].localeCompare(b2[0])).forEach(([k2, l2]) => {
      if (k2 && l2.length > 1) out.push([k2, l2]);
      else single.push(...l2);
    });
    if (single.length) out.push([out.length ? "Other" : "", single.sort((a2, b2) => b2.at > a2.at ? 1 : b2.at < a2.at ? -1 : 0)]);
    return out;
  }
  function rpGroups(repos, q3, me) {
    const all = repos.filter((r2) => !r2.archived).map((r2) => ({ name: r2.full_name, at: r2.pushed_at || "", by: r2.private ? "private" : "" })).sort((a2, b2) => b2.at > a2.at ? 1 : b2.at < a2.at ? -1 : 0);
    if (q3) {
      const t2 = q3.toLowerCase();
      return [["", all.filter((x2) => x2.name.toLowerCase().includes(t2))]];
    }
    const out = [], recent = all.slice(0, 5), used = new Set(recent.map((x2) => x2.name));
    if (recent.length) out.push(["Recently pushed", recent]);
    const by = /* @__PURE__ */ new Map();
    all.filter((x2) => !used.has(x2.name)).forEach((x2) => {
      const o2 = x2.name.split("/")[0];
      (by.get(o2) || by.set(o2, []).get(o2)).push(x2);
    });
    [...by.entries()].sort((a2, b2) => +(b2[0].toLowerCase() === me.toLowerCase()) - +(a2[0].toLowerCase() === me.toLowerCase()) || b2[1].length - a2[1].length).forEach(([o2, l2]) => out.push([o2, l2]));
    return out;
  }
  function bpOpen(btn, side, pick, repoMode = false) {
    bpClose();
    const n2 = S.np, br = repoMode ? null : n2.branches[n2.repo];
    if (!repoMode && !br) return;
    const cur = repoMode ? n2.repo : n2[side], me = S.profile?.login || "", r2 = btn.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.id = "bppop";
    pop.className = "bp-pop";
    const w2 = Math.max(r2.width, 340);
    pop.style.cssText = `left:${Math.max(8, Math.min(r2.left, innerWidth - w2 - 8))}px;width:${w2}px;`;
    pop.innerHTML = `<input class="bp-q" placeholder="${repoMode ? "Filter repositories\u2026" : "Filter branches\u2026"}" spellcheck="false"><div class="bp-list"></div>`;
    document.body.appendChild(pop);
    const below = innerHeight - r2.bottom, up = below < 300 && r2.top > below;
    pop.style.maxHeight = Math.min(420, (up ? r2.top : below) - 16) + "px";
    if (up) pop.style.bottom = innerHeight - r2.top + 4 + "px";
    else pop.style.top = r2.bottom + 4 + "px";
    const q3 = $(".bp-q", pop), list = $(".bp-list", pop);
    let act3 = 0, rows = [];
    const draw = () => {
      const groups = repoMode ? rpGroups(S.repos || [], q3.value.trim(), me) : bpGroups(br, q3.value.trim(), me);
      rows = groups.flatMap(([, l2]) => l2);
      act3 = Math.max(0, Math.min(act3, rows.length - 1));
      let i2 = 0;
      list.innerHTML = groups.length && rows.length ? groups.map(([h2, l2]) => `${h2 ? `<div class="bp-h">${esc(h2)}<span>${l2.length}</span></div>` : ""}${l2.map((x2) => `<div class="bp-r${i2++ === act3 ? " act" : ""}${x2.name === cur ? " cur" : ""}" data-b="${esc(x2.name)}"><span class="bp-ck">${x2.name === cur ? "\u2713" : ""}</span><span class="bp-n">${esc(x2.name)}</span>${x2.by ? `<span class="bp-by">${esc(x2.by)}</span>` : ""}<span class="bp-t">${bpAge(x2.at)}</span></div>`).join("")}`).join("") : '<div class="bp-empty">No matches</div>';
      list.querySelector(".act")?.scrollIntoView({ block: "nearest" });
    };
    const done = (v2) => {
      bpClose();
      document.removeEventListener("mousedown", away, true);
      if (v2 && v2 !== cur) pick(v2);
    };
    const away = (e2) => {
      if (!pop.contains(e2.target)) done();
    };
    list.addEventListener("click", (e2) => {
      const b2 = e2.target.closest("[data-b]");
      if (b2) done(b2.dataset.b);
    });
    list.addEventListener("mousemove", (e2) => {
      const b2 = e2.target.closest("[data-b]");
      if (b2 && !b2.classList.contains("act")) {
        list.querySelector(".act")?.classList.remove("act");
        b2.classList.add("act");
        act3 = [...list.querySelectorAll("[data-b]")].indexOf(b2);
      }
    });
    q3.addEventListener("input", () => {
      act3 = 0;
      draw();
    });
    q3.addEventListener("keydown", (e2) => {
      if (e2.key === "Escape") {
        e2.preventDefault();
        done();
      } else if (e2.key === "Enter") {
        e2.preventDefault();
        done(rows[act3]?.name);
      } else if (e2.key === "ArrowDown" || e2.key === "ArrowUp") {
        e2.preventDefault();
        act3 = Math.max(0, Math.min(rows.length - 1, act3 + (e2.key === "ArrowDown" ? 1 : -1)));
        draw();
      }
    });
    document.addEventListener("mousedown", away, true);
    draw();
    q3.focus();
  }
  var avUrl = (u3, n2) => `${u3}${u3.includes("?") ? "&" : "?"}s=${n2}`;
  function loadProfile() {
    if (!tauri) return;
    tauri.invoke("viewer_profile").then((p2) => {
      S.me = p2.login;
      S.profile = p2;
      try {
        localStorage.setItem("profile", JSON.stringify(p2));
      } catch {
      }
      render();
    }).catch(() => {
    });
  }
  var openExternal = (url) => tauri ? tauri.invoke("open_external", { url }) : window.open(url, "_blank");
  function openFromList(ref, newTab) {
    const have = S.tabs.some((t2) => t2.ref === ref);
    if (have && !S.focus) {
      if (ref === curRef()) {
        S.tabMenu = false;
        return;
      }
      return openTab(ref);
    }
    return newTab ? openTab(ref, { newTab: true }) : openPr(ref);
  }
  var stuckOn = null;
  function bindSticky() {
    const ta = $(".pr-title-area"), tb2 = $(".pr-tabs");
    if (ta && ta === stuckOn && S.ios?.length) return;
    stuckOn = ta;
    if (ta && tb2 && !$(".is-split")) {
      const io = new IntersectionObserver(([en]) => tb2.classList.toggle("stuck", !en.isIntersecting && en.boundingClientRect.bottom < 0), { root: $(".main"), threshold: 0 });
      io.observe(ta);
      S.ios.push(io);
    }
  }

  // src/app/palette.tsx
  var palHost = () => {
    let h2 = document.getElementById("pal");
    if (!h2) {
      h2 = document.createElement("div");
      h2.id = "pal";
      h2.style.display = "contents";
      document.body.appendChild(h2);
    }
    return h2;
  };
  var rowsFor = (raw) => {
    const q3 = raw.trim().toLowerCase();
    const rows = S.recent.filter((r2) => !q3 || `${r2.ref} ${r2.title}`.toLowerCase().includes(q3)).slice(0, 8).map((r2) => ({ ref: r2.ref, label: r2.title, sub: r2.ref }));
    if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q3)) rows.unshift({ ref: raw.trim(), label: `Open ${raw.trim()}`, sub: "Go to this pull request" });
    return rows;
  };
  function closePal() {
    S.pal = null;
    paintPal();
  }
  function go2(r2) {
    closePal();
    if (r2) {
      S.nav = false;
      S.focus = "";
      openPr(r2.ref);
    }
  }
  function paintPal() {
    const p2 = S.pal;
    if (!p2) {
      R(null, palHost());
      return;
    }
    if (p2.k === "help") {
      R(/* @__PURE__ */ u2(HelpDialog, { close: closePal }), palHost());
      return;
    }
    const rows = rowsFor(p2.q), sel = Math.min(p2.sel, Math.max(0, rows.length - 1));
    const onKey = (e2) => {
      if (e2.key === "Escape") closePal();
      else if (e2.key === "ArrowDown") {
        p2.sel = Math.min(rows.length - 1, sel + 1);
        paintPal();
        e2.preventDefault();
      } else if (e2.key === "ArrowUp") {
        p2.sel = Math.max(0, sel - 1);
        paintPal();
        e2.preventDefault();
      } else if (e2.key === "Enter") go2(rows[sel]);
    };
    R(/* @__PURE__ */ u2(Palette, { q: p2.q, rows, sel, onQ: (v2) => {
      p2.q = v2;
      p2.sel = 0;
      paintPal();
    }, onKey, pick: (i2) => go2(rows[i2]), close: closePal }), palHost());
  }
  function openPalette() {
    if (S.pal) return;
    S.pal = { k: "pal", q: "", sel: 0 };
    paintPal();
  }
  function showHelp() {
    if (S.pal) return;
    S.pal = { k: "help" };
    paintPal();
  }
  addEventListener("keydown", (e2) => {
    if (e2.key === "Escape" && S.pal?.k === "help") closePal();
  });

  // src/app/keyboard.ts
  var typing = (t2) => t2 && (t2.closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || t2.isContentEditable);
  var kbItems = () => [...qa(".main .tl-comment, .main .tc")].filter((e2) => e2.offsetParent);
  function kbGo(el) {
    if (!el) return;
    qa(".kb").forEach((x2) => x2.classList.remove("kb"));
    el.classList.add("kb");
    S.kbId = el.id;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  var kbCur = () => S.kbId && document.getElementById(S.kbId) || null;
  function kbStep(dir, pick = kbItems) {
    const items = pick(), cur = kbCur();
    if (!items.length) return;
    let i2 = cur ? items.indexOf(cur) : -1;
    if (i2 === -1 && cur) i2 = items.findIndex((e2) => cur.compareDocumentPosition(e2) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
    kbGo(items[Math.min(items.length - 1, Math.max(0, i2 + dir))]);
  }
  var openThreads = () => [...qa(".main .thread")].filter((t2) => !$(".thread-head .res", t2) && t2.offsetParent).map((t2) => $(".tc", t2)).filter(Boolean);
  function setComposer(open2, focus) {
    const el = document.getElementById("composer");
    if (!el) return false;
    S.cOpen = open2;
    el.classList.toggle("collapsed", !open2);
    if (open2 && focus) {
      let tries = 0;
      const t2 = setInterval(() => {
        const pm = $(".ProseMirror", el);
        if (pm) {
          pm.focus();
          clearInterval(t2);
        } else if (++tries > 25) clearInterval(t2);
      }, 60);
    }
    return true;
  }
  document.addEventListener("mousedown", (e2) => {
    if (S.tabMenu && !e2.target.closest(".pt-menu, #tabadd")) {
      S.tabMenu = false;
      rerender();
    }
  });
  document.addEventListener("keydown", (e2) => {
    if (S.tabMenu && e2.key === "Escape") {
      S.tabMenu = false;
      rerender();
      return;
    }
    if ((e2.metaKey || e2.ctrlKey) && !e2.altKey) {
      const k2 = e2.key.toLowerCase();
      if (k2 === "t" && !e2.shiftKey) {
        e2.preventDefault();
        S.tabMenu = !S.tabMenu;
        if (!S.tabs.length) S.tabMenu = true;
        rerender();
        return;
      }
      if (k2 === "t" && e2.shiftKey) {
        e2.preventDefault();
        reopenTab();
        return;
      }
      if (k2 === "w" && S.tabs.length && tabIdx() >= 0) {
        e2.preventDefault();
        closeTab(tabIdx());
        return;
      }
      if (/^[1-9]$/.test(k2) && S.tabs[+k2 - 1]) {
        e2.preventDefault();
        openTab(S.tabs[+k2 - 1].ref);
        return;
      }
      if (e2.key === "Tab" && e2.ctrlKey) {
        e2.preventDefault();
        stepTab(e2.shiftKey ? -1 : 1);
        return;
      }
    }
    if (e2.key === "Escape" && !e2.defaultPrevented && e2.target.closest?.("#composer") && !$(".tt-slash")) {
      e2.preventDefault();
      e2.target.blur?.();
      setComposer(false);
      return;
    }
    if ((e2.metaKey || e2.ctrlKey) && e2.key.toLowerCase() === "k") {
      e2.preventDefault();
      openPalette();
      return;
    }
    if (e2.metaKey || e2.ctrlKey || e2.altKey || typing(e2.target) || $(".palette, .dlg-bg")) return;
    if (e2.key === "j") kbStep(1);
    else if (e2.key === "k") kbStep(-1);
    else if (e2.key === "]") kbStep(1, openThreads);
    else if (e2.key === "[") kbStep(-1, openThreads);
    else if (e2.key === "?") showHelp();
    else if (e2.key === "n") {
      e2.preventDefault();
      openNewPr();
    } else if (e2.key === "c" && S.view === "pr" && document.getElementById("composer")) {
      e2.preventDefault();
      setComposer(true, true);
    } else if (e2.key === "f" && $(".split")) flipSides();
    else if (e2.key === "s" && S.bundle) {
      $("#split")?.click();
    } else if (e2.key === "d" && S.bundle) {
      const b2 = $(`[data-dmode="${S.diffMode === "split" ? "unified" : "split"}"]`);
      if (b2) b2.click();
      else {
        S.diffMode = S.diffMode === "split" ? "unified" : "split";
        localStorage.setItem("diffmode", S.diffMode);
      }
    } else if (e2.key === "r") {
      const cur = kbCur(), host = cur?.closest(".thread")?.querySelector(".reply .tt");
      if (!host) {
        if (document.getElementById("composer")) {
          e2.preventDefault();
          setComposer(true, true);
        }
        return;
      }
      e2.preventDefault();
      host.scrollIntoView({ block: "center", behavior: "smooth" });
      let tries = 0;
      const t2 = setInterval(() => {
        const pm = $(".ProseMirror", host);
        if (pm) {
          pm.focus();
          clearInterval(t2);
        } else if (++tries > 20) clearInterval(t2);
      }, 80);
    }
  });

  // src/app/actions.ts
  var peopleList = () => {
    const b2 = S.bundle;
    if (!b2) return [];
    const s2 = /* @__PURE__ */ new Set();
    [b2.pull.user, ...b2.timeline.map((e2) => e2.user || e2.actor || e2.author), ...b2.review_comments.map((c2) => c2.user)].forEach((u3) => u3?.login && s2.add(u3.login));
    return [...s2];
  };
  var drafts = load("drafts", {});
  function saveDrafts() {
    if (!S.draftRef) return;
    const d2 = Object.fromEntries(Object.entries(S.draft).filter(([, v2]) => v2 && v2.trim()));
    if (Object.keys(d2).length) drafts[S.draftRef] = d2;
    else delete drafts[S.draftRef];
    try {
      localStorage.setItem("drafts", JSON.stringify(drafts));
    } catch {
    }
  }
  var prRef = () => ({ repo: S.bundle.pull.base.repo.full_name, number: S.bundle.pull.number });
  var errMsg = (k2) => S.actErr && S.actErr.k === k2 ? S.actErr.m : "";
  function composerProps(b2) {
    const p2 = b2.pull, closed = p2.state === "closed", busy = S.busy === "comment";
    const open2 = busy || S.cOpen === true, dr = (S.draft.comment || "").trim();
    return { open: open2, draft: dr ? dr.replace(/\s+/g, " ").slice(0, 60) : "", err: errMsg("comment"), merged: !!p2.merged, closed, busy };
  }
  function mergeActProps(b2) {
    const p2 = b2.pull;
    if (p2.merged || p2.state === "closed") return null;
    const busy = S.busy === "merge", am = p2.auto_merge, blocked = p2.mergeable_state !== "clean" && p2.mergeable_state !== "unstable";
    const cur = am ? { MERGE: "merge", SQUASH: "squash", REBASE: "rebase" }[am.merge_method] || "merge" : "merge";
    return { draft: !!p2.draft, err: errMsg("merge"), method: cur, busy, auto: am ? { method: am.merge_method.toLowerCase(), busy: S.busy === "disable_automerge" } : null, canAuto: blocked, autoBusy: S.busy === "automerge", errAuto: errMsg("automerge") };
  }
  function closeDlg() {
    const d2 = S.dlg;
    if (!d2) return;
    if (d2.k === "editpr") delete S.draft.prbody;
    else if (d2.k === "editc") delete S.draft.editc;
    else if (d2.k === "commits") S.cpick = null;
    else if (d2.k === "token") S.oauthLive = false;
    S.dlg = null;
    render();
  }
  function reviewDialog() {
    S.dlg = { k: "review", ev: "COMMENT", ok: async () => {
      const ev = S.dlg.ev;
      const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
      const r2 = await act("review", { body: S.draft.review || "", event: ev, extra: lines }, "review", true);
      if (r2 === void 0) return;
      delete S.draft.review;
      delete S.pending[pendKey()];
      savePending();
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function editPrDialog() {
    const p2 = S.bundle.pull;
    S.draft.prbody = p2.body || "";
    S.dlg = { k: "editpr", title: p2.title, ok: async () => {
      const title = S.dlg.title;
      const r2 = await act("edit", { body: S.draft.prbody ?? "", extra: { title } }, "editpr", true);
      if (r2 === void 0) return;
      delete S.draft.prbody;
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function addPreview(host, key) {
    const tabs = document.createElement("div");
    tabs.className = "tt-tabs";
    tabs.innerHTML = '<button class="on" data-pv="write">Write</button><button data-pv="preview">Preview</button>';
    const pv = document.createElement("div");
    pv.className = "tt-preview markdown-body";
    pv.hidden = true;
    host.prepend(tabs);
    host.append(pv);
    const show = async (mode2) => {
      tabs.querySelectorAll("button").forEach((b2) => b2.classList.toggle("on", b2.dataset.pv === mode2));
      const prev = mode2 === "preview";
      host.querySelectorAll(".tt-bar, .tt-body").forEach((el) => {
        el.hidden = prev;
      });
      pv.hidden = !prev;
      host.classList.toggle("previewing", prev);
      if (!prev) {
        $(".tt-content", host)?.focus();
        return;
      }
      const md = (S.draft[key] || "").trim();
      if (!md) {
        pv.innerHTML = '<span class="empty">Nothing to preview</span>';
        return;
      }
      pv.innerHTML = '<span class="empty">Loading preview\u2026</span>';
      try {
        if (!tauri) throw new Error("offline");
        const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
        const html2 = await tauri.invoke("render_markdown", { text: md, repo });
        if (!pv.hidden) pv.innerHTML = html2;
      } catch (e2) {
        if (!pv.hidden) pv.innerHTML = `<pre class="pv-raw"></pre><div class="act-err">Couldn't render the preview (${esc(String(e2).replace(/^Error: /, ""))}). Showing the raw Markdown.</div>`, $(".pv-raw", pv).textContent = md;
      }
    };
    tabs.addEventListener("click", (e2) => {
      const m2 = e2.target.closest("[data-pv]")?.dataset.pv;
      if (m2) show(m2);
    });
  }
  function confirmDlg(title, text, label, danger, fn) {
    S.dlg = { k: "confirm", title, text, label, danger, ok: async () => {
      S.dlg = null;
      render();
      await fn();
    } };
    render();
  }
  document.addEventListener("click", (e2) => {
    S.lastBtn = e2.target.closest?.("button") || null;
  }, true);
  var btnSel = (b2) => {
    if (b2.id) return "#" + b2.id;
    const a2 = [...b2.attributes].find((x2) => x2.name.startsWith("data-"));
    return a2 ? `button[${a2.name}="${CSS.escape(a2.value)}"]` : null;
  };
  var setBusy = (b2, on3) => {
    if (!b2) return;
    b2.classList.toggle("is-busy", on3);
    b2.disabled = on3;
    b2.setAttribute("aria-busy", on3 ? "true" : "false");
  };
  S.mine = {};
  var getMine = (kind, rid) => S.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke("my_reactions", { ...prRef(), kind, id: +rid }).then((l2) => new Set(l2)).catch(() => {
    delete S.mine[`${kind}:${rid}`];
    return /* @__PURE__ */ new Set();
  }) : Promise.resolve(/* @__PURE__ */ new Set());
  async function toggleReact(kind, rid, c2) {
    const mine = (await getMine(kind, rid)).has(c2);
    const b2 = S.bundle, tgt = kind === "pr" ? b2.pull : [...b2.timeline, ...b2.review_comments].find((x2) => String(x2.id) === String(rid));
    const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null, base = prev ? prev[c2] || 0 : 0;
    const bump = (n2) => {
      if (tgt) tgt.reactions = { ...tgt.reactions || {}, [c2]: Math.max(0, base + n2) };
    };
    bump(mine ? -1 : 1);
    S.refreshing = true;
    rerender();
    const r2 = await act("react", { kind, id: +rid, content: c2 }, "react");
    if (r2 === void 0) {
      if (tgt && prev) tgt.reactions = prev;
      S.refreshing = false;
      rerender();
      return;
    }
    const set = await getMine(kind, rid);
    r2.added === false ? set.delete(c2) : set.add(c2);
    await refreshPr(kind === "pr" ? "" : rid);
  }
  async function act(action, args, key, inDialog = false) {
    const btn = S.lastBtn && document.contains(S.lastBtn) ? S.lastBtn : null;
    S.busySel = btn ? btnSel(btn) : null;
    setBusy(btn, true);
    try {
      return await act2(action, args, key, inDialog);
    } finally {
      S.busySel = null;
      setBusy(btn, false);
    }
  }
  async function act2(action, args, key, inDialog = false) {
    S.actErr = null;
    if (!tauri) {
      S.actErr = { k: key, m: "Writing needs the desktop app." };
      render();
      return void 0;
    }
    S.busy = key;
    if (!inDialog) render();
    try {
      const r2 = action === "react" ? await tauri.invoke("toggle_reaction", { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri.invoke("pr_action", { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
      S.busy = "";
      if (action === "merge" || action === "review" && args.event === "APPROVE") confetti();
      return r2 ?? {};
    } catch (e2) {
      S.busy = "";
      S.actErr = { k: key, m: String(e2).replace(/^Error: /, "") };
      render();
      return void 0;
    }
  }
  var refreshPr = (focus = "") => {
    qc.invalidate(`${prRef().repo}#${prRef().number}`);
    saveDrafts();
    S.focus = focus ? String(focus) : "";
    return openPr(`${prRef().repo}#${prRef().number}`, { nav: true, keepTab: true });
  };
  function editCommentDialog(c2, kind) {
    S.draft.editc = c2.body || "";
    S.dlg = { k: "editc", ok: async () => {
      const r2 = await act("edit_comment", { id: c2.id, kind, body: S.draft.editc ?? "" }, "editc", true);
      if (r2 === void 0) return;
      delete S.draft.editc;
      S.dlg = null;
      await refreshPr(c2.id);
    } };
    render();
  }
  function deleteCommentDialog(c2, kind) {
    S.dlg = { k: "delc", ok: async () => {
      const r2 = await act("delete_comment", { id: c2.id, kind }, "delc", true);
      if (r2 === void 0) return;
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function hideCommentDialog(c2) {
    const reasons = [["SPAM", "Spam"], ["ABUSE", "Abuse"], ["OFF_TOPIC", "Off-topic"], ["OUTDATED", "Outdated"], ["DUPLICATE", "Duplicate"], ["RESOLVED", "Resolved"]];
    S.dlg = { k: "hidec", reasons, ok: async () => {
      const r2 = await act("minimize", { body: c2.node_id || "", content: $("#hcreason").value }, "hidec", true);
      if (r2 === void 0) return;
      S.fold["c:" + c2.id] = true;
      localStorage.setItem("fold", JSON.stringify(S.fold));
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function cmAction(id, root, how) {
    const b2 = S.bundle, c2 = [...b2.timeline, ...b2.review_comments].find((x2) => String(x2.id) === String(id)) || (String(b2.pull.id) === String(id) ? b2.pull : null);
    if (!c2) return;
    if (how === "link") return navigator.clipboard?.writeText(c2.html_url || "");
    if (how === "md") return navigator.clipboard?.writeText(c2.body || "");
    const kind = c2 === b2.pull ? "pr" : b2.review_comments.includes(c2) ? "review_comment" : "issue_comment";
    if (how === "issue") {
      const r2 = prRef().repo;
      return openExternal(`https://github.com/${r2}/issues/new?body=${encodeURIComponent(`Reference: ${c2.html_url || ""}

`)}`);
    }
    if (how === "edit") return kind === "pr" ? editPrDialog() : editCommentDialog(c2, kind);
    if (how === "hide") return hideCommentDialog(c2);
    if (how === "del") return deleteCommentDialog(c2, kind);
    const key = root ? "reply-" + root : "comment", q3 = (c2.body || "").split("\n").map((l2) => "> " + l2).join("\n");
    S.draft[key] = (S.draft[key] ? S.draft[key] + "\n\n" : "") + `@${(c2.user || c2.actor || {}).login || ""}

${q3}

`;
    saveDrafts();
    S.eds = [];
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    setTimeout(() => $(`[data-draft="${key}"]`)?.scrollIntoView({ block: "center" }), 50);
  }
  function addLocal(kind, r2, rootId) {
    const b2 = S.bundle;
    if (!b2 || !r2 || !r2.id || !r2.body_html) return false;
    if (kind === "commented") b2.timeline.push({ ...r2, event: "commented", actor: r2.user });
    else {
      const root = b2.review_comments.find((c2) => c2.id === rootId);
      if (!root) return false;
      b2.review_comments.push({ ...r2, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position });
    }
    qc.set(`${prRef().repo}#${prRef().number}`, b2);
    qc.invalidate(`${prRef().repo}#${prRef().number}`);
    qc.m.get(`${prRef().repo}#${prRef().number}`).at = Date.now() - 2e4;
    S.focus = "";
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    const el = document.getElementById("c-" + r2.id);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash", "pop-in");
    }
    return true;
  }
  async function rerequestReview(e2, login) {
    const b2 = e2.currentTarget;
    e2.stopPropagation();
    b2.disabled = true;
    b2.classList.add("spin");
    const r2 = await act("rerequest", { body: login }, "rerequest");
    if (r2 === void 0) {
      b2.disabled = false;
      b2.classList.remove("spin");
      alert(S.actErr?.m || "Could not re-request review.");
      return;
    }
    await refreshPr();
  }
  function toggleComposer() {
    setComposer(document.getElementById("composer").classList.contains("collapsed"), true);
  }
  function cbarKey(e2) {
    if (e2.key === "Enter" || e2.key === " ") {
      e2.preventDefault();
      e2.currentTarget.click();
    }
  }
  async function sendComment() {
    const r2 = await act("comment", { body: S.draft.comment || "" }, "comment");
    if (r2 === void 0) return;
    delete S.draft.comment;
    S.cOpen = false;
    if (!addLocal("commented", r2)) await refreshPr(r2.id);
  }
  function toggleClosed() {
    const closed = S.bundle.pull.state === "closed";
    confirmDlg(closed ? "Reopen this pull request?" : "Close this pull request?", closed ? "It will be open for review again." : "It will be closed without merging. You can reopen it later.", closed ? "Reopen" : "Close pull request", !closed, async () => {
      const r2 = await act(closed ? "reopen" : "close", {}, "close");
      if (r2 !== void 0) await refreshPr();
    });
  }
  function toggleMb(e2, k2) {
    if (e2.target.closest("#rerunck")) return;
    S.mbOpen = S.mbOpen || /* @__PURE__ */ new Set();
    S.mbOpen.has(k2) ? S.mbOpen.delete(k2) : S.mbOpen.add(k2);
    rerender();
  }
  async function rerunChecks(e2) {
    e2.stopPropagation();
    const urls = (S.bundle.checks || []).filter((c2) => checkState(c2) === "fail" && c2.url).map((c2) => c2.url);
    setBusy(e2.currentTarget, true);
    const r2 = await act("rerun", { extra: urls }, "rerun");
    if (r2 !== void 0) {
      S.actErr = null;
      await refreshPr();
    } else setBusy(e2.currentTarget, false);
  }
  async function updateBranch() {
    const r2 = await act("update_branch", {}, "update_branch");
    if (r2 !== void 0) await refreshPr();
  }
  async function markReady() {
    const r2 = await act("ready", {}, "ready");
    if (r2 !== void 0) await refreshPr();
  }
  function toDraft() {
    confirmDlg("Convert to draft?", "Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.", "Convert to draft", false, async () => {
      const r2 = await act("draft", {}, "merge");
      if (r2 !== void 0) await refreshPr();
    });
  }
  async function enableAuto() {
    const r2 = await act("automerge", { method: $("#mmethod").value }, "automerge");
    if (r2 !== void 0) await refreshPr();
  }
  async function disableAuto() {
    const r2 = await act("disable_automerge", {}, "automerge");
    if (r2 !== void 0) await refreshPr();
  }
  function doMerge() {
    const m2 = $("#mmethod").value, p2 = S.bundle.pull, names = { merge: "merge commit", squash: "squash and merge", rebase: "rebase and merge" };
    confirmDlg("Merge this pull request?", `${p2.head.label} will be merged into ${p2.base.label} using ${names[m2]}. This changes the repository and cannot be undone from here.`, "Merge", false, async () => {
      const r2 = await act("merge", { method: m2 }, "merge");
      if (r2 !== void 0) await refreshPr();
    });
  }
  function cmMenu(e2, btn) {
    e2.stopPropagation();
    const bb = S.bundle, cc = String(bb.pull.id) === String(btn.dataset.cm) ? bb.pull : [...bb.timeline, ...bb.review_comments].find((x2) => String(x2.id) === String(btn.dataset.cm));
    const isPr = cc === bb.pull, own = !!S.me && (cc?.user || cc?.actor)?.login === S.me;
    const r2 = btn.getBoundingClientRect(), id = +btn.dataset.cm, root = btn.dataset.root;
    openPop({ k: "cm", x: Math.min(r2.left - 100, innerWidth - 180), y: r2.bottom + 4, hr: own || !isPr && !!S.hasToken, edit: own, hide: !isPr && !!S.hasToken, del: own && !isPr, pick: (h2) => {
      closePop();
      cmAction(id, root, h2);
    } });
  }
  function reactAdd(e2, btn) {
    e2.stopPropagation();
    const r2 = btn.getBoundingClientRect(), kind = btn.dataset.rk, id = btn.dataset.rid;
    openPop({ k: "react", x: Math.min(r2.left, innerWidth - 300), y: Math.min(r2.bottom + 4, innerHeight - 60), pick: (c2) => {
      closePop();
      toggleReact(kind, id, c2);
    } });
  }
  function reactToggle(e2, kind, id, c2) {
    e2.stopPropagation();
    toggleReact(kind, id, c2);
  }
  async function threadAct(e2, node, how) {
    e2.stopPropagation();
    const b2 = S.bundle, root = Object.keys(b2.thread_ids || {}).find((k2) => b2.thread_ids[k2] === node);
    const ids = [Number(root), ...b2.review_comments.filter((c2) => String(c2.in_reply_to_id) === String(root)).map((c2) => c2.id)].filter(Boolean);
    const prev = [...b2.resolved_ids || []], res = how === "resolve";
    b2.resolved_ids = res ? [.../* @__PURE__ */ new Set([...prev, ...ids])] : prev.filter((x2) => !ids.includes(x2));
    rerender();
    const r2 = await act(how, { body: node }, "thread", true);
    if (r2 === void 0) {
      b2.resolved_ids = prev;
      rerender();
      alert(S.actErr?.m || "Could not update the thread.");
      return;
    }
    refreshPr();
  }
  function applySuggestion(e2, id) {
    e2.stopPropagation();
    const b2 = S.bundle, c2 = b2.review_comments.find((x2) => String(x2.id) === id);
    if (!c2) return;
    confirmDlg("Apply suggestion?", `This commits the change to ${c2.path} on ${b2.pull.head.ref}.`, "Commit suggestion", false, async () => {
      (S.applied ||= /* @__PURE__ */ new Set()).add(String(c2.id));
      rerender();
      const r2 = await act("suggest", { extra: { head_repo: b2.pull.head.repo.full_name, branch: b2.pull.head.ref, path: c2.path, line: c2.line, start_line: c2.start_line || null, text: sugOf(c2) } }, "sug", true);
      if (r2 === void 0) {
        S.applied.delete(String(c2.id));
        rerender();
        alert(S.actErr?.m || "Could not apply the suggestion.");
        return;
      }
      refreshPr().finally(() => {
        S.applied.delete(String(c2.id));
      });
    });
  }
  async function sendReply(id) {
    const r2 = await act("reply", { id: +id, body: S.draft["reply-" + id] || "" }, "reply-" + id);
    if (r2 === void 0) return;
    delete S.draft["reply-" + id];
    if (!addLocal("reply", r2, +id)) await refreshPr(r2.id);
  }
  function setDiffMode(m2) {
    S.diffMode = m2;
    localStorage.setItem("diffmode", m2);
    rerender();
  }
  function lcOpen(e2) {
    e2.stopPropagation();
    S.lcOpen = e2.currentTarget.dataset.lc;
    rerender();
    setTimeout(() => S.eds?.at(-1)?.focus?.(), 200);
  }
  function lcCancel() {
    S.lcOpen = "";
    delete S.draft.lc;
    saveDrafts();
    rerender();
  }
  function lcSuggest(ev) {
    const cur = (S.draft.lc || "").trimEnd();
    S.draft.lc = `${cur}${cur ? "\n\n" : ""}\`\`\`suggestion
${ev.currentTarget.dataset.code}
\`\`\`
`;
    saveDrafts();
    rerender();
    setTimeout(() => S.eds?.at(-1)?.focus?.(), 150);
  }
  function lcAdd() {
    const body = (S.draft.lc || "").trim();
    if (!body || !S.lcOpen) return;
    const [path, side, line] = S.lcOpen.split("");
    (S.pending[pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body });
    savePending();
    S.lcOpen = "";
    delete S.draft.lc;
    saveDrafts();
    rerender();
  }
  function lcDel(id) {
    S.pending[pendKey()] = pendList().filter((c2) => String(c2.id) !== id);
    savePending();
    rerender();
  }
  var rerender = () => {
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var mounted = /* @__PURE__ */ new WeakSet();
  function mountEditors() {
    qa(".tt[data-draft]").forEach((host) => {
      if (mounted.has(host)) return;
      mounted.add(host);
      const key = host.dataset.draft;
      if (!window.createEditor) {
        host.innerHTML = '<div class="act-err">Editor failed to load.</div>';
        return;
      }
      const send = () => (key === "comment" ? $("#docomment") : key === "lc" ? $("#lcadd") : key === "newpr" ? $("#npcreate") : key.startsWith("reply-") ? $(`[data-sendreply="${key.slice(6)}"]`) : $("#revsubmit"))?.click();
      const mount = () => {
        (S.eds ||= []).push(window.createEditor(host, { value: S.draft[key] || "", placeholder: host.dataset.ph, people: peopleList(), onChange: (md) => {
          S.draft[key] = md;
          saveDrafts();
        }, onSubmit: send }));
        addPreview(host, key);
      };
      const io = new IntersectionObserver((en) => {
        if (en.some((x2) => x2.isIntersecting)) {
          io.disconnect();
          if (host.isConnected) mount();
        }
      }, { rootMargin: "300px" });
      io.observe(host);
    });
  }

  // src/app/nav.ts
  async function loadRepos() {
    S.reposErr = "";
    S.repos = null;
    try {
      S.repos = await tauri.invoke("list_repos");
    } catch (e2) {
      S.reposErr = String(e2);
      if (/401|Bad credentials|requires authentication/i.test(S.reposErr)) {
        S.hasToken = false;
        S.gateErr = "GitHub rejected the saved token (expired or revoked). Sign in again.";
      }
    }
    render();
  }
  async function openRepo(name, { nav = false } = {}) {
    S.view = "repo";
    S.pAuthor = S.pLabel = S.pStatus = "";
    S.repo = name;
    S.prs = null;
    S.error = "";
    S.bundle = nav && S.bundle ? S.bundle : S.bundle;
    if (!nav) {
      S.hist = S.hist.slice(0, S.hi + 1);
      S.hist.push("repo:" + name);
      S.hi = S.hist.length - 1;
    }
    S.sideTab = "prs";
    render();
    refreshPushes(name);
    try {
      S.prs = tauri ? await tauri.invoke("list_prs", { repo: name, state: S.prState }) : [];
    } catch (e2) {
      S.error = String(e2);
      S.prs = [];
    }
    render();
  }
  async function loadPrs() {
    const name = S.repo, ck = `${name}|${S.prState}`;
    S.prCache = S.prCache || {};
    const hit = S.prCache[ck];
    if (hit) {
      S.prs = hit.list;
      if (Date.now() - hit.at < 6e4) {
        rerender();
        return;
      }
    } else S.prs = null;
    rerender();
    try {
      const r2 = tauri ? await tauri.invoke("list_prs", { repo: name, state: S.prState }) : [];
      S.prCache[ck] = { list: r2, at: Date.now() };
      if (S.repo === name) S.prs = r2;
    } catch (e2) {
      if (S.repo === name && !hit) S.prs = [];
    }
    if (S.repo === name) rerender();
  }
  var reload = () => S.view === "repo" ? openRepo(S.repo, { nav: true }) : S.bundle && openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true, manual: true });
  async function openPr(input, { nav = false, keepTab = false, manual = false, newTab = false, restore = "" } = {}) {
    {
      const bm = String(input).match(/^([^#\s@]+\/[^#\s@]+)@(.+)$/);
      if (bm) return openNewPr(bm[1], bm[2]);
    }
    const fromTab = S.view === "pr" ? tabIdx() : -1, tabSwitch = !!(restore || S.fadeMain);
    const seq = S.openSeq = (S.openSeq || 0) + 1, stale_ = () => S.openSeq !== seq;
    if (!keepTab && !restore) tabSnap();
    S.tabPending = "";
    if (!keepTab) {
      const m2 = String(input).match(/^([^#\s@\/]+\/[^#\s@]+)#(\d+)$/) || String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
      if (m2) {
        const ref = `${m2[1]}#${m2[2]}`;
        S.tabPending = ref;
        if (!S.tabs.some((t2) => t2.ref === ref)) {
          const old = S.recent.find((r2) => r2.ref === ref), item = { ref, title: old?.title || "Loading\u2026", state: old?.state || "open", icon: old?.icon || "git-pull-request", tab: restore || "conversation", dot: false };
          if (fromTab >= 0 && !newTab) S.tabs[fromTab] = item;
          else S.tabs.splice(fromTab >= 0 ? fromTab + 1 : S.tabs.length, 0, item);
          S.tabs = S.tabs.slice(-15);
        }
      }
    }
    S.error = "";
    S.view = "pr";
    if (!keepTab) S.tab = restore || "conversation";
    S.sel = null;
    if (!keepTab) S.fr = null;
    if (keepTab && S.focus && S.tab === "files") S.focus = "";
    if (keepTab && tauri) await tauri.invoke("invalidate_pr", { url: input }).catch(() => {
    });
    const mem = qc.peek(input);
    const disk = mem || (tauri && !keepTab ? await tauri.invoke("cached_pr", { url: input }).then((b2) => b2 && { data: b2 }).catch(() => null) : null);
    const fresh = !!mem && qc.fresh(input) && !keepTab, stale = !!disk && !fresh;
    const had = fresh || stale || keepTab && S.bundle;
    if (fresh) {
      S.bundle = mem.data;
      S.loading = false;
    } else if (disk) {
      S.bundle = disk.data;
      S.refreshing = false;
      S.loading = false;
    } else if (keepTab && S.bundle) {
      S.refreshing = manual;
      S.loading = false;
    } else S.loading = true;
    const hot = fresh;
    S.keepScroll = keepTab;
    render();
    S.keepScroll = false;
    if (!keepTab && !restore && $(".main")) $(".main").scrollTop = 0;
    const focusNow = () => {
      if (!S.bundle || !S.focus) return false;
      if (S.tab !== "conversation" && S.tab !== "timeline") {
        S.tab = "conversation";
        render();
      }
      const el = document.getElementById("c-" + S.focus);
      if (!el) return false;
      S.flashId = S.focus;
      S.flashUntil = Date.now() + 2500;
      S.focus = "";
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
      return true;
    };
    const focused = focusNow();
    try {
      const got = hot ? mem.data : await qc.fetch(input, () => loadPr(input));
      if (stale_()) return;
      S.bundle = got;
      const p2 = got.pull, ref = `${p2.base.repo.full_name}#${p2.number}`, [st, ic] = stateOf(p2);
      if (!nav) {
        S.hist = S.hist.slice(0, S.hi + 1);
        S.hist.push(ref);
        S.hi = S.hist.length - 1;
      }
      S.recent = [{ ref, title: p2.title, state: st, icon: ic }, ...S.recent.filter((r2) => r2.ref !== ref)].slice(0, 30);
      localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
      localStorage.setItem("last", ref);
      remember(ref, p2);
      if (!keepTab || tabIdx() >= 0) tabPut(ref, p2, { at: fromTab, newTab });
      const ti = S.tabs.find((t2) => t2.ref === ref);
      if (ti) {
        ti.dot = false;
        saveTabs();
      }
      if (S.repo !== p2.base.repo.full_name) {
        S.repo = p2.base.repo.full_name;
        S.sideTab = "prs";
        setTimeout(loadPrs, 0);
      }
      if (S.draftRef !== ref) {
        saveDrafts();
        S.draftRef = ref;
        S.draft = { ...drafts[ref] || {} };
      }
    } catch (e2) {
      if (stale_()) return;
      if (!had) S.bundle = null;
      S.error = String(e2).replace(/^Error: /, "");
    }
    S.tabPending = "";
    S.loading = false;
    S.refreshing = false;
    const savedScroll = restore ? S.tabs[tabIdx()]?.scroll || 0 : 0;
    S.restoring = !!savedScroll;
    S.keepScroll = focused || keepTab;
    render();
    S.keepScroll = false;
    if (savedScroll) {
      const put = () => {
        const m2 = $(".main");
        if (m2) m2.scrollTop = savedScroll;
      };
      put();
      requestAnimationFrame(put);
      setTimeout(() => {
        put();
        S.restoring = false;
      }, 250);
    }
    if (!keepTab && !stale && !focused && !S.flashId && !tabSwitch) enterAnim();
    if (S.bundle && !stale && !keepTab && !focused) $(".main").scrollTop = 0;
    if (S.bundle && S.focus) {
      const id = S.focus;
      S.focus = "";
      if (S.tab !== "conversation" && S.tab !== "timeline") {
        S.tab = "conversation";
        render();
      }
      const el = document.getElementById("c-" + id);
      if (el) {
        S.flashId = id;
        S.flashUntil = Date.now() + 2500;
        el.scrollIntoView({ block: "start" });
        el.classList.add("flash");
      }
    }
  }

  // src/app/listeners.ts
  if (window.__TAURI__ && window.__TAURI__.event) window.__TAURI__.event.listen("notif-click", (e2) => {
    const { ref, target } = e2.payload || {};
    if (!ref) return;
    S.nav = false;
    S.bell = false;
    S.focus = target || "";
    openPr(ref);
  });
  addEventListener("offline", () => {
    S.offline = true;
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  });
  addEventListener("online", () => {
    S.offline = false;
    if (S.bundle && S.view === "pr") openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true });
    else render();
  });

  // src/app/boot.ts
  var q2 = new URLSearchParams(location.search);
  if (q2.get("mode")) S.mode = q2.get("mode");
  if (q2.get("tab")) S.tab = q2.get("tab");
  if (q2.get("split")) S.split = q2.get("split") === "1";
  if (tauri) tauri.invoke("has_token").then((v2) => {
    S.hasToken = v2;
    S.authChecked = true;
    render();
    if (v2) {
      loadRepos();
      loadProfile();
    }
  }).catch(() => {
    S.authChecked = true;
    S.hasToken = false;
    render();
  });
  render();
  if (q2.get("fixture")) openPr(q2.get("fixture")).then(() => {
    if (q2.get("tab")) {
      S.tab = q2.get("tab");
      render();
    }
  });
  else if (tauri) tauri.invoke("initial_arg").then((arg) => {
    if (arg) openPr(arg);
    else {
      S.view = "home";
      render();
    }
  });
  setInterval(pollNotes, 6e4);
  setTimeout(pollNotes, 4e3);
  addEventListener("focus", () => {
    const b2 = S.bundle;
    if (!tauri || !b2 || S.view !== "pr" || S.loading || S.refreshing) return;
    const k2 = `${b2.pull.base.repo.full_name}#${b2.pull.number}`;
    if (!qc.fresh(k2, 6e4)) openPr(k2, { nav: true, keepTab: true });
  });
  setTimeout(pollNotes, 8e3);
  if (new URLSearchParams(location.search).get("demonote")) {
    S.notes = [{ id: 1, ref: "octocat/Hello-World#6", title: "New line at end of file.", text: "3 new commits, 2 new comments", at: (/* @__PURE__ */ new Date()).toISOString(), read: false }, { id: 2, ref: "octocat/Hello-World#6", title: "New line at end of file.", text: "now merged", at: new Date(Date.now() - 36e5).toISOString(), read: true }];
    S.bell = true;
    render();
  }
  async function checkUpdate() {
    const up = window.__TAURI__?.updater;
    if (!up || S.update?.busy) return;
    try {
      const u3 = await up.check();
      if (u3) {
        S.update = { version: u3.version, obj: u3 };
        render();
      }
    } catch {
    }
  }
  if (tauri) {
    setTimeout(checkUpdate, 6e3);
    setInterval(checkUpdate, 6 * 3600 * 1e3);
  }
  (() => {
    let target = null, btn = null, lastTop = 0, atEnd = false, auto = false;
    const ensure = () => {
      if (btn) return btn;
      btn = document.createElement("button");
      btn.id = "totop";
      btn.title = "Back to top";
      btn.setAttribute("aria-label", "Back to top");
      btn.innerHTML = icon("chevron-up");
      btn.hidden = true;
      btn.onclick = () => {
        (target && document.contains(target) ? target : $(".main"))?.scrollTo({ top: 0, behavior: "smooth" });
      };
      document.body.appendChild(btn);
      return btn;
    };
    document.addEventListener("scroll", (e2) => {
      const el = e2.target;
      if (!(el instanceof Element) || !el.matches(".main, .pane-body")) return;
      target = el;
      ensure().hidden = el.scrollTop < 600;
      const c2 = document.getElementById("composer");
      if (!c2 || !el.contains(c2)) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight, up = el.scrollTop < lastTop;
      lastTop = el.scrollTop;
      if (dist < 24 && !atEnd) {
        atEnd = true;
        if (c2.classList.contains("collapsed")) {
          setComposer(true, false);
          auto = true;
        }
      }
      if (dist > c2.offsetHeight + 60) {
        atEnd = false;
        if (up && !c2.classList.contains("collapsed") && !(S.draft.comment || "").trim()) {
          c2.contains(document.activeElement) && document.activeElement.blur();
          setComposer(false);
        }
      }
    }, true);
    document.addEventListener("keydown", (e2) => {
      if (e2.key === "Home" && !e2.target.closest?.("input, textarea, select, [contenteditable]") && target) {
        e2.preventDefault();
        target.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  })();
})();
