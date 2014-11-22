var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var paintingSchema = mongoose.Schema({
    painting: {       
        author: String,
        paintingName: String,
        description: String
    }
});


paintingSchema.methods.insertPainting = function (request, response) {

    this.painting.description = request.body.description;
    this.painting.save();
    response.redirect('/paintings');
};



module.exports = mongoose.model('Painting', paintingSchema);
