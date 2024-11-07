"use strict";
/**
 * @module INDEX
 * @requires module:MAIN
 */
import { MainFunctions, main } from "./src/main";

/**
 * @class UtilityFunctions
 */
class UtilityFunctions {
	messageElement;
	shortcutDiv;
	shortcutToggle;

	/**
	 * @description creates a new UtilityFunctions Object
	 * @param {HTMLOutputElement} messageElement
	 */
	constructor(messageElement, shortcutDiv, shortcutToggle) {
		this.messageElement = messageElement;
		this.shortcutDiv = shortcutDiv;
		this.shortcutToggle = shortcutToggle;
	}

	/**
	 * @method
	 * @description check if compatibility is ensured
	 * @returns {boolean} true if compatible
	 */
	checkBrowserCompatibility() {
		if (
			!ArrayBuffer.prototype.hasOwnProperty("resizable") ||
			window.CompressionStream === undefined ||
			!ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")
		) {
			return false;
		}
		return true;
	}

	/**
	 * @private
	 * @method
	 * @description function to select the children of an element, by passing the
	 * Parent HTML Element(1) and the Child Tag-Name(2) as a parameter
	 * @param {HTMLElement} parent
	 * @param {string} tagName
	 * @returns {HTMLElement[] | null}
	 */
	#selectChildrenOf(parent, tagName) {
		let out = [];
		for (const child of parent.children) {
			if (child.tagName === tagName.toUpperCase()) {
				out.push(child);
			}
		}
		if (out.length !== 0) {
			return out;
		}
		return null;
	}

	/**
	 * @description performs click on key "Enter" on any child input element, from the event
	 * target performs focus change on key "Tab" to the next sibling element
	 * @param {KeyboardEvent} event - the event coming from a "keydown" event listener
	 * @returns {Error | null}
	 */
	keyDownClicker(event) {
		event.preventDefault();
		if (event.key === "Enter" || event.key === " ") {
			const inputElement = this.#selectChildrenOf(event.target, "INPUT");
			if (inputElement) {
				inputElement[0].click();
			} else {
				return new Error(`Failed to find input-element`);
			}
		} else if (event.key === "Tab") {
			if (event.shiftKey) {
				if (event.target.previousElementSibling !== null) {
					event.target.previousElementSibling.focus();
				}
			} else {
				if (event.target.nextElementSibling !== null) {
					event.target.nextElementSibling.focus();
				}
			}
		}
		return null;
	}

	/**
	 * @description chooses the next option of the select element or loops back to the start
	 * @param {HTMLSelectElement} selectElement - the "select" element to cycle
	 * @returns {null}
	 */
	cycler(selectElement) {
		let options;
		if (this === undefined) {
			options = Array.from(selectElement.querySelectorAll("OPTION"));
		} else {
			options = this.#selectChildrenOf(selectElement, "OPTION");
		}
		if (options) {
			options = options.map((elem) => elem.value);
		}
		if (options && options.includes(selectElement.value)) {
			let index = options.indexOf(selectElement.value);
			if (index + 1 === options.length) {
				index = 0;
			} else {
				index = index + 1;
			}
			selectElement.value = options[index];
		}
		return null;
	}

	/**
	 * @method
	 * @description chooses the next option of the select element or loops back to the start on key "Enter"
	 * on any child input element, from the event target performs focus change on key "Tab" to
	 * the next sibling  element
	 * @param {KeyboardEvent} event - The Keyboard Event
	 * @returns {Error | null}
	 */
	keyDownCycler(event) {
		event.preventDefault();
		if (event.key === "Enter" || event.key === " ") {
			let selectElement = this.#selectChildrenOf(event.target, "SELECT");
			if (selectElement) {
				this.cycler(selectElement[0]);
			} else {
				return new Error(`Failed to find select-element`);
			}
		} else if (event.key === "Tab") {
			if (event.shiftKey) {
				if (event.target.previousElementSibling !== null) {
					event.target.previousElementSibling.focus();
				}
			} else {
				if (event.target.nextElementSibling !== null) {
					event.target.nextElementSibling.focus();
				}
			}
		}
		return null;
	}

	/**
	 * @method
	 * @description shows or hides the sidebar, where the key shortcuts are displayed
	 */
	toggleKeyShortcuts() {
		// on toggle sidebar
		if (this.shortcutDiv.ariaHidden === "true") {
			this.shortcutDiv.ariaHidden = "false";
			this.shortcutDiv.parentElement.ariaExpanded = "true";
			this.shortcutToggle.ariaChecked = "false";
			this.shortcutToggle.checked = false;
		} else {
			this.shortcutDiv.ariaHidden = "true";
			this.shortcutDiv.parentElement.ariaExpanded = "false";
			this.shortcutToggle.ariaChecked = "true";
			this.shortcutToggle.checked = true;
		}
	}

	/**
	 * @async
	 * @description creates a file and downloads it
	 * @param {ArrayBuffer} buf the data in from of an ArrayBuffer
	 * @param {string} mimeType the mime type
	 * @param {string} fileName file name without the extension - extension is derived from mime type
	 * @returns {Promise<number>} - the file size in Bytes
	 * @throws {Error}
	 */
	async downloadFile(buf, mimeType, fileName) {
		try {
			const name = fileName + "." + mimeType.split("/")[1];
			if ("showOpenFilePicker" in self) {
				const newHandle = await window.showSaveFilePicker({ startIn: "downloads", suggestedName: name });
				const writableStream = await newHandle.createWritable();
				await writableStream.write(buf);
				await writableStream.close();
			} else {
				const url = URL.createObjectURL(new Blob([buf], { type: mimeType }));
				const link = document.createElement("a");
				//create a new link
				link.href = url;
				link.download = name;
				if (typeof link.download === "undefined") {
					// safari popup handling
					link.target = "_blank";
				}
				// click the link / download the file
				link.click();
				// remove the URL and link
				link.remove();
				URL.revokeObjectURL(url);
			}
			return buf.byteLength;
		} catch (e) {
			throw new Error("No file was created from given data");
		}
	}

	/**
	 * @async
	 * @description displays a message to an HTMLOutputElement via innerText
	 * @param {HTMLOutputElement} element - the output element
	 * @param {"progress" | "success" | "error" | "hide"} type - can determine the color
	 * @param {string | undefined} msg - the message to display
	 * @returns {Promise<void>}
	 */
	async displayMessage(type, msg) {
		if (type !== "hide" && msg) {
			this.messageElement.setAttribute("aria-hidden", "false");
			this.messageElement.setAttribute("class", type);
			switch (type) {
				case "error":
					this.messageElement.innerText = "⚠️ " + msg;
					break;
				case "progress":
					this.messageElement.innerText = "⏳ " + msg;
					break;
				case "success":
					this.messageElement.innerText = "✅ " + msg;
					break;
				default:
					this.messageElement.innerText = msg;
					break;
			}
		} else {
			this.messageElement.setAttribute("aria-hidden", "true");
			this.messageElement.removeAttribute("class");
			this.messageElement.innerText = "";
		}
	}

	/**
	 * @async
	 * @description get the SHA-256 Hash String from a given string
	 * @param {string} data - the data to be hashed with SHA-256
	 * @returns {Promise<string>} the hashed encoded in base64
	 */
	async getHash(data) {
		let encoder = new TextEncoder();
		let hashed = await crypto.subtle.digest("SHA-256", encoder.encode(data).buffer);
		let binary = String.fromCharCode.apply(null, new Uint8Array(hashed));
		return btoa(binary);
	}

	/**
	 * @async
	 * @description Saves the page as an HTML File, with inline style and script.
	 * The hashes for the inline css and js are calculated and the CSP gets adjusted to allow only the inlined ones.
	 * @returns {Promise<null>}
	 */
	async saveHtmlFile() {
		await this.displayMessage("hide");
		const encoder = new TextEncoder();
		let html = document.children[0].outerHTML;
		let css;
		let js;
		// get styles and script
		let requests = await Promise.all([fetch(document.styleSheets[0].href, { method: "GET" }), fetch(document.scripts[0].src, { method: "GET" })])
			.catch((e) => {
				throw new Error("Failed to fetch style/script to compose file");
			})
			.catch((error) => {
				throw new Error(error);
			});

		for await (let request of requests) {
			if (request.ok) {
				// store them in variables as text
				if (request.url.endsWith("css")) {
					css = await request.text();
				}
				if (request.url.endsWith("js")) {
					js = await request.text();
				}
			}
		}

		// don't show the html download option
		css = css.replace(/(?<=span\#save-html-notice[\s]{0,},[\n\s]{0,}tr\#save-html-shortcut[\n\s]{0,}{[\n\s]{0,}display:[\s]{0,})auto/gm, "none");

		for (let link of document.querySelectorAll("link")) {
			if (link.rel !== "stylesheet") {
				// remove any link, which is not the stylesheet one
				html = html.replace(link.outerHTML, "");
			} else {
				// remove the link to stylesheet and insert inline style
				html = html.replace(link.outerHTML, `\<style\>${css}\</style\>`);
			}
		}
		// set the CSP, to allow to use this style
		let cssHash = await this.getHash(css);
		html = html.replace("style-src 'self'", `style-src 'sha256-${cssHash}'`);
		// remove the script t and insert the inline script
		html = html.replace(document.querySelector("script").outerHTML, `\<script type="module"\>${js}\</script\>`);
		// set the CSP, to allow to execute this script.
		let jsHash = await this.getHash(js);
		html = html.replace("script-src 'self'", `script-src 'sha256-${jsHash}'`);
		// remove the base tag
		let baseTag = document.querySelector("base");
		if (baseTag) {
			html = html.replace(baseTag.outerHTML, "");
		}

		return this.downloadFile(encoder.encode("<!doctype html>\n" + html).buffer, "text/html", "simple-file-compressor");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	// default features
	// get elements
	const messageOutput = document.getElementById("notification");
	const htmlDownloadLink = document.getElementById("save-html");
	const shortcutDiv = document.getElementById("shortcuts");
	const shortcutToggle = document.getElementById("toggle-shortcuts");
	// create util
	const util = new UtilityFunctions(messageOutput, shortcutDiv, shortcutToggle);
	// add event listeners
	messageOutput.addEventListener("click", () => {
		util.displayMessage("hide");
	});

	const saveForOfflineUse = () =>
		util.saveHtmlFile().then(() => {
			// when done display message
			util.displayMessage("success", "Saved this page for offline use!");
		});

	htmlDownloadLink.addEventListener("click", () => {
		saveForOfflineUse();
	});

	shortcutToggle.addEventListener("input", (event) => {
		event.preventDefault();
		util.toggleKeyShortcuts();
	});

	document.addEventListener("keydown", (event) => {
		console.log(event);
		if (event.key == "ArrowRight" || event.key == "ArrowLeft") {
			util.toggleKeyShortcuts();
		} else if (event.key.toLowerCase() === "s" && event.composed && (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			saveForOfflineUse();
		}
	});

	// project specific code
	const elementIDs = {
		// [TEMPLATE]
	};
	const funcs = new MainFunctions();
	main(elementIDs, util, funcs);
});

/**
 * @file index.js
 * @author 39zde <git@39zde>
 * @license MIT
 * MIT License
 *
 * Copyright (c) 2024 39zde
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
