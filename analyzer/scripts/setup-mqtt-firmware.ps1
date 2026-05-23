param(
    [string]$Board = "",
    [string]$Role = "",
    [string]$Iata = "",
    [string]$Name = "",
    [string]$WifiSsid = "",
    [string]$WifiPassword = "",
    [string]$Port = "",
    [int]$Baud = 115200,
    [double]$DelaySeconds = 0.25,
    [switch]$PrintOnly,
    [switch]$RestoreBrokers,
    [switch]$NoRestoreBrokers,
    [switch]$NoSetRadio,
    [switch]$Repeat,
    [switch]$ObserveOnly,
    [switch]$ListIata,
    [string]$Broker1Host = "mqtt1.meshcore.ca",
    [string]$Broker2Host = "mqtt2.meshcore.ca"
)

$ErrorActionPreference = "Stop"
$script:UsePrintOnly = $PrintOnly.IsPresent

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

function Read-SecretPlainText {
    param([string]$Prompt)
    $secure = Read-Host $Prompt -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$IataChoices = @"
Ontario|YYZ|Toronto (Pearson)
Ontario|YTZ|Toronto (Billy Bishop)
Ontario|YOW|Ottawa
Ontario|YHM|Hamilton
Ontario|YKF|Kitchener / Waterloo
Ontario|YXU|London
Ontario|YOO|Oshawa
Ontario|YKZ|Buttonville / Markham
Ontario|YAM|Sault Ste. Marie
Ontario|YQT|Thunder Bay
Ontario|YSB|Sudbury
Ontario|YTS|Timmins
Ontario|YQG|Windsor
Ontario|YYB|North Bay
Ontario|YGK|Kingston
Ontario|YPQ|Peterborough
Ontario|YTR|Trenton / Quinte West
Ontario|YHD|Dryden
Ontario|YPL|Pickle Lake
Ontario|YND|Gatineau (Ottawa area)
Quebec|YUL|Montreal (Trudeau)
Quebec|YMX|Montreal (Mirabel)
Quebec|YQB|Quebec City
Quebec|YBG|Bagotville / Saguenay
Quebec|YVO|Val-d'Or
Quebec|YHU|Montreal (St-Hubert)
Quebec|YRJ|Roberval
Quebec|YGL|La Grande Riviere
Quebec|YSC|Sherbrooke
Quebec|YTQ|Tasiujaq
Quebec|YUY|Rouyn-Noranda
Quebec|YZV|Sept-Iles
Quebec|YGP|Gaspe
Quebec|YRQ|Trois-Rivieres
British Columbia|YVR|Vancouver
British Columbia|YYJ|Victoria
British Columbia|YXX|Abbotsford / Fraser Valley
British Columbia|YLW|Kelowna
British Columbia|YXS|Prince George
British Columbia|YPR|Prince Rupert
British Columbia|YXT|Terrace
British Columbia|YQQ|Comox / Courtenay
British Columbia|YCD|Nanaimo
British Columbia|YYD|Smithers
British Columbia|YDQ|Dawson Creek
British Columbia|YXJ|Fort St. John
British Columbia|YYF|Penticton
British Columbia|YCG|Castlegar
British Columbia|YKA|Kamloops
British Columbia|YXC|Cranbrook
Alberta|YYC|Calgary
Alberta|YEG|Edmonton
Alberta|YMM|Fort McMurray
Alberta|YQU|Grande Prairie
Alberta|YQL|Lethbridge
Alberta|YXH|Medicine Hat
Saskatchewan|YQR|Regina
Saskatchewan|YXE|Saskatoon
Saskatchewan|YPA|Prince Albert
Manitoba|YWG|Winnipeg
Manitoba|YBR|Brandon
Manitoba|YTH|Thompson
Manitoba|YDN|Dauphin
Manitoba|YPG|Portage la Prairie
New Brunswick|YFC|Fredericton
New Brunswick|YSJ|Saint John
New Brunswick|YQM|Moncton
New Brunswick|ZBF|Bathurst
Nova Scotia|YHZ|Halifax
Nova Scotia|YQY|Sydney
Nova Scotia|YQI|Yarmouth
Prince Edward Island|YYG|Charlottetown
Newfoundland and Labrador|YYT|St. John's
Newfoundland and Labrador|YQX|Gander
Newfoundland and Labrador|YDF|Deer Lake
Newfoundland and Labrador|YYR|Goose Bay
Newfoundland and Labrador|YWK|Wabush
Territories|YXY|Whitehorse (Yukon)
Territories|YZF|Yellowknife (NWT)
Territories|YFB|Iqaluit (Nunavut)
Territories|YEV|Inuvik (NWT)
Territories|YHY|Hay River (NWT)
"@ -split "`n" | ForEach-Object {
    $parts = $_.Trim() -split "\|"
    if ($parts.Count -eq 3) {
        [PSCustomObject]@{
            Province = $parts[0]
            Code = $parts[1]
            Label = $parts[2]
        }
    }
}

function Show-IataChoices {
    $last = ""
    $index = 0
    foreach ($item in $IataChoices) {
        if ($item.Province -ne $last) {
            Write-Host ""
            Write-Host $item.Province
            $last = $item.Province
        }
        $index += 1
        Write-Host ("  {0,2}) {1}  {2}" -f $index, $item.Code, $item.Label)
    }
}

function Get-IataByNumber {
    param([int]$Number)
    if ($Number -lt 1 -or $Number -gt $IataChoices.Count) {
        return ""
    }
    return $IataChoices[$Number - 1].Code
}

function Get-IataLabel {
    param([string]$Code)
    $match = $IataChoices | Where-Object { $_.Code -eq $Code } | Select-Object -First 1
    if ($null -eq $match) {
        return ""
    }
    return $match.Label
}

function Resolve-Iata {
    param([string]$Value)
    $prompted = [string]::IsNullOrWhiteSpace($Value)
    while ($true) {
        if ([string]::IsNullOrWhiteSpace($Value)) {
            Write-Info "Choose the real IATA airport code nearest to the observer."
            Write-Info "Type a number from the quick list, or type any real 3-letter IATA code."
            Write-Info "Do not use CAN as shorthand for Canada; CAN is an airport code in Guangzhou."
            Show-IataChoices
            $Value = Read-Host "IATA code or list number"
            $prompted = $true
        }

        $candidate = $Value.Trim().ToUpperInvariant()
        if ($candidate -match '^[0-9]+$') {
            $candidate = Get-IataByNumber -Number ([int]$candidate)
            if ([string]::IsNullOrWhiteSpace($candidate)) {
                Write-Warning "No IATA quick-list item number: $Value"
                $Value = ""
                continue
            }
        }

        if ($candidate -in @("XXX", "HOME", "CAN")) {
            Write-Warning "$candidate is not a valid MeshCore.ca region choice. Use the real IATA airport code nearest to you."
            $Value = ""
            continue
        }
        if ($candidate -notmatch '^[A-Z]{3}$') {
            Write-Warning "IATA code must be exactly 3 letters."
            $Value = ""
            continue
        }

        $label = Get-IataLabel -Code $candidate
        if (-not [string]::IsNullOrWhiteSpace($label)) {
            Write-Info "Region selected: $candidate ($label)"
            return $candidate
        }

        Write-Warning "$candidate is not in the MeshCore.ca Canadian quick list."
        Write-Warning "Continue only if $candidate is a real IATA airport code."
        if (-not $prompted -or (Prompt-YesNo "Use $candidate anyway?" $false)) {
            return $candidate
        }
        $Value = ""
    }
}

function Normalize-Board {
    param([string]$Value)
    switch ($Value.Trim().ToLowerInvariant()) {
        "1" { return "heltec-v3" }
        "v3" { return "heltec-v3" }
        "heltec-v3" { return "heltec-v3" }
        "heltecv3" { return "heltec-v3" }
        "2" { return "heltec-v4-oled" }
        "v4" { return "heltec-v4-oled" }
        "heltec-v4" { return "heltec-v4-oled" }
        "heltec-v4-oled" { return "heltec-v4-oled" }
        "heltecv4" { return "heltec-v4-oled" }
        "heltecv4oled" { return "heltec-v4-oled" }
        default { return "" }
    }
}

function Resolve-Board {
    param([string]$Value)
    while ($true) {
        if ([string]::IsNullOrWhiteSpace($Value)) {
            Write-Host ""
            Write-Host "Board:"
            Write-Host "  1) Heltec V3"
            Write-Host "  2) Heltec V4 OLED"
            $Value = Read-Host "Board [1]"
            if ([string]::IsNullOrWhiteSpace($Value)) {
                $Value = "1"
            }
        }
        $normalized = Normalize-Board -Value $Value
        if (-not [string]::IsNullOrWhiteSpace($normalized)) {
            return $normalized
        }
        Write-Warning "Board must be Heltec V3 or Heltec V4 OLED."
        $Value = ""
    }
}

function Normalize-Role {
    param([string]$Value)
    switch ($Value.Trim().ToLowerInvariant()) {
        "1" { return "repeater" }
        "repeater" { return "repeater" }
        "repeat" { return "repeater" }
        "2" { return "room-server" }
        "room" { return "room-server" }
        "room-server" { return "room-server" }
        "room_server" { return "room-server" }
        "roomserver" { return "room-server" }
        default { return "" }
    }
}

function Resolve-Role {
    param([string]$Value)
    while ($true) {
        if ([string]::IsNullOrWhiteSpace($Value)) {
            Write-Host ""
            Write-Host "Role:"
            Write-Host "  1) Repeater"
            Write-Host "  2) Room Server"
            $Value = Read-Host "Role [1]"
            if ([string]::IsNullOrWhiteSpace($Value)) {
                $Value = "1"
            }
        }
        $normalized = Normalize-Role -Value $Value
        if (-not [string]::IsNullOrWhiteSpace($normalized)) {
            return $normalized
        }
        Write-Warning "Role must be repeater or room-server."
        $Value = ""
    }
}

function Get-RoleLabelForName {
    param([string]$Role)
    if ($Role -eq "room-server") {
        return "Room-Server"
    }
    return "Repeater"
}

function Resolve-RequiredText {
    param(
        [string]$Value,
        [string]$Prompt,
        [switch]$Secret
    )
    while ([string]::IsNullOrWhiteSpace($Value)) {
        if ($Secret.IsPresent) {
            $Value = Read-SecretPlainText -Prompt $Prompt
        }
        else {
            $Value = Read-Host $Prompt
        }
    }
    if ($Value -match "[`r`n]") {
        throw "$Prompt cannot contain newlines."
    }
    return $Value
}

function Resolve-NodeName {
    param(
        [string]$Value,
        [string]$Iata,
        [string]$Role
    )
    $defaultName = "$Iata-$(Get-RoleLabelForName -Role $Role)-01"
    if ([string]::IsNullOrWhiteSpace($Value)) {
        $answer = Read-Host "MeshCore node name [$defaultName]"
        if ([string]::IsNullOrWhiteSpace($answer)) {
            $Value = $defaultName
        }
        else {
            $Value = $answer
        }
    }
    if ($Value -match "[`r`n]") {
        throw "Node name cannot contain newlines."
    }
    return $Value
}

function Resolve-RestoreBrokers {
    if ($RestoreBrokers.IsPresent -and $NoRestoreBrokers.IsPresent) {
        throw "Use only one of -RestoreBrokers or -NoRestoreBrokers."
    }
    if ($RestoreBrokers.IsPresent) {
        return $true
    }
    if ($NoRestoreBrokers.IsPresent) {
        return $false
    }
    return (Prompt-YesNo "Restore MeshCore.ca broker slots? This sets slots 1-2 and disables slots 3-6." $true)
}

function Resolve-RepeatMode {
    if ($Repeat.IsPresent -and $ObserveOnly.IsPresent) {
        throw "Use only one of -Repeat or -ObserveOnly."
    }
    if ($Repeat.IsPresent) {
        return "on"
    }
    if ($ObserveOnly.IsPresent) {
        return "off"
    }
    if (Prompt-YesNo "Should this device repeat packets for the local mesh?" $true) {
        return "on"
    }
    return "off"
}

function Get-SerialPorts {
    try {
        return [System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object
    }
    catch {
        return @()
    }
}

function Resolve-Port {
    param([string]$Value)
    if ($script:UsePrintOnly) {
        return ""
    }
    if (-not [string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    $ports = @(Get-SerialPorts)
    if ($ports.Count -eq 0) {
        Write-Info "No COM port was auto-detected."
        if (Prompt-YesNo "Print commands instead of sending over serial?" $true) {
            $script:UsePrintOnly = $true
            return ""
        }
        return (Read-Host "COM port, e.g. COM3")
    }

    Write-Info "Detected serial ports:"
    for ($i = 0; $i -lt $ports.Count; $i++) {
        Write-Host ("  {0}) {1}" -f ($i + 1), $ports[$i])
    }
    $choice = Read-Host "COM port number, name, or 'print'"
    if ([string]::IsNullOrWhiteSpace($choice) -and $ports.Count -eq 1) {
        return $ports[0]
    }
    if ($choice.Trim().ToLowerInvariant() -eq "print") {
        $script:UsePrintOnly = $true
        return ""
    }
    if ($choice -match '^[0-9]+$') {
        $index = [int]$choice
        if ($index -ge 1 -and $index -le $ports.Count) {
            return $ports[$index - 1]
        }
        throw "No COM port item number: $choice"
    }
    return $choice
}

function New-SetupCommands {
    param(
        [string]$NodeName,
        [string]$Iata,
        [string]$WifiSsid,
        [string]$WifiPassword,
        [bool]$SetRadio,
        [bool]$RestoreBrokerSlots,
        [string]$RepeatMode
    )
    $commands = New-Object System.Collections.Generic.List[string]
    $commands.Add("set name $NodeName")
    if ($SetRadio) {
        $commands.Add("set radio 910.525,62.5,7,5")
    }
    $commands.Add("set path.hash.mode 2")
    $commands.Add("set mqtt.iata $Iata")
    $commands.Add("set wifi.ssid $WifiSsid")
    $commands.Add("set wifi.pwd $WifiPassword")
    $commands.Add("set wifi.powersave none")
    $commands.Add("set mqtt.status on")
    $commands.Add("set mqtt.packets on")
    $commands.Add("set bridge.enabled on")
    $commands.Add("set mqtt.rx on")
    $commands.Add("set mqtt.tx advert")

    if ($RestoreBrokerSlots) {
        $commands.Add("set mqtt1.preset none")
        $commands.Add("set mqtt2.preset none")
        $commands.Add("set mqtt3.preset none")
        $commands.Add("set mqtt4.preset none")
        $commands.Add("set mqtt5.preset none")
        $commands.Add("set mqtt6.preset none")
        $commands.Add("set mqtt1.preset custom")
        $commands.Add("set mqtt1.server wss://$Broker1Host`:443")
        $commands.Add("set mqtt1.port 443")
        $commands.Add("set mqtt1.audience $Broker1Host")
        $commands.Add("set mqtt2.preset custom")
        $commands.Add("set mqtt2.server wss://$Broker2Host`:443")
        $commands.Add("set mqtt2.port 443")
        $commands.Add("set mqtt2.audience $Broker2Host")
    }

    if ($RepeatMode -eq "off") {
        $commands.Add("set repeat off")
    }
    $commands.Add("reboot")
    return $commands.ToArray()
}

