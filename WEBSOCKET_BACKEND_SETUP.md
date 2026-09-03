# Museum Ticket Booking System - WebSocket Real-Time Backend

## 🚀 Project Structure

```
backend/
├── src/main/java/com/museum/ticketbooking/
│   ├── config/
│   │   └── WebSocketConfig.java          ✅ WebSocket configuration
│   ├── controller/
│   │   ├── ChatbotControllerNew.java     ✅ Chatbot endpoints + WebSocket
│   │   ├── BookingControllerNew.java     ✅ Booking creation
│   │   ├── TicketControllerNew.java      ✅ Ticket validation
│   │   └── AdminControllerNew.java       ✅ Admin dashboard
│   ├── model/
│   │   ├── Museum.java                   ✅ Museum entity
│   │   ├── Booking.java                  ✅ Booking entity
│   │   ├── Ticket.java                   ✅ Ticket entity
│   │   └── Show.java                     ✅ Show entity
│   ├── repository/
│   │   ├── BookingRepositoryNew.java     ✅ Booking queries
│   │   ├── TicketRepositoryNew.java      ✅ Ticket queries
│   │   ├── ShowRepositoryNew.java        ✅ Show queries
│   │   └── MuseumRepository.java         ✅ Museum queries
│   ├── service/
│   │   ├── BookingServiceNew.java        ✅ Booking business logic
│   │   ├── TicketServiceNew.java         ✅ Ticket validation logic
│   │   └── AdminServiceNew.java          ✅ Admin operations
│   ├── websocket/
│   │   └── UpdatePublisher.java          ✅ Real-time updates
│   └── TicketBookingApplication.java     ✅ Main app
├── src/main/resources/
│   ├── application.properties             ✅ Configuration
│   └── db-init.sql                        ✅ Database initialization
└── pom.xml                                ✅ Maven dependencies
```

## 📋 Prerequisites

- **Java 17+**
- **PostgreSQL 12+**
- **Maven 3.8+**
- **Node.js 16+** (for frontend)

## 🔧 Setup Instructions

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb museum_booking

# Run initialization script
psql -U postgres -d museum_booking -f backend/src/main/resources/db-init.sql

# Verify tables created
psql -U postgres -d museum_booking -c "\dt"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Update application.properties with your database credentials
# File: src/main/resources/application.properties
# Update:
#   spring.datasource.url=jdbc:postgresql://localhost:5432/museum_booking
#   spring.datasource.username=postgres
#   spring.datasource.password=YOUR_PASSWORD

# Build project
mvn clean install

# Run application
mvn spring-boot:run
```

**Backend running on**: `http://localhost:9090`

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

**Frontend running on**: `http://localhost:5173`

## 🔌 WebSocket Endpoints

### Subscribe to Real-Time Updates

```javascript
// Client-side JavaScript (Browser)
const stompClient = new StompJs.Client({
    brokerURL: 'ws://localhost:9090/ws'
});

stompClient.onConnect = () => {
    // Subscribe to all updates
    stompClient.subscribe('/topic/updates', (message) => {
        console.log('Update:', message.body);
    });
    
    // Subscribe to museum updates
    stompClient.subscribe('/topic/museum-updates', (message) => {
        console.log('Museum:', message.body);
    });
    
    // Subscribe to booking updates
    stompClient.subscribe('/topic/booking-updates', (message) => {
        console.log('Booking:', message.body);
    });
    
    // Subscribe to ticket updates
    stompClient.subscribe('/topic/ticket-updates', (message) => {
        console.log('Ticket:', message.body);
    });
};

stompClient.activate();
```

## 🌐 REST API Endpoints

### Chatbot API
```
GET  /api/chatbot/info              - Get museum information
GET  /api/chatbot/shows             - Get all shows
GET  /api/chatbot/available-shows   - Get available shows
WS   /app/chat                      - WebSocket chat endpoint
```

### Booking API
```
POST /api/booking/create?email=user@example.com&count=2  - Create booking
GET  /api/booking/test                                    - Test endpoint
```

### Ticket API
```
POST /api/ticket/validate?ticketId=1&code=1234  - Validate ticket
GET  /api/ticket/test                           - Test endpoint
```

### Admin API
```
GET  /api/admin/museum               - Get museum details
PUT  /api/admin/museum               - Update museum
POST /api/admin/shows                - Add new show
GET  /api/admin/shows                - Get all shows
GET  /api/admin/status               - Get museum status
DELETE /api/admin/shows/{id}         - Delete show
```

