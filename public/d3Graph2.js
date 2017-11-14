var svg = d3.select("svg"),
	w = parseInt(svg.style("width")),
	h = parseInt(svg.style("height")),
	r = 20,
	transform = d3.zoomIdentity,
	e = svg.append("g"),
	g = svg.append("g");

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

svg.call(d3.zoom()
    .scaleExtent([1 / 2, 8])
    .on("zoom", zoomed));

nodes = g.selectAll("g")
	.data(node_set)
	.enter()
	.append("g")
	.attr("class","nodes")
	.attr("x", function(d,i) {
		if (d.expanded)
			d.r = 32;
		else
			d.r = r;
		if (d.id == 0) {
			d.x = w/2;
			d.y = h/2;
		}
		else {
			var par = d.parent;
			console.log(node_set[par]);
			parent_pos = [node_set[par].x,node_set[par].y]
			var pos = rand_pos(parent_pos,20,100);
			d.x = pos[0];
			d.y = pos[1];
		}
		return d.x;

	})
	.attr("y", function(d,i) {
		return d.y;
	})
	.call(d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended))
	.on("mouseover", mouseover)
	.on("mouseout", mouseout)
	.on("click", clickon)


edges = e.selectAll("g")
	.data(edge_set)
	.enter()
	.append("g")
	.attr("class","edges")
	.append("line")
	.attr("x1", function(d) {
		return node_set[d.source].x;
	})
	.attr("y1", function(d) {
		return node_set[d.source].y;
	})
	.attr("x2", function(d) {
		return node_set[d.dest].x;
	})
	.attr("y2", function(d) {
		return node_set[d.dest].y;
	})
	.attr("stroke", "green");


g.selectAll(".nodes")
	.append("circle")
	.attr("cx", function(d,i) {
		return d.x;
	})
	.attr("cy", function(d,i) {
		return d.y;
	})
	.attr("r", function(d,i) {
		return d.r;
	})
	.attr("fill", "red");


g.selectAll(".nodes")
	.append("text")
	.attr("x", function(d,i) {
		return d.x;
	})
	.attr("y", function(d,i) {
		return d.y;
	})
	.attr("text-anchor","middle")
	.text(function(d) {
		return text_sample(d);
	})
	.style("font-size", function(d) {
		return get_font_size(d);
	})
	.style("font-family", "sans-serif")
	.style("font-weight","bold");

function zoomed() {
  g.attr("transform", d3.event.transform);
  e.attr("transform", d3.event.transform);
}


function dragstarted(d) {
  d3.select(this).raise().classed("active", true);
}

function dragged(d) {

  d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
  d3.select(this).selectAll("circle").attr("cx",d.x).attr("cy", d.y);
  d3.select(this).selectAll("text").attr("x", d.x).attr("y", d.y);
  
  var id = d.id;

  e.selectAll(".edges")
  	.select("line")
  	.attr("x1", function(d) {
  		return node_set[d.source].x;
  	})
  	.attr("y1", function(d) {
  		return node_set[d.source].y;

  	})
  	.attr("x2", function(d) {
  		return node_set[d.dest].x;
  	})
	.attr("y2", function(d) {
  		return node_set[d.dest].y;
  	});
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function mouseover(d) {
	
	d3.select(this).moveToFront();

	d3.select(this)
		.selectAll("circle")
		.attr("r",d.r*1.5);
	
	d3.select(this)
		.selectAll("text")
		.text(function (d) {
			return d.name;
		})
		.style("font-size", function(d) {
			return get_font_size(d,3);
		});
}

function clickon(d) {
	$.post("/network", {search: d.name}, function (data,status) {
		
		expand_node(node_set,edge_set,data,d.id);
		
		var node_update = g.selectAll("g")
			.data(node_set, function (d) {
				return d.id;
			});

		var enter = node_update.enter()
			.append("g")
			.attr("class","nodes")
			.attr("x", function(d,i) {
				if (d.expanded)
					d.r = 32;
				else
					d.r = r;
				if (d.id == 0) {
					d.x = w/2;
					d.y = h/2;
				}
				else {
					var par = d.parent;
					parent_pos = [node_set[par].x,node_set[par].y]
					var pos = rand_pos(parent_pos,20,300);
					d.x = pos[0];
					d.y = pos[1];
				}
				return d.x;

			})
			.attr("y", function(d,i) {
				return d.y;
			})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended))
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.on("click", clickon)


		enter.append("circle")
			.attr("cx", function(d,i) {
				return d.x;
			})
			.attr("cy", function(d,i) {
				return d.y;
			})
			.attr("r", function(d,i) {
				return d.r;
			})
			.attr("fill","red");


		enter.append("text")
			.attr("x", function(d,i) {
				return d.x;
			})
			.attr("y", function(d,i) {
				return d.y;
			})
			.attr("text-anchor","middle")
			.text(function(d) {
				return text_sample(d);
			})
			.style("font-size", function(d) {
				return get_font_size(d);
			})
			.style("font-family", "sans-serif")
			.style("font-weight","bold");

		node_update.merge(enter);

		var edge_update = e.selectAll("g")
			.data(edge_set, function (d) {
				return d.source + "-" + d.dest; 
			});

		var enter = edge_update.enter()
			.append("g")
			.attr("class","edges")
			.append("line")
			.attr("x1", function(d) {
				return node_set[d.source].x;
			})
			.attr("y1", function(d) {
				return node_set[d.source].y;
			})
			.attr("x2", function(d) {
				return node_set[d.dest].x;
			})
			.attr("y2", function(d) {
				return node_set[d.dest].y;
			})
			.attr("stroke", "green");

		edge_update.merge(enter);

	});
}

function mouseout(d) {
	
	d3.select(this)
		.selectAll("circle")
		.attr("r",d.r);

	d3.select(this)
		.selectAll("text")
		.text(function(d) {
			return text_sample(d);
		})
		.style("font-size", function(d) {
			return get_font_size(d);
		});

}

function text_sample(d) {
	if (d.name.length > 13)
		return d.name.slice(0,10) + "...";
	else
		return d.name;
}

function get_font_size(d, mult=1) {
	var length = d.name.length;
	if (d.name.length > 13)
		length = 8;
	return (mult*Math.min(2 * d.r, (2 * d.r - 8) / length * 2.5)) + "px";
}



function rand_pos(pos,rad,dist) {
	var r = Math.random()*dist+2*rad;
	var x = Math.random()*r;
	var y = Math.sqrt(Math.abs(x*x-r*r));
	if ((Math.random()-.5) < 0)
		x = x*(-1);
	if ((Math.random()-.5) < 0)
		y = y*(-1);
	x = pos[0]+x;
	y = pos[1]+y;
	return [x,y];
}





/*
function rand_pos(r)
{
	var pos = []
	g.selectAll(".nodes")
		.each( function(d) {
			var node_pos = [d.x,d.y,d.r];
			pos.push(node_pos);
		});

	var rand_pos = [Math.random()*(w-2*r)+r,Math.random()*(h-2*r)+r];
	var overlap = false;

	do {
		overlap = false;
		for (var i = 0; i < pos.length; i++) {
			var maxRad = r+pos[i][2];
			if (Math.pow(rand_pos[0]-pos[i][0],2) + Math.pow(rand_pos[1]-pos[i][1],2) < Math.pow(maxRad,2)) {
				overlap = true;
				break;
			}
		}
		if (overlap) {
			rand_pos = [Math.random()*(w-2*r)+r,Math.random()*(h-2*r)+r];
		}
	}
	while(overlap);
	return rand_pos;
}
*/
