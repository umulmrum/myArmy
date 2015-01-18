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

function DesignerGui() {
	
	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postAddSelection", this, this.onPostAddSelection, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postRemoveSelection", this, this.onPostRemoveSelection, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postStateRefresh", this, this.onPostStateRefresh, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postPrepareGui", this, this.onPostPrepareGui, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postSelectOption", this, this.onPostSelectOption, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("mainmenu.postChangeSpecialDisplay", this, this.onPostChangeSpecialDisplay, _dispatcher.PHASE_STATE);
	};
	
	this.onPostInit = function(event) {
		this.refreshElements();
	};
	
	this.onPostAddSelection = function(event, additionalData) {
		var armyUnit = _armyState.getArmyUnit(additionalData.entityslot.detachmentDataIndex, additionalData.entityslot.armyUnitIndex);
		this.renderEntry(armyUnit, additionalData.entityslot.localId);
	};
	
	this.onPostRemoveSelection = function(event, additionalData) {
		this.removeSlotEntry(additionalData.entityslot.localId);
	};
	
	this.onPostStateRefresh = function(event) {
		traverseArmyUnit(this, this.refreshDirtyContainerEntries);
	};
	
	this.onPostPrepareGui = function(event) {
		this.renderSlotEntries();
	};
	
	this.onPostResetArmy = function(event) {
		this.removeAllSlotEntries();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.refreshSlotEntries();
		this.refreshElements();
	};
	
	this.onPostChangeArmy = function(event) {
		this.removeInvalidEntries();
	};

	this.onPostDeleteDetachment = function(event) {
		this.removeInvalidEntries();
		this.refreshSlotEntries();
	};
	
	this.onPreCallFragment = function(event, additionalData) {
		if(additionalData.newFragment == "designer") {
			if(!_guiState.isSmallDevice) {
				showChooser();
			}
		}
	};
	
	this.onPostSelectOption = function(event, additionalData) {
		var option = _armyState.lookupId(additionalData.optionLocalId);
		if (option.currentMaxTaken > 1) {
			this.setMultiOptionValues(option.localId, option.currentMinTaken,
					option.currentMaxTaken, option.currentCount);
		}
	};
	
	this.onPostChangeSpecialDisplay = function(event) {
		traverseArmyUnit(this, this.refreshSelections);
	};
	
	/**
	 * Refreshes UI elements.
	 */
	this.refreshElements = function() {
		_gui.getElement("#optionCountOkButton").html(_guiState.text["ok"]);
	};
	
	/**
	 * Renders all entries that are currently selected by the user.
	 * Needs only be called on startup when restoring a saved army.
	 */
	this.renderSlotEntries = function() {
		for ( var slotId in _systemState.slots) {
			this.renderSlotEntriesForSlot(_systemState.slots[slotId]);
		}
	};
	
	this.renderSlotEntriesForSlot = function(slot) {
		if (_systemState.system == null) {
			return;
		}
		traverseArmyUnit(this, this.renderSelectionsForSlot, { slotId: slot.slotId });
	};
	
	this.refreshSlotEntries = function() {
		traverseArmyUnit(this, this.refreshSlotEntriesForArmy);
	};
	
	this.refreshSlotEntriesForArmy = function(armyUnit) {
		for(var i in armyUnit.getSelections()) {
			var entityslot = armyUnit.getSelection(i);
			this.refreshEntry(armyUnit, entityslot);
		}
	};
	
	this.renderSelectionsForSlot = function(armyUnit, armyUnitIndex, detachmentData, detachmentDataIndex, additionalParams) {
		var selections = armyUnit.getSelections();
		for (var j = 0; j < selections.length; j++) {
			if(selections[j].slotId == additionalParams.slotId) {
				this.renderEntry(armyUnit, selections[j].localId);
			}
		}
	};
	
	/**
	 * Renders an entity from scratch.
	 * Use this when adding/cloning an entity or restoring a persisted army.
	 */
	this.renderEntry = function(armyUnit, entityslotLocalId) {
		var entityslot = _armyState.lookupId(entityslotLocalId);
		var entity = entityslot.entity;
		var container = _gui.getElement("#slotentryDesignerList" + entityslot.slotId);
		var isCollapsed = entityslot.optionDisplayState == _guiState.OPTION_DISPLAYSTATE.COLLAPSED;

		var entry = null;
		var entryContent = null;
		var optionContainer = null;

		entry = li(null, "entry_" + entityslotLocalId, "entry", { "data-localid": entityslotLocalId });
		entryContent = div(null, "entryContent_" + entityslotLocalId, "entryContent", null);
		entry.append(entryContent);
		optionContainer = table();
		
		var position = getEntryPosition(armyUnit.getSelections(), entityslot);
		if(position == 0) {
			container.prepend(entry);
		} else {
			container.find("li:nth-child(" + position + ")").after(entry);
		}
		
		entry.on(_guiState.clickEvent, ".option:not(.popup)", { target: this }, function(event) {
			if (!wasClick(event)) {
				return true; // return true so that the event can be
				// handled by others (i.e. sliding
				// left/right)
			}
			event.data.target.clickOption($(this).attr('data-localId'));
		});

		this.renderEntryHeader(armyUnit, entryContent, entityslot);

		if (entity.minCount < entity.maxCount) {
			this.renderModelCountHeader(entryContent, entity, entityslot);
		}

		var optionListCount = 0;

		var isFirstOptionList = true;
		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			optionListCount += this.renderOptionList(armyUnit, optionContainer, optionList,
					isCollapsed, isFirstOptionList, 1, false);
			if (optionListCount > 0) {
				isFirstOptionList = false;
			}
		}
		if (optionListCount > 0) {
			var optionContainerDiv = div(null, null, "optionContainer");
			entryContent.append(optionContainerDiv.append(optionContainer));
		}

		this.renderEntryActions(armyUnit, entry, entityslot);
	};

	/**
	 * Determines the display position of a selection. The order is as follows:
	 * - order by detachmentData
	 * - in each detachmentData, order by armyUnit
	 * - in each armyUnit use the order given in the selections parameter
	 *
	 * @param selections
	 * @param entityslot
	 * @returns {number}
	 */
	function getEntryPosition(selections, entityslot) {
		var position = 0;
		var i = 0;

		for(i in _armyState.getDetachments()) {
			var detachmentData = _armyState.getDetachmentData(i);
			if(detachmentData.getDetachmentDataIndex() == entityslot.detachmentDataIndex) {
				break;
			}
			for(var j in detachmentData.getArmyUnits()) {
				var armyUnit = detachmentData.getArmyUnit(j);
				position += armyUnit.getSelectionCountPerSlot(entityslot.slotId);
			}
		}

		var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
		for(var i in detachmentData.getArmyUnits()) {
			var armyUnit = detachmentData.getArmyUnit(i);
			if(armyUnit.getArmyUnitIndex() == entityslot.armyUnitIndex) {
				break;
			}
			position += armyUnit.getSelectionCountPerSlot(entityslot.slotId);
		}

		i = 0;
		while(i < selections.length) {
			var sel = selections[i];
			if(sel.slotId == entityslot.slotId) {
				if(sel.localId == entityslot.localId) {
					break;
				}
				position++;
			}
			i++;
		}

		return position;
	}

	this.renderEntryHeader = function(armyUnit, container, entityslot) {
		var entity = entityslot.entity;
		var entryHeader = null;
		var entityName = armyUnit.getText(entity.entityName);
		var entityCost = "";
		if (entity.totalCost > 0) {
			entityCost = entity.totalCost + " " + _guiState.text["points"];
		}
		entryHeader = div(null, null, "entryHeader commonHighlight");
			var armyIndexCss = "entryArmyIndex";
			if(entity.minCount < entity.maxCount) {
				armyIndexCss += " entryArmyIndexWithModelCount";
			}
			var armyIndexElement = span(_armyState.getDetachmentData(entityslot.detachmentDataIndex).getPosition(), null, armyIndexCss);
			entryHeader.append(armyIndexElement);
		if(_armyState.getDetachmentCount() < 2) {
			armyIndexElement.addClass("invisible");
		}
		var entityNameElement = span(entityName, null, "entryName");
		entryHeader.append(entityNameElement);
		var entityCostElement = span(entityCost, null, "entryPoints");
		entryHeader.append(entityCostElement);
		container.append(entryHeader);
	};

	this.renderModelCountHeader = function(container, entity, entityslot) {
		var modelCountHeader = null;
		var minButton = null;
		var lessButton = null;
		var moreButton = null;
		var maxButton = null;
		var modelCountInput = null;
		var modelCountInfoText = _guiState.text["pointsPerModel"].replace(
				/\{0\}/, entity.currentCostPerModel);

			modelCountHeader = div(null, null, "entryHeader commonHighlight modelCountHeader");

			minButton = span(null, null, "incDecButton minButton").on(
					_guiState.clickEvent, {
						entityslot : entityslot,
						count : entity.minCount
					}, this.clickSetModelCount);
			lessButton = span(null, null, "incDecButton lessButton").on(
					_guiState.clickEvent, {
						entityslot : entityslot,
						count : -1
					}, this.clickIncDecModelCount);
			moreButton = span(null, null, "incDecButton moreButton").on(
					_guiState.clickEvent, {
						entityslot : entityslot,
						count : 1
					}, this.clickIncDecModelCount);
			maxButton = span(null, null, "incDecButton maxButton").on(
					_guiState.clickEvent, {
						entityslot : entityslot,
						count : entity.maxCount
					}, this.clickSetModelCount);

			modelCountInput = span(entity.currentCount, "modelCount_"
					+ entityslot.localId, "entryCount");
			var modelCount = span().append(minButton).append(lessButton)
					.append(modelCountInput).append(moreButton).append(
							maxButton);
			modelCountHeader.append(modelCount);
			if (entity.minCount < entity.maxCount) {
				modelCountHeader.append(span(modelCountInfoText, null,
						"pointsPerModel"));
			}
			container.append(modelCountHeader);

		if (entity.currentCount <= entity.minCount) {
			minButton.html("&nbsp;");
			lessButton.html("&nbsp;");
		} else {
			minButton.html("&laquo;");
			lessButton.html("&lsaquo;");
		}
		if (entity.currentCount >= entity.maxCount) {
			moreButton.html("&nbsp;");
			maxButton.html("&nbsp;");
		} else {
			moreButton.html("&rsaquo;");
			maxButton.html("&raquo;");
		}
	};
	
	this.renderOptionList = function(armyUnit, optionContainer, optionList, isCollapsed,
			isFirstOptionList, depth, invisible) {
		// if (optionList.currentMaxTaken <= 0) {
		// return 0;
		// }
		var isFirstOption = true;
		var wasRendered;
		for ( var j in optionList.options) {
			var option = optionList.options[j];
			wasRendered = this.renderOption(armyUnit, optionContainer, optionList, option,
					isCollapsed, isFirstOptionList, isFirstOption, depth,
					invisible);

			isFirstOption = isFirstOption && !wasRendered;
		}
		return 1;
	};

    /**
     *
     * @param armyUnit
     * @param optionContainer
     * @param optionList
     * @param option
     * @param isCollapsed
     * @param isFirstOptionList
     * @param isFirstOption
     * @param depth
     * @param invisible
     * @return true if option was rendered, false otherwise
     */
	this.renderOption = function(armyUnit, optionContainer, optionList, option, isCollapsed,
			isFirstOptionList, isFirstOption, depth, invisible) {

		var parentEntityslot = _armyState.lookupId(option.parentEntityslot);
		var optionEntity = _armyState.getArmyUnit(parentEntityslot.detachmentDataIndex, parentEntityslot.armyUnitIndex).getFromEntityPool(option.entityId);

		var cssClasses = "option";
		if (isFirstOption && !isFirstOptionList) {
			cssClasses += " firstOption";
		}
		if (depth > 1) {
			cssClasses += " suboption";
		}
		if (option.disabled || option.poolAvailable < 1
				|| option.localPoolAvailable < 1) {
			cssClasses += " inactive";
		}
		if (option.selected) {
			cssClasses += " selected";
		}
		if (invisible || optionList.currentMaxTaken <= 0
				|| (isCollapsed && !option.selected) || !_gui.checkDisplay(option)) {
			cssClasses += " invisible";
		}
		var optionElement  = tr("option_" + option.localId, cssClasses, { "data-localId": option.localId });
		var padding = 3 + (depth - 1) * 11;
		var optionTextAttr = {};
		optionTextAttr["style"] = "padding-left: " + padding + "px";

		var optionText = armyUnit.getText(optionEntity.entityName);
		if (option.currentMaxTaken > 1) {
			optionText += " " + option.currentCount + "/"
					+ option.currentMaxTaken;
		}
		var optionCost = (option.totalCost != 0 ? option.totalCost : '');
		var	optionTextElement = td(optionText, null, "optionText",
					optionTextAttr);
		optionElement.append(optionTextElement);

		var optionCostAttr = {};
		optionCostAttr["style"] = "padding-right: " + padding + "px";
		optionElement.append(td(optionCost, null, "optionCost",
					optionCostAttr));
		optionContainer.append(optionElement);

		if (option.hasOptions()) {
			var isFirstSubOptionList = true;
			var subOptionListCount = 0;
			for ( var k in option.optionLists) {
				var subOptionList = option.optionLists[k];

				subOptionListCount += this.renderOptionList(armyUnit, optionContainer,
						subOptionList, isCollapsed, isFirstSubOptionList,
						depth + 1, !option.selected);
				if (subOptionListCount > 0) {
					isFirstSubOptionList = false;
				}
			}
		}
		return true;
	};
	
	this.renderEntryActions = function(armyUnit, container, entityslot) {
		var entryButtons = null;
		var collapseButton = null;
		var expandButton = null;
		var hasOptions = entityslot.entity.hasOptions();

			entryButtons = div(null, null, "entryButtons");

			var deleteButton = div("", null, "entryButton deleteButton");
			deleteButton.on(_guiState.clickEvent, function() {
				_controller.deleteEntry(entityslot);
				return false;
			});
			entryButtons.append(deleteButton);

			var cloneButton = div("", null, "entryButton cloneButton");
			cloneButton.on(_guiState.clickEvent, function() {
				_controller.cloneEntry(entityslot);
				return false;
			});
			entryButtons.append(cloneButton);

			if (hasOptions) {
				collapseButton = div("", null, "entryButton collapseButton");
				collapseButton.on(_guiState.clickEvent, $.proxy(
						function(event) {
							this.collapseEntryOptions(armyUnit, entityslot);
							return false;
						}, this));
				entryButtons.append(collapseButton);

				expandButton = div("", null, "entryButton expandButton");
				expandButton.on(_guiState.clickEvent, $.proxy(
						function(event) {
							this.expandEntryOptions(armyUnit, entityslot);
							return false;
						}, this));
				entryButtons.append(expandButton);
			}

			container.append(entryButtons);

		deleteButton.attr("title", _guiState.text["delete"]);
		deleteButton.attr("alt", _guiState.text["delete"]);
		cloneButton.attr("title", _guiState.text["clone"]);
		cloneButton.attr("alt", _guiState.text["clone"]);
		if (hasOptions) {
			collapseButton.attr("title", _guiState.text["collapse"]);
			collapseButton.attr("alt", _guiState.text["collapse"]);
			expandButton.attr("title", _guiState.text["expand"]);
			expandButton.attr("alt", _guiState.text["expand"]);

			if (entityslot.optionDisplayState == _guiState.OPTION_DISPLAYSTATE.EXPANDED) {
				expandButton.css("display", "none");
				collapseButton.css("display", "inline-block");
			} else {
				expandButton.css("display", "inline-block");
				collapseButton.css("display", "none");
			}
		}
	};
	
	this.refreshSelections = function(armyUnit) {
		for(var i in armyUnit.getSelections()) {
			var entityslot = armyUnit.getSelection(i);
			this.refreshEntry(armyUnit, entityslot);
			entityslot.dirty = false;
		}
	};
	
	this.refreshDirtyContainerEntries = function(armyUnit) {
		for(var i in armyUnit.getSelections()) {
			var entityslot = armyUnit.getSelection(i);
			if(entityslot.dirty) {
				this.refreshEntry(armyUnit, entityslot);
				entityslot.dirty = false;
			}
		}
	};
	
	this.refreshEntry = function(armyUnit, entityslot) {
		var entity = entityslot.entity;
		var container = $("#entriesPerSlotWrapper" + entityslot.slotId);
		var isCollapsed = entityslot.optionDisplayState == _guiState.OPTION_DISPLAYSTATE.COLLAPSED;

		var entry = container.find("#entry_" + entityslot.localId);
		var optionContainer = entry.find(".optionContainer table");
		var entryContent = entry.find("#entryContent_" + entityslot.localId);

		this.refreshEntryHeader(armyUnit, entryContent, entityslot);

		if (entity.minCount < entity.maxCount) {
			this.refreshModelCountHeader(entryContent, entity, entityslot);
		}

		var optionListCount = 0;
		var isFirstOptionList = true;
		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			optionListCount += this.refreshOptionList(armyUnit, optionContainer, optionList,
					isCollapsed, isFirstOptionList, 1, false);
			if (optionListCount > 0) {
				isFirstOptionList = false;
			}
		}

		this.refreshEntryActions(entry, entityslot);
	};

	this.refreshEntryHeader = function(armyUnit, container, entityslot) {

		var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex)
		var entity = entityslot.entity;
		var entryHeader = null;
		var entityName = armyUnit.getText(entity.entityName);
		var entityCost = "";
		if (entity.totalCost > 0) {
			entityCost = entity.totalCost + " " + _guiState.text["points"];
		}
		entryHeader = container.find(".entryHeader");
		var armyIndexElement = entryHeader.find(".entryArmyIndex");
		armyIndexElement.html(detachmentData.getPosition());
		if(_armyState.getDetachmentCount() > 1) {
			armyIndexElement.removeClass("invisible");
		} else {
			armyIndexElement.addClass("invisible");
		}
		entryHeader.find(".entryName").html(entityName);
		entryHeader.find(".entryPoints").html(entityCost);
	};

	this.refreshModelCountHeader = function(container, entity, entityslot) {
		var minButton = null;
		var lessButton = null;
		var moreButton = null;
		var maxButton = null;
		var modelCountInfoText = _guiState.text["pointsPerModel"].replace(
				/\{0\}/, entity.currentCostPerModel);

		var modelCountHeader = container.find(".modelCountHeader");
		
			minButton = modelCountHeader.find(".minButton");
			lessButton = modelCountHeader.find(".lessButton");
			moreButton = modelCountHeader.find(".moreButton");
			maxButton = modelCountHeader.find(".maxButton");
			modelCountHeader.find(".entryCount").html(entity.currentCount);
			modelCountHeader.find(".pointsPerModel").html(modelCountInfoText);

		if (entity.currentCount <= entity.minCount) {
			minButton.html("&nbsp;");
			lessButton.html("&nbsp;");
		} else {
			minButton.html("&laquo;");
			lessButton.html("&lsaquo;");
		}
		if (entity.currentCount >= entity.maxCount) {
			moreButton.html("&nbsp;");
			maxButton.html("&nbsp;");
		} else {
			moreButton.html("&rsaquo;");
			maxButton.html("&raquo;");
		}
	};
	
	this.refreshOptionList = function(armyUnit, optionContainer, optionList, isCollapsed,
			isFirstOptionList, depth, invisible) {
		var isFirstOption = true;
		var wasRendered;
		for ( var j in optionList.options) {
			var option = optionList.options[j];
			wasRendered = this.refreshOption(armyUnit, optionContainer, optionList, option,
					isCollapsed, isFirstOptionList, isFirstOption, depth,
					invisible);

			isFirstOption = isFirstOption && !wasRendered;
		}
		return 1;
	};

    /**
     *
     * @param armyUnit
     * @param optionContainer
     * @param optionList
     * @param option
     * @param isCollapsed
     * @param isFirstOptionList
     * @param isFirstOption
     * @param depth
     * @param invisible
     * @return boolean true if option was rendered, false otherwise
     */
	this.refreshOption = function(armyUnit, optionContainer, optionList, option, isCollapsed,
			isFirstOptionList, isFirstOption, depth, invisible) {

		var optionEntity = armyUnit.getFromEntityPool(option.entityId);
		var cssClasses = "option";
		if (isFirstOption && !isFirstOptionList) {
			cssClasses += " firstOption";
		}
		if (depth > 1) {
			cssClasses += " suboption";
		}
		if (option.disabled || option.poolAvailable < 1
				|| option.localPoolAvailable < 1) {
			cssClasses += " inactive";
		}
		if (option.selected) {
			cssClasses += " selected";
		}
		if (invisible || optionList.currentMaxTaken <= 0
				|| (isCollapsed && !option.selected) || (!option.selected && !_gui.checkDisplay(optionEntity))) {
			cssClasses += " invisible";
		}
		var optionElement = optionContainer.find("#option_" + option.localId);
		optionElement.removeClass();
		optionElement.addClass(cssClasses);
		
		var optionText = armyUnit.getText(optionEntity.entityName);
		if (option.currentMaxTaken > 1) {
			optionText += " " + option.currentCount + "/"
					+ option.currentMaxTaken;
		}
		var optionTextElement = optionElement.find(".optionText");
		optionTextElement.html(optionText);
		var optionCost = (option.totalCost != 0 ? option.totalCost : '');
		var optionCostElement = optionElement.find(".optionCost");
		optionCostElement.html(optionCost);

		if (/* option.selected && !option.disabled && option.poolAvailable == 1 && */option
				.hasOptions()) {
			var isFirstSubOptionList = true;
			var subOptionListCount = 0;
			for ( var k in option.optionLists) {
				var subOptionList = option.optionLists[k];

				subOptionListCount += this.refreshOptionList(armyUnit, optionContainer,
						subOptionList, isCollapsed, isFirstSubOptionList,
						depth + 1, !option.selected);
				if (subOptionListCount > 0) {
					isFirstSubOptionList = false;
				}
			}
		}
		return true;
	};
	
	this.refreshEntryActions = function(container, entityslot) {
		var entryButtons = container.find(".entryButtons");
		var deleteButtonImg = entryButtons.find(".deleteButtonImg");
		var cloneButtonImg = entryButtons.find(".cloneButtonImg");
		var collapseButton = entryButtons.find(".collapseButton");
		var collapseButtonImg = entryButtons.find(".collapseButtonImg");
		var expandButton = entryButtons.find(".expandButton");
		var expandButtonImg = entryButtons.find(".expandButtonImg");

		deleteButtonImg.attr("title", _guiState.text["delete"]);
		deleteButtonImg.attr("alt", _guiState.text["delete"]);
		cloneButtonImg.attr("title", _guiState.text["clone"]);
		cloneButtonImg.attr("alt", _guiState.text["clone"]);
		if (entityslot.entity.hasOptions()) {
			collapseButtonImg.attr("title", _guiState.text["collapse"]);
			collapseButtonImg.attr("alt", _guiState.text["collapse"]);
			expandButtonImg.attr("title", _guiState.text["expand"]);
			expandButtonImg.attr("alt", _guiState.text["expand"]);

			if (entityslot.optionDisplayState == _guiState.OPTION_DISPLAYSTATE.EXPANDED) {
				expandButton.css("display", "none");
				collapseButton.css("display", "inline-block");
			} else {
				expandButton.css("display", "inline-block");
				collapseButton.css("display", "none");
			}
		}
	};
	
	this.clickIncDecModelCount = function(event) {
		event.preventDefault();
		if (!wasClick(event)) {
			return false;
		}
		_controller.setModelCount(event.data.entityslot,
				event.data.entityslot.entity.currentCount + event.data.count);
	};

	this.clickSetModelCount = function(event) {
		event.preventDefault();
		if (!wasClick(event)) {
			return false;
		}
		_controller.setModelCount(event.data.entityslot, event.data.count);
	};
	
	this.clickOption = function(optionLocalId) {
//		if (!wasClick(event)) {
//			return true; // return true so that the event can be
//			// handled by others (i.e. sliding
//			// left/right)
//		}
		var option = _armyState.lookupId(optionLocalId);

		if (option.disabled
				|| option.poolAvailable < 1
				|| option.localPoolAvailable < 1
				|| (option.currentMaxTaken == 0 && !option.selected)
				|| _armyState.lookupId(option.parentEntityslot).optionDisplayState == _guiState.OPTION_DISPLAYSTATE.COLLAPSED) {
			return false;
		}

		if (option.currentMaxTaken > 1) {
			this.prepareMultiOption(optionLocalId, option.currentMinTaken,
					option.currentMaxTaken, option.currentCount);
		} else {
			_controller.selectOption(optionLocalId, 1);
		}
		return false;
	};
	
	this.removeSlotEntry = function(entityslotLocalId) {
		_gui.getElement("#entry_" + entityslotLocalId).remove();
	};
	
	this.removeAllSlotEntries = function() {
		$(".entry").remove();
	};
	
	this.expandEntryOptions = function(armyUnit, entityslot) {
		entityslot.optionDisplayState = _guiState.OPTION_DISPLAYSTATE.EXPANDED;
		this.refreshEntry(armyUnit, entityslot);

		var entryContent = _gui.getElement("#entryContent_" + entityslot.localId);

		entryContent.unbind(_guiState.clickEvent);
	};

	this.collapseEntryOptions = function(armyUnit, entityslot) {
		entityslot.optionDisplayState = _guiState.OPTION_DISPLAYSTATE.COLLAPSED;
		this.refreshEntry(armyUnit, entityslot);

		var entryContent = _gui.getElement("#entryContent_" + entityslot.localId);

		// entryContent.unbind(_guiState.clickEvent);
		entryContent.on(_guiState.clickEvent, function(event) {
			if (!wasClick(event)) {
				return false;
			}
			this.expandEntryOptions(armyUnit, entityslot);
		});
	};
	
	this.removeInvalidEntries = function() {
		$(".entry").each(function(index, element) {
			var localId = element.dataset.localid;
			if(_armyState.lookupId(localId) == null) {
				element.remove();
			}
		});
	};
	
	this.prepareMultiOption = function(optionLocalId, minTaken, maxTaken,
			currentCount) {
		this.setOptionCountChooserPosition(optionLocalId);
		this.setMultiOptionValues(optionLocalId, minTaken, maxTaken,
				currentCount);
	};

	this.setOptionCountChooserPosition = function(optionLocalId) {

		if (_guiState.multiOptionChooserOptionId == optionLocalId) {
			return;
		}

		_gui.closeMenu("optionCountChooser");

		var optionElement = _gui.getElement("#option_" + optionLocalId);
		var optionCountChooser = _gui.getElement("#optionCountChooser");
		var parent = tr("optionCountChooserParent", null, {
			style : "line-height: 0"
		});
		optionElement.after(parent.append(td(null, null, null, {
			colspan : "2"
		}).append(optionCountChooser)));
		_guiState.multiOptionChooserOptionId = optionLocalId;

		optionCountChooser.css("display", "block");

		parent.animate({
			"line-height" : "1.2em"
		}, 'fast');

		// set event after the current event so that it is not called automatically
		window.setTimeout("_gui.addCheckCloseEvent('optionCountChooser')", 1);
	};

	this.setMultiOptionValues = function(optionLocalId, minTaken, maxTaken,
			currentCount) {
		var optionCountChooser = _gui.getElement("#optionCountChooser");
		optionCountChooser.find("#optionCount").html(
				currentCount + "/" + maxTaken);
		var minButton = optionCountChooser.find("#optionCountMinButton");
		var lessButton = optionCountChooser.find("#optionCountLessButton");
		var moreButton = optionCountChooser.find("#optionCountMoreButton");
		var maxButton = optionCountChooser.find("#optionCountMaxButton");
		var okButton = optionCountChooser.find("#optionCountOkButton");

		minButton.unbind(_guiState.clickEvent);
		lessButton.unbind(_guiState.clickEvent);
		moreButton.unbind(_guiState.clickEvent);
		maxButton.unbind(_guiState.clickEvent);

		if (currentCount > minTaken) {
			minButton.html("&laquo;");
			minButton.on(_guiState.clickEvent, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.selectOption(optionLocalId, minTaken);
			});
			lessButton.html("&lsaquo;");
			lessButton.on(_guiState.clickEvent, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.selectOption(optionLocalId, currentCount - 1);
			});
		} else {
			minButton.html("&nbsp;");
			lessButton.html("&nbsp;");
		}

		if (currentCount < maxTaken) {
			moreButton.html("&rsaquo;");
			moreButton.on(_guiState.clickEvent, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.selectOption(optionLocalId, currentCount + 1);
			});
			maxButton.html("&raquo;");
			maxButton.on(_guiState.clickEvent, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				_controller.selectOption(optionLocalId, maxTaken);
			});
		} else {
			moreButton.html("&nbsp;");
			maxButton.html("&nbsp;");
		}

		okButton.on(_guiState.clickEvent, function(event) {
			if (!wasClick(event)) {
				return false;
			}
			_gui.closeMenu("optionCountChooser");
			// _gui.getElement("#optionCountChooser").css("display", "none");
			okButton.unbind(_guiState.clickEvent);
		});
	};
	
}