@echo off
REM Test GitHub Actions workflow locally using 'act'
REM Requires 'act' to be installed (https://github.com/nektos/act)
REM Install with: winget install nektos.act

echo Testing GitHub Actions workflow locally...
act -j node18 --container-architecture linux/amd64

REM Check the exit code to see if the workflow succeeded
if %ERRORLEVEL% EQU 0 (
  echo ✅ Workflow test passed!
) else (
  echo ❌ Workflow test failed!
  echo Error code: %ERRORLEVEL%
)

echo.
echo Press any key to close this window...
pause > nul 