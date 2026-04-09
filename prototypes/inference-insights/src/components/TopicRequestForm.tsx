import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSubmit: (topic: string) => Promise<boolean>;
}

export default function TopicRequestForm({ onSubmit }: Props) {
  const [topic, setTopic] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const ok = await onSubmit(topic.trim());
    if (ok) {
      setTopic("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-6">
      <h2 className="font-headline text-lg font-semibold text-on-surface mb-2">
        Request a Topic
      </h2>
      <p className="font-body text-sm text-on-surface-variant mb-4">
        Suggest a topic for the research loop to explore in a future session.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Mixture of Experts routing strategies"
          className="flex-1 bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 font-label text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!topic.trim()}
          className="inline-flex items-center gap-2 font-label text-sm px-4 py-2.5 rounded-lg bg-primary text-on-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>

      {submitted && (
        <p className="font-label text-xs text-domain-ml mt-3">
          Topic submitted! It will be picked up in the next research session.
        </p>
      )}
    </section>
  );
}
