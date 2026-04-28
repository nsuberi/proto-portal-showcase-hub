import type { MessagesRequest, MessagesResponse, Message, ToolSchema } from "./types.js";

const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_API_URL ?? "https://api.anthropic.com/v1/messages";
const ANTHROPIC_COUNT_TOKENS_URL = `${ANTHROPIC_BASE_URL}/count_tokens`;
const ANTHROPIC_VERSION = "2023-06-01";

export interface CountTokensRequest {
  model?: string;
  system?: string;
  messages: Message[];
  tools?: ToolSchema[];
}

export interface CountTokensResponse {
  input_tokens: number;
}

export interface AnthropicClientOptions {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

export class AnthropicClient {
  private apiKey: string;
  private defaultModel: string;
  private defaultMaxTokens: number;

  constructor(opts: AnthropicClientOptions = {}) {
    const key = opts.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Export it in your shell or pass it via config."
      );
    }
    this.apiKey = key;
    this.defaultModel = opts.model ?? "claude-sonnet-4-6";
    this.defaultMaxTokens = opts.maxTokens ?? 4096;
  }

  async messages(
    req: Omit<MessagesRequest, "model" | "max_tokens"> &
      Partial<Pick<MessagesRequest, "model" | "max_tokens">>
  ): Promise<MessagesResponse> {
    const body: MessagesRequest = {
      model: req.model ?? this.defaultModel,
      max_tokens: req.max_tokens ?? this.defaultMaxTokens,
      system: req.system,
      messages: req.messages,
      tools: req.tools,
      temperature: req.temperature,
    };

    const res = await fetch(ANTHROPIC_BASE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Anthropic API ${res.status} ${res.statusText}: ${truncate(errText, 500)}`
      );
    }

    return (await res.json()) as MessagesResponse;
  }

  /**
   * Returns the exact input-token count Anthropic would charge for a given
   * messages payload. Used by the /context slash command. Free to call.
   */
  async countTokens(req: CountTokensRequest): Promise<CountTokensResponse> {
    const body = {
      model: req.model ?? this.defaultModel,
      system: req.system,
      messages: req.messages,
      tools: req.tools,
    };

    const res = await fetch(ANTHROPIC_COUNT_TOKENS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Anthropic count_tokens ${res.status} ${res.statusText}: ${truncate(errText, 500)}`
      );
    }

    return (await res.json()) as CountTokensResponse;
  }

  get model(): string {
    return this.defaultModel;
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
