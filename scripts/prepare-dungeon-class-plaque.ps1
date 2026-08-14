param(
  [Parameter(Mandatory = $true)] [string]$InputPath,
  [Parameter(Mandatory = $true)] [string]$OutputPath,
  [double]$SourceCropSize = 710,
  [double]$DiscRadius = 70,
  [double]$SourceCenterOffsetX = 0,
  [double]$SourceCenterOffsetY = 0
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class DungeonClassPlaquePreparation
{
    public static void Prepare(string inputPath, string outputPath, double sourceCropSize, double discRadius, double sourceCenterOffsetX, double sourceCenterOffsetY)
    {
        const int runtimeSize = 192;
        using (var source = new Bitmap(inputPath))
        using (var output = new Bitmap(runtimeSize, runtimeSize, PixelFormat.Format32bppArgb))
        using (var mask = new Bitmap(runtimeSize, runtimeSize, PixelFormat.Format32bppArgb))
        {
            var cropSize = Math.Min(sourceCropSize, Math.Min(source.Width, source.Height));
            var sourceRect = new RectangleF(
                (float)(((source.Width - cropSize) / 2.0) + sourceCenterOffsetX),
                (float)(((source.Height - cropSize) / 2.0) + sourceCenterOffsetY),
                (float)cropSize,
                (float)cropSize
            );

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
                graphics.DrawImage(source, new Rectangle(0, 0, runtimeSize, runtimeSize), sourceRect.X, sourceRect.Y, sourceRect.Width, sourceRect.Height, GraphicsUnit.Pixel, attributes);
            }

            using (var graphics = Graphics.FromImage(mask))
            using (var brush = new SolidBrush(Color.White))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.SmoothingMode = SmoothingMode.AntiAlias;
                var center = (runtimeSize - 1) / 2.0;
                graphics.FillEllipse(brush, (float)(center - discRadius), (float)(center - discRadius), (float)(discRadius * 2), (float)(discRadius * 2));
            }

            for (var y = 0; y < runtimeSize; y++) for (var x = 0; x < runtimeSize; x++) {
                var color = output.GetPixel(x, y);
                var alpha = mask.GetPixel(x, y).A;
                output.SetPixel(x, y, Color.FromArgb((color.A * alpha) / 255, color.R, color.G, color.B));
            }

            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
            output.Save(outputPath, ImageFormat.Png);
        }
    }
}
'@

if (-not ("DungeonClassPlaquePreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

[DungeonClassPlaquePreparation]::Prepare($InputPath, $OutputPath, $SourceCropSize, $DiscRadius, $SourceCenterOffsetX, $SourceCenterOffsetY)
Write-Output "Runtime plaque: 192x192"
Write-Output "Source center crop: $SourceCropSize px"
Write-Output "Disc radius: $DiscRadius px"
Write-Output "Source center offset: [$SourceCenterOffsetX, $SourceCenterOffsetY] px"
