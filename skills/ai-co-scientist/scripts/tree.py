#!/usr/bin/env python3
"""
Tree management script for AI Co-Scientist.

Manages project state, stage progression, and experiment trees for
systematic hypothesis exploration following the scientific method.
"""

import argparse
import json
import os
import subprocess
import sys
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


# =============================================================================
# Data Structures
# =============================================================================

@dataclass
class Node:
    """A single experiment node in the tree."""
    id: str
    parent_id: Optional[str]
    children: List[str]
    step: int
    stage: int
    plan: str
    code: str
    term_out: str
    analysis: str
    metric: Optional[Dict[str, Any]]  # {"value": float, "name": str, "maximize": bool}
    is_buggy: bool
    plots: List[str]
    commit_hash: Optional[str]

    @classmethod
    def create(cls, parent_id: Optional[str], step: int, stage: int, plan: str, code: str) -> 'Node':
        """Create a new node with a generated UUID."""
        return cls(
            id=f"node-{uuid.uuid4().hex[:8]}",
            parent_id=parent_id,
            children=[],
            step=step,
            stage=stage,
            plan=plan,
            code=code,
            term_out="",
            analysis="",
            metric=None,
            is_buggy=False,
            plots=[],
            commit_hash=None
        )

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> 'Node':
        return cls(**data)


