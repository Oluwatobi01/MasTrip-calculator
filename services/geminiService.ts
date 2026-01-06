import { GoogleGenAI, Type } from "@google/genai";
import { TripEstimation } from "../types";
import { GOOGLE_MAPS_API_KEY } from "../config";

// Use the key from config which falls back to process.env
const apiKey = GOOGLE_MAPS_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const calculateTripOptions = async (
  pickup: string,
  dropoff: string
): Promise<TripEstimation> => {
  
  // Use a default estimation if no API key or empty input to prevent crashes in demo
  if (!apiKey || !pickup || !dropoff) {
     return mockTripData(pickup, dropoff);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 realistic driving route options from "${pickup}" to "${dropoff}". 
      Prioritize real-world road networks and accurate distances for the specific location.
      
      Structure:
      Route 1: "Recommended" - The best balance of speed and simplicity. Mark as recommended.
      Route 2: "Shortest" - Shortest physical distance, even if slower.
      Route 3: "Alternative" - A viable backup route.

      Return realistic distances in KM and durations in Minutes. Be precise with local road names.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: "e.g., Via Main St" },
                  description: { type: Type.STRING, description: "Short rationale" },
                  distanceKm: { type: Type.NUMBER },
                  durationMin: { type: Type.NUMBER },
                  trafficLevel: { type: Type.STRING, enum: ["Low", "Moderate", "Heavy"] },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "name", "distanceKm", "durationMin", "trafficLevel", "tags", "description"]
              }
            },
            recommendedRouteId: { type: Type.STRING, description: "The ID of the route that is best overall" }
          },
          required: ["routes", "recommendedRouteId"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    return {
      id: crypto.randomUUID(),
      pickup,
      dropoff,
      routes: data.routes || [],
      recommendedRouteId: data.recommendedRouteId || (data.routes?.[0]?.id || ''),
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback to mock data if API fails
    return mockTripData(pickup, dropoff);
  }
};

const mockTripData = (pickup: string, dropoff: string): TripEstimation => {
  return {
    id: crypto.randomUUID(),
    pickup,
    dropoff,
    routes: [
      {
        id: 'r1',
        name: 'Via Airport Road',
        description: 'The fastest route avoiding major city congestion.',
        distanceKm: 12.5,
        durationMin: 22,
        trafficLevel: 'Low',
        tags: ['Fastest', 'Recommended']
      },
      {
        id: 'r2',
        name: "Via Ahmsdu Bahago Road/Mu'azu Mohammed Road",
        description: 'Direct route through the commercial district.',
        distanceKm: 13.2,
        durationMin: 26,
        trafficLevel: 'Moderate',
        tags: ['Alternative']
      },
      {
        id: 'r3',
        name: 'Via Minna - Zungeru Rd/Tegina-Akusu-Minna Rd',
        description: 'Shortest physical distance but encounters local traffic.',
        distanceKm: 9.3,
        durationMin: 18,
        trafficLevel: 'Heavy',
        tags: ['Shortest']
      }
    ],
    recommendedRouteId: 'r1',
    timestamp: Date.now()
  };
};