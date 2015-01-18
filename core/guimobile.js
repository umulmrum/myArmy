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

function toggleMenu(event) {
	var menuId = event.data.menuId;
	var menu = _gui.getElement("#" + menuId);
	if(menu.hasClass("invisible")) {
		showMenu(menuId);
	} else {
		hideMenu(menuId);
	}
}

function showAppMenu() {
	showMenu("appMenu");
}

function showSlotMenu() {
	showMenu("slotMenu");
}

function showMenu(menuId) {
	var menu = _gui.getElement("#" + menuId);
	var menuButton = _gui.getElement("#" + menuId + "Button");
	hideAllMenus();
	var newPosition = menuButton.offset();
	menu.removeClass("invisible");
	newPosition.top = newPosition.top + menuButton.height() - menu.height();
	newPosition.left = newPosition.left - 1;
	menu.offset(newPosition);
	menu.animate({ "top": menuButton.offset().top + menuButton.height() }, 'fast', function() {
		$(window).on(_guiState.clickEvent, hideAllMenusIfNotClickedIn);
	});
	
}

function hideMenu(menuId) {
	var menu = _gui.getElement("#" + menuId);
	var menuButton = _gui.getElement("#" + menuId + "Button");
	if(!menu.hasClass("invisible")) {
		menu.animate({
	        "top": menuButton.offset().top + menuButton.height() - menu.height()
	    }, 'fast', function() {
	    	menu.addClass("invisible");
	    });
	}
	$(window).unbind(_guiState.clickEvent);
}

function hideAllMenusIfNotClickedIn(event) {
	_gui.getElement(".menu").each(function(index, element) {
		if (!clickIsInElement(event, element.id)) {
			hideMenu(element.id);
		}
	});
	$(window).unbind(_guiState.clickEvent);
}

function hideAllMenus() {
	_gui.getElement(".menu").addClass("invisible");
	$(window).unbind(_guiState.clickEvent);
}

var _currentSlotId = -1;

function showSlot(slotId) {
	if(_guiState.currentContent != "design") {
		_gui.showFragment("design");
	}
	_currentSlotId = slotId;
	if(slotId == -1) {
		_gui.getElement(".containerChild:not(.empty)").removeClass("invisible");
	} else {
		_gui.getElement(".containerChild").addClass("invisible");
		_gui.getElement("#slotRow" + slotId).removeClass("invisible");
	}
	hideMenu("slotMenu");
}

var _startX;
var _startY;

function saveCoords(event) {
	_startX = event.originalEvent.touches[0].pageX;
	_startY = event.originalEvent.touches[0].pageY;
}

function wasClick(event) {
	if(_guiState.clickEvent == "click") {
		return true;
	}
	
	var newStartX = event.originalEvent.changedTouches[0].pageX;
	var newStartY = event.originalEvent.changedTouches[0].pageY;
	return (Math.abs(newStartX - _startX) <= 5 && Math.abs(newStartY - _startY) <= 5);
}

