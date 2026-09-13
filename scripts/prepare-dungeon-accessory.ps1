param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath,
  [int]$CanvasWidth = 768,
  [int]$CanvasHeight = 512,
  [double]$Fill = 0.88,
  [double]$Bottom = 0.94
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class DungeonAccessoryPreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static void Prepare(
        string inputPath,
        string outputPath,
        int canvasWidth,
        int canvasHeight,
        double fill,
        double bottom)
    {
        if (canvasWidth <= 0 || canvasHeight <= 0) throw new ArgumentOutOfRangeException("canvas");
        if (fill <= 0 || fill > 1 || bottom <= 0 || bottom > 1) throw new ArgumentOutOfRangeException("placement");

        using (var source = new Bitmap(inputPath))
        using (var extracted = ExtractChroma(source))
        {
            var sourceBounds = FindAlphaBounds(extracted, 24);
            var scale = Math.Min(
                canvasWidth * fill / sourceBounds.Width,
                canvasHeight * fill / sourceBounds.Height
            );
            var targetWidth = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
            var targetHeight = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
            var targetX = (canvasWidth - targetWidth) / 2;
            var targetBottom = Math.Min(canvasHeight, (int)Math.Round(canvasHeight * bottom));
            var targetY = Math.Max(0, targetBottom - targetHeight);

            using (var output = new Bitmap(canvasWidth, canvasHeight, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            using (var attributes = new ImageAttributes())
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                attributes.SetWrapMode(WrapMode.TileFlipXY);
                graphics.DrawImage(
                    extracted,
                    new Rectangle(targetX, targetY, targetWidth, targetHeight),
                    sourceBounds.X,
                    sourceBounds.Y,
                    sourceBounds.Width,
                    sourceBounds.Height,
                    GraphicsUnit.Pixel,
                    attributes
                );
                graphics.Flush();

                var keyColor = source.GetPixel(0, 0);
                if (IsBrightMagenta(keyColor)) RemoveMagentaSpill(output);
                if (IsBrightGreen(keyColor)) RemoveGreenSpill(output);

                var directory = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    output.Save(stream, ImageFormat.Png);
                }
            }
        }
    }

    private static bool IsBrightMagenta(Color color)
    {
        return color.R > 180 && color.B > 170 && color.G < 80;
    }

    private static bool IsBrightGreen(Color color)
    {
        return color.G > 180 && color.G > color.R + 80 && color.G > color.B + 80;
    }

    private static bool IsMagentaDominant(Color color)
    {
        return color.R > color.G + 35 && color.B > color.G + 35;
    }

    private static void RemoveMagentaSpill(Bitmap image)
    {
        using (var source = (Bitmap)image.Clone())
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            var color = source.GetPixel(x, y);
            if (color.A == 0 || !IsMagentaDominant(color)) continue;
            Color replacement = Color.Empty;
            var bestDistance = int.MaxValue;
            for (var offsetY = -4; offsetY <= 4; offsetY++)
            for (var offsetX = -4; offsetX <= 4; offsetX++)
            {
                var neighborX = x + offsetX;
                var neighborY = y + offsetY;
                if (neighborX < 0 || neighborY < 0 || neighborX >= source.Width || neighborY >= source.Height) continue;
                var neighbor = source.GetPixel(neighborX, neighborY);
                if (neighbor.A < 220 || IsMagentaDominant(neighbor)) continue;
                var distance = offsetX * offsetX + offsetY * offsetY;
                if (distance >= bestDistance) continue;
                replacement = neighbor;
                bestDistance = distance;
            }
            if (replacement.IsEmpty)
            {
                image.SetPixel(x, y, Color.Transparent);
                continue;
            }
            image.SetPixel(x, y, Color.FromArgb(color.A, replacement.R, replacement.G, replacement.B));
        }
    }

    private static void RemoveGreenSpill(Bitmap image)
    {
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            var color = image.GetPixel(x, y);
            if (color.A == 0) continue;
            var neutralGreen = Math.Max(color.R, color.B);
            image.SetPixel(x, y, Color.FromArgb(
                color.A,
                color.R,
                color.G > neutralGreen ? neutralGreen : color.G,
                color.B
            ));
        }
    }

    private static Bitmap ExtractChroma(Bitmap source)
    {
        const int border = 12;
        double keyR = 0, keyG = 0, keyB = 0, count = 0;
        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            if (x >= border && y >= border && x < source.Width - border && y < source.Height - border) continue;
            var color = source.GetPixel(x, y);
            keyR += color.R;
            keyG += color.G;
            keyB += color.B;
            count++;
        }
        keyR /= count;
        keyG /= count;
        keyB /= count;
        var greenKey = keyG > 180 && keyG > keyR + 80 && keyG > keyB + 80;
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);

        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            double alpha;
            if (greenKey)
            {
                var keyDominance = Math.Max(1.0, keyG - Math.Max(keyR, keyB));
                var pixelDominance = Math.Max(0.0, color.G - Math.Max(color.R, color.B));
                alpha = Math.Max(0.0, Math.Min(1.0, 1.0 - pixelDominance / keyDominance));
            }
            else
            {
                var deltaR = color.R - keyR;
                var deltaG = color.G - keyG;
                var deltaB = color.B - keyB;
                var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
                alpha = Math.Max(0.0, Math.Min(1.0, (distance - 12.0) / 150.0));
                alpha = alpha * alpha * (3.0 - 2.0 * alpha);
            }
            if (alpha <= 0.035)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }
            output.SetPixel(x, y, Color.FromArgb(
                Clamp(alpha * 255.0),
                Clamp((color.R - (1.0 - alpha) * keyR) / alpha),
                Clamp((color.G - (1.0 - alpha) * keyG) / alpha),
                Clamp((color.B - (1.0 - alpha) * keyB) / alpha)
            ));
        }
        return output;
    }

    private static Rectangle FindAlphaBounds(Bitmap image, byte threshold)
    {
        var minX = image.Width;
        var minY = image.Height;
        var maxX = -1;
        var maxY = -1;
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            if (image.GetPixel(x, y).A <= threshold) continue;
            minX = Math.Min(minX, x);
            minY = Math.Min(minY, y);
            maxX = Math.Max(maxX, x);
            maxY = Math.Max(maxY, y);
        }
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque accessory pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

if (-not ("DungeonAccessoryPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

[DungeonAccessoryPreparation]::Prepare(
  $InputPath,
  $OutputPath,
  $CanvasWidth,
  $CanvasHeight,
  $Fill,
  $Bottom
)
Write-Output "Prepared dungeon accessory at $OutputPath"
