import type { ReactNode } from "react";

export type PartId = "part1" | "part2";

export interface Option {
  val: string;
  label: string;
}

export interface Question {
  id: number;
  part: PartId;
  text: string;
  options: Option[];
  answer: string;
  /** Clue ids highlighted in the passage when this question is hinted/answered. */
  clues: string[];
  hint: ReactNode;
  strategy: ReactNode;
  explain: ReactNode;
}

export const TOTAL_QUESTIONS = 6;

export const questions: Question[] = [
  {
    id: 1,
    part: "part1",
    text: "There is a mix of _____ flavours in 'Rainbow Ice Cream'.",
    options: [
      { val: "A", label: "three" },
      { val: "B", label: "four" },
      { val: "C", label: "six" },
      { val: "D", label: "seven" },
    ],
    answer: "B",
    clues: ["q1"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Look at the subtitle under the ice cream name. Count the
        flavours listed: <em>cherry, banana, melon and blueberry</em>. How many are there?
      </>
    ),
    strategy: (
      <>
        <strong>Scanning:</strong> When you need specific information, scan the text for
        keywords. Here, look for the flavour names listed after &quot;a mix of delicious&quot;.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. four</strong>
        <br />
        <br />
        The subtitle says &quot;a mix of delicious <em>cherry, banana, melon and blueberry</em>{" "}
        flavours.&quot; Counting these gives us <strong>four</strong> flavours.
      </>
    ),
  },
  {
    id: 2,
    part: "part1",
    text: "To enjoy this week's special offer, Bella has to ______.",
    options: [
      { val: "A", label: "buy two scoops of ice cream" },
      { val: "B", label: "order the family pack" },
      { val: "C", label: "post a comment on the website" },
      { val: "D", label: "visit the Sha Tin shop" },
    ],
    answer: "D",
    clues: ["q2"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Read the special offer banner carefully. It says the offer is{" "}
        <em>&quot;for the Sha Tin branch only&quot;</em>. What does Bella need to do to get this
        offer?
      </>
    ),
    strategy: (
      <>
        <strong>Scanning &amp; Inference:</strong> Find the special offer section and look at ALL
        the conditions. The key detail is often at the end — the branch restriction tells you what
        action is required.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: D. visit the Sha Tin shop</strong>
        <br />
        <br />
        The special offer states &quot;for the Sha Tin branch only,&quot; meaning Bella must go to
        the Sha Tin shop to enjoy the &quot;Buy 1 get 1 FREE&quot; deal.
      </>
    ),
  },
  {
    id: 3,
    part: "part1",
    text: "Bella can get a gift if she buys 'Rainbow Ice Cream' on ______.",
    options: [
      { val: "A", label: "14 July" },
      { val: "B", label: "16 July" },
      { val: "C", label: "13 July" },
      { val: "D", label: "24 July" },
    ],
    answer: "B",
    clues: ["q3", "q3b"],
    hint: (
      <>
        <strong>💡 Hint:</strong> The special offer runs from <em>16–22 July</em>. The
        &quot;gift&quot; is the free scoop. Check which answer dates fall <strong>within</strong>{" "}
        this week. 14 July is before the offer starts!
      </>
    ),
    strategy: (
      <>
        <strong>Numerical Reasoning:</strong> Work with dates carefully. The offer is 16–22 July.
        Check each option: 13 and 14 July are before the offer starts. 24 July is after the offer
        ends. Only 16 July is within the range.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. 16 July</strong>
        <br />
        <br />
        The special offer runs from <strong>16–22 July</strong>. 13 and 14 July are <em>before</em>{" "}
        the offer period, and 24 July is after. B (16 July) is the only date within the promotional
        period.
      </>
    ),
  },
  {
    id: 4,
    part: "part2",
    text: "In the 'Comments' section, the word 'ordinary' means ______.",
    options: [
      { val: "A", label: "common" },
      { val: "B", label: "special" },
      { val: "C", label: "new" },
      { val: "D", label: "strange" },
    ],
    answer: "A",
    clues: ["q4", "q4b"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Jimmy says he prefers &quot;these ordinary flavours to the{" "}
        <em>strange</em> new mix.&quot; The word &quot;ordinary&quot; is <strong>contrasted</strong>{" "}
        with &quot;strange.&quot; If &quot;strange&quot; means unusual, what does
        &quot;ordinary&quot; mean? Think about opposites!
      </>
    ),
    strategy: (
      <>
        <strong>Contextual Inference:</strong> When you don&apos;t know a word&apos;s meaning, look
        at the surrounding words for clues. Here, &quot;ordinary&quot; is contrasted with
        &quot;strange&quot; — they are opposites.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: A. common</strong>
        <br />
        <br />
        Jimmy prefers &quot;ordinary&quot; flavours (vanilla and chocolate) to the
        &quot;strange&quot; new mix. Since &quot;ordinary&quot; is the opposite of
        &quot;strange,&quot; it means <strong>common</strong> (normal, usual).
      </>
    ),
  },
  {
    id: 5,
    part: "part2",
    text: "In the 'Comments' section, 'Ugh!' is the sound of someone finding something ______.",
    options: [
      { val: "A", label: "interesting" },
      { val: "B", label: "expensive" },
      { val: "C", label: "delicious" },
      { val: "D", label: "horrible" },
    ],
    answer: "D",
    clues: ["q5", "q5b", "q5c"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Read what happens after &quot;Ugh!&quot; — the ice cream{" "}
        <em>melted</em>, the colours <em>mixed together</em>, and HappyDave calls it{" "}
        <em>&quot;What a mess!&quot;</em>. Was this a good or bad experience?
      </>
    ),
    strategy: (
      <>
        <strong>Coherence Inference:</strong> Connect the exclamation &quot;Ugh!&quot; with
        HappyDave&apos;s overall attitude. The words &quot;melted,&quot; &quot;mess,&quot; and the
        sarcastic renaming to &quot;Typhoon Ice Cream&quot; all show <strong>negative feelings</strong>.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: D. horrible</strong>
        <br />
        <br />
        &quot;Ugh!&quot; expresses disgust. HappyDave found the melted, messy ice cream{" "}
        <strong>horrible</strong>. The context clues — &quot;melted,&quot; &quot;mixed
        together,&quot; &quot;What a mess!&quot; — all point to a very negative experience.
      </>
    ),
  },
  {
    id: 6,
    part: "part2",
    text: "Who enjoyed 'Rainbow Ice Cream' the most?",
    options: [
      { val: "A", label: "Jimmy1234" },
      { val: "B", label: "CoolChloe01" },
      { val: "C", label: "KatyLovesFood" },
      { val: "D", label: "HappyDave" },
    ],
    answer: "B",
    clues: ["q6"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Look at each comment&apos;s attitude:
        <br />• Jimmy1234 — prefers other flavours (not a fan)
        <br />• CoolChloe01 — <em>&quot;I&apos;m coming back for more!&quot;</em> (very positive!)
        <br />• KatyLovesFood — <em>&quot;Looks good but tastes average&quot;</em> (mixed)
        <br />• HappyDave — <em>&quot;What a mess!&quot;</em> (negative)
        <br />
        <br />
        Who sounds the most enthusiastic?
      </>
    ),
    strategy: (
      <>
        <strong>Coherence Inference:</strong> Match each person&apos;s attitude to the ice cream.
        Compare the <strong>feelings</strong> expressed in each comment. &quot;Coming back for
        more&quot; is the most positive statement of all four comments.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. CoolChloe01</strong>
        <br />
        <br />
        CoolChloe01 says <em>&quot;I&apos;m coming back for more!&quot;</em> — this shows she enjoyed
        it so much she wants to buy it again. The others were negative, mixed, or preferred different
        flavours.
      </>
    ),
  },
];
