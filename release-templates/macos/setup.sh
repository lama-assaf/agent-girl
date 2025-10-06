#!/bin/bash

echo "Agent Girl - macOS Setup"
echo "========================"
echo ""

# Remove quarantine attribute
echo "Removing quarantine attribute..."
xattr -d com.apple.quarantine ./agent-girl 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Quarantine attribute removed"
else
    echo "✓ No quarantine attribute found (this is fine)"
fi

# Make executable
echo "Making executable..."
chmod +x ./agent-girl

if [ $? -eq 0 ]; then
    echo "✓ File is now executable"
else
    echo "✗ Failed to make file executable"
    exit 1
fi

echo ""
echo "Setup complete! Run Agent Girl with:"
echo "  ./agent-girl"
echo ""
