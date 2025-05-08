#!/bin/bash
# Test GitHub Actions workflow locally using 'act'
# Requires 'act' to be installed (https://github.com/nektos/act)
# Install with: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

echo "Testing GitHub Actions workflow locally..."
act -j node18 --container-architecture linux/amd64

# Check the exit code to see if the workflow succeeded
if [ $? -eq 0 ]; then
  echo "✅ Workflow test passed!"
else
  echo "❌ Workflow test failed!"
  exit 1
fi 