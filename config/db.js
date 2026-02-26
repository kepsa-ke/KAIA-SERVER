const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]); // Set custom DNS servers to avoid potential DNS resolution issues
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
