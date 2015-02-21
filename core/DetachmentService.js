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

function DetachmentService(systemState, armyState) {

    var dataReader = null;
    var modificationService = null;
    var persistence = null;

    this.addDetachment = function(armyId, detachmentTypeId) {

        var detachmentData = armyState.addDetachment(systemState.armies[armyId]);
        var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
        var armyUnit = detachmentData.getArmyUnit("a0");

        dataReader.loadArmy(armyUnit, detachmentData);
        detachmentData.resetArmy();
        if(!isUndefined(detachmentTypeId)) {
            this.changeDetachmentType(detachmentData, detachmentData.getDetachmentType(detachmentTypeId));
        } else {
            if(detachmentDataIndex == "d0") {
                this.changeDetachmentType(detachmentData, detachmentData.getDetachmentType("1"));
            } else {
                this.changeDetachmentType(detachmentData, detachmentData.getDetachmentType("2"));
            }
        }
        return detachmentData;
    };

    this.cloneDetachment = function(detachmentData) {
        window.location.hash += detachmentData.stateLinkPart;
    };

    this.changeDetachmentType = function(detachmentData, detachmentType, addFormationSelections) {
        detachmentData.detachmentType = detachmentType;

        if(detachmentType.hasModifications()) {
            modificationService.applyModifications(detachmentData, detachmentType.modifications, detachmentType.origin);
        }
        var changedEntityslots = false;
        var changedSelections = false;
        if(detachmentType.isFormation()) {
            changedEntityslots = true;
            if(addFormationSelections) {
                changedSelections = true;
                detachmentData.resetArmy();
                persistence.restoreFragment(detachmentType.formationData, detachmentData, { deletable: false, clonable: false });
            }
        }
        return changedSelections;
    };

    this.deleteDetachment = function(detachmentData) {
        armyState.removeDetachment(detachmentData);
    };

    this.deleteAllDetachments = function() {
        self.location.hash = "#";
    };

    this.addExtension = function(detachmentData, extensionId) {
        var armyUnit = detachmentData.addArmyUnit(systemState.extensions[extensionId]);
        dataReader.loadArmy(armyUnit, detachmentData);
        armyUnit.resetArmy();
        return armyUnit;
    };

    this.deleteExtension = function(detachmentData, armyUnit) {
        return detachmentData.removeExtension(armyUnit.getArmyUnitIndex());
    };

    this.setDataReader = function(dataReaderParam) {
        dataReader = dataReaderParam;
    };

    this.setModificationService = function(modificationServiceParam) {
        modificationService = modificationServiceParam;
    };

    this.setPersistence = function(persistenceParam) {
        persistence = persistenceParam;
    }
}