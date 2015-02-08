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

function parsePools(armyIndex, poolString) {
	if (poolString == null) {
		return {};
	}
	var pools = poolString.split(",");
	var retValue = {};
	for ( var i = 0; i < pools.length; i++) {
		var poolArray = pools[i].split(":");
		var poolValue = 1;
		if (poolArray.length == 3 && armyIndex > 0) {
			poolValue = 2;
		}
		retValue[poolArray[0]] = parseInt(poolArray[poolValue]);
	}
	return retValue;
}

/**
 * Register a pool dependent entityslot template.
 * 
 * @param entityslot
 */
function registerEntityslotForPools(entityslot) {
	var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
	var armyUnit = detachmentData.getArmyUnit(entityslot.armyUnitIndex);
	for ( var i in entityslot.needsPool) {
		var pool = detachmentData.getPool(i);
		if(isUndefined(pool)) {
			alert("Pool " + i + " is undefined.");
		}
		if(isUndefined(pool.dependingEntityslots[armyUnit.armyUnitIndex])) {
			pool.dependingEntityslots[armyUnit.armyUnitIndex] = {};
		}
		pool.dependingEntityslots[armyUnit.armyUnitIndex][entityslot.entityslotId] = entityslot;
	}
	checkPoolAvailable(entityslot.needsPool);
}

/**
 * Register all pool dependent options of this entityslot. Call this method when
 * adding a concrete entityslot to the army list.
 * 
 * @param entityslot
 */
function registerEntityslotOptionsForPools(entityslot) {
	for ( var i in entityslot.entity.optionLists) {
		for ( var j in entityslot.entity.optionLists[i].options) {
			var option = entityslot.entity.optionLists[i].options[j];
			registerOptionForPools(option, entityslot);
		}
	}
}

function registerOptionForPools(option, entityslot) {
	var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
	for ( var i in option.needsPool) {
		var pool = detachmentData.getPool(i);
		pool.dependingOptions[option.localId] = option;
		if (pool.currentCount - option.needsPool[i] < 0 && !option.selected) {
			option.poolAvailable = false;
		}
	}
	if (!isUndefined(option.optionLists)) {
		for ( var i in option.optionLists) {
			for ( var j in option.optionLists[i].options) {
				var deepOption = option.optionLists[i].options[j];
				registerOptionForPools(deepOption, entityslot);
			}
		}
	}
}

function unregisterEntityslotOptionsForPools(entityslot) {
	changePoolByEntityslot(entityslot, false);
	for ( var i in entityslot.entity.optionLists) {
		for ( var j in entityslot.entity.optionLists[i].options) {
			var option = entityslot.entity.optionLists[i].options[j];
			unregisterOptionForPools(option);
		}
	}
}

function unregisterOptionForPools(option) {
	if (hasProperties(option.fillsPool) || hasProperties(option.needsPool)) {
		doSelectOption(_armyState.lookupId(option.parentOptionList), option, 0);
	}
	var entityslot = _armyState.lookupId(option.parentEntityslot);
	var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
	for ( var i in option.needsPool) {
		delete detachmentData.getPool(i).dependingOptions[option.localId];
	}
	if (!isUndefined(option.optionLists)) {
		for ( var i in option.optionLists) {
			for ( var j in option.optionLists[i].options) {
				var deepOption = option.optionLists[i].options[j];
				unregisterOptionForPools(deepOption);
			}
		}
	}
}

function checkDirtyPools(detachmentData) {
	for ( var i in detachmentData.getPools()) {
		var pool = detachmentData.getPool(i);
		if (pool.dirty) {
			for ( var j in pool.dependingEntityslots) {
				var dependingEntityslotsForArmyUnit = pool.dependingEntityslots[j];
				for(var k in dependingEntityslotsForArmyUnit) {
					var entityslot = dependingEntityslotsForArmyUnit[k];
					entityslot.dirty = true;
				}
			}
			for ( var j in pool.dependingOptions) {
				var option = pool.dependingOptions[j];
				_armyState.lookupId(option.parentEntityslot).dirty = true;
			}
			pool.dirty = false;
		}
	}
}

