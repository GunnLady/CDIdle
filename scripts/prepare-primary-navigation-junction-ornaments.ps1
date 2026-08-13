param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$UpperOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$LowerOutputPath,

  [string]$FinalUpperOutputPath,

  [string]$FinalLowerOutputPath,

  [int]$FinalWidth = 21,

  [int]$FinalHeight = 14,

  [Parameter(Mandatory = $true)]
  [string]$RailPath,

  [Parameter(Mandatory = $true)]
  [string]$NormalButtonPath,

  [Parameter(Mandatory = $true)]
  [string]$SelectedButtonPath,

  [Parameter(Mandatory = $true)]
  [string]$CompactPreviewPath,

  [string]$LargePreviewPath,

  [ValidateSet("Horizontal", "Vertical")]
  [string]$SourceLayout = "Horizontal",

  [int]$CompactOrnamentWidth = 36,

  [int]$CompactOrnamentHeight = 12,

  [int]$LargeOrnamentWidth = 48,

  [int]$LargeOrnamentHeight = 16
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class NavigationJunctionOrnamentPreparation
{
    public static Rectangle[] Extract(string inputPath, string upperPath, string lowerPath, bool verticalLayout)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            var alpha = BuildChromaAlpha(source);
            var upperBounds = verticalLayout
                ? FindBounds(alpha, source.Width, source.Height, 0, source.Width, 0, source.Height / 2)
                : FindBounds(alpha, source.Width, source.Height, 0, source.Width / 2, 0, source.Height);
            var lowerBounds = verticalLayout
                ? FindBounds(alpha, source.Width, source.Height, 0, source.Width, source.Height / 2, source.Height)
                : FindBounds(alpha, source.Width, source.Height, source.Width / 2, source.Width, 0, source.Height);

            using (var upper = CropWithAlpha(source, alpha, upperBounds))
            using (var lower = CropWithAlpha(source, alpha, lowerBounds))
            {
                lower.RotateFlip(RotateFlipType.Rotate180FlipNone);
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(upperPath)));
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(lowerPath)));
                upper.Save(upperPath, ImageFormat.Png);
                lower.Save(lowerPath, ImageFormat.Png);
            }

            return new[] { upperBounds, lowerBounds };
        }
    }

    private static Bitmap ToArgb(Bitmap source)
    {
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        {
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, 0, 0);
        }
        return output;
    }

    private static byte[] BuildChromaAlpha(Bitmap source)
    {
        var rectangle = new Rectangle(0, 0, source.Width, source.Height);
        var data = source.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            var bytes = new byte[Math.Abs(data.Stride) * source.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            var alpha = new byte[source.Width * source.Height];

            for (var y = 0; y < source.Height; y++)
            {
                for (var x = 0; x < source.Width; x++)
                {
                    var sourceIndex = y * data.Stride + x * 4;
                    var blue = bytes[sourceIndex];
                    var green = bytes[sourceIndex + 1];
                    var red = bytes[sourceIndex + 2];
                    var dominance = green - Math.Max(red, blue);
                    byte value;

                    if (green >= 80 && dominance >= 90)
                    {
                        value = 0;
                    }
                    else if (green < 80 || dominance <= 15)
                    {
                        value = 255;
                    }
                    else
                    {
                        value = (byte)Math.Round(255.0 * (90 - dominance) / 75.0);
                    }

                    alpha[y * source.Width + x] = value;
                }
            }

            return alpha;
        }
        finally
        {
            source.UnlockBits(data);
        }
    }

    private static Rectangle FindBounds(byte[] alpha, int width, int height, int xStart, int xEnd, int yStart, int yEnd)
    {
        var minX = xEnd;
        var minY = yEnd;
        var maxX = xStart - 1;
        var maxY = -1;

        for (var y = yStart; y < yEnd; y++)
        {
            for (var x = xStart; x < xEnd; x++)
            {
                if (alpha[y * width + x] <= 24)
                {
                    continue;
                }

                minX = Math.Min(minX, x);
                minY = Math.Min(minY, y);
                maxX = Math.Max(maxX, x);
                maxY = Math.Max(maxY, y);
            }
        }

        if (maxX < minX || maxY < minY)
        {
            throw new InvalidOperationException("No ornament was detected in the requested half.");
        }

        const int padding = 2;
        minX = Math.Max(xStart, minX - padding);
        minY = Math.Max(yStart, minY - padding);
        maxX = Math.Min(xEnd - 1, maxX + padding);
        maxY = Math.Min(yEnd - 1, maxY + padding);
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static Bitmap CropWithAlpha(Bitmap source, byte[] alpha, Rectangle bounds)
    {
        var output = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb);
        var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var outputData = output.LockBits(new Rectangle(0, 0, output.Width, output.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        try
        {
            var sourceBytes = new byte[Math.Abs(sourceData.Stride) * source.Height];
            var outputBytes = new byte[Math.Abs(outputData.Stride) * output.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);

            for (var y = 0; y < bounds.Height; y++)
            {
                for (var x = 0; x < bounds.Width; x++)
                {
                    var sourceX = bounds.X + x;
                    var sourceY = bounds.Y + y;
                    var sourceIndex = sourceY * sourceData.Stride + sourceX * 4;
                    var outputIndex = y * outputData.Stride + x * 4;
                    var alphaValue = alpha[sourceY * source.Width + sourceX];
                    var blue = sourceBytes[sourceIndex];
                    var green = sourceBytes[sourceIndex + 1];
                    var red = sourceBytes[sourceIndex + 2];

                    green = (byte)Math.Min(green, Math.Max(red, blue));
                    outputBytes[outputIndex] = blue;
                    outputBytes[outputIndex + 1] = green;
                    outputBytes[outputIndex + 2] = red;
                    outputBytes[outputIndex + 3] = alphaValue;
                }
            }

            Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
        }
        finally
        {
            source.UnlockBits(sourceData);
            output.UnlockBits(outputData);
        }

        return output;
    }
}
'@

if (-not ('NavigationJunctionOrnamentPreparation' -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

function Resolve-OutputPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Resize-Ornament {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$Width,
    [int]$Height
  )

  $inputBitmap = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $InputPath).Path)
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

    $resolvedOutput = Resolve-OutputPath $OutputPath
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($resolvedOutput)) | Out-Null
    $outputBitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $outputBitmap.Dispose()
    $inputBitmap.Dispose()
  }
}

