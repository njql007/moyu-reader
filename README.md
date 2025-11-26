# Moyu Reader (摸鱼神器)

A stealthy, feature-rich RSS reader designed for tech enthusiasts who want to stay updated without drawing attention. Built with React, Vite, and Tailwind CSS.

## Features

- **Stealth Design**: Dark mode interface that blends into developer environments (looks like an IDE or terminal).
- **Tech Focused**: Pre-configured with popular tech news sources:
  - CnBeta
  - IT Home (IT之家)
  - Landian (蓝点网)
  - iFanr (爱范儿)
  - SSPai (少数派)
  - The Verge
  - Hacker News
  - V2EX
- **Smart Reading**:
  - **Reader Mode**: Automatically extracts and formats full article content for distraction-free reading.
  - **Web View**: Built-in proxy-supported web view for original articles.
  - **Senior Mode**: Adjustable font sizes for better readability (or stealth).
- **Responsive**: Works great on desktop and mobile.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (icons)
- **State Management**: React Hooks
- **Data Fetching**: Custom RSS parser with CORS proxy support

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd moyu-reader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:3000`

## Configuration

The application uses a public CORS proxy by default to fetch RSS feeds from the client side. No backend configuration is strictly required for basic usage.

## License

MIT
