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
		_dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, _dispatcher.PHASE_STATE);
	};
	
	this.onPostInit = function(event) {
		this.renderArmySelectBox();
		//this.renderFirstDetachmentSelect();
		//this.addNewArmySelects();
		this.renderDetachmentBoxes();
		this.refreshAll();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.refreshAll();
	};
	
	this.onPostChangeSystem = function(event) {
		this.renderArmySelectBox();
		//this.renderFirstDetachmentSelect();
	};
	
	this.onPostChangeArmy = function(event, additionalData) {
		//var lastArmyIndex = _armyState.getLastArmyIndex();
		//this.addArmySelect(lastArmyIndex + 1);
		this.renderDetachmentBox(additionalData.detachmentDataIndex);
		this.resetArmySelect();
	};

	this.onPostDeleteDetachment = function(event, additionalData) {
		this.removeDetachmentBox(additionalData.detachmentDataIndex);
		this.resetArmySelect();
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

	this.renderArmySelectBox = function() {
		
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
			return _guiState.text["army." + a.armyPrefix] > _guiState.text["army." + b.armyPrefix] ? 1 : -1;
		});
		
		//var detachmentBoxElement = _gui.getElement("#detachmentBox0");
		//detachmentBoxElement.children().remove();
		//detachmentBoxElement.append(getDetachmentTypeSelectbox(0));
		
		var armySelectElement = _gui.getElement("#armySelect");

		//armySelectElement.children().remove();
		armySelectElement.append(jQuery('<option></option>').val("-1").html("> " +_guiState.text["chooseFaction"] + " <"));
		
		var lastArmyGroup = -1;
		var optgroup = "";
		
		for (var j = 0; j < sortedArmies.length; j++) {
			if (sortedArmies[j].armyGroup != lastArmyGroup) {
				lastArmyGroup = sortedArmies[j].armyGroup;
				if (j > 0) {
					armySelectElement
					.append('<option disabled="true"></option>');
				}
				optgroup = jQuery('<optgroup label=""></optgroup>');
				armySelectElement.append(optgroup);
			}
			var armyId = sortedArmies[j].armyId;
			var armyName = _guiState.text["army." + _systemState.armies[armyId].armyPrefix];
			
			optgroup.append(option(armyName, armyId));
		}
	};

	//this.addArmySelect = function(detachmentDataIndex) {
	//	if(detachmentDataIndex >= 10 || detachmentDataIndex == 0 || _gui.getElement("#armySelect" + detachmentDataIndex) != null) {
	//		return;
	//	}
	//	var armySelectElement = select("armySelect" + detachmentDataIndex);
	//	armySelectElement.on("change", { armyIndex: detachmentDataIndex}, function(event) {
	//		_controller.changeArmy(detachmentDataIndex, this.value, _gui.getElement("#detachmentTypeSelect" + detachmentDataIndex).val());
	//	});
	//	var detachmentBoxElement = _gui.getElement("#detachmentBox" + detachmentDataIndex);
	//	detachmentBoxElement.append(getDetachmentTypeSelectbox(detachmentDataIndex));
	//	detachmentBoxElement.append(armySelectElement);
	//	detachmentBoxElement.removeClass("invisible");
	//	detachmentBoxElement.after("<br />");
	//	armySelectElement = _gui.getElement("#armySelect" + detachmentDataIndex);
	//
	//	armySelectElement.append(_gui.getElement("#armySelect0").children().clone());
	//	this.refreshArmySelect(detachmentDataIndex);
	//};
	
	this.refreshArmySelect = function(armyIndex) {
		var armySelectElement = _gui.getElement("#armySelect" + armyIndex);
//		var mainDetachmentData = _armyState.getDetachmentData(0);
		var armyUnit = _armyState.getArmyUnit(armyIndex, 0);
		var armyId = (armyUnit != null && armyUnit.getArmy() != null) ? armyUnit.getArmy().armyId : -1;
		armySelectElement.find("option").each(function(index, element) {
			var $element = $(element);
			var elementValue = parseInt(element.value);
			if(elementValue == armyId) {
				element.selected = true;
			}
			if(element.value == -1) {
				$element.html("> " + _guiState.text["army"] + " " + (armyIndex + 1) + " <");
			} /*else if (armyIndex > 0 && ($.inArray(elementValue, mainDetachmentData.allowedAllies) == -1)) {
				$element.addClass("bad");
			} else {
				$element.removeClass("bad");
			}*/
		});
		
		// mark select element as invalid if an invalid ally was selected
		/*if(armyIndex > 0 && armyId != -1) {
			if($.inArray(armyId, mainDetachmentData.allowedAllies) == -1) {
				armySelectElement.addClass("bad");
			} else {
				armySelectElement.removeClass("bad");
			}
		}*/
	};

	this.resetArmySelect = function() {
		var armySelect = _gui.getElement("#armySelect");
		armySelect.val("-1").change();
	};

	this.renderDetachmentBoxes = function() {
		$("#detachmentBoxContainer").children().remove();
		for(var i = 0; i < _armyState.getDetachmentDataCount(); i++) {
			this.renderDetachmentBox(i);
		}
	};

	this.renderDetachmentBox = function(detachmentDataIndex) {

		var detachmentBox = li("", "detachmentBox" + detachmentDataIndex, "detachmentBox");
		var detachmentBoxContent = div(null, null, "detachmentBoxContent");

		var header = div(null, null, "entryHeader commonHighlight");
		header.append(span(detachmentDataIndex + 1, null, "entryArmyIndex"));
		var headingText = _guiState.getText("army." + _armyState.getArmy(detachmentDataIndex, 0).armyPrefix);
		if(detachmentDataIndex == 0) {
			headingText += " (" + _guiState.getText("primaryDetachment") + ")";
		}
		header.append(div(headingText, null, "entryName"));
		detachmentBoxContent.append(header);

		var body = div(null, null, "optionContainer detachmentContainer");
		var extensions = div();
		extensions.append(span(_guiState.getText("extensions") + ": "));
		body.append(extensions);

		var detachmentType = div();
		detachmentType.append(span(_guiState.getText("detachmentType") + ": "));
		detachmentType.append(getDetachmentTypeSelectbox(detachmentDataIndex));
		body.append(detachmentType);

		detachmentBoxContent.append(body);
		detachmentBox.append(detachmentBoxContent);

		var buttons = div(null, null, "entryButtons");
		var deleteButton = div(null, null, "entryButton deleteButton", { title: _guiState.getText("delete"), alt: _guiState.getText("delete") });
		deleteButton.on(_guiState.clickEvent, function() {
			_controller.deleteDetachment(detachmentDataIndex);
		});
		buttons.append(deleteButton);

		detachmentBox.append(buttons);

		_gui.getElement("#detachmentBoxContainer").append(detachmentBox);
	};
	
	function getDetachmentTypeSelectbox(detachmentDataIndex) {
		var isPrimary = (detachmentDataIndex == 0);
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var selectBox = select("detachmentTypeSelect" + detachmentDataIndex);
//		selectBox.append(option(_guiState.text["chooseDetachmenttype"], -1));
		
		selectBox.on("change", { armyIndex: detachmentDataIndex}, function(event) {
			_controller.changeDetachmentType(detachmentDataIndex, this.value);
		});
		
		
		for(var i in _systemState.system.detachmentTypes) {
			var detachmentType = _systemState.system.detachmentTypes[i];
			var isSelected = ((detachmentData != null) && (detachmentData.detachmentType.id == detachmentType.id));
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
				selectBox[0].options[index].innerHTML = _guiState.text["army." + army.armyPrefix];
			} else if(armyId == -1) {
				selectBox[0].options[index].innerHTML = "> " + _guiState.text["army"] + " " + (armyIndex + 1) + " <";
			}
		});
	};

	this.removeDetachmentBox = function(detachmentDataIndex) {
		_gui.getElement("#detachmentBox" + detachmentDataIndex).remove();
	};
	
	/**
	 * Refreshes all UI elements.
	 */
	this.refreshAll = function() {
		this.refreshSpecialContainer();
		_gui.getElement("#creditsButton").find("a").html(_guiState.text["credits"]);
		_gui.getElement("#downloadButton").find("a").html(_guiState.text["download"]);
		_gui.getElement("#forumButton").find("a").html(_guiState.text["forum"]);
		_gui.getElement("#armyHeading").html(_guiState.text["detachments"]);
		_gui.getElement("#optionsHeading").html(_guiState.text["viewOptions"]);
		_gui.getElement("#linksHeading").html(_guiState.text["links"]);
		_gui.getElement("#resetButton").html(_guiState.text["reset"]);
		_gui.getElement(".detachmentCreatorHeading").html(_guiState.text["newDetachment"]);
		_gui.getElement("#deleteAllDetachmentsButton").html(_guiState.text["deleteAllDetachments"]);
		_gui.getElement("#fileLoaderLabel").html(_guiState.text["loadArmy"]);

		if (_systemState.system != null) {

			for(var i = 0; i <= 10; i++) {
				//this.refreshDetachmentTypeSelectbox(i);
				//this.refreshArmySelectbox(i);
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