"""
Tests for visualize.py - AI Co-Scientist visualization generator.
"""

import json
import os
import shutil
import tempfile
from pathlib import Path
import pytest
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from visualize import generate_visualization, generate_empty_visualization, calculate_tree_layout
from tree import Project


# Fixture paths
FIXTURES_DIR = Path(__file__).parent / "fixtures"
SAMPLE_PROJECT = FIXTURES_DIR / "sample_project"
SAMPLE_PROJECT_WITH_LOOP = FIXTURES_DIR / "sample_project_with_loop"
EMPTY_PROJECT = FIXTURES_DIR / "empty_project"


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    temp = tempfile.mkdtemp()
    yield Path(temp)
    shutil.rmtree(temp)


@pytest.fixture
def sample_project_copy(temp_dir):
    """Create a copy of sample_project in temp directory."""
    dest = temp_dir / "sample_project"
    shutil.copytree(SAMPLE_PROJECT, dest)
    return dest


@pytest.fixture
def empty_project_copy(temp_dir):
    """Create a copy of empty_project in temp directory."""
    dest = temp_dir / "empty_project"
    shutil.copytree(EMPTY_PROJECT, dest)
    return dest


@pytest.fixture
def loop_project_copy(temp_dir):
    """Create a copy of sample_project_with_loop in temp directory."""
    dest = temp_dir / "loop_project"
    shutil.copytree(SAMPLE_PROJECT_WITH_LOOP, dest)
    return dest


# =============================================================================
# Empty Visualization Tests
# =============================================================================

