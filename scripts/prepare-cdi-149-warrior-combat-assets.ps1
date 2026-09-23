param(
  [Parameter(Mandatory = $true)] [string]$SourceRoot,
  [Parameter(Mandatory = $true)] [string]$NeutralRoot,
  [Parameter(Mandatory = $true)] [string]$OutputRoot
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Save-Png {
    param(
        [Parameter(Mandatory = $true)] [System.Drawing.Bitmap]$Image,
        [Parameter(Mandatory = $true)] [string]$Path
    )

    $directory = [System.IO.Path]::GetDirectoryName($Path)
    if ($directory) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }
    $stream = [System.IO.File]::Open(
        $Path,
        [System.IO.FileMode]::Create,
        [System.IO.FileAccess]::Write,
        [System.IO.FileShare]::None
    )
    try {
        $Image.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $stream.Dispose()
    }
}

function Build-Sheet {
    param(
        [Parameter(Mandatory = $true)] [string[]]$Paths,
        [Parameter(Mandatory = $true)] [string]$AlphaPath,
        [Parameter(Mandatory = $true)] [string]$LightPath,
        [Parameter(Mandatory = $true)] [string]$DarkPath
    )

    if ($Paths.Count -ne 10) {
        throw "Exactly ten normalized Warrior combat sprites are required per gender."
    }

    $cellWidth = 0
    $cellHeight = 0
    foreach ($path in $Paths) {
        $sprite = [System.Drawing.Bitmap]::new($path)
        try {
            $cellWidth = [Math]::Max($cellWidth, $sprite.Width)
            if ($cellHeight -eq 0) { $cellHeight = $sprite.Height }
            elseif ($sprite.Height -ne $cellHeight) {
                throw "Normalized Warrior combat sprites must share one canvas height."
            }
        }
        finally {
            $sprite.Dispose()
        }
    }

    $sheet = [System.Drawing.Bitmap]::new(
        $cellWidth * 5,
        $cellHeight * 2,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($sheet)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            for ($index = 0; $index -lt $Paths.Count; $index++) {
                $sprite = [System.Drawing.Bitmap]::new($Paths[$index])
                try {
                    $cellX = ($index % 5) * $cellWidth
                    $drawX = $cellX + [Math]::Floor(($cellWidth - $sprite.Width) / 2)
                    $drawY = [Math]::Floor($index / 5) * $cellHeight
                    $graphics.DrawImageUnscaled($sprite, $drawX, $drawY)
                }
                finally {
                    $sprite.Dispose()
                }
            }
            $graphics.Flush()
        }
        finally {
            $graphics.Dispose()
        }
        Save-Png -Image $sheet -Path $AlphaPath

        foreach ($preview in @(
            @{ Path = $LightPath; Color = [System.Drawing.Color]::FromArgb(255, 241, 237, 228) },
            @{ Path = $DarkPath; Color = [System.Drawing.Color]::FromArgb(255, 20, 24, 33) }
        )) {
            $canvas = [System.Drawing.Bitmap]::new(
                $sheet.Width,
                $sheet.Height,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )
            try {
                $previewGraphics = [System.Drawing.Graphics]::FromImage($canvas)
                try {
                    $previewGraphics.Clear($preview.Color)
                    $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                    $previewGraphics.DrawImageUnscaled($sheet, 0, 0)
                    $previewGraphics.Flush()
                }
                finally {
                    $previewGraphics.Dispose()
                }
                Save-Png -Image $canvas -Path $preview.Path
            }
            finally {
                $canvas.Dispose()
            }
        }
    }
    finally {
        $sheet.Dispose()
    }
}

$sourceCode = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;

public static class Cdi149WarriorCombatAssetPreparation
{
    private const byte BoundsAlphaThreshold = 32;
    private const int CombatFrameHeight = 920;
    private const int CombatFeetBaseline = 900;

    // Manual face-diameter readings on the first normalized review. They are
    // deliberately independent from the complete alpha bounds: a raised or
    // diagonal weapon must not make the fighter smaller. M01 and F01 are the
    // gender-specific authorities requested for CDI-149.
    private static readonly int[] MaleFaceDiameters =
        { 0, 84, 81, 84, 78, 82, 80, 78, 81, 62, 79 };
    private static readonly int[] FemaleFaceDiameters =
        { 0, 80, 80, 74, 80, 73, 78, 72, 73, 62, 80 };

    public static string[] Prepare(string sourceRoot, string neutralRoot, string outputRoot)
    {
        var results = new List<string>();
        foreach (var gender in new[] { "male", "female" })
            results.AddRange(PrepareGender(sourceRoot, neutralRoot, outputRoot, gender));
        if (results.Count == 0)
            throw new InvalidOperationException("No validated CDI-149 combat-idle source was found.");
        return results.ToArray();
    }

