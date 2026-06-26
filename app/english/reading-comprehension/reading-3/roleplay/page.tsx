import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_3_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionReading3RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="reading-3"
      topicLabel="Reading 3 — Pip the Dragon"
      backHref="/english/reading-comprehension/reading-3"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_3_FULL_TEXT}`}
    />
  );
}
