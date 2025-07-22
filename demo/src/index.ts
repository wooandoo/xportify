/**
 * Main entry point for the demo package
 * @example
 * import { greet, VERSION } from 'demo-package';
 * console.log(greet('World')); // "Hello, World!"
 */

export const VERSION = "1.0.0";

export function greet(name: string): string {
	return `Hello, ${name}!`;
}

export function calculate_sum(a: number, b: number): number {
	return a + b;
}

export type GreetingOptions = {
	prefix?: string;
	suffix?: string;
	uppercase?: boolean;
};

export function greet_with_options(
	name: string,
	options: GreetingOptions = {},
): string {
	const { prefix = "Hello", suffix = "!", uppercase = false } = options;
	const message = `${prefix}, ${name}${suffix}`;
	return uppercase ? message.toUpperCase() : message;
}
