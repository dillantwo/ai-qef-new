"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Limits mirror the original FractionApp-es tool.
const LIMITS = { denStart: 100, expandFactor: 20 } as const;

type Op = "*" | "/";

/**
 * Scoped styles for the fraction expand/simplify tool.
 * Ported from the previous static HTML (nav.css + FractionApp64.css +
 * number-line.css + bar-component.css) with the `body` selector rewritten to a
 * `.fes-root` wrapper so it stays isolated when rendered as a Next.js route.
 *
 * The dividing-line reveal now uses @keyframes (fracGrowDown / fracShrinkUp)
 * that replay reliably because React remounts the grid on every recompute.
 */
const STYLES = `
.fes-root {
  --primary:#3498db; --accent:#8e44ad; --success:#27ae60; --red:#e74c3c;
  --gray:#95a5a6; --grid-dark:#333; --yellow:#eeb015;
  font-family:'PingFang HK','Microsoft JhengHei','Noto Sans TC',sans-serif;
  background:linear-gradient(135deg,#e0f7fa 0%,#fff9c4 100%);
  min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:20px;
}
.fes-root *{ margin:0; padding:0; box-sizing:border-box; }
.fes-root .container{ background:#fff; padding:1.5rem; border-radius:16px;
  box-shadow:0 4px 20px rgba(0,0,0,0.1); max-width:850px; width:100%; }

/* nav */
.fes-root .header{ display:flex; justify-content:space-between; align-items:center;
  margin-bottom:20px; border-bottom:1px solid #ddd; padding-bottom:12px; flex-wrap:wrap; gap:15px; }
.fes-root .header-left{ display:flex; align-items:center; gap:15px; }
.fes-root .title-badge{ color:#0056b3; font-weight:bold; font-size:1.4rem; letter-spacing:1px; }
.fes-root .header-right{ display:flex; align-items:center; gap:15px; flex-wrap:wrap; justify-content:flex-end; }
.fes-root .controls-pill{ display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #ccc;
  border-radius:8px; padding:6px 16px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
.fes-root .checkbox-label{ display:flex; align-items:center; gap:6px; font-size:0.95rem; color:#333;
  cursor:pointer; user-select:none; font-weight:bold; }
.fes-root .checkbox-label input[type=checkbox]{ cursor:pointer; width:16px; height:16px; accent-color:var(--primary); }
.fes-root .divider-v{ width:1px; height:18px; background:#ccc; }
.fes-root .speed-ctrl{ display:flex; align-items:center; gap:8px; font-size:0.95rem; color:#333; font-weight:bold; }
.fes-root .speed-ctrl input[type=range]{ width:80px; cursor:pointer; accent-color:var(--primary); }
.fes-root .lang-btn{ padding:6px 16px; border:2px solid var(--gray); background:#fff; color:#333;
  border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.95rem; box-shadow:0 3px 0 var(--gray);
  outline:none; transition:0.15s; transform:translateY(0); }
.fes-root .lang-btn:active{ box-shadow:0 0 0 var(--gray); transform:translateY(3px); }
.fes-root .lang-btn.btn-active-mode{ border-color:#34495e; color:#34495e; box-shadow:0 3px 0 #34495e; }

/* control panel */
.fes-root .control-panel{ display:flex; justify-content:center; gap:15px; margin-bottom:25px; position:relative; z-index:10; }
.fes-root .action-btn{ width:140px; padding:12px; border-radius:12px; border:2px solid transparent; cursor:pointer;
  font-size:1.2rem; font-weight:bold; transition:0.15s ease-out; background:#fff; transform:translateY(0); }
.fes-root .btn-merge{ border-color:var(--success); color:var(--success); box-shadow:0 6px 0 var(--success); }
.fes-root .btn-merge:disabled{ background:var(--success); color:#fff; box-shadow:0 0 0 var(--success); transform:translateY(6px); opacity:1; cursor:default; }
.fes-root .btn-slice{ border-color:var(--yellow); color:var(--yellow); box-shadow:0 6px 0 var(--yellow); }
.fes-root .btn-slice:disabled{ background:var(--yellow); color:#fff; box-shadow:0 0 0 var(--yellow); transform:translateY(6px); opacity:1; cursor:default; }

/* math engine */
.fes-root .math-engine{ display:flex; align-items:center; justify-content:center; gap:10px; margin:15px 0;
  padding:25px 15px 15px 15px; border-radius:20px; background:#fdfdfd; border:2px solid #eee; flex-wrap:wrap; }
.fes-root .fraction-box{ display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
.fes-root .fraction-input[readonly]{ border:transparent; background:transparent; font-size:2rem; pointer-events:none;
  width:100%; text-align:center; font-weight:bold; padding:8px 5px; }
.fes-root .num-target{ color:var(--accent); }
.fes-root .fraction-line{ width:100%; height:5px; background:var(--grid-dark); margin:8px 0; border-radius:3px; }
.fes-root .eq-sign{ font-size:2.5rem; font-weight:bold; color:#000; flex-shrink:0; margin:0 5px; }
.fes-root .process-container{ border:3px dashed #000; padding:15px; border-radius:20px; background:#fffcf0;
  display:flex; flex-direction:column; align-items:center; flex-grow:1; min-width:250px; box-sizing:border-box; }
.fes-root .row-align{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin:5px 0; }
.fes-root .base-num{ font-size:2rem; font-weight:bold; text-align:center; width:40px; flex-shrink:0; }
.fes-root .num-input{ color:var(--primary); }
.fes-root .den-input{ color:var(--grid-dark); }
.fes-root .op-select{ display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:900;
  border:3px solid #000; color:#000; border-radius:8px; width:65px; height:50px; background:#fff; box-sizing:border-box; user-select:none; }
.fes-root .input-wrapper{ display:flex; align-items:center; border-radius:12px; background:#fff; overflow:hidden;
  height:50px; border:3px solid #000; box-sizing:border-box; transition:0.3s; }
.fes-root .input-wrapper.start-wrap{ border-color:#34495e; width:100px; }
.fes-root .input-wrapper.factor-wrap{ width:95px; }
.fes-root .input-wrapper input{ flex:1; width:100%; height:100%; border:none; outline:none; text-align:center;
  font-size:1.8rem; font-weight:bold; background:transparent; -moz-appearance:textfield; color:#000; }
.fes-root .input-wrapper input::-webkit-inner-spin-button,
.fes-root .input-wrapper input::-webkit-outer-spin-button{ -webkit-appearance:none; margin:0; }
.fes-root .stepper-btn-group{ display:flex; flex-direction:column; height:100%; width:35px; border-left:2px solid #000; flex-shrink:0; transition:0.3s; }
.fes-root .step-btn{ height:50%; flex:none; width:100%; border:none; background:#f8f9fa; color:#000; font-size:1.2rem;
  font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; line-height:1; transition:0.2s; user-select:none; box-sizing:border-box; }
.fes-root .step-btn:active{ background:#e2e6ea; }
.fes-root .step-btn.up{ border-bottom:2px solid #000; }

.fes-root .error-msg{ color:var(--red); font-size:0.9rem; text-align:center; min-height:2.4rem; margin-top:-10px;
  margin-bottom:10px; font-weight:bold; width:100%; white-space:pre-line; }

.fes-root .visual-stack{ width:100%; display:flex; flex-direction:column; gap:20px; margin-bottom:20px; }
.fes-root .bar-label{ font-weight:bold; margin-bottom:5px; font-size:1.1rem; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.fes-root .bar-container{ height:70px; background:#f5f5f5; border-radius:6px; position:relative; overflow:hidden; border:2px solid #2c3e50;
  transition:width 0.3s ease, border-color 0.3s, box-shadow 0.3s, filter 0.3s; }
.fes-root .bar-fill{ height:100%; transition:width 0.4s ease; position:absolute; z-index:1; opacity:0.8; pointer-events:none; border-radius:0; }
.fes-root .grid-overlay{ position:absolute; top:0; left:0; width:100%; height:100%; display:flex; z-index:2; pointer-events:none; }
.fes-root .grid-lines{ position:absolute; top:0; left:0; width:100%; height:100%; z-index:5; pointer-events:none; background-repeat:repeat; }
.fes-root .grid-lines-fine{ position:absolute; top:0; left:0; width:100%; z-index:4; pointer-events:none; background-repeat:repeat; overflow:hidden; }

@keyframes fracGrowDown { from { height:0%; } to { height:100%; } }
@keyframes fracShrinkUp { from { height:100%; } to { height:0%; } }

.fes-root .number-line-wrapper{ padding:0 2px; margin-top:5px; transition:width 0.3s ease, opacity 0.3s ease; }
.fes-root .number-line-container{ position:relative; height:50px; width:100%; }
.fes-root .nl-line{ position:absolute; top:5px; left:0; width:100%; height:2px; background:#2c3e50; }
.fes-root .nl-tick-wrapper{ position:absolute; top:0; display:flex; flex-direction:column; align-items:center; transform:translateX(-50%); }
.fes-root .nl-tick{ width:2px; height:12px; background:#2c3e50; }
.fes-root .nl-tick.major{ height:18px; width:3px; }
.fes-root .nl-label{ margin-top:4px; font-size:0.9rem; font-weight:bold; color:#000; text-align:center; }
.fes-root .nl-frac{ display:inline-flex; flex-direction:column; align-items:center; line-height:1.1; font-size:0.85rem; }
.fes-root .nl-num, .fes-root .nl-den{ padding:0 2px; }
.fes-root .nl-line-frac{ width:100%; height:1.5px; background:#2c3e50; margin:1px 0; }

/* question banner */
.fes-root .question-banner{ display:none; background:#e3f2fd; border-radius:14px; padding:14px 20px; margin-bottom:20px; text-align:center; border:2px solid #bbdefb; }
.fes-root .question-banner.show{ display:block; }
.fes-root .q-label{ font-size:0.85rem; color:#666; margin-bottom:6px; }
.fes-root .q-equation{ display:flex; align-items:center; justify-content:center; gap:10px; font-size:1.6rem; font-weight:bold; color:#1565c0; }
.fes-root .q-frac{ display:inline-flex; flex-direction:column; align-items:center; line-height:1.1; }
.fes-root .q-num, .fes-root .q-den{ padding:2px 8px; }
.fes-root .q-line{ width:100%; height:3px; background:#1565c0; border-radius:2px; }
.fes-root .q-blank{ color:var(--accent); background:#f3e5f5; border:2px dashed var(--accent); border-radius:6px; padding:0 10px; min-width:36px; text-align:center; }

/* embedded (inside iframe) */
.fes-root.embedded{ background:transparent; padding:15px; min-height:auto; }
.fes-root.embedded .title-badge{ display:none; }
.fes-root.embedded .header{ justify-content:space-between; border-bottom:none; margin-bottom:10px; padding-bottom:0; }
.fes-root.embedded .container{ box-shadow:none; border-radius:0; padding:1rem; }

@media (max-width:600px){
  .fes-root .container{ padding:1rem; }
  .fes-root .title-badge{ font-size:1.1rem; }
  .fes-root .header{ justify-content:center; }
  .fes-root .header-right{ justify-content:center; width:100%; }
  .fes-root .controls-pill{ width:100%; justify-content:center; flex-wrap:wrap; }
  .fes-root .math-engine{ padding:20px 8px 8px 8px; gap:3px; }
  .fes-root .input-wrapper{ height:42px; }
  .fes-root .input-wrapper.start-wrap{ width:85px; }
  .fes-root .input-wrapper.factor-wrap{ width:80px; }
  .fes-root .input-wrapper input{ font-size:1.4rem; }
  .fes-root .stepper-btn-group{ width:30px; }
  .fes-root .step-btn{ font-size:1.1rem; }
  .fes-root .fraction-input[readonly]{ font-size:1.6rem; }
  .fes-root .eq-sign{ font-size:1.5rem; margin:0 2px; }
  .fes-root .process-container{ min-width:auto; padding:8px; flex-grow:1; }
  .fes-root .base-num{ font-size:1.3rem; width:20px; }
  .fes-root .op-select{ width:40px; height:42px; font-size:1.3rem; padding:0; }
  .fes-root .bar-container{ height:50px; }
  .fes-root .bar-label{ font-size:1rem; }
  .fes-root .action-btn{ width:110px; font-size:1.1rem; padding:10px; }
  .fes-root .lang-btn{ padding:6px 14px; font-size:0.85rem; }
}
`;

