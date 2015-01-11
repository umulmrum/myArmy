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
function DetachmentData() {
	
	this.detachmentType = null;
	
	// static data (these variables do only depend on the army type, so will not changed after the army data was read)
	this.allowedAllies = [];
	this.entityslotCount = {}; // the number of selectable entityslots per slot
	
	this.stateLinkPart = null;
	
	var armyUnits = {};
//	var armyUnitCount = 0;
	
	this.getArmy = function(armyUnitIndex) {
		if(isUndefined(armyUnits[armyUnitIndex])) {
			return null;
		}
		return armyUnits[armyUnitIndex].getArmy();
	};
	
	this.getArmyUnits = function() {
		return armyUnits;
	};
	
	this.setArmy = function(armyUnitIndex, army) {
		if(isUndefined(armyUnits[armyUnitIndex])) {
			armyUnits[armyUnitIndex] = new ArmyUnit();
		}
		armyUnits[armyUnitIndex].setArmy(army);
	};
	
	this.getArmyUnit = function(armyUnitIndex) {
		return armyUnits[armyUnitIndex];
	};
	
	this.setArmyUnit = function(armyUnitIndex, armyUnit) {
		armyUnits[armyUnitIndex] = army;
	};
	
	this.getArmyUnitCount = function() {
		return getObjectSize(armyUnits);
	};
	
	this.resetArmy = function() {
		for(var i in armyUnits) {
			armyUnits[i].resetArmy();
		}
	};
	
	this.addEntry = function(armyUnitIndex, entityslot, doEntityCalculations) {
		armyUnits[armyUnitIndex].addEntry(entityslot, doEntityCalculations);
	};

	this.removeEntry = function(armyUnitIndex, entityslot) {
		armyUnits[armyUnitIndex].removeEntry(entityslot);
	};
	
	this.addPool = function(armyUnitIndex, name, pool) {
		armyUnits[armyUnitIndex].addPool(name, pool);
	};

	this.increaseEntityslotCount = function(slotId) {
		if(isUndefined(this.entityslotCount[slotId])) {
			this.entityslotCount[slotId] = 1;
		} else {
			this.entityslotCount[slotId]++;
		}
	};
	
	this.getEntityCount = function(armyUnitIndex, entityslotId) {
		return armyUnits[armyUnitIndex].getEntityCount(entityslotId);
	};
	
	this.setEntityCount = function(armyUnitIndex, entityslotId, count) {
		armyUnits[armyUnitIndex].setEntityCount(entityslotId, count);
	};
	
	this.getPools = function(armyUnitIndex) {
		return armyUnits[armyUnitIndex].getPools();
	};
	
	this.getPool = function(armyUnitIndex, name) {
		return armyUnits[armyUnitIndex].getPool(name);
	};
	
	this.setPools = function(armyUnitIndex, pools) {
		armyUnits[armyUnitIndex].setPools(pools);
	};
}