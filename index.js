const { MongoClient, ServerApiVersion } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.djweinm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// middleware
app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

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
        const ProductCollections = client
            .db("productDB")
            .collection("products");

        app.get('/api/products', async (req, res) => {
            try {
                const page = parseInt(req.query.page);
                const size = parseInt(req.query.size);
                const text = req.query.search;
                let query = {
                    productName: { $regex: text, $options: "i" },
                };
                const result = await ProductCollections
                    .find(query)
                    .skip(page * size)
                    .limit(size)
                    .sort({ _id: -1 })
                    .toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).json({ error: 'Failed to fetch products. Please try again later.' });
            }
        });




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Optionally, you can close the MongoDB client connection here
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
    res.send("Testing Server");
});
app.listen(port, () => {
    console.log("Backend is running at ", port);
});
