import { connectDB } from "@/lib/mongodb";
import { ToolboxConfig } from "@/models/ToolboxConfig";

export async function GET() {
  await connectDB();
  const configs = await ToolboxConfig.find({ isActive: true }).lean();
  return Response.json(configs);
}
