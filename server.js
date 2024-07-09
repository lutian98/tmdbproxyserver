const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();

app.use(async (req, res) => {
  try {
    // 从请求URL中获取 API查询参数
    const url = new URL(req.url, `http://${req.headers.host}`);
    const searchParams = url.searchParams;

    // 设置代理API请求的URL地址
    const apiUrl = `https://api.themoviedb.org${url.pathname}?${searchParams.toString()}`;

    console.log(`Proxying request to: ${apiUrl}`); // Log the proxied URL

    // 设置API请求的headers
    const headers = {};
    for (let [key, value] of Object.entries(req.headers)) {
      headers[key] = value;
    }
    headers['Host'] = 'api.themoviedb.org';

    // 创建一个忽略 SSL 错误的 agent
    const agent = new https.Agent({ rejectUnauthorized: false });

    // 创建API请求
    const response = await axios({
      url: apiUrl,
      method: req.method,
      headers: headers,
      httpsAgent: agent
    });

    // 设置响应的状态码和headers
    res.status(response.status);
    for (let [key, value] of Object.entries(response.headers)) {
      res.set(key, value);
    }

    // 返回API响应的内容
    res.send(response.data);
  } catch (error) {
    console.error('Fetch error:', error.message); // Log the error message
    res.status(500).send('Internal Server Error');
  }
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});