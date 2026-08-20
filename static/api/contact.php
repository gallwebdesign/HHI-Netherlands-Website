<?php
/* ============================================================
   HHI NETHERLANDS — contact form endpoint
   Phase 8 of the SvelteKit migration: the /contact form stopped
   being a mailto: compose and became a real submission.

   HOW THIS GETS DEPLOYED
   This file lives in static/, so Vite copies it verbatim into
   build/api/contact.php and the existing FTP action pushes it to
   /httpdocs/api/contact.php. There is no workflow step for it and
   nothing in the JS build touches it — the rest of the site is
   prerendered HTML, and this is the one thing on the host that
   runs. Do not add PHP anywhere else without a reason: a static
   site with exactly one dynamic endpoint has exactly one thing to
   audit.

   ⚠️ THE MAILBOX MUST EXIST. As of 20 Aug 2026 info@hhi-netherlands.com
   had not been created on Cloud86. Until it is, mail() here will
   accept the submission and deliver nothing. Create the mailbox in
   the Cloud86 panel, then send yourself a test through the live form
   before trusting this page with anything that matters.

   THREAT MODEL — what this defends against, in order of how often
   it actually happens to a small marketing site:
     1. Drive-by bots that POST every form they can find.  → honeypot
     2. Scripted floods aimed at one endpoint.             → rate limit
     3. Mail-header injection to turn the form into an     → CRLF strip
        open relay. This is the only one that is a real
        security bug rather than a nuisance, and it is why
        newlines are rejected rather than sanitised.
     4. Hand-written spam from a person.                   → heuristics
        (partial — nothing stops a determined human, which
        is the correct expectation to have.)
   ============================================================ */

declare(strict_types=1);

/* ------------------------------------------------------------
   CONFIGURATION
   ------------------------------------------------------------ */

/** Where submissions go. The one address this whole file exists to reach. */
const MAIL_TO = 'info@hhi-netherlands.com';

/** Envelope sender. MUST be a real address on this domain, or SPF fails and
 *  the mail is junked — this is why it is not the submitter's address. The
 *  submitter goes in Reply-To instead, so hitting reply still works. */
const MAIL_FROM = 'website@hhi-netherlands.com';

/** Origins allowed to POST here. The site is served from one domain; a
 *  request claiming to come from anywhere else is not our form. */
const ALLOWED_ORIGINS = ['https://hhi-netherlands.com', 'https://www.hhi-netherlands.com'];

/** Rate limits, per IP. Deliberately generous for a human — three messages
 *  in a quarter of an hour is already an unusual visitor — and tight enough
 *  that a bot cannot fill the inbox before someone notices. */
const RATE_SHORT_MAX = 3;
const RATE_SHORT_WINDOW = 900;    // 15 minutes
const RATE_LONG_MAX = 10;
const RATE_LONG_WINDOW = 86400;   // 24 hours

/** Timing trap bounds. Under MIN_FILL_SECONDS is a script, not a person
 *  typing four fields. Over MAX_FORM_AGE the token is stale — a tab left
 *  open for a day, or a replayed capture. */
const MIN_FILL_SECONDS = 3;
const MAX_FORM_AGE = 21600;       // 6 hours

/** Field bounds. Enforced here regardless of what the browser did. */
const LIMITS = [
    'name'    => ['min' => 2,  'max' => 80],
    'subject' => ['min' => 3,  'max' => 120],
    'message' => ['min' => 10, 'max' => 4000],
    'email'   => ['min' => 6,  'max' => 254],   // 254 = RFC 5321 maximum
];

/* Optional SMTP credentials, kept OUT of git.
   -----------------------------------------------------------------
   mail() is what ships, because it needs no secret and delivers fine
   for same-server, same-domain mail on Dutch shared hosting. If mail
   starts landing in spam, authenticated SMTP is the upgrade: create
   /httpdocs/api/contact.secret.php on the server by hand, returning

     <?php return ['host' => 'smtp.cloud86.io', 'port' => 587,
                   'user' => 'info@hhi-netherlands.com', 'pass' => '…'];

   and this file picks it up automatically. It is gitignored, and the
   FTP deploy is configured to exclude it, so neither a commit nor a
   deploy can leak or erase it. Nothing else needs to change. */
