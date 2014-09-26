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

function MainmenuGui() {

	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeSystem", this, this.onPostChangeSystem, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, _dispatcher.PHASE_STATE);
	};
	
	this.onPostInit = function(event) {
		this.renderFirstDetachmentSelect();
		this.addNewArmySelects();
		this.refreshAll();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.refreshAll();
	};
	
	this.onPostChangeSystem = function(event) {
		this.renderFirstDetachmentSelect();
	};
	
	this.onPostChangeArmy = function(event, additionalData) {
		var lastArmyIndex = _armyState.getLastArmyIndex();
		this.addArmySelect(lastArmyIndex + 1);
	};
	
	this.onPostChangeFocCount = function(event) {
		this.refreshFocCount();
	};
	
	this.refreshSystemChooser = function() {
		// there is only one system available at the moment
		return;
		
		
		var systemSelectElement = _gui.getElement("#systemSelect");
		systemSelectElement.children().remove();
		systemSelectElement.append(option("", "-1"));
		var currentSystem = _systemState.system;
		
		for (var i = 0; i < _systems.length; i++) {
			var systemId = _systems[i].systemId;
			var systemName = _systems[i].systemName;
			systemSelectElement.append(option(systemName, systemId,
					currentSystem != null
							&& systemId == currentSystem.systemId));
		}
	};

	this.renderFirstDetachmentSelect = function() {
		
		var sortedArmies = [];
		for(var i in _systemState.armies) {
			sortedArmies.push(_systemState.armies[i]);
		}
		sortedArmies = sortedArmies.sort(function(a, b) {
			if (a.armyGroup < b.armyGroup) {
				return -1;
			} else if (a.armyGroup > b.armyGroup) {
				return 1;
			}
			return _guiState.text[a.armyPrefix] > _guiState.text[b.armyPrefix] ? 1 : -1;
		});
		
		var detachmentBoxElement = _gui.getElement("#detachmentBox0");
		detachmentBoxElement.children().remove();
		detachmentBoxElement.append(getDetachmentTypeSelectbox(0));
		
		var armySelectElement = _gui.getElement("#armySelect0");
		if(armySelectElement == null) {
			armySelectElement = select("armySelect0");
			armySelectElement.on("change", function(event) {
				_controller.changeArmy(0, this.value, _gui.getElement("#detachmentTypeSelect0").val());
			});
			detachmentBoxElement.append(armySelectElement);
		}
		
		
		armySelectElement.children().remove();
		armySelectElement.append(jQuery('<option></option').val("-1").html("> " +_guiState.text["army"] + " 1 <"));
		
		var lastArmyGroup = -1;
		var optgroup = "";
		
		var armyData = _armyState.getArmyData(0);
		var selectedArmyId = (armyData != null && armyData.army != null) ? armyData.army.armyId : -1;
		
		for (var j = 0; j < sortedArmies.length; j++) {
			if (sortedArmies[j].armyGroup != lastArmyGroup) {
				lastArmyGroup = sortedArmies[j].armyGroup;
				if (j > 0) {
					armySelectElement
					.append('<option disabled="true"></option>');
				}
				optgroup = jQuery('<optgroup></optgroup>');
				armySelectElement.append(optgroup);
			}
			var armyId = sortedArmies[j].armyId;
			var armyName = _guiState.text[_systemState.armies[armyId].armyPrefix];
			
			optgroup.append(option(armyName, armyId, armyId == selectedArmyId));
		}
	};
	
	this.addNewArmySelects = function() {
		for(var i = 0; i < _armyState.getArmyDataCount(); i++) {
			this.addArmySelect(i + 1);
		}
	};
	
	this.addArmySelect = function(armyIndex) {
		if(armyIndex >= 10 || armyIndex == 0 || _gui.getElement("#armySelect" + armyIndex) != null) {
			return;
		}
		var armySelectElement = select("armySelect" + armyIndex);
		armySelectElement.on("change", { armyIndex: armyIndex}, function(event) {
			_controller.changeArmy(armyIndex, this.value, _gui.getElement("#detachmentTypeSelect" + armyIndex).val());
		});
		var detachmentBoxElement = _gui.getElement("#detachmentBox" + armyIndex);
		detachmentBoxElement.append(getDetachmentTypeSelectbox(armyIndex));
		detachmentBoxElement.append(armySelectElement);
		detachmentBoxElement.removeClass("invisible");
		detachmentBoxElement.after("<br />");
		armySelectElement = _gui.getElement("#armySelect" + armyIndex);
		
		armySelectElement.append(_gui.getElement("#armySelect0").children().clone());
		this.refreshArmySelect(armyIndex);
	};
	
	this.refreshArmySelect = function(armyIndex) {
		var armySelectElement = _gui.getElement("#armySelect" + armyIndex);
//		var mainArmyData = _armyState.getArmyData(0);
		var armyData = _armyState.getArmyData(armyIndex);
		var armyId = (armyData != null && armyData.army != null) ? armyData.army.armyId : -1;
		armySelectElement.find("option").each(function(index, element) {
			var $element = $(element);
			var elementValue = parseInt(element.value);
			if(elementValue == armyId) {
				element.selected = true;
			}
			if(element.value == -1) {
				$element.html("> " + _guiState.text["army"] + " " + (armyIndex + 1) + " <");
			} /*else if (armyIndex > 0 && ($.inArray(elementValue, mainArmyData.allowedAllies) == -1)) {
				$element.addClass("bad");
			} else {
				$element.removeClass("bad");
			}*/
		});
		
		// mark select element as invalid if an invalid ally was selected
		/*if(armyIndex > 0 && armyId != -1) {
			if($.inArray(armyId, mainArmyData.allowedAllies) == -1) {
				armySelectElement.addClass("bad");
			} else {
				armySelectElement.removeClass("bad");
			}
		}*/
	};
	
	function getDetachmentTypeSelectbox(armyIndex) {
		var isPrimary = (armyIndex == 0);
		var armyData = _armyState.getArmyData(armyIndex);
		var selectBox = select("detachmentTypeSelect" + armyIndex);
//		selectBox.append(option(_guiState.text["choosedetachmenttype"], -1));
		
		selectBox.on("change", { armyIndex: armyIndex}, function(event) {
			_controller.changeDetachmentType(armyIndex, this.value);
		});
		
		
		for(var i in _systemState.system.detachmentTypes) {
			var detachmentType = _systemState.system.detachmentTypes[i];
			var isSelected = ((armyData != null) && (armyData.detachmentType.id == detachmentType.id));
			if(!isPrimary || detachmentType.canBePrimary) {
				selectBox.append(option(_guiState.text[detachmentType.name], detachmentType.id, isSelected));
			}
		}
		
		return selectBox;
	}
	
	this.refreshDetachmentTypeSelectbox = function(armyIndex) {
		var selectBox = _gui.getElement("#detachmentTypeSelect" + armyIndex);
		if(selectBox == null) {
			return;
		}
		selectBox.find("option").each(function(index) {
			var detachmentType = _systemState.system.detachmentTypes[selectBox[0].options[index].value];
			selectBox[0].options[index].innerHTML = _guiState.text[detachmentType.name];
		});
	};
	
	this.refreshArmySelectbox = function(armyIndex) {
		var selectBox = _gui.getElement("#armySelect" + armyIndex);
		if(selectBox == null) {
			return;
		}
		selectBox.find("option").each(function(index) {
			var armyId = selectBox[0].options[index].value;
			if((armyId != '') && (armyId != -1)) {
				var army = _systemState.armies[armyId];
				selectBox[0].options[index].innerHTML = _guiState.text[army.armyPrefix];
			} else if(armyId == -1) {
				selectBox[0].options[index].innerHTML = "> " + _guiState.text["army"] + " " + (armyIndex + 1) + " <";
			}
		});
	}
	
	/**
	 * Refreshes all UI elements.
	 */
	this.refreshAll = function() {
		this.refreshSpecialContainer();
		_gui.getElement("#creditsButton").find("a").html(_guiState.text["credits"]);
		_gui.getElement("#downloadButton").find("a").html(_guiState.text["download"]);
		_gui.getElement("#forumButton").find("a").html(_guiState.text["forum"]);
		_gui.getElement("#armyHeading").html(_guiState.text["army"]);
		_gui.getElement("#optionsHeading").html(_guiState.text["options"]);
		_gui.getElement("#linksHeading").html(_guiState.text["links"]);
		_gui.getElement("#resetButton").html(_guiState.text["reset"]);

		if (_systemState.system != null) {
			_gui.getElement("#armySelect0").removeClass("invisible");
			
			if (_armyState.getArmyCount() > 0) {
				_gui.getElement("#armySelect1").removeClass("invisible");
			}
			
			for(var i = 0; i <= 10; i++) {
				this.refreshDetachmentTypeSelectbox(i);
				this.refreshArmySelectbox(i);
			}
		}
	};
	
	this.refreshSpecialContainer = function() {
		var specialContainer = _gui.getElement("#specialContainer");
		specialContainer.children().remove();
		var currentSystem = _systemState.system;
		
		for ( var i in currentSystem.special) {
			var myCheckbox = checkbox("special",
					currentSystem.special[i].display);
			myCheckbox.on(_guiState.clickEvent, {
				special : currentSystem.special[i]
			}, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				if ($(this).is(':checked')) {
					event.data.special.display = true;
				} else {
					event.data.special.display = false;
				}
				_dispatcher.triggerEvent("mainmenu.postChangeSpecialDisplay");
			});
			var myLabel = label().append(myCheckbox).append(_guiState.text[currentSystem.special[i].specialName]);
			specialContainer.append(myLabel);
			specialContainer.append("<br />");
		}
	};
	
}