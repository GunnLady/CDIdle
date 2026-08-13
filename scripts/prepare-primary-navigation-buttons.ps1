param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$NormalOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$SelectedOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$RailPath,

  [Parameter(Mandatory = $true)]
  [string]$PreviewOutputPath
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

public static class PrimaryNavigationButtonPreparation
{
    private const int TargetWidth = 462;
    private const int TargetHeight = 364;
    private const int PreservedSideWidth = 88;
    private const int HorizontalEdgeTrim = 6;

    public static Rectangle[] ExtractAndPrepare(string inputPath, string normalPath, string selectedPath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            var alpha = BuildChromaAlpha(source);
            var leftBounds = FindBounds(alpha, source.Width, source.Height, 0, source.Width / 2);
            var rightBounds = FindBounds(alpha, source.Width, source.Height, source.Width / 2, source.Width);

            using (var normalCrop = CropWithAlpha(source, alpha, leftBounds))
            using (var selectedCrop = CropWithAlpha(source, alpha, rightBounds))
            using (var normalPrepared = PrepareButton(normalCrop))
            using (var selectedPrepared = PrepareButton(selectedCrop))
            using (var normal = TrimHorizontalEdges(normalPrepared))
            using (var selected = TrimHorizontalEdges(selectedPrepared))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(normalPath)));
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(selectedPath)));
                normal.Save(normalPath, ImageFormat.Png);
                selected.Save(selectedPath, ImageFormat.Png);
            }

            return new[] { leftBounds, rightBounds };
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

    private static Rectangle FindBounds(byte[] alpha, int width, int height, int xStart, int xEnd)
    {
        var minX = xEnd;
        var minY = height;
        var maxX = xStart - 1;
        var maxY = -1;

        for (var y = 0; y < height; y++)
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
            throw new InvalidOperationException("No visible button was detected in the requested half.");
        }

        const int padding = 2;
        minX = Math.Max(xStart, minX - padding);
        minY = Math.Max(0, minY - padding);
        maxX = Math.Min(xEnd - 1, maxX + padding);
        maxY = Math.Min(height - 1, maxY + padding);
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

                    // The buttons contain no authored green. Remove every
                    // residual green excess, including dark antialiased edge
                    // pixels that the alpha threshold intentionally preserves.
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

    private static Bitmap PrepareButton(Bitmap crop)
    {
        var normalizedWidth = (int)Math.Round(crop.Width * (TargetHeight / (double)crop.Height));
        if (normalizedWidth <= TargetWidth)
        {
            throw new InvalidOperationException("The source button is not wide enough for deterministic center removal.");
        }

        using (var normalized = Resize(crop, normalizedWidth, TargetHeight))
        {
            var output = new Bitmap(TargetWidth, TargetHeight, PixelFormat.Format32bppArgb);
            using (var graphics = Graphics.FromImage(output))
            using (var attributes = new ImageAttributes())
            {
                Configure(graphics);
                graphics.Clear(Color.Transparent);
                attributes.SetWrapMode(WrapMode.TileFlipXY);

                var centerWidth = TargetWidth - PreservedSideWidth * 2;
                var sourceCenterX = (normalized.Width - centerWidth) / 2;

                Draw(graphics, normalized, attributes,
                    new Rectangle(0, 0, PreservedSideWidth, TargetHeight),
                    new Rectangle(0, 0, PreservedSideWidth, TargetHeight));
                Draw(graphics, normalized, attributes,
                    new Rectangle(PreservedSideWidth, 0, centerWidth, TargetHeight),
                    new Rectangle(sourceCenterX, 0, centerWidth, TargetHeight));
                Draw(graphics, normalized, attributes,
                    new Rectangle(TargetWidth - PreservedSideWidth, 0, PreservedSideWidth, TargetHeight),
                    new Rectangle(normalized.Width - PreservedSideWidth, 0, PreservedSideWidth, TargetHeight));
            }
            return output;
        }
    }

    private static Bitmap Resize(Bitmap source, int width, int height)
    {
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        using (var attributes = new ImageAttributes())
        {
            Configure(graphics);
            graphics.Clear(Color.Transparent);
            attributes.SetWrapMode(WrapMode.TileFlipXY);
            Draw(graphics, source, attributes, new Rectangle(0, 0, width, height), new Rectangle(0, 0, source.Width, source.Height));
        }
        return output;
    }

    private static Bitmap TrimHorizontalEdges(Bitmap source)
    {
        var output = new Bitmap(TargetWidth, TargetHeight, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        using (var attributes = new ImageAttributes())
        {
            Configure(graphics);
            graphics.Clear(Color.Transparent);
            attributes.SetWrapMode(WrapMode.TileFlipXY);
            Draw(
                graphics,
                source,
                attributes,
                new Rectangle(0, 0, TargetWidth, TargetHeight),
                new Rectangle(HorizontalEdgeTrim, 0, TargetWidth - HorizontalEdgeTrim * 2, TargetHeight)
            );
        }
        return output;
    }

    private static void Configure(Graphics graphics)
    {
        graphics.CompositingMode = CompositingMode.SourceCopy;
        graphics.CompositingQuality = CompositingQuality.HighQuality;
        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.Half;
        graphics.SmoothingMode = SmoothingMode.HighQuality;
    }

    private static void Draw(Graphics graphics, Bitmap source, ImageAttributes attributes, Rectangle destination, Rectangle sourceRectangle)
    {
        graphics.DrawImage(source, destination, sourceRectangle.X, sourceRectangle.Y, sourceRectangle.Width, sourceRectangle.Height, GraphicsUnit.Pixel, attributes);
    }
}
'@

if (-not ('PrimaryNavigationButtonPreparation' -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedRail = (Resolve-Path -LiteralPath $RailPath).Path
$normalOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $NormalOutputPath))
$selectedOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $SelectedOutputPath))
$previewOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $PreviewOutputPath))

$bounds = [PrimaryNavigationButtonPreparation]::ExtractAndPrepare(
  $resolvedInput,
  $normalOutput,
  $selectedOutput
)

$rail = [System.Drawing.Bitmap]::FromFile($resolvedRail)
$normal = [System.Drawing.Bitmap]::FromFile($normalOutput)
$selected = [System.Drawing.Bitmap]::FromFile($selectedOutput)
$preview = [System.Drawing.Bitmap]::new(1440, 173, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($preview)

try {
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 17, 9, 5))

  $buttonWidths = @(124, 124, 124, 124)
  $buttonX = 113
  $buttonY = 35

  for ($index = 0; $index -lt 4; $index++) {
    $button = if ($index -eq 0) { $selected } else { $normal }
    $destination = [System.Drawing.Rectangle]::new($buttonX, $buttonY, $buttonWidths[$index], 91)
    $graphics.DrawImage($button, $destination)
    $buttonX += $buttonWidths[$index]
  }

  $graphics.DrawImageUnscaled($rail, 0, 0)
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($previewOutput)) | Out-Null
  $preview.Save($previewOutput, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $graphics.Dispose()
  $preview.Dispose()
  $selected.Dispose()
  $normal.Dispose()
  $rail.Dispose()
}

"Normal source bounds: $($bounds[0])"
"Selected source bounds: $($bounds[1])"
"Wrote $normalOutput"
"Wrote $selectedOutput"
"Wrote $previewOutput"
