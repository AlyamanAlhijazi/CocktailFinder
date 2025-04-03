# CocktailFinder

## functies die in de app zitten

### registreren/inloggen/uitloggen
er kan een account aangemaakt worden door de gebruiker. (gebruiker wordt opgeslagen in mongo db)
in de website kan gebruiker inloggen en uitloggen (voor sommige functies if het nodig om ingelogd zijn anders werken ze niet)
data zoals reviews, favorieten, eigen cocktails worden opgeslagen bij de gebruiker in db als er ingelogd is
### gebruikers gegevens aanpassen
gebruiker heeft een profiel pagina en kan hier in instellingen hun gegevens aanpassen.
de aangepaste gegevens worden in de db opgeslagen
### cocktails uploaden
gebruiker kan hun eigen cocktail recept uploaden.
de cocktail wordt in de db opgeslagen als user cocktail
cocktail is terug te vinden op profiel pagina, home pagina, user cocktails pagina.

(inicht voor toekomstige iteraties: het is handig als de gebruiker kan hun eigen cocktail recepten aanpassen of verwijderen voor al zitten er fouten in etc.)
### reviews achterlaten
gebruiker kan reviews achterlaten op zowel user cocktails als API cocktails.
API cocktail wordt in de database opgeslagen onder APIcocktail wanneer er een review op gedaan wordt.
de reviews worden in een array opgeslagen in de database bij de cocktail waar de review bij hoort.
reviews bestaan uit een text input en een score uit 5 en de review kan alleen opgeslagen worden als beide ingevult zijn
de gemiddelde rating wordt berekend en ook opgeslagen.

(inicht voor toekomstige iteraties: in een volgende itteratie zou een belangrijk puntje moderatie zijn voor de reviews om mogelijke ongepaste reviews te verwijderen)
### cocktails opslaan
de gebruiker kan cocktail recepten opslaan in hun favorieten.
op de detail pagina van elke cocktail staat een knop om de cocktail in of uit de favorieten op te slaan
in de database wordt deze cocktail dan in of uit de lijst van favorieten gehaald bij de user die is ingelogd

we hebben een goed begin gemaakt om deze functie ook werkend te maken voor de API cocktails maar dit is eindstand nog niet gelukt.
(inicht voor toekomstige iteraties: fix dat het ook werkt voor de API cocktails en dat die cocktails ook in de db worden opgeslagen)
### filteren/ sorteren 
de gebruiker kan op de home pagina alle cocktails filteren en soorteren
het soorteren kan van a tot z of van z tot a 
het filtern kan gebaseert op  - alcoholic , not alcoholic, optional alcohol
                              - glas type
                              - catgorie
                              - ingredient(en)
de filters worden toegepast op alle cocktails die in de API staan en je kan meerdere filters tegelijk toepassen

(inicht voor toekomstige iteraties: filters die worden opgeslagen in de sessie en die dus ook zichtbaar blijven wanneer ze van toepassing zijn
                                    ook zouden we meer opties toe willen voegen voor het soorteren bv. best rated, strongest
                                    en meer filters bv. user cocktails)
### zoekken 
op de homepagina is een zoekbalk waarmee je cocktails kan zoeken op naam of op ingredient

### cocktails aanraden gebaseerd op favorieten
wanneer de gebruiker cocktails in hun favorieten heeft staan dan wordt hun op de home pagina cocktails aangeraden gebaseert op de ingredienten die in de cocktails in hun favorieten staan.
je wordt user cocktails en API cocktails aangeraden.

### suprise me (random cocktail)
er is een knop op de homepage waar als je er op drukt je een compleet random cocktail uit de API krijgt.



