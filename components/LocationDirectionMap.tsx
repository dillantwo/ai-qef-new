"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { basePath } from "@/lib/utils";

/**
 * Interactive "Location and Direction" map.
 *
 * This is the TypeScript/React port of the old
 * `public/english/preview-location-direction.html` iframe. A sprite is moved
 * around a map image with the arrow keys or the on-screen touch controls.
 *
 * Some task maps have a compass baked into the image (map2.png) while others
 * do not (Task 1). For the compass-less maps we reveal a reserved side column
 * that shows a recreated direction indicator and hosts the touch controls so
 * they don't overlap the map.
 */

type Direction = "up" | "down" | "left" | "right";

const FACING: Record<Direction, string> = {
  up: `${basePath}/english/facingNorth.png`,
  down: `${basePath}/english/facingSouth.png`,
  left: `${basePath}/english/facingWest.png`,
  right: `${basePath}/english/facingEast.png`,
};

// All tasks share the same map. It has no compass baked into the image, so the
// reserved side column (recreated compass + relocated controls) is always shown.
const MAP_SRC = `${basePath}/english/task 1 map.png`;

// Where the sprite starts for each task, as a percentage of the map image,
// plus the direction it initially faces.
// Task 1 begins inside the "post office" box (bottom-left) facing east.
const DEFAULT_START: { x: number; y: number; facing: Direction } = { x: 50, y: 50, facing: "up" };
const START_BY_TASK: Record<number, { x: number; y: number; facing: Direction }> = {
  1: { x: 15, y: 86, facing: "right" },
};

function startFor(task: number | null) {
  return (task != null && START_BY_TASK[task]) || DEFAULT_START;
}

type LocationDirectionMapProps = {
  /** The active task id, or null when no task is selected yet. */
  task: number | null;
};

export default function LocationDirectionMap({ task }: LocationDirectionMapProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLImageElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  // Sprite position as a percentage of the map (matches the original 5%..95%).
  const [spriteX, setSpriteX] = useState(() => startFor(task).x);
  const [spriteY, setSpriteY] = useState(() => startFor(task).y);
  const [facing, setFacing] = useState<Direction>(() => startFor(task).facing);

  // Reset the sprite to the task's starting box whenever the task changes.
  useEffect(() => {
    const start = startFor(task);
    setSpriteX(start.x);
    setSpriteY(start.y);
    setFacing(start.facing);
  }, [task]);

  // Pixel sizes derived from the rendered map width.
  const [spriteSize, setSpriteSize] = useState({ width: 0, height: 0 });
  const [buttonSize, setButtonSize] = useState({ size: 0, fontSize: 0 });

  const move = useCallback((direction: Direction) => {
    setFacing(direction);
    switch (direction) {
      case "up":
        setSpriteY((y) => Math.max(5, y - 5));
        break;
      case "down":
        setSpriteY((y) => Math.min(95, y + 5));
        break;
      case "left":
        setSpriteX((x) => Math.max(5, x - 5));
        break;
      case "right":
        setSpriteX((x) => Math.min(95, x + 5));
        break;
    }
  }, []);

  // Recompute sprite/control sizes relative to the rendered map width.
  const updateSizes = useCallback(() => {
    const mapWidth = mapRef.current?.offsetWidth ?? 0;
    if (!mapWidth) return;
    const width = mapWidth / 15;
    setSpriteSize({ width, height: width * 2 });

    // Sizing the buttons off the map alone can make them wider than the side
    // column on small screens, so they spill over the map. When the side
    // column is present, cap the size so the 3-button row (buttons + gaps)
    // always fits inside it. The gap is ~0.45x a button, so a row of three is
    // roughly 3 + 2 * 0.45 = 3.9 button widths.
    let size = mapWidth / 12;
    const sideWidth = sideRef.current?.offsetWidth ?? 0;
    if (sideWidth) {
      const fitToColumn = (sideWidth * 0.92) / 3.9;
      size = Math.min(size, fitToColumn);
    }
    // Keep them tappable on iPad but never oversized.
    size = Math.max(34, Math.min(size, 64));
    setButtonSize({ size, fontSize: size * 0.4 });
  }, []);

  useLayoutEffect(() => {
    updateSizes();
  }, [updateSizes]);

  useEffect(() => {
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, [updateSizes]);

  // Keyboard controls, scoped to the stage so it doesn't hijack the page.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const direction = map[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    },
    [move],
  );

  // Space the buttons apart relative to their size so it scales with the map.
  const controlGap = Math.max(8, buttonSize.size * 0.45);
  const controls = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: controlGap,
      }}
    >
      <div style={{ display: "flex", gap: controlGap, alignItems: "center" }}>
        <ControlButton size={buttonSize} label="↑" onPress={() => move("up")} />
      </div>
      <div style={{ display: "flex", gap: controlGap, alignItems: "center" }}>
        <ControlButton size={buttonSize} label="←" onPress={() => move("left")} />
        <ControlButton size={buttonSize} label="↓" onPress={() => move("down")} />
        <ControlButton size={buttonSize} label="→" onPress={() => move("right")} />
      </div>
    </div>
  );

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={() => stageRef.current?.focus()}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "2%",
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
        userSelect: "none",
        outline: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "66%",
          maxWidth: 720,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={mapRef}
          src={MAP_SRC}
          alt="Map of a specific location"
          onLoad={updateSizes}
          style={{ width: "100%", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            top: `${spriteY}%`,
            left: `${spriteX}%`,
            transform: "translate(-50%, -50%)",
            width: spriteSize.width,
            height: spriteSize.height,
            backgroundImage: `url('${FACING[facing]}')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            zIndex: 10,
          }}
        />
      </div>

      <div
          ref={sideRef}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            width: "20%",
            maxWidth: 200,
            gap: 24,
          }}
        >
        <CompassIndicator />
        {controls}
      </div>
    </div>
  );
}

function ControlButton({
  size,
  label,
  onPress,
}: {
  size: { size: number; fontSize: number };
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      style={{
        width: size.size,
        height: size.size,
        fontSize: size.fontSize,
        backgroundColor: "rgba(76, 175, 80, 0.9)",
        border: "2px solid rgba(255, 255, 255, 0.8)",
        borderRadius: 8,
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

/** Recreated North/South/West/East direction indicator (SVG). */
function CompassIndicator() {
  return (
    <svg
      viewBox="0 0 260 180"
      role="img"
      aria-label="Direction indicator"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <g stroke="#2f7fb8" strokeWidth={6} strokeLinecap="round">
        <line x1={130} y1={45} x2={130} y2={135} />
        <line x1={80} y1={90} x2={180} y2={90} />
      </g>
      <g fill="#2f7fb8">
        <polygon points="130,32 121,52 139,52" />
        <polygon points="130,148 121,128 139,128" />
        <polygon points="67,90 87,81 87,99" />
        <polygon points="193,90 173,81 173,99" />
      </g>
      <g fill="#111" fontFamily="Arial, sans-serif" fontSize={17} fontWeight="bold" textAnchor="middle">
        <text x={130} y={20}>North</text>
        <text x={130} y={172}>South</text>
        <text x={34} y={96}>West</text>
        <text x={226} y={96}>East</text>
      </g>
    </svg>
  );
}