    private static IEnumerable<string> PrepareGender(
        string sourceRoot,
        string neutralRoot,
        string outputRoot,
        string gender)
    {
        var sourceDirectory = Path.Combine(sourceRoot, "validated-" + gender + "-v1");
        if (!Directory.Exists(sourceDirectory)) yield break;

        var pattern = "warrior-" + gender + "-??-combat-idle-v1.png";
        var sourcePaths = Directory.GetFiles(sourceDirectory, pattern).OrderBy(path => path).ToArray();
        if (sourcePaths.Length == 0) yield break;

        var outputDirectory = Path.Combine(outputRoot, gender);
        var previewDirectory = Path.Combine(outputRoot, "previews");
        Directory.CreateDirectory(outputDirectory);
        Directory.CreateDirectory(previewDirectory);

        foreach (var sourcePath in sourcePaths)
        {
            var fileName = Path.GetFileName(sourcePath);
            var prefix = "warrior-" + gender + "-";
            var indexText = fileName.Substring(prefix.Length, 2);
            int index;
            if (!Int32.TryParse(indexText, out index) || index < 1 || index > 10)
                throw new InvalidOperationException("Invalid Warrior identity index in " + sourcePath);

            var neutralPath = Path.Combine(
                neutralRoot,
                gender,
                String.Format("warrior-{0}-{1:D2}-v1.png", gender, index));
            if (!File.Exists(neutralPath))
                throw new FileNotFoundException("Missing normalized neutral identity reference.", neutralPath);

            var outputPath = Path.Combine(outputDirectory, fileName);
            using (var source = new Bitmap(sourcePath))
            using (var extracted = ExtractOrPreserveAlpha(source))
            using (var neutral = new Bitmap(neutralPath))
            {
                var neutralBounds = FindAlphaBounds(neutral, BoundsAlphaThreshold);
                var faceScale = GetFaceScale(gender, index) * GetReviewAdjustment(gender, index);
                using (var normalized = NormalizeToReference(
                    extracted,
                    neutral.Width,
                    CombatFrameHeight,
                    CombatFeetBaseline,
                    neutralBounds,
                    faceScale))
                {
                    RemoveResidualBrightChroma(normalized);
                    RemoveTinyIsolatedComponents(normalized, BoundsAlphaThreshold, 2);
                    ValidateOutput(
                        normalized,
                        outputPath,
                        neutral.Width,
                        CombatFrameHeight,
                        CombatFeetBaseline);
                    SavePng(normalized, outputPath);

                    var bounds = FindAlphaBounds(normalized, BoundsAlphaThreshold);
                    SavePreview(
                        normalized,
                        Color.FromArgb(255, 241, 237, 228),
                        Path.Combine(
                            previewDirectory,
                            String.Format("warrior-{0}-{1:D2}-combat-idle-light-v1.png", gender, index)));
                    SavePreview(
                        normalized,
                        Color.FromArgb(255, 20, 24, 33),
                        Path.Combine(
                            previewDirectory,
                            String.Format("warrior-{0}-{1:D2}-combat-idle-dark-v1.png", gender, index)));

                    yield return String.Format(
                        "{0}-{1:D2}|faceScale={2:F3}|{3}x{4}|bounds={5},{6},{7},{8}|bottom={9}|alphaCenter={10:F1}|bytes={11}",
                        gender,
                        index,
                        faceScale,
                        normalized.Width,
                        normalized.Height,
                        bounds.X,
                        bounds.Y,
                        bounds.Width,
                        bounds.Height,
                        bounds.Bottom - 1,
                        bounds.Left + bounds.Width / 2.0,
                        new FileInfo(outputPath).Length);
                }
            }
        }
    }

    private static double GetFaceScale(string gender, int index)
    {
        var diameters = gender == "male" ? MaleFaceDiameters : FemaleFaceDiameters;
        var referenceDiameter = diameters[1];
        var measuredDiameter = diameters[index];
        if (referenceDiameter <= 0 || measuredDiameter <= 0)
            throw new InvalidOperationException("Missing CDI-149 face-diameter measurement.");
        return referenceDiameter / (double)measuredDiameter;
    }

    private static double GetReviewAdjustment(string gender, int index)
    {
        // Final visual-sheet tuning requested after face normalization. Each
        // correction remains below the agreed five-percent ceiling.
        if (gender == "male" && index == 6) return 1.092;
        if (gender == "male" && (index == 9 || index == 10)) return 1.04;
        if (gender == "female" && index == 5) return 1.04;
        return 1.0;
    }

