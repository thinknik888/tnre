#!/usr/bin/env python3
"""Minimal static server for local preview: python3 scripts/serve.py [port]

Serves the repo root with the right Content-Type for .avif and .webp, which the
stdlib's default map does not cover.
"""
import functools
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8787


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".avif": "image/avif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        # Local preview only: never cache, so an edit is always what you see.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            sys.stderr.write("404 %s\n" % (args[0] if args else ""))


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    print("serving %s on http://localhost:%d" % (ROOT, PORT), flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), handler).serve_forever()
