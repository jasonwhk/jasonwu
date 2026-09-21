# Fire NFC Reader

Minimal Android/Fire OS app for a USB PN532 reader connected through a CH34x USB-serial bridge.

The app opens the USB serial device at 115200 baud, initializes the PN532 and continuously polls for ISO14443-A tags. A detected tag UID is displayed on screen.

## Install
GitHub Actions builds `FireNfcReader.apk`. Open the latest successful **Build Fire NFC Reader APK** workflow run, download the **FireNfcReader** artifact, unzip it, and install the APK on the Fire tablet. Fire OS may ask you to allow installation from the browser/files app.

No network permission is requested by the app.
