var mongoose = require('mongoose');
var User = require('../app/models/user');
var Painting = require('../app/models/painting');
var Friend       = require('../app/models/friend');
async = require("async");
var path = require('path'),
    fs = require('fs'),
    q = require('q');
//var configDB = require('./config/database.js');
var localConnection = 'mongodb://localhost/knoldus';
var openShiftConnection = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
    process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
    process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
    process.env.OPENSHIFT_APP_NAME;
var bodyParser = require('body-parser');

mongoose.connect(openShiftConnection);
module.exports = function (app, passport, server) {
    var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
    var conn = mongoose.connection;
    var paintings = mongoose.model('Paintings',
               new mongoose.Schema(
                        {
                            authorId: String,
                            author: String,
                            paintingName: String,
                            description: String,
                            ratingSum: Number,
                            ratingCount: Number,
                            rating: Number
                        }),
               'paintings');

    var comments = mongoose.model('Comments',
               new mongoose.Schema(
                        {
                            author: String,
                            authorId: String,
                            paintingName: String,
                            paintingId: String,
                            comments: String
                        }),
               'comments');

    var notifications = mongoose.model('Notifications',
               new mongoose.Schema(
                        {
                            author: String,
                            authorId: String,
                            userName: String,
                            userId: String,
                            paintingName: String,
                            newMsg: String,
                            paintingId: String,
                            paintingDesp: String

                        }),
               'notifications');
    var paintingName = undefined;
    app.use(bodyParser.json());
	app.get('/', function(request, response) {
		response.render('index.html');
	});
	app.get('/user', auth, function(request, response) {
		response.render('user.html', {
			user : request.user
		});
	});

	app.get('/paintings', auth, function (request, response) {
	    console.log("/paintings/name:" + paintingName);
	    response.render('paintings.html', {
	        user : request.user,
	        name: paintingName
	    });
	});
	
	app.get('/image.png', function (req, res) {
    		res.sendfile(path.resolve('./uploads/image_'+req.user._id));
	});
	app.get('/headicon/:id/image.png', function (req, res) {
	    res.sendfile(path.resolve('./uploads/image_'+req.params.id));
	});

	app.get('/:authorId/:authorName/profile', auth, function (req, res) {
	    var reqId = req.params.authorId;
	    if (reqId == (req.user._id.toString())) {
	        res.render('paintings.html', {
	            user: req.user,
	            name: paintingName
	        });
	    } else {
	        res.render('friendpaintings.html', {
	            user: req.user,
	            authorId: req.params.authorId,
	            authorName: req.params.authorName
	        });
	    }
	});
	app.get('/paintings/:authorId/:paintingName/image.png', function (req, res) {
	    console.log("/paintings/:name/:id/image.png/author:" + req.params.paintingName);
	    res.sendfile(path.resolve('./uploads/' + req.params.authorId + '/image_' + req.params.paintingName));

	});
	app.post('/notifications/:id', function (request, response) {
	    console.log("newMsg:" + request.body.newMsg);
	    response.json(request.body)
	    notifications.findOne({ '_id': request.params.id }, function (err, notification) {
	        if (err) { console.log("Error: could not find notification") }
	        if (notification) {
	            notification.newMsg = request.body.newMsg;
	            notification.save(function (err) {
	                if (!err) {
	                    console.log("viewd successfully");              
	                }
	                else {
	                    console.log("Error: could not view ");
	                }
	            });
	        }

	    });
	});
	app.post('/recentwork/rating/:authorName/:paintingName/:paintingId', function (request, response) {
	    console.log("rating body:" + request.body.rating);
	    response.json(request.body)
        paintings.findOne({ '_id': request.params.paintingId }, function (err, painting)
        {
            if (err) { console.log("Error: could not find painting") }
            if (painting) {
                painting.ratingSum = painting.ratingSum + request.body.rating;
                painting.ratingCount = painting.ratingCount + 1;
                painting.rating = parseInt((painting.ratingSum / painting.ratingCount), 10);
                painting.save(function (err) {
                    if (!err) {
                        console.log("rate successfully");
                        console.log("rate sum: " + painting.ratingSum);
                        console.log("rate count: " + painting.ratingCount);
                        console.log("rate : " + painting.rating);
                    }
                    else {
                        console.log("Error: could not rate ");
                    }
                });
            }
		           
        });		 
    });
	app.get('/recentwork/comments/:authorName/:paintingName/:paintingId', auth, function (request, response) {
	    console.log("comments:" + request.params.paintingName);
	    comments.find(
            { 'paintingId': request.params.paintingId },
            function (error, results) {
                if (error) {
                    response.json(error, 400);
                } else if (!results) {
                    response.send(404);
                } else {
                    console.log("comments results:" + results);
                    response.json(results);
                }
            });
	});
	
	app.get('/allpaintings', auth, function (request, response) {
	   
	    paintings.find(
           
            function (error, results) {
                if (error) {
                    response.json(error, 400);
                } else if (!results) {
                    response.send(404);
                } else {
                    console.log("all paintings:" + results);
                    response.json(results);
                }
            });
	});
	
	app.get('/recentwork/:id', auth, function (request, response) {
	    console.log("recentwork:" + request.params.id);
	    paintings.find(
            { 'authorId': request.params.id },
            function (error, results) {
                if (error) {
                    response.json(error, 400);
                } else if (!results) {
                    response.send(404);
                } else {
                  
                    response.json(results);
                }
            });
	});

	app.get('/notifications/:id', auth, function (request, response) {
	    console.log("notifications");
	    notifications.find(
            { 'authorId': request.params.id },
            function (error, results) {
                if (error) {
                    response.json(error, 400);
                } else if (!results) {
                    response.send(404);
                } else {

                    response.json(results);
                }
            });
	});

	app.get('/recentwork/:authorId/:authorName/:paintingName/:id/:description', auth, function (request, response) {
	    response.render('workdetail.html', {
	        user: request.user,
	        authorId: request.params.authorId,
	        authorName: request.params.authorName,
	        paintingName: request.params.paintingName,
	        paintingId: request.params.id,
	        description: request.params.description
	    });
	});

	app.get('/notification', auth, function (request, response) {
	    response.render('notification.html', {
	        user: request.user,
	        authorId: request.user._id.toString()
	    });
	});
	app.get('/paintingedit/:authorId/:authorName/:paintingName/:id/:description', auth, function (request, response) {
	    response.render('paintingedit.html', {
	        user: request.user,
	        authorId: request.params.authorId,
	        authorName: request.params.authorName,
	        paintingName: request.params.paintingName,
	        paintingId: request.params.id,
	        description: request.params.description
	    });
	});

	app.get('/edit', auth, function(request, response) {
		response.render('edit.html', {
			user : request.user
		});
	});
	app.get('/upload', auth, function (request, response) {
	    response.render('upload.html', {
	        user: request.user
	    });
	});
	app.get('/paintings', auth, function (request, response) {
	    response.render('paintings.html', {
	        user: request.user
	    });
	});
	app.get('/recentwork', auth, function (request, response) {
	    console.log("find recentwork:" + request.user._id);
	    paintings.find(
            { 'authorId': request.user._id.toString()},
            function (error, results) {
	        if (error) {
	            response.json(error, 400);
	        } else if (!results) {
	            response.send(404);
	        } else {
	            console.log("find recentwork:" + results);
	            response.json(results);
	        }
	    });
	});
	app.get('/about', auth, function(request, response) {
		response.render('about.html', {
		    user: request.user

		});
	});
	app.get('/logout', function(request, response) {
		request.logout();
		response.redirect('/');
	});

		app.get('/login', function(request, response) {
			response.render('login.html', { message: request.flash('error') });
		});

		app.post('/login', passport.authenticate('login', {
			successRedirect : '/about', 
			failureRedirect : '/login', 
			failureFlash : true
		}));

		app.get('/signup', function(request, response) {
			response.render('signup.html', { message: request.flash('signuperror') });
		});


		app.post('/signup', passport.authenticate('signup', {
			successRedirect : '/about',
			failureRedirect : '/signup', 
			failureFlash : true 
		}));
		app.get('/edit', function(request, response) {
			response.render('edit.html', { message: request.flash('updateerror') });
		});

		app.get('/upload', function (request, response) {
		    response.render('upload.html', { message: request.flash('updateerror') });
		});

		app.delete("/delete/:authorName/:paintingName/:paintingId", function (request, response) {
		    paintings.find({ '_id': request.params.paintingId }).remove(function (err) {
		        if (!err) {
		            console.log("painting deleted successfully");	           
		        }
		        else {
		            console.log("Error: could not delete painting ");
		        }
		    });
		    comments.find({ 'paintingId': request.params.paintingId }).remove(function (err) {
		        if (!err) {
		            console.log("comments deleted successfully");	            
		        }
		        else {
		            console.log("Error: could not delete comments");
		        }
		        response.json("delete done.");
		    });
		});

		app.post('/submitdescription/:authorName/:paintingName/:paintingId/:description', function (request, response) {
		    if (!request.param('description')) {
		        response.json("description cannot be empty when saving a new picture", 400);
		        return;
		    }
		    paintings.findOne({ '_id': request.params.paintingId }, function (err, painting)
		    {
		        if (err) { return done(err); }
		        if (painting) {
		            painting.description = request.param('newdescription');
		            painting.save(function (err) {
		                if (!err) {
		                    console.log("edit successfully");
		                    response.redirect('/paintings');
		                }
		                else {
		                    console.log("Error: could not save description ");
		                }
		            });
		        }
		           
		    });		   
		});
		app.post('/submitcomments/:authorId/:authorName/:paintingName/:paintingId/:description', function (req, res) {
		    var newComments = {
		        author: req.user.user.name,
		        authorId: req.user._id,
		        paintingName: req.param('paintingName'),
		        paintingId: req.param('paintingId'),
		        comments: req.param('comments'),
		       
		    };

		    var newNotification = {
		        author: req.param('authorName'),
		        authorId:req.param('authorId'),
		        userName: req.user.user.name,
		        userId: req.user._id.toString(),
		        paintingName: req.param('paintingName'),
		        newMsg: 'new',
		        paintingId: req.param('paintingId'),
		        paintingDesp: req.param('description')

		    };

		    conn.collection('notifications').insert(newNotification, function (err, data) {

		        console.log(data);
		        
		    });

		    conn.collection('comments').insert(newComments, function (err, data) {
		        
		        console.log(data);
		        res.redirect('/recentwork/' + req.param('authorId') + '/' + req.param('authorName') + '/' + req.param('paintingName') + '/' + req.param('paintingId') + '/' + req.param('description'));
		    });
		});

		app.post('/upload', function (req, res) {
		    console.log("up:" + req.user);

		    if (!req.files.file.name) {
		        res.json("image cannot be empty when saving a new picture", 400);
		        return;
		    }
		    if (!req.param('description')) {
		        res.json("description cannot be empty when saving a new picture", 400);
		        return;
		    }

		    console.log('author:' + req.param('author'));
		    console.log('upload image:' + req.files.file.name);

		    var tempPath = req.files.file.path,
		        //targetPath = './uploads/' + req.param('author');
                targetPath = './uploads/' + req.user._id;
		    if (!fs.existsSync(targetPath)) {
		        fs.mkdirSync(targetPath);
		    }
		    targetPath = targetPath + '/image_' + req.param('paintingName');
		    if (req.files.file) {
		        var renameDeferred = q.defer();
		        fs.rename(tempPath, targetPath, function (err) {
		            if (err) {
		                renameDeferred.reject(err);
		            } else {
		                renameDeferred.resolve();
		                console.log("Upload completed!");
		            }

		        });

		        renameDeferred.promise.then(function () {
		            // rename worked
		            console.log("Upload completed!");
		        }, function (err) {

		            console.warn('io.move: standard rename failed, trying stream pipe... (' + err + ')');

		            // rename didn't work, try pumping
		            var is = fs.createReadStream(tempPath),
                        os = fs.createWriteStream(targetPath);

		            is.pipe(os);

		            is.on('end', function () {
		                fs.unlinkSync(tempPath);

		            });

		            is.on('error', function (err) {
		                throw err;
		            });

		            os.on('error', function (err) {
		                throw err;
		            })
		        });
		    }
		   
		    var newPainting = {
		        authorId: req.user._id.toString(),
		        author: req.param('author'),               
		        paintingName: req.param('paintingName'),
		        description: req.param('description'),
		        ratingSum: 0,
		        ratingCount: 0,
                rating:0
		       
		    };
		    conn.collection('paintings').insert(newPainting, function (err, data) {
		        
		        console.log(data);
		        //console.log('image_' + data.paintingName);
		        //res.send("Upload completed!");
		        //res.redirect('/paintings/' + 'image_' + req.param('paintingName'));
		        paintingName = req.param('paintingName');
		        res.redirect('/paintings');
		    });
		});
		app.post('/edit', function (req, res) {
		    console.log('update user:' + req.user);
		    console.log('update userImage:' + req.files.file.name);
				 var tempPath = req.files.file.path,
        			targetPath = './uploads/image_' + req.user._id;
				 if (path.extname(req.files.file.name).toLowerCase() === '.png') {
				     var renameDeferred = q.defer();
				     fs.rename(tempPath, targetPath, function (err) {
        				    if (err) {
        				        renameDeferred.reject(err);
        				    } else {
        				        renameDeferred.resolve();
        				        console.log("Upload completed!");
        				    }
            				
        				});

        				renameDeferred.promise.then(function () {
        				    // rename worked
        				    console.log("Upload completed!");
        				}, function (err) {

        				    console.warn('io.move: standard rename failed, trying stream pipe... (' + err + ')');

        				    // rename didn't work, try pumping
        				    var is = fs.createReadStream(tempPath),
                                os = fs.createWriteStream(targetPath);

        				    is.pipe(os);

        				    is.on('end', function () {
        				        fs.unlinkSync(tempPath);
        				        
        				    });

        				    is.on('error', function (err) {
        				        throw err;
        				    });

        				    os.on('error', function (err) {
        				        throw err;
        				    })
        				});
    				}
 			 User.findOne({ 'user.email' :  req.body.email }, function(err, user) {
                		if (err){ return done(err);}
                		if (user)
                    			user.updateUser(req, res)

                         });
  		});
		
		app.get('/profile', auth, function(request, response) {
			var query = Friend.find({'friend.mainfriendid': request.user._id}, { 'friend.anotherfriendid': 1 });
			query.exec(function(err, friends) {

      		if (!err) {
		var frdDetails = []
		var frdIds = []
		async.each(friends,
    			function(friend, callback){
				if(friend.friend.anotherfriendid == ''){
			console.log('No Friend')
				}else{
    					User.findById(friend.friend.anotherfriendid, function(err, user) {
    					    frdDetails.push(user.user.name);
    					    frdIds.push(user._id.toString());
 						    callback();
					});
   				}
  			},
  			function(err){
         			response.render('profile.html', {
					user : request.user,
					friends: frdDetails,
         			friendsId: frdIds
				});
  			}
		);
       		} else {
         		res.send(JSON.stringify(err), {
            			'Content-Type': 'application/json'
         		}, 404);
      		}
   		});

	});

	app.get('/search_member', function(req, res) {
   		var regex = new RegExp(req.query["term"], 'i');

   		var query = User.find({ $and: [ {'user.name': regex}, { _id: { $ne: req.user._id } } ] } ).limit(20);
        
      // Execute query in a callback and return users list
  		query.exec(function(err, users) {
      		if (!err) {
         		// Method to construct the json result set

         		res.send(users, {
            			'Content-Type': 'application/json'
         		}, 200);
      		} else {
         		res.send(JSON.stringify(err), {
            			'Content-Type': 'application/json'
         		}, 404);
      		}
   		});
	});

		app.post('/friend',  function (request, response){
				Friend.findOne({ $and: [ {'friend.mainfriendid': request.param('mainfriendid')}, { 'friend.anotherfriendid': request.param('anotherfriendid') } ] }, function(err, friend) {
            	    		if (err){ return done(err);}
                    		if (friend) {
				response.redirect('/profile');

                    		} else {
				if(request.param('anotherfriendid') != ''){
				var newFriend            = new Friend();
 			 	newFriend.friend.mainfriendid = request.param('mainfriendid');
				newFriend.friend.anotherfriendid = request.param('anotherfriendid');
	 			newFriend.save();
				}
				response.redirect('/profile');
				}
 				});
  		});



// GET /auth/facebook
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Facebook authentication will involve
// redirecting the user to facebook.com. After authorization, Facebook will
// redirect the user back to this application at /auth/facebook/callback
		app.get('/auth/facebook',
  			passport.authenticate('facebook',{ scope : 'email' }));

// GET /auth/facebook/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
		app.get('/auth/facebook/callback',
  			passport.authenticate('facebook', { 
				successRedirect : '/about', 	
				failureRedirect: '/login' }));





// GET /auth/twitter
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Twitter authentication will involve redirecting
// the user to twitter.com. After authorization, the Twitter will redirect
// the user back to this application at /auth/twitter/callback
app.get('/auth/twitter',
  passport.authenticate('twitter'));

// GET /auth/twitter/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { 
				successRedirect : '/about', 	
				failureRedirect: '/login' }));


// GET /auth/google
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Google authentication will involve
// redirecting the user to google.com. After authorization, Google
// will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope : ['profile', 'email'] }));

// GET /auth/google/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { 
				successRedirect : '/about', 	
				failureRedirect: '/login' }));


var io = require('socket.io').listen(server);

var usernames = {};

io.sockets.on('connection', function (socket) {

  socket.on('adduser', function(username){
    socket.username = username;
    usernames[username] = username;
    io.sockets.emit('updateusers', usernames);
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });
});

};
function auth(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
