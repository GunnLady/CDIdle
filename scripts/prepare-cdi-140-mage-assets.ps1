param(
  [Parameter(Mandatory = $true)] [string]$SourceRoot,
  [Parameter(Mandatory = $true)] [string]$NeutralRoot,
  [Parameter(Mandatory = $true)] [string]$OutputRoot
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Save-Png {
  param(
    [Parameter(Mandatory = $true)] [System.Drawing.Bitmap]$Image,
    [Parameter(Mandatory = $true)] [string]$Path
  )

  $directory = [System.IO.Path]::GetDirectoryName($Path)
  if ($directory) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
  }
  $stream = [System.IO.File]::Open(
    $Path,
    [System.IO.FileMode]::Create,
    [System.IO.FileAccess]::Write,
    [System.IO.FileShare]::None
  )
  try {
    $Image.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $stream.Dispose()
  }
}

function New-LowAlphaCleanedCopy {
  param(
    [Parameter(Mandatory = $true)] [string]$Path,
    [Parameter(Mandatory = $true)] [byte]$Threshold
  )

  $temporaryPath = [System.IO.Path]::GetTempFileName()
  $source = [System.Drawing.Bitmap]::new($Path)
  try {
    for ($y = 0; $y -lt $source.Height; $y++) {
      for ($x = 0; $x -lt $source.Width; $x++) {
        $color = $source.GetPixel($x, $y)
        if ($color.A -le $Threshold) {
          $source.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
      }
    }
    Save-Png -Image $source -Path $temporaryPath
  } finally {
    $source.Dispose()
  }
  return $temporaryPath
}

function Build-Sheet {
  param(
    [Parameter(Mandatory = $true)] [string[]]$Paths,
    [Parameter(Mandatory = $true)] [string]$AlphaPath,
    [Parameter(Mandatory = $true)] [string]$LightPath,
    [Parameter(Mandatory = $true)] [string]$DarkPath
  )

  if ($Paths.Count -ne 10) {
    throw "Exactly ten normalized Mage sprites are required per gender."
  }

  $first = [System.Drawing.Bitmap]::new($Paths[0])
  try {
    $cellWidth = $first.Width
    $cellHeight = $first.Height
  } finally {
    $first.Dispose()
  }

  $sheet = [System.Drawing.Bitmap]::new(
    $cellWidth * 5,
    $cellHeight * 2,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      for ($index = 0; $index -lt $Paths.Count; $index++) {
        $sprite = [System.Drawing.Bitmap]::new($Paths[$index])
        try {
          $graphics.DrawImageUnscaled(
            $sprite,
            ($index % 5) * $cellWidth,
            [Math]::Floor($index / 5) * $cellHeight
          )
        } finally {
          $sprite.Dispose()
        }
      }
      $graphics.Flush()
    } finally {
      $graphics.Dispose()
    }
    Save-Png -Image $sheet -Path $AlphaPath

    foreach ($preview in @(
      @{ Path = $LightPath; Color = [System.Drawing.Color]::FromArgb(255, 241, 237, 228) },
      @{ Path = $DarkPath; Color = [System.Drawing.Color]::FromArgb(255, 20, 24, 33) }
    )) {
      $canvas = [System.Drawing.Bitmap]::new(
        $sheet.Width,
        $sheet.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
      )
      try {
        $previewGraphics = [System.Drawing.Graphics]::FromImage($canvas)
        try {
          $previewGraphics.Clear($preview.Color)
          $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
          $previewGraphics.DrawImageUnscaled($sheet, 0, 0)
          $previewGraphics.Flush()
        } finally {
          $previewGraphics.Dispose()
        }
        Save-Png -Image $canvas -Path $preview.Path
      } finally {
        $canvas.Dispose()
      }
    }
  } finally {
    $sheet.Dispose()
  }
}

$resolvedSourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$resolvedNeutralRoot = (Resolve-Path -LiteralPath $NeutralRoot).Path
$resolvedOutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$prepareScript = Join-Path $PSScriptRoot "prepare-dungeon-character-sprite.ps1"
$previewRoot = Join-Path $resolvedOutputRoot "previews"

foreach ($gender in @("male", "female")) {
  $normalizedPaths = @()
  for ($variant = 1; $variant -le 10; $variant++) {
    $suffix = $variant.ToString("D2")
    $inputPath = Join-Path $resolvedSourceRoot "validated-$gender-v1\mage-$gender-$suffix-v1.png"
    $referencePath = Join-Path $resolvedNeutralRoot "$gender\novice-$gender-$suffix-v1.png"
    $outputPath = Join-Path $resolvedOutputRoot "$gender\mage-$gender-$suffix-v1.png"
    if (-not (Test-Path -LiteralPath $inputPath -PathType Leaf)) {
      throw "Missing validated Mage source: $inputPath"
    }
    if (-not (Test-Path -LiteralPath $referencePath -PathType Leaf)) {
      throw "Missing normalized Novice reference: $referencePath"
    }

    $preparedInputPath = $inputPath
    $temporaryInputPath = $null
    try {
      if ($gender -eq "male" -and $variant -eq 7) {
        $temporaryInputPath = New-LowAlphaCleanedCopy -Path $inputPath -Threshold 15
        $preparedInputPath = $temporaryInputPath
      }
      Write-Output "Preparing Mage $gender $suffix"
      & $prepareScript `
        -InputPath $preparedInputPath `
        -ReferencePath $referencePath `
        -OutputPath $outputPath `
        -MatchReferenceHeight
    } finally {
      if ($temporaryInputPath -and (Test-Path -LiteralPath $temporaryInputPath -PathType Leaf)) {
        Remove-Item -LiteralPath $temporaryInputPath -Force
      }
    }
    $normalizedPaths += $outputPath
  }

  Build-Sheet `
    -Paths $normalizedPaths `
    -AlphaPath (Join-Path $resolvedOutputRoot "mage-$gender-sheet-alpha-v1.png") `
    -LightPath (Join-Path $previewRoot "mage-$gender-sheet-light-v1.png") `
    -DarkPath (Join-Path $previewRoot "mage-$gender-sheet-dark-v1.png")
}

Write-Output "Prepared 20 normalized CDI-140 Mage sprites and six sheet artifacts at $resolvedOutputRoot"
