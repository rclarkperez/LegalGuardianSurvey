# GuardianForm

A modern React TypeScript web application for form submission with PDF document generation.

## Features

- ✨ **React 18 + TypeScript** - Type-safe React development
- 📝 **Form Validation** - Built-in form validation with react-hook-form
- 📄 **PDF Generation** - Generate fillable PDF documents from form submissions using pdf-lib
- 🎨 **Responsive Design** - Beautiful UI that works on all devices
- ⚡ **Vite Build Tool** - Lightning-fast build and development server
- 🔧 **Easy to Customize** - Modular component structure

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd GuardianForm
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application runs at `http://localhost:3000` with the included Vite configuration.

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
GuardianForm/
├── src/
│   ├── components/       # React components
│   ├── styles/          # Component styles
│   ├── utils/           # Utility functions (PDF generation, validation)
│   ├── App.tsx          # Main App component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static files
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run the TypeScript compiler without emitting files
- `npm run lint` - Run ESLint
- `npm test` - Run type checking and linting
- `npm run preview` - Preview production build

## Technologies Used

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **react-hook-form** - Form state management
- **pdf-lib** - Fillable PDF generation
- **CSS3** - Styling

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your needs.

## Support

For issues and questions, please open an issue in the repository.
