//! Real macOS notifications (UNUserNotificationCenter), so banners carry this app's icon and a click
//! brings the app forward and opens the right PR. `osascript` banners belong to Script Editor and cannot be clicked.
use std::sync::OnceLock;

use block2::{DynBlock, RcBlock};
use objc2::rc::Retained;
use objc2::runtime::{Bool, NSObject, NSObjectProtocol};
use objc2::{define_class, msg_send, MainThreadOnly};
use objc2_foundation::{MainThreadMarker, NSBundle, NSError, NSString};
use objc2_user_notifications::{
    UNAuthorizationOptions, UNMutableNotificationContent, UNNotification, UNNotificationPresentationOptions, UNNotificationRequest,
    UNNotificationResponse, UNNotificationSound, UNUserNotificationCenter, UNUserNotificationCenterDelegate,
};
use tauri::{Emitter, Manager};

static APP: OnceLock<tauri::AppHandle> = OnceLock::new();

define_class!(
    #[unsafe(super(NSObject))]
    #[thread_kind = MainThreadOnly]
    #[name = "ReviewerNotificationDelegate"]
    struct Delegate;

    unsafe impl NSObjectProtocol for Delegate {}

    unsafe impl UNUserNotificationCenterDelegate for Delegate {
        // Show the banner even while the app is frontmost.
        #[unsafe(method(userNotificationCenter:willPresentNotification:withCompletionHandler:))]
        fn will_present(&self, _c: &UNUserNotificationCenter, _n: &UNNotification, done: &DynBlock<dyn Fn(UNNotificationPresentationOptions)>) {
            done.call((UNNotificationPresentationOptions::Banner | UNNotificationPresentationOptions::List | UNNotificationPresentationOptions::Sound,));
        }

        // Click: identifier is "<ref>\t<target>\t<unique>".
        #[unsafe(method(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:))]
        fn did_receive(&self, _c: &UNUserNotificationCenter, response: &UNNotificationResponse, done: &DynBlock<dyn Fn()>) {
            let id = unsafe { response.notification().request().identifier() }.to_string();
            let mut parts = id.split('\t');
            let (pr, target) = (parts.next().unwrap_or("").to_string(), parts.next().unwrap_or("").to_string());
            if let Some(app) = APP.get() {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                }
                let _ = app.emit("notif-click", serde_json::json!({ "ref": pr, "target": target }));
            }
            done.call(());
        }
    }
);

/// True when running from a real .app bundle (the notification center aborts without one).
fn bundled() -> bool {
    NSBundle::mainBundle().bundleIdentifier().is_some()
}

/// Call once on the main thread at startup.
pub fn setup(app: tauri::AppHandle) {
    if !bundled() { return; }
    let _ = APP.set(app);
    let Some(mtm) = MainThreadMarker::new() else { return };
    let delegate: Retained<Delegate> = unsafe { msg_send![Delegate::alloc(mtm), init] };
    let center = UNUserNotificationCenter::currentNotificationCenter();
    center.setDelegate(Some(objc2::runtime::ProtocolObject::from_ref(&*delegate)));
    std::mem::forget(delegate); // the center only keeps a weak reference
    let done = RcBlock::new(|_granted: Bool, _err: *mut NSError| {});
    center.requestAuthorizationWithOptions_completionHandler(UNAuthorizationOptions::Alert | UNAuthorizationOptions::Sound | UNAuthorizationOptions::Badge, &done);
}

/// Returns false when no bundle is available, so the caller can fall back.
pub fn send(title: &str, body: &str, pr: &str, target: &str) -> bool {
    if !bundled() { return false; }
    let content = UNMutableNotificationContent::new();
    content.setTitle(&NSString::from_str(title));
    content.setBody(&NSString::from_str(body));
    content.setSound(Some(&UNNotificationSound::defaultSound()));
    let id = format!("{pr}\t{target}\t{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0));
    let req = UNNotificationRequest::requestWithIdentifier_content_trigger(&NSString::from_str(&id), &content, None);
    UNUserNotificationCenter::currentNotificationCenter().addNotificationRequest_withCompletionHandler(&req, None);
    true
}
