import axios from "axios";
import dotenv from "dotenv"

dotenv.config()

async function analyzeWithPerplexity(transcript) {
    try {
        const prompt = `
      Hey, you are a smart agent who will analyze this transcript for me and return a JSON object with exactly this structure:
      {
        "tasks": [
            {
                "task": "Brief description of the task",
                "assignee": "Person responsible",
                "deadline": "Deadline if specified"
            }
        ],
        "meeting": {
            "date": "Meeting date if mentioned",
            "time": "Meeting time if mentioned",
            "participants": ["List of participants mentioned"]
        },
        "key_points": ["Summary of main discussion topics"],
        "decisions": ["List of conclusions or agreements made"],
        "next_steps": ["Follow-up actions to be taken"]
    }

      
      Transcript: ${transcript}
      
      Respond only with the JSON object, no additional text.`;

        const response = await axios.post(
            "https://api.perplexity.ai/chat/completions",
            {
                model: "sonar-pro",
                messages: [
                    {
                        role: "system",
                        content: "You are a JSON formatter. Only respond with valid JSON objects."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 10000
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = response.data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("No valid JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]);
        return result;
    } catch (error) {
        console.error("Perplexity API Error:", error);
        return {
            tasks: [],
            meeting: { date: "", time: "", participants: [] },
            key_points: [],
            decisions: [],
            next_steps: []
        };
    }
}

export default analyzeWithPerplexity;