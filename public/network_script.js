function add_node(node_set, edge_set, node_data, expanded=false, parent) {

	var node = {name: node_data.label, 
		expanded: expanded, 
		type: node_data.type_data, 
		data: node_data.dr_data, 
		children: [], 
		parent: parent, 
		visibility: "visible", 
		x: 0, y: 0, r: 0, 
		id: node_set.length};

	node_set.push(node);

	return node;
}

function expand_node(node_set,edge_set,data,node_id) {
	var node = node_set[node_id];
	node.expanded = true;
	node.type = data.type_data;
	node.data = data.dr_data;

	data.io_data.forEach(function(entry) {
		if (!exists(node_set,entry.l.value)) {
			var child_node_data = {label: entry.l.value, type_data: {}, dr_data: {}};
			var child_node = add_node(node_set,edge_set,child_node_data,false,node);
			node.children.push(child_node);
			add_edge(edge_set,node,child_node,"sex");
		}
	});
}

function add_edge(edge_set,parent_node,child_node,rel) {
	var edge = {source: parent_node, dest: child_node, relation: rel};
	edge_set.push(edge);
}

function exists(node_set,name) {
	var flag = false;
	name = name.toLowerCase();
	node_set.forEach(function(node) {
		if (node.name.toLowerCase() == name)
			flag = true;
	});

	return flag;
}

function has_child(node_set,node,name) {
	var flag = false;
	name = name.toLowerCase();
	node.children.forEach(function(child) {
		if (node_set[child].name.toLowerCase() == name)
			flag = true;
	});

	return flag;
}


