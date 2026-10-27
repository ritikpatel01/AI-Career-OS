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
            clearAuthStorage();
            return null;
        }

        return user;
    } catch {
        console.error("Unable to restore authentication storage.");
        clearAuthStorage();

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
        "accessToken",
        "user"
    ];

    let cleared = true;
    for (const name of ["localStorage", "sessionStorage"]) {
        for (const key of keys) {
            try {
                // Accessing the storage property itself can throw.
                const storage = name === "localStorage" ? localStorage : sessionStorage;
                storage.removeItem(key);
            } catch {
                cleared = false;
            }
        }
    }
    return cleared;
};

// =========================================================
// AUTH PROVIDER
// =========================================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getSavedUser);
    const [cleanupWarning, setCleanupWarning] = useState(false);

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

        try {
            // Do not mix a previous account's credentials with a partial login.
            setUser(null);
            if (!clearAuthStorage()) throw new Error("Storage cleanup failed");
            setCleanupWarning(false);

            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem("token", token);
            storage.setItem("authToken", token);
            storage.setItem("user", JSON.stringify(normalizedUser));

            // Publish authenticated state only after every write succeeds.
            setUser(normalizedUser);
        } catch {
            clearAuthStorage();
            setUser(null);
            throw new Error("Unable to store your sign-in in this browser. Please enable browser storage and try again.");
        }
    };

    // =========================================
    // LOGOUT
    // =========================================

    const retryAuthCleanup = () => {
        setUser(null);
        const cleared = clearAuthStorage();
        setCleanupWarning(!cleared);
        return cleared;
    };

    const logout = () => {
        const cleared = retryAuthCleanup();
        if (!cleared) {
            console.error("Signed out in this session, but stored authentication could not be cleared. Clear this site's browser data before using a shared device.");
        }
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
        cleanupWarning,
        retryAuthCleanup,
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
