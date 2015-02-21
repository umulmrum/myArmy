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

function ChooserGui(dispatcher, systemState, armyState, controller, gui) {
	
	this.init = function() {
		dispatcher.bindEvent("postChangeFocCount", this, this.onPostChangeFocCount, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postStateRefresh", this, this.onPostStateRefresh, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postPrepareGui", this, this.onPostPrepareGui, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteDetachment", this, this.onPostDeleteDetachment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("mainmenu.postChangeSpecialDisplay", this, this.onPostChangeSpecialDisplay, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddExtension", this, this.onPostAddExtension, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteExtension", this, this.onPostDeleteExtension, dispatcher.PHASE_STATE);
	};
	
	this.onPostChangeFocCount = function(event) {
		this.refreshSlotHeadings();
	};
	
	this.onPostStateRefresh = function(event) {
		traverseArmyUnit(this, this.refreshDirtySlots);
		this.refreshSlotHeadings();
	};
	
	this.onPostPrepareGui = function(event) {
		this.renderSlots();
		this.renderUnitSelectionTabs();
		this.renderEntries();
		this.refresh();
	};
	
	this.onPostAddDetachment = function(event) {
		this.refreshSlotHeadings();
		this.renderUnitSelectionTabs();
		this.renderEntries();
		this.refresh();
	};

	this.onPostDeleteDetachment = function(event) {
		this.resetUnitsToShow();
		this.refreshSlotHeadings();
		this.renderUnitSelectionTabs();
		this.renderEntries();
		this.refresh();
	};
	
	this.onPostResetArmy = function(event) {
		traverseArmyUnit(this, this.refreshDirtySlots);
		this.refreshSlotHeadings();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.refreshEntries();
		this.refreshSlotHeadings();
	};
	
	this.onPreCallFragment = function(event, additionalData) {
		if(additionalData.newFragment == "chooser") {
			if(_guiState.isSmallDevice) {
				this.refreshEntries();
			}
		}
	};
	
	this.onPostChangeDetachmentType = function(event, additionalData) {
		this.refreshSlotHeadings();
		this.renderEntries();
		this.refresh();
	};
	
	this.onPostChangeSpecialDisplay = function(event) {
		this.refreshEntries();
	};

	this.onPostAddExtension = function(event, additionalData) {
		this.renderSlotEntries(additionalData.armyUnit, additionalData.detachmentData);
	};

	this.onPostDeleteExtension = function(event) {
		this.refreshSlotHeadings();
		this.renderEntries();
		this.refresh();
	};

	this.refresh = function() {
		this.refreshSlotHeadings();
		this.refreshEntries();
	};
	
	/**
	 * This method renders the skeleton for each slot (heading and containers
	 * for slot entries and for selected entities). It does not fill these
	 * containers. The method assumes that the _guiState has been reset before!
	 * Otherwise the slots will be empty afterwards.
	 */
	this.renderSlots = function() {

		var designContainer = gui.getElement(".designContainer");
		designContainer.children().remove();

		var slotMenu = gui.getElement("#slotMenu");
		slotMenu.children().remove();

		if (systemState.system == null) {
			return;
		}
		
		var slotMenuItem = span(_guiState.getText("all"), "slotMenuItem-1", "menuButton");
		slotMenuItem.on(_guiState.clickEvent, function(event) {
			showSlot(-1);
		});
		slotMenu.append(slotMenuItem);
		
		var slotCount = 0;
		var selectedPage = -1;

		var sortedSlots = [];
		for ( var i in systemState.slots) {
			sortedSlots.push(systemState.slots[i]);
		}

		sortedSlots.sort(function(a, b) {
			return a.order - b.order;
		});

		for ( var i in sortedSlots) {
			var slot = sortedSlots[i];
			var slotId = slot.slotId;
			var slotName = _guiState.getText(slot.slotName);

			slotCount++;

			var slotRow = div(null, "slotRow" + slotId, "containerChild");
			var slotentryChooserWrapper = div(null, "slotentryChooserWrapper" + slotId, "chooserListWrapper");
			var slotHeadingContainer = span(null, "slotHeadingContainer" + slotId, "slotHeadingContainer slotHeadingChooser");
			slotentryChooserWrapper.append(slotHeadingContainer);

			var slotHeading = span('', "slotHeading" + slotId, null, null);
			slotHeadingContainer.append(slotHeading);

			var slotentryChooserList = ul(null, "slotentryChooserList" + slotId, "chooserList");
			slotentryChooserWrapper.append(slotentryChooserList);

			slotRow.append(slotentryChooserWrapper);

			var slotentryListWrapper = div(null, "entriesPerSlotWrapper" + slotId, "slotlistEntryWrapper");
			slotentryListWrapper.append(span("&nbsp;", null, "slotHeadingContainer slotHeadingDesigner"));
			slotentryListWrapper.append(ul(null, "slotentryDesignerList" + slotId, "designerList"));
			if (!slot.visible) {
				slotRow.addClass("invisible empty");
			} else if (_guiState.isSmallDevice) {
				if (selectedPage == -1) {
					selectedPage = slotId;
				} else {
					slotRow.addClass("invisible empty");
				}
			}
			slotRow.append(slotentryListWrapper);

			slotMenuItem = span(slotName, "slotMenuItem" + slotId, "menuButton");
			slotMenuItem.on(_guiState.clickEvent, {	slotId : slotId	}, function(event) {
				showSlot(event.data.slotId);
			});
			slotMenu.append(slotMenuItem);

			designContainer.append(slotRow);
		}

	};

	this.renderUnitSelectionTabs = function() {

		if(armyState.getDetachmentData(_guiState.unitsToShow) == null) {
			var firstDetachment = armyState.getFirstDetachment();
			if(firstDetachment != null) {
				_guiState.unitsToShow = firstDetachment.getDetachmentDataIndex();
			}
		}

		$(".tabRow").remove();
		var tabRow = ol(null, null, "tabRow unitTabRow", null);
		if(armyState.getDetachmentCount() < 2) {
			tabRow.addClass("invisible");
		}
		
		for(var i in  armyState.getDetachments()) {
			var detachmentData = armyState.getDetachmentData(i);
			var xLi = li(detachmentData.getPosition(), "unitSelectionTab" + i, "tab unitTab", null);
			if(_guiState.unitsToShow == i) {
				xLi.addClass("selectedTab");
			}
			xLi.on(_guiState.clickEvent, { unitsToShow: i, target: this}, this.showUnitTab);
			tabRow.append(xLi);
		}
		gui.getElement(".slotHeadingChooser").after(tabRow);
	};
	
	this.renderEntries = function() {
		if(armyState.getDetachmentCount() == 0) {
			return;
		}

		var tabRows = gui.getElement(".designContainer").find(".tabRow");
		if(armyState.getDetachmentCount() < 2) {
			tabRows.addClass("invisible");
		} else {
			tabRows.removeClass("invisible");
		}
		
		for ( var i in systemState.slots) {
			var slot = systemState.slots[i];
			if(slot.visible) {
				gui.getElement("#slotMenuItem" + slot.slotId).removeClass("invisible empty");
			} else {
				gui.getElement("#slotMenuItem" + slot.slotId).addClass("invisible empty");
			}
			var slotentryList = gui.getElement("#slotentryChooserList" + slot.slotId);
			slotentryList.children().remove();
		}
		traverseArmyUnit(this, this.renderSlotEntries);
	};
	
	this.renderSlotEntries = function(armyUnit, detachmentData) {
		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var armyUnitIndex = armyUnit.getArmyUnitIndex();
		var hasSeparator = {};
		for ( var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			var entityslotId = entityslot.entityslotId;
			var slotentryList = gui.getElement("#slotentryChooserList" + entityslot.slotId);
			var entity = armyUnit.getFromEntityPool(entityslot.entityId);
			var entityName = detachmentData.getText(entity.entityName);

			var cssClasses = this.getCssForEntry(armyUnit, entityslot);

			if(isUndefined(hasSeparator[entityslot.slotId]) && armyUnit.isExtension()) {
				slotentryList.append("<hr />");
				hasSeparator[entityslot.slotId] = true;
			}

			var xli = li(/*"&raquo; " +*/ entityName,
					"chooserEntry" + detachmentDataIndex + "_" + armyUnitIndex + "_" + entityslotId, cssClasses);
			xli.on(_guiState.clickEvent, {
                armyUnit: armyUnit,
				entityslotId : entityslotId
			}, function(event) {
				if (!wasClick(event)) {
					return false;
				}
				controller.addEntry(event.data.armyUnit, event.data.entityslotId, true);
			});
//			if (entityslot.availableState == 0) {
//				xli.append(span(" (" + _guiState.getText("max") + ")", null,
//				"maxAppendix ok"));
//			}
			this.setSlotVisibility(systemState.slots[entityslot.slotId], true);
			slotentryList.append(xli);
		}
	};
	
	/**
	 * Refreshes the chooser elements (heading and entries) for the given slot.
	 * Will only refresh elements, so they need to already exist.
	 * This method needs to be called when the slot is dirty, which is when:
	 * - an entity was added in this slot
	 * - an entity was cloned in this slot
	 * - an entity was deleted in this slot
	 * - an option of an entity in this slot was selected or unselected
	 * - the value of a pool has changed (only when there is a dependent entityslot for that pool that belongs to this slot)
	 * 
	 * Also needs to be called when the user switches unit display to own units or to allies
	 */
//	this.refreshChooserSlot = function(slot) {
//		this.refreshSlotHeading(slot.slotId);
//		this.refreshEntriesForSlot(slot);
//	};
	
	this.refreshSlotHeadings = function() {
		for ( var i in systemState.slots) {
			// TODO possibly add dirty-check
			this.refreshSlotHeading(i);
		}
	};

	this.refreshSlotHeading = function(slotId) {
		var slotHeading = gui.getElement("#slotHeading" + slotId);
		if(slotHeading == null) {
			return;
		}
		slotHeading.children().remove();
		var slot = systemState.slots[slotId];
		
		var slotHeadingText = getSlotHeadingText(slot);
		slotHeading.append(span(slotHeadingText + " ("));
		
		var isOk = true;

		var isFirst = true;
		var countPerDetachmentData = traverseArmyUnit(this, getChooserCountForArmy, {slotId: slotId});
        var count = {};
        for(var i in countPerDetachmentData) {
            var countPerArmyUnit = countPerDetachmentData[i];
            if(countPerArmyUnit == null) {
                continue;
            }
            for(var j in countPerArmyUnit) {
                if(isUndefined(count[i])) {
                    count[i] = 0;
                }
                count[i] += countPerArmyUnit[j];
            }
        }
		
		for(var i in count) {
			var slotCount = count[i];
			//if(slotCount == null) {
			//	continue;
			//}
			var thisText = "";
			if(!isFirst) {
				thisText += " + ";
			}
			thisText += slotCount;
			
			var detachmentType = armyState.getDetachmentData(i).detachmentType;
				
			var isThisOk = checkSlotMinMax(detachmentType, slotId, slotCount);
			isOk = isOk && isThisOk;
			slotHeading.append(span(thisText, null, isThisOk ? '' : "emphasizedBad"));
			isFirst = false;
		}

		slotHeading.append(span(") : " + armyState.pointsPerSlot[slotId] + " " + _guiState.getText("points")));
		slotHeading.removeClass("good bad");
		if(isOk) {
			slotHeading.addClass("good");
		} else {
			slotHeading.addClass("bad");
		}
		
		gui.getElement("#slotMenuItem" + slotId).html(slotHeadingText);
	};
	
	function checkSlotMinMax(detachmentType, slotId, count) {
		var minCount = 0;
		if(!isUndefined(detachmentType.minSlotCounts) && !isUndefined(detachmentType.minSlotCounts[slotId])) {
			minCount = detachmentType.minSlotCounts[slotId];
		}
		var maxCount = Number.MAX_VALUE;
		if(!isUndefined(detachmentType.maxSlotCounts) && !isUndefined(detachmentType.maxSlotCounts[slotId])) {
			maxCount = detachmentType.maxSlotCounts[slotId];
		}
		
		return (count >= minCount) && (count <= maxCount);
	}
	
	this.refreshDirtySlots = function(armyUnit, detachmentData) {
		for ( var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			if (entityslot.dirty) {
				this.refreshSlotentry(detachmentData.getDetachmentDataIndex(), armyUnit, entityslot);
//				dirtySlotIds[entityslot.slotId] = 1;
				entityslot.dirty = false;
			}
		}
//		for ( var i in dirtySlotIds) {
//			this.refreshChooserSlot(systemState.slots[i]);
//		}
	};
	
	this.refreshEntries = function() {
		//if(armyState.getArmy(unitsToShow, "a0") == null) {
		//	unitsToShow = armyState.getFirstArmyIndex();
		//}
		for ( var i in systemState.slots) {
			this.refreshEntriesForSlot(systemState.slots[i]);
		}
	};
	
	this.refreshSlotentry = function(detachmentDataIndex, armyUnit, entityslot) {
		var entry = $("#chooserEntry" + detachmentDataIndex + "_" + armyUnit.getArmyUnitIndex() + "_" + entityslot.entityslotId);
		entry.removeClass();
		entry.addClass(this.getCssForEntry(armyUnit, entityslot));
	};
	
	this.refreshEntriesForSlot = function(slot) {
		var rowElement = gui.getElement("#slotRow" + slot.slotId);
		var menuElement = gui.getElement("#slotMenuItem" + slot.slotId);
		var hasElements = ($.inArray(true, traverseArmyUnit(this, this.refreshForArmyUnit, {slotId: slot.slotId}))) > -1;
		if(slot.visible) {
			menuElement.removeClass("invisible");
		} else {
			menuElement.addClass("invisible");
		}
		
		if(!slot.visible || (_guiState.isSmallDevice && _currentSlotId > -1 && slot.slotId != _currentSlotId)) {
			rowElement.addClass("invisible empty");
		} else {
			rowElement.removeClass("invisible empty");
		}
		
		var tabRow = rowElement.find(".tabRow");
		var tabs = tabRow.children();
		tabs.removeClass("selectedTab");
		tabs.filter("#unitSelectionTab" + _guiState.unitsToShow).addClass("selectedTab");
	};
	
	this.refreshForArmyUnit = function(armyUnit, detachmentData, additionalParams) {
		for ( var j in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(j);
			if (entityslot.slotId != additionalParams.slotId) {
				continue;
			}
			
			var entry = $("#chooserEntry" + detachmentData.getDetachmentDataIndex() + "_" + armyUnit.getArmyUnitIndex() + "_" + entityslot.entityslotId);
			entry.removeClass();
			entry.addClass(this.getCssForEntry(armyUnit, entityslot));
			var entity = armyUnit.getFromEntityPool(entityslot.entityId);
			var entityName = detachmentData.getText(entity.entityName);
			entry.html(entityName);
		}
		return detachmentData.entityslotCount[additionalParams.slotId] > 0;
	};
	
	this.getCssForEntry = function(armyUnit, entityslot) {
		var cssClass = "";
		switch (entityslot.availableState) {
            case 1:
                cssClass = "good";
                break;
            case 0:
                cssClass = "ok";
                break;
            case -1:
                cssClass = "bad";
                break;
            // case -2:
            // cssClass = "invisible";
            // break;
		}
		
		if(entityslot.detachmentDataIndex != _guiState.unitsToShow) {
			cssClass += " invisible";
		}
		if(!gui.checkDisplay(armyUnit.getFromEntityPool(entityslot.entityId))) {
			cssClass += " invisible";
		}
		if(!entityslot.visible) {
			cssClass += " invisible";
		}
		
		return cssClass;
	};
	
	this.showUnitTab = function(event) {
		if (!wasClick(event)) {
			return false;
		}
		_guiState.unitsToShow = event.data.unitsToShow;
		event.data.target.refreshEntries();
		dispatcher.triggerEvent("postChangeUnitsToShow", { unitsToShow: event.data.unitsToShow });
	};

	this.setSlotVisibility = function(slot, visible) {
		slot.visible = visible;
		var slotElement = gui.getElement("#slotRow" + slot.slotId);
		if(visible) {
			slotElement.removeClass("invisible");
		} else {
			slotElement.addClass("invisible");
		}
	};

	this.resetUnitsToShow = function () {
		var firstDetachment = armyState.getFirstDetachment();
		if(firstDetachment != null) {
			_guiState.unitsToShow = firstDetachment.getDetachmentDataIndex();
			dispatcher.triggerEvent("postChangeUnitsToShow", { unitsToShow: firstDetachment.getDetachmentDataIndex() });
		}
	};
}