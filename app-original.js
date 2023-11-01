// Import dependencies using ES6 syntax
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcrypt';
// import 'dotenv/config';
const saltRounds = 10;

// Create Express app
const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

app.use(session({
    secret: 'your-secret-key', // This is a secret key to sign the session ID cookie.
    resave: false,             // Forces the session to be saved back to the session store, even if the session wasn’t modified during the request.
    saveUninitialized: false,  // Forces a session that is "uninitialized" to be saved to the store.
    cookie: { secure: true }   // This means the cookie will only be set over an HTTPS connection.
}));


// Use built-in middleware for parsing JSON and URL-encoded data
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Define a simple schema and model for user data
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB: ', error.message);
});

// Define routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', (req, res) => {
    res.render('secrets');
});

app.post('/register', (req, res) => {
    if (!req.body.email || !req.body.password) {
        console.log('No credentials provided');
        return res.redirect('/login');
    }

    // Hash the password and then save the user
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        }

        // Create a new user instance with hashed password
        const user = new User({
            email: req.body.email,
            password: hash
        });

        try {
            // Save the user to the database
            await user.save();
            console.log('User registration successful');
            res.redirect('/secrets');
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    });
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('No credentials provided');
        return res.redirect('/login');
    }

    try {
        // Find the user document with the provided email
        const user = await User.findOne({ email });
        
        if (!user) {
            // If no user is found, log an error and redirect to the login page
            console.log('Email not found');
            return res.redirect('/login');
        } 

        // Compare the provided password with the hashed password in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server Error');
            }

            if (!isMatch) {
                console.log('Incorrect password');
                return res.redirect('/login');
            } else {
                console.log('Credentials are correct');
                res.redirect('/secrets');
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});



// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
