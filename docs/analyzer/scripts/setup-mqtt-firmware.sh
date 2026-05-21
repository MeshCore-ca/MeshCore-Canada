#!/usr/bin/env bash
set -euo pipefail

BOARD="${MESHCORE_CA_BOARD:-}"
ROLE="${MESHCORE_CA_ROLE:-}"
IATA="${MESHCORE_CA_IATA:-}"
NODE_NAME="${MESHCORE_CA_NODE_NAME:-}"
WIFI_SSID="${MESHCORE_CA_WIFI_SSID:-}"
WIFI_PASSWORD="${MESHCORE_CA_WIFI_PASSWORD:-}"
SERIAL_PORT="${MESHCORE_CA_SERIAL_PORT:-}"
BAUD="${MESHCORE_CA_BAUD:-115200}"
COMMAND_DELAY="${MESHCORE_CA_COMMAND_DELAY:-0.25}"
PRINT_ONLY=0
RESTORE_BROKERS="${MESHCORE_CA_RESTORE_BROKERS:-ask}"
SET_RADIO="${MESHCORE_CA_SET_RADIO:-1}"
REPEAT_MODE="${MESHCORE_CA_REPEAT:-ask}"

BROKER1_HOST="${MESHCORE_CA_MQTT1_HOST:-mqtt1.meshcore.ca}"
BROKER2_HOST="${MESHCORE_CA_MQTT2_HOST:-mqtt2.meshcore.ca}"

usage() {
  cat <<EOF
Guided setup for MeshCore.ca direct MQTT firmware on Heltec V3/V4 boards.

Usage:
  bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/setup-mqtt-firmware.sh)
  bash setup-mqtt-firmware.sh --port /dev/ttyUSB0
  bash setup-mqtt-firmware.sh --print-only --iata YOW --wifi-ssid MyWiFi

Options:
  --board VALUE          heltec-v3 | heltec-v4-oled
  --role VALUE           repeater | room-server
  --iata CODE            Real 3-letter IATA airport code.
  --name NAME            MeshCore node name, e.g. YOW-Repeater-01.
  --wifi-ssid SSID       2.4 GHz WiFi SSID.
  --wifi-password PASS   2.4 GHz WiFi password.
  --port PATH            Serial port, e.g. /dev/ttyUSB0 or /dev/cu.usbmodem101.
  --baud RATE            Serial baud rate. Default: 115200.
  --print-only           Print CLI commands instead of sending over serial.
  --restore-brokers      Overwrite broker slots 1 and 2 with MeshCore.ca brokers.
  --no-restore-brokers   Leave broker slots as flashed.
  --set-radio            Send the MeshCore Canada radio values. Default.
  --no-set-radio         Do not send set radio.
  --repeat               Leave packet repeating enabled.
  --observe-only         Send set repeat off.
  --list-iata            Show common Canadian IATA choices and exit.
  --help                 Show this help.

Environment variables with matching names are also supported:
  MESHCORE_CA_BOARD, MESHCORE_CA_ROLE, MESHCORE_CA_IATA,
  MESHCORE_CA_NODE_NAME, MESHCORE_CA_WIFI_SSID,
  MESHCORE_CA_WIFI_PASSWORD, MESHCORE_CA_SERIAL_PORT.
EOF
}

say() {
  printf '[MeshCore.ca] %s\n' "$*"
}

die() {
  echo "Error: $*" >&2
  exit 1
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

need_tty() {
  [ -t 0 ] || die "Missing required values and no interactive terminal is available. Re-run with --help for non-interactive flags."
}

prompt_text() {
  local prompt="$1"
  local default="${2:-}"
  local value=""
  need_tty
  if [ -n "$default" ]; then
    printf '%s [%s]: ' "$prompt" "$default"
  else
    printf '%s: ' "$prompt"
  fi
  read -r value
  printf '%s\n' "${value:-$default}"
}

prompt_secret() {
  local prompt="$1"
  local value=""
  need_tty
  printf '%s: ' "$prompt"
  stty -echo 2>/dev/null || true
  read -r value
  stty echo 2>/dev/null || true
  printf '\n'
  printf '%s\n' "$value"
}

prompt_yes_no() {
  local prompt="$1"
  local default="${2:-y}"
  local answer=""
  need_tty
  if [ "$default" = "y" ]; then
    printf '%s [Y/n] ' "$prompt"
  else
    printf '%s [y/N] ' "$prompt"
  fi
  read -r answer
  answer="$(printf '%s' "${answer:-$default}" | tr '[:upper:]' '[:lower:]')"
  case "$answer" in
    y|yes) return 0 ;;
    *) return 1 ;;
  esac
}

