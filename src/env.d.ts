/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}
