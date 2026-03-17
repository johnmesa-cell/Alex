import express from "express";
import bodyParser from "body-parser";
import { setAIRoutes } from "./routes/ai.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

setAIRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
