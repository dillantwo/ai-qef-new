"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Brain,
  Eye,
  FastForward,
  GraduationCap,
  HelpCircle,
  History,
  Info,
  Lightbulb,
  PenLine,
  Puzzle,
  RotateCcw,
  Scale,
  ScrollText,
  Search,
  Stamp,
  Star,
  Trophy,
} from "lucide-react";
import Header from "@/components/Header";
import { learningStyles } from "../../learning/styles";
import { questions, TOTAL_QUESTIONS, type PartId, type Question } from "./questions";

type Section = "overview" | "part1" | "part2" | "part3" | "summary";

interface ModalData {
  emoji: string;
  title: string;
  msg: string;
  ok: boolean;
}

const TABS: { id: Section; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "part1", label: "Part 1: The Past", icon: ScrollText },
  { id: "part2", label: "Part 2: Their Work", icon: Stamp },
  { id: "part3", label: "Part 3: Today", icon: History },
  { id: "summary", label: "Summary", icon: Trophy },
];

// Extra styles for the "Chop Makers" article and the dictionary entry.
const articleStyles = `
.rc-learning .article { background: var(--bg-article); border: 2px solid var(--border-light); border-radius: var(--radius-sm); padding: 16px 18px; transition: border-color 0.4s ease, box-shadow 0.4s ease; }
.rc-learning .article.clue-active { border-color: var(--accent-orange) !important; box-shadow: 0 0 20px rgba(255,140,66,0.2); }
.rc-learning .article-title { text-align: center; font-weight: 800; font-size: 20px; color: var(--text-primary); text-decoration: underline; margin-bottom: 12px; }
.rc-learning .article p { font-size: 13.5px; line-height: 1.95; color: var(--text-secondary); margin: 0 0 12px; }
.rc-learning .article p:last-child { margin-bottom: 0; }
.rc-learning .para-tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent-purple); margin-bottom: 6px; }
.rc-learning .dict-entry { background: var(--bg-article); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px; }
.rc-learning .dict-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.rc-learning .dict-word { font-weight: 800; font-size: 16px; color: var(--text-primary); }
.rc-learning .dict-pos { font-style: italic; font-size: 12px; color: var(--text-muted); }
.rc-learning .dict-pron { font-size: 12px; color: var(--text-muted); }
.rc-learning .dict-senses { margin: 0; padding-left: 20px; font-size: 12.5px; line-height: 1.6; color: var(--text-secondary); }
.rc-learning .dict-senses li { margin-bottom: 6px; }
.rc-learning .dict-eg { display: block; font-style: italic; color: var(--text-muted); margin-top: 2px; }
`;

