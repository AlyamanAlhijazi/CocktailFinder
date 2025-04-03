// Packages importeren
import express, { response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import flash from "express-flash";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { type } from "os";
import sharp from "sharp";

// Laad enviroment variabelen0
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
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Kies een geheime sleutel
    resave: false, // Niet elke keer opnieuw opslaan
    saveUninitialized: true, // Sla onbewerkte sessies op
    cookie: { secure: false, httpOnly: true }, // Dit moet `true` zijn als je HTTPS gebruikt
  })
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

app.use((req, res, next) => {
  res.locals.query = req.query; // Maakt req.query beschikbaar in alle EJS-bestanden
  next();
});

// DATABASE CONNECTIE
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Database error:", err));

// USER MODEL
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  favorites: [
    { type: mongoose.Schema.Types.ObjectId, ref: "userCocktail", default: [] },
  ]
});
const User = mongoose.model("User", userSchema);

// REVIEW MODEL
const reviewSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

// COCKTAIL MODEL
const cocktailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ingredients: [
      {
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
      },
    ],
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
  },
  {
    collection: "usercocktails",
    timestamps: true,
  }
);

// COCKTAIL MODEL
const APIcocktailSchema = new mongoose.Schema(
  {
    _id: Number,

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ingredients: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    instructions: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    alcohol: {
      type: String,
      required: true,
      enum: ["Alcoholic", "Non alcoholic", "Optional alcohol"],
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
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    collection: "apiCocktails",
    timestamps: true,
  }
);

const userCocktail = mongoose.model("userCocktail", cocktailSchema);
export default userCocktail;
const Cocktail = mongoose.model("Cocktail", cocktailSchema);
const APIcocktail = mongoose.model("APIcocktail", APIcocktailSchema);

// export default Cocktail;

//CL OMZETTEN NAAR ML
function convertToMl(amount, unit) {
  switch (unit) {
    case "cl":
      return amount * 10;
    case "oz":
      return amount * 29.5735;
    default:
      return amount;
  }
}

// ALCOHOL PERCENTAGE BEREKENEN
cocktailSchema.pre("save", function (next) {
  let totalVolume = 0;
  let totalAlcohol = 0;

  this.ingredients.forEach((ing) => {
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

// REGISTRATIE (GET)
app.get("/register", async (req, res) => {
  res.render("register");
});

// REGISTRATIE (POST)
app.post("/users/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    req.flash("error", "All fields are required!");
    return res.redirect("register");
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "try a different email address");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Sessies instellen na registratie (direct inloggen)
    req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
    req.flash("success", "Account has been succesfully registerd!");
    res.redirect("/login");
  } catch (err) {
    return res.redirect("/register");
  }
});

// LOGIN (GET)
app.get("/login", async (req, res) => {
  res.render("login");
});

// LOGIN (POST)
app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "try a different email or password");
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("error", "try a different email or password");
    return res.redirect("/login");
  }

  // Sessies instellen bij succesvolle login
  req.session.userId = user._id; // Zet de gebruikers-ID in de sessie
  req.session.username = user.username; // Sla de gebruikersnaam op in de sessie

  req.flash("success", "You are logged in");
  return res.redirect("/profile");
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

// LOGOUT (POST)
app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout failed:", err);
      }
      res.clearCookie("connect.sid"); // Verwijder de sessiecookie
      res.redirect("/home"); // Redirect naar homepagina
    });
  } else {
    res.redirect("/home");
  }
});

// Check of gebruiker is ingelogd
// bericht geven als argument

function isAuthenticated(message) {
  return (req, res, next) => {
    if (!req.session.userId) {
      req.flash("error", message);
      return res.redirect("/login");
    }
    next();
  };
}

