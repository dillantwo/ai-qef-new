import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_C2R3_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionCycle2Reading3RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="cycle-2-reading-3"
      topicLabel="Cycle 2 · Reading 3 — A Wonderful School Trip"
      backHref="/english/reading-comprehension/cycle-2-reading-3"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_C2R3_FULL_TEXT}`}
    />
  );
}
