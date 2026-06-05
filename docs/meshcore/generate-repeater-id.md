## Generating a Repeater ID

Regions that are using 1-byte path sizes usually generate Repeater IDs manually to avoid accidentally reusing an ID that’s already in service. Follow the steps below to pick another ID and program the matching private key onto your repeater.

!!! note "Where this applies"
    Regions that have transitioned to multi-byte path sizes, will not need to worry about overlapping repeater id's.These instructions are left here for those cases where users want to generate a new repeater ID.

1. Open the **[MeshCore Key Generator](https://gessaman.com/mc-keygen/)**.
2. Type the unused ID(2-6 charectors) into the input field and click **Generate Key**.
3. Copy the **Private Key** value.
4. On the repeater console, run (replace `<PRIVATE-KEY>` with the value you copied):
   `set prv.key <PRIVATE-KEY>`
5. Reboot the repeater.

After reboot, the repeater will use that private key, and its public key will correspond to the ID you selected.