$smtp = null;
if (is_readable(__DIR__ . '/contact.secret.php')) {
    /** @var array{host:string,port:int,user:string,pass:string}|null $smtp */
    $smtp = require __DIR__ . '/contact.secret.php';
}

/* ------------------------------------------------------------
   RESPONSE HELPERS
   ------------------------------------------------------------ */

/**
 * Answer as JSON and stop.
 *
 * Every rejection returns a deliberately vague message. Telling a bot
 * which check it failed is telling it what to fix; the client only ever
 * needs to know whether to show a field error or a general one.
 *
 * @param array<string,mixed> $payload
 */
function respond(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    /* No caching layer should ever hold an answer to a POST. */
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** A rejection that looks identical whatever tripped it. */
function reject(int $status, string $message, array $fields = []): never
{
    respond($status, ['ok' => false, 'message' => $message, 'fields' => (object) $fields]);
}

/** Silent success. Used where telling the truth would train a bot. */
function pretendSuccess(): never
{
    respond(200, ['ok' => true, 'message' => 'Message sent.']);
}

/* ------------------------------------------------------------
   LAYER 1 — transport: method, content type, origin
   ------------------------------------------------------------ */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reject(405, 'This endpoint only accepts form submissions.');
}

/* The form posts JSON via fetch(). A urlencoded POST is not our form —
   it is a bot replaying a generic payload, or a cross-site form that a
   browser would have let through without a preflight. */
$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    reject(415, 'Unsupported content type.');
}

/* Same-origin check. Origin is set by the browser on every cross-origin
   POST and cannot be spoofed by page JavaScript, which makes it worth
   checking even though curl can send anything — it is free, and it stops
   the entire class of "someone else's page posts to your endpoint".

   Falls back to Referer, and accepts a request carrying neither: some
   privacy tooling strips both, and rejecting those would silently break
   the form for real visitors. The layers below are what actually carry
   the weight. */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === '' && !empty($_SERVER['HTTP_REFERER'])) {
    $parts = parse_url($_SERVER['HTTP_REFERER']);
    if (isset($parts['scheme'], $parts['host'])) {
        $origin = $parts['scheme'] . '://' . $parts['host'];
    }
}
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    /* Allow localhost during development, never in production. */
    $isLocal = (bool) preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin);
    if (!$isLocal) {
        reject(403, 'Request rejected.');
    }
}

/* Cap the body before parsing it. Nothing legitimate comes near this. */
$raw = file_get_contents('php://input', false, null, 0, 64 * 1024);
if ($raw === false || $raw === '') {
    reject(400, 'Empty request.');
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    reject(400, 'Malformed request.');
}

/** Read a field as a trimmed string, whatever the client sent. */
function field(array $data, string $key): string
{
    $value = $data[$key] ?? '';
    return is_scalar($value) ? trim((string) $value) : '';
}

/* ------------------------------------------------------------
   LAYER 2 — honeypot and timing
   Both answer with a *success* response. A bot told "rejected"
   retries with a variation; a bot told "sent" goes away, and the
   inbox stays empty either way.
   ------------------------------------------------------------ */

/* The honeypot field is named `company` because that is a name form-filling
   bots recognise and complete. It is hidden in CSS and removed from the
   accessibility tree, so no real visitor — sighted, screen-reader, or
   keyboard-only — is ever offered it. If it has content, a machine typed it. */
if (field($data, 'company') !== '') {
    pretendSuccess();
}

/* Timing. The client posts back the timestamp it recorded on page load.
   It is not signed — a determined bot can forge it — and it does not need
   to be: this exists to catch the overwhelming majority that submit
   instantly without reading the form at all. */
$loadedAt = (int) (is_numeric($data['loadedAt'] ?? null) ? $data['loadedAt'] : 0);
$elapsed = time() - (int) ($loadedAt / 1000);
if ($loadedAt <= 0 || $elapsed < MIN_FILL_SECONDS || $elapsed > MAX_FORM_AGE) {
    pretendSuccess();
}

