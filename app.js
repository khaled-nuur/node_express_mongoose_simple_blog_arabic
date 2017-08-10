// بسم الله الرحمن الرحيم
var express = require('express'),
    credits = require('./credits'),
    exphbs = require('express-handlebars'),
    db = require('./dbS'),
    async = require('async'),
    path = require('path');

var app = express(); // create the application
// MIDDLEWARES
app.use(require('cookie-parser')(credits["cookie-secret"]));
app.use(require('body-parser')());
app.use(express.static(
    path.join(__dirname, 'puplic')));
//  HANDLEBARS
var hbs = exphbs.create({ /* config */ });
// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// home
app.get('/', function (req, res) {
    db.getArticles(0, function (err, data) {
        res.render('home', {
            articles: data
        });
    });

});

//  pagination
app.get('/page/:page', function (req, res, next) {
    // anti XSS & spammy requests to the DB
    if (!Number(req.params.page)) {
        req.params.page = 0;
    }
    db.getArticles(req.params.page, function (err, data) {
        if (err) {
            next(new Error('500 Internal server error'));
        } else if (data.length == 0) {
            next(new Error('Articles End'));
        } else {
            res.render('home', {
                articles: data
            });
        }
    });

});
//  article page
app.get('/article/:articleID', function (req, res, next) {
    db.getArticle(req.params.articleID, function (err, article) {
        if (err) {
            next(new Error('404 Not found!'));
        } else {
            res.render('article', {
                title: article.title,
                body: article.body,
                date: article.date,
                _desc: article._desc,
                tags: article.tags,
                img: article.img
            });
        }
    });

});
/*
    AND FROM NOW THE REST IS ADMIN'S PART.[Update & Create]
    - all admin activities require log-in/ cookie-based authentication.
    - admin pass and name are as predefined variables, so they can be changed easily
*/

// render log-in page
app.get('/login', function (req, res) {
    res.render('log-in');
});

// save cookie
app.post('/login', function (req, res, next) {
    if (!req.body.name || !req.body.pass) {
        next(new Error('لم تقم بملء النماذج'));
    } else if (!(req.body.name == 'خالد نور') || !(req.body.pass == "الله أكبر")) {
        next(new Error('لم تدخل معلومات صحيحة...حاول لاحقا!'));
    } else {
        res.cookie('role', 'admin');
        res.render('index', {
            task: 'تم تسجيل دخولك بنجاح!!احمد اللّه تعالى'
        });
    }
});

// log out
app.get('/logout', function (req, res, next) {
    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        res.cookies.delete('role')
    }
})

// new article
app.get('/create', function (req, res, next) {
    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        res.render('new-article', {
            action: 'new',
            pageTitle: 'مقــال جديد'
        })
    }
})

//  save the new article
app.post('/new', function (req, res, next) {
    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        // some fields blank?
        if (!req.body.title || !req.body.desc || !req.body.body || !req.body.tags || !req.body.img) {
            next(new Error('you left some fields blank'))
        } else { // all fields filled✓✓✓
            //  is title available and not used before in any other article?
            db.isTitleUsed(req.body.title,
                function (response) {
                    if (response) { // title used
                        next(new Error('العنوان الذي اخترته لموضوعك ليس متوفراا للأسف الشديد'))
                    } else { // title is available✓✓✓
                        // save Article
                        db.newArticle({
                            title: req.body.title,
                            body: req.body.body,
                            _desc: req.body.desc,
                            img: req.body.img,
                            tags: Array(String(req.body.tags).split(','))
                        }, function (err) { // what happened with the article?
                            if (err) { // err in DB?
                                next('Error In DB')
                            } else { // notify user, that his article saved successfully
                                res.render('index', {
                                    task: 'تم حفظ مقالك بنجاح!..احمد اللّه تعالى على ذلك!!'
                                })
                            }
                        })
                    }
                })

        }
    }
})

// Update article
app.get('/update/:articleID', function (req, res, next) {

    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        db.getArticle(req.params.articleID, function (err, article) {
            if (err) {
                next(new Error('404 Not found!'))
            } else {
                res.render('new-article', {
                    title: article.title,
                    body: article.body,
                    date: article.date,
                    desc: article._desc,
                    tags: article.tags,
                    pageTitle: 'تحديث مقــال',
                    original_title: true, // notify Handlebars that we are updating, not creating,
                    action: 'update'
                })
            }
        })
    }
})

// save updated version
app.post('/update', function (req, res, next) {
    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        // some fields blank?
        if (!req.body.title || !req.body.desc || !req.body.body || !req.body.tags || !req.body.original) {
            next(new Error('you left some fields blank'))
        } else { // all fields filled ✓
            // save Article
            db.updateArticle(req.body.original, {
                title: req.body.title,
                body: req.body.body,
                _desc: req.body.desc,
                img: req.body.img,
                tags: Array((req.body.tags).split(','))
            }, function (err) { // what happened wiht article?
                if (err) { // err in DB?
                    next('Error In DB ' + err.message)
                } else { // SAVED✓✓. notify user, that his article updated successfully
                    res.render('index', {
                        task: 'تم تحديث المقال! احمد الله على نعمه'
                    })
                }
            })
        }
    }
})

// Delete Article: are you sure?
app.get('/delete/:articleID', function (req, res, next) {
    res.render('delete article', {
        title: req.params.articleID,
        admin: true
    })
})
// user is sure, and we must delete
app.get('/delete/permanent/:articleID', function (req, res, next) {

    if (!(req.cookies.role == 'admin')) {
        next(new Error('غير مسموح!.سجل الدخول أولا'))
    } else {
        db.deleteArticle(req.params.articleID, function (err, success) {
            if (err) {
                next(new Error('لعلة ما، لم يتم حذف المقال'))
            } else {
                res.render('index', {
                    task: 'تم حذف المقال نهائيا..آسفـــــون'
                })
            }
        })
    }
})
// last titles/articles (used as iframe in article page)
app.get('/lastTitles', function (req, res, next) {
    db.getArticles(0, function (err, articles) {
        res.render('last-titles', {
            article: articles
        })
    })
})

app.get('/test-admin', function (req, res) {
    if (!(req.cookies.role == 'admin')) {
        res.render('index', {
            task: 'Not Logged in'
        })
    } else {
        res.render('index', {
            task: 'Logged In'
        })
    }
})
FourZeroFour = require('./404');
app.use(FourZeroFour.first);
app.use(FourZeroFour.final);
process.env.NODE_ENV === "production";
listener = app.listen(process.env.PORT, function () {
    console.log('Started at ' + listener.address().port)
})
