# Modbus CP Emulator README
![Screenshot 2024-10-09 alle 14 54 36](https://github.com/user-attachments/assets/f66dd108-979a-4328-92ca-697bbef3aa8b)

## Overview
The Modbus CP Emulator is a Vue.js application designed to simulate a Modbus control panel, enabling users to interact with Modbus registers, monitor system states, and manage MQTT connections for real-time data exchange. This emulator is particularly useful for developers and testers who need to emulate Modbus devices without the need for actual hardware, facilitating testing, debugging, and development of Modbus-based applications.

## Features
Modbus Register Interaction: Simulate read and write operations on Modbus registers.
System State Monitoring: View real-time updates on system, gun, and fault states.
RFID Tag Simulation: Simulate swiping an RFID tag and resetting RFID registers.
MQTT Connectivity: Manage MQTT settings, connect/disconnect to a broker, and publish/subscribe to topics.
Real-time Updates: See immediate feedback from simulated operations and MQTT messages.
Responsive Design: A user-friendly interface that adapts to different screen sizes.

## Setup
Requirements
- Node.js (preferably the latest LTS version)
- An MQTT broker running locally or accessible over the network

## Installation
Clone the repository to your local machine.

Navigate to the project directory and install the dependencies using NPM:

```bash
npm install
```
To start the development server, run:

```bash
npm run serve
```
## MQTT Broker Setup
An MQTT broker is required to fully utilize the MQTT functionalities of this emulator. The project includes a basic MQTT broker setup that can be run locally. Ensure you have Node.js installed on your machine before proceeding.

To run the included MQTT broker:

```bash
node broker.js -p 8888
```
This will start an MQTT broker on your local machine (port 8888), which the Modbus CP Emulator can connect to for simulating MQTT interactions.

## Usage
MQTT Settings: Configure MQTT settings such as broker address, port, and topics through the MQTT Settings section.
Modbus Registers: Interact with the list of Modbus registers displayed in the table. You can simulate read and write operations.
RFID Simulation: Use the RFID box to simulate swiping an RFID tag or resetting RFID registers.
Connect/Disconnect: Use the buttons to manage your connection to the MQTT broker, allowing for real-time data exchange.
### Customization
The Modbus registers and MQTT settings are configurable, allowing for a tailored simulation experience. You can modify the defaultModbusRegisters and defaultMqttSettings objects in the main Vue component to fit your testing scenarios.

## Contributing
Contributions are welcome! Please feel free to submit pull requests with bug fixes or enhancements.

## License
This project is open-source and available under the MIT License.
