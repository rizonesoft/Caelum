/**
 * Glide — Reply Panel
 *
 * UI for the "Draft a Reply" feature.
 * Auto-reads the current email context, collects reply instructions,
 * and offers Insert Reply / Reply All actions.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Textarea,
  Select,
  Label,
  Card,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  ArrowSyncRegular,
  ArrowReplyRegular,
  ArrowReplyAllRegular,
} from '@fluentui/react-icons';
import {
  generateReply,
  regenerateReply,
  refineReply,
  loadEmailContext,
  openReply,
  openReplyAll,
  getLastReply,
} from '../../features/draft-reply';
import type { EmailContext } from '../../features/draft-reply';
import type { PanelProps } from './types';

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
  context: {
    padding: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  contextLine: {
    marginBottom: tokens.spacingVerticalXXS,
  },
  field: {
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

export const ReplyPanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const [context, setContext] = useState<EmailContext | null>(null);
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(getLastReply);
  const [refinement, setRefinement] = useState('');

  // Auto-load email context on mount
  useEffect(() => {
    loadEmailContext()
      .then(setContext)
      .catch(() => { /* ignore — context card will just be empty */ });
  }, []);

  const handleGenerate = useCallback(async () => {
    clearError();
    showLoading('Generating reply…');
    try {
      const reply = await generateReply({ instructions, tone, includeOriginal: true });
      setResult(reply);
    } catch (err: any) {
      showError(err.message || 'Failed to generate reply.');
    } finally {
      hideLoading();
    }
  }, [instructions, tone, showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Regenerating reply…');
    try {
      const reply = await regenerateReply();
      setResult(reply);
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate reply.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleRefine = useCallback(async () => {
    clearError();
    showLoading('Refining reply…');
    try {
      const reply = await refineReply(refinement);
      setResult(reply);
      setRefinement('');
    } catch (err: any) {
      showError(err.message || 'Failed to refine reply.');
    } finally {
      hideLoading();
    }
  }, [refinement, showError, clearError, showLoading, hideLoading]);

  const handleInsertReply = useCallback(() => {
    clearError();
    try {
      openReply(result);
    } catch (err: any) {
      showError(err.message);
    }
  }, [result, showError, clearError]);

  const handleInsertReplyAll = useCallback(() => {
    clearError();
    try {
      openReplyAll(result);
    } catch (err: any) {
      showError(err.message);
    }
  }, [result, showError, clearError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <ArrowReplyRegular />
        Reply to Email
      </div>

      {context && (
        <Card className={styles.context}>
          <div className={styles.contextLine}>
            <Text weight="semibold">From:</Text> {context.sender.name}
          </div>
          <div className={styles.contextLine}>
            <Text weight="semibold">Subject:</Text> {context.subject}
          </div>
        </Card>
      )}

      <div className={styles.field}>
        <Label className={styles.fieldLabel}>Reply instructions</Label>
        <Textarea
          placeholder="e.g. Agree to the proposal, suggest meeting next Tuesday at 2 PM…"
          value={instructions}
          onChange={(_e, data) => setInstructions(data.value)}
          resize="vertical"
          rows={4}
        />
      </div>

      <div className={styles.field}>
        <Label className={styles.fieldLabel}>Tone</Label>
        <Select value={tone} onChange={(_e, data) => setTone(data.value)}>
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </Select>
      </div>

      <Button
        appearance="primary"
        icon={<SparkleRegular />}
        onClick={handleGenerate}
        disabled={!instructions.trim()}
      >
        Generate Reply
      </Button>

      {result && (
        <>
          <Card className={styles.preview}>{result}</Card>

          <div className={styles.resultActions}>
            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRegenerate} size="small">
              Regenerate
            </Button>
            <Button appearance="subtle" icon={<ArrowReplyRegular />} onClick={handleInsertReply} size="small">
              Reply
            </Button>
            <Button appearance="subtle" icon={<ArrowReplyAllRegular />} onClick={handleInsertReplyAll} size="small">
              Reply All
            </Button>
          </div>

          <div className={styles.refineRow}>
            <Textarea
              className={styles.refineInput}
              placeholder="Refine: e.g. make it more concise…"
              value={refinement}
              onChange={(_e, data) => setRefinement(data.value)}
              resize="vertical"
              rows={2}
            />
            <Button appearance="secondary" onClick={handleRefine} disabled={!refinement.trim()} size="small">
              Refine
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
