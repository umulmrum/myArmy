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
 * System represents a game system.
 */
function System(systemId, systemName, systemPrefix) {
	this.systemId = systemId;
	this.systemName = systemName;
	this.systemPrefix = systemPrefix;
    this.defaultSlotCost = 1;
    //this.slots = {};
	this.special = {};
	this.detachmentTypes = {};
    //this.armies = {};
    //this.extensions = {};
}

/**
 * DetachmentType holds data for army detachments.
 */
function DetachmentType(id, name, minSlotCounts, maxSlotCounts, canBePrimary) {
	this.id = id;
	this.name = name;
	this.minSlotCounts = minSlotCounts;
	this.maxSlotCounts = maxSlotCounts;
	this.canBePrimary = canBePrimary;
}

/**
 * Slot holds data for a slot, i.e. the game role of a selection.
 */
function Slot(slotId, slotName, order) {
	this.slotId = slotId;
	this.slotName = slotName;
	this.order = order;
	
	this.visible = true;
}

/**
 * 
 */
function Special(specialId, specialName) {
	this.id = specialId;
	this.name = specialName;
	this.display = true;
}

function Army(armyId, armyName, armyPrefix, armyGroup) {
	this.armyId = armyId;
	this.armyName = armyName;
	this.armyPrefix = armyPrefix;
	this.armyGroup = armyGroup;
	this.pools = {};
}

function EntitySlot(detachmentDataIndex, armyUnitIndex, entityslotId, entityId, slotId, minTaken, maxTaken,
		slotCost, fillsPool, needsPool, enabled) {
	this.detachmentDataIndex = detachmentDataIndex;
	this.armyUnitIndex = armyUnitIndex;
	this.entityslotId = entityslotId;
	this.entityId = entityId;
	this.entity = null;
	this.slotId = slotId;
	this.minTaken = minTaken;
	this.maxTaken = maxTaken;
	this.slotCost = slotCost;
	this.fillsPool = fillsPool;
	this.needsPool = needsPool;
	this.enabled = enabled;

	this.init = function() {
		this.localId = null;
		this.dirty = false;
		this.availableState = 1;
		this.optionDisplayState = _guiState.OPTION_DISPLAYSTATE.EXPANDED;
	};
	this.init();

	this.clone = function() {
		var cloned = new EntitySlot(this.detachmentDataIndex, this.armyUnitIndex, this.entityslotId, this.entityId, this.slotId, this.minTaken, this.maxTaken, this.slotCost, this.fillsPool, this.needsPool, this.enabled);
		if(this.entity != null) {
			cloned.entity = this.entity.clone();
		}
		return cloned;
	};
}

function Entity(entityId, entityName, cost, costPerModel, minCount, maxCount, special, localPools, modelCountPoolChange) {
	this.entityId = entityId;
	this.entityName = entityName;
	this.cost = cost;
	this.costPerModel = costPerModel;
	this.totalCost = 0;

	this.currentCost = 0;
	this.currentCostPerModel = 0;
	this.minCount = minCount;
	this.maxCount = maxCount;
	this.currentCount = this.minCount;
	
	this.special = special;

	this.localPools = localPools;
	
	if(!isUndefined(modelCountPoolChange)) {
		this.modelCountPoolChange = modelCountPoolChange;
	}

	this.disabled = false;
	this.parentEntity = -1;

	this.hasOptions = function() {
		return !isUndefined(this.optionLists);
	};
	
	this.hasLocalPool = function(name) {
		return !isUndefined(this.localPools[name]);
	};

	this.clone = function() {
		var cloned = new Entity(this.entityId, this.entityName, this.cost,
				this.costPerModel, this.minCount, this.maxCount, this.special, cloneObject(this.localPools), this.modelCountPoolChange);
		cloned.currentCount = this.currentCount;
		cloned.disabled = this.disabled;
		if (this.hasOptions()) {
			cloned.optionLists = cloneObject(this.optionLists);
		}
		return cloned;
	};
}

function OptionList(optionListId, minTaken, maxTaken) {
	this.optionListId = optionListId;
	this.minTaken = minTaken;
	this.maxTaken = maxTaken;
	this.currentCount = 0;
	this.options = {};
	this.parentEntity = -1;

	this.clone = function() {
		var cloned = new OptionList(this.optionListId, this.minTaken,
				this.maxTaken);
		cloned.currentCount = this.currentCount;
		cloned.options = cloneObject(this.options);
		return cloned;
	};
}

function Option(optionId, entityId, cost, costPerModel, minTaken,
		maxTaken, fillsPool, needsPool, fillsLocalPool, needsLocalPool) {
	this.optionId = optionId;
	this.entityId = entityId;
	this.cost = cost;
	this.costPerModel = costPerModel;
	this.minTaken = minTaken;
	this.maxTaken = maxTaken;
	this.fillsPool = fillsPool;
	this.needsPool = needsPool;
	this.fillsLocalPool = fillsLocalPool;
	this.needsLocalPool = needsLocalPool;

	this.currentCost = 0;
	this.currentCostPerModel = 0;
	this.disabled = false;
	this.selected = false;
	this.currentCount = 0;
	this.poolAvailable = 1;
	this.localPoolAvailable = 1;
	this.parentEntityslot = -1;
	this.parentEntity = -1;
	this.parentOptionList = -1;
	this.localPools = {};

	this.hasOptions = function() {
		return !isUndefined(this.optionLists);
	};
	
	this.hasLocalPool = function(name) {
		return !isUndefined(this.localPools[name]);
	};

	this.clone = function() {
		var cloned = new Option(this.optionId, this.entityId, this.cost,
				this.costPerModel, this.minTaken, this.maxTaken,
				cloneObject(this.fillsPool), cloneObject(this.needsPool), cloneObject(this.fillsLocalPool), cloneObject(this.needsLocalPool));
		cloned.currentCost = this.currentCost;
		cloned.currentCostPerModel = this.currentCostPerModel;
		cloned.disabled = this.disabled;
		cloned.selected = this.selected;
		cloned.currentCount = this.currentCount;
		cloned.poolAvailable = this.poolAvailable;
		cloned.localPools = cloneObject(this.localPools);
		
		if (this.hasOptions()) {
			cloned.optionLists = cloneObject(this.optionLists);
		}
		return cloned;
	};
}

function Pool(detachmentDataIndex, name, start) {

	this.detachmentDataIndex = detachmentDataIndex;
	this.name = name;
	if (isNumber(start)) {
		this.start = start;
	} else if (start.indexOf(":") != -1) {
		if (detachmentDataIndex == "d0") {
			this.start = parseInt(start.substring(0, start.indexOf(":")));
		} else {
			this.start = parseInt(start.substring(start.indexOf(":") + 1));
		}
	} else {
		this.start = parseInt(start);
	}
	this.currentCount = this.start;

	this.dirty = false;
	this.dependingEntityslots = {};
	this.dependingOptions = {};


	this.clone = function() {
		var cloned = new Pool(this.detachmentDataIndex, this.name, this.start);
		cloned.currentCount = this.currentCount; 
		cloned.dirty = true;
		return cloned;
	};
}
