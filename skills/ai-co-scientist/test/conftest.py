"""
Pytest configuration for AI Co-Scientist tests.
"""

import sys
from pathlib import Path

# Add scripts directory to path for all tests
scripts_dir = Path(__file__).parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))
