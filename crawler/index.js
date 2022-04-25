const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const moment = require('moment-timezone');

const api = require('./utils/api');
const db = require('./utils/db');
const SidoData = require('./classes/sido_data');

let timings = ['000000', '030000', '060000', '090000', '120000', '150000', '180000', '210000'];


console.log(`/////////////////////////////////////`);
console.log(`// SYSTEM START (${new Date()})`);
console.log(`// 2021-10-06 시스템 런칭 YSH`);
console.log(`// 2021-11-05 UI 서비스 추가`);
console.log(`// 2021-11-10 UI data 전송방식 선택 수정`);
console.log(`// 2021-11-24 wf_en 표기방식 변경(/ → -)`);
console.log(`// 2021-11-30 알 수 없는 이유로 서비스 작동 안함`);
console.log(`// 2021-12-07 neo_cw_seather.service:3 Missing '=', ignoring line`);
console.log(`// 2021-12-08 서비스 작동 멈춤 발견, 원인 미상, 서비스를 재등록하였으나 변화 없음`);
console.log(`// 2021-12-09 서비스 restart로 해결, work 실행 콘솔 로그 추가`);
// console.log(`// 2022-04-04 원인불명, 서비스는 돌아가고있는데 프로젝트 실행 자체가 중단`);
console.log(`/////////////////////////////////////`);

// test
// timings.push(moment().tz('Asia/Seoul').format('HHmmss'));

(async () => {
	console.log('work start');
	await work();
	// await saveWeatherData();
	console.log('work end');

	// try {
	// 	console.log('work start');
	// 	// await work();
	// 	await saveWeatherData();
	// 	console.log('work end');
	// } catch (error) {
	// 	console.log('work error:', error);
	// 	await work();
	// }
})();

async function work() {
	try {
		let hhmmss = moment().tz('Asia/Seoul').format('HHmmss');
		if (timings.indexOf(hhmmss) != -1) await saveWeatherData();
	} catch (error) {
		console.log('work err:', error);
	}
	
	try {
		setTimeout(async () => {
			await work();
		}, 1000 * 1);	
	} catch (error) {
		console.log('setTimeout', error);
	}
}

async function saveWeatherData(ms, last_area) {
	console.log(`CALL FUNCTION saveWeatherData()`);
	let result = {};
	let codeLists = await api.getAreaCode(last_area);
	try {
		for (let codeList of codeLists) {
			let area_code = String(codeList['area_code']).substring(0, 2);
			let area_name = await api.getAreaName(area_code);
			let area_weathers = await api.getHourlyWeather(codeList['area_code']);
			try {
				for (let area_weather of area_weathers['body']['data']) {
					let dong = new SidoData(area_weather, codeList['area_code'], area_weathers['header']['tm'], area_name);
					let action = await dong.save(db, true);
					if (result[action] == undefined) result[action] = [];
					result[action].push(dong.area_code);
				}
			} catch (error) {
				let len = result['INSERT'].length - 1;
				let last_code = result['INSERT'][len];
				console.log('sidoData_error:', error, 'last_code:', last_code);
				retrySaveData(last_code);
			}
		}
	} catch (error) {
		let len = result['INSERT'].length - 1;
		let last_code = result['INSERT'][len];
		console.log('codeList_error:', error, 'last_code:', last_code);
		retrySaveData(last_code);
	}
}

async function retrySaveData(area_code) {
	saveWeatherData(area_code);
}
