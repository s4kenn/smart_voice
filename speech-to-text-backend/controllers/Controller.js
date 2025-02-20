import { auth } from "../utils/connectToGoogle.js"
import dotenv from "dotenv"
import axios from "axios";
import analyzeWithPerplexity from "../utils/analyzeWithPerplexity.js";
import formatMeetingData from "../utils/formatMeetingData.js";
dotenv.config()

export const UploadAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file has been uploaded" });
        }

        const token = await auth.authorize();
        const audioBytes = req.file.buffer.toString("base64");

        const speechResponse = await axios.post(
            "https://speech.googleapis.com/v1/speech:recognize",
            {
                config: {
                    encoding: "MP3",
                    sampleRateHertz: 44100,
                    languageCode: "en-US",
                    model: "default",
                    audioChannelCount: 2,
                    enableAutomaticPunctuation: true
                },
                audio: { content: audioBytes }
            },
            {
                headers: {
                    "Authorization": `Bearer ${token.access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const transcript =
            speechResponse.data.results
                ?.map((result) => result.alternatives[0].transcript)
                .join(" ") || "";

        if (!transcript) {
            return res.status(400).json({
                status: "error",
                error: "No transcript generated"
            });
        }

        const extractedData = await analyzeWithPerplexity(transcript);
        const formattedData = formatMeetingData(extractedData);

        return res.json({
            status: "success",
            transcript,
            ...formattedData
        });
    } catch (error) {
        console.error("Processing error:", error);
        res.status(500).json({
            status: "error",
            error: "Processing failed",
            details: error.message
        });
    }
}

