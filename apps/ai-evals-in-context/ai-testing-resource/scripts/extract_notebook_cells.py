#!/usr/bin/env python3
"""Extract selected notebook cells for workshop display.

Reads ai_eval_workshop.ipynb, extracts cells specified in the MANIFEST,
applies Pygments syntax highlighting, extracts chart PNGs from cell outputs,
and writes data/workshop/notebook_cells.json.

Run from ai-testing-resource/:
    python3 scripts/extract_notebook_cells.py
"""

import base64
import json
from pathlib import Path

# Inline Pygments highlighting (avoids importing viewer package which needs Flask)
from pygments import highlight as _pygments_highlight
from pygments.lexers import get_lexer_by_name, PythonLexer
from pygments.formatters import HtmlFormatter


def syntax_highlight(code: str, language: str = "python") -> str:
    try:
        lexer = get_lexer_by_name(language)
    except Exception:
        lexer = PythonLexer()
    formatter = HtmlFormatter(nowrap=True, cssclass="highlight-dark")
    return _pygments_highlight(code, lexer, formatter)


NOTEBOOK_PATH = Path(__file__).resolve().parent.parent.parent / "interactive-notebook" / "ai_eval_workshop.ipynb"
OUTPUT_JSON = Path(__file__).resolve().parent.parent / "data" / "workshop" / "notebook_cells.json"
IMAGES_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "workshop"

# ── Manifest: stage → list of cell specs ──────────────────────────────
# Each spec: (cell_index, id, filename, runnable, test_type, mock_output_override)
# mock_output_override=None means "extract from notebook outputs"
# For merged cells, use a list of indices as cell_index

# ── Hardcoded mock outputs for DataFrame cells ──────────────────────
# Pandas fixed-width text is hard to parse reliably; these are the actual
# notebook outputs captured as structured data.

MOCK_CONTRIVED_FAILURE = {
    "type": "dataframe",
    "preamble": (
        "--- Contrived Example: Faithful but Non-Compliant ---\n\n"
        "Response: \"With your 720 credit score, you'll definitely qualify "
        'for a conventional loan. Your rate will be around 6.5%..."'
    ),
    "columns": ["metric", "verdict"],
    "rows": [
        ["Faithfulness", "PASS"],
        ["AnswerRelevancy", "PASS"],
        ["ContextualPrecision", "PASS"],
        ["Regulatory Compliance", "FAIL"],
        ["Actionability", "PASS"],
    ],
}

MOCK_EVAL_GOLDEN = {
    "type": "dataframe",
    "columns": ["label", "Regulatory Compliance", "Actionability"],
    "rows": [
        ["positive", "PASS", "PASS"],
        ["positive", "PASS", "PASS"],
        ["positive", "PASS", "PASS"],
        ["positive", "FAIL", "PASS"],
        ["positive", "PASS", "PASS"],
        ["positive", "PASS", "FAIL"],
        ["positive", "PASS", "PASS"],
        ["positive", "FAIL", "PASS"],
        ["negative", "FAIL", "FAIL"],
        ["negative", "FAIL", "FAIL"],
        ["negative", "FAIL", "FAIL"],
        ["negative", "FAIL", "FAIL"],
    ],
}

MOCK_BEFORE_AFTER = {
    "type": "dataframe",
    "preamble": "--- Before / After Comparison ---",
    "columns": [
        "Faithfulness (v1)",
        "Faithfulness (v2)",
        "AnswerRelevancy (v1)",
        "AnswerRelevancy (v2)",
        "Regulatory Compliance (v1)",
        "Regulatory Compliance (v2)",
        "Actionability (v1)",
        "Actionability (v2)",
    ],
    "rows": [
        ["PASS", "PASS", "FAIL", "PASS", "PASS", "PASS", "PASS", "PASS"],
        ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS"],
        ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS"],
        ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS", "PASS"],
    ],
    "row_labels": [
        "Straightforward factual",
        "Cross-topic",
        "Multi-document",
        "Compliance-sensitive",
    ],
    "postscript": (
        "\nSummary (20 metric-scenario pairs):\n"
        "  Improved (FAIL -> PASS): 1\n"
        "  Regressed (PASS -> FAIL): 0\n"
        "  Unchanged: 19\n\n"
        "  \u2713 Net positive: improvements with no regressions."
    ),
}

MANIFEST = {
    "stage_1": [
        (3, "knowledge_base", "knowledge_base.py", False, None, None),
        (6, "rag_pipeline", "rag_pipeline.py", True, "RAG", "USE_CELL_7"),
        ([15, 16], "custom_metrics", "custom_metrics.py", False, "GEval", None),
        (18, "contrived_failure", "contrived_test.py", True, "Eval", MOCK_CONTRIVED_FAILURE),
    ],
    "stage_2": [
        (22, "golden_dataset", "golden_dataset.py", False, None, None),
        (24, "eval_golden", "evaluate_golden.py", True, "Eval", MOCK_EVAL_GOLDEN),
        (25, "separation", "separation_analysis.py", False, None, None),
    ],
    "stage_3": [
        (29, "annotated_traces", "annotated_traces.py", False, None, None),
        (32, "cohens_kappa", "cohens_kappa.py", True, "IRR", None),
        (33, "confusion_matrix", "confusion_matrix.py", False, None, None),
        (44, "fleiss_kappa", "fleiss_kappa.py", True, "IRR", None),
    ],
    "stage_4": [
        (52, "diagnosis", "diagnosis.py", False, None, None),
        (54, "prompt_diff", "system_prompt_v2.py", False, None, None),
        (56, "before_after", "regression_test.py", True, "Regression", MOCK_BEFORE_AFTER),
        (62, "judge_v2", "judge_v2.py", False, None, None),
    ],
    "stage_5": [
        (69, "multi_turn", "multi_turn.py", False, None, None),
        (92, "tsr_builder", "tsr_builder.py", True, "TSR", None),
    ],
}


