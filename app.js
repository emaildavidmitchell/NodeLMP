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


var articles = [],
    desc = {},
	imgs = {};

fs.readFile("./public/art_desc.txt", 'utf8', function(err,data) {
	if (err) {
		return console.log(err);
	}
	data = data.split("\n");
	data.forEach(function(line) {
		line = line.split(":::");
		articles.push(line[0]);
		desc[line[0]] = line[1];
        fs.readdir('./public/img/image_bar/' + line[0], function (err,files) {
			if (files != undefined)
				imgs[line[0]] = files;
			else
				imgs[line[0]] = [];
        });
	});
});


//logs requests in dev form
app.use(morgan("dev"));

//reads the content of posts in the body
app.use(bodyParser.urlencoded({ extended: false}));

//serving up static files
var publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

//this is bad, but doing it for now
process.on('uncaughtException', function (err) {
    console.log(err);
});



//ensure the client view can access the list of articles
app.use(function(request,response,next) {
	response.locals.articles = articles;
	response.locals.imgs = imgs;
	next();
});

app.get("/", function(request,response) {
	response.render("index");
});

app.post("/network/expand", function(request,response) {
	console.log("Search for " + request.body.search);
	node_data_promises(request.body.search).then(values => {
		response.locals.node_data = create_node_data(request.body.search, values);
		response.send(response.locals.node_data);
	});
});


app.get("/network", function(request,response,next) {
	

	query = request.query.search;
	console.log("Searching for " + query);
	node_data_promises(query).then(values => {
		response.locals.node_data = create_node_data(query,values);
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

http.createServer(app).listen(80, function () {
	console.log("LMP app started on port 3000");
});



function node_data_promises(label,response) {

	label = escape_punc(label);

	var source_query = "select distinct ?s where {?s rdfs:label '" + label + "'@en filter regex(?s, 'dbpedia') } LIMIT 1";

	var io_query = "select distinct ?o ?p ?l where { ?s ?p ?o . ?s rdfs:label '" + label + 
		"'@en . ?p rdf:type owl:ObjectProperty . ?o rdfs:label ?l . filter langMatches(lang(?l),'EN')}";

	var oo_query = "select distinct ?o ?p ?l where { ?s ?p ?o . ?o rdfs:label '" + label + 
		"'@en . ?p rdf:type owl:ObjectProperty . ?s rdfs:label ?l . filter (langMatches(lang(?l),'EN') && !regex(?p, 'wiki','i') )}";

	var type_query = "select distinct ?t where {?s rdfs:label '" + label + "'@en . ?s rdf:type ?t } LIMIT 100";

	var promises = [build_promise(label,source_query),build_promise(label, io_query),build_promise(label,oo_query),build_promise(label, type_query)];

	return Promise.all(promises);

}

function escape_punc(str_value) {

	return str_value.replace("\'","\\'");

}


function build_promise(label,query) {

	var p = new Promise(function(res,rej) {

		client.query(query).execute(function(error, results) {
			if (error) 
				rej(Error("Bad query"));
			else {
				 res(results.results.bindings);
			}
		});
	});

	return p;
}

function filter_links(links) {

	var filtered_links = [];

	for (var i = 0; i < links.length; i++) {
		if (articles.indexOf(links[i].l.value) !== -1)
			filtered_links.push(links[i]);
	}

	return filtered_links;
}

function create_node_data(name,values) {

    return {label: name, uri: values[0], links_in: filter_links(values[1]), links_out:filter_links(values[2]), type: values[3], desc: desc[name]}
}

