var express = require("express")
var httpProxy = require("http-proxy")

//Proxy server to allow redirection to topic modeller
var proxy = httpProxy.createProxyServer(); 
var app = express();

var app_server = "http://localhost:3000";
var topic_modeller_server = "http://localhost:3001";

app.use("/", function(request, response) {
    console.log('redirecting to main app');
    proxy.web(request, response, {target: app_server});
});

app.use("/examples", function(request, response) {
    console.log('redirecting to main app');
    proxy.web(request, response, {target: app_server});
});

app.use("/network", function(request, response) {
    console.log('redirecting to main app');
    proxy.web(request, response, {target: app_server});
});

app.use("/about", function(request, response) {
    console.log('redirecting to main app');
    proxy.web(request, response, {target: app_server});
});

app.use("/contribute", function(request, response) {
    console.log('redirecting to main app');
    proxy.web(request, response, {target: app_server});
});

app.use("/topic_modeller", function(request, response) {
    console.log('redirecting to topic modeller');
    proxy.web(request, response, {target: topic_modeller_server});
});

app.listen(80);