## 📊 Database Schema

### Museums Table
```sql
- id (Primary Key)
- name
- ticket_price
- total_seats
- available_seats
- booking_open (Boolean)
- museum_code (4-digit)
- museum_id
- created_at
- updated_at
```

### Bookings Table
```sql
- id (Primary Key)
- email
- total_amount
- status (SUCCESS, PENDING, CANCELLED)
- ticket_count
- created_at
- updated_at
```

### Tickets Table
```sql
- id (Primary Key)
- status (ACTIVE, USED, CANCELLED)
- ticket_number (Unique)
- booking_id (Foreign Key)
- created_at
- used_at
```

### Shows Table
```sql
- id (Primary Key)
- name
- date
- available (Boolean)
- capacity
- created_at
```

## 🧪 Testing the System

### 1. Test Booking Creation
```bash
curl -X POST "http://localhost:9090/api/booking/create?email=test@example.com&count=2"
```

### 2. Test Ticket Validation
```bash
# First, create a booking and get a ticket ID
curl -X POST "http://localhost:9090/api/ticket/validate?ticketId=1&code=1234"
```

### 3. Test Museum Info
```bash
curl "http://localhost:9090/api/chatbot/info"
```

### 4. Test Shows
```bash
curl "http://localhost:9090/api/chatbot/shows"
```

### 5. Test Real-Time Updates
- Open browser console
- Connect to WebSocket (see example above)
- Create a booking or update museum info
- Check console for real-time messages

## 🔄 Real-Time Update Flow

1. **User creates booking** → POST `/api/booking/create`
2. **BookingService** → Publishes "New booking created"
3. **UpdatePublisher** → Sends to `/topic/booking-updates`
4. **WebSocket Clients** → Receive update instantly

## ⚙️ Configuration Files

### application.properties
```properties
server.port=9090
spring.datasource.url=jdbc:postgresql://localhost:5432/museum_booking
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
```

## 🚨 Troubleshooting

### Issue: WebSocket connection fails
**Solution**: Ensure WebSocket endpoint is registered in WebSocketConfig.java

### Issue: Database connection refused
**Solution**: 
1. Check PostgreSQL is running
2. Verify credentials in application.properties
3. Ensure database exists: `createdb museum_booking`

### Issue: Port 9090 already in use
**Solution**: 
```bash
# Change port in application.properties
server.port=8080
```

### Issue: Maven build fails
**Solution**:
```bash
# Clear Maven cache
mvn clean
# Rebuild
mvn clean install
```

## 📝 Key Features Implemented

✅ Real-time WebSocket communication  
✅ Booking creation with database persistence  
✅ Ticket validation with 4-digit museum code  
✅ Automatic seat availability updates  
✅ Show management  
✅ RESTful API endpoints  
✅ Proper error handling and logging  
✅ Transaction management  
✅ CORS enabled for frontend integration  
✅ Database initialization script  

## 🔐 Security Considerations

- Input validation on all endpoints
- Museum 4-digit code for ticket validation
- Email verification for bookings
- Database constraints for data integrity
- CORS properly configured
- SQL injection prevention via JPA

## 📱 Frontend Integration

Frontend should connect to:
- **WebSocket**: `ws://localhost:9090/ws`
- **REST API**: `http://localhost:9090/api`

Example React hook for WebSocket:
```javascript
useEffect(() => {
    const stompClient = new StompJs.Client({
        brokerURL: 'ws://localhost:9090/ws'
    });
    
    stompClient.onConnect = () => {
        stompClient.subscribe('/topic/updates', (msg) => {
            console.log(msg.body);
            // Update React state here
        });
    };
    
    stompClient.activate();
    return () => stompClient.deactivate();
}, []);
```

## 📞 Support

For issues or questions:
1. Check logs: `tail -f target/spring.log`
2. Verify database: `psql -U postgres -d museum_booking -c "SELECT * FROM museums;"`
3. Check endpoints: `curl http://localhost:9090/api/chatbot/info`

## ✅ Verification Checklist

- [ ] PostgreSQL database created
- [ ] db-init.sql executed successfully
- [ ] Maven build successful (no errors)
- [ ] Backend running on port 9090
- [ ] Frontend running on port 5173
- [ ] WebSocket connection works
- [ ] Booking API creates records
- [ ] Ticket validation works
- [ ] Real-time updates publish correctly

---

**System is production-ready for real-time museum ticket booking!**
