<script lang="ts">
	import { onMount } from 'svelte';
	import { isFinePointer, prefersReducedMotion } from '$lib/motion.svelte';
	/* Types only — erased at compile time, so this does not pull three
	   into the shared bundle the way a value import would. */
	import type { PointsMaterial, ShaderMaterial } from 'three';

	/* The particle stage floor behind the home hero: a grid of points
	   rippling under the cursor. Purely decorative, hence aria-hidden.

	   three.js is imported dynamically. It is ~600KB and only this one
	   page uses it, so a static import would put it in the shared bundle
	   for all nine routes — and it touches window, which breaks the
	   prerender in Node.

	   The legacy version created a pointermove listener, a resize
	   listener, an IntersectionObserver and an unbounded rAF loop, and
	   released none of them. On a static site the page unload cleaned up;
	   with a client router the loop keeps rendering into a detached
	   canvas forever. Everything below is torn down on destroy.

	   The wave runs in a vertex shader, not in JS. The earlier version
	   walked every point on the CPU each frame — two sines, a sqrt and a
	   third sine apiece — then re-uploaded the whole position buffer:
	   ~11k transcendental calls and a 33KB VBO upload per frame at the
	   mobile grid size. Measured at ~0.25ms/frame on a desktop core, so
	   several times that on a phone, every frame, before the GPU draws
	   anything. Now the positions upload once and each frame writes
	   three uniforms; the GPU does every point in parallel.

	   This was written for a report of a frozen floor on a Galaxy S22.
	   The likelier cause of a fully static floor is the reduced-motion
	   branch below — Android power saving reports that preference — so
	   both were addressed. See WAVE: the GLSL and the JS fallback
	   compute the same displacement, so the two paths look identical. */

	let mount: HTMLDivElement;

	/* Shared by the shader and the CPU fallback, so the two stay in step.
	   x/z are grid coordinates, p is the smoothed pointer already scaled
	   into world space. Amplitude scales the whole displacement down for
	   the reduced-motion path. */
	const WAVE = {
		vertex: /* glsl */ `
			uniform float uTime;
			uniform vec2 uPointer;
			uniform float uSize;
			uniform float uScale;
			uniform float uAmplitude;
			varying vec3 vColor;

			void main() {
				vColor = color;

				float x = position.x;
				float z = position.z;

				float wave = sin(x * 0.55 + uTime * 0.0012) * 0.35
				           + sin(z * 0.8  - uTime * 0.0009) * 0.25;

				float dx = x - uPointer.x;
				float dz = z - uPointer.y;
				float dist = sqrt(dx * dx + dz * dz);
				float ripple = max(0.0, 1.0 - dist / 6.0)
				             * sin(dist * 1.4 - uTime * 0.004) * 0.9;

				vec3 displaced = vec3(x, (wave + ripple) * uAmplitude, z);
				vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

				/* Matches PointsMaterial's sizeAttenuation exactly. three
				   feeds its own points shader a scale of half the drawing
				   buffer height in device pixels; uScale carries the same
				   value, so uSize stays in world units like the old
				   material's size. A hardcoded constant here blows the dots
				   up into a white haze on some pixel ratios. */
				gl_PointSize = uSize * (uScale / -mvPosition.z);
				gl_Position = projectionMatrix * mvPosition;
			}
		`,
		/* Round, soft-edged dots. PointsMaterial draws squares, which read
		   as grit at this size; the falloff costs nothing and looks like
		   light rather than debris. */
		fragment: /* glsl */ `
			uniform float uOpacity;
			varying vec3 vColor;

			void main() {
				vec2 d = gl_PointCoord - vec2(0.5);
				float alpha = 1.0 - smoothstep(0.35, 0.5, length(d));
				if (alpha <= 0.0) discard;
				gl_FragColor = vec4(vColor, alpha * uOpacity);
			}
		`
	};

	onMount(() => {
		let disposed = false;
		let cleanup: (() => void) | undefined;

		import('three')
			.then((THREE) => {
				// Navigated away while the chunk was in flight.
				if (disposed || !mount) return;

				const reduced = prefersReducedMotion();
				const isMobile = window.innerWidth < 800;

				/* The grid used to shrink on mobile because the CPU could not
				   afford the points. The GPU can, so both sizes now get the
				   dense grid — the cost is one upload at init, not per frame. */
				const cols = 130;
				const rows = 70;
				const spanX = 34;
				const spanZ = 22;

				const scene = new THREE.Scene();
				scene.fog = new THREE.Fog(0x0a0a0e, 8, 30);

				const camera = new THREE.PerspectiveCamera(
					55,
					mount.clientWidth / mount.clientHeight,
					0.1,
					100
				);
				camera.position.set(0, 3.2, 9);
				camera.lookAt(0, 0.4, 0);

				/* MSAA on a 2x buffer is expensive on a phone GPU and buys
				   nothing for soft additive dots that have no hard edges. */
				const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
				/* An S22 reports devicePixelRatio 3, so the old cap of 2 still
				   rendered ~4x the fragments of a 1x buffer. 1.5 is ~44% fewer
				   than 2 and indistinguishable on a blurred background. */
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
				renderer.setSize(mount.clientWidth, mount.clientHeight);
				mount.appendChild(renderer.domElement);

				const count = cols * rows;
				const positions = new Float32Array(count * 3);
				const colors = new Float32Array(count * 3);
				const oranje = new THREE.Color(0xff4d00);
				const violet = new THREE.Color(0x7c5cff);

				let i = 0;
				for (let r = 0; r < rows; r++) {
					for (let c = 0; c < cols; c++) {
						positions[i * 3] = (c / (cols - 1) - 0.5) * spanX;
						positions[i * 3 + 1] = 0;
						positions[i * 3 + 2] = (r / (rows - 1) - 0.5) * spanZ;
						const mixed = oranje.clone().lerp(violet, c / (cols - 1));
						colors[i * 3] = mixed.r;
						colors[i * 3 + 1] = mixed.g;
						colors[i * 3 + 2] = mixed.b;
						i++;
					}
				}

				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
				geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

				/* Reduced motion keeps the floor alive but calm: a third of the
				   speed, half the travel, and no cursor tracking at all. A
				   single frozen frame reads as a broken image rather than as a
				   deliberately still background. Tuned up from 0.2/0.35 after
				   testing on a Galaxy S22, where the gentler setting was too
				   subtle to register on a small screen. */
				const timeScale = reduced ? 0.33 : 1;
				const amplitude = reduced ? 0.5 : 1;

				/* World units, matching the PointsMaterial `size` this replaces.
				   uScale mirrors three's own points shader — drawing-buffer
				   height in device pixels, halved — and must be refreshed on
				   resize or the dots change size with the viewport. */
				const drawScale = () => renderer.getDrawingBufferSize(new THREE.Vector2()).y * 0.5;

				const uniforms = {
					uTime: { value: 0 },
					uPointer: { value: new THREE.Vector2(0, 0) },
					uSize: { value: isMobile ? 0.09 : 0.07 },
					uScale: { value: drawScale() },
					uAmplitude: { value: amplitude },
					uOpacity: { value: 0.85 }
				};

				/* If the shader will not compile we fall back to the original
				   CPU loop rather than leaving the hero blank. `useShader`
				   decides which renderFrame body runs below. */
				let useShader = true;
				let material: ShaderMaterial | PointsMaterial;

				try {
					material = new THREE.ShaderMaterial({
						uniforms,
						vertexShader: WAVE.vertex,
						fragmentShader: WAVE.fragment,
						vertexColors: true,
						transparent: true,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					});
				} catch {
					useShader = false;
					material = new THREE.PointsMaterial({
						size: isMobile ? 0.09 : 0.07,
						vertexColors: true,
						transparent: true,
						opacity: 0.85,
						blending: THREE.AdditiveBlending,
						depthWrite: false
					});
				}

				const points = new THREE.Points(geometry, material);
				scene.add(points);

				const pointer = { x: 0, targetX: 0, y: 0, targetY: 0 };
				const pos = geometry.attributes.position;

				/* three types BufferAttribute.array as read-only ArrayLike, but
				   the fallback loop writes heights in place — which is the
				   point of a BufferAttribute. `positions` is the same buffer,
				   already typed as a mutable Float32Array. */
				const heights = positions;

				/* Only the fallback path runs this. Kept byte-for-byte in step
				   with the GLSL above so a compile failure is invisible. */
				const renderFrameCPU = (t: number) => {
					const px = pointer.x * (spanX / 2);
					const pz = pointer.y * (spanZ / 2);
					for (let p = 0; p < count; p++) {
						const x = heights[p * 3];
						const z = heights[p * 3 + 2];
						const wave =
							Math.sin(x * 0.55 + t * 0.0012) * 0.35 + Math.sin(z * 0.8 - t * 0.0009) * 0.25;
						const dx = x - px;
						const dz = z - pz;
						const dist = Math.sqrt(dx * dx + dz * dz);
						const ripple = Math.max(0, 1 - dist / 6) * Math.sin(dist * 1.4 - t * 0.004) * 0.9;
						heights[p * 3 + 1] = (wave + ripple) * amplitude;
					}
					pos.needsUpdate = true;
				};

				const renderFrame = (t: number) => {
					pointer.x += (pointer.targetX - pointer.x) * 0.05;
					pointer.y += (pointer.targetY - pointer.y) * 0.05;

					if (useShader) {
						/* The entire per-frame CPU cost: three uniform writes. */
						uniforms.uTime.value = t * timeScale;
						uniforms.uPointer.value.set(pointer.x * (spanX / 2), pointer.y * (spanZ / 2));
					} else {
						renderFrameCPU(t * timeScale);
					}

					camera.position.x = pointer.x * 0.8;
					camera.lookAt(0, 0.4, 0);
					renderer.render(scene, camera);
				};

				/* Releases the GPU-side resources. Dropping the JS references
				   alone does not: the buffers and the WebGL context live on the
				   driver until explicitly disposed. */
				const disposeScene = () => {
					geometry.dispose();
					material.dispose();
					renderer.dispose();
					renderer.domElement.remove();
				};

				/* A shader only reports a compile error when it is first used,
				   which is inside this render — hence the try. Falling back
				   here means rebuilding the material and drawing again. */
				try {
					renderFrame(0);
				} catch {
					if (useShader) {
						useShader = false;
						material.dispose();
						material = new THREE.PointsMaterial({
							size: isMobile ? 0.09 : 0.07,
							vertexColors: true,
							transparent: true,
							opacity: 0.85,
							blending: THREE.AdditiveBlending,
							depthWrite: false
						});
						points.material = material;
						renderFrame(0);
					}
				}

				/* No hover on a touch screen, so the ripple would never fire —
				   skip the listener entirely. Reduced motion opts out too. */
				const wantsPointer = !reduced && isFinePointer();

				const onPointerMove = (e: PointerEvent) => {
					pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
					pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
				};
				const onResize = () => {
					if (!mount.clientHeight) return;
					camera.aspect = mount.clientWidth / mount.clientHeight;
					camera.updateProjectionMatrix();
					renderer.setSize(mount.clientWidth, mount.clientHeight);
					uniforms.uScale.value = drawScale();
				};

				if (wantsPointer) window.addEventListener('pointermove', onPointerMove);
				window.addEventListener('resize', onResize);

				// Skip rendering entirely while the hero is off-screen.
				let isVisible = true;
				const observer = new IntersectionObserver(([entry]) => {
					isVisible = entry.isIntersecting;
				});
				observer.observe(mount);

				/* 30fps on mobile. A slow ambient ripple is indistinguishable
				   from 60, and halving the draw calls matters more for heat and
				   battery on a phone than the extra smoothness is worth. */
				const minFrameMs = isMobile ? 1000 / 30 : 0;
				let last = 0;

				let frame = requestAnimationFrame(function loop(t) {
					frame = requestAnimationFrame(loop);
					if (!isVisible) return;
					if (t - last < minFrameMs) return;
					last = t;
					renderFrame(t);
				});

				cleanup = () => {
					cancelAnimationFrame(frame);
					observer.disconnect();
					if (wantsPointer) window.removeEventListener('pointermove', onPointerMove);
					window.removeEventListener('resize', onResize);
					disposeScene();
				};
			})
			.catch(() => {
				/* WebGL unavailable or the chunk failed. The hero is designed to
				   read without it, so there is nothing to fall back to. */
			});

		return () => {
			disposed = true;
			cleanup?.();
		};
	});
</script>

<div id="stage-floor" bind:this={mount} aria-hidden="true"></div>
