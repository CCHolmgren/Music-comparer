Webbteknik_II_Projekt
=====================

Projektet i Webbteknik II kursen. Tanken är att den ska vara ne mashup-applikation som använder minst 2 APIer samt OAuth för någon funktionalitet.

Idé
====
Min tanke är att skapa en låt-jämföringstjänst. Detta genom att använda Spotify och Last.FM's APIer för att finna information om låtarna. Taggar, lyssningar/scrobblinar, när låten publicerades, hur många album, och liknande information som kan vara roligt att veta om låten.
OAuth delen kommer antingen in från Spotify eller Last.FM. Båda tillhandahåller OAuth för mer information om en användares lyssningar. Jag är inte helt säker vilken av dem jag kommer att använda då det beror på vilken funktionalitet jag väljer att implementera.
Jag kommer antagligen att använda Node och någon persistent lagringsmetod, redis kan vara en möjlighet då jag inte har använt någon key-value store ännu, och redis tillåter persistence via RDB och AOF.
