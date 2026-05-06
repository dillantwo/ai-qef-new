import { connectDB } from "@/lib/mongodb";
import { ToolboxConfig } from "@/models/ToolboxConfig";

const journeyFallbackConfig = {
  type: "journey",
  label: "行程圖 Journey Graph",
  description: "行程圖相關題目：閱讀距離-時間圖，描述每段旅程、停留、折返、平行與相交路線",
  isActive: true,
  tools: [
    {
      key: "journey-graph",
      label: "行程圖",
      sub: "Journey Graph",
      icon: "ChartLine",
      bg: "bg-sky-100",
      iconBg: "bg-sky-500",
      border: "border-sky-200",
      hover: "hover:bg-sky-200 hover:border-sky-300",
      text: "text-sky-700",
    },
  ],
};

export async function GET() {
  await connectDB();
  const configs = await ToolboxConfig.find({ isActive: true }).lean();
  if (!configs.some((config) => config.type === "journey")) {
    return Response.json([...configs, journeyFallbackConfig]);
  }
  return Response.json(configs);
}
