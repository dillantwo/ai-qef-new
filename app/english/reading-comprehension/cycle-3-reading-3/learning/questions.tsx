import type { ReactNode } from "react";

export type PartId = "part1" | "part2" | "part3";

export interface Option {
  val: string;
  label: ReactNode;
}

export interface Question {
  id: number;
  part: PartId;
  text: string;
  /** Optional rich block shown above the options. */
  extra?: ReactNode;
  options: Option[];
  answer: string;
  /** Clue ids highlighted in the article when this question is hinted/answered. */
  clues: string[];
  hint: ReactNode;
  strategy: ReactNode;
  explain: ReactNode;
}

export const TOTAL_QUESTIONS = 8;

export const questions: Question[] = [
  {
    id: 1,
    part: "part1",
    text: "What happened at Stanley Bay in April 2026?",
    options: [
      { val: "A", label: "Many people went swimming there." },
      { val: "B", label: "A red tide happened there." },
      { val: "C", label: "Three red tides appeared there." },
      { val: "D", label: "Many fish died there." },
    ],
    answer: "B",
    clues: ["q1"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Look for the keywords <em>Stanley Bay</em> and <em>April 2026</em>{" "}
        in Paragraph 1. The clue is: <em>&quot;In April 2026, a red tide appeared at Stanley Bay.&quot;</em>
      </>
    ),
    strategy: (
      <>
        <strong>Scan</strong> for the keywords <em>Stanley Bay</em> and <em>April 2026</em> to find
        the clue, then <strong>re-read</strong> to confirm. <strong>Compare</strong> all four
        options and take out the ones the text disproves: nobody swam, only one red tide was here
        (two were in Sai Kung), and no fish died.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. A red tide happened there.</strong>
        <br />
        <br />
        The text says <em>&quot;a red tide appeared at Stanley Bay&quot;</em>, so B matches exactly.
        People were told <em>not</em> to swim (so A is wrong). Only one red tide appeared at Stanley
        Bay — the two more were in Sai Kung (so C is wrong). And <em>&quot;no fish died&quot;</em> (so
        D is wrong).
      </>
    ),
  },
  {
    id: 2,
    part: "part1",
    text: "What did the government do after the red tides appeared?",
    options: [
      { val: "A", label: "It told people to swim carefully." },
      { val: "B", label: "It told people not to swim there." },
      { val: "C", label: "It closed all beaches in Hong Kong." },
      { val: "D", label: "It asked people not to eat fish in Hong Kong." },
    ],
    answer: "B",
    clues: ["q2"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Find the keyword <em>government</em> in Paragraph 1:{" "}
        <em>
          &quot;The government warned the public about the problem. People were told not to swim
          there until it was safe again.&quot;
        </em>
      </>
    ),
    strategy: (
      <>
        <strong>Scan</strong> for the keyword <em>government</em> and <strong>re-read</strong> to
        confirm. <strong>Look for details / evidence</strong> and <strong>compare</strong> the
        options: some seem possible but have no supporting evidence, and others are never mentioned
        — those are just distractors.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. It told people not to swim there.</strong>
        <br />
        <br />
        The text says people were told <em>not to swim</em> (so A is wrong). Closing all beaches (C)
        is not mentioned. Not eating fish (D) seems possible, but there is no supporting evidence in
        the text — it is just a distractor.
      </>
    ),
  },
  {
    id: 3,
    part: "part1",
    text: "People stay out of the sea when there is a red tide because ______.",
    options: [
      { val: "A", label: "some algal blooms may harm people." },
      { val: "B", label: "some fish may attack people." },
      { val: "C", label: "there are not many people at the beach." },
      { val: "D", label: "the sea becomes too hot." },
    ],
    answer: "A",
    clues: ["q3", "q4", "q3b"],
    hint: (
      <>
        <strong>💡 Hint:</strong> The text says the sea <em>&quot;may be unsafe&quot;</em>. Read the
        nearby sentences to find out <em>why</em>:{" "}
        <em>
          &quot;However, a few kinds of algae can be dangerous. Some algal blooms can kill fish and
          harm people.&quot;
        </em>
      </>
    ),
    strategy: (
      <>
        <strong>Scan</strong> for the reason and <strong>re-read</strong> the nearby sentences. The
        text only says &quot;unsafe&quot;, so <strong>understand the cause and effect</strong> and{" "}
        <strong>make an inference</strong> by linking sentences (algae can be dangerous → harm
        people). <strong>Compare</strong> — some options may be true but do not answer <em>why</em>{" "}
        people stay out of the sea.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: A. some algal blooms may harm people.</strong>
        <br />
        <br />
        The sea is unsafe because <em>&quot;a few kinds of algae can be dangerous&quot;</em> and{" "}
        <em>&quot;some algal blooms can kill fish and harm people&quot;</em>. Fish attacking (B) is
        not mentioned. C and D may be true, but they do not answer <em>why people stay out</em>.
      </>
    ),
  },
  {
    id: 4,
    part: "part1",
    text: "Paragraph 2 is mainly about ______.",
    options: [
      { val: "A", label: "the algal blooms around the world" },
      { val: "B", label: "what algae look like" },
      { val: "C", label: "the dangers of red tides" },
      { val: "D", label: "how to swim safely when there is a red tide" },
    ],
    answer: "C",
    clues: ["q4all"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Skim the <em>whole</em> of Paragraph 2 for the <em>main idea</em>.
        It talks about algae that <em>&quot;can be dangerous&quot;</em> and{" "}
        <em>&quot;can kill fish and harm people&quot;</em>.
      </>
    ),
    strategy: (
      <>
        <strong>Skim</strong> the whole paragraph for the gist and <strong>re-read</strong> to
        confirm the main idea. <strong>Compare</strong> the options: a good main-idea answer covers
        the <em>whole</em> paragraph, not just one small detail or something the text never
        describes.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: C. the dangers of red tides.</strong>
        <br />
        <br />
        Paragraph 2 explains what red tides are and how they can be harmful. &quot;Algal blooms
        around the world&quot; (A) is just one small part. The paragraph does not describe what algae
        look like (B), and people are told <em>not</em> to swim, so D is wrong.
      </>
    ),
  },
  {
    id: 5,
    part: "part2",
    text: "What is an algal bloom?",
    options: [
      { val: "A", label: "a place where fish and plants live" },
      { val: "B", label: "the quick growth of algae in the water" },
      { val: "C", label: "dirty water from farms and gardens" },
      { val: "D", label: "a kind of living thing in the sea" },
    ],
    answer: "B",
    clues: ["q5"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Find the clue in Paragraph 2:{" "}
        <em>
          &quot;They occur when tiny living things called algae grow very quickly in the water. This
          sudden growth is called an algal bloom.&quot;
        </em>
      </>
    ),
    strategy: (
      <>
        <strong>Scan</strong> for the word and <strong>re-read</strong> the clue.{" "}
        <strong>Look for details / evidence</strong> and understand the difference between a{" "}
        <em>thing</em> (algae) and a <em>process</em> (the bloom = the quick growth).{" "}
        <strong>Compare</strong> — some options describe algae itself or a detail from another
        paragraph, not the bloom.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. the quick growth of algae in the water.</strong>
        <br />
        <br />
        The text says <em>&quot;this sudden growth is called an algal bloom&quot;</em>. Dirty water
        (C) is mentioned in Paragraph 3 but does not answer the question. D describes <em>algae</em>,
        not the <em>algal bloom</em>.
      </>
    ),
  },
  {
    id: 6,
    part: "part2",
    text: 'In Paragraph 3, what does the word "nutrients" mean?',
    options: [
      { val: "A", label: "things in water that help algae grow" },
      { val: "B", label: "small animals that eat algae" },
      { val: "C", label: "dirty things found only on beaches" },
      { val: "D", label: "colours that make the sea look red" },
    ],
    answer: "A",
    clues: ["q6"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Find the word <em>nutrients</em> in Paragraph 3:{" "}
        <em>&quot;too many nutrients in the sea can help red tides form.&quot;</em> Nutrients are
        something that helps algae grow.
      </>
    ),
    strategy: (
      <>
        <strong>Scan</strong> for the word <em>nutrients</em> and <strong>re-read</strong> the
        sentence. <strong>Activate</strong> your background knowledge (what helps living things
        grow?) and <strong>make an inference</strong> from the surrounding words.{" "}
        <strong>Compare</strong> — take out the options that are not mentioned in the text or that
        cannot help algae grow.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: A. things in water that help algae grow.</strong>
        <br />
        <br />
        The clue shows nutrients <em>help algae grow</em>. Small animals (B) are not mentioned.
        Nutrients come from dirty water, farms and gardens — not <em>only</em> beaches (C). Colours
        (D) cannot help algae grow.
      </>
    ),
  },
  {
    id: 7,
    part: "part2",
    text: "The writer is ______ red tides.",
    options: [
      { val: "A", label: "excited about" },
      { val: "B", label: "worried about" },
      { val: "C", label: "bored with" },
      { val: "D", label: "surprised by" },
    ],
    answer: "B",
    clues: ["q3b", "q7"],
    hint: (
      <>
        <strong>💡 Hint:</strong> Re-read Paragraphs 2 and 3. The
        writer talks about <em>danger</em>, <em>safety</em>, and{" "}
        <em>protecting the environment</em>.
      </>
    ),
    strategy: (
      <>
        <strong>Re-read</strong> Paragraphs 2 and 3 and <strong>interpret</strong> the writer&apos;s
        attitude and feelings — is it positive, neutral or negative?{" "}
        <strong>Make an inference</strong> from the details (danger, safety, protecting the
        environment) that the writer treats red tides as a serious problem, then{" "}
        <strong>compare</strong> the options.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. worried about.</strong>
        <br />
        <br />
        The writer explains dangers, warnings and how to protect the environment, so they think red
        tides are a serious problem. There is no evidence of being excited (A). The writer gives
        important warnings, so &quot;bored&quot; (C) is wrong. Red tides are a known problem, so
        &quot;surprised&quot; (D) is not the best answer.
      </>
    ),
  },
  {
    id: 8,
    part: "part3",
    text: "______ is the best title for this article?",
    options: [
      { val: "A", label: "The Sea Water Turns Red" },
      { val: "B", label: "Red Tides in Hong Kong" },
      { val: "C", label: "How Algae Grow in the Sea" },
      { val: "D", label: "Warnings at Hong Kong Beaches" },
    ],
    answer: "B",
    clues: [],
    hint: (
      <>
        <strong>💡 Hint:</strong> A good title covers the <em>whole</em> article. Think about the
        main idea of all three paragraphs together.
      </>
    ),
    strategy: (
      <>
        <strong>Skim</strong> the whole text and link up the three paragraphs to make a summary,
        then <strong>re-read</strong> to confirm. <strong>Compare</strong> the titles — a good title
        covers the whole article and is not too narrow or only one part of it.
      </>
    ),
    explain: (
      <>
        <strong>✅ Correct: B. Red Tides in Hong Kong.</strong>
        <br />
        <br />
        The article is about red tides in Hong Kong — the events, what they are, why they happen and
        what people can do. A and C are too narrow (only the colour, or only algae growth). D
        (warnings) is only one part of the article.
      </>
    ),
  },
];