function Write-CommandBlock {
    param(
        [string[]]$Commands,
        [switch]$MaskPassword
    )
    Write-Host '```text'
    foreach ($command in $Commands) {
        if ($MaskPassword.IsPresent -and $command.StartsWith("set wifi.pwd ")) {
            Write-Host "set wifi.pwd ********"
        }
        else {
            Write-Host $command
        }
    }
    Write-Host '```'
}

function Send-Commands {
    param(
        [string]$Port,
        [int]$Baud,
        [string[]]$Commands,
        [double]$DelaySeconds
    )
    $serial = New-Object System.IO.Ports.SerialPort $Port, $Baud, "None", 8, "One"
    $serial.NewLine = "`r`n"
    $serial.WriteTimeout = 5000
    try {
        $serial.Open()
        foreach ($command in $Commands) {
            if ($command.StartsWith("set wifi.pwd ")) {
                Write-Info "Sending: set wifi.pwd ********"
            }
            else {
                Write-Info "Sending: $command"
            }
            $serial.WriteLine($command)
            Start-Sleep -Milliseconds ([int]($DelaySeconds * 1000))
        }
    }
    finally {
        if ($serial.IsOpen) {
            $serial.Close()
        }
    }
}

if ($ListIata.IsPresent) {
    Show-IataChoices
    exit 0
}

