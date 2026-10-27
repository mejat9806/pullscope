"use strict";
(() => {
  // src/app/core.ts
  var tauri = window.__TAURI__ && window.__TAURI__.core;
  var $ = (s3, r3 = document) => r3.querySelector(s3);
  var qa = (s3, r3 = document) => [...r3.querySelectorAll(s3)];
  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var esc = (s3) => String(s3 ?? "").replace(/[&<>"']/g, (c3) => ESC[c3]);
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function whenParts(iso, lead = "on ") {
    const d3 = new Date(iso), now = /* @__PURE__ */ new Date(), diff = (+now - +d3) / 1e3;
    const abs = `${MONTHS[d3.getUTCMonth()]} ${d3.getUTCDate()}${d3.getUTCFullYear() !== now.getUTCFullYear() ? ", " + d3.getUTCFullYear() : ""}`;
    const title = d3.toUTCString();
    let t3;
    if (diff < 30 * 86400 && diff >= 0) {
      const n2 = (v3, u4) => `${v3} ${u4}${v3 === 1 ? "" : "s"} ago`;
      t3 = diff < 60 ? "now" : diff < 3600 ? n2(Math.floor(diff / 60), "minute") : diff < 86400 ? n2(Math.floor(diff / 3600), "hour") : n2(Math.floor(diff / 86400), "day");
      return { title, text: t3 };
    }
    return { title, text: `${lead}${abs}` };
  }
  function when(iso, lead = "on ") {
    const w3 = whenParts(iso, lead);
    return `<span title="${w3.title}">${w3.text}</span>`;
  }
  var ASSOC = { CONTRIBUTOR: "Contributor", MEMBER: "Member", OWNER: "Owner", COLLABORATOR: "Collaborator", FIRST_TIME_CONTRIBUTOR: "First-time contributor", FIRST_TIMER: "First-timer", MANNEQUIN: "Mannequin" };
  var REACTS = [["+1", "\u{1F44D}"], ["-1", "\u{1F44E}"], ["laugh", "\u{1F604}"], ["hooray", "\u{1F389}"], ["confused", "\u{1F615}"], ["heart", "\u2764\uFE0F"], ["rocket", "\u{1F680}"], ["eyes", "\u{1F440}"]];
  var load = (k3, d3) => {
    try {
      return JSON.parse(localStorage.getItem(k3) ?? "null") ?? d3;
    } catch {
      return d3;
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
    const d3 = document.documentElement, dark = isDark();
    d3.setAttribute("data-color-mode", dark ? "dark" : "light");
    d3.setAttribute("data-light-theme", "light");
    d3.setAttribute("data-dark-theme", "dark");
    d3.setAttribute("data-t", dark ? "dark" : "light");
  }
  var KEY_RECENT = "recent";
  var flashLive = () => !!S.flash && Date.now() < S.flashUntil;
  var flashFor = (id) => S.flash && S.flash.id === id && flashLive() ? { n: S.flash.n, block: S.flash.block, smooth: S.flash.smooth, pop: S.flash.pop } : void 0;
  var setFlash = (id, o3) => {
    S.flash = { id, n: (S.flash?.n || 0) + 1, ...o3 };
    S.flashUntil = Date.now() + 2500;
  };

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
  function m(n2, l3) {
    for (var u4 in l3) n2[u4] = l3[u4];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l3, u4, t3) {
    var i3, r3, o3, e3 = {};
    for (o3 in u4) "key" == o3 ? i3 = u4[o3] : "ref" == o3 ? r3 = u4[o3] : e3[o3] = u4[o3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
    return x(l3, e3, i3, r3, null);
  }
  function x(n2, t3, i3, r3, o3) {
    var e3 = { type: n2, props: t3, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e3), e3;
  }
  function S2(n2) {
    return n2.children;
  }
  function C(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function $2(n2, l3) {
    if (null == l3) return n2.__ ? $2(n2.__, n2.__i + 1) : null;
    for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
    return "function" == typeof n2.type ? $2(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u4 = n2.__v, t3 = u4.__e, i3 = [], r3 = [], o3 = m({}, u4);
      o3.__v = u4.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u4, n2.__n, n2.__P.namespaceURI, 32 & u4.__u ? [t3] : null, i3, null == t3 ? $2(u4) : t3, !!(32 & u4.__u), r3), o3.__v = u4.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u4.__e = u4.__ = null, o3.__e != t3 && P(o3);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l3) {
      if (null != l3 && null != l3.__e) return n2.__e = n2.__c.base = l3.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l3 = 1; i.length; ) i.length > l3 && i.sort(e), n2 = i.shift(), l3 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l3, u4, t3, i3, r3, o3, e3, f4, c3, a3) {
    var s3, h3, p3, v3, y3, _3, g2 = t3 && t3.__k || w, m3 = l3.length;
    for (f4 = T(u4, l3, g2, f4, m3), s3 = 0; s3 < m3; s3++) null != (p3 = u4.__k[s3]) && (h3 = -1 != p3.__i && g2[p3.__i] || d, p3.__i = s3, _3 = q(n2, p3, h3, i3, r3, o3, e3, f4, c3, a3), v3 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), a3.push(p3.ref, p3.__c || v3, p3)), null == y3 && null != v3 && (y3 = v3), 4 & p3.__u ? (f4 = j(p3, f4, n2), h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _3 ? f4 = _3 : v3 && (f4 = v3.nextSibling), p3.__u &= -7);
    return u4.__e = y3, f4;
  }
  function T(n2, l3, u4, t3, i3) {
    var r3, o3, e3, f4, c3, a3 = u4.length, s3 = a3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S2, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f4 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = O(o3, u4, f4, s3)) && (s3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (s3) for (r3 = 0; r3 < a3; r3++) null != (e3 = u4[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = $2(e3)), K(e3, e3));
    return t3;
  }
  function j(n2, l3, u4) {
    var t3, i3;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++) t3[i3] && (t3[i3].__ = n2, l3 = j(t3[i3], l3, u4));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !l3.parentNode && (l3 = $2(n2)), l3 = u4.insertBefore(n2.__e, l3 || null));
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function O(n2, l3, u4, t3) {
    var i3, r3, o3, e3 = n2.key, f4 = n2.type, c3 = l3[u4], a3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e3 || a3 && e3 == c3.key && f4 == c3.type) return u4;
    if (t3 > (a3 ? 1 : 0)) {
      for (i3 = u4 - 1, r3 = u4 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f4 == c3.type) return o3;
    }
    return -1;
  }
  function z(n2, l3, u4) {
    "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || _.test(l3) ? u4 : u4 + "px";
  }
  function N(n2, l3, u4, t3, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || z(n2.style, l3, "");
      if (u4) for (l3 in u4) t3 && u4[l3] == t3[l3] || z(n2.style, l3, u4[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(s, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u4, u4 ? t3 ? u4[a] = t3[a] : (u4[a] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u4 ? "" : u4;
        break n;
      } catch (n3) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
    }
  }
  function V(n2) {
    return function(u4) {
      if (this.l) {
        var t3 = this.l[u4.type + n2];
        if (null == u4[c]) u4[c] = h++;
        else if (u4[c] < t3[a]) return;
        return t3(l.event ? l.event(u4) : u4);
      }
    };
  }
  function q(n2, u4, t3, i3, r3, o3, e3, f4, c3, a3) {
    var s3, h3, p3, v3, y3, d3, _3, k3, x2, M, I3, P2, A3, H2, T3, j3, F = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f4 = u4.__e = t3.__e]), (s3 = l.__b) && s3(u4);
    n: if ("function" == typeof F) {
      h3 = e3.length;
      try {
        if (x2 = u4.props, M = F.prototype && F.prototype.render, I3 = (s3 = F.contextType) && i3[s3.__c], P2 = s3 ? I3 ? I3.props.value : s3.__ : i3, t3.__c ? k3 = (p3 = u4.__c = t3.__c).__ = p3.__E : (M ? u4.__c = p3 = new F(x2, P2) : (u4.__c = p3 = new C(x2, P2), p3.constructor = F, p3.render = Q), I3 && I3.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v3 = p3.__d = true, p3.__h = [], p3._sb = []), M && null == p3.__s && (p3.__s = p3.state), M && null != F.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, F.getDerivedStateFromProps(x2, p3.__s))), y3 = p3.props, d3 = p3.state, p3.__v = u4, v3) M && null == F.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x2 !== y3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x2, P2), u4.__v == t3.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x2, p3.__s, P2)) {
            u4.__v != t3.__v && (p3.props = x2, p3.state = p3.__s, p3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
              n3 && (n3.__ = u4);
            }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e3.push(p3), f4 = $2(t3);
            break n;
          }
          null != p3.componentWillUpdate && p3.componentWillUpdate(x2, p3.__s, P2), M && null != p3.componentDidUpdate && p3.__h.push(function() {
            p3.componentDidUpdate(y3, d3, _3);
          });
        }
        if (p3.context = P2, p3.props = x2, p3.__P = n2, p3.__e = false, A3 = l.__r, H2 = 0, M) p3.state = p3.__s, p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), w.push.apply(p3.__h, p3._sb), p3._sb = [];
        else do {
          p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
        } while (p3.__d && ++H2 < 25);
        p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M && !v3 && null != p3.getSnapshotBeforeUpdate && (_3 = p3.getSnapshotBeforeUpdate(y3, d3)), T3 = null != s3 && s3.type === S2 && null == s3.key ? E(s3.props.children) : s3, f4 = L(n2, g(T3) ? T3 : [T3], u4, t3, i3, r3, o3, e3, f4, c3, a3), p3.base = u4.__e, u4.__u &= -161, p3.__h.length && e3.push(p3), k3 && (p3.__E = p3.__ = null);
      } catch (n3) {
        if (e3.length = h3, u4.__v = null, c3 || null != o3) {
          if (n3.then) {
            for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
            null != o3 && (o3[o3.indexOf(f4)] = null), u4.__e = f4;
          } else if (null != o3) for (j3 = o3.length; j3--; ) b(o3[j3]);
        } else u4.__e = t3.__e;
        null == u4.__k && (u4.__k = t3.__k || []), n3.then || B(u4), l.__e(n3, u4, t3);
      }
    } else null == o3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = G(t3.__e, u4, t3, i3, r3, o3, e3, c3, a3);
    return (s3 = l.diffed) && s3(u4), 128 & u4.__u ? void 0 : f4;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u4, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) J(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u4, n2), n2.some(function(u5) {
      try {
        n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
          n3.call(u5);
        });
      } catch (n3) {
        l.__e(n3, u5.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
  }
  function G(u4, t3, i3, r3, o3, e3, f4, c3, a3) {
    var s3, h3, p3, v3, y3, w3, _3, m3 = i3.props || d, k3 = t3.props, x2 = t3.type;
    if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (s3 = 0; s3 < e3.length; s3++) if ((y3 = e3[s3]) && "setAttribute" in y3 == !!x2 && (x2 ? y3.localName == x2 : 3 == y3.nodeType)) {
        u4 = y3, e3[s3] = null;
        break;
      }
    }
    if (null == u4) {
      if (null == x2) return document.createTextNode(k3);
      u4 = document.createElementNS(o3, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x2) m3 === k3 || c3 && u4.data == k3 || (u4.data = k3);
    else {
      if (e3 = "textarea" == x2 && null != k3.defaultValue ? null : e3 && n.call(u4.childNodes), !c3 && null != e3) for (m3 = {}, s3 = 0; s3 < u4.attributes.length; s3++) m3[(y3 = u4.attributes[s3]).name] = y3.value;
      for (s3 in m3) y3 = m3[s3], "dangerouslySetInnerHTML" == s3 ? p3 = y3 : "children" == s3 || s3 in k3 || "value" == s3 && "defaultValue" in k3 || "checked" == s3 && "defaultChecked" in k3 || N(u4, s3, null, y3, o3);
      for (s3 in k3) y3 = k3[s3], "children" == s3 ? v3 = y3 : "dangerouslySetInnerHTML" == s3 ? h3 = y3 : "value" == s3 ? w3 = y3 : "checked" == s3 ? _3 = y3 : c3 && "function" != typeof y3 || m3[s3] === y3 || N(u4, s3, y3, m3[s3], o3);
      if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u4.innerHTML) || (u4.innerHTML = h3.__html), t3.__k = [];
      else if (p3 && (u4.innerHTML = ""), L("template" == t3.type ? u4.content : u4, g(v3) ? v3 : [v3], t3, i3, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f4, e3 ? e3[0] : i3.__k && $2(i3, 0), c3, a3), null != e3) for (s3 = e3.length; s3--; ) b(e3[s3]);
      c3 && "textarea" != x2 || (s3 = "value", "progress" == x2 && null == w3 ? u4.removeAttribute("value") : null != w3 && (w3 !== u4[s3] || "progress" == x2 && !w3 || "option" == x2 && w3 != m3[s3]) && N(u4, s3, w3, m3[s3], o3), s3 = "checked", null != _3 && _3 != u4[s3] && N(u4, s3, _3, m3[s3], o3));
    }
    return u4;
  }
  function J(n2, u4, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u4 || (n2.__u = n2(u4));
      } else n2.current = u4;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function K(n2, u4, t3) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u4)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u4);
      }
      i3.base = i3.__P = i3.__n = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u4, t3 || "function" != typeof n2.type);
    t3 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l3, u4) {
    return this.constructor(n2, u4);
  }
  function R(u4, t3, i3) {
    var r3, o3, e3, f4;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f4 = [], q(t3, u4 = (!r3 && i3 || t3).__k = k(S2, null, [u4]), o3 || d, d, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f4), D(e3, u4, f4), u4.props.children = null;
  }
  n = w.slice, l = { __e: function(n2, l3, u4, t3) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), o3 = i3.__d), o3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, C.prototype.setState = function(n2, l3) {
    var u4;
    u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u4), this.props)), n2 && m(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S2, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m2 = c2.unmount;
  var p2 = c2.__;
  function s2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
  }
  function d2(n2) {
    return o2 = 1, y2(D2, n2);
  }
  function y2(n2, u4, i3) {
    var o3 = s2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u4) : D2(void 0, u4), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f4 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u5 = false, i4 = o3.__c.props !== n3;
        if (o3.__c.__H.__.some(function(n4) {
          if (n4.__N) {
            u5 = true;
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3) {
          var f5 = c3.call(this, n3, t3, r3);
          return u5 ? f5 || i4 : f5;
        }
        return !u5 || i4;
      };
      r2.__f = true;
      var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u5 = c3;
          c3 = void 0, f4(n3, t3, r3), c3 = u5;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f4;
    }
    return o3.__N || o3.__;
  }
  function h2(n2, u4) {
    var i3 = s2(t2++, 3);
    !c2.__s && C2(i3.__H, u4) && (i3.__ = n2, i3.u = u4, r2.__H.__h.push(i3));
  }
  function _2(n2, u4) {
    var i3 = s2(t2++, 4);
    !c2.__s && C2(i3.__H, u4) && (i3.__ = n2, i3.u = u4, r2.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u4 = s2(t2++, 7);
    return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) {
      var t3 = n2.__H;
      if (n2.__P && t3) try {
        t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], c2.__e(r3, n2.__v);
      }
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), p2 && p2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
      n3.u && (n3.__H = n3.u, n3.u = void 0);
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.some(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u4 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u4 = n2.__c;
    "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f3 = 0;
  function u3(e3, t3, n2, o3, i3, u4) {
    t3 || (t3 = {});
    var a3, c3, p3 = t3;
    if ("ref" in p3) for (c3 in p3 = {}, t3) "ref" == c3 ? a3 = t3[c3] : p3[c3] = t3[c3];
    var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
    if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
    return l.vnode && l.vnode(l3), l3;
  }

  // src/components/ui.tsx
  var I2 = (name, size, cls) => /* @__PURE__ */ u3(Icon, { n: name, s: size, c: cls });
  var Av = (u4, s3 = 40) => /* @__PURE__ */ u3(Avatar, { u: u4, s: s3 });
  var When = (t3, lead) => /* @__PURE__ */ u3(WhenText, { t: t3, lead });
  var SP = " ";
  var Icon = ({ n: n2, s: s3 = 16, c: c3 = "" }) => /* @__PURE__ */ u3("svg", { class: `octicon ${c3}`, viewBox: `0 0 ${s3} ${s3}`, width: s3, height: s3, "aria-hidden": "true", dangerouslySetInnerHTML: { __html: (window.OCTICONS || {})[n2 + (s3 === 24 ? "-24" : "")] || "" } });
  var Avatar = ({ u: u4, s: s3 = 40 }) => /* @__PURE__ */ u3("img", { class: "av", src: `${u4?.avatar_url || ""}${u4?.avatar_url ? (u4.avatar_url.includes("?") ? "&" : "?") + "s=" + s3 * 2 : ""}`, width: s3, height: s3, alt: `@${u4?.login || "ghost"}`, style: "border-radius:50%;display:block" });
  var WhenText = ({ t: t3, lead }) => {
    const w3 = whenParts(t3, lead);
    return /* @__PURE__ */ u3("span", { title: w3.title, children: w3.text });
  };

  // src/components/req.ts
  var reqs = /* @__PURE__ */ new Map();
  var subs = /* @__PURE__ */ new Map();
  function request(id, r3 = {}) {
    reqs.set(id, { ...r3, n: (reqs.get(id)?.n || 0) + 1 });
    subs.get(id)?.forEach((f4) => f4());
  }
  function useOnRequest(id, apply, layout = false) {
    const [, tick] = d2(0), r3 = reqs.get(id), seen2 = A2(r3?.n), act3 = A2(apply);
    act3.current = apply;
    h2(() => {
      const f4 = () => tick((t3) => t3 + 1);
      let s3 = subs.get(id);
      if (!s3) subs.set(id, s3 = /* @__PURE__ */ new Set());
      s3.add(f4);
      if (reqs.get(id)?.n !== seen2.current && reqs.get(id)?.n !== r3?.n) f4();
      return () => {
        s3.delete(f4);
      };
    }, [id]);
    (layout ? _2 : h2)(() => {
      if (r3 && r3.n !== seen2.current) {
        seen2.current = r3.n;
        act3.current(r3);
      }
    }, [r3?.n]);
  }
  function useScroller(id, layout = false) {
    const ref = A2(null);
    useOnRequest("scroll:" + id, (r3) => ref.current?.scrollTo({ top: r3.top || 0, behavior: r3.smooth ? "smooth" : "auto" }), layout);
    return ref;
  }
  var scrollTarget = (id, top, smooth) => request("scroll:" + id, { top, smooth });
  function useFocusTarget(id) {
    const ref = A2(null);
    useOnRequest("focus:" + id, (r3) => {
      const el = ref.current;
      if (!el) return;
      if (r3.a === "blur") el.blur();
      else {
        el.focus();
        if (r3.a === "select") el.select();
      }
    });
    return ref;
  }
  var focusTarget = (id, a3) => request("focus:" + id, { a: a3 });
  var reveal = (key) => request("reveal:" + key);
  function useReveal(key) {
    const ref = A2(null);
    useOnRequest("reveal:" + key, () => {
      const box = ref.current, main = box?.closest(".main");
      if (!box || !main) return;
      const r3 = box.getBoundingClientRect(), m3 = main.getBoundingClientRect();
      if (r3.bottom > m3.bottom - 8 || r3.top < m3.top) box.scrollIntoView({ block: r3.height > m3.height * 0.85 ? "start" : "center", behavior: "smooth" });
    });
    return ref;
  }

  // src/components/Actions.tsx
  var ErrLine = ({ m: m3 }) => m3 ? /* @__PURE__ */ u3("div", { class: "act-err", children: m3 }) : null;
  var editorMount = { fn: null, preview: null, focus: null };
  function DraftBox({ k: k3, ph, rows, submit }) {
    const ref = A2(null);
    const [mode2, setMode] = d2("write"), [pv, setPv] = d2(null);
    useOnRequest("draft:submit:" + k3, () => submit?.());
    useOnRequest("draft:scroll:" + k3, () => ref.current?.scrollIntoView({ block: "center", behavior: "smooth" }));
    useOnRequest("draft:focus:" + k3, () => editorMount.focus?.(k3));
    useOnRequest("draft:blur:" + k3, () => ref.current?.querySelector(".tt-content")?.blur());
    const hint = `${ph} \u2014 type / for blocks`;
    h2(() => editorMount.fn ? editorMount.fn(ref.current, k3, hint) : void 0, []);
    const show = (m3) => {
      setMode(m3);
      if (m3 === "write") return;
      setPv("loading");
      editorMount.preview?.(k3).then(setPv);
    };
    const first = A2(true);
    h2(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (mode2 === "write") ref.current?.querySelector(".tt-content")?.focus();
    }, [mode2]);
    const prev = mode2 === "preview";
    return /* @__PURE__ */ u3("div", { class: `tt${prev ? " previewing" : ""}`, "data-draft": k3, "data-ph": hint, style: `--rows:${rows}`, children: [
      /* @__PURE__ */ u3("div", { class: "tt-tabs", children: [
        /* @__PURE__ */ u3("button", { class: prev ? "" : "on", onClick: () => show("write"), children: "Write" }),
        /* @__PURE__ */ u3("button", { class: prev ? "on" : "", onClick: () => show("preview"), children: "Preview" })
      ] }),
      /* @__PURE__ */ u3("div", { class: "tt-ed", ref }),
      prev ? /* @__PURE__ */ u3("div", { class: "tt-preview markdown-body", children: pv === "loading" ? /* @__PURE__ */ u3("span", { class: "empty", children: "Loading preview\u2026" }) : !pv ? /* @__PURE__ */ u3("span", { class: "empty", children: "Nothing to preview" }) : "html" in pv ? /* @__PURE__ */ u3("div", { dangerouslySetInnerHTML: { __html: pv.html } }) : /* @__PURE__ */ u3(S2, { children: [
        /* @__PURE__ */ u3("pre", { class: "pv-raw", children: pv.raw }),
        /* @__PURE__ */ u3("div", { class: "act-err", children: [
          "Couldn't render the preview (",
          pv.err,
          "). Showing the raw Markdown."
        ] })
      ] }) }) : null
    ] });
  }
  function Composer(p3) {
    const { on: on3 } = p3, box = A2(null);
    _2(() => {
      const el = box.current, pane = el.closest(".pane-body");
      on3?.measure({ h: el.offsetHeight, in: pane ? pane.closest(".pane-l") ? "l" : "r" : "main" });
      return () => on3?.measure(null);
    });
    return /* @__PURE__ */ u3("div", { ref: box, class: `composer dock${p3.open ? "" : " collapsed"}`, id: "composer", children: [
      /* @__PURE__ */ u3("div", { class: "composer-h", id: "cbar", role: "button", tabindex: 0, title: "Write a comment (C)", onClick: on3?.toggle, onKeyDown: on3?.key, children: [
        I2("comment"),
        /* @__PURE__ */ u3("b", { children: "Add a comment" }),
        /* @__PURE__ */ u3("span", { class: "cbar-ph", children: p3.draft ? `Draft: ${p3.draft}` : "Write a comment\u2026" }),
        /* @__PURE__ */ u3("kbd", { children: "C" }),
        /* @__PURE__ */ u3("span", { class: "cbar-x", children: I2("chevron-down") })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "composer-body", children: [
        /* @__PURE__ */ u3(DraftBox, { k: "comment", ph: "Write a comment\u2026 (Markdown supported)", rows: 4, submit: p3.busy ? void 0 : on3?.send }),
        /* @__PURE__ */ u3(ErrLine, { m: p3.err }),
        "\n  ",
        /* @__PURE__ */ u3("div", { class: "composer-f", children: [
          /* @__PURE__ */ u3("span", { class: "hint", children: "\u2318\u21B5 to send \xB7 Esc to collapse" }),
          /* @__PURE__ */ u3("span", { style: "flex:1" }),
          "\n  ",
          p3.merged ? "" : /* @__PURE__ */ u3("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: p3.closed ? "Reopen pull request" : "Close pull request" }),
          "\n  ",
          /* @__PURE__ */ u3("button", { class: "btn primary", id: "docomment", disabled: p3.busy, onClick: on3?.send, children: p3.busy ? "Sending\u2026" : "Comment" })
        ] })
      ] })
    ] });
  }
  var METHODS = [["merge", "Create a merge commit"], ["squash", "Squash and merge"], ["rebase", "Rebase and merge"]];
  function MergeAct(p3) {
    const { on: on3 } = p3;
    if (p3.draft) return /* @__PURE__ */ u3("div", { class: "merge-act", children: [
      /* @__PURE__ */ u3("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: "Close pull request" }),
      /* @__PURE__ */ u3(ErrLine, { m: p3.err })
    ] });
    return /* @__PURE__ */ u3("div", { class: "merge-act", children: [
      /* @__PURE__ */ u3("select", { class: "sel", id: "mmethod", onChange: on3?.method, children: METHODS.map(([v3, t3]) => /* @__PURE__ */ u3("option", { value: v3, selected: p3.method === v3, children: t3 })) }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "domerge", disabled: p3.busy, onClick: on3?.merge, children: p3.busy ? "Merging\u2026" : "Merge pull request" }),
      "\n  ",
      p3.auto ? /* @__PURE__ */ u3("button", { class: "btn", id: "noauto", title: `Auto-merge is on (${p3.auto.method})`, onClick: on3?.noauto, children: p3.auto.busy ? "Turning off\u2026" : "Disable auto-merge" }) : p3.canAuto ? /* @__PURE__ */ u3("button", { class: "btn", id: "doauto", title: "Merge automatically once required checks and reviews pass", onClick: on3?.auto, children: p3.autoBusy ? "Enabling\u2026" : "Enable auto-merge" }) : "",
      "\n  ",
      /* @__PURE__ */ u3("button", { class: "btn ghost", id: "todraft", title: "Mark as draft again", onClick: on3?.draft, children: "Convert to draft" }),
      /* @__PURE__ */ u3(ErrLine, { m: p3.err }),
      /* @__PURE__ */ u3(ErrLine, { m: p3.errAuto })
    ] });
  }

  // src/components/Shell.tsx
  var Main = (p3) => {
    const ref = useScroller("main", true);
    return /* @__PURE__ */ u3("div", { class: p3.cls, ref, onScroll: p3.onScroll, children: /* @__PURE__ */ u3("div", { id: "page", style: "display:contents", onClick: p3.onPage, children: p3.children }) });
  };
  var Shell = (p3) => /* @__PURE__ */ u3(S2, { children: [
    /* @__PURE__ */ u3("div", { class: `shell ${p3.nav ? "nav-open" : ""} ${p3.navHidden ? "nav-hidden" : ""}${p3.enter ? " entering" : ""}`, style: `--sbw:${p3.sbw}px;--lw:${p3.lw}%`, children: [
      /* @__PURE__ */ u3("div", { id: "side", style: "display:contents", children: p3.side }),
      /* @__PURE__ */ u3("div", { class: "sb-grip", id: "sbgrip", title: "Drag to resize \xB7 double-click to reset", onMouseDown: p3.onGrip, onDblClick: p3.onGripReset }),
      /* @__PURE__ */ u3("div", { class: "scrim", id: "scrim", onClick: p3.onScrim }),
      [p3.active, ...p3.kept].map((k3, i3) => i3 === 0 ? /* @__PURE__ */ u3(Main, { cls: `main${p3.fade ? " tab-in" : ""}${p3.stuck ? " stuck" : ""}`, onScroll: p3.onScroll, onPage: p3.onPage, children: k3.children }, k3.key) : /* @__PURE__ */ u3("div", { class: "main-off", style: "display:none", children: /* @__PURE__ */ u3("div", { style: "display:contents", children: k3.children }) }, k3.key))
    ] }),
    /* @__PURE__ */ u3("div", { id: "dlg", style: "display:contents", children: p3.dlg }),
    /* @__PURE__ */ u3("div", { id: "notehost", style: "display:contents", children: p3.notes })
  ] });

  // src/app/frame.tsx
  var slots = { top: null, side: null, dlg: null, notes: null, pop: null, pal: null, ovl: null, totop: null };
  var globals = null;
  var drag = null;
  var setGlobals = (g2) => {
    globals = g2;
  };
  var beginDrag = (d3) => {
    drag = d3;
    repaint();
  };
  var gate = null;
  var shell = null;
  var held = 0;
  var Frame = () => {
    _2(() => {
      applyMode();
    });
    h2(() => {
      const g3 = globals;
      if (!g3) return;
      addEventListener("keydown", g3.key);
      addEventListener("focus", g3.focus);
      addEventListener("online", g3.online);
      addEventListener("offline", g3.offline);
      return () => {
        removeEventListener("keydown", g3.key);
        removeEventListener("focus", g3.focus);
        removeEventListener("online", g3.online);
        removeEventListener("offline", g3.offline);
      };
    }, []);
    const d3 = drag;
    _2(() => {
      if (!d3) return;
      const up = () => {
        removeEventListener("mousemove", d3.move);
        removeEventListener("mouseup", up);
        drag = null;
        d3.end();
      };
      addEventListener("mousemove", d3.move);
      addEventListener("mouseup", up);
      return () => {
        removeEventListener("mousemove", d3.move);
        removeEventListener("mouseup", up);
      };
    }, [d3]);
    const g2 = globals;
    return /* @__PURE__ */ u3("div", { id: "frame", class: S.dragging ? "dragging" : "", style: "display:contents", onPointerDown: g2?.pointerDown, onClickCapture: g2?.clickCapture, onClick: g2?.click, onMouseDown: g2?.mouseDown, children: [
      /* @__PURE__ */ u3("div", { id: "top", style: "display:contents", children: slots.top }),
      /* @__PURE__ */ u3("div", { id: "rest", style: "display:contents", children: gate ? /* @__PURE__ */ u3(S2, { children: [
        gate,
        /* @__PURE__ */ u3("div", { id: "dlg", style: "display:contents", children: slots.dlg })
      ] }) : shell ? /* @__PURE__ */ u3(Shell, { ...shell, side: slots.side, dlg: slots.dlg, notes: slots.notes }) : null }),
      /* @__PURE__ */ u3("div", { id: "pop", style: "display:contents", children: slots.pop }),
      /* @__PURE__ */ u3("div", { id: "pal", style: "display:contents", children: slots.pal }),
      /* @__PURE__ */ u3("div", { id: "ovl", style: "display:contents", children: slots.ovl }),
      /* @__PURE__ */ u3("div", { style: "display:contents", children: slots.totop })
    ] });
  };
  function repaint() {
    if (held) return;
    const app = document.getElementById("app");
    R(/* @__PURE__ */ u3(Frame, {}), app);
  }
  var setSlot = (name, v3) => {
    slots[name] = v3;
    repaint();
  };
  function batch(fn) {
    held++;
    try {
      fn();
    } finally {
      held--;
      repaint();
    }
  }
  var setGate = (v3) => {
    gate = v3;
    shell = v3 ? null : shell;
    repaint();
  };
  var setShell = (p3) => {
    shell = p3;
    gate = null;
    repaint();
  };
  var shellProps = () => shell;
  function setDragging(on3) {
    S.dragging = on3;
    repaint();
  }

  // src/components/Overlays.tsx
  var ProfPop = (p3) => /* @__PURE__ */ u3("div", { class: "react-pop cm-pop prof-pop", style: `right:${p3.right}px;top:${p3.top}px`, children: [
    /* @__PURE__ */ u3("div", { class: "pp-h", children: [
      /* @__PURE__ */ u3("img", { src: p3.avatar, alt: "" }),
      /* @__PURE__ */ u3("div", { children: [
        /* @__PURE__ */ u3("b", { children: p3.name }),
        /* @__PURE__ */ u3("i", { children: [
          "@",
          p3.login
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u3("button", { "data-h": "profile", onClick: () => p3.pick("profile"), children: [
      I2("link-external"),
      " Your GitHub profile"
    ] }),
    /* @__PURE__ */ u3("button", { "data-h": "token", onClick: () => p3.pick("token"), children: [
      I2("key"),
      " Access token\u2026"
    ] }),
    /* @__PURE__ */ u3("button", { "data-h": "out", class: "danger", onClick: () => p3.pick("out"), children: "Sign out" })
  ] });
  function AcPop(p3) {
    const ref = A2(null);
    h2(() => {
      ref.current?.querySelector(".on")?.scrollIntoView({ block: "nearest" });
    });
    return /* @__PURE__ */ u3(
      "div",
      {
        id: "acpop",
        class: "acpop",
        ref,
        style: `left:${p3.left}px;top:${p3.top}px;width:${p3.width}px`,
        onMouseDown: (e3) => {
          e3.preventDefault();
          const r3 = e3.target.closest(".ac-row");
          if (r3) p3.pick(p3.rows[+r3.dataset.i]);
        },
        children: p3.rows.map((r3, i3) => /* @__PURE__ */ u3("div", { class: `ac-row${i3 === p3.sel ? " on" : ""}`, "data-i": i3, children: [
          /* @__PURE__ */ u3("span", { class: `ac-i ${r3.state || ""}`, children: I2(r3.ic) }),
          /* @__PURE__ */ u3("span", { class: "ac-t", children: [
            /* @__PURE__ */ u3("b", { children: r3.label }),
            /* @__PURE__ */ u3("i", { children: r3.sub })
          ] })
        ] }))
      }
    );
  }
  function BpPop(p3) {
    const [q3, setQ] = d2(""), [act3, setAct] = d2(0);
    const ref = A2(null), inp = A2(null);
    const groups = p3.groupsFor(q3.trim()), rows = groups.flatMap(([, l3]) => l3), a3 = Math.max(0, Math.min(act3, rows.length - 1));
    h2(() => {
      inp.current?.focus();
    }, []);
    h2(() => {
      ref.current?.querySelector(".act")?.scrollIntoView({ block: "nearest" });
    });
    let i3 = 0;
    return /* @__PURE__ */ u3("div", { id: "bppop", class: "bp-pop", ref, style: p3.style, children: [
      /* @__PURE__ */ u3(
        "input",
        {
          class: "bp-q",
          ref: inp,
          placeholder: p3.repoMode ? "Filter repositories\u2026" : "Filter branches\u2026",
          spellcheck: false,
          value: q3,
          onInput: (e3) => {
            setQ(e3.target.value);
            setAct(0);
          },
          onKeyDown: (e3) => {
            if (e3.key === "Escape") {
              e3.preventDefault();
              p3.done();
            } else if (e3.key === "Enter") {
              e3.preventDefault();
              p3.done(rows[a3]?.name);
            } else if (e3.key === "ArrowDown" || e3.key === "ArrowUp") {
              e3.preventDefault();
              setAct(Math.max(0, Math.min(rows.length - 1, a3 + (e3.key === "ArrowDown" ? 1 : -1))));
            }
          }
        }
      ),
      /* @__PURE__ */ u3("div", { class: "bp-list", children: groups.length && rows.length ? groups.map(([h3, l3]) => /* @__PURE__ */ u3(S2, { children: [
        h3 ? /* @__PURE__ */ u3("div", { class: "bp-h", children: [
          h3,
          /* @__PURE__ */ u3("span", { children: l3.length })
        ] }) : "",
        l3.map((x2) => {
          const idx = i3++;
          return /* @__PURE__ */ u3("div", { class: `bp-r${idx === a3 ? " act" : ""}${x2.name === p3.cur ? " cur" : ""}`, "data-b": x2.name, onClick: () => p3.done(x2.name), onMouseMove: () => {
            if (idx !== a3) setAct(idx);
          }, children: [
            /* @__PURE__ */ u3("span", { class: "bp-ck", children: x2.name === p3.cur ? "\u2713" : "" }),
            /* @__PURE__ */ u3("span", { class: "bp-n", children: x2.name }),
            x2.by ? /* @__PURE__ */ u3("span", { class: "bp-by", children: x2.by }) : "",
            /* @__PURE__ */ u3("span", { class: "bp-t", children: p3.age(x2.at) })
          ] });
        })
      ] })) : /* @__PURE__ */ u3("div", { class: "bp-empty", children: "No matches" }) })
    ] });
  }
  function Confetti({ w: w3, h: h3, done }) {
    const ref = A2(null);
    h2(() => {
      const c3 = ref.current, g2 = c3.getContext("2d"), cols = ["#0969da", "#1f883d", "#8250df", "#f2cc60", "#cf222e", "#ff8fb1"];
      const ps = Array.from({ length: 160 }, () => ({ x: w3 / 2, y: h3 * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[Math.random() * cols.length | 0] }));
      let t3 = 0, raf = 0;
      const f4 = () => {
        g2.clearRect(0, 0, c3.width, c3.height);
        t3++;
        ps.forEach((p3) => {
          p3.vy += 0.35;
          p3.vx *= 0.99;
          p3.x += p3.vx;
          p3.y += p3.vy;
          p3.a += p3.va;
          g2.save();
          g2.translate(p3.x, p3.y);
          g2.rotate(p3.a);
          g2.fillStyle = p3.c;
          g2.globalAlpha = Math.max(0, 1 - t3 / 130);
          g2.fillRect(-p3.r, -p3.r / 2, p3.r * 2, p3.r);
          g2.restore();
        });
        if (t3 < 130) raf = requestAnimationFrame(f4);
        else done();
      };
      f4();
      return () => cancelAnimationFrame(raf);
    }, []);
    return /* @__PURE__ */ u3("canvas", { class: "confetti", ref, width: w3, height: h3 });
  }
  var FxLayer = ({ items, drop }) => /* @__PURE__ */ u3(S2, { children: items.map((f4) => f4.k === "rip" ? /* @__PURE__ */ u3("div", { style: `position:fixed;z-index:999;overflow:hidden;pointer-events:none;left:${f4.l}px;top:${f4.t}px;width:${f4.w}px;height:${f4.h}px;border-radius:${f4.radius};color:${f4.color}`, children: /* @__PURE__ */ u3("span", { class: "ripple", style: `width:${f4.d}px;height:${f4.d}px;left:${f4.x}px;top:${f4.y}px` }) }, f4.id) : f4.k === "burst" ? /* @__PURE__ */ u3("span", { class: "burst", style: `left:${f4.x}px;top:${f4.y}px;--dx:${f4.dx}px;--dy:${f4.dy}px`, children: f4.ch }, f4.id) : /* @__PURE__ */ u3(Confetti, { w: f4.w, h: f4.h, done: () => drop(f4.id) }, f4.id)) });

  // src/app/overlay.tsx
  var OV = { ac: null, bp: null, fx: [] };
  var paintOv = () => setSlot("ovl", /* @__PURE__ */ u3(S2, { children: [
    OV.ac && /* @__PURE__ */ u3(AcPop, { ...OV.ac }),
    OV.bp && /* @__PURE__ */ u3(BpPop, { ...OV.bp }),
    /* @__PURE__ */ u3(FxLayer, { items: OV.fx, drop: fxDrop })
  ] }));
  var fxId = 0;
  function fxDrop(id) {
    OV.fx = OV.fx.filter((f4) => f4.id !== id);
    paintOv();
  }
  function fxAdd(f4, ms = 0) {
    const id = ++fxId;
    OV.fx = [...OV.fx, { ...f4, id }];
    paintOv();
    if (ms) setTimeout(() => fxDrop(id), ms);
  }

  // src/components/NotePanel.tsx
  var NotePanel = ({ open: open2, rows, on: on3 }) => /* @__PURE__ */ u3("div", { class: `note-panel${open2 ? " open" : ""}`, children: [
    /* @__PURE__ */ u3("div", { class: "note-h", children: [
      /* @__PURE__ */ u3("b", { children: "Notifications" }),
      /* @__PURE__ */ u3("span", { children: [
        /* @__PURE__ */ u3("button", { id: "noteall", onClick: on3.all, children: "View all" }),
        " ",
        /* @__PURE__ */ u3("button", { id: "notecheck", onClick: on3.check, children: "Check now" }),
        " ",
        /* @__PURE__ */ u3("button", { id: "noteclear", onClick: on3.clear, children: "Clear all" })
      ] })
    ] }),
    rows.length ? rows.map((n2) => /* @__PURE__ */ u3("a", { class: `note ${n2.read ? "" : "new"}`, "data-open": n2.ref, "data-target": n2.target, onClick: on3.open, onAuxClick: on3.aux, onContextMenu: on3.ctx, children: [
      /* @__PURE__ */ u3("b", { children: n2.title }),
      /* @__PURE__ */ u3("span", { children: n2.text }),
      /* @__PURE__ */ u3("i", { children: [
        n2.ref,
        " \xB7 ",
        n2.when
      ] })
    ] })) : /* @__PURE__ */ u3("div", { class: "note-empty", children: "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." })
  ] });

  // src/components/flash.ts
  var flashClass = (f4) => f4 ? ` flash${f4.pop ? " pop-in" : ""}` : "";
  function useFlash(f4, kb) {
    const ref = A2(null);
    h2(() => {
      if (f4) ref.current?.scrollIntoView({ block: f4.block, behavior: f4.smooth ? "smooth" : "auto" });
    }, [f4?.n]);
    h2(() => {
      if (kb) ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, [kb]);
    return ref;
  }

  // src/components/Comments.tsx
  var NL = "\n  ";
  function Who({ p: p3, st }) {
    const plural2 = p3.commits === 1 ? "" : "s";
    return st === "merged" ? /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("a", { class: "author", style: "text-decoration:underline;text-underline-offset:2px", href: p3.merged_by.html_url, children: p3.merged_by.login }),
      " merged ",
      p3.commits,
      " commit",
      plural2,
      " into"
    ] }) : /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("a", { class: "author", href: p3.user.html_url, children: p3.user.login }),
      " wants to merge ",
      p3.commits,
      " commit",
      plural2,
      " into"
    ] });
  }
  function PrHeader({ b: b2, st, ic, label, tab, split, hideSide: hideSide2, splitOk, commentsTotal, sq, on: on3 }) {
    const p3 = b2.pull, n2 = p3.number;
    const at = st === "merged" ? p3.merged_at : st === "closed" ? p3.closed_at : p3.created_at;
    const tabs = [["conversation", "comment-discussion", "Conversation", commentsTotal + 0], ["timeline", "clock", "Timeline", b2.timeline.length], ["commits", "git-commit", "Commits", p3.commits], ["checks", "checklist", "Checks", (b2.checks || []).length], ["files", "file-diff", "Files changed", p3.changed_files]];
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("div", { class: "pr-title-area", children: [
        /* @__PURE__ */ u3("h1", { class: "pr-title", children: [
          /* @__PURE__ */ u3("span", { children: p3.title }),
          /* @__PURE__ */ u3("span", { class: "num", children: [
            "#",
            n2
          ] }),
          p3.state === "open" && !p3.merged ? /* @__PURE__ */ u3("button", { class: "copy-btn", id: "editpr", onClick: on3?.edit, title: "Edit title and description", children: I2("pencil") }) : ""
        ] }),
        NL,
        /* @__PURE__ */ u3("div", { class: "pr-meta", children: [
          /* @__PURE__ */ u3("span", { class: `state-pill state-${st}`, children: [
            I2(ic),
            SP,
            label
          ] }),
          /* @__PURE__ */ u3("span", { children: /* @__PURE__ */ u3(Who, { p: p3, st }) }),
          SP,
          /* @__PURE__ */ u3("span", { class: "branch", title: `${p3.base.repo.full_name}:${p3.base.ref}`, children: p3.base.label }),
          SP,
          /* @__PURE__ */ u3("span", { children: "from" }),
          SP,
          /* @__PURE__ */ u3("span", { class: "branch", children: p3.head.label }),
          /* @__PURE__ */ u3("button", { class: "copy-btn", id: "copybranch", onClick: on3?.copy, "aria-label": "Copy head branch name to clipboard", children: I2("copy") }),
          /* @__PURE__ */ u3("span", { children: When(at) })
        ] })
      ] }),
      NL,
      /* @__PURE__ */ u3("div", { class: "pr-tabs", children: [
        /* @__PURE__ */ u3("span", { class: "mini", title: p3.title, children: [
          /* @__PURE__ */ u3("b", { children: [
            "#",
            n2
          ] }),
          SP,
          p3.title
        ] }),
        /* @__PURE__ */ u3("nav", { children: tabs.map(([k3, i3, t3, c3]) => /* @__PURE__ */ u3("a", { "data-tab": k3, class: tab === k3 ? "sel" : "", onClick: () => on3?.tab(k3), children: [
          I2(i3),
          t3,
          /* @__PURE__ */ u3("span", { class: "counter", children: c3 })
        ] })) }),
        NL,
        /* @__PURE__ */ u3("div", { class: "tools", children: [
          /* @__PURE__ */ u3("button", { class: "split-btn", id: "review", onClick: on3?.review, title: "Submit a review", children: [
            I2("eye"),
            /* @__PURE__ */ u3("span", { children: "Review" })
          ] }),
          /* @__PURE__ */ u3("button", { class: `split-btn ${hideSide2 || split ? "" : "on"}`, id: "sidetoggle", onClick: on3?.side, title: "Show or hide the details panel", disabled: tab !== "conversation" || split, style: tab !== "conversation" ? "visibility:hidden" : "", children: [
            I2("sidebar-expand"),
            /* @__PURE__ */ u3("span", { children: "Details" })
          ] }),
          /* @__PURE__ */ u3("button", { class: `split-btn ${splitOk && split ? "on" : ""}`, id: "split", onClick: on3?.split, title: splitOk ? "Split view: commits beside conversation" : "Split view is available on the Conversation and Commits tabs", disabled: !splitOk, children: [
            I2("columns"),
            /* @__PURE__ */ u3("span", { children: "Split view" })
          ] }),
          /* @__PURE__ */ u3("div", { class: "diffstat", children: [
            /* @__PURE__ */ u3("span", { class: "add", children: [
              "+",
              p3.additions
            ] }),
            /* @__PURE__ */ u3("span", { class: "del", children: [
              "-",
              p3.deletions
            ] }),
            /* @__PURE__ */ u3("span", { class: "sq", children: sq.map((c3) => /* @__PURE__ */ u3("i", { class: c3 })) })
          ] })
        ] })
      ] })
    ] });
  }
  function FoldBtn({ k: k3, title, def, folded: folded2, onFold }) {
    return /* @__PURE__ */ u3("button", { ref: useReveal(k3), class: "fold-btn", "data-fold": k3, "data-def": def ? 1 : 0, title, onClick: onFold && ((e3) => onFold(e3, k3, def)), children: I2(folded2 ? "chevron-right" : "chevron-down") });
  }
  function ReactionsBar({ r: r3, kind, id, defs, on: on3 }) {
    const live2 = !!(kind && id);
    const items = defs.filter(({ k: k3 }) => (r3?.[k3] ?? 0) > 0).map(({ k: k3, e: e3 }) => live2 ? /* @__PURE__ */ u3("span", { class: "reaction rc-btn", "data-rck": kind, "data-rcid": id, "data-rcc": k3, title: "Click to add or remove your reaction", onClick: on3 && ((ev) => on3.toggle(ev, kind, id, k3)), onMouseEnter: on3 && (() => on3.hover(kind, id)), children: [
      /* @__PURE__ */ u3("span", { class: "e", children: e3 }),
      /* @__PURE__ */ u3("span", { children: r3?.[k3] })
    ] }) : /* @__PURE__ */ u3("span", { class: "reaction", children: [
      /* @__PURE__ */ u3("span", { class: "e", children: e3 }),
      /* @__PURE__ */ u3("span", { children: r3?.[k3] })
    ] }));
    const add = live2 ? /* @__PURE__ */ u3("span", { class: "react-wrap", children: /* @__PURE__ */ u3("button", { class: "react-add", "data-rk": kind, "data-rid": id, title: "Add reaction", onClick: on3 && ((ev) => on3.add(ev, ev.currentTarget)), onMouseEnter: on3 && (() => on3.hover(kind, id)), children: I2("smiley") }) }) : null;
    return items.length || add ? /* @__PURE__ */ u3("div", { class: "reactions", children: [
      items,
      add
    ] }) : null;
  }
  function CommentBox({ onTask, kb, flash, c: c3, assoc, bodyHtml, folded: folded2, reactions, flush, on: on3 }) {
    const u4 = c3.user || c3.actor, k3 = "c:" + c3.id;
    const ref = useFlash(flash, kb);
    return /* @__PURE__ */ u3("div", { ref, class: `tl-comment${folded2 ? " folded" : ""}${kb ? " kb" : ""}${flashClass(flash)}`, id: `c-${c3.id ?? ""}`, style: flush ? "margin-bottom:0" : void 0, children: [
      /* @__PURE__ */ u3("div", { class: "avatar-col", children: /* @__PURE__ */ u3("a", { href: u4?.html_url, children: Av(u4, 40) }) }),
      NL,
      /* @__PURE__ */ u3("div", { class: "cbox", children: [
        /* @__PURE__ */ u3("div", { class: "chead", children: [
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3(FoldBtn, { k: k3, title: "Hide this comment", def: false, folded: folded2, onFold: on3?.fold }),
            SP,
            /* @__PURE__ */ u3("a", { class: "author u", href: u4?.html_url, children: /* @__PURE__ */ u3("span", { class: "author", style: "font-weight:600;color:var(--fgColor-default)", children: u4?.login || "ghost" }) }),
            " commented",
            SP,
            /* @__PURE__ */ u3("a", { class: "ts", href: c3.html_url || "#", children: When(c3.created_at || c3.submitted_at) })
          ] }),
          NL,
          /* @__PURE__ */ u3("div", { class: "rt", children: [
            assoc ? /* @__PURE__ */ u3("span", { class: "assoc", children: assoc }) : "",
            /* @__PURE__ */ u3("button", { class: "cm-btn", "data-cm": c3.id, title: "Comment actions", onClick: on3 && ((e3) => on3.menu(e3, e3.currentTarget)), children: "\u22EF" })
          ] })
        ] }),
        NL,
        /* @__PURE__ */ u3("div", { class: "cbody", children: bodyHtml ? /* @__PURE__ */ u3("div", { class: "markdown-body", onClick: onTask, dangerouslySetInnerHTML: { __html: bodyHtml } }) : /* @__PURE__ */ u3("span", { class: "empty", children: "No description provided." }) }),
        /* @__PURE__ */ u3(ReactionsBar, { ...reactions, on: on3?.react })
      ] })
    ] });
  }
  function DiffHunkTable({ rows }) {
    return /* @__PURE__ */ u3("table", { class: "diff", children: [
      /* @__PURE__ */ u3("colgroup", { children: [
        /* @__PURE__ */ u3("col", { style: "width:50px" }),
        /* @__PURE__ */ u3("col", { style: "width:50px" }),
        /* @__PURE__ */ u3("col", {})
      ] }),
      rows.map((r3) => {
        if (r3.kind === "hunk") return /* @__PURE__ */ u3("tr", { class: "hunk", children: [
          /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
          /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
          /* @__PURE__ */ u3("td", { class: "code", children: r3.text })
        ] });
        if (r3.kind === "add") return /* @__PURE__ */ u3("tr", { class: "add", children: [
          /* @__PURE__ */ u3("td", { class: "num" }),
          /* @__PURE__ */ u3("td", { class: "num", children: r3.n }),
          /* @__PURE__ */ u3("td", { class: "code", "data-marker": "+", children: r3.text })
        ] });
        if (r3.kind === "del") return /* @__PURE__ */ u3("tr", { class: "del", children: [
          /* @__PURE__ */ u3("td", { class: "num", children: r3.o }),
          /* @__PURE__ */ u3("td", { class: "num" }),
          /* @__PURE__ */ u3("td", { class: "code", "data-marker": "-", children: r3.text })
        ] });
        if (r3.kind === "meta") return /* @__PURE__ */ u3("tr", { children: [
          /* @__PURE__ */ u3("td", { class: "num" }),
          /* @__PURE__ */ u3("td", { class: "num" }),
          /* @__PURE__ */ u3("td", { class: "code", style: "color:var(--fgColor-muted)", children: r3.text })
        ] });
        return /* @__PURE__ */ u3("tr", { children: [
          /* @__PURE__ */ u3("td", { class: "num", children: r3.o }),
          /* @__PURE__ */ u3("td", { class: "num", children: r3.n }),
          /* @__PURE__ */ u3("td", { class: "code", "data-marker": " ", children: r3.text })
        ] });
      })
    ] });
  }

  // src/components/Merge.tsx
  function MergedBox({ head: head2 }) {
    return /* @__PURE__ */ u3("div", { class: "TL", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-break", style: "margin-left:0" }),
      /* @__PURE__ */ u3("div", { class: "merge-box", children: [
        /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3("span", { class: "state-merged", style: "background:var(--bgColor-done-emphasis)", children: I2("git-merge") }) }),
        /* @__PURE__ */ u3("div", { class: "merge-card merged-card", children: /* @__PURE__ */ u3("div", { class: "row", children: /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("h3", { children: "Pull request successfully merged and closed" }),
          /* @__PURE__ */ u3("p", { style: "font-size:14px;margin-top:4px", children: [
            "You're all set \u2014 the ",
            /* @__PURE__ */ u3("span", { class: "branch", children: head2 }),
            " branch can be safely deleted."
          ] })
        ] }) }) })
      ] })
    ] });
  }
  function ClosedBox({ head: head2 }) {
    return /* @__PURE__ */ u3("div", { class: "merge-box", children: [
      /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3("span", { class: "state-closed", style: "background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))", children: I2("git-pull-request-closed") }) }),
      /* @__PURE__ */ u3("div", { class: "merge-card", children: /* @__PURE__ */ u3("div", { class: "row", children: /* @__PURE__ */ u3("div", { children: [
        /* @__PURE__ */ u3("h3", { children: "Closed with unmerged commits" }),
        /* @__PURE__ */ u3("p", { style: "font-size:14px;margin-top:4px", children: [
          "This pull request is closed, but the ",
          /* @__PURE__ */ u3("span", { class: "branch", children: head2 }),
          " branch has unmerged commits."
        ] })
      ] }) }) })
    ] });
  }
  var plural = (n2) => n2 === 1 ? "" : "s";
  function Sec({ k: k3, h: h3, rerunable, open: open2, children, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "mb-sec", children: [
      /* @__PURE__ */ u3("button", { class: `mb-h ${h3[0]}`, "data-mb": k3, onClick: on3 && ((e3) => on3.toggle(e3, k3)), children: [
        /* @__PURE__ */ u3("span", { class: "mb-ic", children: I2(h3[1], 22) }),
        /* @__PURE__ */ u3("span", { class: "mb-t", children: [
          /* @__PURE__ */ u3("b", { children: h3[2] }),
          /* @__PURE__ */ u3("i", { children: h3[3] || "" })
        ] }),
        k3 === "ck" && rerunable ? /* @__PURE__ */ u3("span", { class: "btn small", id: "rerunck", role: "button", onClick: on3?.rerun, children: "Re-run failed" }) : "",
        I2(open2 ? "chevron-up" : "chevron-down", 16)
      ] }),
      open2 && children ? /* @__PURE__ */ u3("div", { class: "mb-body", children }) : ""
    ] });
  }
  function CkGroupView({ g: g2, on: on3 }) {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("button", { class: "mb-grp", "data-mb": `g${g2.k}`, onClick: on3 && ((e3) => on3.toggle(e3, `g${g2.k}`)), children: [
        g2.title,
        SP,
        I2(g2.open ? "chevron-up" : "chevron-down", 12)
      ] }),
      g2.open ? g2.items.map((c3) => /* @__PURE__ */ u3("a", { class: `mb-ck ${c3.st}`, href: c3.url || void 0, children: [
        I2(c3.icon, 14),
        /* @__PURE__ */ u3("b", { children: c3.name }),
        c3.req ? /* @__PURE__ */ u3("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
        /* @__PURE__ */ u3("i", { children: c3.desc })
      ] })) : ""
    ] });
  }
  function MergeBox(p3) {
    const { rv, ck, on: on3 } = p3;
    const rvBody = /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("div", { class: "mb-line", children: [
        I2("check", 14),
        SP,
        rv.ap,
        " approval",
        plural(rv.ap)
      ] }),
      rv.cr ? /* @__PURE__ */ u3("div", { class: "mb-line bad", children: [
        I2("x-circle-fill", 14),
        SP,
        rv.cr,
        " requested changes"
      ] }) : "",
      /* @__PURE__ */ u3("div", { class: "mb-line", children: [
        I2("person", 14),
        SP,
        rv.pend,
        " pending review",
        plural(rv.pend),
        rv.pend ? `: ${rv.pendNames}` : ""
      ] })
    ] });
    return /* @__PURE__ */ u3("div", { class: "merge-box", children: [
      /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3("span", { style: "background:var(--bgColor-success-emphasis)", children: I2("git-pull-request") }) }),
      /* @__PURE__ */ u3("div", { class: "merge-card mb-card", children: [
        p3.draft ? /* @__PURE__ */ u3(S2, { children: [
          /* @__PURE__ */ u3("div", { class: "mb-sec", children: /* @__PURE__ */ u3("div", { class: "mb-h", children: [
            /* @__PURE__ */ u3("span", { class: "mb-ic", children: I2("git-pull-request-draft", 22) }),
            /* @__PURE__ */ u3("span", { class: "mb-t", children: [
              /* @__PURE__ */ u3("b", { children: "This pull request is still a work in progress" }),
              /* @__PURE__ */ u3("i", { children: "Draft pull requests cannot be merged." })
            ] }),
            /* @__PURE__ */ u3("button", { class: "btn primary", id: "doready", onClick: on3?.ready, children: p3.busyReady ? "Updating\u2026" : "Ready for review" })
          ] }) }),
          /* @__PURE__ */ u3(ErrLine, { m: p3.errReady })
        ] }) : "",
        /* @__PURE__ */ u3(Sec, { k: "rv", h: rv.h, open: rv.open, on: on3, children: rvBody }),
        ck ? /* @__PURE__ */ u3(Sec, { k: "ck", h: ck.h, rerunable: ck.rerunable, open: ck.open, on: on3, children: ck.groups.map((g2) => /* @__PURE__ */ u3(CkGroupView, { g: g2, on: on3 })) }) : "",
        p3.behind ? /* @__PURE__ */ u3("div", { class: "mb-sec mb-warn", children: /* @__PURE__ */ u3("div", { class: "mb-h", children: [
          /* @__PURE__ */ u3("span", { class: "mb-ic", children: I2("alert", 22) }),
          /* @__PURE__ */ u3("span", { class: "mb-t", children: [
            /* @__PURE__ */ u3("b", { children: "This branch is out-of-date with the base branch" }),
            /* @__PURE__ */ u3("i", { children: [
              "Merge the latest changes from ",
              p3.baseRef,
              " into this branch."
            ] })
          ] }),
          /* @__PURE__ */ u3("button", { class: "btn", id: "updbranch", onClick: on3?.update, children: p3.busyUpdate ? "Updating\u2026" : "Update branch" })
        ] }) }) : "",
        /* @__PURE__ */ u3("div", { class: "mb-sec", children: /* @__PURE__ */ u3("div", { class: `mb-h ${p3.clean ? "ok" : "bad"}`, children: [
          /* @__PURE__ */ u3("span", { class: "mb-ic", children: I2(p3.clean ? "check-circle-fill" : "alert", 22) }),
          /* @__PURE__ */ u3("span", { class: "mb-t", children: [
            /* @__PURE__ */ u3("b", { children: p3.clean ? "This branch has no conflicts with the base branch" : "This branch has conflicts that must be resolved" }),
            /* @__PURE__ */ u3("i", { children: p3.clean ? "Merging can be performed automatically." : "Use the web editor or the command line to resolve conflicts." })
          ] })
        ] }) }),
        /* @__PURE__ */ u3(ErrLine, { m: p3.errUpdate })
      ] })
    ] });
  }
  function ReviewerRow({ r: r3, on: on3 }) {
    const ic = r3.st === "req" && r3.prev ? /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("span", { title: "Asked to review again", style: "margin-right:6px", children: I2("sync") }),
      I2(r3.prev === "approved" ? "check" : r3.prev === "changes_requested" ? "file-diff" : "comment")
    ] }) : I2(r3.st === "approved" ? "check" : r3.st === "changes_requested" ? "file-diff" : r3.st === "req" ? "dot-fill" : "comment");
    return /* @__PURE__ */ u3("div", { class: "reviewer", children: [
      /* @__PURE__ */ u3("a", { href: r3.u.html_url, children: Av(r3.u, 20) }),
      /* @__PURE__ */ u3("a", { class: "nm", href: r3.u.html_url, children: r3.u.login }),
      /* @__PURE__ */ u3("span", { class: `st ${r3.st === "approved" ? "ok" : r3.st === "changes_requested" ? "bad" : ""}`, children: ic }),
      r3.canRe ? /* @__PURE__ */ u3("button", { class: "rerequest", "data-rerequest": r3.u.login, title: `Ask ${r3.u.login} to review again`, onClick: (e3) => on3.rerequest(e3, r3.u.login ?? ""), children: I2("sync") }) : ""
    ] });
  }
  function PrSide(p3) {
    const { on: on3 } = p3, rv = p3.reviewers, more = rv.length - 3;
    const rvSection = rv.length ? /* @__PURE__ */ u3(S2, { children: [
      rv.slice(0, 3).map((r3) => /* @__PURE__ */ u3(ReviewerRow, { r: r3, on: on3 })),
      more > 0 ? /* @__PURE__ */ u3(S2, { children: [
        /* @__PURE__ */ u3("button", { class: "sb-toggle", id: "rvtoggle", onClick: on3.rvtoggle, children: [
          /* @__PURE__ */ u3("span", { children: [
            "+",
            more,
            " more reviewer",
            plural(more)
          ] }),
          I2(p3.showAll ? "chevron-up" : "chevron-down")
        ] }),
        p3.showAll ? rv.slice(3).map((r3) => /* @__PURE__ */ u3(ReviewerRow, { r: r3, on: on3 })) : ""
      ] }) : ""
    ] }) : /* @__PURE__ */ u3("div", { class: "sb-none", children: "No reviews" });
    const fb = (k3, n2) => /* @__PURE__ */ u3(SideFold, { k: "sb:" + n2, folded: p3.folded[k3], onFold: on3.fold });
    const head2 = (k3, t3) => /* @__PURE__ */ u3("div", { class: "sb-head", children: [
      fb(k3, t3 === "people" ? "people" : t3),
      /* @__PURE__ */ u3("span", { children: t3 }),
      I2("gear", 16, "gear")
    ] });
    const box = (k3) => `sb-item${p3.folded[k3] ? " folded" : ""}`;
    return /* @__PURE__ */ u3("div", { class: "pr-side-inner", children: [
      /* @__PURE__ */ u3("div", { class: box("reviewers"), children: [
        /* @__PURE__ */ u3("div", { class: "sb-head", children: [
          fb("reviewers", "Reviewers"),
          /* @__PURE__ */ u3("span", { children: "Reviewers" })
        ] }),
        rvSection
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: box("assignees"), children: [
        head2("assignees", "Assignees"),
        p3.assignees.length ? p3.assignees.map((u4) => /* @__PURE__ */ u3("div", { class: "reviewer", children: [
          /* @__PURE__ */ u3("a", { href: u4.html_url, children: Av(u4, 20) }),
          /* @__PURE__ */ u3("a", { class: "nm", href: u4.html_url, children: u4.login })
        ] })) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "No one\u2014" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: box("labels"), children: [
        head2("labels", "Labels"),
        p3.labels.length ? p3.labels.map((l3) => /* @__PURE__ */ u3("span", { class: "pill-label", style: `background:#${l3.color}33;color:#${l3.color};border-color:#${l3.color}`, children: l3.name })) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "None yet" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: box("milestone"), children: [
        head2("milestone", "Milestone"),
        p3.milestone ? /* @__PURE__ */ u3("a", { class: "sb-link", href: p3.milestone.html_url, children: p3.milestone.title }) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "No milestone" })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: box("people"), children: [
        /* @__PURE__ */ u3("div", { class: "sb-head", children: [
          fb("people", "people"),
          /* @__PURE__ */ u3("span", { children: [
            p3.peopleCount,
            " participant",
            plural(p3.peopleCount)
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { class: "participants", children: p3.people.map((u4) => /* @__PURE__ */ u3("a", { href: u4.html_url, title: u4.login, children: Av(u4, 32) })) })
      ] })
    ] });
  }
  function SideFold({ k: k3, folded: folded2, onFold }) {
    return /* @__PURE__ */ u3("button", { ref: useReveal(k3), class: "fold-btn", "data-fold": k3, "data-def": "0", title: "Hide section", onClick: (e3) => {
      e3.stopPropagation();
      onFold(k3, false);
    }, children: I2(folded2 ? "chevron-right" : "chevron-down") });
  }
  function CommitsDialog(p3) {
    const { on: on3 } = p3;
    return /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", onMouseDown: on3 && ((e3) => {
      if (e3.target.id === "dlgbg") on3.close();
    }), children: /* @__PURE__ */ u3("div", { class: "dlg cp-dlg", children: [
      /* @__PURE__ */ u3("div", { class: "cp-h", children: [
        /* @__PURE__ */ u3("h2", { children: "Select commits to view" }),
        /* @__PURE__ */ u3("button", { class: "icon-btn", id: "cpx", title: "Close", onClick: on3?.close, children: I2("x") })
      ] }),
      /* @__PURE__ */ u3("button", { class: `cp-opt${p3.allOn ? " on" : ""}`, id: "cpall", onClick: on3?.all, children: [
        /* @__PURE__ */ u3("b", { children: "All commits" }),
        /* @__PURE__ */ u3("i", { children: [
          p3.count,
          " commit",
          plural(p3.count)
        ] })
      ] }),
      p3.since ? /* @__PURE__ */ u3("button", { class: `cp-opt${p3.since.on ? " on" : ""}`, id: "cpsince", disabled: !p3.since.n, onClick: on3?.since, children: [
        /* @__PURE__ */ u3("b", { children: "Changes since your last review" }),
        /* @__PURE__ */ u3("i", { children: p3.since.n ? `${p3.since.n} commit${plural(p3.since.n)}` : "No new commits" })
      ] }) : "",
      /* @__PURE__ */ u3("div", { class: "cp-sub", children: "Select a commit, or click a second one to view the range between them" }),
      /* @__PURE__ */ u3("input", { class: "input cp-q", id: "cpq", placeholder: "Filter commits\u2026", value: p3.filter, onInput: on3?.filter }),
      /* @__PURE__ */ u3("div", { class: "cp-list", id: "cplist", "data-q": p3.filter.toLowerCase(), children: p3.rows.map((r3) => /* @__PURE__ */ u3("label", { class: `cp-row${r3.on ? " on" : ""}`, "data-cp": r3.i, hidden: r3.hidden, onClick: on3 && ((e3) => on3.pick(e3, r3.i)), children: [
        /* @__PURE__ */ u3("input", { type: "checkbox", checked: r3.on, tabindex: -1 }),
        /* @__PURE__ */ u3("span", { class: "cp-t", children: [
          /* @__PURE__ */ u3("b", { children: r3.title }),
          /* @__PURE__ */ u3("i", { children: [
            r3.by,
            " committed ",
            r3.when
          ] })
        ] }),
        /* @__PURE__ */ u3("code", { children: r3.sha })
      ] })).reverse() }),
      /* @__PURE__ */ u3("div", { class: "btns", children: [
        /* @__PURE__ */ u3("span", { class: "cp-sel", children: p3.selLabel }),
        /* @__PURE__ */ u3("span", { class: "sp" }),
        /* @__PURE__ */ u3("button", { class: "btn", id: "cpcancel", onClick: on3?.close, children: "Cancel" }),
        /* @__PURE__ */ u3("button", { class: "btn primary", id: "cpsave", disabled: !p3.hasPick, onClick: on3?.save, children: "Save" })
      ] })
    ] }) });
  }
  function FcBar(p3) {
    const { on: on3 } = p3;
    return /* @__PURE__ */ u3("div", { class: "fc-bar", children: [
      /* @__PURE__ */ u3("button", { class: "btn small", id: "fcbtn", title: "Choose which commits to view", onClick: on3?.commits, children: [
        I2("git-commit"),
        SP,
        p3.label,
        p3.count !== null ? /* @__PURE__ */ u3(S2, { children: [
          SP,
          /* @__PURE__ */ u3("span", { class: "counter", children: p3.count })
        ] }) : "",
        p3.code ? /* @__PURE__ */ u3(S2, { children: [
          SP,
          /* @__PURE__ */ u3("code", { children: p3.code })
        ] }) : "",
        SP,
        "\u25BE"
      ] }),
      p3.nav ? /* @__PURE__ */ u3("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u3("button", { "data-fstep": "-1", disabled: p3.nav.prevOff, onClick: on3 && (() => on3.step(-1)), children: "\u2039 Prev" }),
        /* @__PURE__ */ u3("button", { "data-fstep": "1", disabled: p3.nav.nextOff, onClick: on3 && (() => on3.step(1)), children: "Next \u203A" })
      ] }) : "",
      p3.hasRange ? /* @__PURE__ */ u3(S2, { children: [
        /* @__PURE__ */ u3("span", { class: "fc-t", children: p3.title }),
        /* @__PURE__ */ u3("button", { class: "link-btn", id: "fcall", onClick: on3?.all, children: "Show all commits" })
      ] }) : ""
    ] });
  }
  var SORTS = [["path", "GitHub order"], ["pathz", "Path Z\u2013A"], ["most", "Most changed"], ["least", "Least changed"], ["comments", "Most comments"], ["status", "By status"]];
  function FilesBar(p3) {
    const { on: on3 } = p3;
    return /* @__PURE__ */ u3("div", { class: "files-bar", children: [
      /* @__PURE__ */ u3("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u3("button", { class: p3.mode === "unified" ? "on" : "", "data-dmode": "unified", onClick: on3 && (() => on3.mode("unified")), children: "Unified" }),
        /* @__PURE__ */ u3("button", { class: p3.mode === "split" ? "on" : "", "data-dmode": "split", onClick: on3 && (() => on3.mode("split")), children: "Split" })
      ] }),
      /* @__PURE__ */ u3("select", { class: "input fsort", id: "fsort", title: "Sort files", onChange: on3?.sort, children: SORTS.map(([v3, t3]) => /* @__PURE__ */ u3("option", { value: v3, selected: p3.sort === v3, children: t3 })) }),
      p3.pending ? /* @__PURE__ */ u3("button", { class: "btn small primary", id: "finishrev", onClick: on3?.finish, children: [
        "Finish review \xB7 ",
        p3.pending,
        " comment",
        plural(p3.pending)
      ] }) : "",
      /* @__PURE__ */ u3("button", { class: "link-btn", "data-foldall": p3.allFolded ? "open" : "close", "data-files": p3.names.join("\n"), onClick: on3 && (() => on3.foldAll(p3.allFolded, p3.names)), children: p3.allFolded ? "Expand all files" : "Collapse all files" })
    ] });
  }
  function FileBox(p3) {
    const { on: on3 } = p3, rv = useReveal(`f:${p3.name}`);
    return /* @__PURE__ */ u3("div", { class: `file${p3.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3("div", { ref: rv, class: "file-head", "data-fold": `f:${p3.name}`, onClick: on3 && ((e3) => on3.fold(e3, `f:${p3.name}`, false)), children: [
        /* @__PURE__ */ u3("span", { class: "tgl", children: I2(p3.closed ? "chevron-right" : "chevron-down") }),
        /* @__PURE__ */ u3("span", { class: "stat", children: [
          /* @__PURE__ */ u3("span", { class: "a", children: [
            "+",
            p3.add
          ] }),
          SP,
          /* @__PURE__ */ u3("span", { class: "d", children: [
            "\u2212",
            p3.del
          ] })
        ] }),
        /* @__PURE__ */ u3("span", { class: "sq", children: p3.sq.map((c3) => /* @__PURE__ */ u3("i", { class: c3 })) }),
        /* @__PURE__ */ u3("span", { class: "path", children: p3.name })
      ] }),
      p3.children
    ] });
  }
  function CommitsList({ rows }) {
    return /* @__PURE__ */ u3("div", { style: "border:1px solid var(--borderColor-default);border-radius:6px", children: rows.length ? rows.map((r3) => /* @__PURE__ */ u3("div", { style: "padding:16px;border-bottom:1px solid var(--borderColor-muted)", children: r3 })) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No commits listed." }) });
  }
  function CmItem({ c: c3, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: `cm ${c3.on ? "on" : ""}`, "data-sha": c3.sha, onClick: on3 && (() => on3.pick(c3.sha)), children: [
      /* @__PURE__ */ u3("span", { class: "cm-av", children: c3.author ? Av(c3.author, 24) : /* @__PURE__ */ u3("i", { children: c3.initial }) }),
      /* @__PURE__ */ u3("span", { class: "cm-t", children: [
        /* @__PURE__ */ u3("b", { children: c3.title }),
        /* @__PURE__ */ u3("i", { children: c3.sub })
      ] }),
      c3.n ? /* @__PURE__ */ u3("span", { class: "cm-n", children: [
        I2("comment"),
        c3.n
      ] }) : "",
      /* @__PURE__ */ u3("code", { children: c3.sha.slice(0, 7) })
    ] });
  }
  function Rail({ k: k3, label, ic, on: on3 }) {
    return /* @__PURE__ */ u3("button", { class: "pane-rail", "data-show": k3, title: `Show ${label}`, onClick: on3 && (() => on3.hide(k3, false)), children: [
      I2(ic),
      /* @__PURE__ */ u3("span", { children: label })
    ] });
  }
  function SplitView(p3) {
    const { on: on3 } = p3, pl = useScroller("l"), pr = useScroller("r");
    const left = p3.hl ? /* @__PURE__ */ u3(Rail, { k: "l", label: "Commits", ic: "git-commit", on: on3 }) : /* @__PURE__ */ u3("section", { class: "pane pane-l", children: [
      /* @__PURE__ */ u3("div", { class: `fold-sec${p3.foldList ? " folded" : ""}`, children: [
        /* @__PURE__ */ u3("div", { class: "pane-h", children: [
          I2("git-commit"),
          /* @__PURE__ */ u3("span", { children: "Commits" }),
          /* @__PURE__ */ u3("span", { class: "counter", children: p3.count }),
          /* @__PURE__ */ u3("span", { class: "sp" }),
          /* @__PURE__ */ u3("button", { class: "fold-btn flip-btn", "data-flip": "", title: "Swap sides (F)", onClick: on3?.flip, children: "\u21C4" }),
          /* @__PURE__ */ u3(FoldBtn, { k: "cm-list", title: "Collapse commit list", def: false, folded: p3.foldList, onFold: on3?.fold }),
          /* @__PURE__ */ u3("button", { class: "fold-btn", "data-hide": "l", title: "Hide this panel", onClick: on3 && (() => on3.hide("l", true)), children: I2("x") })
        ] }),
        /* @__PURE__ */ u3("div", { class: "cm-list", children: [
          /* @__PURE__ */ u3("div", { class: `cm all ${p3.allOn ? "on" : ""}`, "data-sha": "", onClick: on3 && (() => on3.pick("")), children: [
            /* @__PURE__ */ u3("span", { class: "cm-av", children: /* @__PURE__ */ u3("i", { children: I2("diff") }) }),
            /* @__PURE__ */ u3("span", { class: "cm-t", children: [
              /* @__PURE__ */ u3("b", { children: "All changes" }),
              /* @__PURE__ */ u3("i", { children: p3.allSub })
            ] })
          ] }),
          p3.rows.map((c3) => /* @__PURE__ */ u3(CmItem, { c: c3, on: on3 }))
        ] })
      ] }),
      /* @__PURE__ */ u3("div", { class: `fold-sec${p3.foldDiff ? " folded" : ""}`, children: [
        /* @__PURE__ */ u3("div", { class: "pane-h sub", children: [
          I2("file-diff"),
          /* @__PURE__ */ u3("span", { children: p3.subTitle }),
          /* @__PURE__ */ u3("span", { class: "sp" }),
          /* @__PURE__ */ u3(FoldBtn, { k: "cm-diff", title: "Collapse changes", def: false, folded: p3.foldDiff, onFold: on3?.fold })
        ] }),
        /* @__PURE__ */ u3("div", { class: "pane-body", ref: pl, onScroll: on3 && ((e3) => on3.scroll("l", e3)), children: p3.diff })
      ] })
    ] });
    const right = p3.hr ? /* @__PURE__ */ u3(Rail, { k: "r", label: "Conversation", ic: "comment-discussion", on: on3 }) : /* @__PURE__ */ u3("section", { class: "pane pane-r", children: [
      /* @__PURE__ */ u3("div", { class: "pane-h", children: [
        I2("comment-discussion"),
        /* @__PURE__ */ u3("span", { children: "Conversation" }),
        /* @__PURE__ */ u3("span", { class: "sp" }),
        /* @__PURE__ */ u3("button", { class: "fold-btn flip-btn", "data-flip": "", title: "Swap sides (F)", onClick: on3?.flip, children: "\u21C4" }),
        /* @__PURE__ */ u3("button", { class: "fold-btn", "data-hide": "r", title: "Hide this panel", onClick: on3 && (() => on3.hide("r", true)), children: I2("x") })
      ] }),
      /* @__PURE__ */ u3("div", { class: "pane-body", ref: pr, onScroll: on3 && ((e3) => on3.scroll("r", e3)), children: p3.right })
    ] });
    return /* @__PURE__ */ u3("div", { class: `split ${p3.hl ? "hl" : ""} ${p3.hr ? "hr" : ""} ${p3.flip ? "flip" : ""}`, children: [
      left,
      p3.hl || p3.hr ? "" : /* @__PURE__ */ u3("div", { class: "gutter", id: "gutter", title: "Drag to resize", onMouseDown: on3?.gutter }),
      right
    ] });
  }

  // src/components/Dialogs.tsx
  var Err = ({ m: m3 }) => /* @__PURE__ */ u3("div", { id: "reverr", children: m3 ? /* @__PURE__ */ u3("div", { class: "act-err", children: m3 }) : "" });
  var REVS = [["COMMENT", "Comment", "Submit general feedback without explicit approval."], ["APPROVE", "Approve", "Submit feedback and approve merging these changes."], ["REQUEST_CHANGES", "Request changes", "Submit feedback that must be addressed before merging."]];
  var ReviewDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Finish your review" }),
    /* @__PURE__ */ u3(DraftBox, { k: "review", ph: p3.ph, rows: 5, submit: p3.ok }),
    /* @__PURE__ */ u3("div", { class: "radios", children: REVS.map(([v3, t3, d3]) => /* @__PURE__ */ u3("label", { children: [
      /* @__PURE__ */ u3("input", { type: "radio", name: "rev", value: v3, checked: p3.ev === v3, onChange: () => p3.onEv(v3) }),
      " ",
      /* @__PURE__ */ u3("b", { children: t3 }),
      " ",
      /* @__PURE__ */ u3("span", { children: d3 })
    ] })) }),
    /* @__PURE__ */ u3(Err, { m: p3.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "revcancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "revsubmit", onClick: p3.ok, children: "Submit review" })
    ] })
  ] }) });
  var EditPrDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Edit pull request" }),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Title" }),
    /* @__PURE__ */ u3("input", { class: "input", id: "eptitle", value: p3.title, onInput: (e3) => p3.onTitle(e3.target.value), style: "width:100%;box-sizing:border-box;height:34px" }),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Description" }),
    /* @__PURE__ */ u3(DraftBox, { k: "prbody", ph: "Describe your changes", rows: 8 }),
    /* @__PURE__ */ u3(Err, { m: p3.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "epcancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "epsave", onClick: p3.ok, children: "Save" })
    ] })
  ] }) });
  var ConfirmDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: p3.title }),
    /* @__PURE__ */ u3("p", { children: p3.text }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "cfcancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: `btn ${p3.danger ? "danger" : "primary"}`, id: "cfok", onClick: p3.ok, children: p3.label })
    ] })
  ] }) });
  var EditCommentDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Edit comment" }),
    /* @__PURE__ */ u3(DraftBox, { k: "editc", ph: "Edit your comment", rows: 6 }),
    /* @__PURE__ */ u3(Err, { m: p3.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "eccancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "ecsave", onClick: p3.ok, children: "Save" })
    ] })
  ] }) });
  var DeleteCommentDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "Delete this comment?" }),
    /* @__PURE__ */ u3("p", { style: "color:var(--fgColor-muted)", children: "This can't be undone." }),
    /* @__PURE__ */ u3(Err, { m: p3.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "dccancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn danger", id: "dcdo", onClick: p3.ok, children: "Delete" })
    ] })
  ] }) });
  var HideCommentDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "Hide this comment" }),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Reason" }),
    /* @__PURE__ */ u3("select", { class: "sel", id: "hcreason", style: "width:100%;height:34px", onChange: p3.pick, children: p3.reasons.map(([v3, l3]) => /* @__PURE__ */ u3("option", { value: v3, selected: v3 === p3.reason, children: l3 })) }),
    /* @__PURE__ */ u3(Err, { m: p3.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "hccancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "hcdo", onClick: p3.ok, children: "Hide comment" })
    ] })
  ] }) });
  var TokenDialog = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "GitHub classic token" }),
    /* @__PURE__ */ u3("p", { children: [
      "Use a ",
      /* @__PURE__ */ u3("b", { children: "classic" }),
      " personal access token with the ",
      /* @__PURE__ */ u3("code", { children: "repo" }),
      " scope. It lists all your repositories (including organization ones) and raises the rate limit to 5,000 requests per hour. Organization with SSO: after creating it, click ",
      /* @__PURE__ */ u3("b", { children: "Configure SSO \u2192 Authorize" }),
      ". Stored in your OS keychain. Leave empty and save to remove it."
    ] }),
    /* @__PURE__ */ u3("div", { class: "oauth-row", children: [
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "oauthgo", onClick: p3.go, children: "Sign in with GitHub" }),
      /* @__PURE__ */ u3("span", { children: "or paste a token below" })
    ] }),
    /* @__PURE__ */ u3("div", { id: "oauthbox", children: p3.code ? /* @__PURE__ */ u3("div", { class: "oauth-code", children: [
      /* @__PURE__ */ u3("span", { children: "Enter this code on GitHub" }),
      /* @__PURE__ */ u3("b", { children: p3.code }),
      /* @__PURE__ */ u3("small", { children: "Waiting for approval\u2026" })
    ] }) : p3.err ? /* @__PURE__ */ u3("div", { class: "err", style: "margin:8px 0", children: p3.err }) : "" }),
    /* @__PURE__ */ u3("p", { children: /* @__PURE__ */ u3("a", { href: "https://github.com/settings/tokens/new?scopes=repo&description=Pullscope", children: "Create a classic token (repo scope preselected) \u2197" }) }),
    /* @__PURE__ */ u3("input", { class: "input", id: "tokeninput", type: "password", value: p3.text, onInput: p3.input, placeholder: "ghp_\u2026", style: "width:100%;box-sizing:border-box" }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "tokcancel", onClick: p3.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "toksave", onClick: p3.save, children: "Save" })
    ] })
  ] }) });
  var CmPop = ({ x: x2, y: y3, hr, edit, hide: hide2, del, pick }) => /* @__PURE__ */ u3("div", { class: "react-pop cm-pop", style: `left:${x2}px;top:${y3}px`, children: [
    /* @__PURE__ */ u3("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" }),
    /* @__PURE__ */ u3("button", { "data-h": "md", onClick: () => pick("md"), children: "Copy Markdown" }),
    /* @__PURE__ */ u3("button", { "data-h": "quote", onClick: () => pick("quote"), children: "Quote reply" }),
    /* @__PURE__ */ u3("button", { "data-h": "issue", onClick: () => pick("issue"), children: "Reference in new issue" }),
    hr ? /* @__PURE__ */ u3("hr", {}) : "",
    edit ? /* @__PURE__ */ u3("button", { "data-h": "edit", onClick: () => pick("edit"), children: "Edit" }) : "",
    hide2 ? /* @__PURE__ */ u3("button", { "data-h": "hide", onClick: () => pick("hide"), children: "Hide" }) : "",
    del ? /* @__PURE__ */ u3("button", { "data-h": "del", class: "danger", onClick: () => pick("del"), children: "Delete" }) : ""
  ] });
  var ReactPop = ({ x: x2, y: y3, reacts, pick }) => /* @__PURE__ */ u3("div", { class: "react-pop", style: `left:${x2}px;top:${y3}px`, children: reacts.map(([k3, em]) => /* @__PURE__ */ u3("button", { "data-c": k3, onClick: () => pick(k3), children: em })) });
  var CtxPop = ({ x: x2, y: y3, pick }) => /* @__PURE__ */ u3("div", { class: "react-pop cm-pop", style: `left:${x2}px;top:${y3}px`, children: [
    /* @__PURE__ */ u3("button", { "data-h": "new", onClick: () => pick("new"), children: "Open in new tab" }),
    /* @__PURE__ */ u3("button", { "data-h": "here", onClick: () => pick("here"), children: "Open" }),
    /* @__PURE__ */ u3("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" })
  ] });
  var focusEl = (el) => {
    el?.focus();
  };
  var Palette = (p3) => /* @__PURE__ */ u3("div", { class: "dlg-bg palette", onMouseDown: (e3) => {
    if (e3.target === e3.currentTarget) p3.close();
  }, children: /* @__PURE__ */ u3("div", { class: "dlg pal", children: [
    /* @__PURE__ */ u3("input", { class: "pal-in", placeholder: "Jump to a pull request \u2014 owner/repo#123, a URL, or search recent\u2026", value: p3.q, ref: focusEl, onInput: (e3) => p3.onQ(e3.target.value), onKeyDown: p3.onKey }),
    /* @__PURE__ */ u3("div", { class: "pal-list", onMouseDown: (e3) => {
      const r3 = e3.target.closest(".pal-row");
      if (r3) p3.pick(+r3.dataset.i);
    }, children: p3.rows.length ? p3.rows.map((r3, i3) => /* @__PURE__ */ u3("div", { class: `pal-row${i3 === p3.sel ? " on" : ""}`, "data-i": i3, children: [
      /* @__PURE__ */ u3("b", { children: r3.label }),
      /* @__PURE__ */ u3("i", { children: r3.sub })
    ] })) : /* @__PURE__ */ u3("div", { class: "pal-none", children: "No matches" }) })
  ] }) });
  var HELP = [["Jump to any pull request", "\u2318 K"], ["Next / previous comment", "j / k"], ["Next / previous unresolved thread", "] / ["], ["Reply to the selected comment", "r"], ["Write a comment (docked at the bottom)", "c"], ["New pull request", "n"], ["New tab / close tab / reopen closed", "\u2318T \xB7 \u2318W \xB7 \u2318\u21E7T"], ["Go to tab 1\u20139 / next tab", "\u23181\u20139 \xB7 \u2303Tab"], ["Open a PR in a new tab", "\u2318-click"], ["Turn Split view on / off", "s"], ["Swap the two sides of Split view", "f"], ["Diff: unified \u21C4 side-by-side", "d"], ["Show this help", "?"], ["Close dialogs and menus", "Esc"]];
  var HelpDialog = ({ close }) => /* @__PURE__ */ u3("div", { class: "dlg-bg palette", onMouseDown: close, children: /* @__PURE__ */ u3("div", { class: "dlg pal", children: [
    /* @__PURE__ */ u3("h2", { children: "Keyboard shortcuts" }),
    HELP.map(([a3, b2]) => /* @__PURE__ */ u3("div", { class: "kb-r", children: [
      /* @__PURE__ */ u3("span", { children: a3 }),
      /* @__PURE__ */ u3("kbd", { children: b2 })
    ] }))
  ] }) });

  // src/components/Timeline.tsx
  function CommitRow({ first, sha, author, url, verification }) {
    const unv = verification && !verification.verified;
    return /* @__PURE__ */ u3("div", { class: "commit-row", children: [
      author ? /* @__PURE__ */ u3("span", { class: "TLI-avatar", style: "margin-right:8px", children: Av(author, 20) }) : "",
      /* @__PURE__ */ u3("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u3("a", { href: url || "#", children: first }) }),
      /* @__PURE__ */ u3("span", { class: "cm-ic", children: I2("comment") }),
      /* @__PURE__ */ u3("span", { style: "flex:1" }),
      verification ? /* @__PURE__ */ u3("span", { class: `label-pill ${unv ? "warn" : "ok"}`, children: unv ? "Unverified" : "Verified" }) : "",
      /* @__PURE__ */ u3("a", { class: "sha", href: url || "#", children: String(sha).slice(0, 7) })
    ] });
  }
  function RangeBar({ range, from, to, desc, on: on3 }) {
    const opts = [["all", "Any time"], ["1h", "Last hour"], ["24h", "Last 24 hours"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["custom", "Custom range\u2026"]];
    return /* @__PURE__ */ u3("div", { class: "date-bar", children: [
      /* @__PURE__ */ u3("span", { class: "who-l", children: [
        I2("clock"),
        "When"
      ] }),
      /* @__PURE__ */ u3("select", { class: "sel", id: "crange", title: "Only show activity from this period", onChange: on3?.range, children: opts.map(([v3, l3]) => /* @__PURE__ */ u3("option", { value: v3, selected: range === v3, children: l3 })) }),
      range === "custom" ? /* @__PURE__ */ u3(S2, { children: [
        /* @__PURE__ */ u3("input", { type: "date", class: "input", id: "cfrom", value: from, title: "From", onChange: on3?.from }),
        /* @__PURE__ */ u3("span", { class: "who-l", children: "to" }),
        /* @__PURE__ */ u3("input", { type: "date", class: "input", id: "cto", value: to, title: "To", onChange: on3?.to })
      ] }) : "",
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3("button", { class: "who-chip", id: "csort", title: "Flip the order of the timeline", onClick: on3?.sort, children: [
        I2(desc ? "chevron-down" : "chevron-up"),
        /* @__PURE__ */ u3("span", { children: desc ? "Newest first" : "Oldest first" })
      ] })
    ] });
  }
  function WhoBar({ everyone, people, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "who-bar", children: [
      /* @__PURE__ */ u3("span", { class: "who-l", children: [
        I2("person"),
        "Show"
      ] }),
      /* @__PURE__ */ u3("button", { class: `who-chip ${everyone ? "on" : ""}`, "data-whoclear": "1", onClick: on3?.whoClear, children: "Everyone" }),
      people.map(({ u: u4, n: n2, on: sel }) => /* @__PURE__ */ u3("button", { class: `who-chip ${sel ? "on" : ""}`, "data-who": u4.login, onClick: on3 && (() => on3.who(u4.login)), title: `${n2} comment${n2 === 1 ? "" : "s"}`, children: [
        Av(u4, 18),
        /* @__PURE__ */ u3("span", { children: u4.login }),
        /* @__PURE__ */ u3("i", { children: n2 })
      ] }))
    ] });
  }
  function Bars({ who, range, on: on3 }) {
    return /* @__PURE__ */ u3(S2, { children: [
      who && /* @__PURE__ */ u3(WhoBar, { ...who, on: on3 }),
      /* @__PURE__ */ u3(RangeBar, { ...range, on: on3 })
    ] });
  }
  function FoldBar({ folded: folded2, onClick }) {
    return /* @__PURE__ */ u3("div", { class: "fold-bar", children: /* @__PURE__ */ u3("button", { class: "btn small", id: "foldallconv", title: "Collapse or expand every comment, review and thread", onClick, children: [
      I2("chevron-down"),
      SP,
      /* @__PURE__ */ u3("span", { children: folded2 ? "Expand all conversations" : "Collapse all conversations" })
    ] }) });
  }
  var Time = ({ at }) => /* @__PURE__ */ u3("a", { class: "time", children: whenParts(at).text });
  var actor = (u4) => u4 ? /* @__PURE__ */ u3("a", { class: "actor", href: u4.html_url, children: u4.login }) : /* @__PURE__ */ u3("span", { class: "actor", children: "ghost" });
  function CommitRun({ n: n2, first, last, onTab }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: I2("git-commit") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: /* @__PURE__ */ u3("a", { "data-tab": "commits", class: "run", onClick: onTab && (() => onTab("commits")), children: [
        /* @__PURE__ */ u3("b", { children: [
          n2,
          " commits"
        ] }),
        SP,
        /* @__PURE__ */ u3("span", { class: "mono", children: [
          first,
          " \u2026 ",
          last
        ] }),
        " \xB7 view in Commits"
      ] }) }) })
    ] });
  }
  function Committed({ row: row2 }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: I2("git-commit") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: row2 })
    ] });
  }
  var Linked = ({ msg, url }) => {
    const m3 = msg.match(/^([\s\S]*?)#(\d+)([\s\S]*)$/);
    return m3 ? /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("a", { href: url, children: m3[1] }),
      /* @__PURE__ */ u3("a", { href: "#", style: "color:var(--fgColor-accent)", children: [
        "#",
        m3[2]
      ] }),
      /* @__PURE__ */ u3("a", { href: "#", children: m3[3] })
    ] }) : /* @__PURE__ */ u3("a", { href: url, children: msg });
  };
  function Referenced({ actor: a3, at, commit: ci, msg }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: I2("cross-reference") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body stack", children: [
        /* @__PURE__ */ u3("div", { class: "row", style: "min-height:32px", children: [
          actor(a3),
          SP,
          /* @__PURE__ */ u3("span", { children: "added a commit that referenced this pull request" }),
          SP,
          /* @__PURE__ */ u3(Time, { at })
        ] }),
        ci ? /* @__PURE__ */ u3("div", { class: "line2", children: /* @__PURE__ */ u3("div", { class: "commit-row", children: [
          /* @__PURE__ */ u3("span", { class: "TLI-avatar", style: "margin:0 8px 0 0", children: Av(ci.author || a3, 20) }),
          /* @__PURE__ */ u3("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u3(Linked, { msg, url: ci.html_url }) }),
          /* @__PURE__ */ u3("span", { class: "mono", style: "background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px", children: "\u2026" }),
          /* @__PURE__ */ u3("span", { class: "cm-ic", children: I2("comment") }),
          /* @__PURE__ */ u3("span", { style: "flex:1" }),
          /* @__PURE__ */ u3("a", { class: "sha", href: ci.html_url, children: ci.sha.slice(0, 7) })
        ] }) }) : ""
      ] })
    ] });
  }
  function MergedRow({ actor: a3, commit, base, at }) {
    return /* @__PURE__ */ u3("div", { class: "TLI mergedrow", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge done", children: I2("git-merge") }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(a3, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: [
        actor(a3),
        SP,
        /* @__PURE__ */ u3("span", { children: [
          "merged commit ",
          /* @__PURE__ */ u3("b", { class: "mono", style: "color:var(--fgColor-default);font-size:12px", children: commit }),
          " into ",
          /* @__PURE__ */ u3("span", { class: "branch", children: base })
        ] }),
        SP,
        /* @__PURE__ */ u3(Time, { at })
      ] }) })
    ] });
  }
  function CrossRef(p3) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: I2("cross-reference") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u3("div", { class: "row", children: [
          actor(p3.actor),
          SP,
          /* @__PURE__ */ u3("span", { children: [
            "mentioned this ",
            p3.isPr ? "pull request" : "issue"
          ] }),
          SP,
          /* @__PURE__ */ u3(Time, { at: p3.at })
        ] }),
        "\n        ",
        /* @__PURE__ */ u3("div", { class: "ref-card", children: [
          /* @__PURE__ */ u3("span", { style: `color:var(--fgColor-${p3.open ? "success" : "done"});margin-top:2px`, children: I2(p3.icon) }),
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3("a", { class: "t", href: p3.url, style: "color:var(--fgColor-default)", children: p3.title }),
            /* @__PURE__ */ u3("span", { class: "r", children: [
              p3.repo,
              "#",
              p3.number
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  function LabelRow({ actor: a3, verb, color, name, at }) {
    return /* @__PURE__ */ u3("div", { class: "TLI condensed", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: I2("tag") }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(a3, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        actor(a3),
        SP,
        /* @__PURE__ */ u3("span", { children: verb }),
        SP,
        /* @__PURE__ */ u3("span", { class: "pill-label", style: `background:#${color};color:#fff;margin:0`, children: name }),
        SP,
        /* @__PURE__ */ u3("span", { children: "label" }),
        SP,
        /* @__PURE__ */ u3(Time, { at })
      ] })
    ] });
  }
  function Simple({ actor: a3, ic, text, kind, at }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: `TLI-badge ${kind}`, children: I2(ic) }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(a3, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: [
        actor(a3),
        SP,
        /* @__PURE__ */ u3("span", { children: text }),
        SP,
        /* @__PURE__ */ u3(Time, { at })
      ] }) })
    ] });
  }
  function Checks({ head: head2, summary, headIcon, rows }) {
    return /* @__PURE__ */ u3("div", { class: "checks", children: [
      /* @__PURE__ */ u3("div", { class: `ck-head ${head2[0]}`, children: [
        I2(headIcon, 20),
        /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("b", { children: head2[1] }),
          /* @__PURE__ */ u3("span", { children: summary })
        ] })
      ] }),
      rows.map((c3) => /* @__PURE__ */ u3("a", { class: `ck-row ${c3.st}`, href: c3.url ? c3.url : void 0, children: [
        /* @__PURE__ */ u3("span", { class: "ck-i", children: I2(c3.icon) }),
        /* @__PURE__ */ u3("span", { class: "ck-n", children: [
          /* @__PURE__ */ u3("b", { children: c3.name }),
          c3.req ? /* @__PURE__ */ u3("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
          /* @__PURE__ */ u3("i", { children: c3.desc })
        ] }),
        /* @__PURE__ */ u3("span", { class: "ck-s", children: c3.status }),
        /* @__PURE__ */ u3("span", { class: "ck-d", children: c3.dur })
      ] }))
    ] });
  }
  function Attention({ items, unres, showUnres, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "attn", children: [
      items.map((it) => /* @__PURE__ */ u3("button", { class: `att-i ${it.k}`, id: it.id, title: it.title, "data-tab": it.dataTab, onClick: on3 && (it.id === "nextun" ? on3.next : it.dataTab ? () => on3.tab(it.dataTab) : void 0), children: [
        I2(it.ic),
        /* @__PURE__ */ u3("span", { children: it.text })
      ] })),
      showUnres ? /* @__PURE__ */ u3(S2, { children: [
        /* @__PURE__ */ u3("span", { class: "sp" }),
        /* @__PURE__ */ u3("button", { class: `att-tog ${unres ? "on" : ""}`, id: "unres", title: "Hide everything except review threads that are still open", onClick: on3?.unres, children: [
          I2("comment"),
          "Unresolved only"
        ] })
      ] }) : ""
    ] });
  }

  // src/app/comments.ts
  function stateOf(p3) {
    if (p3.merged) return ["merged", "git-merge", "Merged"];
    if (p3.state === "closed") return ["closed", "git-pull-request-closed", "Closed"];
    if (p3.draft) return ["draft", "git-pull-request-draft", "Draft"];
    return ["open", "git-pull-request", "Open"];
  }
  function prHeaderProps(b2) {
    const p3 = b2.pull, [st, ic, label] = stateOf(p3);
    const commentsTotal = p3.comments + p3.review_comments + b2.timeline.filter((e3) => e3.event === "reviewed").length;
    const sq = (() => {
      const t3 = p3.additions + p3.deletions || 1;
      const small = t3 <= 5;
      const a3 = small ? p3.additions : Math.round(p3.additions / t3 * 5);
      const d3 = small ? p3.deletions : 5 - a3;
      const arr = [];
      for (let i3 = 0; i3 < 5; i3++) arr.push(i3 < a3 ? "a" : i3 < a3 + d3 ? "d" : "");
      return arr;
    })();
    const splitOk = S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline";
    return { b: b2, st, ic, label, tab: S.tab, split: S.split, hideSide: !!S.hide.side, splitOk, commentsTotal, sq };
  }
  var isFolded = (k3, def = false) => k3 in S.fold ? S.fold[k3] : def;
  var folded = (k3, def = false) => isFolded(k3, def) ? " folded" : "";
  var reactionProps = (r3, kind, id) => ({ r: r3 || {}, kind, id, defs: REACTS.map(([k3, e3]) => ({ k: k3, e: e3 })) });
  var liveTasks = (h3) => S.hasToken ? h3.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m3) => m3.replace(/\sdisabled(="[^"]*")?/g, "")) : h3;
  function toggleTask(body, n2) {
    let i3 = -1, fence = false;
    return body.split("\n").map((l3) => {
      if (/^\s*(```|~~~)/.test(l3)) {
        fence = !fence;
        return l3;
      }
      if (fence) return l3;
      return l3.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/, (m3, a3, x2, z3) => ++i3 === n2 ? a3 + (x2 === " " ? "x" : " ") + z3 : m3);
    }).join("\n");
  }
  var setTaskHtml = (html, n2, on3) => {
    let i3 = -1;
    return html.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m3) => ++i3 === n2 ? on3 ? /\schecked/.test(m3) ? m3 : m3.replace(/<input/, "<input checked") : m3.replace(/\schecked(="[^"]*")?/, "") : m3);
  };
  async function taskClick(e3) {
    const cb = e3.target.closest("input.task-list-item-checkbox");
    if (!cb || cb.disabled || !S.bundle) return;
    const box = cb.closest(".tl-comment"), md = cb.closest(".markdown-body");
    if (!box || !md) return;
    e3.preventDefault();
    const id = box.id.replace(/^c-/, ""), b2 = S.bundle;
    const c3 = String(b2.pull.id) === id ? b2.pull : b2.timeline.find((x2) => String(x2.id) === id);
    if (!c3) return;
    const n2 = [...md.querySelectorAll("input.task-list-item-checkbox")].indexOf(cb), body = toggleTask(c3.body || "", n2);
    if (body === (c3.body || "")) return;
    const on3 = cb.checked, was = c3.body_html || "";
    c3.body_html = setTaskHtml(was, n2, on3);
    rerender();
    const r3 = c3 === b2.pull ? await act("edit", { body, extra: {} }, "task", true) : await act("edit_comment", { id: c3.id, kind: "issue_comment", body }, "task", true);
    if (r3 === void 0) {
      c3.body_html = was;
      rerender();
      alert(`Couldn't update the checkbox: ${S.actErr?.m || "unknown error"}`);
      return;
    }
    c3.body = body;
    const key = `${prRef().repo}#${prRef().number}`;
    qc.set(key, b2);
    qc.m.get(key).at = Date.now() - 2e4;
    tauri?.invoke("invalidate_pr", { url: key }).catch(() => {
    });
  }
  function hasComment(elId) {
    const b2 = S.bundle, id = elId.replace(/^c-/, "");
    if (!b2) return false;
    return String(b2.pull.id) === id || b2.timeline.some((x2) => String(x2.id) === id) || b2.review_comments.some((x2) => String(x2.id) === id);
  }
  function commentBoxProps(c3, { isPr = false, flush = false } = {}) {
    return { onTask: (e3) => {
      taskClick(e3);
    }, kb: S.kbId === "c-" + c3.id, flash: flashFor("c-" + c3.id), c: c3, assoc: ASSOC[c3.author_association ?? ""], bodyHtml: c3.body_html && c3.body_html.trim() ? liveTasks(c3.body_html) : "", folded: isFolded("c:" + c3.id), reactions: reactionProps(c3.reactions, isPr ? "pr" : "issue_comment", c3.id), flush };
  }
  function hunkRows(hunk) {
    const rows = [];
    let o3 = 0, n2 = 0;
    for (const line of hunk.split("\n")) {
      if (line.startsWith("@@")) {
        const m3 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m3) {
          o3 = +m3[1];
          n2 = +m3[2];
        }
        rows.push({ kind: "hunk", text: line });
        continue;
      }
      const t3 = line[0], txt = line.slice(1);
      if (t3 === "+") rows.push({ kind: "add", n: n2++, text: txt });
      else if (t3 === "-") rows.push({ kind: "del", o: o3++, text: txt });
      else if (t3 === "\\") rows.push({ kind: "meta", text: line });
      else rows.push({ kind: "ctx", o: o3++, n: n2++, text: txt });
    }
    return rows;
  }

  // src/components/Diff.tsx
  function Sug({ s: s3, on: on3 }) {
    return s3.kind === "note" ? /* @__PURE__ */ u3("div", { class: "sug-row", children: /* @__PURE__ */ u3("span", { class: "sug-note", children: s3.text }) }) : /* @__PURE__ */ u3("div", { class: "sug-row", children: [
      /* @__PURE__ */ u3("button", { class: "btn small primary", "data-sug": s3.id, disabled: s3.disabled, onClick: on3 && ((e3) => on3.sug(e3, String(s3.id))), children: "Apply suggestion" }),
      /* @__PURE__ */ u3("span", { class: "sug-note", children: [
        "Commits to ",
        /* @__PURE__ */ u3("code", { children: s3.ref }),
        s3.mine ? "" : " (fork \u2014 needs push access)"
      ] })
    ] });
  }
  function Tc(p3) {
    const { on: on3 } = p3, ref = useFlash(p3.flash, p3.kb);
    return /* @__PURE__ */ u3("div", { ref, class: `tc${p3.kb ? " kb" : ""}${flashClass(p3.flash)}`, id: p3.anchorId ? `c-${p3.id}` : void 0, children: [
      /* @__PURE__ */ u3("a", { href: p3.user?.html_url || "#", children: Av(p3.user, 24) }),
      /* @__PURE__ */ u3("div", { style: "flex:1;min-width:0", children: [
        /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("span", { class: "who", children: p3.login }),
          SP,
          /* @__PURE__ */ u3("span", { children: When(p3.at) }),
          p3.withMenu ? /* @__PURE__ */ u3("button", { class: "cm-btn", "data-cm": p3.id, "data-root": p3.root, title: "Comment actions", onClick: on3 && ((e3) => on3.menu(e3, e3.currentTarget)), children: "\u22EF" }) : ""
        ] }),
        /* @__PURE__ */ u3("div", { class: "markdown-body", style: "margin-top:8px", dangerouslySetInnerHTML: { __html: p3.bodyHtml } }),
        p3.sug ? /* @__PURE__ */ u3(Sug, { s: p3.sug, on: on3 }) : "",
        /* @__PURE__ */ u3(ReactionsBar, { ...p3.reactions, on: on3?.react })
      ] })
    ] });
  }
  function ThreadRow(p3) {
    const { on: on3 } = p3;
    return /* @__PURE__ */ u3("tr", { class: "lc-row th-row", children: /* @__PURE__ */ u3("td", { colspan: p3.cols, children: /* @__PURE__ */ u3("div", { class: `thread inl${p3.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3("div", { class: "thread-head", children: [
        /* @__PURE__ */ u3(FoldBtn, { k: p3.k, title: "Hide this thread", def: p3.def, folded: p3.folded, onFold: on3?.fold }),
        /* @__PURE__ */ u3("span", { class: "th-t", children: [
          "Comment on line ",
          /* @__PURE__ */ u3("b", { children: [
            p3.side,
            p3.line
          ] })
        ] }),
        p3.outdated ? /* @__PURE__ */ u3("span", { class: "res out", children: "Outdated" }) : "",
        p3.resolved ? /* @__PURE__ */ u3("span", { class: "res", children: "Resolved" }) : ""
      ] }),
      p3.cards.map((c3) => /* @__PURE__ */ u3(Tc, { ...c3, on: on3 })),
      p3.reply ? /* @__PURE__ */ u3(ReplyBox, { ...p3.reply, on: on3 }) : "",
      p3.act ? /* @__PURE__ */ u3("div", { class: "th-foot", children: /* @__PURE__ */ u3("button", { class: "thread-act", "data-thread": p3.act.tid, "data-res": p3.act.res ? "unresolve" : "resolve", onClick: on3 && ((e3) => on3.thread(e3, p3.act.tid, p3.act.res ? "unresolve" : "resolve")), children: p3.act.res ? "Unresolve conversation" : "Resolve conversation" }) }) : ""
    ] }) }) });
  }
  function ReplyBox({ rid, ph, err, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "reply", children: [
      /* @__PURE__ */ u3(DraftBox, { k: `reply-${rid}`, ph, rows: 2, submit: on3 && (() => on3.reply(String(rid))) }),
      /* @__PURE__ */ u3(ErrLine, { m: err }),
      /* @__PURE__ */ u3("button", { class: "btn small", "data-sendreply": rid, onClick: on3 && (() => on3.reply(String(rid))), children: "Reply" })
    ] });
  }
  var LcCards = ({ cards, on: on3 }) => /* @__PURE__ */ u3(S2, { children: cards.map((c3) => /* @__PURE__ */ u3("div", { class: "lc-card", children: [
    /* @__PURE__ */ u3("span", { class: "lc-tag", children: "Pending" }),
    /* @__PURE__ */ u3("div", { class: "lc-body", dangerouslySetInnerHTML: { __html: c3.body } }),
    /* @__PURE__ */ u3("button", { class: "lc-x", "data-lcdel": c3.id, title: "Delete draft comment", onClick: on3 && (() => on3.del(String(c3.id))), children: I2("x") })
  ] })) });
  var LcEdit = ({ code, on: on3 }) => /* @__PURE__ */ u3("div", { class: "lc-edit", children: [
    /* @__PURE__ */ u3(DraftBox, { k: "lc", ph: "Leave a comment on this line", rows: 3, submit: on3?.add }),
    /* @__PURE__ */ u3("div", { class: "lc-btns", children: [
      code !== null ? /* @__PURE__ */ u3("button", { class: "btn small", id: "lcsuggest", "data-code": code, title: "Insert a suggested change for this line", onClick: on3?.suggest, children: "\xB1 Suggest change" }) : "",
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3("button", { class: "btn small", id: "lccancel", onClick: on3?.cancel, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn small primary", id: "lcadd", onClick: on3?.add, children: "Add to review" })
    ] })
  ] });
  var Actor = ({ u: u4 }) => u4 ? /* @__PURE__ */ u3("a", { class: "actor", href: u4.html_url, children: u4.login }) : /* @__PURE__ */ u3("span", { class: "actor", children: "ghost" });
  function ReviewBlock(p3) {
    const { on: on3 } = p3;
    return /* @__PURE__ */ u3("div", { class: `TLI rev${p3.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3("div", { class: `TLI-badge ${p3.kind}`, children: I2(p3.ic) }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(p3.user, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u3("div", { class: "row", children: [
          /* @__PURE__ */ u3(FoldBtn, { k: p3.k, title: "Collapse / expand this review", def: p3.allRes, folded: p3.folded, onFold: on3?.fold }),
          /* @__PURE__ */ u3(Actor, { u: p3.user }),
          " ",
          /* @__PURE__ */ u3("span", { children: p3.verb }),
          " ",
          /* @__PURE__ */ u3("a", { class: "time", href: p3.url, children: p3.at }),
          p3.sum ? /* @__PURE__ */ u3("span", { class: `rev-sum${p3.sum.ok ? " ok" : ""}`, children: p3.sum.allRes ? /* @__PURE__ */ u3(S2, { children: [
            I2("check"),
            " All resolved"
          ] }) : p3.sum.text }) : ""
        ] }),
        "\n  ",
        p3.bodyHtml ? /* @__PURE__ */ u3("div", { class: "cbox nocaret", style: "margin-top:8px;color:var(--fgColor-default)", children: /* @__PURE__ */ u3("div", { class: "cbody", children: /* @__PURE__ */ u3("div", { class: "markdown-body", dangerouslySetInnerHTML: { __html: p3.bodyHtml } }) }) }) : "",
        p3.threads.length ? /* @__PURE__ */ u3("div", { children: p3.threads.map((t3) => /* @__PURE__ */ u3("div", { class: `thread${t3.folded ? " folded" : ""}`, children: [
          /* @__PURE__ */ u3("div", { class: "thread-head", children: [
            /* @__PURE__ */ u3(FoldBtn, { k: t3.k, title: "Hide this thread", def: t3.def, folded: t3.folded, onFold: on3?.fold }),
            t3.path,
            t3.resolved ? /* @__PURE__ */ u3("span", { class: "res", children: "Resolved" }) : "",
            t3.tid ? /* @__PURE__ */ u3("button", { class: "thread-act", "data-thread": t3.tid, "data-res": t3.resolved ? "unresolve" : "resolve", onClick: on3 && ((e3) => on3.thread(e3, t3.tid, t3.resolved ? "unresolve" : "resolve")), children: t3.resolved ? "Unresolve" : "Resolve conversation" }) : ""
          ] }),
          /* @__PURE__ */ u3("div", { class: "diffhunk", children: /* @__PURE__ */ u3(DiffHunkTable, { rows: t3.hunk }) }),
          t3.cards.map((c3) => /* @__PURE__ */ u3(Tc, { ...c3, on: on3 })),
          /* @__PURE__ */ u3(ReplyBox, { ...t3.reply, on: on3 })
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
    let o3 = 0, n2 = 0;
    for (const line of patch.split("\n")) {
      if (line.startsWith("@@")) {
        const m3 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m3) {
          o3 = +m3[1];
          n2 = +m3[2];
        }
        rows.push({ t: "hunk", text: line });
        continue;
      }
      const c3 = line[0], txt = line.slice(1);
      if (c3 === "+") rows.push({ t: "add", n: n2++, text: txt });
      else if (c3 === "-") rows.push({ t: "del", o: o3++, text: txt });
      else if (c3 === "\\") rows.push({ t: "note", text: line });
      else rows.push({ t: "ctx", o: o3++, n: n2++, text: txt });
    }
    return rows;
  }
  var codeHtml = (text, path) => (window.hlLine && window.hlLine(text, path)) ?? esc(text);
  var lineKey = (path, line, side) => `${path}${side}${line}`;
  var lcBody = (md) => String(md).split(/```/).map((p3, i3) => i3 % 2 ? (() => {
    const m3 = p3.match(/^(\w*)\n?([\s\S]*)$/);
    return `<pre class="lc-code${m3[1] === "suggestion" ? " sug" : ""}">${m3[1] === "suggestion" ? "<b>Suggested change</b>\n" : ""}${esc(m3[2].replace(/\n$/, ""))}</pre>`;
  })() : esc(p3).replace(/\n/g, "<br>")).join("");
  function threadsFor(path) {
    return (S.bundle?.review_comments || []).filter((c3) => c3.path === path);
  }
  function lineThreads(path, line, side, cols, on3) {
    const all = threadsFor(path);
    if (!all.length) return [];
    const roots = all.filter((c3) => !c3.in_reply_to_id && (c3.line ?? c3.original_line) === line && (c3.side || "RIGHT") === side);
    if (!roots.length) return [];
    const res = new Set(S.bundle.resolved_ids || []);
    const b2 = S.bundle, card = (c3, rootId) => ({ user: c3.user, login: c3.user?.login || "ghost", at: c3.created_at, id: c3.id, root: rootId, withMenu: !!S.hasToken, bodyHtml: c3.body_html || esc(c3.body || ""), reactions: reactionProps(c3.reactions, "review_comment", c3.id), sug: null, anchorId: false });
    return roots.map((r3) => {
      const isRes = res.has(r3.id), tid = (b2.thread_ids || {})[r3.id], list = [r3, ...all.filter((c3) => c3.in_reply_to_id === r3.id)];
      const p3 = { cols, k: "t:" + r3.id, def: isRes, folded: isFolded("t:" + r3.id, isRes), side: side === "LEFT" ? "L" : "R", line, outdated: r3.line == null, resolved: isRes, cards: list.map((c3) => card(c3, r3.id)), reply: S.hasToken ? { rid: r3.id, ph: "Write a reply", err: errMsg("reply-" + r3.id) } : null, act: tid && S.hasToken ? { tid, res: isRes } : null };
      return /* @__PURE__ */ u3(ThreadRow, { ...p3, on: on3.conv });
    });
  }
  function lineExtras(path, line, side, cols, canComment, on3, text) {
    const k3 = lineKey(path, line, side), th = lineThreads(path, line, side, cols, on3), mine = pendList().filter((c3) => c3.path === path && c3.line === line && c3.side === side);
    const open2 = canComment && S.lcOpen === k3;
    if (!mine.length && !open2) return th;
    return [...th, /* @__PURE__ */ u3("tr", { class: "lc-row", children: /* @__PURE__ */ u3("td", { colspan: cols, children: /* @__PURE__ */ u3("div", { class: "lc", children: [
      mine.length ? /* @__PURE__ */ u3(LcCards, { cards: mine.map((c3) => ({ id: c3.id, body: lcBody(c3.body) })), on: on3.lc }) : "",
      open2 ? /* @__PURE__ */ u3(LcEdit, { code: side === "RIGHT" && text !== void 0 ? text : null, on: on3.lc }) : ""
    ] }) }) })];
  }
  var diffCache = /* @__PURE__ */ new Map();
  function diffTable(patch, path, canComment, on3) {
    const open2 = S.lcOpen && String(S.lcOpen).includes(path);
    if (open2) return diffTableBuild(patch, path, canComment, on3);
    const key = `${(S.busySels || []).join(",")}|${S.flash?.id}${S.flash?.n}|${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((c3) => c3.path === path))}|${threadsFor(path).map((c3) => c3.id + ":" + (c3.updated_at || "") + JSON.stringify(c3.reactions || {}) + ((S.bundle.resolved_ids || []).includes(c3.id) ? "r" : "") + (isFolded("t:" + c3.id, (S.bundle.resolved_ids || []).includes(c3.id)) ? "f" : "")).join(",")}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith("reply-") ? S.actErr.k + S.actErr.m : ""}`, hit = diffCache.get(key);
    if (hit && hit.patch === patch) return hit.node;
    const node = diffTableBuild(patch, path, canComment, on3);
    diffCache.set(key, { patch, node });
    if (diffCache.size > 400) diffCache.delete(diffCache.keys().next().value);
    return node;
  }
  var Code = ({ text, path, cls = "", marker }) => /* @__PURE__ */ u3("td", { class: `code${cls}`, "data-marker": marker, dangerouslySetInnerHTML: { __html: codeHtml(text, path) } });
  function diffTableBuild(patch, path, canComment, on3) {
    const rows = parsePatch(patch), plus = (line, side) => canComment ? /* @__PURE__ */ u3("button", { class: "lc-plus", "data-lc": lineKey(path, line, side), title: "Add a comment on this line", onClick: on3.plus, children: "+" }) : null;
    const out = [];
    if (S.diffMode === "split") {
      let i3 = 0;
      while (i3 < rows.length) {
        const r3 = rows[i3];
        if (r3.t === "hunk") {
          out.push(/* @__PURE__ */ u3("tr", { class: "hunk", children: [
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "code", colspan: 3, children: r3.text })
          ] }));
          i3++;
          continue;
        }
        if (r3.t === "note") {
          i3++;
          continue;
        }
        if (r3.t === "ctx") {
          out.push(/* @__PURE__ */ u3("tr", { children: [
            /* @__PURE__ */ u3("td", { class: "num", children: r3.o }),
            /* @__PURE__ */ u3(Code, { text: r3.text, path, marker: " " }),
            /* @__PURE__ */ u3("td", { class: "num", children: [
              r3.n,
              plus(r3.n, "RIGHT")
            ] }),
            /* @__PURE__ */ u3(Code, { text: r3.text, path, marker: " " })
          ] }), ...lineExtras(path, r3.n, "RIGHT", 4, canComment, on3, r3.text));
          i3++;
          continue;
        }
        const dels = [], adds = [];
        while (rows[i3] && rows[i3].t === "del") dels.push(rows[i3++]);
        while (rows[i3] && rows[i3].t === "add") adds.push(rows[i3++]);
        for (let k3 = 0; k3 < Math.max(dels.length, adds.length); k3++) {
          const d3 = dels[k3], a3 = adds[k3];
          out.push(/* @__PURE__ */ u3("tr", { children: [
            /* @__PURE__ */ u3("td", { class: `num${d3 ? " del" : " empty"}`, children: d3 ? /* @__PURE__ */ u3(S2, { children: [
              d3.o,
              plus(d3.o, "LEFT")
            ] }) : "" }),
            d3 ? /* @__PURE__ */ u3(Code, { text: d3.text, path, cls: " del", marker: "-" }) : /* @__PURE__ */ u3("td", { class: "code empty" }),
            /* @__PURE__ */ u3("td", { class: `num${a3 ? " add" : " empty"}`, children: a3 ? /* @__PURE__ */ u3(S2, { children: [
              a3.n,
              plus(a3.n, "RIGHT")
            ] }) : "" }),
            a3 ? /* @__PURE__ */ u3(Code, { text: a3.text, path, cls: " add", marker: "+" }) : /* @__PURE__ */ u3("td", { class: "code empty" })
          ] }), ...d3 ? lineExtras(path, d3.o, "LEFT", 4, canComment, on3) : [], ...a3 ? lineExtras(path, a3.n, "RIGHT", 4, canComment, on3, a3.text) : []);
        }
      }
      return /* @__PURE__ */ u3("table", { class: "diff sbs", children: [
        /* @__PURE__ */ u3("colgroup", { children: [
          /* @__PURE__ */ u3("col", { style: "width:64px" }),
          /* @__PURE__ */ u3("col", {}),
          /* @__PURE__ */ u3("col", { style: "width:64px" }),
          /* @__PURE__ */ u3("col", {})
        ] }),
        /* @__PURE__ */ u3("tbody", { children: out })
      ] });
    }
    for (const r3 of rows) {
      if (r3.t === "hunk") out.push(/* @__PURE__ */ u3("tr", { class: "hunk", children: [
        /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
        /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
        /* @__PURE__ */ u3("td", { class: "code", children: r3.text })
      ] }));
      else if (r3.t === "note") out.push(/* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("td", { class: "num" }),
        /* @__PURE__ */ u3("td", { class: "num" }),
        /* @__PURE__ */ u3("td", { class: "code", style: "color:var(--fgColor-muted)", children: r3.text })
      ] }));
      else if (r3.t === "add") out.push(/* @__PURE__ */ u3("tr", { class: "add", children: [
        /* @__PURE__ */ u3("td", { class: "num" }),
        /* @__PURE__ */ u3("td", { class: "num", children: [
          r3.n,
          plus(r3.n, "RIGHT")
        ] }),
        /* @__PURE__ */ u3(Code, { text: r3.text, path, marker: "+" })
      ] }), ...lineExtras(path, r3.n, "RIGHT", 3, canComment, on3, r3.text));
      else if (r3.t === "del") out.push(/* @__PURE__ */ u3("tr", { class: "del", children: [
        /* @__PURE__ */ u3("td", { class: "num", children: [
          r3.o,
          plus(r3.o, "LEFT")
        ] }),
        /* @__PURE__ */ u3("td", { class: "num" }),
        /* @__PURE__ */ u3(Code, { text: r3.text, path, marker: "-" })
      ] }), ...lineExtras(path, r3.o, "LEFT", 3, canComment, on3));
      else out.push(/* @__PURE__ */ u3("tr", { children: [
        /* @__PURE__ */ u3("td", { class: "num", children: r3.o }),
        /* @__PURE__ */ u3("td", { class: "num", children: [
          r3.n,
          plus(r3.n, "RIGHT")
        ] }),
        /* @__PURE__ */ u3(Code, { text: r3.text, path, marker: " " })
      ] }), ...lineExtras(path, r3.n, "RIGHT", 3, canComment, on3, r3.text));
    }
    return /* @__PURE__ */ u3("table", { class: "diff", children: [
      /* @__PURE__ */ u3("colgroup", { children: [
        /* @__PURE__ */ u3("col", { style: "width:64px" }),
        /* @__PURE__ */ u3("col", { style: "width:64px" }),
        /* @__PURE__ */ u3("col", {})
      ] }),
      /* @__PURE__ */ u3("tbody", { children: out })
    ] });
  }
  var sugOf = (c3) => {
    const m3 = (c3.body || "").match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/);
    return m3 ? m3[1] : null;
  };
  function suggestProps(c3, b2, list) {
    const t3 = sugOf(c3);
    if (t3 !== null && S.applied?.has(String(c3.id))) return { kind: "note", text: "Applying suggestion\u2026" };
    if (t3 === null || !b0open() || list.some((x2) => (b2.resolved_ids || []).includes(x2.id))) return null;
    const p3 = b2.pull, mine = p3.head.repo && !p3.head.repo.fork || p3.head.repo && p3.head.repo.full_name === p3.base.repo.full_name;
    if (!c3.line) return { kind: "note", text: "Outdated suggestion \u2014 the lines have changed." };
    return { kind: "btn", id: c3.id, disabled: !p3.head.repo, ref: p3.head.ref, mine: !!mine };
  }
  function reviewBlockProps(e3, b2) {
    const resolved = new Set(b2.resolved_ids || []), isRes = (list) => list.some((c3) => resolved.has(c3.id));
    const stateMap = { approved: ["check", "success", "approved these changes"], changes_requested: ["file-diff", "danger", "requested changes"], commented: ["eye", "", "reviewed"], dismissed: ["x", "", "dismissed a review"] };
    const [ic, kind, verb] = stateMap[e3.state.toLowerCase()] || ["eye", "", "reviewed"];
    const mine = b2.review_comments.filter((c3) => c3.pull_request_review_id === e3.id), mineIds = new Set(mine.map((c3) => c3.id));
    const cs = [...mine, ...b2.review_comments.filter((c3) => c3.pull_request_review_id !== e3.id && mineIds.has(c3.in_reply_to_id))].filter((c3) => !S.who.length || S.who.includes(e3.user?.login) || S.who.includes(c3.user?.login));
    const hasBody = e3.body_html && e3.body_html.trim();
    const byPath = {};
    cs.forEach((c3) => (byPath[`${c3.path}\0${c3.original_position ?? c3.position}`] ||= []).push(c3));
    const all = Object.values(byPath).map((l3) => l3.sort((x2, y3) => (x2.in_reply_to_id ? 1 : 0) - (y3.in_reply_to_id ? 1 : 0) || x2.id - y3.id)), allRes = all.length > 0 && all.every(isRes), nres = all.filter(isRes).length, rk = "r:" + e3.id;
    const lists = S.unres ? all.filter((l3) => !isRes(l3)) : all;
    if (S.unres && !lists.length) return null;
    const threads = lists.map((list) => ({
      folded: isFolded("t:" + list[0].id, isRes(list)),
      k: "t:" + list[0].id,
      def: isRes(list),
      path: list[0].path,
      resolved: isRes(list),
      tid: (b2.thread_ids || {})[list[0].id] ? b2.thread_ids[list[0].id] : null,
      hunk: hunkRows(list[0].diff_hunk || ""),
      cards: list.map((c3) => ({ user: c3.user, login: c3.user.login, at: c3.created_at, id: c3.id, root: list[0].id, withMenu: true, bodyHtml: c3.body_html || "", reactions: reactionProps(c3.reactions, "review_comment", c3.id), sug: suggestProps(c3, b2, list), anchorId: true, kb: S.kbId === "c-" + c3.id, flash: flashFor("c-" + c3.id) })),
      reply: { rid: list[0].id, ph: "Reply\u2026", err: errMsg("reply-" + list[0].id) }
    }));
    const sum = all.length ? { ok: allRes, allRes, text: `${all.length} thread${all.length === 1 ? "" : "s"}${nres ? ` \xB7 ${nres} resolved` : ""}` } : null;
    return { folded: isFolded(rk, allRes), k: rk, kind, ic, user: e3.user, verb, url: e3.html_url ?? "", at: whenParts(e3.submitted_at).text, sum, bodyHtml: hasBody ? e3.body_html : "", threads, allRes };
  }

  // src/app/fold.ts
  function foldToggle(e3, k3, def) {
    e3.stopPropagation();
    if (e3.target.closest("a")) return;
    const now = !isFolded(k3, def);
    S.fold[k3] = now;
    localStorage.setItem("fold", JSON.stringify(S.fold));
    rerender();
    if (!now) reveal(k3);
  }

  // src/app/timeline.tsx
  function rangeBounds() {
    const H2 = 36e5, now = Date.now(), r3 = S.range;
    if (r3 === "1h") return [now - H2, Infinity];
    if (r3 === "24h") return [now - 24 * H2, Infinity];
    if (r3 === "7d") return [now - 7 * 24 * H2, Infinity];
    if (r3 === "30d") return [now - 30 * 24 * H2, Infinity];
    if (r3 === "custom") {
      const lo = S.rFrom ? (/* @__PURE__ */ new Date(S.rFrom + "T00:00:00")).getTime() : -Infinity, hi = S.rTo ? (/* @__PURE__ */ new Date(S.rTo + "T23:59:59.999")).getTime() : Infinity;
      return [lo, hi];
    }
    return [-Infinity, Infinity];
  }
  function timelineModel(b2) {
    const p3 = b2.pull, out = [];
    const evUser = (e3) => {
      const u4 = e3.user || e3.actor || e3.author;
      return u4?.login || u4?.name || "";
    };
    const people = /* @__PURE__ */ new Map(), bump = (u4) => {
      if (!u4?.login) return;
      const r3 = people.get(u4.login) || { u: u4, n: 0 };
      r3.n++;
      people.set(u4.login, r3);
    };
    bump(p3.user);
    b2.timeline.forEach((e3) => {
      if (e3.event === "commented" || e3.event === "reviewed") bump(e3.user);
    });
    b2.review_comments.forEach((c3) => bump(c3.user));
    S.who = S.who.filter((w3) => people.has(w3));
    const who = S.who, on3 = who.length > 0;
    const byUser = on3 ? b2.timeline.filter((e3) => who.includes(evUser(e3)) || e3.event === "reviewed" && b2.review_comments.some((c3) => c3.pull_request_review_id === e3.id && who.includes(c3.user?.login))) : b2.timeline;
    const byKind = S.unres ? byUser.filter((e3) => e3.event === "reviewed") : byUser;
    const evTime = (e3) => e3.created_at || e3.submitted_at || e3.committer?.date || e3.author?.date || "";
    const [rLo, rHi] = rangeBounds(), rangeOn = S.range !== "all";
    const inRange = (t3) => {
      const x2 = t3 ? Date.parse(t3) : NaN;
      return isNaN(x2) || x2 >= rLo && x2 <= rHi;
    };
    const keep4 = !rangeOn ? byKind : byKind.filter((e3) => inRange(evTime(e3)) || e3.event === "reviewed" && b2.review_comments.some((c3) => c3.pull_request_review_id === e3.id && inRange(c3.created_at)) || e3.event === "reviewed" && b2.review_comments.some((c3) => inRange(c3.created_at) && b2.review_comments.some((r3) => r3.id === c3.in_reply_to_id && r3.pull_request_review_id === e3.id)));
    if (!S.unres && (!on3 || who.includes(p3.user.login))) out.push({ t: "comment", p: commentBoxProps({ ...p3, created_at: p3.created_at, html_url: p3.html_url, reactions: p3.reactions }, { isPr: true, flush: true }) });
    const evs = [];
    for (let i3 = 0; i3 < keep4.length; ) {
      let j3 = i3;
      while (j3 < keep4.length && keep4[j3].event === "committed") j3++;
      if (j3 - i3 >= 6) {
        evs.push({ event: "commit-run", n: j3 - i3, first: keep4[i3], last: keep4[j3 - 1] });
        i3 = j3;
      } else {
        evs.push(keep4[i3]);
        i3++;
      }
    }
    if (S.sort === "desc") evs.reverse();
    const info = b2.commit_info || {};
    const simpleRow = (e3, ic, text, kind = "") => out.push({ t: "simple", p: { actor: e3.actor, ic, text, kind, at: e3.created_at } });
    for (const e3 of evs) {
      switch (e3.event) {
        case "commented":
          out.push({ t: "comment", p: commentBoxProps(e3) });
          break;
        case "commit-run":
          out.push({ t: "run", n: e3.n, first: e3.first.sha.slice(0, 7), last: e3.last.sha.slice(0, 7) });
          break;
        case "reviewed": {
          const rp = reviewBlockProps(e3, b2);
          if (rp) out.push({ t: "review", p: rp });
          break;
        }
        case "committed":
          out.push({ t: "committed", row: { first: String(e3.message || "").split("\n")[0], sha: e3.sha, author: info[e3.sha]?.author || (e3.author?.avatar_url ? e3.author : null), url: e3.html_url, verification: e3.verification } });
          break;
        case "referenced": {
          const ci = info[e3.commit_id];
          const ml = ci ? ci.message.split("\n")[0] : "";
          out.push({ t: "referenced", p: { actor: e3.actor, at: e3.created_at, commit: ci ? { author: ci.author, html_url: ci.html_url, sha: ci.sha } : null, msg: ml } });
          break;
        }
        case "merged":
          out.push({ t: "merged", actor: e3.actor, commit: (e3.commit_id || "").slice(0, 7), base: p3.base.label ?? "", at: e3.created_at }, { t: "brk" });
          break;
        case "closed":
          if (!p3.merged) simpleRow(e3, "git-pull-request-closed", "closed this", "danger");
          break;
        case "reopened":
          simpleRow(e3, "git-pull-request", "reopened this", "success");
          break;
        case "cross-referenced": {
          const i3 = e3.source?.issue;
          if (!i3) break;
          const isPr = !!i3.pull_request;
          out.push({ t: "cross", p: { actor: e3.actor, at: e3.created_at, isPr, open: i3.state === "open", icon: isPr ? i3.state === "open" ? "git-pull-request" : "git-merge" : "issue-opened", url: i3.html_url, title: i3.title.split("\n")[0].slice(0, 120), repo: i3.repository?.full_name || "", number: i3.number } });
          break;
        }
        case "labeled":
        case "unlabeled":
          out.push({ t: "label", actor: e3.actor, verb: e3.event === "labeled" ? "added" : "removed", color: e3.label?.color ?? "", name: e3.label?.name ?? "", at: e3.created_at });
          break;
        case "assigned":
        case "unassigned":
          simpleRow(e3, "person", `${e3.event} ${e3.assignee ? e3.assignee.login : ""}`);
          break;
        case "review_requested":
          simpleRow(e3, "eye", `requested a review from ${e3.requested_reviewer?.login || e3.requested_team?.name || ""}`);
          break;
        case "renamed":
          simpleRow(e3, "pencil", /* @__PURE__ */ u3(S2, { children: [
            "changed the title ",
            /* @__PURE__ */ u3("s", { children: e3.rename?.from }),
            " ",
            e3.rename?.to
          ] }));
          break;
        case "head_ref_force_pushed":
          simpleRow(e3, "repo-push", "force-pushed the head branch");
          break;
        case "head_ref_deleted":
          simpleRow(e3, "git-branch", "deleted the head branch");
          break;
        case "ready_for_review":
          simpleRow(e3, "eye", "marked this pull request as ready for review");
          break;
        case "convert_to_draft":
          simpleRow(e3, "git-pull-request-draft", "marked this pull request as draft");
          break;
        case "milestoned":
          simpleRow(e3, "milestone", `added this to the ${e3.milestone?.title ?? ""} milestone`);
          break;
        case "locked":
          simpleRow(e3, "lock", "locked this conversation");
          break;
        default:
          break;
      }
    }
    return {
      who: people.size > 1 ? { everyone: !on3, people: [...people.values()].sort((x2, y3) => y3.n - x2.n).map(({ u: u4, n: n2 }) => ({ u: u4, n: n2, on: who.includes(u4.login) })) } : null,
      range: { range: S.range, from: S.rFrom, to: S.rTo, desc: S.sort === "desc" },
      rows: out,
      empty: !evs.length && (on3 || rangeOn) ? rangeOn ? "No activity in this period." : "Nothing from the selected accounts." : "",
      merge: on3 ? null : mergeModel(b2),
      act: mergeActProps(b2),
      composer: composerProps(b2)
    };
  }
  var checkState = (c3) => c3.status !== "completed" ? "pending" : c3.conclusion === "success" ? "pass" : ["skipped", "neutral"].includes(c3.conclusion) ? "skip" : "fail";
  var CK = { pass: ["check-circle-fill", "Passed"], fail: ["x-circle-fill", "Failed"], pending: ["dot-fill", "In progress"], skip: ["circle-slash", "Skipped"] };
  function checksView(b2) {
    const list = (b2.checks || []).map((c3) => ({ ...c3, st: checkState(c3) }));
    if (!list.length) return /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No checks reported for the latest commit." });
    const n2 = (s3) => list.filter((c3) => c3.st === s3).length;
    const rank = { fail: 0, pending: 1, pass: 2, skip: 3 };
    list.sort((x2, y3) => rank[x2.st] - rank[y3.st] || String(x2.name).localeCompare(String(y3.name)));
    const head2 = n2("fail") ? ["fail", `${n2("fail")} failing`] : n2("pending") ? ["pending", `${n2("pending")} in progress`] : ["pass", "All checks passed"];
    const dur = (c3) => {
      const s3 = Date.parse(c3.started_at), e3 = Date.parse(c3.completed_at);
      if (!s3 || !e3 || e3 < s3) return "";
      const t3 = Math.round((e3 - s3) / 1e3);
      return t3 >= 60 ? `${Math.floor(t3 / 60)}m ${t3 % 60}s` : `${t3}s`;
    };
    const rows = list.map((c3) => ({ name: c3.name, st: c3.st, url: c3.url, desc: c3.description || (c3.app ? c3.app : ""), req: (S.bundle?.required_checks || []).includes(c3.name), status: c3.st === "fail" && c3.conclusion && c3.conclusion !== "failure" ? c3.conclusion.replace(/_/g, " ") : CK[c3.st][1], dur: dur(c3), icon: CK[c3.st][0] }));
    return /* @__PURE__ */ u3(Checks, { head: [head2[0], head2[1]], headIcon: CK[head2[0]][0], summary: [n2("fail") && `${n2("fail")} failing`, n2("pending") && `${n2("pending")} in progress`, n2("pass") && `${n2("pass")} passed`, n2("skip") && `${n2("skip")} skipped`].filter(Boolean).join(" \xB7 "), rows });
  }
  function unresolvedRoots(b2) {
    const res = new Set(b2.resolved_ids || []);
    return b2.review_comments.filter((c3) => !c3.in_reply_to_id && !res.has(c3.id));
  }
  function attentionProps(b2) {
    const p3 = b2.pull, rc = b2.review_comments, roots = rc.filter((c3) => !c3.in_reply_to_id), open2 = unresolvedRoots(b2);
    const known = S.hasToken || (b2.resolved_ids || []).length > 0;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e3) => e3.event === "reviewed" && e3.user).forEach((e3) => {
      const st = e3.state.toLowerCase();
      if (st === "commented" && latest.has(e3.user.login)) return;
      latest.set(e3.user.login, st);
    });
    const cr = [...latest.values()].filter((s3) => s3 === "changes_requested").length, ap = [...latest.values()].filter((s3) => s3 === "approved").length;
    const ck = (b2.checks || []).map(checkState), fail = ck.filter((s3) => s3 === "fail").length, pend = ck.filter((s3) => s3 === "pending").length, pass = ck.filter((s3) => s3 === "pass").length;
    const it = [];
    const add = (k3, ic, text, attr = {}) => it.push({ k: k3, ic, text, ...attr });
    if (roots.length) {
      if (!known) add("", "comment", `${roots.length} review thread${roots.length === 1 ? "" : "s"}`);
      else if (open2.length) add("bad", "comment", `${open2.length} unresolved thread${open2.length === 1 ? "" : "s"}`, { id: "nextun", title: "Jump to the next unresolved thread" });
      else add("ok", "check-circle-fill", "All threads resolved");
    }
    add(cr ? "bad" : ap ? "ok" : "", cr ? "file-diff" : ap ? "check" : "eye", cr ? `${cr} requesting changes` : ap ? `${ap} approved` : "No approvals yet");
    if (ck.length) add(fail ? "bad" : pend ? "warn" : "ok", fail ? "x-circle-fill" : pend ? "dot-fill" : "check-circle-fill", fail ? `${fail} check${fail === 1 ? "" : "s"} failing` : pend ? `${pend} check${pend === 1 ? "" : "s"} running` : `${pass} check${pass === 1 ? "" : "s"} passed`, { dataTab: "checks", title: "Open checks" });
    if (p3.merged) add("done", "git-merge", "Merged");
    else if (p3.state === "closed") add("bad", "git-pull-request-closed", "Closed");
    else if (p3.mergeable === false || p3.mergeable_state === "dirty") add("bad", "alert", "Has conflicts");
    else if (p3.mergeable_state === "clean") add("ok", "git-merge", "Ready to merge");
    else if (p3.draft) add("", "git-pull-request-draft", "Draft");
    return { items: it, unres: S.unres, showUnres: roots.length > 0 };
  }
  function jumpUnresolved() {
    const b2 = S.bundle, list = unresolvedRoots(b2);
    if (!list.length) return;
    const c3 = list[S.unIdx % list.length];
    S.unIdx++;
    const first = b2.review_comments.find((x2) => x2.pull_request_review_id === c3.pull_request_review_id && x2.path === c3.path && (x2.original_position ?? x2.position) === (c3.original_position ?? c3.position)) || c3;
    S.fold["r:" + c3.pull_request_review_id] = false;
    S.fold["t:" + first.id] = false;
    S.fold["c:" + c3.id] = false;
    localStorage.setItem("fold", JSON.stringify(S.fold));
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    {
      setFlash("c-" + c3.id, { block: "center", smooth: true });
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }
  }
  var foldKeys = (m3) => m3.rows.flatMap((r3) => r3.t === "comment" ? [{ k: "c:" + r3.p.c.id, def: false }] : r3.t === "review" ? [{ k: r3.p.k, def: r3.p.allRes }, ...r3.p.threads.map((t3) => ({ k: t3.k, def: t3.def }))] : []);
  function Row({ r: r3, on: on3 }) {
    switch (r3.t) {
      case "referenced":
        return /* @__PURE__ */ u3(Referenced, { ...r3.p });
      case "comment":
        return /* @__PURE__ */ u3(CommentBox, { ...r3.p, on: on3?.conv });
      case "review":
        return /* @__PURE__ */ u3(ReviewBlock, { ...r3.p, on: on3?.conv });
      case "run":
        return /* @__PURE__ */ u3(CommitRun, { n: r3.n, first: r3.first, last: r3.last, onTab: on3?.tab });
      case "committed":
        return /* @__PURE__ */ u3(Committed, { row: /* @__PURE__ */ u3(CommitRow, { ...r3.row }) });
      case "merged":
        return /* @__PURE__ */ u3(MergedRow, { actor: r3.actor, commit: r3.commit, base: r3.base, at: r3.at });
      case "brk":
        return /* @__PURE__ */ u3("div", { class: "TLI-break" });
      case "cross":
        return /* @__PURE__ */ u3(CrossRef, { ...r3.p });
      case "label":
        return /* @__PURE__ */ u3(LabelRow, { actor: r3.actor, verb: r3.verb, color: r3.color, name: r3.name, at: r3.at });
      case "simple":
        return /* @__PURE__ */ u3(Simple, { ...r3.p });
    }
  }
  function Timeline({ m: m3, on: on3 }) {
    const box = m3.merge && (m3.merge.kind === "merged" ? /* @__PURE__ */ u3(MergedBox, { head: m3.merge.head }) : m3.merge.kind === "closed" ? /* @__PURE__ */ u3(ClosedBox, { head: m3.merge.head }) : /* @__PURE__ */ u3(MergeBox, { ...m3.merge.p, on: on3?.merge }));
    const keys = foldKeys(m3);
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Bars, { who: m3.who, range: m3.range, on: on3?.bars }),
      /* @__PURE__ */ u3(FoldBar, { folded: keys.length > 0 && keys.every((x2) => isFolded(x2.k, x2.def)), onClick: () => on3?.foldAll(keys) }),
      /* @__PURE__ */ u3("div", { class: "TL", children: [
        m3.rows.map((r3) => /* @__PURE__ */ u3(Row, { r: r3, on: on3 })),
        m3.empty ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: m3.empty }) : ""
      ] }),
      box,
      m3.act ? /* @__PURE__ */ u3(MergeAct, { ...m3.act, on: on3?.act }) : "",
      /* @__PURE__ */ u3(Composer, { ...m3.composer, on: on3?.composer })
    ] });
  }

  // src/app/handlers.ts
  var convOn = {
    fold: (e3, k3, def) => foldToggle(e3, k3, def),
    menu: (e3, b2) => cmMenu(e3, b2),
    react: { toggle: (e3, kind, id, c3) => reactToggle(e3, kind, id, c3), add: (e3, b2) => reactAdd(e3, b2), hover: (kind, id) => {
      getMine(kind, id);
    } },
    thread: (e3, node, how) => {
      threadAct(e3, node, how);
    },
    sug: (e3, id) => applySuggestion(e3, id),
    reply: (id) => {
      sendReply(id);
    }
  };
  var diffOn = { conv: convOn, plus: (e3) => lcOpen(e3), lc: { del: (id) => lcDel(id), cancel: () => lcCancel(), suggest: (e3) => lcSuggest(e3), add: () => lcAdd() } };
  var keep = (fn) => {
    S.keepScroll = true;
    fn();
    render();
    S.keepScroll = false;
  };
  function openTab(k3) {
    S.tab = k3;
    render();
    scrollMain(0);
  }
  var filesOn = {
    commits: () => openCommits(),
    all: () => setFr(null),
    step: (n2) => {
      const cs = commitList(S.bundle), i3 = (S.fr?.a ?? 0) + n2;
      if (cs[i3]) setFr({ a: i3, b: i3 });
    },
    mode: (m3) => setDiffMode(m3),
    sort: (e3) => {
      S.fileSort = e3.target.value;
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
    fold: (e3, k3, def) => foldToggle(e3, k3, def)
  };
  var attOn = { next: () => jumpUnresolved(), unres: () => keep(() => {
    S.unres = !S.unres;
  }), tab: openTab };
  var tlOn = {
    conv: convOn,
    bars: {
      who: (w3) => keep(() => {
        S.who = S.who.includes(w3) ? S.who.filter((x2) => x2 !== w3) : [...S.who, w3];
      }),
      whoClear: () => keep(() => {
        S.who = [];
      }),
      range: (e3) => keep(() => {
        S.range = e3.target.value;
        if (S.range === "custom" && !S.rFrom && !S.rTo) {
          const d3 = (t3) => new Date(t3 - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
          S.rTo = d3(Date.now());
          S.rFrom = d3(Date.now() - 7 * 864e5);
        }
      }),
      from: (e3) => keep(() => {
        S.rFrom = e3.target.value;
      }),
      to: (e3) => keep(() => {
        S.rTo = e3.target.value;
      }),
      sort: () => keep(() => {
        S.sort = S.sort === "desc" ? "asc" : "desc";
        localStorage.setItem("csort", S.sort);
      })
    },
    foldAll: foldAllConv,
    tab: openTab,
    merge: { toggle: (e3, k3) => toggleMb(e3, k3), rerun: (e3) => {
      rerunChecks(e3);
    }, update: () => {
      updateBranch();
    }, ready: () => {
      markReady();
    } },
    act: { close: () => toggleClosed(), merge: () => doMerge(), noauto: () => {
      disableAuto();
    }, auto: () => {
      enableAuto();
    }, draft: () => toDraft(), method: (e3) => {
      S.method = e3.currentTarget.value;
      rerender();
    } },
    composer: { toggle: () => toggleComposer(), key: (e3) => cbarKey(e3), send: () => {
      sendComment();
    }, close: () => toggleClosed(), measure: (m3) => {
      S.composerBox = m3;
    } }
  };

  // src/components/ToTop.tsx
  var ToTop = ({ hidden, onClick }) => /* @__PURE__ */ u3("button", { id: "totop", title: "Back to top", "aria-label": "Back to top", hidden, onClick, children: I2("chevron-up") });

  // src/components/Home.tsx
  var cap = (s3) => s3[0].toUpperCase() + s3.slice(1);
  function Banners({ items, on: on3 }) {
    return /* @__PURE__ */ u3(S2, { children: items.map((p3) => /* @__PURE__ */ u3("div", { class: "push-banner", children: [
      I2("git-branch"),
      /* @__PURE__ */ u3("span", { children: [
        /* @__PURE__ */ u3("b", { children: p3.branch }),
        " had recent pushes ",
        p3.ago,
        p3.showRepo ? /* @__PURE__ */ u3(S2, { children: [
          " ",
          /* @__PURE__ */ u3("i", { children: [
            "\xB7 ",
            p3.repo
          ] })
        ] }) : ""
      ] }),
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3("button", { class: "btn small primary", "data-compare": `${p3.repo}@${p3.branch}`, onClick: () => on3.compare(p3.repo, p3.branch), children: "Compare & pull request" }),
      /* @__PURE__ */ u3("button", { class: "push-x", "data-pdismiss": p3.key, onClick: () => on3.dismiss(p3.key), title: "Dismiss", children: I2("x") })
    ] })) });
  }
  function Card({ r: r3, on: on3 }) {
    return /* @__PURE__ */ u3("a", { class: "hm-card", "data-repo": r3.full, onClick: () => on3.repo(r3.full), children: [
      /* @__PURE__ */ u3("span", { class: "rc-i", style: "color:var(--fgColor-muted)", children: I2(r3.priv ? "lock" : "repo") }),
      /* @__PURE__ */ u3("span", { class: "hm-t", children: [
        /* @__PURE__ */ u3("b", { children: r3.name }),
        /* @__PURE__ */ u3("i", { children: [
          r3.owner,
          r3.archived ? " \xB7 archived" : "",
          r3.issues ? ` \xB7 ${r3.issues} open` : ""
        ] }),
        r3.desc ? /* @__PURE__ */ u3("em", { children: r3.desc }) : ""
      ] })
    ] });
  }
  function Opt({ v: v3, cur, t: t3 }) {
    return /* @__PURE__ */ u3("option", { value: v3, selected: cur === v3, children: t3 });
  }
  function Body({ b: b2, on: on3 }) {
    if (b2.kind === "addtoken") return /* @__PURE__ */ u3("div", { class: "diff-empty", children: [
      "Add an access token to list all your repositories and their pull requests.",
      /* @__PURE__ */ u3("br", {}),
      /* @__PURE__ */ u3("br", {}),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "addtoken", onClick: on3.addToken, children: "Add token" })
    ] });
    if (b2.kind === "error") return /* @__PURE__ */ u3("div", { class: "diff-empty err", children: b2.text });
    if (b2.kind === "spinner") return /* @__PURE__ */ u3("div", { class: "spinner", style: "margin:48px auto", children: "Loading repositories\u2026" });
    if (b2.kind === "recent") {
      return /* @__PURE__ */ u3(S2, { children: [
        b2.hasAny ? /* @__PURE__ */ u3("div", { class: "hm-fbar", children: [
          /* @__PURE__ */ u3("input", { class: "input hm-filter", id: "hmrfilter", placeholder: "Filter by title or repo\u2026", value: b2.filter, onInput: on3.recentFilter }),
          /* @__PURE__ */ u3("div", { class: "seg-ctl", children: ["all", "open", "merged", "closed"].map((x2) => /* @__PURE__ */ u3("button", { class: b2.state === x2 ? "on" : "", "data-rstate": x2, onClick: () => on3.rstate(x2), children: cap(x2) })) })
        ] }) : "",
        b2.cards.length ? /* @__PURE__ */ u3("div", { class: "hm-grid", children: b2.cards.map((r3) => /* @__PURE__ */ u3("a", { class: "hm-card", "data-open": r3.ref, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
          /* @__PURE__ */ u3("span", { class: `rc-i ${r3.state}`, children: I2(r3.icon) }),
          /* @__PURE__ */ u3("span", { class: "hm-t", children: [
            /* @__PURE__ */ u3("b", { children: r3.title }),
            /* @__PURE__ */ u3("i", { children: r3.ref })
          ] }),
          /* @__PURE__ */ u3("button", { class: "rc-x", "data-rm": r3.ref, onClick: (e3) => on3.rm(e3, r3.ref), title: "Remove", children: I2("x") })
        ] })) }) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: b2.emptyText })
      ] });
    }
    const grid = b2.none ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No matching repositories." }) : b2.groups ? /* @__PURE__ */ u3(S2, { children: b2.groups.map((g2) => /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("h3", { class: "hm-grp", children: [
        g2.owner,
        /* @__PURE__ */ u3("span", { children: g2.cards.length })
      ] }),
      /* @__PURE__ */ u3("div", { class: "hm-grid", children: g2.cards.map((r3) => /* @__PURE__ */ u3(Card, { r: r3, on: on3 })) })
    ] })) }) : /* @__PURE__ */ u3("div", { class: "hm-grid", children: b2.cards.map((r3) => /* @__PURE__ */ u3(Card, { r: r3, on: on3 })) });
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("div", { class: "hm-fbar", children: [
        /* @__PURE__ */ u3("input", { class: "input hm-filter", id: "hmfilter", placeholder: "Find a repository\u2026", value: b2.filter, onInput: on3.repoFilter }),
        /* @__PURE__ */ u3("div", { class: "seg-ctl", children: ["all", "public", "private"].map((x2) => /* @__PURE__ */ u3("button", { class: b2.vis === x2 ? "on" : "", "data-hvis": x2, onClick: () => on3.vis(x2), children: cap(x2) })) }),
        /* @__PURE__ */ u3("select", { class: "input", id: "hmsort", title: "Sort", onChange: on3.sort, children: [
          /* @__PURE__ */ u3(Opt, { v: "pushed", cur: b2.sort, t: "Recently pushed" }),
          /* @__PURE__ */ u3(Opt, { v: "oldest", cur: b2.sort, t: "Least recently pushed" }),
          /* @__PURE__ */ u3(Opt, { v: "name", cur: b2.sort, t: "Name A\u2013Z" }),
          /* @__PURE__ */ u3(Opt, { v: "namez", cur: b2.sort, t: "Name Z\u2013A" }),
          /* @__PURE__ */ u3(Opt, { v: "owner", cur: b2.sort, t: "Owner A\u2013Z" }),
          /* @__PURE__ */ u3(Opt, { v: "ownerz", cur: b2.sort, t: "Owner Z\u2013A" }),
          /* @__PURE__ */ u3(Opt, { v: "issues", cur: b2.sort, t: "Most open issues" })
        ] }),
        /* @__PURE__ */ u3("select", { class: "input", id: "hmgroup", title: "Group", onChange: on3.group, children: [
          /* @__PURE__ */ u3(Opt, { v: "none", cur: b2.group, t: "No grouping" }),
          /* @__PURE__ */ u3(Opt, { v: "owner", cur: b2.group, t: "Group by owner" })
        ] })
      ] }),
      grid
    ] });
  }
  function Home({ p: p3, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "notes-page hm-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: /* @__PURE__ */ u3("h1", { children: [
        I2("home"),
        SP,
        p3.owner || "Home"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u3("p", { class: "hm-hint", children: [
        "Open a pull request: type ",
        /* @__PURE__ */ u3("code", { children: "owner/repo#123" }),
        " or paste a URL in the bar above."
      ] }),
      p3.banners.length ? /* @__PURE__ */ u3("div", { class: "push-wrap", children: /* @__PURE__ */ u3(Banners, { items: p3.banners, on: on3 }) }) : "",
      p3.err ? /* @__PURE__ */ u3("div", { class: "err", children: p3.err }) : "",
      /* @__PURE__ */ u3("div", { class: "np-tabs", children: [
        /* @__PURE__ */ u3("button", { class: p3.tab === "repos" ? "sel" : "", "data-htab": "repos", onClick: () => on3.tab("repos"), children: [
          I2("repo"),
          " Repositories",
          p3.repoCount !== null ? /* @__PURE__ */ u3("span", { children: p3.repoCount }) : ""
        ] }),
        /* @__PURE__ */ u3("button", { class: p3.tab === "recent" ? "sel" : "", "data-htab": "recent", onClick: () => on3.tab("recent"), children: [
          I2("clock"),
          " Recent",
          /* @__PURE__ */ u3("span", { children: p3.recentCount })
        ] })
      ] }),
      /* @__PURE__ */ u3(Body, { b: p3.body, on: on3 })
    ] });
  }

  // src/components/PrList.tsx
  var cap2 = (s3) => s3[0].toUpperCase() + s3.slice(1);
  function Opts({ arr, v: v3, all }) {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("option", { value: "", children: all }),
      arr.map((x2) => /* @__PURE__ */ u3("option", { value: x2, selected: x2 === v3, children: x2 }))
    ] });
  }
  function FilterBar({ p: p3, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "prl-filters", children: [
      /* @__PURE__ */ u3("span", { class: "pf-search", children: [
        I2("search"),
        /* @__PURE__ */ u3("input", { class: "input", id: "mainfilter", placeholder: "Filter by title, #, author, branch, label\u2026", value: p3.filter, spellcheck: false, onInput: on3.filter })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfauthor", onChange: on3.author, children: /* @__PURE__ */ u3(Opts, { arr: p3.authors, v: p3.author, all: "Author: all" }) }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pflabel", onChange: on3.label, children: /* @__PURE__ */ u3(Opts, { arr: p3.labels, v: p3.label, all: "Label: all" }) }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfstatus", onChange: on3.status, children: [
        /* @__PURE__ */ u3("option", { value: "", children: "Status: any" }),
        p3.statuses.map(([k3, t3]) => /* @__PURE__ */ u3("option", { value: k3, selected: k3 === p3.status, children: t3 }))
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfsort", onChange: on3.sort, children: p3.sorts.map(([k3, t3]) => /* @__PURE__ */ u3("option", { value: k3, selected: k3 === p3.sort, children: [
        "Sort: ",
        t3
      ] })) }),
      "\n  ",
      /* @__PURE__ */ u3("span", { class: "pf-count", children: [
        p3.n,
        " of ",
        p3.total
      ] }),
      p3.active ? /* @__PURE__ */ u3("button", { class: "btn", id: "pfclear", onClick: on3.clear, children: "Clear" }) : ""
    ] });
  }
  function PrListPage({ p: p3, on: on3 }) {
    const body = p3.err ? /* @__PURE__ */ u3("div", { class: "err", style: "padding:16px", children: p3.err }) : p3.loading ? /* @__PURE__ */ u3("div", { class: "spinner", style: "margin:48px auto", children: "Loading pull requests\u2026" }) : p3.rows && p3.rows.length ? /* @__PURE__ */ u3(S2, { children: p3.rows.map((r3) => /* @__PURE__ */ u3("a", { class: "prl-row", "data-open": r3.ref, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
      /* @__PURE__ */ u3("span", { class: `rc-i ${r3.st}`, children: I2(r3.icon) }),
      /* @__PURE__ */ u3("span", { class: "prl-main", children: [
        /* @__PURE__ */ u3("b", { children: r3.title }),
        r3.labels.map((l3) => /* @__PURE__ */ u3("span", { class: "pill-label", style: `background:#${l3.color}33;color:#${l3.color};border-color:#${l3.color};margin:0 0 0 4px`, children: l3.name })),
        /* @__PURE__ */ u3("i", { children: r3.meta })
      ] }),
      /* @__PURE__ */ u3("img", { src: `${r3.avatar}&s=40`, width: 20, height: 20, style: "border-radius:50%" })
    ] })) }) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: p3.empty });
    return /* @__PURE__ */ u3("div", { class: "pr-page", children: [
      /* @__PURE__ */ u3("div", { class: "repoline", style: "padding-bottom:16px" }),
      /* @__PURE__ */ u3(Banners, { items: p3.banners, on: on3 }),
      /* @__PURE__ */ u3("div", { class: "prl", children: [
        /* @__PURE__ */ u3("div", { class: "prl-head", children: [
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3("span", { class: "repo-ic", children: I2("repo", 16) }),
            SP,
            /* @__PURE__ */ u3("b", { children: p3.repo })
          ] }),
          /* @__PURE__ */ u3("div", { class: "seg", children: ["open", "closed", "all"].map((s3) => /* @__PURE__ */ u3("button", { "data-ps": s3, class: p3.state === s3 ? "on" : "", onClick: () => on3.ps(s3), children: cap2(s3) })) })
        ] }),
        p3.filterBar ? /* @__PURE__ */ u3(FilterBar, { p: p3.filterBar, on: on3 }) : null,
        body
      ] })
    ] });
  }
  function Crumbs({ repo, trail, extraNode, on: on3 }) {
    const homeCur = !repo && !trail.length;
    const parts = [homeCur ? /* @__PURE__ */ u3("span", { class: "crumb cur home", children: [
      I2("home", 14),
      /* @__PURE__ */ u3("span", { children: "Home" })
    ] }) : /* @__PURE__ */ u3("a", { class: "crumb", "data-home": "1", onClick: on3 && on3.home, title: "Home", children: [
      I2("home", 14),
      /* @__PURE__ */ u3("span", { children: "Home" })
    ] })];
    if (repo) {
      const [owner, name] = repo.split("/");
      parts.push(/* @__PURE__ */ u3("span", { class: "crumb-grp", children: [
        /* @__PURE__ */ u3("a", { class: "crumb", "data-owner": owner, onClick: on3 && (() => on3.owner(owner)), title: `Repositories of ${owner}`, children: owner }),
        /* @__PURE__ */ u3("span", { class: "crumb-slash", children: "/" }),
        /* @__PURE__ */ u3("a", { class: "crumb strong", "data-repo": repo, onClick: on3 && (() => on3.repo(repo)), title: `All pull requests in ${repo}`, children: name })
      ] }));
    }
    trail.forEach((t3, i3) => parts.push(i3 === trail.length - 1 ? /* @__PURE__ */ u3("span", { class: "crumb cur", children: t3.t }) : /* @__PURE__ */ u3("a", { class: "crumb", "data-repo": t3.repo || void 0, onClick: on3 && t3.repo ? (() => on3.repo(t3.repo)) : void 0, children: t3.t })));
    return /* @__PURE__ */ u3("nav", { class: "repoline crumbs", "aria-label": "Breadcrumb", children: [
      parts.map((x2, i3) => /* @__PURE__ */ u3(S2, { children: [
        i3 ? /* @__PURE__ */ u3("span", { class: "crumb-sep", children: I2("chevron-right", 12) }) : "",
        x2
      ] })),
      extraNode
    ] });
  }

  // src/components/Pages.tsx
  function NotesPage({ f: f4, rows, unread, total, on: on3 }) {
    const tabs = [["all", "All", total], ["unread", "Unread", unread], ["read", "Read", total - unread]];
    return /* @__PURE__ */ u3("div", { class: "notes-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: [
        /* @__PURE__ */ u3("h1", { children: [
          I2("bell"),
          SP,
          "Notifications"
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-tools", children: [
          /* @__PURE__ */ u3("button", { class: "btn small", id: "npcheck", onClick: on3.check, children: "Check now" }),
          /* @__PURE__ */ u3("button", { class: "btn small", id: "npreadall", onClick: on3.readAll, disabled: !unread, children: "Mark all as read" }),
          /* @__PURE__ */ u3("button", { class: "btn small ghost", id: "npclear", onClick: on3.clear, disabled: !total, children: "Clear all" })
        ] })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-tabs", children: tabs.map(([k3, l3, c3]) => /* @__PURE__ */ u3("button", { class: f4 === k3 ? "sel" : "", "data-nf": k3, onClick: () => on3.filter(k3), children: [
        l3,
        /* @__PURE__ */ u3("span", { children: c3 })
      ] })) }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-list", children: rows.length ? rows.map((n2) => /* @__PURE__ */ u3("div", { class: `np-row ${n2.read ? "" : "new"}`, children: [
        /* @__PURE__ */ u3("button", { class: "np-dot", "data-nread": n2.id, onClick: (e3) => on3.read(e3, n2.id), title: n2.read ? "Mark as unread" : "Mark as read" }),
        "\n    ",
        /* @__PURE__ */ u3("a", { class: "np-main", "data-open": n2.ref, "data-target": n2.target, "data-note": n2.id, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
          /* @__PURE__ */ u3("b", { children: n2.title }),
          /* @__PURE__ */ u3("span", { children: n2.text }),
          /* @__PURE__ */ u3("i", { children: [
            n2.ref,
            " \xB7 ",
            n2.when
          ] })
        ] }),
        "\n    ",
        /* @__PURE__ */ u3("button", { class: "np-act", "data-nread": n2.id, onClick: (e3) => on3.read(e3, n2.id), children: n2.read ? "Mark unread" : "Mark read" }),
        /* @__PURE__ */ u3("button", { class: "np-act del", "data-ndel": n2.id, onClick: (e3) => on3.del(e3, n2.id), title: "Delete", children: I2("x") })
      ] })) : /* @__PURE__ */ u3("div", { class: "note-empty np-empty", children: f4 === "unread" ? "You are all caught up." : f4 === "read" ? "Nothing read yet." : "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." }) })
    ] });
  }
  function NpMeta({ p: p3, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "np-box np-metas", id: "npmeta", children: [
      p3.rows.map((r3) => /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: r3.name }),
        /* @__PURE__ */ u3("div", { class: "np-chips", children: [
          r3.chips.map((x2) => /* @__PURE__ */ u3("span", { class: "np-chip", "data-npdel": r3.k, "data-v": x2, onClick: () => on3.del(r3.k, x2), title: "Remove", children: [
            x2,
            " \xD7"
          ] })),
          r3.free.length ? /* @__PURE__ */ u3("select", { class: "sel np-add", "data-npadd": r3.k, value: "", onChange: (e3) => on3.add(r3.k, e3), children: [
            /* @__PURE__ */ u3("option", { value: "", children: `Add ${r3.name.toLowerCase()}\u2026` }),
            r3.free.map((x2) => /* @__PURE__ */ u3("option", { children: x2 }))
          ] }) : ""
        ] })
      ] })),
      "\n    ",
      /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: "Milestone" }),
        /* @__PURE__ */ u3("select", { class: "sel", id: "npmile", onChange: on3.mile, children: [
          /* @__PURE__ */ u3("option", { value: "", children: "None" }),
          p3.milestones.map((x2) => /* @__PURE__ */ u3("option", { value: x2.number, selected: x2.on, children: x2.title }))
        ] })
      ] }),
      "\n    ",
      /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: [
          "Linked issues ",
          /* @__PURE__ */ u3("i", { children: "closed when this merges" })
        ] }),
        /* @__PURE__ */ u3("input", { class: "input", id: "npissues", placeholder: "e.g. 12, 15", value: p3.issues, onInput: on3.issues })
      ] })
    ] });
  }
  function NewPr({ p: p3, on: on3 }) {
    const c3 = p3.cmp;
    const cmp = c3.kind === "loading" ? /* @__PURE__ */ u3("span", { class: "np-note", children: "Comparing\u2026" }) : c3.kind === "none" ? "" : c3.kind === "err" ? /* @__PURE__ */ u3("span", { class: "np-note err", children: c3.text }) : c3.kind === "ok" ? /* @__PURE__ */ u3("span", { class: "np-note ok", children: [
      I2("git-commit"),
      SP,
      c3.ahead,
      " commit",
      c3.ahead === 1 ? "" : "s",
      " \xB7 ",
      c3.files,
      " file",
      c3.files === 1 ? "" : "s",
      " changed",
      c3.behind ? ` \xB7 ${c3.behind} behind ${p3.base}` : ""
    ] }) : /* @__PURE__ */ u3("span", { class: "np-note err", children: "These branches are identical \u2014 there is nothing to compare." });
    const t3 = p3.tpls;
    return /* @__PURE__ */ u3("div", { class: "notes-page np-new", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: /* @__PURE__ */ u3("h1", { children: [
        I2("git-pull-request"),
        SP,
        "New pull request"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-card", children: [
        /* @__PURE__ */ u3("div", { class: "np-main-col", children: [
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Repository" }),
            p3.hasRepos ? /* @__PURE__ */ u3("button", { type: "button", class: "sel bp-btn", id: "nprepo", onClick: on3.repo, children: [
              /* @__PURE__ */ u3("span", { children: p3.repo || "Choose a repository" }),
              I2("chevron-down", 14)
            ] }) : /* @__PURE__ */ u3("input", { class: "input", id: "nprepoin", placeholder: "owner/repo", value: p3.repo, onChange: on3.repoIn }),
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-branches", children: [
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3("label", { class: "np-l", children: [
                  "Base ",
                  /* @__PURE__ */ u3("i", { children: "merge into" })
                ] }),
                /* @__PURE__ */ u3("button", { type: "button", class: "sel bp-btn", id: "npbase", "data-bp": "base", onClick: on3.base, disabled: !p3.hasBranches, children: [
                  /* @__PURE__ */ u3("span", { children: p3.hasBranches ? p3.base || "Choose a branch" : "Loading\u2026" }),
                  I2("chevron-down", 14)
                ] })
              ] }),
              "\n      ",
              /* @__PURE__ */ u3("button", { class: "tb-btn", id: "npswap", onClick: on3.swap, title: "Swap base and head", children: "\u21C4" }),
              "\n      ",
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3("label", { class: "np-l", children: [
                  "Head ",
                  /* @__PURE__ */ u3("i", { children: "changes from" })
                ] }),
                /* @__PURE__ */ u3("button", { type: "button", class: "sel bp-btn", id: "nphead", "data-bp": "head", onClick: on3.head, disabled: !p3.hasBranches, children: [
                  /* @__PURE__ */ u3("span", { children: p3.hasBranches ? p3.head || "Choose a branch" : "Loading\u2026" }),
                  I2("chevron-down", 14)
                ] })
              ] })
            ] }),
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-cmp", children: p3.same ? /* @__PURE__ */ u3("span", { class: "np-note err", children: "Base and head are the same branch." }) : cmp })
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Title" }),
            /* @__PURE__ */ u3("input", { class: "input", id: "nptitle", placeholder: "Title", value: p3.title, onInput: on3.title })
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Description" }),
            t3 && t3.length > 1 ? /* @__PURE__ */ u3("select", { class: "sel np-tpl", id: "nptpl", value: String(t3.findIndex((x2) => x2.body === p3.tplText)), onChange: on3.tpl, children: [
              /* @__PURE__ */ u3("option", { value: "-1", children: "No template" }),
              t3.map((x2, i3) => /* @__PURE__ */ u3("option", { value: i3, children: [
                "Template: ",
                x2.name
              ] }))
            ] }) : "",
            /* @__PURE__ */ u3(DraftBox, { k: "newpr", ph: "Describe your changes", rows: 8, submit: p3.ready ? on3.create : void 0 })
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-check", children: [
              /* @__PURE__ */ u3("input", { type: "checkbox", id: "npdraft", checked: p3.isDraft, onChange: on3.draft }),
              " Create as draft ",
              /* @__PURE__ */ u3("span", { children: "(not ready for review yet)" })
            ] }),
            "\n    ",
            p3.err ? /* @__PURE__ */ u3("div", { class: "act-err", children: p3.err }) : "",
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-btns", children: [
              /* @__PURE__ */ u3("button", { class: "btn", id: "npcancel", onClick: on3.cancel, children: "Cancel" }),
              /* @__PURE__ */ u3("button", { class: "btn primary", id: "npcreate", onClick: on3.create, disabled: !p3.ready, children: p3.isDraft ? "Create draft pull request" : "Create pull request" })
            ] })
          ] }),
          "\n  "
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-side-col", children: p3.meta ? /* @__PURE__ */ u3(NpMeta, { p: p3.meta, on: on3 }) : "" })
      ] })
    ] }, p3.seq);
  }
  function InboxPage({ p: { loading, err, secs }, on: on3 }) {
    const body = err ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: err }) : !secs ? /* @__PURE__ */ u3("div", { class: "skel", children: [
      /* @__PURE__ */ u3("div", { class: "sk sk-line" }),
      /* @__PURE__ */ u3("div", { class: "sk sk-line w80" }),
      /* @__PURE__ */ u3("div", { class: "sk sk-line w60" })
    ] }) : secs.map((s3) => /* @__PURE__ */ u3("section", { class: "ib-sec", children: [
      /* @__PURE__ */ u3("h2", { children: [
        s3.title,
        /* @__PURE__ */ u3("span", { children: s3.rows.length })
      ] }),
      /* @__PURE__ */ u3("p", { children: s3.sub }),
      s3.rows.length ? s3.rows.map((r3) => /* @__PURE__ */ u3("a", { class: "ib-row", "data-open": r3.ref, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
        /* @__PURE__ */ u3("img", { src: r3.avatar, alt: "" }),
        /* @__PURE__ */ u3("span", { class: "ib-t", children: [
          /* @__PURE__ */ u3("b", { children: r3.title }),
          /* @__PURE__ */ u3("i", { children: r3.sub })
        ] }),
        r3.fresh ? /* @__PURE__ */ u3("span", { class: "ib-new", children: "New activity" }) : "",
        r3.comments ? /* @__PURE__ */ u3("span", { class: "ib-c", children: [
          I2("comment"),
          SP,
          r3.comments
        ] }) : ""
      ] })) : /* @__PURE__ */ u3("div", { class: "ib-none", children: "Nothing here. Nice." })
    ] }));
    return /* @__PURE__ */ u3("div", { class: "notes-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: [
        /* @__PURE__ */ u3("h1", { children: [
          I2("checklist"),
          SP,
          "Inbox"
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-tools", children: /* @__PURE__ */ u3("button", { class: "btn small", id: "ibrefresh", onClick: on3.refresh, disabled: loading, children: loading ? "Loading\u2026" : "Refresh" }) })
      ] }),
      body
    ] });
  }
  var Skeleton = () => /* @__PURE__ */ u3("div", { class: "skel", "aria-busy": "true", children: [
    /* @__PURE__ */ u3("div", { class: "sk sk-crumb" }),
    /* @__PURE__ */ u3("div", { class: "sk sk-title" }),
    /* @__PURE__ */ u3("div", { class: "sk sk-pill" }),
    /* @__PURE__ */ u3("div", { class: "sk sk-line w60" }),
    /* @__PURE__ */ u3("div", { class: "sk-tabs", children: [
      /* @__PURE__ */ u3("i", { class: "sk" }),
      /* @__PURE__ */ u3("i", { class: "sk" }),
      /* @__PURE__ */ u3("i", { class: "sk" })
    ] }),
    [0, 1, 2].map((i3) => /* @__PURE__ */ u3("div", { class: "sk-row", style: `--i:${i3}`, children: [
      /* @__PURE__ */ u3("div", { class: "sk sk-av" }),
      /* @__PURE__ */ u3("div", { class: "sk-card", children: [
        /* @__PURE__ */ u3("div", { class: "sk sk-line w40" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line w80" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line w60" })
      ] })
    ] }))
  ] });
  function PrLayout({ header, body, side, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "pr-page", children: [
      header,
      /* @__PURE__ */ u3("div", { class: "pr-layout", children: [
        /* @__PURE__ */ u3("main", { class: "pr-main", children: body }),
        side.kind === "rail" ? /* @__PURE__ */ u3("button", { class: "pane-rail side-rail", "data-show": "side", onClick: on3.show, title: "Show details", children: [
          I2("columns"),
          /* @__PURE__ */ u3("span", { children: "Details" })
        ] }) : side.kind === "aside" ? /* @__PURE__ */ u3("aside", { class: "pr-side", children: [
          /* @__PURE__ */ u3("div", { class: "side-top", children: [
            /* @__PURE__ */ u3("span", { children: "Details" }),
            /* @__PURE__ */ u3("button", { class: "fold-btn", "data-hide": "side", onClick: side.on.hide, title: "Hide this panel", children: I2("x") })
          ] }),
          side.inner
        ] }) : ""
      ] })
    ] });
  }
  var SplitLayout = ({ header, split }) => /* @__PURE__ */ u3("div", { class: "pr-page is-split", children: [
    header,
    split
  ] });
  var Gate = ({ err, go: go3, tok }) => /* @__PURE__ */ u3("div", { class: "gate", children: /* @__PURE__ */ u3("div", { class: "gate-card", children: [
    /* @__PURE__ */ u3("img", { src: "logo.png", alt: "", width: 72, height: 72 }),
    /* @__PURE__ */ u3("h1", { children: "Sign in to Pullscope" }),
    "\n  ",
    /* @__PURE__ */ u3("p", { class: "gate-err", children: [
      I2("alert"),
      SP,
      "No GitHub sign-in or token was found."
    ] }),
    "\n  ",
    /* @__PURE__ */ u3("p", { children: "Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing." }),
    "\n  ",
    err ? /* @__PURE__ */ u3("p", { class: "gate-err", children: err }) : "",
    "\n  ",
    /* @__PURE__ */ u3("div", { class: "btns", style: "justify-content:center", children: [
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "gatego", onClick: go3, children: "Sign in with GitHub" }),
      /* @__PURE__ */ u3("button", { class: "btn", id: "gatetok", onClick: tok, children: "Use a token instead" })
    ] }),
    "\n  ",
    /* @__PURE__ */ u3("small", { children: [
      "Tip: running ",
      /* @__PURE__ */ u3("code", { children: "gh auth login" }),
      " in a terminal also works."
    ] })
  ] }) });

  // src/app/token.ts
  function tokenDialog() {
    S.oauth = {};
    S.oauthLive = false;
    S.tokenText = "";
    S.dlg = { k: "token" };
    render();
  }
  async function tokenSave() {
    const v3 = S.tokenText || "";
    try {
      await tauri?.invoke("set_token", { token: v3 });
      S.hasToken = !!v3.trim();
      S.authChecked = true;
      if (S.hasToken) {
        S.gateErr = "";
        loadRepos();
      } else {
        S.repos = null;
      }
    } catch (e3) {
      alert(e3);
    }
    S.oauthLive = false;
    S.dlg = null;
    render();
  }
  async function oauthGo() {
    const show = (o3) => {
      S.oauth = o3;
      if (S.dlg) paintDlg();
    };
    S.oauthLive = true;
    const me = S.oauthRun = (S.oauthRun || 0) + 1;
    try {
      const d3 = await tauri.invoke("device_start");
      show({ code: d3.user_code });
      tauri.invoke("open_external", { url: d3.verification_uri }).catch(() => {
      });
      let wait = (d3.interval || 5) * 1e3;
      const until = Date.now() + (d3.expires_in || 900) * 1e3;
      while (S.oauthLive && S.oauthRun === me && Date.now() < until) {
        await new Promise((r3) => setTimeout(r3, wait));
        if (!S.oauthLive || S.oauthRun !== me) return;
        const st = await tauri.invoke("device_poll", { deviceCode: d3.device_code });
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
    } catch (e3) {
      S.oauthLive = false;
      show({ err: String(e3) });
    }
  }

  // src/app/bindwrite.ts
  function homeProps() {
    const tab = S.homeTab || "repos", owner = S.homeOwner || "";
    let body;
    if (tab === "recent") {
      const q3 = (S.recentFilter || "").toLowerCase(), st = S.recentState || "all";
      const list = S.recent.filter((r3) => (st === "all" || r3.state === st) && (!q3 || (r3.title + " " + r3.ref).toLowerCase().includes(q3)));
      body = { kind: "recent", filter: S.recentFilter || "", state: st, hasAny: S.recent.length > 0, cards: list.map((r3) => ({ ref: r3.ref, state: r3.state, icon: r3.icon, title: r3.title })), emptyText: S.recent.length ? "No matching pull requests." : "Pull requests you open appear here." };
    } else if (!S.hasToken) body = { kind: "addtoken" };
    else if (S.reposErr) body = { kind: "error", text: String(S.reposErr) };
    else if (!S.repos) body = { kind: "spinner" };
    else {
      const f4 = (S.repoFilter || "").toLowerCase();
      const vis = S.hmVis || "all", srt = S.hmSort || "pushed", grp = S.hmGroup || "none";
      let list = S.repos.filter((r3) => (!owner || r3.full_name.startsWith(owner + "/")) && r3.full_name.toLowerCase().includes(f4) && (vis === "all" || vis === "private" === !!r3.private));
      const nm = (r3) => r3.full_name.split("/")[1], pushed = (r3) => Date.parse(r3.pushed_at || "0") || 0;
      const sorters = { name: (a3, b2) => nm(a3).localeCompare(nm(b2)), namez: (a3, b2) => nm(b2).localeCompare(nm(a3)), issues: (a3, b2) => (b2.open_issues_count || 0) - (a3.open_issues_count || 0) || nm(a3).localeCompare(nm(b2)), oldest: (a3, b2) => pushed(a3) - pushed(b2), owner: (a3, b2) => a3.full_name.localeCompare(b2.full_name), ownerz: (a3, b2) => b2.full_name.split("/")[0].localeCompare(a3.full_name.split("/")[0]) || nm(a3).localeCompare(nm(b2)) };
      const sorter = sorters[srt];
      if (sorter) list = [...list].sort(sorter);
      const card = (r3) => ({ full: r3.full_name, name: r3.full_name.split("/")[1], owner: r3.full_name.split("/")[0], priv: !!r3.private, archived: !!r3.archived, issues: r3.open_issues_count || 0, desc: r3.description || "" });
      let groups = null;
      if (grp === "owner") {
        const by = /* @__PURE__ */ new Map();
        list.forEach((r3) => {
          const o3 = r3.full_name.split("/")[0];
          if (!by.has(o3)) by.set(o3, []);
          by.get(o3).push(r3);
        });
        groups = [...by].map(([o3, rs]) => ({ owner: o3, cards: rs.map(card) }));
      }
      body = { kind: "repos", filter: S.repoFilter || "", vis, sort: srt, group: grp, groups: list.length ? groups : null, cards: list.map(card), none: !list.length };
    }
    return { owner, tab, repoCount: S.repos ? S.repos.filter((r3) => !owner || r3.full_name.startsWith(owner + "/")).length : null, recentCount: S.recent.length, banners: pushBannerItems(), err: S.error ? String(S.error) : "", body };
  }

  // src/app/home.tsx
  var crumbs = {
    home: () => {
      S.view = "home";
      S.homeOwner = "";
      S.nav = false;
      render();
    },
    owner: (o3) => {
      S.view = "home";
      S.homeOwner = o3;
      S.homeTab = "repos";
      S.nav = false;
      render();
      if (S.hasToken && !S.repos) loadRepos();
    },
    repo: (r3) => openRepo(r3)
  };
  var on = {
    tab: (t3) => {
      S.homeTab = t3;
      render();
    },
    vis: (v3) => {
      S.hmVis = v3;
      render();
    },
    sort: (e3) => {
      S.hmSort = e3.target.value;
      render();
    },
    group: (e3) => {
      S.hmGroup = e3.target.value;
      render();
    },
    repoFilter: (e3) => {
      S.repoFilter = e3.target.value;
      render();
    },
    recentFilter: (e3) => {
      S.recentFilter = e3.target.value;
      render();
    },
    rstate: (s3) => {
      S.recentState = s3;
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
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: "", trail: S.homeOwner ? [{ t: S.homeOwner }] : [], on: crumbs }),
      /* @__PURE__ */ u3(Home, { p: homeProps(), on })
    ] });
  }

  // src/app/pr.tsx
  var hide = (k3, v3) => keep(() => {
    S.hide[k3] = v3;
    localStorage.setItem("hide", JSON.stringify(S.hide));
  });
  var toggleSplit = () => {
    if (S.view === "pr" && S.bundle && S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline") head.split();
  };
  var head = {
    tab: openTab,
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
    fold: (k3, def) => {
      S.fold[k3] = !isFolded(k3, def);
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
    const p3 = S.bundle.pull, r3 = p3.base.repo;
    const extra = /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("a", { class: "crumb gh", href: r3.html_url, "data-ext": "", title: "Open on GitHub", children: I2("link-external", 12) }),
      S.refreshing ? /* @__PURE__ */ u3("span", { class: "stale", children: "Refreshing\u2026" }) : ""
    ] });
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: r3.full_name, trail: [{ t: "Pull requests", repo: r3.full_name }, { t: `#${p3.number}` }], extraNode: extra, on: crumbs }),
      /* @__PURE__ */ u3(PrHeader, { ...prHeaderProps(S.bundle), on: head })
    ] });
  }
  function PrView() {
    const b2 = S.bundle;
    if (S.split && S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline") return /* @__PURE__ */ u3(SplitLayout, { header: /* @__PURE__ */ u3(Header, {}), split: splitView(b2) });
    const body = S.tab === "files" ? filesView(b2) : S.tab === "commits" ? commitsView(b2) : S.tab === "checks" ? checksView(b2) : null;
    const side = S.tab !== "conversation" ? { kind: "none" } : S.hide.side ? { kind: "rail" } : { kind: "aside", inner: /* @__PURE__ */ u3(PrSide, { ...sidebarProps(b2), on: sideOn }), on: { hide: () => hide("side", true) } };
    return /* @__PURE__ */ u3(PrLayout, { header: /* @__PURE__ */ u3(Header, {}), body: S.tab === "timeline" ? /* @__PURE__ */ u3("div", { class: "rail", children: /* @__PURE__ */ u3(Timeline, { m: timelineModel(b2), on: tlOn }) }) : S.tab === "conversation" ? /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Attention, { ...attentionProps(b2), on: attOn }),
      /* @__PURE__ */ u3(Timeline, { m: timelineModel(b2), on: tlOn })
    ] }) : body, side, on: { show: () => hide("side", false) } });
  }

  // src/app/palette.tsx
  var rowsFor = (raw) => {
    const q3 = raw.trim().toLowerCase();
    const rows = S.recent.filter((r3) => !q3 || `${r3.ref} ${r3.title}`.toLowerCase().includes(q3)).slice(0, 8).map((r3) => ({ ref: r3.ref, label: r3.title, sub: r3.ref }));
    if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q3)) rows.unshift({ ref: raw.trim(), label: `Open ${raw.trim()}`, sub: "Go to this pull request" });
    return rows;
  };
  function closePal() {
    S.pal = null;
    paintPal();
  }
  function go(r3) {
    closePal();
    if (r3) {
      S.nav = false;
      S.focus = "";
      openPr(r3.ref);
    }
  }
  function paintPal() {
    const p3 = S.pal;
    if (!p3) {
      setSlot("pal", null);
      return;
    }
    if (p3.k === "help") {
      setSlot("pal", /* @__PURE__ */ u3(HelpDialog, { close: closePal }));
      return;
    }
    const rows = rowsFor(p3.q), sel = Math.min(p3.sel, Math.max(0, rows.length - 1));
    const onKey = (e3) => {
      if (e3.key === "Escape") closePal();
      else if (e3.key === "ArrowDown") {
        p3.sel = Math.min(rows.length - 1, sel + 1);
        paintPal();
        e3.preventDefault();
      } else if (e3.key === "ArrowUp") {
        p3.sel = Math.max(0, sel - 1);
        paintPal();
        e3.preventDefault();
      } else if (e3.key === "Enter") go(rows[sel]);
    };
    setSlot("pal", /* @__PURE__ */ u3(Palette, { q: p3.q, rows, sel, onQ: (v3) => {
      p3.q = v3;
      p3.sel = 0;
      paintPal();
    }, onKey, pick: (i3) => go(rows[i3]), close: closePal }));
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
  var helpKey = (e3) => {
    if (e3.key === "Escape" && S.pal?.k === "help") closePal();
  };

  // src/app/keyboard.ts
  var typing = (t3) => t3 && (t3.closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || t3.isContentEditable);
  var kbItems = () => [...qa(".main .tl-comment, .main .tc")].filter((e3) => e3.offsetParent);
  function kbGo(el) {
    if (!el) return;
    S.kbId = el.id;
    rerender();
  }
  var kbCur = () => S.kbId && document.getElementById(S.kbId) || null;
  function kbStep(dir, pick = kbItems) {
    const items = pick(), cur = kbCur();
    if (!items.length) return;
    let i3 = cur ? items.indexOf(cur) : -1;
    if (i3 === -1 && cur) i3 = items.findIndex((e3) => cur.compareDocumentPosition(e3) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
    kbGo(items[Math.min(items.length - 1, Math.max(0, i3 + dir))]);
  }
  var openThreads = () => [...qa(".main .thread")].filter((t3) => !$(".thread-head .res", t3) && t3.offsetParent).map((t3) => $(".tc", t3)).filter(Boolean);
  function setComposer(open2, focus) {
    if (!S.composerBox) return false;
    S.cOpen = open2;
    rerender();
    if (open2 && focus) focusDraft("comment");
    return true;
  }
  var menuAway = (e3) => {
    if (S.tabMenu && !e3.target.closest(".pt-menu, #tabadd")) {
      S.tabMenu = false;
      rerender();
    }
  };
  function shortcut(e3) {
    if (S.tabMenu && e3.key === "Escape") {
      S.tabMenu = false;
      rerender();
      return;
    }
    if ((e3.metaKey || e3.ctrlKey) && !e3.altKey) {
      const k3 = e3.key.toLowerCase();
      if (k3 === "t" && !e3.shiftKey) {
        e3.preventDefault();
        S.tabMenu = !S.tabMenu;
        if (!S.tabs.length) S.tabMenu = true;
        rerender();
        return;
      }
      if (k3 === "t" && e3.shiftKey) {
        e3.preventDefault();
        reopenTab();
        return;
      }
      if (k3 === "w" && S.tabs.length && tabIdx() >= 0) {
        e3.preventDefault();
        closeTab(tabIdx());
        return;
      }
      if (/^[1-9]$/.test(k3) && S.tabs[+k3 - 1]) {
        e3.preventDefault();
        openTab2(S.tabs[+k3 - 1].ref);
        return;
      }
      if (e3.key === "Tab" && e3.ctrlKey) {
        e3.preventDefault();
        stepTab(e3.shiftKey ? -1 : 1);
        return;
      }
    }
    if (e3.key === "Escape" && !e3.defaultPrevented && e3.target.closest?.("#composer") && !$(".tt-slash")) {
      e3.preventDefault();
      e3.target.blur?.();
      setComposer(false);
      return;
    }
    if ((e3.metaKey || e3.ctrlKey) && e3.key.toLowerCase() === "k") {
      e3.preventDefault();
      openPalette();
      return;
    }
    if (e3.metaKey || e3.ctrlKey || e3.altKey || typing(e3.target) || $(".palette, .dlg-bg")) return;
    if (e3.key === "j") kbStep(1);
    else if (e3.key === "k") kbStep(-1);
    else if (e3.key === "]") kbStep(1, openThreads);
    else if (e3.key === "[") kbStep(-1, openThreads);
    else if (e3.key === "?") showHelp();
    else if (e3.key === "n") {
      e3.preventDefault();
      openNewPr();
    } else if (e3.key === "c" && S.view === "pr" && S.composerBox) {
      e3.preventDefault();
      setComposer(true, true);
    } else if (e3.key === "f" && $(".split")) flipSides();
    else if (e3.key === "s" && S.bundle) toggleSplit();
    else if (e3.key === "d" && S.bundle) setDiffMode(S.diffMode === "split" ? "unified" : "split");
    else if (e3.key === "r") {
      const cur = kbCur(), host = cur?.closest(".thread")?.querySelector(".reply .tt");
      if (!host) {
        if (S.composerBox) {
          e3.preventDefault();
          setComposer(true, true);
        }
        return;
      }
      e3.preventDefault();
      const key = host.dataset.draft;
      scrollDraft(key);
      focusDraft(key);
    }
  }

  // src/app/scrolling.tsx
  var scrollRaf = 0;
  var lastTop = 0;
  var atEnd = false;
  var toTop = (smooth = true) => {
    if (S.scrollId && S.scrollId !== "main") scrollTarget(S.scrollId, 0, smooth);
    else scrollMain(0, smooth);
  };
  var paintToTop = () => setSlot("totop", /* @__PURE__ */ u3(ToTop, { hidden: !S.toTop, onClick: () => toTop() }));
  function scrolled(id, el) {
    S.scrollId = id;
    if (id === "main") {
      S.mainTop = el.scrollTop;
      if (S.view === "pr" && !S.restoring && !scrollRaf) scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const t3 = S.tabs[tabIdx()];
        if (t3) {
          t3.scroll = el.scrollTop;
          t3.tab = S.tab;
        }
      });
    }
    if (!!S.toTop !== el.scrollTop >= 600) {
      S.toTop = !S.toTop;
      paintToTop();
    }
    const c3 = S.composerBox;
    if (!c3 || c3.in !== id) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight, up = el.scrollTop < lastTop;
    lastTop = el.scrollTop;
    if (dist < 24 && !atEnd) {
      atEnd = true;
      if (!composerOpen()) setComposer(true, false);
    }
    if (dist > c3.h + 60) {
      atEnd = false;
      if (up && composerOpen() && !(S.draft.comment || "").trim()) {
        blurDraft("comment");
        setComposer(false);
      }
    }
  }
  var homeKey = (e3) => {
    if (e3.key === "Home" && !e3.target.closest?.("input, textarea, select, [contenteditable]") && S.scrollId) {
      e3.preventDefault();
      toTop();
    }
  };

  // src/app/mergebox.tsx
  function mergeModel(b2) {
    const p3 = b2.pull;
    const head2 = p3.head.label.split(":")[1];
    if (p3.merged) return { kind: "merged", head: head2 };
    if (p3.state === "closed") return { kind: "closed", head: head2 };
    const clean = p3.mergeable_state === "clean" || p3.mergeable !== false;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e3) => e3.event === "reviewed" && e3.user).forEach((e3) => {
      const st = e3.state.toLowerCase();
      if (st === "commented" && latest.has(e3.user.login)) return;
      latest.set(e3.user.login, st);
    });
    const ap = [...latest.values()].filter((x2) => x2 === "approved").length, cr = [...latest.values()].filter((x2) => x2 === "changes_requested").length, pendRev = (p3.requested_reviewers || []).length;
    const rvHead = cr ? ["bad", "x-circle-fill", "Changes requested", `${cr} reviewer${cr === 1 ? "" : "s"} requested changes`] : ap ? ["ok", "check-circle-fill", "Changes approved", `${ap} approving review${ap === 1 ? "" : "s"}`] : ["", "eye", "Review not yet submitted", pendRev ? `${pendRev} pending review${pendRev === 1 ? "" : "s"}` : "No reviews yet"];
    const list = (b2.checks || []).map((c3) => ({ ...c3, st: checkState(c3) })), cnt = (k3) => list.filter((c3) => c3.st === k3).length;
    const ckHead = cnt("fail") ? ["bad", "x-circle-fill", `${cnt("fail")} check${cnt("fail") === 1 ? "" : "s"} failing`] : cnt("pending") ? ["", "dot-fill", `${cnt("pending")} check${cnt("pending") === 1 ? "" : "s"} in progress`] : ["ok", "check-circle-fill", "All checks have passed"];
    const ckSub = [cnt("skip") && `${cnt("skip")} neutral`, cnt("pass") && `${cnt("pass")} successful`, cnt("fail") && `${cnt("fail")} failing`, cnt("pending") && `${cnt("pending")} pending`].filter(Boolean).join(", ");
    const grp = (k3, title) => {
      const g2 = list.filter((c3) => c3.st === k3);
      if (!g2.length) return [];
      const open2 = S.mbOpen?.has("g" + k3) ?? k3 !== "pass";
      return [{ k: k3, title, open: open2, items: g2.map((c3) => ({ st: c3.st, url: c3.url, icon: CK[c3.st][0], name: c3.name, req: (S.bundle?.required_checks || []).includes(c3.name), desc: c3.description || c3.app || "" })) }];
    };
    return { kind: "open", p: {
      draft: !!p3.draft,
      busyReady: S.busy === "ready",
      errReady: errMsg("ready"),
      rv: { h: rvHead, open: !!S.mbOpen?.has("rv"), ap, cr, pend: pendRev, pendNames: (p3.requested_reviewers || []).map((u4) => u4.login).join(", ") },
      ck: list.length ? { h: ckHead.concat(ckSub), open: !!S.mbOpen?.has("ck"), rerunable: list.some((c3) => c3.st === "fail" && /\/actions\/runs\//.test(c3.url || "")), groups: [...grp("fail", "Failing checks"), ...grp("pending", "In progress"), ...grp("skip", "Neutral checks"), ...grp("pass", "Successful checks")] } : null,
      behind: p3.mergeable_state === "behind",
      busyUpdate: S.busy === "update_branch",
      baseRef: p3.base.ref,
      errUpdate: errMsg("update_branch"),
      clean
    } };
  }
  function sidebarProps(b2) {
    const p3 = b2.pull;
    const reviewers = /* @__PURE__ */ new Map();
    p3.requested_reviewers.forEach((u4) => reviewers.set(u4.login, { u: u4, st: "req" }));
    b2.timeline.filter((e3) => e3.event === "reviewed").forEach((e3) => {
      const st = e3.state.toLowerCase();
      const cur = reviewers.get(e3.user.login);
      if (cur?.st === "req") {
        if (!cur.prev || st === "approved" || st === "changes_requested") cur.prev = st;
      } else if (!cur || st === "approved" || st === "changes_requested") reviewers.set(e3.user.login, { u: e3.user, st });
    });
    const canRe = !p3.merged && p3.state === "open";
    const rv = [...reviewers.values()].map((r3) => ({ ...r3, canRe: canRe && r3.st !== "req" && r3.u.login !== p3.user.login }));
    const people = /* @__PURE__ */ new Map();
    [p3.user, ...b2.timeline.map((e3) => e3.user || e3.actor || e3.author)].forEach((u4) => u4 && u4.login && !people.has(u4.login) && people.set(u4.login, u4));
    return {
      reviewers: rv,
      showAll: !!S.showAllReviewers,
      assignees: p3.assignees,
      labels: p3.labels,
      milestone: p3.milestone ?? null,
      people: [...people.values()].slice(0, 30),
      peopleCount: people.size,
      folded: { reviewers: isFolded("sb:Reviewers"), assignees: isFolded("sb:Assignees"), labels: isFolded("sb:Labels"), milestone: isFolded("sb:Milestone"), people: isFolded("sb:people") }
    };
  }
  var frKey = (cs, r3) => r3.a === r3.b ? cs[r3.a].sha : `${cs[r3.a].parent}..${cs[r3.b].sha}`;
  function frDiff(b2) {
    const cs = commitList(b2), r3 = S.fr;
    if (!r3 || !cs[r3.a] || !cs[r3.b]) return b2.files;
    return r3.a === r3.b ? S.cdiff[cs[r3.a].sha] : S.rdiff[frKey(cs, r3)];
  }
  async function loadFr() {
    const b2 = S.bundle, r3 = S.fr;
    if (!b2 || !r3) return;
    const cs = commitList(b2), single = r3.a === r3.b, k3 = frKey(cs, r3), store = single ? S.cdiff : S.rdiff, repo = b2.pull.base.repo.full_name;
    if (store[k3] !== void 0 && store[k3] !== "loading") return;
    store[k3] = "loading";
    render();
    try {
      if (!tauri) throw new Error("Per-commit diffs are available in the desktop app.");
      if (!single && !cs[r3.a].parent) throw new Error("This range has no parent commit to compare against.");
      store[k3] = (single ? await tauri.invoke("fetch_commit", { repo, sha: k3 }) : await tauri.invoke("fetch_range", { repo, base: cs[r3.a].parent, head: cs[r3.b].sha })).files || [];
    } catch (e3) {
      store[k3] = String(e3).replace(/^Error: /, "");
    }
    render();
  }
  function setFr(r3) {
    S.fr = r3;
    S.dlg = null;
    render();
    loadFr();
  }
  function sinceReview(b2) {
    const cs = commitList(b2), mine = b2.timeline.filter((e3) => e3.event === "reviewed" && e3.user?.login === S.me && e3.commit_id);
    if (!S.me || !mine.length) return null;
    const at = cs.findIndex((c3) => c3.sha === mine[mine.length - 1].commit_id);
    return at < 0 ? null : { at, n: cs.length - 1 - at };
  }
  function commitsDialogProps() {
    const b2 = S.bundle, cs = commitList(b2), pick = S.cpick || S.fr, sr = sinceReview(b2), q3 = (S.cfilter || "").toLowerCase();
    const on3 = (i3) => !!pick && i3 >= pick.a && i3 <= pick.b;
    return {
      rows: cs.map((c3, i3) => {
        const title = String(c3.message).split("\n")[0], by = c3.name || c3.author?.login || "", w3 = when(c3.date).replace(/<\/?span[^>]*>/g, ""), sha = c3.sha.slice(0, 7);
        return { i: i3, on: on3(i3), title, by, when: w3, sha, hidden: !!q3 && !(title + by + " committed " + w3 + sha).toLowerCase().includes(q3) };
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
    const cs = commitList(b2), r3 = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = !!r3 && r3.a === r3.b;
    const sh = (i3) => cs[i3].sha.slice(0, 7);
    const bar = /* @__PURE__ */ u3(FcBar, { label: !r3 ? "All commits" : single ? "Commit" : `${r3.b - r3.a + 1} commits`, count: !r3 ? cs.length : null, code: !r3 ? null : single ? sh(r3.a) : `${sh(r3.a)}\u2026${sh(r3.b)}`, nav: single ? { prevOff: r3.a <= 0, nextOff: r3.a >= cs.length - 1 } : null, title: r3 && single ? String(cs[r3.a].message).split("\n")[0] : "", hasRange: !!r3, on: filesOn });
    if (!r3) return /* @__PURE__ */ u3(S2, { children: [
      bar,
      filesList(b2.files, true)
    ] });
    const d3 = frDiff(b2);
    return /* @__PURE__ */ u3(S2, { children: [
      bar,
      d3 === void 0 || d3 === "loading" ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Loading\u2026" }) : typeof d3 === "string" ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: d3 }) : filesList(d3)
    ] });
  }
  var b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === "open";
  function filesList(files, canComment = false) {
    if (!files.length) return /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No files changed." });
    const pid = S.bundle?.pull?.id;
    const hasC = (f4) => (S.bundle?.review_comments || []).some((c3) => c3.path === f4.filename) || pendList().some((p3) => p3.path === f4.filename);
    if (S.autoFoldFor !== pid) {
      S.autoFoldFor = pid;
      let budget = 1200;
      for (const f4 of files) {
        const n2 = f4.additions + f4.deletions, key = "f:" + f4.filename;
        if (key in S.fold || hasC(f4)) continue;
        if (n2 > 400 || n2 > budget) S.fold[key] = true;
        else budget -= n2;
      }
    }
    const shown2 = (f4) => !S.fold["f:" + f4.filename];
    const srt = S.fileSort || "path", cnt = (f4) => (S.bundle?.review_comments || []).filter((c3) => c3.path === f4.filename && !c3.in_reply_to_id).length;
    const so = { path: null, pathz: (x2, y3) => y3.filename.localeCompare(x2.filename), most: (x2, y3) => y3.additions + y3.deletions - (x2.additions + x2.deletions), least: (x2, y3) => x2.additions + x2.deletions - (y3.additions + y3.deletions), comments: (x2, y3) => cnt(y3) - cnt(x2), status: (x2, y3) => String(x2.status).localeCompare(String(y3.status)) || x2.filename.localeCompare(y3.filename) };
    const srtFn = so[srt];
    if (srtFn) files = [...files].sort(srtFn);
    const all = files.every((f4) => S.fold["f:" + f4.filename]);
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(FilesBar, { mode: S.diffMode ?? "", sort: srt, pending: pendList().length, allFolded: all, names: files.map((f4) => f4.filename), on: filesOn }),
      files.map((f4) => {
        const t3 = f4.additions + f4.deletions || 1, a3 = Math.round(f4.additions / t3 * 5), d3 = Math.min(5 - a3, Math.round(f4.deletions / t3 * 5));
        const sq = Array.from({ length: 5 }, (_3, i3) => i3 < a3 ? "a" : i3 < a3 + d3 ? "d" : "");
        return /* @__PURE__ */ u3(FileBox, { name: f4.filename, folded: isFolded("f:" + f4.filename), closed: !!S.fold["f:" + f4.filename], add: f4.additions, del: f4.deletions, sq, on: filesOn, children: !shown2(f4) ? "" : f4.patch ? diffTable(f4.patch, f4.filename, canComment && b0open(), diffOn) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Binary file or diff too large to display." }) });
      })
    ] });
  }
  function commitsView(b2) {
    const c3 = b2.timeline.filter((e3) => e3.event === "committed");
    return /* @__PURE__ */ u3(CommitsList, { rows: c3.map((e3) => /* @__PURE__ */ u3(CommitRow, { first: String(e3.message || "").split("\n")[0], sha: e3.sha, author: e3.author?.avatar_url ? e3.author : null, url: e3.html_url, verification: e3.verification })) });
  }
  function commitList(b2) {
    if (b2.commits && b2.commits.length) return b2.commits.map((c3) => ({ sha: c3.sha, message: c3.commit.message, author: c3.author, name: c3.commit.author?.name, date: c3.commit.author?.date, url: c3.html_url, parent: c3.parents?.[0]?.sha }));
    return b2.timeline.filter((e3) => e3.event === "committed").map((e3) => ({ sha: e3.sha, message: e3.message, author: e3.author?.avatar_url ? e3.author : null, name: e3.author?.name, date: e3.author?.date, url: e3.html_url }));
  }
  S.flip = localStorage.getItem("flip") === "1";
  function flipSides() {
    S.flip = !S.flip;
    localStorage.setItem("flip", S.flip ? "1" : "0");
    rerender();
  }
  var hideSide = (k3, v3) => {
    S.hide[k3] = v3;
    localStorage.setItem("hide", JSON.stringify(S.hide));
    rerender();
  };
  function gutterDrag(e3) {
    e3.preventDefault();
    const r3 = $(".split").getBoundingClientRect();
    const mv = (ev) => {
      S.lw = Math.max(25, Math.min(75, (S.flip ? r3.right - ev.clientX : ev.clientX - r3.left) / r3.width * 100));
      repaintShell({ lw: S.lw });
    };
    const up = () => {
      setDragging(false);
      localStorage.setItem("lw", String(Math.round(S.lw)));
    };
    setDragging(true);
    beginDrag({ move: mv, end: up });
  }
  var splitOn = { hide: hideSide, flip: flipSides, pick: (sha) => {
    selectCommit(sha);
  }, gutter: gutterDrag, fold: (e3, k3, def) => convOn.fold(e3, k3, def), scroll: (id, e3) => scrolled(id, e3.currentTarget) };
  function splitView(b2) {
    const cs = commitList(b2), sha = S.sel;
    const cnt = (c3) => b2.review_comments.filter((r3) => r3.original_commit_id === c3 || r3.commit_id === c3).length;
    let diff;
    if (!sha) diff = filesList(b2.files, true);
    else {
      const d3 = S.cdiff[sha];
      diff = d3 === void 0 || d3 === "loading" ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Loading commit\u2026" }) : typeof d3 === "string" ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: d3 }) : filesList(d3);
    }
    return /* @__PURE__ */ u3(
      SplitView,
      {
        hl: !!S.hide.l,
        hr: !!S.hide.r,
        flip: !!S.flip,
        lw: S.lw,
        allOn: !sha,
        allSub: `${b2.pull.changed_files} files \xB7 +${b2.pull.additions} \u2212${b2.pull.deletions}`,
        rows: cs.map((c3) => ({ sha: c3.sha, on: sha === c3.sha, author: c3.author, initial: (c3.name || "?")[0], title: String(c3.message).split("\n")[0], sub: `${c3.name || c3.author?.login || ""} \xB7 ${when(c3.date).replace(/<\/?span[^>]*>/g, "")}`, n: cnt(c3.sha) })),
        count: cs.length,
        subTitle: sha ? "Commit " + sha.slice(0, 7) : "All changes",
        foldList: isFolded("cm-list"),
        foldDiff: isFolded("cm-diff"),
        diff,
        right: /* @__PURE__ */ u3(S2, { children: [
          /* @__PURE__ */ u3(Attention, { ...attentionProps(b2), on: attOn }),
          /* @__PURE__ */ u3(Timeline, { m: timelineModel(b2), on: tlOn })
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
    } catch (e3) {
      S.cdiff[sha] = String(e3).replace(/^Error: /, "");
    }
    if (S.sel === sha) render();
  }

  // src/app/dialogs.tsx
  var paintDlg = () => setSlot("dlg", /* @__PURE__ */ u3(Dialogs, {}));
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
    filter: (e3) => {
      S.cfilter = e3.target.value;
      paintDlg();
    },
    pick: (e3, i3) => {
      e3.preventDefault();
      const p3 = S.cpick;
      S.cpick = !p3 || p3.a !== p3.b ? { a: i3, b: i3 } : { a: Math.min(p3.a, i3), b: Math.max(p3.b, i3) };
      paintDlg();
    }
  };
  function Dialogs() {
    const d3 = S.dlg;
    if (!d3) return null;
    const close = () => closeDlg(), ok = () => {
      d3.k !== "commits" && d3.k !== "token" && d3.ok();
    };
    switch (d3.k) {
      case "commits":
        return /* @__PURE__ */ u3(CommitsDialog, { ...commitsDialogProps(), on: cpOn });
      case "token":
        return /* @__PURE__ */ u3(TokenDialog, { text: S.tokenText || "", input: (e3) => {
          S.tokenText = e3.currentTarget.value;
        }, code: S.oauth?.code || "", err: S.oauth?.err || "", go: oauthGo, close, save: tokenSave });
      case "review": {
        const n2 = pendList().length;
        return /* @__PURE__ */ u3(ReviewDialog, { ph: n2 ? `Leave a review comment (${n2} line comment${n2 === 1 ? "" : "s"} will be included)` : "Leave a review comment (required unless approving)", ev: d3.ev, onEv: (v3) => {
          d3.ev = v3;
          paintDlg();
        }, err: errMsg("review"), close, ok });
      }
      case "editpr":
        return /* @__PURE__ */ u3(EditPrDialog, { title: d3.title, onTitle: (v3) => {
          d3.title = v3;
        }, err: errMsg("editpr"), close, ok });
      case "confirm":
        return /* @__PURE__ */ u3(ConfirmDialog, { title: d3.title, text: d3.text, label: d3.label, danger: d3.danger, close, ok });
      case "editc":
        return /* @__PURE__ */ u3(EditCommentDialog, { err: errMsg("editc"), close, ok });
      case "delc":
        return /* @__PURE__ */ u3(DeleteCommentDialog, { err: errMsg("delc"), close, ok });
      case "hidec":
        return /* @__PURE__ */ u3(HideCommentDialog, { reasons: d3.reasons, reason: S.hideReason || "OUTDATED", pick: (e3) => {
          S.hideReason = e3.currentTarget.value;
          paintDlg();
        }, err: errMsg("hidec"), close, ok });
    }
  }
  function Pops() {
    const p3 = S.pop;
    if (!p3) return null;
    if (p3.k === "cm") return /* @__PURE__ */ u3(CmPop, { ...p3 });
    if (p3.k === "ctx") return /* @__PURE__ */ u3(CtxPop, { ...p3 });
    if (p3.k === "prof") return /* @__PURE__ */ u3(ProfPop, { ...p3 });
    return /* @__PURE__ */ u3(ReactPop, { x: p3.x, y: p3.y, reacts: REACTS, pick: p3.pick });
  }
  var paintPop = () => setSlot("pop", /* @__PURE__ */ u3(Pops, {}));
  function openPop(p3) {
    S.pop = p3;
    paintPop();
  }
  function closePop() {
    if (!S.pop) return;
    S.pop = null;
    paintPop();
  }

  // src/app/bind.ts
  S.alive = /* @__PURE__ */ new Map();
  var aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join("|");
  function stashCurrent() {
    S.openSeq = (S.openSeq || 0) + 1;
    const ref = S.view === "pr" && S.bundle ? curRef() : "", m3 = $(".main"), sh = shownPage();
    if (!ref || !m3 || !sh || sh.ref !== ref || !S.tabs.some((t3) => t3.ref === ref)) return;
    S.alive.set(ref, { vnode: sh.vnode, bundle: S.bundle, tab: S.tab, key: aliveKey(), scroll: S.mainTop || 0 });
    while (S.alive.size > 6) {
      const old = S.alive.keys().next().value;
      S.alive.delete(old);
    }
  }
  function fastTab(ref) {
    S.openSeq = (S.openSeq || 0) + 1;
    const a3 = S.alive.get(ref);
    if (!a3) return false;
    const mem = qc.peek(ref);
    if (!mem || mem.data !== a3.bundle || a3.key !== aliveKey()) {
      S.alive.delete(ref);
      return false;
    }
    tabSnap();
    stashCurrent();
    S.alive.delete(ref);
    const p3 = a3.bundle.pull;
    S.view = "pr";
    S.bundle = a3.bundle;
    S.tab = a3.tab;
    S.sel = null;
    S.fr = null;
    S.error = "";
    S.loading = false;
    S.refreshing = false;
    S.tabPending = "";
    S.tabMenu = false;
    localStorage.setItem("last", ref);
    const ti = S.tabs.find((t3) => t3.ref === ref);
    if (ti) {
      ti.dot = false;
      saveTabs();
    }
    if (S.repo !== p3.base.repo.full_name) {
      S.repo = p3.base.repo.full_name;
      S.sideTab = "prs";
      setTimeout(loadPrs, 0);
    }
    if (S.draftRef !== ref) {
      saveDrafts();
      S.draftRef = ref;
      S.draft = { ...drafts[ref] || {} };
    }
    S.stash = a3;
    render();
    scrollMain(a3.scroll);
    if (!qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref)).then((d3) => {
      if (JSON.stringify(d3) === JSON.stringify(a3.bundle)) {
        qc.m.set(ref, { data: a3.bundle, at: Date.now() });
        return;
      }
      if (curRef() === ref) openPr(ref, { keepTab: true, nav: true });
    }).catch(() => {
    });
    return true;
  }
  function openClick(el, e3) {
    if (e3.target.closest("[data-rm], .np-act, .np-dot")) return;
    S.nav = false;
    S.focus = el.dataset.target || "";
    const nn = el.dataset.note && S.notes.find((x2) => String(x2.id) === el.dataset.note);
    if (nn) {
      nn.read = true;
      saveNotes();
    }
    if (e3.metaKey || e3.ctrlKey) {
      e3.preventDefault();
      openFromList(el.dataset.open, true);
    } else openFromList(el.dataset.open, false);
  }
  function openAux(el, e3) {
    if (e3.button === 1) {
      e3.preventDefault();
      openFromList(el.dataset.open, true);
    }
  }
  function openCtx(el, e3) {
    e3.preventDefault();
    e3.stopPropagation();
    const ref = el.dataset.open;
    openPop({ k: "ctx", x: Math.min(e3.clientX, innerWidth - 180), y: Math.min(e3.clientY, innerHeight - 120), pick: (h3) => {
      closePop();
      if (h3 === "new") openFromList(ref, true);
      else if (h3 === "here") openFromList(ref, false);
      else {
        const m3 = ref.match(/^(.+)#(\d+)$/);
        navigator.clipboard?.writeText(m3 ? `https://github.com/${m3[1]}/pull/${m3[2]}` : ref).catch(() => {
        });
      }
    } });
  }
  function rmRecent(e3, ref) {
    e3.stopPropagation();
    S.recent = S.recent.filter((r3) => r3.ref !== ref);
    localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  }
  function foldAllConv(keys) {
    if (!keys.length) return;
    const now = keys.some((x2) => !isFolded(x2.k, x2.def));
    keys.forEach((x2) => {
      S.fold[x2.k] = now;
    });
    try {
      localStorage.setItem("fold", JSON.stringify(S.fold));
    } catch {
    }
    rerender();
  }

  // src/app/tabs.ts
  var KEY_TABS = "tabs";
  {
    const t3 = load(KEY_TABS, {});
    S.tabs = Array.isArray(t3.list) ? t3.list : [];
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
  var tabIdx = () => S.tabs.findIndex((t3) => t3.ref === curRef());
  function tabSnap() {
    const t3 = S.tabs[tabIdx()];
    if (t3) {
      t3.tab = S.tab;
      t3.scroll = S.mainTop || 0;
    }
  }
  function tabPut(ref, p3, opts = {}) {
    const [state, ic] = stateOf(p3), item = { ref, title: p3.title, state, icon: ic, tab: S.tab, dot: false };
    const have = S.tabs.findIndex((t3) => t3.ref === ref);
    if (have >= 0) Object.assign(S.tabs[have], item, { tab: S.tabs[have].tab });
    else if (opts.at !== void 0 && opts.at >= 0 && !opts.newTab) S.tabs[opts.at] = item;
    else S.tabs.splice(opts.at !== void 0 && opts.at >= 0 ? opts.at + 1 : S.tabs.length, 0, item);
    S.tabs = S.tabs.slice(-15);
    saveTabs();
  }
  function openTab2(ref, { newTab = false } = {}) {
    if (!newTab && ref !== curRef() && fastTab(ref)) return;
    stashCurrent();
    tabSnap();
    S.fadeMain = true;
    S.tabMenu = false;
    return openPr(ref, { newTab, restore: newTab ? "" : S.tabs.find((t3) => t3.ref === ref)?.tab });
  }
  function closeTab(i3) {
    const t3 = S.tabs[i3];
    if (!t3) return;
    S.alive.delete(t3.ref);
    const was = t3.ref === curRef();
    S.closed = [{ ref: t3.ref, tab: t3.tab }, ...S.closed.filter((c3) => c3.ref !== t3.ref)].slice(0, 10);
    S.tabs.splice(i3, 1);
    saveTabs();
    if (!was) return render();
    const n2 = S.tabs[Math.min(i3, S.tabs.length - 1)];
    S.fadeMain = true;
    if (n2) openPr(n2.ref, { restore: n2.tab, nav: true });
    else {
      S.view = "home";
      S.bundle = null;
      render();
    }
  }
  function reopenTab() {
    const c3 = S.closed.shift();
    if (c3) {
      tabSnap();
      openPr(c3.ref, { newTab: true, restore: c3.tab });
    }
  }
  function stepTab(d3) {
    if (S.tabs.length < 2) return;
    const i3 = tabIdx(), n2 = S.tabs[(i3 + d3 + S.tabs.length) % S.tabs.length];
    openTab2(n2.ref);
  }

  // src/app/data.ts
  var snap = (p3) => ({ commits: p3.commits, comments: p3.comments, rc: p3.review_comments, state: p3.merged ? "merged" : p3.state });
  var seen = load("seen", {});
  function noteAdd(ref, title, text, target = "") {
    {
      const t3 = S.tabs.find((x2) => x2.ref === ref);
      if (t3 && ref !== curRef()) {
        t3.dot = true;
        saveTabs();
      }
    }
    S.notes = [{ id: Date.now() + Math.random(), ref, title, text, target, at: (/* @__PURE__ */ new Date()).toISOString(), read: false }, ...S.notes].slice(0, 200);
    localStorage.setItem("notes", JSON.stringify(S.notes));
    if (tauri) tauri.invoke("notify", { title: `${ref} \xB7 ${title}`.slice(0, 80), body: text, prRef: ref, target }).catch(() => {
    });
  }
  function noteDiff(ref, title, was, now, fresh = []) {
    const out = [], d3 = (a3, b2) => b2 - a3;
    if (d3(was.commits, now.commits) > 0) out.push(`${d3(was.commits, now.commits)} new commit${d3(was.commits, now.commits) > 1 ? "s" : ""}`);
    if (d3(was.comments, now.comments) > 0) out.push(`${d3(was.comments, now.comments)} new comment${d3(was.comments, now.comments) > 1 ? "s" : ""}`);
    if (d3(was.rc, now.rc) > 0) out.push(`${d3(was.rc, now.rc)} new review comment${d3(was.rc, now.rc) > 1 ? "s" : ""}`);
    if (was.state !== now.state) out.push(`now ${now.state}`);
    const last = fresh.filter((f4) => !was.at || f4.created_at > was.at).sort((x2, y3) => x2.created_at < y3.created_at ? -1 : 1).pop();
    if (last) out.push(`\u201C${last.body.replace(/\s+/g, " ").slice(0, 60)}\u201D \u2014 ${last.user}`);
    if (out.length) noteAdd(ref, title, out.join(", "), last ? String(last.id) : "");
  }
  function remember(ref, p3) {
    seen[ref] = { ...snap(p3), at: p3.updated_at || (/* @__PURE__ */ new Date()).toISOString() };
    localStorage.setItem("seen", JSON.stringify(seen));
  }
  var qc = {
    m: /* @__PURE__ */ new Map(),
    inflight: /* @__PURE__ */ new Map(),
    STALE: 3e4,
    peek(k3) {
      return this.m.get(k3);
    },
    fresh(k3, ms = 3e4) {
      const e3 = this.m.get(k3);
      return !!e3 && Date.now() - e3.at < ms;
    },
    set(k3, data) {
      this.m.set(k3, { data, at: Date.now() });
    },
    invalidate(k3) {
      const e3 = this.m.get(k3);
      if (e3) e3.at = 0;
    },
    fetch(k3, fn) {
      if (this.inflight.has(k3)) return this.inflight.get(k3);
      const p3 = fn().then((d3) => {
        this.set(k3, d3);
        return d3;
      }).finally(() => this.inflight.delete(k3));
      this.inflight.set(k3, p3);
      return p3;
    }
  };
  var loadPr = (input) => tauri ? tauri.invoke("fetch_pr", { url: input }) : fetch(new URL(input, location.href)).then((r3) => r3.json());
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
        const d3 = await tauri.invoke("inbox", { force: false });
        S.watch = [...d3.mine || [], ...d3.requested || []].map((i3) => `${i3.repo}#${i3.number}`);
      } catch {
      }
    }
    const refs = S.hasToken ? [.../* @__PURE__ */ new Set([...cur ? [cur] : [], ...S.tabs.map((t3) => t3.ref), ...S.recent.slice(0, 8).map((r3) => r3.ref), ...S.watch || []])].slice(0, 40) : cur ? [cur] : [];
    for (const ref of refs) {
      const m3 = ref.match(/^(.+)#(\d+)$/);
      if (!m3) continue;
      try {
        const p3 = await tauri.invoke("check_pr", { repo: m3[1], number: +m3[2], since: seen[ref]?.at || null });
        const now = snap(p3);
        const n0 = S.notes.length;
        if (seen[ref]) noteDiff(ref, p3.title, seen[ref], now, p3.fresh);
        if (S.notes.length !== n0) prefetch(ref);
        remember(ref, p3);
        const bp = S.bundle?.pull;
        if (cur && ref.toLowerCase() === cur.toLowerCase() && S.view === "pr" && bp && !S.loading && !S.refreshing && (p3.updated_at && p3.updated_at > (bp.updated_at || "") || (p3.comments ?? bp.comments) !== bp.comments || (p3.review_comments ?? bp.review_comments) !== bp.review_comments) && !document.activeElement?.closest?.(".tt")) {
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
  var ago = (t3) => {
    const m3 = Math.max(1, Math.round((Date.now() - +new Date(t3)) / 6e4));
    return m3 < 60 ? `${m3} minute${m3 === 1 ? "" : "s"} ago` : `${Math.round(m3 / 60)} hour${m3 >= 90 ? "s" : ""} ago`;
  };
  var pushList = (repo) => Object.entries(S.pushes).filter(([r3]) => !repo || r3 === repo).flatMap(([, l3]) => l3).filter((p3) => !pushDis[`${p3.repo}@${p3.branch}@${p3.at}`] && Date.now() - +new Date(p3.at) < 6 * 36e5);
  function pushBannerItems(repo) {
    return pushList(repo).slice(0, 3).map((p3) => ({ repo: p3.repo, branch: p3.branch, ago: ago(p3.at), key: `${p3.repo}@${p3.branch}@${p3.at}`, showRepo: !repo }));
  }
  async function refreshPushes(repo) {
    if (!tauri || !S.hasToken || !repo) return;
    try {
      const l3 = await tauri.invoke("recent_pushes", { repo }), was = JSON.stringify(S.pushes[repo] || []);
      S.pushes[repo] = l3;
      if (JSON.stringify(l3) !== was && (S.view === "repo" || !S.bundle && S.view !== "newpr" && S.view !== "inbox" && S.view !== "notes") && !document.activeElement?.closest?.(".tt")) rerender();
    } catch {
    }
  }
  var branchSeen = load("branches", {});
  async function pollBranches(refs, cur) {
    if (!S.hasToken) return;
    const repos = [...new Set([...refs, cur].filter(Boolean).map((r3) => r3.replace(/#\d+$/, "")))].slice(0, 6);
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

  // src/components/TabStrip.tsx
  var tabShift = (d3, i3) => !d3 ? void 0 : i3 === d3.from ? `transform:translateX(${d3.dx}px)` : d3.from < d3.to && i3 > d3.from && i3 <= d3.to ? `transform:translateX(-${d3.w}px)` : d3.from > d3.to && i3 < d3.from && i3 >= d3.to ? `transform:translateX(${d3.w}px)` : void 0;
  function TabStrip({ tabs, cur, recents, menu, menuAt, drag: drag2, closedFirst, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "ptabs", children: [
      tabs.map((t3, i3) => /* @__PURE__ */ u3("div", { class: `ptab ${t3.ref === cur ? "on" : ""}${drag2 && drag2.from === i3 ? " drag" : ""}`, style: tabShift(drag2, i3), "data-tab": i3, onClick: (e3) => {
        if (e3.target.closest(".pt-x")) return;
        on3.open(i3);
      }, onAuxClick: (e3) => on3.aux(e3, i3), onMouseDown: (e3) => on3.down(e3, i3), title: t3.ref + " \xB7 " + t3.title, children: [
        /* @__PURE__ */ u3("span", { class: `rc-i ${t3.state}`, children: /* @__PURE__ */ u3(Icon, { n: t3.icon }) }),
        /* @__PURE__ */ u3("span", { class: "pt-t", children: [
          /* @__PURE__ */ u3("i", { children: t3.ref.split("/").pop() }),
          " ",
          t3.title
        ] }),
        t3.dot && /* @__PURE__ */ u3("span", { class: "pt-dot" }),
        /* @__PURE__ */ u3("button", { class: "pt-x", "data-tabx": i3, onClick: (e3) => on3.close(e3, i3), "aria-label": "Close tab", children: /* @__PURE__ */ u3(Icon, { n: "x" }) })
      ] })),
      /* @__PURE__ */ u3("button", { class: "pt-add", id: "tabadd", onClick: on3.add, title: "New tab (\u2318T)", "aria-label": "New tab", children: [
        /* @__PURE__ */ u3(Icon, { n: "plus" }),
        tabs.length < 2 && /* @__PURE__ */ u3("span", { children: "New tab" })
      ] }),
      menu && /* @__PURE__ */ u3("div", { class: "pt-menu", style: menuAt ? `top:${menuAt.top}px;left:${menuAt.left}px;margin-top:0` : void 0, children: [
        /* @__PURE__ */ u3("a", { "data-tabhome": "", onClick: on3.home, children: [
          /* @__PURE__ */ u3(Icon, { n: "home" }),
          " Home"
        ] }),
        recents.length > 0 && /* @__PURE__ */ u3("h6", { children: "Recent" }),
        recents.map((r3) => /* @__PURE__ */ u3("a", { "data-tabnew": r3.ref, onClick: () => on3.fresh(r3.ref), children: [
          /* @__PURE__ */ u3("span", { class: `rc-i ${r3.state}`, children: /* @__PURE__ */ u3(Icon, { n: r3.icon }) }),
          /* @__PURE__ */ u3("span", { class: "pt-mt", children: [
            /* @__PURE__ */ u3("i", { children: r3.ref }),
            " ",
            r3.title
          ] })
        ] })),
        closedFirst !== null && /* @__PURE__ */ u3(S2, { children: [
          /* @__PURE__ */ u3("h6", { children: "Closed" }),
          /* @__PURE__ */ u3("a", { "data-tabreopen": "", onClick: on3.reopen, children: [
            /* @__PURE__ */ u3(Icon, { n: "clock" }),
            " Reopen ",
            closedFirst,
            " ",
            /* @__PURE__ */ u3("kbd", { children: "\u2318\u21E7T" })
          ] })
        ] })
      ] })
    ] });
  }

  // src/components/Toolbar.tsx
  var NL2 = "\n  ";
  function Toolbar(p3) {
    const label = p3.profile ? p3.profile.name || p3.profile.login : "";
    return /* @__PURE__ */ u3("header", { class: "toolbar", "data-tauri-drag-region": "", onMouseDown: p3.on.drag, children: [
      NL2,
      /* @__PURE__ */ u3("button", { class: "tb-btn nav-btn", id: "navbtn", onClick: p3.on.nav, title: "Show or hide the sidebar", children: /* @__PURE__ */ u3(Icon, { n: "three-bars" }) }),
      /* @__PURE__ */ u3("div", { class: "tb-group", children: [
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "back", onClick: p3.on.back, disabled: !p3.canBack, title: "Back (\u2318[)", children: /* @__PURE__ */ u3(Icon, { n: "chevron-left" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "fwd", onClick: p3.on.fwd, disabled: !p3.canFwd, title: "Forward (\u2318])", children: /* @__PURE__ */ u3(Icon, { n: "chevron-right" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "reload", onClick: p3.on.reload, disabled: !p3.hasBundle, title: "Reload (\u2318R)", children: /* @__PURE__ */ u3(Icon, { n: "sync" }) })
      ] }),
      NL2,
      /* @__PURE__ */ u3("form", { id: "addr", class: "addr", onSubmit: p3.on.addr, children: [
        /* @__PURE__ */ u3(Icon, { n: "search" }),
        /* @__PURE__ */ u3("input", { id: "addrinput", ref: useFocusTarget("addr"), value: p3.text, onInput: p3.on.input, onFocus: p3.on.focus, onBlur: p3.on.blur, onKeyDown: p3.on.key, placeholder: "Open a pull request: owner/repo#123 or URL  (\u2318L)", spellcheck: false, autocomplete: "off" })
      ] }),
      p3.update && /* @__PURE__ */ u3("button", { class: "upd", id: "upd", onClick: p3.on.upd, title: "Download and install the new version, then restart", children: [
        /* @__PURE__ */ u3(Icon, { n: "sync" }),
        " ",
        p3.update.busy ? "Updating\u2026" : "Update to v" + p3.update.version
      ] }),
      NL2,
      /* @__PURE__ */ u3("div", { class: "tb-group", children: [
        /* @__PURE__ */ u3("button", { class: `tb-btn off-ind ${p3.offline ? "on" : ""}`, id: "retry", onClick: p3.on.retry, "data-tip": "Offline \u2014 can't reach GitHub. Showing the saved copy. Click to retry.", "aria-label": "Offline, click to retry", tabindex: p3.offline ? 0 : -1, children: /* @__PURE__ */ u3(Icon, { n: "alert" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "external", onClick: p3.on.external, disabled: !p3.hasBundle, title: "Open on github.com", children: /* @__PURE__ */ u3(Icon, { n: "link-external" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "newprbtn", onClick: p3.on.newPr, title: "New pull request", children: /* @__PURE__ */ u3(Icon, { n: "plus" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "inboxbtn", onClick: p3.on.inbox, title: "Inbox: PRs that need you", children: /* @__PURE__ */ u3(Icon, { n: "checklist" }) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn bell", id: "bell", onClick: p3.on.bell, title: "Notifications", children: [
          /* @__PURE__ */ u3(Icon, { n: "bell" }),
          p3.unread > 0 && /* @__PURE__ */ u3("i", { class: "dot", children: p3.unread })
        ] }),
        /* @__PURE__ */ u3("button", { class: `theme-sw${p3.dark ? " dark" : ""}${p3.pop ? " pop" : ""}`, id: "mode", onClick: p3.on.mode, role: "switch", "aria-checked": p3.dark, title: `Switch to ${p3.dark ? "light" : "dark"} mode`, children: [
          /* @__PURE__ */ u3("i", { class: "st" }),
          /* @__PURE__ */ u3("i", { class: "st s2" }),
          /* @__PURE__ */ u3("i", { class: "st s3" }),
          /* @__PURE__ */ u3("i", { class: "cl" }),
          /* @__PURE__ */ u3("i", { class: "cl c2" }),
          /* @__PURE__ */ u3("span", { class: "knob", children: [
            /* @__PURE__ */ u3("b", { class: "cr" }),
            /* @__PURE__ */ u3("b", { class: "cr c2" }),
            /* @__PURE__ */ u3("b", { class: "cr c3" })
          ] })
        ] }, p3.pop),
        p3.hasToken && p3.profile ? /* @__PURE__ */ u3("button", { class: "prof-btn", id: "profbtn", onClick: p3.on.prof, title: `${label} \u2014 account menu`, children: [
          /* @__PURE__ */ u3("img", { src: p3.avatar, alt: "" }),
          /* @__PURE__ */ u3("span", { children: label }),
          /* @__PURE__ */ u3(Icon, { n: "chevron-down", s: 12 })
        ] }) : /* @__PURE__ */ u3("button", { class: "tb-btn", id: "signin", onClick: p3.on.signin, title: "Access token", children: /* @__PURE__ */ u3(Icon, { n: "key" }) })
      ] })
    ] });
  }

  // src/app/render.ts
  var go2 = (n2) => {
    const t3 = S.hi + n2;
    if (t3 < 0 || t3 >= S.hist.length) return;
    S.hi = t3;
    S.hist[t3].startsWith("repo:") ? openRepo(S.hist[t3].slice(5), { nav: true }) : openPr(S.hist[t3], { nav: true });
  };

  // src/app/top.tsx
  var keep2 = (fn) => {
    S.keepScroll = true;
    fn();
    render();
    S.keepScroll = false;
  };
  var mode = (e3) => {
    const r3 = e3.currentTarget.getBoundingClientRect(), x2 = r3.left + r3.width / 2, y3 = r3.top + r3.height / 2;
    S.mode = isDark() ? "light" : "dark";
    localStorage.setItem("mode", S.mode);
    const swap = () => {
      S.themePop = (S.themePop || 0) + 1;
      keep2(() => {
      });
    };
    if (!document.startViewTransition) {
      swap();
      return;
    }
    const end = Math.hypot(Math.max(x2, innerWidth - x2), Math.max(y3, innerHeight - y3));
    document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x2}px ${y3}px)`, `circle(${end}px at ${x2}px ${y3}px)`] }, { duration: 750, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }).finished);
  };
  var prof = (e3) => {
    e3.stopPropagation();
    if (S.pop?.k === "prof") {
      closePop();
      return;
    }
    const pr = S.profile, r3 = e3.currentTarget.getBoundingClientRect();
    openPop({ k: "prof", right: Math.max(8, innerWidth - r3.right), top: r3.bottom + 6, name: pr.name || pr.login, login: pr.login, avatar: avUrl(pr.avatar_url, 80), pick: async (h3) => {
      closePop();
      if (h3 === "profile") openExternal(pr.html_url);
      else if (h3 === "token") tokenDialog();
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
    } });
  };
  var tb = {
    nav: (e3) => {
      e3.stopPropagation();
      if (matchMedia("(min-width: 901px)").matches) {
        S.hide.nav = !S.hide.nav;
        try {
          localStorage.setItem("hide", JSON.stringify(S.hide));
        } catch {
        }
        keep2(() => {
        });
        return;
      }
      keep2(() => {
        S.nav = !S.nav;
      });
    },
    back: () => go2(-1),
    fwd: () => go2(1),
    reload,
    external: () => openExternal(S.bundle.pull.html_url),
    mode,
    drag: (e3) => winDrag(e3),
    addr: (e3) => addrSubmit(e3),
    input: (e3) => addrInput(e3),
    focus: (e3) => addrFocus(e3),
    blur: () => addrBlur(),
    key: (e3) => addrKey(e3),
    upd: async () => {
      const u4 = S.update;
      if (!u4 || u4.busy) return;
      u4.busy = true;
      render();
      try {
        await u4.obj.downloadAndInstall();
        await window.__TAURI__.process.relaunch();
      } catch (e3) {
        u4.busy = false;
        S.actErr = { k: "update", m: "Update failed: " + String(e3) };
        render();
      }
    },
    retry: (ev) => {
      const sel = btnSel(ev.currentTarget);
      setBusy(sel, true);
      S.offline = navigator.onLine === false;
      Promise.resolve(reload()).finally(() => setBusy(sel, false));
    },
    newPr: () => openNewPr(),
    inbox: openInbox,
    bell: (e3) => {
      e3.stopPropagation();
      setBell(!S.bell);
    },
    signin: tokenDialog,
    prof
  };
  var swallowClick = false;
  var tabDown = (e3, from) => {
    const el = e3.currentTarget;
    if (e3.button !== 0 || e3.target.closest(".pt-x")) return;
    const x0 = e3.clientX, w3 = el.offsetWidth;
    let moved = false, to = from;
    const mids = [...el.parentElement.querySelectorAll(".ptab")].map((t3) => {
      const r3 = t3.getBoundingClientRect();
      return r3.left + r3.width / 2;
    });
    const mv = (ev) => {
      if (!moved && Math.abs(ev.clientX - x0) < 6) return;
      if (!moved) {
        moved = true;
        setDragging(true);
      }
      to = mids.reduce((best, m3, i3) => ev.clientX > m3 ? i3 : best, 0);
      S.drag = { from, to, dx: ev.clientX - x0, w: w3 };
      paintTop();
    };
    const up = () => {
      setDragging(false);
      if (!moved) return;
      swallowClick = true;
      setTimeout(() => {
        swallowClick = false;
      }, 0);
      S.drag = null;
      if (to !== from) {
        const [t3] = S.tabs.splice(from, 1);
        S.tabs.splice(to, 0, t3);
        saveTabs();
      }
      render();
    };
    beginDrag({ move: mv, end: up });
  };
  var ts = {
    open: (i3) => {
      if (swallowClick) return;
      const t3 = S.tabs[i3];
      if (t3.ref !== curRef()) {
        if (fastTab(t3.ref)) return;
        stashCurrent();
        tabSnap();
        S.fadeMain = true;
        S.tabMenu = false;
        openPr(t3.ref, { nav: true, restore: t3.tab });
      }
    },
    aux: (e3, i3) => {
      if (e3.button === 1) {
        e3.preventDefault();
        closeTab(i3);
      }
    },
    down: tabDown,
    close: (e3, i3) => {
      e3.stopPropagation();
      closeTab(i3);
    },
    add: (e3) => {
      e3.stopPropagation();
      const r3 = e3.currentTarget.getBoundingClientRect();
      S.tabMenuAt = { top: r3.bottom + 4, left: Math.min(r3.left, innerWidth - 350) };
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
    }
  };
  function Top() {
    const b2 = S.bundle, pr = S.profile, open2 = new Set(S.tabs.map((t3) => t3.ref));
    return /* @__PURE__ */ u3(S2, { children: [
      S.refreshing && /* @__PURE__ */ u3("div", { class: "refreshing-bar" }),
      /* @__PURE__ */ u3(
        Toolbar,
        {
          text: S.addrText ?? (b2 ? `${b2.pull.base.repo.full_name}#${b2.pull.number}` : ""),
          hasBundle: !!b2,
          canBack: !(S.hist.length < 2 || S.hi < 1),
          canFwd: !(S.hi >= S.hist.length - 1),
          update: S.update ? { busy: S.update.busy, version: S.update.version } : null,
          offline: isOff(),
          unread: S.notes.filter((n2) => !n2.read).length,
          dark: isDark(),
          pop: S.themePop || 0,
          profile: pr,
          hasToken: S.hasToken,
          avatar: S.hasToken && pr ? avUrl(pr.avatar_url, 56) : "",
          on: tb
        }
      ),
      /* @__PURE__ */ u3(TabStrip, { tabs: S.tabs, cur: S.tabPending || curRef(), recents: S.recent.filter((r3) => !open2.has(r3.ref)).slice(0, 8), menu: S.tabMenu, menuAt: S.tabMenuAt || null, drag: S.drag || null, closedFirst: S.closed.length ? S.closed[0].ref : null, on: ts })
    ] });
  }
  var paintTop = () => setSlot("top", /* @__PURE__ */ u3(Top, {}));
  var clearTop = () => setSlot("top", null);

  // src/app/notes.tsx
  function paintNotes() {
    setSlot("notes", /* @__PURE__ */ u3(NotePanel, { open: S.bell, rows: S.notes.map((n2) => ({ id: n2.id, ref: n2.ref, target: n2.target || "", read: !!n2.read, title: n2.title, text: n2.text, when: whenParts(n2.at).text })), on: noteOn }));
  }
  function setBell(open2) {
    S.bell = open2;
    if (!open2 && S.notes.some((n2) => !n2.read)) {
      S.notes.forEach((n2) => {
        n2.read = true;
      });
      saveNotes();
      paintTop();
    }
    paintNotes();
  }
  var keepRender = () => {
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var row = (e3) => e3.currentTarget;
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
  function noteOpen(e3) {
    openClick(row(e3), e3);
    S.bell = false;
    S.notes.forEach((n2) => {
      n2.read = true;
    });
    saveNotes();
  }
  var noteOn = { all: noteAll, check: () => {
    pollNotes();
  }, clear: noteClear, open: noteOpen, aux: (e3) => openAux(row(e3), e3), ctx: (e3) => openCtx(row(e3), e3) };
  function notesAway(e3) {
    if (!S.bell || e3.target.closest(".note-panel, #bell")) return;
    setBell(false);
  }
  var notesKey = (e3) => {
    if (e3.key === "Escape" && S.bell) setBell(false);
  };

  // src/components/Sidebar.tsx
  var cap3 = (s3) => s3[0].toUpperCase() + s3.slice(1);
  function SideTabs({ active, hasRepo, on: on3 }) {
    const cls = (t3) => active === t3 ? "on" : "";
    return /* @__PURE__ */ u3("div", { class: "sb-tabs", children: [
      /* @__PURE__ */ u3("button", { "data-side": "repos", class: cls("repos"), onClick: () => on3.side("repos"), children: "Repos" }),
      hasRepo && /* @__PURE__ */ u3("button", { "data-side": "prs", class: cls("prs"), onClick: () => on3.side("prs"), children: "PRs" }),
      /* @__PURE__ */ u3("button", { "data-side": "recent", class: cls("recent"), onClick: () => on3.side("recent"), children: "Recent" })
    ] });
  }
  function RcItem({ r: r3, on: on3 }) {
    return /* @__PURE__ */ u3("a", { class: `rc ${r3.on ? "on" : ""}`, "data-open": r3.ref, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
      /* @__PURE__ */ u3("span", { class: `rc-i ${r3.st}`, children: /* @__PURE__ */ u3(Icon, { n: r3.icon }) }),
      /* @__PURE__ */ u3("span", { class: "rc-t", children: [
        /* @__PURE__ */ u3("b", { children: r3.title }),
        /* @__PURE__ */ u3("i", { children: r3.sub })
      ] })
    ] });
  }
  function RecentList({ recent, curRef: curRef2, on: on3 }) {
    if (!recent.length) return /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Pull requests you open appear here." });
    return /* @__PURE__ */ u3(S2, { children: recent.map((r3) => /* @__PURE__ */ u3("a", { class: `rc ${r3.ref === curRef2 ? "on" : ""}`, "data-open": r3.ref, onClick: (e3) => on3.open(e3.currentTarget, e3), onAuxClick: (e3) => on3.aux(e3.currentTarget, e3), onContextMenu: (e3) => on3.ctx(e3.currentTarget, e3), children: [
      /* @__PURE__ */ u3("span", { class: `rc-i ${r3.state}`, children: /* @__PURE__ */ u3(Icon, { n: r3.icon }) }),
      /* @__PURE__ */ u3("span", { class: "rc-t", children: [
        /* @__PURE__ */ u3("b", { children: r3.title }),
        /* @__PURE__ */ u3("i", { children: r3.ref })
      ] }),
      /* @__PURE__ */ u3("button", { class: "rc-x", "data-rm": r3.ref, onClick: (e3) => on3.rm(e3, r3.ref), title: "Remove", children: /* @__PURE__ */ u3(Icon, { n: "x" }) })
    ] })) });
  }
  function RepoList({ repos, repo, filter, on: on3 }) {
    const f4 = filter.toLowerCase(), shown2 = repos.filter((r3) => r3.full_name.toLowerCase().includes(f4));
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("input", { class: "input sb-filter", id: "repofilter", placeholder: "Find a repository\u2026", value: filter, onInput: on3.repoFilter }),
      shown2.length ? shown2.map((r3) => /* @__PURE__ */ u3("a", { class: `rc ${repo === r3.full_name ? "on" : ""}`, "data-repo": r3.full_name, onClick: () => on3.repo(r3.full_name), children: [
        /* @__PURE__ */ u3("span", { class: `rc-i ${r3.private ? "closed" : ""}`, style: "color:var(--fgColor-muted)", children: /* @__PURE__ */ u3(Icon, { n: r3.private ? "lock" : "repo" }) }),
        /* @__PURE__ */ u3("span", { class: "rc-t", children: [
          /* @__PURE__ */ u3("b", { children: r3.full_name.split("/")[1] }),
          /* @__PURE__ */ u3("i", { children: r3.full_name.split("/")[0] })
        ] })
      ] })) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "No matches." })
    ] });
  }
  function Sel({ id, opts, v: v3, onChange }) {
    return /* @__PURE__ */ u3("select", { class: "input sb-sel", id, onChange, children: opts.map(([k3, t3]) => /* @__PURE__ */ u3("option", { value: k3, selected: k3 === v3, children: t3 })) });
  }
  function SideHead({ p: p3, on: on3 }) {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3("div", { class: "sb-repo", children: [
        /* @__PURE__ */ u3("button", { class: "fold-btn", "data-side": "repos", title: "All repositories", onClick: () => on3.side("repos"), children: /* @__PURE__ */ u3(Icon, { n: "chevron-left" }) }),
        /* @__PURE__ */ u3("b", { title: p3.repo, children: p3.repo })
      ] }),
      /* @__PURE__ */ u3("div", { class: "seg sb-seg", children: ["open", "closed", "all"].map((s3) => /* @__PURE__ */ u3("button", { "data-sps": s3, class: p3.state === s3 ? "on" : "", onClick: () => on3.sps(s3), children: cap3(s3) })) }),
      /* @__PURE__ */ u3("input", { class: "input sb-filter", id: "prfilter", placeholder: "Filter by title, #, author, label\u2026", value: p3.filter, onInput: on3.pf }),
      /* @__PURE__ */ u3("div", { class: "sb-ctl", children: [
        /* @__PURE__ */ u3("label", { children: [
          "Sort",
          /* @__PURE__ */ u3(Sel, { id: "prsort", opts: p3.sorts, v: p3.sort, onChange: on3.psort })
        ] }),
        /* @__PURE__ */ u3("label", { children: [
          "Group",
          /* @__PURE__ */ u3(Sel, { id: "prgroup", opts: p3.groups, v: p3.group, onChange: on3.pgroup })
        ] })
      ] })
    ] });
  }
  function PrGroups({ groups, on: on3 }) {
    return /* @__PURE__ */ u3(S2, { children: groups.map((g2) => /* @__PURE__ */ u3("div", { class: `pg${g2.folded}`, children: [
      /* @__PURE__ */ u3("div", { class: "pg-h", "data-fold": g2.key, onClick: (e3) => on3.fold(e3, g2.key), children: [
        /* @__PURE__ */ u3(Icon, { n: g2.closed ? "chevron-right" : "chevron-down" }),
        /* @__PURE__ */ u3("span", { children: g2.name }),
        /* @__PURE__ */ u3("i", { children: g2.rows.length })
      ] }),
      /* @__PURE__ */ u3("div", { class: "pg-b", children: g2.rows.map((r3) => /* @__PURE__ */ u3(RcItem, { r: r3, on: on3 })) })
    ] })) });
  }
  function Sidebar({ sideTab, hasRepo, hasToken, on: on3, children }) {
    return /* @__PURE__ */ u3("aside", { class: "sidebar", children: [
      /* @__PURE__ */ u3(SideTabs, { active: sideTab, hasRepo, on: on3 }),
      /* @__PURE__ */ u3("div", { class: "sb-list", children }),
      /* @__PURE__ */ u3("div", { class: "sb-foot", children: hasToken ? "Signed in with token" : "Anonymous \xB7 60 requests/hour" })
    ] });
  }

  // src/app/prlist.ts
  var PSORT = { updated: "Recently updated", created: "Newest", oldest: "Oldest", number: "Number", title: "Title A\u2013Z", author: "Author" };
  var PGROUP = { none: "No grouping", status: "Status", author: "Author", label: "Label", base: "Base branch" };
  var prStatus = (p3) => p3.merged_at ? "merged" : p3.state === "closed" ? "closed" : p3.draft ? "draft" : "open";
  var PICON = { open: "git-pull-request", draft: "git-pull-request-draft", merged: "git-merge", closed: "git-pull-request-closed" };
  function prFiltered() {
    const f4 = S.pf.toLowerCase();
    const list = (S.prs || []).filter((p3) => (!f4 || `#${p3.number} ${p3.title} ${p3.user.login} ${p3.head?.ref || ""} ${(p3.labels || []).map((l3) => l3.name).join(" ")}`.toLowerCase().includes(f4)) && (!S.pAuthor || p3.user.login === S.pAuthor) && (!S.pLabel || (p3.labels || []).some((l3) => l3.name === S.pLabel)) && (!S.pStatus || prStatus(p3) === S.pStatus));
    const cmps = { updated: (a3, b2) => b2.updated_at.localeCompare(a3.updated_at), created: (a3, b2) => b2.created_at.localeCompare(a3.created_at), oldest: (a3, b2) => a3.created_at.localeCompare(b2.created_at), number: (a3, b2) => b2.number - a3.number, title: (a3, b2) => a3.title.localeCompare(b2.title), author: (a3, b2) => a3.user.login.localeCompare(b2.user.login) || b2.number - a3.number };
    return list.sort(cmps[S.psort]);
  }
  function prFilterBar() {
    if (!S.prs) return null;
    const authors = [...new Set(S.prs.map((p3) => p3.user.login))].sort((a3, b2) => a3.localeCompare(b2));
    const labels = [...new Set(S.prs.flatMap((p3) => (p3.labels || []).map((l3) => l3.name)))].sort((a3, b2) => a3.localeCompare(b2));
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
    const rows = S.error || !S.prs ? null : prFiltered().map((p3) => {
      const st = p3.merged_at ? ["merged", "git-merge"] : p3.state === "closed" ? ["closed", "git-pull-request-closed"] : p3.draft ? ["draft", "git-pull-request-draft"] : ["open", "git-pull-request"];
      return { ref: `${S.repo}#${p3.number}`, st: st[0], icon: st[1], title: p3.title, labels: p3.labels || [], meta: `#${p3.number} ${p3.merged_at ? "merged" : p3.state === "closed" ? "closed" : "opened"} ${when(p3.merged_at || p3.closed_at || p3.created_at).replace(/<\/?span[^>]*>/g, "")} by ${p3.user.login}`, avatar: p3.user.avatar_url ?? "" };
    });
    return { repo: S.repo, state: S.prState, banners: pushBannerItems(S.repo), filterBar: prFilterBar(), rows, err: S.error ? String(S.error) : "", loading: !S.error && !S.prs, empty: S.prs?.length ? "No pull requests match the filters." : "No pull requests." };
  }

  // src/app/side.tsx
  var typed = (e3, key) => {
    S[key] = e3.target.value;
    render();
  };
  var on2 = {
    side: (tab) => {
      S.sideTab = tab;
      render();
    },
    sps: (state) => {
      S.prState = state;
      loadPrs();
    },
    pf: (e3) => typed(e3, "pf"),
    psort: (e3) => {
      S.psort = e3.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    },
    pgroup: (e3) => {
      S.pgroup = e3.target.value;
      localStorage.setItem("pgroup", S.pgroup);
      render();
    },
    repoFilter: (e3) => typed(e3, "repoFilter"),
    repo: (name) => openRepo(name),
    addToken: tokenDialog,
    open: openClick,
    aux: openAux,
    ctx: openCtx,
    rm: rmRecent,
    // Folding only flips state; the page and the sidebar both repaint from it.
    fold: (e3, k3) => {
      e3.stopPropagation();
      S.fold[k3] = !isFolded(k3);
      localStorage.setItem("fold", JSON.stringify(S.fold));
      rerender();
      repaintSide();
    }
  };
  function PrRows() {
    const cur = S.bundle && S.view === "pr" ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
    const f4 = S.pf.toLowerCase();
    const head2 = { repo: S.repo, state: S.prState, filter: S.pf, sort: S.psort, group: S.pgroup, sorts: Object.entries(PSORT), groups: Object.entries(PGROUP) };
    const header = /* @__PURE__ */ u3(SideHead, { p: head2, on: on2 });
    if (!S.prs) return /* @__PURE__ */ u3(S2, { children: [
      header,
      /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading pull requests\u2026" })
    ] });
    const list = S.prs.filter((p3) => !f4 || `#${p3.number} ${p3.title} ${p3.user.login} ${p3.head?.ref || ""} ${(p3.labels || []).map((l3) => l3.name).join(" ")}`.toLowerCase().includes(f4));
    const sorts = { updated: (a3, b2) => b2.updated_at.localeCompare(a3.updated_at), created: (a3, b2) => b2.created_at.localeCompare(a3.created_at), oldest: (a3, b2) => a3.created_at.localeCompare(b2.created_at), number: (a3, b2) => b2.number - a3.number, title: (a3, b2) => a3.title.localeCompare(b2.title), author: (a3, b2) => a3.user.login.localeCompare(b2.user.login) || b2.number - a3.number };
    list.sort(sorts[S.psort]);
    const row2 = (p3) => {
      const st = prStatus(p3), ref = `${S.repo}#${p3.number}`;
      return { ref, on: ref === cur, st, icon: PICON[st], title: p3.title, sub: `#${p3.number} \xB7 ${p3.user.login} \xB7 ${when(p3.updated_at).replace(/<\/?span[^>]*>/g, "")}` };
    };
    if (!list.length) return /* @__PURE__ */ u3(S2, { children: [
      header,
      /* @__PURE__ */ u3("div", { class: "sb-empty", children: S.pf ? "No matches." : "No pull requests." })
    ] });
    if (S.pgroup === "none") return /* @__PURE__ */ u3(S2, { children: [
      header,
      /* @__PURE__ */ u3("div", { class: "sb-count", children: [
        list.length,
        " pull request",
        list.length === 1 ? "" : "s"
      ] }),
      list.map((p3) => /* @__PURE__ */ u3(RcItem, { r: row2(p3), on: on2 }))
    ] });
    const groups = /* @__PURE__ */ new Map(), put = (k3, p3) => (groups.get(k3) || groups.set(k3, []).get(k3)).push(p3);
    list.forEach((p3) => {
      if (S.pgroup === "status") put({ open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }[prStatus(p3)], p3);
      else if (S.pgroup === "author") put(p3.user.login, p3);
      else if (S.pgroup === "base") put(p3.base?.ref || "\u2014", p3);
      else if ((p3.labels || []).length) p3.labels.forEach((l3) => put(l3.name, p3));
      else put("No label", p3);
    });
    const order = S.pgroup === "status" ? ["Open", "Draft", "Merged", "Closed"] : [...groups.keys()].sort((a3, b2) => +(a3 === "No label") - +(b2 === "No label") || a3.localeCompare(b2));
    return /* @__PURE__ */ u3(S2, { children: [
      header,
      /* @__PURE__ */ u3(PrGroups, { on: on2, groups: order.filter((k3) => groups.has(k3)).map((k3) => {
        const key = "pg:" + S.pgroup + ":" + k3;
        return { key, folded: folded(key), closed: isFolded(key), name: k3, rows: groups.get(k3).map(row2) };
      }) })
    ] });
  }
  function List() {
    if (S.sideTab === "prs" && S.repo) return /* @__PURE__ */ u3(PrRows, {});
    if (S.sideTab === "recent") return /* @__PURE__ */ u3(RecentList, { recent: S.recent, curRef: S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "", on: on2 });
    if (!S.hasToken) return /* @__PURE__ */ u3("div", { class: "sb-empty", children: [
      "Add an access token to list all your repositories and their pull requests.",
      /* @__PURE__ */ u3("br", {}),
      /* @__PURE__ */ u3("br", {}),
      /* @__PURE__ */ u3("button", { class: "sb-btn", id: "addtoken", onClick: on2.addToken, children: "Add token" })
    ] });
    if (S.reposErr) return /* @__PURE__ */ u3("div", { class: "sb-empty err", children: S.reposErr });
    if (!S.repos) return /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading repositories\u2026" });
    return /* @__PURE__ */ u3(RepoList, { repos: S.repos, repo: S.repo, filter: S.repoFilter, on: on2 });
  }
  function Side() {
    return /* @__PURE__ */ u3(Sidebar, { sideTab: S.sideTab, hasRepo: !!S.repo, hasToken: S.hasToken, on: on2, children: /* @__PURE__ */ u3(List, {}) });
  }
  var paintSide = () => setSlot("side", /* @__PURE__ */ u3(Side, {}));
  var repaintSide = paintSide;

  // src/app/fun.ts
  var enterTimer;
  function enterAnim() {
    S.enter = true;
    repaintShell({ enter: true });
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => {
      S.enter = false;
      repaintShell({ enter: false });
    }, 1800);
  }
  function ripple(e3) {
    const b2 = e3.target.closest(".btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add");
    if (!b2 || b2.disabled) return;
    const r3 = b2.getBoundingClientRect(), d3 = Math.max(r3.width, r3.height) * 2, cs = getComputedStyle(b2);
    fxAdd({ k: "rip", l: r3.left, t: r3.top, w: r3.width, h: r3.height, radius: cs.borderRadius, color: cs.color, x: e3.clientX - r3.left - d3 / 2, y: e3.clientY - r3.top - d3 / 2, d: d3 }, 650);
    if (b2.matches(".reaction, .react-add")) burst(e3.clientX, e3.clientY, b2.textContent.trim().slice(0, 2) || "\u2728", 6);
  }
  function burst(x2, y3, ch, n2) {
    for (let i3 = 0; i3 < n2; i3++) {
      const a3 = Math.PI * 2 * i3 / n2 + Math.random() * 0.6, v3 = 40 + Math.random() * 50;
      fxAdd({ k: "burst", x: x2, y: y3, ch, dx: Math.cos(a3) * v3, dy: Math.sin(a3) * v3 - 30 }, 900);
    }
  }
  var confetti = () => fxAdd({ k: "conf", w: innerWidth, h: innerHeight });

  // src/app/views.tsx
  var open = { open: openClick, aux: openAux, ctx: openCtx };
  var typedPf = (e3) => {
    S.pf = e3.target.value;
    render();
  };
  var prl = {
    ...open,
    ps: (s3) => {
      S.prState = s3;
      openRepo(S.repo, { nav: true });
    },
    compare: (repo, br) => openNewPr(repo, br),
    dismiss: (key) => {
      pushDis[key] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    },
    filter: typedPf,
    author: (e3) => {
      S.pAuthor = e3.target.value;
      render();
    },
    label: (e3) => {
      S.pLabel = e3.target.value;
      render();
    },
    status: (e3) => {
      S.pStatus = e3.target.value;
      render();
    },
    sort: (e3) => {
      S.psort = e3.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    },
    clear: () => {
      S.pf = S.pAuthor = S.pLabel = S.pStatus = "";
      render();
    }
  };
  function RepoView() {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: S.repo, trail: [{ t: "Pull requests" }], on: crumbs }),
      /* @__PURE__ */ u3(PrListPage, { p: prListProps(), on: prl })
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
    filter: (f4) => keep3(() => {
      S.nf = f4;
    }),
    read: (e3, id) => {
      e3.stopPropagation();
      const n2 = S.notes.find((x2) => String(x2.id) === String(id));
      if (n2) keep3(() => {
        n2.read = !n2.read;
        saveNotes();
      });
    },
    del: (e3, id) => {
      e3.stopPropagation();
      keep3(() => {
        S.notes = S.notes.filter((x2) => String(x2.id) !== String(id));
        saveNotes();
      });
    }
  };
  function NotesView() {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: "", trail: [{ t: "Notifications" }], on: crumbs }),
      /* @__PURE__ */ u3(NotesPage, { ...notesProps(), on: notes })
    ] });
  }
  var inbox = { ...open, refresh: () => loadInbox(true) };
  function InboxView() {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: "", trail: [{ t: "Inbox" }], on: crumbs }),
      /* @__PURE__ */ u3(InboxPage, { p: inboxProps(), on: inbox })
    ] });
  }
  var np = () => S.np;
  var npSet = (f4) => {
    f4();
    np().key = `${np().repo}|${np().base}|${np().head}`;
  };
  var val = (e3) => e3.target.value;
  var newpr = {
    cancel: () => {
      S.view = S.bundle ? "pr" : "home";
      delete S.draft.newpr;
      render();
    },
    repo: (e3) => bpOpen(e3.currentTarget, "repo", (v3) => {
      npSet(() => {
        np().repo = v3;
        np().base = "";
        np().head = "";
        np().cmp = null;
        np().titleTouched = false;
        np().title = "";
      });
      render();
      npLoadBranches(np().repo);
    }, true),
    repoIn: (e3) => {
      npSet(() => {
        np().repo = val(e3).trim();
        np().base = "";
        np().head = "";
      });
      npLoadBranches(np().repo);
    },
    base: (e3) => bpOpen(e3.currentTarget, "base", (v3) => {
      npSet(() => {
        np().base = v3;
      });
      npCompare();
    }),
    head: (e3) => bpOpen(e3.currentTarget, "head", (v3) => {
      npSet(() => {
        np().head = v3;
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
    tpl: (e3) => {
      const n2 = np(), sel = e3.target, t3 = n2.tpl[`${n2.repo}|${n2.base}`] || [], cur = (S.draft.newpr || "").trim(), next = sel.value === "-1" ? "" : t3[+sel.value].body;
      if (cur && cur !== n2.tplText.trim() && !confirm("Replace what you have written with this template?")) {
        rerender();
        return;
      }
      S.draft.newpr = n2.tplText = next;
      saveDrafts();
      bumpNp();
      rerender();
      syncDraft("newpr");
    },
    title: (e3) => {
      np().title = val(e3);
      np().titleTouched = true;
      render();
    },
    draft: (e3) => {
      np().draft = e3.target.checked;
      render();
    },
    add: (k3, e3) => {
      if (val(e3)) {
        np()[k3].push(val(e3));
        render();
      }
    },
    del: (k3, v3) => {
      np()[k3] = np()[k3].filter((x2) => x2 !== v3);
      render();
    },
    mile: (e3) => {
      np().milestone = val(e3);
    },
    issues: (e3) => {
      np().issues = val(e3);
    },
    create: async () => {
      const n2 = np(), sel = "#npcreate";
      setBusy(sel, true);
      n2.err = "";
      try {
        const nums = [...new Set(n2.issues.match(/\d+/g) || [])];
        const body = ((S.draft.newpr || "").trim() + (nums.length ? `

${nums.map((x2) => `Closes #${x2}`).join("\n")}` : "")).trim();
        const extra = { reviewers: n2.reviewers, assignees: n2.assignees, labels: n2.labels, milestone: n2.milestone ? Number(n2.milestone) : null };
        const r3 = await tauri.invoke("create_pr", { repo: n2.repo, base: n2.base, head: n2.head, title: n2.title, body, draft: n2.draft, extra });
        const warn = r3.warnings?.length ? `Created, but ${r3.warnings.join(" \xB7 ")}` : "";
        delete S.draft.newpr;
        saveDrafts();
        S.np = null;
        confetti();
        await openPr(`${n2.repo}#${r3.number}`, { nav: true });
        if (warn) {
          S.actErr = { k: "comment", m: warn };
          rerender();
        }
      } catch (err) {
        n2.err = String(err).replace(/^Error: /, "");
      } finally {
        setBusy(sel, false);
      }
    }
  };
  function NewPrView() {
    return /* @__PURE__ */ u3(S2, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: np().repo, trail: [{ t: "New pull request" }], on: crumbs }),
      /* @__PURE__ */ u3(NewPr, { p: newPrProps(), on: newpr })
    ] });
  }

  // src/app/pages.tsx
  var saveNotes = () => localStorage.setItem("notes", JSON.stringify(S.notes));
  function notesProps() {
    const f4 = S.nf || "all", unread = S.notes.filter((n2) => !n2.read).length;
    const rows = S.notes.filter((n2) => f4 === "all" || (f4 === "unread" ? !n2.read : n2.read)).map((n2) => ({ id: n2.id, read: !!n2.read, ref: n2.ref, target: n2.target || "", title: n2.title, text: n2.text, when: when(n2.at).replace(/<\/?span[^>]*>/g, "") }));
    return { f: f4, rows, unread, total: S.notes.length };
  }
  async function loadInbox(force = false) {
    S.inbox = S.inbox || { data: null, err: "", loading: true };
    S.inbox.loading = true;
    S.inbox.err = "";
    render();
    try {
      S.inbox.data = tauri ? await tauri.invoke("inbox", { force }) : { requested: [], mine: [], ready: [] };
    } catch (e3) {
      S.inbox.err = String(e3).replace(/^Error: /, "");
    }
    S.inbox.loading = false;
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  }
  var npHuman = (s3) => s3.replace(/^[a-z]+\//i, "").replace(/[-_]+/g, " ").replace(/^./, (c3) => c3.toUpperCase());
  var npSeq = 0;
  var bumpNp = () => {
    npSeq++;
  };
  function newPrProps() {
    const n2 = S.np, repos = (S.repos || []).filter((r3) => !r3.archived), br = n2.branches[n2.repo];
    const same = !!(n2.base && n2.base === n2.head);
    const c3 = n2.cmp;
    const cmp = c3 === "loading" ? { kind: "loading", text: "", ahead: 0, files: 0, behind: 0 } : !c3 ? { kind: "none", text: "", ahead: 0, files: 0, behind: 0 } : typeof c3 === "string" ? { kind: "err", text: c3, ahead: 0, files: 0, behind: 0 } : c3.ahead_by ? { kind: "ok", text: "", ahead: c3.ahead_by, files: c3.files, behind: c3.behind_by } : { kind: "same", text: "", ahead: 0, files: 0, behind: 0 };
    const ready = !!(n2.title.trim() && n2.repo && n2.base && n2.head && !same && n2.cmp && typeof n2.cmp === "object" && n2.cmp.ahead_by > 0);
    return { hasRepos: repos.length > 0, repo: n2.repo, base: n2.base, head: n2.head, hasBranches: !!br, same, cmp, title: n2.title, tpls: n2.tpl[`${n2.repo}|${n2.base}`] ?? null, tplText: n2.tplText, seq: npSeq, isDraft: !!n2.draft, err: n2.err || "", ready, meta: npMetaProps(n2) };
  }
  function npMetaProps(n2) {
    const m3 = n2.meta?.[n2.repo];
    if (!m3) return null;
    const ppl = m3.people.map((x2) => x2.login), me = S.me || "";
    const row2 = (k3, name, list) => ({ k: k3, name, chips: n2[k3].slice(), free: list.filter((x2) => !n2[k3].includes(x2)) });
    return { rows: [row2("reviewers", "Reviewers", ppl.filter((x2) => x2 !== me)), row2("assignees", "Assignees", ppl), row2("labels", "Labels", m3.labels.map((x2) => x2.name))], milestones: m3.milestones.map((x2) => ({ number: x2.number, title: x2.title, on: String(n2.milestone) === String(x2.number) })), issues: n2.issues };
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
    } catch (e3) {
      n2.err = String(e3).replace(/^Error: /, "");
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
    const k3 = `${n2.repo}|${n2.base}`;
    if (n2.tpl[k3] !== void 0) return n2.tpl[k3] ? npApplyTemplate() : void 0;
    n2.tpl[k3] = null;
    try {
      n2.tpl[k3] = await tauri.invoke("pr_templates", { repo: n2.repo, base: n2.base });
    } catch {
      n2.tpl[k3] = [];
    }
    if (S.np === n2 && `${n2.repo}|${n2.base}` === k3) npApplyTemplate();
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
      const r3 = await tauri.invoke("compare_branches", { repo: n2.repo, base: n2.base, head: n2.head });
      if (S.np.key !== key) return;
      n2.cmp = r3;
      if (!n2.titleTouched) n2.title = r3.commits.length === 1 ? r3.commits[0] : npHuman(n2.head);
    } catch (e3) {
      if (S.np.key !== key) return;
      n2.cmp = String(e3).replace(/^Error: /, "");
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
    const I3 = S.inbox || { loading: true }, d3 = I3.data;
    const row2 = (p3) => {
      const ref = `${p3.repo}#${p3.number}`, was = seen[ref]?.at;
      return { ref, avatar: p3.avatar, title: p3.title, sub: `${ref} \xB7 ${p3.user} \xB7 ${when(p3.updated_at).replace(/<\/?span[^>]*>/g, "")}${p3.draft ? " \xB7 Draft" : ""}`, fresh: !!(was && p3.updated_at > was), comments: p3.comments || 0 };
    };
    const sec = (title, sub, list) => ({ title, sub, rows: list.map(row2) });
    return { loading: !!I3.loading, err: I3.err || "", secs: d3 ? [sec("Review requested", "Waiting on you", d3.requested), sec("Ready to merge", "Your approved pull requests", d3.ready), sec("Your pull requests", "Open PRs you opened", d3.mine)] : null };
  }
  var needSignIn = () => tauri && S.authChecked && !S.hasToken || new URLSearchParams(location.search).get("gate") === "1";
  function scrollMain(top, smooth = false) {
    S.mainTop = top;
    request("scroll:main", { top, smooth });
  }
  var gripDown = (e3) => {
    e3.preventDefault();
    const x0 = e3.clientX, w0 = S.sbw;
    setDragging(true);
    beginDrag({ move: (ev) => {
      S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0));
      repaintShell({ sbw: S.sbw });
    }, end: () => {
      setDragging(false);
      localStorage.setItem("sbw", String(Math.round(S.sbw)));
    } });
  };
  var gripReset = () => {
    S.sbw = 260;
    localStorage.setItem("sbw", "260");
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var scrimTap = () => {
    S.nav = false;
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var repaintShell = (patch) => {
    const cur = shellProps();
    if (cur) setShell({ ...cur, ...patch });
  };
  var liveView = () => {
    if (S.loading) return /* @__PURE__ */ u3(Skeleton, {});
    if (S.view === "inbox") return /* @__PURE__ */ u3(InboxView, {});
    if (S.view === "notes") return /* @__PURE__ */ u3(NotesView, {});
    if (S.view === "repo") return /* @__PURE__ */ u3(RepoView, {});
    if (S.view === "newpr") return S.np ? /* @__PURE__ */ u3(NewPrView, {}) : null;
    if (S.view === "pr" && S.bundle) return /* @__PURE__ */ u3(PrView, {});
    return (S.view === "home" || !S.bundle) && S.view !== "newpr" ? /* @__PURE__ */ u3(HomeView, {}) : null;
  };
  var followLink = (e3) => {
    if (S.view !== "pr") return;
    const a3 = e3.target.closest("a[href]");
    if (!a3) return;
    e3.preventDefault();
    const h3 = a3.getAttribute("href");
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h3)) openPr(h3);
    else if (/^https?:\/\//.test(h3)) openExternal(h3);
  };
  var shown = null;
  var shownPage = () => shown;
  function render() {
    if (needSignIn()) {
      shown = null;
      batch(() => {
        clearTop();
        setGate(/* @__PURE__ */ u3(Gate, { err: S.gateErr ? String(S.gateErr) : "", go: () => {
          tokenDialog();
          setTimeout(() => $("#oauthgo")?.click(), 50);
        }, tok: tokenDialog }));
        paintDlg();
      });
      return;
    }
    const stash = S.stash, live2 = stash ? stash.vnode : liveView(), ref = curRef();
    const key = S.loading ? "loading" : S.view === "pr" && S.bundle ? "pr:" + ref : S.view || "home";
    if (S.view === "pr" && S.bundle && !S.loading && live2) shown = { ref, vnode: live2 };
    const kept = [...S.alive].filter(([r3]) => "pr:" + r3 !== key).map(([r3, a3]) => ({ key: "pr:" + r3, children: a3.vnode }));
    batch(() => {
      paintTop();
      setShell({ nav: !!S.nav, navHidden: !!S.hide.nav, sbw: S.sbw, lw: S.lw, fade: !!S.fadeMain, enter: !!S.enter, stuck: !!S.stuck, active: { key, children: live2 }, onPage: followLink, onGrip: (e3) => gripDown(e3), onGripReset: () => gripReset(), onScrim: () => scrimTap(), onScroll: (e3) => scrolled("main", e3.currentTarget), kept });
      paintSide();
      paintDlg();
      paintNotes();
    });
    S.stash = null;
    (S.ios || []).forEach((o3) => o3.disconnect());
    S.ios = [];
    bindSticky();
    if (S.fadeMain) S.fadeMain = false;
    syncUnread();
    document.title = S.bundle ? `${S.bundle.pull.title} \xB7 ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "GitHub PR View";
  }

  // src/app/addressbar.ts
  var AC = { rows: [], sel: -1, nav: false, prs: {}, rect: null };
  function acRows(q3) {
    const t3 = q3.trim(), lq = t3.toLowerCase(), rows = [], seen2 = /* @__PURE__ */ new Set();
    const add = (r3) => {
      if (!seen2.has(r3.ref || r3.fill)) {
        seen2.add(r3.ref || r3.fill);
        rows.push(r3);
      }
    };
    if (/^https?:\/\//i.test(t3)) return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(t3) ? [{ ref: t3, label: "Open " + t3.replace(/^https?:\/\/github\.com\//, ""), sub: "Go to this pull request", ic: "git-pull-request" }] : [];
    const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);
    const known = [...S.tabs.map((x2) => ({ ref: x2.ref, title: x2.title, state: x2.state, ic: x2.icon })), ...S.recent.map((x2) => ({ ref: x2.ref, title: x2.title, state: x2.state, ic: x2.icon }))];
    if (pr) {
      const repo = pr[1], num = pr[2];
      if (num) add({ ref: `${t3.split("#")[0]}#${num}`, label: `Open ${t3.split("#")[0]}#${num}`, sub: "Go to this pull request", ic: "git-pull-request" });
      const fromApi = (AC.prs[repo] || []).map((x2) => ({ ref: `${x2.base?.repo?.full_name || repo}#${x2.number}`, title: x2.title, state: x2.merged_at ? "merged" : x2.state, ic: "git-pull-request" }));
      [...known.filter((x2) => x2.ref.toLowerCase().startsWith(repo + "#")), ...fromApi].filter((x2) => x2.ref.toLowerCase().split("#")[1].startsWith(num)).slice(0, 8).forEach((x2) => add({ ref: x2.ref, label: x2.title || x2.ref, sub: x2.ref, ic: x2.ic || "git-pull-request", state: x2.state }));
      return rows.slice(0, 9);
    }
    known.filter((x2) => !lq || `${x2.ref} ${x2.title}`.toLowerCase().includes(lq)).slice(0, lq ? 6 : 8).forEach((x2) => add({ ref: x2.ref, label: x2.title || x2.ref, sub: x2.ref, ic: x2.ic || "git-pull-request", state: x2.state }));
    if (lq && S.repos) S.repos.filter((r3) => r3.full_name.toLowerCase().includes(lq)).sort((a3, b2) => (b2.full_name.toLowerCase().startsWith(lq) ? 1 : 0) - (a3.full_name.toLowerCase().startsWith(lq) ? 1 : 0)).slice(0, 6).forEach((r3) => add({ fill: r3.full_name + "#", label: r3.full_name, sub: "Repository: pick a pull request", ic: r3.private ? "lock" : "repo" }));
    return rows.slice(0, 12);
  }
  function acClose() {
    AC.rows = [];
    AC.sel = -1;
    if (OV.ac) {
      OV.ac = null;
      paintOv();
    }
  }
  function acDraw() {
    if (!S.addrFocus || !AC.rect) return acClose();
    const q3 = S.addrText ?? "";
    AC.rows = acRows(q3);
    const m3 = q3.trim().toLowerCase().match(/^([^#\s]+\/[^#\s]+)#\d*$/);
    if (m3 && AC.prs[m3[1]] === void 0 && tauri) {
      AC.prs[m3[1]] = null;
      tauri.invoke("list_prs", { repo: m3[1], state: "all" }).then((r3) => {
        AC.prs[m3[1]] = r3;
        acDraw();
      }).catch(() => {
        AC.prs[m3[1]] = [];
      });
    }
    if (!AC.rows.length) return acClose();
    AC.sel = Math.min(AC.sel, AC.rows.length - 1);
    const b2 = AC.rect;
    OV.ac = { rows: AC.rows, sel: AC.sel, left: b2.left, top: b2.bottom + 6, width: b2.width, pick: acPick };
    paintOv();
  }
  var setText = (t3) => {
    S.addrText = t3;
    paintTop();
  };
  function acPick(r3) {
    if (!r3) return;
    if (r3.fill) {
      setText(r3.fill);
      focusTarget("addr", "focus");
      AC.sel = -1;
      acDraw();
      return;
    }
    acClose();
    S.addrText = null;
    paintTop();
    focusTarget("addr", "blur");
    openPr(r3.ref);
  }
  var addrSubmit = (e3) => {
    e3.preventDefault();
    const t3 = S.addrText ?? curText();
    S.addrText = null;
    acClose();
    focusTarget("addr", "blur");
    openPr(t3);
  };
  var curText = () => S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
  var addrInput = (e3) => {
    const el = e3.currentTarget;
    AC.rect = el.closest(".addr").getBoundingClientRect();
    AC.sel = -1;
    setText(el.value);
    acDraw();
  };
  var addrFocus = (e3) => {
    const el = e3.currentTarget;
    AC.rect = el.closest(".addr").getBoundingClientRect();
    S.addrFocus = true;
    AC.sel = -1;
    setTimeout(acDraw, 0);
  };
  var addrBlur = () => {
    S.addrFocus = false;
    setTimeout(() => {
      if (!S.addrFocus) {
        S.addrText = null;
        paintTop();
        acClose();
      }
    }, 120);
  };
  function addrKey(e3) {
    if (!OV.ac) return;
    if (e3.key === "ArrowDown" || e3.key === "ArrowUp") {
      e3.preventDefault();
      const n2 = AC.rows.length;
      AC.sel = e3.key === "ArrowDown" ? (AC.sel + 1) % n2 : (AC.sel - 1 + n2) % n2;
      acDraw();
    } else if (e3.key === "Tab" && AC.rows.length) {
      e3.preventDefault();
      const r3 = AC.rows[Math.max(0, AC.sel)];
      if (r3.fill) acPick(r3);
      else {
        setText(r3.ref);
        AC.sel = -1;
        acDraw();
      }
    } else if (e3.key === "Enter" && AC.sel >= 0) {
      e3.preventDefault();
      acPick(AC.rows[AC.sel]);
    } else if (e3.key === "Escape") {
      acClose();
    }
  }
  function winDrag(e3) {
    const t3 = e3.target, win = window.__TAURI__?.window?.getCurrentWindow?.();
    if (e3.button !== 0 || t3.closest("button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop")) return;
    e3.preventDefault();
    if (e3.detail === 2) win?.toggleMaximize?.();
    else win?.startDragging?.();
  }
  function bpAway(e3) {
    if (OV.bp && !e3.target.closest("#bppop")) bpClose();
  }
  function bpClose() {
    if (OV.bp) {
      OV.bp = null;
      paintOv();
    }
  }
  function bpAge(t3) {
    if (!t3) return "";
    const m3 = Math.max(1, Math.round((Date.now() - +new Date(t3)) / 6e4));
    return m3 < 60 ? `${m3}m` : m3 < 1440 ? `${Math.round(m3 / 60)}h` : m3 < 43200 ? `${Math.round(m3 / 1440)}d` : `${Math.round(m3 / 43200)}mo`;
  }
  function bpGroups(br, q3, me) {
    const det = new Map((br.details || []).map((d3) => [d3.name, d3])), rank = new Map(br.branches.map((b2, i3) => [b2, i3]));
    const all = br.branches.map((name) => ({ name, at: det.get(name)?.at || "", by: det.get(name)?.by || "" })).sort((a3, b2) => b2.at > a3.at ? 1 : b2.at < a3.at ? -1 : rank.get(a3.name) - rank.get(b2.name));
    if (q3) {
      const t3 = q3.toLowerCase();
      return [["", all.filter((x2) => x2.name.toLowerCase().includes(t3))]];
    }
    const out = [], used = /* @__PURE__ */ new Set(), take = (f4) => all.filter((x2) => !used.has(x2.name) && f4(x2) && used.add(x2.name));
    const def = take((x2) => x2.name === br.default);
    if (def.length) out.push(["Default", def]);
    const mine = me ? take((x2) => x2.by && x2.by.toLowerCase() === me.toLowerCase()) : [];
    if (mine.length) out.push(["Your branches", mine]);
    const rest = take(() => true), pre = /* @__PURE__ */ new Map();
    rest.forEach((x2) => {
      const k3 = x2.name.includes("/") ? x2.name.split("/")[0] + "/" : "";
      (pre.get(k3) || pre.set(k3, []).get(k3)).push(x2);
    });
    const single = [];
    [...pre.entries()].sort((a3, b2) => b2[1].length - a3[1].length || a3[0].localeCompare(b2[0])).forEach(([k3, l3]) => {
      if (k3 && l3.length > 1) out.push([k3, l3]);
      else single.push(...l3);
    });
    if (single.length) out.push([out.length ? "Other" : "", single.sort((a3, b2) => b2.at > a3.at ? 1 : b2.at < a3.at ? -1 : 0)]);
    return out;
  }
  function rpGroups(repos, q3, me) {
    const all = repos.filter((r3) => !r3.archived).map((r3) => ({ name: r3.full_name, at: r3.pushed_at || "", by: r3.private ? "private" : "" })).sort((a3, b2) => b2.at > a3.at ? 1 : b2.at < a3.at ? -1 : 0);
    if (q3) {
      const t3 = q3.toLowerCase();
      return [["", all.filter((x2) => x2.name.toLowerCase().includes(t3))]];
    }
    const out = [], recent = all.slice(0, 5), used = new Set(recent.map((x2) => x2.name));
    if (recent.length) out.push(["Recently pushed", recent]);
    const by = /* @__PURE__ */ new Map();
    all.filter((x2) => !used.has(x2.name)).forEach((x2) => {
      const o3 = x2.name.split("/")[0];
      (by.get(o3) || by.set(o3, []).get(o3)).push(x2);
    });
    [...by.entries()].sort((a3, b2) => +(b2[0].toLowerCase() === me.toLowerCase()) - +(a3[0].toLowerCase() === me.toLowerCase()) || b2[1].length - a3[1].length).forEach(([o3, l3]) => out.push([o3, l3]));
    return out;
  }
  function bpOpen(btn, side, pick, repoMode = false) {
    bpClose();
    const n2 = S.np, br = repoMode ? null : n2.branches[n2.repo];
    if (!repoMode && !br) return;
    const cur = repoMode ? n2.repo : n2[side], me = S.profile?.login || "", r3 = btn.getBoundingClientRect();
    const w3 = Math.max(r3.width, 340), below = innerHeight - r3.bottom, up = below < 300 && r3.top > below;
    const style = `left:${Math.max(8, Math.min(r3.left, innerWidth - w3 - 8))}px;width:${w3}px;max-height:${Math.min(420, (up ? r3.top : below) - 16)}px;${up ? `bottom:${innerHeight - r3.top + 4}px` : `top:${r3.bottom + 4}px`}`;
    const done = (v3) => {
      bpClose();
      if (v3 && v3 !== cur) pick(v3);
    };
    OV.bp = { repoMode, style, cur, age: bpAge, done, groupsFor: (q3) => repoMode ? rpGroups(S.repos || [], q3, me) : bpGroups(br, q3, me) };
    paintOv();
  }
  var avUrl = (u4, n2) => `${u4}${u4.includes("?") ? "&" : "?"}s=${n2}`;
  function loadProfile() {
    if (!tauri) return;
    tauri.invoke("viewer_profile").then((p3) => {
      S.me = p3.login;
      S.profile = p3;
      try {
        localStorage.setItem("profile", JSON.stringify(p3));
      } catch {
      }
      render();
    }).catch(() => {
    });
  }
  var openExternal = (url) => tauri ? tauri.invoke("open_external", { url }) : window.open(url, "_blank");
  function openFromList(ref, newTab) {
    const have = S.tabs.some((t3) => t3.ref === ref);
    if (have && !S.focus) {
      if (ref === curRef()) {
        S.tabMenu = false;
        return;
      }
      return openTab2(ref);
    }
    return newTab ? openTab2(ref, { newTab: true }) : openPr(ref);
  }
  var stuckOn = null;
  function bindSticky() {
    const ta = $(".pr-title-area"), tb2 = $(".pr-tabs");
    if (ta && ta === stuckOn && S.ios?.length) return;
    stuckOn = ta;
    if (ta && tb2 && !$(".is-split")) {
      const io = new IntersectionObserver(([en]) => {
        const v3 = !en.isIntersecting && en.boundingClientRect.bottom < 0;
        if (!!S.stuck !== v3) {
          S.stuck = v3;
          repaintShell({ stuck: v3 });
        }
      }, { root: $(".main"), threshold: 0 });
      io.observe(ta);
      S.ios.push(io);
    }
  }

  // src/app/actions.ts
  var peopleList = () => {
    const b2 = S.bundle;
    if (!b2) return [];
    const s3 = /* @__PURE__ */ new Set();
    [b2.pull.user, ...b2.timeline.map((e3) => e3.user || e3.actor || e3.author), ...b2.review_comments.map((c3) => c3.user)].forEach((u4) => u4?.login && s3.add(u4.login));
    return [...s3];
  };
  var drafts = load("drafts", {});
  function saveDrafts() {
    if (!S.draftRef) return;
    const d3 = Object.fromEntries(Object.entries(S.draft).filter(([, v3]) => v3 && v3.trim()));
    if (Object.keys(d3).length) drafts[S.draftRef] = d3;
    else delete drafts[S.draftRef];
    try {
      localStorage.setItem("drafts", JSON.stringify(drafts));
    } catch {
    }
  }
  var prRef = () => ({ repo: S.bundle.pull.base.repo.full_name, number: S.bundle.pull.number });
  var errMsg = (k3) => S.actErr && S.actErr.k === k3 ? S.actErr.m : "";
  function composerProps(b2) {
    const p3 = b2.pull, closed = p3.state === "closed", busy = S.busy === "comment";
    const open2 = busy || S.cOpen === true, dr = (S.draft.comment || "").trim();
    return { open: open2, draft: dr ? dr.replace(/\s+/g, " ").slice(0, 60) : "", err: errMsg("comment"), merged: !!p3.merged, closed, busy };
  }
  var mergeMethod = () => {
    const am = S.bundle?.pull.auto_merge;
    return am ? { MERGE: "merge", SQUASH: "squash", REBASE: "rebase" }[am.merge_method] || "merge" : "merge";
  };
  function mergeActProps(b2) {
    const p3 = b2.pull;
    if (p3.merged || p3.state === "closed") return null;
    const busy = S.busy === "merge", am = p3.auto_merge, blocked = p3.mergeable_state !== "clean" && p3.mergeable_state !== "unstable";
    return { draft: !!p3.draft, err: errMsg("merge"), method: S.method || mergeMethod(), busy, auto: am ? { method: am.merge_method.toLowerCase(), busy: S.busy === "disable_automerge" } : null, canAuto: blocked, autoBusy: S.busy === "automerge", errAuto: errMsg("automerge") };
  }
  function closeDlg() {
    const d3 = S.dlg;
    if (!d3) return;
    if (d3.k === "editpr") delete S.draft.prbody;
    else if (d3.k === "editc") delete S.draft.editc;
    else if (d3.k === "commits") S.cpick = null;
    else if (d3.k === "token") S.oauthLive = false;
    S.dlg = null;
    render();
  }
  function reviewDialog() {
    S.dlg = { k: "review", ev: "COMMENT", ok: async () => {
      const ev = S.dlg.ev;
      const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
      const r3 = await act("review", { body: S.draft.review || "", event: ev, extra: lines }, "review", true);
      if (r3 === void 0) return;
      delete S.draft.review;
      delete S.pending[pendKey()];
      savePending();
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function editPrDialog() {
    const p3 = S.bundle.pull;
    S.draft.prbody = p3.body || "";
    S.dlg = { k: "editpr", title: p3.title, ok: async () => {
      const title = S.dlg.title;
      const r3 = await act("edit", { body: S.draft.prbody ?? "", extra: { title } }, "editpr", true);
      if (r3 === void 0) return;
      delete S.draft.prbody;
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  async function previewDraft(key) {
    const md = (S.draft[key] || "").trim();
    if (!md) return null;
    try {
      if (!tauri) throw new Error("offline");
      const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
      return { html: await tauri.invoke("render_markdown", { text: md, repo }) };
    } catch (e3) {
      return { raw: md, err: String(e3).replace(/^Error: /, "") };
    }
  }
  function confirmDlg(title, text, label, danger, fn) {
    S.dlg = { k: "confirm", title, text, label, danger, ok: async () => {
      S.dlg = null;
      render();
      await fn();
    } };
    render();
  }
  var noteClick = (e3) => {
    const b2 = e3.target.closest?.("button");
    S.lastSel = b2 ? btnSel(b2) : null;
  };
  var btnSel = (b2) => {
    if (b2.id) return "#" + b2.id;
    const a3 = [...b2.attributes].find((x2) => x2.name.startsWith("data-"));
    return a3 ? `button[${a3.name}="${CSS.escape(a3.value)}"]` : null;
  };
  var propSel = (p3) => {
    if (p3.id) return "#" + String(p3.id);
    const k3 = Object.keys(p3).find((x2) => x2.startsWith("data-") && p3[x2] != null);
    return k3 ? `button[${k3}="${CSS.escape(String(p3[k3]))}"]` : null;
  };
  var prevVnode = l.vnode;
  l.vnode = (v3) => {
    if (v3.type === "button" && S.busySels?.length) {
      const p3 = v3.props, sel = propSel(p3);
      if (sel && S.busySels.includes(sel)) {
        p3.class = `${String(p3.class ?? p3.className ?? "")} is-busy`.trim();
        delete p3.className;
        p3.disabled = true;
        p3["aria-busy"] = "true";
      }
    }
    prevVnode?.(v3);
  };
  var setBusy = (sel, on3) => {
    if (!sel) return;
    const l3 = S.busySels ||= [], i3 = l3.indexOf(sel);
    if (on3) l3.push(sel);
    else if (i3 >= 0) l3.splice(i3, 1);
    else return;
    rerender();
  };
  S.mine = {};
  var getMine = (kind, rid) => S.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke("my_reactions", { ...prRef(), kind, id: +rid }).then((l3) => new Set(l3)).catch(() => {
    delete S.mine[`${kind}:${rid}`];
    return /* @__PURE__ */ new Set();
  }) : Promise.resolve(/* @__PURE__ */ new Set());
  async function toggleReact(kind, rid, c3) {
    const mine = (await getMine(kind, rid)).has(c3);
    const b2 = S.bundle, tgt = kind === "pr" ? b2.pull : [...b2.timeline, ...b2.review_comments].find((x2) => String(x2.id) === String(rid));
    const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null, base = prev ? prev[c3] || 0 : 0;
    const bump = (n2) => {
      if (tgt) tgt.reactions = { ...tgt.reactions || {}, [c3]: Math.max(0, base + n2) };
    };
    bump(mine ? -1 : 1);
    S.refreshing = true;
    rerender();
    const r3 = await act("react", { kind, id: +rid, content: c3 }, "react");
    if (r3 === void 0) {
      if (tgt && prev) tgt.reactions = prev;
      S.refreshing = false;
      rerender();
      return;
    }
    const set = await getMine(kind, rid);
    r3.added === false ? set.delete(c3) : set.add(c3);
    await refreshPr(kind === "pr" ? "" : rid);
  }
  async function act(action, args, key, inDialog = false) {
    const sel = S.lastSel ?? null;
    setBusy(sel, true);
    try {
      return await act2(action, args, key, inDialog);
    } finally {
      setBusy(sel, false);
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
      const r3 = action === "react" ? await tauri.invoke("toggle_reaction", { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri.invoke("pr_action", { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
      S.busy = "";
      if (action === "merge" || action === "review" && args.event === "APPROVE") confetti();
      return r3 ?? {};
    } catch (e3) {
      S.busy = "";
      S.actErr = { k: key, m: String(e3).replace(/^Error: /, "") };
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
  function editCommentDialog(c3, kind) {
    S.draft.editc = c3.body || "";
    S.dlg = { k: "editc", ok: async () => {
      const r3 = await act("edit_comment", { id: c3.id, kind, body: S.draft.editc ?? "" }, "editc", true);
      if (r3 === void 0) return;
      delete S.draft.editc;
      S.dlg = null;
      await refreshPr(c3.id);
    } };
    render();
  }
  function deleteCommentDialog(c3, kind) {
    S.dlg = { k: "delc", ok: async () => {
      const r3 = await act("delete_comment", { id: c3.id, kind }, "delc", true);
      if (r3 === void 0) return;
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function hideCommentDialog(c3) {
    const reasons = [["SPAM", "Spam"], ["ABUSE", "Abuse"], ["OFF_TOPIC", "Off-topic"], ["OUTDATED", "Outdated"], ["DUPLICATE", "Duplicate"], ["RESOLVED", "Resolved"]];
    S.hideReason = "OUTDATED";
    S.dlg = { k: "hidec", reasons, ok: async () => {
      const r3 = await act("minimize", { body: c3.node_id || "", content: S.hideReason || "OUTDATED" }, "hidec", true);
      if (r3 === void 0) return;
      S.fold["c:" + c3.id] = true;
      localStorage.setItem("fold", JSON.stringify(S.fold));
      S.dlg = null;
      await refreshPr();
    } };
    render();
  }
  function cmAction(id, root, how) {
    const b2 = S.bundle, c3 = [...b2.timeline, ...b2.review_comments].find((x2) => String(x2.id) === String(id)) || (String(b2.pull.id) === String(id) ? b2.pull : null);
    if (!c3) return;
    if (how === "link") return navigator.clipboard?.writeText(c3.html_url || "");
    if (how === "md") return navigator.clipboard?.writeText(c3.body || "");
    const kind = c3 === b2.pull ? "pr" : b2.review_comments.includes(c3) ? "review_comment" : "issue_comment";
    if (how === "issue") {
      const r3 = prRef().repo;
      return openExternal(`https://github.com/${r3}/issues/new?body=${encodeURIComponent(`Reference: ${c3.html_url || ""}

`)}`);
    }
    if (how === "edit") return kind === "pr" ? editPrDialog() : editCommentDialog(c3, kind);
    if (how === "hide") return hideCommentDialog(c3);
    if (how === "del") return deleteCommentDialog(c3, kind);
    const key = root ? "reply-" + root : "comment", q3 = (c3.body || "").split("\n").map((l3) => "> " + l3).join("\n");
    S.draft[key] = (S.draft[key] ? S.draft[key] + "\n\n" : "") + `@${(c3.user || c3.actor || {}).login || ""}

${q3}

`;
    saveDrafts();
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    syncDraft(key);
    setTimeout(() => scrollDraft(key), 50);
  }
  function addLocal(kind, r3, rootId) {
    const b2 = S.bundle;
    if (!b2 || !r3 || !r3.id || !r3.body_html) return false;
    if (kind === "commented") b2.timeline.push({ ...r3, event: "commented", actor: r3.user });
    else {
      const root = b2.review_comments.find((c3) => c3.id === rootId);
      if (!root) return false;
      b2.review_comments.push({ ...r3, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position });
    }
    qc.set(`${prRef().repo}#${prRef().number}`, b2);
    qc.invalidate(`${prRef().repo}#${prRef().number}`);
    qc.m.get(`${prRef().repo}#${prRef().number}`).at = Date.now() - 2e4;
    S.focus = "";
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    {
      setFlash("c-" + r3.id, { block: "start", pop: true });
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }
    return true;
  }
  async function rerequestReview(e3, login) {
    const b2 = e3.currentTarget;
    e3.stopPropagation();
    const sel = btnSel(b2);
    setBusy(sel, true);
    try {
      const r3 = await act("rerequest", { body: login }, "rerequest");
      if (r3 === void 0) {
        alert(S.actErr?.m || "Could not re-request review.");
        return;
      }
      await refreshPr();
    } finally {
      setBusy(sel, false);
    }
  }
  var composerOpen = () => S.busy === "comment" || S.cOpen === true;
  function toggleComposer() {
    setComposer(!composerOpen(), true);
  }
  function cbarKey(e3) {
    if (e3.key === "Enter" || e3.key === " ") {
      e3.preventDefault();
      e3.currentTarget.click();
    }
  }
  async function sendComment() {
    const r3 = await act("comment", { body: S.draft.comment || "" }, "comment");
    if (r3 === void 0) return;
    delete S.draft.comment;
    S.cOpen = false;
    if (!addLocal("commented", r3)) await refreshPr(r3.id);
  }
  function toggleClosed() {
    const closed = S.bundle.pull.state === "closed";
    confirmDlg(closed ? "Reopen this pull request?" : "Close this pull request?", closed ? "It will be open for review again." : "It will be closed without merging. You can reopen it later.", closed ? "Reopen" : "Close pull request", !closed, async () => {
      const r3 = await act(closed ? "reopen" : "close", {}, "close");
      if (r3 !== void 0) await refreshPr();
    });
  }
  function toggleMb(e3, k3) {
    if (e3.target.closest("#rerunck")) return;
    S.mbOpen = S.mbOpen || /* @__PURE__ */ new Set();
    S.mbOpen.has(k3) ? S.mbOpen.delete(k3) : S.mbOpen.add(k3);
    rerender();
  }
  async function rerunChecks(e3) {
    e3.stopPropagation();
    const urls = (S.bundle.checks || []).filter((c3) => checkState(c3) === "fail" && c3.url).map((c3) => c3.url);
    const sel = btnSel(e3.currentTarget);
    setBusy(sel, true);
    try {
      const r3 = await act("rerun", { extra: urls }, "rerun");
      if (r3 !== void 0) {
        S.actErr = null;
        await refreshPr();
      }
    } finally {
      setBusy(sel, false);
    }
  }
  async function updateBranch() {
    const r3 = await act("update_branch", {}, "update_branch");
    if (r3 !== void 0) await refreshPr();
  }
  async function markReady() {
    const r3 = await act("ready", {}, "ready");
    if (r3 !== void 0) await refreshPr();
  }
  function toDraft() {
    confirmDlg("Convert to draft?", "Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.", "Convert to draft", false, async () => {
      const r3 = await act("draft", {}, "merge");
      if (r3 !== void 0) await refreshPr();
    });
  }
  async function enableAuto() {
    const r3 = await act("automerge", { method: S.method || mergeMethod() }, "automerge");
    if (r3 !== void 0) await refreshPr();
  }
  async function disableAuto() {
    const r3 = await act("disable_automerge", {}, "automerge");
    if (r3 !== void 0) await refreshPr();
  }
  function doMerge() {
    const m3 = S.method || mergeMethod(), p3 = S.bundle.pull, names = { merge: "merge commit", squash: "squash and merge", rebase: "rebase and merge" };
    confirmDlg("Merge this pull request?", `${p3.head.label} will be merged into ${p3.base.label} using ${names[m3]}. This changes the repository and cannot be undone from here.`, "Merge", false, async () => {
      const r3 = await act("merge", { method: m3 }, "merge");
      if (r3 !== void 0) await refreshPr();
    });
  }
  function cmMenu(e3, btn) {
    e3.stopPropagation();
    const bb = S.bundle, cc = String(bb.pull.id) === String(btn.dataset.cm) ? bb.pull : [...bb.timeline, ...bb.review_comments].find((x2) => String(x2.id) === String(btn.dataset.cm));
    const isPr = cc === bb.pull, own = !!S.me && (cc?.user || cc?.actor)?.login === S.me;
    const r3 = btn.getBoundingClientRect(), id = +btn.dataset.cm, root = btn.dataset.root;
    openPop({ k: "cm", x: Math.min(r3.left - 100, innerWidth - 180), y: r3.bottom + 4, hr: own || !isPr && !!S.hasToken, edit: own, hide: !isPr && !!S.hasToken, del: own && !isPr, pick: (h3) => {
      closePop();
      cmAction(id, root, h3);
    } });
  }
  function reactAdd(e3, btn) {
    e3.stopPropagation();
    const r3 = btn.getBoundingClientRect(), kind = btn.dataset.rk, id = btn.dataset.rid;
    openPop({ k: "react", x: Math.min(r3.left, innerWidth - 300), y: Math.min(r3.bottom + 4, innerHeight - 60), pick: (c3) => {
      closePop();
      toggleReact(kind, id, c3);
    } });
  }
  function reactToggle(e3, kind, id, c3) {
    e3.stopPropagation();
    toggleReact(kind, id, c3);
  }
  async function threadAct(e3, node, how) {
    e3.stopPropagation();
    const b2 = S.bundle, root = Object.keys(b2.thread_ids || {}).find((k3) => b2.thread_ids[k3] === node);
    const ids = [Number(root), ...b2.review_comments.filter((c3) => String(c3.in_reply_to_id) === String(root)).map((c3) => c3.id)].filter(Boolean);
    const prev = [...b2.resolved_ids || []], res = how === "resolve";
    b2.resolved_ids = res ? [.../* @__PURE__ */ new Set([...prev, ...ids])] : prev.filter((x2) => !ids.includes(x2));
    rerender();
    const r3 = await act(how, { body: node }, "thread", true);
    if (r3 === void 0) {
      b2.resolved_ids = prev;
      rerender();
      alert(S.actErr?.m || "Could not update the thread.");
      return;
    }
    refreshPr();
  }
  function applySuggestion(e3, id) {
    e3.stopPropagation();
    const b2 = S.bundle, c3 = b2.review_comments.find((x2) => String(x2.id) === id);
    if (!c3) return;
    confirmDlg("Apply suggestion?", `This commits the change to ${c3.path} on ${b2.pull.head.ref}.`, "Commit suggestion", false, async () => {
      (S.applied ||= /* @__PURE__ */ new Set()).add(String(c3.id));
      rerender();
      const r3 = await act("suggest", { extra: { head_repo: b2.pull.head.repo.full_name, branch: b2.pull.head.ref, path: c3.path, line: c3.line, start_line: c3.start_line || null, text: sugOf(c3) } }, "sug", true);
      if (r3 === void 0) {
        S.applied.delete(String(c3.id));
        rerender();
        alert(S.actErr?.m || "Could not apply the suggestion.");
        return;
      }
      refreshPr().finally(() => {
        S.applied.delete(String(c3.id));
      });
    });
  }
  async function sendReply(id) {
    const r3 = await act("reply", { id: +id, body: S.draft["reply-" + id] || "" }, "reply-" + id);
    if (r3 === void 0) return;
    delete S.draft["reply-" + id];
    if (!addLocal("reply", r3, +id)) await refreshPr(r3.id);
  }
  function setDiffMode(m3) {
    S.diffMode = m3;
    localStorage.setItem("diffmode", m3);
    rerender();
  }
  function lcOpen(e3) {
    e3.stopPropagation();
    S.lcOpen = e3.currentTarget.dataset.lc;
    rerender();
    focusDraft("lc");
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
    focusDraft("lc");
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
    S.pending[pendKey()] = pendList().filter((c3) => String(c3.id) !== id);
    savePending();
    rerender();
  }
  var rerender = () => {
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var live = /* @__PURE__ */ new Map();
  var wantFocus = /* @__PURE__ */ new Set();
  editorMount.focus = (key) => {
    const ed = [...live].find(([, k3]) => k3 === key)?.[0];
    if (ed) ed.focus?.();
    else wantFocus.add(key);
  };
  var focusDraft = (key) => request("draft:focus:" + key);
  var scrollDraft = (key) => request("draft:scroll:" + key);
  var blurDraft = (key) => request("draft:blur:" + key);
  function syncDraft(key) {
    live.forEach((k3, ed) => {
      if (k3 === key) ed.setMarkdown?.(S.draft[key] || "");
    });
  }
  editorMount.preview = previewDraft;
  editorMount.fn = (host, key, ph) => {
    if (!window.createEditor) {
      host.innerHTML = '<div class="act-err">Editor failed to load.</div>';
      return () => {
      };
    }
    const send = () => request("draft:submit:" + key);
    let ed = null, gone = false;
    const mount = () => {
      if (gone) return;
      ed = window.createEditor(host, { value: S.draft[key] || "", placeholder: ph, people: peopleList(), onChange: (md) => {
        S.draft[key] = md;
        saveDrafts();
      }, onSubmit: send });
      live.set(ed, key);
      if (wantFocus.delete(key)) ed.focus?.();
    };
    const io = new IntersectionObserver((en) => {
      if (en.some((x2) => x2.isIntersecting)) {
        io.disconnect();
        mount();
      }
    }, { rootMargin: "300px" });
    io.observe(host.parentElement || host);
    return () => {
      gone = true;
      io.disconnect();
      if (ed) {
        live.delete(ed);
        ed.destroy();
      }
    };
  };

  // src/app/nav.ts
  async function loadRepos() {
    S.reposErr = "";
    S.repos = null;
    try {
      S.repos = await tauri.invoke("list_repos");
    } catch (e3) {
      S.reposErr = String(e3);
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
    } catch (e3) {
      S.error = String(e3);
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
      const r3 = tauri ? await tauri.invoke("list_prs", { repo: name, state: S.prState }) : [];
      S.prCache[ck] = { list: r3, at: Date.now() };
      if (S.repo === name) S.prs = r3;
    } catch (e3) {
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
      const m3 = String(input).match(/^([^#\s@\/]+\/[^#\s@]+)#(\d+)$/) || String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
      if (m3) {
        const ref = `${m3[1]}#${m3[2]}`;
        S.tabPending = ref;
        if (!S.tabs.some((t3) => t3.ref === ref)) {
          const old = S.recent.find((r3) => r3.ref === ref), item = { ref, title: old?.title || "Loading\u2026", state: old?.state || "open", icon: old?.icon || "git-pull-request", tab: restore || "conversation", dot: false };
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
    if (!keepTab && !restore) scrollMain(0);
    const focusNow = () => {
      if (!S.bundle || !S.focus) return false;
      if (S.tab !== "conversation" && S.tab !== "timeline") {
        S.tab = "conversation";
        render();
      }
      if (!hasComment(S.focus)) return false;
      setFlash(S.focus, { block: "start" });
      S.focus = "";
      S.keepScroll = true;
      render();
      S.keepScroll = false;
      return true;
    };
    const focused = focusNow();
    try {
      const got = hot ? mem.data : await qc.fetch(input, () => loadPr(input));
      if (stale_()) return;
      S.bundle = got;
      const p3 = got.pull, ref = `${p3.base.repo.full_name}#${p3.number}`, [st, ic] = stateOf(p3);
      if (!nav) {
        S.hist = S.hist.slice(0, S.hi + 1);
        S.hist.push(ref);
        S.hi = S.hist.length - 1;
      }
      S.recent = [{ ref, title: p3.title, state: st, icon: ic }, ...S.recent.filter((r3) => r3.ref !== ref)].slice(0, 30);
      localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
      localStorage.setItem("last", ref);
      remember(ref, p3);
      if (!keepTab || tabIdx() >= 0) tabPut(ref, p3, { at: fromTab, newTab });
      const ti = S.tabs.find((t3) => t3.ref === ref);
      if (ti) {
        ti.dot = false;
        saveTabs();
      }
      if (S.repo !== p3.base.repo.full_name) {
        S.repo = p3.base.repo.full_name;
        S.sideTab = "prs";
        setTimeout(loadPrs, 0);
      }
      if (S.draftRef !== ref) {
        saveDrafts();
        S.draftRef = ref;
        S.draft = { ...drafts[ref] || {} };
      }
    } catch (e3) {
      if (stale_()) return;
      if (!had) S.bundle = null;
      S.error = String(e3).replace(/^Error: /, "");
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
      const put = () => scrollMain(savedScroll);
      put();
      requestAnimationFrame(put);
      setTimeout(() => {
        put();
        S.restoring = false;
      }, 250);
    }
    if (!keepTab && !stale && !focused && !flashLive() && !tabSwitch) enterAnim();
    if (S.bundle && !stale && !keepTab && !focused) scrollMain(0);
    if (S.bundle && S.focus) {
      const id = S.focus;
      S.focus = "";
      if (S.tab !== "conversation" && S.tab !== "timeline") {
        S.tab = "conversation";
        render();
      }
      if (hasComment(id)) {
        setFlash(id, { block: "start" });
        S.keepScroll = true;
        render();
        S.keepScroll = false;
      }
    }
  }

  // src/app/listeners.ts
  if (window.__TAURI__ && window.__TAURI__.event) window.__TAURI__.event.listen("notif-click", (e3) => {
    const { ref, target } = e3.payload || {};
    if (!ref) return;
    S.nav = false;
    S.bell = false;
    S.focus = target || "";
    openPr(ref);
  });
  var goOffline = () => {
    S.offline = true;
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  var goOnline = () => {
    S.offline = false;
    if (S.bundle && S.view === "pr") openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true });
    else render();
  };

  // src/app/boot.tsx
  var q2 = new URLSearchParams(location.search);
  if (q2.get("mode")) S.mode = q2.get("mode");
  if (q2.get("tab")) S.tab = q2.get("tab");
  if (q2.get("split")) S.split = q2.get("split") === "1";
  if (tauri) tauri.invoke("has_token").then((v3) => {
    S.hasToken = v3;
    S.authChecked = true;
    render();
    if (v3) {
      loadRepos();
      loadProfile();
    }
  }).catch(() => {
    S.authChecked = true;
    S.hasToken = false;
    render();
  });
  setGlobals({
    pointerDown: (e3) => ripple(e3),
    clickCapture: (e3) => noteClick(e3),
    click: () => closePop(),
    mouseDown: (e3) => {
      menuAway(e3);
      notesAway(e3);
      bpAway(e3);
    },
    key: (e3) => {
      shortcut(e3);
      notesKey(e3);
      helpKey(e3);
      homeKey(e3);
    },
    focus: () => refocus(),
    online: () => goOnline(),
    offline: () => goOffline()
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
  var refocus = () => {
    const b2 = S.bundle;
    if (!tauri || !b2 || S.view !== "pr" || S.loading || S.refreshing) return;
    const k3 = `${b2.pull.base.repo.full_name}#${b2.pull.number}`;
    if (!qc.fresh(k3, 6e4)) openPr(k3, { nav: true, keepTab: true });
  };
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
      const u4 = await up.check();
      if (u4) {
        S.update = { version: u4.version, obj: u4 };
        render();
      }
    } catch {
    }
  }
  if (tauri) {
    setTimeout(checkUpdate, 6e3);
    setInterval(checkUpdate, 6 * 3600 * 1e3);
  }
  paintToTop();
})();
