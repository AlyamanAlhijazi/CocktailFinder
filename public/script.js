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
        document.getElementById("message").innerText = `Er is een fout opgetreden: ${error}`;
    }
});
