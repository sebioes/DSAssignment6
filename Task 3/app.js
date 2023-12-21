const express = require("express");
const cors = require('cors');
const app = express();
const http = require('http');
const path = require('path');
const httpServer = http.Server(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);

const QueryEngine = require('@comunica/query-sparql').QueryEngine;

const engine = new QueryEngine();

const port = 5001; //changed to port 5001 as port 5000 was already in use

app.use(cors())

app.use(express.json())

app.use(express.static('public'))



app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/movies', (req, res) => {
  let input_url = req.query.url
  console.log("input url: ", input_url)
  res.statusCode = 200
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, 'index.html'));
  handle_query(input_url)
});

async function handle_query(input_url) {
  let movie_urls = [] //List of movies in the pod
  engine.queryBindings(`SELECT ?v WHERE { ?container <http://www.w3.org/ns/ldp#contains> ?v . }`, { //TODO: complete SPARQL query
    sources: [input_url],
  }).then(function (bindingsStream) {
    bindingsStream.on('data', function (data) {
      movie_urls.push(data.get('v').value) //Variable ?v in the SPARQL query.
    });
    bindingsStream.on('end', function () {
      engine.queryBindings(`SELECT ?name ?image WHERE { ?movie <https://schema.org/name> ?name. ?movie <https://schema.org/image> ?image.}`, { //TODO: complete SPARQL query
        sources: movie_urls,
      }).then(function (bindingsStream) {
        bindingsStream.on('data', function (data) {
          let obj = {
            "name": data.get('name').value, //Variable ?name in the SPARQL query.
            "image": data.get('image').value //Variable ?image in the SPARQL query.
          };
          io.emit('update', { 'message': obj }) //Send information to the browser.
        });
      });
    })

  });
}

/*

async function handle_custom_query(input_url) {
  let movie_urls = [] //List of movies in the pod
  engine.queryBindings(`SELECT ?v WHERE { ?container <http://www.w3.org/ns/ldp#contains> ?v . }`, { //TODO: complete SPARQL query
    sources: [input_url],
  }).then(function (bindingsStream) {
    bindingsStream.on('data', function (data) {
      movie_urls.push(data.get('v').value) //Variable ?v in the SPARQL query.
    });
    bindingsStream.on('end', function () {
      engine.queryBindings(`SELECT ?name ?image WHERE { ?movie <https://schema.org/name> ?name. ?movie <https://schema.org/image> ?image.}`, { //TODO: complete SPARQL query
        sources: movie_urls,
      }).then(function (bindingsStream) {
        bindingsStream.on('data', function (data) {
          let obj = {
            "name": data.get('name').value, //Variable ?name in the SPARQL query.
            "image": data.get('image').value //Variable ?image in the SPARQL query.
          };
          io.emit('update', { 'message': obj }) //Send information to the browser.
        });
      });
    })

  });

}

*/

httpServer.listen(port),
  () => console.log("Server is running... on " + port);