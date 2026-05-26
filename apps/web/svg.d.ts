// Type declarations for SVG imports as React components via @svgr/webpack
declare module "*.svg" {
  import type React from "react";
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// Allow ?url suffix for importing SVGs as data URLs (for next/image etc.)
declare module "*.svg?url" {
  const src: string;
  export default src;
}
