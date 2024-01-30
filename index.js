require("dotenv").config();
const { OpenAI } = require("openai");
const openai = new OpenAI({apiKey:"API_KEY"});
const API_URL = "https://api.openai.com/v1/chat/completions";
const express = require("express");
const twilio = require("twilio");
const app = express();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
app.use(express.urlencoded({ extended: true }));

app.post("/make-call", async (req, res) => {
  try {
    const call = await client.calls.create({
      to: "XXXXXXXXXX", // Replace with the recipient's phone number
      from: "+XXXXXXXXXX", // Replace with your Twilio phone number
      url: "https://ngrok-public-url/gather", // Replace with your Ngrok or public URL
      method: "POST",
    });
    console.log("Call SID:", call.sid);
    res.status(200).send(`Call SID: ${call.sid}`);
  } catch (error) {
    console.error("Error making the call:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/gather", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  // Use gather to collect user input (speech) during the call
  twiml.say("Please say your message after the beep.");
  twiml.gather({
    input: "speech", // Use speech recognition
    speechTimeout: "auto",
    speechModel: "experimental_conversations", // Maximum time to wait for speech input in seconds
    action: "/process-gather", // Endpoint to handle the gathered speech
    method: "POST",
  });
  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/process-gather", async (req, res) => {
  const speechResult = req.body.SpeechResult || "No speech detected";
  console.log("User said:", speechResult);
  if (speechResult) 
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: speechResult }],
      model: "gpt-3.5-turbo",
    });
    console.log(completion.choices[0].message?.content);
    const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(`You answer: ${completion?.choices[0]?.message?.content}`);
    // Output response from twilio voice call
  res.type("text/xml");
  res.send(twiml.toString());
  } catch (err) {
    console.log(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});