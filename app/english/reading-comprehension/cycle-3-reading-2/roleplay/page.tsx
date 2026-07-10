import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_C3R2_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionCycle3Reading2RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="cycle-3-reading-2"
      topicLabel="Cycle 3 · Reading 2 — Make a Balloon Puff Up"
      backHref="/english/reading-comprehension/cycle-3-reading-2"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_C3R2_FULL_TEXT}`}
    />
  );
}
