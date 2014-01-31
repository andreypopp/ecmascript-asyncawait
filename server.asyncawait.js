﻿var http = require('http');
var Q = require('q');
var request = require('./request.js');
var headers = { 'User-Agent': 'lukehoban', 'Authorization': 'token 3e9852ce188aa2f097a1e5dd6fbd36f73020a1d5' };

// Promise-returning asynchronous function
async function getCollaboratorImages(full_name) {
  // any exceptions thrown here will propogate into try/catch in callers - same as synchronous
  var url = 'https://api.github.com/repos/' + full_name + '/collaborators';
  // await a promise-returning async HTTP GET - same as synchronous 
  var [response, body] = await request({url: url, headers: headers}); 
  return JSON.parse(body).map(function(collab) {
    return collab.avatar_url;
  });
}

// can use a `async function` here because createServer doesn't care what this returns
http.createServer(async function (req, res) {
  console.log('starting...')
  var url = 'https://api.github.com/search/repositories?per_page=100&q=' + 'tetris';
  var items = [];
  // write a normal 'synchronous' while loop
  while(true) { 
    console.log('Got ' + items.length + ' items total.  Next: ' + url);
    // use normal exception handling
    try { 
      // promise-returning async HTTP GET
      var [response, body] = await request({url: url, headers: headers});
      var items = JSON.parse(body).items;
      // nested parallel work is still possible with Q.all (could be future await* ?)
      var newItems = Q.all(items.map(async (item) => ({ 
        full_name: item.full_name, 
        collabs_images: await getCollaboratorImages(item.full_name)
      })));
      items = items.concat(await newItems);
      url = (/<(.*)>; rel="next"/.exec(response.headers.link) || [])[1];
      // break once there is no 'next' link
      if(!url) break; 
    } catch(err) {
      console.log('backing off... ' + err);
      // backoff on any error
      await Q.timeout(1000); 
      // then try again
      continue;  
    }
  }
  // when done, write response - appears in the usual synchronous 'at the end' 
  console.log('Done. Got ' + items.length + ' items total.');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(items));    
}).listen(process.env.port || 1337);
console.log("Listening on http://127.0.0.1:" + (process.env.port || 1337));
