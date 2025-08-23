# ReBath PWA - Bath Remodeling Field Application

A comprehensive Progressive Web App (PWA) designed for bath remodeling companies to manage field assessments, project tracking, and client communication. Built with Next.js, TypeScript, and Supabase.

## 🏗️ Architecture Overview

This application follows a layered architecture pattern:

- **Client (Next.js PWA)** - Renders screens, form validation, offline drafts, calls BFF/RPCs
- **Service Layer / BFF (Next.js API routes)** - Orchestrates multi-step operations, hides secrets, enforces business rules
- **Domain RPCs (typed queries/functions)** - Thin, typed calls from BFF/client into Postgres routines
- **Domain Logic (Postgres functions/triggers)** - Totals/pricing/invariants close to data for consistency
- **Persistence (Postgres)** - Schema, constraints, indexes, and RLS as primary authorization gate
- **Files (Supabase Storage)** - Private buckets for photos/docs exposed via short-lived signed URLs
- **Auth (Supabase Auth/SSO)** - User identity/sessions wired to RLS policies and row ownership
- **Background/Integrations (Supabase Edge Functions)** - Webhooks, scheduled jobs, and near-DB tasks
- **Offline Engine (Service Worker + IndexedDB)** - Caches assets/data and queues writes for later sync
- **Observability (Sentry + logs/metrics)** - Error tracking, traces, and performance monitoring

## ✨ Features

### 🏠 Field Assessment
- **Comprehensive Fixture Assessment**: Evaluate faucets, sinks, toilets, showers, bathtubs, vanities, mirrors, lighting, flooring, and walls
- **Condition Tracking**: Rate fixtures as Good, Fair, Poor, or Needs Replacement
- **Photo Documentation**: Capture and store fixture photos with offline capability
- **Measurement Recording**: Document room dimensions, window/door sizes, and ceiling heights
- **Client Requirements**: Track specific requests and preferences

### 💰 Pricing & Quotes
- **Real-time Calculator**: Calculate project costs based on fixture selections and labor
- **Brand Integration**: Access to preferred brand catalogs and pricing
- **Discount Management**: Apply company discounts and promotions
- **Quote Generation**: Create professional quotes with itemized breakdowns

### 📅 Project Management
- **Timeline Estimation**: Generate realistic project timelines
- **Progress Tracking**: Monitor project status and completion percentages
- **Client Communication**: Built-in messaging and status updates
- **Resource Allocation**: Assign team members and track availability

### 📱 PWA Capabilities
- **Offline Functionality**: Work without internet connection
- **Mobile-First Design**: Optimized for field use on mobile devices
- **Push Notifications**: Real-time updates and alerts
- **App-like Experience**: Install as native app on mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rebath-pwa.git
   cd rebath-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run database migrations (see Database Setup section)
   - Configure storage buckets for photos
   - Set up authentication providers

### 🔐 Authentication Setup

1. **Enable Email Authentication**
   - Go to your Supabase Dashboard → Authentication → Settings
   - Enable "Email" provider
   - Configure email templates if needed

2. **Create Demo User (Optional)**
   - Use the sign-up form in the app
   - Or create manually in Supabase Dashboard → Authentication → Users

3. **Test Authentication**
   - Visit `/login` to test sign-up/sign-in
   - Try the demo login feature
   - Verify protected routes redirect to login

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🗄️ Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

### 2. Run Database Setup
```bash
# Run the setup script for instructions
npm run db:setup

# Or manually run the SQL migration
# Copy the contents of supabase/migrations/001_initial_schema.sql
# Paste it into your Supabase SQL Editor and run it
```

### 3. Alternative: Use Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 4. Generate Types
```bash
npm run db:generate
```

## 🔧 Backend Integration

The application now includes a complete backend integration with Supabase:

### Service Layer Architecture
- **AuthService**: Handles user authentication and profile management
- **ProjectService**: Manages project CRUD operations and statistics
- **AssessmentService**: Handles assessment data and offline sync
- **PricingService**: Manages quotes, fixtures, and pricing calculations

