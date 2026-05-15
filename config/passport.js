// passport strategies live here...
import "dotenv/config";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import bcrypt from "bcrypt";
import db from "../db.js";

// local strategy
passport.use(
  "local",
  new LocalStrategy(async (username, password, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length === 0) return cb(null, false);

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);

      return valid ? cb(null, user) : cb(null, false);
    } catch (err) {
      return cb(err);
    }
  }),
);

// google startegy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://mindnest-d9jn.onrender.com/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [profile.email, "google", profile.displayName],
          );

          return cb(null, newUser.rows[0]);
        }
        return cb(null, result.rows[0]);
      } catch (err) {
        return cb(err);
      }
    },
  ),
);

// session:
passport.serializeUser((user, cb) => {
  console.log("SERIALIZE — user object:", user); // ← add this
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  console.log("DESERIALIZE — id received:", id); // ← add this
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    console.log("DESERIALIZE — user found:", result.rows[0]); // ← add this
    cb(null, result.rows[0]);
  } catch (err) {
    cb(err);
  }
});

/*Why "config" Specifically?

Config = configuration = setup that happens once when app starts.
Passport strategies are configured once at boot — they don't change per request. 
So they live in config/. Makes sense when you read the folder name — "oh this is 
how the app is configured." */