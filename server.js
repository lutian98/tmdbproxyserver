const express = require('express');
const axios = require('axios');
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
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart the worker
  });
} else {
  const app = express();

  app.use(async (req, res) => {
    try {
      // 从请求URL中获取 API查询参数
      const url = new URL(req.url, `http://${req.headers.host}`);
      const searchParams = url.searchParams;

      // 根据请求路径判断目标主机
      const targetHost = url.pathname.startsWith('/t/p/')
        ? 'https://image.tmdb.org'
        : 'https://api.themoviedb.org';

      // 设置代理API请求的URL地址
      const apiUrl = `${targetHost}${url.pathname}?${searchParams.toString()}`;

      console.log(`Proxying request to: ${apiUrl}`); // Log the proxied URL

      // 设置API请求的headers
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.referer; // 删除 referer 头
      // 设置一个常规的 User-Agent
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

      // 创建一个忽略 SSL 错误的 agent
      const agent = new https.Agent({ rejectUnauthorized: false });

      // 创建API请求
      const response = await axios({
        url: apiUrl,
        method: req.method,
        headers: headers,
        responseType: 'stream', // 关键在于使用 stream 处理数据
        httpsAgent: agent
      });

      // 设置响应的状态码和headers
      res.status(response.status);
      for (let [key, value] of Object.entries(response.headers)) {
        res.set(key, Array.isArray(value) ? value.join('; ') : value);
      }

      // 返回API响应的内容
      response.data.pipe(res);
    } catch (error) {
      if (error.response) {
        console.error(`Error from upstream: Status ${error.response.status}`);
        // 尝试记录上游服务器返回的错误信息体
        let errorBody = '';
        error.response.data.on('data', chunk => { errorBody += chunk; });
        error.response.data.on('end', () => {
          console.error('Upstream response body:', errorBody);
          if (!res.headersSent) {
             res.status(error.response.status).send('Error from upstream server.');
          }
        });
      } else if (error.request) {
        console.error('No response received from upstream:', error.request);
        if (!res.headersSent) {
          res.status(502).send('Bad Gateway: No response from upstream server.');
        }
      } else {
        console.error('Error setting up request:', error.message);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      }
    }
  });

  // 启动服务器
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} is running on port ${port}`);
  });
}
