/**
 * Button component module
 * @example
 * import { create_button, ButtonProps } from 'demo-package/components/button';
 * const button = create_button({ text: 'Click me', variant: 'primary' });
 */
export function create_button(props) {
	const button = document.createElement("button");
	button.textContent = props.text;
	button.className = get_button_classes(props);
	if (props.disabled) {
		button.disabled = true;
	}
	if (props.onClick) {
		button.addEventListener("click", props.onClick);
	}
	return button;
}
export function get_button_classes(props) {
	const classes = ["button"];
	if (props.variant) {
		classes.push(`button-${props.variant}`);
	}
	if (props.size) {
		classes.push(`button-${props.size}`);
	}
	if (props.disabled) {
		classes.push("button-disabled");
	}
	return classes.join(" ");
}
export const BUTTON_VARIANTS = ["primary", "secondary", "danger", "success"];
export const BUTTON_SIZES = ["small", "medium", "large"];
