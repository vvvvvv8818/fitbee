var app		= require('express')();
var http	= require('http');
var server	= http.Server(app);
var io		= require('socket.io')(server);
var spawn	= require('child_process').spawn;
var cons	= require('consolidate');

var PORT = 8188;

app.engine('ejs', cons.ejs);
app.engine('html', cons.swig);
app.set('views', './views');
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

	server.on('request', (req, res) => {
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
				res.render('mydata', {result:result});
			});
		});
	});	//server.on


});

function setting_socket(socket){
	socket.on('main', function(msg){
		console.log('msg : ' + msg);
	});

	//setTimeout(function(){ socket.emit('main', 'msg from app.js');}, 3000);


	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
}


function setting_child(child, socket){
	child.stdout.on('data', function(data){
		console.log('from child : ' + data);
		//console.dir(data);

		if (data == 'WORKOUT\n'){	// Object ArrayBuffer
			console.log('send this msg to main.html');
			socket.emit('main', data.toString());
		}
		else if (data == 'TAKEPIC\n'){
			console.log('send this msg to main.html');
			socket.emit('main', data.toString());
		}

	});

	child.stderr.on('data', function(data){
		process.stdout.write(data);
	});
}


server.listen(PORT, function(){ console.log('listening on ' + PORT); });
