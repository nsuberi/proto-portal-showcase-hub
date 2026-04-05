/**
 * Code editor tokens for syntax-highlighted environments
 */

export interface CodeEditorTokens {
  background: string;
  foreground: string;
  lineNumber: string;
  activeLine: string;
  selection: string;
  cursor: string;
  gutterBackground: string;
  gutterBorder: string;
}

export const codeEditorTokens: CodeEditorTokens = {
  background: "230 40% 10%",
  foreground: "0 0% 92%",
  lineNumber: "220 15% 40%",
  activeLine: "230 35% 14%",
  selection: "263 55% 50%",
  cursor: "0 0% 92%",
  gutterBackground: "230 40% 8%",
  gutterBorder: "230 25% 18%",
};
