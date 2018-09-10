/* child process routine - recognize voice using Google API */
'use strict';

var express = require('express');
//var router = express.Router();

process.stdin.resume();

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
// Creates a client
const client = new speech.SpeechClient();
const record = require('node-record-lpcm16');


const config = {
encoding: 'LINEAR16',
	sampleRateHertz: 16000,
	languageCode: 'ko-KR',//'en-US',
};
const request = {
	//audio: audio,
	config: config,
	interimResults: false,	//// if you want interim results, set this to true
	key: 'AIzaSyBFDW2vYbakoXRSlV3vOpDQAFp3nYjOvI8'
};


console.log('start recognize\n');

//// create a recognize stream
const recognizeStream = client.streamingRecognize(request)
								.on('error', console.error)
								.on('data', data => {
	var trans = data.results[0] && data.results[0].alternatives[0]
				? `${data.results[0].alternatives[0].transcript}\n`
				: `\n\nReached transcription time limit, press Ctrl+C\n`
	process.stdout.write(trans)


	if (cmd_workout.indexOf(trans) != -1){
		process.stdout.write('WORKOUT\n');
	}
	//else console.log("workout : -1\n");
	if (cmd_takepic.indexOf(trans) != -1){
		process.stdout.write('TAKEPIC\n');
	}
	//else console.log("takepic : -1\n");
	if (cmd_info.indexOf(trans) != -1){
		process.stdout.write('MYDATA\n');
	}
	if (cmd_main.indexOf(trans) != -1){
		process.stdout.write('MAIN\n');
	}
//else console.log("takepic : -1\n");

});


//// Start recording and send the microphone input to the Speech API
record
.start({
	sampleRateHertz: config.sampleRateHertz,
	threshold: 0,
	verbose: true,
	recordProgram: 'rec',
	silence: '1.0',
})
.on('error', console.error)
.pipe(recognizeStream);

console.log('Listening, press Ctrl_C to stop.');

const cmd_workout = [`운동시작\n`, `운동 시작\n`, ` 운동시작\n`, ` 운동 시작\n`];
const cmd_takepic = ["사진찍기\n", "사진 찍기\n", " 사진찍기\n", " 사진 찍기\n"];
const cmd_info	  = ["내정보\n", "내 정보\n", " 내정보\n", " 내 정보\n", "정보 보기\n", " 정보 보기\n", "정보보기\n"];
const cmd_main	= ["메인\n", " 메인\n", "메인 화면\n", " 메인 화면\n", "메인화면\n", " 메인화면\n", "돌아가기\n", "돌아 가기\n", " 돌아가기\n"];

//module.exports = router;
