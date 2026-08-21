<?php

declare(strict_types=1);

/* ============================================================
   HHI NETHERLANDS — gallery thumbnail service

   WHY THIS EXISTS
   The gallery photos are ~1500x1000 at ~318KB each, and the grid
   renders them in tiles about 209px wide (six columns at 1440px).
   The first screen of 24 tiles was therefore 6.6MB of which the
   browser discards roughly 90% after decoding. Measured on the
   live site 21 Aug 2026; the endpoint itself answered in 0.17s,
   so the photos were the entire problem.

   This serves a small WebP derivative instead. ~25KB per tile
   rather than ~318KB, so the first screen drops to roughly
   600KB. The lightbox still links the untouched original, which
   is the one place the full resolution is actually looked at.

   HOW IT WORKS
   Generate once, then serve from disk forever:

     first request  -> resize, encode WebP, write to .thumbs/
     later requests -> readfile() the cached copy

   Iain's workflow does not change. Keep FTPing full-size photos
   into img/gallery/2026/<competition>/<division>/ exactly as
   now; the thumbnails appear by themselves.

   ⚠️ DEGRADES TO THE ORIGINAL, NEVER TO A BROKEN IMAGE. If GD is
   missing, the cache folder is unwritable, the source is corrupt
   or anything else fails, this streams the original file instead
   of erroring. A slow gallery is a far better failure than a
   gallery of broken tiles, and it means deploying this cannot
   make the page worse than it is today.

   ⚠️ NOT A GENERAL IMAGE PROXY. The path is validated against
   the same GALLERY_TREE the manifest uses and must resolve
   inside the gallery root, so this cannot be pointed at
   arbitrary files on the server. See validation below — that is
   the security-relevant part of this file.
   ============================================================ */

const GALLERY_YEAR = 2026;

/* Mirrors GALLERY_TREE in api/gallery.php and vite.config.ts, and
   COMPETITIONS in src/lib/data/gallery.ts. Four copies is three too many,
   but the alternatives are worse: PHP cannot read the TS, and a shared JSON
   would be one more thing to keep deployed and in step. Change all four. */
const GALLERY_TREE = [
    'hhi-open-division' => ['junior', 'varsity', 'adult', 'parents', 'special-crews'],
    'netherlands-hhdc'  => ['junior', 'varsity', 'adult', 'jv-megacrew', 'minicrew', 'megacrew'],
];

/* Long edge of the generated thumbnail.

   The grid tile is ~287px at 1920, ~209px at 1440, ~185px at 1280. 480
   covers all of those at DPR 1 and is a reasonable compromise at DPR 2 —
   a retina 1440 screen wants ~418px, so 480 is slightly generous there and
   genuinely sharp everywhere else. Going to 800 to fully satisfy DPR 2
   would roughly triple the bytes and give back most of the win. */
const THUMB_LONG_EDGE = 480;

/* WebP quality. 82 is visually clean for photography at this size; the
   difference from 90 is invisible in a 209px tile and costs ~40% more. */
const THUMB_QUALITY = 82;

const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

$galleryRoot = dirname(__DIR__) . '/img/gallery/' . GALLERY_YEAR;

/* Cache lives inside the gallery tree, so it is covered by the same FTP
   exclusion that protects the photos from being deleted by a deploy. The
   leading dot keeps it out of the way of the division folders, and the
   manifest ignores it because .thumbs is not a competition in GALLERY_TREE. */
$cacheRoot = $galleryRoot . '/.thumbs';

/* ------------------------------------------------------------
   Stream a file and stop. Used for both the happy path and every
   fallback, so there is exactly one place that writes a body.
   ------------------------------------------------------------ */
function serveFile(string $path, string $type): never
{
    /* A week, matching what the host already sends for the photos
       themselves. These URLs are content-addressed by path, and a photo
       never changes under a given name — if one is replaced, its filename
       changes too, because that is how a camera dump works. */
    header('Content-Type: ' . $type);
    header('Content-Length: ' . (string) filesize($path));
    header('Cache-Control: public, max-age=604800, immutable');

    /* Let the browser skip the body entirely on a repeat visit. */
    $etag = '"' . md5($path . (string) filemtime($path) . (string) filesize($path)) . '"';
    header('ETag: ' . $etag);
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
        http_response_code(304);
        exit;
    }

    readfile($path);
    exit;
}

function mimeFor(string $extension): string
{
    return match (strtolower($extension)) {
        'png'  => 'image/png',
        'webp' => 'image/webp',
        default => 'image/jpeg',
    };
}

