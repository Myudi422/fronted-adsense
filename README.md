# AdSense Dashboard Frontend

A modern Next.js frontend application for managing multiple AdSense accounts with real-time earnings analytics.

## 🚀 Features

- **Multi-Account Management**: Switch between multiple AdSense accounts with dropdown selector
- **Real-time Earnings**: View today's earnings with comprehensive metrics
- **Domain Analytics**: Detailed breakdown of earnings by domain/subdomain
- **Responsive Design**: Fully responsive dashboard that works on all devices
- **TypeScript**: Full type safety and better development experience
- **Modern UI**: Built with Tailwind CSS for a clean, professional interface

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Hooks** - Modern state management

## 📋 Prerequisites

- Node.js 18+ installed
- Backend API server running on `localhost:8000`
- AdSense accounts configured in the backend

## 🏃‍♂️ Getting Started

1. **Clone and navigate to the project:**
   ```bash
   cd fronend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard homepage
│   ├── today-earnings/    # Today earnings page
│   ├── domain-analytics/  # Domain analytics page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── AccountSelector.tsx
│   └── DashboardLayout.tsx
├── lib/                   # Utilities
│   └── api.ts            # API client
└── types/                 # TypeScript types
    └── adsense.ts        # AdSense data types
```

## 🎨 Pages

### Dashboard (`/`)
- Overview of selected account
- Today's earnings summary
- Quick action cards
- Account status information

### Today Earnings (`/today-earnings`)
- Detailed earnings metrics
- Date filtering (today, yesterday, custom)
- CTR and CPM calculations
- Account information display

### Domain Analytics (`/domain-analytics`)
- Earnings breakdown by domain
- Domain filtering capabilities
- Sortable table view
- Summary statistics

## 🔧 Configuration

### API Integration
The frontend connects to the backend API at `localhost:8000`. API endpoints are configured in `src/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
});
```

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🎯 Key Components

### AccountSelector
- Dropdown for selecting AdSense accounts
- Shows account status (active/inactive)
- Displays account metadata

### DashboardLayout
- Sidebar navigation
- Mobile-responsive menu
- Account selector integration
- Page content wrapper

## 📊 Data Flow

1. **Account Loading**: Fetches available accounts from `/api/accounts`
2. **Account Selection**: User selects account from dropdown
3. **Data Fetching**: Loads earnings data for selected account
4. **Real-time Updates**: Refreshes data when account or filters change

## 🎨 Styling

The project uses Tailwind CSS with custom color palette:

- **Primary**: Blue tones for main actions
- **Success**: Green for earnings and positive metrics
- **Warning**: Yellow for alerts and notifications
- **Danger**: Red for errors and critical status

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Structure

- **Components**: Use functional components with hooks
- **State Management**: React hooks (useState, useEffect)
- **API Calls**: Async/await with proper error handling
- **Type Safety**: Full TypeScript coverage

## 🚀 Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm run start
   ```

3. **Deploy to your platform:**
   - Vercel (recommended for Next.js)
   - Netlify
   - Railway
   - Self-hosted

## 🔗 API Integration

The frontend integrates with these backend endpoints:

- `GET /api/accounts` - List all accounts
- `GET /api/accounts/{key}` - Get specific account
- `GET /api/today-earnings/{key}` - Today's earnings
- `GET /api/domain-earnings/{key}` - Domain breakdown
- `GET /api/accounts/{key}/connect` - Account connection

## 🎯 Future Enhancements

- [ ] Charts and data visualization
- [ ] Historical earnings trends
- [ ] Export functionality
- [ ] Email notifications
- [ ] Dark mode support
- [ ] Multi-language support

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend server is running on `localhost:8000`
   - Check CORS settings in backend

2. **Account Not Loading**
   - Verify account credentials in backend
   - Check AdSense API permissions

3. **Build Errors**
   - Run `npm install` to ensure dependencies
   - Check TypeScript errors with `npm run lint`

## 📄 License

This project is part of the AdSense Dashboard system.