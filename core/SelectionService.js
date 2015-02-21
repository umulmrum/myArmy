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

function SelectionService(armyState, poolService) {

    this.addSelection = function(armyUnit, entityslotId, doEntityCalculations, options) {
        var entityslot = armyUnit.getEntityslot(entityslotId).clone();
        var entityId = entityslot.entityId;
        var entity = armyUnit.getFromEntityPool(entityId).clone();
        entityslot.entity = entity;
        options = options || {};
        for(var i in options) {
            entityslot[i] = options[i];
        }
        armyUnit.addEntry(entityslot, doEntityCalculations);

        if (doEntityCalculations) {
            poolService.registerEntityslotOptionsForPools(entityslot);
            poolService.changePoolByEntityslot(entityslot, true);
        }

        return entityslot;
    };

    this.cloneSelection = function(entityslot) {
        var detachmentData = armyState.getDetachmentData(entityslot.detachmentDataIndex);
        var armyUnit = detachmentData.getArmyUnit(entityslot.armyUnitIndex);
        var newEntityslot = entityslot.clone();
        var newEntity = newEntityslot.entity;
        armyUnit.addEntry(newEntityslot, false);
        newEntity.totalCost = 0; // will be recalculated later on
        poolService.registerEntityslotOptionsForPools(newEntityslot);
        poolService.changePoolByEntityslot(newEntityslot, true);
        poolService.fixOptionPool(detachmentData, armyUnit, newEntityslot.entity);

        return newEntityslot;
    };

    this.deleteSelection = function(entityslot) {
        var armyUnit = armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex);
        var entity = entityslot.entity;
        armyState.addTotalPoints((-1) * entity.totalCost);
        poolService.unregisterEntityslotOptionsForPools(entityslot);
        armyUnit.removeEntry(entityslot);
    };

    this.deleteAllSelections = function() {
        armyState.resetArmy();
    };

    this.setModelCount = function(entityslot, count) {
        if(count < entityslot.entity.minCount || count > entityslot.entity.maxCount) {
            return;
        }
        var oldCount = entityslot.entity.currentCount;
        entityslot.entity.currentCount = count;
        poolService.changeModelCountPool(entityslot, oldCount, count);
        entityslot.dirty = true;
    };
}