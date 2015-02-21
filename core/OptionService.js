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

function OptionService(armyState) {

    this.poolService = null;

    this.selectOption = function(optionLocalId, optionCount) {
        _guiState.lastClickedOptionId = optionLocalId;
        var option = armyState.lookupId(optionLocalId);
        var entityslot = armyState.lookupId(option.parentEntityslot);
        this.selectOptionCommon(option, optionCount);

        /*
         * if there are currently more options selected than are available
         * in this list, then reduce the number of selected options to fit
         * the restrictions.
         * We need to do this here to avoid order-dependency when combining multiple option lists
         */
        var optionList = armyState.lookupId(option.parentOptionList);
        if (optionList.currentCount > optionList.currentMaxTaken) {
            var diff = optionList.currentCount - optionList.currentMaxTaken;
            for(var i in optionList.options) {
                var myOption = optionList.options[i];
                if(myOption.localId == optionLocalId) {
                    continue;
                }
                var newOptionCount = Math.min(Math.max(myOption.currentCount - diff, 0), myOption.currentMaxTaken);
                diff = diff - (myOption.currentCount - newOptionCount);
                this.selectOptionCommon(myOption, newOptionCount);
                if(diff <= 0) {
                    break;
                }
            }
        }

        entityslot.dirty = true;
    };

    this.selectOptionCommon = function(option, optionCount) {
        var optionList = armyState.lookupId(option.parentOptionList);

        if (option.selected) {
            if (option.currentMaxTaken > 1) {
                this.doSelectOption(optionList, option, optionCount);
            } else {
                if (optionList.currentMinTaken == 1 && optionList.currentCount <= 1) {
                    // select first option by default
                    this.doSelectOption(optionList, option, 0);
                    this.doSelectOption(optionList, optionList.options["1"], 1);
                } else {
                    // the following lines are some dirty hack :-)
                    // we need to distinguish the cases
                    // a) user reduced the option's maxTaken value, e.g. by reducing
                    // the entity's model count (termagants)
                    // b) user deselected a value of an option list without minTaken
                    // value
                    if (option.currentCount > 1) {
                        this.doSelectOption(optionList, option, optionCount);
                    } else {
                        this.doSelectOption(optionList, option, 0);
                    }
                }
            }
        } else {
            var selectedCount = 0;
            var selectedOption = null;
            for ( var i in optionList.options) {
                if (optionList.options[i].selected) {
                    selectedCount++;
                    // only save the last selected option for we only need this
                    // value if there is only a single option selected
                    selectedOption = optionList.options[i];
                }
            }
            if (selectedCount < optionList.currentMaxTaken) {
                this.doSelectOption(optionList, option, optionCount);
            } else {
                if (optionList.currentMaxTaken == 1) {
                    this.doSelectOption(optionList, selectedOption, 0);
                }
                this.doSelectOption(optionList, option, optionCount);
            }
        }

        return option;
    };

    /**
     *
     * @param optionList
     * @param option
     * @param optionCount
     *            the amount to set for this option - 0 deselects the option,
     *            anything greater than 0 selects the option
     */
    this.doSelectOption = function(optionList, option, optionCount) {
        if (optionCount > 0) {
            option.selected = true;
        } else {
            option.selected = false;
            // unselect all suboptions (the main purpose for this is that suboptions that influence pools are deselected)
            if(option.hasOptions()) {
                for(var i in option.optionLists) {
                    for(var j in option.optionLists[i].options) {
                        this.doSelectOption(option.optionLists[i], option.optionLists[i].options[j], 0);
                    }
                }
            }
        }
        var previousOptionCount = option.currentCount;
        option.currentCount = optionCount;
        optionList.currentCount += option.currentCount - previousOptionCount;

        this.poolService.changePoolByOption(option, optionCount, previousOptionCount);
        this.poolService.changeLocalPoolByOption(option, optionCount, previousOptionCount);
    };

    this.setPoolService = function(poolService) {
        this.poolService = poolService;
    };
}