upper_iata() {
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

IATA_CHOICES="$(cat <<'EOF'
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
EOF
)"

print_iata_choices() {
  local last="" n=0
  printf '%s\n' "$IATA_CHOICES" | while IFS='|' read -r province code label; do
    [ -n "$province" ] || continue
    if [ "$province" != "$last" ]; then
      printf '\n%s\n' "$province"
      last="$province"
    fi
    n=$((n + 1))
    printf '  %2d) %s  %s\n' "$n" "$code" "$label"
  done
}

iata_by_number() {
  printf '%s\n' "$IATA_CHOICES" | awk -F'|' -v wanted="$1" '
    NF == 3 {
      n++
      if (n == wanted) {
        print $2
        found = 1
        exit
      }
    }
    END { if (!found) exit 1 }
  '
}

known_iata_label() {
  printf '%s\n' "$IATA_CHOICES" | awk -F'|' -v code="$1" '
    toupper($2) == code {
      print $3
      found = 1
      exit
    }
    END { if (!found) exit 1 }
  '
}

prompt_iata() {
  local choice selected
  say "Choose the real IATA airport code nearest to the observer."
  say "Type a number from the quick list, or type any real 3-letter IATA code."
  say "Do not use CAN as shorthand for Canada; CAN is an airport code in Guangzhou."
  print_iata_choices
  while :; do
    printf '\nIATA code or list number: '
    read -r choice
    choice="$(printf '%s' "$choice" | tr '[:lower:]' '[:upper:]' | tr -d '[:space:]')"
    [ -n "$choice" ] || continue
    if printf '%s' "$choice" | grep -Eq '^[0-9]+$'; then
      selected="$(iata_by_number "$choice" || true)"
      if [ -n "$selected" ]; then
        IATA="$selected"
        return 0
      fi
      echo "No IATA quick-list item number: $choice" >&2
      continue
    fi
    IATA="$choice"
    return 0
  done
}

require_iata() {
  local label
  while :; do
    if [ -z "$IATA" ]; then
      need_tty
      prompt_iata
    fi
    IATA="$(upper_iata "$IATA" | tr -d '[:space:]')"
    case "$IATA" in
      XXX|HOME|CAN)
        echo "$IATA is not a valid MeshCore.ca region choice. Use the real IATA airport code nearest to you." >&2
        IATA=""
        continue
        ;;
    esac
    if ! printf '%s' "$IATA" | grep -Eq '^[A-Z]{3}$'; then
      echo "IATA code must be exactly 3 letters, got: $IATA" >&2
      IATA=""
      continue
    fi
    if label="$(known_iata_label "$IATA" 2>/dev/null)"; then
      say "Region selected: $IATA ($label)"
      return 0
    fi
    say "$IATA is not in the MeshCore.ca quick list."
    say "Continue only if $IATA is a real IATA airport code."
    if [ ! -t 0 ]; then
      return 0
    fi
    if prompt_yes_no "Use $IATA anyway?" "n"; then
      return 0
    fi
    IATA=""
  done
}

normalize_board() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|v3|heltec-v3|heltecv3)
      printf 'heltec-v3'
      ;;
    2|v4|heltec-v4|heltec-v4-oled|heltecv4|heltecv4oled)
      printf 'heltec-v4-oled'
      ;;
    *)
      return 1
      ;;
  esac
}

