[CmdletBinding()]
param(
    [string]$ReferenceCatalogPath = 'assets/design/hero-sprites/combat-idle-proportion-references.json',
    [Parameter(Mandatory = $true)] [string]$CandidateKey,
    [Parameter(Mandatory = $true)] [string]$NeutralKey,
    [Parameter(Mandatory = $true)] [string]$TemplateAKey,
    [Parameter(Mandatory = $true)] [string]$TemplateBKey,
    [Parameter(Mandatory = $true)] [string]$OutputPath,
    [string]$CandidateLabel = '',
    [string]$NeutralLabel = '',
    [string]$TemplateALabel = '',
    [string]$TemplateBLabel = '',
    [ValidateRange(16, 512)] [int]$TargetFaceDiameter = 72,
    [ValidateRange(300, 2000)] [int]$PanelWidth = 560
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$requiredLandmarks = @(
    'headTop', 'chin',
    'leftShoulder', 'rightShoulder',
    'leftElbow', 'rightElbow',
    'leftWrist', 'rightWrist',
    'leftHip', 'rightHip',
    'leftKnee', 'rightKnee',
    'leftAnkle', 'rightAnkle'
)

function Resolve-RepoFile([string]$Path, [string]$Description) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $repoRoot $Path }
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "$Description not found: $resolved"
    }
    return (Resolve-Path -LiteralPath $resolved).Path
}

function Resolve-OutputFile([string]$Path) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $repoRoot $Path }
    $parent = Split-Path -Parent $resolved
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    return [System.IO.Path]::GetFullPath($resolved)
}

function Convert-ToRectangle([object[]]$Values) {
    return [System.Drawing.Rectangle]::new(
        [int]$Values[0], [int]$Values[1], [int]$Values[2], [int]$Values[3]
    )
}

function Assert-RectangleInsideImage(
    [System.Drawing.Rectangle]$Rectangle,
    [System.Drawing.Image]$Image,
    [string]$Name
) {
    if ($Rectangle.X -lt 0 -or $Rectangle.Y -lt 0 -or
        $Rectangle.Width -le 0 -or $Rectangle.Height -le 0 -or
        $Rectangle.Right -gt $Image.Width -or $Rectangle.Bottom -gt $Image.Height) {
        throw "$Name rectangle $Rectangle exceeds image $($Image.Width)x$($Image.Height)."
    }
}

function Get-OptionalReason([pscustomobject]$Entry, [string]$LandmarkName) {
    if ($null -eq $Entry.anatomy.notVerifiable) { return $null }
    $property = $Entry.anatomy.notVerifiable.PSObject.Properties[$LandmarkName]
    if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value)) { return $null }
    return [string]$property.Value
}

function Get-Landmark([pscustomobject]$Entry, [string]$EntryKey, [string]$Name, [int[]]$ImageSize) {
    $property = $Entry.anatomy.landmarks.PSObject.Properties[$Name]
    if ($null -eq $property) {
        throw "Entry '$EntryKey' is missing anatomical landmark '$Name'."
    }
    if ($null -eq $property.Value) {
        $reason = Get-OptionalReason $Entry $Name
        if ([string]::IsNullOrWhiteSpace($reason)) {
            throw "Entry '$EntryKey' marks '$Name' as non-verifiable but gives no reason."
        }
        return $null
    }
    if ($property.Value.Count -ne 2) {
        throw "Entry '$EntryKey' landmark '$Name' must be [x,y] or null."
    }
    $x = [double]$property.Value[0]
    $y = [double]$property.Value[1]
    if ($x -lt 0 -or $y -lt 0 -or $x -ge $ImageSize[0] -or $y -ge $ImageSize[1]) {
        throw "Entry '$EntryKey' landmark '$Name' is outside its image."
    }
    return [pscustomobject]@{ X = $x; Y = $y }
}

