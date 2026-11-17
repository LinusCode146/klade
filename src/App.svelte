<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Scene } from './game/scene';
  import {
    ERAS, FACTS, MAX_DEPTH, ERA_TROPHY, ageToDepth, depthToAge, eraAtAge, formatAge, type Era,
  } from './game/strata';
  import { PROMPTS, TIER_POINTS, TIER_LABEL, TIER_EMOJI, MAX_POINTS, judge, type Tier } from './game/prompts';
  import { spriteDataUrl } from './game/sprites';

  const SECONDS = 25;
  const START_DAY = Date.UTC(2026, 10, 17);
  const digNo = Math.max(1, Math.floor((Date.now() - START_DAY) / 86400000) + 1);

  type Phase = 'start' | 'play' | 'result';
  interface Round { answer: string; tier: Tier; points: number }

  let canvas: HTMLCanvasElement;
  let world: HTMLDivElement;
  let marker: HTMLDivElement;
  let input: HTMLInputElement | undefined = $state();
  let scene: Scene;

  let phase: Phase = $state('start');
  let px = $state(4);
  let skyH = $state(210);
  let showHelp = $state(false);
  let qIndex = $state(0);
  let rounds: Round[] = $state([]);
  let answer = $state('');
  let busy = $state(false);
  let timeLeft = $state(SECONDS);
  let feedback: Round | null = $state(null);
  let banner: Era | null = $state(null);
  let depthLabel = $state('heute');
  let eraLabel = $state('Oberfläche');
  let copied = $state(false);

  const score = $derived(rounds.reduce((s, r) => s + r.points, 0));
  const finalAge = $derived(depthToAge((score / MAX_POINTS) * MAX_DEPTH));
  const finalEra = $derived(eraAtAge(finalAge));
  const shareText = $derived(
    `KLADE #${digNo} ⛏️ ${formatAge(finalAge)} · ${finalEra.name}\n${rounds.map((r) => TIER_EMOJI[r.tier]).join('')}`,
  );

  let timer: ReturnType<typeof setInterval> | undefined;
  let bannerTimeout: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    scene = new Scene(canvas, {
      onFrame: (camY, drillY) => {
        world.style.transform = `translate3d(0, ${Math.round(-camY) * px}px, 0)`;
        marker.style.top = `${Math.round(drillY) * px}px`;
        if (phase === 'play') {
          const age = depthToAge(drillY);
          const lbl = drillY <= 5 ? 'heute' : formatAge(age);
          if (lbl !== depthLabel) depthLabel = lbl;
          const en = drillY <= 5 ? 'Oberfläche' : eraAtAge(age).name;
          if (en !== eraLabel) eraLabel = en;
        }
      },
      onEraEnter: (era) => {
        if (phase !== 'play') return;
        banner = era;
        clearTimeout(bannerTimeout);
        bannerTimeout = setTimeout(() => (banner = null), 2200);
      },
    });
    const sync = () => {
      px = scene.px;
      skyH = scene.skyH;
    };
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
    depthLabel = 'heute';
    eraLabel = 'Oberfläche';
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
    const prompt = PROMPTS[qIndex];
    const res = timeout ? { tier: 0 as Tier, canonical: 'Zeit abgelaufen' } : judge(prompt, answer);
    const round: Round = { answer: res.canonical || '—', tier: res.tier, points: TIER_POINTS[res.tier] };
    rounds = [...rounds, round];
    feedback = round;
    const total = rounds.reduce((s, r) => s + r.points, 0);
    if (round.points > 0) scene.digTo((total / MAX_POINTS) * MAX_DEPTH);
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
    scene.focusSky();
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      /* Zwischenablage nicht verfügbar */
    }
  }

  const depthPx = (age: number) => ageToDepth(age) * px;
</script>

<canvas bind:this={canvas} class="scene" aria-hidden="true"></canvas>