normalize_role() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|repeater|repeat)
      printf 'repeater'
      ;;
    2|room|room-server|room_server|roomserver)
      printf 'room-server'
      ;;
    *)
      return 1
      ;;
  esac
}

choose_board() {
  local choice normalized
  while :; do
    if [ -n "$BOARD" ]; then
      normalized="$(normalize_board "$BOARD" || true)"
      [ -n "$normalized" ] || die "--board must be heltec-v3 or heltec-v4-oled"
      BOARD="$normalized"
      return 0
    fi
    need_tty
    printf '\nBoard:\n'
    printf '  1) Heltec V3\n'
    printf '  2) Heltec V4 OLED\n'
    printf 'Board [1]: '
    read -r choice
    BOARD="${choice:-1}"
  done
}

choose_role() {
  local choice normalized
  while :; do
    if [ -n "$ROLE" ]; then
      normalized="$(normalize_role "$ROLE" || true)"
      [ -n "$normalized" ] || die "--role must be repeater or room-server"
      ROLE="$normalized"
      return 0
    fi
    need_tty
    printf '\nRole:\n'
    printf '  1) Repeater\n'
    printf '  2) Room Server\n'
    printf 'Role [1]: '
    read -r choice
    ROLE="${choice:-1}"
  done
}

role_label_for_name() {
  if [ "$ROLE" = "room-server" ]; then
    printf 'Room-Server'
  else
    printf 'Repeater'
  fi
}

require_clean_value() {
  local name="$1"
  local value="$2"
  if printf '%s' "$value" | grep -q '[[:cntrl:]]'; then
    die "$name cannot contain control characters."
  fi
}

require_wifi() {
  while [ -z "$WIFI_SSID" ]; do
    WIFI_SSID="$(prompt_text "2.4 GHz WiFi SSID")"
  done
  require_clean_value "WiFi SSID" "$WIFI_SSID"

  while [ -z "$WIFI_PASSWORD" ]; do
    WIFI_PASSWORD="$(prompt_secret "2.4 GHz WiFi password")"
  done
  require_clean_value "WiFi password" "$WIFI_PASSWORD"
}

choose_name() {
  local default_name
  default_name="${IATA}-$(role_label_for_name)-01"
  if [ -z "$NODE_NAME" ]; then
    NODE_NAME="$(prompt_text "MeshCore node name" "$default_name")"
  fi
  [ -n "$NODE_NAME" ] || die "Node name is required."
  require_clean_value "Node name" "$NODE_NAME"
}

resolve_bool() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|y|on) return 0 ;;
    0|false|no|n|off) return 1 ;;
    *) return 2 ;;
  esac
}

choose_restore_brokers() {
  if [ "$RESTORE_BROKERS" = "ask" ]; then
    if prompt_yes_no "Restore MeshCore.ca broker slots? This sets slots 1-2 and disables slots 3-6." "y"; then
      RESTORE_BROKERS=1
    else
      RESTORE_BROKERS=0
    fi
  fi
  if resolve_bool "$RESTORE_BROKERS"; then
    RESTORE_BROKERS=1
  elif [ "$?" -eq 1 ]; then
    RESTORE_BROKERS=0
  else
    die "MESHCORE_CA_RESTORE_BROKERS must be true/false, yes/no, on/off, or ask."
  fi
}

choose_repeat_mode() {
  if [ "$REPEAT_MODE" = "ask" ]; then
    if prompt_yes_no "Should this device repeat packets for the local mesh?" "y"; then
      REPEAT_MODE=on
    else
      REPEAT_MODE=off
    fi
  fi
  case "$(printf '%s' "$REPEAT_MODE" | tr '[:upper:]' '[:lower:]')" in
    on|repeat|repeater|1|true|yes|y) REPEAT_MODE=on ;;
    off|observe-only|observer|0|false|no|n) REPEAT_MODE=off ;;
    *) die "Repeat mode must be on or off." ;;
  esac
}

