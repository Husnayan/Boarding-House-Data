const mqttConfig = {
    broker: 'wss://broker.emqx.io:8084/mqtt', //[cite: 3]
    topics: ['husnayan/webdata'] // Web HANYA subscribe ke data dari main.cpp
};

let historyData = []; //[cite: 3]
let messageCount = 0; //[cite: 3]
let tempChart, gasChart; //[cite: 3]
let timeLabels = []; //[cite: 3]
let tempData = { rt1: [], rt2: [], rt3: [] }; //[cite: 3]
let gasData = { rt1: [], rt2: [], rt3: [] }; //[cite: 3]

// Pelacak status terakhir untuk mencegah duplikasi log di tabel history
let lastData = {
    rt1: { t: null, g: null, l: null },
    rt2: { t: null, g: null, l: null },
    rt3: { t: null, g: null, l: null }
};

function addToHistory(rt, type, value) {
    const now = new Date(); //[cite: 3]
    const timeStr = now.toLocaleTimeString(); //[cite: 3]
    const dateStr = now.toLocaleDateString(); //[cite: 3]
    
    historyData.push({ date: dateStr, time: timeStr, rt: rt, type: type, value: value }); //[cite: 3]

    const body = document.getElementById('historyBody'); //[cite: 3]
    const row = document.createElement('tr'); //[cite: 3]
    row.innerHTML = `
        <td>${timeStr}</td>
        <td><span class="badge bg-secondary">RT ${rt}</span></td>
        <td>${type}</td>
        <td class="fw-bold">${value}</td>
    `; //[cite: 3]
    body.insertBefore(row, body.firstChild); //[cite: 3]
    if (body.children.length > 50) body.removeChild(body.lastChild); //[cite: 3]
}

function downloadCSV() {
    // Fungsi ini tetap sama seperti aslinya
    if (historyData.length === 0) return alert("Belum ada data rekaman!"); //[cite: 3]
    let csv = "\uFEFFTanggal,Waktu,Sumber,Tipe,Nilai\n"; //[cite: 3]
    historyData.forEach(d => { csv += `${d.date},${d.time},RT ${d.rt},${d.type},"${d.value}"\n`; }); //[cite: 3]
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); //[cite: 3]
    const a = document.createElement('a'); //[cite: 3]
    a.href = window.URL.createObjectURL(blob); //[cite: 3]
    a.download = `Log_MQTT_RT_Monitoring_${new Date().toISOString().slice(0,10)}.csv`; //[cite: 3]
    a.click(); //[cite: 3]
}

function updateDisplay(id, val, isTemp) {
    const el = document.getElementById(id); //[cite: 3]
    el.textContent = isTemp ? `${parseFloat(val).toFixed(2)}°C` : val; //[cite: 3]
}

function updateLED(id, status) {
    const ind = document.getElementById(`ledIndicator${id}`); //[cite: 3]
    const txt = document.getElementById(`ledStatus${id}`); //[cite: 3]
    const isOn = status === "1" || status.toUpperCase() === "ON"; //[cite: 3]
    ind.className = isOn ? 'led-indicator led-on' : 'led-indicator led-off'; //[cite: 3]
    txt.textContent = isOn ? 'ON' : 'OFF'; //[cite: 3]
    txt.style.color = isOn ? '#2ecc71' : '#95a5a6'; //[cite: 3]
}

