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
function State(dispatcher, systemState, armyState, persistence, poolService, optionService) {
	
	this.init = function() {
		dispatcher.bindEvent("postAddSelection", this, this.onPostAddSelection, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postAddSelection", this, this.onDefaultEvent, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postRemoveSelection", this, this.onPostRemoveSelection, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postChangeModelCount", this, this.onDefaultEvent, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postSelectOption", this, this.onDefaultEvent, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postChangeFocCount", this, this.onDefaultEvent, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postInit", this, this.onDefaultEvent, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postChangeDetachmentType", this, this.onPostChangeDetachmentType, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postResetArmy", this, this.onPostResetArmy, dispatcher.PHASE_ACTION);
	};

	this.onPostAddSelection = function(event, additionalData) {
		var armyUnit = armyState.getArmyUnit(additionalData.entityslot.detachmentDataIndex, additionalData.entityslot.armyUnitIndex);
		this.sortSelections(armyUnit);
		this.calculateAllSelectionSlotCosts(armyUnit);
	};

	this.onPostRemoveSelection = function(event, additionalData) {
		this.calculateAllSelectionSlotCosts(armyState.getArmyUnit(additionalData.entityslot.detachmentDataIndex, additionalData.entityslot.armyUnitIndex))
		this.onDefaultEvent(event, additionalData);
	};

	this.sortSelections = function(armyUnit) {
		var sortedSelections = armyUnit.getSelections().sort(function(a, b) {
			var slotA = systemState.slots[a.slotId];
			var slotB = systemState.slots[b.slotId];
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
	
	this.onPostChangeDetachmentType = function(event) {
		for(var i in armyState.getDetachments()) {
			for(var j in armyState.getDetachmentData(i).getArmyUnits()) {
				this.sortSelections(armyState.getArmyUnit(i, j));
			}
		}
		this.refreshDirtyThings(true);
	};
	
	this.onPostAddDetachment = function(event, additionalData) {
		if(additionalData.armyId != -1) {
			this.refreshDirtyThings(true);
		}
	};
	
	this.onPostResetArmy = function(event) {
		traverseArmyUnit(this, this.checkAllEntityslotsAvailable);
	};
	
	this.refreshDirtyThings = function(force) {
		traverseDetachmentData(this, poolService.checkDirtyPools); // mark additional entityslots as dirty if affected by pool
		traverseArmyUnit(this, this.calculateDirtyEntityStatesInChooser, { force: force});
		traverseArmyUnit(this, this.calculateDirtyEntityStatesInSelections, { force: force});
		
		dispatcher.triggerEvent("postStateRefresh");
	};

	this.calculateDirtyEntityStatesInChooser = function(armyUnit, detachmentData, additionalParams) {
		for(var i in armyUnit.getEntityslots()) {
			var entityslot = armyUnit.getEntityslot(i);
			if(additionalParams.force || entityslot.dirty) {
				this.checkEntityslotAvailable(detachmentData, armyUnit, entityslot);
			}
		}
	};

	this.checkAllEntityslotsAvailable = function(armyUnit, detachmentData) {
		for(var i in armyUnit.getEntityslots()) {
			this.checkEntityslotAvailable(detachmentData, armyUnit, armyUnit.getEntityslot(i));
		}
	};

	this.checkEntityslotAvailable = function(detachmentData, armyUnit, entityslot) {
		
		var availableState = 1;
		var count = armyUnit.getEntityCount(entityslot.entityslotId);
		if (count > entityslot.maxTaken) {
			availableState = -1;
		} else if (count == entityslot.maxTaken) {
			availableState = 0;
		}
				
		if(availableState > -1) { // the worst case won't be changed
			for(var i in entityslot.needsPool) {
				var pool = detachmentData.getPool(i);
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

	this.calculateDirtyEntityStatesInSelections = function(armyUnit, detachmentData, additionalParams) {
		for ( var i = 0; i < armyUnit.getSelectionCount(); i++) {
			var slotEntry = armyUnit.getSelection(i);
			if (additionalParams.force || slotEntry.dirty) {
				this.calculateEntityState(slotEntry);
			}
		}
	};

	this.calculateEntityState = function(entityslot) {
		var entity = entityslot.entity;
		var costBefore = (-1) * entity.totalCost;
		armyState.addTotalPoints(costBefore);
		armyState.addPointsPerSlot(entityslot.slotId, costBefore);
		calculateOptionState(entityslot, entity, entity);
		calculateEntityCost(entityslot, entity);
		persistence.calculateEntityslotSaveState(entityslot);
		armyState.addTotalPoints(entity.totalCost);
		armyState.addPointsPerSlot(entityslot.slotId, entity.totalCost);
	};

	function calculateOptionState(entityslot, entity, baseEntity) {
		if (isUndefined(entity.optionLists)) {
			return;
		}
		var entityFromPool = armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex).getFromEntityPool(entity.entityId);
		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			/* we always use the optionList from the entity pool to compare against - this way we have a single source of information which is more easy to modify */
			resolveOptionListMinMax(entity, baseEntity, optionList, entityFromPool.optionLists[i]);
			var optionListHasActiveOptions = false;
			var totalMinTaken = 0;
			for ( var j in optionList.options) {
				var option = optionList.options[j];
				resolveOptionMinMax(entity, baseEntity, optionList, option, entityFromPool.optionLists[i].options[j]);
				poolService.resolveOptionPoolAvailable(option);
				poolService.resolveOptionLocalPoolAvailable(option);
				totalMinTaken += option.currentMinTaken;
			}
			var optionListIsFullByMinTaken = (totalMinTaken >= optionList.currentMaxTaken);
			for ( var j in optionList.options) {
				var option = optionList.options[j];
				if (option.currentMaxTaken <= 0
						|| (option.poolAvailable < 1 && !option.selected)
						|| (option.localPoolAvailable < 1 && !option.selected)
						|| (optionListIsFullByMinTaken && option.currentMinTaken <= 0)) {
					option.disabled = true;
				} else {
					option.disabled = false;
					optionListHasActiveOptions = true;
				}
				/*
				 * the maxTaken value might have been diminished, so reduce the
				 * currentCount to fit.
				 */
				if ((option.currentCount > option.currentMaxTaken)) {
                    optionService.doSelectOption(optionList, option, option.currentMaxTaken);
				}
			}
			if(!optionListHasActiveOptions) {
				optionList.currentMaxTaken = 0;
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
                        optionService.doSelectOption(optionList, option, newOptionCount);
					} else if((optionList.currentCount < optionList.currentMinTaken) && option.currentMaxTaken > 0 && option.poolAvailable == 1 && option.localPoolAvailable == 1) {
						var diff = optionList.currentMinTaken - optionList.currentCount;
						var newOptionCount = Math.min(option.currentCount + diff, option.currentMaxTaken);
                        optionService.doSelectOption(optionList, option, newOptionCount);
					} 
				}

				/*
				 * Enforce minTaken in options
				 */
				if((option.currentCount < option.currentMinTaken) && option.currentMaxTaken > 0 && option.poolAvailable == 1 && option.localPoolAvailable == 1) {
					var diff = option.currentMinTaken - option.currentCount;
					var newOptionCount = Math.min(option.currentCount + diff, option.currentMaxTaken);
                    optionService.doSelectOption(optionList, option, newOptionCount);
				}
				/*
				 * Now maybe there are too many options selected for this optionList. So we unselect/reduce all options whose currentCount is greater than their
				 * currentMinTaken value until the optionList constraint is fulfilled again
				 */
				if(optionList.currentCount > optionList.currentMaxTaken) {
					var diff = optionList.currentCount - optionList.currentMaxTaken;
					for(var j in optionList.options) {
						var option = optionList.options[j];
						var optionDiff = option.currentCount - option.currentMinTaken;
						if(optionDiff > 0) {
                            optionService.doSelectOption(optionList, option, option.currentCount - Math.min(diff, optionDiff));
							diff -= optionDiff;
							calculateOptionState(entityslot, option, baseEntity);
							if(diff <= 0) {
								break;
							}
						}
					}
				}

				if (!option.disabled && option.selected) {
					calculateOptionState(entityslot, option, baseEntity);
				}
			}

			/*
			 * If not enough options are selected in this list, fill the gap with
			 * default options.
			 */
			if (optionList.currentCount < optionList.currentMinTaken) {
				var diff = optionList.currentMinTaken - optionList.currentCount;

				///*
				// * start with options that have a minTaken value > 0
				// */
				//if(totalMinTaken > 0) {
				//	for ( var j in optionList.options) {
				//		var option = optionList.options[j];
				//		if(option.disabled || option.currentMinTaken == 0) {
				//			continue;
				//		}
				//
				//	}
				//}
				for ( var j in optionList.options) {
					var option = optionList.options[j];
					if(option.disabled) {
						continue;
					}
					var optionDiff = option.currentMaxTaken - option.currentCount;
					if (optionDiff > 0) {
                        optionService.doSelectOption(optionList, option, option.currentCount
								+ Math.min(diff, optionDiff));
						diff -= optionDiff;
						calculateOptionState(entityslot, option, baseEntity);
						if (diff <= 0) {
							break;
						}
					}
				}
			}
		}
	}

	function resolveOptionListMinMax(entity, baseEntity, optionList, compareOptionList) {
		var parentEntity = armyState.lookupId(optionList.parentEntity);
		optionList.currentMinTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				null, compareOptionList.minTaken, 0);
		if(optionList.currentMinTaken < 0) {
			optionList.currentMinTaken = 0;
		}
		optionList.currentMaxTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				null, compareOptionList.maxTaken, Number.MAX_VALUE);
		if(optionList.currentMaxTaken < 0) {
			optionList.currentMaxTaken = 0;
		}
	}

	function resolveOptionMinMax(entity, baseEntity, optionList, option, compareOption) {
		var parentEntity = armyState.lookupId(optionList.parentEntity);
		option.currentMinTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				option, compareOption.minTaken, 0);
		if(option.currentMinTaken < 0) {
			option.currentMinTaken = 0;
		}
		option.currentMaxTaken = resolveMinMax(entity, parentEntity, baseEntity, optionList,
				option, compareOption.maxTaken, 1);
		if(option.currentMaxTaken < 0) {
			option.currentMaxTaken = 0;
		}
	}

	/**
	 * 
	 * all of these params need to be provided for the eval statement!
	 */
	function resolveMinMax(entity, parentEntity, baseEntity, optionList, option, value, defaultValue) {
		if (isNumber(value)) {
			return value;
		} else if (isUndefined(value)) {
			return defaultValue;
		} else {
			var entitySlot = armyState.lookupId(entity.parentEntityslot);
			var detachmentData = armyState.getDetachmentData(entitySlot.detachmentDataIndex);
			var armyUnit = detachmentData.getArmyUnit(entitySlot.armyUnitIndex);
			var entityCount = armyUnit.getEntityCounts();
			var pool = detachmentData.getPools();
			return parseInt(eval(value));
		}
	}

	function calculateEntityCost(entityslot, entity) {
		var costObj = [0, 0];
        costObj[0] = entity.costPerModel;
        costObj[1] = entity.cost;

        for ( var i in entity.optionLists) {
            var optionList = entity.optionLists[i];
            if(optionList.currentMaxTaken == 0) {
                continue;
            }
            for ( var j in optionList.options) {
                var entityFromPool = armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex).getFromEntityPool(entity.entityId);
                var optionFromPool = entityFromPool.optionLists[i].options[j];
                calculateOptionCost(entityslot, entity, optionList.options[j], optionFromPool, costObj);
            }
		}

		entity.currentCostPerModel = costObj[0];
		entity.currentCost = costObj[1];
		entity.totalCost = costObj[0] * entity.currentCount + costObj[1];
	}

	function calculateOptionCost(entityslot, entity, option, compareOption, costObj) {
		var optionCostObj = [0, 0];

		// calculate option cost
		resolveOptionCurrentCost(entity, option, compareOption, optionCostObj);
		// recursively calculate suboption cost if applicable
		if (!isUndefined(option.optionLists)) {
			for ( var i in option.optionLists) {
				var optionList = option.optionLists[i];
				for ( var j in optionList.options) {
                    var entityFromPool = armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex).getFromEntityPool(option.entityId);
                    var optionFromPool = entityFromPool.optionLists[i].options[j];
					calculateOptionCost(entityslot, entity, optionList.options[j], optionFromPool, optionCostObj);
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

	function resolveOptionCurrentCost(entity, option, compareOption, optionCostObj) {

		if (isNumber(compareOption.costPerModel)) {
			optionCostObj[0] = compareOption.costPerModel;
		} else {
			optionCostObj[0] = eval(compareOption.costPerModel);
		}
		if (isNumber(compareOption.cost)) {
			optionCostObj[1] = compareOption.cost;
		} else {
			optionCostObj[1] = eval(compareOption.cost);
		}

		if (option.currentCount > 0) {
			optionCostObj[0] = option.currentCount * optionCostObj[0];
			optionCostObj[1] = option.currentCount * optionCostObj[1];
		}
	}

	this.calculateAllSelectionSlotCosts = function(armyUnit) {
		for(var i in armyUnit.getSelections()) {
			this.calculateSelectionSlotCost(armyUnit.getSelection(i));
		}
	};

	this.calculateSelectionSlotCost = function(selection) {
		var costBefore = selection.currentSlotCost;
		var armyUnit = armyState.getArmyUnit(selection.detachmentDataIndex, selection.armyUnitIndex);
		var entityslotFromPool = armyUnit.getEntityslot(selection.entityslotId);
		if (isNumber(entityslotFromPool.slotCost)) {
			selection.currentSlotCost = entityslotFromPool.slotCost;
		} else {
			var entityCount = armyUnit.getEntityCounts();
			selection.currentSlotCost =  parseFloat(eval(entityslotFromPool.slotCost));
		}
		if(costBefore != selection.currentSlotCost) {
			armyUnit.addSelectionSlotCost(selection.slotId, selection.currentSlotCost - costBefore);
		}
	};

}