# Lucky Draw Application

A modern and interactive lucky draw application built with React and Tailwind CSS. Perfect for events, giveaways, or any situation where you need to randomly select winners from a list of participants.

## Features

- 🎯 Random selection with animation effects
- 📤 CSV file upload support
- 🎨 Beautiful UI with smooth animations
- 🎆 Celebration effects for winners
- 📱 Responsive design
- 🔄 Reset and reuse functionality

## Getting Started

### Installation

```bash
npm install
# or
yarn install
```

### Running the Application

```bash
npm run dev
# or
yarn dev
```

The application will start at `http://localhost:5173`

## Usage Instructions

### 1. Loading Participants

There are two ways to load participants:
- **Upload CSV File**: Click the upload button and select a CSV file with your participants' names
- **Manual Entry**: Type names directly into the text input and press Enter

### 2. Running the Lucky Draw

1. Once participants are loaded, they will appear in the right sidebar
2. Click the "Start" button to begin the animation
3. Click "Stop" to select a winner
4. A celebration animation will play and display the winner

### 3. Customizing the Title

To change the title of the application:

1. Open `src/App.tsx`
2. Locate the following section (around line 25):
   ```tsx
   <h1 className="text-4xl font-bold text-white mb-8">
     Lucky Draw
   </h1>
   ```
3. Replace "Lucky Draw" with your desired title

### 4. Additional Settings

- **Reset**: Click the reset button to clear all participants and start over
- **Previous Winners**: The application keeps track of previous winners to avoid duplicates
- **Animation Speed**: The selection animation automatically adjusts based on the number of participants

## Development

This project uses:
- React 18+
- Vite
- Tailwind CSS
- TypeScript
- Radix UI Components

## License

© 2025 林協霆. All rights reserved.
