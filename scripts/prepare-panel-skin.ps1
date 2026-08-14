param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$FrameOutputPath,
  [Parameter(Mandatory = $true)] [string]$TileOutputPath,
  [int]$FrameSize = 512,
  [int]$TileSize = 512
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class PanelSkinPreparation
{
    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    public static Rectangle Prepare(string inputPath, string frameOutputPath, string tileOutputPath, int frameSize, int tileSize)
    {
        if (frameSize <= 0 || tileSize <= 0 || tileSize % 2 != 0) throw new ArgumentOutOfRangeException();

        using (var source = new Bitmap(inputPath))
        using (var extracted = ExtractChroma(source))
        using (var contracted = ContractAlpha(extracted, 2))
        {
            var bounds = FindAlphaBounds(contracted, 8);
            SaveSquareFrame(contracted, bounds, frameOutputPath, frameSize);
            SaveMirroredTile(source, tileOutputPath, tileSize);
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
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque panel pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static void SaveSquareFrame(Bitmap source, Rectangle bounds, string outputPath, int outputSize)
    {
        var squareSize = Math.Max(bounds.Width, bounds.Height);
        var centerX = bounds.Left + bounds.Width / 2.0;
        var centerY = bounds.Top + bounds.Height / 2.0;
        var square = new RectangleF(
            (float)(centerX - squareSize / 2.0),
            (float)(centerY - squareSize / 2.0),
            squareSize,
            squareSize
        );

        using (var output = new Bitmap(outputSize, outputSize, PixelFormat.Format32bppArgb))
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
            graphics.DrawImage(source, new Rectangle(0, 0, outputSize, outputSize), square.X, square.Y, square.Width, square.Height, GraphicsUnit.Pixel, attributes);
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void SaveMirroredTile(Bitmap source, string outputPath, int tileSize)
    {
        var half = tileSize / 2;
        var sourceSize = Math.Min(half, Math.Min(source.Width, source.Height) / 3);
        var sourceLeft = (source.Width - sourceSize) / 2;
        var sourceTop = (source.Height - sourceSize) / 2;
        using (var patch = new Bitmap(half, half, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(patch))
        using (var output = new Bitmap(tileSize, tileSize, PixelFormat.Format32bppArgb))
        {
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.DrawImage(source, new Rectangle(0, 0, half, half), sourceLeft, sourceTop, sourceSize, sourceSize, GraphicsUnit.Pixel);

            for (var y = 0; y < half; y++) for (var x = 0; x < half; x++)
            {
                var color = patch.GetPixel(x, y);
                output.SetPixel(x, y, color);
                output.SetPixel(tileSize - 1 - x, y, color);
                output.SetPixel(x, tileSize - 1 - y, color);
                output.SetPixel(tileSize - 1 - x, tileSize - 1 - y, color);
            }
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
            output.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@

if (-not ("PanelSkinPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [PanelSkinPreparation]::Prepare($InputPath, $FrameOutputPath, $TileOutputPath, $FrameSize, $TileSize)
Write-Output "Panel bounds: [$($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)]"
Write-Output "Frame: ${FrameSize}x${FrameSize}"
Write-Output "Mirrored tile: ${TileSize}x${TileSize}"
