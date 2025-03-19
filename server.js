// Packages importeren
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import flash from "express-flash";
import multer from "multer";
import path from "path"; 
import { fileURLToPath } from "url";

// Laad enviroment variabelen
dotenv.config();

// express initaliseren
const app = express();

// App settings configureren
app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware toevoegen 
app.use(express.json()); // Zorgt dat we JSON-data kunnen verwerken
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
// Sessies instellen
app.use(session({
        secret: process.env.SESSION_SECRET, // Kies een geheime sleutel
        resave: false, // Niet elke keer opnieuw opslaan
        saveUninitialized: true, // Sla onbewerkte sessies op
        cookie: { secure: false, httpOnly: true }, // Dit moet `true` zijn als je HTTPS gebruikt
    })
);
// flash messages instellen
app.use(flash());


// 📌 DATABASE CONNECTIE
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database verbonden"))
    .catch(err => console.log("❌ Database fout:", err));

// 📌 USER MODEL
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    birthdate: Date
});
const User = mongoose.model("User", userSchema);

// 📌 COCKTAIL MODEL
const cocktailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ingredients: { type: [String], required: true },
    measurements: { type: Number, required: true },
    category: { type: String },
    alcohol: { type: Boolean },
    rating: { type: Number, default: 0 },
    reviews: [
        {
            user: { type: String },
            rating: { type: Number },
            comment: { type: String },
        },
    ],
    image: { type: String } // Path to uploaded image
});
const userCocktail = mongoose.model("userCocktail", cocktailSchema);

// 🔹 REGISTRATIE (GET)
app.get('/register', async (req, res) => {
    res.render('register');
});

// 🔹 REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
    const { username, email, password, birthdate } = req.body;
    if (!username || !email || !password || !birthdate) {
        req.flash('error', "All fields are required!");
        return res.redirect('/register');
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', "try a different email address");
            return res.redirect('/register')
        }

        const formattedBirthdate = new Date(birthdate);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword, birthdate: formattedBirthdate });
        await user.save();

        // Sessies instellen na registratie (direct inloggen)
        req.session.userId = user._id;  // Zet de gebruikers-ID in de sessie
        req.flash('success', "Account has been succesfully registerd!");
        res.redirect('/login');
    } catch (err) {
        res.redirect('register');
    }
});


// 🔹 LOGIN (GET)
app.get('/login', async (req, res) => {
    res.render('login');
});


// 🔹 LOGIN (POST)
app.post("/users/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Inlogpoging voor email:", email); // Controleer de ingevoerde email

    const user = await User.findOne({ email });
    console.log("Gevonden gebruiker:", user); // Controleer of een gebruiker wordt gevonden

    if (!user) {
        req.flash('error',"User not found");
        return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Wachtwoord correct:", isMatch); // Controleer of het wachtwoord klopt

    if (!isMatch) {
        req.flash('error', "try a different email or password");
        return res.redirect('/login');
      }

    // Sessies instellen bij succesvolle login
    req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
    req.session.username = user.username; // Sla de gebruikersnaam op in de sessie
    
    req.flash('success', "You are logged in");
    res.redirect('/profile');
    console.log("Sessie na login:", req.session);
});


// Check of de gebruiker ingelogd is
app.get('/check-session', (req, res) => {

    console.log("Huidige sessie bij check:", req.session);

    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// 🔹 LOGOUT (GET)
app.get('/logout', async (req, res) => {
    res.render('logout');
});

// 🔹 LOGOUT (POST)
app.post('/logout', (req, res) => {
    if (req.session) {
        // Flash berichten instellen voordat de sessie wordt vernietigd
        req.flash('success', 'You have been successfully logged out.');

        req.session.destroy((err) => {
            if (err) {
                console.error('A failed logout:', err);
                req.flash('error', 'Something went wrong while logging out. Try again.');
                return res.redirect('/profile');
            }

            res.clearCookie('connect.sid'); // Verwijder de sessie cookie
            res.redirect('/home'); // Redirect naar register pagina
        });
    } else {
        // Als er geen actieve sessie is, redirect naar register pagina
        res.redirect('/home');
    }
});


// 🔹 BEVEILIGDE ROUTE (bijvoorbeeld: Favorieten, uploaden van cocktails)
app.get("/cocktails/favorites", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Je moet ingelogd zijn om toegang te krijgen" });
    }
    res.json({ message: "Dit is de beveiligde favorieten route" });
});

