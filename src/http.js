'use strict';

/**
 * These function are not required if the javascript environment has its own HTTP parser. Just make sure the request from the HTTP parser has the [structure]{@link HttpRequest} the WebSocket functions expect.
 * <br>
 * To parse an HTTP buffer, use [parseHttp]{@link module:http~parseHttp}.
 * <br>
 * To construct HTTP responses, use [makeHttpResponse]{@link module:http~makeHttpResponse}, [makeHttpHtmlResponse]{@link module:http~makeHttpHtmlResponse} or [makeHttpHeaderResponse]{@link module:http~makeHttpHeaderResponse}
 * @module http
 */

/**
 * It can be anything that is indexed containing integers, has a length property and is iterable.
 * @typedef {number[]} ArrayBuffer
 * @global
 */

/**
 * Converts a string to a buffer
 * @function stringToBuffer
 * @param {string} str The string to convert to a buffer
 * @returns {Uint8Array} The string converted to a buffer
 */
export function stringToBuffer(str) {
	const len = str.length;
	const buffer = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		buffer[i] = str.charCodeAt(i);
	}
	return buffer;
}

/**
 * The Request information for an HTTP request
 * All header keys must be lower case
 * @global
 * @typedef {Object} HttpRequest
 * @property {string} method The method for the HTTP request. Required to be {@linkcode GET} if upgrading to WebSocket
 * @property {number|string} httpVersion The version of the HTTP protocol used. Required to be {@linkcode 1.1} or higher if upgrading to WebSocket
 * @property {string} [headers.connection] The header defining the connection type. Required to be {@linkcode Upgrade} if upgrading to WebSocket
 * @property {string} [headers.upgrade] The header defining what protocol to upgrade to if connection is upgrade. Required to be {@linkcode websocket} if upgrading to WebSocket
 * @property {string} [headers.sec-websocket-version] The version of the WebSocket protocol to use. Required to be {@linkcode 13} if upgrading to WebSocket
 * @property {string} [headers.sec-websocket-key] The base64 encoded 16 bytes random key generated by the client
 */

/**
 * Parses an incomming HTTP request from a TCP socket
 * @function parseHttp
 * @param {ArrayBuffer} buffer The HTTP buffer received from the client
 * @returns {HttpRequest} The parsed HTTP request
 * @todo this assumes that the http request is contained within a single tcp packet
 * @todo add some error handling to make sure it is http protocol
 */
export function parseHttp(buffer) {
	// Splits up data on linebreaks
	const splitted = String.fromCharCode(...buffer).split('\r\n');

	// Gets data from status line
	const [ method, url, httpVersion ] = splitted.shift().split(' ');

	// Remove last empty line
	splitted.pop();

	// Converts header lines to key and value on object
	const headers = {};
	splitted.forEach((header) => {
		const index = header.indexOf(':');
		headers[header.slice(0, index).trim().toLowerCase()] = header.slice(index + 1).trim();
	});

	return {
		method: method.toUpperCase(),
		url: url.toLowerCase(),
		httpVersion: httpVersion.slice(5),
		headers
	}
}

/**
 * Makes sure HTTP request comes from same origin
 * @function isSameOrigin
 * @param {string} origin The current origin
 * @param {HttpRequest} req The HTTP request to ensure comes from same origin
 * @returns {boolean} If the request is from same origin
 */
export function isSameOrigin(origin, req) {
	return headers.origin === origin.toLowerCase();
}

/**
 * The HTTP reasons. Can be extended for HTTP codes that are not implemented
 * @name httpStatusCodes
 * @enum {string}
 */
export const httpStatusCodes = {
	200: "OK",
	400: "Bad Request",
	403: "Forbidden",
	404: "Not Found",
	426: "Upgrade Required"
}

/**
* Makes a simple HTTP response without a body and only required headers
* @function makeHttpResponse
* @param {number} code The HTTP status code to use
* @param {boolan} done Indicates if the HTTP response is complete or should be concatenatable
* @returns {string} The HTTP response
*/
export function makeHttpResponse(code, done) {
	return "HTTP/1.1 " + code + " " + httpStatusCodes[code] + "\r\n" +
		"Connection: close\r\n" +
		"Date: " + new Date() + "\r\n" +
		((done !== false) ? "\r\n" : "");
}

/**
 * Makes a simple HTTP response with HTML content
 * @function makeHttpHtmlResponse
 * @param {string} body The HTML content to make an HTTP response for
 * @param {number} [code=200] The HTTP status code to use
 * @returns {string} The HTTP response containing the body
 */
export function makeHttpHtmlResponse(body, code = 200) {
	return makeHttpResponse(code, false) +
		"Content-Type: text/html\r\n" +
		"Content-Length: " + body.length + "\r\n" +
		"\r\n" +
		body;
}

/**
 * Makes a simple HTTP response with customizable headers. A body can be concatenated onto the response if the correct headers are set manually
 * @function makeHttpHeaderResponse
 * @param {number} code The HTTP status code to use
 * @param {Object} headers The headers to insert into the HTTP response
 * @returns {string} The HTTP response containing the headers
 */
export function makeHttpHeaderResponse(code, headers) {
	return makeHttpResponse(code, false) +
		Object.entries(headers).map(([ key, value ]) => key + ': ' + value).join('\r\n') +
		"\r\n\r\n";
}
