import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { Element, Text } from "hast";
import MermaidRenderer from "./MermaidRenderer";

interface Props {
  content: string;
}

function getMermaidText(node: Element | undefined): string | null {
  if (!node?.children) return null;
  const codeChild = node.children.find(
    (c): c is Element => c.type === "element" && c.tagName === "code",
  );
  if (!codeChild) return null;
  const classNames = codeChild.properties?.className;
  if (!Array.isArray(classNames) || !classNames.includes("language-mermaid"))
    return null;
  return codeChild.children
    .filter((c): c is Text => c.type === "text")
    .map((c) => c.value)
    .join("");
}

const components: Components = {
  pre({ children, node }) {
    const mermaidText = getMermaidText(node);
    if (mermaidText) {
      return <MermaidRenderer chart={mermaidText} />;
    }
    return <pre>{children}</pre>;
  },
};

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose max-w-none prose-headings:font-headline prose-headings:text-on-surface prose-p:font-body prose-p:text-on-surface-variant prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:text-tertiary prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20 prose-strong:text-on-surface prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
