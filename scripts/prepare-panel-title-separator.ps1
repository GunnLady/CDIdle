param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath,
  [int]$Width = 1024,
  [int]$Height = 48
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class PanelTitleSeparatorPreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static Rectangle Prepare(string inputPath, string outputPath, int width, int height)
    {
        if (width <= 0 || height <= 0) throw new ArgumentOutOfRangeException();

        using (var source = new Bitmap(inputPath))
        using (var extracted = ExtractChroma(source))
        {
            var bounds = FindAlphaBounds(extracted, 180);
            using (var output = new Bitmap(width, height, PixelFormat.Format32bppArgb))
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
                    new Rectangle(0, 0, width, height),
                    bounds.X,
                    bounds.Y,
                    bounds.Width,
                    bounds.Height,
                    GraphicsUnit.Pixel,
                    attributes
                );
                graphics.Flush();
                for (var y = 0; y < output.Height; y++) for (var x = 0; x < output.Width; x++)
                {
                    var color = output.GetPixel(x, y);
                    if (color.R > 150 && color.B > 100 && color.R > color.G + 50 && color.B > color.G + 35)
                    {
                        output.SetPixel(x, y, Color.Transparent);
                    }
                }
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
                output.Save(outputPath, ImageFormat.Png);
            }
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
            if (color.R > 150 && color.B > 100 && color.R > color.G + 50 && color.B > color.G + 35)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }
            var deltaR = color.R - keyR;
            var deltaG = color.G - keyG;
            var deltaB = color.B - keyB;
            var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
            var alpha = Math.Max(0.0, Math.Min(1.0, (distance - 20.0) / 92.0));
            alpha = alpha * alpha * (3.0 - 2.0 * alpha);
            if (alpha <= 0.15)
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
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No separator pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

if (-not ("PanelTitleSeparatorPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [PanelTitleSeparatorPreparation]::Prepare($InputPath, $OutputPath, $Width, $Height)
Write-Output "Separator bounds: [$($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)]"
Write-Output "Runtime separator: ${Width}x${Height}"
