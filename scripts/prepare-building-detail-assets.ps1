param(
  [string]$SourceDirectory = "assets/design/cdi-069/sources/building-details-v1",
  [string]$OutputDirectory = "src/assets/images/ui/buildings"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$assets = [ordered]@{
  habitation = "habitation"
  ferme = "ferme"
  scierie = "scierie"
  carriere = "carriere"
  mine = "mine"
  maison_chef = "maison-chef"
  guilde = "guilde"
  temple = "temple"
  caserne = "caserne"
  poste_chasse = "poste-chasse"
  academie = "academie"
  cercle = "cercle"
  lair = "lair"
  forge = "forge"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object MimeType -eq "image/jpeg"
$encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
  [System.Drawing.Imaging.Encoder]::Quality,
  [long]88
)

foreach ($entry in $assets.GetEnumerator()) {
  $sourcePath = Join-Path $SourceDirectory "$($entry.Key).png"
  $outputPath = Join-Path $OutputDirectory "building-detail-$($entry.Value)-v1.jpg"
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Missing building-detail source: $sourcePath"
  }

  $source = [System.Drawing.Bitmap]::new($sourcePath)
  try {
    $cropHeight = [Math]::Floor($source.Width / 4)
    if ($cropHeight -gt $source.Height) {
      throw "Source is narrower than 4:1: $sourcePath"
    }
    $cropY = [Math]::Floor(($source.Height - $cropHeight) / 2)
    if ($entry.Key -eq "poste_chasse") {
      $cropY = [Math]::Min($source.Height - $cropHeight, $cropY + 80)
    }
    if ($entry.Key -eq "poste_chasse") {
      $cropY = [Math]::Min($source.Height - $cropHeight, $cropY + 80)
    }
    $destination = [System.Drawing.Bitmap]::new(1536, 384)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($destination)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $destinationRect = [System.Drawing.Rectangle]::new(0, 0, 1536, 384)
        $sourceRect = [System.Drawing.Rectangle]::new(0, $cropY, $source.Width, $cropHeight)
        $graphics.DrawImage($source, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
      }
      finally {
        $graphics.Dispose()
      }
      $destination.Save($outputPath, $jpegCodec, $encoderParameters)
    }
    finally {
      $destination.Dispose()
    }
  }
  finally {
    $source.Dispose()
  }
}

# The runic workshop was redesigned for the panoramic set. Derive its menu
# card from the same master so both views keep exactly the same architecture.
$academySourcePath = Join-Path $SourceDirectory "academie.png"
$academyCardPath = Join-Path $OutputDirectory "building-card-academie-v1.jpg"
$academySource = [System.Drawing.Bitmap]::new($academySourcePath)
try {
  $academyCropHeight = [Math]::Floor($academySource.Width * (448 / 1024))
  $academyCropY = [Math]::Floor(($academySource.Height - $academyCropHeight) / 2)
  if ($academyCropHeight -gt $academySource.Height) {
    throw "Academy source is wider than the card ratio: $academySourcePath"
  }
  $academyCard = [System.Drawing.Bitmap]::new(1024, 448)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($academyCard)
    try {
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $destinationRect = [System.Drawing.Rectangle]::new(0, 0, 1024, 448)
      $sourceRect = [System.Drawing.Rectangle]::new(0, $academyCropY, $academySource.Width, $academyCropHeight)
      $graphics.DrawImage($academySource, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
    }
    finally {
      $graphics.Dispose()
    }
    $academyCard.Save($academyCardPath, $jpegCodec, $encoderParameters)
  }
  finally {
    $academyCard.Dispose()
  }
}
finally {
  $academySource.Dispose()
}

$encoderParameters.Dispose()
