[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CandidatePath,

    [Parameter(Mandatory = $true)]
    [ValidateCount(4, 4)]
    [int[]]$CandidateWeaponRect,

    [Parameter(Mandatory = $true)]
    [ValidateCount(4, 4)]
    [int[]]$CandidateJunctionRect,

    [Parameter(Mandatory = $true)]
    [string]$ReferencePath,

    [Parameter(Mandatory = $true)]
    [ValidateCount(4, 4)]
    [int[]]$ReferenceWeaponRect,

    [Parameter(Mandatory = $true)]
    [ValidateCount(4, 4)]
    [int[]]$ReferenceJunctionRect,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$CandidateLabel = 'Candidate weapon',
    [string]$ReferenceLabel = 'Authoritative reference',
    [int]$TargetHeight = 700,
    [int]$JunctionHeight = 520,
    [int]$PanelWidth = 800
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-InputFile([string]$Path) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $repoRoot $Path
    }

    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Input image not found: $resolved"
    }

    return (Resolve-Path -LiteralPath $resolved).Path
}

function Resolve-OutputFile([string]$Path) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $repoRoot $Path
    }

    $parent = Split-Path -Parent $resolved
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    return [System.IO.Path]::GetFullPath($resolved)
}

function Assert-Rectangle(
    [int[]]$Rect,
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Name
) {
    $x, $y, $width, $height = $Rect
    if ($x -lt 0 -or $y -lt 0 -or $width -le 0 -or $height -le 0) {
        throw "$Name must contain non-negative x/y and positive width/height."
    }
    if (($x + $width) -gt $Bitmap.Width -or ($y + $height) -gt $Bitmap.Height) {
        throw "$Name exceeds image bounds $($Bitmap.Width)x$($Bitmap.Height)."
    }
}

function Draw-Crop(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Source,
    [int[]]$Rect,
    [int]$PanelX,
    [int]$AreaY,
    [int]$AreaHeight,
    [string]$Label,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$TextBrush,
    [bool]$Pixelated
) {
    $cropRect = New-Object System.Drawing.Rectangle($Rect[0], $Rect[1], $Rect[2], $Rect[3])
    $crop = $Source.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $availableWidth = $PanelWidth - 80
        $availableHeight = $AreaHeight - 55
        $scale = [Math]::Min($availableHeight / $crop.Height, $availableWidth / $crop.Width)
        $drawWidth = [Math]::Max(1, [int][Math]::Round($crop.Width * $scale))
        $drawHeight = [Math]::Max(1, [int][Math]::Round($crop.Height * $scale))
        $drawX = $panelX + [int](($PanelWidth - $drawWidth) / 2)
        $drawY = $AreaY + 45 + [int](($availableHeight - $drawHeight) / 2)

        $Graphics.DrawString($Label, $Font, $TextBrush, $panelX + 24, $AreaY)
        if ($Pixelated) {
            $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        }
        else {
            $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        }
        $Graphics.DrawImage($crop, $drawX, $drawY, $drawWidth, $drawHeight)
    }
    finally {
        $crop.Dispose()
    }
}

$candidateFile = Resolve-InputFile $CandidatePath
$referenceFile = Resolve-InputFile $ReferencePath
$outputFile = Resolve-OutputFile $OutputPath

$candidate = [System.Drawing.Bitmap]::FromFile($candidateFile)
$reference = [System.Drawing.Bitmap]::FromFile($referenceFile)
try {
    Assert-Rectangle $CandidateWeaponRect $candidate 'CandidateWeaponRect'
    Assert-Rectangle $CandidateJunctionRect $candidate 'CandidateJunctionRect'
    Assert-Rectangle $ReferenceWeaponRect $reference 'ReferenceWeaponRect'
    Assert-Rectangle $ReferenceJunctionRect $reference 'ReferenceJunctionRect'

    $canvas = New-Object System.Drawing.Bitmap(
        ($PanelWidth * 2),
        ($TargetHeight + $JunctionHeight + 150),
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)
        try {
            $graphics.Clear([System.Drawing.Color]::FromArgb(255, 38, 39, 43))
            $font = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
            $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            try {
                Draw-Crop -Graphics $graphics -Source $candidate -Rect $CandidateWeaponRect `
                    -PanelX 0 -AreaY 20 -AreaHeight $TargetHeight `
                    -Label ($CandidateLabel + ' - full weapon') -Font $font `
                    -TextBrush $brush -Pixelated $false
                Draw-Crop -Graphics $graphics -Source $reference -Rect $ReferenceWeaponRect `
                    -PanelX $PanelWidth -AreaY 20 -AreaHeight $TargetHeight `
                    -Label ($ReferenceLabel + ' - full weapon') -Font $font `
                    -TextBrush $brush -Pixelated $false

                $separatorY = $TargetHeight + 55
                $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 95, 97, 105), 2)
                try {
                    $graphics.DrawLine($pen, 0, $separatorY, ($PanelWidth * 2), $separatorY)
                }
                finally {
                    $pen.Dispose()
                }

                $junctionY = $TargetHeight + 85
                Draw-Crop -Graphics $graphics -Source $candidate -Rect $CandidateJunctionRect `
                    -PanelX 0 -AreaY $junctionY -AreaHeight $JunctionHeight `
                    -Label ($CandidateLabel + ' - junction zoom') -Font $font `
                    -TextBrush $brush -Pixelated $true
                Draw-Crop -Graphics $graphics -Source $reference -Rect $ReferenceJunctionRect `
                    -PanelX $PanelWidth -AreaY $junctionY -AreaHeight $JunctionHeight `
                    -Label ($ReferenceLabel + ' - junction zoom') -Font $font `
                    -TextBrush $brush -Pixelated $true
            }
            finally {
                $brush.Dispose()
                $font.Dispose()
            }
        }
        finally {
            $graphics.Dispose()
        }

        $canvas.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $canvas.Dispose()
    }

    $outputItem = Get-Item -LiteralPath $outputFile
    [pscustomobject]@{
        OutputPath          = $outputItem.FullName
        OutputBytes         = $outputItem.Length
        CandidatePath       = $candidateFile
        CandidateDimensions = "$($candidate.Width)x$($candidate.Height)"
        CandidateWeaponRect = ($CandidateWeaponRect -join ',')
        CandidateJunctionRect = ($CandidateJunctionRect -join ',')
        ReferencePath       = $referenceFile
        ReferenceDimensions = "$($reference.Width)x$($reference.Height)"
        ReferenceWeaponRect = ($ReferenceWeaponRect -join ',')
        ReferenceJunctionRect = ($ReferenceJunctionRect -join ',')
    }
}
finally {
    $reference.Dispose()
    $candidate.Dispose()
}