<!-- Ebene, die mit der Kamera mitscrollt: Zeitalter, Fakten, Skala -->
<div class="world" class:at-start={phase === 'start'} bind:this={world} aria-hidden="true">
  {#each ERAS as era, i}
    {#if i > 0}
      <div class="era-name" style="top:{depthPx(era.end) + 8}px">
        {era.name}
        <small>{formatAge(era.start)} – {formatAge(era.end)}</small>
      </div>
    {/if}
  {/each}

  {#each FACTS as f, i}
    <div class="fact" class:major={f.major} class:right={i % 2 === 1} style="top:{depthPx(f.age)}px">
      {#if i % 2 === 1}<span>{f.text}</span><i></i>{:else}<i></i><span>{f.text}</span>{/if}
    </div>
  {/each}

  <div class="ruler">
    <div class="track" style="height:{(MAX_DEPTH + 60) * px}px"></div>
    {#each ERAS as era}
      <div
        class="seg"
        style="top:{depthPx(era.end)}px; height:{depthPx(era.start) - depthPx(era.end)}px; background:{era.base}"
      ></div>
      <div class="tick" style="top:{depthPx(era.start)}px">
        {era.start >= 1000 ? (era.start / 1000).toLocaleString('de-DE') + ' Mrd' : Math.round(era.start)}
      </div>
    {/each}
    <div class="tick" style="top:0">0</div>
  </div>
  <div class="marker" class:hidden={phase === 'start'} bind:this={marker}><span>◀</span></div>
</div>

{#if phase === 'start'}
  <main class="start">
    <h1 class="logo" aria-label="Klade">KLADE</h1>
    <p class="sub">die tägliche Grabung</p>
    <p class="tagline">7 Fragen · 25 Sekunden · seltenere Antworten graben tiefer</p>
  </main>
  <div class="start-actions">
    <button class="link" onclick={() => (showHelp = !showHelp)} aria-expanded={showHelp}>
      {showHelp ? '▼' : '▶'} so wird gespielt
    </button>
    {#if showHelp}
      <div class="help panel">
        <p>Zu jeder Frage gibt es viele richtige Antworten. Je <b>seltener</b> deine Antwort, desto tiefer gräbst du dich durch die Erdgeschichte.</p>
        <p>Ein Delfin bringt dich ein Stück weit. Mit der Vaquita landest du vielleicht bei den Dinosauriern.</p>
        <p>Eine perfekte Grabung endet dort, wo die Erde entstanden ist: vor 4,57 Mrd. Jahren.</p>
      </div>
    {/if}
    <button class="primary" onclick={start}>▼ Grabung starten ▼</button>
    <div class="meta">
      <span>Grabung #{digNo}</span>
      <span class="chip">Prototyp</span>
    </div>
  </div>
{/if}

{#if phase === 'play'}
  <header class="hud">
    <div class="stat">
      <span class="k">Tiefe</span>
      <span class="v">{depthLabel}</span>
      <span class="era">{eraLabel}</span>
    </div>
    <div class="stat center">
      <span class="k">Frage</span>
      <span class="v">{qIndex + 1}/{PROMPTS.length}</span>
    </div>
    <div class="stat right">
      <span class="k">Punkte</span>
      <span class="v">{score}</span>
    </div>
  </header>

  {#if banner}
    <div class="banner" role="status">
      <span>▼ {banner.name}</span>
      <small>{formatAge(banner.start)} – {formatAge(banner.end)}</small>
    </div>
  {/if}

  <section class="question panel" aria-live="polite">
    <div class="timer" style="--t:{timeLeft / SECONDS}"><i></i></div>
    <p class="prompt">{PROMPTS[qIndex].text}</p>
    {#if feedback}
      <p class="feedback tier-{feedback.tier}">
        <span class="ans">{feedback.answer}</span>
        <span class="lbl">{TIER_LABEL[feedback.tier]}</span>
        <span class="pts">{feedback.points > 0 ? `+${feedback.points}` : '±0'}</span>
      </p>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
        <input
          bind:this={input}
          bind:value={answer}
          placeholder="Tier eingeben …"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          disabled={busy}
          aria-label="Deine Antwort"
        />
        <button class="primary small" disabled={busy || !answer.trim()}>Graben</button>
      </form>
    {/if}
  </section>
{/if}

{#if phase === 'result'}
  <main class="result">
    <article class="card panel">
      <p class="label-top">Fundstück · Grabung #{digNo}</p>
      <img class="trophy" src={spriteDataUrl(ERA_TROPHY[finalEra.name], 8)} alt="" />
      <p class="big">{formatAge(finalAge)}</p>
      <p class="era-res">{finalEra.name}</p>
      <ol class="answers">
        {#each rounds as r, i}
          <li class="tier-{r.tier}">
            <span class="q">{PROMPTS[i].text.replace('Nenne ', '')}</span>
            <span class="a">{r.answer}</span>
            <span class="t">{TIER_EMOJI[r.tier]}</span>
          </li>
        {/each}
      </ol>
      <pre class="share">{shareText}</pre>
      <div class="row">
        <button class="primary small" onclick={share}>{copied ? 'Kopiert ✓' : 'Ergebnis teilen'}</button>
        <button class="ghost small" onclick={again}>Nochmal</button>
      </div>
    </article>
  </main>
{/if}
