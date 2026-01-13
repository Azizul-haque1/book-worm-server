require("dotenv").config();
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const port = process.env.PORT || 4000;
const cors = require("cors");

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.URI;

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
    // Connect the client to the server	(optional starting in v4.7)
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
          return res.status(400).json({ error: "Email already exists" });

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
        res.status(500).json({ error: err.message });
      }
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
