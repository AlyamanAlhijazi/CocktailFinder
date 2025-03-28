console.log("Script.js is geladen!");

// REGISTRATIE
document.addEventListener("DOMContentLoaded", function() {
  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    registrationForm.addEventListener("submit", async function(event) {
      event.preventDefault();

      const username = document.getElementById("username").value;
      const birthdate = document.getElementById("birthdate").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        document.getElementById("message").innerText = "Passwords do not match";
        return;
      }

      const userData = { username, birthdate, email, password };

      try {
        const response = await fetch("/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (response.redirected) {
          window.location.href = response.url;
        } else {
          const data = await response.json();
          document.getElementById("message").innerText = data.message || "Something went wrong.";
        }
      } catch (error) {
        document.getElementById("message").innerText = `Something went wrong: ${error}`;
      }
    });
  }

  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      console.log("Ingevoerde email:", email);
      console.log("Ingevoerde wachtwoord:", password);

      const loginData = { email, password };

      try {
        const response = await fetch("/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });

        console.log(loginData);

        if (response.redirected) {
          window.location.href = response.url;
        } else {
          const data = await response.json();
          document.getElementById("message").innerText = data.message || "Something went wrong";
        }
      } catch (error) {
        document.getElementById("message").innerText = `Something went wrong: ${error}`;
      }
    });
  }

  // LOGOUT
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      console.log("Logout button clicked!");
      const confirmLogout = confirm("Are you sure you want to log out?");

      if (confirmLogout) {
        try {
          const response = await fetch("/logout", { method: "POST" });
          if (response.redirected) {
            window.location.href = response.url;
          } else {
            console.error("Failed to log out");
          }
        } catch (error) {
          console.error("Something went wrong while logging out", error);
        }
      }
    });
  }
});


// UPLOAD
function addIngredient() {
  const ingredientsDiv = document.getElementById("ingredients");
  const newRow = document.createElement("div");
  newRow.className = "ingredient-row";
  newRow.innerHTML = `
        <input type="text" name="ingredientName[]" placeholder="Ingredient name" required>
        <div class="measurements">
          <input type="number" name="ingredientAmount[]" placeholder="Amount" required step="0.01">
          <select name="ingredientUnit[]" required>
              <option value="ml">ml</option>
              <option value="cl">cl</option>
              <option value="oz">oz</option>
          </select>
        </div>
        <div class="alcholicincl">
          <input type="checkbox" name="isAlcoholic[]"> Alcoholic
          <input type="number" name="alcoholPercentage[]" placeholder="%" min="0" max="100" step="0.1">
          <button type="button" class="btnIngredient">X</button>
        </div>
    `;
  newRow.querySelector(".btnIngredient").addEventListener("click", removeIngredient);

  ingredientsDiv.appendChild(newRow);
}
function removeIngredient(event) {
  const ingredientRow = event.target.closest(".ingredient-row"); 
  if (ingredientRow) {
    ingredientRow.remove();
  }
}

function removeIngredient() {
  const ingredientsDiv = document.getElementById("ingredients");
  const ingredientRows = ingredientsDiv.getElementsByClassName("ingredient-row");

  if (ingredientRows.length > 1) {
    ingredientsDiv.removeChild(ingredientRows[ingredientRows.length - 1]);
  } else {
    alert("You must have at least one ingredient.");
  }
}

// Image displaying
document.addEventListener("DOMContentLoaded", function() {
  console.log(document.getElementById("image"))
  const image = document.getElementById("image")
  if(image) {
    image.addEventListener("change", function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById("imagePreview");
          const uploadBox = document.getElementById("uploadBox");
  
          preview.src = e.target.result;
          preview.style.display = "block"; 
          uploadBox.style.display = "none"; 
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
});


//FILTER
//ingredienten
const addIngredients = document.getElementById("addIngredient");
const filtersForm = document.getElementById("filtersForm");


function add(){
  let newDiv = document.createElement('div');
  newDiv.setAttribute('class', 'kruisjenaasttext');
  filtersForm.appendChild(newDiv);
  let newField = document.createElement('input');
  newField.setAttribute('list',"x");
  newField.setAttribute("placeholder", "ingredient")
  newField.setAttribute('class','fieldIngredient'); //class om styling makelijker te maken :)
  newDiv.appendChild(newField);
  let newButton = document.createElement('button');
  newButton.setAttribute('type', 'button');
  newButton.setAttribute('class','btnIngredient'); //class om styling makelijker te maken :)
  newButton.innerHTML = "x"; 
  newDiv.appendChild(newButton);
  newButton.addEventListener('click', () => {
      newDiv.removeChild(newButton);
      newDiv.removeChild(newField);
      filtersForm.removeChild(newDiv);
  })
}

if(addIngredients) {
  addIngredients.addEventListener('click', add);
}

if (filtersForm) {
    console.log(filtersForm)
    filtersForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const ingredients = document.getElementsByClassName("fieldIngredient");
        const alcoholic = document.getElementById("alcoholic").value;
        const glass = document.getElementById("inputGlasses").value;
        const category = document.getElementById("category").value;
        let ingredientList = [];

        for(let i = 0; i < ingredients.length; i++) {
            ingredientList.push(ingredients[i].value.toLowerCase());
        }

        console.log(ingredientList, alcoholic, glass, category);

        try {
            const response = await fetch("/filter-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ingredients: ingredientList,
                    alcoholic,
                    glass,
                    category
                })
            });

            if (response.redirected) {
                window.location.href = response.url;
            } else {
                const data = await response.json();
                document.getElementById("message").innerText = data.message || "Something went wrong";
            }
        } catch (error) {
            document.getElementById("message").innerText = `Something went wrong: ${error}`;
        }
    });
}

// instructie toggle
const tabs = document.querySelectorAll('[data-tab-target]');
const tabContents = document.querySelectorAll('[data-tab-content]');
 
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
 
        tabContents.forEach(content => content.classList.remove('active'));
 
    
        tabs.forEach(t => t.classList.remove('active'));
 
        
        const target = document.querySelector(tab.dataset.tabTarget);
 
        
        if (target) {
            target.classList.add('active');
            tab.classList.add('active');   
        }
    });
});
