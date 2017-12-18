function add_node(node_set, edge_set, node_data, visibility="visible", parent={}) {

	var node = {name: node_data.label,
		expanded: false,
		extended: false,
		links: node_data.links_in,
		type: node_data.type,
		children: [],
		parent: parent,
		visibility: visibility,
		x: 0, y: 0, r: 0,
		desc: node_data.desc,
		id: node_set.length};

	node_set.push(node);
	return node;
}

function expand_node(node_set,edge_set,node_id,update) {

	var queued = [];
	var node = node_set[node_id];
	node.expanded = true;
	node.extended = true;
	for (var i = 0; i < node.links.length; i++) {
		var name = node.links[i].l.value;
		var rel = node.links[i].p.value;
		if (queued.indexOf(name) === -1) {
			queued.push(name);
			if (exists(node_set,name)) {
				console.log("exists");
				var child_node = ret_node(node_set,name);
				console.log(child_node);
				add_edge(edge_set,node,child_node,rel);
				update();
			}
			else {
				$.post("/network/expand", {search: name}, function (child_data,status) {
					var child_node = add_node(node_set,edge_set,child_data,"visible", node);
					node.children.push(child_node);
					add_edge(edge_set, node, child_node, rel);
					update();
				});
			}
		}
    }
}

function ret_node(node_set,name) {
    name = name.toLowerCase();
    for (var i = 0; i < node_set.length ; i++) {
        if (node_set[i].name.toLowerCase() === name)
            return node_set[i];
    }
}

function add_edge(edge_set,parent_node,child_node,rel) {
	var edge = {source: parent_node, dest: child_node, relation: rel};
	edge_set.push(edge);
}

function exists(node_set,name) {
	var flag = false;
	name = name.toLowerCase();
	node_set.forEach(function(node) {
		if (node.name.toLowerCase() === name)
			flag = true;
	});

	return flag;
}

function has_child(node_set,node,name) {
	var flag = false;
	name = name.toLowerCase();
	node.children.forEach(function(child) {
		if (node_set[child].name.toLowerCase() === name)
			flag = true;
	});

	return flag;
}