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
                    const page = parseInt(req.query.page) || 0;
                    const size = parseInt(req.query.size) || 10;
                    const text = req.query.search || '';
                    const filterCategory = req.query.category || '';
                    const filterBrand = req.query.brand || '';
                    const sortBy = req.query.sortBy || '';
                    const minPrice = parseInt(req.query.minPrice) || 0;
                    const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
            
                    let query = {
                        productName: { $regex: text, $options: "i" },
                        price: { $gte: minPrice, $lte: maxPrice }
                    };
            
                    if (filterCategory) {
                        query.category = filterCategory;
                    }
                    if (filterBrand) {
                        query.brand = filterBrand;
                    }
            
                    let sortQuery = {};
                    if (sortBy === 'High to low') {
                        sortQuery = { price: -1 };
                    } else if (sortBy === 'Low to high') {
                        sortQuery = { price: 1 };
                    } else if (sortBy === 'Newest Product') {
                        sortQuery = { createdAt: -1 }; 
                    }
            
                    const totalProducts = await ProductCollections.countDocuments(query);
            
                    const products = await ProductCollections.find(query)
                        .sort(sortQuery)
                        .skip(page * size)
                        .limit(size)
                        .toArray();
            
                    res.send({ products, totalProducts });
                } catch (error) {
                    console.error('Error fetching products:', error);
                    res.status(500).json({ error: 'Failed to fetch products. Please try again later.' });
                }
            });
            
        app.get("/api/productCounts", async (req, res) => {
            const text = req.query.search;
            let query = {
                productName: { $regex: text, $options: "i" },
            };
            const result = await ProductCollections.countDocuments(query);
            res.send({ count: result });
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
