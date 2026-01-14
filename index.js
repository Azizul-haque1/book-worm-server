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
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

const allBooks = [
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    rating: 4.8,
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
    genre: "Fiction",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    rating: 4.9,
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400",
    genre: "Self-Help",
    description:
      "A practical guide to breaking bad habits and building good ones by focusing on tiny, consistent changes that lead to remarkable results.",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    rating: 4.9,
    cover:
      "https://images.unsplash.com/photo-1614544048536-0d28caf77f41?auto=format&fit=crop&q=80&w=400",
    genre: "Sci-Fi",
    description:
      "A lone astronaut must use his scientific knowledge and wit to save humanity from an extinction-level threat while millions of miles from home.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    rating: 4.7,
    cover:
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400",
    genre: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, this epic story follows Paul Atreides as he navigates politics, religion, and power in a battle for the universe's most valuable resource.",
  },
  {
    title: "Educated",
    author: "Tara Westover",
    rating: 4.8,
    cover:
      "https://images.unsplash.com/photo-1571167530472-83b38031d60b?auto=format&fit=crop&q=80&w=400",
    genre: "Memoir",
    description:
      "A memoir about a woman born to survivalists in the mountains of Idaho who overcomes a violent and isolated upbringing to earn a PhD from Cambridge University.",
  },
  {
    title: "1984",
    author: "George Orwell",
    rating: 4.6,
    cover:
      "https://images.unsplash.com/photo-1531901599143-df5010ab9438?auto=format&fit=crop&q=80&w=400",
    genre: "Fiction",
    description:
      "A dystopian masterpiece that explores the dangers of totalitarianism, surveillance, and the manipulation of truth in a world governed by Big Brother.",
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    rating: 4.7,
    cover:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    genre: "History",
    description:
      "A provocative look at the history of humankind, from the first humans to walk the earth to the radical breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    rating: 4.7,
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    genre: "Fiction",
    description:
      "An inspiring fable about Santiago, a shepherd boy who travels across the Egyptian desert in search of a hidden treasure, discovering the importance of listening to one's heart.",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    rating: 4.5,
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400",
    genre: "Non-Fiction",
    description:
      "Nobel laureate Daniel Kahneman explains the two systems that drive our thinking: System 1 (fast and intuitive) and System 2 (slow and logical).",
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    rating: 4.4,
    cover:
      "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=400",
    genre: "Classics",
    description:
      "A classic of American literature that examines themes of wealth, class, and the elusive nature of the American Dream in the Roaring Twenties.",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    rating: 4.9,
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
    genre: "Classics",
    description:
      "Through the eyes of young Scout Finch, this novel explores the deep-rooted racial injustice and loss of innocence in a small Southern town.",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    rating: 4.8,
    cover:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    genre: "Romance",
    description:
      "The sparkling tale of Elizabeth Bennet and Mr. Darcy as they navigate the social complexities of 19th-century England and overcome their own misconceptions.",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    rating: 4.9,
    cover:
      "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?auto=format&fit=crop&q=80&w=400",
    genre: "Fantasy",
    description:
      "Bilbo Baggins, a home-loving hobbit, is whisked away on an epic quest to help a group of dwarves reclaim their mountain home from the dragon Smaug.",
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    rating: 4.7,
    cover:
      "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=400",
    genre: "Biography",
    description:
      "A riveting biography based on years of interviews with Steve Jobs, exploring the life of the creative entrepreneur who revolutionized multiple industries.",
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    rating: 4.5,
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400",
    genre: "Mystery",
    description:
      "A psychological thriller about a famous painter who shoots her husband and never says another word, and the therapist obsessed with uncovering her motive.",
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    rating: 4.3,
    cover:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    genre: "Mystery",
    description:
      "When Amy Dunne disappears on her fifth wedding anniversary, all eyes turn to her husband Nick. A dark, twisty exploration of a marriage gone wrong.",
  },
  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    rating: 4.4,
    cover:
      "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=400",
    genre: "Mystery",
    description:
      "Symbologist Robert Langdon follows a trail of clues hidden in the works of Leonardo da Vinci to solve a murder and uncover a secret that could shake the foundations of history.",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    rating: 4.8,
    cover:
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400",
    genre: "Memoir",
    description:
      "An intimate and powerful memoir by the former First Lady of the United States, chronicling the experiences that have shaped her from childhood to the White House.",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    rating: 4.8,
    cover:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400",
    genre: "Tech",
    description:
      "A must-read for software developers, this book provides the principles and best practices for writing code that is clean, readable, and maintainable.",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    rating: 4.6,
    cover:
      "https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80&w=400",
    genre: "Business",
    description:
      "Entrepreneur Peter Thiel explores how to find singular ways to create new things and build a future that is fundamentally different from the present.",
  },
];

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
        { id: user._id, email: user.email, role: user.role },
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
        const query = { email: req.user.email };

        const user = await usersCollection.findOne(query, {
          projection: { password: 0, shelves: 0 },
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

    // all users api
    app.get("/users", async (req, res) => {
      const users = await usersCollection
        .find({}, { projection: { password: 0, shelves: 0 } })
        .toArray();

      res.json(users);
    });

    // user role update api
    app.patch("/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
      const { role } = req.body;
      console.log("role", role);

      await usersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { role } }
      );

      res.json({ message: "Role updated" });
    });

    // delete user api
    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      console.log("id", req.params.id);
      await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "User deleted" });
    });

    // get all books api

    app.get("/books", async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.json(books);
    });

    // Get single book
    app.get("/books/:id", async (req, res) => {
      const book = await booksCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(book);
    });

    // Admin add book
    app.post("/books", verifyToken, verifyAdmin, async (req, res) => {
      const book = {
        ...req.body,
        avgRating: req.body.rating,
        totalReads: 0,
        createdAt: new Date(),
      };

      const result = await booksCollection.insertOne(book);
      res.json({ message: "Book added", id: result.insertedId });
    });

    // seedBooks();

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
