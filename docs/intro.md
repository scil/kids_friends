功能：windows 系统的文件浏览器上，双击视频文件，则打开题目；完成题目后，再运行文件。

实现:

- 双击视频文件：ahk 监视到双击动作，把文件信息传递给 electron
- electron 接收到消息(`connectMessageBetweenMainAndAhk`)，显示
- 用户完成题目后 (`onComplete`)
  - 更新 Survey 数据(`this.setState`)，这样 Survey 会自动重新渲染
  - 隐藏 electron 并运行视频文件(`connectMessageBetweenMainAndRenderer`)。

技术栈

- surveyjs
- react。因为 surveyjs 的原因，未使用函数组件。
- electron
  - https://electron-react-boilerplate.js.org
  - https://www.electron.build/
  - https://www.electronjs.org/docs

霸道机制：试题出现后 禁止其它操作

- 窗口显示后全屏 `fullscreen: true`
- 启动后最小化 `START_MINIMIZED: 'true'`

问题

- 目前文件打开，只靠监视双击动作
- autohotkey.dll 调用 monitor 代码时(`runAhkMonitor`) 有时会解析错误 有时则没有任何反应，应该是 dll 的问题。
