import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private notificationClickSubject = new Subject<void>();

  get ipcRenderer() {
    return window['electronAPI'] ? window['electronAPI'].ipcRenderer : undefined;
  }

  constructor() {
    console.log('Is Electron:', this.isElectron());

    if (this.isElectron() && this.ipcRenderer) {
      this.ipcRenderer.on('notification-click', () => {
        this.notificationClickSubject.next();
      });
    }
  }

  isElectron(): boolean {
    return !!window['electronAPI'];
  }

  showNotification(title: string, body: string, clickAction: 'scroll' | 'openFile' = 'scroll'): void {
    if (this.isElectron() && this.ipcRenderer) {
      this.ipcRenderer.invoke('show-notification', { title, body, clickAction });
    } else {
      console.warn('Notification is not supported in this environment.');
    }
  }

  onNotificationClick(callback: () => void): void {
    this.notificationClickSubject.subscribe(() => {
      callback();
    });
  }

  async importArticle(): Promise<any> {
    if (this.isElectron() && this.ipcRenderer) {
      const result = await this.ipcRenderer.invoke('import-article');
      return result.article;
    } else {
      return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        fileInput.click();

        fileInput.onchange = () => {
          if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
              try {
                const fileContent = event.target?.result as string;
                const article = JSON.parse(fileContent);
                resolve(article); 
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

  async exportArticle(article: any): Promise<{ success: boolean; error?: string }> {
    if (this.isElectron() && this.ipcRenderer) {
      try {
        const result = await this.ipcRenderer.invoke('export-article', article);
        return result;
      } catch (error) {
        return { success: false, error: 'Failed to export article in Electron.' };
      }
    } else {
      // Web environment
      const jsonData = JSON.stringify(article, null, 2);
      return new Promise((resolve) => {
        try {
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${article.Title || 'exported_article'}.json`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(url);
          
          resolve({ success: true });
        } catch (error) {
          resolve({ success: false, error: 'Failed to export article in the web.' });
        }
      });
    }
  }
}