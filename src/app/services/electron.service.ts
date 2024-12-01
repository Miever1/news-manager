import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  get ipcRenderer() {
    return window['electronAPI'] ? window['electronAPI'].ipcRenderer : undefined;
  }

  constructor() {
    console.log('Is Electron:', this.isElectron());
  }

  isElectron(): boolean {
    return !!(window['electronAPI']);
  }

  showNotification(title: string, body: string): void {
    if (this.isElectron() && this.ipcRenderer) {
      this.ipcRenderer.invoke('show-notification', { title, body });
    } else {
      console.warn('Notification is not supported in this environment.');
    }
  }
}