#!/usr/bin/env python3
"""
Visualization generator for AI Co-Scientist.

Generates an interactive HTML visualization of the experiment tree
using p5.js for rendering.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from string import Template

# Add parent directory to path to import tree module
sys.path.insert(0, str(Path(__file__).parent))
from tree import Project


def load_template(template_dir: Path) -> tuple:
    """Load HTML and JS templates."""
    html_path = template_dir / "template.html"
    js_path = template_dir / "template.js"

    if not html_path.exists():
        raise FileNotFoundError(f"Template HTML not found: {html_path}")
    if not js_path.exists():
        raise FileNotFoundError(f"Template JS not found: {js_path}")

    with open(html_path) as f:
        html_template = f.read()
    with open(js_path) as f:
        js_template = f.read()

    return html_template, js_template


def calculate_tree_layout(tree_data: dict) -> dict:
    """Calculate x,y positions for nodes using a simple tree layout algorithm."""
    nodes = tree_data.get("nodes", {})
    root_ids = tree_data.get("root_ids", [])

    if not nodes:
        return {}

    positions = {}
    node_width = 180
    node_height = 100
    level_height = 150
    horizontal_spacing = 200

    def get_subtree_width(node_id: str) -> int:
        """Calculate the width needed for a subtree."""
        node = nodes.get(node_id)
        if not node:
            return node_width

        children = node.get("children", [])
        if not children:
            return node_width

        total_width = sum(get_subtree_width(c) for c in children)
        total_width += horizontal_spacing * (len(children) - 1)
        return max(node_width, total_width)

    def layout_subtree(node_id: str, x: float, y: float, available_width: float) -> None:
        """Recursively layout a subtree."""
        node = nodes.get(node_id)
        if not node:
            return

        # Position this node at center of available width
        positions[node_id] = {"x": x + available_width / 2, "y": y}

        children = node.get("children", [])
        if not children:
            return

        # Calculate widths for each child subtree
        child_widths = [get_subtree_width(c) for c in children]
        total_child_width = sum(child_widths) + horizontal_spacing * (len(children) - 1)

        # Start position for first child
        child_x = x + (available_width - total_child_width) / 2

        for i, child_id in enumerate(children):
            layout_subtree(child_id, child_x, y + level_height, child_widths[i])
            child_x += child_widths[i] + horizontal_spacing

    # Layout each root tree
    total_width = sum(get_subtree_width(r) for r in root_ids)
    total_width += horizontal_spacing * max(0, len(root_ids) - 1)

    current_x = 50  # Left margin
    for root_id in root_ids:
        root_width = get_subtree_width(root_id)
        layout_subtree(root_id, current_x, 50, root_width)
        current_x += root_width + horizontal_spacing

    return positions


def generate_visualization(project_path: str, output_path: str = None) -> str:
    """Generate HTML visualization for a project."""
    project = Project(project_path)
    project.load_project()

    # Get all tree data
    export_data = project.export_all_trees()

    # Calculate layouts for each tree
    layouts = {}
    for tree_key, tree_data in export_data.get("trees", {}).items():
        layouts[tree_key] = calculate_tree_layout(tree_data)

    # Add layouts to export data
    export_data["layouts"] = layouts

    # Determine output path
    if output_path is None:
        output_path = project.viz_dir / "index.html"
    else:
        output_path = Path(output_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Load templates
    template_dir = Path(__file__).parent.parent / "assets" / "viz-template"
    html_template, js_template = load_template(template_dir)

    # Inject data into JS
    js_content = js_template.replace(
        "// TREE_DATA_PLACEHOLDER",
        f"const TREE_DATA = {json.dumps(export_data, indent=2)};"
    )

    # Inject JS into HTML
    html_content = html_template.replace(
        "// SCRIPT_PLACEHOLDER",
        js_content
    )

    # Write output
    with open(output_path, 'w') as f:
        f.write(html_content)

    print(f"Visualization generated: {output_path}")
    return str(output_path)


def generate_empty_visualization(project_path: str, output_path: str = None) -> str:
    """Generate an empty visualization for a new project."""
    project = Project(project_path)

    # Create minimal export data
    export_data = {
        "project_path": str(project.project_path),
        "hypothesis": None,
        "variables": None,
        "stage_history": [],
        "trees": {},
        "layouts": {}
    }

    # Determine output path
    if output_path is None:
        output_path = project.viz_dir / "index.html"
    else:
        output_path = Path(output_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Load templates
    template_dir = Path(__file__).parent.parent / "assets" / "viz-template"
    html_template, js_template = load_template(template_dir)

    # Inject data into JS
    js_content = js_template.replace(
        "// TREE_DATA_PLACEHOLDER",
        f"const TREE_DATA = {json.dumps(export_data, indent=2)};"
    )

    # Inject JS into HTML
    html_content = html_template.replace(
        "// SCRIPT_PLACEHOLDER",
        js_content
    )

    # Write output
    with open(output_path, 'w') as f:
        f.write(html_content)

    print(f"Empty visualization generated: {output_path}")
    return str(output_path)


def main():
    parser = argparse.ArgumentParser(description="Generate AI Co-Scientist visualization")
    parser.add_argument("project_path", help="Path to project directory")
    parser.add_argument("--output", "-o", help="Output HTML path (default: .co-scientist/viz/index.html)")
    parser.add_argument("--empty", action="store_true", help="Generate empty visualization")

    args = parser.parse_args()

    if args.empty:
        generate_empty_visualization(args.project_path, args.output)
    else:
        generate_visualization(args.project_path, args.output)


if __name__ == "__main__":
    main()
