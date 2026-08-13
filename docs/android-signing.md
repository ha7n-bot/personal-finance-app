# Android release signing policy

## Root cause found on 2026-08-13

Published APKs were previously signed with an ephemeral Android debug keystore. The certificate SHA-256 fingerprints were different between releases:

- 8.0.0: `27c61cc21248fc9e084711af4c2ffe7312f1ae9f24cba9f361b1480f05f1c72c`
- 8.1.0: `af8254fb9ae0e41a068ebc8d66fcd043be707961636df48512bed13b2ebc091c`
- 8.2.1: `d32f4c349f45a64df5e0fc4c89faa850562f84a91ec57ba24df06b10e72dc6f6`
- 8.3.0: `0b929a03db002f4a714119a3f0df24870650834cd2291fd8565100fd5e4d5da3`

This prevents Android from accepting a newer APK as an in-place update over an older release.

## Permanent policy from 8.4.0

- Published releases must use a protected PKCS12 release key supplied through GitHub Actions secrets.
- The private signing key must never be committed to the public repository.
- The expected public certificate SHA-256 fingerprint is pinned in `android-app/signing-cert.sha256`.
- CI must fail before publishing if the signing secrets are missing or if the generated APK certificate does not match the pinned fingerprint.
- Pull-request validation may use temporary debug signing, but PR APKs are never published as releases.

## One-time migration

Because the private keys used for the previous ephemeral signatures were not preserved, an installation signed by one of those old certificates cannot be updated in place to the new permanent signing identity. Before the one-time reinstall, export a Mali JSON backup from the currently installed app. After installing the first permanent-signed release, import that backup. Future releases must retain the same permanent signer and increasing version codes so normal in-place updates preserve application data.
