const base_url = 'http://www.kma.go.kr/wid/queryDFSRSS.jsp';
const request = require('request-promise-native');
const db = require('../utils/db');
const { parse } = require('rss-to-json');
const moment = require('moment-timezone');

//전국 동 area_code get
exports.getAreaCode = async(area_code) => {
	let res = undefined;
	
	if(area_code == undefined) res = await db('hourly_dong');
	else res = await db('hourly_dong').where('area_code', '>', area_code);
	return res;
};

//DB테이블명
exports.getAreaName = async(code) => {
	let reses = await db('hourly_sido');
	for(let res of reses) {
		let res_code = String(res['area_code']);
		if(res_code.startsWith(code)) {
			let en_name = await db('hourly_sido').select('en_area').where('sido', res['sido']).first();
			return en_name['en_area'];
			break;
		}
	}
};

//지역별 예보(3시간 단위)
exports.getHourlyWeather = async(code) => {
	let rss = await parse(`${base_url}?zone=${code}`);
	return rss['items'][0]['description'];
};

//주소 선택 입력
exports.getSelectArea = async(sido, gugun, dong) => {
	let sido_info = db('hourly_sido').where('area_code', sido).first();
	let gugun_info = db('hourly_gugun').where('area_code', gugun).first();
	let dong_info = db('hourly_dong').where('area_code', dong).first();
}

//주소 직접 입력
exports.getSearchArea = async(words) => {
	let columns = ['sido', 'gugun', 'dong'];
	//db.raw(`query`) : parsing 하지않고, 입력한 query문을 db에서 그대로 실행
	let search_qry = db.select('*', db.raw('CONCAT_WS(" ", `sido`, `gugun`, `dong`) as `address`')).from('hourly_total');
	// let search_qry = db.select('*', db.raw('CONCAT_WS(" ", `sido`, `gugun`, `dong`) as `address`')).from('hourly_total').orderByRaw('area_code DESC');
	// let search_qry = db('hourly_total');
	let search_rs = {};

	if(words.length != 0) {
		//비동기
		words.forEach((word, i) => {
			word = word.trim();
			if(word.length == 0) return;
			for(let column of columns) {
				search_qry = search_qry.orWhere(column, 'like', `%${word}%`);
			}
		});
		
		//동기
		// for(let i=0; i < words.length; i++) {
		// 	search_qry = search_qry.orWhere(function() {
		// 		this.where('sido', 'like', `%${words[i]}%`).orWhere('gugun', 'like', `%${words[i]}%`).orWhere('dong', 'like', `%${words[i]}%`)
		// 	}).orderBy('area_code', 'ASC');
		// }

		search_rs = await search_qry;
		
		search_rs = search_rs.map((r) => {
			r['address'] = r['address'].trim();
			return r;
		});
	}

	return search_rs.constructor.name == 'Array' ? search_rs : [];
}

exports.getWeatherInfo = async(data) => {
	let table = await db('hourly_sido').select('en_area').where('sido', '제주특별자치도').first();
	table = table['en_area'] + '_data';
	let today = moment.tz('Asia/Seoul').locale('ko').format('YYYYMMDDHH00');
	let hour = today.substring(8, 10);
	let infos = await db(table).where({ area_code: 5013062000, day: 0 }).where('tm', '>=', hour);
	for(let info of infos) {
		delete(info['id']);
	}
	infos = [...new Set(infos)];
	// console.log(infos);
	return infos;
};

// async function getJSON(url, method = 'GET') {
// 	let res = await request(url, { method: 'GET', json: true });
// 	return res;
// }
