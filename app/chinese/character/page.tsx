import ChineseTopicChat from "@/components/ChineseTopicChat";

export default function ChineseCharacterPage() {
  return (
    <ChineseTopicChat
      config={{
        topicId: "character-description",
        topicLabel: "人物描寫",
        sessionPrefix: "chinese-character",
        apiEndpoint: "/api/chinese-topic/character",
      }}
    />
  );
}
