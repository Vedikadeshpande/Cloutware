const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const QLOO_API_URL = "https://hackathon.api.qloo.com/v2/insights";

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

    //Qloo API Call
let qlooInsights = '';
const entityTypes = {
  'urn:entity:book': 'Books',
  'urn:entity:movie': 'Movies',
  'urn:entity:tv_show': 'TV Shows',
  'urn:entity:artist': 'Music Artists',
};

const results = {};

for (const [type, label] of Object.entries(entityTypes)) {
  try {
    const response = await axios.get(QLOO_API_URL, {
      headers: {
        'x-api-key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        'filter.type': type,
        'signal.location.query': brand.geography || 'Global',
        'signal.age_range': brand.ageRange || '18-34',
        'signal.gender': brand.gender || 'unknown',
        'signal.income': brand.incomeLevel || 'middle',
        'signal.interests': brand.industry || 'entertainment',
        take: 5
      }
    });

    const entities = response.data?.results?.entities || [];
    results[label] = entities.map(e => e.name || 'Unknown');
  } catch (err) {
    console.warn(`Error fetching ${label}:`, err.message);
    results[label] = [];
  }
}

// Format into insight string for the prompt
qlooInsights = `
Top Books: ${results['Books'].join(', ') || 'N/A'}
Top Movies: ${results['Movies'].join(', ') || 'N/A'}
Top TV Shows: ${results['TV Shows'].join(', ') || 'N/A'}
`;


    // Prompt Construction
    const prompt = `You are Cloutware AI — a cultural intelligence and campaign strategy generator.
Here are the inputs for the brand:

- Brand Name: ${brand.brandName}
- Niche: ${brand.niche}
- Personality & Tone: ${brand.personality}
- Target Age Range: ${brand.ageRange}
- Geography: ${brand.geography}
- Gender: ${brand.gender || 'Not specified'}
- Income Level: ${brand.incomeLevel || 'Not specified'}
- Launch Date: ${brand.launchTimeline || 'Not specified'}
- Product Price Range: ${brand.priceRange || 'Not specified'}
- Sales Channel: ${brand.salesChannels || 'Not specified'}
- Objective: ${brand.objective}
- Budget Range: ${brand.budget}

You're a hyper-strategic, culturally fluent brand strategist known for building bold, viral, and performance-optimized campaigns for any age group that is specified in Target Age Range. Your task is to create a flawless, presentation-ready ad campaign guide based on brand inputs like brandName, niche, tone, audience, geography, budget and objectives. Use trend analysis, viral formats, platform algorithm shifts, and competitor case studies to inform every move. The guide must include: 2–3 campaign names with slogans, cultural tie-ins where you write about siginicant cultural things relevant including but not limited to festivals in the geography, tv shows, movies etc. using ${qlooInsights}; a visual archetype of the vibe of the campaign ad; platform-specific content strategy with format breakdowns and native feature hacks; 5–10 viral content ideas with hooks and format types; brand slogans and voice definition; influencer strategy with ideal creator types, values, and collab ideas; budget breakdown with ROI-optimized tips; color palette with HEX codes and psych impact; typography style rules and font pairings; music/sound design with genre, sample artists, beats, and vibes; posting schedule with launch phases, cadence, and best post times; native CTAs for each platform; ideal model archetypes and their alignment with the brand; real competitor campaigns and why they worked; purpose-led layer if relevant; and finally, a sticky, campaign-worthy brand slogan. Use specific, creative, trend-savvy and non-generic insights informed by ${qlooInsights}. Output must be in markdown format with bold headers, bullet lists, and clean spacing — no paragraph-only formatting. Keep tone witty, bold, meme-literate, and built for high retention, relatability, and reaction loops. 
Give me the following content structured entirely in valid HTML with headings as <h1>, <h2>, paragraphs inside <p>, and bold text inside <strong>. Also add <div>s with class names for styling, and include simple inline styles or class names like 'section', 'title', 'content' for easy CSS later. Absolutely remove the ** and backticks and any images from the output. No images of any format. Make sure you generate the full output and dont leave the output incomplete. finish the output and double check music artist names, hex colour codes are real and valid. 
`;

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
