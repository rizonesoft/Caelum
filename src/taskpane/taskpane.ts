/**
 * Caelum — Task Pane Controller
 *
 * Wires up the task pane HTML with the feature modules.
 * Handles Office.js initialization, DOM event binding, and tab switching.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

/* global document, Office */

import { initGeminiClient } from '../services/gemini';
import {
  generateDraft,
  regenerateDraft,
  refineDraft,
  copyToCompose,
  DraftEmailOptions,
} from '../features/draft-email';
import {
  generateReply,
  regenerateReply,
  refineReply,
  openReply,
  openReplyAll,
  loadEmailContext,
  clearEmailContext,
  DraftReplyOptions,
} from '../features/draft-reply';
import {
  summarizeThread,
  regenerateSummary,
  copyToClipboard,
  SummarizeOptions,
  SummaryStyle,
  SummaryLength,
} from '../features/summarize-thread';

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const $ = (id: string) => document.getElementById(id);

function showElement(id: string): void {
  const el = $(id);
  if (el) el.style.display = '';
}

function hideElement(id: string): void {
  const el = $(id);
  if (el) el.style.display = 'none';
}

function showLoading(message?: string): void {
  const text = $('loading-overlay')?.querySelector('.caelum-loading__text') as HTMLElement;
  if (text && message) text.textContent = message;
  showElement('loading-overlay');
}

function hideLoading(): void {
  hideElement('loading-overlay');
}

function showError(message: string): void {
  const el = $('error-message');
  if (el) el.textContent = message;
  showElement('error-banner');
}

function hideError(): void {
  hideElement('error-banner');
}

