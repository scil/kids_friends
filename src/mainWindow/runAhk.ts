const fs = require('fs');
const path = require('path');
const ffi = require('ffi-napi');

const dllType = process.arch === 'x64' ? 'x64w' : 'W32w';
const libPath =
  // `D:/A/ahk/AutoHotkey_H/ahkdll-v1-release-master/${dllType}_MT/AutoHotkey.dll`;
  path.join(__dirname, '../assets/ahk', `${dllType}_AutoHotkey.dll`);

export function T(text, encoding = 'utf16le') {
  return Buffer.from(text, encoding).toString('binary');
}

export const ahkdll = new ffi.Library(libPath, {
  // start a new thread，If a thread is already executed it will terminated before new thread starts.
  ahkTextDll: ['int32', ['string', 'string', 'string']],
  // 不会终止已运行的 thread
  ahkExec: ['int32', ['string']],
});

export async function runAhkMonitor() {
  const ahkScriptString = fs.readFileSync(
    path.join(__dirname, '../assets/ahk', 'kids_friends.ahk'),
    'utf8'
  );
  //  .replaceAll(/^\s*;[\s\w]*$/gm, '') // 凡是 ; 开头的行 都删除其内容
  //  .replaceAll(/;[^'"]+$/gm, '')  // 谨慎地删除注释 注意有些字符串里也有符号";" 所以可能会造成误伤 只能排除'和"来减少误伤

  const ok = ahkdll.ahkTextDll(T(ahkScriptString), T(''), T(''));
  // console.log(ok);
}

const ahkScriptHeader = `
#SingleInstance Ignore
DetectHiddenWindows, On
TargetScriptTitle := "Hello ahk_exe electron.exe"
`;

/**
 *
 * @param filePath
 * @param fileVarName
 * 带中文的文件名需要特殊处理成这样的代码
 *   File := chr(83)chr(58)chr(92)chr(39640)chr(46)chr(109)chr(112)chr(52)
 *   Run, % File
 */
function genRunFileScriptLines(filePath: string, fileVarName = 'File') {
  let lines = '';
  if (filePath && fs.existsSync(filePath)) {
    lines = `${fileVarName} :=`;
    for (let i = 0; i < filePath.length; i += 1) {
      lines += `chr(${filePath.charCodeAt(i)})`; // 中英文混合的文本，所有字符都要用编码
    }
    lines = `${lines}
    Run, % ${fileVarName}`;
  }
  return lines;
}

export async function hideElectronAndRunFile(filePath: string) {
  const ahkRunFileLines = genRunFileScriptLines(filePath);
  const ahkScriptString = `
  ${ahkScriptHeader}
  WinSet, AlwaysOnTop, Off, % TargetScriptTitle
  WinHide, % TargetScriptTitle
  ${ahkRunFileLines}
  `;
  // console.log(ahkScriptString);
  console.log('[AHK] hideElectronAndRunFile');

  // let filepathUTF8 = './hideElectronAndRunFile.ahk';
  // fs.writeFile(filepathUTF8, ahkScriptString, (err) => {
  //   if (err) throw err;
  //   console.log('The file was succesfully saved with UTF-8!');
  // });

  // 不可用 ahkTextDll，那么会建立新线程，同时 AhkMonitor的线程会杀死
  ahkdll.ahkExec(T(ahkScriptString));
}
