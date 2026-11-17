# Vermiculture Bed Monitor

An IoT system that monitors worm bed conditions (soil moisture, air temperature and humidity) and shows them on a live web dashboard with alerts. It was built for the Embedded Systems and IoT semester project (Group 4A), BSc Computer Networks and Cybersecurity, Strathmore University.

## The problem

Vermiculture farmers such as George Muturi in Kiambu County check each worm bed by hand, using sight, smell and experience. This leads to inconsistent compost quality, wasted time, and missed harvest windows. This project collects bed data automatically and warns the farmer when conditions go out of range. The collected data will also be the foundation for a future AI-powered optimisation system.

## How it works

```
ESP32 + sensors  --Wi-Fi-->  ThingSpeak (cloud storage)  <--reads--  Web dashboard
        |                                                                  ^
        +------------------ USB cable (optional) --------------------------+
```

1. The ESP32 reads the sensors every 10 seconds and lights an LED if a value is out of range.
2. Every 16 seconds it uploads the latest reading to a ThingSpeak channel over Wi-Fi.
3. The dashboard fetches the stored readings from ThingSpeak and displays them with charts and alerts.
4. Alternatively, the dashboard can read the values straight from the ESP32 over USB.

## Hardware

| Part | Purpose |
|---|---|
| ESP32 dev board | Microcontroller with Wi-Fi |
| DHT22 | Air temperature and humidity |
| Capacitive soil moisture sensor | Bed moisture (%) |
| 3 LEDs (blue, red, yellow) | Local alerts for moisture, temperature and pH |
| Resistors, breadboard, jumper wires | Wiring |

pH is supported in the code but is currently simulated, because no pH sensor is connected yet.

### Pin connections

| Component | ESP32 pin |
|---|---|
| DHT22 data | GPIO 4 |
| Moisture sensor AOUT | GPIO 34 |
| pH input | GPIO 35 |
| Moisture LED (blue) | GPIO 18 |
| Temperature LED (red) | GPIO 19 |
| pH LED (yellow) | GPIO 21 |

## Alert thresholds

| Reading | Alert when |
|---|---|
| Soil moisture | below 40% or above 80% |
| Air temperature | below 15 °C or above 25 °C |
| pH (when enabled) | below 6.5 or above 7.5 |

When a reading is outside its range, its tile turns red and a banner on the dashboard explains what to do. The matching LED on the device also turns on.

## ThingSpeak channel fields

| Field | Value |
|---|---|
| 1 | Air temperature (°C) |
| 2 | Soil moisture (%) |


## Setting up the device (Arduino IDE)

1. Install the Arduino IDE and add ESP32 board support.
2. In Library Manager, install **DHT sensor library** (Adafruit) and **Adafruit Unified Sensor**.
3. Select the board **ESP32 Dev Module**.
4. In the sketch, set your Wi-Fi name and password (a 2.4 GHz network or phone hotspot) and your ThingSpeak **Write API key**.
5. Calibrate the moisture sensor: set `CALIBRATION_MODE = true`, upload, and note the raw values in dry air and in water. Put these into `MOIST_DRY_RAW` and `MOIST_WET_RAW`, then set `CALIBRATION_MODE = false` and upload again.

## Running the dashboard

1. Clone or download this repository and open the folder in VS Code.
2. Open `config.js` and set:
   - `CHANNEL_ID`: your ThingSpeak channel number.
   - `READ_API_KEY`: the channel's **Read** API key. Leave it empty if the channel is Public.
3. Install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.
   Without the extension, run `python -m http.server 8080` in the folder and open `http://localhost:8080`.

### Reading values over USB

1. Plug the ESP32 into the laptop and **close the Arduino Serial Monitor**.
2. Open the dashboard in Chrome or Edge.
3. Click **Connect by USB** and choose the ESP32's port.

The dashboard then shows live readings directly from the board. This works only in Chrome and Edge, and the data is not stored.

## Dashboard status messages

| Status | Meaning |
|---|---|
| Live | New readings are arriving |
| No new data | The newest reading is more than 3 minutes old, so check the device and Wi-Fi |
| Can't reach ThingSpeak | Wrong channel ID or Read key, or no internet |
| Set CHANNEL_ID in config.js | The channel ID has not been filled in yet |

## Troubleshooting

- **ESP32 will not connect to Wi-Fi:** it only supports 2.4 GHz. On an iPhone hotspot, turn on **Maximize Compatibility** and keep the hotspot screen open while connecting.
- **ThingSpeak shows "Upload rejected":** the Write key is wrong, or uploads are more frequent than every 15 seconds (free tier limit).
- **DHT22 read failed:** check the wiring and the pull-up resistor on the data line.
- **USB connection failed:** close the Arduino Serial Monitor, since only one program can use the port at a time.

## Security

- Never commit the Write API key or Wi-Fi password. The Arduino sketch is excluded from this repository for that reason.
- Only the Read API key belongs in `config.js`.
- If a key is leaked, generate a new one in ThingSpeak under API Keys.

## Future work

- Connect a real pH sensor.
- Add more beds, using the Bed ID field.
- Move storage to a full database such as MySQL or Firebase.
- Use the collected data to train an AI model that predicts the best harvest time.
- Send SMS or push notifications for alerts.

## Team

Group 4A, Embedded Systems and IoT, Strathmore University

- [JOY NDIRA]
- [OKWUDILI UJUBUONU]
- [AUSTIN MUENDO]
- [JOY MUNYIVA]
- [JOSEPH MUTUA]

Supervisor / Lecturer: [SOLOMON ITOTIA]