/* ------------------------------------------------------------
   LAYER 3 — rate limiting, per IP
   File-based on purpose: shared hosting has no Redis, and a cron to
   prune this is one more thing to forget. Each IP hashes to one small
   file that rewrites itself on every hit, so the directory grows with
   distinct visitors and each file stays a few dozen bytes.
   ------------------------------------------------------------ */

/**
 * The client address, taking the first hop of X-Forwarded-For when the
 * host proxies. Spoofable in principle — which only matters for a rate
 * limit, where the failure is a bot getting a few more attempts, not a
 * bypass of anything that protects the inbox from content.
 */
function clientIp(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $first = trim(explode(',', $forwarded)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Record this attempt and report whether the caller is over either limit.
 *
 * The IP is hashed, never stored in the clear: this file is a log of who
 * contacted the championship, and the privacy policy at /privacy does not
 * promise to keep one. The hash is enough to count with and useless as a
 * record.
 */
function overRateLimit(string $ip): bool
{
    $dir = sys_get_temp_dir() . '/hhi-contact-rate';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        /* If the counter cannot be written, let the message through rather
           than blocking a real visitor. Every other layer still applies. */
        return false;
    }

    $file = $dir . '/' . hash('sha256', $ip . '|hhi-contact') . '.json';
    $now = time();

    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }

    /* Locked read-modify-write: two simultaneous posts must not each read
       the old count and write back the same number. */
    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        return false;
    }

    $contents = stream_get_contents($handle);
    $hits = is_string($contents) && $contents !== '' ? json_decode($contents, true) : [];
    if (!is_array($hits)) {
        $hits = [];
    }

    /* Drop anything past the long window; that also prunes the file. */
    $hits = array_values(array_filter(
        $hits,
        static fn($t): bool => is_int($t) && $t > $now - RATE_LONG_WINDOW
    ));

    $short = count(array_filter($hits, static fn(int $t): bool => $t > $now - RATE_SHORT_WINDOW));
    $over = $short >= RATE_SHORT_MAX || count($hits) >= RATE_LONG_MAX;

    /* Record the attempt even when it is refused, so hammering the endpoint
       keeps the window rolling forward rather than resetting it. */
    $hits[] = $now;

    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($hits));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return $over;
}

if (overRateLimit(clientIp())) {
    /* Honest here, unlike the honeypot: this one can hit a real person —
       someone who sent a message and immediately thought of something to
       add — and they deserve to know why nothing happened. */
    reject(429, 'Too many messages from this connection. Please try again a little later.');
}

/* ------------------------------------------------------------
   LAYER 4 — field validation
   Everything the browser checked, checked again. The client cannot be
   trusted at all: `required` and type="email" are a convenience for
   visitors, never a control.
   ------------------------------------------------------------ */

$name    = field($data, 'name');
$email   = field($data, 'email');
$subject = field($data, 'subject');
$message = field($data, 'message');

/** @var array<string,string> $errors keyed by field name, for inline display */
$errors = [];

/** Count characters, not bytes — "José" is four characters, five bytes. */
function len(string $value): int
{
    return mb_strlen($value, 'UTF-8');
}

/* Reject invalid UTF-8 outright. It cannot be displayed, cannot be safely
   put in a mail header, and no real form produces it. */
foreach (['name' => $name, 'email' => $email, 'subject' => $subject, 'message' => $message] as $key => $value) {
    if (!mb_check_encoding($value, 'UTF-8')) {
        reject(400, 'Malformed request.');
    }
}

if ($name === '') {
    $errors['name'] = 'Please tell us your name.';
} elseif (len($name) < LIMITS['name']['min'] || len($name) > LIMITS['name']['max']) {
    $errors['name'] = 'Please use between 2 and 80 characters.';
}

if ($email === '') {
    $errors['email'] = 'Please give us an e-mail address to reply to.';
} elseif (len($email) > LIMITS['email']['max'] || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'That does not look like an e-mail address.';
}

if ($subject === '') {
    $errors['subject'] = 'Please add a subject.';
} elseif (len($subject) < LIMITS['subject']['min'] || len($subject) > LIMITS['subject']['max']) {
    $errors['subject'] = 'Please use between 3 and 120 characters.';
}

