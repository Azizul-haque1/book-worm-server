require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const port = process.env.PORT || 4000;
const cookieParser = require("cookie-parser");

const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.URI;

// middleware
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log("token", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = decoded; // { id, email }
    console.log(req.user);
    next();
  });
};

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("book worm server running");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("bookworm");
    // Collections
    const usersCollection = db.collection("users");
    const booksCollection = db.collection("books");
    const genresCollection = db.collection("genres");
    const reviewsCollection = db.collection("reviews");
    const tutorialsCollection = db.collection("tutorials");
    const activitiesCollection = db.collection("activities");

    // Send a ping to confirm a successful connection
    // Register user
    app.post("/register", async (req, res) => {
      try {
        const { name, email, password, image } = req.body;

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser)
          return res.status(400).json({ message: "Email already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        console.log({ name, email, hashedPassword, image });

        // res.json({ ok: "ok" });
        // // Insert user
        const newUser = {
          name,
          email,
          password: hashedPassword,
          image,
          role: "user",
          shelves: { wantToRead: [], currentlyReading: [], read: [] },
          readingGoal: 0,
          createdAt: new Date(),
        };
        const result = await usersCollection.insertOne(newUser);

        res
          .status(201)
          .json({ message: "User registered", userId: result.insertedId });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // create token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // store token in cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      });
    });

    app.get("/me", verifyToken, async (req, res) => {
      try {
        const query = { email: req.user.email }; // <-- convert string to ObjectId

        const user = await usersCollection.findOne(query, {
          projection: { password: 0 }, // don't send password
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // Logout
    app.post("/logout", (req, res) => {
      res.clearCookie("token");
      res.json({ message: "Logged out" });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`book worm server running on port ${port}`);
});
