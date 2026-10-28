"use strict";
(() => {
  // src/app/core.ts
  var tauri = window.__TAURI__ && window.__TAURI__.core;
  var queryElement = (text, root = document) => root.querySelector(text);
  var qa = (text, root = document) => [...root.querySelectorAll(text)];
  var ESC = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (color) => ESC[color]);
  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  function whenParts(iso, lead = "on ") {
    const date = new Date(iso);
    const now = /* @__PURE__ */ new Date();
    const diff = (+now - +date) / 1e3;
    const abs = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}${date.getUTCFullYear() !== now.getUTCFullYear() ? `, ${date.getUTCFullYear()}` : ""}`;
    const title = date.toUTCString();
    let value;
    if (diff < 30 * 86400 && diff >= 0) {
      const handler = (otherValue, url) => `${otherValue} ${url}${otherValue === 1 ? "" : "s"} ago`;
      value = diff < 60 ? "now" : diff < 3600 ? handler(Math.floor(diff / 60), "minute") : diff < 86400 ? handler(Math.floor(diff / 3600), "hour") : handler(Math.floor(diff / 86400), "day");
      return { title, text: value };
    }
    return { title, text: `${lead}${abs}` };
  }
  function when(iso, lead = "on ") {
    const item = whenParts(iso, lead);
    return `<span title="${item.title}">${item.text}</span>`;
  }
  var ASSOC = {
    CONTRIBUTOR: "Contributor",
    MEMBER: "Member",
    OWNER: "Owner",
    COLLABORATOR: "Collaborator",
    FIRST_TIME_CONTRIBUTOR: "First-time contributor",
    FIRST_TIMER: "First-timer",
    MANNEQUIN: "Mannequin"
  };
  var REACTS = [
    ["+1", "\u{1F44D}"],
    ["-1", "\u{1F44E}"],
    ["laugh", "\u{1F604}"],
    ["hooray", "\u{1F389}"],
    ["confused", "\u{1F615}"],
    ["heart", "\u2764\uFE0F"],
    ["rocket", "\u{1F680}"],
    ["eyes", "\u{1F440}"]
  ];
  var load = (key2, item) => {
    try {
      return JSON.parse(localStorage.getItem(key2) ?? "null") ?? item;
    } catch {
      return item;
    }
  };
  var loadRepoSel = () => {
    const repoSummarys = load("repoSel", []);
    return repoSummarys.length ? repoSummarys : null;
  };
  var selNames = () => (appState.repoSel || []).map((repoSummary) => repoSummary.full_name);
  var appState = {
    profile: (() => {
      try {
        return JSON.parse(
          localStorage.getItem("profile") || "null"
        );
      } catch {
        return null;
      }
    })(),
    bundle: null,
    tab: "conversation",
    mode: localStorage.getItem("mode") || "auto",
    error: "",
    loading: false,
    showAllReviewers: true,
    recent: [],
    hist: [],
    hi: -1,
    hasToken: false,
    sideTab: "repos",
    repos: null,
    reposErr: "",
    repoFilter: "",
    repo: null,
    prs: null,
    prState: "open",
    split: localStorage.getItem("split") === "1",
    sel: null,
    cdiff: {},
    rdiff: {},
    fr: null,
    lw: +(localStorage.getItem("lw") || 46),
    notes: load("notes", []),
    bell: false,
    fold: load("fold", {}),
    hide: load("hide", {}),
    draft: {},
    sbw: +(localStorage.getItem("sbw") || 260),
    pf: "",
    psort: localStorage.getItem("psort") || "updated",
    pgroup: localStorage.getItem("pgroup") || "none",
    who: [],
    unres: false,
    range: "all",
    rFrom: "",
    rTo: "",
    sort: localStorage.getItem("csort") === "desc" ? "desc" : "asc",
    unIdx: 0,
    nav: false,
    busy: "",
    actErr: null,
    tabs: [],
    alive: /* @__PURE__ */ new Map(),
    tabMenu: false,
    closed: [],
    pushes: {},
    repoSel: loadRepoSel(),
    ibSort: localStorage.getItem("ibsort") || "updated",
    ibOrder: load("iborder", [])
  };
  appState.recent = (() => {
    try {
      return JSON.parse(localStorage.getItem("recent") ?? "null") || [];
    } catch {
      return [];
    }
  })();
  var isDark = () => appState.mode === "dark" || appState.mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches;
  if (!/Mac/i.test(navigator.platform)) {
    document.documentElement.classList.add("not-mac");
  }
  var flags = { lastUnread: -1, polling: false };
  function syncUnread() {
    const count = appState.notes.filter((note) => !note.read).length;
    if (tauri && count !== flags.lastUnread) {
      flags.lastUnread = count;
      tauri.invoke("set_unread", { count }).catch(() => {
      });
    }
  }
  appState.offline = typeof navigator !== "undefined" && navigator.onLine === false;
  var isOwnPr = () => !!appState.me && appState.bundle?.pull.user?.login.toLowerCase() === appState.me.toLowerCase();
  var isOff = () => !!(appState.offline || appState.bundle && appState.bundle._cached);
  function applyMode() {
    const element = document.documentElement;
    const dark = isDark();
    element.setAttribute("data-color-mode", dark ? "dark" : "light");
    element.setAttribute("data-light-theme", "light");
    element.setAttribute("data-dark-theme", "dark");
    element.setAttribute("data-t", dark ? "dark" : "light");
  }
  var KEY_RECENT = "recent";
  var flashLive = () => !!appState.flash && Date.now() < appState.flashUntil;
  var flashFor = (id) => appState.flash && appState.flash.id === id && flashLive() ? {
    n: appState.flash.n,
    block: appState.flash.block,
    smooth: appState.flash.smooth,
    pop: appState.flash.pop
  } : void 0;
  var setFlash = (id, options) => {
    appState.flash = { id, n: (appState.flash?.n || 0) + 1, ...options };
    appState.flashUntil = Date.now() + 2500;
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
  function S(n2) {
    return n2.children;
  }
  function C(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function $(n2, l3) {
    if (null == l3) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u4 = n2.__v, t3 = u4.__e, i3 = [], r3 = [], o3 = m({}, u4);
      o3.__v = u4.__v + 1, l.vnode && l.vnode(o3), q(n2.__P, o3, u4, n2.__n, n2.__P.namespaceURI, 32 & u4.__u ? [t3] : null, i3, null == t3 ? $(u4) : t3, !!(32 & u4.__u), r3), o3.__v = u4.__v, o3.__.__k[o3.__i] = o3, D(i3, o3, r3), u4.__e = u4.__ = null, o3.__e != t3 && P(o3);
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
    for (n2.__k = new Array(i3), r3 = 0; r3 < i3; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? ("string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? o3 = n2.__k[r3] = x(null, o3, null, null, null) : g(o3) ? o3 = n2.__k[r3] = x(S, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? o3 = n2.__k[r3] = x(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : n2.__k[r3] = o3, f4 = r3 + h3, o3.__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 != (c3 = o3.__i = O(o3, u4, f4, s3)) && (s3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > a3 ? h3-- : i3 < a3 && h3++), "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
    if (s3) for (r3 = 0; r3 < a3; r3++) null != (e3 = u4[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = $(e3)), K(e3, e3));
    return t3;
  }
  function j(n2, l3, u4) {
    var t3, i3;
    if ("function" == typeof n2.type) {
      for (t3 = n2.__k, i3 = 0; t3 && i3 < t3.length; i3++) t3[i3] && (t3[i3].__ = n2, l3 = j(t3[i3], l3, u4));
      return l3;
    }
    n2.__e != l3 && (l3 && n2.type && !l3.parentNode && (l3 = $(n2)), l3 = u4.insertBefore(n2.__e, l3 || null));
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
    var s3, h3, p3, v3, y3, d3, _3, k3, x2, M, I2, P2, A3, H2, T3, j3, F = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f4 = u4.__e = t3.__e]), (s3 = l.__b) && s3(u4);
    n: if ("function" == typeof F) {
      h3 = e3.length;
      try {
        if (x2 = u4.props, M = F.prototype && F.prototype.render, I2 = (s3 = F.contextType) && i3[s3.__c], P2 = s3 ? I2 ? I2.props.value : s3.__ : i3, t3.__c ? k3 = (p3 = u4.__c = t3.__c).__ = p3.__E : (M ? u4.__c = p3 = new F(x2, P2) : (u4.__c = p3 = new C(x2, P2), p3.constructor = F, p3.render = Q), I2 && I2.sub(p3), p3.state || (p3.state = {}), p3.__n = i3, v3 = p3.__d = true, p3.__h = [], p3._sb = []), M && null == p3.__s && (p3.__s = p3.state), M && null != F.getDerivedStateFromProps && (p3.__s == p3.state && (p3.__s = m({}, p3.__s)), m(p3.__s, F.getDerivedStateFromProps(x2, p3.__s))), y3 = p3.props, d3 = p3.state, p3.__v = u4, v3) M && null == F.getDerivedStateFromProps && null != p3.componentWillMount && p3.componentWillMount(), M && null != p3.componentDidMount && p3.__h.push(p3.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x2 !== y3 && null != p3.componentWillReceiveProps && p3.componentWillReceiveProps(x2, P2), u4.__v == t3.__v || !p3.__e && null != p3.shouldComponentUpdate && false === p3.shouldComponentUpdate(x2, p3.__s, P2)) {
            u4.__v != t3.__v && (p3.props = x2, p3.state = p3.__s, p3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
              n3 && (n3.__ = u4);
            }), w.push.apply(p3.__h, p3._sb), p3._sb = [], p3.__h.length && e3.push(p3), f4 = $(t3);
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
        p3.state = p3.__s, null != p3.getChildContext && (i3 = m(m({}, i3), p3.getChildContext())), M && !v3 && null != p3.getSnapshotBeforeUpdate && (_3 = p3.getSnapshotBeforeUpdate(y3, d3)), T3 = null != s3 && s3.type === S && null == s3.key ? E(s3.props.children) : s3, f4 = L(n2, g(T3) ? T3 : [T3], u4, t3, i3, r3, o3, e3, f4, c3, a3), p3.base = u4.__e, u4.__u &= -161, p3.__h.length && e3.push(p3), k3 && (p3.__E = p3.__ = null);
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
      else if (p3 && (u4.innerHTML = ""), L("template" == t3.type ? u4.content : u4, g(v3) ? v3 : [v3], t3, i3, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f4, e3 ? e3[0] : i3.__k && $(i3, 0), c3, a3), null != e3) for (s3 = e3.length; s3--; ) b(e3[s3]);
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
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), o3 = (r3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f4 = [], q(t3, u4 = (!r3 && i3 || t3).__k = k(S, null, [u4]), o3 || d, d, t3.namespaceURI, !r3 && i3 ? [i3] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i3 ? i3 : o3 ? o3.__e : t3.firstChild, r3, f4), D(e3, u4, f4), u4.props.children = null;
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
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
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

  // src/components/req.ts
  var reqs = /* @__PURE__ */ new Map();
  var subs = /* @__PURE__ */ new Map();
  function request(id, req = {}) {
    reqs.set(id, { ...req, n: (reqs.get(id)?.n || 0) + 1 });
    subs.get(id)?.forEach((handler) => handler());
  }
  function useOnRequest(id, apply2, layout = false) {
    const [, tick] = d2(0);
    const otherRequest = reqs.get(id);
    const seen2 = A2(otherRequest?.n);
    const act3 = A2(apply2);
    act3.current = apply2;
    h2(() => {
      const handler = () => tick((time) => time + 1);
      let names = subs.get(id);
      if (!names) {
        subs.set(id, names = /* @__PURE__ */ new Set());
      }
      names.add(handler);
      if (reqs.get(id)?.n !== seen2.current && reqs.get(id)?.n !== otherRequest?.n) {
        handler();
      }
      return () => {
        names.delete(handler);
      };
    }, [id]);
    (layout ? _2 : h2)(() => {
      if (otherRequest && otherRequest.n !== seen2.current) {
        seen2.current = otherRequest.n;
        act3.current(otherRequest);
      }
    }, [otherRequest?.n]);
  }
  function useScroller(id, layout = false) {
    const ref = A2(null);
    useOnRequest(
      `scroll:${id}`,
      (otherRequest) => ref.current?.scrollTo({
        top: otherRequest.top || 0,
        behavior: otherRequest.smooth ? "smooth" : "auto"
      }),
      layout
    );
    return ref;
  }
  var scrollTarget = (id, top, smooth) => request(`scroll:${id}`, { top, smooth });
  function useFocusTarget(id) {
    const ref = A2(null);
    useOnRequest(`focus:${id}`, (otherRequest) => {
      const el = ref.current;
      if (!el) {
        return;
      }
      if (otherRequest.a === "blur") {
        el.blur();
      } else {
        el.focus();
        if (otherRequest.a === "select") {
          el.select();
        }
      }
    });
    return ref;
  }
  var focusTarget = (id, action) => request(`focus:${id}`, { a: action });
  var reveal = (key2) => request(`reveal:${key2}`);
  function useReveal(key2) {
    const ref = A2(null);
    useOnRequest(`reveal:${key2}`, () => {
      const box = ref.current;
      const main = box?.closest(".main");
      if (!box || !main) {
        return;
      }
      const rect = box.getBoundingClientRect();
      const otherRect = main.getBoundingClientRect();
      if (rect.bottom > otherRect.bottom - 8 || rect.top < otherRect.top) {
        box.scrollIntoView({
          block: rect.height > otherRect.height * 0.85 ? "start" : "center",
          behavior: "smooth"
        });
      }
    });
    return ref;
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
  var renderIcon = (name, size, cls) => /* @__PURE__ */ u3(Icon, { n: name, s: size, c: cls });
  var Av = (person, size = 40) => /* @__PURE__ */ u3(Avatar, { u: person, s: size });
  var When = (text, lead) => /* @__PURE__ */ u3(WhenText, { t: text, lead });
  var SP = " ";
  var Icon = ({
    n: name,
    s: size = 16,
    c: color = ""
  }) => /* @__PURE__ */ u3(
    "svg",
    {
      class: `octicon ${color}`,
      viewBox: `0 0 ${size} ${size}`,
      width: size,
      height: size,
      "aria-hidden": "true",
      dangerouslySetInnerHTML: {
        __html: (window.OCTICONS || {})[name + (size === 24 ? "-24" : "")] || ""
      }
    }
  );
  var Avatar = ({
    u: person,
    s: size = 40
  }) => /* @__PURE__ */ u3(
    "img",
    {
      class: "av",
      loading: "lazy",
      decoding: "async",
      src: `${person?.avatar_url || ""}${person?.avatar_url ? `${person.avatar_url.includes("?") ? "&" : "?"}s=${size * 2}` : ""}`,
      width: size,
      height: size,
      alt: `@${person?.login || "ghost"}`,
      style: "border-radius:50%;display:block"
    }
  );
  var WhenText = ({ t: text, lead }) => {
    const item = whenParts(text, lead);
    return /* @__PURE__ */ u3("span", { title: item.title, children: item.text });
  };

  // src/components/Actions.tsx
  var ErrLine = ({ m: message }) => message ? /* @__PURE__ */ u3("div", { class: "act-err", children: message }) : null;
  var editorMount = { fn: null, preview: null, focus: null };
  function DraftBox({
    k: key2,
    ph,
    rows,
    submit
  }) {
    const ref = A2(null);
    const [mode2, setMode] = d2("write");
    const [pv, setPv] = d2(null);
    useOnRequest(`draft:submit:${key2}`, () => submit?.());
    useOnRequest(
      `draft:scroll:${key2}`,
      () => ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    );
    useOnRequest(`draft:focus:${key2}`, () => editorMount.focus?.(key2));
    useOnRequest(
      `draft:blur:${key2}`,
      () => ref.current?.querySelector(".tt-content")?.blur()
    );
    const hint = `${ph} \u2014 type / for blocks`;
    h2(
      () => editorMount.fn ? editorMount.fn(ref.current, key2, hint) : void 0,
      []
    );
    const show = (otherMode) => {
      setMode(otherMode);
      if (otherMode === "write") {
        return;
      }
      setPv("loading");
      editorMount.preview?.(key2).then(setPv);
    };
    const first = A2(true);
    h2(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (mode2 === "write") {
        ref.current?.querySelector(".tt-content")?.focus();
      }
    }, [mode2]);
    const prev = mode2 === "preview";
    return /* @__PURE__ */ u3(
      "div",
      {
        class: `tt${prev ? " previewing" : ""}`,
        "data-draft": key2,
        "data-ph": hint,
        style: `--rows:${rows}`,
        children: [
          /* @__PURE__ */ u3("div", { class: "tt-tabs", children: [
            /* @__PURE__ */ u3("button", { class: prev ? "" : "on", onClick: () => show("write"), children: "Write" }),
            /* @__PURE__ */ u3("button", { class: prev ? "on" : "", onClick: () => show("preview"), children: "Preview" })
          ] }),
          /* @__PURE__ */ u3("div", { class: "tt-ed", ref }),
          prev ? /* @__PURE__ */ u3("div", { class: "tt-preview markdown-body", children: pv === "loading" ? /* @__PURE__ */ u3("span", { class: "empty", children: "Loading preview\u2026" }) : !pv ? /* @__PURE__ */ u3("span", { class: "empty", children: "Nothing to preview" }) : "html" in pv ? /* @__PURE__ */ u3("div", { dangerouslySetInnerHTML: { __html: pv.html } }) : /* @__PURE__ */ u3(S, { children: [
            /* @__PURE__ */ u3("pre", { class: "pv-raw", children: pv.raw }),
            /* @__PURE__ */ u3("div", { class: "act-err", children: [
              "Couldn't render the preview (",
              pv.err,
              "). Showing the raw Markdown."
            ] })
          ] }) }) : null
        ]
      }
    );
  }
  function Composer(props) {
    const { on: on3 } = props;
    const box = A2(null);
    _2(() => {
      const el = box.current;
      const pane = el.closest(".pane-body");
      on3?.measure({
        h: el.offsetHeight,
        in: pane ? pane.closest(".pane-l") ? "l" : "r" : "main"
      });
      return () => on3?.measure(null);
    });
    return /* @__PURE__ */ u3(
      "div",
      {
        ref: box,
        class: `composer dock${props.open ? "" : " collapsed"}`,
        id: "composer",
        children: [
          /* @__PURE__ */ u3(
            "div",
            {
              class: "composer-h",
              id: "cbar",
              role: "button",
              tabindex: 0,
              title: "Write a comment (C)",
              onClick: on3?.toggle,
              onKeyDown: on3?.key,
              children: [
                renderIcon("comment"),
                /* @__PURE__ */ u3("b", { children: "Add a comment" }),
                /* @__PURE__ */ u3("span", { class: "cbar-ph", children: props.draft ? `Draft: ${props.draft}` : "Write a comment\u2026" }),
                /* @__PURE__ */ u3("kbd", { children: "C" }),
                /* @__PURE__ */ u3("span", { class: "cbar-x", children: renderIcon("chevron-down") })
              ]
            }
          ),
          "\n  ",
          /* @__PURE__ */ u3("div", { class: "composer-body", children: [
            /* @__PURE__ */ u3(
              DraftBox,
              {
                k: "comment",
                ph: "Write a comment\u2026 (Markdown supported)",
                rows: 4,
                submit: props.busy ? void 0 : on3?.send
              }
            ),
            /* @__PURE__ */ u3(ErrLine, { m: props.err }),
            "\n  ",
            /* @__PURE__ */ u3("div", { class: "composer-f", children: [
              /* @__PURE__ */ u3("span", { class: "hint", children: "\u2318\u21B5 to send \xB7 Esc to collapse" }),
              /* @__PURE__ */ u3("span", { style: "flex:1" }),
              "\n  ",
              props.merged ? "" : /* @__PURE__ */ u3("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: props.closed ? "Reopen pull request" : "Close pull request" }),
              "\n  ",
              /* @__PURE__ */ u3(
                "button",
                {
                  class: "btn primary",
                  id: "docomment",
                  disabled: props.busy,
                  onClick: on3?.send,
                  children: props.busy ? "Sending\u2026" : "Comment"
                }
              )
            ] })
          ] })
        ]
      }
    );
  }
  var METHODS = [
    ["merge", "Create a merge commit"],
    ["squash", "Squash and merge"],
    ["rebase", "Rebase and merge"]
  ];
  function MergeAct(props) {
    const { on: on3 } = props;
    if (props.draft) {
      return /* @__PURE__ */ u3("div", { class: "merge-act", children: [
        /* @__PURE__ */ u3("button", { class: "btn ghost", id: "doclose", onClick: on3?.close, children: "Close pull request" }),
        /* @__PURE__ */ u3(ErrLine, { m: props.err })
      ] });
    }
    return /* @__PURE__ */ u3("div", { class: "merge-act", children: [
      /* @__PURE__ */ u3("select", { class: "sel", id: "mmethod", onChange: on3?.method, children: METHODS.map(([otherValue, text]) => /* @__PURE__ */ u3("option", { value: otherValue, selected: props.method === otherValue, children: text })) }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn primary",
          id: "domerge",
          disabled: props.busy,
          onClick: on3?.merge,
          children: props.busy ? "Merging\u2026" : "Merge pull request"
        }
      ),
      "\n  ",
      props.auto ? /* @__PURE__ */ u3(
        "button",
        {
          class: "btn",
          id: "noauto",
          title: `Auto-merge is on (${props.auto.method})`,
          onClick: on3?.noauto,
          children: props.auto.busy ? "Turning off\u2026" : "Disable auto-merge"
        }
      ) : props.canAuto ? /* @__PURE__ */ u3(
        "button",
        {
          class: "btn",
          id: "doauto",
          title: "Merge automatically once required checks and reviews pass",
          onClick: on3?.auto,
          children: props.autoBusy ? "Enabling\u2026" : "Enable auto-merge"
        }
      ) : "",
      "\n  ",
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn ghost",
          id: "todraft",
          title: "Mark as draft again",
          onClick: on3?.draft,
          children: "Convert to draft"
        }
      ),
      /* @__PURE__ */ u3(ErrLine, { m: props.err }),
      /* @__PURE__ */ u3(ErrLine, { m: props.errAuto })
    ] });
  }

  // src/components/Overlays.tsx
  var ProfPop = (props) => /* @__PURE__ */ u3(
    "div",
    {
      class: "react-pop cm-pop prof-pop",
      style: `right:${props.right}px;top:${props.top}px`,
      children: [
        /* @__PURE__ */ u3("div", { class: "pp-h", children: [
          /* @__PURE__ */ u3("img", { src: props.avatar, alt: "" }),
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3("b", { children: props.name }),
            /* @__PURE__ */ u3("i", { children: [
              "@",
              props.login
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u3("button", { "data-h": "profile", onClick: () => props.pick("profile"), children: [
          renderIcon("link-external"),
          " Your GitHub profile"
        ] }),
        /* @__PURE__ */ u3("button", { "data-h": "repos", onClick: () => props.pick("repos"), children: [
          renderIcon("repo"),
          " Choose repositories\u2026"
        ] }),
        /* @__PURE__ */ u3("button", { "data-h": "dense", onClick: () => props.pick("dense"), children: [
          renderIcon("checklist"),
          " ",
          props.dense ? "Comfortable lists" : "Compact lists"
        ] }),
        /* @__PURE__ */ u3("button", { "data-h": "token", onClick: () => props.pick("token"), children: [
          renderIcon("key"),
          " Access token\u2026"
        ] }),
        /* @__PURE__ */ u3("button", { "data-h": "out", class: "danger", onClick: () => props.pick("out"), children: "Sign out" }),
        /* @__PURE__ */ u3("div", { class: "pp-ver", children: [
          "Signed in with token",
          props.ver ? ` \xB7 Pullscope v${props.ver}` : ""
        ] })
      ]
    }
  );
  function AcPop(props) {
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
        style: `left:${props.left}px;top:${props.top}px;width:${props.width}px`,
        onMouseDown: (event) => {
          event.preventDefault();
          const element = event.target.closest(
            ".ac-row"
          );
          if (element) {
            props.pick(props.rows[+element.dataset.i]);
          }
        },
        children: props.rows.map((acRow, index) => /* @__PURE__ */ u3("div", { class: `ac-row${index === props.sel ? " on" : ""}`, "data-i": index, children: [
          /* @__PURE__ */ u3("span", { class: `ac-i ${acRow.state || ""}`, children: renderIcon(acRow.ic) }),
          /* @__PURE__ */ u3("span", { class: "ac-t", children: [
            /* @__PURE__ */ u3("b", { children: acRow.label }),
            /* @__PURE__ */ u3("i", { children: acRow.sub })
          ] })
        ] }))
      }
    );
  }
  function BpPop(props) {
    const [query, setQ] = d2("");
    const [act3, setAct] = d2(0);
    const ref = A2(null);
    const inp = A2(null);
    const groups = props.groupsFor(query.trim());
    const rows = groups.flatMap(([, bpRows]) => bpRows);
    const first = Math.max(0, Math.min(act3, rows.length - 1));
    h2(() => {
      inp.current?.focus();
    }, []);
    h2(() => {
      ref.current?.querySelector(".act")?.scrollIntoView({ block: "nearest" });
    });
    let index = 0;
    return /* @__PURE__ */ u3("div", { id: "bppop", class: "bp-pop", ref, style: props.style, children: [
      /* @__PURE__ */ u3(
        "input",
        {
          class: "bp-q",
          ref: inp,
          placeholder: props.repoMode ? "Filter repositories\u2026" : "Filter branches\u2026",
          spellcheck: false,
          value: query,
          onInput: (event) => {
            setQ(event.target.value);
            setAct(0);
          },
          onKeyDown: (event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              props.done();
            } else if (event.key === "Enter") {
              event.preventDefault();
              props.done(rows[first]?.name);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setAct(
                Math.max(
                  0,
                  Math.min(
                    rows.length - 1,
                    first + (event.key === "ArrowDown" ? 1 : -1)
                  )
                )
              );
            }
          }
        }
      ),
      /* @__PURE__ */ u3("div", { class: "bp-list", children: groups.length && rows.length ? groups.map(([hash, bpRows]) => /* @__PURE__ */ u3(S, { children: [
        hash ? /* @__PURE__ */ u3("div", { class: "bp-h", children: [
          hash,
          /* @__PURE__ */ u3("span", { children: bpRows.length })
        ] }) : "",
        bpRows.map((bpRow) => {
          const idx = index++;
          return /* @__PURE__ */ u3(
            "div",
            {
              class: `bp-r${idx === first ? " act" : ""}${bpRow.name === props.cur ? " cur" : ""}`,
              "data-b": bpRow.name,
              onClick: () => props.done(bpRow.name),
              onMouseMove: () => {
                if (idx !== first) {
                  setAct(idx);
                }
              },
              children: [
                /* @__PURE__ */ u3("span", { class: "bp-ck", children: bpRow.name === props.cur ? "\u2713" : "" }),
                /* @__PURE__ */ u3("span", { class: "bp-n", children: bpRow.name }),
                bpRow.by ? /* @__PURE__ */ u3("span", { class: "bp-by", children: bpRow.by }) : "",
                /* @__PURE__ */ u3("span", { class: "bp-t", children: props.age(bpRow.at) })
              ]
            }
          );
        })
      ] })) : /* @__PURE__ */ u3("div", { class: "bp-empty", children: "No matches" }) })
    ] });
  }
  function Confetti({
    w: otherWidth,
    h: otherHeight,
    done
  }) {
    const ref = A2(null);
    h2(() => {
      const canvas = ref.current;
      const context = canvas.getContext("2d");
      const cols = [
        "#0969da",
        "#1f883d",
        "#8250df",
        "#f2cc60",
        "#cf222e",
        "#ff8fb1"
      ];
      const ps = Array.from({ length: 160 }, () => ({
        x: otherWidth / 2,
        y: otherHeight * 0.6,
        vx: (Math.random() - 0.5) * 18,
        vy: -8 - Math.random() * 14,
        r: 4 + Math.random() * 5,
        a: Math.random() * 6,
        va: (Math.random() - 0.5) * 0.4,
        c: cols[Math.random() * cols.length | 0]
      }));
      let time = 0;
      let raf = 0;
      const handler = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        time++;
        ps.forEach((props) => {
          props.vy += 0.35;
          props.vx *= 0.99;
          props.x += props.vx;
          props.y += props.vy;
          props.a += props.va;
          context.save();
          context.translate(props.x, props.y);
          context.rotate(props.a);
          context.fillStyle = props.c;
          context.globalAlpha = Math.max(0, 1 - time / 130);
          context.fillRect(-props.r, -props.r / 2, props.r * 2, props.r);
          context.restore();
        });
        if (time < 130) {
          raf = requestAnimationFrame(handler);
        } else {
          done();
        }
      };
      handler();
      return () => cancelAnimationFrame(raf);
    }, []);
    return /* @__PURE__ */ u3(
      "canvas",
      {
        class: "confetti",
        ref,
        width: otherWidth,
        height: otherHeight
      }
    );
  }
  var FxLayer = ({
    items,
    drop
  }) => /* @__PURE__ */ u3(S, { children: items.map(
    (value) => value.k === "rip" ? /* @__PURE__ */ u3(
      "div",
      {
        style: `position:fixed;z-index:999;overflow:hidden;pointer-events:none;left:${value.l}px;top:${value.t}px;width:${value.w}px;height:${value.h}px;border-radius:${value.radius};color:${value.color}`,
        children: /* @__PURE__ */ u3(
          "span",
          {
            class: "ripple",
            style: `width:${value.d}px;height:${value.d}px;left:${value.x}px;top:${value.y}px`
          }
        )
      },
      value.id
    ) : value.k === "burst" ? /* @__PURE__ */ u3(
      "span",
      {
        class: "burst",
        style: `left:${value.x}px;top:${value.y}px;--dx:${value.dx}px;--dy:${value.dy}px`,
        children: value.ch
      },
      value.id
    ) : /* @__PURE__ */ u3(
      Confetti,
      {
        w: value.w,
        h: value.h,
        done: () => drop(value.id)
      },
      value.id
    )
  ) });

  // src/components/Shell.tsx
  var Main = (props) => {
    const ref = useScroller("main", true);
    h2(() => {
      const el = ref.current;
      if (!el) {
        return;
      }
      let raf = 0;
      const measure = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => props.onMeasure(el));
      };
      const ro = new ResizeObserver(measure);
      const mo = new MutationObserver(measure);
      ro.observe(el);
      mo.observe(el, { childList: true, subtree: true });
      measure();
      return () => {
        ro.disconnect();
        mo.disconnect();
        cancelAnimationFrame(raf);
      };
    }, []);
    return /* @__PURE__ */ u3("div", { class: props.cls, ref, onScroll: props.onScroll, children: /* @__PURE__ */ u3("div", { id: "page", style: "display:contents", onClick: props.onPage, children: props.children }) });
  };
  var Shell = (props) => /* @__PURE__ */ u3(S, { children: [
    /* @__PURE__ */ u3(
      "div",
      {
        class: `shell ${props.nav ? "nav-open" : ""} ${props.navHidden ? "nav-hidden" : ""}${props.enter ? " entering" : ""}`,
        style: `--sbw:${props.sbw}px;--lw:${props.lw}%`,
        children: [
          /* @__PURE__ */ u3("div", { id: "side", style: "display:contents", children: props.side }),
          /* @__PURE__ */ u3(
            "div",
            {
              class: "sb-grip",
              id: "sbgrip",
              title: "Drag to resize \xB7 double-click to reset",
              onMouseDown: props.onGrip,
              onDblClick: props.onGripReset
            }
          ),
          /* @__PURE__ */ u3("div", { class: "scrim", id: "scrim", onClick: props.onScrim }),
          [props.active, ...props.kept].map(
            (shellPane, index) => index === 0 ? /* @__PURE__ */ u3(
              Main,
              {
                cls: `main${props.fade ? " tab-in" : ""}${props.stuck ? " stuck" : ""}`,
                onScroll: props.onScroll,
                onMeasure: props.onMeasure,
                onPage: props.onPage,
                children: shellPane.children
              },
              shellPane.key
            ) : /* @__PURE__ */ u3("div", { class: "main-off", style: "display:none", children: /* @__PURE__ */ u3("div", { style: "display:contents", children: shellPane.children }) }, shellPane.key)
          )
        ]
      }
    ),
    /* @__PURE__ */ u3("div", { id: "dlg", style: "display:contents", children: props.dlg }),
    /* @__PURE__ */ u3("div", { id: "notehost", style: "display:contents", children: props.notes })
  ] });

  // src/app/frame.tsx
  var slots = {
    top: null,
    side: null,
    dlg: null,
    notes: null,
    pop: null,
    pal: null,
    ovl: null,
    totop: null
  };
  var globals = null;
  var drag = null;
  var setGlobals = (otherGlobals) => {
    globals = otherGlobals;
  };
  var beginDrag = (dragFns) => {
    drag = dragFns;
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
      const otherGlobals = globals;
      if (!otherGlobals) {
        return;
      }
      addEventListener("keydown", otherGlobals.key);
      addEventListener("wheel", otherGlobals.wheel, { passive: false });
      addEventListener("focus", otherGlobals.focus);
      addEventListener("online", otherGlobals.online);
      addEventListener("offline", otherGlobals.offline);
      return () => {
        removeEventListener("keydown", otherGlobals.key);
        removeEventListener("wheel", otherGlobals.wheel);
        removeEventListener("focus", otherGlobals.focus);
        removeEventListener("online", otherGlobals.online);
        removeEventListener("offline", otherGlobals.offline);
      };
    }, []);
    const dragFns = drag;
    _2(() => {
      if (!dragFns) {
        return;
      }
      const up = () => {
        removeEventListener("mousemove", dragFns.move);
        removeEventListener("mouseup", up);
        drag = null;
        dragFns.end();
      };
      addEventListener("mousemove", dragFns.move);
      addEventListener("mouseup", up);
      return () => {
        removeEventListener("mousemove", dragFns.move);
        removeEventListener("mouseup", up);
      };
    }, [dragFns]);
    const innerGlobals = globals;
    return /* @__PURE__ */ u3(
      "div",
      {
        id: "frame",
        class: appState.dragging ? "dragging" : "",
        style: "display:contents",
        onPointerDown: innerGlobals?.pointerDown,
        onClickCapture: innerGlobals?.clickCapture,
        onClick: innerGlobals?.click,
        onMouseDown: innerGlobals?.mouseDown,
        children: [
          /* @__PURE__ */ u3("div", { id: "top", style: "display:contents", children: slots.top }),
          /* @__PURE__ */ u3("div", { id: "rest", style: "display:contents", children: gate ? /* @__PURE__ */ u3(S, { children: [
            gate,
            /* @__PURE__ */ u3("div", { id: "dlg", style: "display:contents", children: slots.dlg })
          ] }) : shell ? /* @__PURE__ */ u3(
            Shell,
            {
              ...shell,
              side: slots.side,
              dlg: slots.dlg,
              notes: slots.notes
            }
          ) : null }),
          /* @__PURE__ */ u3("div", { id: "pop", style: "display:contents", children: slots.pop }),
          /* @__PURE__ */ u3("div", { id: "pal", style: "display:contents", children: slots.pal }),
          /* @__PURE__ */ u3("div", { id: "ovl", style: "display:contents", children: slots.ovl }),
          /* @__PURE__ */ u3("div", { style: "display:contents", children: slots.totop })
        ]
      }
    );
  };
  function repaint() {
    if (held) {
      return;
    }
    const app = document.getElementById("app");
    R(/* @__PURE__ */ u3(Frame, {}), app);
  }
  var setSlot = (name, node) => {
    slots[name] = node;
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
  var setGate = (node) => {
    gate = node;
    shell = node ? null : shell;
    repaint();
  };
  var setShell = (props) => {
    shell = props;
    gate = null;
    repaint();
  };
  var shellProps = () => shell;
  function setDragging(on3) {
    appState.dragging = on3;
    repaint();
  }

  // src/app/overlay.tsx
  var OV = {
    ac: null,
    bp: null,
    fx: []
  };
  var paintOv = () => setSlot(
    "ovl",
    /* @__PURE__ */ u3(S, { children: [
      OV.ac && /* @__PURE__ */ u3(AcPop, { ...OV.ac }),
      OV.bp && /* @__PURE__ */ u3(BpPop, { ...OV.bp }),
      /* @__PURE__ */ u3(FxLayer, { items: OV.fx, drop: fxDrop })
    ] })
  );
  var fxId = 0;
  function fxDrop(id) {
    OV.fx = OV.fx.filter((value) => value.id !== id);
    paintOv();
  }
  function fxAdd(value, ms = 0) {
    const id = ++fxId;
    OV.fx = [...OV.fx, { ...value, id }];
    paintOv();
    if (ms) {
      setTimeout(() => fxDrop(id), ms);
    }
  }

  // src/components/Pages.tsx
  function NotesPage({
    f: field,
    rows,
    unread,
    total,
    on: on3
  }) {
    const tabs = [
      ["all", "All", total],
      ["unread", "Unread", unread],
      ["read", "Read", total - unread]
    ];
    return /* @__PURE__ */ u3("div", { class: "notes-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: [
        /* @__PURE__ */ u3("h1", { children: [
          renderIcon("bell"),
          SP,
          "Notifications"
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-tools", children: [
          /* @__PURE__ */ u3("button", { class: "btn small", id: "npcheck", onClick: on3.check, children: "Check now" }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "btn small",
              id: "npreadall",
              onClick: on3.readAll,
              disabled: !unread,
              children: "Mark all as read"
            }
          ),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "btn small ghost",
              id: "npclear",
              onClick: on3.clear,
              disabled: !total,
              children: "Clear all"
            }
          )
        ] })
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-tabs", children: tabs.map(([key2, line, count]) => /* @__PURE__ */ u3(
        "button",
        {
          class: field === key2 ? "sel" : "",
          "data-nf": key2,
          onClick: () => on3.filter(key2),
          children: [
            line,
            /* @__PURE__ */ u3("span", { children: count })
          ]
        }
      )) }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-list", children: rows.length ? rows.map((noteRow) => /* @__PURE__ */ u3("div", { class: `np-row ${noteRow.read ? "" : "new"}`, children: [
        /* @__PURE__ */ u3(
          "button",
          {
            class: "np-dot",
            "data-nread": noteRow.id,
            onClick: (event) => on3.read(event, noteRow.id),
            title: noteRow.read ? "Mark as unread" : "Mark as read"
          }
        ),
        "\n    ",
        /* @__PURE__ */ u3(
          "a",
          {
            class: "np-main",
            "data-open": noteRow.ref,
            "data-target": noteRow.target,
            "data-note": noteRow.id,
            onClick: (event) => on3.open(event.currentTarget, event),
            onAuxClick: (event) => on3.aux(event.currentTarget, event),
            onContextMenu: (event) => on3.ctx(event.currentTarget, event),
            children: [
              /* @__PURE__ */ u3("b", { children: noteRow.title }),
              /* @__PURE__ */ u3("span", { children: noteRow.text }),
              /* @__PURE__ */ u3("i", { children: [
                noteRow.ref,
                " \xB7 ",
                noteRow.when
              ] })
            ]
          }
        ),
        "\n    ",
        /* @__PURE__ */ u3(
          "button",
          {
            class: "np-act",
            "data-nread": noteRow.id,
            onClick: (event) => on3.read(event, noteRow.id),
            children: noteRow.read ? "Mark unread" : "Mark read"
          }
        ),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "np-act del",
            "data-ndel": noteRow.id,
            onClick: (event) => on3.del(event, noteRow.id),
            title: "Delete",
            children: renderIcon("x")
          }
        )
      ] })) : /* @__PURE__ */ u3("div", { class: "note-empty np-empty", children: field === "unread" ? "You are all caught up." : field === "read" ? "Nothing read yet." : "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." }) })
    ] });
  }
  function NpMeta({
    p: props,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "np-box np-metas", id: "npmeta", children: [
      props.rows.map((row2) => /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: row2.name }),
        /* @__PURE__ */ u3("div", { class: "np-chips", children: [
          row2.chips.map((text) => /* @__PURE__ */ u3(
            "span",
            {
              class: "np-chip",
              "data-npdel": row2.k,
              "data-v": text,
              onClick: () => on3.del(row2.k, text),
              title: "Remove",
              children: [
                text,
                " \xD7"
              ]
            }
          )),
          row2.free.length ? /* @__PURE__ */ u3(
            "select",
            {
              class: "sel np-add",
              "data-npadd": row2.k,
              value: "",
              onChange: (event) => on3.add(row2.k, event),
              children: [
                /* @__PURE__ */ u3("option", { value: "", children: `Add ${row2.name.toLowerCase()}\u2026` }),
                row2.free.map((text) => /* @__PURE__ */ u3("option", { children: text }))
              ]
            }
          ) : ""
        ] })
      ] })),
      "\n    ",
      /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: "Milestone" }),
        /* @__PURE__ */ u3("select", { class: "sel", id: "npmile", onChange: on3.mile, children: [
          /* @__PURE__ */ u3("option", { value: "", children: "None" }),
          props.milestones.map((item) => /* @__PURE__ */ u3("option", { value: item.number, selected: item.on, children: item.title }))
        ] })
      ] }),
      "\n    ",
      /* @__PURE__ */ u3("div", { class: "np-meta", children: [
        /* @__PURE__ */ u3("label", { class: "np-l", children: [
          "Linked issues ",
          /* @__PURE__ */ u3("i", { children: "closed when this merges" })
        ] }),
        /* @__PURE__ */ u3(
          "input",
          {
            class: "input",
            id: "npissues",
            placeholder: "e.g. 12, 15",
            value: props.issues,
            onInput: on3.issues
          }
        )
      ] })
    ] });
  }
  function NewPr({ p: props, on: on3 }) {
    const item = props.cmp;
    const cmp = item.kind === "loading" ? /* @__PURE__ */ u3("span", { class: "np-note", children: "Comparing\u2026" }) : item.kind === "none" ? "" : item.kind === "err" ? /* @__PURE__ */ u3("span", { class: "np-note err", children: item.text }) : item.kind === "ok" ? /* @__PURE__ */ u3("span", { class: "np-note ok", children: [
      renderIcon("git-commit"),
      SP,
      item.ahead,
      " commit",
      item.ahead === 1 ? "" : "s",
      " \xB7 ",
      item.files,
      " file",
      item.files === 1 ? "" : "s",
      " changed",
      item.behind ? ` \xB7 ${item.behind} behind ${props.base}` : ""
    ] }) : /* @__PURE__ */ u3("span", { class: "np-note err", children: "These branches are identical \u2014 there is nothing to compare." });
    const templates = props.tpls;
    return /* @__PURE__ */ u3("div", { class: "notes-page np-new", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: /* @__PURE__ */ u3("h1", { children: [
        renderIcon("git-pull-request"),
        SP,
        "New pull request"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u3("div", { class: "np-card", children: [
        /* @__PURE__ */ u3("div", { class: "np-main-col", children: [
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Repository" }),
            props.hasRepos ? /* @__PURE__ */ u3(
              "button",
              {
                type: "button",
                class: "sel bp-btn",
                id: "nprepo",
                onClick: on3.repo,
                children: [
                  /* @__PURE__ */ u3("span", { children: props.repo || "Choose a repository" }),
                  renderIcon("chevron-down", 14)
                ]
              }
            ) : /* @__PURE__ */ u3(
              "input",
              {
                class: "input",
                id: "nprepoin",
                placeholder: "owner/repo",
                value: props.repo,
                onChange: on3.repoIn
              }
            ),
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-branches", children: [
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3("label", { class: "np-l", children: [
                  "Base ",
                  /* @__PURE__ */ u3("i", { children: "merge into" })
                ] }),
                /* @__PURE__ */ u3(
                  "button",
                  {
                    type: "button",
                    class: "sel bp-btn",
                    id: "npbase",
                    "data-bp": "base",
                    onClick: on3.base,
                    disabled: !props.hasBranches,
                    children: [
                      /* @__PURE__ */ u3("span", { children: props.hasBranches ? props.base || "Choose a branch" : "Loading\u2026" }),
                      renderIcon("chevron-down", 14)
                    ]
                  }
                )
              ] }),
              "\n      ",
              /* @__PURE__ */ u3(
                "button",
                {
                  class: "tb-btn",
                  id: "npswap",
                  onClick: on3.swap,
                  title: "Swap base and head",
                  children: "\u21C4"
                }
              ),
              "\n      ",
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3("label", { class: "np-l", children: [
                  "Head ",
                  /* @__PURE__ */ u3("i", { children: "changes from" })
                ] }),
                /* @__PURE__ */ u3(
                  "button",
                  {
                    type: "button",
                    class: "sel bp-btn",
                    id: "nphead",
                    "data-bp": "head",
                    onClick: on3.head,
                    disabled: !props.hasBranches,
                    children: [
                      /* @__PURE__ */ u3("span", { children: props.hasBranches ? props.head || "Choose a branch" : "Loading\u2026" }),
                      renderIcon("chevron-down", 14)
                    ]
                  }
                )
              ] })
            ] }),
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-cmp", children: props.same ? /* @__PURE__ */ u3("span", { class: "np-note err", children: "Base and head are the same branch." }) : cmp })
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Title" }),
            /* @__PURE__ */ u3(
              "input",
              {
                class: "input",
                id: "nptitle",
                placeholder: "Title",
                value: props.title,
                onInput: on3.title
              }
            )
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-l", children: "Description" }),
            templates && templates.length > 1 ? /* @__PURE__ */ u3(
              "select",
              {
                class: "sel np-tpl",
                id: "nptpl",
                value: String(
                  templates.findIndex(
                    (template) => template.body === props.tplText
                  )
                ),
                onChange: on3.tpl,
                children: [
                  /* @__PURE__ */ u3("option", { value: "-1", children: "No template" }),
                  templates.map((template, index) => /* @__PURE__ */ u3("option", { value: index, children: [
                    "Template: ",
                    template.name
                  ] }))
                ]
              }
            ) : "",
            /* @__PURE__ */ u3(
              DraftBox,
              {
                k: "newpr",
                ph: "Describe your changes",
                rows: 8,
                submit: props.ready ? on3.create : void 0
              }
            )
          ] }),
          "\n    ",
          /* @__PURE__ */ u3("div", { class: "np-box", children: [
            /* @__PURE__ */ u3("label", { class: "np-check", children: [
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "checkbox",
                  id: "npdraft",
                  checked: props.isDraft,
                  onChange: on3.draft
                }
              ),
              " ",
              "Create as draft ",
              /* @__PURE__ */ u3("span", { children: "(not ready for review yet)" })
            ] }),
            "\n    ",
            props.err ? /* @__PURE__ */ u3("div", { class: "act-err", children: props.err }) : "",
            "\n    ",
            /* @__PURE__ */ u3("div", { class: "np-btns", children: [
              /* @__PURE__ */ u3("button", { class: "btn", id: "npcancel", onClick: on3.cancel, children: "Cancel" }),
              /* @__PURE__ */ u3(
                "button",
                {
                  class: "btn primary",
                  id: "npcreate",
                  onClick: on3.create,
                  disabled: !props.ready,
                  children: props.isDraft ? "Create draft pull request" : "Create pull request"
                }
              )
            ] })
          ] }),
          "\n  "
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-side-col", children: props.meta ? /* @__PURE__ */ u3(NpMeta, { p: props.meta, on: on3 }) : "" })
      ] })
    ] }, props.seq);
  }
  function ViewsBar({
    views,
    view: view2,
    naming,
    on: on3
  }) {
    if (naming) {
      return /* @__PURE__ */ u3("span", { class: "ib-views", children: [
        /* @__PURE__ */ u3(
          "input",
          {
            class: "input",
            placeholder: "Name this view",
            autofocus: true,
            ref: (el) => el?.focus(),
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                on3.viewSave(event.target.value);
              } else if (event.key === "Escape") {
                on3.viewNaming(false);
              }
            }
          }
        ),
        /* @__PURE__ */ u3("button", { class: "btn small", onClick: () => on3.viewNaming(false), children: "Cancel" })
      ] });
    }
    return /* @__PURE__ */ u3("span", { class: "ib-views", children: [
      views.length ? /* @__PURE__ */ u3("label", { children: [
        "View",
        /* @__PURE__ */ u3(
          "select",
          {
            class: "input",
            onChange: (event) => on3.viewApply(event.target.value),
            children: [
              /* @__PURE__ */ u3("option", { value: "", children: "Choose\u2026" }),
              views.map((otherValue) => /* @__PURE__ */ u3("option", { value: otherValue, selected: otherValue === view2, children: otherValue }))
            ]
          }
        )
      ] }) : null,
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small",
          title: "Save the current filter and sort as a view",
          onClick: () => on3.viewNaming(true),
          children: "Save view"
        }
      ),
      view2 ? /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small",
          title: `Delete view \u201C${view2}\u201D`,
          onClick: () => on3.viewDelete(view2),
          children: "Delete view"
        }
      ) : null
    ] });
  }
  function InboxPage({
    p: { loading, err, secs, sort, sorts, q: query, custom, views, view: view2, naming },
    on: on3
  }) {
    const body = err ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: err }) : !secs ? /* @__PURE__ */ u3("div", { class: "skel", children: [
      /* @__PURE__ */ u3("div", { class: "sk sk-line" }),
      /* @__PURE__ */ u3("div", { class: "sk sk-line w80" }),
      /* @__PURE__ */ u3("div", { class: "sk sk-line w60" })
    ] }) : secs.map((inboxSec) => /* @__PURE__ */ u3(
      "section",
      {
        "data-t": inboxSec.title,
        class: `ib-sec${inboxSec.closed ? " closed" : ""}${inboxSec.ro}`,
        children: [
          /* @__PURE__ */ u3("h2", { class: "ib-h", onClick: () => on3.fold(inboxSec.key), children: [
            /* @__PURE__ */ u3(
              "i",
              {
                class: "ib-grip",
                title: "Drag to move this section",
                onClick: (event) => event.stopPropagation(),
                onMouseDown: (event) => on3.grip(event, inboxSec.title),
                children: "\u22EE\u22EE"
              }
            ),
            renderIcon(inboxSec.closed ? "chevron-right" : "chevron-down"),
            inboxSec.title,
            /* @__PURE__ */ u3("span", { children: inboxSec.rows.length }),
            /* @__PURE__ */ u3("em", { class: "ib-mv", children: [
              /* @__PURE__ */ u3(
                "button",
                {
                  title: "Move up",
                  disabled: inboxSec.first,
                  onClick: (event) => {
                    event.stopPropagation();
                    on3.move(inboxSec.title, -1);
                  },
                  children: renderIcon("chevron-up")
                }
              ),
              /* @__PURE__ */ u3(
                "button",
                {
                  title: "Move down",
                  disabled: inboxSec.last,
                  onClick: (event) => {
                    event.stopPropagation();
                    on3.move(inboxSec.title, 1);
                  },
                  children: renderIcon("chevron-down")
                }
              )
            ] })
          ] }),
          inboxSec.closed ? "" : /* @__PURE__ */ u3(S, { children: [
            /* @__PURE__ */ u3("p", { children: inboxSec.sub }),
            inboxSec.rows.length ? inboxSec.rows.map((ibRow) => /* @__PURE__ */ u3(
              "a",
              {
                class: `ib-row${ibRow.sel ? " sel" : ""}${ibRow.pinned ? " pinned" : ""}`,
                "data-open": ibRow.ref,
                onClick: (event) => on3.open(event.currentTarget, event),
                onAuxClick: (event) => on3.aux(event.currentTarget, event),
                onContextMenu: (event) => on3.ctx(event.currentTarget, event),
                children: [
                  /* @__PURE__ */ u3("img", { src: ibRow.avatar, alt: "" }),
                  /* @__PURE__ */ u3("span", { class: "ib-t", children: [
                    /* @__PURE__ */ u3("b", { children: ibRow.title }),
                    /* @__PURE__ */ u3("i", { children: ibRow.sub })
                  ] }),
                  ibRow.fresh ? /* @__PURE__ */ u3("span", { class: "ib-new", children: "New activity" }) : "",
                  ibRow.snz ? /* @__PURE__ */ u3("span", { class: "ib-snz", children: ibRow.snz }) : "",
                  ibRow.comments ? /* @__PURE__ */ u3("span", { class: "ib-c", children: [
                    renderIcon("comment"),
                    SP,
                    ibRow.comments
                  ] }) : "",
                  /* @__PURE__ */ u3(
                    "span",
                    {
                      class: "ib-acts",
                      onClick: (event) => event.stopPropagation(),
                      children: [
                        ibRow.snzOpen ? /* @__PURE__ */ u3(S, { children: [
                          ibRow.snz ? /* @__PURE__ */ u3(
                            "button",
                            {
                              onClick: () => on3.snooze(ibRow.ref, "off", ibRow.updated),
                              children: "Wake"
                            }
                          ) : "",
                          /* @__PURE__ */ u3(
                            "button",
                            {
                              onClick: () => on3.snooze(ibRow.ref, "tomorrow", ibRow.updated),
                              children: "Tomorrow"
                            }
                          ),
                          /* @__PURE__ */ u3(
                            "button",
                            {
                              onClick: () => on3.snooze(ibRow.ref, "week", ibRow.updated),
                              children: "Next week"
                            }
                          ),
                          /* @__PURE__ */ u3(
                            "button",
                            {
                              onClick: () => on3.snooze(ibRow.ref, "activity", ibRow.updated),
                              children: "Until activity"
                            }
                          )
                        ] }) : null,
                        /* @__PURE__ */ u3(
                          "button",
                          {
                            class: ibRow.pinned ? "on" : "",
                            title: ibRow.pinned ? "Unpin" : "Pin to the top",
                            onClick: () => on3.pin(ibRow.ref),
                            children: renderIcon("bookmark")
                          }
                        ),
                        /* @__PURE__ */ u3(
                          "button",
                          {
                            title: "Snooze",
                            onClick: () => on3.snoozeMenu(ibRow.ref),
                            children: renderIcon("clock")
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )) : /* @__PURE__ */ u3("div", { class: "ib-none", children: query ? "No matches." : "Nothing here. Nice." })
          ] })
        ]
      },
      inboxSec.title
    ));
    const allClosed = !!secs && secs.every((inboxSec) => inboxSec.closed);
    return /* @__PURE__ */ u3("div", { class: "notes-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: [
        /* @__PURE__ */ u3("h1", { children: [
          renderIcon("checklist"),
          SP,
          "Inbox"
        ] }),
        /* @__PURE__ */ u3("div", { class: "np-tools", children: /* @__PURE__ */ u3(
          "button",
          {
            class: "btn small",
            id: "ibrefresh",
            onClick: on3.refresh,
            disabled: loading,
            children: loading ? "Loading\u2026" : "Refresh"
          }
        ) })
      ] }),
      /* @__PURE__ */ u3("div", { class: "ib-bar", children: [
        /* @__PURE__ */ u3(
          "input",
          {
            class: "input",
            placeholder: "Filter by title, repository, author or #\u2026",
            value: query,
            onInput: on3.query
          }
        ),
        /* @__PURE__ */ u3("label", { children: [
          "Sort",
          /* @__PURE__ */ u3("select", { class: "input", onChange: on3.sort, children: sorts.map(([key2, text]) => /* @__PURE__ */ u3("option", { value: key2, selected: key2 === sort, children: text })) })
        ] }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "btn small",
            onClick: () => on3.foldAll(!allClosed),
            disabled: !secs,
            children: allClosed ? "Expand all" : "Collapse all"
          }
        ),
        custom ? /* @__PURE__ */ u3("button", { class: "btn small", onClick: on3.resetOrder, children: "Reset order" }) : "",
        /* @__PURE__ */ u3(ViewsBar, { views, view: view2, naming, on: on3 })
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
    [0, 1, 2].map((index) => /* @__PURE__ */ u3("div", { class: "sk-row", style: `--i:${index}`, children: [
      /* @__PURE__ */ u3("div", { class: "sk sk-av" }),
      /* @__PURE__ */ u3("div", { class: "sk-card", children: [
        /* @__PURE__ */ u3("div", { class: "sk sk-line w40" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line w80" }),
        /* @__PURE__ */ u3("div", { class: "sk sk-line w60" })
      ] })
    ] }))
  ] });
  function PrLayout({
    header,
    body,
    side,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "pr-page", children: [
      header,
      /* @__PURE__ */ u3("div", { class: "pr-layout", children: [
        /* @__PURE__ */ u3("main", { class: "pr-main", children: body }),
        side.kind === "rail" ? /* @__PURE__ */ u3(
          "button",
          {
            class: "pane-rail side-rail",
            "data-show": "side",
            onClick: on3.show,
            title: "Show details",
            children: [
              renderIcon("columns"),
              /* @__PURE__ */ u3("span", { children: "Details" })
            ]
          }
        ) : side.kind === "aside" ? /* @__PURE__ */ u3("aside", { class: "pr-side", children: [
          /* @__PURE__ */ u3("div", { class: "side-top", children: [
            /* @__PURE__ */ u3("span", { children: "Details" }),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "fold-btn",
                "data-hide": "side",
                onClick: side.on.hide,
                title: "Hide this panel",
                children: renderIcon("x")
              }
            )
          ] }),
          side.inner
        ] }) : ""
      ] })
    ] });
  }
  var SplitLayout = ({
    header,
    split
  }) => /* @__PURE__ */ u3("div", { class: "pr-page is-split", children: [
    header,
    split
  ] });
  var Gate = ({
    err,
    go: go3,
    tok
  }) => /* @__PURE__ */ u3("div", { class: "gate", children: /* @__PURE__ */ u3("div", { class: "gate-card", children: [
    /* @__PURE__ */ u3("img", { src: "logo.png", alt: "", width: 72, height: 72 }),
    /* @__PURE__ */ u3("h1", { children: "Sign in to Pullscope" }),
    "\n  ",
    /* @__PURE__ */ u3("p", { class: "gate-err", children: [
      renderIcon("alert"),
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

  // src/app/comments.ts
  function stateOf(pull) {
    if (pull.merged) {
      return ["merged", "git-merge", "Merged"];
    }
    if (pull.state === "closed") {
      return ["closed", "git-pull-request-closed", "Closed"];
    }
    if (pull.draft) {
      return ["draft", "git-pull-request-draft", "Draft"];
    }
    return ["open", "git-pull-request", "Open"];
  }
  function prHeaderProps(bundle) {
    const pull = bundle.pull;
    const [st, ic, label] = stateOf(pull);
    const commentsTotal = pull.comments + pull.review_comments + bundle.timeline.filter((timelineEvent) => timelineEvent.event === "reviewed").length;
    const sq = (() => {
      const time = pull.additions + pull.deletions || 1;
      const small = time <= 5;
      const first = small ? pull.additions : Math.round(pull.additions / time * 5);
      const delta = small ? pull.deletions : 5 - first;
      const arr = [];
      for (let index = 0; index < 5; index++) {
        arr.push(index < first ? "a" : index < first + delta ? "d" : "");
      }
      return arr;
    })();
    const splitOk = appState.tab !== "files" && appState.tab !== "checks" && appState.tab !== "timeline";
    return {
      b: bundle,
      st,
      ic,
      label,
      tab: appState.tab,
      split: appState.split,
      hideSide: !!appState.hide.side,
      splitOk,
      commentsTotal,
      sq
    };
  }
  var isFolded = (key2, def = false) => key2 in appState.fold ? appState.fold[key2] : def;
  var folded = (key2, def = false) => isFolded(key2, def) ? " folded" : "";
  var reactionProps = (reactions, kind, id) => ({
    r: reactions || {},
    kind,
    id,
    defs: REACTS.map(([otherKind, text]) => ({ k: otherKind, e: text }))
  });
  var liveTasks = (hash) => appState.hasToken ? hash.replace(
    /<input[^>]*task-list-item-checkbox[^>]*>/g,
    (message) => message.replace(/\sdisabled(="[^"]*")?/g, "")
  ) : hash;
  function toggleTask(body, count) {
    let index = -1;
    let fence = false;
    return body.split("\n").map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence;
        return line;
      }
      if (fence) {
        return line;
      }
      return line.replace(
        /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/,
        (message, value, otherValue, innerValue) => ++index === count ? value + (otherValue === " " ? "x" : " ") + innerValue : message
      );
    }).join("\n");
  }
  var setTaskHtml = (html, count, on3) => {
    let index = -1;
    return html.replace(
      /<input[^>]*task-list-item-checkbox[^>]*>/g,
      (message) => ++index === count ? on3 ? /\schecked/.test(message) ? message : message.replace(/<input/, "<input checked") : message.replace(/\schecked(="[^"]*")?/, "") : message
    );
  };
  async function taskClick(event) {
    const checkbox = event.target.closest(
      "input.task-list-item-checkbox"
    );
    if (!checkbox || checkbox.disabled || !appState.bundle) {
      return;
    }
    const box = checkbox.closest(".tl-comment");
    const md = checkbox.closest(".markdown-body");
    if (!box || !md) {
      return;
    }
    event.preventDefault();
    const id = box.id.replace(/^c-/, "");
    const bundle = appState.bundle;
    const value = String(bundle.pull.id) === id ? bundle.pull : bundle.timeline.find((timelineEvent) => String(timelineEvent.id) === id);
    if (!value) {
      return;
    }
    const count = [
      ...md.querySelectorAll("input.task-list-item-checkbox")
    ].indexOf(checkbox);
    const body = toggleTask(value.body || "", count);
    if (body === (value.body || "")) {
      return;
    }
    const on3 = checkbox.checked;
    const was = value.body_html || "";
    value.body_html = setTaskHtml(was, count, on3);
    rerender();
    const actResult = value === bundle.pull ? await act("edit", { body, extra: {} }, "task", true) : await act(
      "edit_comment",
      { id: value.id, kind: "issue_comment", body },
      "task",
      true
    );
    if (actResult === void 0) {
      value.body_html = was;
      rerender();
      alert(
        `Couldn't update the checkbox: ${appState.actErr?.m || "unknown error"}`
      );
      return;
    }
    value.body = body;
    const key2 = `${prRef().repo}#${prRef().number}`;
    qc.set(key2, bundle);
    qc.m.get(key2).at = Date.now() - 2e4;
    tauri?.invoke("invalidate_pr", { url: key2 }).catch(() => {
    });
  }
  function hasComment(elId2) {
    const bundle = appState.bundle;
    const id = elId2.replace(/^c-/, "");
    if (!bundle) {
      return false;
    }
    return String(bundle.pull.id) === id || bundle.timeline.some((timelineEvent) => String(timelineEvent.id) === id) || bundle.review_comments.some(
      (reviewComment) => String(reviewComment.id) === id
    );
  }
  function commentBoxProps(commentLike, { isPr = false, flush = false } = {}) {
    return {
      onTask: (event) => {
        taskClick(event);
      },
      kb: appState.kbId === `c-${commentLike.id}`,
      flash: flashFor(`c-${commentLike.id}`),
      c: commentLike,
      assoc: ASSOC[commentLike.author_association ?? ""],
      bodyHtml: commentLike.body_html && commentLike.body_html.trim() ? liveTasks(commentLike.body_html) : "",
      folded: isFolded(`c:${commentLike.id}`),
      reactions: reactionProps(
        commentLike.reactions,
        isPr ? "pr" : "issue_comment",
        commentLike.id
      ),
      flush
    };
  }
  function hunkRows(hunk) {
    const rows = [];
    let offset = 0;
    let count = 0;
    for (const line of hunk.split("\n")) {
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (match) {
          offset = +match[1];
          count = +match[2];
        }
        rows.push({ kind: "hunk", text: line });
        continue;
      }
      const text = line[0];
      const txt = line.slice(1);
      if (text === "+") {
        rows.push({ kind: "add", n: count++, text: txt });
      } else if (text === "-") {
        rows.push({ kind: "del", o: offset++, text: txt });
      } else if (text === "\\") {
        rows.push({ kind: "meta", text: line });
      } else {
        rows.push({ kind: "ctx", o: offset++, n: count++, text: txt });
      }
    }
    return rows;
  }

  // src/app/reorder.ts
  var mem = /* @__PURE__ */ new Map();
  var savedOrder = (id) => {
    if (!mem.has(id)) {
      mem.set(id, load(`order:${id}`, []));
    }
    return mem.get(id);
  };
  var saveOrder = (id, options) => {
    mem.set(id, options);
    try {
      if (options.length) {
        localStorage.setItem(`order:${id}`, JSON.stringify(options));
      } else {
        localStorage.removeItem(`order:${id}`);
      }
    } catch {
    }
    render();
  };
  var arrange = (items, id, key2) => {
    const saved = savedOrder(id);
    const rank = (item) => {
      const index = saved.indexOf(key2(item));
      return index < 0 ? saved.length + items.indexOf(item) : index;
    };
    return [...items].sort(
      (firstItem, secondItem) => rank(firstItem) - rank(secondItem)
    );
  };
  var roCls = (id, key2) => {
    const row2 = appState.ro;
    if (!row2 || row2.id !== id) {
      return "";
    }
    return (row2.key === key2 ? " ro-lift" : "") + (row2.key !== key2 && row2.over?.title === key2 ? row2.over.after ? " ro-over-after" : " ro-over-before" : "");
  };
  var tops = (sel) => new Map(
    [...document.querySelectorAll(sel)].map((element) => [
      element.dataset.t,
      element.getBoundingClientRect().top
    ])
  );
  function roMove(sel, key2, save2) {
    const before = tops(sel);
    save2();
    const slide = (element) => {
      const dy = (before.get(element.dataset.t) ?? 0) - element.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) {
        element.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: "none" }],
          {
            duration: 320,
            easing: "cubic-bezier(.2,.8,.2,1)"
          }
        );
      }
      if (element.dataset.t === key2) {
        element.classList.add("ro-moved");
        setTimeout(() => element.classList.remove("ro-moved"), 1400);
      }
    };
    requestAnimationFrame(
      () => requestAnimationFrame(
        () => document.querySelectorAll(sel).forEach(slide)
      )
    );
  }
  function roGrip(event, id, sel, key2, order, commit) {
    event.preventDefault();
    event.stopPropagation();
    const y0 = event.clientY;
    let started = false;
    const over = (offset) => {
      const els = [...document.querySelectorAll(sel)].filter(
        (element) => element.dataset.t !== key2
      );
      const hit = els.find((element) => {
        const rect = element.getBoundingClientRect();
        return offset >= rect.top && offset <= rect.bottom;
      }) || els.reduce(
        (element, otherElement) => !element || Math.abs(otherElement.getBoundingClientRect().top - offset) < Math.abs(element.getBoundingClientRect().top - offset) ? otherElement : element,
        null
      );
      if (!hit) {
        return null;
      }
      const otherRect = hit.getBoundingClientRect();
      return {
        title: hit.dataset.t,
        after: offset > otherRect.top + Math.min(otherRect.height / 2, 60)
      };
    };
    beginDrag({
      move: (ev) => {
        if (!started) {
          if (Math.abs(ev.clientY - y0) < 5) {
            return;
          }
          started = true;
          appState.ro = { id, key: key2, over: null };
          setDragging(true);
        }
        const options = over(ev.clientY);
        const cur = appState.ro?.over;
        if (options?.title !== cur?.title || options?.after !== cur?.after) {
          appState.ro = { id, key: key2, over: options };
          render();
        }
      },
      end: () => {
        const to = appState.ro?.over;
        setDragging(false);
        appState.ro = null;
        if (!started) {
          return;
        }
        if (!to) {
          return render();
        }
        const options = order().filter((text) => text !== key2);
        options.splice(options.indexOf(to.title) + (to.after ? 1 : 0), 0, key2);
        roMove(sel, key2, () => commit(options));
      }
    });
  }

  // src/components/flash.ts
  var flashClass = (props) => props ? ` flash${props.pop ? " pop-in" : ""}` : "";
  function useFlash(props, kb) {
    const ref = A2(null);
    h2(() => {
      const el = ref.current;
      if (!props || !el) {
        return;
      }
      el.scrollIntoView({
        block: props.block,
        behavior: props.smooth ? "smooth" : "auto"
      });
      const main = el.closest(".main");
      if (!main) {
        return;
      }
      const end = Date.now() + 1500;
      let moved = false;
      let height = main.scrollHeight;
      const stop = () => {
        moved = true;
      };
      const timer = setInterval(() => {
        if (moved || Date.now() > end) {
          return clearInterval(timer);
        }
        if (main.scrollHeight !== height) {
          height = main.scrollHeight;
          el.scrollIntoView({ block: props.block });
        }
      }, 50);
      addEventListener("wheel", stop, { passive: true });
      addEventListener("touchmove", stop, { passive: true });
      addEventListener("keydown", stop);
      return () => {
        clearInterval(timer);
        removeEventListener("wheel", stop);
        removeEventListener("touchmove", stop);
        removeEventListener("keydown", stop);
      };
    }, [props?.n]);
    h2(() => {
      if (kb) {
        ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }, [kb]);
    return ref;
  }

  // src/components/Comments.tsx
  var NL = "\n  ";
  function Who({ p: pull, st }) {
    const plural2 = pull.commits === 1 ? "" : "s";
    return st === "merged" ? /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        "a",
        {
          class: "author",
          style: "text-decoration:underline;text-underline-offset:2px",
          href: pull.merged_by.html_url,
          children: pull.merged_by.login
        }
      ),
      " ",
      "merged ",
      pull.commits,
      " commit",
      plural2,
      " into"
    ] }) : /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("a", { class: "author", href: pull.user.html_url, children: pull.user.login }),
      " ",
      "wants to merge ",
      pull.commits,
      " commit",
      plural2,
      " into"
    ] });
  }
  function PrHeader({
    b: bundle,
    st,
    ic,
    label,
    tab,
    split,
    hideSide: hideSide2,
    splitOk,
    commentsTotal,
    sq,
    on: on3
  }) {
    const pull = bundle.pull;
    const count = pull.number;
    const at2 = st === "merged" ? pull.merged_at : st === "closed" ? pull.closed_at : pull.created_at;
    const tabs = [
      ["conversation", "comment-discussion", "Conversation", commentsTotal + 0],
      ["timeline", "clock", "Timeline", bundle.timeline.length],
      ["commits", "git-commit", "Commits", pull.commits],
      ["checks", "checklist", "Checks", (bundle.checks || []).length],
      ["files", "file-diff", "Files changed", pull.changed_files]
    ];
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("div", { class: "pr-title-area", children: [
        /* @__PURE__ */ u3("h1", { class: "pr-title", children: [
          /* @__PURE__ */ u3("span", { children: pull.title }),
          /* @__PURE__ */ u3("span", { class: "num", children: [
            "#",
            count
          ] }),
          pull.state === "open" && !pull.merged ? /* @__PURE__ */ u3(
            "button",
            {
              class: "copy-btn",
              id: "editpr",
              onClick: on3?.edit,
              title: "Edit title and description",
              children: renderIcon("pencil")
            }
          ) : "",
          /* @__PURE__ */ u3(
            "button",
            {
              class: "copy-btn",
              id: "prsummary",
              onClick: on3?.summary,
              title: "Copy a short summary (title, status, size, reviewers, link)",
              children: renderIcon("copy")
            }
          )
        ] }),
        NL,
        /* @__PURE__ */ u3("div", { class: "pr-meta", children: [
          /* @__PURE__ */ u3("span", { class: `state-pill state-${st}`, children: [
            renderIcon(ic),
            SP,
            label
          ] }),
          /* @__PURE__ */ u3("span", { children: /* @__PURE__ */ u3(Who, { p: pull, st }) }),
          SP,
          /* @__PURE__ */ u3(
            "span",
            {
              class: "branch",
              title: `${pull.base.repo.full_name}:${pull.base.ref}`,
              children: pull.base.label
            }
          ),
          SP,
          /* @__PURE__ */ u3("span", { children: "from" }),
          SP,
          /* @__PURE__ */ u3("span", { class: "branch", children: pull.head.label }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "copy-btn",
              id: "copybranch",
              onClick: on3?.copy,
              "aria-label": "Copy head branch name to clipboard",
              children: renderIcon("copy")
            }
          ),
          /* @__PURE__ */ u3("span", { children: When(at2) })
        ] })
      ] }),
      NL,
      /* @__PURE__ */ u3("div", { class: "pr-tabs", children: [
        /* @__PURE__ */ u3("span", { class: "mini", title: pull.title, children: [
          /* @__PURE__ */ u3("b", { children: [
            "#",
            count
          ] }),
          SP,
          pull.title
        ] }),
        /* @__PURE__ */ u3("nav", { children: tabs.map(([key2, text, otherText, otherCount]) => /* @__PURE__ */ u3(
          "a",
          {
            "data-tab": key2,
            class: tab === key2 ? "sel" : "",
            onClick: () => on3?.tab(key2),
            children: [
              renderIcon(text),
              otherText,
              /* @__PURE__ */ u3("span", { class: "counter", children: otherCount })
            ]
          }
        )) }),
        NL,
        /* @__PURE__ */ u3("div", { class: "tools", children: [
          /* @__PURE__ */ u3(
            "button",
            {
              class: "split-btn",
              id: "review",
              onClick: on3?.review,
              title: "Submit a review",
              children: [
                renderIcon("eye"),
                /* @__PURE__ */ u3("span", { children: "Review" })
              ]
            }
          ),
          /* @__PURE__ */ u3(
            "button",
            {
              class: `split-btn ${hideSide2 || split ? "" : "on"}`,
              id: "sidetoggle",
              onClick: on3?.side,
              title: "Show or hide the details panel",
              disabled: tab !== "conversation" || split,
              style: tab !== "conversation" ? "visibility:hidden" : "",
              children: [
                renderIcon("sidebar-expand"),
                /* @__PURE__ */ u3("span", { children: "Details" })
              ]
            }
          ),
          /* @__PURE__ */ u3(
            "button",
            {
              class: `split-btn ${splitOk && split ? "on" : ""}`,
              id: "split",
              onClick: on3?.split,
              title: splitOk ? "Split view: commits beside conversation" : "Split view is available on the Conversation and Commits tabs",
              disabled: !splitOk,
              children: [
                renderIcon("columns"),
                /* @__PURE__ */ u3("span", { children: "Split view" })
              ]
            }
          ),
          /* @__PURE__ */ u3("div", { class: "diffstat", children: [
            /* @__PURE__ */ u3("span", { class: "add", children: [
              "+",
              pull.additions
            ] }),
            /* @__PURE__ */ u3("span", { class: "del", children: [
              "-",
              pull.deletions
            ] }),
            /* @__PURE__ */ u3("span", { class: "sq", children: sq.map((color) => /* @__PURE__ */ u3("i", { class: color })) })
          ] })
        ] })
      ] })
    ] });
  }
  function FoldBtn({
    k: key2,
    title,
    def,
    folded: folded2,
    onFold
  }) {
    return /* @__PURE__ */ u3(
      "button",
      {
        ref: useReveal(key2),
        class: "fold-btn",
        "data-fold": key2,
        "data-def": def ? 1 : 0,
        title,
        onClick: onFold && ((event) => onFold(event, key2, def)),
        children: renderIcon(folded2 ? "chevron-right" : "chevron-down")
      }
    );
  }
  function ReactionsBar({
    r: reactions,
    kind,
    id,
    defs,
    on: on3
  }) {
    const live2 = !!(kind && id);
    const items = defs.filter(({ k: otherKind }) => (reactions?.[otherKind] ?? 0) > 0).map(
      ({ k: otherKind, e: text }) => live2 ? /* @__PURE__ */ u3(
        "span",
        {
          class: "reaction rc-btn",
          "data-rck": kind,
          "data-rcid": id,
          "data-rcc": otherKind,
          title: "Click to add or remove your reaction",
          onClick: on3 && ((ev) => on3.toggle(ev, kind, id, otherKind)),
          onMouseEnter: on3 && (() => on3.hover(kind, id)),
          children: [
            /* @__PURE__ */ u3("span", { class: "e", children: text }),
            /* @__PURE__ */ u3("span", { children: reactions?.[otherKind] })
          ]
        }
      ) : /* @__PURE__ */ u3("span", { class: "reaction", children: [
        /* @__PURE__ */ u3("span", { class: "e", children: text }),
        /* @__PURE__ */ u3("span", { children: reactions?.[otherKind] })
      ] })
    );
    const add = live2 ? /* @__PURE__ */ u3("span", { class: "react-wrap", children: /* @__PURE__ */ u3(
      "button",
      {
        class: "react-add",
        "data-rk": kind,
        "data-rid": id,
        title: "Add reaction",
        onClick: on3 && ((ev) => on3.add(ev, ev.currentTarget)),
        onMouseEnter: on3 && (() => on3.hover(kind, id)),
        children: renderIcon("smiley")
      }
    ) }) : null;
    return items.length || add ? /* @__PURE__ */ u3("div", { class: "reactions", children: [
      items,
      add
    ] }) : null;
  }
  function CommentBox({
    onTask,
    kb,
    flash,
    c: commentLike,
    assoc,
    bodyHtml,
    folded: folded2,
    reactions,
    flush,
    on: on3
  }) {
    const user = commentLike.user || commentLike.actor;
    const key2 = `c:${commentLike.id}`;
    const ref = useFlash(flash, kb);
    return /* @__PURE__ */ u3(
      "div",
      {
        ref,
        class: `tl-comment${folded2 ? " folded" : ""}${kb ? " kb" : ""}${flashClass(flash)}`,
        id: `c-${commentLike.id ?? ""}`,
        style: flush ? "margin-bottom:0" : void 0,
        children: [
          /* @__PURE__ */ u3("div", { class: "avatar-col", children: /* @__PURE__ */ u3("a", { href: user?.html_url, children: Av(user, 40) }) }),
          NL,
          /* @__PURE__ */ u3("div", { class: "cbox", children: [
            /* @__PURE__ */ u3("div", { class: "chead", children: [
              /* @__PURE__ */ u3("div", { children: [
                /* @__PURE__ */ u3(
                  FoldBtn,
                  {
                    k: key2,
                    title: "Hide this comment",
                    def: false,
                    folded: folded2,
                    onFold: on3?.fold
                  }
                ),
                SP,
                /* @__PURE__ */ u3("a", { class: "author u", href: user?.html_url, children: /* @__PURE__ */ u3(
                  "span",
                  {
                    class: "author",
                    style: "font-weight:600;color:var(--fgColor-default)",
                    children: user?.login || "ghost"
                  }
                ) }),
                " ",
                "commented",
                SP,
                /* @__PURE__ */ u3("a", { class: "ts", href: commentLike.html_url || "#", children: When(commentLike.created_at || commentLike.submitted_at) })
              ] }),
              NL,
              /* @__PURE__ */ u3("div", { class: "rt", children: [
                assoc ? /* @__PURE__ */ u3("span", { class: "assoc", children: assoc }) : "",
                /* @__PURE__ */ u3(
                  "button",
                  {
                    class: "cm-btn",
                    "data-cm": commentLike.id,
                    title: "Comment actions",
                    onClick: on3 && ((event) => on3.menu(event, event.currentTarget)),
                    children: "\u22EF"
                  }
                )
              ] })
            ] }),
            NL,
            /* @__PURE__ */ u3("div", { class: "cbody", children: bodyHtml ? /* @__PURE__ */ u3(
              "div",
              {
                class: "markdown-body",
                onClick: onTask,
                dangerouslySetInnerHTML: { __html: bodyHtml }
              }
            ) : /* @__PURE__ */ u3("span", { class: "empty", children: "No description provided." }) }),
            /* @__PURE__ */ u3(ReactionsBar, { ...reactions, on: on3?.react })
          ] })
        ]
      }
    );
  }
  function DiffHunkTable({ rows }) {
    return /* @__PURE__ */ u3("table", { class: "diff", children: [
      /* @__PURE__ */ u3("colgroup", { children: [
        /* @__PURE__ */ u3("col", { style: "width:50px" }),
        /* @__PURE__ */ u3("col", { style: "width:50px" }),
        /* @__PURE__ */ u3("col", {})
      ] }),
      rows.map((hunkRow) => {
        if (hunkRow.kind === "hunk") {
          return /* @__PURE__ */ u3("tr", { class: "hunk", children: [
            /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
            /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
            /* @__PURE__ */ u3("td", { class: "code", children: hunkRow.text })
          ] });
        }
        if (hunkRow.kind === "add") {
          return /* @__PURE__ */ u3("tr", { class: "add", children: [
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "num", children: hunkRow.n }),
            /* @__PURE__ */ u3("td", { class: "code", "data-marker": "+", children: hunkRow.text })
          ] });
        }
        if (hunkRow.kind === "del") {
          return /* @__PURE__ */ u3("tr", { class: "del", children: [
            /* @__PURE__ */ u3("td", { class: "num", children: hunkRow.o }),
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "code", "data-marker": "-", children: hunkRow.text })
          ] });
        }
        if (hunkRow.kind === "meta") {
          return /* @__PURE__ */ u3("tr", { children: [
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "code", style: "color:var(--fgColor-muted)", children: hunkRow.text })
          ] });
        }
        return /* @__PURE__ */ u3("tr", { children: [
          /* @__PURE__ */ u3("td", { class: "num", children: hunkRow.o }),
          /* @__PURE__ */ u3("td", { class: "num", children: hunkRow.n }),
          /* @__PURE__ */ u3("td", { class: "code", "data-marker": " ", children: hunkRow.text })
        ] });
      })
    ] });
  }

  // src/components/Merge.tsx
  function MergedBox({ head: head2 }) {
    return /* @__PURE__ */ u3("div", { class: "TL", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-break", style: "margin-left:0" }),
      /* @__PURE__ */ u3("div", { class: "merge-box", children: [
        /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3(
          "span",
          {
            class: "state-merged",
            style: "background:var(--bgColor-done-emphasis)",
            children: renderIcon("git-merge")
          }
        ) }),
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
      /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3(
        "span",
        {
          class: "state-closed",
          style: "background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))",
          children: renderIcon("git-pull-request-closed")
        }
      ) }),
      /* @__PURE__ */ u3("div", { class: "merge-card", children: /* @__PURE__ */ u3("div", { class: "row", children: /* @__PURE__ */ u3("div", { children: [
        /* @__PURE__ */ u3("h3", { children: "Closed with unmerged commits" }),
        /* @__PURE__ */ u3("p", { style: "font-size:14px;margin-top:4px", children: [
          "This pull request is closed, but the",
          " ",
          /* @__PURE__ */ u3("span", { class: "branch", children: head2 }),
          " branch has unmerged commits."
        ] })
      ] }) }) })
    ] });
  }
  var plural = (count) => count === 1 ? "" : "s";
  function Sec({
    k: key2,
    h: hashs,
    rerunable,
    open: open2,
    children,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "mb-sec", children: [
      /* @__PURE__ */ u3(
        "button",
        {
          class: `mb-h ${hashs[0]}`,
          "data-mb": key2,
          onClick: on3 && ((event) => on3.toggle(event, key2)),
          children: [
            /* @__PURE__ */ u3("span", { class: "mb-ic", children: renderIcon(hashs[1], 22) }),
            /* @__PURE__ */ u3("span", { class: "mb-t", children: [
              /* @__PURE__ */ u3("b", { children: hashs[2] }),
              /* @__PURE__ */ u3("i", { children: hashs[3] || "" })
            ] }),
            key2 === "ck" && rerunable ? /* @__PURE__ */ u3(
              "span",
              {
                class: "btn small",
                id: "rerunck",
                role: "button",
                onClick: on3?.rerun,
                children: "Re-run failed"
              }
            ) : "",
            renderIcon(open2 ? "chevron-up" : "chevron-down", 16)
          ]
        }
      ),
      open2 && children ? /* @__PURE__ */ u3("div", { class: "mb-body", children }) : ""
    ] });
  }
  function CkGroupView({
    g: ckGroup,
    on: on3
  }) {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        "button",
        {
          class: "mb-grp",
          "data-mb": `g${ckGroup.k}`,
          onClick: on3 && ((event) => on3.toggle(event, `g${ckGroup.k}`)),
          children: [
            ckGroup.title,
            SP,
            renderIcon(ckGroup.open ? "chevron-up" : "chevron-down", 12)
          ]
        }
      ),
      ckGroup.open ? ckGroup.items.map((ckItem) => /* @__PURE__ */ u3("a", { class: `mb-ck ${ckItem.st}`, href: ckItem.url || void 0, children: [
        renderIcon(ckItem.icon, 14),
        /* @__PURE__ */ u3("b", { children: ckItem.name }),
        ckItem.req ? /* @__PURE__ */ u3("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
        /* @__PURE__ */ u3("i", { children: ckItem.desc })
      ] })) : ""
    ] });
  }
  function MergeBox(props) {
    const { rv, ck, on: on3 } = props;
    const rvBody = /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("div", { class: "mb-line", children: [
        renderIcon("check", 14),
        SP,
        rv.ap,
        " approval",
        plural(rv.ap)
      ] }),
      rv.cr ? /* @__PURE__ */ u3("div", { class: "mb-line bad", children: [
        renderIcon("x-circle-fill", 14),
        SP,
        rv.cr,
        " requested changes"
      ] }) : "",
      /* @__PURE__ */ u3("div", { class: "mb-line", children: [
        renderIcon("person", 14),
        SP,
        rv.pend,
        " pending review",
        plural(rv.pend),
        rv.pend ? `: ${rv.pendNames}` : ""
      ] })
    ] });
    return /* @__PURE__ */ u3("div", { class: "merge-box", children: [
      /* @__PURE__ */ u3("div", { class: "badge", children: /* @__PURE__ */ u3("span", { style: "background:var(--bgColor-success-emphasis)", children: renderIcon("git-pull-request") }) }),
      /* @__PURE__ */ u3("div", { class: "merge-card mb-card", children: [
        props.draft ? /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3("div", { class: "mb-sec", children: /* @__PURE__ */ u3("div", { class: "mb-h", children: [
            /* @__PURE__ */ u3("span", { class: "mb-ic", children: renderIcon("git-pull-request-draft", 22) }),
            /* @__PURE__ */ u3("span", { class: "mb-t", children: [
              /* @__PURE__ */ u3("b", { children: "This pull request is still a work in progress" }),
              /* @__PURE__ */ u3("i", { children: "Draft pull requests cannot be merged." })
            ] }),
            /* @__PURE__ */ u3("button", { class: "btn primary", id: "doready", onClick: on3?.ready, children: props.busyReady ? "Updating\u2026" : "Ready for review" })
          ] }) }),
          /* @__PURE__ */ u3(ErrLine, { m: props.errReady })
        ] }) : "",
        /* @__PURE__ */ u3(Sec, { k: "rv", h: rv.h, open: rv.open, on: on3, children: rvBody }),
        ck ? /* @__PURE__ */ u3(Sec, { k: "ck", h: ck.h, rerunable: ck.rerunable, open: ck.open, on: on3, children: ck.groups.map((ckGroup) => /* @__PURE__ */ u3(CkGroupView, { g: ckGroup, on: on3 })) }) : "",
        props.behind ? /* @__PURE__ */ u3("div", { class: "mb-sec mb-warn", children: /* @__PURE__ */ u3("div", { class: "mb-h", children: [
          /* @__PURE__ */ u3("span", { class: "mb-ic", children: renderIcon("alert", 22) }),
          /* @__PURE__ */ u3("span", { class: "mb-t", children: [
            /* @__PURE__ */ u3("b", { children: "This branch is out-of-date with the base branch" }),
            /* @__PURE__ */ u3("i", { children: [
              "Merge the latest changes from ",
              props.baseRef,
              " into this branch."
            ] })
          ] }),
          /* @__PURE__ */ u3("button", { class: "btn", id: "updbranch", onClick: on3?.update, children: props.busyUpdate ? "Updating\u2026" : "Update branch" })
        ] }) }) : "",
        /* @__PURE__ */ u3("div", { class: "mb-sec", children: /* @__PURE__ */ u3("div", { class: `mb-h ${props.clean ? "ok" : "bad"}`, children: [
          /* @__PURE__ */ u3("span", { class: "mb-ic", children: renderIcon(props.clean ? "check-circle-fill" : "alert", 22) }),
          /* @__PURE__ */ u3("span", { class: "mb-t", children: [
            /* @__PURE__ */ u3("b", { children: props.clean ? "This branch has no conflicts with the base branch" : "This branch has conflicts that must be resolved" }),
            /* @__PURE__ */ u3("i", { children: props.clean ? "Merging can be performed automatically." : "Use the web editor or the command line to resolve conflicts." })
          ] })
        ] }) }),
        /* @__PURE__ */ u3(ErrLine, { m: props.errUpdate })
      ] })
    ] });
  }
  var VISIBLE_REVIEWERS = 5;
  function ReviewerRow({ r: rvRow, on: on3 }) {
    const ic = rvRow.st === "req" && rvRow.prev ? /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("span", { class: "again", title: "Asked to review again", children: renderIcon("clock") }),
      renderIcon(
        rvRow.prev === "approved" ? "check" : rvRow.prev === "changes_requested" ? "file-diff" : "comment"
      )
    ] }) : renderIcon(
      rvRow.st === "approved" ? "check" : rvRow.st === "changes_requested" ? "file-diff" : rvRow.st === "req" ? "dot-fill" : "comment"
    );
    const verdict = rvRow.st === "req" ? rvRow.prev : rvRow.st;
    const verdictClass = verdict === "approved" ? "ok" : verdict === "changes_requested" ? "bad" : verdict ? "" : "wait";
    return /* @__PURE__ */ u3("div", { class: "reviewer", children: [
      /* @__PURE__ */ u3("a", { href: rvRow.u.html_url, children: Av(rvRow.u, 20) }),
      /* @__PURE__ */ u3("a", { class: "nm", href: rvRow.u.html_url, children: rvRow.u.login }),
      /* @__PURE__ */ u3("span", { class: `st ${verdictClass}`, children: ic }),
      rvRow.canRe ? /* @__PURE__ */ u3(
        "button",
        {
          class: "rerequest",
          "data-rerequest": rvRow.u.login,
          title: `Ask ${rvRow.u.login} to review again`,
          onClick: (event) => on3.rerequest(event, rvRow.u.login ?? ""),
          children: renderIcon("sync")
        }
      ) : ""
    ] });
  }
  function PrSide(props) {
    const { on: on3 } = props;
    const rv = props.reviewers;
    const more = rv.length - VISIBLE_REVIEWERS;
    const rvSection = rv.length ? /* @__PURE__ */ u3(S, { children: [
      rv.slice(0, VISIBLE_REVIEWERS).map((rvRow) => /* @__PURE__ */ u3(ReviewerRow, { r: rvRow, on: on3 })),
      more > 0 ? /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("button", { class: "sb-toggle", id: "rvtoggle", onClick: on3.rvtoggle, children: [
          /* @__PURE__ */ u3("span", { children: [
            "+",
            more,
            " more reviewer",
            plural(more)
          ] }),
          renderIcon(props.showAll ? "chevron-up" : "chevron-down")
        ] }),
        props.showAll ? rv.slice(VISIBLE_REVIEWERS).map((rvRow) => /* @__PURE__ */ u3(ReviewerRow, { r: rvRow, on: on3 })) : ""
      ] }) : ""
    ] }) : /* @__PURE__ */ u3("div", { class: "sb-none", children: "No reviews" });
    const fb = (sideKey, name) => /* @__PURE__ */ u3(
      SideFold,
      {
        k: `sb:${name}`,
        folded: props.folded[sideKey],
        onFold: on3.fold
      }
    );
    const head2 = (sideKey, text) => /* @__PURE__ */ u3("div", { class: "sb-head", children: [
      fb(sideKey, text === "people" ? "people" : text),
      /* @__PURE__ */ u3("span", { children: text }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "gear-btn",
          title: `Edit ${text.toLowerCase()}`,
          onClick: () => on3.edit(sideKey),
          children: renderIcon("gear", 16, "gear")
        }
      )
    ] });
    const box = (sideKey) => `sb-item${props.folded[sideKey] ? " folded" : ""}`;
    const item = (sideKey, node) => /* @__PURE__ */ u3(
      "div",
      {
        class: `${box(sideKey)} ro-it${roCls("side", sideKey)}`,
        "data-t": sideKey,
        children: [
          node,
          /* @__PURE__ */ u3(
            "i",
            {
              class: "ro-grip",
              title: "Drag to reorder",
              onMouseDown: (event) => on3.grip(event, sideKey),
              children: "\u22EE\u22EE"
            }
          )
        ]
      }
    );
    const secs = {
      reviewers: /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("div", { class: "sb-head", children: [
          fb("reviewers", "Reviewers"),
          /* @__PURE__ */ u3("span", { children: "Reviewers" })
        ] }),
        rvSection
      ] }),
      assignees: /* @__PURE__ */ u3(S, { children: [
        head2("assignees", "Assignees"),
        props.assignees.length ? props.assignees.map((person) => /* @__PURE__ */ u3("div", { class: "reviewer", children: [
          /* @__PURE__ */ u3("a", { href: person.html_url, children: Av(person, 20) }),
          /* @__PURE__ */ u3("a", { class: "nm", href: person.html_url, children: person.login })
        ] })) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "No one\u2014" })
      ] }),
      labels: /* @__PURE__ */ u3(S, { children: [
        head2("labels", "Labels"),
        props.labels.length ? props.labels.map((otherItem) => /* @__PURE__ */ u3(
          "span",
          {
            class: "pill-label",
            style: `background:#${otherItem.color}33;color:#${otherItem.color};border-color:#${otherItem.color}`,
            children: otherItem.name
          }
        )) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "None yet" })
      ] }),
      milestone: /* @__PURE__ */ u3(S, { children: [
        head2("milestone", "Milestone"),
        props.milestone ? /* @__PURE__ */ u3("a", { class: "sb-link", href: props.milestone.html_url, children: props.milestone.title }) : /* @__PURE__ */ u3("span", { class: "sb-none", children: "No milestone" })
      ] }),
      people: /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("div", { class: "sb-head", children: [
          fb("people", "people"),
          /* @__PURE__ */ u3("span", { children: [
            props.peopleCount,
            " participant",
            plural(props.peopleCount)
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { class: "participants", children: props.people.map((person) => /* @__PURE__ */ u3("a", { href: person.html_url, title: person.login, children: Av(person, 32) })) })
      ] })
    };
    return /* @__PURE__ */ u3("div", { class: "pr-side-inner", children: arrange(SIDE_KEYS, "side", (sideKey) => sideKey).map(
      (sideKey) => item(sideKey, secs[sideKey])
    ) });
  }
  var SIDE_KEYS = [
    "reviewers",
    "assignees",
    "labels",
    "milestone",
    "people"
  ];
  function SideFold({
    k: key2,
    folded: folded2,
    onFold
  }) {
    return /* @__PURE__ */ u3(
      "button",
      {
        ref: useReveal(key2),
        class: "fold-btn",
        "data-fold": key2,
        "data-def": "0",
        title: "Hide section",
        onClick: (event) => {
          event.stopPropagation();
          onFold(key2, false);
        },
        children: renderIcon(folded2 ? "chevron-right" : "chevron-down")
      }
    );
  }
  function CommitsDialog(props) {
    const { on: on3 } = props;
    return /* @__PURE__ */ u3(
      "div",
      {
        class: "dlg-bg",
        id: "dlgbg",
        onMouseDown: on3 && ((event) => {
          if (event.target.id === "dlgbg") {
            on3.close();
          }
        }),
        children: /* @__PURE__ */ u3("div", { class: "dlg cp-dlg", children: [
          /* @__PURE__ */ u3("div", { class: "cp-h", children: [
            /* @__PURE__ */ u3("h2", { children: "Select commits to view" }),
            /* @__PURE__ */ u3("button", { class: "icon-btn", id: "cpx", title: "Close", onClick: on3?.close, children: renderIcon("x") })
          ] }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: `cp-opt${props.allOn ? " on" : ""}`,
              id: "cpall",
              onClick: on3?.all,
              children: [
                /* @__PURE__ */ u3("b", { children: "All commits" }),
                /* @__PURE__ */ u3("i", { children: [
                  props.count,
                  " commit",
                  plural(props.count)
                ] })
              ]
            }
          ),
          props.since ? /* @__PURE__ */ u3(
            "button",
            {
              class: `cp-opt${props.since.on ? " on" : ""}`,
              id: "cpsince",
              disabled: !props.since.n,
              onClick: on3?.since,
              children: [
                /* @__PURE__ */ u3("b", { children: "Changes since your last review" }),
                /* @__PURE__ */ u3("i", { children: props.since.n ? `${props.since.n} commit${plural(props.since.n)}` : "No new commits" })
              ]
            }
          ) : "",
          /* @__PURE__ */ u3("div", { class: "cp-sub", children: "Select a commit, or click a second one to view the range between them" }),
          /* @__PURE__ */ u3(
            "input",
            {
              class: "input cp-q",
              id: "cpq",
              placeholder: "Filter commits\u2026",
              value: props.filter,
              onInput: on3?.filter
            }
          ),
          /* @__PURE__ */ u3("div", { class: "cp-list", id: "cplist", "data-q": props.filter.toLowerCase(), children: props.rows.map((cpRow) => /* @__PURE__ */ u3(
            "label",
            {
              class: `cp-row${cpRow.on ? " on" : ""}`,
              "data-cp": cpRow.i,
              hidden: cpRow.hidden,
              onClick: on3 && ((event) => on3.pick(event, cpRow.i)),
              children: [
                /* @__PURE__ */ u3("input", { type: "checkbox", checked: cpRow.on, tabindex: -1 }),
                /* @__PURE__ */ u3("span", { class: "cp-t", children: [
                  /* @__PURE__ */ u3("b", { children: cpRow.title }),
                  /* @__PURE__ */ u3("i", { children: [
                    cpRow.by,
                    " committed ",
                    cpRow.when
                  ] })
                ] }),
                /* @__PURE__ */ u3("code", { children: cpRow.sha })
              ]
            }
          )).reverse() }),
          /* @__PURE__ */ u3("div", { class: "btns", children: [
            /* @__PURE__ */ u3("span", { class: "cp-sel", children: props.selLabel }),
            /* @__PURE__ */ u3("span", { class: "sp" }),
            /* @__PURE__ */ u3("button", { class: "btn", id: "cpcancel", onClick: on3?.close, children: "Cancel" }),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "btn primary",
                id: "cpsave",
                disabled: !props.hasPick,
                onClick: on3?.save,
                children: "Save"
              }
            )
          ] })
        ] })
      }
    );
  }
  function FcBar(props) {
    const { on: on3 } = props;
    return /* @__PURE__ */ u3("div", { class: "fc-bar", children: [
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small",
          id: "fcbtn",
          title: "Choose which commits to view",
          onClick: on3?.commits,
          children: [
            renderIcon("git-commit"),
            SP,
            props.label,
            props.count !== null ? /* @__PURE__ */ u3(S, { children: [
              SP,
              /* @__PURE__ */ u3("span", { class: "counter", children: props.count })
            ] }) : "",
            props.code ? /* @__PURE__ */ u3(S, { children: [
              SP,
              /* @__PURE__ */ u3("code", { children: props.code })
            ] }) : "",
            SP,
            "\u25BE"
          ]
        }
      ),
      props.nav ? /* @__PURE__ */ u3("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u3(
          "button",
          {
            "data-fstep": "-1",
            disabled: props.nav.prevOff,
            onClick: on3 && (() => on3.step(-1)),
            children: "\u2039 Prev"
          }
        ),
        /* @__PURE__ */ u3(
          "button",
          {
            "data-fstep": "1",
            disabled: props.nav.nextOff,
            onClick: on3 && (() => on3.step(1)),
            children: "Next \u203A"
          }
        )
      ] }) : "",
      props.hasRange ? /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("span", { class: "fc-t", children: props.title }),
        /* @__PURE__ */ u3("button", { class: "link-btn", id: "fcall", onClick: on3?.all, children: "Show all commits" })
      ] }) : ""
    ] });
  }
  var SORTS = [
    ["path", "GitHub order"],
    ["pathz", "Path Z\u2013A"],
    ["most", "Most changed"],
    ["least", "Least changed"],
    ["comments", "Most comments"],
    ["status", "By status"]
  ];
  function FilesBar(props) {
    const { on: on3 } = props;
    return /* @__PURE__ */ u3("div", { class: "files-bar", children: [
      /* @__PURE__ */ u3("div", { class: "seg-ctl", children: [
        /* @__PURE__ */ u3(
          "button",
          {
            class: props.mode === "unified" ? "on" : "",
            "data-dmode": "unified",
            onClick: on3 && (() => on3.mode("unified")),
            children: "Unified"
          }
        ),
        /* @__PURE__ */ u3(
          "button",
          {
            class: props.mode === "split" ? "on" : "",
            "data-dmode": "split",
            onClick: on3 && (() => on3.mode("split")),
            children: "Split"
          }
        )
      ] }),
      /* @__PURE__ */ u3(
        "select",
        {
          class: "input fsort",
          id: "fsort",
          title: "Sort files",
          onChange: on3?.sort,
          children: SORTS.map(([otherValue, text]) => /* @__PURE__ */ u3("option", { value: otherValue, selected: props.sort === otherValue, children: text }))
        }
      ),
      props.total ? /* @__PURE__ */ u3(
        "button",
        {
          class: "link-btn fv-prog",
          title: props.viewed === props.total ? "Clear all viewed marks" : "Mark every file as viewed",
          onClick: props.onViewedAll,
          children: [
            props.viewed,
            "/",
            props.total,
            " viewed"
          ]
        }
      ) : "",
      props.pending ? /* @__PURE__ */ u3("button", { class: "btn small primary", id: "finishrev", onClick: on3?.finish, children: [
        "Finish review \xB7 ",
        props.pending,
        " comment",
        plural(props.pending)
      ] }) : "",
      /* @__PURE__ */ u3(
        "button",
        {
          class: "link-btn",
          "data-foldall": props.allFolded ? "open" : "close",
          "data-files": props.names.join("\n"),
          onClick: on3 && (() => on3.foldAll(props.allFolded, props.names)),
          children: props.allFolded ? "Expand all files" : "Collapse all files"
        }
      )
    ] });
  }
  function FileBox(props) {
    const { on: on3 } = props;
    const rv = useReveal(`f:${props.name}`);
    return /* @__PURE__ */ u3("div", { class: `file${props.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3(
        "div",
        {
          ref: rv,
          class: "file-head",
          "data-fold": `f:${props.name}`,
          onClick: on3 && ((event) => on3.fold(event, `f:${props.name}`, false)),
          children: [
            /* @__PURE__ */ u3("span", { class: "tgl", children: renderIcon(props.closed ? "chevron-right" : "chevron-down") }),
            /* @__PURE__ */ u3("span", { class: "stat", children: [
              /* @__PURE__ */ u3("span", { class: "a", children: [
                "+",
                props.add
              ] }),
              SP,
              /* @__PURE__ */ u3("span", { class: "d", children: [
                "\u2212",
                props.del
              ] })
            ] }),
            /* @__PURE__ */ u3("span", { class: "sq", children: props.sq.map((color) => /* @__PURE__ */ u3("i", { class: color })) }),
            /* @__PURE__ */ u3("span", { class: "path", children: props.name }),
            props.onViewed ? /* @__PURE__ */ u3(
              "label",
              {
                class: `fv${props.viewed ? " on" : ""}`,
                title: "Mark this file as viewed",
                onClick: (event) => event.stopPropagation(),
                children: [
                  /* @__PURE__ */ u3(
                    "input",
                    {
                      type: "checkbox",
                      checked: !!props.viewed,
                      onChange: props.onViewed
                    }
                  ),
                  " ",
                  "Viewed"
                ]
              }
            ) : ""
          ]
        }
      ),
      props.children
    ] });
  }
  function CommitsList({ rows }) {
    return /* @__PURE__ */ u3("div", { style: "border:1px solid var(--borderColor-default);border-radius:6px", children: rows.length ? rows.map((value) => /* @__PURE__ */ u3("div", { style: "padding:16px;border-bottom:1px solid var(--borderColor-muted)", children: value })) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No commits listed." }) });
  }
  function CmItem({ c: cmRow, on: on3 }) {
    return /* @__PURE__ */ u3(
      "div",
      {
        class: `cm ${cmRow.on ? "on" : ""}`,
        "data-sha": cmRow.sha,
        onClick: on3 && (() => on3.pick(cmRow.sha)),
        children: [
          /* @__PURE__ */ u3("span", { class: "cm-av", children: cmRow.author ? Av(cmRow.author, 24) : /* @__PURE__ */ u3("i", { children: cmRow.initial }) }),
          /* @__PURE__ */ u3("span", { class: "cm-t", children: [
            /* @__PURE__ */ u3("b", { children: cmRow.title }),
            /* @__PURE__ */ u3("i", { children: cmRow.sub })
          ] }),
          cmRow.n ? /* @__PURE__ */ u3("span", { class: "cm-n", children: [
            renderIcon("comment"),
            cmRow.n
          ] }) : "",
          /* @__PURE__ */ u3("code", { children: cmRow.sha.slice(0, 7) })
        ]
      }
    );
  }
  function Rail({
    k: key2,
    label,
    ic,
    on: on3
  }) {
    return /* @__PURE__ */ u3(
      "button",
      {
        class: "pane-rail",
        "data-show": key2,
        title: `Show ${label}`,
        onClick: on3 && (() => on3.hide(key2, false)),
        children: [
          renderIcon(ic),
          /* @__PURE__ */ u3("span", { children: label })
        ]
      }
    );
  }
  function SplitView(props) {
    const { on: on3 } = props;
    const pl = useScroller("l");
    const pr = useScroller("r");
    const left = props.hl ? /* @__PURE__ */ u3(Rail, { k: "l", label: "Commits", ic: "git-commit", on: on3 }) : /* @__PURE__ */ u3("section", { class: "pane pane-l", children: [
      /* @__PURE__ */ u3("div", { class: `fold-sec${props.foldList ? " folded" : ""}`, children: [
        /* @__PURE__ */ u3("div", { class: "pane-h", children: [
          renderIcon("git-commit"),
          /* @__PURE__ */ u3("span", { children: "Commits" }),
          /* @__PURE__ */ u3("span", { class: "counter", children: props.count }),
          /* @__PURE__ */ u3("span", { class: "sp" }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "fold-btn flip-btn",
              "data-flip": "",
              title: "Swap sides (F)",
              onClick: on3?.flip,
              children: "\u21C4"
            }
          ),
          /* @__PURE__ */ u3(
            FoldBtn,
            {
              k: "cm-list",
              title: "Collapse commit list",
              def: false,
              folded: props.foldList,
              onFold: on3?.fold
            }
          ),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "fold-btn",
              "data-hide": "l",
              title: "Hide this panel",
              onClick: on3 && (() => on3.hide("l", true)),
              children: renderIcon("x")
            }
          )
        ] }),
        /* @__PURE__ */ u3("div", { class: "cm-list", children: [
          /* @__PURE__ */ u3(
            "div",
            {
              class: `cm all ${props.allOn ? "on" : ""}`,
              "data-sha": "",
              onClick: on3 && (() => on3.pick("")),
              children: [
                /* @__PURE__ */ u3("span", { class: "cm-av", children: /* @__PURE__ */ u3("i", { children: renderIcon("diff") }) }),
                /* @__PURE__ */ u3("span", { class: "cm-t", children: [
                  /* @__PURE__ */ u3("b", { children: "All changes" }),
                  /* @__PURE__ */ u3("i", { children: props.allSub })
                ] })
              ]
            }
          ),
          props.rows.map((cmRow) => /* @__PURE__ */ u3(CmItem, { c: cmRow, on: on3 }))
        ] })
      ] }),
      /* @__PURE__ */ u3("div", { class: `fold-sec${props.foldDiff ? " folded" : ""}`, children: [
        /* @__PURE__ */ u3("div", { class: "pane-h sub", children: [
          renderIcon("file-diff"),
          /* @__PURE__ */ u3("span", { children: props.subTitle }),
          /* @__PURE__ */ u3("span", { class: "sp" }),
          /* @__PURE__ */ u3(
            FoldBtn,
            {
              k: "cm-diff",
              title: "Collapse changes",
              def: false,
              folded: props.foldDiff,
              onFold: on3?.fold
            }
          )
        ] }),
        /* @__PURE__ */ u3(
          "div",
          {
            class: "pane-body",
            ref: pl,
            onScroll: on3 && ((event) => on3.scroll("l", event)),
            children: props.diff
          }
        )
      ] })
    ] });
    const right = props.hr ? /* @__PURE__ */ u3(Rail, { k: "r", label: "Conversation", ic: "comment-discussion", on: on3 }) : /* @__PURE__ */ u3("section", { class: "pane pane-r", children: [
      /* @__PURE__ */ u3("div", { class: "pane-h", children: [
        renderIcon("comment-discussion"),
        /* @__PURE__ */ u3("span", { children: "Conversation" }),
        /* @__PURE__ */ u3("span", { class: "sp" }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "fold-btn flip-btn",
            "data-flip": "",
            title: "Swap sides (F)",
            onClick: on3?.flip,
            children: "\u21C4"
          }
        ),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "fold-btn",
            "data-hide": "r",
            title: "Hide this panel",
            onClick: on3 && (() => on3.hide("r", true)),
            children: renderIcon("x")
          }
        )
      ] }),
      /* @__PURE__ */ u3(
        "div",
        {
          class: "pane-body",
          ref: pr,
          onScroll: on3 && ((event) => on3.scroll("r", event)),
          children: props.right
        }
      )
    ] });
    return /* @__PURE__ */ u3(
      "div",
      {
        class: `split ${props.hl ? "hl" : ""} ${props.hr ? "hr" : ""} ${props.flip ? "flip" : ""}`,
        children: [
          left,
          props.hl || props.hr ? "" : /* @__PURE__ */ u3(
            "div",
            {
              class: "gutter",
              id: "gutter",
              title: "Drag to resize",
              onMouseDown: on3?.gutter
            }
          ),
          right
        ]
      }
    );
  }

  // src/components/Dialogs.tsx
  var Err = ({ m: message }) => /* @__PURE__ */ u3("div", { id: "reverr", children: message ? /* @__PURE__ */ u3("div", { class: "act-err", children: message }) : "" });
  var REVS = [
    ["COMMENT", "Comment", "Submit general feedback without explicit approval."],
    ["APPROVE", "Approve", "Submit feedback and approve merging these changes."],
    [
      "REQUEST_CHANGES",
      "Request changes",
      "Submit feedback that must be addressed before merging."
    ]
  ];
  var ReviewDialog = (props) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Finish your review" }),
    /* @__PURE__ */ u3(DraftBox, { k: "review", ph: props.ph, rows: 5, submit: props.ok }),
    /* @__PURE__ */ u3("div", { class: "radios", children: REVS.filter(([value]) => !props.own || value === "COMMENT").map(
      ([otherValue, text, otherText]) => /* @__PURE__ */ u3("label", { children: [
        /* @__PURE__ */ u3(
          "input",
          {
            type: "radio",
            name: "rev",
            value: otherValue,
            checked: props.ev === otherValue,
            onChange: () => props.onEv(otherValue)
          }
        ),
        " ",
        /* @__PURE__ */ u3("b", { children: text }),
        " ",
        /* @__PURE__ */ u3("span", { children: otherText })
      ] })
    ) }),
    /* @__PURE__ */ u3(Err, { m: props.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "revcancel", onClick: props.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "revsubmit", onClick: props.ok, children: "Submit review" })
    ] })
  ] }) });
  var EditPrDialog = (otherValue) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Edit pull request" }),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Title" }),
    /* @__PURE__ */ u3(
      "input",
      {
        class: "input",
        id: "eptitle",
        value: otherValue.title,
        onInput: (event) => otherValue.onTitle(event.target.value),
        style: "width:100%;box-sizing:border-box;height:34px"
      }
    ),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Description" }),
    /* @__PURE__ */ u3(DraftBox, { k: "prbody", ph: "Describe your changes", rows: 8 }),
    /* @__PURE__ */ u3(Err, { m: otherValue.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "epcancel", onClick: otherValue.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "epsave", onClick: otherValue.ok, children: "Save" })
    ] })
  ] }) });
  var ConfirmDialog = (value) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: value.title }),
    /* @__PURE__ */ u3("p", { children: value.text }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "cfcancel", onClick: value.close, children: "Cancel" }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: `btn ${value.danger ? "danger" : "primary"}`,
          id: "cfok",
          onClick: value.ok,
          children: value.label
        }
      )
    ] })
  ] }) });
  var EditCommentDialog = (value) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
    /* @__PURE__ */ u3("h2", { children: "Edit comment" }),
    /* @__PURE__ */ u3(DraftBox, { k: "editc", ph: "Edit your comment", rows: 6 }),
    /* @__PURE__ */ u3(Err, { m: value.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "eccancel", onClick: value.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "ecsave", onClick: value.ok, children: "Save" })
    ] })
  ] }) });
  var DeleteCommentDialog = (value) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "Delete this comment?" }),
    /* @__PURE__ */ u3("p", { style: "color:var(--fgColor-muted)", children: "This can't be undone." }),
    /* @__PURE__ */ u3(Err, { m: value.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "dccancel", onClick: value.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn danger", id: "dcdo", onClick: value.ok, children: "Delete" })
    ] })
  ] }) });
  var HideCommentDialog = (otherValue) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "Hide this comment" }),
    /* @__PURE__ */ u3("label", { class: "np-l", children: "Reason" }),
    /* @__PURE__ */ u3(
      "select",
      {
        class: "sel",
        id: "hcreason",
        style: "width:100%;height:34px",
        onChange: otherValue.pick,
        children: otherValue.reasons.map(([innerValue, line]) => /* @__PURE__ */ u3(
          "option",
          {
            value: innerValue,
            selected: innerValue === otherValue.reason,
            children: line
          }
        ))
      }
    ),
    /* @__PURE__ */ u3(Err, { m: otherValue.err }),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "hccancel", onClick: otherValue.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "hcdo", onClick: otherValue.ok, children: "Hide comment" })
    ] })
  ] }) });
  var TokenDialog = (props) => /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg", children: [
    /* @__PURE__ */ u3("h2", { children: "GitHub classic token" }),
    /* @__PURE__ */ u3("p", { children: [
      "Use a ",
      /* @__PURE__ */ u3("b", { children: "classic" }),
      " personal access token with the ",
      /* @__PURE__ */ u3("code", { children: "repo" }),
      " ",
      "scope. It lists all your repositories (including organization ones) and raises the rate limit to 5,000 requests per hour. Organization with SSO: after creating it, click ",
      /* @__PURE__ */ u3("b", { children: "Configure SSO \u2192 Authorize" }),
      ". Stored in your OS keychain. Leave empty and save to remove it."
    ] }),
    /* @__PURE__ */ u3("div", { class: "oauth-row", children: [
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "oauthgo", onClick: props.go, children: "Sign in with GitHub" }),
      /* @__PURE__ */ u3("span", { children: "or paste a token below" })
    ] }),
    /* @__PURE__ */ u3("div", { id: "oauthbox", children: props.code ? /* @__PURE__ */ u3("div", { class: "oauth-code", children: [
      /* @__PURE__ */ u3("span", { children: "Enter this code on GitHub" }),
      /* @__PURE__ */ u3("b", { children: props.code }),
      /* @__PURE__ */ u3("small", { children: "Waiting for approval\u2026" })
    ] }) : props.err ? /* @__PURE__ */ u3("div", { class: "err", style: "margin:8px 0", children: props.err }) : "" }),
    /* @__PURE__ */ u3("p", { children: /* @__PURE__ */ u3("a", { href: "https://github.com/settings/tokens/new?scopes=repo&description=Pullscope", children: "Create a classic token (repo scope preselected) \u2197" }) }),
    /* @__PURE__ */ u3(
      "input",
      {
        class: "input",
        id: "tokeninput",
        type: "password",
        value: props.text,
        onInput: props.input,
        placeholder: "ghp_\u2026",
        style: "width:100%;box-sizing:border-box"
      }
    ),
    /* @__PURE__ */ u3("div", { class: "btns", children: [
      /* @__PURE__ */ u3("button", { class: "btn", id: "tokcancel", onClick: props.close, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn primary", id: "toksave", onClick: props.save, children: "Save" })
    ] })
  ] }) });
  var RepoPickDialog = (props) => {
    const query = props.q.toLowerCase();
    const shown2 = (props.repos || []).filter(
      (row2) => row2.full_name.toLowerCase().includes(query)
    );
    return /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
      /* @__PURE__ */ u3("h2", { children: "Choose repositories" }),
      /* @__PURE__ */ u3("p", { children: "Only the ticked repositories are listed and fetched (sidebar, inbox, notifications). Tick none, or all, to use every repository. Pasting a pull request link still opens any repository." }),
      /* @__PURE__ */ u3(
        "input",
        {
          class: "input",
          id: "rpq",
          placeholder: "Filter\u2026",
          value: props.q,
          onInput: props.input,
          style: "width:100%;box-sizing:border-box;height:34px"
        }
      ),
      /* @__PURE__ */ u3("div", { class: "rp-bar", children: [
        /* @__PURE__ */ u3("span", { children: [
          props.on.size,
          " selected"
        ] }),
        /* @__PURE__ */ u3("button", { class: "btn", onClick: () => props.all(true), children: "Select shown" }),
        /* @__PURE__ */ u3("button", { class: "btn", onClick: () => props.all(false), children: "Clear" })
      ] }),
      /* @__PURE__ */ u3("div", { class: "rp-list", children: props.repos ? shown2.length ? shown2.map((row2) => /* @__PURE__ */ u3("label", { class: "rp-row", children: [
        /* @__PURE__ */ u3(
          "input",
          {
            type: "checkbox",
            checked: props.on.has(row2.full_name),
            onChange: () => props.toggle(row2.full_name)
          }
        ),
        " ",
        /* @__PURE__ */ u3("b", { children: row2.full_name }),
        row2.private ? /* @__PURE__ */ u3("i", { children: "private" }) : ""
      ] })) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "No matches." }) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading repositories\u2026" }) }),
      /* @__PURE__ */ u3(Err, { m: props.err }),
      /* @__PURE__ */ u3("div", { class: "btns", children: [
        /* @__PURE__ */ u3("button", { class: "btn", id: "rpcancel", onClick: props.close, children: "Cancel" }),
        /* @__PURE__ */ u3("button", { class: "btn primary", id: "rpsave", onClick: props.save, children: "Save" })
      ] })
    ] }) });
  };
  var META_T = {
    labels: "Labels",
    assignees: "Assignees",
    milestone: "Milestone"
  };
  var MetaDialog = (props) => {
    const query = props.q.toLowerCase();
    const one = props.field === "milestone";
    const shown2 = (props.items || []).filter(
      (row2) => row2.name.toLowerCase().includes(query)
    );
    return /* @__PURE__ */ u3("div", { class: "dlg-bg", id: "dlgbg", children: /* @__PURE__ */ u3("div", { class: "dlg wide", children: [
      /* @__PURE__ */ u3("h2", { children: META_T[props.field] }),
      /* @__PURE__ */ u3(
        "input",
        {
          class: "input",
          id: "metaq",
          placeholder: "Filter\u2026",
          value: props.q,
          onInput: props.input,
          style: "width:100%;box-sizing:border-box;height:34px"
        }
      ),
      /* @__PURE__ */ u3("div", { class: "rp-list", children: props.items ? /* @__PURE__ */ u3(S, { children: [
        one && /* @__PURE__ */ u3("label", { class: "rp-row", children: [
          /* @__PURE__ */ u3(
            "input",
            {
              type: "radio",
              name: "ms",
              checked: !props.on.length,
              onChange: () => props.pick("")
            }
          ),
          " ",
          /* @__PURE__ */ u3("b", { children: "No milestone" })
        ] }),
        shown2.length ? shown2.map((row2) => /* @__PURE__ */ u3("label", { class: "rp-row", children: [
          /* @__PURE__ */ u3(
            "input",
            {
              type: one ? "radio" : "checkbox",
              name: "ms",
              checked: props.on.includes(row2.id),
              onChange: () => props.pick(row2.id)
            }
          ),
          row2.avatar && /* @__PURE__ */ u3(
            "img",
            {
              class: "mt-av",
              src: row2.avatar,
              width: "20",
              height: "20"
            }
          ),
          row2.color && /* @__PURE__ */ u3("i", { class: "mt-dot", style: `background:#${row2.color}` }),
          /* @__PURE__ */ u3("b", { children: row2.name })
        ] })) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "None found." })
      ] }) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading\u2026" }) }),
      /* @__PURE__ */ u3(Err, { m: props.err }),
      /* @__PURE__ */ u3("div", { class: "btns", children: [
        /* @__PURE__ */ u3("button", { class: "btn", onClick: props.close, children: "Cancel" }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: "btn primary",
            disabled: props.busy || !props.items,
            onClick: props.save,
            children: props.busy ? "Saving\u2026" : "Save"
          }
        )
      ] })
    ] }) });
  };
  var CmPop = ({
    x: left,
    y: offset,
    hr,
    edit,
    hide: hide2,
    del,
    pick
  }) => /* @__PURE__ */ u3("div", { class: "react-pop cm-pop", style: `left:${left}px;top:${offset}px`, children: [
    /* @__PURE__ */ u3("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" }),
    /* @__PURE__ */ u3("button", { "data-h": "md", onClick: () => pick("md"), children: "Copy Markdown" }),
    /* @__PURE__ */ u3("button", { "data-h": "quote", onClick: () => pick("quote"), children: "Quote reply" }),
    /* @__PURE__ */ u3("button", { "data-h": "issue", onClick: () => pick("issue"), children: "Reference in new issue" }),
    hr ? /* @__PURE__ */ u3("hr", {}) : "",
    edit ? /* @__PURE__ */ u3("button", { "data-h": "edit", onClick: () => pick("edit"), children: "Edit" }) : "",
    hide2 ? /* @__PURE__ */ u3("button", { "data-h": "hide", onClick: () => pick("hide"), children: "Hide" }) : "",
    del ? /* @__PURE__ */ u3("button", { "data-h": "del", class: "danger", onClick: () => pick("del"), children: "Delete" }) : ""
  ] });
  var ReactPop = ({
    x: left,
    y: offset,
    reacts,
    pick
  }) => /* @__PURE__ */ u3("div", { class: "react-pop", style: `left:${left}px;top:${offset}px`, children: reacts.map(([key2, em]) => /* @__PURE__ */ u3("button", { "data-c": key2, onClick: () => pick(key2), children: em })) });
  var CtxPop = ({
    x: left,
    y: offset,
    pick
  }) => /* @__PURE__ */ u3("div", { class: "react-pop cm-pop", style: `left:${left}px;top:${offset}px`, children: [
    /* @__PURE__ */ u3("button", { "data-h": "new", onClick: () => pick("new"), children: "Open in new tab" }),
    /* @__PURE__ */ u3("button", { "data-h": "here", onClick: () => pick("here"), children: "Open" }),
    /* @__PURE__ */ u3("button", { "data-h": "link", onClick: () => pick("link"), children: "Copy link" })
  ] });
  var focusEl = (el) => {
    el?.focus();
  };
  var Palette = (props) => /* @__PURE__ */ u3(
    "div",
    {
      class: "dlg-bg palette",
      onMouseDown: (event) => {
        if (event.target === event.currentTarget) {
          props.close();
        }
      },
      children: /* @__PURE__ */ u3("div", { class: "dlg pal", children: [
        /* @__PURE__ */ u3(
          "input",
          {
            class: "pal-in",
            placeholder: "Jump to a pull request \u2014 owner/repo#123, a URL, or search recent\u2026",
            value: props.q,
            ref: focusEl,
            onInput: (event) => props.onQ(event.target.value),
            onKeyDown: props.onKey
          }
        ),
        /* @__PURE__ */ u3(
          "div",
          {
            class: "pal-list",
            onMouseDown: (event) => {
              const element = event.target.closest(
                ".pal-row"
              );
              if (element) {
                props.pick(+element.dataset.i);
              }
            },
            children: props.rows.length ? props.rows.map((palRow, index) => /* @__PURE__ */ u3(
              "div",
              {
                class: `pal-row${index === props.sel ? " on" : ""}`,
                "data-i": index,
                children: [
                  /* @__PURE__ */ u3("b", { children: palRow.label }),
                  /* @__PURE__ */ u3("i", { children: palRow.sub })
                ]
              }
            )) : /* @__PURE__ */ u3("div", { class: "pal-none", children: "No matches" })
          }
        )
      ] })
    }
  );
  var HELP = [
    ["Jump to any pull request", "\u2318 K"],
    ["Next / previous comment", "j / k"],
    ["Next / previous unresolved thread", "] / ["],
    ["Reply to the selected comment", "r"],
    ["Write a comment (docked at the bottom)", "c"],
    ["New pull request", "n"],
    ["New tab / close tab / reopen closed", "\u2318T \xB7 \u2318W \xB7 \u2318\u21E7T"],
    ["Go to tab 1\u20139 / next tab", "\u23181\u20139 \xB7 \u2303Tab"],
    ["Open a PR in a new tab", "\u2318-click"],
    ["Turn Split view on / off", "s"],
    ["Swap the two sides of Split view", "f"],
    ["Diff: unified \u21C4 side-by-side", "d"],
    ["Show this help", "?"],
    ["Close dialogs and menus", "Esc"]
  ];
  var HelpDialog = ({ close }) => /* @__PURE__ */ u3("div", { class: "dlg-bg palette", onMouseDown: close, children: /* @__PURE__ */ u3("div", { class: "dlg pal", children: [
    /* @__PURE__ */ u3("h2", { children: "Keyboard shortcuts" }),
    HELP.map(([text, otherText]) => /* @__PURE__ */ u3("div", { class: "kb-r", children: [
      /* @__PURE__ */ u3("span", { children: text }),
      /* @__PURE__ */ u3("kbd", { children: otherText })
    ] }))
  ] }) });

  // src/components/Diff.tsx
  function Sug({ s: props, on: on3 }) {
    return props.kind === "note" ? /* @__PURE__ */ u3("div", { class: "sug-row", children: /* @__PURE__ */ u3("span", { class: "sug-note", children: props.text }) }) : /* @__PURE__ */ u3("div", { class: "sug-row", children: [
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small primary",
          "data-sug": props.id,
          disabled: props.disabled,
          onClick: on3 && ((event) => on3.sug(event, String(props.id))),
          children: "Apply suggestion"
        }
      ),
      /* @__PURE__ */ u3("span", { class: "sug-note", children: [
        "Commits to ",
        /* @__PURE__ */ u3("code", { children: props.ref }),
        props.mine ? "" : " (fork \u2014 needs push access)"
      ] })
    ] });
  }
  function Tc(props) {
    const { on: on3 } = props;
    const ref = useFlash(props.flash, props.kb);
    return /* @__PURE__ */ u3(
      "div",
      {
        ref,
        class: `tc${props.kb ? " kb" : ""}${flashClass(props.flash)}`,
        id: props.anchorId ? `c-${props.id}` : void 0,
        children: [
          /* @__PURE__ */ u3("a", { href: props.user?.html_url || "#", children: Av(props.user, 24) }),
          /* @__PURE__ */ u3("div", { style: "flex:1;min-width:0", children: [
            /* @__PURE__ */ u3("div", { children: [
              /* @__PURE__ */ u3("span", { class: "who", children: props.login }),
              SP,
              /* @__PURE__ */ u3("span", { children: When(props.at) }),
              props.withMenu ? /* @__PURE__ */ u3(
                "button",
                {
                  class: "cm-btn",
                  "data-cm": props.id,
                  "data-root": props.root,
                  title: "Comment actions",
                  onClick: on3 && ((event) => on3.menu(event, event.currentTarget)),
                  children: "\u22EF"
                }
              ) : ""
            ] }),
            /* @__PURE__ */ u3(
              "div",
              {
                class: "markdown-body",
                style: "margin-top:8px",
                dangerouslySetInnerHTML: { __html: props.bodyHtml }
              }
            ),
            props.sug ? /* @__PURE__ */ u3(Sug, { s: props.sug, on: on3 }) : "",
            /* @__PURE__ */ u3(ReactionsBar, { ...props.reactions, on: on3?.react })
          ] })
        ]
      }
    );
  }
  function ThreadRow(props) {
    const { on: on3 } = props;
    return /* @__PURE__ */ u3("tr", { class: "lc-row th-row", children: /* @__PURE__ */ u3("td", { colspan: props.cols, children: /* @__PURE__ */ u3("div", { class: `thread inl${props.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3("div", { class: "thread-head", children: [
        /* @__PURE__ */ u3(
          FoldBtn,
          {
            k: props.k,
            title: "Hide this thread",
            def: props.def,
            folded: props.folded,
            onFold: on3?.fold
          }
        ),
        /* @__PURE__ */ u3("span", { class: "th-t", children: [
          "Comment on line",
          " ",
          /* @__PURE__ */ u3("b", { children: [
            props.side,
            props.line
          ] })
        ] }),
        props.outdated ? /* @__PURE__ */ u3("span", { class: "res out", children: "Outdated" }) : "",
        props.resolved ? /* @__PURE__ */ u3("span", { class: "res", children: "Resolved" }) : ""
      ] }),
      props.cards.map((otherProps) => /* @__PURE__ */ u3(Tc, { ...otherProps, on: on3 })),
      props.reply ? /* @__PURE__ */ u3(ReplyBox, { ...props.reply, on: on3 }) : "",
      props.act ? /* @__PURE__ */ u3("div", { class: "th-foot", children: /* @__PURE__ */ u3(
        "button",
        {
          class: "thread-act",
          "data-thread": props.act.tid,
          "data-res": props.act.res ? "unresolve" : "resolve",
          onClick: on3 && ((event) => on3.thread(
            event,
            props.act.tid,
            props.act.res ? "unresolve" : "resolve"
          )),
          children: props.act.res ? "Unresolve conversation" : "Resolve conversation"
        }
      ) }) : ""
    ] }) }) });
  }
  function ReplyBox({
    rid,
    ph,
    err,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "reply", children: [
      /* @__PURE__ */ u3(
        DraftBox,
        {
          k: `reply-${rid}`,
          ph,
          rows: 2,
          submit: on3 && (() => on3.reply(String(rid)))
        }
      ),
      /* @__PURE__ */ u3(ErrLine, { m: err }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small",
          "data-sendreply": rid,
          onClick: on3 && (() => on3.reply(String(rid))),
          children: "Reply"
        }
      )
    ] });
  }
  var LcCards = ({
    cards,
    on: on3
  }) => /* @__PURE__ */ u3(S, { children: cards.map((item) => /* @__PURE__ */ u3("div", { class: "lc-card", children: [
    /* @__PURE__ */ u3("span", { class: "lc-tag", children: "Pending" }),
    /* @__PURE__ */ u3("div", { class: "lc-body", dangerouslySetInnerHTML: { __html: item.body } }),
    /* @__PURE__ */ u3(
      "button",
      {
        class: "lc-x",
        "data-lcdel": item.id,
        title: "Delete draft comment",
        onClick: on3 && (() => on3.del(String(item.id))),
        children: renderIcon("x")
      }
    )
  ] })) });
  var LcEdit = ({
    code,
    on: on3
  }) => /* @__PURE__ */ u3("div", { class: "lc-edit", children: [
    /* @__PURE__ */ u3(
      DraftBox,
      {
        k: "lc",
        ph: "Leave a comment on this line",
        rows: 3,
        submit: on3?.add
      }
    ),
    /* @__PURE__ */ u3("div", { class: "lc-btns", children: [
      code !== null ? /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small",
          id: "lcsuggest",
          "data-code": code,
          title: "Insert a suggested change for this line",
          onClick: on3?.suggest,
          children: "\xB1 Suggest change"
        }
      ) : "",
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3("button", { class: "btn small", id: "lccancel", onClick: on3?.cancel, children: "Cancel" }),
      /* @__PURE__ */ u3("button", { class: "btn small primary", id: "lcadd", onClick: on3?.add, children: "Add to review" })
    ] })
  ] });
  var Actor = ({ u: person }) => person ? /* @__PURE__ */ u3("a", { class: "actor", href: person.html_url, children: person.login }) : /* @__PURE__ */ u3("span", { class: "actor", children: "ghost" });
  function ReviewBlock(props) {
    const { on: on3 } = props;
    return /* @__PURE__ */ u3("div", { class: `TLI rev${props.folded ? " folded" : ""}`, children: [
      /* @__PURE__ */ u3("div", { class: `TLI-badge ${props.kind}`, children: renderIcon(props.ic) }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(props.user, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u3("div", { class: "row", children: [
          /* @__PURE__ */ u3(
            FoldBtn,
            {
              k: props.k,
              title: "Collapse / expand this review",
              def: props.allRes,
              folded: props.folded,
              onFold: on3?.fold
            }
          ),
          /* @__PURE__ */ u3(Actor, { u: props.user }),
          " ",
          /* @__PURE__ */ u3("span", { children: props.verb }),
          " ",
          /* @__PURE__ */ u3("a", { class: "time", href: props.url, children: props.at }),
          props.sum ? /* @__PURE__ */ u3("span", { class: `rev-sum${props.sum.ok ? " ok" : ""}`, children: props.sum.allRes ? /* @__PURE__ */ u3(S, { children: [
            renderIcon("check"),
            " All resolved"
          ] }) : props.sum.text }) : ""
        ] }),
        "\n  ",
        props.bodyHtml ? /* @__PURE__ */ u3(
          "div",
          {
            class: "cbox nocaret",
            style: "margin-top:8px;color:var(--fgColor-default)",
            children: /* @__PURE__ */ u3("div", { class: "cbody", children: /* @__PURE__ */ u3(
              "div",
              {
                class: "markdown-body",
                dangerouslySetInnerHTML: { __html: props.bodyHtml }
              }
            ) })
          }
        ) : "",
        props.threads.length ? /* @__PURE__ */ u3("div", { children: props.threads.map((rvThread) => /* @__PURE__ */ u3("div", { class: `thread${rvThread.folded ? " folded" : ""}`, children: [
          /* @__PURE__ */ u3("div", { class: "thread-head", children: [
            /* @__PURE__ */ u3(
              FoldBtn,
              {
                k: rvThread.k,
                title: "Hide this thread",
                def: rvThread.def,
                folded: rvThread.folded,
                onFold: on3?.fold
              }
            ),
            rvThread.path,
            rvThread.resolved ? /* @__PURE__ */ u3("span", { class: "res", children: "Resolved" }) : "",
            rvThread.tid ? /* @__PURE__ */ u3(
              "button",
              {
                class: "thread-act",
                "data-thread": rvThread.tid,
                "data-res": rvThread.resolved ? "unresolve" : "resolve",
                onClick: on3 && ((event) => on3.thread(
                  event,
                  rvThread.tid,
                  rvThread.resolved ? "unresolve" : "resolve"
                )),
                children: rvThread.resolved ? "Unresolve" : "Resolve conversation"
              }
            ) : ""
          ] }),
          /* @__PURE__ */ u3("div", { class: "diffhunk", children: /* @__PURE__ */ u3(DiffHunkTable, { rows: rvThread.hunk }) }),
          rvThread.cards.map((otherProps) => /* @__PURE__ */ u3(Tc, { ...otherProps, on: on3 })),
          /* @__PURE__ */ u3(ReplyBox, { ...rvThread.reply, on: on3 })
        ] })) }) : ""
      ] })
    ] });
  }

  // src/components/Timeline.tsx
  function CommitRow({
    first,
    sha,
    author,
    url,
    verification
  }) {
    const unv = verification && !verification.verified;
    return /* @__PURE__ */ u3("div", { class: "commit-row", children: [
      author ? /* @__PURE__ */ u3("span", { class: "TLI-avatar", style: "margin-right:8px", children: Av(author, 20) }) : "",
      /* @__PURE__ */ u3("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u3("a", { href: url || "#", children: first }) }),
      /* @__PURE__ */ u3("span", { class: "cm-ic", children: renderIcon("comment") }),
      /* @__PURE__ */ u3("span", { style: "flex:1" }),
      verification ? /* @__PURE__ */ u3("span", { class: `label-pill ${unv ? "warn" : "ok"}`, children: unv ? "Unverified" : "Verified" }) : "",
      /* @__PURE__ */ u3("a", { class: "sha", href: url || "#", children: String(sha).slice(0, 7) })
    ] });
  }
  function RangeBar({
    range,
    from,
    to,
    desc,
    on: on3
  }) {
    const opts = [
      ["all", "Any time"],
      ["1h", "Last hour"],
      ["24h", "Last 24 hours"],
      ["7d", "Last 7 days"],
      ["30d", "Last 30 days"],
      ["custom", "Custom range\u2026"]
    ];
    return /* @__PURE__ */ u3("div", { class: "date-bar", children: [
      /* @__PURE__ */ u3("span", { class: "who-l", children: [
        renderIcon("clock"),
        "When"
      ] }),
      /* @__PURE__ */ u3(
        "select",
        {
          class: "sel",
          id: "crange",
          title: "Only show activity from this period",
          onChange: on3?.range,
          children: opts.map(([otherValue, line]) => /* @__PURE__ */ u3("option", { value: otherValue, selected: range === otherValue, children: line }))
        }
      ),
      range === "custom" ? /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3(
          "input",
          {
            type: "date",
            class: "input",
            id: "cfrom",
            value: from,
            title: "From",
            onChange: on3?.from
          }
        ),
        /* @__PURE__ */ u3("span", { class: "who-l", children: "to" }),
        /* @__PURE__ */ u3(
          "input",
          {
            type: "date",
            class: "input",
            id: "cto",
            value: to,
            title: "To",
            onChange: on3?.to
          }
        )
      ] }) : "",
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "who-chip",
          id: "csort",
          title: "Flip the order of the timeline",
          onClick: on3?.sort,
          children: [
            renderIcon(desc ? "chevron-down" : "chevron-up"),
            /* @__PURE__ */ u3("span", { children: desc ? "Newest first" : "Oldest first" })
          ]
        }
      )
    ] });
  }
  function WhoBar({
    everyone,
    people,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "who-bar", children: [
      /* @__PURE__ */ u3("span", { class: "who-l", children: [
        renderIcon("person"),
        "Show"
      ] }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: `who-chip ${everyone ? "on" : ""}`,
          "data-whoclear": "1",
          onClick: on3?.whoClear,
          children: "Everyone"
        }
      ),
      people.map(({ u: person, n: count, on: sel }) => /* @__PURE__ */ u3(
        "button",
        {
          class: `who-chip ${sel ? "on" : ""}`,
          "data-who": person.login,
          onClick: on3 && (() => on3.who(person.login)),
          title: `${count} comment${count === 1 ? "" : "s"}`,
          children: [
            Av(person, 18),
            /* @__PURE__ */ u3("span", { children: person.login }),
            /* @__PURE__ */ u3("i", { children: count })
          ]
        }
      ))
    ] });
  }
  function Bars({
    who,
    range,
    on: on3
  }) {
    return /* @__PURE__ */ u3(S, { children: [
      who && /* @__PURE__ */ u3(WhoBar, { ...who, on: on3 }),
      /* @__PURE__ */ u3(RangeBar, { ...range, on: on3 })
    ] });
  }
  function FoldBar({
    folded: folded2,
    onClick
  }) {
    return /* @__PURE__ */ u3("div", { class: "fold-bar", children: /* @__PURE__ */ u3(
      "button",
      {
        class: "btn small",
        id: "foldallconv",
        title: "Collapse or expand every comment, review and thread",
        onClick,
        children: [
          renderIcon("chevron-down"),
          SP,
          /* @__PURE__ */ u3("span", { children: folded2 ? "Expand all conversations" : "Collapse all conversations" })
        ]
      }
    ) });
  }
  var Time = ({ at: at2 }) => /* @__PURE__ */ u3("a", { class: "time", children: whenParts(at2).text });
  var actor = (person) => person ? /* @__PURE__ */ u3("a", { class: "actor", href: person.html_url, children: person.login }) : /* @__PURE__ */ u3("span", { class: "actor", children: "ghost" });
  function CommitRun({
    n: count,
    first,
    last,
    onTab
  }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: renderIcon("git-commit") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: /* @__PURE__ */ u3(
        "a",
        {
          "data-tab": "commits",
          class: "run",
          onClick: onTab && (() => onTab("commits")),
          children: [
            /* @__PURE__ */ u3("b", { children: [
              count,
              " commits"
            ] }),
            SP,
            /* @__PURE__ */ u3("span", { class: "mono", children: [
              first,
              " \u2026 ",
              last
            ] }),
            " ",
            "\xB7 view in Commits"
          ]
        }
      ) }) })
    ] });
  }
  function Committed({ row: row2 }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: renderIcon("git-commit") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: row2 })
    ] });
  }
  var Linked = ({ msg, url }) => {
    const match = msg.match(/^([\s\S]*?)#(\d+)([\s\S]*)$/);
    return match ? /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("a", { href: url, children: match[1] }),
      /* @__PURE__ */ u3("a", { href: "#", style: "color:var(--fgColor-accent)", children: [
        "#",
        match[2]
      ] }),
      /* @__PURE__ */ u3("a", { href: "#", children: match[3] })
    ] }) : /* @__PURE__ */ u3("a", { href: url, children: msg });
  };
  function Referenced({
    actor: person,
    at: at2,
    commit: ci,
    msg
  }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: renderIcon("cross-reference") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body stack", children: [
        /* @__PURE__ */ u3("div", { class: "row", style: "min-height:32px", children: [
          actor(person),
          SP,
          /* @__PURE__ */ u3("span", { children: "added a commit that referenced this pull request" }),
          SP,
          /* @__PURE__ */ u3(Time, { at: at2 })
        ] }),
        ci ? /* @__PURE__ */ u3("div", { class: "line2", children: /* @__PURE__ */ u3("div", { class: "commit-row", children: [
          /* @__PURE__ */ u3("span", { class: "TLI-avatar", style: "margin:0 8px 0 0", children: Av(ci.author || person, 20) }),
          /* @__PURE__ */ u3("span", { class: "msg", style: "flex:0 1 auto", children: /* @__PURE__ */ u3(Linked, { msg, url: ci.html_url }) }),
          /* @__PURE__ */ u3(
            "span",
            {
              class: "mono",
              style: "background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px",
              children: "\u2026"
            }
          ),
          /* @__PURE__ */ u3("span", { class: "cm-ic", children: renderIcon("comment") }),
          /* @__PURE__ */ u3("span", { style: "flex:1" }),
          /* @__PURE__ */ u3("a", { class: "sha", href: ci.html_url, children: ci.sha.slice(0, 7) })
        ] }) }) : ""
      ] })
    ] });
  }
  function MergedRow({
    actor: person,
    commit,
    base,
    at: at2
  }) {
    return /* @__PURE__ */ u3("div", { class: "TLI mergedrow", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge done", children: renderIcon("git-merge") }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(person, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: [
        actor(person),
        SP,
        /* @__PURE__ */ u3("span", { children: [
          "merged commit",
          " ",
          /* @__PURE__ */ u3("b", { class: "mono", style: "color:var(--fgColor-default);font-size:12px", children: commit }),
          " ",
          "into ",
          /* @__PURE__ */ u3("span", { class: "branch", children: base })
        ] }),
        SP,
        /* @__PURE__ */ u3(Time, { at: at2 })
      ] }) })
    ] });
  }
  function CrossRef(props) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: renderIcon("cross-reference") }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        /* @__PURE__ */ u3("div", { class: "row", children: [
          actor(props.actor),
          SP,
          /* @__PURE__ */ u3("span", { children: [
            "mentioned this ",
            props.isPr ? "pull request" : "issue"
          ] }),
          SP,
          /* @__PURE__ */ u3(Time, { at: props.at })
        ] }),
        "\n        ",
        /* @__PURE__ */ u3("div", { class: "ref-card", children: [
          /* @__PURE__ */ u3(
            "span",
            {
              style: `color:var(--fgColor-${props.open ? "success" : "done"});margin-top:2px`,
              children: renderIcon(props.icon)
            }
          ),
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3("a", { class: "t", href: props.url, style: "color:var(--fgColor-default)", children: props.title }),
            /* @__PURE__ */ u3("span", { class: "r", children: [
              props.repo,
              "#",
              props.number
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  function LabelRow({
    actor: person,
    verb,
    color,
    name,
    at: at2
  }) {
    return /* @__PURE__ */ u3("div", { class: "TLI condensed", children: [
      /* @__PURE__ */ u3("div", { class: "TLI-badge", children: renderIcon("tag") }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(person, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: [
        actor(person),
        SP,
        /* @__PURE__ */ u3("span", { children: verb }),
        SP,
        /* @__PURE__ */ u3(
          "span",
          {
            class: "pill-label",
            style: `background:#${color};color:#fff;margin:0`,
            children: name
          }
        ),
        SP,
        /* @__PURE__ */ u3("span", { children: "label" }),
        SP,
        /* @__PURE__ */ u3(Time, { at: at2 })
      ] })
    ] });
  }
  function Simple({ actor: person, ic, text, kind, at: at2 }) {
    return /* @__PURE__ */ u3("div", { class: "TLI", children: [
      /* @__PURE__ */ u3("div", { class: `TLI-badge ${kind}`, children: renderIcon(ic) }),
      /* @__PURE__ */ u3("div", { class: "TLI-avatar", children: Av(person, 20) }),
      /* @__PURE__ */ u3("div", { class: "TLI-body", children: /* @__PURE__ */ u3("div", { class: "row", children: [
        actor(person),
        SP,
        /* @__PURE__ */ u3("span", { children: text }),
        SP,
        /* @__PURE__ */ u3(Time, { at: at2 })
      ] }) })
    ] });
  }
  function Checks({ head: head2, summary, headIcon, rows }) {
    return /* @__PURE__ */ u3("div", { class: "checks", children: [
      /* @__PURE__ */ u3("div", { class: `ck-head ${head2[0]}`, children: [
        renderIcon(headIcon, 20),
        /* @__PURE__ */ u3("div", { children: [
          /* @__PURE__ */ u3("b", { children: head2[1] }),
          /* @__PURE__ */ u3("span", { children: summary })
        ] })
      ] }),
      rows.map((value) => /* @__PURE__ */ u3(
        "a",
        {
          class: `ck-row ${value.st}`,
          href: value.url ? value.url : void 0,
          children: [
            /* @__PURE__ */ u3("span", { class: "ck-i", children: renderIcon(value.icon) }),
            /* @__PURE__ */ u3("span", { class: "ck-n", children: [
              /* @__PURE__ */ u3("b", { children: value.name }),
              value.req ? /* @__PURE__ */ u3("span", { class: "ck-req", title: "Required by branch protection", children: "Required" }) : "",
              /* @__PURE__ */ u3("i", { children: value.desc })
            ] }),
            /* @__PURE__ */ u3("span", { class: "ck-s", children: value.status }),
            /* @__PURE__ */ u3("span", { class: "ck-d", children: value.dur })
          ]
        }
      ))
    ] });
  }
  function Attention({
    items,
    unres,
    showUnres,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "attn", children: [
      items.map((it) => /* @__PURE__ */ u3(
        "button",
        {
          class: `att-i ${it.k}`,
          id: it.id,
          title: it.title,
          "data-tab": it.dataTab,
          onClick: on3 && (it.id === "nextun" ? on3.next : it.dataTab ? () => on3.tab(it.dataTab) : void 0),
          children: [
            renderIcon(it.ic),
            /* @__PURE__ */ u3("span", { children: it.text })
          ]
        }
      )),
      showUnres ? /* @__PURE__ */ u3(S, { children: [
        /* @__PURE__ */ u3("span", { class: "sp" }),
        /* @__PURE__ */ u3(
          "button",
          {
            class: `att-tog ${unres ? "on" : ""}`,
            id: "unres",
            title: "Hide everything except review threads that are still open",
            onClick: on3?.unres,
            children: [
              renderIcon("comment"),
              "Unresolved only"
            ]
          }
        )
      ] }) : ""
    ] });
  }

  // src/app/fold.ts
  function foldToggle(event, key2, def) {
    event.stopPropagation();
    if (event.target.closest("a")) {
      return;
    }
    const now = !isFolded(key2, def);
    appState.fold[key2] = now;
    localStorage.setItem("fold", JSON.stringify(appState.fold));
    rerender();
    if (!now) {
      reveal(key2);
    }
  }

  // src/app/timeline.tsx
  function rangeBounds() {
    const value = 36e5;
    const now = Date.now();
    const text = appState.range;
    if (text === "1h") {
      return [now - value, Infinity];
    }
    if (text === "24h") {
      return [now - 24 * value, Infinity];
    }
    if (text === "7d") {
      return [now - 7 * 24 * value, Infinity];
    }
    if (text === "30d") {
      return [now - 30 * 24 * value, Infinity];
    }
    if (text === "custom") {
      const lo = appState.rFrom ? (/* @__PURE__ */ new Date(`${appState.rFrom}T00:00:00`)).getTime() : -Infinity;
      const hi = appState.rTo ? (/* @__PURE__ */ new Date(`${appState.rTo}T23:59:59.999`)).getTime() : Infinity;
      return [lo, hi];
    }
    return [-Infinity, Infinity];
  }
  function timelineModel(bundle) {
    const pull = bundle.pull;
    const out = [];
    const evUser = (timelineEvent) => {
      const value = timelineEvent.user || timelineEvent.actor || timelineEvent.author;
      return value?.login || value?.name || "";
    };
    const people = /* @__PURE__ */ new Map();
    const bump = (person) => {
      if (!person?.login) {
        return;
      }
      const row2 = people.get(person.login) || { u: person, n: 0 };
      row2.n++;
      people.set(person.login, row2);
    };
    bump(pull.user);
    bundle.timeline.forEach((timelineEvent) => {
      if (timelineEvent.event === "commented" || timelineEvent.event === "reviewed") {
        bump(timelineEvent.user);
      }
    });
    bundle.review_comments.forEach((reviewComment) => bump(reviewComment.user));
    appState.who = appState.who.filter((word) => people.has(word));
    const { who } = appState;
    const on3 = who.length > 0;
    const byUser = on3 ? bundle.timeline.filter(
      (timelineEvent) => who.includes(evUser(timelineEvent)) || timelineEvent.event === "reviewed" && bundle.review_comments.some(
        (reviewComment) => reviewComment.pull_request_review_id === timelineEvent.id && who.includes(reviewComment.user?.login)
      )
    ) : bundle.timeline;
    const byKind = appState.unres ? byUser.filter((timelineEvent) => timelineEvent.event === "reviewed") : byUser;
    const evTime = (timelineEvent) => timelineEvent.created_at || timelineEvent.submitted_at || timelineEvent.committer?.date || timelineEvent.author?.date || "";
    const [rLo, rHi] = rangeBounds();
    const rangeOn = appState.range !== "all";
    const inRange = (text) => {
      const left = text ? Date.parse(text) : NaN;
      return isNaN(left) || left >= rLo && left <= rHi;
    };
    const keep5 = !rangeOn ? byKind : byKind.filter(
      (timelineEvent) => inRange(evTime(timelineEvent)) || timelineEvent.event === "reviewed" && bundle.review_comments.some(
        (reviewComment) => reviewComment.pull_request_review_id === timelineEvent.id && inRange(reviewComment.created_at)
      ) || timelineEvent.event === "reviewed" && bundle.review_comments.some(
        (reviewComment) => inRange(reviewComment.created_at) && bundle.review_comments.some(
          (otherReviewComment) => otherReviewComment.id === reviewComment.in_reply_to_id && otherReviewComment.pull_request_review_id === timelineEvent.id
        )
      )
    );
    if (!appState.unres && (!on3 || who.includes(pull.user.login))) {
      out.push({
        t: "comment",
        p: commentBoxProps(
          {
            ...pull,
            created_at: pull.created_at,
            html_url: pull.html_url,
            reactions: pull.reactions
          },
          { isPr: true, flush: true }
        )
      });
    }
    const evs = [];
    for (let index = 0; index < keep5.length; ) {
      let otherIndex = index;
      while (otherIndex < keep5.length && keep5[otherIndex].event === "committed") {
        otherIndex++;
      }
      if (otherIndex - index >= 6) {
        evs.push({
          event: "commit-run",
          n: otherIndex - index,
          first: keep5[index],
          last: keep5[otherIndex - 1]
        });
        index = otherIndex;
      } else {
        evs.push(keep5[index]);
        index++;
      }
    }
    if (appState.sort === "desc") {
      evs.reverse();
    }
    const info = bundle.commit_info || {};
    const simpleRow = (timelineEvent, ic, text, kind = "") => out.push({
      t: "simple",
      p: {
        actor: timelineEvent.actor,
        ic,
        text,
        kind,
        at: timelineEvent.created_at
      }
    });
    for (const timelineEvent of evs) {
      switch (timelineEvent.event) {
        case "commented":
          out.push({
            t: "comment",
            p: commentBoxProps(timelineEvent)
          });
          break;
        case "commit-run":
          out.push({
            t: "run",
            n: timelineEvent.n,
            first: timelineEvent.first.sha.slice(0, 7),
            last: timelineEvent.last.sha.slice(0, 7)
          });
          break;
        case "reviewed": {
          const rp = reviewBlockProps(timelineEvent, bundle);
          if (rp) {
            out.push({ t: "review", p: rp });
          }
          break;
        }
        case "committed":
          out.push({
            t: "committed",
            row: {
              first: String(timelineEvent.message || "").split("\n")[0],
              sha: timelineEvent.sha,
              author: info[timelineEvent.sha]?.author || (timelineEvent.author?.avatar_url ? timelineEvent.author : null),
              url: timelineEvent.html_url,
              verification: timelineEvent.verification
            }
          });
          break;
        case "referenced": {
          const ci = info[timelineEvent.commit_id];
          const ml = ci ? ci.message.split("\n")[0] : "";
          out.push({
            t: "referenced",
            p: {
              actor: timelineEvent.actor,
              at: timelineEvent.created_at,
              commit: ci ? { author: ci.author, html_url: ci.html_url, sha: ci.sha } : null,
              msg: ml
            }
          });
          break;
        }
        case "merged":
          out.push(
            {
              t: "merged",
              actor: timelineEvent.actor,
              commit: (timelineEvent.commit_id || "").slice(0, 7),
              base: pull.base.label ?? "",
              at: timelineEvent.created_at
            },
            { t: "brk" }
          );
          break;
        case "closed":
          if (!pull.merged) {
            simpleRow(
              timelineEvent,
              "git-pull-request-closed",
              "closed this",
              "danger"
            );
          }
          break;
        case "reopened":
          simpleRow(
            timelineEvent,
            "git-pull-request",
            "reopened this",
            "success"
          );
          break;
        case "cross-referenced": {
          const item = timelineEvent.source?.issue;
          if (!item) {
            break;
          }
          const isPr = !!item.pull_request;
          out.push({
            t: "cross",
            p: {
              actor: timelineEvent.actor,
              at: timelineEvent.created_at,
              isPr,
              open: item.state === "open",
              icon: isPr ? item.state === "open" ? "git-pull-request" : "git-merge" : "issue-opened",
              url: item.html_url,
              title: item.title.split("\n")[0].slice(0, 120),
              repo: item.repository?.full_name || "",
              number: item.number
            }
          });
          break;
        }
        case "labeled":
        case "unlabeled":
          out.push({
            t: "label",
            actor: timelineEvent.actor,
            verb: timelineEvent.event === "labeled" ? "added" : "removed",
            color: timelineEvent.label?.color ?? "",
            name: timelineEvent.label?.name ?? "",
            at: timelineEvent.created_at
          });
          break;
        case "assigned":
        case "unassigned":
          simpleRow(
            timelineEvent,
            "person",
            `${timelineEvent.event} ${timelineEvent.assignee ? timelineEvent.assignee.login : ""}`
          );
          break;
        case "review_requested":
          simpleRow(
            timelineEvent,
            "eye",
            `requested a review from ${timelineEvent.requested_reviewer?.login || timelineEvent.requested_team?.name || ""}`
          );
          break;
        case "renamed":
          simpleRow(
            timelineEvent,
            "pencil",
            /* @__PURE__ */ u3(S, { children: [
              "changed the title ",
              /* @__PURE__ */ u3("s", { children: timelineEvent.rename?.from }),
              " ",
              timelineEvent.rename?.to
            ] })
          );
          break;
        case "head_ref_force_pushed":
          simpleRow(timelineEvent, "repo-push", "force-pushed the head branch");
          break;
        case "head_ref_deleted":
          simpleRow(timelineEvent, "git-branch", "deleted the head branch");
          break;
        case "ready_for_review":
          simpleRow(
            timelineEvent,
            "eye",
            "marked this pull request as ready for review"
          );
          break;
        case "convert_to_draft":
          simpleRow(
            timelineEvent,
            "git-pull-request-draft",
            "marked this pull request as draft"
          );
          break;
        case "milestoned":
          simpleRow(
            timelineEvent,
            "milestone",
            `added this to the ${timelineEvent.milestone?.title ?? ""} milestone`
          );
          break;
        case "locked":
          simpleRow(timelineEvent, "lock", "locked this conversation");
          break;
        default:
          break;
      }
    }
    return {
      who: people.size > 1 ? {
        everyone: !on3,
        people: [...people.values()].sort((leftItem, rightItem) => rightItem.n - leftItem.n).map(({ u: person, n: count }) => ({
          u: person,
          n: count,
          on: who.includes(person.login)
        }))
      } : null,
      range: {
        range: appState.range,
        from: appState.rFrom,
        to: appState.rTo,
        desc: appState.sort === "desc"
      },
      rows: out,
      empty: !evs.length && (on3 || rangeOn) ? rangeOn ? "No activity in this period." : "Nothing from the selected accounts." : "",
      merge: on3 ? null : mergeModel(bundle),
      act: mergeActProps(bundle),
      composer: composerProps(bundle)
    };
  }
  var checkState = (check) => check.status !== "completed" ? "pending" : check.conclusion === "success" ? "pass" : ["skipped", "neutral"].includes(check.conclusion) ? "skip" : "fail";
  var CK = {
    pass: ["check-circle-fill", "Passed"],
    fail: ["x-circle-fill", "Failed"],
    pending: ["dot-fill", "In progress"],
    skip: ["circle-slash", "Skipped"]
  };
  function checksView(bundle) {
    const list = (bundle.checks || []).map((check) => ({
      ...check,
      st: checkState(check)
    }));
    if (!list.length) {
      return /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No checks reported for the latest commit." });
    }
    const handler = (text) => list.filter((item) => item.st === text).length;
    const rank = {
      fail: 0,
      pending: 1,
      pass: 2,
      skip: 3
    };
    list.sort(
      (leftItem, rightItem) => rank[leftItem.st] - rank[rightItem.st] || String(leftItem.name).localeCompare(String(rightItem.name))
    );
    const head2 = handler("fail") ? ["fail", `${handler("fail")} failing`] : handler("pending") ? ["pending", `${handler("pending")} in progress`] : ["pass", "All checks passed"];
    const dur = (check) => {
      const size = Date.parse(check.started_at);
      const value = Date.parse(check.completed_at);
      if (!size || !value || value < size) {
        return "";
      }
      const time = Math.round((value - size) / 1e3);
      return time >= 60 ? `${Math.floor(time / 60)}m ${time % 60}s` : `${time}s`;
    };
    const rows = list.map((item) => ({
      name: item.name,
      st: item.st,
      url: item.url,
      desc: item.description || (item.app ? item.app : ""),
      req: (appState.bundle?.required_checks || []).includes(item.name),
      status: item.st === "fail" && item.conclusion && item.conclusion !== "failure" ? item.conclusion.replace(/_/g, " ") : CK[item.st][1],
      dur: dur(item),
      icon: CK[item.st][0]
    }));
    return /* @__PURE__ */ u3(
      Checks,
      {
        head: [head2[0], head2[1]],
        headIcon: CK[head2[0]][0],
        summary: [
          handler("fail") && `${handler("fail")} failing`,
          handler("pending") && `${handler("pending")} in progress`,
          handler("pass") && `${handler("pass")} passed`,
          handler("skip") && `${handler("skip")} skipped`
        ].filter(Boolean).join(" \xB7 "),
        rows
      }
    );
  }
  function unresolvedRoots(bundle) {
    const res = new Set(bundle.resolved_ids || []);
    return bundle.review_comments.filter(
      (reviewComment) => !reviewComment.in_reply_to_id && !res.has(reviewComment.id)
    );
  }
  function attentionProps(bundle) {
    const pull = bundle.pull;
    const rc = bundle.review_comments;
    const roots = rc.filter((reviewComment) => !reviewComment.in_reply_to_id);
    const open2 = unresolvedRoots(bundle);
    const known = appState.hasToken || (bundle.resolved_ids || []).length > 0;
    const latest = /* @__PURE__ */ new Map();
    bundle.timeline.filter(
      (timelineEvent) => timelineEvent.event === "reviewed" && timelineEvent.user
    ).forEach((timelineEvent) => {
      const st = timelineEvent.state.toLowerCase();
      if (st === "commented" && latest.has(timelineEvent.user.login)) {
        return;
      }
      latest.set(timelineEvent.user.login, st);
    });
    const cr = [...latest.values()].filter(
      (value) => value === "changes_requested"
    ).length;
    const ap = [...latest.values()].filter((value) => value === "approved").length;
    const ck = (bundle.checks || []).map(checkState);
    const fail = ck.filter((status) => status === "fail").length;
    const pend = ck.filter((status) => status === "pending").length;
    const pass = ck.filter((status) => status === "pass").length;
    const it = [];
    const add = (key2, ic, text, attr = {}) => it.push({ k: key2, ic, text, ...attr });
    if (roots.length) {
      if (!known) {
        add(
          "",
          "comment",
          `${roots.length} review thread${roots.length === 1 ? "" : "s"}`
        );
      } else if (open2.length) {
        add(
          "bad",
          "comment",
          `${open2.length} unresolved thread${open2.length === 1 ? "" : "s"}`,
          { id: "nextun", title: "Jump to the next unresolved thread" }
        );
      } else {
        add("ok", "check-circle-fill", "All threads resolved");
      }
    }
    add(
      cr ? "bad" : ap ? "ok" : "",
      cr ? "file-diff" : ap ? "check" : "eye",
      cr ? `${cr} requesting changes` : ap ? `${ap} approved` : "No approvals yet"
    );
    if (ck.length) {
      add(
        fail ? "bad" : pend ? "warn" : "ok",
        fail ? "x-circle-fill" : pend ? "dot-fill" : "check-circle-fill",
        fail ? `${fail} check${fail === 1 ? "" : "s"} failing` : pend ? `${pend} check${pend === 1 ? "" : "s"} running` : `${pass} check${pass === 1 ? "" : "s"} passed`,
        { dataTab: "checks", title: "Open checks" }
      );
    }
    if (pull.merged) {
      add("done", "git-merge", "Merged");
    } else if (pull.state === "closed") {
      add("bad", "git-pull-request-closed", "Closed");
    } else if (pull.mergeable === false || pull.mergeable_state === "dirty") {
      add("bad", "alert", "Has conflicts");
    } else if (pull.mergeable_state === "clean") {
      add("ok", "git-merge", "Ready to merge");
    } else if (pull.draft) {
      add("", "git-pull-request-draft", "Draft");
    }
    return { items: it, unres: appState.unres, showUnres: roots.length > 0 };
  }
  function jumpUnresolved() {
    const bundle = appState.bundle;
    const list = unresolvedRoots(bundle);
    if (!list.length) {
      return;
    }
    const reviewComment = list[appState.unIdx % list.length];
    appState.unIdx++;
    const first = bundle.review_comments.find(
      (otherReviewComment) => otherReviewComment.pull_request_review_id === reviewComment.pull_request_review_id && otherReviewComment.path === reviewComment.path && (otherReviewComment.original_position ?? otherReviewComment.position) === (reviewComment.original_position ?? reviewComment.position)
    ) || reviewComment;
    appState.fold[`r:${reviewComment.pull_request_review_id}`] = false;
    appState.fold[`t:${first.id}`] = false;
    appState.fold[`c:${reviewComment.id}`] = false;
    localStorage.setItem("fold", JSON.stringify(appState.fold));
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
    setFlash(`c-${reviewComment.id}`, { block: "center", smooth: true });
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  }
  var foldKeys = (tlModel) => tlModel.rows.flatMap(
    (tlRow) => tlRow.t === "comment" ? [{ k: `c:${tlRow.p.c.id}`, def: false }] : tlRow.t === "review" ? [
      { k: tlRow.p.k, def: tlRow.p.allRes },
      ...tlRow.p.threads.map((rvThread) => ({
        k: rvThread.k,
        def: rvThread.def
      }))
    ] : []
  );
  function Row({ r: tlRow, on: on3 }) {
    switch (tlRow.t) {
      case "referenced":
        return /* @__PURE__ */ u3(Referenced, { ...tlRow.p });
      case "comment":
        return /* @__PURE__ */ u3(CommentBox, { ...tlRow.p, on: on3?.conv });
      case "review":
        return /* @__PURE__ */ u3(ReviewBlock, { ...tlRow.p, on: on3?.conv });
      case "run":
        return /* @__PURE__ */ u3(
          CommitRun,
          {
            n: tlRow.n,
            first: tlRow.first,
            last: tlRow.last,
            onTab: on3?.tab
          }
        );
      case "committed":
        return /* @__PURE__ */ u3(Committed, { row: /* @__PURE__ */ u3(CommitRow, { ...tlRow.row }) });
      case "merged":
        return /* @__PURE__ */ u3(
          MergedRow,
          {
            actor: tlRow.actor,
            commit: tlRow.commit,
            base: tlRow.base,
            at: tlRow.at
          }
        );
      case "brk":
        return /* @__PURE__ */ u3("div", { class: "TLI-break" });
      case "cross":
        return /* @__PURE__ */ u3(CrossRef, { ...tlRow.p });
      case "label":
        return /* @__PURE__ */ u3(
          LabelRow,
          {
            actor: tlRow.actor,
            verb: tlRow.verb,
            color: tlRow.color,
            name: tlRow.name,
            at: tlRow.at
          }
        );
      case "simple":
        return /* @__PURE__ */ u3(Simple, { ...tlRow.p });
      default:
        return null;
    }
  }
  function Timeline({ m: tlModel, on: on3 }) {
    const box = tlModel.merge && (tlModel.merge.kind === "merged" ? /* @__PURE__ */ u3(MergedBox, { head: tlModel.merge.head }) : tlModel.merge.kind === "closed" ? /* @__PURE__ */ u3(ClosedBox, { head: tlModel.merge.head }) : /* @__PURE__ */ u3(MergeBox, { ...tlModel.merge.p, on: on3?.merge }));
    const keys = foldKeys(tlModel);
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(Bars, { who: tlModel.who, range: tlModel.range, on: on3?.bars }),
      /* @__PURE__ */ u3(
        FoldBar,
        {
          folded: keys.length > 0 && keys.every((foldKey) => isFolded(foldKey.k, foldKey.def)),
          onClick: () => on3?.foldAll(keys)
        }
      ),
      /* @__PURE__ */ u3("div", { class: "TL", children: [
        tlModel.rows.map((tlRow) => /* @__PURE__ */ u3(Row, { r: tlRow, on: on3 })),
        tlModel.empty ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: tlModel.empty }) : ""
      ] }),
      box,
      tlModel.act ? /* @__PURE__ */ u3(MergeAct, { ...tlModel.act, on: on3?.act }) : "",
      /* @__PURE__ */ u3(Composer, { ...tlModel.composer, on: on3?.composer })
    ] });
  }

  // src/app/handlers.ts
  var convOn = {
    fold: (event, key2, def) => foldToggle(event, key2, def),
    menu: (event, element) => cmMenu(event, element),
    react: {
      toggle: (event, kind, id, color) => reactToggle(event, kind, id, color),
      add: (event, element) => reactAdd(event, element),
      hover: (kind, id) => {
        getMine(kind, id);
      }
    },
    thread: (event, node, how) => {
      threadAct(event, node, how);
    },
    sug: (event, id) => applySuggestion(event, id),
    reply: (id) => {
      sendReply(id);
    }
  };
  var diffOn = {
    conv: convOn,
    plus: (event) => lcOpen(event),
    lc: {
      del: (id) => lcDel(id),
      cancel: () => lcCancel(),
      suggest: (event) => lcSuggest(event),
      add: () => lcAdd()
    }
  };
  var keep = (fn) => {
    appState.keepScroll = true;
    fn();
    render();
    appState.keepScroll = false;
  };
  function openTab(key2) {
    appState.tab = key2;
    render();
    scrollMain(0);
  }
  var filesOn = {
    commits: () => openCommits(),
    all: () => setFr(null),
    step: (count) => {
      const cs = commitList(appState.bundle);
      const index = (appState.fr?.a ?? 0) + count;
      if (cs[index]) {
        setFr({ a: index, b: index });
      }
    },
    mode: (message) => setDiffMode(message),
    sort: (event) => {
      appState.fileSort = event.target.value;
      rerender();
    },
    finish: () => reviewDialog(),
    foldAll: (allFolded, names) => {
      names.forEach((name) => {
        appState.fold[`f:${name}`] = !allFolded;
      });
      localStorage.setItem("fold", JSON.stringify(appState.fold));
      rerender();
    },
    fold: (event, key2, def) => foldToggle(event, key2, def)
  };
  var attOn = {
    next: () => jumpUnresolved(),
    unres: () => keep(() => {
      appState.unres = !appState.unres;
    }),
    tab: openTab
  };
  var tlOn = {
    conv: convOn,
    bars: {
      who: (word) => keep(() => {
        appState.who = appState.who.includes(word) ? appState.who.filter((text) => text !== word) : [...appState.who, word];
      }),
      whoClear: () => keep(() => {
        appState.who = [];
      }),
      range: (event) => keep(() => {
        appState.range = event.target.value;
        if (appState.range === "custom" && !appState.rFrom && !appState.rTo) {
          const handler = (time) => new Date(time - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
          appState.rTo = handler(Date.now());
          appState.rFrom = handler(Date.now() - 7 * 864e5);
        }
      }),
      from: (event) => keep(() => {
        appState.rFrom = event.target.value;
      }),
      to: (event) => keep(() => {
        appState.rTo = event.target.value;
      }),
      sort: () => keep(() => {
        appState.sort = appState.sort === "desc" ? "asc" : "desc";
        localStorage.setItem("csort", appState.sort);
      })
    },
    foldAll: foldAllConv,
    tab: openTab,
    merge: {
      toggle: (event, key2) => toggleMb(event, key2),
      rerun: (event) => {
        rerunChecks(event);
      },
      update: () => {
        updateBranch();
      },
      ready: () => {
        markReady();
      }
    },
    act: {
      close: () => toggleClosed(),
      merge: () => doMerge(),
      noauto: () => {
        disableAuto();
      },
      auto: () => {
        enableAuto();
      },
      draft: () => toDraft(),
      method: (event) => {
        appState.method = event.currentTarget.value;
        rerender();
      }
    },
    composer: {
      toggle: () => toggleComposer(),
      key: (event) => cbarKey(event),
      send: () => {
        sendComment();
      },
      close: () => toggleClosed(),
      measure: (meta) => {
        appState.composerBox = meta;
      }
    }
  };

  // src/components/ToTop.tsx
  var ToTop = ({
    dir,
    onClick
  }) => /* @__PURE__ */ u3(
    "button",
    {
      id: "totop",
      title: dir === "down" ? "Scroll to bottom" : "Back to top",
      "aria-label": dir === "down" ? "Scroll to bottom" : "Back to top",
      hidden: !dir,
      onClick,
      children: renderIcon(dir === "down" ? "chevron-down" : "chevron-up")
    }
  );

  // src/app/inboxtools.ts
  var put = (key2, value) => {
    try {
      localStorage.setItem(key2, JSON.stringify(value));
    } catch {
    }
  };
  var ibPins = () => appState.ibPins ||= load("ibpins", []);
  var ibSnz = () => appState.ibSnz ||= load(
    "ibsnooze",
    {}
  );
  var ibViews = () => appState.ibViews ||= load("ibviews", []);
  var isSnoozed = (ref, updated) => {
    const entry = ibSnz()[ref];
    return !!entry && (entry.until > 0 ? Date.now() < entry.until : updated <= entry.at);
  };
  var snoozeLabel = (ref) => {
    const entry = ibSnz()[ref];
    return !entry ? "" : entry.until > 0 ? `Until ${new Date(entry.until).toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit"
    })}` : "Until new activity";
  };
  function ibPin(ref) {
    const paths = ibPins();
    appState.ibPins = paths.includes(ref) ? paths.filter((text) => text !== ref) : [...paths, ref];
    put("ibpins", appState.ibPins);
    render();
  }
  var at = (days, hour) => {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date.getTime();
  };
  function ibSnooze(ref, kind, updated = "") {
    const entry = { ...ibSnz() };
    appState.ibSnzOpen = "";
    if (kind === "off") {
      delete entry[ref];
    } else {
      entry[ref] = {
        until: kind === "tomorrow" ? at(1, 9) : kind === "week" ? at((8 - (/* @__PURE__ */ new Date()).getDay()) % 7 || 7, 9) : 0,
        at: updated
      };
    }
    appState.ibSnz = entry;
    put("ibsnooze", entry);
    render();
  }
  function viewSave(rawName) {
    const name = rawName.trim();
    appState.ibNaming = false;
    if (!name) {
      return render();
    }
    appState.ibViews = [
      ...ibViews().filter((ibView) => ibView.name !== name),
      { name, q: appState.ibQ || "", sort: appState.ibSort || "updated" }
    ];
    put("ibviews", appState.ibViews);
    render();
  }
  function viewApply(name) {
    const ibView = ibViews().find((otherIbView) => otherIbView.name === name);
    if (!ibView) {
      return;
    }
    appState.ibQ = ibView.q;
    appState.ibSort = ibView.sort;
    appState.ibView = name;
    try {
      localStorage.setItem("ibsort", ibView.sort);
    } catch {
    }
    render();
  }
  function viewDelete(name) {
    appState.ibViews = ibViews().filter((ibView) => ibView.name !== name);
    put("ibviews", appState.ibViews);
    if (appState.ibView === name) {
      appState.ibView = "";
    }
    render();
  }
  var visible = () => (inboxProps().secs || []).filter((inboxSec) => !inboxSec.closed).flatMap(
    (inboxSec) => inboxSec.rows.map((ibRow) => ({
      ref: ibRow.ref,
      sec: inboxSec.key,
      updated: ibRow.updated
    }))
  );
  var keep2 = () => requestAnimationFrame(
    () => document.querySelector(".ib-row.sel")?.scrollIntoView({ block: "nearest" })
  );
  function inboxKey(event) {
    const rows = visible();
    const index = rows.findIndex((row2) => row2.ref === appState.ibSel);
    const cur = rows[index];
    const move = (delta) => {
      if (rows.length) {
        appState.ibSel = rows[Math.max(
          0,
          Math.min(
            rows.length - 1,
            index < 0 ? delta > 0 ? 0 : rows.length - 1 : index + delta
          )
        )].ref;
        render();
        keep2();
      }
    };
    if (event.key === "j" || event.key === "ArrowDown") {
      move(1);
    } else if (event.key === "k" || event.key === "ArrowUp") {
      move(-1);
    } else if (event.key === "Enter" && cur) {
      openPr(cur.ref);
    } else if (event.key === "p" && cur) {
      ibPin(cur.ref);
    } else if (event.key === "s" && cur) {
      appState.ibSnzOpen = appState.ibSnzOpen === cur.ref ? "" : cur.ref;
      render();
    } else if (event.key === "e" && cur) {
      appState.fold[cur.sec] = !appState.fold[cur.sec];
      try {
        localStorage.setItem("fold", JSON.stringify(appState.fold));
      } catch {
      }
      render();
    } else if (event.key === "/") {
      document.querySelector(".ib-bar input")?.focus();
    } else {
      return false;
    }
    event.preventDefault();
    return true;
  }

  // src/app/palette.tsx
  var rowsFor = (raw) => {
    const query = raw.trim().toLowerCase();
    const rows = appState.recent.filter(
      (recentEntry) => !query || `${recentEntry.ref} ${recentEntry.title}`.toLowerCase().includes(query)
    ).slice(0, 8).map((recentEntry) => ({
      ref: recentEntry.ref,
      label: recentEntry.title,
      sub: recentEntry.ref
    }));
    if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(query)) {
      rows.unshift({
        ref: raw.trim(),
        label: `Open ${raw.trim()}`,
        sub: "Go to this pull request"
      });
    }
    return rows;
  };
  function closePal() {
    appState.pal = null;
    paintPal();
  }
  function go(row2) {
    closePal();
    if (row2) {
      appState.nav = false;
      appState.focus = "";
      openPr(row2.ref);
    }
  }
  function paintPal() {
    const value = appState.pal;
    if (!value) {
      setSlot("pal", null);
      return;
    }
    if (value.k === "help") {
      setSlot("pal", /* @__PURE__ */ u3(HelpDialog, { close: closePal }));
      return;
    }
    const rows = rowsFor(value.q);
    const sel = Math.min(value.sel, Math.max(0, rows.length - 1));
    const onKey = (event) => {
      if (event.key === "Escape") {
        closePal();
      } else if (event.key === "ArrowDown") {
        value.sel = Math.min(rows.length - 1, sel + 1);
        paintPal();
        event.preventDefault();
      } else if (event.key === "ArrowUp") {
        value.sel = Math.max(0, sel - 1);
        paintPal();
        event.preventDefault();
      } else if (event.key === "Enter") {
        go(rows[sel]);
      }
    };
    setSlot(
      "pal",
      /* @__PURE__ */ u3(
        Palette,
        {
          q: value.q,
          rows,
          sel,
          onQ: (otherValue) => {
            value.q = otherValue;
            value.sel = 0;
            paintPal();
          },
          onKey,
          pick: (index) => go(rows[index]),
          close: closePal
        }
      )
    );
  }
  function openPalette() {
    if (appState.pal) {
      return;
    }
    appState.pal = { k: "pal", q: "", sel: 0 };
    paintPal();
  }
  function showHelp() {
    if (appState.pal) {
      return;
    }
    appState.pal = { k: "help" };
    paintPal();
  }
  var helpKey = (event) => {
    if (event.key === "Escape" && appState.pal?.k === "help") {
      closePal();
    }
  };

  // src/components/Home.tsx
  var cap = (text) => text[0].toUpperCase() + text.slice(1);
  function Banners({
    items,
    on: on3
  }) {
    return /* @__PURE__ */ u3(S, { children: items.map((pushBanner) => /* @__PURE__ */ u3("div", { class: "push-banner", children: [
      renderIcon("git-branch"),
      /* @__PURE__ */ u3("span", { children: [
        /* @__PURE__ */ u3("b", { children: pushBanner.branch }),
        " had recent pushes ",
        pushBanner.ago,
        pushBanner.showRepo ? /* @__PURE__ */ u3(S, { children: [
          " ",
          /* @__PURE__ */ u3("i", { children: [
            "\xB7 ",
            pushBanner.repo
          ] })
        ] }) : ""
      ] }),
      /* @__PURE__ */ u3("span", { class: "sp" }),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "btn small primary",
          "data-compare": `${pushBanner.repo}@${pushBanner.branch}`,
          onClick: () => on3.compare(pushBanner.repo, pushBanner.branch),
          children: "Compare & pull request"
        }
      ),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "push-x",
          "data-pdismiss": pushBanner.key,
          onClick: () => on3.dismiss(pushBanner.key),
          title: "Dismiss",
          children: renderIcon("x")
        }
      )
    ] })) });
  }
  function Card({ r: repoCard, on: on3 }) {
    return /* @__PURE__ */ u3(
      "a",
      {
        class: "hm-card",
        "data-repo": repoCard.full,
        onClick: () => on3.repo(repoCard.full),
        children: [
          /* @__PURE__ */ u3("span", { class: "rc-i", style: "color:var(--fgColor-muted)", children: renderIcon(repoCard.priv ? "lock" : "repo") }),
          /* @__PURE__ */ u3("span", { class: "hm-t", children: [
            /* @__PURE__ */ u3("b", { children: repoCard.name }),
            /* @__PURE__ */ u3("i", { children: [
              repoCard.owner,
              repoCard.archived ? " \xB7 archived" : "",
              repoCard.issues ? ` \xB7 ${repoCard.issues} open` : ""
            ] }),
            repoCard.desc ? /* @__PURE__ */ u3("em", { children: repoCard.desc }) : ""
          ] })
        ]
      }
    );
  }
  function Opt({
    v: otherValue,
    cur,
    t: text
  }) {
    return /* @__PURE__ */ u3("option", { value: otherValue, selected: cur === otherValue, children: text });
  }
  function Body({
    b: otherValue,
    on: on3
  }) {
    if (otherValue.kind === "addtoken") {
      return /* @__PURE__ */ u3("div", { class: "diff-empty", children: [
        "Add an access token to list all your repositories and their pull requests.",
        /* @__PURE__ */ u3("br", {}),
        /* @__PURE__ */ u3("br", {}),
        /* @__PURE__ */ u3("button", { class: "btn primary", id: "addtoken", onClick: on3.addToken, children: "Add token" })
      ] });
    }
    if (otherValue.kind === "error") {
      return /* @__PURE__ */ u3("div", { class: "diff-empty err", children: otherValue.text });
    }
    if (otherValue.kind === "spinner") {
      return /* @__PURE__ */ u3("div", { class: "spinner", style: "margin:48px auto", children: "Loading repositories\u2026" });
    }
    if (otherValue.kind === "recent") {
      return /* @__PURE__ */ u3(S, { children: [
        otherValue.hasAny ? /* @__PURE__ */ u3("div", { class: "hm-fbar", children: [
          /* @__PURE__ */ u3(
            "input",
            {
              class: "input hm-filter",
              id: "hmrfilter",
              placeholder: "Filter by title or repo\u2026",
              value: otherValue.filter,
              onInput: on3.recentFilter
            }
          ),
          /* @__PURE__ */ u3("div", { class: "seg-ctl", children: ["all", "open", "merged", "closed"].map((text) => /* @__PURE__ */ u3(
            "button",
            {
              class: otherValue.state === text ? "on" : "",
              "data-rstate": text,
              onClick: () => on3.rstate(text),
              children: cap(text)
            }
          )) })
        ] }) : "",
        otherValue.cards.length ? /* @__PURE__ */ u3("div", { class: "hm-grid", children: otherValue.cards.map((recentCard) => /* @__PURE__ */ u3(
          "a",
          {
            class: "hm-card",
            "data-open": recentCard.ref,
            onClick: (event) => on3.open(event.currentTarget, event),
            onAuxClick: (event) => on3.aux(event.currentTarget, event),
            onContextMenu: (event) => on3.ctx(event.currentTarget, event),
            children: [
              /* @__PURE__ */ u3("span", { class: `rc-i ${recentCard.state}`, children: renderIcon(recentCard.icon) }),
              /* @__PURE__ */ u3("span", { class: "hm-t", children: [
                /* @__PURE__ */ u3("b", { children: recentCard.title }),
                /* @__PURE__ */ u3("i", { children: recentCard.ref })
              ] }),
              /* @__PURE__ */ u3(
                "button",
                {
                  class: "rc-x",
                  "data-rm": recentCard.ref,
                  onClick: (event) => on3.rm(event, recentCard.ref),
                  title: "Remove",
                  children: renderIcon("x")
                }
              )
            ]
          }
        )) }) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: otherValue.emptyText })
      ] });
    }
    const grid = otherValue.none ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No matching repositories." }) : otherValue.groups ? /* @__PURE__ */ u3(S, { children: otherValue.groups.map((group) => /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("h3", { class: "hm-grp", children: [
        group.owner,
        /* @__PURE__ */ u3("span", { children: group.cards.length })
      ] }),
      /* @__PURE__ */ u3("div", { class: "hm-grid", children: group.cards.map((repoCard) => /* @__PURE__ */ u3(Card, { r: repoCard, on: on3 })) })
    ] })) }) : /* @__PURE__ */ u3("div", { class: "hm-grid", children: otherValue.cards.map((repoCard) => /* @__PURE__ */ u3(Card, { r: repoCard, on: on3 })) });
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("div", { class: "hm-fbar", children: [
        /* @__PURE__ */ u3(
          "input",
          {
            class: "input hm-filter",
            id: "hmfilter",
            placeholder: "Find a repository\u2026",
            value: otherValue.filter,
            onInput: on3.repoFilter
          }
        ),
        /* @__PURE__ */ u3("div", { class: "seg-ctl", children: ["all", "public", "private"].map((text) => /* @__PURE__ */ u3(
          "button",
          {
            class: otherValue.vis === text ? "on" : "",
            "data-hvis": text,
            onClick: () => on3.vis(text),
            children: cap(text)
          }
        )) }),
        /* @__PURE__ */ u3("select", { class: "input", id: "hmsort", title: "Sort", onChange: on3.sort, children: [
          /* @__PURE__ */ u3(Opt, { v: "pushed", cur: otherValue.sort, t: "Recently pushed" }),
          /* @__PURE__ */ u3(Opt, { v: "oldest", cur: otherValue.sort, t: "Least recently pushed" }),
          /* @__PURE__ */ u3(Opt, { v: "name", cur: otherValue.sort, t: "Name A\u2013Z" }),
          /* @__PURE__ */ u3(Opt, { v: "namez", cur: otherValue.sort, t: "Name Z\u2013A" }),
          /* @__PURE__ */ u3(Opt, { v: "owner", cur: otherValue.sort, t: "Owner A\u2013Z" }),
          /* @__PURE__ */ u3(Opt, { v: "ownerz", cur: otherValue.sort, t: "Owner Z\u2013A" }),
          /* @__PURE__ */ u3(Opt, { v: "issues", cur: otherValue.sort, t: "Most open issues" })
        ] }),
        /* @__PURE__ */ u3("select", { class: "input", id: "hmgroup", title: "Group", onChange: on3.group, children: [
          /* @__PURE__ */ u3(Opt, { v: "none", cur: otherValue.group, t: "No grouping" }),
          /* @__PURE__ */ u3(Opt, { v: "owner", cur: otherValue.group, t: "Group by owner" })
        ] })
      ] }),
      grid
    ] });
  }
  function Home({ p: props, on: on3 }) {
    return /* @__PURE__ */ u3("div", { class: "notes-page hm-page", children: [
      /* @__PURE__ */ u3("div", { class: "np-head", children: /* @__PURE__ */ u3("h1", { children: [
        renderIcon("home"),
        SP,
        props.owner || "Home"
      ] }) }),
      "\n  ",
      /* @__PURE__ */ u3("p", { class: "hm-hint", children: [
        "Open a pull request: type ",
        /* @__PURE__ */ u3("code", { children: "owner/repo#123" }),
        " or paste a URL in the bar above."
      ] }),
      props.banners.length ? /* @__PURE__ */ u3("div", { class: "push-wrap", children: /* @__PURE__ */ u3(Banners, { items: props.banners, on: on3 }) }) : "",
      props.err ? /* @__PURE__ */ u3("div", { class: "err", children: props.err }) : "",
      /* @__PURE__ */ u3("div", { class: "np-tabs", children: [
        /* @__PURE__ */ u3(
          "button",
          {
            class: props.tab === "repos" ? "sel" : "",
            "data-htab": "repos",
            onClick: () => on3.tab("repos"),
            children: [
              renderIcon("repo"),
              " Repositories",
              props.repoCount !== null ? /* @__PURE__ */ u3("span", { children: props.repoCount }) : ""
            ]
          }
        ),
        /* @__PURE__ */ u3(
          "button",
          {
            class: props.tab === "recent" ? "sel" : "",
            "data-htab": "recent",
            onClick: () => on3.tab("recent"),
            children: [
              renderIcon("clock"),
              " Recent",
              /* @__PURE__ */ u3("span", { children: props.recentCount })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ u3(Body, { b: props.body, on: on3 })
    ] });
  }

  // src/components/PrList.tsx
  var cap2 = (text) => text[0].toUpperCase() + text.slice(1);
  function Opts({
    arr,
    v: otherValue,
    all: all2
  }) {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("option", { value: "", children: all2 }),
      arr.map((text) => /* @__PURE__ */ u3("option", { value: text, selected: text === otherValue, children: text }))
    ] });
  }
  function FilterBar({
    p: props,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "prl-filters", children: [
      /* @__PURE__ */ u3("span", { class: "pf-search", children: [
        renderIcon("search"),
        /* @__PURE__ */ u3(
          "input",
          {
            class: "input",
            id: "mainfilter",
            placeholder: "Filter by title, #, author, branch, label\u2026",
            value: props.filter,
            spellcheck: false,
            onInput: on3.filter
          }
        )
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfauthor", onChange: on3.author, children: /* @__PURE__ */ u3(Opts, { arr: props.authors, v: props.author, all: "Author: all" }) }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pflabel", onChange: on3.label, children: /* @__PURE__ */ u3(Opts, { arr: props.labels, v: props.label, all: "Label: all" }) }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfstatus", onChange: on3.status, children: [
        /* @__PURE__ */ u3("option", { value: "", children: "Status: any" }),
        props.statuses.map(([key2, text]) => /* @__PURE__ */ u3("option", { value: key2, selected: key2 === props.status, children: text }))
      ] }),
      "\n  ",
      /* @__PURE__ */ u3("select", { class: "input", id: "pfsort", onChange: on3.sort, children: props.sorts.map(([key2, text]) => /* @__PURE__ */ u3("option", { value: key2, selected: key2 === props.sort, children: [
        "Sort: ",
        text
      ] })) }),
      "\n  ",
      /* @__PURE__ */ u3("span", { class: "pf-count", children: [
        props.n,
        " of ",
        props.total
      ] }),
      props.active ? /* @__PURE__ */ u3("button", { class: "btn", id: "pfclear", onClick: on3.clear, children: "Clear" }) : ""
    ] });
  }
  function PrListPage({
    p: props,
    on: on3
  }) {
    const body = props.err ? /* @__PURE__ */ u3("div", { class: "err", style: "padding:16px", children: props.err }) : props.loading ? /* @__PURE__ */ u3("div", { class: "spinner", style: "margin:48px auto", children: "Loading pull requests\u2026" }) : props.rows && props.rows.length ? /* @__PURE__ */ u3(S, { children: props.rows.map((prlRow) => /* @__PURE__ */ u3(
      "a",
      {
        class: "prl-row",
        "data-open": prlRow.ref,
        onClick: (event) => on3.open(event.currentTarget, event),
        onAuxClick: (event) => on3.aux(event.currentTarget, event),
        onContextMenu: (event) => on3.ctx(event.currentTarget, event),
        children: [
          /* @__PURE__ */ u3("span", { class: `rc-i ${prlRow.st}`, children: renderIcon(prlRow.icon) }),
          /* @__PURE__ */ u3("span", { class: "prl-main", children: [
            /* @__PURE__ */ u3("b", { children: prlRow.title }),
            prlRow.labels.map((item) => /* @__PURE__ */ u3(
              "span",
              {
                class: "pill-label",
                style: `background:#${item.color}33;color:#${item.color};border-color:#${item.color};margin:0 0 0 4px`,
                children: item.name
              }
            )),
            /* @__PURE__ */ u3("i", { children: prlRow.meta })
          ] }),
          /* @__PURE__ */ u3(
            "img",
            {
              src: `${prlRow.avatar}&s=40`,
              width: 20,
              height: 20,
              style: "border-radius:50%"
            }
          )
        ]
      }
    )) }) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: props.empty });
    return /* @__PURE__ */ u3("div", { class: "pr-page", children: [
      /* @__PURE__ */ u3("div", { class: "repoline", style: "padding-bottom:16px" }),
      /* @__PURE__ */ u3(Banners, { items: props.banners, on: on3 }),
      /* @__PURE__ */ u3("div", { class: "prl", children: [
        /* @__PURE__ */ u3("div", { class: "prl-head", children: [
          /* @__PURE__ */ u3("div", { children: [
            /* @__PURE__ */ u3("span", { class: "repo-ic", children: renderIcon("repo", 16) }),
            SP,
            /* @__PURE__ */ u3("b", { children: props.repo })
          ] }),
          /* @__PURE__ */ u3("div", { class: "seg", children: ["open", "closed", "all"].map((text) => /* @__PURE__ */ u3(
            "button",
            {
              "data-ps": text,
              class: props.state === text ? "on" : "",
              onClick: () => on3.ps(text),
              children: cap2(text)
            }
          )) })
        ] }),
        props.filterBar ? /* @__PURE__ */ u3(FilterBar, { p: props.filterBar, on: on3 }) : null,
        body
      ] })
    ] });
  }
  function Crumbs({ repo, trail, extraNode, on: on3 }) {
    const homeCur = !repo && !trail.length;
    const parts = [
      homeCur ? /* @__PURE__ */ u3("span", { class: "crumb cur home", children: [
        renderIcon("home", 14),
        /* @__PURE__ */ u3("span", { children: "Home" })
      ] }) : /* @__PURE__ */ u3("a", { class: "crumb", "data-home": "1", onClick: on3 && on3.home, title: "Home", children: [
        renderIcon("home", 14),
        /* @__PURE__ */ u3("span", { children: "Home" })
      ] })
    ];
    if (repo) {
      const [owner, name] = repo.split("/");
      parts.push(
        /* @__PURE__ */ u3("span", { class: "crumb-grp", children: [
          /* @__PURE__ */ u3(
            "a",
            {
              class: "crumb",
              "data-owner": owner,
              onClick: on3 && (() => on3.owner(owner)),
              title: `Repositories of ${owner}`,
              children: owner
            }
          ),
          /* @__PURE__ */ u3("span", { class: "crumb-slash", children: "/" }),
          /* @__PURE__ */ u3(
            "a",
            {
              class: "crumb strong",
              "data-repo": repo,
              onClick: on3 && (() => on3.repo(repo)),
              title: `All pull requests in ${repo}`,
              children: name
            }
          )
        ] })
      );
    }
    trail.forEach(
      (item, index) => parts.push(
        index === trail.length - 1 ? /* @__PURE__ */ u3("span", { class: "crumb cur", children: item.t }) : /* @__PURE__ */ u3(
          "a",
          {
            class: "crumb",
            "data-repo": item.repo || void 0,
            onClick: on3 && item.repo ? () => on3.repo(item.repo) : void 0,
            children: item.t
          }
        )
      )
    );
    return /* @__PURE__ */ u3("nav", { class: "repoline crumbs", "aria-label": "Breadcrumb", children: [
      parts.map((value, index) => /* @__PURE__ */ u3(S, { children: [
        index ? /* @__PURE__ */ u3("span", { class: "crumb-sep", children: renderIcon("chevron-right", 12) }) : "",
        value
      ] })),
      extraNode
    ] });
  }

  // src/app/bindwrite.ts
  function homeProps() {
    const tab = appState.homeTab || "repos";
    const owner = appState.homeOwner || "";
    let body;
    if (tab === "recent") {
      const query = (appState.recentFilter || "").toLowerCase();
      const st = appState.recentState || "all";
      const list = appState.recent.filter(
        (recentEntry) => (st === "all" || recentEntry.state === st) && (!query || `${recentEntry.title} ${recentEntry.ref}`.toLowerCase().includes(query))
      );
      body = {
        kind: "recent",
        filter: appState.recentFilter || "",
        state: st,
        hasAny: appState.recent.length > 0,
        cards: list.map((recentEntry) => ({
          ref: recentEntry.ref,
          state: recentEntry.state,
          icon: recentEntry.icon,
          title: recentEntry.title
        })),
        emptyText: appState.recent.length ? "No matching pull requests." : "Pull requests you open appear here."
      };
    } else if (!appState.hasToken) {
      body = { kind: "addtoken" };
    } else if (appState.reposErr) {
      body = { kind: "error", text: String(appState.reposErr) };
    } else if (!appState.repos) {
      body = { kind: "spinner" };
    } else {
      const field = (appState.repoFilter || "").toLowerCase();
      const vis = appState.hmVis || "all";
      const srt = appState.hmSort || "pushed";
      const grp = appState.hmGroup || "none";
      let list = appState.repos.filter(
        (repoSummary) => (!owner || repoSummary.full_name.startsWith(`${owner}/`)) && repoSummary.full_name.toLowerCase().includes(field) && (vis === "all" || vis === "private" === !!repoSummary.private)
      );
      const nm = (repoSummary) => repoSummary.full_name.split("/")[1];
      const pushed = (repoSummary) => Date.parse(repoSummary.pushed_at || "0") || 0;
      const sorters = {
        name: (firstRepoSummary, secondRepoSummary) => nm(firstRepoSummary).localeCompare(nm(secondRepoSummary)),
        namez: (firstRepoSummary, secondRepoSummary) => nm(secondRepoSummary).localeCompare(nm(firstRepoSummary)),
        issues: (firstRepoSummary, secondRepoSummary) => (secondRepoSummary.open_issues_count || 0) - (firstRepoSummary.open_issues_count || 0) || nm(firstRepoSummary).localeCompare(nm(secondRepoSummary)),
        oldest: (firstRepoSummary, secondRepoSummary) => pushed(firstRepoSummary) - pushed(secondRepoSummary),
        owner: (firstRepoSummary, secondRepoSummary) => firstRepoSummary.full_name.localeCompare(secondRepoSummary.full_name),
        ownerz: (firstRepoSummary, secondRepoSummary) => secondRepoSummary.full_name.split("/")[0].localeCompare(firstRepoSummary.full_name.split("/")[0]) || nm(firstRepoSummary).localeCompare(nm(secondRepoSummary))
      };
      const sorter = sorters[srt];
      if (sorter) {
        list = [...list].sort(sorter);
      }
      const card = (repoSummary) => ({
        full: repoSummary.full_name,
        name: repoSummary.full_name.split("/")[1],
        owner: repoSummary.full_name.split("/")[0],
        priv: !!repoSummary.private,
        archived: !!repoSummary.archived,
        issues: repoSummary.open_issues_count || 0,
        desc: repoSummary.description || ""
      });
      let groups = null;
      if (grp === "owner") {
        const by = /* @__PURE__ */ new Map();
        list.forEach((repoSummary) => {
          const option = repoSummary.full_name.split("/")[0];
          if (!by.has(option)) {
            by.set(option, []);
          }
          by.get(option).push(repoSummary);
        });
        groups = [...by].map(([option, rs]) => ({
          owner: option,
          cards: rs.map(card)
        }));
      }
      body = {
        kind: "repos",
        filter: appState.repoFilter || "",
        vis,
        sort: srt,
        group: grp,
        groups: list.length ? groups : null,
        cards: list.map(card),
        none: !list.length
      };
    }
    return {
      owner,
      tab,
      repoCount: appState.repos ? appState.repos.filter(
        (repoSummary) => !owner || repoSummary.full_name.startsWith(`${owner}/`)
      ).length : null,
      recentCount: appState.recent.length,
      banners: pushBannerItems(),
      err: appState.error ? String(appState.error) : "",
      body
    };
  }

  // src/app/token.ts
  function tokenDialog() {
    appState.oauth = {};
    appState.oauthLive = false;
    appState.tokenText = "";
    appState.dlg = { k: "token" };
    render();
  }
  async function tokenSave() {
    const value = appState.tokenText || "";
    try {
      await tauri?.invoke("set_token", { token: value });
      appState.hasToken = !!value.trim();
      appState.authChecked = true;
      if (appState.hasToken) {
        appState.gateErr = "";
        loadRepos();
      } else {
        appState.repos = null;
      }
    } catch (error) {
      alert(error);
    }
    appState.oauthLive = false;
    appState.dlg = null;
    render();
  }
  async function oauthGo() {
    const show = (options) => {
      appState.oauth = options;
      if (appState.dlg) {
        paintDlg();
      }
    };
    appState.oauthLive = true;
    const me = appState.oauthRun = (appState.oauthRun || 0) + 1;
    try {
      const deviceCode = await tauri.invoke("device_start");
      show({ code: deviceCode.user_code });
      tauri.invoke("open_external", { url: deviceCode.verification_uri }).catch(() => {
      });
      let wait = (deviceCode.interval || 5) * 1e3;
      const until = Date.now() + (deviceCode.expires_in || 900) * 1e3;
      while (appState.oauthLive && appState.oauthRun === me && Date.now() < until) {
        const delay = wait;
        await new Promise((handler) => setTimeout(handler, delay));
        if (!appState.oauthLive || appState.oauthRun !== me) {
          return;
        }
        const st = await tauri.invoke("device_poll", {
          deviceCode: deviceCode.device_code
        });
        if (st === "slow_down") {
          wait += 5e3;
        }
        if (st === "ok") {
          appState.oauthLive = false;
          appState.hasToken = true;
          appState.gateErr = "";
          appState.dlg = null;
          loadRepos();
          return;
        }
      }
      throw new Error("The code expired. Start again.");
    } catch (error) {
      appState.oauthLive = false;
      show({ err: error instanceof Error ? error.message : String(error) });
    }
  }

  // src/app/home.tsx
  var crumbs = {
    home: () => {
      appState.view = "home";
      appState.homeOwner = "";
      appState.nav = false;
      render();
    },
    owner: (option) => {
      appState.view = "home";
      appState.homeOwner = option;
      appState.homeTab = "repos";
      appState.nav = false;
      render();
      if (appState.hasToken && !appState.repos) {
        loadRepos();
      }
    },
    repo: (text) => openRepo(text)
  };
  var on = {
    tab: (text) => {
      appState.homeTab = text;
      render();
    },
    vis: (value) => {
      appState.hmVis = value;
      render();
    },
    sort: (event) => {
      appState.hmSort = event.target.value;
      render();
    },
    group: (event) => {
      appState.hmGroup = event.target.value;
      render();
    },
    repoFilter: (event) => {
      appState.repoFilter = event.target.value;
      render();
    },
    recentFilter: (event) => {
      appState.recentFilter = event.target.value;
      render();
    },
    rstate: (text) => {
      appState.recentState = text;
      render();
    },
    repo: (full) => openRepo(full),
    open: openClick,
    aux: openAux,
    ctx: openCtx,
    rm: rmRecent,
    addToken: tokenDialog,
    compare: (repo, br) => openNewPr(repo, br),
    dismiss: (key2) => {
      pushDis[key2] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    }
  };
  function HomeView() {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        Crumbs,
        {
          repo: "",
          trail: appState.homeOwner ? [{ t: appState.homeOwner }] : [],
          on: crumbs
        }
      ),
      /* @__PURE__ */ u3(Home, { p: homeProps(), on })
    ] });
  }

  // src/app/meta.ts
  function metaOpen(field) {
    const pull = appState.bundle.pull;
    const on3 = field === "labels" ? pull.labels.map((label) => label.name) : field === "assignees" ? pull.assignees.map((user) => user.login) : pull.milestone ? [String(pull.milestone.number ?? "")] : [];
    appState.meta = { field, items: null, on: on3, q: "", err: "", busy: false };
    appState.dlg = { k: "meta" };
    render();
    tauri?.invoke("pr_meta_options", { repo: prRef().repo, field }).then((metaItems) => {
      if (appState.meta) {
        appState.meta.items = metaItems;
        paintDlg();
      }
    }).catch((value) => {
      if (appState.meta) {
        appState.meta.err = String(value).replace(/^Error: /, "");
        appState.meta.items = [];
        paintDlg();
      }
    });
  }
  async function metaSave() {
    const meta = appState.meta;
    if (!meta || meta.busy || !tauri) {
      return;
    }
    meta.busy = true;
    meta.err = "";
    paintDlg();
    try {
      await tauri.invoke("pr_meta_set", {
        ...prRef(),
        field: meta.field,
        values: meta.on
      });
      appState.meta = null;
      appState.dlg = null;
      await refreshPr();
    } catch (error) {
      meta.busy = false;
      meta.err = String(error).replace(/^Error: /, "");
      paintDlg();
    }
  }

  // src/app/pr.tsx
  function prSummary(otherBundle) {
    const pull = otherBundle.pull;
    const [, , label] = stateOf(pull);
    const latest = /* @__PURE__ */ new Map();
    otherBundle.timeline.filter(
      (timelineEvent) => timelineEvent.event === "reviewed" && timelineEvent.user
    ).forEach((timelineEvent) => {
      const st = timelineEvent.state.toLowerCase();
      if (st !== "commented" || !latest.has(timelineEvent.user.login)) {
        latest.set(timelineEvent.user.login, st);
      }
    });
    const by = (text) => [...latest].filter(([, value]) => value === text).map(([url]) => url);
    const rv = [
      by("approved").length ? `approved by ${by("approved").join(", ")}` : "",
      by("changes_requested").length ? `changes requested by ${by("changes_requested").join(", ")}` : ""
    ].filter(Boolean).join("; ") || "no reviews yet";
    return `${pull.title} (${pull.base.repo.full_name}#${pull.number})
${label} \xB7 by ${pull.user.login} \xB7 +${pull.additions} \u2212${pull.deletions} in ${pull.changed_files ?? otherBundle.files.length} files \xB7 ${rv}
${pull.html_url}`;
  }
  var hide = (key2, flag) => keep(() => {
    appState.hide[key2] = flag;
    localStorage.setItem("hide", JSON.stringify(appState.hide));
  });
  var toggleSplit = () => {
    if (appState.view === "pr" && appState.bundle && appState.tab !== "files" && appState.tab !== "checks" && appState.tab !== "timeline") {
      head.split();
    }
  };
  var head = {
    tab: openTab,
    edit: editPrDialog,
    copy: () => {
      navigator.clipboard?.writeText(appState.bundle.pull.head.ref);
    },
    review: reviewDialog,
    summary: () => {
      navigator.clipboard?.writeText(prSummary(appState.bundle));
    },
    side: () => keep(() => {
      appState.hide.side = !appState.hide.side;
      localStorage.setItem("hide", JSON.stringify(appState.hide));
    }),
    split: () => keep(() => {
      appState.split = !appState.split;
      localStorage.setItem("split", appState.split ? "1" : "0");
    })
  };
  var sideOn = {
    fold: (key2, def) => {
      appState.fold[key2] = !isFolded(key2, def);
      localStorage.setItem("fold", JSON.stringify(appState.fold));
      rerender();
    },
    rvtoggle: () => {
      appState.showAllReviewers = !appState.showAllReviewers;
      rerender();
    },
    rerequest: rerequestReview,
    edit: (sideKey) => {
      if (sideKey === "labels" || sideKey === "assignees" || sideKey === "milestone") {
        metaOpen(sideKey);
      }
    },
    grip: (event, sideKey) => roGrip(
      event,
      "side",
      ".pr-side-inner > .ro-it",
      sideKey,
      () => arrange(SIDE_KEYS, "side", (otherSideKey) => otherSideKey),
      (options) => saveOrder("side", options)
    )
  };
  function Header() {
    const pull = appState.bundle.pull;
    const row2 = pull.base.repo;
    const extra = /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        "a",
        {
          class: "crumb gh",
          href: row2.html_url,
          "data-ext": "",
          title: "Open on GitHub",
          children: renderIcon("link-external", 12)
        }
      ),
      appState.refreshing ? /* @__PURE__ */ u3("span", { class: "stale", children: "Refreshing\u2026" }) : ""
    ] });
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        Crumbs,
        {
          repo: row2.full_name,
          trail: [
            { t: "Pull requests", repo: row2.full_name },
            { t: `#${pull.number}` }
          ],
          extraNode: extra,
          on: crumbs
        }
      ),
      /* @__PURE__ */ u3(PrHeader, { ...prHeaderProps(appState.bundle), on: head })
    ] });
  }
  function PrView() {
    const bundle = appState.bundle;
    if (appState.split && appState.tab !== "files" && appState.tab !== "checks" && appState.tab !== "timeline") {
      return /* @__PURE__ */ u3(SplitLayout, { header: /* @__PURE__ */ u3(Header, {}), split: splitView(bundle) });
    }
    const body = appState.tab === "files" ? filesView(bundle) : appState.tab === "commits" ? commitsView(bundle) : appState.tab === "checks" ? checksView(bundle) : null;
    const side = appState.tab !== "conversation" ? { kind: "none" } : appState.hide.side ? { kind: "rail" } : {
      kind: "aside",
      inner: /* @__PURE__ */ u3(PrSide, { ...sidebarProps(bundle), on: sideOn }),
      on: { hide: () => hide("side", true) }
    };
    return /* @__PURE__ */ u3(
      PrLayout,
      {
        header: /* @__PURE__ */ u3(Header, {}),
        body: appState.tab === "timeline" ? /* @__PURE__ */ u3("div", { class: "rail", children: /* @__PURE__ */ u3(Timeline, { m: timelineModel(bundle), on: tlOn }) }) : appState.tab === "conversation" ? /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3(Attention, { ...attentionProps(bundle), on: attOn }),
          /* @__PURE__ */ u3(Timeline, { m: timelineModel(bundle), on: tlOn })
        ] }) : body,
        side,
        on: { show: () => hide("side", false) }
      }
    );
  }

  // src/app/keyboard.ts
  var typing = (target) => target && (target.closest?.(
    'input, textarea, select, [contenteditable="true"], .ProseMirror'
  ) || target.isContentEditable);
  var kbItems = () => [...qa(".main .tl-comment, .main .tc")].filter(
    (element) => element.offsetParent
  );
  function kbGo(el) {
    if (!el) {
      return;
    }
    appState.kbId = el.id;
    rerender();
  }
  var kbCur = () => appState.kbId && document.getElementById(appState.kbId) || null;
  function kbStep(dir, pick = kbItems) {
    const items = pick();
    const cur = kbCur();
    if (!items.length) {
      return;
    }
    let index = cur ? items.indexOf(cur) : -1;
    if (index === -1 && cur) {
      index = items.findIndex(
        (element) => cur.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING
      ) - (dir > 0 ? 1 : 0);
    }
    kbGo(items[Math.min(items.length - 1, Math.max(0, index + dir))]);
  }
  var openThreads = () => [...qa(".main .thread")].filter(
    (element) => !queryElement(".thread-head .res", element) && element.offsetParent
  ).map((element) => queryElement(".tc", element)).filter(Boolean);
  function setComposer(open2, focus) {
    if (!appState.composerBox) {
      return false;
    }
    appState.cOpen = open2;
    rerender();
    if (open2 && focus) {
      focusDraft("comment");
    }
    return true;
  }
  var menuAway = (event) => {
    if (appState.tabMenu && !event.target.closest(".pt-menu, #tabadd")) {
      appState.tabMenu = false;
      rerender();
    }
  };
  function shortcut(event) {
    if (appState.tabMenu && event.key === "Escape") {
      appState.tabMenu = false;
      rerender();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && !event.altKey) {
      const key2 = event.key.toLowerCase();
      if (key2 === "t" && !event.shiftKey) {
        event.preventDefault();
        appState.tabMenu = !appState.tabMenu;
        if (!appState.tabs.length) {
          appState.tabMenu = true;
        }
        rerender();
        return;
      }
      if (key2 === "t" && event.shiftKey) {
        event.preventDefault();
        reopenTab();
        return;
      }
      if (key2 === "w" && appState.tabs.length && tabIdx() >= 0) {
        event.preventDefault();
        closeTab(tabIdx());
        return;
      }
      if (/^[1-9]$/.test(key2) && appState.tabs[+key2 - 1]) {
        event.preventDefault();
        openTab2(appState.tabs[+key2 - 1].ref);
        return;
      }
      if (event.key === "Tab" && event.ctrlKey) {
        event.preventDefault();
        stepTab(event.shiftKey ? -1 : 1);
        return;
      }
    }
    if (event.key === "Escape" && !event.defaultPrevented && event.target.closest?.("#composer") && !queryElement(".tt-slash")) {
      event.preventDefault();
      event.target.blur?.();
      setComposer(false);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target) || queryElement(".palette, .dlg-bg")) {
      return;
    }
    if (appState.view === "inbox" && inboxKey(event)) {
      return;
    }
    if (event.key === "j") {
      kbStep(1);
    } else if (event.key === "k") {
      kbStep(-1);
    } else if (event.key === "]") {
      kbStep(1, openThreads);
    } else if (event.key === "[") {
      kbStep(-1, openThreads);
    } else if (event.key === "?") {
      showHelp();
    } else if (event.key === "n") {
      event.preventDefault();
      openNewPr();
    } else if (event.key === "c" && appState.view === "pr" && appState.composerBox) {
      event.preventDefault();
      setComposer(true, true);
    } else if (event.key === "f" && queryElement(".split")) {
      flipSides();
    } else if (event.key === "s" && appState.bundle) {
      toggleSplit();
    } else if (event.key === "d" && appState.bundle) {
      setDiffMode(appState.diffMode === "split" ? "unified" : "split");
    } else if (event.key === "r") {
      const cur = kbCur();
      const host = cur?.closest(".thread")?.querySelector(".reply .tt");
      if (!host) {
        if (appState.composerBox) {
          event.preventDefault();
          setComposer(true, true);
        }
        return;
      }
      event.preventDefault();
      const key2 = host.dataset.draft;
      scrollDraft(key2);
      focusDraft(key2);
    }
  }

  // src/app/scrolling.tsx
  var scrollRaf = 0;
  var lastTop = 0;
  var atEnd = false;
  var toTop = (smooth = true) => {
    if (appState.scrollId && appState.scrollId !== "main") {
      scrollTarget(appState.scrollId, 0, smooth);
    } else {
      scrollMain(0, smooth);
    }
  };
  var toBottom = (smooth = true) => {
    if (appState.scrollId && appState.scrollId !== "main") {
      scrollTarget(appState.scrollId, 1e7, smooth);
    } else {
      scrollMain(1e7, smooth);
    }
  };
  var paintToTop = () => setSlot(
    "totop",
    /* @__PURE__ */ u3(
      ToTop,
      {
        dir: appState.toTop || "",
        onClick: () => appState.toTop === "down" ? toBottom() : toTop()
      }
    )
  );
  function scrollBtn(el) {
    const next = el.scrollHeight - el.clientHeight < 500 ? "" : el.scrollTop < 200 ? "down" : "up";
    if ((appState.toTop || "") !== next) {
      appState.toTop = next;
      paintToTop();
    }
  }
  function scrolled(id, el) {
    appState.scrollId = id;
    if (id === "main") {
      appState.mainTop = el.scrollTop;
      if (appState.view === "pr" && !appState.restoring && !scrollRaf) {
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          const tab = appState.tabs[tabIdx()];
          if (tab) {
            tab.scroll = el.scrollTop;
            tab.tab = appState.tab;
          }
        });
      }
    }
    scrollBtn(el);
    const item = appState.composerBox;
    if (!item || item.in !== id) {
      return;
    }
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const up = el.scrollTop < lastTop;
    lastTop = el.scrollTop;
    if (dist < 24 && !atEnd) {
      atEnd = true;
      if (!composerOpen()) {
        setComposer(true, false);
      }
    }
    if (dist > item.h + 60) {
      atEnd = false;
      if (up && composerOpen() && !(appState.draft.comment || "").trim()) {
        blurDraft("comment");
        setComposer(false);
      }
    }
  }
  var homeKey = (event) => {
    if ((event.key === "Home" || event.key === "End") && !event.target.closest?.(
      "input, textarea, select, [contenteditable]"
    ) && appState.scrollId) {
      event.preventDefault();
      if (event.key === "Home") {
        toTop();
      } else {
        toBottom();
      }
    }
  };

  // src/app/viewed.ts
  var stamp = (fileChange) => fileChange.sha || `${fileChange.additions}/${fileChange.deletions}`;
  var key = () => `${appState.bundle?.pull.base.repo.full_name}#${appState.bundle?.pull.number}`;
  var all = () => appState.viewed ||= load(
    "viewed",
    {}
  );
  var save = () => {
    try {
      localStorage.setItem("viewed", JSON.stringify(all()));
    } catch {
    }
  };
  var isViewed = (fileChange) => all()[key()]?.[fileChange.filename] === stamp(fileChange);
  var viewedCount = (files) => files.filter(isViewed).length;
  function toggleViewed(fileChange) {
    const lookup = all()[key()] ||= {};
    const on3 = !isViewed(fileChange);
    if (on3) {
      lookup[fileChange.filename] = stamp(fileChange);
    } else {
      delete lookup[fileChange.filename];
    }
    appState.fold[`f:${fileChange.filename}`] = on3;
    try {
      localStorage.setItem("fold", JSON.stringify(appState.fold));
    } catch {
    }
    save();
    rerender();
  }
  function viewedAll(files, on3) {
    const lookup = all()[key()] ||= {};
    files.forEach((fileChange) => {
      if (on3) {
        lookup[fileChange.filename] = stamp(fileChange);
      } else {
        delete lookup[fileChange.filename];
      }
      appState.fold[`f:${fileChange.filename}`] = on3;
    });
    try {
      localStorage.setItem("fold", JSON.stringify(appState.fold));
    } catch {
    }
    save();
    rerender();
  }

  // src/app/mergebox.tsx
  function mergeModel(bundle) {
    const pull = bundle.pull;
    const head2 = pull.head.label.split(":")[1];
    if (pull.merged) {
      return { kind: "merged", head: head2 };
    }
    if (pull.state === "closed") {
      return { kind: "closed", head: head2 };
    }
    const clean = pull.mergeable_state === "clean" || pull.mergeable !== false;
    const latest = /* @__PURE__ */ new Map();
    bundle.timeline.filter(
      (timelineEvent) => timelineEvent.event === "reviewed" && timelineEvent.user
    ).forEach((timelineEvent) => {
      const st = timelineEvent.state.toLowerCase();
      if (st === "commented" && latest.has(timelineEvent.user.login)) {
        return;
      }
      latest.set(timelineEvent.user.login, st);
    });
    const ap = [...latest.values()].filter((value) => value === "approved").length;
    const cr = [...latest.values()].filter(
      (value) => value === "changes_requested"
    ).length;
    const pendRev = (pull.requested_reviewers || []).length;
    const rvHead = cr ? [
      "bad",
      "x-circle-fill",
      "Changes requested",
      `${cr} reviewer${cr === 1 ? "" : "s"} requested changes`
    ] : ap ? [
      "ok",
      "check-circle-fill",
      "Changes approved",
      `${ap} approving review${ap === 1 ? "" : "s"}`
    ] : [
      "",
      "eye",
      "Review not yet submitted",
      pendRev ? `${pendRev} pending review${pendRev === 1 ? "" : "s"}` : "No reviews yet"
    ];
    const list = (bundle.checks || []).map((check) => ({
      ...check,
      st: checkState(check)
    }));
    const cnt = (key2) => list.filter((item) => item.st === key2).length;
    const ckHead = cnt("fail") ? [
      "bad",
      "x-circle-fill",
      `${cnt("fail")} check${cnt("fail") === 1 ? "" : "s"} failing`
    ] : cnt("pending") ? [
      "",
      "dot-fill",
      `${cnt("pending")} check${cnt("pending") === 1 ? "" : "s"} in progress`
    ] : ["ok", "check-circle-fill", "All checks have passed"];
    const ckSub = [
      cnt("skip") && `${cnt("skip")} neutral`,
      cnt("pass") && `${cnt("pass")} successful`,
      cnt("fail") && `${cnt("fail")} failing`,
      cnt("pending") && `${cnt("pending")} pending`
    ].filter(Boolean).join(", ");
    const grp = (key2, title) => {
      const groups = list.filter((item) => item.st === key2);
      if (!groups.length) {
        return [];
      }
      const open2 = appState.mbOpen?.has(`g${key2}`) ?? key2 !== "pass";
      return [
        {
          k: key2,
          title,
          open: open2,
          items: groups.map((item) => ({
            st: item.st,
            url: item.url,
            icon: CK[item.st][0],
            name: item.name,
            req: (appState.bundle?.required_checks || []).includes(item.name),
            desc: item.description || item.app || ""
          }))
        }
      ];
    };
    return {
      kind: "open",
      p: {
        draft: !!pull.draft,
        busyReady: appState.busy === "ready",
        errReady: errMsg("ready"),
        rv: {
          h: rvHead,
          open: !!appState.mbOpen?.has("rv"),
          ap,
          cr,
          pend: pendRev,
          pendNames: (pull.requested_reviewers || []).map((user) => user.login).join(", ")
        },
        ck: list.length ? {
          h: ckHead.concat(ckSub),
          open: !!appState.mbOpen?.has("ck"),
          rerunable: list.some(
            (item) => item.st === "fail" && /\/actions\/runs\//.test(item.url || "")
          ),
          groups: [
            ...grp("fail", "Failing checks"),
            ...grp("pending", "In progress"),
            ...grp("skip", "Neutral checks"),
            ...grp("pass", "Successful checks")
          ]
        } : null,
        behind: pull.mergeable_state === "behind",
        busyUpdate: appState.busy === "update_branch",
        baseRef: pull.base.ref,
        errUpdate: errMsg("update_branch"),
        clean
      }
    };
  }
  function sidebarProps(bundle) {
    const pull = bundle.pull;
    const reviewers = /* @__PURE__ */ new Map();
    pull.requested_reviewers.forEach(
      (user) => reviewers.set(user.login, { u: user, st: "req" })
    );
    bundle.timeline.filter((timelineEvent) => timelineEvent.event === "reviewed").forEach((timelineEvent) => {
      const st = timelineEvent.state.toLowerCase();
      const cur = reviewers.get(timelineEvent.user.login);
      if (cur?.st === "req") {
        if (!cur.prev || st === "approved" || st === "changes_requested") {
          cur.prev = st;
        }
      } else if (!cur || st === "approved" || st === "changes_requested") {
        reviewers.set(timelineEvent.user.login, {
          u: timelineEvent.user,
          st
        });
      }
    });
    const canRe = !pull.merged && pull.state === "open";
    const rank = (reviewer) => {
      const verdict = reviewer.st === "req" ? reviewer.prev : reviewer.st;
      if (reviewer.u.login.endsWith("[bot]")) {
        return 4;
      }
      if (verdict === "changes_requested") {
        return 0;
      }
      if (verdict === "approved") {
        return 1;
      }
      return verdict ? 2 : 3;
    };
    const rv = [...reviewers.values()].sort((first, second) => rank(first) - rank(second)).map((reviewer) => ({
      ...reviewer,
      canRe: canRe && reviewer.st !== "req" && reviewer.u.login !== pull.user.login
    }));
    const people = /* @__PURE__ */ new Map();
    [
      pull.user,
      ...bundle.timeline.map(
        (timelineEvent) => timelineEvent.user || timelineEvent.actor || timelineEvent.author
      )
    ].forEach(
      (value) => value && value.login && !people.has(value.login) && people.set(value.login, value)
    );
    return {
      reviewers: rv,
      showAll: !!appState.showAllReviewers,
      assignees: pull.assignees,
      labels: pull.labels,
      milestone: pull.milestone ?? null,
      people: [...people.values()].slice(0, 30),
      peopleCount: people.size,
      folded: {
        reviewers: isFolded("sb:Reviewers"),
        assignees: isFolded("sb:Assignees"),
        labels: isFolded("sb:Labels"),
        milestone: isFolded("sb:Milestone"),
        people: isFolded("sb:people")
      }
    };
  }
  var frKey = (cs, frRange) => frRange.a === frRange.b ? cs[frRange.a].sha : `${cs[frRange.a].parent}..${cs[frRange.b].sha}`;
  function frDiff(bundle) {
    const cs = commitList(bundle);
    const frRange = appState.fr;
    if (!frRange || !cs[frRange.a] || !cs[frRange.b]) {
      return bundle.files;
    }
    return frRange.a === frRange.b ? appState.cdiff[cs[frRange.a].sha] : appState.rdiff[frKey(cs, frRange)];
  }
  async function loadFr() {
    const bundle = appState.bundle;
    const frRange = appState.fr;
    if (!bundle || !frRange) {
      return;
    }
    const cs = commitList(bundle);
    const single = frRange.a === frRange.b;
    const key2 = frKey(cs, frRange);
    const store = single ? appState.cdiff : appState.rdiff;
    const repo = bundle.pull.base.repo.full_name;
    if (store[key2] !== void 0 && store[key2] !== "loading") {
      return;
    }
    store[key2] = "loading";
    render();
    try {
      if (!tauri) {
        throw new Error("Per-commit diffs are available in the desktop app.");
      }
      if (!single && !cs[frRange.a].parent) {
        throw new Error("This range has no parent commit to compare against.");
      }
      store[key2] = (single ? await tauri.invoke("fetch_commit", { repo, sha: key2 }) : await tauri.invoke("fetch_range", {
        repo,
        base: cs[frRange.a].parent,
        head: cs[frRange.b].sha
      })).files || [];
    } catch (error) {
      store[key2] = String(error).replace(/^Error: /, "");
    }
    render();
  }
  function setFr(frRange) {
    appState.fr = frRange;
    appState.dlg = null;
    render();
    loadFr();
  }
  function sinceReview(bundle) {
    const cs = commitList(bundle);
    const mine = bundle.timeline.filter(
      (timelineEvent) => timelineEvent.event === "reviewed" && timelineEvent.user?.login === appState.me && timelineEvent.commit_id
    );
    if (!appState.me || !mine.length) {
      return null;
    }
    const at2 = cs.findIndex(
      (commitRow) => commitRow.sha === mine[mine.length - 1].commit_id
    );
    return at2 < 0 ? null : { at: at2, n: cs.length - 1 - at2 };
  }
  function commitsDialogProps() {
    const bundle = appState.bundle;
    const cs = commitList(bundle);
    const pick = appState.cpick || appState.fr;
    const sr = sinceReview(bundle);
    const query = (appState.cfilter || "").toLowerCase();
    const on3 = (index) => !!pick && index >= pick.a && index <= pick.b;
    return {
      rows: cs.map((commitRow, index) => {
        const title = String(commitRow.message).split("\n")[0];
        const by = commitRow.name || commitRow.author?.login || "";
        const word = when(commitRow.date).replace(/<\/?span[^>]*>/g, "");
        const sha = commitRow.sha.slice(0, 7);
        return {
          i: index,
          on: on3(index),
          title,
          by,
          when: word,
          sha,
          hidden: !!query && !`${title + by} committed ${word}${sha}`.toLowerCase().includes(query)
        };
      }),
      count: cs.length,
      allOn: !appState.fr,
      since: sr ? {
        on: !!appState.fr && appState.fr.a === sr.at + 1 && appState.fr.b === cs.length - 1,
        n: sr.n
      } : null,
      filter: appState.cfilter || "",
      selLabel: pick ? pick.a === pick.b ? "1 commit selected" : `${pick.b - pick.a + 1} commits selected` : "Nothing selected",
      hasPick: !!pick
    };
  }
  function openCommits() {
    appState.cpick = appState.fr ? { ...appState.fr } : null;
    appState.cfilter = "";
    appState.dlg = { k: "commits" };
    render();
  }
  function filesView(bundle) {
    const cs = commitList(bundle);
    const frRange = appState.fr && cs[appState.fr.a] && cs[appState.fr.b] ? appState.fr : null;
    const single = !!frRange && frRange.a === frRange.b;
    const sh = (index) => cs[index].sha.slice(0, 7);
    const bar = /* @__PURE__ */ u3(
      FcBar,
      {
        label: !frRange ? "All commits" : single ? "Commit" : `${frRange.b - frRange.a + 1} commits`,
        count: !frRange ? cs.length : null,
        code: !frRange ? null : single ? sh(frRange.a) : `${sh(frRange.a)}\u2026${sh(frRange.b)}`,
        nav: single ? { prevOff: frRange.a <= 0, nextOff: frRange.a >= cs.length - 1 } : null,
        title: frRange && single ? String(cs[frRange.a].message).split("\n")[0] : "",
        hasRange: !!frRange,
        on: filesOn
      }
    );
    if (!frRange) {
      return /* @__PURE__ */ u3(S, { children: [
        bar,
        filesList(bundle.files, true)
      ] });
    }
    const value = frDiff(bundle);
    return /* @__PURE__ */ u3(S, { children: [
      bar,
      value === void 0 || value === "loading" ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Loading\u2026" }) : typeof value === "string" ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: value }) : filesList(value)
    ] });
  }
  var b0open = () => !!appState.bundle && !appState.bundle.pull.merged && appState.bundle.pull.state === "open";
  function filesList(input, canComment = false) {
    let files = input;
    if (!files.length) {
      return /* @__PURE__ */ u3("div", { class: "diff-empty", children: "No files changed." });
    }
    const pid = appState.bundle?.pull?.id;
    const hasC = (fileChange) => (appState.bundle?.review_comments || []).some(
      (reviewComment) => reviewComment.path === fileChange.filename
    ) || pendList().some(
      (pendingComment) => pendingComment.path === fileChange.filename
    );
    if (appState.autoFoldFor !== pid) {
      appState.autoFoldFor = pid;
      let budget = 1200;
      for (const fileChange of files) {
        const count = fileChange.additions + fileChange.deletions;
        const key2 = `f:${fileChange.filename}`;
        if (key2 in appState.fold || hasC(fileChange)) {
          continue;
        }
        if (count > 400 || count > budget) {
          appState.fold[key2] = true;
        } else {
          budget -= count;
        }
      }
    }
    const shown2 = (fileChange) => !appState.fold[`f:${fileChange.filename}`];
    const srt = appState.fileSort || "path";
    const cnt = (fileChange) => (appState.bundle?.review_comments || []).filter(
      (reviewComment) => reviewComment.path === fileChange.filename && !reviewComment.in_reply_to_id
    ).length;
    const so = {
      path: null,
      pathz: (leftFileChange, rightFileChange) => rightFileChange.filename.localeCompare(leftFileChange.filename),
      most: (leftFileChange, rightFileChange) => rightFileChange.additions + rightFileChange.deletions - (leftFileChange.additions + leftFileChange.deletions),
      least: (leftFileChange, rightFileChange) => leftFileChange.additions + leftFileChange.deletions - (rightFileChange.additions + rightFileChange.deletions),
      comments: (leftFileChange, rightFileChange) => cnt(rightFileChange) - cnt(leftFileChange),
      status: (leftFileChange, rightFileChange) => String(leftFileChange.status).localeCompare(
        String(rightFileChange.status)
      ) || leftFileChange.filename.localeCompare(rightFileChange.filename)
    };
    const srtFn = so[srt];
    if (srtFn) {
      files = [...files].sort(srtFn);
    }
    const all2 = files.every(
      (fileChange) => appState.fold[`f:${fileChange.filename}`]
    );
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        FilesBar,
        {
          mode: appState.diffMode ?? "",
          sort: srt,
          pending: pendList().length,
          allFolded: all2,
          names: files.map((fileChange) => fileChange.filename),
          viewed: viewedCount(files),
          total: files.length,
          onViewedAll: () => viewedAll(files, viewedCount(files) !== files.length),
          on: filesOn
        }
      ),
      files.map((fileChange) => {
        const time = fileChange.additions + fileChange.deletions || 1;
        const first = Math.round(fileChange.additions / time * 5);
        const delta = Math.min(
          5 - first,
          Math.round(fileChange.deletions / time * 5)
        );
        const sq = Array.from(
          { length: 5 },
          (_3, index) => index < first ? "a" : index < first + delta ? "d" : ""
        );
        return /* @__PURE__ */ u3(
          FileBox,
          {
            name: fileChange.filename,
            folded: isFolded(`f:${fileChange.filename}`),
            closed: !!appState.fold[`f:${fileChange.filename}`],
            add: fileChange.additions,
            del: fileChange.deletions,
            sq,
            viewed: isViewed(fileChange),
            onViewed: () => toggleViewed(fileChange),
            on: filesOn,
            children: !shown2(fileChange) ? "" : fileChange.patch ? diffTable(
              fileChange.patch,
              fileChange.filename,
              canComment && b0open(),
              diffOn
            ) : /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Binary file or diff too large to display." })
          }
        );
      })
    ] });
  }
  function commitsView(bundle) {
    const timelineEvents = bundle.timeline.filter(
      (timelineEvent) => timelineEvent.event === "committed"
    );
    return /* @__PURE__ */ u3(
      CommitsList,
      {
        rows: timelineEvents.map((timelineEvent) => /* @__PURE__ */ u3(
          CommitRow,
          {
            first: String(timelineEvent.message || "").split("\n")[0],
            sha: timelineEvent.sha,
            author: timelineEvent.author?.avatar_url ? timelineEvent.author : null,
            url: timelineEvent.html_url,
            verification: timelineEvent.verification
          }
        ))
      }
    );
  }
  function commitList(bundle) {
    if (bundle.commits && bundle.commits.length) {
      return bundle.commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.author,
        name: commit.commit.author?.name,
        date: commit.commit.author?.date,
        url: commit.html_url,
        parent: commit.parents?.[0]?.sha
      }));
    }
    return bundle.timeline.filter((timelineEvent) => timelineEvent.event === "committed").map((timelineEvent) => ({
      sha: timelineEvent.sha,
      message: timelineEvent.message,
      author: timelineEvent.author?.avatar_url ? timelineEvent.author : null,
      name: timelineEvent.author?.name,
      date: timelineEvent.author?.date,
      url: timelineEvent.html_url
    }));
  }
  appState.flip = localStorage.getItem("flip") === "1";
  function flipSides() {
    appState.flip = !appState.flip;
    localStorage.setItem("flip", appState.flip ? "1" : "0");
    rerender();
  }
  var hideSide = (key2, flag) => {
    appState.hide[key2] = flag;
    localStorage.setItem("hide", JSON.stringify(appState.hide));
    rerender();
  };
  function gutterDrag(event) {
    event.preventDefault();
    const rect = queryElement(".split").getBoundingClientRect();
    const mv = (ev) => {
      appState.lw = Math.max(
        25,
        Math.min(
          75,
          (appState.flip ? rect.right - ev.clientX : ev.clientX - rect.left) / rect.width * 100
        )
      );
      repaintShell({ lw: appState.lw });
    };
    const up = () => {
      setDragging(false);
      localStorage.setItem("lw", String(Math.round(appState.lw)));
    };
    setDragging(true);
    beginDrag({ move: mv, end: up });
  }
  var splitOn = {
    hide: hideSide,
    flip: flipSides,
    pick: (sha) => {
      selectCommit(sha);
    },
    gutter: gutterDrag,
    fold: (event, key2, def) => convOn.fold(event, key2, def),
    scroll: (id, event) => scrolled(id, event.currentTarget)
  };
  function splitView(bundle) {
    const cs = commitList(bundle);
    const sha = appState.sel;
    const cnt = (color) => bundle.review_comments.filter(
      (reviewComment) => reviewComment.original_commit_id === color || reviewComment.commit_id === color
    ).length;
    let diff;
    if (!sha) {
      diff = filesList(bundle.files, true);
    } else {
      const value = appState.cdiff[sha];
      diff = value === void 0 || value === "loading" ? /* @__PURE__ */ u3("div", { class: "diff-empty", children: "Loading commit\u2026" }) : typeof value === "string" ? /* @__PURE__ */ u3("div", { class: "diff-empty err", children: value }) : filesList(value);
    }
    return /* @__PURE__ */ u3(
      SplitView,
      {
        hl: !!appState.hide.l,
        hr: !!appState.hide.r,
        flip: !!appState.flip,
        lw: appState.lw,
        allOn: !sha,
        allSub: `${bundle.pull.changed_files} files \xB7 +${bundle.pull.additions} \u2212${bundle.pull.deletions}`,
        rows: cs.map((commitRow) => ({
          sha: commitRow.sha,
          on: sha === commitRow.sha,
          author: commitRow.author,
          initial: (commitRow.name || "?")[0],
          title: String(commitRow.message).split("\n")[0],
          sub: `${commitRow.name || commitRow.author?.login || ""} \xB7 ${when(commitRow.date).replace(/<\/?span[^>]*>/g, "")}`,
          n: cnt(commitRow.sha)
        })),
        count: cs.length,
        subTitle: sha ? `Commit ${sha.slice(0, 7)}` : "All changes",
        foldList: isFolded("cm-list"),
        foldDiff: isFolded("cm-diff"),
        diff,
        right: /* @__PURE__ */ u3(S, { children: [
          /* @__PURE__ */ u3(Attention, { ...attentionProps(bundle), on: attOn }),
          /* @__PURE__ */ u3(Timeline, { m: timelineModel(bundle), on: tlOn })
        ] }),
        on: splitOn
      }
    );
  }
  async function selectCommit(sha) {
    appState.sel = sha || null;
    render();
    if (!sha || appState.cdiff[sha] !== void 0) {
      return;
    }
    appState.cdiff[sha] = "loading";
    try {
      if (!tauri) {
        throw new Error("Per-commit diffs are available in the desktop app.");
      }
      appState.cdiff[sha] = (await tauri.invoke("fetch_commit", {
        repo: appState.bundle.pull.base.repo.full_name,
        sha
      })).files || [];
    } catch (error) {
      appState.cdiff[sha] = String(error).replace(/^Error: /, "");
    }
    if (appState.sel === sha) {
      render();
    }
  }

  // src/app/diff.tsx
  appState.diffMode = localStorage.getItem("diffmode") || "unified";
  appState.pending = load("pending", {});
  var pendKey = () => appState.bundle ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "";
  var pendList = () => appState.pending[pendKey()] || [];
  var savePending = () => localStorage.setItem("pending", JSON.stringify(appState.pending));
  function parsePatch(patch) {
    const rows = [];
    let offset = 0;
    let count = 0;
    for (const line of patch.split("\n")) {
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);
        if (match) {
          offset = +match[1];
          count = +match[2];
        }
        rows.push({ t: "hunk", text: line });
        continue;
      }
      const color = line[0];
      const txt = line.slice(1);
      if (color === "+") {
        rows.push({ t: "add", n: count++, text: txt });
      } else if (color === "-") {
        rows.push({ t: "del", o: offset++, text: txt });
      } else if (color === "\\") {
        rows.push({ t: "note", text: line });
      } else {
        rows.push({ t: "ctx", o: offset++, n: count++, text: txt });
      }
    }
    return rows;
  }
  var codeHtml = (text, path) => (window.hlLine && window.hlLine(text, path)) ?? esc(text);
  var lineKey = (path, line, side) => `${path}${side}${line}`;
  var lcBody = (md) => String(md).split(/```/).map(
    (path, index) => index % 2 ? (() => {
      const match = path.match(/^(\w*)\n?([\s\S]*)$/);
      return `<pre class="lc-code${match[1] === "suggestion" ? " sug" : ""}">${match[1] === "suggestion" ? "<b>Suggested change</b>\n" : ""}${esc(match[2].replace(/\n$/, ""))}</pre>`;
    })() : esc(path).replace(/\n/g, "<br>")
  ).join("");
  function threadsFor(path) {
    return (appState.bundle?.review_comments || []).filter(
      (reviewComment) => reviewComment.path === path
    );
  }
  function lineThreads(path, line, side, cols, on3) {
    const all2 = threadsFor(path);
    if (!all2.length) {
      return [];
    }
    const roots = all2.filter(
      (reviewComment) => !reviewComment.in_reply_to_id && (reviewComment.line ?? reviewComment.original_line) === line && (reviewComment.side || "RIGHT") === side
    );
    if (!roots.length) {
      return [];
    }
    const res = new Set(appState.bundle.resolved_ids || []);
    const bundle = appState.bundle;
    const card = (reviewComment, rootId) => ({
      user: reviewComment.user,
      login: reviewComment.user?.login || "ghost",
      at: reviewComment.created_at,
      id: reviewComment.id,
      root: rootId,
      withMenu: !!appState.hasToken,
      bodyHtml: reviewComment.body_html || esc(reviewComment.body || ""),
      reactions: reactionProps(
        reviewComment.reactions,
        "review_comment",
        reviewComment.id
      ),
      sug: null,
      anchorId: false
    });
    return roots.map((reviewComment) => {
      const isRes = res.has(reviewComment.id);
      const tid = (bundle.thread_ids || {})[reviewComment.id];
      const list = [
        reviewComment,
        ...all2.filter(
          (otherReviewComment) => otherReviewComment.in_reply_to_id === reviewComment.id
        )
      ];
      const props = {
        cols,
        k: `t:${reviewComment.id}`,
        def: isRes,
        folded: isFolded(`t:${reviewComment.id}`, isRes),
        side: side === "LEFT" ? "L" : "R",
        line,
        outdated: reviewComment.line == null,
        resolved: isRes,
        cards: list.map(
          (otherReviewComment) => card(otherReviewComment, reviewComment.id)
        ),
        reply: appState.hasToken ? {
          rid: reviewComment.id,
          ph: "Write a reply",
          err: errMsg(`reply-${reviewComment.id}`)
        } : null,
        act: tid && appState.hasToken ? { tid, res: isRes } : null
      };
      return /* @__PURE__ */ u3(ThreadRow, { ...props, on: on3.conv });
    });
  }
  function lineExtras(path, line, side, cols, canComment, on3, text) {
    const key2 = lineKey(path, line, side);
    const th = lineThreads(path, line, side, cols, on3);
    const mine = pendList().filter(
      (pendingComment) => pendingComment.path === path && pendingComment.line === line && pendingComment.side === side
    );
    const open2 = canComment && appState.lcOpen === key2;
    if (!mine.length && !open2) {
      return th;
    }
    return [
      ...th,
      /* @__PURE__ */ u3("tr", { class: "lc-row", children: /* @__PURE__ */ u3("td", { colspan: cols, children: /* @__PURE__ */ u3("div", { class: "lc", children: [
        mine.length ? /* @__PURE__ */ u3(
          LcCards,
          {
            cards: mine.map((pendingComment) => ({
              id: pendingComment.id,
              body: lcBody(pendingComment.body)
            })),
            on: on3.lc
          }
        ) : "",
        open2 ? /* @__PURE__ */ u3(
          LcEdit,
          {
            code: side === "RIGHT" && text !== void 0 ? text : null,
            on: on3.lc
          }
        ) : ""
      ] }) }) })
    ];
  }
  var diffCache = /* @__PURE__ */ new Map();
  function diffTable(patch, path, canComment, on3) {
    const open2 = appState.lcOpen && String(appState.lcOpen).includes(path);
    if (open2) {
      return diffTableBuild(patch, path, canComment, on3);
    }
    const key2 = `${(appState.busySels || []).join(",")}|${appState.flash?.id}${appState.flash?.n}|${window.hlLine ? 1 : 0}|${appState.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((pendingComment) => pendingComment.path === path))}|${threadsFor(
      path
    ).map(
      (reviewComment) => `${reviewComment.id}:${reviewComment.updated_at || ""}${JSON.stringify(reviewComment.reactions || {})}${(appState.bundle.resolved_ids || []).includes(reviewComment.id) ? "r" : ""}${isFolded(
        `t:${reviewComment.id}`,
        (appState.bundle.resolved_ids || []).includes(reviewComment.id)
      ) ? "f" : ""}`
    ).join(
      ","
    )}|${appState.hasToken ? 1 : 0}|${appState.actErr && String(appState.actErr.k).startsWith("reply-") ? appState.actErr.k + appState.actErr.m : ""}`;
    const hit = diffCache.get(key2);
    if (hit && hit.patch === patch) {
      return hit.node;
    }
    const node = diffTableBuild(patch, path, canComment, on3);
    diffCache.set(key2, { patch, node });
    if (diffCache.size > 400) {
      diffCache.delete(diffCache.keys().next().value);
    }
    return node;
  }
  var Code = ({
    text,
    path,
    cls = "",
    marker
  }) => /* @__PURE__ */ u3(
    "td",
    {
      class: `code${cls}`,
      "data-marker": marker,
      dangerouslySetInnerHTML: { __html: codeHtml(text, path) }
    }
  );
  function diffTableBuild(patch, path, canComment, on3) {
    const rows = parsePatch(patch);
    const plus = (line, side) => canComment ? /* @__PURE__ */ u3(
      "button",
      {
        class: "lc-plus",
        "data-lc": lineKey(path, line, side),
        title: "Add a comment on this line",
        onClick: on3.plus,
        children: "+"
      }
    ) : null;
    const out = [];
    if (appState.diffMode === "split") {
      let index = 0;
      while (index < rows.length) {
        const value = rows[index];
        if (value.t === "hunk") {
          out.push(
            /* @__PURE__ */ u3("tr", { class: "hunk", children: [
              /* @__PURE__ */ u3("td", { class: "num" }),
              /* @__PURE__ */ u3("td", { class: "code", colspan: 3, children: value.text })
            ] })
          );
          index++;
          continue;
        }
        if (value.t === "note") {
          index++;
          continue;
        }
        if (value.t === "ctx") {
          out.push(
            /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("td", { class: "num", children: value.o }),
              /* @__PURE__ */ u3(Code, { text: value.text, path, marker: " " }),
              /* @__PURE__ */ u3("td", { class: "num", children: [
                value.n,
                plus(value.n, "RIGHT")
              ] }),
              /* @__PURE__ */ u3(Code, { text: value.text, path, marker: " " })
            ] }),
            ...lineExtras(path, value.n, "RIGHT", 4, canComment, on3, value.text)
          );
          index++;
          continue;
        }
        const dels = [];
        const adds = [];
        while (rows[index] && rows[index].t === "del") {
          dels.push(rows[index++]);
        }
        while (rows[index] && rows[index].t === "add") {
          adds.push(rows[index++]);
        }
        for (let otherIndex = 0; otherIndex < Math.max(dels.length, adds.length); otherIndex++) {
          const otherValue = dels[otherIndex];
          const innerValue = adds[otherIndex];
          out.push(
            /* @__PURE__ */ u3("tr", { children: [
              /* @__PURE__ */ u3("td", { class: `num${otherValue ? " del" : " empty"}`, children: otherValue ? /* @__PURE__ */ u3(S, { children: [
                otherValue.o,
                plus(otherValue.o, "LEFT")
              ] }) : "" }),
              otherValue ? /* @__PURE__ */ u3(Code, { text: otherValue.text, path, cls: " del", marker: "-" }) : /* @__PURE__ */ u3("td", { class: "code empty" }),
              /* @__PURE__ */ u3("td", { class: `num${innerValue ? " add" : " empty"}`, children: innerValue ? /* @__PURE__ */ u3(S, { children: [
                innerValue.n,
                plus(innerValue.n, "RIGHT")
              ] }) : "" }),
              innerValue ? /* @__PURE__ */ u3(Code, { text: innerValue.text, path, cls: " add", marker: "+" }) : /* @__PURE__ */ u3("td", { class: "code empty" })
            ] }),
            ...otherValue ? lineExtras(path, otherValue.o, "LEFT", 4, canComment, on3) : [],
            ...innerValue ? lineExtras(
              path,
              innerValue.n,
              "RIGHT",
              4,
              canComment,
              on3,
              innerValue.text
            ) : []
          );
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
    for (const value of rows) {
      if (value.t === "hunk") {
        out.push(
          /* @__PURE__ */ u3("tr", { class: "hunk", children: [
            /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
            /* @__PURE__ */ u3("td", { class: "num", children: "\u2026" }),
            /* @__PURE__ */ u3("td", { class: "code", children: value.text })
          ] })
        );
      } else if (value.t === "note") {
        out.push(
          /* @__PURE__ */ u3("tr", { children: [
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "code", style: "color:var(--fgColor-muted)", children: value.text })
          ] })
        );
      } else if (value.t === "add") {
        out.push(
          /* @__PURE__ */ u3("tr", { class: "add", children: [
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3("td", { class: "num", children: [
              value.n,
              plus(value.n, "RIGHT")
            ] }),
            /* @__PURE__ */ u3(Code, { text: value.text, path, marker: "+" })
          ] }),
          ...lineExtras(path, value.n, "RIGHT", 3, canComment, on3, value.text)
        );
      } else if (value.t === "del") {
        out.push(
          /* @__PURE__ */ u3("tr", { class: "del", children: [
            /* @__PURE__ */ u3("td", { class: "num", children: [
              value.o,
              plus(value.o, "LEFT")
            ] }),
            /* @__PURE__ */ u3("td", { class: "num" }),
            /* @__PURE__ */ u3(Code, { text: value.text, path, marker: "-" })
          ] }),
          ...lineExtras(path, value.o, "LEFT", 3, canComment, on3)
        );
      } else {
        out.push(
          /* @__PURE__ */ u3("tr", { children: [
            /* @__PURE__ */ u3("td", { class: "num", children: value.o }),
            /* @__PURE__ */ u3("td", { class: "num", children: [
              value.n,
              plus(value.n, "RIGHT")
            ] }),
            /* @__PURE__ */ u3(Code, { text: value.text, path, marker: " " })
          ] }),
          ...lineExtras(path, value.n, "RIGHT", 3, canComment, on3, value.text)
        );
      }
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
  var sugOf = (item) => {
    const match = (item.body || "").match(
      /```suggestion[^\n]*\n([\s\S]*?)\n?```/
    );
    return match ? match[1] : null;
  };
  function suggestProps(reviewComment, bundle, list) {
    const text = sugOf(reviewComment);
    if (text !== null && appState.applied?.has(String(reviewComment.id))) {
      return { kind: "note", text: "Applying suggestion\u2026" };
    }
    if (text === null || !b0open() || list.some(
      (otherReviewComment) => (bundle.resolved_ids || []).includes(otherReviewComment.id)
    )) {
      return null;
    }
    const pull = bundle.pull;
    const mine = pull.head.repo && !pull.head.repo.fork || pull.head.repo && pull.head.repo.full_name === pull.base.repo.full_name;
    if (!reviewComment.line) {
      return {
        kind: "note",
        text: "Outdated suggestion \u2014 the lines have changed."
      };
    }
    return {
      kind: "btn",
      id: reviewComment.id,
      disabled: !pull.head.repo,
      ref: pull.head.ref,
      mine: !!mine
    };
  }
  function reviewBlockProps(timelineEvent, bundle) {
    const resolved = new Set(bundle.resolved_ids || []);
    const isRes = (list) => list.some((reviewComment) => resolved.has(reviewComment.id));
    const stateMap = {
      approved: ["check", "success", "approved these changes"],
      changes_requested: ["file-diff", "danger", "requested changes"],
      commented: ["eye", "", "reviewed"],
      dismissed: ["x", "", "dismissed a review"]
    };
    const [ic, kind, verb] = stateMap[timelineEvent.state.toLowerCase()] || [
      "eye",
      "",
      "reviewed"
    ];
    const mine = bundle.review_comments.filter(
      (reviewComment) => reviewComment.pull_request_review_id === timelineEvent.id
    );
    const mineIds = new Set(mine.map((reviewComment) => reviewComment.id));
    const cs = [
      ...mine,
      ...bundle.review_comments.filter(
        (reviewComment) => reviewComment.pull_request_review_id !== timelineEvent.id && mineIds.has(reviewComment.in_reply_to_id)
      )
    ].filter(
      (reviewComment) => !appState.who.length || appState.who.includes(timelineEvent.user?.login ?? "") || appState.who.includes(reviewComment.user?.login)
    );
    const hasBody = timelineEvent.body_html && timelineEvent.body_html.trim();
    const byPath = {};
    cs.forEach(
      (reviewComment) => (byPath[`${reviewComment.path}\0${reviewComment.original_position ?? reviewComment.position}`] ||= []).push(reviewComment)
    );
    const all2 = Object.values(byPath).map(
      (reviewComments) => reviewComments.sort(
        (leftReviewComment, rightReviewComment) => (leftReviewComment.in_reply_to_id ? 1 : 0) - (rightReviewComment.in_reply_to_id ? 1 : 0) || leftReviewComment.id - rightReviewComment.id
      )
    );
    const allRes = all2.length > 0 && all2.every(isRes);
    const nres = all2.filter(isRes).length;
    const rk = `r:${timelineEvent.id}`;
    const lists = appState.unres ? all2.filter((reviewComments) => !isRes(reviewComments)) : all2;
    if (appState.unres && !lists.length) {
      return null;
    }
    const threads = lists.map((list) => ({
      folded: isFolded(`t:${list[0].id}`, isRes(list)),
      k: `t:${list[0].id}`,
      def: isRes(list),
      path: list[0].path,
      resolved: isRes(list),
      tid: (bundle.thread_ids || {})[list[0].id] ? bundle.thread_ids[list[0].id] : null,
      hunk: hunkRows(list[0].diff_hunk || ""),
      cards: list.map((reviewComment) => ({
        user: reviewComment.user,
        login: reviewComment.user.login,
        at: reviewComment.created_at,
        id: reviewComment.id,
        root: list[0].id,
        withMenu: true,
        bodyHtml: reviewComment.body_html || "",
        reactions: reactionProps(
          reviewComment.reactions,
          "review_comment",
          reviewComment.id
        ),
        sug: suggestProps(reviewComment, bundle, list),
        anchorId: true,
        kb: appState.kbId === `c-${reviewComment.id}`,
        flash: flashFor(`c-${reviewComment.id}`)
      })),
      reply: {
        rid: list[0].id,
        ph: "Reply\u2026",
        err: errMsg(`reply-${list[0].id}`)
      }
    }));
    const sum = all2.length ? {
      ok: allRes,
      allRes,
      text: `${all2.length} thread${all2.length === 1 ? "" : "s"}${nres ? ` \xB7 ${nres} resolved` : ""}`
    } : null;
    return {
      folded: isFolded(rk, allRes),
      k: rk,
      kind,
      ic,
      user: timelineEvent.user,
      verb,
      url: timelineEvent.html_url ?? "",
      at: whenParts(timelineEvent.submitted_at).text,
      sum,
      bodyHtml: hasBody ? timelineEvent.body_html : "",
      threads,
      allRes
    };
  }

  // src/app/repopick.ts
  function repoPickOpen() {
    appState.rpick = {
      all: null,
      on: (appState.repoSel || []).map((repoSummary) => repoSummary.full_name),
      q: "",
      err: ""
    };
    appState.dlg = { k: "repos" };
    render();
    tauri?.invoke("list_repos").then((repoSummarys) => {
      if (appState.rpick) {
        appState.rpick.all = repoSummarys.filter(
          (repoSummary) => !repoSummary.archived
        );
        paintDlg();
      }
    }).catch((value) => {
      if (appState.rpick) {
        appState.rpick.err = String(value).replace(/^Error: /, "");
        appState.rpick.all = [];
        paintDlg();
      }
    });
  }
  function repoPickSave() {
    const props = appState.rpick;
    if (!props?.all) {
      return;
    }
    const keep5 = new Set(props.on);
    const chosen = [...props.all, ...appState.repoSel || []].filter(
      (repoSummary, index, repoSummarys) => keep5.has(repoSummary.full_name) && repoSummarys.findIndex(
        (otherRepoSummary) => otherRepoSummary.full_name === repoSummary.full_name
      ) === index
    );
    appState.repoSel = chosen.length && chosen.length < props.all.length ? chosen : null;
    try {
      if (appState.repoSel) {
        localStorage.setItem("repoSel", JSON.stringify(appState.repoSel));
      } else {
        localStorage.removeItem("repoSel");
      }
    } catch {
    }
    appState.rpick = null;
    appState.dlg = null;
    appState.repo = null;
    appState.sideTab = "repos";
    appState.inbox = null;
    appState.repos = appState.repoSel;
    if (!appState.repoSel) {
      loadRepos();
    } else {
      render();
    }
    if (appState.view === "inbox") {
      loadInbox(true);
    }
  }

  // src/app/dialogs.tsx
  var paintDlg = () => setSlot("dlg", /* @__PURE__ */ u3(Dialogs, {}));
  var cpOn = {
    close: () => closeDlg(),
    all: () => setFr(null),
    since: () => {
      const sr = sinceReview(appState.bundle);
      if (sr?.n) {
        setFr({ a: sr.at + 1, b: commitList(appState.bundle).length - 1 });
      }
    },
    save: () => {
      if (appState.cpick) {
        setFr({ ...appState.cpick });
      }
    },
    filter: (event) => {
      appState.cfilter = event.target.value;
      paintDlg();
    },
    pick: (event, index) => {
      event.preventDefault();
      const frRange = appState.cpick;
      appState.cpick = !frRange || frRange.a !== frRange.b ? { a: index, b: index } : { a: Math.min(frRange.a, index), b: Math.max(frRange.b, index) };
      paintDlg();
    }
  };
  function Dialogs() {
    const dlg = appState.dlg;
    if (!dlg) {
      return null;
    }
    const close = () => closeDlg();
    const ok = () => {
      if (dlg.k !== "commits" && dlg.k !== "token" && dlg.k !== "repos" && dlg.k !== "meta") {
        dlg.ok();
      }
    };
    switch (dlg.k) {
      case "commits":
        return /* @__PURE__ */ u3(CommitsDialog, { ...commitsDialogProps(), on: cpOn });
      case "token":
        return /* @__PURE__ */ u3(
          TokenDialog,
          {
            text: appState.tokenText || "",
            input: (event) => {
              appState.tokenText = event.currentTarget.value;
            },
            code: appState.oauth?.code || "",
            err: appState.oauth?.err || "",
            go: oauthGo,
            close,
            save: tokenSave
          }
        );
      case "repos": {
        const rp = appState.rpick;
        return /* @__PURE__ */ u3(
          RepoPickDialog,
          {
            repos: rp.all,
            on: new Set(rp.on),
            q: rp.q,
            err: rp.err,
            close,
            save: repoPickSave,
            toggle: (name) => {
              rp.on = rp.on.includes(name) ? rp.on.filter((text) => text !== name) : [...rp.on, name];
              paintDlg();
            },
            all: (on3) => {
              const query = rp.q.toLowerCase();
              const vis = (rp.all || []).map((repoSummary) => repoSummary.full_name).filter((name) => name.toLowerCase().includes(query));
              rp.on = on3 ? [.../* @__PURE__ */ new Set([...rp.on, ...vis])] : rp.on.filter((name) => !vis.includes(name));
              paintDlg();
            },
            input: (event) => {
              rp.q = event.currentTarget.value;
              paintDlg();
            }
          }
        );
      }
      case "meta": {
        const meta = appState.meta;
        return /* @__PURE__ */ u3(
          MetaDialog,
          {
            field: meta.field,
            items: meta.items,
            on: meta.on,
            q: meta.q,
            err: meta.err,
            busy: meta.busy,
            close,
            save: metaSave,
            pick: (id) => {
              meta.on = meta.field === "milestone" ? id ? [id] : [] : meta.on.includes(id) ? meta.on.filter((text) => text !== id) : [...meta.on, id];
              paintDlg();
            },
            input: (event) => {
              meta.q = event.currentTarget.value;
              paintDlg();
            }
          }
        );
      }
      case "review": {
        const count = pendList().length;
        return /* @__PURE__ */ u3(
          ReviewDialog,
          {
            ph: count ? `Leave a review comment (${count} line comment${count === 1 ? "" : "s"} will be included)` : "Leave a review comment (required unless approving)",
            ev: dlg.ev,
            own: isOwnPr(),
            onEv: (value) => {
              dlg.ev = value;
              paintDlg();
            },
            err: errMsg("review"),
            close,
            ok
          }
        );
      }
      case "editpr":
        return /* @__PURE__ */ u3(
          EditPrDialog,
          {
            title: dlg.title,
            onTitle: (value) => {
              dlg.title = value;
            },
            err: errMsg("editpr"),
            close,
            ok
          }
        );
      case "confirm":
        return /* @__PURE__ */ u3(
          ConfirmDialog,
          {
            title: dlg.title,
            text: dlg.text,
            label: dlg.label,
            danger: dlg.danger,
            close,
            ok
          }
        );
      case "editc":
        return /* @__PURE__ */ u3(EditCommentDialog, { err: errMsg("editc"), close, ok });
      case "delc":
        return /* @__PURE__ */ u3(DeleteCommentDialog, { err: errMsg("delc"), close, ok });
      case "hidec":
        return /* @__PURE__ */ u3(
          HideCommentDialog,
          {
            reasons: dlg.reasons,
            reason: appState.hideReason || "OUTDATED",
            pick: (event) => {
              appState.hideReason = event.currentTarget.value;
              paintDlg();
            },
            err: errMsg("hidec"),
            close,
            ok
          }
        );
      default:
        return null;
    }
  }
  function Pops() {
    const pop = appState.pop;
    if (!pop) {
      return null;
    }
    if (pop.k === "cm") {
      return /* @__PURE__ */ u3(CmPop, { ...pop });
    }
    if (pop.k === "ctx") {
      return /* @__PURE__ */ u3(CtxPop, { ...pop });
    }
    if (pop.k === "prof") {
      return /* @__PURE__ */ u3(ProfPop, { ...pop });
    }
    return /* @__PURE__ */ u3(
      ReactPop,
      {
        x: pop.x,
        y: pop.y,
        reacts: REACTS,
        pick: pop.pick
      }
    );
  }
  var paintPop = () => setSlot("pop", /* @__PURE__ */ u3(Pops, {}));
  function openPop(nonNullable) {
    appState.pop = nonNullable;
    paintPop();
  }
  function closePop() {
    if (!appState.pop) {
      return;
    }
    appState.pop = null;
    paintPop();
  }
  var downOn = null;
  document.addEventListener(
    "mousedown",
    (event) => {
      downOn = event.target;
    },
    true
  );
  document.addEventListener(
    "click",
    (event) => {
      const element = event.target;
      if (appState.dlg && element === downOn && element.id === "dlgbg") {
        closeDlg();
      }
    },
    true
  );

  // src/app/bind.ts
  appState.alive = /* @__PURE__ */ new Map();
  var aliveKey = () => [
    appState.diffMode,
    appState.split,
    JSON.stringify(appState.hide),
    appState.sbw
  ].join("|");
  function stashCurrent() {
    appState.openSeq = (appState.openSeq || 0) + 1;
    const ref = appState.view === "pr" && appState.bundle ? curRef() : "";
    const element = queryElement(".main");
    const sh = shownPage();
    if (!ref || !element || !sh || sh.ref !== ref || !appState.tabs.some((tab) => tab.ref === ref)) {
      return;
    }
    appState.alive.set(ref, {
      vnode: sh.vnode,
      bundle: appState.bundle,
      tab: appState.tab,
      key: aliveKey(),
      scroll: appState.mainTop || 0
    });
    while (appState.alive.size > 6) {
      const old = appState.alive.keys().next().value;
      appState.alive.delete(old);
    }
  }
  function fastTab(ref) {
    appState.openSeq = (appState.openSeq || 0) + 1;
    const alive = appState.alive.get(ref);
    if (!alive) {
      return false;
    }
    const mem2 = qc.peek(ref);
    if (!mem2 || mem2.data !== alive.bundle || alive.key !== aliveKey()) {
      appState.alive.delete(ref);
      return false;
    }
    tabSnap();
    stashCurrent();
    appState.alive.delete(ref);
    const pull = alive.bundle.pull;
    appState.view = "pr";
    appState.bundle = alive.bundle;
    appState.tab = alive.tab;
    appState.sel = null;
    appState.fr = null;
    appState.error = "";
    appState.loading = false;
    appState.refreshing = false;
    appState.tabPending = "";
    appState.tabMenu = false;
    localStorage.setItem("last", ref);
    const ti = appState.tabs.find((tab) => tab.ref === ref);
    if (ti) {
      ti.dot = false;
      saveTabs();
    }
    if (appState.repo !== pull.base.repo.full_name) {
      appState.repo = pull.base.repo.full_name;
      appState.sideTab = "prs";
      setTimeout(loadPrs, 0);
    }
    if (appState.draftRef !== ref) {
      saveDrafts();
      appState.draftRef = ref;
      appState.draft = { ...drafts[ref] || {} };
    }
    appState.stash = alive;
    render();
    scrollMain(alive.scroll);
    if (!qc.fresh(ref)) {
      qc.fetch(ref, () => loadPr(ref)).then((bundle) => {
        if (JSON.stringify(bundle) === JSON.stringify(alive.bundle)) {
          qc.m.set(ref, { data: alive.bundle, at: Date.now() });
          return;
        }
        if (curRef() === ref) {
          openPr(ref, { keepTab: true, nav: true });
        }
      }).catch(() => {
      });
    }
    return true;
  }
  function openClick(el, event) {
    if (event.target.closest(
      "[data-rm], .np-act, .np-dot"
    )) {
      return;
    }
    appState.nav = false;
    appState.focus = el.dataset.target || "";
    const nn = el.dataset.note && appState.notes.find((note) => String(note.id) === el.dataset.note);
    if (nn) {
      nn.read = true;
      saveNotes();
    }
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      openFromList(el.dataset.open, true);
    } else {
      openFromList(el.dataset.open, false);
    }
  }
  function openAux(el, event) {
    if (event.button === 1) {
      event.preventDefault();
      openFromList(el.dataset.open, true);
    }
  }
  function openCtx(el, event) {
    event.preventDefault();
    event.stopPropagation();
    const ref = el.dataset.open;
    openPop({
      k: "ctx",
      x: Math.min(event.clientX, innerWidth - 180),
      y: Math.min(event.clientY, innerHeight - 120),
      pick: (hash) => {
        closePop();
        if (hash === "new") {
          openFromList(ref, true);
        } else if (hash === "here") {
          openFromList(ref, false);
        } else {
          const match = ref.match(/^(.+)#(\d+)$/);
          navigator.clipboard?.writeText(
            match ? `https://github.com/${match[1]}/pull/${match[2]}` : ref
          ).catch(() => {
          });
        }
      }
    });
  }
  function rmRecent(event, ref) {
    event.stopPropagation();
    appState.recent = appState.recent.filter(
      (recentEntry) => recentEntry.ref !== ref
    );
    localStorage.setItem(KEY_RECENT, JSON.stringify(appState.recent));
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  }
  function foldAllConv(keys) {
    if (!keys.length) {
      return;
    }
    const now = keys.some((foldKey) => !isFolded(foldKey.k, foldKey.def));
    keys.forEach((foldKey) => {
      appState.fold[foldKey.k] = now;
    });
    try {
      localStorage.setItem("fold", JSON.stringify(appState.fold));
    } catch {
    }
    rerender();
  }

  // src/app/tabs.ts
  var KEY_TABS = "tabs";
  {
    const item = load(KEY_TABS, {});
    appState.tabs = Array.isArray(item.list) ? item.list : [];
    appState.closed = [];
    appState.tabMenu = false;
  }
  var curRef = () => appState.view === "pr" && appState.bundle ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "";
  var saveTabs = () => {
    try {
      localStorage.setItem(
        KEY_TABS,
        JSON.stringify({
          list: appState.tabs.map(
            ({ ref, title, state, icon: icon2, tab, dot, scroll }) => ({
              ref,
              title,
              state,
              icon: icon2,
              tab,
              dot,
              scroll
            })
          )
        })
      );
    } catch {
    }
  };
  var tabIdx = () => appState.tabs.findIndex((tab) => tab.ref === curRef());
  function tabSnap() {
    const tab = appState.tabs[tabIdx()];
    if (tab) {
      tab.tab = appState.tab;
      tab.scroll = appState.mainTop || 0;
    }
  }
  function tabPut(ref, pull, opts = {}) {
    const [state, ic] = stateOf(pull);
    const item = {
      ref,
      title: pull.title,
      state,
      icon: ic,
      tab: appState.tab,
      dot: false
    };
    const have = appState.tabs.findIndex((tab) => tab.ref === ref);
    if (have >= 0) {
      Object.assign(appState.tabs[have], item, { tab: appState.tabs[have].tab });
    } else if (opts.at !== void 0 && opts.at >= 0 && !opts.newTab) {
      appState.tabs[opts.at] = item;
    } else {
      appState.tabs.splice(
        opts.at !== void 0 && opts.at >= 0 ? opts.at + 1 : appState.tabs.length,
        0,
        item
      );
    }
    appState.tabs = appState.tabs.slice(-15);
    saveTabs();
  }
  function openTab2(ref, { newTab = false } = {}) {
    if (!newTab && ref !== curRef() && fastTab(ref)) {
      return;
    }
    stashCurrent();
    tabSnap();
    appState.fadeMain = true;
    appState.tabMenu = false;
    return openPr(ref, {
      newTab,
      restore: newTab ? "" : appState.tabs.find((tab) => tab.ref === ref)?.tab
    });
  }
  function closeTab(index) {
    const tab = appState.tabs[index];
    if (!tab) {
      return;
    }
    appState.alive.delete(tab.ref);
    const was = tab.ref === curRef();
    appState.closed = [
      { ref: tab.ref, tab: tab.tab },
      ...appState.closed.filter((item) => item.ref !== tab.ref)
    ].slice(0, 10);
    appState.tabs.splice(index, 1);
    saveTabs();
    if (!was) {
      return render();
    }
    const otherTab = appState.tabs[Math.min(index, appState.tabs.length - 1)];
    appState.fadeMain = true;
    if (otherTab) {
      openPr(otherTab.ref, { restore: otherTab.tab, nav: true });
    } else {
      appState.view = "home";
      appState.bundle = null;
      render();
    }
  }
  function reopenTab() {
    const item = appState.closed.shift();
    if (item) {
      tabSnap();
      openPr(item.ref, { newTab: true, restore: item.tab });
    }
  }
  function stepTab(delta) {
    if (appState.tabs.length < 2) {
      return;
    }
    const index = tabIdx();
    const tab = appState.tabs[(index + delta + appState.tabs.length) % appState.tabs.length];
    openTab2(tab.ref);
  }

  // src/app/data.ts
  var snap = (snapSource) => ({
    commits: snapSource.commits,
    comments: snapSource.comments,
    rc: snapSource.review_comments,
    state: snapSource.merged ? "merged" : snapSource.state
  });
  var seen = load("seen", {});
  function noteAdd(ref, title, text, target = "") {
    {
      const tab = appState.tabs.find((otherTab) => otherTab.ref === ref);
      if (tab && ref !== curRef()) {
        tab.dot = true;
        saveTabs();
      }
    }
    appState.notes = [
      {
        id: Date.now() + Math.random(),
        ref,
        title,
        text,
        target,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        read: false
      },
      ...appState.notes
    ].slice(0, 200);
    localStorage.setItem("notes", JSON.stringify(appState.notes));
    if (tauri) {
      tauri.invoke("notify", {
        title: `${ref} \xB7 ${title}`.slice(0, 80),
        body: text,
        prRef: ref,
        target
      }).catch(() => {
      });
    }
  }
  function noteDiff(ref, title, was, now, fresh = []) {
    const out = [];
    const compare = (firstFirst, secondSecond) => secondSecond - firstFirst;
    if (compare(was.commits, now.commits) > 0) {
      out.push(
        `${compare(was.commits, now.commits)} new commit${compare(was.commits, now.commits) > 1 ? "s" : ""}`
      );
    }
    if (compare(was.comments, now.comments) > 0) {
      out.push(
        `${compare(was.comments, now.comments)} new comment${compare(was.comments, now.comments) > 1 ? "s" : ""}`
      );
    }
    if (compare(was.rc, now.rc) > 0) {
      out.push(
        `${compare(was.rc, now.rc)} new review comment${compare(was.rc, now.rc) > 1 ? "s" : ""}`
      );
    }
    if (was.state !== now.state) {
      out.push(`now ${now.state}`);
    }
    const last = fresh.filter((freshItem) => !was.at || freshItem.created_at > was.at).sort(
      (leftFreshItem, rightFreshItem) => leftFreshItem.created_at < rightFreshItem.created_at ? -1 : 1
    ).pop();
    if (last) {
      out.push(`\u201C${last.body.replace(/\s+/g, " ").slice(0, 60)}\u201D \u2014 ${last.user}`);
    }
    if (out.length) {
      noteAdd(ref, title, out.join(", "), last ? String(last.id) : "");
    }
  }
  function remember(ref, value) {
    seen[ref] = {
      ...snap(value),
      at: value.updated_at || (/* @__PURE__ */ new Date()).toISOString()
    };
    localStorage.setItem("seen", JSON.stringify(seen));
  }
  var qc = {
    m: /* @__PURE__ */ new Map(),
    inflight: /* @__PURE__ */ new Map(),
    STALE: 3e4,
    peek(key2) {
      return this.m.get(key2);
    },
    fresh(key2, ms = 3e4) {
      const entry = this.m.get(key2);
      return !!entry && Date.now() - entry.at < ms;
    },
    set(key2, data) {
      this.m.set(key2, { data, at: Date.now() });
    },
    invalidate(key2) {
      const entry = this.m.get(key2);
      if (entry) {
        entry.at = 0;
      }
    },
    fetch(key2, fn) {
      if (this.inflight.has(key2)) {
        return this.inflight.get(key2);
      }
      const promise = fn().then((bundle) => {
        this.set(key2, bundle);
        return bundle;
      }).finally(() => this.inflight.delete(key2));
      this.inflight.set(key2, promise);
      return promise;
    }
  };
  var loadPr = (input) => tauri ? tauri.invoke("fetch_pr", { url: input }) : fetch(new URL(input, location.href)).then((response) => response.json());
  function prefetch(ref) {
    if (tauri && !qc.fresh(ref)) {
      qc.fetch(ref, () => loadPr(ref))?.catch(() => {
      });
    }
  }
  async function pollNotes() {
    if (!tauri || flags.polling) {
      return;
    }
    flags.polling = true;
    const before = appState.notes.length;
    const cur = appState.bundle ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : null;
    if (appState.hasToken && Date.now() - (appState.watchAt || 0) > 24e4) {
      appState.watchAt = Date.now();
      try {
        const inbox2 = await tauri.invoke("inbox", {
          force: false,
          repos: selNames(),
          light: true
        });
        appState.watch = [...inbox2.mine || [], ...inbox2.requested || []].map(
          (inboxItem) => `${inboxItem.repo}#${inboxItem.number}`
        );
      } catch {
      }
    }
    const refs = appState.hasToken ? [
      .../* @__PURE__ */ new Set([
        ...cur ? [cur] : [],
        ...appState.tabs.map((tab) => tab.ref),
        ...appState.recent.slice(0, 8).map((recentEntry) => recentEntry.ref),
        ...appState.watch || []
      ])
    ].slice(0, 40) : cur ? [cur] : [];
    for (const ref of refs) {
      const match = ref.match(/^(.+)#(\d+)$/);
      if (!match) {
        continue;
      }
      try {
        const checkResult = await tauri.invoke("check_pr", {
          repo: match[1],
          number: +match[2],
          since: seen[ref]?.at || null
        });
        const now = snap(checkResult);
        const n0 = appState.notes.length;
        if (seen[ref]) {
          noteDiff(ref, checkResult.title, seen[ref], now, checkResult.fresh);
        }
        if (appState.notes.length !== n0) {
          prefetch(ref);
        }
        remember(ref, checkResult);
        const bp = appState.bundle?.pull;
        if (cur && ref.toLowerCase() === cur.toLowerCase() && appState.view === "pr" && bp && !appState.loading && !appState.refreshing && (checkResult.updated_at && checkResult.updated_at > (bp.updated_at || "") || (checkResult.comments ?? bp.comments) !== bp.comments || (checkResult.review_comments ?? bp.review_comments) !== bp.review_comments) && !document.activeElement?.closest?.(".tt")) {
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
    if (appState.notes.length !== before && !document.activeElement?.closest?.(".tt")) {
      render();
    }
  }
  appState.pushes = {};
  var pushDis = load("pushdismiss", {});
  var ago = (text) => {
    const minutes = Math.max(
      1,
      Math.round((Date.now() - +new Date(text)) / 6e4)
    );
    return minutes < 60 ? `${minutes} minute${minutes === 1 ? "" : "s"} ago` : `${Math.round(minutes / 60)} hour${minutes >= 90 ? "s" : ""} ago`;
  };
  var pushList = (repo) => Object.entries(appState.pushes).filter(([text]) => !repo || text === repo).flatMap(([, pushs]) => pushs).filter(
    (push) => !pushDis[`${push.repo}@${push.branch}@${push.at}`] && Date.now() - +new Date(push.at) < 6 * 36e5
  );
  function pushBannerItems(repo) {
    return pushList(repo).slice(0, 3).map((push) => ({
      repo: push.repo,
      branch: push.branch,
      ago: ago(push.at),
      key: `${push.repo}@${push.branch}@${push.at}`,
      showRepo: !repo
    }));
  }
  async function refreshPushes(repo) {
    if (!tauri || !appState.hasToken || !repo) {
      return;
    }
    try {
      const pushs = await tauri.invoke("recent_pushes", { repo });
      const was = JSON.stringify(appState.pushes[repo] || []);
      appState.pushes[repo] = pushs;
      if (JSON.stringify(pushs) !== was && (appState.view === "repo" || !appState.bundle && appState.view !== "newpr" && appState.view !== "inbox" && appState.view !== "notes") && !document.activeElement?.closest?.(".tt")) {
        rerender();
      }
    } catch {
    }
  }
  var branchSeen = load("branches", {});
  async function pollBranches(refs, cur) {
    if (!appState.hasToken) {
      return;
    }
    const repos = [
      ...new Set(
        [...refs, cur].filter(Boolean).map((text) => text.replace(/#\d+$/, ""))
      )
    ].slice(0, 6);
    for (const repo of repos) {
      try {
        const branchInfo = await tauri.invoke("list_branches", { repo });
        const names = branchInfo.branches || [];
        if (branchSeen[repo]) {
          names.filter(
            (name) => !branchSeen[repo].includes(name) && name !== branchInfo.default
          ).forEach(
            (name) => noteAdd(
              `${repo}@${name}`,
              repo,
              `New branch pushed: ${name} \u2014 click to open a pull request`,
              ""
            )
          );
        }
        refreshPushes(repo);
        branchSeen[repo] = names;
        localStorage.setItem("branches", JSON.stringify(branchSeen));
      } catch {
      }
    }
  }

  // src/components/NotePanel.tsx
  var NotePanel = ({
    open: open2,
    rows,
    on: on3
  }) => /* @__PURE__ */ u3("div", { class: `note-panel${open2 ? " open" : ""}`, children: [
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
    rows.length ? rows.map((noteRow) => /* @__PURE__ */ u3(
      "a",
      {
        class: `note ${noteRow.read ? "" : "new"}`,
        "data-open": noteRow.ref,
        "data-target": noteRow.target,
        onClick: on3.open,
        onAuxClick: on3.aux,
        onContextMenu: on3.ctx,
        children: [
          /* @__PURE__ */ u3("b", { children: noteRow.title }),
          /* @__PURE__ */ u3("span", { children: noteRow.text }),
          /* @__PURE__ */ u3("i", { children: [
            noteRow.ref,
            " \xB7 ",
            noteRow.when
          ] })
        ]
      }
    )) : /* @__PURE__ */ u3("div", { class: "note-empty", children: "No notifications yet. New comments, commits and reviews on PRs you opened will show up here." })
  ] });

  // src/components/TabStrip.tsx
  var tabShift = (item, index) => !item ? void 0 : index === item.from ? `transform:translateX(${item.dx}px)` : item.from < item.to && index > item.from && index <= item.to ? `transform:translateX(-${item.w}px)` : item.from > item.to && index < item.from && index >= item.to ? `transform:translateX(${item.w}px)` : void 0;
  function TabStrip({
    tabs,
    cur,
    recents,
    menu,
    menuAt,
    drag: drag2,
    closedFirst,
    on: on3
  }) {
    return /* @__PURE__ */ u3("div", { class: "ptabs", children: [
      tabs.map((tab, index) => /* @__PURE__ */ u3(
        "div",
        {
          class: `ptab ${tab.ref === cur ? "on" : ""}${drag2 && drag2.from === index ? " drag" : ""}`,
          style: tabShift(drag2, index),
          "data-tab": index,
          onClick: (event) => {
            if (event.target.closest(".pt-x")) {
              return;
            }
            on3.open(index);
          },
          onAuxClick: (event) => on3.aux(event, index),
          onMouseDown: (event) => on3.down(event, index),
          title: `${tab.ref} \xB7 ${tab.title}`,
          children: [
            /* @__PURE__ */ u3("span", { class: `rc-i ${tab.state}`, children: /* @__PURE__ */ u3(Icon, { n: tab.icon }) }),
            /* @__PURE__ */ u3("span", { class: "pt-t", children: [
              /* @__PURE__ */ u3("i", { children: tab.ref.split("/").pop() }),
              " ",
              tab.title
            ] }),
            tab.dot && /* @__PURE__ */ u3("span", { class: "pt-dot" }),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "pt-x",
                "data-tabx": index,
                onClick: (event) => on3.close(event, index),
                "aria-label": "Close tab",
                children: /* @__PURE__ */ u3(Icon, { n: "x" })
              }
            )
          ]
        }
      )),
      /* @__PURE__ */ u3(
        "button",
        {
          class: "pt-add",
          id: "tabadd",
          onClick: on3.add,
          title: "New tab (\u2318T)",
          "aria-label": "New tab",
          children: [
            /* @__PURE__ */ u3(Icon, { n: "plus" }),
            tabs.length < 2 && /* @__PURE__ */ u3("span", { children: "New tab" })
          ]
        }
      ),
      menu && /* @__PURE__ */ u3(
        "div",
        {
          class: "pt-menu",
          style: menuAt ? `top:${menuAt.top}px;left:${menuAt.left}px;margin-top:0` : void 0,
          children: [
            /* @__PURE__ */ u3("a", { "data-tabhome": "", onClick: on3.home, children: [
              /* @__PURE__ */ u3(Icon, { n: "home" }),
              " Home"
            ] }),
            recents.length > 0 && /* @__PURE__ */ u3("h6", { children: "Recent" }),
            recents.map((recentEntry) => /* @__PURE__ */ u3(
              "a",
              {
                "data-tabnew": recentEntry.ref,
                onClick: () => on3.fresh(recentEntry.ref),
                children: [
                  /* @__PURE__ */ u3("span", { class: `rc-i ${recentEntry.state}`, children: /* @__PURE__ */ u3(Icon, { n: recentEntry.icon }) }),
                  /* @__PURE__ */ u3("span", { class: "pt-mt", children: [
                    /* @__PURE__ */ u3("i", { children: recentEntry.ref }),
                    " ",
                    recentEntry.title
                  ] })
                ]
              }
            )),
            closedFirst !== null && /* @__PURE__ */ u3(S, { children: [
              /* @__PURE__ */ u3("h6", { children: "Closed" }),
              /* @__PURE__ */ u3("a", { "data-tabreopen": "", onClick: on3.reopen, children: [
                /* @__PURE__ */ u3(Icon, { n: "clock" }),
                " Reopen ",
                closedFirst,
                " ",
                /* @__PURE__ */ u3("kbd", { children: "\u2318\u21E7T" })
              ] })
            ] })
          ]
        }
      )
    ] });
  }

  // src/components/Toolbar.tsx
  var NL2 = "\n  ";
  function Toolbar(props) {
    const label = props.profile ? props.profile.name || props.profile.login : "";
    return /* @__PURE__ */ u3(
      "header",
      {
        class: "toolbar",
        "data-tauri-drag-region": "",
        onMouseDown: props.on.drag,
        children: [
          NL2,
          /* @__PURE__ */ u3(
            "button",
            {
              class: "tb-btn nav-btn",
              id: "navbtn",
              onClick: props.on.nav,
              title: "Show or hide the sidebar",
              children: /* @__PURE__ */ u3(Icon, { n: "three-bars" })
            }
          ),
          /* @__PURE__ */ u3("div", { class: "tb-group", children: [
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "back",
                onClick: props.on.back,
                disabled: !props.canBack,
                title: "Back (\u2318[)",
                children: /* @__PURE__ */ u3(Icon, { n: "chevron-left" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "fwd",
                onClick: props.on.fwd,
                disabled: !props.canFwd,
                title: "Forward (\u2318])",
                children: /* @__PURE__ */ u3(Icon, { n: "chevron-right" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "reload",
                onClick: props.on.reload,
                disabled: !props.hasBundle,
                title: "Reload (\u2318R)",
                children: /* @__PURE__ */ u3(Icon, { n: "sync" })
              }
            )
          ] }),
          NL2,
          /* @__PURE__ */ u3("form", { id: "addr", class: "addr", onSubmit: props.on.addr, children: [
            /* @__PURE__ */ u3(Icon, { n: "search" }),
            /* @__PURE__ */ u3(
              "input",
              {
                id: "addrinput",
                ref: useFocusTarget("addr"),
                value: props.text,
                onInput: props.on.input,
                onFocus: props.on.focus,
                onBlur: props.on.blur,
                onKeyDown: props.on.key,
                placeholder: "Open a pull request: owner/repo#123 or URL  (\u2318L)",
                spellcheck: false,
                autocomplete: "off"
              }
            )
          ] }),
          props.update && /* @__PURE__ */ u3(
            "button",
            {
              class: "upd",
              id: "upd",
              onClick: props.on.upd,
              title: "Download and install the new version, then restart",
              children: [
                /* @__PURE__ */ u3(Icon, { n: "sync" }),
                " ",
                props.update.busy ? "Updating\u2026" : `Update to v${props.update.version}`
              ]
            }
          ),
          NL2,
          /* @__PURE__ */ u3("div", { class: "tb-group", children: [
            /* @__PURE__ */ u3(
              "button",
              {
                class: `tb-btn off-ind ${props.offline ? "on" : ""}`,
                id: "retry",
                onClick: props.on.retry,
                "data-tip": "Offline \u2014 can't reach GitHub. Showing the saved copy. Click to retry.",
                "aria-label": "Offline, click to retry",
                tabindex: props.offline ? 0 : -1,
                children: /* @__PURE__ */ u3(Icon, { n: "alert" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "external",
                onClick: props.on.external,
                disabled: !props.hasBundle,
                title: "Open on github.com",
                children: /* @__PURE__ */ u3(Icon, { n: "link-external" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "newprbtn",
                onClick: props.on.newPr,
                title: "New pull request",
                children: /* @__PURE__ */ u3(Icon, { n: "plus" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "inboxbtn",
                onClick: props.on.inbox,
                title: "Inbox: PRs that need you",
                children: /* @__PURE__ */ u3(Icon, { n: "checklist" })
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn bell",
                id: "bell",
                onClick: props.on.bell,
                title: "Notifications",
                children: [
                  /* @__PURE__ */ u3(Icon, { n: "bell" }),
                  props.unread > 0 && /* @__PURE__ */ u3("i", { class: "dot", children: props.unread })
                ]
              }
            ),
            /* @__PURE__ */ u3(
              "button",
              {
                class: `theme-sw${props.dark ? " dark" : ""}${props.pop ? " pop" : ""}`,
                id: "mode",
                onClick: props.on.mode,
                role: "switch",
                "aria-checked": props.dark,
                title: `Switch to ${props.dark ? "light" : "dark"} mode`,
                children: [
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
                ]
              },
              props.pop
            ),
            props.hasToken && props.profile ? /* @__PURE__ */ u3(
              "button",
              {
                class: "prof-btn",
                id: "profbtn",
                onClick: props.on.prof,
                title: `${label} \u2014 account menu`,
                children: [
                  /* @__PURE__ */ u3("img", { src: props.avatar, alt: "" }),
                  /* @__PURE__ */ u3("span", { children: label }),
                  /* @__PURE__ */ u3(Icon, { n: "chevron-down", s: 12 })
                ]
              }
            ) : /* @__PURE__ */ u3(
              "button",
              {
                class: "tb-btn",
                id: "signin",
                onClick: props.on.signin,
                title: "Access token",
                children: /* @__PURE__ */ u3(Icon, { n: "key" })
              }
            )
          ] })
        ]
      }
    );
  }

  // src/app/render.ts
  var go2 = (count) => {
    const time = appState.hi + count;
    if (time < 0 || time >= appState.hist.length) {
      return;
    }
    appState.hi = time;
    if (appState.hist[time].startsWith("repo:")) {
      openRepo(appState.hist[time].slice(5), { nav: true });
    } else {
      openPr(appState.hist[time], { nav: true });
    }
  };

  // src/app/top.tsx
  var keep3 = (fn) => {
    appState.keepScroll = true;
    fn();
    render();
    appState.keepScroll = false;
  };
  var mode = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const offset = rect.top + rect.height / 2;
    appState.mode = isDark() ? "light" : "dark";
    localStorage.setItem("mode", appState.mode);
    const swap = () => {
      appState.themePop = (appState.themePop || 0) + 1;
      keep3(() => {
      });
    };
    if (!document.startViewTransition) {
      swap();
      return;
    }
    const end = Math.hypot(
      Math.max(left, innerWidth - left),
      Math.max(offset, innerHeight - offset)
    );
    document.startViewTransition(swap).ready.then(
      () => document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${left}px ${offset}px)`,
            `circle(${end}px at ${left}px ${offset}px)`
          ]
        },
        {
          duration: 750,
          easing: "cubic-bezier(.4,0,.2,1)",
          pseudoElement: "::view-transition-new(root)"
        }
      ).finished
    );
  };
  var dense = () => document.documentElement.classList.contains("dense");
  document.documentElement.classList.toggle(
    "dense",
    localStorage.getItem("dense") === "1"
  );
  var prof = (event) => {
    event.stopPropagation();
    if (appState.pop?.k === "prof") {
      closePop();
      return;
    }
    const pr = appState.profile;
    const rect = event.currentTarget.getBoundingClientRect();
    openPop({
      k: "prof",
      right: Math.max(8, innerWidth - rect.right),
      top: rect.bottom + 6,
      name: pr.name || pr.login,
      ver: appState.ver,
      dense: dense(),
      login: pr.login,
      avatar: avUrl(pr.avatar_url, 80),
      pick: async (hash) => {
        closePop();
        if (hash === "profile") {
          openExternal(pr.html_url);
        } else if (hash === "token") {
          tokenDialog();
        } else if (hash === "repos") {
          repoPickOpen();
        } else if (hash === "dense") {
          document.documentElement.classList.toggle("dense", !dense());
          try {
            localStorage.setItem("dense", dense() ? "1" : "0");
          } catch {
          }
        } else {
          try {
            await tauri?.invoke("set_token", { token: "" });
          } catch {
          }
          appState.hasToken = false;
          appState.profile = null;
          appState.me = "";
          appState.repos = null;
          try {
            localStorage.removeItem("profile");
          } catch {
          }
          render();
        }
      }
    });
  };
  var tb = {
    nav: (event) => {
      event.stopPropagation();
      if (matchMedia("(min-width: 901px)").matches) {
        appState.hide.nav = !appState.hide.nav;
        try {
          localStorage.setItem("hide", JSON.stringify(appState.hide));
        } catch {
        }
        keep3(() => {
        });
        return;
      }
      keep3(() => {
        appState.nav = !appState.nav;
      });
    },
    back: () => go2(-1),
    fwd: () => go2(1),
    reload,
    external: () => openExternal(appState.bundle.pull.html_url),
    mode,
    drag: (event) => winDrag(event),
    addr: (event) => addrSubmit(event),
    input: (event) => addrInput(event),
    focus: (event) => addrFocus(event),
    blur: () => addrBlur(),
    key: (event) => addrKey(event),
    upd: async () => {
      const item = appState.update;
      if (!item || item.busy) {
        return;
      }
      item.busy = true;
      render();
      try {
        await item.obj.downloadAndInstall();
        await window.__TAURI__.process.relaunch();
      } catch (error) {
        item.busy = false;
        appState.actErr = { k: "update", m: `Update failed: ${String(error)}` };
        render();
      }
    },
    retry: (ev) => {
      const sel = btnSel(ev.currentTarget);
      setBusy(sel, true);
      appState.offline = navigator.onLine === false;
      Promise.resolve(reload()).finally(() => setBusy(sel, false));
    },
    newPr: () => openNewPr(),
    inbox: openInbox,
    bell: (event) => {
      event.stopPropagation();
      setBell(!appState.bell);
    },
    signin: tokenDialog,
    prof
  };
  var swallowClick = false;
  var tabDown = (event, from) => {
    const el = event.currentTarget;
    if (event.button !== 0 || event.target.closest(".pt-x")) {
      return;
    }
    const x0 = event.clientX;
    const width = el.offsetWidth;
    let moved = false;
    let to = from;
    const mids = [
      ...el.parentElement.querySelectorAll(".ptab")
    ].map((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    const mv = (ev) => {
      if (!moved && Math.abs(ev.clientX - x0) < 6) {
        return;
      }
      if (!moved) {
        moved = true;
        setDragging(true);
      }
      to = mids.reduce(
        (best, minutes, index) => ev.clientX > minutes ? index : best,
        0
      );
      appState.drag = { from, to, dx: ev.clientX - x0, w: width };
      paintTop();
    };
    const up = () => {
      setDragging(false);
      if (!moved) {
        return;
      }
      swallowClick = true;
      setTimeout(() => {
        swallowClick = false;
      }, 0);
      appState.drag = null;
      if (to !== from) {
        const [tab] = appState.tabs.splice(from, 1);
        appState.tabs.splice(to, 0, tab);
        saveTabs();
      }
      render();
    };
    beginDrag({ move: mv, end: up });
  };
  var ts = {
    open: (index) => {
      if (swallowClick) {
        return;
      }
      const tab = appState.tabs[index];
      if (tab.ref !== curRef()) {
        if (fastTab(tab.ref)) {
          return;
        }
        stashCurrent();
        tabSnap();
        appState.fadeMain = true;
        appState.tabMenu = false;
        openPr(tab.ref, { nav: true, restore: tab.tab });
      }
    },
    aux: (event, index) => {
      if (event.button === 1) {
        event.preventDefault();
        closeTab(index);
      }
    },
    down: tabDown,
    close: (event, index) => {
      event.stopPropagation();
      closeTab(index);
    },
    add: (event) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      appState.tabMenuAt = {
        top: rect.bottom + 4,
        left: Math.min(rect.left, innerWidth - 350)
      };
      appState.tabMenu = !appState.tabMenu;
      rerender();
    },
    fresh: (ref) => openFromList(ref, true),
    home: () => {
      appState.tabMenu = false;
      appState.view = "home";
      render();
    },
    reopen: () => {
      appState.tabMenu = false;
      reopenTab();
    }
  };
  function Top() {
    const bundle = appState.bundle;
    const pr = appState.profile;
    const open2 = new Set(appState.tabs.map((tab) => tab.ref));
    return /* @__PURE__ */ u3(S, { children: [
      appState.refreshing && /* @__PURE__ */ u3("div", { class: "refreshing-bar" }),
      /* @__PURE__ */ u3(
        Toolbar,
        {
          text: appState.addrText ?? (bundle ? `${bundle.pull.base.repo.full_name}#${bundle.pull.number}` : ""),
          hasBundle: !!bundle,
          canBack: !(appState.hist.length < 2 || appState.hi < 1),
          canFwd: !(appState.hi >= appState.hist.length - 1),
          update: appState.update ? { busy: appState.update.busy, version: appState.update.version } : null,
          offline: isOff(),
          unread: appState.notes.filter((note) => !note.read).length,
          dark: isDark(),
          pop: appState.themePop || 0,
          profile: pr,
          hasToken: appState.hasToken,
          avatar: appState.hasToken && pr ? avUrl(pr.avatar_url, 56) : "",
          on: tb
        }
      ),
      /* @__PURE__ */ u3(
        TabStrip,
        {
          tabs: appState.tabs,
          cur: appState.tabPending || curRef(),
          recents: appState.recent.filter((recentEntry) => !open2.has(recentEntry.ref)).slice(0, 8),
          menu: appState.tabMenu,
          menuAt: appState.tabMenuAt || null,
          drag: appState.drag || null,
          closedFirst: appState.closed.length ? appState.closed[0].ref : null,
          on: ts
        }
      )
    ] });
  }
  var paintTop = () => setSlot("top", /* @__PURE__ */ u3(Top, {}));
  var clearTop = () => setSlot("top", null);

  // src/app/notes.tsx
  function paintNotes() {
    setSlot(
      "notes",
      /* @__PURE__ */ u3(
        NotePanel,
        {
          open: appState.bell,
          rows: appState.notes.map((note) => ({
            id: note.id,
            ref: note.ref,
            target: note.target || "",
            read: !!note.read,
            title: note.title,
            text: note.text,
            when: whenParts(note.at).text
          })),
          on: noteOn
        }
      )
    );
  }
  function setBell(open2) {
    appState.bell = open2;
    if (!open2 && appState.notes.some((note) => !note.read)) {
      appState.notes.forEach((note) => {
        note.read = true;
      });
      saveNotes();
      paintTop();
    }
    paintNotes();
  }
  var keepRender = () => {
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  };
  var row = (event) => event.currentTarget;
  function noteAll() {
    appState.bell = false;
    appState.view = "notes";
    appState.nav = false;
    render();
  }
  function noteClear() {
    appState.notes = [];
    localStorage.setItem("notes", "[]");
    keepRender();
  }
  function noteOpen(event) {
    openClick(row(event), event);
    appState.bell = false;
    appState.notes.forEach((note) => {
      note.read = true;
    });
    saveNotes();
  }
  var noteOn = {
    all: noteAll,
    check: () => {
      pollNotes();
    },
    clear: noteClear,
    open: noteOpen,
    aux: (event) => openAux(row(event), event),
    ctx: (event) => openCtx(row(event), event)
  };
  function notesAway(event) {
    if (!appState.bell || event.target.closest(".note-panel, #bell")) {
      return;
    }
    setBell(false);
  }
  var notesKey = (event) => {
    if (event.key === "Escape" && appState.bell) {
      setBell(false);
    }
  };

  // src/components/Sidebar.tsx
  var cap3 = (text) => text[0].toUpperCase() + text.slice(1);
  function SideTabs({
    active,
    hasRepo,
    on: on3
  }) {
    const cls = (text) => active === text ? "on" : "";
    return /* @__PURE__ */ u3("div", { class: "sb-tabs", children: [
      /* @__PURE__ */ u3(
        "button",
        {
          "data-side": "repos",
          class: cls("repos"),
          onClick: () => on3.side("repos"),
          children: "Repos"
        }
      ),
      hasRepo && /* @__PURE__ */ u3(
        "button",
        {
          "data-side": "prs",
          class: cls("prs"),
          onClick: () => on3.side("prs"),
          children: "PRs"
        }
      ),
      /* @__PURE__ */ u3(
        "button",
        {
          "data-side": "recent",
          class: cls("recent"),
          onClick: () => on3.side("recent"),
          children: "Recent"
        }
      )
    ] });
  }
  function RcItem({ r: rcRow, on: on3 }) {
    return /* @__PURE__ */ u3(
      "a",
      {
        class: `rc ${rcRow.on ? "on" : ""}`,
        "data-open": rcRow.ref,
        onClick: (event) => on3.open(event.currentTarget, event),
        onAuxClick: (event) => on3.aux(event.currentTarget, event),
        onContextMenu: (event) => on3.ctx(event.currentTarget, event),
        children: [
          /* @__PURE__ */ u3("span", { class: `rc-i ${rcRow.st}`, children: /* @__PURE__ */ u3(Icon, { n: rcRow.icon }) }),
          /* @__PURE__ */ u3("span", { class: "rc-t", children: [
            /* @__PURE__ */ u3("b", { children: rcRow.title }),
            /* @__PURE__ */ u3("i", { children: rcRow.sub })
          ] })
        ]
      }
    );
  }
  function RecentList({
    recent,
    curRef: curRef2,
    on: on3
  }) {
    if (!recent.length) {
      return /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Pull requests you open appear here." });
    }
    return /* @__PURE__ */ u3(S, { children: recent.map((recentEntry) => /* @__PURE__ */ u3(
      "a",
      {
        class: `rc ${recentEntry.ref === curRef2 ? "on" : ""}`,
        "data-open": recentEntry.ref,
        onClick: (event) => on3.open(event.currentTarget, event),
        onAuxClick: (event) => on3.aux(event.currentTarget, event),
        onContextMenu: (event) => on3.ctx(event.currentTarget, event),
        children: [
          /* @__PURE__ */ u3("span", { class: `rc-i ${recentEntry.state}`, children: /* @__PURE__ */ u3(Icon, { n: recentEntry.icon }) }),
          /* @__PURE__ */ u3("span", { class: "rc-t", children: [
            /* @__PURE__ */ u3("b", { children: recentEntry.title }),
            /* @__PURE__ */ u3("i", { children: recentEntry.ref })
          ] }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "rc-x",
              "data-rm": recentEntry.ref,
              onClick: (event) => on3.rm(event, recentEntry.ref),
              title: "Remove",
              children: /* @__PURE__ */ u3(Icon, { n: "x" })
            }
          )
        ]
      }
    )) });
  }
  function RepoList({
    repos,
    repo,
    filter,
    on: on3
  }) {
    const field = filter.toLowerCase();
    const shown2 = repos.filter(
      (repoSummary) => repoSummary.full_name.toLowerCase().includes(field)
    );
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        "input",
        {
          class: "input sb-filter",
          id: "repofilter",
          placeholder: "Find a repository\u2026",
          value: filter,
          onInput: on3.repoFilter
        }
      ),
      /* @__PURE__ */ u3("button", { class: "sb-btn", id: "pickrepos", onClick: on3.pickRepos, children: "Choose repositories\u2026" }),
      shown2.length ? shown2.map((repoSummary) => /* @__PURE__ */ u3(
        "a",
        {
          class: `rc ro-it ${repo === repoSummary.full_name ? "on" : ""}${roCls("repos", repoSummary.full_name)}`,
          "data-repo": repoSummary.full_name,
          "data-t": repoSummary.full_name,
          onClick: () => on3.repo(repoSummary.full_name),
          children: [
            /* @__PURE__ */ u3(
              "span",
              {
                class: `rc-i ${repoSummary.private ? "closed" : ""}`,
                style: "color:var(--fgColor-muted)",
                children: /* @__PURE__ */ u3(Icon, { n: repoSummary.private ? "lock" : "repo" })
              }
            ),
            /* @__PURE__ */ u3("span", { class: "rc-t", children: [
              /* @__PURE__ */ u3("b", { children: repoSummary.full_name.split("/")[1] }),
              /* @__PURE__ */ u3("i", { children: repoSummary.full_name.split("/")[0] })
            ] }),
            /* @__PURE__ */ u3(
              "i",
              {
                class: "ro-grip",
                title: "Drag to reorder",
                onClick: (event) => event.stopPropagation(),
                onMouseDown: (event) => on3.grip(event, repoSummary.full_name),
                children: "\u22EE\u22EE"
              }
            )
          ]
        }
      )) : /* @__PURE__ */ u3("div", { class: "sb-empty", children: "No matches." })
    ] });
  }
  function Sel({
    id,
    opts,
    v: otherValue,
    onChange
  }) {
    return /* @__PURE__ */ u3("select", { class: "input sb-sel", id, onChange, children: opts.map(([key2, text]) => /* @__PURE__ */ u3("option", { value: key2, selected: key2 === otherValue, children: text })) });
  }
  function SideHead({
    p: props,
    on: on3
  }) {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3("div", { class: "sb-repo", children: [
        /* @__PURE__ */ u3(
          "button",
          {
            class: "fold-btn",
            "data-side": "repos",
            title: "All repositories",
            onClick: () => on3.side("repos"),
            children: /* @__PURE__ */ u3(Icon, { n: "chevron-left" })
          }
        ),
        /* @__PURE__ */ u3("b", { title: props.repo, children: props.repo })
      ] }),
      /* @__PURE__ */ u3("div", { class: "seg sb-seg", children: ["open", "closed", "all"].map((text) => /* @__PURE__ */ u3(
        "button",
        {
          "data-sps": text,
          class: props.state === text ? "on" : "",
          onClick: () => on3.sps(text),
          children: cap3(text)
        }
      )) }),
      /* @__PURE__ */ u3(
        "input",
        {
          class: "input sb-filter",
          id: "prfilter",
          placeholder: "Filter by title, #, author, label\u2026",
          value: props.filter,
          onInput: on3.pf
        }
      ),
      /* @__PURE__ */ u3("div", { class: "sb-ctl", children: [
        /* @__PURE__ */ u3("label", { children: [
          "Sort",
          /* @__PURE__ */ u3(
            Sel,
            {
              id: "prsort",
              opts: props.sorts,
              v: props.sort,
              onChange: on3.psort
            }
          )
        ] }),
        /* @__PURE__ */ u3("label", { children: [
          "Group",
          /* @__PURE__ */ u3(
            Sel,
            {
              id: "prgroup",
              opts: props.groups,
              v: props.group,
              onChange: on3.pgroup
            }
          )
        ] })
      ] })
    ] });
  }
  function PrGroups({
    groups,
    on: on3
  }) {
    return /* @__PURE__ */ u3(S, { children: groups.map((prGroup) => /* @__PURE__ */ u3("div", { class: `pg${prGroup.folded}`, children: [
      /* @__PURE__ */ u3(
        "div",
        {
          class: "pg-h",
          "data-fold": prGroup.key,
          onClick: (event) => on3.fold(event, prGroup.key),
          children: [
            /* @__PURE__ */ u3(Icon, { n: prGroup.closed ? "chevron-right" : "chevron-down" }),
            /* @__PURE__ */ u3("span", { children: prGroup.name }),
            /* @__PURE__ */ u3("i", { children: prGroup.rows.length })
          ]
        }
      ),
      /* @__PURE__ */ u3("div", { class: "pg-b", children: prGroup.rows.map((rcRow) => /* @__PURE__ */ u3(RcItem, { r: rcRow, on: on3 })) })
    ] })) });
  }
  function Sidebar({
    sideTab,
    hasRepo,
    on: on3,
    children
  }) {
    return /* @__PURE__ */ u3("aside", { class: "sidebar", children: [
      /* @__PURE__ */ u3(SideTabs, { active: sideTab, hasRepo, on: on3 }),
      /* @__PURE__ */ u3("div", { class: "sb-list", children })
    ] });
  }

  // src/app/prlist.ts
  var PSORT = {
    updated: "Recently updated",
    created: "Newest",
    oldest: "Oldest",
    number: "Number",
    title: "Title A\u2013Z",
    author: "Author"
  };
  var PGROUP = {
    none: "No grouping",
    status: "Status",
    author: "Author",
    label: "Label",
    base: "Base branch"
  };
  var prStatus = (prListItem) => prListItem.merged_at ? "merged" : prListItem.state === "closed" ? "closed" : prListItem.draft ? "draft" : "open";
  var PICON = {
    open: "git-pull-request",
    draft: "git-pull-request-draft",
    merged: "git-merge",
    closed: "git-pull-request-closed"
  };
  function prFiltered() {
    const field = appState.pf.toLowerCase();
    const list = (appState.prs || []).filter(
      (prListItem) => (!field || `#${prListItem.number} ${prListItem.title} ${prListItem.user.login} ${prListItem.head?.ref || ""} ${(prListItem.labels || []).map((label) => label.name).join(" ")}`.toLowerCase().includes(field)) && (!appState.pAuthor || prListItem.user.login === appState.pAuthor) && (!appState.pLabel || (prListItem.labels || []).some(
        (label) => label.name === appState.pLabel
      )) && (!appState.pStatus || prStatus(prListItem) === appState.pStatus)
    );
    const cmps = {
      updated: (firstPrListItem, secondPrListItem) => secondPrListItem.updated_at.localeCompare(firstPrListItem.updated_at),
      created: (firstPrListItem, secondPrListItem) => secondPrListItem.created_at.localeCompare(firstPrListItem.created_at),
      oldest: (firstPrListItem, secondPrListItem) => firstPrListItem.created_at.localeCompare(secondPrListItem.created_at),
      number: (firstPrListItem, secondPrListItem) => secondPrListItem.number - firstPrListItem.number,
      title: (firstPrListItem, secondPrListItem) => firstPrListItem.title.localeCompare(secondPrListItem.title),
      author: (firstPrListItem, secondPrListItem) => firstPrListItem.user.login.localeCompare(secondPrListItem.user.login) || secondPrListItem.number - firstPrListItem.number
    };
    return list.sort(cmps[appState.psort]);
  }
  function prFilterBar() {
    if (!appState.prs) {
      return null;
    }
    const authors = [
      ...new Set(appState.prs.map((prListItem) => prListItem.user.login))
    ].sort((firstText, secondText) => firstText.localeCompare(secondText));
    const labels = [
      ...new Set(
        appState.prs.flatMap(
          (prListItem) => (prListItem.labels || []).map((label) => label.name)
        )
      )
    ].sort((firstText, secondText) => firstText.localeCompare(secondText));
    return {
      filter: appState.pf,
      authors,
      labels,
      author: appState.pAuthor,
      label: appState.pLabel,
      status: appState.pStatus ?? "",
      statuses: Object.entries({
        open: "Open",
        draft: "Draft",
        merged: "Merged",
        closed: "Closed"
      }),
      sort: appState.psort,
      sorts: Object.entries(PSORT),
      n: prFiltered().length,
      total: appState.prs.length,
      active: !!(appState.pf || appState.pAuthor || appState.pLabel || appState.pStatus)
    };
  }
  function prListProps() {
    const rows = appState.error || !appState.prs ? null : prFiltered().map((prListItem) => {
      const st = prListItem.merged_at ? ["merged", "git-merge"] : prListItem.state === "closed" ? ["closed", "git-pull-request-closed"] : prListItem.draft ? ["draft", "git-pull-request-draft"] : ["open", "git-pull-request"];
      return {
        ref: `${appState.repo}#${prListItem.number}`,
        st: st[0],
        icon: st[1],
        title: prListItem.title,
        labels: prListItem.labels || [],
        meta: `#${prListItem.number} ${prListItem.merged_at ? "merged" : prListItem.state === "closed" ? "closed" : "opened"} ${when(prListItem.merged_at || prListItem.closed_at || prListItem.created_at).replace(/<\/?span[^>]*>/g, "")} by ${prListItem.user.login}`,
        avatar: prListItem.user.avatar_url ?? ""
      };
    });
    return {
      repo: appState.repo,
      state: appState.prState,
      banners: pushBannerItems(appState.repo),
      filterBar: prFilterBar(),
      rows,
      err: appState.error ? String(appState.error) : "",
      loading: !appState.error && !appState.prs,
      empty: appState.prs?.length ? "No pull requests match the filters." : "No pull requests."
    };
  }

  // src/app/side.tsx
  var typed = (event, key2) => {
    appState[key2] = event.target.value;
    render();
  };
  var on2 = {
    side: (tab) => {
      appState.sideTab = tab;
      render();
    },
    sps: (state) => {
      appState.prState = state;
      loadPrs();
    },
    pf: (event) => typed(event, "pf"),
    psort: (event) => {
      appState.psort = event.target.value;
      localStorage.setItem("psort", appState.psort);
      render();
    },
    pgroup: (event) => {
      appState.pgroup = event.target.value;
      localStorage.setItem("pgroup", appState.pgroup);
      render();
    },
    repoFilter: (event) => typed(event, "repoFilter"),
    repo: (name) => openRepo(name),
    addToken: tokenDialog,
    pickRepos: repoPickOpen,
    grip: (event, name) => roGrip(
      event,
      "repos",
      ".rc[data-t]",
      name,
      () => arrange(
        appState.repos || [],
        "repos",
        (repoSummary) => repoSummary.full_name
      ).map((repoSummary) => repoSummary.full_name),
      (options) => saveOrder("repos", options)
    ),
    open: openClick,
    aux: openAux,
    ctx: openCtx,
    rm: rmRecent,
    // Folding only flips state; the page and the sidebar both repaint from it.
    fold: (event, key2) => {
      event.stopPropagation();
      appState.fold[key2] = !isFolded(key2);
      localStorage.setItem("fold", JSON.stringify(appState.fold));
      rerender();
      repaintSide();
    }
  };
  function PrRows() {
    const cur = appState.bundle && appState.view === "pr" ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "";
    const field = appState.pf.toLowerCase();
    const head2 = {
      repo: appState.repo,
      state: appState.prState,
      filter: appState.pf,
      sort: appState.psort,
      group: appState.pgroup,
      sorts: Object.entries(PSORT),
      groups: Object.entries(PGROUP)
    };
    const header = /* @__PURE__ */ u3(SideHead, { p: head2, on: on2 });
    if (!appState.prs) {
      return /* @__PURE__ */ u3(S, { children: [
        header,
        /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading pull requests\u2026" })
      ] });
    }
    const list = appState.prs.filter(
      (prListItem) => !field || `#${prListItem.number} ${prListItem.title} ${prListItem.user.login} ${prListItem.head?.ref || ""} ${(prListItem.labels || []).map((label) => label.name).join(" ")}`.toLowerCase().includes(field)
    );
    const sorts = {
      updated: (firstPrListItem, secondPrListItem) => secondPrListItem.updated_at.localeCompare(firstPrListItem.updated_at),
      created: (firstPrListItem, secondPrListItem) => secondPrListItem.created_at.localeCompare(firstPrListItem.created_at),
      oldest: (firstPrListItem, secondPrListItem) => firstPrListItem.created_at.localeCompare(secondPrListItem.created_at),
      number: (firstPrListItem, secondPrListItem) => secondPrListItem.number - firstPrListItem.number,
      title: (firstPrListItem, secondPrListItem) => firstPrListItem.title.localeCompare(secondPrListItem.title),
      author: (firstPrListItem, secondPrListItem) => firstPrListItem.user.login.localeCompare(secondPrListItem.user.login) || secondPrListItem.number - firstPrListItem.number
    };
    list.sort(sorts[appState.psort]);
    const row2 = (prListItem) => {
      const st = prStatus(prListItem);
      const ref = `${appState.repo}#${prListItem.number}`;
      return {
        ref,
        on: ref === cur,
        st,
        icon: PICON[st],
        title: prListItem.title,
        sub: `#${prListItem.number} \xB7 ${prListItem.user.login} \xB7 ${when(prListItem.updated_at).replace(/<\/?span[^>]*>/g, "")}`
      };
    };
    if (!list.length) {
      return /* @__PURE__ */ u3(S, { children: [
        header,
        /* @__PURE__ */ u3("div", { class: "sb-empty", children: appState.pf ? "No matches." : "No pull requests." })
      ] });
    }
    if (appState.pgroup === "none") {
      return /* @__PURE__ */ u3(S, { children: [
        header,
        /* @__PURE__ */ u3("div", { class: "sb-count", children: [
          list.length,
          " pull request",
          list.length === 1 ? "" : "s"
        ] }),
        list.map((prListItem) => /* @__PURE__ */ u3(RcItem, { r: row2(prListItem), on: on2 }))
      ] });
    }
    const groups = /* @__PURE__ */ new Map();
    const put2 = (key2, prListItem) => (groups.get(key2) || groups.set(key2, []).get(key2)).push(prListItem);
    list.forEach((prListItem) => {
      if (appState.pgroup === "status") {
        put2(
          { open: "Open", draft: "Draft", merged: "Merged", closed: "Closed" }[prStatus(prListItem)],
          prListItem
        );
      } else if (appState.pgroup === "author") {
        put2(prListItem.user.login, prListItem);
      } else if (appState.pgroup === "base") {
        put2(prListItem.base?.ref || "\u2014", prListItem);
      } else if ((prListItem.labels || []).length) {
        prListItem.labels.forEach((label) => put2(label.name, prListItem));
      } else {
        put2("No label", prListItem);
      }
    });
    const order = appState.pgroup === "status" ? ["Open", "Draft", "Merged", "Closed"] : [...groups.keys()].sort(
      (firstText, secondText) => +(firstText === "No label") - +(secondText === "No label") || firstText.localeCompare(secondText)
    );
    return /* @__PURE__ */ u3(S, { children: [
      header,
      /* @__PURE__ */ u3(
        PrGroups,
        {
          on: on2,
          groups: order.filter((key2) => groups.has(key2)).map((otherKey) => {
            const key2 = `pg:${appState.pgroup}:${otherKey}`;
            return {
              key: key2,
              folded: folded(key2),
              closed: isFolded(key2),
              name: otherKey,
              rows: groups.get(otherKey).map(row2)
            };
          })
        }
      )
    ] });
  }
  function List() {
    if (appState.sideTab === "prs" && appState.repo) {
      return /* @__PURE__ */ u3(PrRows, {});
    }
    if (appState.sideTab === "recent") {
      return /* @__PURE__ */ u3(
        RecentList,
        {
          recent: appState.recent,
          curRef: appState.bundle ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "",
          on: on2
        }
      );
    }
    if (!appState.hasToken) {
      return /* @__PURE__ */ u3("div", { class: "sb-empty", children: [
        "Add an access token to list all your repositories and their pull requests.",
        /* @__PURE__ */ u3("br", {}),
        /* @__PURE__ */ u3("br", {}),
        /* @__PURE__ */ u3("button", { class: "sb-btn", id: "addtoken", onClick: on2.addToken, children: "Add token" })
      ] });
    }
    if (appState.reposErr) {
      return /* @__PURE__ */ u3("div", { class: "sb-empty err", children: appState.reposErr });
    }
    if (!appState.repos) {
      return /* @__PURE__ */ u3("div", { class: "sb-empty", children: "Loading repositories\u2026" });
    }
    return /* @__PURE__ */ u3(
      RepoList,
      {
        repos: arrange(
          appState.repos,
          "repos",
          (repoSummary) => repoSummary.full_name
        ),
        repo: appState.repo,
        filter: appState.repoFilter,
        on: on2
      }
    );
  }
  function Side() {
    return /* @__PURE__ */ u3(Sidebar, { sideTab: appState.sideTab, hasRepo: !!appState.repo, on: on2, children: /* @__PURE__ */ u3(List, {}) });
  }
  var paintSide = () => setSlot("side", /* @__PURE__ */ u3(Side, {}));
  var repaintSide = paintSide;

  // src/app/fun.ts
  var enterTimer;
  function enterAnim() {
    appState.enter = true;
    repaintShell({ enter: true });
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => {
      appState.enter = false;
      repaintShell({ enter: false });
    }, 1800);
  }
  function ripple(event) {
    const value = event.target.closest(".btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add");
    if (!value || value.disabled) {
      return;
    }
    const rect = value.getBoundingClientRect();
    const delta = Math.max(rect.width, rect.height) * 2;
    const cs = getComputedStyle(value);
    fxAdd(
      {
        k: "rip",
        l: rect.left,
        t: rect.top,
        w: rect.width,
        h: rect.height,
        radius: cs.borderRadius,
        color: cs.color,
        x: event.clientX - rect.left - delta / 2,
        y: event.clientY - rect.top - delta / 2,
        d: delta
      },
      650
    );
    if (value.matches(".reaction, .react-add")) {
      burst(
        event.clientX,
        event.clientY,
        value.textContent.trim().slice(0, 2) || "\u2728",
        6
      );
    }
  }
  function burst(leftLeft, rightOffset, ch, count) {
    for (let index = 0; index < count; index++) {
      const first = Math.PI * 2 * index / count + Math.random() * 0.6;
      const value = 40 + Math.random() * 50;
      fxAdd(
        {
          k: "burst",
          x: leftLeft,
          y: rightOffset,
          ch,
          dx: Math.cos(first) * value,
          dy: Math.sin(first) * value - 30
        },
        900
      );
    }
  }
  var confetti = () => fxAdd({ k: "conf", w: innerWidth, h: innerHeight });

  // src/app/views.tsx
  var open = { open: openClick, aux: openAux, ctx: openCtx };
  var typedPf = (event) => {
    appState.pf = event.target.value;
    render();
  };
  var prl = {
    ...open,
    ps: (text) => {
      appState.prState = text;
      openRepo(appState.repo, { nav: true });
    },
    compare: (repo, br) => openNewPr(repo, br),
    dismiss: (key2) => {
      pushDis[key2] = 1;
      localStorage.setItem("pushdismiss", JSON.stringify(pushDis));
      rerender();
    },
    filter: typedPf,
    author: (event) => {
      appState.pAuthor = event.target.value;
      render();
    },
    label: (event) => {
      appState.pLabel = event.target.value;
      render();
    },
    status: (event) => {
      appState.pStatus = event.target.value;
      render();
    },
    sort: (event) => {
      appState.psort = event.target.value;
      localStorage.setItem("psort", appState.psort);
      render();
    },
    clear: () => {
      appState.pf = appState.pAuthor = appState.pLabel = appState.pStatus = "";
      render();
    }
  };
  function RepoView() {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        Crumbs,
        {
          repo: appState.repo,
          trail: [{ t: "Pull requests" }],
          on: crumbs
        }
      ),
      /* @__PURE__ */ u3(PrListPage, { p: prListProps(), on: prl })
    ] });
  }
  var keep4 = (fn) => {
    appState.keepScroll = true;
    fn();
    render();
    appState.keepScroll = false;
  };
  var notes = {
    ...open,
    check: () => pollNotes(),
    readAll: () => keep4(() => {
      appState.notes.forEach((note) => note.read = true);
      saveNotes();
    }),
    clear: () => keep4(() => {
      appState.notes = [];
      saveNotes();
    }),
    filter: (field) => keep4(() => {
      appState.nf = field;
    }),
    read: (event, id) => {
      event.stopPropagation();
      const note = appState.notes.find(
        (otherNote) => String(otherNote.id) === String(id)
      );
      if (note) {
        keep4(() => {
          note.read = !note.read;
          saveNotes();
        });
      }
    },
    del: (event, id) => {
      event.stopPropagation();
      keep4(() => {
        appState.notes = appState.notes.filter(
          (note) => String(note.id) !== String(id)
        );
        saveNotes();
      });
    }
  };
  function NotesView() {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: "", trail: [{ t: "Notifications" }], on: crumbs }),
      /* @__PURE__ */ u3(NotesPage, { ...notesProps(), on: notes })
    ] });
  }
  var foldSave = () => {
    try {
      localStorage.setItem("fold", JSON.stringify(appState.fold));
    } catch {
    }
    render();
  };
  var ibSave = (options) => {
    appState.ibOrder = options.length ? options : void 0;
    try {
      if (options.length) {
        localStorage.setItem("iborder", JSON.stringify(options));
      } else {
        localStorage.removeItem("iborder");
      }
    } catch {
    }
    render();
  };
  var IB_SEL = ".ib-sec[data-t]";
  var ibGrip = (event, title) => roGrip(event, "ib", IB_SEL, title, ibOrder, ibSave);
  var inbox = {
    ...open,
    refresh: () => loadInbox(true),
    sort: (event) => {
      appState.ibSort = event.target.value;
      try {
        localStorage.setItem("ibsort", appState.ibSort);
      } catch {
      }
      render();
    },
    query: (event) => {
      appState.ibQ = event.target.value;
      render();
    },
    fold: (key2) => {
      appState.fold[key2] = !appState.fold[key2];
      foldSave();
    },
    move: (text, by) => {
      const options = ibOrder();
      const index = options.indexOf(text);
      const otherIndex = index + by;
      if (index < 0 || otherIndex < 0 || otherIndex >= options.length) {
        return;
      }
      [options[index], options[otherIndex]] = [
        options[otherIndex],
        options[index]
      ];
      roMove(IB_SEL, text, () => ibSave(options));
    },
    grip: ibGrip,
    resetOrder: () => ibSave([]),
    pin: ibPin,
    snooze: ibSnooze,
    snoozeMenu: (text) => {
      appState.ibSnzOpen = appState.ibSnzOpen === text ? "" : text;
      render();
    },
    viewApply,
    viewSave,
    viewDelete,
    viewNaming: (on3) => {
      appState.ibNaming = on3;
      render();
    },
    foldAll: (closed) => {
      IB_TITLES.forEach((text) => {
        appState.fold[ibSecKey(text)] = closed;
      });
      foldSave();
    }
  };
  function InboxView() {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(Crumbs, { repo: "", trail: [{ t: "Inbox" }], on: crumbs }),
      /* @__PURE__ */ u3(InboxPage, { p: inboxProps(), on: inbox })
    ] });
  }
  var np = () => appState.np;
  var npSet = (handler) => {
    handler();
    np().key = `${np().repo}|${np().base}|${np().head}`;
  };
  var val = (event) => event.target.value;
  var newpr = {
    cancel: () => {
      appState.view = appState.bundle ? "pr" : "home";
      delete appState.draft.newpr;
      render();
    },
    repo: (event) => bpOpen(
      event.currentTarget,
      "repo",
      (value) => {
        npSet(() => {
          np().repo = value;
          np().base = "";
          np().head = "";
          np().cmp = null;
          np().titleTouched = false;
          np().title = "";
        });
        render();
        npLoadBranches(np().repo);
      },
      true
    ),
    repoIn: (event) => {
      npSet(() => {
        np().repo = val(event).trim();
        np().base = "";
        np().head = "";
      });
      npLoadBranches(np().repo);
    },
    base: (event) => bpOpen(event.currentTarget, "base", (value) => {
      npSet(() => {
        np().base = value;
      });
      npCompare();
    }),
    head: (event) => bpOpen(event.currentTarget, "head", (value) => {
      npSet(() => {
        np().head = value;
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
    tpl: (event) => {
      const newPr = np();
      const sel = event.target;
      const templates = newPr.tpl[`${newPr.repo}|${newPr.base}`] || [];
      const cur = (appState.draft.newpr || "").trim();
      const next = sel.value === "-1" ? "" : templates[+sel.value].body;
      if (cur && cur !== newPr.tplText.trim() && !confirm("Replace what you have written with this template?")) {
        rerender();
        return;
      }
      appState.draft.newpr = newPr.tplText = next;
      saveDrafts();
      bumpNp();
      rerender();
      syncDraft("newpr");
    },
    title: (event) => {
      np().title = val(event);
      np().titleTouched = true;
      render();
    },
    draft: (event) => {
      np().draft = event.target.checked;
      render();
    },
    add: (npListKey, event) => {
      if (val(event)) {
        np()[npListKey].push(val(event));
        render();
      }
    },
    del: (npListKey, value) => {
      np()[npListKey] = np()[npListKey].filter((text) => text !== value);
      render();
    },
    mile: (event) => {
      np().milestone = val(event);
    },
    issues: (event) => {
      np().issues = val(event);
    },
    create: async () => {
      const newPr = np();
      const sel = "#npcreate";
      setBusy(sel, true);
      newPr.err = "";
      try {
        const nums = [...new Set(newPr.issues.match(/\d+/g) || [])];
        const body = ((appState.draft.newpr || "").trim() + (nums.length ? `

${nums.map((text) => `Closes #${text}`).join("\n")}` : "")).trim();
        const extra = {
          reviewers: newPr.reviewers,
          assignees: newPr.assignees,
          labels: newPr.labels,
          milestone: newPr.milestone ? Number(newPr.milestone) : null
        };
        const createdPr = await tauri.invoke("create_pr", {
          repo: newPr.repo,
          base: newPr.base,
          head: newPr.head,
          title: newPr.title,
          body,
          draft: newPr.draft,
          extra
        });
        const warn = createdPr.warnings?.length ? `Created, but ${createdPr.warnings.join(" \xB7 ")}` : "";
        delete appState.draft.newpr;
        saveDrafts();
        appState.np = null;
        confetti();
        await openPr(`${newPr.repo}#${createdPr.number}`, { nav: true });
        if (warn) {
          appState.actErr = { k: "comment", m: warn };
          rerender();
        }
      } catch (err) {
        newPr.err = String(err).replace(/^Error: /, "");
      } finally {
        setBusy(sel, false);
      }
    }
  };
  function NewPrView() {
    return /* @__PURE__ */ u3(S, { children: [
      /* @__PURE__ */ u3(
        Crumbs,
        {
          repo: np().repo,
          trail: [{ t: "New pull request" }],
          on: crumbs
        }
      ),
      /* @__PURE__ */ u3(NewPr, { p: newPrProps(), on: newpr })
    ] });
  }

  // src/app/pages.tsx
  var saveNotes = () => localStorage.setItem("notes", JSON.stringify(appState.notes));
  function notesProps() {
    const field = appState.nf || "all";
    const unread = appState.notes.filter((note) => !note.read).length;
    const rows = appState.notes.filter(
      (note) => field === "all" || (field === "unread" ? !note.read : note.read)
    ).map((note) => ({
      id: note.id,
      read: !!note.read,
      ref: note.ref,
      target: note.target || "",
      title: note.title,
      text: note.text,
      when: when(note.at).replace(/<\/?span[^>]*>/g, "")
    }));
    return { f: field, rows, unread, total: appState.notes.length };
  }
  async function loadInbox(force = false) {
    appState.inbox = appState.inbox || { data: null, err: "", loading: true };
    appState.inbox.loading = true;
    appState.inbox.err = "";
    render();
    try {
      appState.inbox.data = tauri ? await tauri.invoke("inbox", { force, repos: selNames() }) : { requested: [], mine: [], ready: [] };
    } catch (error) {
      appState.inbox.err = String(error).replace(/^Error: /, "");
    }
    appState.inbox.loading = false;
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  }
  var npHuman = (text) => text.replace(/^[a-z]+\//i, "").replace(/[-_]+/g, " ").replace(/^./, (color) => color.toUpperCase());
  var npSeq = 0;
  var bumpNp = () => {
    npSeq++;
  };
  function newPrProps() {
    const newPr = appState.np;
    const repos = (appState.repos || []).filter(
      (repoSummary) => !repoSummary.archived
    );
    const br = newPr.branches[newPr.repo];
    const same = !!(newPr.base && newPr.base === newPr.head);
    const value = newPr.cmp;
    const cmp = value === "loading" ? { kind: "loading", text: "", ahead: 0, files: 0, behind: 0 } : !value ? { kind: "none", text: "", ahead: 0, files: 0, behind: 0 } : typeof value === "string" ? { kind: "err", text: value, ahead: 0, files: 0, behind: 0 } : value.ahead_by ? {
      kind: "ok",
      text: "",
      ahead: value.ahead_by,
      files: value.files,
      behind: value.behind_by
    } : {
      kind: "same",
      text: "",
      ahead: 0,
      files: 0,
      behind: 0
    };
    const ready = !!(newPr.title.trim() && newPr.repo && newPr.base && newPr.head && !same && newPr.cmp && typeof newPr.cmp === "object" && newPr.cmp.ahead_by > 0);
    return {
      hasRepos: repos.length > 0,
      repo: newPr.repo,
      base: newPr.base,
      head: newPr.head,
      hasBranches: !!br,
      same,
      cmp,
      title: newPr.title,
      tpls: newPr.tpl[`${newPr.repo}|${newPr.base}`] ?? null,
      tplText: newPr.tplText,
      seq: npSeq,
      isDraft: !!newPr.draft,
      err: newPr.err || "",
      ready,
      meta: npMetaProps(newPr)
    };
  }
  function npMetaProps(newPr) {
    const repoMeta = newPr.meta?.[newPr.repo];
    if (!repoMeta) {
      return null;
    }
    const ppl = repoMeta.people.map((item) => item.login);
    const me = appState.me || "";
    const row2 = (npListKey, name, list) => ({
      k: npListKey,
      name,
      chips: newPr[npListKey].slice(),
      free: list.filter((text) => !newPr[npListKey].includes(text))
    });
    return {
      rows: [
        row2(
          "reviewers",
          "Reviewers",
          ppl.filter((text) => text !== me)
        ),
        row2("assignees", "Assignees", ppl),
        row2(
          "labels",
          "Labels",
          repoMeta.labels.map((item) => item.name)
        )
      ],
      milestones: repoMeta.milestones.map((item) => ({
        number: item.number,
        title: item.title,
        on: String(newPr.milestone) === String(item.number)
      })),
      issues: newPr.issues
    };
  }
  async function npLoadMeta(repo) {
    const newPr = appState.np;
    if (!repo || !tauri || newPr.meta[repo]) {
      return;
    }
    try {
      newPr.meta[repo] = await tauri.invoke("repo_meta", { repo });
    } catch {
      newPr.meta[repo] = { people: [], labels: [], milestones: [] };
    }
    if (appState.np === newPr) {
      rerender();
    }
  }
  async function npLoadBranches(repo) {
    const newPr = appState.np;
    npLoadMeta(repo);
    if (!repo || newPr.branches[repo]) {
      return npPickDefaults();
    }
    if (!tauri) {
      newPr.err = "Creating pull requests needs the desktop app.";
      return render();
    }
    try {
      newPr.branches[repo] = await tauri.invoke("list_branches", { repo });
      newPr.err = "";
    } catch (error) {
      newPr.err = String(error).replace(/^Error: /, "");
      newPr.branches[repo] = {
        default: "",
        branches: []
      };
    }
    npPickDefaults();
  }
  function npPickDefaults() {
    const newPr = appState.np;
    const branchInfo = newPr.branches[newPr.repo];
    if (!branchInfo) {
      return render();
    }
    if (!branchInfo.branches.includes(newPr.base)) {
      newPr.base = branchInfo.default || branchInfo.branches[0] || "";
    }
    if (!branchInfo.branches.includes(newPr.head) || newPr.head === newPr.base) {
      newPr.head = branchInfo.branches.find((text) => text !== newPr.base) || "";
    }
    npCompare();
  }
  async function npLoadTemplates() {
    const newPr = appState.np;
    if (!newPr.repo || !newPr.base || !tauri) {
      return;
    }
    const key2 = `${newPr.repo}|${newPr.base}`;
    if (newPr.tpl[key2] !== void 0) {
      return newPr.tpl[key2] ? npApplyTemplate() : void 0;
    }
    newPr.tpl[key2] = null;
    try {
      newPr.tpl[key2] = await tauri.invoke("pr_templates", {
        repo: newPr.repo,
        base: newPr.base
      });
    } catch {
      newPr.tpl[key2] = [];
    }
    if (appState.np === newPr && `${newPr.repo}|${newPr.base}` === key2) {
      npApplyTemplate();
    }
  }
  function npApplyTemplate() {
    const newPr = appState.np;
    const list = newPr.tpl[`${newPr.repo}|${newPr.base}`];
    const cur = (appState.draft.newpr || "").trim();
    if (list?.length && (!cur || cur === newPr.tplText.trim())) {
      appState.draft.newpr = newPr.tplText = list[0].body;
      saveDrafts();
    }
    rerender();
  }
  async function npCompare() {
    const newPr = appState.np;
    newPr.cmp = null;
    npLoadTemplates();
    if (!newPr.repo || !newPr.base || !newPr.head || newPr.base === newPr.head) {
      return rerender();
    }
    const key2 = `${newPr.repo}|${newPr.base}|${newPr.head}`;
    newPr.key = key2;
    newPr.cmp = "loading";
    rerender();
    try {
      const compareResult = await tauri.invoke("compare_branches", {
        repo: newPr.repo,
        base: newPr.base,
        head: newPr.head
      });
      if (appState.np.key !== key2) {
        return;
      }
      newPr.cmp = compareResult;
      if (!newPr.titleTouched) {
        newPr.title = compareResult.commits.length === 1 ? compareResult.commits[0] : npHuman(newPr.head);
      }
    } catch (error) {
      if (appState.np.key !== key2) {
        return;
      }
      newPr.cmp = String(error).replace(/^Error: /, "");
    }
    rerender();
  }
  function openNewPr(repo, head2) {
    const cur = typeof repo === "string" && repo || appState.bundle?.pull.base.repo.full_name || appState.repo || "";
    bumpNp();
    appState.view = "newpr";
    appState.nav = false;
    appState.np = {
      repo: cur,
      base: "",
      head: typeof head2 === "string" && head2 || "",
      branches: {},
      meta: {},
      reviewers: [],
      assignees: [],
      labels: [],
      milestone: "",
      issues: "",
      cmp: null,
      title: "",
      titleTouched: false,
      draft: false,
      err: "",
      key: "",
      tpl: {},
      tplText: ""
    };
    delete appState.draft.newpr;
    render();
    if (tauri && !appState.repos) {
      loadRepos().then(() => {
        if (!appState.np.repo && appState.repos?.[0]) {
          appState.np.repo = appState.repos[0].full_name;
        }
        npLoadBranches(appState.np.repo);
      });
    } else {
      npLoadBranches(cur);
    }
  }
  function openInbox() {
    appState.view = "inbox";
    appState.nav = false;
    render();
    if (!appState.inbox?.data || !qc.fresh("inbox", 45e3)) {
      qc.set("inbox", 1);
      loadInbox();
    }
  }
  var IB_SORTS = [
    ["updated", "Newest activity"],
    ["oldest", "Oldest activity"],
    ["comments", "Most comments"],
    ["repo", "Repository"],
    ["author", "Author"],
    ["title", "Title"]
  ];
  var ibCmp = (key2) => {
    const compare = (leftText, rightText) => leftText.localeCompare(rightText, void 0, { sensitivity: "base" });
    const at2 = (firstInboxItem, secondInboxItem) => secondInboxItem.updated_at > firstInboxItem.updated_at ? 1 : secondInboxItem.updated_at < firstInboxItem.updated_at ? -1 : 0;
    switch (key2) {
      case "oldest":
        return (firstInboxItem, secondInboxItem) => at2(secondInboxItem, firstInboxItem);
      case "comments":
        return (firstInboxItem, secondInboxItem) => (secondInboxItem.comments || 0) - (firstInboxItem.comments || 0) || at2(firstInboxItem, secondInboxItem);
      case "repo":
        return (firstInboxItem, secondInboxItem) => compare(firstInboxItem.repo, secondInboxItem.repo) || at2(firstInboxItem, secondInboxItem);
      case "author":
        return (firstInboxItem, secondInboxItem) => compare(firstInboxItem.user, secondInboxItem.user) || at2(firstInboxItem, secondInboxItem);
      case "title":
        return (firstInboxItem, secondInboxItem) => compare(firstInboxItem.title, secondInboxItem.title);
      default:
        return at2;
    }
  };
  var ibSecKey = (title) => `ib:${title}`;
  var IB_TITLES = [
    "Pinned",
    "Review requested",
    "Ready to merge",
    "Mentioned",
    "Participated",
    "Your pull requests",
    "Recently closed or merged",
    "Snoozed"
  ];
  var ibOrder = () => {
    const saved = appState.ibOrder || [];
    return [
      ...saved.includes("Pinned") ? [] : ["Pinned"],
      ...saved.filter((text) => IB_TITLES.includes(text)),
      ...IB_TITLES.filter((text) => !saved.includes(text) && text !== "Pinned")
    ];
  };
  function inboxProps() {
    const inboxState = appState.inbox || { loading: true };
    const inbox2 = inboxState.data;
    const query = (appState.ibQ || "").toLowerCase();
    const cmp = ibCmp(appState.ibSort || "updated");
    const pins = ibPins();
    const row2 = (inboxItem) => {
      const ref = `${inboxItem.repo}#${inboxItem.number}`;
      const was = seen[ref]?.at;
      return {
        ref,
        avatar: inboxItem.avatar,
        title: inboxItem.title,
        sub: `${ref} \xB7 ${inboxItem.user} \xB7 ${when(inboxItem.updated_at).replace(/<\/?span[^>]*>/g, "")}${inboxItem.draft ? " \xB7 Draft" : ""}`,
        fresh: !!(was && inboxItem.updated_at > was),
        comments: inboxItem.comments || 0,
        updated: inboxItem.updated_at,
        pinned: pins.includes(ref),
        snz: snoozeLabel(ref),
        sel: appState.ibSel === ref,
        snzOpen: appState.ibSnzOpen === ref
      };
    };
    const refOf = (inboxItem) => `${inboxItem.repo}#${inboxItem.number}`;
    const match = (inboxItem) => !query || `${inboxItem.title} ${inboxItem.repo} ${inboxItem.user} #${inboxItem.number}`.toLowerCase().includes(query);
    const lists = inbox2 ? [
      ["Review requested", "Waiting on you", inbox2.requested],
      ["Ready to merge", "Your approved pull requests", inbox2.ready],
      [
        "Mentioned",
        "Open PRs where you were @mentioned",
        inbox2.mentioned || []
      ],
      [
        "Participated",
        "Open PRs you commented on or reviewed",
        inbox2.participated || []
      ],
      ["Your pull requests", "Open PRs you opened", inbox2.mine],
      [
        "Recently closed or merged",
        "PRs you were involved in",
        inbox2.closed || []
      ]
    ] : [];
    const everything = /* @__PURE__ */ new Map();
    lists.forEach(
      ([, , inboxItems]) => inboxItems.forEach(
        (inboxItem) => everything.has(refOf(inboxItem)) || everything.set(refOf(inboxItem), inboxItem)
      )
    );
    const snoozed = [...everything.values()].filter(
      (inboxItem) => isSnoozed(refOf(inboxItem), inboxItem.updated_at)
    );
    const hidden = new Set(snoozed.map(refOf));
    const pinned = [...everything.values()].filter(
      (inboxItem) => pins.includes(refOf(inboxItem)) && !hidden.has(refOf(inboxItem))
    );
    const taken = /* @__PURE__ */ new Set([...hidden, ...pinned.map(refOf)]);
    const sec = (title, sub, list) => ({
      title,
      sub,
      key: ibSecKey(title),
      closed: !!appState.fold[ibSecKey(title)],
      rows: list.filter(match).sort(cmp).map(row2)
    });
    const all2 = inbox2 ? [
      ...pinned.length ? [sec("Pinned", "Kept on top", pinned)] : [],
      ...lists.map(
        ([text, otherText, inboxItems]) => sec(
          text,
          otherText,
          inboxItems.filter((inboxItem) => !taken.has(refOf(inboxItem)))
        )
      ),
      ...snoozed.length ? [
        sec(
          "Snoozed",
          "Hidden until their time is up or they have new activity",
          snoozed
        )
      ] : []
    ] : null;
    const order = ibOrder();
    return {
      loading: !!inboxState.loading,
      err: inboxState.err || "",
      sort: appState.ibSort || "updated",
      sorts: IB_SORTS,
      q: appState.ibQ || "",
      custom: !!appState.ibOrder?.length,
      views: ibViews().map((ibView) => ibView.name),
      view: appState.ibView || "",
      naming: !!appState.ibNaming,
      secs: all2 ? all2.sort(
        (leftItem, rightItem) => order.indexOf(leftItem.title) - order.indexOf(rightItem.title)
      ).map((item, index, items) => ({
        ...item,
        first: index === 0,
        last: index === items.length - 1,
        ro: roCls("ib", item.title)
      })) : null
    };
  }
  var needSignIn = () => tauri && appState.authChecked && !appState.hasToken || new URLSearchParams(location.search).get("gate") === "1";
  function scrollMain(top, smooth = false) {
    appState.mainTop = top;
    request("scroll:main", { top, smooth });
  }
  var gripDown = (event) => {
    event.preventDefault();
    const x0 = event.clientX;
    const w0 = appState.sbw;
    setDragging(true);
    beginDrag({
      move: (ev) => {
        appState.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0));
        repaintShell({ sbw: appState.sbw });
      },
      end: () => {
        setDragging(false);
        localStorage.setItem("sbw", String(Math.round(appState.sbw)));
      }
    });
  };
  var gripReset = () => {
    appState.sbw = 260;
    localStorage.setItem("sbw", "260");
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  };
  var scrimTap = () => {
    appState.nav = false;
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  };
  var repaintShell = (patch) => {
    const cur = shellProps();
    if (cur) {
      setShell({ ...cur, ...patch });
    }
  };
  var liveView = () => {
    if (appState.loading) {
      return /* @__PURE__ */ u3(Skeleton, {});
    }
    if (appState.view === "inbox") {
      return /* @__PURE__ */ u3(InboxView, {});
    }
    if (appState.view === "notes") {
      return /* @__PURE__ */ u3(NotesView, {});
    }
    if (appState.view === "repo") {
      return /* @__PURE__ */ u3(RepoView, {});
    }
    if (appState.view === "newpr") {
      return appState.np ? /* @__PURE__ */ u3(NewPrView, {}) : null;
    }
    if (appState.view === "pr" && appState.bundle) {
      return /* @__PURE__ */ u3(PrView, {});
    }
    return (appState.view === "home" || !appState.bundle) && appState.view !== "newpr" ? /* @__PURE__ */ u3(HomeView, {}) : null;
  };
  var followLink = (event) => {
    if (appState.view !== "pr") {
      return;
    }
    const element = event.target.closest(
      "a[href]"
    );
    if (!element) {
      return;
    }
    event.preventDefault();
    const hash = element.getAttribute("href");
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(hash)) {
      openPr(hash);
    } else if (/^https?:\/\//.test(hash)) {
      openExternal(hash);
    }
  };
  var shown = null;
  var shownPage = () => shown;
  function render() {
    if (needSignIn()) {
      shown = null;
      batch(() => {
        clearTop();
        setGate(
          /* @__PURE__ */ u3(
            Gate,
            {
              err: appState.gateErr ? String(appState.gateErr) : "",
              go: () => {
                tokenDialog();
                setTimeout(() => queryElement("#oauthgo")?.click(), 50);
              },
              tok: tokenDialog
            }
          )
        );
        paintDlg();
      });
      return;
    }
    const { stash } = appState;
    const live2 = stash ? stash.vnode : liveView();
    const ref = curRef();
    const key2 = appState.loading ? "loading" : appState.view === "pr" && appState.bundle ? `pr:${ref}` : appState.view || "home";
    if (appState.view === "pr" && appState.bundle && !appState.loading && live2) {
      shown = { ref, vnode: live2 };
    }
    const kept = [...appState.alive].filter(([text]) => `pr:${text}` !== key2).map(([text, alive]) => ({ key: `pr:${text}`, children: alive.vnode }));
    batch(() => {
      paintTop();
      setShell({
        nav: !!appState.nav,
        navHidden: !!appState.hide.nav,
        sbw: appState.sbw,
        lw: appState.lw,
        fade: !!appState.fadeMain,
        enter: !!appState.enter,
        stuck: !!appState.stuck,
        active: { key: key2, children: live2 },
        onPage: followLink,
        onGrip: (event) => gripDown(event),
        onGripReset: () => gripReset(),
        onScrim: () => scrimTap(),
        onScroll: (event) => scrolled("main", event.currentTarget),
        onMeasure: (el) => {
          if (appState.scrollId === "main" || !appState.scrollId) {
            scrollBtn(el);
          }
        },
        kept
      });
      paintSide();
      paintDlg();
      paintNotes();
    });
    appState.stash = null;
    (appState.ios || []).forEach((observer) => observer.disconnect());
    appState.ios = [];
    bindSticky();
    if (appState.fadeMain) {
      appState.fadeMain = false;
    }
    syncUnread();
    document.title = appState.bundle ? `${appState.bundle.pull.title} \xB7 ${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "GitHub PR View";
  }

  // src/app/addressbar.ts
  var AC = { rows: [], sel: -1, nav: false, prs: {}, rect: null };
  function acRows(query) {
    const text = query.trim();
    const lq = text.toLowerCase();
    const rows = [];
    const seen2 = /* @__PURE__ */ new Set();
    const add = (acRow) => {
      if (!seen2.has(acRow.ref || acRow.fill)) {
        seen2.add(acRow.ref || acRow.fill);
        rows.push(acRow);
      }
    };
    if (/^https?:\/\//i.test(text)) {
      return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(text) ? [
        {
          ref: text,
          label: `Open ${text.replace(/^https?:\/\/github\.com\//, "")}`,
          sub: "Go to this pull request",
          ic: "git-pull-request"
        }
      ] : [];
    }
    const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);
    const known = [
      ...appState.tabs.map((tab) => ({
        ref: tab.ref,
        title: tab.title,
        state: tab.state,
        ic: tab.icon
      })),
      ...appState.recent.map((recentEntry) => ({
        ref: recentEntry.ref,
        title: recentEntry.title,
        state: recentEntry.state,
        ic: recentEntry.icon
      }))
    ];
    if (pr) {
      const repo = pr[1];
      const num = pr[2];
      if (num) {
        add({
          ref: `${text.split("#")[0]}#${num}`,
          label: `Open ${text.split("#")[0]}#${num}`,
          sub: "Go to this pull request",
          ic: "git-pull-request"
        });
      }
      const fromApi = (AC.prs[repo] || []).map((prListItem) => ({
        ref: `${prListItem.base?.repo?.full_name || repo}#${prListItem.number}`,
        title: prListItem.title,
        state: prListItem.merged_at ? "merged" : prListItem.state,
        ic: "git-pull-request"
      }));
      [
        ...known.filter((item) => item.ref.toLowerCase().startsWith(`${repo}#`)),
        ...fromApi
      ].filter((item) => item.ref.toLowerCase().split("#")[1].startsWith(num)).slice(0, 8).forEach(
        (item) => add({
          ref: item.ref,
          label: item.title || item.ref,
          sub: item.ref,
          ic: item.ic || "git-pull-request",
          state: item.state
        })
      );
      return rows.slice(0, 9);
    }
    known.filter(
      (item) => !lq || `${item.ref} ${item.title}`.toLowerCase().includes(lq)
    ).slice(0, lq ? 6 : 8).forEach(
      (item) => add({
        ref: item.ref,
        label: item.title || item.ref,
        sub: item.ref,
        ic: item.ic || "git-pull-request",
        state: item.state
      })
    );
    if (lq && appState.repos) {
      appState.repos.filter((repoSummary) => repoSummary.full_name.toLowerCase().includes(lq)).sort(
        (firstRepoSummary, secondRepoSummary) => (secondRepoSummary.full_name.toLowerCase().startsWith(lq) ? 1 : 0) - (firstRepoSummary.full_name.toLowerCase().startsWith(lq) ? 1 : 0)
      ).slice(0, 6).forEach(
        (repoSummary) => add({
          fill: `${repoSummary.full_name}#`,
          label: repoSummary.full_name,
          sub: "Repository: pick a pull request",
          ic: repoSummary.private ? "lock" : "repo"
        })
      );
    }
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
    if (!appState.addrFocus || !AC.rect) {
      return acClose();
    }
    const query = appState.addrText ?? "";
    AC.rows = acRows(query);
    const match = query.trim().toLowerCase().match(/^([^#\s]+\/[^#\s]+)#\d*$/);
    if (match && AC.prs[match[1]] === void 0 && tauri) {
      AC.prs[match[1]] = null;
      tauri.invoke("list_prs", { repo: match[1], state: "all" }).then((prListItems) => {
        AC.prs[match[1]] = prListItems;
        acDraw();
      }).catch(() => {
        AC.prs[match[1]] = [];
      });
    }
    if (!AC.rows.length) {
      return acClose();
    }
    AC.sel = Math.min(AC.sel, AC.rows.length - 1);
    const rect = AC.rect;
    OV.ac = {
      rows: AC.rows,
      sel: AC.sel,
      left: rect.left,
      top: rect.bottom + 6,
      width: rect.width,
      pick: acPick
    };
    paintOv();
  }
  var setText = (text) => {
    appState.addrText = text;
    paintTop();
  };
  function acPick(acRow) {
    if (!acRow) {
      return;
    }
    if (acRow.fill) {
      setText(acRow.fill);
      focusTarget("addr", "focus");
      AC.sel = -1;
      acDraw();
      return;
    }
    acClose();
    appState.addrText = null;
    paintTop();
    focusTarget("addr", "blur");
    openPr(acRow.ref);
  }
  var addrSubmit = (event) => {
    event.preventDefault();
    const text = appState.addrText ?? curText();
    appState.addrText = null;
    acClose();
    focusTarget("addr", "blur");
    openPr(text);
  };
  var curText = () => appState.bundle ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}` : "";
  var addrInput = (event) => {
    const el = event.currentTarget;
    AC.rect = el.closest(".addr").getBoundingClientRect();
    AC.sel = -1;
    setText(el.value);
    acDraw();
  };
  var addrFocus = (event) => {
    const el = event.currentTarget;
    AC.rect = el.closest(".addr").getBoundingClientRect();
    appState.addrFocus = true;
    AC.sel = -1;
    setTimeout(acDraw, 0);
  };
  var addrBlur = () => {
    appState.addrFocus = false;
    setTimeout(() => {
      if (!appState.addrFocus) {
        appState.addrText = null;
        paintTop();
        acClose();
      }
    }, 120);
  };
  function addrKey(event) {
    if (!OV.ac) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const count = AC.rows.length;
      AC.sel = event.key === "ArrowDown" ? (AC.sel + 1) % count : (AC.sel - 1 + count) % count;
      acDraw();
    } else if (event.key === "Tab" && AC.rows.length) {
      event.preventDefault();
      const acRow = AC.rows[Math.max(0, AC.sel)];
      if (acRow.fill) {
        acPick(acRow);
      } else {
        setText(acRow.ref);
        AC.sel = -1;
        acDraw();
      }
    } else if (event.key === "Enter" && AC.sel >= 0) {
      event.preventDefault();
      acPick(AC.rows[AC.sel]);
    } else if (event.key === "Escape") {
      acClose();
    }
  }
  function winDrag(event) {
    const element = event.target;
    const win = window.__TAURI__?.window?.getCurrentWindow?.();
    if (event.button !== 0 || element.closest(
      "button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop"
    )) {
      return;
    }
    event.preventDefault();
    if (event.detail === 2) {
      win?.toggleMaximize?.();
    } else {
      win?.startDragging?.();
    }
  }
  function bpAway(event) {
    if (OV.bp && !event.target.closest("#bppop")) {
      bpClose();
    }
  }
  function bpClose() {
    if (OV.bp) {
      OV.bp = null;
      paintOv();
    }
  }
  function bpAge(text) {
    if (!text) {
      return "";
    }
    const minutes = Math.max(
      1,
      Math.round((Date.now() - +new Date(text)) / 6e4)
    );
    return minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.round(minutes / 60)}h` : minutes < 43200 ? `${Math.round(minutes / 1440)}d` : `${Math.round(minutes / 43200)}mo`;
  }
  function bpGroups(br, query, me) {
    const det = new Map((br.details || []).map((item) => [item.name, item]));
    const rank = new Map(br.branches.map((text, index) => [text, index]));
    const all2 = br.branches.map((name) => ({
      name,
      at: det.get(name)?.at || "",
      by: det.get(name)?.by || ""
    })).sort(
      (firstItem, secondItem) => secondItem.at > firstItem.at ? 1 : secondItem.at < firstItem.at ? -1 : rank.get(firstItem.name) - rank.get(secondItem.name)
    );
    if (query) {
      const text = query.toLowerCase();
      return [["", all2.filter((item) => item.name.toLowerCase().includes(text))]];
    }
    const out = [];
    const used = /* @__PURE__ */ new Set();
    const take = (handler) => all2.filter(
      (item) => !used.has(item.name) && handler(item) && used.add(item.name)
    );
    const def = take((bpRow) => bpRow.name === br.default);
    if (def.length) {
      out.push(["Default", def]);
    }
    const mine = me ? take((bpRow) => bpRow.by && bpRow.by.toLowerCase() === me.toLowerCase()) : [];
    if (mine.length) {
      out.push(["Your branches", mine]);
    }
    const rest = take(() => true);
    const pre = /* @__PURE__ */ new Map();
    rest.forEach((item) => {
      const key2 = item.name.includes("/") ? `${item.name.split("/")[0]}/` : "";
      (pre.get(key2) || pre.set(key2, []).get(key2)).push(item);
    });
    const single = [];
    [...pre.entries()].sort(
      (firstItem, secondItem) => secondItem[1].length - firstItem[1].length || firstItem[0].localeCompare(secondItem[0])
    ).forEach(([key2, bpRows]) => {
      if (key2 && bpRows.length > 1) {
        out.push([key2, bpRows]);
      } else {
        single.push(...bpRows);
      }
    });
    if (single.length) {
      out.push([
        out.length ? "Other" : "",
        single.sort(
          (firstBpRow, secondBpRow) => secondBpRow.at > firstBpRow.at ? 1 : secondBpRow.at < firstBpRow.at ? -1 : 0
        )
      ]);
    }
    return out;
  }
  function rpGroups(repos, query, me) {
    const all2 = repos.filter((repoSummary) => !repoSummary.archived).map((repoSummary) => ({
      name: repoSummary.full_name,
      at: repoSummary.pushed_at || "",
      by: repoSummary.private ? "private" : ""
    })).sort(
      (firstItem, secondItem) => secondItem.at > firstItem.at ? 1 : secondItem.at < firstItem.at ? -1 : 0
    );
    if (query) {
      const text = query.toLowerCase();
      return [["", all2.filter((item) => item.name.toLowerCase().includes(text))]];
    }
    const out = [];
    const recent = all2.slice(0, 5);
    const used = new Set(recent.map((item) => item.name));
    if (recent.length) {
      out.push(["Recently pushed", recent]);
    }
    const by = /* @__PURE__ */ new Map();
    all2.filter((item) => !used.has(item.name)).forEach((item) => {
      const option = item.name.split("/")[0];
      (by.get(option) || by.set(option, []).get(option)).push(item);
    });
    [...by.entries()].sort(
      (firstItem, secondItem) => +(secondItem[0].toLowerCase() === me.toLowerCase()) - +(firstItem[0].toLowerCase() === me.toLowerCase()) || secondItem[1].length - firstItem[1].length
    ).forEach(([option, bpRows]) => out.push([option, bpRows]));
    return out;
  }
  function bpOpen(btn, side, pick, repoMode = false) {
    bpClose();
    const newPr = appState.np;
    const br = repoMode ? null : newPr.branches[newPr.repo];
    if (!repoMode && !br) {
      return;
    }
    const cur = repoMode ? newPr.repo : newPr[side];
    const me = appState.profile?.login || "";
    const rect = btn.getBoundingClientRect();
    const width = Math.max(rect.width, 340);
    const below = innerHeight - rect.bottom;
    const up = below < 300 && rect.top > below;
    const style = `left:${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px;width:${width}px;max-height:${Math.min(420, (up ? rect.top : below) - 16)}px;${up ? `bottom:${innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`}`;
    const done = (value) => {
      bpClose();
      if (value && value !== cur) {
        pick(value);
      }
    };
    OV.bp = {
      repoMode,
      style,
      cur,
      age: bpAge,
      done,
      groupsFor: (query) => repoMode ? rpGroups(appState.repos || [], query, me) : bpGroups(br, query, me)
    };
    paintOv();
  }
  var avUrl = (url, count) => `${url}${url.includes("?") ? "&" : "?"}s=${count}`;
  function loadProfile() {
    if (!tauri) {
      return;
    }
    tauri.invoke("viewer_profile").then((profile) => {
      appState.me = profile.login;
      appState.profile = profile;
      try {
        localStorage.setItem("profile", JSON.stringify(profile));
      } catch {
      }
      render();
    }).catch(() => {
    });
  }
  var openExternal = (url) => tauri ? tauri.invoke("open_external", { url }) : window.open(url, "_blank");
  function openFromList(ref, newTab) {
    const have = appState.tabs.some((tab) => tab.ref === ref);
    if (have && !appState.focus) {
      if (ref === curRef()) {
        appState.tabMenu = false;
        return;
      }
      return openTab2(ref);
    }
    return newTab ? openTab2(ref, { newTab: true }) : openPr(ref);
  }
  var stuckOn = null;
  function bindSticky() {
    const ta = queryElement(".pr-title-area");
    const tb2 = queryElement(".pr-tabs");
    if (ta && ta === stuckOn && appState.ios?.length) {
      return;
    }
    stuckOn = ta;
    if (ta && tb2 && !queryElement(".is-split")) {
      const io = new IntersectionObserver(
        ([en]) => {
          const flag = !en.isIntersecting && en.boundingClientRect.bottom < 0;
          if (!!appState.stuck !== flag) {
            appState.stuck = flag;
            repaintShell({ stuck: flag });
          }
        },
        { root: queryElement(".main"), threshold: 0 }
      );
      io.observe(ta);
      appState.ios.push(io);
    }
  }

  // src/app/actions.ts
  var peopleList = () => {
    const bundle = appState.bundle;
    if (!bundle) {
      return [];
    }
    const names = /* @__PURE__ */ new Set();
    [
      bundle.pull.user,
      ...bundle.timeline.map(
        (timelineEvent) => timelineEvent.user || timelineEvent.actor || timelineEvent.author
      ),
      ...bundle.review_comments.map((reviewComment) => reviewComment.user)
    ].forEach((value) => value?.login && names.add(value.login));
    return [...names];
  };
  var drafts = load(
    "drafts",
    {}
  );
  function saveDrafts() {
    if (!appState.draftRef) {
      return;
    }
    const item = Object.fromEntries(
      Object.entries(appState.draft).filter(([, value]) => value && value.trim())
    );
    if (Object.keys(item).length) {
      drafts[appState.draftRef] = item;
    } else {
      delete drafts[appState.draftRef];
    }
    try {
      localStorage.setItem("drafts", JSON.stringify(drafts));
    } catch {
    }
  }
  var prRef = () => ({
    repo: appState.bundle.pull.base.repo.full_name,
    number: appState.bundle.pull.number
  });
  var errMsg = (key2) => appState.actErr && appState.actErr.k === key2 ? appState.actErr.m : "";
  function composerProps(bundle) {
    const pull = bundle.pull;
    const closed = pull.state === "closed";
    const busy = appState.busy === "comment";
    const open2 = busy || appState.cOpen === true;
    const dr = (appState.draft.comment || "").trim();
    return {
      open: open2,
      draft: dr ? dr.replace(/\s+/g, " ").slice(0, 60) : "",
      err: errMsg("comment"),
      merged: !!pull.merged,
      closed,
      busy
    };
  }
  var mergeMethod = () => {
    const am = appState.bundle?.pull.auto_merge;
    return am ? { MERGE: "merge", SQUASH: "squash", REBASE: "rebase" }[am.merge_method] || "merge" : "merge";
  };
  function mergeActProps(bundle) {
    const pull = bundle.pull;
    if (pull.merged || pull.state === "closed") {
      return null;
    }
    const busy = appState.busy === "merge";
    const am = pull.auto_merge;
    const blocked = pull.mergeable_state !== "clean" && pull.mergeable_state !== "unstable";
    return {
      draft: !!pull.draft,
      err: errMsg("merge"),
      method: appState.method || mergeMethod(),
      busy,
      auto: am ? {
        method: am.merge_method.toLowerCase(),
        busy: appState.busy === "disable_automerge"
      } : null,
      canAuto: blocked,
      autoBusy: appState.busy === "automerge",
      errAuto: errMsg("automerge")
    };
  }
  function closeDlg() {
    const dlg = appState.dlg;
    if (!dlg) {
      return;
    }
    if (dlg.k === "editpr") {
      delete appState.draft.prbody;
    } else if (dlg.k === "editc") {
      delete appState.draft.editc;
    } else if (dlg.k === "commits") {
      appState.cpick = null;
    } else if (dlg.k === "token") {
      appState.oauthLive = false;
    }
    appState.dlg = null;
    render();
  }
  function reviewDialog() {
    appState.dlg = {
      k: "review",
      ev: "COMMENT",
      ok: async () => {
        const { ev } = appState.dlg;
        const lines = pendList().map(({ path, line, side, body }) => ({
          path,
          line,
          side,
          body
        }));
        const actResult = await act(
          "review",
          { body: appState.draft.review || "", event: ev, extra: lines },
          "review",
          true
        );
        if (actResult === void 0) {
          return;
        }
        delete appState.draft.review;
        delete appState.pending[pendKey()];
        savePending();
        appState.dlg = null;
        await refreshPr();
      }
    };
    render();
  }
  function editPrDialog() {
    const pull = appState.bundle.pull;
    appState.draft.prbody = pull.body || "";
    appState.dlg = {
      k: "editpr",
      title: pull.title,
      ok: async () => {
        const { title } = appState.dlg;
        const actResult = await act(
          "edit",
          { body: appState.draft.prbody ?? "", extra: { title } },
          "editpr",
          true
        );
        if (actResult === void 0) {
          return;
        }
        delete appState.draft.prbody;
        appState.dlg = null;
        await refreshPr();
      }
    };
    render();
  }
  async function previewDraft(key2) {
    const md = (appState.draft[key2] || "").trim();
    if (!md) {
      return null;
    }
    try {
      if (!tauri) {
        throw new Error("offline");
      }
      const repo = appState.bundle?.pull.base.repo.full_name || appState.np?.repo || null;
      return { html: await tauri.invoke("render_markdown", { text: md, repo }) };
    } catch (error) {
      return { raw: md, err: String(error).replace(/^Error: /, "") };
    }
  }
  function confirmDlg(title, text, label, danger, fn) {
    appState.dlg = {
      k: "confirm",
      title,
      text,
      label,
      danger,
      ok: async () => {
        appState.dlg = null;
        render();
        await fn();
      }
    };
    render();
  }
  var noteClick = (event) => {
    const element = event.target.closest?.("button");
    appState.lastSel = element ? btnSel(element) : null;
  };
  var btnSel = (element) => {
    if (element.id) {
      return `#${element.id}`;
    }
    const attr = [...element.attributes].find(
      (otherAttr) => otherAttr.name.startsWith("data-")
    );
    return attr ? `button[${attr.name}="${CSS.escape(attr.value)}"]` : null;
  };
  var propSel = (lookup) => {
    if (lookup.id) {
      return `#${String(lookup.id)}`;
    }
    const key2 = Object.keys(lookup).find(
      (text) => text.startsWith("data-") && lookup[text] != null
    );
    return key2 ? `button[${key2}="${CSS.escape(String(lookup[key2]))}"]` : null;
  };
  var prevVnode = l.vnode;
  l.vnode = (node) => {
    if (node.type === "button" && appState.busySels?.length) {
      const lookup = node.props;
      const sel = propSel(lookup);
      if (sel && appState.busySels.includes(sel)) {
        lookup.class = `${String(lookup.class ?? lookup.className ?? "")} is-busy`.trim();
        delete lookup.className;
        lookup.disabled = true;
        lookup["aria-busy"] = "true";
      }
    }
    prevVnode?.(node);
  };
  var setBusy = (sel, on3) => {
    if (!sel) {
      return;
    }
    const lines = appState.busySels ||= [];
    const index = lines.indexOf(sel);
    if (on3) {
      lines.push(sel);
    } else if (index >= 0) {
      lines.splice(index, 1);
    } else {
      return;
    }
    rerender();
  };
  appState.mine = {};
  var getMine = (kind, rid) => appState.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke("my_reactions", { ...prRef(), kind, id: +rid }).then((lines) => new Set(lines)).catch(() => {
    delete appState.mine[`${kind}:${rid}`];
    return /* @__PURE__ */ new Set();
  }) : Promise.resolve(/* @__PURE__ */ new Set());
  async function toggleReact(kind, rid, color) {
    const mine = (await getMine(kind, rid)).has(color);
    const bundle = appState.bundle;
    const tgt = kind === "pr" ? bundle.pull : [...bundle.timeline, ...bundle.review_comments].find(
      (value) => String(value.id) === String(rid)
    );
    const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null;
    const base = prev ? prev[color] || 0 : 0;
    const bump = (count) => {
      if (tgt) {
        tgt.reactions = {
          ...tgt.reactions || {},
          [color]: Math.max(0, base + count)
        };
      }
    };
    bump(mine ? -1 : 1);
    appState.refreshing = true;
    rerender();
    const actResult = await act(
      "react",
      { kind, id: +rid, content: color },
      "react"
    );
    if (actResult === void 0) {
      if (tgt && prev) {
        tgt.reactions = prev;
      }
      appState.refreshing = false;
      rerender();
      return;
    }
    const set = await getMine(kind, rid);
    if (actResult.added === false) {
      set.delete(color);
    } else {
      set.add(color);
    }
    await refreshPr(kind === "pr" ? "" : rid);
  }
  async function act(action, args, key2, inDialog = false) {
    const sel = appState.lastSel ?? null;
    setBusy(sel, true);
    try {
      return await act2(action, args, key2, inDialog);
    } finally {
      setBusy(sel, false);
    }
  }
  async function act2(action, args, key2, inDialog = false) {
    appState.actErr = null;
    if (!tauri) {
      appState.actErr = { k: key2, m: "Writing needs the desktop app." };
      render();
      return void 0;
    }
    appState.busy = key2;
    if (!inDialog) {
      render();
    }
    try {
      const value = action === "react" ? await tauri.invoke("toggle_reaction", {
        ...prRef(),
        kind: args.kind,
        id: args.id,
        content: args.content
      }) : await tauri.invoke("pr_action", {
        ...prRef(),
        action,
        body: null,
        id: null,
        event: null,
        method: null,
        kind: null,
        content: null,
        extra: null,
        ...args
      });
      appState.busy = "";
      if (action === "merge" || action === "review" && args.event === "APPROVE") {
        confetti();
      }
      return value ?? {};
    } catch (error) {
      appState.busy = "";
      appState.actErr = { k: key2, m: String(error).replace(/^Error: /, "") };
      render();
      return void 0;
    }
  }
  var refreshPr = (focus = "") => {
    qc.invalidate(`${prRef().repo}#${prRef().number}`);
    saveDrafts();
    appState.focus = focus ? String(focus) : "";
    return openPr(`${prRef().repo}#${prRef().number}`, {
      nav: true,
      keepTab: true
    });
  };
  function editCommentDialog(value, kind) {
    appState.draft.editc = value.body || "";
    appState.dlg = {
      k: "editc",
      ok: async () => {
        const actResult = await act(
          "edit_comment",
          { id: value.id, kind, body: appState.draft.editc ?? "" },
          "editc",
          true
        );
        if (actResult === void 0) {
          return;
        }
        delete appState.draft.editc;
        appState.dlg = null;
        await refreshPr(value.id);
      }
    };
    render();
  }
  function deleteCommentDialog(item, kind) {
    appState.dlg = {
      k: "delc",
      ok: async () => {
        const actResult = await act(
          "delete_comment",
          { id: item.id, kind },
          "delc",
          true
        );
        if (actResult === void 0) {
          return;
        }
        appState.dlg = null;
        await refreshPr();
      }
    };
    render();
  }
  function hideCommentDialog(item) {
    const reasons = [
      ["SPAM", "Spam"],
      ["ABUSE", "Abuse"],
      ["OFF_TOPIC", "Off-topic"],
      ["OUTDATED", "Outdated"],
      ["DUPLICATE", "Duplicate"],
      ["RESOLVED", "Resolved"]
    ];
    appState.hideReason = "OUTDATED";
    appState.dlg = {
      k: "hidec",
      reasons,
      ok: async () => {
        const actResult = await act(
          "minimize",
          {
            body: item.node_id || "",
            content: appState.hideReason || "OUTDATED"
          },
          "hidec",
          true
        );
        if (actResult === void 0) {
          return;
        }
        appState.fold[`c:${item.id}`] = true;
        localStorage.setItem("fold", JSON.stringify(appState.fold));
        appState.dlg = null;
        await refreshPr();
      }
    };
    render();
  }
  function cmAction(id, root, how) {
    const bundle = appState.bundle;
    const value = [...bundle.timeline, ...bundle.review_comments].find(
      (otherValue) => String(otherValue.id) === String(id)
    ) || (String(bundle.pull.id) === String(id) ? bundle.pull : null);
    if (!value) {
      return;
    }
    if (how === "link") {
      return navigator.clipboard?.writeText(value.html_url || "");
    }
    if (how === "md") {
      return navigator.clipboard?.writeText(value.body || "");
    }
    const kind = value === bundle.pull ? "pr" : bundle.review_comments.includes(value) ? "review_comment" : "issue_comment";
    if (how === "issue") {
      const text = prRef().repo;
      return openExternal(
        `https://github.com/${text}/issues/new?body=${encodeURIComponent(`Reference: ${value.html_url || ""}

`)}`
      );
    }
    if (how === "edit") {
      return kind === "pr" ? editPrDialog() : editCommentDialog(value, kind);
    }
    if (how === "hide") {
      return hideCommentDialog(value);
    }
    if (how === "del") {
      return deleteCommentDialog(value, kind);
    }
    const key2 = root ? `reply-${root}` : "comment";
    const query = (value.body || "").split("\n").map((line) => `> ${line}`).join("\n");
    appState.draft[key2] = `${appState.draft[key2] ? `${appState.draft[key2]}

` : ""}@${(value.user || value.actor || {}).login || ""}

${query}

`;
    saveDrafts();
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
    syncDraft(key2);
    setTimeout(() => scrollDraft(key2), 50);
  }
  function addLocal(kind, value, rootId) {
    const bundle = appState.bundle;
    if (!bundle || !value || !value.id || !value.body_html) {
      return false;
    }
    if (kind === "commented") {
      bundle.timeline.push({ ...value, event: "commented", actor: value.user });
    } else {
      const root = bundle.review_comments.find(
        (reviewComment) => reviewComment.id === rootId
      );
      if (!root) {
        return false;
      }
      bundle.review_comments.push({
        ...value,
        pull_request_review_id: root.pull_request_review_id,
        path: root.path,
        diff_hunk: root.diff_hunk,
        position: root.position,
        original_position: root.original_position
      });
    }
    qc.set(`${prRef().repo}#${prRef().number}`, bundle);
    qc.invalidate(`${prRef().repo}#${prRef().number}`);
    qc.m.get(`${prRef().repo}#${prRef().number}`).at = Date.now() - 2e4;
    appState.focus = "";
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
    setFlash(`c-${value.id}`, { block: "start", pop: true });
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
    return true;
  }
  async function rerequestReview(event, login) {
    const element = event.currentTarget;
    event.stopPropagation();
    const sel = btnSel(element);
    setBusy(sel, true);
    try {
      const actResult = await act("rerequest", { body: login }, "rerequest");
      if (actResult === void 0) {
        alert(appState.actErr?.m || "Could not re-request review.");
        return;
      }
      await refreshPr();
    } finally {
      setBusy(sel, false);
    }
  }
  var composerOpen = () => appState.busy === "comment" || appState.cOpen === true;
  function toggleComposer() {
    setComposer(!composerOpen(), true);
  }
  function cbarKey(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }
  async function sendComment() {
    const actResult = await act(
      "comment",
      { body: appState.draft.comment || "" },
      "comment"
    );
    if (actResult === void 0) {
      return;
    }
    delete appState.draft.comment;
    appState.cOpen = false;
    if (!addLocal("commented", actResult)) {
      await refreshPr(actResult.id);
    }
  }
  function toggleClosed() {
    const closed = appState.bundle.pull.state === "closed";
    confirmDlg(
      closed ? "Reopen this pull request?" : "Close this pull request?",
      closed ? "It will be open for review again." : "It will be closed without merging. You can reopen it later.",
      closed ? "Reopen" : "Close pull request",
      !closed,
      async () => {
        const actResult = await act(closed ? "reopen" : "close", {}, "close");
        if (actResult !== void 0) {
          await refreshPr();
        }
      }
    );
  }
  function toggleMb(event, key2) {
    if (event.target.closest("#rerunck")) {
      return;
    }
    appState.mbOpen = appState.mbOpen || /* @__PURE__ */ new Set();
    if (appState.mbOpen.has(key2)) {
      appState.mbOpen.delete(key2);
    } else {
      appState.mbOpen.add(key2);
    }
    rerender();
  }
  async function rerunChecks(event) {
    event.stopPropagation();
    const urls = (appState.bundle.checks || []).filter((check) => checkState(check) === "fail" && check.url).map((check) => check.url);
    const sel = btnSel(event.currentTarget);
    setBusy(sel, true);
    try {
      const actResult = await act("rerun", { extra: urls }, "rerun");
      if (actResult !== void 0) {
        appState.actErr = null;
        await refreshPr();
      }
    } finally {
      setBusy(sel, false);
    }
  }
  async function updateBranch() {
    const actResult = await act("update_branch", {}, "update_branch");
    if (actResult !== void 0) {
      await refreshPr();
    }
  }
  async function markReady() {
    const actResult = await act("ready", {}, "ready");
    if (actResult !== void 0) {
      await refreshPr();
    }
  }
  function toDraft() {
    confirmDlg(
      "Convert to draft?",
      "Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.",
      "Convert to draft",
      false,
      async () => {
        const actResult = await act("draft", {}, "merge");
        if (actResult !== void 0) {
          await refreshPr();
        }
      }
    );
  }
  async function enableAuto() {
    const actResult = await act(
      "automerge",
      { method: appState.method || mergeMethod() },
      "automerge"
    );
    if (actResult !== void 0) {
      await refreshPr();
    }
  }
  async function disableAuto() {
    const actResult = await act("disable_automerge", {}, "automerge");
    if (actResult !== void 0) {
      await refreshPr();
    }
  }
  function doMerge() {
    const message = appState.method || mergeMethod();
    const pull = appState.bundle.pull;
    const names = {
      merge: "merge commit",
      squash: "squash and merge",
      rebase: "rebase and merge"
    };
    confirmDlg(
      "Merge this pull request?",
      `${pull.head.label} will be merged into ${pull.base.label} using ${names[message]}. This changes the repository and cannot be undone from here.`,
      "Merge",
      false,
      async () => {
        const actResult = await act("merge", { method: message }, "merge");
        if (actResult !== void 0) {
          await refreshPr();
        }
      }
    );
  }
  function cmMenu(event, btn) {
    event.stopPropagation();
    const bb = appState.bundle;
    const cc = String(bb.pull.id) === String(btn.dataset.cm) ? bb.pull : [...bb.timeline, ...bb.review_comments].find(
      (value) => String(value.id) === String(btn.dataset.cm)
    );
    const isPr = cc === bb.pull;
    const own = !!appState.me && (cc?.user || cc?.actor)?.login === appState.me;
    const rect = btn.getBoundingClientRect();
    const id = +btn.dataset.cm;
    const root = btn.dataset.root;
    openPop({
      k: "cm",
      x: Math.min(rect.left - 100, innerWidth - 180),
      y: rect.bottom + 4,
      hr: own || !isPr && !!appState.hasToken,
      edit: own,
      hide: !isPr && !!appState.hasToken,
      del: own && !isPr,
      pick: (hash) => {
        closePop();
        cmAction(id, root, hash);
      }
    });
  }
  function reactAdd(event, btn) {
    event.stopPropagation();
    const rect = btn.getBoundingClientRect();
    const kind = btn.dataset.rk;
    const id = btn.dataset.rid;
    openPop({
      k: "react",
      x: Math.min(rect.left, innerWidth - 300),
      y: Math.min(rect.bottom + 4, innerHeight - 60),
      pick: (color) => {
        closePop();
        toggleReact(kind, id, color);
      }
    });
  }
  function reactToggle(event, kind, id, color) {
    event.stopPropagation();
    toggleReact(kind, id, color);
  }
  async function threadAct(event, node, how) {
    event.stopPropagation();
    const bundle = appState.bundle;
    const root = Object.keys(bundle.thread_ids || {}).find(
      (key2) => bundle.thread_ids[key2] === node
    );
    const ids = [
      Number(root),
      ...bundle.review_comments.filter(
        (reviewComment) => String(reviewComment.in_reply_to_id) === String(root)
      ).map((reviewComment) => reviewComment.id)
    ].filter(Boolean);
    const prev = [...bundle.resolved_ids || []];
    const res = how === "resolve";
    bundle.resolved_ids = res ? [.../* @__PURE__ */ new Set([...prev, ...ids])] : prev.filter((left) => !ids.includes(left));
    rerender();
    const actResult = await act(how, { body: node }, "thread", true);
    if (actResult === void 0) {
      bundle.resolved_ids = prev;
      rerender();
      alert(appState.actErr?.m || "Could not update the thread.");
      return;
    }
    refreshPr();
  }
  function applySuggestion(event, id) {
    event.stopPropagation();
    const bundle = appState.bundle;
    const reviewComment = bundle.review_comments.find(
      (otherReviewComment) => String(otherReviewComment.id) === id
    );
    if (!reviewComment) {
      return;
    }
    confirmDlg(
      "Apply suggestion?",
      `This commits the change to ${reviewComment.path} on ${bundle.pull.head.ref}.`,
      "Commit suggestion",
      false,
      async () => {
        (appState.applied ||= /* @__PURE__ */ new Set()).add(String(reviewComment.id));
        rerender();
        const actResult = await act(
          "suggest",
          {
            extra: {
              head_repo: bundle.pull.head.repo.full_name,
              branch: bundle.pull.head.ref,
              path: reviewComment.path,
              line: reviewComment.line,
              start_line: reviewComment.start_line || null,
              text: sugOf(reviewComment)
            }
          },
          "sug",
          true
        );
        if (actResult === void 0) {
          appState.applied.delete(String(reviewComment.id));
          rerender();
          alert(appState.actErr?.m || "Could not apply the suggestion.");
          return;
        }
        refreshPr().finally(() => {
          appState.applied.delete(String(reviewComment.id));
        });
      }
    );
  }
  async function sendReply(id) {
    const actResult = await act(
      "reply",
      { id: +id, body: appState.draft[`reply-${id}`] || "" },
      `reply-${id}`
    );
    if (actResult === void 0) {
      return;
    }
    delete appState.draft[`reply-${id}`];
    if (!addLocal("reply", actResult, +id)) {
      await refreshPr(actResult.id);
    }
  }
  function setDiffMode(message) {
    appState.diffMode = message;
    localStorage.setItem("diffmode", message);
    rerender();
  }
  function lcOpen(event) {
    event.stopPropagation();
    appState.lcOpen = event.currentTarget.dataset.lc;
    rerender();
    focusDraft("lc");
  }
  function lcCancel() {
    appState.lcOpen = "";
    delete appState.draft.lc;
    saveDrafts();
    rerender();
  }
  function lcSuggest(ev) {
    const cur = (appState.draft.lc || "").trimEnd();
    appState.draft.lc = `${cur}${cur ? "\n\n" : ""}\`\`\`suggestion
${ev.currentTarget.dataset.code}
\`\`\`
`;
    saveDrafts();
    rerender();
    focusDraft("lc");
  }
  function lcAdd() {
    const body = (appState.draft.lc || "").trim();
    if (!body || !appState.lcOpen) {
      return;
    }
    const [path, side, line] = appState.lcOpen.split("");
    (appState.pending[pendKey()] ||= []).push({
      id: Date.now(),
      path,
      side,
      line: +line,
      body
    });
    savePending();
    appState.lcOpen = "";
    delete appState.draft.lc;
    saveDrafts();
    rerender();
  }
  function lcDel(id) {
    appState.pending[pendKey()] = pendList().filter(
      (pendingComment) => String(pendingComment.id) !== id
    );
    savePending();
    rerender();
  }
  var rerender = () => {
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  };
  var live = /* @__PURE__ */ new Map();
  var wantFocus = /* @__PURE__ */ new Set();
  editorMount.focus = (key2) => {
    const ed = [...live].find(([, otherKey]) => otherKey === key2)?.[0];
    if (ed) {
      ed.focus?.();
    } else {
      wantFocus.add(key2);
    }
  };
  var focusDraft = (key2) => request(`draft:focus:${key2}`);
  var scrollDraft = (key2) => request(`draft:scroll:${key2}`);
  var blurDraft = (key2) => request(`draft:blur:${key2}`);
  function syncDraft(key2) {
    live.forEach((otherKey, ed) => {
      if (otherKey === key2) {
        ed.setMarkdown?.(appState.draft[key2] || "");
      }
    });
  }
  editorMount.preview = previewDraft;
  editorMount.fn = (host, key2, ph) => {
    if (!window.createEditor) {
      host.innerHTML = '<div class="act-err">Editor failed to load.</div>';
      return () => void 0;
    }
    const send = () => request(`draft:submit:${key2}`);
    let ed = null;
    let gone = false;
    const mount = () => {
      if (gone) {
        return;
      }
      ed = window.createEditor(host, {
        value: appState.draft[key2] || "",
        placeholder: ph,
        people: peopleList(),
        onChange: (md) => {
          appState.draft[key2] = md;
          saveDrafts();
        },
        onSubmit: send
      });
      live.set(ed, key2);
      if (wantFocus.delete(key2)) {
        ed.focus?.();
      }
    };
    const io = new IntersectionObserver(
      (en) => {
        if (en.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          mount();
        }
      },
      { rootMargin: "300px" }
    );
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
    appState.reposErr = "";
    appState.repos = null;
    if (appState.repoSel) {
      appState.repos = appState.repoSel;
      render();
      return;
    }
    try {
      appState.repos = await tauri.invoke("list_repos");
    } catch (error) {
      appState.reposErr = String(error);
      if (/401|Bad credentials|requires authentication/i.test(appState.reposErr)) {
        appState.hasToken = false;
        appState.gateErr = "GitHub rejected the saved token (expired or revoked). Sign in again.";
      }
    }
    render();
  }
  async function openRepo(name, { nav = false } = {}) {
    appState.view = "repo";
    appState.pAuthor = appState.pLabel = appState.pStatus = "";
    appState.repo = name;
    appState.prs = null;
    appState.error = "";
    appState.bundle = nav && appState.bundle ? appState.bundle : appState.bundle;
    if (!nav) {
      appState.hist = appState.hist.slice(0, appState.hi + 1);
      appState.hist.push(`repo:${name}`);
      appState.hi = appState.hist.length - 1;
    }
    appState.sideTab = "prs";
    render();
    refreshPushes(name);
    try {
      appState.prs = tauri ? await tauri.invoke("list_prs", { repo: name, state: appState.prState }) : [];
    } catch (error) {
      appState.error = String(error);
      appState.prs = [];
    }
    render();
  }
  async function loadPrs() {
    const name = appState.repo;
    const ck = `${name}|${appState.prState}`;
    appState.prCache = appState.prCache || {};
    const hit = appState.prCache[ck];
    if (hit) {
      appState.prs = hit.list;
      if (Date.now() - hit.at < 6e4) {
        rerender();
        return;
      }
    } else {
      appState.prs = null;
    }
    rerender();
    try {
      const prListItems = tauri ? await tauri.invoke("list_prs", { repo: name, state: appState.prState }) : [];
      appState.prCache[ck] = { list: prListItems, at: Date.now() };
      if (appState.repo === name) {
        appState.prs = prListItems;
      }
    } catch {
      if (appState.repo === name && !hit) {
        appState.prs = [];
      }
    }
    if (appState.repo === name) {
      rerender();
    }
  }
  var reload = () => appState.view === "repo" ? openRepo(appState.repo, { nav: true }) : appState.bundle && openPr(
    `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`,
    {
      nav: true,
      keepTab: true,
      manual: true
    }
  );
  var elId = (text) => `c-${text.replace(/^c-/, "")}`;
  async function openPr(input, {
    nav = false,
    keepTab = false,
    manual = false,
    newTab = false,
    restore = ""
  } = {}) {
    {
      const bm = String(input).match(/^([^#\s@]+\/[^#\s@]+)@(.+)$/);
      if (bm) {
        return openNewPr(bm[1], bm[2]);
      }
    }
    const fromTab = appState.view === "pr" ? tabIdx() : -1;
    const tabSwitch = !!(restore || appState.fadeMain);
    const seq = appState.openSeq = (appState.openSeq || 0) + 1;
    const stale_ = () => appState.openSeq !== seq;
    if (!keepTab && !restore) {
      tabSnap();
    }
    appState.tabPending = "";
    if (!keepTab) {
      const match = String(input).match(/^([^#\s@/]+\/[^#\s@]+)#(\d+)$/) || String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
      if (match) {
        const ref = `${match[1]}#${match[2]}`;
        appState.tabPending = ref;
        if (!appState.tabs.some((tab) => tab.ref === ref)) {
          const old = appState.recent.find(
            (recentEntry) => recentEntry.ref === ref
          );
          const item = {
            ref,
            title: old?.title || "Loading\u2026",
            state: old?.state || "open",
            icon: old?.icon || "git-pull-request",
            tab: restore || "conversation",
            dot: false
          };
          if (fromTab >= 0 && !newTab) {
            appState.tabs[fromTab] = item;
          } else {
            appState.tabs.splice(
              fromTab >= 0 ? fromTab + 1 : appState.tabs.length,
              0,
              item
            );
          }
          appState.tabs = appState.tabs.slice(-15);
        }
      }
    }
    appState.error = "";
    appState.view = "pr";
    if (!keepTab) {
      appState.tab = restore || "conversation";
    }
    appState.sel = null;
    if (!keepTab) {
      appState.fr = null;
    }
    if (keepTab && appState.focus && appState.tab === "files") {
      appState.focus = "";
    }
    if (keepTab && tauri) {
      await tauri.invoke("invalidate_pr", { url: input }).catch(() => {
      });
    }
    const mem2 = qc.peek(input);
    const disk = mem2 || (tauri && !keepTab ? await tauri.invoke("cached_pr", { url: input }).then((bundle) => bundle && { data: bundle }).catch(() => null) : null);
    const fresh = !!mem2 && qc.fresh(input) && !keepTab;
    const stale = !!disk && !fresh;
    const had = fresh || stale || keepTab && appState.bundle;
    if (fresh) {
      appState.bundle = mem2.data;
      appState.loading = false;
    } else if (disk) {
      appState.bundle = disk.data;
      appState.refreshing = false;
      appState.loading = false;
    } else if (keepTab && appState.bundle) {
      appState.refreshing = manual;
      appState.loading = false;
    } else {
      appState.loading = true;
    }
    const hot = fresh;
    appState.keepScroll = keepTab;
    render();
    appState.keepScroll = false;
    if (!keepTab && !restore) {
      scrollMain(0);
    }
    const focusNow = () => {
      if (!appState.bundle || !appState.focus) {
        return false;
      }
      if (appState.tab !== "conversation" && appState.tab !== "timeline") {
        appState.tab = "conversation";
        render();
      }
      if (!hasComment(appState.focus)) {
        return false;
      }
      setFlash(elId(appState.focus), { block: "start" });
      appState.focus = "";
      appState.keepScroll = true;
      render();
      appState.keepScroll = false;
      return true;
    };
    const focused = focusNow();
    try {
      const got = hot ? mem2.data : await qc.fetch(input, () => loadPr(input));
      if (stale_()) {
        return;
      }
      appState.bundle = got;
      const pull = got.pull;
      const ref = `${pull.base.repo.full_name}#${pull.number}`;
      const [st, ic] = stateOf(pull);
      if (!nav) {
        appState.hist = appState.hist.slice(0, appState.hi + 1);
        appState.hist.push(ref);
        appState.hi = appState.hist.length - 1;
      }
      appState.recent = [
        { ref, title: pull.title, state: st, icon: ic },
        ...appState.recent.filter((recentEntry) => recentEntry.ref !== ref)
      ].slice(0, 30);
      localStorage.setItem(KEY_RECENT, JSON.stringify(appState.recent));
      localStorage.setItem("last", ref);
      remember(ref, pull);
      if (!keepTab || tabIdx() >= 0) {
        tabPut(ref, pull, { at: fromTab, newTab });
      }
      const ti = appState.tabs.find((tab) => tab.ref === ref);
      if (ti) {
        ti.dot = false;
        saveTabs();
      }
      if (appState.repo !== pull.base.repo.full_name) {
        appState.repo = pull.base.repo.full_name;
        appState.sideTab = "prs";
        setTimeout(loadPrs, 0);
      }
      if (appState.draftRef !== ref) {
        saveDrafts();
        appState.draftRef = ref;
        appState.draft = { ...drafts[ref] || {} };
      }
    } catch (error) {
      if (stale_()) {
        return;
      }
      if (!had) {
        appState.bundle = null;
      }
      appState.error = String(error).replace(/^Error: /, "");
    }
    appState.tabPending = "";
    appState.loading = false;
    appState.refreshing = false;
    const savedScroll = restore ? appState.tabs[tabIdx()]?.scroll || 0 : 0;
    appState.restoring = !!savedScroll;
    appState.keepScroll = focused || keepTab;
    render();
    appState.keepScroll = false;
    if (savedScroll) {
      const put2 = () => scrollMain(savedScroll);
      put2();
      requestAnimationFrame(put2);
      setTimeout(() => {
        put2();
        appState.restoring = false;
      }, 250);
    }
    if (!keepTab && !stale && !focused && !flashLive() && !tabSwitch) {
      enterAnim();
    }
    if (appState.bundle && !stale && !keepTab && !focused) {
      scrollMain(0);
    }
    if (appState.bundle && appState.focus) {
      const id = appState.focus;
      appState.focus = "";
      if (appState.tab !== "conversation" && appState.tab !== "timeline") {
        appState.tab = "conversation";
        render();
      }
      if (hasComment(id)) {
        setFlash(elId(id), { block: "start" });
        appState.keepScroll = true;
        render();
        appState.keepScroll = false;
      }
    }
  }

  // src/app/listeners.ts
  if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen(
      "notif-click",
      (entry) => {
        const { ref, target } = entry.payload || {};
        if (!ref) {
          return;
        }
        appState.nav = false;
        appState.bell = false;
        appState.focus = target || "";
        openPr(ref);
      }
    );
  }
  var goOffline = () => {
    appState.offline = true;
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;
  };
  var goOnline = () => {
    appState.offline = false;
    if (appState.bundle && appState.view === "pr") {
      openPr(
        `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`,
        {
          nav: true,
          keepTab: true
        }
      );
    } else {
      render();
    }
  };

  // src/app/zoom.ts
  var MIN = 0.5;
  var MAX = 2.5;
  var KEY = "zoom";
  var level = 1;
  var view = () => window.__TAURI__?.webview?.getCurrentWebview?.();
  var apply = (zoom) => {
    level = Math.min(MAX, Math.max(MIN, Math.round(zoom * 100) / 100));
    view()?.setZoom(level).catch(() => {
    });
    try {
      localStorage.setItem(KEY, String(level));
    } catch {
    }
  };
  var restoreZoom = () => {
    let saved = 1;
    try {
      saved = parseFloat(localStorage.getItem(KEY) || "1");
    } catch {
    }
    if (saved && saved !== 1) {
      apply(saved);
    }
  };
  var zoomWheel = (event) => {
    if (!(event.ctrlKey || event.metaKey) || !event.deltaY) {
      return;
    }
    event.preventDefault();
    apply(level * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
  };
  var zoomKey = (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }
    if (event.key === "=" || event.key === "+") {
      apply(level * 1.1);
    } else if (event.key === "-") {
      apply(level / 1.1);
    } else if (event.key === "0") {
      apply(1);
    } else {
      return;
    }
    event.preventDefault();
  };

  // src/app/boot.tsx
  var urlParams = new URLSearchParams(location.search);
  if (urlParams.get("mode")) {
    appState.mode = urlParams.get("mode");
  }
  if (urlParams.get("tab")) {
    appState.tab = urlParams.get("tab");
  }
  if (urlParams.get("split")) {
    appState.split = urlParams.get("split") === "1";
  }
  if (tauri) {
    tauri.invoke("has_token").then((flag) => {
      appState.hasToken = flag;
      appState.authChecked = true;
      render();
      if (flag) {
        loadRepos();
        loadProfile();
      }
    }).catch(() => {
      appState.authChecked = true;
      appState.hasToken = false;
      render();
    });
  }
  restoreZoom();
  window.__TAURI__?.app?.getVersion?.().then((value) => {
    appState.ver = value;
  }).catch(() => {
  });
  setGlobals({
    pointerDown: (event) => ripple(event),
    clickCapture: (event) => noteClick(event),
    click: () => closePop(),
    mouseDown: (event) => {
      menuAway(event);
      notesAway(event);
      bpAway(event);
    },
    key: (event) => {
      zoomKey(event);
      shortcut(event);
      notesKey(event);
      helpKey(event);
      homeKey(event);
    },
    wheel: (event) => zoomWheel(event),
    focus: () => refocus(),
    online: () => goOnline(),
    offline: () => goOffline()
  });
  render();
  if (urlParams.get("fixture")) {
    openPr(urlParams.get("fixture")).then(() => {
      if (urlParams.get("tab")) {
        appState.tab = urlParams.get("tab");
        render();
      }
    });
  } else if (tauri) {
    tauri.invoke("initial_arg").then((arg) => {
      if (arg) {
        openPr(arg);
      } else {
        appState.view = "home";
        render();
      }
    });
  }
  setInterval(pollNotes, 6e4);
  setTimeout(pollNotes, 4e3);
  var refocus = () => {
    const bundle = appState.bundle;
    if (!tauri || !bundle || appState.view !== "pr" || appState.loading || appState.refreshing) {
      return;
    }
    const key2 = `${bundle.pull.base.repo.full_name}#${bundle.pull.number}`;
    if (!qc.fresh(key2, 6e4)) {
      openPr(key2, { nav: true, keepTab: true });
    }
  };
  setTimeout(pollNotes, 8e3);
  if (new URLSearchParams(location.search).get("demonote")) {
    appState.notes = [
      {
        id: 1,
        ref: "octocat/Hello-World#6",
        title: "New line at end of file.",
        text: "3 new commits, 2 new comments",
        at: (/* @__PURE__ */ new Date()).toISOString(),
        read: false
      },
      {
        id: 2,
        ref: "octocat/Hello-World#6",
        title: "New line at end of file.",
        text: "now merged",
        at: new Date(Date.now() - 36e5).toISOString(),
        read: true
      }
    ];
    appState.bell = true;
    render();
  }
  async function checkUpdate() {
    const up = window.__TAURI__?.updater;
    if (!up || appState.update?.busy) {
      return;
    }
    try {
      const updateHandle = await up.check();
      if (updateHandle) {
        appState.update = { version: updateHandle.version, obj: updateHandle };
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