### Database Schema
The database includes the following tables:
- `profiles`: User profiles and roles
- `projects`: Project information and status
- `assessments`: Room assessments with fixtures and measurements
- `quotes`: Generated quotes with pricing details
- `fixture_categories`: Product categories
- `fixture_options`: Available fixtures with pricing
- `offline_drafts`: Offline data sync

### Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only access their own data
- Proper authentication is required
- Data is protected at the database level

### Offline Support
- Assessments can be saved offline and synced later
- Service worker caches essential data
- IndexedDB provides local storage fallback

## 📱 PWA Configuration

### Icons
Place your app icons in the `public/icons/` directory:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `apple-touch-icon.png`

### Manifest
The PWA manifest is configured in `public/manifest.json` with:
- App name and description
- Theme colors
- Display mode (standalone)
- App shortcuts
- Screenshots

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run db:setup     # Run database setup instructions
npm run db:generate  # Generate Supabase types
npm run db:push      # Push database changes
npm run db:reset     # Reset database (development only)
```

### Project Structure
```
rebath-pwa/
├── app/                    # Next.js app directory
│   ├── assessment/         # Assessment pages
│   ├── projects/          # Project management
│   ├── calculator/        # Pricing calculator
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── auth-provider.tsx # Authentication context
│   ├── protected-route.tsx # Route protection
│   └── providers.tsx     # App providers
├── lib/                  # Utility functions and services
│   ├── services/         # Service layer
│   │   ├── auth.service.ts
│   │   ├── project.service.ts
│   │   ├── assessment.service.ts
│   │   ├── pricing.service.ts
│   │   └── index.ts
│   ├── supabase/         # Supabase configuration
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils.ts          # Utility functions
├── scripts/              # Setup and utility scripts
│   └── setup-database.js # Database setup instructions
├── supabase/             # Database migrations
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/               # Static assets
│   ├── icons/           # PWA icons
│   └── manifest.json    # PWA manifest
└── env.example          # Environment variables template
```

### Key Components

#### Assessment Flow
- **Multi-step Forms**: Guided assessment process
- **Offline Storage**: Local storage for draft assessments
- **Photo Capture**: Camera integration for fixture documentation
- **Condition Tracking**: Standardized fixture evaluation

#### Pricing Calculator
- **Real-time Updates**: Instant price calculations
- **Brand Integration**: Access to manufacturer catalogs
- **Discount Management**: Flexible pricing rules
- **Quote Generation**: Professional quote creation

#### Project Management
- **Status Tracking**: Visual progress indicators
- **Timeline Management**: Project scheduling and milestones
- **Client Communication**: Built-in messaging system
- **Resource Allocation**: Team member assignment

## 🔒 Security

### Authentication
- Supabase Auth with email/password
- Social login providers (Google, Microsoft)
- Row Level Security (RLS) policies
- Session management

### Data Protection
- Encrypted data transmission
- Secure file storage with signed URLs
- Input validation and sanitization
- CSRF protection

## 📊 Monitoring & Analytics

### Error Tracking
- Sentry integration for error monitoring
- Performance tracking
- User session recording

### Analytics
- Page view tracking
- User interaction analytics
- Performance metrics
- Offline usage statistics

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Container-based deployment
- **AWS/GCP**: Custom infrastructure setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.rebath-pwa.com](https://docs.rebath-pwa.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/rebath-pwa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/rebath-pwa/discussions)
- **Email**: support@rebath-pwa.com

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic assessment forms
- ✅ Offline functionality
- ✅ PWA setup
- ✅ Basic pricing calculator
- ✅ Authentication system
- ✅ Backend integration with Supabase
- ✅ Service layer architecture
- ✅ Database schema and RLS policies

### Phase 2 (Next)
- 🔄 Advanced photo management
- 🔄 Real-time collaboration
- 🔄 Advanced pricing rules
- 🔄 Client portal
- 🔄 Offline sync improvements
- 🔄 Push notifications

### Phase 3 (Future)
- 📋 AI-powered assessments
- 📋 Advanced analytics
- 📋 Integration with accounting systems
- 📋 Mobile app stores
- 📋 Advanced reporting
- 📋 Multi-tenant support

---

Built with ❤️ for bath remodeling professionals
