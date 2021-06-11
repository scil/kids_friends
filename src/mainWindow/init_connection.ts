import { COPYDATA_P } from './ref_COPYDATA';
import { hideElectronAndRunFile, runAhkMonitor } from './runAhk';

const electron = require('electron');

const { ipcMain } = electron;

let inited = false;
const desiredFile = {
  path: null,
};

function connectMessageBetweenMainAndAhk(mainWindow) {
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
      // console.log('[WIN MSG]COPYDATA_P ', buf.deref());
      // console.log('\nCOPYDATA ', buf.deref().deref())

      const size = buf.deref().deref().cbData;
      console.log('[WIN MSG] size ', size);

      const lpBuf = buf.deref().deref().lpData;
      // console.log('lpData ', lpBuf)

      // 发现，在终端上，中文名字会乱码，用EmEditor实验发现，把utf8的数据用gb2312编码呈现，就是一样的乱码。js里转换为gb2312需要第三方库
      const filePath = lpBuf.toString('utf16le', 0, size - 1);
      console.log('[WIN MSG] lpBuf encoded utf16le', filePath);
      // 如果不用size，在console上看显示一样，但在 webContents 上，会有太多无关字符（FILENAME_MAX_LEN)
      // console.log('\nlpBuf utf16le size', lpBuf.toString('utf16le'))

      desiredFile.path = filePath;

      // mainWindow.webContents.loadURL(`https://techviral.net/remotely-control-android/`);
      mainWindow.webContents.send('clicked_file', filePath);

      // 查看源代码，不象ahk的OnMessage，
      // electron 里的hookWindowMessage回调函数，运行后没有返回值 ,所以这里的返回值其实不会被ahk用上
      // https://github.com/electron/electron/blob/11199d8824612e3d434ea2a8af2a9a608a522903/shell/browser/api/electron_api_base_window.cc#L307
      return 1;
    }
  );
}

// https://www.brainbell.com/javascript/ipc-communication.html
function connectMessageBetweenMainAndRenderer(mainWindow) {
  ipcMain.on('SYNC_SURVEY_COMPLETE', (event, args) => {
    console.log('[RENDERER MSG COPIED] ', 'SYNC_SURVEY_COMPLETE', args);
    event.returnValue = 'Main said I know a survey completed';

    hideElectronAndRunFile(desiredFile.path);
  });
}

export default async function initConnection(mainWindow) {
  if (inited) return;
  inited = true;
  await runAhkMonitor();
  connectMessageBetweenMainAndAhk(mainWindow);
  connectMessageBetweenMainAndRenderer(mainWindow);
}
