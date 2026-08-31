# Regenerates the site icon set (assets/*.png + favicon.ico) from a source PNG.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File resize-icons.ps1 <source-png-path>
Add-Type -AssemblyName System.Drawing

$root    = Join-Path $PSScriptRoot 'assets'
$srcPath = $args[0]
if (-not $srcPath -or -not (Test-Path $srcPath)) { throw 'Source PNG path required.' }

$src = [System.Drawing.Bitmap]::new((Resolve-Path $srcPath).Path)

# Sample the true background colour from a guaranteed-empty spot
$bg = $src.GetPixel([int]($src.Width / 2), [int]($src.Height * 0.06))

# Flatten onto a solid background so rounded/transparent corners disappear
$flat = New-Object System.Drawing.Bitmap $src.Width, $src.Height
$g = [System.Drawing.Graphics]::FromImage($flat)
$g.Clear($bg)
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)
$g.Dispose()
$src.Dispose()

# Scrub any leftover near-white corner pixels (from rounded-corner renders)
$block = 160
$corners = @(@(0, 0), @(($flat.Width - $block), 0), @(0, ($flat.Height - $block)), @(($flat.Width - $block), ($flat.Height - $block)))
foreach ($c in $corners) {
    for ($x = $c[0]; $x -lt $c[0] + $block; $x++) {
        for ($y = $c[1]; $y -lt $c[1] + $block; $y++) {
            $p = $flat.GetPixel($x, $y)
            if ($p.R -gt 120 -and $p.G -gt 120 -and $p.B -gt 120) { $flat.SetPixel($x, $y, $bg) }
        }
    }
}

function New-Resized([System.Drawing.Bitmap]$bmp, [int]$w, [int]$h, [System.Drawing.Color]$bgc) {
    $out = New-Object System.Drawing.Bitmap $w, $h
    $gg = [System.Drawing.Graphics]::FromImage($out)
    $gg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gg.Clear($bgc)
    $gg.DrawImage($bmp, 0, 0, $w, $h)
    $gg.Dispose()
    return $out
}

$sizes = @(
    @('favicon-16x16.png', 16, 16),
    @('favicon-32x32.png', 32, 32),
    @('android-chrome-192x192.png', 192, 192),
    @('android-chrome-512x512.png', 512, 512),
    @('apple-touch-icon.png', 180, 180),
    @('mstile-70x70.png', 70, 70),
    @('mstile-144x144.png', 144, 144),
    @('mstile-150x150.png', 150, 150),
    @('mstile-310x310.png', 310, 310)
)

foreach ($s in $sizes) {
    $r = New-Resized $flat $s[1] $s[2] $bg
    $r.Save((Join-Path $root $s[0]), [System.Drawing.Imaging.ImageFormat]::Png)
    $r.Dispose()
    Write-Output ('wrote ' + $s[0])
}

# Wide Windows tile: 150x150 emblem centred on a 310x150 canvas
$wide = New-Object System.Drawing.Bitmap 310, 150
$gw = [System.Drawing.Graphics]::FromImage($wide)
$gw.Clear($bg)
$icon150 = New-Resized $flat 150 150 $bg
$gw.DrawImage($icon150, 80, 0, 150, 150)
$gw.Dispose()
$icon150.Dispose()
$wide.Save((Join-Path $root 'mstile-310x150.png'), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'wrote mstile-310x150.png'

# Master copy for future resizes
$flat.Save((Join-Path $root 'icon-1024.png'), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'wrote icon-1024.png'

# favicon.ico: ICO container with an embedded 32x32 PNG
$ms = New-Object System.IO.MemoryStream
$icon32 = New-Resized $flat 32 32 $bg
$icon32.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray()
$icon32.Dispose()

$fs = [System.IO.File]::Create((Join-Path $root 'favicon.ico'))
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)               # reserved
$bw.Write([UInt16]1)               # type: icon
$bw.Write([UInt16]1)               # image count
$bw.Write([byte]32)                # width
$bw.Write([byte]32)                # height
$bw.Write([byte]0)                 # palette
$bw.Write([byte]0)                 # reserved
$bw.Write([UInt16]1)               # planes
$bw.Write([UInt16]32)              # bits per pixel
$bw.Write([UInt32]$png.Length)     # image data size
$bw.Write([UInt32]22)              # data offset
$bw.Write($png)
$bw.Close()
Write-Output 'wrote favicon.ico'

$flat.Dispose()
