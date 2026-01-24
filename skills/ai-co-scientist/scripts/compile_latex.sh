#!/bin/bash
# Compile ICML paper
#
# Usage: bash compile_latex.sh <paper_directory>
#
# This script compiles a LaTeX paper with the following steps:
# 1. pdflatex (first pass)
# 2. bibtex (process bibliography)
# 3. pdflatex (second pass - resolve references)
# 4. pdflatex (third pass - finalize)

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <paper_directory>"
    echo "Example: $0 ./paper"
    exit 1
fi

PAPER_DIR="$1"
MAIN_FILE="template"

# Check if directory exists
if [ ! -d "$PAPER_DIR" ]; then
    echo "Error: Directory '$PAPER_DIR' not found"
    exit 1
fi

# Check if main tex file exists
if [ ! -f "$PAPER_DIR/$MAIN_FILE.tex" ]; then
    echo "Error: $MAIN_FILE.tex not found in $PAPER_DIR"
    exit 1
fi

cd "$PAPER_DIR"

echo "=== Compiling LaTeX paper in $PAPER_DIR ==="
echo ""

# First pdflatex pass
echo ">>> Pass 1: pdflatex (initial compilation)"
pdflatex -interaction=nonstopmode "$MAIN_FILE.tex" > /dev/null 2>&1 || {
    echo "Warning: First pdflatex pass had errors (this is often normal)"
}

# BibTeX pass (if .bib file exists)
if ls *.bib 1> /dev/null 2>&1; then
    echo ">>> Pass 2: bibtex (processing bibliography)"
    bibtex "$MAIN_FILE" > /dev/null 2>&1 || {
        echo "Warning: BibTeX had errors or warnings"
    }
fi

# Second pdflatex pass
echo ">>> Pass 3: pdflatex (resolving references)"
pdflatex -interaction=nonstopmode "$MAIN_FILE.tex" > /dev/null 2>&1 || {
    echo "Warning: Second pdflatex pass had errors"
}

# Third pdflatex pass
echo ">>> Pass 4: pdflatex (finalizing)"
pdflatex -interaction=nonstopmode "$MAIN_FILE.tex" > /dev/null 2>&1 || {
    echo "Error: Final pdflatex pass failed"
    echo "Check $MAIN_FILE.log for details"
    exit 1
}

# Check if PDF was created
if [ -f "$MAIN_FILE.pdf" ]; then
    echo ""
    echo "=== Compilation successful ==="
    echo "Output: $PAPER_DIR/$MAIN_FILE.pdf"

    # Show page count if pdfinfo is available
    if command -v pdfinfo &> /dev/null; then
        PAGES=$(pdfinfo "$MAIN_FILE.pdf" | grep "Pages:" | awk '{print $2}')
        echo "Pages: $PAGES"
    fi
else
    echo "Error: PDF was not created"
    echo "Check $MAIN_FILE.log for errors"
    exit 1
fi

# Clean up auxiliary files (optional, uncomment if desired)
# rm -f *.aux *.bbl *.blg *.log *.out *.toc *.lof *.lot
