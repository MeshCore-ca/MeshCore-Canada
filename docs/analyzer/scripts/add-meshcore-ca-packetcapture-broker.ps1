param(
    [string]$Iata = "",
    [string]$InstallDir = "",
    [string]$Broker1Host = "mqtt1.meshcore.ca",
    [string]$Broker2Host = "mqtt2.meshcore.ca",
    [int]$BrokerPort = 443,
    [switch]$InstallPacketCapture
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[MeshCore.ca] $Message" -ForegroundColor Cyan
}

function Prompt-YesNo {
    param(
        [string]$Prompt,
        [bool]$DefaultYes = $true
    )
    $suffix = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
    $answer = Read-Host "$Prompt $suffix"
    if ([string]::IsNullOrWhiteSpace($answer)) {
        return $DefaultYes
    }
    switch ($answer.Trim().ToLowerInvariant()) {
        "y" { return $true }
        "yes" { return $true }
        default { return $false }
    }
}

function Resolve-Iata {
    param([string]$Value)
    $candidate = $Value.Trim().ToUpperInvariant()
    if ([string]::IsNullOrWhiteSpace($candidate)) {
        $candidate = Read-Host "Enter 3-character region/IATA code"
        $candidate = $candidate.Trim().ToUpperInvariant()
    }
    if ($candidate -notmatch '^[A-Z0-9]{3}$') {
        throw "IATA/region code must be exactly 3 letters or numbers."
    }
    return $candidate
}

function Resolve-InstallDir {
    param([string]$Path)
    if (-not [string]::IsNullOrWhiteSpace($Path)) {
        return $Path
    }
    return (Join-Path $env:USERPROFILE ".meshcore-packet-capture")
}

function New-BackupPath {
    param([string]$Path)
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
    $candidate = "$Path.bak.$stamp"
    $suffix = 1
    while (Test-Path $candidate) {
        $candidate = "$Path.bak.$stamp.$suffix"
        $suffix += 1
    }
    return $candidate
}

function Write-Utf8NoBomLines {
    param(
        [string]$Path,
        [string[]]$Lines
    )
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($Path, $Lines, $encoding)
}

function Set-EnvValue {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )
    $lines = @()
    if (Test-Path $Path) {
        $lines = Get-Content $Path
    }
    $updated = $false
    $out = foreach ($line in $lines) {
        if ($line -match "^${Key}=") {
            if (-not $updated) {
                $updated = $true
                "${Key}=${Value}"
            }
        }
        else {
            $line
        }
    }
    if (-not $updated) {
        $out += "${Key}=${Value}"
    }
    Write-Utf8NoBomLines -Path $Path -Lines $out
}

function Set-PacketCaptureSlot {
    param(
        [string]$Path,
        [int]$Slot,
        [string]$Host
    )
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_ENABLED" -Value "true"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_SERVER" -Value $Host
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_PORT" -Value $BrokerPort
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_TRANSPORT" -Value "websockets"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_USE_TLS" -Value "true"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_TLS_VERIFY" -Value "true"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_USE_AUTH_TOKEN" -Value "true"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_TOKEN_AUDIENCE" -Value $Host
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_KEEPALIVE" -Value "120"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_QOS" -Value "0"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_RETAIN" -Value "true"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_TOPIC_STATUS" -Value "meshcore/{IATA}/{PUBLIC_KEY}/status"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_TOPIC_PACKETS" -Value "meshcore/{IATA}/{PUBLIC_KEY}/packets"
}

function Disable-PacketCaptureSlot {
    param(
        [string]$Path,
        [int]$Slot
    )
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_ENABLED" -Value "false"
    Set-EnvValue -Path $Path -Key "PACKETCAPTURE_MQTT${Slot}_SERVER" -Value ""
}

function Ensure-PacketCaptureInstall {
    param([string]$Path)
    $packetCapturePy = Join-Path $Path "packet_capture.py"
    if (Test-Path $packetCapturePy) {
        return $Path
    }
    $shouldInstall = $InstallPacketCapture.IsPresent
    if (-not $shouldInstall) {
        $shouldInstall = Prompt-YesNo -Prompt "meshcore-packet-capture is not installed. Run the upstream Windows installer now?" -DefaultYes $true
    }
    if (-not $shouldInstall) {
        return $Path
    }
    Write-Info "Running upstream meshcore-packet-capture Windows installer."
    Invoke-Expression ((Invoke-WebRequest -Uri "https://raw.githubusercontent.com/agessaman/meshcore-packet-capture/main/install.ps1" -UseBasicParsing).Content)
    if (Test-Path $packetCapturePy) {
        return $Path
    }
    $actualPath = Read-Host "Enter the install directory used by the upstream installer"
    if ([string]::IsNullOrWhiteSpace($actualPath)) {
        $actualPath = $Path
    }
    return $actualPath
}

$InstallDir = Resolve-InstallDir -Path $InstallDir
$requestedInstallDir = $InstallDir
$Iata = Resolve-Iata -Value $Iata

Write-Info "Using install directory: $InstallDir"
Write-Info "Region selected: $Iata"

$InstallDir = Ensure-PacketCaptureInstall -Path $InstallDir
if ($InstallDir -ne $requestedInstallDir) {
    Write-Info "Using install directory: $InstallDir"
}

$envPath = Join-Path $InstallDir ".env.local"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}
if (-not (Test-Path $envPath)) {
    New-Item -ItemType File -Path $envPath -Force | Out-Null
}

$backupPath = New-BackupPath -Path $envPath
Copy-Item -Path $envPath -Destination $backupPath -Force

Set-EnvValue -Path $envPath -Key "PACKETCAPTURE_IATA" -Value $Iata
Set-PacketCaptureSlot -Path $envPath -Slot 1 -Host $Broker1Host
Set-PacketCaptureSlot -Path $envPath -Slot 2 -Host $Broker2Host
foreach ($slot in 3..6) {
    Disable-PacketCaptureSlot -Path $envPath -Slot $slot
}

Write-Host ""
Write-Info "Patched: $envPath"
Write-Info "Backup written: $backupPath"
Write-Info "MQTT1: $Broker1Host`:$BrokerPort"
Write-Info "MQTT2: $Broker2Host`:$BrokerPort"
Write-Host ""
Write-Host "Next:" -ForegroundColor White
Write-Host "  1. Restart your packet-capture process."
Write-Host "  2. Confirm observers and packets appear through the MeshCore.ca broker pair."
