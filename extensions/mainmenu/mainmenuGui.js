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

function MainmenuGui() {

	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeSystem", this, this.onPostChangeSystem, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postAddExtension", this, this.onPostAddExtension, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteExtension, _dispatcher.PHASE_STATE);
	};

	this.onPostInit = function(event) {
		this.renderArmySelectBox();
		this.renderDetachmentBoxes();
		this.checkMaxDetachments();
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
		this.renderDetachmentBox(additionalData.detachmentDataIndex);
		this.resetArmySelect();
		this.checkMaxDetachments();
	};

	this.onPostDeleteDetachment = function(event, additionalData) {
		this.removeDetachmentBox(additionalData.detachmentDataIndex);
		this.refreshDetachmentBoxIndexes();
		this.resetArmySelect();
		this.checkMaxDetachments();
	};

	this.onPostChangeFocCount = function(event) {
		this.refreshFocCount();
	};

	this.onPostAddExtension = function (event, additionalData) {
		this.addExtension(additionalData.detachmentDataIndex, additionalData.armyUnitIndex);
		this.resetExtensionSelect(additionalData.detachmentDataIndex, additionalData.extensionId)
	};

	this.onPostDeleteExtension = function(event, additionalData) {
		this.removeExtension(additionalData.detachmentDataIndex, additionalData.armyUnitIndex, additionalData.extensionId);
		this.resetArmySelect();
	};

	// there is only one system available at the moment
	//this.refreshSystemChooser = function() {
    //
	//	var systemSelectElement = _gui.getElement("#systemSelect");
	//	systemSelectElement.children().remove();
	//	systemSelectElement.append(option("", "-1"));
	//	var currentSystem = _systemState.system;
     //
	//	for (var i = 0; i < _systems.length; i++) {
	//		var systemId = _systems[i].systemId;
	//		var systemName = _systems[i].systemName;
	//		systemSelectElement.append(option(systemName, systemId,
	//				currentSystem != null
	//						&& systemId == currentSystem.systemId));
	//	}
	//};

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
		
		var armySelectElement = _gui.getElement("#armySelect");

		//armySelectElement.children().remove();
		armySelectElement.append(jQuery('<option></option>').val("-1").html("> " +_guiState.text["chooseFaction"] + " <"));
		
		var previousArmyGroup = -1;

		for (var j = 0; j < sortedArmies.length; j++) {
			//document.writeln(sortedArmies[j].armyGroup);
		}
		for (var j = 0; j < sortedArmies.length; j++) {
			var army = sortedArmies[j];
			if (army.armyGroup != previousArmyGroup) {
				previousArmyGroup = army.armyGroup;
				if (j > 0) {
					armySelectElement.append('<option disabled="true"></option>');
				}
			}
			var armyName = _guiState.text["army." + _systemState.armies[army.armyId].armyPrefix];
			armySelectElement.append(option(armyName, army.armyId));
		}
	};

	this.refreshArmySelect = function(armyIndex) {
		var armySelectElement = _gui.getElement("#armySelect" + armyIndex);
		var armyUnit = _armyState.getArmyUnit(armyIndex, "a0");
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

	this.resetExtensionSelect = function(detachmentDataIndex, extensionId) {
		var extensionSelect = _gui.getElement("#extensionSelect" + detachmentDataIndex);
		extensionSelect.val("-1").change();
		extensionSelect.find("option[value=" + extensionId + "]").attr("disabled", "disabled");
	};

	this.renderDetachmentBoxes = function() {
		$("#detachmentBoxContainer").children().remove();
		for(var i in _armyState.getDetachments()) {
			this.renderDetachmentBox(i);
		}
	};

	this.renderDetachmentBox = function(detachmentDataIndex) {

		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var detachmentBox = li("", "detachmentBox" + detachmentDataIndex, "detachmentBox");
		var detachmentBoxContent = div(null, null, "detachmentBoxContent");

		var header = div(null, null, "entryHeader commonHighlight");
		var position = detachmentData.getPosition();
		header.append(span(position, null, "entryArmyIndex"));
		var headingText = getDetachmentBoxHeadingText(detachmentData);
		header.append(div(headingText, null, "entryName"));
		detachmentBoxContent.append(header);

		var body = div(null, null, "optionContainer detachmentContainer");
		var extensions = div(null, null, "detachmentContainerRow");
		extensions.append(span(_guiState.getText("extensions"), null, "extensionLabel"));
		extensions.append(span(getExtensionSelectbox(detachmentDataIndex)));
		body.append(extensions);
		var extensionListElement = div(null, "extensionList" + detachmentDataIndex, "extensionList");
		var extensionList = getExtensionList(detachmentDataIndex);
		for(var i = 0; i < extensionList.length; i++) {
			extensionListElement.append(extensionList[i]);
		}
		body.append(extensionListElement);

		var detachmentType = div(null, null, "detachmentContainerRow");
		detachmentType.append(span(_guiState.getText("detachmentType"), null, "detachmentTypeLabel"));
		detachmentType.append(span(getDetachmentTypeSelectbox(detachmentDataIndex)));
		body.append(detachmentType);

		detachmentBoxContent.append(body);
		detachmentBox.append(detachmentBoxContent);

		var buttons = div(null, null, "entryButtons");
		var deleteButton = div(null, null, "entryButton deleteButton", { title: _guiState.getText("delete"), alt: _guiState.getText("delete") });
		deleteButton.on(_guiState.clickEvent, { detachmentDataIndex: detachmentDataIndex }, function() {
			if(_armyState.getDetachmentData(detachmentDataIndex).hasSelections() && !confirm(_guiState.getText("message.confirmDetachmentDelete"))) {
				return;
			}
			_controller.deleteDetachment(detachmentDataIndex);
		});
		buttons.append(deleteButton);
		var cloneButton = div(null, null, "entryButton cloneButton cloneDetachmentButton", { title: _guiState.getText("clone"), alt: _guiState.getText("clone") });
		cloneButton.on(_guiState.clickEvent, { detachmentDataIndex: detachmentDataIndex }, function() {
			_controller.cloneDetachment(detachmentDataIndex);
		});
		buttons.append(cloneButton);

		detachmentBox.append(buttons);

		_gui.getElement("#detachmentBoxContainer").append(detachmentBox);
	};

	function getDetachmentBoxHeadingText(detachmentData) {
		var headingText = _guiState.getText("army." + _armyState.getArmy(detachmentData.getDetachmentDataIndex(), "a0").armyPrefix);
		if(detachmentData.getPosition() == 1) {
			headingText += " (" + _guiState.getText("primaryDetachment") + ")";
		}
		return headingText;
	}

	this.refreshDetachmentBoxIndexes = function() {
		for(var detachmentDataIndex in _armyState.getDetachments()) {
			var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
			_gui.getElement("#detachmentBox" + detachmentDataIndex).find(".entryArmyIndex").html(detachmentData.getPosition());
		}
	};

	this.refreshDetachmentBox = function(detachmentDataIndex) {
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var detachmentBox = _gui.getElement("#detachmentBox" + detachmentDataIndex);

		var headingText = getDetachmentBoxHeadingText(detachmentData);
		detachmentBox.find(".entryName").html(headingText);
		detachmentBox.find(".extensionLabel").html(_guiState.getText("extensions"));
		detachmentBox.find(".detachmentTypeLabel").html(_guiState.getText("detachmentType"));
	};
	
	function getDetachmentTypeSelectbox(detachmentDataIndex) {
		var isPrimary = (detachmentDataIndex == "d0");
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var selectBox = select("detachmentTypeSelect" + detachmentDataIndex);

		selectBox.on("change", { armyIndex: detachmentDataIndex}, function(event) {
			_controller.changeDetachmentType(detachmentDataIndex, this.value);
		});
		selectBox.append(getDetachmentTypeOptions(detachmentData.getDetachmentTypes(), detachmentData.detachmentType.id, isPrimary, detachmentData.getArmyUnit("a0")));

		return selectBox;
	}

	function getDetachmentTypeOptions(detachmentTypes, selectedDetachmentTypeId, isPrimary, textSource) {
		var retValue = [];
		for(var i in detachmentTypes) {
			var detachmentType = detachmentTypes[i];
			if(!isPrimary || detachmentType.canBePrimary) {
				var isSelected = (selectedDetachmentTypeId == detachmentType.id);
				retValue.push(option(textSource.getText(detachmentType.name), detachmentType.id, isSelected));
			}
		}
		return retValue;
	}

	function getExtensionSelectbox(detachmentDataIndex) {

		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var selectBox = select("extensionSelect" + detachmentDataIndex);
		selectBox.on("change", { detachmentDataIndex: detachmentDataIndex}, function(event) {
			_controller.addExtension(detachmentDataIndex, this.value);
		});

		selectBox.append(option("> " +_guiState.text["chooseExtension"] + " <", "-1", true));
		for(var i in _systemState.extensions) {
			var extension = _systemState.extensions[i];
			if(!detachmentData.isExtensionAllowed(extension.armyId)) {
				continue;
			}
			var alreadySelected = detachmentData.hasExtension(extension.armyId);

			var optionElement = option(_guiState.getText("army." + extension.armyPrefix), extension.armyId, false);
			if(alreadySelected) {
				optionElement.attr("disabled", "disabled");
			}
			selectBox.append(optionElement);
		}
		return selectBox;
	}

	function getExtensionList(detachmentDataIndex) {
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var extensionList = [];

		for(var i in detachmentData.getArmyUnits()) {
			if(i == "a0") {
				continue;
			}
			extensionList.push(getExtensionElement(_guiState.getText("army." + detachmentData.getArmyUnit(i).getArmy().armyPrefix), detachmentDataIndex, i));
		}

		return extensionList;
	}

	function getExtensionElement(label, detachmentDataIndex, armyUnitIndex) {
		var element = span(null, "extension" + detachmentDataIndex + "_" + armyUnitIndex);
		element.append(span(label, null, "extension"));
		var deleteButton = span("&nbsp;", null, "extensionDelete");
		deleteButton.on(_guiState.clickEvent, { detachmentDataIndex: detachmentDataIndex, armyUnitIndex: armyUnitIndex }, function() {
			if(_armyState.getArmyUnit(detachmentDataIndex, armyUnitIndex).hasSelections() && !confirm(_guiState.getText("message.confirmExtensionDelete"))) {
				return;
			}
			_controller.deleteExtension(detachmentDataIndex, armyUnitIndex);
		});
		element.append(deleteButton);
		return element;
	}

	this.removeExtension = function(detachmentDataIndex, armyUnitIndex, extensionId) {
		_gui.getElement("#extension" + detachmentDataIndex + "_" + armyUnitIndex).remove();
		var extensionSelect = _gui.getElement("#extensionSelect" + detachmentDataIndex);
		extensionSelect.find("option[value=" + extensionId + "]").removeAttr("disabled");
	};
	
	this.refreshDetachmentTypeSelectbox = function(detachmentDataIndex) {
		var selectBox = _gui.getElement("#detachmentTypeSelect" + detachmentDataIndex);
		if(selectBox == null) {
			return;
		}
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		selectBox.find("option").each(function(index) {
			var detachmentType = detachmentData.getDetachmentType(selectBox[0].options[index].value);
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

	this.addExtension = function(detachmentDataIndex, armyUnitIndex) {
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var extensionListElement = _gui.getElement("#extensionList" + detachmentDataIndex);
		extensionListElement.append(getExtensionElement(_guiState.getText("army." + detachmentData.getArmyUnit(armyUnitIndex).getArmy().armyPrefix), detachmentDataIndex, armyUnitIndex));
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
		_gui.getElement("#detachmentCreatorHeading").html(_guiState.text["newDetachment"]);
		_gui.getElement("#deleteAllDetachmentsButton").html(_guiState.text["deleteAllDetachments"]);
		_gui.getElement("#fileLoaderLabel").html(_guiState.text["loadArmy"]);
		_gui.getElement("#maxDetachmentsReachedMessage").html(_guiState.text["message.maxDetachmentsReached"]);

		if (_systemState.system != null) {

			for(var i in _armyState.getDetachments()) {
				//this.refreshDetachmentTypeSelectbox(i);
				//this.refreshArmySelectbox(i);
				this.refreshDetachmentBox(i);
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
			var myLabel = label().append(myCheckbox).append(_guiState.text[currentSystem.special[i].name]);
			specialContainer.append(myLabel);
			specialContainer.append("<br />");
		}
	};

	this.checkMaxDetachments = function() {
		if(_armyState.getDetachmentCount() >= 10) {
			_gui.getElement("#armySelect").addClass("invisible");
			_gui.getElement("#detachmentCreatorHeading").addClass("invisible");
			_gui.getElement("#maxDetachmentsReachedMessage").removeClass("invisible");
			$(".cloneDetachmentButton").addClass("invisible");
		} else {
			_gui.getElement("#armySelect").removeClass("invisible");
			_gui.getElement("#detachmentCreatorHeading").removeClass("invisible");
			_gui.getElement("#maxDetachmentsReachedMessage").addClass("invisible");
			$(".cloneDetachmentButton").removeClass("invisible");
		}
	};
}