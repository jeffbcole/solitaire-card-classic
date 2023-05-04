self.addEventListener('message', function(e){
    var data = e.data;
    if (data.cmd) {
        //importScripts('player.js');
            switch (data.cmd) {
                case 'FindSolutionForGame':
                    FindSolutionForGame(data);
                    break;
            }
    }
}, false);

var searchStartTime;
var isTimeLimited = false;
var timeLimit = 3000;

var FindSolutionForGame = function(data) 
{
    var game = data.game;
    WireUpAllSolverCards(game);
    
    var timeOut = data.timeOut;
    if (timeOut > 0) {
        timeLimit = timeOut
        isTimeLimited = true;
    }
    searchStartTime = performance.now();
    isStopping = false;
    var solutionMoves = [];
    var analyzedGameStates = {};
    var searchTree = [];
    var initialHash = game.gameStateHash;
    var result = SearchGameState(game, analyzedGameStates, searchTree, initialHash);
    if (result == -2) {
        // Timeout
        console.log("Time out");
        var gameSimulatorResult = {
            solutionMoves: solutionMoves,
            resultFound: false,
            isDeadEnd: false,
            initialHash: initialHash
        }
        self.postMessage({
            'cmd': 'OnFinishedGameSimulation',
            'result': gameSimulatorResult
        });
    } else if (result == 0) {
        // Dead end
        var gameSimulatorResult = {
            solutionMoves: solutionMoves,
            resultFound: true,
            isDeadEnd: true,
            initialHash: initialHash
        }
        self.postMessage({
            'cmd': 'OnFinishedGameSimulation',
            'result': gameSimulatorResult
        });
    } else {
        // Solved
        // Add in any premove draw moves
        for (var i=0; i<game.moves.length; i++) {
            var move = game.moves[i];
            if (move.startIndex < 0) {
                for (var k=0; k<move.premoveDeckFlipCount; k++) {
                    var drawMove = {
                        startIndex: 0,
                        endIndex: 0,
                        cardCount: 0,
                        drawCount: game.drawCount,
                        moveCard: move.moveCard,
                        premoveDrawCount: game.drawCount,
                        premoveDeckFlipCount: move.premoveDeckFlipCount - k
                    }
                    solutionMoves.push(drawMove);
                }
                move.startIndex = -1;
                move.premoveDeckFlipCount = 0;
            }
            solutionMoves.push(move);
        }

        var gameSimulatorResult = {
            solutionMoves: solutionMoves,
            resultFound: true,
            isDeadEnd: false,
            initialHash: initialHash
        }
        self.postMessage({
            'cmd': 'OnFinishedGameSimulation',
            'result': gameSimulatorResult
        });
    }    
}

var WireUpAllSolverCards = function(game) {
    for (var i=0; i<game.foundations.length; i++){
        var foundation = game.foundations[i];
        for (var j=0; j<foundation.length; j++) {
            var card = foundation[j];
            card.tableauIndex = i;
            WireUpCard(card, game);
        }
    }
    for (var i=0; i<game.tableaus.length; i++) {
        var tableau = game.tableaus[i];
        for (var j=0; j<tableau.length; j++) {
            var card = tableau[j];
            card.tableauIndex = i+4;
            WireUpCard(card, game);
        } 
    }
    for (var i=0; i<game.deck.length; i++){
        var card = game.deck[i];
        card.tableauIndex = -1;
        WireUpCard(card, game);
    }
}