// 🔹 ZOEK COCKTAILS (GET)
app.get("/cocktails/search", async (req, res) => {
    const { query } = req.query;
    try {
        const cocktails = await userCocktail.find({
            $or: [{ name: new RegExp(query, "i") }, { ingredients: new RegExp(query, "i") }]
        });
        res.json(cocktails);
    } catch (err) {
        res.status(500).json({ error: "Fout bij ophalen van cocktails." });
    }
});

// 🔹 HOME PAGE & API FETCHING

app.get('/home', async (req, res) => {
    res.locals.currentpath = req.path;
    
    try {
        const data = await fetchData(API + 'popular.php');
        // const cocktails = data.drinks;
        const cocktails = data.drinks || [];

        if (!cocktails) {
            return res.status(404).send("Geen cocktails gevonden.");
        }

        
        
        res.render('home.ejs', { cocktails });
    } catch (error) {
        console.error("Fout bij ophalen van cocktails:", error);
        res.status(500).send("Er is een probleem met het laden van cocktails.");
    }
});


app.get("/instructions", async (req, res) => {
    res.render("instructies", {});
});

app.get("/upload", async (req, res) => {
    res.locals.currentpath = req.path; //automatically set currentpath
    res.render("upload.ejs", {});

});
app.get("/profile", async (req, res) => {
    res.render('profile');
});







// // API data ophalen 
// const API = 'https://www.thecocktaildb.com/api/json/v2/961249867/'

// async function fetchData(url) {
//     const response = await fetch(url);
//     const data = await response.json();
    
//     return(data);
// }

//deze line gebruiken om de data op te vragen
//fetchData(API + 'rest van link');


// popular coctails laten zien op pagina
async function popularCocktails(req, res) {
  const data = await fetchData(API + 'popular.php');
  const cocktails = data.drinks;
  for(let i = 0; i < cocktails.length; i++) {
    let cocktail = cocktails[i]
    res.render('cocktail_list', {cocktails, cocktail});
  }
}


// 🔹 MULTER FILE UPLOAD
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});



const upload = multer({ storage: storage });

app.post('/upload-cocktail', upload.single('image'), async (req, res) => {
    try {
        const { name, ingredients, measurements, category, alcohol } = req.body;
        const image = req.file ? req.file.filename : null;

        const newCocktail = new userCocktail({
            name,
            ingredients: ingredients.split(','),
            measurements,
            category,
            alcohol: alcohol === 'true',
            image
        });

        await newCocktail.save();
        res.status(201).json({ message: 'Cocktail uploaded successfully!', cocktail: newCocktail });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading cocktail' });
    }
});

app.get('/usercocktails', async (req, res) => {
    try {
        const cocktails = await userCocktail.find();
        res.render('user_cocktails', { cocktails });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cocktails' });
    }
});

app.get('/cocktail/:cocktailName', async (req, res) => {
    try {
        const cocktailName = req.params.cocktailName; 
        const data = await fetchData(API + 'search.php?s=' + cocktailName); 
        const cocktail = data.drinks ? data.drinks[0] : null;

        if (!cocktail) {
            return res.status(404).send('Cocktail not found');
        }

        res.render('instructies.ejs', {
            cocktail: cocktail
        });
    } catch (error) {
        console.error("Error fetching cocktail details:", error);
        res.status(500).send("Error fetching cocktail details.");
    }
});


// 🔹 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));
