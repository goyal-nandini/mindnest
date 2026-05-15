// app's entry point and control tower, wires everything
import env from "dotenv";
env.config(); // Load environment variables first

import express from "express";
import session from "express-session";
import passport from "passport";
import db from "./db.js";

import "./config/passport.js"; // registers passport strategies
import authRoutes from "./routes/auth.js";
import entryRoutes from "./routes/entries.js";

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.set("view engine", "ejs"); // The Page Renderer
app.use(express.urlencoded({extended: true})); // The Form Data Parser
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Make greeting available to all views via res.locals
app.use((req, res, next) => {
  const hour = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", hour: "numeric", hour12: false
  });
  const h = parseInt(hour);
  res.locals.greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  next();
});

/*Why res.locals? Anything you put here is automatically available in every EJS 
template without passing it manually. No need to add greeting to every res.render() call. */

// routes:
app.get("/", async (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/dashboard");

  try {
    const [usersResult, entriesResult, writersResult] = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM users"),
      db.query("SELECT COUNT(*) AS total FROM entries"),
      db.query("SELECT COUNT(DISTINCT user_id) AS total FROM entries"),
    ]);

    const journalsCreated = parseInt(usersResult.rows[0].total, 10);
    const entriesWritten = parseInt(entriesResult.rows[0].total, 10);
    const happyWriters = parseInt(writersResult.rows[0].total, 10);

    res.render("home.ejs", {
      journalsCreated,
      entriesWritten,
      happyWriters,
    });
  } catch (err) {
    console.error("Home counter query failed:", err);
    res.render("home.ejs", {
      journalsCreated: 0,
      entriesWritten: 0,
      happyWriters: 0,
    });
  }
});
app.use("/", authRoutes);
app.use("/", entryRoutes);

// debugging route
app.get("/check", (req, res) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  console.log("Authenticated:", req.isAuthenticated());
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null,
    session: req.session
  });
});

// start
app.listen(PORT, () => console.log(`MindNest running on port ${PORT}`));

/*
| **Feature**     | **Direction**                 | **Purpose**                                   | **Result** |
| **[View engine]** | Outgoing (Server → User) | To display dynamic web pages. | Renders HTML from templates. |
| **[Urlencoded]** | Incoming (User → Server) | To read data submitted in forms. | Populates the ``req.body`` object. | 
*/

/*
| **Feature**       | **[extended: false]**             | **[extended: true (Uses qs)]** |
| **[Library Used]** | ``querystring`` (Built-in Node) | ``qs`` (Third-party) |
| **[Data Depth]** | Only flat objects/strings. | Supports nested objects and arrays. |
| **[Standard?]** | Deprecated for many modern uses. | Industry standard for Express apps. |
*/