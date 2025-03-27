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
import { type } from "os";

// Laad enviroment variabelen
dotenv.config();

// express initaliseren
const app = express();

// App settings configureren
app.set("view engine", "ejs");
app.set("views", "views");

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
}),
);
// flash messages instellen
app.use(flash());
// middleware om de ingelogde gebruiker op te halen
app.use(async (req, res, next) => {
    if (req.session.userId) {
        req.user = await User.findById(req.session.userId);
    }
    next();
});

// 📌 DATABASE CONNECTIE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database verbonden"))
  .catch(err => console.log("❌ Database fout:", err));


// 📌 USER MODEL
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  birthdate: Date,
});
const User = mongoose.model("User", userSchema);

// 📌 REVIEW MODEL
const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5, 
  },
  comment: { 
    type: String, 
    maxlength: 500, 
  },
}, { timestamps: true });

// 📌 COCKTAIL MODEL
const cocktailSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100,
    },
    ingredients: [{ 
      name: {
        type: String,
        required: true,
        trim: true,
      },
      amount: {
        type: Number, 
        required: true,
        trim: true,
      },
      unit: {
        type: String,
        required: true,
        enum: ["ml", "cl", "oz"],
      },
      isAlcoholic: {
        type: Boolean,
        default: false,
      },
      alcoholPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    }],
    alcoholPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    strength: {
      type: String,
      enum: ["Light", "Medium", "Strong"],
      default: "Medium",
    },
    instructions: { 
      type: String, 
      required: true, 
      trim: true, 
    },
    category: { 
      type: String,
      required: true,
      enum: ["Alcoholic", "Non-alcoholic", "Optional alcohol"],
    },
    glassType: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  }, { 
    collection: "usercocktails", 
    timestamps: true 
  });
  

//CL OMZETTEN NAAR ML
function convertToMl(amount, unit){
  switch(unit){
  case "cl": return amount * 10;
  case "oz": return amount * 29.5735;
  default: return amount;
  }
}

// ALCOHOL PERCENTAGE BEREKENEN
cocktailSchema.pre("save", function(next) {
  let totalVolume = 0;
  let totalAlcohol = 0;

  this.ingredients.forEach(ing => {
    const volumeInMl = convertToMl(ing.amount, ing.unit);
    totalVolume += volumeInMl;
        
    if (ing.isAlcoholic) {
      totalAlcohol += (volumeInMl * ing.alcoholPercentage) / 100;
    }
  });

  this.alcoholPercentage = (totalAlcohol / totalVolume) * 100;

  if (this.alcoholPercentage < 10) {
    this.strength = "Light";
  } else if (this.alcoholPercentage >= 20) {
    this.strength = "Strong";
  } else {
    this.strength = "Medium";
  }

  next();
});

const Cocktail = mongoose.model("Cocktail", cocktailSchema);
export default Cocktail;


const userCocktail = mongoose.model("userCocktail", cocktailSchema);

// 🔹 REGISTRATIE (GET)
app.get("/register", async (req, res) => {
  res.render("register");
});

// 🔹 REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
  const { username, email, password, birthdate } = req.body;
  if (!username || !email || !password || !birthdate) {
    req.flash("error", "All fields are required!");
    return res.redirect("/register");
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "try a different email address");
      return res.redirect("/register");
    }

    const formattedBirthdate = new Date(birthdate);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword, birthdate: formattedBirthdate });
    await user.save();

    // Sessies instellen na registratie (direct inloggen)
    req.session.userId = user._id;  // Zet de gebruikers-ID in de sessie
    req.flash("success", "Account has been succesfully registerd!");
    res.redirect("/login");
  } catch (err) {
    res.redirect("register");
  }
});


// 🔹 LOGIN (GET)
app.get("/login", async (req, res) => {
  res.render("login");
});


// 🔹 LOGIN (POST)
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Inlogpoging voor email:", email); // Controleer de ingevoerde email

  const user = await User.findOne({ email });
  console.log("Gevonden gebruiker:", user); // Controleer of een gebruiker wordt gevonden

  if (!user) {
    req.flash("error","User not found");
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Wachtwoord correct:", isMatch); // Controleer of het wachtwoord klopt

  if (!isMatch) {
    req.flash("error", "try a different email or password");
    return res.redirect("/login");
  }

  // Sessies instellen bij succesvolle login
  req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
  req.session.username = user.username; // Sla de gebruikersnaam op in de sessie
    
  req.flash("success", "You are logged in");
  res.redirect("/profile");
  console.log("Sessie na login:", req.session);
});