class TestEmptyVisualization:
    """Tests for empty visualization generation."""

    def test_generate_empty_visualization(self, empty_project_copy):
        """Test generating visualization for empty project."""
        output_path = generate_empty_visualization(str(empty_project_copy))

        assert os.path.exists(output_path)
        assert output_path.endswith("index.html")

        # Verify content
        with open(output_path) as f:
            content = f.read()

        assert "AI Co-Scientist" in content
        assert "p5.js" in content
        assert "TREE_DATA" in content

    def test_empty_visualization_has_empty_trees(self, empty_project_copy):
        """Test that empty visualization has no tree data."""
        output_path = generate_empty_visualization(str(empty_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        assert data["trees"] == {}
        assert data["stage_history"] == []


# =============================================================================
# Full Visualization Tests
# =============================================================================

class TestFullVisualization:
    """Tests for full visualization generation."""

    def test_generate_visualization_all_stages(self, sample_project_copy):
        """Test generating visualization with stage data."""
        output_path = generate_visualization(str(sample_project_copy))

        assert os.path.exists(output_path)

        with open(output_path) as f:
            content = f.read()

        # Verify stage buttons are present
        assert "Stage 0" in content
        assert "Stage 1" in content
        assert "Stage 2" in content
        assert "Stage 3" in content
        assert "Stage 4" in content

    def test_generate_visualization_single_tree(self, sample_project_copy):
        """Test that visualization includes tree with 4 nodes."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        assert "stage_3_iter_1" in data["trees"]
        tree = data["trees"]["stage_3_iter_1"]
        assert len(tree["nodes"]) == 4

    def test_node_colors_data(self, sample_project_copy):
        """Test that node buggy/success status is in visualization data."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        tree = data["trees"]["stage_3_iter_1"]
        nodes = tree["nodes"]

        # node-003 should be buggy
        assert nodes["node-003"]["is_buggy"] is True

        # node-004 should have success metric
        assert nodes["node-004"]["is_buggy"] is False
        assert nodes["node-004"]["metric"]["value"] == 0.88

    def test_edge_rendering_data(self, sample_project_copy):
        """Test that parent-child relationships are in data."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        tree = data["trees"]["stage_3_iter_1"]
        nodes = tree["nodes"]

        # Verify edges: 001→002, 001→003, 002→004
        assert "node-002" in nodes["node-001"]["children"]
        assert "node-003" in nodes["node-001"]["children"]
        assert "node-004" in nodes["node-002"]["children"]

    def test_stage_loop_indicator_data(self, loop_project_copy):
        """Test that loop information is in visualization data."""
        output_path = generate_visualization(str(loop_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        # Check stage history has loop_back entry
        history = data["stage_history"]
        loop_entries = [e for e in history if e.get("outcome") == "loop_back"]
        assert len(loop_entries) == 1
        assert "loop_reason" in loop_entries[0]

    def test_click_node_details_data(self, sample_project_copy):
        """Test that node details (plan, code, output) are in data."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Extract TREE_DATA
        start = content.find("const TREE_DATA = ")
        end = content.find("};", start) + 1
        json_str = content[start + len("const TREE_DATA = "):end]
        data = json.loads(json_str)

        tree = data["trees"]["stage_3_iter_1"]
        node = tree["nodes"]["node-004"]

        assert "plan" in node
        assert "code" in node
        assert "term_out" in node
        assert "analysis" in node
        assert node["plan"] == "Increase to n=1000"


# =============================================================================
# Layout Tests
# =============================================================================

class TestTreeLayout:
    """Tests for tree layout calculation."""

    def test_calculate_tree_layout_single_node(self):
        """Test layout calculation for single node."""
        tree_data = {
            "nodes": {
                "node-001": {
                    "id": "node-001",
                    "parent_id": None,
                    "children": []
                }
            },
            "root_ids": ["node-001"]
        }

        layout = calculate_tree_layout(tree_data)

        assert "node-001" in layout
        assert "x" in layout["node-001"]
        assert "y" in layout["node-001"]

    def test_calculate_tree_layout_multiple_nodes(self):
        """Test layout calculation for tree with children."""
        tree_data = {
            "nodes": {
                "node-001": {
                    "id": "node-001",
                    "parent_id": None,
                    "children": ["node-002", "node-003"]
                },
                "node-002": {
                    "id": "node-002",
                    "parent_id": "node-001",
                    "children": []
                },
                "node-003": {
                    "id": "node-003",
                    "parent_id": "node-001",
                    "children": []
                }
            },
            "root_ids": ["node-001"]
        }

        layout = calculate_tree_layout(tree_data)

        assert len(layout) == 3
        # Parent should be above children (lower y)
        assert layout["node-001"]["y"] < layout["node-002"]["y"]
        assert layout["node-001"]["y"] < layout["node-003"]["y"]
        # Children should be at same level
        assert layout["node-002"]["y"] == layout["node-003"]["y"]

    def test_calculate_tree_layout_empty(self):
        """Test layout calculation for empty tree."""
        tree_data = {
            "nodes": {},
            "root_ids": []
        }

        layout = calculate_tree_layout(tree_data)

        assert layout == {}


# =============================================================================
# Custom Output Path Tests
# =============================================================================

class TestCustomOutputPath:
    """Tests for custom output path."""

    def test_custom_output_path(self, sample_project_copy, temp_dir):
        """Test generating visualization to custom path."""
        custom_path = str(temp_dir / "custom" / "viz.html")

        output_path = generate_visualization(str(sample_project_copy), custom_path)

        assert output_path == custom_path
        assert os.path.exists(custom_path)

    def test_creates_parent_directories(self, sample_project_copy, temp_dir):
        """Test that parent directories are created."""
        custom_path = str(temp_dir / "deep" / "nested" / "path" / "viz.html")

        output_path = generate_visualization(str(sample_project_copy), custom_path)

        assert os.path.exists(custom_path)


# =============================================================================
# HTML Content Tests
# =============================================================================

class TestHTMLContent:
    """Tests for generated HTML content."""

    def test_html_has_required_elements(self, sample_project_copy):
        """Test that HTML has all required UI elements."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Check for required HTML elements
        assert '<div id="header">' in content
        assert '<div id="stage-nav">' in content
        assert '<div id="canvas-container">' in content
        assert '<div id="details-panel">' in content
        assert '<div id="legend">' in content

    def test_html_has_p5js(self, sample_project_copy):
        """Test that HTML includes p5.js."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        assert "p5.js" in content or "p5.min.js" in content

    def test_html_has_hypothesis_display(self, sample_project_copy):
        """Test that hypothesis is included in HTML."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # The hypothesis should be in the TREE_DATA
        assert "Increasing sample size improves prediction accuracy" in content

    def test_html_is_valid(self, sample_project_copy):
        """Test that generated HTML is structurally valid."""
        output_path = generate_visualization(str(sample_project_copy))

        with open(output_path) as f:
            content = f.read()

        # Basic HTML structure checks
        assert content.startswith("<!DOCTYPE html>")
        assert "<html" in content
        assert "</html>" in content
        assert "<head>" in content
        assert "</head>" in content
        assert "<body>" in content
        assert "</body>" in content
