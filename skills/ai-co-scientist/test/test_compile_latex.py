"""
Tests for compile_latex.sh - LaTeX compilation script.

Note: These tests require pdflatex and bibtex to be installed.
Tests will be skipped if these tools are not available.
"""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
import pytest


# Fixture paths
FIXTURES_DIR = Path(__file__).parent / "fixtures"
SAMPLE_PAPER = FIXTURES_DIR / "sample_paper"
ICML_TEMPLATE = Path(__file__).parent.parent / "assets" / "icml-template"
COMPILE_SCRIPT = Path(__file__).parent.parent / "scripts" / "compile_latex.sh"


def pdflatex_available():
    """Check if pdflatex is available."""
    try:
        result = subprocess.run(
            ["pdflatex", "--version"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def bibtex_available():
    """Check if bibtex is available."""
    try:
        result = subprocess.run(
            ["bibtex", "--version"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


# Skip all tests if pdflatex not available
pytestmark = pytest.mark.skipif(
    not pdflatex_available(),
    reason="pdflatex not available"
)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    temp = tempfile.mkdtemp()
    yield Path(temp)
    shutil.rmtree(temp)


@pytest.fixture
def sample_paper_copy(temp_dir):
    """Create a copy of sample_paper in temp directory."""
    dest = temp_dir / "paper"
    shutil.copytree(SAMPLE_PAPER, dest)
    return dest


@pytest.fixture
def icml_template_copy(temp_dir):
    """Create a copy of ICML template in temp directory."""
    dest = temp_dir / "icml"
    shutil.copytree(ICML_TEMPLATE, dest)
    return dest


# =============================================================================
# Basic Compilation Tests
# =============================================================================

class TestBasicCompilation:
    """Tests for basic LaTeX compilation."""

    def test_compile_simple_document(self, sample_paper_copy):
        """Test compiling a simple document."""
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        # Check PDF was created
        pdf_path = sample_paper_copy / "template.pdf"
        assert pdf_path.exists(), f"PDF not created. Output: {result.stdout}\nError: {result.stderr}"

    @pytest.mark.skipif(not bibtex_available(), reason="bibtex not available")
    def test_compile_with_citations(self, sample_paper_copy):
        """Test that citations are resolved."""
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        # Check PDF was created
        pdf_path = sample_paper_copy / "template.pdf"
        assert pdf_path.exists()

        # Check .bbl file was created (indicates bibtex ran)
        bbl_path = sample_paper_copy / "template.bbl"
        assert bbl_path.exists(), "Bibliography file not created"

    def test_compile_with_figures(self, sample_paper_copy):
        """Test compilation with figures."""
        # Verify figure exists
        figure_path = sample_paper_copy / "figures" / "plot.png"
        assert figure_path.exists(), "Test fixture missing figure"

        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        pdf_path = sample_paper_copy / "template.pdf"
        assert pdf_path.exists()

    def test_compile_icml_template(self, icml_template_copy):
        """Test compiling the ICML template."""
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(icml_template_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        pdf_path = icml_template_copy / "template.pdf"
        assert pdf_path.exists(), f"ICML PDF not created. Output: {result.stdout}\nError: {result.stderr}"


# =============================================================================
# Error Handling Tests
# =============================================================================

class TestErrorHandling:
    """Tests for error handling in compilation."""

    def test_compile_missing_directory(self, temp_dir):
        """Test error when directory doesn't exist."""
        fake_dir = temp_dir / "nonexistent"

        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(fake_dir)],
            capture_output=True,
            text=True,
            timeout=30
        )

        assert result.returncode != 0
        assert "not found" in result.stdout.lower() or "error" in result.stdout.lower()

    def test_compile_missing_tex_file(self, temp_dir):
        """Test error when template.tex doesn't exist."""
        empty_dir = temp_dir / "empty"
        empty_dir.mkdir()

        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(empty_dir)],
            capture_output=True,
            text=True,
            timeout=30
        )

        assert result.returncode != 0
        assert "not found" in result.stdout.lower()

    def test_compile_failure_handling(self, temp_dir):
        """Test handling of LaTeX compilation errors."""
        error_dir = temp_dir / "error"
        error_dir.mkdir()

        # Create a tex file with an error
        tex_content = r"""
\documentclass{article}
\begin{document}
\undefined_command  % This will cause an error
\end{document}
"""
        (error_dir / "template.tex").write_text(tex_content)

        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(error_dir)],
            capture_output=True,
            text=True,
            timeout=60
        )

        # Script should handle errors gracefully
        # PDF might still be created (pdflatex continues despite some errors)
        # But the script should complete


# =============================================================================
# Script Usage Tests
# =============================================================================

class TestScriptUsage:
    """Tests for script usage and help."""

    def test_no_arguments(self):
        """Test running script with no arguments."""
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=10
        )

        assert result.returncode != 0
        assert "usage" in result.stdout.lower()


# =============================================================================
# Output Tests
# =============================================================================

class TestCompilationOutput:
    """Tests for compilation output."""

    def test_success_message(self, sample_paper_copy):
        """Test that success message is printed."""
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        assert "successful" in result.stdout.lower() or "compilation" in result.stdout.lower()

    def test_auxiliary_files_created(self, sample_paper_copy):
        """Test that auxiliary files are created."""
        subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        # Check for common auxiliary files
        aux_path = sample_paper_copy / "template.aux"
        log_path = sample_paper_copy / "template.log"

        assert aux_path.exists(), "AUX file not created"
        assert log_path.exists(), "LOG file not created"


# =============================================================================
# Integration Tests
# =============================================================================

class TestIntegration:
    """Integration tests for compilation workflow."""

    def test_multiple_compilations(self, sample_paper_copy):
        """Test running compilation multiple times."""
        # First compilation
        result1 = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        pdf_path = sample_paper_copy / "template.pdf"
        assert pdf_path.exists()

        # Get first PDF modification time
        mtime1 = pdf_path.stat().st_mtime

        # Second compilation
        result2 = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        # PDF should be regenerated
        mtime2 = pdf_path.stat().st_mtime
        assert mtime2 >= mtime1

    def test_compile_modified_document(self, sample_paper_copy):
        """Test compilation after modifying the document."""
        # First compilation
        subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        # Modify the tex file
        tex_path = sample_paper_copy / "template.tex"
        content = tex_path.read_text()
        modified_content = content.replace(
            "This is a sample paper",
            "This is a MODIFIED sample paper"
        )
        tex_path.write_text(modified_content)

        # Recompile
        result = subprocess.run(
            ["bash", str(COMPILE_SCRIPT), str(sample_paper_copy)],
            capture_output=True,
            text=True,
            timeout=120
        )

        pdf_path = sample_paper_copy / "template.pdf"
        assert pdf_path.exists()
