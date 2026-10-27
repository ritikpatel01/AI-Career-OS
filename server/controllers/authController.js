
const {
    registerUser,
    loginUser
} = require("../services/authService");

// ==========================================
// FORMAT SAFE USER DATA
// Never return password hashes.
// ==========================================
const formatSafeUser = (user) => {
    if (!user) {
        return null;
    }

    const userId = String(user._id || user.id || "");

    return {
        id: userId,
        _id: userId,
        name: user.name,
        email: user.email,
        role: user.role || "user"
    };
};

// ==========================================
// REGISTER USER
// POST /api/auth/register
// ==========================================
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid name, email and password are required"
            });
        }

        // The auth service assigns the default user role.
        // Never accept an administrator role from registration.
        const result = await registerUser(
            name,
            email,
            password
        );

        const user = formatSafeUser(result.user);
        const token = result.token;

        if (!user || !token) {
            console.error("Registration returned incomplete authentication data.");

            return res.status(500).json({
                success: false,
                message: "Registration could not be completed"
            });
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user,
            data: {
                token,
                user
            }
        });
    } catch (error) {
        console.error("Registration error:");

        if (error.message === "User already exists") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// ==========================================
// LOGIN USER
// POST /api/auth/login
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid email and password are required"
            });
        }

        // The service authenticates the credentials and returns
        // the role currently stored in the database.
        const result = await loginUser(
            email,
            password
        );

        const user = formatSafeUser(result.user);
        const token = result.token;

        if (!user || !token) {
            console.error("Login returned incomplete authentication data.");

            return res.status(500).json({
                success: false,
                message: "Login could not be completed"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user,
            data: {
                token,
                user
            }
        });
    } catch (error) {
        console.error("Login error:");

        if (error.message === "Invalid email or password") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
    register,
    login
};
