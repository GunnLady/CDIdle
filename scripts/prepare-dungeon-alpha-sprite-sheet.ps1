param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$ReferencePath,
  [Parameter(Mandatory = $true)] [string[]]$OutputPaths
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class DungeonAlphaSpriteSheetPreparation
{
    public static void Prepare(string inputPath, string referencePath, string[] outputPaths)
    {
        if (outputPaths == null || outputPaths.Length == 0)
            throw new ArgumentException("At least one output path is required.", "outputPaths");

        using (var source = new Bitmap(inputPath))
        using (var reference = new Bitmap(referencePath))
        using (var prepared = HasTransparentPixel(source) ? CopyArgb(source) : ExtractChroma(source))
        {
            var referenceBounds = FindAlphaBounds(reference, new Rectangle(0, 0, reference.Width, reference.Height), 24);
            for (var index = 0; index < outputPaths.Length; index++)
            {
                var left = prepared.Width * index / outputPaths.Length;
                var right = prepared.Width * (index + 1) / outputPaths.Length;
                var cell = Rectangle.FromLTRB(left, 0, right, prepared.Height);
                var sourceBounds = FindAlphaBounds(prepared, cell, 24);
                WriteSprite(prepared, sourceBounds, reference, referenceBounds, outputPaths[index]);
            }
        }
    }

    private static bool HasTransparentPixel(Bitmap image)
    {
        if (!Image.IsAlphaPixelFormat(image.PixelFormat)) return false;
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
            if (image.GetPixel(x, y).A < 255) return true;
        return false;
    }

    private static Bitmap CopyArgb(Bitmap source)
    {
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        {
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, 0, 0);
        }
        return output;
    }

    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }

    private static Bitmap ExtractChroma(Bitmap source)
    {
        const double keyR = 255.0;
        const double keyG = 0.0;
        const double keyB = 255.0;
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++)
        for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            var deltaR = color.R - keyR;
            var deltaG = color.G - keyG;
            var deltaB = color.B - keyB;
            var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
            var alpha = Math.Max(0.0, Math.Min(1.0, (distance - 14.0) / 190.0));
            alpha = alpha * alpha * (3.0 - 2.0 * alpha);
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

    private static void WriteSprite(
        Bitmap source,
        Rectangle sourceBounds,
        Bitmap reference,
        Rectangle referenceBounds,
        string outputPath)
    {
        var scale = Math.Min(
            referenceBounds.Width / (double)sourceBounds.Width,
            referenceBounds.Height / (double)sourceBounds.Height);
        var width = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
        var height = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
        var target = new Rectangle(
            referenceBounds.Left + (referenceBounds.Width - width) / 2,
            referenceBounds.Bottom - height,
            width,
            height);

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
                source,
                target,
                sourceBounds.X,
                sourceBounds.Y,
                sourceBounds.Width,
                sourceBounds.Height,
                GraphicsUnit.Pixel,
                attributes);
            graphics.Flush();

            var directory = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                output.Save(stream, ImageFormat.Png);
        }
    }

    private static Rectangle FindAlphaBounds(Bitmap image, Rectangle region, byte threshold)
    {
        var minX = region.Right;
        var minY = region.Bottom;
        var maxX = -1;
        var maxY = -1;
        for (var y = region.Top; y < region.Bottom; y++)
        for (var x = region.Left; x < region.Right; x++)
        {
            if (image.GetPixel(x, y).A <= threshold) continue;
            minX = Math.Min(minX, x);
            minY = Math.Min(minY, y);
            maxX = Math.Max(maxX, x);
            maxY = Math.Max(maxY, y);
        }

        if (maxX < minX || maxY < minY)
            throw new InvalidOperationException("No opaque sprite pixels found in one sheet cell.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }
}
'@

if (-not ("DungeonAlphaSpriteSheetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedReference = (Resolve-Path -LiteralPath $ReferencePath).Path
$resolvedOutputs = $OutputPaths | ForEach-Object { [System.IO.Path]::GetFullPath($_) }

[DungeonAlphaSpriteSheetPreparation]::Prepare(
  $resolvedInput,
  $resolvedReference,
  [string[]]$resolvedOutputs
)

$resolvedOutputs | ForEach-Object { Write-Output "Prepared dungeon alpha sprite at $_" }
