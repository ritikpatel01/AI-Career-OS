import {
    createContext,
    useContext,
    useState
} from "react";

// =========================================================
// AUTH CONTEXT
// =========================================================

const AuthContext = createContext(null);

// =========================================================
// NORMALIZE USER RESPONSE
// Supports common API response structures.
// =========================================================

const normalizeUser = (input) => {
    if (!input || typeof input !== "object") {
        return null;
    }

    const candidate =
        input.data?.user ||
        input.data?.profile ||
        input.user ||
        input.profile ||
        input.data ||
        input;

    if (!candidate || typeof candidate !== "object") {
        return null;
    }

    // A user must have an identifier or email.
    if (
        !candidate._id &&
        !candidate.id &&
        !candidate.email
    ) {
        return null;
    }

    return {
        ...candidate,
        role:
            typeof candidate.role === "string"
                ? candidate.role.toLowerCase()
                : "user"
    };
};

// =========================================================
// RESTORE USER FROM STORAGE
// =========================================================

const getSavedUser = () => {
    try {
        const savedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!savedUser || savedUser === "null") {
            return null;
        }

        const parsedUser = JSON.parse(savedUser);
        const user = normalizeUser(parsedUser);

        if (!user) {
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            return null;
        }

        return user;
    } catch (error) {
        console.error(
            "Failed to restore authentication:",
            error.message
        );

        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        return null;
    }
};

// =========================================================
// CLEAR AUTHENTICATION STORAGE
// =========================================================

const clearAuthStorage = () => {
    const keys = [
        "token",
        "authToken",
        "user"
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};

// =========================================================
// AUTH PROVIDER
// =========================================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getSavedUser);

    // =========================================
    // LOGIN
    // =========================================

    const login = (
        userData,
        token,
        rememberMe = true
    ) => {
        if (!token || typeof token !== "string") {
            throw new Error(
                "Authentication token is missing."
            );
        }

        const normalizedUser = normalizeUser(userData);

        if (!normalizedUser) {
            throw new Error(
                "The server did not return valid user details. " +
                "Check the login API response."
            );
        }

        // Remove previous local/session authentication.
        clearAuthStorage();

        const storage = rememberMe
            ? localStorage
            : sessionStorage;

        // Store the token.
        storage.setItem("token", token);
        storage.setItem("authToken", token);

        // Store the normalized user, including their role.
        storage.setItem(
            "user",
            JSON.stringify(normalizedUser)
        );

        // Update React state immediately.
        setUser(normalizedUser);
    };

    // =========================================
    // LOGOUT
    // =========================================

    const logout = () => {
        clearAuthStorage();
        setUser(null);
    };

    // =========================================
    // AUTHORIZATION INFORMATION
    // =========================================

    const isAuthenticated = Boolean(user);

    const isAdmin =
        String(user?.role || "").toLowerCase() === "admin";

    // =========================================
    // CONTEXT VALUE
    // =========================================

    const authValue = {
        user,
        login,
        logout,
        isAuthenticated,
        isAdmin
    };

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

// =========================================================
// USE AUTH HOOK
// =========================================================

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
};