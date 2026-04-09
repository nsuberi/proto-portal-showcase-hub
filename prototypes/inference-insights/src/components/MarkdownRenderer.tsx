import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-headline prose-headings:text-on-surface prose-p:font-body prose-p:text-on-surface-variant prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-tertiary prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20 prose-strong:text-on-surface prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
