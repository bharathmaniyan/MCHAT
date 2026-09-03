# 🎫 Frontend Setup Guide - Museum Ticket Booking System

## ✅ Files Created/Updated

### Components
- ✅ `src/components/Chatbot.jsx` - Main chatbot interface
- ✅ `src/components/BookingFlow.jsx` - Booking process component
- ✅ `src/components/TicketHistory.jsx` - Ticket validation component

### Admin
- ✅ `src/admin/Dashboard.jsx` - Admin dashboard for museum management

### Services
- ✅ `src/services/api.js` - Axios API client configured for port 9090
- ✅ `src/services/socket.js` - WebSocket STOMP client for real-time updates

### Entry Points
- ✅ `src/App.jsx` - Main application component
- ✅ `src/main.jsx` - React entry point
- ✅ `src/index.css` - Comprehensive styles with gradient theme

### Configuration
- ✅ `package.json` - Updated with sockjs-client and stompjs
- ✅ `vite.config.js` - Updated with port 9090 proxy and WebSocket support
- ✅ `index.html` - HTML entry point with Razorpay script

---

## 🚀 Quick Start

### **Step 1: Install Dependencies**
```bash
cd c:\ticket-booking\frontend
npm install
```

This will install:
- React 18.2.0
- Axios (HTTP client)
- SockJS & StompJS (WebSocket)
- Vite (build tool)
- Tailwind CSS
- And more...

### **Step 2: Start Frontend Dev Server**
```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### **Step 3: Make Sure Backend is Running**
```bash
cd c:\ticket-booking\backend
mvn spring-boot:run
```

Backend should be running on: **http://localhost:9090**

### **Step 4: Database Initialization**
```bash
# If not already done:
psql -U postgres -d museum_booking -f backend/src/main/resources/db-init.sql
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Chatbot.jsx          # Chat interface & menu
│   │   ├── BookingFlow.jsx       # Booking form
│   │   └── TicketHistory.jsx     # Ticket validation
│   │
│   ├── admin/
│   │   └── Dashboard.jsx         # Admin control panel
│   │
│   ├── services/
│   │   ├── api.js                # Axios instance (port 9090)
│   │   └── socket.js             # WebSocket STOMP client
│   │
│   ├── App.jsx                   # Main app wrapper
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles
│
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies
└── node_modules/                 # Installed packages
```

---

## 🎨 UI Components Explained

### **Chatbot.jsx**
- **Purpose**: Main user interface for museum visitors
- **Features**:
  - View museum prices
  - Check museum timings
  - Get contact info
  - Book tickets
  - View available shows
  - Validate tickets
- **Real-time**: Connected to WebSocket for live updates

### **BookingFlow.jsx**
- **Purpose**: Handle ticket booking process
- **Input Fields**:
  - Number of tickets (spinner)
  - Email address
  - Auto-calculates total price
- **Validation**: Checks for valid email and ticket count
- **Integration**: POST request to `/api/booking/create`

### **TicketHistory.jsx**
- **Purpose**: Validate tickets using staff PIN
- **Input Fields**:
  - Ticket ID
  - 4-digit museum code
- **Validation**: Submits ticket validation request
- **Integration**: POST request to `/api/ticket/validate`

### **Dashboard.jsx** (Admin)
- **Purpose**: Manage museum settings and view real-time data
- **Controls**:
  - View/Edit ticket price
  - View available seats
  - Manage total seats
  - Open/Close bookings
  - Display museum code
- **Real-time**: Auto-updates when changes occur in other sessions

---

## 🔌 API Endpoints Integrated

### **Base URL**: `http://localhost:9090/api`

| Component | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| Chatbot | GET | `/chatbot/info` | Get museum info |
| Chatbot | GET | `/chatbot/shows` | Get all shows |
| Booking | POST | `/booking/create` | Create booking |
| Ticket | POST | `/ticket/validate` | Validate ticket |
| Admin | GET | `/admin/museum` | Get museum details |
| Admin | PUT | `/admin/museum` | Update museum |

---

## 🔌 WebSocket Integration

### **Connection**
```javascript
// In socket.js
const socket = new SockJS("http://localhost:9090/ws");
stompClient = Stomp.over(socket);
```

### **Subscriptions**
```javascript
// Real-time updates from backend
stompClient.subscribe("/topic/updates", callback);
```

### **What Gets Updated in Real-Time**
1. **Museum Information** - Seat count, status changes
2. **Booking Confirmations** - New bookings created
3. **Ticket Status** - Ticket validations
4. **Dashboard Metrics** - Live statistics

---

## 🎨 Styling System

### **Color Scheme**
- **Primary Gradient**: `#6c63ff` → `#4facfe` (Blue Purple)
- **Background**: Gradient background on body
- **Cards**: White with shadow effect
- **Text**: Dark on white cards, light on gradients

