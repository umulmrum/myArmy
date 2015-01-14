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

function MainmenuExtension() {
	
	this.init = function(extensionManager) {
		
		var mainmenuGui = new MainmenuGui();
		mainmenuGui.init();
		
		extensionManager.addContainer("mainmenuContainer", getContainerContent());
		extensionManager.addContainer("creditsContainer", "");
		
		addEvents();
		
		extensionManager.addMenuButton("mainmenuButton", function() {
			_gui.showFragment("mainmenu");
		});
	}
	
	function getContainerContent() {
		return '<span id="armyHeading" class="slotHeadingContainer"></span> \
		<div class="pageContent"> \
		<div class="invisible"> \
			<select id="systemSelect" class="invisible"></select> \
		</div> \
		<div id="detachmentCreator" class="detachmentCreator detachmentBox">\
			<span class="detachmentCreatorHeading">:</span>\
			<select id="armySelect" />\
		</div>\
		<ul id="detachmentBoxContainer"></ul>\
		<!--span id="detachmentBox0" class="detachmentBox"></span><br /> \
		<span id="detachmentBox1" class="detachmentBox invisible"></span> \
		<span id="detachmentBox2" class="detachmentBox invisible"></span> \
		<span id="detachmentBox3" class="detachmentBox invisible"></span> \
		<span id="detachmentBox4" class="detachmentBox invisible"></span> \
		<span id="detachmentBox5" class="detachmentBox invisible"></span> \
		<span id="detachmentBox6" class="detachmentBox invisible"></span> \
		<span id="detachmentBox7" class="detachmentBox invisible"></span> \
		<span id="detachmentBox8" class="detachmentBox invisible"></span> \
		<span id="detachmentBox9" class="detachmentBox invisible"></span--> \
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
	
	function addEvents() {
		_gui.getElement("#systemSelect").on("change", function() {
			_controller.changeSystem(this.value);
		});
		_gui.getElement("#armySelect").on("change", function() {
			_controller.addDetachment(this.value);
		});
		_gui.getElement("#resetButton").on(_guiState.clickEvent, function() {
			_controller.resetArmylist();
		});
		_gui.getElement("#deleteAllDetachmentsButton").on(_guiState.clickEvent, function() {
			_controller.deleteAllDetachments();
		});
		_gui.getElement("#creditsButton").on(_guiState.clickEvent, function() {
			_gui.showFragment("credits");
		});
		_gui.getElement("#downloadButton").on(_guiState.clickEvent, function() {
			window.open(_options.core.downloadBaseUri + _guiState.lang + _options.core.downloadPath);
		});
		_gui.getElement("#forumButton").on(_guiState.clickEvent, function() {
			window.open("http://www.gw-fanworld.net/forumdisplay.php/398-myArmy");
		});
		_gui.getElement("#fileLoader").on("change", _gui.loadFile);
	}
}

//function MainMenuLinkExtensionPoint() {
//	
//	this.extend = function(data) {
//		
//	};
//}