var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
    color = d3.scaleOrdinal(d3.schemeCategory10);

var simulation = d3.forceSimulation(node_set)
	.force("charge", d3.forceManyBody().strength(-1000))
	.force("link", d3.forceLink(edge_set).distance(200))
	.force("x", d3.forceX())
	.force("y", d3.forceY())
	.alphaTarget(1)
	.on("tick", ticked)


var g = svg.append("g").attr("transform", "translate(" + width/2 + "," + height/2 + ")"),
	link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
	node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");

restart();

function restart() {
	node = node.data(node_set, function(d) { return d.id });
	node.exit().remove();
	node = node.enter().append("g").attr("class", "node").on("click",clickon);
	
	node.append("circle").attr("fill", "red").attr("r", 25);
	node.append("text").text(function (d) { return d.name }).attr("text-anchor","middle").style("stroke","black");
	node = node.merge(node);

	link = link.data(edge_set, function(d) { return d.source.id + "-" + d.target.id; });
	link.exit().remove();
	link = link.enter().append("line").merge(link);
	
	simulation.nodes(node_set);
	simulation.force("link").links(edge_set);
	simulation.alpha(1).restart();
}

function ticked() {
	node.selectAll("circle").attr("cx", function(d) { return d.x }).attr("cy", function(d) { return d.y });
	node.selectAll("text").attr("x", function(d) { return d.x; }).attr("y", function(d) { return d.y });
}

function clickon(d) {
	$.post("/network", {search: d.name}, function (data,status) {
		expand_node(node_set,edge_set,data,d.id);
		console.log("restart");
		restart();
	});
}