if ($message === '') {
    $errors['message'] = 'Please write us a message.';
} elseif (len($message) < LIMITS['message']['min']) {
    $errors['message'] = 'Please write a little more — at least 10 characters.';
} elseif (len($message) > LIMITS['message']['max']) {
    $errors['message'] = 'That is longer than 4000 characters. Please shorten it.';
}

if ($errors !== []) {
    reject(422, 'Please check the fields marked below.', $errors);
}

/* ------------------------------------------------------------
   LAYER 5 — mail-header injection
   THE ONE REAL SECURITY BUG IN A NAIVE PHP CONTACT FORM. A newline in a
   value that reaches a header lets an attacker append headers of their
   own — Bcc: a thousand strangers — and turns this form into an open
   relay that gets the domain blacklisted.

   Rejected, not stripped. A name containing a CRLF is not a name that
   needed cleaning; it is an attack, and quietly repairing it into a
   delivered mail hides that it happened.
   ------------------------------------------------------------ */

foreach (['name' => $name, 'email' => $email, 'subject' => $subject] as $key => $value) {
    if (preg_match('/[\r\n]/', $value) || preg_match('/%0[ad]/i', $value)) {
        reject(400, 'Request rejected.');
    }
    /* Bare header names appearing in a header value are the same attack
       wearing a different encoding. */
    if (preg_match('/\b(bcc|cc|content-type|mime-version|to)\s*:/i', $value)) {
        reject(400, 'Request rejected.');
    }
}

/* ------------------------------------------------------------
   LAYER 6 — content heuristics
   The last layer, and the weakest by design. Nothing here stops a person
   who writes spam by hand, and it should not try: a false positive here
   silently discards a real message from a real crew, which is a worse
   outcome than a spam mail someone deletes in two seconds.
   ------------------------------------------------------------ */

/* Link count. A genuine enquiry about registration or press occasionally
   carries one or two links — an Instagram profile, a crew video. Four is
   a payload. */
$linkCount = preg_match_all('#https?://|www\.#i', $message);
if ($linkCount >= 4) {
    pretendSuccess();
}

/* A message that is mostly links, whatever the count. */
if ($linkCount >= 2 && len($message) < 120) {
    pretendSuccess();
}

/* BBCode and raw HTML anchors never appear in a message typed into a
   plain textarea by a person. They appear constantly in bot payloads. */
if (preg_match('/\[url[=\]]|<a\s+href/i', $message)) {
    pretendSuccess();
}

/* A subject line that is a URL. */
if (preg_match('#https?://#i', $subject)) {
    pretendSuccess();
}

/* ------------------------------------------------------------
   SEND
   ------------------------------------------------------------ */

/**
 * Encode a UTF-8 string for use in a mail header (RFC 2047).
 *
 * Without this a name like "José" arrives mangled, because a mail header
 * is ASCII. Applied only after the CRLF check above, never instead of it —
 * encoding is presentation, not a security control.
 */
function headerSafe(string $value): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $value)) {
        return $value;
    }
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

$mailSubject = headerSafe(sprintf('[hhi-netherlands.com] %s', $subject));

/* Plain text. The inbox that reads this wants to answer it, not admire it. */
$body = implode("\r\n", [
    'New message from the hhi-netherlands.com contact form.',
    '',
    'Name:    ' . $name,
    'E-mail:  ' . $email,
    'Subject: ' . $subject,
    '',
    '--- Message ---',
    '',
    $message,
    '',
    '---',
    'Sent ' . gmdate('D, d M Y H:i:s') . ' UTC',
    'Reply directly to this mail to answer ' . $name . '.',
]);

$headers = [
    'From: HHI Netherlands website <' . MAIL_FROM . '>',
    'Reply-To: ' . headerSafe($name) . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
    'X-Mailer: hhi-netherlands-contact',
    /* Marks this as generated, so autoresponders do not answer it. */
    'Auto-Submitted: auto-generated',
];

$sent = false;

