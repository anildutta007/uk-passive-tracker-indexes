"""
Local HTTP Server for UK Passive Tracker Indexes & Top 5 Outperforming Funds Explorer
Runs on Python 3.8+ standard library with zero external dependencies.
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8075
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://127.0.0.1:{PORT}"
        print("======================================================================")
        print("  UK Passive Tracker Indexes & Top 5 Outperforming Funds (20-Yr Data) ")
        print(f"  Serving locally on: {url}")
        print("======================================================================\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    run()
