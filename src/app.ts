import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "SmartAssess Server is running" });
});

export default app;
