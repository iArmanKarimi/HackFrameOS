# HackFrameOS

Small dev notes for this project.

## Development

Run the Vite dev server:

```pwsh
npm run dev
```

The app entry HTML is at the project root `index.html` and the client entry is `src/main.tsx`.

## Build / Preview

```pwsh
npm run build
npm run serve
```

## Notes

- `public/` is available for static assets. If a duplicate `public/index.html` exists, the project uses the root `index.html` as the app entry.
- Types for `react-router-dom` are installed as a dev dependency (`@types/react-router-dom`).

# HackFrameOS

HackFrameOS is a React application built with TypeScript and styled using Tailwind CSS. This project serves as a template for building modern web applications with a focus on modularity and reusability.

## Features

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A superset of JavaScript that adds static types.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Vite**: A fast build tool that provides a smooth development experience.

## Project Structure

```
HackFrameOS
├── src
│   ├── main.tsx          # Entry point of the application
│   ├── App.tsx           # Main App component
│   ├── index.css         # Global CSS styles
│   ├── components        # Reusable components
│   │   └── ExampleComponent.tsx
│   ├── pages             # Application pages
│   │   └── Home.tsx
│   ├── hooks             # Custom hooks
│   │   └── useExample.ts
│   └── types             # Type definitions
│       └── index.d.ts
├── public
│   └── index.html        # Main HTML file
├── package.json          # NPM configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.cjs   # Tailwind CSS configuration
├── postcss.config.cjs    # PostCSS configuration
├── .gitignore            # Git ignore file
└── README.md             # Project documentation
```

## Getting Started

To get started with HackFrameOS, follow these steps:

1. **Clone the repository**:

   ```
   git clone <repository-url>
   cd HackFrameOS
   ```

2. **Install dependencies**:

   ```
   npm install
   ```

3. **Run the development server**:

   ```
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
