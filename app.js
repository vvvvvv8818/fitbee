var app		= require('express')();
var http	= require('http');
var server	= http.Server(app);
var io		= require('socket.io')(server);
var spawn	= require('child_process').spawn;
var cons	= require('consolidate');
var path	= require('path');
var externals = require('./externals.js');

app.engine('ejs', cons.ejs);
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


var PORT = 8188;
var awsServer = 'http://13.124.65.48:3000';


app.get('/login', function(req, res){
	console.log('login');
	var child = spawn('python', ['./faceDetect.py']);

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
				res.send(body);
			});
		}
		else {
			res.send('-1');
		}
	});
});


app.get('/main', function(req, res){
 // make child process
	// set socket
	io.on('connection', function(socket){
		console.log('a user connected');
		setting_socket(socket);	

		var child = spawn('node', ['child_recog.js']);
		setting_child(child, socket);

	});

	res.sendFile(__dirname + '/main.html');
});



app.get('/routine', function(req, res){
	result = 'tmp routine result'
	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/routine/1'
	}
/*
	server.on('request', (req, response) => {
		var awsReq = http.get(options, (awsRes) => {
			awsRes.setEncoding('utf-8');
			result = '';
			
			awsRes
			.on('data', (chunk) => {
				result += chunk;
				console.log('[/mydata] chunk : ' + chunk);
			})
			.on('end', () => {
				console.log('[/mydata] result : ' + result);
				response.render('mydata', {result:result});
			});
		});
	});	//server.on
*/

	result = externals.MYIP;
	res.render('routine', {result:result});
});




app.get('/workout', function(req, res){
	// 민정 프로세스 키면 횟수 세질때 마다 데이터 날아옴
	res.sendFile(__dirname + '/workout.html');
});



app.get('/takepic', function(req, res){
	io.on('connection', function(socket){
		console.log('[/takepic] a user connected');
		setting_socket(socket);	

		var child = spawn('node', ['child_recog.js']);
		setting_child(child, socket);
	});

	res.sendFile(__dirname + '/takepic.html');
});


app.get('/mydata', function(req, res){
	result = 'test result'
	var options = {
		host: '13.124.65.48',
		port: 3000,
		path: '/user/inbody/1'
	}

	server.on('request', (req, response) => {
		var awsReq = http.get(options, (awsRes) => {
			awsRes.setEncoding('utf-8');
			result = '';
			
			awsRes
			.on('data', (chunk) => {
				result += chunk;
				console.log('[/mydata] chunk : ' + chunk);
			})
			.on('end', () => {
				console.log('[/mydata] result : ' + result);
				response.render('mydata', {result:result});
			});
		});
	});	//server.on


});

function setting_socket(socket){
	console.log('[setting_socket]');
	socket.on('main', function(msg){
		console.log('msg : ' + msg);
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
}


function setting_child(child, socket){
	console.log('[setting_child]');
	child.stdout.on('data', function(data){
		console.log('from child : ' + data);
		//console.dir(data);

		if (data == 'WORKOUT\n' || data == 'TAKEPIC\n' || data == 'MYDATA\n'){	// Object ArrayBuffer
			console.log('send ' + data.toString().trim() + ' to main.html');
			socket.emit('main', data.toString().trim());
		}
	});

	child.stderr.on('data', function(data){
		process.stdout.write(data);
	});
}


server.listen(PORT, function(){ console.log('listening on ' + PORT); });
