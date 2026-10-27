#!/bin/sh
# Fail if any explicit `any` or TS suppression comment appears in src.
if grep -rnE "[]a-zA-Z_)?][[:space:]]*:[[:space:]]*any[[:space:]]*[,;=)>|&{}]|\bas any\b|<any>|any\[\]|Record<[^>]*\bany\b>|@ts-(ignore|nocheck|expect-error)" src --include=*.ts --include=*.tsx; then
  echo "explicit any / ts-suppression found" >&2; exit 1
fi
