param(
  [Parameter(Mandatory = $true)]
  [string]$UpperInputPath,

  [Parameter(Mandatory = $true)]
  [string]$LowerInputPath,

  [Parameter(Mandatory = $true)]
  [string]$UpperOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$LowerOutputPath,

  [int]$Width = 38,

  [int]$Height = 25
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Resize-Ornament {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  $resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
  $resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $OutputPath))
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($resolvedOutput)) | Out-Null

  $inputBitmap = [System.Drawing.Bitmap]::FromFile($resolvedInput)
  $outputBitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($outputBitmap)

  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.DrawImage($inputBitmap, [System.Drawing.Rectangle]::new(0, 0, $Width, $Height))
    $outputBitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $outputBitmap.Dispose()
    $inputBitmap.Dispose()
  }

  "Wrote $resolvedOutput ($Width x $Height)"
}

Resize-Ornament -InputPath $UpperInputPath -OutputPath $UpperOutputPath
Resize-Ornament -InputPath $LowerInputPath -OutputPath $LowerOutputPath
