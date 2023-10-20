if(process.env.NODE_ENV !=="production")
{
  require('dotenv').config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const Campground = require("./models/campground");
const ejsMate = require("ejs-mate");
const catchAsync = require("./utils/catchAsync.js");
const ExpressError=require('./utils/ExpressError.js');
const {campgroundSchema,reviewSchema}=require('./schemas.js');
const Review=require('./models/review');

 const DB_URL=process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

const session=require('express-session');
const flash=require('connect-flash');

const passport=require('passport');
const LocalStategy=require('passport-local');

const User=require('./models/user');
//added while routing
const campgroundRoutes=require('./routes/campgroundRoutes');
const reviewRoutes=require('./routes/reviewRoutes');
const userRoutes=require('./routes/userRoutes');

const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();



//
//DB_URL
mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("connection established");
  })
  .catch((err) => {
    console.log("ohh no error");
    console.log(err);
  });


app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,'public')));

const secret=process.env.SECRET || 'notagoodsecret';

const store = new MongoDBStore({
  uri:DB_URL ,
  secret,
  touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e)
})


const sessionOptions={
  store,
  secret,
   resave:false,
   saveUninitialized:true,
   cookie:{
     httpOnly:true,
     expires:Date.now*(1000*60*60*7*24),
     maxAge:1000*60*60*7*24
   }
  
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.currentUser=req.user;
  res.locals.success=req.flash('success');
  res.locals.error=req.flash('error');
  next();
})

app.get("/", (req, res) => {
  res.render("home");
});


app.use('/',userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id',reviewRoutes);


app.all('*', ( req, res, next) => {
    
  next(new ExpressError('page not found',404));

 });

 app.use((err,req,res,next)=>{
  const {statusCode=500}=err;
  if(!err.message){err.message='oh , no something went wrong' ;};
  res.status(statusCode).render('error',{err});

})

const port=process.env.PORT || 80;
app.listen(port, () => {
  console.log("listening on port 80");
});





