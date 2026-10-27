"use strict";
(() => {
  // src/app/core.ts
  var tauri = window.__TAURI__ && window.__TAURI__.core;
  var $ = (s3, r3 = document) => r3.querySelector(s3);
  var qa = (s3, r3 = document) => [...r3.querySelectorAll(s3)];
  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var esc = (s3) => String(s3 ?? "").replace(/[&<>"']/g, (c3) => ESC[c3]);
  var icon = (name, size = 16, cls = "") => {
    const k3 = name + (size === 24 ? "-24" : "");
    return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[k3] || ""}</svg>`;
  };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function when(iso, lead = "on ") {
    const d3 = new Date(iso), now = /* @__PURE__ */ new Date(), diff = (+now - +d3) / 1e3;
    const abs = `${MONTHS[d3.getUTCMonth()]} ${d3.getUTCDate()}${d3.getUTCFullYear() !== now.getUTCFullYear() ? ", " + d3.getUTCFullYear() : ""}`;
    const title = d3.toUTCString();
    let t2;
    if (diff < 30 * 86400 && diff >= 0) {
      const n2 = (v2, u4) => `${v2} ${u4}${v2 === 1 ? "" : "s"} ago`;
      t2 = diff < 60 ? "now" : diff < 3600 ? n2(Math.floor(diff / 60), "minute") : diff < 86400 ? n2(Math.floor(diff / 3600), "hour") : n2(Math.floor(diff / 86400), "day");
      return `<span title="${title}">${t2}</span>`;
    }
    return `<span title="${title}">${lead}${abs}</span>`;
  }
  var user = (u4) => u4 ? `<a class="actor" href="${esc(u4.html_url)}">${esc(u4.login)}</a>` : '<span class="actor">ghost</span>';
  var avatar = (u4, s3 = 40) => `<img class="av" src="${esc(u4?.avatar_url || "")}${u4?.avatar_url ? (u4.avatar_url.includes("?") ? "&" : "?") + "s=" + s3 * 2 : ""}" width="${s3}" height="${s3}" alt="@${esc(u4?.login || "ghost")}" style="border-radius:50%;display:block">`;
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
    const n2 = S.notes.filter((x3) => !x3.read).length;
    if (tauri && n2 !== flags.lastUnread) {
      flags.lastUnread = n2;
      tauri.invoke("set_unread", { count: n2 }).catch(() => {
      });
    }
  }
  S.offline = typeof navigator !== "undefined" && navigator.onLine === false;
  var isOff = () => !!(S.offline || S.bundle && S.bundle._cached);
  var offlineBar = () => "";
  function applyMode() {
    const d3 = document.documentElement, dark = isDark();
    d3.setAttribute("data-color-mode", dark ? "dark" : "light");
    d3.setAttribute("data-light-theme", "light");
    d3.setAttribute("data-dark-theme", "dark");
    d3.setAttribute("data-t", dark ? "dark" : "light");
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
  function m(n2, l3) {
    for (var u4 in l3) n2[u4] = l3[u4];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l3, u4, t2) {
    var i3, r3, o3, e2 = {};
    for (o3 in u4) "key" == o3 ? i3 = u4[o3] : "ref" == o3 ? r3 = u4[o3] : e2[o3] = u4[o3];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e2[o3] && (e2[o3] = l3.defaultProps[o3]);
    return x(l3, e2, i3, r3, null);
  }
  function x(n2, t2, i3, r3, o3) {
    var e2 = { type: n2, props: t2, key: i3, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
    return null == o3 && null != l.vnode && l.vnode(e2), e2;
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
      var u4 = n2.__v, t2 = u4.__e, i3 = [], r3 = [], o3 = m({}, u4);
      o3.__v = u4.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u4, n2.__n, n2.__P.namespaceURI, 32 & u4.__u ? [t2] : null, i3, null == t2 ? $2(u4) : t2, !!(32 & u4.__u), r3), o3.__v = u4.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u4.__e = u4.__ = null, o3.__e != t2 && P(o3);
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
  function L(n2, l3, u4, t2, i3, r3, o3, e2, f4, c3, a3) {
    var s3, h3, p3, v2, y2, _3, g2 = t2 && t2.__k || w, m2 = l3.length;
    for (f4 = T(u4, l3, g2, f4, m2), s3 = 0; s3 < m2; s3++) null != (p3 = u4.__k[s3]) && (h3 = -1 != p3.__i && g2[p3.__i] || d, p3.__i = s3, _3 = q(n2, p3, h3, i3, r3, o3, e2, f4, c3, a3), v2 = p3.__e, p3.ref && h3.ref != p3.ref && (h3.ref && J(h3.ref, null, p3), a3.push(p3.ref, p3.__c || v2, p3)), null == y2 && null != v2 && (y2 = v2), 4 & p3.__u ? (f4 = j(p3, f4, n2), h3.__e && (h3.__e = null)) : "function" == typeof p3.type && void 0 !== _3 ? f4 = _3 : v2 && (f4 = v2.nextSibling), p3.__u &= -7);
    return u4.__e = y2, f4;
  }
  function T(n2, l3, u4, t2, i3) {
    var r3, o3, e2, f4, c3, a3 = u4.length, s3 = a3, h3 = 0;
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S2, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f4 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e2 = null, -1 != (c3 = o3.__i = O(o3, u4, f4, s3)) && (s3--, (e2 = u4[c3]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (s3) for (r3 = 0; r3 < a3; r3++) null != (e2 = u4[r3]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = $2(e2)), K(e2, e2));
    return t2;
  }
  function j(n2, l3, u4) {
    var t2, i3;
    if ("function" == typeof n2.type) {
      for (t2 = n2.__k, i3 = 0; t2 && i3 < t2.length; i3++) t2[i3] && (t2[i3].__ = n2, l3 = j(t2[i3], l3, u4));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !l3.parentNode && (l3 = $2(n2)), l3 = u4.insertBefore(n2.__e, l3 || null));
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function O(n2, l3, u4, t2) {
    var i3, r3, o3, e2 = n2.key, f4 = n2.type, c3 = l3[u4], a3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e2 || a3 && e2 == c3.key && f4 == c3.type) return u4;
    if (t2 > (a3 ? 1 : 0)) {
      for (i3 = u4 - 1, r3 = u4 + 1; i3 >= 0 || r3 < l3.length; ) if (null != (c3 = l3[o3 = i3 >= 0 ? i3-- : r3++]) && 0 == (2 & c3.__u) && e2 == c3.key && f4 == c3.type) return o3;
    }
    return -1;
  }
  function z(n2, l3, u4) {
    "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || _.test(l3) ? u4 : u4 + "px";
  }
  function N(n2, l3, u4, t2, i3) {
    var r3, o3;
    n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
    else {
      if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l3 in t2) u4 && l3 in u4 || z(n2.style, l3, "");
      if (u4) for (l3 in u4) t2 && u4[l3] == t2[l3] || z(n2.style, l3, u4[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(s, "$1")), o3 = l3.toLowerCase(), l3 = o3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? o3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u4, u4 ? t2 ? u4[a] = t2[a] : (u4[a] = h, n2.addEventListener(l3, r3 ? v : p, r3)) : n2.removeEventListener(l3, r3 ? v : p, r3);
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
        var t2 = this.l[u4.type + n2];
        if (null == u4[c]) u4[c] = h++;
        else if (u4[c] < t2[a]) return;
        return t2(l.event ? l.event(u4) : u4);
      }
    };
  }
  function q(n2, u4, t2, i3, r3, o3, e2, f4, c3, a3) {
    var s3, h3, p3, v2, y2, d3, _3, k3, x3, M, I2, P3, A3, H2, T3, j3, F = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t2.__u && (c3 = !!(32 & t2.__u), o3 = [f4 = u4.__e = t2.__e]), (s3 = l.__b) && s3(u4);
    n: if ("function" == typeof F) {
      h3 = e2.length;
      try {
        if (x3 = u4.props, M = F.prototype && F.prototype.render, I2 = (s3 = F.contextType) && i3[s3.__c], P3 = s3 ? I2 ? I2.props.value : s3.__ : i3, t2.__c ? k3 = (p3 = u4.__c = t2.__c).__ = p3.__E : (M ? u4.__c = p3 = new F(x3, P3) : (u4.__c = p3 = new C(x3, P3), p3.constructor = F, p3.render = Q), I2 && I2.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v2 = p3.__d = true, p3.__h = [], p3._sb = []), M && null == p3.__s && (p3.__s = p3.state), M && null != F.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, F.getDerivedStateFromProps(x3, p3.__s))), y2 = p3.props, d3 = p3.state, p3.__v = u4, v2) M && null == F.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x3 !== y2 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x3, P3), u4.__v == t2.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x3, p3.__s, P3)) {
            u4.__v != t2.__v && (p3.props = x3, p3.state = p3.__s, p3.__d = false), u4.__e = t2.__e, u4.__k = t2.__k, u4.__k.some(function(n3) {
              n3 && (n3.__ = u4);
            }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e2.push(p3), f4 = $2(t2);
            break n;
          }
          null != p3.componentWillUpdate && p3.componentWillUpdate(x3, p3.__s, P3), M && null != p3.componentDidUpdate && p3.__h.push(function() {
            p3.componentDidUpdate(y2, d3, _3);
          });
        }
        if (p3.context = P3, p3.props = x3, p3.__P = n2, p3.__e = false, A3 = l.__r, H2 = 0, M) p3.state = p3.__s, p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), w.push.apply(p3.__h, p3._sb), p3._sb = [];
        else do {
          p3.__d = false, A3 && A3(u4), s3 = p3.render(p3.props, p3.state, p3.context), p3.state = p3.__s;
        } while (p3.__d && ++H2 < 25);
        p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M && !v2 && null != p3.getSnapshotBeforeUpdate && (_3 = p3.getSnapshotBeforeUpdate(y2, d3)), T3 = null != s3 && s3.type === S2 && null == s3.key ? E(s3.props.children) : s3, f4 = L(n2, g(T3) ? T3 : [T3], u4, t2, i3, r3, o3, e2, f4, c3, a3), p3.base = u4.__e, u4.__u &= -161, p3.__h.length && e2.push(p3), k3 && (p3.__E = p3.__ = null);
      } catch (n3) {
        if (e2.length = h3, u4.__v = null, c3 || null != o3) {
          if (n3.then) {
            for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
            null != o3 && (o3[o3.indexOf(f4)] = null), u4.__e = f4;
          } else if (null != o3) for (j3 = o3.length; j3--; ) b(o3[j3]);
        } else u4.__e = t2.__e;
        null == u4.__k && (u4.__k = t2.__k || []), n3.then || B(u4), l.__e(n3, u4, t2);
      }
    } else null == o3 && u4.__v == t2.__v ? (u4.__k = t2.__k, u4.__e = t2.__e) : f4 = u4.__e = G(t2.__e, u4, t2, i3, r3, o3, e2, c3, a3);
    return (s3 = l.diffed) && s3(u4), 128 & u4.__u ? void 0 : f4;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u4, t2) {
    for (var i3 = 0; i3 < t2.length; i3++) J(t2[i3], t2[++i3], t2[++i3]);
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
  function G(u4, t2, i3, r3, o3, e2, f4, c3, a3) {
    var s3, h3, p3, v2, y2, w3, _3, m2 = i3.props || d, k3 = t2.props, x3 = t2.type;
    if ("svg" == x3 ? o3 = "http://www.w3.org/2000/svg" : "math" == x3 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s3 = 0; s3 < e2.length; s3++) if ((y2 = e2[s3]) && "setAttribute" in y2 == !!x3 && (x3 ? y2.localName == x3 : 3 == y2.nodeType)) {
        u4 = y2, e2[s3] = null;
        break;
      }
    }
    if (null == u4) {
      if (null == x3) return document.createTextNode(k3);
      u4 = document.createElementNS(o3, x3, k3.is && k3), c3 && (l.__m && l.__m(t2, e2), c3 = false), e2 = null;
    }
    if (null == x3) m2 === k3 || c3 && u4.data == k3 || (u4.data = k3);
    else {
      if (e2 = "textarea" == x3 && null != k3.defaultValue ? null : e2 && n.call(u4.childNodes), !c3 && null != e2) for (m2 = {}, s3 = 0; s3 < u4.attributes.length; s3++) m2[(y2 = u4.attributes[s3]).name] = y2.value;
      for (s3 in m2) y2 = m2[s3], "dangerouslySetInnerHTML" == s3 ? p3 = y2 : "children" == s3 || s3 in k3 || "value" == s3 && "defaultValue" in k3 || "checked" == s3 && "defaultChecked" in k3 || N(u4, s3, null, y2, o3);
      for (s3 in k3) y2 = k3[s3], "children" == s3 ? v2 = y2 : "dangerouslySetInnerHTML" == s3 ? h3 = y2 : "value" == s3 ? w3 = y2 : "checked" == s3 ? _3 = y2 : c3 && "function" != typeof y2 || m2[s3] === y2 || N(u4, s3, y2, m2[s3], o3);
      if (h3) c3 || p3 && (h3.__html == p3.__html || h3.__html == u4.innerHTML) || (u4.innerHTML = h3.__html), t2.__k = [];
      else if (p3 && (u4.innerHTML = ""), L("template" == t2.type ? u4.content : u4, g(v2) ? v2 : [v2], t2, i3, r3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o3, e2, f4, e2 ? e2[0] : i3.__k && $2(i3, 0), c3, a3), null != e2) for (s3 = e2.length; s3--; ) b(e2[s3]);
      c3 && "textarea" != x3 || (s3 = "value", "progress" == x3 && null == w3 ? u4.removeAttribute("value") : null != w3 && (w3 !== u4[s3] || "progress" == x3 && !w3 || "option" == x3 && w3 != m2[s3]) && N(u4, s3, w3, m2[s3], o3), s3 = "checked", null != _3 && _3 != u4[s3] && N(u4, s3, _3, m2[s3], o3));
    }
    return u4;
  }
  function J(n2, u4, t2) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u4 || (n2.__u = n2(u4));
      } else n2.current = u4;
    } catch (n3) {
      l.__e(n3, t2);
    }
  }
  function K(n2, u4, t2) {
    var i3, r3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || J(i3, null, u4)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u4);
      }
      i3.base = i3.__P = i3.__n = null;
    }
    if (i3 = n2.__k) for (r3 = 0; r3 < i3.length; r3++) i3[r3] && K(i3[r3], u4, t2 || "function" != typeof n2.type);
    t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l3, u4) {
    return this.constructor(n2, u4);
  }
  n = w.slice, l = { __e: function(n2, l3, u4, t2) {
    for (var i3, r3, o3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((r3 = i3.constructor) && null != r3.getDerivedStateFromError && (i3.setState(r3.getDerivedStateFromError(n2)), o3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t2 || {}), o3 = i3.__d), o3) return i3.__E = i3;
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

  // node_modules/preact-render-to-string/dist/index.module.js
  var r2 = /[\s\n\\/='"\0<>]/;
  var o2 = /^(xlink|xmlns|xml)([A-Z])/;
  var i2 = /^accessK|^auto[A-Z]|^cell|^ch|^col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z]/;
  var a2 = /^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;
  var c2 = /* @__PURE__ */ new Set(["draggable", "spellcheck"]);
  var s2 = /["&<]/;
  function l2(e2) {
    if (0 === e2.length || false === s2.test(e2)) return e2;
    for (var t2 = 0, n2 = 0, r3 = "", o3 = ""; n2 < e2.length; n2++) {
      switch (e2.charCodeAt(n2)) {
        case 34:
          o3 = "&quot;";
          break;
        case 38:
          o3 = "&amp;";
          break;
        case 60:
          o3 = "&lt;";
          break;
        default:
          continue;
      }
      n2 !== t2 && (r3 += e2.slice(t2, n2)), r3 += o3, t2 = n2 + 1;
    }
    return n2 !== t2 && (r3 += e2.slice(t2, n2)), r3;
  }
  var u2 = {};
  var f2 = /* @__PURE__ */ new Set(["animation-iteration-count", "border-image-outset", "border-image-slice", "border-image-width", "box-flex", "box-flex-group", "box-ordinal-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-order", "flex-positive", "flex-shrink", "flood-opacity", "font-weight", "grid-column", "grid-row", "line-clamp", "line-height", "opacity", "order", "orphans", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]);
  var p2 = /[A-Z]/g;
  function h2(e2) {
    var t2 = "";
    for (var n2 in e2) {
      var r3 = e2[n2];
      if (null != r3 && "" !== r3) {
        var o3 = "-" == n2[0] ? n2 : u2[n2] || (u2[n2] = n2.replace(p2, "-$&").toLowerCase()), i3 = ";";
        "number" != typeof r3 || o3.startsWith("--") || f2.has(o3) || (i3 = "px;"), t2 = t2 + o3 + ":" + r3 + i3;
      }
    }
    return t2 || void 0;
  }
  function d2() {
    this.__d = true;
  }
  function _2(e2, t2) {
    return { __v: e2, context: t2, props: e2.props, setState: d2, forceUpdate: d2, __d: true, __h: new Array(0) };
  }
  var k2;
  var w2;
  var x2;
  var C2;
  var A2 = {};
  var L2 = [];
  var E2 = Array.isArray;
  var T2 = Object.assign;
  var j2 = "";
  function D2(r3, o3, i3) {
    var a3 = l.__s;
    l.__s = true, k2 = l.__b, w2 = l.diffed, x2 = l.__r, C2 = l.unmount;
    var c3 = k(S2, null);
    c3.__k = [r3];
    try {
      var s3 = U(r3, o3 || A2, false, void 0, c3, false, i3);
      return E2(s3) ? s3.join(j2) : s3;
    } catch (e2) {
      if (e2.then) throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
      throw e2;
    } finally {
      l.__c && l.__c(r3, L2), l.__s = a3, L2.length = 0;
    }
  }
  function P2(e2, t2) {
    var n2, r3 = e2.type, o3 = true;
    return e2.__c ? (o3 = false, (n2 = e2.__c).state = n2.__s) : n2 = new r3(e2.props, t2), e2.__c = n2, n2.__v = e2, n2.props = e2.props, n2.context = t2, n2.__d = true, null == n2.state && (n2.state = A2), null == n2.__s && (n2.__s = n2.state), r3.getDerivedStateFromProps ? n2.state = T2({}, n2.state, r3.getDerivedStateFromProps(n2.props, n2.state)) : o3 && n2.componentWillMount ? (n2.componentWillMount(), n2.state = n2.__s !== n2.state ? n2.__s : n2.state) : !o3 && n2.componentWillUpdate && n2.componentWillUpdate(), x2 && x2(e2), n2.render(n2.props, n2.state, t2);
  }
  function U(t2, s3, u4, f4, p3, d3, v2) {
    if (null == t2 || true === t2 || false === t2 || t2 === j2) return j2;
    var m2 = typeof t2;
    if ("object" != m2) return "function" == m2 ? j2 : "string" == m2 ? l2(t2) : t2 + j2;
    if (E2(t2)) {
      var y2, g2 = j2;
      p3.__k = t2;
      for (var b2 = 0; b2 < t2.length; b2++) {
        var S3 = t2[b2];
        if (null != S3 && "boolean" != typeof S3) {
          var L3, D3 = U(S3, s3, u4, f4, p3, d3, v2);
          "string" == typeof D3 ? g2 += D3 : (y2 || (y2 = []), g2 && y2.push(g2), g2 = j2, E2(D3) ? (L3 = y2).push.apply(L3, D3) : y2.push(D3));
        }
      }
      return y2 ? (g2 && y2.push(g2), y2) : g2;
    }
    if (void 0 !== t2.constructor) return j2;
    t2.__ = p3, k2 && k2(t2);
    var F = t2.type, M = t2.props;
    if ("function" == typeof F) {
      var W, $3, z2, H2 = s3;
      if (F === S2) {
        if ("tpl" in M) {
          for (var N2 = j2, q3 = 0; q3 < M.tpl.length; q3++) if (N2 += M.tpl[q3], M.exprs && q3 < M.exprs.length) {
            var B2 = M.exprs[q3];
            if (null == B2) continue;
            "object" != typeof B2 || void 0 !== B2.constructor && !E2(B2) ? N2 += B2 : N2 += U(B2, s3, u4, f4, t2, d3, v2);
          }
          return N2;
        }
        if ("UNSTABLE_comment" in M) return "<!--" + l2(M.UNSTABLE_comment) + "-->";
        $3 = M.children;
      } else {
        if (null != (W = F.contextType)) {
          var I2 = s3[W.__c];
          H2 = I2 ? I2.props.value : W.__;
        }
        var O2 = F.prototype && "function" == typeof F.prototype.render;
        if (O2) $3 = P2(t2, H2), z2 = t2.__c;
        else {
          t2.__c = z2 = _2(t2, H2);
          for (var R = 0; z2.__d && R++ < 25; ) z2.__d = false, x2 && x2(t2), $3 = F.call(z2, M, H2);
          z2.__d = true;
        }
        if (null != z2.getChildContext && (s3 = T2({}, s3, z2.getChildContext())), O2 && l.errorBoundaries && (F.getDerivedStateFromError || z2.componentDidCatch)) {
          $3 = null != $3 && $3.type === S2 && null == $3.key && null == $3.props.tpl ? $3.props.children : $3;
          try {
            return U($3, s3, u4, f4, t2, d3, v2);
          } catch (e2) {
            return F.getDerivedStateFromError && (z2.__s = F.getDerivedStateFromError(e2)), z2.componentDidCatch && z2.componentDidCatch(e2, A2), z2.__d ? ($3 = P2(t2, s3), null != (z2 = t2.__c).getChildContext && (s3 = T2({}, s3, z2.getChildContext())), U($3 = null != $3 && $3.type === S2 && null == $3.key && null == $3.props.tpl ? $3.props.children : $3, s3, u4, f4, t2, d3, v2)) : j2;
          } finally {
            w2 && w2(t2), t2.__ = null, C2 && C2(t2);
          }
        }
      }
      $3 = null != $3 && $3.type === S2 && null == $3.key && null == $3.props.tpl ? $3.props.children : $3;
      try {
        var V2 = U($3, s3, u4, f4, t2, d3, v2);
        return w2 && w2(t2), t2.__ = null, l.unmount && l.unmount(t2), V2;
      } catch (n2) {
        if (!d3 && v2 && v2.onError) {
          var K2 = v2.onError(n2, t2, function(e2) {
            return U(e2, s3, u4, f4, t2, d3, v2);
          });
          if (void 0 !== K2) return K2;
          var G2 = l.__e;
          return G2 && G2(n2, t2), j2;
        }
        if (!d3) throw n2;
        if (!n2 || "function" != typeof n2.then) throw n2;
        return n2.then(function e2() {
          try {
            return U($3, s3, u4, f4, t2, d3, v2);
          } catch (n3) {
            if (!n3 || "function" != typeof n3.then) throw n3;
            return n3.then(function() {
              return U($3, s3, u4, f4, t2, d3, v2);
            }, e2);
          }
        });
      }
    }
    var J2, Q2 = "<" + F, X = j2;
    for (var Y in M) {
      var ee = M[Y];
      if ("function" != typeof ee || "class" === Y || "className" === Y) {
        switch (Y) {
          case "children":
            J2 = ee;
            continue;
          case "key":
          case "ref":
          case "__self":
          case "__source":
            continue;
          case "htmlFor":
            if ("for" in M) continue;
            Y = "for";
            break;
          case "className":
            if ("class" in M) continue;
            Y = "class";
            break;
          case "defaultChecked":
            Y = "checked";
            break;
          case "defaultSelected":
            Y = "selected";
            break;
          case "defaultValue":
          case "value":
            switch (Y = "value", F) {
              case "textarea":
                J2 = ee;
                continue;
              case "select":
                f4 = ee;
                continue;
              case "option":
                f4 != ee || "selected" in M || (Q2 += " selected");
            }
            break;
          case "dangerouslySetInnerHTML":
            X = ee && ee.__html;
            continue;
          case "style":
            "object" == typeof ee && (ee = h2(ee));
            break;
          case "acceptCharset":
            Y = "accept-charset";
            break;
          case "httpEquiv":
            Y = "http-equiv";
            break;
          default:
            if (o2.test(Y)) Y = Y.replace(o2, "$1:$2").toLowerCase();
            else {
              if (r2.test(Y)) continue;
              "-" !== Y[4] && !c2.has(Y) || null == ee ? u4 ? a2.test(Y) && (Y = "panose1" === Y ? "panose-1" : Y.replace(/([A-Z])/g, "-$1").toLowerCase()) : i2.test(Y) && (Y = Y.toLowerCase()) : ee += j2;
            }
        }
        null != ee && false !== ee && (Q2 = true === ee || ee === j2 ? Q2 + " " + Y : Q2 + " " + Y + '="' + ("string" == typeof ee ? l2(ee) : ee + j2) + '"');
      }
    }
    if (r2.test(F)) throw new Error(F + " is not a valid HTML tag name in " + Q2 + ">");
    if (X || ("string" == typeof J2 ? X = l2(J2) : null != J2 && false !== J2 && true !== J2 && (X = U(J2, s3, "svg" === F || "foreignObject" !== F && u4, f4, t2, d3, v2))), w2 && w2(t2), t2.__ = null, C2 && C2(t2), !X && Z.has(F)) return Q2 + "/>";
    var te = "</" + F + ">", ne = Q2 + ">";
    return E2(X) ? [ne].concat(X, [te]) : "string" != typeof X ? [ne, X, te] : ne + X + te;
  }
  var Z = /* @__PURE__ */ new Set(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);

  // src/components/html.tsx
  var OPEN = "\uE000";
  var CLOSE = "\uE001";
  var chunks = [];
  var Raw = (s3) => {
    chunks.push(s3);
    return `${OPEN}${chunks.length - 1}${CLOSE}`;
  };
  var html = (node) => {
    const out = D2(node).replace(/(\d+)/g, (_3, i3) => chunks[+i3]);
    chunks = [];
    return out;
  };

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f3 = 0;
  function u3(e2, t2, n2, o3, i3, u4) {
    t2 || (t2 = {});
    var a3, c3, p3 = t2;
    if ("ref" in p3) for (c3 in p3 = {}, t2) "ref" == c3 ? a3 = t2[c3] : p3[c3] = t2[c3];
    var l3 = { type: e2, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
    if ("function" == typeof e2 && (a3 = e2.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
    return l.vnode && l.vnode(l3), l3;
  }

  // src/components/Toolbar.tsx
  var NL = "\n  ";
  function Toolbar(p3) {
    const { icon: icon2 } = p3, label = p3.profile ? p3.profile.name || p3.profile.login : "";
    return /* @__PURE__ */ u3("header", { class: "toolbar", "data-tauri-drag-region": "", children: [
      NL,
      /* @__PURE__ */ u3("button", { class: "tb-btn nav-btn", id: "navbtn", title: "Show or hide the sidebar", children: Raw(icon2("three-bars")) }),
      /* @__PURE__ */ u3("div", { class: "tb-group", children: [
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "back", disabled: !p3.canBack, title: "Back (\u2318[)", children: Raw(icon2("chevron-left")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "fwd", disabled: !p3.canFwd, title: "Forward (\u2318])", children: Raw(icon2("chevron-right")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "reload", disabled: !p3.hasBundle, title: "Reload (\u2318R)", children: Raw(icon2("sync")) })
      ] }),
      NL,
      /* @__PURE__ */ u3("form", { id: "addr", class: "addr", children: [
        Raw(icon2("search")),
        /* @__PURE__ */ u3("input", { id: "addrinput", value: p3.prRef, placeholder: "Open a pull request: owner/repo#123 or URL  (\u2318L)", spellcheck: false, autocomplete: "off" })
      ] }),
      p3.update && /* @__PURE__ */ u3("button", { class: "upd", id: "upd", title: "Download and install the new version, then restart", children: [
        Raw(icon2("sync")),
        " ",
        p3.update.busy ? "Updating\u2026" : "Update to v" + p3.update.version
      ] }),
      NL,
      /* @__PURE__ */ u3("div", { class: "tb-group", children: [
        /* @__PURE__ */ u3("button", { class: `tb-btn off-ind ${p3.offline ? "on" : ""}`, id: "retry", "data-tip": "Offline \u2014 can't reach GitHub. Showing the saved copy. Click to retry.", "aria-label": "Offline, click to retry", tabindex: p3.offline ? 0 : -1, children: Raw(icon2("alert")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "external", disabled: !p3.hasBundle, title: "Open on github.com", children: Raw(icon2("link-external")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "newprbtn", title: "New pull request", children: Raw(icon2("plus")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn", id: "inboxbtn", title: "Inbox: PRs that need you", children: Raw(icon2("checklist")) }),
        /* @__PURE__ */ u3("button", { class: "tb-btn bell", id: "bell", title: "Notifications", children: [
          Raw(icon2("bell")),
          p3.unread > 0 && /* @__PURE__ */ u3("i", { class: "dot", children: p3.unread })
        ] }),
        /* @__PURE__ */ u3("button", { class: `theme-sw${p3.dark ? " dark" : ""}`, id: "mode", role: "switch", "aria-checked": p3.dark, title: `Switch to ${p3.dark ? "light" : "dark"} mode`, children: [
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
        ] }),
        p3.hasToken && p3.profile ? /* @__PURE__ */ u3("button", { class: "prof-btn", id: "profbtn", title: `${label} \u2014 account menu`, children: [
          /* @__PURE__ */ u3("img", { src: p3.avatar, alt: "" }),
          /* @__PURE__ */ u3("span", { children: label }),
          Raw(icon2("chevron-down", 12))
        ] }) : /* @__PURE__ */ u3("button", { class: "tb-btn", id: "signin", title: "Access token", children: Raw(icon2("key")) })
      ] })
    ] });
  }
  var toolbarHtml = (p3) => html(/* @__PURE__ */ u3(Toolbar, { ...p3 }));

  // src/components/SideTabs.tsx
  var tabClass = (on) => on ? "on" : "";
  function SideTabs({ active, hasRepo }) {
    return /* @__PURE__ */ u3("div", { class: "sb-tabs", children: [
      /* @__PURE__ */ u3("button", { "data-side": "repos", class: tabClass(active === "repos"), children: "Repos" }),
      hasRepo && /* @__PURE__ */ u3("button", { "data-side": "prs", class: tabClass(active === "prs"), children: "PRs" }),
      /* @__PURE__ */ u3("button", { "data-side": "recent", class: tabClass(active === "recent"), children: "Recent" })
    ] });
  }
  var sideTabsHtml = (props) => html(/* @__PURE__ */ u3(SideTabs, { ...props }));

  // src/app/prlist.ts
  var PSORT = { updated: "Recently updated", created: "Newest", oldest: "Oldest", number: "Number", title: "Title A\u2013Z", author: "Author" };
  var PGROUP = { none: "No grouping", status: "Status", author: "Author", label: "Label", base: "Base branch" };
  var prStatus = (p3) => p3.merged_at ? "merged" : p3.state === "closed" ? "closed" : p3.draft ? "draft" : "open";
  var PICON = { open: "git-pull-request", draft: "git-pull-request-draft", merged: "git-merge", closed: "git-pull-request-closed" };
  function prSide() {
    const cur = S.bundle && S.view === "pr" ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "";
    const f4 = S.pf.toLowerCase();
    const sel = (id, opts, v2) => `<select class="input sb-sel" id="${id}">${Object.entries(opts).map(([k3, t2]) => `<option value="${k3}"${k3 === v2 ? " selected" : ""}>${t2}</option>`).join("")}</select>`;
    const head = `<div class="sb-repo"><button class="fold-btn" data-side="repos" title="All repositories">${icon("chevron-left")}</button><b title="${esc(S.repo)}">${esc(S.repo)}</b></div>
  <div class="seg sb-seg">${["open", "closed", "all"].map((s3) => `<button data-sps="${s3}" class="${S.prState === s3 ? "on" : ""}">${s3[0].toUpperCase() + s3.slice(1)}</button>`).join("")}</div>
  <input class="input sb-filter" id="prfilter" placeholder="Filter by title, #, author, label\u2026" value="${esc(S.pf)}">
  <div class="sb-ctl"><label>Sort${sel("prsort", PSORT, S.psort)}</label><label>Group${sel("prgroup", PGROUP, S.pgroup)}</label></div>`;
    if (!S.prs) return head + '<div class="sb-empty">Loading pull requests\u2026</div>';
    const list = S.prs.filter((p3) => !f4 || `#${p3.number} ${p3.title} ${p3.user.login} ${p3.head?.ref || ""} ${(p3.labels || []).map((l3) => l3.name).join(" ")}`.toLowerCase().includes(f4));
    const sorts = { updated: (a3, b2) => b2.updated_at.localeCompare(a3.updated_at), created: (a3, b2) => b2.created_at.localeCompare(a3.created_at), oldest: (a3, b2) => a3.created_at.localeCompare(b2.created_at), number: (a3, b2) => b2.number - a3.number, title: (a3, b2) => a3.title.localeCompare(b2.title), author: (a3, b2) => a3.user.login.localeCompare(b2.user.login) || b2.number - a3.number };
    const by = sorts[S.psort];
    list.sort(by);
    const row = (p3) => {
      const st = prStatus(p3), ref = `${S.repo}#${p3.number}`;
      return `<a class="rc ${ref === cur ? "on" : ""}" data-open="${esc(ref)}"><span class="rc-i ${st}">${icon(PICON[st])}</span><span class="rc-t"><b>${esc(p3.title)}</b><i>#${p3.number} \xB7 ${esc(p3.user.login)} \xB7 ${when(p3.updated_at).replace(/<\/?span[^>]*>/g, "")}</i></span></a>`;
    };
    if (!list.length) return head + `<div class="sb-empty">${S.pf ? "No matches." : "No pull requests."}</div>`;
    if (S.pgroup === "none") return head + `<div class="sb-count">${list.length} pull request${list.length === 1 ? "" : "s"}</div>` + list.map(row).join("");
    const groups = /* @__PURE__ */ new Map(), put = (k3, p3) => (groups.get(k3) || groups.set(k3, []).get(k3)).push(p3);
    list.forEach((p3) => {
      if (S.pgroup === "status") put({ open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }[prStatus(p3)], p3);
      else if (S.pgroup === "author") put(p3.user.login, p3);
      else if (S.pgroup === "base") put(p3.base?.ref || "\u2014", p3);
      else if ((p3.labels || []).length) p3.labels.forEach((l3) => put(l3.name, p3));
      else put("No label", p3);
    });
    const order = S.pgroup === "status" ? ["Open", "Draft", "Merged", "Closed"] : [...groups.keys()].sort((a3, b2) => +(a3 === "No label") - +(b2 === "No label") || a3.localeCompare(b2));
    return head + order.filter((k3) => groups.has(k3)).map((k3) => {
      const key = "pg:" + S.pgroup + ":" + k3;
      return `<div class="pg${folded(key)}"><div class="pg-h" data-fold="${esc(key)}">${icon(isFolded(key) ? "chevron-right" : "chevron-down")}<span>${esc(k3)}</span><i>${groups.get(k3).length}</i></div><div class="pg-b">${groups.get(k3).map(row).join("")}</div></div>`;
    }).join("");
  }
  function prFiltered() {
    const f4 = S.pf.toLowerCase();
    const list = (S.prs || []).filter((p3) => (!f4 || `#${p3.number} ${p3.title} ${p3.user.login} ${p3.head?.ref || ""} ${(p3.labels || []).map((l3) => l3.name).join(" ")}`.toLowerCase().includes(f4)) && (!S.pAuthor || p3.user.login === S.pAuthor) && (!S.pLabel || (p3.labels || []).some((l3) => l3.name === S.pLabel)) && (!S.pStatus || prStatus(p3) === S.pStatus));
    const cmps = { updated: (a3, b2) => b2.updated_at.localeCompare(a3.updated_at), created: (a3, b2) => b2.created_at.localeCompare(a3.created_at), oldest: (a3, b2) => a3.created_at.localeCompare(b2.created_at), number: (a3, b2) => b2.number - a3.number, title: (a3, b2) => a3.title.localeCompare(b2.title), author: (a3, b2) => a3.user.login.localeCompare(b2.user.login) || b2.number - a3.number };
    return list.sort(cmps[S.psort]);
  }
  function prFilterBar() {
    if (!S.prs) return "";
    const authors = [...new Set(S.prs.map((p3) => p3.user.login))].sort((a3, b2) => a3.localeCompare(b2));
    const labels = [...new Set(S.prs.flatMap((p3) => (p3.labels || []).map((l3) => l3.name)))].sort((a3, b2) => a3.localeCompare(b2));
    const opt = (arr, v2, all) => `<option value="">${all}</option>` + arr.map((x3) => `<option value="${esc(x3)}"${x3 === v2 ? " selected" : ""}>${esc(x3)}</option>`).join("");
    const sts = { open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" };
    const n2 = prFiltered().length, active = S.pf || S.pAuthor || S.pLabel || S.pStatus;
    return `<div class="prl-filters"><span class="pf-search">${icon("search")}<input class="input" id="mainfilter" placeholder="Filter by title, #, author, branch, label\u2026" value="${esc(S.pf)}" spellcheck="false"></span>
  <select class="input" id="pfauthor">${opt(authors, S.pAuthor, "Author: all")}</select>
  <select class="input" id="pflabel">${opt(labels, S.pLabel, "Label: all")}</select>
  <select class="input" id="pfstatus"><option value="">Status: any</option>${Object.entries(sts).map(([k3, t2]) => `<option value="${k3}"${k3 === S.pStatus ? " selected" : ""}>${t2}</option>`).join("")}</select>
  <select class="input" id="pfsort">${Object.entries(PSORT).map(([k3, t2]) => `<option value="${k3}"${k3 === S.psort ? " selected" : ""}>Sort: ${t2}</option>`).join("")}</select>
  <span class="pf-count">${n2} of ${S.prs.length}</span>${active ? '<button class="btn" id="pfclear">Clear</button>' : ""}</div>`;
  }
  function prList() {
    const head = `<div class="prl-head"><div><span class="repo-ic">${icon("repo", 16)}</span> <b>${esc(S.repo)}</b></div><div class="seg">${["open", "closed", "all"].map((s3) => `<button data-ps="${s3}" class="${S.prState === s3 ? "on" : ""}">${s3[0].toUpperCase() + s3.slice(1)}</button>`).join("")}</div></div>`;
    let body;
    const pb = pushBanners(S.repo);
    if (S.error) body = `<div class="err" style="padding:16px">${esc(S.error)}</div>`;
    else if (!S.prs) body = '<div class="spinner" style="margin:48px auto">Loading pull requests\u2026</div>';
    else body = prFiltered().map((p3) => {
      const st = p3.merged_at ? ["merged", "git-merge"] : p3.state === "closed" ? ["closed", "git-pull-request-closed"] : p3.draft ? ["draft", "git-pull-request-draft"] : ["open", "git-pull-request"];
      const lbl = (p3.labels || []).map((l3) => `<span class="pill-label" style="background:#${esc(l3.color)}33;color:#${esc(l3.color)};border-color:#${esc(l3.color)};margin:0 0 0 4px">${esc(l3.name)}</span>`).join("");
      return `<a class="prl-row" data-open="${esc(S.repo)}#${p3.number}"><span class="rc-i ${st[0]}">${icon(st[1])}</span><span class="prl-main"><b>${esc(p3.title)}</b>${lbl}<i>#${p3.number} ${p3.merged_at ? "merged" : p3.state === "closed" ? "closed" : "opened"} ${when(p3.merged_at || p3.closed_at || p3.created_at).replace(/<\/?span[^>]*>/g, "")} by ${esc(p3.user.login)}</i></span><img src="${esc(p3.user.avatar_url)}&s=40" width="20" height="20" style="border-radius:50%"></a>`;
    }).join("") || `<div class="diff-empty">${S.prs.length ? "No pull requests match the filters." : "No pull requests."}</div>`;
    return `<div class="pr-page"><div class="repoline" style="padding-bottom:16px"></div>${pb}<div class="prl">${head}${prFilterBar()}${body}</div></div>`;
  }
  function crumbs(repo, trail = [], extra = "") {
    const sep = `<span class="crumb-sep">${icon("chevron-right", 12)}</span>`;
    const homeCur = !repo && !trail.length;
    const parts = [homeCur ? `<span class="crumb cur home">${icon("home", 14)}<span>Home</span></span>` : `<a class="crumb" data-home="1" title="Home">${icon("home", 14)}<span>Home</span></a>`];
    if (repo) {
      const [owner, name] = repo.split("/");
      parts.push(`<span class="crumb-grp"><a class="crumb" data-owner="${esc(owner)}" title="Repositories of ${esc(owner)}">${esc(owner)}</a><span class="crumb-slash">/</span><a class="crumb strong" data-repo="${esc(repo)}" title="All pull requests in ${esc(repo)}">${esc(name)}</a></span>`);
    }
    trail.forEach((t2, i3) => parts.push(i3 === trail.length - 1 ? `<span class="crumb cur">${esc(t2.t)}</span>` : `<a class="crumb" ${t2.repo ? `data-repo="${esc(t2.repo)}"` : ""}>${esc(t2.t)}</a>`));
    return `<nav class="repoline crumbs" aria-label="Breadcrumb">${parts.join(sep)}${extra}</nav>`;
  }
  function repoHeader(p3) {
    const r3 = p3.base.repo;
    return crumbs(r3.full_name, [{ t: "Pull requests", repo: r3.full_name }, { t: `#${p3.number}` }], `<a class="crumb gh" href="${esc(r3.html_url)}" data-ext title="Open on GitHub">${icon("link-external", 12)}</a>${S.refreshing ? '<span class="stale">Refreshing\u2026</span>' : ""}`);
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
  function tabPut(ref, p3, opts = {}) {
    const [state, ic] = stateOf(p3), item = { ref, title: p3.title, state, icon: ic, tab: S.tab, dot: false };
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
  function closeTab(i3) {
    const t2 = S.tabs[i3];
    if (!t2) return;
    S.alive.delete(t2.ref);
    const was = t2.ref === curRef();
    S.closed = [{ ref: t2.ref, tab: t2.tab }, ...S.closed.filter((c3) => c3.ref !== t2.ref)].slice(0, 10);
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
    openTab(n2.ref);
  }
  function tabStrip() {
    const cur = S.tabPending || curRef();
    const tabs = S.tabs.map((t2, i3) => `<div class="ptab ${t2.ref === cur ? "on" : ""}" data-tab="${i3}" title="${esc(t2.ref + " \xB7 " + t2.title)}"><span class="rc-i ${t2.state}">${icon(t2.icon)}</span><span class="pt-t"><i>${esc(t2.ref.split("/").pop())}</i> ${esc(t2.title)}</span>${t2.dot ? '<span class="pt-dot"></span>' : ""}<button class="pt-x" data-tabx="${i3}" aria-label="Close tab">${icon("x")}</button></div>`).join("");
    const open = new Set(S.tabs.map((t2) => t2.ref));
    const recents = S.recent.filter((r3) => !open.has(r3.ref)).slice(0, 8);
    const menu = S.tabMenu ? `<div class="pt-menu"><a data-tabhome>${icon("home")} Home</a>${recents.length ? "<h6>Recent</h6>" : ""}${recents.map((r3) => `<a data-tabnew="${esc(r3.ref)}"><span class="rc-i ${r3.state}">${icon(r3.icon)}</span><span class="pt-mt"><i>${esc(r3.ref)}</i> ${esc(r3.title)}</span></a>`).join("")}${S.closed.length ? `<h6>Closed</h6><a data-tabreopen>${icon("clock")} Reopen ${esc(S.closed[0].ref)} <kbd>\u2318\u21E7T</kbd></a>` : ""}</div>` : "";
    return `<div class="ptabs">${tabs}<button class="pt-add" id="tabadd" title="New tab (\u2318T)" aria-label="New tab">${icon("plus")}${S.tabs.length < 2 ? "<span>New tab</span>" : ""}</button>${menu}</div>`;
  }
  function toolbar() {
    const b2 = S.bundle, pr = S.profile;
    return toolbarHtml({
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
      icon
    });
  }
  function sideRecent() {
    const tabs = sideTabsHtml({ active: S.sideTab, hasRepo: !!S.repo });
    let list;
    if (S.sideTab === "prs" && S.repo) {
      list = prSide();
    } else if (S.sideTab === "recent") {
      list = S.recent.map((r3) => `<a class="rc ${S.bundle && r3.ref === `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` ? "on" : ""}" data-open="${esc(r3.ref)}"><span class="rc-i ${r3.state}">${icon(r3.icon)}</span><span class="rc-t"><b>${esc(r3.title)}</b><i>${esc(r3.ref)}</i></span><button class="rc-x" data-rm="${esc(r3.ref)}" title="Remove">${icon("x")}</button></a>`).join("") || '<div class="sb-empty">Pull requests you open appear here.</div>';
    } else if (!S.hasToken) {
      list = '<div class="sb-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="sb-btn" id="addtoken">Add token</button></div>';
    } else if (S.reposErr) {
      list = `<div class="sb-empty err">${esc(S.reposErr)}</div>`;
    } else if (!S.repos) {
      list = '<div class="sb-empty">Loading repositories\u2026</div>';
    } else {
      const f4 = S.repoFilter.toLowerCase();
      list = `<input class="input sb-filter" id="repofilter" placeholder="Find a repository\u2026" value="${esc(S.repoFilter)}">` + (S.repos.filter((r3) => r3.full_name.toLowerCase().includes(f4)).map((r3) => `<a class="rc ${S.repo === r3.full_name ? "on" : ""}" data-repo="${esc(r3.full_name)}"><span class="rc-i ${r3.private ? "closed" : ""}" style="color:var(--fgColor-muted)">${icon(r3.private ? "lock" : "repo")}</span><span class="rc-t"><b>${esc(r3.full_name.split("/")[1])}</b><i>${esc(r3.full_name.split("/")[0])}</i></span></a>`).join("") || '<div class="sb-empty">No matches.</div>');
    }
    return `<aside class="sidebar">${tabs}<div class="sb-list">${list}</div><div class="sb-foot">${S.hasToken ? "Signed in with token" : "Anonymous \xB7 60 requests/hour"}</div></aside>`;
  }

  // src/app/data.ts
  var snap = (p3) => ({ commits: p3.commits, comments: p3.comments, rc: p3.review_comments, state: p3.merged ? "merged" : p3.state });
  var seen = load("seen", {});
  function noteAdd(ref, title, text, target = "") {
    {
      const t2 = S.tabs.find((x3) => x3.ref === ref);
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
    const out = [], d3 = (a3, b2) => b2 - a3;
    if (d3(was.commits, now.commits) > 0) out.push(`${d3(was.commits, now.commits)} new commit${d3(was.commits, now.commits) > 1 ? "s" : ""}`);
    if (d3(was.comments, now.comments) > 0) out.push(`${d3(was.comments, now.comments)} new comment${d3(was.comments, now.comments) > 1 ? "s" : ""}`);
    if (d3(was.rc, now.rc) > 0) out.push(`${d3(was.rc, now.rc)} new review comment${d3(was.rc, now.rc) > 1 ? "s" : ""}`);
    if (was.state !== now.state) out.push(`now ${now.state}`);
    const last = fresh.filter((f4) => !was.at || f4.created_at > was.at).sort((x3, y2) => x3.created_at < y2.created_at ? -1 : 1).pop();
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
      const e2 = this.m.get(k3);
      return !!e2 && Date.now() - e2.at < ms;
    },
    set(k3, data) {
      this.m.set(k3, { data, at: Date.now() });
    },
    invalidate(k3) {
      const e2 = this.m.get(k3);
      if (e2) e2.at = 0;
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
    const refs = S.hasToken ? [.../* @__PURE__ */ new Set([...cur ? [cur] : [], ...S.tabs.map((t2) => t2.ref), ...S.recent.slice(0, 8).map((r3) => r3.ref), ...S.watch || []])].slice(0, 40) : cur ? [cur] : [];
    for (const ref of refs) {
      const m2 = ref.match(/^(.+)#(\d+)$/);
      if (!m2) continue;
      try {
        const p3 = await tauri.invoke("check_pr", { repo: m2[1], number: +m2[2], since: seen[ref]?.at || null });
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
  var ago = (t2) => {
    const m2 = Math.max(1, Math.round((Date.now() - +new Date(t2)) / 6e4));
    return m2 < 60 ? `${m2} minute${m2 === 1 ? "" : "s"} ago` : `${Math.round(m2 / 60)} hour${m2 >= 90 ? "s" : ""} ago`;
  };
  var pushList = (repo) => Object.entries(S.pushes).filter(([r3]) => !repo || r3 === repo).flatMap(([, l3]) => l3).filter((p3) => !pushDis[`${p3.repo}@${p3.branch}@${p3.at}`] && Date.now() - +new Date(p3.at) < 6 * 36e5);
  function pushBanners(repo) {
    return pushList(repo).slice(0, 3).map((p3) => `<div class="push-banner">${icon("git-branch")}<span><b>${esc(p3.branch)}</b> had recent pushes ${ago(p3.at)}${repo ? "" : ` <i>\xB7 ${esc(p3.repo)}</i>`}</span><span class="sp"></span><button class="btn small primary" data-compare="${esc(p3.repo)}@${esc(p3.branch)}">Compare &amp; pull request</button><button class="push-x" data-pdismiss="${esc(`${p3.repo}@${p3.branch}@${p3.at}`)}" title="Dismiss">${icon("x")}</button></div>`).join("");
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
  function notePanel() {
    const rows = S.notes.map((n2) => `<a class="note ${n2.read ? "" : "new"}" data-open="${esc(n2.ref)}" data-target="${esc(n2.target || "")}"><b>${esc(n2.title)}</b><span>${esc(n2.text)}</span><i>${esc(n2.ref)} \xB7 ${when(n2.at).replace(/<\/?span[^>]*>/g, "")}</i></a>`).join("") || '<div class="note-empty">No notifications yet. New comments, commits and reviews on PRs you opened will show up here.</div>';
    return `<div class="note-panel${S.bell ? " open" : ""}"><div class="note-h"><b>Notifications</b><span><button id="noteall">View all</button> <button id="notecheck">Check now</button> <button id="noteclear">Clear all</button></span></div>${rows}</div>`;
  }

  // src/app/comments.ts
  function stateOf(p3) {
    if (p3.merged) return ["merged", "git-merge", "Merged"];
    if (p3.state === "closed") return ["closed", "git-pull-request-closed", "Closed"];
    if (p3.draft) return ["draft", "git-pull-request-draft", "Draft"];
    return ["open", "git-pull-request", "Open"];
  }
  function prHeader(b2) {
    const p3 = b2.pull, [st, ic, label] = stateOf(p3), n2 = p3.number;
    const commentsTotal = p3.comments + p3.review_comments + b2.timeline.filter((e2) => e2.event === "reviewed").length;
    const sq = (() => {
      const t2 = p3.additions + p3.deletions || 1;
      const small = t2 <= 5;
      const a3 = small ? p3.additions : Math.round(p3.additions / t2 * 5);
      const d3 = small ? p3.deletions : 5 - a3;
      const arr = [];
      for (let i3 = 0; i3 < 5; i3++) arr.push(i3 < a3 ? "a" : i3 < a3 + d3 ? "d" : "");
      return arr.map((c3) => `<i class="${c3}"></i>`).join("");
    })();
    const who = st === "merged" ? `<a class="author" style="text-decoration:underline;text-underline-offset:2px" href="${esc(p3.merged_by.html_url)}">${esc(p3.merged_by.login)}</a> merged ${p3.commits} commit${p3.commits === 1 ? "" : "s"} into` : `<a class="author" href="${esc(p3.user.html_url)}">${esc(p3.user.login)}</a> wants to merge ${p3.commits} commit${p3.commits === 1 ? "" : "s"} into`;
    const at = st === "merged" ? p3.merged_at : st === "closed" ? p3.closed_at : p3.created_at;
    const splitOk = S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline";
    const tabs = [["conversation", "comment-discussion", "Conversation", commentsTotal + 0], ["timeline", "clock", "Timeline", b2.timeline.length], ["commits", "git-commit", "Commits", p3.commits], ["checks", "checklist", "Checks", (b2.checks || []).length], ["files", "file-diff", "Files changed", p3.changed_files]];
    return `<div class="pr-title-area"><h1 class="pr-title"><span>${esc(p3.title)}</span><span class="num">#${n2}</span>${p3.state === "open" && !p3.merged ? `<button class="copy-btn" id="editpr" title="Edit title and description">${icon("pencil")}</button>` : ""}</h1>
  <div class="pr-meta"><span class="state-pill state-${st}">${icon(ic)} ${label}</span><span>${who}</span> <span class="branch" title="${esc(p3.base.repo.full_name)}:${esc(p3.base.ref)}">${esc(p3.base.label)}</span> <span>from</span> <span class="branch">${esc(p3.head.label)}</span><button class="copy-btn" id="copybranch" aria-label="Copy head branch name to clipboard">${icon("copy")}</button><span>${when(at)}</span></div></div>
  <div class="pr-tabs"><span class="mini" title="${esc(p3.title)}"><b>#${n2}</b> ${esc(p3.title)}</span><nav>${tabs.map(([k3, i3, t2, c3]) => `<a data-tab="${k3}" class="${S.tab === k3 || k3 === "commits" && false ? "sel" : ""}">${icon(i3)}${t2}<span class="counter">${c3}</span></a>`).join("")}</nav>
  <div class="tools"><button class="split-btn" id="review" title="Submit a review">${icon("eye")}<span>Review</span></button><button class="split-btn ${S.hide.side || S.split ? "" : "on"}" id="sidetoggle" title="Show or hide the details panel" ${S.tab !== "conversation" || S.split ? "disabled" : ""} style="${S.tab !== "conversation" ? "visibility:hidden" : ""}">${icon("sidebar-expand")}<span>Details</span></button><button class="split-btn ${splitOk && S.split ? "on" : ""}" id="split" title="${splitOk ? "Split view: commits beside conversation" : "Split view is available on the Conversation and Commits tabs"}" ${splitOk ? "" : "disabled"}>${icon("columns")}<span>Split view</span></button><div class="diffstat"><span class="add">+${p3.additions}</span><span class="del">-${p3.deletions}</span><span class="sq">${sq}</span></div></div></div>`;
  }
  var isFolded = (k3, def = false) => k3 in S.fold ? S.fold[k3] : def;
  var folded = (k3, def = false) => isFolded(k3, def) ? " folded" : "";
  var foldBtn = (k3, title = "Collapse / expand", def = false) => `<button class="fold-btn" data-fold="${esc(k3)}" data-def="${def ? 1 : 0}" title="${title}">${icon(isFolded(k3, def) ? "chevron-right" : "chevron-down")}</button>`;
  function reactionsHtml(r3, kind, id) {
    r3 = r3 || {};
    const items = REACTS.filter(([k3]) => (r3?.[k3] ?? 0) > 0).map(([k3, e2]) => `<span class="reaction${kind && id ? " rc-btn" : ""}" ${kind && id ? `data-rck="${kind}" data-rcid="${id}" data-rcc="${k3}" title="Click to add or remove your reaction"` : ""}><span class="e">${e2}</span><span>${r3?.[k3]}</span></span>`);
    const add = kind && id ? `<span class="react-wrap"><button class="react-add" data-rk="${kind}" data-rid="${id}" title="Add reaction">${icon("smiley")}</button></span>` : "";
    return items.length || add ? `<div class="reactions">${items.join("")}${add}</div>` : "";
  }
  var liveTasks = (h3) => S.hasToken ? h3.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m2) => m2.replace(/\sdisabled(="[^"]*")?/g, "")) : h3;
  function toggleTask(body, n2) {
    let i3 = -1, fence = false;
    return body.split("\n").map((l3) => {
      if (/^\s*(```|~~~)/.test(l3)) {
        fence = !fence;
        return l3;
      }
      if (fence) return l3;
      return l3.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/, (m2, a3, x3, z2) => ++i3 === n2 ? a3 + (x3 === " " ? "x" : " ") + z2 : m2);
    }).join("\n");
  }
  document.addEventListener("click", async (e2) => {
    const cb = e2.target.closest("input.task-list-item-checkbox");
    if (!cb || cb.disabled || !S.bundle) return;
    const box = cb.closest(".tl-comment"), md = cb.closest(".markdown-body");
    if (!box || !md) return;
    const id = box.id.replace(/^c-/, ""), b2 = S.bundle;
    const c3 = String(b2.pull.id) === id ? b2.pull : b2.timeline.find((x3) => String(x3.id) === id);
    if (!c3) return;
    const n2 = [...md.querySelectorAll("input.task-list-item-checkbox")].indexOf(cb), body = toggleTask(c3.body || "", n2);
    if (body === (c3.body || "")) {
      e2.preventDefault();
      return;
    }
    const on = cb.checked;
    const r3 = c3 === b2.pull ? await act("edit", { body, extra: {} }, "task", true) : await act("edit_comment", { id: c3.id, kind: "issue_comment", body }, "task", true);
    if (r3 === void 0) {
      cb.checked = !on;
      alert(`Couldn't update the checkbox: ${S.actErr?.m || "unknown error"}`);
      return;
    }
    c3.body = body;
    let i3 = -1;
    c3.body_html = (c3.body_html || "").replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m2) => ++i3 === n2 ? on ? /\schecked/.test(m2) ? m2 : m2.replace(/<input/, "<input checked") : m2.replace(/\schecked(="[^"]*")?/, "") : m2);
    const key = `${prRef().repo}#${prRef().number}`;
    qc.set(key, b2);
    qc.m.get(key).at = Date.now() - 2e4;
    tauri?.invoke("invalidate_pr", { url: key }).catch(() => {
    });
  });
  function commentBox(c3, { isPr = false } = {}) {
    const u4 = c3.user || c3.actor;
    const assoc = ASSOC[c3.author_association ?? ""];
    const body = c3.body_html && c3.body_html.trim() ? `<div class="markdown-body">${liveTasks(c3.body_html)}</div>` : '<span class="empty">No description provided.</span>';
    return `<div class="tl-comment${folded("c:" + c3.id)}" id="c-${esc(c3.id ?? "")}"><div class="avatar-col"><a href="${esc(u4?.html_url)}">${avatar(u4, 40)}</a></div>
  <div class="cbox"><div class="chead"><div>${foldBtn("c:" + c3.id, "Hide this comment")} <a class="author u" href="${esc(u4?.html_url)}"><span class="author" style="font-weight:600;color:var(--fgColor-default)">${esc(u4?.login || "ghost")}</span></a> ${isPr ? "commented" : "commented"} <a class="ts" href="${esc(c3.html_url || "#")}">${when(c3.created_at || c3.submitted_at)}</a></div>
  <div class="rt">${assoc ? `<span class="assoc">${assoc}</span>` : ""}<button class="cm-btn" data-cm="${esc(c3.id)}" title="Comment actions">\u22EF</button></div></div>
  <div class="cbody">${body}</div>${reactionsHtml(c3.reactions, isPr ? "pr" : "issue_comment", c3.id)}</div></div>`;
  }
  function diffHunkTable(hunk) {
    const rows = [];
    let o3 = 0, n2 = 0;
    for (const line of hunk.split("\n")) {
      if (line.startsWith("@@")) {
        const m2 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m2) {
          o3 = +m2[1];
          n2 = +m2[2];
        }
        rows.push(`<tr class="hunk"><td class="num">\u2026</td><td class="num">\u2026</td><td class="code">${esc(line)}</td></tr>`);
        continue;
      }
      const t2 = line[0], txt = line.slice(1);
      if (t2 === "+") rows.push(`<tr class="add"><td class="num"></td><td class="num">${n2++}</td><td class="code" data-marker="+">${esc(txt)}</td></tr>`);
      else if (t2 === "-") rows.push(`<tr class="del"><td class="num">${o3++}</td><td class="num"></td><td class="code" data-marker="-">${esc(txt)}</td></tr>`);
      else if (t2 === "\\") rows.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(line)}</td></tr>`);
      else rows.push(`<tr><td class="num">${o3++}</td><td class="num">${n2++}</td><td class="code" data-marker=" ">${esc(txt)}</td></tr>`);
    }
    return `<table class="diff"><colgroup><col style="width:50px"><col style="width:50px"><col></colgroup>${rows.join("")}</table>`;
  }

  // src/app/fun.ts
  var enterTimer;
  function enterAnim() {
    qa(".tl-comment, .TLI, .thread, .sb-item, .merge-card, .composer, .pr-title-area").forEach((el, i3) => {
      el.style.setProperty("--i", String(Math.min(i3, 14)));
      el.classList.add("enter-in");
    });
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => qa(".enter-in").forEach((el) => el.classList.remove("enter-in")), 1800);
  }
  document.addEventListener("pointerdown", (e2) => {
    const b2 = e2.target.closest(".btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add");
    if (!b2 || b2.disabled) return;
    const r3 = b2.getBoundingClientRect(), d3 = Math.max(r3.width, r3.height) * 2, rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.cssText = `width:${d3}px;height:${d3}px;left:${e2.clientX - r3.left - d3 / 2}px;top:${e2.clientY - r3.top - d3 / 2}px`;
    if (getComputedStyle(b2).position === "static") b2.style.position = "relative";
    b2.style.overflow = "hidden";
    b2.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
    if (b2.matches(".reaction, .react-add")) burst(e2.clientX, e2.clientY, b2.textContent.trim().slice(0, 2) || "\u2728", 6);
  });
  function burst(x3, y2, ch, n2) {
    for (let i3 = 0; i3 < n2; i3++) {
      const p3 = document.createElement("span");
      p3.className = "burst";
      p3.textContent = ch;
      const a3 = Math.PI * 2 * i3 / n2 + Math.random() * 0.6, v2 = 40 + Math.random() * 50;
      p3.style.cssText = `left:${x3}px;top:${y2}px;--dx:${Math.cos(a3) * v2}px;--dy:${Math.sin(a3) * v2 - 30}px`;
      document.body.appendChild(p3);
      setTimeout(() => p3.remove(), 900);
    }
  }
  function confetti() {
    const c3 = document.createElement("canvas");
    c3.className = "confetti";
    c3.width = innerWidth;
    c3.height = innerHeight;
    document.body.appendChild(c3);
    const g2 = c3.getContext("2d"), cols = ["#0969da", "#1f883d", "#8250df", "#f2cc60", "#cf222e", "#ff8fb1"];
    const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[Math.random() * cols.length | 0] }));
    let t2 = 0;
    (function f4() {
      g2.clearRect(0, 0, c3.width, c3.height);
      t2++;
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
        g2.globalAlpha = Math.max(0, 1 - t2 / 130);
        g2.fillRect(-p3.r, -p3.r / 2, p3.r * 2, p3.r);
        g2.restore();
      });
      if (t2 < 130) requestAnimationFrame(f4);
      else c3.remove();
    })();
  }

  // src/app/diff.ts
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
        const m2 = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (m2) {
          o3 = +m2[1];
          n2 = +m2[2];
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
    const m2 = p3.match(/^(\w*)\n?([\s\S]*)$/);
    return `<pre class="lc-code${m2[1] === "suggestion" ? " sug" : ""}">${m2[1] === "suggestion" ? "<b>Suggested change</b>\n" : ""}${esc(m2[2].replace(/\n$/, ""))}</pre>`;
  })() : esc(p3).replace(/\n/g, "<br>")).join("");
  function threadsFor(path) {
    return (S.bundle?.review_comments || []).filter((c3) => c3.path === path);
  }
  function lineThreads(path, line, side, cols) {
    const all = threadsFor(path);
    if (!all.length) return "";
    const roots = all.filter((c3) => !c3.in_reply_to_id && (c3.line ?? c3.original_line) === line && (c3.side || "RIGHT") === side);
    if (!roots.length) return "";
    const res = new Set(S.bundle.resolved_ids || []);
    const b2 = S.bundle, card = (c3, rootId) => `<div class="tc"><a href="${esc(c3.user?.html_url || "#")}">${avatar(c3.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">${esc(c3.user?.login || "ghost")}</span> <span>${when(c3.created_at)}</span>${S.hasToken ? `<button class="cm-btn" data-cm="${esc(c3.id)}" data-root="${rootId}" title="Comment actions">\u22EF</button>` : ""}</div><div class="markdown-body" style="margin-top:8px">${c3.body_html || esc(c3.body || "")}</div>${reactionsHtml(c3.reactions, "review_comment", c3.id)}</div></div>`;
    return roots.map((r3) => {
      const isRes = res.has(r3.id), tid = (b2.thread_ids || {})[r3.id], list = [r3, ...all.filter((c3) => c3.in_reply_to_id === r3.id)];
      const act3 = tid && S.hasToken ? `<button class="thread-act" data-thread="${esc(tid)}" data-res="${isRes ? "unresolve" : "resolve"}">${isRes ? "Unresolve conversation" : "Resolve conversation"}</button>` : "";
      const reply = S.hasToken ? `<div class="reply">${draftBox("reply-" + r3.id, "Write a reply", 2)}${errLine("reply-" + r3.id)}<button class="btn small" data-sendreply="${r3.id}">Reply</button></div>` : "";
      return `<tr class="lc-row th-row"><td colspan="${cols}"><div class="thread inl${folded("t:" + r3.id, isRes)}"><div class="thread-head">${foldBtn("t:" + r3.id, "Hide this thread", isRes)}<span class="th-t">Comment on line <b>${side === "LEFT" ? "L" : "R"}${line}</b></span>${r3.line == null ? '<span class="res out">Outdated</span>' : ""}${isRes ? '<span class="res">Resolved</span>' : ""}</div>${list.map((c3) => card(c3, r3.id)).join("")}${reply}${act3 ? `<div class="th-foot">${act3}</div>` : ""}</div></td></tr>`;
    }).join("");
  }
  function lineExtras(path, line, side, cols, canComment, text) {
    const k3 = lineKey(path, line, side), th = lineThreads(path, line, side, cols), mine = pendList().filter((c3) => c3.path === path && c3.line === line && c3.side === side);
    const cards = mine.map((c3) => `<div class="lc-card"><span class="lc-tag">Pending</span><div class="lc-body">${lcBody(c3.body)}</div><button class="lc-x" data-lcdel="${c3.id}" title="Delete draft comment">${icon("x")}</button></div>`).join("");
    const open = canComment && S.lcOpen === k3 ? `<div class="lc-edit">${draftBox("lc", "Leave a comment on this line", 3)}<div class="lc-btns">${side === "RIGHT" && text !== void 0 ? `<button class="btn small" id="lcsuggest" data-code="${esc(text)}" title="Insert a suggested change for this line">\xB1 Suggest change</button>` : ""}<span class="sp"></span><button class="btn small" id="lccancel">Cancel</button><button class="btn small primary" id="lcadd">Add to review</button></div></div>` : "";
    return th + (cards || open ? `<tr class="lc-row"><td colspan="${cols}"><div class="lc">${cards}${open}</div></td></tr>` : "");
  }
  var diffCache = /* @__PURE__ */ new Map();
  function diffTable(patch, path, canComment) {
    const open = S.lcOpen && String(S.lcOpen).includes(path);
    if (open) return diffTableBuild(patch, path, canComment);
    const key = `${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((c3) => c3.path === path))}|${threadsFor(path).map((c3) => c3.id + ":" + (c3.updated_at || "") + JSON.stringify(c3.reactions || {}) + ((S.bundle.resolved_ids || []).includes(c3.id) ? "r" : "") + (isFolded("t:" + c3.id, (S.bundle.resolved_ids || []).includes(c3.id)) ? "f" : "")).join(",")}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith("reply-") ? S.actErr.k + S.actErr.m : ""}`, hit = diffCache.get(key);
    if (hit && hit.patch === patch) return hit.html;
    const html2 = diffTableBuild(patch, path, canComment);
    diffCache.set(key, { patch, html: html2 });
    if (diffCache.size > 400) diffCache.delete(diffCache.keys().next().value);
    return html2;
  }
  function diffTableBuild(patch, path, canComment) {
    const rows = parsePatch(patch), plus = (line, side) => canComment ? `<button class="lc-plus" data-lc="${esc(lineKey(path, line, side))}" title="Add a comment on this line">+</button>` : "";
    const out = [];
    if (S.diffMode === "split") {
      let i3 = 0;
      while (i3 < rows.length) {
        const r3 = rows[i3];
        if (r3.t === "hunk") {
          out.push(`<tr class="hunk"><td class="num"></td><td class="code" colspan="3">${esc(r3.text)}</td></tr>`);
          i3++;
          continue;
        }
        if (r3.t === "note") {
          i3++;
          continue;
        }
        if (r3.t === "ctx") {
          out.push(`<tr><td class="num">${r3.o}</td><td class="code" data-marker=" ">${codeHtml(r3.text, path)}</td><td class="num">${r3.n}${plus(r3.n, "RIGHT")}</td><td class="code" data-marker=" ">${codeHtml(r3.text, path)}</td></tr>${lineExtras(path, r3.n, "RIGHT", 4, canComment, r3.text)}`);
          i3++;
          continue;
        }
        const dels = [], adds = [];
        while (rows[i3] && rows[i3].t === "del") dels.push(rows[i3++]);
        while (rows[i3] && rows[i3].t === "add") adds.push(rows[i3++]);
        for (let k3 = 0; k3 < Math.max(dels.length, adds.length); k3++) {
          const d3 = dels[k3], a3 = adds[k3];
          out.push(`<tr><td class="num${d3 ? " del" : " empty"}">${d3 ? d3.o + plus(d3.o, "LEFT") : ""}</td><td class="code${d3 ? " del" : " empty"}" ${d3 ? 'data-marker="-"' : ""}>${d3 ? codeHtml(d3.text, path) : ""}</td><td class="num${a3 ? " add" : " empty"}">${a3 ? a3.n + plus(a3.n, "RIGHT") : ""}</td><td class="code${a3 ? " add" : " empty"}" ${a3 ? 'data-marker="+"' : ""}>${a3 ? codeHtml(a3.text, path) : ""}</td></tr>${d3 ? lineExtras(path, d3.o, "LEFT", 4, canComment) : ""}${a3 ? lineExtras(path, a3.n, "RIGHT", 4, canComment, a3.text) : ""}`);
        }
      }
      return chunkTables(out, "diff sbs", '<colgroup><col style="width:64px"><col><col style="width:64px"><col></colgroup>');
    }
    for (const r3 of rows) {
      if (r3.t === "hunk") out.push(`<tr class="hunk"><td class="num">\u2026</td><td class="num">\u2026</td><td class="code">${esc(r3.text)}</td></tr>`);
      else if (r3.t === "note") out.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(r3.text)}</td></tr>`);
      else if (r3.t === "add") out.push(`<tr class="add"><td class="num"></td><td class="num">${r3.n}${plus(r3.n, "RIGHT")}</td><td class="code" data-marker="+">${codeHtml(r3.text, path)}</td></tr>${lineExtras(path, r3.n, "RIGHT", 3, canComment, r3.text)}`);
      else if (r3.t === "del") out.push(`<tr class="del"><td class="num">${r3.o}${plus(r3.o, "LEFT")}</td><td class="num"></td><td class="code" data-marker="-">${codeHtml(r3.text, path)}</td></tr>${lineExtras(path, r3.o, "LEFT", 3, canComment)}`);
      else out.push(`<tr><td class="num">${r3.o}</td><td class="num">${r3.n}${plus(r3.n, "RIGHT")}</td><td class="code" data-marker=" ">${codeHtml(r3.text, path)}</td></tr>${lineExtras(path, r3.n, "RIGHT", 3, canComment, r3.text)}`);
    }
    return chunkTables(out, "diff", '<colgroup><col style="width:64px"><col style="width:64px"><col></colgroup>');
  }
  function chunkTables(out, cls, cols, size = Infinity) {
    if (out.length <= size) return `<table class="${cls}">${cols}${out.join("")}</table>`;
    let h3 = "";
    for (let i3 = 0; i3 < out.length; i3 += size) {
      const n2 = Math.min(size, out.length - i3);
      h3 += `<div class="dchunk" style="contain-intrinsic-size:auto ${n2 * 22}px"><table class="${cls}">${cols}${out.slice(i3, i3 + size).join("")}</table></div>`;
    }
    return h3;
  }
  var sugOf = (c3) => {
    const m2 = (c3.body || "").match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/);
    return m2 ? m2[1] : null;
  };
  function suggestBtn(c3, b2, list) {
    const t2 = sugOf(c3);
    if (t2 !== null && S.applied?.has(String(c3.id))) return '<div class="sug-row"><span class="sug-note">Applying suggestion\u2026</span></div>';
    if (t2 === null || !b0open() || list.some((x3) => (b2.resolved_ids || []).includes(x3.id))) return "";
    const p3 = b2.pull, mine = p3.head.repo && !p3.head.repo.fork || p3.head.repo && p3.head.repo.full_name === p3.base.repo.full_name;
    if (!c3.line) return '<div class="sug-row"><span class="sug-note">Outdated suggestion \u2014 the lines have changed.</span></div>';
    return `<div class="sug-row"><button class="btn small primary" data-sug="${c3.id}" ${p3.head.repo ? "" : "disabled"}>Apply suggestion</button><span class="sug-note">Commits to <code>${esc(p3.head.ref)}</code>${mine ? "" : " (fork \u2014 needs push access)"}</span></div>`;
  }
  function reviewBlock(e2, b2) {
    const resolved = new Set(b2.resolved_ids || []), isRes = (list) => list.some((c3) => resolved.has(c3.id));
    const stateMap = { approved: ["check", "success", "approved these changes"], changes_requested: ["file-diff", "danger", "requested changes"], commented: ["eye", "", "reviewed"], dismissed: ["x", "", "dismissed a review"] };
    const [ic, kind, verb] = stateMap[e2.state.toLowerCase()] || ["eye", "", "reviewed"];
    const mine = b2.review_comments.filter((c3) => c3.pull_request_review_id === e2.id), mineIds = new Set(mine.map((c3) => c3.id));
    const cs = [...mine, ...b2.review_comments.filter((c3) => c3.pull_request_review_id !== e2.id && mineIds.has(c3.in_reply_to_id))].filter((c3) => !S.who.length || S.who.includes(e2.user?.login) || S.who.includes(c3.user?.login));
    const hasBody = e2.body_html && e2.body_html.trim();
    const byPath = {};
    cs.forEach((c3) => (byPath[`${c3.path}\0${c3.original_position ?? c3.position}`] ||= []).push(c3));
    const all = Object.values(byPath).map((l3) => l3.sort((x3, y2) => (x3.in_reply_to_id ? 1 : 0) - (y2.in_reply_to_id ? 1 : 0) || x3.id - y2.id)), allRes = all.length > 0 && all.every(isRes), nres = all.filter(isRes).length, rk = "r:" + e2.id;
    const lists = S.unres ? all.filter((l3) => !isRes(l3)) : all;
    if (S.unres && !lists.length) return "";
    const threads = lists.map((list) => `<div class="thread${folded("t:" + list[0].id, isRes(list))}"><div class="thread-head">${foldBtn("t:" + list[0].id, "Hide this thread", isRes(list))}${esc(list[0].path)}${isRes(list) ? '<span class="res">Resolved</span>' : ""}${(b2.thread_ids || {})[list[0].id] ? `<button class="thread-act" data-thread="${esc(b2.thread_ids[list[0].id])}" data-res="${isRes(list) ? "unresolve" : "resolve"}">${isRes(list) ? "Unresolve" : "Resolve conversation"}</button>` : ""}</div><div class="diffhunk">${diffHunkTable(list[0].diff_hunk || "")}</div>${list.map((c3) => `<div class="tc" id="c-${esc(c3.id)}"><a href="${esc(c3.user.html_url)}">${avatar(c3.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">${esc(c3.user.login)}</span> <span>${when(c3.created_at)}</span><button class="cm-btn" data-cm="${esc(c3.id)}" data-root="${list[0].id}" title="Comment actions">\u22EF</button></div><div class="markdown-body" style="margin-top:8px">${c3.body_html || ""}</div>${suggestBtn(c3, b2, list)}${reactionsHtml(c3.reactions, "review_comment", c3.id)}</div></div>`).join("")}<div class="reply">${draftBox("reply-" + list[0].id, "Reply\u2026", 2)}${errLine("reply-" + list[0].id)}<button class="btn small" data-sendreply="${list[0].id}">Reply</button></div></div>`).join("");
    const sum = all.length ? `<span class="rev-sum${allRes ? " ok" : ""}">${allRes ? icon("check") + " All resolved" : `${all.length} thread${all.length === 1 ? "" : "s"}${nres ? ` \xB7 ${nres} resolved` : ""}`}</span>` : "";
    return `<div class="TLI rev${folded(rk, allRes)}"><div class="TLI-badge ${kind}">${icon(ic)}</div><div class="TLI-avatar">${avatar(e2.user, 20)}</div><div class="TLI-body"><div class="row">${foldBtn(rk, "Collapse / expand this review", allRes)}${user(e2.user)} <span>${verb}</span> <a class="time" href="${esc(e2.html_url)}">${when(e2.submitted_at).replace(/<\/?span[^>]*>/g, "")}</a>${sum}</div>
  ${hasBody ? `<div class="cbox nocaret" style="margin-top:8px;color:var(--fgColor-default)"><div class="cbody"><div class="markdown-body">${e2.body_html}</div></div></div>` : ""}${threads ? `<div>${threads}</div>` : ""}</div></div>`;
  }

  // src/app/timeline.ts
  function commitRow(msg, sha, author, url, verification, trailing = "") {
    const first = String(msg || "").split("\n")[0];
    const unv = verification && !verification.verified;
    return `<div class="commit-row">${author ? `<span class="TLI-avatar" style="margin-right:8px">${avatar(author, 20)}</span>` : ""}<span class="msg" style="flex:0 1 auto"><a href="${esc(url || "#")}">${esc(first)}</a></span>${trailing}<span class="cm-ic">${icon("comment")}</span><span style="flex:1"></span>${verification ? `<span class="label-pill ${unv ? "warn" : "ok"}">${unv ? "Unverified" : "Verified"}</span>` : ""}<a class="sha" href="${esc(url || "#")}">${esc(String(sha).slice(0, 7))}</a></div>`;
  }
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
  function timeline(b2) {
    const p3 = b2.pull, out = [];
    const evUser = (e2) => {
      const u4 = e2.user || e2.actor || e2.author;
      return u4?.login || u4?.name || "";
    };
    const people = /* @__PURE__ */ new Map(), bump = (u4) => {
      if (!u4?.login) return;
      const r3 = people.get(u4.login) || { u: u4, n: 0 };
      r3.n++;
      people.set(u4.login, r3);
    };
    bump(p3.user);
    b2.timeline.forEach((e2) => {
      if (e2.event === "commented" || e2.event === "reviewed") bump(e2.user);
    });
    b2.review_comments.forEach((c3) => bump(c3.user));
    S.who = S.who.filter((w3) => people.has(w3));
    const who = S.who, on = who.length > 0;
    const byUser = on ? b2.timeline.filter((e2) => who.includes(evUser(e2)) || e2.event === "reviewed" && b2.review_comments.some((c3) => c3.pull_request_review_id === e2.id && who.includes(c3.user?.login))) : b2.timeline;
    const byKind = S.unres ? byUser.filter((e2) => e2.event === "reviewed") : byUser;
    const evTime = (e2) => e2.created_at || e2.submitted_at || e2.committer?.date || e2.author?.date || "";
    const [rLo, rHi] = rangeBounds(), rangeOn = S.range !== "all";
    const inRange = (t2) => {
      const x3 = t2 ? Date.parse(t2) : NaN;
      return isNaN(x3) || x3 >= rLo && x3 <= rHi;
    };
    const keep = !rangeOn ? byKind : byKind.filter((e2) => inRange(evTime(e2)) || e2.event === "reviewed" && b2.review_comments.some((c3) => c3.pull_request_review_id === e2.id && inRange(c3.created_at)) || e2.event === "reviewed" && b2.review_comments.some((c3) => inRange(c3.created_at) && b2.review_comments.some((r3) => r3.id === c3.in_reply_to_id && r3.pull_request_review_id === e2.id)));
    const rangeBar = `<div class="date-bar"><span class="who-l">${icon("clock")}When</span><select class="sel" id="crange" title="Only show activity from this period">${[["all", "Any time"], ["1h", "Last hour"], ["24h", "Last 24 hours"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["custom", "Custom range\u2026"]].map(([v2, l3]) => `<option value="${v2}" ${S.range === v2 ? "selected" : ""}>${l3}</option>`).join("")}</select>${S.range === "custom" ? `<input type="date" class="input" id="cfrom" value="${esc(S.rFrom)}" title="From"><span class="who-l">to</span><input type="date" class="input" id="cto" value="${esc(S.rTo)}" title="To">` : ""}<span class="sp"></span><button class="who-chip" id="csort" title="Flip the order of the timeline">${icon(S.sort === "desc" ? "chevron-down" : "chevron-up")}<span>${S.sort === "desc" ? "Newest first" : "Oldest first"}</span></button></div>`;
    const bar = people.size > 1 ? `<div class="who-bar"><span class="who-l">${icon("person")}Show</span><button class="who-chip ${on ? "" : "on"}" data-whoclear="1">Everyone</button>${[...people.values()].sort((x3, y2) => y2.n - x3.n).map(({ u: u4, n: n2 }) => `<button class="who-chip ${who.includes(u4.login) ? "on" : ""}" data-who="${esc(u4.login)}" title="${n2} comment${n2 === 1 ? "" : "s"}">${avatar(u4, 18)}<span>${esc(u4.login)}</span><i>${n2}</i></button>`).join("")}</div>` : "";
    const bars = bar + rangeBar;
    if (!S.unres && (!on || who.includes(p3.user.login))) out.push(commentBox({ ...p3, created_at: p3.created_at, html_url: p3.html_url, reactions: p3.reactions }, { isPr: true }).replace('class="tl-comment"', 'class="tl-comment" style="margin-bottom:0"'));
    const evs = [];
    for (let i3 = 0; i3 < keep.length; ) {
      let j3 = i3;
      while (j3 < keep.length && keep[j3].event === "committed") j3++;
      if (j3 - i3 >= 6) {
        evs.push({ event: "commit-run", n: j3 - i3, first: keep[i3], last: keep[j3 - 1] });
        i3 = j3;
      } else {
        evs.push(keep[i3]);
        i3++;
      }
    }
    if (S.sort === "desc") evs.reverse();
    const info = b2.commit_info || {};
    let merged = false;
    for (const e2 of evs) {
      switch (e2.event) {
        case "commented":
          out.push(commentBox(e2));
          break;
        case "commit-run":
          out.push(`<div class="TLI"><div class="TLI-badge">${icon("git-commit")}</div><div class="TLI-body"><div class="row"><a data-tab="commits" class="run"><b>${e2.n} commits</b> <span class="mono">${esc(e2.first.sha.slice(0, 7))} \u2026 ${esc(e2.last.sha.slice(0, 7))}</span> \xB7 view in Commits</a></div></div></div>`);
          break;
        case "reviewed":
          out.push(reviewBlock(e2, b2));
          break;
        case "committed":
          out.push(`<div class="TLI"><div class="TLI-badge">${icon("git-commit")}</div><div class="TLI-body">${commitRow(e2.message, e2.sha, info[e2.sha]?.author || (e2.author?.avatar_url ? e2.author : null), e2.html_url, e2.verification)}</div></div>`);
          break;
        case "referenced": {
          const ci = info[e2.commit_id];
          const ml = ci ? ci.message.split("\n")[0] : "";
          const linked = esc(ml).replace(/#(\d+)/, '</a><a href="#" style="color:var(--fgColor-accent)">#$1</a><a href="#">');
          out.push(`<div class="TLI"><div class="TLI-badge">${icon("cross-reference")}</div><div class="TLI-body stack"><div class="row" style="min-height:32px">${user(e2.actor)} <span>added a commit that referenced this pull request</span> <a class="time">${when(e2.created_at).replace(/<\/?span[^>]*>/g, "")}</a></div>${ci ? `<div class="line2"><div class="commit-row"><span class="TLI-avatar" style="margin:0 8px 0 0">${avatar(ci.author || e2.actor, 20)}</span><span class="msg" style="flex:0 1 auto"><a href="${esc(ci.html_url)}">${linked}</a></span><span class="mono" style="background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px">\u2026</span><span class="cm-ic">${icon("comment")}</span><span style="flex:1"></span><a class="sha" href="${esc(ci.html_url)}">${esc(ci.sha.slice(0, 7))}</a></div></div>` : ""}</div></div>`);
          break;
        }
        case "merged":
          merged = true;
          out.push(`<div class="TLI mergedrow"><div class="TLI-badge done">${icon("git-merge")}</div><div class="TLI-avatar">${avatar(e2.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e2.actor)} <span>merged commit <b class="mono" style="color:var(--fgColor-default);font-size:12px">${esc((e2.commit_id || "").slice(0, 7))}</b> into <span class="branch">${esc(p3.base.label)}</span></span> <a class="time">${when(e2.created_at).replace(/<\/?span[^>]*>/g, "")}</a></div></div></div>`);
          out.push('<div class="TLI-break"></div>');
          break;
        case "closed":
          if (!p3.merged) out.push(simple(e2, "git-pull-request-closed", "closed this", "danger"));
          break;
        case "reopened":
          out.push(simple(e2, "git-pull-request", "reopened this", "success"));
          break;
        case "cross-referenced": {
          const i3 = e2.source?.issue;
          if (!i3) break;
          const isPr = !!i3.pull_request;
          out.push(`<div class="TLI"><div class="TLI-badge">${icon("cross-reference")}</div><div class="TLI-body"><div class="row">${user(e2.actor)} <span>mentioned this ${isPr ? "pull request" : "issue"}</span> <a class="time">${when(e2.created_at).replace(/<\/?span[^>]*>/g, "")}</a></div>
        <div class="ref-card"><span style="color:var(--fgColor-${i3.state === "open" ? "success" : "done"});margin-top:2px">${icon(isPr ? i3.state === "open" ? "git-pull-request" : "git-merge" : "issue-opened")}</span><div><a class="t" href="${esc(i3.html_url)}" style="color:var(--fgColor-default)">${esc(i3.title.split("\n")[0].slice(0, 120))}</a><span class="r">${esc(i3.repository?.full_name || "")}#${i3.number}</span></div></div></div></div>`);
          break;
        }
        case "labeled":
        case "unlabeled":
          out.push(`<div class="TLI condensed"><div class="TLI-badge">${icon("tag")}</div><div class="TLI-avatar">${avatar(e2.actor, 20)}</div><div class="TLI-body">${user(e2.actor)} <span>${e2.event === "labeled" ? "added" : "removed"}</span> <span class="pill-label" style="background:#${esc(e2.label?.color)};color:#fff;margin:0">${esc(e2.label?.name)}</span> <span>label</span> <a class="time">${when(e2.created_at).replace(/<\/?span[^>]*>/g, "")}</a></div></div>`);
          break;
        case "assigned":
        case "unassigned":
          out.push(simple(e2, "person", `${e2.event} ${e2.assignee ? esc(e2.assignee.login) : ""}`));
          break;
        case "review_requested":
          out.push(simple(e2, "eye", `requested a review from ${esc(e2.requested_reviewer?.login || e2.requested_team?.name || "")}`));
          break;
        case "renamed":
          out.push(simple(e2, "pencil", `changed the title <s>${esc(e2.rename?.from)}</s> ${esc(e2.rename?.to)}`));
          break;
        case "head_ref_force_pushed":
          out.push(simple(e2, "repo-push", "force-pushed the head branch"));
          break;
        case "head_ref_deleted":
          out.push(simple(e2, "git-branch", "deleted the head branch"));
          break;
        case "ready_for_review":
          out.push(simple(e2, "eye", "marked this pull request as ready for review"));
          break;
        case "convert_to_draft":
          out.push(simple(e2, "git-pull-request-draft", "marked this pull request as draft"));
          break;
        case "milestoned":
          out.push(simple(e2, "milestone", `added this to the ${esc(e2.milestone?.title)} milestone`));
          break;
        case "locked":
          out.push(simple(e2, "lock", "locked this conversation"));
          break;
        default:
          break;
      }
    }
    const foldAll = `<div class="fold-bar"><button class="btn small" id="foldallconv" title="Collapse or expand every comment, review and thread">${icon("chevron-down")} <span>Collapse all conversations</span></button></div>`;
    return `${bars}${foldAll}<div class="TL">${out.join("")}${!evs.length && (on || rangeOn) ? `<div class="diff-empty">${rangeOn ? "No activity in this period." : "Nothing from the selected accounts."}</div>` : ""}</div>${on ? "" : mergeBox(b2)}${mergeActions(b2)}${composer(b2)}`;
  }
  var checkState = (c3) => c3.status !== "completed" ? "pending" : c3.conclusion === "success" ? "pass" : ["skipped", "neutral"].includes(c3.conclusion) ? "skip" : "fail";
  var CK = { pass: ["check-circle-fill", "Passed"], fail: ["x-circle-fill", "Failed"], pending: ["dot-fill", "In progress"], skip: ["circle-slash", "Skipped"] };
  var reqBadge = (c3) => (S.bundle?.required_checks || []).includes(c3.name) ? '<span class="ck-req" title="Required by branch protection">Required</span>' : "";
  function checksView(b2) {
    const list = (b2.checks || []).map((c3) => ({ ...c3, st: checkState(c3) }));
    if (!list.length) return '<div class="diff-empty">No checks reported for the latest commit.</div>';
    const n2 = (s3) => list.filter((c3) => c3.st === s3).length;
    const rank = { fail: 0, pending: 1, pass: 2, skip: 3 };
    list.sort((x3, y2) => rank[x3.st] - rank[y2.st] || String(x3.name).localeCompare(String(y2.name)));
    const head = n2("fail") ? ["fail", `${n2("fail")} failing`] : n2("pending") ? ["pending", `${n2("pending")} in progress`] : ["pass", "All checks passed"];
    const dur = (c3) => {
      const s3 = Date.parse(c3.started_at), e2 = Date.parse(c3.completed_at);
      if (!s3 || !e2 || e2 < s3) return "";
      const t2 = Math.round((e2 - s3) / 1e3);
      return t2 >= 60 ? `${Math.floor(t2 / 60)}m ${t2 % 60}s` : `${t2}s`;
    };
    return `<div class="checks"><div class="ck-head ${head[0]}">${icon(CK[head[0]][0], 20)}<div><b>${head[1]}</b><span>${[n2("fail") && `${n2("fail")} failing`, n2("pending") && `${n2("pending")} in progress`, n2("pass") && `${n2("pass")} passed`, n2("skip") && `${n2("skip")} skipped`].filter(Boolean).join(" \xB7 ")}</span></div></div>${list.map((c3) => `<a class="ck-row ${c3.st}" ${c3.url ? `href="${esc(c3.url)}"` : ""}><span class="ck-i">${icon(CK[c3.st][0])}</span><span class="ck-n"><b>${esc(c3.name)}</b>${reqBadge(c3)}<i>${esc(c3.description || (c3.app ? c3.app : ""))}</i></span><span class="ck-s">${c3.st === "fail" && c3.conclusion && c3.conclusion !== "failure" ? esc(c3.conclusion.replace(/_/g, " ")) : CK[c3.st][1]}</span><span class="ck-d">${dur(c3)}</span></a>`).join("")}</div>`;
  }
  function unresolvedRoots(b2) {
    const res = new Set(b2.resolved_ids || []);
    return b2.review_comments.filter((c3) => !c3.in_reply_to_id && !res.has(c3.id));
  }
  function attention(b2) {
    const p3 = b2.pull, rc = b2.review_comments, roots = rc.filter((c3) => !c3.in_reply_to_id), open = unresolvedRoots(b2);
    const known = S.hasToken || (b2.resolved_ids || []).length > 0;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user).forEach((e2) => {
      const st = e2.state.toLowerCase();
      if (st === "commented" && latest.has(e2.user.login)) return;
      latest.set(e2.user.login, st);
    });
    const cr = [...latest.values()].filter((s3) => s3 === "changes_requested").length, ap = [...latest.values()].filter((s3) => s3 === "approved").length;
    const ck = (b2.checks || []).map(checkState), fail = ck.filter((s3) => s3 === "fail").length, pend = ck.filter((s3) => s3 === "pending").length, pass = ck.filter((s3) => s3 === "pass").length;
    const it = [];
    const add = (k3, ic, text, attr = "") => it.push(`<button class="att-i ${k3}" ${attr}>${icon(ic)}<span>${text}</span></button>`);
    if (roots.length) {
      if (!known) add("", "comment", `${roots.length} review thread${roots.length === 1 ? "" : "s"}`);
      else if (open.length) add("bad", "comment", `${open.length} unresolved thread${open.length === 1 ? "" : "s"}`, 'id="nextun" title="Jump to the next unresolved thread"');
      else add("ok", "check-circle-fill", "All threads resolved");
    }
    add(cr ? "bad" : ap ? "ok" : "", cr ? "file-diff" : ap ? "check" : "eye", cr ? `${cr} requesting changes` : ap ? `${ap} approved` : "No approvals yet");
    if (ck.length) add(fail ? "bad" : pend ? "warn" : "ok", fail ? "x-circle-fill" : pend ? "dot-fill" : "check-circle-fill", fail ? `${fail} check${fail === 1 ? "" : "s"} failing` : pend ? `${pend} check${pend === 1 ? "" : "s"} running` : `${pass} check${pass === 1 ? "" : "s"} passed`, 'data-tab="checks" title="Open checks"');
    if (p3.merged) add("done", "git-merge", "Merged");
    else if (p3.state === "closed") add("bad", "git-pull-request-closed", "Closed");
    else if (p3.mergeable === false || p3.mergeable_state === "dirty") add("bad", "alert", "Has conflicts");
    else if (p3.mergeable_state === "clean") add("ok", "git-merge", "Ready to merge");
    else if (p3.draft) add("", "git-pull-request-draft", "Draft");
    return `<div class="attn">${it.join("")}${roots.length ? `<span class="sp"></span><button class="att-tog ${S.unres ? "on" : ""}" id="unres" title="Hide everything except review threads that are still open">${icon("comment")}Unresolved only</button>` : ""}</div>`;
  }
  function jumpUnresolved() {
    const b2 = S.bundle, list = unresolvedRoots(b2);
    if (!list.length) return;
    const c3 = list[S.unIdx % list.length];
    S.unIdx++;
    const first = b2.review_comments.find((x3) => x3.pull_request_review_id === c3.pull_request_review_id && x3.path === c3.path && (x3.original_position ?? x3.position) === (c3.original_position ?? c3.position)) || c3;
    S.fold["r:" + c3.pull_request_review_id] = false;
    S.fold["t:" + first.id] = false;
    S.fold["c:" + c3.id] = false;
    localStorage.setItem("fold", JSON.stringify(S.fold));
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    const el = document.getElementById("c-" + c3.id);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
  }
  function simple(e2, ic, text, kind = "") {
    return `<div class="TLI"><div class="TLI-badge ${kind}">${icon(ic)}</div><div class="TLI-avatar">${avatar(e2.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e2.actor)} <span>${text}</span> <a class="time">${when(e2.created_at).replace(/<\/?span[^>]*>/g, "")}</a></div></div></div>`;
  }

  // src/app/mergebox.ts
  function mergeBox(b2) {
    const p3 = b2.pull;
    const head = p3.head.label.split(":")[1];
    if (p3.merged) {
      return `<div class="TL"><div class="TLI-break" style="margin-left:0"></div><div class="merge-box"><div class="badge"><span class="state-merged" style="background:var(--bgColor-done-emphasis)">${icon("git-merge")}</span></div><div class="merge-card merged-card"><div class="row"><div><h3>Pull request successfully merged and closed</h3><p style="font-size:14px;margin-top:4px">You're all set \u2014 the <span class="branch">${esc(head)}</span> branch can be safely deleted.</p></div></div></div></div></div>`;
    }
    if (p3.state === "closed") {
      return `<div class="merge-box"><div class="badge"><span class="state-closed" style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))">${icon("git-pull-request-closed")}</span></div><div class="merge-card"><div class="row"><div><h3>Closed with unmerged commits</h3><p style="font-size:14px;margin-top:4px">This pull request is closed, but the <span class="branch">${esc(head)}</span> branch has unmerged commits.</p></div></div></div></div>`;
    }
    const clean = p3.mergeable_state === "clean" || p3.mergeable !== false;
    const latest = /* @__PURE__ */ new Map();
    b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user).forEach((e2) => {
      const st2 = e2.state.toLowerCase();
      if (st2 === "commented" && latest.has(e2.user.login)) return;
      latest.set(e2.user.login, st2);
    });
    const ap = [...latest.values()].filter((x3) => x3 === "approved").length, cr = [...latest.values()].filter((x3) => x3 === "changes_requested").length, pendRev = (p3.requested_reviewers || []).length;
    const rvHead = cr ? ["bad", "x-circle-fill", "Changes requested", `${cr} reviewer${cr === 1 ? "" : "s"} requested changes`] : ap ? ["ok", "check-circle-fill", "Changes approved", `${ap} approving review${ap === 1 ? "" : "s"}`] : ["", "eye", "Review not yet submitted", pendRev ? `${pendRev} pending review${pendRev === 1 ? "" : "s"}` : "No reviews yet"];
    const list = (b2.checks || []).map((c3) => ({ ...c3, st: checkState(c3) })), cnt = (k3) => list.filter((c3) => c3.st === k3).length;
    const ckHead = cnt("fail") ? ["bad", "x-circle-fill", `${cnt("fail")} check${cnt("fail") === 1 ? "" : "s"} failing`] : cnt("pending") ? ["", "dot-fill", `${cnt("pending")} check${cnt("pending") === 1 ? "" : "s"} in progress`] : ["ok", "check-circle-fill", "All checks have passed"];
    const ckSub = [cnt("skip") && `${cnt("skip")} neutral`, cnt("pass") && `${cnt("pass")} successful`, cnt("fail") && `${cnt("fail")} failing`, cnt("pending") && `${cnt("pending")} pending`].filter(Boolean).join(", ");
    const grp = (k3, title) => {
      const g2 = list.filter((c3) => c3.st === k3);
      if (!g2.length) return "";
      const open = S.mbOpen?.has("g" + k3) ?? k3 !== "pass";
      return `<button class="mb-grp" data-mb="g${k3}">${title} ${icon(open ? "chevron-up" : "chevron-down", 12)}</button>${open ? g2.map((c3) => `<a class="mb-ck ${c3.st}" ${c3.url ? `href="${esc(c3.url)}"` : ""}>${icon(CK[c3.st][0], 14)}<b>${esc(c3.name)}</b>${reqBadge(c3)}<i>${esc(c3.description || c3.app || "")}</i></a>`).join("") : ""}`;
    };
    const rerunable = list.some((c3) => c3.st === "fail" && /\/actions\/runs\//.test(c3.url || ""));
    const sec = (k3, h3, body) => {
      const open = S.mbOpen?.has(k3);
      return `<div class="mb-sec"><button class="mb-h ${h3[0]}" data-mb="${k3}"><span class="mb-ic">${icon(h3[1], 22)}</span><span class="mb-t"><b>${h3[2]}</b><i>${h3[3] || ""}</i></span>${k3 === "ck" && rerunable ? '<span class="btn small" id="rerunck" role="button">Re-run failed</span>' : ""}${icon(open ? "chevron-up" : "chevron-down", 16)}</button>${open && body ? `<div class="mb-body">${body}</div>` : ""}</div>`;
    };
    const rvBody = `<div class="mb-line">${icon("check", 14)} ${ap} approval${ap === 1 ? "" : "s"}</div>${cr ? `<div class="mb-line bad">${icon("x-circle-fill", 14)} ${cr} requested changes</div>` : ""}<div class="mb-line">${icon("person", 14)} ${pendRev} pending review${pendRev === 1 ? "" : "s"}${pendRev ? `: ${p3.requested_reviewers.map((u4) => esc(u4.login)).join(", ")}` : ""}</div>`;
    const behind = p3.mergeable_state === "behind";
    const upd = behind ? `<div class="mb-sec mb-warn"><div class="mb-h"><span class="mb-ic">${icon("alert", 22)}</span><span class="mb-t"><b>This branch is out-of-date with the base branch</b><i>Merge the latest changes from ${esc(p3.base.ref)} into this branch.</i></span><button class="btn" id="updbranch">${S.busy === "update_branch" ? "Updating\u2026" : "Update branch"}</button></div></div>` : "";
    const st = p3.draft ? `<div class="mb-sec"><div class="mb-h"><span class="mb-ic">${icon("git-pull-request-draft", 22)}</span><span class="mb-t"><b>This pull request is still a work in progress</b><i>Draft pull requests cannot be merged.</i></span><button class="btn primary" id="doready">${S.busy === "ready" ? "Updating\u2026" : "Ready for review"}</button></div></div>${errLine("ready")}` : "";
    const conf = `<div class="mb-sec"><div class="mb-h ${clean ? "ok" : "bad"}"><span class="mb-ic">${icon(clean ? "check-circle-fill" : "alert", 22)}</span><span class="mb-t"><b>${clean ? "This branch has no conflicts with the base branch" : "This branch has conflicts that must be resolved"}</b><i>${clean ? "Merging can be performed automatically." : "Use the web editor or the command line to resolve conflicts."}</i></span></div></div>`;
    return `<div class="merge-box"><div class="badge"><span style="background:var(--bgColor-success-emphasis)">${icon("git-pull-request")}</span></div><div class="merge-card mb-card">${st}${sec("rv", rvHead, rvBody)}${list.length ? sec("ck", ckHead.concat(ckSub), grp("fail", "Failing checks") + grp("pending", "In progress") + grp("skip", "Neutral checks") + grp("pass", "Successful checks")) : ""}${upd}${conf}${errLine("update_branch")}</div></div>`;
  }
  function sidebar(b2) {
    const p3 = b2.pull;
    const reviewers = /* @__PURE__ */ new Map();
    p3.requested_reviewers.forEach((u4) => reviewers.set(u4.login, { u: u4, st: "req" }));
    b2.timeline.filter((e2) => e2.event === "reviewed").forEach((e2) => {
      const st = e2.state.toLowerCase();
      const cur = reviewers.get(e2.user.login);
      if (cur?.st === "req") {
        if (!cur.prev || st === "approved" || st === "changes_requested") cur.prev = st;
      } else if (!cur || st === "approved" || st === "changes_requested") reviewers.set(e2.user.login, { u: e2.user, st });
    });
    const rv = [...reviewers.values()];
    const canRe = !p3.merged && p3.state === "open";
    const rvHtml = (r3) => `<div class="reviewer"><a href="${esc(r3.u.html_url)}">${avatar(r3.u, 20)}</a><a class="nm" href="${esc(r3.u.html_url)}">${esc(r3.u.login)}</a><span class="st ${r3.st === "approved" ? "ok" : r3.st === "changes_requested" ? "bad" : ""}">${r3.st === "req" && r3.prev ? `<span title="Asked to review again" style="margin-right:6px">${icon("sync")}</span>${icon(r3.prev === "approved" ? "check" : r3.prev === "changes_requested" ? "file-diff" : "comment")}` : icon(r3.st === "approved" ? "check" : r3.st === "changes_requested" ? "file-diff" : r3.st === "req" ? "dot-fill" : "comment")}</span>${canRe && r3.st !== "req" && r3.u.login !== p3.user.login ? `<button class="rerequest" data-rerequest="${esc(r3.u.login)}" title="Ask ${esc(r3.u.login)} to review again">${icon("sync")}</button>` : ""}</div>`;
    const first = rv.length > 1 ? `<button class="sb-toggle" id="rvtoggle"><span>${rv.length - 0} reviewers</span>${icon(S.showAllReviewers ? "chevron-up" : "chevron-down")}</button>` : "";
    const rvSection = rv.length ? `${rv.slice(0, 3).map(rvHtml).join("")}${rv.length > 3 ? `<button class="sb-toggle" id="rvtoggle"><span>+${rv.length - 3} more reviewer${rv.length - 3 === 1 ? "" : "s"}</span>${icon(S.showAllReviewers ? "chevron-up" : "chevron-down")}</button>${S.showAllReviewers ? rv.slice(3).map(rvHtml).join("") : ""}` : ""}` : '<div class="sb-none">No reviews</div>';
    const people = /* @__PURE__ */ new Map();
    [p3.user, ...b2.timeline.map((e2) => e2.user || e2.actor || e2.author)].forEach((u4) => u4 && u4.login && !people.has(u4.login) && people.set(u4.login, u4));
    const labels = p3.labels.length ? p3.labels.map((l3) => `<span class="pill-label" style="background:#${esc(l3.color)}33;color:#${esc(l3.color)};border-color:#${esc(l3.color)}">${esc(l3.name)}</span>`).join("") : '<span class="sb-none">None yet</span>';
    const assignees = p3.assignees.length ? p3.assignees.map((u4) => `<div class="reviewer"><a href="${esc(u4.html_url)}">${avatar(u4, 20)}</a><a class="nm" href="${esc(u4.html_url)}">${esc(u4.login)}</a></div>`).join("") : '<span class="sb-none">No one\u2014</span>';
    const head = (t2) => `<div class="sb-head">${foldBtn("sb:" + t2, "Hide section")}<span>${t2}</span>${icon("gear", 16, "gear")}</div>`;
    const item = (k3, inner) => `<div class="sb-item${folded("sb:" + k3)}">${inner}</div>`;
    return `<div class="pr-side-inner">${item("Reviewers", `<div class="sb-head">${foldBtn("sb:Reviewers", "Hide section")}<span>Reviewers</span></div>${rvSection}`)}
  ${item("Assignees", head("Assignees") + assignees)}
  ${item("Labels", head("Labels") + labels)}
  ${item("Milestone", head("Milestone") + (p3.milestone ? `<a class="sb-link" href="${esc(p3.milestone.html_url)}">${esc(p3.milestone.title)}</a>` : '<span class="sb-none">No milestone</span>'))}
  <div class="sb-item${folded("sb:people")}"><div class="sb-head">${foldBtn("sb:people", "Hide section")}<span>${people.size} participant${people.size === 1 ? "" : "s"}</span></div><div class="participants">${[...people.values()].slice(0, 30).map((u4) => `<a href="${esc(u4.html_url)}" title="${esc(u4.login)}">${avatar(u4, 32)}</a>`).join("")}</div></div></div>`;
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
    } catch (e2) {
      store[k3] = String(e2).replace(/^Error: /, "");
    }
    render();
  }
  function setFr(r3) {
    S.fr = r3;
    S.dialog = "";
    render();
    loadFr();
  }
  function sinceReview(b2) {
    const cs = commitList(b2), mine = b2.timeline.filter((e2) => e2.event === "reviewed" && e2.user?.login === S.me && e2.commit_id);
    if (!S.me || !mine.length) return null;
    const at = cs.findIndex((c3) => c3.sha === mine[mine.length - 1].commit_id);
    return at < 0 ? null : { at, n: cs.length - 1 - at };
  }
  function commitsDialog() {
    const b2 = S.bundle, cs = commitList(b2), pick = S.cpick || S.fr, sr = sinceReview(b2);
    const on = (i3) => pick && i3 >= pick.a && i3 <= pick.b;
    const rows = cs.map((c3, i3) => `<label class="cp-row${on(i3) ? " on" : ""}" data-cp="${i3}"><input type="checkbox" ${on(i3) ? "checked" : ""} tabindex="-1"><span class="cp-t"><b>${esc(String(c3.message).split("\n")[0])}</b><i>${esc(c3.name || c3.author?.login || "")} committed ${when(c3.date).replace(/<\/?span[^>]*>/g, "")}</i></span><code>${esc(c3.sha.slice(0, 7))}</code></label>`).reverse().join("");
    const q3 = (S.cfilter || "").toLowerCase();
    return `<div class="dlg-bg" id="dlgbg"><div class="dlg cp-dlg"><div class="cp-h"><h2>Select commits to view</h2><button class="icon-btn" id="cpx" title="Close">${icon("x")}</button></div>
  <button class="cp-opt${S.fr ? "" : " on"}" id="cpall"><b>All commits</b><i>${cs.length} commit${cs.length === 1 ? "" : "s"}</i></button>
  ${sr ? `<button class="cp-opt${S.fr && S.fr.a === sr.at + 1 && S.fr.b === cs.length - 1 ? " on" : ""}" id="cpsince" ${sr.n ? "" : "disabled"}><b>Changes since your last review</b><i>${sr.n ? `${sr.n} commit${sr.n === 1 ? "" : "s"}` : "No new commits"}</i></button>` : ""}
  <div class="cp-sub">Select a commit, or click a second one to view the range between them</div>
  <input class="input cp-q" id="cpq" placeholder="Filter commits\u2026" value="${esc(S.cfilter || "")}">
  <div class="cp-list" id="cplist" data-q="${esc(q3)}">${rows}</div>
  <div class="btns"><span class="cp-sel">${pick ? pick.a === pick.b ? "1 commit selected" : `${pick.b - pick.a + 1} commits selected` : "Nothing selected"}</span><span class="sp"></span><button class="btn" id="cpcancel">Cancel</button><button class="btn primary" id="cpsave" ${pick ? "" : "disabled"}>Save</button></div></div></div>`;
  }
  function openCommits() {
    S.cpick = S.fr ? { ...S.fr } : null;
    S.cfilter = "";
    S.dialog = commitsDialog();
    render();
  }
  function filesView(b2) {
    const cs = commitList(b2), r3 = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = r3 && r3.a === r3.b;
    const label = !r3 ? `All commits <span class="counter">${cs.length}</span>` : single ? `Commit <code>${esc(cs[r3.a].sha.slice(0, 7))}</code>` : `${r3.b - r3.a + 1} commits <code>${esc(cs[r3.a].sha.slice(0, 7))}\u2026${esc(cs[r3.b].sha.slice(0, 7))}</code>`;
    const nav = single ? `<div class="seg-ctl"><button data-fstep="-1" ${r3.a <= 0 ? "disabled" : ""}>\u2039 Prev</button><button data-fstep="1" ${r3.a >= cs.length - 1 ? "disabled" : ""}>Next \u203A</button></div>` : "";
    const bar = `<div class="fc-bar"><button class="btn small" id="fcbtn" title="Choose which commits to view">${icon("git-commit")} ${label} \u25BE</button>${nav}${r3 ? `<span class="fc-t">${single ? esc(String(cs[r3.a].message).split("\n")[0]) : ""}</span><button class="link-btn" id="fcall">Show all commits</button>` : ""}</div>`;
    if (!r3) return bar + filesList(b2.files, true);
    const d3 = frDiff(b2);
    return bar + (d3 === void 0 || d3 === "loading" ? '<div class="diff-empty">Loading\u2026</div>' : typeof d3 === "string" ? `<div class="diff-empty err">${esc(d3)}</div>` : filesList(d3));
  }
  var b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === "open";
  function filesList(files, canComment = false) {
    if (!files.length) return '<div class="diff-empty">No files changed.</div>';
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
    const shown = (f4) => !S.fold["f:" + f4.filename];
    const srt = S.fileSort || "path", cnt = (f4) => (S.bundle?.review_comments || []).filter((c3) => c3.path === f4.filename && !c3.in_reply_to_id).length;
    const so = { path: null, pathz: (x3, y2) => y2.filename.localeCompare(x3.filename), most: (x3, y2) => y2.additions + y2.deletions - (x3.additions + x3.deletions), least: (x3, y2) => x3.additions + x3.deletions - (y2.additions + y2.deletions), comments: (x3, y2) => cnt(y2) - cnt(x3), status: (x3, y2) => String(x3.status).localeCompare(String(y2.status)) || x3.filename.localeCompare(y2.filename) };
    const srtFn = so[srt];
    if (srtFn) files = [...files].sort(srtFn);
    const all = files.every((f4) => S.fold["f:" + f4.filename]);
    return `<div class="files-bar"><div class="seg-ctl"><button class="${S.diffMode === "unified" ? "on" : ""}" data-dmode="unified">Unified</button><button class="${S.diffMode === "split" ? "on" : ""}" data-dmode="split">Split</button></div><select class="input fsort" id="fsort" title="Sort files">${[["path", "GitHub order"], ["pathz", "Path Z\u2013A"], ["most", "Most changed"], ["least", "Least changed"], ["comments", "Most comments"], ["status", "By status"]].map(([v2, t2]) => `<option value="${v2}" ${srt === v2 ? "selected" : ""}>${t2}</option>`).join("")}</select>${pendList().length ? `<button class="btn small primary" id="finishrev">Finish review \xB7 ${pendList().length} comment${pendList().length === 1 ? "" : "s"}</button>` : ""}<button class="link-btn" data-foldall="${all ? "open" : "close"}" data-files="${esc(files.map((f4) => f4.filename).join("\n"))}">${all ? "Expand all files" : "Collapse all files"}</button></div>` + files.map((f4, i3) => {
      const t2 = f4.additions + f4.deletions || 1, a3 = Math.round(f4.additions / t2 * 5), d3 = Math.min(5 - a3, Math.round(f4.deletions / t2 * 5));
      const sq = Array.from({ length: 5 }, (_3, i4) => `<i class="${i4 < a3 ? "a" : i4 < a3 + d3 ? "d" : ""}"></i>`).join("");
      return `<div class="file${folded("f:" + f4.filename)}"><div class="file-head" data-fold="f:${esc(f4.filename)}"><span class="tgl">${icon(S.fold["f:" + f4.filename] ? "chevron-right" : "chevron-down")}</span><span class="stat"><span class="a">+${f4.additions}</span> <span class="d">\u2212${f4.deletions}</span></span><span class="sq">${sq}</span><span class="path">${esc(f4.filename)}</span></div>${!shown(f4) ? "" : f4.patch ? diffTable(f4.patch, f4.filename, canComment && b0open()) : '<div class="diff-empty">Binary file or diff too large to display.</div>'}</div>`;
    }).join("");
  }
  function commitsView(b2) {
    const info = b2.commit_info || {};
    const c3 = b2.timeline.filter((e2) => e2.event === "committed");
    return `<div style="border:1px solid var(--borderColor-default);border-radius:6px">${c3.map((e2) => `<div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">${commitRow(e2.message, e2.sha, e2.author?.avatar_url ? e2.author : null, e2.html_url, e2.verification)}</div>`).join("") || '<div class="diff-empty">No commits listed.</div>'}</div>`;
  }
  function commitList(b2) {
    if (b2.commits && b2.commits.length) return b2.commits.map((c3) => ({ sha: c3.sha, message: c3.commit.message, author: c3.author, name: c3.commit.author?.name, date: c3.commit.author?.date, url: c3.html_url, parent: c3.parents?.[0]?.sha }));
    return b2.timeline.filter((e2) => e2.event === "committed").map((e2) => ({ sha: e2.sha, message: e2.message, author: e2.author?.avatar_url ? e2.author : null, name: e2.author?.name, date: e2.author?.date, url: e2.html_url }));
  }
  S.flip = localStorage.getItem("flip") === "1";
  function flipSides() {
    S.flip = !S.flip;
    localStorage.setItem("flip", S.flip ? "1" : "0");
    $(".split")?.classList.toggle("flip", S.flip);
  }
  function splitView(b2) {
    const cs = commitList(b2), sha = S.sel;
    const cnt = (c3) => b2.review_comments.filter((r3) => r3.original_commit_id === c3 || r3.commit_id === c3).length;
    const row = (c3) => `<div class="cm ${sha === c3.sha ? "on" : ""}" data-sha="${esc(c3.sha)}"><span class="cm-av">${c3.author ? avatar(c3.author, 24) : `<i>${esc((c3.name || "?")[0])}</i>`}</span><span class="cm-t"><b>${esc(String(c3.message).split("\n")[0])}</b><i>${esc(c3.name || c3.author?.login || "")} \xB7 ${when(c3.date).replace(/<\/?span[^>]*>/g, "")}</i></span>${cnt(c3.sha) ? `<span class="cm-n">${icon("comment")}${cnt(c3.sha)}</span>` : ""}<code>${esc(c3.sha.slice(0, 7))}</code></div>`;
    const all = `<div class="cm all ${sha ? "" : "on"}" data-sha=""><span class="cm-av"><i>${icon("diff")}</i></span><span class="cm-t"><b>All changes</b><i>${b2.pull.changed_files} files \xB7 +${b2.pull.additions} \u2212${b2.pull.deletions}</i></span></div>`;
    let diff;
    if (!sha) diff = filesList(b2.files, true);
    else {
      const d3 = S.cdiff[sha];
      diff = d3 === void 0 || d3 === "loading" ? '<div class="diff-empty">Loading commit\u2026</div>' : typeof d3 === "string" ? `<div class="diff-empty err">${esc(d3)}</div>` : filesList(d3);
    }
    const hl = S.hide.l, hr = S.hide.r;
    const rail = (k3, label, ic) => `<button class="pane-rail" data-show="${k3}" title="Show ${label}">${icon(ic)}<span>${label}</span></button>`;
    const left = hl ? rail("l", "Commits", "git-commit") : `<section class="pane pane-l"><div class="fold-sec${folded("cm-list")}"><div class="pane-h">${icon("git-commit")}<span>Commits</span><span class="counter">${cs.length}</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">\u21C4</button>${foldBtn("cm-list", "Collapse commit list")}<button class="fold-btn" data-hide="l" title="Hide this panel">${icon("x")}</button></div><div class="cm-list">${all}${cs.map(row).join("")}</div></div><div class="fold-sec${folded("cm-diff")}"><div class="pane-h sub">${icon("file-diff")}<span>${sha ? "Commit " + esc(sha.slice(0, 7)) : "All changes"}</span><span class="sp"></span>${foldBtn("cm-diff", "Collapse changes")}</div><div class="pane-body">${diff}</div></div></section>`;
    const right = hr ? rail("r", "Conversation", "comment-discussion") : `<section class="pane pane-r"><div class="pane-h">${icon("comment-discussion")}<span>Conversation</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">\u21C4</button><button class="fold-btn" data-hide="r" title="Hide this panel">${icon("x")}</button></div><div class="pane-body">${attention(b2)}${timeline(b2)}</div></section>`;
    return `<div class="split ${hl ? "hl" : ""} ${hr ? "hr" : ""} ${S.flip ? "flip" : ""}" style="--lw:${S.lw}%">${left}${hl || hr ? "" : '<div class="gutter" id="gutter" title="Drag to resize"></div>'}${right}</div>`;
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

  // src/app/render.ts
  var go = (n2) => {
    const t2 = S.hi + n2;
    if (t2 < 0 || t2 >= S.hist.length) return;
    S.hi = t2;
    S.hist[t2].startsWith("repo:") ? openRepo(S.hist[t2].slice(5), { nav: true }) : openPr(S.hist[t2], { nav: true });
  };

  // src/app/bind.ts
  S.alive = /* @__PURE__ */ new Map();
  var aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join("|");
  function stashCurrent() {
    S.openSeq = (S.openSeq || 0) + 1;
    const ref = S.view === "pr" && S.bundle ? curRef() : "", m2 = $(".main");
    if (!ref || !m2 || !m2.firstElementChild || !S.tabs.some((t2) => t2.ref === ref)) return;
    S.alive.set(ref, { el: m2, eds: S.eds || [], bundle: S.bundle, tab: S.tab, key: aliveKey(), scroll: m2.scrollTop });
    S.eds = [];
    while (S.alive.size > 6) S.alive.delete(S.alive.keys().next().value);
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
    const ti = S.tabs.find((t2) => t2.ref === ref);
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
    S.mainStub = true;
    render();
    S.mainStub = false;
    $(".main").replaceWith(a3.el);
    a3.el.scrollTop = a3.scroll;
    S.eds = a3.eds;
    bindSticky();
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
  function bind() {
    bindWrite();
    qa("[data-side]").forEach((el) => el.addEventListener("click", () => {
      S.sideTab = el.dataset.side;
      render();
    }));
    $("#mainfilter")?.addEventListener("input", (e2) => {
      S.pf = e2.target.value;
      const p3 = e2.target.selectionStart;
      render();
      const n2 = $("#mainfilter");
      n2.focus();
      n2.setSelectionRange(p3, p3);
    });
    [["#pfauthor", "pAuthor"], ["#pflabel", "pLabel"], ["#pfstatus", "pStatus"]].forEach(([id, k3]) => $(id)?.addEventListener("change", (e2) => {
      S[k3] = e2.target.value;
      render();
    }));
    $("#pfsort")?.addEventListener("change", (e2) => {
      S.psort = e2.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    });
    $("#pfclear")?.addEventListener("click", () => {
      S.pf = S.pAuthor = S.pLabel = S.pStatus = "";
      render();
    });
    $("#prfilter")?.addEventListener("input", (e2) => {
      S.pf = e2.target.value;
      const p3 = e2.target.selectionStart;
      render();
      const n2 = $("#prfilter");
      n2.focus();
      n2.setSelectionRange(p3, p3);
    });
    $("#prsort")?.addEventListener("change", (e2) => {
      S.psort = e2.target.value;
      localStorage.setItem("psort", S.psort);
      render();
    });
    $("#prgroup")?.addEventListener("change", (e2) => {
      S.pgroup = e2.target.value;
      localStorage.setItem("pgroup", S.pgroup);
      render();
    });
    qa("[data-sps]").forEach((el) => el.addEventListener("click", () => {
      S.prState = el.dataset.sps;
      loadPrs();
    }));
    $("#upd")?.addEventListener("click", async () => {
      const u4 = S.update;
      if (!u4 || u4.busy) return;
      u4.busy = true;
      render();
      try {
        await u4.obj.downloadAndInstall();
        await window.__TAURI__.process.relaunch();
      } catch (e2) {
        u4.busy = false;
        S.actErr = { k: "update", m: "Update failed: " + String(e2) };
        render();
      }
    });
    $("#addtoken")?.addEventListener("click", tokenDialog);
    qa("[data-hvis]").forEach((b2) => b2.addEventListener("click", () => {
      S.hmVis = b2.dataset.hvis;
      render();
    }));
    $("#hmsort")?.addEventListener("change", (e2) => {
      S.hmSort = e2.target.value;
      render();
    });
    $("#hmgroup")?.addEventListener("change", (e2) => {
      S.hmGroup = e2.target.value;
      render();
    });
    $("#fcbtn")?.addEventListener("click", openCommits);
    $("#fcall")?.addEventListener("click", () => setFr(null));
    qa("[data-fstep]").forEach((el) => el.addEventListener("click", () => {
      const cs = commitList(S.bundle), i3 = (S.fr?.a ?? 0) + Number(el.dataset.fstep);
      if (cs[i3]) setFr({ a: i3, b: i3 });
    }));
    if ($(".cp-dlg")) {
      const close = () => {
        S.dialog = "";
        S.cpick = null;
        render();
      };
      $("#cpx").onclick = close;
      $("#cpcancel").onclick = close;
      $("#cpall").onclick = () => setFr(null);
      $("#dlgbg").addEventListener("mousedown", (e2) => {
        if (e2.target.id === "dlgbg") close();
      });
      $("#cpsince") && ($("#cpsince").onclick = () => {
        const sr = sinceReview(S.bundle);
        if (sr?.n) setFr({ a: sr.at + 1, b: commitList(S.bundle).length - 1 });
      });
      $("#cpsave").onclick = () => {
        if (S.cpick) setFr({ ...S.cpick });
      };
      const filt = () => {
        const q3 = ($("#cpq").value || "").toLowerCase();
        S.cfilter = q3;
        qa(".cp-row").forEach((r3) => {
          r3.hidden = !!q3 && !r3.textContent.toLowerCase().includes(q3);
        });
      };
      $("#cpq").addEventListener("input", filt);
      filt();
      qa(".cp-row").forEach((row) => row.addEventListener("click", (e2) => {
        e2.preventDefault();
        const i3 = Number(row.dataset.cp), p3 = S.cpick;
        S.cpick = !p3 || p3.a !== p3.b ? { a: i3, b: i3 } : { a: Math.min(p3.a, i3), b: Math.max(p3.b, i3) };
        const keep2 = $("#cplist").scrollTop;
        S.dialog = commitsDialog();
        render();
        const l3 = $("#cplist");
        if (l3) l3.scrollTop = keep2;
      }));
    }
    $("#fsort")?.addEventListener("change", (e2) => {
      S.fileSort = e2.target.value;
      rerender();
    });
    $("#hmrfilter")?.addEventListener("input", (e2) => {
      S.recentFilter = e2.target.value;
      const p3 = e2.target.selectionStart;
      render();
      const n2 = $("#hmrfilter");
      n2.focus();
      n2.setSelectionRange(p3, p3);
    });
    qa("[data-rstate]").forEach((b2) => b2.addEventListener("click", () => {
      S.recentState = b2.dataset.rstate;
      render();
    }));
    $("#hmfilter")?.addEventListener("input", (e2) => {
      S.repoFilter = e2.target.value;
      const p3 = e2.target.selectionStart;
      render();
      const n2 = $("#hmfilter");
      n2.focus();
      n2.setSelectionRange(p3, p3);
    });
    $("#repofilter")?.addEventListener("input", (e2) => {
      S.repoFilter = e2.target.value;
      const p3 = e2.target.selectionStart;
      render();
      const n2 = $("#repofilter");
      n2.focus();
      n2.setSelectionRange(p3, p3);
    });
    qa("[data-home]").forEach((el) => el.addEventListener("click", () => {
      S.view = "home";
      S.homeOwner = "";
      S.nav = false;
      render();
    }));
    qa("[data-owner]").forEach((el) => el.addEventListener("click", () => {
      S.view = "home";
      S.homeOwner = el.dataset.owner;
      S.homeTab = "repos";
      S.nav = false;
      render();
      if (S.hasToken && !S.repos) loadRepos();
    }));
    qa("[data-htab]").forEach((el) => el.addEventListener("click", () => {
      S.homeTab = el.dataset.htab;
      render();
    }));
    qa("[data-repo]").forEach((el) => el.addEventListener("click", () => openRepo(el.dataset.repo)));
    qa("[data-ps]").forEach((el) => el.addEventListener("click", () => {
      S.prState = el.dataset.ps;
      openRepo(S.repo, { nav: true });
    }));
    $("#back")?.addEventListener("click", () => go(-1));
    $("#fwd")?.addEventListener("click", () => go(1));
    $("#reload")?.addEventListener("click", reload);
    $("#external")?.addEventListener("click", () => openExternal(S.bundle.pull.html_url));
    $("#mode")?.addEventListener("click", (e2) => {
      const btn = e2.currentTarget, r3 = btn.getBoundingClientRect(), x3 = r3.left + r3.width / 2, y2 = r3.top + r3.height / 2;
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
      const end = Math.hypot(Math.max(x3, innerWidth - x3), Math.max(y2, innerHeight - y2));
      document.documentElement.classList.add("vt");
      document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x3}px ${y2}px)`, `circle(${end}px at ${x3}px ${y2}px)`] }, { duration: 750, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }).finished.finally(() => document.documentElement.classList.remove("vt")));
    });
    $("#addr")?.addEventListener("submit", (e2) => {
      e2.preventDefault();
      openPr($("#addrinput").value);
      $("#addrinput").blur();
    });
    $("#signin")?.addEventListener("click", tokenDialog);
    $("#profbtn")?.addEventListener("click", (e2) => {
      e2.stopPropagation();
      const had = $(".prof-pop");
      $(".react-pop")?.remove();
      if (had) return;
      const pr = S.profile, pop = document.createElement("div");
      pop.className = "react-pop cm-pop prof-pop";
      pop.innerHTML = `<div class="pp-h"><img src="${esc(avUrl(pr.avatar_url, 80))}" alt=""><div><b>${esc(pr.name || pr.login)}</b><i>@${esc(pr.login)}</i></div></div><button data-h="profile">${icon("link-external")} Your GitHub profile</button><button data-h="token">${icon("key")} Access token\u2026</button><button data-h="out" class="danger">Sign out</button>`;
      const r3 = e2.currentTarget.getBoundingClientRect();
      pop.style.right = Math.max(8, innerWidth - r3.right) + "px";
      pop.style.top = r3.bottom + 6 + "px";
      pop.onclick = async (ev) => {
        const h3 = ev.target.closest("[data-h]")?.dataset.h;
        if (!h3) return;
        pop.remove();
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
      };
      document.body.appendChild(pop);
      setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }));
    });
    qa("[data-open]").forEach((el) => el.addEventListener("click", (e2) => {
      if (e2.target.closest("[data-rm], .np-act, .np-dot")) return;
      S.nav = false;
      S.focus = el.dataset.target || "";
      const nn = el.dataset.note && S.notes.find((x3) => String(x3.id) === el.dataset.note);
      if (nn) {
        nn.read = true;
        saveNotes();
      }
      if (e2.metaKey || e2.ctrlKey) {
        e2.preventDefault();
        openFromList(el.dataset.open, true);
      } else openFromList(el.dataset.open, false);
    }));
    qa("[data-open]").forEach((el) => el.addEventListener("auxclick", (e2) => {
      if (e2.button === 1) {
        e2.preventDefault();
        openFromList(el.dataset.open, true);
      }
    }));
    qa("[data-open]").forEach((el) => el.addEventListener("contextmenu", (e2) => {
      e2.preventDefault();
      e2.stopPropagation();
      $(".react-pop")?.remove();
      const ref = el.dataset.open, pop = document.createElement("div");
      pop.className = "react-pop cm-pop";
      pop.innerHTML = '<button data-h="new">Open in new tab</button><button data-h="here">Open</button><button data-h="link">Copy link</button>';
      pop.style.left = Math.min(e2.clientX, innerWidth - 180) + "px";
      pop.style.top = Math.min(e2.clientY, innerHeight - 120) + "px";
      pop.onclick = (ev) => {
        const h3 = ev.target.dataset.h;
        if (!h3) return;
        pop.remove();
        if (h3 === "new") openFromList(ref, true);
        else if (h3 === "here") openFromList(ref, false);
        else {
          const m2 = ref.match(/^(.+)#(\d+)$/);
          navigator.clipboard?.writeText(m2 ? `https://github.com/${m2[1]}/pull/${m2[2]}` : ref).catch(() => {
          });
        }
      };
      document.body.appendChild(pop);
      setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }));
    }));
    qa(".ptab").forEach((el) => {
      el.addEventListener("click", (e2) => {
        if (e2.target.closest(".pt-x")) return;
        const t2 = S.tabs[+el.dataset.tab];
        if (t2.ref !== curRef()) {
          if (fastTab(t2.ref)) return;
          stashCurrent();
          tabSnap();
          S.fadeMain = true;
          S.tabMenu = false;
          openPr(t2.ref, { nav: true, restore: t2.tab });
        }
      });
      el.addEventListener("auxclick", (e2) => {
        if (e2.button === 1) {
          e2.preventDefault();
          closeTab(+el.dataset.tab);
        }
      });
    });
    qa(".ptab").forEach((el) => el.addEventListener("mousedown", (e2) => {
      if (e2.button !== 0 || e2.target.closest(".pt-x")) return;
      const from = +el.dataset.tab, x0 = e2.clientX;
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
        to = tabs.reduce((best, t2, i3) => {
          const r3 = t2.getBoundingClientRect();
          return ev.clientX > r3.left + r3.width / 2 ? i3 : best;
        }, 0);
        tabs.forEach((t2, i3) => {
          if (t2 !== el) t2.style.transform = from < to && i3 > from && i3 <= to ? `translateX(-${el.offsetWidth}px)` : from > to && i3 < from && i3 >= to ? `translateX(${el.offsetWidth}px)` : "";
        });
      };
      const up = () => {
        removeEventListener("mousemove", mv);
        removeEventListener("mouseup", up);
        document.body.classList.remove("dragging");
        if (!moved) return;
        el.addEventListener("click", (c3) => c3.stopImmediatePropagation(), { capture: true, once: true });
        if (to !== from) {
          const [t2] = S.tabs.splice(from, 1);
          S.tabs.splice(to, 0, t2);
          saveTabs();
        }
        render();
      };
      addEventListener("mousemove", mv);
      addEventListener("mouseup", up);
    }));
    qa(".pt-x").forEach((el) => el.addEventListener("click", (e2) => {
      e2.stopPropagation();
      closeTab(+el.dataset.tabx);
    }));
    {
      const m2 = $(".pt-menu"), a3 = $("#tabadd");
      if (m2 && a3) {
        const r3 = a3.getBoundingClientRect();
        m2.style.top = r3.bottom + 4 + "px";
        m2.style.left = Math.min(r3.left, innerWidth - 350) + "px";
        m2.style.marginTop = "0";
      }
    }
    $("#tabadd")?.addEventListener("click", (e2) => {
      e2.stopPropagation();
      S.tabMenu = !S.tabMenu;
      rerender();
    });
    qa("[data-tabnew]").forEach((el) => el.addEventListener("click", () => openFromList(el.dataset.tabnew, true)));
    $("[data-tabhome]")?.addEventListener("click", () => {
      S.tabMenu = false;
      S.view = "home";
      render();
    });
    $("[data-tabreopen]")?.addEventListener("click", () => {
      S.tabMenu = false;
      reopenTab();
    });
    qa("[data-rm]").forEach((el) => el.addEventListener("click", (e2) => {
      e2.stopPropagation();
      S.recent = S.recent.filter((r3) => r3.ref !== el.dataset.rm);
      localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }));
    qa("[data-tab]:not(.ptab)").forEach((a3) => a3.addEventListener("click", () => {
      S.tab = a3.dataset.tab;
      render();
      $(".main").scrollTop = 0;
    }));
    $("#bell")?.addEventListener("click", (e2) => {
      e2.stopPropagation();
      setBell(!S.bell);
    });
    $("#retry")?.addEventListener("click", (ev) => {
      setBusy(ev.currentTarget, true);
      S.offline = navigator.onLine === false;
      reload();
    });
    qa("[data-compare]").forEach((b2) => b2.addEventListener("click", () => {
      const [repo, br] = b2.dataset.compare.split("@");
      openNewPr(repo, br);
    }));
    qa("[data-pdismiss]").forEach((b2) => b2.addEventListener("click", () => {
      pushDis[b2.dataset.pdismiss] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    }));
    $("#newprbtn")?.addEventListener("click", () => openNewPr());
    $("#npcancel")?.addEventListener("click", () => {
      S.view = S.bundle ? "pr" : "home";
      delete S.draft.newpr;
      render();
    });
    const npSet = (f4) => {
      f4();
      S.np.key = `${S.np.repo}|${S.np.base}|${S.np.head}`;
    };
    $("#nprepo")?.addEventListener("click", (e2) => bpOpen(e2.currentTarget, "repo", (v2) => {
      npSet(() => {
        S.np.repo = v2;
        S.np.base = "";
        S.np.head = "";
        S.np.cmp = null;
        S.np.titleTouched = false;
        S.np.title = "";
      });
      render();
      npLoadBranches(S.np.repo);
    }, true));
    $("#nprepoin")?.addEventListener("change", (e2) => {
      npSet(() => {
        S.np.repo = e2.target.value.trim();
        S.np.base = "";
        S.np.head = "";
      });
      npLoadBranches(S.np.repo);
    });
    $("#npbase")?.addEventListener("click", (e2) => bpOpen(e2.currentTarget, "base", (v2) => {
      npSet(() => {
        S.np.base = v2;
      });
      npCompare();
    }));
    $("#nphead")?.addEventListener("click", (e2) => bpOpen(e2.currentTarget, "head", (v2) => {
      npSet(() => {
        S.np.head = v2;
        S.np.titleTouched = false;
      });
      npCompare();
    }));
    $("#npswap")?.addEventListener("click", () => {
      npSet(() => {
        [S.np.base, S.np.head] = [S.np.head, S.np.base];
      });
      npCompare();
    });
    $("#nptpl")?.addEventListener("change", (e2) => {
      const n2 = S.np, t2 = n2.tpl[`${n2.repo}|${n2.base}`] || [], cur = (S.draft.newpr || "").trim(), next = e2.target.value === "" ? "" : t2[+e2.target.value].body;
      if (cur && cur !== n2.tplText.trim() && !confirm("Replace what you have written with this template?")) {
        e2.target.value = String(t2.findIndex((x3) => x3.body === n2.tplText));
        if (e2.target.value === "-1") e2.target.value = "";
        return;
      }
      S.draft.newpr = n2.tplText = next;
      saveDrafts();
      rerender();
    });
    $("#nptitle")?.addEventListener("input", (e2) => {
      S.np.title = e2.target.value;
      S.np.titleTouched = true;
      const ok = S.np.title.trim() && S.np.cmp && typeof S.np.cmp === "object" && S.np.cmp.ahead_by > 0 && S.np.base !== S.np.head;
      const b2 = $("#npcreate");
      if (b2 && !b2.classList.contains("is-busy")) b2.disabled = !ok;
    });
    $("#npdraft")?.addEventListener("change", (e2) => {
      S.np.draft = e2.target.checked;
      const b2 = $("#npcreate");
      if (b2) b2.textContent = S.np.draft ? "Create draft pull request" : "Create pull request";
    });
    bindNpMeta();
    $("#npcreate")?.addEventListener("click", async (e2) => {
      const n2 = S.np, btn = e2.currentTarget;
      setBusy(btn, true);
      n2.err = "";
      try {
        const nums = [...new Set(n2.issues.match(/\d+/g) || [])];
        const body = ((S.draft.newpr || "").trim() + (nums.length ? `

${nums.map((x3) => `Closes #${x3}`).join("\n")}` : "")).trim();
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
        setBusy(btn, false);
        n2.err = String(err).replace(/^Error: /, "");
        rerender();
      }
    });
    $("#inboxbtn")?.addEventListener("click", openInbox);
    $("#ibrefresh")?.addEventListener("click", () => loadInbox(true));
    $("#noteall")?.addEventListener("click", () => {
      S.bell = false;
      S.view = "notes";
      S.nav = false;
      render();
    });
    $("#npcheck")?.addEventListener("click", () => pollNotes());
    $("#npreadall")?.addEventListener("click", () => {
      S.notes.forEach((n2) => n2.read = true);
      saveNotes();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    $("#npclear")?.addEventListener("click", () => {
      S.notes = [];
      saveNotes();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    qa("[data-nf]").forEach((b2) => b2.addEventListener("click", () => {
      S.nf = b2.dataset.nf;
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }));
    qa("[data-nread]").forEach((b2) => b2.addEventListener("click", (e2) => {
      e2.stopPropagation();
      const n2 = S.notes.find((x3) => String(x3.id) === b2.dataset.nread);
      if (n2) {
        n2.read = !n2.read;
        saveNotes();
        S.keepScroll = true;
        render();
        S.keepScroll = false;
      }
    }));
    qa("[data-ndel]").forEach((b2) => b2.addEventListener("click", (e2) => {
      e2.stopPropagation();
      S.notes = S.notes.filter((x3) => String(x3.id) !== b2.dataset.ndel);
      saveNotes();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }));
    $("#notecheck")?.addEventListener("click", () => pollNotes());
    $("#noteclear")?.addEventListener("click", () => {
      S.notes = [];
      localStorage.setItem("notes", "[]");
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    qa(".note-panel [data-open]").forEach((el) => el.addEventListener("click", () => {
      S.bell = false;
      S.notes.forEach((n2) => n2.read = true);
      localStorage.setItem("notes", JSON.stringify(S.notes));
    }));
    const keep = (fn) => {
      S.keepScroll = true;
      fn();
      render();
      S.keepScroll = false;
    };
    {
      const els = [...qa(".TL [data-fold]")], l3 = $("#foldallconv span");
      if (l3 && els.length && els.every((x3) => isFolded(x3.dataset.fold, x3.dataset.def === "1"))) l3.textContent = "Expand all conversations";
    }
    $("#foldallconv")?.addEventListener("click", () => {
      const els = [...qa(".TL [data-fold]")];
      if (!els.length) return;
      const now = els.some((x3) => !isFolded(x3.dataset.fold, x3.dataset.def === "1"));
      els.forEach((x3) => {
        S.fold[x3.dataset.fold] = now;
        const box = x3.closest(".fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane");
        if (box) box.classList.toggle("folded", now);
        const svg = $("svg", x3);
        if (svg) svg.outerHTML = icon(now ? "chevron-right" : "chevron-down");
      });
      try {
        localStorage.setItem("fold", JSON.stringify(S.fold));
      } catch {
      }
      $("#foldallconv span").textContent = now ? "Expand all conversations" : "Collapse all conversations";
    });
    qa("[data-fold]").forEach((el) => el.addEventListener("click", (e2) => {
      e2.stopPropagation();
      if (e2.target.closest("a")) return;
      const k3 = el.dataset.fold, now = !isFolded(k3, el.dataset.def === "1");
      S.fold[k3] = now;
      localStorage.setItem("fold", JSON.stringify(S.fold));
      qa("[data-fold]").forEach((x3) => {
        if (x3.dataset.fold !== k3) return;
        const box2 = x3.closest(".fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane");
        if (box2) box2.classList.toggle("folded", now);
        const svg = $("svg", x3);
        if (svg) svg.outerHTML = icon(now ? "chevron-right" : "chevron-down");
      });
      if (!now && k3.startsWith("f:")) {
        const fb = el.closest(".file");
        if (fb && !$("table.diff, .diff-empty", fb)) {
          rerender();
          return;
        }
      }
      if (now) return;
      const box = el.closest(".fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane"), main = $(".main");
      if (!box || !main || !main.contains(box)) return;
      const r3 = box.getBoundingClientRect(), m2 = main.getBoundingClientRect();
      if (r3.bottom > m2.bottom - 8 || r3.top < m2.top) box.scrollIntoView({ block: r3.height > m2.height * 0.85 ? "start" : "center", behavior: "smooth" });
    }));
    qa("[data-foldall]").forEach((el) => el.addEventListener("click", () => keep(() => {
      el.dataset.files.split("\n").forEach((n2) => {
        S.fold["f:" + n2] = el.dataset.foldall === "close";
      });
      localStorage.setItem("fold", JSON.stringify(S.fold));
    })));
    qa("[data-hide]").forEach((el) => el.addEventListener("click", () => keep(() => {
      S.hide[el.dataset.hide] = true;
      localStorage.setItem("hide", JSON.stringify(S.hide));
    })));
    qa("[data-show]").forEach((el) => el.addEventListener("click", () => keep(() => {
      S.hide[el.dataset.show] = false;
      localStorage.setItem("hide", JSON.stringify(S.hide));
    })));
    qa("[data-who]").forEach((el) => el.addEventListener("click", () => keep(() => {
      const w3 = el.dataset.who;
      S.who = S.who.includes(w3) ? S.who.filter((x3) => x3 !== w3) : [...S.who, w3];
    })));
    qa("[data-whoclear]").forEach((el) => el.addEventListener("click", () => keep(() => {
      S.who = [];
    })));
    $("#navbtn")?.addEventListener("click", (e2) => {
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
      keep(() => {
        S.nav = !S.nav;
      });
    });
    $("#scrim")?.addEventListener("click", () => keep(() => {
      S.nav = false;
    }));
    $("#nextun")?.addEventListener("click", jumpUnresolved);
    $("#crange")?.addEventListener("change", (e2) => keep(() => {
      S.range = e2.target.value;
      if (S.range === "custom" && !S.rFrom && !S.rTo) {
        const d3 = (t2) => new Date(t2 - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
        S.rTo = d3(Date.now());
        S.rFrom = d3(Date.now() - 7 * 864e5);
      }
    }));
    $("#cfrom")?.addEventListener("change", (e2) => keep(() => {
      S.rFrom = e2.target.value;
    }));
    $("#cto")?.addEventListener("change", (e2) => keep(() => {
      S.rTo = e2.target.value;
    }));
    $("#csort")?.addEventListener("click", () => keep(() => {
      S.sort = S.sort === "desc" ? "asc" : "desc";
      localStorage.setItem("csort", S.sort);
    }));
    $("#unres")?.addEventListener("click", () => keep(() => {
      S.unres = !S.unres;
    }));
    (S.ios || []).forEach((o3) => o3.disconnect());
    S.ios = [];
    {
      const mn = $(".main");
      if (mn && S.view === "pr") {
        let raf = 0;
        mn.addEventListener("scroll", () => {
          if (S.restoring || raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            const t2 = S.tabs[tabIdx()];
            if (t2) {
              t2.scroll = mn.scrollTop;
              t2.tab = S.tab;
            }
          });
        }, { passive: true });
      }
    }
    bindSticky();
    $("#sidetoggle")?.addEventListener("click", () => keep(() => {
      S.hide.side = !S.hide.side;
      localStorage.setItem("hide", JSON.stringify(S.hide));
    }));
    qa("[data-flip]").forEach((b2) => b2.addEventListener("click", flipSides));
    $("#split")?.addEventListener("click", () => keep(() => {
      S.split = !S.split;
      localStorage.setItem("split", S.split ? "1" : "0");
    }));
    qa("[data-sha]").forEach((el) => el.addEventListener("click", () => selectCommit(el.dataset.sha)));
    $("#sbgrip")?.addEventListener("mousedown", (e2) => {
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
    $("#sbgrip")?.addEventListener("dblclick", () => {
      S.sbw = 260;
      localStorage.setItem("sbw", "260");
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    $("#gutter")?.addEventListener("mousedown", (e2) => {
      e2.preventDefault();
      const sp = $(".split"), r3 = sp.getBoundingClientRect();
      const mv = (ev) => {
        S.lw = Math.max(25, Math.min(75, (S.flip ? r3.right - ev.clientX : ev.clientX - r3.left) / r3.width * 100));
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
    });
    $("#rvtoggle")?.addEventListener("click", () => {
      S.showAllReviewers = !S.showAllReviewers;
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    $("#copybranch")?.addEventListener("click", () => navigator.clipboard?.writeText(S.bundle.pull.head.ref));
    qa("a[href]").forEach((a3) => a3.addEventListener("click", (e2) => {
      e2.preventDefault();
      const h3 = a3.getAttribute("href");
      if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h3)) openPr(h3);
      else if (/^https?:\/\//.test(h3)) openExternal(h3);
    }));
  }
  document.addEventListener("keydown", (e2) => {
    if (!(e2.metaKey || e2.ctrlKey)) {
      if (e2.key === "Escape" && S.dialog) {
        S.dialog = "";
        render();
      }
      return;
    }
    if (e2.key === "l") {
      e2.preventDefault();
      focusAddr();
    } else if (e2.key === "r") {
      e2.preventDefault();
      reload();
    } else if (e2.key === "[") {
      e2.preventDefault();
      go(-1);
    } else if (e2.key === "]") {
      e2.preventDefault();
      go(1);
    } else if (e2.key === ",") {
      e2.preventDefault();
      tokenDialog();
    }
  });
  function tokenDialog() {
    S.oauthHtml = "";
    S.oauthLive = false;
    S.dialog = "__TOKDLG__";
    render();
  }
  var tokDlgHtml = () => `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>GitHub classic token</h2><p>Use a <b>classic</b> personal access token with the <code>repo</code> scope. It lists all your repositories (including organization ones) and raises the rate limit to 5,000 requests per hour. Organization with SSO: after creating it, click <b>Configure SSO \u2192 Authorize</b>. Stored in your OS keychain. Leave empty and save to remove it.</p><div class="oauth-row"><button class="btn primary" id="oauthgo">Sign in with GitHub</button><span>or paste a token below</span></div><div id="oauthbox">${S.oauthHtml || ""}</div><p><a href="https://github.com/settings/tokens/new?scopes=repo&amp;description=Pullscope">Create a classic token (repo scope preselected) \u2197</a></p><input class="input" id="tokeninput" type="password" placeholder="ghp_\u2026" style="width:100%;box-sizing:border-box"><div class="btns"><button class="btn" id="tokcancel">Cancel</button><button class="btn primary" id="toksave">Save</button></div></div></div>`;
  function bindTokenDialog() {
    if (!$("#tokeninput")) return;
    $("#tokcancel").onclick = () => {
      S.oauthLive = false;
      S.dialog = "";
      render();
    };
    $("#toksave").onclick = async () => {
      const v2 = $("#tokeninput").value;
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
      S.dialog = "";
      render();
    };
    $("#oauthgo").onclick = async () => {
      const show = (h3) => {
        S.oauthHtml = h3;
        if (S.dialog) {
          render();
        }
      };
      $("#oauthgo").disabled = true;
      S.oauthLive = true;
      const me = S.oauthRun = (S.oauthRun || 0) + 1;
      try {
        const d3 = await tauri.invoke("device_start");
        show(`<div class="oauth-code"><span>Enter this code on GitHub</span><b>${esc(d3.user_code)}</b><small>Waiting for approval\u2026</small></div>`);
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
            S.dialog = "";
            loadRepos();
            return;
          }
        }
        throw "The code expired. Start again.";
      } catch (e2) {
        S.oauthLive = false;
        show(`<div class="err" style="margin:8px 0">${esc(String(e2))}</div>`);
      }
    };
  }

  // src/app/bindwrite.ts
  function homePage() {
    const tab = S.homeTab || "repos", owner = S.homeOwner || "";
    const tabs = `<div class="np-tabs"><button class="${tab === "repos" ? "sel" : ""}" data-htab="repos">${icon("repo")} Repositories${S.repos ? `<span>${S.repos.filter((r3) => !owner || r3.full_name.startsWith(owner + "/")).length}</span>` : ""}</button><button class="${tab === "recent" ? "sel" : ""}" data-htab="recent">${icon("clock")} Recent<span>${S.recent.length}</span></button></div>`;
    let body;
    if (tab === "recent") {
      const q3 = (S.recentFilter || "").toLowerCase(), st = S.recentState || "all";
      const list = S.recent.filter((r3) => (st === "all" || r3.state === st) && (!q3 || (r3.title + " " + r3.ref).toLowerCase().includes(q3)));
      const bar = S.recent.length ? `<div class="hm-fbar"><input class="input hm-filter" id="hmrfilter" placeholder="Filter by title or repo\u2026" value="${esc(S.recentFilter || "")}"><div class="seg-ctl">${["all", "open", "merged", "closed"].map((x3) => `<button class="${st === x3 ? "on" : ""}" data-rstate="${x3}">${x3[0].toUpperCase() + x3.slice(1)}</button>`).join("")}</div></div>` : "";
      body = bar + (list.length ? `<div class="hm-grid">${list.map((r3) => `<a class="hm-card" data-open="${esc(r3.ref)}"><span class="rc-i ${r3.state}">${icon(r3.icon)}</span><span class="hm-t"><b>${esc(r3.title)}</b><i>${esc(r3.ref)}</i></span><button class="rc-x" data-rm="${esc(r3.ref)}" title="Remove">${icon("x")}</button></a>`).join("")}</div>` : `<div class="diff-empty">${S.recent.length ? "No matching pull requests." : "Pull requests you open appear here."}</div>`);
    } else if (!S.hasToken) body = '<div class="diff-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="btn primary" id="addtoken">Add token</button></div>';
    else if (S.reposErr) body = `<div class="diff-empty err">${esc(S.reposErr)}</div>`;
    else if (!S.repos) body = '<div class="spinner" style="margin:48px auto">Loading repositories\u2026</div>';
    else {
      const f4 = (S.repoFilter || "").toLowerCase();
      const vis = S.hmVis || "all", srt = S.hmSort || "pushed", grp = S.hmGroup || "none";
      let list = S.repos.filter((r3) => (!owner || r3.full_name.startsWith(owner + "/")) && r3.full_name.toLowerCase().includes(f4) && (vis === "all" || vis === "private" === !!r3.private));
      const nm = (r3) => r3.full_name.split("/")[1], pushed = (r3) => Date.parse(r3.pushed_at || "0") || 0;
      const sorters = { name: (a3, b2) => nm(a3).localeCompare(nm(b2)), namez: (a3, b2) => nm(b2).localeCompare(nm(a3)), issues: (a3, b2) => (b2.open_issues_count || 0) - (a3.open_issues_count || 0) || nm(a3).localeCompare(nm(b2)), oldest: (a3, b2) => pushed(a3) - pushed(b2), owner: (a3, b2) => a3.full_name.localeCompare(b2.full_name), ownerz: (a3, b2) => b2.full_name.split("/")[0].localeCompare(a3.full_name.split("/")[0]) || nm(a3).localeCompare(nm(b2)) };
      const sorter = sorters[srt];
      if (sorter) list = [...list].sort(sorter);
      const card = (r3) => `<a class="hm-card" data-repo="${esc(r3.full_name)}"><span class="rc-i" style="color:var(--fgColor-muted)">${icon(r3.private ? "lock" : "repo")}</span><span class="hm-t"><b>${esc(r3.full_name.split("/")[1])}</b><i>${esc(r3.full_name.split("/")[0])}${r3.archived ? " \xB7 archived" : ""}${r3.open_issues_count ? ` \xB7 ${r3.open_issues_count} open` : ""}</i>${r3.description ? `<em>${esc(r3.description)}</em>` : ""}</span></a>`;
      let grid;
      if (!list.length) grid = '<div class="diff-empty">No matching repositories.</div>';
      else if (grp === "owner") {
        const by = /* @__PURE__ */ new Map();
        list.forEach((r3) => {
          const o3 = r3.full_name.split("/")[0];
          if (!by.has(o3)) by.set(o3, []);
          by.get(o3).push(r3);
        });
        grid = [...by].map(([o3, rs]) => `<h3 class="hm-grp">${esc(o3)}<span>${rs.length}</span></h3><div class="hm-grid">${rs.map(card).join("")}</div>`).join("");
      } else grid = `<div class="hm-grid">${list.map(card).join("")}</div>`;
      const opt = (v2, cur, t2) => `<option value="${v2}" ${cur === v2 ? "selected" : ""}>${t2}</option>`;
      body = `<div class="hm-fbar"><input class="input hm-filter" id="hmfilter" placeholder="Find a repository\u2026" value="${esc(S.repoFilter || "")}"><div class="seg-ctl">${["all", "public", "private"].map((x3) => `<button class="${vis === x3 ? "on" : ""}" data-hvis="${x3}">${x3[0].toUpperCase() + x3.slice(1)}</button>`).join("")}</div><select class="input" id="hmsort" title="Sort">${opt("pushed", srt, "Recently pushed")}${opt("oldest", srt, "Least recently pushed")}${opt("name", srt, "Name A\u2013Z")}${opt("namez", srt, "Name Z\u2013A")}${opt("owner", srt, "Owner A\u2013Z")}${opt("ownerz", srt, "Owner Z\u2013A")}${opt("issues", srt, "Most open issues")}</select><select class="input" id="hmgroup" title="Group">${opt("none", grp, "No grouping")}${opt("owner", grp, "Group by owner")}</select></div>` + grid;
    }
    return `<div class="notes-page hm-page"><div class="np-head"><h1>${icon("home")} ${owner ? esc(owner) : "Home"}</h1></div>
  <p class="hm-hint">Open a pull request: type <code>owner/repo#123</code> or paste a URL in the bar above.</p>${pushBanners() ? `<div class="push-wrap">${pushBanners()}</div>` : ""}${S.error ? `<div class="err">${esc(S.error)}</div>` : ""}${tabs}${body}</div>`;
  }

  // src/app/pages.ts
  var saveNotes = () => localStorage.setItem("notes", JSON.stringify(S.notes));
  function notesPage() {
    const f4 = S.nf || "all", unread = S.notes.filter((n2) => !n2.read).length;
    const list = S.notes.filter((n2) => f4 === "all" || (f4 === "unread" ? !n2.read : n2.read));
    const rows = list.map((n2) => `<div class="np-row ${n2.read ? "" : "new"}"><button class="np-dot" data-nread="${n2.id}" title="${n2.read ? "Mark as unread" : "Mark as read"}"></button>
    <a class="np-main" data-open="${esc(n2.ref)}" data-target="${esc(n2.target || "")}" data-note="${n2.id}"><b>${esc(n2.title)}</b><span>${esc(n2.text)}</span><i>${esc(n2.ref)} \xB7 ${when(n2.at).replace(/<\/?span[^>]*>/g, "")}</i></a>
    <button class="np-act" data-nread="${n2.id}">${n2.read ? "Mark unread" : "Mark read"}</button><button class="np-act del" data-ndel="${n2.id}" title="Delete">${icon("x")}</button></div>`).join("") || `<div class="note-empty np-empty">${f4 === "unread" ? "You are all caught up." : f4 === "read" ? "Nothing read yet." : "No notifications yet. New comments, commits and reviews on PRs you opened will show up here."}</div>`;
    return `<div class="notes-page"><div class="np-head"><h1>${icon("bell")} Notifications</h1><div class="np-tools"><button class="btn small" id="npcheck">Check now</button><button class="btn small" id="npreadall" ${unread ? "" : "disabled"}>Mark all as read</button><button class="btn small ghost" id="npclear" ${S.notes.length ? "" : "disabled"}>Clear all</button></div></div>
  <div class="np-tabs">${[["all", "All", S.notes.length], ["unread", "Unread", unread], ["read", "Read", S.notes.length - unread]].map(([k3, l3, c3]) => `<button class="${f4 === k3 ? "sel" : ""}" data-nf="${k3}">${l3}<span>${c3}</span></button>`).join("")}</div>
  <div class="np-list">${rows}</div></div>`;
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
  var npHuman = (s3) => s3.replace(/^[a-z]+\//i, "").replace(/[-_]+/g, " ").replace(/^./, (c3) => c3.toUpperCase());
  function newPrPage() {
    const n2 = S.np, repos = (S.repos || []).filter((r3) => !r3.archived), br = n2.branches[n2.repo];
    const opts = (list, cur) => list.map((x3) => `<option value="${esc(x3)}" ${x3 === cur ? "selected" : ""}>${esc(x3)}</option>`).join("");
    const repoSel = repos.length ? `<button type="button" class="sel bp-btn" id="nprepo"><span>${esc(n2.repo || "Choose a repository")}</span>${icon("chevron-down", 14)}</button>` : `<input class="input" id="nprepoin" placeholder="owner/repo" value="${esc(n2.repo)}">`;
    const same = n2.base && n2.base === n2.head;
    const cmp = n2.cmp === "loading" ? '<span class="np-note">Comparing\u2026</span>' : !n2.cmp ? "" : typeof n2.cmp === "string" ? `<span class="np-note err">${esc(n2.cmp)}</span>` : n2.cmp.ahead_by ? `<span class="np-note ok">${icon("git-commit")} ${n2.cmp.ahead_by} commit${n2.cmp.ahead_by === 1 ? "" : "s"} \xB7 ${n2.cmp.files} file${n2.cmp.files === 1 ? "" : "s"} changed${n2.cmp.behind_by ? ` \xB7 ${n2.cmp.behind_by} behind ${esc(n2.base)}` : ""}</span>` : '<span class="np-note err">These branches are identical \u2014 there is nothing to compare.</span>';
    const ready = n2.title.trim() && n2.repo && n2.base && n2.head && !same && n2.cmp && typeof n2.cmp === "object" && n2.cmp.ahead_by > 0;
    return `<div class="notes-page np-new"><div class="np-head"><h1>${icon("git-pull-request")} New pull request</h1></div>
  <div class="np-card"><div class="np-main-col">
    <div class="np-box"><label class="np-l">Repository</label>${repoSel}
    <div class="np-branches"><div><label class="np-l">Base <i>merge into</i></label><button type="button" class="sel bp-btn" id="npbase" data-bp="base" ${br ? "" : "disabled"}><span>${br ? esc(n2.base || "Choose a branch") : "Loading\u2026"}</span>${icon("chevron-down", 14)}</button></div>
      <button class="tb-btn" id="npswap" title="Swap base and head">\u21C4</button>
      <div><label class="np-l">Head <i>changes from</i></label><button type="button" class="sel bp-btn" id="nphead" data-bp="head" ${br ? "" : "disabled"}><span>${br ? esc(n2.head || "Choose a branch") : "Loading\u2026"}</span>${icon("chevron-down", 14)}</button></div></div>
    <div class="np-cmp">${same ? '<span class="np-note err">Base and head are the same branch.</span>' : cmp}</div></div>
    <div class="np-box"><label class="np-l">Title</label><input class="input" id="nptitle" placeholder="Title" value="${esc(n2.title)}"></div>
    <div class="np-box"><label class="np-l">Description</label>${(() => {
      const t2 = n2.tpl[`${n2.repo}|${n2.base}`];
      return t2 && t2.length > 1 ? `<select class="sel np-tpl" id="nptpl"><option value="">No template</option>${t2.map((x3, i3) => `<option value="${i3}" ${x3.body === n2.tplText ? "selected" : ""}>Template: ${esc(x3.name)}</option>`).join("")}</select>` : "";
    })()}${draftBox("newpr", "Describe your changes", 8)}</div>
    <div class="np-box"><label class="np-check"><input type="checkbox" id="npdraft" ${n2.draft ? "checked" : ""}> Create as draft <span>(not ready for review yet)</span></label>
    ${n2.err ? `<div class="act-err">${esc(n2.err)}</div>` : ""}
    <div class="np-btns"><button class="btn" id="npcancel">Cancel</button><button class="btn primary" id="npcreate" ${ready ? "" : "disabled"}>${n2.draft ? "Create draft pull request" : "Create pull request"}</button></div></div>
  </div><div class="np-side-col">${npMeta(n2)}</div></div></div>`;
  }
  function npMetaRefresh() {
    const el = $("#npmeta");
    if (!el) return rerender();
    el.outerHTML = npMeta(S.np);
    bindNpMeta();
  }
  function bindNpMeta() {
    qa("#npmeta [data-npadd]").forEach((el) => el.addEventListener("change", (e2) => {
      if (e2.target.value) {
        S.np[el.dataset.npadd].push(e2.target.value);
        npMetaRefresh();
      }
    }));
    qa("#npmeta [data-npdel]").forEach((el) => el.addEventListener("click", () => {
      const k3 = el.dataset.npdel;
      S.np[k3] = S.np[k3].filter((x3) => x3 !== el.dataset.v);
      npMetaRefresh();
    }));
    $("#npmile")?.addEventListener("change", (e2) => {
      S.np.milestone = e2.target.value;
    });
    $("#npissues")?.addEventListener("input", (e2) => {
      S.np.issues = e2.target.value;
    });
  }
  function npMeta(n2) {
    const m2 = n2.meta?.[n2.repo];
    if (!m2) return "";
    const ppl = m2.people.map((x3) => x3.login), me = S.me || "";
    const chips = (k3, label) => `<span class="np-chip" data-npdel="${k3}" data-v="${esc(label)}" title="Remove">${esc(label)} \xD7</span>`;
    const add = (k3, title, list) => {
      const free = list.filter((x3) => !n2[k3].includes(x3));
      return free.length ? `<select class="sel np-add" data-npadd="${k3}"><option value="">${title}</option>${free.map((x3) => `<option>${esc(x3)}</option>`).join("")}</select>` : "";
    };
    const row = (k3, name, list) => `<div class="np-meta"><label class="np-l">${name}</label><div class="np-chips">${n2[k3].map((x3) => chips(k3, x3)).join("")}${add(k3, `Add ${name.toLowerCase()}\u2026`, list)}</div></div>`;
    return `<div class="np-box np-metas" id="npmeta">${row("reviewers", "Reviewers", ppl.filter((x3) => x3 !== me))}${row("assignees", "Assignees", ppl)}${row("labels", "Labels", m2.labels.map((x3) => x3.name))}
    <div class="np-meta"><label class="np-l">Milestone</label><select class="sel" id="npmile"><option value="">None</option>${m2.milestones.map((x3) => `<option value="${x3.number}" ${String(n2.milestone) === String(x3.number) ? "selected" : ""}>${esc(x3.title)}</option>`).join("")}</select></div>
    <div class="np-meta"><label class="np-l">Linked issues <i>closed when this merges</i></label><input class="input" id="npissues" placeholder="e.g. 12, 15" value="${esc(n2.issues)}"></div></div>`;
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
    if (!b2.branches.includes(n2.head) || n2.head === n2.base) n2.head = b2.branches.find((x3) => x3 !== n2.base) || "";
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
    } catch (e2) {
      if (S.np.key !== key) return;
      n2.cmp = String(e2).replace(/^Error: /, "");
    }
    rerender();
  }
  function openNewPr(repo, head) {
    const cur = typeof repo === "string" && repo || S.bundle?.pull.base.repo.full_name || S.repo || "";
    S.view = "newpr";
    S.nav = false;
    S.np = { repo: cur, base: "", head: typeof head === "string" && head || "", branches: {}, meta: {}, reviewers: [], assignees: [], labels: [], milestone: "", issues: "", cmp: null, title: "", titleTouched: false, draft: false, err: "", key: "", tpl: {}, tplText: "" };
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
  function inboxPage() {
    const I2 = S.inbox || { loading: true }, d3 = I2.data;
    const row = (p3) => {
      const ref = `${p3.repo}#${p3.number}`, was = seen[ref]?.at, fresh = was && p3.updated_at > was;
      return `<a class="ib-row" data-open="${esc(ref)}"><img src="${esc(p3.avatar)}" alt=""><span class="ib-t"><b>${esc(p3.title)}</b><i>${esc(ref)} \xB7 ${esc(p3.user)} \xB7 ${when(p3.updated_at).replace(/<\/?span[^>]*>/g, "")}${p3.draft ? " \xB7 Draft" : ""}</i></span>${fresh ? '<span class="ib-new">New activity</span>' : ""}${p3.comments ? `<span class="ib-c">${icon("comment")} ${p3.comments}</span>` : ""}</a>`;
    };
    const sec = (title, sub, list) => `<section class="ib-sec"><h2>${title}<span>${list.length}</span></h2><p>${sub}</p>${list.length ? list.map(row).join("") : '<div class="ib-none">Nothing here. Nice.</div>'}</section>`;
    const body = I2.err ? `<div class="diff-empty err">${esc(I2.err)}</div>` : !d3 ? '<div class="skel"><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>' : sec("Review requested", "Waiting on you", d3.requested) + sec("Ready to merge", "Your approved pull requests", d3.ready) + sec("Your pull requests", "Open PRs you opened", d3.mine);
    return `<div class="notes-page"><div class="np-head"><h1>${icon("checklist")} Inbox</h1><div class="np-tools"><button class="btn small" id="ibrefresh" ${I2.loading ? "disabled" : ""}>${I2.loading ? "Loading\u2026" : "Refresh"}</button></div></div>${body}</div>`;
  }
  function page() {
    const b2 = S.bundle;
    if (S.loading) return `<div class="skel" aria-busy="true"><div class="sk sk-crumb"></div><div class="sk sk-title"></div><div class="sk sk-pill"></div><div class="sk sk-line w60"></div><div class="sk-tabs"><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>${[0, 1, 2].map((i3) => `<div class="sk-row" style="--i:${i3}"><div class="sk sk-av"></div><div class="sk-card"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div></div>`).join("")}</div>`;
    if (S.view === "newpr") return crumbs(S.np?.repo, [{ t: "New pull request" }]) + newPrPage();
    if (S.view === "inbox") return crumbs("", [{ t: "Inbox" }]) + inboxPage();
    if (S.view === "notes") return crumbs("", [{ t: "Notifications" }]) + notesPage();
    if (S.view === "repo") return crumbs(S.repo, [{ t: "Pull requests" }]) + prList();
    if (S.view === "home" || !b2) return crumbs("", S.homeOwner ? [{ t: S.homeOwner }] : []) + homePage();
    if (S.split && S.tab !== "files" && S.tab !== "checks" && S.tab !== "timeline") return `<div class="pr-page is-split">${repoHeader(b2.pull)}${prHeader(b2)}${splitView(b2)}</div>`;
    const body = S.tab === "files" ? filesView(b2) : S.tab === "commits" ? commitsView(b2) : S.tab === "checks" ? checksView(b2) : S.tab === "timeline" ? `<div class="rail">${timeline(b2)}</div>` : attention(b2) + timeline(b2);
    const side = S.tab !== "conversation" ? "" : S.hide.side ? `<button class="pane-rail side-rail" data-show="side" title="Show details">${icon("columns")}<span>Details</span></button>` : `<aside class="pr-side"><div class="side-top"><span>Details</span><button class="fold-btn" data-hide="side" title="Hide this panel">${icon("x")}</button></div>${sidebar(b2)}</aside>`;
    return `<div class="pr-page">${repoHeader(b2.pull)}${prHeader(b2)}<div class="pr-layout"><main class="pr-main">${body}</main>${side}</div></div>`;
  }
  var needSignIn = () => tauri && S.authChecked && !S.hasToken || new URLSearchParams(location.search).get("gate") === "1";
  function gateHtml() {
    return `<div class="gate"><div class="gate-card"><img src="logo.png" alt="" width="72" height="72"><h1>Sign in to Pullscope</h1>
  <p class="gate-err">${icon("alert")} No GitHub sign-in or token was found.</p>
  <p>Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing.</p>
  ${S.gateErr ? `<p class="gate-err">${esc(S.gateErr)}</p>` : ""}
  <div class="btns" style="justify-content:center"><button class="btn primary" id="gatego">Sign in with GitHub</button><button class="btn" id="gatetok">Use a token instead</button></div>
  <small>Tip: running <code>gh auth login</code> in a terminal also works.</small></div></div>`;
  }
  function render() {
    applyMode();
    if (needSignIn()) {
      (S.eds || []).forEach((e2) => e2.destroy());
      S.eds = [];
      S.lastHtml = "";
      $("#app").innerHTML = `${gateHtml()}${S.dialog === "__TOKDLG__" ? tokDlgHtml() : S.dialog || ""}`;
      $("#gatego")?.addEventListener("click", () => {
        tokenDialog();
        setTimeout(() => $("#oauthgo")?.click(), 50);
      });
      $("#gatetok")?.addEventListener("click", tokenDialog);
      bindTokenDialog();
      return;
    }
    const html2 = `${S.refreshing ? '<div class="refreshing-bar"></div>' : ""}${toolbar()}${offlineBar()}${tabStrip()}<div class="shell ${S.nav ? "nav-open" : ""} ${S.hide.nav ? "nav-hidden" : ""}" style="--sbw:${S.sbw}px">${sideRecent()}<div class="sb-grip" id="sbgrip" title="Drag to resize \xB7 double-click to reset"></div><div class="scrim" id="scrim"></div><div class="main">${S.mainStub ? "" : page()}</div></div>${S.dialog === "__TOKDLG__" ? tokDlgHtml() : S.dialog || ""}${notePanel()}`;
    const scroll = $(".main")?.scrollTop || 0;
    const viewKey = () => `${S.bundle?.pull?.id ?? ""}|${S.tab}|${$(".main > *")?.className ?? ""}`, before = viewKey();
    const same = () => viewKey() === before;
    let anchor = null;
    {
      const mn = $(".main");
      if (mn) {
        const top = mn.getBoundingClientRect().top;
        for (const el of mn.querySelectorAll("[id]")) {
          const r3 = el.getBoundingClientRect();
          if (r3.bottom > top + 4) {
            anchor = { id: el.id, off: r3.top - top };
            break;
          }
        }
      }
    }
    const inner = true ? [...qa(".pane-body, .cm-list, .sb-list")].map((e2) => [e2.parentElement.className + e2.className, e2.scrollTop]) : [];
    if (html2 === S.lastHtml && $("#app").firstElementChild && !S.fadeMain) return;
    (S.eds || []).forEach((e2) => e2.destroy());
    S.eds = [];
    $("#app").innerHTML = html2;
    S.lastHtml = html2;
    qa(".sb-list").forEach((e2) => {
      const m2 = inner.find(([k3]) => k3 === e2.parentElement.className + e2.className);
      if (m2) e2.scrollTop = m2[1];
    });
    if (S.keepScroll || same()) {
      $(".main").scrollTop = scroll;
      if (anchor) {
        const el = document.getElementById(anchor.id), mn = $(".main");
        if (el) mn.scrollTop += el.getBoundingClientRect().top - mn.getBoundingClientRect().top - anchor.off;
      }
      qa(".pane-body, .cm-list, .sb-list").forEach((e2) => {
        const m2 = inner.find(([k3]) => k3 === e2.parentElement.className + e2.className);
        if (m2) e2.scrollTop = m2[1];
      });
    }
    bind();
    bindTokenDialog();
    if (S.fadeMain) {
      S.fadeMain = false;
      $(".main")?.classList.add("tab-in");
    }
    if (S.busy && S.busySel) setBusy($(S.busySel), true);
    syncUnread();
    if (S.flashId && Date.now() < S.flashUntil) document.getElementById("c-" + S.flashId)?.classList.add("flash");
    else S.flashId = "";
    document.title = S.bundle ? `${S.bundle.pull.title} \xB7 ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : "GitHub PR View";
  }

  // src/app/addressbar.ts
  var AC = { rows: [], sel: -1, nav: false, prs: {} };
  function acRows(q3) {
    const t2 = q3.trim(), lq = t2.toLowerCase(), rows = [], seen2 = /* @__PURE__ */ new Set();
    const add = (r3) => {
      if (!seen2.has(r3.ref || r3.fill)) {
        seen2.add(r3.ref || r3.fill);
        rows.push(r3);
      }
    };
    if (/^https?:\/\//i.test(t2)) return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(t2) ? [{ ref: t2, label: "Open " + t2.replace(/^https?:\/\/github\.com\//, ""), sub: "Go to this pull request", ic: "git-pull-request" }] : [];
    const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);
    const known = [...S.tabs.map((x3) => ({ ref: x3.ref, title: x3.title, state: x3.state, ic: x3.icon })), ...S.recent.map((x3) => ({ ref: x3.ref, title: x3.title, state: x3.state, ic: x3.icon }))];
    if (pr) {
      const repo = pr[1], num = pr[2];
      if (num) add({ ref: `${t2.split("#")[0]}#${num}`, label: `Open ${t2.split("#")[0]}#${num}`, sub: "Go to this pull request", ic: "git-pull-request" });
      const fromApi = (AC.prs[repo] || []).map((x3) => ({ ref: `${x3.base?.repo?.full_name || repo}#${x3.number}`, title: x3.title, state: x3.merged_at ? "merged" : x3.state, ic: "git-pull-request" }));
      [...known.filter((x3) => x3.ref.toLowerCase().startsWith(repo + "#")), ...fromApi].filter((x3) => x3.ref.toLowerCase().split("#")[1].startsWith(num)).slice(0, 8).forEach((x3) => add({ ref: x3.ref, label: x3.title || x3.ref, sub: x3.ref, ic: x3.ic || "git-pull-request", state: x3.state }));
      return rows.slice(0, 9);
    }
    known.filter((x3) => !lq || `${x3.ref} ${x3.title}`.toLowerCase().includes(lq)).slice(0, lq ? 6 : 8).forEach((x3) => add({ ref: x3.ref, label: x3.title || x3.ref, sub: x3.ref, ic: x3.ic || "git-pull-request", state: x3.state }));
    if (lq && S.repos) S.repos.filter((r3) => r3.full_name.toLowerCase().includes(lq)).sort((a3, b2) => (b2.full_name.toLowerCase().startsWith(lq) ? 1 : 0) - (a3.full_name.toLowerCase().startsWith(lq) ? 1 : 0)).slice(0, 6).forEach((r3) => add({ fill: r3.full_name + "#", label: r3.full_name, sub: "Repository: pick a pull request", ic: r3.private ? "lock" : "repo" }));
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
      tauri.invoke("list_prs", { repo: m2[1], state: "all" }).then((r3) => {
        AC.prs[m2[1]] = r3;
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
        const r3 = e2.target.closest(".ac-row");
        if (r3) acPick(AC.rows[+r3.dataset.i]);
      });
    }
    const b2 = inp.closest(".addr").getBoundingClientRect();
    pop.style.left = b2.left + "px";
    pop.style.top = b2.bottom + 6 + "px";
    pop.style.width = b2.width + "px";
    pop.innerHTML = AC.rows.map((r3, i3) => `<div class="ac-row${i3 === AC.sel ? " on" : ""}" data-i="${i3}"><span class="ac-i ${r3.state || ""}">${icon(r3.ic)}</span><span class="ac-t"><b>${esc(r3.label)}</b><i>${esc(r3.sub)}</i></span></div>`).join("");
    $(".on", pop)?.scrollIntoView({ block: "nearest" });
  }
  function acPick(r3) {
    const inp = $("#addrinput");
    if (!r3 || !inp) return;
    if (r3.fill) {
      inp.value = r3.fill;
      inp.focus();
      AC.sel = -1;
      acDraw();
      return;
    }
    acClose();
    inp.blur();
    openPr(r3.ref);
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
      const r3 = AC.rows[Math.max(0, AC.sel)];
      if (r3.fill) acPick(r3);
      else {
        e2.target.value = r3.ref;
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
    const det = new Map((br.details || []).map((d3) => [d3.name, d3])), rank = new Map(br.branches.map((b2, i3) => [b2, i3]));
    const all = br.branches.map((name) => ({ name, at: det.get(name)?.at || "", by: det.get(name)?.by || "" })).sort((a3, b2) => b2.at > a3.at ? 1 : b2.at < a3.at ? -1 : rank.get(a3.name) - rank.get(b2.name));
    if (q3) {
      const t2 = q3.toLowerCase();
      return [["", all.filter((x3) => x3.name.toLowerCase().includes(t2))]];
    }
    const out = [], used = /* @__PURE__ */ new Set(), take = (f4) => all.filter((x3) => !used.has(x3.name) && f4(x3) && used.add(x3.name));
    const def = take((x3) => x3.name === br.default);
    if (def.length) out.push(["Default", def]);
    const mine = me ? take((x3) => x3.by && x3.by.toLowerCase() === me.toLowerCase()) : [];
    if (mine.length) out.push(["Your branches", mine]);
    const rest = take(() => true), pre = /* @__PURE__ */ new Map();
    rest.forEach((x3) => {
      const k3 = x3.name.includes("/") ? x3.name.split("/")[0] + "/" : "";
      (pre.get(k3) || pre.set(k3, []).get(k3)).push(x3);
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
      const t2 = q3.toLowerCase();
      return [["", all.filter((x3) => x3.name.toLowerCase().includes(t2))]];
    }
    const out = [], recent = all.slice(0, 5), used = new Set(recent.map((x3) => x3.name));
    if (recent.length) out.push(["Recently pushed", recent]);
    const by = /* @__PURE__ */ new Map();
    all.filter((x3) => !used.has(x3.name)).forEach((x3) => {
      const o3 = x3.name.split("/")[0];
      (by.get(o3) || by.set(o3, []).get(o3)).push(x3);
    });
    [...by.entries()].sort((a3, b2) => +(b2[0].toLowerCase() === me.toLowerCase()) - +(a3[0].toLowerCase() === me.toLowerCase()) || b2[1].length - a3[1].length).forEach(([o3, l3]) => out.push([o3, l3]));
    return out;
  }
  function bpOpen(btn, side, pick, repoMode = false) {
    bpClose();
    const n2 = S.np, br = repoMode ? null : n2.branches[n2.repo];
    if (!repoMode && !br) return;
    const cur = repoMode ? n2.repo : n2[side], me = S.profile?.login || "", r3 = btn.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.id = "bppop";
    pop.className = "bp-pop";
    const w3 = Math.max(r3.width, 340);
    pop.style.cssText = `left:${Math.max(8, Math.min(r3.left, innerWidth - w3 - 8))}px;width:${w3}px;`;
    pop.innerHTML = `<input class="bp-q" placeholder="${repoMode ? "Filter repositories\u2026" : "Filter branches\u2026"}" spellcheck="false"><div class="bp-list"></div>`;
    document.body.appendChild(pop);
    const below = innerHeight - r3.bottom, up = below < 300 && r3.top > below;
    pop.style.maxHeight = Math.min(420, (up ? r3.top : below) - 16) + "px";
    if (up) pop.style.bottom = innerHeight - r3.top + 4 + "px";
    else pop.style.top = r3.bottom + 4 + "px";
    const q3 = $(".bp-q", pop), list = $(".bp-list", pop);
    let act3 = 0, rows = [];
    const draw = () => {
      const groups = repoMode ? rpGroups(S.repos || [], q3.value.trim(), me) : bpGroups(br, q3.value.trim(), me);
      rows = groups.flatMap(([, l3]) => l3);
      act3 = Math.max(0, Math.min(act3, rows.length - 1));
      let i3 = 0;
      list.innerHTML = groups.length && rows.length ? groups.map(([h3, l3]) => `${h3 ? `<div class="bp-h">${esc(h3)}<span>${l3.length}</span></div>` : ""}${l3.map((x3) => `<div class="bp-r${i3++ === act3 ? " act" : ""}${x3.name === cur ? " cur" : ""}" data-b="${esc(x3.name)}"><span class="bp-ck">${x3.name === cur ? "\u2713" : ""}</span><span class="bp-n">${esc(x3.name)}</span>${x3.by ? `<span class="bp-by">${esc(x3.by)}</span>` : ""}<span class="bp-t">${bpAge(x3.at)}</span></div>`).join("")}`).join("") : '<div class="bp-empty">No matches</div>';
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
  function focusAddr() {
    const i3 = $("#addrinput");
    i3?.focus();
    i3?.select();
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
  function bindSticky() {
    const ta = $(".pr-title-area"), tb = $(".pr-tabs");
    if (ta && tb && !$(".is-split")) {
      const io = new IntersectionObserver(([en]) => tb.classList.toggle("stuck", !en.isIntersecting && en.boundingClientRect.bottom < 0), { root: $(".main"), threshold: 0 });
      io.observe(ta);
      S.ios.push(io);
    }
  }

  // src/app/keyboard.ts
  var typing = (t2) => t2 && (t2.closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || t2.isContentEditable);
  var kbItems = () => [...qa(".main .tl-comment, .main .tc")].filter((e2) => e2.offsetParent);
  function kbGo(el) {
    if (!el) return;
    qa(".kb").forEach((x3) => x3.classList.remove("kb"));
    el.classList.add("kb");
    S.kbId = el.id;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  var kbCur = () => S.kbId && document.getElementById(S.kbId) || null;
  function kbStep(dir, pick = kbItems) {
    const items = pick(), cur = kbCur();
    if (!items.length) return;
    let i3 = cur ? items.indexOf(cur) : -1;
    if (i3 === -1 && cur) i3 = items.findIndex((e2) => cur.compareDocumentPosition(e2) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
    kbGo(items[Math.min(items.length - 1, Math.max(0, i3 + dir))]);
  }
  var openThreads = () => [...qa(".main .thread")].filter((t2) => !$(".thread-head .res", t2) && t2.offsetParent).map((t2) => $(".tc", t2)).filter(Boolean);
  function openPalette() {
    if ($(".palette")) return;
    const el = document.createElement("div");
    el.className = "dlg-bg palette";
    el.innerHTML = '<div class="dlg pal"><input class="pal-in" placeholder="Jump to a pull request \u2014 owner/repo#123, a URL, or search recent\u2026" autofocus><div class="pal-list"></div></div>';
    document.body.appendChild(el);
    const inp = $("input", el), list = $(".pal-list", el);
    let sel = 0, rows = [];
    const draw = () => {
      const q3 = inp.value.trim().toLowerCase();
      rows = S.recent.filter((r3) => !q3 || `${r3.ref} ${r3.title}`.toLowerCase().includes(q3)).slice(0, 8).map((r3) => ({ ref: r3.ref, label: r3.title, sub: r3.ref }));
      if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q3)) rows.unshift({ ref: inp.value.trim(), label: `Open ${inp.value.trim()}`, sub: "Go to this pull request" });
      sel = Math.min(sel, Math.max(0, rows.length - 1));
      list.innerHTML = rows.map((r3, i3) => `<div class="pal-row${i3 === sel ? " on" : ""}" data-i="${i3}"><b>${esc(r3.label)}</b><i>${esc(r3.sub)}</i></div>`).join("") || '<div class="pal-none">No matches</div>';
    };
    const go2 = (r3) => {
      el.remove();
      if (r3) {
        S.nav = false;
        S.focus = "";
        openPr(r3.ref);
      }
    };
    inp.addEventListener("input", () => {
      sel = 0;
      draw();
    });
    inp.addEventListener("keydown", (e2) => {
      if (e2.key === "Escape") el.remove();
      else if (e2.key === "ArrowDown") {
        sel = Math.min(rows.length - 1, sel + 1);
        draw();
        e2.preventDefault();
      } else if (e2.key === "ArrowUp") {
        sel = Math.max(0, sel - 1);
        draw();
        e2.preventDefault();
      } else if (e2.key === "Enter") go2(rows[sel]);
    });
    list.addEventListener("mousedown", (e2) => {
      const r3 = e2.target.closest(".pal-row");
      if (r3) go2(rows[+r3.dataset.i]);
    });
    el.addEventListener("mousedown", (e2) => {
      if (e2.target === el) el.remove();
    });
    draw();
    inp.focus();
  }
  function setComposer(open, focus) {
    const el = document.getElementById("composer");
    if (!el) return false;
    S.cOpen = open;
    el.classList.toggle("collapsed", !open);
    if (open && focus) {
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
  function showHelp() {
    if ($(".palette")) return;
    const el = document.createElement("div");
    el.className = "dlg-bg palette";
    const k3 = (a3, b2) => `<div class="kb-r"><span>${a3}</span><kbd>${b2}</kbd></div>`;
    el.innerHTML = `<div class="dlg pal"><h2>Keyboard shortcuts</h2>${k3("Jump to any pull request", "\u2318 K")}${k3("Next / previous comment", "j / k")}${k3("Next / previous unresolved thread", "] / [")}${k3("Reply to the selected comment", "r")}${k3("Write a comment (docked at the bottom)", "c")}${k3("New pull request", "n")}${k3("New tab / close tab / reopen closed", "\u2318T \xB7 \u2318W \xB7 \u2318\u21E7T")}${k3("Go to tab 1\u20139 / next tab", "\u23181\u20139 \xB7 \u2303Tab")}${k3("Open a PR in a new tab", "\u2318-click")}${k3("Turn Split view on / off", "s")}${k3("Swap the two sides of Split view", "f")}${k3("Diff: unified \u21C4 side-by-side", "d")}${k3("Show this help", "?")}${k3("Close dialogs and menus", "Esc")}</div>`;
    document.body.appendChild(el);
    el.addEventListener("mousedown", () => el.remove());
    const esc2 = (e2) => {
      if (e2.key === "Escape") {
        el.remove();
        removeEventListener("keydown", esc2);
      }
    };
    addEventListener("keydown", esc2);
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
      const k3 = e2.key.toLowerCase();
      if (k3 === "t" && !e2.shiftKey) {
        e2.preventDefault();
        S.tabMenu = !S.tabMenu;
        if (!S.tabs.length) S.tabMenu = true;
        rerender();
        return;
      }
      if (k3 === "t" && e2.shiftKey) {
        e2.preventDefault();
        reopenTab();
        return;
      }
      if (k3 === "w" && S.tabs.length && tabIdx() >= 0) {
        e2.preventDefault();
        closeTab(tabIdx());
        return;
      }
      if (/^[1-9]$/.test(k3) && S.tabs[+k3 - 1]) {
        e2.preventDefault();
        openTab(S.tabs[+k3 - 1].ref);
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
    const s3 = /* @__PURE__ */ new Set();
    [b2.pull.user, ...b2.timeline.map((e2) => e2.user || e2.actor || e2.author), ...b2.review_comments.map((c3) => c3.user)].forEach((u4) => u4?.login && s3.add(u4.login));
    return [...s3];
  };
  var drafts = load("drafts", {});
  function saveDrafts() {
    if (!S.draftRef) return;
    const d3 = Object.fromEntries(Object.entries(S.draft).filter(([, v2]) => v2 && v2.trim()));
    if (Object.keys(d3).length) drafts[S.draftRef] = d3;
    else delete drafts[S.draftRef];
    try {
      localStorage.setItem("drafts", JSON.stringify(drafts));
    } catch {
    }
  }
  var prRef = () => ({ repo: S.bundle.pull.base.repo.full_name, number: S.bundle.pull.number });
  var draftBox = (key, ph, rows = 4) => `<div class="tt" data-draft="${key}" data-ph="${esc(ph)} \u2014 type / for blocks" style="--rows:${rows}"></div>`;
  var errLine = (k3) => S.actErr && S.actErr.k === k3 ? `<div class="act-err">${esc(S.actErr.m)}</div>` : "";
  function composer(b2) {
    const p3 = b2.pull, closed = p3.state === "closed", busy = S.busy === "comment";
    const open = busy || S.cOpen === true, dr = (S.draft.comment || "").trim();
    return `<div class="composer dock${open ? "" : " collapsed"}" id="composer"><div class="composer-h" id="cbar" role="button" tabindex="0" title="Write a comment (C)">${icon("comment")}<b>Add a comment</b><span class="cbar-ph">${dr ? `Draft: ${esc(dr.replace(/\s+/g, " ").slice(0, 60))}` : "Write a comment\u2026"}</span><kbd>C</kbd><span class="cbar-x">${icon("chevron-down")}</span></div>
  <div class="composer-body">${draftBox("comment", "Write a comment\u2026 (Markdown supported)")}${errLine("comment")}
  <div class="composer-f"><span class="hint">\u2318\u21B5 to send \xB7 Esc to collapse</span><span style="flex:1"></span>
  ${p3.merged ? "" : `<button class="btn ghost" id="doclose">${closed ? "Reopen pull request" : "Close pull request"}</button>`}
  <button class="btn primary" id="docomment" ${busy ? "disabled" : ""}>${busy ? "Sending\u2026" : "Comment"}</button></div></div></div>`;
  }
  function mergeActions(b2) {
    const p3 = b2.pull;
    if (p3.merged || p3.state === "closed") return "";
    const busy = S.busy === "merge", am = p3.auto_merge, blocked = p3.mergeable_state !== "clean" && p3.mergeable_state !== "unstable";
    const opts = (sel) => [["merge", "Create a merge commit"], ["squash", "Squash and merge"], ["rebase", "Rebase and merge"]].map(([v2, t2]) => `<option value="${v2}" ${sel === v2 ? "selected" : ""}>${t2}</option>`).join("");
    const cur = am ? { MERGE: "merge", SQUASH: "squash", REBASE: "rebase" }[am.merge_method] || "merge" : "merge";
    if (p3.draft) return `<div class="merge-act"><button class="btn ghost" id="doclose">Close pull request</button>${errLine("merge")}</div>`;
    return `<div class="merge-act"><select class="sel" id="mmethod">${opts(cur)}</select><button class="btn primary" id="domerge" ${busy ? "disabled" : ""}>${busy ? "Merging\u2026" : "Merge pull request"}</button>
  ${am ? `<button class="btn" id="noauto" title="Auto-merge is on (${esc(am.merge_method.toLowerCase())})">${S.busy === "disable_automerge" ? "Turning off\u2026" : "Disable auto-merge"}</button>` : blocked ? `<button class="btn" id="doauto" title="Merge automatically once required checks and reviews pass">${S.busy === "automerge" ? "Enabling\u2026" : "Enable auto-merge"}</button>` : ""}
  <button class="btn ghost" id="todraft" title="Mark as draft again">Convert to draft</button>${errLine("merge")}${errLine("automerge")}</div>`;
  }
  function reviewDialog() {
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Finish your review</h2>${draftBox("review", pendList().length ? `Leave a review comment (${pendList().length} line comment${pendList().length === 1 ? "" : "s"} will be included)` : "Leave a review comment (required unless approving)", 5)}
  <div class="radios"><label><input type="radio" name="rev" value="COMMENT" checked> <b>Comment</b> <span>Submit general feedback without explicit approval.</span></label>
  <label><input type="radio" name="rev" value="APPROVE"> <b>Approve</b> <span>Submit feedback and approve merging these changes.</span></label>
  <label><input type="radio" name="rev" value="REQUEST_CHANGES"> <b>Request changes</b> <span>Submit feedback that must be addressed before merging.</span></label></div>
  <div id="reverr"></div><div class="btns"><button class="btn" id="revcancel">Cancel</button><button class="btn primary" id="revsubmit">Submit review</button></div></div></div>`;
    render();
    $("#revcancel").onclick = () => {
      S.dialog = "";
      render();
    };
    $("#revsubmit").onclick = async () => {
      const ev = $("input[name=rev]:checked").value;
      const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
      const r3 = await act("review", { body: S.draft.review || "", event: ev, extra: lines }, "review", true);
      if (r3 === void 0) return;
      delete S.draft.review;
      delete S.pending[pendKey()];
      savePending();
      S.dialog = "";
      await refreshPr();
    };
  }
  function editPrDialog() {
    const p3 = S.bundle.pull;
    S.draft.prbody = p3.body || "";
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit pull request</h2><label class="np-l">Title</label><input class="input" id="eptitle" value="${esc(p3.title)}" style="width:100%;box-sizing:border-box;height:34px"><label class="np-l">Description</label>${draftBox("prbody", "Describe your changes", 8)}<div id="reverr">${errLine("editpr")}</div><div class="btns"><button class="btn" id="epcancel">Cancel</button><button class="btn primary" id="epsave">Save</button></div></div></div>`;
    render();
    $("#epcancel").onclick = () => {
      delete S.draft.prbody;
      S.dialog = "";
      render();
    };
    $("#epsave").onclick = async () => {
      const title = $("#eptitle").value;
      const r3 = await act("edit", { body: S.draft.prbody ?? "", extra: { title } }, "editpr", true);
      if (r3 === void 0) return;
      delete S.draft.prbody;
      S.dialog = "";
      await refreshPr();
    };
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
    const show = async (mode) => {
      tabs.querySelectorAll("button").forEach((b2) => b2.classList.toggle("on", b2.dataset.pv === mode));
      const prev = mode === "preview";
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
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btns"><button class="btn" id="cfcancel">Cancel</button><button class="btn ${danger ? "danger" : "primary"}" id="cfok">${esc(label)}</button></div></div></div>`;
    render();
    $("#cfcancel").onclick = () => {
      S.dialog = "";
      render();
    };
    $("#cfok").onclick = async () => {
      S.dialog = "";
      render();
      await fn();
    };
  }
  document.addEventListener("click", (e2) => {
    S.lastBtn = e2.target.closest?.("button") || null;
  }, true);
  var btnSel = (b2) => {
    if (b2.id) return "#" + b2.id;
    const a3 = [...b2.attributes].find((x3) => x3.name.startsWith("data-"));
    return a3 ? `button[${a3.name}="${CSS.escape(a3.value)}"]` : null;
  };
  var setBusy = (b2, on) => {
    if (!b2) return;
    b2.classList.toggle("is-busy", on);
    b2.disabled = on;
    b2.setAttribute("aria-busy", on ? "true" : "false");
  };
  S.mine = {};
  var getMine = (kind, rid) => S.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke("my_reactions", { ...prRef(), kind, id: +rid }).then((l3) => new Set(l3)).catch(() => {
    delete S.mine[`${kind}:${rid}`];
    return /* @__PURE__ */ new Set();
  }) : Promise.resolve(/* @__PURE__ */ new Set());
  async function toggleReact(kind, rid, c3) {
    const mine = (await getMine(kind, rid)).has(c3);
    const b2 = S.bundle, tgt = kind === "pr" ? b2.pull : [...b2.timeline, ...b2.review_comments].find((x3) => String(x3.id) === String(rid));
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
      if (inDialog) $("#reverr").innerHTML = `<div class="act-err">${S.actErr.m}</div>`;
      else render();
      return void 0;
    }
    S.busy = key;
    if (!inDialog) render();
    try {
      const r3 = action === "react" ? await tauri.invoke("toggle_reaction", { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri.invoke("pr_action", { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
      S.busy = "";
      if (action === "merge" || action === "review" && args.event === "APPROVE") confetti();
      return r3 ?? {};
    } catch (e2) {
      S.busy = "";
      S.actErr = { k: key, m: String(e2).replace(/^Error: /, "") };
      if (inDialog) {
        const el = $("#reverr");
        if (el) el.innerHTML = `<div class="act-err">${esc(S.actErr.m)}</div>`;
      } else render();
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
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit comment</h2>${draftBox("editc", "Edit your comment", 6)}<div id="reverr">${errLine("editc")}</div><div class="btns"><button class="btn" id="eccancel">Cancel</button><button class="btn primary" id="ecsave">Save</button></div></div></div>`;
    render();
    $("#eccancel").onclick = () => {
      delete S.draft.editc;
      S.dialog = "";
      render();
    };
    $("#ecsave").onclick = async () => {
      const r3 = await act("edit_comment", { id: c3.id, kind, body: S.draft.editc ?? "" }, "editc", true);
      if (r3 === void 0) return;
      delete S.draft.editc;
      S.dialog = "";
      await refreshPr(c3.id);
    };
  }
  function deleteCommentDialog(c3, kind) {
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Delete this comment?</h2><p style="color:var(--fgColor-muted)">This can't be undone.</p><div id="reverr">${errLine("delc")}</div><div class="btns"><button class="btn" id="dccancel">Cancel</button><button class="btn danger" id="dcdo">Delete</button></div></div></div>`;
    render();
    $("#dccancel").onclick = () => {
      S.dialog = "";
      render();
    };
    $("#dcdo").onclick = async () => {
      const r3 = await act("delete_comment", { id: c3.id, kind }, "delc", true);
      if (r3 === void 0) return;
      S.dialog = "";
      await refreshPr();
    };
  }
  function hideCommentDialog(c3) {
    const reasons = [["SPAM", "Spam"], ["ABUSE", "Abuse"], ["OFF_TOPIC", "Off-topic"], ["OUTDATED", "Outdated"], ["DUPLICATE", "Duplicate"], ["RESOLVED", "Resolved"]];
    S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Hide this comment</h2><label class="np-l">Reason</label><select class="sel" id="hcreason" style="width:100%;height:34px">${reasons.map(([v2, l3]) => `<option value="${v2}" ${v2 === "OUTDATED" ? "selected" : ""}>${l3}</option>`).join("")}</select><div id="reverr">${errLine("hidec")}</div><div class="btns"><button class="btn" id="hccancel">Cancel</button><button class="btn primary" id="hcdo">Hide comment</button></div></div></div>`;
    render();
    $("#hccancel").onclick = () => {
      S.dialog = "";
      render();
    };
    $("#hcdo").onclick = async () => {
      const r3 = await act("minimize", { body: c3.node_id || "", content: $("#hcreason").value }, "hidec", true);
      if (r3 === void 0) return;
      S.fold["c:" + c3.id] = true;
      localStorage.setItem("fold", JSON.stringify(S.fold));
      S.dialog = "";
      await refreshPr();
    };
  }
  function cmAction(id, root, how) {
    const b2 = S.bundle, c3 = [...b2.timeline, ...b2.review_comments].find((x3) => String(x3.id) === String(id)) || (String(b2.pull.id) === String(id) ? b2.pull : null);
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
    S.eds = [];
    S.keepScroll = true;
    render();
    S.keepScroll = false;
    setTimeout(() => $(`[data-draft="${key}"]`)?.scrollIntoView({ block: "center" }), 50);
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
    const el = document.getElementById("c-" + r3.id);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash", "pop-in");
    }
    return true;
  }
  function setBell(open) {
    S.bell = open;
    $(".note-panel")?.classList.toggle("open", open);
    if (!open && S.notes.some((n2) => !n2.read)) {
      S.notes.forEach((n2) => n2.read = true);
      saveNotes();
      qa(".note-panel .note.new").forEach((el) => el.classList.remove("new"));
      $("#bell .dot")?.remove();
    }
  }
  document.addEventListener("mousedown", (e2) => {
    if (!S.bell || e2.target.closest(".note-panel, #bell")) return;
    setBell(false);
  });
  document.addEventListener("keydown", (e2) => {
    if (e2.key === "Escape" && S.bell) setBell(false);
  });
  var rerender = () => {
    S.keepScroll = true;
    render();
    S.keepScroll = false;
  };
  function bindWrite() {
    qa(".cm-btn").forEach((btn) => btn.addEventListener("click", (e2) => {
      e2.stopPropagation();
      $(".react-pop")?.remove();
      const pop = document.createElement("div");
      pop.className = "react-pop cm-pop";
      const bb = S.bundle, cc = String(bb.pull.id) === String(btn.dataset.cm) ? bb.pull : [...bb.timeline, ...bb.review_comments].find((x3) => String(x3.id) === String(btn.dataset.cm));
      const isPr = cc === bb.pull, own = !!S.me && (cc?.user || cc?.actor)?.login === S.me;
      pop.innerHTML = `<button data-h="link">Copy link</button><button data-h="md">Copy Markdown</button><button data-h="quote">Quote reply</button><button data-h="issue">Reference in new issue</button>${own || !isPr && S.hasToken ? "<hr>" : ""}${own ? '<button data-h="edit">Edit</button>' : ""}${!isPr && S.hasToken ? '<button data-h="hide">Hide</button>' : ""}${own && !isPr ? '<button data-h="del" class="danger">Delete</button>' : ""}`;
      const r3 = btn.getBoundingClientRect();
      pop.style.left = Math.min(r3.left - 100, innerWidth - 180) + "px";
      pop.style.top = r3.bottom + 4 + "px";
      pop.onclick = (ev) => {
        const h3 = ev.target.dataset.h;
        if (h3) {
          pop.remove();
          cmAction(+btn.dataset.cm, btn.dataset.root, h3);
        }
      };
      document.body.appendChild(pop);
      setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }));
    }));
    qa(".tt[data-draft]").forEach((host) => {
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
        if (en.some((x3) => x3.isIntersecting)) {
          io.disconnect();
          if (host.isConnected) mount();
        }
      }, { rootMargin: "300px" });
      io.observe(host);
    });
    qa("[data-rerequest]").forEach((b2) => b2.addEventListener("click", async (e2) => {
      e2.stopPropagation();
      b2.disabled = true;
      b2.classList.add("spin");
      const r3 = await act("rerequest", { body: b2.dataset.rerequest }, "rerequest");
      if (r3 === void 0) {
        b2.disabled = false;
        b2.classList.remove("spin");
        alert(S.actErr?.m || "Could not re-request review.");
        return;
      }
      await refreshPr();
    }));
    qa("[data-thread]").forEach((btn) => btn.addEventListener("click", async (e2) => {
      e2.stopPropagation();
      const b2 = S.bundle, node = btn.dataset.thread, root = Object.keys(b2.thread_ids || {}).find((k3) => b2.thread_ids[k3] === node);
      const ids = [Number(root), ...b2.review_comments.filter((c3) => String(c3.in_reply_to_id) === String(root)).map((c3) => c3.id)].filter(Boolean);
      const prev = [...b2.resolved_ids || []], res = btn.dataset.res === "resolve";
      b2.resolved_ids = res ? [.../* @__PURE__ */ new Set([...prev, ...ids])] : prev.filter((x3) => !ids.includes(x3));
      rerender();
      const r3 = await act(btn.dataset.res, { body: node }, "thread", true);
      if (r3 === void 0) {
        b2.resolved_ids = prev;
        rerender();
        alert(S.actErr?.m || "Could not update the thread.");
        return;
      }
      refreshPr();
    }));
    qa("[data-sug]").forEach((btn) => btn.addEventListener("click", async (e2) => {
      e2.stopPropagation();
      const b2 = S.bundle, c3 = b2.review_comments.find((x3) => String(x3.id) === btn.dataset.sug);
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
    }));
    qa("[data-dmode]").forEach((b2) => b2.addEventListener("click", () => {
      S.diffMode = b2.dataset.dmode;
      localStorage.setItem("diffmode", S.diffMode);
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }));
    qa("[data-lc]").forEach((b2) => b2.addEventListener("click", (e2) => {
      e2.stopPropagation();
      S.lcOpen = b2.dataset.lc;
      S.keepScroll = true;
      render();
      S.keepScroll = false;
      setTimeout(() => S.eds?.at(-1)?.focus?.(), 200);
    }));
    $("#lccancel")?.addEventListener("click", () => {
      S.lcOpen = "";
      delete S.draft.lc;
      saveDrafts();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    $("#lcsuggest")?.addEventListener("click", (ev) => {
      const cur = (S.draft.lc || "").trimEnd();
      S.draft.lc = `${cur}${cur ? "\n\n" : ""}\`\`\`suggestion
${ev.currentTarget.dataset.code}
\`\`\`
`;
      saveDrafts();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
      setTimeout(() => S.eds?.at(-1)?.focus?.(), 150);
    });
    $("#lcadd")?.addEventListener("click", () => {
      const body = (S.draft.lc || "").trim();
      if (!body || !S.lcOpen) return;
      const [path, side, line] = S.lcOpen.split("");
      (S.pending[pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body });
      savePending();
      S.lcOpen = "";
      delete S.draft.lc;
      saveDrafts();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    });
    qa("[data-lcdel]").forEach((b2) => b2.addEventListener("click", () => {
      S.pending[pendKey()] = pendList().filter((c3) => String(c3.id) !== b2.dataset.lcdel);
      savePending();
      S.keepScroll = true;
      render();
      S.keepScroll = false;
    }));
    $("#finishrev")?.addEventListener("click", reviewDialog);
    $("#cbar")?.addEventListener("click", () => setComposer(document.getElementById("composer").classList.contains("collapsed"), true));
    $("#cbar")?.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter" || e2.key === " ") {
        e2.preventDefault();
        e2.currentTarget.click();
      }
    });
    $("#docomment")?.addEventListener("click", async () => {
      const r3 = await act("comment", { body: S.draft.comment || "" }, "comment");
      if (r3 === void 0) return;
      delete S.draft.comment;
      S.cOpen = false;
      if (!addLocal("commented", r3)) await refreshPr(r3.id);
    });
    qa("[data-sendreply]").forEach((btn) => btn.addEventListener("click", async () => {
      const id = btn.dataset.sendreply, r3 = await act("reply", { id: +id, body: S.draft["reply-" + id] || "" }, "reply-" + id);
      if (r3 === void 0) return;
      delete S.draft["reply-" + id];
      if (!addLocal("reply", r3, +id)) await refreshPr(r3.id);
    }));
    qa(".react-add").forEach((btn) => btn.addEventListener("click", (e2) => {
      e2.stopPropagation();
      $(".react-pop")?.remove();
      const pop = document.createElement("div");
      pop.className = "react-pop";
      pop.innerHTML = REACTS.map(([k3, em]) => `<button data-c="${k3}">${em}</button>`).join("");
      const r3 = btn.getBoundingClientRect();
      pop.style.left = Math.min(r3.left, innerWidth - 300) + "px";
      pop.style.top = Math.min(r3.bottom + 4, innerHeight - 60) + "px";
      document.body.appendChild(pop);
      pop.addEventListener("click", (ev) => {
        const c3 = ev.target.closest("[data-c]")?.dataset.c;
        if (!c3) return;
        pop.remove();
        toggleReact(btn.dataset.rk, btn.dataset.rid, c3);
      });
      setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }), 0);
    }));
    qa(".rc-btn").forEach((el) => el.addEventListener("mouseenter", () => getMine(el.dataset.rck, el.dataset.rcid)));
    qa(".react-add").forEach((el) => el.addEventListener("mouseenter", () => getMine(el.dataset.rk, el.dataset.rid)));
    qa(".rc-btn").forEach((el) => el.addEventListener("click", (e2) => {
      e2.stopPropagation();
      toggleReact(el.dataset.rck, el.dataset.rcid, el.dataset.rcc);
    }));
    $("#doclose")?.addEventListener("click", () => {
      const closed = S.bundle.pull.state === "closed";
      confirmDlg(closed ? "Reopen this pull request?" : "Close this pull request?", closed ? "It will be open for review again." : "It will be closed without merging. You can reopen it later.", closed ? "Reopen" : "Close pull request", !closed, async () => {
        const r3 = await act(closed ? "reopen" : "close", {}, "close");
        if (r3 !== void 0) await refreshPr();
      });
    });
    qa("[data-mb]").forEach((el) => el.addEventListener("click", (e2) => {
      if (e2.target.closest("#rerunck")) return;
      S.mbOpen = S.mbOpen || /* @__PURE__ */ new Set();
      const k3 = el.dataset.mb;
      S.mbOpen.has(k3) ? S.mbOpen.delete(k3) : S.mbOpen.add(k3);
      rerender();
    }));
    $("#rerunck")?.addEventListener("click", async (e2) => {
      e2.stopPropagation();
      const urls = (S.bundle.checks || []).filter((c3) => checkState(c3) === "fail" && c3.url).map((c3) => c3.url);
      setBusy(e2.currentTarget, true);
      const r3 = await act("rerun", { extra: urls }, "rerun");
      if (r3 !== void 0) {
        S.actErr = null;
        await refreshPr();
      } else setBusy(e2.currentTarget, false);
    });
    $("#updbranch")?.addEventListener("click", async () => {
      const r3 = await act("update_branch", {}, "update_branch");
      if (r3 !== void 0) await refreshPr();
    });
    $("#doready")?.addEventListener("click", async () => {
      const r3 = await act("ready", {}, "ready");
      if (r3 !== void 0) await refreshPr();
    });
    $("#todraft")?.addEventListener("click", () => confirmDlg("Convert to draft?", "Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.", "Convert to draft", false, async () => {
      const r3 = await act("draft", {}, "merge");
      if (r3 !== void 0) await refreshPr();
    }));
    $("#doauto")?.addEventListener("click", async () => {
      const r3 = await act("automerge", { method: $("#mmethod").value }, "automerge");
      if (r3 !== void 0) await refreshPr();
    });
    $("#noauto")?.addEventListener("click", async () => {
      const r3 = await act("disable_automerge", {}, "automerge");
      if (r3 !== void 0) await refreshPr();
    });
    $("#editpr")?.addEventListener("click", editPrDialog);
    $("#domerge")?.addEventListener("click", () => {
      const m2 = $("#mmethod").value, p3 = S.bundle.pull, names = { merge: "merge commit", squash: "squash and merge", rebase: "rebase and merge" };
      confirmDlg("Merge this pull request?", `${p3.head.label} will be merged into ${p3.base.label} using ${names[m2]}. This changes the repository and cannot be undone from here.`, "Merge", false, async () => {
        const r3 = await act("merge", { method: m2 }, "merge");
        if (r3 !== void 0) await refreshPr();
      });
    });
    $("#review")?.addEventListener("click", reviewDialog);
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
      const r3 = tauri ? await tauri.invoke("list_prs", { repo: name, state: S.prState }) : [];
      S.prCache[ck] = { list: r3, at: Date.now() };
      if (S.repo === name) S.prs = r3;
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
      const ti = S.tabs.find((t2) => t2.ref === ref);
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
    const k3 = `${b2.pull.base.repo.full_name}#${b2.pull.number}`;
    if (!qc.fresh(k3, 6e4)) openPr(k3, { nav: true, keepTab: true });
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
      const c3 = document.getElementById("composer");
      if (!c3 || !el.contains(c3)) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight, up = el.scrollTop < lastTop;
      lastTop = el.scrollTop;
      if (dist < 24 && !atEnd) {
        atEnd = true;
        if (c3.classList.contains("collapsed")) {
          setComposer(true, false);
          auto = true;
        }
      }
      if (dist > c3.offsetHeight + 60) {
        atEnd = false;
        if (up && !c3.classList.contains("collapsed") && !(S.draft.comment || "").trim()) {
          c3.contains(document.activeElement) && document.activeElement.blur();
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
