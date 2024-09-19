const WebSocket = require('ws');
const mqtt = require('mqtt');
require('dotenv').config();
const wss = new WebSocket.Server({
    port: process.env.VUE_APP_WS_MQTT_MIDDLEWARE_PORT
});



let mqttSettings = null;

function getTimestamp() {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    return `${formattedDate} ${formattedTime} |`;
//    return `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}.${new Date().getMilliseconds()} |`;
}

wss.on('connection', (ws) => {
    console.log(`${getTimestamp()} WebSocket client connected`);
    let mqttClient = null;

    ws.on('message', (msg) => {
        try {
            const { action, settings, topic, message } = JSON.parse(msg);
            
            switch (action) {
                case 'publish':
                    if (mqttClient) {
                        publishOnMqtt(topic, message);
                    } else {
                        console.log(`${getTimestamp()} MQTT Client not ready`);
                        ws.send(JSON.stringify({ action: 'terminal-message', type: 'error', content: `${getTimestamp()} MQTT Client not ready` }));
                    }
                    break;
                case 'connectMqtt':
                    mqttSettings = settings;
                    connectToMqttBroker(ws, settings);
                    break;
                case 'disconnectMqtt':
                    if (mqttClient) {
                        console.log(`${getTimestamp()} Disconnecting from MQTT`);
                        mqttClient.end();
                    }
                    break;
            }
        } catch (error) {
            console.error(`${getTimestamp()} Error processing message:`, error);
            ws.send(JSON.stringify({ action: 'terminal-message', type: 'error', content: `${getTimestamp()} Error processing message: ${error.message}` }));
        }
    });

    ws.on('close', () => {
        if (mqttClient) {
            mqttClient.end();
            console.log(`${getTimestamp()} MQTT Client disconnected`);
        }
    });

    function publishOnMqtt(topic, message) {
        mqttClient.publish(topic, message, { qos: mqttSettings.qos }, (err) => {
            if (!err) {
                ws.send(JSON.stringify({ action: 'terminal-message', type: 'sent', content: `${getTimestamp()} Sent to ${topic}: ${message}` }));
            } else {
                console.error(`${getTimestamp()} Could not send message to topic "${topic}":`, err);
                ws.send(JSON.stringify({ action: 'terminal-message', type: 'error', content: `${getTimestamp()} Could not send message to topic "${topic}": ${err.message}` }));
            }
        });
    }

    function connectToMqttBroker(ws, settings) {
        const url = `${settings.protocol}://${settings.host}:${settings.port}`;
        mqttClient = mqtt.connect(url, settings.options);

        mqttClient.on('connect', () => {
            console.log(`${getTimestamp()} Connected to MQTT Broker`);
            ws.send(JSON.stringify({ action: 'mqttConnected' }));
            // Subscribing to topics after successful connection
            subscribeToTopic(settings.requestTopic);
            subscribeToTopic(settings.responseTopic);
        });

        mqttClient.on('message', (topic, message) => {
            ws.send(JSON.stringify({ action: 'message', topic, message: message.toString() }));
        });

        mqttClient.on('error', (err) => {
            console.error(`${getTimestamp()} MQTT Connection Error:`, err);
            ws.send(JSON.stringify({ action: 'error', type: 'error', content: `${getTimestamp()} MQTT Connection Error: ${err.message}` }));
            mqttClient.end();
        });

        mqttClient.on('close', () => {
            console.log(`${getTimestamp()} Disconnected from MQTT Broker`);
            ws.send(JSON.stringify({ action: 'terminal-message', type: 'error', content: `${getTimestamp()} Disconnected from MQTT Broker` }));
            mqttClient.end();
        });
    }

    function subscribeToTopic(topic) {
        if (mqttClient) {
            mqttClient.subscribe(topic, { qos: mqttSettings.qos }, (err) => {
                if (!err) {
                    ws.send(JSON.stringify({ action: 'terminal-message', type: 'info', content: `${getTimestamp()} Subscribed to topic "${topic}"` }));
                } else {
                    console.error(`${getTimestamp()} Could not subscribe to topic "${topic}":`, err);
                    ws.send(JSON.stringify({ action: 'terminal-message', type: 'error', content: `${getTimestamp()} Could not subscribe to topic "${topic}": ${err.message}` }));
                }
            });
        }
    }
});

console.log("MQTT middleware started")
