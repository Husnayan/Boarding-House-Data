const mqttConfig = {
    broker: 'wss://broker.emqx.io:8084/mqtt',
    topics: ['husnayan/+/data'] // Menerima dari rt1 dan rt2
};

const client = mqtt.connect(mqttConfig.broker);

client.on('connect', () => {
    mqttConfig.topics.forEach(t => client.subscribe(t));
    console.log("Terhubung ke Broker");
});

client.on('message', (topic, payload) => {
    const data = JSON.parse(payload.toString());
    
    // Cek apakah data datang dari RT1 atau RT2 berdasarkan nama topik
    if (topic.includes('rt1')) {
        document.getElementById('temp1').innerText = data.t.toFixed(1) + "°C";
        document.getElementById('gas1').innerText = data.g.toFixed(1);
        updateLED(1, data.l);
    } else if (topic.includes('rt2')) {
        document.getElementById('temp2').innerText = data.t.toFixed(1) + "°C";
        document.getElementById('gas2').innerText = data.g.toFixed(1);
        updateLED(2, data.l);
    }
});

function updateLED(id, status) {
    const dot = document.getElementById('ledIndicator' + id);
    dot.className = (status === "1") ? 'led-indicator led-on' : 'led-indicator led-off';
}
