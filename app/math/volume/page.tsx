"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import {
  PALETTE,
  computeEnclosedVolume,
  computePoolVolume,
  computeSurfaceArea,
  projectViews,
  useCubeStore,
  type Tool,
} from "./store";

// R3F must be client-only — Canvas relies on browser APIs.
const VolumeScene = dynamic(
  () => import("./VolumeScene").then((m) => m.VolumeScene),
  { ssr: false }
);

const TOOL_BUTTONS: Array<{ key: Tool | "xray" | "measure" | "container"; icon: string; label: string }> = [
  { key: "place", icon: "📦", label: "放置方塊" },
  { key: "erase", icon: "⬜", label: "刪除方塊" },
  { key: "paint", icon: "🎨", label: "上色 / 改色" },
  { key: "xray", icon: "👁️", label: "透視模式" },
  { key: "measure", icon: "📏", label: "度量" },
  { key: "rotateView", icon: "🔄", label: "旋轉視圖" },
  { key: "container", icon: "🗃️", label: "顯示容器" },
];

export default function VolumeExplorerPage() {
  const mode = useCubeStore((s) => s.mode);
  const tool = useCubeStore((s) => s.tool);
  const color = useCubeStore((s) => s.color);
  const xray = useCubeStore((s) => s.xray);
  const showLabels = useCubeStore((s) => s.showLabels);
  const showContainer = useCubeStore((s) => s.showContainer);
  const cubes = useCubeStore((s) => s.cubes);

  const setMode = useCubeStore((s) => s.setMode);
  const setTool = useCubeStore((s) => s.setTool);
  const setColor = useCubeStore((s) => s.setColor);
  const toggleLabels = useCubeStore((s) => s.toggleLabels);
  const toggleContainer = useCubeStore((s) => s.toggleContainer);
  const toggleXray = useCubeStore((s) => s.toggleXray);
  const rotateLeft = useCubeStore((s) => s.rotateLeft);
  const rotateRight = useCubeStore((s) => s.rotateRight);
  const clearAll = useCubeStore((s) => s.clearAll);
  const undo = useCubeStore((s) => s.undo);

  const cubeArr = useMemo(() => Object.values(cubes), [cubes]);
  const count = cubeArr.length;
  const area = useMemo(() => computeSurfaceArea(cubeArr), [cubeArr]);
  const views = useMemo(() => projectViews(cubeArr), [cubeArr]);
  const enclosed = useMemo(() => computeEnclosedVolume(cubeArr), [cubeArr]);
  const pool = useMemo(() => computePoolVolume(cubeArr), [cubeArr]);

  // Push state up to the dashboard (when embedded in iframe) so the AI tutor
  // chatbot can reason about the student's current construction.
  useEffect(() => {
    try {
      window.parent?.postMessage(
        {
          type: "volume-app:state",
          payload: {
            tool: "volume-cubes",
            cubeCount: count,
            volume: count,
            surfaceArea: area,
            enclosedVolume: enclosed,
            poolVolume: pool,
            views,
            cubes: cubeArr.map((c) => ({ x: c.x, y: c.y, z: c.z, color: c.color })),
            mode,
            tool_active: tool,
          },
        },
        "*"
      );
    } catch {}
  }, [count, area, enclosed, pool, views, cubeArr, mode, tool]);

  const isInteractionTool = (k: string): k is Tool =>
    k === "place" || k === "erase" || k === "paint" || k === "rotateView";

  function handleToolClick(k: typeof TOOL_BUTTONS[number]["key"]) {
    if (k === "xray") return toggleXray();
    if (k === "container") return toggleContainer();
    if (k === "measure") return toggleLabels();
    setTool(k);
  }

  function isToolActive(k: string) {
    if (k === "xray") return xray;
    if (k === "container") return showContainer;
    if (k === "measure") return showLabels;
    return tool === k;
  }

  return (
    <div className="grid h-full grid-rows-[40px_1fr] bg-white text-[#080808]">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-[#d8d8d8] bg-white">
        {([
          { id: "build", label: "手動構建" },
          { id: "inspect", label: "觀察模式" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`text-sm font-semibold leading-10 select-none transition-colors border-b-2 ${
              mode === t.id
                ? "text-[#146ef5] border-[#146ef5]"
                : "text-[#6b7280] border-transparent hover:text-[#080808]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="grid min-h-0 grid-cols-[180px_1fr_200px]">
        {/* LEFT: tools */}
        <aside className="overflow-y-auto border-r border-[#d8d8d8] bg-white p-3">
          <SectionTitle>{mode === "build" ? "手動構建" : "觀察模式"}</SectionTitle>

          <SectionTitle>Tools</SectionTitle>
          <div className="grid grid-cols-3 gap-1.5">
            {TOOL_BUTTONS.map((b) => (
              <button
                key={b.key}
                onClick={() => handleToolClick(b.key)}
                className={`flex flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-[11px] transition-colors ${
                  isToolActive(b.key)
                    ? "border-[#146ef5] bg-[#146ef5]/10 text-[#146ef5]"
                    : "border-[#d8d8d8] bg-white text-[#080808] hover:border-[#b9d3fb] hover:bg-[#f3f6fb]"
                }`}
              >
                <span className="text-base leading-none">{b.icon}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>

          <SectionTitle>Colors</SectionTitle>
          <div className="grid grid-cols-8 gap-1">
            {PALETTE.map((hex) => (
              <button
                key={hex}
                onClick={() => setColor(hex)}
                style={{ background: hex }}
                className={`aspect-square w-full rounded ${
                  color === hex ? "scale-105 ring-2 ring-[#146ef5]" : "ring-2 ring-transparent"
                }`}
                aria-label={`color ${hex}`}
              />
            ))}
          </div>

          <SectionTitle>View</SectionTitle>
          <ActionButton onClick={rotateLeft}>⟲ 向左旋轉</ActionButton>
          <ActionButton onClick={rotateRight}>⟳ 向右旋轉</ActionButton>

          <SectionTitle>Workspace</SectionTitle>
          <ActionButton
            onClick={() => {
              if (count && !confirm("確定要清除全部方塊嗎？")) return;
              clearAll();
            }}
          >
            🗑 清除全部
          </ActionButton>
          <ActionButton onClick={undo}>↩ 復原</ActionButton>
        </aside>

        {/* CENTER: 3D canvas */}
        <div className="relative min-w-0 bg-white">
          <VolumeScene />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-[#d8d8d8] bg-white/90 px-2.5 py-1.5 text-[11px] text-[#6b7280] backdrop-blur-sm">
            {mode === "build"
              ? "點擊網格放置方塊 · 拖曳右鍵旋轉視角"
              : "拖曳旋轉、滾輪縮放，觀察立體形狀"}
          </div>
        </div>

        {/* RIGHT: stats */}
        <aside className="overflow-y-auto border-l border-[#d8d8d8] bg-white p-3">
          <Card title="度量資訊">
            <Stat label="方塊數量" value={count} />
            <Stat label="體積" value={`${count} 立方單位`} />
            <Stat label="表面積" value={`${area} 平方單位`} />
            <Stat label="可裝水量（底面爲地面）" value={`${pool} 立方單位`} />
            <Stat label="完全包圍的空間" value={`${enclosed} 立方單位`} />
            <div className="flex items-center justify-between py-1.5 text-xs">
              <span>顯示度量標籤</span>
              <button
                onClick={toggleLabels}
                className={`relative h-[18px] w-8 rounded-full transition-colors ${
                  showLabels ? "bg-[#146ef5]" : "bg-[#d8d8d8]"
                }`}
                aria-pressed={showLabels}
              >
                <span
                  className={`absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white transition-all ${
                    showLabels ? "left-4" : "left-[2px]"
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card title="三視圖投影">
            <Stat label="頂視圖（俯視）" value={views.top} />
            <Stat label="前視圖" value={views.front} />
            <Stat label="側視圖" value={views.side} />
          </Card>

          <Card title="提示">
            <p className="text-[11px] leading-relaxed text-[#6b7280]">
              {mode === "build"
                ? "選擇「放置方塊」工具，點擊網格或既有方塊的面來疊加；選「刪除方塊」可移除；「上色」可變更顏色。"
                : "觀察模式：拖曳視角檢視整體形狀，右側面板會顯示體積、表面積與三視圖。"}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 mb-1.5 text-[11px] font-bold uppercase tracking-[0.8px] text-[#6b7280] first:mt-0">
      {children}
    </div>
  );
}

function ActionButton({
  onClick, children,
}: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="mb-1.5 flex w-full items-center gap-1.5 rounded-md border border-[#d8d8d8] bg-white px-2.5 py-2 text-xs text-[#080808] transition-colors hover:bg-[#f3f6fb]"
    >
      {children}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 rounded-lg border border-[#d8d8d8] bg-white p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="my-1 flex justify-between text-[13px]">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-bold text-[#146ef5]">{value}</span>
    </div>
  );
}
