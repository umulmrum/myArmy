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

function SystemService(systemState, armyState) {

    var dataReader = null;

    this.changeSystem = function(systemId) {
        for ( var i = 0; i < _systems.length; i++) {
            if (_systems[i].systemId == systemId) {
                systemState.system = _systems[i];
                break;
            }
        }
        dataReader.readSystem(systemState.system);
        armyState.resetArmy();
    };

    this.setDataReader = function(dataReaderParam) {
        dataReader = dataReaderParam;
    }
}