@dataclass
class StageTree:
    """Tree for a single stage (each stage has its own tree)."""
    stage: int
    iteration: int
    nodes: Dict[str, Node]
    root_ids: List[str]
    created_at: str
    completed_at: Optional[str]
    outcome: Optional[str]  # "success", "loop_back", "exhausted"

    @classmethod
    def create(cls, stage: int, iteration: int) -> 'StageTree':
        return cls(
            stage=stage,
            iteration=iteration,
            nodes={},
            root_ids=[],
            created_at=datetime.now().isoformat(),
            completed_at=None,
            outcome=None
        )

    def to_dict(self) -> dict:
        return {
            "stage": self.stage,
            "iteration": self.iteration,
            "nodes": {k: v.to_dict() for k, v in self.nodes.items()},
            "root_ids": self.root_ids,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "outcome": self.outcome
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'StageTree':
        nodes = {k: Node.from_dict(v) for k, v in data.get("nodes", {}).items()}
        return cls(
            stage=data["stage"],
            iteration=data["iteration"],
            nodes=nodes,
            root_ids=data.get("root_ids", []),
            created_at=data["created_at"],
            completed_at=data.get("completed_at"),
            outcome=data.get("outcome")
        )


@dataclass
class StageHistoryEntry:
    """A single entry in the stage history."""
    stage: int
    iteration: int
    tree_file: str
    started: str
    completed: Optional[str]
    outcome: Optional[str]
    loop_reason: Optional[str] = None

    def to_dict(self) -> dict:
        d = {
            "stage": self.stage,
            "iteration": self.iteration,
            "tree_file": self.tree_file,
            "started": self.started,
            "completed": self.completed,
            "outcome": self.outcome
        }
        if self.loop_reason:
            d["loop_reason"] = self.loop_reason
        return d

    @classmethod
    def from_dict(cls, data: dict) -> 'StageHistoryEntry':
        return cls(
            stage=data["stage"],
            iteration=data["iteration"],
            tree_file=data.get("tree_file", ""),
            started=data.get("started", ""),
            completed=data.get("completed"),
            outcome=data.get("outcome"),
            loop_reason=data.get("loop_reason")
        )


@dataclass
class StageHistory:
    """Tracks progression through stages, including loops."""
    current_stage: int
    current_iteration: int
    entries: List[StageHistoryEntry]

    @classmethod
    def create(cls) -> 'StageHistory':
        return cls(
            current_stage=-1,  # Not started
            current_iteration=0,
            entries=[]
        )

    def to_dict(self) -> dict:
        return {
            "current_stage": self.current_stage,
            "current_iteration": self.current_iteration,
            "entries": [e.to_dict() for e in self.entries]
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'StageHistory':
        entries = [StageHistoryEntry.from_dict(e) for e in data.get("entries", [])]
        return cls(
            current_stage=data.get("current_stage", -1),
            current_iteration=data.get("current_iteration", 0),
            entries=entries
        )


@dataclass
class ProjectConfig:
    """Project configuration and metadata."""
    project_path: str
    hypothesis: Optional[str] = None
    variables: Optional[Dict[str, List[str]]] = None  # {independent: [], dependent: [], control: []}
    resource_budget: Optional[Dict[str, Any]] = None  # {max_iterations: int, max_time: str}

    def to_dict(self) -> dict:
        return {
            "project_path": self.project_path,
            "hypothesis": self.hypothesis,
            "variables": self.variables,
            "resource_budget": self.resource_budget
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'ProjectConfig':
        return cls(
            project_path=data["project_path"],
            hypothesis=data.get("hypothesis"),
            variables=data.get("variables"),
            resource_budget=data.get("resource_budget")
        )


# =============================================================================
# Project Class
# =============================================================================

class Project:
    """Top-level project management."""

    def __init__(self, project_path: str):
        self.project_path = Path(project_path).resolve()
        self.co_scientist_dir = self.project_path / ".co-scientist"
        self.trees_dir = self.co_scientist_dir / "trees"
        self.viz_dir = self.co_scientist_dir / "viz"

        self.config: Optional[ProjectConfig] = None
        self.stage_history: Optional[StageHistory] = None
        self.stage_trees: Dict[str, StageTree] = {}  # keyed by "stage_{N}_iter_{M}"

    def _tree_key(self, stage: int, iteration: int) -> str:
        return f"stage_{stage}_iter_{iteration}"

    def _tree_file(self, stage: int, iteration: int) -> Path:
        return self.trees_dir / f"{self._tree_key(stage, iteration)}.json"

    # -------------------------------------------------------------------------
    # Project Management
    # -------------------------------------------------------------------------

    def init_project(self) -> None:
        """Create .co-scientist/ directory structure and initial files."""
        # Create directories
        self.co_scientist_dir.mkdir(parents=True, exist_ok=True)
        self.trees_dir.mkdir(exist_ok=True)
        self.viz_dir.mkdir(exist_ok=True)

        # Create project.json
        self.config = ProjectConfig(project_path=str(self.project_path))
        self._save_config()

        # Create stage_history.json
        self.stage_history = StageHistory.create()
        self._save_stage_history()

        print(f"Initialized project at {self.project_path}")
        print(f"  - .co-scientist/ directory created")
        print(f"  - project.json created")
        print(f"  - stage_history.json created")

    def load_project(self) -> None:
        """Load project state from disk."""
        if not self.co_scientist_dir.exists():
            raise FileNotFoundError(f"No .co-scientist/ directory found at {self.project_path}")

        # Load project.json
        config_path = self.co_scientist_dir / "project.json"
        if config_path.exists():
            with open(config_path) as f:
                self.config = ProjectConfig.from_dict(json.load(f))
        else:
            raise FileNotFoundError(f"project.json not found at {config_path}")

        # Load stage_history.json
        history_path = self.co_scientist_dir / "stage_history.json"
        if history_path.exists():
            with open(history_path) as f:
                self.stage_history = StageHistory.from_dict(json.load(f))
        else:
            self.stage_history = StageHistory.create()

        # Load all tree files
        self.stage_trees = {}
        for tree_file in self.trees_dir.glob("stage_*.json"):
            with open(tree_file) as f:
                tree_data = json.load(f)
                tree = StageTree.from_dict(tree_data)
                key = self._tree_key(tree.stage, tree.iteration)
                self.stage_trees[key] = tree

    def save_project(self) -> None:
        """Persist all state to disk."""
        self._save_config()
        self._save_stage_history()
        self._save_all_trees()

    def _save_config(self) -> None:
        config_path = self.co_scientist_dir / "project.json"
        with open(config_path, 'w') as f:
            json.dump(self.config.to_dict(), f, indent=2)

    def _save_stage_history(self) -> None:
        history_path = self.co_scientist_dir / "stage_history.json"
        with open(history_path, 'w') as f:
            json.dump(self.stage_history.to_dict(), f, indent=2)

    def _save_all_trees(self) -> None:
        for key, tree in self.stage_trees.items():
            tree_path = self.trees_dir / f"{key}.json"
            with open(tree_path, 'w') as f:
                json.dump(tree.to_dict(), f, indent=2)

    def _save_current_tree(self) -> None:
        """Save just the current stage tree."""
        if self.stage_history.current_stage < 0:
            return
        key = self._tree_key(self.stage_history.current_stage, self.stage_history.current_iteration)
        if key in self.stage_trees:
            tree_path = self.trees_dir / f"{key}.json"
            with open(tree_path, 'w') as f:
                json.dump(self.stage_trees[key].to_dict(), f, indent=2)

    # -------------------------------------------------------------------------
    # Stage Management
    # -------------------------------------------------------------------------

    def start_stage(self, stage_num: int) -> StageTree:
        """Create new StageTree for stage, add entry to history."""
        # Determine iteration number
        iterations_for_stage = [e for e in self.stage_history.entries if e.stage == stage_num]
        iteration = len(iterations_for_stage) + 1

        # Create new tree
        tree = StageTree.create(stage_num, iteration)
        key = self._tree_key(stage_num, iteration)
        self.stage_trees[key] = tree

        # Add history entry
        entry = StageHistoryEntry(
            stage=stage_num,
            iteration=iteration,
            tree_file=f"{key}.json",
            started=datetime.now().isoformat(),
            completed=None,
            outcome=None
        )
        self.stage_history.entries.append(entry)
        self.stage_history.current_stage = stage_num
        self.stage_history.current_iteration = iteration

        # Save
        self._save_stage_history()
        self._save_current_tree()

        print(f"Started Stage {stage_num}, Iteration {iteration}")
        return tree

    def complete_stage(self, outcome: str) -> None:
        """Mark current stage complete, record outcome."""
        if self.stage_history.current_stage < 0:
            raise ValueError("No stage is currently active")

        key = self._tree_key(self.stage_history.current_stage, self.stage_history.current_iteration)
        tree = self.stage_trees.get(key)
        if tree:
            tree.completed_at = datetime.now().isoformat()
            tree.outcome = outcome

        # Update history entry
        for entry in reversed(self.stage_history.entries):
            if entry.stage == self.stage_history.current_stage and entry.iteration == self.stage_history.current_iteration:
                entry.completed = datetime.now().isoformat()
                entry.outcome = outcome
                break

        self.save_project()
        print(f"Completed Stage {self.stage_history.current_stage} with outcome: {outcome}")

    def loop_back(self, to_stage: int, reason: str) -> StageTree:
        """Record loop in history, start new iteration of target stage."""
        # Mark current stage as loop_back
        self.complete_stage("loop_back")

        # Update the entry with loop reason
        for entry in reversed(self.stage_history.entries):
            if entry.outcome == "loop_back":
                entry.loop_reason = reason
                break

        # Start new iteration of target stage
        print(f"Looping back to Stage {to_stage}: {reason}")
        return self.start_stage(to_stage)

    def get_current_stage(self) -> tuple:
        """Return current stage number and iteration."""
        return (self.stage_history.current_stage, self.stage_history.current_iteration)

    def get_stage_history(self) -> List[dict]:
        """Return full history of stage transitions."""
        return [e.to_dict() for e in self.stage_history.entries]

    def get_current_tree(self) -> Optional[StageTree]:
        """Get the current stage tree."""
        if self.stage_history.current_stage < 0:
            return None
        key = self._tree_key(self.stage_history.current_stage, self.stage_history.current_iteration)
        return self.stage_trees.get(key)

    # -------------------------------------------------------------------------
    # Tree Operations (within current stage)
    # -------------------------------------------------------------------------

    def add_node(self, parent_id: Optional[str], plan: str, code: str) -> Node:
        """Add node to current stage tree, return node."""
        tree = self.get_current_tree()
        if tree is None:
            raise ValueError("No active stage. Call start_stage first.")

        # Determine step number
        step = len(tree.nodes) + 1

        # Create node
        node = Node.create(parent_id, step, tree.stage, plan, code)

        # Add to tree
        tree.nodes[node.id] = node

        # Update parent's children list
        if parent_id:
            if parent_id not in tree.nodes:
                raise ValueError(f"Parent node {parent_id} not found")
            tree.nodes[parent_id].children.append(node.id)
        else:
            tree.root_ids.append(node.id)

        self._save_current_tree()
        print(f"Added node {node.id} (step {step})")
        return node

    def execute_node(self, node_id: str, timeout: int = 300) -> str:
        """Run code, capture output, update node."""
        tree = self.get_current_tree()
        if tree is None or node_id not in tree.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = tree.nodes[node_id]

        # Write code to temp file and execute
        temp_code_path = self.co_scientist_dir / f"temp_exec_{node_id}.py"
        with open(temp_code_path, 'w') as f:
            f.write(node.code)

        try:
            result = subprocess.run(
                [sys.executable, str(temp_code_path)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.project_path)
            )
            output = result.stdout
            if result.stderr:
                output += f"\nSTDERR:\n{result.stderr}"
            if result.returncode != 0:
                output += f"\nReturn code: {result.returncode}"
        except subprocess.TimeoutExpired:
            output = f"Execution timed out after {timeout} seconds"
        except Exception as e:
            output = f"Execution error: {str(e)}"
        finally:
            if temp_code_path.exists():
                temp_code_path.unlink()

        node.term_out = output
        self._save_current_tree()
        return output

    def mark_buggy(self, node_id: str, error: str) -> None:
        """Mark node as failed."""
        tree = self.get_current_tree()
        if tree is None or node_id not in tree.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = tree.nodes[node_id]
        node.is_buggy = True
        node.analysis = f"FAILED: {error}"
        self._save_current_tree()
        print(f"Marked node {node_id} as buggy")

    def mark_success(self, node_id: str, metrics: Optional[dict], analysis: str) -> None:
        """Mark success with optional metrics and analysis."""
        tree = self.get_current_tree()
        if tree is None or node_id not in tree.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = tree.nodes[node_id]
        node.is_buggy = False
        node.metric = metrics
        node.analysis = analysis
        self._save_current_tree()
        print(f"Marked node {node_id} as success")

    def update_node(self, node_id: str, status: Optional[str] = None,
                    metrics: Optional[dict] = None, analysis: Optional[str] = None,
                    plots: Optional[List[str]] = None) -> None:
        """Update node with various fields."""
        tree = self.get_current_tree()
        if tree is None or node_id not in tree.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = tree.nodes[node_id]

        if status == "success":
            node.is_buggy = False
        elif status == "buggy":
            node.is_buggy = True

        if metrics is not None:
            node.metric = metrics
        if analysis is not None:
            node.analysis = analysis
        if plots is not None:
            node.plots = plots

        self._save_current_tree()
        print(f"Updated node {node_id}")

    def get_best_nodes(self, top_k: int = 3) -> List[Node]:
        """Return top nodes in current stage by metric."""
        tree = self.get_current_tree()
        if tree is None:
            return []

        # Filter nodes with metrics that aren't buggy
        nodes_with_metrics = [
            n for n in tree.nodes.values()
            if n.metric is not None and not n.is_buggy
        ]

        # Sort by metric value
        def sort_key(node):
            metric = node.metric
            value = metric.get("value", 0)
            maximize = metric.get("maximize", True)
            return value if maximize else -value

        sorted_nodes = sorted(nodes_with_metrics, key=sort_key, reverse=True)
        return sorted_nodes[:top_k]

    def get_next_candidates(self) -> List[Node]:
        """Best-first search candidates in current stage (non-buggy leaf nodes)."""
        tree = self.get_current_tree()
        if tree is None:
            return []

        # Find leaf nodes (no children) that aren't buggy
        candidates = []
        for node in tree.nodes.values():
            if not node.children and not node.is_buggy:
                candidates.append(node)

        # Sort by metric (best first)
        def sort_key(node):
            if node.metric is None:
                return float('-inf')
            value = node.metric.get("value", 0)
            maximize = node.metric.get("maximize", True)
            return value if maximize else -value

        return sorted(candidates, key=sort_key, reverse=True)

    def commit_node(self, node_id: str, message: Optional[str] = None) -> Optional[str]:
        """Git commit with node context."""
        tree = self.get_current_tree()
        if tree is None or node_id not in tree.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = tree.nodes[node_id]

        # Build commit message
        if message is None:
            message = f"[Co-Scientist] Stage {node.stage} Step {node.step}: {node.plan[:50]}"

        try:
            # Stage all changes
            subprocess.run(
                ["git", "add", "-A"],
                cwd=str(self.project_path),
                capture_output=True
            )

            # Commit
            result = subprocess.run(
                ["git", "commit", "-m", message],
                cwd=str(self.project_path),
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                # Get commit hash
                hash_result = subprocess.run(
                    ["git", "rev-parse", "HEAD"],
                    cwd=str(self.project_path),
                    capture_output=True,
                    text=True
                )
                commit_hash = hash_result.stdout.strip()[:7]
                node.commit_hash = commit_hash
                self._save_current_tree()
                print(f"Committed node {node_id} as {commit_hash}")
                return commit_hash
            else:
                print(f"Git commit failed: {result.stderr}")
                return None
        except Exception as e:
            print(f"Git error: {e}")
            return None

    def get_node(self, node_id: str) -> Optional[Node]:
        """Get a specific node by ID."""
        tree = self.get_current_tree()
        if tree is None:
            return None
        return tree.nodes.get(node_id)

    # -------------------------------------------------------------------------
    # Export/Visualization
    # -------------------------------------------------------------------------

    def export_all_trees(self) -> dict:
        """Export all stage trees for visualization."""
        return {
            "project_path": str(self.project_path),
            "hypothesis": self.config.hypothesis if self.config else None,
            "variables": self.config.variables if self.config else None,
            "stage_history": self.get_stage_history(),
            "trees": {k: v.to_dict() for k, v in self.stage_trees.items()}
        }

    def get_tree_for_stage(self, stage: int, iteration: int) -> Optional[StageTree]:
        """Get specific stage tree."""
        key = self._tree_key(stage, iteration)
        return self.stage_trees.get(key)

    def set_hypothesis(self, hypothesis: str) -> None:
        """Set the project hypothesis."""
        if self.config:
            self.config.hypothesis = hypothesis
            self._save_config()
            print(f"Set hypothesis: {hypothesis}")

    def set_variables(self, independent: List[str], dependent: List[str], control: List[str]) -> None:
        """Set the project variables."""
        if self.config:
            self.config.variables = {
                "independent": independent,
                "dependent": dependent,
                "control": control
            }
            self._save_config()
            print("Set variables")

    def set_resource_budget(self, max_iterations: int, max_time: str) -> None:
        """Set the resource budget."""
        if self.config:
            self.config.resource_budget = {
                "max_iterations": max_iterations,
                "max_time": max_time
            }
            self._save_config()
            print(f"Set resource budget: {max_iterations} iterations, {max_time}")


# =============================================================================
# CLI Interface
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Co-Scientist Tree Management")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # init
    init_parser = subparsers.add_parser("init", help="Initialize a new project")
    init_parser.add_argument("project_path", help="Path to project directory")

    # load
    load_parser = subparsers.add_parser("load", help="Load an existing project")
    load_parser.add_argument("project_path", help="Path to project directory")

    # start-stage
    start_parser = subparsers.add_parser("start-stage", help="Start a new stage")
    start_parser.add_argument("project_path", help="Path to project directory")
    start_parser.add_argument("stage_num", type=int, help="Stage number (0-4)")

    # complete-stage
    complete_parser = subparsers.add_parser("complete-stage", help="Complete current stage")
    complete_parser.add_argument("project_path", help="Path to project directory")
    complete_parser.add_argument("outcome", help="Outcome: success, exhausted")

    # loop-back
    loop_parser = subparsers.add_parser("loop-back", help="Loop back to earlier stage")
    loop_parser.add_argument("project_path", help="Path to project directory")
    loop_parser.add_argument("target_stage", type=int, help="Stage to loop back to")
    loop_parser.add_argument("reason", help="Reason for looping back")

    # add-node
    add_parser = subparsers.add_parser("add-node", help="Add a node to current stage tree")
    add_parser.add_argument("project_path", help="Path to project directory")
    add_parser.add_argument("--parent", "-p", dest="parent_id", help="Parent node ID (omit for root)")
    add_parser.add_argument("plan", help="Natural language plan")
    add_parser.add_argument("code_file", help="Path to code file")

    # update
    update_parser = subparsers.add_parser("update", help="Update a node")
    update_parser.add_argument("project_path", help="Path to project directory")
    update_parser.add_argument("node_id", help="Node ID to update")
    update_parser.add_argument("--status", choices=["success", "buggy"], help="Node status")
    update_parser.add_argument("--metrics", help="JSON metrics object")
    update_parser.add_argument("--analysis", help="Analysis text")
    update_parser.add_argument("--plots", help="Comma-separated plot paths")

    # mark-buggy
    buggy_parser = subparsers.add_parser("mark-buggy", help="Mark a node as buggy")
    buggy_parser.add_argument("project_path", help="Path to project directory")
    buggy_parser.add_argument("node_id", help="Node ID")
    buggy_parser.add_argument("error", help="Error description")

    # execute
    exec_parser = subparsers.add_parser("execute", help="Execute a node's code")
    exec_parser.add_argument("project_path", help="Path to project directory")
    exec_parser.add_argument("node_id", help="Node ID to execute")
    exec_parser.add_argument("--timeout", type=int, default=300, help="Timeout in seconds")

    # commit
    commit_parser = subparsers.add_parser("commit", help="Git commit for a node")
    commit_parser.add_argument("project_path", help="Path to project directory")
    commit_parser.add_argument("node_id", help="Node ID")
    commit_parser.add_argument("--message", "-m", help="Custom commit message")

    # get-best
    best_parser = subparsers.add_parser("get-best", help="Get best nodes by metric")
    best_parser.add_argument("project_path", help="Path to project directory")
    best_parser.add_argument("--top", "-k", type=int, default=3, help="Number of nodes")

    # get-candidates
    cand_parser = subparsers.add_parser("get-candidates", help="Get next experiment candidates")
    cand_parser.add_argument("project_path", help="Path to project directory")

    # export-trees
    export_parser = subparsers.add_parser("export-trees", help="Export all trees as JSON")
    export_parser.add_argument("project_path", help="Path to project directory")

    # get-history
    history_parser = subparsers.add_parser("get-history", help="Get stage history")
    history_parser.add_argument("project_path", help="Path to project directory")

    # get-status
    status_parser = subparsers.add_parser("get-status", help="Get current status")
    status_parser.add_argument("project_path", help="Path to project directory")

    # set-hypothesis
    hyp_parser = subparsers.add_parser("set-hypothesis", help="Set project hypothesis")
    hyp_parser.add_argument("project_path", help="Path to project directory")
    hyp_parser.add_argument("hypothesis", help="Hypothesis text")

    # set-variables
    var_parser = subparsers.add_parser("set-variables", help="Set project variables")
    var_parser.add_argument("project_path", help="Path to project directory")
    var_parser.add_argument("--independent", "-i", nargs="+", required=True, help="Independent variables")
    var_parser.add_argument("--dependent", "-d", nargs="+", required=True, help="Dependent variables")
    var_parser.add_argument("--control", "-c", nargs="+", default=[], help="Control variables")

    # set-budget
    budget_parser = subparsers.add_parser("set-budget", help="Set resource budget")
    budget_parser.add_argument("project_path", help="Path to project directory")
    budget_parser.add_argument("--max-iterations", type=int, required=True, help="Max iterations")
    budget_parser.add_argument("--max-time", required=True, help="Max time (e.g., '2h')")

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        return

    # Execute command
    project = Project(args.project_path)

    if args.command == "init":
        project.init_project()

    elif args.command == "load":
        project.load_project()
        stage, iteration = project.get_current_stage()
        print(f"Loaded project from {args.project_path}")
        print(f"Current stage: {stage}, iteration: {iteration}")

    elif args.command == "start-stage":
        project.load_project()
        project.start_stage(args.stage_num)

    elif args.command == "complete-stage":
        project.load_project()
        project.complete_stage(args.outcome)

    elif args.command == "loop-back":
        project.load_project()
        project.loop_back(args.target_stage, args.reason)

    elif args.command == "add-node":
        project.load_project()
        with open(args.code_file) as f:
            code = f.read()
        node = project.add_node(args.parent_id, args.plan, code)
        print(json.dumps(node.to_dict(), indent=2))

    elif args.command == "update":
        project.load_project()
        metrics = json.loads(args.metrics) if args.metrics else None
        plots = args.plots.split(",") if args.plots else None
        project.update_node(args.node_id, args.status, metrics, args.analysis, plots)

    elif args.command == "mark-buggy":
        project.load_project()
        project.mark_buggy(args.node_id, args.error)

    elif args.command == "execute":
        project.load_project()
        output = project.execute_node(args.node_id, args.timeout)
        print(output)

    elif args.command == "commit":
        project.load_project()
        project.commit_node(args.node_id, args.message)

    elif args.command == "get-best":
        project.load_project()
        best = project.get_best_nodes(args.top)
        for node in best:
            print(f"{node.id}: {node.metric} - {node.plan[:50]}")

    elif args.command == "get-candidates":
        project.load_project()
        candidates = project.get_next_candidates()
        for node in candidates:
            metric_str = str(node.metric) if node.metric else "no metric"
            print(f"{node.id}: {metric_str} - {node.plan[:50]}")

    elif args.command == "export-trees":
        project.load_project()
        data = project.export_all_trees()
        print(json.dumps(data, indent=2))

    elif args.command == "get-history":
        project.load_project()
        history = project.get_stage_history()
        print(json.dumps(history, indent=2))

    elif args.command == "get-status":
        project.load_project()
        stage, iteration = project.get_current_stage()
        tree = project.get_current_tree()
        node_count = len(tree.nodes) if tree else 0
        print(f"Stage: {stage}")
        print(f"Iteration: {iteration}")
        print(f"Nodes in current tree: {node_count}")
        if project.config:
            print(f"Hypothesis: {project.config.hypothesis}")

    elif args.command == "set-hypothesis":
        project.load_project()
        project.set_hypothesis(args.hypothesis)

    elif args.command == "set-variables":
        project.load_project()
        project.set_variables(args.independent, args.dependent, args.control)

    elif args.command == "set-budget":
        project.load_project()
        project.set_resource_budget(args.max_iterations, args.max_time)


if __name__ == "__main__":
    main()
