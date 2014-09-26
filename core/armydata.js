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
function ArmyData() {
	
	this.detachmentType = null;
	this.army = null;
	
	// static data (these variables do only depend on the army type, so will not changed after the army data was read)
	this.allowedAllies = [];
	this.entityPool = {}; // all entities related to the current army type
	this.entityslots = {}; // all the selectable entityslots
	this.entityslotCount = {}; // the number of selectable entityslots per slot
	
	// dynamic data (will reflect the user's selections)
	this.selections = []; // the entityslots the user selected to be in his army
	this.selectionCount = {}; //the number of entityslots per slot
	this.selectionCost = {}; // the total slotCost per slot
	this.entityCount = {}; // a counter for each entityslotId - used for minTaken and maxTaken
	
	this.stateLinkPart = null;
	
	this.pools = {};
	
	this.text = {};
	
	this.resetArmy = function() {
		this.selections = [];
		this.selectionCount = {};
		this.selectionCost = {};
		for(var i in _systemState.slots) {
			this.selectionCount[i] = 0;
			this.selectionCost[i] = 0;
		}
		for(var i in this.entityCount) {
			this.entityCount[i] = 0;
		}
		this.stateLinkPart = null;
		this.resetPools();
	};
	
	this.resetPools = function() {
		for ( var i in this.pools) {
			var pool = this.pools[i];
			pool.currentCount = pool.start;
			pool.dependingOptions = {};
		}
	};
	
	this.addEntry = function(entityslot, doEntityCalculations) {
		this.selections.push(entityslot);
		this.selectionCount[entityslot.slotId] = this.selectionCount[entityslot.slotId] + 1;
		this.selectionCost[entityslot.slotId] = this.selectionCost[entityslot.slotId] + entityslot.slotCost;
		this.entityCount[entityslot.entityslotId] = this.entityCount[entityslot.entityslotId] + 1;
		assignEntitySlotLocalId(entityslot);
		if(doEntityCalculations) {
			_state.calculateEntityState(entityslot);
		}
		changeModelCountPool(entityslot, 0, entityslot.entity.currentCount);
		entityslot.dirty = true;
		this.entityslots[entityslot.entityslotId].dirty = true;
	};

	this.removeEntry = function(entityslot) {
		removeItems(this.selections, entityslot);
		this.selectionCount[entityslot.slotId] = this.selectionCount[entityslot.slotId] - 1;
		this.selectionCost[entityslot.slotId] = this.selectionCost[entityslot.slotId] - entityslot.slotCost;
		this.entityCount[entityslot.entityslotId] = this.entityCount[entityslot.entityslotId] - 1;
		removeEntitySlotLocalIds(entityslot);
		changeModelCountPool(entityslot, entityslot.entity.currentCount, 0);
		_armyState.pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		this.entityslots[entityslot.entityslotId].dirty = true;
	};
	
	this.addPool = function(name, pool) {
		this.pools[name] = pool;
	};
	
	this.getEntityCount = function(entityslotId) {
		return this.entityCount[entityslotId];
	};
	
	this.setEntityCount = function(entityslotId, count) {
		this.entityCount[entityslotId] = count;
	};
	
	this.getPools = function() {
		return this.pools;
	};
	
	this.getPool = function(name) {
		return this.pools[name];
	};
	
	this.setPools = function(pools) {
		this.pools = pools;
	};
}