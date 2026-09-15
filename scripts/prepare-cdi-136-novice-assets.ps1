param(
  [Parameter(Mandatory = $true)] [string]$SourceRoot,
  [Parameter(Mandatory = $true)] [string]$OutputRoot
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

public static class Cdi136NoviceAssetPreparation
{
    private const int VariantCount = 10;
    private const int SheetColumns = 5;
    private const byte BoundsAlphaThreshold = 32;

    public static string[] Prepare(string sourceRoot, string outputRoot)
    {
        var results = new List<string>();
        foreach (var gender in new[] { "male", "female" })
            results.AddRange(PrepareGender(sourceRoot, outputRoot, gender));
        return results.ToArray();
    }

    private static IEnumerable<string> PrepareGender(string sourceRoot, string outputRoot, string gender)
    {
        var sourceDirectory = Path.Combine(sourceRoot, "validated-" + gender + "-v1");
        var outputDirectory = Path.Combine(outputRoot, gender);
        var previewDirectory = Path.Combine(outputRoot, "previews");
        Directory.CreateDirectory(outputDirectory);
        Directory.CreateDirectory(previewDirectory);

        var referencePath = VariantPath(sourceDirectory, gender, 1);
        using (var referenceSource = new Bitmap(referencePath))
        using (var reference = ExtractChroma(referenceSource))
        {
            var referenceBounds = FindAlphaBounds(reference, BoundsAlphaThreshold);
            var normalizedPaths = new List<string>();

            for (var variant = 1; variant <= VariantCount; variant++)
            {
                var inputPath = VariantPath(sourceDirectory, gender, variant);
                var outputPath = VariantPath(outputDirectory, gender, variant);
                using (var source = new Bitmap(inputPath))
                using (var extracted = ExtractChroma(source))
                using (var normalized = variant == 1
                    ? CopyToCanvas(extracted, reference.Width, reference.Height)
                    : NormalizeToReference(extracted, reference.Width, reference.Height, referenceBounds))
                {
                    RemoveResidualBrightChroma(normalized);
                    RemoveTinyIsolatedComponents(normalized, BoundsAlphaThreshold, 2);
                    ValidateOutput(normalized, outputPath, 1);
                    SavePng(normalized, outputPath);
                    var bounds = FindAlphaBounds(normalized, BoundsAlphaThreshold);
                    normalizedPaths.Add(outputPath);
                    yield return String.Format(
                        "{0:D2}|{1}x{2}|bounds={3},{4},{5},{6}|feet={7}|bytes={8}",
                        variant,
                        normalized.Width,
                        normalized.Height,
                        bounds.X,
                        bounds.Y,
                        bounds.Width,
                        bounds.Height,
                        bounds.Bottom - 1,
                        new FileInfo(outputPath).Length);
                }
            }

            var sheetPath = Path.Combine(outputRoot, "novice-" + gender + "-sheet-alpha-v1.png");
            using (var sheet = BuildSheet(normalizedPaths, reference.Width, reference.Height))
            {
                RemoveResidualBrightChroma(sheet);
                ValidateOutput(sheet, sheetPath, VariantCount);
                SavePng(sheet, sheetPath);
                SavePreview(
                    sheet,
                    Color.FromArgb(255, 241, 237, 228),
                    Path.Combine(previewDirectory, "novice-" + gender + "-sheet-light-v1.png"));
                SavePreview(
                    sheet,
                    Color.FromArgb(255, 20, 24, 33),
                    Path.Combine(previewDirectory, "novice-" + gender + "-sheet-dark-v1.png"));
            }

            yield return "sheet=" + sheetPath;
        }
    }

    private static string VariantPath(string directory, string gender, int variant)
    {
        return Path.Combine(directory, String.Format("novice-{0}-{1:D2}-v1.png", gender, variant));
    }

    private static Bitmap ExtractChroma(Bitmap source)
    {
        var key = EstimateBorderKey(source);
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);

        for (var y = 0; y < source.Height; y++)
        for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            var deltaR = color.R - key.R;
            var deltaG = color.G - key.G;
            var deltaB = color.B - key.B;
            var distance = Math.Sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
            var chromaCoverage = Math.Max(0.0, Math.Min(1.0, (distance - 14.0) / 190.0));
            chromaCoverage = chromaCoverage * chromaCoverage * (3.0 - 2.0 * chromaCoverage);
            var alpha = chromaCoverage * (color.A / 255.0);

            if (alpha <= 0.04)
            {
                output.SetPixel(x, y, Color.Transparent);
                continue;
            }

            var red = (color.R - (1.0 - chromaCoverage) * key.R) / Math.Max(chromaCoverage, 0.0001);
            var green = (color.G - (1.0 - chromaCoverage) * key.G) / Math.Max(chromaCoverage, 0.0001);
            var blue = (color.B - (1.0 - chromaCoverage) * key.B) / Math.Max(chromaCoverage, 0.0001);
            output.SetPixel(
                x,
                y,
                Color.FromArgb(Clamp(alpha * 255.0), Clamp(red), Clamp(green), Clamp(blue)));
        }

        RemoveResidualBrightChroma(output);
        return output;
    }

    private static void RemoveResidualBrightChroma(Bitmap image)
    {
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var color = image.GetPixel(x, y);
            if (color.A > 0 && IsBrightChroma(color))
                image.SetPixel(x, y, Color.Transparent);
        }
    }

    private static void RemoveTinyIsolatedComponents(Bitmap image, byte threshold, int maximumSize)
    {
        var visited = new bool[image.Width * image.Height];
        var queue = new Queue<Point>();
        var component = new List<Point>();
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var root = y * image.Width + x;
            if (visited[root] || image.GetPixel(x, y).A <= threshold) continue;
            visited[root] = true;
            queue.Enqueue(new Point(x, y));
            component.Clear();
            while (queue.Count > 0)
            {
                var point = queue.Dequeue();
                component.Add(point);
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

            if (component.Count <= maximumSize)
                foreach (var point in component) image.SetPixel(point.X, point.Y, Color.Transparent);
        }
    }

    private static Color EstimateBorderKey(Bitmap source)
    {
        const int border = 12;
        double red = 0;
        double green = 0;
        double blue = 0;
        double weight = 0;

        for (var y = 0; y < source.Height; y++)
        for (var x = 0; x < source.Width; x++)
        {
            if (x >= border && y >= border && x < source.Width - border && y < source.Height - border)
                continue;
            var color = source.GetPixel(x, y);
            if (color.A == 0) continue;
            var alpha = color.A / 255.0;
            red += color.R * alpha;
            green += color.G * alpha;
            blue += color.B * alpha;
            weight += alpha;
        }

        if (weight <= 0) throw new InvalidOperationException("The source border contains no visible chroma pixels.");
        var key = Color.FromArgb(255, Clamp(red / weight), Clamp(green / weight), Clamp(blue / weight));
        var isMagenta = key.R > 100 && key.B > 90 && key.G < 80 &&
            key.R > key.G + 45 && key.B > key.G + 45;
        var isGreen = key.G > 150 && key.G > key.R + 80 && key.G > key.B + 80;
        if (!isMagenta && !isGreen)
            throw new InvalidOperationException(String.Format(
                "Unsupported chroma key estimated from border: rgb({0}, {1}, {2}).",
                key.R,
                key.G,
                key.B));
        return key;
    }

    private static Bitmap NormalizeToReference(
        Bitmap source,
        int frameWidth,
        int frameHeight,
        Rectangle referenceBounds)
    {
        var sourceBounds = FindAlphaBounds(source, BoundsAlphaThreshold);
        var scale = referenceBounds.Height / (double)sourceBounds.Height;
        var width = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
        var height = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
        if (width > frameWidth)
            throw new InvalidOperationException(String.Format(
                "A height-normalized sprite would overflow its frame: width {0}, frame {1}.",
                width,
                frameWidth));
        var target = new Rectangle(
            referenceBounds.Left + (referenceBounds.Width - width) / 2,
            referenceBounds.Bottom - height,
            width,
            height);

        var output = new Bitmap(frameWidth, frameHeight, PixelFormat.Format32bppArgb);
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
        }
        return output;
    }

    private static Bitmap CopyToCanvas(Bitmap source, int width, int height)
    {
        if (source.Width != width || source.Height != height)
            throw new InvalidOperationException("The reference source does not match its target canvas.");
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, 0, 0);
        }
        return output;
    }

    private static Bitmap BuildSheet(IReadOnlyList<string> paths, int cellWidth, int cellHeight)
    {
        if (paths.Count != VariantCount)
            throw new InvalidOperationException("Exactly ten normalized variants are required.");
        var rows = (int)Math.Ceiling(paths.Count / (double)SheetColumns);
        var sheet = new Bitmap(cellWidth * SheetColumns, cellHeight * rows, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(sheet))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            for (var index = 0; index < paths.Count; index++)
            using (var image = new Bitmap(paths[index]))
                graphics.DrawImageUnscaled(image, (index % SheetColumns) * cellWidth, (index / SheetColumns) * cellHeight);
        }
        return sheet;
    }

    private static void SavePreview(Bitmap source, Color background, string path)
    {
        using (var preview = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(preview))
        {
            graphics.Clear(background);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.DrawImageUnscaled(source, 0, 0);
            SavePng(preview, path);
        }
    }

    private static void ValidateOutput(Bitmap image, string path, int expectedComponents)
    {
        var transparent = 0L;
        var visible = 0L;
        var residualChroma = 0L;
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            var color = image.GetPixel(x, y);
            if (color.A == 0) transparent++;
            if (color.A > BoundsAlphaThreshold) visible++;
            if (color.A > BoundsAlphaThreshold && IsBrightChroma(color)) residualChroma++;
        }

        if (transparent == 0) throw new InvalidOperationException("No transparent pixels in " + path);
        if (visible == 0) throw new InvalidOperationException("No visible character pixels in " + path);
        if (residualChroma > 0)
            throw new InvalidOperationException(String.Format("{0} residual bright chroma pixels in {1}", residualChroma, path));
        int componentCount = CountVisibleComponents(image, BoundsAlphaThreshold);
        if (componentCount != expectedComponents)
            throw new InvalidOperationException(
                "Output contains " + componentCount + " visible components instead of " +
                expectedComponents + ": " + path);
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

    private static bool IsBrightChroma(Color color)
    {
        var magenta = color.R > 100 && color.B > 90 && color.G < 40 &&
            color.R > color.G + 45 && color.B > color.G + 45;
        var green = color.G > 180 && color.G > color.R + 80 && color.G > color.B + 80;
        return magenta || green;
    }

    private static Rectangle FindAlphaBounds(Bitmap image, byte threshold)
    {
        var minX = image.Width;
        var minY = image.Height;
        var maxX = -1;
        var maxY = -1;
        for (var y = 0; y < image.Height; y++)
        for (var x = 0; x < image.Width; x++)
        {
            if (image.GetPixel(x, y).A <= threshold) continue;
            minX = Math.Min(minX, x);
            minY = Math.Min(minY, y);
            maxX = Math.Max(maxX, x);
            maxY = Math.Max(maxY, y);
        }
        if (maxX < minX || maxY < minY)
            throw new InvalidOperationException("No visible pixels found after chroma extraction.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static void SavePng(Bitmap image, string path)
    {
        var directory = Path.GetDirectoryName(path);
        if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
        using (var stream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None))
            image.Save(stream, ImageFormat.Png);
    }

    private static int Clamp(double value)
    {
        return (int)Math.Max(0, Math.Min(255, Math.Round(value)));
    }
}
'@

if (-not ("Cdi136NoviceAssetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$resolvedSourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$resolvedOutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)

[Cdi136NoviceAssetPreparation]::Prepare($resolvedSourceRoot, $resolvedOutputRoot)
