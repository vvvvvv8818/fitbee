var express	= require('express');
var app		= express();
var http	= require('http');
var server	= http.Server(app);
//var io		= require('socket.io')(server);
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
				//res.send(body);
				res.render('login', {myaddr:MYADDR});
			});
		}
		else {
			res.send('-1');
		}
	});
});


app.get('/main', function(req, res){
	console.log('[/main]');

	var io		= require('socket.io')(server);
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

/*
app.get('/routine', function(req, res){
	result = 'tmp routine result';
	res.render('routine', {
		mycss3: mycss3,
		myaddr: MYADDR,
		result:result
	});
});
*/

app.get('/routine', function(req, res){
//	result = ''

var io		= require('socket.io')(server);
	io.on('connection', function(socket){
		console.log('a user connected');
		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket, child_recog);
	});

	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/routine/1'//+USER_INFO.userId
	}

	var formData = ''
	request.get(
		{url:awsServer+'/demo', formData: formData}, 
		function optionalCallback(err, httpResponse, data) {
				if (err) { return console.error('upload failed:', err); }
				//console.log('Data: '+data); //잘넘어옴
				EXER_INFO = JSON.parse(data).data;
				console.log("data: "+EXER_INFO[0].exerName); //성공
				
				res.render('routine', {
			mycss3:mycss3,
			myaddr: MYADDR,
			EXER_INFO: EXER_INFO
			});

		});
});


var workout_process = -1;
//운동영상
app.get('/workout1', function(req, res){
	console.log('[/workout1]');
	// 민정 프로세스 키면 횟수 세질때 마다 데이터 날아옴
	var io		= require('socket.io')(server);
	io.on('connection', function(socket2){
		console.log('start workout (socket : ' + socket2.id);
	
		var child_recog = spawn('node', ['./child_recog.js']);
		console.log('child_recog : ' + child_recog.pid);
		setting_recog(socket2, child_recog);

		var child = spawn('python', ['./workout1.py']);
		setting_workout(child, socket2);
		workout_process = child;
	}); 
	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/routine/1'//+USER_INFO.userId
	}
	var set;
	var formData = ''
	request.get(
		{url:awsServer+'/demoCnt', formData: formData}, 
		function optionalCallback(err, httpResponse, data) {
			if (err) { return console.error('upload failed:', err); }
			set = JSON.parse(data);
			console.log("data: "+data); 
			res.render('workout', {
				mycss2:mycss2,
				myaddr: MYADDR,
				EXER_INFO: EXER_INFO,
				setcnt: set
			});
		});
});

app.get('/workout2', function(req, res){
	console.log('[/workout2]');
	// 민정 프로세스 키면 횟수 세질때 마다 데이터 날아옴
	var io		= require('socket.io')(server);
	io.on('connection', function(socket2){
		console.log('start workout');
	
		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket2, child_recog);	

		var child = spawn('python', ['./workout2.py']);
		setting_workout(child, socket2);
		workout_process = child;

	}); 
	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/routine/1'//+USER_INFO.userId
	}
	var set;
	var formData = ''
	request.get(
		{url:awsServer+'/demoCnt', formData: formData}, 
		function optionalCallback(err, httpResponse, data) {
				if (err) { return console.error('upload failed:', err); }
				set = JSON.parse(data);
				console.log("data: "+data); 
				res.render('workout2', {
					mycss2:mycss2,
					myaddr: MYADDR,
					EXER_INFO: EXER_INFO,
					setcnt: set
				});
		});
});



app.get('/takepic', function(req, res){
var io	= require('socket.io')(server);
	io.on('connection', function(socket){
		console.log('[/takepic] a user connected : ' + socket.id);
		var child = spawn('python', ['takepic.py',USER_INFO.userName]);
		setting_takepic(child, socket);
		var child_recog = spawn('node', ['child_recog.js']);
		setting_recog(socket, child_recog);
	});

	res.render('takebodypic.ejs',{
		mycss2: mycss2,
		myaddr: MYADDR
	});
});

app.get('/setting', function(req, res){
	res.render('setting', {
		mycss3: mycss3,
		concent_part: USER_INFO.concent_part,
		weak_part: USER_INFO.weal_part
    });
});


app.get('/data', function(req, res){
	console.log('[/data]');
	
var io		= require('socket.io')(server);
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


app.get('/finish', function(req, res){
	console.log('[/finish]');

	var io		= require('socket.io')(server);
	io.on('connection', function(socket){
		console.log('a user connected');
		var child_recog = spawn('node', ['./child_recog.js']);
		setting_recog(socket, child_recog);
	});

	res.render('finish', {mycss2:mycss2, myaddr:MYADDR});
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
	console.log('[setting_socket] socket: ' + socket.id + '/ child: ' + child.pid);

	socket.on('replace', function(msg){
		console.log('[replace] ' + msg);
		socket.disconnect();
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
		child.kill();
		if (workout_process != -1)
			workout_process.kill();
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
/*
	socket2.on('disconnect', function(){
		console.log('[setting_workout] disconnect');
		child.kill();
	});
*/
}

 function setting_takepic(child, socket2){
     console.log('[takepic_child] child: ' + child.pid + ' / socket: ' + socket2.id);
     child.stdout.on('data',function(time){
         console.log('time : '+ time);
        socket2.emit('takepic', time.toString().trim());
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