function connectMQTT() {
    const client = mqtt.connect(mqttConfig.broker, { clientId: 'web_monitor_' + Math.random().toString(16).substr(2, 8) }); //[cite: 3]

    client.on('connect', () => {
        document.getElementById('statusDot').className = 'status-dot connected'; //[cite: 3]
        document.getElementById('connectionText').textContent = 'TERHUBUNG KE MAIN.CPP';
        mqttConfig.topics.forEach(t => client.subscribe(t)); //[cite: 3]
    });

    client.on('message', (topic, payload) => {
        if (topic === 'husnayan/webdata') {
            const data = JSON.parse(payload.toString());
            
            messageCount++; //[cite: 3]
            document.getElementById('messageCount').textContent = messageCount; //[cite: 3]
            document.getElementById('lastUpdateTime').textContent = new Date().toLocaleTimeString(); //[cite: 3]

            // Ekstrak & Update RT 1
            const p1 = data.publisher1;
            updateDisplay('temp1', p1.temperature, true); //[cite: 3]
            updateDisplay('gas1', p1.gas, false); //[cite: 3]
            updateLED(1, p1.led); //[cite: 3]
            if(p1.temperature !== lastData.rt1.t) { addToHistory(1, "Suhu", p1.temperature + "°C"); lastData.rt1.t = p1.temperature; }
            if(p1.gas !== lastData.rt1.g) { addToHistory(1, "Gas", p1.gas); lastData.rt1.g = p1.gas; }
            if(p1.led !== lastData.rt1.l) { addToHistory(1, "LED", p1.led); lastData.rt1.l = p1.led; }

            // Ekstrak & Update RT 2
            const p2 = data.publisher2;
            updateDisplay('temp2', p2.temperature, true); //[cite: 3]
            updateDisplay('gas2', p2.gas, false); //[cite: 3]
            updateLED(2, p2.led); //[cite: 3]
            if(p2.temperature !== lastData.rt2.t) { addToHistory(2, "Suhu", p2.temperature + "°C"); lastData.rt2.t = p2.temperature; }
            if(p2.gas !== lastData.rt2.g) { addToHistory(2, "Gas", p2.gas); lastData.rt2.g = p2.gas; }
            if(p2.led !== lastData.rt2.l) { addToHistory(2, "LED", p2.led); lastData.rt2.l = p2.led; }

            // Ekstrak & Update RT 3
            const p3 = data.publisher3;
            updateDisplay('temp3', p3.temperature, true); //[cite: 3]
            updateDisplay('gas3', p3.gas, false); //[cite: 3]
            updateLED(3, p3.led); //[cite: 3]
            if(p3.temperature !== lastData.rt3.t) { addToHistory(3, "Suhu", p3.temperature + "°C"); lastData.rt3.t = p3.temperature; }
            if(p3.gas !== lastData.rt3.g) { addToHistory(3, "Gas", p3.gas); lastData.rt3.g = p3.gas; }
            if(p3.led !== lastData.rt3.l) { addToHistory(3, "LED", p3.led); lastData.rt3.l = p3.led; }

            updateChartsData(); //[cite: 3]
        }
    });
}

function initCharts() {
    const opt = (title) => ({ responsive: true, plugins: { title: { display: true, text: title }}}); //[cite: 3]
    tempChart = new Chart(document.getElementById('tempChart'), { //[cite: 3]
        type: 'line', //[cite: 3]
        data: { labels: timeLabels, datasets: [ //[cite: 3]
            { label: 'RT 1', data: tempData.rt1, borderColor: '#e74c3c', tension: 0.3, fill: false }, //[cite: 3]
            { label: 'RT 2', data: tempData.rt2, borderColor: '#2ecc71', tension: 0.3, fill: false }, //[cite: 3]
            { label: 'RT 3', data: tempData.rt3, borderColor: '#f39c12', tension: 0.3, fill: false } //[cite: 3]
        ]},
        options: opt('Monitoring Suhu (°C)') //[cite: 3]
    });
    gasChart = new Chart(document.getElementById('gasChart'), { //[cite: 3]
        type: 'line', //[cite: 3]
        data: { labels: timeLabels, datasets: [ //[cite: 3]
            { label: 'RT 1', data: gasData.rt1, borderColor: '#9b59b6', tension: 0.3, fill: false }, //[cite: 3]
            { label: 'RT 2', data: gasData.rt2, borderColor: '#1abc9c', tension: 0.3, fill: false }, //[cite: 3]
            { label: 'RT 3', data: gasData.rt3, borderColor: '#34495e', tension: 0.3, fill: false } //[cite: 3]
        ]},
        options: opt('Level Deteksi Gas') //[cite: 3]
    });
}

function updateChartsData() {
    const now = new Date().toLocaleTimeString(); //[cite: 3]
    if (timeLabels.length > 15) { //[cite: 3]
        timeLabels.shift(); //[cite: 3]
        tempData.rt1.shift(); tempData.rt2.shift(); tempData.rt3.shift(); //[cite: 3]
        gasData.rt1.shift(); gasData.rt2.shift(); gasData.rt3.shift(); //[cite: 3]
    }
    timeLabels.push(now); //[cite: 3]
    tempData.rt1.push(parseFloat(document.getElementById('temp1').innerText) || 0); //[cite: 3]
    tempData.rt2.push(parseFloat(document.getElementById('temp2').innerText) || 0); //[cite: 3]
    tempData.rt3.push(parseFloat(document.getElementById('temp3').innerText) || 0); //[cite: 3]
    gasData.rt1.push(parseInt(document.getElementById('gas1').innerText) || 0); //[cite: 3]
    gasData.rt2.push(parseInt(document.getElementById('gas2').innerText) || 0); //[cite: 3]
    gasData.rt3.push(parseInt(document.getElementById('gas3').innerText) || 0); //[cite: 3]
    tempChart.update('none'); //[cite: 3]
    gasChart.update('none'); //[cite: 3]
}

document.addEventListener('DOMContentLoaded', () => { //[cite: 3]
    initCharts(); //[cite: 3]
    connectMQTT(); //[cite: 3]
}); //[cite: 3]
