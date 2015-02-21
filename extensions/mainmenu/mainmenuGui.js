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

function MainmenuGui(dispatcher, systemState, armyState, controller, gui) {

	this.init = function() {
		dispatcher.bindEvent("postInit", this, this.onPostInit, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeSystem", this, this.onPostChangeSystem, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddExtension", this, this.onPostAddExtension, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteExtension, dispatcher.PHASE_STATE);
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
	//	var systemSelectElement = gui.getElement("#systemSelect");
	//	systemSelectElement.children().remove();
	//	systemSelectElement.append(option("", "-1"));
	//	var currentSystem = systemState.system;
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
		var selectBox = gui.getElement("#armySelect");
		if(selectBox != null) {
			selectBox.children().remove();
			selectBox.append(getArmySelectBoxOptions());
		}
	};

	function getArmySelectBoxOptions() {
		
		var sortedArmies = [];
		for(var i in systemState.armies) {
			sortedArmies.push(systemState.armies[i]);
		}
		sortedArmies = sortedArmies.sort(function(a, b) {
			if (a.armyGroup < b.armyGroup) {
				return -1;
			} else if (a.armyGroup > b.armyGroup) {
				return 1;
			}
			return _guiState.getText("army." + a.armyPrefix) > _guiState.getText("army." + b.armyPrefix) ? 1 : -1;
		});
		
		var options = [];

		//armySelectElement.children().remove();
		options.push(option("> " +_guiState.getText("chooseFaction") + " <", "-1"));
		
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
			var armyName = _guiState.getText("army." + systemState.armies[army.armyId].armyPrefix);
			options.push(option(armyName, army.armyId));
		}

		return options;
	}

	this.resetArmySelect = function() {
		var armySelect = gui.getElement("#armySelect");
		armySelect.val("-1").change();
	};

	this.renderDetachmentBoxes = function() {
		$("#detachmentBoxContainer").children().remove();
		for(var i in armyState.getDetachments()) {
			this.renderDetachmentBox(armyState.getDetachmentData(i));
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
			controller.deleteDetachment(detachmentData);
		});
		buttons.append(deleteButton);
		var cloneButton = div(null, null, "entryButton cloneButton cloneDetachmentButton", { title: _guiState.getText("clone"), alt: _guiState.getText("clone") });
		cloneButton.on(_guiState.clickEvent, { detachmentData: detachmentData }, function(event) {
			controller.cloneDetachment(event.data.detachmentData);
		});
		buttons.append(cloneButton);

		detachmentBox.append(buttons);

		gui.getElement("#detachmentBoxContainer").append(detachmentBox);
	};

	function getDetachmentBoxHeadingText(detachmentData) {
		var headingText = _guiState.getText("army." + detachmentData.getFirstArmyUnit().getArmy().armyPrefix);
		if(detachmentData.getPosition() == 1) {
			headingText += " (" + _guiState.getText("primaryDetachment") + ")";
		}
		return headingText;
	}

	this.refreshDetachmentBoxIndexes = function() {
		for(var detachmentDataIndex in armyState.getDetachments()) {
			var detachmentData = armyState.getDetachmentData(detachmentDataIndex);
			gui.getElement("#detachmentBox" + detachmentDataIndex).find(".entryArmyIndex").html(detachmentData.getPosition());
		}
	};

	this.refreshDetachmentBox = function(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var detachmentBox = gui.getElement("#detachmentBox" + detachmentDataIndex);
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
			controller.changeDetachmentType(detachmentData, this.value, true);
		});
		selectBox.append(getDetachmentTypeOptions(detachmentData.getDetachmentTypes(), detachmentData.detachmentType.id, isPrimary, detachmentData));
		if(detachmentData.detachmentType.hasModifications()) {
			selectBox.prop("disabled", true);
		}

		return selectBox;
	}

	this.refreshDetachmentTypeSelectbox = function(detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var selectBox = gui.getElement("#detachmentTypeSelect" + detachmentDataIndex);
		if(selectBox != null) {
			gui.removeElement("#detachmentTypeSelect" + detachmentDataIndex);
			selectBox.replaceWith(getDetachmentTypeSelectbox(detachmentData));
		}
	};

	this.refreshExtensionSelectbox = function(detachmentData) {
		var selectBox = gui.getElement("#extensionSelect" + detachmentData.getDetachmentDataIndex());
		//var selectBox = $("#extensionSelect" + detachmentDataIndex);
		if(selectBox != null) {
			gui.removeElement("#extensionSelect" + detachmentData.getDetachmentDataIndex());
			selectBox.replaceWith(getExtensionSelectbox(detachmentData));
		}
	};

	this.refreshExtensionList = function(detachmentData) {
		var list = gui.getElement("#extensionList" + detachmentData.getDetachmentDataIndex());
		if(list != null) {
			gui.removeElement("#extensionList" + detachmentData.getDetachmentDataIndex());
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
			controller.addExtension(event.data.detachmentData, this.value);
		});

		var sortedExtensions = [];
		for(var i in systemState.extensions) {
			sortedExtensions.push(systemState.extensions[i]);
		}
		sortedExtensions = sortedExtensions.sort(function(a, b) {
			return _guiState.getText("army." + a.armyPrefix) > _guiState.getText("army." + b.armyPrefix) ? 1 : -1;
		});

		selectBox.append(option("> " +_guiState.getText("chooseExtension") + " <", "-1", true));
		var hasSelectableExtensions = false;
		for(var i in sortedExtensions) {
			var extension = sortedExtensions[i];
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
			controller.deleteExtension(detachmentData, armyUnit);
		});
		element.append(deleteButton);
		return element;
	}

	this.removeExtension = function(detachmentDataIndex, armyUnitIndex, extensionId) {
		gui.getElement("#extension" + detachmentDataIndex + "_" + armyUnitIndex).remove();
		var extensionSelect = gui.getElement("#extensionSelect" + detachmentDataIndex);
		extensionSelect.find("option[value=" + extensionId + "]").removeAttr("disabled");
	};
	
	this.removeDetachmentBox = function(detachmentDataIndex) {
		gui.getElement("#detachmentBox" + detachmentDataIndex).remove();
	};

	this.addExtension = function(detachmentData, armyUnit) {
		var extensionListElement = gui.getElement("#extensionList" + detachmentData.getDetachmentDataIndex());
		extensionListElement.append(getExtensionElement(_guiState.getText("army." + armyUnit.getArmy().armyPrefix), detachmentData, armyUnit));
	};
	
	/**
	 * Refreshes all UI elements.
	 */
	this.refreshAll = function() {
		this.refreshSpecialContainer();
		gui.getElement("#creditsButton").find("a").html(_guiState.getText("credits"));
		gui.getElement("#downloadButton").find("a").html(_guiState.getText("download"));
		gui.getElement("#forumButton").find("a").html(_guiState.getText("forum"));
		gui.getElement("#armyHeading").html(_guiState.getText("detachments"));
		gui.getElement("#optionsHeading").html(_guiState.getText("viewOptions"));
		gui.getElement("#linksHeading").html(_guiState.getText("links"));
		gui.getElement("#resetButton").html(_guiState.getText("reset"));
		gui.getElement("#detachmentCreatorHeading").html(_guiState.getText("newDetachment"));
		gui.getElement("#deleteAllDetachmentsButton").html(_guiState.getText("deleteAllDetachments"));
		gui.getElement("#fileLoaderLabel").html(_guiState.getText("loadArmy"));
		gui.getElement("#maxDetachmentsReachedMessage").html(_guiState.getText("message.maxDetachmentsReached"));

		if (systemState.system != null) {

			this.refreshArmySelectBox();

			for(var i in armyState.getDetachments()) {
				//this.refreshDetachmentTypeSelectbox(i);
				//this.refreshArmySelectbox(i);
				this.refreshDetachmentBox(armyState.getDetachmentData(i));
			}
		}
	};
	
	this.refreshSpecialContainer = function() {
		var specialContainer = gui.getElement("#specialContainer");
		specialContainer.children().remove();
		var currentSystem = systemState.system;
		
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
				dispatcher.triggerEvent("mainmenu.postChangeSpecialDisplay");
			});
			var myLabel = label().append(myCheckbox).append(_guiState.getText(currentSystem.special[i].name));
			specialContainer.append(myLabel);
			specialContainer.append("<br />");
		}
	};

	this.checkMaxDetachments = function() {
		if(armyState.getDetachmentCount() >= 10) {
			gui.getElement("#armySelect").addClass("invisible");
			gui.getElement("#detachmentCreatorHeading").addClass("invisible");
			gui.getElement("#maxDetachmentsReachedMessage").removeClass("invisible");
			$(".cloneDetachmentButton").addClass("invisible");
		} else {
			gui.getElement("#armySelect").removeClass("invisible");
			gui.getElement("#detachmentCreatorHeading").removeClass("invisible");
			gui.getElement("#maxDetachmentsReachedMessage").addClass("invisible");
			$(".cloneDetachmentButton").removeClass("invisible");
		}
	};
}