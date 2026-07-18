[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
$statePath = Join-Path $root ".workboard.local.json"
$config = Get-Content -Raw -LiteralPath (Join-Path $root "workboard\config.json") | ConvertFrom-Json

if (-not (Test-Path -LiteralPath $statePath)) {
  Write-Host "Aucun etat local Workboard trouve; aucun processus arrete."
  exit 0
}

$state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
$health = $null
try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($state.port)/health" -UseBasicParsing -TimeoutSec 2 } catch {}
if ($null -eq $health -or $health.projectId -ne $config.projectId -or $health.instanceId -ne $state.instanceId) {
  throw "Arret refuse: l'identite du processus ne correspond pas a l'etat Workboard local."
}

$process = Get-Process -Id ([int]$state.pid) -ErrorAction SilentlyContinue
if ($null -eq $process) {
  Remove-Item -LiteralPath $statePath -Force
  Write-Host "Le processus n'existe plus; etat local nettoye."
  exit 0
}

Stop-Process -Id $process.Id
Remove-Item -LiteralPath $statePath -Force
Write-Host "Workboard arrete sur http://127.0.0.1:$($state.port)/"
