export default function ChineseWenyanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex flex-1 flex-col min-h-0 overflow-hidden">{children}</main>;
}
