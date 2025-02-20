import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv"
import Router from "./routes/Route.js";

dotenv.config()

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route for transcribing the audio to text
app.use("/api", Router)

app.get("/", (req, res) => {
    res.json({
        message: "Testing my backend",
    });
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});