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

function MainmenuExtension(dispatcher, gui) {
	
	this.init = function(extensionManager) {

        var systemState = _container.getSystemState();
        var armyState = _container.getArmyState();
        var controller = _container.getController();
        var languageService = _container.getLanguageService();

		var mainmenuGui = new MainmenuGui(dispatcher, systemState, armyState, controller, gui);
		mainmenuGui.init();
		
		extensionManager.addContainer("mainmenuContainer", getContainerContent());
		extensionManager.addContainer("creditsContainer", "");
		
		addEvents(controller, languageService);
		
		extensionManager.addMenuButton("mainmenuButton", function() {
			gui.showFragment("mainmenu");
		});
	};
	
	function getContainerContent() {
		return '<span id="armyHeading" class="slotHeadingContainer"></span> \
		<div class="pageContent"> \
		<div class="invisible"> \
			<select id="systemSelect" class="invisible"></select> \
		</div> \
		<div id="detachmentCreator" class="detachmentBox">\
			<span id="detachmentCreatorHeading"></span>\
			<span><select id="armySelect" /></span>\
			<span id="maxDetachmentsReachedMessage" class="invisible"></span>\
		</div>\
		<ul id="detachmentBoxContainer"></ul>\
		<div><a id="resetButton"></a></div> \
		<div><a id="deleteAllDetachmentsButton"></a></div> \
	</div> \
		 \
	<span id="fileLoaderLabel" class="slotHeadingContainer"></span> \
		<div class="pageContent"> \
			<input type="file" id="fileLoader"> \
		</div> \
	<span id="optionsHeading" class="slotHeadingContainer"></span> \
	<div class="pageContent"> \
		<div id="specialContainer"></div> \
	</div> \
		 \
	<span id="linksHeading" class="slotHeadingContainer"></span> \
	<div id="mainmenu.linkContainer" class="pageContent"> \
		<div id="creditsButton"><a></a></div> \
		<div id="downloadButton"><a></a></div> \
		<div id="forumButton"><a></a></div> \
	</div>';
	}
	
	function addEvents(controller, languageService) {
		gui.getElement("#systemSelect").on("change", { controller: controller }, function() {
			controller.changeSystem(this.value);
		});
		gui.getElement("#armySelect").on("change", { controller: controller }, function() {
			controller.addDetachment(this.value);
		});
		gui.getElement("#resetButton").on(_guiState.clickEvent, { controller: controller }, function() {
			if(!confirm(_guiState.getText("message.confirmAllSelectionsDelete"))) {
				return;
			}
			controller.resetArmylist();
		});
		gui.getElement("#deleteAllDetachmentsButton").on(_guiState.clickEvent, { controller: controller }, function() {
			if(!confirm(_guiState.getText("message.confirmAllDetachmentsDelete"))) {
				return;
			}
			controller.deleteAllDetachments();
		});
		gui.getElement("#creditsButton").on(_guiState.clickEvent, function() {
			gui.showFragment("credits");
		});
		gui.getElement("#downloadButton").on(_guiState.clickEvent, function() {
			window.open(_options.core.downloadBaseUri + languageService.getLanguage() + _options.core.downloadPath);
		});
		gui.getElement("#forumButton").on(_guiState.clickEvent, function() {
			window.open("http://www.gw-fanworld.net/forumdisplay.php/398-myArmy");
		});
		gui.getElement("#fileLoader").on("change", gui.loadFile);
	}
}

//function MainMenuLinkExtensionPoint() {
//	
//	this.extend = function(data) {
//		
//	};
//}