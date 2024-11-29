const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Cấu hình middleware để đọc dữ liệu từ body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cung cấp thư mục tĩnh để phục vụ các file HTML, CSS, JS
app.use(express.static('public'));

// Route chính để render form nhập liệu
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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

      // Kiểm tra nếu phần details đủ thông tin
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

  // Tạo file TXT từ dữ liệu đã nhóm
  let output = '';
  for (const group in groupedProxies) {
    output += `${group}:\n`;
    groupedProxies[group].forEach(proxy => {
      output += `${proxy}\n`;
    });
    output += '\n'; // Thêm một dòng trống sau mỗi nhóm
  }

  const fileName = 'filtered_proxies.txt'; // Tên file đầu ra
  fs.writeFileSync(fileName, output); // Ghi dữ liệu vào file

  // Trả về file cho người dùng tải về
  res.download(fileName, (err) => {
    if (err) {
      console.log('Lỗi khi tải file:', err);
    }
    // Xóa file sau khi tải xong
    fs.unlinkSync(fileName);
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
