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
	var selectionCost = {}; // the total slotCost per slot
	var entityCount = {}; // a counter for each entityslotId - used for minTaken and maxTaken
	
	var stateLinkPart = null;
	
	var pools = {};
	
	var texts = {};

	var extension = isExtensionParam;
	
	this.resetArmy = function() {
		selections = [];
		selectionCountPerSlot = {};
		selectionCost = {};
		for(var i in _systemState.slots) {
			selectionCountPerSlot[i] = 0;
			selectionCost[i] = 0;
		}
		for(var i in entityCount) {
			entityCount[i] = 0;
		}
		stateLinkPart = null;
		this.resetPools();
	};
	
	this.resetPools = function() {
		for ( var i in pools) {
			var pool = pools[i];
			pool.currentCount = pool.start;
			pool.dependingOptions = {};
		}
	};
	
	this.addEntry = function(entityslot, doEntityCalculations) {
		selections.push(entityslot);
		selectionCountPerSlot[entityslot.slotId] = selectionCountPerSlot[entityslot.slotId] + 1;
		selectionCost[entityslot.slotId] = selectionCost[entityslot.slotId] + entityslot.slotCost;
		entityCount[entityslot.entityslotId] = entityCount[entityslot.entityslotId] + 1;
		assignEntitySlotLocalId(entityslot);
		if(doEntityCalculations) {
			_state.calculateEntityState(entityslot);
		}
		changeModelCountPool(entityslot, 0, entityslot.entity.currentCount);
		entityslot.dirty = true;
		entityslots[entityslot.entityslotId].dirty = true;
	};

	this.removeEntry = function(entityslot) {
		removeItems(selections, entityslot);
		selectionCountPerSlot[entityslot.slotId] = selectionCountPerSlot[entityslot.slotId] - 1;
		selectionCost[entityslot.slotId] = selectionCost[entityslot.slotId] - entityslot.slotCost;
		entityCount[entityslot.entityslotId] = entityCount[entityslot.entityslotId] - 1;
		removeEntitySlotLocalIds(entityslot);
		changeModelCountPool(entityslot, entityslot.entity.currentCount, 0);
		_armyState.pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		entityslots[entityslot.entityslotId].dirty = true;
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

    this.getSelectionCost = function(slotId) {
        return selectionCost[slotId];
    };

    this.getSelection = function(id) {
        return selections[id];
    };
	
	this.getEntityCount = function(entityslotId) {
		return entityCount[entityslotId];
	};
	
	this.setEntityCount = function(entityslotId, count) {
		entityCount[entityslotId] = count;
	};
	
	this.addPool = function(pool) {
		pools[pool.name] = pool;
	};
	
	this.getPools = function() {
		return pools;
	};
	
	this.getPool = function(name) {
		return pools[name];
	};
	
	this.setPools = function(poolsParam) {
		pools = poolsParam;
	};

    this.getTexts = function() {
        return texts;
    };

	this.getText = function(key) {
		return texts[key];
	};
	
	this.setTexts = function(textsParam) {
		texts = textsParam;
	};

	this.addTexts = function(textsParam) {
		$.extend(texts, textsParam);
	};

	this.hasSelections = function() {
		return this.getSelectionCount() > 0;
	};

	this.isExtension = function() {
		return extension;
	};

}