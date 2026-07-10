import ChineseTopicChat from "@/components/ChineseTopicChat";

export default function ChineseCharacterPage() {
  return (
    <ChineseTopicChat
      config={{
        topicId: "character-description",
        topicLabel: "人物描寫",
        sessionPrefix: "chinese-character",
        apiEndpoint: "/api/chinese-topic/character",
        emptyHint: "歡迎來到人物描寫寫作練習！請選擇你要進行的模式：",
        quickStartOptions: [
          { label: "1. 段落描寫", message: "段落描寫" },
          { label: "2. 文章描寫", message: "文章描寫" },
          { label: "3. 構思建議", message: "構思建議" },
        ],
        requireQuickStartSelection: true,
        enableDrafts: true,
      }}
    />
  );
}
