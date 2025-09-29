import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

// Roteamento API
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
