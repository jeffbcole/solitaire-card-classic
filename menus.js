var gameOverNextGameNumber = 0;
var gameOverNextGameDifficulty = '';

var visibleMenuCards = [];
			
function MenuCardAppear(elementID) {
	var el = document.getElementById(elementID);
	visibleMenuCards.push(elementID);
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.8s cubic-bezier(0.175, 0.885, 0.320, 1.275)";
		top = "50%";
		opacity = 1;
		pointerEvents = "auto";
	}
}

function MenuCardPressDown(elementID) {
	var el = document.getElementById(elementID);
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.5s ease-out";
		boxShadow = "0px 0px 0px rgba(0,0,0,0.5)";
		transform = "scale(0.93) translate(-54%,-54%)";
		pointerEvents = "none";
	}
}

function MenuCardPopUp(elementID) {
	var el = document.getElementById(elementID);
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.5s ease-in-out";
		boxShadow = "30px 30px 5px rgba(0,0,0,0.5)";
		transform = "scale(1) translate(-50%,-50%)";
		pointerEvents = "auto";
	}
}

function MenuCardDisappear(elementID) {
	var el = document.getElementById(elementID);
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s ease-in";
		top = "100%";
		opacity = 0;
		pointerEvents = "none";
	}
}

function ShowTitle() {
	var el = document.getElementById("game_title");
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.8s cubic-bezier(0.175, 0.885, 0.320, 1.275)";
		top = "calc(50% - 200px)";
		opacity = 1;
	}
}

function HideTitle() {
	var el = document.getElementById("game_title");
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.8s cubic-bezier(0.175, 0.885, 0.320, 1.275)";
		top = "0%";
		opacity = 0;
	}
}
function HideMenuButton() {
	var el = document.getElementById('navigation_bar_menu_button');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s linear";
		opacity = 0;
		pointerEvents = "none";
	}
}

function ShowMenuButton() {
var el = document.getElementById('navigation_bar_menu_button');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s linear";
		opacity = 1;
		pointerEvents = "auto";
	}
}

function MenuButtonPressed() {
	if (visibleMenuCards.length == 0)
	{
		HideIsThinking();
		HideDeadEndWarningView();
		HideNoOptimalMoveFound();

		// Show the close button
		var el = document.getElementById('menu_main_close_button');
		with(el.style) {
			display = 'block';
		}
		
		ShowMainMenu(true);
	}
}

var isMainMenuVisible = false;

function ShowMainMenu(showCloseButton) {
	if (showCloseButton) {
		var el = document.getElementById('menu_main_close_button');
		with(el.style) {
			display = 'block';
		}
	} else {
		var el = document.getElementById('menu_main_close_button');
		with(el.style) {
			display = 'none';
		}
	}

	var el = document.getElementById('solution_button');
	if (game != null && game.isInitialized) {
		with (el.style) {
			display = 'block';
		}
	} else {
		with (el.style) {
			display = 'none';
		}
	}

	game.StopGameClock();

	MenuCardAppear('menu_main');
	HideMenuButton();
	isMainMenuVisible = true;
}

function menu_main_close_click() {
	visibleMenuCards = [];
	MenuCardDisappear('menu_main');
	ShowMenuButton();
	isMainMenuVisible = false;

	if (game != null && !game.isGameOver()) {
		game.StartGameClock();
	}
}

var menuStartAGameNumber = 0;
var menuStartAGameDifficulty = '';

function ShowStartAGameMenu() {

	var gamesStarted = GetStatistic('stat_games_started');
	menuStartAGameNumber = GetStatistic('stat_next_game_number') + 1;
	menuStartAGameDifficulty = '';
	if (gamesStarted == 0) {
		document.getElementById('menu_start_a_game_message').innerHTML = "All games are winnable.<br>First try an easy game:";
		menuStartAGameNumber = GetNextEasyGameNumber();
		menuStartAGameDifficulty = 'Easy';
		document.getElementById('menu_start_a_game_next_game_button').innerText = "Easy Game";
	} else if (game.isInitialized && !game.isGameOver() && game.gameNumber == menuStartAGameNumber) {
		document.getElementById('menu_start_a_game_message').innerHTML = "All games are winnable.<br>Play them all in order!";
		menuStartAGameDifficulty = game.gameDifficulty;
		document.getElementById('menu_start_a_game_next_game_button').innerText = "Restart Game " + menuStartAGameNumber;
	} else {
		document.getElementById('menu_start_a_game_message').innerHTML = "All games are winnable.<br>Play them all in order!";
		document.getElementById('menu_start_a_game_next_game_button').innerText = "Game " + menuStartAGameNumber;
	}

	var startGameButton = document.getElementById('menu_start_a_game_next_game_button');
	
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	MenuCardAppear("menu_start_a_game");
}

function menu_card_close_click() {
	var topMenu = visibleMenuCards.pop();
	MenuCardDisappear(topMenu);
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPopUp(menuName);
}

function menu_card_solution_view_close_click() {
	if (solutionViewWorker) {
		solutionViewWorker.terminate();
	}
	menu_card_close_click();
}

function menu_start_game_click() {
	game.StartAGame(menuStartAGameNumber, menuStartAGameDifficulty);
	while (visibleMenuCards.length > 0) {
		var topMenu = visibleMenuCards.pop();
		MenuCardPopUp(topMenu);
		MenuCardDisappear(topMenu);
	}
	HideTitle();
	ShowMenuButton();
	isMainMenuVisible = false;
}

function RestartGame() {
	HideDeadEndWarningView();
	game.StartAGame(game.gameNumber, game.gameDifficulty);
}

