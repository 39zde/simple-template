"use strict";

/**
 * true if compatibility is ensured
 *
 * @returns boolean
 */
function checkBrowserCompatibility() {
	if (!ArrayBuffer.prototype.hasOwnProperty("resizable") || window.CompressionStream === undefined || !ArrayBuffer.prototype.hasOwnProperty("transferToFixedLength")) {
		return false;
	}
	return true;
}

/**
 * @param {HTMLElement} parent
 * @param {string} tagName
 * @returns {HTMLElement[] | null}
 */
function selectChildrenOf(parent, tagName) {
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
 * performs click on key "Enter" on any child input element, from the event target
 * performs focus change on key "Tab" to the next sibling  element
 * @param {KeyboardEvent} event
 */
function keyDownClicker(event) {
	event.preventDefault();
	if (event.key === "Enter" || event.key === " ") {
		const inputElement = selectChildrenOf(event.target, "INPUT");
		if (inputElement) {
			inputElement[0].click();
		} else {
			throw new Error(`Failed to find input-element`);
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
}

/**
 * chooses the next option of the select element or loops back to the start
 * @param {HTMLSelectElement} selectElement
 */
function cycler(selectElement) {
	let options = selectChildrenOf(selectElement, "OPTION");
	options = options.map((elem) => elem.value);
	if (options && options.includes(selectElement.value)) {
		let index = options.indexOf(selectElement.value);
		if (index + 1 === options.length) {
			index = 0;
		} else {
			index = index + 1;
		}
		selectElement.value = options[index];
	}
}

/**
 * chooses the next option of the select element or loops back to the start on key "Enter" on any child input element, from the event target
 * performs focus change on key "Tab" to the next sibling  element
 * @param {KeyboardEvent} event
 */
function keyDownCycler(event) {
	event.preventDefault();
	if (event.key === "Enter" || event.key === " ") {
		let selectElement = selectChildrenOf(event.target, "SELECT");
		if (selectElement) {
			cycler(selectElement[0]);
		} else {
			throw new Error(`Failed to find select-element`);
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
}

/**
 * handles keyboard shortcuts
 * @param {KeyboardEvent} event
 * @param [TEMPLATE]
 */
function handleKeyShortcuts(event /* [TEMPLATE] */) {
	switch (event.key) {
		// [TEMPLATE]
		default:
			return;
	}
}

/**
 * creates a file and downloads it
 * @param {ArrayBuffer} buf the data in from of an ARrayBuffer
 * @param {string} mimeType the mime type
 * @param {string} fileName file name without the extension - extension is derived from mime type
 * @returns {Error | null}
 */
function downloadFile(buf, mimeType, fileName) {
	try {
		//create a new link
		const link = document.createElement("a");
		// create the file
		link.href = URL.createObjectURL(new Blob([buf], { type: mimeType }));
		link.download = fileName + "." + mimeType.split("/")[1];
		// click the link / download the file
		link.click();
		// remove the file
		URL.revokeObjectURL(link.href);
		return null;
	} catch (e) {
		return new Error("No file was created from given data");
	}
}

/**f
 * displays a message to an HTMLOutputElement via innerText
 * @param {HTMLOutputElement} element
 * @param {"progress" | "success" | "error" | "hide"} type
 * @param {string | undefined} msg
 */
function displayMessage(element, type, msg) {
	if (type !== "hide" && msg) {
		element.setAttribute("aria-hidden", "false");
		element.setAttribute("class", type);
		switch (type) {
			case "error":
				element.innerText = "⚠️ " + msg;
				break;
			case "progress":
				element.innerText = "⏳ " + msg;
				break;
			case "success":
				element.innerText = "✅ " + msg;
				break;
			default:
				element.innerText = msg;
				break;
		}
	} else {
		element.setAttribute("aria-hidden", "true");
		element.removeAttribute("class");
		element.innerText = "";
	}
}

/**
 * get the SHA-256 Hash String from a given string
 * @param {string} data - the data to be hashed with SHA-256
 * @returns {Promise<string>} the hashed encoded in base64
 */
async function getHash(data) {
	let encoder = new TextEncoder();
	let hashed = await crypto.subtle.digest("SHA-256", encoder.encode(data).buffer);
	let binary = String.fromCharCode.apply(null, new Uint8Array(hashed));
	return btoa(binary);
}

/**
 * Saves the page as an HTML File, with inline style and script.
 * The hashes for the inline css and js are calculated and the CSP gets adjusted to allow only the inlined ones.
 */
async function saveHtmlFile() {
	const encoder = new TextEncoder();
	let html = document.children[0].outerHTML;
	let css;
	let js;
	// get styles and script
	let requests = await Promise.all([fetch(document.styleSheets[0].href, { method: "GET" }), fetch(document.scripts[0].src, { method: "GET" })]);

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
	css = css.replace(/(?<=\#save-html-notice[\s]{0,}\{\n[\s]{0,}display:[\s]{0,})inline/gm, "none");

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
	let cssHash = await getHash(css);
	html = html.replace("style-src 'self'", `style-src 'sha256-${cssHash}'`);
	// remove the script t and insert the inline script
	html = html.replace(document.querySelector("script").outerHTML, `\<script type="module"\>${js}\</script\>`);
	// set the CSP, to allow to execute this script.
	let jsHash = await getHash(js);
	html = html.replace("script-src 'self'", `script-src 'sha256-${jsHash}'`);
	// remove the base tag
	html = html.replace(document.querySelector("base").outerHTML, "");

	return downloadFile(encoder.encode("<!doctype html>\n" + html).buffer, "text/html", "simple-file-compressor");
}

/*




    [TEMPLATE]
    Space for functions



*/

/**
 *
 * @param [TEMPLATE]
 * @returns
 */
function main(/* [TEMPLATE] */) {
	const messageOutput = document.getElementById("notification");
	const htmlDownloadLink = document.getElementById("save-html");

	const isCompatible = checkBrowserCompatibility();
	if (!isCompatible) {
		return displayMessage(messageOutput, "error", "Update Your Browser. This tool needs the latest features to function properly.");
	}

	// add event listeners
	document.addEventListener("keydown", (event) => {
		handleKeyShortcuts(event /*[TEMPLATE] */);
	});

	messageOutput.addEventListener("click", () => {
		displayMessage(messageOutput, "hide");
	});

	htmlDownloadLink.addEventListener("click", () => {
		saveHtmlFile().then((result) => {
			if (result === null) {
				// when done display message
				displayMessage(messageOutput, "success", "Saved this page for offline use!");
			} else {
				// or error
				displayMessage(messageOutput, "error", result.message);
			}
		});
	});
}

// execute main, once the document has loaded
document.addEventListener("DOMContentLoaded", () => {
	main(/* [TEMPLATE] */);
});
