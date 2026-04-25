$ErrorActionPreference = "Stop"

$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$studioJbr = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path (Join-Path $sdkRoot "platform-tools\adb.exe"))) {
  throw "Android SDK is incomplete. Open Android Studio SDK Setup or install platform-tools with sdkmanager."
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

if (Test-Path $studioJbr) {
  $env:JAVA_HOME = $studioJbr
}

$androidPathParts = @(
  (Join-Path $sdkRoot "platform-tools"),
  (Join-Path $sdkRoot "emulator"),
  (Join-Path $sdkRoot "cmdline-tools\latest\bin"),
  $env:Path
)

$env:Path = $androidPathParts -join ";"

if (-not $env:CAPACITOR_SERVER_URL) {
  $deviceLines = (& adb devices) | Where-Object { $_ -match "\tdevice$" }
  $hasPhysicalDevice = $deviceLines | Where-Object { $_ -notmatch "^emulator-" }

  if ($hasPhysicalDevice) {
    $hostIp = Get-NetIPConfiguration |
      Where-Object { $_.IPv4Address -and $_.NetAdapter.Status -eq "Up" } |
      ForEach-Object { $_.IPv4Address.IPAddress } |
      Where-Object { $_ -notmatch "^169\.254\." -and $_ -ne "127.0.0.1" -and $_ -notmatch "^192\.168\.56\." -and $_ -notmatch "^192\.168\.91\." } |
      Select-Object -First 1

    if (-not $hostIp) {
      throw "Could not detect a LAN IP for this PC. Set CAPACITOR_SERVER_URL manually, for example http://192.168.x.x:3000."
    }

    $env:CAPACITOR_SERVER_URL = "http://${hostIp}:3000"
  } else {
    $env:CAPACITOR_SERVER_URL = "http://10.0.2.2:3000"
  }
}

Write-Host "Using CAPACITOR_SERVER_URL=$env:CAPACITOR_SERVER_URL"

npx cap run android
