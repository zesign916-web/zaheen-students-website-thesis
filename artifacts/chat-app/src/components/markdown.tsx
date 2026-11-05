/** Inline: bold, italic, code, markdown links, bare URLs */
function renderInline(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono">$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-75 transition-opacity break-all">$1</a>'
    )
    .replace(
      /(?<!href=")(https?:\/\/[^\s<>")\]]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-75 transition-opacity break-all">$1</a>'
    );
}

/** Detect if every non-empty line in a block is a bullet or numbered item */
function isBulletBlock(lines: string[]): boolean {
  const nonempty = lines.filter(l => l.trim());
  if (nonempty.length === 0) return false;
  return nonempty.every(l => /^[-*•] /.test(l.trim()));
}

function isNumberedBlock(lines: string[]): boolean {
  const nonempty = lines.filter(l => l.trim());
  if (nonempty.length === 0) return false;
  return nonempty.every(l => /^\d+\. /.test(l.trim()));
}

export function Markdown({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");

        if (isBulletBlock(lines)) {
          return (
            <ul key={bi} className="space-y-1.5 pl-1">
              {lines.filter(l => l.trim()).map((line, li) => {
                const text = line.trim().replace(/^[-*•] /, "");
                return (
                  <li key={li} className="flex gap-2.5 items-start">
                    <span className="mt-[0.35em] w-1.5 h-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumberedBlock(lines)) {
          return (
            <ol key={bi} className="space-y-1.5 pl-1 list-none">
              {lines.filter(l => l.trim()).map((line, li) => {
                const m = line.trim().match(/^(\d+)\. (.*)/);
                if (!m) return null;
                return (
                  <li key={li} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground/10 text-foreground/70 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {m[1]}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: renderInline(m[2]) }} />
                  </li>
                );
              })}
            </ol>
          );
        }

        const html = renderInline(lines.join("<br />"));
        return (
          <p
            key={bi}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
}
