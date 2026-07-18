#!/usr/bin/env bash
set -euo pipefail

BROKER1_HOST="${MESHCORE_CA_MQTT1_HOST:-mqtt1.meshcore.ca}"
BROKER2_HOST="${MESHCORE_CA_MQTT2_HOST:-mqtt2.meshcore.ca}"
BROKER_PORT="${MESHCORE_CA_MQTT_PORT:-443}"
IATA="${MESHCORE_CA_IATA:-}"
MODE="${MESHCORE_CA_MODE:-auto}"
DEVICE_TYPE="${MESHCORE_CA_DEVICE:-}"
RESTART_SERVICE=1
INSTALL_MCTOMQTT=0
INSTALL_PACKETCAPTURE=0

MCTOMQTT_CONFIG_DIR="${MCTOMQTT_CONFIG_DIR:-/etc/mctomqtt}"
MCTOMQTT_DROPIN="${MCTOMQTT_DROPIN:-}"
MCTOMQTT_SERVICE="${MCTOMQTT_SERVICE:-mctomqtt}"
MCTOMQTT_INSTALL_URL="${MCTOMQTT_INSTALL_URL:-https://raw.githubusercontent.com/Cisien/meshcoretomqtt/main/install.sh}"

PACKETCAPTURE_DIR="${PACKETCAPTURE_DIR:-$HOME/.meshcore-packet-capture}"
PACKETCAPTURE_ENV_FILE="${PACKETCAPTURE_ENV_FILE:-}"
PACKETCAPTURE_SERVICE="${PACKETCAPTURE_SERVICE:-meshcore-capture}"
PACKETCAPTURE_INSTALL_URL="${PACKETCAPTURE_INSTALL_URL:-https://raw.githubusercontent.com/agessaman/meshcore-packet-capture/main/install.sh}"

usage() {
  cat <<EOF
Add the MeshCore.ca MQTT broker pair to a host-side MeshCore observer install.

Supported installs:
  - USB serial MeshCore node via Cisien/meshcoretomqtt
  - Companion radio via meshcore-packet-capture (.env.local)

Usage:
  MESHCORE_CA_IATA=YOW bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh)
  bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --iata YOW --device serial-host

Options:
  --iata CODE             Real 3-letter IATA airport code.
  --list-iata             Show common Canadian IATA choices and exit.
  --device TYPE           serial-host | companion
  --mode auto|mctomqtt|env
  --install-mctomqtt      Install Cisien/meshcoretomqtt first if /etc/mctomqtt is missing.
  --install-packetcapture Install meshcore-packet-capture first if the companion install is missing.
  --no-restart            Patch config only.
  --config-dir PATH       Default: /etc/mctomqtt
  --dropin PATH           Default: config.d/20-meshcore-ca.toml
  --service NAME          Default: mctomqtt
  --dir PATH              Default: \$HOME/.meshcore-packet-capture
  --env-file PATH         Explicit .env.local path.
  --packet-service NAME   Default: meshcore-capture
EOF
}

say() {
  printf '[MeshCore.ca] %s\n' "$*"
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

prompt_yes_no() {
  local prompt="$1"
  local default="${2:-y}"
  local answer=""
  [ -t 0 ] || return 1
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

backup_path() {
  local original="$1"
  local stamp candidate n
  stamp="$(date +%Y%m%d%H%M%S)"
  candidate="${original}.bak.${stamp}"
  n=1
  while [ -e "$candidate" ]; do
    candidate="${original}.bak.${stamp}.${n}"
    n=$((n + 1))
  done
  printf '%s\n' "$candidate"
}

normalize_device_type() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|serial|serial-host|serial_host|usb|usb-host|server|repeater|roomserver|room-server|mctomqtt)
      printf 'serial-host'
      ;;
    2|companion|packetcapture|packet-capture|meshcore-packet-capture|env)
      printf 'companion'
      ;;
    *)
      return 1
      ;;
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
Quebec|YUL|Montreal (Trudeau)
Quebec|YMX|Montreal (Mirabel)
Quebec|YQB|Quebec City
Quebec|YND|Gatineau (Ottawa area)
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
British Columbia|YBC|Baie-Comeau
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
    if [ -z "$IATA" ] && [ -t 0 ]; then
      prompt_iata
    fi
    if [ -z "$IATA" ]; then
      cat >&2 <<EOF
