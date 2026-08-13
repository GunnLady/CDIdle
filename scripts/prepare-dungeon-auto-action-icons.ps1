param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$PlayOutputPath,
  [Parameter(Mandatory = $true)] [string]$PauseOutputPath
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

public static class DungeonAutoActionIconPreparation
{
    private const int RuntimeSize = 192;

    public static Rectangle[] Prepare(string inputPath, string playPath, string pausePath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            if (source.Width % 2 != 0) throw new InvalidOperationException("The icon sheet width must be even.");
            var alpha = BuildChromaAlpha(source);
            var cellWidth = source.Width / 2;
            var cells = new[] {
                new Rectangle(0, 0, cellWidth, source.Height),
                new Rectangle(cellWidth, 0, cellWidth, source.Height)
            };
            var outputs = new[] { playPath, pausePath };
            var bounds = new Rectangle[2];

            for (var index = 0; index < cells.Length; index++)
            {
                bounds[index] = FindBounds(alpha, source.Width, cells[index]);
                var absoluteBounds = new Rectangle(
                    cells[index].X + bounds[index].X,
                    cells[index].Y + bounds[index].Y,
                    bounds[index].Width,
                    bounds[index].Height
                );
                using (var icon = CropCellWithAlpha(source, alpha, absoluteBounds))
                using (var runtime = ResizeIcon(icon))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputs[index])));
                    runtime.Save(outputs[index], ImageFormat.Png);
                }
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

    private static Rectangle FindBounds(byte[] alpha, int sourceWidth, Rectangle cell)
    {
        var minX = cell.Right; var minY = cell.Bottom; var maxX = cell.Left - 1; var maxY = cell.Top - 1;
        for (var y = cell.Top; y < cell.Bottom; y++) for (var x = cell.Left; x < cell.Right; x++) {
            if (alpha[y * sourceWidth + x] <= 24) continue;
            minX = Math.Min(minX, x); minY = Math.Min(minY, y); maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
        }
        if (maxX < minX || maxY < minY) throw new InvalidOperationException("One icon cell is empty.");
        return new Rectangle(minX - cell.Left, minY - cell.Top, maxX - minX + 1, maxY - minY + 1);
    }

    private static Bitmap CropCellWithAlpha(Bitmap source, byte[] alpha, Rectangle cell)
    {
        var output = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb);
        var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var outputData = output.LockBits(new Rectangle(0, 0, output.Width, output.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        try {
            var sourceBytes = new byte[Math.Abs(sourceData.Stride) * source.Height];
            var outputBytes = new byte[Math.Abs(outputData.Stride) * output.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);
            for (var y = 0; y < cell.Height; y++) for (var x = 0; x < cell.Width; x++) {
                var sx = cell.X + x; var sy = cell.Y + y;
                var si = sy * sourceData.Stride + sx * 4; var oi = y * outputData.Stride + x * 4;
                var blue = sourceBytes[si]; var green = sourceBytes[si + 1]; var red = sourceBytes[si + 2];
                green = (byte)Math.Min(green, Math.Max(red, blue));
                outputBytes[oi] = blue; outputBytes[oi + 1] = green; outputBytes[oi + 2] = red; outputBytes[oi + 3] = alpha[sy * source.Width + sx];
            }
            Marshal.Copy(outputBytes, 0, outputData.Scan0, outputBytes.Length);
        } finally { source.UnlockBits(sourceData); output.UnlockBits(outputData); }
        return output;
    }

    private static Bitmap ResizeIcon(Bitmap icon)
    {
        var output = new Bitmap(RuntimeSize, RuntimeSize, PixelFormat.Format32bppArgb);
        const int targetHeight = 180;
        var ratio = targetHeight / (double)icon.Height;
        var drawWidth = (int)Math.Round(icon.Width * ratio);
        var drawHeight = targetHeight;
        using (var graphics = Graphics.FromImage(output)) using (var attributes = new ImageAttributes()) {
            graphics.Clear(Color.Transparent); graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.CompositingQuality = CompositingQuality.HighQuality; graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality; graphics.SmoothingMode = SmoothingMode.HighQuality;
            attributes.SetWrapMode(WrapMode.TileFlipXY);
            graphics.DrawImage(icon, new Rectangle((RuntimeSize - drawWidth) / 2, (RuntimeSize - drawHeight) / 2, drawWidth, drawHeight), 0, 0, icon.Width, icon.Height, GraphicsUnit.Pixel, attributes);
        }
        return output;
    }
}
'@

if (-not ("DungeonAutoActionIconPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [DungeonAutoActionIconPreparation]::Prepare($InputPath, $PlayOutputPath, $PauseOutputPath)
Write-Output "Play bounds in source cell: $($bounds[0].X),$($bounds[0].Y) $($bounds[0].Width)x$($bounds[0].Height)"
Write-Output "Pause bounds in source cell: $($bounds[1].X),$($bounds[1].Y) $($bounds[1].Width)x$($bounds[1].Height)"
Write-Output "Runtime cell size: 192x192"
