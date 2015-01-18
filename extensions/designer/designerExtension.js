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

function DesignerExtension() {
	
	this.init = function(extensionManager) {
		
		var chooserGui = new ChooserGui();
		chooserGui.init();
		
		var designerGui = new DesignerGui();
		designerGui.init();
		
		extensionManager.addContainer("designContainer", "");
		
		extensionManager.addMenuButton("designButton", function() {
			_gui.showFragment("design");
		});
		
		buildOptionCountChooser();
	}
	
	function buildOptionCountChooser() {
		var chooser = 
	'<div id="optionCountChooser" class="popup option"> \
		<span id="optionCountMinButton" class="incDecButton">&lt;&lt;</span> \
		<span id="optionCountLessButton" class="incDecButton">&lt;</span> \
		<span id="optionCount" class="count"></span> \
		<span id="optionCountMoreButton" class="incDecButton">&gt;</span> \
		<span id="optionCountMaxButton" class="incDecButton">&gt;&gt;</span> \
		<span id="optionCountOkButton" class="incDecButton"></span> \
	</div>';
		_gui.getElement("body").append(chooser);
	}
}