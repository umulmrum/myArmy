/*
 * Copyright 2012-2014 Stefan Kruppa
 * 
 * This file is part of myArmy.
 *
 * myArmy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as 
 * published by the Free Software Foundation, either version 3 of 
 * the License, or (at your option) any later version.
 *
 * myArmy is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public 
 * License along with myArmy.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

"use strict";

var _dispatcher = null;
var _state = null;
var _dataReader = null;
var _dataStore = null;
var _systems = []; // all game systems
var _systemState = null;
var _armyState = null;
var _persistence = null;
var _controller = null;
var _guiState = null;
var _gui = null;
var _extensionManager = null;

/**
 * init() initializes the system. It is called when the system is initially loaded or when a restart is required (which
 * is the case when the user calls a saved army from a bookmark. The browser won't reload the page then, so we need to
 * re-initialize by hand).
 */
function init() {

	initVars();
	_dispatcher.deactivateEvents();
	_gui.startLongRunningProcess();
	initDevice();
	// After this point the event system is initialized.
	// Do not register events (jQuery or myArmy) before this comment.
	_extensionManager.reset();
	_gui.onResizeContainer();
	_extensionManager.initExtensions();
	_dataReader.readSystems();
	initUserState();
    
    if(_systemState.system == null) {
    	_controller.changeSystem(1); // set directly as long as only 1 system is supported ...
    }
	
    // TODO decouple
	if(_armyState.getDetachmentCount() > 0) {
		_guiState.currentContent = "design";
	} else {
		_guiState.currentContent = "mainmenu";
	}

	_dispatcher.activateEvents();
	_dispatcher.triggerEvent("postInit");
}

function initVars() {
	_dispatcher = new Dispatcher();
	_state = new State();
	_state.init();
	_dataReader = new DataReader();
	_dataReader.init();
	_dataStore = new DataStore();
	_systemState = new SystemState();
	_armyState = new ArmyState();
	_persistence = new Persistence();
	_persistence.init();
	_controller = new Controller();
	_guiState = new GuiState();
	_gui = new Gui();
	_gui.init();
	_extensionManager = new ExtensionManager();
}

/**
 * initDevice() tries to determine the user's device and user agent. After that, if it detected that the device is a touch device, it
 * initializes touch support.
 * The detected device is saved in _guiState.device. It is one of:
 * - desktop (default)
 * - android
 * - firefox 
 * - iemobile
 * - appleMobile (iPhone or iPad)
 * 
 * The detected user agent is saved in _guiState.userAgent. It is one of:
 * - iedesktop
 * - firefox
 * - opera 
 */
function initDevice() {
	var userAgent = navigator.userAgent.toLowerCase();
	
	if((userAgent.indexOf("iphone") != -1) || (userAgent.indexOf("ipad") != -1)) {
		_guiState.device = "appleMobile";
	} else if(userAgent.indexOf("android") != -1) {
		_guiState.device = "android";
	} else if(userAgent.indexOf("trident") != -1) {
		_guiState.userAgent = "iedesktop";
	} else if((userAgent.indexOf("msie") != -1) && (userAgent.indexOf("mobile") != -1)) {
		_guiState.device = "iemobile";
	} else if(userAgent.indexOf("mozilla") != -1) {
		_guiState.userAgent = "firefox";
	}
	
	if(userAgent.indexOf("opera") != -1) {
		_guiState.userAgent = "opera";
	}
	
	if((_guiState.device == "appleMobile" || _guiState.device == "android" || _guiState.device == "iemobile") && _guiState.userAgent != "opera" && _guiState.userAgent != "firefox") {
		_guiState.clickEvent = "touchend";
		$(document).on("touchstart", saveCoords);
//	} else if(_guiState.device == "iemobile") {
//		_guiState.clickEvent = "MSPointerUp";
//		$(document).on("MSPointerDown", saveCoords);
	}
	
//	var userAgent = navigator.userAgent.toLowerCase();
//	if((userAgent.indexOf("opera") == -1) && ((userAgent.indexOf("iphone") != -1) || (userAgent.indexOf("ipad") != -1) || (userAgent.indexOf("android") != -1))) {
//		_guiState.clickEvent = "touchend";
//		$(document).on("touchstart", saveCoords);
//	}
	
	
//	if((userAgent.indexOf("iphone") != -1) || (userAgent.indexOf("ipad") != -1)) {
//		_guiState.selectEvent = "focus";
//	}
}

function initUserState() {
	var lang = _dataStore.readCookieValue("myArmy.language");
	if (lang != null) {
		_guiState.lang = lang;
	}
	
    _persistence.restoreState();	
}