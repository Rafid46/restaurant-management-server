const express = require("express");
const cors = require("cors");
const app = express();
// const jwt = require("jsonwebtoken");
// const cookie = require("cookie-parser");
require("dotenv").config();
// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);
const port = process.env.PORT || 5008;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { parse } = require("dotenv");
// middleware;
app.use(cors());
// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     credentials: true,
//   })
// );
app.use(express.json());
// app.use(cookie());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j1gssm8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // user(email)
    const userCollection = client.db("restaurant").collection("user");
    const foodCollection = client.db("restaurant").collection("foods");
    const orderedCollection = client.db("restaurant").collection("orderedFood");
    //food apis
    app.post("/api/foods", async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });
    app.get("/api/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log("pagination", page, size);
      const result = await foodCollection
        .find()
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
    app.post("/api/user", async (req, res) => {
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
    app.get("/api/purchaseFood", async (req, res) => {
      // const result = await orderedCollection.find().toArray();
      // res.send(result);
      // const query = {req.params.email};
      // const result = await orderedCollection
      //   .find({ email: req.params.email })
      //   .toArray();
      // res.send(result);
      // let queryObj = {};
      // const email = req.query.email;
      // if (email) {
      //   queryObj.email = email;
      // }
      // const cursor = orderedCollection.find(queryObj);
      // const result = await cursor.toArray();
      // res.send(result);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await orderedCollection.find(query).toArray();
      res.send(result);
    });
    // add products
    app.post("/api/addedFood", async (req, res) => {
      const newFood = req.body;
      console.log(newFood);
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });
    // add product get
    app.get("/api/addedFood", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });
    // delete
    app.delete("/api/purchaseFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await orderedCollection.deleteOne(query);
      // res.send({
      //   message: "something",
      //   success: true,
      //   data: result,
      // });
      res.send(result);
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
