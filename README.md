# CalendarInbox Pro

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**CalendarInbox Pro** is a production-ready, AI-powered calendar and inbox manager designed for commercial business use. It seamlessly integrates email management with intelligent calendar scheduling, leveraging AI to automate and optimize your workflow.

## 🌟 Features

### Core Features
- **📅 Smart Calendar Management**: Windows Calendar-inspired interface with drag-and-drop event management
- **📧 Unified Inbox**: Manage multiple email accounts from Gmail, Outlook, and other providers in one place
- **🤖 AI Integration**: 
  - Automatic email categorization and prioritization
  - AI-powered email reply generation
  - Smart meeting time suggestions
  - Event extraction from emails
  - Email summarization
- **🔐 Enterprise Security**: JWT authentication, password encryption, rate limiting, and SQL injection protection
- **🔄 Real-time Sync**: Automatic email synchronization with duplicate detection
- **📊 Email Analytics**: Track unread, starred, and priority emails
- **🎨 Modern UI**: Clean, professional interface optimized for productivity
- **📱 Responsive Design**: Works seamlessly on Windows and Mac

### Email Features
- Multiple email account support (Gmail, Outlook, IMAP/SMTP)
- AI-powered email categorization
- Smart search with semantic understanding
- Draft management
- Email templates
- Attachment handling
- Thread organization

### Calendar Features
- Month/week/day views
- Recurring events support
- Color-coded categories
- Meeting URL integration
- Location management
- Attendee tracking
- AI-suggested optimal meeting times

### AI Assistant
- Natural language processing
- Email composition assistance
- Calendar scheduling help
- Task prioritization
- Meeting summary generation

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or bun package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/zodiesel21011-cmd/calendarinbox.git
cd calendarinbox
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secure-secret-key-here

# OpenAI API (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Email Provider Configuration
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
```

4. **Start the application**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

5. **Access the application**
- Frontend: http://localhost:3002
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📚 Documentation

### Project Structure
```
calendarinbox/
├── server/                 # Backend server
│   ├── database/          # Database schema and queries
│   ├── routes/            # API routes
│   ├── services/          # Business logic (email, AI)
│   ├── middleware/        # Authentication and validation
│   └── index.ts           # Server entry point
├── src/                   # Frontend application
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth)
│   ├── services/          # API client
│   └── main.tsx           # Frontend entry point
├── data/                  # SQLite database (auto-created)
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

### API Documentation

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Events
- `GET /api/events` - Get events (with date range)
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/ai-suggest-time` - AI meeting time suggestions

#### Emails
- `GET /api/emails` - Get emails (with folder filter)
- `GET /api/emails/stats` - Get email statistics
- `GET /api/emails/:id` - Get specific email
- `POST /api/emails/send` - Send email
- `POST /api/emails/search` - Search emails
- `POST /api/emails/:id/ai-reply` - Generate AI reply
- `POST /api/emails/:id/ai-analyze` - Analyze email with AI
- `PUT /api/emails/:id/folder` - Move email to folder

#### Email Accounts
- `GET /api/accounts` - Get email accounts
- `POST /api/accounts` - Add email account
- `DELETE /api/accounts/:id` - Remove email account

### Database Schema

The application uses SQLite for data storage with the following tables:
- `users` - User accounts
- `email_accounts` - Connected email accounts
- `emails` - Email messages
- `events` - Calendar events
- `email_drafts` - Email drafts
- `ai_suggestions` - AI-generated suggestions
- `activity_log` - Audit trail

## 🔒 Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Secure token storage

2. **API Security**
   - Rate limiting (100 requests per 15 minutes)
   - Helmet.js for HTTP headers
   - CORS configuration
   - Input validation
   - SQL injection prevention

3. **Data Protection**
   - Encrypted password storage
   - Secure OAuth2 token handling
   - Environment variable protection

## 🔧 Configuration

### Email Provider Setup

#### Gmail
1. Enable Gmail API in Google Cloud Console
2. Create OAuth2 credentials
3. Add credentials to `.env`

#### Outlook/Microsoft
1. Register app in Azure Portal
2. Configure Microsoft Graph API
3. Add credentials to `.env`

#### IMAP/SMTP (Generic)
```env
IMAP_HOST=imap.example.com
IMAP_PORT=993
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

### AI Configuration
1. Get OpenAI API key from https://platform.openai.com
2. Add to `.env`:
```env
OPENAI_API_KEY=sk-...
```

## 📦 Production Deployment

### Building for Production
```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Start production server
NODE_ENV=production npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<strong-random-secret>
DATABASE_PATH=/var/data/calendar.db
FRONTEND_URL=https://yourdomain.com
```

### Deployment Checklist
- [ ] Change JWT_SECRET to a strong random value
- [ ] Configure production database path
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Set up rate limiting for production load
- [ ] Review and update CORS settings
- [ ] Enable production error tracking

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server (frontend + backend)
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for code formatting

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Node.js
- UI components styled with Tailwind CSS
- Icons from Lucide React
- AI powered by OpenAI
- Database: SQLite with better-sqlite3

## 📞 Support

For support, email support@calendarinbox.pro or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Microsoft Teams integration
- [ ] Slack integration
- [ ] Advanced calendar features (recurring events, reminders)
- [ ] Email templates library
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] Export/import functionality
- [ ] Dark mode
- [ ] Internationalization (i18n)

## ⚡ Performance

- Optimized database queries with prepared statements
- Indexed database columns for fast lookups
- Efficient React rendering with proper memoization
- Lazy loading for large email lists
- Caching strategies for frequently accessed data

## 🔍 Known Issues

See [Issues](https://github.com/zodiesel21011-cmd/calendarinbox/issues) on GitHub.

## 📊 System Requirements

### Minimum
- 2 CPU cores
- 2 GB RAM
- 1 GB disk space

### Recommended
- 4+ CPU cores
- 4+ GB RAM
- 10+ GB disk space (for email storage)

---

**Built with ❤️ for professional productivity**