    private static Bitmap ExtractOrPreserveAlpha(Bitmap source)
    {
        var cornersAreTransparent =
            source.GetPixel(0, 0).A <= 4 &&
            source.GetPixel(source.Width - 1, 0).A <= 4 &&
            source.GetPixel(0, source.Height - 1).A <= 4 &&
            source.GetPixel(source.Width - 1, source.Height - 1).A <= 4;
        if (!cornersAreTransparent) return ExtractChroma(source);

        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.DrawImageUnscaled(source, 0, 0);
            graphics.Flush();
        }
        return output;
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
        int minimumFrameWidth,
        int frameHeight,
        int feetBaseline,
        Rectangle referenceBounds,
        double faceScale)
    {
        var sourceBounds = FindAlphaBounds(source, BoundsAlphaThreshold);
        var scale = referenceBounds.Height / (double)sourceBounds.Height * faceScale;
        var width = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
        var height = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
        if (height > frameHeight)
            throw new InvalidOperationException(String.Format(
                "The normalized combat sprite would overflow its {0}px-high frame: {1}x{2}.",
                frameHeight,
                width,
                height));

        // Combat guards may be wider or taller than their neutral identity.
        // Scale comes from face diameter, never from a weapon extremity. The
        // transparent canvas grows around that scale so the weapon stays whole.
        const int horizontalPadding = 8;
        var frameWidth = Math.Max(minimumFrameWidth, width + horizontalPadding);

        var target = new Rectangle(
            (frameWidth - width) / 2,
            feetBaseline - height + 1,
            width,
            height);
        if (target.Left < 0 || target.Right > frameWidth || target.Top < 0 || target.Bottom > frameHeight)
            throw new InvalidOperationException(String.Format(
                "The normalized combat sprite would exceed its {0}x{1} target canvas: " +
                "sourceBounds={2},{3},{4},{5}; referenceBounds={6},{7},{8},{9}; target={10},{11},{12},{13}.",
                frameWidth,
                frameHeight,
                sourceBounds.X,
                sourceBounds.Y,
                sourceBounds.Width,
                sourceBounds.Height,
                referenceBounds.X,
                referenceBounds.Y,
                referenceBounds.Width,
                referenceBounds.Height,
                target.X,
                target.Y,
                target.Width,
                target.Height));

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

    private static void ValidateOutput(
        Bitmap image,
        string path,
        int expectedWidth,
        int expectedHeight,
        int expectedFeetBaseline)
    {
        if (image.Width < expectedWidth || image.Height != expectedHeight)
            throw new InvalidOperationException(
                "Output dimensions do not preserve the neutral height/minimum width: " + path);

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

        var bounds = FindAlphaBounds(image, BoundsAlphaThreshold);
        if (bounds.Bottom - 1 != expectedFeetBaseline)
            throw new InvalidOperationException("Combat sprite feet baseline differs from the shared target: " + path);
        var frameCenter = image.Width / 2.0;
        var alphaCenter = bounds.Left + bounds.Width / 2.0;
        if (Math.Abs(frameCenter - alphaCenter) > 1.0)
            throw new InvalidOperationException("Visible alpha bounds are not centered in the output frame: " + path);
        var componentCount = CountVisibleComponents(image, BoundsAlphaThreshold);
        if (componentCount != 1)
            throw new InvalidOperationException(
                "Output contains " + componentCount + " visible components instead of 1: " + path);
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

if (-not ("Cdi149WarriorCombatAssetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$resolvedSourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$resolvedNeutralRoot = (Resolve-Path -LiteralPath $NeutralRoot).Path
$resolvedOutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)

$prepared = [Cdi149WarriorCombatAssetPreparation]::Prepare(
  $resolvedSourceRoot,
  $resolvedNeutralRoot,
  $resolvedOutputRoot
)

$prepared
$previewRoot = Join-Path $resolvedOutputRoot "previews"
foreach ($gender in @("male", "female")) {
    $paths = @(Get-ChildItem -LiteralPath (Join-Path $resolvedOutputRoot $gender) `
        -File -Filter "warrior-$gender-??-combat-idle-v1.png" |
        Sort-Object Name |
        ForEach-Object FullName)
    Build-Sheet `
        -Paths $paths `
        -AlphaPath (Join-Path $resolvedOutputRoot "warrior-$gender-combat-idle-sheet-alpha-v1.png") `
        -LightPath (Join-Path $previewRoot "warrior-$gender-combat-idle-sheet-light-v2.png") `
        -DarkPath (Join-Path $previewRoot "warrior-$gender-combat-idle-sheet-dark-v2.png")
}