// Check of de gebruiker ingelogd is
app.get("/check-session", (req, res) => {

  console.log("Huidige sessie bij check:", req.session);

  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 🔹 LOGOUT (GET)
app.get("/logout", async (req, res) => {
  res.render("logout");
});

// 🔹 LOGOUT (POST)
app.post("/logout", (req, res) => {
  if (req.session) {
    // Flash berichten instellen voordat de sessie wordt vernietigd
    req.flash("success", "You have been successfully logged out.");

    req.session.destroy((err) => {
      if (err) {
        console.error("A failed logout:", err);
        req.flash("error", "Something went wrong while logging out. Try again.");
        return res.redirect("/profile");
      }

      res.clearCookie("connect.sid"); // Verwijder de sessie cookie
      res.redirect("/home"); // Redirect naar register pagina
    });
  } else {
    // Als er geen actieve sessie is, redirect naar register pagina
    res.redirect("/home");
  }
});

// 🔹 REVIEW (POST)
app.post("/cocktail/:cocktailId/review", async (req, res) => {
    const { cocktailId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId; // Haal de userId uit de sessie
  
    try {
      // Zoek de cocktail
      const cocktail = await userCocktail.findById(cocktailId);
  
      if (!cocktail) {
        return res.status(404).send("Cocktail niet gevonden");
      }
  
      // Maak een nieuwe review
      const newReview = {
        user: userId,
        rating: parseInt(rating),
        comment: comment,
      };
  
      // Voeg de review toe aan de cocktail
      cocktail.reviews.push(newReview);
  
      // Update de gemiddelde rating
      let totalRating = 0;
      cocktail.reviews.forEach((review) => {
        totalRating += review.rating;
      });
      cocktail.averageRating = totalRating / cocktail.reviews.length;
  
      // Sla de cocktail op
      await cocktail.save();
  
      res.redirect(`/cocktail/${cocktail.name}`); // Redirect naar de cocktailpagina
    } catch (error) {
      console.error("Fout bij het opslaan van de review:", error);
      res.status(500).send("Er is een fout opgetreden bij het opslaan van de review.");
    }
  });


// Middleware om API-cocktails op te slaan in de database
const saveApiCocktailToDB = async (req, res, next) => {
    const { cocktailName } = req.params;
  
    try {
      // Zoek eerst of de cocktail al in de database staat
      let dbCocktail = await userCocktail.findOne({
        name: { $regex: new RegExp("^" + cocktailName + "$", "i") }
      });
  
      if (!dbCocktail) {
        // Als de cocktail niet in de database staat, haal deze op uit de API
        const data = await fetchData(API + 'search.php?s=' + cocktailName);
        const apiCocktail = data.drinks ? data.drinks[0] : null;
  
        if (apiCocktail) {
          // Converteer de API-cocktail naar een database-cocktail
          dbCocktail = new userCocktail({
            name: apiCocktail.strDrink,
            // ingredients: convertApiIngredients(apiCocktail), // Maak een functie om de ingrediënten te converteren
            instructions: apiCocktail.strInstructions,
            category: apiCocktail.strCategory,
            glassType: apiCocktail.strGlass,
            image: apiCocktail.strDrinkThumb,
            createdBy: req.session.userId, // Gebruik de huidige gebruiker
            reviews: [], // Maak een lege review array
          });
  
          // Sla de cocktail op in de database
          await dbCocktail.save();
        }
      }
      next();
    } catch (error) {
      console.error("Fout bij opslaan API cocktail in database:", error);
      res.status(500).send("Er is een fout opgetreden bij het laden van de cocktail.");
    }
  };
  

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
      $or: [{ name: new RegExp(query, "i") }, { ingredients: new RegExp(query, "i") }],
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
        const cocktails = data.drinks || [];

        const allUserCocktails = await userCocktail.find();

        const randomUserCocktails = allUserCocktails.sort(() => 0.5 - Math.random()).slice(0, 10);

        res.render('home.ejs', { cocktails, userCocktails: randomUserCocktails });
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
  res.render("profile");
});






const API = "https://www.thecocktaildb.com/api/json/v2/961249867/";

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
    
  return(data);
}


