<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { CONTACT_EMAIL, EXTERNAL } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* mailto: compose, ported as-is — a real form is Phase 8. */
	function composeEmail(e: SubmitEvent) {
		e.preventDefault();
		const data = new FormData(e.currentTarget as HTMLFormElement);
		const subject = encodeURIComponent(`[hhi-netherlands.com] ${data.get('subject') || 'Contact'}`);
		const body = encodeURIComponent(
			`Name: ${data.get('name') || '-'}\nEmail: ${data.get('email') || '-'}\n\n${data.get('message') || ''}`
		);
		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
	}
</script>

<svelte:head>
	<title>Contact | HHI Netherlands</title>
	<meta name="description" content="Get in touch with Hip Hop International Netherlands." />
</svelte:head>

<PageHero
	tag="Contact"
	titleTop="Say it"
	titleBottom="loud."
	treatment="accent"
	lede="Questions about registration, tickets, press or partnerships &mdash; send them our way."
/>

<main>
	<section class="section">
		<div class="contact-grid">
			<div>
				<p class="tag" {@attach reveal()}>Reach us</p>
				<div class="event__facts">
					<div class="event__fact" {@attach reveal()}>
						<dt>Organisation</dt>
						<dd>
							Hip Hop International Netherlands<small>Official Dutch license holder of HHI</small>
						</dd>
					</div>
					<div class="event__fact" {@attach reveal()}>
						<dt>Socials</dt>
						<dd>
							<small class="tight"
								><a href={EXTERNAL.instagram} target="_blank" rel="noopener" class="link--accent"
									>Instagram</a
								>
								&middot;
								<a href={EXTERNAL.facebook} target="_blank" rel="noopener" class="link--accent"
									>Facebook</a
								>
								&middot;
								<a href={EXTERNAL.youtube} target="_blank" rel="noopener" class="link--accent"
									>YouTube</a
								></small
							>
						</dd>
					</div>
					<div class="event__fact" {@attach reveal()}>
						<dt>Official</dt>
						<dd>
							<small class="tight"
								>Prefer the official form?
								<a href={EXTERNAL.contactForm} target="_blank" rel="noopener" class="link--accent"
									>hhi-netherlands.com/contact</a
								></small
							>
						</dd>
					</div>
				</div>
			</div>
			<form class="form" onsubmit={composeEmail} {@attach reveal()}>
				<label
					><span>Name</span><input type="text" name="name" required autocomplete="name" /></label
				>
				<label
					><span>E-mail</span><input
						type="email"
						name="email"
						required
						autocomplete="email"
					/></label
				>
				<label><span>Subject</span><input type="text" name="subject" required /></label>
				<label><span>Message</span><textarea name="message" required></textarea></label>
				<button class="btn btn--solid" {@attach magnetic()} type="submit">Send message</button>
				<p class="form__hint">Sending opens a ready-made email in your own mail app.</p>
			</form>
		</div>
	</section>
</main>
