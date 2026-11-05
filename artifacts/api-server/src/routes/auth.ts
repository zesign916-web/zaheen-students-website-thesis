import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Legacy login (email + optional name) — existing users
router.post("/auth/login", async (req, res) => {
  const { name: rawName, email: rawEmail } = req.body ?? {};

  if (!isValidEmail(rawEmail)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const email = rawEmail.toLowerCase().trim();
  const name = (typeof rawName === "string" && rawName.trim()
    ? rawName.trim()
    : email.split("@")[0]);

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      res.json(existing);
      return;
    }

    const [newUser] = await db
      .insert(users)
      .values({ id: randomUUID(), name, email })
      .returning();
    res.status(201).json(newUser);
  } catch (err) {
    req.log.error({ err }, "Failed to login/register user");
    res.status(500).json({ error: "Failed to authenticate" });
  }
});

// Full registration with all profile fields
router.post("/auth/register", async (req, res) => {
  const {
    name: rawName,
    email: rawEmail,
    phone: rawPhone,
    gender: rawGender,
    genderCustom: rawGenderCustom,
    agreedToTerms,
  } = req.body ?? {};

  if (!isValidEmail(rawEmail)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (typeof rawName !== "string" || !rawName.trim()) {
    res.status(400).json({ error: "Full name is required" });
    return;
  }
  if (!agreedToTerms) {
    res.status(400).json({ error: "You must agree to the terms" });
    return;
  }

  const email = rawEmail.toLowerCase().trim();
  const name = rawName.trim();
  const phone = typeof rawPhone === "string" && rawPhone.trim() ? rawPhone.trim() : null;
  const gender = typeof rawGender === "string" && rawGender ? rawGender : null;
  const genderCustom = typeof rawGenderCustom === "string" && rawGenderCustom.trim() ? rawGenderCustom.trim() : null;

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      // User already exists — just log them in
      res.json(existing);
      return;
    }

    const [newUser] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        name,
        email,
        phone,
        gender,
        genderCustom,
        authProvider: "email",
        agreedToTerms: true,
        isGuest: false,
      })
      .returning();
    res.status(201).json(newUser);
  } catch (err) {
    req.log.error({ err }, "Failed to register user");
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Guest access — creates a temporary guest account
router.post("/auth/guest", async (req, res) => {
  try {
    const guestId = randomUUID();
    const [guestUser] = await db
      .insert(users)
      .values({
        id: guestId,
        name: "Guest",
        email: `guest_${guestId}@guest.local`,
        authProvider: "guest",
        isGuest: true,
        agreedToTerms: false,
      })
      .returning();
    res.status(201).json(guestUser);
  } catch (err) {
    req.log.error({ err }, "Failed to create guest session");
    res.status(500).json({ error: "Failed to start guest session" });
  }
});

// Google OAuth — placeholder (returns instructions until credentials are set)
router.get("/auth/google", (_req, res) => {
  res.status(503).json({
    error: "Google login is not yet configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
  });
});

router.get("/auth/google/callback", (_req, res) => {
  res.redirect("/?error=google_not_configured");
});

// Facebook OAuth — placeholder
router.get("/auth/facebook", (_req, res) => {
  res.status(503).json({
    error: "Facebook login is not yet configured. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to enable it.",
  });
});

router.get("/auth/facebook/callback", (_req, res) => {
  res.redirect("/?error=facebook_not_configured");
});

router.get("/auth/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/auth/profile", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { name, phone, province, avatarUrl, birthday, tagline, gender, genderCustom } = req.body ?? {};
  const updates: Record<string, string | boolean | null> = {};

  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof phone === "string") updates.phone = phone.trim() || null;
  if (typeof province === "string") updates.province = province.trim() || null;
  if (typeof avatarUrl === "string") updates.avatarUrl = avatarUrl.trim() || null;
  if (typeof birthday === "string") updates.birthday = birthday.trim() || null;
  if (typeof tagline === "string") updates.tagline = tagline.trim() || null;
  if (typeof gender === "string") updates.gender = gender || null;
  if (typeof genderCustom === "string") updates.genderCustom = genderCustom.trim() || null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/auth/account", async (req, res) => {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    await db.delete(users).where(eq(users.id, userId));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete account");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
