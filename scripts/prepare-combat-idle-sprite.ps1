[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string]$SourcePath,
    [Parameter(Mandatory = $true)] [string]$OutputPath,
    [Parameter(Mandatory = $true)] [ValidateCount(4, 4)] [int[]]$SourceBodyRect,
    [Parameter(Mandatory = $true)] [ValidateCount(4, 4)] [int[]]$SourceFaceRect,
    [string]$ReferenceCatalogPath = 'assets/design/hero-sprites/combat-idle-proportion-references.json',
    [Parameter(Mandatory = $true)] [string]$NeutralKey,
    [Parameter(Mandatory = $true)] [double]$SourceFeetMidpointX,
    [int]$FrameHeight = 920,
    [int]$VisibleBottomY = 900,
    [int]$HorizontalPadding = 8
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-InputFile([string]$Path) {
    $resolved = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    }
    else {
        Join-Path $repoRoot $Path
    }
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Input file not found: $resolved"
    }
    return (Resolve-Path -LiteralPath $resolved).Path
}

function Get-ReviewedNeutralEntry([pscustomobject]$Catalog, [string]$Key) {
    $property = $Catalog.entries.PSObject.Properties[$Key]
    if ($null -eq $property) {
        throw "Neutral reference '$Key' is absent from the measurement catalog. Review and cache it before export."
    }
    $entry = $property.Value
    if ($entry.reviewStatus -ne 'reviewed') {
        throw "Neutral reference '$Key' is not reviewed and cannot drive a runtime export."
    }
    if ($entry.faceRect.Count -ne 4) {
        throw "Neutral reference '$Key' must contain a four-value faceRect."
    }

    $file = Resolve-InputFile $entry.path
    $actualHash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLower()
    if ($actualHash -ne $entry.sha256) {
        throw "Neutral reference '$Key' changed since its frame review. Expected SHA-256 $($entry.sha256), got $actualHash."
    }

    Add-Type -AssemblyName System.Drawing
    $image = [System.Drawing.Bitmap]::FromFile($file)
    try {
        if ($image.Width -ne $entry.imageSize[0] -or $image.Height -ne $entry.imageSize[1]) {
            throw "Neutral reference '$Key' dimensions changed since review."
        }
    }
    finally {
        $image.Dispose()
    }

    return [pscustomobject]@{
        File = $file
        FaceRect = [int[]]$entry.faceRect
    }
}

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class CombatIdleSpritePreparationV2
{
    private const byte BoundsThreshold = 32;
    private const byte NoiseThreshold = 2;

    public static string Prepare(
        string sourcePath,
        string neutralPath,
        string outputPath,
        int sourceBodyX,
        int sourceBodyY,
        int sourceBodyWidth,
        int sourceBodyHeight,
        int sourceFaceX,
        int sourceFaceY,
        int sourceFaceWidth,
        int sourceFaceHeight,
        int neutralFaceX,
        int neutralFaceY,
        int neutralFaceWidth,
        int neutralFaceHeight,
        double sourceFeetMidpointX,
        int frameHeight,
        int visibleBottomY,
        int horizontalPadding)
    {
        using (var source = new Bitmap(sourcePath))
        using (var neutral = new Bitmap(neutralPath))
        using (var cleaned = CleanAlphaNoise(source))
        {
            AssertTransparentCanvas(cleaned, "source");
            AssertTransparentCanvas(neutral, "neutral reference");
            var sourceBounds = FindAlphaBounds(cleaned, BoundsThreshold);
            var sourceBodyBounds = new Rectangle(
                sourceBodyX,
                sourceBodyY,
                sourceBodyWidth,
                sourceBodyHeight);
            var sourceFaceBounds = new Rectangle(
                sourceFaceX,
                sourceFaceY,
                sourceFaceWidth,
                sourceFaceHeight);
            var neutralFaceBounds = new Rectangle(
                neutralFaceX,
                neutralFaceY,
                neutralFaceWidth,
                neutralFaceHeight);

            AssertRectangle(sourceBodyBounds, cleaned, "source body rectangle");
            AssertRectangle(sourceFaceBounds, cleaned, "source face rectangle");
            AssertRectangle(neutralFaceBounds, neutral, "neutral face rectangle");
            if (!sourceBodyBounds.Contains(sourceFaceBounds))
                throw new InvalidOperationException("The source face rectangle must be inside the source body rectangle.");
            if (sourceFeetMidpointX < sourceBodyBounds.Left || sourceFeetMidpointX >= sourceBodyBounds.Right)
                throw new InvalidOperationException("The feet midpoint must lie inside the source body rectangle.");

            var sourceFaceDiameter = EquivalentDiameter(sourceFaceBounds);
            var neutralFaceDiameter = EquivalentDiameter(neutralFaceBounds);
            var scale = neutralFaceDiameter / sourceFaceDiameter;
            var targetWidth = Math.Max(1, (int)Math.Round(sourceBounds.Width * scale));
            var targetHeight = Math.Max(1, (int)Math.Round(sourceBounds.Height * scale));
            var pivotInTarget = (sourceFeetMidpointX - sourceBounds.Left) * scale;
            var rightOfPivot = targetWidth - pivotInTarget;
            var halfWidth = (int)Math.Ceiling(Math.Max(pivotInTarget, rightOfPivot)) + horizontalPadding;
            var frameWidth = Math.Max(neutral.Width, halfWidth * 2);
            var targetLeft = (int)Math.Round(frameWidth / 2.0 - pivotInTarget);
            var bodyBottomFromSourceTop = sourceBodyBounds.Bottom - sourceBounds.Top;
            var targetTop = visibleBottomY - (int)Math.Round(bodyBottomFromSourceTop * scale) + 1;
            var target = new Rectangle(targetLeft, targetTop, targetWidth, targetHeight);

            if (target.Left < 0 || target.Top < 0 || target.Right > frameWidth || target.Bottom > frameHeight)
                throw new InvalidOperationException("The face-normalized sprite exceeds its target canvas.");

            using (var output = new Bitmap(frameWidth, frameHeight, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            using (var attributes = new ImageAttributes())
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;
                graphics.SmoothingMode = SmoothingMode.None;
                attributes.SetWrapMode(WrapMode.TileFlipXY);
                graphics.DrawImage(
                    cleaned,
                    target,
                    sourceBounds.X,
                    sourceBounds.Y,
                    sourceBounds.Width,
                    sourceBounds.Height,
                    GraphicsUnit.Pixel,
                    attributes);
                graphics.Flush();

                var directory = Path.GetDirectoryName(outputPath);
                if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                    output.Save(stream, ImageFormat.Png);

                var outputBounds = FindAlphaBounds(output, BoundsThreshold);
                var transformedBodyBottom = target.Top +
                    (sourceBodyBounds.Bottom - sourceBounds.Top) * scale - 1.0;
                if (Math.Abs(transformedBodyBottom - visibleBottomY) > 1.0)
                    throw new InvalidOperationException("The body/feet baseline does not match the requested target.");
                var pivotX = target.Left + pivotInTarget;
                if (Math.Abs(pivotX - frameWidth / 2.0) > 1.0)
                    throw new InvalidOperationException("The feet midpoint is not centered in the output frame.");

                var outputFaceDiameter = sourceFaceDiameter * scale;
                if (Math.Abs(outputFaceDiameter - neutralFaceDiameter) > 0.01)
                    throw new InvalidOperationException("The normalized face diameter does not match the neutral authority.");

                var outputBodyHeight = sourceBodyBounds.Height * scale;
                var outputFaceWidth = sourceFaceBounds.Width * scale;
                var neutralFaceWidthDeltaPercent =
                    (outputFaceWidth - neutralFaceBounds.Width) / neutralFaceBounds.Width * 100.0;
                return String.Format(
                    "{0}x{1}|bounds={2},{3},{4},{5}|bodyHeight={6:F1}|faceDiameter={7:F2}|faceWidthDeltaPercent={8:F2}|visibleBottomY={9}|feetMidpointX={10:F1}|bytes={11}",
                    output.Width,
                    output.Height,
                    outputBounds.X,
                    outputBounds.Y,
                    outputBounds.Width,
                    outputBounds.Height,
                    outputBodyHeight,
                    outputFaceDiameter,
                    neutralFaceWidthDeltaPercent,
                    visibleBottomY,
                    pivotX,
                    new FileInfo(outputPath).Length);
            }
        }
    }

    private static double EquivalentDiameter(Rectangle rectangle)
    {
        return Math.Sqrt(rectangle.Width * (double)rectangle.Height);
    }

    private static void AssertTransparentCanvas(Bitmap image, string name)
    {
        if (image.GetPixel(0, 0).A > NoiseThreshold ||
            image.GetPixel(image.Width - 1, 0).A > NoiseThreshold ||
            image.GetPixel(0, image.Height - 1).A > NoiseThreshold ||
            image.GetPixel(image.Width - 1, image.Height - 1).A > NoiseThreshold)
            throw new InvalidOperationException(
                "The " + name + " must be an alpha PNG with transparent corners. " +
                "Background extraction is a separate deterministic step.");
    }

    private static Bitmap CleanAlphaNoise(Bitmap source)
    {
        var output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (var y = 0; y < source.Height; y++)
        for (var x = 0; x < source.Width; x++)
        {
            var color = source.GetPixel(x, y);
            output.SetPixel(
                x,
                y,
                color.A <= NoiseThreshold
                    ? Color.Transparent
                    : Color.FromArgb(color.A, color.R, color.G, color.B));
        }
        return output;
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
            throw new InvalidOperationException("No visible pixels found in the sprite.");
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static void AssertRectangle(Rectangle rectangle, Bitmap image, string name)
    {
        if (rectangle.X < 0 || rectangle.Y < 0 || rectangle.Width <= 0 || rectangle.Height <= 0)
            throw new InvalidOperationException(name + " must have non-negative x/y and positive width/height.");
        if (rectangle.Right > image.Width || rectangle.Bottom > image.Height)
            throw new InvalidOperationException(name + " exceeds the image bounds.");
    }
}
'@

if (-not ('CombatIdleSpritePreparationV2' -as [type])) {
    Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$catalogFile = Resolve-InputFile $ReferenceCatalogPath
$catalog = Get-Content -LiteralPath $catalogFile -Raw | ConvertFrom-Json
if ($catalog.schemaVersion -ne 2) {
    throw "Unsupported reference catalog schema version: $($catalog.schemaVersion)"
}
$neutralEntry = Get-ReviewedNeutralEntry $catalog $NeutralKey
$source = Resolve-InputFile $SourcePath
$neutral = $neutralEntry.File
$output = [System.IO.Path]::GetFullPath($OutputPath)

[CombatIdleSpritePreparationV2]::Prepare(
    $source,
    $neutral,
    $output,
    $SourceBodyRect[0],
    $SourceBodyRect[1],
    $SourceBodyRect[2],
    $SourceBodyRect[3],
    $SourceFaceRect[0],
    $SourceFaceRect[1],
    $SourceFaceRect[2],
    $SourceFaceRect[3],
    $neutralEntry.FaceRect[0],
    $neutralEntry.FaceRect[1],
    $neutralEntry.FaceRect[2],
    $neutralEntry.FaceRect[3],
    $SourceFeetMidpointX,
    $FrameHeight,
    $VisibleBottomY,
    $HorizontalPadding
)
