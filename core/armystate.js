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
 * ArmyState() manages all current army data.
 * It holds data for each detachment as well as aggregate information (e.g. total points). 
 */
function ArmyState() {
	
	var armyData = [];
	this.pointsPerSlot = {}; // the current points values per slot
	
	this.totalPoints = 0;
	this.focCount = 1;
	this.stateLink = null;
	
	this.maxLocalId = 0; // each item (entityslot, entity, optionList, option) that has been added to the current army gets assigned a temporary ID. 
						// This variable will hold the current maximum so that new items can get a subsequent ID. 
	this.armyLookup = {};
	
	this.resetArmy = function() {
		for(var i = 0; i < armyData.length; i++) {
			armyData[i].resetArmy();
		}
		
		this.resetPointsPerSlot();
		this.focCount = 1;
		this.totalPoints = 0;
		this.maxLocalId = 0;
		this.armyLookup = {};
	};
	
	this.resetPointsPerSlot = function() {
		for(var i in _systemState.slots) {
			var slotId = _systemState.slots[i].slotId;
			this.pointsPerSlot[slotId] = 0;
		}
	};
	
	this.removeArmy = function(armyIndex) {
		if(((this.getArmyCount() -1) < armyIndex) || (armyData[armyIndex].army == null)) {
			return;
		}
		for(var i = 0; i < armyData[armyIndex].selections.length; i++) {
			var entityslot = armyData[armyIndex].selections[i];
			removeEntitySlotLocalIds(entityslot);
			this.totalPoints -= entityslot.entity.totalCost;
			this.pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		}
		this.setArmy(armyIndex, null);
		_persistence.createStatelink();
	};
	
	this.recalculate = function() {
		this.totalPoints = 0;
		this.resetPointsPerSlot();
		this.stateLink = null;
	};
	
	this.addToIdLookup = function(element) {
		this.maxLocalId++;
		element.localId = this.maxLocalId;
		this.armyLookup[element.localId] = element;
	};
	
	this.removeFromIdLookup = function(element) {
		delete this.armyLookup[element.localId];
	};
	
	this.getArmyData = function(index) {
		return armyData[index];
	};
	
	this.getArmyDataCount = function() {
		return armyData.length;
	}
	
	this.getArmy = function(index) {
		if(armyData[index] == null) {
			return null;
		}
		return armyData[index].army;
	};
	
	this.setArmy = function(armyIndex, army) {
		armyData[armyIndex] = new ArmyData();
		armyData[armyIndex].army = army;
	};
	
	this.getArmyCount = function() {
		var count = 0;
		for(var i = 0; i < armyData.length; i++) {
			if(armyData[i].army != null) {
				count++;
			}
		}
		return count;
	};
	
	this.getFirstArmyIndex = function() {
		for(var i = 0; i < armyData.length; i++) {
			if(armyData[i].army != null) {
				return i;
			}
		}
		return -1;
	};

	this.getLastArmyIndex = function() {
		for(var i = armyData.length - 1; i >= 0; i--) {
			if(armyData[i].army != null) {
				return i;
			}
		}
		return -1;
	};
	
	this.getEntityCount = function(entityslotId) {
		return this.entityCount[entityslotId];
	};
	
	this.lookupId = function(localId) {
		return this.armyLookup[localId];
	};
	
	this.getTotalPoints = function() {
		return this.totalPoints;
	};
	
	this.setTotalPoints = function(points) {
		this.totalPoints = points;
	};
	
	this.addTotalPoints = function(points) {
		this.totalPoints += points;
	};
	
	this.addPointsPerSlot = function(slotId, points) {
		this.pointsPerSlot[slotId] += points;
	};
	
	this.getFocCount = function() {
		return this.focCount;
	};
	
	this.setFocCount = function(count) {
		this.focCount = count;
	};
	
	this.getStateLink = function() {
		return this.stateLink;
	};
	
	this.setStateLink = function(link) {
		this.stateLink = link;
	};
	
}
