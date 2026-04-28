import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AiAnswerDisplay({ answer }: { answer: string }) {
  return (
    <div className="text-foreground rounded-md p-4 text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 text-xl font-semibold tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-lg font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-7 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-6 list-disc space-y-1 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-6 list-decimal space-y-1 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-border text-muted-foreground my-3 border-l-2 pl-4 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-");
            return isBlock ? (
              <code className="bg-muted block w-full overflow-x-auto rounded-md px-4 py-3 font-mono text-xs">
                {children}
              </code>
            ) : (
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-3">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary font-medium underline underline-offset-4"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-border my-4" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-border bg-muted border px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border border px-3 py-2">{children}</td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {answer}
      </ReactMarkdown>
    </div>
  );
}
