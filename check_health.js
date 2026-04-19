require('http').get('http://127.0.0.1:3000', (res) => {
    console.log("Status: " + res.statusCode);
}).on('error', (e) => {
    console.error("Got error: " + e.message);
});
