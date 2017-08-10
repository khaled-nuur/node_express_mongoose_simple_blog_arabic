// بسم الله الرحمن الرحيم
var mongoose = require('mongoose'),
    async = require('async'),  // control flow made easier!
    credits = require('./credits'),
    moment = require('moment')

//setting up MongoDB connection
var mongoDB_URI = credits.DB_URI;
// Block flow while connecting to the DB
async.series(
    [
        function connect(callback) {
            mongoose.connect(mongoDB_URI, function (err) {
                if (err) {
                    return callback('Error! \n' + err.message)
                } else {
                    return callback(null,'Successfully Connected!! to the DB')
                }
            }
            );
        }
    ], function (err, success) {
        if (err) { console.log('Connection to the DB failed\n' + err) } else {
            console.log(success)
        }
    }
)

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var blogSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    _desc:{
        type: String,
        required: true
    },  // short description
    body:{
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true,
        default:'/../img/img-example.jpg'
    },  //URL host it any where else..
    tags: {
        type: Array,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
})
var adminSchema = mongoose.Schema({
    name: String,
    pass: String
})   // just use findOne to avoid multible admins....or just set limit:1 ♥♥♥
var blog = mongoose.model('blog', blogSchema)
var admin = mongoose.model('admin', adminSchema)
/*
    AND HERE DATABASE IS DONE ALL IN RIGHT WAY WE WAS IN  NEED TO...
    <<highly secret>>
    and now the idea of posting my proj. to IO.Hsoub.com comed ☺ ☺ ☺,,,
    please don't ask me what come out with this "bad" Idea..I also don't know^^ May be for more stars[الهدف رقم واحد للعديد من أهالي آي/أو..مثلي!!تمام؟؟].
    <<//the simple secret>>
*/

// Get articles
function getArticles(page, cb = Function) {
    // pagination support
    var perPage = 10;
    query = blog.find();
    // sort by date{latest}
    query.sort('-date')
    //limit results
    query.limit(perPage);
    // leave un-wanted
    query.select('title _desc body img tags date')
    // skip the readed blogs
    query.skip(perPage * page)  // if page=ZERO then res==ZERO ^_*
    query.exec(function (err, data) {
        if (err) {
            return cb(Error('serius error in db\n' + err.message), null)
        } else {
            // callback(null,data);
            return cb(null, data)
        }
    })
}
// new article
function newArticle(articleBody, cb) {
    // first = new blog({title:'Awsome title',body:'Awesome Body for my first blog...'}).save(function(err){if(err){console.log('ERROR')}else{console.log('Successfully saved your first blog')}})
    if (!articleBody) { return cb(Error("the Article to save is missing")) };
    var theNewArticle = new blog({
        title: articleBody.title,
        _desc: articleBody._desc,
        body: articleBody.body,
        img: articleBody.img,
        tags: [articleBody.tags],
        date: moment()
    })
    theNewArticle.save(  // save article
        function (err) {
            if (err) {
                cb(err)
            } else {
                cb(null, 'SUCCESS')
            }
        })
}
// Update article
/*
    PROBLEM: updateById or updateByTitle?
        most users can't recognize _id[long 24-digits of random numbers and letters],compared to title field it seems better
    and better to use title rather then id; and the _id field is the only where that reapeating is impossible.
    Problem begins here some '~mad' users can set titles of two articles the same,and checking every time user create is weste of time,
    when PERFOMANCE is the MASTER ☹☹. now in this simple blog I will use this '/bad-way\' becouse FEATURE is MASTER
*/
function updateArticle(targetTitle, res, cb) {
    // really good thing to do!
    res.date = moment()
    blog.update({ title: targetTitle || null }, res, cb)
}
function deleteArticle(targetTitle, cb) {
    blog.remove({ title: targetTitle || null }, function (err) { cb(err) })
}
// newArticle({title: 'OOOH',body: 'Good Body go here, no spam in my world..Hakuna-Mataanaaa',img: 'www.some_site.domain/logo.svg',tags: ['tag1', 'tag2', 'tag3'],_desc: 'short description go here'},function(err,res){console.log(err||res)})
var content = Object({
    title: 'Blue Gray fish the father of shark',
    body: 'Good Body go here, no spam in my world..Hakuna-Mataanaaa',
    img: 'www.some_site.domain/logo.svg',
    tags: ['tag1', 'tag2', 'tag3'],
    _desc: 'short description go here'
})
function getArticle(targetTitle, cb) {
    blog.findOne({ title: targetTitle }, function (err, res) {
        if (!res) {
            cb(new Error('Article Not found'))
        } else {
            cb(null, res)
        }
    })
}

// is article created before? || there is article with the same title? a check point before saving article
function isTitleUsed(title, cb) {
    var document = blog.find(
        { title: title },
        function (err, result) {
            if (result.length) {
                cb(true)
            } else {
                cb(false)
            }
        })
}
// EPORT FUNCTIONALITY
module.exports.getArticles = getArticles;
module.exports.updateArticle = updateArticle;
module.exports.deleteArticle = deleteArticle;
module.exports.newArticle = newArticle;
module.exports.getArticle = getArticle;
module.exports.isTitleUsed = isTitleUsed;