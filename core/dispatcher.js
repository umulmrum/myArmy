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

function Dispatcher() {
	
	this.PHASE_BEGIN = 9;
	this.PHASE_ACTION = 10;
	this.PHASE_STATE = 11;
//	this.PHASE_RENDER = 12;
	
	var $this = $(this);
	var eventsActive = true;
	
	this.bindEvent = function(eventName, context, method, phase) {
		$this.bind(phase + eventName, $.proxy(method, context));
	};
	
	this.triggerEvent = function(eventName, additionalData) {
		if(eventsActive) {
			for(var phase = this.PHASE_BEGIN; phase <= this.PHASE_STATE; phase++) {
				$this.trigger(phase + eventName, additionalData);
			}
		}
	};
	
	this.deactivateEvents = function() {
		eventsActive = false;
	};
	
	this.activateEvents = function() {
		eventsActive = true;
	};
}