[CmdletBinding()]
param(
    [string]$ReferenceCatalogPath = 'assets/design/hero-sprites/combat-idle-proportion-references.json',
    [Parameter(Mandatory = $true)] [string]$ReferenceKey,
    [Parameter(Mandatory = $true)] [string]$OutputPath,
    [ValidateRange(0.5, 4.0)] [double]$Scale = 1.5
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
function Resolve-PathFromRepo([string]$Path, [bool]$MustExist) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $repoRoot $Path }
    if ($MustExist -and -not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "File not found: $resolved"
    }
    if (-not $MustExist) {
        $parent = Split-Path -Parent $resolved
        if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
    }
    return [System.IO.Path]::GetFullPath($resolved)
}

function Point-From([object]$Value) {
    if ($null -eq $Value) { return $null }
    return [System.Drawing.PointF]::new([single]($Value[0] * $Scale), [single]($Value[1] * $Scale))
}

function Draw-Link([System.Drawing.Graphics]$Graphics, [object]$A, [object]$B, [System.Drawing.Color]$Color) {
    if ($null -eq $A -or $null -eq $B) { return }
    $pen = [System.Drawing.Pen]::new($Color, 4)
    try {
        $Graphics.DrawLine($pen, [single]$A.X, [single]$A.Y, [single]$B.X, [single]$B.Y)
    }
    finally { $pen.Dispose() }
}

