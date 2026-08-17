param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class BuildingCostVellumPreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static void Prepare(string inputPath, string outputPath)
    {
        using (var source = new Bitmap(inputPath))
        using (var extracted = ExtractChroma(source))
        {
            var bounds = FindAlphaBounds(extracted, 180);
            using (var output = new Bitmap(1024, 256, PixelFormat.Format32bppArgb))
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
                graphics.DrawImage(extracted, new Rectangle(0, 0, 1024, 256), bounds.X, bounds.Y, bounds.Width, bounds.Height, GraphicsUnit.Pixel, attributes);
                graphics.Flush();
                RemoveMagenta(output);

                var directory = Path.GetDirectoryName(outputPath);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }

    private static Bitmap ExtractChroma(Bitmap source)
    {
        const int border = 16;
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
            if (IsMagenta(color))
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }
            var deltaR = color.R - keyR;
            var deltaG = color.G - keyG;
            var deltaB = color.B - keyB;
            var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
            var alpha = Math.Max(0.0, Math.Min(1.0, (distance - 18.0) / 96.0));
            alpha = alpha * alpha * (3.0 - 2.0 * alpha);
            if (alpha <= 0.08)
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

    private static bool IsMagenta(Color color)
    {
        return color.R > 120 && color.B > 90 && color.R > color.G + 15 && color.B > color.G + 12;
    }

    private static void RemoveMagenta(Bitmap image)
    {
        for (var y = 0; y < image.Height; y++) for (var x = 0; x < image.Width; x++)
        {
            if (IsMagenta(image.GetPixel(x, y))) image.SetPixel(x, y, Color.Transparent);
        }
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
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque vellum pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

if (-not ("BuildingCostVellumPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

[BuildingCostVellumPreparation]::Prepare($InputPath, $OutputPath)
Write-Output "Prepared building cost vellum asset at $OutputPath"
