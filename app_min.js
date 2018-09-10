var express	= require('express');
var app		= express();
var http	= require('http');
var server	= http.Server(app);
var io		= require('socket.io')(server);
var spawn	= require('child_process').spawn;
var cons	= require('consolidate');
var path	= require('path');
var fs		= require('fs');
var request = require('request')
var externals = require('./externals.js');

app.engine('ejs', cons.ejs);
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));


var MYIP = externals.MYIP;
var PORT = externals.PORT;
var MYADDR = externals.MYADDR;
var FITBEE_PATH = externals.FITBEE_PATH;
var awsServer = 'http://13.124.65.48:3000';

var mycss = {
    style: fs.readFileSync( './stylesheet/background.css', 'utf8')
};
var mycss2 = {
    style: fs.readFileSync('./stylesheet/video_style.css', 'utf8')
};
var mycss3 = {
    style: fs.readFileSync('./stylesheet/mydata.css', 'utf8')
};

var USER_INFO = '';

app.get('/login', function(req, res){
	console.log('login');
	var child = spawn('python', ['./faceDetect.py']);
	console.log('exec python');
	child.stdout.on('data',function(chunk){
    	var textChunk = chunk.toString('utf8');
		console.log('textChunk : ' + textChunk);
		
		if (textChunk == 1) {
			console.log('request start');
			var fileList = []
			var files = fs.readdirSync('./faces/');
			for(var i=0; i<files.length; i++){
				fileList.push(fs.createReadStream('./faces/' + files[i]))
			}
			var formData = { image : fileList };
			
			request.post({url:awsServer+'/user', formData: formData}, function optionalCallback(err, httpResponse, body) {
				if (err) { return console.error('upload failed:', err); }
				USER_INFO = JSON.parse(body);
				res.send(body);
			});
		}
		else {
			res.send('-1');
		}
	});
});


app.get('/main', function(req, res){
	console.log('[/main]');

	io.on('connection', function(socket){
		console.log('a user connected');
		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket, child_recog);
	});

	res.render('main', 
		{
		mycss: mycss, 
		myaddr: MYADDR,
		userName: USER_INFO.userName,
		weak_part: USER_INFO.weak_part,
		concent_part: USER_INFO.concent_part,
		goal_weight: USER_INFO.goal_weight,
		goal_muscle: USER_INFO.goal_muscle,
		goal_fat: USER_INFO.goal_fat,
		init_weight: USER_INFO.init_weight,
		init_muscle: USER_INFO.init_muscle,
		init_fat: USER_INFO.init_fat,
		now_weight: USER_INFO.now_weight,
		now_muscle: USER_INFO.now_muscle,
		now_fat: USER_INFO.now_fat 
		}
	);
});


app.get('/routine', function(req, res){
	result = 'tmp routine result';
	res.render('routine_tmp', {
		mycss3: mycss3,
		myaddr: MYADDR,
		result:result
	});
});



app.get('/workout', function(req, res){
	// 민정 프로세스 키면 횟수 세질때 마다 데이터 날아옴
	io.on('connection', function(socket2){
		console.log('start workout');

		var child = spawn('python', ['./workout.py']);
		setting_workout(child, socket2);

		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket2, child_recog);
	});
	//res.sendFile(__dirname + '/workout.html');
	res.render('workout', {
					mycss:mycss,
					myaddr: MYADDR
	});
});


app.get('/takepic', function(req, res){
	console.log('[/takepic]');
	io.on('connection', function(socket3){
		console.log('[/takepic] a user connected');
		var child = spawn('python', ['./takepic.py']);
		setting_takepic(child, socket3);
	});

	res.render('takebodypic.ejs',{
		mycss2: mycss2
	});
});


