#!/usr/bin/env python3
"""Create an scrypt password verifier for the region editor.

Passwords are accepted from an interactive prompt or standard input, never a
command-line argument that would be exposed in shell history or process lists.
"""

from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

from server import create_auth_file


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path, help="new secret JSON path")
    parser.add_argument("--username", default="admin", help="editor account name")
    parser.add_argument(
        "--password-stdin",
        action="store_true",
        help="read one password line from standard input instead of prompting",
    )
    args = parser.parse_args()

    if args.password_stdin:
        password = sys.stdin.readline().rstrip("\r\n")
    else:
        password = getpass.getpass("Password (14+ characters): ")
        confirmation = getpass.getpass("Confirm password: ")
        if password != confirmation:
            parser.error("passwords do not match")
    try:
        create_auth_file(args.output.resolve(), args.username, password)
    except (FileExistsError, ValueError) as error:
        parser.error(str(error))
    print(f"Created {args.output.resolve()}")


if __name__ == "__main__":
    main()
