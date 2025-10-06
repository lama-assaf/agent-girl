#!/bin/bash

echo "Agent Girl - Linux Setup"
echo "========================"
echo ""

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
