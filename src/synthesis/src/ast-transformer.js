const parser = require('./solidity-parser-antlr/src/index');

let Transformer = {

	createNode: (type) =>{
		try{
			let res = {"type": type, "id": 0, "depth": 0, "modified": 1};
			return res;
		}catch(err){
			concole.log('Unable to create a node.\n', err);
		}
		
	},

	setProperty: (n, propertyNames, propertyValues) =>{
		try{
			if(propertyNames.length != propertyValues.length)
				throw -1;
			if(propertyNames instanceof Array == false || propertyValues instanceof Array == false)
				throw -2;
			for(var i = 0; i < propertyValues.length; i++){
				n[propertyNames[i]] = propertyValues[i];
			n.modified = 1;
			}
		}catch(err){
			console.log("Unable to set properties.\n", err);
			if(err == -1)
				console.log("The number of property names and property values must be identical.\n", err);
			if(err == -2)
				console.log("PropertyNames and propertyValues must be an array.\n", err);
		}
	},

	cloneNode: (n)=>{
		return JSON.parse(JSON.stringify(n));
	},

	findNodeById: (scope, id) =>{
		let res = null;
		try{
			parser.visit(scope,{
				PrevAll: (node) =>{
					if(node.id == id)
						res = node;
				}
			})
			return res;
		} catch(err){
			console.log("Failed to find the node by id.\n", err);
		}
	},

	findNodeByName: (scope, name) =>{
		let res = [];
		try{
			parser.visit(scope,{
				PrevAll: (node) =>{
					if(node.name != undefined && node.name == name)
						res.push(node);
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the node by name.\n", err);
		}
	},

	findNodeByType: (scope, type) =>{
		let res = [];
		try{
			parser.visit(scope,{
				PrevAll: (node)=>{
					if(node.type != undefined && node.type == type)
						res.push(node);
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the node by type.\n", err);
		}
	},

	findNodeByDepth: (scope, depth) =>{
		let res = [];
		try{
			if(depth < 0)
				throw -1;
			parser.visit(scope,{
				PrevAll: (node) =>{
					if(node.depth == depth)
						res.push(node);
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the node by depth.\n", err);
		}
	},

	findNodeByLine: (scope, line) => {
		let res = [];
		try{
			parser.visit(scope,{
				PrevAll: (node) =>{
					if((node.loc != undefined && node.loc.start.line == line) || (node.loc != undefined && node.loc.end.line == line)){
						res.push(node);
					}
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the node by line number.\n", err);
		}
	},

	findParentNode: (scope, n) =>{
		let res = null;
		let minid = 999999999;
		try{
			if(n.depth == scope.depth)
				return null;
			parser.visit(scope,{
				PrevAll: (node)=>{
					let id = n.id - node.id;
					let depth = n.depth - node.depth;
					if(depth == 1 && id > 0){
						if(id < minid){
							minid = id;
							res = node;
						}
					}
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the parent of this node.\n", err);
		}
	},

	findChildNode: (n) =>{
		let res = [];
		try{
			parser.visit(n, {
				PrevAll: (node) =>{
					if(node.depth == n.depth + 1)
						res.push(node);
				}
			})
			return res;
		}catch(err){
			console.log("Failed to find the children of this node.\n", err);
		}
	},

	findStateVariable: (scope, mode, id = null) =>{
		let res = [];
		let statevname = [];
		try{
			parser.visit(scope, {
				PrevAll: (node) =>{
					if(node.type == "StateVariableDeclaration"){
						for (let x in node.variables){
							statevname.push(node.variables[x].name);
						}
					}
				}
			})
			if(mode == 3)
				return statevname;
			else if(mode == 2){
				parser.visit(scope,{
					PrevAll: (node) =>{
						if(node.type == "IndexAccess" && statevname.indexOf(node.base.name) > -1){
							res.push(node);
						}
						if(node.type == "MemberAccess" && statevname.indexOf(node.memberName) > -1){
							res.push(node);
						}
					}
				})
				return res;
			}
			else if(mode == 1){
				parser.visit(scope,{
					PrevAll: (node) =>{
						if(node.type == "VariableDeclaration" && statevname.indexOf(node.name) > -1){
							res.push(node);
						}
					}
				})
				return res;
			}
			else if(mode == 4){
				let assignments = [];
				parser.visit(scope,{
					PrevAll: (node) => {
						if(node.type == "BinaryOperation" && node.operator == "="){
							for(let name in statevname){
								if(Transformer.findNodeByName(node.left, statevname[name]) != []){
									if(id == null || (id != null && node.id > id)){
										assignments.push(node);
									}
								}
							}
						}
					}
				})
				return assignments;
			}
		}catch(err){
			console.log("Failed to find required statevariables(definitions/accesses).\n", err);
		}
	},

	findFunction: (scope, mode, name = null) =>{
		let funccalls = [];
		let funcnames = [];
		let funcdefs = [];
		try{
			funcdefs = Transformer.findNodeByType(scope, "FunctionDefinition");
			if(mode == 1 && name == null)
				return funcdefs;
			else if(mode == 1 && name != null){
				for(let x in funcdefs){
					if(funcdefs[x].name == name)
						return funcdefs[x];
				}
			}
			else if(mode == 3){
				for(let x in funcdefs){
					funcnames.push(funcdefs[x].name);
				}
				return funcnames;
			}
			else if(mode == 2){
				funccalls = Transformer.findNodeByType(scope, "FunctionCall");
				return funccalls;
			}
		}catch(err){
			console.log("Failed to find required functions(definitions/calls).\n", err);
		}
	},


	findIncludedGlobalDef: (ast,n) =>{
		let vars = Transformer.findNodeByDepth(ast, 2);
		try{
			if(n.depth == 0)
				return null;
			else if(n.depth == 1)
				return Transformer.findNodeByDepth(ast, 0)[0]
			else if(n.depth == 2)
				return Transformer.findNodeByDepth(ast, 1)[0];
			else{
				for(let i = 0; i < vars.length; i++){
					if(i == vars.length - 1 && n.id > vars[i].id)
						return vars[i];
					else if(vars[i].id < n.id && vars[i+1].id > n.id)
						return vars[i];
				}
				return null;
			}
		}catch(err){
			console.log("Failed to find included global defs.\n", err);
		}
	},

	findPrevNode: (scope, n, depth = -1, type = null) =>{
		let res = [];
		let temp = [];
		try{
			if(n.depth + depth >= 0){
				temp = Transformer.findNodeByDepth(scope, n.depth + depth);
				for(let x in temp){
					if(temp[x].id < n.id){
						if(type == null)
							res.push(temp[x]);
						else if(type != null && temp[x].type == type)
							res.push(temp[x]);
					}
				}
				return res;
			}
		}catch(err){
			console.log("Failed to find the required prevnodes.\n", err);
		}
	},

	findPostNode: (scope, n, depth, type = null) =>{
		let res = [];
		let temp = [];
		try{
			if(n.depth + depth >= 0){
				temp = Transformer.findNodeByDepth(scope, n.depth + depth);
				for(let x in temp){
					if(temp[x].id > n.id){
						if(type == null)
							res.push(temp[x]);
						else if(type != null && temp[x].type == type)
							res.push(temp[x]);
					}
				}
				return res;
			}
		}catch(err){
			console.log("Failed to find the required postnodes.\n", err);
		}
	},

	replaceNode: (ast, newnode, oldnode) =>{
		try{
			let maxid = Transformer.getNodeNum(ast);
			let nodeid = [];
			let temp_oldnode = JSON.parse(JSON.stringify(oldnode));
			let temp_newnode = JSON.parse(JSON.stringify(newnode));
			nodeid.push(Transformer.getNodeNum(temp_oldnode));
			nodeid.push(Transformer.getNodeNum(temp_newnode));
			if(newnode.type == undefined)
				throw -1;
			for(let oldkey in oldnode){
				delete(oldnode[oldkey]);
			}
			for(let newkey in newnode){
				oldnode[newkey] = newnode[newkey];
			}
			newnode.modified = 1;
			newnode.range = oldnode.range;
			Transformer.operationVerify(ast, 'replace', maxid, nodeid);
		}catch(err){
			console.log("Failed to replace the required node.\n", err);
			if(err == -1)
				console.log("The new node is illegal.\n", err);
		}
	},

	insertPrevNode: (ast, newnode, n) =>{
		try{
			let maxid = Transformer.getNodeNum(ast);
			let temp_newnode = JSON.parse(JSON.stringify(newnode));
			let nodeid = Transformer.getNodeNum(temp_newnode);
			let parent = Transformer.findParentNode(ast, n);
			if(parent == null)
				throw -1;
			if(newnode.type == undefined)
				throw -3;
			for(let x in parent){
				if(n == parent[x] && parent[x] instanceof Array == false){
					throw -2;
				}
				else if(parent[x] instanceof Array && parent[x].indexOf(n) > -1){
					parent[x].push(newnode);
					let index = parent[x].indexOf(n);
					for(let i = parent[x].length - 1; i > index; i--){
						parent[x][i] = parent[x][i-1];
					}
					parent[x][index] = newnode;
				}
			}
			newnode.modified = 1;
			// newnode.range = [n.range[0], n.range[0]];
			Transformer.operationVerify(ast, 'insert', maxid, nodeid);
		}catch(err){
			console.log("Failed to insert node.\n", err);
			if(err == -1)
				console.log("You are not allowed to insert a node before the root.\n", err);
			else if(err == -2)
				console.log("The node's parent is not extendable.\n", err);
			else if(err == -3)
				console.log("The new node is illegal.\n", err);
		}
	},

	insertPostNode: (ast, newnode, n) =>{
		try{
			let maxid = Transformer.getNodeNum(ast);
			let temp_newnode = JSON.parse(JSON.stringify(newnode));
			let nodeid = Transformer.getNodeNum(temp_newnode);
			let parent = Transformer.findParentNode(ast, n);
			if(parent == null)
				throw -1;
			if(newnode.type == undefined)
				throw -3;
			for(let x in parent){
				if(n == parent[x] && parent[x] instanceof Array == false)
					throw -2;
				else if(parent[x] instanceof Array && parent[x].indexOf(n) > -1){
					parent[x].push(newnode);
					let index = parent[x].indexOf(n);
					for(let i = parent[x].length - 1; i > index + 1; i--){
						parent[x][i] = parent[x][i-1];
					}
					parent[x][index+1] = newnode;
				}
			}
			newnode.modified = 1;
			// newnode.range = [n.range[1], n.range[1]];
			Transformer.operationVerify(ast, 'insert', maxid, nodeid);
		}catch(err){
			console.log("Failed to insert node.\n", err);
			if(err == -1)
				console.log("You are not allowed to insert a node in the same depth with root.\n", err);
			else if(err == -2)
				console.log("The node's parent is not extendable.\n", err);
			else if(err == -3)
				console.log("The new node is illegal.\n", err);
		}
	},

	deleteNode: (ast, n) =>{
		try{
			let maxid = Transformer.getNodeNum(ast);
			let temp_n = JSON.parse(JSON.stringify(n));
			let nodeid = Transformer.getNodeNum(temp_n);
			let parent = Transformer.findParentNode(ast, n);
			if(parent == null)
				return null;
			for (let x in parent){
				if(n == parent[x] && parent[x] instanceof Array == false)
					parent[x] = null;
				else if(parent[x] instanceof Array && parent[x].indexOf(n) > -1){
					let index = parent[x].indexOf(n);
					for(let i = index; i < parent[x].length - 1; i++){
						parent[x][i] = parent[x][i+1];
					}
					parent[x].pop();
				}
			}
			Transformer.operationVerify(ast, 'delete', maxid, nodeid);
		}catch(err){
			console.log("Failed to delete the node.\n", err);
		}
	},
	
	getNodeNum: (scope) =>{
		let num = 0;
		try{
			parser.visit(scope, {
				PrevAll: (node) =>{
					num++;
				}
			})
			return num;
		}catch(err){
			console.log("Failed to get the number of nodes.\n", err);
		}
	},


	operationVerify: (ast, mode, nodenumbefore, nodenumnow) =>{
		/*let num2 = 0;
		try{
			parser.setDepthAndID(ast, true, true);
			num2 = Transformer.getNodeNum(ast);
			let maxid = 0;
			parser.visit(ast, {
				PrevAll: (node) =>{
					if(node.id > maxid)
						maxid = node.id;
				}
			})
			if(maxid != num2 - 1)
				throw -1;
			if(mode == 'insert' && nodenumbefore + nodenumnow!= num2)
				throw -1;
			if(mode == 'delete' && nodenumbefore - nodenumnow!= num2)
				throw -1;
			if(mode == 'replace' && nodenumbefore - nodenumnow[0] + nodenumnow[1] != num2)
				throw -1;
		}catch(err){
			if(err == -1)
				console.log("Validity check failed.\n", err);
			else
				console.log("Failed to check the validity of AST.\n", err);
		}*/
	},

	hasChild: (node) => {
		try{
			let haschild = false;
			for(let key in node){
				if(node[key] != null && node[key] != {} && node[key] instanceof Object){
					haschild = true;
					break;
				}
			}
			return haschild;
		}catch(err){
			console.log("Failed to judge whether this node has child.\n", err);
		}
	},

	setField: (ast) => {
		try{
			parser.visit(ast, {
				PrevAll: (node) => {
					node["modified"] = 0;
				}
			})
		}catch(err){
			console.log("Failed to set modified field.\n", err);
		}
	},

	format: (ast) => {
		try{
			parser.visit(ast, {
				PostAll: (node) => {
					if(node.modified >= 1){
						let parent = Transformer.findParentNode(ast, node);
						if(parent != null && parent.modified == 0 && parent.depth >= 1)
							parent.modified = 2;
					}
				}
			})
		}catch(err){
			console.log("Failed to format AST.\n", err);
		}
	}

}


module.exports = Transformer;