# 📱 TÀI LIỆU HƯỚNG DẪN KIỂM THỬ API TRÊN SWAGGER

> **Tên đề tài:** Ứng dụng mobile điểm danh gần bằng Bluetooth (BLE proximity check-in) cho CLB/nhóm hoạt động  

---

## 🎯 Giới thiệu luồng kiểm thử

Hệ thống API đã được cấu hình **sẵn 100% dữ liệu mẫu mặc định** trong giao diện Swagger UI. Người chấm **không cần tự nghĩ ra mã UUID hay viết payload phức tạp**.

Toàn bộ quá trình kiểm thử diễn ra theo **1 luồng xuyên suốt 7 bước**:
Từ lúc **Host mở phiên sinh hoạt** $\rightarrow$ **Sinh viên quét sóng BLE điểm danh** $\rightarrow$ **Kiểm tra các trường hợp bắt gian lận** $\rightarrow$ **Xem danh sách & Lịch sử**.

---

## 📋 BẢNG TỔNG HỢP 1 LUỒNG KIỂM THỬ DUY NHẤT

```
[Bước 1: Tạo phiên họp mới]  ───> Copy "id" phiên vừa tạo
              ↓
[Bước 2: Điểm danh THÀNH CÔNG (Ở gần phòng: RSSI = -65 dBm)]
              ↓
[Bước 3: Test BỊ TỪ CHỐI do Ở QUÁ XA (RSSI = -95 dBm)]
              ↓
[Bước 4: Test BỊ TỪ CHỐI do ĐIỂM DANH TRÙNG (MSSV đã điểm danh)]
              ↓
[Bước 5: Xem Danh sách sinh viên đã điểm danh trong phiên]
              ↓
[Bước 6: Xem Lịch sử điểm danh của Sinh viên]
              ↓
[Bước 7: Đóng phiên & Khóa điểm danh]
```

---

## 🚀 HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC

### BƯỚC 1: Tạo một phiên điểm danh CLB mới
*Mô phỏng: Ban chủ nhiệm CLB tạo buổi sinh hoạt tại phòng học và bật phát sóng BLE.*

- **API:** Nhóm `1. Sessions & BLE Config` $\rightarrow$ `POST /api/v1/sessions`
- **Cách thực hiện:**
  1. Bấm nút **Try it out**.
  2. Bấm nút **Execute** *(Swagger đã điền sẵn dữ liệu mẫu: CLB IT, Beacon UUID `FDA50693-A4E2-4FB1-AFCF-C6EB07647825`, Major `100`, Minor `1`, Ngưỡng sóng `-80 dBm`)*.
- **Kết quả trả về (HTTP 201 Created):**
  ```json
  {
    "id": "8f88182c-2399-4df1-845b-d2fa51478363",
    "title": "Buổi sinh hoạt CLB IT - Tuần 10",
    "clubCode": "CLUB_IT_DUT",
    "status": "ACTIVE",
    "beaconUuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
    "major": 100,
    "minor": 1,
    "minRssiThreshold": -80,
    "secretToken": "SEC-8899"
  }
  ```
👉 **HÀNH ĐỘNG DUY NHẤT:** Bôi đen và **Copy chuỗi `"id"`** vừa tạo (ví dụ: `8f88182c-2399-4df1-845b-d2fa51478363`).

---

### BƯỚC 2: Điểm danh THÀNH CÔNG (Xác thực độ gần Proximity)
*Mô phỏng: Sinh viên Nguyễn Văn An ngồi trong phòng học (khoảng cách ~1.5 - 2m), điện thoại bắt được sóng Bluetooth mạnh (`RSSI = -65 dBm` $\ge$ ngưỡng `-80 dBm`).*

- **API:** Nhóm `2. Check-in & Proximity Records` $\rightarrow$ `POST /api/v1/check-in`
- **Cách thực hiện:**
  1. Bấm **Try it out**.
  2. Dán chuỗi `"sessionId"` vừa copy ở Bước 1 vào trường `"sessionId"`:
  ```json
  {
    "sessionId": "8f88182c-2399-4df1-845b-d2fa51478363",
    "studentId": "21120001",
    "studentName": "Nguyễn Văn An",
    "deviceId": "iPhone 15 Pro - iOS 17.5",
    "beaconData": {
      "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
      "major": 100,
      "minor": 1,
      "rssi": -65,
      "txPower": -59
    },
    "secretToken": "SEC-8899"
  }
  ```
  *(Các trường UUID, Major, Minor, PIN đã được Swagger điền sẵn khớp 100% với phiên ở Bước 1).*
  3. Bấm **Execute**.
- **Kết quả trả về (HTTP 200 OK):**
  ```json
  {
    "message": "Điểm danh gần bằng Bluetooth thành công!",
    "data": {
      "studentId": "21120001",
      "studentName": "Nguyễn Văn An",
      "status": "SUCCESS",
      "bleVerification": {
        "rssi": -65,
        "distanceEstimatedMeters": 2,
        "minRssiThreshold": -80,
        "proximityStatus": "VERIFIED_NEARBY"
      }
    }
  }
  ```
👉 *Hệ thống xác thực RSSI `-65 dBm >= -80 dBm` $\rightarrow$ Cho phép điểm danh và tự tính khoảng cách ~2m.*

---

### BƯỚC 3: Test BỊ TỪ CHỐI do Ở QUÁ XA (Chống gian lận từ xa)
*Mô phỏng: Sinh viên đứng ngoài cổng trường, bãi xe hoặc ở nhà bắt sóng chập chờn (`RSSI = -95 dBm < -80 dBm`).*

