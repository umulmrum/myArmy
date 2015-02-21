/*
 * Copyright 2012-2015 Stefan Kruppa
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

var _container = null;

var _systems = []; // all game systems
var _guiState = null;

/**
 * init() initializes the system. It is called when the system is initially loaded or when a restart is required (which
 * is the case when the user calls a saved army from a bookmark. The browser won't reload the page then, so we need to
 * re-initialize by hand).
 */
function init() {

    _guiState = new GuiState();
    var container = initContainer();
    var dispatcher = container.getDispatcher();
    var dataReader = container.getDataReader();
    var systemState = container.getSystemState();
    var systemService = container.getSystemService();
    var armyState = container.getArmyState();
    var extensionManager = container.getExtensionManager();
    var gui = container.getGui();
    var languageService = container.getLanguageService();
    var persistence = container.getPersistence();

    dispatcher.triggerEvent("preLongRunningProcess");
	initDevice();
	// After this point the event system is initialized.
	// Do not register events (jQuery or myArmy) before this comment.
	extensionManager.reset();
	gui.onResizeContainer();
	extensionManager.initExtensions();
	dataReader.readSystems();
    languageService.restoreLanguage();
    persistence.restoreState();
    
    if(systemState.system == null) {
    	systemService.changeSystem(1); // set directly as long as only 1 system is supported ...
    }
	
    // TODO decouple
	if(armyState.getDetachmentCount() > 0) {
		_guiState.currentContent = "design";
	} else {
		_guiState.currentContent = "mainmenu";
	}

	dispatcher.triggerEvent("postInit");
    dispatcher.triggerEvent("postLongRunningProcess");
}

function initContainer() {
    _container = new Container();
    _container.init();
    return _container;
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
