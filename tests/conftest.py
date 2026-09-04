import sys
from pathlib import Path

# Tools are scripts, not a package: they import siblings by bare name because
# Python puts the script's own directory on sys.path. Tests import them the
# same way.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))
