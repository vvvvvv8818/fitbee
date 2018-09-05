var app		= require('express')();
var http	= require('http');
var server	= http.Server(app);
var io		= require('socket.io')(server);
var spawn	= require('child_process').spawn;
var cons	= require('consolidate');
var path	= require('path');

var PORT = 8188;

app.engine('ejs', cons.ejs);
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.get('/login', function(req, res){
	res.sendFile(__dirname + '/login.html');
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



app.get('/workout', function(req, res){
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
