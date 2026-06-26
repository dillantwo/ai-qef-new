// The English section is English-first, so it should NOT use the CJK-first
// global font (Noto Sans TC renders Latin punctuation like the curly
// apostrophe ’ as a full-width glyph). We override the font for everything
// under /english with a Latin-first stack; Noto Sans TC stays as the final
// fallback so any incidental Chinese (e.g. shared sidebar labels) still renders.
//
// `display: contents` means this wrapper generates no box of its own, so it
// does not disturb any existing flex/grid layouts — only the inherited
// font-family passes down to the English pages.
export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "contents",
        fontFamily:
          'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, var(--font-noto-sans-tc), sans-serif',
      }}
    >
      {children}
    </div>
  );
}
