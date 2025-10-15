declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    google: any; // 用 any 简化全局 google 声明，避免类型冲突
  }
}

export {};