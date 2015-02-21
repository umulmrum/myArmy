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
 * A single army detachment's data
 */
function ArmyUnit(armyUnitIndexParam, armyParam, isExtensionParam) {

	var armyUnitIndex = armyUnitIndexParam;
	var army = armyParam;
	
	// static data (these variables do only depend on the army type, so will not changed after the army data was read)
	var entityPool = {}; // all entities related to the current army type
	var entityslots = {}; // all the selectable entityslots

	// dynamic data (will reflect the user's selections)
	var selections = []; // the entityslots the user selected to be in his army
	var selectionCountPerSlot = {}; //the number of entityslots per slot
	var selectionSlotCost = {}; // the total slotCost per slot
	var selectionCount = {}; // a counter for each entityslotId - used for minTaken and maxTaken
	
	var stateLinkPart = null;
	
	var extension = isExtensionParam;
	
	this.resetArmy = function() {

		for(var i in selections) {
			removeEntitySlotLocalIds(selections[i]);
		}

		selections = [];
		selectionCountPerSlot = {};
		selectionSlotCost = {};
		for(var i in _container.getSystemState().slots) {
			selectionCountPerSlot[i] = 0;
			selectionSlotCost[i] = 0;
		}
		for(var i in selectionCount) {
			selectionCount[i] = 0;
		}
		stateLinkPart = null;
	};
	

	this.addEntry = function(entityslot, doEntityCalculations) {
		selections.push(entityslot);
		selectionCountPerSlot[entityslot.slotId] = selectionCountPerSlot[entityslot.slotId] + 1;
		selectionCount[entityslot.entityslotId] = selectionCount[entityslot.entityslotId] + 1;
		assignEntitySlotLocalId(entityslot);
		if(doEntityCalculations) {
			_container.getState().calculateEntityState(entityslot);
			//selectionSlotCost[entityslot.slotId] = selectionSlotCost[entityslot.slotId] + entityslot.currentSlotCost;
		}
		_container.getPoolService().changeModelCountPool(entityslot, 0, entityslot.entity.currentCount);
		entityslot.dirty = true;
		entityslots[entityslot.entityslotId].dirty = true;
	};

	this.removeEntry = function(entityslot) {
		removeItems(selections, entityslot);
		selectionCountPerSlot[entityslot.slotId] = selectionCountPerSlot[entityslot.slotId] - 1;
		selectionSlotCost[entityslot.slotId] = selectionSlotCost[entityslot.slotId] - entityslot.currentSlotCost;
		selectionCount[entityslot.entityslotId] = selectionCount[entityslot.entityslotId] - 1;
		removeEntitySlotLocalIds(entityslot);
        _container.getPoolService().changeModelCountPool(entityslot, entityslot.entity.currentCount, 0);
		_container.getArmyState().pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		entityslots[entityslot.entityslotId].dirty = true;
	};

	this.addSelectionSlotCost = function(slotId, slotCost) {
		selectionSlotCost[slotId] = selectionSlotCost[slotId] + slotCost;
	};

	this.recalculateSelectionSlotCost = function() {
		selectionSlotCost = {};
		for(var i in _container.getSystemState().slots) {
			selectionSlotCost[i] = 0;
		}
		for(var i in selections) {
			var selection = selections[i];
			_container.getState().calculateSelectionSlotCost(selection);
			selectionSlotCost[_container.getSystemState().slots[selection.slotId]] = selection.currentSlotCost;
		}
	};

	this.getArmyUnitIndex = function() {
		return armyUnitIndex;
	};

    this.getArmy = function() {
        return army;
    };

	this.getEntityPool = function() {
		return entityPool;
	};
	
	this.addToEntityPool = function(entity) {
		entityPool[entity.entityId] = entity;
	};
	
	this.getFromEntityPool = function(entityId) {
		return entityPool[entityId];
	};
	
	this.addEntityslot = function(entityslot) {
		entityslots[entityslot.entityslotId] = entityslot;
	};
	
	this.getEntityslots = function() {
		return entityslots;
	};
	
	this.getEntityslot = function(entityslotId) {
		return entityslots[entityslotId];
	};

    this.getSelections = function() {
        return selections;
    };

    this.setSelections = function(selectionsParam) {
        selections = selectionsParam;
    };

    this.getSelectionCount = function() {
        return selections.length;
    };

    this.getSelectionCountPerSlot = function(slotId) {
        return selectionCountPerSlot[slotId];
    };

    this.getSelectionSlotCost = function(slotId) {
        return selectionSlotCost[slotId];
    };

    this.getSelection = function(id) {
        return selections[id];
    };

	this.getEntityCounts = function() {
		return selectionCount;
	};

	this.getEntityCount = function(entityslotId) {
		return selectionCount[entityslotId];
	};
	
	this.setEntityCount = function(entityslotId, count) {
		selectionCount[entityslotId] = count;
	};
	
	this.hasSelections = function() {
		return this.getSelectionCount() > 0;
	};

	this.isExtension = function() {
		return extension;
	};

}