var WireUpCard = function(card, game) {
    for (var i=0; i<game.foundations.length; i++) {
        var foundation = game.foundations[i];
        for (var j=0; j<foundation.length; j++) {
            var otherCard = foundation[j];
            if (card.suit == otherCard.suit) {
                if (card.number == otherCard.number + 1) {
                    card.suitSolverBelow = otherCard;
                } else if (card.number == otherCard.number - 1) {
                    card.suitSolverAbove = otherCard;
                }
            }
            if ((card.isRed != otherCard.isRed) && (card.number == otherCard.number-1)){
                if (card.hasOwnProperty('solverA')) {
                    card.solverB = otherCard;
                } else {
                    card.solverA = otherCard;
                }
            }
            if ((card.number == otherCard.number) && (card.isRed == otherCard.isRed) && (card.suit != otherCard.suit)) {
                card.otherSameColorSameNumberCard = otherCard;
            }
        }
    }
    for (var i=0; i<game.tableaus.length; i++) {
        var tableau = game.tableaus[i];
        for (var j=0; j<tableau.length; j++) {
            var otherCard = tableau[j];
            if (card.suit == otherCard.suit) {
                if (card.number == otherCard.number + 1) {
                    card.suitSolverBelow = otherCard;
                } else if (card.number == otherCard.number - 1) {
                    card.suitSolverAbove = otherCard;
                }
            }
            if ((card.isRed != otherCard.isRed) && (card.number == otherCard.number-1)){
                if (card.hasOwnProperty('solverA')) {
                    card.solverB = otherCard;
                } else {
                    card.solverA = otherCard;
                }
            }
            if ((card.number == otherCard.number) && (card.isRed == otherCard.isRed) && (card.suit != otherCard.suit)) {
                card.otherSameColorSameNumberCard = otherCard;
            }
        }
    }
    for (var i=0; i<game.deck.length; i++) {
        var otherCard = game.deck[i];
        if (card.suit == otherCard.suit) {
            if (card.number == otherCard.number + 1) {
                card.suitSolverBelow = otherCard;
            } else if (card.number == otherCard.number - 1) {
                card.suitSolverAbove = otherCard;
            }
        }
        if ((card.isRed != otherCard.isRed) && (card.number == otherCard.number-1)){
            if (card.hasOwnProperty('solverA')) {
                card.solverB = otherCard;
            } else {
                card.solverA = otherCard;
            }
        }
        if ((card.number == otherCard.number) && (card.isRed == otherCard.isRed) && (card.suit != otherCard.suit)) {
            card.otherSameColorSameNumberCard = otherCard;
        }
    }
}

var SearchGameState = function(game, analyzedGameStates, searchTree, initialHash) 
{
    if (analyzedGameStates[game.gameStateHash]) {
        return 0;
    }
    analyzedGameStates[game.gameStateHash] = true;

    var moves = FindAvailableMoves(game);
    searchTree.push(moves);

    while (moves.length>0) 
    {
        if (isTimeLimited) {
            if (performance.now() - searchStartTime > timeLimit) {
                // Time limit reached
                return -2;
            }
        }

        var move = moves[0];
        ApplyMove(move, game);
        if (isAllCardsFaceUp(game)) {
            return 1;
        }

        GenerateGameStateHash(game);
        var result = SearchGameState(game, analyzedGameStates, searchTree, initialHash);
        if (result != 0) {
            return result;
        }
        UndoLastMove(game);
        moves.splice(0,1);
    }

    // Dead end
    return 0;
}

