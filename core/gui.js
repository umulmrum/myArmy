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

/**
 * The Gui is the main user interface for the system.
 */
function Gui() {

	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmyAction, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postStateRefresh", this, this.onPostStateRefresh, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, _dispatcher.PHASE_STATE);
		
		this.getElement(".appMenuButton").on(_guiState.clickEvent, { menuId: "appMenu" }, toggleMenu);
		this.getElement(".slotMenuButton").on(_guiState.clickEvent, { menuId: "slotMenu" }, toggleMenu);
		this.getElement(".messageCloseButton").on(_guiState.clickEvent, this.hideMessages);

		jQuery.event.add(window, "resize", this.onResizeContainer);
	};

	this.onPostChangeArmyAction = function(event, additionalData) {
		this.checkSlotVisibility();
	};
	
	this.onPostChangeArmy = function(event, additionalData) {
		this.refreshAll();
		this.stopLongRunningProcess();
	};

	this.onPostResetArmy = function(event) {
		this.refreshTotalPoints();
	};

	this.onPostChangeLanguage = function(event) {
		this.refreshAll();
		this.stopLongRunningProcess();
	};

	this.onPostStateRefresh = function(event) {
		this.refreshTotalPoints();
	};

	this.onPostInit = function(event) {
		this.prepare();
		this.refreshAll();
		this.stopLongRunningProcess();
	};
	
	this.onPreCallFragment = function(event, additionalData) {
		if (additionalData.newFragment == "credits") {
			this.getElement(".creditsContainer").load(
					"credits_" + _guiState.lang + ".html");
		}
	};

	this.prepare = function() {
		this.renderLanguageSelect();
		this.checkSlotVisibility();

		_dispatcher.triggerEvent("postPrepareGui");
	};

	this.refreshAll = function() {
		this.refreshTotalPoints();
		this.refreshArmyLabel();
		// language select element does not need to be refreshed (at current time)
		// this.refreshLanguageSelect();
		this.showFragment(_guiState.currentContent, true);
	};

	this.onResizeContainer = function(event) {
		var myWindow = $(document);
		var windowWidth = myWindow.width();

		_guiState.isSmallDevice = (windowWidth < 580);
	};
	
	this.checkSlotVisibility = function() {
		for ( var i in _systemState.slots) {
			var slot = _systemState.slots[i];
			slot.visible = $.inArray(true, traverseArmyData(this, this.checkSlotVisible, { slotId : slot.slotId })) > -1;
		}
	};

	this.refreshTotalPoints = function() {
		this.getElement("#totalPoints").html(
				_armyState.getTotalPoints() + " " + _guiState.text["points"]);
	};

	this.refreshArmyLabel = function() {

		var string = "";
		var isFirst = true;
		var armyNames = traverseArmyData(this, this.getArmyName);
		for ( var i = 0; i < armyNames.length; i++) {
			var armyName = armyNames[i];
			if (armyName == null) {
				continue;
			}
			if (!isFirst) {
				string += " / ";
			}
			string += armyName;
			isFirst = false;
		}
		this.getElement("#armyLabel").html(string);
	};

	this.getArmyName = function(armyData) {
		if (armyData.army == null) {
			return null;
		}
		return _guiState.text[armyData.army.armyPrefix];
	};

	this.renderLanguageSelect = function() {

		var languageSelectElement = this.getElement(".languageSelect");
		languageSelectElement.children().remove();
		for ( var i = 0; i < _guiState.languages.length; i++) {
			var languageElement = a(null, null, "languageSelectElement " + _guiState.languages[i]);
			languageElement.on(_guiState.clickEvent, {
				language : i
			}, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.changeLanguage(_guiState.languages[event.data.language]);
			});
			languageSelectElement.append(languageElement);
		}
	};

	this.checkDisplay = function(entity) {
		if (isUndefined(entity.special)) {
			return true;
		}
		var currentSystem = _systemState.system;
		if (isNumber(entity.special)) {
			return currentSystem.special[entity.special].display;
		}
		var specials = entity.special.split(",");
		for ( var i = 0; i < specials.length; i++) {
			if (!currentSystem.special[parseInt(specials[i])].display) {
				return false;
			}
		}
		return true;
	};
	
	this.checkSlotVisible = function(armyData, armyIndex, additionalParams) {
		return !isUndefined(armyData.entityslotCount[additionalParams.slotId])
				&& (armyData.entityslotCount[additionalParams.slotId] > 0);
	};

	this.startLongRunningProcess = function() {
		var curtain = document.getElementById('curtain');
		if(curtain != null) {
			return;
		}
		curtain = document.body.appendChild(document.createElement('div'));
		curtain.id = "curtain";
		curtain.onkeypress = curtain.onclick = function() {
			return false;
		};
		curtain.appendChild(document.createElement('div'));
	};

	this.stopLongRunningProcess = function() {
		var curtain = document.getElementById('curtain');
		if(!isUndefined(curtain)) {
			curtain.parentNode.removeChild(curtain);
		}
	};
	
	/*****************************
	 *     popup menus start
	 *****************************/
	
	this.addCheckCloseEvent = function(containerId) {
		$(window).on(_guiState.clickEvent, {
			containerId : containerId
		}, $.proxy(this.checkIfCloseMenu, this));
	};
	
	this.checkIfCloseMenu = function(event) {
		if (!clickIsInElement(event, event.data.containerId)) {
			this.closeMenu(event.data.containerId);
		}
	};

	this.closeMenu = function(containerId) {
		var container = this.getElement("#" + containerId);
		container.css("display", "none");
		this.getElement("body").append(container);
		$("#" + containerId + "Parent").remove();
		_guiState.multiOptionChooserOptionId = -1;

		$(window).unbind(_guiState.clickEvent);
	};
	
	/*****************************
	 *     popup menus end
	 *****************************/
	
	/*****************************
	 *     user messages start
	 *****************************/
	
	this.displayErrorMessage = function(message) {
		displayMessage(message, "Error");
	}
	
	this.displaySuccessMessage = function(message) {
		displayMessage(message, "Success");
	}
	
	this.displayInfoMessage = function(message) {
		displayMessage(message, "Info");
	}
	
	function displayMessage(message, type) {
		var messageBar = _gui.getElement('.messageBar');
		var messageElement = _gui.getElement('.message');
		messageElement.html(message);
		messageBar.removeClass();
		messageBar.addClass("messageBar message" + type);
	};

	this.hideMessages = function() {
		var messageBar = _gui.getElement('.messageBar');
		messageBar.addClass("invisible");
	};
	
	/*****************************
	 *     user messages end
	 *****************************/
	
	/*****************************
	 *     fragments start
	 *****************************/
	
	this.showFragment = function(fragmentName, forceRefresh) {
		var container = this.getElement("." + fragmentName + "Container");
		if(container.hasClass("invisible") || forceRefresh) {
			this.getElement(".container").addClass("invisible");
			var button = this.getElement("." + _guiState.currentContent + "Button");
			if(button != null) {
				button.removeClass("selectedMenuButton");
			}
			_dispatcher.triggerEvent("preCallFragment", { oldFragment: _guiState.currentContent, newFragment: fragmentName });
			container.removeClass("invisible");
			_guiState.currentContent = fragmentName;
			button = this.getElement("." + _guiState.currentContent + "Button");
			if(button != null) {
				button.addClass("selectedMenuButton");
			}
			this.getElement(".menu").addClass("invisible");
		}
	}
	
	/*****************************
	 *     fragments end
	 *****************************/
	
	/*************************************************************************
	 *   HTML element cache start
	 *   
	 * This function avoids searching for the same elements multiple times.
	 * Be careful, new elements might be added after the cache was filled,
	 * so you might miss these elements.
	 * If strange things happen, search elements using default jQuery instead.
	 *************************************************************************/
	
	var map = {};
	
	this.getElement = function(name) {
		if (!map.hasOwnProperty(name)) {
			var element = $(name);
			if(element.length > 0) {
//				return element;
				map[name] = element;
			} else {
				return null;
			}
		}
		return map[name];
	};
	
	/*****************************
	 *   HTML element cache end
	 *****************************/

	this.loadFile = function(event) {
		this.startLongRunningProcess();
	    var f = event.target.files[0]; 

	    if (f) {
	      var r = new FileReader();
	      r.onload = function(e) {
		      var content = e.target.result;
		      content = content.substr(0, content.indexOf("\r\n"));
		      if(content.indexOf("#") == -1) {
		    	  alert("Invalid file");
		      } else {
		    	  var code = content.substr(content.indexOf("#"));
		    	  window.location.href = code; 
		      }
	      };  
	      r.readAsText(f);
	    } else { 
	      alert("Failed to load file");
	    }
	    event.stopPropagation();
	    event.preventDefault();
	    return true;
	};

}