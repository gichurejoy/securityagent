import os
import sys
import traceback

# ── 1. Use the ACTUAL cPanel-managed virtualenv path ────────────────────────
VENV_BASE = '/home/medserva/virtualenv/domains/security.medservafrica.com/public_html/securityagent/backend/3.11'

lib_path = os.path.join(VENV_BASE, 'lib')
if os.path.exists(lib_path):
    for name in os.listdir(lib_path):
        if name.startswith('python'):
            site_packages = os.path.join(lib_path, name, 'site-packages')
            if site_packages not in sys.path:
                sys.path.insert(0, site_packages)
            break

# ── 2. Ensure backend dir is on the path ────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.chdir(BACKEND_DIR)

# ── 3. Load the app ──────────────────────────────────────────────────────────
try:
    from a2wsgi import ASGIMiddleware
    from main import app
    application = ASGIMiddleware(app)

except Exception:
    error_msg = traceback.format_exc()

    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        msg = (
            "=== PASSENGER BOOTSTRAP CRASH ===\n\n"
            f"{error_msg}\n\n"
            "=== sys.path at crash time ===\n"
            + "\n".join(sys.path)
        )
        return [msg.encode()]