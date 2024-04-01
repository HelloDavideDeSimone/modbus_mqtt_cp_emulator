<template>
  <div class="mx-5">
    <div class="mt-2">
      <h1>Modbus cp emulator</h1>

    <div class="container-fluid">
      <!-- Resto dell'interfaccia... -->
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between"> <!-- Flex container to align button to the right -->
              <div class="status-indicator" :class="{ 'is-connected': mqttIsConnected, 'is-disconnected': !mqttIsConnected }">
              {{ mqttIsConnected ? 'MQTT Connected' : 'MQTT Disconnected' }}
            </div>
            <div>
              <button class="btn btn-warning me-2 " @click="clearTerminal">Clean Terminal</button>
              <button class="btn btn-danger" @click="resetSettings">Reset to default values</button>
            </div>

            </div>
            <MqttTerminal :messages="mqttMessages"/>
          </div>
        </div>
      </div>

      <div class="my-4">
          <button class="accordion-button" type="button"  @click="toggleAccordion">
            MQTT Settings
            <i :class="{'ms-2 fas fa-chevron-up': showAccordion, 'ms-2 fas fa-chevron-down': !showAccordion}"></i>
          </button>

          <div v-if="showAccordion" class="accordion">
            <mqtt-settings :settings="mqttSettings" @save="handleSaveSettings" :mqttIsConnected="mqttIsConnected" @disconnectFromMqttBroker="disconnectFromMqttBroker" @connectToMqttBroker="connectToMqttBroker" @publishMessage="m => publishMessage(m.topic, m.message)"></mqtt-settings>
          </div>
      </div>
    </div>

    <div class="my-3 row">
      <div class="status-box col">
        <div class="rfid-value">system state: {{ systemState }}</div>
        <div class="rfid-value">Gun state: {{ gunState }}</div>
        <div class="rfid-value">fault: {{ faultCode }}</div>
      </div>

      <div class="rfid-box col">
        <div class="rfid-value">RFID: {{ rfid }}</div>
        <div class="rfid-actions">
          <button class="btn btn-primary" @click="swipeRFID">Simula Swipe RFID</button>
          <button class="btn btn-secondary" @click="resetRFIDregister">Reset Registri RFID</button>
        </div>
      </div>


      <div class="actions-box col">
        <button v-if="gunState == 'Disconnect to EV'" class="btn btn-primary" @click="connectEV">Simulate EV connection</button>
        <button v-else class="btn btn-primary" @click="disconnectEV">Simulate EV disconnection</button>
      </div>
    </div>

    <table class="table table-striped">
      <caption>Registri modbus</caption>
      <tr>
        <th scope="col">Parameter</th>
        <th scope="col">Value</th>
        <th scope="col">Register Address</th>
        <th scope="col">Register Id</th>
        <th scope="col">Read/Write</th>
      </tr>
      <tr v-for="(item, index) in modbusRegisters" :key="index">
        <td>{{ item.parameter }}</td>
        <td :class="{ 'updated-animation': item.isUpdated }">
          <input v-if="!item.options" :disabled="item.disabled" @change="saveToStorage(item)" v-model="item.value" :type="item?.type === 'string' ? 'text' : 'number'"  :class="{'form-control': true, 'border-info': item.readWrite.includes('W')}"/>
          <select v-else  class="form-select" @change="saveToStorage(item)" v-model="item.value">
            <option v-for="option in item.options" :value="option.value" :key="option.text">{{ option?.text ?? 'NONE' }}</option>
          </select>
        </td>
        <td>{{ item.registerAddress }}</td>
        <td>{{ parseInt(item.registerAddress, 16) + 1 }}</td>
        <td>{{ item.readWrite }}</td>
      </tr>
    </table>
  </div>
</template>

<script>
import mqtt from 'mqtt';
import MqttTerminal from './components/MqttTerminal.vue'
import MqttSettings from './components/MqttSettings.vue';
import { hm10Logic } from './hm10Logic.js';

