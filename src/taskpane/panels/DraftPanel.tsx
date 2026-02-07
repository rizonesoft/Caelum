/**
 * Glide — Draft Email Panel
 *
 * UI for the "Draft a New Email" feature.
 * Collects instructions, tone, and length from the user, then calls
 * the draft-email feature module.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Textarea,
  Select,
  Label,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  ArrowSyncRegular,
  CopyRegular,
  MailEditRegular,
} from '@fluentui/react-icons';
import {
  generateDraft,
  regenerateDraft,
  refineDraft,
  copyToCompose,
  getLastDraft,
} from '../../features/draft-email';
import type { PanelProps } from './types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  heading: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  fieldRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  preview: {
    padding: tokens.spacingVerticalM,
    whiteSpace: 'pre-wrap',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    maxHeight: '320px',
    overflow: 'auto',
  },
  resultActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  refineRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
  },
  refineInput: {
    flex: 1,
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DraftPanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [result, setResult] = useState(getLastDraft);
  const [refinement, setRefinement] = useState('');

  const handleGenerate = useCallback(async () => {
    clearError();
    showLoading('Drafting your email…');
    try {
      const draft = await generateDraft({ instructions, tone, length });
      setResult(draft);
    } catch (err: any) {
      showError(err.message || 'Failed to generate draft.');
    } finally {
      hideLoading();
    }
  }, [instructions, tone, length, showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Regenerating draft…');
    try {
      const draft = await regenerateDraft();
      setResult(draft);
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate draft.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleRefine = useCallback(async () => {
    clearError();
    showLoading('Refining draft…');
    try {
      const draft = await refineDraft(refinement);
      setResult(draft);
      setRefinement('');
    } catch (err: any) {
      showError(err.message || 'Failed to refine draft.');
    } finally {
      hideLoading();
    }
  }, [refinement, showError, clearError, showLoading, hideLoading]);

  const handleCopyToCompose = useCallback(() => {
    clearError();
    try {
      copyToCompose(result);
    } catch (err: any) {
      showError(err.message || 'Failed to open compose window.');
    }
  }, [result, showError, clearError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <MailEditRegular />
        Draft a New Email
      </div>

      <div className={styles.field}>
        <Label className={styles.fieldLabel}>Instructions / bullet points</Label>
        <Textarea
          placeholder="e.g. Thank the client for the meeting, confirm next steps, mention deadline is Friday…"
          value={instructions}
          onChange={(_e, data) => setInstructions(data.value)}
          resize="vertical"
          rows={4}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <Label className={styles.fieldLabel}>Tone</Label>
          <Select value={tone} onChange={(_e, data) => setTone(data.value)}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="persuasive">Persuasive</option>
          </Select>
        </div>
        <div className={styles.field}>
          <Label className={styles.fieldLabel}>Length</Label>
          <Select value={length} onChange={(_e, data) => setLength(data.value)}>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="detailed">Detailed</option>
          </Select>
        </div>
      </div>

      <Button
        appearance="primary"
        icon={<SparkleRegular />}
        onClick={handleGenerate}
        disabled={!instructions.trim()}
      >
        Generate Draft
      </Button>

      {result && (
        <>
          <Card className={styles.preview}>{result}</Card>

          <div className={styles.resultActions}>
            <Button
              appearance="subtle"
              icon={<ArrowSyncRegular />}
              onClick={handleRegenerate}
              size="small"
            >
              Regenerate
            </Button>
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              onClick={handleCopyToCompose}
              size="small"
            >
              Open in Compose
            </Button>
          </div>

          <div className={styles.refineRow}>
            <Textarea
              className={styles.refineInput}
              placeholder="Refine: e.g. make it shorter, add a P.S.…"
              value={refinement}
              onChange={(_e, data) => setRefinement(data.value)}
              resize="vertical"
              rows={2}
            />
            <Button
              appearance="secondary"
              onClick={handleRefine}
              disabled={!refinement.trim()}
              size="small"
            >
              Refine
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
