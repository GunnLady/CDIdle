[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string]$ImagePath,
    [Parameter(Mandatory = $true)] [ValidateCount(4, 4)] [int[]]$BodyRect,
    [Parameter(Mandatory = $true)] [ValidateCount(4, 4)] [int[]]$FaceRect,
    [Parameter(Mandatory = $true)] [string]$ReferenceKey,
    [Parameter(Mandatory = $true)] [string]$OutputPath,
    [string]$Label = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-InputFile([string]$Path) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $repoRoot $Path }
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Input image not found: $resolved"
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

function Convert-ToRectangle([int[]]$Values) {
    return [System.Drawing.Rectangle]::new($Values[0], $Values[1], $Values[2], $Values[3])
}

function Assert-Rectangle(
    [System.Drawing.Rectangle]$Rectangle,
    [System.Drawing.Image]$Image,
    [string]$Name
) {
    if ($Rectangle.X -lt 0 -or $Rectangle.Y -lt 0 `
        -or $Rectangle.Width -le 0 -or $Rectangle.Height -le 0 `
        -or $Rectangle.Right -gt $Image.Width -or $Rectangle.Bottom -gt $Image.Height) {
        throw "$Name rectangle $Rectangle exceeds image $($Image.Width)x$($Image.Height)."
    }
}

function Draw-FaceFrame(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Rectangle]$SourceFace,
    [System.Drawing.Rectangle]$SourceRegion,
    [System.Drawing.Rectangle]$TargetRegion
) {
    $scaleX = $TargetRegion.Width / [double]$SourceRegion.Width
    $scaleY = $TargetRegion.Height / [double]$SourceRegion.Height
    $left = $TargetRegion.Left + ($SourceFace.Left - $SourceRegion.Left) * $scaleX
    $top = $TargetRegion.Top + ($SourceFace.Top - $SourceRegion.Top) * $scaleY
    $right = $TargetRegion.Left + ($SourceFace.Right - $SourceRegion.Left) * $scaleX
    $bottom = $TargetRegion.Top + ($SourceFace.Bottom - $SourceRegion.Top) * $scaleY
    $centerX = ($left + $right) / 2.0
    $centerY = ($top + $bottom) / 2.0

    $facePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(245, 0, 230, 255), 3)
    $centerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(245, 255, 220, 0), 2)
    try {
        $Graphics.DrawRectangle($facePen, $left, $top, ($right - $left), ($bottom - $top))
        $Graphics.DrawLine($centerPen, $centerX, $top, $centerX, $bottom)
        $Graphics.DrawLine($centerPen, $left, $centerY, $right, $centerY)
    }
    finally {
        $facePen.Dispose()
        $centerPen.Dispose()
    }
}

$inputFile = Resolve-InputFile $ImagePath
$outputFile = Resolve-OutputFile $OutputPath
if ([string]::IsNullOrWhiteSpace($Label)) { $Label = $ReferenceKey }

