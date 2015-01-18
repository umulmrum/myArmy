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
 * State is used to compute the current state of constraints in the system.
 */
function State() {
	
	this.init = function() {
		_dispatcher.bindEvent("postAddSelection", this, this.sortSelections, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postAddSelection", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postRemoveSelection", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postChangeModelCount", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postSelectOption", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postChangeFocCount", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postInit", this, this.onDefaultEvent, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postChangeArmy", this, this.onPostChangeArmy, _dispatcher.PHASE_ACTION);
		_dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, _dispatcher.PHASE_ACTION);
	};
	
	this.sortSelections = function(event, additionalData) {
		var armyUnit = _armyState.getArmyUnit(additionalData.entityslot.detachmentDataIndex, additionalData.entityslot.armyUnitIndex);
		var sortedSelections = armyUnit.getSelections().sort(function(a, b) {
			var slotA = _systemState.slots[a.slotId];
			var slotB = _systemState.slots[b.slotId];
			if (slotA.position < slotB.position) {
				return -1;
			} else if (slotA.position > slotB.position) {
				return 1;
			} else {
				if(a.entityslotId < b.entityslotId) {
					return -1;
				} else if (a.entityslotId > b.entityslotId) {
					return 1;
				}
				return 0;
			}
		});
		armyUnit.setSelections(sortedSelections);
	};
	
	this.onDefaultEvent = function(event, additionalData) {
		var force = !isUndefined(additionalData) && additionalData.force;
		this.refreshDirtyThings(force);
	};
	
	this.onPostChangeDetachmentType = function(event, additionalData) {
		if(additionalData.newDetachmentTypeId != -1) {
			this.refreshDirtyThings(true);
		}
	};
	
	this.onPostChangeArmy = function(event, additionalData) {
		if(additionalData.armyId != -1) {
			this.refreshDirtyThings(true);
		}
	};
	
	this.onPostResetArmy = function(event) {
		traverseArmyUnit(this, this.checkAllEntityslotsAvailable);
	};
	
	this.refreshDirtyThings = function(force) {
		traverseArmyUnit(this, checkDirtyPools); // mark additional entityslots as dirty if affected by pool
		traverseArmyUnit(this, this.calculateDirtyEntityStatesInChooser, { force: force});
		traverseArmyUnit(this, this.calculateDirtyEntityStatesInSelections, { force: force});
		
		_dispatcher.triggerEvent("postStateRefresh");
	};

	this.calculateDirtyEntityStatesInChooser = function(armyUnit, armyUnitIndex, detachmentData, detachmentDataIndex, additionalParams) {
		for(var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			if(additionalParams.force || entityslot.dirty) {
				_state.checkEntityslotAvailable(armyUnit, entityslot);
			}
		}
	};

	this.checkAllEntityslotsAvailable = function(armyUnit) {
		for(var i in armyUnit.getEntityslots()) {
			_state.checkEntityslotAvailable(armyUnit, armyUnit.getEntityslot(i));
		}
	};

	this.checkEntityslotAvailable = function(armyUnit, entityslot) {
		
		var availableState = 1;
		var count = armyUnit.getEntityCount(entityslot.entityslotId);
		if (count > entityslot.maxTaken) {
			availableState = -1;
		} else if (count == entityslot.maxTaken) {
			availableState = 0;
		}
				
		if(availableState > -1) { // the worst case won't be changed
			for(var i in entityslot.needsPool) {
				var pool = armyUnit.getPool(i);
				if (pool.currentCount - entityslot.needsPool[pool.name] < 0) {
					// do not display the entityslot's state worse than necessary
					if (pool.currentCount >= 0 || (armyUnit.getEntityCount(entityslot.entityslotId) == 0) /*&& pool.currentCount >= -50000*/) {
						availableState = 0;
					} /*else if(pool.currentCount < -50000) {
						availableState = -2;
					}*/ else {
						availableState = -1;
					}
				}
				if(availableState == -1) {
					break;
				}
			}
		}
				
		if (entityslot.availableState != availableState) {
			entityslot.availableState = availableState;
			entityslot.dirty = true;
		} else {
			entityslot.dirty = false;
		}
	};

	this.calculateDirtyEntityStatesInSelections = function(armyUnit, additionalParams) {
		for ( var i = 0; i < armyUnit.getSelectionCount(); i++) {
			var slotEntry = armyUnit.getSelection(i);
			if (additionalParams.force || slotEntry.dirty) {
				_state.calculateEntityState(slotEntry);
			}
		}
	};

	this.calculateEntityState = function(entityslot) {
		var entity = entityslot.entity;
		var costBefore = (-1) * entity.totalCost;
		_armyState.addTotalPoints(costBefore);
		_armyState.addPointsPerSlot(entityslot.slotId, costBefore);
		calculateOptionState(entity, entity);
		calculateEntityCost(entity);
		_persistence.calculateEntityslotSaveState(entityslot);
		_armyState.addTotalPoints(entity.totalCost);
		_armyState.addPointsPerSlot(entityslot.slotId, entity.totalCost);
	};

	function calculateOptionState(entity, baseEntity) {
		if (isUndefined(entity.optionLists)) {
			return;
		}
		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			resolveOptionListMinMax(entity, baseEntity, optionList);
			for ( var j in optionList.options) {
				var option = optionList.options[j];
				resolveOptionMinMax(entity, baseEntity, optionList, option);
				resolveOptionPoolAvailable(option);
				resolveOptionLocalPoolAvailable(baseEntity, option);
				if (option.currentMaxTaken <= 0
						|| (option.poolAvailable < 1 && !option.selected)
						|| (option.localPoolAvailable < 1 && !option.selected)) {
					option.disabled = true;
				} else {
					option.disabled = false;
				}
				/*
				 * the maxTaken value might have been diminished, so reduce the
				 * currentCount to fit.
				 */
				if ((option.currentCount > option.currentMaxTaken)) {
					doSelectOption(optionList, option, option.currentMaxTaken);
				}
			}
			for ( var j in optionList.options) {
				var option = optionList.options[j];
				/*
				 * If there are currently more options selected than are available
				 * in this list, then reduce the number of selected options to fit
				 * the restrictions. Remember that we assured that no single option 
				 * is selected too often (in the lines above).
				 * Likewise fill the optionList if not enough options have been selected.
				 * Although we already did this when choosing the option, we need to
				 * check again, so that complex combinations of different optionLists
				 * can be handled.
				 * Ignore the currently selected option for this purpose. Otherwise we
				 * weren't able to click an option that lies above a selected option
				 * (e.g. psychic powers on Librarian or Hive Tyrant)
				 */
				if(option.localId != _guiState.lastClickedOptionId) {
					if ((option.currentCount > 0)
							&& (optionList.currentCount > optionList.currentMaxTaken)) {
						var diff = optionList.currentCount - optionList.currentMaxTaken;
						var newOptionCount = Math.min(Math.max(option.currentCount
								- diff, 0), option.currentMaxTaken);
						doSelectOption(optionList, option, newOptionCount);
					} else if((optionList.currentCount < optionList.currentMinTaken) && option.currentMaxTaken > 0 && option.poolAvailable == 1 && option.localPoolAvailable == 1) {
						var diff = optionList.currentMinTaken - optionList.currentCount;
						var newOptionCount = Math.min(option.currentCount + diff, option.currentMaxTaken);
						doSelectOption(optionList, option, newOptionCount);
					} 
				}
				
				/*
				 * Enforce minTaken in options (might be needed to check maxTaken for optionLists afterwards, but currently there is no such thing and so lazyness wins :-)  )
				 */
				if((option.currentCount < option.currentMinTaken) && option.currentMaxTaken > 0 && option.poolAvailable == 1 && option.localPoolAvailable == 1) {
					var diff = option.currentMinTaken - option.currentCount;
					var newOptionCount = Math.min(option.currentCount + diff, option.currentMaxTaken);
					doSelectOption(optionList, option, newOptionCount);
				}

				if (!option.disabled && option.selected) {
					calculateOptionState(option, baseEntity);
				}
			}

			/*
			 * If not enough options are selected in this list, fill the gap with
			 * default options.
			 */
			if (optionList.currentCount < optionList.currentMinTaken) {
				var diff = optionList.currentMinTaken - optionList.currentCount;
				for ( var j in optionList.options) {
					var option = optionList.options[j];
					if(option.disabled) {
						continue;
					}
					var optionDiff = option.currentMaxTaken - option.currentCount;
					if (optionDiff > 0) {
						doSelectOption(optionList, option, option.currentCount
								+ Math.min(diff, optionDiff));
						diff -= optionDiff;
						calculateOptionState(option, baseEntity);
						if (diff <= 0) {
							break;
						}
					}
				}
			}
		}
	}

	function resolveOptionListMinMax(entity, baseEntity, optionList) {
		var parentEntity = _armyState.lookupId(optionList.parentEntity);
		optionList.currentMinTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				null, optionList.minTaken, 0);
		if(optionList.currentMinTaken < 0) {
			optionList.currentMinTaken = 0;
		}
		optionList.currentMaxTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				null, optionList.maxTaken, Number.MAX_VALUE);
		if(optionList.currentMaxTaken < 0) {
			optionList.currentMaxTaken = 0;
		}
	}

	function resolveOptionMinMax(entity, baseEntity, optionList, option) {
		var parentEntity = _armyState.lookupId(optionList.parentEntity);
		option.currentMinTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				option, option.minTaken, 0);
		if(option.currentMinTaken < 0) {
			option.currentMinTaken = 0;
		}
		option.currentMaxTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				option, option.maxTaken, 1);
		if(option.currentMaxTaken < 0) {
			option.currentMaxTaken = 0;
		}
	}

	/**
	 * 
	 * @param all of these params need to be provided for the eval statement!
	 */
	function resolveMinMax(entity, parentEntity, baseEntity, optionList, option, value,
			defaultValue) {
		if (isNumber(value)) {
			return value;
		} else if (isUndefined(value)) {
			return defaultValue;
		} else {
			var entitySlot = _armyState.lookupId(entity.parentEntityslot);
			var pool = _armyState.getArmyUnit(entitySlot.detachmentDataIndex, entitySlot.armyUnitIndex).getPools();
			return parseInt(eval(value));
		}
	}

	function calculateEntityCost(entity) {
		var costObj = [0, 0];
		costObj[0] = entity.costPerModel;
		costObj[1] = entity.cost;

		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			if(optionList.currentMaxTaken == 0) {
				continue;
			}
			for ( var j in optionList.options) {
				calculateOptionCost(entity, optionList.options[j], costObj);
			}
		}

		entity.currentCostPerModel = costObj[0];
		entity.currentCost = costObj[1];
		entity.totalCost = costObj[0] * entity.currentCount + costObj[1];
	}

	function calculateOptionCost(entity, option, costObj) {
		var optionCostObj = [0, 0];

		// calculate option cost
		resolveOptionCurrentCost(entity, option, optionCostObj);
		// recursively calculate suboption cost if applicable
		if (!isUndefined(option.optionLists)) {
			for ( var i in option.optionLists) {
				var optionList = option.optionLists[i];
				for ( var j in optionList.options) {
					calculateOptionCost(entity, optionList.options[j],
							optionCostObj);
				}
			}
		}
		option.currentCostPerModel = optionCostObj[0];
		option.currentCost = optionCostObj[1];
		option.totalCost = entity.currentCount * optionCostObj[0]
				+ optionCostObj[1];
		if (!option.disabled && option.selected) {
			costObj[0] += optionCostObj[0];
			costObj[1] += optionCostObj[1];
		}
	}

	function resolveOptionCurrentCost(entity, option, optionCostObj) {

		if (isNumber(option.costPerModel)) {
			optionCostObj[0] = option.costPerModel;
		} else {
			optionCostObj[0] = eval(option.costPerModel);
		}
		if (isNumber(option.cost)) {
			optionCostObj[1] = option.cost;
		} else {
			optionCostObj[1] = eval(option.cost);
		}

		if (option.currentCount > 0) {
			optionCostObj[0] = option.currentCount * optionCostObj[0];
			optionCostObj[1] = option.currentCount * optionCostObj[1];
		}
	}

}