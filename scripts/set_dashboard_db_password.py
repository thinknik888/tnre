#!/usr/bin/env python3
"""
Give the dashboard's database user a fresh random password.

    python3 scripts/set_dashboard_db_password.py

Run this yourself (it writes a secret, so it is deliberately not automated):
  1. generates a long random password -- it is never shown or saved to disk
  2. stores it in Netlify's private settings as DASH_SUPABASE_PASSWORD
  3. prints a one-way bcrypt HASH of it, to be applied to the Supabase user
  4. asks Netlify to redeploy so the functions pick up the new setting

The hash cannot be turned back into the password, so it is safe to share.
Your dashboard password (what you type at /dashboard) is not affected.
"""

import os
import secrets
import string
import subprocess
import sys

SITE_ID = "6968e7a0-e936-481c-8318-5b8c619018dd"   # condosaround.com on Netlify
HASH_FILE = os.path.expanduser("~/.condosaround-db-password-hash.txt")


def run(cmd):
    env = dict(os.environ, NETLIFY_SITE_ID=SITE_ID)
    return subprocess.run(cmd, capture_output=True, text=True, env=env)


def main():
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(44)) + "aA1!"

    hashed = run(["htpasswd", "-bnBC", "10", "", password]).stdout.strip().lstrip(":")
    hashed = hashed.replace("$2y$", "$2a$", 1)          # same algorithm, the prefix Supabase expects
    if not (hashed.startswith("$2a$10$") and len(hashed) == 60):
        sys.exit("Could not create the hash (is htpasswd available?)")

    result = run(["netlify", "env:set", "DASH_SUPABASE_PASSWORD", password, "--force"])
    if result.returncode != 0:
        sys.exit("Netlify refused the setting:\n" + (result.stderr or result.stdout).replace(password, "<hidden>"))
    print("1/3  New database password stored in Netlify's private settings.")

    with open(HASH_FILE, "w") as fh:
        fh.write(hashed + "\n")
    print("2/3  Hash saved to %s" % HASH_FILE)

    build = run(["netlify", "api", "createSiteBuild", "--data", '{"site_id": "%s"}' % SITE_ID])
    print("3/3  Redeploy %s." % ("requested" if build.returncode == 0 else "could NOT be requested -- tell Claude"))
    print("\nDone. Tell Claude it's finished; the last step (applying the hash to Supabase) happens next.")


if __name__ == "__main__":
    main()
