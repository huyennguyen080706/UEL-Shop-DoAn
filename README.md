# UEL Shop — bản web tĩnh

Web bán đồ UEL "giả động": chỉ HTML + CSS + JS + file JSON, **không cần server backend, không cần database**. Giỏ hàng và đơn hàng lưu trong `localStorage` của trình duyệt.

## Cách chạy

Vì trang có đọc file JSON (fetch), **không mở trực tiếp bằng cách nháy đúp `index.html`** (trình duyệt chặn fetch trên `file://`). Chạy một static server bất kỳ:

```bash
# trong thư mục này
python3 -m http.server 8000
```

Rồi mở trình duyệt: http://localhost:8000

Hoặc bỏ nguyên thư mục này lên bất kỳ host tĩnh nào (GitHub Pages, Netlify, Vercel, Cloudflare Pages...).

## Các trang

- `index.html` — trang chủ
- `shop.html` — danh sách sản phẩm (lọc theo danh mục / bộ sưu tập / tìm kiếm)
- `product.html` — chi tiết sản phẩm
- `cart.html`, `checkout.html` — giỏ hàng, đặt hàng (đơn lưu localStorage)
- `order.html` — tra cứu đơn đã đặt (bằng mã đơn + số điện thoại)
- `about.html`, `policy.html` — giới thiệu, chính sách
- `admin.html` — **trang quản trị** (xem bên dưới)

## Trang quản trị (`admin.html`)

- **Mã truy cập: `uel@2026`** (đổi ở đầu file `js/admin.js`).
  Đây chỉ là rào chắn phía trình duyệt, **không phải bảo mật thật** — đừng để dữ liệu nhạy cảm.
- **Đơn hàng:** đọc đơn khách đặt (lưu ở `localStorage["uelshop.orders"]`, chung trình duyệt với trang checkout), đổi trạng thái đơn.
- **Sản phẩm:** sửa sản phẩm và phân loại ngay trên giao diện, bấm **"Tải products.json"** để lấy file mới, thay vào `data/products.json` để khách thấy thay đổi.

## Dữ liệu

- `data/*.json` — sản phẩm, danh mục, bộ sưu tập, thông tin cửa hàng.
- Dữ liệu là mẫu phục vụ đồ án, không phải dữ liệu vận hành thật.
