/**
 * Main entry point for the demo package
 * @example
 * import { greet, VERSION } from 'demo-package';
 * console.log(greet('World')); // "Hello, World!"
 */
export const VERSION = "1.0.0";
export function greet(name) {
	return `Hello, ${name}!`;
}
export function calculate_sum(a, b) {
	return a + b;
}
export function greet_with_options(name, options = {}) {
	const { prefix = "Hello", suffix = "!", uppercase = false } = options;
	const message = `${prefix}, ${name}${suffix}`;
	return uppercase ? message.toUpperCase() : message;
}
