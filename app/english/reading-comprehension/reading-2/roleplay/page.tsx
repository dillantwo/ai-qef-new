import EnglishReadingComprehensionChat from "../../EnglishReadingComprehensionChat";
import { READING_2_FULL_TEXT } from "@/lib/english-prompts";

export default function EnglishReadingComprehensionReading2RoleplayPage() {
  return (
    <EnglishReadingComprehensionChat
      reading="reading-2"
      topicLabel="Reading 2 — Amazing Animals"
      backHref="/english/reading-comprehension/reading-2"
      startMessageText={`Here is our reading. Let's read it together!\n\n${READING_2_FULL_TEXT}`}
    />
  );
}
