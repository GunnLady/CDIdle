[CmdletBinding()]
param(
  [int]$Port = 4173,
  [switch]$Open
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\")).Path
$url = "http://127.0.0.1:$Port/"
$health = "http://127.0.0.1:$Port/health"

function Test-Workboard([string]$endpoint) {
  try {
    $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -match '"ok"\s*:\s*true'
  } catch {
    return $false
  }
}

if (-not (Test-Workboard $health)) {
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  Start-Process -FilePath $node `
    -ArgumentList "workboard/server/server.mjs", $Port `
    -WorkingDirectory $root `
    -WindowStyle Hidden | Out-Null

  $ready = $false
  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    if (Test-Workboard $health) {
      $ready = $true
      break
    }
  }
  if (-not $ready) {
    throw "Le serveur Workboard n'a pas repondu sur $url. Verifiez le port $Port et Node.js."
  }
  Write-Host "Workboard demarre sur $url"
} else {
  Write-Host "Workboard deja actif sur $url"
}

if ($Open) {
  Start-Process "chrome.exe" $url
}

Write-Output $url
