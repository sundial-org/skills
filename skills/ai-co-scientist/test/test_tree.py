"""
Tests for tree.py - AI Co-Scientist tree management script.
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
from tree import Project, Node, StageTree, StageHistory


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
# Project Tests
# =============================================================================

class TestProjectInit:
    """Tests for project initialization."""

    def test_init_project(self, temp_dir):
        """Test creating a new project."""
        project_path = temp_dir / "new_project"
        project_path.mkdir()

        project = Project(project_path)
        project.init_project()

        # Verify directory structure
        assert (project_path / ".co-scientist").exists()
        assert (project_path / ".co-scientist" / "project.json").exists()
        assert (project_path / ".co-scientist" / "stage_history.json").exists()
        assert (project_path / ".co-scientist" / "trees").exists()
        assert (project_path / ".co-scientist" / "viz").exists()

        # Verify project.json content
        with open(project_path / ".co-scientist" / "project.json") as f:
            config = json.load(f)
        # Use realpath to handle macOS /var -> /private/var symlink
        assert os.path.realpath(config["project_path"]) == os.path.realpath(str(project_path))
        assert config["hypothesis"] is None

    def test_load_project(self, sample_project_copy):
        """Test loading an existing project."""
        project = Project(sample_project_copy)
        project.load_project()

        assert project.config is not None
        assert project.config.hypothesis == "Increasing sample size improves prediction accuracy"
        assert project.config.variables["independent"] == ["sample_size"]
        assert project.stage_history is not None
        assert project.stage_history.current_stage == 3


class TestProjectConfig:
    """Tests for project configuration."""

    def test_set_hypothesis(self, empty_project_copy):
        """Test setting project hypothesis."""
        project = Project(empty_project_copy)
        project.load_project()

        project.set_hypothesis("Test hypothesis")

        # Reload and verify
        project2 = Project(empty_project_copy)
        project2.load_project()
        assert project2.config.hypothesis == "Test hypothesis"

    def test_set_variables(self, empty_project_copy):
        """Test setting project variables."""
        project = Project(empty_project_copy)
        project.load_project()

        project.set_variables(
            independent=["x", "y"],
            dependent=["z"],
            control=["seed"]
        )

        # Reload and verify
        project2 = Project(empty_project_copy)
        project2.load_project()
        assert project2.config.variables["independent"] == ["x", "y"]
        assert project2.config.variables["dependent"] == ["z"]
        assert project2.config.variables["control"] == ["seed"]

    def test_set_resource_budget(self, empty_project_copy):
        """Test setting resource budget."""
        project = Project(empty_project_copy)
        project.load_project()

        project.set_resource_budget(max_iterations=50, max_time="4h")

        project2 = Project(empty_project_copy)
        project2.load_project()
        assert project2.config.resource_budget["max_iterations"] == 50
        assert project2.config.resource_budget["max_time"] == "4h"


# =============================================================================
# Stage Management Tests
# =============================================================================

class TestStageManagement:
    """Tests for stage management."""

    def test_start_stage(self, empty_project_copy):
        """Test starting a new stage."""
        project = Project(empty_project_copy)
        project.load_project()

        tree = project.start_stage(0)

        assert tree is not None
        assert tree.stage == 0
        assert tree.iteration == 1
        assert project.stage_history.current_stage == 0
        assert project.stage_history.current_iteration == 1

        # Verify tree file was created
        tree_file = empty_project_copy / ".co-scientist" / "trees" / "stage_0_iter_1.json"
        assert tree_file.exists()

    def test_complete_stage(self, sample_project_copy):
        """Test completing a stage."""
        project = Project(sample_project_copy)
        project.load_project()

        project.complete_stage("success")

        # Reload and verify
        project2 = Project(sample_project_copy)
        project2.load_project()

        history = project2.get_stage_history()
        last_entry = history[-1]
        assert last_entry["outcome"] == "success"
        assert last_entry["completed"] is not None

    def test_loop_back(self, sample_project_copy):
        """Test looping back to earlier stage."""
        project = Project(sample_project_copy)
        project.load_project()

        # Currently at stage 3, loop back to stage 1
        # Note: sample_project already has stage 1 iteration 1 in history,
        # so this creates iteration 2
        tree = project.loop_back(1, "Results inconclusive")

        assert tree.stage == 1
        assert tree.iteration == 2  # Second iteration since stage 1 already existed
        assert project.stage_history.current_stage == 1

        # Verify history has loop_back entry
        history = project.get_stage_history()
        loop_entry = [e for e in history if e.get("loop_reason")]
        assert len(loop_entry) == 1
        assert loop_entry[0]["loop_reason"] == "Results inconclusive"

    def test_get_stage_history(self, sample_project_copy):
        """Test getting stage history."""
        project = Project(sample_project_copy)
        project.load_project()

        history = project.get_stage_history()

        assert len(history) == 4
        assert history[0]["stage"] == 0
        assert history[0]["outcome"] == "success"
        assert history[3]["stage"] == 3
        assert history[3]["outcome"] is None

    def test_loop_back_creates_iteration(self, loop_project_copy):
        """Test that looping back creates new iteration."""
        project = Project(loop_project_copy)
        project.load_project()

        # Verify stage_1_iter_2 exists
        history = project.get_stage_history()
        stage_1_entries = [e for e in history if e["stage"] == 1]
        assert len(stage_1_entries) == 2
        assert stage_1_entries[0]["iteration"] == 1
        assert stage_1_entries[1]["iteration"] == 2


# =============================================================================
# Tree Operations Tests
# =============================================================================

class TestTreeOperations:
    """Tests for tree node operations."""

    def test_add_node_root(self, sample_project_copy):
        """Test adding a root node."""
        project = Project(sample_project_copy)
        project.load_project()

        node = project.add_node(
            parent_id=None,
            plan="New root experiment",
            code="print('hello')"
        )

        assert node is not None
        assert node.parent_id is None
        assert node.plan == "New root experiment"
        assert node.step == 5  # Next step after existing 4 nodes

        tree = project.get_current_tree()
        assert node.id in tree.root_ids

    def test_add_node_child(self, sample_project_copy):
        """Test adding a child node."""
        project = Project(sample_project_copy)
        project.load_project()

        node = project.add_node(
            parent_id="node-004",
            plan="Child of node-004",
            code="print('child')"
        )

        assert node.parent_id == "node-004"

        tree = project.get_current_tree()
        parent = tree.nodes["node-004"]
        assert node.id in parent.children

    def test_add_node_to_nonexistent_parent(self, sample_project_copy):
        """Test adding node to non-existent parent raises error."""
        project = Project(sample_project_copy)
        project.load_project()

        with pytest.raises(ValueError, match="not found"):
            project.add_node(
                parent_id="fake-id",
                plan="Should fail",
                code="pass"
            )

    def test_mark_buggy(self, sample_project_copy):
        """Test marking a node as buggy."""
        project = Project(sample_project_copy)
        project.load_project()

        # Mark node-004 as buggy
        project.mark_buggy("node-004", "Test error")

        tree = project.get_current_tree()
        node = tree.nodes["node-004"]
        assert node.is_buggy is True
        assert "Test error" in node.analysis

    def test_mark_success(self, sample_project_copy):
        """Test marking a node as success."""
        project = Project(sample_project_copy)
        project.load_project()

        # Add a new node and mark it success
        new_node = project.add_node(None, "Test", "pass")
        project.mark_success(
            new_node.id,
            metrics={"value": 0.95, "name": "accuracy", "maximize": True},
            analysis="Excellent result"
        )

        tree = project.get_current_tree()
        node = tree.nodes[new_node.id]
        assert node.is_buggy is False
        assert node.metric["value"] == 0.95
        assert node.analysis == "Excellent result"

    def test_update_node(self, sample_project_copy):
        """Test updating node fields."""
        project = Project(sample_project_copy)
        project.load_project()

        project.update_node(
            "node-001",
            status="success",
            metrics={"value": 0.80, "name": "accuracy", "maximize": True},
            analysis="Updated analysis",
            plots=["new_plot.png"]
        )

        tree = project.get_current_tree()
        node = tree.nodes["node-001"]
        assert node.metric["value"] == 0.80
        assert node.analysis == "Updated analysis"
        assert "new_plot.png" in node.plots

    def test_get_best_nodes(self, sample_project_copy):
        """Test getting best nodes by metric."""
        project = Project(sample_project_copy)
        project.load_project()

        best = project.get_best_nodes(top_k=2)

        assert len(best) == 2
        # node-004 has highest metric (0.88)
        assert best[0].id == "node-004"
        assert best[0].metric["value"] == 0.88
        # node-002 has second highest (0.85)
        assert best[1].id == "node-002"

    def test_get_next_candidates(self, sample_project_copy):
        """Test getting next experiment candidates."""
        project = Project(sample_project_copy)
        project.load_project()

        candidates = project.get_next_candidates()

        # Should return non-buggy leaf nodes
        # node-003 is buggy (excluded), node-004 is leaf and not buggy
        assert len(candidates) == 1
        assert candidates[0].id == "node-004"

    def test_get_node(self, sample_project_copy):
        """Test getting a specific node."""
        project = Project(sample_project_copy)
        project.load_project()

        node = project.get_node("node-002")

        assert node is not None
        assert node.plan == "Increase to n=500"

        # Non-existent node
        assert project.get_node("fake-id") is None


# =============================================================================
# Export Tests
# =============================================================================

class TestExport:
    """Tests for export functionality."""

    def test_export_all_trees(self, sample_project_copy):
        """Test exporting all trees."""
        project = Project(sample_project_copy)
        project.load_project()

        export = project.export_all_trees()

        assert "project_path" in export
        assert "hypothesis" in export
        assert "stage_history" in export
        assert "trees" in export
        assert "stage_3_iter_1" in export["trees"]

    def test_get_tree_for_stage(self, sample_project_copy):
        """Test getting tree for specific stage."""
        project = Project(sample_project_copy)
        project.load_project()

        tree = project.get_tree_for_stage(3, 1)

        assert tree is not None
        assert tree.stage == 3
        assert tree.iteration == 1
        assert len(tree.nodes) == 4


# =============================================================================
# Node Data Structure Tests
# =============================================================================

class TestNodeDataStructure:
    """Tests for Node data structure."""

    def test_node_create(self):
        """Test creating a new node."""
        node = Node.create(
            parent_id="parent-123",
            step=5,
            stage=3,
            plan="Test plan",
            code="print('test')"
        )

        assert node.id.startswith("node-")
        assert node.parent_id == "parent-123"
        assert node.step == 5
        assert node.stage == 3
        assert node.plan == "Test plan"
        assert node.code == "print('test')"
        assert node.is_buggy is False
        assert node.children == []

    def test_node_to_dict(self):
        """Test converting node to dictionary."""
        node = Node.create(None, 1, 0, "Plan", "Code")
        d = node.to_dict()

        assert d["id"] == node.id
        assert d["plan"] == "Plan"
        assert d["code"] == "Code"

    def test_node_from_dict(self):
        """Test creating node from dictionary."""
        d = {
            "id": "node-test",
            "parent_id": None,
            "children": [],
            "step": 1,
            "stage": 0,
            "plan": "Test",
            "code": "pass",
            "term_out": "",
            "analysis": "",
            "metric": None,
            "is_buggy": False,
            "plots": [],
            "commit_hash": None
        }
        node = Node.from_dict(d)

        assert node.id == "node-test"
        assert node.plan == "Test"


# =============================================================================
# Integration Tests
# =============================================================================

class TestIntegration:
    """Integration tests for complete workflows."""

    def test_full_workflow(self, temp_dir):
        """Test a complete research workflow."""
        project_path = temp_dir / "research"
        project_path.mkdir()

        # Initialize
        project = Project(project_path)
        project.init_project()

        # Set up project
        project.set_hypothesis("Test hypothesis")
        project.set_variables(["x"], ["y"], ["seed"])
        project.set_resource_budget(10, "1h")

        # Start stage 0
        project.start_stage(0)

        # Add some nodes
        root = project.add_node(None, "Root experiment", "x = 1")
        project.mark_success(root.id, {"value": 0.5, "name": "y", "maximize": True}, "Baseline")

        child1 = project.add_node(root.id, "Try x=2", "x = 2")
        project.mark_success(child1.id, {"value": 0.7, "name": "y", "maximize": True}, "Better")

        child2 = project.add_node(root.id, "Try x=0", "x = 0")
        project.mark_buggy(child2.id, "Invalid value")

        # Check best nodes
        best = project.get_best_nodes(1)
        assert best[0].id == child1.id

        # Complete stage and move to next
        project.complete_stage("success")
        project.start_stage(1)

        # Verify stage history
        history = project.get_stage_history()
        assert len(history) == 2
        assert history[0]["stage"] == 0
        assert history[0]["outcome"] == "success"
        assert history[1]["stage"] == 1
