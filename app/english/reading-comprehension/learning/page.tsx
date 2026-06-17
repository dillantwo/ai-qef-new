"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Book,
  BookOpen,
  BookOpenCheck,
  Brain,
  Eye,
  FastForward,
  Globe,
  GraduationCap,
  Hash,
  HelpCircle,
  Info,
  Lightbulb,
  Link2,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Puzzle,
  RotateCcw,
  Scale,
  Search,
  Network,
  Star,
  Trophy,
} from "lucide-react";
import Header from "@/components/Header";
import { learningStyles } from "./styles";
import { questions, TOTAL_QUESTIONS, type Question } from "./questions";

type Section = "overview" | "part1" | "part2" | "summary";

interface ModalData {
  emoji: string;
  title: string;
  msg: string;
  ok: boolean;
}

const TABS: { id: Section; label: string; icon: typeof Eye }[] = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "part1", label: "Part 1: Ad", icon: Megaphone },
  { id: "part2", label: "Part 2: Comments", icon: MessagesSquare },
  { id: "summary", label: "Summary", icon: Trophy },
];

export default function EnglishReadingComprehensionLearningPage() {
  const [section, setSection] = useState<Section>("overview");
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [hints, setHints] = useState<Record<number, boolean>>({});
  const [strategies, setStrategies] = useState<Record<number, boolean>>({});
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

  const resetAll = useCallback(() => {
    setAnswered({});
    setHints({});
    setStrategies({});
    clearHighlights();
    setSection("overview");
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [clearHighlights]);

  const part1Done = answered[1] && answered[2] && answered[3];
  const part2Done = answered[4] && answered[5] && answered[6];
  const allDone = Object.keys(answered).length === TOTAL_QUESTIONS;

  const isTabCompleted = (id: Section) => {
    if (id === "part1") return Boolean(part1Done);
    if (id === "part2") return Boolean(part2Done);
    if (id === "summary") return allDone;
    return false;
  };

  const summaryMsg =
    score === 6
      ? "Perfect score! You're a reading superstar!"
      : score >= 4
        ? "Great job! Keep up the good work!"
        : score >= 2
          ? "Good effort! Review the hints and try again."
          : "Keep practicing — use the hints to help you next time!";

  // Render a clue span that glows when active.
  const clueClass = (id: string) =>
    `highlight-clue${activeClues.ids.includes(id) ? " glow" : ""}${
      activeClues.badge === id ? " clue-badge" : ""
    }`;
  const setClueRef = (id: string) => (el: HTMLElement | null) => {
    clueRefs.current[id] = el;
  };
  const simActive = (part: "part1" | "part2") =>
    `webpage-sim${
      section === part && activeClues.ids.length > 0 ? " clue-active" : ""
    }`;

  function renderQuestions(part: "part1" | "part2") {
    return questions
      .filter((q) => q.part === part)
      .map((q) => {
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
                <Lightbulb className="size-3.5" /> Show Hint
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
      });
  }

  return (
    <>
      <Header backHref="/english/reading-comprehension" backLabel="返回" />

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="rc-learning">
          <style dangerouslySetInnerHTML={{ __html: learningStyles }} />

          <div className="app-shell">
            {/* Header */}
            <div className="app-header">
              <h1>
                <BookOpenCheck className="size-6" /> Reading Scaffolding
              </h1>
              <p>Cycle 1 — Reading 1: Webpage Advertisement</p>
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
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "var(--text-secondary)",
                      }}
                    >
                      The reading below is a <strong>webpage of an ice-cream shop</strong>. It has
                      an advertisement and a comments section. Have a quick look at it!
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
                        <HelpCircle className="size-4" /> How many parts are there in the webpage?
                      </li>
                      <li>
                        <HelpCircle className="size-4" /> Is the ice-cream shop in Hong Kong?
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
                            "linear-gradient(135deg,var(--accent-pink),var(--accent-orange))",
                        }}
                      >
                        <Globe className="size-4" />
                      </span>
                      The Webpage
                    </div>
                    <div className="webpage-sim">
                      <div className="webpage-topbar">
                        <span className="browser-dot r" />
                        <span className="browser-dot y" />
                        <span className="browser-dot g" />
                        <div className="url-bar">www.happyicecream.com.hk</div>
                      </div>
                      <div className="webpage-body">
                        <div className="ad-header">
                          <div className="ice-cream-deco">🍦🌈🍨</div>
                          <h2>Try Our New Rainbow Ice Cream!</h2>
                          <p className="ad-subtitle">
                            a mix of delicious cherry, banana, melon and blueberry flavours
                          </p>
                        </div>
                        <div className="price-grid">
                          <div className="price-card">
                            <div className="label">Mini Cup</div>
                            <div className="price">$30</div>
                          </div>
                          <div className="price-card">
                            <div className="label">Single Scoop</div>
                            <div className="price">$38</div>
                          </div>
                          <div className="price-card">
                            <div className="label">Family Pack</div>
                            <div className="price">$105</div>
                          </div>
                        </div>
                        <div className="special-banner">
                          <h3>This Week&apos;s Special Offer</h3>
                          <p>
                            (16–22 July)
                            <br />
                            Buy 1 scoop and get 1 scoop FREE!
                            <br />
                            (for the Sha Tin branch only)
                          </p>
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              marginBottom: 6,
                              color: "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <MessageCircle
                              className="size-3.5"
                              style={{ color: "var(--accent-purple)" }}
                            />
                            Comments
                          </div>
                          {OVERVIEW_COMMENTS.map((c) => (
                            <div className="comment-item" key={c.user}>
                              <div className="comment-meta">
                                <span className="comment-user">{c.user}</span>
                                <span className="comment-date">{c.date}</span>
                              </div>
                              <p className="comment-text">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
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
                        <Network className="size-3" /> Text Structure
                      </span>
                      <span className="skill-tag">
                        <Puzzle className="size-3" /> Inference
                      </span>
                      <span className="skill-tag">
                        <Hash className="size-3" /> Numerical Reasoning
                      </span>
                      <span className="skill-tag">
                        <Book className="size-3" /> Contextual Clues
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
                  {/* LEFT: Article */}
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
                          <Megaphone className="size-4" />
                        </span>
                        Part 1: The Advertisement
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> Is there only one ice-cream flavour in
                          the shop?
                        </li>
                        <li>
                          <HelpCircle className="size-4" /> Is there any special offer?
                        </li>
                        <li>
                          <HelpCircle className="size-4" /> Is there any free gift?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      <div className={simActive("part1")}>
                        <div className="webpage-topbar">
                          <span className="browser-dot r" />
                          <span className="browser-dot y" />
                          <span className="browser-dot g" />
                          <div className="url-bar">www.happyicecream.com.hk</div>
                        </div>
                        <div className="webpage-body">
                          <div className="ad-header">
                            <div className="ice-cream-deco">🍦🌈🍨</div>
                            <h2>Try Our New Rainbow Ice Cream!</h2>
                            <p className="ad-subtitle">
                              a mix of delicious{" "}
                              <span className={clueClass("q1")} ref={setClueRef("q1")}>
                                cherry, banana, melon and blueberry
                              </span>{" "}
                              flavours
                            </p>
                          </div>
                          <div className="price-grid">
                            <div className="price-card">
                              <div className="label">Mini Cup</div>
                              <div className="price">$30</div>
                            </div>
                            <div className="price-card">
                              <div className="label">Single Scoop</div>
                              <div className="price">$38</div>
                            </div>
                            <div className="price-card">
                              <div className="label">Family Pack</div>
                              <div className="price">$105</div>
                            </div>
                          </div>
                          <div className="special-banner">
                            <h3>This Week&apos;s Special Offer</h3>
                            <p>
                              <span className={clueClass("q3")} ref={setClueRef("q3")}>
                                (
                                <span className={clueClass("q3b")} ref={setClueRef("q3b")}>
                                  16–22 July
                                </span>
                                )
                              </span>
                              <br />
                              Buy 1 scoop and get 1 scoop FREE!
                              <br />
                              <span className={clueClass("q2")} ref={setClueRef("q2")}>
                                (for the Sha Tin branch only)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* RIGHT: Questions */}
                  <div className="split-right">
                    <div className="pane-label questions">
                      <PenLine className="size-3.5" /> Questions
                    </div>
                    {renderQuestions("part1")}
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
                  </div>
                </div>
              </div>
            )}

            {/* PART 2 */}
            {section === "part2" && (
              <div className="section-panel">
                <div className="split-layout">
                  {/* LEFT: Comments */}
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
                              "linear-gradient(135deg,var(--accent-purple),var(--accent-pink))",
                          }}
                        >
                          <MessagesSquare className="size-4" />
                        </span>
                        Part 2: The Comments
                      </div>
                      <ul className="pre-reading-list">
                        <li>
                          <HelpCircle className="size-4" /> How many people have written comments on
                          the webpage?
                        </li>
                      </ul>
                    </div>
                    <div className="card" style={{ padding: "14px 12px" }}>
                      <div className={simActive("part2")}>
                        <div className="webpage-topbar">
                          <span className="browser-dot r" />
                          <span className="browser-dot y" />
                          <span className="browser-dot g" />
                          <div className="url-bar">www.happyicecream.com.hk — Comments</div>
                        </div>
                        <div className="webpage-body">
                          <div className="comment-item">
                            <div className="comment-meta">
                              <span className="comment-user">Jimmy1234</span>
                              <span className="comment-date">14 July 20XX</span>
                            </div>
                            <p className="comment-text">
                              I like vanilla and chocolate flavours more. I prefer these{" "}
                              <span className="vocab-word" tabIndex={0}>
                                <span className={clueClass("q4")} ref={setClueRef("q4")}>
                                  ordinary
                                </span>
                                <span className="vocab-tip">
                                  💡 <strong>ordinary</strong> = common, usual, not special
                                </span>
                              </span>{" "}
                              flavours to the{" "}
                              <span className={clueClass("q4b")} ref={setClueRef("q4b")}>
                                strange
                              </span>{" "}
                              new mix.
                            </p>
                          </div>
                          <div className="comment-item">
                            <div className="comment-meta">
                              <span className="comment-user">CoolChloe01</span>
                              <span className="comment-date">2 July 20XX</span>
                            </div>
                            <p className="comment-text">
                              <span className={clueClass("q6")} ref={setClueRef("q6")}>
                                I&apos;m coming back for more!
                              </span>
                            </p>
                          </div>
                          <div className="comment-item">
                            <div className="comment-meta">
                              <span className="comment-user">KatyLovesFood</span>
                              <span className="comment-date">28 June 20XX</span>
                            </div>
                            <p className="comment-text">Looks good but tastes average...</p>
                          </div>
                          <div className="comment-item">
                            <div className="comment-meta">
                              <span className="comment-user">HappyDave</span>
                              <span className="comment-date">19 June 20XX</span>
                            </div>
                            <p className="comment-text">
                              I ordered the family pack online. When I opened it...{" "}
                              <span className="vocab-word" tabIndex={0}>
                                <span className={clueClass("q5")} ref={setClueRef("q5")}>
                                  Ugh!
                                </span>
                                <span className="vocab-tip">
                                  💡 <strong>Ugh!</strong> = a sound expressing disgust or
                                  displeasure
                                </span>
                              </span>{" "}
                              The ice cream{" "}
                              <span className={clueClass("q5b")} ref={setClueRef("q5b")}>
                                melted
                              </span>{" "}
                              and the colours mixed together.{" "}
                              <span className={clueClass("q5c")} ref={setClueRef("q5c")}>
                                What a mess!
                              </span>{" "}
                              It should be called &apos;Typhoon Ice Cream&apos; instead!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* RIGHT: Questions */}
                  <div className="split-right">
                    <div className="pane-label questions">
                      <PenLine className="size-3.5" /> Questions
                    </div>
                    {renderQuestions("part2")}
                    <div style={{ textAlign: "center", marginTop: 6 }}>
                      <button
                        type="button"
                        className="restart-btn"
                        onClick={() => switchSection("summary")}
                      >
                        View Summary <Trophy className="size-4" />
                      </button>
                    </div>
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
                    <h2>Great Job!</h2>
                    <p>You&apos;ve completed Reading 1 for Level 1!</p>
                    <div className="final-score">
                      {score}/{TOTAL_QUESTIONS}
                    </div>
                    <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
                      {summaryMsg}
                    </p>
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
                        <Star className="size-4" />
                      </span>
                      Reading Skills You Practiced
                    </div>
                    <ul className="summary-skills">
                      {SKILLS_PRACTICED.map(({ color, icon: Icon, title, desc }) => (
                        <li key={title}>
                          <span className="skill-icon" style={{ background: color }}>
                            <Icon className="size-3" />
                          </span>
                          <span>
                            <strong>{title}</strong> — {desc}
                          </span>
                        </li>
                      ))}
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
                      {TIPS.map(({ color, icon: Icon, text }) => (
                        <li key={text}>
                          <span className="skill-icon" style={{ background: color }}>
                            <Icon className="size-3" />
                          </span>
                          <span>{text}</span>
                        </li>
                      ))}
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

