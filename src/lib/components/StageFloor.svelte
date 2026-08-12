<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion.svelte';

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
	   canvas forever. Everything below is torn down on destroy. */

	let mount: HTMLDivElement;

	onMount(() => {
		let disposed = false;
		let cleanup: (() => void) | undefined;

		import('three')
			.then((THREE) => {
				// Navigated away while the chunk was in flight.
				if (disposed || !mount) return;

				const isMobile = window.innerWidth < 800;
				const cols = isMobile ? 70 : 130;
				const rows = isMobile ? 40 : 70;
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

				const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

				const material = new THREE.PointsMaterial({
					size: isMobile ? 0.09 : 0.07,
					vertexColors: true,
					transparent: true,
					opacity: 0.85,
					blending: THREE.AdditiveBlending,
					depthWrite: false
				});
				const points = new THREE.Points(geometry, material);
				scene.add(points);

				const pointer = { x: 0, targetX: 0, y: 0, targetY: 0 };
				const pos = geometry.attributes.position;

				/* three types BufferAttribute.array as read-only ArrayLike, but
				   the loop writes heights in place every frame — which is the
				   point of a BufferAttribute. `positions` is the same buffer,
				   already typed as a mutable Float32Array. */
				const heights = positions;

				const renderFrame = (t: number) => {
					pointer.x += (pointer.targetX - pointer.x) * 0.05;
					pointer.y += (pointer.targetY - pointer.y) * 0.05;

					for (let p = 0; p < count; p++) {
						const x = heights[p * 3];
						const z = heights[p * 3 + 2];
						const wave =
							Math.sin(x * 0.55 + t * 0.0012) * 0.35 + Math.sin(z * 0.8 - t * 0.0009) * 0.25;
						const dx = x - pointer.x * (spanX / 2);
						const dz = z - pointer.y * (spanZ / 2);
						const dist = Math.sqrt(dx * dx + dz * dz);
						const ripple = Math.max(0, 1 - dist / 6) * Math.sin(dist * 1.4 - t * 0.004) * 0.9;
						heights[p * 3 + 1] = wave + ripple;
					}
					pos.needsUpdate = true;

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

				if (prefersReducedMotion()) {
					// One static frame, no loop, no listeners — same as the legacy
					// behaviour, but the scene still has to be disposed on destroy.
					renderFrame(0);
					cleanup = disposeScene;
					return;
				}

				const onPointerMove = (e: PointerEvent) => {
					pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
					pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
				};
				const onResize = () => {
					if (!mount.clientHeight) return;
					camera.aspect = mount.clientWidth / mount.clientHeight;
					camera.updateProjectionMatrix();
					renderer.setSize(mount.clientWidth, mount.clientHeight);
				};

				window.addEventListener('pointermove', onPointerMove);
				window.addEventListener('resize', onResize);

				// Skip rendering entirely while the hero is off-screen.
				let isVisible = true;
				const observer = new IntersectionObserver(([entry]) => {
					isVisible = entry.isIntersecting;
				});
				observer.observe(mount);

				let frame = requestAnimationFrame(function loop(t) {
					if (isVisible) renderFrame(t);
					frame = requestAnimationFrame(loop);
				});

				cleanup = () => {
					cancelAnimationFrame(frame);
					observer.disconnect();
					window.removeEventListener('pointermove', onPointerMove);
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
