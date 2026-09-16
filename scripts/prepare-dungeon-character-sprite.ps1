param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$ReferencePath,
  [Parameter(Mandatory = $true)] [string]$OutputPath,
  [switch]$PreserveCanvasFraming,
  [switch]$MatchReferenceHeight
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Collections.Generic;
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

    public static void Prepare(
        string inputPath,
        string referencePath,
        string outputPath,
        bool preserveCanvasFraming,
        bool matchReferenceHeight)
    {
        using (var source = new Bitmap(inputPath))
        using (var reference = new Bitmap(referencePath))
        using (var extracted = ExtractSource(source, matchReferenceHeight))
        {
            var sourceBounds = preserveCanvasFraming
                ? new Rectangle(0, 0, source.Width, source.Height)
                : FindAlphaBounds(extracted, 32);
            var targetBounds = preserveCanvasFraming
                ? new Rectangle(0, 0, reference.Width, reference.Height)
                : FindAlphaBounds(reference, 32);
            var drawBounds = targetBounds;
            if (matchReferenceHeight)
            {
                var scale = targetBounds.Height / (double)sourceBounds.Height;
                var width = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
                var height = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
                if (width > reference.Width || height > reference.Height)
                    throw new InvalidOperationException(String.Format(
                        "Aspect-preserving sprite would overflow the {0}x{1} reference canvas: {2}x{3}.",
                        reference.Width,
                        reference.Height,
                        width,
                        height));
                drawBounds = new Rectangle(
                    (reference.Width - width) / 2,
                    targetBounds.Bottom - height,
                    width,
                    height);
                if (drawBounds.Left < 0 || drawBounds.Top < 0 ||
                    drawBounds.Right > reference.Width || drawBounds.Bottom > reference.Height)
                    throw new InvalidOperationException("Aspect-preserving sprite exceeds the reference canvas.");
            }
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
                    drawBounds,
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
                    if (matchReferenceHeight) RemoveResidualBrightChroma(output);
                    else RemoveGreenSpill(output);
                }

                if (matchReferenceHeight)
                {
                    KeepLargestVisibleComponent(output, 4);
                    AlignToReference(output, targetBounds);
                    ValidateMatchedOutput(output, targetBounds);
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

    private static void KeepLargestVisibleComponent(Bitmap image, byte threshold)
    {
        var labels = new int[image.Width * image.Height];
        var queue = new Queue<Point>();
        var componentSizes = new List<int> { 0 };
        var componentId = 0;
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var root = y * image.Width + x;
            if (labels[root] != 0 || image.GetPixel(x, y).A <= threshold) continue;
            componentId++;
            var size = 0;
            labels[root] = componentId;
            queue.Enqueue(new Point(x, y));
            while (queue.Count > 0)
            {
                var point = queue.Dequeue();
                size++;
                for (var offsetY = -1; offsetY <= 1; offsetY++)
                for (var offsetX = -1; offsetX <= 1; offsetX++)
                {
                    if (offsetX == 0 && offsetY == 0) continue;
                    var neighborX = point.X + offsetX;
                    var neighborY = point.Y + offsetY;
                    if (neighborX < 0 || neighborY < 0 || neighborX >= image.Width || neighborY >= image.Height)
                        continue;
                    var neighbor = neighborY * image.Width + neighborX;
                    if (labels[neighbor] != 0 || image.GetPixel(neighborX, neighborY).A <= threshold) continue;
                    labels[neighbor] = componentId;
                    queue.Enqueue(new Point(neighborX, neighborY));
                }
            }
            componentSizes.Add(size);
        }

        if (componentId == 0)
            throw new InvalidOperationException("Prepared sprite contains no visible component.");
        var largestComponentId = 1;
        for (var id = 2; id < componentSizes.Count; id++)
            if (componentSizes[id] > componentSizes[largestComponentId]) largestComponentId = id;

        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var index = y * image.Width + x;
            if (labels[index] != largestComponentId)
                image.SetPixel(x, y, Color.Transparent);
        }
    }

    private static void AlignToReference(Bitmap image, Rectangle referenceBounds)
    {
        var bounds = FindAlphaBounds(image, 32);
        var offsetX = (int)Math.Round(image.Width / 2.0 - (bounds.Left + bounds.Width / 2.0));
        var offsetY = referenceBounds.Bottom - bounds.Bottom;
        var shiftedBounds = new Rectangle(
            bounds.Left + offsetX,
            bounds.Top + offsetY,
            bounds.Width,
            bounds.Height);
        if (shiftedBounds.Left < 0 || shiftedBounds.Top < 0 ||
            shiftedBounds.Right > image.Width || shiftedBounds.Bottom > image.Height)
            throw new InvalidOperationException("Aligned sprite would exceed the reference canvas.");
        if (offsetX == 0 && offsetY == 0) return;

        using (var source = (Bitmap)image.Clone())
        using (var graphics = Graphics.FromImage(image))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, offsetX, offsetY);
            graphics.Flush();
        }
    }

    private static void ValidateMatchedOutput(Bitmap image, Rectangle referenceBounds)
    {
        var bounds = FindAlphaBounds(image, 32);
        if (bounds.Bottom != referenceBounds.Bottom)
            throw new InvalidOperationException("Prepared sprite feet do not match the reference baseline.");
        var pivot = bounds.Left + bounds.Width / 2.0;
        if (Math.Abs(pivot - image.Width / 2.0) > 1.0)
            throw new InvalidOperationException("Prepared sprite horizontal pivot is not centered.");
        // KeepLargestVisibleComponent uses the same threshold. Recounting at a
        // higher alpha can split a single anti-aliased component into several
        // false islands even though no detached visible pixels remain.
        if (CountVisibleComponents(image, 4) != 1)
            throw new InvalidOperationException("Prepared sprite contains isolated visible components.");
    }

    private static int CountVisibleComponents(Bitmap image, byte threshold)
    {
        var visited = new bool[image.Width * image.Height];
        var queue = new Queue<Point>();
        var count = 0;
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var root = y * image.Width + x;
            if (visited[root] || image.GetPixel(x, y).A <= threshold) continue;
            count++;
            visited[root] = true;
            queue.Enqueue(new Point(x, y));
            while (queue.Count > 0)
            {
                var point = queue.Dequeue();
                for (var offsetY = -1; offsetY <= 1; offsetY++)
                for (var offsetX = -1; offsetX <= 1; offsetX++)
                {
                    if (offsetX == 0 && offsetY == 0) continue;
                    var neighborX = point.X + offsetX;
                    var neighborY = point.Y + offsetY;
                    if (neighborX < 0 || neighborY < 0 || neighborX >= image.Width || neighborY >= image.Height)
                        continue;
                    var neighbor = neighborY * image.Width + neighborX;
                    if (visited[neighbor] || image.GetPixel(neighborX, neighborY).A <= threshold) continue;
                    visited[neighbor] = true;
                    queue.Enqueue(new Point(neighborX, neighborY));
                }
            }
        }
        return count;
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

    private static void RemoveResidualBrightChroma(Bitmap image)
    {
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var color = image.GetPixel(x, y);
            if (color.A > 0 && (IsBrightMagenta(color) || IsBrightGreen(color)))
                image.SetPixel(x, y, Color.Transparent);
        }
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

    private static Bitmap ExtractChroma(Bitmap source, bool useDistanceChroma)
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
            if (isGreenKey && !useDistanceChroma)
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

    private static Bitmap ExtractSource(Bitmap source, bool useDistanceChroma)
    {
        var corners = new[]
        {
            source.GetPixel(0, 0),
            source.GetPixel(source.Width - 1, 0),
            source.GetPixel(0, source.Height - 1),
            source.GetPixel(source.Width - 1, source.Height - 1)
        };
        var hasNativeTransparency = false;
        foreach (var corner in corners)
            if (corner.A < 250) hasNativeTransparency = true;

        if (!hasNativeTransparency) return ExtractChroma(source, useDistanceChroma);
        return source.Clone(
            new Rectangle(0, 0, source.Width, source.Height),
            PixelFormat.Format32bppArgb
        );
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

if ($PreserveCanvasFraming -and $MatchReferenceHeight) {
  throw "PreserveCanvasFraming and MatchReferenceHeight cannot be combined."
}

[DungeonCharacterSpritePreparation]::Prepare(
  $InputPath,
  $ReferencePath,
  $OutputPath,
  $PreserveCanvasFraming.IsPresent,
  $MatchReferenceHeight.IsPresent
)
Write-Output "Prepared dungeon character sprite at $OutputPath"
