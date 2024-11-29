const express = require("express");
const path = require("path");
const axios = require("axios");
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();
const port = 3000;

// Middleware để xử lý body request dạng JSON
app.use(express.json());

// Để Express phục vụ các tệp tĩnh (index.html và các tệp khác trong thư mục public)
app.use(express.static(path.join(__dirname, 'public'))); // Đảm bảo rằng thư mục public chứa index.html

// API để kiểm tra một proxy
app.post('/check-proxy', async (req, res) => {
  const { proxy } = req.body;
  const [ip, port, username, password] = proxy.split(':');
  const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    const response = await axios.get('https://ipinfo.io/json', { httpsAgent: agent });
    res.json({
      result: `${proxy} => ${response.data.ip} - ${response.data.city} - ${response.data.org}`,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// API để kiểm tra nhiều proxy cùng lúc
app.post('/check-proxies', async (req, res) => {
  const proxyList = req.body.proxies; // Danh sách proxy
  const promises = proxyList.map((proxy) => 
    fetch('http://localhost:3000/check-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proxy })
    })
    .then((response) => response.json())
  );

  try {
    const results = await Promise.all(promises); // Đợi tất cả kết quả trả về
    res.json(results); // Trả lại kết quả cho client
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Khởi động server tại cổng 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
