const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Cấu hình middleware để đọc dữ liệu từ body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cung cấp thư mục tĩnh để phục vụ các file HTML, CSS, JS
app.use(express.static('public'));

// Route chính để render form nhập liệu
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Trả về trang index.html từ thư mục public
});

// Hàm lọc proxy và nhóm theo nhà mạng
function filterAndGroupProxies(data) {
  const grouped = {};

  data.forEach(line => {
    if (line && line.includes(' => ')) {
      const parts = line.split(' => ');
      const proxy = parts[0]; // Ví dụ: 103.22.218.106:44899
      const details = parts[1]; // Ví dụ: 14.190.208.75 - Việt Trì - AS45899 VNPT Corp

      // Tách thông tin từ phần details
      const detailsParts = details.split(' - ');

      if (detailsParts.length >= 3) {
        const ip = detailsParts[0];
        const location = detailsParts[1];
        const network = detailsParts[2];

        // Nhóm proxy theo địa phương và nhà mạng
        const groupKey = `${location} - ${network}`;

        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }

        grouped[groupKey].push(`${proxy} => ${ip}`);
      }
    }
  });

  return grouped;
}

// Route để nhận và xử lý dữ liệu từ form
app.post('/filter-proxy', (req, res) => {
  const proxyList = req.body.proxyList.trim().split('\n'); // Tách các dòng proxy từ dữ liệu nhận được
  const groupedProxies = filterAndGroupProxies(proxyList); // Lọc và nhóm proxies

  // Tạo nội dung file văn bản từ dữ liệu đã nhóm
  let output = '';
  for (const group in groupedProxies) {
    output += `${group}:\n`;
    groupedProxies[group].forEach(proxy => {
      output += `${proxy}\n`;
    });
    output += '\n'; // Thêm một dòng trống sau mỗi nhóm
  }

  // Sử dụng buffer để tạo file và trả về cho người dùng
  const buffer = Buffer.from(output, 'utf-8');

  // Đặt headers để tải file về với tên "filtered_proxies.txt"
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename=filtered_proxies.txt');
  res.send(buffer); // Gửi file cho người dùng tải về
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
