// Constants
var cardSizeScalar = 0.6;
var cardLoweredWidth = 115*cardSizeScalar;
var cardLoweredHeight = 162*cardSizeScalar;

var Game = function () {
    
    // Local variables
    var currentDraggedCardView;
    var currentDraggedAdditionalCardViews = [];
    var currentDraggedAdditionalCardViewsVerticalOffset = 0;
    var availableMoves = [];
    var currentAutoPlayMoves = [];
    
    // Members
    this.isInitialized = false;
    
    this.gameNumber = 0;
    this.gameDifficulty = '';
    this.elapsedSeconds = 0;
    this.elapsedStartDate = new Date();
    this.moves = [];
    this.hintsUsed = 0;
    this.undosUsed = 0;
    this.foundations = [ [], [], [], [] ];
    this.tableaus = [ [], [], [], [], [], [], [] ];
    this.deck = [];
    this.deckIndex = -1;
    this.gameStateHash = '';
    this.drawCount = 3;

    var canvasWidth = 0;
    var canvasHeight = 0;
    var foundationsLeft = 0;
    var foundationsTop = 10;
    var foundationsSpacing = 1;
    var tableausSpacing = 1;
    var tableausLeft = 0;
    var tableausTop = foundationsTop + cardLoweredHeight + 10;
    var tableauStackVerticalOffset = 0;
    var tableauStackFaceDownVerticalOffset = 0;
    var deckLeft = 0;
    var deckTop = 0;
    var deckStackHorizontalSpacing = 0;
    var flippedCardsLeft = 0;
    var flippedCardsOverlapSpacing = cardLoweredWidth*0.4;

    var forwardMoves = [];
    
    function DeterminePositionsForStackBases() {
        var mainCanvas = document.getElementById('main_canvas');
        canvasWidth = mainCanvas.offsetWidth;
        canvasHeight = mainCanvas.offsetHeight;
        var deckLocationTop = GetSetting('setting_draw_pile_on_top');
        var rightHanded = GetSetting('setting_right_handed');
        var isThoughtful = GetSetting('setting_thoughtful');
        tableauStackVerticalOffset = cardLoweredHeight * 0.380377;
        tableauStackFaceDownVerticalOffset = isThoughtful ? tableauStackVerticalOffset : cardLoweredHeight * 0.126792;
        tableausLeft = (canvasWidth - cardLoweredWidth*7 - tableausSpacing*6)*0.5;
        if (deckLocationTop) {
            deckStackHorizontalSpacing = 0;
            var topRowWidth = cardLoweredWidth*7 + tableausSpacing*6;
            deckTop = foundationsTop;
            if (rightHanded) {
                foundationsLeft = (canvasWidth - topRowWidth)*0.5;
                deckLeft = foundationsLeft + 4*(cardLoweredWidth + foundationsSpacing) + 5;
                flippedCardsLeft = deckLeft + cardLoweredWidth + tableausSpacing + 5;
            } else {
                foundationsLeft = (canvasWidth - topRowWidth)*0.5 + topRowWidth - (cardLoweredWidth*4 + foundationsSpacing*3);
                deckLeft = (canvasWidth - topRowWidth)*0.5;
                flippedCardsLeft = deckLeft + cardLoweredWidth + 5;
            }
        } else {
            deckStackHorizontalSpacing = rightHanded ? cardLoweredWidth*0.1 : -cardLoweredWidth*0.1;
            var topRowWidth = cardLoweredWidth*4 + foundationsSpacing*3;
            foundationsLeft = (canvasWidth - topRowWidth)*0.5;
            var navigationBarHeight = document.getElementById('navigation_bar').offsetHeight;
            deckTop = canvasHeight - cardLoweredHeight - navigationBarHeight - 10;
            deckLeft = (canvasWidth - cardLoweredWidth)*0.5;
            if (rightHanded) {
                flippedCardsLeft = deckLeft + cardLoweredWidth + 10;
            } else {
                flippedCardsLeft = deckLeft - 10 - cardLoweredWidth - 2*flippedCardsOverlapSpacing;
            }
        }
    }
    DeterminePositionsForStackBases();
    
    var foundationBases = [];
    var foundationHearts = document.getElementById('foundation_base_hearts');
    foundationHearts.positionFunction = "GetFoundationBaseLocation('H')";
    foundationBases.push(foundationHearts);
    var foundationClubs = document.getElementById('foundation_base_clubs');
    foundationClubs.positionFunction = "GetFoundationBaseLocation('C')";
    foundationBases.push(foundationClubs);
    var foundationDiamonds = document.getElementById('foundation_base_diamonds');
    foundationDiamonds.positionFunction = "GetFoundationBaseLocation('D')";
    foundationBases.push(foundationDiamonds);
    var foundationSpades = document.getElementById('foundation_base_spades');
    foundationSpades.positionFunction = "GetFoundationBaseLocation('S')";
    foundationBases.push(foundationSpades);
    for (var i=0; i<4; i++) {
        var foundation = foundationBases[i];
        var position = eval(foundation.positionFunction);
        foundation.style.left = position[0] + "px";
        foundation.style.top = position[1] + "px";
        foundation.style.width = cardLoweredWidth + "px";
        foundation.style.height = cardLoweredHeight + "px";  
    }

    var deckBase = document.getElementById('deck_base');
    deckBase.positionFunction = "GetDeckLocation()";
    deckBase.style.width = cardLoweredWidth + "px";
    deckBase.style.height = cardLoweredHeight + "px";
    var position = eval(deckBase.positionFunction);
    deckBase.style.left = position[0] + "px";
    deckBase.style.top = position[1] + "px";
    var deckResetImage = document.getElementById('deck_reset_image');
    deckResetImage.style.width = cardLoweredWidth + "px";
    deckResetImage.style.height = cardLoweredHeight + "px";
    
    var tableauBases = [];
    for (var i=0; i<7; i++) {
        var tableauBase = document.getElementById('tableau_base_' + i);
        tableauBase.positionFunction = "GetTableauBaseLocation('" + i + "')";
        var position = eval(tableauBase.positionFunction);
        tableauBase.style.left = position[0] + "px";
        tableauBase.style.top = position[1] + "px";
        tableauBase.style.width = cardLoweredWidth + "px";
        tableauBase.style.height = cardLoweredHeight + "px";
        tableauBases.push(tableauBase);
    }

    var cards = [
        { id: 'AC', number: 1, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_Ace.jpg')" },
        { id: 'AD', number: 1, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_Ace.jpg')" },
        { id: 'AH', number: 1, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_Ace.jpg')" },
        { id: 'AS', number: 1, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_Ace.jpg')" },
        { id: '2C', number: 2, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_2.jpg')" },
        { id: '2D', number: 2, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_2.jpg')" },
        { id: '2H', number: 2, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_2.jpg')" },
        { id: '2S', number: 2, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_2.jpg')" },
        { id: '3C', number: 3, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_3.jpg')" },
        { id: '3D', number: 3, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_3.jpg')" },
        { id: '3H', number: 3, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_3.jpg')" },
        { id: '3S', number: 3, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_3.jpg')" },
        { id: '4C', number: 4, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_4.jpg')" },
        { id: '4D', number: 4, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_4.jpg')" },
        { id: '4H', number: 4, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_4.jpg')" },
        { id: '4S', number: 4, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_4.jpg')" },
        { id: '5C', number: 5, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_5.jpg')" },
        { id: '5D', number: 5, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_5.jpg')" },
        { id: '5H', number: 5, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_5.jpg')" },
        { id: '5S', number: 5, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_5.jpg')" },
        { id: '6C', number: 6, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_6.jpg')" },
        { id: '6D', number: 6, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_6.jpg')" },
        { id: '6H', number: 6, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_6.jpg')" },
        { id: '6S', number: 6, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_6.jpg')" },
        { id: '7C', number: 7, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_7.jpg')" },
        { id: '7D', number: 7, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_7.jpg')" },
        { id: '7H', number: 7, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_7.jpg')" },
        { id: '7S', number: 7, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_7.jpg')" },
        { id: '8C', number: 8, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_8.jpg')" },
        { id: '8D', number: 8, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_8.jpg')" },
        { id: '8H', number: 8, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_8.jpg')" },
        { id: '8S', number: 8, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_8.jpg')" },
        { id: '9C', number: 9, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_9.jpg')" },
        { id: '9D', number: 9, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_9.jpg')" },
        { id: '9H', number: 9, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_9.jpg')" },
        { id: '9S', number: 9, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_9.jpg')" },
        { id: 'TC', number: 10, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_10.jpg')" },
        { id: 'TD', number: 10, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_10.jpg')" },
        { id: 'TH', number: 10, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_10.jpg')" },
        { id: 'TS', number: 10, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_10.jpg')" },
        { id: 'JC', number: 11, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_Jack.jpg')" },
        { id: 'JD', number: 11, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_Jack.jpg')" },
        { id: 'JH', number: 11, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_Jack.jpg')" },
        { id: 'JS', number: 11, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_Jack.jpg')" },
        { id: 'QC', number: 12, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_Queen.jpg')" },
        { id: 'QD', number: 12, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_Queen.jpg')" },
        { id: 'QH', number: 12, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_Queen.jpg')" },
        { id: 'QS', number: 12, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_Queen.jpg')" },
        { id: 'KC', number: 13, suit: 'C', suitInt: 1, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Club_King.jpg')" },
        { id: 'KD', number: 13, suit: 'D', suitInt: 2, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Diamond_King.jpg')" },
        { id: 'KH', number: 13, suit: 'H', suitInt: 0, isRed: true, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Heart_King.jpg')" },
        { id: 'KS', number: 13, suit: 'S', suitInt: 3, isRed: false, isFaceDown: false, tableauIndex: 0, premoveDeckFlipCount: 0, image: "url('images/cards/Card_Spade_King.jpg')" }
    ];

    var cardsRegion = document.getElementById('cards_region');
    cardsRegion.onmousedown = dragMouseDown;

    // template for card
    var cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.style.width = cardLoweredWidth + "px";
    cardElement.style.height = cardLoweredHeight + "px";
    var raiseContainer = document.createElement("div");
    raiseContainer.className = "raiseContainer";
    raiseContainer.style.width = cardLoweredWidth + "px";
    raiseContainer.style.height = cardLoweredHeight + "px";
    cardElement.appendChild(raiseContainer);
    var styleSheet = document.createElement("style");
    cardElement.appendChild(styleSheet);
    var shadow = document.createElement("div");
    shadow.className = "cardShadow";
    shadow.style.width = cardLoweredWidth + "px";
    shadow.style.height = cardLoweredHeight + "px";
    raiseContainer.appendChild(shadow);
    var flipContainer = document.createElement("div");
    flipContainer.className = "cardFlipContainer";
    flipContainer.style.width = cardLoweredWidth + "px";
    flipContainer.style.height = cardLoweredHeight + "px";
    raiseContainer.appendChild(flipContainer);
    var back = document.createElement("div");
    back.className = "cardBack";
    back.style.width = cardLoweredWidth + "px";
    back.style.height = cardLoweredHeight + "px";
    var backShade = document.createElement("div");
    backShade.className = "cardFrontShade";
    backShade.style.width = cardLoweredWidth + "px";
    backShade.style.height = cardLoweredHeight + "px";
    back.appendChild(backShade);
    flipContainer.appendChild(back);
    var front = document.createElement("div");
    front.className = "cardFront";
    front.style.width = cardLoweredWidth + "px";
    front.style.height = cardLoweredHeight + "px";
    flipContainer.appendChild(front);

    var cardBackURI = "url('images/card_back_" + GetSetting('setting_card_color') + ".jpg')";
    var isThoughtful = GetSetting('setting_thoughtful');
    for (var i = 0; i < cards.length; i++) {
        var newCard = cardElement.cloneNode(true);
        var card = cards[i];
        card.cardView = newCard;
        card.cardView.isSlidUp = false;
        card.cardView.isFlippedUp = false;
        card.cardView.isRaised = false;
        newCard.id = card.id;
        newCard.card = card;
        newCard.positionIndex = i;
        if (isThoughtful) {
            newCard.getElementsByClassName('cardBack')[0].style.backgroundImage = card.image;
            newCard.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0.3;
        } else {
            newCard.getElementsByClassName('cardBack')[0].style.backgroundImage = cardBackURI;
            newCard.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0;
            
        }
        newCard.getElementsByClassName('cardFront')[0].style.backgroundImage = card.image;
        newCard.style.visibility = "hidden";
        cards_region.appendChild(newCard);
    }

    var deckTouchRegion = document.createElement('div');
    deckTouchRegion.className = "deckTouchRegion";
    deckTouchRegion.id = "deck_touch_region";
    deckTouchRegion.style.width = cardLoweredWidth + "px";
    deckTouchRegion.style.height = cardLoweredHeight + "px";
    cards_region.appendChild(deckTouchRegion);

    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function dragMouseDown(e) {
        e = e || window.event;

        if (game.isInitialized && !game.isGameOver()) 
        {
            if (e.target.classList.contains('deckTouchRegion')) {
                cardDeckTouched();
                return;
            }

            if (!e.target.classList.contains('card')) {
                return;
            }
    
            HideIsThinking();
            HideNoOptimalMoveFound();

            availableMoves = [];
            var tappedCardView = e.target;
            if (tappedCardView.isClickable) 
            {    
                var cardCount = tappedCardView.stackDepth + 1;
                currentDraggedAdditionalCardViews = [];
                if (cardCount > 1 && tappedCardView.stackIndex >= 4) {
                    var tableau = game.tableaus[tappedCardView.stackIndex-4];
                    for (var i=tableau.length-cardCount+1; i<tableau.length; i++) {
                        var card = tableau[i];
                        currentDraggedAdditionalCardViews.push(card.cardView);
                    }
                    currentDraggedAdditionalCardViewsVerticalOffset = parseInt(currentDraggedAdditionalCardViews[0].style.top, 10) - parseInt(tappedCardView.style.top,10);
                }

                for (var i=currentDraggedAdditionalCardViews.length-1; i>=0; i--) {
                    var additionalCardView = currentDraggedAdditionalCardViews[i];
                    raiseCard(additionalCardView);
                    additionalCardView.style.transition = "none";
                    additionalCardView.style.zIndex = 54 + i;
                }
                raiseCard(tappedCardView);
                currentDraggedCardView = tappedCardView;
                currentDraggedCardView.style.transition = "none";
                currentDraggedCardView.style.zIndex = 53;

                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
                currentDraggedCardView.startTime = Date.now();
                currentDraggedCardView.startPosition = [e.clientX, e.clientY];

                //
                // Find all the available moves in order of precedence
                //
                
                // Nonempty Tableaus
                for (var i=0; i<7; i++) {
                    if (i!=currentDraggedCardView.stackIndex-4) {
                        var tableau = game.tableaus[i];
                        if (tableau.length>0) {
                            var lastCard = tableau[tableau.length-1];
                            if (lastCard.isRed != currentDraggedCardView.card.isRed && lastCard.number == currentDraggedCardView.card.number+1) {
                                var move = {
                                    moveCard: currentDraggedCardView.card,
                                    startIndex: currentDraggedCardView.stackIndex,
                                    endIndex: i+4,
                                    cardCount: cardCount,
                                    drawCount: 0,
                                    endPosition: [parseInt(lastCard.cardView.style.left), parseInt(lastCard.cardView.style.top)+tableauStackVerticalOffset],
                                    deckIndex: game.deckIndex,
                                    premoveDeckFlipCount: currentDraggedCardView.card.premoveDeckFlipCount,
                                    premoveDrawCount: game.drawCount
                                    
                                }
                                availableMoves.push(move);
                            }
                        }
                    }
                }

                // Empty Tableaus for kings
                if (currentDraggedCardView.card.number == 13) {
                    for (var i=0; i<7; i++) {
                        if (i != currentDraggedCardView.stackIndex-4) {
                            var tableau = game.tableaus[i];
                            if (tableau.length==0) {
                                var move = {
                                    moveCard: currentDraggedCardView.card,
                                    startIndex: currentDraggedCardView.stackIndex,
                                    endIndex: i+4,
                                    cardCount: cardCount,
                                    drawCount: 0,
                                    endPosition: [parseInt(tableauBases[i].style.left), parseInt(tableauBases[i].style.top)],
                                    deckIndex: game.deckIndex,
                                    premoveDeckFlipCount: currentDraggedCardView.card.premoveDeckFlipCount,
                                    premoveDrawCount: game.drawCount
                                }
                                availableMoves.push(move);
                            }
                        }
                    }
                }

                // Foundations
                if (cardCount==1) {
                    var foundation = game.foundations[currentDraggedCardView.card.suitInt];
                    if (foundation.length == currentDraggedCardView.card.number-1) {
                        var move = {
                            moveCard: currentDraggedCardView.card,
                            startIndex: currentDraggedCardView.stackIndex,
                            endIndex: currentDraggedCardView.card.suitInt,
                            cardCount: cardCount,
                            drawCount: 0,
                            endPosition: [parseInt(foundationBases[currentDraggedCardView.card.suitInt].style.left), parseInt(foundationBases[currentDraggedCardView.card.suitInt].style.top)],
                            deckIndex: game.deckIndex,
                            premoveDeckFlipCount: currentDraggedCardView.card.premoveDeckFlipCount,
                            premoveDrawCount: game.drawCount
                        }
                        
                        if (game.CanAutoPlay(currentDraggedCardView.card)) {
                            availableMoves.splice(0, 0, move);
                        } else {
                            availableMoves.push(move);
                        }
                    }
                }
            }
        }
    }

    function elementDrag(e) {
        e = e || window.event;
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        var updateTop = (currentDraggedCardView.offsetTop - pos2);
        var updateLeft = (currentDraggedCardView.offsetLeft - pos1);
        currentDraggedCardView.style.top = updateTop  + "px";
        currentDraggedCardView.style.left = updateLeft + "px";
        for (var i=0; i<currentDraggedAdditionalCardViews.length; i++) {
            var cardView = currentDraggedAdditionalCardViews[i];
            cardView.style.top = (updateTop + currentDraggedAdditionalCardViewsVerticalOffset*(i+1)) + "px";
            cardView.style.left = updateLeft + "px";
        }
    }

    function closeDragElement() {
        // stop moving when mouse released
        cardTouchFinished();
        document.onmouseup = null;
        document.onmousemove = null;
    }

    function cardTouchFinished() {    
        // Check for tap
        var distX = pos3 - currentDraggedCardView.startPosition[0];
        var distY = pos4 - currentDraggedCardView.startPosition[1];
        var distance = Math.sqrt(distX * distX + distY * distY);
        var elapsed = Date.now() - currentDraggedCardView.startTime;
        var tapped = elapsed < 500 && distance < 10;

        if (tapped) {
            game.GenerateGameStateHash();
            var gameSimulatorResult = gameHashToSimulationResults.get(game.gameStateHash);
            if (gameSimulatorResult && gameSimulatorResult.solutionMoves.length>0 && gameSimulatorResult.solutionMoves[0].moveCard.id == currentDraggedCardView.card.id) {
                var winningMove;
                for (var i=0; i<gameSimulatorResult.solutionMoves.length; i++) {
                    winningMove = gameSimulatorResult.solutionMoves[i];
                    if (winningMove.drawCount == 0) {
                        break;
                    }
                }
                for (var i=0; i<availableMoves.length; i++) {
                    var move = availableMoves[i];
                    if (move.moveCard.id == winningMove.moveCard.id &&
                        move.endIndex == winningMove.endIndex &&
                        move.cardCount == winningMove.cardCount) 
                        {
                        if (move.startIndex<4) {
                            if (GetSetting('setting_thoughtful')) {
                                for (var k=0; k<move.premoveDeckFlipCount; k++) {
                                    var drawMove = {
                                        startIndex: 0,
                                        endIndex: 0,
                                        cardCount: 0,
                                        drawCount: move.premoveDrawCount,
                                        deckIndex: 0,
                                        moveExposedStackCard: false,
                                        exposedCard: null,
                                        moveResetsDeck: false,
                                        premoveDeckFlipCount: move.premoveDeckFlipCount-k,
                                        premoveDrawCount: move.premoveDrawCount
                                    }
                                    game.ApplyMove(drawMove);
                                }
                                move.startIndex = -1;
                                move.premoveDeckFlipCount = 0;
                                move.deckIndex = game.deckIndex;
                            }
                        }
    
                        forwardMoves = [];
                        ApplyMoveToGame(move);
                        AutoPlayMoves();
                        if (game.isGameOver()) {
                            OnGameOver();
                        } else {
                            SearchForGameHintsAndDeadEnds();
                        }
                    }
                }
            } else {
                if (availableMoves.length>0) {
                    var move = availableMoves[0];
                    if (move.startIndex<4) {
                        if (GetSetting('setting_thoughtful')) {
                            for (var k=0; k<move.premoveDeckFlipCount; k++) {
                                var drawMove = {
                                    startIndex: 0,
                                    endIndex: 0,
                                    cardCount: 0,
                                    drawCount: move.premoveDrawCount,
                                    deckIndex: 0,
                                    moveExposedStackCard: false,
                                    exposedCard: null,
                                    moveResetsDeck: false,
                                    premoveDeckFlipCount: move.premoveDeckFlipCount-k,
                                    premoveDrawCount: move.premoveDrawCount
                                }
                                game.ApplyMove(drawMove);
                            }
                            move.startIndex = -1;
                            move.premoveDeckFlipCount = 0;
                            move.deckIndex = game.deckIndex;
                        }
                    }

                    forwardMoves = [];
                    ApplyMoveToGame(move);
                    AutoPlayMoves();
                    if (game.isGameOver()) {
                        OnGameOver();
                    } else {
                        SearchForGameHintsAndDeadEnds();
                    }
                } else {
                    PositionAllCardViews(false, 300);
                }
            }
        } else {
            if (availableMoves.length>0) {
                var minDistance = Number.MAX_VALUE;
                var closestMove = null;
                var draggedCardLeft = parseInt(currentDraggedCardView.style.left);
                var draggedCardTop = parseInt(currentDraggedCardView.style.top);
                for (var i=0; i<availableMoves.length; i++) {
                    var move = availableMoves[i];
                    var distanceX = draggedCardLeft - move.endPosition[0];
                    var distanceY = draggedCardTop - move.endPosition[1];
                    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestMove = move;
                    }
                }
                
                if (minDistance < cardLoweredWidth) {
                    if (GetSetting('setting_thoughtful')) {
                        if (closestMove.startIndex < 0) {
                            for (var k=0; k<closestMove.premoveDeckFlipCount; k++) {
                                var drawMove = {
                                    startIndex: 0,
                                    endIndex: 0,
                                    cardCount: 0,
                                    drawCount: move.premoveDrawCount,
                                    deckIndex: 0,
                                    moveExposedStackCard: false,
                                    exposedCard: null,
                                    moveResetsDeck: false,
                                    premoveDeckFlipCount: move.premoveDeckFlipCount-k,
                                    premoveDrawCount: move.premoveDrawCount
                                }
                                game.ApplyMove(drawMove);
                            }
                            closestMove.startIndex = -1;
                            closestMove.premoveDeckFlipCount = 0;
                            closestMove.deckIndex = game.deckIndex;
                        }
                    }
                    cardsMoved =true;
                    forwardMoves = [];
                    ApplyMoveToGame(closestMove);
                    AutoPlayMoves();
                    if (game.isGameOver()) {
                        OnGameOver();
                    } else {
                        SearchForGameHintsAndDeadEnds();
                    }
                } else {
                    PositionAllCardViews(false, 300);
                }
            } else {
                PositionAllCardViews(false, 300);
            }
        }
    }

    function cardDeckTouched() {
        HideIsThinking();
        var move = {
            startIndex: 0,
            endIndex: 0,
            cardCount: 0,
            drawCount: game.drawCount,
            deckIndex: 0,
            moveExposedStackCard: false,
            exposedCard: null,
            moveResetsDeck: false,
            premoveDeckFlipCount: 0,
            premoveDrawCount: 0
        }
        forwardMoves = [];
        ApplyMoveToGame(move);
        HideRedoButton();

        AutoPlayMoves();
        if (!game.isGameOver()) {
            SearchForGameHintsAndDeadEnds();
        }
    }

    function BumpCard(cardView) {
        var raiseContainer = cardView.firstChild;
        raiseContainer.addEventListener("animationend", function() {
            raiseContainer.classList.remove('bump');
        });
        raiseContainer.classList.add('bump');
    }

    function BlowUpCard(cardView) {
        var blowUpImage = document.createElement('div');
        blowUpImage.className = 'cardBlowUpImage';
        blowUpImage.style.backgroundImage = cardView.card.image;
        blowUpImage.style.width = cardLoweredWidth + "px";
        blowUpImage.style.height = cardLoweredHeight + "px";
        blowUpImage.addEventListener("animationend", function() {
            blowUpImage.parentElement.removeChild(blowUpImage);
        });
        cardView.appendChild(blowUpImage);
    }

    function GetFoundationBaseLocation(suit) {
        switch(suit) {
            case 'H':
                return [foundationsLeft, foundationsTop];
            case 'C':
                return [foundationsLeft + foundationsSpacing + cardLoweredWidth, foundationsTop];
            case 'D':
                return [foundationsLeft + 2*foundationsSpacing + 2*cardLoweredWidth, foundationsTop];
            case 'S':
                return [foundationsLeft + 3*foundationsSpacing + 3*cardLoweredWidth, foundationsTop];
        }
    }

    function GetTableauBaseLocation(index) {
        return [tableausLeft + index*(cardLoweredWidth+tableausSpacing), tableausTop];
    }

    function GetDeckLocation() {
        return [deckLeft, deckTop];
    }

    this.OnChangedThoughtful = function() {
        var isThoughtful = GetSetting('setting_thoughtful');
        var cardBackURI = "url('images/card_back_" + GetSetting('setting_card_color') + ".jpg')";
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (isThoughtful) {
                card.cardView.getElementsByClassName('cardBack')[0].style.backgroundImage = card.image;
                card.cardView.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0.3;
            } else {
                card.cardView.getElementsByClassName('cardBack')[0].style.backgroundImage = cardBackURI;
                card.cardView.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0;
                
            }
        }
    }

    this.UpdateShowGameNumber = function() {
        var gameNumberContainer = document.getElementById('game_number_container');
        var showGameNumber = GetSetting('setting_game_number');
        if (showGameNumber) {
            gameNumberContainer.style.visibility = "visible";
        } else {
            gameNumberContainer.style.visibility = "hidden";
        }
    }

    this.UpdateShowClock = function() {
        
        var clockContainer = document.getElementById('navigation_bar_clock_container');
        var clockOn = GetSetting('setting_game_clock');
        if (clockOn) {
            clockContainer.style.display = "inline-block";
        } else {
            clockContainer.style.display = "none";
        }
    }

    this.UpdateShowHintButton = function() {
        
        var hintButton = document.getElementById('hint_button');
        var hintsOn = GetSetting('setting_hints');
        if (hintsOn) {
            hintButton.style.display = "inline-block";
        } else {
            hintButton.style.display = "none";
        }
    }

    function ShowHintButton(delay) {
        var hintButton = document.getElementById('hint_button');
        hintButton.style.transition = "0.5s linear";
        hintButton.style.opacity = 1;
        hintButton.style.pointerEvents = 'auto';
    }

    function HideHintButton() {
        var hintButton = document.getElementById('hint_button');
        hintButton.style.opacity = 0;
        hintButton.style.pointerEvents = 'none';
    }

    this.OnHintButtonClick = function () 
    {    
        if (game.isInitialized && !game.isGameOver()) {
            game.hintsUsed++;
            if (game.isAllCardsFaceUp()){
                // Game is over so no need to search for a hint
                return;
            }

            game.GenerateGameStateHash();
            var gameSimulatorResult = gameHashToSimulationResults.get(game.gameStateHash);
            if (gameSimulatorResult) {
                if (gameSimulatorResult.isDeadEnd) {
                    ShowDeadEndWarningView();
                    return;
                }
                if (gameSimulatorResult.solutionMoves.length>0) {
                    var hintMove = gameSimulatorResult.solutionMoves[0];
                    AnimateHint(hintMove);
                } else {
                    ShowNoOptimalMoveFound();
                }
            } else {
                // The simulation is still running
                ShowIsThinking();
            }
        }
    }

    this.UpdateShowUndoButton = function() {
        if (game == null || !game.isInitialized) {
            return;
        }

        var undoOn = GetSetting('setting_undo');
        if (undoOn && game.moves.length>0) {
            ShowUndoButton();
            if (forwardMoves.length>0) {
                ShowRedoButton();
            }
        } else {
            HideUndoButton();
            HideRedoButton();
        }
    }

    function ShowUndoButton() {
        if (GetSetting('setting_undo')) {
            var button = document.getElementById('undo_button');
            button.style.pointerEvents = "auto";
            button.style.visibility = "visible";
            button.style.opacity = 1;
        }
    }

    function HideUndoButton() {
        var button = document.getElementById('undo_button');
        button.style.pointerEvents = "none";
        button.style.transition = "0.5s linear";
        button.style.opacity = 0;
        setTimeout(function() {
            var button = document.getElementById('undo_button');
            button.style.visibility = "hidden";
        }, 500);
    }

    this.OnUndoButtonClick = function () 
    {    
        if (game == null || !game.isInitialized || game.moves.length==0) {
            return;
        }

        game.undosUsed++;
        HideDeadEndWarningView();
        HideNoOptimalMoveFound();
        HideIsThinking();
        
        UndoLastMoveToGame();

    }

    function ShowRedoButton() {
        if (GetSetting('setting_undo')) {
            var button = document.getElementById('redo_button');
            button.style.pointerEvents = "auto";
            button.style.visibility = "visible";
            button.style.opacity = 1;
        }
    }

    function HideRedoButton() {
        var button = document.getElementById('redo_button');
        button.style.pointerEvents = "none";
        button.style.transition = "0.5s linear";
        button.style.opacity = 0;
        setTimeout(function() {
            var button = document.getElementById('redo_button');
            button.style.visibility = "hidden";
        }, 500);
    }

    this.OnRedoButtonClick = function () 
    {    
        if (game == null || !game.isInitialized || forwardMoves.length == 0) {
            return;
        }

        var move = forwardMoves[forwardMoves.length-1];
        forwardMoves.splice(forwardMoves.length-1, 1);
        if (GetSetting('setting_thoughtful')) {
            while (move.drawCount > 0) {
                game.ApplyMove(move);
                if (forwardMoves.length>0) {
                    move = forwardMoves[forwardMoves.length-1];
                    forwardMoves.splice(forwardMoves.length-1, 1);
                } else {
                    break;
                }
            }
        }

        ApplyMoveToGame(move);
        SearchForGameHintsAndDeadEnds();
    }

    var randomSeed;
    function random() {
        randomSeed = (214013*randomSeed + 2531011) & 2147483647;
        return randomSeed >> 16;
    }

    this.InitializeGame = function(gameNumber, difficulty) {
        // Game properties
        this.drawCount = GetSetting('setting_draw_one_card') ? 1 : 3;
        this.foundations = [ [], [], [], [] ];
        this.tableaus = [ [], [], [], [], [], [], [] ];
        this.deck = [];
        this.moves = [];
        this.gameNumber = gameNumber;
        this.gameDifficulty = difficulty;
        this.hintsUsed = 0;
        this.undosUsed = 0;
        this.elapsedSeconds = 0;

        var gameSeed = allGameSeeds[gameNumber-1];
        var shuffledDeck = [];
        for (var i=0; i<cards.length; i++) {
            shuffledDeck.push(cards[i]);
        }
        randomSeed = gameSeed;
        for (var i=shuffledDeck.length-1; i>0; i--) {
            var r = random() % (i + 1);
            var card = shuffledDeck[r];
            shuffledDeck[r] = shuffledDeck[i];
            shuffledDeck[i] = card;
        }
        var curDeckIndex = shuffledDeck.length-1;
        for (var i=0; i<7; i++) {
            for (var j=0; j<=i; j++) {
                var card = shuffledDeck[curDeckIndex];
                curDeckIndex--;
                card.isFaceDown = j!=i;
                card.tableauIndex = i+4;
                this.tableaus[i].push(card);
            }
        }
        while (curDeckIndex >= 0) {
            var card = shuffledDeck[curDeckIndex];
            curDeckIndex--;
            card.isFaceDown = false;
            card.tableauIndex = -1;
            this.deck.push(card);
        }
        this.deckIndex = -1;

        this.WireUpAllSolverCards();

        this.isInitialized = true;
    }

    this.WireUpAllSolverCards = function() {
        for (var i=0; i<this.foundations.length; i++){
            var foundation = this.foundations[i];
            for (var j=0; j<foundation.length; j++) {
                var card = foundation[j];
                card.tableauIndex = i;
                this.WireUpCard(card);
            }
        }
        for (var i=0; i<this.tableaus.length; i++) {
            var tableau = this.tableaus[i];
            for (var j=0; j<tableau.length; j++) {
                var card = tableau[j];
                card.tableauIndex = i+4;
                this.WireUpCard(card);
            } 
        }
        for (var i=0; i<this.deck.length; i++){
            var card = this.deck[i];
            card.tableauIndex = -1;
            this.WireUpCard(card);
        }
    }

    this.WireUpAllMoveCards = function(solutionMoves) {
        for (var i=0; i<solutionMoves.length; i++) {
            var solutionMove = solutionMoves[i];
            solutionMove.moveCard = cards.find(obj => { return obj.id == solutionMove.moveCard.id; });
        }
    }

    this.WireUpCard = function(card) {
        for (var i=0; i<this.foundations.length; i++) {
            var foundation = this.foundations[i];
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
        for (var i=0; i<this.tableaus.length; i++) {
            var tableau = this.tableaus[i];
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
        for (var i=0; i<this.deck.length; i++) {
            var otherCard = this.deck[i];
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

    this.StartAGame = function (gameNumber, difficulty, isRestart=false) {

        this.InitializeGame(gameNumber, difficulty);        

        // Clean up all cards and messages
        for (var i = 0; i < cards.length; i++) {
            var el = cards[i].cardView;
            flipDownCard(el, false);
            with (el.style) {
                transition = "none";
                transform = "none";
                visibility = "hidden";
            }
        }
        
        var gameNumberContainer = document.getElementById("game_number_container");
        gameNumberContainer.style.transition = "none";
        gameNumberContainer.style.opacity = 0;
        var gameNumberDifficulty = document.getElementById('game_number_difficulty');
        gameNumberDifficulty.innerText = difficulty;
        document.getElementById("game_number").innerText = gameNumber;
        setTimeout(function() {
            gameNumberContainer.style.transition = "all 0.5s linear 2s";
            gameNumberContainer.style.opacity = 1;    
        }, 50);
        game.OnShowStartingGameNumber(gameNumber, difficulty, isRestart);
        
        PositionAllCardViews(true, 0);
        SearchForGameHintsAndDeadEnds();

        gameClockStartElapsed = 0;
        document.getElementById('navigation_bar_clock').innerText = "0:00";
        setTimeout(game.StartGameClock, 5000);

        document.getElementById('navigation_bar_moves').innerText = "0";

        if (!isRestart) {
            SetStatistic('stat_games_started', GetStatistic('stat_games_started')+1);

            if (difficulty == 'Easy') {
                IncrementEasyGameIndex();
            } else if (difficulty == 'Difficult') {
                IncrementDifficultGameIndex();
            }
        }
    }

    this.OnShowStartingGameNumber = function(gameNumber, difficulty, isRestart=false) {

        document.getElementById('StartingGameNumberViewText2').innerText = gameNumber;
        var title = document.getElementById('StartingGameNumberViewText');
        if (isRestart) {
            title.innerText = "Restarting game";
        } else {
            title.innerText = "Starting game"
        }
        var difficultyLabel = document.getElementById('StartingGameNumberViewText3')
        if (difficulty.length>0) {
            difficultyLabel.innerText = difficulty;
            difficultyLabel.style.visibility = "visible";
            title.style.marginTop = "10px";
        } else {
            difficultyLabel.style.visibility = "hidden";
            title.style.marginTop = "22px";
        }

        var mainCanvas = document.getElementById('main_canvas');
        var canvasHeight = mainCanvas.offsetHeight;
        var startingGameNumberView = document.getElementById('StartingGameNumberView');
        with (startingGameNumberView.style) {
            transition = "none";
            transform = "translate(-50%, " + -canvasHeight + "px)";
            visibility = "visible";
        }
        setTimeout(function() {
            with (startingGameNumberView.style) {
                transition = "all 1s cubic-bezier(.47,1.64,.41,.8)";
                transform = "translate(-50%, -50%)";
            }
            setTimeout(function() {
                with (startingGameNumberView.style) {
                    transition = "all 0.7s ease-in";
                    transform = "translate(-50%, " + canvasHeight + "px)";
                }
                setTimeout(function() {
                    with (startingGameNumberView.style) {
                        transition = "none";
                        visibility = "hidden";
                    }
                }, 1500);
            }, 3000);
        }, 50);
    }

    var intervalID = 0;
    var gameClockIsRunning = false;
    var gameClockStartElapsed = 0;
    
    this.StartGameClock = function() {
        if (gameClockIsRunning || isMainMenuVisible) {
            return;
        }

        gameClockStartElapsed = game.elapsedSeconds;
        gameClockIsRunning = true;
        game.elapsedStartDate = new Date();
        intervalID = setInterval(timerUpdate, 333);
    }

    function timerUpdate() {
        var elapsedSinceStart = gameClockStartElapsed + (Date.now() - game.elapsedStartDate)/1000;
        var totalSeconds = Math.ceil(elapsedSinceStart);
        var minutes = Math.floor(totalSeconds/60.0);
        var seconds = totalSeconds - minutes*60;
        game.elapsedSeconds = totalSeconds;
        document.getElementById('navigation_bar_clock').innerText = minutes + ":" + seconds.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
          });
    }

    this.StopGameClock = function() {
        if (gameClockIsRunning) {
            gameClockIsRunning = false;
            clearInterval(intervalID);
            timerUpdate();
        }
    }

    window.onfocus = function() {
        if (game != null && !game.isGameOver() && !isMainMenuVisible) {
            game.StartGameClock();
        }
    }

    window.onblur = function() {
        game.StopGameClock();
    }

    function PositionAllCardViews(animateDeal, animateDuration) {

        if (game == null || !game.isInitialized) {
            return;
        }

        var isDeckOnTop = GetSetting('setting_draw_pile_on_top');
        var isThoughtful = GetSetting('setting_thoughtful');
        var bottomLimit = isDeckOnTop ? document.getElementById('main_canvas').offsetHeight - document.getElementById('navigation_bar').offsetHeight - 0.2*cardLoweredHeight : isThoughtful ? deckTop - 1.2*cardLoweredHeight : deckTop - 0.2*cardLoweredHeight;
      
        // Make stack bases appear
        for (var i=0; i<foundationBases.length; i++) {
            var foundationBase = foundationBases[i];
            foundationBase.style.transition = "0.5s linear";
            foundationBase.style.opacity = 1;
        }
        for (var i=0; i<tableauBases.length; i++) {
            var tableauBase = tableauBases[i];
            tableauBase.style.transition = "0.5s linear";
            tableauBase.style.opacity = 1;
        }
        var deckBase = document.getElementById('deck_base');
        if (isThoughtful) {
            deckBase.style.transition = "0.5s linear";
            deckBase.style.opacity = 0;
        } else {
            deckBase.style.transition = "0.5s linear 5s";
            deckBase.style.opacity = 1;
        }

        // Clear any game over animations
        for (var i=0; i<cards.length; i++) {
            var card = cards[i];
            card.cardView.style.animation = "";
        }

        var dealStartLeft = (canvasWidth - cardLoweredWidth)*0.5;
        var dealStartTop = canvasHeight;

        // Position foundation cards
        var curLeft = foundationsLeft;
        var curTop = foundationsTop;
        for (var i=0; i<4; i++) {
            var foundation = game.foundations[i];
            for (var j=0; j<foundation.length; j++) {
                var card = foundation[j];
                card.cardView.isClickable = false;
                card.cardView.stackIndex = card.suitInt;
                lowerCard(card.cardView);
                card.cardView.style.zIndex = j+1;
                if (animateDuration > 0) {
                    flipUpCard(card.cardView, true);
                    with (card.cardView.style) {
                        transition = animateDuration + "ms ease-out";
                        animationDelay = "";
                        left = curLeft + "px";
                        top = curTop + "px";
                        visibility = "visible";
                    }
                } else {
                    flipUpCard(card.cardView, false);
                    with (card.cardView.style) {
                        transition = "none";
                        animationDelay = "";
                        left = curLeft + "px";
                        top = curTop + "px";
                        visibility = "visible";
                    }
                }
            }
            curLeft += cardLoweredWidth + foundationsSpacing;
        }

        // Position tableau cards
        curLeft = tableausLeft;
        for (var i=0; i<7; i++) {
            var tableau = game.tableaus[i];
            
            var compressionScalar = 1;
            var curTableauStackHeight = cardLoweredHeight;
            for (var k=1; k<tableau.length; k++) {
                var card = tableau[k-1];
                curTableauStackHeight += card.isFaceDown ? tableauStackFaceDownVerticalOffset : tableauStackVerticalOffset;
            }
            if (tableausTop + curTableauStackHeight > bottomLimit) {
                compressionScalar = (bottomLimit - tableausTop - cardLoweredHeight) / (curTableauStackHeight - cardLoweredHeight);
            }

            curTop = tableausTop;
            for (var j=0; j<tableau.length; j++) {
                var card = tableau[j];
                card.isFaceDown ? flipDownCard(card.cardView, animateDuration>0) : flipUpCard(card.cardView, animateDuration>0);
                card.cardView.stackIndex = i+4;
                card.cardView.stackDepth = tableau.length - j - 1;
                card.cardView.isClickable = !card.isFaceDown;
                lowerCard(card.cardView);
                card.cardView.style.zIndex = j+1;
                if (animateDeal) {
                    card.cardView.animationEndLeft = curLeft;
                    card.cardView.animationEndTop = curTop;
                    with (card.cardView.style) {
                        transition = "none";
                        animationDelay = "";
                        left = dealStartLeft + "px";
                        top = dealStartTop + "px";
                        visibility = "visible";
                    }
                } else {
                    if (animateDuration>0) {
                        with (card.cardView.style) {
                            transition = animateDuration + "ms ease-out";
                            animationDelay = "";
                            left = curLeft + "px";
                            top = curTop + "px";
                            visibility = "visible";
                        }
                    } else {
                        with (card.cardView.style) {
                            transition = "none";
                            animationDelay = "";
                            left = curLeft + "px";
                            top = curTop + "px";
                            visibility = "visible";
                        }
                    }
                }
                curTop += card.isFaceDown ? tableauStackFaceDownVerticalOffset*compressionScalar : tableauStackVerticalOffset*compressionScalar;
            }
            curLeft += cardLoweredWidth + tableausSpacing;
        }

        // Position the deck cards
        if (isThoughtful) 
        {
            var deckTouchRegion = document.getElementById('deck_touch_region');
            deckTouchRegion.style.visibility = "hidden";
            
            var avaialableDeckStackCards = game.GetAvailableDeckMoveCards();
            var verticalSpacing = game.drawCount == 1 ? cardLoweredHeight*0.5 : cardLoweredHeight*0.4;
            var left = 2;
            var right = canvasWidth - left - cardLoweredWidth;
            var stackWidth = right - left;
            var horizontalSpacing = game.deck.length > 1 ? stackWidth / (game.deck.length-1) : 0;
            if (horizontalSpacing > cardLoweredWidth) {
                horizontalSpacing = cardLoweredWidth;
                verticalSpacing = 0;
                stackWidth = game.deck.length * horizontalSpacing;
                left = (canvasWidth - stackWidth)*0.5;
            } 
            var curVerticalOffset = verticalSpacing*2;
            var horizontalOffset = left;
            for (var i=0; i<game.deck.length; i++) {
                var card = game.deck[i];
                lowerCard(card.cardView);
                card.cardView.stackDepth = 0;
                card.cardView.stackIndex = -1;
                if (avaialableDeckStackCards.includes(card)) {
                    card.cardView.isClickable = true;
                    flipUpCard(card.cardView, false)
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop - curVerticalOffset;
                    curVerticalOffset -= verticalSpacing;
                    if (curVerticalOffset < -1) {
                        curVerticalOffset = verticalSpacing*2;
                    }
                } else {
                    card.cardView.isClickable = false;
                    flipDownCard(card.cardView, false);
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop;
                    curVerticalOffset = verticalSpacing*2;
                }
                card.cardView.style.zIndex = i+1;
                if (animateDeal) {
                    with (card.cardView.style) {
                        transition = "none";
                        animationDelay = "";
                        left = dealStartLeft + "px";
                        top = dealStartTop + "px";
                        visibility = "visible";
                    }
                } else {
                    if (animateDuration > 0) {
                        with (card.cardView.style) {
                            transition = animateDuration + "ms ease-out";
                            animationDelay = "";
                            left = card.cardView.animationEndLeft + "px";
                            top = card.cardView.animationEndTop + "px";
                            visibility = "visible";
                        }
                    } else {
                        with (card.cardView.style) {
                            transition = "none";
                            animationDelay = "";
                            left = card.cardView.animationEndLeft + "px";
                            top = card.cardView.animationEndTop + "px";
                            visibility = "visible";
                        }
                    }
                }
                horizontalOffset += horizontalSpacing;
            }
        } else {

            var deckTouchRegion = document.getElementById('deck_touch_region');
            with (deckTouchRegion.style) {
                transition = "none";
                left = deckLeft + "px";
                top = deckTop + "px";
                visibility = "visible";
                zIndex = 999;
            }
            deckTouchRegion.style.visibility = "visible";

            var curZIndex = 26 - (game.deck.length-1 - game.deckIndex);;
            var curLeftOffset = (game.deck.length-1 - game.deckIndex-1)*deckStackHorizontalSpacing;
            for (var i=game.deck.length-1; i>game.deckIndex; i--) {
                var card = game.deck[i];
                card.cardView.isClickable = false;
                flipDownCard(card.cardView, false);
                lowerCard(card.cardView);
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
                card.cardView.style.zIndex = curZIndex;
                if (animateDeal) {
                    card.cardView.animationEndLeft = deckLeft - curLeftOffset;
                    card.cardView.animationEndTop = deckTop;
                    with (card.cardView.style) {
                        transition = "none";
                        animationDelay = "";
                        left = dealStartLeft + "px";
                        top = dealStartTop + "px";
                        visibility = "visible";
                    }
                } else {
                    if (animateDuration > 0) {
                        with (card.cardView.style) {
                            transition = animateDuration + "ms ease-out";
                            animationDelay = "";
                            left = deckLeft - curLeftOffset + "px";
                            top = deckTop + "px";
                            visibility = "visible";
                        }
                    } else {
                        with (card.cardView.style) {
                            transition = "none";
                            animationDelay = "";
                            left = deckLeft - curLeftOffset + "px";
                            top = deckTop + "px";
                            visibility = "visible";
                        }
                    }
                }
                curZIndex++;
                curLeftOffset -= deckStackHorizontalSpacing;
            }

            for (var i=0; i<=game.deckIndex; i++) {
                var card = game.deck[i];
                card.cardView.isClickable = i === game.deckIndex;
                var offset = 0;
                if (i == game.deckIndex-1) {
                    if (i==0) {
                        offset = 0;
                    } else {
                        offset = flippedCardsOverlapSpacing;
                    }
                } else if (i == game.deckIndex) {
                    if (i==0) {
                        offset = 0;
                    } else if (i==1) {
                        offset = flippedCardsOverlapSpacing;
                    } else {
                        offset = flippedCardsOverlapSpacing*2;
                    }
                }
                curLeft = flippedCardsLeft + offset;
                flipUpCard(card.cardView, false);
                lowerCard(card.cardView);
                var zOffset = i==game.deckIndex ? 2 : 0;
                card.cardView.style.zIndex = 24 - game.deckIndex + i + zOffset;
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
                if (animateDuration > 0) {
                    with (card.cardView.style) {
                        transition = animateDuration + "ms ease-out";
                        animationDelay = "";
                        left = curLeft + "px";
                        top = deckTop + "px";
                        visibility = "visible";
                    }
                } else {
                    with (card.cardView.style) {
                        transition = "none";
                        animationDelay = "";
                        left = curLeft + "px";
                        top = deckTop + "px";
                        visibility = "visible";
                    }
                }
            }
        }

        game.UpdateShowClock();
        game.UpdateShowHintButton();
        game.UpdateShowGameNumber();

        setTimeout(function () {
            document.getElementById('navigation_bar_clock_container').style.opacity = 1;
            document.getElementById('navigation_bar_moves_container').style.opacity = 1;
            document.getElementById('hint_button').style.transition = "all 1s linear 0s";
            document.getElementById('hint_button').style.opacity = 1;
            document.getElementById('hint_button').style.pointerEvents = 'auto';
        }, 100);
        

        if (animateDeal) {
            setTimeout(function () {
                game.AnimateDealCards();
            }, 50);
        }
    }

    function PositionTableauCards() 
    {
        // Position foundation cards
        var curLeft = foundationsLeft;
        var curTop = foundationsTop;
        for (var i=0; i<4; i++) {
            var foundation = game.foundations[i];
            for (var j=0; j<foundation.length; j++) {
                var card = foundation[j];
                card.cardView.isClickable = false;
                card.cardView.stackIndex = card.suitInt;
                card.cardView.style.zIndex = j+1;
                lowerCard(card.cardView);
                flipUpCard(card.cardView, true);
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = curLeft + "px";
                    top = curTop + "px";
                    visibility = "visible";
                }
            }
            curLeft += cardLoweredWidth + foundationsSpacing;
        }

        // Position tableau cards
        var isDeckOnTop = GetSetting('setting_draw_pile_on_top');
        var isThoughtful = GetSetting('setting_thoughtful');
        var bottomLimit = isDeckOnTop ? document.getElementById('main_canvas').offsetHeight - document.getElementById('navigation_bar').offsetHeight - 0.2*cardLoweredHeight : isThoughtful ? deckTop - 1.2*cardLoweredHeight : deckTop - 0.2*cardLoweredHeight;
        curLeft = tableausLeft;
        for (var i=0; i<7; i++) {
            var tableau = game.tableaus[i];
            
            var compressionScalar = 1;
            var curTableauStackHeight = cardLoweredHeight;
            for (var k=1; k<tableau.length; k++) {
                var card = tableau[k-1];
                curTableauStackHeight += card.isFaceDown ? tableauStackFaceDownVerticalOffset : tableauStackVerticalOffset;
            }
            if (tableausTop + curTableauStackHeight > bottomLimit) {
                compressionScalar = (bottomLimit - tableausTop - cardLoweredHeight) / (curTableauStackHeight - cardLoweredHeight);
            }

            curTop = tableausTop;
            for (var j=0; j<tableau.length; j++) {
                var card = tableau[j];
                card.isFaceDown ? flipDownCard(card.cardView, true) : flipUpCard(card.cardView, true);
                card.cardView.stackIndex = i+4;
                card.cardView.stackDepth = tableau.length - j - 1;
                card.cardView.isClickable = !card.isFaceDown;
                lowerCard(card.cardView);
                card.cardView.style.zIndex = j+1;
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = curLeft + "px";
                    top = curTop + "px";
                    visibility = "visible";
                }
                
                curTop += card.isFaceDown ? tableauStackFaceDownVerticalOffset*compressionScalar : tableauStackVerticalOffset*compressionScalar;
            }
            curLeft += cardLoweredWidth + tableausSpacing;
        }
    }

    function PositionDeckCards() 
    {
        var isThoughtful = GetSetting('setting_thoughtful');
        if (isThoughtful) 
        {
            var deckTouchRegion = document.getElementById('deck_touch_region');
            deckTouchRegion.style.visibility = "hidden";
            
            var avaialableDeckStackCards = game.GetAvailableDeckMoveCards();
            var verticalSpacing = game.drawCount == 1 ? cardLoweredHeight*0.5 : cardLoweredHeight*0.4;
            var left = 2;
            var right = canvasWidth - left - cardLoweredWidth;
            var stackWidth = right - left;
            var horizontalSpacing = game.deck.length > 1 ? stackWidth / (game.deck.length-1) : 0;
            if (horizontalSpacing > cardLoweredWidth) {
                horizontalSpacing = cardLoweredWidth;
                verticalSpacing = 0;
                stackWidth = game.deck.length * horizontalSpacing;
                left = (canvasWidth - stackWidth)*0.5;
            } 
            var curVerticalOffset = verticalSpacing*2;
            var horizontalOffset = left;
            for (var i=0; i<game.deck.length; i++) {
                var card = game.deck[i];
                lowerCard(card.cardView);
                card.cardView.stackDepth = 0;
                card.cardView.stackIndex = -1;
                if (avaialableDeckStackCards.includes(card)) {
                    card.cardView.isClickable = true;
                    flipUpCard(card.cardView, false)
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop - curVerticalOffset;
                    curVerticalOffset -= verticalSpacing;
                    if (curVerticalOffset < -1) {
                        curVerticalOffset = verticalSpacing*2;
                    }
                } else {
                    card.cardView.isClickable = false;
                    flipDownCard(card.cardView, false);
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop;
                    curVerticalOffset = verticalSpacing*2;
                }
                card.cardView.style.zIndex = i+1;
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = card.cardView.animationEndLeft + "px";
                    top = card.cardView.animationEndTop + "px";
                    visibility = "visible";
                }
                horizontalOffset += horizontalSpacing;
            }
        } else {

            var deckTouchRegion = document.getElementById('deck_touch_region');
            with (deckTouchRegion.style) {
                transition = "none";
                left = deckLeft + "px";
                top = deckTop + "px";
                visibility = "visible";
                zIndex = 999;
            }
            deckTouchRegion.style.visibility = "visible";

            var curZIndex = 26 - (game.deck.length-1 - game.deckIndex);;
            var curLeftOffset = (game.deck.length-1 - game.deckIndex-1)*deckStackHorizontalSpacing;
            for (var i=game.deck.length-1; i>game.deckIndex; i--) {
                var card = game.deck[i];
                card.cardView.isClickable = false;
                flipDownCard(card.cardView, true);
                lowerCard(card.cardView);
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
                card.cardView.style.zIndex = curZIndex;
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = deckLeft - curLeftOffset + "px";
                    top = deckTop + "px";
                    visibility = "visible";
                }
            
                curZIndex++;
                curLeftOffset -= deckStackHorizontalSpacing;
            }

            for (var i=0; i<=game.deckIndex; i++) {
                var card = game.deck[i];
                card.cardView.isClickable = i === game.deckIndex;
                var offset = 0;
                if (i == game.deckIndex-1) {
                    if (i==0) {
                        offset = 0;
                    } else {
                        offset = flippedCardsOverlapSpacing;
                    }
                } else if (i == game.deckIndex) {
                    if (i==0) {
                        offset = 0;
                    } else if (i==1) {
                        offset = flippedCardsOverlapSpacing;
                    } else {
                        offset = flippedCardsOverlapSpacing*2;
                    }
                }
                curLeft = flippedCardsLeft + offset;
                flipUpCard(card.cardView, true);
                lowerCard(card.cardView);
                var zOffset = i==game.deckIndex ? 2 : 0;
                card.cardView.style.zIndex = 24 - game.deckIndex + i + zOffset;
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = curLeft + "px";
                    top = deckTop + "px";
                    visibility = "visible";
                }
            }
        }
    }

    this.AnimateDealCards = function() {
        var curAnimationId = GetStatistic('stat_games_started');
        var totalAnimationsAvailable = 2;
        var animationDelay = 0;
        var isThoughtful = GetSetting("setting_thoughtful");

        switch (curAnimationId%totalAnimationsAvailable) {
            case 0:
            {
                //
                // Cards come in one at a time, tableau by tableau, with a twist upon arrival
                //
                var animationDealSpacing = 70;
                for (var i=0; i<7; i++) {
                    var tableau = game.tableaus[i];
                    for (var j=0; j<tableau.length; j++) {
                        var card = tableau[j];
                        card.cardView.animation = "";
                        card.cardView.style.transition =  "all 0.3s ease-out";
                        card.cardView.style.transitionDelay = animationDelay + 'ms';
                        card.cardView.style.left = card.cardView.animationEndLeft + 'px';
                        card.cardView.style.top = card.cardView.animationEndTop + 'px';
                        setTimeout(TwistCard, animationDelay + 300, card.cardView);
                        animationDelay += animationDealSpacing;
                    }
                }
                animationDealSpacing = 40;
                for (var i=0; i<game.deck.length; i++) {
                    var card = game.deck[i];
                    card.cardView.animation = "";
                    card.cardView.style.transition =  "0.3s ease-out";
                    card.cardView.style.transitionDelay = animationDelay + 'ms';
                    card.cardView.style.left = card.cardView.animationEndLeft + 'px';
                    card.cardView.style.top = card.cardView.animationEndTop + 'px';
                    animationDelay += animationDealSpacing;
                }
            }
            break;

            case 1:
            {
                //
                // Cards are sprayed across the tableaus
                //
                var animationDealSpacing = 70;
                for (var i=0; i<7; i++) {
                    for (var j=0; j<7; j++) {
                        var tableau = game.tableaus[j];
                        if (i<tableau.length) {
                            var card = tableau[i];
                            card.cardView.animation = "";
                            card.cardView.style.transition =  "all 0.3s ease-out";
                            card.cardView.style.transitionDelay = animationDelay + 'ms';
                            card.cardView.style.left = card.cardView.animationEndLeft + 'px';
                            card.cardView.style.top = card.cardView.animationEndTop + 'px';
                            setTimeout(BumpCard, animationDelay + 300, card.cardView);
                            animationDelay += animationDealSpacing;
                        }
                    }
                }
                animationDealSpacing = 40;
                for (var i=0; i<game.deck.length; i++) {
                    var card = game.deck[i];
                    card.cardView.animation = "";
                    card.cardView.style.transition =  "0.3s ease-out";
                    card.cardView.style.transitionDelay = animationDelay + 'ms';
                    card.cardView.style.left = card.cardView.animationEndLeft + 'px';
                    card.cardView.style.top = card.cardView.animationEndTop + 'px';
                    animationDelay += animationDealSpacing;
                }
            }
            break;
        }
    }

    this.GetAvailableDeckMoveCards = function() {
        var availableDeckMoveCards = [];
        if (this.deck.length == 0) {
            return availableDeckMoveCards;
        }

        // If the draw count is 3 then we will need to make two passes
        // through the deck because the available cards might have changed
        var timesThroughTheDeck = 0;
        var deckFlipsCount = 0;
        var currentDeckSearchIndex = this.deckIndex;
        var deckCard;
        if (currentDeckSearchIndex < 0) {
            // We have to flip the deck to start
            deckFlipsCount += 1;
            currentDeckSearchIndex += this.drawCount;
            if (currentDeckSearchIndex >= this.deck.length) {
                currentDeckSearchIndex = this.deck.length-1;
            }
            deckCard = this.deck[currentDeckSearchIndex];
        } else {
            deckCard = this.deck[this.deckIndex];
        }
        var initialDeckSearchIndex = currentDeckSearchIndex;
        while (true) 
        {
            if (availableDeckMoveCards.includes(deckCard)) {
                // Already examined
            } else {
                deckCard.premoveDeckFlipCount = deckFlipsCount;
                availableDeckMoveCards.push(deckCard);
            }
            
            // Step forward as if we drew a card
            if (currentDeckSearchIndex == this.deck.length-1) {
                timesThroughTheDeck++;
                if (timesThroughTheDeck == 2 || this.deck.count <= this.drawCount)
                    break;
                currentDeckSearchIndex = this.drawCount-1;
            } else {
                currentDeckSearchIndex += this.drawCount;
                if (currentDeckSearchIndex >= this.deck.length) {
                    currentDeckSearchIndex = this.deck.length-1;
                }
            }
            
            if (this.drawCount == 1 && currentDeckSearchIndex == initialDeckSearchIndex) {
                break;
            }
            
            deckCard = this.deck[currentDeckSearchIndex];
            deckFlipsCount += 1;
        }

        return availableDeckMoveCards;
    }

    function ApplyMoveToGame(move) 
    {
        game.ApplyMove(move);

        // Position the deck cards
        if (GetSetting('setting_thoughtful')) 
        {
            var avaialableDeckStackCards = game.GetAvailableDeckMoveCards();
            var verticalSpacing = game.drawCount == 1 ? cardLoweredHeight*0.5 : cardLoweredHeight*0.4;
            var left = 2;
            var right = canvasWidth - left - cardLoweredWidth;
            var stackWidth = right - left;
            var horizontalSpacing = game.deck.length > 1 ? stackWidth / (game.deck.length-1) : 0;
            if (horizontalSpacing > cardLoweredWidth) {
                horizontalSpacing = cardLoweredWidth;
                verticalSpacing = 0;
                stackWidth = game.deck.length * horizontalSpacing;
                left = (canvasWidth - stackWidth)*0.5;
            } 
            var curVerticalOffset = verticalSpacing*2;
            var horizontalOffset = left;
            for (var i=0; i<game.deck.length; i++) {
                var card = game.deck[i];
                lowerCard(card.cardView);
                card.cardView.stackDepth = 0;
                card.cardView.stackIndex = -1;
                if (avaialableDeckStackCards.includes(card)) {
                    card.cardView.isClickable = true;
                    flipUpCard(card.cardView, false)
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop - curVerticalOffset;
                    curVerticalOffset -= verticalSpacing;
                    if (curVerticalOffset < -1) {
                        curVerticalOffset = verticalSpacing*2;
                    }
                } else {
                    card.cardView.isClickable = false;
                    flipDownCard(card.cardView, false);
                    card.cardView.animationEndLeft = horizontalOffset;
                    card.cardView.animationEndTop = deckTop;
                    curVerticalOffset = verticalSpacing*2;
                }
                
                with (card.cardView.style) {
                    transition = "250ms ease-out";
                    animationDelay = "";
                    left = card.cardView.animationEndLeft + "px";
                    top = card.cardView.animationEndTop + "px";
                    zIndex = i + 1;
                    visibility = "visible";
                }
            
                horizontalOffset += horizontalSpacing;
            }
        } else {

            var curZIndex = 26 - (game.deck.length-1 - game.deckIndex);
            var curLeftOffset = (game.deck.length-1 - game.deckIndex-1)*deckStackHorizontalSpacing;
            for (var i=game.deck.length-1; i>game.deckIndex; i--) {
                var card = game.deck[i];
                card.cardView.isClickable = false;
                flipDownCard(card.cardView, true);
                lowerCard(card.cardView);
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
                card.cardView.style.zIndex = curZIndex;
                card.cardView.style.transition = move.moveResetsDeck ? "300ms ease-out 100ms" : "300ms ease-out";
                card.cardView.style.left = deckLeft - curLeftOffset + "px";
                card.cardView.style.top = deckTop + "px";
            
                curZIndex++;
                curLeftOffset -= deckStackHorizontalSpacing;
            }

            for (var i=0; i<=game.deckIndex; i++) {
                var card = game.deck[i];
                card.cardView.isClickable = i === game.deckIndex;
                var offset = 0;
                if (i == game.deckIndex-1) {
                    if (i==0) {
                        offset = 0;
                    } else {
                        offset = flippedCardsOverlapSpacing;
                    }
                } else if (i == game.deckIndex) {
                    if (i==0) {
                        offset = 0;
                    } else if (i==1) {
                        offset = flippedCardsOverlapSpacing;
                    } else {
                        offset = flippedCardsOverlapSpacing*2;
                    }
                }
                curLeft = flippedCardsLeft + offset;
                var zOffset = i==game.deckIndex ? 2 : 0;
                if (!move.moveResetsDeck) {
                    card.cardView.style.zIndex = 24 - game.deckIndex + i + zOffset;
                }
                card.cardView.style.transition = move.moveResetsDeck ? "300ms ease-out 100ms" : "300ms ease-out";
                card.cardView.style.left = curLeft + "px";
                card.cardView.style.top = deckTop + "px";
                flipUpCard(card.cardView, true); 
                card.cardView.stackIndex = -1;
                card.cardView.stackDepth = 0;
            }
        }

        if (move.drawCount == 0) {
            PositionTableauCards();
            if (move.endIndex < 4) {
                var foundation = game.foundations[move.endIndex];
                var card = foundation[foundation.length-1];
                BlowUpCard(card.cardView);
            }
        }

        if (forwardMoves.length == 0) {
            HideRedoButton();
        }

        ShowUndoButton();
        document.getElementById('navigation_bar_moves').innerText = game.moves.length;
    }

    this.ApplyMove = function(move) {
        if (move.drawCount > 0) {
            if (this.deckIndex == this.deck.length-1) {
                move.moveResetsDeck = true;
                this.deckIndex = move.drawCount - 1;
                if (this.deckIndex >= this.deck.length) {
                    this.deckIndex = this.deck.length-1;
                }
            } else {
                this.deckIndex += move.drawCount;
                if (this.deckIndex >= this.deck.length) {
                    move.drawCount = this.deck.length-1 - (this.deckIndex-move.drawCount);
                    this.deckIndex = this.deck.length-1;
                }
            }
        } else if (move.startIndex == -2) {
            var card = this.deck[move.deckIndex];
            this.deck.splice(move.deckIndex, 1);
            this.deckIndex = move.deckIndex-1;
            if (this.deckIndex >= this.deck.length-1) {
                this.deckIndex = this.deck.length-1;
            }
            card.tableauIndex = move.endIndex;
            if (move.endIndex < 4) {
                this.foundations[move.endIndex].push(card);
            } else {
                this.tableaus[move.endIndex-4].push(card);
            }
        } else if (move.startIndex == -1) {
            var card = this.deck[move.deckIndex];
            this.deck.splice(move.deckIndex, 1);
            card.tableauIndex = move.endIndex;
            if (move.endIndex<4) {
                this.foundations[move.endIndex].push(card);
            } else {
                this.tableaus[move.endIndex-4].push(card);
            }
            this.deckIndex--;
        } else {
            // Remove from previous tableau
            var movingCards = [];
            var tableau = this.tableaus[move.startIndex-4];
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
                    this.foundations[move.endIndex].push(card);
                } else {
                    this.tableaus[move.endIndex-4].push(card);
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

        this.moves.push(move);
    }

    function UndoLastMoveToGame() {
        var lastMove = game.moves[game.moves.length-1];
        game.UndoLastMove();
        if (lastMove.drawCount == 0) {
            PositionTableauCards();
        }

        forwardMoves.push(lastMove);
        var isThoughtful = GetSetting('setting_thoughtful');
        if (isThoughtful && game.moves.length>0) {
            lastMove = game.moves[game.moves.length-1];
            while (lastMove.drawCount>0) {
                game.UndoLastMove();
                forwardMoves.push(lastMove);
                if (game.moves.length>0) {
                    lastMove = game.moves[game.moves.length-1];
                } else {
                    break;
                }
            }
        }

        PositionDeckCards();

        if (game.moves.length == 0) {
            HideUndoButton();
        }
        ShowRedoButton();
        document.getElementById('navigation_bar_moves').innerText = game.moves.length;

        SearchForGameHintsAndDeadEnds();
    }

    this.UndoLastMove = function() {
        if (this.moves.length>0) {
            var lastMove = this.moves[this.moves.length-1];
            if (lastMove.drawCount > 0) {
                this.deckIndex -= lastMove.drawCount;
                if (this.deckIndex < 0 && lastMove.moveResetsDeck) {
                    this.deckIndex = this.deck.length-1;
                }
            } else {
                if (lastMove.moveExposedStackCard) {
                    var tableau = this.tableaus[lastMove.startIndex-4];
                    var stackCard = tableau[tableau.length-1];
                    stackCard.isFaceDown = true;
                }

                var movingCards = [];
                if (lastMove.endIndex < 4) {
                    var foundation = this.foundations[lastMove.endIndex];
                    movingCards.push(foundation[foundation.length-1]);
                    foundation.splice(foundation.length-1, 1);
                } else {
                    var tableau = this.tableaus[lastMove.endIndex-4];
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
                        this.deckIndex++;
                        if (this.deckIndex >= this.deck.length) {
                            this.deck.push(card);
                        } else {
                            this.deck.splice(this.deckIndex, 0, card);
                        }
                    } else if (lastMove.startIndex < 0) {
                        card.tableauIndex = -1;
                        this.deckIndex = lastMove.deckIndex;
                        if (this.deckIndex >= this.deck.length) {
                            this.deck.push(card);
                        } else {
                            this.deck.splice(this.deckIndex, 0, card);
                        }
                        this.deckIndex = lastMove.premoveStackIndex;
                    } else {
                        card.tableauIndex = lastMove.startIndex;
                        this.tableaus[lastMove.startIndex-4].push(card);
                    }
                }
            }
            this.moves.splice(this.moves.length-1, 1);
        }
    }

    this.CanAutoPlay = function(card) {
        if (this.foundations[card.suitInt].length == card.number-1) {
            if (card.number == 1) {
                return true;
            }

            var sameColoroppositeSuit = this.foundations[(card.suitInt+2)%4].length;
            var oppositeColor1 = this.foundations[(card.suitInt+1)%4].length;
            var oppositeColor2 = this.foundations[(card.suitInt+3)%4].length;
            
            return (sameColoroppositeSuit >= card.number-3) &&
                    (oppositeColor1 >= card.number-2) &&
                    (oppositeColor2 >= card.number-2);
        }
        return false;
    }

    function AutoPlayMoves() {
        if (!game.isGameOver() && GetSetting('setting_autoplay')) {
            var autoPlaysFound = true;
            while (autoPlaysFound) {
                autoPlaysFound = false;
                for (var i=0; i<7; i++) {
                    var tableau = game.tableaus[i];
                    if (tableau.length>0) {
                        var card = tableau[tableau.length-1];
                        if (game.CanAutoPlay(card)) {
                            autoPlaysFound = true;
                            var autoMove = {
                                startIndex: i+4,
                                endIndex: card.suitInt,
                                cardCount: 1,
                                moveCard: card,
                                drawCount: 0
                            }
                            currentAutoPlayMoves.push(autoMove);
                            game.ApplyMove(autoMove);
                        }
                    }
                }
                if (game.isAllCardsFaceUp()) {
                    for (var i=0; i<game.deck.length; i++) {
                        var card = game.deck[i];
                        if (game.CanAutoPlay(card)) {
                            autoPlaysFound = true;
                            var autoMove = {
                                startIndex: -2,
                                deckIndex: i,
                                endIndex: card.suitInt,
                                cardCount: 1,
                                moveCard: card,
                                drawCount: 0
                            }
                            currentAutoPlayMoves.push(autoMove);
                            game.ApplyMove(autoMove);
                            i--;
                        }
                    }
                }
            }

            if (currentAutoPlayMoves.length>0) {
                setTimeout(AnimateNextAutoPlayMove, 250);
            }
        }
    }

    function AnimateNextAutoPlayMove() {
        if (currentAutoPlayMoves.length>0) {
            var autoMove = currentAutoPlayMoves[0];
            currentAutoPlayMoves.splice(0, 1);
            flipUpCard(autoMove.moveCard.cardView, true);
            autoMove.moveCard.cardView.style.zIndex = 90-currentAutoPlayMoves.length;
            with (autoMove.moveCard.cardView.style) {
                transition = "250ms ease-out";
                animationDelay = "";
                left = foundationBases[autoMove.moveCard.suitInt].style.left;
                top = foundationBases[autoMove.moveCard.suitInt].style.top;
            }

            document.getElementById('navigation_bar_moves').innerText = game.moves.length - currentAutoPlayMoves.length;
            
            BlowUpCard(autoMove.moveCard.cardView);

            if (autoMove.moveExposedStackCard) {
                flipUpCard(autoMove.exposedCard.cardView, true);
            }

            setTimeout(AnimateNextAutoPlayMove, 250);
        } else {
            setTimeout(function() {
                PositionAllCardViews(false, 250)
            }, 250);
        }
    }

    this.isAllCardsFaceUp = function() {
        for (var i=0; i<7; i++) {
            var tableau = this.tableaus[i];
            if (tableau.length>0) {
                var card = tableau[0];
                if (card.isFaceDown) {
                    return false;
                }
            }
        }
        return true;
    }

    this.isGameOver = function() {
        return (this.foundations[0].length == 13 &&
                this.foundations[1].length == 13 &&
                this.foundations[2].length == 13 &&
                this.foundations[3].length == 13);
    }

    var OnGameOver = function() 
    {
        game.StopGameClock();
        game.isInitialized = false;
        
        HideHintButton();
        HideMenuButton();
        HideUndoButton();
        HideRedoButton();
        deckBase.style.transition = "0.5s linear";
        deckBase.style.opacity = 0;

        SaveGameStatistics();

        WaitForAutoPlaysToFinishAnimating();
    }

    var WaitForAutoPlaysToFinishAnimating = function() {
        if (currentAutoPlayMoves.length>0) {
            setTimeout(WaitForAutoPlaysToFinishAnimating, 100);
            return;
        }
        setTimeout(AnimateGameOver, 1000);
    }

    var gameOverIsLeastTime = false;
    var gameOverIsLeastMoves = false;
    var gameOverIsLeastHints = false;
    var gameOverIsLeastUndos = false;

    var SaveGameStatistics = function() 
    {    
        var statKey = 'stat_total_games_won';
        var curGamesWon = GetStatistic(statKey)+1;
        SetStatistic(statKey, curGamesWon);
        
        statKey = 'stat_next_game_number';
        var curNextPuzzle = GetStatistic(statKey) + 1;
        if (game.gameNumber == curNextPuzzle) {
            SetStatistic(statKey, curNextPuzzle);
        }

        if (game.gameDifficulty == 'Easy') {
            statKey = 'stat_easy_games_won';
            SetStatistic(statKey, GetStatistic(statKey)+1);    
        } else if (game.gameDifficulty == 'Difficult') {
            statKey = 'stat_difficult_games_won';
            SetStatistic(statKey, GetStatistic(statKey)+1);
        }

        gameOverIsLeastTime = false;
        gameOverIsLeastMoves = false;
        gameOverIsLeastHints = false;
        gameOverIsLeastUndos = false;
        if (curGamesWon == 1) {
            SetStatistic('stat_least_time', game.elapsedSeconds);
            SetStatistic('stat_least_moves', game.moves.length);
            SetStatistic('stat_least_hints', game.hintsUsed);
            SetStatistic('stat_least_undos', game.undosUsed);
        } else {
            var currentLeastTime = GetStatistic('stat_least_time');
            if (game.elapsedSeconds < currentLeastTime) {
                gameOverIsLeastTime = true;
                SetStatistic('stat_least_time', game.elapsedSeconds);
            }
            var currentLeastMoves = GetStatistic('stat_least_moves');
            if (game.moves.length < currentLeastMoves) {
                gameOverIsLeastMoves = true;
                SetStatistic('stat_least_moves', game.moves.length);
            }
            var currentLeastHints = GetStatistic('stat_least_hints');
            if (game.hintsUsed < currentLeastHints) {
                gameOverIsLeastHints = true;
                SetStatistic('stat_least_hints', game.hintsUsed);
            }
            var currentLeastUndos = GetStatistic('stat_least_undos');
            if (game.undosUsed < currentLeastUndos) {
                gameOverIsLeastUndos = true;
                SetStatistic('stat_least_undos', game.undosUsed);
            }
        }
    }

    var AnimateGameOver = function() 
    {
        document.getElementById('navigation_bar_clock_container').style.opacity = 0;
        document.getElementById('navigation_bar_moves_container').style.opacity = 0;

        document.getElementById('GameOverResultText').innerHTML = "You won!<br>Game " + game.gameNumber;

        var gameOverView = document.getElementById('GameOverView');
        gameOverView.style.transition = "none";
        gameOverView.style.transform = "translate(-50%,-50%) scale(0)";
        gameOverView.style.height = "100px";
        gameOverView.style.opacity = "1";
        gameOverView.style.top = "50%";
        gameOverView.style.pointerEvents = "auto";
        var gameOverCloseButton = document.getElementById('game_over_close_button');
        gameOverCloseButton.style.transition = "none";
        gameOverCloseButton.style.visibility = "hidden";
        gameOverCloseButton.style.opacity = "0";

        document.getElementById('GameOverLeastTime').style.display = gameOverIsLeastTime ? 'inline-flex' : 'none';
        document.getElementById('GameOverLeastMoves').style.display = gameOverIsLeastMoves ? 'inline-flex' : 'none';
        document.getElementById('GameOverLeastHints').style.display = gameOverIsLeastHints ? 'inline-flex' : 'none';
        document.getElementById('GameOverLeastUndos').style.display = gameOverIsLeastUndos ? 'inline-flex' : 'none';
        var extendedHeight = 330;
        if (gameOverIsLeastTime) {
            extendedHeight += 37;
        }
        if (gameOverIsLeastMoves) {
            extendedHeight += 37;
        }
        if (gameOverIsLeastHints) {
            extendedHeight += 37;
        }
        if (gameOverIsLeastUndos) {
            extendedHeight += 37;
        }

        var totalSeconds = Math.floor(game.elapsedSeconds);
        var minutes = Math.floor(totalSeconds/60);
        var seconds = totalSeconds - minutes*60;
        document.getElementById('game_over_result_time').innerText = minutes + ":" + seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
        document.getElementById('game_over_result_moves').innerText = game.moves.length;
        document.getElementById('game_over_result_undos').innerText = game.undosUsed;
        document.getElementById('game_over_result_hints').innerText = game.hintsUsed;

        if (game.gameNumber == GetFirstEasyGameNumber()) {
            gameOverNextGameNumber = GetStatistic('stat_next_game_number')+1;
            gameOverNextGameDifficulty = '';
        } else if (game.gameDifficulty == 'Easy') {
            gameOverNextGameNumber = GetNextEasyGameNumber();
            gameOverNextGameDifficulty = 'Easy';
        } else if (game.gameDifficulty == 'Difficult') {
            gameOverNextGameNumber = GetNextDifficultGameNumber();
            gameOverNextGameDifficulty = 'Difficult';
        } else {
            gameOverNextGameNumber = GetStatistic('stat_next_game_number')+1;
            gameOverNextGameDifficulty = '';
        }

        if (gameOverNextGameDifficulty == 'Easy') {
            document.getElementById('game_over_start_prompt').innerText = "Start the next:";
            document.getElementById('game_over_start_game_button').innerText = "Easy Game";
        } else if (gameOverNextGameDifficulty == 'Difficult') {
            document.getElementById('game_over_start_prompt').innerText = "Start the next:";
            document.getElementById('game_over_start_game_button').innerText = "Difficult Game";
        } else if (game.gameNumber+1 == gameOverNextGameNumber) {
            document.getElementById('game_over_start_prompt').innerText = "Start the next game:";
            document.getElementById('game_over_start_game_button').innerText = "Game " + gameOverNextGameNumber;
        } else {
            document.getElementById('game_over_start_prompt').innerText = "Play them all in order:";
            document.getElementById('game_over_start_game_button').innerText = "Game " + gameOverNextGameNumber;
        }


        setTimeout(function() {
            with (gameOverView.style) {
                transition = "0.8s cubic-bezier(0.175, 0.885, 0.320, 1.275)";
                transform = 'translate(-50%,-50%) scale(1)';
                visibility = "visible";
            }
            setTimeout(function() {
                gameOverCloseButton.style.transition = "0.5s linear";
                gameOverCloseButton.style.visibility = "visible";
                gameOverCloseButton.style.opacity = "1";

                gameOverView.style.transition = "0.5s linear";
                gameOverView.style.height = extendedHeight + "px";
            }, 5000);
        }, 300); 

        game.AnimateGameOverCardAnimations(extendedHeight, 5.3);

    }

    this.AnimateGameOverCardAnimations = function(extendedHeight, extendedHeightDelay) {
        var curAnimationId = GetStatistic('stat_games_started');
        var totalAnimationsAvailable = 4;
        var cardAnimStartDelay = 1000;

        var mainCanvas = document.getElementById('main_canvas');
        canvasWidth = mainCanvas.offsetWidth;

        switch (curAnimationId%totalAnimationsAvailable) {
            case 0:
            {
                // Gravity Bouncing
                var cardIndex = 0;
                for (var i=0; i<4; i++) {
                    var foundation = game.foundations[i];
                    for (var j=foundation.length-1; j>=0; j--) {
                        var cardView = foundation[j].cardView;
                        cardView.style.zIndex = 90 - cardIndex;
                
                        var startLeft = parseInt(cardView.style.left);
                        var startTop = parseInt(cardView.style.top)
                        var keyframesText = "@keyframes gameOverAnim" + cardIndex + " {";
                        
                        var totalTime = 9;
                        var curTime = 0;
                        var deltaTime = 0.1;
                        var gravity = [0, 200];
                        var curVelocity = [200*deltaTime, 0];
                        var curPositionX = startLeft;
                        var curPositionY = startTop;
                        var isFallingOutOfView = false;
                        var bottomBounceY = window.innerHeight - cardLoweredHeight;
                        while (curTime < totalTime) {
                            var percentComplete = 100 * curTime / totalTime;
                            keyframesText = keyframesText + percentComplete + '% {opacity: 1; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                            
                            curPositionX = curPositionX + curVelocity[0];
                            curPositionY = curPositionY + curVelocity[1];
                            curVelocity[0] = curVelocity[0] + gravity[0]*deltaTime;
                            curVelocity[1] = curVelocity[1] + gravity[1]*deltaTime;
                            
                            isFallingOutOfView = totalTime - curTime < 1;

                            // Bounce
                            var bounceDampen = 0.75;
                            if (!isFallingOutOfView) {
                                if (curPositionY > bottomBounceY) {
                                    var overshoot = curPositionY - bottomBounceY;
                                    curPositionY = bottomBounceY;
                                    curVelocity[1] = curVelocity[1] - gravity[1]*deltaTime;
                                    curVelocity[1] = -curVelocity[1]*bounceDampen;
                                }
                            }
                            if (curPositionX < 0 || curPositionX > canvasWidth-cardLoweredWidth) {
                                curPositionX = curPositionX - curVelocity[0];
                                curVelocity[0] = curVelocity[0] - gravity[0]*deltaTime;
                                curVelocity[0] = -curVelocity[0];
                            }
                                    
                            curTime += deltaTime;
                        }
                        
                        keyframesText = keyframesText + '100% { opacity: 0; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                        keyframesText += '}';
                        cardView.children[1].textContent = keyframesText;
                        cardView.style.animation = 'gameOverAnim' + cardIndex + ' ' + totalTime + 's linear ' + (cardIndex*100 + cardAnimStartDelay) + 'ms 1 normal forwards';
                        cardIndex++;                        
                    }
                }

            }
            break;

            case 1:
            {
                // Gravity Bouncing off game over view          
                var cardIndex = 0;
                for (var i=0; i<4; i++) {
                    var foundation = game.foundations[i];
                    for (var j=foundation.length-1; j>=0; j--) {
                        var cardView = foundation[j].cardView;
                        cardView.style.zIndex = 90 - cardIndex;

                        var startLeft = parseInt(cardView.style.left);
                        var startTop = parseInt(cardView.style.top)
                        
                        var keyframesText = "@keyframes gameOverAnim" + cardIndex + " {";

                        var totalTime = 9;
                        var curTime = 0;
                        var deltaTime = 0.1;
                        var gravity = [0, 200];
                        var curVelocity = [200*deltaTime, 0];
                        var curPositionX = startLeft;
                        var curPositionY = startTop;
                        var isFallingOutOfView = false;
                        var bottomBounceY = window.innerHeight - cardLoweredHeight;
                        var gameOverViewWidth = 340;
                        var gameOverViewHeight = 100;
                        var gameOverViewLeft = (canvasWidth - gameOverViewWidth)*0.5 - cardLoweredWidth*0.5;
                        var gameOverViewRight = gameOverViewLeft + gameOverViewWidth + cardLoweredWidth*0.5;
                        var gameOverViewTop = (window.innerHeight - gameOverViewHeight)*0.5 - cardLoweredHeight;

                        while (curTime < totalTime) {
                            var percentComplete = 100 * curTime / totalTime;
                            keyframesText = keyframesText + percentComplete + '% {opacity: 1; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                            
                            var prevPositionY = curPositionY;
                            curPositionX = curPositionX + curVelocity[0];
                            curPositionY = curPositionY + curVelocity[1];
                            curVelocity[0] = curVelocity[0] + gravity[0]*deltaTime;
                            curVelocity[1] = curVelocity[1] + gravity[1]*deltaTime;
                            
                            isFallingOutOfView = totalTime - curTime < 1;

                            if (curTime > extendedHeightDelay - ((i*100 + cardAnimStartDelay)/1000)) {
                                gameOverViewHeight = extendedHeight;
                                gameOverViewTop = (window.innerHeight - gameOverViewHeight)*0.5 - cardLoweredHeight;
                            }

                            // Bounce
                            var bounceDampen = 0.75;
                            if (!isFallingOutOfView) {
                                if (curPositionY > bottomBounceY) {
                                    curPositionY = bottomBounceY;
                                    curVelocity[1] = curVelocity[1] - gravity[1]*deltaTime;
                                    curVelocity[1] = -curVelocity[1]*bounceDampen;
                                } else {
                                    // Bounce off game over view
                                    if (curPositionX > gameOverViewLeft &&
                                        curPositionX < gameOverViewRight &&
                                        prevPositionY <= gameOverViewTop &&
                                        curPositionY > gameOverViewTop
                                        ) 
                                    {
                                        curPositionY = gameOverViewTop;
                                        curVelocity[1] = curVelocity[1] - gravity[1]*deltaTime;
                                        curVelocity[1] = -curVelocity[1]*bounceDampen;    
                                    }
                                }
                            }
                            if (curPositionX < 0 || curPositionX > canvasWidth-cardLoweredWidth) {
                                curPositionX = curPositionX - curVelocity[0];
                                curVelocity[0] = curVelocity[0] - gravity[0]*deltaTime;
                                curVelocity[0] = -curVelocity[0];
                            }
                                    
                            curTime += deltaTime;
                        }
                        
                        keyframesText = keyframesText + '100% { opacity: 0; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                        keyframesText += '}';
                        cardView.children[1].textContent = keyframesText;
                        cardView.style.animation = 'gameOverAnim' + cardIndex + ' ' + totalTime + 's linear ' + (cardIndex*100 + cardAnimStartDelay) + 'ms 1 normal forwards';
                        cardIndex++;
                    }
                }
            }
            break;

            case 2:
            {
                // Spiral into center
                var totalTime = 7;
                var moveToStartPositionTime = 0.3; 
                var moveToStartPositionPercent = (moveToStartPositionTime / totalTime)*100;     
                
                var cardIndex = 0;
                for (var i=0; i<4; i++) {
                    var foundation = game.foundations[i];
                    for (var j=foundation.length-1; j>=0; j--) {
                        var cardView = foundation[j].cardView;
                        cardView.style.zIndex = 90 - cardIndex;

                        var keyframesText = "@keyframes gameOverAnim" + cardIndex + " {";

                        var initialLeft = parseInt(cardView.style.left);
                        var initialTop = parseInt(cardView.style.top)
                        
                        var startLeft = (canvasWidth - cardLoweredWidth)/2;
                        var startTop = foundationsTop + cardLoweredHeight*0.5;
                        
                        keyframesText = keyframesText + '0% { opacity: 1; left: ' + initialLeft + 'px; top: ' + initialTop + 'px;} ';
                        keyframesText = keyframesText + moveToStartPositionPercent + '% { opacity: 1; left: ' + startLeft + 'px; top: ' + startTop + 'px;} ';

                        var fullAngle = Math.PI * 2 * 4.25;
                        var spinCenterX = canvasWidth*0.5;
                        var spinCenterY = window.innerHeight*0.5;
                        var radius = Math.sqrt((spinCenterY - startTop)*(spinCenterY - startTop) + (spinCenterX - startLeft)*(spinCenterX - startLeft));
                        for (var angle = fullAngle; angle >= 0; angle-=0.15) {
                            var percentComplete = 100 * (1 - (angle / fullAngle));
                            
                            var curPositionX = radius*Math.cos(-angle) + spinCenterX - cardLoweredWidth*0.5;
                            var curPositionY = radius*Math.sin(-angle) + spinCenterY - cardLoweredHeight*0.5;
                            keyframesText = keyframesText + (moveToStartPositionPercent + (100-moveToStartPositionPercent)*percentComplete/100) + '% { opacity: 1; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                            radius*=0.985;
                        }
                        
                        keyframesText = keyframesText + '100% { opacity: 0; left: ' + (spinCenterX - cardLoweredWidth*0.5) + 'px; top: ' + (spinCenterY - cardLoweredHeight*0.5) + 'px;}';
                        keyframesText += '}';
                        cardView.children[1].textContent = keyframesText;
                        cardView.style.animation = 'gameOverAnim' + cardIndex + ' ' + totalTime + 's linear ' + (cardIndex*100 + cardAnimStartDelay) + 'ms 1 normal forwards';
                        cardIndex++;
                    }
                }
            }
            break;

            case 3:
            {
                // Spiral out from center
                var slideInTime = 0.5;
                var totalTime = 7;       
                
                var cardIndex = 0;
                for (var i=0; i<4; i++) {
                    var foundation = game.foundations[i];
                    for (var j=foundation.length-1; j>=0; j--) {
                        var cardView = foundation[j].cardView;
                        cardView.style.zIndex = 90 - cardIndex;

                        var startLeft = parseInt(cardView.style.left);
                        var startTop = parseInt(cardView.style.top);
                        var keyframesText = "@keyframes gameOverAnim" + cardIndex + " {";

                        var slideInPercent = slideInTime / (slideInTime + totalTime);
                        keyframesText = keyframesText + (slideInPercent*100) + '% { opacity: 1; left: ' + (spinCenterX - cardLoweredWidth*0.5) + 'px; top: ' + (spinCenterY - cardLoweredHeight*0.5) + 'px;}';
                        
                        var fullAngle = Math.PI * 2 * 4.25;
                        var spinCenterX = canvasWidth*0.5;
                        var spinCenterY = window.innerHeight*0.5;
                        var fullRadius = window.innerHeight*0.5 + cardLoweredHeight + 10;// Math.sqrt((spinCenterY - startTop)*(spinCenterY - startTop) + (spinCenterX - startLeft)*(spinCenterX - startLeft));
                        for (var angle = 0.01; angle < fullAngle; angle+=0.15) {
                            var percentComplete = (angle / fullAngle) * (1-slideInPercent);
                        
                            var radius = (angle/fullAngle)*fullRadius;
                            var curPositionX = radius*Math.cos(-angle) + spinCenterX - cardLoweredWidth*0.5;
                            var curPositionY = radius*Math.sin(-angle) + spinCenterY - cardLoweredHeight*0.5;
                            keyframesText = keyframesText + ((slideInPercent + percentComplete)*100) + '% { opacity: 1; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                        }
                        
                        keyframesText = keyframesText + '100% { opacity: 0; left: ' + curPositionX + 'px; top: ' + curPositionY + 'px;}';
                        keyframesText += '}';
                        cardView.children[1].textContent = keyframesText;
                        cardView.style.animation = 'gameOverAnim' + cardIndex + ' ' + totalTime + 's linear ' + (cardIndex*100 + cardAnimStartDelay) + 'ms 1 normal forwards';
                        cardIndex++;
                    }
                }
            }
            break;
        }
    }

    this.GenerateGameStateHash = function() {
        var p=53;
        var p2=59;
        var m=1e9 + 7;
        var m2=1e9 + 9;
        var hash_value = 0;
        var hash_value2 = 0;
        var p_pow = 1;
        var p_pow2 = 1;
        var spacerValue = 53;
        for (var i=0; i<this.foundations.length; i++) {
            var foundation = this.foundations[i];
            hash_value = (hash_value + (foundation.length+1)*p_pow) % m;
            p_pow = (p_pow*p)%m;
            hash_value = (hash_value + spacerValue*p_pow) % m;
            p_pow = (p_pow*p)%m;
            
            hash_value2 = (hash_value2 + (foundation.length+1)*p_pow2) % m2;
            p_pow2 = (p_pow2*p2)%m2;
            hash_value2 = (hash_value2 + spacerValue*p_pow2) % m2;
            p_pow2 = (p_pow2*p2)%m2;
        }
        for (var i=0; i<this.tableaus.length; i++) {
            var tableau = this.tableaus[i];
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
        hash_value = (hash_value + (this.deckIndex+2)*p_pow) % m;
        hash_value2 = (hash_value2 + (this.deckIndex+2)*p_pow2) % m2;
        this.gameStateHash = String(hash_value) + String(hash_value2);
    }

    this.OnResizeWindow = function() {

        var ease = "0.4s ease-out";

        DeterminePositionsForStackBases();
        PositionAllCardViews(false, 400);

        // Reposition everything else
        var viewsToPosition = [
            'foundation_base_hearts',
            'foundation_base_spades',
            'foundation_base_diamonds',
            'foundation_base_clubs',
            'tableau_base_0',
            'tableau_base_1',
            'tableau_base_2',
            'tableau_base_3',
            'tableau_base_4',
            'tableau_base_5',
            'tableau_base_6',
            'deck_base'
        ];
        for (var i = 0; i < viewsToPosition.length; i++) {
            var view = document.getElementById(viewsToPosition[i]);
            if (view.positionFunction !== undefined) {
                view.style.transition = ease;
                var position = eval(view.positionFunction);
                view.style.left = position[0] + "px";
                view.style.top = position[1] + "px";
            }
        }
    }
}

var gameHashToSimulationResults = new Map();

//
// Async Workers
//
var worker;
var FindSolution = function(gameClone, timeOut) {
    if (worker) {
        worker.terminate();
    }
    worker = new Worker('GameSimulator.js');
    worker.addEventListener('message', function(e){
        var data = e.data;
        var result = e.data.result;
        switch (data.cmd) {
            case 'OnFinishedGameSimulation':
                gameHashToSimulationResults.set(result.initialHash, result);
                
                game.WireUpAllMoveCards(result.solutionMoves);
                            
                // Check for dead end warnings
                game.GenerateGameStateHash();
                if (result.initialHash == game.gameStateHash) {
                    if (result.isDeadEnd) {
                        ShowDeadEndWarningView();
                    }

                    if (hintThinkingGameStateHash == result.initialHash) {
                        if (result.solutionMoves.length > 0) {
                            var hintMove = result.solutionMoves[0];
                            AnimateHint(hintMove);
                        } else {
                            ShowNoOptimalMoveFound();
                        }
                    }
                }
    
                HideIsThinking();
    
            break;
        }
    }, false);

    worker.postMessage({
        cmd: 'FindSolutionForGame',
        game: gameClone,
        timeOut: timeOut
    });
} 

var SearchForGameHintsAndDeadEnds = function() {
    if (!game.isInitialized || game.isGameOver()) {
        return;
    }

    var warnOnDeadEnds = GetSetting('setting_warn_dead_ends');
    var hints = GetSetting('setting_hints')
    if (warnOnDeadEnds || hints) {
        game.GenerateGameStateHash();
        var gameSimulatorResult = gameHashToSimulationResults.get(game.gameStateHash);
        if (gameSimulatorResult == undefined) {
            FindSolution(GenerateGameClone(game), 5000);
        } else if (warnOnDeadEnds) {
            if (gameSimulatorResult.isDeadEnd) {
                ShowDeadEndWarningView();
            }
        }
    }
}

var GenerateGameClone = function(aGame) {

    // Create safe clone of game
    var gameClone = {
        moves: [],
        foundations: [ [], [], [], [] ],
        tableaus: [ [], [], [], [], [], [], [] ],
        deck: [],
        deckIndex: aGame.deckIndex,
        gameStateHash: aGame.gameStateHash,
        drawCount: aGame.drawCount
    }

    // Add all the cards
    for (var i=0; i<aGame.deck.length; i++) {
        var card = aGame.deck[i];
        var cardClone = { 
            id: card.id, 
            number: card.number, 
            suit: card.suit, 
            suitInt: card.suitInt, 
            isRed: card.isRed, 
            isFaceDown: card.isFaceDown, 
            tableauIndex: card.tableauIndex, 
            premoveDeckFlipCount: card.premoveDeckFlipCount 
        }
        gameClone.deck.push(cardClone);
    }
    for (var i=0; i<aGame.foundations.length; i++) {
        var foundation = aGame.foundations[i];
        for (var j=0; j<foundation.length; j++) {
            var card = foundation[j];
            var cardClone = { 
                id: card.id, 
                number: card.number, 
                suit: card.suit, 
                suitInt: card.suitInt, 
                isRed: card.isRed, 
                isFaceDown: card.isFaceDown, 
                tableauIndex: card.tableauIndex, 
                premoveDeckFlipCount: card.premoveDeckFlipCount 
            }
            gameClone.foundations[i].push(cardClone);
        }
    }
    for (var i=0; i<aGame.tableaus.length; i++) {
        var tableau = aGame.tableaus[i];
        for (var j=0; j<tableau.length; j++) {
            var card = tableau[j];
            var cardClone = { 
                id: card.id, 
                number: card.number, 
                suit: card.suit, 
                suitInt: card.suitInt, 
                isRed: card.isRed, 
                isFaceDown: card.isFaceDown, 
                tableauIndex: card.tableauIndex, 
                premoveDeckFlipCount: card.premoveDeckFlipCount 
            }
            gameClone.tableaus[i].push(cardClone);
        }
    }

    return gameClone;
}

var ShowDeadEndWarningView = function() {
    if (GetSetting('setting_warn_dead_ends')) 
    {
        // Show a restart game button if undo moves is not allowed
        if (GetSetting('setting_undo')) {
            document.getElementById('DeadEndWarningViewRestartButton').style.visibility = 'visible';
            document.getElementById('DeadEndWarningViewLine2').innerText = 'Restart or undo a few moves';
        } else {
            document.getElementById('DeadEndWarningViewRestartButton').style.visibility = 'visible';
            document.getElementById('DeadEndWarningViewLine2').innerText = 'Restart this game';
        }

        var deadEndWarningView = document.getElementById('DeadEndWarningView');
        with (deadEndWarningView.style) {
            transition = "300ms ease-out";
            transform = "translate(-50%, -50%)";
        }
    }
}

var HideDeadEndWarningView = function() {
    var deadEndWarningView = document.getElementById('DeadEndWarningView');
    with (deadEndWarningView.style) {
        transition = "300ms ease-out";
        transform = "translate(-50%, -200px)";
    }
}

var hintThinkingGameStateHash = '';

var ShowIsThinking = function() {
    game.GenerateGameStateHash();
    hintThinkingGameStateHash = game.gameStateHash;
    var thinkingView = document.getElementById('IsThinkingView');
    with (thinkingView.style) {
        transition = "none";
        transform = "translate(-50%, 200px)";
        visibility = "visible";
    }
    setTimeout(function() {
        with (thinkingView.style) {
            transition = "300ms ease-out";
            transform = "translate(-50%, -50%)";
        }
    }, 10);
}

var HideIsThinking = function() {
    var thinkingView = document.getElementById('IsThinkingView');
    with (thinkingView.style) {
        transition = "300ms ease-out";
        transform = "translate(-50%, 200px)";
    }
}

var ShowNoOptimalMoveFound = function() {
    var noOptimalMoveView = document.getElementById('NoOptimalMoveView');
    with (noOptimalMoveView.style) {
        transition = "none";
        transform = "translate(-50%, 200px)";
        visibility = "visible";
    }
    setTimeout(function() {
        with (noOptimalMoveView.style) {
            transition = "300ms ease-out";
            transform = "translate(-50%, -50%)";
        }
        setTimeout(function() {
            HideNoOptimalMoveFound();
        }, 3000);
    }, 10);
}

var HideNoOptimalMoveFound = function() {
    var noOptimalMoveView = document.getElementById('NoOptimalMoveView');
    with (noOptimalMoveView.style) {
        transition = "300ms ease-out";
        transform = "translate(-50%, 200px)";
    }
}

var AnimateHint = function(move) 
{
    if ((move.drawCount > 0) || (move.premoveDeckFlipCount > 0) || (move.startIndex < 0)) {
        RaiseAndTwistCardView(move.moveCard.cardView);
    } else {
        var stack = game.tableaus[move.startIndex-4];
        for (var i=move.cardCount-1; i>=0; i--) {
            var card = stack[stack.length - 1 - i];
            TwistCard(card.cardView);
        }
    }
    
}

function raiseCard(cardView) {
    if (cardView.isRaised) {
        return;
    }
    cardView.isRaised = true;

    var raiseContainer = cardView.firstChild;
    var cardShadow = raiseContainer.firstChild;
    var flipContainer = raiseContainer.children[1];
    var cardBack = flipContainer.children[0];
    var cardFront = flipContainer.children[1];
    var ease = "0.1s linear";
    cardShadow.style.transition = "none";
    cardShadow.style.transform = "translate3d(0px,0px,-1px) perspective(800px) rotateY(180deg)";
    raiseContainer.style.transition = ease;
    raiseContainer.style.transform = "scale(1.15)";
    cardShadow.style.transition = ease;
    cardShadow.style.transform = "translate3d(20px,20px,-1px) perspective(800px) rotateY(180deg)";
}

function lowerCard(cardView) {
    if (!cardView.isRaised) {
        return;
    }
    cardView.isRaised = false;

    var raiseContainer = cardView.firstChild;
    var cardShadow = raiseContainer.firstChild;
    var flipContainer = raiseContainer.children[1];
    var cardBack = flipContainer.children[0];
    var cardFront = flipContainer.children[1];
    var ease = "0.1s linear";
    cardShadow.style.transition = "none";
    cardShadow.style.transform = "translate3d(20px,20px,-1px) perspective(800px) rotateY(180deg)";
    raiseContainer.style.transition = ease;
    raiseContainer.style.transform = "scale(1)";
    cardShadow.style.transition = ease;
    cardShadow.style.transform = "translate3d(0px,0px,-1px) perspective(800px) rotateY(180deg)";
}

function flipUpCard(cardView, animate, isTemporary = false) {
    
    if (cardView.isFlippedUp && !isTemporary) {
        return;
    }

    if (!isTemporary) {
        cardView.isFlippedUp = true;
    }

    var raiseContainer = cardView.firstChild;
    var cardShadow = raiseContainer.firstChild;
    var flipContainer = raiseContainer.children[1];
    var cardBack = flipContainer.children[0];
    var cardFront = flipContainer.children[1];
    
    var ease = animate ? "0.5s ease-out" : "none";
    flipContainer.style.transition = ease;
    cardShadow.style.transition = ease;
    cardBack.style.transition = ease;
    cardFront.style.transition = ease;
    raiseContainer.style.transition = ease;
    
    
    if (animate) {
        raiseContainer.style.transform = "scale(1.15)";
        flipContainer.style.transform = "perspective(800px) rotateY(180deg)";
        cardShadow.style.transform = "translate3d(20px,20px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(180deg)";
        setTimeout(function () {
            raiseContainer.style.transform = "scale(1)";
            cardShadow.style.transform = "translate3d(0px,0px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(180deg)";
        }, 250);
    
    } else {
        flipContainer.style.transform = "perspective(800px) rotateY(180deg)";
        raiseContainer.style.transform = "scale(1)";
        cardShadow.style.transform = "translate3d(0px,0px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(180deg)";
    }
}

function flipDownCard(cardView, animate, isTemporary = false) {
    if (!cardView.isFlippedUp && !isTemporary) {
        return;
    }

    if (!isTemporary) {
        cardView.isFlippedUp = false;
    }
    var raiseContainer = cardView.firstChild;
    var cardShadow = raiseContainer.firstChild;
    var flipContainer = raiseContainer.children[1];
    var cardBack = flipContainer.children[0];
    var cardFront = flipContainer.children[1];

    var ease = animate ? "0.5s ease-out" : "none";
    flipContainer.style.transition = ease;
    cardShadow.style.transition = ease;
    cardBack.style.transition = ease;
    cardFront.style.transition = ease;
    raiseContainer.style.transition = ease;
    
    if (animate) {
        raiseContainer.style.transform = "scale(1.15)";
        flipContainer.style.transform = "perspective(800px) rotateY(0deg)";
        cardShadow.style.transform = "translate3d(20px,20px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(0deg)";
        setTimeout(function () {
            raiseContainer.style.transform = "scale(1)";
            cardShadow.style.transform = "translate3d(0px,0px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(0deg)";
        }, 250);
    
    } else {
        flipContainer.style.transform = "perspective(800px) rotateY(0deg)";
        raiseContainer.style.transform = "scale(1)";  
        cardShadow.style.transform = "translate3d(0px,0px,-" + cardLoweredWidth*0.5 + "px) perspective(800px) rotateY(0deg)";  
    }
}

function TwistCard(cardView) {
    cardView.addEventListener("animationend", function() {
        cardView.classList.remove('twist');
    });
    cardView.classList.add('twist');
}

function RaiseAndTwistCardView(cardView) {
    flipUpCard(cardView, false, true);
    cardView.addEventListener("animationend", function(event) {
        cardView.classList.remove('raiseAndTwist');
        if (!cardView.isFlippedUp) {
            flipDownCard(cardView, false, true);
        }
    });
    cardView.classList.add('raiseAndTwist');
}