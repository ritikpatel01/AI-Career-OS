const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    } catch {
        throw new Error("Database connection unavailable");
    }
    try {
        const topology = await mongoose.connection.db.admin().command({ hello: 1 });
        if (!topology.setName && topology.msg !== "isdbgrid") {
            throw new Error("Database transactions require a replica set or sharded cluster");
        }
    } catch (error) {
        await mongoose.disconnect();
        if (error.message === "Database transactions require a replica set or sharded cluster") throw error;
        throw new Error("Database capability check unavailable");
    }
    console.log("MongoDB connected");
};
module.exports = connectDB;