Missing IATA airport code.

Run with:
  MESHCORE_CA_IATA=YOW bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh)
EOF
      exit 1
    fi
    IATA="$(upper_iata "$IATA" | tr -d '[:space:]')"
    if [ "$IATA" = "XXX" ]; then
      echo "XXX is a placeholder. Use the real 3-letter IATA airport code nearest to you." >&2
      exit 1
    fi
    if ! printf '%s' "$IATA" | grep -Eq '^[A-Z]{3}$'; then
      echo "IATA code must be exactly 3 letters, got: $IATA" >&2
      exit 1
    fi
    if label="$(known_iata_label "$IATA" 2>/dev/null)"; then
      say "Region selected: $IATA ($label)"
      return 0
    fi
    say "$IATA is not in the MeshCore.ca quick list."
    say "Continue only if $IATA is a real IATA airport code. Do not use CAN for Canada."
    if [ -t 0 ]; then
      if prompt_yes_no "Use $IATA anyway?" "n"; then
        return 0
      fi
      IATA=""
      continue
    fi
    return 0
  done
}

as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif have_cmd sudo; then
    sudo "$@"
  else
    echo "This action needs root permissions and sudo is not available: $*" >&2
    exit 1
  fi
}

restart_systemd_if_present() {
  local service="$1"
  if [ "$RESTART_SERVICE" -ne 1 ] || ! have_cmd systemctl; then
    return 0
  fi
  if systemctl list-unit-files --type=service 2>/dev/null | awk '{print $1}' | grep -qx "$service.service"; then
    say "Restarting systemd service: $service"
    as_root systemctl restart "$service"
  else
    say "No $service systemd service found; restart the process manually."
  fi
}

packetcapture_env_path() {
  if [ -n "$PACKETCAPTURE_ENV_FILE" ]; then
    printf '%s\n' "$PACKETCAPTURE_ENV_FILE"
  else
    printf '%s/.env.local\n' "$PACKETCAPTURE_DIR"
  fi
}

detect_mctomqtt_install() {
  [ -d "$MCTOMQTT_CONFIG_DIR" ] && return 0
  have_cmd systemctl && systemctl list-unit-files --type=service 2>/dev/null | awk '{print $1}' | grep -qx "$MCTOMQTT_SERVICE.service"
}

detect_packetcapture_install() {
  local env_file base_dir
  env_file="$(packetcapture_env_path)"
  base_dir="$(dirname "$env_file")"
  [ -f "$env_file" ] || [ -f "$base_dir/packet_capture.py" ]
}

install_mctomqtt() {
  detect_mctomqtt_install && return 0
  if [ "$INSTALL_MCTOMQTT" -ne 1 ]; then
    if prompt_yes_no "meshcoretomqtt is not installed. Install it now?" "y"; then
      INSTALL_MCTOMQTT=1
    else
      return 0
    fi
  fi
  [ "$INSTALL_MCTOMQTT" -eq 1 ] || return 0
  have_cmd curl || { echo "curl is required for --install-mctomqtt." >&2; exit 1; }
  local tmp
  tmp="$(mktemp)"
  say "Installing Cisien/meshcoretomqtt from: $MCTOMQTT_INSTALL_URL"
  curl -fsSL "$MCTOMQTT_INSTALL_URL" -o "$tmp"
  as_root bash "$tmp"
  rm -f "$tmp"
}

install_packetcapture() {
  detect_packetcapture_install && return 0
  if [ "$INSTALL_PACKETCAPTURE" -ne 1 ]; then
    if prompt_yes_no "meshcore-packet-capture is not installed. Install it now?" "y"; then
      INSTALL_PACKETCAPTURE=1
    else
      return 0
    fi
  fi
  [ "$INSTALL_PACKETCAPTURE" -eq 1 ] || return 0
  have_cmd curl || { echo "curl is required for --install-packetcapture." >&2; exit 1; }
  local tmp
  tmp="$(mktemp)"
  say "Installing meshcore-packet-capture from: $PACKETCAPTURE_INSTALL_URL"
  curl -fsSL "$PACKETCAPTURE_INSTALL_URL" -o "$tmp"
  bash "$tmp"
  rm -f "$tmp"
}

