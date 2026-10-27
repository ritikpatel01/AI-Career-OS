
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================
const generateToken = (userId, authVersion = 0) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId: userId.toString(),
            ver: authVersion
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

// ==========================================
// RETURN SAFE USER DATA
// Never return the password hash.
// ==========================================
const getSafeUser = (user) => {
    return {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "user"
    };
};

// ==========================================
// REGISTER USER
// Every new account receives the default user role.
// The client cannot choose its role here.
// ==========================================
const registerUser = async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
    });

    // Role is intentionally not accepted from registration input.
    const token = generateToken(user._id, user.authVersion || 0);

    return {
        user: getSafeUser(user),
        token
    };
};

// ==========================================
// LOGIN USER
// Return the role stored in the database.
// ==========================================
const loginUser = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id, user.authVersion || 0);

    return {
        user: getSafeUser(user),
        token
    };
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
module.exports = {
    registerUser,
    loginUser,
    generateToken
};
