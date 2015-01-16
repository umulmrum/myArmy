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

function clickIsInElement(event, elementToCheckId) {
	var element = event.target;
	var found = false;
	while(!isUndefined(element)) {
		if(element.id == elementToCheckId) {
			found = true;
			break;
		}
		element = element.parentNode;
	}
	return found;
}

function closeIfClickedElsewhere(event) {
	if(!clickIsInElement(event, event.data.elementId)) {
		_gui.getElement("#" + event.data.elementId).css("display", "none");
	}
}

function createElement(tag, html, id, classes, attributes) {
	var element = jQuery(tag);
	if(html != null) {
		element.html(html);
	}
	if(id != null) {
		element.attr("id", id);
	}
	if(classes != null) {
		if($.isArray(classes)) {
			element.attr("class", classes.join(" "));
		} else {
			element.attr("class", classes);
		}
	}
	if(attributes != null) {
		for(var i in attributes) {
			element.attr(i, attributes[i]);
		}
	}
	
	return element;
}

function div(html, id, classes, attributes) {
	return createElement("<div></div>", html, id, classes, attributes);
}

function span(html, id, classes, attributes) {
	return createElement("<span></span>", html, id, classes, attributes);
}

function ol(html, id, classes, attributes) {
	return createElement("<ol></ol>", html, id, classes, attributes);
}

function ul(html, id, classes, attributes) {
	return createElement("<ul></ul>", html, id, classes, attributes);
}

function li(html, id, classes, attributes) {
	return createElement("<li></li>", html, id, classes, attributes);
}

function a(html, id, classes, attributes) {
	return createElement("<a></a>", html, id, classes, attributes);
}

function label(html, id, classes, attributes) {
	return createElement("<label></label>", html, id, classes, attributes);
}

function img(src, id, classes, attributes) {
	if(attributes == null) {
		attributes = {};
	}
	attributes["src"] = src;
	return createElement("<img></img>", null, id, classes, attributes);
}

function table(id, classes, attributes) {
	return createElement("<table></table>", null, id, classes, attributes);
}

function tr(id, classes, attributes) {
	return createElement("<tr></tr>", null, id, classes, attributes);
}

function td(html, id, classes, attributes) {
	return createElement("<td></td>", html, id, classes, attributes);
}

function button(text, id, classes, attributes) {
	var element = jQuery("<button></button>");
	element.append(text);
	if(id != null) {
		element.attr("id", id);
	}
	if(classes != null) {
		element.attr("class", classes);
	}
	if(attributes != null) {
		for(var i in attributes) {
			$(element).attr(i, attributes[i]);
		}
	}
	return element;
}

function select(id, classes, attributes) {
	return createElement("<select></select>", null, id, classes, attributes);
}

function option(html, value, selected, classes) {
	var element = jQuery("<option></option>");
	element.html(html);
	element.val(value);
	if(selected) {
		element.attr("selected", "selected");
	}
	if(classes != null) {
		element.attr("class", classes);
	}
	return element;
}

function checkbox(name, checked) {
	var element = $("<input>");
	element.attr("type", "checkbox");
	element.attr("name", name);
	if(checked) {
		element.attr("checked", "checked");
	}
	return element;
}


function getSlotHeadingText(slot) {
	var armyTexts = traverseDetachmentData(null, getSlotHeadingForArmy, {slotName: slot.slotName});
	var text = "";
	var isFirst = true;
	for(var i in armyTexts) {
		var armyText = armyTexts[i];
		if(armyText == null) {
			continue;
		}
		if(!isFirst) {
			text += " / ";
		}
		text += armyText;
		isFirst = false;
	}
	if(text == "") {
		text = _guiState.text[slot.slotName];
	}
	return text;
}

function getSlotHeadingForArmy(detachmentData, detachmentDataIndex, additionalParams) {
    var armyUnit = detachmentData.getArmyUnit("a0");
	if(!isUndefined(armyUnit.getText(additionalParams.slotName))) {
		return armyUnit.getText(additionalParams.slotName);
	} else {
		return null;
	}
}

function getChooserCountForArmy (armyUnit, armyUnitIndex, detachmentData, armyIndex, additionalParams) {
	// support multiple entities per slot by using fractions and round them up here
	return Math.ceil(armyUnit.getSelectionCost(additionalParams.slotId));
}

function getChooserCountForDetachment(detachmentData, slotId) {
	var count = 0;
	for(var i in detachmentData.getArmyUnits()) {
		count += detachmentData.getArmyUnit(i).getSelectionCost(slotId);
	}
	return Math.ceil(count);
}