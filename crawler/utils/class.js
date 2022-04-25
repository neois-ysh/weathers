exports.toCamelCase = (string) => {
	return string
		.replace(/\.?([A-Z])/g, function(x, y) {
			return '_' + y.toLowerCase();
		})
		.replace(/^_/, '');
};

exports.getBasic = (obj) => {
	let temp = {};

	for(let [k, v] of Object.entries(obj)) {
		if(typeof v != 'object' && typeof v != 'function') temp[k] = v;
	}
	
	return temp;
};

exports.getRelations = (obj) => {
	let temp = {};

	for(let [k, v] of Object.entries(obj)) {
		if(typeof v == 'object') temp[k] = v;
	}
	
	return temp;
};

exports.showDiff = (obj1, obj2) => {
	let result = {};
	let total_keys = [...new Set(Object.keys(obj1).concat(Object.keys(obj2)))];
	
	for(let total_key of total_keys) {
		if(total_key == 'id') continue;
		let value1 = obj1[total_key] != undefined ? obj1[total_key] : null;
		let value2 = obj2[total_key] != undefined ? obj2[total_key] : null;
		if(value1 != value2) result[total_key] = { before: value1, after: value2 };
	}
	
	return result;
};