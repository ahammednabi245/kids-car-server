const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('kids playing with toy car')
})

app.listen(port, () => {
  console.log(`kids car server is running on port: ${port}`);
})