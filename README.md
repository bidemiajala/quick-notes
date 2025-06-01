# Quick Notes 📝

Hey there! Welcome to my Quick Notes Chrome extension. I built this because I was tired of losing my random thoughts and quick ideas throughout the day. You know that feeling when you have a brilliant idea but nowhere convenient to jot it down? Yeah, that's what this solves.

## What Makes This Special

I've packed quite a few handy features into this little extension:

- **Lightning fast note creation** - One click and you're typing
- **Smart organization** - Your notes show up as tabs, just like browser tabs
- **Never lose your thoughts** - Everything auto-saves as you type (no more "did I save that?" moments)
- **Oops button** - Accidentally deleted something? You've got 30 seconds to undo it
- **Your notes, everywhere** - Syncs across all your Chrome browsers
- **Dark mode lover?** - Toggle between light and dark themes
- **Keyboard warrior friendly** - Ctrl+N for new notes, Ctrl+F to search
- **Right-click magic** - Select text on any page, right-click, and boom - it's a note
- **Find anything fast** - Search through all your notes instantly
- **Import/export ready** - Back up your brain dumps

## Getting Started

Want to try it out? Here's how:

### For Developers (The Fun Way)

First, grab the code:
```bash
git clone <this-repo>
cd quick-notes-extension
```

Install the goodies:
```bash
npm install
```

### Building Your Own Copy

Want to see your changes in action?
```bash
npm run build
```

This creates a `dist` folder with everything Chrome needs.

### Loading Into Chrome

1. Open Chrome and head to `chrome://extensions`
2. Flip on "Developer mode" (toggle in the top-right)
3. Click "Load unpacked" 
4. Point it to your `dist` folder
5. Profit! 🎉

## Development Mode

If you're tinkering with the code:
```bash
npm start
```

This fires up webpack in watch mode, so your changes rebuild automatically.

## Testing

I've written some tests because bugs are annoying:
```bash
npm test
```

These are Playwright tests that actually load the extension in Chrome and click around like a real person would.

## What's Under the Hood

- **React** - Because I love components
- **Webpack** - Bundles everything nicely
- **Manifest V3** - Google's latest extension format
- **Playwright** - For testing the real deal
- **Chrome Storage API** - Keeps your notes safe

## The File Layout

```
├── src/
│   ├── popup/          # The main React app
│   └── ...other stuff
├── dist/               # Built extension (after npm run build)
├── e2e/                # Tests that actually work
├── images/             # Icons and such
└── webpack.config.js   # Build magic happens here
```

## Contributing

Found a bug? Have an idea? I'm all ears! Feel free to:
- Open an issue
- Send a pull request  
- Tell me what's broken

## Why I Built This

Honestly? I was using sticky notes on my desktop and it was chaos. Then I tried other note apps but they were either too complicated or required signing up for yet another service. I just wanted something simple that lived in my browser and didn't get in my way.

So I built exactly what I wanted to use. Turns out other people like it too! 

## License

MIT - Use it, change it, make it yours. Just don't blame me if your laptop crashes (it won't lol).

---

*Made with ☕ and probably too much procrastination*