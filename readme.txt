
//SETTING UP THE PROFFESIONAL PROJECT ENVIRONMENT

when ever we add files or make changes in server we have to do
restart the server again and again
so, to get rid of this we will use a utility called nodemon that when ever you save your file 
it restart the server.

 DEV Dependedencies:

1. Nodemon:
It install dev dependency (dev dependency is the dependency used in the development and not passed in production it doesnt put anytype of load in server.)
but if you install it as npm i nodemon(then it will become dependency and passed into the production)
if you install it as npm i --save-dev nodemon or npm i -D nodemon (dev dependeny)

2. prettier:
It is also a dev dependency to make your code more synchronous with the industry standards and a group of people because in industry more than one people write a code for same project so their spaces and tab spaces 
are different and at the time of commiting the project to github it could generate many errors. its file will be named as (.prettierrc)
also make (.prettierignore) where file will be ignored generally we put .env files because whenever prettier touches them make the big chnages which is difficult to resolve later

//STARTING THE PROFFESIONAL PROJECT

#The database connection can happen in two or three ways,
 there are only two major ways and we will take both approaches:

 1.because we are going to execute the index file first through the node or through the node mind. So I put all the code inside the index file
  and as soon as that function means the index file is loaded, the function in which I have written the code of the database connection 
 will be executed immediately.

 2. one approach is this and the other approach is that I create a folder named DV, write whatever my function of a connection inside it and then
  I import that function in my index file and get it executed there. There is a professional approach
 , if you want, you can also do that you simply keep everything in the index and get it executed 

 app.js will be used through express and database connection through mongoose

 //INSTALLING DEPENDENCY PACKAGES

 1. dotenv Package: 
    It is a dependency package to provide system envrironment variables.

 2. EXpress:
    It is dependency package the helps to obtain user request and create the server.

 3. Mongoose:
    It is also a dependecny package the helps to generate schema of the db and add validators.

# I always say that look, keep two things well noted, the first thing in any notebook is that 
 whenever you try to talk to the database, problems can arise,
 1. It means wrap in try catch
    it is a very better approach, okay, look at try catch or what will you take or you can 
 
 2. either take a promise because If the error comes, then it gets handled there too, from the resolve reject,
 then one of the two will have to be taken.

# I always cram it that the database is always in another continent 
i.e. the database is kept in another continent 
but sir we have just kept our database in Mumbai, yes but maybe your code base is kept inside the US 
or maybe your database is kept internally instead of Mumbai for some time. It may have gone to Bangalore, 
it is far away, so whenever you talk to the database, it takes time, it means that it will have to be waited, 
it is always a better approach that whenever you talk to the database.       
//Do try catch and take care of the async() and await or wait().

//AFTER SUCCESSFUL DB connection

START with express:

make the app in app.js export it
listen the exported app in index.js
install cookie parser package and cors package. more info follow doc
import the packages in index.js
and use them using the app.use keyword because they are middleware and middlewares are used suing the keyword use.

// UTILITIES
now we will connect to db many time so we have to write trycatch code many time so why not we make a utility (which is function the does some work and return value and use it as a wrapper)
in our utility and also write apierror file and a api response file in utility

//MODELS
1.make user and video models, 

2.remember an entity in video model name watchlater we install a new
npm package in mongoose call mongoose-aggregate-Paginate-v2 which helps use to write aggregate pipelines in mongoDB (you can study more about 1.mongoose call mongoose-aggregate-Paginate-v2 2. aggregation piplines in MongoDB study the articles)
import same file and plugin with schema, and now we can write aggregation queries and aggregation pipelines 
      
      //Password Hashing
3. now install npm bcrypt(which comes in two forms bcrypt.js and bcrypt.nodejs(which is core bcrypt)) It is use to hash password 
basically hashing the password and decrypting it to protect it from attackers
for it we will install bcrypt.nodejs file

4. now install JWT(json web token ) they both are based on cryptography that makes tokens.(these are the basic lib, and used in almost every project)

5. import the above two packages in users models, now we can not directly incrept or decrypt password 
so we need a mongoose hook(not need to install already in mongoose file) also a middleware 'Pre' which is a middleware that check the condition or performm a task just before the data saves in database
they are usually write in the models part only.

6. //imp JWT is a bearer(means jiske pass bhi ye hoga mai usse data pass kardunga) token

//FILE UPLOADING in Cloudinary

1. Install npm package to install cloudinary, and multer
and using a npm middleware for file handling "fs"