const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clustera.xilruvy.mongodb.net/?retryWrites=true&w=majority&appName=ClusterA`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();

    const blogsCollection = client.db("newstally").collection("Blogs");
    const wishlistCollection = client.db("newstally").collection("wishlist");

    // Get all blogs from DB
    app.get('/blogs', async(req, res) => {
        const result = await blogsCollection.find().toArray();
        res.send(result)
    })

    // Save a blog in db
    app.post('/blogs', async(req, res)=> {
        const blogData = req.body;
        const result = await blogsCollection.insertOne(blogData);
        res.send(result)
    })

    // Update a blog db
    app.put('/blogs/:id', async (req, res) => {
        const blogData = req.body;
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const options = { upsert: true }
        const updatedDoc = {
            $set: { ...blogData }
        }
        const result = await blogsCollection.updateOne(query, updatedDoc, options);
        res.send(result)
    })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send("NewsTally server is running!")
})

app.listen(port, () =>{
    console.log('Server is running on port:', port)
})