import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    electronAPI: {
      ipcRenderer: IpcRenderer;
      windowReady: () => void;
    };
  }
}