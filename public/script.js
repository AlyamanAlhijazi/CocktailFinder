console.log("Script.js is geladen!");
// // // // // REGISTRATIE // // // //
document.getElementById("registrationForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Voorkomt dat het formulier op de traditionele manier wordt ingediend

    // Verzamel de gegevens van het formulier
    const username = document.getElementById("username").value;
    const birthdate = document.getElementById("birthdate").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Controleer of de wachtwoorden overeenkomen
    if (password !== confirmPassword) {
        document.getElementById("message").innerText = "Wachtwoorden komen niet overeen!";
        return;
    }

    // Maak een object voor de gegevens
    const userData = {
        username,
        birthdate,
        email,
        password
    };

    try {
        // Verstuur de gegevens naar de server
        const response = await fetch("http://localhost:3000/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("message").innerText = "Registratie succesvol!";
            window.location.href = data.redirect;
        } else {
            document.getElementById("message").innerText = `Fout: ${data.message}`;
        }
    } catch (error) {
        document.getElementById("message").innerText = `Something went wrong: ${error}`;
    }
});


// // // // // LOGIN // // // //
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Voorkomt dat het formulier op de traditionele manier wordt ingediend
// Verzamel de gegevens van het formulier
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

console.log("Ingevoerde email:", email); // Debug log
console.log("Ingevoerde wachtwoord:", password); // Debug log

// Maak een object voor de gegevens
const loginData = {
    email,
    password
};

try {
    // Verstuur de gegevens naar de server
    const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    });

    const data = await response.json();
    console.log(loginData);
    
    if (response.ok) {
        // Als de login succesvol is,  de gebruiker doorverwijzen naar de homepagina
        document.getElementById("message").innerText = "You are logged in";
        window.location.href = data.redirect; 
    } else {
        // Als er een fout is, geef een bericht weer
        document.getElementById("message").innerText = `Error: ${data.message}`;
    }
} catch (error) {
    document.getElementById("message").innerText = `Something went wrong: ${error}`;
}
});

// // // // // LOGOUT // // // //
document.getElementById("logoutButton")?.addEventListener("click", async ()=>{
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (confirmLogout) {
        try{
            const response = await fetch("/users/logout", {method: "POST"});

            if (response.ok) {
                const result = await response.json();
                window.location.href = result.redirect;
            } else {
                console.error("faild to log out")
            }
        } catch (error) {
            console.error("something went wrong at logging out", error);
        }
    }
});

// {/* <script defer src="/script.js"></script> */}
