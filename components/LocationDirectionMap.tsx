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

  // Sprite size is derived from the rendered map width; the control buttons
  // size themselves via CSS (see the grid below) so they always fit the column.
  const [spriteSize, setSpriteSize] = useState({ width: 0, height: 0 });

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

  // A 3-column grid: each button is 1fr of the side column, so the whole pad
  // always fits inside it and scales with the screen (no overlap with the map).
  const controls = (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12%",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <ControlButton label="↑" onPress={() => move("up")} style={{ gridColumn: 2, gridRow: 1 }} />
      <ControlButton label="←" onPress={() => move("left")} style={{ gridColumn: 1, gridRow: 2 }} />
      <ControlButton label="↓" onPress={() => move("down")} style={{ gridColumn: 2, gridRow: 2 }} />
      <ControlButton label="→" onPress={() => move("right")} style={{ gridColumn: 3, gridRow: 2 }} />
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
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: React.CSSProperties;
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
        // Fill the grid cell and stay square; this makes the size adapt to the
        // side column (and therefore the screen) without ever overflowing.
        width: "100%",
        aspectRatio: "1 / 1",
        // Clamp keeps the glyph readable on small screens and big on iPad.
        fontSize: "clamp(14px, 1.8vw, 26px)",
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
        ...style,
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
