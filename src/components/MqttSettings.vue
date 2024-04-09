<template>
                <div class="accordion-item">
              <div class="accordion-collapse" :class="{ 'show': !mqttIsConnected }">
                <div class="accordion-body">

                  <h2>MQTT Settings</h2>
                  <div class="row">

                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="mqttProtocol" class="form-label">Protocol</label>
                        <select class="form-select" id="mqttProtocol" v-model="mqttSettings.protocol">
                          <option value="ws">ws (WebSocket)</option>
                          <option value="wss">wss (WebSocket Secure)</option>
                          <option value="mqtt">mqtt (TCP)</option>
                          <option value="mqtts">mqtts (TCP Secure)</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="mqttHost" class="form-label">Host</label>
                        <input type="text" class="form-control" id="mqttHost" v-model="mqttSettings.host">
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="mqttPort" class="form-label">Port</label>
                        <input type="number" class="form-control" id="mqttPort" v-model="mqttSettings.port">
                      </div>
                      <div class="mb-3">
                        <label for="mqttQos" class="form-label">QoS</label>
                        <select class="form-select" id="mqttQos" v-model="mqttSettings.qos">
                          <option :value="0">0 - At most once</option>
                          <option :value="1">1 - At least once</option>
                          <option :value="2">2 - Exactly once</option>
                        </select>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="mb-3">
                        <label for="mqttUsername" class="form-label">Username</label>
                        <input type="text" class="form-control" id="mqttUsername" v-model="mqttSettings.options.username">
                      </div>
                      <div class="mb-3">
                        <label for="mqttPassword" class="form-label">Password</label>
                        <input type="password" class="form-control" id="mqttPassword" v-model="mqttSettings.options.password">
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="mqttTopic" class="form-label">Topic Request</label>
                    <input type="text" class="form-control" id="requestMqttTopic" v-model="mqttSettings.requestTopic">
                  </div>
                  <div class="mb-3">
                    <label for="mqttTopic" class="form-label">Topic Response</label>
                    <input type="text" class="form-control" id="responseMqttTopic" v-model="mqttSettings.responseTopic">
                  </div>
                  <button class="btn btn-primary" @click="saveSettings">Save Settings</button>
                  <button class="btn btn-success ms-2" :disabled="mqttIsConnected" @click="connectToMqttBroker">Connect</button>
                  <button class="btn btn-danger ms-2" :disabled="!mqttIsConnected" @click="disconnectFromMqttBroker">Disconnect</button>
                  <button class="btn btn-secondary ms-2" :disabled="!mqttIsConnected" @click="publishMessage({topic: mqttSettings.responseTopic, message: 'Hello MQTT'})">Send Test Message</button>

                </div>
              </div>
            </div>
  </template>
  
  <script>
  export default {
    props: {
      settings: Object,
      mqttIsConnected: Boolean
    },
    data() {
      return {
        mqttSettings: {}
      };
    },
    created() {
      this.mqttSettings = { ...this.settings };
    },
    methods: {
      saveSettings() {
        this.$emit('save', this.mqttSettings);
      },
      connectToMqttBroker() {
        this.$emit('connectToMqttBroker', true);
      },
      disconnectFromMqttBroker() {
        this.$emit('disconnectFromMqttBroker', true);
      },
      publishMessage(param) {
        this.$emit('publishMessage', param);
      }
    }
  };
  </script>
  
  <style>
  /* Stili specifici del componente */
  .mqtt-settings {
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  </style>
  