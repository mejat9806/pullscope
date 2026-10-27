// Rich comment editor (Tiptap/ProseMirror) with a toolbar, markdown shortcuts and a selection bubble menu.
// Content round-trips as GitHub-flavoured Markdown. Exposed as window.createEditor.
import { Editor, Extension, InputRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
// Inline styles only when asked for (toolbar or ⌘B/⌘I): no auto-conversion of *, _, ~ or backticks, and typing after a code span or link leaves it.
const plain = (M, extra = {}) => M.extend({ addInputRules() { return []; }, addPasteRules() { return []; }, ...extra });
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import Suggestion from '@tiptap/suggestion';
import { Markdown } from 'tiptap-markdown';
import { PluginKey } from '@tiptap/pm/state';


// One popup menu per trigger character ("/", "@", ":"): shows items, handles arrows/enter/esc.
const suggest = (name, char, getItems, rowHtml, apply, minQuery = 0) => Extension.create({
  name,
  addProseMirrorPlugins() {
    let box, items = [], sel = 0, props;
    const draw = () => {
      if (!box) return;
      box.innerHTML = items.map((it, i) => `<div class="si ${i === sel ? 'on' : ''}" data-i="${i}">${rowHtml(it)}</div>`).join('');
      box.querySelectorAll('[data-i]').forEach((el) => el.addEventListener('mousedown', (ev) => { ev.preventDefault(); props.command(items[+el.dataset.i]); }));
      const r = props.clientRect?.(); if (r) { box.style.left = Math.min(r.left, innerWidth - 300) + 'px'; box.style.top = Math.min(r.bottom + 6, innerHeight - 320) + 'px'; }
      box.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
    };
    const close = () => { box?.remove(); box = null; };
    return [Suggestion({
      editor: this.editor, char, pluginKey: new PluginKey(name), startOfLine: false, allowSpaces: false,
      items: ({ query }) => (query.length < minQuery ? [] : getItems(query.toLowerCase())),
      command: ({ editor, range, props: it }) => apply(editor.chain().focus().deleteRange(range), it).run(),
      render: () => ({
        onStart: (p) => { props = p; items = p.items; sel = 0; if (!items.length) return; box = document.createElement('div'); box.className = 'tt-slash'; document.body.appendChild(box); draw(); },
        onUpdate: (p) => { props = p; items = p.items; sel = Math.min(sel, Math.max(0, items.length - 1)); if (!items.length) return close(); if (!box) { box = document.createElement('div'); box.className = 'tt-slash'; document.body.appendChild(box); } draw(); },
        onKeyDown: ({ event }) => {
          if (!box) return false;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { sel = (sel + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; draw(); return true; }
          if (event.key === 'Enter' || event.key === 'Tab') { if (items[sel]) props.command(items[sel]); return true; }
          if (event.key === 'Escape') { close(); return true; }
          return false;
        },
        onExit: close,
      }),
    })];
  },
});

const EMOJI = [['smile','😄'],['grin','😁'],['joy','😂'],['wink','😉'],['heart','❤️'],['thumbsup','👍'],['thumbsdown','👎'],['tada','🎉'],['rocket','🚀'],['eyes','👀'],['fire','🔥'],['100','💯'],['pray','🙏'],['clap','👏'],['thinking','🤔'],['sob','😭'],['sweat_smile','😅'],['white_check_mark','✅'],['x','❌'],['warning','⚠️'],['bug','🐛'],['sparkles','✨'],['zap','⚡'],['memo','📝'],['bulb','💡'],['muscle','💪'],['ok_hand','👌'],['raised_hands','🙌'],['star','⭐'],['party','🥳']];
const Emoji = suggest('emoji', ':', (q) => EMOJI.filter(([n]) => n.startsWith(q)).slice(0, 8), ([n, g]) => `<b>${g} :${n}:</b>`, (c, it) => c.insertContent(it[1] + ' '), 2);
// Typing a complete :shortcode: converts it straight to the emoji, no menu needed.
const EmojiRule = Extension.create({
  name: 'emojiRule',
  addInputRules() {
    return [new InputRule({ find: /(?:^|\s):([a-z0-9_+-]+):$/, handler: ({ state, range, match }) => {
      const g = EMOJI.find(([n]) => n === match[1]); if (!g) return null;
      const from = range.from + match[0].indexOf(':'); state.tr.replaceWith(from, range.to, state.schema.text(g[1]));
    } })];
  },
});
const mentionExt = (people) => suggest('mention', '@', (q) => people.filter((p) => p.toLowerCase().startsWith(q) || p.toLowerCase().includes(q)).slice(0, 8), (p) => `<b>@${p}</b>`, (c, p) => c.insertContent('@' + p + ' '));

window.createEditor = (host, { value = '', placeholder = '', people = [], onChange = () => {}, onSubmit = () => {} } = {}) => {
  host.innerHTML = '<div class="tt-bar"></div><div class="tt-body"></div>';
  const bar = host.querySelector('.tt-bar'), body = host.querySelector('.tt-body');
  const bubble = document.createElement('div');
  bubble.className = 'tt-bubble';
  bubble.innerHTML = '<button data-c="bold" title="Bold"><b>B</b></button><button data-c="italic" title="Italic"><i>I</i></button><button data-c="strike" title="Strikethrough"><s>S</s></button><button data-c="code" title="Inline code">&lt;/&gt;</button><button data-c="link" title="Link">Link</button><input class="tt-link" placeholder="https://… ↵" hidden>';
  document.body.appendChild(bubble);
  const input = bubble.querySelector('input');
  const editor = new Editor({
    element: body,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, bold: false, italic: false, strike: false, code: false }),
      plain(Bold), plain(Italic), plain(Strike), plain(Code, { inclusive: false }),
      Placeholder.configure({ placeholder }),
      Link.extend({ inclusive: false }).configure({ openOnClick: false, autolink: true }),
      TaskList, TaskItem.configure({ nested: true }),
      BubbleMenu.configure({ element: bubble, tippyOptions: { duration: 100, appendTo: () => document.body } }),
      Emoji, EmojiRule, mentionExt(people),
      Markdown.configure({ html: false, tightLists: true, bulletListMarker: '-', linkify: true, breaks: true }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'tt-content' },
      handleKeyDown: (_v, e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { onSubmit(); return true; }
        if (e.shiftKey && e.key === 'Enter' && editor.isActive('blockquote')) {
          const { $from } = editor.state.selection; let d = $from.depth; while (d > 0 && $from.node(d).type.name !== 'blockquote') d--;
          const at = $from.after(d); editor.chain().focus().insertContentAt(at, { type: 'paragraph' }).setTextSelection(at + 1).run(); return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.storage.markdown.getMarkdown()),
  });
  const TB = [['bold', '<b>B</b>', 'Bold (⌘B)', (c) => c.toggleBold()], ['italic', '<i>I</i>', 'Italic (⌘I)', (c) => c.toggleItalic()], ['strike', '<s>S</s>', 'Strikethrough', (c) => c.toggleStrike()], ['code', '&lt;/&gt;', 'Inline code', (c) => c.toggleCode()],
    ['h2', 'H', 'Heading', (c) => c.toggleHeading({ level: 2 })], ['bulletList', '•', 'Bulleted list', (c) => c.toggleBulletList()], ['orderedList', '1.', 'Numbered list', (c) => c.toggleOrderedList()], ['taskList', '☑', 'Task list', (c) => c.toggleTaskList()],
    ['blockquote', '❝', 'Quote', (c) => c.toggleBlockquote()], ['codeBlock', '{ }', 'Code block', (c) => c.toggleCodeBlock()], ['suggestion', '±', 'Suggested change', (c) => c.setCodeBlock({ language: 'suggestion' })], ['link', '🔗', 'Link (⌘K)', () => openLink()]];
  bar.innerHTML = TB.map(([k, h, t]) => `<button type="button" data-k="${k}" title="${t}">${h}</button>`).join('') + '<input class="tt-link" placeholder="https://… ↵" hidden><span class="tt-sp"></span><span class="tt-tip">@ mention · : emoji · markdown shortcuts</span>';
  const linkIn = bar.querySelector('.tt-link');
  const openLink = () => { linkIn.value = editor.getAttributes('link').href || ''; linkIn.hidden = false; linkIn.focus(); linkIn.select(); };
  linkIn.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== 'Escape') return; e.preventDefault(); e.stopPropagation();
    const v = linkIn.value.trim(); linkIn.hidden = true;
    if (e.key === 'Enter') (v ? editor.chain().focus().extendMarkRange('link').setLink({ href: /^[a-z]+:/i.test(v) ? v : 'https://' + v }) : editor.chain().focus().unsetLink()).run(); else editor.commands.focus();
  });
  linkIn.addEventListener('blur', () => { linkIn.hidden = true; });
  bar.addEventListener('mousedown', (ev) => { if (ev.target !== linkIn) ev.preventDefault(); });
  body.addEventListener('keydown', (ev) => { if ((ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key.toLowerCase() === 'k') { ev.preventDefault(); openLink(); } });
  bar.addEventListener('click', (ev) => { const k = ev.target.closest('[data-k]')?.dataset.k; const t = TB.find((x) => x[0] === k); if (t) t[3](editor.chain().focus()).run(); });
  const sync = () => bar.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('on', editor.isActive(b.dataset.k)));
  editor.on('transaction', sync);
  bubble.addEventListener('mousedown', (e) => { if (e.target !== input) e.preventDefault(); });
  bubble.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return;
    if (c === 'link') { input.hidden = false; input.value = editor.getAttributes('link').href || ''; input.focus(); return; }
    editor.chain().focus()[{ bold: 'toggleBold', italic: 'toggleItalic', strike: 'toggleStrike', code: 'toggleCode' }[c]]().run();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== 'Escape') return; e.preventDefault();
    const v = input.value.trim(); input.hidden = true;
    if (e.key === 'Enter') (v ? editor.chain().focus().extendMarkRange('link').setLink({ href: /^[a-z]+:/i.test(v) ? v : 'https://' + v }) : editor.chain().focus().unsetLink()).run(); else editor.commands.focus();
  });
  return {
    getMarkdown: () => editor.storage.markdown.getMarkdown(),
    focus: () => editor.commands.focus('end'),
    isFocused: () => editor.isFocused,
    destroy: () => { editor.destroy(); bubble.remove(); document.querySelectorAll('.tt-slash').forEach((n) => n.remove()); },
  };
};
