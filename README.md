# 📊 XSMB Statistics & Prediction Tool

Tool phân tích thống kê và dự đoán xổ số miền Bắc với dữ liệu thời gian thực.

## ✨ Tính Năng

### 📈 Thống Kê Toàn Diện
- **Tần suất xuất hiện**: Biểu đồ và bảng xếp hạng các số từ 00-99
- **Số nóng/lạnh**: Phân tích số xuất hiện nhiều vs số gan/lâu chưa về
- **Cặp số hot**: Thống kê các cặp số thường cùng xuất hiện
- **Heatmap**: Trực quan hóa xuất hiện theo thời gian

### 🎲 Dự Đoán Thông Minh
- Dự đoán dựa trên xác suất thống kê
- 3 phương pháp: Tần suất, Gan, hoặc Kết hợp
- Điểm confidence cho mỗi dự đoán
- Top 15-20 số được khuyến nghị

### 💾 Quản Lý Dữ Liệu
- Tự động lấy kết quả từ API
- Lưu trữ lịch sử trong LocalStorage
- Export/Import dữ liệu JSON
- Lưu tối đa 365 ngày

### 🎨 Giao Diện
- Dark mode hiện đại
- Glassmorphism effects
- Smooth animations
- Fully responsive (Desktop, Tablet, Mobile)

## 🚀 Cách Sử Dụng

### Mở Ứng Dụng
1. Mở file `index.html` trong trình duyệt (Chrome, Firefox, Edge...)
2. Ứng dụng sẽ tự động tải dữ liệu mới nhất từ API

### Các Chức Năng Chính

**🔄 Làm Mới Dữ Liệu**
- Click nút 🔄 ở góc trên phải để lấy kết quả mới nhất

**📊 Xem Thống Kê**
- Chuyển đổi giữa các tab: Tần suất, Gan/Lâu về, Cặp số, Dự đoán
- Hover vào biểu đồ/số để xem chi tiết

**🎲 Dự Đoán**
- Chọn phương pháp dự đoán trong dropdown
- Xem top số được khuyến nghị với điểm confidence

**⚙️ Cài Đặt**
- Click nút ⚙️ để mở cài đặt
- Export: Tải dữ liệu về file JSON
- Import: Khôi phục dữ liệu từ file JSON
- Clear: Xóa toàn bộ dữ liệu

## 📁 Cấu Trúc Project

```
xsmb-stats/
├── index.html          # Giao diện chính
├── style.css           # Design system & styles
├── app.js              # Application controller
├── api.js              # API integration
├── storage.js          # LocalStorage management
├── statistics.js       # Statistical analysis
├── charts.js           # Chart.js visualization
├── components.js       # UI components
└── README.md           # Tài liệu này
```

## 🔗 API Endpoint

**Nguồn dữ liệu mới**: `https://xoso188.net/api/front/open/lottery/history/list/game?limitNum=30&gameCode=miba`

Nguồn: [xoso188.net](https://xoso188.net) - Cập nhật nhanh, chính xác, ổn định

**Ưu điểm**:
- ✅ Trả về nhiều kết quả cùng lúc (tối đa 365 ngày)
- ✅ API ổn định, không bị CORS
- ✅ Dữ liệu cập nhật realtime
- ✅ Miễn phí, không cần API key

## ⚠️ Lưu Ý Quan Trọng

- **Chỉ tham khảo**: Dự đoán dựa trên xác suất thống kê, không đảm bảo chính xác
- **Dữ liệu cục bộ**: Dữ liệu lưu trong trình duyệt, xóa cache = mất dữ liệu
- **Backup định kỳ**: Nên export dữ liệu thường xuyên để backup
- **Internet**: Cần kết nối internet để tải dữ liệu mới từ API

## 🛠️ Công Nghệ

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, Animations
- **JavaScript (ES6+)**: Modules, Async/Await, Fetch API
- **Chart.js 4.4**: Data visualization
- **Google Fonts**: Inter font family

## 📱 Responsive Design

- ✅ Desktop (1400px+)
- ✅ Tablet (768px - 1399px)
- ✅ Mobile (< 768px)

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 📄 License

Chỉ phục vụ mục đích nghiên cứu và tham khảo.

---

**Phát triển với ❤️ bởi Antigravity AI**
