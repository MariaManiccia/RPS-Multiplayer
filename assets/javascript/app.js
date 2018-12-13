
$(document).ready(function () {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBCHAH13jt6jYCm2LHC1axBh6xF7e9Fw8Q",
        authDomain: "rps-multiplayer-76118.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-76118.firebaseio.com",
        projectId: "rps-multiplayer-76118",
        storageBucket: "rps-multiplayer-76118.appspot.com",
        messagingSenderId: "543684742480"
    };
    firebase.initializeApp(config);
    console.log("firebase database connection initialized");

    const database = firebase.database();
    console.log("Local database variable assigned");

    // my variables
    let p1 = null;
    let p2 = null;
    let p1name = "";
    let p2name = "";
    let yourPlayerName = "";
    let turn = 1;

    // check the database for previous information
    database.ref("/players/").on("value", function (snapshot) {

        // Check to see if player 1 exists
        if (snapshot.child("p1").exists()) {
            console.log("Player 1 is connected");

            // set variables for player 1
            p1 = snapshot.val().p1;
            p1name = p1.name;

            // connect it to html
            $("#p1display").text(`${p1name} has ${p1.win} wins ${p1.loss} losses and ${p1.tie} ties`);
        }

        else {
            console.log("Player 1 isn't connected.");
            p1 = null;
            p1name = "";

            $("#p1name").text("Waiting for Player 1...");
            database.ref("/outcome/").remove();
            $("#outcome").html("Rock! Paper! Scissors! Shoot!");
            $("#p2data").html("Wins: 0 Losses: 0 Ties: 0");
        }

        if (snapshot.child("p2").exists()) {
            console.log("Player 2 exists in the database");

            // variables for player 2
            p2 = snapshot.val().p2;
            p2name = p2.name;

            // display on html
            $("#p2display").text(`${p2name} has ${p2.win} wins ${p2.loss} losses and ${p2.tie} ties`);
        }

        else {
            console.log("Player 2 does NOT exist in the database");
            p2 = null;
            p2name = "";

            $("#p2name").text("Waiting for Player 2...");
            database.ref("/outcome/").remove();
            $("#outcome").html("Rock! Paper! Scissors! Shoot!");
            $("#scoreboard").html("Waiting for Players to join");
            $("#p2data").html("Wins: 0 Losses: 0 Ties: 0");
        }

        // if there are two players, start the game
        if (p1 && p2) {
            console.log("Both players are now present")

            // show whose turn it is
            $("#p1display").addClass("yourTurn");
            $("#outcome").html("Waiting on " + p1name + " to choose...");
        }

        //if players leave the game, reset chat
        if (!p1 && !p2) {
            database.ref("/chat/").remove();
            database.ref("/turn/").remove();
            database.ref("/outcome/").remove();
            $("#chatdisplay").empty();
            $("#p1display").removeClass("yourTurn");
            $("#p2display").removeClass("yourTurn");
            $("#outcome").html("Rock! Paper! Scissors! Shoot!");
        }

    });

    // when a player disconnects
    database.ref("/players/").on("child_removed", function (snapshot) {

        var msg = snapshot.val().name + " has disconnected!";
        var chatKey = database.ref().child("/chat/").push().key;

        database.ref("/chat/" + chatKey).set(msg);
    });

    // listener for chat
    database.ref("/chat/").on("child_added", function (snapshot) {

        // get the new message from the database
        var chatMsg = snapshot.val();
        var chatEntry = $("<div>").html(chatMsg);

        $("#chatdisplay").append(chatEntry);

        // to scroll correctly
        $("#chatdisplay").scrollTop($("#chatdisplay")[0].scrollHeight);
    });

    // turn listener
    database.ref("/turn/").on("value", function (snapshot) {

        if (snapshot.val() === 1) {
            console.log("TURN 1");
            turn = 1;

            if (p1 && p2) {
                $("#p1display").addClass("yourTurn");
                $("#p2display").removeClass("yourTurn");
                // show when player still has to pick
                $("#outcome").html("Waiting on " + p1name + "...");
            }

        } else if (snapshot.val() === 2) {
            console.log("TURN 2");
            turn = 2;
            if (p1 && p2) {
                $("#p1display").removeClass("yourTurn");
                $("#p2display").addClass("yourTurn");
                // show when p2 still has to pick 
                $("#outcome").html("Waiting on " + p2name + "...");
            }
        }
    });

    // listener for submit button
    $("#add-name").on("click", function (event) {
        event.preventDefault();

        if (($("#name-input").val().trim() !== "") && !(p1 && p2)) {
            // Adding player 1
            if (p1 === null) {
                console.log("Adding Player 1");

                yourPlayerName = $("#name-input").val().trim();
                p1 = {
                    name: yourPlayerName,
                    win: 0,
                    loss: 0,
                    tie: 0,
                    choice: ""
                };

                database.ref().child("/players/p1").set(p1);

                database.ref().child("/turn").set(1);
                // on disconnect
                database.ref("/players/p1").onDisconnect().remove();

            }

            else if ((p1 !== null) && (p2 === null)) {
                console.log("Adding Player 2");
                yourPlayerName = $("#name-input").val().trim();
                p2 = {
                    name: yourPlayerName,
                    win: 0,
                    loss: 0,
                    tie: 0,
                    choice: ""
                };

                database.ref().child("/players/p2").set(p2);

                database.ref("/players/p2").onDisconnect().remove();
            }

            // tell chat when someone has joined
            var msg = yourPlayerName + " has joined!";
            console.log(msg);
            var chatKey = database.ref().child("/chat/").push().key;
            database.ref("/chat/" + chatKey).set(msg);
            $("#formcontain").hide()
        }
    });

    // when the chat submit btn is pushed
    $("#chat-send").on("click", function (event) {
        event.preventDefault();

        // chekc for message
        if ((yourPlayerName !== "") && ($("#chat-text").val().trim() !== "")) {
            // grab the message
            var msg = yourPlayerName + ": " + $("#chat-text").val().trim();
            $("#chat-text").val("");
            var chatKey = database.ref().child("/chat/").push().key;
            database.ref("/chat/" + chatKey).set(msg);
        }
    });

    // Choices added, functions for when they are pushed 
    //then added to the database
    $("#rock").on("click", function () {
        // setup
        if (p1 && p2 && (yourPlayerName === p1.name) && (turn === 1)) {
            var choice = $(this).text().trim();
            console.log("player selected " + $(this).text());
            p1Choice = choice;

            database.ref().child("/players/p1/choice").set(choice);

            turn = 2;
            database.ref().child("/turn").set(2);
        }
    });

    $("#paper").on("click", function () {
        // Make selections only when both players are in the game
        if (p1 && p2 && (yourPlayerName === p1.name) && (turn === 1)) {
            // grab player one's choice
            var choice = $(this).text().trim();
            console.log("player selected " + $(this).text());
            // put the player's choice into the database
            p1Choice = choice;
            database.ref().child("/players/p1/choice").set(choice);

            // Set the turn value to 2
            turn = 2;
            database.ref().child("/turn").set(2);
        }
    });

    $("#scissors").on("click", function () {
        
        if (p1 && p2 && (yourPlayerName === p1.name) && (turn === 1)) {
            
            var choice = $(this).text().trim();
            console.log("player selected " + $(this).text());
            p1Choice = choice;
            database.ref().child("/players/p1/choice").set(choice);
            turn = 2;
            database.ref().child("/turn").set(2);
        }
    });

    //same for player two
    $("#rock").on("click", function () {
        event.preventDefault();

        if (p1 && p2 && (yourPlayerName === p2.name) && (turn === 2)) {
            
            var choice = $(this).text().trim();
            p2Choice = choice;
            database.ref().child("/players/p2/choice").set(choice);
            compareChoices();
        }
    });

    $("#paper").on("click", function () {
        event.preventDefault();
        if (p1 && p2 && (yourPlayerName === p2.name) && (turn === 2)) {
            
            var choice = $(this).text().trim();
            p2Choice = choice;
            database.ref().child("/players/p2/choice").set(choice);
            compareChoices();
        }
    });

    $("#scissors").on("click", function () {
        event.preventDefault();

        if (p1 && p2 && (yourPlayerName === p2.name) && (turn === 2)) {
            
            var choice = $(this).text().trim();
            p2Choice = choice;
            database.ref().child("/players/p2/choice").set(choice);
            compareChoices();
        }
    });

    // comparing user choics 
    function compareChoices() {
        if (p1.choice === "Rock") {
            if (p2.choice === "Rock") {
                // Tie
                console.log("tie");
                database.ref().child("/outcome/").set("Tie game!");
                database.ref().child("/players/p1/tie").set(p1.tie + 1);
                database.ref().child("/players/p2/tie").set(p2.tie + 1);
            } else if (p2.choice === "Paper") {
                // player two wins
                console.log("paper wins");
                database.ref().child("/outcome/").set("Paper wins!");
                database.ref().child("/players/p1/loss").set(p1.loss + 1);
                database.ref().child("/players/p2/win").set(p2.win + 1);
            } else { 
                // player one wins
                console.log("rock wins");
                database.ref().child("/outcome/").set("Rock wins!");
                database.ref().child("/players/p1/win").set(p1.win + 1);
                database.ref().child("/players/p2/loss").set(p2.loss + 1);
            }
        } else if (p1.choice === "Paper") {
            if (p2.choice === "Rock") {
                // player one wins
                console.log("paper wins");
                database.ref().child("/outcome/").set("Paper wins!");
                database.ref().child("/players/p1/win").set(p1.win + 1);
                database.ref().child("/players/p2/loss").set(p2.loss + 1);
            } else if (p2.choice === "Paper") {
                // Tie
                console.log("tie");
                database.ref().child("/outcome/").set("Tie game!");
                database.ref().child("/players/p1/tie").set(p1.tie + 1);
                database.ref().child("/players/p2/tie").set(p2.tie + 1);
            } else { 
                // player two wins
                console.log("scissors win");
                database.ref().child("/outcome/").set("Scissors win!");
                database.ref().child("/players/p1/loss").set(p1.loss + 1);
                database.ref().child("/players/p2/win").set(p2.win + 1);
            }
        } else if (p1.choice === "Scissors") {
            if (p2.choice === "Rock") {
                // player two wins
                console.log("rock wins");

                database.ref().child("/outcome/").set("Rock wins!");
                database.ref().child("/players/p1/loss").set(p1.loss + 1);
                database.ref().child("/players/p2/win").set(p2.win + 1);
            } else if (p2.choice === "Paper") {
                // player one wins
                console.log("scissors win");

                database.ref().child("/outcome/").set("Scissors win!");
                database.ref().child("/players/p1/win").set(p1.win + 1);
                database.ref().child("/players/p2/loss").set(p2.loss + 1);
            } else {
                // Tie
                console.log("tie");

                database.ref().child("/outcome/").set("Tie game!");
                database.ref().child("/players/p1/tie").set(p1.tie + 1);
                database.ref().child("/players/p2/tie").set(p2.tie + 1);
            }

        }
        //reset
        turn = 1;
        database.ref().child("/turn").set(1);
    }
});