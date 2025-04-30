# Aptly ✨  
A simple web app that uses Google's Gemini API to generate advice from Logical, Empathetic, and Strategic perspectives.

## 🚀 Tech Stack
- ⚛️ React (with Vite)
- 📘 TypeScript
- 🔥 Firebase Hosting
- 🤖 Gemini (Google AI)

---

## 🛠️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/your-username/aptly.git
cd aptly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file at the root of your project and add any required keys (e.g. Gemini API credentials, if applicable).

```env
# Example
VITE_GEMINI_API_KEY=your-key-here
```

### 4. Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🌐 Deployment

This project uses **Firebase Hosting**.

### Build for production:

```bash
npm run build
```

### Deploy:

```bash
firebase deploy
```

Make sure `dist/` is your public directory and that Firebase is configured for single-page apps.

---

## 📁 Project Structure

```txt
src/
  ├── components/      # Reusable UI elements
  ├── pages/           # Main page components like Home.tsx
  ├── gemini/          # Gemini API config and utility functions
  └── main.tsx         # App entry point
```

---

## 📸 Features
- Ask any question or scenario
- Get advice from multiple perspectives
- Clean and responsive UI
- Built for extensibility

---

## 👥 Participants
- Clement Kubica  
- Romir Mohan  
- Wenxin Zhang  
- Yicong Li

---

## 📄 License
MIT License — free to use and modify.

---

## 🤝 Contributions
Feel free to fork the repo and submit PRs!

---

## 🔗 Live Demo
[https://advice-app-701cd.web.app/](https://advice-app-701cd.web.app/)
