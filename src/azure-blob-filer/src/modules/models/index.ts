/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * https://primefaces.org/primevue/showcase/#/tree
 */
export interface TreeNode {
  key?: any;
  label?: string;
  data?: any;
  type?: string;
  icon?: string;
  children?: TreeNode[];
  style?: string;
  styleClass?: string;
  selectable?: boolean;
  leaf?: boolean;
  // The following are additional properties
  loaded?: boolean;
  parent?: TreeNode;
}

/**
 * https://primefaces.org/primevue/showcase/#/menumodel
 */
export interface MenuItem {
  label?: string;
  icon?: string;
  to?: string;
  command?: (originalEvent: Event, item: MenuItem) => void;
  url?: string;
  items?: MenuItem[];
  disabled?: boolean;
  visible?: boolean;
  target?: string;
  separator?: boolean;
  style?: any;
  class?: string;
  key?: any;
}

export interface StringKeyDictionary<T> {
  [index: string]: T;
}

export interface WebkitFile extends File {
  webkitRelativePath: string;
}
