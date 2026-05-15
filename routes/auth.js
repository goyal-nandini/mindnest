import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import db from "../db.js";

const router = express.Router();
const SALT_ROUNDS = 10;

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

router.get("/register", (req, res) => {
  res.render("register.ejs");
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// google oauth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  }),
);

// local login
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  }),
);

// register
router.post("/register", async (req, res) => {
  const { username: email, password, name } = req.body;
  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) return res.redirect("/login");

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
      [email, hash, name],
    );

    req.login(result.rows[0], (err) => {
      if (err) return res.redirect("/login");
      res.redirect("/dashboard");
    });
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
});

export default router;
