param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$MedallionOutputPath,
  [Parameter(Mandatory = $true)] [string]$BarFrameOutputPath,
  [switch]$PreserveChromaOpening
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

public static class DungeonPartyUiPreparation
{
    public static Rectangle[] Prepare(string inputPath, string medallionPath, string barPath, bool preserveChromaOpening)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            var alpha = BuildChromaAlpha(source);
            var splitX = (int)Math.Round(source.Width * 0.39);
            var regions = new[] {
                new Rectangle(0, 0, splitX, source.Height),
                new Rectangle(splitX, 0, source.Width - splitX, source.Height)
            };
            var bounds = new[] {
                FindBounds(alpha, source.Width, regions[0]),
                FindBounds(alpha, source.Width, regions[1])
            };

            using (var medallion = CropWithAlpha(source, alpha, bounds[0]))
            using (var bar = CropWithAlpha(source, alpha, bounds[1]))
            using (var medallionRuntime = ResizeContained(medallion, 192, 192))
            using (var barRuntime = ResizeContained(bar, 248, 32))
            {
                if (!preserveChromaOpening) PunchCircularHole(medallionRuntime, 65.0, 2.0);
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(medallionPath)));
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(barPath)));
                medallionRuntime.Save(medallionPath, ImageFormat.Png);
                barRuntime.Save(barPath, ImageFormat.Png);
            }
            return bounds;
        }
    }

    private static Bitmap ToArgb(Bitmap source)
    {
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output)) {
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, 0, 0);
        }
        return output;
    }

    private static byte[] BuildChromaAlpha(Bitmap source)
    {
        var rect = new Rectangle(0, 0, source.Width, source.Height);
        var data = source.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try {
            var bytes = new byte[Math.Abs(data.Stride) * source.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            var alpha = new byte[source.Width * source.Height];
            for (var y = 0; y < source.Height; y++) for (var x = 0; x < source.Width; x++) {
                var index = y * data.Stride + x * 4;
                var blue = bytes[index]; var green = bytes[index + 1]; var red = bytes[index + 2];
                var dominance = green - Math.Max(red, blue);
                alpha[y * source.Width + x] = green >= 80 && dominance >= 90 ? (byte)0
                    : green < 80 || dominance <= 15 ? (byte)255
                    : (byte)Math.Round(255.0 * (90 - dominance) / 75.0);
            }
            return alpha;
        } finally { source.UnlockBits(data); }
    }

    private static Rectangle FindBounds(byte[] alpha, int sourceWidth, Rectangle region)
    {
        var minX = region.Right; var minY = region.Bottom; var maxX = region.Left - 1; var maxY = region.Top - 1;
        for (var y = region.Top; y < region.Bottom; y++) for (var x = region.Left; x < region.Right; x++) {
            if (alpha[y * sourceWidth + x] <= 24) continue;
            minX = Math.Min(minX, x); minY = Math.Min(minY, y); maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
        }
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("No visible component detected.");
        const int padding = 3;
        return Rectangle.FromLTRB(Math.Max(region.Left, minX - padding), Math.Max(region.Top, minY - padding), Math.Min(region.Right, maxX + padding + 1), Math.Min(region.Bottom, maxY + padding + 1));
    }

    private static Bitmap CropWithAlpha(Bitmap source, byte[] alpha, Rectangle bounds)
    {
        var output = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb);
        var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var outputData = output.LockBits(new Rectangle(0, 0, output.Width, output.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        try {
            var sourceBytes = new byte[Math.Abs(sourceData.Stride) * source.Height];
            var outputBytes = new byte[Math.Abs(outputData.Stride) * output.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);
            for (var y = 0; y < bounds.Height; y++) for (var x = 0; x < bounds.Width; x++) {
                var sx = bounds.X + x; var sy = bounds.Y + y;
                var si = sy * sourceData.Stride + sx * 4; var oi = y * outputData.Stride + x * 4;
                var blue = sourceBytes[si]; var green = sourceBytes[si + 1]; var red = sourceBytes[si + 2];
                green = (byte)Math.Min(green, Math.Max(red, blue));
                outputBytes[oi] = blue; outputBytes[oi + 1] = green; outputBytes[oi + 2] = red; outputBytes[oi + 3] = alpha[sy * source.Width + sx];
            }
            Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
        } finally { source.UnlockBits(sourceData); output.UnlockBits(outputData); }
        return output;
    }

    private static Bitmap ResizeContained(Bitmap source, int width, int height)
    {
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        var ratio = Math.Min(width / (double)source.Width, height / (double)source.Height);
        var drawWidth = (int)Math.Round(source.Width * ratio); var drawHeight = (int)Math.Round(source.Height * ratio);
        using (var graphics = Graphics.FromImage(output)) using (var attributes = new ImageAttributes()) {
            graphics.Clear(Color.Transparent); graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.CompositingQuality = CompositingQuality.HighQuality; graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality; graphics.SmoothingMode = SmoothingMode.HighQuality;
            attributes.SetWrapMode(WrapMode.TileFlipXY);
            graphics.DrawImage(source, new Rectangle((width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight), 0, 0, source.Width, source.Height, GraphicsUnit.Pixel, attributes);
        }
        return output;
    }

    private static void PunchCircularHole(Bitmap bitmap, double radius, double feather)
    {
        var rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try {
            var bytes = new byte[Math.Abs(data.Stride) * bitmap.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            var centerX = (bitmap.Width - 1) / 2.0;
            var centerY = (bitmap.Height - 1) / 2.0;
            var outerRadius = radius + feather;

            for (var y = 0; y < bitmap.Height; y++) for (var x = 0; x < bitmap.Width; x++) {
                var dx = x - centerX;
                var dy = y - centerY;
                var distance = Math.Sqrt(dx * dx + dy * dy);
                if (distance >= outerRadius) continue;

                var index = y * data.Stride + x * 4;
                var originalAlpha = bytes[index + 3];
                var holeFactor = distance <= radius ? 0.0 : (distance - radius) / feather;
                bytes[index + 3] = (byte)Math.Round(originalAlpha * holeFactor);
                if (bytes[index + 3] == 0) {
                    bytes[index] = 0;
                    bytes[index + 1] = 0;
                    bytes[index + 2] = 0;
                }
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
        } finally { bitmap.UnlockBits(data); }
    }
}
'@

if (-not ("DungeonPartyUiPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [DungeonPartyUiPreparation]::Prepare($InputPath, $MedallionOutputPath, $BarFrameOutputPath, $PreserveChromaOpening.IsPresent)
Write-Output "Medallion source bounds: $($bounds[0].X),$($bounds[0].Y) $($bounds[0].Width)x$($bounds[0].Height)"
Write-Output "Bar source bounds: $($bounds[1].X),$($bounds[1].Y) $($bounds[1].Width)x$($bounds[1].Height)"
Write-Output "Medallion runtime: 192x192"
Write-Output "Bar runtime: 248x32"
