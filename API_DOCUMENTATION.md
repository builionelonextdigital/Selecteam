# API Documentation - Selecteam

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Get Form Page
**GET** `/`

Hiển thị form chọn team với thông tin về số người đã chọn mỗi team.

**Response**:
- Status: `200 OK`
- Content-Type: `text/html`
- Body: HTML form

**Example**:
```bash
curl http://localhost:3000/
```

---

### 2. Submit Team Selection
**POST** `/submit`

Gửi lựa chọn team và lưu vào cơ sở dữ liệu.

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Request Body**:
```
name=Nguyễn Văn A&team=team_a
```

**Parameters**:
| Tham số | Kiểu | Yêu cầu | Mô tả |
|---------|------|--------|-------|
| `name` | string | Yes | Tên người dùng (1-100 ký tự) |
| `team` | string | Yes | Mã team: `team_a`, `team_b`, `team_c`, `team_d` |

**Success Response (200)**:
```html
Trang form với thông báo: "✓ Thành công! Tên đã được thêm vào Team A"
```

**Error Responses**:

- **Thiếu dữ liệu** (400):
```html
Trang form với thông báo: "Vui lòng điền tên và chọn team"
```

- **Team không hợp lệ** (400):
```html
Trang form với thông báo: "Team không hợp lệ"
```

- **Team đầy** (400):
```html
Trang form với thông báo: "Team A đã đủ 2 người. Vui lòng chọn team khác."
```

- **Lỗi server** (500):
```html
Trang form với thông báo: "Có lỗi xảy ra. Vui lòng thử lại."
```

**Example with cURL**:
```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Nguyễn Văn A&team=team_a"
```

**Example with JavaScript (Fetch)**:
```javascript
const formData = new FormData();
formData.append('name', 'Nguyễn Văn A');
formData.append('team', 'team_a');

fetch('http://localhost:3000/submit', {
  method: 'POST',
  body: formData
})
.then(response => response.text())
.then(data => console.log(data));
```

---

### 3. Get All Selections (JSON API)
**GET** `/api/selections`

Lấy danh sách tất cả những người đã chọn team, trả về JSON.

**Response**:
- Status: `200 OK`
- Content-Type: `application/json`

**Response Body**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "team": "team_a",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Trần Thị B",
      "team": "team_b",
      "created_at": "2024-01-15T10:35:15.000Z"
    },
    {
      "id": 3,
      "name": "Lê Văn C",
      "team": "team_a",
      "created_at": "2024-01-15T10:40:30.000Z"
    }
  ]
}
```

**Error Response (500)**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Example with cURL**:
```bash
curl http://localhost:3000/api/selections
```

**Example with JavaScript (Fetch)**:
```javascript
fetch('http://localhost:3000/api/selections')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log(data.data);
    } else {
      console.error(data.error);
    }
  });
```

**Example with cURL (Pretty JSON)**:
```bash
curl http://localhost:3000/api/selections | jq
```

---

## Team Codes

Available teams:

| Code | Name |
|------|------|
| `team_a` | Team A |
| `team_b` | Team B |
| `team_c` | Team C |
| `team_d` | Team D |

---

## Validation Rules

### Name Field
- ✅ Bắt buộc (không được để trống)
- ✅ Độ dài: 1-100 ký tự
- ✅ Bất kỳ ký tự nào (khoảng trắng, số, chữ, ký hiệu)

### Team Field
- ✅ Bắt buộc (phải chọn một team)
- ✅ Phải là một trong: `team_a`, `team_b`, `team_c`, `team_d`
- ✅ Nếu team đã có 2 người, không thể chọn

### Selection Rules
- ✅ Mỗi team chỉ nhận tối đa **2 người**
- ✅ Kiểm tra trên server (không chỉ client)
- ✅ Một người chỉ có thể chọn một lần (không cấm chọn cùng team 2 lần)

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Yêu cầu thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 500 | Internal Server Error - Lỗi server |

---

## Rate Limiting

Hiện tại không có rate limiting. Nếu cần, có thể thêm middleware như `express-rate-limit`.

---

## CORS

Hiện tại CORS chưa được cấu hình. Nếu cần dùng API từ domain khác, thêm:

```javascript
const cors = require('cors');
app.use(cors());
```

---

## Query Parameters

Hiện tại không có query parameters nào được hỗ trợ. Tất cả dữ liệu được truyền qua body (POST).

---

## Database Schema

**Bảng**: `team_selections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL | Primary Key |
| `name` | VARCHAR(255) | Tên người dùng |
| `team` | VARCHAR(50) | Mã team |
| `created_at` | TIMESTAMP | Thời gian tạo (mặc định hiện tại) |

---

## Examples

### JavaScript - Gửi form
```javascript
const name = 'Nguyễn Văn A';
const team = 'team_a';

const formData = new FormData();
formData.append('name', name);
formData.append('team', team);

const response = await fetch('/submit', {
  method: 'POST',
  body: formData
});

const html = await response.text();
console.log(html);
```

### JavaScript - Lấy danh sách
```javascript
const response = await fetch('/api/selections');
const json = await response.json();

if (json.success) {
  json.data.forEach(selection => {
    console.log(`${selection.name} chọn ${selection.team}`);
  });
}
```

### Python - Gửi form
```python
import requests

url = 'http://localhost:3000/submit'
data = {
    'name': 'Nguyễn Văn A',
    'team': 'team_a'
}

response = requests.post(url, data=data)
print(response.text)
```

### Python - Lấy danh sách
```python
import requests

url = 'http://localhost:3000/api/selections'
response = requests.get(url)
data = response.json()

if data['success']:
    for selection in data['data']:
        print(f"{selection['name']} - {selection['team']}")
```
