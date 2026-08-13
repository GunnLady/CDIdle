param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [Parameter(Mandatory = $true)]
  [string]$NormalButtonPath,

  [Parameter(Mandatory = $true)]
  [string]$SelectedButtonPath,

  [Parameter(Mandatory = $true)]
  [string]$PreviewPath,

  [string]$Label = "Cite"
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

public static class PrimaryNavigationIconPreparation
{
    public static Rectangle Prepare(
        string inputPath,
        string outputPath,
        string normalButtonPath,
        string selectedButtonPath,
        string previewPath,
        string label)
    {
        using (var loaded = new Bitmap(inputPath))
        using (var source = ToArgb(loaded))
        {
            var alpha = BuildChromaAlpha(source);
            var bounds = FindBounds(alpha, source.Width, source.Height);
            using (var icon = CropWithAlpha(source, alpha, bounds))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
                SaveRuntimeIcon(icon, outputPath);
                CreatePreview(icon, normalButtonPath, selectedButtonPath, previewPath, label);
            }

            return bounds;
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

    private static Rectangle FindBounds(byte[] alpha, int width, int height)
    {
        var minX = width;
        var minY = height;
        var maxX = -1;
        var maxY = -1;

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                if (alpha[y * width + x] <= 24)
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
            throw new InvalidOperationException("No visible icon was detected.");
        }

        const int padding = 3;
        minX = Math.Max(0, minX - padding);
        minY = Math.Max(0, minY - padding);
        maxX = Math.Min(width - 1, maxX + padding);
        maxY = Math.Min(height - 1, maxY + padding);
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static Bitmap CropWithAlpha(Bitmap source, byte[] alpha, Rectangle bounds)
    {
        var output = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb);
        var sourceData = source.LockBits(new Rectangle(0, 0, source.Width, source.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var outputData = output.LockBits(new Rectangle(0, 0, output.Width, output.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

        try
        {
            var sourceBytes = new byte[Math.Abs(sourceData.Stride) * source.Height];
            var outputBytes = new byte[Math.Abs(outputData.Stride) * output.Height];
            Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);

            for (var y = 0; y < bounds.Height; y++)
            {
                for (var x = 0; x < bounds.Width; x++)
                {
                    var sourceX = bounds.X + x;
                    var sourceY = bounds.Y + y;
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

    private static void SaveRuntimeIcon(Bitmap icon, string outputPath)
    {
        const int canvasSize = 192;
        const int padding = 4;
        var availableSize = canvasSize - padding * 2;
        var ratio = Math.Min(availableSize / (double)icon.Width, availableSize / (double)icon.Height);
        var width = (int)Math.Round(icon.Width * ratio);
        var height = (int)Math.Round(icon.Height * ratio);
        var x = (canvasSize - width) / 2;
        var y = (canvasSize - height) / 2;

        using (var output = new Bitmap(canvasSize, canvasSize, PixelFormat.Format32bppArgb))
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
            graphics.DrawImage(icon, new Rectangle(x, y, width, height), 0, 0, icon.Width, icon.Height, GraphicsUnit.Pixel, attributes);
            output.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void CreatePreview(Bitmap icon, string normalButtonPath, string selectedButtonPath, string previewPath, string label)
    {
        var sizes = new[] { 32, 40, 48 };
        const int buttonWidth = 124;
        const int buttonHeight = 105;
        const int gap = 16;
        const int margin = 16;
        const int captionHeight = 24;
        var preview = new Bitmap(margin * 2 + buttonWidth * sizes.Length + gap * (sizes.Length - 1), margin * 2 + buttonHeight + captionHeight, PixelFormat.Format32bppArgb);

        using (preview)
        using (var normal = new Bitmap(normalButtonPath))
        using (var selected = new Bitmap(selectedButtonPath))
        using (var graphics = Graphics.FromImage(preview))
        using (var iconAttributes = new ImageAttributes())
        using (var labelFont = new Font("Georgia", 8.25f, FontStyle.Bold, GraphicsUnit.Point))
        using (var captionFont = new Font("Segoe UI", 8f, FontStyle.Regular, GraphicsUnit.Point))
        using (var labelBrush = new SolidBrush(Color.FromArgb(255, 233, 216, 171)))
        using (var captionBrush = new SolidBrush(Color.FromArgb(255, 220, 220, 220)))
        using (var labelFormat = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
        {
            graphics.Clear(Color.FromArgb(255, 20, 17, 15));
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            iconAttributes.SetWrapMode(WrapMode.TileFlipXY);

            for (var index = 0; index < sizes.Length; index++)
            {
                var x = margin + index * (buttonWidth + gap);
                var button = index == 1 ? selected : normal;
                graphics.DrawImage(button, new Rectangle(x, margin - 2, buttonWidth, buttonHeight + 2));

                var iconSize = sizes[index];
                var ratio = Math.Min(iconSize / (double)icon.Width, iconSize / (double)icon.Height);
                var iconWidth = (int)Math.Round(icon.Width * ratio);
                var iconHeight = (int)Math.Round(icon.Height * ratio);
                var contentHeight = iconHeight + 3 + 12;
                var contentTop = margin + (buttonHeight - contentHeight) / 2;
                var iconX = x + (buttonWidth - iconWidth) / 2;
                graphics.DrawImage(icon, new Rectangle(iconX, contentTop, iconWidth, iconHeight), 0, 0, icon.Width, icon.Height, GraphicsUnit.Pixel, iconAttributes);
                graphics.DrawString(label.ToUpperInvariant(), labelFont, labelBrush, new RectangleF(x, contentTop + iconHeight + 3, buttonWidth, 12), labelFormat);
                graphics.DrawString(sizes[index] + " px", captionFont, captionBrush, new PointF(x + 44, margin + buttonHeight + 6));
            }

            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(previewPath)));
            preview.Save(previewPath, ImageFormat.Png);
        }
    }
}
'@

if (-not ("PrimaryNavigationIconPreparation" -as [type])) {
  Add-Type -TypeDefinition $sourceCode -ReferencedAssemblies System.Drawing
}

$bounds = [PrimaryNavigationIconPreparation]::Prepare(
  $InputPath,
  $OutputPath,
  $NormalButtonPath,
  $SelectedButtonPath,
  $PreviewPath,
  $Label
)

Write-Output "Detected icon bounds: $($bounds.X),$($bounds.Y) $($bounds.Width)x$($bounds.Height)"
Write-Output "Transparent icon: $OutputPath"
Write-Output "Size preview: $PreviewPath"
