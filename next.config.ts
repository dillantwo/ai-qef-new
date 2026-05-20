import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  output: "standalone",
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  async redirects() {
    return [
      {
        source: "/math/ClockApp1-24hrs.html",
        destination: "/math/clock-24hrs",
        permanent: true,
      },
      {
        source: "/math/ClockApp2-TimeDifference.html",
        destination: "/math/clock-time-difference",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
