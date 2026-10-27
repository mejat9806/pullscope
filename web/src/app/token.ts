import { S, esc, tauri } from './core';
import { loadRepos } from './nav';
import { render } from './pages';
import { paintDlg } from './dialogs';

export function tokenDialog() {
  S.oauth = {}; S.oauthLive = false;
  S.dlg = { k: 'token' };
  render();
}

export async function tokenSave() {
  const v = (document.getElementById('tokeninput') as HTMLInputElement).value;
  try { await tauri?.invoke('set_token', { token: v }); S.hasToken = !!v.trim(); S.authChecked = true; if (S.hasToken) { S.gateErr = ''; loadRepos(); } else { S.repos = null; } } catch (e) { alert(e); }
  S.oauthLive = false; S.dlg = null; render();
}

export async function oauthGo() {
  const show = (o: { code?: string; err?: string }) => { S.oauth = o; if (S.dlg) paintDlg(); };
  S.oauthLive = true; const me = S.oauthRun = (S.oauthRun || 0) + 1;
  try {
    const d = await tauri!.invoke('device_start');
    show({ code: d.user_code });
    tauri!.invoke('open_external', { url: d.verification_uri }).catch(() => {});
    let wait = (d.interval || 5) * 1000; const until = Date.now() + (d.expires_in || 900) * 1000;
    while (S.oauthLive && S.oauthRun === me && Date.now() < until) {
      await new Promise((r) => setTimeout(r, wait));
      if (!S.oauthLive || S.oauthRun !== me) return;
      const st = await tauri!.invoke('device_poll', { deviceCode: d.device_code });
      if (st === 'slow_down') wait += 5000;
      if (st === 'ok') { S.oauthLive = false; S.hasToken = true; S.gateErr = ''; S.dlg = null; loadRepos(); return; }
    }
    throw 'The code expired. Start again.';
  } catch (e) { S.oauthLive = false; show({ err: String(e) }); }
}
void esc;