function New-RailPreview {
  param(
    [string]$OutputPath,
    [int]$OrnamentWidth,
    [int]$OrnamentHeight
  )

  $rail = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $RailPath).Path)
  $normal = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $NormalButtonPath).Path)
  $selected = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $SelectedButtonPath).Path)
  $upper = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $UpperOutputPath).Path)
  $lower = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $LowerOutputPath).Path)
  $preview = [System.Drawing.Bitmap]::new(1440, 173, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($preview)

  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 17, 9, 5))

    $buttonX = 113
    $buttonY = 34
    for ($index = 0; $index -lt 4; $index++) {
      $button = if ($index -eq 0) { $selected } else { $normal }
      $graphics.DrawImage($button, [System.Drawing.Rectangle]::new($buttonX, $buttonY, 124, 107))
      $buttonX += 124
    }

    foreach ($junctionX in @(237, 361, 485)) {
      $ornamentX = $junctionX - [math]::Floor($OrnamentWidth / 2)
      $graphics.DrawImage($upper, [System.Drawing.Rectangle]::new($ornamentX, 34, $OrnamentWidth, $OrnamentHeight))
      $graphics.DrawImage($lower, [System.Drawing.Rectangle]::new($ornamentX, 141 - $OrnamentHeight, $OrnamentWidth, $OrnamentHeight))
    }

    $graphics.DrawImageUnscaled($rail, 0, 0)
    $resolvedOutput = Resolve-OutputPath $OutputPath
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($resolvedOutput)) | Out-Null
    $preview.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $preview.Dispose()
    $lower.Dispose()
    $upper.Dispose()
    $selected.Dispose()
    $normal.Dispose()
    $rail.Dispose()
  }
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedUpperOutput = Resolve-OutputPath $UpperOutputPath
$resolvedLowerOutput = Resolve-OutputPath $LowerOutputPath
$bounds = [NavigationJunctionOrnamentPreparation]::Extract(
  $resolvedInput,
  $resolvedUpperOutput,
  $resolvedLowerOutput,
  $SourceLayout -eq "Vertical"
)

if (-not [string]::IsNullOrWhiteSpace($FinalUpperOutputPath)) {
  Resize-Ornament -InputPath $resolvedUpperOutput -OutputPath $FinalUpperOutputPath -Width $FinalWidth -Height $FinalHeight
}
if (-not [string]::IsNullOrWhiteSpace($FinalLowerOutputPath)) {
  Resize-Ornament -InputPath $resolvedLowerOutput -OutputPath $FinalLowerOutputPath -Width $FinalWidth -Height $FinalHeight
}

New-RailPreview -OutputPath $CompactPreviewPath -OrnamentWidth $CompactOrnamentWidth -OrnamentHeight $CompactOrnamentHeight
if (-not [string]::IsNullOrWhiteSpace($LargePreviewPath)) {
  New-RailPreview -OutputPath $LargePreviewPath -OrnamentWidth $LargeOrnamentWidth -OrnamentHeight $LargeOrnamentHeight
}

"Upper source bounds: $($bounds[0])"
"Lower source bounds: $($bounds[1])"
"Wrote $resolvedUpperOutput"
"Wrote $resolvedLowerOutput"
"Wrote $(Resolve-OutputPath $CompactPreviewPath)"
if (-not [string]::IsNullOrWhiteSpace($LargePreviewPath)) {
  "Wrote $(Resolve-OutputPath $LargePreviewPath)"
}
