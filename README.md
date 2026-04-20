# Aghaz Ecommerce - Server (Backend API)

Express.js REST API for the Aghaz dropshipping ecommerce platform.

## Tech Stack

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **Cloudinary** for media storage
- **bcrypt** for password hashing
- **express-validator** for input validation

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aghaz
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

### 3. Create initial admin user
Use MongoDB Compass or mongosh to insert the first admin:
```javascript
db.users.insertOne({
  email: "admin@aghaz.com",
  password: "$2b$10$...",  // Hash with bcrypt
  role: "admin",
  createdAt: new Date()
})
```

Or use a script like this:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your-password', 10);
// Insert with hash
```

### 4. Run the server
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/admin/login` | Public | Admin login |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | List products (paginated) |
| GET | `/api/products/:slug` | Public | Get product by slug |
| GET | `/api/products/id/:id` | Public | Get product by ID |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

**Query params for GET /api/products:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category ID
- `search` - Search in title/description
- `sort` - Sort: `latest`, `price_asc`, `price_desc`, `name`
- `featured` - Filter featured products (`true`)

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | List active categories |
| GET | `/api/categories/all` | Admin | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Public | Create order |
| GET | `/api/orders` | Admin | List orders (paginated) |
| GET | `/api/orders/:id` | Admin | Get order detail |
| PUT | `/api/orders/:id` | Admin | Update order status |
| GET | `/api/orders/stats` | Admin | Dashboard statistics |

**Query params for GET /api/orders:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status
- `startDate` - Filter by date range start
- `endDate` - Filter by date range end
- `search` - Search by customer name/phone

**Order statuses:** `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

### Upload
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/upload/image` | Admin | Upload single image |
| POST | `/api/upload/images` | Admin | Upload multiple images |
| DELETE | `/api/upload/:fileId` | Admin | Delete image from ImageKit |

## Project Structure

```
server/
├── src/
│   ├── config/          # Database, ImageKit, constants
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Route definitions
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error handling, validation
│   ├── utils/           # Helper functions
│   └── app.js           # Express app setup
└── server.js            # Entry point
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Helmet security headers
- CORS with specific origins
- Input validation and sanitization
- Centralized error handling

## Deployment

For Vercel serverless deployment, you'll need to adapt the entry point. Alternatively, deploy to:
- **Render** - Connect repo, set env vars, deploy
- **Railway** - One-click deploy with MongoDB
- **DigitalOcean App Platform**
- **Heroku**

Make sure to set all `.env` variables in your hosting dashboard.
