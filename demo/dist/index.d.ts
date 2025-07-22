/**
 * Main entry point for the demo package
 * @example
 * import { greet, VERSION } from 'demo-package';
 * console.log(greet('World')); // "Hello, World!"
 */
export declare const VERSION = "1.0.0";
export declare function greet(name: string): string;
export declare function calculate_sum(a: number, b: number): number;
export type GreetingOptions = {
	prefix?: string;
	suffix?: string;
	uppercase?: boolean;
};
export declare function greet_with_options(
	name: string,
	options?: GreetingOptions,
): string;
