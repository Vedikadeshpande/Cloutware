const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: 'https://cloutware-kappa.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'Backend is LIVE!' });
});

// POST route for campaign generation
app.post("/generate-campaign", async (req, res) => {
  try {
    const brand = req.body;
    
    // Validate required fields
    if (!brand.brandName || !brand.niche || !brand.objective || !brand.budget) {
      return res.status(400).json({ 
        error: "Missing required fields: brandName, niche, objective, and budget are required" 
      });
    }
    
    //Groq API Call with LLaMA 3
    const llamaResponse = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "You are Cloutware AI — a cultural intelligence and campaign strategy generator." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2048
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const campaignStrategy = llamaResponse.data.choices[0].message.content;
    
    res.json({ 
      campaign: campaignStrategy,
      success: true 
    });
    
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Something went wrong! Please try again.",
      details: err.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


