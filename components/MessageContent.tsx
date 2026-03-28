type MessageContentProps = {
  content: string;
};

export default function MessageContent({ content }: MessageContentProps) {
  const blocks = content.split(/```/g);

  return (
    <div className="stack-sm">
      {blocks.map((block, index) => {
        const isCode = index % 2 === 1;
        const trimmed = block.trim();

        if (!trimmed) {
          return null;
        }

        if (isCode) {
          const lines = trimmed.split("\n");
          const maybeLanguage = lines[0]?.trim().toLowerCase();
          const hasLanguage = Boolean(
            maybeLanguage && maybeLanguage.length <= 20 && /^[a-z0-9#+.-]+$/.test(maybeLanguage)
          );
          const code = hasLanguage ? lines.slice(1).join("\n") : trimmed;

          return (
            <pre key={`${index}-${trimmed.slice(0, 12)}`} className="card surface-muted">
              <code>{code}</code>
            </pre>
          );
        }

        return trimmed.split("\n").map((paragraph, paragraphIndex) => (
          <p
            key={`${index}-${paragraphIndex}-${paragraph.slice(0, 12)}`}
            className="page-copy"
            style={{ whiteSpace: "pre-wrap", margin: 0 }}
          >
            {paragraph}
          </p>
        ));
      })}
    </div>
  );
}
