const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6rgz80t.mongodb.net/?retryWrites=true&w=majority`;


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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('kidCar').collection('shopByCategory');
    const toyCollection = client.db('kidCar').collection('toy');



    // Shop By Category

    app.get('/category', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    // Shop By Category Id

    app.get('/category/:category_id', async (req, res) => {
      const categoryId = req.params.category_id;
      const query = {
        $or: [
          { 'PoliceCars.category_id': parseInt(categoryId) },
          { 'SportsCars.category_id': parseInt(categoryId) },
          { 'Jeeps.category_id': parseInt(categoryId) },
        ],
      };

      const result = await serviceCollection.findOne(query);
      if (result) {
        let filteredResult = null;

        for (const category in result) {
          if (Array.isArray(result[category])) {
            filteredResult = result[category].find(
              (item) => item.category_id == categoryId
            );
            if (filteredResult) {
              break;
            }
          }
        }

        if (filteredResult) {
          res.send(filteredResult);
        } else {
          res.status(404).send('Category id not found');
        }
      } else {
        res.status(404).send('Category id not found');
      }
    });





    // all  toy

    app.get("/allToys", async (req, res) => {
      const toys = await toyCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.send(toys);
    });




    // All Toys Limitation

    app.get('/allToys', async (req, res) => {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      try {
        const result = await toyCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });


    // All toys Search Implement

    app.get("/allToysByText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toyCollection
        .find({
          $or: [
            { name: { $regex: text, $options: "i" } },
            { subCategory: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });




    // All Toys Id

    app.get('/allToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { name: 1, quantity: 1, sellerName: 1, sellerEmail: 1, price: 1, rating: 1, subCategory: 1, description: 1, photo: 1 },
      };

      const result = await toyCollection.findOne(query, options);
      res.send(result);
    })







    //  Add Toy

    app.post("/postToy", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      console.log(body);
      const result = await toyCollection.insertOne(body);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again later",
          status: false,
        });
      }
    });


    // My toys

    app.get("/myToys/:email", async (req, res) => {
      console.log(req.params.email);
      const toys = await toyCollection
        .find({
          sellerEmail: req.params.email,
        })
        .toArray();
      res.send(toys);
    });

    // Update My toys 


    app.put('/updateToy/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(body);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: body.name,
          quantity: body.quantity,
          sellerName: body.sellerName,
          sellerEmail: body.sellerEmail,
          price: body.price,
          rating: body.rating,
          subCategory: body.subCategory,
          description: body.description,
          photo: body.photo,
        },
      };
      const result = await toyCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('kids playing with toy car');
});

app.listen(port, () => {
  console.log(`kids car server is running on port: ${port}`);
});
