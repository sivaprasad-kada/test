"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubAuthCallback = exports.githubAuth = exports.googleAuthCallback = exports.googleAuth = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const User_model_js_1 = require("../models/User.model.js");
const Session_model_js_1 = require("../models/Session.model.js");
const Url_model_js_1 = require("../models/Url.model.js");
const redis_js_1 = require("../config/redis.js");
const env_js_1 = require("../config/env.js");
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
// Helper to create session
const createSession = async (res, userId) => {
    const sessionId = crypto_1.default.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const ttlSeconds = Math.floor(SESSION_DURATION_MS / 1000);
    // 1. Save to MongoDB (source of truth)
    await Session_model_js_1.SessionModel.create({
        sessionId,
        userId,
        expiresAt,
    });
    // 2. Save to Redis (cache — silently fails if Redis is down)
    await (0, redis_js_1.safeRedisOp)(async () => {
        const redisClient = (0, redis_js_1.getRedisClient)();
        await redisClient.set(`session:${sessionId}`, JSON.stringify({
            userId,
            expiresAt: expiresAt.toISOString(),
        }), { EX: ttlSeconds });
    }, undefined, "Auth Session");
    // 3. Set cookie
    res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION_MS,
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Zod validation handles field presence checks upstream
        const existingUser = await User_model_js_1.UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_model_js_1.UserModel.create({
            name,
            email,
            password: hashedPassword,
            provider: "local",
        });
        await createSession(res, user._id.toString());
        res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email } });
    }
    catch (error) {
        console.error("[Auth] Register error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Zod validation handles field presence checks upstream
        const user = await User_model_js_1.UserModel.findOne({ email });
        if (!user || user.provider !== "local" || !user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        await createSession(res, user._id.toString());
        res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
    }
    catch (error) {
        console.error("[Auth] Login error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;
        if (sessionId) {
            await Session_model_js_1.SessionModel.deleteOne({ sessionId });
            await (0, redis_js_1.safeRedisOp)(async () => { await (0, redis_js_1.getRedisClient)().del(`session:${sessionId}`); }, undefined, "Auth Logout");
        }
        res.clearCookie("sessionId");
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        console.error("[Auth] Logout error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await User_model_js_1.UserModel.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Dynamic redirect quota reset check
        const now = new Date();
        if (!user.redirectQuotaResetDate || now >= user.redirectQuotaResetDate) {
            user.monthlyRedirectCount = 0;
            user.redirectQuotaResetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            await user.save();
        }
        const linkCount = await Url_model_js_1.UrlModel.countDocuments({ userId: user._id });
        res.json({
            user,
            limits: {
                maxLinks: user.plan === "PRO" ? env_js_1.env.PRO_MAX_LINKS : env_js_1.env.FREE_MAX_LINKS,
                maxRedirects: user.plan === "PRO" ? env_js_1.env.PRO_MAX_REDIRECTS : env_js_1.env.FREE_MAX_REDIRECTS,
                linkCount,
            }
        });
    }
    catch (error) {
        console.error("[Auth] GetMe error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getMe = getMe;
const googleAuth = async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id";
    const redirectUri = env_js_1.env.GOOGLE_CALLBACK_URL;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
    res.redirect(authUrl);
};
exports.googleAuth = googleAuth;
const googleAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: "No code provided" });
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = env_js_1.env.GOOGLE_CALLBACK_URL;
        // 1. Exchange code for token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId || "",
                client_secret: clientSecret || "",
                code,
                redirect_uri: redirectUri || "",
                grant_type: "authorization_code",
            }).toString(),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error("[Auth] Google token error", tokenData);
            return res.status(400).json({ error: "Failed to exchange code for token" });
        }
        // 2. Get user info
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        if (!userInfoResponse.ok) {
            console.error("[Auth] Google user info error", userInfo);
            return res.status(400).json({ error: "Failed to get user info" });
        }
        const { id: providerId, email, name, picture: avatar } = userInfo;
        // 3. Find or create user
        let user = await User_model_js_1.UserModel.findOne({ email });
        if (user && user.provider !== "google") {
            return res.status(400).json({ error: "Email already registered with a different provider" });
        }
        if (!user) {
            user = await User_model_js_1.UserModel.create({
                name,
                email,
                provider: "google",
                providerId,
                avatar,
            });
        }
        else {
            user.avatar = avatar;
            await user.save();
        }
        await createSession(res, user._id.toString());
        const frontendUrl = env_js_1.env.FRONTEND_URL;
        res.redirect(`${frontendUrl}/dashboard`);
    }
    catch (error) {
        console.error("[Auth] Google OAuth error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.googleAuthCallback = googleAuthCallback;
const githubAuth = async (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || "dummy_github_client_id";
    const redirectUri = env_js_1.env.GITHUB_CALLBACK_URL;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user`;
    res.redirect(authUrl);
};
exports.githubAuth = githubAuth;
const githubAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: "No code provided" });
        }
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        // 1. Exchange code for token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            console.error("[Auth] GitHub token error", tokenData);
            return res.status(400).json({ error: "Failed to exchange code for token" });
        }
        // 2. Get user info
        const userInfoResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        const userInfo = await userInfoResponse.json();
        if (!userInfoResponse.ok) {
            console.error("[Auth] GitHub user info error", userInfo);
            return res.status(400).json({ error: "Failed to get user info" });
        }
        const providerId = userInfo.id.toString();
        const name = userInfo.name || userInfo.login;
        const avatar = userInfo.avatar_url;
        let email = userInfo.email;
        // Fetch primary email if not public
        if (!email) {
            const emailResponse = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });
            const emails = await emailResponse.json();
            if (emailResponse.ok && Array.isArray(emails)) {
                const primaryEmail = emails.find((e) => e.primary) || emails[0];
                if (primaryEmail)
                    email = primaryEmail.email;
            }
        }
        // 3. Find or create user
        let user = await User_model_js_1.UserModel.findOne({ email });
        if (user && user.provider !== "github") {
            return res.status(400).json({ error: "Email already registered with a different provider" });
        }
        if (!user) {
            user = await User_model_js_1.UserModel.create({
                name,
                email,
                provider: "github",
                providerId,
                avatar,
            });
        }
        else {
            user.avatar = avatar;
            await user.save();
        }
        await createSession(res, user._id.toString());
        const frontendUrl = env_js_1.env.FRONTEND_URL;
        res.redirect(`${frontendUrl}/dashboard`);
    }
    catch (error) {
        console.error("[Auth] GitHub OAuth error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.githubAuthCallback = githubAuthCallback;
//# sourceMappingURL=auth.controller.js.map