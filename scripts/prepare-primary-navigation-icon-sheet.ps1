param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$CityOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$HeroesOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$DungeonOutputPath,

  [Parameter(Mandatory = $true)]
  [string]$StorageOutputPath
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

public static class PrimaryNavigationIconSheetPreparation
{
    private const int RuntimeSize = 192;

    public static Rectangle[] Prepare(
        string inputPath,
        string cityOutputPath,
        string heroesOutputPath,
        string dungeonOutputPath,
        string storageOutputPath)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            if (source.Width % 2 != 0 || source.Height % 2 != 0)
            {
                throw new InvalidOperationException("The sprite sheet must have even dimensions for exact quadrant extraction.");
            }

            var cellWidth = source.Width / 2;
            var cellHeight = source.Height / 2;
            var cells = new[]
            {
                new Rectangle(0, 0, cellWidth, cellHeight),
                new Rectangle(cellWidth, 0, cellWidth, cellHeight),
                new Rectangle(0, cellHeight, cellWidth, cellHeight),
                new Rectangle(cellWidth, cellHeight, cellWidth, cellHeight),
            };
            var outputs = new[] { cityOutputPath, heroesOutputPath, dungeonOutputPath, storageOutputPath };
            var alpha = BuildChromaAlpha(source);
            var visibleBounds = new Rectangle[cells.Length];

            for (var index = 0; index < cells.Length; index++)
            {
                visibleBounds[index] = FindVisibleBounds(alpha, source.Width, cells[index]);
                using (var cell = CropCellWithAlpha(source, alpha, cells[index]))
                using (var runtime = ResizeWholeCell(cell))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputs[index])));
                    runtime.Save(outputs[index], ImageFormat.Png);
                }
            }

            return visibleBounds;
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

                    alpha[y * source.Width + x] = green >= 80 && dominance >= 90
                        ? (byte)0
                        : green < 80 || dominance <= 15
                            ? (byte)255
                            : (byte)Math.Round(255.0 * (90 - dominance) / 75.0);
                }
            }

            return alpha;
        }
        finally
        {
            source.UnlockBits(data);
        }
    }

    private static Rectangle FindVisibleBounds(byte[] alpha, int sourceWidth, Rectangle cell)
    {
        var minX = cell.Right;
        var minY = cell.Bottom;
        var maxX = cell.Left - 1;
        var maxY = cell.Top - 1;

        for (var y = cell.Top; y < cell.Bottom; y++)
        {
            for (var x = cell.Left; x < cell.Right; x++)
            {
                if (alpha[y * sourceWidth + x] <= 24)
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
            throw new InvalidOperationException("One sprite-sheet quadrant contains no visible icon.");
        }

        return new Rectangle(minX - cell.Left, minY - cell.Top, maxX - minX + 1, maxY - minY + 1);
    }

    private static Bitmap CropCellWithAlpha(Bitmap source, byte[] alpha, Rectangle cell)
    {
        var output = new Bitmap(cell.Width, cell.Height, PixelFormat.Format32bppArgb);
        var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var outputData = output.LockBits(new Rectangle(0, 0, output.Width, output.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        try
        {
            var sourceBytes = new byte[Math.Abs(sourceData.Stride) * source.Height];
            var outputBytes = new byte[Math.Abs(outputData.Stride) * output.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);

            for (var y = 0; y < cell.Height; y++)
            {
                for (var x = 0; x < cell.Width; x++)
                {
                    var sourceX = cell.X + x;
                    var sourceY = cell.Y + y;
                    var sourceIndex = sourceY * sourceData.Stride + sourceX * 4;
                    var outputIndex = y * outputData.Stride + x * 4;
                    var alphaValue = alpha[sourceY * source.Width + sourceX];
                    var blue = sourceBytes[sourceIndex];
                    var green = sourceBytes[sourceIndex + 1];
                    var red = sourceBytes[sourceIndex + 2];

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

    private static Bitmap ResizeWholeCell(Bitmap cell)
    {
        var output = new Bitmap(RuntimeSize, RuntimeSize, PixelFormat.Format32bppArgb);
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
            graphics.DrawImage(cell, new Rectangle(0, 0, RuntimeSize, RuntimeSize), 0, 0, cell.Width, cell.Height, GraphicsUnit.Pixel, attributes);
        }
        return output;
    }
}
'@

if (-not ("PrimaryNavigationIconSheetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [PrimaryNavigationIconSheetPreparation]::Prepare(
  $InputPath,
  $CityOutputPath,
  $HeroesOutputPath,
  $DungeonOutputPath,
  $StorageOutputPath
)

$names = @("city", "heroes", "dungeon", "storage")
for ($index = 0; $index -lt $bounds.Length; $index++) {
  $bound = $bounds[$index]
  Write-Output "$($names[$index]) bounds in source cell: $($bound.X),$($bound.Y) $($bound.Width)x$($bound.Height)"
}
Write-Output "Runtime cell size: 192x192"
