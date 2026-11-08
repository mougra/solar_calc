# Генерация OG-картинок 1200×630 для соцсетей.
# Требует Windows (System.Drawing) и шрифт Segoe UI.
# Запуск: powershell -ExecutionPolicy Bypass -File scripts/generate-og.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\public\og"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-OgImage {
    param(
        [string]$FileName,
        [string[]]$Lines,
        [string]$Subtitle
    )

    $w = 1200
    $h = 630
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $c1 = [System.Drawing.ColorTranslator]::FromHtml("#04231d")
    $c2 = [System.Drawing.ColorTranslator]::FromHtml("#0f766e")
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 35)
    $g.FillRectangle($bg, $rect)

    # Декоративные круги
    $glow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 251, 191, 36))
    $g.FillEllipse($glow, 900, -140, 520, 520)
    $g.FillEllipse($glow, -180, 430, 460, 460)

    # Солнце
    $sun = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fbbf24"))
    $g.FillEllipse($sun, 985, 90, 120, 120)
    $sunCore = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#fde68a"))
    $g.FillEllipse($sunCore, 1010, 115, 70, 70)

    # Бренд
    $brandFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString("SolarCalc", $brandFont, $white, 80, 64)

    $dot = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#34d399"))
    $g.FillEllipse($dot, 80, 128, 10, 10)
    $smallFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Regular)
    $muted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#a7f3d0"))
    $g.DrawString("solarcalc.ru", $smallFont, $muted, 100, 116)

    # Заголовок
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 58, [System.Drawing.FontStyle]::Bold)
    $y = 220
    foreach ($line in $Lines) {
        $g.DrawString($line, $titleFont, $white, 78, $y)
        $y += 82
    }

    # Подзаголовок
    $subFont = New-Object System.Drawing.Font("Segoe UI", 27, [System.Drawing.FontStyle]::Regular)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#d1fae5"))
    $g.DrawString($Subtitle, $subFont, $subBrush, 80, ($y + 18))

    # Нижняя линия
    $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), 2)
    $g.DrawLine($linePen, 80, 540, 1120, 540)
    $footFont = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Regular)
    $g.DrawString("Бесплатный расчёт · данные PVGIS · без регистрации", $footFont, $muted, 80, 560)

    $path = Join-Path $outDir $FileName
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Output "OK $path"
}

New-OgImage -FileName "home.png" -Lines @("Калькулятор солнечных", "панелей для дома") -Subtitle "Расчёт по реальной инсоляции — 85 городов России"
New-OgImage -FileName "calculator.png" -Lines @("Расчёт солнечной", "электростанции") -Subtitle "Панели · аккумуляторы · инвертор · кабель"
New-OgImage -FileName "city.png" -Lines @("Солнечная станция", "в вашем городе") -Subtitle "Выработка по месяцам и подбор оборудования"
New-OgImage -FileName "article.png" -Lines @("Статьи о солнечной", "энергетике") -Subtitle "Практика, расчёты и типичные ошибки"