app.get('/data', function(req, res){
	console.log('[/data]');
	
	io.on('connection', function(socket){
		console.log('a user connected');
		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket, child_recog);
	});

	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/user/inbody/1'//+USER_INFO.userId
	}
	var INBODY_DATA;
	var CH_DATA;
			
	var formData = ''
	request.get(
		{url:awsServer+'/user/inbody/1', formData: formData}, 
		function optionalCallback(err, httpResponse, data) {
				if (err) { return console.error('upload failed:', err); }
				INBODY_DATA = JSON.parse(data).inbody_data;
				console.log("data: "+INBODY_DATA.weight);
				CH_DATA = JSON.parse(data).change_data;
				//res.send(body);
				//var tmp = INBODY_DATA.weight;
		res.render('data', {
			mycss3:mycss3,
			myaddr: MYADDR,	
			weight: INBODY_DATA.weight,
			muscle: INBODY_DATA.muscle,
			fat_percent: INBODY_DATA.fat_percent,
			bmi: INBODY_DATA.bmi,
			length: CH_DATA.length,
			ch_data: CH_DATA
			});
		});
});


/*
	server.on('request', (req, response) => {
		var awsReq = http.get(options, (awsRes) => {
			awsRes.setEncoding('utf-8');
			result = '';
			
			awsRes
			.on('data', (chunk) => {
				result += chunk;
				console.log('[/data] chunk : ' + chunk);
			})
			.on('end', () => {
				console.log('[/data] result : ' + result);
				INBODY_DATA = JSON.parse(result).inbody_data;
				CH_DATA = JSON.parse(result).change_data;

				response.render('data', {
					mycss3: mycss3,
					weight: INBODY_DATA.weight,
					muscle: INBODY_DATA.muscle,
					fat_percent: INBODY_DATA.fat_percent,
					bmi: INBODY_DATA.bmi
				});
			});
		});
	});	//server.on
*/

/*
	result = request_AWS('/user/inbody/1');
	console.log('### ' + result);
*/



function request_AWS(url){
	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: url
	}
	var INBODY_DATA;
	var CH_DATA;

	server.on('request', (req, response) => {
		var awsReq = http.get(options, (awsRes) => {
			awsRes.setEncoding('utf-8');

			result = '';
			
			awsRes
			.on('data', (chunk) => {
				result += chunk;
				console.log('[/data] chunk : ' + chunk);
			})
			.on('end', () => {
				console.log('[/data] result : ' + result);
				result = JSON.parse(result).inbody_data;
				return result;
			});
		});
	});
}




function setting_recog(socket, child){
	console.log('[setting_socket]');
	var st = "hello"
	socket.on('recog', function(msg){
		console.log('msg : ' + msg);
	});

	socket.on('replace', function(msg){
		child.kill();
		console.log('\'replace\' ' + msg);
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
		child.kill();
	});

	console.log('[setting_child]');
	
	child.stdout.on('data', function(data){
		console.log('from child : ' + data);

		if (data == 'WORKOUT\n' || data == 'TAKEPIC\n' || data == 'MYDATA\n' || data =='MAIN\n'){	// Object ArrayBuffer
// 여기를 바꾸면 뷰 마다 받아야하는 명령어가 다른데 그거 처리가 안된다...
			console.log('send <' + data.toString().trim() + '> to main.ejs');
			socket.emit('recog', data.toString().trim());
		}
	});

	child.stderr.on('data', function(data){
		process.stdout.write(data);
	});

	child.on('exit', function(code) {
		console.log('Child exited with code :' + code);
	});
}




function setting_workout(child, socket2){
	console.log('[workout_child]');
	child.stdout.on('data',function(count){
		console.log('count : '+ count);
		socket2.emit('workout', count.toString().trim());
	});

	child.stderr.on('data',function(count){
		console.log('test'+count);
	});
}

 function setting_takepic(child, socket3){
     console.log('[takepic_child]');
     child.stdout.on('data',function(time){
         console.log('time : '+ time);
        socket3.emit('takepic', time.toString().trim());
     });
 
     child.stderr.on('data',function(time){
         console.log('error! ',time.toString().trim());
     });
 }



server.listen(PORT, function(){ 
	console.log(MYIP);
	console.log(PORT);
	console.log(MYADDR);
	console.log(FITBEE_PATH);
	console.log('listening on ' + PORT); 
});
