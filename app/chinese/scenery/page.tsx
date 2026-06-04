import ChineseTopicChat from "@/components/ChineseTopicChat";

export default function ChineseSceneryPage() {
  return (
    <ChineseTopicChat
      config={{
        topicId: "scenery-description",
        topicLabel: "景物描寫",
        sessionPrefix: "chinese-scenery",
        apiEndpoint: "/api/chinese-topic/scenery",
      }}
    />
  );
}
