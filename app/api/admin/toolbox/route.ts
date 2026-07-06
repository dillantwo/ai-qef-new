import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ToolboxConfig, type ITool } from "@/models/ToolboxConfig";
import { requireAdmin } from "@/lib/admin-auth";
import { TOOLBOX_DEFAULTS, type ToolboxConfigDefault } from "@/lib/toolbox-defaults";

function serializeGroup(c: {
  _id?: unknown;
  type: string;
  label: string;
  description: string;
  isActive?: boolean;
  tools?: ITool[];
}) {
  return {
    id: c._id ? String(c._id) : `default:${c.type}`,
    type: c.type,
    label: c.label,
    description: c.description,
    isActive: c.isActive !== false,
    tools: (c.tools ?? []).map((t: ITool) => ({
      key: t.key,
      label: t.label,
      sub: t.sub,
      icon: t.icon,
      isActive: t.isActive !== false,
    })),
  };
}

// GET /api/admin/toolbox — list ALL toolbox groups (including disabled ones)
// so the admin can see and toggle everything.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "需要管理員權限" }, { status: 403 });
  }

  await connectDB();
  const configs = await ToolboxConfig.find().sort({ createdAt: 1 }).lean();
  const result = configs.map(serializeGroup);

  // Surface built-in groups that were never seeded (e.g. journey) so they still
  // get a toggle. They are persisted to the DB the first time they're toggled.
  const existingTypes = new Set(configs.map((c) => c.type));
  for (const def of Object.values(TOOLBOX_DEFAULTS)) {
    if (!existingTypes.has(def.type)) {
      result.push(serializeGroup(def));
    }
  }

  return NextResponse.json(result);
}

// PATCH /api/admin/toolbox — toggle a group or an individual tool on/off.
// Body:
//   { type, isActive }            → toggle a whole group
//   { type, toolKey, isActive }   → toggle a single tool within a group
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "需要管理員權限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const type = (body.type ?? "").toString().trim();
    const toolKey = body.toolKey ? body.toolKey.toString().trim() : null;
    const isActive = body.isActive;

    if (!type || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    await connectDB();
    let config = await ToolboxConfig.findOne({ type });
    if (!config) {
      // Group isn't in the DB yet. If it's a known built-in default (journey),
      // create it now so the toggle persists; otherwise it genuinely doesn't exist.
      const def: ToolboxConfigDefault | undefined = TOOLBOX_DEFAULTS[type];
      if (!def) {
        return NextResponse.json({ error: "找不到工具群組" }, { status: 404 });
      }
      config = await ToolboxConfig.create(def);
    }

    if (toolKey) {
      const tool = config.tools.find((t: ITool) => t.key === toolKey);
      if (!tool) {
        return NextResponse.json({ error: "找不到工具" }, { status: 404 });
      }
      tool.isActive = isActive;
      config.markModified("tools");
    } else {
      config.isActive = isActive;
    }

    await config.save();

    return NextResponse.json({
      type: config.type,
      isActive: config.isActive !== false,
      tools: config.tools.map((t: ITool) => ({ key: t.key, isActive: t.isActive !== false })),
    });
  } catch (err) {
    console.error("[admin/toolbox:PATCH]", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