function Get-ReviewedEntry([pscustomobject]$Catalog, [string]$Key) {
    $property = $Catalog.entries.PSObject.Properties[$Key]
    if ($null -eq $property) {
        throw "Entry '$Key' is absent from the reviewed measurement catalog."
    }
    $entry = $property.Value
    if ($entry.reviewStatus -ne 'reviewed') {
        throw "Entry '$Key' face frame is not reviewed."
    }
    if ($null -eq $entry.anatomy -or $entry.anatomy.reviewStatus -ne 'reviewed') {
        throw "Entry '$Key' anatomical landmarks are not reviewed."
    }
    if ($entry.bodyRect.Count -ne 4 -or $entry.faceRect.Count -ne 4 -or $entry.imageSize.Count -ne 2) {
        throw "Entry '$Key' must contain imageSize, bodyRect and faceRect arrays."
    }
    if ([string]::IsNullOrWhiteSpace([string]$entry.reviewEvidence)) {
        throw "Entry '$Key' has no face-frame review evidence."
    }
    if ([string]::IsNullOrWhiteSpace([string]$entry.anatomy.reviewEvidence)) {
        throw "Entry '$Key' has no anatomical review evidence."
    }

    $file = Resolve-RepoFile ([string]$entry.path) "Entry '$Key' image"
    $faceEvidence = Resolve-RepoFile ([string]$entry.reviewEvidence) "Entry '$Key' face-frame evidence"
    $anatomyEvidence = Resolve-RepoFile ([string]$entry.anatomy.reviewEvidence) "Entry '$Key' anatomical evidence"
    $actualHash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne ([string]$entry.sha256).ToLowerInvariant()) {
        throw "Entry '$Key' changed after review. Expected SHA-256 $($entry.sha256), got $actualHash."
    }

    $landmarks = [ordered]@{}
    foreach ($name in $requiredLandmarks) {
        $landmarks[$name] = Get-Landmark $entry $Key $name ([int[]]$entry.imageSize)
    }

    return [pscustomobject]@{
        Key = $Key
        File = $file
        Entry = $entry
        ImageSize = [int[]]$entry.imageSize
        BodyRect = [object[]]$entry.bodyRect
        FaceRect = [object[]]$entry.faceRect
        Landmarks = [pscustomobject]$landmarks
        FaceReviewEvidence = $faceEvidence
        AnatomyReviewEvidence = $anatomyEvidence
    }
}

function Get-Distance([object]$A, [object]$B) {
    if ($null -eq $A -or $null -eq $B) { return $null }
    $dx = [double]$B.X - [double]$A.X
    $dy = [double]$B.Y - [double]$A.Y
    return [Math]::Sqrt(($dx * $dx) + ($dy * $dy))
}

function Get-Midpoint([object]$A, [object]$B) {
    if ($null -eq $A -or $null -eq $B) { return $null }
    return [pscustomobject]@{
        X = ([double]$A.X + [double]$B.X) / 2.0
        Y = ([double]$A.Y + [double]$B.Y) / 2.0
    }
}

function Get-MissingReason([pscustomobject]$ReviewedEntry, [string[]]$Names) {
    $reasons = @()
    foreach ($name in $Names) {
        if ($null -eq $ReviewedEntry.Landmarks.$name) {
            $reasons += "${name}: $(Get-OptionalReason $ReviewedEntry.Entry $name)"
        }
    }
    return ($reasons -join '; ')
}

function Get-NormalizedDistance(
    [pscustomobject]$ReviewedEntry,
    [string]$First,
    [string]$Second,
    [double]$FaceDiameter
) {
    $distance = Get-Distance $ReviewedEntry.Landmarks.$First $ReviewedEntry.Landmarks.$Second
    if ($null -eq $distance) {
        return "NV: $(Get-MissingReason $ReviewedEntry @($First, $Second))"
    }
    return [Math]::Round(($distance / $FaceDiameter), 4)
}

function Get-NormalizedMidpointDistance(
    [pscustomobject]$ReviewedEntry,
    [string[]]$FirstPair,
    [string[]]$SecondPair,
    [double]$FaceDiameter
) {
    $first = Get-Midpoint $ReviewedEntry.Landmarks.($FirstPair[0]) $ReviewedEntry.Landmarks.($FirstPair[1])
    $second = Get-Midpoint $ReviewedEntry.Landmarks.($SecondPair[0]) $ReviewedEntry.Landmarks.($SecondPair[1])
    if ($null -eq $first -or $null -eq $second) {
        return "NV: $(Get-MissingReason $ReviewedEntry ($FirstPair + $SecondPair))"
    }
    return [Math]::Round(((Get-Distance $first $second) / $FaceDiameter), 4)
}

