# 🎨 The Coloring Bliss - E-Commerce Store

A full-stack e-commerce web application for selling notebooks, planners, and notepads. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

![The Coloring Bliss](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18.x-blue) ![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

---

## 🌐 Live Demo

| | URL |
|--|-----|
| 🛒 **Store** | [https://the-coloring-bliss-front-end.vercel.app](https://the-coloring-bliss-front-end.vercel.app) |
| 🔧 **API** | [https://thecoloringblissapi.onrender.com/api](https://thecoloringblissapi.onrender.com/api) |

---

## 🔐 Test Accounts

### Administrator Account
| | |
|--|--|
| 📧 **Email** | `administrator@gmail.com` |
| 🔑 **Password** | `administrator123` |
| 🔗 **Admin Panel** | `/admin` |

### Customer Account
You can also register a new account to test the customer experience.

---

## ✨ Features

### 🛒 Customer Features
- Browse products by category
- Search and filter products
- Product details with image gallery
- Shopping cart functionality
- Wishlist
- User authentication (Register/Login)
- Checkout process
- Multiple payment methods:
  - 💵 Cash on Delivery (COD)
  - 📱 GCash
  - 📱 Maya
  - 💳 Credit/Debit Card
- Order tracking
- Order history
- User profile management
- Address management

### 👨‍💼 Admin Features
- Dashboard with analytics
- Product management (CRUD)
- Category management with subcategories
- Order management
- Customer management
- Image upload for products
- Inventory tracking

---

## 📁 Product Categories

```
├── 📅 Planners
│   ├── Weekly Planner
│   ├── Daily Planner
│   ├── Monthly Planner
│   └── Yearly Planner
│
├── 📝 Notepads
│   ├── Tearable Notes
│   ├── Sticky Notes
│   └── Loose Notes
│
└── 📓 Notebooks
    ├── Writing Notebook - Grade 1 and 2
    ├── Writing Notebook - Grade 3
    ├── Composition Notebook
    └── Notebook Inserts
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| React Router v6 | Navigation |
| Axios | API Requests |
| React Hot Toast | Notifications |
| Lucide React | Icons |
| CSS3 | Styling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Bcrypt.js | Password Hashing |
| Multer | File Uploads |
| PayMongo | Payment Gateway |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend Hosting |
| Render | Backend Hosting |
| MongoDB Atlas | Database Hosting |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
# Clone backend
git clone https://github.com/ksahirani/TheColoringBlissAPI.git
cd TheColoringBlissAPI

# Clone frontend (in a separate folder)
git clone https://github.com/ksahirani/TheColoringBlissFrontend.git
cd TheColoringBlissFrontend
```


## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:slug` | Get product by slug |
| GET | `/api/products/featured` | Get featured products |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category (Admin) |
| PUT | `/api/categories/:id` | Update category (Admin) |
| DELETE | `/api/categories/:id` | Delete category (Admin) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user cart |
| POST | `/api/cart` | Add to cart |
| PUT | `/api/cart/:itemId` | Update cart item |
| DELETE | `/api/cart/:itemId` | Remove from cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id` | Update order (Admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-checkout` | Create payment session |
| POST | `/api/payments/cod` | Cash on Delivery order |

---

## 💳 Test Payments

### PayMongo Test Mode

**Test Credit Card:**
- For Credit or Debit cards not available

**GCash / Maya:**
- Auto-approves in test mode

**Cash on Delivery:**
- Works immediately, no payment needed

---

## 📸 Screenshots

### Home Page
- Hero section with featured products
- Category showcase
- New arrivals section

### Shop Page
- Product grid with filters
- Search functionality
- Category sidebar

### Product Detail
- Image gallery
- Product information
- Add to cart

### Admin Dashboard
- Sales analytics
- Recent orders
- Quick stats

---

## 📝 License

This project is for educational purposes.

---

## 👨‍💻 Developer

**Kenon Sahirani**

- GitHub: [@ksahirani](https://github.com/ksahirani)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [PayMongo](https://www.paymongo.com/)
- [Vercel](https://vercel.com/)
- [Render](https://render.com/)

---

## 📞 Support

If you encounter any issues, please open an issue on GitHub or contact the developer.

---

⭐ **Star this repo if you found it helpful!** ⭐