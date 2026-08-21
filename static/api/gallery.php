<?php

declare(strict_types=1);

/* ============================================================
   HHI NETHERLANDS — 2026 gallery manifest endpoint

   WHY THIS EXISTS
   The gallery used to be baked at build time by the
   hhi-gallery-manifest plugin in vite.config.ts, which walks
   static/img/gallery/2026/ on the machine running the build.
   That worked on Iain's laptop and produced an EMPTY gallery in
   production, for a reason that is structural rather than a bug:

     - the ~951 photos are deliberately NOT in the repo
       (.gitignore excludes every image under static/img/gallery)
     - so a GitHub Actions checkout has the folder tree and no
       photos, and the build bakes an empty list
     - the build SUCCEEDS in that state — an empty gallery is a
       legitimate outcome — so nothing fails and nothing warns
     - the FTP deploy excludes the img/gallery tree (it must: the
       mirror deletes what it does not find, and without that
       line one push would wipe every uploaded photo)

   The two halves therefore never met. The photos reached the
   server by hand over FTP; the manifest was written by a build
   that could not see them. Confirmed live 21 Aug 2026: the
   photos returned 200 with real bytes while the page carried
   zero references to them.

   This endpoint closes that gap by doing the walk WHERE THE
   PHOTOS ACTUALLY ARE, at request time. Drop files into
   /httpdocs/img/gallery/2026/<competition>/<division>/ and they
   appear on the next page load — no rebuild, no push, and no
   deploy can blank the list again.

   WHAT THIS DELIBERATELY DOES NOT DO
   No writes, no user input, no mail, no database. It reads a
   fixed directory tree and returns JSON. The only thing a caller
   can influence is whether they get a 200 or a 405, which is why
   there is no rate limiter here as there is in contact.php: this
   endpoint is cheaper than the page that calls it and returns
   nothing an attacker cannot already see by loading /media.

   ⚠️ GALLERY_TREE BELOW IS MIRRORED IN TWO OTHER PLACES:
   vite.config.ts (the build-time walk, still used by `npm run
   dev` and the smoke tests) and COMPETITIONS in
   src/lib/data/gallery.ts (labels and tab order). All three must
   agree. A division added only here has its photos read and then
   dropped by the page; one added only to COMPETITIONS shows an
   empty tab forever.
   ============================================================ */

/* The gallery year is hardcoded, exactly as GALLERY_YEAR is in
   gallery.ts, and for the same reason: this is the January 2026
   edition that already happened. It does not roll forward with
   EVENT_DATE (which says 2027 — the NEXT championship). Next
   year's photos are a new folder and a new constant. */
const GALLERY_YEAR = 2026;

/* Which folders are real. Anything else on disk — Thumbs.db, a
   stray .DS_Store, a mistyped `juniour/` — is skipped rather
   than rendered, so a typo cannot invent a division nobody can
   compete in. Mirrors GALLERY_TREE in vite.config.ts. */
const GALLERY_TREE = [
    'hhi-open-division' => ['junior', 'varsity', 'adult', 'parents', 'special-crews'],
    'netherlands-hhdc'  => ['junior', 'varsity', 'adult', 'jv-megacrew', 'minicrew', 'megacrew'],
];

/* Matches the PHOTO_RE in vite.config.ts. Kept in step by hand. */
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

header('Content-Type: application/json; charset=utf-8');

/* Read-only data that changes only when Iain uploads photos. Five
   minutes keeps a newly dropped folder appearing promptly while
   sparing the disk a full walk on every single page load. The
   walk is cheap, but /media is the most-linked page on the site
   and there is no reason to repeat it for every visitor. */
header('Cache-Control: public, max-age=300');

/* Same shape as contact.php: this endpoint answers GET (and HEAD,
   which PHP serves as GET with the body discarded). Anything else
   is a mistake worth naming rather than quietly treating as GET. */
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['ok' => false, 'photos' => [], 'message' => 'This endpoint only accepts GET.']);
    exit;
}

/* ------------------------------------------------------------
   Locate the gallery root.

   __DIR__ is /httpdocs/api, so the tree is one level up. Deriving
   it rather than hardcoding /httpdocs means this file works
   unchanged under `php -S` from build/ during verification, which
   is the only way the PHP on this site ever gets executed before
   it ships — the Playwright suite stubs it.
   ------------------------------------------------------------ */
$root = dirname(__DIR__) . '/img/gallery/' . GALLERY_YEAR;

/* ------------------------------------------------------------
   Natural sort, matching Intl.Collator({numeric:true}) in the
   build plugin. This is not a nicety: a camera dump is exactly
   the case a plain sort gets wrong, putting IMG_10 before IMG_2
   and scrambling the order the photos were taken in.
   strnatcasecmp is PHP's equivalent and orders adult-2.jpg
   before adult-10.jpg as intended.
   ------------------------------------------------------------ */
$photos = [];

if (is_dir($root)) {
    foreach (GALLERY_TREE as $competition => $divisions) {
        $competitionDir = $root . '/' . $competition;
        if (!is_dir($competitionDir)) {
            continue;
        }

        foreach ($divisions as $division) {
            $divisionDir = $competitionDir . '/' . $division;
            if (!is_dir($divisionDir)) {
                continue;
            }

            $entries = @scandir($divisionDir);
            if ($entries === false) {
                /* An unreadable folder is skipped rather than fatal. One
                   division with wrong permissions should cost that division,
                   not the whole gallery. */
                continue;
            }

            $names = [];
            foreach ($entries as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }
                if (!is_file($divisionDir . '/' . $entry)) {
                    continue;
                }
                $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                if (!in_array($extension, PHOTO_EXTENSIONS, true)) {
                    continue;
                }
                $names[] = $entry;
            }

            usort($names, 'strnatcasecmp');

            foreach ($names as $name) {
                $photos[] = [
                    'competition' => $competition,
                    'division'    => $division,
                    /* A root-relative path, matching exactly what the build
                       plugin emits. The page runs it through withBase(), so
                       this must NOT be an absolute URL. */
                    'src'         => '/img/gallery/' . GALLERY_YEAR . '/' . $competition . '/' . $division . '/' . rawurlencode($name),
                ];
            }
        }
    }
}

/* `ok` is always true for a successful walk, INCLUDING a walk that
   found nothing. An empty gallery is a real state — four divisions
   had no photos uploaded as of 21 Aug 2026 — and the page shows an
   honest empty state for it. The flag exists so the client can
   tell "the endpoint answered and there are no photos" apart from
   "the request failed", which are different problems with
   different fixes. */
echo json_encode([
    'ok'     => true,
    'year'   => GALLERY_YEAR,
    'photos' => $photos,
], JSON_UNESCAPED_SLASHES);