export default {
  components: {
    MqttTerminal,
    MqttSettings
  },
  mixins: [hm10Logic],
  data() {
    return {
      showAccordion: true,
      mqttClient: null,
      mqttIsConnected: false,
      mqttMessages: [],
      mqttSettings: {},
      defaultMqttSettings: {
        protocol: 'wss', // default protocol
        host: 'test.mosquitto.org', // default host
        port: 8081, // default port for WS
        options: {
          username: null,
          password: null
        },
        qos: 0,
        requestTopic: '/modbus/PR-01_LOCAL/request',
        responseTopic: '/modbus/PR-01_LOCAL/response'
      },
      defaultModbusRegisters: [
            { parameter: 'Phase Voltage of L1', value: 220, registerAddress: '0000', readWrite: 'R' , isUpdated: true, disabled: false},
            { parameter: 'Phase Voltage of L2', value: 223, registerAddress: '0001', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Phase Voltage of L3', value: 222, registerAddress: '0002', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Max Current', value: 160, registerAddress: '0003', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging State', value: 0, registerAddress: '0004', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Limit Current', value: 0, registerAddress: '0005', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Current of L1', value: 0, registerAddress: '002B', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Current of L2', value: 0, registerAddress: '002C', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Current of L3', value: 0, registerAddress: '002D', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Power of L1', value: 0, registerAddress: '002E', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Power of L2', value: 0, registerAddress: '0030', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Power of L3', value: 0, registerAddress: '0032', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Total Power', value: 0, registerAddress: '0034', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Max Current of Charging Plug', value: 0, registerAddress: '0036', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charging Energy', value: 0, registerAddress: '0037', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Meter Energy', value: 0, registerAddress: '0038', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Charge Time', value: 0, registerAddress: '003A', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Current Time - Year', value: 0, registerAddress: '003B', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Current Time - Month', value: 0, registerAddress: '003C', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Current Time - Day', value: 0, registerAddress: '003D', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Current Time - Hour', value: 0, registerAddress: '003E', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Current Time - Minute', value: 0, registerAddress: '003F', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Current Time - Second', value: 0, registerAddress: '0040', readWrite: 'W/R' , isUpdated: false, disabled: true},
            { parameter: 'Modbus Address', value: 0, registerAddress: '0041', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Reset Charging Station', value: 0, registerAddress: '0042', readWrite: 'W' , isUpdated: false, disabled: false},
            { parameter: 'Start/Stop Charging', value: 0, registerAddress: '0043', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Fault Code', value: 0, registerAddress: '0044', readWrite: 'R' , isUpdated: false, options: [
              { value: 0, text: 'No Faults Detected' },
              { value: 11, text: 'CP voltage anomaly' },
              { value: 12, text: 'Emergency stop' },
              { value: 13, text: 'Under voltage' },
              { value: 14, text: 'Over voltage' },
              { value: 15, text: 'Over temperature' },
              { value: 16, text: 'Electric Meter fault' },
              { value: 17, text: 'Leakage protection' },
              { value: 18, text: 'Output shortage' },
              { value: 19, text: 'Over current' },
              { value: 21, text: 'EV response timeout' },
              { value: 22, text: 'EV not supported' },
              { value: 23, text: 'Relay sticking' },
              { value: 24, text: 'RCD fault' },
              { value: 25, text: 'Ground fault' },
              { value: 26, text: 'PEN Leakage protection' },
            ], disabled: false},
            { parameter: 'System State', value: 0, registerAddress: '0045', readWrite: 'R' , isUpdated: false, options: [
              { value: 0, text: 'Standby' },
              { value: 1, text: 'Connected' },
              { value: 2, text: 'Starting' },
              { value: 3, text: 'Charging' },
              { value: 4, text: 'Start fail' },
              { value: 5, text: 'Charge end' },
              { value: 6, text: 'Fault state' },
              { value: 7, text: 'Reservation status' },
              { value: 8, text: 'WIFI configuring' },
              { value: 9, text: 'OCPP reserved' },
              { value: 10, text: 'Upgrading' },
            ], disabled: false},
            { parameter: 'Gun State', value: 0, registerAddress: '0046', readWrite: 'W/R' , isUpdated: false, options: [
              { value: 0, text: 'Disconnect to EV' },
              { value: 1, text: 'Connect to EV' },
            ], disabled: false},
            { parameter: 'Firmware Version', value: 0, registerAddress: '0047', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'EVSE Serial Number', value: '', registerAddress: '0057', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'RFID Number 0', value: 12598, registerAddress: '005F', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'RFID Number 1', value: 17204, registerAddress: '006F', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'RFID Number 2', value: 13380, registerAddress: '007F', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'RFID Number 3', value: 16952, registerAddress: '008F', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Current Time - Second', value: 0, registerAddress: '0040', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Modbus Address', value: 1, registerAddress: '0041', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Reset Charging Station', value: 0, registerAddress: '0042', readWrite: 'W' , isUpdated: false, disabled: false},
            { parameter: 'Start/Stop Charging', value: 0, registerAddress: '0043', readWrite: 'W/R' , isUpdated: false, options: [
              { value: 0, text: 'Invalid' },
              { value: 1, text: 'Start charging' },
              { value: 2, text: 'Stop charging' },
            ], disabled: false},
            { parameter: 'Fault Code', value: 0, registerAddress: '0044', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'System State', value: 0, registerAddress: '0045', readWrite: 'R' , isUpdated: false, disabled: false},
            { parameter: 'Gun State', value: 0, registerAddress: '0046', readWrite: 'W/R' , isUpdated: false, disabled: false},
            { parameter: 'Firmware Version', value: 43447423, registerAddress: '0047', readWrite: 'R', type: 'string' , isUpdated: false, disabled: true},
        ],
        modbusRegisters: []
    };
  },
  beforeUnmount() {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
  },
  created() {
    this.mqttSettings = {...this.defaultMqttSettings};
    this.loadMqttSettings();
    this.modbusRegisters = [...this.defaultModbusRegisters]
  },
  mounted() {
    this.loadFromStorage();
    this.updateCurrentTime();
    setInterval(this.updateCurrentTime, 1000); // Aggiorna i campi ora corrente ogni minuto
  },
  computed: {
    faultCode() {
      let register = this.modbusRegisters.find(r => r.registerAddress == '0044')
      return register.options.find( r => r.value == register.value)?.text
    },
    systemState() {
      let register = this.modbusRegisters.find(r => r.registerAddress == '0045')
      return register.options.find( r => r.value == register.value)?.text
    },
    gunState() {
      let register = this.modbusRegisters.find(r => r.registerAddress == '0046')
      return register.options.find( r => r.value == register.value)?.text
    },
    rfid() {
      const rfidAddresses = ['005F', '006F', '007F', '008F'];
      const ascii = []

      rfidAddresses.forEach(address => {

        let register = this.modbusRegisters.find(r => r.registerAddress == address)

        const hexVal = Number(register?.value ?? 0).toString(16);
          
          let first = hexVal.slice(0, 2);
          let second = hexVal.slice(2, 4);
  
          ascii.push(this.hex2a(second))
          ascii.push(this.hex2a(first))
      });

      return ascii.join('') == '\x00\x00\x00\x00' ? 'NO TAG' : ascii.join('')
    }
  },
  methods: {
    hex2a(hexx) {
        let hex = hexx.toString();
        let str = '';
        for (let i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    },
    toggleAccordion() {
        this.showAccordion = !this.showAccordion; // Cambia lo stato dell'accordion
    },
    loadMqttSettings() {
      const settings = localStorage.getItem('mqttSettings');
      if (settings) {
        console.log(settings)
        this.mqttSettings = JSON.parse(settings);
      }
    },
    handleSaveSettings(newSettings) {
      console.log("handleSaveSettings", newSettings)
      this.mqttSettings = newSettings;
      localStorage.setItem('mqttSettings', JSON.stringify(this.mqttSettings));
    },
    updateCurrentTime() {
      const currentTime = new Date();

      // Definizione di tutti i campi "Current Time" con i rispettivi indirizzi di registro
      const timeFields = [
        { parameter: 'Current Time - Year', value: currentTime.getFullYear(), registerAddress: '003B' },
        { parameter: 'Current Time - Month', value: currentTime.getMonth() + 1, registerAddress: '003C' }, // +1 poiché getMonth() restituisce 0 per gennaio, 1 per febbraio, ecc.
        { parameter: 'Current Time - Day', value: currentTime.getDate(), registerAddress: '003D' },
        { parameter: 'Current Time - Hour', value: currentTime.getHours(), registerAddress: '003E' },
        { parameter: 'Current Time - Minute', value: currentTime.getMinutes(), registerAddress: '003F' },
        { parameter: 'Current Time - Second', value: currentTime.getSeconds(), registerAddress: '0040' }
      ];

      timeFields.forEach((field) => {
        const register = this.modbusRegisters.find(r => r.registerAddress === field.registerAddress);
        if (register) {
          const newValue = field.value.toString(); // Assumi che i valori nel local storage siano stringhe
          if (register.value !== newValue) {
            register.value = newValue; // Aggiorna il valore del registro con quello nuovo
            this.triggerAnimation(register); // Avvia l'animazione per indicare l'aggiornamento
          }
        }
      });
    },
    connectEV() {
      let register = this.modbusRegisters.find(r => r.registerAddress == '0046')
      register.value = 1

      let systemRegister = this.modbusRegisters.find(r => r.registerAddress == '0045')
      systemRegister.value = 1
    },
    disconnectEV() {
      let register = this.modbusRegisters.find(r => r.registerAddress == '0046')
      register.value = 0

      let systemRegister = this.modbusRegisters.find(r => r.registerAddress == '0045')
      systemRegister.value = 0
    },
    swipeRFID(){
      const rfidValues = [
        { parameter: 'RFID Number 0', value: 12598, registerAddress: '005F', readWrite: 'R', isUpdated: false, disabled: false },
        { parameter: 'RFID Number 1', value: 17204, registerAddress: '006F', readWrite: 'R', isUpdated: false, disabled: false },
        { parameter: 'RFID Number 2', value: 13380, registerAddress: '007F', readWrite: 'R', isUpdated: false, disabled: false },
        { parameter: 'RFID Number 3', value: 16952, registerAddress: '008F', readWrite: 'R', isUpdated: false, disabled: false },
      ];

      rfidValues.forEach(rfid => {
        // Assumi che questa funzione invii i valori al dispositivo o al servizio.
        this.writeToRegister(rfid.registerAddress, rfid.value);
      });

    },
    resetRFIDregister(){
      const rfidAddresses = ['005F', '006F', '007F', '008F'];

      console.log("Reset RFID registers")
      rfidAddresses.forEach(address => {
        this.writeToRegister(address, 0);
      });
    },
    writeToRegister(address, value) {
      const register = this.modbusRegisters.find(reg => reg.registerAddress === address);
      if (register) {
        register.value = value;
        console.log( `Write to ${address}:${value}` );
        register.isUpdated = true; // Se vuoi tracciare che il registro è stato aggiornato
      }
    },
    resetSettings() {
      if (confirm("Sei sicuro di voler cancellare tutte le impostazioni e ripristinare i parametri di default?")) {
        // Cancellazione del localStorage
        localStorage.clear();
        
        // Ripristino delle impostazioni MQTT ai valori predefiniti
        this.mqttSettings = {...this.defaultMqttSettings};

        // Ripristino dei registri Modbus ai valori predefiniti
        this.modbusRegisters = [...this.defaultModbusRegisters];

        // Salvataggio dei valori predefiniti nel localStorage
        this.handleSaveSettings(this.mqttSettings);
        this.modbusRegisters.forEach(register => {
          this.saveToStorage(register);
        });

        alert("Impostazioni ripristinate ai valori predefiniti.");
      }
    },
    triggerAnimation(register) {
      register.isUpdated = true;
      setTimeout(() => (register.isUpdated = false), 900);
    },

    loadFromStorage() {
        this.modbusRegisters.forEach(register => {
            const savedValue = localStorage.getItem(register.registerAddress);
            if (savedValue !== null) {
                register.value = savedValue;
            }
        });
    },
    saveToStorage(item) {
      localStorage.setItem(item.registerAddress, item.value);
      this.triggerAnimation(item)
    },
    getInputType(item) {
      return item.type === 'string' ? 'text' : 'number';
    },
    connectToMqttBroker() {
      const { protocol, host, port, options, requestTopic, responseTopic } = this.mqttSettings;
      const url = `${protocol}://${host}:${port}`;

      try {
        console.log("URL", url)
        this.mqttMessages.push({ type: 'info', content: `Trying to connecto to MQTT Broker: ${url}` });

        options['username'] = options?.username || null;
        options['password'] = options?.password || null;
        this.mqttClient = mqtt.connect(url, options);
      } catch (error) {
        console.error(`Catastrophic error`, error);
      }
      this.mqttClient.on('connect', () => {
        this.showAccordion = false;
        this.mqttIsConnected = true;
        this.mqttMessages.push({ type: 'info', content: `Connected to MQTT Broker` });
        this.subscribeToTopic(requestTopic);
        this.subscribeToTopic(responseTopic);
      });

      this.mqttClient.on('close', () => {
        this.mqttIsConnected = false; // Aggiorna lo stato della connessione a false quando disconnesso
      });

      this.mqttClient.stream.on('error', function (error) {
        // This does trigger when the URL is invalid
        console.error('Connection error:', error);
    });

      this.mqttClient.on('error', (err) => {
        this.mqttIsConnected = false;
        this.mqttMessages.push({ type: 'error', content: `Connection to MQTT Broker failed: ${err.message}` });
        console.error('Connection to MQTT Broker failed:', err);
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleMqttMessage(topic, message.toString());
      });
    },
    subscribeToTopic(topic) {
      this.mqttClient.subscribe(topic, { qos: this.mqttSettings.qos }, (err) => {
        if (!err) {
          this.mqttMessages.push({ type: 'info', content: `Subscribed to topic "${topic}"` });
        } else {
          this.mqttMessages.push({ type: 'error', content: `Could not subscribe to topic "${topic}":  ${err.message}` });
          console.error(`Could not subscribe to topic "${topic}":`, err);
        }
      });
    },
    handleMqttMessage(topic, message) {
      if(topic !== this.mqttSettings.responseTopic) {
        this.mqttMessages.push({ type: 'received', content: `Received from ${topic}: ${message}` });
        const mqttMessage = this.parseModbusString(message)
        console.log(mqttMessage)
        if(!mqttMessage) return;
        if(Number(mqttMessage.serialDeviceId) == this.modbusRegisters.find(el => el.parameter == 'Modbus Address').value) {
          const startIndex = this.modbusRegisters.findIndex(reg => parseInt(reg.registerAddress, 16) + 1 == mqttMessage.firstRegister);
          let valuesToReturn = '';
          if (startIndex !== -1) {
            switch (mqttMessage.modbusFunction) {
              case 3: // Funzione di lettura
                for (let i = 0; i < mqttMessage.registerCountOrValues && (startIndex + i) < this.modbusRegisters.length; i++) {
                  valuesToReturn += ` ${(this.modbusRegisters[startIndex + i].value)}`;
                }
                this.publishMessage(this.mqttSettings.responseTopic, `${mqttMessage.cookie} OK${valuesToReturn}`);
                break;

              case 16: // Funzione di scrittura su più registri
                // Assicurati che registerCountOrValues sia un array di valori
                if (Array.isArray(mqttMessage.registerCountOrValues)) {
                  mqttMessage.registerCountOrValues.forEach((value, index) => {
                    if ((startIndex + index) < this.modbusRegisters.length) {
                      this.modbusRegisters[startIndex + index].value = value.toString();
                      this.saveToStorage(this.modbusRegisters[startIndex + index]); // Salva il nuovo valore nel localStorage
                    }
                  });
                  this.publishMessage(this.mqttSettings.responseTopic, `${mqttMessage.cookie} OK`);
                } else {
                  console.log("registerCountOrValues deve essere un array per la funzione 16.");
                }
                break;

              default:
                console.log(`Funzione Modbus ${mqttMessage.modbusFunction} non gestita`);
                break;
            }
          } else {
            console.log("Indice di partenza non valido.");
          }
        }
      }
    },
    publishMessage(topic, message) {
      if (this.mqttClient) {
        this.mqttClient.publish(topic, message, { qos: this.mqttSettings.qos }, (err) => {
          if (!err) {
            this.mqttMessages.push({ type: 'sent', content: `Sent to ${topic}: ${message}` });
          } else {
            console.error(`Could not send message to topic "${topic}":`, err);
            this.mqttMessages.push({ type: 'error', content: `Could not send message to topic "${topic}:  ${err.message}` });

          }
        });
      }
    },
    disconnectFromMqttBroker() {
      if (this.mqttClient) {
        this.mqttClient.end();
        this.mqttIsConnected = false;
        this.mqttMessages.push({ type: 'info', content: 'Disconnected from MQTT Broker' });
        console.log('Disconnected from MQTT Broker', this.mqttClient);
      }
    },
    clearTerminal() {
      this.mqttMessages = []; 
    },
    parseModbusString(modbusString) {
        // Split the input string into components
        const parts = modbusString.split(' ');
        if (parts.length < 7) {
            console.log("Invalid Modbus string format: ", modbusString, "error");
            return null;
        }

        // Extract and parse the basic components
        const protocolVersion = parseInt(parts[0], 10);
        const cookie = parseInt(parts[1], 10);
        const gatewayId = parseInt(parts[2], 10);
        const timeoutInSeconds = parseInt(parts[3], 10); // Assuming this was part of the original parameters
        const serialDeviceId = parts[4];
        const modbusFunction = parseInt(parts[5], 10);
        const firstRegister = parseInt(parts[6], 10);

        // Determine the type of the last parameter based on the Modbus function
        let registerCountOrValues;
        switch (modbusFunction) {
            case 1: // read coils
            case 2: // read input coils
            case 3: // read holding registers
            case 4: // read input registers
            case 5: // set single coil
            case 6: // write to a single holding register
                registerCountOrValues = parseInt(parts[7], 10);
                break;
            case 15: // set multiple coils
            case 16: // write to multiple holding registers
                registerCountOrValues = parts.slice(7).map(Number);
                break;
            default:
                console.log("Invalid Modbus function in string", "error");
                return null;
        }

        return {
            protocolVersion,
            cookie,
            gatewayId,
            timeoutInSeconds,
            serialDeviceId,
            modbusFunction,
            firstRegister,
            registerCountOrValues
        };
    }

  },
  watch: {
    mqttMessages: {
      handler(newMessages) {
        if (newMessages.length > 10000) {
          this.mqttMessages = newMessages.slice(-10000);
        }
      },
      deep: true 
    }
  },
};
</script>

<style>
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid black;
  padding: 8px;
  text-align: left;
}

.updated-animation {
  animation: flashAnimation 1s;
}

@keyframes flashAnimation {
  0%, 100% { background-color: transparent; }
  50% { background-color: yellow; }
}


.status-indicator {
  display: inline-block;
  padding: 5px 10px;
  color: white;
  border-radius: 5px;
  margin-bottom: 10px;
}

.is-connected {
  background-color: green;
}

.is-disconnected {
  background-color: red;
}



.accordion-item {
  margin-bottom: 1rem;
}

.accordion-button {
  background-color: #007bff;
  color: white;
}
.accordion-button::after {
  background-image: none !important;
}

.accordion-button.active {
  background-color: #0056b3;
}

.accordion-body {
  background-color: #f8f9fa;
  padding: 1rem;
}

.accordion-collapse {
  transition: height 0.3s ease;
}

.accordion-collapse.show {
  height: auto;
}



/* Stili per i box generali */
.status-box, .rfid-box, .actions-box {
  border: 2px solid #007bff; /* Colore del bordo */
  border-radius: 10px; /* Angoli arrotondati */
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f7f7f7; /* Sfondo chiaro */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Ombra leggera */
}

/* Stili per i titoli all'interno dei box */
.status-box .title, .rfid-box .title, .actions-box .title {
  font-weight: bold;
  margin-bottom: 15px;
  color: #0056b3; /* Colore del testo per i titoli */
}

/* Stili per i valori all'interno dei box */
.rfid-value, .status-value {
  font-size: 1.2em;
  color: #333; /* Colore del testo per i valori */
  margin: 5px 0; /* Margine per separare i valori */
}

/* Stili per le azioni */
.rfid-actions, .actions-box {
  margin-top: 20px; /* Spazio sopra i bottoni */
}

.rfid-actions button, .actions-box button {
  margin: 5px; /* Spazio tra i bottoni */
  padding: 10px 20px; /* Padding maggiore per i bottoni */
  border: none; /* Nessun bordo per i bottoni */
  border-radius: 5px; /* Angoli arrotondati per i bottoni */
  font-weight: bold; /* Testo in grassetto per i bottoni */
  cursor: pointer; /* Cursor pointer per indicare l'interattività */
  transition: background-color 0.3s; /* Transizione per l'hover */
}

.rfid-actions button:hover, .actions-box button:hover {
  background-color: #0056b3; /* Cambio colore al hover */
  color: white; /* Testo bianco al hover */
}

/* Stili specifici per i bottoni di azione */
.btn-primary {
  background-color: #007bff; /* Blu */
  color: white; /* Testo bianco */
}

.btn-secondary {
  background-color: #6c757d; /* Grigio */
  color: white; /* Testo bianco */
}


/* Contenitore dei box */
.my-3.row {
  display: flex;
  justify-content: space-around; /* Distribuisce lo spazio uniformemente */
  align-items: flex-start; /* Allinea i box all'inizio, nel caso abbiano altezze diverse */
  flex-wrap: wrap; /* Permette ai box di andare a capo su schermi piccoli */
}

/* Box generali */
.status-box, .rfid-box, .actions-box {
  flex: 1; /* Ogni box prenderà lo stesso spazio */
  min-width: 250px; /* Larghezza minima per evitare che diventino troppo stretti */
  margin: 10px; /* Spazio tra i box */
}
</style>