if (is_array($smtp) && isset($smtp['host'], $smtp['port'], $smtp['user'], $smtp['pass'])) {
    /* Authenticated SMTP. Only runs if contact.secret.php exists on the
       server; see the configuration note at the top. Written by hand rather
       than pulling in PHPMailer, because a Composer dependency on a static
       site's single endpoint is a maintenance burden out of proportion to
       one AUTH LOGIN exchange. */
    $sent = sendViaSmtp($smtp, MAIL_TO, $mailSubject, $body, $headers);
} else {
    /* -f sets the envelope sender, which is what SPF is checked against.
       Without it the host's default is used and deliverability suffers. */
    $sent = mail(MAIL_TO, $mailSubject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);
}

if (!$sent) {
    /* Log for the operator, stay vague to the visitor. The visitor cannot
       act on "SMTP refused AUTH"; they can act on "try again or mail us". */
    error_log('[hhi-contact] delivery failed for ' . $email);
    reject(502, 'We could not send your message just now. Please try again shortly.');
}

respond(200, ['ok' => true, 'message' => 'Message sent.']);

/* ------------------------------------------------------------
   SMTP
   ------------------------------------------------------------ */

/**
 * Minimal authenticated SMTP over STARTTLS.
 *
 * Deliberately small: connect, EHLO, STARTTLS, AUTH LOGIN, envelope, DATA.
 * No attachments, no HTML, no queue — this sends one plain-text mail to one
 * fixed address, and anything more belongs in a library rather than here.
 *
 * @param array{host:string,port:int,user:string,pass:string} $config
 * @param list<string> $headers
 */
function sendViaSmtp(array $config, string $to, string $subject, string $body, array $headers): bool
{
    $socket = @stream_socket_client(
        sprintf('tcp://%s:%d', $config['host'], (int) $config['port']),
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT
    );
    if (!$socket) {
        error_log(sprintf('[hhi-contact] SMTP connect failed: %s (%d)', $errstr, $errno));
        return false;
    }
    stream_set_timeout($socket, 15);

    /** Read a full multi-line reply and return its status code. */
    $read = static function () use ($socket): int {
        $code = 0;
        while (($line = fgets($socket, 1024)) !== false) {
            $code = (int) substr($line, 0, 3);
            /* A space in the fourth column marks the final line; a hyphen
               means more follow. Returning early on a hyphen desynchronises
               every later command. */
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $code;
    };

    /** Send one command and assert its reply code. */
    $send = static function (string $line, int $expected) use ($socket, $read): bool {
        fwrite($socket, $line . "\r\n");
        $code = $read();
        if ($code !== $expected) {
            error_log(sprintf('[hhi-contact] SMTP expected %d, got %d', $expected, $code));
            return false;
        }
        return true;
    };

    $ok = $read() === 220
        && $send('EHLO hhi-netherlands.com', 250)
        && $send('STARTTLS', 220);

    if ($ok) {
        $ok = (bool) stream_socket_enable_crypto(
            $socket,
            true,
            STREAM_CRYPTO_METHOD_TLS_CLIENT
        );
        if (!$ok) {
            error_log('[hhi-contact] SMTP STARTTLS negotiation failed');
        }
    }

    /* EHLO again: the server's capability list is renegotiated after TLS,
       and AUTH is usually only advertised on the encrypted side. */
    $ok = $ok
        && $send('EHLO hhi-netherlands.com', 250)
        && $send('AUTH LOGIN', 334)
        && $send(base64_encode($config['user']), 334)
        && $send(base64_encode($config['pass']), 235)
        && $send('MAIL FROM:<' . MAIL_FROM . '>', 250)
        && $send('RCPT TO:<' . $to . '>', 250)
        && $send('DATA', 354);

    if ($ok) {
        /* Dot-stuffing: a line consisting of a single dot ends DATA, so any
           such line in the body must be doubled or the mail is truncated
           there and the remainder is interpreted as SMTP commands. */
        $stuffed = preg_replace('/^\./m', '..', $body);

        $payload = implode("\r\n", [
            'Date: ' . date('r'),
            'To: <' . $to . '>',
            'Subject: ' . $subject,
            ...$headers,
            '',
            $stuffed,
        ]);

        fwrite($socket, $payload . "\r\n.\r\n");
        $ok = $read() === 250;
    }

    $send('QUIT', 221);
    fclose($socket);

    return $ok;
}
