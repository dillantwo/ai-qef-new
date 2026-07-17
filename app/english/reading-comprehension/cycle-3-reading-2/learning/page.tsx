"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  BookOpen,
  BookOpenCheck,
  Brain,
  Eye,
  FastForward,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Info,
  Lightbulb,
  ListOrdered,
  PenLine,
  Puzzle,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import Header from "@/components/Header";
import { learningStyles } from "../../learning/styles";
import { questions, TOTAL_QUESTIONS, type PartId, type Question } from "./questions";

type Section = "overview" | "part1" | "part2" | "summary";

interface ModalData {
  emoji: string;
  title: string;
  msg: string;
  ok: boolean;
}

const TABS: { id: Section; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "part1", label: "Part 1: Materials", icon: Beaker },
  { id: "part2", label: "Part 2: Steps", icon: ListOrdered },
  { id: "summary", label: "Summary", icon: Trophy },
];

// Extra styles for the "Make a Balloon Puff Up" experiment sheet.
const sheetStyles = `
.rc-learning .sheet { background: var(--bg-article); border: 2px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden; transition: border-color 0.4s ease, box-shadow 0.4s ease; }
.rc-learning .sheet.clue-active { border-color: var(--accent-orange) !important; box-shadow: 0 0 20px rgba(255,140,66,0.2); }
.rc-learning .sheet-inner { padding: 16px 18px 18px; }
.rc-learning .sheet-title { text-align: center; font-weight: 800; font-size: 21px; color: var(--text-primary); }
.rc-learning .sheet-h { font-weight: 700; font-size: 15px; color: var(--accent-blue); margin: 14px 0 6px; }
.rc-learning .mat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
.rc-learning .mat-grid li { list-style: none; font-size: 13.5px; line-height: 1.7; color: var(--text-secondary); padding: 2px 0; display: flex; align-items: flex-start; gap: 8px; }
.rc-learning .mat-grid li .dot { color: var(--accent-blue); font-weight: 800; }
.rc-learning .safety-box { background: rgba(255,140,66,0.08); border-radius: var(--radius-sm); padding: 8px 12px; margin-top: 8px; font-size: 13px; line-height: 1.7; color: var(--text-secondary); display: flex; gap: 8px; align-items: flex-start; }
.rc-learning .safety-box svg { color: var(--accent-orange); flex-shrink: 0; margin-top: 2px; }
.rc-learning .steps-list { margin: 0; padding-left: 22px; }
.rc-learning .steps-list li { font-size: 13.5px; line-height: 1.7; color: var(--text-secondary); padding: 2px 0; }
.rc-learning .how-text, .rc-learning .tip-text { font-size: 13.5px; line-height: 1.7; color: var(--text-secondary); margin: 4px 0 0; }
.rc-learning .tip-text { font-style: italic; }
`;

