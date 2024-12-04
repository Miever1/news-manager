import { Injectable } from '@angular/core';
import { Article } from '../interfaces/article';

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

  async importArticle(): Promise<any> {
    console.log('idk man');
    if (this.isElectron() && this.ipcRenderer) {
      // Electron environment
      const result = await window.Electron.ipcRenderer.invoke('import-article');
      return result.article;
    } else {
      // Web environment
      console.log('not electorn')
      return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
  
        // Trigger file selection dialog
        fileInput.click();
  
        fileInput.onchange = () => {
          if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
  
            reader.onload = (event) => {
              try {
                const fileContent = event.target?.result as string;
                const article = JSON.parse(fileContent);
                resolve(article); // Resolve with the parsed JSON
              } catch (error) {
                reject(`Error parsing JSON: ${error}`);
              }
            };
  
            reader.onerror = () => {
              reject('Failed to read file.');
            };
  
            reader.readAsText(file);
          } else {
            reject('No file selected.');
          }
        };
      });
    }
  }
  
  
}