def load_notebook():
    with open(NOTEBOOK_PATH) as f:
        return json.load(f)


def get_cell_source(nb_cells, cell_index):
    """Get source code from one or more cells (merged if list)."""
    if isinstance(cell_index, list):
        parts = []
        for idx in cell_index:
            parts.append("".join(nb_cells[idx]["source"]))
        return "\n\n".join(parts)
    return "".join(nb_cells[cell_index]["source"])


def extract_mock_output(nb_cells, cell_index):
    """Extract mock output data from notebook cell outputs."""
    if isinstance(cell_index, list):
        cell_index = cell_index[-1]

    cell = nb_cells[cell_index]
    outputs = cell.get("outputs", [])
    if not outputs:
        return None

    result = {}
    stream_parts = []

    for output in outputs:
        otype = output.get("output_type", "")

        if otype == "stream":
            text = "".join(output.get("text", []))
            stream_parts.append(text.strip())

        elif otype == "execute_result":
            data = output.get("data", {})
            if "text/plain" in data:
                plain = "".join(data["text/plain"])
                # Check if it looks like a DataFrame
                if "PASS" in plain or "FAIL" in plain:
                    df_result = parse_dataframe_output(plain)
                    # Attach any preceding stream text as preamble
                    if stream_parts:
                        df_result["preamble"] = "\n".join(stream_parts)
                    result = df_result
                    stream_parts = []
                else:
                    stream_parts.append(plain.strip())

        elif otype == "display_data":
            data = output.get("data", {})
            if "image/png" in data:
                result["type"] = "chart"
                result["image_data"] = data["image/png"]

    # If we only had stream output (no DataFrame/chart), assemble it
    if not result and stream_parts:
        result = {"type": "stream", "content": "\n".join(stream_parts)}
    elif result and stream_parts and result.get("type") != "stream":
        # Append remaining stream parts after a DataFrame/chart
        if "preamble" not in result:
            result["preamble"] = "\n".join(stream_parts)

    return result if result else None


def parse_dataframe_output(plain_text):
    """Parse a plain-text DataFrame into structured table data."""
    import re

    lines = [line for line in plain_text.strip().split("\n") if line.strip()]
    if not lines:
        return {"type": "stream", "content": plain_text.strip()}

    # Pandas plain-text uses fixed-width columns.
    # Header line has column names; data lines have index + values.
    header_line = lines[0]
    data_lines = lines[1:]

    # Find column positions by looking at where header words start
    # Use the header and at least one data row to detect alignment
    columns = re.split(r"\s{2,}", header_line.strip())

    rows = []
    for line in data_lines:
        stripped = line.strip()
        # Remove leading index (number or label at start)
        # Match: optional index (number), then the rest
        match = re.match(r"^\d+\s{2,}(.+)$", stripped)
        if match:
            rest = match.group(1)
        else:
            rest = stripped

        row_data = re.split(r"\s{2,}", rest.strip())
        rows.append(row_data)

    return {"type": "dataframe", "columns": columns, "rows": rows}


def save_chart_image(image_data_b64, image_name):
    """Save base64 PNG data to static/images/workshop/."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    image_path = IMAGES_DIR / f"{image_name}.png"
    image_bytes = base64.b64decode(image_data_b64)
    with open(image_path, "wb") as f:
        f.write(image_bytes)
    return f"images/workshop/{image_name}.png"


def trim_cell_source(source, cell_id, max_lines=60):
    """Trim very long cells, keeping the most relevant parts."""
    lines = source.split("\n")
    if len(lines) <= max_lines:
        return source

    # For golden_dataset and annotated_traces, show first examples + ellipsis
    if cell_id in ("golden_dataset", "annotated_traces"):
        kept = lines[: max_lines - 2]
        kept.append("")
        kept.append(f"# ... ({len(lines) - max_lines + 2} more lines)")
        return "\n".join(kept)

    return source


def extract_all():
    nb = load_notebook()
    nb_cells = nb["cells"]
    result = {}

    for stage_name, specs in MANIFEST.items():
        stage_cells = []

        for spec in specs:
            cell_index, cell_id, filename, runnable, test_type, mock_override = spec

            # Get source code
            raw_source = get_cell_source(nb_cells, cell_index)
            trimmed_source = trim_cell_source(raw_source, cell_id)

            # Highlight with Pygments
            lang = "yaml" if filename.endswith(".yaml") else "python"
            code_html = syntax_highlight(trimmed_source, language=lang)

            # Get mock output
            if mock_override == "USE_CELL_7":
                mock_output = extract_mock_output(nb_cells, 7)
            elif mock_override is not None:
                mock_output = mock_override
            else:
                mock_output = extract_mock_output(nb_cells, cell_index)

            # Save chart images separately
            if mock_output and mock_output.get("type") == "chart":
                image_data = mock_output.pop("image_data")
                image_path = save_chart_image(image_data, cell_id)
                mock_output["image_path"] = image_path

            cell_data = {
                "id": cell_id,
                "cell_index": cell_index,
                "filename": filename,
                "code_html": code_html,
                "code_raw": trimmed_source,
                "runnable": runnable,
            }
            if test_type:
                cell_data["test_type"] = test_type
            if mock_output:
                cell_data["mock_output"] = mock_output

            stage_cells.append(cell_data)

        result[stage_name] = stage_cells

    # Write JSON
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Extracted {sum(len(v) for v in result.values())} cells to {OUTPUT_JSON}")
    print(f"Chart images saved to {IMAGES_DIR}/")


if __name__ == "__main__":
    extract_all()
