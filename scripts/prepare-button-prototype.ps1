param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public static class ButtonPrototypePreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static Rectangle Prepare(string inputPath, string outputPath)
    {
        using (var source = new Bitmap(inputPath))
        using (var extracted = ExtractChroma(source))
        using (var contracted = ContractAlpha(extracted, 1))
        {
            var bounds = FindAlphaBounds(contracted, 8);
            var padding = 4;
            bounds = Rectangle.FromLTRB(
                Math.Max(0, bounds.Left - padding),
                Math.Max(0, bounds.Top - padding),
                Math.Min(contracted.Width, bounds.Right + padding),
                Math.Min(contracted.Height, bounds.Bottom + padding)
            );
            SaveCrop(contracted, bounds, outputPath);
            return bounds;
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

        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            var deltaR = color.R - keyR;
            var deltaG = color.G - keyG;
            var deltaB = color.B - keyB;
            var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
            var alpha = Math.Max(0.0, Math.Min(1.0, (distance - 22.0) / 98.0));
            alpha = alpha * alpha * (3.0 - 2.0 * alpha);
            if (alpha <= 0.02)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }

            var red = (color.R - (1.0 - alpha) * keyR) / alpha;
            var green = (color.G - (1.0 - alpha) * keyG) / alpha;
            var blue = (color.B - (1.0 - alpha) * keyB) / alpha;
            if (alpha < 0.98)
            {
                var magentaSpill = Math.Max(0, Math.Min(red, blue) - green);
                red -= magentaSpill;
                blue -= magentaSpill;
            }
            output.SetPixel(x, y, Color.FromArgb(Clamp(alpha * 255.0), Clamp(red), Clamp(green), Clamp(blue)));
        }
        return output;
    }

    private static Bitmap ContractAlpha(Bitmap source, int radius)
    {
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            var alpha = 255;
            for (var offsetY = -radius; offsetY <= radius; offsetY++) for (var offsetX = -radius; offsetX <= radius; offsetX++)
            {
                var sampleX = x + offsetX;
                var sampleY = y + offsetY;
                if (sampleX < 0 || sampleY < 0 || sampleX >= source.Width || sampleY >= source.Height)
                {
                    alpha = 0;
                    continue;
                }
                alpha = Math.Min(alpha, source.GetPixel(sampleX, sampleY).A);
            }
            if (alpha == 0)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }
            var color = source.GetPixel(x, y);
            output.SetPixel(x, y, Color.FromArgb(alpha, color.R, color.G, color.B));
        }
        return output;
    }

    private static Rectangle FindAlphaBounds(Bitmap image, byte threshold)
    {
        var minX = image.Width;
        var minY = image.Height;
        var maxX = -1;
        var maxY = -1;
        var safeMargin = Math.Max(8, Math.Min(image.Width, image.Height) / 40);
        for (var y = safeMargin; y < image.Height - safeMargin; y++) for (var x = safeMargin; x < image.Width - safeMargin; x++)
        {
            if (image.GetPixel(x, y).A <= threshold) continue;
            minX = Math.Min(minX, x);
            minY = Math.Min(minY, y);
            maxX = Math.Max(maxX, x);
            maxY = Math.Max(maxY, y);
        }
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque button pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static void SaveCrop(Bitmap source, Rectangle bounds, string outputPath)
    {
        using (var output = source.Clone(bounds, PixelFormat.Format32bppArgb))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
            output.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@

if (-not ("ButtonPrototypePreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [ButtonPrototypePreparation]::Prepare($InputPath, $OutputPath)
Write-Output "Button bounds: [$($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)]"
