const express = require("express");
const bodyparser = require('body-parser')
const path = require("path")
const fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbSessionStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shope');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');
const User = require('./models/User');
const { forwardError } = require('./utils');
const dotenv = require("dotenv");
const { connect } = require("./configdb/db")
dotenv.config();


const app = express();

app.use(express.json());
//express do'not knowe data you reurn in view must be write this
app.use(express.urlencoded({ extended: false }));
// Multer configs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image.jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(multer({ storage, fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    storage
}));
app.use(csrf());
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                next();
            }
            req.user = user;
            next();
        })
        .catch(err => forwardError(err, next));
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Page Not Found Error Middleware
app.use(errorController.get404);

// Unexpected Error Handler Middleware
// app.use(errorController.get500);
// app.get("/", async(req, res) => {
//     res.send("Heelo")
// });
// app.get("/index", async(req, res) => {
//     res.render('index')
// })
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server Started at port ${port}`)
})
connect()
    //  http://localhost:8000