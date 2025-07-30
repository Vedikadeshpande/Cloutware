const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Fixed URL (removed trailing space)
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
app.use(cors());
origin: true,
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

    //Qloo API Call - Trending Books, Movies, TV Shows
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

You're a hyper-strategic, culturally fluent brand strategist known for building bold, viral, and performance-optimized campaigns for any age group that is specified in Target Age Range. Your task is to create a flawless, presentation-ready ad campaign guide based on brand inputs like brandName, niche, tone, audience, geography, budget and objectives. Use trend analysis, viral formats, platform algorithm shifts, and competitor case studies to inform every move. The guide must include: 2–3 campaign names with slogans, problem-solution-impact narrative, cultural tie-ins where you write about siginicant cultural things relevant including but not limited to festivals in the geography, tv shows, movies etc. using ${qlooInsights}; platform-specific content strategy with format breakdowns and native feature hacks; 5–10 viral content ideas with hooks and format types; brand slogans and voice definition; influencer strategy with ideal creator types, values, and collab ideas; budget breakdown with ROI-optimized tips; color palette with HEX codes and psych impact; typography style rules and font pairings; music/sound design with genre, sample artists, beats, and vibes; posting schedule with launch phases, cadence, and best post times; native CTAs for each platform; ideal model archetypes and their alignment with the brand; real competitor campaigns and why they worked; purpose-led layer if relevant; and finally, a sticky, campaign-worthy brand slogan. Use specific, creative, trend-savvy and non-generic insights informed by ${qlooInsights}. Output must be in markdown format with bold headers, bullet lists, and clean spacing — no paragraph-only formatting. Keep tone witty, bold, meme-literate, and built for high retention, relatability, and reaction loops. 
Give me the following content structured entirely in valid HTML with headings as <h1>, <h2>, paragraphs inside <p>, and bold text inside <strong>. Also add <div>s with class names for styling, and include simple inline styles or class names like 'section', 'title', 'content' for easy CSS later. Absolutely remove the ** and backticks from the output. Make sure you generate the full output and dont leave the output incomplete. finish the output and double check music artist names, hex colour codes are real and valid. 
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
// Add this import at the top with your other imports
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI after your other configurations
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Add this new route for video generation
app.post("/generate-campaign-video", async (req, res) => {
  try {
    const { 
      campaignData, 
      colorPalette, 
      visualArchetype, 
      culturalInsights,
      duration = 15 
    } = req.body;

    // Extract key elements for video prompt
    const brandName = campaignData.brandName || 'Brand';
    const niche = campaignData.niche || 'lifestyle';
    const personality = campaignData.personality || 'modern';
    const geography = campaignData.geography || 'Global';
    const ageRange = campaignData.ageRange || '18-34';

    // Create culturally-informed video prompt
    const videoPrompt = `
Create a ${duration}-second advertisement video for ${brandName}, a ${niche} brand with a ${personality} personality, targeting ${ageRange} year-olds in ${geography}.

Visual Style:
- Color palette: ${colorPalette}
- Visual archetype: ${visualArchetype}
- Cultural context: ${culturalInsights}

The video should:
- Open with an eye-catching hook within first 2 seconds
- Feature diverse, authentic representation of the target demographic
- Include trendy, culturally relevant settings and props
- Show the product/service in natural, lifestyle contexts
- End with a strong call-to-action
- Match the energy and aesthetics popular in ${geography}
- Include background music that resonates with local tastes

Style: High-quality, mobile-first, social media optimized, authentic and engaging.
    `;

    console.log('🎬 Generating video with Veo 3...');

    // Use Veo 3 model for video generation
    const veo3Model = genAI.getGenerativeModel({ 
      model: "veo-3.0-generate-001" 
    });

    const videoResult = await veo3Model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ 
          text: videoPrompt
        }]
      }],
      generationConfig: {
        videoDuration: duration,
        videoResolution: "1080p",
        includeAudio: true,
        aspectRatio: "9:16" // Mobile-first format
      }
    });

    const generatedVideo = videoResult.response.candidates[0].content.parts[0];

    res.json({
      video: generatedVideo,
      videoPrompt: videoPrompt,
      hasAudio: true,
      culturallyOptimized: true,
      success: true
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: "Video generation failed",
      details: error.message,
      success: false 
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
