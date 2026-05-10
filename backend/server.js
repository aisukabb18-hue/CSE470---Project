const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Error:", err);
    process.exit(1);
  });

app.use("/api/auth",    require("./routes/authRoutes"));
app.use("/api/mood",    require("./routes/moodRoutes"));
app.use("/api/journal", require("./routes/journalRoutes"));
app.use("/api/sleep",   require("./routes/sleepRoutes"));
app.use("/api/habits",  require("./routes/habitRoutes"));
app.use("/api/risk",    require("./routes/riskRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/admin",   require("./routes/adminRoutes"));
app.use("/api/report",  require("./routes/reportRoutes"));

app.get("/", (req, res) => {
  res.json({ status: "Backend Running", version: "1.0.0" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});