import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { WeatherData, SearchResult, Coordinates, PhotoAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are GlareMyAurora, an expert in space weather, physics, and night photography. 
Your goal is to provide accurate aurora forecasts and safety advice.`;

// Helper to extract JSON
const extractJson = (text: string): any => {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn("Failed to parse extracted JSON", e);
      return null;
    }
  }
  return null;
};

// --- Space Weather Service ---

export const fetchSpaceWeather = async (coords: Coordinates): Promise<SearchResult<WeatherData>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Perform a Google Search to find the REAL-TIME current space weather conditions including:
    1. Current Kp Index (live value).
    2. Solar Wind Speed (km/s).
    3. Solar Wind Density (p/cm^3).
    4. IMF Bz (nT).
    5. Aurora forecast for the next 6 hours.
    6. Identify the NEAREST location/region to [${coords.latitude}, ${coords.longitude}] that has actual aurora sightings reported recently OR a magnetometer station showing high activity.
    7. Check for significant solar flares (Class M or X) occuring in the past 24 hours. If none, indicate 'None'.
    
    My location is Latitude: ${coords.latitude}, Longitude: ${coords.longitude}.

    Calculate a "Probability Score" (0-100) for seeing aurora RIGHT NOW based on:
    - Latitude (Need Kp ~4 for 55°, Kp ~6 for 50°, Kp ~7+ for 45°).
    - Bz (Negative is better, <-5nT is great).
    - Speed (>500 km/s is good).
    - Density (>10 p/cm^3 is good).

    Also determine "Tonight's Window" (best time range to view).

    Response Format:
    First, provide a friendly readable summary paragraph "Captain's Log".
    
    Second, output a JSON block (wrapped in \`\`\`json):
    {
      "kpIndex": number,
      "solarWindSpeed": number, // Value in km/s (number only)
      "solarWindDensity": number, // Value in p/cm^3 (number only)
      "bz": number, // Value in nT (number only)
      "probabilityScore": number,
      "visibilityChance": "Low" | "Moderate" | "High" | "Extreme",
      "tonightsWindow": "string (e.g. 23:00 - 02:00)",
      "nearestDetection": {
          "location": "City, Country or Station Name",
          "status": "Brief status (e.g. 'Active Storm', 'Visual Sighting', 'Quiet')"
      },
      "solarFlare": {
          "class": "Class (e.g. M1.2, X5.0) or 'None'",
          "time": "Time of peak or 'N/A'",
          "impact": "Short impact description or 'Quiet Sun'"
      },
      "locationName": "City/Region Name",
      "forecast": [
         {"time": "Now", "kp": number},
         {"time": "+1h", "kp": number},
         {"time": "+2h", "kp": number},
         {"time": "+3h", "kp": number},
         {"time": "+4h", "kp": number},
         {"time": "+5h", "kp": number}
      ]
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text || "";
    const sources: any[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const mappedSources = sources
      .map((chunk) => chunk.web)
      .filter((web) => web !== undefined)
      .map((web) => ({ uri: web.uri, title: web.title }));

    const jsonData = extractJson(text);

    return {
      data: jsonData,
      rawText: text.replace(/```json[\s\S]*?```/, '').trim(),
      sources: mappedSources,
    };

  } catch (error) {
    console.error("Error fetching space weather:", error);
    throw error;
  }
};

// --- Photo Analysis Service ---

export const analyzeSkyPhoto = async (
  base64Image: string, 
  deviceType: string
): Promise<PhotoAnalysis | null> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze this photo of the sky/environment for Aurora photography suitability.
    Device being used: ${deviceType}

    1. Assess Cloud Cover (Clear, Partly Cloudy, Overcast).
    2. Assess Light Pollution/Darkness.
    3. Provide specific camera settings (ISO, Shutter, Aperture) optimized for THIS scene.
    4. Provide a 3-item checklist for the user to get the best shot.

    Output ONLY JSON format:
    {
      "cloudCover": "string",
      "darknessRating": "string",
      "recommendedSettings": {
        "iso": "string",
        "shutterSpeed": "string",
        "aperture": "string",
        "focus": "string"
      },
      "checklist": ["item 1", "item 2", "item 3"],
      "feedback": "Short encouraging advice based on the image."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "";
    // If output is pure JSON due to responseMimeType
    try {
      return JSON.parse(text);
    } catch (e) {
      return extractJson(text);
    }

  } catch (error) {
    console.error("Error analyzing photo:", error);
    return null;
  }
};

// --- Chat Service ---

export const createChatSession = () => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + " You are helpful, concise, and safety-conscious. Warn users about cold exposure and dark terrain.",
    }
  });
};