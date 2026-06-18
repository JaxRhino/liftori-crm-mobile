#!/usr/bin/env python3
"""Static verify: every @/ import resolves and every named import is exported.
Run from repo root:  python3 verify_imports.py
This is the sandbox-friendly bar (Metro transpiles without typechecking)."""
import os, re, glob, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def resolve(spec: str) -> bool:
    p = spec[2:]
    if any(os.path.exists(p + e) for e in (".ts", ".tsx", ".js", ".jsx")):
        return True
    return any(os.path.exists(os.path.join(p, "index" + e)) for e in (".ts", ".tsx"))


def exports(spec: str):
    p = spec[2:]
    for e in (".ts", ".tsx"):
        if os.path.exists(p + e):
            p = p + e
            break
    else:
        return None
    t = open(p, encoding="utf-8").read()
    names = set(re.findall(
        r"export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_]+)", t))
    for m in re.findall(r"export\s*\{([^}]*)\}", t):
        for part in m.split(","):
            part = part.strip().split(" as ")[0].strip()
            if part:
                names.add(part)
    return names


def main() -> int:
    files = (glob.glob("app/**/*.tsx", recursive=True)
             + glob.glob("lib/**/*.ts*", recursive=True)
             + glob.glob("components/**/*.tsx", recursive=True))
    missing = mismatch = total = 0
    for f in files:
        t = open(f, encoding="utf-8").read()
        for m in re.findall(r'from\s+"(@/[^"]+)"', t):
            total += 1
            if not resolve(m):
                print(f"MISSING IMPORT {m}  <- {f}")
                missing += 1
        for members, spec in re.findall(
                r'import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"(@/[^"]+)"', t):
            exp = exports(spec)
            if exp is None:
                continue
            for mem in members.split(","):
                name = mem.strip().replace("type ", "").split(" as ")[0].strip()
                if name and name not in exp:
                    print(f"NOT EXPORTED {name} from {spec}  <- {f}  (check OneDrive sync lag first)")
                    mismatch += 1
    print(f"\nfiles={len(files)} @/imports={total} missing={missing} export-mismatch={mismatch}")
    return 1 if (missing or mismatch) else 0


if __name__ == "__main__":
    sys.exit(main())
