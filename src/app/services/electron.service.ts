import { Injectable } from '@angular/core';
import { Article } from '../interfaces/article';
import { ipcRenderer } from 'electron';

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
      const result = await window.electronAPI.ipcRenderer.invoke('import-article');
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

  async exportArticle(article: any): Promise<void> {
    console.log('Exporting article...');
    if (this.isElectron() && this.ipcRenderer) {
        // Electron environment
        try {
            const result = await this.ipcRenderer.invoke('export-article', article); // Pass the raw object
            if (result.success) {
                console.log('Article successfully exported in Electron.');
            } else {
                console.error('Failed to export article in Electron:', result.error);
            }
        } catch (error) {
            console.error('Error exporting article in Electron:', error);
        }
    } else {
        // Web environment
        console.log('Exporting in web environment...');
        const jsonData = JSON.stringify(article, null, 2);
        return new Promise((resolve, reject) => {
            try {
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${article.Title || 'exported_article'}.json`;

                document.body.appendChild(link);
                link.click(); // Trigger the download
                document.body.removeChild(link);

                URL.revokeObjectURL(url); // Clean up the object URL
                console.log('Article successfully exported in the web.');
                resolve();
            } catch (error) {
                console.error('Error exporting article in the web:', error);
                reject('Failed to export article in the web.');
            }
        });
    }
}


  
  
}