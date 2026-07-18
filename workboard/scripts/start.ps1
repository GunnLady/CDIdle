[CmdletBinding()]
param(
  [int]$Port = 0,
  [switch]$Open
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\")).Path
$config = Get-Content -Raw -LiteralPath (Join-Path $root "workboard\config.json") | ConvertFrom-Json
$projectId = [string]$config.projectId
$preferredPort = if ($Port -gt 0) { $Port } else { [int]$config.preferredPort }
$rangeStart = [int]$config.portRange.start
$rangeEnd = [int]$config.portRange.end

function Get-Url([int]$CandidatePort, [string]$Path) { return "http://127.0.0.1:$CandidatePort$Path" }
function Get-Health([int]$CandidatePort) {
  try { return Invoke-RestMethod -Uri (Get-Url $CandidatePort "/health") -UseBasicParsing -TimeoutSec 2 }
  catch { return $null }
}
function Test-PortFree([int]$CandidatePort) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try { $task = $client.ConnectAsync("127.0.0.1", $CandidatePort); return -not ($task.Wait(200) -and $client.Connected) }
  catch { return $true } finally { $client.Dispose() }
}

function Test-Workboard([int]$CandidatePort) {
  $healthResponse = Get-Health $CandidatePort
  if ($null -eq $healthResponse -or $healthResponse.ok -ne $true -or $healthResponse.projectId -ne $projectId) { return $false }
  try {
    $pageResponse = Invoke-WebRequest -Uri (Get-Url $CandidatePort "/") -UseBasicParsing -TimeoutSec 2
    return $pageResponse.StatusCode -eq 200 -and `
      $pageResponse.Content -match '<title>CDIdle Workboard</title>'
  } catch {
    return $false
  }
}

$selectedPort = $preferredPort
if (Test-Workboard $selectedPort) {
  $url = Get-Url $selectedPort "/"
  Write-Host "Workboard deja actif sur $url"
  if ($Open) { Start-Process "chrome.exe" $url }
  Write-Output $url
  exit 0
}

if (-not (Test-PortFree $selectedPort)) {
  $selectedPort = 0
  for ($candidate = $rangeStart; $candidate -le $rangeEnd; $candidate += 1) {
    if (Test-PortFree $candidate) { $selectedPort = $candidate; break }
  }
  if ($selectedPort -eq 0) { throw "Aucun port libre dans la plage $rangeStart-$rangeEnd." }
}

$url = Get-Url $selectedPort "/"
$node = (Get-Command node.exe -ErrorAction Stop).Source
Start-Process -FilePath $node `
  -ArgumentList "workboard/server/server.mjs", $selectedPort `
  -WorkingDirectory $root `
  -WindowStyle Hidden | Out-Null

$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
  Start-Sleep -Milliseconds 250
  if (Test-Workboard $selectedPort) {
    $ready = $true
    break
  }
}
if (-not $ready) {
  throw "Le serveur Workboard n'a pas repondu sur $url. Verifiez le port et Node.js."
}
Write-Host "Workboard demarre sur $url"

if ($Open) {
  Start-Process "chrome.exe" $url
}

Write-Output $url
