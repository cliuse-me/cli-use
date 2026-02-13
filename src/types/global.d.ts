declare module 'react-reconciler' {
  export * from 'react-reconciler/lib/ReactFiberReconciler';
}

declare module 'yoga-wasm-web' {
  export default Yoga;
}

declare global {
  namespace CLILUSE {
    interface Theme {
      colors: {
        primary: number;
        secondary: number;
        success: number;
        warning: number;
        error: number;
        info: number;
        foreground: number;
        background: number;
      };
      styles: {
        bold: boolean;
        dim: boolean;
        italic: boolean;
      };
    }
  }
}

export {};
