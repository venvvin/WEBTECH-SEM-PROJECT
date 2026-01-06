declare module '*.svelte' {
  import type { Component, ComponentProps } from 'svelte';
  export default class extends Component<ComponentProps<any>> {}
}

