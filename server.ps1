param(
  [int]$Port = 8765,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$script:Root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$script:RootPrefix = $script:Root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$script:BistroBaseUrl = "https://es.bistrosoft.com"
$script:BistroUsername = $env:BISTROSOFT_USERNAME
$script:BistroPassword = $null
$script:BistroSession = $null
$script:IsConnected = $false
$script:LastSyncAt = $null
$script:LastError = $null

function Get-PlainPassword {
  param([Security.SecureString]$SecurePassword)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Connect-Bistrosoft {
  $script:BistroSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $plainPassword = Get-PlainPassword $script:BistroPassword

  try {
    $body = @{
      username = $script:BistroUsername
      password = $plainPassword
    } | ConvertTo-Json

    $login = Invoke-RestMethod `
      -Method Post `
      -Uri "$script:BistroBaseUrl/api/auth" `
      -ContentType "application/json" `
      -Body $body `
      -WebSession $script:BistroSession

    if ($login.responseCode -ne 0) {
      throw "Bistrosoft rechazo el inicio de sesion."
    }

    $tags = Invoke-RestMethod `
      -Method Post `
      -Uri "$script:BistroBaseUrl/api/auth/getMerchantTags" `
      -ContentType "application/json" `
      -Body $body `
      -WebSession $script:BistroSession

    if ($tags.responseCode -ne 0) {
      throw "Bistrosoft no pudo cargar los comercios asociados."
    }

    $script:IsConnected = $true
    $script:LastError = $null
  } finally {
    $plainPassword = $null
    $body = $null
  }
}

function Invoke-BistrosoftGet {
  param([string]$RelativeUrl)

  if (-not $script:IsConnected) {
    Connect-Bistrosoft
  }

  try {
    return Invoke-RestMethod `
      -Method Get `
      -Uri "$script:BistroBaseUrl$RelativeUrl" `
      -WebSession $script:BistroSession
  } catch {
    $script:IsConnected = $false
    Connect-Bistrosoft
    return Invoke-RestMethod `
      -Method Get `
      -Uri "$script:BistroBaseUrl$RelativeUrl" `
      -WebSession $script:BistroSession
  }
}

function Convert-BistroDate {
  param([string]$Value)

  $parsed = [DateTime]::ParseExact(
    $Value,
    "dd-MM-yyyy",
    [Globalization.CultureInfo]::InvariantCulture
  )
  return $parsed.ToString("yyyy-MM-dd")
}

function Get-PaymentMethod {
  param($Sale)

  $text = "$($Sale.paymentInfo)".ToUpperInvariant()
  if ($text.Contains("TARJETA")) { return "Tarjeta" }
  if ($text.Contains("EFECTIVO")) { return "Efectivo" }
  if ($text.Contains("ONLINE")) { return "Online" }
  if ($text.Contains("QR")) { return "QR" }
  if ($text.Contains("INVIT")) { return "Invitacion" }
  if ($text.Contains("CUENTA")) { return "Cuenta" }
  return ""
}

function Get-BistrosoftSales {
  param(
    [DateTime]$From,
    [DateTime]$Until
  )

  $page = 1
  $countPerPage = 5000
  $allSales = New-Object System.Collections.Generic.List[object]
  $totalCount = 0

  do {
    $query = "Period=ConfigurablePeriod&From=$($From.ToString('yyyy-MM-dd'))&Until=$($Until.ToString('yyyy-MM-dd'))&CurrentPage=$page&CountPerPage=$countPerPage"
    $response = Invoke-BistrosoftGet "/api/consolidatedV2/?$query"

    if ($response.responseCode -ne 0) {
      throw "Bistrosoft no pudo entregar las ventas solicitadas."
    }

    $totalCount = [int]$response.totalCount
    foreach ($sale in @($response.sales)) {
      $stableId = if ($sale.uuid) { $sale.uuid } else { "$($sale.shopCode)-$($sale.id)" }
      $allSales.Add([pscustomobject]@{
        id = "bistro-$stableId"
        date = Convert-BistroDate "$($sale.date)"
        time = "$($sale.hour)"
        ticketNumber = "$($sale.id)"
        total = [double]$sale.amount
        count = 1
        items = @()
        paymentMethod = Get-PaymentMethod $sale
        movementType = $sale.movementType
        status = $sale.status
        shopCode = "$($sale.shopCode)"
        _source = "bistrosoft"
        _isBistrosoft = $true
      })
    }

    $page++
  } while ($allSales.Count -lt $totalCount)

  $script:LastSyncAt = [DateTime]::UtcNow.ToString("o")
  $script:LastError = $null

  return [pscustomobject]@{
    ok = $true
    source = "bistrosoft"
    from = $From.ToString("yyyy-MM-dd")
    until = $Until.ToString("yyyy-MM-dd")
    fetchedAt = $script:LastSyncAt
    totalCount = $allSales.Count
    sales = $allSales
  }
}

function Write-JsonResponse {
  param(
    $Context,
    $Data,
    [int]$StatusCode = 200
  )

  $json = $Data | ConvertTo-Json -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = "application/json; charset=utf-8"
  $Context.Response.Headers["Cache-Control"] = "no-store"
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.OutputStream.Close()
}

function Write-TextResponse {
  param(
    $Context,
    [string]$Text,
    [string]$ContentType,
    [int]$StatusCode = 200
  )

  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = $ContentType
  $Context.Response.Headers["Cache-Control"] = "no-cache"
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.OutputStream.Close()
}

function Get-ContentType {
  param([string]$Path)

  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".svg" { return "image/svg+xml" }
    ".png" { return "image/png" }
    ".ico" { return "image/x-icon" }
    default { return "application/octet-stream" }
  }
}

function Handle-Request {
  param($Context)

  $request = $Context.Request
  $path = $request.Url.AbsolutePath

  if ($path -eq "/api/bistrosoft/status") {
    Write-JsonResponse $Context ([pscustomobject]@{
      configured = $true
      connected = $script:IsConnected
      lastSyncAt = $script:LastSyncAt
      lastError = $script:LastError
      syncIntervalSeconds = 30
    })
    return
  }

  if ($path -eq "/api/bistrosoft/sales") {
    try {
      $fromText = "$($request.QueryString['from'])"
      $untilText = "$($request.QueryString['until'])"
      $from = [DateTime]::ParseExact($fromText, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)
      $until = [DateTime]::ParseExact($untilText, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)

      if ($until -le $from -or ($until - $from).TotalDays -gt 370) {
        throw "El rango solicitado no es valido."
      }

      Write-JsonResponse $Context (Get-BistrosoftSales -From $from -Until $until)
    } catch {
      $script:LastError = $_.Exception.Message
      Write-JsonResponse $Context ([pscustomobject]@{
        ok = $false
        error = "No se pudo sincronizar Bistrosoft."
      }) 502
    }
    return
  }

  $relativePath = [Uri]::UnescapeDataString($path.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($relativePath)) {
    $relativePath = "index.html"
  }

  $allowedExtensions = @(".html", ".js", ".css", ".json", ".svg", ".png", ".ico")
  $extension = [IO.Path]::GetExtension($relativePath).ToLowerInvariant()
  if ($allowedExtensions -notcontains $extension) {
    Write-TextResponse $Context "No encontrado" "text/plain; charset=utf-8" 404
    return
  }

  $fullPath = [IO.Path]::GetFullPath((Join-Path $script:Root $relativePath))
  if (-not $fullPath.StartsWith($script:RootPrefix, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
    Write-TextResponse $Context "No encontrado" "text/plain; charset=utf-8" 404
    return
  }

  $bytes = [IO.File]::ReadAllBytes($fullPath)
  $Context.Response.StatusCode = 200
  $Context.Response.ContentType = Get-ContentType $fullPath
  $Context.Response.Headers["Cache-Control"] = "no-cache"
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.OutputStream.Close()
}

if ([string]::IsNullOrWhiteSpace($script:BistroUsername)) {
  $script:BistroUsername = Read-Host "Usuario Bistrosoft"
}

if (-not [string]::IsNullOrWhiteSpace($env:BISTROSOFT_PASSWORD)) {
  $script:BistroPassword = ConvertTo-SecureString $env:BISTROSOFT_PASSWORD -AsPlainText -Force
  $env:BISTROSOFT_PASSWORD = $null
} else {
  $script:BistroPassword = Read-Host "Contrasena Bistrosoft" -AsSecureString
}

Write-Host "Conectando con Bistrosoft..."
Connect-Bistrosoft
Write-Host "Bistrosoft conectado correctamente."

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "OSS Kaffe disponible en $url"
Write-Host "La sincronizacion de Finanzas se actualiza cada 30 segundos."
Write-Host "Manten esta ventana abierta. Presiona Ctrl+C para cerrar."

if (-not $NoBrowser) {
  Start-Process $url
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      Handle-Request $context
    } catch {
      if ($context.Response.OutputStream.CanWrite) {
        Write-TextResponse $context "Error interno" "text/plain; charset=utf-8" 500
      }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
