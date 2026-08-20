<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { base } from '$app/paths';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* Phase 8: this was a mailto: compose that handed the visitor's own mail
	   app a pre-filled draft. It now posts to a PHP endpoint on Cloud86
	   (static/api/contact.php) which validates, filters spam and mails
	   info@hhi-netherlands.com.

	   ⚠️ Everything here is a convenience for the visitor, never a control.
	   The endpoint re-checks every field, and the honeypot and timing values
	   below are trivially forgeable — they exist to catch the bots that do not
	   look, which is most of them. Do not add a check here and remove it there. */

	/* Mirrors LIMITS in contact.php. Kept in sync by hand: there is no shared
	   module across a static build and a PHP file, and inventing one for four
	   numbers would be worse than this comment. If you change a bound, change
	   it in both places — the endpoint is what actually enforces it. */
	const LIMITS = {
		name: { min: 2, max: 80 },
		subject: { min: 3, max: 120 },
		message: { min: 10, max: 4000 }
	} as const;

	type Status = 'idle' | 'sending' | 'sent' | 'error';

	let status = $state<Status>('idle');
	let formError = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	/* The timing trap's other half. Recorded when the component initialises,
	   posted back on submit; the endpoint rejects anything submitted within
	   three seconds of it. */
	const loadedAt = Date.now();

	const remaining = $derived(LIMITS.message.max);

	async function submitForm(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'sending') return;

		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);

		status = 'sending';
		formError = '';
		fieldErrors = {};

		try {
			/* base is '' on the real host and '/HHI-Netherlands-Website' on the
			   Pages preview, where no PHP runs at all — the preview will always
			   fail here, and that is correct rather than something to paper over. */
			const response = await fetch(`${base}/api/contact.php`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: data.get('name'),
					email: data.get('email'),
					subject: data.get('subject'),
					message: data.get('message'),
					company: data.get('company'), // honeypot — must stay empty
					loadedAt
				})
			});

			const result = await response.json().catch(() => null);

			if (response.ok && result?.ok) {
				status = 'sent';
				form.reset();
				return;
			}

			status = 'error';
			fieldErrors = (result?.fields as Record<string, string>) ?? {};
			formError =
				typeof result?.message === 'string'
					? result.message
					: 'Something went wrong sending your message. Please try again.';
		} catch {
			/* Offline, DNS failure, or the endpoint is not deployed. */
			status = 'error';
			formError = 'We could not reach the server. Please check your connection and try again.';
		}
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
					<!-- The Socials and E-mail facts were removed on 20 Aug 2026, when
					     the form became a real submission. The socials are carried by
					     the footer on every page, and the address is no longer printed
					     anywhere in the markup on purpose: a mailto: in the HTML is
					     harvested by the same crawlers this endpoint exists to defend
					     against. The privacy policy sends people here to exercise their
					     data rights, and the form is now that route. -->
				</div>
			</div>

			{#if status === 'sent'}
				<div class="form-sent" {@attach reveal()}>
					<p class="tag">Message sent</p>
					<h2>We got it.</h2>
					<p>
						Thanks for reaching out &mdash; we read everything that lands here and come back to you
						as soon as we can.
					</p>
					<button
						class="btn btn--ghost"
						type="button"
						{@attach magnetic()}
						onclick={() => (status = 'idle')}
					>
						Send another
					</button>
				</div>
			{:else}
				<form class="form" onsubmit={submitForm} novalidate {@attach reveal()}>
					<label>
						<span>Name</span>
						<input
							type="text"
							name="name"
							required
							autocomplete="name"
							minlength={LIMITS.name.min}
							maxlength={LIMITS.name.max}
							aria-invalid={fieldErrors.name ? 'true' : undefined}
						/>
						{#if fieldErrors.name}<em class="form__error">{fieldErrors.name}</em>{/if}
					</label>

					<label>
						<span>E-mail</span>
						<input
							type="email"
							name="email"
							required
							autocomplete="email"
							aria-invalid={fieldErrors.email ? 'true' : undefined}
						/>
						{#if fieldErrors.email}<em class="form__error">{fieldErrors.email}</em>{/if}
					</label>

					<label>
						<span>Subject</span>
						<input
							type="text"
							name="subject"
							required
							minlength={LIMITS.subject.min}
							maxlength={LIMITS.subject.max}
							aria-invalid={fieldErrors.subject ? 'true' : undefined}
						/>
						{#if fieldErrors.subject}<em class="form__error">{fieldErrors.subject}</em>{/if}
					</label>

					<label>
						<span>Message</span>
						<textarea
							name="message"
							required
							minlength={LIMITS.message.min}
							maxlength={remaining}
							aria-invalid={fieldErrors.message ? 'true' : undefined}></textarea>
						{#if fieldErrors.message}<em class="form__error">{fieldErrors.message}</em>{/if}
					</label>

					<!-- Honeypot. Hidden in CSS and removed from the accessibility tree,
					     so it is never offered to a sighted, screen-reader or keyboard
					     visitor; a bot that fills every input fills this one and the
					     endpoint drops the submission. Named `company` because that is
					     a name form-fillers recognise. Do not add a label, do not
					     rename it without renaming it in contact.php. -->
					<div class="form__hp" aria-hidden="true">
						<input
							type="text"
							name="company"
							tabindex="-1"
							autocomplete="off"
							value=""
							title="Leave this field empty"
						/>
					</div>

					{#if formError}
						<p class="form__error form__error--block" role="alert">{formError}</p>
					{/if}

					<button
						class="btn btn--solid"
						{@attach magnetic()}
						type="submit"
						disabled={status === 'sending'}
					>
						{status === 'sending' ? 'Sending…' : 'Send message'}
					</button>

					<p class="form__hint">
						We reply by e-mail. Your details go to the championship office and nowhere else &mdash;
						see our <a href="{base}/privacy" class="link--accent">privacy policy</a>.
					</p>
				</form>
			{/if}
		</div>
	</section>
</main>
