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

function DebugExtension(dispatcher, gui) {
	
	this.init = function(extensionManager) {

        var dataStore = _container.getDataStore();

		extensionManager.addContainer("debugContainer", getContainerContent());
		
		extensionManager.addMenuButton("debugButton", function() {
			gui.showFragment("debug");
		});

		gui.getElement('#clearCacheButton').on(_guiState.clickEvent, function() {
			dataStore.clear();
		});

		gui.getElement('#debugTestSuccessMessageButton').on(_guiState.clickEvent, function() {
			gui.displaySuccessMessage("Test success message");
		});
		gui.getElement('#debugTestErrorMessageButton').on(_guiState.clickEvent, function() {
			gui.displayErrorMessage("Test error message");
		});
		gui.getElement('#debugTestInfoMessageButton').on(_guiState.clickEvent, function() {
			gui.displayInfoMessage("Test info message");
		});
		gui.getElement('#debugTestHideMessagesButton').on(_guiState.clickEvent, function() {
			gui.hideMessages();
		});
	};
	
	function getContainerContent() {
		return '\
			<span id="clearCacheButton" class="mediumButton">Clear cache</span>\
			<hr>\
			<div>\
				<span id="debugTestSuccessMessageButton" class="mediumButton">Display test success message</span>\
				<span id="debugTestErrorMessageButton" class="mediumButton">Display test error message</span>\
				<span id="debugTestInfoMessageButton" class="mediumButton">Display test info message</span>\
				<span id="debugTestHideMessagesButton" class="mediumButton">Hide messages</span> \
			</div>';
	}
}

