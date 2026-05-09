import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
  images: {
    domains: ["pub-1cd4295e87cb40aebfc4ab9bcc97007f.r2.dev"],
  },
};

export default withBundleAnalyzerConfig(nextConfig);
