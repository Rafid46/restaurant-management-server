const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
// const secret = "heeeeellllllooooo";
const cookieParser = require("cookie-parser");
require("dotenv").config();
// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);
const port = process.env.PORT || 5008;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { parse } = require("dotenv");
// middleware;
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://restaurant-management-4c7d4.web.app",
      "https://restaurant-management-4c7d4.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j1gssm8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// middleWars
const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
};
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log("token in the middleware", token);
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // top 6 food get
    // app.get("/api/topFood", async (req, res) => {
    //   try {
    //     // Sort the food items by the 'count' property in descending order
    //     const topFood = await foodCollection
    //       .find()
    //       .sort({ count: -1 }) // Sort in descending order based on count
    //       .limit(6) // Limit the result to the top 6 items
    //       .toArray();

    //     res.json(topFood);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: "Failed to retrieve top-selling food." });
    //   }
    // });
    // food get count
    app.get("/productsCount", async (req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count });
    });
    // user(email)
    const userCollection = client.db("restaurant").collection("user");
    const foodCollection = client.db("restaurant").collection("foods");
    const orderedCollection = client.db("restaurant").collection("orderedFood");
    app.post("/api/foods", async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });
    app.get("/api/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const filter = req.query;
      // const query = {};
      // if (filter.search) {
      //   // If present, add the "foodName" query with regex
      //   query.foodName = { $regex: filter.search };
      // }
      // console.log("pagination", page, size);
      const query = {
        foodName: { $regex: filter.search, $options: "i" },
      };
      const result = await foodCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });
    // details get
    app.get("/api/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    // user related apis
    app.post("/api/user", logger, verifyToken, async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // purchase api
    // post purchased/ordered products
    app.post("/api/purchaseFood", async (req, res) => {
      const newFood = req.body;
      console.log(newFood);
      const result = await orderedCollection.insertOne(newFood);
      res.send(result);
    });
    // api get to show the data of my ordered food
    app.get("/api/purchaseFood", logger, verifyToken, async (req, res) => {
      console.log("coookiiees", req.cookies);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await orderedCollection.find(query).toArray();
      res.send(result);
    });
    // add products
    app.post("/api/addedFood", logger, verifyToken, async (req, res) => {
      const newFood = req.body;
      console.log(newFood);
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });
    // add product get
    app.get("/api/addedFood", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });
    // delete
    app.delete("/api/purchaseFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await orderedCollection.deleteOne(query);
      res.send(result);
    });
    // UPDATE GET
    app.get("/api/foods", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });
    // update
    app.put("/api/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const foods = req.body;
      const product = {
        $set: {
          foodName: foods.foodName,
          image: foods.image,
          price: foods.price,
          description: foods.description,
          quantity: foods.quantity,
          foodOrigin: foods.foodOrigin,
          category: foods.category,
        },
      };
      const result = await foodCollection.updateOne(filter, product, options);
      res.send(result);
    });

    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });
    // jwt logout
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logged out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    // Send a ping to confirm a successful connection
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

app.get("/", (req, res) => {
  res.send("restaurant server is running");
});
app.listen(port, () => {
  console.log(`restaurant server in running port:${port}`);
});