// popular coctails laten zien op pagina
async function popularCocktails(req, res) {
  const data = await fetchData(API + "popular.php");
  const cocktails = data.drinks;
  for(let i = 0; i < cocktails.length; i++) {
    const cocktail = cocktails[i];
    res.render("cocktail_list", { cocktails, cocktail });
  }
}


// 🔹 MULTER FILE UPLOAD
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single("image"), (req, res) => {
    const { name, ingredientName, ingredientAmount, ingredientUnit, isAlcoholic, alcoholPercentage, instructions, category, glassType } = req.body;
  
    const ingredients = ingredientName.map((name, index) => ({
      name: name,
      amount: parseFloat(ingredientAmount[index]),
      unit: ingredientUnit[index],
      isAlcoholic: isAlcoholic[index] === "on",
      alcoholPercentage: isAlcoholic[index] === "on" ? (parseFloat(alcoholPercentage[index]) || 0) : 0,
    }));
  
    const createdBy = req.session.userId;
  
    const newCocktail = new userCocktail({
      name,
      ingredients,
      instructions,
      category,
      glassType,
      image: req.file.filename,
      createdBy: createdBy // Zorg ervoor dat je de gebruiker-ID hebt
    });
  
    if (!req.user) {
      return res.status(401).send('Gebruiker niet ingelogd');
    }
  
    newCocktail.save()
      .then(() => res.redirect("/profile"))
      .catch(err => {
          console.error("Error saving cocktail:", err);
          res.status(400).send("Error saving cocktail");
      });
  });
  


app.get("/usercocktails", async (req, res) => {
  try {
    const cocktails = await userCocktail.find();
    res.render("user_cocktails", { cocktails });
  } catch (error) {
    res.status(500).json({ error: "Error fetching cocktails" });
  }
});


// app.get('/cocktail/:cocktailName', async (req, res) => {
//     try {
//         const cocktailName = req.params.cocktailName; 

//         const dbCocktail = await Cocktail.findOne({ 
//             name: { $regex: new RegExp("^" + cocktailName + "$", "i") } 
//         }).populate("reviews.user");

//         if (dbCocktail) {
//             return res.render('instructies.ejs', { cocktail: dbCocktail, source: 'database', reviews: dbCocktail.reviews });
//         }

//         const data = await fetchData(API + 'search.php?s=' + cocktailName); 
//         const apiCocktail = data.drinks ? data.drinks[0] : null;

//         if (!apiCocktail) {
//             return res.status(404).send('Cocktail not found');
//         }

//         res.render('instructies.ejs', { cocktail: apiCocktail, source: 'api', reviews: [] });

//     } catch (error) {
//         console.error("❌ Fout bij ophalen cocktail:", error);
//         res.status(500).send("Er is een probleem met het laden van de cocktail.");
//     }
// });

app.get('/cocktail/:cocktailName', saveApiCocktailToDB, async (req, res) => {
    try {
      const cocktailName = req.params.cocktailName;
  
      // Zoek de cocktail in de database
      const dbCocktail = await userCocktail.findOne({
        name: { $regex: new RegExp("^" + cocktailName + "$", "i") }
      }).populate('reviews.user');
  
      if (dbCocktail) {
        return res.render('instructies.ejs', { cocktail: dbCocktail, source: 'database' });
      }
  
      // Als niet gevonden, stuur een foutmelding (zou niet meer moeten gebeuren)
      return res.status(404).send('Cocktail not found');
  
    } catch (error) {
      console.error("❌ Fout bij ophalen cocktail:", error);
      res.status(500).send("Er is een probleem met het laden van de cocktail.");
    }
  });
  
// Random cocktail
app.get("/random", async (req, res) => {
    try {
        let cocktail;
        let source;
        if (Math.random() < 0.1) {
            const cocktails = await userCocktail.find();
            if (cocktails.length > 0) {
                cocktail = cocktails[Math.floor(Math.random() * cocktails.length)];
                source = "database";
            }
        }
        if (!cocktail) {
            const response = await fetch("https://www.thecocktaildb.com/api/json/v2/961249867/random.php");
            const data = await response.json();
            cocktail = data.drinks[0];
            source = "api";
        }

        res.render("instructies", { cocktail, source });

    } catch (err) {
        console.error("❌ Error in /random route:", err);
        res.status(500).send("Er is iets misgegaan");
    }
});








// 🔹 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op http://localhost:${PORT}`));
