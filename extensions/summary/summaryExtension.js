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

function SummaryExtension() {
	
	this.init = function(extensionManager) {
		
		extensionManager.addContainer("summaryContainer", getContainerContent());
		extensionManager.addExtraContainer("printContainer");
		extensionManager.addExtraContainer("saveContainer");
		
		extensionManager.addMenuButton("summaryButton", function() {
			_gui.showFragment("summary");
		});

		var summaryGui = new SummaryGui();
		summaryGui.init();
	}
	
	function getContainerContent() {
		return '<div class="summary1"> \
					<div class="summaryText"></div> \
				</div> \
				<div class="summary2" class="containerChild"> \
					<label> \
						<input type="checkbox" id="chooseShort" /> \
						<span id="chooseShortText"></span> \
					</label> \
					<br /> \
					<label> \
						<input type="checkbox" id="chooseBBcode" /> \
						<span id="chooseBBcodeText"></span> \
					</label> \
					<br /> \
					<label> \
						<input type="checkbox" id="chooseSeparateDetachments" /> \
						<span id="chooseSeparateDetachmentsText"></span> \
					</label> \
					<br /> \
					<br /> \
					<span id="selectAllButton" class="mediumButton"></span> \
					<span id="copytext"></span> \
					<br /> \
					<span id="printButton" class="mediumButton"></span> \
					<br /> \
					<span id="saveFileButton" class="mediumButton">x</span> \
				</div>';
	}
	
}