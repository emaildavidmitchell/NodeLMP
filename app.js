var http = require("http");
var express = require("express");
var morgan = require("morgan"); //for logging
var path = require("path"); 
var bodyParser = require("body-parser"); //for parsing posts
var fs = require("fs"); 
var sparqlclient = require('sparql-client'); //for querying dbpedia
var util = require('util');
var spawn = require("child_process").spawn;

var app = express();

//the folder where are views are
app.set("views", path.resolve(__dirname, "views"));

//using ejs as the view engine
app.set("view engine", "ejs");

//set up the dbpedia client
var endpoint = 'http://dbpedia.org/sparql';
client = new sparqlclient(endpoint);

//read in the list of articles
var articles = {}
fs.readFile("./public/articles.txt", 'utf8', function(err,data) {
	if (err) {
		return console.log(err);
	}
	articles = data.split("\n");
	console.log("Article list loaded");
});

var types = {};
var types_string = "";
fs.readFile("./public/types.txt", 'utf8', function(err,data) {
	if (err) {
		return console.log(err);
	}
	types = data.split("\n");
	types.forEach(function(type) {
		types_string += type;
	});

	console.log("Type list loaded");
});


//logs requests in dev form
app.use(morgan("dev"));

app.use(bodyParser.urlencoded({ extended: false}));

//serving up static files
var publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.use(function(request,response,next) {
	response.locals.articles = articles;
	next();
});

app.get("/", function(request,response) {
	response.render("index");
});


app.post("/network", function(request,response, next) {
	console.log("Searching for " + request.body.search);
	var process = spawn('python3',['/Users/dcmitchell/Desktop/Node/LMP/public/get_article_label.py',request.body.search]);
	
	var wiki_query = "";
	process.stdout.on('data',function(data) {
		wiki_query += data;
	});

	process.stdout.on('end', function() {
		wiki_query = wiki_query.trim();
		request.body.search = wiki_query;
		console.log("Found " + wiki_query);
		response.locals.source = {label: request.query.search, source_data: '', io_data: '', oo_data: '', dr_data: ''}
		next();
	});
}, function (request, response, next) {

	//find source information
	var source_query = "select distinct ?s where {?s rdfs:label '" + request.body.search + "'@en filter regex(?s, 'dbpedia') } LIMIT 1";

	client.query(source_query).execute(function(error, results) {
		console.log("Getting source data");
		response.locals.source.source_data = results.results.bindings;
		next();
	});

}, function(request, response, next) {

	//find inward object relations
	var io_query = "select distinct ?o ?p ?l where {VALUES ?t { " + types_string + " } ?s ?p ?o . ?s rdfs:label '" + request.body.search + 
	"'@en . ?p rdf:type owl:ObjectProperty . ?o rdfs:label ?l . ?o rdf:type ?t . filter langMatches(lang(?l),'EN')} LIMIT 100";

	client.query(io_query).execute(function(error,results) {
		console.log("Getting inward object data");
		response.locals.source.io_data = results.results.bindings;
		next();
	});

}, function(request, response, next) {

	//find data relations
	var dr_query = "select distinct ?p ?o where {?s ?p ?o . ?s rdfs:label '" + request.body.search + 
	"'@en . ?p rdf:type owl:DatatypeProperty} LIMIT 100"

	
	client.query(dr_query).execute(function(error,results) {
		console.log("Getting datatype data");		
		response.locals.source.dr_data = results.results.bindings;
		next();
	});

}, function(request, response) {

	//find the type information
	var type_query = "select distinct ?t where {?s rdfs:label '" + request.body.search + "'@en . ?s rdf:type ?t } LIMIT 50";

	client.query(type_query).execute(function(error,results) {
		console.log("Getting type data");
		response.locals.source.type_data = results.results.bindings;
		response.send(response.locals.source);
	});
});

app.get("/network", function(request,response) {
	
	console.log("Searching for " + request.query.search);
	var process = spawn('python3',['/Users/dcmitchell/Desktop/Node/LMP/public/get_article_label.py',request.query.search]);
	
	var wiki_query = "";
	process.stdout.on('data',function(data) {
		wiki_query += data;
	});

	process.stdout.on('end', function() {
		wiki_query = wiki_query.trim();
		request.query.search = wiki_query;
		console.log("Found " + wiki_query);
		response.locals.source = {label: request.query.search, source_data: {}, io_data: {}, oo_data: {}, dr_data: {}}
		response.render("network");
	});
});

app.get("/examples", function(request,response) {
	response.render("examples");
});

app.get("/ontology", function(request,response) {
	response.render("ontology");
});

app.get("/contribute", function(request,response) {
	response.render("contribute");
});

app.get("/about", function(request,response) {
	response.render("about");
});

http.createServer(app).listen(3000, function () {
	console.log("LMP app started on port 3000");
});