# OrderFlow Admin Panel

A professional, production-ready admin panel for Customer Order Management system built with Next.js 15, TypeScript, and Firebase.

## Features

### 🔐 Authentication
- Google Sign-In with Firebase Authentication
- Protected routes with middleware
- User session management

### 📊 Admin Dashboard
- **Real-time Statistics**: Total revenue, orders, pending, and shipped items
- **Order Management**: Complete order tracking and management
- **Advanced Filtering**: Search by customer, product, or order ID
- **Status Management**: Filter orders by status (pending, shipped, delivered)

### 📤 Data Export
- **Excel Export**: Download filtered orders as Excel (.xlsx) files
- **Comprehensive Data**: Includes customer details, products, quantities, and totals

### 📱 Progressive Web App
- **PWA Support**: Installable on desktop and mobile devices
- **Offline Capabilities**: Service worker for caching
- **Responsive Design**: Optimized for all screen sizes

### 🎨 Design & UX
- **Modern UI**: Built with shadcn/ui components
- **Micro-interactions**: Smooth transitions and hover effects
- **Color Scheme**: Professional indigo and amber gradient theme
- **Dark/Light Mode**: Theme support ready

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Authentication**: Firebase Auth with Google Provider
- **Database**: Firestore (ready for integration)
- **PWA**: next-pwa with service worker
- **Icons**: Lucide React
- **Export**: xlsx library for Excel generation

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel dashboard
│   ├── login/          # Authentication page
│   ├── layout.tsx      # Root layout with PWA metadata
│   └── page.tsx        # Home page (redirects based on auth)
├── lib/
│   └── firebase.ts     # Firebase configuration
├── components/ui/      # shadcn/ui components
└── middleware.ts       # Route protection
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- Google Firebase project (optional, for production)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase (optional for demo):
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication with Google provider
   - Create Firestore database
   - Update `src/lib/firebase.ts` with your config

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## 🧪 Testing the Application

### Quick Demo Login (No Firebase Required)
1. Visit http://localhost:3000
2. Click "Show Quick Login (Demo)" button
3. Enter any email address (e.g., `admin@example.com`)
4. Click "Quick Login (Demo)"
5. You'll be redirected to the admin panel with full functionality

### Google Sign-In (Firebase Required)
1. Set up Firebase configuration in `src/lib/firebase.ts`
2. Click "Continue with Google"
3. Complete the Google authentication flow
4. Access the admin panel

## Usage

### Admin Access
1. Visit the application URL
2. Use either:
   - **Demo Login**: Click "Show Quick Login (Demo)" and enter any email
   - **Google Sign-In**: Click "Continue with Google" (requires Firebase setup)
3. You'll be redirected to the admin panel

### Managing Orders
- **View Orders**: All orders are displayed in the main table
- **Search**: Use the search bar to find specific orders
- **Filter**: Filter by order status using the dropdown
- **Export**: Click "Export Excel" to download filtered data

### Demo Features
- **Mock Data**: Pre-populated with sample orders, users, and products
- **Full Functionality**: All features work without Firebase setup
- **Statistics**: Real-time calculation of revenue, orders, and status counts
- **Export**: Download filtered orders as Excel files

### Data Model

#### Users Collection
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
}
```

#### Products Collection
```typescript
{
  id: string,        // Document ID
  name: string,
  imageUrl: string,
  price: number
}
```

#### Orders Collection
```typescript
{
  id: string,           // Document ID
  userId: string,
  productId: string,
  quantity: number,
  status: 'pending' | 'shipped' | 'delivered',
  createdAt: Timestamp
}
```

## Production Deployment

### Build
```bash
npm run build
```

### Environment Variables
Create `.env.local` with:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Features in Detail

### PWA Capabilities
- Service worker for offline functionality
- Web App Manifest for installability
- Responsive design for mobile devices
- Custom app icons and splash screens

### Security
- Route protection with Next.js middleware
- Firebase Authentication integration
- Session management with localStorage
- Admin access control (configurable ADMIN_UID)

### Performance
- Next.js 15 with App Router
- Optimized bundle size
- Lazy loading of components
- Efficient data fetching patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**OrderFlow Admin** - Professional Order Management Made Simple 🚀