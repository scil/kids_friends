import { app } from 'electron';
import path from 'path';
import fs from 'fs';

import code from './ahkCodeMonitor';

const ffi = require('ffi-napi');

const dllType = process.arch === 'x64' ? 'x64w' : 'W32w';
const ahkVersion = 'v2';
const ahkVersion2 = ahkVersion === 'v2';

const appExe = app.isPackaged ? 'Kids.exe' : 'electron.exe';
console.log('[runAHK] appExe is ', appExe);

const getAppAssetPath = (...paths: string[]): string => {
  return path.join(
    __dirname,
    '..',
    app.isPackaged ? 'app.asar.unpacked' : '',
    'app_assets',
    ...paths
  );
};

const libPath = getAppAssetPath(
  'ahk',
  `${dllType}_MT_AutoHotkey_${ahkVersion}.dll`
);
console.log('[runAHK] ahk dll is ', libPath);

export function T(text, encoding = 'utf16le') {
  return Buffer.from(text, encoding).toString('binary');
}

export const ahkdll = new ffi.Library(libPath, {
  // start a new thread，If a thread is already executed it will terminated before new thread starts.
  ahkTextDll: ['int32', ['string', 'string', 'string']],
  // 不会终止已运行的 thread
  ahkExec: ['int32', ['string']],
  // v2 用 ahkExec 造成程序崩溃，用 addScript 不会，不知 v1能否也用这个
  addScript: ['int32', ['string', 'int32']],
});

export async function runAhkMonitor() {
  let ahkScriptString;
  if (process.env.LOAD_AHK_FILE_FOR_MONITOR === 'true') {
    const ahkFile = getAppAssetPath('ahk', `${ahkVersion}_monitor.ahk`);
    console.log(
      '[runAHK Monitor] load monitor ahk code from utf8 file ',
      ahkFile
    );
    ahkScriptString = fs.readFileSync(ahkFile, 'utf8');
  } else {
    console.log('[runAHK Monitor] load monitor ahk code from js string ');
    ahkScriptString = code;
  }

  if (app.isPackaged) {
    ahkScriptString = ahkScriptString.replace('electron.exe', appExe);
  }
  // console.log(ahkScriptString)

  const ok = ahkdll.ahkTextDll(T(ahkScriptString), T(''), T(''));
  console.log('[runAHK monitor] result', ok);
}

const ahkScriptHeader = `
#SingleInstance Ignore
${ahkVersion2 ? 'DetectHiddenWindows 1' : 'DetectHiddenWindows, On'}
TargetScriptTitle := "Hello ahk_exe ${appExe}"
`;

/**
 *
 * @param filePath
 * @param fileVarName
 * 带中文的文件名需要特殊处理成这样的代码(ahk v1版本的代码)
 *   File := chr(83)chr(58)chr(92)chr(39640)chr(46)chr(109)chr(112)chr(52)
 *   Run,% File
 */
function genRunFileScriptLines(filePath: string, fileVarName = 'File') {
  if (!(filePath && fs.existsSync(filePath))) {
    return '';
  }

  if (ahkVersion2) {
    let chars = '';
    // eslint-disable-next-line no-param-reassign
    for (let i = 0; i < filePath.length; i += 1) {
      chars += `chr(${filePath.charCodeAt(i)}) . `; // 中英文混合的文本，所有字符都要用编码
    }
    return `${fileVarName} := 'open "' .  ${chars} '"'
    Run(${fileVarName})`;
  }

  let chars = '';
  for (let i = 0; i < filePath.length; i += 1) {
    chars += `chr(${filePath.charCodeAt(i)})`; // 中英文混合的文本，所有字符都要用编码
  }
  return `${fileVarName} := ${chars}
  Run, % ${fileVarName}
  `;
}

export function hideElectronAndRunFile(filePath: string) {
  console.log(`[AHK RunFile] ${filePath}`);
  const ahkRunFileLines = genRunFileScriptLines(filePath);
  const ahkScriptString = `
  ${ahkScriptHeader}
  WinSetAlwaysOnTop  0, TargetScriptTitle
  WinHide TargetScriptTitle
  ${ahkRunFileLines}
  `;
  console.log('[AHK RunFile]', ahkScriptString);
  console.log('[AHK RunFile] hideElectronAndRunFile');

  // let filepathUTF8 = './hideElectronAndRunFile.ahk';
  // fs.writeFile(filepathUTF8, ahkScriptString, (err) => {
  //   if (err) throw err;
  //   console.log('The file was succesfully saved with UTF-8!');
  // });

  // 不可用 ahkTextDll，那么会建立新线程，同时 AhkMonitor的线程会杀死
  if (ahkVersion2) {
    // v2 用 ahkExec 造成程序崩溃，用 addScript 不会，不知 v1能否也用这个
    ahkdll.addScript(T(ahkScriptString), 2);
  } else {
    ahkdll.ahkExec(T(ahkScriptString));
  }
}