function clampStart(nRaw: string, dRaw: string): { n: string; d: string } | null {
  const n = parseInt(nRaw, 10);
  const d = parseInt(dRaw, 10);
  if (isNaN(n) || isNaN(d)) return null;
  let nn = n;
  let dd = d;
  if (dd > LIMITS.denStart) dd = LIMITS.denStart;
  if (dd < 1) dd = 1;
  if (nn > dd) nn = dd;
  if (nn < 0) nn = 0;
  return { n: String(nn), d: String(dd) };
}

function FractionESInner() {
  const searchParams = useSearchParams();

  const [nStartStr, setNStartStr] = useState("2");
  const [dStartStr, setDStartStr] = useState("8");
  const [fnStr, setFnStr] = useState("1");
  const [fdStr, setFdStr] = useState("1");
  const [op, setOp] = useState<Op>("*");
  const [isSyncMode, setIsSyncMode] = useState(true);
  const [showNumberLine, setShowNumberLine] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [targetNum, setTargetNum] = useState<number | null>(null);
  const [targetDen, setTargetDen] = useState<number | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [animGen, setAnimGen] = useState(0);

  // ----- derived numeric values (mirror renderEverything) -----
  const n1 = parseInt(nStartStr, 10) || 2;
  const d1 = parseInt(dStartStr, 10) || 8;
  const fnVal = fnStr === "" ? 1 : parseInt(fnStr, 10) || 1;
  const fdVal = fdStr === "" ? 1 : parseInt(fdStr, 10) || 1;

  const isNumMismatch = !isSyncMode && fnVal !== fdVal;

  let canCalculate = true;
  const errorLines: string[] = [];
  if (op === "/") {
    if (fnVal === 0 || fdVal === 0) {
      canCalculate = false;
    } else if (n1 % fnVal !== 0 || d1 % fdVal !== 0) {
      errorLines.push(`⚠️ 錯誤：分子不能被 ${fnVal} 整除，或分母不能被 ${fdVal} 整除`);
      canCalculate = false;
    }
  }
  if (isNumMismatch) {
    errorLines.push("⚠️ 提示：分子和分母乘以或除以不同的數字，分數值已改變。");
  }

  const eqLeft = isNumMismatch && canCalculate ? "≠" : "=";
  const n2: number | null = canCalculate ? (op === "*" ? n1 * fnVal : n1 / fnVal) : null;
  const d2: number | null = canCalculate ? (op === "*" ? d1 * fdVal : d1 / fdVal) : null;

  // ----- bar + number-line geometry (mirror drawProcess / drawNumberLine) -----
  const maxGrid = op === "*" ? d2 ?? d1 : d1;
  const ratio = canCalculate && n2 !== null && d2 ? n2 / d2 : 0;
  const scale = Math.max(1, ratio);
  const drawSegments = Math.max(maxGrid, Math.round(maxGrid * scale));

  const scaleWidthPct = scale * 100;
  const barWidthPct = scale > 0 ? (ratio / scale) * 100 : 0;

  // The resting grid (every "coarse boundary" that exists before expanding /
  // survives after simplifying) is painted in one pass with a repeating gradient
  // so all lines are pixel-identical. The finer subdivisions that grow in / shrink
  // away during the animation are the only ones drawn as individual lines.
  const coarseSegs = fdVal > 0 ? fdVal : 1;
  // Are there finer subdivisions beyond the coarse (surviving) grid? If so they
  // reveal (expand) or retract (simplify) as one layer that grows/shrinks.
  const hasFineGrid = drawSegments > coarseSegs;
  // All dividing lines share the same thin thickness so the result bar reads
  // as a uniform grid regardless of expansion/simplification state.
  const coarseLineW = 1;

  const maxFactor = Math.max(fnVal, fdVal);
  const baseAnimDuration = maxFactor > 3 ? 4.0 : 6.0;
  const animDuration = `${baseAnimDuration / speed}s`;

  // number-line ticks
  const nlDen = maxGrid;
  const ticks: { leftPct: number; label: React.ReactNode }[] = [];
  for (let i = 0; i <= drawSegments; i++) {
    const leftPct = (i / drawSegments) * 100;
    let label: React.ReactNode;
    if (i === 0) label = "0";
    else if (i === nlDen) label = "1";
    else if (nlDen !== 0 && i % nlDen === 0) label = String(i / nlDen);
    else
      label = (
        <span className="nl-frac">
          <span className="nl-num">{i}</span>
          <span className="nl-line-frac" />
          <span className="nl-den">{nlDen}</span>
        </span>
      );
    ticks.push({ leftPct, label });
  }

  // ----- factor / op-select colours (mirror syncOpColor) -----
  const baseColor = fnVal === 1 ? "#000" : op === "*" ? "var(--yellow)" : "var(--success)";
  const textColor = isNumMismatch ? "var(--red)" : fnVal === 1 ? "#000" : baseColor;
  const opColor = fnVal === 1 ? "#000" : baseColor;
  const fnBorder = isNumMismatch ? "var(--red)" : baseColor;
  const fdBorder = isNumMismatch
    ? "var(--red)"
    : fdVal === 1
      ? "#000"
      : op === "*"
        ? "var(--yellow)"
        : "var(--success)";
  const groupBorder = isNumMismatch ? "var(--red)" : "#000";

  // restart the reveal animation whenever the picture meaningfully changes
  useEffect(() => {
    setAnimGen((g) => g + 1);
  }, [n1, d1, fnVal, fdVal, op, isSyncMode]);

  useEffect(() => {
    try {
      setEmbedded(window.self !== window.top);
    } catch {
      setEmbedded(true);
    }
  }, []);

  // ----- actions -----
  const applyStart = useCallback((nRaw: string, dRaw: string) => {
    const clamped = clampStart(nRaw, dRaw);
    if (!clamped) {
      setNStartStr(nRaw);
      setDStartStr(dRaw);
      return;
    }
    setNStartStr(clamped.n);
    setDStartStr(clamped.d);
  }, []);

  const applyFactor = useCallback(
    (which: "fn" | "fd", raw: string) => {
      if (raw === "") {
        if (which === "fn") setFnStr("");
        else setFdStr("");
        return;
      }
      let val = parseInt(raw, 10) || 1;
      if (val < 1) val = 1;
      const maxLimit = op === "*" ? LIMITS.expandFactor : LIMITS.denStart;
      if (val > maxLimit) val = maxLimit;
      const s = String(val);
      if (isSyncMode) {
        setFnStr(s);
        setFdStr(s);
      } else if (which === "fn") {
        setFnStr(s);
      } else {
        setFdStr(s);
      }
    },
    [op, isSyncMode],
  );

  const setMode = useCallback((nextOp: Op) => {
    setOp(nextOp);
    setFnStr("1");
    setFdStr("1");
  }, []);

  const toggleSyncMode = useCallback(() => {
    if (!isSyncMode) {
      // switching back to sync: re-align denominator factor to the numerator factor
      const val = fnStr === "" ? "1" : fnStr;
      setFnStr(val);
      setFdStr(val);
    }
    setIsSyncMode((prev) => !prev);
  }, [isSyncMode, fnStr]);

  const generateRandomFraction = useCallback(() => {
    let d = Math.floor(Math.random() * 11) + 2;
    let n = Math.floor(Math.random() * d) + 1;
    if (op === "/") {
      let multiplier = Math.floor(Math.random() * 4) + 2;
      if (d * multiplier > LIMITS.denStart) {
        multiplier = Math.floor(LIMITS.denStart / d);
        if (multiplier < 2) multiplier = 2;
      }
      n *= multiplier;
      d *= multiplier;
      if (d > LIMITS.denStart) {
        d = LIMITS.denStart;
        n = Math.floor(d / 2);
      }
    }
    setNStartStr(String(n));
    setDStartStr(String(d));
    setFnStr("1");
    setFdStr("1");
  }, [op]);

  const swapFractions = useCallback(() => {
    if (n2 === null || d2 === null) return;
    setNStartStr(String(n2));
    setDStartStr(String(d2));
    setOp((prev) => (prev === "*" ? "/" : "*"));
    // factors are intentionally preserved across the swap
  }, [n2, d2]);

  const stepStart = useCallback(
    (which: "n" | "d", delta: number) => {
      if (which === "n") {
        const v = (parseInt(nStartStr, 10) || 0) + delta;
        applyStart(String(v), dStartStr);
      } else {
        const v = (parseInt(dStartStr, 10) || 0) + delta;
        applyStart(nStartStr, String(v));
      }
    },
    [nStartStr, dStartStr, applyStart],
  );

  const stepFactor = useCallback(
    (which: "fn" | "fd", delta: number) => {
      const cur = which === "fn" ? fnStr : fdStr;
      const v = (parseInt(cur, 10) || 1) + delta;
      applyFactor(which, String(v));
    },
    [fnStr, fdStr, applyFactor],
  );

  // ----- incoming params: query string + postMessage -----
  const applyIncoming = useCallback(
    (p: {
      numerator?: number | null;
      denominator?: number | null;
      mode?: string | null;
      targetNum?: number | null;
      targetDen?: number | null;
    }) => {
      if (p.targetNum !== undefined && p.targetNum !== null) setTargetNum(p.targetNum);
      if (p.targetDen !== undefined && p.targetDen !== null) setTargetDen(p.targetDen);
      if (p.numerator != null && p.denominator != null && p.denominator >= 1) {
        setNStartStr(String(Math.min(p.numerator, p.denominator)));
        setDStartStr(String(Math.min(p.denominator, LIMITS.denStart)));
      }
      setOp(p.mode === "simplify" ? "/" : "*");
      setFnStr("1");
      setFdStr("1");
    },
    [],
  );

  useEffect(() => {
    const pNum = parseInt(searchParams.get("numerator") ?? "", 10);
    const pDen = parseInt(searchParams.get("denominator") ?? "", 10);
    const pTargetNum = searchParams.get("targetNum");
    const pTargetDen = searchParams.get("targetDen");
    applyIncoming({
      numerator: isNaN(pNum) ? null : pNum,
      denominator: isNaN(pDen) ? null : pDen,
      mode: searchParams.get("mode"),
      targetNum: pTargetNum ? parseInt(pTargetNum, 10) : null,
      targetDen: pTargetDen ? parseInt(pTargetDen, 10) : null,
    });
  }, [searchParams, applyIncoming]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.type === "set-params" && e.data.params) {
        applyIncoming(e.data.params);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [applyIncoming]);

  const showBanner = targetNum !== null || targetDen !== null;
  const targetDisplay = canCalculate ? { n: String(n2), d: String(d2) } : { n: "?", d: "?" };

  return (
    <div
      className={`fes-root${embedded ? " embedded" : ""}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{STYLES}</style>
      <div className="container">
        {/* header */}
        <div className="header">
          <div className="header-left">
            <button
              type="button"
              className={`lang-btn${isSyncMode ? " btn-active-mode" : ""}`}
              onClick={toggleSyncMode}
            >
              {isSyncMode ? "同步分子分母" : "自由調整"}
            </button>
            <div className="title-badge">相等分數</div>
          </div>
          <div className="header-right">
            <button type="button" className="lang-btn" onClick={swapFractions}>
              左右互換
            </button>
            <button type="button" className="lang-btn" onClick={generateRandomFraction}>
              隨機分數
            </button>
            <div className="controls-pill">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showNumberLine}
                  onChange={(e) => setShowNumberLine(e.target.checked)}
                />{" "}
                顯示數線
              </label>
              <div className="divider-v" />
              <div className="speed-ctrl">
                <span>動畫速度: {speed.toFixed(1)} x</span>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* question banner */}
        <div className={`question-banner${showBanner ? " show" : ""}`}>
          <div className="q-label">在空格內填上正確的數字</div>
          <div className="q-equation">
            <span className="q-frac">
              <span className="q-num">{n1}</span>
              <span className="q-line" />
              <span className="q-den">{d1}</span>
            </span>
            <span>=</span>
            <span className="q-frac">
              <span className="q-num">
                {targetNum !== null ? targetNum : <span className="q-blank">?</span>}
              </span>
              <span className="q-line" />
              <span className="q-den">
                {targetDen !== null ? targetDen : <span className="q-blank">?</span>}
              </span>
            </span>
          </div>
        </div>

        {/* mode buttons */}
        <div className="control-panel">
          <button
            type="button"
            className="action-btn btn-merge"
            disabled={op === "/"}
            onClick={() => setMode("/")}
          >
            約分
          </button>
          <button
            type="button"
            className="action-btn btn-slice"
            disabled={op === "*"}
            onClick={() => setMode("*")}
          >
            擴分
          </button>
        </div>

        {/* math engine */}
        <div className="math-engine">
          <div className="fraction-box">
            <div className="input-wrapper start-wrap">
              <input
                type="number"
                className="num-input"
                value={nStartStr}
                min={1}
                max={100}
                inputMode="numeric"
                onChange={(e) => applyStart(e.target.value, dStartStr)}
                onBlur={() =>
                  applyStart(nStartStr === "" || isNaN(parseInt(nStartStr, 10)) ? "2" : nStartStr, dStartStr)
                }
              />
              <div className="stepper-btn-group">
                <button type="button" className="step-btn up" onClick={() => stepStart("n", 1)}>
                  +
                </button>
                <button type="button" className="step-btn down" onClick={() => stepStart("n", -1)}>
                  -
                </button>
              </div>
            </div>
            <div className="fraction-line" />
            <div className="input-wrapper start-wrap">
              <input
                type="number"
                className="den-input"
                value={dStartStr}
                min={1}
                max={100}
                inputMode="numeric"
                onChange={(e) => applyStart(nStartStr, e.target.value)}
                onBlur={() =>
                  applyStart(nStartStr, dStartStr === "" || isNaN(parseInt(dStartStr, 10)) ? "8" : dStartStr)
                }
              />
              <div className="stepper-btn-group">
                <button type="button" className="step-btn up" onClick={() => stepStart("d", 1)}>
                  +
                </button>
                <button type="button" className="step-btn down" onClick={() => stepStart("d", -1)}>
                  -
                </button>
              </div>
            </div>
          </div>

          <div className="eq-sign" style={{ color: eqLeft === "≠" ? "var(--red)" : "#000" }}>
            {eqLeft}
          </div>

          <div className="process-container">
            <div className="row-align">
              <div className="base-num num-input">{n1}</div>
              <div className="op-select" style={{ borderColor: opColor, color: opColor }}>
                {op === "*" ? "×" : "÷"}
              </div>
              <div className="input-wrapper factor-wrap" style={{ borderColor: fnBorder }}>
                <input
                  type="number"
                  value={fnStr}
                  min={1}
                  max={20}
                  inputMode="numeric"
                  style={{ color: textColor }}
                  onChange={(e) => applyFactor("fn", e.target.value)}
                  onBlur={() => {
                    if (fnStr === "") applyFactor("fn", "1");
                  }}
                />
                <div className="stepper-btn-group" style={{ borderLeftColor: groupBorder }}>
                  <button
                    type="button"
                    className="step-btn up"
                    style={{ color: textColor }}
                    onClick={() => stepFactor("fn", 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="step-btn down"
                    style={{ color: textColor }}
                    onClick={() => stepFactor("fn", -1)}
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className="fraction-line" style={{ margin: "10px 0", background: "#000", height: 3 }} />
            <div className="row-align">
              <div className="base-num den-input">{d1}</div>
              <div className="op-select" style={{ borderColor: opColor, color: opColor }}>
                {op === "*" ? "×" : "÷"}
              </div>
              <div className="input-wrapper factor-wrap" style={{ borderColor: fdBorder }}>
                <input
                  type="number"
                  value={fdStr}
                  min={1}
                  max={20}
                  inputMode="numeric"
                  style={{ color: textColor }}
                  onChange={(e) => applyFactor("fd", e.target.value)}
                  onBlur={() => {
                    if (fdStr === "") applyFactor("fd", "1");
                  }}
                />
                <div className="stepper-btn-group" style={{ borderLeftColor: groupBorder }}>
                  <button
                    type="button"
                    className="step-btn up"
                    style={{ color: textColor }}
                    onClick={() => stepFactor("fd", 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="step-btn down"
                    style={{ color: textColor }}
                    onClick={() => stepFactor("fd", -1)}
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="eq-sign">=</div>

          <div className="fraction-box" style={{ width: 80 }}>
            <input
              type="text"
              className="fraction-input num-target"
              readOnly
              tabIndex={-1}
              value={targetDisplay.n}
            />
            <div className="fraction-line" />
            <input
              type="text"
              className="fraction-input den-input"
              readOnly
              tabIndex={-1}
              value={targetDisplay.d}
            />
          </div>
        </div>

        <div className="error-msg">{errorLines.join("\n")}</div>

        {/* visualization */}
        <div className="visual-stack">
          <div>
            <div
              className="bar-label"
              style={{ color: "var(--accent)", justifyContent: "space-between", width: "100%" }}
            >
              <span>運算結果</span>
            </div>
            <div
              style={{
                width: "100%",
                overflow: "visible",
                borderRadius: 8,
                filter: canCalculate ? "grayscale(0%)" : "grayscale(100%)",
              }}
            >
              <div style={{ width: `${scaleWidthPct}%`, minWidth: "100%", transition: "width 0.3s ease" }}>
                <div
                  className="bar-container"
                  style={{ borderColor: "var(--accent)", width: "100%" }}
                >
                  <div
                    className="bar-fill"
                    style={{
                      background: "var(--accent)",
                      opacity: 0.8,
                      width: `${barWidthPct}%`,
                      visibility: canCalculate ? "visible" : "hidden",
                    }}
                  />
                  <div
                    key={animGen}
                    className="grid-overlay"
                    style={{ visibility: canCalculate ? "visible" : "hidden" }}
                  >
                    {/* coarse grid: the original denominator cuts. When an expansion
                        adds finer subdivisions these stay bold to show the original
                        partition; otherwise they are the only grid and stay thin.
                        Painted in one pass so every line is pixel-identical. */}
                    <div
                      className="grid-lines"
                      style={{
                        backgroundImage: `repeating-linear-gradient(to right, #2c3e50 0, #2c3e50 ${coarseLineW}px, transparent ${coarseLineW}px, transparent calc(100% * ${coarseSegs} / ${drawSegments}))`,
                        backgroundPosition: `-${coarseLineW / 2}px 0`,
                      }}
                    />
                    {/* fine grid: the full set of new subdivisions (always thin),
                        revealed as one layer that grows down (expand) or retracts
                        up (simplify) */}
                    {hasFineGrid ? (
                      <div
                        className="grid-lines-fine"
                        style={{
                          backgroundImage: `repeating-linear-gradient(to right, #2c3e50 0, #2c3e50 1px, transparent 1px, transparent calc(100% / ${drawSegments}))`,
                          backgroundPosition: "-0.5px 0",
                          height: op === "*" ? "100%" : "0%",
                          animation: `${op === "*" ? "fracGrowDown" : "fracShrinkUp"} ${animDuration} cubic-bezier(0.4,0,0.2,1) both`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                {showNumberLine ? (
                  <div className="number-line-wrapper" style={{ width: "100%" }}>
                    <div className="number-line-container">
                      <div className="nl-line" />
                      <div>
                        {ticks.map((t, idx) => (
                          <div
                            key={idx}
                            className="nl-tick-wrapper"
                            style={{ left: `${t.leftPct}%` }}
                          >
                            <div className="nl-tick" />
                            <div className="nl-label">{t.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FractionESPage() {
  return (
    <Suspense fallback={null}>
      <FractionESInner />
    </Suspense>
  );
}