$Board = Resolve-Board -Value $Board
$Role = Resolve-Role -Value $Role
$Iata = Resolve-Iata -Value $Iata
$Name = Resolve-NodeName -Value $Name -Iata $Iata -Role $Role
$WifiSsid = Resolve-RequiredText -Value $WifiSsid -Prompt "2.4 GHz WiFi SSID"
$WifiPassword = Resolve-RequiredText -Value $WifiPassword -Prompt "2.4 GHz WiFi password" -Secret
$restoreBrokerSlots = Resolve-RestoreBrokers
$repeatModeValue = Resolve-RepeatMode
$Port = Resolve-Port -Value $Port

$commands = New-SetupCommands `
    -NodeName $Name `
    -Iata $Iata `
    -WifiSsid $WifiSsid `
    -WifiPassword $WifiPassword `
    -SetRadio (-not $NoSetRadio.IsPresent) `
    -RestoreBrokerSlots $restoreBrokerSlots `
    -RepeatMode $repeatModeValue

Write-Host ""
Write-Info "Setup summary:"
Write-Info "Board: $Board"
Write-Info "Role: $Role"
Write-Info "Name: $Name"
Write-Info "IATA: $Iata"
Write-Info "WiFi SSID: $WifiSsid"
Write-Info "Restore brokers: $restoreBrokerSlots"
Write-Info "Repeat packets: $repeatModeValue"

if ($script:UsePrintOnly) {
    Write-Info "Mode: print commands only"
    Write-Host ""
    Write-Host "Copy/paste these commands into the MeshCore admin CLI:"
    Write-Host ""
    Write-CommandBlock -Commands $commands
}
else {
    Write-Info "COM port: $Port"
    Write-Host ""
    Write-Host "Commands to be sent:"
    Write-Host ""
    Write-CommandBlock -Commands $commands -MaskPassword
    Write-Host ""
    if (Prompt-YesNo "Send these commands to $Port now?" $true) {
        Send-Commands -Port $Port -Baud $Baud -Commands $commands -DelaySeconds $DelaySeconds
        Write-Info "Commands sent. The device should reboot."
    }
    else {
        Write-Info "Canceled before sending. Re-run with -PrintOnly to copy commands manually."
        exit 1
    }
}

Write-Info "Done. After reboot, check https://live.meshcore.ca/#/observers for $Name."
