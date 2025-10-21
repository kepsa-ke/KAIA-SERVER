const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("colors");
const connectDB = require("./config/db");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1024mb" }));
app.use(express.urlencoded({ extended: false }));

connectDB();

app.get("/", (req, res) => res.status(200).send("API WORKING WELL"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/courses", require("./routes/courseRoutes"));
app.use("/api/v1/members", require("./routes/memberRoutes"));
app.use("/api/v1/requests", require("./routes/reqInfoRoutes"));
app.use("/api/v1/reports", require("./routes/statsRoutes"));
app.use("/api/v1/partners", require("./routes/techPartnerRoutes"));

app.listen(port, () => console.log(`Server started on port ${port}`));
