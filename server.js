var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server')
var cache = {};

/* Send 404 errors when a file requested doesn't exist */
function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

/* Write the appropriate HTTP headers and then send the contents of the file */
function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200,
    {"Content-Type": mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
  // Check if file is cached in memory
  if (cache[absPath]) {
    // Serve file from memory
    sendFile(response, absPath, cache[absPath]);
  } else {
    // Check if file exists
    fs.exists(absPath, function(exists) {
      if (exists) {
        // Read file from disk
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            // Serve file read from disk
            sendFile(response, absPath, data)
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

/* Create HTTP server, using anonymous function to define per-request behaviour */
var server = http.createServer(function(request, response) {
  var filePath = false;
  if (request.url == '/') {
    // Determine HTML file to be served by defaulst
    filePath = 'public/index.html';
  } else {
    // Translate URL ath to relative file path
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  // Serve static file
  serveStatic(response, cache, absPath);
});

server.listen(3000, function() {
  console.log("Server listening on port 3000.");
});

chatServer.listen(server);
