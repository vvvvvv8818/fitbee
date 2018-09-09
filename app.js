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
var awsServer = 'http://13.124.65.48:3000';

var mycss = {
    style: fs.readFileSync('./stylesheet/background.css', 'utf8')
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
	// set socket + make child
	io.on('connection', function(socket){
		console.log('a user connected');
		var child = spawn('node', ['child_recog.js']);
		setting_recog(socket, child);
	});

	res.render('main', {mycss:mycss,
						userName:'MY NAME',
						concent_part:'CONCENT',
						weak_part:'WEAK'
						}
	);
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

	console.log(MYIP);
	console.log(PORT);
	console.log(MYADDR);
	res.render('routine', {result:result});
});




app.get('/workout', function(req, res){
	// 민정 프로세스 키면 횟수 세질때 마다 데이터 날아옴
	res.sendFile(__dirname + '/workout.html');
});
//루틴안내 html보여주기


app.get('/takepic', function(req, res){
	io.on('connection', function(socket){
		console.log('[/takepic] a user connected');
		setting_socket(socket);	

		var child = spawn('node', ['child_recog.js']);
		setting_child(child, socket);
	});

	res.render('takebosypic.ejs',{
		mycss2: mycss2
	});
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
				response.render('mydata.ejs', {
					mycss3: mycss3
				});
			});
		});
	});	//server.on


});


function setting_recog(socket, child){
	console.log('[setting_socket]');
	socket.on('main', function(msg){
		console.log('msg : ' + msg);
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
		child.kill();
	});


	console.log('[setting_child]');
	child.stdout.on('data', function(data){
		console.log('from child : ' + data);

		if (data == 'WORKOUT\n' || data == 'TAKEPIC\n' || data == 'MYDATA\n'){	// Object ArrayBuffer
			console.log('send ' + data.toString().trim() + ' to main.html');
			socket.emit('main', data.toString().trim());
		}
	});

	child.stderr.on('data', function(data){
		process.stdout.write(data);
	});

	child.on('exit', function(code) {
		console.log('Child exited with code :' + code);
	});
}



/*
function setting_socket(socket){
	console.log('[setting_socket]');
	socket.on('main', function(msg){
		console.log('msg : ' + msg);
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
}
*/
/*
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

	child.on('exit', function(code) {
		console.log('Child exited with code :' + code);
	});
}
*/

server.listen(PORT, function(){
	console.log(MYIP);
	console.log(PORT);
	console.log(MYADDR);
	console.log('listening on ' + PORT);
});
