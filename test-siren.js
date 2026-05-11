const http = require('http');

const data = JSON.stringify({
  direction: 'south',
  active: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/iot/ambulance-detected',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`\n==========================================`);
  console.log(`✅ SIREN TRIGGER SENT SUCCESSFULLY!`);
  console.log(`==========================================`);
  console.log(`👉 Ab apne ESP32 par dekhiye, South ki light GREEN hui ya nahi?`);
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
