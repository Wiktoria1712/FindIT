$ErrorActionPreference = "Stop"

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8080)
$listener.Start()

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".ico" = "image/x-icon"
}

function Get-ReasonPhrase([int]$statusCode) {
  switch ($statusCode) {
    200 { return "OK" }
    404 { return "Not Found" }
    default { return "OK" }
  }
}

function Get-FilePathFromRequest([string]$requestPath) {
  $relative = [System.Uri]::UnescapeDataString($requestPath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($relative)) {
    $relative = "index.html"
  }

  $candidate = Join-Path $root $relative

  if ((Test-Path $candidate) -and (Get-Item $candidate).PSIsContainer) {
    $candidate = Join-Path $candidate "index.html"
  }

  return $candidate
}

function Send-Response($stream, [int]$statusCode, [byte[]]$bodyBytes, [string]$contentType) {
  $writer = [System.IO.StreamWriter]::new($stream, [System.Text.Encoding]::ASCII, 1024, $true)
  $writer.NewLine = "`r`n"
  $writer.WriteLine("HTTP/1.1 $statusCode $(Get-ReasonPhrase $statusCode)")
  $writer.WriteLine("Content-Type: $contentType")
  $writer.WriteLine("Content-Length: $($bodyBytes.Length)")
  $writer.WriteLine("Connection: close")
  $writer.WriteLine()
  $writer.Flush()
  $stream.Write($bodyBytes, 0, $bodyBytes.Length)
  $stream.Flush()
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      while ($reader.ReadLine()) {
      }

      if (-not $requestLine) {
        continue
      }

      $parts = $requestLine.Split(" ")
      $path = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
      $filePath = Get-FilePathFromRequest $path

      if (Test-Path $filePath) {
        $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $contentType = $contentTypes[$extension]
        if (-not $contentType) {
          $contentType = "application/octet-stream"
        }

        $bodyBytes = [System.IO.File]::ReadAllBytes($filePath)
        Send-Response $stream 200 $bodyBytes $contentType
      } else {
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        Send-Response $stream 404 $bodyBytes "text/plain; charset=utf-8"
      }
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
