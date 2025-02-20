import express from "express"
import multer from "multer";
import { UploadAudio } from "../controllers/Controller.js";

const Router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

Router.post("/transcribe", upload.single("audio"), UploadAudio)


export default Router