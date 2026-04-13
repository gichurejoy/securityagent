import os
import sys
import traceback

# Add backend folder to sys.path
sys.path.insert(0, os.path.dirname(__file__))

# Log file path
LOG_FILE = os.path.join(os.path.dirname(__file__), "passenger.log")

try:
    from a2wsgi import ASGIMiddleware
    from main import app
    application = ASGIMiddleware(app)
except Exception:
    # Capture the full error
    error_msg = traceback.format_exc()
    
    # Write to local file
    with open(LOG_FILE, "a") as f:
        f.write(f"\n--- CRASH RECORDED ---\n{error_msg}")
    
    # Also show in browser for easy viewing during debug
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        error_display = f"BACKEND CRASHED!\nError saved to: {LOG_FILE}\n\n{error_msg}"
        return [error_display.encode()]
