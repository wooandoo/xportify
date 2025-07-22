/**
 * Button component module
 * @example
 * import { create_button, ButtonProps } from 'demo-package/components/button';
 * const button = create_button({ text: 'Click me', variant: 'primary' });
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "success";
export type ButtonSize = "small" | "medium" | "large";
export type ButtonProps = {
	text: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	onClick?: () => void;
};
export declare function create_button(props: ButtonProps): HTMLButtonElement;
export declare function get_button_classes(props: ButtonProps): string;
export declare const BUTTON_VARIANTS: readonly ButtonVariant[];
export declare const BUTTON_SIZES: readonly ButtonSize[];