$image = [System.Drawing.Bitmap]::FromFile($inputFile)
try {
    $body = Convert-ToRectangle $BodyRect
    $face = Convert-ToRectangle $FaceRect
    Assert-Rectangle $body $image 'Body'
    Assert-Rectangle $face $image 'Face'
    if (-not $body.Contains($face)) {
        throw "Face rectangle $face is not fully contained in body rectangle $body."
    }

    $canvas = [System.Drawing.Bitmap]::new(1400, 900, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 42, 42, 46))
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

        $titleFont = [System.Drawing.Font]::new('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
        $detailFont = [System.Drawing.Font]::new('Consolas', 14, [System.Drawing.FontStyle]::Regular)
        try {
            $graphics.DrawString($Label, $titleFont, [System.Drawing.Brushes]::White, 18, 12)
            $centerX = $face.X + ($face.Width / 2.0)
            $centerY = $face.Y + ($face.Height / 2.0)
            $diameter = [Math]::Sqrt($face.Width * $face.Height)
            $details = 'key={0}  face={1},{2},{3},{4}  center=({5:F1},{6:F1})  d={7:F2}' -f `
                $ReferenceKey, $face.X, $face.Y, $face.Width, $face.Height, $centerX, $centerY, $diameter
            $graphics.DrawString($details, $detailFont, [System.Drawing.Brushes]::White, 18, 50)

            $bodyPanel = [System.Drawing.Rectangle]::new(20, 90, 660, 780)
            $bodyScale = [Math]::Min(
                $bodyPanel.Width / [double]$body.Width,
                $bodyPanel.Height / [double]$body.Height
            )
            $bodyTargetWidth = [int][Math]::Round($body.Width * $bodyScale)
            $bodyTargetHeight = [int][Math]::Round($body.Height * $bodyScale)
            $bodyTarget = [System.Drawing.Rectangle]::new(
                $bodyPanel.Left + [int][Math]::Round(($bodyPanel.Width - $bodyTargetWidth) / 2.0),
                $bodyPanel.Bottom - $bodyTargetHeight,
                $bodyTargetWidth,
                $bodyTargetHeight
            )
            $graphics.DrawImage($image, $bodyTarget, $body, [System.Drawing.GraphicsUnit]::Pixel)
            Draw-FaceFrame $graphics $face $body $bodyTarget

            $padding = [int][Math]::Ceiling([Math]::Max($face.Width, $face.Height) * 0.75)
            $zoomLeft = [Math]::Max(0, $face.Left - $padding)
            $zoomTop = [Math]::Max(0, $face.Top - $padding)
            $zoomRight = [Math]::Min($image.Width, $face.Right + $padding)
            $zoomBottom = [Math]::Min($image.Height, $face.Bottom + $padding)
            $zoomSource = [System.Drawing.Rectangle]::FromLTRB($zoomLeft, $zoomTop, $zoomRight, $zoomBottom)
            $zoomPanel = [System.Drawing.Rectangle]::new(720, 110, 650, 730)
            $zoomScale = [Math]::Min(
                $zoomPanel.Width / [double]$zoomSource.Width,
                $zoomPanel.Height / [double]$zoomSource.Height
            )
            $zoomWidth = [int][Math]::Round($zoomSource.Width * $zoomScale)
            $zoomHeight = [int][Math]::Round($zoomSource.Height * $zoomScale)
            $zoomTarget = [System.Drawing.Rectangle]::new(
                $zoomPanel.Left + [int][Math]::Round(($zoomPanel.Width - $zoomWidth) / 2.0),
                $zoomPanel.Top + [int][Math]::Round(($zoomPanel.Height - $zoomHeight) / 2.0),
                $zoomWidth,
                $zoomHeight
            )
            $graphics.DrawImage($image, $zoomTarget, $zoomSource, [System.Drawing.GraphicsUnit]::Pixel)
            Draw-FaceFrame $graphics $face $zoomSource $zoomTarget
        }
        finally {
            $titleFont.Dispose()
            $detailFont.Dispose()
        }

        $canvas.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $canvas.Dispose()
    }

    $relativePath = if ($inputFile.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $inputFile.Substring($repoRoot.Length + 1).Replace('\', '/')
    }
    else {
        $inputFile
    }
    [pscustomobject]@{
        OutputPath = $outputFile
        ReferenceKey = $ReferenceKey
        Path = $relativePath
        Sha256 = (Get-FileHash -LiteralPath $inputFile -Algorithm SHA256).Hash.ToLower()
        ImageSize = "$($image.Width),$($image.Height)"
        BodyRect = ($BodyRect -join ',')
        FaceRect = ($FaceRect -join ',')
        FaceCenter = '{0:F1},{1:F1}' -f ($face.X + $face.Width / 2.0), ($face.Y + $face.Height / 2.0)
        FaceDiameter = [Math]::Sqrt($face.Width * $face.Height)
        CatalogStatus = 'pending visual review; do not cache automatically'
    }
}
finally {
    $image.Dispose()
}
