import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "pub-1cd4295e87cb40aebfc4ab9bcc97007f.r2.dev",
      "media.geeksforgeeks.org",
    ],
  },
};

export default withBundleAnalyzerConfig(nextConfig);
