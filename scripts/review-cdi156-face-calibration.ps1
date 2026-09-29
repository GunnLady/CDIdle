<#
Renders manually annotated anatomical landmarks at the proposed runtime scale.
Reads normalized PNGs and face-calibration.json; never modifies sprite pixels.
Requires Windows System.Drawing. Hidden hairlines/cranial tops are estimates;
this diagnostic supports, but does not replace, the user's harness validation.
#>
[CmdletBinding()]
param([string]$OutputDirectory = '.tmp/cdi156-face-calibration')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$data = Get-Content (Join-Path $root 'assets/design/hero-sprites/cdi-156/face-calibration.json') -Raw | ConvertFrom-Json
$runtime = Get-Content (Join-Path $root 'src/assets/artificerCdi156CombatPoses.ts') -Raw
$output = Join-Path $root $OutputDirectory
New-Item -ItemType Directory -Path $output -Force | Out-Null
foreach ($gender in @('female','male')) {
  $match = [regex]::Match($runtime,('const ' + $gender + 'Scales = \[([^\]]+)\]'))
  if (-not $match.Success) { throw "Missing runtime scales: $gender" }
  $runtimeScales = @($match.Groups[1].Value.Split(',') | ForEach-Object {
    [double]::Parse($_.Trim(),[Globalization.CultureInfo]::InvariantCulture)
  })
  $entries = @($data.entries | Where-Object gender -EQ $gender)
  if ($runtimeScales.Count -ne $entries.Count) { throw "Runtime scale count mismatch: $gender" }
  $reference = $entries[0]
  $refFace = [Math]::Sqrt([Math]::Pow($reference.chin[0]-$reference.hairline[0],2)+[Math]::Pow($reference.chin[1]-$reference.hairline[1],2))
  $refHead = $reference.chin[1]-$reference.headTopY
  $canvas = [System.Drawing.Bitmap]::new(2000,860)
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.Clear([System.Drawing.Color]::FromArgb(50,50,56))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $font = [System.Drawing.Font]::new('Consolas',12)
  $facePen = [System.Drawing.Pen]::new([System.Drawing.Color]::Cyan,2)
  $headPen = [System.Drawing.Pen]::new([System.Drawing.Color]::LimeGreen,2)
  for ($i=0; $i -lt $entries.Count; $i++) {
    $e=$entries[$i]
    $face=[Math]::Sqrt([Math]::Pow($e.chin[0]-$e.hairline[0],2)+[Math]::Pow($e.chin[1]-$e.hairline[1],2))
    $head=$e.chin[1]-$e.headTopY
    $expected=[Math]::Round($data.references.$gender.scale*[Math]::Pow($refFace/$face,0.75)*[Math]::Pow($refHead/$head,0.25),2)
    $landmarkScale = if ($null -ne $e.landmarkScale) { $e.landmarkScale } else { $e.scale }
    if ([Math]::Abs($expected-$landmarkScale) -gt 0.001) { throw "Scale mismatch: $($e.id)" }
    if ($null -ne $e.landmarkScale -and [string]::IsNullOrWhiteSpace($e.visualAdjustment)) {
      throw "Missing visual adjustment reason: $($e.id)"
    }
    if ([Math]::Abs($runtimeScales[$e.variant]-$e.scale) -gt 0.001) {
      throw "Runtime scale differs from calibration: $($e.id)"
    }
    $path=Join-Path $root $e.normalized
    if ($e.sha256 -and (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $e.sha256) { throw "Source changed: $($e.id)" }
    $im=[System.Drawing.Image]::FromFile($path)
    $s=2.0*$e.scale
    $cx=($i%5)*400+200; $cy=[Math]::Floor($i/5)*430+330
    $source=[System.Drawing.RectangleF]::new(($e.chin[0]-150),[Math]::Max(0,$e.headTopY-55),300,($e.chin[1]-[Math]::Max(0,$e.headTopY-55)+30))
    $dest=[System.Drawing.RectangleF]::new(($cx-150*$s),($cy+($source.Y-$e.chin[1])*$s),($source.Width*$s),($source.Height*$s))
    $g.SetClip([System.Drawing.Rectangle]::new((($i%5)*400),([Math]::Floor($i/5)*430+50),400,350))
    $g.DrawImage($im,$dest,$source,[System.Drawing.GraphicsUnit]::Pixel)
    $hx=$cx+($e.hairline[0]-$e.chin[0])*$s; $hy=$cy+($e.hairline[1]-$e.chin[1])*$s
    $g.DrawLine($facePen,[single]$hx,[single]$hy,[single]$cx,[single]$cy)
    $g.DrawEllipse($facePen,[single]($hx-4),[single]($hy-4),8,8)
    $g.DrawEllipse($facePen,[single]($cx-4),[single]($cy-4),8,8)
    $top=$cy+($e.headTopY-$e.chin[1])*$s
    $g.DrawLine($headPen,[single]($cx-90),[single]$top,[single]($cx+50),[single]$top)
    $g.FillEllipse([System.Drawing.Brushes]::Yellow,[single]($cx+($e.eyeMidpoint[0]-$e.chin[0])*$s-3),[single]($cy+($e.eyeMidpoint[1]-$e.chin[1])*$s-3),6,6)
    $g.ResetClip()
    $g.DrawString(("{0} scale={1:0.00} face={2:0.0} head={3}" -f $e.id,$e.scale,$face,$head),$font,[System.Drawing.Brushes]::White,(($i%5)*400+8),([Math]::Floor($i/5)*430+8))
    $im.Dispose()
  }
  $path=Join-Path $output "$gender-calibrated-heads.png"
  $canvas.Save($path)
  $font.Dispose();$facePen.Dispose();$headPen.Dispose();$g.Dispose();$canvas.Dispose()
  Write-Output $path
}
