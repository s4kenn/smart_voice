import fs from "fs";
import { google } from "googleapis";

// const credentials = JSON.parse(fs.readFileSync("./myjson.json"));
export const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/cloud-platform"]
);