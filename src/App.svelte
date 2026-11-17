<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Scene } from './game/scene';
  import {
    FLOORS, FACTS, MAX_DEPTH, METRES_PER_PX, FLOOR_TROPHY, floorAt, floorBottom, formatDepth, type Floor,
  } from './game/levels';
  import { PROMPTS, TIER_POINTS, TIER_LABEL, TIER_EMOJI, MAX_POINTS, judge, type Tier } from './game/prompts';
  import { spriteDataUrl } from './game/sprites';

  const SECONDS = 25;
  const START_DAY = Date.UTC(2026, 10, 17);
  const descentNo = Math.max(1, Math.floor((Date.now() - START_DAY) / 86400000) + 1);

  type Phase = 'start' | 'play' | 'result';
  interface Round { title: string; tier: Tier; points: number }

  let canvas: HTMLCanvasElement;
  let world: HTMLDivElement;
  let marker: HTMLDivElement;
  let input: HTMLInputElement | undefined = $state();
  let scene: Scene;

  let phase: Phase = $state('start');
  let px = $state(4);
  let showHelp = $state(false);
  let qIndex = $state(0);
  let rounds: Round[] = $state([]);
  let answer = $state('');
  let busy = $state(false);
  let timeLeft = $state(SECONDS);
  let feedback: Round | null = $state(null);
  let banner: Floor | null = $state(null);
  let depthLabel = $state('0 m');
  let floorLabel = $state('Street level');
  let copied = $state(false);

  const score = $derived(rounds.reduce((s, r) => s + r.points, 0));
  const finalDepth = $derived((score / MAX_POINTS) * MAX_DEPTH);
  const finalFloor = $derived(floorAt(finalDepth));
  const shareText = $derived(
    `DEEP STACKS #${descentNo} 📚 ${formatDepth(finalDepth)} · ${finalFloor.name}\n${rounds.map((r) => TIER_EMOJI[r.tier]).join('')}`,
  );

  let timer: ReturnType<typeof setInterval> | undefined;
  let bannerTimeout: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    scene = new Scene(canvas, {
      onFrame: (camY, depth) => {
        world.style.transform = `translate3d(0, ${Math.round(-camY) * px}px, 0)`;
        marker.style.top = `${Math.round(depth) * px}px`;
        if (phase === 'play') {
          const lbl = formatDepth(depth);
          if (lbl !== depthLabel) depthLabel = lbl;
          const f = depth < 1 ? 'Street level' : `${floorAt(depth).code} · ${floorAt(depth).name}`;
          if (f !== floorLabel) floorLabel = f;
        }
      },
      onFloorEnter: (floor) => {
        if (phase !== 'play' || floor === FLOORS[0]) return;
        banner = floor;
        clearTimeout(bannerTimeout);
        bannerTimeout = setTimeout(() => (banner = null), 2200);
      },
    });
    const sync = () => (px = scene.px);
    sync();
    addEventListener('resize', sync);
    return () => {
      removeEventListener('resize', sync);
      scene.destroy();
      clearInterval(timer);
    };
  });

  async function start() {
    rounds = [];
    qIndex = 0;
    scene.reset();
    depthLabel = '0 m';
    floorLabel = 'Street level';
    phase = 'play';
    scene.focusDig();
    await nextQuestion();
  }

  async function nextQuestion() {
    answer = '';
    feedback = null;
    busy = false;
    timeLeft = SECONDS;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 0.1);
      if (timeLeft <= 0) submit(true);
    }, 100);
    await tick();
    input?.focus();
  }

  function submit(timeout = false) {
    if (busy) return;
    busy = true;
    clearInterval(timer);
    const res = timeout ? { tier: 0 as Tier, title: "Time's up" } : judge(PROMPTS[qIndex], answer);
    const round: Round = { title: res.title || '—', tier: res.tier, points: TIER_POINTS[res.tier] };
    rounds = [...rounds, round];
    feedback = round;
    const total = rounds.reduce((s, r) => s + r.points, 0);
    if (round.points > 0) scene.descendTo((total / MAX_POINTS) * MAX_DEPTH);
    else scene.thud();
    setTimeout(
      () => {
        if (qIndex + 1 < PROMPTS.length) {
          qIndex++;
          nextQuestion();
        } else {
          feedback = null;
          phase = 'result';
        }
      },
      round.points > 0 ? 2300 : 1500,
    );
  }

  function again() {
    phase = 'start';
    scene.reset();
    scene.focusStreet();
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const y = (depth: number) => depth * px;
  const metres = (depth: number) => Math.round(depth * METRES_PER_PX);
</script>

<canvas bind:this={canvas} class="scene" aria-hidden="true"></canvas>

<!-- Layer that scrolls with the camera: floor names, facts, ruler -->
<div class="world" class:at-start={phase === 'start'} bind:this={world} aria-hidden="true">
  {#each FLOORS as floor}
    <div class="floor-name" style="top:{y(floor.top) + 12}px">
      <b>{floor.code}</b> {floor.name}
    </div>
  {/each}

  {#each FACTS as f, i}
    <div class="fact" class:major={f.major} class:left={i % 2 === 1} style="top:{y(f.depth)}px">
      {#if i % 2 === 1}<span>{f.text}</span><i></i>{:else}<i></i><span>{f.text}</span>{/if}
    </div>
  {/each}

  <div class="ruler">
    <div class="track" style="height:{(MAX_DEPTH + 60) * px}px"></div>
    {#each FLOORS as floor}
      <div
        class="seg"
        style="top:{y(floor.top)}px; height:{y(floorBottom(floor) - floor.top)}px; background:{floor.accent}"
      ></div>
      <div class="tick" style="top:{y(floor.top)}px">{floor.code}</div>
    {/each}
    <div class="tick" style="top:{y(MAX_DEPTH)}px">{metres(MAX_DEPTH)} m</div>
  </div>
  <div class="marker" class:hidden={phase === 'start'} bind:this={marker}><span>◀</span></div>
</div>

{#if phase === 'start'}
  <main class="start">
    <h1 class="logo" aria-label="Deep Stacks"><span>DEEP</span><span>STACKS</span></h1>
    <p class="sub">the daily descent</p>
    <p class="tagline">7 prompts · 25 seconds each · rarer books go deeper</p>
  </main>
  <div class="start-actions">
    <button class="link" onclick={() => (showHelp = !showHelp)} aria-expanded={showHelp}>
      {showHelp ? '▼' : '▶'} how to play
    </button>
    {#if showHelp}
      <div class="help panel">
        <p>Each prompt has many right answers. The <b>rarer</b> the book you name, the deeper the lift takes you into the library.</p>
        <p><i>1984</i> gets you past the bestsellers. Virginia Woolf's <i>Flush</i> might take you all the way to the rare books.</p>
        <p>A perfect descent ends among the scrolls of Alexandria.</p>
      </div>
    {/if}
    <button class="primary" onclick={start}>▼ Enter the stacks ▼</button>
    <div class="meta">
      <span>Descent #{descentNo}</span>
      <span class="chip">Prototype</span>
    </div>
  </div>
{/if}

{#if phase === 'play'}
  <header class="hud">
    <div class="stat">
      <span class="k">Depth</span>
      <span class="v">{depthLabel}</span>
      <span class="floor">{floorLabel}</span>
    </div>
    <div class="stat center">
      <span class="k">Prompt</span>
      <span class="v">{qIndex + 1}/{PROMPTS.length}</span>
    </div>
    <div class="stat right">
      <span class="k">Score</span>
      <span class="v">{score}</span>
    </div>
  </header>

  {#if banner}
    <div class="banner" role="status">
      <small>▼ {banner.code}</small>
      <span>{banner.name}</span>
    </div>
  {/if}

  <section class="question panel" aria-live="polite">
    <div class="timer" style="--t:{timeLeft / SECONDS}"><i></i></div>
    <p class="prompt">{PROMPTS[qIndex].text}</p>
    {#if feedback}
      <p class="feedback tier-{feedback.tier}">
        <span class="ans">{feedback.title}</span>
        <span class="lbl">{TIER_LABEL[feedback.tier]}</span>
        <span class="pts">{feedback.points > 0 ? `+${feedback.points}` : '±0'}</span>
      </p>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
        <input
          bind:this={input}
          bind:value={answer}
          placeholder="Name a book …"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          disabled={busy}
          aria-label="Your answer"
        />
        <button class="primary small" disabled={busy || !answer.trim()}>Descend</button>
      </form>
    {/if}
  </section>
{/if}

{#if phase === 'result'}
  <main class="result">
    <article class="card">
      <header class="card-head">
        <span>Deep Stacks Library</span>
        <span>Descent #{descentNo}</span>
      </header>
      <img class="trophy" src={spriteDataUrl(FLOOR_TROPHY[finalFloor.style], 7)} alt="" />
      <p class="big">{formatDepth(finalDepth)}</p>
      <p class="floor-res">{finalFloor.code} · {finalFloor.name}</p>
      <ol class="answers">
        {#each rounds as r, i}
          <li class="tier-{r.tier}">
            <span class="q">{PROMPTS[i].text}</span>
            <span class="a">{r.title}</span>
            <span class="t">{TIER_EMOJI[r.tier]}</span>
          </li>
        {/each}
      </ol>
      <div class="stamp" aria-hidden="true">RETURNED</div>
      <pre class="share">{shareText}</pre>
      <div class="row">
        <button class="primary small" onclick={share}>{copied ? 'Copied ✓' : 'Share result'}</button>
        <button class="ghost small" onclick={again}>Again</button>
      </div>
    </article>
  </main>
{/if}
