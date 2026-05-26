# MilkMaatu - Farmer's Dairy Platform

A modern, production-ready React frontend for a comprehensive dairy farming solution.

## Features

✨ **Complete Feature Set:**
- 🔐 Secure login with phone & password authentication
- 🏠 Home dashboard with quick action buttons
- 🌾 Buy Feeds marketplace with cart management
- 🐄 Sante cattle buying and selling platform
- 📊 Advanced search and filtering
- 📱 Fully responsive mobile-first design
- 🎨 Modern UI with yellow & white theme
- ✅ Form validation and error handling
- 🔔 Toast notifications
- 💾 LocalStorage persistence

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool (Fast bundling & HMR)
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Styling & responsive design
- **Lucide React** - Modern icons
- **Functional Components & Hooks** - Modern React patterns

## Project Structure

```
src/
├── assets/              # Images, icons, etc.
├── components/          # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Header.jsx
│   ├── ToastContainer.jsx
│   └── index.js
├── pages/              # Page components
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   ├── BuyFeedsPage.jsx
│   ├── OrderSummaryPage.jsx
│   ├── SanteSelectorPage.jsx
│   ├── SanteActionPage.jsx
│   ├── SanteBuyPage.jsx
│   ├── SanteSellPage.jsx
│   └── index.js
├── routes/             # Routing configuration
│   └── index.js
├── services/           # API/Business logic
│   ├── authService.js
│   ├── dataService.js
│   └── toastService.js
├── data/               # Dummy data
│   └── dummyData.js
├── styles/             # Global CSS
│   └── index.css
├── App.jsx             # Root component
└── main.jsx            # Entry point

Configuration Files:
- package.json          # Dependencies & scripts
- vite.config.js        # Vite configuration
- tailwind.config.js    # Tailwind configuration
- postcss.config.js     # PostCSS configuration
- index.html            # HTML template
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The app will open at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Demo Credentials

For testing the login functionality:
- **Phone:** +919876543210
- **Password:** demo123

## Features Explained

### 1. Login Page
- Phone number validation
- Password authentication
- Centered card UI with yellow branding
- Demo credentials for testing

### 2. Home Page
- Welcome message with branding
- Two main action cards (Buy Feeds, Sante)
- Upcoming features section (6 disabled placeholders)
- Statistics section

### 3. Buy Feeds
- Grid of feed products with images
- Price display and quantity selector
- Cart management with +/- buttons
- Checkout with order summary modal
- Customer information form
- Order confirmation with toast notification

### 4. Sante Module
- Sante selection (KRS Sante, Thendekere Sante)
- Buy/Sell action buttons
- Coverage information (40 KM range)

### 5. Sante Buy Page
- Search functionality
- Price range filter
- Cattle post cards with:
  - Animal image
  - Price and age
  - Milk capacity
  - Village name
  - Contact button
  - Description
- Auto-delete after 24 hours notice

### 6. Sante Sell Page
- Image upload with preview
- Form for cattle details:
  - Animal name
  - Age and price
  - Milk capacity
  - Contact number
  - Village name
  - Description
- Form validation
- LocalStorage persistence

## Key Components

### Button Component
Reusable button with variants:
- primary (Yellow)
- secondary (White with border)
- outline
- danger
- ghost

Sizes: sm, md, lg, xl

### Card Component
Flexible card wrapper with:
- Shadow options
- Hover effects
- Customizable padding
- Border radius

### Input Component
Form input with:
- Label support
- Error messages
- Validation states
- Disabled states
- Required field indicator

### Toast Notification
Auto-dismiss notifications:
- Success (Green)
- Error (Red)
- Info (Blue)
- Auto-close after 3 seconds

## Services

### authService
- `login(phone, password)` - Authenticate user
- `logout()` - Clear session
- `isAuthenticated()` - Check auth status
- `getUser()` - Get current user
- `getToken()` - Get auth token

### dataService
- `orderService.createOrder()` - Create new order
- `orderService.getOrders()` - Fetch orders
- `cattleService.createPost()` - Create cattle listing
- `cattleService.getPosts()` - Fetch listings
- `cattleService.searchPosts()` - Search listings

### toastService
- `show(message, type, duration)` - Show notification
- `success(message)` - Success toast
- `error(message)` - Error toast
- `info(message)` - Info toast

## Styling

### Color Scheme
- **Primary:** #FCD34D (Yellow)
- **Primary Dark:** #FBBF24
- **Primary Light:** #FEF3C7
- **Text Dark:** #1F2937
- **Text Light:** #6B7280
- **Background:** #F9FAFB

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg
- Flexible grid layouts
- Touch-friendly buttons

## Animations

- Fade-in effects
- Slide-up transitions
- Hover animations
- Smooth color transitions
- Loading states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- User profile management
- Order tracking
- Real-time notifications
- Payment gateway integration
- Review and rating system
- Advanced analytics dashboard
- Farmer community features

## Contributing

This is a frontend template. Feel free to customize and extend it for your needs.

## License

MIT License - Feel free to use this project for commercial purposes.

## Support

For issues or questions, please refer to the component documentation or service files.

---

Built with ❤️ for farmers
