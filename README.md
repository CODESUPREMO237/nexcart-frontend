# 🛍️ NexCart Frontend

Modern, AI-powered e-commerce platform frontend built with Next.js 16.

## 🌟 Features

- **Modern UI** - Beautiful, responsive design with Tailwind CSS + shadcn/ui
- **Server Components** - Next.js 16 App Router with RSC
- **Real-time Cart** - Instant cart updates with Zustand state management
- **Authentication** - JWT + OAuth (Google, Discord, Microsoft)
- **AI Recommendations** - Personalized product suggestions
- **Image Optimization** - Next.js Image component + Cloudinary
- **Dark Mode** - System-aware theme switching
- **Mobile First** - Fully responsive design
- **SEO Optimized** - Meta tags, Open Graph, structured data
- **Type Safe** - JavaScript with JSDoc (TypeScript-ready)

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Image Storage:** Cloudinary
- **Deployment:** Vercel

## 📋 Prerequisites

- Node.js 18.17+ or 20+
- npm, yarn, or pnpm
- Backend API running (see backend README)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/nexcart-frontend.git
cd nexcart-frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
```

Required environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (shop)/            # Shop routes (products, cart, etc)
│   ├── admin/             # Admin dashboard
│   └── layout.jsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── providers.jsx      # Context providers
├── lib/
│   ├── api.js             # API client
│   └── utils/             # Utility functions
├── store/
│   ├── authStore.js       # Auth state
│   └── cartStore.js       # Cart state
└── styles/
    └── globals.css        # Global styles
```

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com):

- Button, Input, Card, Badge
- Dialog, Sheet, Tabs
- Toast notifications
- Skeleton loading
- And more...

## 🔌 API Integration

The frontend communicates with the Django backend via REST API:

```javascript
import api from '@/lib/api'

// Example: Get products
const products = await api.getProducts()

// Example: Add to cart
await api.addToCart(productId, quantity)
```

## 🎯 Key Features

### Authentication

- Email/password registration and login
- Social OAuth (Google, Discord, Microsoft)
- JWT token management with auto-refresh
- Protected routes

### Shopping Experience

- Product browsing with search and filters
- AI-powered recommendations
- Shopping cart with real-time updates
- Wishlist functionality
- Product reviews and ratings
- Order history

### Admin Panel

- Product management (CRUD)
- Order management
- User management
- Store settings

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy!

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_name
```

## 🧪 Testing

```bash
# Run tests (when configured)
npm test

# Lint
npm run lint

# Type check (if using TypeScript)
npm run type-check
```

## 📱 Mobile Access

The app is fully responsive and works great on mobile devices.

For local development with mobile:
1. Update `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://YOUR_PC_IP:8000/api
   ```
2. Access from phone: `http://YOUR_PC_IP:3000`

See [backend/MOBILE_ACCESS_GUIDE.md](../backend/MOBILE_ACCESS_GUIDE.md) for details.

## ⚡ Performance

- Optimized images with Next.js Image
- Code splitting and lazy loading
- Static page generation where possible
- Efficient state management
- Minimal bundle size

## 🎨 Customization

### Theme

Edit `tailwind.config.js` to customize colors, fonts, etc.

### Components

All UI components are in `src/components/ui/` and can be customized.

### Layouts

Main layouts are in `src/components/layout/`:
- `Navbar.jsx` - Top navigation
- `Footer.jsx` - Footer section

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Backend API Docs](../backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 🐛 Common Issues

### "Network Error" when calling API

**Solution:** 
- Check backend is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in backend

### Images not loading

**Solution:**
- Verify Cloudinary configuration
- Check image URLs in product data

### Build fails

**Solution:**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Your Name - [@your_twitter](https://twitter.com/your_twitter)

## 🙏 Acknowledgments

- Next.js team
- shadcn for amazing UI components
- Vercel for hosting
- The open-source community

---

**Need help?** Open an issue or contact us at support@nexcart.com

**Live Demo:** https://your-app.vercel.app

## Architecture
See [docs/architecture.md](docs/architecture.md) for clean architecture layers, folder structure, testing strategy, and Docker guidance.


## Clean Architecture Overview
This project is organized into clear layers so domain logic remains independent from framework and delivery concerns.

### Layers
- Domain
- Application
- Infrastructure
- Interfaces

### Folder Structure
See [docs/architecture.md](docs/architecture.md) for the structure and responsibilities of each layer.

### Quality
- Linting configured for code quality checks.
- Unit and integration tests scaffolded under 	ests/unit and 	ests/integration.
- Dockerfile included for reproducible runtime.