function menu_start_game_difficulty_click(difficulty) {
	
	var gameNumber = Math.round(Math.random()*(allGameSeeds.length-1))+1;
	if (difficulty == 'Easy') {
		gameNumber = GetNextEasyGameNumber();
	} else if (difficulty == 'Difficult') {
		gameNumber = GetNextDifficultGameNumber();
	}
	
	game.StartAGame(gameNumber, difficulty);
	while (visibleMenuCards.length > 0) {
		var topMenu = visibleMenuCards.pop();
		MenuCardPopUp(topMenu);
		MenuCardDisappear(topMenu);
	}
	HideTitle();
	ShowMenuButton();
	isMainMenuVisible = false;
}

function ShowDifficultiesSelectionMenu()
{
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	MenuCardAppear("menu_difficulty_selection");
}

function ShowInfoMenu()
{
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	MenuCardAppear("menu_info");
}

var isPickGameNumberMenuInitialized = false;

function ShowPickGameNumberMenu()
{
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	var input = document.getElementById("menu_pick_game_number_field");
	if (!isPickGameNumberMenuInitialized) {
		isPickGameNumberMenuInitialized = true;
		input.addEventListener("keyup", function(event) {
			if (event.key === "Enter") {
				GameNumberSelected();
			}
		});
	}

	document.getElementById("menu_pick_game_number_error_message").innerText = "";
	input.value = "";
	input.select();
	MenuCardAppear("menu_pick_game_number");
}

function GameNumberSelected()
{
	var gameNumber = parseInt(document.getElementById("menu_pick_game_number_field").value);
	if (isNaN(gameNumber) || gameNumber < 1 || gameNumber > 32000) {
		document.getElementById("menu_pick_game_number_error_message").innerText = "You must enter a game number between 1 and 32000";
	} else {
		document.getElementById("menu_pick_game_number_error_message").innerText = "";
		
		game.StartAGame(gameNumber, '');
		while (visibleMenuCards.length > 0) {
			var topMenu = visibleMenuCards.pop();
			MenuCardPopUp(topMenu);
			MenuCardDisappear(topMenu);
		}
		HideTitle();
		ShowMenuButton();
		isMainMenuVisible = false;
	}
}

function ShowSettingsMenu() {
	InitializeSettingsView();
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	MenuCardAppear("menu_settings");
}

function InitializeSettingsView() {
	var scrollDiv = document.getElementById('menu_settings_body');
	scrollDiv.scrollTop = 0;
	document.getElementById("setting_draw_one_card_checkbox").checked = GetSetting('setting_draw_one_card');
	document.getElementById("setting_thoughtful_checkbox").checked = GetSetting('setting_thoughtful');
	document.getElementById("setting_draw_pile_on_top_checkbox").checked = GetSetting('setting_draw_pile_on_top');
	document.getElementById("setting_autoplay_checkbox").checked = GetSetting('setting_autoplay');
	document.getElementById("setting_undo_checkbox").checked = GetSetting('setting_undo');
	document.getElementById("setting_hints_checkbox").checked = GetSetting('setting_hints');
	document.getElementById("setting_game_clock_checkbox").checked = GetSetting('setting_game_clock');
	document.getElementById("setting_game_number_checkbox").checked = GetSetting('setting_game_number');
	document.getElementById("setting_warn_dead_ends_checkbox").checked = GetSetting('setting_warn_dead_ends');
	document.getElementById("setting_right_handed_checkbox").checked = GetSetting('setting_right_handed');
	
	
	var board_color = GetSetting('setting_board_color');
	var allElems = document.getElementsByName('settings_boardbackground_selector');
	for (i = 0; i < allElems.length; i++) {
		if (allElems[i].type == 'radio' && allElems[i].value == board_color) {
			allElems[i].checked = true;
		}
	}
	
	var card_color = GetSetting('setting_card_color');
	var allElems = document.getElementsByName('settings_card_color_selector');
	for (i = 0; i < allElems.length; i++) {
		if (allElems[i].type == 'radio' && allElems[i].value == card_color) {
			allElems[i].checked = true;
		}
	}
}

function SettingDrawOneCardClicked(cb) {
	SetSetting('setting_draw_one_card', cb.checked);
	game.drawCount = cb.checked ? 1 : 3;
	gameHashToSimulationResults.clear();
	game.OnResizeWindow();
}

function SettingThoughtfulClicked(cb) {
	SetSetting('setting_thoughtful', cb.checked);
	var drawPileOnTop = GetSetting('setting_draw_pile_on_top');
	if (cb.checked && drawPileOnTop) {
		SetSetting('setting_draw_pile_on_top', false);
		document.getElementById('setting_draw_pile_on_top_checkbox').checked = false;
	}
	gameHashToSimulationResults.clear();
	game.OnChangedThoughtful();
	game.OnResizeWindow();
}

function SettingDrawPileOnTopClicked(cb) {
	SetSetting('setting_draw_pile_on_top', cb.checked);
	var isThoughtful = GetSetting('setting_thoughtful');
	if (cb.checked && isThoughtful) {
		SetSetting('setting_thoughtful', false);
		document.getElementById('setting_thoughtful_checkbox').checked = false;
		game.OnChangedThoughtful();
	}
	game.OnResizeWindow();
}

function SettingAutoplayClicked(cb) {
	SetSetting('setting_autoplay', cb.checked);
}

function SettingHintsClicked(cb) {
	SetSetting('setting_hints', cb.checked);
	game.UpdateShowHintButton();
}

function SettingUndoClicked(cb) {
	SetSetting('setting_undo', cb.checked);
	game.UpdateShowUndoButton();
}

function SettingGameClockClicked(cb) {
	SetSetting('setting_game_clock', cb.checked);
	game.UpdateShowClock();
}

function SettingGameNumberClicked(cb) {
	SetSetting('setting_game_number', cb.checked);
	game.UpdateShowGameNumber();
}

function SettingWarnDeadEndsClicked(cb) {
	SetSetting('setting_warn_dead_ends', cb.checked);
}