function New-Measurement([pscustomobject]$ReviewedEntry, [string]$Label) {
    $face = Convert-ToRectangle $ReviewedEntry.FaceRect
    $faceDiameter = [Math]::Sqrt($face.Width * $face.Height)
    return [pscustomobject]@{
        Key = $ReviewedEntry.Key
        Label = $Label
        FaceDiameter = [Math]::Round($faceDiameter, 4)
        Categories = [ordered]@{
            Head = [ordered]@{
                FaceWidth = [Math]::Round(($face.Width / $faceDiameter), 4)
                FaceHeight = [Math]::Round(($face.Height / $faceDiameter), 4)
                CrownToChin = Get-NormalizedDistance $ReviewedEntry 'headTop' 'chin' $faceDiameter
            }
            Shoulders = [ordered]@{
                Width = Get-NormalizedDistance $ReviewedEntry 'leftShoulder' 'rightShoulder' $faceDiameter
            }
            Torso = [ordered]@{
                Length = Get-NormalizedMidpointDistance $ReviewedEntry @('leftShoulder', 'rightShoulder') @('leftHip', 'rightHip') $faceDiameter
            }
            Arms = [ordered]@{
                LeftUpper = Get-NormalizedDistance $ReviewedEntry 'leftShoulder' 'leftElbow' $faceDiameter
                LeftForearm = Get-NormalizedDistance $ReviewedEntry 'leftElbow' 'leftWrist' $faceDiameter
                RightUpper = Get-NormalizedDistance $ReviewedEntry 'rightShoulder' 'rightElbow' $faceDiameter
                RightForearm = Get-NormalizedDistance $ReviewedEntry 'rightElbow' 'rightWrist' $faceDiameter
            }
            Hips = [ordered]@{
                Width = Get-NormalizedDistance $ReviewedEntry 'leftHip' 'rightHip' $faceDiameter
            }
            Legs = [ordered]@{
                LeftThigh = Get-NormalizedDistance $ReviewedEntry 'leftHip' 'leftKnee' $faceDiameter
                LeftShin = Get-NormalizedDistance $ReviewedEntry 'leftKnee' 'leftAnkle' $faceDiameter
                RightThigh = Get-NormalizedDistance $ReviewedEntry 'rightHip' 'rightKnee' $faceDiameter
                RightShin = Get-NormalizedDistance $ReviewedEntry 'rightKnee' 'rightAnkle' $faceDiameter
            }
        }
        ReviewedEntry = $ReviewedEntry
        DisplayScale = $TargetFaceDiameter / $faceDiameter
    }
}

function Convert-ToCanvasPoint([object]$Point, [System.Drawing.Rectangle]$Body, [double]$Scale, [int]$X, [int]$Y) {
    if ($null -eq $Point) { return $null }
    return [System.Drawing.PointF]::new(
        [single]($X + (($Point.X - $Body.X) * $Scale)),
        [single]($Y + (($Point.Y - $Body.Y) * $Scale))
    )
}

function Draw-Link([System.Drawing.Graphics]$Graphics, [object]$A, [object]$B, [System.Drawing.Color]$Color) {
    if ($null -eq $A -or $null -eq $B) { return }
    $pen = [System.Drawing.Pen]::new($Color, 4)
    try {
        $Graphics.DrawLine($pen, [single]$A.X, [single]$A.Y, [single]$B.X, [single]$B.Y)
    }
    finally { $pen.Dispose() }
}