select_device_type() {
  if [ -n "$DEVICE_TYPE" ]; then
    DEVICE_TYPE="$(normalize_device_type "$DEVICE_TYPE" || true)"
    [ -n "$DEVICE_TYPE" ] || { echo "--device must be serial-host or companion" >&2; exit 2; }
    return 0
  fi
  case "$MODE" in
    mctomqtt) DEVICE_TYPE="serial-host"; return 0 ;;
    env) DEVICE_TYPE="companion"; return 0 ;;
  esac
  if detect_mctomqtt_install; then
    DEVICE_TYPE="serial-host"
  elif detect_packetcapture_install; then
    DEVICE_TYPE="companion"
  else
    DEVICE_TYPE="serial-host"
  fi
}

choose_mctomqtt_dropin() {
  if [ -n "$MCTOMQTT_DROPIN" ]; then
    return 0
  fi
  # Check for legacy drop-in names and migrate
  if [ -f "$MCTOMQTT_CONFIG_DIR/config.d/20-canadaverse.toml" ]; then
    MCTOMQTT_DROPIN="$MCTOMQTT_CONFIG_DIR/config.d/20-canadaverse.toml"
  elif [ -f "$MCTOMQTT_CONFIG_DIR/config.d/zz-canadaverse.toml" ]; then
    MCTOMQTT_DROPIN="$MCTOMQTT_CONFIG_DIR/config.d/zz-canadaverse.toml"
  else
    MCTOMQTT_DROPIN="$MCTOMQTT_CONFIG_DIR/config.d/20-meshcore-ca.toml"
  fi
}

patch_mctomqtt() {
  require_iata
  install_mctomqtt
  choose_mctomqtt_dropin
  if [ ! -d "$MCTOMQTT_CONFIG_DIR" ]; then
    echo "meshcoretomqtt config directory was not found: $MCTOMQTT_CONFIG_DIR" >&2
    exit 1
  fi

  local dropin_dir tmp backup
  dropin_dir="$(dirname "$MCTOMQTT_DROPIN")"
  tmp="$(mktemp)"
  cat > "$tmp" <<EOF
# MeshCore.ca broker drop-in for Cisien/meshcoretomqtt.
# Generated by add-meshcore-ca-broker.sh.

[general]
iata = "$IATA"

[[broker]]
name = "meshcore-ca-1"
enabled = true
server = "$BROKER1_HOST"
port = $BROKER_PORT
transport = "websockets"
keepalive = 60
qos = 0
retain = true

[broker.tls]
enabled = true
verify = true

[broker.auth]
method = "token"
audience = "$BROKER1_HOST"

[[broker]]
name = "meshcore-ca-2"
enabled = true
server = "$BROKER2_HOST"
port = $BROKER_PORT
transport = "websockets"
keepalive = 60
qos = 0
retain = true

[broker.tls]
enabled = true
verify = true

[broker.auth]
method = "token"
audience = "$BROKER2_HOST"
EOF

  as_root mkdir -p "$dropin_dir"
  if [ -f "$MCTOMQTT_DROPIN" ]; then
    backup="$(backup_path "$MCTOMQTT_DROPIN")"
    as_root cp -p "$MCTOMQTT_DROPIN" "$backup"
    say "Backup written: $backup"
  fi
  as_root install -m 0644 "$tmp" "$MCTOMQTT_DROPIN"
  rm -f "$tmp"
  say "Patched: $MCTOMQTT_DROPIN"
  say "Brokers: $BROKER1_HOST:$BROKER_PORT, $BROKER2_HOST:$BROKER_PORT"
  restart_systemd_if_present "$MCTOMQTT_SERVICE"
}

env_value() {
  local file="$1"
  local key="$2"
  awk -F= -v key="$key" '$1 == key { v=$0; sub("^[^=]*=", "", v); print v }' "$file" | tail -n 1
}

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { done=0 }
    $0 ~ "^" key "=" {
      if (!done) {
        print key "=" value
        done=1
      }
      next
    }
    { print }
    END {
      if (!done) print key "=" value
    }
  ' "$file" > "$tmp"
  cat "$tmp" > "$file"
  rm -f "$tmp"
}

