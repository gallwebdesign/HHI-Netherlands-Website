/* Mobile menu open state, shared between Nav (the burger) and
   MobileMenu (the panel). The legacy script kept this in a closure
   variable and mutated classes by hand; here the components render
   from the state instead. */

class MenuState {
	open = $state(false);

	toggle() {
		this.open = !this.open;
	}

	close() {
		this.open = false;
	}
}

export const menu = new MenuState();
