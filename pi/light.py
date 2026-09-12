"""
Runs on the Raspberry Pi. Polls Tether's /api/hardware/<token> endpoint
and turns an LED on when any task has been marked "missed".

Usage:
    python3 light.py

Edit API_URL below before running. TOKEN can be either the owner_token
or the partner_token printed by the web app.

Wiring (if using a real LED, not the demo-friendly buzzer beep):
    LED long leg (anode)  -> GPIO17 (pin 11) through a ~220-330ohm resistor
    LED short leg (cathode) -> GND (pin 9)
"""

import time
import requests

API_URL = "http://localhost:3000/api/hardware/z5Wo-_4QUD"
POLL_SECONDS = 15

try:
    import RPi.GPIO as GPIO

    LED_PIN = 17
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)
    HAS_GPIO = True
except ImportError:
    HAS_GPIO = False
    print("RPi.GPIO not available - running in print-only mode (fine for testing off-Pi)")


def set_light(missed: bool):
    if HAS_GPIO:
        GPIO.output(LED_PIN, GPIO.HIGH if missed else GPIO.LOW)
    print("MISSED - light ON" if missed else "ok - light off")


def main():
    print(f"Polling {API_URL} every {POLL_SECONDS}s...")
    while True:
        try:
            r = requests.get(API_URL, timeout=5)
            r.raise_for_status()
            data = r.json()
            set_light(data.get("status") == "missed")
        except Exception as e:
            print("poll failed:", e)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        if HAS_GPIO:
            GPIO.cleanup()
