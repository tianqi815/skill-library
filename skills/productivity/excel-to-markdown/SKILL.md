---
name: excel-to-markdown
description: >-
  Parses Excel (.xlsx, .xls) and CSV spreadsheets into Markdown tables.
  Use when converting Excel to Markdown, parsing spreadsheet tables, or exporting tabular data to documentation.
license: MIT
compatibility: cursor, claude-code, windsurf
metadata:
  author: skill-library
  version: "1.0.0"
  category: productivity
  tags: [excel, csv, markdown, spreadsheet]
  updated: "2026-06-23"
---

# Excel to Markdown

Convert Excel / CSV files to Markdown tables. Prefer running the bundled script for consistent output.

## When to Use

- User asks to convert Excel or CSV to Markdown
- Export spreadsheet content to docs or PR descriptions
- Parse multiple sheets into structured Markdown

## Quick Workflow

```
Task Progress:
- [ ] Confirm input path and output target
- [ ] Install dependencies if missing
- [ ] Run conversion script
- [ ] Verify headers, empty cells, special characters
- [ ] Deliver Markdown
```

## Install Dependencies

```bash
pip install pandas openpyxl
```

- `.xlsx` requires `openpyxl`
- `.xls` also requires `xlrd`
- `.csv` requires `pandas` only

## Run Script

Script: `scripts/excel_to_markdown.py` (same directory as this file)

```bash
python scripts/excel_to_markdown.py input.xlsx
python scripts/excel_to_markdown.py input.xlsx -o output.md
python scripts/excel_to_markdown.py data.csv --sheet "Sheet1"
python scripts/excel_to_markdown.py workbook.xlsx --all-sheets
python scripts/excel_to_markdown.py data.xlsx --max-rows 100
```

| Flag | Description |
|------|-------------|
| `-o`, `--output` | Write to `.md` file; default stdout |
| `--sheet` | Convert specific sheet (repeatable) |
| `--all-sheets` | Convert all sheets with `##` headings |
| `--no-header` | First row is not a header |
| `--max-rows` | Limit rows per table |

## Output Rules

- Escape pipe characters in cells as `\|`
- Replace newlines in cells with spaces
- Empty cells render as blank
