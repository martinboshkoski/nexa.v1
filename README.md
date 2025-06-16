# Nexa - AI-Powered Business Document Generator

Nexa is an intelligent business document generation platform designed specifically for small businesses and legal professionals. The platform combines AI technology with professional document templates to streamline business operations.

## 🚀 Features

- **Smart Document Generation**: AI-powered document creation with customizable templates
- **Multi-language Support**: Full bilingual support (English/Macedonian)
- **User Management**: Secure authentication and profile management
- **Company Profiles**: Complete business profile management
- **Document Categories**: 
  - Employment contracts and agreements
  - Health & Safety policies
  - Personal data protection documents
  - Labour law compliance documents
- **Real-time Preview**: Live document preview during creation
- **Step-by-step Forms**: Intuitive multi-step form interface
- **Professional Templates**: Industry-standard document formats

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **CSS Modules** - Scoped styling
- **i18next** - Internationalization

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Passport.js** - Authentication
- **JWT** - Token-based authentication
- **Docx** - Document generation

## 📁 Project Structure

```
nexa-bilingual/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS modules
│   │   └── i18n/          # Internationalization
│   └── public/            # Static assets
└── server/                # Node.js backend
    ├── controllers/       # Request handlers
    ├── models/           # Database models
    ├── routes/           # API routes
    ├── middleware/       # Custom middleware
    ├── services/         # Business logic
    ├── document_templates/ # Document templates
    └── config/           # Configuration files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NexaTerminal/nexa.v1.git
cd nexa.v1
```

2. Install dependencies:

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
npm install
```

3. Environment Setup:

Create `.env` files in both client and server directories with your configuration.

**Server `.env`:**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5002
```

**Client `.env`:**
```env
REACT_APP_API_URL=http://localhost:5002/api
```

4. Start the development servers:

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5002`.

## 📝 Document Types

### Employment Documents
- Annex Employment Agreement
- Annual Leave Decision
- Confirmation of Employment

### Health & Safety
- Workplace Health & Safety Policy
- Workplace Harassment Policy

### Personal Data Protection
- Consent for Personal Data Processing
- Privacy Policy

## 🔐 Authentication

The platform uses JWT-based authentication with support for:
- Username/email login
- Secure password hashing
- Profile completion tracking
- Company verification system

## 🌐 Deployment

### Frontend (Vercel)
- Connect your GitHub repository to Vercel
- Configure build settings for React
- Set environment variables

### Backend (Render)
- Deploy the server directory to Render
- Configure MongoDB connection
- Set production environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **NexaTerminal** - Development Team

## 📞 Support

For support and questions, please contact the development team.

---

Built with ❤️ for small businesses and legal professionals.