- **API:** Vẫn ở `POST /api/v1/check-in`
- **Cách thực hiện:**
  1. Giữ nguyên `sessionId`.
  2. Đổi 2 thông số:
     - `"studentId"`: `"21120002"`
     - `"rssi"`: `-95`
  3. Bấm **Execute**.
- **Kết quả trả về (HTTP 400 Bad Request):**
  ```json
  {
    "statusCode": 400,
    "message": "Tín hiệu BLE quá yếu (-95 dBm < ngưỡng tối thiểu -80 dBm). Bạn đang ở quá xa thiết bị điểm danh của CLB!"
  }
  ```
👉 *Bảo vệ: Ngăn chặn hoàn toàn việc chụp màn hình hay nhờ người khác điểm danh từ xa.*

---

### BƯỚC 4: Test BỊ TỪ CHỐI do ĐIỂM DANH TRÙNG LẶP (Anti-Duplicate)
*Mô phỏng: Sinh viên Nguyễn Văn An (`21120001`) đã điểm danh ở Bước 2 cố tình bấm điểm danh lại lần nữa.*

- **API:** Vẫn ở `POST /api/v1/check-in`
- **Cách thực hiện:**
  1. Đổi lại `"rssi"`: `-65`.
  2. Đổi `"studentId"` về lại: `"21120001"`.
  3. Bấm **Execute**.
- **Kết quả trả về (HTTP 409 Conflict):**
  ```json
  {
    "statusCode": 409,
    "message": "Sinh viên [21120001] - Nguyễn Văn An đã điểm danh phiên này vào lúc..."
  }
  ```

---

### BƯỚC 5: Xem danh sách thành viên đã điểm danh trong phiên
*Mô phỏng: Ban tổ chức kiểm tra sĩ số và danh sách người có mặt.*

- **API:** Nhóm `1. Sessions & BLE Config` $\rightarrow$ `GET /api/v1/sessions/{id}/attendees`
- **Cách thực hiện:**
  1. Bấm **Try it out**.
  2. Dán `id` phiên ở Bước 1 vào ô `id`.
  3. Bấm **Execute**.
- **Kết quả trả về (HTTP 200 OK):**
  ```json
  {
    "session": {
      "id": "8f88182c-2399-4df1-845b-d2fa51478363",
      "title": "Buổi sinh hoạt CLB IT - Tuần 10",
      "clubCode": "CLUB_IT_DUT",
      "status": "ACTIVE"
    },
    "totalAttendees": 1,
    "attendees": [
      {
        "studentId": "21120001",
        "studentName": "Nguyễn Văn An",
        "scannedRssi": -65,
        "distanceEstimated": 2,
        "status": "SUCCESS"
      }
    ]
  }
  ```

---

### BƯỚC 6: Tra cứu lịch sử điểm danh của Sinh viên
*Mô phỏng: Sinh viên mở điện thoại xem các buổi CLB mình đã tham gia.*

- **API:** Nhóm `2. Check-in & Proximity Records` $\rightarrow$ `GET /api/v1/check-in/student/{studentId}`
- **Cách thực hiện:**
  1. Bấm **Try it out** *(Swagger đã điền sẵn `studentId`: `21120001`)*.
  2. Bấm **Execute**.
- **Kết quả trả về (HTTP 200 OK):** Hiển thị lịch sử buổi sinh hoạt tuần 10 mà bạn An đã điểm danh thành công.

---

### BƯỚC 7: Đóng phiên sinh hoạt & Khóa điểm danh
*Mô phỏng: Hết giờ sinh hoạt, ban chủ nhiệm đóng phiên.*

1. **Đóng phiên:**
   - Mở `PATCH /api/v1/sessions/{id}/status`.
   - Bấm **Try it out** $\rightarrow$ Dán `id` phiên vào ô `id` $\rightarrow$ Swagger đã có sẵn `{ "status": "CLOSED" }`.
   - Bấm **Execute** $\rightarrow$ Phiên được chuyển trạng thái sang `CLOSED`.

2. **Kiểm tra khi điểm danh vào phiên đã đóng:**
   - Quay lại `POST /api/v1/check-in` với bất kỳ sinh viên nào $\rightarrow$ Bấm **Execute**.
   - **Kết quả (HTTP 400 Bad Request):**
     ```json
     {
       "statusCode": 400,
       "message": "Phiên điểm danh hiện đang ở trạng thái \"CLOSED\". Chỉ có thể điểm danh khi phiên ACTIVE."
     }
     ```

---

Nếu muốn nhập thông tin câu lạc bộ và sinh viên khác, chỉ cần tuân theo nguyên lý:
1. **Trường tự do (Nhập bất kỳ chữ gì):**
   - `title`: Tên buổi sinh hoạt (VD: "Sinh hoạt CLB Guitar", "Workshop AI")
   - `clubCode`: Mã CLB (VD: "GUITAR_CLUB", "CLB_TIENGANH")
   - `studentId`, `studentName`: MSSV và tên của bất kỳ ai
   - `deviceId`: Tên điện thoại (VD: "Samsung S24", "Xiaomi 14")
2. **Trường bắt buộc phải khớp nhau giữa 2 bên:**
   - `sessionId` (check-in) phải là `id` của phiên được tạo.
   - `beaconData.uuid`, `major`, `minor`, `secretToken` (check-in) phải gõ **đúng y chang** những gì bạn đã đặt ở bước Tạo phiên.
   - `rssi` (check-in): Nhập số âm $\ge$ `minRssiThreshold` thì được duyệt, nhỏ hơn thì bị từ chối do quá xa.

