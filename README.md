# Telegram_Weather_bot

### Bot description

"My Telegram bot, WeatherWise, provides users with real-time weather updates by simply entering a city name. It displays the current temperature and weather conditions, offers a 3-day forecast with daily predictions, and provides clear, human-friendly explanations using Google Gemini — making weather information easy to understand and accessible for everyone."

---

## 🚀 Features

- 📍 Get current weather information by typing a city name
- 📆 Get a 3-day weather forecast for any city with predicted temperature and conditions
- 🌡️ Shows temperature and weather condition in a clean format
- 🤖 Uses Google Gemini AI to explain current weather or forecast in human-friendly language
- 💬 Simple and intuitive Telegram chat interface
- ⏱️ Real-time responses with quick and accurate weather updates

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Shambel96/Telegram_Weather-Bot.git
cd Telegram_Weather-Bot
```

### 2. Install dependencies

- npm install (node-telegram-bot-api dotenv openai but , first of all you have to initialize the node with " npm init -y " if you have not had already.)

### 3. Create BOT in Telegram use botFather

### 4. Create a .env file

- Create a .env file in the project root and add the following keys:

- TELEGRAM_BOT_TOKEN = your-telegram-bot-token
- WEATHER_API_KEY = your-openweathermap-api-key
- GEMINI_API_KEY = your-google-gemini-api-key

## 💡 How to Use it

Start your bot on Telegram (search for your bot username).

- Send the name of any city:

- Example: Paris

- The bot will reply with:

### 💡 Explanation:

- The current temperature in Paris is 13.49°C with broken clouds.

- Optional: An explanation using Google Gemini if users want

### for 3 day forecast

- If the user enters /forecast followed by a city name,
  the bot will respond with a 3-day weather forecast for that city,
  including the predicted temperature and conditions for each date.

- Optionally, the bot also provides an AI-generated explanation if the user requests it (there is an inline button show Explain it).

### Generally if the user enter incorrect city name

- The bot will respond with: City not found. Please try again.

### Live demo link: https://www.awesomescreenshot.com/video/42044709?key=71d9a7d5f1210c0772dc7eea6ddee373
