const TelegramBot = require("node-telegram-bot-api");
const fetchNode = require("node-fetch"); // Optional: you can skip this if you're using Node.js version 22 LTS or newer. Use it only for older versions.
const { GoogleGenerativeAI } = require("@google/generative-ai"); // for AI explanations
require("dotenv").config();

const token = process.env.TOKEN;
const GeminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GeminiApiKey);
const bot = new TelegramBot(token, { polling: true });

let lastWeatherData = {};
let lastForecastData = null;

// Helper to fetch current weather
async function getCurrentWeather(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.cod !== 200) {
    throw new Error(data.message);
  }

  return data;
}

// Helper to fetch 5-day/3-hour forecast
async function getForecast(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.cod !== "200") {
    throw new Error(data.message);
  }

  return data;
}

// Extract one forecast per day (12:00:00) for next 3 days
function extractThreeDayForecast(data) {
  const forecast = {};
  data.list.forEach((item) => {
    const [date, time] = item.dt_txt.split(" ");
    if (time === "12:00:00" && !forecast[date]) {
      forecast[date] = {
        temp: item.main.temp,
        desc: item.weather[0].description,
      };
    }
  });
  return Object.entries(forecast).slice(0, 3);
}

// Format forecast message and save lastForecastData globally
function formatForecast(forecastArray) {
  lastForecastData = forecastArray; // save for explanation

  let message = "📅 3-Day Weather Forecast:\n";
  forecastArray.forEach(([date, info]) => {
    message += `\n📆 ${date}\n🌡 Temp: ${info.temp}°C\n🌤 Condition: ${info.desc}\n`;
  });
  return message;
}

// Handle regular messages (assumed city name for current weather)
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const city = msg.text;

  // Ignore commands here
  if (city.startsWith("/")) return;

  try {
    const data = await getCurrentWeather(city);
    const temp = data.main.temp;
    const weather = data.weather[0].description;

    // Save data for explanation
    lastWeatherData = {
      city,
      temp: temp.toString(),
      weather,
    };

    bot.sendMessage(
      chatId,
      `The current temperature in ${city} is ${temp}°C with ${weather}.\n\nDo you want an explanation of the weather?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Explain it", callback_data: "explain" }],
            [{ text: "❌ No thanks!", callback_data: "skip" }],
          ],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, "City not found. Please try again.");
  }
});

// Handle /forecast command with city name
bot.onText(/\/forecast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const city = match[1].trim();

  try {
    const data = await getForecast(city);
    const forecast = extractThreeDayForecast(data);
    const message = formatForecast(forecast);

    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🧠 Explain Forecast", callback_data: "explain_forecast" }],
        ],
      },
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    bot.sendMessage(chatId, `❌ Something went wrong. Please try again.`);
  }
});

// Handle callback queries (button presses)
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id); // acknowledge

  if (data === "skip") {
    return bot.sendMessage(
      chatId,
      "Alright! Let me know if you want anything else."
    );
  }

  if (data === "explain") {
    const { city, temp, weather } = lastWeatherData;
    const prompt = `Explain today's weather in simple terms:\nCity: ${city}\nTemperature: ${temp}°C\nCondition: ${weather}`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const explanation = response.text();

      bot.sendMessage(chatId, `🧠 ${explanation}`);
    } catch (err) {
      console.error("Gemini error:", err.message);
      bot.sendMessage(chatId, "⚠️ Sorry, couldn't generate the explanation.");
    }
  }

  if (data === "explain_forecast") {
    if (!lastForecastData) {
      return bot.sendMessage(chatId, "No forecast data available to explain.");
    }

    let forecastSummary =
      "Explain the 3-day weather forecast in simple terms:\n";
    lastForecastData.forEach(([date, info]) => {
      forecastSummary += `Date: ${date}, Temperature: ${info.temp}°C, Condition: ${info.desc}\n`;
    });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(forecastSummary);
      const response = await result.response;
      const explanation = response.text();

      bot.sendMessage(chatId, `🧠 Forecast Explanation:\n${explanation}`);
    } catch (err) {
      console.error("Gemini error:", err.message);
      bot.sendMessage(
        chatId,
        "⚠️ Sorry, couldn't generate the forecast explanation."
      );
    }
  }
});

// /start command handler
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Welcome! 🌍 Send me a city name to get the current weather or type /forecast <city name> for 3-day forecast."
  );
});