list_serial_ports() {
  local port found=0
  for port in /dev/ttyUSB* /dev/ttyACM* /dev/cu.usbserial* /dev/cu.usbmodem* /dev/cu.SLAB_USBtoUART* /dev/cu.wchusbserial*; do
    [ -e "$port" ] || continue
    printf '%s\n' "$port"
    found=1
  done
  [ "$found" -eq 1 ]
}

choose_serial_port() {
  local ports count choice selected
  if [ "$PRINT_ONLY" -eq 1 ]; then
    return 0
  fi
  if [ -n "$SERIAL_PORT" ]; then
    [ -e "$SERIAL_PORT" ] || die "Serial port not found: $SERIAL_PORT"
    return 0
  fi
  ports="$(list_serial_ports || true)"
  if [ -z "$ports" ]; then
    say "No USB serial port was auto-detected."
    say "Use --print-only to copy commands into the web/admin CLI, or rerun with --port PATH."
    if prompt_yes_no "Print commands instead of sending over serial?" "y"; then
      PRINT_ONLY=1
      return 0
    fi
    SERIAL_PORT="$(prompt_text "Serial port path")"
    [ -e "$SERIAL_PORT" ] || die "Serial port not found: $SERIAL_PORT"
    return 0
  fi

  count="$(printf '%s\n' "$ports" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [ "$count" = "1" ]; then
    selected="$(printf '%s\n' "$ports" | sed -n '1p')"
    if prompt_yes_no "Use detected serial port $selected?" "y"; then
      SERIAL_PORT="$selected"
      return 0
    fi
  else
    say "Detected serial ports:"
    printf '%s\n' "$ports" | awk '{ n++; printf "  %d) %s\n", n, $0 }'
  fi

  while :; do
    choice="$(prompt_text "Serial port number, path, or 'print'")"
    case "$(printf '%s' "$choice" | tr '[:upper:]' '[:lower:]')" in
      print|p)
        PRINT_ONLY=1
        return 0
        ;;
    esac
    if printf '%s' "$choice" | grep -Eq '^[0-9]+$'; then
      selected="$(printf '%s\n' "$ports" | sed -n "${choice}p")"
      if [ -n "$selected" ]; then
        SERIAL_PORT="$selected"
        return 0
      fi
      echo "No serial port item number: $choice" >&2
      continue
    fi
    SERIAL_PORT="$choice"
    [ -e "$SERIAL_PORT" ] || die "Serial port not found: $SERIAL_PORT"
    return 0
  done
}

COMMANDS=()

add_command() {
  COMMANDS+=("$1")
}

build_commands() {
  COMMANDS=()
  add_command "set name $NODE_NAME"
  if resolve_bool "$SET_RADIO"; then
    add_command "set radio 910.525,62.5,7,5"
  elif [ "$?" -eq 2 ]; then
    die "MESHCORE_CA_SET_RADIO must be true/false, yes/no, or on/off."
  fi
  add_command "set path.hash.mode 2"
  add_command "set mqtt.iata $IATA"
  add_command "set wifi.ssid $WIFI_SSID"
  add_command "set wifi.pwd $WIFI_PASSWORD"
  add_command "set wifi.powersave none"
  add_command "set mqtt.status on"
  add_command "set mqtt.packets on"
  add_command "set bridge.enabled on"
  add_command "set mqtt.rx on"
  add_command "set mqtt.tx advert"

  if [ "$RESTORE_BROKERS" -eq 1 ]; then
    add_command "set mqtt1.preset none"
    add_command "set mqtt2.preset none"
    add_command "set mqtt3.preset none"
    add_command "set mqtt4.preset none"
    add_command "set mqtt5.preset none"
    add_command "set mqtt6.preset none"
    add_command "set mqtt1.preset custom"
    add_command "set mqtt1.server wss://$BROKER1_HOST:443"
    add_command "set mqtt1.port 443"
    add_command "set mqtt1.audience $BROKER1_HOST"
    add_command "set mqtt2.preset custom"
    add_command "set mqtt2.server wss://$BROKER2_HOST:443"
    add_command "set mqtt2.port 443"
    add_command "set mqtt2.audience $BROKER2_HOST"
  fi

  if [ "$REPEAT_MODE" = "off" ]; then
    add_command "set repeat off"
  fi
  add_command "reboot"
}

