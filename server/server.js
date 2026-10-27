const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const { validateEnvironment } = require("./config/runtime");
const connectDB = require("./config/db");

async function start() {
    validateEnvironment();
    const app = require("./app");
    await connectDB();
    const port = process.env.PORT || 5000;
    return app.listen(port, "0.0.0.0", () => console.log("API listening"));
}
if (require.main === module) start().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
module.exports = { start };