export default function EnglishReadingComprehensionCycle2Reading2LearningPage() {
  const [section, setSection] = useState<Section>("overview");
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [hints, setHints] = useState<Record<number, boolean>>({});
  const [strategies, setStrategies] = useState<Record<number, boolean>>({});
  const [step, setStep] = useState<Record<PartId, number>>({ part1: 0, part2: 0, part3: 0 });
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
    setStep({ part1: 0, part2: 0, part3: 0 });
    clearHighlights();
    setSection("overview");
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [clearHighlights]);

  // Part 1 covers Q1 (paragraph 1); Part 2 covers Q2–Q4 (paragraph 2);
  // Part 3 covers Q5–Q6 (paragraph 3).
  const part1Done = answered[1];
  const part2Done = answered[2] && answered[3] && answered[4];
  const part3Done = answered[5] && answered[6];
  const allDone = Object.keys(answered).length === TOTAL_QUESTIONS;

  const isTabCompleted = (id: Section) => {
    if (id === "part1") return Boolean(part1Done);
    if (id === "part2") return Boolean(part2Done);
    if (id === "part3") return Boolean(part3Done);
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
  const articleActive = (part: PartId) =>
    `article${section === part && activeClues.ids.length > 0 ? " clue-active" : ""}`;

  function renderQuestions(part: PartId) {
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
                  <GraduationCap className="size-3.5" /> Reading Strategy
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

  // Paragraph 1 — the past. Clue span glows for Part 1 (Q1).
  const paragraph1 = (
    <div className={articleActive("part1")}>
      <div className="article-title">Chop Makers</div>
      <p>
        Long ago, many people in Hong Kong used seals on important papers.{" "}
        <span className={clueClass("q1")} ref={setClueRef("q1")}>
          They used them on letters, business documents and paintings.
        </span>{" "}
        Seals are also called chops. Some people put name chops on traditional paintings: it was
        just like signing their names. In the old days, people usually went to chop makers to help
        them make chops.
      </p>
    </div>
  );

  // Paragraph 2 — what chop makers did. Clue spans for Part 2 (Q2–Q4, and Q6a).
  const paragraph2 = (
    <div className={articleActive("part2")}>
      <div className="article-title">Chop Makers</div>
      <p>
        <span className={clueClass("q3")} ref={setClueRef("q3")}>
          Chop makers did many kinds of work.
        </span>{" "}
        They usually carved names or words into stone, wood or rubber.{" "}
        <span className={clueClass("q6a")} ref={setClueRef("q6a")}>
          They made personal name chops and company chops.
        </span>{" "}
        <span className={clueClass("q2")} ref={setClueRef("q2")}>
          Before carving, they asked customers what materials, words and styles they wanted.
        </span>{" "}
        <span className={clueClass("q4")} ref={setClueRef("q4")}>
          At its peak, there were many chop maker stalls in Man Wa Lane, a place people now call Chop
          Alley at Sheung Wan.
        </span>
      </p>
    </div>
  );

  // Paragraph 3 — chop makers today. Clue spans for Part 3 (Q5, Q6b).
  const paragraph3 = (
    <div className={articleActive("part3")}>
      <div className="article-title">Chop Makers</div>
      <p>
        Today, some chop makers also print name cards.{" "}
        <span className={clueClass("q5b")} ref={setClueRef("q5b")}>
          This is because fewer people need chops every day.
        </span>{" "}
        Many people sign their names on papers with pens or with e-signatures on computers. Fewer and
        fewer chop makers still work in Chop Alley.{" "}
        <span className={clueClass("q6b")} ref={setClueRef("q6b")}>
          Most of their customers are older people or small shop owners.
        </span>{" "}
        <span className={clueClass("q5")} ref={setClueRef("q5")}>
          In the future, chop makers may slowly disappear from Hong Kong.
        </span>
      </p>
    </div>
  );

  return (
    <>
      <Header backHref="/english/reading-comprehension/cycle-2-reading-2" backLabel="Back" />

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="rc-learning">
          <style dangerouslySetInnerHTML={{ __html: learningStyles + articleStyles }} />

          <div className="app-shell">
            {/* Header */}
            <div className="app-header">
              <h1>
                <BookOpenCheck className="size-6" /> Reading Scaffolding
              </h1>
              <p>Cycle 2 — Reading 2: Chop Makers (Article)</p>
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
                            "linear-gradient(135deg,var(--accent-blue),var(--accent-purple))",
                        }}
                      >
                        <Info className="size-4" />
                      </span>
                      About This Reading
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                      The reading below is an <strong>informational article</strong> called{" "}
                      <strong>Chop Makers</strong>. It has <strong>three paragraphs</strong>: the
                      past, the work chop makers did, and chop makers today. Have a quick look at it!
                    </p>
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
                      Pre-reading Questions
                    </div>
                    <ul className="pre-reading-list">
                      <li>
                        <HelpCircle className="size-4" /> What is the article about?
                      </li>
                      <li>
                        <HelpCircle className="size-4" /> How many paragraphs are there?
                      </li>
                    </ul>
                  </div>

                  {/* Full article preview */}
                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-pink),var(--accent-mint))",
                        }}
                      >
                        <ScrollText className="size-4" />
                      </span>
                      The Article
                    </div>
                    <div className="article">
                      <div className="article-title">Chop Makers</div>
                      <p>
                        Long ago, many people in Hong Kong used seals on important papers. They used
                        them on letters, business documents and paintings. Seals are also called
                        chops. Some people put name chops on traditional paintings: it was just like
                        signing their names. In the old days, people usually went to chop makers to
                        help them make chops.
                      </p>
                      <p>
                        Chop makers did many kinds of work. They usually carved names or words into
                        stone, wood or rubber. They made personal name chops and company chops.
                        Before carving, they asked customers what materials, words and styles they
                        wanted. At its peak, there were many chop maker stalls in Man Wa Lane, a
                        place people now call Chop Alley at Sheung Wan.
                      </p>
                      <p>
                        Today, some chop makers also print name cards. This is because fewer people
                        need chops every day. Many people sign their names on papers with pens or
                        with e-signatures on computers. Fewer and fewer chop makers still work in
                        Chop Alley. Most of their customers are older people or small shop owners. In
                        the future, chop makers may slowly disappear from Hong Kong.
                      </p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-mint),var(--accent-blue))",
                        }}
                      >
                        <Brain className="size-4" />
                      </span>
                      Reading Skills You&apos;ll Practice
                    </div>
                    <div>
                      <span className="skill-tag">
                        <FastForward className="size-3" /> Skimming
                      </span>
                      <span className="skill-tag">
                        <Search className="size-3" /> Scanning
                      </span>
                      <span className="skill-tag">
                        <Puzzle className="size-3" /> Inference
                      </span>
                      <span className="skill-tag">
                        <BookOpen className="size-3" /> Contextual Clues
                      </span>
                      <span className="skill-tag">
                        <Scale className="size-3" /> Comparing Answers
                      </span>
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
                          <ScrollText className="size-4" />
                        </span>
                        Part 1: The Past
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Is the first paragraph about old days or
                          present days?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {paragraph1}
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
                          <Stamp className="size-4" />
                        </span>
                        Part 2: Their Work
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Did chop makers use only stones to make
                          chops?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {paragraph2}
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
                          onClick={() => switchSection("part3")}
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-yellow),var(--accent-orange))",
                          }}
                        >
                          Continue to Part 3 <ArrowRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PART 3 */}
            {section === "part3" && (
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
                              "linear-gradient(135deg,var(--accent-mint),var(--accent-blue))",
                          }}
                        >
                          <History className="size-4" />
                        </span>
                        Part 3: Today
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Are there more and more people using
                          chops today?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {paragraph3}
                    </div>
                  </div>
                  <div className="split-right">
                    <div className="pane-label questions">
                      <PenLine className="size-3.5" /> Questions
                    </div>
                    {renderQuestions("part3")}
                    {part3Done && (
                      <div style={{ textAlign: "center", marginTop: 6 }}>
                        <button
                          type="button"
                          className="restart-btn"
                          onClick={() => switchSection("summary")}
                          style={{
                            background:
                              "linear-gradient(135deg,var(--accent-blue),var(--accent-purple))",
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
                    <p>You have just completed Cycle 2 — Reading 2: Chop Makers.</p>
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
                          <FastForward className="size-3.5" />
                        </span>
                        <span>
                          <strong>Skim</strong> the article to get an overview and the main idea of
                          each paragraph.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-mint)" }}>
                          <Search className="size-3.5" />
                        </span>
                        <span>
                          <strong>Scan</strong> to find the keyword and the information you need.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-orange)" }}>
                          <BookOpen className="size-3.5" />
                        </span>
                        <span>
                          Use <strong>contextual clues</strong> to work out a new word like
                          &quot;peak&quot;.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-pink)" }}>
                          <Puzzle className="size-3.5" />
                        </span>
                        <span>
                          <strong>Make inferences</strong> — link up information across paragraphs to
                          read between the lines.
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
                          <Eye className="size-3.5" />
                        </span>
                        <span>Read like a detective — check whether each answer is relevant.</span>
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