$catalogFile = Resolve-PathFromRepo $ReferenceCatalogPath $true
$catalog = Get-Content -LiteralPath $catalogFile -Raw | ConvertFrom-Json
$property = $catalog.entries.PSObject.Properties[$ReferenceKey]
if ($null -eq $property) { throw "Unknown catalog entry '$ReferenceKey'." }
$entry = $property.Value
if ($null -eq $entry.anatomy -or $null -eq $entry.anatomy.landmarks) {
    throw "Entry '$ReferenceKey' has no anatomical landmarks to review."
}
if ($entry.bodyRect.Count -ne 4 -or $entry.faceRect.Count -ne 4 -or $entry.imageSize.Count -ne 2) {
    throw "Entry '$ReferenceKey' must contain imageSize, bodyRect and faceRect arrays."
}
$imageFile = Resolve-PathFromRepo ([string]$entry.path) $true
$actualHash = (Get-FileHash -LiteralPath $imageFile -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne ([string]$entry.sha256).ToLowerInvariant()) {
    throw "Entry '$ReferenceKey' image does not match its recorded SHA-256."
}
$outputFile = Resolve-PathFromRepo $OutputPath $false
$source = [System.Drawing.Bitmap]::FromFile($imageFile)
try {
    if ($source.Width -ne $entry.imageSize[0] -or $source.Height -ne $entry.imageSize[1]) {
        throw "Entry '$ReferenceKey' dimensions do not match the catalog."
    }
    $body = [System.Drawing.Rectangle]::new(
        [int]$entry.bodyRect[0], [int]$entry.bodyRect[1],
        [int]$entry.bodyRect[2], [int]$entry.bodyRect[3]
    )
    $faceRectangle = [System.Drawing.Rectangle]::new(
        [int]$entry.faceRect[0], [int]$entry.faceRect[1],
        [int]$entry.faceRect[2], [int]$entry.faceRect[3]
    )
    foreach ($rectangleSpec in @(
        @{ Name = 'body'; Value = $body },
        @{ Name = 'face'; Value = $faceRectangle }
    )) {
        $rectangle = $rectangleSpec.Value
        if ($rectangle.X -lt 0 -or $rectangle.Y -lt 0 -or
            $rectangle.Width -le 0 -or $rectangle.Height -le 0 -or
            $rectangle.Right -gt $source.Width -or $rectangle.Bottom -gt $source.Height) {
            throw "Entry '$ReferenceKey' $($rectangleSpec.Name) rectangle is outside its image."
        }
    }
    if (-not $body.Contains($faceRectangle)) {
        throw "Entry '$ReferenceKey' face rectangle is outside its body crop."
    }
    $notVerifiableRows = @()
    foreach ($name in $requiredLandmarks) {
        $landmark = $entry.anatomy.landmarks.PSObject.Properties[$name]
        if ($null -eq $landmark) {
            throw "Entry '$ReferenceKey' is missing anatomical landmark '$name'."
        }
        if ($null -eq $landmark.Value) {
            $reasonProperty = $entry.anatomy.notVerifiable.PSObject.Properties[$name]
            if ($null -eq $reasonProperty -or [string]::IsNullOrWhiteSpace([string]$reasonProperty.Value)) {
                throw "Entry '$ReferenceKey' marks '$name' as non-verifiable but gives no reason."
            }
            $notVerifiableRows += "NV ${name}: $($reasonProperty.Value)"
            continue
        }
        if ($landmark.Value.Count -ne 2) {
            throw "Entry '$ReferenceKey' landmark '$name' must be [x,y] or null."
        }
        $x = [double]$landmark.Value[0]
        $y = [double]$landmark.Value[1]
        if ($x -lt $body.Left -or $x -ge $body.Right -or $y -lt $body.Top -or $y -ge $body.Bottom) {
            throw "Entry '$ReferenceKey' landmark '$name' is outside its body crop."
        }
    }
    $footer = 96 + ($notVerifiableRows.Count * 18)
    $canvas = [System.Drawing.Bitmap]::new(
        [int][Math]::Round($source.Width * $Scale),
        ([int][Math]::Round($source.Height * $Scale) + $footer),
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 42, 42, 46))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.DrawImage($source, 0, 0, ($source.Width * $Scale), ($source.Height * $Scale))

        $bodyPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(180, 210, 210, 210), 2)
        try {
            $graphics.DrawRectangle(
                $bodyPen,
                [single]($body.X * $Scale), [single]($body.Y * $Scale),
                [single]($body.Width * $Scale), [single]($body.Height * $Scale)
            )
        }
        finally { $bodyPen.Dispose() }

        $face = $entry.faceRect
        $facePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Cyan, 3)
        try {
            $graphics.DrawRectangle(
                $facePen,
                [single]($face[0] * $Scale), [single]($face[1] * $Scale),
                [single]($face[2] * $Scale), [single]($face[3] * $Scale)
            )
        }
        finally { $facePen.Dispose() }

        $p = @{}
        foreach ($name in $requiredLandmarks) {
            $p[$name] = Point-From $entry.anatomy.landmarks.$name
        }
        Draw-Link $graphics $p.headTop $p.chin ([System.Drawing.Color]::Magenta)
        Draw-Link $graphics $p.leftShoulder $p.rightShoulder ([System.Drawing.Color]::Cyan)
        Draw-Link $graphics $p.leftShoulder $p.leftElbow ([System.Drawing.Color]::Lime)
        Draw-Link $graphics $p.leftElbow $p.leftWrist ([System.Drawing.Color]::Lime)
        Draw-Link $graphics $p.rightShoulder $p.rightElbow ([System.Drawing.Color]::Lime)
        Draw-Link $graphics $p.rightElbow $p.rightWrist ([System.Drawing.Color]::Lime)
        Draw-Link $graphics $p.leftHip $p.rightHip ([System.Drawing.Color]::Orange)
        Draw-Link $graphics $p.leftHip $p.leftKnee ([System.Drawing.Color]::DodgerBlue)
        Draw-Link $graphics $p.leftKnee $p.leftAnkle ([System.Drawing.Color]::DodgerBlue)
        Draw-Link $graphics $p.rightHip $p.rightKnee ([System.Drawing.Color]::DodgerBlue)
        Draw-Link $graphics $p.rightKnee $p.rightAnkle ([System.Drawing.Color]::DodgerBlue)

        $dotBrush = [System.Drawing.Brushes]::White
        $font = [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
        $smallFont = [System.Drawing.Font]::new('Segoe UI', 9)
        try {
            foreach ($name in $p.Keys) {
                $point = $p[$name]
                if ($null -eq $point) { continue }
                $graphics.FillEllipse($dotBrush, ($point.X - 4), ($point.Y - 4), 8, 8)
                $graphics.DrawString($name, $smallFont, [System.Drawing.Brushes]::White, ($point.X + 5), ($point.Y - 8))
            }
            $footerY = [int][Math]::Round($source.Height * $Scale) + 8
            $graphics.DrawString("$ReferenceKey - anatomical review only", $font, [System.Drawing.Brushes]::White, 8, $footerY)
            $graphics.DrawString('cyan face/shoulders | magenta head | green arms | orange hips | blue legs', $smallFont, [System.Drawing.Brushes]::White, 8, ($footerY + 28))
            $graphics.DrawString('This board is evidence for a manual review; generating it does not approve the landmarks.', $smallFont, [System.Drawing.Brushes]::Gold, 8, ($footerY + 52))
            for ($index = 0; $index -lt $notVerifiableRows.Count; $index++) {
                $graphics.DrawString($notVerifiableRows[$index], $smallFont, [System.Drawing.Brushes]::Orange, 8, ($footerY + 76 + ($index * 18)))
            }
        }
        finally {
            $font.Dispose()
            $smallFont.Dispose()
        }
        $canvas.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $canvas.Dispose()
    }
}
finally { $source.Dispose() }

Get-Item -LiteralPath $outputFile | Select-Object FullName, Length, LastWriteTime
