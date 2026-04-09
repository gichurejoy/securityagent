import os
import sys

# Add the application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import ASGIMiddleware
from main import app

# This is the entry point for Passenger
application = ASGIMiddleware(app)
