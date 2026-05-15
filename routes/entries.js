// routes/entries.js
import express from "express";
import db from "../db.js";

const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// Mood quotes library 
const moodQuotes = {
  calm: [
    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
    { text: "Calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Peace is not the absence of chaos, but the presence of calm within it.", author: "Unknown" },
    { text: "Breathe. You are exactly where you need to be.", author: "Unknown" },
  ],
  motivated: [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Small steps every day lead to big changes over time.", author: "Unknown" },
    { text: "Your future self is watching you right now through your memories.", author: "Unknown" },
  ],
  reflective: [
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "We do not learn from experience. We learn from reflecting on experience.", author: "John Dewey" },
    { text: "Journal writing is a voyage to the interior.", author: "Christina Baldwin" },
    { text: "In the journal I do not just express myself more openly than I could to any person; I create myself.", author: "Susan Sontag" },
    { text: "Writing is thinking on paper.", author: "William Zinsser" },
  ],
  hopeful: [
    { text: "Hope is being able to see that there is light despite all of the darkness.", author: "Desmond Tutu" },
    { text: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
    { text: "You are braver than you believe, stronger than you seem.", author: "A.A. Milne" },
    { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
    { text: "Tomorrow is always fresh, with no mistakes in it yet.", author: "L.M. Montgomery" },
  ],
  low: [
    { text: "It's okay to not be okay. Just don't give up.", author: "Unknown" },
    { text: "You don't have to be positive all the time. It's perfectly okay to feel sad.", author: "Lori Deschene" },
    { text: "Writing is medicine. It is an appropriate antidote to injury.", author: "Julia Cameron" },
    { text: "Be gentle with yourself. You are a child of the universe.", author: "Max Ehrmann" },
    { text: "Sometimes the bravest thing you can do is keep going.", author: "Unknown" },
  ],
};

//  Welcome / Dashboard 
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("welcome.ejs", { user: req.user });
});

//  Journal (all entries) 
router.get("/journal", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, LEFT(content, 150) AS preview, created_at, updated_at, mood
       FROM entries WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.render("dashboard.ejs", {
      user: req.user,
      entries: result.rows,
      searchQuery: undefined,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
});

//  Quotes API endpoint (called by JS fetch) 
router.get("/api/quote", isAuthenticated, (req, res) => {
  const mood = req.query.mood || "hopeful";
  const quotes = moodQuotes[mood] || moodQuotes.hopeful;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json(quote);
});

//  Search 
router.get("/search", isAuthenticated, async (req, res) => {
  const query = req.query.q?.trim() || "";
  try {
    const result = await db.query(
      `SELECT id, title, LEFT(content, 150) AS preview, created_at, updated_at, mood
       FROM entries
       WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2)
       ORDER BY created_at DESC`,
      [req.user.id, `%${query}%`]
    );
    res.render("dashboard.ejs", {
      user: req.user,
      entries: result.rows,
      searchQuery: query,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/journal");
  }
});

//  New Entry 
router.get("/entry/new", isAuthenticated, (req, res) => {
  res.render("new-entry.ejs");
});

router.post("/entry/new", isAuthenticated, async (req, res) => {
  const { title, content, mood } = req.body;   // ← add mood
  try {
    await db.query(
      `INSERT INTO entries (user_id, title, content, mood) VALUES ($1, $2, $3, $4)`,
      [req.user.id, title, content, mood || 'calm']
    );
    res.redirect("/journal");
  } catch (err) {
    console.error(err);
    res.redirect("/entry/new");
  }
});

//  View Entry 
router.get("/entry/:id", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM entries WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.redirect("/journal");
    res.render("view-entry.ejs", { entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.redirect("/journal");
  }
});

//  Edit Entry 
router.get("/entry/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM entries WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.redirect("/journal");
    res.render("edit-entry.ejs", { entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.redirect("/journal");
  }
});

router.post("/entry/:id/edit", isAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  try {
    await db.query(
      `UPDATE entries SET title=$1, content=$2, updated_at=CURRENT_TIMESTAMP
       WHERE id=$3 AND user_id=$4`,
      [title, content, req.params.id, req.user.id]
    );
    res.redirect(`/entry/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.redirect("/journal");
  }
});

//  Delete Entry 
router.post("/entry/:id/delete", isAuthenticated, async (req, res) => {
  try {
    await db.query(
      `DELETE FROM entries WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    res.redirect("/journal");
  } catch (err) {
    console.error(err);
    res.redirect("/journal");
  }
});

router.get("/api/stats", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) AS total_entries FROM entries WHERE user_id = $1`,
      [req.user.id]
    );

    // Consecutive streak calculation
    const daysResult = await db.query(
      `SELECT DISTINCT DATE(created_at AT TIME ZONE 'Asia/Kolkata') AS day
       FROM entries WHERE user_id = $1
       ORDER BY day DESC`,
      [req.user.id]
    );

    const days = daysResult.rows.map(r => r.day.toISOString().split('T')[0]);
    let streak = 0;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date(Date.now() - 86400000)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (days.length > 0 && (days[0] === today || days[0] === yesterday)) {
      streak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]);
        const curr = new Date(days[i]);
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else break;
      }
    }

    res.json({
      totalEntries: parseInt(result.rows[0].total_entries),
      uniqueDays: streak,
    });
  } catch (err) {
    res.json({ totalEntries: 0, uniqueDays: 0 });
  }
});

export default router;