import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserModel } from "../models/User.model.js";
import { SessionModel } from "../models/Session.model.js";
import { getRedisClient } from "../config/redis.js";

const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

// Helper to create session
const createSession = async (res: Response, userId: string) => {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const ttlSeconds = Math.floor(SESSION_DURATION_MS / 1000);

  // 1. Save to MongoDB
  await SessionModel.create({
    sessionId,
    userId,
    expiresAt,
  });

  // 2. Save to Redis
  const redisClient = getRedisClient();
  await redisClient.set(`session:${sessionId}`, JSON.stringify({
    userId,
    expiresAt: expiresAt.toISOString(),
  }), { EX: ttlSeconds });

  // 3. Set cookie
  res.cookie("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
  });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
    });

    await createSession(res, user._id.toString());
    res.status(201).json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("[Auth] Register error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await UserModel.findOne({ email });
    if (!user || user.provider !== "local" || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await createSession(res, user._id.toString());
    res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("[Auth] Login error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await SessionModel.deleteOne({ sessionId });
      const redisClient = getRedisClient();
      await redisClient.del(`session:${sessionId}`);
    }
    res.clearCookie("sessionId");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("[Auth] Logout error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("[Auth] GetMe error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<any> => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id";
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
  res.redirect(authUrl);
};

export const googleAuthCallback = async (req: Request, res: Response): Promise<any> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: "No code provided" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

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
    let user = await UserModel.findOne({ email });
    if (user && user.provider !== "google") {
      return res.status(400).json({ error: "Email already registered with a different provider" });
    }

    if (!user) {
      user = await UserModel.create({
        name,
        email,
        provider: "google",
        providerId,
        avatar,
      });
    } else {
      user.avatar = avatar;
      await user.save();
    }

    await createSession(res, user._id.toString());
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("[Auth] Google OAuth error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const githubAuth = async (req: Request, res: Response): Promise<any> => {
  const clientId = process.env.GITHUB_CLIENT_ID || "dummy_github_client_id";
  const redirectUri = process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback";
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user`;
  res.redirect(authUrl);
};

export const githubAuthCallback = async (req: Request, res: Response): Promise<any> => {
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
        const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
        if (primaryEmail) email = primaryEmail.email;
      }
    }

    // 3. Find or create user
    let user = await UserModel.findOne({ email });
    if (user && user.provider !== "github") {
      return res.status(400).json({ error: "Email already registered with a different provider" });
    }

    if (!user) {
      user = await UserModel.create({
        name,
        email,
        provider: "github",
        providerId,
        avatar,
      });
    } else {
      user.avatar = avatar;
      await user.save();
    }

    await createSession(res, user._id.toString());
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("[Auth] GitHub OAuth error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
