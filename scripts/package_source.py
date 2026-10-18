"""Package public application source; explicit allowlist excludes private/runtime files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
folders = ['src', 'vendor', 'data', 'tests', 'assets', 'backend', 'deploy', 'docs']
files = ['Dockerfile', '.dockerignore', 'index.html', 'server.mjs', 'package.json', 'README.md', 'SOURCES.md', 'LICENSE', 'start.command', 'scripts/package_source.py', 'scripts/import_catalog.py']
with ZipFile(root / 'source.zip', 'w', ZIP_DEFLATED) as z:
    for name in files:
        z.write(root / name, name)
    for folder in folders:
        for file in sorted((root / folder).rglob('*')):
            if file.is_file() and not any(p.startswith('.') or p == '__pycache__' for p in file.relative_to(root).parts):
                z.write(file, file.relative_to(root))
print('source.zip created')
