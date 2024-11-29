const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

// Sử dụng body-parser để đọc dữ liệu form
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
    // Kiểm tra nếu dòng không rỗng và có định dạng đúng
    if (line && line.includes(' => ')) {
      const parts = line.split(' => ');
      const proxy = parts[0];  // Ví dụ: 103.22.218.106:44899:abc12:abc21
      const details = parts[1]; // Ví dụ: 14.190.208.75 - Việt Trì - AS45899 VNPT Corp

      // Tách thông tin từ phần details
      const detailsParts = details.split(' - ');

      if (detailsParts.length >= 3) {
        const ip = detailsParts[0]; // 14.190.208.75
        const location = detailsParts[1]; // Việt Trì
        const networkInfo = detailsParts[2]; // AS45899 VNPT Corp

        // Tách thông tin nhà mạng và mã AS
        const [network, provider] = networkInfo.split(' '); // VNPT, FPT, v.v.

        // Nhóm theo địa phương và nhà mạng
        const groupKey = `${location} - ${provider}`;

        // Nếu nhóm chưa có, tạo mới
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }

        // Thêm proxy vào nhóm tương ứng
        grouped[groupKey].push(`${proxy} => ${ip}`);
      } else {
        console.log(`Dòng không hợp lệ: ${line}`);
      }
    }
  });

  return grouped;
}

// Route xử lý dữ liệu khi người dùng submit form
app.post('/filter-proxy', (req, res) => {
  const proxyList = req.body.proxyList.trim().split('\n');
  const groupedProxies = filterAndGroupProxies(proxyList);

  // Tạo file TXT từ dữ liệu đã nhóm
  let output = '';
  for (const group in groupedProxies) {
    output += `${group}:\n`;
    groupedProxies[group].forEach(proxy => {
      output += `${proxy}\n`;
    });
    output += '\n';
  }

  // Ghi dữ liệu ra file
  const fileName = 'filtered_proxies.txt';
  fs.writeFileSync(fileName, output);

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
const port = 3000;
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
