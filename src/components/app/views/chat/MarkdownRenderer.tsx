import ReactMarkdown from 'react-markdown';
import React from 'react';
import remarkGfm from 'remark-gfm';
import { cn, getContentDirection } from "@/lib/utils";
import { MatchingChallenge } from './MatchingChallenge';

export const MarkdownRenderer = ({
  content,
  isLatest,
  onSendAnswer
}: {
  content: string;
  isLatest?: boolean;
  onSendAnswer?: (ans: string) => void;
}) => {
  const onSendAnswerRef = React.useRef(onSendAnswer);
  React.useEffect(() => {
    onSendAnswerRef.current = onSendAnswer;
  }, [onSendAnswer]);

  const components = React.useMemo(() => ({
        p: ({ children }: any) => <span className="block mb-3 last:mb-0">{children}</span>,
        ul: ({ children }: any) => <ul className="list-disc mx-5 mb-3 space-y-1 text-foreground/90">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal mx-5 mb-3 space-y-1 text-foreground/90">{children}</ol>,
        li: ({ children }: any) => <li>{children}</li>,
        h1: ({ children }: any) => <strong className="block text-lg mt-5 mb-2 text-foreground font-semibold">{children}</strong>,
        h2: ({ children }: any) => <strong className="block text-md mt-5 mb-2 text-foreground font-semibold">{children}</strong>,
        h3: ({ children }: any) => <strong className="block mt-4 mb-2 text-foreground font-semibold">{children}</strong>,
        code: ({ inline, className, children, ...props }: any) => {
          const isInline = inline || !className;
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (language === 'mcq') {
            const options = String(children).split('\n').map(s => s.trim()).filter(Boolean);
            if (options.length > 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-5 w-full">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (isLatest && onSendAnswerRef.current) {
                          onSendAnswerRef.current(`[[ANSWER]] ${opt}`);
                        }
                      }}
                      disabled={!isLatest}
                      className={cn(
                        "text-start px-4 py-3.5 rounded-xl border text-[14px] font-medium transition-all shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-normal break-words h-auto",
                        isLatest ? "border-border/60 bg-card hover:bg-primary/5 hover:border-primary/40 active:scale-[0.98] cursor-pointer" : "border-border/30 bg-muted/40 opacity-70 cursor-not-allowed"
                      )}
                      dir="auto"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              );
            }
          } else if (language === 'input') {
            const innerText = children ? String(children).trim() : '';
            if (innerText && innerText.toLowerCase() !== 'wait for user response') {
              return (
                <div className="my-3 p-3.5 bg-primary/10 border-l-4 border-primary rtl:border-r-4 rtl:border-l-0 rounded-r-lg rtl:rounded-l-lg rtl:rounded-r-none text-foreground/90 font-medium shadow-sm" dir="auto">
                  {innerText}
                </div>
              );
            }
            return null;
          } else if (language === 'matching') {
            return <MatchingChallenge data={String(children)} isLatest={isLatest} onSendAnswer={(ans) => onSendAnswerRef.current?.(ans)} />;
          }

          return isInline ? (
            <code className="bg-secondary px-1.5 py-0.5 rounded text-[13px] text-foreground/90 font-mono" {...props}>{children}</code>
          ) : (
            <pre className="bg-secondary p-3 rounded-lg overflow-x-auto mb-3 text-[13px] font-mono border border-border/50" dir="ltr">
              <code className="text-foreground/90" {...props}>{children}</code>
            </pre>
          );
        },
        strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }: any) => <em className="italic text-foreground/80">{children}</em>,
        table: ({ children }: any) => <div className="w-full my-4 overflow-x-auto rounded-lg border border-border/50 shadow-sm"><table className="w-full text-sm text-start" dir="auto">{children}</table></div>,
        thead: ({ children }: any) => <thead className="bg-muted/50 text-foreground font-medium">{children}</thead>,
        tbody: ({ children }: any) => <tbody className="divide-y divide-border/50 bg-card/30">{children}</tbody>,
        tr: ({ children }: any) => <tr className="transition-colors hover:bg-muted/30">{children}</tr>,
        th: ({ children }: any) => <th className="px-4 py-3 font-medium border-b border-border/50 whitespace-nowrap text-start">{children}</th>,
        td: ({ children }: any) => <td className="px-4 py-3 text-foreground/90 align-top">{children}</td>,
        blockquote: ({ children }: any) => <blockquote className="border-l-4 border-primary/40 rtl:border-r-4 rtl:border-l-0 px-4 py-1.5 my-3 bg-muted/20 text-foreground/80 italic rounded-r-md rtl:rounded-l-md rtl:rounded-r-none">{children}</blockquote>,
        hr: () => <hr className="my-5 border-border/50" />,
  }), [isLatest]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
};
