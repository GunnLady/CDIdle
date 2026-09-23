[CmdletBinding()]
param(
    [string]$WorkDirectory = '.tmp/proportion-refactor-fixture-tests'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$checker = Join-Path $PSScriptRoot 'new-combat-idle-proportion-check.ps1'
$reviewer = Join-Path $PSScriptRoot 'new-combat-idle-anatomy-review.ps1'
$sourceCatalog = Join-Path $repoRoot 'assets/design/hero-sprites/combat-idle-proportion-references.json'
$work = if ([System.IO.Path]::IsPathRooted($WorkDirectory)) { $WorkDirectory } else { Join-Path $repoRoot $WorkDirectory }
if (-not (Test-Path -LiteralPath $work -PathType Container)) {
    New-Item -ItemType Directory -Path $work -Force | Out-Null
}

function New-FixtureCatalog {
    $catalog = Get-Content -LiteralPath $sourceCatalog -Raw | ConvertFrom-Json
    $entry = ($catalog.entries.'rogue-male-08-neutral' | ConvertTo-Json -Depth 12 | ConvertFrom-Json)
    $catalog.entries = [pscustomobject]@{ fixture = $entry }
    return $catalog
}

function Save-Catalog([pscustomobject]$Catalog, [string]$Name) {
    $path = Join-Path $work $Name
    $Catalog | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $path -Encoding utf8
    return $path
}

function Invoke-Fixture([string]$CatalogPath, [string]$Stem) {
    $parameters = @{
        ReferenceCatalogPath = $CatalogPath
        CandidateKey = 'fixture'
        NeutralKey = 'fixture'
        TemplateAKey = 'fixture'
        TemplateBKey = 'fixture'
        OutputPath = (Join-Path $work "$Stem.png")
    }
    return & $checker @parameters
}

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-Rejected([pscustomobject]$Catalog, [string]$Name, [string]$ExpectedText) {
    $catalogPath = Save-Catalog $Catalog "$Name-catalog.json"
    try {
        Invoke-Fixture $catalogPath $Name | Out-Null
        throw "Assertion failed: '$Name' was accepted."
    }
    catch {
        if ($_.Exception.Message -notlike "*$ExpectedText*") {
            throw "Assertion failed: '$Name' returned '$($_.Exception.Message)' instead of '*$ExpectedText*'."
        }
    }
}

$positive = New-FixtureCatalog
$positivePath = Save-Catalog $positive 'positive-catalog.json'
$result = Invoke-Fixture $positivePath 'positive'
$report = Get-Content -LiteralPath $result.ReportPath -Raw | ConvertFrom-Json
$rawReport = Get-Content -LiteralPath $result.ReportPath -Raw

Assert-True (($report.categories -join ',') -eq 'head,shoulders,torso,arms,hips,legs') 'the six anatomical categories must be present in order'
Assert-True ($report.measurements.Count -eq 4) 'the report must contain candidate, neutral and two templates'
$first = $report.measurements[0].categories | ConvertTo-Json -Depth 8 -Compress
foreach ($measurement in $report.measurements) {
    Assert-True (($measurement.categories | ConvertTo-Json -Depth 8 -Compress) -eq $first) 'identical fixture entries must return identical segment measurements'
}
Assert-True ($rawReport -notmatch '(?i)bodyheight|scaledbodyheight|pass\s*[:\"]|fail\s*[:\"]|tolerance') 'the report must contain no global-height or automatic-decision field'
Assert-True ($report.decisionPolicy -like '*cannot accept or reject*') 'the report must explicitly deny decision authority'

$pendingFace = New-FixtureCatalog
$pendingFace.entries.fixture.reviewStatus = 'pending'
Assert-Rejected $pendingFace 'pending-face' 'face frame is not reviewed'

$pendingAnatomy = New-FixtureCatalog
$pendingAnatomy.entries.fixture.anatomy.reviewStatus = 'pending'
Assert-Rejected $pendingAnatomy 'pending-anatomy' 'anatomical landmarks are not reviewed'

$changedHash = New-FixtureCatalog
$changedHash.entries.fixture.sha256 = ('0' * 64)
Assert-Rejected $changedHash 'changed-hash' 'changed after review'

$changedDimensions = New-FixtureCatalog
$changedDimensions.entries.fixture.imageSize[0] = 340
Assert-Rejected $changedDimensions 'changed-dimensions' 'dimensions changed after review'

$missingEvidence = New-FixtureCatalog
$missingEvidence.entries.fixture.anatomy.reviewEvidence = ''
Assert-Rejected $missingEvidence 'missing-evidence' 'has no anatomical review evidence'

$unexplainedMissing = New-FixtureCatalog
$unexplainedMissing.entries.fixture.anatomy.landmarks.leftWrist = $null
Assert-Rejected $unexplainedMissing 'unexplained-missing' 'gives no reason'

$explainedMissing = New-FixtureCatalog
$explainedMissing.entries.fixture.anatomy.landmarks.leftWrist = $null
$explainedMissing.entries.fixture.anatomy.notVerifiable | Add-Member -NotePropertyName leftWrist -NotePropertyValue 'hidden by the weapon'
$explainedPath = Save-Catalog $explainedMissing 'explained-missing-catalog.json'
$explainedResult = Invoke-Fixture $explainedPath 'explained-missing'
$explainedReport = Get-Content -LiteralPath $explainedResult.ReportPath -Raw | ConvertFrom-Json
Assert-True ($explainedReport.measurements[0].categories.Arms.LeftForearm -like 'NV:*') 'a justified hidden segment must be reported as NV'

$outsideBody = New-FixtureCatalog
$outsideBody.entries.fixture.anatomy.landmarks.leftWrist = @(0, 0)
Assert-Rejected $outsideBody 'outside-body' 'outside its reviewed body crop'

$incompleteReview = New-FixtureCatalog
$incompleteReview.entries.fixture.anatomy.landmarks.PSObject.Properties.Remove('leftWrist')
$incompleteReviewPath = Save-Catalog $incompleteReview 'incomplete-review-catalog.json'
try {
    & $reviewer -ReferenceCatalogPath $incompleteReviewPath -ReferenceKey 'fixture' -OutputPath (Join-Path $work 'incomplete-review.png') | Out-Null
    throw "Assertion failed: anatomy reviewer accepted a missing required landmark."
}
catch {
    if ($_.Exception.Message -notlike "*missing anatomical landmark 'leftWrist'*") {
        throw
    }
}

[pscustomobject]@{
    Status = 'OK'
    PositiveBoard = $result.OutputPath
    PositiveReport = $result.ReportPath
    Checks = @(
        'six categories',
        'identical inputs yield identical measurements',
        'no global-height or decision field',
        'pending face rejected',
        'pending anatomy rejected',
        'changed hash rejected',
        'changed dimensions rejected',
        'missing review evidence rejected',
        'unexplained missing landmark rejected',
        'explained missing landmark reported NV',
        'landmark outside reviewed body crop rejected',
        'anatomy review board rejects a missing required landmark'
    )
}
