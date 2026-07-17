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
  Lightbulb,
  Mail,
  MapPin,
  PenLine,
  Puzzle,
  Quote,
  RotateCcw,
  Scale,
  School,
  Search,
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
  { id: "part1", label: "Part 1: School Days", icon: School },
  { id: "part2", label: "Part 2: Sightseeing", icon: MapPin },
  { id: "part3", label: "Part 3: The Whole Email", icon: Mail },
  { id: "summary", label: "Summary", icon: Trophy },
];

// Extra styles for the email layout.
const emailStyles = `
.rc-learning .email { background: var(--bg-article); border: 2px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden; transition: border-color 0.4s ease, box-shadow 0.4s ease; }
.rc-learning .email.clue-active { border-color: var(--accent-orange) !important; box-shadow: 0 0 20px rgba(255,140,66,0.2); }
.rc-learning .email-head { background: linear-gradient(90deg,#f0f0f0,#e8e8e8); border-bottom: 1px solid var(--border-light); padding: 9px 12px; }
.rc-learning .email-row { display: flex; gap: 8px; padding: 2px 0; font-size: 12px; color: var(--text-secondary); }
.rc-learning .email-label { font-weight: 700; color: var(--text-muted); min-width: 50px; }
.rc-learning .email-body { padding: 14px 16px; }
.rc-learning .email-body p { font-size: 13.5px; line-height: 1.85; color: var(--text-secondary); margin: 0 0 11px; }
.rc-learning .email-body p:last-child { margin-bottom: 0; }
.rc-learning .email-greeting { font-weight: 600; color: var(--text-primary); }
.rc-learning .email-sign { margin-top: 2px; font-weight: 600; color: var(--text-primary); }
`;

