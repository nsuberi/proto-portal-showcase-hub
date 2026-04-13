import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import MermaidRenderer from "./MermaidRenderer";

interface Props {
  content: string;
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1];
    const codeText = String(children).replace(/\n$/, "");

    if (lang === "mermaid") {
      return <MermaidRenderer chart={codeText} />;
    }

    // For inline code (no language class), render as inline
    if (!className) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    // Block code — rendered inside <pre> by react-markdown
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  // Prevent wrapping mermaid output in <pre>
  pre({ children }) {
    // If the child is a MermaidRenderer (rendered from a mermaid code block),
    // return it unwrapped. Check if the child is a non-string React element.
    const child = Array.isArray(children) ? children[0] : children;
    if (
      child &&
      typeof child === "object" &&
      "type" in child &&
      child.type === MermaidRenderer
    ) {
      return <>{children}</>;
    }
    return <pre>{children}</pre>;
  },
};

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-headline prose-headings:text-on-surface prose-p:font-body prose-p:text-on-surface-variant prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-tertiary prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20 prose-strong:text-on-surface prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
