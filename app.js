// Import dependencies using ES6 syntax
import express from 'express';
import mongoose from 'mongoose';
import encrypt from 'mongoose-encryption';
import 'dotenv/config';

const secret = process.env.SOME_LONG_UNGUESSABLE_STRING;

// Create Express app
const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

// Use built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define a simple schema and model for user data
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
}, { timestamps: true });
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });
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

app.post('/register', async (req, res) => {
    if (!req.body.email || !req.body.password) {
        console.log('No credentials provided');
        return res.redirect('/login');
    }  
    try {
        // Create a new user document in MongoDB
        const user = new User({
            email: req.body.email,
            password: req.body.password
        });
        await user.save();
        console.log('User registration successful');  // Log the success message
        res.render('secrets');  // Render the secrets.ejs page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.post('/login', async (req, res) => {
    if (!req.body.email || !req.body.password) {
        console.log('No credentials provided');
        return res.redirect('/login');
    }    
    try {
        // Find the user document with the provided email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            // If no user is found, log an error and redirect to the login page
            console.log('Email not found');
            return res.redirect('/login');
        } else {
            // If a user is found, compare the provided password to the password stored in the database
            if (req.body.password !== user.password) {
                // If the passwords do not match, log an error and redirect to the login page
                console.log('Incorrect password');
                return res.redirect('/login');
            } else {
                // If both the email and password are correct, log a success message and render the secrets page
                console.log('Credentials are correct');
                res.render('secrets');
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
