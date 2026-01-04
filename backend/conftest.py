import sys
import os

# Ensure the backend folder is on sys.path for test imports
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(THIS_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
