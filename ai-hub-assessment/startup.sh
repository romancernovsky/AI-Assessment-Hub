#!/bin/bash

echo "=== AI Hub Assessment — Azure Startup ==="
echo "$(date): Starting initialization..."

cd /home/site/wwwroot

# --- Undo Oryx node_modules symlink damage ---
# Oryx's startup wrapper extracts node_modules.tar.gz to /node_modules,
# moves our ./node_modules to _del_node_modules, and symlinks ./node_modules -> /node_modules.
# This breaks our standalone build that has Prisma engines.
# Restore our original node_modules if Oryx moved them.
if [ -L node_modules ] && [ -d _del_node_modules ]; then
    echo "$(date): Oryx symlink detected — restoring original node_modules..."
    rm -f node_modules
    mv _del_node_modules node_modules
    echo "$(date): node_modules restored."
fi

# --- Start the application ---
echo "$(date): Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
