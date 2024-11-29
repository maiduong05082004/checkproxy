const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000; // Đảm bảo ứng dụng chạy trên cổng phù hợp với Vercel hoặc local

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
    // Kiểm tra nếu dòng không rỗng và có định dạng đúng
    if (line && line.includes(' => ')) {
      const parts = line.split(' => ');
      const proxy = parts[0];  // Ví dụ: 103.22.218.106:44899:abc12:abc21
      const details = parts[1]; // Ví dụ: 14.190.208.75 - Việt Trì - AS45899 VNPT Corp

      // Tách thông tin từ phần details
      const detailsParts = details.split(' - ');

      if (detailsParts.length > 1) {
        const city = detailsParts[1]; // Thành phố
        const isp = detailsParts[0]; // Nhà cung cấp dịch vụ mạng

        if (!grouped[isp]) {
          grouped[isp] = [];
        }

        grouped[isp].push({ proxy, city });
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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
