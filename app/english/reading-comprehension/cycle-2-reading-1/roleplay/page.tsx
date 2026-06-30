import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_C2R1_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionCycle2Reading1RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="cycle-2-reading-1"
      topicLabel="Cycle 2 · Reading 1 — Story Day"
      backHref="/english/reading-comprehension/cycle-2-reading-1"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_C2R1_FULL_TEXT}`}
    />
  );
}
