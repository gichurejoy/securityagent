import os
import sys

# This adds your backend folder to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# This bridge allows FastAPI to run on HostAfrica's Passenger server
from a2wsgi import ASGIMiddleware
from main import app

application = ASGIMiddleware(app)
