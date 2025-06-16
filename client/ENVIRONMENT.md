# Environment Configuration Guide

This project uses environment variables to switch between local development and production deployment.

## Quick Setup

### For Local Development

1. **Automatic Setup** (Recommended):
   ```bash
   cd client
   ./switch-env.sh
   # Choose option 1 for local development
   ```

2. **Manual Setup**:
   ```bash
   cd client
   cp .env.example .env.local
   # Edit .env.local to set REACT_APP_API_URL=http://localhost:5002/api
   ```

### Environment Files Explained

- **`.env.local`** - Your personal local configuration (ignored by git)
- **`.env.development`** - Default development settings (localhost)
- **`.env.production`** - Production settings (used by Vercel)
- **`.env.example`** - Template file showing available options

## Environment Priority

React loads environment files in this order (higher priority overrides lower):
1. `.env.local` (highest priority - your personal settings)
2. `.env.development` (when NODE_ENV=development)
3. `.env.production` (when NODE_ENV=production)

## API Endpoints

- **Local Development**: `http://localhost:5002/api`
- **Production**: `https://nexa-v1.onrender.com/api`

## Safety Features

✅ **Safe for Production**: 
- `.env.local` is ignored by git and won't be uploaded
- Production always uses `.env.production` settings
- No risk of accidentally deploying with localhost URLs

✅ **Easy Switching**:
- Use `./switch-env.sh` script for quick environment switching
- No need to edit multiple files

## Usage

### Starting Development
```bash
cd client
npm start
# Will use .env.local if it exists, otherwise .env.development
```

### Before Pushing to GitHub
No special action needed! Your local `.env.local` file is automatically ignored and won't be uploaded.

### Testing Against Production Backend Locally
```bash
cd client
./switch-env.sh
# Choose option 2 to test against production backend
npm start
```

## Troubleshooting

If you see API calls going to the wrong URL:
1. Check your `.env.local` file
2. Restart your development server (`npm start`)
3. Clear browser cache if needed
