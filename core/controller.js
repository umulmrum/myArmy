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

function Controller(dispatcher, languageService, systemService, detachmentService, selectionService, optionService) {
	
	this.changeLanguage = function(language) {
        dispatcher.triggerEvent("preLongRunningProcess");
        languageService.changeLanguage(language);
		dispatcher.triggerEvent("postChangeLanguage");
        dispatcher.triggerEvent("postLongRunningProcess");
	};
	
	this.changeSystem = function(systemId) {
		if (systemId != -1) {
            systemService.changeSystem(systemId);
			//this.resetArmylist();
			dispatcher.triggerEvent("postChangeSystem");
		}
	};

	this.deleteAllDetachments = function() {
		detachmentService.deleteAllDetachments();
	};

	this.addDetachment = function(armyId, detachmentTypeId) {
		if(armyId == -1) {
			return;
		}
        dispatcher.triggerEvent("preLongRunningProcess");
        var detachmentData = detachmentService.addDetachment(armyId, detachmentTypeId);
		dispatcher.triggerEvent("postAddDetachment", { detachmentData: detachmentData, newArmyId: armyId });
        dispatcher.triggerEvent("postLongRunningProcess");
	};

	this.changeDetachmentType = function(detachmentData, detachmentTypeId, addFormationSelections) {
		var detachmentType = detachmentData.getDetachmentType(detachmentTypeId);
		if(detachmentData == null) {
			return;
		}
        var changedSelections = detachmentService.changeDetachmentType(detachmentData, detachmentType, addFormationSelections);
		dispatcher.triggerEvent("postChangeDetachmentType", { detachmentData: detachmentData, newDetachmentType: detachmentType, changedSelections: changedSelections });
	};

	this.deleteDetachment = function(detachmentData) {
		detachmentService.removeDetachment(detachmentData);
		dispatcher.triggerEvent("postDeleteDetachment", { detachmentData: detachmentData });
	};

	this.cloneDetachment = function(detachmentData) {
		detachmentService.cloneDetachment(detachmentData);
		//dispatcher.triggerEvent("postAddDetachment", { detachmentDataIndex: detachmentDataIndex });
	};

	this.addExtension = function(detachmentData, extensionId) {
		if(extensionId == -1) {
			return;
		}
        dispatcher.triggerEvent("preLongRunningProcess");
        var armyUnit = detachmentService.addExtension(detachmentData, extensionId);
		dispatcher.triggerEvent("postAddExtension", { detachmentData: detachmentData, armyUnit: armyUnit, extensionId: armyUnit.getArmy().armyId });
        dispatcher.triggerEvent("postLongRunningProcess");
	};

	this.deleteExtension = function(detachmentData, armyUnit) {
		var extensionId = detachmentService.deleteExtension(detachmentData, armyUnit);
		dispatcher.triggerEvent("postDeleteExtension", { detachmentData: detachmentData, armyUnit: armyUnit, extensionId: extensionId });
	};

    this.resetArmylist = function() {
        selectionService.deleteAllSelections();
        dispatcher.triggerEvent("postResetArmy");
    };
	
	this.addEntry = function(armyUnit, entityslotId, doEntityCalculations, options) {
        var selection = selectionService.addSelection(armyUnit, entityslotId, doEntityCalculations, options);
		if (doEntityCalculations) {
			dispatcher.triggerEvent("postAddSelection", { entityslot: selection });
		}
	};
	
	this.cloneEntry = function(entityslot) {
		var newSelection = selectionService.cloneSelection(entityslot);
		dispatcher.triggerEvent("postAddSelection", { entityslot: newSelection });
	};
	
	this.deleteEntry = function(entityslot) {
	    selectionService.deleteSelection(entityslot);
		dispatcher.triggerEvent("postRemoveSelection", { entityslot: entityslot });
	};
	
	this.setModelCount = function(entityslot, count) {
	    selectionService.setModelCount(entityslot, count);
		dispatcher.triggerEvent("postChangeModelCount", { entityslot: entityslot });
	};
	
	this.selectOption = function(optionLocalId, optionCount) {
        optionService.selectOption(optionLocalId, optionCount);
		dispatcher.triggerEvent("postSelectOption", { optionLocalId: optionLocalId });
	};
	
}
