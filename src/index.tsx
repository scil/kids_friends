import React from 'react';
import { render } from 'react-dom';
import electron from 'electron';
import App from './App';

render(<App />, document.getElementById('root'));

electron.ipcRenderer.on('clicked_file', (event, message) => {
  console.log(message);
});
