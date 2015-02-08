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

/**
 * GuiState holds data concerning the user interface.
 * The data this object holds is only intended to be used inside GUI objects.
 * Do never use this object in any logic-related objects and functions.
 */
function GuiState() {

	this.OPTION_DISPLAYSTATE = {};
	this.OPTION_DISPLAYSTATE.ALWAYS = 0;
	this.OPTION_DISPLAYSTATE.EXPANDED = 1;
	this.OPTION_DISPLAYSTATE.COLLAPSED = 2;

	this.clickEvent = "click";
	this.selectEvent = "click";
	this.hashEventEnabled = true;
	this.device = "desktop";
	this.userAgent = "default";
	this.isSmallDevice = false;
	
	this.multiOptionChooserOptionId = -1;
	this.lastClickedOptionId = -1;
	
	this.contentFragments = {};
	this.currentContent = null;
	
	this.languages = ["en", "de"]; // all available languages
	this.lang = "en"; // the currently active language
	var text = {}; // all common messages and labels (multi-lingual)
	
	this.resetTexts = function() {
		text = {};
	};

	this.getTexts = function() {
		return text;
	};

	this.getText = function(key) {
		return text[key];
	};
	
	this.addTexts = function(textsParam) {
		for(var key in textsParam) {
			text[key] = textsParam[key];
		}
	};
}