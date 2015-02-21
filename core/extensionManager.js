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
 * ExtensionManager is responsible for the initialization of extensions.
 * It provides functions for extending the core system.
 */
function ExtensionManager(dispatcher, gui) {
	
	var extensions = [];
	var extensionPoints = {};
	
	this.initExtensions = function() {

		for(var i = 0; i < _options.extensions.length; i++) {
			extensions.push(new window[_options.extensions[i]](dispatcher, gui));
		}
		
		for(var i in extensions) {
			extensions[i].init(this);
		}
	};
	
	this.reset = function() {
		
		var mainContainer = gui.getElement("#container");
		mainContainer.children().remove();
		
		var extraContainer = gui.getElement("#extraContainer");
		extraContainer.children().remove();
		
		var menuButtonContainer = gui.getElement("#menuButtonContainer");
		menuButtonContainer.children().remove();
		
		var appMenu = gui.getElement("#appMenu");
		appMenu.children().remove();
	};
	
//	this.addExtensionPoint = function(name, extensionPoint) {
//		extensionPoints[name] = extensionPoint;
//	};
//	
//	this.extend = function(extensionPointName, data) {
//		var extensionPoint = extensionPoints[extensionPointName];
//		if(extensionPoint) {
//			extensionPoint.extend(data);
//		}
//	};
	
	this.addContainer = function(className, content) {
		var mainContainer = gui.getElement("#container");
		
		var newContainer = div(null, null, className + " container invisible", null);
		newContainer.append(content);
		mainContainer.append(newContainer);
	};

	this.addExtraContainer = function(id) {
		var extraContainer = gui.getElement("#extraContainer");
		
		var newContainer = div(null, id);
		extraContainer.append(newContainer);
	};

	this.addMenuButton = function(name, callback) {
		gui.getElement("#menuButtonContainer").append(span(null, null, "menuButton " + name));
		gui.getElement("#appMenu").append(span(null, null, "menuButton " + name));
		
		_guiState.contentFragments[name] = name;
		gui.getElement("." + name).on(_guiState.clickEvent, callback);
	};
	
}