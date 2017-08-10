var express = require('express');
//HANDLEBARS
var exphbs = require('express-handlebars');
var app = express();
var hbs = exphbs.create({ /* config */ });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
function first(req, res, next) {
    var err = new Error('الصفحة مفقودة!!');
    err.status = 404;
    next(err);
};

function final(err, req, res, next) {
    res.status(err.status || 500);
    res.render('err', {
        message: err.message,
        status: err.status||500
    });
};

exports.first = first;
exports.final = final;