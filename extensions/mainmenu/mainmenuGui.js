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
		_dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postAddExtension", this, this.onPostAddExtension, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteExtension, _dispatcher.PHASE_STATE);
	};

	this.onPostInit = function(event) {
		this.refreshArmySelectBox();
		this.renderDetachmentBoxes();
		this.checkMaxDetachments();
		this.refreshAll();
	};

	this.onPostChangeLanguage = function(event) {
		this.refreshAll();
	};

	this.onPostChangeSystem = function(event) {
		this.refreshArmySelectBox();
	};

	this.onPostAddDetachment = function(event, additionalData) {
		this.renderDetachmentBox(additionalData.detachmentData);
		this.resetArmySelect();
		this.checkMaxDetachments();
	};

	this.onPostChangeDetachmentType = function(event, additionalData) {
		this.refreshDetachmentBox(additionalData.detachmentData);
	};

	this.onPostDeleteDetachment = function(event, additionalData) {
		this.removeDetachmentBox(additionalData.detachmentData.getDetachmentDataIndex());
		this.refreshDetachmentBoxIndexes();
		this.resetArmySelect();
		this.checkMaxDetachments();
	};

	this.onPostChangeFocCount = function(event) {
		this.refreshFocCount();
	};

	this.onPostAddExtension = function (event, additionalData) {
		this.addExtension(additionalData.detachmentData, additionalData.armyUnit);
		this.refreshDetachmentBox(additionalData.detachmentData);
	};

	this.onPostDeleteExtension = function(event, additionalData) {
		this.removeExtension(additionalData.detachmentData.getDetachmentDataIndex(), additionalData.armyUnit.getArmyUnitIndex(), additionalData.extensionId);
		this.resetArmySelect();
		this.refreshDetachmentBox(additionalData.detachmentData);
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

	this.refreshArmySelectBox = function() {
		var selectBox = _gui.getElement("#armySelect");
		if(selectBox != null) {
			selectBox.children().remove();
			selectBox.append(getArmySelectBoxOptions());
		}
	};

	function getArmySelectBoxOptions() {
		
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
		
		var options = [];

		//armySelectElement.children().remove();
		options.push(option("> " +_guiState.text["chooseFaction"] + " <", "-1"));
		
		var previousArmyGroup = -1;

		for (var j = 0; j < sortedArmies.length; j++) {
			//document.writeln(sortedArmies[j].armyGroup);
		}
		for (var j = 0; j < sortedArmies.length; j++) {
			var army = sortedArmies[j];
			if (army.armyGroup != previousArmyGroup) {
				previousArmyGroup = army.armyGroup;
				if (j > 0) {
					options.push('<option disabled="true"></option>');
				}
			}
			var armyName = _guiState.text["army." + _systemState.armies[army.armyId].armyPrefix];
			options.push(option(armyName, army.armyId));
		}

		return options;
	}

	this.resetArmySelect = function() {
		var armySelect = _gui.getElement("#armySelect");
		armySelect.val("-1").change();
	};

	this.renderDetachmentBoxes = function() {
		$("#detachmentBoxContainer").children().remove();
		for(var i in _armyState.getDetachments()) {
			this.renderDetachmentBox(_armyState.getDetachmentData(i));
		}
	};

	this.renderDetachmentBox = function(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
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
		extensions.append(span(getExtensionSelectbox(detachmentData)));
		body.append(extensions);
		var extensionListElement = getExtensionListElement(detachmentData);
		body.append(extensionListElement);

		var detachmentType = div(null, null, "detachmentContainerRow");
		detachmentType.append(span(_guiState.getText("detachmentType"), null, "detachmentTypeLabel"));
		detachmentType.append(span(getDetachmentTypeSelectbox(detachmentData)));
		body.append(detachmentType);

		detachmentBoxContent.append(body);
		detachmentBox.append(detachmentBoxContent);

		var buttons = div(null, null, "entryButtons");
		var deleteButton = div(null, null, "entryButton deleteButton", { title: _guiState.getText("delete"), alt: _guiState.getText("delete") });
		deleteButton.on(_guiState.clickEvent, { detachmentData: detachmentData }, function(event) {
			if(event.data.detachmentData.hasSelections() && !confirm(_guiState.getText("message.confirmDetachmentDelete"))) {
				return;
			}
			_controller.deleteDetachment(detachmentData);
		});
		buttons.append(deleteButton);
		var cloneButton = div(null, null, "entryButton cloneButton cloneDetachmentButton", { title: _guiState.getText("clone"), alt: _guiState.getText("clone") });
		cloneButton.on(_guiState.clickEvent, { detachmentData: detachmentData }, function(event) {
			_controller.cloneDetachment(event.data.detachmentData);
		});
		buttons.append(cloneButton);

		detachmentBox.append(buttons);

		_gui.getElement("#detachmentBoxContainer").append(detachmentBox);
	};

	function getDetachmentBoxHeadingText(detachmentData) {
		var headingText = _guiState.getText("army." + detachmentData.getFirstArmyUnit().getArmy().armyPrefix);
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

	this.refreshDetachmentBox = function(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var detachmentBox = _gui.getElement("#detachmentBox" + detachmentDataIndex);
		if(detachmentBox == null) {
			return;
		}

		var headingText = getDetachmentBoxHeadingText(detachmentData);
		detachmentBox.find(".entryName").html(headingText);
		detachmentBox.find(".extensionLabel").html(_guiState.getText("extensions"));
		detachmentBox.find(".detachmentTypeLabel").html(_guiState.getText("detachmentType"));
		this.refreshDetachmentTypeSelectbox(detachmentData);
		this.refreshExtensionSelectbox(detachmentData);
		this.refreshExtensionList(detachmentData);
	};
	
	function getDetachmentTypeSelectbox(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var isPrimary = (detachmentDataIndex == "d0");
		var selectBox = select("detachmentTypeSelect" + detachmentDataIndex);

		selectBox.on("change", { detachmentData: detachmentData}, function(event) {
			if(detachmentData.getDetachmentType(this.value).isFormation() && detachmentData.hasSelections() && !confirm(_guiState.getText("message.confirmFormationSelect"))) {
				return;
			}
			if(detachmentData.detachmentType.hasModifications()) {
				this.prop("disabled", true);
			}
			_controller.changeDetachmentType(detachmentData, this.value, true);
		});
		selectBox.append(getDetachmentTypeOptions(detachmentData.getDetachmentTypes(), detachmentData.detachmentType.id, isPrimary, detachmentData));
		if(detachmentData.detachmentType.hasModifications()) {
			selectBox.prop("disabled", true);
		}

		return selectBox;
	}

	this.refreshDetachmentTypeSelectbox = function(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var selectBox = _gui.getElement("#detachmentTypeSelect" + detachmentDataIndex);
		if(selectBox != null) {
			_gui.removeElement("#detachmentTypeSelect" + detachmentDataIndex);
			selectBox.replaceWith(getDetachmentTypeSelectbox(detachmentData));
		}
	};

	this.refreshExtensionSelectbox = function(detachmentData) {
		var selectBox = _gui.getElement("#extensionSelect" + detachmentData.getDetachmentDataIndex());
		//var selectBox = $("#extensionSelect" + detachmentDataIndex);
		if(selectBox != null) {
			_gui.removeElement("#extensionSelect" + detachmentData.getDetachmentDataIndex());
			selectBox.replaceWith(getExtensionSelectbox(detachmentData));
		}
	};

	this.refreshExtensionList = function(detachmentData) {
		var list = _gui.getElement("#extensionList" + detachmentData.getDetachmentDataIndex());
		if(list != null) {
			_gui.removeElement("#extensionList" + detachmentData.getDetachmentDataIndex());
			list.replaceWith(getExtensionListElement(detachmentData));
		}
	};

	function getDetachmentTypeOptions(detachmentTypes, selectedDetachmentTypeId, isPrimary, textSource) {

		var sortedDetachmentTypes = [];
		for(var i in detachmentTypes) {
			sortedDetachmentTypes.push(detachmentTypes[i]);
		}
		sortedDetachmentTypes = sortedDetachmentTypes.sort(function(a, b) {
			if (a.group < b.group) {
				return -1;
			} else if (a.group > b.group) {
				return 1;
			}
			return textSource.getText(a.name) > textSource.getText(b.name) ? 1 : -1;
		});

		var retValue = [];
		var previousGroup = 10;
		for(var i in sortedDetachmentTypes) {
			var detachmentType = sortedDetachmentTypes[i];
			if(!isPrimary || detachmentType.canBePrimary) {

				if (detachmentType.group != previousGroup) {
					previousGroup = detachmentType.group;
					retValue.push('<option disabled="true"></option>');
				}

				var isSelected = (selectedDetachmentTypeId == detachmentType.id);
				retValue.push(option(textSource.getText(detachmentType.name), detachmentType.id, isSelected));
			}
		}
		return retValue;
	}

	function getExtensionSelectbox(detachmentData) {

		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var selectBox = select("extensionSelect" + detachmentDataIndex);
		selectBox.on("change", { detachmentData: detachmentData}, function(event) {
			_controller.addExtension(event.data.detachmentData, this.value);
		});

		selectBox.append(option("> " +_guiState.text["chooseExtension"] + " <", "-1", true));
		var hasSelectableExtensions = false;
		for(var i in _systemState.extensions) {
			var extension = _systemState.extensions[i];
			if(!detachmentData.isExtensionAllowed(extension.armyId)) {
				continue;
			}
			var alreadySelected = detachmentData.hasExtension(extension.armyId);

			var optionElement = option(_guiState.getText("army." + extension.armyPrefix), extension.armyId, false);
			if(alreadySelected) {
				optionElement.attr("disabled", "disabled");
			} else {
				hasSelectableExtensions = true;
			}
			selectBox.append(optionElement);
		}
		selectBox.prop("disabled", !hasSelectableExtensions);
		return selectBox;
	}

	function getExtensionListElement(detachmentData) {

		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var element = div(null, "extensionList" + detachmentDataIndex, "extensionList");

		var extensionList = [];

		for(var i in detachmentData.getArmyUnits()) {
			if(i == "a0") {
				continue;
			}
			var armyUnit = detachmentData.getArmyUnit(i);
			extensionList.push(getExtensionElement(_guiState.getText("army." + armyUnit.getArmy().armyPrefix), detachmentData, armyUnit));
		}

		for(var i = 0; i < extensionList.length; i++) {
			element.append(extensionList[i]);
		}
		return element;
	}

	function getExtensionElement(label, detachmentData, armyUnit) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var armyUnitIndex = armyUnit.getArmyUnitIndex();
		var element = span(null, "extension" + detachmentDataIndex + "_" + armyUnitIndex);
		element.append(span(label, null, "extension"));
		var deleteButton = span("&nbsp;", null, "extensionDelete");
		deleteButton.on(_guiState.clickEvent, { detachmentData: detachmentData, armyUnit: armyUnit }, function() {
			if(armyUnit.hasSelections() && !confirm(_guiState.getText("message.confirmExtensionDelete"))) {
				return;
			}
			_controller.deleteExtension(detachmentData, armyUnit);
		});
		element.append(deleteButton);
		return element;
	}

	this.removeExtension = function(detachmentDataIndex, armyUnitIndex, extensionId) {
		_gui.getElement("#extension" + detachmentDataIndex + "_" + armyUnitIndex).remove();
		var extensionSelect = _gui.getElement("#extensionSelect" + detachmentDataIndex);
		extensionSelect.find("option[value=" + extensionId + "]").removeAttr("disabled");
	};
	
	this.removeDetachmentBox = function(detachmentDataIndex) {
		_gui.getElement("#detachmentBox" + detachmentDataIndex).remove();
	};

	this.addExtension = function(detachmentData, armyUnit) {
		var extensionListElement = _gui.getElement("#extensionList" + detachmentData.getDetachmentDataIndex());
		extensionListElement.append(getExtensionElement(_guiState.getText("army." + armyUnit.getArmy().armyPrefix), detachmentData, armyUnit));
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

			this.refreshArmySelectBox();

			for(var i in _armyState.getDetachments()) {
				//this.refreshDetachmentTypeSelectbox(i);
				//this.refreshArmySelectbox(i);
				this.refreshDetachmentBox(_armyState.getDetachmentData(i));
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
				event.data.special.display = $(this).is(':checked');
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