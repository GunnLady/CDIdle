param(
  [Parameter(Mandatory = $true)] [string]$InputDirectory,
  [Parameter(Mandatory = $true)] [string]$OutputDirectory,
  [int]$TargetWidth = 1024,
  [int]$TargetHeight = 448,
  [int]$JpegQuality = 88,
  [string]$FrameInputPath,
  [string]$FrameOutputPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourceCode = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;

public static class BuildingCardAssetPreparation
{
    public static void Prepare(string inputPath, string outputPath, int targetWidth, int targetHeight, long jpegQuality)
    {
        using (var source = new Bitmap(inputPath))
        using (var output = new Bitmap(targetWidth, targetHeight, PixelFormat.Format24bppRgb))
        using (var graphics = Graphics.FromImage(output))
        {
            var targetRatio = targetWidth / (double)targetHeight;
            var sourceRatio = source.Width / (double)source.Height;
            Rectangle sourceRect;

            if (sourceRatio > targetRatio)
            {
                var cropWidth = (int)Math.Round(source.Height * targetRatio);
                sourceRect = new Rectangle(0, 0, Math.Min(cropWidth, source.Width), source.Height);
            }
            else
            {
                var cropHeight = (int)Math.Round(source.Width / targetRatio);
                var cropTop = Math.Max(0, (source.Height - cropHeight) / 2);
                sourceRect = new Rectangle(0, cropTop, source.Width, Math.Min(cropHeight, source.Height));
            }

            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            graphics.DrawImage(source, new Rectangle(0, 0, targetWidth, targetHeight), sourceRect, GraphicsUnit.Pixel);

            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
            var encoder = ImageCodecInfo.GetImageEncoders().Single(codec => codec.FormatID == ImageFormat.Jpeg.Guid);
            using (var parameters = new EncoderParameters(1))
            {
                parameters.Param[0] = new EncoderParameter(Encoder.Quality, jpegQuality);
                output.Save(outputPath, encoder, parameters);
            }
        }
    }

    public static void PrepareFrame(string inputPath, string outputPath, int targetWidth)
    {
        using (var source = new Bitmap(inputPath))
        {
            var targetHeight = (int)Math.Round(source.Height * targetWidth / (double)source.Width);
            using (var output = new Bitmap(targetWidth, targetHeight, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.DrawImage(source, new Rectangle(0, 0, targetWidth, targetHeight));
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
'@

if (-not ("BuildingCardAssetPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$inputs = Get-ChildItem -LiteralPath $InputDirectory -File -Filter "building-card-*-v1.png" |
  Where-Object { $_.Name -notlike "building-card-frame-*" } |
  Sort-Object Name

foreach ($input in $inputs) {
  $outputName = [System.IO.Path]::ChangeExtension($input.Name, ".jpg")
  $outputPath = Join-Path $OutputDirectory $outputName
  [BuildingCardAssetPreparation]::Prepare($input.FullName, $outputPath, $TargetWidth, $TargetHeight, $JpegQuality)
  Write-Output "$($input.Name) -> $outputName"
}

if ($FrameInputPath -and $FrameOutputPath) {
  [BuildingCardAssetPreparation]::PrepareFrame($FrameInputPath, $FrameOutputPath, $TargetWidth)
  Write-Output "Frame -> $FrameOutputPath"
}
