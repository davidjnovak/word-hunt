# TODO for word-hunt
### Backend
* Remove expired and finished rooms from DB
    * Explanation: Currently, rooms do not have a way of being deleted from the DB, which means that expired games persist in the `rooms` collection. There needs to be a system that removes completed rooms from the DB after a certain time to prevent unintended data accumulation
* Lobby system or some method of prepping games and players before a round is to begin
    * Could be either a host-client(s) flow, or an all-client flow where everyone must ready up before beginning a game. Consider a countdown timer for the latter
    * This will likely require modifications to the schema of database entries, meaning a boolean (started, ended) or string status ("started", "starting", "ended", "lobby") will need to be added to keep track of which stage in the process the room is
* Store a player ID as a browser cookie to prevent double joining
    * Explanation: Currently, if a player joins the lobby, they will be added as a new player to the room as they should. However, if that same player closes and re-opens their window, or they refresh, they will not only be added as a new player, but the existing player in the room that used is now persisting in the room as a non-controlled player. This means there needs to be a system (cookies) that keeps track of the player to prevent a scenario in which they join back and get added as a new player
* Allow the ability to have players create their own name before joining a room (bonus for letting the player change their name after they join the room), and their name will show up on a list of currently connected players for that room. This will require some [frontend development](#nameCreationFrontend) as well
* Create room settings (editable only by host, preferrably) to allow for customization. Some settings could include modifying the grid dimensions, or changing the duration of the game. A [corresponding change to the frontend](#settingsCreationFrontend) will also need to be made.
* Create a list of english words / add to `englishwords.txt` which will be pulled from during grid generation
* Create a timer that is synced amongst all clients

### Frontend
* Pretty up the pages, namely the create/join and the room pages
* <a name="nameCreationFrontend"></a> Create a new text entry box that will allow the player to enter their name before joining a room. In accordance with the backend developmet, determine whether to add the ability for the player to change their name after joining a room
* In accordance with backend development, create a page that corresponds with the backend lobby system (a page to support either a host-client lobby, or a ready up system between all clients)
* <a name="settingsCreationFrontend"></a> Support for modifying room settings that align with the settings made by the backend development team. Room settings should preferrably only be editable by the room host, however the settings can still be readable by the clients. Settings should also only be editable in the lobby/pre-game page regardless of who has edit permissions.
* Mobile friendly interface (swiping on the grid instead of typing)
* Add more feedback on the room page for events that happen in-game (if a word is not found in the grid, if a word has already been guessed, if a word was correct, etc.)
* Add a timer to the room page