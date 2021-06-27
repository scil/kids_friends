## 基础

Evernote 中的 electron 笔记。

## 环境: 虚拟机

安装模块，以及运行 `yarn build`、`yarn package`，都在支持编译 native 模块的虚拟机中。

开发时的测试 `yarn start` 不需要在虚拟机中。

## native 模块，如 ffi-napi

1. 只安装在 `src\package.json`
2. 为了 ffi-napi 的正常运行，需要针对其使用的 \_\_dirname 进行特别设置，其中包括

- 针对 webpack 插件 NodeStuffPlugin 的加强 D:\vagrant\vendors\webpack\，使 \_\_dirname: true 可以只在部分地方生效
- 针对 node-gypd-build 的 patch，见 `src\patches\`

3. 为了避免 native 模块反复编译，在 `.yarnrc` 中定义了 `--ignore-scripts true` [How do I skip building the DLL immediately after install?](https://electron-react-boilerplate.js.org/docs/faq/#how-do-i-skip-building-the-dll-immediately-after-install)
4. 如果需要重新编译 native 模块，请修改 `.yarnrc`

## autohotkey

ahk 调用 ahk 文件中的代码，经常解析错误，为了保险， ahk 代码全部作为字符串存到 js 中，并且不出现注释。 同时提供了调用 ahk 文件的环境变量 `LOAD_AHK_FILE_FOR_MONITOR=true`

保存独立的 ahk 文件，至少在开发时有测试作用：抛开 js，用 autohotkey.exe 来运行 ahk 文件

注意：这会带来代码重复！动一次，改三个文件（还包括带注释的 ahk 文件）。
