# Property Voice Chatbot

A modern React-based voice chatbot application designed for property-related inquiries and assistance. Built with Vite for optimal development experience and performance.

## 🚀 Features

- **Voice Interaction**: Natural voice-based conversations for property inquiries
- **AI-Powered Responses**: Intelligent chatbot responses using OpenRouter API
- **Modern UI**: Built with React and optimized for user experience
- **Fast Development**: Powered by Vite with Hot Module Replacement (HMR)
- **Code Quality**: ESLint configuration for consistent code standards

## 🛠️ Tech Stack

- **Frontend**: React 18+ with Vite
- **Build Tool**: [Vite](https://vitejs.dev/) with HMR support
- **AI Service**: [OpenRouter API](https://openrouter.ai/) for chatbot functionality
- **Code Quality**: ESLint with recommended rules
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- An [OpenRouter](https://openrouter.ai/) account and API key

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/iamdarzee/property_voice_chatbot.git
cd property-voice-chatbot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Key
1. Sign up for an account at [OpenRouter](https://openrouter.ai/)
2. Generate your API key from the dashboard
3. Open `services/openrouterService.js`
4. Add your API key to the configuration:
   ```javascript
   const API_KEY = 'API KEY';
   ```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## ⚙️ Configuration

### Vite Plugins
This project uses official Vite plugins for React:

- **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)** - Uses [Babel](https://babeljs.io/) for Fast Refresh
- **[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)** - Uses [SWC](https://swc.rs/) for Fast Refresh (alternative)

### ESLint Configuration
The project includes ESLint rules for code quality. For production applications, we recommend:
- Integrating TypeScript with the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)
- Enabling type-aware lint rules with [`typescript-eslint`](https://typescript-eslint.io)

## 🔑 Environment Variables

For security, consider using environment variables for your API keys:


1. Add your API key:
   ```
   VITE_OPENROUTER_API_KEY=API KEY
   ```


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
- Check the [Issues](../../issues) section
- Review the [OpenRouter Documentation](https://openrouter.ai/docs)
- Consult the [Vite Documentation](https://vitejs.dev/guide/)

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) for the amazing build tool
- [OpenRouter](https://openrouter.ai/) for AI API services
- [React](https://reactjs.org/) for the UI framework
