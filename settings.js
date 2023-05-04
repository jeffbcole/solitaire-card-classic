var setting_board_color_default = 'wood';
var setting_card_color_default = 'blue';
var setting_draw_one_card_default = false;
var setting_thoughtful_default = false;
var setting_draw_pile_on_top_default = false;
var setting_autoplay_default = true;
var setting_undo_default = true;
var setting_hints_default = true;
var setting_game_clock_default = true;
var setting_game_number_default = true;
var setting_warn_dead_ends_default = true;
var setting_right_handed_default = true;

function GetSetting(setting) {
	switch (setting) {
		case "setting_board_color":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_board_color_default : settingVal;
			break;
		case "setting_card_color":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_card_color_default : settingVal;
			break;
		case "setting_draw_one_card":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_draw_one_card_default : (settingVal == 'true');
			break;
		case "setting_thoughtful":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_thoughtful_default : (settingVal == 'true');
			break;
		case "setting_draw_pile_on_top":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_draw_pile_on_top_default : (settingVal == 'true');
			break;
		case "setting_autoplay":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_autoplay_default : (settingVal == 'true');
			break;
		case "setting_undo":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_undo_default : (settingVal == 'true');
			break;
		case "setting_hints":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_hints_default : (settingVal == 'true');
			break;
		case "setting_game_clock":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_game_clock_default : (settingVal == 'true');
			break;
		case "setting_game_number":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_game_number_default : (settingVal == 'true');
			break;
		case "setting_warn_dead_ends":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_warn_dead_ends_default : (settingVal == 'true');
			break;
		case "setting_right_handed":
			var settingVal = window.localStorage.getItem(setting);
			return settingVal == null ? setting_right_handed_default : (settingVal == 'true');
			break;
		
	}
}

function SetSetting(setting, val) {
	window.localStorage.setItem(setting, val);
}

function GetStatistic(statistic) {
    var val = window.localStorage.getItem(statistic);
    return val == null ? Number(0) : Number(val);
}

function GetStatisticString(statistic) {
	var val = window.localStorage.getItem(statistic);
	return val == null ? "" : val;
}

function SetStatistic(statistic, value) {
	window.localStorage.setItem(statistic, value);
}

function GetFirstEasyGameNumber() {
	return easyGameNumbers[0];
}

function GetNextEasyGameNumber() {
	var nextEasyIndex = GetStatistic('stat_next_easy_game_number_index');
	return easyGameNumbers[nextEasyIndex%easyGameNumbers.length];
}

function IncrementEasyGameIndex() {
	var statID = 'stat_next_easy_game_number_index';
	SetStatistic(statID, GetStatistic(statID)+1);
}

function GetNextDifficultGameNumber() {
	var nextDifficultIndex = GetStatistic('stat_next_difficult_game_number_index');
	return difficultGameNumbers[nextDifficultIndex%difficultGameNumbers.length];
}

function IncrementDifficultGameIndex() {
	var statID = 'stat_next_difficult_game_number_index';
	SetStatistic(statID, GetStatistic(statID)+1);
}

function redirectToAppStore() {
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
	if (/android/i.test(userAgent)) {
		window.location.replace("https://play.google.com/store/apps/details?id=com.gamesbypost.solitairecardclassic");
		return true;
	}
  
	if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
		window.location.replace("https://apps.apple.com/us/app/solitaire-card-classic/id1671213894");
		return true;
	}
	
	return false;
}