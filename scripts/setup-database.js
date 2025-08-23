#!/usr/bin/env node

/**
 * Database Setup Script for ReBath PWA
 * 
 * This script helps set up the Supabase database with the initial schema.
 * 
 * Prerequisites:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key
 * 3. Set up environment variables in .env.local
 * 
 * Usage:
 * 1. Copy the SQL from supabase/migrations/001_initial_schema.sql
 * 2. Run it in your Supabase SQL editor
 * 3. Or use the Supabase CLI: supabase db push
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 ReBath PWA Database Setup')
console.log('================================')

console.log('\n📋 Setup Instructions:')
console.log('1. Create a Supabase project at https://supabase.com')
console.log('2. Go to your project dashboard')
console.log('3. Navigate to SQL Editor')
console.log('4. Copy and paste the SQL from supabase/migrations/001_initial_schema.sql')
console.log('5. Run the SQL to create all tables and sample data')
console.log('6. Update your .env.local file with your Supabase credentials')

console.log('\n📁 Environment Variables Needed:')
console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key')

console.log('\n🔧 Authentication Setup:')
console.log('1. Go to Authentication > Settings in your Supabase dashboard')
console.log('2. Enable Email authentication')
console.log('3. Configure email templates if needed')
console.log('4. Create a demo user or use the sign-up form in the app')

console.log('\n📊 Sample Data:')
console.log('The migration script includes:')
console.log('- 8 fixture categories (Faucets, Sinks, Toilets, etc.)')
console.log('- 8 sample fixture options with pricing')
console.log('- Row Level Security policies for data protection')

console.log('\n✅ Next Steps:')
console.log('1. Run the SQL migration in Supabase')
console.log('2. Update your .env.local file')
console.log('3. Start the development server: npm run dev')
console.log('4. Test the authentication and data flow')

console.log('\n📖 For more information, see the README.md file')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  Warning: .env.local file not found')
  console.log('Create .env.local with your Supabase credentials')
  
  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret

# File Storage
SUPABASE_STORAGE_BUCKET=project-photos
SUPABASE_STORAGE_URL=your_storage_url

# External APIs
SENTRY_DSN=your_sentry_dsn
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application Settings
NEXT_PUBLIC_APP_NAME=ReBath PWA
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_LOCATION_TRACKING=true

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
`
  
  console.log('\n📝 Create .env.local with this template:')
  console.log(envTemplate)
}

console.log('\n🎉 Setup complete! Happy coding!')
