const express=require('express');
const crypto=require('crypto');
const bodyParser=require('body-parser');
const jwt=require('jsonwebtoken');
const process=require('process');

const port = process.env.PORT || 8000;

var app=express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
var verifyToken=function(req,res,next)
{
  bearerHeader=req.headers["authorization"];
  if(typeof bearerHeader !== 'undefined')
  {bearers=bearerHeader.split(" ");
  req.token=bearers[1];
  jwt.verify(req.token,"Abhinay",(err,decode)=>{
     if(err)
     {
       res.send("Unauthorized");
     }
     else
     {
       next();
     }
  });
}
else{
  res.send("UnAauthorized");
}  
};


var genRandomString = function(length){
  return crypto.randomBytes(Math.ceil(length/2))
          .toString('hex') /** convert to hexadecimal format */
          .slice(0,length);   /** return required number of characters */
};

var sha512 = function(password, salt){
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
      salt:salt,
      passwordHash:value
  };
};


const MongoClient= require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017',(err,client)=>{
  if(err)
    {

    }
  else
   {
      const db=client.db("mydatabase");
      //Home
      app.get("/",verifyToken,(req,res)=>
    {
       res.send({i:1});
    });
    
    //Test
    app.get("/test",(req,res)=>{
      res.send("Waah Modiji waah");
    }); 


    //Register
    app.post("/register",(req,res)=>{
      var user=req.body;
      var salt=genRandomString('16');
      var hashedPass=sha512(user.password,salt);
      
      db.collection("myCollection").count({emai:user.email}).then((number)=>{
        if(number==0)
        {
          db.collection("myCollection").insertOne({name:user.name,password:hashedPass,email:user.email});
          res.json({message:"Successful"});
                 
        }
        else
        {
          res.json({message:"Email Already Exists"});
        }
      });
    
    });

    //Login
    app.post("/login",(req,res)=>{
      var usr= req.body;

      db.collection("myCollection").findOne({email:usr.email}).then((user)=>{

             if(user==null)
             {
                res.json({message:"User not existed"});
             }
             else
             {
               var newHash=sha512(usr.password,user.password.salt);

               if(newHash.passwordHash===user.password.passwordHash)
               {
                   var token= jwt.sign({email:user.email,name:user.name},'Abhinay');
                   res.send(token);
                  }
               else
               {
                 res.send("Incorrect Password");
               }
             }

            //res.send(user);

      });
    });

    app.listen(port);

  }
});
