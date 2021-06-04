import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const ffi = require('ffi-napi');

const dllType = process.arch === 'x64' ? 'x64w' : 'W32w';

const getAppAssetPath = (...paths: string[]): string => {
  return path.join(
    __dirname,
    '..',
    app.isPackaged ? 'app.asar.unpacked' : '',
    'app_assets',
    ...paths
  );
};

const libPath = getAppAssetPath('ahk', `${dllType}_AutoHotkey.dll`);
console.log('dll ', libPath);

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
  const ahkFile = getAppAssetPath('ahk', 'kids_friends.ahk');
  // console.log(ahkFile);

  const ahkScriptString = fs.readFileSync(ahkFile, 'utf8');
  // console.log(ahkScriptString)

  const ok = ahkdll.ahkTextDll(T(ahkScriptString), T(''), T(''));
  console.log('runAhkMonitor', ok);
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
