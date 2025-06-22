const express = require('express');
const https = require('https');
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.use((req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      const targetHost = url.pathname.startsWith('/t/p/')
        ? 'https://image.tmdb.org'
        : 'https://api.themoviedb.org';

      const apiUrl = new URL(url.pathname + url.search, targetHost);

      console.log(`Worker ${process.pid}: Proxying ${req.method} ${req.url} to ${apiUrl}`);

      const headers = { ...req.headers };
      headers.host = apiUrl.hostname; // Set the correct host for the target
      delete headers.referer; // Remove referer to avoid anti-hotlinking issues
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: apiUrl.pathname + apiUrl.search,
        method: req.method,
        headers: headers,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        // Pass status and headers from the target response to the client
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Pipe the response body from the target to the client
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (e) => {
        console.error(`Proxy request error: ${e.message}`);
        if (!res.headersSent) {
          res.status(502).send('Bad Gateway');
        }
      });

      // Pipe the request body from the client to the target
      req.pipe(proxyReq, { end: true });

    } catch (error) {
      console.error('Error setting up proxy request:', error.message);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} is running on port ${port}`);
  });
}
