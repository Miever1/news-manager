declare namespace NodeJS {
    interface Process {
      type?: 'browser' | 'renderer';
    }
  }
  
  interface Window {
    process?: NodeJS.Process;
    electronStore: {
      set: (key: string, value: any) => void;
      get: (key: string) => any;
      delete: (key: string) => void;
    };
  }