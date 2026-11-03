# 📱 BLE Proximity Attendance Check-in API

> **Dự án:** Ứng dụng mobile điểm danh gần bằng Bluetooth (BLE proximity check-in) cho CLB / nhóm hoạt động sinh viên  
> **Backend Framework:** NestJS (TypeScript)  
> **ORM & Database:** Prisma ORM & Neon Serverless PostgreSQL  
> **API Docs & Testing:** Swagger UI (OpenAPI 3.0)  
> **Cloud Deployment:** Render (Web Service)

---

## 📋 Mục lục
1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Cơ chế điểm danh gần bằng BLE (Proximity Verification)](#2-cơ-chế-điểm-danh-gần-bằng-ble)
3. [Chi tiết 2 Bộ API Collections](#3-chi-tiết-2-bộ-api-collections)
4. [Hướng dẫn Cấu hình Neon PostgreSQL](#4-hướng-dẫn-cấu-hình-neon-postgresql)
5. [Hướng dẫn Deploy lên Render](#5-hướng-dẫn-deploy-lên-render)
6. [Chạy Local Development](#6-chạy-local-development)
7. [Nộp bài & Kiểm thử Swagger](#7-nộp-bài--kiểm-thử-swagger)

---

## 1. Giới thiệu dự án

Hệ thống cung cấp giải pháp điểm danh sinh viên/thành viên CLB khi tham gia các buổi sinh hoạt offline. Thay vì điểm danh thủ công hoặc quét mã QR (dễ bị chụp ảnh gửi cho người ở nhà điểm danh hộ), hệ thống sử dụng công nghệ **Bluetooth Low Energy (BLE)**:
- Ban tổ chức/Chủ nhiệm CLB bật phát sóng BLE (hoặc đặt Beacon cố định tại phòng).
- Điện thoại thành viên quét tín hiệu BLE xung quanh.
- Dựa trên **UUID, Major, Minor** và **cường độ sóng RSSI**, hệ thống xác thực khoảng cách thực tế giữa người điểm danh và thiết bị phát trước khi ghi nhận thành công.

---

## 2. Cơ chế điểm danh gần bằng BLE

1. **Nhận diện thiết bị**: Phiên điểm danh quy định bộ định danh BLE Beacon duy nhất (`beaconUuid`, `major`, `minor`).
2. **Kiểm tra độ gần (Proximity Check)**:
   - Tín hiệu RSSI đo bằng dBm (thường từ `-30 dBm` rất gần đến `-95 dBm` rất xa).
   - Ngưỡng mặc định `minRssiThreshold = -80 dBm` (tương đương bán kính ~3 đến 5 mét trong phòng họp).
   - Nếu RSSI quét được `< minRssiThreshold`, hệ thống sẽ từ chối với lỗi: `Tín hiệu Bluetooth quá yếu. Bạn đang ở quá xa!`.
3. **Ước tính khoảng cách (Log-distance Path Loss)**:
   $$\text{Distance} = 10^{\frac{\text{TxPower} - \text{RSSI}}{10 \times n}}$$
   *(với $n = 2.0$ trong phòng học, $\text{TxPower} \approx -59\text{ dBm}$)*.
4. **Chống điểm danh lặp lại (Anti-Duplicate)**: Mỗi sinh viên chỉ được điểm danh 1 lần duy nhất trong 1 phiên (ràng buộc `@@unique([sessionId, studentId])`).

---

## 3. Chi tiết 2 Bộ API Collections

### 🟢 Collection 1: Quản lý Phiên điểm danh & Cấu hình BLE (`/api/v1/sessions`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **POST** | `/api/v1/sessions` | Tạo phiên điểm danh mới (cài đặt UUID, Major, Minor, RSSI threshold, thời gian) |
| **GET** | `/api/v1/sessions` | Lấy danh sách tất cả các phiên điểm danh (hỗ trợ lọc theo `clubCode`, `status`) |
| **GET** | `/api/v1/sessions/:id` | Xem chi tiết thông số cấu hình BLE của một phiên cụ thể |
| **PATCH** | `/api/v1/sessions/:id/status` | Đóng hoặc mở lại phiên điểm danh (`ACTIVE`, `CLOSED`, `CANCELLED`) |
| **GET** | `/api/v1/sessions/:id/attendees` | Lấy danh sách toàn bộ sinh viên đã điểm danh trong phiên |
| **DELETE** | `/api/v1/sessions/:id` | Xóa phiên điểm danh và dữ liệu liên quan |

### 🔵 Collection 2: Thực hiện Điểm danh & Lịch sử (`/api/v1/check-in`)
| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **POST** | `/api/v1/check-in` | Gửi dữ liệu quét BLE (UUID, RSSI, TxPower, Student ID) để xác thực độ gần & điểm danh |
| **GET** | `/api/v1/check-in/student/:studentId` | Tra cứu toàn bộ lịch sử điểm danh của một sinh viên theo mã SV |
| **GET** | `/api/v1/check-in/record/:id` | Tra cứu chi tiết một biên bản điểm danh bằng Record ID |
| **DELETE** | `/api/v1/check-in/record/:id` | Hủy bản ghi điểm danh (dành cho Admin/Host) |

---

## 4. Hướng dẫn Cấu hình Neon PostgreSQL

1. Truy cập [Neon Console](https://console.neon.tech) và đăng nhập bằng tài khoản Google/GitHub.
2. Tạo một Project mới (ví dụ đặt tên: `ble-check-in-db`).
3. Chọn Region gần nhất (ví dụ: `Singapore / AWS ap-southeast-1`).
4. Tại mục **Connection Details**, chọn connection type **Prisma** hoặc **PostgreSQL**.
5. Sao chép chuỗi kết nối dạng:
   ```text
   postgresql://neondb_owner:npg_xxxxxx@ep-cool-fog-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Dán chuỗi kết nối này vào file `.env` ở local và mục Environment Variables trên Render.

---

## 5. Hướng dẫn Deploy lên Render

1. Đẩy code lên GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete BLE proximity check-in API with 2 collections"
   git push origin main
   ```
2. Đăng nhập vào [Render Dashboard](https://dashboard.render.com).
3. Nhấp chọn **New +** $\rightarrow$ **Web Service**.
4. Kết nối với GitHub repository `ble-check-in`.
5. Điền các thông số:
   - **Name:** `ble-check-in-api`
   - **Region:** `Singapore` (hoặc cùng region với Neon)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npx prisma db push && npm run start:prod
     ```
6. Tại phần **Environment Variables**, bấm **Add Environment Variable**:
   - `DATABASE_URL`: *(Dán chuỗi kết nối Neon PostgreSQL vừa lấy ở Bước 4)*
   - `NODE_ENV`: `production`
7. Bấm **Create Web Service**. Render sẽ tự động build và deploy sau 2-3 phút!

---

## 6. Chạy Local Development

```bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo file cấu hình môi trường
cp .env.example .env
# Chỉnh sửa biến DATABASE_URL trong .env với Neon DB của bạn

# 3. Đồng bộ schema vào Neon DB
npx prisma db push

# 4. Chạy server ở chế độ dev
npm run start:dev
```

Server chạy tại: `http://localhost:3000`  
Tài liệu Swagger: `http://localhost:3000/docs`

---

## 7. Nộp bài & Kiểm thử Swagger

Sau khi Render deploy thành công, URL Swagger nộp cho giáo viên sẽ có dạng:
```
https://ble-check-in-api.onrender.com/docs
```
Giáo viên hoặc người chấm có thể bấm trực tiếp **Try it out** trên giao diện Swagger để:
1. Tạo một phiên sinh hoạt CLB với Beacon UUID giả lập (`FDA50693-A4E2-4FB1-AFCF-C6EB07647825`, RSSI ngưỡng `-80`).
2. Gửi request điểm danh mô phỏng điện thoại với RSSI `-65` (thành công) hoặc `-90` (bị từ chối do quá xa).
3. Kiểm tra danh sách điểm danh và lịch sử sinh viên.
