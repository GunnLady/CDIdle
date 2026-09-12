param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$ReferencePath,
  [Parameter(Mandatory = $true)] [string]$OutputPath,
  [switch]$PreserveCanvasFraming
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class DungeonCharacterSpritePreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static void Prepare(string inputPath, string referencePath, string outputPath, bool preserveCanvasFraming)
    {
        using (var source = new Bitmap(inputPath))
        using (var reference = new Bitmap(referencePath))
        using (var extracted = ExtractChroma(source))
        {
            var sourceBounds = preserveCanvasFraming
                ? new Rectangle(0, 0, source.Width, source.Height)
                : FindAlphaBounds(extracted, 32);
            var targetBounds = preserveCanvasFraming
                ? new Rectangle(0, 0, reference.Width, reference.Height)
                : FindAlphaBounds(reference, 32);
            using (var output = new Bitmap(reference.Width, reference.Height, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            using (var attributes = new ImageAttributes())
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;
                graphics.SmoothingMode = SmoothingMode.None;
                attributes.SetWrapMode(WrapMode.TileFlipXY);
                graphics.DrawImage(
                    extracted,
                    targetBounds,
                    sourceBounds.X,
                    sourceBounds.Y,
                    sourceBounds.Width,
                    sourceBounds.Height,
                    GraphicsUnit.Pixel,
                    attributes
                );
                graphics.Flush();
                var keyColor = source.GetPixel(0, 0);
                if (IsBrightMagenta(keyColor))
                {
                    RemoveBrightChroma(output);
                }
                else if (IsBrightGreen(keyColor))
                {
                    RemoveGreenSpill(output);
                }

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
        return color.R > 100 && color.B > 90 && color.G < 40 &&
            color.R > color.G + 45 && color.B > color.G + 45;
    }

    private static bool IsBrightGreen(Color color)
    {
        return color.G > 180 && color.G > color.R + 80 && color.G > color.B + 80;
    }

    private static void RemoveGreenSpill(Bitmap image)
    {
        using (var source = (Bitmap)image.Clone())
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            var color = source.GetPixel(x, y);
            if (color.A == 0) continue;
            var red = color.R;
            var green = color.G;
            var blue = color.B;
            if (IsNearTransparent(source, x, y, 2) && green > red + 12 && blue > red + 12)
            {
                // Green-screen antialiasing can leave a cyan edge after color
                // reconstruction. Restore its missing red component while
                // preserving the luminance of pale whiskers and metal edges.
                red = Math.Max(green, blue);
            }
            var neutralGreen = Math.Max(red, blue);
            if (green > neutralGreen)
            {
                green = neutralGreen;
            }
            image.SetPixel(x, y, Color.FromArgb(color.A, red, green, blue));
        }
    }

    private static bool IsNearTransparent(Bitmap image, int x, int y, int radius)
    {
        for (var offsetY = -radius; offsetY <= radius; offsetY++)
        for (var offsetX = -radius; offsetX <= radius; offsetX++)
        {
            var neighborX = x + offsetX;
            var neighborY = y + offsetY;
            if (neighborX < 0 || neighborY < 0 || neighborX >= image.Width || neighborY >= image.Height) return true;
            if (image.GetPixel(neighborX, neighborY).A == 0) return true;
        }
        return false;
    }

    private static void RemoveBrightChroma(Bitmap image)
    {
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            var color = image.GetPixel(x, y);
            if (color.A == 0) continue;
            if (color.R > 100 && color.B > 90 && color.G < 40 &&
                color.R > color.G + 45 && color.B > color.G + 45)
            {
                image.SetPixel(x, y, Color.Transparent);
            }
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
        var isGreenKey = keyG > 180 && keyG > keyR + 80 && keyG > keyB + 80;

        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            double alpha;
            if (isGreenKey)
            {
                // With a pure green screen, channel dominance gives the actual
                // coverage of pale one-pixel details (whiskers, hair, weapon
                // edges) more faithfully than an RGB-distance threshold.
                var keyDominance = Math.Max(1.0, keyG - Math.Max(keyR, keyB));
                var pixelDominance = Math.Max(0.0, color.G - Math.Max(color.R, color.B));
                alpha = Math.Max(0.0, Math.Min(1.0, 1.0 - (pixelDominance / keyDominance)));
            }
            else
            {
                var deltaR = color.R - keyR;
                var deltaG = color.G - keyG;
                var deltaB = color.B - keyB;
                var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
                // A wide transition removes the bright magenta/black antialias mix
                // without affecting opaque burgundy, brown or neutral sprite pixels.
                alpha = Math.Max(0.0, Math.Min(1.0, (distance - 14.0) / 190.0));
                alpha = alpha * alpha * (3.0 - 2.0 * alpha);
            }
            if (alpha <= 0.04)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }

            var red = (color.R - (1.0 - alpha) * keyR) / alpha;
            var green = (color.G - (1.0 - alpha) * keyG) / alpha;
            var blue = (color.B - (1.0 - alpha) * keyB) / alpha;
            output.SetPixel(x, y, Color.FromArgb(Clamp(alpha * 255.0), Clamp(red), Clamp(green), Clamp(blue)));
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
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque sprite pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

if (-not ("DungeonCharacterSpritePreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

[DungeonCharacterSpritePreparation]::Prepare($InputPath, $ReferencePath, $OutputPath, $PreserveCanvasFraming.IsPresent)
Write-Output "Prepared dungeon character sprite at $OutputPath"