function SettingRightHandedClicked(cb) {
	SetSetting('setting_right_handed', cb.checked);
	game.OnResizeWindow();
}

function BoardSelectorClick(radio) {
	SetSetting('setting_board_color', radio.value);
	UpdateBackgroundImageFromSettings();
}

function UpdateBackgroundImageFromSettings() {
	var boardColor = GetSetting('setting_board_color');
	switch (boardColor){
		case 'wood_light':
			document.documentElement.style.backgroundImage = "url(images/woodlightboard.jpg)";
			document.getElementById('game_number_label').style.color = "#000000AA";
			document.getElementById('game_number').style.color = "#000000AA";
			break;
		case 'wood':
			document.documentElement.style.backgroundImage = "url(images/woodboard.jpg)";
			document.getElementById('game_number_label').style.color = "#000000AA";
			document.getElementById('game_number').style.color = "#000000AA";
			break;
		case 'wood_dark':
			document.documentElement.style.backgroundImage = "url(images/wooddarkboard.jpg)";
			document.getElementById('game_number_label').style.color = "#FFFFFFAA";
			document.getElementById('game_number').style.color = "#FFFFFFAA";
			break;
		case 'wood_gray':
			document.documentElement.style.backgroundImage = "url(images/woodgreyboard.jpg)";
			document.getElementById('game_number_label').style.color = "#000000AA";
			document.getElementById('game_number').style.color = "#000000AA";
			break;
		case 'green':
			document.documentElement.style.backgroundImage = "none";
			document.documentElement.style.backgroundColor = "#354216";
			document.getElementById('game_number_label').style.color = "#FFFFFFAA";
			document.getElementById('game_number').style.color = "#FFFFFFAA";
			break;
		case 'red':
			document.documentElement.style.backgroundImage = "none";
			document.documentElement.style.backgroundColor = "#C20A00";
			document.getElementById('game_number_label').style.color = "#000000AA";
			document.getElementById('game_number').style.color = "#000000AA";
			break;
		case 'blue':
			document.documentElement.style.backgroundImage = "none";
			document.documentElement.style.backgroundColor = "#071A5F";
			document.getElementById('game_number_label').style.color = "#FFFFFFAA";
			document.getElementById('game_number').style.color = "#FFFFFFAA";
			break;
	}
}

function CardSelectorClick(radio) {
	SetSetting('setting_card_color', radio.value);

	var cardBackURI = "url('images/card_back_" + radio.value + ".jpg')";
	var elements = document.getElementsByClassName('cardBack');
	for (var i=0; i<elements.length; i++)
	{
		elements[i].style.backgroundImage = cardBackURI;
	}
}

function ShowSolutionMenu() {
	LoadSolutionForGame();
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	MenuCardAppear("menu_solution");
}

function ShowStatisticsMenu() {
	var menuName = visibleMenuCards[visibleMenuCards.length-1];
	MenuCardPressDown(menuName);
	InitializeStatisticsView();
	MenuCardAppear("menu_statistics");
}

function InitializeStatisticsView() 
{
	document.getElementById('menu_stats_total_wins').innerText = GetStatistic('stat_total_games_won') + " of " + GetStatistic('stat_games_started');
	document.getElementById('menu_stats_easy_wins').innerText = GetStatistic('stat_easy_games_won') + " of " + GetStatistic('stat_next_easy_game_number_index');
	document.getElementById('menu_stats_difficult_wins').innerText = GetStatistic('stat_difficult_games_won') + " of " + GetStatistic('stat_next_difficult_game_number_index');

	var totalSeconds = GetStatistic('stat_least_time');
	var minutes = Math.floor(totalSeconds/60);
	var seconds = totalSeconds - minutes*60;
	document.getElementById('menu_stats_least_time').innerText = minutes + ":" + seconds.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
	document.getElementById('menu_stats_least_moves').innerText = GetStatistic('stat_least_moves');
	document.getElementById('menu_stats_least_hints').innerText = GetStatistic('stat_least_hints');
	document.getElementById('menu_stats_least_undos').innerText = GetStatistic('stat_least_undos');
}

function ResetStatisticsButtonClick() {
	var r = confirm("Are you sure you want to reset your statistics?");
	if (r != true) {
		return;
	}

	var statsToReset = [
		'stat_games_started',
		'stat_next_game_number',
		'stat_next_easy_game_number_index',
		'stat_next_difficult_game_number_index',
		'stat_total_games_won',
		'stat_easy_games_won',
		'stat_difficult_games_won',
		'stat_least_time',
		'stat_least_moves',
		'stat_least_hints',
		'stat_least_undos'
	];
	for (var i=0; i<statsToReset.length; i++) {
		var statName = statsToReset[i];
		window.localStorage.removeItem(statName);
	}
	
	InitializeStatisticsView();
}

function onGameOverCloseClick() {
	var el = document.getElementById('GameOverView');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s ease-in";
		top = "100%";
		opacity = 0;
		pointerEvents = "none";
	}
	ShowMainMenu(false);
}

function OnGameOverStartGameButtonClick() {
	var el = document.getElementById('GameOverView');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s ease-in";
		top = "100%";
		opacity = 0;
		pointerEvents = "none";
	}
	ShowMenuButton();
	game.StartAGame(gameOverNextGameNumber, gameOverNextGameDifficulty);
}

var isSolutionViewInitialized = false;
var solutionGame;
var cardLoweredHeightSolutionView;
var cardLoweredWidthSolutionView;
var tableauStackVerticalOffsetSolutionView;
var tableauStackFaceDownVerticalOffsetSolutionView;
var tableausLeftSolutionView;
var tableausTopSolutionView;
var tableausSpacingSolutionView = 1;
var deckStackHorizontalSpacingSolutionView;
var deckTopSolutionView;
var deckLeftSolutionView;
var flippedCardsLeftSolutionView;
var flippedCardsOverlapSpacingSolutionView;
var foundationsTopSolutionView = 2;
var foundationsLeftSolutionView;
var foundationsSpacingSolutionView = 1;
var foundationBasesSolutionView = [];
var deckBaseSolutionView;
var tableauBasesSolutionView = [];
var cardIdsToCardViews = {};
var solutionViewForwardMoves = [];

