/**
 * Caelum — Task Pane Controller
 *
 * Wires up the task pane HTML with the feature modules.
 * Handles Office.js initialization and DOM event binding.
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

function setPreview(text: string): void {
  const preview = $('draft-preview');
  if (!preview) return;

  // Render as formatted text with basic styling
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight the "Subject: ..." line
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
// Event handlers
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
    setPreview(draft);
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
    setPreview(draft);
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
    setPreview(draft);
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

  // Get the raw text from the preview
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
// Initialization
// ---------------------------------------------------------------------------

Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    hideElement('sideload-msg');
    showElement('app-body');

    // Initialize Gemini client
    // In production, retrieve key from a secure backend.
    // For development, use a hardcoded key or environment variable.
    try {
      // The API key should be injected at build time or loaded from settings
      const apiKey = (window as any).__CAELUM_API_KEY__ || '';
      if (apiKey) {
        initGeminiClient(apiKey);
      }
    } catch {
      // Client will be initialized when the user first triggers an action
    }

    // Bind event handlers
    $('btn-generate')?.addEventListener('click', handleGenerate);
    $('btn-regenerate')?.addEventListener('click', handleRegenerate);
    $('btn-refine')?.addEventListener('click', handleRefine);
    $('btn-copy-compose')?.addEventListener('click', handleCopyToCompose);
    $('btn-dismiss-error')?.addEventListener('click', hideError);

    // Allow Enter key in refine input
    $('refine-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        handleRefine();
      }
    });
  }
});
