#!/bin/zsh
# Builds Pullscope.app (release binary + icon) and installs it into /Applications (or ~/Applications).
set -e
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/opt/rustup/bin:$PATH
APP=dist/Pullscope.app

# Icon: logo.svg -> icon.png (embedded in the binary) and icon.icns (Finder / Dock)
rsvg-convert -w 1024 -h 1024 scripts/logo.svg -o /tmp/reviewer-1024.png
cp /tmp/reviewer-1024.png src-tauri/icons/icon.png
SET=/tmp/Pullscope.iconset; rm -rf $SET; mkdir -p $SET
for s in 16 32 128 256 512; do
  sips -z $s $s /tmp/reviewer-1024.png --out $SET/icon_${s}x${s}.png >/dev/null
  sips -z $((s*2)) $((s*2)) /tmp/reviewer-1024.png --out $SET/icon_${s}x${s}@2x.png >/dev/null
done
iconutil -c icns $SET -o /tmp/Pullscope.icns

touch src-tauri/src/lib.rs
(cd src-tauri && cargo build --release --bin github-pr-view)

rm -rf $APP; mkdir -p $APP/Contents/MacOS $APP/Contents/Resources
cp src-tauri/target/release/github-pr-view $APP/Contents/MacOS/github-pr-view
cp /tmp/Pullscope.icns $APP/Contents/Resources/icon.icns
cat > $APP/Contents/Info.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Pullscope</string>
  <key>CFBundleDisplayName</key><string>Pullscope</string>
  <key>CFBundleExecutable</key><string>github-pr-view</string>
  <key>CFBundleIdentifier</key><string>dev.local.github-pr-view</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>LSApplicationCategoryType</key><string>public.app-category.developer-tools</string>
</dict></plist>
PLIST
codesign --force --deep -s - $APP

DEST=/Applications
[ -w $DEST ] || { DEST=$HOME/Applications; mkdir -p $DEST; }
pkill -f "Pullscope.app/Contents/MacOS" 2>/dev/null || true
rm -rf "$DEST/Pullscope.app"; cp -R $APP "$DEST/Pullscope.app"
touch "$DEST/Pullscope.app"
echo "Installed: $DEST/Pullscope.app"