// function checkEntityslotPoolAvailable (entityslot) {
// var previousPoolAvailable = entityslot.poolAvailable;
// if (pool.currentCount - entityslot.needsPool[pool.name] < 0) {
// if (pool.currentCount >= 0) {
// entityslot.poolAvailable = 0;
// } else {
// entityslot.poolAvailable = -1;
// }
// } else {
// entityslot.poolAvailable = 1;
// }
// if (entityslot.poolAvailable != previousPoolAvailable) {
// entityslot.dirty = true;
// } else {
// entityslot.dirty = false;
// }
// }

function checkPoolsAvailable(detachmentData) {
	for ( var i in detachmentData.getPools()) {
		checkPoolAvailable(detachmentData.getPool(i));
	}
}

function resolveOptionPoolAvailable(option) {
	var parentEntityslot = _armyState.lookupId(option.parentEntityslot);
	var detachmentData = _armyState.getDetachmentData(parentEntityslot.detachmentDataIndex);
	var poolAvailable = 1;

	for ( var i in option.needsPool) {
		var pool = detachmentData.getPool(i);
		if(isUndefined(pool)) {
			alert("Pool " + i + " is undefined.");
		}

		if (option.selected) {
			if (pool.currentCount < 0) {
				doSelectOption(_armyState.lookupId(option.parentOptionList), option, 0);
				poolAvailable = -1;
			}
		} else {
			if (pool.currentCount - option.needsPool[pool.name] < 0) {
				if (pool.currentCount >= 0) {
					poolAvailable = 0;
				} else {
					poolAvailable = -1;
				}
			}
		}
		if (poolAvailable == -1) {
			break;
		}
	}
	if (poolAvailable != option.poolAvailable) {
		option.poolAvailable = poolAvailable;
		_armyState.lookupId(option.parentEntityslot).dirty = true;
	}
}

/**
 * This method checks if entityslots or options that depend on a pool can be
 * selected. Call this method after every pool change.
 */
function checkPoolAvailable(pool) {
	for ( var i in pool.dependingEntityslots) {
		var dependingEntityslotsForArmyUnit = pool.dependingEntityslots[i];
		for(var j in dependingEntityslotsForArmyUnit) {
			var entityslot = dependingEntityslotsForArmyUnit[j];
			var previousPoolAvailable = entityslot.poolAvailable;
			/*if (pool.currentCount < -50000) {
			 entityslot.poolAvailable = -2;
			 } else*/
			if (pool.currentCount - entityslot.needsPool[pool.name] < 0) {
//			if (entityslot.poolAvailable != -2) {
				if (pool.currentCount >= 0) {
					entityslot.poolAvailable = 0;
				} else {
					entityslot.poolAvailable = -1;
				}
//			}
			} else {
				entityslot.poolAvailable = 1;
			}
			if (entityslot.poolAvailable != previousPoolAvailable) {
				entityslot.dirty = true;
			}
		}
	}
	for ( var i in pool.dependingOptions) {
		var myOption = pool.dependingOptions[i];
		var previousPoolAvailable = myOption.poolAvailable;

		myOption.poolAvailable = 1;
		if (myOption.selected) {
			if (pool.currentCount < 0) {
				doSelectOption(_armyState.lookupId(myOption.parentOptionList), myOption,
						0);
				myOption.poolAvailable = -1;
			}
		} else {
			/*if (pool.currentCount < 50000) {
				myOption.poolAvailable = -2;
			} else*/ if (pool.currentCount - myOption.needsPool[pool.name] < 0) {
				if (pool.currentCount >= 0) {
					myOption.poolAvailable = 0;
				} else {
					myOption.poolAvailable = -1;
				}
			}
		}

		if ((myOption.poolAvailable != previousPoolAvailable)
				&& !isUndefined(_armyState.lookupId(myOption.parentEntityslot))) {
			// might be undefined during the call from deleteEntry, when
			// the entityslot has already been deleted; in this case we
			// can (and need to) safely ignore the dirty flag
			_armyState.lookupId(myOption.parentEntityslot).dirty = true;
		}
	}
}

function changePoolByEntityslot(entityslot, isAdd) {
	var multiplier = isAdd ? 1 : -1;
	var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
	
	changePool(detachmentData, entityslot.fillsPool, multiplier);
	changePool(detachmentData, entityslot.needsPool, (-1) * multiplier);
}

function changePoolByOption(option, newCount, oldCount) {
	var diff = newCount - oldCount;
	if (diff == 0) {
		return;
	}
	var entityslot = _armyState.lookupId(option.parentEntityslot);
	var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
	changePool(detachmentData, option.fillsPool, diff);
	changePool(detachmentData, option.needsPool, (-1) * diff);
}

