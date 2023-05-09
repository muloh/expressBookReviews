const express = require('express');
let books = require("./booksdb.js");
const jwt = require('jsonwebtoken');
const session = require('express-session')
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const uuid = require('uuid')
const axios = require('axios');


// POST request: Add a new user
public_users.post('/register', (req, res) => {
  const newUser = {
    id: uuid.v4(),
    username: req.body.username, 
    password: req.body.password, 
  }

  if(!newUser.username || !newUser.password){
    return res.sendStatus(400)
  }
  users.push(newUser)
  res.json(users)
})


// get users
public_users.get('/users', (req, res) => {
  res.json(users);
})

public_users.use(session({secret:"fingerpint"},resave=true,saveUninitialized=true));


const authenticatedUser = (username, password)=>{
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

public_users.use("/users", function auth(req,res,next){
   if(req.session.authorization) {
       token = req.session.authorization['accessToken'];
       jwt.verify(token, "access",(err,user)=>{
           if(!err){
               req.user = user;
               next();
           }
           else{
               return res.status(403).json({message: "User not authenticated"})
           }
        });
    } else {
        return res.status(403).json({message: "User not logged in"})
    }
});

// login user 
public_users.post("/login", (req, res) => {
  console.log("in the login form");
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,username
  }
  return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});


// Get the book list available in the shop
public_users.get('/',function (req, res) {
  //Write your code here
  res.send(JSON.stringify(books, null, 5));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  res.send(books[isbn])
 });
  



// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  //Write your code here
  const author = req.params.author;
  for (var key in books){
    if(books[key]['author'] === author){
      details = books[key]
    }
  }
  res.send(details);

});


// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  //Write your code here
  const title = req.params.title;
  for (var key in books){
    if (books[key]['title'] === title){
      details = books[key]
    }
  }
  res.send(details);
});


//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  res.send(books[isbn]["reviews"])
});


/// Add a book review
public_users.put("/auth/review/:isbn", (req, res) => {

  const isbn = req.params.isbn;
  let filtered_book = books[isbn]
  if (filtered_book) {
      let review = req.query.review;
      let reviewer = req.session.authorization['username'];
      if(review) {
          filtered_book['reviews'][reviewer] = review;
          books[isbn] = filtered_book;
      }
      res.send(`The review for the book with ISBN  ${isbn} has been added/updated.`);
  }
  else{
      res.send("Unable to find this ISBN!");
  }
});



// DELETE request: Delete a review by isbn number
public_users.delete("/auth/review/:isbn", (req, res) => {
  // Update the code here
  const review = req.params.review;
  console.log(req.params)
  const isbn = req.params.isbn;
  console.log("Isbn: === " + isbn);
  if (review) {
    delete books[review]
  }
  res.send(`review with ISBN ${isbn} deleted.`);
});


//Get the book list available in the shop using Promises
public_users.get('/books',function (req, res) {

    const get_books = new Promise((resolve, reject) => {
        resolve(res.send(JSON.stringify({books}, null, 4)));
      });

      get_books.then(() => console.log("Promise task resolved"));

  });


public_users.get('/isbns/:isbn',function (req, res) {

    const get_books = new Promise((resolve, reject) => {
      const isbn = req.params.isbn;
    
        resolve(res.send(books[isbn]));
      });

      get_books.then(() => console.log("Promise task resolved"));

  });


   public_users.get('/isbn/:isbn', function (req, res) {
    let bookIsbn= axios.get('/isbn/:isbn');
    bookIsbn.then(()=>{res.send(JSON.stringify(books,null,4))});
    bookIsbn.catch(err => {
        console.log(err.toString())
    });
    
  });


 public_users.get('/author/:author', function (req, res) {
    let authorAxios= axios.get('/author/:author');
    const author = req.params.author;
    for (var key in books){
      if(books[key]['author'] === author){
        details = books[key]
      }
    }
    authorAxios.then(()=>{res.send(details)});
    authorAxios.catch(err => {
        console.log(err.toString())
    });
    
  });


// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  //Write your code here
  let bookDetails= axios.get('/title/:title');
  const title = req.params.title;
  for (var key in books){
    if (books[key]['title'] === title){
      details = books[key]
    }
  }
  bookDetails.then(()=>{res.send(details)});
  bookDetails.catch(err => {
  console.log(err.toString())
  });
});


module.exports.general = public_users;