function Draw-Panel(
    [System.Drawing.Graphics]$Graphics,
    [pscustomobject]$Measurement,
    [int]$PanelX,
    [int]$ImageBottom,
    [int]$TextTop
) {
    $reviewed = $Measurement.ReviewedEntry
    $body = Convert-ToRectangle $reviewed.BodyRect
    $scaledWidth = [int][Math]::Round($body.Width * $Measurement.DisplayScale)
    $scaledExtent = [int][Math]::Round($body.Height * $Measurement.DisplayScale)
    if ($scaledWidth -gt ($PanelWidth - 30)) {
        throw "'$($Measurement.Key)' is wider than its panel. Increase -PanelWidth; no shrink-to-fit is applied."
    }
    $targetX = $PanelX + [int][Math]::Round(($PanelWidth - $scaledWidth) / 2)
    $targetY = $ImageBottom - $scaledExtent
    $target = [System.Drawing.Rectangle]::new($targetX, $targetY, $scaledWidth, $scaledExtent)
    $Graphics.DrawImage($reviewed.Bitmap, $target, $body, [System.Drawing.GraphicsUnit]::Pixel)

    $points = @{}
    foreach ($name in $requiredLandmarks) {
        $points[$name] = Convert-ToCanvasPoint $reviewed.Landmarks.$name $body $Measurement.DisplayScale $targetX $targetY
    }
    Draw-Link $Graphics $points.headTop $points.chin ([System.Drawing.Color]::Magenta)
    Draw-Link $Graphics $points.leftShoulder $points.rightShoulder ([System.Drawing.Color]::Cyan)
    Draw-Link $Graphics $points.leftShoulder $points.leftElbow ([System.Drawing.Color]::Lime)
    Draw-Link $Graphics $points.leftElbow $points.leftWrist ([System.Drawing.Color]::Lime)
    Draw-Link $Graphics $points.rightShoulder $points.rightElbow ([System.Drawing.Color]::Lime)
    Draw-Link $Graphics $points.rightElbow $points.rightWrist ([System.Drawing.Color]::Lime)
    Draw-Link $Graphics $points.leftHip $points.rightHip ([System.Drawing.Color]::Orange)
    Draw-Link $Graphics $points.leftHip $points.leftKnee ([System.Drawing.Color]::DodgerBlue)
    Draw-Link $Graphics $points.leftKnee $points.leftAnkle ([System.Drawing.Color]::DodgerBlue)
    Draw-Link $Graphics $points.rightHip $points.rightKnee ([System.Drawing.Color]::DodgerBlue)
    Draw-Link $Graphics $points.rightKnee $points.rightAnkle ([System.Drawing.Color]::DodgerBlue)
    Draw-Link $Graphics (Get-Midpoint $points.leftShoulder $points.rightShoulder) (Get-Midpoint $points.leftHip $points.rightHip) ([System.Drawing.Color]::Gold)

    $titleFont = [System.Drawing.Font]::new('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
    $textFont = [System.Drawing.Font]::new('Consolas', 10)
    try {
        $Graphics.DrawString($Measurement.Label, $titleFont, [System.Drawing.Brushes]::White, ($PanelX + 12), 10)
        $rows = @(
            "HEAD faceW=$($Measurement.Categories.Head.FaceWidth) faceH=$($Measurement.Categories.Head.FaceHeight) crown-chin=$($Measurement.Categories.Head.CrownToChin)",
            "SHOULDERS width=$($Measurement.Categories.Shoulders.Width)",
            "TORSO length=$($Measurement.Categories.Torso.Length)",
            "ARMS LU=$($Measurement.Categories.Arms.LeftUpper) LF=$($Measurement.Categories.Arms.LeftForearm)",
            "     RU=$($Measurement.Categories.Arms.RightUpper) RF=$($Measurement.Categories.Arms.RightForearm)",
            "HIPS width=$($Measurement.Categories.Hips.Width)",
            "LEGS LT=$($Measurement.Categories.Legs.LeftThigh) LS=$($Measurement.Categories.Legs.LeftShin)",
            "     RT=$($Measurement.Categories.Legs.RightThigh) RS=$($Measurement.Categories.Legs.RightShin)"
        )
        for ($i = 0; $i -lt $rows.Count; $i++) {
            $Graphics.DrawString($rows[$i], $textFont, [System.Drawing.Brushes]::White, ($PanelX + 12), ($TextTop + ($i * 20)))
        }
    }
    finally {
        $titleFont.Dispose()
        $textFont.Dispose()
    }
}

$catalogFile = Resolve-RepoFile $ReferenceCatalogPath 'Reference catalog'
$catalog = Get-Content -LiteralPath $catalogFile -Raw | ConvertFrom-Json
if ($catalog.schemaVersion -ne 2) {
    throw "Unsupported reference catalog schema version: $($catalog.schemaVersion). Expected 2."
}

$specs = @(
    @{ Key = $CandidateKey; Label = $CandidateLabel },
    @{ Key = $NeutralKey; Label = $NeutralLabel },
    @{ Key = $TemplateAKey; Label = $TemplateALabel },
    @{ Key = $TemplateBKey; Label = $TemplateBLabel }
)
$entries = @()
$measurements = @()
try {
    foreach ($spec in $specs) {
        $entry = Get-ReviewedEntry $catalog $spec.Key
        $bitmap = [System.Drawing.Bitmap]::FromFile($entry.File)
        $entry | Add-Member -NotePropertyName Bitmap -NotePropertyValue $bitmap
        $entries += $entry
        if ($bitmap.Width -ne $entry.ImageSize[0] -or $bitmap.Height -ne $entry.ImageSize[1]) {
            throw "Entry '$($entry.Key)' dimensions changed after review."
        }
        $body = Convert-ToRectangle $entry.BodyRect
        $face = Convert-ToRectangle $entry.FaceRect
        Assert-RectangleInsideImage $body $bitmap "$($entry.Key) body"
        Assert-RectangleInsideImage $face $bitmap "$($entry.Key) face"
        if (-not $body.Contains($face)) {
            throw "Entry '$($entry.Key)' face frame is outside its body crop."
        }
        foreach ($name in $requiredLandmarks) {
            $point = $entry.Landmarks.$name
            if ($null -ne $point -and
                ($point.X -lt $body.Left -or $point.X -ge $body.Right -or
                 $point.Y -lt $body.Top -or $point.Y -ge $body.Bottom)) {
                throw "Entry '$($entry.Key)' landmark '$name' is outside its reviewed body crop."
            }
        }
        $label = if ([string]::IsNullOrWhiteSpace($spec.Label)) { $entry.Key } else { $spec.Label }
        $measurements += New-Measurement $entry $label
    }

    $outputFile = Resolve-OutputFile $OutputPath
    $imageTop = 48
    $renderedExtents = foreach ($measurement in $measurements) {
        $body = Convert-ToRectangle $measurement.ReviewedEntry.BodyRect
        [int][Math]::Round($body.Height * $measurement.DisplayScale)
    }
    $imageBottom = $imageTop + (($renderedExtents | Measure-Object -Maximum).Maximum)
    $textTop = $imageBottom + 18
    $canvas = [System.Drawing.Bitmap]::new(
        ($PanelWidth * $measurements.Count),
        ($textTop + 185),
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 42, 42, 46))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        for ($index = 0; $index -lt $measurements.Count; $index++) {
            Draw-Panel $graphics $measurements[$index] ($index * $PanelWidth) $imageBottom $textTop
        }
        $canvas.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $canvas.Dispose()
    }

    $reportFile = [System.IO.Path]::ChangeExtension($outputFile, '.json')
    $report = [ordered]@{
        schemaVersion = 2
        generatedAt = [DateTimeOffset]::Now.ToString('o')
        catalog = $catalogFile
        board = $outputFile
        normalization = 'Every anatomical distance is divided by the reviewed face diameter sqrt(face width * face height).'
        decisionPolicy = 'Measurements only. A human inspection handles pose, flexion, foreshortening and acceptance; this report cannot accept or reject a sprite.'
        categories = @('head', 'shoulders', 'torso', 'arms', 'hips', 'legs')
        measurements = @($measurements | ForEach-Object {
            [ordered]@{
                key = $_.Key
                label = $_.Label
                faceDiameter = $_.FaceDiameter
                categories = $_.Categories
            }
        })
    }
    $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $reportFile -Encoding utf8

    [pscustomobject]@{
        OutputPath = $outputFile
        ReportPath = $reportFile
        OutputBytes = (Get-Item -LiteralPath $outputFile).Length
        ReferenceCatalog = $catalogFile
        CandidateKey = $CandidateKey
        NeutralKey = $NeutralKey
        TemplateAKey = $TemplateAKey
        TemplateBKey = $TemplateBKey
        Categories = @('head', 'shoulders', 'torso', 'arms', 'hips', 'legs')
        DecisionPolicy = $report.decisionPolicy
    }
}
finally {
    foreach ($entry in $entries) {
        if ($null -ne $entry.Bitmap) { $entry.Bitmap.Dispose() }
    }
}