print_commands() {
  local mask_password="${1:-0}"
  local cmd
  printf '```text\n'
  for cmd in "${COMMANDS[@]}"; do
    if [ "$mask_password" -eq 1 ] && printf '%s' "$cmd" | grep -q '^set wifi.pwd '; then
      printf 'set wifi.pwd ********\n'
    else
      printf '%s\n' "$cmd"
    fi
  done
  printf '```\n'
}

configure_serial() {
  if stty -F "$SERIAL_PORT" "$BAUD" raw -echo -echoe -echok -echoctl -echoke 2>/dev/null; then
    return 0
  fi
  if stty -f "$SERIAL_PORT" "$BAUD" raw -echo -echoe -echok 2>/dev/null; then
    return 0
  fi
  die "Could not configure serial port $SERIAL_PORT at $BAUD baud."
}

send_commands() {
  local cmd
  configure_serial
  say "Sending setup commands to $SERIAL_PORT at $BAUD baud."
  exec 3>"$SERIAL_PORT"
  for cmd in "${COMMANDS[@]}"; do
    if printf '%s' "$cmd" | grep -q '^set wifi.pwd '; then
      say "Sending: set wifi.pwd ********"
    else
      say "Sending: $cmd"
    fi
    printf '%s\r\n' "$cmd" >&3
    sleep "$COMMAND_DELAY"
  done
  exec 3>&-
  say "Commands sent. The device should reboot."
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --board) BOARD="${2:?Missing value for --board}"; shift 2 ;;
    --role) ROLE="${2:?Missing value for --role}"; shift 2 ;;
    --iata) IATA="${2:?Missing value for --iata}"; shift 2 ;;
    --name) NODE_NAME="${2:?Missing value for --name}"; shift 2 ;;
    --wifi-ssid) WIFI_SSID="${2:?Missing value for --wifi-ssid}"; shift 2 ;;
    --wifi-password) WIFI_PASSWORD="${2:?Missing value for --wifi-password}"; shift 2 ;;
    --port) SERIAL_PORT="${2:?Missing value for --port}"; shift 2 ;;
    --baud) BAUD="${2:?Missing value for --baud}"; shift 2 ;;
    --delay) COMMAND_DELAY="${2:?Missing value for --delay}"; shift 2 ;;
    --print-only) PRINT_ONLY=1; shift ;;
    --restore-brokers) RESTORE_BROKERS=1; shift ;;
    --no-restore-brokers) RESTORE_BROKERS=0; shift ;;
    --set-radio) SET_RADIO=1; shift ;;
    --no-set-radio) SET_RADIO=0; shift ;;
    --repeat) REPEAT_MODE=on; shift ;;
    --observe-only) REPEAT_MODE=off; shift ;;
    --list-iata|--iata-list) print_iata_choices; exit 0 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

choose_board
choose_role
require_iata
choose_name
require_wifi
choose_restore_brokers
choose_repeat_mode
choose_serial_port
build_commands

printf '\n'
say "Setup summary:"
say "Board: $BOARD"
say "Role: $ROLE"
say "Name: $NODE_NAME"
say "IATA: $IATA"
say "WiFi SSID: $WIFI_SSID"
say "Restore brokers: $RESTORE_BROKERS"
say "Repeat packets: $REPEAT_MODE"
if [ "$PRINT_ONLY" -eq 1 ]; then
  say "Mode: print commands only"
  printf '\nCopy/paste these commands into the MeshCore admin CLI:\n\n'
  print_commands 0
else
  say "Serial port: $SERIAL_PORT"
  printf '\nCommands to be sent:\n\n'
  print_commands 1
  printf '\n'
  if prompt_yes_no "Send these commands to $SERIAL_PORT now?" "y"; then
    send_commands
  else
    say "Canceled before sending. Re-run with --print-only to copy commands manually."
    exit 1
  fi
fi

say "Done. After reboot, check https://live.meshcore.ca/#/observers for $NODE_NAME."
