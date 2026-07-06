import { connectDB } from "@/lib/mongodb";
import { ToolboxConfig, type ITool } from "@/models/ToolboxConfig";
import { journeyFallbackConfig } from "@/lib/toolbox-defaults";

export async function GET() {
  await connectDB();

  // Only active groups, and within them only active tools. Tools/groups saved
  // before the isActive flag existed have it undefined, which we treat as live.
  const configs = await ToolboxConfig.find({ isActive: true }).lean();
  const result = configs.map((config) => ({
    ...config,
    tools: (config.tools ?? []).filter((tool: ITool) => tool.isActive !== false),
  }));

  // Re-add the built-in journey tool only when no journey group exists at all.
  // If an admin has explicitly disabled the journey group it will be absent from
  // `configs` but still exist in the DB, so we must not force it back in.
  const journeyExists = await ToolboxConfig.exists({ type: "journey" });
  if (!journeyExists) {
    result.push(journeyFallbackConfig as (typeof result)[number]);
  }

  return Response.json(result);
}
