@echo off
cd /d "%~dp0"
if exist application-local.properties (
  echo application-local.properties already exists. Edit it to add your Google/GitHub credentials.
) else (
  copy application-local.properties.example application-local.properties >nul
  echo Created application-local.properties. Open it and replace "optional" with your Google Client ID and Secret.
  echo Then restart the backend. Redirect URI in Google: http://localhost:8080/login/oauth2/code/google
)
pause
