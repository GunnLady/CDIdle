param([string]$SourceRoot = 'assets/design/hero-sprites/cdi-153', [string]$OutputRoot = 'assets/design/hero-sprites/cdi-153/normalized-alpha-v1')

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class AcolyteCombatNormalizer
{
    public static string Normalize(string inputPath, string outputPath)
    {
        using (var source = new Bitmap(inputPath))
        {
            int minX = source.Width, minY = source.Height, maxX = -1, maxY = -1;
            for (int y = 0; y < source.Height; y++)
            for (int x = 0; x < source.Width; x++)
            {
                if (source.GetPixel(x, y).A <= 32) continue;
                minX = Math.Min(minX, x); minY = Math.Min(minY, y);
                maxX = Math.Max(maxX, x); maxY = Math.Max(maxY, y);
            }
            if (maxX < minX) throw new InvalidOperationException("Empty alpha sprite: " + inputPath);
            if (source.GetPixel(0, 0).A > 2 || source.GetPixel(source.Width - 1, 0).A > 2 ||
                source.GetPixel(0, source.Height - 1).A > 2 || source.GetPixel(source.Width - 1, source.Height - 1).A > 2)
                throw new InvalidOperationException("Opaque canvas corner: " + inputPath);

            int visibleWidth = maxX - minX + 1, visibleHeight = maxY - minY + 1;
            double scale = 860.0 / visibleHeight;
            int targetWidth = (int)Math.Round(visibleWidth * scale);
            int targetHeight = (int)Math.Round(visibleHeight * scale);

            // Match the centered normalized frames used by earlier combat-idle classes.
            double pivotSourceX = (minX + maxX) / 2.0;
            double pivotTargetX = (pivotSourceX - minX) * scale;
            int halfWidth = (int)Math.Ceiling(Math.Max(pivotTargetX, targetWidth - pivotTargetX)) + 12;
            int frameWidth = Math.Max(341, halfWidth * 2);
            int targetLeft = (int)Math.Round(frameWidth / 2.0 - pivotTargetX);
            int targetTop = 900 - targetHeight + 1;
            using (var output = new Bitmap(frameWidth, 920, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            using (var attributes = new ImageAttributes())
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;
                attributes.SetWrapMode(WrapMode.TileFlipXY);
                graphics.DrawImage(source, new Rectangle(targetLeft, targetTop, targetWidth, targetHeight),
                    minX, minY, visibleWidth, visibleHeight, GraphicsUnit.Pixel, attributes);
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);
            }
            return String.Format("{0} {1}x920 alpha={2},{3},{4},{5} pivot={6:F1} bytes={7}",
                Path.GetFileName(outputPath), frameWidth, minX, minY, maxX, maxY,
                frameWidth / 2.0, new FileInfo(outputPath).Length);
        }
    }
}
'@
Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
foreach ($gender in @('male','female')) {
    foreach ($index in 1..10) {
        $name = 'acolyte-{0}-{1:D2}-combat-idle-v1.png' -f $gender,$index
        $inputPath = Join-Path $SourceRoot ('validated-{0}-v1/{1}' -f $gender,$name)
        $outputPath = Join-Path $OutputRoot ('{0}/{1}' -f $gender,$name)
        [AcolyteCombatNormalizer]::Normalize((Resolve-Path $inputPath).Path, [IO.Path]::GetFullPath($outputPath))
    }
}