function changePool(detachmentData, pool, multiplier) {
	for ( var i in pool) {
		detachmentData.getPool(i).currentCount += multiplier * pool[i];
		detachmentData.getPool(i).dirty = true;
	}
}

function fixOptionPool(detachmentData, armyUnit, entityOrOption) {
	traverseOptions(detachmentData, armyUnit, entityOrOption, fixOptionPoolVisitor);
}

/**
 * The clone operation is somewhat hacky, so that we need to fix the pools after
 * cloning. We do not use the doSelect function as we need to circumvent all the
 * checks and modifications it performs.
 * 
 * @param detachmentData
 * @param armyUnit
 * @param optionList
 * @param option
 */
function fixOptionPoolVisitor(detachmentData, armyUnit, optionList, option) {
	var entityslot = _armyState.lookupId(option.parentEntityslot);
	//var armyUnit = _armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex);
	for ( var i in option.needsPool) {
		if ((detachmentData.getPool(i).currentCount - option.needsPool[i]) < 0) {
			// doSelectOption(optionList, option, 0); // do not use this (see
			// comment above)
			optionList.currentCount -= option.currentCount;
			option.selected = false;
			option.currentCount = 0;
		}
	}
}

function resolveOptionLocalPoolAvailable(option) {
	var poolAvailable = 1;

	for ( var i in option.needsLocalPool) {
		var pool = getLocalPool(option.parentEntity, i);
		// If the pool is not defined in the parent entity hierarchy, we do not allow to use the option (after all, it's a "credit" system).
		if(pool == null) {
			option.localPoolAvailable = 0;
			return;
		}

		if (option.selected) {
			if (pool.currentCount < 0) {
				doSelectOption(_armyState.lookupId(option.parentOptionList), option, 0);
				poolAvailable = -1;
			}
		} else {
			if (pool.currentCount - option.needsLocalPool[pool.name] < 0) {
					poolAvailable = 0;
			}
		}
		if (poolAvailable == 0) {
			break;
		}
	}
	if (poolAvailable != option.localPoolAvailable) {
		option.localPoolAvailable = poolAvailable;
		_armyState.lookupId(option.parentEntityslot).dirty = true;
	}
}

function changeLocalPoolByOption(option, newCount, oldCount) {
	var diff = newCount - oldCount;
	if (diff == 0) {
		return;
	}
	changeLocalPool(option.parentEntity, option.fillsLocalPool, diff);
	changeLocalPool(option.parentEntity, option.needsLocalPool, (-1) * diff);
}

function changeLocalPool(entityId, pool, multiplier) {
	for ( var i in pool) {
		var localPool = getLocalPool(entityId, i);
		if(localPool == null) {
			continue;
		}
		localPool.currentCount += multiplier * pool[i];
		localPool.dirty = true;
	}
}

function getLocalPool(entityId, name) {
	var entity = _armyState.lookupId(entityId);
	if(entity.hasLocalPool(name)) {
		return entity.localPools[name];
	}
	if(entity.parentEntity == -1) {
		return null;
	}
	return getLocalPool(entity.parentEntity, name);
}

function changeModelCountPool(entityslot, oldCount, count) {
	if(isUndefined(entityslot.entity.modelCountPoolChange)) {
		return;
	}
	var changes = entityslot.entity.modelCountPoolChange.split(",");
	for(var i in changes) {
		var changeParts = changes[i].split(":");
		var condition = changeParts[0];
		var poolName = changeParts[1];
		var poolChange = parseInt((changeParts.length > 3) ? changeParts[3] : changeParts[2]);
		
		var oldOutcome = eval("oldCount " + condition);
		var newOutcome = eval("count " + condition);
		var realPoolChange = 0;
		if(newOutcome && !oldOutcome) {
			realPoolChange = poolChange;
		} else if(oldOutcome && !newOutcome) {
			realPoolChange = (-1) *  poolChange;
		}
		if(realPoolChange != 0) {
			var detachmentData = _armyState.getDetachmentData(entityslot.detachmentDataIndex);
			detachmentData.getPool(poolName).currentCount += realPoolChange;
			detachmentData.getPool(poolName).dirty = true;
		}
	}
}