### **Key CSS Classes**
| Class | Purpose |
|-------|---------|
| `.navbar` | Top navigation with gradient |
| `.chatbox` | Main chat interface styling |
| `.dashboard` | Admin panel styling |
| `.card` | Highlighted information boxes |
| `.form-group` | Form field containers |
| `button` | Styled action buttons |
| `.stats` | Statistics display |
| `.show-item` | Individual show listing |

### **Responsive Design**
- **Desktop** (>768px): Side-by-side layout
- **Mobile** (<768px): Stacked layout
- Button sizes adjust automatically
- Input fields scale responsively

---

## 🔄 Data Flow

### **Booking Flow**
```
User clicks "Book Ticket"
    ↓
BookingFlow component opens
    ↓
User enters email & ticket count
    ↓
User clicks "Pay & Book"
    ↓
POST to /api/booking/create
    ↓
Backend creates booking & tickets
    ↓
WebSocket broadcasts booking-update
    ↓
All connected clients get notification
    ↓
Dashboard shows updated seat count
```

### **Ticket Validation Flow**
```
Museum staff clicks "History"
    ↓
TicketHistory component opens
    ↓
Staff enters Ticket ID & 4-digit code
    ↓
User clicks "Submit"
    ↓
POST to /api/ticket/validate
    ↓
Backend validates using museum code
    ↓
Returns "Valid", "Invalid", or "Already Used"
    ↓
WebSocket broadcasts ticket-update
    ↓
Other terminals see the validation
```

---

## 🛠️ Development Features

### **Hot Module Replacement**
- Changes to components auto-reload
- State persists during reload
- No browser refresh needed

### **Error Handling**
- Try-catch blocks on all API calls
- User-friendly error messages
- Console logging for debugging

### **Loading States**
- `loading` state prevents double-clicks
- Buttons show "Processing..." during requests
- Disabled state prevents interaction while loading

---

## 📊 Form Fields Validation

### **BookingFlow**
```javascript
// Client-side validation
- Email required
- Ticket count must be ≥ 1
- Shows total price dynamically
```

### **TicketHistory**
```javascript
// Client-side validation
- Ticket ID required
- Code required (4 digits)
- Shows result message below form
```

### **Dashboard**
```javascript
// Client-side validation
- All fields optional (no required validation)
- Numeric inputs for seat counts
- Dropdown select for booking status
```

---

## 🚀 Build for Production

### **Step 1: Build**
```bash
npm run build
```

This creates an optimized `dist/` folder

### **Step 2: Preview Build**
```bash
npm run preview
```

This runs the production build locally for testing

### **Step 3: Deploy**
Copy the `dist/` folder to your web server (Nginx, Apache, etc.)

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5173 already in use | Change port in vite.config.js |
| Backend not connecting | Verify backend runs on 9090 |
| WebSocket fails | Check WebSocketConfig.java is present |
| Styles not loading | Clear cache: `npm install && npm run dev` |
| npm install fails | Delete node_modules and package-lock.json, then reinstall |
| CORS errors | Check vite.config.js proxy settings |

---

## 📝 Dependencies Reference

### **Core**
- `react@18.2.0` - UI library
- `react-dom@18.2.0` - DOM rendering
- `axios@1.6.0` - HTTP requests

### **WebSocket**
- `sockjs-client@1.6.1` - WebSocket fallback
- `stompjs@2.3.3` - STOMP protocol

### **UI/Build**
- `vite@5.0.0` - Build tool
- `tailwindcss@3.3.5` - Utility CSS
- `react-router-dom@6.20.0` - Routing (optional)
- `qrcode.react@3.1.0` - QR code generation

---

## ✨ Features Implemented

✅ **Chatbot Interface** - Browse museum info and shows
✅ **Booking System** - Create bookings with email
✅ **Ticket Validation** - Validate using 4-digit code
✅ **Admin Dashboard** - Manage museum settings
✅ **Real-time Updates** - WebSocket integration
✅ **Responsive Design** - Works on mobile & desktop
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Prevent double submissions
✅ **Gradient Theme** - Modern blue-purple design
✅ **Auto-reconnect** - WebSocket auto-reconnects

---

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Start frontend**: `npm run dev`
3. **Start backend**: `mvn spring-boot:run` (in another terminal)
4. **Test the app**: Open http://localhost:5173
5. **Make a test booking**: Use the chatbot interface
6. **Validate a ticket**: Use admin PIN

---

## 📞 Support

**Frontend runs on**: http://localhost:5173
**Backend API**: http://localhost:9090/api
**WebSocket endpoint**: ws://localhost:9090/ws
**Database**: PostgreSQL on localhost:5432

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-03-26
**Version**: 1.0.0

