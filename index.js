const TelegramBot = require("node-telegram-bot-api");
const fetchNode = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // to generate explanations for weather
require("dotenv").config();

const token = process.env.TOKEN;
const GeminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GeminiApiKey);
const bot = new TelegramBot(token, { polling: true });

let lastWeatherData = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const city = msg.text;
  // Skip if message is a command like /start
  if (city.startsWith("/")) return;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    if (data.cod === 200) {
      const temp = data.main.temp;
      const weather = data.weather[0].description;

      // data Save for explanation later
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
    } else {
      bot.sendMessage(chatId, "City not found. Please try again.");
    }
  } catch (error) {
    console.error("API Error:", error.message);
    bot.sendMessage(chatId, "Something went wrong. Please try again later.");
  }
});

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
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Welcome! 🌍 Send me a city name to get the current weather."
  );
});
