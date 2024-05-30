const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
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
            "http://localhost:5175",
            "https://newstally-blogsites.web.app",
            "https://newstally-blogsites.firebaseapp.com"
        ],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);
app.use(express.json());
app.use(cookieParser());

// verify jwt middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if(!token) return res.status(401).send({message: 'unauthorised token'})
        if(token){
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=> {
                if(error){
                    return res.status(401).send({message: 'unauthorised token'})
                }
                // console.log(decoded);
                req.user = decoded 
                next();
            })
        }
}

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
    const commentCollection = client.db("newstally").collection("comments");

    // Jwt generate
    app.post('/jwt', async(req, res)=>{
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '365d'})
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({success: true})
    })

    // Clear token during logout
    app.get('/logout', (req, res) =>{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 0,
        })
        .send({success: true})
    })

    // Get all blogs from DB
    app.get('/blogs', async(req, res) => {
        const result = await blogsCollection.find().toArray();
        res.send(result)
    })
    // Get a single blog from DB
    app.get('/blogs/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await blogsCollection.findOne(query)
        res.send(result);
    })

    // Save a blog in db
    app.post('/blogs', async(req, res)=> {
        const blogData = req.body;
        const result = await blogsCollection.insertOne(blogData);
        res.send(result)
    })

    // Save a comment in db
    app.post('/comments', async(req, res)=> {
        const commentData = req.body;
        const result = await commentCollection.insertOne(commentData);
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

    // Get all blogs from DB
    app.get('/wishlist-blog', async(req, res) => {
        const result = await wishlistCollection.find().toArray();
        res.send(result)
    })

    // Get all blogs from a specific user from DB though email
    app.get('/blog/:email', verifyToken, async (req, res) => {
        const tokenEmail = req.user.email
        const email = req.params.email
        if(tokenEmail !== email){
            return res.status(403).send({message: 'forbidden token'})
        }
        const query = {'owner.email': email}
        const result = await blogsCollection.find(query).toArray()
        res.send(result)
    })

    // Get all wishlist from a specific user from DB though email
    app.get('/wishlist-blog/:email', async (req, res) => {
        const email = req.params.email
        const query = {'user.email' : email}
        const result = await wishlistCollection.find(query).toArray()
        res.send(result)
    })

    // save a blog in a wishlist collection
    app.post('/wishlist-blog', async (req, res)=>{
        const wishListData = req.body
        console.log(wishListData)
        const result = await wishlistCollection.insertOne(wishListData)
        res.send(result)
    })

    // Delete a blog from wishlist
    app.delete('/wishlist-blog/:id', async (req, res) => {
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result  = await wishlistCollection.deleteOne(query)
        res.send(result)
    })

    // Get all blogs from DB by filter and search
    app.get('/all-blogs', async(req, res) => {
        const filter = req.query.filter
        const search = req.query.search
        let query = {
            title: { $regex: search, $options: 'i' },
        }
        if(filter) query.category = filter
        const result = await blogsCollection.find(query).toArray();
        res.send(result)
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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