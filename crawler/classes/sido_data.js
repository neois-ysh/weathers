const util_class = require('../utils/class');

class SidoData {
	#table = undefined;

	constructor(json, area_code, tm, en_name) {
		let keys = [];
		let basic_keys = [];
		let relation_keys = [];
		
		this.#table = en_name + '_data';
		json['area_code'] = area_code;
		json['tm'] = String(tm);
		delete(json['seq']);

		let reg = '\/';
		
		let temp_wf = json['wfEn'];
		let idx = json['wfEn'].indexOf('/');
		if(idx != -1) {
			temp_wf = temp_wf.replace(reg, '-');
			json['wfEn'] = temp_wf;
		};
		
		for(let [k1, v1] of Object.entries(json)) {
			keys.push(k1);
			let target = typeof v1 != 'object' ? basic_keys : relation_keys;
			target.push(k1);
		};

		for(let basic_key of basic_keys) {
			this[util_class.toCamelCase(basic_key)] = typeof json[basic_key] == 'string' ? json[basic_key].trim() : json[basic_key];
		};
		
	};

	insert = (db) => {
		let qry = db(this.#table).insert(util_class.getBasic(this));
		return qry;
	};

	select = (db) => {
		let qry = db.from(this.#table).where({ area_code: this['area_code'], tm: this['tm'], hour: this['hour'], day: this['day'] }).first();
		return qry;
	};

	update = (db, updates, id) => {
		let qry = db(this.#table).update(updates).where('id', id);
		return qry;
	};

	save = async(db, relation) => {
		if(relation == undefined) relation = false;

		let result = undefined;
		let exist = await this.select(db);	// 저장되어있는 db를 불러옴
		
		if(exist == undefined) {	// 저장되어있는 db가 없다면, insert
			await this.insert(db);
			result = 'INSERT';
		} else {					// 저장되어있는 db가 있다면, 새로 가져온 정보와 db를 비교하여 다른 부분은 update
			let diffs = util_class.showDiff(exist, util_class.getBasic(this));
			
			if(Object.keys(diffs).length != 0) {
				result = 'UPDATE';
				let updates = {};
				for(let [k, v] of Object.entries(diffs)) {
					updates[k] = v['after'];
				}
				console.log('updates', updates);
				await this.update(db, updates, exist['id']);
			} else {
				result = 'PASS';
			}

		}

		if(relation) {
			let relations = util_class.getRelations(this);
			for(let [k, v] of Object.entries(relations)) {
				if(v['constructor']['name'] != 'Array') {
					await v['save'](db, relation);
				} else {
					for(let v_item of v) {
						await v_item['save'](db, relation);
					}
				}
			}
		}
		return result;
	};
}

module.exports = SidoData;