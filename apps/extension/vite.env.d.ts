/// <reference types="vite/client" />

// Vite ?inline — imports a file's raw text content as a string
declare module "*?inline" {
  const content: string;
  export default content;
}