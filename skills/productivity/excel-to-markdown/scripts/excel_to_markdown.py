#!/usr/bin/env python3
"""Convert Excel (.xlsx, .xls) or CSV files to Markdown tables."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd


def escape_cell(value: object) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).replace("|", "\\|").replace("\n", " ").replace("\r", " ")
    return text.strip()


def dataframe_to_markdown(df: pd.DataFrame, header: bool = True) -> str:
    df = df.fillna("")

    if df.empty:
        return "_Empty table_\n"

    rows: list[list[str]] = []
    if header:
        rows.append([escape_cell(c) for c in df.columns])
    for _, row in df.iterrows():
        rows.append([escape_cell(v) for v in row.tolist()])

    if not rows:
        return "_Empty table_\n"

    col_count = max(len(r) for r in rows)
    normalized = [r + [""] * (col_count - len(r)) for r in rows]

    lines: list[str] = []
    lines.append("| " + " | ".join(normalized[0]) + " |")
    lines.append("| " + " | ".join(["---"] * col_count) + " |")
    for row in normalized[1:]:
        lines.append("| " + " | ".join(row) + " |")

    return "\n".join(lines) + "\n"


def read_csv(path: Path) -> pd.DataFrame:
    for encoding in ("utf-8-sig", "utf-8", "gbk"):
        try:
            return pd.read_csv(path, encoding=encoding, dtype=str, keep_default_na=False)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def read_excel(path: Path, sheet: str | int) -> pd.DataFrame:
    suffix = path.suffix.lower()
    engine = "xlrd" if suffix == ".xls" else "openpyxl"
    return pd.read_excel(path, sheet_name=sheet, dtype=str, engine=engine)


def load_workbook_sheets(path: Path) -> list[str]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return ["csv"]
    engine = "xlrd" if suffix == ".xls" else "openpyxl"
    book = pd.ExcelFile(path, engine=engine)
    return list(book.sheet_names)


def convert_file(
    input_path: Path,
    *,
    sheets: list[str] | None,
    all_sheets: bool,
    header: bool,
    max_rows: int | None,
) -> str:
    suffix = input_path.suffix.lower()
    parts: list[str] = [f"# {input_path.stem}\n"]

    if suffix == ".csv":
        df = read_csv(input_path)
        if max_rows is not None:
            df = df.head(max_rows)
        parts.append(dataframe_to_markdown(df, header=header))
        return "\n".join(parts)

    available = load_workbook_sheets(input_path)
    target_sheets: list[str]
    if all_sheets:
        target_sheets = available
    elif sheets:
        missing = [s for s in sheets if s not in available]
        if missing:
            raise ValueError(f"Sheet not found: {', '.join(missing)}. Available: {', '.join(available)}")
        target_sheets = sheets
    else:
        target_sheets = [available[0]]

    for name in target_sheets:
        df = read_excel(input_path, name)
        if max_rows is not None:
            df = df.head(max_rows)
        parts.append(f"## {name}\n")
        parts.append(dataframe_to_markdown(df, header=header))

    return "\n".join(parts)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert Excel/CSV files to Markdown tables.")
    parser.add_argument("input", type=Path, help="Input .xlsx, .xls, or .csv file")
    parser.add_argument("-o", "--output", type=Path, help="Output .md file (default: stdout)")
    parser.add_argument("--sheet", action="append", dest="sheets", metavar="NAME", help="Sheet to convert (repeatable)")
    parser.add_argument("--all-sheets", action="store_true", help="Convert all sheets")
    parser.add_argument("--no-header", action="store_true", help="Do not treat first row as header")
    parser.add_argument("--max-rows", type=int, metavar="N", help="Limit rows per table")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    input_path: Path = args.input

    if not input_path.is_file():
        print(f"Error: file not found: {input_path}", file=sys.stderr)
        return 1

    if args.sheets and args.all_sheets:
        print("Error: use either --sheet or --all-sheets, not both", file=sys.stderr)
        return 1

    try:
        markdown = convert_file(
            input_path,
            sheets=args.sheets,
            all_sheets=args.all_sheets,
            header=not args.no_header,
            max_rows=args.max_rows,
        )
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if args.output:
        args.output.write_text(markdown, encoding="utf-8")
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(markdown)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
