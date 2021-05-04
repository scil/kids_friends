1. 为了调用 autohotkey.dll 安装 yarn add ffi-napi

- 按理说 按照“Two package.json Structure”，ffi-napi 应该在 app 或 src 目录安装，然后会自动运行 `yarn electron-rebuild`， 但我这因为没有安装 Visual Studio 而失败，但调用 dll 仍然成功。说明 ffi-napi 完全可以安装到上层目录。
- 错误“gyp ERR! stack TypeError: tar.extract is not a function”，解决: 手工安装 tar 再删除，再重新安装 ffi-napi
  `yarn add tar yarn remove tar`
