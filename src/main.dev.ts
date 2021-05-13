/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import os from 'os';
import { app, BrowserWindow, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { T, ahkdll, runAhkMonitor } from './ahk';

const FILENAME_MAX_LEN = 512;

const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);
const ArrayType = require('ref-array-di')(ref);

const ULONG = ref.types.ulong;
const ULONG_P = ref.refType(ULONG);
// const CHAR_P = ref.refType(ref.types.char);
const CharArray = ArrayType('char *', FILENAME_MAX_LEN);
const CHARARRAY_P = ref.refType(CharArray);

const COPYDATA = new Struct({
  dwData: ULONG_P,
  cbData: ULONG,
  lpData: CHARARRAY_P,
});
const COPYDATA_P = ref.refType(COPYDATA);

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    // as GFW, extensions can not be installed https://github.com/SimulatedGREG/electron-vue/issues/37
    // many way to set proxy failed, i have to disable this tool and mannully install extensions
    //    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  /**
  mannully install extensions
    offical doc uses  `session.defaultSession`  but it is undefined
    https://github.com/electron/electron/blob/master/docs/tutorial/devtools-extension.md

    try `webContents` and extension dir is recognized. but new error `Unrecognized manifest key` . maybe i should wait for next version of electron
    https://github.com/electron/electron/issues/23662
    */
  const reactDevToolsPath = path.join(
    os.homedir(),
    '/AppData/Local/Google/Chrome/User Data/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.13.2_0'
  );
  await mainWindow.webContents.session.loadExtension(reactDevToolsPath);

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }

    // scil
    runAhkMonitor();
  });

  // scil
  // aync is necessary, otherwize electron will die.
  // another way to avoid dying is to add sth like `console.log('lParam = ', lParam);`
  // 不过这点经验也可能都是偶然
  mainWindow.hookWindowMessage(
    0x4a /* = WM_COPYDATA */,
    async (wParam: Buffer, lParam: Buffer) => {
      //  console.log('lParam = ', lParam);
      const buf = lParam;

      buf.type = COPYDATA_P;
      console.log('\nCOPYDATA_P ', buf.deref());
      // console.log('\nCOPYDATA ', buf.deref().deref())

      const size = buf.deref().deref().cbData;
      console.log('\nsize ', size);

      const lpBuf = buf.deref().deref().lpData;
      // console.log('lpData ', lpBuf)

      // 发现，在终端上，中文名字会乱码，用EmEditor实验发现，把utf8的数据用gb2312编码呈现，就是一样的乱码。js里转换为gb2312需要第三方库
      const filePath = lpBuf.toString('utf16le', 0, size - 1);
      console.log('lpBuf utf16le', filePath);
      // 如果不用size，在console上看显示一样，但在 webContents 上，会有太多无关字符（FILENAME_MAX_LEN)
      // console.log('\nlpBuf utf16le size', lpBuf.toString('utf16le'))

      mainWindow.webContents.send('clicked_file', filePath);

      // 查看源代码，不象ahk的OnMessage， electron 里的hookWindowMessage回调函数，运行后没有返回值
      // https://github.com/electron/electron/blob/11199d8824612e3d434ea2a8af2a9a608a522903/shell/browser/api/electron_api_base_window.cc#L307

      return 1;
    }
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
