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
        <input type="number" name="ingredientAmount[]" placeholder="Amount" required step="0.01">
        <select name="ingredientUnit[]" required>
            <option value="ml">ml</option>
            <option value="cl">cl</option>
            <option value="oz">oz</option>
        </select>
        <input type="checkbox" name="isAlcoholic[]"> Alcoholic
        <input type="number" name="alcoholPercentage[]" placeholder="Alcohol %" min="0" max="100" step="0.1"> %
    `;
  ingredientsDiv.appendChild(newRow);
}