const OVERVIEW_COMMENTS = [
  {
    user: "Jimmy1234",
    date: "14 July 20XX",
    text: "I like vanilla and chocolate flavours more. I prefer these ordinary flavours to the strange new mix.",
  },
  { user: "CoolChloe01", date: "2 July 20XX", text: "I'm coming back for more!" },
  { user: "KatyLovesFood", date: "28 June 20XX", text: "Looks good but tastes average..." },
  {
    user: "HappyDave",
    date: "19 June 20XX",
    text: "I ordered the family pack online. When I opened it... Ugh! The ice cream melted and the colours mixed together. What a mess! It should be called 'Typhoon Ice Cream' instead!",
  },
];

const SKILLS_PRACTICED = [
  {
    color: "var(--accent-blue)",
    icon: FastForward,
    title: "Skimming",
    desc: "Get an overview and the main idea quickly.",
  },
  {
    color: "var(--accent-mint)",
    icon: Network,
    title: "Text Structure",
    desc: "Identify theme markers, structure and topic sentences.",
  },
  {
    color: "var(--accent-orange)",
    icon: Search,
    title: "Scanning",
    desc: "Find specific information you need in the reading.",
  },
  {
    color: "var(--accent-pink)",
    icon: Puzzle,
    title: "Making Inferences",
    desc: "Go beyond what is stated to understand implied meaning.",
  },
  {
    color: "var(--accent-purple)",
    icon: Hash,
    title: "Numerical Reasoning",
    desc: "Work out answers related to numbers and dates.",
  },
  {
    color: "var(--accent-yellow)",
    icon: Book,
    title: "Contextual Inference",
    desc: "Use surrounding words to figure out unknown meanings.",
  },
  {
    color: "var(--accent-mint)",
    icon: Link2,
    title: "Coherence Inference",
    desc: "Connect information to understand attitudes and feelings.",
  },
];

const TIPS = [
  {
    color: "var(--accent-blue)",
    icon: Eye,
    text: "Activate your background knowledge about the topic before reading.",
  },
  {
    color: "var(--accent-pink)",
    icon: MapPin,
    text: "Locate details in the reading to support your understanding.",
  },
  {
    color: "var(--accent-purple)",
    icon: RotateCcw,
    text: "Reread relevant parts to confirm your interpretation.",
  },
  {
    color: "var(--accent-mint)",
    icon: Scale,
    text: "Understand each answer choice and compare them to find the best one.",
  },
];