function fail(int $code, string $message): never
{
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

/* ------------------------------------------------------------
   Validate the request.

   Everything here is about making sure `src` names a real photo
   inside the gallery and cannot escape it. The checks are
   deliberately whitelist-shaped: the competition and division
   must appear in GALLERY_TREE, and the filename must match a
   conservative pattern, so a traversal attempt fails the
   whitelist long before realpath() is reached.
   ------------------------------------------------------------ */
$src = $_GET['src'] ?? '';
if (!is_string($src) || $src === '') {
    fail(400, 'Missing src.');
}

/* The client sends the same root-relative path the manifest gave it. */
$prefix = '/img/gallery/' . GALLERY_YEAR . '/';
if (!str_starts_with($src, $prefix)) {
    fail(400, 'Not a gallery path.');
}

$relative = substr($src, strlen($prefix));

/* ⚠️ NO rawurldecode() HERE, deliberately. PHP has already decoded the query
   string into $_GET, so "jv%20crew-1.jpg" in the URL arrives as
   "jv crew-1.jpg" already. Decoding a second time was the first version of
   this file and it is a real bug in two ways: it breaks the 83 space-named
   photos (double-encoded by the client, they miss), and more seriously a
   second pass would turn a literal "%2e%2e" into ".." AFTER the traversal
   check below had already looked at it. Decode exactly once — which PHP has
   done — and validate what you got. */

/* Reject anything with a traversal segment or a null byte before it can
   reach the filesystem. realpath() below is the real guarantee, but failing
   loudly here keeps the intent obvious to the next reader. */
if (str_contains($relative, '..') || str_contains($relative, "\0")) {
    fail(400, 'Bad path.');
}

$parts = explode('/', $relative);
if (count($parts) !== 3) {
    fail(400, 'Bad path.');
}
[$competition, $division, $filename] = $parts;

if (!isset(GALLERY_TREE[$competition]) || !in_array($division, GALLERY_TREE[$competition], true)) {
    fail(404, 'Unknown division.');
}

$extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if (!in_array($extension, PHOTO_EXTENSIONS, true)) {
    fail(400, 'Not a photo.');
}

/* Filenames here include spaces ("jv crew-1.jpg"), so a space is allowed —
   but nothing that could be a path separator or a shell surprise is. */
if (preg_match('/^[A-Za-z0-9 ._-]+$/', $filename) !== 1) {
    fail(400, 'Bad filename.');
}

$sourcePath = $galleryRoot . '/' . $competition . '/' . $division . '/' . $filename;
$sourceReal = realpath($sourcePath);
$rootReal = realpath($galleryRoot);

/* The definitive containment check: whatever the path resolved to, it must
   live under the gallery root. Catches symlinks as well as traversal. */
if ($sourceReal === false || $rootReal === false || !str_starts_with($sourceReal, $rootReal)) {
    fail(404, 'Not found.');
}
if (!is_file($sourceReal)) {
    fail(404, 'Not found.');
}

$originalMime = mimeFor($extension);

/* ------------------------------------------------------------
   Serve the cached thumbnail if it is current.

   "Current" means newer than the source. If a photo is replaced
   under the same name, the stale thumbnail is regenerated rather
   than served forever.
   ------------------------------------------------------------ */
$cachePath = $cacheRoot . '/' . $competition . '/' . $division . '/' . $filename . '.webp';

if (is_file($cachePath) && filemtime($cachePath) >= filemtime($sourceReal)) {
    serveFile($cachePath, 'image/webp');
}

/* ------------------------------------------------------------
   No usable cache entry. Everything from here can fail, and
   every failure path ends at the original file rather than an
   error — see the header note.
   ------------------------------------------------------------ */
if (!extension_loaded('gd') || !function_exists('imagewebp')) {
    serveFile($sourceReal, $originalMime);
}

$info = @getimagesize($sourceReal);
if ($info === false) {
    serveFile($sourceReal, $originalMime);
}
[$width, $height] = $info;
if ($width < 1 || $height < 1) {
    serveFile($sourceReal, $originalMime);
}

/* Already small enough that a thumbnail would not pay for itself. */
if (max($width, $height) <= THUMB_LONG_EDGE) {
    serveFile($sourceReal, $originalMime);
}

$source = match ($extension) {
    'png'         => @imagecreatefrompng($sourceReal),
    'webp'        => @imagecreatefromwebp($sourceReal),
    'jpg', 'jpeg' => @imagecreatefromjpeg($sourceReal),
    default       => false,
};
if ($source === false) {
    serveFile($sourceReal, $originalMime);
}

$scale = THUMB_LONG_EDGE / max($width, $height);
$targetWidth = max(1, (int) round($width * $scale));
$targetHeight = max(1, (int) round($height * $scale));

$thumb = @imagecreatetruecolor($targetWidth, $targetHeight);
if ($thumb === false) {
    imagedestroy($source);
    serveFile($sourceReal, $originalMime);
}

/* PNG and WebP sources may carry transparency; without this it fills black. */
imagealphablending($thumb, false);
imagesavealpha($thumb, true);

imagecopyresampled($thumb, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
imagedestroy($source);

/* ------------------------------------------------------------
   Write the cache entry, then serve it.

   Written to a temporary name and renamed into place, because
   rename() is atomic: two visitors hitting an uncached photo at
   the same time cannot leave a half-written file for everyone
   afterwards. A failed write is not fatal — the thumbnail is
   still sent, it just is not cached, so a read-only cache folder
   degrades to "slow but correct" rather than breaking.
   ------------------------------------------------------------ */
$cacheDir = dirname($cachePath);
$cached = false;

if (is_dir($cacheDir) || @mkdir($cacheDir, 0755, true) || is_dir($cacheDir)) {
    $temporary = @tempnam($cacheDir, 'thumb');
    if ($temporary !== false) {
        if (@imagewebp($thumb, $temporary, THUMB_QUALITY) && @rename($temporary, $cachePath)) {
            @chmod($cachePath, 0644);
            $cached = true;
        } else {
            @unlink($temporary);
        }
    }
}

if ($cached) {
    imagedestroy($thumb);
    serveFile($cachePath, 'image/webp');
}

/* Could not cache it — send the freshly generated bytes anyway. */
header('Content-Type: image/webp');
header('Cache-Control: public, max-age=604800');
imagewebp($thumb, null, THUMB_QUALITY);
imagedestroy($thumb);
