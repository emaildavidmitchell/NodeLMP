
var svg = d3.select("#graph"),
	w = parseInt(svg.style("width")),
	h = parseInt(svg.style("height")),
	r = 5,
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

svg.on("dblclick.zoom", null);


update();

function dblclickon(d) {
	
	if (!d.expanded) {
        expand_node(node_set, edge_set, d.id, update);
    }
	else {
		d.extended = !d.extended;
		d.children.forEach( function (n) {
			if (n.visibility === "hidden")
				n.visibility = "visible";
			else
				if (n.children.length === 0)
					n.visibility = "hidden";
		});
		update_visibility();
	}

}

function update() {
	var node_update = g.selectAll("g")
			.data(node_set, function (d) {
				return d.id;
			});

		var enter = node_update.enter()
			.append("g")
			.attr("class","nodes")
			.attr("",init_position)
			.attr("x", function(d) {
				return d.x;
			})
			.attr("y", function(d) {
				return d.y;
			})
			.attr("id", function(d) {
				return d.id;
			})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended))
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.on("dblclick", dblclickon)

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
				return d.source.x;
			})
			.attr("y1", function(d) {
				return d.source.y;
			})
			.attr("x2", function(d) {
				return d.dest.x;
			})
			.attr("y2", function(d) {
				return d.dest.y;
			})
            .attr("stroke", "#999")
            .attr("stroke-width", "2")
            .attr("stroke-opacity", 0.3)
            .on("mouseover", edgemouseover)
            .on("mouseout", edgemouseout)
			.append("title")
			.text(function (d) {
				return d.relation;
			});

		edge_update.merge(enter);
		update_visibility();
}


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
  d3.select(this).attr("", function(d) {
  	if (d.extended)
  		drag_children(d,d3.event);
  });

  e.selectAll(".edges")
  	.select("line")
  	.attr("x1", function(d) {
  		return d.source.x;
  	})
  	.attr("y1", function(d) {
  		return d.source.y;

  	})
  	.attr("x2", function(d) {
  		return d.dest.x;
  	})
	.attr("y2", function(d) {
  		return d.dest.y;
  	});

    $("#tooltip").css({left: d.x+150, top: d.y-50});

    $("#media-bar").css({visibility: "hidden"});


}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function mouseover(d) {


	d3.select(this).moveToFront();

	d3.select(this)
		.selectAll("circle")
		.attr("r",d.r*4);
	
	d3.select(this)
		.selectAll("text")
		.text(function (d) {
			return d.name;
		})
		.style("font-size", function(d) {
			return get_font_size(d,3);
		});

	$("#tooltip").css({left: d.x+150, top: d.y-50, visibility: "visible"})
		.text(d.desc);

    if (d.y < parseInt(svg.style("height"))-150) {
        $("#media-bar").css({visibility: "visible"});
        $('#image-container').empty();
        /*imgs[d.name].forEach(function (img) {
            $('#image-container').prepend('<img id="theImg" height="100px" src="/img/image_bar/' + d.name + '/' + img + '" />');
        });*/
    }
}

function edgemouseover(d) {

	d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", "5")

}

function edgemouseout(d) {

    d3.select(this)
        .attr("stroke", "#999")
        .attr("stroke-width", "2")

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

    $("#tooltip").css({visibility: "hidden"});

    $("#media-bar").css({visibility: "hidden"});



}

function text_sample(d) {
	if (d.name.length > 20)
		return d.name.slice(0,20) + "...";
	else
		return d.name;
}

function get_font_size(d, mult=1) {
	return mult*10 + "px";
}

function pos_around(min_dist,max_dist) {

	var rad = Math.random()*(max_dist-min_dist) + min_dist;
	var ang = Math.random()*2*Math.PI;
	var y = rad*Math.sin(ang);
	var x = rad*Math.cos(ang);
	return [x,y];
}

function init_position(d,i) {
	d.r = r;
	
	if (d.id == 0) {
		d.x = w/2;
		d.y = h/2;
	}
	else {
		
		var min = 100;
		var max = 110;
		do {
			var pos = pos_around(min,max);
			pos[0] = pos[0]+d.parent.x;
			pos[1] = pos[1]+d.parent.y;
			max = max+2;
		} while(is_occ(pos,50));
		d.x = pos[0];
		d.y = pos[1];
	}
}

function is_occ(pos,r) {

	var node;
	for (var i = 0; i < node_set.length; i++) {
		node = node_set[i];
		if (node.visibility == "visible") {
			var dist = (Math.pow(pos[0]-node.x,2)+Math.pow(pos[1]-node.y,2));
			if (dist < Math.pow(r,2))
				return true;
		}
		
	}
	return false;
}

function update_visibility() {

	g.selectAll("g")
		.style("visibility", function (d) {
			return d.visibility;
		});


	e.selectAll("g")
		.style("visibility", function (d) {
			if ((d.source.visibility === "hidden") || (d.dest.visibility === "hidden"))
				return "hidden";
			else
				return "visible";
		});
}

function drag_children(d,event) {
	d.children.forEach( function(node) {
		if (node.expanded === false) {
			node.x += event.dx;
			node.y += event.dy;
		}
	});
	update_position();

}

function update_position() {
	g.selectAll(".nodes").attr("x", function (d) {return d.x;}).attr("y", function (d) {return d.y;});
	g.selectAll("circle").attr("cx", function (d) {return d.x;}).attr("cy", function (d) {return d.y;});
	g.selectAll("text").attr("x", function (d) {return d.x;}).attr("y", function (d) {return d.y;});
	e.selectAll(".edges").select("line")
		.attr("x1", function(d) {return d.source.x; })
		.attr("y1", function(d) {return d.source.y;})
		.attr("x2", function(d) {return d.dest.x;})
		.attr("y2", function(d) {return d.dest.y;});
}