export default function EnglishReadingComprehensionCycle2Reading3LearningPage() {
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

  // Part 1 covers Q1–Q4 (school days); Part 2 covers Q5–Q6 (sightseeing);
  // Part 3 covers Q7–Q8 (the whole email).
  const part1Done = answered[1] && answered[2] && answered[3] && answered[4];
  const part2Done = answered[5] && answered[6];
  const part3Done = answered[7] && answered[8];
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
      : score >= 6
        ? "Great job! Keep up the good work!"
        : score >= 3
          ? "Good effort! Review the hints and try again."
          : "Keep practicing — use the hints to help you next time!";

  const clueClass = (id: string) =>
    `highlight-clue${activeClues.ids.includes(id) ? " glow" : ""}${
      activeClues.badge === id ? " clue-badge" : ""
    }`;
  const setClueRef = (id: string) => (el: HTMLElement | null) => {
    clueRefs.current[id] = el;
  };
  const emailActive = (part: PartId) =>
    `email${section === part && activeClues.ids.length > 0 ? " clue-active" : ""}`;

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

  const emailHead = (
    <div className="email-head">
      <div className="email-row">
        <span className="email-label">From</span>
        <span>susan123321@mail.com.hk</span>
      </div>
      <div className="email-row">
        <span className="email-label">To</span>
        <span>rebeccawong@mail.com.hk</span>
      </div>
      <div className="email-row">
        <span className="email-label">Subject</span>
        <span />
      </div>
    </div>
  );

  // Part 1 — school days (Q1–Q4).
  const emailPart1 = (
    <div className={emailActive("part1")}>
      {emailHead}
      <div className="email-body">
        <p className="email-greeting">Hi Rebecca,</p>
        <p>
          How are you? How&apos;s your family?{" "}
          <span className={clueClass("q1")} ref={setClueRef("q1")}>
            I want to tell you about my graduation school study tour.
          </span>{" "}
          I came back from Iceland yesterday, and I had a wonderful time there.
        </p>
        <p>
          On the first day, we visited a local school in Reykjavík. In the morning, we had to stand
          up and introduce ourselves.{" "}
          <span className={clueClass("q2")} ref={setClueRef("q2")}>
            When my turn came, I could not speak and I was shaking like a leaf. The students smiled
            and clapped their hands to encourage me.
          </span>{" "}
          <span className={clueClass("q3")} ref={setClueRef("q3")}>
            After that, we played games together and I made a few new Icelandic friends.
          </span>
        </p>
        <p>
          The second day was also interesting. We joined lessons with the local students. I sat in
          their English and Maths classes.{" "}
          <span className={clueClass("q4")} ref={setClueRef("q4")}>
            I learnt about their school life and what they did after school.
          </span>{" "}
          We were quite different, but we also had something in common. We all liked music.
        </p>
      </div>
    </div>
  );

  // Part 2 — sightseeing (Q5–Q6).
  const emailPart2 = (
    <div className={emailActive("part2")}>
      {emailHead}
      <div className="email-body">
        <p>
          We visited some famous places. On the third day, we went to Perlan and enjoyed the
          beautiful city view. Later, we went on a boat for a whale and puffin watching tour. It was
          awesome!{" "}
          <span className={clueClass("q5")} ref={setClueRef("q5")}>
            We saw whales breaching the surface. They were beautiful! I bought a postcard of one for
            you.
          </span>{" "}
          <span className={clueClass("q6")} ref={setClueRef("q6")}>
            Sadly, I did not see any puffins. It was not the right season yet.
          </span>
        </p>
        <p>
          On the last day, we went to the Reykjavík Family Park and Zoo. We saw reindeer, seals and
          Arctic foxes. Before we went to the airport, we had Icelandic hot dogs. They were
          delicious.
        </p>
      </div>
    </div>
  );

  // Part 3 — the whole email (Q7–Q8).
  const emailPart3 = (
    <div className={emailActive("part3")}>
      {emailHead}
      <div className="email-body">
        <p className="email-greeting">Hi Rebecca,</p>
        <p>
          How are you? How&apos;s your family? I want to tell you about my graduation school study
          tour. I came back from Iceland yesterday, and{" "}
          <span className={clueClass("q8")} ref={setClueRef("q8")}>
            I had a wonderful time there.
          </span>
        </p>
        <p>
          On the first day, we visited a local school in Reykjavík. In the morning, we had to stand
          up and introduce ourselves. When my turn came, I could not speak and I was shaking like a
          leaf. The students smiled and clapped their hands to encourage me. After that, we played
          games together and I made a few new Icelandic friends.
        </p>
        <p>
          The second day was also interesting. We joined lessons with the local students. I sat in
          their English and Maths classes. I learnt about their school life and what they did after
          school. We were quite different, but we also had something in common. We all liked music.
        </p>
        <p>
          We visited some famous places. On the third day, we went to Perlan and enjoyed the
          beautiful city view. Later, we went on a boat for a whale and puffin watching tour. It was
          awesome! We saw whales breaching the surface. They were beautiful! I bought a postcard of
          one for you. Sadly, I did not see any puffins. It was not the right season yet.
        </p>
        <p>
          On the last day, we went to the Reykjavík Family Park and Zoo. We saw reindeer, seals and
          Arctic foxes. Before we went to the airport, we had Icelandic hot dogs. They were
          delicious.
        </p>
        <p>
          <span className={clueClass("q7")} ref={setClueRef("q7")}>
            I hope we can travel together one day.
          </span>{" "}
          Write back soon and tell me when your next school holiday is.
        </p>
        <p className="email-sign">
          Best wishes,
          <br />
          Susan
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Header backHref="/english/reading-comprehension/cycle-2-reading-3" backLabel="Back" />

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="rc-learning">
          <style dangerouslySetInnerHTML={{ __html: learningStyles + emailStyles }} />

          <div className="app-shell">
            {/* Header */}
            <div className="app-header">
              <h1>
                <BookOpenCheck className="size-6" /> Cycle 2 — Reading 3: A Wonderful School Trip (Email)
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
                      Pre-reading Questions
                    </div>
                    <ul className="pre-reading-list">
                      <li>
                        <HelpCircle className="size-4" /> How many paragraphs are there in the email?
                      </li>
                      <li>
                        <HelpCircle className="size-4" /> Who wrote the email?
                      </li>
                      <li>
                        <HelpCircle className="size-4" /> Who is going to receive the email?
                      </li>
                    </ul>
                  </div>

                  {/* Full email preview */}
                  <div className="card">
                    <div className="card-title">
                      <span
                        className="icon"
                        style={{
                          background:
                            "linear-gradient(135deg,var(--accent-pink),var(--accent-mint))",
                        }}
                      >
                        <Mail className="size-4" />
                      </span>
                      The Email
                    </div>
                    <div className="email">
                      {emailHead}
                      <div className="email-body">
                        <p className="email-greeting">Hi Rebecca,</p>
                        <p>
                          How are you? How&apos;s your family? I want to tell you about my graduation
                          school study tour. I came back from Iceland yesterday, and I had a wonderful
                          time there.
                        </p>
                        <p>
                          On the first day, we visited a local school in Reykjavík. In the morning,
                          we had to stand up and introduce ourselves. When my turn came, I could not
                          speak and I was shaking like a leaf. The students smiled and clapped their
                          hands to encourage me. After that, we played games together and I made a
                          few new Icelandic friends.
                        </p>
                        <p>
                          The second day was also interesting. We joined lessons with the local
                          students. I sat in their English and Maths classes. I learnt about their
                          school life and what they did after school. We were quite different, but we
                          also had something in common. We all liked music.
                        </p>
                        <p>
                          We visited some famous places. On the third day, we went to Perlan and
                          enjoyed the beautiful city view. Later, we went on a boat for a whale and
                          puffin watching tour. It was awesome! We saw whales breaching the surface.
                          They were beautiful! I bought a postcard of one for you. Sadly, I did not
                          see any puffins. It was not the right season yet.
                        </p>
                        <p>
                          On the last day, we went to the Reykjavík Family Park and Zoo. We saw
                          reindeer, seals and Arctic foxes. Before we went to the airport, we had
                          Icelandic hot dogs. They were delicious.
                        </p>
                        <p>
                          I hope we can travel together one day. Write back soon and tell me when
                          your next school holiday is.
                        </p>
                        <p className="email-sign">
                          Best wishes,
                          <br />
                          Susan
                        </p>
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
                          <School className="size-4" />
                        </span>
                        Part 1: School Days
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Did Susan spend only one day in Iceland
                          for her study tour?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {emailPart1}
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
                          <MapPin className="size-4" />
                        </span>
                        Part 2: Sightseeing
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Did Susan visit any famous places or see
                          any animals in Iceland?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {emailPart2}
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
                          <Mail className="size-4" />
                        </span>
                        Part 3: The Whole Email
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Read the whole email again. What is it
                          mainly about?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      {emailPart3}
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
                    <h2>Reading 3 Complete!</h2>
                    <p>You have just completed Cycle 2 — Reading 3: A Wonderful School Trip.</p>
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
                          <strong>Skim</strong> the email to get the gist and the main idea.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-mint)" }}>
                          <Search className="size-3.5" />
                        </span>
                        <span>
                          <strong>Scan</strong> for keywords like &quot;first day&quot; and
                          &quot;second day&quot; to find information.
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-orange)" }}>
                          <Quote className="size-3.5" />
                        </span>
                        <span>
                          Use <strong>language features</strong> — similes (&quot;shaking like a
                          leaf&quot;) and reference words (&quot;one&quot;).
                        </span>
                      </li>
                      <li>
                        <span className="skill-icon" style={{ background: "var(--accent-pink)" }}>
                          <Puzzle className="size-3.5" />
                        </span>
                        <span>
                          <strong>Make inferences</strong> — read between the lines and interpret
                          feelings.
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
