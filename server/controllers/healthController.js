const mongoose = require("mongoose");
const liveness = (_req, res) => res.set("Cache-Control", "no-store").status(200).json({ success: true, message: "AI Career OS API is running" });
const readiness = async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("Not connected");
        await mongoose.connection.db.admin().command({ ping: 1 }, { timeoutMS: 2000 });
        return res.status(200).json({ success: true, message: "API is ready" });
    } catch {
        return res.status(503).json({ success: false, message: "API is temporarily unavailable" });
    }
};
module.exports = { liveness, readiness };
