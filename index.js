const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrif73o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const pakagesCollection = client.db('pakagesDB').collection('pakages');
    const bookingsCollection = client.db('pakagesDB').collection('bookings');



    app.post('/create-payment-intent', async (req, res) => {
      const price = req.body.price;
      const priceInCent = parseFloat(price) * 100
      if (!price || priceInCent < 1) {
        return res.status(400).send({ error: "Invalid price" });
      }

      // generate client secret
      const { client_secret } = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // send client secret as response
      res.send({ clientSecret: client_secret })
    })
    // get all tour spot
    app.get('/all-spots', async (req, res) => {
      const result = await pakagesCollection.find().toArray();
      res.send(result)
    })

    // save a bookings data in db
    app.post('/booking',  async (req, res) => {
      const bookingData = req.body;
      // save room booking
      const result = await bookingsCollection.insertOne(bookingData);
      res.send(result)
    })



    app.post('/addTour', async (req, res) => {
      const newPakages = req.body;
      console.log(newPakages);
      const result = await pakagesCollection.insertOne(newPakages);
      res.send(result)
    })





    app.get('/mySpot/:email', async (req, res) => {
      console.log(req.params.email)
      const result = await pakagesCollection.find({ email: req.params.email }).toArray();
      res.send(result);
    })

    app.get("/singleSpot/:id", async (req, res) => {
      console.log(req.params.id);
      const result = await pakagesCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(result)
    })

    app.put("/update/:id", async (req, res) => {
      console.log(req.params.id);
      const quary = { _id: new ObjectId(req.params.id) };
      const data = {
        $set: {
          name: req.body.name,
          location: req.body.location,
          country: req.body.country,
          seasonality: req.body.seasonalit,
          details: req.body.details,
          price: req.body.price,
          travel: req.body.travel,
          visitor: req.body.visitor,
          image: req.body.image

        }
      }
      const result = await pakagesCollection.updateOne(quary, data);
      res.send(result)
    })

    app.delete('/delete/:id', async (req, res) => {
      const result = await pakagesCollection.deleteOne({ _id: new ObjectId(req.params.id) })
      console.log(result);
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
  res.send('Tourism management server is running')

});

app.listen(port, () => {
  console.log(`tourism management server is running on port : ${port}`)
});


