import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // GeoJSON uploads via createLayer/updateLayer often exceed the 1 MB default.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
