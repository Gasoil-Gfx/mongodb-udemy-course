import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcrypt';

const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb://127.0.0.1/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB: ', error.message);
});

app.get('/', (req, res) => {
    if (req.session.email) {
        res.render('home', { email: req.session.email });
    } else {
        res.render('home', { email: null });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.redirect('/login');
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
            return res.status(500).send('Server Error');
        }

        const user = new User({ email, password: hash });

        try {
            await user.save();
            req.session.email = email; // Set the user email in the session after registering
            res.redirect('/');
        } catch (error) {
            res.status(500).send('Server Error');
        }
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/login');
        } 

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send('Server Error');
            }

            if (!isMatch) {
                return res.redirect('/login');
            } else {
                req.session.email = email; // Set the user email in the session after logging in
                res.redirect('/');
            }
        });

    } catch (error) {
        res.status(500).send('Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
