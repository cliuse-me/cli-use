import type { HostConfig } from 'react-reconciler';
import type { Buffer } from '../renderer/types.js';

export interface TUIProps {
  style?: {
    fg?: number;
    bg?: number;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: any;
}

export type TUIType = string;

export interface TUIElement {
  type: TUIType;
  props: TUIProps;
  children: TUIElement[];
}

export interface TUIContainer {
  buffer: Buffer;
  root: TUIElement | null;
  listeners: {
    onInput?: (key: string) => void;
    onClick?: (x: number, y: number) => void;
  };
}

export interface TUIInstance {
  type: TUIType;
  props: TUIProps;
  children: TUIInstance[];
  parent: TUIInstance | null;
  node: TUIElement;
}

// @ts-ignore - React reconciler types are complex
export const hostConfig = {
  supportsPersistence: false,
  supportsMutation: true,
  createInstance(type: any, props: any) {
    return { type, props: { ...props }, children: [], parent: null, node: { type, props: { ...props }, children: [] } };
  },
  appendInitialChild(parentInstance: any, child: any) {
    parentInstance.children.push(child);
    child.parent = parentInstance;
  },
  finalizeInitialChildren() { return false; },
  prepareUpdate() { return {}; },
  shouldSetTextContent(type: any) { return type === 'TEXT'; },
  createTextInstance(text: any) {
    return { type: 'TEXT', props: { children: text }, children: [], parent: null, node: { type: 'TEXT', props: { children: text }, children: [] } };
  },
  appendChildToContainer(container: any, child: any) {
    container.root = child;
    child.parent = null;
  },
  appendChild(parentInstance: any, child: any) {
    parentInstance.children.push(child);
    child.parent = parentInstance;
  },
  removeChild(parentInstance: any, child: any) {
    const index = parentInstance.children.indexOf(child);
    if (index !== -1) {
      parentInstance.children.splice(index, 1);
      child.parent = null;
    }
  },
  removeChildFromContainer(_container: any, child: any) { child.parent = null; },
  insertBefore(parentInstance: any, child: any, beforeChild: any) {
    const index = parentInstance.children.indexOf(beforeChild);
    if (index !== -1) {
      parentInstance.children.splice(index, 0, child);
    } else {
      parentInstance.children.push(child);
    }
    child.parent = parentInstance;
  },
  insertInContainerBefore() {},
  commitUpdate(instance: any, _updatePayload: any, _type: any, _oldProps: any, newProps: any) {
    instance.props = { ...newProps };
    instance.node.props = { ...newProps };
  },
  commitTextUpdate(textInstance: any, _oldText: any, newText: any) {
    textInstance.props.children = newText;
    textInstance.node.props.children = newText;
  },
  resetTextContent(instance: any) {
    if (instance.type === 'TEXT') {
      instance.props.children = '';
      instance.node.props.children = '';
    }
  },
  getPublicInstance(instance: any) { return instance; },
  getRootHostContext(rootContainer: any) { return rootContainer; },
  getChildHostContext(parentHostContext: any) { return parentHostContext; },
  prepareForCommit() { return null; },
  resetAfterCommit(container: any) {
    if (container.root) {
      renderToBuffer(container.root, container.buffer);
    }
  },
  shouldAttemptEagerTransition() { return false; },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  getCurrentEventPriority() { return 0; },
  getInstanceFromNode(node: any) { return node; },
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  preparePortalMount() {},
  prepareScopeUpdate() {},
  getInstanceFromScope() { return null; },
  detachDeletedInstance() {},
  isPrimaryRenderer: true,
  supportsHydration: false,
};

function renderToBuffer(instance: any, buffer: Buffer, x = 0, y = 0): void {
  if (!instance) return;
  const { type, props, children } = instance;
  const currentX = props.x ?? x;
  const currentY = props.y ?? y;

  if (type === 'TEXT' || typeof props.children === 'string') {
    const text = String(props.children || '');
    const style = props.style || {};
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\n') continue;
      buffer.setCell(currentX + i, currentY, { char, ...style });
    }
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      renderToBuffer(child, buffer, currentX, currentY);
    }
  } else if (children) {
    renderToBuffer(children, buffer, currentX, currentY);
  }
}
