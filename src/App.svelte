<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Scene } from './game/scene';
  import {
    FLOORS, FACTS, MAX_DEPTH, METRES_PER_PX, FLOOR_TROPHY, floorAt, floorBottom, formatDepth, type Floor,
  } from './game/levels';
  import { loadData, tierFor, type Book, type GameData, type Prompt } from './game/catalog';
  import { TIER_POINTS, TIER_LABEL, TIER_EMOJI, MAX_POINTS, PROMPTS_PER_DAY, type Tier } from './game/scoring';
  import {
    dailyPrompts, practicePrompts, descentNumber, msUntilNext, loadDay, saveDay, stats, type Round, type Stats,
  } from './game/daily';
  import { spriteDataUrl } from './game/sprites';
  import BookInput from './components/BookInput.svelte';

  const SECONDS = 25;
  const day = descentNumber();

  type Phase = 'start' | 'play' | 'result';
  type Mode = 'daily' | 'practice';

  let canvas: HTMLCanvasElement;
  let world: HTMLDivElement;
  let marker: HTMLDivElement;
  let bookInput: BookInput | undefined = $state();
  let scene: Scene;

  let data: GameData | null = $state(null);
  let loadError = $state(false);
  let phase: Phase = $state('start');
  let mode: Mode = $state('daily');
  let prompts: Prompt[] = $state([]);
  let px = $state(4);
  let showHelp = $state(false);
  let qIndex = $state(0);
  let rounds: Round[] = $state([]);
  let busy = $state(false);
  let timeLeft = $state(SECONDS);
  let feedback: Round | null = $state(null);
  let banner: Floor | null = $state(null);
  let depthLabel = $state('0 m');
  let floorLabel = $state('Street level');
  let copied = $state(false);
  let today = $state(loadDay(day));
  let myStats: Stats = $state(stats(day));
  let countdown = $state('');

  const score = $derived(rounds.reduce((s, r) => s + r.points, 0));
  const depthFor = (points: number) => (points / MAX_POINTS) * MAX_DEPTH;
  const finalDepth = $derived(depthFor(score));
  const finalFloor = $derived(floorAt(finalDepth));
  const used = $derived(new Set(rounds.map((r) => r.bookId).filter((id): id is number => id !== null)));
  const shareText = $derived(
    `DEEP STACKS #${day} 📚 ${formatDepth(finalDepth)} · ${finalFloor.name}\n${rounds.map((r) => TIER_EMOJI[r.tier]).join('')}`,
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
    loadData().then((d) => (data = d)).catch(() => (loadError = true));
    const tickCountdown = () => {
      const ms = msUntilNext();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      countdown = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    tickCountdown();
    const cd = setInterval(tickCountdown, 1000);
    return () => {
      removeEventListener('resize', sync);
      scene.destroy();
      clearInterval(timer);
      clearInterval(cd);
    };
  });

  async function startDaily() {
    if (!data) return;
    mode = 'daily';
    prompts = dailyPrompts(data.prompts, day);
    rounds = today?.rounds ?? [];
    qIndex = Math.min(rounds.length, PROMPTS_PER_DAY - 1);
    scene.focusDig();
    scene.jumpTo(depthFor(score));
    if (today?.done) {
      phase = 'result';
      return;
    }
    phase = 'play';
    await nextQuestion();
  }

  async function startPractice() {
    if (!data) return;
    mode = 'practice';
    prompts = practicePrompts(data.prompts);
    rounds = [];
    qIndex = 0;
    scene.reset();
    scene.focusDig();
    phase = 'play';
    await nextQuestion();
  }

  async function nextQuestion() {
    feedback = null;
    busy = false;
    timeLeft = SECONDS;
    depthLabel = formatDepth(scene.depth);
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 0.1);
      if (timeLeft <= 0) answer(null);
    }, 100);
    await tick();
    bookInput?.focus();
  }

  function answer(book: Book | null) {
    if (busy) return;
    busy = true;
    clearInterval(timer);
    const tier: Tier = book ? tierFor(prompts[qIndex], book) : 0;
    const round: Round = { bookId: book?.id ?? null, title: book?.title ?? "Time's up", tier, points: TIER_POINTS[tier] };
    rounds = [...rounds, round];
    feedback = round;
    const done = rounds.length >= PROMPTS_PER_DAY;
    const total = rounds.reduce((s, r) => s + r.points, 0);
    if (mode === 'daily') {
      today = { rounds, done, depth: depthFor(total) };
      saveDay(day, today);
      if (done) myStats = stats(day);
    }
    if (round.points > 0) scene.descendTo(depthFor(total));
    else scene.thud();
    setTimeout(
      () => {
        if (!done) {
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

  function backToStreet() {
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
  const startLabel = $derived(
    !data ? (loadError ? 'Catalogue unavailable' : 'Opening the catalogue …')
      : today?.done ? "Today's descent ✓"
      : today?.rounds.length ? '▼ Continue descent ▼'
      : '▼ Enter the stacks ▼',
  );
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
        <p>Each prompt has many right answers. Start typing and pick a book from the catalogue. The <b>rarer</b> the book, the deeper the lift takes you.</p>
        <p><i>1984</i> gets you past the bestsellers. A book few people would think of takes you to the rare books.</p>
        <p>Everyone gets the same seven prompts each day. A perfect descent ends among the scrolls of Alexandria.</p>
      </div>
    {/if}
    <button class="primary" onclick={startDaily} disabled={!data}>{startLabel}</button>
    <div class="meta">
      <span>Descent #{day}{myStats.streak ? ` · streak ${myStats.streak}` : ''}</span>
      <button class="chip" onclick={startPractice} disabled={!data}>Practice round</button>
    </div>
  </div>
{/if}

{#if phase === 'play' && data}
  <header class="hud">
    <div class="stat">
      <span class="k">Depth</span>
      <span class="v">{depthLabel}</span>
      <span class="floor">{floorLabel}</span>
    </div>
    <div class="stat center">
      <span class="k">{mode === 'practice' ? 'Practice' : 'Prompt'}</span>
      <span class="v">{qIndex + 1}/{PROMPTS_PER_DAY}</span>
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
    <p class="prompt">{prompts[qIndex].text}</p>
    {#if feedback}
      <p class="feedback tier-{feedback.tier}">
        <span class="ans">{feedback.title}</span>
        <span class="lbl">{TIER_LABEL[feedback.tier]}</span>
        <span class="pts">{feedback.points > 0 ? `+${feedback.points}` : '±0'}</span>
      </p>
    {:else}
      <BookInput bind:this={bookInput} books={data.books} {used} disabled={busy} onpick={answer} />
    {/if}
  </section>
{/if}

{#if phase === 'result'}
  <main class="result">
    <article class="card">
      <header class="card-head">
        <span>Deep Stacks Library</span>
        <span>{mode === 'practice' ? 'Practice' : `Descent #${day}`}</span>
      </header>
      <img class="trophy" src={spriteDataUrl(FLOOR_TROPHY[finalFloor.style], 7)} alt="" />
      <p class="big">{formatDepth(finalDepth)}</p>
      <p class="floor-res">{finalFloor.code} · {finalFloor.name}</p>
      <ol class="answers">
        {#each rounds as r, i}
          <li class="tier-{r.tier}">
            <span class="q">{prompts[i]?.text}</span>
            <span class="a">{r.title}</span>
            <span class="t" title={TIER_LABEL[r.tier]}>{TIER_EMOJI[r.tier]}</span>
          </li>
        {/each}
      </ol>
      <div class="stamp" aria-hidden="true">RETURNED</div>
      {#if mode === 'daily'}
        <dl class="stats">
          <div><dt>Played</dt><dd>{myStats.played}</dd></div>
          <div><dt>Streak</dt><dd>{myStats.streak}</dd></div>
          <div><dt>Deepest</dt><dd>{formatDepth(myStats.bestDepth)}</dd></div>
          <div><dt>Next descent</dt><dd>{countdown}</dd></div>
        </dl>
        <pre class="share">{shareText}</pre>
      {/if}
      <div class="row">
        {#if mode === 'daily'}
          <button class="primary small" onclick={share}>{copied ? 'Copied ✓' : 'Share result'}</button>
          <button class="ghost small" onclick={startPractice}>Practice round</button>
        {:else}
          <button class="primary small" onclick={startPractice}>Practice again</button>
          <button class="ghost small" onclick={backToStreet}>Back to the street</button>
        {/if}
      </div>
    </article>
  </main>
{/if}
