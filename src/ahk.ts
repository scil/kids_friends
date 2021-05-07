const fs = require('fs');
const path = require('path');
const ffi = require('ffi-napi');

const dllType = process.arch === 'x64' ? 'x64w' : 'W32w';
const libPath = `D:/A/ahk/AutoHotkey_H/ahkdll-v1-release-master/${dllType}_MT/AutoHotkey.dll`;

export function T(text, encoding = 'utf16le') {
  return Buffer.from(text, encoding).toString('binary');
}

export const ahkdll = new ffi.Library(libPath, {
  ahkTextDll: ['int32', ['string', 'string', 'string']],
});

export function runAhkMonitor() {
  const ahkScriptString = fs.readFileSync(
    path.join(__dirname, 'assets/ahk', 'kids_friends.ahk'),
    'utf8'
  );

  const ok = ahkdll.ahkTextDll(T(ahkScriptString), T(''), T(''));
  // console.log(ok);
}
