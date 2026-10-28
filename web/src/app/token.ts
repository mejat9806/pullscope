import { appState, esc, tauri } from './core';
import { paintDlg } from './dialogs';
import { loadRepos } from './nav';
import { render } from './pages';

export function tokenDialog() {
  appState.oauth = {};
  appState.oauthLive = false;
  appState.tokenText = '';
  appState.dlg = { k: 'token' };
  render();
}

export async function tokenSave() {
  const value = appState.tokenText || '';

  try {
    await tauri?.invoke('set_token', { token: value });
    appState.hasToken = !!value.trim();
    appState.authChecked = true;

    if (appState.hasToken) {
      appState.gateErr = '';
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

export async function oauthGo() {
  const show = (options: { code?: string; err?: string }) => {
    appState.oauth = options;

    if (appState.dlg) {
      paintDlg();
    }
  };

  appState.oauthLive = true;
  const me = (appState.oauthRun = (appState.oauthRun || 0) + 1);

  try {
    const deviceCode = await tauri!.invoke('device_start');
    show({ code: deviceCode.user_code });

    tauri!
      .invoke('open_external', { url: deviceCode.verification_uri })
      .catch(() => {});

    let wait = (deviceCode.interval || 5) * 1000;

    const until = Date.now() + (deviceCode.expires_in || 900) * 1000;

    while (
      appState.oauthLive &&
      appState.oauthRun === me &&
      Date.now() < until
    ) {
      const delay = wait;
      await new Promise(handler => setTimeout(handler, delay));

      if (!appState.oauthLive || appState.oauthRun !== me) {
        return;
      }

      const st = await tauri!.invoke('device_poll', {
        deviceCode: deviceCode.device_code,
      });

      if (st === 'slow_down') {
        wait += 5000;
      }

      if (st === 'ok') {
        appState.oauthLive = false;
        appState.hasToken = true;
        appState.gateErr = '';
        appState.dlg = null;
        loadRepos();

        return;
      }
    }

    throw new Error('The code expired. Start again.');
  } catch (error) {
    appState.oauthLive = false;
    show({ err: error instanceof Error ? error.message : String(error) });
  }
}

void esc;