var cardsSolutionView = [
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

function LoadSolutionForGame() 
{
	var isThoughtful = GetSetting('setting_thoughtful');
	DeterminePositionsForStackBasesForSolutionView();
	
	if (!isSolutionViewInitialized) 
	{
		var belowCanvas = document.getElementById('menu_solution_canvas');

		// Create foundation bases
		var foundationHearts = document.createElement('div');
		foundationHearts.className = 'foundation_base';
		foundationHearts.style.width = cardLoweredWidthSolutionView + "px";
		foundationHearts.style.height = cardLoweredHeightSolutionView + "px";
		foundationHearts.style.backgroundImage = "url('images/FoundationHearts.png')";
		belowCanvas.appendChild(foundationHearts);
		foundationBasesSolutionView.push(foundationHearts);
		var foundationClubs = document.createElement('div');
		foundationClubs.className = 'foundation_base';
		foundationClubs.style.width = cardLoweredWidthSolutionView + "px";
		foundationClubs.style.height = cardLoweredHeightSolutionView + "px";
		foundationClubs.style.backgroundImage = "url('images/FoundationClubs.png')";
		belowCanvas.appendChild(foundationClubs);
		foundationBasesSolutionView.push(foundationClubs);
		var foundationDiamonds = document.createElement('div');
		foundationDiamonds.className = 'foundation_base';
		foundationDiamonds.style.width = cardLoweredWidthSolutionView + "px";
		foundationDiamonds.style.height = cardLoweredHeightSolutionView + "px";
		foundationDiamonds.style.backgroundImage = "url('images/FoundationDiamonds.png')";
		belowCanvas.appendChild(foundationDiamonds);
		foundationBasesSolutionView.push(foundationDiamonds);
		var foundationSpades = document.createElement('div');
		foundationSpades.className = 'foundation_base';
		foundationSpades.style.width = cardLoweredWidthSolutionView + "px";
		foundationSpades.style.height = cardLoweredHeightSolutionView + "px";
		foundationSpades.style.backgroundImage = "url('images/FoundationSpades.png')";
		belowCanvas.appendChild(foundationSpades);
		foundationBasesSolutionView.push(foundationSpades);
		
		// Deck base
		deckBaseSolutionView = document.createElement('div');
		deckBaseSolutionView.className = 'stack_base';
		deckBaseSolutionView.style.width = cardLoweredWidthSolutionView + "px";
		deckBaseSolutionView.style.height = cardLoweredHeightSolutionView + "px";
		deckBaseSolutionView.style.opacity = "1";
		belowCanvas.appendChild(deckBaseSolutionView);
		
		// Tableau Bases
		for (var i=0; i<7; i++) {
			var tableauBase = document.createElement('div');
			tableauBase.className = 'stack_base';
			tableauBase.style.width = cardLoweredWidthSolutionView + "px";
			tableauBase.style.height = cardLoweredHeightSolutionView + "px";
			tableauBase.style.opacity = "1";
			belowCanvas.appendChild(tableauBase);
			tableauBasesSolutionView.push(tableauBase);
		}

		// Cards
		var cardElement = document.createElement("div");
		cardElement.className = "card";
		cardElement.style.width = cardLoweredWidthSolutionView + "px";
		cardElement.style.height = cardLoweredHeightSolutionView + "px";
		var raiseContainer = document.createElement("div");
		raiseContainer.className = "raiseContainer";
		raiseContainer.style.width = cardLoweredWidthSolutionView + "px";
		raiseContainer.style.height = cardLoweredHeightSolutionView + "px";
		raiseContainer.style.borderRadius = "2px";
		cardElement.appendChild(raiseContainer);
		var styleSheet = document.createElement("style");
		cardElement.appendChild(styleSheet);
		var shadow = document.createElement("div");
		shadow.className = "cardShadow";
		shadow.style.width = cardLoweredWidthSolutionView + "px";
		shadow.style.height = cardLoweredHeightSolutionView + "px";
		shadow.style.borderRadius = "2px";
		raiseContainer.appendChild(shadow);
		var flipContainer = document.createElement("div");
		flipContainer.className = "cardFlipContainer";
		flipContainer.style.width = cardLoweredWidthSolutionView + "px";
		flipContainer.style.height = cardLoweredHeightSolutionView + "px";
		raiseContainer.appendChild(flipContainer);
		var back = document.createElement("div");
		back.className = "cardBack";
		back.style.width = cardLoweredWidthSolutionView + "px";
		back.style.height = cardLoweredHeightSolutionView + "px";
		back.style.borderRadius = "2px";
		var backShade = document.createElement("div");
		backShade.className = "cardFrontShade";
		backShade.style.width = cardLoweredWidthSolutionView + "px";
		backShade.style.height = cardLoweredHeightSolutionView + "px";
		backShade.style.borderRadius = "2px";
		back.appendChild(backShade);
		flipContainer.appendChild(back);
		var front = document.createElement("div");
		front.className = "cardFront";
		front.style.width = cardLoweredWidthSolutionView + "px";
		front.style.height = cardLoweredHeightSolutionView + "px";
		front.style.borderRadius = "2px";
		flipContainer.appendChild(front);

		var cards_region = document.getElementById('menu_solution_cards_region');
		var cardBackURI = "url('images/card_back_" + GetSetting('setting_card_color') + ".jpg')";
		for (var i = 0; i < cardsSolutionView.length; i++) {
			var newCard = cardElement.cloneNode(true);
			var card = cardsSolutionView[i];
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
			cards_region.appendChild(newCard);
			cardIdsToCardViews[card.id] = card.cardView;
		}

		isSolutionViewInitialized = true;
	}

	// Configure all the cardviews depending on isThoughtful
	var cardBackURI = "url('images/card_back_" + GetSetting('setting_card_color') + ".jpg')";
	for (var i=0; i<cardsSolutionView.length; i++) {
		var card = cardsSolutionView[i];
		var cardView = cardIdsToCardViews[card.id];
		if (isThoughtful) {
			cardView.getElementsByClassName('cardBack')[0].style.backgroundImage = card.image;
			cardView.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0.3;
		} else {
			cardView.getElementsByClassName('cardBack')[0].style.backgroundImage = cardBackURI;
			cardView.getElementsByClassName('cardBack')[0].children[0].style.opacity = 0;
		}
	}

	// Position All Stacks
	var curLeft = foundationsLeftSolutionView;
	var curTop = foundationsTopSolutionView;
	for (var i=0; i<foundationBasesSolutionView.length; i++) {
        var foundation = foundationBasesSolutionView[i];
        foundation.style.left = curLeft + "px";
		foundation.style.top = curTop + "px"; 
		foundation.style.opacity = "1";
		curLeft += cardLoweredWidthSolutionView + foundationsSpacingSolutionView; 
	}
	deckBaseSolutionView.style.left = deckLeftSolutionView + "px";
	deckBaseSolutionView.style.top = deckTopSolutionView + "px";
	curLeft = tableausLeftSolutionView;
	curTop = tableausTopSolutionView;
	for (var i=0; i<tableauBasesSolutionView.length; i++) {
		var tableau = tableauBasesSolutionView[i];
		tableau.style.left = curLeft + "px";
		tableau.style.top = curTop + "px"; 
		curLeft += cardLoweredWidthSolutionView + tableausSpacingSolutionView; 
	}

	solutionGame = GenerateGameClone(game);
	for (var i=0; i<game.moves.length; i++) {
		var move = game.moves[i];
		var moveClone = {
			startIndex: move.startIndex,
			endIndex: move.endIndex,
			cardCount: move.cardCount,
			drawCount: move.drawCount,
			deckIndex: move.deckIndex,
			moveResetsDeck: move.moveResetsDeck,
			premoveDeckFlipCount: move.premoveDeckFlipCount,
			premoveDrawCount: move.premoveDrawCount,
			moveCardID: move.moveCard ? move.moveCard.id : ''
		}
		solutionGame.moves.push(moveClone);
	}

	PositionAllCardViewsSolutionView(false);

	document.getElementById('menu_solution_message').innerText = "Thinking...";
	document.getElementById('menu_solution_moves').innerText = "";
	document.getElementById('menu_solution_back_button').style.opacity = "0.5";
	document.getElementById('menu_solution_forward_button').style.opacity = "0.5";
	document.getElementById('menu_solution_thinking').style.visibility = 'visible';

	game.GenerateGameStateHash();
	var gameSimulatorResult = gameHashToSimulationResults.get(game.gameStateHash);
	if (gameSimulatorResult && gameSimulatorResult.resultFound) {
		OnFinishedGameSimulationWithResult(gameSimulatorResult);
	} else {
		SearchForSolution(solutionGame);
	}
}

function DeterminePositionsForStackBasesForSolutionView() {
	var mainCanvas = document.getElementById('menu_solution_canvas');
	var canvasWidth = mainCanvas.offsetWidth;
	var canvasHeight = mainCanvas.offsetHeight;
	cardLoweredHeightSolutionView = canvasHeight / 7;
	cardLoweredWidthSolutionView = cardLoweredHeightSolutionView * (115/162);
	flippedCardsOverlapSpacingSolutionView = cardLoweredWidthSolutionView * 0.4;

	var deckLocationTop = GetSetting('setting_draw_pile_on_top');
	var rightHanded = GetSetting('setting_right_handed');
	var isThoughtful = GetSetting('setting_thoughtful');
	tableauStackVerticalOffsetSolutionView = cardLoweredHeightSolutionView * 0.380377;
	tableauStackFaceDownVerticalOffsetSolutionView = isThoughtful ? tableauStackVerticalOffsetSolutionView : cardLoweredHeightSolutionView * 0.126792;
	tableausLeftSolutionView = (canvasWidth - cardLoweredWidthSolutionView*7 - tableausSpacingSolutionView*6)*0.5;
	tableausTopSolutionView = foundationsTopSolutionView + cardLoweredHeightSolutionView + 2;
	if (deckLocationTop) {
		deckStackHorizontalSpacingSolutionView = 0;
		var topRowWidth = cardLoweredWidthSolutionView*7 + tableausSpacingSolutionView*6;
		deckTopSolutionView = foundationsTopSolutionView;
		if (rightHanded) {
			foundationsLeftSolutionView = (canvasWidth - topRowWidth)*0.5;
			deckLeftSolutionView = foundationsLeftSolutionView + 4*(cardLoweredWidthSolutionView + foundationsSpacingSolutionView) + 5;
			flippedCardsLeftSolutionView = deckLeftSolutionView + cardLoweredWidthSolutionView + tableausSpacingSolutionView + 5;
		} else {
			foundationsLeftSolutionView = (canvasWidth - topRowWidth)*0.5 + topRowWidth - (cardLoweredWidthSolutionView*4 + foundationsSpacingSolutionView*3);
			deckLeftSolutionView = (canvasWidth - topRowWidth)*0.5;
			flippedCardsLeftSolutionView = deckLeftSolutionView + cardLoweredWidthSolutionView + 5;
		}
	} else {
		deckStackHorizontalSpacingSolutionView = rightHanded ? cardLoweredWidthSolutionView*0.1 : -cardLoweredWidthSolutionView*0.1;
		var topRowWidth = cardLoweredWidthSolutionView*4 + foundationsSpacingSolutionView*3;
		foundationsLeftSolutionView = (canvasWidth - topRowWidth)*0.5;
		deckTopSolutionView = canvasHeight - cardLoweredHeightSolutionView - 1;
		deckLeftSolutionView = (canvasWidth - cardLoweredWidthSolutionView)*0.5;
		if (rightHanded) {
			flippedCardsLeftSolutionView = deckLeftSolutionView + cardLoweredWidthSolutionView + 10;
		} else {
			flippedCardsLeftSolutionView = deckLeftSolutionView - 10 - cardLoweredWidthSolutionView - 2*flippedCardsOverlapSpacingSolutionView;
		}
	}
}

function PositionAllCardViewsSolutionView(animate) 
{
	// Position foundation cards
	var animateDuration = 200;
	var curLeft = foundationsLeftSolutionView;
	var curTop = foundationsTopSolutionView;
	for (var i=0; i<4; i++) {
		var foundation = solutionGame.foundations[i];
		for (var j=0; j<foundation.length; j++) {
			var card = foundation[j];
			var cardView = cardIdsToCardViews[card.id];
			cardView.stackIndex = card.suitInt;
			lowerCard(cardView);
			cardView.style.zIndex = j+1;
			if (animate) {
				flipUpCard(cardView, true);
				with (cardView.style) {
					transition = animateDuration + "ms ease-out";
					animationDelay = "";
					left = curLeft + "px";
					top = curTop + "px";
					visibility = "visible";
				}
			} else {
				flipUpCard(cardView, false);
				with (cardView.style) {
					transition = "none";
					animationDelay = "";
					left = curLeft + "px";
					top = curTop + "px";
					visibility = "visible";
				}
			}
		}
		curLeft += cardLoweredWidthSolutionView + foundationsSpacingSolutionView;
	}

	// Position tableau cards
	var isDeckOnTop = GetSetting('setting_draw_pile_on_top');
	var isThoughtful = GetSetting('setting_thoughtful');
	var bottomLimit = isDeckOnTop ? document.getElementById('menu_solution_cards_region').offsetHeight - 0.2*cardLoweredHeightSolutionView : deckTopSolutionView - 0.2*cardLoweredHeightSolutionView;
	curLeft = tableausLeftSolutionView;
	for (var i=0; i<7; i++) {
		var tableau = solutionGame.tableaus[i];
		
		var compressionScalar = 1;
		var curTableauStackHeight = cardLoweredHeightSolutionView;
		for (var k=1; k<tableau.length; k++) {
			var card = tableau[k-1];
			curTableauStackHeight += card.isFaceDown ? tableauStackFaceDownVerticalOffsetSolutionView : tableauStackVerticalOffsetSolutionView;
		}
		if (tableausTopSolutionView + curTableauStackHeight > bottomLimit) {
			compressionScalar = (bottomLimit - tableausTopSolutionView - cardLoweredHeightSolutionView) / (curTableauStackHeight - cardLoweredHeightSolutionView);
		}

		curTop = tableausTopSolutionView;
		for (var j=0; j<tableau.length; j++) {
			var card = tableau[j];
			var cardView = cardIdsToCardViews[card.id];
			card.isFaceDown ? flipDownCard(cardView, animate) : flipUpCard(cardView, animate);
			cardView.stackIndex = i+4;
			cardView.stackDepth = tableau.length - j - 1;
			lowerCard(cardView);
			cardView.style.zIndex = j+1;
			if (animate) {
				with (cardView.style) {
					transition = animateDuration + "ms ease-out";
					animationDelay = "";
					left = curLeft + "px";
					top = curTop + "px";
					visibility = "visible";
				}
			} else {
				with (cardView.style) {
					transition = "none";
					animationDelay = "";
					left = curLeft + "px";
					top = curTop + "px";
					visibility = "visible";
				}
			}
		
			curTop += card.isFaceDown ? tableauStackFaceDownVerticalOffsetSolutionView*compressionScalar : tableauStackVerticalOffsetSolutionView*compressionScalar;
		}
		curLeft += cardLoweredWidthSolutionView + tableausSpacingSolutionView;
	}

	// Position the deck cards
	if (isThoughtful) 
	{
		var mainCanvas = document.getElementById('menu_solution_canvas');
		var canvasWidth = mainCanvas.offsetWidth;
		var canvasHeight = mainCanvas.offsetHeight;
		var left = 2;
		var right = canvasWidth - left - cardLoweredWidthSolutionView;
		var stackWidth = right - left;
		var horizontalSpacing = solutionGame.deck.length > 1 ? stackWidth / (solutionGame.deck.length-1) : cardLoweredWidthSolutionView+1;
		if (horizontalSpacing > cardLoweredWidthSolutionView) {
			horizontalSpacing = cardLoweredWidthSolutionView;
			stackWidth = solutionGame.deck.length * horizontalSpacing;
			left = (canvasWidth - stackWidth)*0.5;
		} 
		var horizontalOffset = left;
		for (var i=0; i<solutionGame.deck.length; i++) {
			var card = solutionGame.deck[i];
			var cardView = cardIdsToCardViews[card.id];
			lowerCard(cardView);
			cardView.stackDepth = 0;
			cardView.stackIndex = -1;
			flipDownCard(cardView, false);
			if (animate) {
				with (cardView.style) {
					transition = animateDuration + "ms ease-out";
					animationDelay = "";
					left = horizontalOffset + "px";
					top = deckTopSolutionView + "px";
				}
			} else {
				with (cardView.style) {
					transition = "none";
					animationDelay = "";
					left = horizontalOffset + "px";
					top = deckTopSolutionView + "px";
				}
			}
			cardView.style.zIndex = i+1;
			horizontalOffset += horizontalSpacing;
		}
	} else {

		var curZIndex = 26 - (solutionGame.deck.length-1 - solutionGame.deckIndex);
		var curLeftOffset = (solutionGame.deck.length-1 - solutionGame.deckIndex-1)*deckStackHorizontalSpacingSolutionView;
		for (var i=solutionGame.deck.length-1; i>solutionGame.deckIndex; i--) {
			var card = solutionGame.deck[i];
			var cardView = cardIdsToCardViews[card.id];
			flipDownCard(cardView, false);
			lowerCard(cardView);
			cardView.stackIndex = -1;
			cardView.stackDepth = 0;
			cardView.style.zIndex = curZIndex;
			if (animate) {
				with (cardView.style) {
					transition = animateDuration + "ms ease-out";
					animationDelay = "";
					left = deckLeftSolutionView - curLeftOffset + "px";
					top = deckTopSolutionView + "px";
				}
			} else {
				with (cardView.style) {
					transition = "none";
					animationDelay = "";
					left = deckLeftSolutionView - curLeftOffset + "px";
					top = deckTopSolutionView + "px";
				}
			}
		
			curZIndex++;
			curLeftOffset -= deckStackHorizontalSpacingSolutionView;
		}

		for (var i=0; i<=solutionGame.deckIndex; i++) {
			var card = solutionGame.deck[i];
			var cardView = cardIdsToCardViews[card.id];
			var offset = 0;
			if (i == solutionGame.deckIndex-1) {
				if (i==0) {
					offset = 0;
				} else {
					offset = flippedCardsOverlapSpacingSolutionView;
				}
			} else if (i == solutionGame.deckIndex) {
				if (i==0) {
					offset = 0;
				} else if (i==1) {
					offset = flippedCardsOverlapSpacingSolutionView;
				} else {
					offset = flippedCardsOverlapSpacingSolutionView*2;
				}
			}
			curLeft = flippedCardsLeftSolutionView + offset;
			flipUpCard(cardView, false);
			lowerCard(cardView);
			var zOffset = i==solutionGame.deckIndex ? 2 : 0;
			cardView.style.zIndex = 24 - solutionGame.deckIndex + i + zOffset;
			cardView.stackIndex = -1;
			cardView.stackDepth = 0;
			if (animate) {
				with (cardView.style) {
					transition = animateDuration + "ms ease-out";
					animationDelay = "";
					left = curLeft + "px";
					top = deckTopSolutionView + "px";
				}
			} else {
				with (cardView.style) {
					transition = "none";
					animationDelay = "";
					left = curLeft + "px";
					top = deckTopSolutionView + "px";
				}
			}
		}
	}
}

var solutionViewWorker;

function SearchForSolution(gameClone) {
	if (solutionViewWorker) {
		solutionViewWorker.terminate();
	}
	solutionViewWorker = new Worker('GameSimulator.js');
    solutionViewWorker.addEventListener('message', function(e){
        var data = e.data;
        var result = e.data.result;
        switch (data.cmd) {
            case 'OnFinishedGameSimulation':
				OnFinishedGameSimulationWithResult(result);
            break;
        }
    }, false);

    solutionViewWorker.postMessage({
        cmd: 'FindSolutionForGame',
        game: gameClone,
        timeOut: -1
    });
}

function OnFinishedGameSimulationWithResult(gameSimulatorResult) {
	gameHashToSimulationResults.set(gameSimulatorResult.initialHash, gameSimulatorResult);

	if (gameSimulatorResult.resultFound && !gameSimulatorResult.isDeadEnd) {
		solutionViewForwardMoves = [];
		var deckDrawCount = 0;
		for (var i=0; i<gameSimulatorResult.solutionMoves.length; i++) {
			var move = gameSimulatorResult.solutionMoves[i];
			if (move.drawCount > 0) {
				deckDrawCount++;
			}
			solutionViewForwardMoves.push(move);
		}
		var stackMoveCount = gameSimulatorResult.solutionMoves.length - deckDrawCount;
		if (solutionGame.moves.length > 0) {
			document.getElementById('menu_solution_message').innerHTML = "You can win in " + stackMoveCount + " more moves!<br>(+" + deckDrawCount + " draws from the deck)";
		} else {
			document.getElementById('menu_solution_message').innerHTML = "You can win in " + stackMoveCount + " moves!<br>(+" + deckDrawCount + " draws from the deck)";			
		}
	} else {
		document.getElementById('menu_solution_message').innerHTML = "No productive moves left<br>This game is at a dead end.";
	}

	document.getElementById('menu_solution_thinking').style.visibility = "hidden";
	PositionAllCardViewsSolutionView(true);
	UpdateSolutionViewMovesCountAndButtons();
}

function UpdateSolutionViewMovesCountAndButtons() {
	if (solutionGame.moves.length == 0) {
		document.getElementById('menu_solution_back_button').style.opacity = "0.5";
	} else {
		document.getElementById('menu_solution_back_button').style.opacity = "1";
	}
	if (solutionViewForwardMoves.length == 0) {
		document.getElementById('menu_solution_forward_button').style.opacity = "0.5";
	} else {
		document.getElementById('menu_solution_forward_button').style.opacity = "1";
	}
	document.getElementById('menu_solution_moves').innerText = solutionGame.moves.length + "/" + (solutionGame.moves.length + solutionViewForwardMoves.length);
}

function OnSolutionBackButtonClick() {
	if (solutionGame.moves.length == 0) {
		return;
	}

	var lastMove = solutionGame.moves[solutionGame.moves.length-1];
	if (GetSetting('setting_thoughtful')) {
		while (lastMove.drawCount > 0) {
			GameSimulatorUndoLastMove();
			solutionViewForwardMoves.unshift(lastMove);
			if (solutionGame.moves.length>0) {
				lastMove = solutionGame.moves[solutionGame.moves.length-1];
			} else {
				lastMove = null;
				break;
			}
		}
	}

	if (lastMove != null) {
		GameSimulatorUndoLastMove();
		solutionViewForwardMoves.unshift(lastMove);
	}

	PositionAllCardViewsSolutionView(true);
	UpdateSolutionViewMovesCountAndButtons();

}

function OnSolutionForwardButtonClick() {
	if (solutionViewForwardMoves.length == 0) {
		return;
	}
	var move = solutionViewForwardMoves[0];
	solutionViewForwardMoves.splice(0,1);
	if (GetSetting('setting_thoughtful')) {
		while (move.drawCount>0) {
			SolutionViewApplyMove(move);
			if (solutionViewForwardMoves.length>0) {
				move = solutionViewForwardMoves[0];
				solutionViewForwardMoves.splice(0,1);
			} else {
				move = null;
				break;
			}
		}
	}

	if (move != null) {
		SolutionViewApplyMove(move);	
	}

	PositionAllCardViewsSolutionView(true);
	UpdateSolutionViewMovesCountAndButtons();
}

var SolutionViewApplyMove = function(move) 
{
    if (move.drawCount > 0) {
        if (solutionGame.deckIndex == solutionGame.deck.length-1) {
            move.moveResetsDeck = true;
            solutionGame.deckIndex = move.drawCount - 1;
            if (solutionGame.deckIndex >= solutionGame.deck.length) {
                solutionGame.deckIndex = solutionGame.deck.length-1;
            }
        } else {
            solutionGame.deckIndex += move.drawCount;
            if (solutionGame.deckIndex >= solutionGame.deck.length) {
                move.drawCount = solutionGame.deck.length-1 - (solutionGame.deckIndex-move.drawCount);
                solutionGame.deckIndex = solutionGame.deck.length-1;
            }
        }
    } else if (move.startIndex == -2) {
        var card = solutionGame.deck[move.deckIndex];
        solutionGame.deck.splice(move.deckIndex, 1);
        solutionGame.deckIndex = move.deckIndex-1;
        if (solutionGame.deckIndex >= solutionGame.deck.length-1) {
            solutionGame.deckIndex = solutionGame.deck.length-1;
        }
        card.tableauIndex = move.endIndex;
        if (move.endIndex < 4) {
            solutionGame.foundations[move.endIndex].push(card);
        } else {
            solutionGame.tableaus[move.endIndex-4].push(card);
        }
    } else if (move.startIndex == -1) {
        var card = solutionGame.deck[move.deckIndex];
        solutionGame.deck.splice(move.deckIndex, 1);
        card.tableauIndex = move.endIndex;
        if (move.endIndex<4) {
            solutionGame.foundations[move.endIndex].push(card);
        } else {
            solutionGame.tableaus[move.endIndex-4].push(card);
        }
        solutionGame.deckIndex--;
    } else {
        // Remove from previous tableau
        var movingCards = [];
        var tableau = solutionGame.tableaus[move.startIndex-4];
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
                solutionGame.foundations[move.endIndex].push(card);
            } else {
                solutionGame.tableaus[move.endIndex-4].push(card);
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

    solutionGame.moves.push(move);
}

var GameSimulatorUndoLastMove = function() {
    if (solutionGame.moves.length>0) {
        var lastMove = solutionGame.moves[solutionGame.moves.length-1];
        if (lastMove.drawCount > 0) {
            solutionGame.deckIndex -= lastMove.drawCount;
            if (solutionGame.deckIndex < 0 && lastMove.moveResetsDeck) {
                solutionGame.deckIndex = solutionGame.deck.length-1;
            }
        } else {
            if (lastMove.moveExposedStackCard) {
                var tableau = solutionGame.tableaus[lastMove.startIndex-4];
                var stackCard = tableau[tableau.length-1];
                stackCard.isFaceDown = true;
            }

            var movingCards = [];
            if (lastMove.endIndex < 4) {
                var foundation = solutionGame.foundations[lastMove.endIndex];
                movingCards.push(foundation[foundation.length-1]);
                foundation.splice(foundation.length-1, 1);
            } else {
                var tableau = solutionGame.tableaus[lastMove.endIndex-4];
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
                    solutionGame.deckIndex++;
                    if (solutionGame.deckIndex >= solutionGame.deck.length) {
                        solutionGame.deck.push(card);
                    } else {
                        solutionGame.deck.splice(solutionGame.deckIndex, 0, card);
                    }
                } else if (lastMove.startIndex < 0) {
                    card.tableauIndex = -1;
                    solutionGame.deckIndex = lastMove.deckIndex;
                    if (solutionGame.deckIndex >= solutionGame.deck.length) {
                        solutionGame.deck.push(card);
                    } else {
                        solutionGame.deck.splice(solutionGame.deckIndex, 0, card);
                    }
                    solutionGame.deckIndex = lastMove.premoveStackIndex;
                } else {
                    card.tableauIndex = lastMove.startIndex;
                    solutionGame.tableaus[lastMove.startIndex-4].push(card);
                }
            }
        }
        solutionGame.moves.splice(solutionGame.moves.length-1, 1);
    }
}

function PlayMoreGamesButtonPressed() {
	var el = document.getElementById('play_more_games_menu');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.8s cubic-bezier(0.175, 0.885, 0.320, 1.275)";
		bottom = '10pt';
		opacity = 1;
		pointerEvents = "auto";
	}
}

function play_more_games_close_click() {
	var el = document.getElementById('play_more_games_menu');
	with(el.style) {
		WebkitTransition = MozTransition = OTransition = msTransition = "0.4s ease-in";
		bottom = "-200pt";
		opacity = 0;
		pointerEvents = "none";
	}
}

