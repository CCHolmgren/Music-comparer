Inledning
=========
Min applikation är helt enkelt en tjänst för att jämföra artister med varandra. Vad jag vet så finns det inte något liknande, men det är svårt att veta eftersom det är en förhållandevis nichad produkt vilket innebär att det är svårt att hitta även om det skulle finnas.  
Bakgrunden vet jag inte om det riktigt finns någon, men nu när applikationen är skapad så kan jag se det som väldigt intressant att gissa hur artister kommer jämföras med varandra. Det är ganska roligt att testa olika kombinationer, att försöka få ut så höga resultat man kan eller liknande.

Schematisk bild
=========
![Schema](/application/images/Schema.png)

Video: https://www.youtube.com/watch?v=pm8oFxz4xrw

En snabb beskrivning av applikationen:
1. Klienten kollar först om artisten som den vill söka efter finns i LocalStorage. Om den gör det så använder den datan som finns där och kontaktar inte servern något.
2. Om datan inte finns där kontakta servern som kollar i cachen. Saknas datan där så ansluter servern till först Spotify och sedan till LastFM.
3. Servern använder artistnamnet från Spotify så att det blir samma artist som kollas upp hos båda. Om artisten saknas hos Spotify så använder den enbart LastFM datan.
4. Servern returerar datan till klienten som sparar det i LocalStorage och sedan visar det på klienten.

Serversida
=========
Servern är en Node applikation. Databasen som håller all information är en Redis server.  
Applikatioen använder sig av Promises. Anledningen är att de är lätta att använda, trevliga att jobba med, de tillåter att Node fortsätter med event-loopen utan att låsa sig vid större problem och detta gör att applikationen inte blir så långsam.   
Valet av Redis som databas är att jag ville testa något nytt. Jag kände inte heller att jag hade ett särskilt stort behov av en RDB så då föll valet på en key-value store.  
Eftersom Redis är väldigt snabbt så behövs det ingen dedikerad applikationscache utan den använder helt enkelt Redis där också. Det är snabbt och händigt att göra det istället för att först fråga Redis om en viss nyckel finns och sedan fråga en annan databas.  
Felhanteringen har jag försökt att bygga ut så mycket som möjligt. Promises tillåter en att ganska lätt hantera fel och sedan gracefully gå vidare med kedjan om man kan ta sig vidare därifrån.  


Klientsida
=========
Klienten använder sig av AppCache för att lagra javascript och html för att hantera sidan. När du är inloggad kan du således använda dig av hela applikationen utan problem. Den använder sig även utav LocalStorage för att lagra sökningar man har gjort tidigare så att man inte behöver kontakta servern för något som man redan sökt på tidigare.  

Säkerhet och prestandaoptimering
=========
Säkerthet och prestanda är inte i jättestort fokus. Dock så är applikationen uppbyggd så att den använder de snabbaste sätten att kontrollera om data finns innan den använder långsammar sätt.  
Eftersom SQL inte används så finns det inga risker för SQLInjections.  Inte heller finns det några direkta risker för XSS då servern inte returerar data som klienten har skrivit in utan använder svaren från servern istället. På så sätt undviks det.  


Offline-first
=========
Applikationen använder sig av AppCache som sagt och även LocalStorage. AppCache behövs för att det ska gå att ladda sidan även om man är offline medan LocalStorage används för att lagra sökningar som man tidigare har gjort. Detta tillåter en att söka på vad man vill, så länge som man har gjort det tidigare.  
Eftersom AppCache cachar alla URIer man genererar så skulle man kunna använda det, men det hade inte varit lika flexibelt eftersom det inte hade gått att cacha alla kombinationer.   
Om man till exempel jämför artist A med artist B så hade man kunnat generera en querystring typ ?artist1=A&artist2=B men om man växlar till ?aritst1=B&artist2=A så hade det cachats igen, och det fungerar inte riktigt så bra. Därför används LocalStorage istället.

Egen reflektion kring projektet
=========
Projektet har gått ganska bra. Jag har lagt en väldig massa tid på det, men jag är ganska nöjd med resultatet.  
Allt har varit lite bråkigt, tycker jag. APIerna är lite jobbiga att arbeta med ibland, om LastFM ligger nere så är det svårt att avgöra det i själva applikationen. Jag har även fått lov att lära mig hur jag ska hantera att Node inte ska låsa själva eventloopen så att saker flyter på, vilket var anledningen till att jag valde att använda Promises.  
Det är också förhållandevis bråkigt att debuga en node applikation, men jag hittade node-debug som tillåter en att använda chrome dev tools för att stiga igenom hela applikatioen och det har hjälp väldigt mycket med de problem som jag har stött på under utvecklingens gång.  
För att inte tala om allt bråk som det är med AppCache, men det är hyfsat ändå. Drygt.


Risker med din applikation
=========
Risker vet jag inte om det direkt finns så många. Det  beror ju givetvis på hur man vill se på saken. Det borde inte finnas någora direkta risker med den.