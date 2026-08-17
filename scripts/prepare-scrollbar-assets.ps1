param(
  [Parameter(Mandatory = $true)] [string]$ThumbInputPath,
  [Parameter(Mandatory = $true)] [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class ScrollbarAssetPreparation
{
    public static void Prepare(string thumbInputPath, string outputDirectory)
    {
        Directory.CreateDirectory(outputDirectory);

        using (var thumb = new Bitmap(thumbInputPath))
        {
            var bounds = FindAlphaBounds(thumb, 180);
            var topSourceHeight = Math.Min(bounds.Height, (int)Math.Round(bounds.Width * 2.8));
            var bottomSourceHeight = Math.Min(bounds.Height - topSourceHeight, (int)Math.Round(bounds.Width * 1.15));
            var centerSourceHeight = Math.Max(12, bounds.Width / 4);
            var centerSourceTop = bounds.Top + (bounds.Height - centerSourceHeight) / 2;

            using (var top = ResizeToCanvas(thumb, new Rectangle(bounds.Left, bounds.Top, bounds.Width, topSourceHeight), 14, 32))
            using (var middleVertical = ResizeToCanvas(thumb, new Rectangle(bounds.Left, centerSourceTop, bounds.Width, centerSourceHeight), 14, 4))
            using (var bottom = ResizeToCanvas(thumb, new Rectangle(bounds.Left, bounds.Bottom - bottomSourceHeight, bounds.Width, bottomSourceHeight), 14, 14))
            using (var left = RotateClockwise(bottom))
            using (var middleHorizontal = RotateClockwise(middleVertical))
            using (var right = RotateClockwise(top))
            {
                top.Save(Path.Combine(outputDirectory, "scrollbar-thumb-top-v4.png"), ImageFormat.Png);
                middleVertical.Save(Path.Combine(outputDirectory, "scrollbar-thumb-middle-vertical-v4.png"), ImageFormat.Png);
                bottom.Save(Path.Combine(outputDirectory, "scrollbar-thumb-bottom-v4.png"), ImageFormat.Png);
                left.Save(Path.Combine(outputDirectory, "scrollbar-thumb-left-v4.png"), ImageFormat.Png);
                middleHorizontal.Save(Path.Combine(outputDirectory, "scrollbar-thumb-middle-horizontal-v4.png"), ImageFormat.Png);
                right.Save(Path.Combine(outputDirectory, "scrollbar-thumb-right-v4.png"), ImageFormat.Png);
            }
        }
    }

    private static Bitmap ResizeToCanvas(Bitmap source, Rectangle bounds, int width, int height)
    {
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
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
            graphics.DrawImage(source, new Rectangle(0, 0, width, height), bounds.X, bounds.Y, bounds.Width, bounds.Height, GraphicsUnit.Pixel, attributes);
            graphics.Flush();
        }
        return output;
    }

    private static Bitmap RotateClockwise(Bitmap source)
    {
        var output = new Bitmap(source.Height, source.Width, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++)
        {
            output.SetPixel(source.Height - 1 - y, x, source.GetPixel(x, y));
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
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No opaque asset pixels found.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

}
'@

if (-not ("ScrollbarAssetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

[ScrollbarAssetPreparation]::Prepare($ThumbInputPath, $OutputDirectory)
Write-Output "Prepared fixed-cap scrollbar thumb assets in $OutputDirectory"
