[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$script = Join-Path $root "workboard\scripts\start.ps1"

Start-Process -FilePath "powershell.exe" `
  -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $script
  ) `
  -WorkingDirectory $root `
  -WindowStyle Hidden | Out-Null

Write-Output "Workboard start en arriere-plan sur le port configure."
