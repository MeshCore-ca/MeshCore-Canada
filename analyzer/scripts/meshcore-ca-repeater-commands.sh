#!/usr/bin/env bash
set -euo pipefail

cat >&2 <<'EOF'
The MeshCore.ca broker pair can be added to recent custom Wi-Fi observer
firmware through the MeshCore admin CLI.

For current MeshCore.ca observer firmware that needs broker defaults reapplied, run:

  set mqtt1.preset none
  set mqtt2.preset none
  set mqtt3.preset none
  set mqtt4.preset none
  set mqtt5.preset none
  set mqtt6.preset none
  set mqtt1.preset custom
  set mqtt1.server wss://mqtt1.meshcore.ca:443/mqtt
  set mqtt1.port 443
  set mqtt1.audience mqtt1.meshcore.ca
  set mqtt2.preset custom
  set mqtt2.server wss://mqtt2.meshcore.ca:443/mqtt
  set mqtt2.port 443
  set mqtt2.audience mqtt2.meshcore.ca
  reboot

For older firmware without MQTT slot commands, use one of these paths:

  1. Companion packet capture on a Pi, mini PC, or Linux host connected to the radio:
     bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh)

  2. Home Assistant MeshCore integration with custom brokers mqtt1.meshcore.ca and mqtt2.meshcore.ca.

  3. Update or reflash the node with firmware that already includes MeshCore.ca
     broker defaults.
EOF

exit 0
