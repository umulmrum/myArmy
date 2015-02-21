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
 * The Gui is the main user interface for the system.
 */
function Gui(dispatcher, systemState, armyState, controller) {

	this.init = function() {
		dispatcher.bindEvent("postInit", this, this.onPostInit, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachmentAction, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachmentAction, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteDetachmentAction, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postStateRefresh", this, this.onPostStateRefresh, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("preLongRunningProcess", this, this.onPreLongRunningProcess, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postLongRunningProcess", this, this.onPostLongRunningProcess, dispatcher.PHASE_STATE);

		this.getElement(".appMenuButton").on(_guiState.clickEvent, { menuId: "appMenu" }, toggleMenu);
		this.getElement(".slotMenuButton").on(_guiState.clickEvent, { menuId: "slotMenu" }, toggleMenu);
		this.getElement(".messageCloseButton").on(_guiState.clickEvent, this.hideMessages);

		jQuery.event.add(window, "resize", this.onResizeContainer);
	};

	this.onPostAddDetachmentAction = function(event, additionalData) {
		this.checkSlotVisibility();
	};
	
	this.onPostAddDetachment = function(event, additionalData) {
		this.refreshAll();
	};

	this.onPostDeleteDetachmentAction = function(event, additionalData) {
		this.checkSlotVisibility();
	};

	this.onPostDeleteDetachment = function(event, additionalData) {
		this.refreshAll();
	};

	this.onPostResetArmy = function(event) {
		this.refreshTotalPoints();
	};

	this.onPostChangeLanguage = function(event) {
		this.refreshAll();
	};

	this.onPostStateRefresh = function(event) {
		this.refreshTotalPoints();
	};

	this.onPostInit = function(event) {
		this.prepare();
		this.refreshAll();
	};
	
	this.onPreCallFragment = function(event, additionalData) {
		if (additionalData.newFragment == "credits") {
			this.getElement(".creditsContainer").load(
					"credits_" + _guiState.lang + ".html");
		}
	};

    this.onPreLongRunningProcess = function() {
      this.startLongRunningProcess();
    };

    this.onPostLongRunningProcess = function() {
        this.stopLongRunningProcess();
    };

	this.prepare = function() {
		this.renderLanguageSelect();
		this.checkSlotVisibility();

		dispatcher.triggerEvent("postPrepareGui");
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
		for ( var i in systemState.slots) {
			var slot = systemState.slots[i];
			slot.visible = $.inArray(true, traverseDetachmentData(this, this.checkSlotVisible, { slotId : slot.slotId })) > -1;
		}
	};

	this.refreshTotalPoints = function() {
		this.getElement("#totalPoints").html(
				armyState.getTotalPoints() + " " + _guiState.getText("points"));
	};

	this.refreshArmyLabel = function() {

		var string = "";
		var isFirst = true;
		var armyNames = traverseDetachmentData(this, this.getArmyName);
		for ( var i in armyNames) {
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

	this.getArmyName = function(detachmentData) {
        var armyUnit = detachmentData.getFirstArmyUnit();
		return _guiState.getText("army." + armyUnit.getArmy().armyPrefix);
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
				controller.changeLanguage(_guiState.languages[event.data.language]);
			});
			languageSelectElement.append(languageElement);
		}
	};

	this.checkDisplay = function(entity) {
		if (isUndefined(entity.special)) {
			return true;
		}
		var currentSystem = systemState.system;
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
	
	this.checkSlotVisible = function(detachmentData, additionalParams) {
		return !isUndefined(detachmentData.entityslotCount[additionalParams.slotId])
				&& (detachmentData.entityslotCount[additionalParams.slotId] > 0);
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
		this.displayMessage(message, "Error");
	};
	
	this.displaySuccessMessage = function(message) {
		this.displayMessage(message, "Success");
	};
	
	this.displayInfoMessage = function(message) {
		this.displayMessage(message, "Info");
	};
	
	this.displayMessage = function(message, type) {
		var messageBar = this.getElement('.messageBar');
		var messageElement = this.getElement('.message');
		messageElement.html(message);
		messageBar.removeClass();
		messageBar.addClass("messageBar message" + type);
	};

	this.hideMessages = function() {
		var messageBar = this.getElement('.messageBar');
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
			dispatcher.triggerEvent("preCallFragment", { oldFragment: _guiState.currentContent, newFragment: fragmentName });
			container.removeClass("invisible");
			_guiState.currentContent = fragmentName;
			button = this.getElement("." + _guiState.currentContent + "Button");
			if(button != null) {
				button.addClass("selectedMenuButton");
			}
			this.getElement(".menu").addClass("invisible");
		}
	};
	
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
		if (!map.hasOwnProperty(name) || map[name] == null) {
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

	this.removeElement = function(name) {
		delete map[name];
	};
	
	/*****************************
	 *   HTML element cache end
	 *****************************/

	this.loadFile = function(event) {
        dispatcher.triggerEvent("preLongRunningProcess");
	    var f = event.target.files[0]; 

	    if (f) {
	      var r = new FileReader();
	      r.onload = function(e) {
		      var content = e.target.result;
              var regex = /\s/;
		      content = content.substr(0, regex.exec(content).index);
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
        dispatcher.triggerEvent("postLongRunningProcess");
	    return true;
	};

}