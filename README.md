# 🎮 Ollama's Adventure

A fun and addictive browser-based endless runner game where you help Ollama the alpaca jump over cacti and obstacles across beautiful, dynamically changing stages!

## 🕹️ Play Now

**[Play Ollama's Adventure](https://st-1989.github.io/ollama_adventure_to_github_pages/)**

Visit the live game hosted on GitHub Pages and start your adventure!

## ✨ Features

- 🦙 **Lovable Alpaca Character** - Help Ollama navigate through challenging terrain
- 🌄 **Dynamic Stages** - Progress through multiple themed stages with unique visuals:
  - Pasture Plains - Easy-going starting area
  - Sunset Sands - Medium difficulty with golden hues
  - Starfall Ridge - High-speed challenges under starry skies
  - And more challenging stages!
- 🎯 **Various Obstacles** - Dodge cacti, rolling logs, flying birds, and tide fish
- ⚡ **Power-ups** - Collect berries to activate shields
- 📊 **Score Tracking** - Beat your high score and compete with friends
- 🎨 **Beautiful Parallax Backgrounds** - Immersive multi-layer scrolling environments
- 🎵 **Sound Effects** - Audio feedback powered by Tone.js
- 📱 **Mobile Friendly** - Responsive design that works on desktop and mobile devices
- 💾 **Save Feature** - Track and save your game progress
- 🔗 **Share Your Score** - Share your best runs with friends

## 🎮 How to Play

- **Desktop**: Press `SPACE` to jump
- **Mobile**: Tap the screen to jump
- **Goal**: Avoid obstacles and survive as long as possible
- **Tip**: Collect berries for temporary shield protection
- **Strategy**: Time your jumps carefully as the game speeds up!

## 🚀 Quick Start

### Play Online
Simply visit the [live game](https://st-1989.github.io/ollama_adventure_to_github_pages/) to start playing immediately!

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/st-1989/ollama_adventure_to_github_pages.git
   cd ollama_adventure_to_github_pages
   ```

2. Start a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000 --directory ollamas-adventure/client
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   
   # Or using Node.js (if you have http-server installed)
   npx http-server ollamas-adventure/client -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

Alternatively, you can open `ollamas-adventure/client/index.html` directly in your browser (though some features may require a web server).

## 📁 Project Structure

```
ollama_adventure_to_github_pages/
├── index.html                    # Main landing page (Japanese)
├── README.md                     # This file
├── Makefile                      # Build/deployment helpers
├── ollamas-adventure/
│   ├── client/                   # Game client files
│   │   ├── index.html           # Game entry point
│   │   ├── css/
│   │   │   └── style.css        # Game styles
│   │   └── js/
│   │       ├── main.js          # Core game logic
│   │       ├── player.js        # Player/Alpaca mechanics
│   │       ├── obstacle.js      # Obstacle generation
│   │       └── stages.js        # Stage configurations
│   └── server/                   # Backend utilities (optional)
│       ├── server.js            # Node.js server
│       └── database.js          # Database adapter
└── save/
    └── save.html                # Save data management page
```

## 🛠️ Technologies Used

- **HTML5 Canvas** - For game rendering
- **JavaScript (ES6+)** - Game logic and mechanics
- **Tailwind CSS** - UI styling
- **Tone.js** - Audio synthesis and sound effects
- **GitHub Pages** - Hosting and deployment
- **Node.js** (optional) - Backend server for leaderboards

## 🎨 Game Mechanics

### Stages
The game features progressive difficulty through stages:
- Each stage has unique visual themes and color filters
- Speed gradually increases within each stage
- New obstacle types are introduced as you progress
- Stages unlock at specific score thresholds

### Obstacles
- **Cactus** - Classic ground obstacle
- **Rolling Log** - Moving ground hazard
- **Sky Bird** - Flying obstacle requiring precise timing
- **Tide Fish** - Water-based challenge

### Power-ups
- **Berries** - Provide temporary shield protection
- Shield duration: 5.5 seconds
- Visual indicators show shield status (active/warning/broken)

## 🎯 Development

### Game Configuration
Game parameters are defined in `ollamas-adventure/client/js/main.js`:
- Stage thresholds and speeds
- Obstacle spawn intervals
- Parallax settings
- Visual filters and effects

### Adding New Stages
Stages are configured in the `STAGES` array with properties:
- `name` - Stage display name
- `threshold` - Score required to unlock
- `baseSpeed` / `maxSpeed` - Speed range
- `obstacleTypes` - Available obstacles
- `berryChance` - Power-up spawn rate
- `parallax` - Background scroll speeds
- `filters` - Visual effects (hue, saturation)

## 📜 License

This project is open source and available for educational and personal use.

## 🙏 Credits

Created with ❤️ by the Ollama's Adventure team

- Game Design & Development
- Pixel Art & Animation
- Sound Design with Tone.js
- Hosted on GitHub Pages

## 🤝 Contributing

Feel free to fork this repository and submit pull requests for improvements!

### Ideas for Contributions
- New obstacle types
- Additional stages and themes
- Power-up varieties
- Improved mobile controls
- Leaderboard integration
- Achievements system

## 📧 Contact

For questions or feedback, please open an issue on the [GitHub repository](https://github.com/st-1989/ollama_adventure_to_github_pages/issues).

---

⭐ If you enjoy the game, consider giving this repository a star!
