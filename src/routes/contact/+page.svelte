<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { EXTERNAL } from '$lib/config';
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
				<p class="tag" data-reveal>Reach us</p>
				<div class="event__facts">
					<div class="event__fact" data-reveal>
						<dt>Organisation</dt>
						<dd>
							Hip Hop International Netherlands<small>Official Dutch license holder of HHI</small>
						</dd>
					</div>
					<div class="event__fact" data-reveal>
						<dt>Socials</dt>
						<dd>
							<small style="margin-top:0;"
								><a
									href={EXTERNAL.instagram}
									target="_blank"
									rel="noopener"
									style="color:var(--oranje)">Instagram</a
								>
								&middot;
								<a
									href={EXTERNAL.facebook}
									target="_blank"
									rel="noopener"
									style="color:var(--oranje)">Facebook</a
								>
								&middot;
								<a
									href={EXTERNAL.youtube}
									target="_blank"
									rel="noopener"
									style="color:var(--oranje)">YouTube</a
								></small
							>
						</dd>
					</div>
					<div class="event__fact" data-reveal>
						<dt>Official</dt>
						<dd>
							<small style="margin-top:0;"
								>Prefer the official form?
								<a
									href={EXTERNAL.contactForm}
									target="_blank"
									rel="noopener"
									style="color:var(--oranje)">hhi-netherlands.com/contact</a
								></small
							>
						</dd>
					</div>
				</div>
			</div>
			<form class="form" id="contactForm" data-reveal>
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
				<button class="btn btn--solid" data-magnetic type="submit">Send message</button>
				<p class="form__hint">Sending opens a ready-made email in your own mail app.</p>
			</form>
		</div>
	</section>
</main>
