import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_C3R3_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionCycle3Reading3RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="cycle-3-reading-3"
      topicLabel="Cycle 3 · Reading 3 — Red Tides"
      backHref="/english/reading-comprehension/cycle-3-reading-3"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_C3R3_FULL_TEXT}`}
    />
  );
}
