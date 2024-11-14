"use strict";
/**
 * @class MainFunctions
 */
export class MainFunctions {
	constructor() {}
	/**
	 * @method
	 * @description check if compatibility is ensured
	 * @returns {boolean} true if compatible
	 */
	checkBrowserCompatibility() {
		// add more [Template] conditions as needed
		if (!ArrayBuffer.prototype.hasOwnProperty("resizable") || !ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")) {
			return false;
		}
		return true;
	}

	/**
	 * @method
	 * @description handle app specific key shortcuts
	 */
	handleKeyShortcuts() {}

	// [TEMPLATE]
	// App specific functions
}

/**
 * @param {Object} ids The elementIDs, which need to be accessed
 * @param {string} ids.[TEMPLATE] insert wanted properties here
 * ...
 * @param {UtilityFunctions} util
 * @param {MainFunctions} funcs
 * @returns
 **/
export function main(ids, util, funcs) {
	// [TEMPLATE]
	// App specific logic
	return;
}