function setPreview(elementId: string, text: string): void {
  const preview = $(elementId);
  if (!preview) return;

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const html = lines
    .map((line) => {
      if (line.toLowerCase().startsWith('subject:')) {
        return `<div class="caelum-preview__subject">${line}</div>`;
      }
      if (line.trim() === '') {
        return '<br>';
      }
      return `<div>${line}</div>`;
    })
    .join('');

  preview.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

const TAB_CONFIG: Record<string, string[]> = {
  draft: ['draft-section', 'result-section'],
  reply: ['reply-section', 'reply-result-section'],
  summarize: ['summarize-section', 'summarize-result-section'],
};

function switchTab(tabName: string): void {
  // Update tab buttons
  document.querySelectorAll('.caelum-tab').forEach((tab) => {
    tab.classList.toggle('caelum-tab--active', (tab as HTMLElement).dataset.tab === tabName);
  });

  // Show/hide sections
  for (const [name, sectionIds] of Object.entries(TAB_CONFIG)) {
    const isActive = name === tabName;
    for (const id of sectionIds) {
      const el = $(id);
      if (!el) continue;

      if (isActive) {
        // For form sections, always show. For result sections, only show if they have content.
        if (id.includes('result')) {
          // Keep current display state (only shown after generation)
        } else {
          el.style.display = '';
        }
      } else {
        el.style.display = 'none';
      }
    }
  }

  hideError();

  // Auto-load email context when switching to Reply tab
  if (tabName === 'reply') {
    loadReplyContext();
  }
}

// ---------------------------------------------------------------------------
// Reply context loader
// ---------------------------------------------------------------------------

async function loadReplyContext(): Promise<void> {
  const senderEl = $('reply-sender');
  const subjectEl = $('reply-subject');

  try {
    clearEmailContext();
    const ctx = await loadEmailContext();
    if (senderEl) {
      senderEl.textContent = ctx.sender.name
        ? `${ctx.sender.name} <${ctx.sender.email}>`
        : ctx.sender.email || 'Unknown sender';
    }
    if (subjectEl) {
      subjectEl.textContent = ctx.subject || '(no subject)';
    }
  } catch {
    if (senderEl) senderEl.textContent = 'Could not read email';
    if (subjectEl) subjectEl.textContent = '—';
  }
}

// ---------------------------------------------------------------------------
// Draft Email handlers
// ---------------------------------------------------------------------------

async function handleGenerate(): Promise<void> {
  const instructions = ($('draft-instructions') as HTMLTextAreaElement)?.value || '';
  const tone = ($('draft-tone') as HTMLSelectElement)?.value || 'professional';
  const length = ($('draft-length') as HTMLSelectElement)?.value || 'medium';

  const options: DraftEmailOptions = { instructions, tone, length };

  hideError();
  showLoading('Generating with Gemini...');

  try {
    const draft = await generateDraft(options);
    setPreview('draft-preview', draft);
    showElement('result-section');
  } catch (err: any) {
    showError(err.message || 'Failed to generate draft. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleRegenerate(): Promise<void> {
  hideError();
  showLoading('Regenerating...');

  try {
    const draft = await regenerateDraft();
    setPreview('draft-preview', draft);
  } catch (err: any) {
    showError(err.message || 'Failed to regenerate. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleRefine(): Promise<void> {
  const input = $('refine-input') as HTMLInputElement;
  const refinement = input?.value || '';

  if (!refinement.trim()) {
    showError('Please enter refinement instructions.');
    return;
  }

  hideError();
  showLoading('Refining...');

  try {
    const draft = await refineDraft(refinement);
    setPreview('draft-preview', draft);
    if (input) input.value = '';
  } catch (err: any) {
    showError(err.message || 'Failed to refine. Please try again.');
  } finally {
    hideLoading();
  }
}

function handleCopyToCompose(): void {
  const preview = $('draft-preview');
  if (!preview) return;

  const draft = preview.innerText || preview.textContent || '';
  if (!draft.trim()) {
    showError('No draft to copy. Please generate one first.');
    return;
  }

  try {
    copyToCompose(draft);
  } catch (err: any) {
    showError(err.message || 'Failed to open compose window.');
  }
}

// ---------------------------------------------------------------------------
// Reply handlers
// ---------------------------------------------------------------------------

async function handleGenerateReply(): Promise<void> {
  const instructions = ($('reply-instructions') as HTMLTextAreaElement)?.value || '';
  const tone = ($('reply-tone') as HTMLSelectElement)?.value || 'professional';
  const includeOriginal = ($('reply-include-original') as HTMLInputElement)?.checked ?? true;

  const options: DraftReplyOptions = { instructions, tone, includeOriginal };

  hideError();
  showLoading('Generating reply with Gemini...');

  try {
    const reply = await generateReply(options);
    setPreview('reply-preview', reply);
    showElement('reply-result-section');
  } catch (err: any) {
    showError(err.message || 'Failed to generate reply. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleRegenerateReply(): Promise<void> {
  hideError();
  showLoading('Regenerating reply...');

  try {
    const reply = await regenerateReply();
    setPreview('reply-preview', reply);
  } catch (err: any) {
    showError(err.message || 'Failed to regenerate reply. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleRefineReply(): Promise<void> {
  const input = $('reply-refine-input') as HTMLInputElement;
  const refinement = input?.value || '';

  if (!refinement.trim()) {
    showError('Please enter refinement instructions.');
    return;
  }

  hideError();
  showLoading('Refining reply...');

  try {
    const reply = await refineReply(refinement);
    setPreview('reply-preview', reply);
    if (input) input.value = '';
  } catch (err: any) {
    showError(err.message || 'Failed to refine reply. Please try again.');
  } finally {
    hideLoading();
  }
}

function handleInsertReply(): void {
  const preview = $('reply-preview');
  if (!preview) return;

  const text = preview.innerText || preview.textContent || '';
  if (!text.trim()) {
    showError('No reply to insert. Please generate one first.');
    return;
  }

  try {
    openReply(text);
  } catch (err: any) {
    showError(err.message || 'Failed to open reply window.');
  }
}

function handleInsertReplyAll(): void {
  const preview = $('reply-preview');
  if (!preview) return;

  const text = preview.innerText || preview.textContent || '';
  if (!text.trim()) {
    showError('No reply to insert. Please generate one first.');
    return;
  }

  try {
    openReplyAll(text);
  } catch (err: any) {
    showError(err.message || 'Failed to open Reply All window.');
  }
}

// ---------------------------------------------------------------------------
// Summarize handlers
// ---------------------------------------------------------------------------

function getSelectedStyle(): SummaryStyle {
  const checked = document.querySelector('input[name="summary-style"]:checked') as HTMLInputElement;
  return (checked?.value as SummaryStyle) || 'bullets';
}

async function handleSummarize(): Promise<void> {
  const style = getSelectedStyle();
  const length = ($('summary-length') as HTMLSelectElement)?.value as SummaryLength || 'standard';

  const options: SummarizeOptions = { style, length };

  hideError();
  showLoading('Summarizing with Gemini...');

  try {
    const summary = await summarizeThread(options);
    setPreview('summary-preview', summary);
    showElement('summarize-result-section');
  } catch (err: any) {
    showError(err.message || 'Failed to summarize. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleRegenerateSummary(): Promise<void> {
  hideError();
  showLoading('Regenerating summary...');

  try {
    const summary = await regenerateSummary();
    setPreview('summary-preview', summary);
  } catch (err: any) {
    showError(err.message || 'Failed to regenerate summary. Please try again.');
  } finally {
    hideLoading();
  }
}

async function handleCopySummary(): Promise<void> {
  const preview = $('summary-preview');
  if (!preview) return;

  const text = preview.innerText || preview.textContent || '';
  if (!text.trim()) {
    showError('No summary to copy.');
    return;
  }

  try {
    await copyToClipboard(text);
    // Brief visual feedback
    const btn = $('btn-copy-summary');
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="ms-Icon ms-Icon--CheckMark"></i> Copied!';
      btn.classList.add('caelum-btn--success');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('caelum-btn--success');
      }, 1500);
    }
  } catch (err: any) {
    showError(err.message || 'Failed to copy to clipboard.');
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    hideElement('sideload-msg');
    showElement('app-body');

    // Initialize Gemini client
    try {
      const apiKey = (window as any).__CAELUM_API_KEY__ || '';
      if (apiKey) {
        initGeminiClient(apiKey);
      }
    } catch {
      // Client will be initialized when the user first triggers an action
    }

    // --- Tab switching ---
    document.querySelectorAll('.caelum-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        if (tabName) switchTab(tabName);
      });
    });

    // --- Draft Email ---
    $('btn-generate')?.addEventListener('click', handleGenerate);
    $('btn-regenerate')?.addEventListener('click', handleRegenerate);
    $('btn-refine')?.addEventListener('click', handleRefine);
    $('btn-copy-compose')?.addEventListener('click', handleCopyToCompose);

    $('refine-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') handleRefine();
    });

    // --- Reply ---
    $('btn-generate-reply')?.addEventListener('click', handleGenerateReply);
    $('btn-regenerate-reply')?.addEventListener('click', handleRegenerateReply);
    $('btn-refine-reply')?.addEventListener('click', handleRefineReply);
    $('btn-insert-reply')?.addEventListener('click', handleInsertReply);
    $('btn-insert-reply-all')?.addEventListener('click', handleInsertReplyAll);

    $('reply-refine-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') handleRefineReply();
    });

    // --- Summarize ---
    $('btn-summarize')?.addEventListener('click', handleSummarize);
    $('btn-regenerate-summary')?.addEventListener('click', handleRegenerateSummary);
    $('btn-copy-summary')?.addEventListener('click', handleCopySummary);

    // --- Error banner ---
    $('btn-dismiss-error')?.addEventListener('click', hideError);
  }
});