export default function EnglishReadingComprehensionCycle3Reading2LearningPage() {
  const [section, setSection] = useState<Section>("overview");
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [hints, setHints] = useState<Record<number, boolean>>({});
  const [strategies, setStrategies] = useState<Record<number, boolean>>({});
  const [step, setStep] = useState<Record<PartId, number>>({ part1: 0, part2: 0 });
  const [activeClues, setActiveClues] = useState<{ ids: string[]; badge: string }>({
    ids: [],
    badge: "",
  });
  const [modal, setModal] = useState<ModalData | null>(null);

  const clueRefs = useRef<Record<string, HTMLElement | null>>({});
  const mainRef = useRef<HTMLElement | null>(null);

  const score = useMemo(
    () =>
      questions.reduce(
        (acc, q) => (answered[q.id] && answered[q.id] === q.answer ? acc + 1 : acc),
        0,
      ),
    [answered],
  );

  const clearHighlights = useCallback(() => setActiveClues({ ids: [], badge: "" }), []);

  const highlightClues = useCallback((q: Question) => {
    setActiveClues({ ids: q.clues, badge: q.clues[0] ?? "" });
    const first = q.clues[0];
    if (first) {
      window.setTimeout(() => {
        clueRefs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }, []);

  const switchSection = useCallback(
    (id: Section) => {
      setSection(id);
      clearHighlights();
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearHighlights],
  );

  const handleAnswer = useCallback(
    (q: Question, val: string) => {
      if (answered[q.id]) return;
      setAnswered((prev) => ({ ...prev, [q.id]: val }));
      if (val === q.answer) {
        setModal({
          emoji: "🎉",
          title: "Correct!",
          msg: "Well done! You found the right answer.",
          ok: true,
        });
      } else {
        setModal({
          emoji: "🤔",
          title: "Not quite!",
          msg: "The correct answer is highlighted in green. Read the explanation below.",
          ok: false,
        });
      }
      highlightClues(q);
    },
    [answered, highlightClues],
  );

  const toggleHint = useCallback(
    (q: Question) => {
      const opening = !hints[q.id];
      setHints((prev) => ({ ...prev, [q.id]: opening }));
      if (opening) highlightClues(q);
      else clearHighlights();
    },
    [hints, highlightClues, clearHighlights],
  );

  const toggleStrategy = useCallback((id: number) => {
    setStrategies((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const advanceStep = useCallback(
    (part: PartId) => {
      setStep((prev) => ({ ...prev, [part]: prev[part] + 1 }));
      clearHighlights();
    },
    [clearHighlights],
  );

  const goBackStep = useCallback(
    (part: PartId) => {
      setStep((prev) => ({ ...prev, [part]: Math.max(0, prev[part] - 1) }));
      clearHighlights();
    },
    [clearHighlights],
  );

  const resetAll = useCallback(() => {
    setAnswered({});
    setHints({});
    setStrategies({});
    setStep({ part1: 0, part2: 0 });
    clearHighlights();
    setSection("overview");
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [clearHighlights]);

  // Part 1 covers Q1–Q2 (materials & safety); Part 2 covers Q3–Q6 (steps, how
  // it works & the whole text).
  const part1Done = answered[1] && answered[2];
  const part2Done = answered[3] && answered[4] && answered[5] && answered[6];
  const allDone = Object.keys(answered).length === TOTAL_QUESTIONS;

  const isTabCompleted = (id: Section) => {
    if (id === "part1") return Boolean(part1Done);
    if (id === "part2") return Boolean(part2Done);
    if (id === "summary") return allDone;
    return false;
  };

  const summaryMsg =
    score === TOTAL_QUESTIONS
      ? "Perfect score! You're a reading superstar!"
      : score >= 4
        ? "Great job! Keep up the good work!"
        : score >= 2
          ? "Good effort! Review the hints and try again."
          : "Keep practicing — use the hints to help you next time!";

  const clueClass = (id: string) =>
    `highlight-clue${activeClues.ids.includes(id) ? " glow" : ""}${
      activeClues.badge === id ? " clue-badge" : ""
    }`;
  const setClueRef = (id: string) => (el: HTMLElement | null) => {
    clueRefs.current[id] = el;
  };
  const sheetActive = (part: "part1" | "part2") =>
    `sheet${section === part && activeClues.ids.length > 0 ? " clue-active" : ""}`;

  function renderQuestions(part: "part1" | "part2") {
    const list = questions.filter((q) => q.part === part);
    const current = step[part];
    const currentQ = list[current];
    const currentAnswered = currentQ ? Boolean(answered[currentQ.id]) : false;
    const isLast = current >= list.length - 1;
    return (
      <>
        <div className="q-progress">
          <span className="q-progress-label">
            Question {Math.min(current + 1, list.length)} of {list.length}
          </span>
          <span className="q-progress-track">
            {list.map((q, i) => (
              <span
                key={q.id}
                className={`q-progress-dot${i <= current ? " active" : ""}${
                  answered[q.id] ? " done" : ""
                }`}
              />
            ))}
          </span>
        </div>
        {list.slice(current, current + 1).map((q) => {
          const picked = answered[q.id];
          const cardClass = picked
            ? picked === q.answer
              ? "question-card answered-correct"
              : "question-card answered-wrong"
            : "question-card";
          return (
            <div className={cardClass} key={q.id}>
              <div className="q-number">Question {q.id}</div>
              <div className="q-text">{q.text}</div>
              {q.extra}
              <ul className="options-list">
                {q.options.map((opt) => {
                  let cls = "option-btn";
                  if (picked) {
                    cls += " disabled";
                    if (opt.val === q.answer) cls += " correct";
                    else if (opt.val === picked) cls += " wrong";
                  }
                  return (
                    <li key={opt.val}>
                      <button
                        type="button"
                        className={cls}
                        onClick={() => handleAnswer(q, opt.val)}
                      >
                        <span className="opt-letter">{opt.val}</span> {opt.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="hint-row">
                <button type="button" className="hint-btn" onClick={() => toggleHint(q)}>
                  <Lightbulb className="size-3.5" /> Show Clue
                </button>
                <button
                  type="button"
                  className="hint-btn strategy-btn"
                  onClick={() => toggleStrategy(q.id)}
                >
                  <GraduationCap className="size-3.5" /> Tips &amp; Key Reading Skills
                </button>
              </div>
              {hints[q.id] && <div className="hint-box">{q.hint}</div>}
              {strategies[q.id] && (
                <div className="reading-strategy">
                  <GraduationCap className="size-3.5" />
                  <span>{q.strategy}</span>
                </div>
              )}
              {picked && <div className="explain-box">{q.explain}</div>}
            </div>
          );
        })}
        {(current > 0 || (currentAnswered && !isLast)) && (
          <div className="q-nav-row">
            {current > 0 ? (
              <button type="button" className="q-nav-btn back" onClick={() => goBackStep(part)}>
                <ArrowLeft className="size-4" /> Previous
              </button>
            ) : (
              <span />
            )}
            {currentAnswered && !isLast ? (
              <button type="button" className="q-nav-btn next" onClick={() => advanceStep(part)}>
                Next Question <ArrowRight className="size-4" />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}
      </>
    );
  }

  // Materials list used in both the overview preview and Part 1.
  const materials = (withClues: boolean) => (
    <>
      <div className="sheet-h">Materials:</div>
      <ul className="mat-grid">
        <li>
          <span className="dot">•</span> vinegar
        </li>
        <li>
          <span className="dot">•</span> baking soda
        </li>
        <li>
          <span className="dot">•</span> a small plastic bottle
        </li>
        <li>
          <span className="dot">•</span> a funnel
        </li>
        <li>
          <span className="dot">•</span> a spoon
        </li>
        <li>
          <span className="dot">•</span> a tray
        </li>
        <li>
          <span className="dot">•</span> a balloon
        </li>
        <li>
          <span className="dot">•</span>{" "}
          {withClues ? (
            <span className={clueClass("q1")} ref={setClueRef("q1")}>
              a rubber band (helpful if you have one)
            </span>
          ) : (
            "a rubber band (helpful if you have one)"
          )}
        </li>
      </ul>
    </>
  );

  const safety = (withClues: boolean) => (
    <div className="safety-box">
      <ShieldAlert className="size-4" />
      <span>
        <strong>Safety:</strong>{" "}
        {withClues ? (
          <span className={clueClass("q2")} ref={setClueRef("q2")}>
            Ask an adult to help you.
          </span>
        ) : (
          "Ask an adult to help you."
        )}{" "}
        Wear safety goggles. If something gets in your eyes, wash them with clean water.
      </span>
    </div>
  );

  // Steps / How It Works / Tip used in both the preview and Part 2.
  const steps = (withClues: boolean) => (
    <>
      <div className="sheet-h">Steps:</div>
      <ol className="steps-list">
        <li>Put the plastic bottle on the tray.</li>
        <li>Pour some vinegar into the bottle.</li>
        <li>Take some baking soda with the spoon. Use the funnel to put the baking soda into the balloon.</li>
        <li>
          {withClues ? (
            <span className={clueClass("q3")} ref={setClueRef("q3")}>
              Carefully stretch the mouth of the balloon and wrap it around the neck of the bottle.
            </span>
          ) : (
            "Carefully stretch the mouth of the balloon and wrap it around the neck of the bottle."
          )}{" "}
          Do not let the baking soda fall into the bottle yet!
        </li>
        <li>Hold the mouth of the balloon tightly. Use the rubber band to tie it if you have one.</li>
        <li>When you are ready, lift the balloon so the baking soda drops into the bottle.</li>
        <li>Watch the balloon. What happens?</li>
      </ol>
      <div className="sheet-h">How It Works:</div>
      <p className="how-text">
        {withClues ? (
          <span className={clueClass("q4")} ref={setClueRef("q4")}>
            When baking soda and vinegar mix, you can see some bubbles. This is a{" "}
            <span className={clueClass("q6")} ref={setClueRef("q6")}>
              chemical reaction
            </span>
            . It makes a gas called carbon dioxide. The gas moves into the balloon and makes it puff
            up!
          </span>
        ) : (
          "When baking soda and vinegar mix, you can see some bubbles. This is a chemical reaction. It makes a gas called carbon dioxide. The gas moves into the balloon and makes it puff up!"
        )}
      </p>
      <div className="sheet-h">Tip:</div>
      <p className="tip-text">
        {withClues ? (
          <span className={clueClass("q5")} ref={setClueRef("q5")}>
            Try using more or less baking soda and vinegar next time. What will be different?
          </span>
        ) : (
          "Try using more or less baking soda and vinegar next time. What will be different?"
        )}
      </p>
    </>
  );

  const sheetTop = (
    <div className={sheetActive("part1")}>
      <div className="sheet-inner">
        <div className="sheet-title">Make a Balloon Puff Up</div>
        {materials(true)}
        {safety(true)}
      </div>
    </div>
  );

  const sheetBottom = (
    <div className={sheetActive("part2")}>
      <div className="sheet-inner">{steps(true)}</div>
    </div>
  );

  return (
    <>
      <Header backHref="/english/reading-comprehension/cycle-3-reading-2" backLabel="Back" />

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="rc-learning">
          <style dangerouslySetInnerHTML={{ __html: learningStyles + sheetStyles }} />

          <div className="app-shell">
            {/* Header */}
            <div className="app-header">
              <h1>
                <BookOpenCheck className="size-6" /> Cycle 3 — Reading 2: Make a Balloon Puff Up (Experiment)
              </h1>
            </div>

            {/* Tabs */}
            <div className="nav-tabs">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-tab${section === id ? " active" : ""}`}
                  onClick={() => switchSection(id)}
                >
                  <Icon className="size-3.5" /> {label}
                  {isTabCompleted(id) ? " ✓" : ""}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {section === "overview" && (
              <div className="section-panel">
                <div className="narrow">
                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-yellow),var(--accent-orange))",
                        }}
                      >
                        <Lightbulb className="size-4" />
                      </span>
                      Pre-reading Question
                    </div>
                    <ul className="pre-reading-list">
                      <li>
                        <HelpCircle className="size-4" /> What is the title of the experiment?
                      </li>
                    </ul>
                  </div>

                  {/* Full sheet preview */}
                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-pink),var(--accent-mint))",
                        }}
                      >
                        <FlaskConical className="size-4" />
                      </span>
                      The Experiment Sheet
                    </div>
                    <div className="sheet">
                      <div className="sheet-inner">
                        <div className="sheet-title">Make a Balloon Puff Up</div>
                        {materials(false)}
                        {safety(false)}
                        {steps(false)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginTop: 6 }}>
                    <button
                      type="button"
                      className="restart-btn"
                      onClick={() => switchSection("part1")}
                      style={{
                        background:
                          "linear-gradient(135deg,var(--accent-mint),var(--accent-blue))",
                      }}
                    >
                      Start Part 1 <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PART 1 */}
            {section === "part1" && (
              <div className="section-panel">
                <div className="split-layout">
                  <div className="split-left">
                    <div className="pane-label">
                      <BookOpen className="size-3.5" /> Reading Passage
                    </div>
                    <div className="card" style={{ marginBottom: 10 }}>
                      <div className="card-title" style={{ fontSize: 15 }}>
                        <span
                          className="icon"
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-pink),var(--accent-orange))",
                          }}
                        >
                          <Beaker className="size-4" />
                        </span>
                        Part 1: Materials &amp; Safety
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> How many kinds of materials are needed
                          for this experiment?
                        </li>
                        <li>
                          <HelpCircle className="size-4" /> What do you need to wear for this
                          experiment?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {sheetTop}
                    </div>
                  </div>
                  <div className="split-right">
                    <div className="pane-label questions">
                      <PenLine className="size-3.5" /> Questions
                    </div>
                    {renderQuestions("part1")}
                    {part1Done && (
                      <div style={{ textAlign: "center", marginTop: 6 }}>
                        <button
                          type="button"
                          className="restart-btn"
                          onClick={() => switchSection("part2")}
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-purple),var(--accent-pink))",
                          }}
                        >
                          Continue to Part 2 <ArrowRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PART 2 */}
            {section === "part2" && (
              <div className="section-panel">
                <div className="split-layout">
                  <div className="split-left">
                    <div className="pane-label">
                      <BookOpen className="size-3.5" /> Reading Passage
                    </div>
                    <div className="card" style={{ marginBottom: 10 }}>
                      <div className="card-title" style={{ fontSize: 15 }}>
                        <span
                          className="icon"
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-purple),var(--accent-blue))",
                          }}
                        >
                          <ListOrdered className="size-4" />
                        </span>
                        Part 2: Steps &amp; How It Works
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> How many steps are there in this
                          experiment?
                        </li>
                        <li>
                          <HelpCircle className="size-4" /> What makes the balloon puff up?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {sheetBottom}
                    </div>
                  </div>
                  <div className="split-right">
                    <div className="pane-label questions">
                      <PenLine className="size-3.5" /> Questions
                    </div>
                    {renderQuestions("part2")}
                    {part2Done && (
                      <div style={{ textAlign: "center", marginTop: 6 }}>
                        <button
                          type="button"
                          className="restart-btn"
                          onClick={() => switchSection("summary")}
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-yellow),var(--accent-orange))",
                          }}
                        >
                          See Summary <ArrowRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            {section === "summary" && (
              <div className="section-panel">
                <div className="narrow">
                  <div className="card celebration-card">
                    <div className="trophy">🏆</div>
                    <h2>Reading 2 Complete!</h2>
                    <p>You have just completed Cycle 3 — Reading 2: Make a Balloon Puff Up.</p>
                    <div className="final-score">
                      {score} / {TOTAL_QUESTIONS}
                    </div>
                    <p>{summaryMsg}</p>
                    <button type="button" className="restart-btn" onClick={resetAll}>
                      <RotateCcw className="size-4" /> Start Over
                    </button>
                  </div>

                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-purple),var(--accent-blue))",
                        }}
                      >
                        <Star className="size-4" />
                      </span>
                      Reading Skills You Used
                    </div>
                    <ul className="summary-skills">
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-blue)" }}>
                          <Search className="size-3.5" />
                        </span>
                        <span>
                          <strong>Scan</strong> to find the keyword and the information you need.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-mint)" }}>
                          <BookOpen className="size-3.5" />
                        </span>
                        <span>
                          Use <strong>contextual clues</strong> to work out a word like
                          &quot;stretch&quot;.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-orange)" }}>
                          <Puzzle className="size-3.5" />
                        </span>
                        <span>
                          <strong>Make inferences</strong> — link the steps with &quot;How It
                          Works&quot; and read between the lines.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-pink)" }}>
                          <FastForward className="size-3.5" />
                        </span>
                        <span>
                          <strong>Predict</strong> what may happen when you change the amounts.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-yellow)" }}>
                          <FlaskConical className="size-3.5" />
                        </span>
                        <span>
                          Identify the <strong>text type</strong> and its purpose.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-purple)" }}>
                          <Scale className="size-3.5" />
                        </span>
                        <span>
                          <strong>Compare</strong> the answers and take out the distractors to find
                          the best one.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-yellow),var(--accent-orange))",
                        }}
                      >
                        <Lightbulb className="size-4" />
                      </span>
                      Tips for Next Time
                    </div>
                    <ul className="summary-skills">
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-blue)" }}>
                          <Sparkles className="size-3.5" />
                        </span>
                        <span>Visualise each step — picture the action in your mind.</span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-mint)" }}>
                          <RotateCcw className="size-3.5" />
                        </span>
                        <span>Re-read the relevant parts to confirm your understanding.</span>
                      </li>
                    </ul>
                  </div>

                  <div style={{ textAlign: "center", marginTop: 6 }}>
                    <button type="button" className="restart-btn" onClick={resetAll}>
                      <RotateCcw className="size-4" /> Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal */}
          {modal && (
            <div className="modal-overlay" onClick={() => setModal(null)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-emoji">{modal.emoji}</div>
                <div className="modal-title">{modal.title}</div>
                <div className="modal-msg">{modal.msg}</div>
                <button
                  type="button"
                  className={`modal-ok ${modal.ok ? "green" : "pink"}`}
                  onClick={() => setModal(null)}
                >
                  Got it!
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
