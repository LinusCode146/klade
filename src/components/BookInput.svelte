<script lang="ts">
  import { search, type Book } from '../game/catalog';

  interface Props {
    books: Book[];
    used: Set<number>;
    disabled?: boolean;
    onpick: (book: Book) => void;
  }
  let { books, used, disabled = false, onpick }: Props = $props();

  let query = $state('');
  let results: Book[] = $state([]);
  let active = $state(0);
  let notice = $state('');
  let input: HTMLInputElement;
  let pending: ReturnType<typeof setTimeout> | undefined;

  export function focus() {
    input?.focus();
  }

  function update() {
    clearTimeout(pending);
    notice = '';
    pending = setTimeout(() => {
      results = search(books, query);
      active = 0;
    }, 60);
  }

  function choose(book: Book | undefined) {
    if (!book) {
      if (query.trim().length >= 2) notice = 'Pick a book from the list';
      return;
    }
    if (used.has(book.id)) {
      notice = 'Already used today — try another';
      return;
    }
    onpick(book);
    query = '';
    results = [];
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(results.length - 1, active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(pending);
      if (!results.length && query.trim()) results = search(books, query);
      choose(results[active]);
    } else if (e.key === 'Escape') {
      results = [];
    }
  }
</script>

<div class="book-input">
  {#if results.length}
    <ul class="suggestions" id="book-suggestions" role="listbox" aria-label="Matching books">
      {#each results as b, i (b.id)}
        <li
          id="book-opt-{b.id}"
          role="option"
          aria-selected={i === active}
          class:active={i === active}
          class:used={used.has(b.id)}
          onpointerdown={(e) => { e.preventDefault(); choose(b); }}
          onpointerenter={() => (active = i)}
        >
          <span class="t">{b.title}</span>
          <span class="m">{[b.author, b.year || ''].filter(Boolean).join(' · ')}</span>
        </li>
      {/each}
    </ul>
  {/if}
  <form onsubmit={(e) => e.preventDefault()}>
    <input
      bind:this={input}
      bind:value={query}
      oninput={update}
      {onkeydown}
      placeholder="Start typing a title or author …"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      {disabled}
      role="combobox"
      aria-label="Your answer"
      aria-expanded={results.length > 0}
      aria-controls="book-suggestions"
      aria-activedescendant={results[active] ? `book-opt-${results[active].id}` : undefined}
    />
    <button type="button" class="primary small" disabled={disabled || !results.length} onclick={() => choose(results[active])}>
      Descend
    </button>
  </form>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
</div>

<style>
  .book-input { position: relative; }
  .suggestions {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 8px);
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--paper);
    color: var(--ink);
    border: 3px solid var(--ink);
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
    max-height: 46vh;
    overflow-y: auto;
  }
  li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 7px 10px;
    cursor: pointer;
    border-top: 1px dotted #c9b791;
  }
  li:first-child { border-top: 0; }
  li.active { background: var(--brass); }
  li.used { opacity: 0.45; }
  .t { font-style: italic; font-weight: 600; }
  .m { font-size: 12px; color: #6a5038; }
  li.active .m { color: var(--ink); }
  .notice { margin: 8px 0 0; font-family: var(--font-label); font-size: 11px; color: var(--brass); }
</style>