// Functie om reviews toe te voegen
async function review({ cocktailId }, { rating, comment }, userId, res) {
  try {
    let cocktail = "";
    // Zoek de cocktail
    if (cocktailId.length < 10) {
      cocktail = await APIcocktail.findById(cocktailId);
    }

    // console.log(cocktail);
    if (cocktailId.length > 10) {
      cocktail = await userCocktail.findById(cocktailId);
    }

    if (!cocktail) {
      return res.status(404).send("Cocktail was not found");
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
    res.redirect(`/cocktail/${cocktail.name}`); // Redirect naar de cocktailpagina)
  } catch (error) {
    res.status(500).send("Something went wrong retrieving the cocktaail page.");
  }
}

// REVIEW (POST)
app.post(
  "/cocktail/:cocktailId/review",
  isAuthenticated("You must be signed in to leave reviews"),
  async (req, res) => {
    const { cocktailId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId; // Haal de userId uit de sessie\
    if (rating && comment) {
      await review({ cocktailId }, { rating, comment }, userId, res);
    }
  }
);

app.post(
  "/cocktail/:cocktailId/APIreview",
  isAuthenticated("You must be logged in to leave reviews"),
  async (req, res) => {
    const { cocktailId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;
    await saveApiCocktailToDB(req, res, cocktailId);
    if (rating && comment) {
      await review({ cocktailId }, { rating, comment }, userId, res);
    }
  }
);

// FAVORITES (POST)
app.post("/cocktail/:cocktailName/favorite", async (req, res) => {
  if (!req.session.userId) {
    req.flash("error", "Sign in to add cocktails to your favorites");
    return res.redirect("/login");
  }

  const { cocktailName } = req.params;
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User was not found");
      return res.redirect(`/cocktail/${cocktailName}`);
    }

    const cocktail = await Cocktail.findOne({
      name: { $regex: new RegExp("^" + cocktailName + "$", "i") },
    });
    if (!cocktail) {
      req.flash("error", "Cocktail was not found!");
      return res.redirect(`/cocktail/${cocktailName}`);
    }

    const isFavorite = user.favorites.some((favorite) =>
      favorite.equals(cocktail._id)
    );

    if (isFavorite) {
      user.favorites.pull(cocktail._id);
      req.flash("success", "Cocktail removed from favorites!");
    } else {
      user.favorites.push(cocktail._id);
      req.flash("success", "Cocktail added to favorites!");
    }

    await user.save();
    return res.redirect(`/cocktail/${cocktailName}`); // Redirect terug naar de cocktail pagina
  } catch (error) {
    req.flash("error", "Something went wrong, try again later");
    return res.redirect(`/cocktail/${cocktailName}`);
  }
});

// RECOMMENDATIONS (HELPER FUNCTION)
async function getRecommendations(userId, favorites) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error("Invalid userId:", userId);
    return [];
  }

  // Ingredienten verzamelen (lowercase)
  const favoriteIngredients = [
    ...new Set(
      favorites.flatMap((cocktail) =>
        cocktail.ingredients.map((ing) => ing.name.toLowerCase())
      )
    ),
  ];

  const [userCocktails, apiCocktails] = await Promise.all([
    Cocktail.aggregate([
      {
        $match: {
          "ingredients.name": { $in: favoriteIngredients },
          _id: { $nin: favorites.map((fav) => fav._id) },
        },
      },
      {
        $addFields: {
          matchCount: {
            $size: {
              $setIntersection: ["$ingredients.name", favoriteIngredients],
            },
          },
        },
      },
      { $sort: { matchCount: -1 } },
      { $limit: 10 },
    ]),
    APIcocktail.aggregate([
      {
        $match: {
          "ingredients.name": {
            $in: favoriteIngredients.map((ing) => new RegExp(ing, "i")),
          },
          _id: { $nin: favorites.map((fav) => fav._id.toString()) },
        },
      },
      {
        $addFields: {
          matchCount: {
            $size: {
              $setIntersection: [
                {
                  $map: {
                    input: "$ingredients.name",
                    as: "ing",
                    in: { $toLower: "$$ing" },
                  },
                },
                favoriteIngredients,
              ],
            },
          },
        },
      },
      { $sort: { matchCount: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return [...userCocktails, ...apiCocktails]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 10);
}

//  Inloggegevens aanpassen
app.post("/profile", async (req, res, next) => {
  try {
    console.log("Profile route aangeroepen");
    const userId = req.session.userId;
    const { username, email } = req.body;
  
    if (!userId) {
      return res.status(401).json({ error: "Geen gebruiker ingelogd" });
    }
    const updateData = { username, email };
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true } 
    );

    // console.log("updatedUser", updatedUser)
    if (!updatedUser) {
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }
    res.redirect("/profile"); 
  }
  catch (error) {
    console.error("Fout bij het updaten van profiel:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// 🔹 PROFILE (GET)
app.get("/profile", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  try {
    res.locals.currentpath = req.path;
    const user = await User.findById(req.session.userId).populate("favorites");
    const userCocktails = await Cocktail.find({
      createdBy: req.session.userId,
    });

    res.render("profile", {
      user: user,
      favoriteCocktails: user.favorites,
      userCocktails: userCocktails, // Pass the created cocktails to the template
    });
  } catch (error) {
    res.status(500).send("Something went wrong retrieving the profile page.");
  }
});

async function saveApiCocktailToDB(req, res, cocktailId) {
    try {
      // Zoek eerst of de cocktail al in de database staat
      let dbCocktail = await APIcocktail.findOne({
        _id: cocktailId
      });
      
      if (!dbCocktail) {
        // Als de cocktail niet in de database staat, haal deze op uit de API
        const data = await fetchData(API + "lookup.php?i=" + cocktailId);
        const Cocktail = data.drinks ? data.drinks[0] : null;
        let ingredients = [];

        for (let i = 1; i <= 15; i++) { 
          if(Cocktail["strIngredient" + i]) {
            const ingredient = Cocktail["strIngredient" + i];
            let amount =  Cocktail["strMeasure" + i];
            if(!amount) {
              amount = "To taste"
            }
            const object = {
              name: ingredient,
              amount: amount
            }
            ingredients.push(object)
          }
        }

    if (!dbCocktail) {
      // Als de cocktail niet in de database staat, haal deze op uit de API
      const data = await fetchData(API + "lookup.php?i=" + cocktailId);
      const Cocktail = data.drinks ? data.drinks[0] : null;
      let ingredients = [];

      for (let i = 1; i <= 15; i++) {
        if (Cocktail["strIngredient" + i]) {
          const ingredient = Cocktail["strIngredient" + i];
          let amount = Cocktail["strMeasure" + i];
          if (!amount) {
            amount = "To taste";
          }
          const object = {
            name: ingredient,
            amount: amount,
          };
          ingredients.push(object);
        }
      }

      if (Cocktail) {
        // Converteer de API-cocktail naar een database-cocktail
        const newCocktail = new APIcocktail({
          _id: cocktailId,
          name: Cocktail.strDrink,
          ingredients: ingredients,
          instructions: Cocktail.strInstructions,
          category: Cocktail.strCategory,
          alcohol: Cocktail.strAlcoholic,
          glassType: Cocktail.strGlass,
          image: Cocktail.strDrinkThumb,
          reviews: [], // Maak een lege review array
        });

        // // Sla de cocktail op in de database
        newCocktail.save();
      }
    }
  } catch (error) {
    res.status(500).send("Something went wrong retrieving cocktails.");
  }
}

// BEVEILIGDE ROUTE Favorieten
app.get("/cocktails/favorites", (req, res) => {
  if (!req.session.userId) {
    req.flash("error", "You must be signed in to access this page");
    return res.redirect("login");
  }
});

// ZOEK COCKTAILS (GET)
app.get("/cocktails/search", async (req, res) => {
  const { query } = req.query;
  try {
    const cocktails = await userCocktail.find({
      $or: [
        { name: new RegExp(query, "i") },
        { ingredients: new RegExp(query, "i") },
      ],
    });
    res.json(cocktails);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Something went wrong retrieving cocktails." });
  }
});



//  ZOEK COCKTAILS (post)  
app.post("/search", async (req, res) => {
  const query = req.body.q;

  try {
    const drinks = await filteren();
    const searchResultsByName = drinks.filter((drink) =>
      drink.strDrink.toLowerCase().includes(query.toLowerCase())
    );
    const searchResultsByIngredient = drinks.filter((drink) =>
      Object.keys(drink)
        .filter((key) => key.startsWith("strIngredient") && drink[key]) // Alleen niet-lege ingrediënten
        .some((ingredientKey) =>
          drink[ingredientKey].toLowerCase().includes(query.toLowerCase())
        )
        .filter(key => key.startsWith("strIngredient") && drink[key]) // Alleen niet-lege ingrediënten
        .some(ingredientKey => drink[ingredientKey].toLowerCase().includes(query.toLowerCase()))

    );

    res.render("home", {
      searchResultsByName,
      searchResultsByIngredient,
      query,
    });
  } catch (error) {
    res.status(500).send("Something went wrong retrieving cocktails.");
  }
});


// Helper voor sorteren drinks
function sortDrinks(drinks, sortOption) {
  if (sortOption === "sorta-z") {
    return [...drinks].sort((a, b) => a.strDrink.localeCompare(b.strDrink));
  }
  if (sortOption === "sortz-a") {
    return [...drinks].sort((a, b) => b.strDrink.localeCompare(a.strDrink));
  }
  return drinks;
}
// HOME PAGE & API FETCHING
app.get("/home", async (req, res) => {
  res.locals.currentpath = req.path;
  const userId = req.session.userId;

  try {
    // Parallelle data fetching
    const [popularData, categories, glasses, ingredients, drinks] =
      await Promise.all([
        fetchData(API + "popular.php"),
        fetch_list("c"),
        fetch_list("g"),
        fetch_list("i"),
        filteren(),
      ]);

    // Top-rated cocktails
    const [dbTopCocktails, apiTopCocktails] = await Promise.all([
      Cocktail.find().sort({ averageRating: -1 }).limit(5),
      APIcocktail.find().sort({ averageRating: -1 }).limit(5),
    ]);

    const combinedTopCocktails = [...dbTopCocktails, ...apiTopCocktails]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // Willekeurige user cocktails
    const allUserCocktails = await userCocktail.find();
    const randomUserCocktails = allUserCocktails
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    // Aanbevelingen
    let recommendedCocktails = [];
    if (userId) {
      const user = await User.findById(userId).populate("favorites");
      if (user?.favorites?.length > 0) {
        recommendedCocktails = await getRecommendations(
          userId, // ← Correcte parameterdoorgeven
          user.favorites
        );
      }
    }

    res.render("home", {
      cocktails: popularData.drinks || [],
      userCocktails: randomUserCocktails,
      topCocktails: combinedTopCocktails,
      categories,
      glasses,
      ingredients,
      drinks: sortDrinks(drinks, req.query.sort),
      recommendedCocktails,
      query: "",
      sortOption: req.query.sort || "",
    });
  } catch (error) {
 
    res.status(500).send("Error loading homepage");
  }
});

app.get(
  "/profile",
  isAuthenticated("Sign in to acces this page"),
  async (req, res) => {
    res.render("profile", { user: req.session.username });
  }
);

app.get(
  "/upload",
  isAuthenticated("Sign in to upload your own cocktail"),
  async (req, res) => {
    res.locals.currentpath = req.path;
    res.render("upload");
  }
);

const API = process.env.API_URL; //iedereen URL van api even in env zetten

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();

  return data;
}


// 🔹 MULTER FILE UPLOAD
app.use("/uploads", express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join(__dirname, "public/uploads", filename);

    if (req.body.oldImage) {
      const oldImagePath = path.join(__dirname, "public/uploads", req.body.oldImage);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.warn("Failed to delete old image:", err);
      }
    }
    // Afbeelding kleiner maken
    await sharp(req.file.buffer)
      .resize(500) 
      .webp({ quality: 75 }) 
      .toFile(outputPath);

    const { name, ingredientName, ingredientAmount, ingredientUnit, isAlcoholic, alcoholPercentage, instructions, category, glassType } = req.body;

    const ingredients = ingredientName.map((name, index) => ({
      name,
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
      image: filename, // Sla de nieuwe bestandsnaam op
      createdBy
    });

    if (!req.user) {
      return res.status(401).send("User is not signed in");
    }

    await newCocktail.save();
    res.redirect("/profile");

  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).send("Error processing image.");
  }
});
  

  if (!req.user) {
    return res.status(401).send("User is not signed in");
  }

  newCocktail
    .save()
    .then(() => res.redirect("/profile"))
    .catch((err) => {
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

app.get("/cocktail/:cocktailName", async (req, res) => {
  try {
    const cocktailName = req.params.cocktailName;
    const userId = req.session.userId;
    let isFavorited = false;
    let img = "db";

    let dbCocktail = await Cocktail.findOne({
      name: { $regex: new RegExp("^" + cocktailName + "$", "i") },
    }).populate("reviews.user");


    if (!dbCocktail) {
      img = "api";
      
      dbCocktail = await APIcocktail.findOne({
        name: { $regex: new RegExp("^" + cocktailName + "$", "i") },
      }).populate("reviews.user");
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId).populate("favorites"); // Ophalen en meegeven
      if (
        user &&
        dbCocktail &&
        user.favorites.some((fav) => fav.equals(dbCocktail._id))
      ) {

        isFavorited = true;
      }
    }

    if (dbCocktail) {
      return res.render("instructies.ejs", {
        cocktail: dbCocktail,
        source: "database",
        reviews: dbCocktail.reviews,
        isFavorited,
        img,
        user,
      });
    }

    const data = await fetchData(API + "search.php?s=" + cocktailName);
    const apiCocktail = data.drinks ? data.drinks[0] : null;

    if (!apiCocktail) {
      return res.status(404).send("Cocktail not found");
    }


    res.render("instructies.ejs", {
      cocktail: apiCocktail,
      source: "api",
      reviews: [],
      isFavorited: false, // API cocktails are not in the database, so can't be favorited
      user: null,
    });
  } catch (error) {
    console.error("Fout bij ophalen cocktail:", error);
    res.status(500).send("Er is een probleem met het laden van de cocktail.");
  }
});

// Random cocktail
app.get("/random", async (req, res) => {
  try {
    let cocktail;
    let source;
    let isFavorited = false;
    let img = "db";
    if (Math.random() < 0.1) {
      const cocktails = await userCocktail.find();
      if (cocktails.length > 0) {
        cocktail = cocktails[Math.floor(Math.random() * cocktails.length)];
        source = "database";
      }
    }
    if (!cocktail) {
      const response = await fetch(API + "random.php");
      const data = await response.json();
      cocktail = data.drinks[0];
      source = "api";
      img = "api";
    }

    const userId = req.session.userId;
    let user = null;
    if (userId && source === "database") {
      user = await User.findById(userId).populate("favorites");
      if (
        user &&
        cocktail &&
        user.favorites.some((fav) => fav.equals(cocktail._id))
      ) {
        isFavorited = true;
      }
    }
    res.render("instructies", {
      cocktail,
      source,
      isFavorited,
      img,
      user,
    });
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});

// OPHALEN EN FILTEREN APi
//variabelen om toegepaste filters in op te slaan
let ingredients = [];
let alcoholic = 0; // 0= no prefrance, 1= alcaholic, 2 = non_alcaholic
let category = "";
let glass = "";


// ophalen van ingestelde filters en opslaan in variabelen
app.post("/filter-list", (req, resp) => {
  alcoholic = parseInt(req.body.alcoholic);
  category = req.body.category;
  glass = req.body.glass;
  ingredients = req.body.ingredients;
  ingredients = ingredients.filter(function (e) {
    return e;
  });
  return resp.redirect("/home");
});

//filter op alcahol
function alcohol(object) {
  if (alcoholic == 1 && object.strAlcoholic == "Alcoholic") {
    return true;
  } else if (alcoholic == 2 && object.strAlcoholic == "Non alcoholic") {
    return true;
  } else if (alcoholic == 0) {
    return true;
  } else {
    return true;
  }
}
//filter op cetegorie
function categoryFilter(object) {
  if (category != "") {
    return object.strCategory == category;
  } else {
    return true;
  }
}
//filteren op glas
function glassFilter(object) {
  if (glass != "") {
    return object.strGlass == glass;
  } else {
    return true;
  }
}
//filteren op ingredienten
function filterIngredients(object) {
  // DIT MOET IK NOG EFFE FIXEN KOMT GOED :)
  const ingredientKeys = Object.keys(object).filter((element) =>
    element.includes("strIngredient")
  );

  const matchingFilters = [];
  ingredientKeys.forEach((element) => {
    const ingredientValue = object[element] ?? "";
    if (ingredients.includes(ingredientValue.toLowerCase())) {
      matchingFilters.push(ingredientValue);
    }
  });
  // TODO: MAKE IT SO THAT IT SUPPORTS ONLY ONE INGREDIENT MATCHES
  return matchingFilters.length === ingredients.length;
}

// ophalen van alle drankjes en in array zetten zodat ze niet meerdere keren opgehaald hoeven worden
let cocktail_list = [];
async function fetch_letter() {
  if (cocktail_list.length === 0) {
    let drink_list = [];
    const letters = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ];
    for (let i = 0; i < letters.length; i++) {
      let letter = letters[i];
      const data = await fetchData(API + "/search.php?f=" + letter);
      drink_list = drink_list.concat(data.drinks);
    }
    cocktail_list = drink_list.filter((drink) => drink);
  }

  return cocktailList;
}

//functie die je moet aanroepen al wil je filteren
async function filteren() {
  let detail_list = await fetch_letter();
  detail_list = detail_list.filter(categoryFilter);
  detail_list = detail_list.filter(alcohol);
  detail_list = detail_list.filter(glassFilter);
  detail_list = detail_list.filter(filter_ingredients);
  return detail_list;


//ophalen van lijst van opties voor filter
async function fetchList(type) {
  let list = [];
  try {
    const data = await fetchData(API + "list.php?" + type + "=list");
    list = data.drinks;
  } catch (e) {
    console.log(e);
  }
  return list;
}

// app.get("/filter", show_filter);
//filters laten zien
async function show_filter(req, res) {
  let categories = await fetch_list("c");
  let glasses = await fetch_list("g");
  let ingredients = await fetch_list("i");
  let cocktails = await filteren();
  res.render("home", { categories, glasses, ingredients, cocktails });
}


// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
