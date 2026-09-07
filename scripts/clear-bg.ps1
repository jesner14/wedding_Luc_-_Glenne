Add-Type -AssemblyName System.Drawing

$srcPath = $args[0]
$dstPath = $args[1]

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)
$g.Dispose()
$src.Dispose()

function Test-Bg([System.Drawing.Color]$c) {
  return ($c.R -ge 235 -and $c.G -ge 230 -and $c.B -ge 220 -and [Math]::Abs($c.R - $c.G) -lt 25 -and [Math]::Abs($c.G - $c.B) -lt 25)
}

$w = $bmp.Width
$h = $bmp.Height
$visited = New-Object bool[] ($w * $h)
$queue = New-Object System.Collections.Generic.Queue[int]

function Enqueue([int]$x, [int]$y) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { return }
  $i = $y * $w + $x
  if ($visited[$i]) { return }
  $visited[$i] = $true
  $c = $bmp.GetPixel($x, $y)
  if (Test-Bg $c) { $queue.Enqueue($i) }
}

for ($x = 0; $x -lt $w; $x++) { Enqueue $x 0; Enqueue $x ($h - 1) }
for ($y = 0; $y -lt $h; $y++) { Enqueue 0 $y; Enqueue ($w - 1) $y }

while ($queue.Count -gt 0) {
  $i = $queue.Dequeue()
  $x = $i % $w
  $y = [Math]::Floor($i / $w)
  $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  Enqueue ($x + 1) $y
  Enqueue ($x - 1) $y
  Enqueue $x ($y + 1)
  Enqueue $x ($y - 1)
}

$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    if ($bmp.GetPixel($x, $y).A -gt 10) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

$pad = 8
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($w - 1, $maxX + $pad)
$maxY = [Math]::Min($h - 1, $maxY + $pad)
$cw = $maxX - $minX + 1
$ch = $maxY - $minY + 1

$rect = New-Object System.Drawing.Rectangle $minX, $minY, $cw, $ch
$cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cropped.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
$bmp.Dispose()
Write-Output "saved $dstPath ($cw x $ch)"
