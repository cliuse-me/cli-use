import ReactReconciler from 'react-reconciler';
import { hostConfig, TUIContainer, TUIProps } from './host-config.js';
import { Buffer, Renderer } from '../renderer/index.js';

// Import React types
import type { ReactElement } from 'react';

/**
 * Create a reconciler instance
 */
export const createReconciler = () => ReactReconciler(hostConfig);

/**
 * Create a root container for rendering
 */
export const createRoot = (renderer: Renderer): TUIContainer => {
  const buffer = renderer.getBuffer();

  return {
    buffer,
    root: null,
    listeners: {},
  };
};

/**
 * Render a React element to the terminal
 */
export const render = (
  element: ReactElement,
  container: TUIContainer,
  renderer: Renderer
) => {
  const reconciler = createReconciler();

  reconciler.updateContainer(element, container, null, () => {
    // Present the frame after React has finished rendering
    renderer.present();
  });
};

// Export types
export type { TUIContainer, TUIProps };