set_packetcapture_slot() {
  local file="$1"
  local slot="$2"
  local host="$3"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_ENABLED" "true"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_SERVER" "$host"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_PORT" "$BROKER_PORT"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_TRANSPORT" "websockets"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_USE_TLS" "true"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_TLS_VERIFY" "true"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_USE_AUTH_TOKEN" "true"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_TOKEN_AUDIENCE" "$host"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_KEEPALIVE" "120"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_QOS" "0"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_RETAIN" "true"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_TOPIC_STATUS" 'meshcore/{IATA}/{PUBLIC_KEY}/status'
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_TOPIC_PACKETS" 'meshcore/{IATA}/{PUBLIC_KEY}/packets'
}

disable_packetcapture_slot() {
  local file="$1"
  local slot="$2"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_ENABLED" "false"
  upsert_env "$file" "PACKETCAPTURE_MQTT${slot}_SERVER" ""
}

patch_env_capture() {
  local env_file current_iata backup n
  env_file="$(packetcapture_env_path)"
  install_packetcapture
  mkdir -p "$(dirname "$env_file")"
  [ -f "$env_file" ] || install -m 0600 /dev/null "$env_file"
  current_iata="$(env_value "$env_file" "PACKETCAPTURE_IATA" | tr -d '\r' || true)"
  if [ -z "$IATA" ]; then
    IATA="$current_iata"
  fi
  require_iata

  backup="$(backup_path "$env_file")"
  cp -p "$env_file" "$backup"
  chmod 0600 "$backup"

  upsert_env "$env_file" "PACKETCAPTURE_IATA" "$IATA"
  set_packetcapture_slot "$env_file" 1 "$BROKER1_HOST"
  set_packetcapture_slot "$env_file" 2 "$BROKER2_HOST"
  for n in 3 4 5 6; do
    disable_packetcapture_slot "$env_file" "$n"
  done
  chmod 0600 "$env_file"
  say "Patched: $env_file"
  say "Backup written: $backup"
  say "Brokers: $BROKER1_HOST:$BROKER_PORT, $BROKER2_HOST:$BROKER_PORT"
  restart_systemd_if_present "$PACKETCAPTURE_SERVICE"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --iata) IATA="${2:?Missing value for --iata}"; shift 2 ;;
    --device) DEVICE_TYPE="${2:?Missing value for --device}"; shift 2 ;;
    --mode) MODE="${2:?Missing value for --mode}"; shift 2 ;;
    --install-mctomqtt) INSTALL_MCTOMQTT=1; shift ;;
    --install-packetcapture) INSTALL_PACKETCAPTURE=1; shift ;;
    --no-restart) RESTART_SERVICE=0; shift ;;
    --restart) RESTART_SERVICE=1; shift ;;
    --list-iata|--iata-list) print_iata_choices; exit 0 ;;
    --config-dir) MCTOMQTT_CONFIG_DIR="${2:?Missing value for --config-dir}"; shift 2 ;;
    --dropin) MCTOMQTT_DROPIN="${2:?Missing value for --dropin}"; shift 2 ;;
    --service) MCTOMQTT_SERVICE="${2:?Missing value for --service}"; shift 2 ;;
    --dir) PACKETCAPTURE_DIR="${2:?Missing value for --dir}"; shift 2 ;;
    --env-file) PACKETCAPTURE_ENV_FILE="${2:?Missing value for --env-file}"; shift 2 ;;
    --packet-service) PACKETCAPTURE_SERVICE="${2:?Missing value for --packet-service}"; shift 2 ;;
    --slot) shift 2 ;; # Kept for compatibility; slots 1 and 2 are now managed together.
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$MODE" in
  auto|mctomqtt|env) ;;
  *) echo "--mode must be auto, mctomqtt, or env" >&2; exit 2 ;;
esac

select_device_type
say "Device path: $DEVICE_TYPE"
if [ "$DEVICE_TYPE" = "serial-host" ]; then
  patch_mctomqtt
else
  patch_env_capture
fi
say "Done."