var FindAvailableMoves = function(game) 
{
    var availableMoves = [];

    // First play autoplay foundation moves from the bottom of the tableaus
    // If there is an autoplay, then we return only that first move (it becomes the only option)
    for (var i=0; i<game.tableaus.length; i++) {
        var tableau = game.tableaus[i];
        if (tableau.length>0) {
            var card = tableau[tableau.length-1];
            if (CanAutoPlay(game, card)) {
                var autoMove = {
                    startIndex: i+4,
                    endIndex: card.suitInt,
                    cardCount: 1,
                    drawCount: 0,
                    moveCard: card
                }
                availableMoves.push(autoMove);
                return availableMoves;
            }
        }
    }

    // Look at each of the tableau cards that are blocking hidden cards
    var isAKingFaceUpOnATableau = false;
    var emptyTableausCount = 0;
    for (var startTableauIndex=0; startTableauIndex<7; startTableauIndex++) {
        var startTableau = game.tableaus[startTableauIndex];
        if (startTableau.length == 0) {
            emptyTableausCount++;
        }
        for (var i=1; i<startTableau.length; i++) {
            var hiddenCard = startTableau[i-1];
            var blockingCard = startTableau[i];
            if (hiddenCard.isFaceDown && !blockingCard.isFaceDown) {
                if (blockingCard.number == 13) {
                    isAKingFaceUpOnATableau = true;
                }
                for (var endTableauIndex = 0; endTableauIndex<7; endTableauIndex++) {
                    if (startTableauIndex != endTableauIndex) {
                        var destinationTableau = game.tableaus[endTableauIndex];
                        var topCard = destinationTableau.length == 0 ? null : destinationTableau[destinationTableau.length-1];
                        if ((topCard == null && blockingCard.number == 13) || 
                            ((topCard != null) && (topCard.number == blockingCard.number+1) && (topCard.isRed != blockingCard.isRed))) 
                        {
                            var cardCount = startTableau.length-i;
                            var move = {
                                startIndex: startTableauIndex+4,
                                endIndex: endTableauIndex+4,
                                cardCount: cardCount,
                                drawCount: 0,
                                moveCard: blockingCard
                            }
                            availableMoves.push(move);
                            if (topCard == null) {
                                // If this is a king moving to an empty tableau,
                                // we don't want to consider any more moves for this king
                                break;
                            }
                        }
                    }
                }
                if (i==startTableau.length-1 && blockingCard.number != 13) {
                    // Blocking card is a single non-king card so try the foundation
                    var foundation = game.foundations[blockingCard.suitInt];
                    if (foundation.length == blockingCard.number-1) {
                        var move = {
                            startIndex: startTableauIndex+4,
                            endIndex: blockingCard.suitInt,
                            cardCount: 1,
                            drawCount: 0,
                            moveCard: blockingCard
                        }
                        availableMoves.push(move);
                    }
                }
            }
        }
    }

    // Check if we should try to make an empty tableau pile
    var emptyTableauMovesAdded = false;
    if (isAKingFaceUpOnATableau && emptyTableausCount == 0) {
        for (var startTableauIndex=0; startTableauIndex<7; startTableauIndex++) {
            var startTableau = game.tableaus[startTableauIndex];
            var blockingCard = startTableau[0];
            if (!blockingCard.isFaceDown && blockingCard.number != 13) {
                for (var endTableauIndex=0; endTableauIndex<7; endTableauIndex++) {
                    if (startTableauIndex != endTableauIndex) {
                        var destinationTableau = game.tableaus[endTableauIndex];
                        var topCard = destinationTableau.length>0 ? destinationTableau[destinationTableau.length-1] : null;
                        if ((topCard != null) && (topCard.number == blockingCard.number+1) && (topCard.isRed != blockingCard.isRed)){
                            var move = {
                                startIndex: startTableauIndex+4,
                                endIndex: endTableauIndex+4,
                                cardCount: startTableau.length,
                                drawCount: 0,
                                moveCard: blockingCard
                            }
                            availableMoves.push(move);
                            emptyTableauMovesAdded = true;
                        }
                    }
                }
            }
        }
    }

    // Look at the deck cards
    var atLeastOneDeckMoveIsAKing = false;
    if (game.deck.length > 0) 
    {
        // If the draw count is 3 then we will need to make two passes
        // through the deck because the available cards might have changed
        var timesThroughTheDeck = 0;
        var deckCardsChecked = {};
        var lowestPriorityMoves = [];
        var deckFlipsCount = 0;
        var currentDeckSearchIndex = game.deckIndex;
        var deckCard = null;
        if (currentDeckSearchIndex < 0) {
            // We have to flip the deck to start
            deckFlipsCount += 1;
            currentDeckSearchIndex += game.drawCount;
            if (currentDeckSearchIndex >= game.deck.length) {
                currentDeckSearchIndex = game.deck.length-1;
            }
            deckCard = game.deck[currentDeckSearchIndex];
        } else {
            deckCard = game.deck[game.deckIndex];
        }
        var initialDeckSearchIndex = currentDeckSearchIndex;
        while (true) {
            var cardAlreadyExamined = false;
            if (game.drawCount > 1) {
                if (deckCardsChecked[deckCard.id]) {
                    cardAlreadyExamined = true;
                } else {
                    deckCardsChecked[deckCard.id] = true;
                }
            }

            if (!cardAlreadyExamined) 
            {
                if (deckCard.number == 13) {
                    atLeastOneDeckMoveIsAKing = true;
                }

                // Check if deck card can play to foundation
                if (game.foundations[deckCard.suitInt].length == deckCard.number-1) {
                    var move = {
                        startIndex: -2,
                        endIndex: deckCard.suitInt,
                        cardCount: 1,
                        drawCount: 0,
                        moveCard: deckCard,
                        premoveDeckFlipCount: deckFlipsCount,
                        deckIndex: currentDeckSearchIndex,
                        premoveStackIndex: game.deckIndex
                    }
                    lowestPriorityMoves.push(move);
                }

                // Check if deck card has an available tableau play
                for (var destinationTableauIndex=0; destinationTableauIndex<7; destinationTableauIndex++) {
                    var destinationTableau = game.tableaus[destinationTableauIndex];
                    var destinationCard = null;
                    if (destinationTableau.length>0) {
                        destinationCard = destinationTableau[destinationTableau.length-1];
                    }
                    if ((destinationCard == null && deckCard.number == 13) || (destinationCard != null && destinationCard.number == deckCard.number+1 && destinationCard.isRed != deckCard.isRed)) {
                        // First check if there is a path between this card and a blocking card
                        var shortestDistanceMove = null;
                        var currentShortestDistance = 15;
                        for (var tableauToUnblockIndex = 0; tableauToUnblockIndex < 7; tableauToUnblockIndex++)
                        {
                            if (tableauToUnblockIndex != destinationTableauIndex)
                            {
                                var tableauToUnblock = game.tableaus[tableauToUnblockIndex];
                                for (var i=1; i<tableauToUnblock.length; i++) {
                                    var hiddenCard = tableauToUnblock[i-1];
                                    var blockingCard = tableauToUnblock[i];
                                    if (hiddenCard.isFaceDown && !blockingCard.isFaceDown)
                                    {
                                        // Check if this card has a path to the deck card we are considering
                                        var distance = deckCard.number - blockingCard.number;
                                        if (distance > 0) {
                                            // Check if card is correct color and number to be a path
                                            if ((distance%2 == 0 && blockingCard.isRed == deckCard.isRed) || (distance%2==1 && blockingCard.isRed != deckCard.isRed))
                                            {
                                                // For single drawcount we require that all path cards are in the deck
                                                if (game.drawCount == 1) {
                                                    var pathFoundInDeck = true;
                                                    var currentSearchNumber = blockingCard.number + 1;
                                                    var currentSearchColorIsRed = !blockingCard.isRed;
                                                    while (currentSearchNumber < deckCard.number) {
                                                        pathFoundInDeck = false;
                                                        for (var deckIndex = 0; deckIndex<game.deck.length; deckIndex++) {
                                                            var card = game.deck[deckIndex];
                                                            if (card.number == currentSearchNumber && card.isRed == currentSearchColorIsRed) {
                                                                currentSearchNumber += 1;
                                                                currentSearchColorIsRed = !currentSearchColorIsRed;
                                                                pathFoundInDeck = true;
                                                                break;
                                                            }
                                                        }
                                                        if (!pathFoundInDeck) {
                                                            break;
                                                        }
                                                    }
                                                    if (!pathFoundInDeck) {
                                                        continue;
                                                    }
                                                }

                                                if (distance < currentShortestDistance) {
                                                    currentShortestDistance = distance;
                                                    shortestDistanceMove = {
                                                        startIndex: -2,
                                                        endIndex: destinationTableauIndex+4,
                                                        cardCount: 1,
                                                        drawCount: 0,
                                                        moveCard: deckCard,
                                                        premoveDeckFlipCount: deckFlipsCount,
                                                        distanceToBlocker: distance,
                                                        deckIndex: currentDeckSearchIndex,
                                                        premoveStackIndex: game.deckIndex
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (shortestDistanceMove != null) {
                            // Insert this move sorted by closest distance to blocker
                            var added = false;
                            for (var i=0; i<availableMoves.length; i++) {
                                var move = availableMoves[i];
                                if (move.startIndex == -2 && move.distanceToBlocker > shortestDistanceMove.distanceToBlocker) {
                                    availableMoves.splice(i, 0, shortestDistanceMove);
                                    added = true;
                                    break;
                                }
                            }
                            if (!added) {
                                availableMoves.push(shortestDistanceMove);
                            }
                        } else {
                            // Add this move as a low priority because it might open up deck card options
                            var tableauMove = {
                                startIndex: -2,
                                endIndex: destinationTableauIndex+4,
                                cardCount: 1,
                                drawCount: 0,
                                moveCard: deckCard,
                                premoveDeckFlipCount: deckFlipsCount,
                                distanceToBlocker: 15,
                                deckIndex: currentDeckSearchIndex,
                                premoveStackIndex: game.deckIndex
                            }
                            lowestPriorityMoves.push(tableauMove);
                        }
                    }
                }
            }

            // Step forward as if we drew a card
            if (currentDeckSearchIndex == game.deck.length-1) {
                timesThroughTheDeck++;
                if (timesThroughTheDeck == 2 || game.deck.length <= game.drawCount)
                    break;
                currentDeckSearchIndex = game.drawCount-1;
            } else {
                currentDeckSearchIndex += game.drawCount;
                if (currentDeckSearchIndex >= game.deck.length) {
                    currentDeckSearchIndex = game.deck.length-1;
                }
            }
            
            if (game.drawCount == 1 && currentDeckSearchIndex == initialDeckSearchIndex) {
                // Stop after one loop through if draw count is 1
                break;
            }
            
            deckCard = game.deck[currentDeckSearchIndex];
            deckFlipsCount += 1;
        }

        for (var i=0; i<lowestPriorityMoves.length; i++) {
            availableMoves.push(lowestPriorityMoves[i]);
        }
    }

    // Check if we should try to make an empty tableau pile
    if (!emptyTableauMovesAdded && atLeastOneDeckMoveIsAKing && emptyTableausCount == 0) {
        for (var startTableauIndex=0; startTableauIndex<7; startTableauIndex++) {
            var startTableau = game.tableaus[startTableauIndex];
            if (startTableau.length>0) {
                var blockingCard = startTableau[0];
                if (!blockingCard.isFaceDown && blockingCard.number != 13) {
                    for (var endTableauIndex =0; endTableauIndex<7; endTableauIndex++) {
                        if (startTableauIndex != endTableauIndex) {
                            var destinationTableau = game.tableaus[endTableauIndex];
                            if (destinationTableau.length>0) {
                                var topCard = destinationTableau[destinationTableau.length-1];
                                if ((topCard.number == blockingCard.number+1) && (topCard.isRed != blockingCard.isRed)) {
                                    var move = {
                                        startIndex: startTableauIndex+4,
                                        endIndex: endTableauIndex+4,
                                        cardCount: startTableau.length,
                                        drawCount: 0,
                                        moveCard: blockingCard
                                    }
                                    availableMoves.push(move);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add any foundation plays from tableaus
    for (var startTableauIndex = 0; startTableauIndex<7; startTableauIndex++) {
        var startTableau = game.tableaus[startTableauIndex];
        if (startTableau.length>0) {
            var lastCard = startTableau[startTableau.length-1];
            if (game.foundations[lastCard.suitInt].length == lastCard.number-1) {
                var move = {
                    startIndex: startTableauIndex+4,
                    endIndex: lastCard.suitInt,
                    cardCount: 1,
                    drawCount: 0,
                    moveCard: lastCard
                }
                availableMoves.push(move);
            }
        }
    }

    // If there are no moves, check for a stack splitting move that can open a play on a foundation
    if (availableMoves.length == 0) {
        for (var foundationIndex=0; foundationIndex<4; foundationIndex++) {
            var foundation = game.foundations[foundationIndex];
            if (foundation.length == 0 || foundation.length == 13) {
                continue;
            }
            var topFoundationCard = foundation[foundation.length-1];
            var foundationNextCard = topFoundationCard.suitSolverAbove;
            var cardFoundInTableau = false;
            for (var startTableauIndex=0; startTableauIndex<7; startTableauIndex++) {
                var tableau = game.tableaus[startTableauIndex];
                for (var startTableauStackIndex=0; startTableauStackIndex<tableau.length; startTableauStackIndex++) {
                    var card = tableau[startTableauStackIndex];
                    if (card == foundationNextCard) {
                        if (!card.isFaceDown) {
                            // Check if the other card of the same color is currently a top card on a tableau
                            for (var endTableauIndex=0; endTableauIndex<7; endTableauIndex++) {
                                var otherTableau = game.tableaus[endTableauIndex];
                                if (otherTableau.length>0) {
                                    var topTableauCard = otherTableau[otherTableau.length-1];
                                    if (topTableauCard.number == foundationNextCard.number && topTableauCard.isRed == foundationNextCard.isRed) {
                                        // We can split the tableau below this card to expose the foundable card
                                        var moveCard = tableau[startTableauStackIndex+1];
                                        var move = {
                                            startIndex: startTableauIndex+4,
                                            endIndex: endTableauIndex+4,
                                            cardCount: tableau.length - startTableauStackIndex - 1,
                                            drawCount: 0,
                                            moveCard: moveCard
                                        }
                                        availableMoves.push(move);
                                        break;
                                    }
                                }
                            }
                        }
                        cardFoundInTableau = true;
                        break;
                    }
                }
                if (cardFoundInTableau) {
                    break;
                }
            }
        }
    }
    
    return availableMoves;
}

var CanAutoPlay = function(game, card) {
    if (game.foundations[card.suitInt].length == card.number-1) {
        if (card.number == 1) {
            return true;
        }

        var sameColoroppositeSuit = game.foundations[(card.suitInt+2)%4].length;
        var oppositeColor1 = game.foundations[(card.suitInt+1)%4].length;
        var oppositeColor2 = game.foundations[(card.suitInt+3)%4].length;
        
        return (sameColoroppositeSuit >= card.number-3) &&
                (oppositeColor1 >= card.number-2) &&
                (oppositeColor2 >= card.number-2);
    }
    return false;
}

var ApplyMove = function(move, game) 
{
    if (move.drawCount > 0) {
        if (game.deckIndex == game.deck.length-1) {
            move.moveResetsDeck = true;
            game.deckIndex = move.drawCount - 1;
            if (game.deckIndex >= game.deck.length) {
                game.deckIndex = game.deck.length-1;
            }
        } else {
            game.deckIndex += move.drawCount;
            if (game.deckIndex >= game.deck.length) {
                move.drawCount = game.deck.length-1 - (game.deckIndex-move.drawCount);
                game.deckIndex = game.deck.length-1;
            }
        }
    } else if (move.startIndex == -2) {
        var card = game.deck[move.deckIndex];
        game.deck.splice(move.deckIndex, 1);
        game.deckIndex = move.deckIndex-1;
        if (game.deckIndex >= game.deck.length-1) {
            game.deckIndex = game.deck.length-1;
        }
        card.tableauIndex = move.endIndex;
        if (move.endIndex < 4) {
            game.foundations[move.endIndex].push(card);
        } else {
            game.tableaus[move.endIndex-4].push(card);
        }
    } else if (move.startIndex == -1) {
        var card = game.deck[move.deckIndex];
        game.deck.splice(move.deckIndex, 1);
        card.tableauIndex = move.endIndex;
        if (move.endIndex<4) {
            game.foundations[move.endIndex].push(card);
        } else {
            game.tableaus[move.endIndex-4].push(card);
        }
        game.deckIndex--;
    } else {
        // Remove from previous tableau
        var movingCards = [];
        var tableau = game.tableaus[move.startIndex-4];
        var curDepth = tableau.length - move.cardCount;
        for (var i=0; i<move.cardCount; i++) {
            movingCards.push(tableau[curDepth+i]);
        }
        tableau.splice(tableau.length-move.cardCount, move.cardCount);
        
        // Add to the played pile
        for (var i=0; i<movingCards.length; i++) {
            var card = movingCards[i];
            card.tableauIndex = move.endIndex;
            if (move.endIndex<4) {
                game.foundations[move.endIndex].push(card);
            } else {
                game.tableaus[move.endIndex-4].push(card);
            }
        }

        // Face up any exposed card in the stack
        if (tableau.length > 0) {
            var lastCard = tableau[tableau.length-1];
            if (lastCard.isFaceDown) {
                lastCard.isFaceDown = false;
                move.moveExposedStackCard = true;
                move.exposedCard = lastCard;
            }
        }
    }

    game.moves.push(move);
}

var isAllCardsFaceUp = function(game) {
    for (var i=0; i<7; i++) {
        var tableau = game.tableaus[i];
        if (tableau.length>0) {
            var card = tableau[0];
            if (card.isFaceDown) {
                return false;
            }
        }
    }
    return true;
}

var GenerateGameStateHash = function(game) {
    var p=53;
    var p2=59;
    var m=1e9 + 7;
    var m2=1e9 + 9;
    var hash_value = 0;
    var hash_value2 = 0;
    var p_pow = 1;
    var p_pow2 = 1;
    var spacerValue = 53;
    for (var i=0; i<game.foundations.length; i++) {
        var foundation = game.foundations[i];
        hash_value = (hash_value + (foundation.length+1)*p_pow) % m;
        p_pow = (p_pow*p)%m;
        hash_value = (hash_value + spacerValue*p_pow) % m;
        p_pow = (p_pow*p)%m;
        
        hash_value2 = (hash_value2 + (foundation.length+1)*p_pow2) % m2;
        p_pow2 = (p_pow2*p2)%m2;
        hash_value2 = (hash_value2 + spacerValue*p_pow2) % m2;
        p_pow2 = (p_pow2*p2)%m2;
    }
    for (var i=0; i<game.tableaus.length; i++) {
        var tableau = game.tableaus[i];
        for (var j=0; j<tableau.length; j++) {
            var card = tableau[j];
            if (card.otherSameColorSameNumberCard.tableauIndex>=4 &&
                !card.otherSameColorSameNumberCard.isFaceDown)
            {
                // Using symmetric hash
                hash_value = (hash_value + (card.number + (card.isRed ? 0 : 13))*p_pow) % m;
                p_pow = (p_pow*p)%m;
                
                hash_value2 = (hash_value2 + (card.number + (card.isRed ? 0 : 13))*p_pow2) % m2;
                p_pow2 = (p_pow2*p2)%m2;
            
            } else {
                hash_value = (hash_value + (13*card.suitInt + card.number)*p_pow) % m;
                p_pow = (p_pow*p)%m;
                
                hash_value2 = (hash_value2 + (13*card.suitInt + card.number)*p_pow2) % m2;
                p_pow2 = (p_pow2*p2)%m2;
            }
        }
        hash_value = (hash_value + spacerValue*p_pow) % m;
        p_pow = (p_pow*p)%m;
        
        hash_value2 = (hash_value2 + spacerValue*p_pow2) % m2;
        p_pow2 = (p_pow2*p2)%m2;
    }
    hash_value = (hash_value + (game.deckIndex+2)*p_pow) % m;
    hash_value2 = (hash_value2 + (game.deckIndex+2)*p_pow2) % m2;
    game.gameStateHash = String(hash_value) + String(hash_value2);
}

var UndoLastMove = function(game) {
    if (game.moves.length>0) {
        var lastMove = game.moves[game.moves.length-1];
        if (lastMove.drawCount > 0) {
            game.deckIndex -= lastMove.drawCount;
            if (game.deckIndex < 0 && lastMove.moveResetsDeck) {
                game.deckIndex = game.deck.length-1;
            }
        } else {
            if (lastMove.moveExposedStackCard) {
                var tableau = game.tableaus[lastMove.startIndex-4];
                var stackCard = tableau[tableau.length-1];
                stackCard.isFaceDown = true;
            }

            var movingCards = [];
            if (lastMove.endIndex < 4) {
                var foundation = game.foundations[lastMove.endIndex];
                movingCards.push(foundation[foundation.length-1]);
                foundation.splice(foundation.length-1, 1);
            } else {
                var tableau = game.tableaus[lastMove.endIndex-4];
                var curDepth = tableau.length - lastMove.cardCount;
                for (var i=0; i<lastMove.cardCount; i++) {
                    movingCards.push(tableau[curDepth+i]);
                }
                for (var i=0; i<lastMove.cardCount; i++) {
                    tableau.splice(tableau.length-1, 1);
                }
            }

            for (var i=0; i<movingCards.length; i++) {
                var card = movingCards[i];
                if (lastMove.startIndex == -1) {
                    card.tableauIndex = -1;
                    game.deckIndex++;
                    if (game.deckIndex >= game.deck.length) {
                        game.deck.push(card);
                    } else {
                        game.deck.splice(game.deckIndex, 0, card);
                    }
                } else if (lastMove.startIndex < 0) {
                    card.tableauIndex = -1;
                    game.deckIndex = lastMove.deckIndex;
                    if (game.deckIndex >= game.deck.length) {
                        game.deck.push(card);
                    } else {
                        game.deck.splice(game.deckIndex, 0, card);
                    }
                    game.deckIndex = lastMove.premoveStackIndex;
                } else {
                    card.tableauIndex = lastMove.startIndex;
                    game.tableaus[lastMove.startIndex-4].push(card);
                }
            }
        }
        game.moves.splice(game.moves.length-1, 1);
    }
}