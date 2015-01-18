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

function DebugExtension() {
	
	this.init = function(extensionManager) {
		
		extensionManager.addContainer("debugContainer", getContainerContent());
		
		extensionManager.addMenuButton("debugButton", function() {
			_gui.showFragment("debug");
		});
		
		_gui.getElement('#debugTestSuccessMessageButton').on(_guiState.clickEvent, function() {
			_gui.displaySuccessMessage("Test success message");
		});
		_gui.getElement('#debugTestErrorMessageButton').on(_guiState.clickEvent, function() {
			_gui.displayErrorMessage("Test error message");
		});
		_gui.getElement('#debugTestInfoMessageButton').on(_guiState.clickEvent, function() {
			_gui.displayInfoMessage("Test info message");
		});
		_gui.getElement('#debugTestHideMessagesButton').on(_guiState.clickEvent, function() {
			_gui.hideMessages();
		});
	}
	
	function getContainerContent() {
		return '<div> \
				<span id="debugTestSuccessMessageButton" class="mediumButton">Display test success message</span><br /> \
				<span id="debugTestErrorMessageButton" class="mediumButton">Display test error message</span><br /> \
				<span id="debugTestInfoMessageButton" class="mediumButton">Display test info message</span><br /> \
				<span id="debugTestHideMessagesButton" class="mediumButton">Hide messages</span> \
			</div>';
	}
}

