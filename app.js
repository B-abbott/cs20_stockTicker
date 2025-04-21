const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

const mongoUri = process.env.MONGO_URI;
const dbName = 'Stock';
const collectionName = 'PublicCompanies';

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'home.html'));
});

app.get('/process', async (req, res) => {
  const query = req.query.query;
  const searchBy = req.query.searchBy;

  if (!query || !searchBy) {
    return res.send('Invalid input.');
  }

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    let results = [];

    if (searchBy === 'ticker') {
      results = await collection.find({ ticker: query.toUpperCase() }).toArray();
    } else if (searchBy === 'name') {
      results = await collection.find({ name: { $regex: new RegExp(query, 'i') } }).toArray();
    }

    results.forEach(company => {
      console.log(`Company: ${company.name}, Ticker: ${company.ticker}, Price: $${company.price}`);
    });

    
    let html = '<h1>Search Results</h1>';
    if (results.length === 0) {
      html += '<p>No results found.</p>';
    } else {
      results.forEach(company => {
        html += `<p><strong>${company.name}</strong> (${company.ticker}): $${company.price}</p>`;
      });
    }

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});